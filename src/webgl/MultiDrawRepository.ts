import { ProcessApproach } from '../foundation/definitions/ProcessApproach';
import { VertexAttribute } from '../foundation/definitions/VertexAttribute';
import type { Mesh } from '../foundation/geometry/Mesh';
import { Primitive } from '../foundation/geometry/Primitive';
import type { Engine } from '../foundation/system/Engine';
import { buildMultiDrawGroups, type MergedMultiDrawGroup, type MultiDrawGroup } from './MultiDraw';

/**
 * Owns the engine-wide multi-draw groups.
 *
 * The groups are rebuilt lazily at the start of a frame. Building them on demand
 * (once per changed Buffer) would rebuild the whole Buffer for every Mesh added
 * during loading, so dirty changes are coalesced into one rebuild per frame.
 */
export class MultiDrawRepository {
  private __engine: Engine;
  private __groups: Map<string, MultiDrawGroup> = new Map();
  private __dirty = true;
  private __version = 0;
  /** Meshes whose vertex data must be refreshed during the next rebuild. */
  private __dirtyMeshes: Set<Mesh> = new Set();
  /** Set when the whole structure changed and every primitive must be refreshed. */
  private __forceFullRebuild = true;

  constructor(engine: Engine) {
    this.__engine = engine;
  }

  /** Incremented on every rebuild; render sort caches can use it for invalidation. */
  get version(): number {
    return this.__version;
  }

  /** Whether the given VAO handle is owned by a current multi-draw group. */
  hasVaoHandle(vaoHandle: number): boolean {
    for (const group of this.__groups.values()) {
      if (group.vertexHandles?.vaoHandle === vaoHandle) {
        return true;
      }
    }
    return false;
  }

  get groups(): ReadonlyMap<string, MultiDrawGroup> {
    return this.__groups;
  }

  /** Marks all groups for a rebuild at the next frame start. */
  markDirty(): void {
    this.__forceFullRebuild = true;
    this.__dirty = true;
  }

  /** Marks the groups that may contain primitives of the given mesh for a rebuild. */
  markDirtyForMesh(mesh: Mesh): void {
    this.__dirtyMeshes.add(mesh);
    this.__dirty = true;
  }

  /**
   * Rebuilds the multi-draw groups if any structural change was recorded.
   * Called at the start of the WebGL render phase, before sort_$render().
   */
  rebuildDirtyGroups(): void {
    if (!this.__dirty) {
      return;
    }
    this.__dirty = false;
    const forceFullRebuild = this.__forceFullRebuild;
    this.__forceFullRebuild = false;

    const engine = this.__engine;
    const repository = engine.webglResourceRepository;
    const enabled =
      engine.config.isMultiDrawEnabled &&
      ProcessApproach.isDataTextureApproach(engine.engineState.currentProcessApproach) &&
      repository.isInstanceSidTextureCapable;

    // Release the previous groups and detach their primitives.
    this.__deleteAllGroups();

    if (!enabled) {
      // The feature is off. The legacy per-primitive path is driven by Mesh._updateVBOAndVAO(),
      // so there is nothing to build here.
      this.__dirtyMeshes.clear();
      this.__version++;
      return;
    }

    // Collect the live primitives and their meshes.
    const primitives: Primitive[] = [];
    const meshes = new Set<Mesh>();
    Primitive.forEachPrimitive(primitive => {
      // The primitive registry is shared by every engine in this realm.
      if (primitive._engine !== engine) {
        return;
      }
      primitives.push(primitive);
      const mesh = primitive.mesh as Mesh | undefined;
      if (mesh != null) {
        meshes.add(mesh);
      }
    });

    // Build the merged geometry from all compatible primitives of each source Buffer.
    const mergedGroups = buildMultiDrawGroups(primitives);
    const groupedPrimitives = new Set<Primitive>();
    for (const merged of mergedGroups) {
      const group = merged.group;
      this.__createGroupResources(merged);
      for (let i = 0; i < group.entries.length; i++) {
        const entry = group.entries[i];
        // Release the primitive's own GPU buffers/VAO before it starts sharing the group's.
        entry.primitive.delete3DAPIVertexData();
        entry.primitive._setMultiDrawGroup(group, i);
        groupedPrimitives.add(entry.primitive);
      }
      this.__groups.set(group.key, group);
    }

    // Ensure the instance data (stable SID slots, and the variation VBO in fallback mode).
    for (const mesh of meshes) {
      mesh.updateVariationVBO();
    }

    // Legacy buffers for the primitives that could not join a group.
    // Only refresh the data of meshes that actually changed; re-uploading every primitive
    // on every rebuild writes much more than necessary (and used to overflow buffers whose
    // BufferView is shared with other accessors).
    for (const primitive of primitives) {
      if (groupedPrimitives.has(primitive)) {
        continue;
      }
      if (primitive.vertexHandles == null) {
        primitive.create3DAPIVertexData();
      } else {
        const mesh = primitive.mesh as Mesh | undefined;
        if (forceFullRebuild || (mesh != null && this.__dirtyMeshes.has(mesh))) {
          primitive.update3DAPIVertexData();
        }
      }
    }

    // Rebuild the VAOs. Group members point at the shared group VAO.
    for (const mesh of meshes) {
      mesh.updateVAO();
    }

    this.__dirtyMeshes.clear();
    this.__version++;
  }

  /** Releases every group and detaches its primitives. */
  invalidateAll(): void {
    this.__deleteAllGroups();
    this.__dirty = true;
  }

  private __deleteAllGroups(): void {
    const repository = this.__engine.webglResourceRepository;
    for (const group of this.__groups.values()) {
      for (const entry of group.entries) {
        // Forget the shared VAO handle before the group VAO is deleted.
        entry.mesh._clearMultiDrawVaoUids();
        if (entry.primitive._multiDrawGroup === group) {
          entry.primitive._clearMultiDrawGroup();
        }
      }
      if (group.vertexHandles != null) {
        repository.deleteVertexDataResources(group.vertexHandles);
        group.vertexHandles = undefined;
      }
      if (group.instanceBaseVboHandle != null) {
        repository.deleteVertexBuffer(group.instanceBaseVboHandle);
        group.instanceBaseVboHandle = undefined;
      }
    }
    this.__groups.clear();
  }

  private __createGroupResources(merged: MergedMultiDrawGroup): void {
    const repository = this.__engine.webglResourceRepository;
    const group = merged.group;

    const vboHandles = merged.attributeBytes.map(bytes => repository.createVertexBufferFromTypedArray(bytes));
    const iboHandle =
      merged.mergedIndices != null ? repository.createIndexBufferFromTypedArray(merged.mergedIndices) : undefined;
    const instanceBaseVboHandle = repository.createVertexBufferFromTypedArray(merged.instanceBases);
    const vaoHandle = repository.createVertexArray()!;

    const attributesFlags: boolean[] = [];
    for (let i = 0; i < VertexAttribute.AttributeTypeNumber; i++) {
      attributesFlags[i] = false;
    }
    for (const attribute of group.attributes) {
      const slot = VertexAttribute.toAttributeSlotFromJoinedString(attribute.semantic);
      attributesFlags[slot] = true;
    }

    group.vertexHandles = {
      vaoHandle,
      iboHandle,
      vboHandles,
      attributesFlags,
      setComplete: false,
    };
    group.instanceBaseVboHandle = instanceBaseVboHandle;
    group.version++;

    repository.setMultiDrawVertexDataToPipeline(group);
  }
}
