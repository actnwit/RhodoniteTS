// src/foundation/geometry/Mesh.ts
import { BufferUse } from "../definitions/BufferUse.js";
import { ComponentType } from "../definitions/ComponentType.js";
import { CompositionType } from "../definitions/CompositionType.js";
import { PrimitiveMode } from "../definitions/PrimitiveMode.js";
import { ProcessApproach } from "../definitions/ProcessApproach.js";
import { ProcessStage } from "../definitions/ProcessStage.js";
import { VertexAttribute } from "../definitions/VertexAttribute.js";
import { AABB } from "../math/AABB.js";
import { MutableVector3 } from "../math/MutableVector3.js";
import { Vector3 } from "../math/Vector3.js";
import { Is } from "../misc/Is.js";
import { Logger } from "../misc/Logger.js";
import { CGAPIResourceRepository } from "../renderer/CGAPIResourceRepository.js";
import {
  isBlendWithoutZWrite,
  isBlendWithZWrite,
  isOpaque,
  isTranslucent
} from "./types/GeometryTypes.js";
var _Mesh = class _Mesh {
  /**
   * Constructor
   */
  constructor(engine) {
    this.__primitives = [];
    this.__opaquePrimitives = [];
    this.__translucentPrimitives = [];
    this.__blendWithZWritePrimitives = [];
    this.__blendWithoutZWritePrimitives = [];
    this.__morphPrimitives = [];
    this.__localAABB = new AABB();
    this.__vaoUids = [];
    /** Indices of __vaoUids that refer to a MultiDrawRepository-owned group VAO. */
    this.__multiDrawVaoIndices = /* @__PURE__ */ new Set();
    this.__variationVBOUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    /** Whether the mesh has instances (see `_isGpuCullable`). */
    this.__hasInstances = false;
    /** Whether an instance has a skeletal component (see `_needsComputeDeformation`). */
    this.__hasSkeletalInstance = false;
    /** Whether an instance has a blend shape component (see `_needsComputeDeformation`). */
    this.__hasBlendShapeInstance = false;
    /** Cache of `_isComputeDeformable`, valid for the primitive count, position update count and skeletal flag below. */
    this.__isComputeDeformable = false;
    this.__computeDeformablePrimitiveCount = -1;
    this.__computeDeformablePositionUpdateCount = -1;
    this.__computeDeformableHasSkeletal = false;
    /** Number of the instances packed at the front of the variation VBO. */
    this.__variationVBOInstanceCount = 0;
    this.__variationVBOCullTick = -1;
    /** Stable slot range in the engine-wide instance SID table (WebGL multi-draw). */
    this.__instanceSidBase = -1;
    this.__instanceSidCount = 0;
    /** Id of the last culling pass that visited this mesh in the per-pass instance prepass. */
    this.__remapPrepassId = -1;
    this.__latestPrimitivePositionAccessorVersionForAABB = 0;
    this.__latestPrimitivePositionAccessorVersionForSetUpDone = 0;
    this.__belongToEntities = [];
    /**
     * Specification of when calculate the tangent of a vertex to apply Normal texture (for pbr/MToon shader)
     * 0: Not calculate tangent (not apply normal texture)
     * 1: (default) Use original tangent in a vertex, if a vertex has tangent attribute. If a vertex does not have it, calculate a tangent in a shader.
     * 2: Use original tangent in a vertex, if a vertex has tangent attribute. If a vertex does not have it, precalculate a tangent in the javascript.
     * 3: Calculate all tangent in a shader.
     * 4: Precalculate all tangent in the javascript
     */
    this.tangentCalculationMode = 1;
    this.__hasFaceNormal = false;
    this.__primitivePositionUpdateCount = 0;
    this.__engine = engine;
    this.__meshUID = ++_Mesh.__mesh_uid_count;
  }
  /**
   * A version incremented whenever the primitive positions of any mesh are updated (see
   * `primitivePositionUpdateCount`), so that caches of the local bounding boxes can be revalidated cheaply.
   * @internal
   */
  static get _primitivePositionUpdateVersion() {
    return _Mesh.__primitivePositionUpdateVersion;
  }
  ///
  ///
  /// Public Members
  ///
  ///
  /**
   * Gets the VAO (Vertex Array Object) UID for the specified index.
   * @param index - The index of the primitive
   * @returns The VAO resource handle
   */
  getVaoUids(index) {
    return this.__vaoUids[index];
  }
  /**
   * Gets the VAO (Vertex Array Object) UID for the specified primitive UID.
   * @param primitiveUid - The UID of the primitive
   * @returns The VAO resource handle
   */
  getVaoUidsByPrimitiveUid(primitiveUid) {
    const index = this.__primitives.findIndex((primitive) => primitive.primitiveUid === primitiveUid);
    return this.__vaoUids[index];
  }
  /**
   * Gets the inner mesh entities that belong to this mesh.
   * @returns Array of mesh entities
   */
  get meshEntitiesInner() {
    return this.__belongToEntities;
  }
  /**
   * Registers this mesh as belonging to a mesh component.
   * @param meshComponent - The mesh component that owns this mesh
   * @internal
   */
  _belongToMeshComponent(meshComponent) {
    this.__belongToEntities.push(meshComponent.entity);
    if (this.__isInstanceSidTextureMode()) {
      this.__engine.webglResourceRepository.getMultiDrawRepository(this.__engine).markDirtyForMesh(this);
    }
  }
  /**
   * Removes the association with a mesh component.
   * @param meshComponent - The mesh component to remove
   * @internal
   */
  _removeMeshComponent(meshComponent) {
    const entity = meshComponent.entity;
    this.__belongToEntities = this.__belongToEntities.filter((belongToEntity) => belongToEntity !== entity);
    if (this.__isInstanceSidTextureMode()) {
      this.__engine.webglResourceRepository.getMultiDrawRepository(this.__engine).markDirtyForMesh(this);
    }
  }
  /**
   * Adds primitive.
   * @param primitive The primitive object.
   */
  addPrimitive(primitive) {
    primitive._belongToMesh(this);
    if (this.__isInstanceSidTextureMode()) {
      this.__engine.webglResourceRepository.getMultiDrawRepository(this.__engine).markDirtyForMesh(this);
    }
    if (isOpaque(primitive)) {
      this.__opaquePrimitives.push(primitive);
    } else if (isTranslucent(primitive)) {
      this.__translucentPrimitives.push(primitive);
    } else if (isBlendWithZWrite(primitive)) {
      this.__blendWithZWritePrimitives.push(primitive);
    } else if (isBlendWithoutZWrite(primitive)) {
      this.__blendWithoutZWritePrimitives.push(primitive);
    }
    this.__setPrimitives(
      this.__opaquePrimitives.concat(this.__translucentPrimitives).concat(this.__blendWithZWritePrimitives).concat(this.__blendWithoutZWritePrimitives)
    );
  }
  /**
   * Sets the array of primitives for this mesh.
   * @param primitives - Array of primitives to set
   * @private
   */
  __setPrimitives(primitives) {
    this.__primitives = primitives;
  }
  /**
   * Checks if this mesh has opaque primitives.
   * @returns True if opaque primitives exist, false otherwise
   */
  isExistOpaque() {
    return this.__opaquePrimitives.length > 0;
  }
  /**
   * Checks if this mesh has translucent primitives.
   * @returns True if translucent primitives exist, false otherwise
   */
  isExistTranslucent() {
    return this.__translucentPrimitives.length > 0;
  }
  /**
   * Checks if this mesh has blend-with-z-write primitives.
   * @returns True if blend-with-z-write primitives exist, false otherwise
   */
  isExistBlendWithZWrite() {
    return this.__blendWithZWritePrimitives.length > 0;
  }
  /**
   * Checks if this mesh has blend-without-z-write primitives.
   * @returns True if blend-without-z-write primitives exist, false otherwise
   */
  isExistBlendWithoutZWrite() {
    return this.__blendWithoutZWritePrimitives.length > 0;
  }
  /**
   * Gets the primitive at the specified index.
   * @param i - The index of the primitive to retrieve
   * @returns The primitive at the specified index
   */
  getPrimitiveAt(i) {
    return this.__primitives[i];
  }
  /**
   * Gets the total number of primitives in this mesh.
   * @returns The number of primitives
   */
  getPrimitiveNumber() {
    return this.__primitives.length;
  }
  /**
   * Whether the WebGL instance SID texture path (multi-draw) is active for this mesh.
   */
  __isInstanceSidTextureMode() {
    if (!this.__engine.config.isMultiDrawEnabled) {
      return false;
    }
    if (this.__engine.engineState.currentProcessApproach !== ProcessApproach.WebGL2) {
      return false;
    }
    const webglResourceRepository = this.__engine.webglResourceRepository;
    const glw = webglResourceRepository.currentWebGLContextWrapper;
    return glw != null && glw.webgl2ExtMD != null && webglResourceRepository.instanceSidTable.isSupported;
  }
  /**
   * Ensures that this mesh owns a contiguous range of stable instance slots in the
   * engine-wide instance SID table and writes the instance identity records.
   * @returns The first stable slot index (instanceBase).
   * @internal
   */
  _ensureInstanceSidBase() {
    const count = this.__belongToEntities.length;
    const table = this.__engine.webglResourceRepository.instanceSidTable;
    let base = this.__instanceSidBase;
    if (base < 0 || this.__instanceSidCount !== count) {
      if (base >= 0) {
        table.free(base, this.__instanceSidCount);
      }
      base = table.allocate(count);
      this.__instanceSidBase = base;
      this.__instanceSidCount = count;
      table.writeIdentityRemap(base, count);
    }
    const INVALID_ID = 4294967295;
    for (let i = 0; i < count; i++) {
      const entity = this.__belongToEntities[i];
      const componentSID = entity.getSceneGraph().componentSID;
      const skeletal = entity.tryToGetSkeletal();
      const blendShape = entity.tryToGetBlendShape();
      table.setRecord(
        base + i,
        componentSID,
        skeletal != null ? skeletal.componentSID : INVALID_ID,
        blendShape != null ? blendShape.componentSID : INVALID_ID
      );
    }
    return base;
  }
  /**
   * Gets the first stable instance slot of this mesh (WebGL multi-draw).
   * @internal
   */
  get _instanceSidBase() {
    return this.__instanceSidBase;
  }
  /**
   * Visit stamp of the per-pass instance prepass (WebGL multi-draw).
   * @internal
   */
  get _remapPrepassId() {
    return this.__remapPrepassId;
  }
  set _remapPrepassId(id) {
    this.__remapPrepassId = id;
  }
  /**
   * Updates the variation VBO (Vertex Buffer Object) for instancing.
   * @returns True if updated, false if not changed (not dirty)
   * @internal
   */
  updateVariationVBO() {
    const cgApiResourceRepository = this.__engine.cgApiResourceRepository;
    if (this.__variationVBOUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      cgApiResourceRepository.deleteVertexBuffer(this.__variationVBOUid);
    }
    const INVALID_ID = 4294967295;
    const instanceNum = this.__belongToEntities.length;
    const entityInfo = new Uint32Array(instanceNum * 4);
    const entityUIDs = new Int32Array(instanceNum);
    let hasSkeletalInstance = false;
    let hasBlendShapeInstance = false;
    for (let i = 0; i < instanceNum; i++) {
      entityUIDs[i] = this.__belongToEntities[i].entityUID;
      entityInfo[4 * i + 0] = this.__belongToEntities[i].getSceneGraph().componentSID;
      const skeletal = this.__belongToEntities[i].tryToGetSkeletal();
      if (skeletal != null) {
        entityInfo[4 * i + 1] = skeletal.componentSID;
      } else {
        entityInfo[4 * i + 1] = INVALID_ID;
      }
      const blendShape = this.__belongToEntities[i].tryToGetBlendShape();
      if (blendShape != null) {
        entityInfo[4 * i + 2] = blendShape.componentSID;
      } else {
        entityInfo[4 * i + 2] = INVALID_ID;
      }
      hasSkeletalInstance || (hasSkeletalInstance = skeletal != null);
      hasBlendShapeInstance || (hasBlendShapeInstance = blendShape != null);
    }
    this.__hasInstances = instanceNum > 0;
    this.__hasSkeletalInstance = hasSkeletalInstance;
    this.__hasBlendShapeInstance = hasBlendShapeInstance;
    if (this.__isInstanceSidTextureMode()) {
      this.__variationVBOUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      this.__variationEntityInfo = entityInfo;
      this.__variationEntityUIDs = entityUIDs;
      this.__variationVBOContent = void 0;
      this.__packedVariationEntityInfo = void 0;
      this.__variationVBOInstanceCount = instanceNum;
      this.__variationVBOCulledEntityStamp = void 0;
      this.__variationVBOCullTick = -1;
      this._ensureInstanceSidBase();
      return true;
    }
    this.__variationVBOUid = cgApiResourceRepository.createVertexBufferFromTypedArray(entityInfo);
    this.__variationEntityInfo = entityInfo;
    this.__variationEntityUIDs = entityUIDs;
    this.__variationVBOContent = entityInfo.slice();
    this.__packedVariationEntityInfo = new Uint32Array(entityInfo.length);
    this.__variationVBOInstanceCount = instanceNum;
    this.__variationVBOCulledEntityStamp = void 0;
    this.__variationVBOCullTick = -1;
    return true;
  }
  /**
   * Packs the instance variation data of the instances that were not culled in a render pass
   * into the front of the variation VBO, so that an instanced draw call renders only them.
   * The VBO is rewritten only when its content changes. WebGL only.
   *
   * Instances whose entities are not handled by the render pass's culling keep being drawn.
   *
   * @param culledEntityStamp - Per-EntityUID stamps written by the culling of the render pass
   *                            (undefined: draw all the instances)
   * @param cullTick - The stamp value of the latest culling of the render pass
   * @returns The number of the instances to draw
   * @internal
   */
  _packVisibleInstancesToVariationVBO(culledEntityStamp, cullTick) {
    if (this.__isInstanceSidTextureMode()) {
      return this._packVisibleInstancesToInstanceRemap(culledEntityStamp, cullTick);
    }
    const entityInfo = this.__variationEntityInfo;
    const entityUIDs = this.__variationEntityUIDs;
    const vboContent = this.__variationVBOContent;
    const packed = this.__packedVariationEntityInfo;
    if (entityInfo === void 0 || entityUIDs === void 0 || vboContent === void 0 || packed === void 0 || this.__variationVBOUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      return this.__belongToEntities.length;
    }
    if (culledEntityStamp === this.__variationVBOCulledEntityStamp && cullTick === this.__variationVBOCullTick) {
      return this.__variationVBOInstanceCount;
    }
    this.__variationVBOCulledEntityStamp = culledEntityStamp;
    this.__variationVBOCullTick = cullTick;
    const instanceNum = entityUIDs.length;
    let count = 0;
    for (let i = 0; i < instanceNum; i++) {
      if (culledEntityStamp !== void 0) {
        const entityUID = entityUIDs[i];
        if (entityUID < culledEntityStamp.length && culledEntityStamp[entityUID] === cullTick) {
          continue;
        }
      }
      const src = 4 * i;
      const dst = 4 * count;
      packed[dst + 0] = entityInfo[src + 0];
      packed[dst + 1] = entityInfo[src + 1];
      packed[dst + 2] = entityInfo[src + 2];
      packed[dst + 3] = entityInfo[src + 3];
      count++;
    }
    const packedLength = 4 * count;
    let changed = false;
    for (let i = 0; i < packedLength; i++) {
      if (packed[i] !== vboContent[i]) {
        changed = true;
        break;
      }
    }
    if (changed) {
      const packedData = packed.subarray(0, packedLength);
      this.__engine.webglResourceRepository.updateVertexBufferWithTypedArray(this.__variationVBOUid, packedData);
      vboContent.set(packedData);
    }
    this.__variationVBOInstanceCount = count;
    return count;
  }
  /**
   * Packs the visible instances into the engine-wide remap table so that the shader can
   * resolve `instanceBase + gl_InstanceID` to a stable SID slot. WebGL multi-draw only.
   *
   * @param culledEntityStamp - Per-EntityUID stamps written by the render pass culling
   * @param cullTick - The stamp value of the latest culling of the render pass
   * @returns The number of visible instances
   * @internal
   */
  _packVisibleInstancesToInstanceRemap(culledEntityStamp, cullTick) {
    const entityUIDs = this.__variationEntityUIDs;
    if (entityUIDs === void 0) {
      return this.__belongToEntities.length;
    }
    if (this.__instanceSidBase < 0) {
      this._ensureInstanceSidBase();
    }
    if (culledEntityStamp === this.__variationVBOCulledEntityStamp && cullTick === this.__variationVBOCullTick) {
      return this.__variationVBOInstanceCount;
    }
    this.__variationVBOCulledEntityStamp = culledEntityStamp;
    this.__variationVBOCullTick = cullTick;
    const table = this.__engine.webglResourceRepository.instanceSidTable;
    const base = this.__instanceSidBase;
    const instanceNum = entityUIDs.length;
    let count = 0;
    for (let i = 0; i < instanceNum; i++) {
      if (culledEntityStamp !== void 0) {
        const entityUID = entityUIDs[i];
        if (entityUID < culledEntityStamp.length && culledEntityStamp[entityUID] === cullTick) {
          continue;
        }
      }
      table.setRemap(base + count, i);
      count++;
    }
    this.__variationVBOInstanceCount = count;
    return count;
  }
  ///
  /// Public WebGL-related Methods
  ///
  /**
   * Deletes the variation VBO (Vertex Buffer Object).
   * @returns True if updated, false if not changed (not dirty)
   * @internal
   */
  deleteVariationVBO() {
    const webglResourceRepository = this.__engine.webglResourceRepository;
    if (this.__variationVBOUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      webglResourceRepository.deleteVertexBuffer(this.__variationVBOUid);
      this.__variationVBOUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      this.__variationEntityInfo = void 0;
      this.__variationEntityUIDs = void 0;
      this.__variationVBOContent = void 0;
      this.__packedVariationEntityInfo = void 0;
      return true;
    }
    return false;
  }
  /**
   * Updates the VAO (Vertex Array Object) for all primitives in this mesh.
   */
  updateVAO() {
    const webglResourceRepository = this.__engine.webglResourceRepository;
    if (webglResourceRepository == null) {
      return;
    }
    for (let i = 0; i < this.__primitives.length; i++) {
      const primitive = this.__primitives[i];
      const multiDrawGroup = primitive._multiDrawGroup;
      if ((multiDrawGroup == null ? void 0 : multiDrawGroup.vertexHandles) != null) {
        this.__vaoUids[i] = multiDrawGroup.vertexHandles.vaoHandle;
        this.__multiDrawVaoIndices.add(i);
        continue;
      }
      const vertexHandles = primitive.vertexHandles;
      if (Is.undefined(vertexHandles)) {
        Logger.default.warn("Need to create 3DAPIVertexData before update VAO");
        continue;
      }
      if (Number.isNaN(this.__vaoUids[i]) || this.__vaoUids[i] === CGAPIResourceRepository.InvalidCGAPIResourceUid || vertexHandles.vaoHandle === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        this.__vaoUids[i] = webglResourceRepository.createVertexArray();
        vertexHandles.vaoHandle = this.__vaoUids[i];
      }
      webglResourceRepository.setVertexDataToPipeline(vertexHandles, primitive, this.__variationVBOUid);
    }
    const multiDrawRepository = webglResourceRepository.getMultiDrawRepository(this.__engine);
    const removedHandles = /* @__PURE__ */ new Set();
    for (let i = this.__primitives.length; i < this.__vaoUids.length; i++) {
      const vaoUid = this.__vaoUids[i];
      if (vaoUid && !multiDrawRepository.hasVaoHandle(vaoUid)) {
        if (!removedHandles.has(vaoUid)) {
          removedHandles.add(vaoUid);
          webglResourceRepository.deleteVertexArray(vaoUid);
        }
      }
      this.__vaoUids[i] = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
  }
  /**
   * Deletes all VAO (Vertex Array Object) resources for this mesh.
   * Group VAOs are owned by the MultiDrawRepository and are skipped.
   */
  deleteVAO() {
    const webglResourceRepository = this.__engine.webglResourceRepository;
    if (webglResourceRepository == null) {
      this.__vaoUids.length = 0;
      this.__multiDrawVaoIndices.clear();
      return;
    }
    const multiDrawRepository = webglResourceRepository.getMultiDrawRepository(this.__engine);
    const deletedHandles = /* @__PURE__ */ new Set();
    for (let i = 0; i < this.__vaoUids.length; i++) {
      const vaoUid = this.__vaoUids[i];
      if (vaoUid && !deletedHandles.has(vaoUid) && !multiDrawRepository.hasVaoHandle(vaoUid)) {
        deletedHandles.add(vaoUid);
        webglResourceRepository.deleteVertexArray(vaoUid);
      }
      this.__vaoUids[i] = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
    this.__multiDrawVaoIndices.clear();
  }
  /**
   * Clears the VAO entries that point at multi-draw group VAOs. The groups own those
   * VAOs and delete them, so the mesh must forget them before the group is released.
   * @internal
   */
  _clearMultiDrawVaoUids() {
    for (const index of this.__multiDrawVaoIndices) {
      if (index < this.__vaoUids.length) {
        this.__vaoUids[index] = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      }
    }
    this.__multiDrawVaoIndices.clear();
  }
  /**
   * Performs ray casting against this mesh to find intersection points.
   * @param srcPointInLocal - The ray origin point in local space
   * @param directionInLocal - The ray direction in local space
   * @param dotThreshold - The dot product threshold for back-face culling (default: 0)
   * @returns Ray casting result with intersection information
   */
  castRay(srcPointInLocal, directionInLocal, dotThreshold = 0) {
    var _a;
    let finalShortestIntersectedPosVec3;
    let finalShortestT = Number.MAX_VALUE;
    let u = 0;
    let v = 0;
    for (const primitive of this.__primitives) {
      const result = primitive.castRay(
        srcPointInLocal,
        directionInLocal,
        true,
        true,
        dotThreshold,
        this.__hasFaceNormal
      );
      if (Is.defined(result.data) && ((_a = result.data) == null ? void 0 : _a.t) < finalShortestT) {
        finalShortestT = result.data.t;
        finalShortestIntersectedPosVec3 = result.data.position;
        u = result.data.u;
        v = result.data.v;
      }
    }
    if (Is.defined(finalShortestIntersectedPosVec3)) {
      return {
        result: true,
        data: {
          t: finalShortestT,
          u,
          v,
          position: finalShortestIntersectedPosVec3
        }
      };
    }
    return {
      result: false
    };
  }
  ///
  ///
  /// Accessors
  ///
  ///
  /**
   * Gets the array of primitives in this mesh.
   * @returns Array of primitives
   */
  get primitives() {
    return this.__primitives;
  }
  /**
   * Gets the unique identifier for this mesh.
   * @returns The mesh UID
   */
  get meshUID() {
    return this.__meshUID;
  }
  /**
   * Gets the variation VBO UID for internal use.
   * @returns The variation VBO resource handle
   * @internal
   */
  get _variationVBOUid() {
    return this.__variationVBOUid;
  }
  /**
   * The instance variation data of the instances, as written to the variation VBO by `updateVariationVBO`:
   * `[sceneGraphSID, skeletalSID, blendShapeSID, 0]` per instance, in the order of `meshEntitiesInner`.
   * @internal
   */
  get _variationEntityInfo() {
    return this.__variationEntityInfo;
  }
  /**
   * Whether the instances of this mesh can be culled on the GPU (WebGPU GPU culling).
   * The bounding boxes of the deformed instances (skinning, blend shapes) depend on the deformation: they are culled on
   * the GPU only when their vertices are deformed by the compute shader (`Config.isComputeSkinningEnabled` and
   * `_isComputeDeformable`), which computes their bounding boxes. Otherwise they are culled on the CPU.
   * Updated by `updateVariationVBO`.
   * @internal
   */
  get _isGpuCullable() {
    if (!this.__hasInstances) {
      return false;
    }
    if (!this._needsComputeDeformation) {
      return true;
    }
    return this.__engine.config.isComputeSkinningEnabled && this._isComputeDeformable;
  }
  /**
   * Whether the vertices of the instances are deformed when drawn: an instance has a skeletal component, or a blend
   * shape component while a primitive has morph targets. Updated by `updateVariationVBO`.
   * @internal
   */
  get _needsComputeDeformation() {
    if (this.__hasSkeletalInstance) {
      return true;
    }
    if (!this.__hasBlendShapeInstance) {
      return false;
    }
    for (let i = 0; i < this.__primitives.length; i++) {
      if (this.__primitives[i].targets.length > 0) {
        return true;
      }
    }
    return false;
  }
  /**
   * Whether the compute shader of the WebGPU GPU culling can deform the vertices of this mesh like the vertex shaders
   * do (processGeometry): every primitive has a POSITION attribute, plus JOINTS_0 and WEIGHTS_0 when an instance is
   * skinned, and every morph target has a POSITION attribute.
   * @internal
   */
  get _isComputeDeformable() {
    if (this.__computeDeformablePrimitiveCount === this.__primitives.length && this.__computeDeformablePositionUpdateCount === this.__primitivePositionUpdateCount && this.__computeDeformableHasSkeletal === this.__hasSkeletalInstance) {
      return this.__isComputeDeformable;
    }
    this.__computeDeformablePrimitiveCount = this.__primitives.length;
    this.__computeDeformablePositionUpdateCount = this.__primitivePositionUpdateCount;
    this.__computeDeformableHasSkeletal = this.__hasSkeletalInstance;
    this.__isComputeDeformable = this.__checkComputeDeformable();
    return this.__isComputeDeformable;
  }
  __checkComputeDeformable() {
    if (this.__primitives.length === 0) {
      return false;
    }
    const hasAttribute = (semantics, name) => semantics.some((s) => s.split(".")[0] === name);
    for (const primitive of this.__primitives) {
      const semantics = primitive.attributeSemantics;
      if (!hasAttribute(semantics, "POSITION")) {
        return false;
      }
      if (this.__hasSkeletalInstance && (!hasAttribute(semantics, "JOINTS_0") || !hasAttribute(semantics, "WEIGHTS_0"))) {
        return false;
      }
      for (const target of primitive.targets) {
        let hasPosition = false;
        for (const semantic of target.keys()) {
          if (semantic.split(".")[0] === "POSITION") {
            hasPosition = true;
          }
        }
        if (!hasPosition) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Called when primitive position data is updated.
   * Updates the position update counter and moves related entities to Load stage.
   * @internal
   */
  _onPrimitivePositionUpdated() {
    this.__primitivePositionUpdateCount++;
    _Mesh.__primitivePositionUpdateVersion++;
    for (const entity of this.__belongToEntities) {
      entity.getMeshRenderer().moveStageTo(ProcessStage.Load);
    }
  }
  /**
   * Gets the primitive position update count.
   * @returns The number of times primitive positions have been updated
   */
  get primitivePositionUpdateCount() {
    return this.__primitivePositionUpdateCount;
  }
  /**
   * Gets AABB in local space.
   */
  get AABB() {
    if (this.__primitivePositionUpdateCount !== this.__latestPrimitivePositionAccessorVersionForAABB) {
      this.__localAABB.initialize();
      this.__latestPrimitivePositionAccessorVersionForAABB = this.__primitivePositionUpdateCount;
    }
    if (this.__localAABB.isVanilla()) {
      for (const primitive of this.__primitives) {
        this.__localAABB.mergeAABB(primitive.AABB);
      }
    }
    return this.__localAABB;
  }
  ///
  ///
  // Friend Members
  ///
  ///
  ///
  ///
  /// Private Members
  ///
  ///
  /**
   * Calculates morph target primitives by blending vertex attributes.
   * @private
   */
  __calcMorphPrimitives() {
    for (let i = 0; i < this.__primitives.length; i++) {
      const morphPrimitive = this.__morphPrimitives[i];
      const primitive = this.__primitives[i];
      const target0Attributes = primitive.targets[0];
      target0Attributes.forEach((_accessor, semantic) => {
        const morphAccessor = morphPrimitive.getAttribute(semantic);
        const elementCount = morphAccessor.elementCount;
        for (let j = 0; j < elementCount; j++) {
          morphAccessor.setElementFromSameCompositionAccessor(j, primitive.getAttribute(semantic));
        }
      });
    }
  }
  /**
   * @internal
   */
  _calcTangents() {
    if (!this.__usePreCalculatedTangent()) {
      return;
    }
    for (const primitive of this.__primitives) {
      const tangentIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Tangent.XYZ);
      if (tangentIdx !== -1 && this.tangentCalculationMode === 2) {
        continue;
      }
      const texcoordIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Texcoord0.XY);
      const normalIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Normal.XYZ);
      if (texcoordIdx !== -1 && normalIdx !== -1) {
        const positionIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Position.XYZ);
        const positionAccessor = primitive.attributeAccessors[positionIdx];
        const texcoordAccessor = primitive.attributeAccessors[texcoordIdx];
        const normalAccessor = primitive.attributeAccessors[normalIdx];
        const indicesAccessor = primitive.indicesAccessor;
        let incrementNum = 3;
        if (primitive.primitiveMode === PrimitiveMode.TriangleStrip || primitive.primitiveMode === PrimitiveMode.TriangleFan) {
          incrementNum = 1;
        }
        const vertexNum = primitive.getVertexCountAsIndicesBased();
        const tangentAttributeByteSize = positionAccessor.byteLength * 4 / 3;
        const buffer = this.__engine.memoryManager.createBufferOnDemand(
          BufferUse.CPUGeneric,
          tangentAttributeByteSize,
          4
        );
        const tangentBufferView = buffer.takeBufferView({
          byteLengthToNeed: tangentAttributeByteSize,
          byteStride: 0
        }).unwrapForce();
        const tangentAccessor = tangentBufferView.takeAccessor({
          compositionType: CompositionType.Vec4,
          componentType: ComponentType.Float,
          count: positionAccessor.elementCount
        }).unwrapForce();
        for (let i = 0; i < vertexNum - 2; i += incrementNum) {
          const pos0 = positionAccessor.getVec3(i, { indicesAccessor });
          const pos1 = positionAccessor.getVec3(i + 1, { indicesAccessor });
          const pos2 = positionAccessor.getVec3(i + 2, { indicesAccessor });
          const uv0 = texcoordAccessor.getVec2(i, { indicesAccessor });
          const uv1 = texcoordAccessor.getVec2(i + 1, { indicesAccessor });
          const uv2 = texcoordAccessor.getVec2(i + 2, { indicesAccessor });
          const norm0 = normalAccessor.getVec3(i, { indicesAccessor });
          this.__calcTangentFor3Vertices(i, pos0, pos1, pos2, uv0, uv1, uv2, norm0, tangentAccessor, indicesAccessor);
        }
        primitive.setVertexAttribute(tangentAccessor, VertexAttribute.Tangent.XYZ);
      }
    }
  }
  /**
   * Calculates tangent vectors for a triangle consisting of 3 vertices.
   * @param i - The starting vertex index
   * @param pos0 - Position of the first vertex
   * @param pos1 - Position of the second vertex
   * @param pos2 - Position of the third vertex
   * @param uv0 - UV coordinates of the first vertex
   * @param uv1 - UV coordinates of the second vertex
   * @param uv2 - UV coordinates of the third vertex
   * @param norm0 - Normal vector of the first vertex
   * @param tangentAccessor - Accessor for writing tangent data
   * @param indicesAccessor - Optional indices accessor
   * @private
   * @internal
   */
  __calcTangentFor3Vertices(i, pos0, pos1, pos2, uv0, uv1, uv2, norm0, tangentAccessor, indicesAccessor) {
    const tan0Vec3 = this.__calcTangentPerVertex(pos0, pos1, pos2, uv0, uv1, uv2, norm0, _Mesh.__tmpReturnVec3_0);
    const tan1Vec3 = this.__calcTangentPerVertex(pos1, pos2, pos0, uv1, uv2, uv0, norm0, _Mesh.__tmpReturnVec3_1);
    const tan2Vec3 = this.__calcTangentPerVertex(pos2, pos0, pos1, uv2, uv0, uv1, norm0, _Mesh.__tmpReturnVec3_2);
    tangentAccessor.setVec4(i, tan0Vec3.x, tan0Vec3.y, tan0Vec3.z, 1, {
      indicesAccessor
    });
    tangentAccessor.setVec4(i + 1, tan1Vec3.x, tan1Vec3.y, tan1Vec3.z, 1, {
      indicesAccessor
    });
    tangentAccessor.setVec4(i + 2, tan2Vec3.x, tan2Vec3.y, tan2Vec3.z, 1, {
      indicesAccessor
    });
  }
  /**
   * Calculates the tangent vector for a single vertex.
   * @param pos0Vec3 - Position of the target vertex
   * @param pos1Vec3 - Position of the second vertex
   * @param pos2Vec3 - Position of the third vertex
   * @param uv0Vec2 - UV coordinates of the target vertex
   * @param uv1Vec2 - UV coordinates of the second vertex
   * @param uv2Vec2 - UV coordinates of the third vertex
   * @param norm0Vec3 - Normal vector of the target vertex
   * @param returnVec3 - Mutable vector to store the result
   * @returns The calculated tangent vector
   * @private
   */
  __calcTangentPerVertex(pos0Vec3, pos1Vec3, pos2Vec3, uv0Vec2, uv1Vec2, uv2Vec2, norm0Vec3, returnVec3) {
    const cp0 = [
      _Mesh.__tmpVec3_0.setComponents(pos0Vec3.x, uv0Vec2.x, uv0Vec2.y),
      _Mesh.__tmpVec3_1.setComponents(pos0Vec3.y, uv0Vec2.x, uv0Vec2.y),
      _Mesh.__tmpVec3_2.setComponents(pos0Vec3.z, uv0Vec2.x, uv0Vec2.y)
    ];
    const cp1 = [
      _Mesh.__tmpVec3_3.setComponents(pos1Vec3.x, uv1Vec2.x, uv1Vec2.y),
      _Mesh.__tmpVec3_4.setComponents(pos1Vec3.y, uv1Vec2.x, uv1Vec2.y),
      _Mesh.__tmpVec3_5.setComponents(pos1Vec3.z, uv1Vec2.x, uv1Vec2.y)
    ];
    const cp2 = [
      _Mesh.__tmpVec3_6.setComponents(pos2Vec3.x, uv2Vec2.x, uv2Vec2.y),
      _Mesh.__tmpVec3_7.setComponents(pos2Vec3.y, uv2Vec2.x, uv2Vec2.y),
      _Mesh.__tmpVec3_8.setComponents(pos2Vec3.z, uv2Vec2.x, uv2Vec2.y)
    ];
    const u = [];
    const v = [];
    for (let i = 0; i < 3; i++) {
      const v1 = MutableVector3.subtractTo(cp1[i], cp0[i], _Mesh.__tmpVec3_9);
      const v2 = MutableVector3.subtractTo(cp2[i], cp1[i], _Mesh.__tmpVec3_10);
      const abc = MutableVector3.crossTo(v1, v2, _Mesh.__tmpVec3_11);
      const validate = Math.abs(abc.x) < Number.EPSILON;
      if (validate) {
        Logger.default.assert(validate, "Polygons or polygons on UV are degenerate!");
        return Vector3.fromCopyArray([0, 0, 0]);
      }
      u[i] = -abc.y / abc.x;
      v[i] = -abc.z / abc.x;
    }
    if (u[0] * u[0] + u[1] * u[1] + u[2] * u[2] < Number.EPSILON) {
      MutableVector3.crossTo(norm0Vec3, pos1Vec3, returnVec3);
      return returnVec3.normalize();
    }
    return returnVec3.setComponents(u[0], u[1], u[2]).normalize();
  }
  /**
   * Determines whether to use pre-calculated tangent vectors based on the tangent calculation mode.
   * @returns True if tangent vectors should be pre-calculated, false otherwise
   * @private
   */
  __usePreCalculatedTangent() {
    if (this.tangentCalculationMode === 0 || this.tangentCalculationMode === 1 || this.tangentCalculationMode === 3) {
      return false;
    }
    return true;
  }
  /**
   * Calculates barycentric coordinates for all primitives in this mesh.
   * @internal
   */
  _calcBaryCentricCoord() {
    for (const primitive of this.__primitives) {
      const baryCentricCoordAccessor = primitive.getAttribute(VertexAttribute.BaryCentricCoord.XYZ);
      if (baryCentricCoordAccessor != null) {
        const positionIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Position.XYZ);
        const positionAccessor = primitive.attributeAccessors[positionIdx];
        const vertexNum = positionAccessor.elementCount;
        const num = vertexNum;
        for (let ver_i = 0; ver_i < num; ver_i++) {
          const vec4 = baryCentricCoordAccessor.getVec4(ver_i, {});
          baryCentricCoordAccessor.setVec4(
            ver_i,
            ver_i % 3 === 0 ? 1 : 0,
            // 1 0 0  1 0 0  1 0 0,
            ver_i % 3 === 1 ? 1 : 0,
            // 0 1 0  0 1 0  0 1 0,
            ver_i % 3 === 2 ? 1 : 0,
            // 0 0 1  0 0 1  0 0 1,
            vec4.w,
            {}
          );
        }
      } else {
        const positionIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Position.XYZ);
        const positionAccessor = primitive.attributeAccessors[positionIdx];
        const vertexNum = positionAccessor.elementCount;
        const num = vertexNum;
        const baryCentricCoordAttributeByteSize = num * 4 * 4;
        const buffer = this.__engine.memoryManager.createBufferOnDemand(
          BufferUse.CPUGeneric,
          baryCentricCoordAttributeByteSize,
          4
        );
        const baryCentricCoordBufferView = buffer.takeBufferView({
          byteLengthToNeed: baryCentricCoordAttributeByteSize,
          byteStride: 0
        }).unwrapForce();
        const baryCentricCoordAccessor2 = baryCentricCoordBufferView.takeAccessor({
          compositionType: CompositionType.Vec4,
          componentType: ComponentType.Float,
          count: num
        }).unwrapForce();
        for (let ver_i = 0; ver_i < num; ver_i++) {
          baryCentricCoordAccessor2.setVec4(
            ver_i,
            ver_i % 3 === 0 ? 1 : 0,
            // 1 0 0  1 0 0  1 0 0,
            ver_i % 3 === 1 ? 1 : 0,
            // 0 1 0  0 1 0  0 1 0,
            ver_i % 3 === 2 ? 1 : 0,
            // 0 0 1  0 0 1  0 0 1,
            ver_i,
            {}
          );
        }
        primitive.setVertexAttribute(baryCentricCoordAccessor2, VertexAttribute.BaryCentricCoord.XYZ);
      }
    }
  }
  /**
   * Calculates face normals for primitives that don't have normal attributes.
   * @internal
   */
  _calcFaceNormalsIfNonNormal() {
    for (const primitive of this.__primitives) {
      const normalIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Normal.XYZ);
      if (normalIdx !== -1) {
        return;
      }
      this.__hasFaceNormal = true;
      const positionIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Position.XYZ);
      const positionAccessor = primitive.attributeAccessors[positionIdx];
      const indicesAccessor = primitive.indicesAccessor;
      let incrementNum = 3;
      if (primitive.primitiveMode === PrimitiveMode.TriangleStrip || primitive.primitiveMode === PrimitiveMode.TriangleFan) {
        incrementNum = 1;
      }
      const vertexNum = primitive.getVertexCountAsIndicesBased();
      const normalAttributeByteSize = positionAccessor.byteLength;
      const buffer = this.__engine.memoryManager.createBufferOnDemand(BufferUse.CPUGeneric, normalAttributeByteSize, 4);
      const normalBufferView = buffer.takeBufferView({
        byteLengthToNeed: normalAttributeByteSize,
        byteStride: 0
      }).unwrapForce();
      const normalAccessor = normalBufferView.takeAccessor({
        compositionType: CompositionType.Vec3,
        componentType: ComponentType.Float,
        count: positionAccessor.elementCount
      }).unwrapForce();
      for (let i = 0; i < vertexNum - 2; i += incrementNum) {
        const pos0 = positionAccessor.getVec3(i, { indicesAccessor });
        const pos1 = positionAccessor.getVec3(i + 1, { indicesAccessor });
        const pos2 = positionAccessor.getVec3(i + 2, { indicesAccessor });
        this.__calcFaceNormalFor3Vertices(i, pos0, pos1, pos2, normalAccessor, indicesAccessor);
      }
      primitive.setVertexAttribute(normalAccessor, VertexAttribute.Normal.XYZ);
    }
  }
  /**
   * Calculates face normals for a triangle consisting of 3 vertices.
   * @param i - The starting vertex index
   * @param pos0 - Position of the first vertex
   * @param pos1 - Position of the second vertex
   * @param pos2 - Position of the third vertex
   * @param normalAccessor - Accessor for writing normal data
   * @param indicesAccessor - Optional indices accessor
   * @private
   */
  __calcFaceNormalFor3Vertices(i, pos0, pos1, pos2, normalAccessor, indicesAccessor) {
    const ax = pos1.x - pos0.x;
    const ay = pos1.y - pos0.y;
    const az = pos1.z - pos0.z;
    const bx = pos2.x - pos0.x;
    const by = pos2.y - pos0.y;
    const bz = pos2.z - pos0.z;
    let nx = ay * bz - az * by;
    let ny = az * bx - ax * bz;
    let nz = ax * by - ay * bx;
    let da = Math.hypot(nx, ny, nz);
    if (da <= 1e-6) {
      da = 1e-4;
    }
    da = 1 / da;
    nx *= da;
    ny *= da;
    nz *= da;
    normalAccessor.setVec3(i, nx, ny, nz, { indicesAccessor });
    normalAccessor.setVec3(i + 1, nx, ny, nz, { indicesAccessor });
    normalAccessor.setVec3(i + 2, nx, ny, nz, { indicesAccessor });
  }
  /**
   * Gets the index of a primitive within this mesh.
   * @param primitive - The primitive to find the index of
   * @returns The index of the primitive in the mesh
   */
  getPrimitiveIndexInMesh(primitive) {
    return this.primitives.indexOf(primitive);
  }
  /**
   * Apply a material variant to the mesh
   * @param variantName a variant name
   */
  applyMaterialVariant(variantName) {
    for (const primitive of this.primitives) {
      primitive.applyMaterialVariant(variantName);
    }
  }
  /**
   * Gets the current material variant name applied to this mesh.
   * Returns empty string if no variant is applied or if primitives have different variants.
   * @returns The current variant name or empty string
   */
  getCurrentVariantName() {
    function allEqual(arr) {
      return arr.every((val) => val === arr[0]);
    }
    const variantNames = this.primitives.map((primitive) => primitive.getCurrentVariantName());
    if (variantNames.length === 0) {
      return "";
    }
    if (allEqual(variantNames)) {
      return variantNames[0];
    }
    return "";
  }
  /**
   * Gets all available material variant names for this mesh.
   * @returns Array of variant names from all primitives
   */
  getVariantNames() {
    const variants = [];
    for (const primitive of this.primitives) {
      Array.prototype.push.apply(variants, primitive.getVariantNames());
    }
    return variants;
  }
  /**
   * Checks if this mesh setup is completed and ready for rendering.
   * @returns True if setup is done, false otherwise
   */
  isSetUpDone() {
    let vertexHandlesReady = true;
    for (const primitive of this.primitives) {
      if (primitive.vertexHandles == null) {
        vertexHandlesReady = false;
        break;
      }
    }
    if (!vertexHandlesReady) {
      return false;
    }
    if (this.__latestPrimitivePositionAccessorVersionForSetUpDone !== this.__primitivePositionUpdateCount) {
      this.__latestPrimitivePositionAccessorVersionForSetUpDone = this.__primitivePositionUpdateCount;
      return false;
    }
    return true;
  }
  /**
   * Updates VBO (Vertex Buffer Object) and VAO (Vertex Array Object) for all primitives.
   * @internal
   */
  /**
   * Marks this mesh's multi-draw groups (and the legacy setup) for a rebuild.
   * Called when a primitive's attributes or indices change.
   * @internal
   */
  _invalidateMultiDrawStructure() {
    if (this.__isInstanceSidTextureMode()) {
      this.__engine.webglResourceRepository.getMultiDrawRepository(this.__engine).markDirtyForMesh(this);
    }
  }
  _updateVBOAndVAO() {
    if (this.__isInstanceSidTextureMode()) {
      this.__engine.webglResourceRepository.getMultiDrawRepository(this.__engine).markDirtyForMesh(this);
      return;
    }
    const primitiveNum = this.getPrimitiveNumber();
    for (let i = 0; i < primitiveNum; i++) {
      const primitive = this.getPrimitiveAt(i);
      if (Is.exist(primitive.vertexHandles)) {
        primitive.update3DAPIVertexData();
      } else {
        primitive.create3DAPIVertexData();
      }
    }
    this.updateVariationVBO();
    if (this.__engine.engineState.currentProcessApproach !== ProcessApproach.WebGPU) {
      this.updateVAO();
    }
  }
  /**
   * Deletes all 3D API vertex data for this mesh.
   */
  delete3DAPIVertexData() {
    for (const primitive of this.__primitives) {
      primitive.delete3DAPIVertexData();
    }
    if (this.__instanceSidBase >= 0 && this.__belongToEntities.length === 0) {
      this.__engine.webglResourceRepository.instanceSidTable.free(this.__instanceSidBase, this.__instanceSidCount);
      this.__instanceSidBase = -1;
      this.__instanceSidCount = 0;
    }
  }
  // makeVerticesSeparated() {
  //   for (let primitive of this.__primitives) {
  //     if (primitive.hasIndices()) {
  //       const buffer = MemoryManager.getInstance().createOrGetBuffer(BufferUse.CPUGeneric);
  //       const vertexCount = primitive.getVertexCountAsIndicesBased();
  //       const indexAccessor = primitive.indicesAccessor;
  //       for (let i in primitive.attributeAccessors) {
  //         const attributeAccessor = primitive.attributeAccessors[i];
  //         const elementSizeInBytes = attributeAccessor.elementSizeInBytes;
  //         const bufferView = buffer.takeBufferView({ byteLengthToNeed: elementSizeInBytes * vertexCount, byteStride: 0, isAoS: false });
  //         const newAccessor = bufferView.takeAccessor({ compositionType: attributeAccessor.compositionType, componentType: attributeAccessor.componentType, count: vertexCount });
  //         for (let j = 0; j < vertexCount; j++) {
  //           const idx = indexAccessor!.getScalar(j, {});
  //           newAccessor.setElementFromSameCompositionAccessor(j, attributeAccessor, idx);
  //         }
  //         primitive.setVertexAttribute(newAccessor, primitive.attributeSemantics[i]);
  //       }
  //       const indicesAccessor = primitive.indicesAccessor!;
  //       const elementSizeInBytes = indicesAccessor.elementSizeInBytes;
  //       const bufferView = buffer.takeBufferView({ byteLengthToNeed: elementSizeInBytes * vertexCount, byteStride: 0, isAoS: false });
  //       const newAccessor = bufferView.takeAccessor({ compositionType: indicesAccessor.compositionType, componentType: indicesAccessor.componentType, count: vertexCount });
  //       for (let j = 0; j < vertexCount; j++) {
  //         //const idx = indexAccessor!.getScalar(j, {});
  //         newAccessor.setScalar(j, j, {});
  //       }
  //       primitive.setIndices(newAccessor);
  //     }
  //   }
  // }
  // __initMorphPrimitives() {
  //   if (this.weights.length === 0) {
  //     return;
  //   }
  //   const buffer = MemoryManager.getInstance().createOrGetBuffer(BufferUse.CPUGeneric);
  //   for (let i = 0; i < this.__primitives.length; i++) {
  //     const primitive = this.__primitives[i];
  //     if (this.__morphPrimitives[i] == null) {
  //       const target = primitive.targets[0];
  //       const map = new Map();
  //       target.forEach((accessor, semantic) => {
  //         const bufferView = buffer.takeBufferView({ byteLengthToNeed: accessor.byteLength, byteStride: 0, isAoS: false });
  //         const morphAccessor = bufferView.takeAccessor({ compositionType: accessor.compositionType, componentType: accessor.componentType, count: accessor.elementCount });
  //         map.set(semantic, morphAccessor);
  //       });
  //       const morphPrimitive = new Primitive();
  //       morphPrimitive.setData(map, primitive.primitiveMode, primitive.material, primitive.indicesAccessor);
  //       morphPrimitive.setTargets(primitive.targets);
  //       this.__morphPrimitives[i] = morphPrimitive;
  //     }
  //   }
  // }
};
_Mesh.invalidateMeshUID = -1;
_Mesh.__mesh_uid_count = _Mesh.invalidateMeshUID;
_Mesh.__tmpVec3_0 = MutableVector3.zero();
_Mesh.__tmpVec3_1 = MutableVector3.zero();
_Mesh.__tmpVec3_2 = MutableVector3.zero();
_Mesh.__tmpVec3_3 = MutableVector3.zero();
_Mesh.__tmpVec3_4 = MutableVector3.zero();
_Mesh.__tmpVec3_5 = MutableVector3.zero();
_Mesh.__tmpVec3_6 = MutableVector3.zero();
_Mesh.__tmpVec3_7 = MutableVector3.zero();
_Mesh.__tmpVec3_8 = MutableVector3.zero();
_Mesh.__tmpVec3_9 = MutableVector3.zero();
_Mesh.__tmpVec3_10 = MutableVector3.zero();
_Mesh.__tmpVec3_11 = MutableVector3.zero();
_Mesh.__tmpReturnVec3_0 = MutableVector3.zero();
_Mesh.__tmpReturnVec3_1 = MutableVector3.zero();
_Mesh.__tmpReturnVec3_2 = MutableVector3.zero();
/** Incremented when the primitive positions of any mesh are updated. */
_Mesh.__primitivePositionUpdateVersion = 0;
var Mesh = _Mesh;
export {
  Mesh
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZ2VvbWV0cnkvTWVzaC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBDR0FQSVJlc291cmNlSGFuZGxlLCBJbmRleCwgTWVzaFVJRCB9IGZyb20gJy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB0eXBlIHsgVmVydGV4SGFuZGxlcyB9IGZyb20gJy4uLy4uL3dlYmdsL1dlYkdMUmVzb3VyY2VSZXBvc2l0b3J5JztcbmltcG9ydCB0eXBlIHsgTWVzaENvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvTWVzaC9NZXNoQ29tcG9uZW50JztcbmltcG9ydCB7IEJ1ZmZlclVzZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL0J1ZmZlclVzZSc7XG5pbXBvcnQgeyBDb21wb25lbnRUeXBlIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvQ29tcG9uZW50VHlwZSc7XG5pbXBvcnQgeyBDb21wb3NpdGlvblR5cGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHsgUHJpbWl0aXZlTW9kZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1ByaW1pdGl2ZU1vZGUnO1xuaW1wb3J0IHsgUHJvY2Vzc0FwcHJvYWNoIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvUHJvY2Vzc0FwcHJvYWNoJztcbmltcG9ydCB7IFByb2Nlc3NTdGFnZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1Byb2Nlc3NTdGFnZSc7XG5pbXBvcnQgeyBWZXJ0ZXhBdHRyaWJ1dGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9WZXJ0ZXhBdHRyaWJ1dGUnO1xuaW1wb3J0IHR5cGUgeyBJTWVzaEVudGl0eSB9IGZyb20gJy4uL2hlbHBlcnMvRW50aXR5SGVscGVyJztcbmltcG9ydCB7IEFBQkIgfSBmcm9tICcuLi9tYXRoL0FBQkInO1xuaW1wb3J0IHR5cGUgeyBJVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvSVZlY3Rvcic7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvTXV0YWJsZVZlY3RvcjMnO1xuaW1wb3J0IHR5cGUgeyBWZWN0b3IyIH0gZnJvbSAnLi4vbWF0aC9WZWN0b3IyJztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICcuLi9tYXRoL1ZlY3RvcjMnO1xuaW1wb3J0IHR5cGUgeyBBY2Nlc3NvciB9IGZyb20gJy4uL21lbW9yeS9BY2Nlc3Nvcic7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uL21pc2MvSXMnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHsgQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkgfSBmcm9tICcuLi9yZW5kZXJlci9DR0FQSVJlc291cmNlUmVwb3NpdG9yeSc7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uL3N5c3RlbS9FbmdpbmUnO1xuaW1wb3J0IHR5cGUgeyBQcmltaXRpdmUgfSBmcm9tICcuL1ByaW1pdGl2ZSc7XG5pbXBvcnQge1xuICB0eXBlIElNZXNoLFxuICBpc0JsZW5kV2l0aG91dFpXcml0ZSxcbiAgaXNCbGVuZFdpdGhaV3JpdGUsXG4gIGlzT3BhcXVlLFxuICBpc1RyYW5zbHVjZW50LFxuICB0eXBlIFJheWNhc3RSZXN1bHRFeDEsXG59IGZyb20gJy4vdHlwZXMvR2VvbWV0cnlUeXBlcyc7XG5cbi8qKlxuICogVGhlIE1lc2ggY2xhc3MuXG4gKiBUaGlzIG1lc2ggb2JqZWN0IGhhcyBwcmltaXRpdmVzIChnZW9tZXRyaWVzKSBvciBhIHJlZmVyZW5jZSBvZiAnb3JpZ2luYWwgbWVzaCcuXG4gKiBJZiB0aGUgbGF0dGVyLCB0aGlzIG1lc2ggb2JqZWN0IGlzIGFuICdpbnN0YW5jZWQgbWVzaCcsIHdoaWNoIGhhcyBubyBwcmltaXRpdmVzLlxuICogSW5zdGFuY2VkIG1lc2hlcyByZWZlciBvcmlnaW5hbCBtZXNoJ3MgcHJpbWl0aXZlcyB3aGVuIGRyYXdpbmcuXG4gKi9cbmV4cG9ydCBjbGFzcyBNZXNoIGltcGxlbWVudHMgSU1lc2gge1xuICBwcml2YXRlIHJlYWRvbmx5IF9fZW5naW5lOiBFbmdpbmU7XG4gIHByaXZhdGUgcmVhZG9ubHkgX19tZXNoVUlEOiBNZXNoVUlEO1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IGludmFsaWRhdGVNZXNoVUlEID0gLTE7XG4gIHB1YmxpYyBzdGF0aWMgX19tZXNoX3VpZF9jb3VudCA9IE1lc2guaW52YWxpZGF0ZU1lc2hVSUQ7XG4gIHByaXZhdGUgX19wcmltaXRpdmVzOiBQcmltaXRpdmVbXSA9IFtdO1xuICBwcml2YXRlIF9fb3BhcXVlUHJpbWl0aXZlczogQXJyYXk8UHJpbWl0aXZlPiA9IFtdO1xuICBwcml2YXRlIF9fdHJhbnNsdWNlbnRQcmltaXRpdmVzOiBBcnJheTxQcmltaXRpdmU+ID0gW107XG4gIHByaXZhdGUgX19ibGVuZFdpdGhaV3JpdGVQcmltaXRpdmVzOiBBcnJheTxQcmltaXRpdmU+ID0gW107XG4gIHByaXZhdGUgX19ibGVuZFdpdGhvdXRaV3JpdGVQcmltaXRpdmVzOiBBcnJheTxQcmltaXRpdmU+ID0gW107XG4gIHByaXZhdGUgX19tb3JwaFByaW1pdGl2ZXM6IEFycmF5PFByaW1pdGl2ZT4gPSBbXTtcbiAgcHJpdmF0ZSBfX2xvY2FsQUFCQiA9IG5ldyBBQUJCKCk7XG4gIHByaXZhdGUgX192YW9VaWRzOiBDR0FQSVJlc291cmNlSGFuZGxlW10gPSBbXTtcbiAgLyoqIEluZGljZXMgb2YgX192YW9VaWRzIHRoYXQgcmVmZXIgdG8gYSBNdWx0aURyYXdSZXBvc2l0b3J5LW93bmVkIGdyb3VwIFZBTy4gKi9cbiAgcHJpdmF0ZSBfX211bHRpRHJhd1Zhb0luZGljZXM6IFNldDxJbmRleD4gPSBuZXcgU2V0KCk7XG4gIHByaXZhdGUgX192YXJpYXRpb25WQk9VaWQ6IENHQVBJUmVzb3VyY2VIYW5kbGUgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgLyoqIEluc3RhbmNlIHZhcmlhdGlvbiBkYXRhIG9mIGFsbCB0aGUgZW50aXRpZXMsIGluIHRoZSBvcmRlciBvZiBgX192YXJpYXRpb25FbnRpdHlVSURzYC4gKi9cbiAgcHJpdmF0ZSBfX3ZhcmlhdGlvbkVudGl0eUluZm8/OiBVaW50MzJBcnJheTtcbiAgLyoqIEVudGl0eVVJRHMgb2YgdGhlIGluc3RhbmNlcyBzdG9yZWQgaW4gYF9fdmFyaWF0aW9uRW50aXR5SW5mb2AuICovXG4gIHByaXZhdGUgX192YXJpYXRpb25FbnRpdHlVSURzPzogSW50MzJBcnJheTtcbiAgLyoqIFdoZXRoZXIgdGhlIG1lc2ggaGFzIGluc3RhbmNlcyAoc2VlIGBfaXNHcHVDdWxsYWJsZWApLiAqL1xuICBwcml2YXRlIF9faGFzSW5zdGFuY2VzID0gZmFsc2U7XG4gIC8qKiBXaGV0aGVyIGFuIGluc3RhbmNlIGhhcyBhIHNrZWxldGFsIGNvbXBvbmVudCAoc2VlIGBfbmVlZHNDb21wdXRlRGVmb3JtYXRpb25gKS4gKi9cbiAgcHJpdmF0ZSBfX2hhc1NrZWxldGFsSW5zdGFuY2UgPSBmYWxzZTtcbiAgLyoqIFdoZXRoZXIgYW4gaW5zdGFuY2UgaGFzIGEgYmxlbmQgc2hhcGUgY29tcG9uZW50IChzZWUgYF9uZWVkc0NvbXB1dGVEZWZvcm1hdGlvbmApLiAqL1xuICBwcml2YXRlIF9faGFzQmxlbmRTaGFwZUluc3RhbmNlID0gZmFsc2U7XG4gIC8qKiBDYWNoZSBvZiBgX2lzQ29tcHV0ZURlZm9ybWFibGVgLCB2YWxpZCBmb3IgdGhlIHByaW1pdGl2ZSBjb3VudCwgcG9zaXRpb24gdXBkYXRlIGNvdW50IGFuZCBza2VsZXRhbCBmbGFnIGJlbG93LiAqL1xuICBwcml2YXRlIF9faXNDb21wdXRlRGVmb3JtYWJsZSA9IGZhbHNlO1xuICBwcml2YXRlIF9fY29tcHV0ZURlZm9ybWFibGVQcmltaXRpdmVDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fY29tcHV0ZURlZm9ybWFibGVQb3NpdGlvblVwZGF0ZUNvdW50ID0gLTE7XG4gIHByaXZhdGUgX19jb21wdXRlRGVmb3JtYWJsZUhhc1NrZWxldGFsID0gZmFsc2U7XG4gIC8qKiBNaXJyb3Igb2YgdGhlIGN1cnJlbnQgY29udGVudCBvZiB0aGUgdmFyaWF0aW9uIFZCTyAoV2ViR0wpLiAqL1xuICBwcml2YXRlIF9fdmFyaWF0aW9uVkJPQ29udGVudD86IFVpbnQzMkFycmF5O1xuICAvKiogU2NyYXRjaCBidWZmZXIgdG8gcGFjayB0aGUgaW5zdGFuY2UgdmFyaWF0aW9uIGRhdGEgb2YgdGhlIHZpc2libGUgaW5zdGFuY2VzLiAqL1xuICBwcml2YXRlIF9fcGFja2VkVmFyaWF0aW9uRW50aXR5SW5mbz86IFVpbnQzMkFycmF5O1xuICAvKiogTnVtYmVyIG9mIHRoZSBpbnN0YW5jZXMgcGFja2VkIGF0IHRoZSBmcm9udCBvZiB0aGUgdmFyaWF0aW9uIFZCTy4gKi9cbiAgcHJpdmF0ZSBfX3ZhcmlhdGlvblZCT0luc3RhbmNlQ291bnQgPSAwO1xuICAvKiogQ3VsbGluZyBzdGF0ZSB0aGUgdmFyaWF0aW9uIFZCTyBjb250ZW50IHdhcyBwYWNrZWQgZm9yOyB1c2VkIHRvIHNraXAgcmVkdW5kYW50IHBhY2tpbmcuICovXG4gIHByaXZhdGUgX192YXJpYXRpb25WQk9DdWxsZWRFbnRpdHlTdGFtcD86IFVpbnQzMkFycmF5O1xuICBwcml2YXRlIF9fdmFyaWF0aW9uVkJPQ3VsbFRpY2sgPSAtMTtcbiAgLyoqIFN0YWJsZSBzbG90IHJhbmdlIGluIHRoZSBlbmdpbmUtd2lkZSBpbnN0YW5jZSBTSUQgdGFibGUgKFdlYkdMIG11bHRpLWRyYXcpLiAqL1xuICBwcml2YXRlIF9faW5zdGFuY2VTaWRCYXNlID0gLTE7XG4gIHByaXZhdGUgX19pbnN0YW5jZVNpZENvdW50ID0gMDtcbiAgLyoqIElkIG9mIHRoZSBsYXN0IGN1bGxpbmcgcGFzcyB0aGF0IHZpc2l0ZWQgdGhpcyBtZXNoIGluIHRoZSBwZXItcGFzcyBpbnN0YW5jZSBwcmVwYXNzLiAqL1xuICBwcml2YXRlIF9fcmVtYXBQcmVwYXNzSWQgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhdGVzdFByaW1pdGl2ZVBvc2l0aW9uQWNjZXNzb3JWZXJzaW9uRm9yQUFCQiA9IDA7XG4gIHByaXZhdGUgX19sYXRlc3RQcmltaXRpdmVQb3NpdGlvbkFjY2Vzc29yVmVyc2lvbkZvclNldFVwRG9uZSA9IDA7XG4gIHByaXZhdGUgX19iZWxvbmdUb0VudGl0aWVzOiBJTWVzaEVudGl0eVtdID0gW107XG5cbiAgLyoqXG4gICAqIFNwZWNpZmljYXRpb24gb2Ygd2hlbiBjYWxjdWxhdGUgdGhlIHRhbmdlbnQgb2YgYSB2ZXJ0ZXggdG8gYXBwbHkgTm9ybWFsIHRleHR1cmUgKGZvciBwYnIvTVRvb24gc2hhZGVyKVxuICAgKiAwOiBOb3QgY2FsY3VsYXRlIHRhbmdlbnQgKG5vdCBhcHBseSBub3JtYWwgdGV4dHVyZSlcbiAgICogMTogKGRlZmF1bHQpIFVzZSBvcmlnaW5hbCB0YW5nZW50IGluIGEgdmVydGV4LCBpZiBhIHZlcnRleCBoYXMgdGFuZ2VudCBhdHRyaWJ1dGUuIElmIGEgdmVydGV4IGRvZXMgbm90IGhhdmUgaXQsIGNhbGN1bGF0ZSBhIHRhbmdlbnQgaW4gYSBzaGFkZXIuXG4gICAqIDI6IFVzZSBvcmlnaW5hbCB0YW5nZW50IGluIGEgdmVydGV4LCBpZiBhIHZlcnRleCBoYXMgdGFuZ2VudCBhdHRyaWJ1dGUuIElmIGEgdmVydGV4IGRvZXMgbm90IGhhdmUgaXQsIHByZWNhbGN1bGF0ZSBhIHRhbmdlbnQgaW4gdGhlIGphdmFzY3JpcHQuXG4gICAqIDM6IENhbGN1bGF0ZSBhbGwgdGFuZ2VudCBpbiBhIHNoYWRlci5cbiAgICogNDogUHJlY2FsY3VsYXRlIGFsbCB0YW5nZW50IGluIHRoZSBqYXZhc2NyaXB0XG4gICAqL1xuICBwdWJsaWMgdGFuZ2VudENhbGN1bGF0aW9uTW9kZTogSW5kZXggPSAxO1xuXG4gIHByaXZhdGUgX19oYXNGYWNlTm9ybWFsID0gZmFsc2U7XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBWZWMzXzA6IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFZlYzNfMTogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wVmVjM18yOiBNdXRhYmxlVmVjdG9yMyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBWZWMzXzM6IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFZlYzNfNDogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wVmVjM181OiBNdXRhYmxlVmVjdG9yMyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBWZWMzXzY6IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFZlYzNfNzogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wVmVjM184OiBNdXRhYmxlVmVjdG9yMyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBWZWMzXzk6IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFZlYzNfMTA6IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFZlYzNfMTE6IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuXG4gIHByaXZhdGUgc3RhdGljIF9fdG1wUmV0dXJuVmVjM18wOiBNdXRhYmxlVmVjdG9yMyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBSZXR1cm5WZWMzXzE6IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFJldHVyblZlYzNfMjogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG5cbiAgcHJpdmF0ZSBfX3ByaW1pdGl2ZVBvc2l0aW9uVXBkYXRlQ291bnQgPSAwO1xuICAvKiogSW5jcmVtZW50ZWQgd2hlbiB0aGUgcHJpbWl0aXZlIHBvc2l0aW9ucyBvZiBhbnkgbWVzaCBhcmUgdXBkYXRlZC4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19wcmltaXRpdmVQb3NpdGlvblVwZGF0ZVZlcnNpb24gPSAwO1xuXG4gIC8qKlxuICAgKiBBIHZlcnNpb24gaW5jcmVtZW50ZWQgd2hlbmV2ZXIgdGhlIHByaW1pdGl2ZSBwb3NpdGlvbnMgb2YgYW55IG1lc2ggYXJlIHVwZGF0ZWQgKHNlZVxuICAgKiBgcHJpbWl0aXZlUG9zaXRpb25VcGRhdGVDb3VudGApLCBzbyB0aGF0IGNhY2hlcyBvZiB0aGUgbG9jYWwgYm91bmRpbmcgYm94ZXMgY2FuIGJlIHJldmFsaWRhdGVkIGNoZWFwbHkuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIGdldCBfcHJpbWl0aXZlUG9zaXRpb25VcGRhdGVWZXJzaW9uKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIE1lc2guX19wcmltaXRpdmVQb3NpdGlvblVwZGF0ZVZlcnNpb247XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3JcbiAgICovXG4gIGNvbnN0cnVjdG9yKGVuZ2luZTogRW5naW5lKSB7XG4gICAgdGhpcy5fX2VuZ2luZSA9IGVuZ2luZTtcbiAgICB0aGlzLl9fbWVzaFVJRCA9ICsrTWVzaC5fX21lc2hfdWlkX2NvdW50O1xuICB9XG5cbiAgLy8vXG4gIC8vL1xuICAvLy8gUHVibGljIE1lbWJlcnNcbiAgLy8vXG4gIC8vL1xuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBWQU8gKFZlcnRleCBBcnJheSBPYmplY3QpIFVJRCBmb3IgdGhlIHNwZWNpZmllZCBpbmRleC5cbiAgICogQHBhcmFtIGluZGV4IC0gVGhlIGluZGV4IG9mIHRoZSBwcmltaXRpdmVcbiAgICogQHJldHVybnMgVGhlIFZBTyByZXNvdXJjZSBoYW5kbGVcbiAgICovXG4gIHB1YmxpYyBnZXRWYW9VaWRzKGluZGV4OiBJbmRleCk6IENHQVBJUmVzb3VyY2VIYW5kbGUge1xuICAgIHJldHVybiB0aGlzLl9fdmFvVWlkc1tpbmRleF07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgVkFPIChWZXJ0ZXggQXJyYXkgT2JqZWN0KSBVSUQgZm9yIHRoZSBzcGVjaWZpZWQgcHJpbWl0aXZlIFVJRC5cbiAgICogQHBhcmFtIHByaW1pdGl2ZVVpZCAtIFRoZSBVSUQgb2YgdGhlIHByaW1pdGl2ZVxuICAgKiBAcmV0dXJucyBUaGUgVkFPIHJlc291cmNlIGhhbmRsZVxuICAgKi9cbiAgcHVibGljIGdldFZhb1VpZHNCeVByaW1pdGl2ZVVpZChwcmltaXRpdmVVaWQ6IEluZGV4KTogQ0dBUElSZXNvdXJjZUhhbmRsZSB7XG4gICAgY29uc3QgaW5kZXggPSB0aGlzLl9fcHJpbWl0aXZlcy5maW5kSW5kZXgocHJpbWl0aXZlID0+IHByaW1pdGl2ZS5wcmltaXRpdmVVaWQgPT09IHByaW1pdGl2ZVVpZCk7XG5cbiAgICByZXR1cm4gdGhpcy5fX3Zhb1VpZHNbaW5kZXhdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGlubmVyIG1lc2ggZW50aXRpZXMgdGhhdCBiZWxvbmcgdG8gdGhpcyBtZXNoLlxuICAgKiBAcmV0dXJucyBBcnJheSBvZiBtZXNoIGVudGl0aWVzXG4gICAqL1xuICBnZXQgbWVzaEVudGl0aWVzSW5uZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19iZWxvbmdUb0VudGl0aWVzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyB0aGlzIG1lc2ggYXMgYmVsb25naW5nIHRvIGEgbWVzaCBjb21wb25lbnQuXG4gICAqIEBwYXJhbSBtZXNoQ29tcG9uZW50IC0gVGhlIG1lc2ggY29tcG9uZW50IHRoYXQgb3ducyB0aGlzIG1lc2hcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfYmVsb25nVG9NZXNoQ29tcG9uZW50KG1lc2hDb21wb25lbnQ6IE1lc2hDb21wb25lbnQpIHtcbiAgICB0aGlzLl9fYmVsb25nVG9FbnRpdGllcy5wdXNoKG1lc2hDb21wb25lbnQuZW50aXR5KTtcbiAgICBpZiAodGhpcy5fX2lzSW5zdGFuY2VTaWRUZXh0dXJlTW9kZSgpKSB7XG4gICAgICB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmdldE11bHRpRHJhd1JlcG9zaXRvcnkodGhpcy5fX2VuZ2luZSkubWFya0RpcnR5Rm9yTWVzaCh0aGlzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyB0aGUgYXNzb2NpYXRpb24gd2l0aCBhIG1lc2ggY29tcG9uZW50LlxuICAgKiBAcGFyYW0gbWVzaENvbXBvbmVudCAtIFRoZSBtZXNoIGNvbXBvbmVudCB0byByZW1vdmVcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfcmVtb3ZlTWVzaENvbXBvbmVudChtZXNoQ29tcG9uZW50OiBNZXNoQ29tcG9uZW50KSB7XG4gICAgY29uc3QgZW50aXR5ID0gbWVzaENvbXBvbmVudC5lbnRpdHk7XG4gICAgdGhpcy5fX2JlbG9uZ1RvRW50aXRpZXMgPSB0aGlzLl9fYmVsb25nVG9FbnRpdGllcy5maWx0ZXIoYmVsb25nVG9FbnRpdHkgPT4gYmVsb25nVG9FbnRpdHkgIT09IGVudGl0eSk7XG4gICAgaWYgKHRoaXMuX19pc0luc3RhbmNlU2lkVGV4dHVyZU1vZGUoKSkge1xuICAgICAgdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5nZXRNdWx0aURyYXdSZXBvc2l0b3J5KHRoaXMuX19lbmdpbmUpLm1hcmtEaXJ0eUZvck1lc2godGhpcyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgcHJpbWl0aXZlLlxuICAgKiBAcGFyYW0gcHJpbWl0aXZlIFRoZSBwcmltaXRpdmUgb2JqZWN0LlxuICAgKi9cbiAgcHVibGljIGFkZFByaW1pdGl2ZShwcmltaXRpdmU6IFByaW1pdGl2ZSk6IHZvaWQge1xuICAgIHByaW1pdGl2ZS5fYmVsb25nVG9NZXNoKHRoaXMpO1xuICAgIGlmICh0aGlzLl9faXNJbnN0YW5jZVNpZFRleHR1cmVNb2RlKCkpIHtcbiAgICAgIHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuZ2V0TXVsdGlEcmF3UmVwb3NpdG9yeSh0aGlzLl9fZW5naW5lKS5tYXJrRGlydHlGb3JNZXNoKHRoaXMpO1xuICAgIH1cblxuICAgIGlmIChpc09wYXF1ZShwcmltaXRpdmUpKSB7XG4gICAgICB0aGlzLl9fb3BhcXVlUHJpbWl0aXZlcy5wdXNoKHByaW1pdGl2ZSk7XG4gICAgfSBlbHNlIGlmIChpc1RyYW5zbHVjZW50KHByaW1pdGl2ZSkpIHtcbiAgICAgIHRoaXMuX190cmFuc2x1Y2VudFByaW1pdGl2ZXMucHVzaChwcmltaXRpdmUpO1xuICAgIH0gZWxzZSBpZiAoaXNCbGVuZFdpdGhaV3JpdGUocHJpbWl0aXZlKSkge1xuICAgICAgdGhpcy5fX2JsZW5kV2l0aFpXcml0ZVByaW1pdGl2ZXMucHVzaChwcmltaXRpdmUpO1xuICAgIH0gZWxzZSBpZiAoaXNCbGVuZFdpdGhvdXRaV3JpdGUocHJpbWl0aXZlKSkge1xuICAgICAgdGhpcy5fX2JsZW5kV2l0aG91dFpXcml0ZVByaW1pdGl2ZXMucHVzaChwcmltaXRpdmUpO1xuICAgIH1cbiAgICB0aGlzLl9fc2V0UHJpbWl0aXZlcyhcbiAgICAgIHRoaXMuX19vcGFxdWVQcmltaXRpdmVzXG4gICAgICAgIC5jb25jYXQodGhpcy5fX3RyYW5zbHVjZW50UHJpbWl0aXZlcylcbiAgICAgICAgLmNvbmNhdCh0aGlzLl9fYmxlbmRXaXRoWldyaXRlUHJpbWl0aXZlcylcbiAgICAgICAgLmNvbmNhdCh0aGlzLl9fYmxlbmRXaXRob3V0WldyaXRlUHJpbWl0aXZlcylcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGFycmF5IG9mIHByaW1pdGl2ZXMgZm9yIHRoaXMgbWVzaC5cbiAgICogQHBhcmFtIHByaW1pdGl2ZXMgLSBBcnJheSBvZiBwcmltaXRpdmVzIHRvIHNldFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX3NldFByaW1pdGl2ZXMocHJpbWl0aXZlczogUHJpbWl0aXZlW10pIHtcbiAgICB0aGlzLl9fcHJpbWl0aXZlcyA9IHByaW1pdGl2ZXM7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgbWVzaCBoYXMgb3BhcXVlIHByaW1pdGl2ZXMuXG4gICAqIEByZXR1cm5zIFRydWUgaWYgb3BhcXVlIHByaW1pdGl2ZXMgZXhpc3QsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgcHVibGljIGlzRXhpc3RPcGFxdWUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX19vcGFxdWVQcmltaXRpdmVzLmxlbmd0aCA+IDA7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgbWVzaCBoYXMgdHJhbnNsdWNlbnQgcHJpbWl0aXZlcy5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0cmFuc2x1Y2VudCBwcmltaXRpdmVzIGV4aXN0LCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHB1YmxpYyBpc0V4aXN0VHJhbnNsdWNlbnQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX190cmFuc2x1Y2VudFByaW1pdGl2ZXMubGVuZ3RoID4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBtZXNoIGhhcyBibGVuZC13aXRoLXotd3JpdGUgcHJpbWl0aXZlcy5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiBibGVuZC13aXRoLXotd3JpdGUgcHJpbWl0aXZlcyBleGlzdCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBwdWJsaWMgaXNFeGlzdEJsZW5kV2l0aFpXcml0ZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fX2JsZW5kV2l0aFpXcml0ZVByaW1pdGl2ZXMubGVuZ3RoID4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBtZXNoIGhhcyBibGVuZC13aXRob3V0LXotd3JpdGUgcHJpbWl0aXZlcy5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiBibGVuZC13aXRob3V0LXotd3JpdGUgcHJpbWl0aXZlcyBleGlzdCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBwdWJsaWMgaXNFeGlzdEJsZW5kV2l0aG91dFpXcml0ZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fX2JsZW5kV2l0aG91dFpXcml0ZVByaW1pdGl2ZXMubGVuZ3RoID4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBwcmltaXRpdmUgYXQgdGhlIHNwZWNpZmllZCBpbmRleC5cbiAgICogQHBhcmFtIGkgLSBUaGUgaW5kZXggb2YgdGhlIHByaW1pdGl2ZSB0byByZXRyaWV2ZVxuICAgKiBAcmV0dXJucyBUaGUgcHJpbWl0aXZlIGF0IHRoZSBzcGVjaWZpZWQgaW5kZXhcbiAgICovXG4gIHB1YmxpYyBnZXRQcmltaXRpdmVBdChpOiBudW1iZXIpOiBQcmltaXRpdmUge1xuICAgIC8vIGlmICh0aGlzLndlaWdodHMubGVuZ3RoID4gMCkge1xuICAgIC8vIHJldHVybiB0aGlzLl9fbW9ycGhQcmltaXRpdmVzW2ldO1xuICAgIC8vIH0gZWxzZSB7XG4gICAgcmV0dXJuIHRoaXMuX19wcmltaXRpdmVzW2ldO1xuICAgIC8vIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB0b3RhbCBudW1iZXIgb2YgcHJpbWl0aXZlcyBpbiB0aGlzIG1lc2guXG4gICAqIEByZXR1cm5zIFRoZSBudW1iZXIgb2YgcHJpbWl0aXZlc1xuICAgKi9cbiAgcHVibGljIGdldFByaW1pdGl2ZU51bWJlcigpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9fcHJpbWl0aXZlcy5sZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGUgV2ViR0wgaW5zdGFuY2UgU0lEIHRleHR1cmUgcGF0aCAobXVsdGktZHJhdykgaXMgYWN0aXZlIGZvciB0aGlzIG1lc2guXG4gICAqL1xuICBwcml2YXRlIF9faXNJbnN0YW5jZVNpZFRleHR1cmVNb2RlKCk6IGJvb2xlYW4ge1xuICAgIGlmICghdGhpcy5fX2VuZ2luZS5jb25maWcuaXNNdWx0aURyYXdFbmFibGVkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLl9fZW5naW5lLmVuZ2luZVN0YXRlLmN1cnJlbnRQcm9jZXNzQXBwcm9hY2ggIT09IFByb2Nlc3NBcHByb2FjaC5XZWJHTDIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3Qgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGNvbnN0IGdsdyA9IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmN1cnJlbnRXZWJHTENvbnRleHRXcmFwcGVyO1xuICAgIHJldHVybiBnbHcgIT0gbnVsbCAmJiBnbHcud2ViZ2wyRXh0TUQgIT0gbnVsbCAmJiB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5pbnN0YW5jZVNpZFRhYmxlLmlzU3VwcG9ydGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuc3VyZXMgdGhhdCB0aGlzIG1lc2ggb3ducyBhIGNvbnRpZ3VvdXMgcmFuZ2Ugb2Ygc3RhYmxlIGluc3RhbmNlIHNsb3RzIGluIHRoZVxuICAgKiBlbmdpbmUtd2lkZSBpbnN0YW5jZSBTSUQgdGFibGUgYW5kIHdyaXRlcyB0aGUgaW5zdGFuY2UgaWRlbnRpdHkgcmVjb3Jkcy5cbiAgICogQHJldHVybnMgVGhlIGZpcnN0IHN0YWJsZSBzbG90IGluZGV4IChpbnN0YW5jZUJhc2UpLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9lbnN1cmVJbnN0YW5jZVNpZEJhc2UoKTogbnVtYmVyIHtcbiAgICBjb25zdCBjb3VudCA9IHRoaXMuX19iZWxvbmdUb0VudGl0aWVzLmxlbmd0aDtcbiAgICBjb25zdCB0YWJsZSA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuaW5zdGFuY2VTaWRUYWJsZTtcblxuICAgIGxldCBiYXNlID0gdGhpcy5fX2luc3RhbmNlU2lkQmFzZTtcbiAgICBpZiAoYmFzZSA8IDAgfHwgdGhpcy5fX2luc3RhbmNlU2lkQ291bnQgIT09IGNvdW50KSB7XG4gICAgICBpZiAoYmFzZSA+PSAwKSB7XG4gICAgICAgIHRhYmxlLmZyZWUoYmFzZSwgdGhpcy5fX2luc3RhbmNlU2lkQ291bnQpO1xuICAgICAgfVxuICAgICAgYmFzZSA9IHRhYmxlLmFsbG9jYXRlKGNvdW50KTtcbiAgICAgIHRoaXMuX19pbnN0YW5jZVNpZEJhc2UgPSBiYXNlO1xuICAgICAgdGhpcy5fX2luc3RhbmNlU2lkQ291bnQgPSBjb3VudDtcbiAgICAgIHRhYmxlLndyaXRlSWRlbnRpdHlSZW1hcChiYXNlLCBjb3VudCk7XG4gICAgfVxuXG4gICAgLy8gUmVmcmVzaCB0aGUgcmVjb3JkcyBldmVyeSB0aW1lOiBjb21wb25lbnQgU0lEcyBjYW4gY2hhbmdlIGV2ZW4gd2hlbiB0aGUgY291bnQgaXMgc3RhYmxlLlxuICAgIGNvbnN0IElOVkFMSURfSUQgPSAweGZmZmZfZmZmZjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IGVudGl0eSA9IHRoaXMuX19iZWxvbmdUb0VudGl0aWVzW2ldO1xuICAgICAgY29uc3QgY29tcG9uZW50U0lEID0gZW50aXR5LmdldFNjZW5lR3JhcGgoKS5jb21wb25lbnRTSUQ7XG4gICAgICBjb25zdCBza2VsZXRhbCA9IGVudGl0eS50cnlUb0dldFNrZWxldGFsKCk7XG4gICAgICBjb25zdCBibGVuZFNoYXBlID0gZW50aXR5LnRyeVRvR2V0QmxlbmRTaGFwZSgpO1xuICAgICAgdGFibGUuc2V0UmVjb3JkKFxuICAgICAgICBiYXNlICsgaSxcbiAgICAgICAgY29tcG9uZW50U0lELFxuICAgICAgICBza2VsZXRhbCAhPSBudWxsID8gc2tlbGV0YWwuY29tcG9uZW50U0lEIDogSU5WQUxJRF9JRCxcbiAgICAgICAgYmxlbmRTaGFwZSAhPSBudWxsID8gYmxlbmRTaGFwZS5jb21wb25lbnRTSUQgOiBJTlZBTElEX0lEXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBiYXNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGZpcnN0IHN0YWJsZSBpbnN0YW5jZSBzbG90IG9mIHRoaXMgbWVzaCAoV2ViR0wgbXVsdGktZHJhdykuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IF9pbnN0YW5jZVNpZEJhc2UoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX2luc3RhbmNlU2lkQmFzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWaXNpdCBzdGFtcCBvZiB0aGUgcGVyLXBhc3MgaW5zdGFuY2UgcHJlcGFzcyAoV2ViR0wgbXVsdGktZHJhdykuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IF9yZW1hcFByZXBhc3NJZCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9fcmVtYXBQcmVwYXNzSWQ7XG4gIH1cbiAgc2V0IF9yZW1hcFByZXBhc3NJZChpZDogbnVtYmVyKSB7XG4gICAgdGhpcy5fX3JlbWFwUHJlcGFzc0lkID0gaWQ7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgdmFyaWF0aW9uIFZCTyAoVmVydGV4IEJ1ZmZlciBPYmplY3QpIGZvciBpbnN0YW5jaW5nLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHVwZGF0ZWQsIGZhbHNlIGlmIG5vdCBjaGFuZ2VkIChub3QgZGlydHkpXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgdXBkYXRlVmFyaWF0aW9uVkJPKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy5fX2VuZ2luZS5jZ0FwaVJlc291cmNlUmVwb3NpdG9yeTtcblxuICAgIGlmICh0aGlzLl9fdmFyaWF0aW9uVkJPVWlkICE9PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkuZGVsZXRlVmVydGV4QnVmZmVyKHRoaXMuX192YXJpYXRpb25WQk9VaWQpO1xuICAgIH1cblxuICAgIGNvbnN0IElOVkFMSURfSUQgPSAweGZmZmZfZmZmZjtcbiAgICBjb25zdCBpbnN0YW5jZU51bSA9IHRoaXMuX19iZWxvbmdUb0VudGl0aWVzLmxlbmd0aDtcbiAgICAvLyBjb25zdCBlbnRpdHlJbmZvID0gbmV3IEZsb2F0MzJBcnJheShpbnN0YW5jZU51bSk7XG4gICAgY29uc3QgZW50aXR5SW5mbyA9IG5ldyBVaW50MzJBcnJheShpbnN0YW5jZU51bSAqIDQpO1xuICAgIGNvbnN0IGVudGl0eVVJRHMgPSBuZXcgSW50MzJBcnJheShpbnN0YW5jZU51bSk7XG4gICAgbGV0IGhhc1NrZWxldGFsSW5zdGFuY2UgPSBmYWxzZTtcbiAgICBsZXQgaGFzQmxlbmRTaGFwZUluc3RhbmNlID0gZmFsc2U7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnN0YW5jZU51bTsgaSsrKSB7XG4gICAgICBlbnRpdHlVSURzW2ldID0gdGhpcy5fX2JlbG9uZ1RvRW50aXRpZXNbaV0uZW50aXR5VUlEO1xuICAgICAgZW50aXR5SW5mb1s0ICogaSArIDBdID0gdGhpcy5fX2JlbG9uZ1RvRW50aXRpZXNbaV0uZ2V0U2NlbmVHcmFwaCgpLmNvbXBvbmVudFNJRDtcbiAgICAgIGNvbnN0IHNrZWxldGFsID0gdGhpcy5fX2JlbG9uZ1RvRW50aXRpZXNbaV0udHJ5VG9HZXRTa2VsZXRhbCgpO1xuICAgICAgaWYgKHNrZWxldGFsICE9IG51bGwpIHtcbiAgICAgICAgZW50aXR5SW5mb1s0ICogaSArIDFdID0gc2tlbGV0YWwuY29tcG9uZW50U0lEO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZW50aXR5SW5mb1s0ICogaSArIDFdID0gSU5WQUxJRF9JRDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGJsZW5kU2hhcGUgPSB0aGlzLl9fYmVsb25nVG9FbnRpdGllc1tpXS50cnlUb0dldEJsZW5kU2hhcGUoKTtcbiAgICAgIGlmIChibGVuZFNoYXBlICE9IG51bGwpIHtcbiAgICAgICAgZW50aXR5SW5mb1s0ICogaSArIDJdID0gYmxlbmRTaGFwZS5jb21wb25lbnRTSUQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbnRpdHlJbmZvWzQgKiBpICsgMl0gPSBJTlZBTElEX0lEO1xuICAgICAgfVxuICAgICAgaGFzU2tlbGV0YWxJbnN0YW5jZSB8fD0gc2tlbGV0YWwgIT0gbnVsbDtcbiAgICAgIGhhc0JsZW5kU2hhcGVJbnN0YW5jZSB8fD0gYmxlbmRTaGFwZSAhPSBudWxsO1xuICAgIH1cbiAgICB0aGlzLl9faGFzSW5zdGFuY2VzID0gaW5zdGFuY2VOdW0gPiAwO1xuICAgIHRoaXMuX19oYXNTa2VsZXRhbEluc3RhbmNlID0gaGFzU2tlbGV0YWxJbnN0YW5jZTtcbiAgICB0aGlzLl9faGFzQmxlbmRTaGFwZUluc3RhbmNlID0gaGFzQmxlbmRTaGFwZUluc3RhbmNlO1xuICAgIGlmICh0aGlzLl9faXNJbnN0YW5jZVNpZFRleHR1cmVNb2RlKCkpIHtcbiAgICAgIC8vIFRoZSBpbnN0YW5jZSBpZGVudGl0aWVzIGxpdmUgaW4gdGhlIGVuZ2luZS13aWRlIFNJRCB0YWJsZSBpbnN0ZWFkIG9mIGEgcGVyLW1lc2ggVkJPLlxuICAgICAgdGhpcy5fX3ZhcmlhdGlvblZCT1VpZCA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICAgICAgdGhpcy5fX3ZhcmlhdGlvbkVudGl0eUluZm8gPSBlbnRpdHlJbmZvO1xuICAgICAgdGhpcy5fX3ZhcmlhdGlvbkVudGl0eVVJRHMgPSBlbnRpdHlVSURzO1xuICAgICAgdGhpcy5fX3ZhcmlhdGlvblZCT0NvbnRlbnQgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9fcGFja2VkVmFyaWF0aW9uRW50aXR5SW5mbyA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuX192YXJpYXRpb25WQk9JbnN0YW5jZUNvdW50ID0gaW5zdGFuY2VOdW07XG4gICAgICB0aGlzLl9fdmFyaWF0aW9uVkJPQ3VsbGVkRW50aXR5U3RhbXAgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9fdmFyaWF0aW9uVkJPQ3VsbFRpY2sgPSAtMTtcbiAgICAgIHRoaXMuX2Vuc3VyZUluc3RhbmNlU2lkQmFzZSgpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgdGhpcy5fX3ZhcmlhdGlvblZCT1VpZCA9IGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5LmNyZWF0ZVZlcnRleEJ1ZmZlckZyb21UeXBlZEFycmF5KGVudGl0eUluZm8pO1xuICAgIHRoaXMuX192YXJpYXRpb25FbnRpdHlJbmZvID0gZW50aXR5SW5mbztcbiAgICB0aGlzLl9fdmFyaWF0aW9uRW50aXR5VUlEcyA9IGVudGl0eVVJRHM7XG4gICAgdGhpcy5fX3ZhcmlhdGlvblZCT0NvbnRlbnQgPSBlbnRpdHlJbmZvLnNsaWNlKCk7XG4gICAgdGhpcy5fX3BhY2tlZFZhcmlhdGlvbkVudGl0eUluZm8gPSBuZXcgVWludDMyQXJyYXkoZW50aXR5SW5mby5sZW5ndGgpO1xuICAgIHRoaXMuX192YXJpYXRpb25WQk9JbnN0YW5jZUNvdW50ID0gaW5zdGFuY2VOdW07XG4gICAgdGhpcy5fX3ZhcmlhdGlvblZCT0N1bGxlZEVudGl0eVN0YW1wID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX192YXJpYXRpb25WQk9DdWxsVGljayA9IC0xO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogUGFja3MgdGhlIGluc3RhbmNlIHZhcmlhdGlvbiBkYXRhIG9mIHRoZSBpbnN0YW5jZXMgdGhhdCB3ZXJlIG5vdCBjdWxsZWQgaW4gYSByZW5kZXIgcGFzc1xuICAgKiBpbnRvIHRoZSBmcm9udCBvZiB0aGUgdmFyaWF0aW9uIFZCTywgc28gdGhhdCBhbiBpbnN0YW5jZWQgZHJhdyBjYWxsIHJlbmRlcnMgb25seSB0aGVtLlxuICAgKiBUaGUgVkJPIGlzIHJld3JpdHRlbiBvbmx5IHdoZW4gaXRzIGNvbnRlbnQgY2hhbmdlcy4gV2ViR0wgb25seS5cbiAgICpcbiAgICogSW5zdGFuY2VzIHdob3NlIGVudGl0aWVzIGFyZSBub3QgaGFuZGxlZCBieSB0aGUgcmVuZGVyIHBhc3MncyBjdWxsaW5nIGtlZXAgYmVpbmcgZHJhd24uXG4gICAqXG4gICAqIEBwYXJhbSBjdWxsZWRFbnRpdHlTdGFtcCAtIFBlci1FbnRpdHlVSUQgc3RhbXBzIHdyaXR0ZW4gYnkgdGhlIGN1bGxpbmcgb2YgdGhlIHJlbmRlciBwYXNzXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICh1bmRlZmluZWQ6IGRyYXcgYWxsIHRoZSBpbnN0YW5jZXMpXG4gICAqIEBwYXJhbSBjdWxsVGljayAtIFRoZSBzdGFtcCB2YWx1ZSBvZiB0aGUgbGF0ZXN0IGN1bGxpbmcgb2YgdGhlIHJlbmRlciBwYXNzXG4gICAqIEByZXR1cm5zIFRoZSBudW1iZXIgb2YgdGhlIGluc3RhbmNlcyB0byBkcmF3XG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX3BhY2tWaXNpYmxlSW5zdGFuY2VzVG9WYXJpYXRpb25WQk8oY3VsbGVkRW50aXR5U3RhbXA6IFVpbnQzMkFycmF5IHwgdW5kZWZpbmVkLCBjdWxsVGljazogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBpZiAodGhpcy5fX2lzSW5zdGFuY2VTaWRUZXh0dXJlTW9kZSgpKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcGFja1Zpc2libGVJbnN0YW5jZXNUb0luc3RhbmNlUmVtYXAoY3VsbGVkRW50aXR5U3RhbXAsIGN1bGxUaWNrKTtcbiAgICB9XG4gICAgY29uc3QgZW50aXR5SW5mbyA9IHRoaXMuX192YXJpYXRpb25FbnRpdHlJbmZvO1xuICAgIGNvbnN0IGVudGl0eVVJRHMgPSB0aGlzLl9fdmFyaWF0aW9uRW50aXR5VUlEcztcbiAgICBjb25zdCB2Ym9Db250ZW50ID0gdGhpcy5fX3ZhcmlhdGlvblZCT0NvbnRlbnQ7XG4gICAgY29uc3QgcGFja2VkID0gdGhpcy5fX3BhY2tlZFZhcmlhdGlvbkVudGl0eUluZm87XG4gICAgaWYgKFxuICAgICAgZW50aXR5SW5mbyA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICBlbnRpdHlVSURzID09PSB1bmRlZmluZWQgfHxcbiAgICAgIHZib0NvbnRlbnQgPT09IHVuZGVmaW5lZCB8fFxuICAgICAgcGFja2VkID09PSB1bmRlZmluZWQgfHxcbiAgICAgIHRoaXMuX192YXJpYXRpb25WQk9VaWQgPT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkXG4gICAgKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2JlbG9uZ1RvRW50aXRpZXMubGVuZ3RoO1xuICAgIH1cblxuICAgIC8vIEFsbCB0aGUgcHJpbWl0aXZlcyBvZiB0aGlzIG1lc2ggc2hhcmUgdGhlIHZhcmlhdGlvbiBWQk8sIHNvIGl0IGlzIHBhY2tlZCBvbmNlIHBlciBjdWxsaW5nIHJlc3VsdC5cbiAgICBpZiAoY3VsbGVkRW50aXR5U3RhbXAgPT09IHRoaXMuX192YXJpYXRpb25WQk9DdWxsZWRFbnRpdHlTdGFtcCAmJiBjdWxsVGljayA9PT0gdGhpcy5fX3ZhcmlhdGlvblZCT0N1bGxUaWNrKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX3ZhcmlhdGlvblZCT0luc3RhbmNlQ291bnQ7XG4gICAgfVxuICAgIHRoaXMuX192YXJpYXRpb25WQk9DdWxsZWRFbnRpdHlTdGFtcCA9IGN1bGxlZEVudGl0eVN0YW1wO1xuICAgIHRoaXMuX192YXJpYXRpb25WQk9DdWxsVGljayA9IGN1bGxUaWNrO1xuXG4gICAgY29uc3QgaW5zdGFuY2VOdW0gPSBlbnRpdHlVSURzLmxlbmd0aDtcbiAgICBsZXQgY291bnQgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdGFuY2VOdW07IGkrKykge1xuICAgICAgaWYgKGN1bGxlZEVudGl0eVN0YW1wICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3QgZW50aXR5VUlEID0gZW50aXR5VUlEc1tpXTtcbiAgICAgICAgaWYgKGVudGl0eVVJRCA8IGN1bGxlZEVudGl0eVN0YW1wLmxlbmd0aCAmJiBjdWxsZWRFbnRpdHlTdGFtcFtlbnRpdHlVSURdID09PSBjdWxsVGljaykge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBzcmMgPSA0ICogaTtcbiAgICAgIGNvbnN0IGRzdCA9IDQgKiBjb3VudDtcbiAgICAgIHBhY2tlZFtkc3QgKyAwXSA9IGVudGl0eUluZm9bc3JjICsgMF07XG4gICAgICBwYWNrZWRbZHN0ICsgMV0gPSBlbnRpdHlJbmZvW3NyYyArIDFdO1xuICAgICAgcGFja2VkW2RzdCArIDJdID0gZW50aXR5SW5mb1tzcmMgKyAyXTtcbiAgICAgIHBhY2tlZFtkc3QgKyAzXSA9IGVudGl0eUluZm9bc3JjICsgM107XG4gICAgICBjb3VudCsrO1xuICAgIH1cblxuICAgIGNvbnN0IHBhY2tlZExlbmd0aCA9IDQgKiBjb3VudDtcbiAgICBsZXQgY2hhbmdlZCA9IGZhbHNlO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFja2VkTGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChwYWNrZWRbaV0gIT09IHZib0NvbnRlbnRbaV0pIHtcbiAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgY29uc3QgcGFja2VkRGF0YSA9IHBhY2tlZC5zdWJhcnJheSgwLCBwYWNrZWRMZW5ndGgpO1xuICAgICAgdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS51cGRhdGVWZXJ0ZXhCdWZmZXJXaXRoVHlwZWRBcnJheSh0aGlzLl9fdmFyaWF0aW9uVkJPVWlkLCBwYWNrZWREYXRhKTtcbiAgICAgIHZib0NvbnRlbnQuc2V0KHBhY2tlZERhdGEpO1xuICAgIH1cbiAgICB0aGlzLl9fdmFyaWF0aW9uVkJPSW5zdGFuY2VDb3VudCA9IGNvdW50O1xuXG4gICAgcmV0dXJuIGNvdW50O1xuICB9XG5cbiAgLyoqXG4gICAqIFBhY2tzIHRoZSB2aXNpYmxlIGluc3RhbmNlcyBpbnRvIHRoZSBlbmdpbmUtd2lkZSByZW1hcCB0YWJsZSBzbyB0aGF0IHRoZSBzaGFkZXIgY2FuXG4gICAqIHJlc29sdmUgYGluc3RhbmNlQmFzZSArIGdsX0luc3RhbmNlSURgIHRvIGEgc3RhYmxlIFNJRCBzbG90LiBXZWJHTCBtdWx0aS1kcmF3IG9ubHkuXG4gICAqXG4gICAqIEBwYXJhbSBjdWxsZWRFbnRpdHlTdGFtcCAtIFBlci1FbnRpdHlVSUQgc3RhbXBzIHdyaXR0ZW4gYnkgdGhlIHJlbmRlciBwYXNzIGN1bGxpbmdcbiAgICogQHBhcmFtIGN1bGxUaWNrIC0gVGhlIHN0YW1wIHZhbHVlIG9mIHRoZSBsYXRlc3QgY3VsbGluZyBvZiB0aGUgcmVuZGVyIHBhc3NcbiAgICogQHJldHVybnMgVGhlIG51bWJlciBvZiB2aXNpYmxlIGluc3RhbmNlc1xuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9wYWNrVmlzaWJsZUluc3RhbmNlc1RvSW5zdGFuY2VSZW1hcChjdWxsZWRFbnRpdHlTdGFtcDogVWludDMyQXJyYXkgfCB1bmRlZmluZWQsIGN1bGxUaWNrOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IGVudGl0eVVJRHMgPSB0aGlzLl9fdmFyaWF0aW9uRW50aXR5VUlEcztcbiAgICBpZiAoZW50aXR5VUlEcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2JlbG9uZ1RvRW50aXRpZXMubGVuZ3RoO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX2luc3RhbmNlU2lkQmFzZSA8IDApIHtcbiAgICAgIHRoaXMuX2Vuc3VyZUluc3RhbmNlU2lkQmFzZSgpO1xuICAgIH1cbiAgICBpZiAoY3VsbGVkRW50aXR5U3RhbXAgPT09IHRoaXMuX192YXJpYXRpb25WQk9DdWxsZWRFbnRpdHlTdGFtcCAmJiBjdWxsVGljayA9PT0gdGhpcy5fX3ZhcmlhdGlvblZCT0N1bGxUaWNrKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX3ZhcmlhdGlvblZCT0luc3RhbmNlQ291bnQ7XG4gICAgfVxuICAgIHRoaXMuX192YXJpYXRpb25WQk9DdWxsZWRFbnRpdHlTdGFtcCA9IGN1bGxlZEVudGl0eVN0YW1wO1xuICAgIHRoaXMuX192YXJpYXRpb25WQk9DdWxsVGljayA9IGN1bGxUaWNrO1xuXG4gICAgY29uc3QgdGFibGUgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5Lmluc3RhbmNlU2lkVGFibGU7XG4gICAgY29uc3QgYmFzZSA9IHRoaXMuX19pbnN0YW5jZVNpZEJhc2U7XG4gICAgY29uc3QgaW5zdGFuY2VOdW0gPSBlbnRpdHlVSURzLmxlbmd0aDtcbiAgICBsZXQgY291bnQgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdGFuY2VOdW07IGkrKykge1xuICAgICAgaWYgKGN1bGxlZEVudGl0eVN0YW1wICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3QgZW50aXR5VUlEID0gZW50aXR5VUlEc1tpXTtcbiAgICAgICAgaWYgKGVudGl0eVVJRCA8IGN1bGxlZEVudGl0eVN0YW1wLmxlbmd0aCAmJiBjdWxsZWRFbnRpdHlTdGFtcFtlbnRpdHlVSURdID09PSBjdWxsVGljaykge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0YWJsZS5zZXRSZW1hcChiYXNlICsgY291bnQsIGkpO1xuICAgICAgY291bnQrKztcbiAgICB9XG4gICAgdGhpcy5fX3ZhcmlhdGlvblZCT0luc3RhbmNlQ291bnQgPSBjb3VudDtcblxuICAgIHJldHVybiBjb3VudDtcbiAgfVxuXG4gIC8vL1xuICAvLy8gUHVibGljIFdlYkdMLXJlbGF0ZWQgTWV0aG9kc1xuICAvLy9cblxuICAvKipcbiAgICogRGVsZXRlcyB0aGUgdmFyaWF0aW9uIFZCTyAoVmVydGV4IEJ1ZmZlciBPYmplY3QpLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHVwZGF0ZWQsIGZhbHNlIGlmIG5vdCBjaGFuZ2VkIChub3QgZGlydHkpXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZGVsZXRlVmFyaWF0aW9uVkJPKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBpZiAodGhpcy5fX3ZhcmlhdGlvblZCT1VpZCAhPT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQpIHtcbiAgICAgIHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmRlbGV0ZVZlcnRleEJ1ZmZlcih0aGlzLl9fdmFyaWF0aW9uVkJPVWlkKTtcbiAgICAgIHRoaXMuX192YXJpYXRpb25WQk9VaWQgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgICAgIHRoaXMuX192YXJpYXRpb25FbnRpdHlJbmZvID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fX3ZhcmlhdGlvbkVudGl0eVVJRHMgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9fdmFyaWF0aW9uVkJPQ29udGVudCA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuX19wYWNrZWRWYXJpYXRpb25FbnRpdHlJbmZvID0gdW5kZWZpbmVkO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIFZBTyAoVmVydGV4IEFycmF5IE9iamVjdCkgZm9yIGFsbCBwcmltaXRpdmVzIGluIHRoaXMgbWVzaC5cbiAgICovXG4gIHB1YmxpYyB1cGRhdGVWQU8oKTogdm9pZCB7XG4gICAgY29uc3Qgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGlmICh3ZWJnbFJlc291cmNlUmVwb3NpdG9yeSA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gY3JlYXRlIGFuZCB1cGRhdGUgVkFPXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9fcHJpbWl0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJpbWl0aXZlID0gdGhpcy5fX3ByaW1pdGl2ZXNbaV07XG4gICAgICBjb25zdCBtdWx0aURyYXdHcm91cCA9IHByaW1pdGl2ZS5fbXVsdGlEcmF3R3JvdXA7XG4gICAgICBpZiAobXVsdGlEcmF3R3JvdXA/LnZlcnRleEhhbmRsZXMgIT0gbnVsbCkge1xuICAgICAgICAvLyBBbGwgbWVtYmVycyBvZiBhIG11bHRpLWRyYXcgZ3JvdXAgc2hhcmUgdGhlIGdyb3VwIFZBTy5cbiAgICAgICAgdGhpcy5fX3Zhb1VpZHNbaV0gPSBtdWx0aURyYXdHcm91cC52ZXJ0ZXhIYW5kbGVzLnZhb0hhbmRsZTtcbiAgICAgICAgdGhpcy5fX211bHRpRHJhd1Zhb0luZGljZXMuYWRkKGkpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHZlcnRleEhhbmRsZXMgPSBwcmltaXRpdmUudmVydGV4SGFuZGxlcyBhcyBWZXJ0ZXhIYW5kbGVzO1xuICAgICAgaWYgKElzLnVuZGVmaW5lZCh2ZXJ0ZXhIYW5kbGVzKSkge1xuICAgICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKCdOZWVkIHRvIGNyZWF0ZSAzREFQSVZlcnRleERhdGEgYmVmb3JlIHVwZGF0ZSBWQU8nKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgTnVtYmVyLmlzTmFOKHRoaXMuX192YW9VaWRzW2ldKSB8fFxuICAgICAgICB0aGlzLl9fdmFvVWlkc1tpXSA9PT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQgfHxcbiAgICAgICAgdmVydGV4SGFuZGxlcy52YW9IYW5kbGUgPT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkXG4gICAgICApIHtcbiAgICAgICAgdGhpcy5fX3Zhb1VpZHNbaV0gPSB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5jcmVhdGVWZXJ0ZXhBcnJheSgpITtcbiAgICAgICAgdmVydGV4SGFuZGxlcy52YW9IYW5kbGUgPSB0aGlzLl9fdmFvVWlkc1tpXTtcbiAgICAgIH1cblxuICAgICAgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuc2V0VmVydGV4RGF0YVRvUGlwZWxpbmUodmVydGV4SGFuZGxlcywgcHJpbWl0aXZlLCB0aGlzLl9fdmFyaWF0aW9uVkJPVWlkKTtcbiAgICB9XG5cbiAgICAvLyByZW1vdmUgdXNlbGVzcyBWQU8uIEdyb3VwIFZBT3MgYXJlIG93bmVkIGJ5IHRoZSBNdWx0aURyYXdSZXBvc2l0b3J5IGFuZCBtdXN0IG5vdCBiZSBkZWxldGVkIGhlcmUuXG4gICAgY29uc3QgbXVsdGlEcmF3UmVwb3NpdG9yeSA9IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmdldE11bHRpRHJhd1JlcG9zaXRvcnkodGhpcy5fX2VuZ2luZSk7XG4gICAgY29uc3QgcmVtb3ZlZEhhbmRsZXMgPSBuZXcgU2V0PENHQVBJUmVzb3VyY2VIYW5kbGU+KCk7XG4gICAgZm9yIChsZXQgaSA9IHRoaXMuX19wcmltaXRpdmVzLmxlbmd0aDsgaSA8IHRoaXMuX192YW9VaWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCB2YW9VaWQgPSB0aGlzLl9fdmFvVWlkc1tpXTtcbiAgICAgIGlmICh2YW9VaWQgJiYgIW11bHRpRHJhd1JlcG9zaXRvcnkuaGFzVmFvSGFuZGxlKHZhb1VpZCkpIHtcbiAgICAgICAgaWYgKCFyZW1vdmVkSGFuZGxlcy5oYXModmFvVWlkKSkge1xuICAgICAgICAgIHJlbW92ZWRIYW5kbGVzLmFkZCh2YW9VaWQpO1xuICAgICAgICAgIHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmRlbGV0ZVZlcnRleEFycmF5KHZhb1VpZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuX192YW9VaWRzW2ldID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZXMgYWxsIFZBTyAoVmVydGV4IEFycmF5IE9iamVjdCkgcmVzb3VyY2VzIGZvciB0aGlzIG1lc2guXG4gICAqIEdyb3VwIFZBT3MgYXJlIG93bmVkIGJ5IHRoZSBNdWx0aURyYXdSZXBvc2l0b3J5IGFuZCBhcmUgc2tpcHBlZC5cbiAgICovXG4gIHB1YmxpYyBkZWxldGVWQU8oKSB7XG4gICAgY29uc3Qgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGlmICh3ZWJnbFJlc291cmNlUmVwb3NpdG9yeSA9PSBudWxsKSB7XG4gICAgICB0aGlzLl9fdmFvVWlkcy5sZW5ndGggPSAwO1xuICAgICAgdGhpcy5fX211bHRpRHJhd1Zhb0luZGljZXMuY2xlYXIoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgbXVsdGlEcmF3UmVwb3NpdG9yeSA9IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmdldE11bHRpRHJhd1JlcG9zaXRvcnkodGhpcy5fX2VuZ2luZSk7XG4gICAgY29uc3QgZGVsZXRlZEhhbmRsZXMgPSBuZXcgU2V0PENHQVBJUmVzb3VyY2VIYW5kbGU+KCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9fdmFvVWlkcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgdmFvVWlkID0gdGhpcy5fX3Zhb1VpZHNbaV07XG4gICAgICBpZiAodmFvVWlkICYmICFkZWxldGVkSGFuZGxlcy5oYXModmFvVWlkKSAmJiAhbXVsdGlEcmF3UmVwb3NpdG9yeS5oYXNWYW9IYW5kbGUodmFvVWlkKSkge1xuICAgICAgICBkZWxldGVkSGFuZGxlcy5hZGQodmFvVWlkKTtcbiAgICAgICAgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuZGVsZXRlVmVydGV4QXJyYXkodmFvVWlkKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX192YW9VaWRzW2ldID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gICAgfVxuICAgIHRoaXMuX19tdWx0aURyYXdWYW9JbmRpY2VzLmNsZWFyKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIHRoZSBWQU8gZW50cmllcyB0aGF0IHBvaW50IGF0IG11bHRpLWRyYXcgZ3JvdXAgVkFPcy4gVGhlIGdyb3VwcyBvd24gdGhvc2VcbiAgICogVkFPcyBhbmQgZGVsZXRlIHRoZW0sIHNvIHRoZSBtZXNoIG11c3QgZm9yZ2V0IHRoZW0gYmVmb3JlIHRoZSBncm91cCBpcyByZWxlYXNlZC5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBfY2xlYXJNdWx0aURyYXdWYW9VaWRzKCk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgaW5kZXggb2YgdGhpcy5fX211bHRpRHJhd1Zhb0luZGljZXMpIHtcbiAgICAgIGlmIChpbmRleCA8IHRoaXMuX192YW9VaWRzLmxlbmd0aCkge1xuICAgICAgICB0aGlzLl9fdmFvVWlkc1tpbmRleF0gPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fX211bHRpRHJhd1Zhb0luZGljZXMuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtcyByYXkgY2FzdGluZyBhZ2FpbnN0IHRoaXMgbWVzaCB0byBmaW5kIGludGVyc2VjdGlvbiBwb2ludHMuXG4gICAqIEBwYXJhbSBzcmNQb2ludEluTG9jYWwgLSBUaGUgcmF5IG9yaWdpbiBwb2ludCBpbiBsb2NhbCBzcGFjZVxuICAgKiBAcGFyYW0gZGlyZWN0aW9uSW5Mb2NhbCAtIFRoZSByYXkgZGlyZWN0aW9uIGluIGxvY2FsIHNwYWNlXG4gICAqIEBwYXJhbSBkb3RUaHJlc2hvbGQgLSBUaGUgZG90IHByb2R1Y3QgdGhyZXNob2xkIGZvciBiYWNrLWZhY2UgY3VsbGluZyAoZGVmYXVsdDogMClcbiAgICogQHJldHVybnMgUmF5IGNhc3RpbmcgcmVzdWx0IHdpdGggaW50ZXJzZWN0aW9uIGluZm9ybWF0aW9uXG4gICAqL1xuICBwdWJsaWMgY2FzdFJheShzcmNQb2ludEluTG9jYWw6IElWZWN0b3IzLCBkaXJlY3Rpb25JbkxvY2FsOiBJVmVjdG9yMywgZG90VGhyZXNob2xkID0gMCk6IFJheWNhc3RSZXN1bHRFeDEge1xuICAgIGxldCBmaW5hbFNob3J0ZXN0SW50ZXJzZWN0ZWRQb3NWZWMzOiBJVmVjdG9yMyB8IHVuZGVmaW5lZDtcbiAgICBsZXQgZmluYWxTaG9ydGVzdFQgPSBOdW1iZXIuTUFYX1ZBTFVFO1xuICAgIGxldCB1ID0gMDtcbiAgICBsZXQgdiA9IDA7XG4gICAgZm9yIChjb25zdCBwcmltaXRpdmUgb2YgdGhpcy5fX3ByaW1pdGl2ZXMpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHByaW1pdGl2ZS5jYXN0UmF5KFxuICAgICAgICBzcmNQb2ludEluTG9jYWwsXG4gICAgICAgIGRpcmVjdGlvbkluTG9jYWwsXG4gICAgICAgIHRydWUsXG4gICAgICAgIHRydWUsXG4gICAgICAgIGRvdFRocmVzaG9sZCxcbiAgICAgICAgdGhpcy5fX2hhc0ZhY2VOb3JtYWxcbiAgICAgICk7XG4gICAgICBpZiAoSXMuZGVmaW5lZChyZXN1bHQuZGF0YSkgJiYgcmVzdWx0LmRhdGE/LnQgPCBmaW5hbFNob3J0ZXN0VCkge1xuICAgICAgICBmaW5hbFNob3J0ZXN0VCA9IHJlc3VsdC5kYXRhLnQ7XG4gICAgICAgIGZpbmFsU2hvcnRlc3RJbnRlcnNlY3RlZFBvc1ZlYzMgPSByZXN1bHQuZGF0YS5wb3NpdGlvbiE7XG4gICAgICAgIHUgPSByZXN1bHQuZGF0YS51O1xuICAgICAgICB2ID0gcmVzdWx0LmRhdGEudjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoSXMuZGVmaW5lZChmaW5hbFNob3J0ZXN0SW50ZXJzZWN0ZWRQb3NWZWMzKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdWx0OiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgdDogZmluYWxTaG9ydGVzdFQsXG4gICAgICAgICAgdSxcbiAgICAgICAgICB2LFxuICAgICAgICAgIHBvc2l0aW9uOiBmaW5hbFNob3J0ZXN0SW50ZXJzZWN0ZWRQb3NWZWMzLFxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3VsdDogZmFsc2UsXG4gICAgfTtcbiAgfVxuXG4gIC8vL1xuICAvLy9cbiAgLy8vIEFjY2Vzc29yc1xuICAvLy9cbiAgLy8vXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGFycmF5IG9mIHByaW1pdGl2ZXMgaW4gdGhpcyBtZXNoLlxuICAgKiBAcmV0dXJucyBBcnJheSBvZiBwcmltaXRpdmVzXG4gICAqL1xuICBnZXQgcHJpbWl0aXZlcygpIHtcbiAgICByZXR1cm4gdGhpcy5fX3ByaW1pdGl2ZXM7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoaXMgbWVzaC5cbiAgICogQHJldHVybnMgVGhlIG1lc2ggVUlEXG4gICAqL1xuICBnZXQgbWVzaFVJRCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX21lc2hVSUQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmFyaWF0aW9uIFZCTyBVSUQgZm9yIGludGVybmFsIHVzZS5cbiAgICogQHJldHVybnMgVGhlIHZhcmlhdGlvbiBWQk8gcmVzb3VyY2UgaGFuZGxlXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IF92YXJpYXRpb25WQk9VaWQoKTogQ0dBUElSZXNvdXJjZUhhbmRsZSB7XG4gICAgcmV0dXJuIHRoaXMuX192YXJpYXRpb25WQk9VaWQ7XG4gIH1cblxuICAvKipcbiAgICogVGhlIGluc3RhbmNlIHZhcmlhdGlvbiBkYXRhIG9mIHRoZSBpbnN0YW5jZXMsIGFzIHdyaXR0ZW4gdG8gdGhlIHZhcmlhdGlvbiBWQk8gYnkgYHVwZGF0ZVZhcmlhdGlvblZCT2A6XG4gICAqIGBbc2NlbmVHcmFwaFNJRCwgc2tlbGV0YWxTSUQsIGJsZW5kU2hhcGVTSUQsIDBdYCBwZXIgaW5zdGFuY2UsIGluIHRoZSBvcmRlciBvZiBgbWVzaEVudGl0aWVzSW5uZXJgLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGdldCBfdmFyaWF0aW9uRW50aXR5SW5mbygpOiBVaW50MzJBcnJheSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX192YXJpYXRpb25FbnRpdHlJbmZvO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGluc3RhbmNlcyBvZiB0aGlzIG1lc2ggY2FuIGJlIGN1bGxlZCBvbiB0aGUgR1BVIChXZWJHUFUgR1BVIGN1bGxpbmcpLlxuICAgKiBUaGUgYm91bmRpbmcgYm94ZXMgb2YgdGhlIGRlZm9ybWVkIGluc3RhbmNlcyAoc2tpbm5pbmcsIGJsZW5kIHNoYXBlcykgZGVwZW5kIG9uIHRoZSBkZWZvcm1hdGlvbjogdGhleSBhcmUgY3VsbGVkIG9uXG4gICAqIHRoZSBHUFUgb25seSB3aGVuIHRoZWlyIHZlcnRpY2VzIGFyZSBkZWZvcm1lZCBieSB0aGUgY29tcHV0ZSBzaGFkZXIgKGBDb25maWcuaXNDb21wdXRlU2tpbm5pbmdFbmFibGVkYCBhbmRcbiAgICogYF9pc0NvbXB1dGVEZWZvcm1hYmxlYCksIHdoaWNoIGNvbXB1dGVzIHRoZWlyIGJvdW5kaW5nIGJveGVzLiBPdGhlcndpc2UgdGhleSBhcmUgY3VsbGVkIG9uIHRoZSBDUFUuXG4gICAqIFVwZGF0ZWQgYnkgYHVwZGF0ZVZhcmlhdGlvblZCT2AuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IF9pc0dwdUN1bGxhYmxlKCk6IGJvb2xlYW4ge1xuICAgIGlmICghdGhpcy5fX2hhc0luc3RhbmNlcykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX25lZWRzQ29tcHV0ZURlZm9ybWF0aW9uKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX19lbmdpbmUuY29uZmlnLmlzQ29tcHV0ZVNraW5uaW5nRW5hYmxlZCAmJiB0aGlzLl9pc0NvbXB1dGVEZWZvcm1hYmxlO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIHZlcnRpY2VzIG9mIHRoZSBpbnN0YW5jZXMgYXJlIGRlZm9ybWVkIHdoZW4gZHJhd246IGFuIGluc3RhbmNlIGhhcyBhIHNrZWxldGFsIGNvbXBvbmVudCwgb3IgYSBibGVuZFxuICAgKiBzaGFwZSBjb21wb25lbnQgd2hpbGUgYSBwcmltaXRpdmUgaGFzIG1vcnBoIHRhcmdldHMuIFVwZGF0ZWQgYnkgYHVwZGF0ZVZhcmlhdGlvblZCT2AuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IF9uZWVkc0NvbXB1dGVEZWZvcm1hdGlvbigpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fX2hhc1NrZWxldGFsSW5zdGFuY2UpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX19oYXNCbGVuZFNoYXBlSW5zdGFuY2UpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9fcHJpbWl0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMuX19wcmltaXRpdmVzW2ldLnRhcmdldHMubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGNvbXB1dGUgc2hhZGVyIG9mIHRoZSBXZWJHUFUgR1BVIGN1bGxpbmcgY2FuIGRlZm9ybSB0aGUgdmVydGljZXMgb2YgdGhpcyBtZXNoIGxpa2UgdGhlIHZlcnRleCBzaGFkZXJzXG4gICAqIGRvIChwcm9jZXNzR2VvbWV0cnkpOiBldmVyeSBwcmltaXRpdmUgaGFzIGEgUE9TSVRJT04gYXR0cmlidXRlLCBwbHVzIEpPSU5UU18wIGFuZCBXRUlHSFRTXzAgd2hlbiBhbiBpbnN0YW5jZSBpc1xuICAgKiBza2lubmVkLCBhbmQgZXZlcnkgbW9ycGggdGFyZ2V0IGhhcyBhIFBPU0lUSU9OIGF0dHJpYnV0ZS5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBnZXQgX2lzQ29tcHV0ZURlZm9ybWFibGUoKTogYm9vbGVhbiB7XG4gICAgaWYgKFxuICAgICAgdGhpcy5fX2NvbXB1dGVEZWZvcm1hYmxlUHJpbWl0aXZlQ291bnQgPT09IHRoaXMuX19wcmltaXRpdmVzLmxlbmd0aCAmJlxuICAgICAgdGhpcy5fX2NvbXB1dGVEZWZvcm1hYmxlUG9zaXRpb25VcGRhdGVDb3VudCA9PT0gdGhpcy5fX3ByaW1pdGl2ZVBvc2l0aW9uVXBkYXRlQ291bnQgJiZcbiAgICAgIHRoaXMuX19jb21wdXRlRGVmb3JtYWJsZUhhc1NrZWxldGFsID09PSB0aGlzLl9faGFzU2tlbGV0YWxJbnN0YW5jZVxuICAgICkge1xuICAgICAgcmV0dXJuIHRoaXMuX19pc0NvbXB1dGVEZWZvcm1hYmxlO1xuICAgIH1cbiAgICB0aGlzLl9fY29tcHV0ZURlZm9ybWFibGVQcmltaXRpdmVDb3VudCA9IHRoaXMuX19wcmltaXRpdmVzLmxlbmd0aDtcbiAgICB0aGlzLl9fY29tcHV0ZURlZm9ybWFibGVQb3NpdGlvblVwZGF0ZUNvdW50ID0gdGhpcy5fX3ByaW1pdGl2ZVBvc2l0aW9uVXBkYXRlQ291bnQ7XG4gICAgdGhpcy5fX2NvbXB1dGVEZWZvcm1hYmxlSGFzU2tlbGV0YWwgPSB0aGlzLl9faGFzU2tlbGV0YWxJbnN0YW5jZTtcbiAgICB0aGlzLl9faXNDb21wdXRlRGVmb3JtYWJsZSA9IHRoaXMuX19jaGVja0NvbXB1dGVEZWZvcm1hYmxlKCk7XG4gICAgcmV0dXJuIHRoaXMuX19pc0NvbXB1dGVEZWZvcm1hYmxlO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2NoZWNrQ29tcHV0ZURlZm9ybWFibGUoKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX19wcmltaXRpdmVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBoYXNBdHRyaWJ1dGUgPSAoc2VtYW50aWNzOiBzdHJpbmdbXSwgbmFtZTogc3RyaW5nKSA9PiBzZW1hbnRpY3Muc29tZShzID0+IHMuc3BsaXQoJy4nKVswXSA9PT0gbmFtZSk7XG4gICAgZm9yIChjb25zdCBwcmltaXRpdmUgb2YgdGhpcy5fX3ByaW1pdGl2ZXMpIHtcbiAgICAgIGNvbnN0IHNlbWFudGljcyA9IHByaW1pdGl2ZS5hdHRyaWJ1dGVTZW1hbnRpY3M7XG4gICAgICBpZiAoIWhhc0F0dHJpYnV0ZShzZW1hbnRpY3MsICdQT1NJVElPTicpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5fX2hhc1NrZWxldGFsSW5zdGFuY2UgJiZcbiAgICAgICAgKCFoYXNBdHRyaWJ1dGUoc2VtYW50aWNzLCAnSk9JTlRTXzAnKSB8fCAhaGFzQXR0cmlidXRlKHNlbWFudGljcywgJ1dFSUdIVFNfMCcpKVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgdGFyZ2V0IG9mIHByaW1pdGl2ZS50YXJnZXRzKSB7XG4gICAgICAgIGxldCBoYXNQb3NpdGlvbiA9IGZhbHNlO1xuICAgICAgICBmb3IgKGNvbnN0IHNlbWFudGljIG9mIHRhcmdldC5rZXlzKCkpIHtcbiAgICAgICAgICBpZiAoc2VtYW50aWMuc3BsaXQoJy4nKVswXSA9PT0gJ1BPU0lUSU9OJykge1xuICAgICAgICAgICAgaGFzUG9zaXRpb24gPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWhhc1Bvc2l0aW9uKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCB3aGVuIHByaW1pdGl2ZSBwb3NpdGlvbiBkYXRhIGlzIHVwZGF0ZWQuXG4gICAqIFVwZGF0ZXMgdGhlIHBvc2l0aW9uIHVwZGF0ZSBjb3VudGVyIGFuZCBtb3ZlcyByZWxhdGVkIGVudGl0aWVzIHRvIExvYWQgc3RhZ2UuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX29uUHJpbWl0aXZlUG9zaXRpb25VcGRhdGVkKCkge1xuICAgIHRoaXMuX19wcmltaXRpdmVQb3NpdGlvblVwZGF0ZUNvdW50Kys7XG4gICAgTWVzaC5fX3ByaW1pdGl2ZVBvc2l0aW9uVXBkYXRlVmVyc2lvbisrO1xuICAgIGZvciAoY29uc3QgZW50aXR5IG9mIHRoaXMuX19iZWxvbmdUb0VudGl0aWVzKSB7XG4gICAgICBlbnRpdHkuZ2V0TWVzaFJlbmRlcmVyKCkubW92ZVN0YWdlVG8oUHJvY2Vzc1N0YWdlLkxvYWQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBwcmltaXRpdmUgcG9zaXRpb24gdXBkYXRlIGNvdW50LlxuICAgKiBAcmV0dXJucyBUaGUgbnVtYmVyIG9mIHRpbWVzIHByaW1pdGl2ZSBwb3NpdGlvbnMgaGF2ZSBiZWVuIHVwZGF0ZWRcbiAgICovXG4gIGdldCBwcmltaXRpdmVQb3NpdGlvblVwZGF0ZUNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLl9fcHJpbWl0aXZlUG9zaXRpb25VcGRhdGVDb3VudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIEFBQkIgaW4gbG9jYWwgc3BhY2UuXG4gICAqL1xuICBnZXQgQUFCQigpOiBBQUJCIHtcbiAgICBpZiAodGhpcy5fX3ByaW1pdGl2ZVBvc2l0aW9uVXBkYXRlQ291bnQgIT09IHRoaXMuX19sYXRlc3RQcmltaXRpdmVQb3NpdGlvbkFjY2Vzc29yVmVyc2lvbkZvckFBQkIpIHtcbiAgICAgIHRoaXMuX19sb2NhbEFBQkIuaW5pdGlhbGl6ZSgpO1xuICAgICAgdGhpcy5fX2xhdGVzdFByaW1pdGl2ZVBvc2l0aW9uQWNjZXNzb3JWZXJzaW9uRm9yQUFCQiA9IHRoaXMuX19wcmltaXRpdmVQb3NpdGlvblVwZGF0ZUNvdW50O1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9fbG9jYWxBQUJCLmlzVmFuaWxsYSgpKSB7XG4gICAgICBmb3IgKGNvbnN0IHByaW1pdGl2ZSBvZiB0aGlzLl9fcHJpbWl0aXZlcykge1xuICAgICAgICB0aGlzLl9fbG9jYWxBQUJCLm1lcmdlQUFCQihwcmltaXRpdmUuQUFCQik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX19sb2NhbEFBQkI7XG4gIH1cblxuICAvLy9cbiAgLy8vXG4gIC8vIEZyaWVuZCBNZW1iZXJzXG4gIC8vL1xuICAvLy9cblxuICAvLy9cbiAgLy8vXG4gIC8vLyBQcml2YXRlIE1lbWJlcnNcbiAgLy8vXG4gIC8vL1xuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIG1vcnBoIHRhcmdldCBwcmltaXRpdmVzIGJ5IGJsZW5kaW5nIHZlcnRleCBhdHRyaWJ1dGVzLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2NhbGNNb3JwaFByaW1pdGl2ZXMoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9fcHJpbWl0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbW9ycGhQcmltaXRpdmUgPSB0aGlzLl9fbW9ycGhQcmltaXRpdmVzW2ldO1xuICAgICAgY29uc3QgcHJpbWl0aXZlID0gdGhpcy5fX3ByaW1pdGl2ZXNbaV07XG4gICAgICBjb25zdCB0YXJnZXQwQXR0cmlidXRlcyA9IHByaW1pdGl2ZS50YXJnZXRzWzBdO1xuICAgICAgdGFyZ2V0MEF0dHJpYnV0ZXMuZm9yRWFjaCgoX2FjY2Vzc29yLCBzZW1hbnRpYykgPT4ge1xuICAgICAgICBjb25zdCBtb3JwaEFjY2Vzc29yID0gbW9ycGhQcmltaXRpdmUuZ2V0QXR0cmlidXRlKHNlbWFudGljKSE7XG4gICAgICAgIGNvbnN0IGVsZW1lbnRDb3VudCA9IG1vcnBoQWNjZXNzb3IuZWxlbWVudENvdW50O1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGVsZW1lbnRDb3VudDsgaisrKSB7XG4gICAgICAgICAgbW9ycGhBY2Nlc3Nvci5zZXRFbGVtZW50RnJvbVNhbWVDb21wb3NpdGlvbkFjY2Vzc29yKGosIHByaW1pdGl2ZS5nZXRBdHRyaWJ1dGUoc2VtYW50aWMpISk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBwcmltaXRpdmUudGFyZ2V0cy5mb3JFYWNoKCh0YXJnZXRBdHRyaWJ1dGVzLCBrKT0+e1xuICAgICAgLy8gICB0YXJnZXRBdHRyaWJ1dGVzLmZvckVhY2goKGFjY2Vzc29yLCBzZW1hbnRpYykgPT4ge1xuICAgICAgLy8gICAgIGNvbnN0IG1vcnBoQWNjZXNzb3IgPSBtb3JwaFByaW1pdGl2ZS5nZXRBdHRyaWJ1dGUoc2VtYW50aWMpITtcbiAgICAgIC8vICAgICBjb25zdCBlbGVtZW50Q291bnQgPSBtb3JwaEFjY2Vzc29yLmVsZW1lbnRDb3VudDtcbiAgICAgIC8vICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGVsZW1lbnRDb3VudDsgaisrKSB7XG4gICAgICAvLyAgICAgICBtb3JwaEFjY2Vzc29yLmFkZEVsZW1lbnRGcm9tU2FtZUNvbXBvc2l0aW9uQWNjZXNzb3IoaiwgYWNjZXNzb3IsIHRoaXMud2VpZ2h0c1trXSk7XG4gICAgICAvLyAgICAgfVxuICAgICAgLy8gICB9KTtcbiAgICAgIC8vIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9jYWxjVGFuZ2VudHMoKSB7XG4gICAgaWYgKCF0aGlzLl9fdXNlUHJlQ2FsY3VsYXRlZFRhbmdlbnQoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHByaW1pdGl2ZSBvZiB0aGlzLl9fcHJpbWl0aXZlcykge1xuICAgICAgY29uc3QgdGFuZ2VudElkeCA9IHByaW1pdGl2ZS5hdHRyaWJ1dGVTZW1hbnRpY3MuaW5kZXhPZihWZXJ0ZXhBdHRyaWJ1dGUuVGFuZ2VudC5YWVopO1xuICAgICAgaWYgKHRhbmdlbnRJZHggIT09IC0xICYmIHRoaXMudGFuZ2VudENhbGN1bGF0aW9uTW9kZSA9PT0gMikge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHRleGNvb3JkSWR4ID0gcHJpbWl0aXZlLmF0dHJpYnV0ZVNlbWFudGljcy5pbmRleE9mKFZlcnRleEF0dHJpYnV0ZS5UZXhjb29yZDAuWFkpO1xuICAgICAgY29uc3Qgbm9ybWFsSWR4ID0gcHJpbWl0aXZlLmF0dHJpYnV0ZVNlbWFudGljcy5pbmRleE9mKFZlcnRleEF0dHJpYnV0ZS5Ob3JtYWwuWFlaKTtcbiAgICAgIGlmICh0ZXhjb29yZElkeCAhPT0gLTEgJiYgbm9ybWFsSWR4ICE9PSAtMSkge1xuICAgICAgICBjb25zdCBwb3NpdGlvbklkeCA9IHByaW1pdGl2ZS5hdHRyaWJ1dGVTZW1hbnRpY3MuaW5kZXhPZihWZXJ0ZXhBdHRyaWJ1dGUuUG9zaXRpb24uWFlaKTtcblxuICAgICAgICBjb25zdCBwb3NpdGlvbkFjY2Vzc29yID0gcHJpbWl0aXZlLmF0dHJpYnV0ZUFjY2Vzc29yc1twb3NpdGlvbklkeF07XG4gICAgICAgIGNvbnN0IHRleGNvb3JkQWNjZXNzb3IgPSBwcmltaXRpdmUuYXR0cmlidXRlQWNjZXNzb3JzW3RleGNvb3JkSWR4XTtcbiAgICAgICAgY29uc3Qgbm9ybWFsQWNjZXNzb3IgPSBwcmltaXRpdmUuYXR0cmlidXRlQWNjZXNzb3JzW25vcm1hbElkeF07XG4gICAgICAgIGNvbnN0IGluZGljZXNBY2Nlc3NvciA9IHByaW1pdGl2ZS5pbmRpY2VzQWNjZXNzb3I7XG5cbiAgICAgICAgbGV0IGluY3JlbWVudE51bSA9IDM7IC8vIFByaW1pdGl2ZU1vZGUuVHJpYW5nbGVzXG4gICAgICAgIGlmIChcbiAgICAgICAgICBwcmltaXRpdmUucHJpbWl0aXZlTW9kZSA9PT0gUHJpbWl0aXZlTW9kZS5UcmlhbmdsZVN0cmlwIHx8XG4gICAgICAgICAgcHJpbWl0aXZlLnByaW1pdGl2ZU1vZGUgPT09IFByaW1pdGl2ZU1vZGUuVHJpYW5nbGVGYW5cbiAgICAgICAgKSB7XG4gICAgICAgICAgaW5jcmVtZW50TnVtID0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHZlcnRleE51bSA9IHByaW1pdGl2ZS5nZXRWZXJ0ZXhDb3VudEFzSW5kaWNlc0Jhc2VkKCk7XG4gICAgICAgIGNvbnN0IHRhbmdlbnRBdHRyaWJ1dGVCeXRlU2l6ZSA9IChwb3NpdGlvbkFjY2Vzc29yLmJ5dGVMZW5ndGggKiA0KSAvIDM7XG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMuX19lbmdpbmUubWVtb3J5TWFuYWdlci5jcmVhdGVCdWZmZXJPbkRlbWFuZChcbiAgICAgICAgICBCdWZmZXJVc2UuQ1BVR2VuZXJpYyxcbiAgICAgICAgICB0YW5nZW50QXR0cmlidXRlQnl0ZVNpemUsXG4gICAgICAgICAgNFxuICAgICAgICApO1xuICAgICAgICBjb25zdCB0YW5nZW50QnVmZmVyVmlldyA9IGJ1ZmZlclxuICAgICAgICAgIC50YWtlQnVmZmVyVmlldyh7XG4gICAgICAgICAgICBieXRlTGVuZ3RoVG9OZWVkOiB0YW5nZW50QXR0cmlidXRlQnl0ZVNpemUsXG4gICAgICAgICAgICBieXRlU3RyaWRlOiAwLFxuICAgICAgICAgIH0pXG4gICAgICAgICAgLnVud3JhcEZvcmNlKCk7XG4gICAgICAgIGNvbnN0IHRhbmdlbnRBY2Nlc3NvciA9IHRhbmdlbnRCdWZmZXJWaWV3XG4gICAgICAgICAgLnRha2VBY2Nlc3Nvcih7XG4gICAgICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWM0LFxuICAgICAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgICAgICAgIGNvdW50OiBwb3NpdGlvbkFjY2Vzc29yLmVsZW1lbnRDb3VudCxcbiAgICAgICAgICB9KVxuICAgICAgICAgIC51bndyYXBGb3JjZSgpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZlcnRleE51bSAtIDI7IGkgKz0gaW5jcmVtZW50TnVtKSB7XG4gICAgICAgICAgY29uc3QgcG9zMCA9IHBvc2l0aW9uQWNjZXNzb3IuZ2V0VmVjMyhpLCB7IGluZGljZXNBY2Nlc3NvciB9KTtcbiAgICAgICAgICBjb25zdCBwb3MxID0gcG9zaXRpb25BY2Nlc3Nvci5nZXRWZWMzKGkgKyAxLCB7IGluZGljZXNBY2Nlc3NvciB9KTtcbiAgICAgICAgICBjb25zdCBwb3MyID0gcG9zaXRpb25BY2Nlc3Nvci5nZXRWZWMzKGkgKyAyLCB7IGluZGljZXNBY2Nlc3NvciB9KTtcbiAgICAgICAgICBjb25zdCB1djAgPSB0ZXhjb29yZEFjY2Vzc29yLmdldFZlYzIoaSwgeyBpbmRpY2VzQWNjZXNzb3IgfSk7XG4gICAgICAgICAgY29uc3QgdXYxID0gdGV4Y29vcmRBY2Nlc3Nvci5nZXRWZWMyKGkgKyAxLCB7IGluZGljZXNBY2Nlc3NvciB9KTtcbiAgICAgICAgICBjb25zdCB1djIgPSB0ZXhjb29yZEFjY2Vzc29yLmdldFZlYzIoaSArIDIsIHsgaW5kaWNlc0FjY2Vzc29yIH0pO1xuICAgICAgICAgIGNvbnN0IG5vcm0wID0gbm9ybWFsQWNjZXNzb3IuZ2V0VmVjMyhpLCB7IGluZGljZXNBY2Nlc3NvciB9KTtcblxuICAgICAgICAgIHRoaXMuX19jYWxjVGFuZ2VudEZvcjNWZXJ0aWNlcyhpLCBwb3MwLCBwb3MxLCBwb3MyLCB1djAsIHV2MSwgdXYyLCBub3JtMCwgdGFuZ2VudEFjY2Vzc29yLCBpbmRpY2VzQWNjZXNzb3IpO1xuICAgICAgICB9XG4gICAgICAgIHByaW1pdGl2ZS5zZXRWZXJ0ZXhBdHRyaWJ1dGUodGFuZ2VudEFjY2Vzc29yLCBWZXJ0ZXhBdHRyaWJ1dGUuVGFuZ2VudC5YWVopO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRhbmdlbnQgdmVjdG9ycyBmb3IgYSB0cmlhbmdsZSBjb25zaXN0aW5nIG9mIDMgdmVydGljZXMuXG4gICAqIEBwYXJhbSBpIC0gVGhlIHN0YXJ0aW5nIHZlcnRleCBpbmRleFxuICAgKiBAcGFyYW0gcG9zMCAtIFBvc2l0aW9uIG9mIHRoZSBmaXJzdCB2ZXJ0ZXhcbiAgICogQHBhcmFtIHBvczEgLSBQb3NpdGlvbiBvZiB0aGUgc2Vjb25kIHZlcnRleFxuICAgKiBAcGFyYW0gcG9zMiAtIFBvc2l0aW9uIG9mIHRoZSB0aGlyZCB2ZXJ0ZXhcbiAgICogQHBhcmFtIHV2MCAtIFVWIGNvb3JkaW5hdGVzIG9mIHRoZSBmaXJzdCB2ZXJ0ZXhcbiAgICogQHBhcmFtIHV2MSAtIFVWIGNvb3JkaW5hdGVzIG9mIHRoZSBzZWNvbmQgdmVydGV4XG4gICAqIEBwYXJhbSB1djIgLSBVViBjb29yZGluYXRlcyBvZiB0aGUgdGhpcmQgdmVydGV4XG4gICAqIEBwYXJhbSBub3JtMCAtIE5vcm1hbCB2ZWN0b3Igb2YgdGhlIGZpcnN0IHZlcnRleFxuICAgKiBAcGFyYW0gdGFuZ2VudEFjY2Vzc29yIC0gQWNjZXNzb3IgZm9yIHdyaXRpbmcgdGFuZ2VudCBkYXRhXG4gICAqIEBwYXJhbSBpbmRpY2VzQWNjZXNzb3IgLSBPcHRpb25hbCBpbmRpY2VzIGFjY2Vzc29yXG4gICAqIEBwcml2YXRlXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBfX2NhbGNUYW5nZW50Rm9yM1ZlcnRpY2VzKFxuICAgIGk6IEluZGV4LFxuICAgIHBvczA6IFZlY3RvcjMsXG4gICAgcG9zMTogVmVjdG9yMyxcbiAgICBwb3MyOiBWZWN0b3IzLFxuICAgIHV2MDogVmVjdG9yMixcbiAgICB1djE6IFZlY3RvcjIsXG4gICAgdXYyOiBWZWN0b3IyLFxuICAgIG5vcm0wOiBWZWN0b3IzLFxuICAgIHRhbmdlbnRBY2Nlc3NvcjogQWNjZXNzb3IsXG4gICAgaW5kaWNlc0FjY2Vzc29yPzogQWNjZXNzb3JcbiAgKSB7XG4gICAgY29uc3QgdGFuMFZlYzMgPSB0aGlzLl9fY2FsY1RhbmdlbnRQZXJWZXJ0ZXgocG9zMCwgcG9zMSwgcG9zMiwgdXYwLCB1djEsIHV2Miwgbm9ybTAsIE1lc2guX190bXBSZXR1cm5WZWMzXzApO1xuICAgIGNvbnN0IHRhbjFWZWMzID0gdGhpcy5fX2NhbGNUYW5nZW50UGVyVmVydGV4KHBvczEsIHBvczIsIHBvczAsIHV2MSwgdXYyLCB1djAsIG5vcm0wLCBNZXNoLl9fdG1wUmV0dXJuVmVjM18xKTtcbiAgICBjb25zdCB0YW4yVmVjMyA9IHRoaXMuX19jYWxjVGFuZ2VudFBlclZlcnRleChwb3MyLCBwb3MwLCBwb3MxLCB1djIsIHV2MCwgdXYxLCBub3JtMCwgTWVzaC5fX3RtcFJldHVyblZlYzNfMik7XG5cbiAgICB0YW5nZW50QWNjZXNzb3Iuc2V0VmVjNChpLCB0YW4wVmVjMy54LCB0YW4wVmVjMy55LCB0YW4wVmVjMy56LCAxLCB7XG4gICAgICBpbmRpY2VzQWNjZXNzb3IsXG4gICAgfSk7XG4gICAgdGFuZ2VudEFjY2Vzc29yLnNldFZlYzQoaSArIDEsIHRhbjFWZWMzLngsIHRhbjFWZWMzLnksIHRhbjFWZWMzLnosIDEsIHtcbiAgICAgIGluZGljZXNBY2Nlc3NvcixcbiAgICB9KTtcbiAgICB0YW5nZW50QWNjZXNzb3Iuc2V0VmVjNChpICsgMiwgdGFuMlZlYzMueCwgdGFuMlZlYzMueSwgdGFuMlZlYzMueiwgMSwge1xuICAgICAgaW5kaWNlc0FjY2Vzc29yLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIHRhbmdlbnQgdmVjdG9yIGZvciBhIHNpbmdsZSB2ZXJ0ZXguXG4gICAqIEBwYXJhbSBwb3MwVmVjMyAtIFBvc2l0aW9uIG9mIHRoZSB0YXJnZXQgdmVydGV4XG4gICAqIEBwYXJhbSBwb3MxVmVjMyAtIFBvc2l0aW9uIG9mIHRoZSBzZWNvbmQgdmVydGV4XG4gICAqIEBwYXJhbSBwb3MyVmVjMyAtIFBvc2l0aW9uIG9mIHRoZSB0aGlyZCB2ZXJ0ZXhcbiAgICogQHBhcmFtIHV2MFZlYzIgLSBVViBjb29yZGluYXRlcyBvZiB0aGUgdGFyZ2V0IHZlcnRleFxuICAgKiBAcGFyYW0gdXYxVmVjMiAtIFVWIGNvb3JkaW5hdGVzIG9mIHRoZSBzZWNvbmQgdmVydGV4XG4gICAqIEBwYXJhbSB1djJWZWMyIC0gVVYgY29vcmRpbmF0ZXMgb2YgdGhlIHRoaXJkIHZlcnRleFxuICAgKiBAcGFyYW0gbm9ybTBWZWMzIC0gTm9ybWFsIHZlY3RvciBvZiB0aGUgdGFyZ2V0IHZlcnRleFxuICAgKiBAcGFyYW0gcmV0dXJuVmVjMyAtIE11dGFibGUgdmVjdG9yIHRvIHN0b3JlIHRoZSByZXN1bHRcbiAgICogQHJldHVybnMgVGhlIGNhbGN1bGF0ZWQgdGFuZ2VudCB2ZWN0b3JcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX19jYWxjVGFuZ2VudFBlclZlcnRleChcbiAgICBwb3MwVmVjMzogVmVjdG9yMyxcbiAgICBwb3MxVmVjMzogVmVjdG9yMyxcbiAgICBwb3MyVmVjMzogVmVjdG9yMyxcbiAgICB1djBWZWMyOiBWZWN0b3IyLFxuICAgIHV2MVZlYzI6IFZlY3RvcjIsXG4gICAgdXYyVmVjMjogVmVjdG9yMixcbiAgICBub3JtMFZlYzM6IFZlY3RvcjMsXG4gICAgcmV0dXJuVmVjMzogTXV0YWJsZVZlY3RvcjNcbiAgKSB7XG4gICAgY29uc3QgY3AwID0gW1xuICAgICAgTWVzaC5fX3RtcFZlYzNfMC5zZXRDb21wb25lbnRzKHBvczBWZWMzLngsIHV2MFZlYzIueCwgdXYwVmVjMi55KSxcbiAgICAgIE1lc2guX190bXBWZWMzXzEuc2V0Q29tcG9uZW50cyhwb3MwVmVjMy55LCB1djBWZWMyLngsIHV2MFZlYzIueSksXG4gICAgICBNZXNoLl9fdG1wVmVjM18yLnNldENvbXBvbmVudHMocG9zMFZlYzMueiwgdXYwVmVjMi54LCB1djBWZWMyLnkpLFxuICAgIF07XG5cbiAgICBjb25zdCBjcDEgPSBbXG4gICAgICBNZXNoLl9fdG1wVmVjM18zLnNldENvbXBvbmVudHMocG9zMVZlYzMueCwgdXYxVmVjMi54LCB1djFWZWMyLnkpLFxuICAgICAgTWVzaC5fX3RtcFZlYzNfNC5zZXRDb21wb25lbnRzKHBvczFWZWMzLnksIHV2MVZlYzIueCwgdXYxVmVjMi55KSxcbiAgICAgIE1lc2guX190bXBWZWMzXzUuc2V0Q29tcG9uZW50cyhwb3MxVmVjMy56LCB1djFWZWMyLngsIHV2MVZlYzIueSksXG4gICAgXTtcblxuICAgIGNvbnN0IGNwMiA9IFtcbiAgICAgIE1lc2guX190bXBWZWMzXzYuc2V0Q29tcG9uZW50cyhwb3MyVmVjMy54LCB1djJWZWMyLngsIHV2MlZlYzIueSksXG4gICAgICBNZXNoLl9fdG1wVmVjM183LnNldENvbXBvbmVudHMocG9zMlZlYzMueSwgdXYyVmVjMi54LCB1djJWZWMyLnkpLFxuICAgICAgTWVzaC5fX3RtcFZlYzNfOC5zZXRDb21wb25lbnRzKHBvczJWZWMzLnosIHV2MlZlYzIueCwgdXYyVmVjMi55KSxcbiAgICBdO1xuXG4gICAgY29uc3QgdSA9IFtdO1xuICAgIGNvbnN0IHYgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICBjb25zdCB2MSA9IE11dGFibGVWZWN0b3IzLnN1YnRyYWN0VG8oY3AxW2ldLCBjcDBbaV0sIE1lc2guX190bXBWZWMzXzkpO1xuICAgICAgY29uc3QgdjIgPSBNdXRhYmxlVmVjdG9yMy5zdWJ0cmFjdFRvKGNwMltpXSwgY3AxW2ldLCBNZXNoLl9fdG1wVmVjM18xMCk7XG4gICAgICBjb25zdCBhYmMgPSBNdXRhYmxlVmVjdG9yMy5jcm9zc1RvKHYxLCB2MiwgTWVzaC5fX3RtcFZlYzNfMTEpO1xuXG4gICAgICBjb25zdCB2YWxpZGF0ZSA9IE1hdGguYWJzKGFiYy54KSA8IE51bWJlci5FUFNJTE9OO1xuICAgICAgaWYgKHZhbGlkYXRlKSB7XG4gICAgICAgIExvZ2dlci5kZWZhdWx0LmFzc2VydCh2YWxpZGF0ZSwgJ1BvbHlnb25zIG9yIHBvbHlnb25zIG9uIFVWIGFyZSBkZWdlbmVyYXRlIScpO1xuICAgICAgICByZXR1cm4gVmVjdG9yMy5mcm9tQ29weUFycmF5KFswLCAwLCAwXSk7XG4gICAgICB9XG5cbiAgICAgIHVbaV0gPSAtYWJjLnkgLyBhYmMueDtcbiAgICAgIHZbaV0gPSAtYWJjLnogLyBhYmMueDtcbiAgICB9XG5cbiAgICBpZiAodVswXSAqIHVbMF0gKyB1WzFdICogdVsxXSArIHVbMl0gKiB1WzJdIDwgTnVtYmVyLkVQU0lMT04pIHtcbiAgICAgIE11dGFibGVWZWN0b3IzLmNyb3NzVG8obm9ybTBWZWMzLCBwb3MxVmVjMywgcmV0dXJuVmVjMyk7XG4gICAgICByZXR1cm4gcmV0dXJuVmVjMy5ub3JtYWxpemUoKSBhcyBWZWN0b3IzO1xuICAgIH1cblxuICAgIHJldHVybiByZXR1cm5WZWMzLnNldENvbXBvbmVudHModVswXSwgdVsxXSwgdVsyXSkubm9ybWFsaXplKCkgYXMgVmVjdG9yMztcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgdG8gdXNlIHByZS1jYWxjdWxhdGVkIHRhbmdlbnQgdmVjdG9ycyBiYXNlZCBvbiB0aGUgdGFuZ2VudCBjYWxjdWxhdGlvbiBtb2RlLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRhbmdlbnQgdmVjdG9ycyBzaG91bGQgYmUgcHJlLWNhbGN1bGF0ZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX3VzZVByZUNhbGN1bGF0ZWRUYW5nZW50KCkge1xuICAgIGlmICh0aGlzLnRhbmdlbnRDYWxjdWxhdGlvbk1vZGUgPT09IDAgfHwgdGhpcy50YW5nZW50Q2FsY3VsYXRpb25Nb2RlID09PSAxIHx8IHRoaXMudGFuZ2VudENhbGN1bGF0aW9uTW9kZSA9PT0gMykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIGJhcnljZW50cmljIGNvb3JkaW5hdGVzIGZvciBhbGwgcHJpbWl0aXZlcyBpbiB0aGlzIG1lc2guXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2NhbGNCYXJ5Q2VudHJpY0Nvb3JkKCkge1xuICAgIGZvciAoY29uc3QgcHJpbWl0aXZlIG9mIHRoaXMuX19wcmltaXRpdmVzKSB7XG4gICAgICBjb25zdCBiYXJ5Q2VudHJpY0Nvb3JkQWNjZXNzb3IgPSBwcmltaXRpdmUuZ2V0QXR0cmlidXRlKFZlcnRleEF0dHJpYnV0ZS5CYXJ5Q2VudHJpY0Nvb3JkLlhZWik7XG4gICAgICBpZiAoYmFyeUNlbnRyaWNDb29yZEFjY2Vzc29yICE9IG51bGwpIHtcbiAgICAgICAgY29uc3QgcG9zaXRpb25JZHggPSBwcmltaXRpdmUuYXR0cmlidXRlU2VtYW50aWNzLmluZGV4T2YoVmVydGV4QXR0cmlidXRlLlBvc2l0aW9uLlhZWik7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uQWNjZXNzb3IgPSBwcmltaXRpdmUuYXR0cmlidXRlQWNjZXNzb3JzW3Bvc2l0aW9uSWR4XTtcbiAgICAgICAgY29uc3QgdmVydGV4TnVtID0gcG9zaXRpb25BY2Nlc3Nvci5lbGVtZW50Q291bnQ7XG4gICAgICAgIGNvbnN0IG51bSA9IHZlcnRleE51bTtcbiAgICAgICAgZm9yIChsZXQgdmVyX2kgPSAwOyB2ZXJfaSA8IG51bTsgdmVyX2krKykge1xuICAgICAgICAgIGNvbnN0IHZlYzQgPSBiYXJ5Q2VudHJpY0Nvb3JkQWNjZXNzb3IuZ2V0VmVjNCh2ZXJfaSwge30pO1xuICAgICAgICAgIGJhcnlDZW50cmljQ29vcmRBY2Nlc3Nvci5zZXRWZWM0KFxuICAgICAgICAgICAgdmVyX2ksXG4gICAgICAgICAgICB2ZXJfaSAlIDMgPT09IDAgPyAxIDogMCwgLy8gMSAwIDAgIDEgMCAwICAxIDAgMCxcbiAgICAgICAgICAgIHZlcl9pICUgMyA9PT0gMSA/IDEgOiAwLCAvLyAwIDEgMCAgMCAxIDAgIDAgMSAwLFxuICAgICAgICAgICAgdmVyX2kgJSAzID09PSAyID8gMSA6IDAsIC8vIDAgMCAxICAwIDAgMSAgMCAwIDEsXG4gICAgICAgICAgICB2ZWM0LncsXG4gICAgICAgICAgICB7fVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uSWR4ID0gcHJpbWl0aXZlLmF0dHJpYnV0ZVNlbWFudGljcy5pbmRleE9mKFZlcnRleEF0dHJpYnV0ZS5Qb3NpdGlvbi5YWVopO1xuICAgICAgICBjb25zdCBwb3NpdGlvbkFjY2Vzc29yID0gcHJpbWl0aXZlLmF0dHJpYnV0ZUFjY2Vzc29yc1twb3NpdGlvbklkeF07XG4gICAgICAgIGNvbnN0IHZlcnRleE51bSA9IHBvc2l0aW9uQWNjZXNzb3IuZWxlbWVudENvdW50O1xuICAgICAgICBjb25zdCBudW0gPSB2ZXJ0ZXhOdW07XG5cbiAgICAgICAgY29uc3QgYmFyeUNlbnRyaWNDb29yZEF0dHJpYnV0ZUJ5dGVTaXplID0gbnVtICogNCAvKiB2ZWM0ICovICogNDsgLyogYnl0ZXMgKi9cbiAgICAgICAgY29uc3QgYnVmZmVyID0gdGhpcy5fX2VuZ2luZS5tZW1vcnlNYW5hZ2VyLmNyZWF0ZUJ1ZmZlck9uRGVtYW5kKFxuICAgICAgICAgIEJ1ZmZlclVzZS5DUFVHZW5lcmljLFxuICAgICAgICAgIGJhcnlDZW50cmljQ29vcmRBdHRyaWJ1dGVCeXRlU2l6ZSxcbiAgICAgICAgICA0XG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IGJhcnlDZW50cmljQ29vcmRCdWZmZXJWaWV3ID0gYnVmZmVyXG4gICAgICAgICAgLnRha2VCdWZmZXJWaWV3KHtcbiAgICAgICAgICAgIGJ5dGVMZW5ndGhUb05lZWQ6IGJhcnlDZW50cmljQ29vcmRBdHRyaWJ1dGVCeXRlU2l6ZSxcbiAgICAgICAgICAgIGJ5dGVTdHJpZGU6IDAsXG4gICAgICAgICAgfSlcbiAgICAgICAgICAudW53cmFwRm9yY2UoKTtcbiAgICAgICAgY29uc3QgYmFyeUNlbnRyaWNDb29yZEFjY2Vzc29yID0gYmFyeUNlbnRyaWNDb29yZEJ1ZmZlclZpZXdcbiAgICAgICAgICAudGFrZUFjY2Vzc29yKHtcbiAgICAgICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlZlYzQsXG4gICAgICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgICAgICAgICAgY291bnQ6IG51bSxcbiAgICAgICAgICB9KVxuICAgICAgICAgIC51bndyYXBGb3JjZSgpO1xuXG4gICAgICAgIGZvciAobGV0IHZlcl9pID0gMDsgdmVyX2kgPCBudW07IHZlcl9pKyspIHtcbiAgICAgICAgICBiYXJ5Q2VudHJpY0Nvb3JkQWNjZXNzb3Iuc2V0VmVjNChcbiAgICAgICAgICAgIHZlcl9pLFxuICAgICAgICAgICAgdmVyX2kgJSAzID09PSAwID8gMSA6IDAsIC8vIDEgMCAwICAxIDAgMCAgMSAwIDAsXG4gICAgICAgICAgICB2ZXJfaSAlIDMgPT09IDEgPyAxIDogMCwgLy8gMCAxIDAgIDAgMSAwICAwIDEgMCxcbiAgICAgICAgICAgIHZlcl9pICUgMyA9PT0gMiA/IDEgOiAwLCAvLyAwIDAgMSAgMCAwIDEgIDAgMCAxLFxuICAgICAgICAgICAgdmVyX2ksXG4gICAgICAgICAgICB7fVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgcHJpbWl0aXZlLnNldFZlcnRleEF0dHJpYnV0ZShiYXJ5Q2VudHJpY0Nvb3JkQWNjZXNzb3IsIFZlcnRleEF0dHJpYnV0ZS5CYXJ5Q2VudHJpY0Nvb3JkLlhZWik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgZmFjZSBub3JtYWxzIGZvciBwcmltaXRpdmVzIHRoYXQgZG9uJ3QgaGF2ZSBub3JtYWwgYXR0cmlidXRlcy5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBfY2FsY0ZhY2VOb3JtYWxzSWZOb25Ob3JtYWwoKSB7XG4gICAgZm9yIChjb25zdCBwcmltaXRpdmUgb2YgdGhpcy5fX3ByaW1pdGl2ZXMpIHtcbiAgICAgIGNvbnN0IG5vcm1hbElkeCA9IHByaW1pdGl2ZS5hdHRyaWJ1dGVTZW1hbnRpY3MuaW5kZXhPZihWZXJ0ZXhBdHRyaWJ1dGUuTm9ybWFsLlhZWik7XG4gICAgICBpZiAobm9ybWFsSWR4ICE9PSAtMSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX19oYXNGYWNlTm9ybWFsID0gdHJ1ZTtcblxuICAgICAgY29uc3QgcG9zaXRpb25JZHggPSBwcmltaXRpdmUuYXR0cmlidXRlU2VtYW50aWNzLmluZGV4T2YoVmVydGV4QXR0cmlidXRlLlBvc2l0aW9uLlhZWik7XG4gICAgICBjb25zdCBwb3NpdGlvbkFjY2Vzc29yID0gcHJpbWl0aXZlLmF0dHJpYnV0ZUFjY2Vzc29yc1twb3NpdGlvbklkeF07XG4gICAgICBjb25zdCBpbmRpY2VzQWNjZXNzb3IgPSBwcmltaXRpdmUuaW5kaWNlc0FjY2Vzc29yO1xuXG4gICAgICBsZXQgaW5jcmVtZW50TnVtID0gMzsgLy8gUHJpbWl0aXZlTW9kZS5UcmlhbmdsZXNcbiAgICAgIGlmIChcbiAgICAgICAgcHJpbWl0aXZlLnByaW1pdGl2ZU1vZGUgPT09IFByaW1pdGl2ZU1vZGUuVHJpYW5nbGVTdHJpcCB8fFxuICAgICAgICBwcmltaXRpdmUucHJpbWl0aXZlTW9kZSA9PT0gUHJpbWl0aXZlTW9kZS5UcmlhbmdsZUZhblxuICAgICAgKSB7XG4gICAgICAgIGluY3JlbWVudE51bSA9IDE7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHZlcnRleE51bSA9IHByaW1pdGl2ZS5nZXRWZXJ0ZXhDb3VudEFzSW5kaWNlc0Jhc2VkKCk7XG5cbiAgICAgIGNvbnN0IG5vcm1hbEF0dHJpYnV0ZUJ5dGVTaXplID0gcG9zaXRpb25BY2Nlc3Nvci5ieXRlTGVuZ3RoO1xuICAgICAgY29uc3QgYnVmZmVyID0gdGhpcy5fX2VuZ2luZS5tZW1vcnlNYW5hZ2VyLmNyZWF0ZUJ1ZmZlck9uRGVtYW5kKEJ1ZmZlclVzZS5DUFVHZW5lcmljLCBub3JtYWxBdHRyaWJ1dGVCeXRlU2l6ZSwgNCk7XG4gICAgICBjb25zdCBub3JtYWxCdWZmZXJWaWV3ID0gYnVmZmVyXG4gICAgICAgIC50YWtlQnVmZmVyVmlldyh7XG4gICAgICAgICAgYnl0ZUxlbmd0aFRvTmVlZDogbm9ybWFsQXR0cmlidXRlQnl0ZVNpemUsXG4gICAgICAgICAgYnl0ZVN0cmlkZTogMCxcbiAgICAgICAgfSlcbiAgICAgICAgLnVud3JhcEZvcmNlKCk7XG4gICAgICBjb25zdCBub3JtYWxBY2Nlc3NvciA9IG5vcm1hbEJ1ZmZlclZpZXdcbiAgICAgICAgLnRha2VBY2Nlc3Nvcih7XG4gICAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjMyxcbiAgICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgICAgICAgIGNvdW50OiBwb3NpdGlvbkFjY2Vzc29yLmVsZW1lbnRDb3VudCxcbiAgICAgICAgfSlcbiAgICAgICAgLnVud3JhcEZvcmNlKCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZlcnRleE51bSAtIDI7IGkgKz0gaW5jcmVtZW50TnVtKSB7XG4gICAgICAgIGNvbnN0IHBvczAgPSBwb3NpdGlvbkFjY2Vzc29yLmdldFZlYzMoaSwgeyBpbmRpY2VzQWNjZXNzb3IgfSk7XG4gICAgICAgIGNvbnN0IHBvczEgPSBwb3NpdGlvbkFjY2Vzc29yLmdldFZlYzMoaSArIDEsIHsgaW5kaWNlc0FjY2Vzc29yIH0pO1xuICAgICAgICBjb25zdCBwb3MyID0gcG9zaXRpb25BY2Nlc3Nvci5nZXRWZWMzKGkgKyAyLCB7IGluZGljZXNBY2Nlc3NvciB9KTtcblxuICAgICAgICB0aGlzLl9fY2FsY0ZhY2VOb3JtYWxGb3IzVmVydGljZXMoaSwgcG9zMCwgcG9zMSwgcG9zMiwgbm9ybWFsQWNjZXNzb3IsIGluZGljZXNBY2Nlc3Nvcik7XG4gICAgICB9XG4gICAgICBwcmltaXRpdmUuc2V0VmVydGV4QXR0cmlidXRlKG5vcm1hbEFjY2Vzc29yLCBWZXJ0ZXhBdHRyaWJ1dGUuTm9ybWFsLlhZWik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgZmFjZSBub3JtYWxzIGZvciBhIHRyaWFuZ2xlIGNvbnNpc3Rpbmcgb2YgMyB2ZXJ0aWNlcy5cbiAgICogQHBhcmFtIGkgLSBUaGUgc3RhcnRpbmcgdmVydGV4IGluZGV4XG4gICAqIEBwYXJhbSBwb3MwIC0gUG9zaXRpb24gb2YgdGhlIGZpcnN0IHZlcnRleFxuICAgKiBAcGFyYW0gcG9zMSAtIFBvc2l0aW9uIG9mIHRoZSBzZWNvbmQgdmVydGV4XG4gICAqIEBwYXJhbSBwb3MyIC0gUG9zaXRpb24gb2YgdGhlIHRoaXJkIHZlcnRleFxuICAgKiBAcGFyYW0gbm9ybWFsQWNjZXNzb3IgLSBBY2Nlc3NvciBmb3Igd3JpdGluZyBub3JtYWwgZGF0YVxuICAgKiBAcGFyYW0gaW5kaWNlc0FjY2Vzc29yIC0gT3B0aW9uYWwgaW5kaWNlcyBhY2Nlc3NvclxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2NhbGNGYWNlTm9ybWFsRm9yM1ZlcnRpY2VzKFxuICAgIGk6IEluZGV4LFxuICAgIHBvczA6IFZlY3RvcjMsXG4gICAgcG9zMTogVmVjdG9yMyxcbiAgICBwb3MyOiBWZWN0b3IzLFxuICAgIG5vcm1hbEFjY2Vzc29yOiBBY2Nlc3NvcixcbiAgICBpbmRpY2VzQWNjZXNzb3I/OiBBY2Nlc3NvclxuICApIHtcbiAgICAvLyBDYWxjIG5vcm1hbFxuICAgIGNvbnN0IGF4ID0gcG9zMS54IC0gcG9zMC54O1xuICAgIGNvbnN0IGF5ID0gcG9zMS55IC0gcG9zMC55O1xuICAgIGNvbnN0IGF6ID0gcG9zMS56IC0gcG9zMC56O1xuICAgIGNvbnN0IGJ4ID0gcG9zMi54IC0gcG9zMC54O1xuICAgIGNvbnN0IGJ5ID0gcG9zMi55IC0gcG9zMC55O1xuICAgIGNvbnN0IGJ6ID0gcG9zMi56IC0gcG9zMC56O1xuXG4gICAgbGV0IG54ID0gYXkgKiBieiAtIGF6ICogYnk7IC8vIGNyb3NzIHByb2R1Y3RcbiAgICBsZXQgbnkgPSBheiAqIGJ4IC0gYXggKiBiejtcbiAgICBsZXQgbnogPSBheCAqIGJ5IC0gYXkgKiBieDtcblxuICAgIGxldCBkYSA9IE1hdGguaHlwb3QobngsIG55LCBueik7IC8vIG5vcm1hbGl6ZVxuICAgIGlmIChkYSA8PSAxZS02KSB7XG4gICAgICBkYSA9IDAuMDAwMTtcbiAgICB9XG4gICAgZGEgPSAxLjAgLyBkYTtcbiAgICBueCAqPSBkYTtcbiAgICBueSAqPSBkYTtcbiAgICBueiAqPSBkYTtcblxuICAgIG5vcm1hbEFjY2Vzc29yLnNldFZlYzMoaSwgbngsIG55LCBueiwgeyBpbmRpY2VzQWNjZXNzb3IgfSk7XG4gICAgbm9ybWFsQWNjZXNzb3Iuc2V0VmVjMyhpICsgMSwgbngsIG55LCBueiwgeyBpbmRpY2VzQWNjZXNzb3IgfSk7XG4gICAgbm9ybWFsQWNjZXNzb3Iuc2V0VmVjMyhpICsgMiwgbngsIG55LCBueiwgeyBpbmRpY2VzQWNjZXNzb3IgfSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW5kZXggb2YgYSBwcmltaXRpdmUgd2l0aGluIHRoaXMgbWVzaC5cbiAgICogQHBhcmFtIHByaW1pdGl2ZSAtIFRoZSBwcmltaXRpdmUgdG8gZmluZCB0aGUgaW5kZXggb2ZcbiAgICogQHJldHVybnMgVGhlIGluZGV4IG9mIHRoZSBwcmltaXRpdmUgaW4gdGhlIG1lc2hcbiAgICovXG4gIGdldFByaW1pdGl2ZUluZGV4SW5NZXNoKHByaW1pdGl2ZTogUHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHRoaXMucHJpbWl0aXZlcy5pbmRleE9mKHByaW1pdGl2ZSk7XG4gIH1cblxuICAvKipcbiAgICogQXBwbHkgYSBtYXRlcmlhbCB2YXJpYW50IHRvIHRoZSBtZXNoXG4gICAqIEBwYXJhbSB2YXJpYW50TmFtZSBhIHZhcmlhbnQgbmFtZVxuICAgKi9cbiAgYXBwbHlNYXRlcmlhbFZhcmlhbnQodmFyaWFudE5hbWU6IHN0cmluZykge1xuICAgIGZvciAoY29uc3QgcHJpbWl0aXZlIG9mIHRoaXMucHJpbWl0aXZlcykge1xuICAgICAgcHJpbWl0aXZlLmFwcGx5TWF0ZXJpYWxWYXJpYW50KHZhcmlhbnROYW1lKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCBtYXRlcmlhbCB2YXJpYW50IG5hbWUgYXBwbGllZCB0byB0aGlzIG1lc2guXG4gICAqIFJldHVybnMgZW1wdHkgc3RyaW5nIGlmIG5vIHZhcmlhbnQgaXMgYXBwbGllZCBvciBpZiBwcmltaXRpdmVzIGhhdmUgZGlmZmVyZW50IHZhcmlhbnRzLlxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCB2YXJpYW50IG5hbWUgb3IgZW1wdHkgc3RyaW5nXG4gICAqL1xuICBnZXRDdXJyZW50VmFyaWFudE5hbWUoKSB7XG4gICAgZnVuY3Rpb24gYWxsRXF1YWwoYXJyOiBzdHJpbmdbXSkge1xuICAgICAgcmV0dXJuIGFyci5ldmVyeSh2YWwgPT4gdmFsID09PSBhcnJbMF0pO1xuICAgIH1cbiAgICBjb25zdCB2YXJpYW50TmFtZXMgPSB0aGlzLnByaW1pdGl2ZXMubWFwKHByaW1pdGl2ZSA9PiBwcmltaXRpdmUuZ2V0Q3VycmVudFZhcmlhbnROYW1lKCkpO1xuICAgIGlmICh2YXJpYW50TmFtZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIGlmIChhbGxFcXVhbCh2YXJpYW50TmFtZXMpKSB7XG4gICAgICByZXR1cm4gdmFyaWFudE5hbWVzWzBdO1xuICAgIH1cblxuICAgIHJldHVybiAnJztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFsbCBhdmFpbGFibGUgbWF0ZXJpYWwgdmFyaWFudCBuYW1lcyBmb3IgdGhpcyBtZXNoLlxuICAgKiBAcmV0dXJucyBBcnJheSBvZiB2YXJpYW50IG5hbWVzIGZyb20gYWxsIHByaW1pdGl2ZXNcbiAgICovXG4gIGdldFZhcmlhbnROYW1lcygpIHtcbiAgICBjb25zdCB2YXJpYW50czogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IHByaW1pdGl2ZSBvZiB0aGlzLnByaW1pdGl2ZXMpIHtcbiAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KHZhcmlhbnRzLCBwcmltaXRpdmUuZ2V0VmFyaWFudE5hbWVzKCkpO1xuICAgIH1cbiAgICByZXR1cm4gdmFyaWFudHM7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgbWVzaCBzZXR1cCBpcyBjb21wbGV0ZWQgYW5kIHJlYWR5IGZvciByZW5kZXJpbmcuXG4gICAqIEByZXR1cm5zIFRydWUgaWYgc2V0dXAgaXMgZG9uZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBpc1NldFVwRG9uZSgpIHtcbiAgICBsZXQgdmVydGV4SGFuZGxlc1JlYWR5ID0gdHJ1ZTtcbiAgICBmb3IgKGNvbnN0IHByaW1pdGl2ZSBvZiB0aGlzLnByaW1pdGl2ZXMpIHtcbiAgICAgIGlmIChwcmltaXRpdmUudmVydGV4SGFuZGxlcyA9PSBudWxsKSB7XG4gICAgICAgIHZlcnRleEhhbmRsZXNSZWFkeSA9IGZhbHNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCF2ZXJ0ZXhIYW5kbGVzUmVhZHkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fX2xhdGVzdFByaW1pdGl2ZVBvc2l0aW9uQWNjZXNzb3JWZXJzaW9uRm9yU2V0VXBEb25lICE9PSB0aGlzLl9fcHJpbWl0aXZlUG9zaXRpb25VcGRhdGVDb3VudCkge1xuICAgICAgdGhpcy5fX2xhdGVzdFByaW1pdGl2ZVBvc2l0aW9uQWNjZXNzb3JWZXJzaW9uRm9yU2V0VXBEb25lID0gdGhpcy5fX3ByaW1pdGl2ZVBvc2l0aW9uVXBkYXRlQ291bnQ7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyBWQk8gKFZlcnRleCBCdWZmZXIgT2JqZWN0KSBhbmQgVkFPIChWZXJ0ZXggQXJyYXkgT2JqZWN0KSBmb3IgYWxsIHByaW1pdGl2ZXMuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgLyoqXG4gICAqIE1hcmtzIHRoaXMgbWVzaCdzIG11bHRpLWRyYXcgZ3JvdXBzIChhbmQgdGhlIGxlZ2FjeSBzZXR1cCkgZm9yIGEgcmVidWlsZC5cbiAgICogQ2FsbGVkIHdoZW4gYSBwcmltaXRpdmUncyBhdHRyaWJ1dGVzIG9yIGluZGljZXMgY2hhbmdlLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9pbnZhbGlkYXRlTXVsdGlEcmF3U3RydWN0dXJlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9faXNJbnN0YW5jZVNpZFRleHR1cmVNb2RlKCkpIHtcbiAgICAgIHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuZ2V0TXVsdGlEcmF3UmVwb3NpdG9yeSh0aGlzLl9fZW5naW5lKS5tYXJrRGlydHlGb3JNZXNoKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIF91cGRhdGVWQk9BbmRWQU8oKSB7XG4gICAgaWYgKHRoaXMuX19pc0luc3RhbmNlU2lkVGV4dHVyZU1vZGUoKSkge1xuICAgICAgLy8gRGVmZXIgdGhlIEdQVSBzZXR1cCB0byB0aGUgTXVsdGlEcmF3UmVwb3NpdG9yeSwgd2hpY2ggcmVidWlsZHMgYWxsIGdyb3VwcyBvbmNlXG4gICAgICAvLyBhdCB0aGUgc3RhcnQgb2YgdGhlIG5leHQgZnJhbWUgKGNvYWxlc2NpbmcgdGhlIG1hbnkgbWVzaGVzIGFkZGVkIHdoaWxlIGxvYWRpbmcpLlxuICAgICAgdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5nZXRNdWx0aURyYXdSZXBvc2l0b3J5KHRoaXMuX19lbmdpbmUpLm1hcmtEaXJ0eUZvck1lc2godGhpcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHByaW1pdGl2ZU51bSA9IHRoaXMuZ2V0UHJpbWl0aXZlTnVtYmVyKCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmltaXRpdmVOdW07IGkrKykge1xuICAgICAgY29uc3QgcHJpbWl0aXZlID0gdGhpcy5nZXRQcmltaXRpdmVBdChpKTtcbiAgICAgIGlmIChJcy5leGlzdChwcmltaXRpdmUudmVydGV4SGFuZGxlcykpIHtcbiAgICAgICAgcHJpbWl0aXZlLnVwZGF0ZTNEQVBJVmVydGV4RGF0YSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJpbWl0aXZlLmNyZWF0ZTNEQVBJVmVydGV4RGF0YSgpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnVwZGF0ZVZhcmlhdGlvblZCTygpO1xuXG4gICAgaWYgKHRoaXMuX19lbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCAhPT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgdGhpcy51cGRhdGVWQU8oKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlcyBhbGwgM0QgQVBJIHZlcnRleCBkYXRhIGZvciB0aGlzIG1lc2guXG4gICAqL1xuICBkZWxldGUzREFQSVZlcnRleERhdGEoKSB7XG4gICAgZm9yIChjb25zdCBwcmltaXRpdmUgb2YgdGhpcy5fX3ByaW1pdGl2ZXMpIHtcbiAgICAgIHByaW1pdGl2ZS5kZWxldGUzREFQSVZlcnRleERhdGEoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX19pbnN0YW5jZVNpZEJhc2UgPj0gMCAmJiB0aGlzLl9fYmVsb25nVG9FbnRpdGllcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuaW5zdGFuY2VTaWRUYWJsZS5mcmVlKHRoaXMuX19pbnN0YW5jZVNpZEJhc2UsIHRoaXMuX19pbnN0YW5jZVNpZENvdW50KTtcbiAgICAgIHRoaXMuX19pbnN0YW5jZVNpZEJhc2UgPSAtMTtcbiAgICAgIHRoaXMuX19pbnN0YW5jZVNpZENvdW50ID0gMDtcbiAgICB9XG4gIH1cblxuICAvLyBtYWtlVmVydGljZXNTZXBhcmF0ZWQoKSB7XG4gIC8vICAgZm9yIChsZXQgcHJpbWl0aXZlIG9mIHRoaXMuX19wcmltaXRpdmVzKSB7XG4gIC8vICAgICBpZiAocHJpbWl0aXZlLmhhc0luZGljZXMoKSkge1xuICAvLyAgICAgICBjb25zdCBidWZmZXIgPSBNZW1vcnlNYW5hZ2VyLmdldEluc3RhbmNlKCkuY3JlYXRlT3JHZXRCdWZmZXIoQnVmZmVyVXNlLkNQVUdlbmVyaWMpO1xuICAvLyAgICAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IHByaW1pdGl2ZS5nZXRWZXJ0ZXhDb3VudEFzSW5kaWNlc0Jhc2VkKCk7XG5cbiAgLy8gICAgICAgY29uc3QgaW5kZXhBY2Nlc3NvciA9IHByaW1pdGl2ZS5pbmRpY2VzQWNjZXNzb3I7XG4gIC8vICAgICAgIGZvciAobGV0IGkgaW4gcHJpbWl0aXZlLmF0dHJpYnV0ZUFjY2Vzc29ycykge1xuICAvLyAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZUFjY2Vzc29yID0gcHJpbWl0aXZlLmF0dHJpYnV0ZUFjY2Vzc29yc1tpXTtcbiAgLy8gICAgICAgICBjb25zdCBlbGVtZW50U2l6ZUluQnl0ZXMgPSBhdHRyaWJ1dGVBY2Nlc3Nvci5lbGVtZW50U2l6ZUluQnl0ZXM7XG4gIC8vICAgICAgICAgY29uc3QgYnVmZmVyVmlldyA9IGJ1ZmZlci50YWtlQnVmZmVyVmlldyh7IGJ5dGVMZW5ndGhUb05lZWQ6IGVsZW1lbnRTaXplSW5CeXRlcyAqIHZlcnRleENvdW50LCBieXRlU3RyaWRlOiAwLCBpc0FvUzogZmFsc2UgfSk7XG4gIC8vICAgICAgICAgY29uc3QgbmV3QWNjZXNzb3IgPSBidWZmZXJWaWV3LnRha2VBY2Nlc3Nvcih7IGNvbXBvc2l0aW9uVHlwZTogYXR0cmlidXRlQWNjZXNzb3IuY29tcG9zaXRpb25UeXBlLCBjb21wb25lbnRUeXBlOiBhdHRyaWJ1dGVBY2Nlc3Nvci5jb21wb25lbnRUeXBlLCBjb3VudDogdmVydGV4Q291bnQgfSk7XG5cbiAgLy8gICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZlcnRleENvdW50OyBqKyspIHtcbiAgLy8gICAgICAgICAgIGNvbnN0IGlkeCA9IGluZGV4QWNjZXNzb3IhLmdldFNjYWxhcihqLCB7fSk7XG4gIC8vICAgICAgICAgICBuZXdBY2Nlc3Nvci5zZXRFbGVtZW50RnJvbVNhbWVDb21wb3NpdGlvbkFjY2Vzc29yKGosIGF0dHJpYnV0ZUFjY2Vzc29yLCBpZHgpO1xuICAvLyAgICAgICAgIH1cblxuICAvLyAgICAgICAgIHByaW1pdGl2ZS5zZXRWZXJ0ZXhBdHRyaWJ1dGUobmV3QWNjZXNzb3IsIHByaW1pdGl2ZS5hdHRyaWJ1dGVTZW1hbnRpY3NbaV0pO1xuICAvLyAgICAgICB9XG5cbiAgLy8gICAgICAgY29uc3QgaW5kaWNlc0FjY2Vzc29yID0gcHJpbWl0aXZlLmluZGljZXNBY2Nlc3NvciE7XG4gIC8vICAgICAgIGNvbnN0IGVsZW1lbnRTaXplSW5CeXRlcyA9IGluZGljZXNBY2Nlc3Nvci5lbGVtZW50U2l6ZUluQnl0ZXM7XG4gIC8vICAgICAgIGNvbnN0IGJ1ZmZlclZpZXcgPSBidWZmZXIudGFrZUJ1ZmZlclZpZXcoeyBieXRlTGVuZ3RoVG9OZWVkOiBlbGVtZW50U2l6ZUluQnl0ZXMgKiB2ZXJ0ZXhDb3VudCwgYnl0ZVN0cmlkZTogMCwgaXNBb1M6IGZhbHNlIH0pO1xuICAvLyAgICAgICBjb25zdCBuZXdBY2Nlc3NvciA9IGJ1ZmZlclZpZXcudGFrZUFjY2Vzc29yKHsgY29tcG9zaXRpb25UeXBlOiBpbmRpY2VzQWNjZXNzb3IuY29tcG9zaXRpb25UeXBlLCBjb21wb25lbnRUeXBlOiBpbmRpY2VzQWNjZXNzb3IuY29tcG9uZW50VHlwZSwgY291bnQ6IHZlcnRleENvdW50IH0pO1xuXG4gIC8vICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdmVydGV4Q291bnQ7IGorKykge1xuICAvLyAgICAgICAgIC8vY29uc3QgaWR4ID0gaW5kZXhBY2Nlc3NvciEuZ2V0U2NhbGFyKGosIHt9KTtcbiAgLy8gICAgICAgICBuZXdBY2Nlc3Nvci5zZXRTY2FsYXIoaiwgaiwge30pO1xuICAvLyAgICAgICB9XG5cbiAgLy8gICAgICAgcHJpbWl0aXZlLnNldEluZGljZXMobmV3QWNjZXNzb3IpO1xuICAvLyAgICAgfVxuICAvLyAgIH1cbiAgLy8gfVxuXG4gIC8vIF9faW5pdE1vcnBoUHJpbWl0aXZlcygpIHtcbiAgLy8gICBpZiAodGhpcy53ZWlnaHRzLmxlbmd0aCA9PT0gMCkge1xuICAvLyAgICAgcmV0dXJuO1xuICAvLyAgIH1cblxuICAvLyAgIGNvbnN0IGJ1ZmZlciA9IE1lbW9yeU1hbmFnZXIuZ2V0SW5zdGFuY2UoKS5jcmVhdGVPckdldEJ1ZmZlcihCdWZmZXJVc2UuQ1BVR2VuZXJpYyk7XG4gIC8vICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9fcHJpbWl0aXZlcy5sZW5ndGg7IGkrKykge1xuICAvLyAgICAgY29uc3QgcHJpbWl0aXZlID0gdGhpcy5fX3ByaW1pdGl2ZXNbaV07XG4gIC8vICAgICBpZiAodGhpcy5fX21vcnBoUHJpbWl0aXZlc1tpXSA9PSBudWxsKSB7XG4gIC8vICAgICAgIGNvbnN0IHRhcmdldCA9IHByaW1pdGl2ZS50YXJnZXRzWzBdO1xuICAvLyAgICAgICBjb25zdCBtYXAgPSBuZXcgTWFwKCk7XG4gIC8vICAgICAgIHRhcmdldC5mb3JFYWNoKChhY2Nlc3Nvciwgc2VtYW50aWMpID0+IHtcbiAgLy8gICAgICAgICBjb25zdCBidWZmZXJWaWV3ID0gYnVmZmVyLnRha2VCdWZmZXJWaWV3KHsgYnl0ZUxlbmd0aFRvTmVlZDogYWNjZXNzb3IuYnl0ZUxlbmd0aCwgYnl0ZVN0cmlkZTogMCwgaXNBb1M6IGZhbHNlIH0pO1xuICAvLyAgICAgICAgIGNvbnN0IG1vcnBoQWNjZXNzb3IgPSBidWZmZXJWaWV3LnRha2VBY2Nlc3Nvcih7IGNvbXBvc2l0aW9uVHlwZTogYWNjZXNzb3IuY29tcG9zaXRpb25UeXBlLCBjb21wb25lbnRUeXBlOiBhY2Nlc3Nvci5jb21wb25lbnRUeXBlLCBjb3VudDogYWNjZXNzb3IuZWxlbWVudENvdW50IH0pO1xuICAvLyAgICAgICAgIG1hcC5zZXQoc2VtYW50aWMsIG1vcnBoQWNjZXNzb3IpO1xuICAvLyAgICAgICB9KTtcbiAgLy8gICAgICAgY29uc3QgbW9ycGhQcmltaXRpdmUgPSBuZXcgUHJpbWl0aXZlKCk7XG4gIC8vICAgICAgIG1vcnBoUHJpbWl0aXZlLnNldERhdGEobWFwLCBwcmltaXRpdmUucHJpbWl0aXZlTW9kZSwgcHJpbWl0aXZlLm1hdGVyaWFsLCBwcmltaXRpdmUuaW5kaWNlc0FjY2Vzc29yKTtcbiAgLy8gICAgICAgbW9ycGhQcmltaXRpdmUuc2V0VGFyZ2V0cyhwcmltaXRpdmUudGFyZ2V0cyk7XG4gIC8vICAgICAgIHRoaXMuX19tb3JwaFByaW1pdGl2ZXNbaV0gPSBtb3JwaFByaW1pdGl2ZTtcbiAgLy8gICAgIH1cbiAgLy8gICB9XG4gIC8vIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFHQSxTQUFTLGlCQUFpQjtBQUMxQixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLG9CQUFvQjtBQUM3QixTQUFTLHVCQUF1QjtBQUVoQyxTQUFTLFlBQVk7QUFFckIsU0FBUyxzQkFBc0I7QUFFL0IsU0FBUyxlQUFlO0FBRXhCLFNBQVMsVUFBVTtBQUNuQixTQUFTLGNBQWM7QUFDdkIsU0FBUywrQkFBK0I7QUFHeEM7QUFBQSxFQUVFO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FB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
