import type { Count, Index, PrimitiveUID, TypedArray } from '../../types/CommonTypes';
import type { VertexHandles } from '../../webgl/WebGLResourceRepository';
import { Config } from '../core/Config';
import { MemoryManager } from '../core/MemoryManager';
import { RnObject } from '../core/RnObject';
import { BufferUse } from '../definitions/BufferUse';
import { ComponentType, type ComponentTypeEnum } from '../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../definitions/CompositionType';
import { PrimitiveMode, type PrimitiveModeEnum } from '../definitions/PrimitiveMode';
import { VertexAttribute, type VertexAttributeSemanticsJoinedString } from '../definitions/VertexAttribute';
import { MaterialHelper } from '../helpers/MaterialHelper';
import type { Material } from '../materials/core/Material';
import { AABB } from '../math/AABB';
import type { IVector3 } from '../math/IVector';
import { MutableVector3 } from '../math/MutableVector3';
import { Vector3 } from '../math/Vector3';
import type { Accessor } from '../memory/Accessor';
import { DataUtil } from '../misc/DataUtil';
import { Is } from '../misc/Is';
import { Logger } from '../misc/Logger';
import { None, type Option, Some } from '../misc/Option';
import { RnException } from '../misc/RnException';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import type { Mesh } from './Mesh';
import {
  type IMesh,
  type PrimitiveSortKey,
  type PrimitiveSortKeyLength,
  type PrimitiveSortKeyOffset,
  PrimitiveSortKey_BitLength_Material,
  PrimitiveSortKey_BitLength_PrimitiveType,
  PrimitiveSortKey_BitLength_RenderQueue,
  PrimitiveSortKey_BitLength_TranslucencyType,
  PrimitiveSortKey_BitOffset_Material,
  PrimitiveSortKey_BitOffset_PrimitiveType,
  PrimitiveSortKey_BitOffset_RenderQueue,
  PrimitiveSortKey_BitOffset_TranslucencyType,
  type RaycastResult,
  type RaycastResultEx1,
} from './types/GeometryTypes';

export type Attributes = Map<VertexAttributeSemanticsJoinedString, Accessor>;

export interface IAnyPrimitiveDescriptor {
  /** attach a rhodonite material to this plane(the default material is the classicUberMaterial */
  material?: Material;
}

export interface PrimitiveDescriptor extends IAnyPrimitiveDescriptor {
  attributes: TypedArray[];
  attributeSemantics: VertexAttributeSemanticsJoinedString[];
  primitiveMode: PrimitiveModeEnum;
  indices?: TypedArray;
}

/**
 * Represents a geometric primitive with vertex attributes, materials, and rendering data.
 * A primitive is the basic building block for rendering 3D geometry.
 */
export class Primitive extends RnObject {
  private __mode: PrimitiveModeEnum = PrimitiveMode.Unknown;
  private static __defaultMaterial?: Material;
  private __material: Material;
  private __materialVariants: Map<string, Material> = new Map();
  private __currentVariantName = '';
  public _prevMaterial: WeakRef<Material>;
  private __attributes: Attributes = new Map();
  private __oIndices: Option<Accessor> = new None();
  private static __primitiveCount: Count = 0;
  private __primitiveUid: PrimitiveUID = -1; // start ID from zero
  private __aabb = new AABB();
  private __targets: Array<Attributes> = [];
  private __vertexHandles?: VertexHandles;
  private __mesh?: Mesh;
  private static __primitives: WeakRef<Primitive>[] = [];
  public _sortkey: PrimitiveSortKey = 0;
  public _viewDepth = 0;

  private static __primitiveUidIdxHasMorph: Map<PrimitiveUID, Index> = new Map();
  private static __idxPrimitiveUidHasMorph: Map<Index, WeakRef<Primitive>> = new Map();
  private static __primitiveCountHasMorph = 0;

  private static __tmpVec3_0: MutableVector3 = MutableVector3.zero();

  private __latestPositionAccessorVersion = 0;
  private __positionAccessorVersion = 0;
  private static __variantUpdateCount = 0;

  private __fingerPrint = '';

  /**
   * Creates a new Primitive instance.
   * Initializes the primitive with a default material if none exists.
   */
  constructor() {
    super();

    if (Primitive.__defaultMaterial == null) {
      Primitive.__defaultMaterial = MaterialHelper.createClassicUberMaterial({
        isSkinning: true,
        isLighting: true,
      });
    }

    this.__material = Primitive.__defaultMaterial;
    this._prevMaterial = new WeakRef(Primitive.__defaultMaterial);
  }

  /**
   * Calculates a unique fingerprint string for the primitive based on its properties.
   * The fingerprint includes mode, indices, targets, and attributes configuration.
   * This is used for efficient primitive comparison and caching.
   */
  calcFingerPrint() {
    let str = '';
    str += this.__mode.index;
    if (this.__oIndices.has()) {
      str += this.getIndexBitSize();
    }
    str += this.targets.length;
    str += Primitive.getPrimitiveIdxHasMorph(this.__primitiveUid);
    for (const [semantic, accessor] of this.__attributes) {
      str += semantic;
      str += accessor.componentType.webgpu + accessor.compositionType.webgpu;
      str += accessor.actualByteStride;
    }

    this.__fingerPrint = str;
  }

  /**
   * Gets the cached fingerprint string of the primitive.
   * @returns The fingerprint string used for primitive identification
   */
  _getFingerPrint() {
    return this.__fingerPrint;
  }

  /**
   * Gets the index of a primitive with morph targets by its UID.
   * @param primitiveUid - The unique identifier of the primitive
   * @returns The index if the primitive has morph targets, otherwise undefined
   */
  static getPrimitiveIdxHasMorph(primitiveUid: PrimitiveUID): Index | undefined {
    return this.__primitiveUidIdxHasMorph.get(primitiveUid);
  }

  /**
   * Gets a primitive with morph targets by its index.
   * @param primitiveIdx - The index of the primitive in the morph targets collection
   * @returns The primitive if found and still exists, otherwise undefined
   */
  static getPrimitiveHasMorph(primitiveIdx: Index): Primitive | undefined {
    return this.__idxPrimitiveUidHasMorph.get(primitiveIdx)?.deref();
  }

  /**
   * Determines the bit size required for indices based on the index accessor type.
   * @returns 'uint16' for unsigned short/byte indices, 'uint32' for unsigned int indices
   * @throws Error if no index accessor exists or the component type is unsupported
   */
  getIndexBitSize(): 'uint16' | 'uint32' {
    const indexAccessor = this.__oIndices.unwrapOrUndefined();
    if (indexAccessor == null) {
      throw new Error('indexAccessor is null');
    }
    if (indexAccessor.componentType === ComponentType.UnsignedShort) {
      return 'uint16';
    }
    if (indexAccessor.componentType === ComponentType.UnsignedInt) {
      return 'uint32';
    }
    if (indexAccessor.componentType === ComponentType.UnsignedByte) {
      return 'uint16';
    }
    throw new Error('unknown indexAccessor.componentType');
  }

  /**
   * Gets the vertex handles associated with this primitive for GPU resources.
   * @returns The vertex handles if they exist, otherwise undefined
   */
  get _vertexHandles() {
    return this.__vertexHandles;
  }

  /**
   * Gets the current count of material variant updates across all primitives.
   * This counter is incremented whenever material variants are modified.
   * @returns The number of material variant updates since application start
   */
  static get variantUpdateCount() {
    return this.__variantUpdateCount;
  }

  /**
   * Registers a material variant for this primitive with a specific name.
   * Material variants allow switching between different materials at runtime.
   * @param variantName - The unique name for this material variant
   * @param material - The material to associate with the variant name
   */
  setMaterialVariant(variantName: string, material: Material) {
    this.__materialVariants.set(variantName, material);
    Primitive.__variantUpdateCount++;
  }

  /**
   * Applies a previously registered material variant by its name.
   * Changes the current material to the variant if it exists.
   * @param variantName - The name of the variant to apply
   */
  applyMaterialVariant(variantName: string) {
    const variant = this.__materialVariants.get(variantName);
    if (variant) {
      this.material = variant;
      this.__currentVariantName = variantName;
      Primitive.__variantUpdateCount++;
    }
  }

  /**
   * Gets the name of the currently applied material variant.
   * @returns The name of the active variant, or an empty string if no variant is active
   */
  getCurrentVariantName() {
    for (const [name, material] of this.__materialVariants) {
      if (material === this.__material) {
        return name;
      }
    }
    return '';
  }

  /**
   * Gets all registered variant names for this primitive.
   * @returns An array containing all variant names
   */
  getVariantNames() {
    return Array.from(this.__materialVariants.keys());
  }

  /**
   * Gets the material associated with a specific variant name.
   * @param variantName - The name of the variant to look up
   * @returns The material for the variant, or undefined if the variant doesn't exist
   */
  getVariantMaterial(variantName: string) {
    return this.__materialVariants.get(variantName);
  }

  /**
   * Sets the material for this primitive and updates rendering sort keys.
   * The sort key is updated based on material properties for efficient rendering order.
   * @param mat - The material to assign to this primitive
   */
  set material(mat: Material) {
    this.__material = mat;
    this.setSortKey(PrimitiveSortKey_BitOffset_Material, PrimitiveSortKey_BitLength_Material, mat.materialUID);

    let translucencyType = 0; // opaque
    if (mat.isTranslucentOpaque()) {
      translucencyType = 1; // translucent
    } else if (mat.isBlend()) {
      if (mat.zWriteWhenBlend) {
        translucencyType = 2; // blend with ZWrite
      } else {
        translucencyType = 3; // blend without ZWrite
      }
    }
    this.setSortKey(
      PrimitiveSortKey_BitOffset_TranslucencyType,
      PrimitiveSortKey_BitLength_TranslucencyType,
      translucencyType
    );
    mat._addBelongPrimitive(this);
  }

  /**
   * Gets the current material assigned to this primitive.
   * @returns The material currently in use
   */
  get material() {
    return this.__material;
  }

  /**
   * Updates the sort key by setting a specific bit range with a value.
   * Sort keys are used to optimize rendering order for transparency and material batching.
   * @param offset - The bit offset position where to start writing
   * @param length - The number of bits to write
   * @param value - The value to encode in the specified bit range
   */
  setSortKey(offset: PrimitiveSortKeyOffset, length: PrimitiveSortKeyLength, value: number) {
    const offsetValue = value << offset;
    this._sortkey |= offsetValue;

    // Creates a mask with the specified bit length
    let mask = (1 << length) - 1;
    // Clear designated offset bits
    this._sortkey &= ~(mask << offset);
    // Writes a value to the specified offset
    this._sortkey |= (value & mask) << offset;
  }

  /**
   * Sets the render queue value of this primitive.
   * Higher values draw later within the same translucency bucket.
   * The queue is encoded into the viewport-layer bits of the sort key.
   * @param queue - Value between 0 and 2^3-1 representing relative draw order
   */
  setRenderQueue(queue: number) {
    const maxQueue = (1 << PrimitiveSortKey_BitLength_RenderQueue) - 1;
    const clamped = Math.max(0, Math.min(maxQueue, queue | 0));
    this.setSortKey(PrimitiveSortKey_BitOffset_RenderQueue, PrimitiveSortKey_BitLength_RenderQueue, clamped);
  }

  /**
   * Associates this primitive with a parent mesh.
   * This establishes the hierarchical relationship between mesh and primitive.
   * @param mesh - The mesh that this primitive belongs to
   * @internal
   */
  _belongToMesh(mesh: Mesh) {
    this.__mesh = mesh;
  }

  /**
   * Gets the mesh that this primitive belongs to.
   * @returns The parent mesh if it exists, otherwise undefined
   */
  get mesh(): IMesh | undefined {
    return this.__mesh;
  }

  /**
   * Creates a backup of the current material for later restoration.
   * Used internally for material switching operations.
   * @internal
   */
  _backupMaterial() {
    this._prevMaterial = new WeakRef(this.__material);
  }

  /**
   * Restores the previously backed-up material if it still exists.
   * Used internally for reverting material changes.
   * @internal
   */
  _restoreMaterial() {
    const material = this._prevMaterial.deref();
    if (material != null) {
      this.__material = material;
    }
  }

  /**
   * Retrieves a primitive instance by its unique identifier.
   * @param primitiveUid - The unique identifier of the primitive to find
   * @returns The primitive if found and still exists, otherwise undefined
   */
  static getPrimitive(primitiveUid: PrimitiveUID) {
    return this.__primitives[primitiveUid]?.deref();
  }

  /**
   * Gets the total number of primitives created in the application.
   * @returns The total count of primitives
   */
  static getPrimitiveCount() {
    return this.__primitiveCount;
  }

  /**
   * Notifies the primitive that its position accessor has been updated.
   * This triggers recalculation of bounding boxes and mesh updates.
   * @param accessorVersion - The new version number of the updated accessor
   */
  onAccessorUpdated(accessorVersion: number) {
    this.__positionAccessorVersion = accessorVersion;
    if (this.__mesh != null) {
      this.__mesh._onPrimitivePositionUpdated();
    }
  }

  /**
   * Sets the vertex and index data for this primitive.
   * This is the main method for configuring primitive geometry and rendering properties.
   * @param attributes - Map of vertex attributes with their semantic meanings
   * @param mode - The primitive rendering mode (triangles, triangle strip, etc.)
   * @param material - Optional material to assign (uses default if not provided)
   * @param indicesAccessor - Optional index accessor for indexed rendering
   */
  setData(attributes: Attributes, mode: PrimitiveModeEnum, material?: Material, indicesAccessor?: Accessor) {
    if (indicesAccessor != null) {
      this.__oIndices = new Some(indicesAccessor);
    } else {
      this.__oIndices = new None();
    }
    this.__attributes = attributes;

    const positionAccessor = this.__attributes.get(VertexAttribute.Position.XYZ)!;
    positionAccessor._primitive = new WeakRef(this);

    if (material != null) {
      this.material = material;
    } else {
      this.material = MaterialHelper.createClassicUberMaterial({
        isSkinning: true,
        isLighting: true,
      });
    }
    this.__mode = mode;
    this.setSortKey(PrimitiveSortKey_BitOffset_PrimitiveType, PrimitiveSortKey_BitLength_PrimitiveType, mode.index);

    this.__primitiveUid = Primitive.__primitiveCount++;
    Primitive.__primitives[this.__primitiveUid] = new WeakRef(this);
    this.calcFingerPrint();
  }

  /**
   * Copies vertex data from a descriptor into this primitive.
   * Creates appropriate buffers and accessors for the provided data.
   * @param desc - Descriptor containing arrays of vertex data and configuration
   */
  copyVertexData({ attributes, attributeSemantics, primitiveMode, indices, material }: PrimitiveDescriptor) {
    let sumOfAttributesByteSize = 0;
    const byteAlign = 4;
    attributes.forEach(attribute => {
      sumOfAttributesByteSize += attribute.byteLength;
    });

    let bufferSize = sumOfAttributesByteSize;
    if (indices != null) {
      bufferSize += DataUtil.addPaddingBytes(indices.byteLength, byteAlign);
    }

    const buffer = MemoryManager.getInstance().createBufferOnDemand(bufferSize, this, byteAlign);

    let indicesComponentType: ComponentTypeEnum;
    let indicesAccessor: Accessor;
    if (indices != null) {
      indicesComponentType = ComponentType.fromTypedArray(indices);
      const indicesBufferViewResult = buffer.takeBufferView({
        byteLengthToNeed: indices.byteLength,
        byteStride: 0,
      });
      if (indicesBufferViewResult.isErr()) {
        throw new RnException(indicesBufferViewResult.getRnError());
      }
      const indicesAccessorResult = indicesBufferViewResult.get().takeAccessor({
        compositionType: CompositionType.Scalar,
        componentType: indicesComponentType,
        count: indices.byteLength / indicesComponentType.getSizeInBytes(),
      });
      if (indicesAccessorResult.isErr()) {
        throw new RnException(indicesAccessorResult.getRnError());
      }
      indicesAccessor = indicesAccessorResult.get();
      // copy indices
      for (let i = 0; i < indices!.byteLength / indicesAccessor!.componentSizeInBytes; i++) {
        indicesAccessor!.setScalar(i, indices![i], {});
      }
    }

    const attributesBufferView = buffer
      .takeBufferView({
        byteLengthToNeed: sumOfAttributesByteSize,
        byteStride: 0,
      })
      .unwrapForce();

    const attributeAccessors: Array<Accessor> = [];
    const attributeComponentTypes: Array<ComponentTypeEnum> = [];

    attributes.forEach((typedArray, i) => {
      const compositionType = CompositionType.vectorFrom(VertexAttribute.toVectorComponentN(attributeSemantics[i]));
      attributeComponentTypes[i] = ComponentType.fromTypedArray(attributes[i]);
      const accessor: Accessor = attributesBufferView
        .takeAccessor({
          compositionType,
          componentType: ComponentType.fromTypedArray(attributes[i]),
          count:
            typedArray.byteLength /
            compositionType.getNumberOfComponents() /
            attributeComponentTypes[i].getSizeInBytes(),
        })
        .unwrapForce();
      accessor.copyFromTypedArray(typedArray);
      attributeAccessors.push(accessor);
    });

    const attributeMap: Map<VertexAttributeSemanticsJoinedString, Accessor> = new Map();
    for (let i = 0; i < attributeSemantics.length; i++) {
      const attributeSemantic = attributeSemantics[i];
      attributeMap.set(attributeSemantic, attributeAccessors[i]);
    }

    this.setData(attributeMap, primitiveMode, material, indicesAccessor!);
  }

  /**
   * Creates a new primitive from a descriptor containing vertex data.
   * This is a factory method that creates and initializes a primitive in one step.
   * @param desc - The primitive descriptor with vertex data and configuration
   * @returns A new primitive instance with the specified data
   */
  static createPrimitive(desc: PrimitiveDescriptor) {
    const primitive = new Primitive();
    primitive.copyVertexData(desc);
    return primitive;
  }

  /**
   * Gets the index accessor for this primitive.
   * @returns The index accessor if indices are used, otherwise undefined
   */
  get indicesAccessor(): Accessor | undefined {
    return this.__oIndices.unwrapOrUndefined();
  }

  /**
   * Gets the vertex count for indexed primitives.
   * For indexed rendering, this returns the number of indices.
   * @returns The number of indices if indexed, otherwise the vertex count
   */
  getVertexCountAsIndicesBased() {
    if (this.indicesAccessor) {
      return this.indicesAccessor.elementCount;
    }
    return this.getVertexCountAsVerticesBased();
  }

  /**
   * Gets the vertex count based on vertex buffer data.
   * @returns The number of vertices in the vertex buffers
   */
  getVertexCountAsVerticesBased(): Count {
    for (const accessor of this.__attributes.values()) {
      return accessor.elementCount;
    }
    return 0;
  }

  /**
   * Calculates the triangle count for indexed primitives.
   * The count depends on the primitive mode (triangles, triangle strip, etc.).
   * @returns The number of triangles that will be rendered with indices
   */
  getTriangleCountAsIndicesBased(): Count {
    if (this.indicesAccessor) {
      switch (this.__mode) {
        case PrimitiveMode.Triangles:
          return this.indicesAccessor.elementCount / 3;
        case PrimitiveMode.TriangleStrip:
          return this.indicesAccessor.elementCount - 2;
        case PrimitiveMode.TriangleFan:
          return this.indicesAccessor.elementCount - 2;
        default:
          return 0;
      }
    }
    return this.getTriangleCountAsVerticesBased();
  }

  /**
   * Calculates the triangle count for non-indexed primitives.
   * The count depends on the primitive mode and vertex count.
   * @returns The number of triangles that will be rendered from vertices
   */
  getTriangleCountAsVerticesBased(): Count {
    for (const accessor of this.__attributes.values()) {
      switch (this.__mode) {
        case PrimitiveMode.Triangles:
          return accessor.elementCount / 3;
        case PrimitiveMode.TriangleStrip:
          return accessor.elementCount - 2;
        case PrimitiveMode.TriangleFan:
          return accessor.elementCount - 2;
        default:
          return 0;
      }
    }
    return 0;
  }

  /**
   * Checks if this primitive uses index-based rendering.
   * @returns True if the primitive has an index buffer, false otherwise
   */
  hasIndices() {
    return this.__oIndices.has();
  }

  /**
   * Gets all vertex attribute accessors for this primitive.
   * @returns An array of all attribute accessors
   */
  get attributeAccessors(): Array<Accessor> {
    const accessors: Array<Accessor> = [];
    this.__attributes.forEach(accessor => {
      accessors.push(accessor);
    });
    return accessors;
  }

  /**
   * Gets a specific vertex attribute by its semantic meaning.
   * @param semantic - The semantic identifier for the attribute
   * @returns The accessor for the attribute, or undefined if not found
   */
  getAttribute(semantic: VertexAttributeSemanticsJoinedString) {
    return this.__attributes.get(semantic);
  }

  /**
   * Gets all vertex attribute semantic identifiers.
   * @returns An array of all attribute semantic strings
   */
  get attributeSemantics(): Array<VertexAttributeSemanticsJoinedString> {
    const semantics: Array<VertexAttributeSemanticsJoinedString> = [];
    this.__attributes.forEach((_accessor, semantic) => {
      semantics.push(semantic);
    });
    return semantics;
  }

  /**
   * Gets an iterator for all attribute entries (semantic, accessor pairs).
   * @returns An iterator over attribute map entries
   */
  get attributeEntries() {
    return this.__attributes.entries();
  }

  /**
   * Gets the composition types of all vertex attributes.
   * @returns An array of composition types (Vec2, Vec3, Vec4, Scalar, etc.)
   */
  get attributeCompositionTypes(): Array<CompositionTypeEnum> {
    const types: Array<CompositionTypeEnum> = [];
    this.__attributes.forEach(accessor => {
      types.push(accessor.compositionType);
    });

    return types;
  }

  /**
   * Gets the component types of all vertex attributes.
   * @returns An array of component types (Float, UnsignedByte, etc.)
   */
  get attributeComponentTypes(): Array<ComponentTypeEnum> {
    const types: Array<ComponentTypeEnum> = [];
    this.__attributes.forEach(accessor => {
      types.push(accessor.componentType);
    });

    return types;
  }

  /**
   * Gets the primitive rendering mode.
   * @returns The primitive mode enum (Triangles, TriangleStrip, etc.)
   */
  get primitiveMode(): PrimitiveModeEnum {
    return this.__mode;
  }

  /**
   * Gets the unique identifier for this primitive.
   * @returns The primitive's UID
   */
  get primitiveUid(): PrimitiveUID {
    return this.__primitiveUid;
  }

  /**
   * Gets the version number of the position accessor.
   * Used to track when position data has been updated.
   * @returns The current position accessor version
   */
  get positionAccessorVersion(): number {
    return this.__positionAccessorVersion;
  }

  /**
   * Gets the axis-aligned bounding box for this primitive.
   * The AABB is calculated from position data and cached until positions change.
   * @returns The bounding box containing all vertices
   */
  get AABB() {
    if (this.__aabb.isVanilla() || this.positionAccessorVersion !== this.__latestPositionAccessorVersion) {
      const positionAccessor = this.__attributes.get(VertexAttribute.Position.XYZ)!;

      const min = positionAccessor.min as number[];
      this.__aabb.minPoint = Primitive.__tmpVec3_0.setComponents(min[0], min[1], min[2]);
      const max = positionAccessor.max as number[];
      this.__aabb.maxPoint = Primitive.__tmpVec3_0.setComponents(max[0], max[1], max[2]);
      this.__latestPositionAccessorVersion = positionAccessor.version;
    }

    return this.__aabb;
  }

  /**
   * Sets or updates a vertex attribute for this primitive.
   * @param accessor - The accessor containing the attribute data
   * @param vertexSemantic - The semantic meaning of the attribute
   */
  setVertexAttribute(accessor: Accessor, vertexSemantic: VertexAttributeSemanticsJoinedString) {
    this.__attributes.set(vertexSemantic, accessor);
    this.calcFingerPrint();
  }

  /**
   * Removes the index buffer from this primitive, converting it to non-indexed rendering.
   */
  removeIndices() {
    this.__oIndices = new None();
    this.calcFingerPrint();
  }

  /**
   * Sets the index buffer for this primitive, enabling indexed rendering.
   * @param accessor - The accessor containing index data
   */
  setIndices(accessor: Accessor) {
    this.__oIndices = new Some(accessor);
    this.calcFingerPrint();
  }

  /**
   * Sets blend shape (morph) targets for this primitive.
   * Blend shapes allow vertex animation by interpolating between target positions.
   * @param targets - Array of attribute maps representing morph targets
   */
  setBlendShapeTargets(targets: Array<Attributes>) {
    if (Primitive.__primitiveUidIdxHasMorph.size > Config.maxMorphPrimitiveNumberInWebGPU) {
      Logger.error(
        'Primitive.__primitiveUidsHasMorph.size exceeds the Config.maxMorphPrimitiveNumberInWebGPU. Please increase the Config.maxMorphPrimitiveNumberInWebGPU.'
      );
    } else {
      Primitive.__idxPrimitiveUidHasMorph.set(Primitive.__primitiveCountHasMorph, new WeakRef(this));
      Primitive.__primitiveUidIdxHasMorph.set(this.__primitiveUid, Primitive.__primitiveCountHasMorph++);
    }

    this.__targets = targets;
    this.calcFingerPrint();
  }

  /**
   * Gets a copy of the blend shape targets for this primitive.
   * @returns A copy of the morph target array
   */
  getBlendShapeTargets() {
    return this.__targets.concat();
  }

  /**
   * Gets the blend shape targets array.
   * @returns The array of morph target attributes
   */
  get targets(): Array<Attributes> {
    return this.__targets;
  }

  /**
   * Checks if this primitive uses blending (transparency) for rendering.
   * @returns True if the material has blending enabled, false otherwise
   */
  isBlend() {
    if (this.material == null || !this.material.isBlend()) {
      return false;
    }
    return true;
  }

  /**
   * Checks if this primitive is opaque (not transparent).
   * @returns True if the primitive is opaque, false if it uses blending
   */
  isOpaque() {
    return !this.isBlend();
  }

  /**
   * Creates GPU vertex and index buffers for this primitive.
   * This prepares the primitive for rendering by uploading data to the GPU.
   * @returns True if buffers were created, false if they already exist
   */
  create3DAPIVertexData() {
    if (this.__vertexHandles != null) {
      return false;
    }
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    this.__vertexHandles = cgApiResourceRepository.createVertexBufferAndIndexBuffer(this);

    return true;
  }

  /**
   * Updates the GPU vertex and index buffers with current data.
   * Used when vertex data has been modified and needs to be re-uploaded.
   * @returns True if buffers were updated, false if no buffers exist
   */
  update3DAPIVertexData() {
    const vertexHandles = this.__vertexHandles as VertexHandles;
    if (Is.not.exist(this.__vertexHandles)) {
      return false;
    }

    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    cgApiResourceRepository.updateVertexBufferAndIndexBuffer(this, vertexHandles);

    return true;
  }

  /**
   * Deletes the GPU vertex and index buffers for this primitive.
   * Frees GPU memory when the primitive is no longer needed.
   * @returns True if buffers were deleted, false if no buffers exist
   */
  delete3DAPIVertexData() {
    if (this.__vertexHandles == null) {
      return false;
    }
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    cgApiResourceRepository.deleteVertexDataResources(this.__vertexHandles);
    this.__vertexHandles = undefined;

    return true;
  }

  /**
   * Gets the GPU resource handles for this primitive.
   * @returns The vertex handles for GPU resources, or undefined if not created
   */
  get vertexHandles() {
    return this.__vertexHandles;
  }

  /**
   * Converts this indexed primitive to non-indexed geometry.
   * Expands vertex data by duplicating vertices according to indices.
   * This can increase memory usage but simplifies some rendering operations.
   */
  convertToUnindexedGeometry() {
    const indexAccessor = this.indicesAccessor;
    if (indexAccessor == null) {
      return;
    }

    const indices = indexAccessor.getTypedArray();

    let bufferSize = 0;
    for (let i = 0; i < this.attributeAccessors.length; i++) {
      const accessor = this.attributeAccessors[i];
      const compositionType = accessor.compositionType;
      let compositionN = 0;
      if (compositionType.index === CompositionType.Vec4.index) {
        compositionN = 4;
      } else if (compositionType.index === CompositionType.Vec3.index) {
        compositionN = 3;
      } else if (compositionType.index === CompositionType.Vec2.index) {
        compositionN = 2;
      } else if (compositionType.index === CompositionType.Scalar.index) {
        compositionN = 1;
      }
      bufferSize += indices.length * compositionN * 4 /* bytes */;
    }

    const buffer = MemoryManager.getInstance().createBufferOnDemand(bufferSize, this, 4 /* bytes */);
    const bufferView = buffer
      .takeBufferView({
        byteLengthToNeed: bufferSize,
        byteStride: 0,
      })
      .unwrapForce();

    for (const [semantic, accessorOld] of this.__attributes) {
      const compositionType = accessorOld.compositionType;

      const accessorNew: Accessor = bufferView
        .takeAccessor({
          compositionType,
          componentType: accessorOld.componentType,
          count: indices.length,
        })
        .unwrapForce();

      for (let i = 0; i < indices.length; i++) {
        const idx = indices[i];
        if (compositionType.index === CompositionType.Vec4.index) {
          const vec4 = accessorOld.getVec4(idx, {});
          accessorNew.setVec4(i, vec4.x, vec4.y, vec4.z, vec4.w, {});
        } else if (compositionType.index === CompositionType.Vec3.index) {
          const vec3 = accessorOld.getVec3(idx, {});
          accessorNew.setVec3(i, vec3.x, vec3.y, vec3.z, {});
        } else if (compositionType.index === CompositionType.Vec2.index) {
          const vec2 = accessorOld.getVec2(idx, {});
          accessorNew.setVec2(i, vec2.x, vec2.y, {});
        } else if (compositionType.index === CompositionType.Scalar.index) {
          const scalar = accessorOld.getScalar(idx, {});
          accessorNew.setScalar(i, scalar, {});
        }
      }

      this.setVertexAttribute(accessorNew, semantic);
    }

    this.removeIndices();
  }

  /**
   * Performs ray casting against this primitive's geometry.
   * Tests intersection between a ray and the triangles of this primitive.
   * @param origVec3 - The origin point of the ray
   * @param dirVec3 - The direction vector of the ray (should be normalized)
   * @param isFrontFacePickable - Whether front-facing triangles can be hit
   * @param isBackFacePickable - Whether back-facing triangles can be hit
   * @param dotThreshold - Threshold for determining front/back face orientation
   * @param hasFaceNormal - Whether to use face normals for culling
   * @returns Ray casting result with intersection data or failure indication
   */
  castRay(
    origVec3: IVector3,
    dirVec3: IVector3,
    isFrontFacePickable: boolean,
    isBackFacePickable: boolean,
    dotThreshold: number,
    hasFaceNormal: boolean
  ): RaycastResultEx1 {
    let currentShortestT = Number.MAX_VALUE;
    let incrementNum = 3; // gl.TRIANGLES
    if (this.__mode === PrimitiveMode.TriangleStrip) {
      // gl.TRIANGLE_STRIP
      incrementNum = 1;
    } else if (this.__mode === PrimitiveMode.Points) {
      return {
        result: false,
      };
    }

    let _hitPos0IndexBase = 0;
    let _hitPos1IndexBase = 0;
    let _hitPos2IndexBase = 0;
    let u = 0;
    let v = 0;
    if (this.hasIndices()) {
      const indices = this.__oIndices.unwrapForce();
      for (let i = 0; i < indices.elementCount - 2; i++) {
        const j = i * incrementNum;
        if (j + 2 > indices.elementCount - 1) {
          // gl.TRIANGLES
          break;
        }
        const pos0IndexBase = indices.getScalar(j, {});
        const pos1IndexBase = indices.getScalar(j + 1, {});
        const pos2IndexBase = indices.getScalar(j + 2, {});
        const result = this.__castRayInnerTomasMoller(
          origVec3,
          dirVec3,
          i,
          pos0IndexBase,
          pos1IndexBase,
          pos2IndexBase,
          isFrontFacePickable,
          isBackFacePickable,
          dotThreshold,
          hasFaceNormal
        );
        if (Is.false(result) || Is.not.exist(result.data)) {
        } else {
          if (result.data.t < currentShortestT) {
            currentShortestT = result.data.t;
            u = result.data.u;
            v = result.data.v;
            _hitPos0IndexBase = pos0IndexBase;
            _hitPos1IndexBase = pos1IndexBase;
            _hitPos2IndexBase = pos2IndexBase;
          }
        }
      }
    } else {
      let elementCount = 0;
      for (const accessor of this.__attributes.values()) {
        elementCount = accessor.elementCount;
        break;
      }

      for (let i = 0; i < elementCount; i += incrementNum) {
        const pos0IndexBase = i;
        const pos1IndexBase = i + 1;
        const pos2IndexBase = i + 2;
        const result = this.__castRayInnerTomasMoller(
          origVec3,
          dirVec3,
          i,
          pos0IndexBase,
          pos1IndexBase,
          pos2IndexBase,
          isFrontFacePickable,
          isBackFacePickable,
          dotThreshold,
          hasFaceNormal
        );
        if (result.result && Is.defined(result.data)) {
          const t = result.data.t;
          if (t < currentShortestT) {
            currentShortestT = t;
            u = result.data.u;
            v = result.data.v;
            _hitPos0IndexBase = pos0IndexBase;
            _hitPos1IndexBase = pos1IndexBase;
            _hitPos2IndexBase = pos2IndexBase;
          }
        }
      }
    }

    if (currentShortestT === Number.MAX_VALUE) {
      return {
        result: false,
      };
    }
    const currentShortestIntersectedPosVec3 = Vector3.fromCopy3(
      dirVec3.x * currentShortestT + origVec3.x,
      dirVec3.y * currentShortestT + origVec3.y,
      dirVec3.z * currentShortestT + origVec3.z
    );
    return {
      result: true,
      data: {
        t: currentShortestT,
        u,
        v,
        position: currentShortestIntersectedPosVec3,
      },
    };
  }

  /**
   * Internal ray-triangle intersection test using Tomas Möller algorithm.
   * @param origVec3 - Ray origin
   * @param dirVec3 - Ray direction
   * @param i - Triangle index
   * @param pos0IndexBase - First vertex index
   * @param pos1IndexBase - Second vertex index
   * @param pos2IndexBase - Third vertex index
   * @param isFrontFacePickable - Whether front faces are pickable
   * @param isBackFacePickable - Whether back faces are pickable
   * @param dotThreshold - Normal dot product threshold
   * @param hasFaceNormal - Whether to use face normals
   * @returns Intersection result with barycentric coordinates
   * @private
   */
  private __castRayInnerTomasMoller(
    origVec3: IVector3,
    dirVec3: IVector3,
    i: Index,
    pos0IndexBase: Index,
    pos1IndexBase: Index,
    pos2IndexBase: Index,
    isFrontFacePickable: boolean,
    isBackFacePickable: boolean,
    dotThreshold: number,
    hasFaceNormal: boolean
  ): RaycastResult {
    if (hasFaceNormal) {
      const normalAccessor = this.__attributes.get(VertexAttribute.Normal.XYZ);
      if (normalAccessor) {
        const normal = normalAccessor.getVec3(i, {});
        if (normal.dot(dirVec3) < dotThreshold && !isFrontFacePickable) {
          return {
            result: false,
          };
        }
        if (normal.dot(dirVec3) > -dotThreshold && !isBackFacePickable) {
          return {
            result: false,
          };
        }
      }
    }

    const positionAccessor = this.__attributes.get(VertexAttribute.Position.XYZ)!;
    const pos0Vec3 = positionAccessor.getVec3(pos0IndexBase, {});
    const pos1Vec3 = positionAccessor.getVec3(pos1IndexBase, {});
    const pos2Vec3 = positionAccessor.getVec3(pos2IndexBase, {});

    const e1 = MutableVector3.zero();
    const e2 = MutableVector3.zero();
    const pvec = MutableVector3.zero();
    const tvec = MutableVector3.zero();
    const qvec = MutableVector3.zero();

    let u = 0;
    let v = 0;

    MutableVector3.subtractTo(pos1Vec3, pos0Vec3, e1);
    MutableVector3.subtractTo(pos2Vec3, pos0Vec3, e2);

    MutableVector3.crossTo(dirVec3, e2, pvec);
    const det = Vector3.dot(e1, pvec);

    if (det > 0.0001) {
      MutableVector3.subtractTo(origVec3, pos0Vec3, tvec);
      u = Vector3.dot(tvec, pvec);
      if (u < 0.0 || u > det) {
        return {
          result: false,
        };
      }
      MutableVector3.crossTo(tvec, e1, qvec);
      v = Vector3.dot(dirVec3, qvec);
      if (v < 0.0 || u + v > det) {
        return {
          result: false,
        };
      }
    } else if (det < -0.0001) {
      MutableVector3.subtractTo(origVec3, pos0Vec3, tvec);
      u = Vector3.dot(tvec, pvec);
      if (u > 0.0 || u < det) {
        return {
          result: false,
        };
      }
      MutableVector3.crossTo(tvec, e1, qvec);
      v = Vector3.dot(dirVec3, qvec);
      if (v > 0.0 || u + v < det) {
        return {
          result: false,
        };
      }
    } else {
      return {
        result: false,
      };
    }

    const inv_det = 1.0 / det;

    let t = Vector3.dot(e2, qvec);
    t *= inv_det;
    u *= inv_det;
    v *= inv_det;

    return {
      result: true,
      data: {
        t,
        u,
        v,
      },
    };
  }

  /**
   * Calculates the normal vector from UV coordinates
   * @param pos0IndexBase Index of first position
   * @param pos1IndexBase Index of second position
   * @param pos2IndexBase Index of third position
   * @param u U coordinate
   * @param v V coordinate
   * @returns The calculated normal vector
   */
  private __calcNormalFromUV(
    pos0IndexBase: Index,
    pos1IndexBase: Index,
    pos2IndexBase: Index,
    u: number,
    v: number
  ): IVector3 {
    const fDat = 1.0 - u - v;

    const positionAccessor = this.__attributes.get(VertexAttribute.Position.XYZ)!;
    const pos0Vec3 = positionAccessor.getVec3(pos0IndexBase, {});
    const pos1Vec3 = positionAccessor.getVec3(pos1IndexBase, {});
    const pos2Vec3 = positionAccessor.getVec3(pos2IndexBase, {});

    const pos0 = Vector3.multiply(pos0Vec3, fDat);
    const pos1 = Vector3.multiply(pos1Vec3, u);
    const pos2 = Vector3.multiply(pos2Vec3, v);
    const intersectedPosVec3 = MutableVector3.zero().add(pos0).add(pos1).add(pos2);
    return intersectedPosVec3;
  }
}
