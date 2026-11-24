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
    this.Bk = [];
    this.Tk = [];
    this.Uk = [];
    this.Vk = [];
    this.Wk = [];
    this.jl = [];
    this.Qk = new AABB();
    this.Ck = [];
    /** Indices of __vaoUids that refer to a MultiDrawRepository-owned group VAO. */
    this.Lk = /* @__PURE__ */ new Set();
    this.Ek = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    /** Whether the mesh has instances (see `_isGpuCullable`). */
    this._k = false;
    /** Whether an instance has a skeletal component (see `_needsComputeDeformation`). */
    this.Ok = false;
    /** Whether an instance has a blend shape component (see `_needsComputeDeformation`). */
    this.$k = false;
    /** Cache of `_isComputeDeformable`, valid for the primitive count, position update count and skeletal flag below. */
    this.Xk = false;
    this.al = -1;
    this.bl = -1;
    this.cl = false;
    /** Number of the instances packed at the front of the variation VBO. */
    this.Ik = 0;
    this.Kk = -1;
    /** Stable slot range in the engine-wide instance SID table (WebGL multi-draw). */
    this.Fk = -1;
    this.Pk = 0;
    /** Id of the last culling pass that visited this mesh in the per-pass instance prepass. */
    this.dl = -1;
    this.el = 0;
    this.fl = 0;
    this.Dk = [];
    /**
     * Specification of when calculate the tangent of a vertex to apply Normal texture (for pbr/MToon shader)
     * 0: Not calculate tangent (not apply normal texture)
     * 1: (default) Use original tangent in a vertex, if a vertex has tangent attribute. If a vertex does not have it, calculate a tangent in a shader.
     * 2: Use original tangent in a vertex, if a vertex has tangent attribute. If a vertex does not have it, precalculate a tangent in the javascript.
     * 3: Calculate all tangent in a shader.
     * 4: Precalculate all tangent in the javascript
     */
    this.tangentCalculationMode = 1;
    this.gl = false;
    this.Gk = 0;
    this.c = engine;
    this.Zk = ++_Mesh.il;
  }
  /**
   * A version incremented whenever the primitive positions of any mesh are updated (see
   * `primitivePositionUpdateCount`), so that caches of the local bounding boxes can be revalidated cheaply.
   * @internal
   */
  static get _primitivePositionUpdateVersion() {
    return _Mesh.hl;
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
    return this.Ck[index];
  }
  /**
   * Gets the VAO (Vertex Array Object) UID for the specified primitive UID.
   * @param primitiveUid - The UID of the primitive
   * @returns The VAO resource handle
   */
  getVaoUidsByPrimitiveUid(primitiveUid) {
    const index = this.Bk.findIndex((primitive) => primitive.primitiveUid === primitiveUid);
    return this.Ck[index];
  }
  /**
   * Gets the inner mesh entities that belong to this mesh.
   * @returns Array of mesh entities
   */
  get meshEntitiesInner() {
    return this.Dk;
  }
  /**
   * Registers this mesh as belonging to a mesh component.
   * @param meshComponent - The mesh component that owns this mesh
   * @internal
   */
  _belongToMeshComponent(meshComponent) {
    this.Dk.push(meshComponent.entity);
    if (this.Hk()) {
      this.c.webglResourceRepository.getMultiDrawRepository(this.c).markDirtyForMesh(this);
    }
  }
  /**
   * Removes the association with a mesh component.
   * @param meshComponent - The mesh component to remove
   * @internal
   */
  _removeMeshComponent(meshComponent) {
    const entity = meshComponent.entity;
    this.Dk = this.Dk.filter((belongToEntity) => belongToEntity !== entity);
    if (this.Hk()) {
      this.c.webglResourceRepository.getMultiDrawRepository(this.c).markDirtyForMesh(this);
    }
  }
  /**
   * Adds primitive.
   * @param primitive The primitive object.
   */
  addPrimitive(primitive) {
    primitive._belongToMesh(this);
    if (this.Hk()) {
      this.c.webglResourceRepository.getMultiDrawRepository(this.c).markDirtyForMesh(this);
    }
    if (isOpaque(primitive)) {
      this.Tk.push(primitive);
    } else if (isTranslucent(primitive)) {
      this.Uk.push(primitive);
    } else if (isBlendWithZWrite(primitive)) {
      this.Vk.push(primitive);
    } else if (isBlendWithoutZWrite(primitive)) {
      this.Wk.push(primitive);
    }
    this.wl(
      this.Tk.concat(this.Uk).concat(this.Vk).concat(this.Wk)
    );
  }
  /**
   * Sets the array of primitives for this mesh.
   * @param primitives - Array of primitives to set
   * @private
   */
  wl(primitives) {
    this.Bk = primitives;
  }
  /**
   * Checks if this mesh has opaque primitives.
   * @returns True if opaque primitives exist, false otherwise
   */
  isExistOpaque() {
    return this.Tk.length > 0;
  }
  /**
   * Checks if this mesh has translucent primitives.
   * @returns True if translucent primitives exist, false otherwise
   */
  isExistTranslucent() {
    return this.Uk.length > 0;
  }
  /**
   * Checks if this mesh has blend-with-z-write primitives.
   * @returns True if blend-with-z-write primitives exist, false otherwise
   */
  isExistBlendWithZWrite() {
    return this.Vk.length > 0;
  }
  /**
   * Checks if this mesh has blend-without-z-write primitives.
   * @returns True if blend-without-z-write primitives exist, false otherwise
   */
  isExistBlendWithoutZWrite() {
    return this.Wk.length > 0;
  }
  /**
   * Gets the primitive at the specified index.
   * @param i - The index of the primitive to retrieve
   * @returns The primitive at the specified index
   */
  getPrimitiveAt(i) {
    return this.Bk[i];
  }
  /**
   * Gets the total number of primitives in this mesh.
   * @returns The number of primitives
   */
  getPrimitiveNumber() {
    return this.Bk.length;
  }
  /**
   * Whether the WebGL instance SID texture path (multi-draw) is active for this mesh.
   */
  Hk() {
    if (!this.c.config.isMultiDrawEnabled) {
      return false;
    }
    if (this.c.engineState.currentProcessApproach !== ProcessApproach.WebGL2) {
      return false;
    }
    const webglResourceRepository = this.c.webglResourceRepository;
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
    const count = this.Dk.length;
    const table = this.c.webglResourceRepository.instanceSidTable;
    let base = this.Fk;
    if (base < 0 || this.Pk !== count) {
      if (base >= 0) {
        table.free(base, this.Pk);
      }
      base = table.allocate(count);
      this.Fk = base;
      this.Pk = count;
      table.writeIdentityRemap(base, count);
    }
    const INVALID_ID = 4294967295;
    for (let i = 0; i < count; i++) {
      const entity = this.Dk[i];
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
    return this.Fk;
  }
  /**
   * Visit stamp of the per-pass instance prepass (WebGL multi-draw).
   * @internal
   */
  get _remapPrepassId() {
    return this.dl;
  }
  set _remapPrepassId(id) {
    this.dl = id;
  }
  /**
   * Updates the variation VBO (Vertex Buffer Object) for instancing.
   * @returns True if updated, false if not changed (not dirty)
   * @internal
   */
  updateVariationVBO() {
    const cgApiResourceRepository = this.c.cgApiResourceRepository;
    if (this.Ek !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      cgApiResourceRepository.deleteVertexBuffer(this.Ek);
    }
    const INVALID_ID = 4294967295;
    const instanceNum = this.Dk.length;
    const entityInfo = new Uint32Array(instanceNum * 4);
    const entityUIDs = new Int32Array(instanceNum);
    let hasSkeletalInstance = false;
    let hasBlendShapeInstance = false;
    for (let i = 0; i < instanceNum; i++) {
      entityUIDs[i] = this.Dk[i].entityUID;
      entityInfo[4 * i + 0] = this.Dk[i].getSceneGraph().componentSID;
      const skeletal = this.Dk[i].tryToGetSkeletal();
      if (skeletal != null) {
        entityInfo[4 * i + 1] = skeletal.componentSID;
      } else {
        entityInfo[4 * i + 1] = INVALID_ID;
      }
      const blendShape = this.Dk[i].tryToGetBlendShape();
      if (blendShape != null) {
        entityInfo[4 * i + 2] = blendShape.componentSID;
      } else {
        entityInfo[4 * i + 2] = INVALID_ID;
      }
      hasSkeletalInstance || (hasSkeletalInstance = skeletal != null);
      hasBlendShapeInstance || (hasBlendShapeInstance = blendShape != null);
    }
    this._k = instanceNum > 0;
    this.Ok = hasSkeletalInstance;
    this.$k = hasBlendShapeInstance;
    if (this.Hk()) {
      this.Ek = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      this.Mk = entityInfo;
      this.Nk = entityUIDs;
      this.Rk = void 0;
      this.Sk = void 0;
      this.Ik = instanceNum;
      this.Jk = void 0;
      this.Kk = -1;
      this._ensureInstanceSidBase();
      return true;
    }
    this.Ek = cgApiResourceRepository.createVertexBufferFromTypedArray(entityInfo);
    this.Mk = entityInfo;
    this.Nk = entityUIDs;
    this.Rk = entityInfo.slice();
    this.Sk = new Uint32Array(entityInfo.length);
    this.Ik = instanceNum;
    this.Jk = void 0;
    this.Kk = -1;
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
    if (this.Hk()) {
      return this._packVisibleInstancesToInstanceRemap(culledEntityStamp, cullTick);
    }
    const entityInfo = this.Mk;
    const entityUIDs = this.Nk;
    const vboContent = this.Rk;
    const packed = this.Sk;
    if (entityInfo === void 0 || entityUIDs === void 0 || vboContent === void 0 || packed === void 0 || this.Ek === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      return this.Dk.length;
    }
    if (culledEntityStamp === this.Jk && cullTick === this.Kk) {
      return this.Ik;
    }
    this.Jk = culledEntityStamp;
    this.Kk = cullTick;
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
      this.c.webglResourceRepository.updateVertexBufferWithTypedArray(this.Ek, packedData);
      vboContent.set(packedData);
    }
    this.Ik = count;
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
    const entityUIDs = this.Nk;
    if (entityUIDs === void 0) {
      return this.Dk.length;
    }
    if (this.Fk < 0) {
      this._ensureInstanceSidBase();
    }
    if (culledEntityStamp === this.Jk && cullTick === this.Kk) {
      return this.Ik;
    }
    this.Jk = culledEntityStamp;
    this.Kk = cullTick;
    const table = this.c.webglResourceRepository.instanceSidTable;
    const base = this.Fk;
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
    this.Ik = count;
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
    const webglResourceRepository = this.c.webglResourceRepository;
    if (this.Ek !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      webglResourceRepository.deleteVertexBuffer(this.Ek);
      this.Ek = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      this.Mk = void 0;
      this.Nk = void 0;
      this.Rk = void 0;
      this.Sk = void 0;
      return true;
    }
    return false;
  }
  /**
   * Updates the VAO (Vertex Array Object) for all primitives in this mesh.
   */
  updateVAO() {
    const webglResourceRepository = this.c.webglResourceRepository;
    if (webglResourceRepository == null) {
      return;
    }
    for (let i = 0; i < this.Bk.length; i++) {
      const primitive = this.Bk[i];
      const multiDrawGroup = primitive._multiDrawGroup;
      if ((multiDrawGroup == null ? void 0 : multiDrawGroup.vertexHandles) != null) {
        this.Ck[i] = multiDrawGroup.vertexHandles.vaoHandle;
        this.Lk.add(i);
        continue;
      }
      const vertexHandles = primitive.vertexHandles;
      if (Is.undefined(vertexHandles)) {
        Logger.default.warn("Need to create 3DAPIVertexData before update VAO");
        continue;
      }
      if (Number.isNaN(this.Ck[i]) || this.Ck[i] === CGAPIResourceRepository.InvalidCGAPIResourceUid || vertexHandles.vaoHandle === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        this.Ck[i] = webglResourceRepository.createVertexArray();
        vertexHandles.vaoHandle = this.Ck[i];
      }
      webglResourceRepository.setVertexDataToPipeline(vertexHandles, primitive, this.Ek);
    }
    const multiDrawRepository = webglResourceRepository.getMultiDrawRepository(this.c);
    const removedHandles = /* @__PURE__ */ new Set();
    for (let i = this.Bk.length; i < this.Ck.length; i++) {
      const vaoUid = this.Ck[i];
      if (vaoUid && !multiDrawRepository.hasVaoHandle(vaoUid)) {
        if (!removedHandles.has(vaoUid)) {
          removedHandles.add(vaoUid);
          webglResourceRepository.deleteVertexArray(vaoUid);
        }
      }
      this.Ck[i] = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
  }
  /**
   * Deletes all VAO (Vertex Array Object) resources for this mesh.
   * Group VAOs are owned by the MultiDrawRepository and are skipped.
   */
  deleteVAO() {
    const webglResourceRepository = this.c.webglResourceRepository;
    if (webglResourceRepository == null) {
      this.Ck.length = 0;
      this.Lk.clear();
      return;
    }
    const multiDrawRepository = webglResourceRepository.getMultiDrawRepository(this.c);
    const deletedHandles = /* @__PURE__ */ new Set();
    for (let i = 0; i < this.Ck.length; i++) {
      const vaoUid = this.Ck[i];
      if (vaoUid && !deletedHandles.has(vaoUid) && !multiDrawRepository.hasVaoHandle(vaoUid)) {
        deletedHandles.add(vaoUid);
        webglResourceRepository.deleteVertexArray(vaoUid);
      }
      this.Ck[i] = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
    this.Lk.clear();
  }
  /**
   * Clears the VAO entries that point at multi-draw group VAOs. The groups own those
   * VAOs and delete them, so the mesh must forget them before the group is released.
   * @internal
   */
  _clearMultiDrawVaoUids() {
    for (const index of this.Lk) {
      if (index < this.Ck.length) {
        this.Ck[index] = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      }
    }
    this.Lk.clear();
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
    for (const primitive of this.Bk) {
      const result = primitive.castRay(
        srcPointInLocal,
        directionInLocal,
        true,
        true,
        dotThreshold,
        this.gl
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
    return this.Bk;
  }
  /**
   * Gets the unique identifier for this mesh.
   * @returns The mesh UID
   */
  get meshUID() {
    return this.Zk;
  }
  /**
   * Gets the variation VBO UID for internal use.
   * @returns The variation VBO resource handle
   * @internal
   */
  get _variationVBOUid() {
    return this.Ek;
  }
  /**
   * The instance variation data of the instances, as written to the variation VBO by `updateVariationVBO`:
   * `[sceneGraphSID, skeletalSID, blendShapeSID, 0]` per instance, in the order of `meshEntitiesInner`.
   * @internal
   */
  get _variationEntityInfo() {
    return this.Mk;
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
    if (!this._k) {
      return false;
    }
    if (!this._needsComputeDeformation) {
      return true;
    }
    return this.c.config.isComputeSkinningEnabled && this._isComputeDeformable;
  }
  /**
   * Whether the vertices of the instances are deformed when drawn: an instance has a skeletal component, or a blend
   * shape component while a primitive has morph targets. Updated by `updateVariationVBO`.
   * @internal
   */
  get _needsComputeDeformation() {
    if (this.Ok) {
      return true;
    }
    if (!this.$k) {
      return false;
    }
    for (let i = 0; i < this.Bk.length; i++) {
      if (this.Bk[i].targets.length > 0) {
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
    if (this.al === this.Bk.length && this.bl === this.Gk && this.cl === this.Ok) {
      return this.Xk;
    }
    this.al = this.Bk.length;
    this.bl = this.Gk;
    this.cl = this.Ok;
    this.Xk = this.xl();
    return this.Xk;
  }
  xl() {
    if (this.Bk.length === 0) {
      return false;
    }
    const hasAttribute = (semantics, name) => semantics.some((s) => s.split(".")[0] === name);
    for (const primitive of this.Bk) {
      const semantics = primitive.attributeSemantics;
      if (!hasAttribute(semantics, "POSITION")) {
        return false;
      }
      if (this.Ok && (!hasAttribute(semantics, "JOINTS_0") || !hasAttribute(semantics, "WEIGHTS_0"))) {
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
    this.Gk++;
    _Mesh.hl++;
    for (const entity of this.Dk) {
      entity.getMeshRenderer().moveStageTo(ProcessStage.Load);
    }
  }
  /**
   * Gets the primitive position update count.
   * @returns The number of times primitive positions have been updated
   */
  get primitivePositionUpdateCount() {
    return this.Gk;
  }
  /**
   * Gets AABB in local space.
   */
  get AABB() {
    if (this.Gk !== this.el) {
      this.Qk.initialize();
      this.el = this.Gk;
    }
    if (this.Qk.isVanilla()) {
      for (const primitive of this.Bk) {
        this.Qk.mergeAABB(primitive.AABB);
      }
    }
    return this.Qk;
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
  Bl() {
    for (let i = 0; i < this.Bk.length; i++) {
      const morphPrimitive = this.jl[i];
      const primitive = this.Bk[i];
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
    if (!this.yl()) {
      return;
    }
    for (const primitive of this.Bk) {
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
        const buffer = this.c.memoryManager.createBufferOnDemand(
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
          this.zl(i, pos0, pos1, pos2, uv0, uv1, uv2, norm0, tangentAccessor, indicesAccessor);
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
  zl(i, pos0, pos1, pos2, uv0, uv1, uv2, norm0, tangentAccessor, indicesAccessor) {
    const tan0Vec3 = this.Yk(pos0, pos1, pos2, uv0, uv1, uv2, norm0, _Mesh.tl);
    const tan1Vec3 = this.Yk(pos1, pos2, pos0, uv1, uv2, uv0, norm0, _Mesh.ul);
    const tan2Vec3 = this.Yk(pos2, pos0, pos1, uv2, uv0, uv1, norm0, _Mesh.vl);
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
  Yk(pos0Vec3, pos1Vec3, pos2Vec3, uv0Vec2, uv1Vec2, uv2Vec2, norm0Vec3, returnVec3) {
    const cp0 = [
      _Mesh.ta.setComponents(pos0Vec3.x, uv0Vec2.x, uv0Vec2.y),
      _Mesh.ua.setComponents(pos0Vec3.y, uv0Vec2.x, uv0Vec2.y),
      _Mesh.pb.setComponents(pos0Vec3.z, uv0Vec2.x, uv0Vec2.y)
    ];
    const cp1 = [
      _Mesh.kl.setComponents(pos1Vec3.x, uv1Vec2.x, uv1Vec2.y),
      _Mesh.ll.setComponents(pos1Vec3.y, uv1Vec2.x, uv1Vec2.y),
      _Mesh.ml.setComponents(pos1Vec3.z, uv1Vec2.x, uv1Vec2.y)
    ];
    const cp2 = [
      _Mesh.nl.setComponents(pos2Vec3.x, uv2Vec2.x, uv2Vec2.y),
      _Mesh.ol.setComponents(pos2Vec3.y, uv2Vec2.x, uv2Vec2.y),
      _Mesh.pl.setComponents(pos2Vec3.z, uv2Vec2.x, uv2Vec2.y)
    ];
    const u = [];
    const v = [];
    for (let i = 0; i < 3; i++) {
      const v1 = MutableVector3.subtractTo(cp1[i], cp0[i], _Mesh.ql);
      const v2 = MutableVector3.subtractTo(cp2[i], cp1[i], _Mesh.rl);
      const abc = MutableVector3.crossTo(v1, v2, _Mesh.sl);
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
  yl() {
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
    for (const primitive of this.Bk) {
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
        const buffer = this.c.memoryManager.createBufferOnDemand(
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
    for (const primitive of this.Bk) {
      const normalIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Normal.XYZ);
      if (normalIdx !== -1) {
        return;
      }
      this.gl = true;
      const positionIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Position.XYZ);
      const positionAccessor = primitive.attributeAccessors[positionIdx];
      const indicesAccessor = primitive.indicesAccessor;
      let incrementNum = 3;
      if (primitive.primitiveMode === PrimitiveMode.TriangleStrip || primitive.primitiveMode === PrimitiveMode.TriangleFan) {
        incrementNum = 1;
      }
      const vertexNum = primitive.getVertexCountAsIndicesBased();
      const normalAttributeByteSize = positionAccessor.byteLength;
      const buffer = this.c.memoryManager.createBufferOnDemand(BufferUse.CPUGeneric, normalAttributeByteSize, 4);
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
        this.Al(i, pos0, pos1, pos2, normalAccessor, indicesAccessor);
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
  Al(i, pos0, pos1, pos2, normalAccessor, indicesAccessor) {
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
    if (this.fl !== this.Gk) {
      this.fl = this.Gk;
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
    if (this.Hk()) {
      this.c.webglResourceRepository.getMultiDrawRepository(this.c).markDirtyForMesh(this);
    }
  }
  _updateVBOAndVAO() {
    if (this.Hk()) {
      this.c.webglResourceRepository.getMultiDrawRepository(this.c).markDirtyForMesh(this);
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
    if (this.c.engineState.currentProcessApproach !== ProcessApproach.WebGPU) {
      this.updateVAO();
    }
  }
  /**
   * Deletes all 3D API vertex data for this mesh.
   */
  delete3DAPIVertexData() {
    for (const primitive of this.Bk) {
      primitive.delete3DAPIVertexData();
    }
    if (this.Fk >= 0 && this.Dk.length === 0) {
      this.c.webglResourceRepository.instanceSidTable.free(this.Fk, this.Pk);
      this.Fk = -1;
      this.Pk = 0;
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
_Mesh.il = _Mesh.invalidateMeshUID;
_Mesh.ta = MutableVector3.zero();
_Mesh.ua = MutableVector3.zero();
_Mesh.pb = MutableVector3.zero();
_Mesh.kl = MutableVector3.zero();
_Mesh.ll = MutableVector3.zero();
_Mesh.ml = MutableVector3.zero();
_Mesh.nl = MutableVector3.zero();
_Mesh.ol = MutableVector3.zero();
_Mesh.pl = MutableVector3.zero();
_Mesh.ql = MutableVector3.zero();
_Mesh.rl = MutableVector3.zero();
_Mesh.sl = MutableVector3.zero();
_Mesh.tl = MutableVector3.zero();
_Mesh.ul = MutableVector3.zero();
_Mesh.vl = MutableVector3.zero();
/** Incremented when the primitive positions of any mesh are updated. */
_Mesh.hl = 0;
var Mesh = _Mesh;
export {
  Mesh
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZ2VvbWV0cnkvTWVzaC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBDR0FQSVJlc291cmNlSGFuZGxlLCBJbmRleCwgTWVzaFVJRCB9IGZyb20gJy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB0eXBlIHsgVmVydGV4SGFuZGxlcyB9IGZyb20gJy4uLy4uL3dlYmdsL1dlYkdMUmVzb3VyY2VSZXBvc2l0b3J5JztcbmltcG9ydCB0eXBlIHsgTWVzaENvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvTWVzaC9NZXNoQ29tcG9uZW50JztcbmltcG9ydCB7IEJ1ZmZlclVzZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL0J1ZmZlclVzZSc7XG5pbXBvcnQgeyBDb21wb25lbnRUeXBlIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvQ29tcG9uZW50VHlwZSc7XG5pbXBvcnQgeyBDb21wb3NpdGlvblR5cGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHsgUHJpbWl0aXZlTW9kZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1ByaW1pdGl2ZU1vZGUnO1xuaW1wb3J0IHsgUHJvY2Vzc0FwcHJvYWNoIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvUHJvY2Vzc0FwcHJvYWNoJztcbmltcG9ydCB7IFByb2Nlc3NTdGFnZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1Byb2Nlc3NTdGFnZSc7XG5pbXBvcnQgeyBWZXJ0ZXhBdHRyaWJ1dGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9WZXJ0ZXhBdHRyaWJ1dGUnO1xuaW1wb3J0IHR5cGUgeyBJTWVzaEVudGl0eSB9IGZyb20gJy4uL2hlbHBlcnMvRW50aXR5SGVscGVyJztcbmltcG9ydCB7IEFBQkIgfSBmcm9tICcuLi9tYXRoL0FBQkInO1xuaW1wb3J0IHR5cGUgeyBJVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvSVZlY3Rvcic7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvTXV0YWJsZVZlY3RvcjMnO1xuaW1wb3J0IHR5cGUgeyBWZWN0b3IyIH0gZnJvbSAnLi4vbWF0aC9WZWN0b3IyJztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICcuLi9tYXRoL1ZlY3RvcjMnO1xuaW1wb3J0IHR5cGUgeyBBY2Nlc3NvciB9IGZyb20gJy4uL21lbW9yeS9BY2Nlc3Nvcic7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uL21pc2MvSXMnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHsgQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkgfSBmcm9tICcuLi9yZW5kZXJlci9DR0FQSVJlc291cmNlUmVwb3NpdG9yeSc7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uL3N5c3RlbS9FbmdpbmUnO1xuaW1wb3J0IHR5cGUgeyBQcmltaXRpdmUgfSBmcm9tICcuL1ByaW1pdGl2ZSc7XG5pbXBvcnQge1xuICB0eXBlIElNZXNoLFxuICBpc0JsZW5kV2l0aG91dFpXcml0ZSxcbiAgaXNCbGVuZFdpdGhaV3JpdGUsXG4gIGlzT3BhcXVlLFxuICBpc1RyYW5zbHVjZW50LFxuICB0eXBlIFJheWNhc3RSZXN1bHRFeDEsXG59IGZyb20gJy4vdHlwZXMvR2VvbWV0cnlUeXBlcyc7XG5cbi8qKlxuICogVGhlIE1lc2ggY2xhc3MuXG4gKiBUaGlzIG1lc2ggb2JqZWN0IGhhcyBwcmltaXRpdmVzIChnZW9tZXRyaWVzKSBvciBhIHJlZmVyZW5jZSBvZiAnb3JpZ2luYWwgbWVzaCcuXG4gKiBJZiB0aGUgbGF0dGVyLCB0aGlzIG1lc2ggb2JqZWN0IGlzIGFuICdpbnN0YW5jZWQgbWVzaCcsIHdoaWNoIGhhcyBubyBwcmltaXRpdmVzLlxuICogSW5zdGFuY2VkIG1lc2hlcyByZWZlciBvcmlnaW5hbCBtZXNoJ3MgcHJpbWl0aXZlcyB3aGVuIGRyYXdpbmcuXG4gKi9cbmV4cG9ydCBjbGFzcyBNZXNoIGltcGxlbWVudHMgSU1lc2gge1xuICBwcml2YXRlIHJlYWRvbmx5IF9fZW5naW5lOiBFbmdpbmU7XG4gIHByaXZhdGUgcmVhZG9ubHkgX19tZXNoVUlEOiBNZXNoVUlEO1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IGludmFsaWRhdGVNZXNoVUlEID0gLTE7XG4gIHB1YmxpYyBzdGF0aWMgX19tZXNoX3VpZF9jb3VudCA9IE1lc2guaW52YWxpZGF0ZU1lc2hVSUQ7XG4gIHByaXZhdGUgX19wcmltaXRpdmVzOiBQcmltaXRpdmVbXSA9IFtdO1xuICBwcml2YXRlIF9fb3BhcXVlUHJpbWl0aXZlczogQXJyYXk8UHJpbWl0aXZlPiA9IFtdO1xuICBwcml2YXRlIF9fdHJhbnNsdWNlbnRQcmltaXRpdmVzOiBBcnJheTxQcmltaXRpdmU+ID0gW107XG4gIHByaXZhdGUgX19ibGVuZFdpdGhaV3JpdGVQcmltaXRpdmVzOiBBcnJheTxQcmltaXRpdmU+ID0gW107XG4gIHByaXZhdGUgX19ibGVuZFdpdGhvdXRaV3JpdGVQcmltaXRpdmVzOiBBcnJheTxQcmltaXRpdmU+ID0gW107XG4gIHByaXZhdGUgX19tb3JwaFByaW1pdGl2ZXM6IEFycmF5PFByaW1pdGl2ZT4gPSBbXTtcbiAgcHJpdmF0ZSBfX2xvY2FsQUFCQiA9IG5ldyBBQUJCKCk7XG4gIHByaXZhdGUgX192YW9VaWRzOiBDR0FQSVJlc291cmNlSGFuZGxlW10gPSBbXTtcbiAgLyoqIEluZGljZXMgb2YgX192YW9VaWRzIHRoYXQgcmVmZXIgdG8gYSBNdWx0aURyYXdSZXBvc2l0b3J5LW93bmVkIGdyb3VwIFZBTy4gKi9cbiAgcHJpdmF0ZSBfX211bHRpRHJhd1Zhb0luZGljZXM6IFNldDxJbmRleD4gPSBuZXcgU2V0KCk7XG4gIHByaXZhdGUgX192YXJpYXRpb25WQk9VaWQ6IENHQVBJUmVzb3VyY2VIYW5kbGUgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgLyoqIEluc3RhbmNlIHZhcmlhdGlvbiBkYXRhIG9mIGFsbCB0aGUgZW50aXRpZXMsIGluIHRoZSBvcmRlciBvZiBgX192YXJpYXRpb25FbnRpdHlVSURzYC4gKi9cbiAgcHJpdmF0ZSBfX3ZhcmlhdGlvbkVudGl0eUluZm8/OiBVaW50MzJBcnJheTtcbiAgLyoqIEVudGl0eVVJRHMgb2YgdGhlIGluc3RhbmNlcyBzdG9yZWQgaW4gYF9fdmFyaWF0aW9uRW50aXR5SW5mb2AuICovXG4gIHByaXZhdGUgX192YXJpYXRpb25FbnRpdHlVSURzPzogSW50MzJBcnJheTtcbiAgLyoqIFdoZXRoZXIgdGhlIG1lc2ggaGFzIGluc3RhbmNlcyAoc2VlIGBfaXNHcHVDdWxsYWJsZWApLiAqL1xuICBwcml2YXRlIF9faGFzSW5zdGFuY2VzID0gZmFsc2U7XG4gIC8qKiBXaGV0aGVyIGFuIGluc3RhbmNlIGhhcyBhIHNrZWxldGFsIGNvbXBvbmVudCAoc2VlIGBfbmVlZHNDb21wdXRlRGVmb3JtYXRpb25gKS4gKi9cbiAgcHJpdmF0ZSBfX2hhc1NrZWxldGFsSW5zdGFuY2UgPSBmYWxzZTtcbiAgLyoqIFdoZXRoZXIgYW4gaW5zdGFuY2UgaGFzIGEgYmxlbmQgc2hhcGUgY29tcG9uZW50IChzZWUgYF9uZWVkc0NvbXB1dGVEZWZvcm1hdGlvbmApLiAqL1xuICBwcml2YXRlIF9faGFzQmxlbmRTaGFwZUluc3RhbmNlID0gZmFsc2U7XG4gIC8qKiBDYWNoZSBvZiBgX2lzQ29tcHV0ZURlZm9ybWFibGVgLCB2YWxpZCBmb3IgdGhlIHByaW1pdGl2ZSBjb3VudCwgcG9zaXRpb24gdXBkYXRlIGNvdW50IGFuZCBza2VsZXRhbCBmbGFnIGJlbG93LiAqL1xuICBwcml2YXRlIF9faXNDb21wdXRlRGVmb3JtYWJsZSA9IGZhbHNlO1xuICBwcml2YXRlIF9fY29tcHV0ZURlZm9ybWFibGVQcmltaXRpdmVDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fY29tcHV0ZURlZm9ybWFibGVQb3NpdGlvblVwZGF0ZUNvdW50ID0gLTE7XG4gIHByaXZhdGUgX19jb21wdXRlRGVmb3JtYWJsZUhhc1NrZWxldGFsID0gZmFsc2U7XG4gIC8qKiBNaXJyb3Igb2YgdGhlIGN1cnJlbnQgY29udGVudCBvZiB0aGUgdmFyaWF0aW9uIFZCTyAoV2ViR0wpLiAqL1xuICBwcml2YXRlIF9fdmFyaWF0aW9uVkJPQ29udGVudD86IFVpbnQzMkFycmF5O1xuICAvKiogU2NyYXRjaCBidWZmZXIgdG8gcGFjayB0aGUgaW5zdGFuY2UgdmFyaWF0aW9uIGRhdGEgb2YgdGhlIHZpc2libGUgaW5zdGFuY2VzLiAqL1xuICBwcml2YXRlIF9fcGFja2VkVmFyaWF0aW9uRW50aXR5SW5mbz86IFVpbnQzMkFycmF5O1xuICAvKiogTnVtYmVyIG9mIHRoZSBpbnN0YW5jZXMgcGFja2VkIGF0IHRoZSBmcm9udCBvZiB0aGUgdmFyaWF0aW9uIFZCTy4gKi9cbiAgcHJpdmF0ZSBfX3ZhcmlhdGlvblZCT0luc3RhbmNlQ291bnQgPSAwO1xuICAvKiogQ3VsbGluZyBzdGF0ZSB0aGUgdmFyaWF0aW9uIFZCTyBjb250ZW50IHdhcyBwYWNrZWQgZm9yOyB1c2VkIHRvIHNraXAgcmVkdW5kYW50IHBhY2tpbmcuICovXG4gIHByaXZhdGUgX192YXJpYXRpb25WQk9DdWxsZWRFbnRpdHlTdGFtcD86IFVpbnQzMkFycmF5O1xuICBwcml2YXRlIF9fdmFyaWF0aW9uVkJPQ3VsbFRpY2sgPSAtMTtcbiAgLyoqIFN0YWJsZSBzbG90IHJhbmdlIGluIHRoZSBlbmdpbmUtd2lkZSBpbnN0YW5jZSBTSUQgdGFibGUgKFdlYkdMIG11bHRpLWRyYXcpLiAqL1xuICBwcml2YXRlIF9faW5zdGFuY2VTaWRCYXNlID0gLTE7XG4gIHByaXZhdGUgX19pbnN0YW5jZVNpZENvdW50ID0gMDtcbiAgLyoqIElkIG9mIHRoZSBsYXN0IGN1bGxpbmcgcGFzcyB0aGF0IHZpc2l0ZWQgdGhpcyBtZXNoIGluIHRoZSBwZXItcGFzcyBpbnN0YW5jZSBwcmVwYXNzLiAqL1xuICBwcml2YXRlIF9fcmVtYXBQcmVwYXNzSWQgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhdGVzdFByaW1pdGl2ZVBvc2l0aW9uQWNjZXNzb3JWZXJzaW9uRm9yQUFCQiA9IDA7XG4gIHByaXZhdGUgX19sYXRlc3RQcmltaXRpdmVQb3NpdGlvbkFjY2Vzc29yVmVyc2lvbkZvclNldFVwRG9uZSA9IDA7XG4gIHByaXZhdGUgX19iZWxvbmdUb0VudGl0aWVzOiBJTWVzaEVudGl0eVtdID0gW107XG5cbiAgLyoqXG4gICAqIFNwZWNpZmljYXRpb24gb2Ygd2hlbiBjYWxjdWxhdGUgdGhlIHRhbmdlbnQgb2YgYSB2ZXJ0ZXggdG8gYXBwbHkgTm9ybWFsIHRleHR1cmUgKGZvciBwYnIvTVRvb24gc2hhZGVyKVxuICAgKiAwOiBOb3QgY2FsY3VsYXRlIHRhbmdlbnQgKG5vdCBhcHBseSBub3JtYWwgdGV4dHVyZSlcbiAgICogMTogKGRlZmF1bHQpIFVzZSBvcmlnaW5hbCB0YW5nZW50IGluIGEgdmVydGV4LCBpZiBhIHZlcnRleCBoYXMgdGFuZ2VudCBhdHRyaWJ1dGUuIElmIGEgdmVydGV4IGRvZXMgbm90IGhhdmUgaXQsIGNhbGN1bGF0ZSBhIHRhbmdlbnQgaW4gYSBzaGFkZXIuXG4gICAqIDI6IFVzZSBvcmlnaW5hbCB0YW5nZW50IGluIGEgdmVydGV4LCBpZiBhIHZlcnRleCBoYXMgdGFuZ2VudCBhdHRyaWJ1dGUuIElmIGEgdmVydGV4IGRvZXMgbm90IGhhdmUgaXQsIHByZWNhbGN1bGF0ZSBhIHRhbmdlbnQgaW4gdGhlIGphdmFzY3JpcHQuXG4gICAqIDM6IENhbGN1bGF0ZSBhbGwgdGFuZ2VudCBpbiBhIHNoYWRlci5cbiAgICogNDogUHJlY2FsY3VsYXRlIGFsbCB0YW5nZW50IGluIHRoZSBqYXZhc2NyaXB0XG4gICAqL1xuICBwdWJsaWMgdGFuZ2VudENhbGN1bGF0aW9uTW9kZTogSW5kZXggPSAxO1xuXG4gIHByaXZhdGUgX19oYXNGYWNlTm9ybWFsID0gZmFsc2U7XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBWZWMzXzA6IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFZlYzNfMTogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wVmVjM18yOiBNdXRhYmxlVmVjdG9yMyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBWZWMzXzM6IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFZlYzNfNDogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wVmVjM181OiBNdXRhYmxlVmVjdG9yMyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBWZWMzXzY6IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFZlYzNfNzogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wVmVjM184OiBNdXRhYmxlVmVjdG9yMyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBWZWMzXzk6IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFZlYzNfMTA6IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFZlYzNfMTE6IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuXG4gIHByaXZhdGUgc3RhdGljIF9fdG1wUmV0dXJuVmVjM18wOiBNdXRhYmxlVmVjdG9yMyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBSZXR1cm5WZWMzXzE6IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFJldHVyblZlYzNfMjogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG5cbiAgcHJpdmF0ZSBfX3ByaW1pdGl2ZVBvc2l0aW9uVXBkYXRlQ291bnQgPSAwO1xuICAvKiogSW5jcmVtZW50ZWQgd2hlbiB0aGUgcHJpbWl0aXZlIHBvc2l0aW9ucyBvZiBhbnkgbWVzaCBhcmUgdXBkYXRlZC4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19wcmltaXRpdmVQb3NpdGlvblVwZGF0ZVZlcnNpb24gPSAwO1xuXG4gIC8qKlxuICAgKiBBIHZlcnNpb24gaW5jcmVtZW50ZWQgd2hlbmV2ZXIgdGhlIHByaW1pdGl2ZSBwb3NpdGlvbnMgb2YgYW55IG1lc2ggYXJlIHVwZGF0ZWQgKHNlZVxuICAgKiBgcHJpbWl0aXZlUG9zaXRpb25VcGRhdGVDb3VudGApLCBzbyB0aGF0IGNhY2hlcyBvZiB0aGUgbG9jYWwgYm91bmRpbmcgYm94ZXMgY2FuIGJlIHJldmFsaWRhdGVkIGNoZWFwbHkuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIGdldCBfcHJpbWl0aXZlUG9zaXRpb25VcGRhdGVWZXJzaW9uKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIE1lc2guX19wcmltaXRpdmVQb3NpdGlvblVwZGF0ZVZlcnNpb247XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3JcbiAgICovXG4gIGNvbnN0cnVjdG9yKGVuZ2luZTogRW5naW5lKSB7XG4gICAgdGhpcy5fX2VuZ2luZSA9IGVuZ2luZTtcbiAgICB0aGlzLl9fbWVzaFVJRCA9ICsrTWVzaC5fX21lc2hfdWlkX2NvdW50O1xuICB9XG5cbiAgLy8vXG4gIC8vL1xuICAvLy8gUHVibGljIE1lbWJlcnNcbiAgLy8vXG4gIC8vL1xuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBWQU8gKFZlcnRleCBBcnJheSBPYmplY3QpIFVJRCBmb3IgdGhlIHNwZWNpZmllZCBpbmRleC5cbiAgICogQHBhcmFtIGluZGV4IC0gVGhlIGluZGV4IG9mIHRoZSBwcmltaXRpdmVcbiAgICogQHJldHVybnMgVGhlIFZBTyByZXNvdXJjZSBoYW5kbGVcbiAgICovXG4gIHB1YmxpYyBnZXRWYW9VaWRzKGluZGV4OiBJbmRleCk6IENHQVBJUmVzb3VyY2VIYW5kbGUge1xuICAgIHJldHVybiB0aGlzLl9fdmFvVWlkc1tpbmRleF07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgVkFPIChWZXJ0ZXggQXJyYXkgT2JqZWN0KSBVSUQgZm9yIHRoZSBzcGVjaWZpZWQgcHJpbWl0aXZlIFVJRC5cbiAgICogQHBhcmFtIHByaW1pdGl2ZVVpZCAtIFRoZSBVSUQgb2YgdGhlIHByaW1pdGl2ZVxuICAgKiBAcmV0dXJucyBUaGUgVkFPIHJlc291cmNlIGhhbmRsZVxuICAgKi9cbiAgcHVibGljIGdldFZhb1VpZHNCeVByaW1pdGl2ZVVpZChwcmltaXRpdmVVaWQ6IEluZGV4KTogQ0dBUElSZXNvdXJjZUhhbmRsZSB7XG4gICAgY29uc3QgaW5kZXggPSB0aGlzLl9fcHJpbWl0aXZlcy5maW5kSW5kZXgocHJpbWl0aXZlID0+IHByaW1pdGl2ZS5wcmltaXRpdmVVaWQgPT09IHByaW1pdGl2ZVVpZCk7XG5cbiAgICByZXR1cm4gdGhpcy5fX3Zhb1VpZHNbaW5kZXhdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGlubmVyIG1lc2ggZW50aXRpZXMgdGhhdCBiZWxvbmcgdG8gdGhpcyBtZXNoLlxuICAgKiBAcmV0dXJucyBBcnJheSBvZiBtZXNoIGVudGl0aWVzXG4gICAqL1xuICBnZXQgbWVzaEVudGl0aWVzSW5uZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19iZWxvbmdUb0VudGl0aWVzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyB0aGlzIG1lc2ggYXMgYmVsb25naW5nIHRvIGEgbWVzaCBjb21wb25lbnQuXG4gICAqIEBwYXJhbSBtZXNoQ29tcG9uZW50IC0gVGhlIG1lc2ggY29tcG9uZW50IHRoYXQgb3ducyB0aGlzIG1lc2hcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfYmVsb25nVG9NZXNoQ29tcG9uZW50KG1lc2hDb21wb25lbnQ6IE1lc2hDb21wb25lbnQpIHtcbiAgICB0aGlzLl9fYmVsb25nVG9FbnRpdGllcy5wdXNoKG1lc2hDb21wb25lbnQuZW50aXR5KTtcbiAgICBpZiAodGhpcy5fX2lzSW5zdGFuY2VTaWRUZXh0dXJlTW9kZSgpKSB7XG4gICAgICB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmdldE11bHRpRHJhd1JlcG9zaXRvcnkodGhpcy5fX2VuZ2luZSkubWFya0RpcnR5Rm9yTWVzaCh0aGlzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyB0aGUgYXNzb2NpYXRpb24gd2l0aCBhIG1lc2ggY29tcG9uZW50LlxuICAgKiBAcGFyYW0gbWVzaENvbXBvbmVudCAtIFRoZSBtZXNoIGNvbXBvbmVudCB0byByZW1vdmVcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfcmVtb3ZlTWVzaENvbXBvbmVudChtZXNoQ29tcG9uZW50OiBNZXNoQ29tcG9uZW50KSB7XG4gICAgY29uc3QgZW50aXR5ID0gbWVzaENvbXBvbmVudC5lbnRpdHk7XG4gICAgdGhpcy5fX2JlbG9uZ1RvRW50aXRpZXMgPSB0aGlzLl9fYmVsb25nVG9FbnRpdGllcy5maWx0ZXIoYmVsb25nVG9FbnRpdHkgPT4gYmVsb25nVG9FbnRpdHkgIT09IGVudGl0eSk7XG4gICAgaWYgKHRoaXMuX19pc0luc3RhbmNlU2lkVGV4dHVyZU1vZGUoKSkge1xuICAgICAgdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5nZXRNdWx0aURyYXdSZXBvc2l0b3J5KHRoaXMuX19lbmdpbmUpLm1hcmtEaXJ0eUZvck1lc2godGhpcyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgcHJpbWl0aXZlLlxuICAgKiBAcGFyYW0gcHJpbWl0aXZlIFRoZSBwcmltaXRpdmUgb2JqZWN0LlxuICAgKi9cbiAgcHVibGljIGFkZFByaW1pdGl2ZShwcmltaXRpdmU6IFByaW1pdGl2ZSk6IHZvaWQge1xuICAgIHByaW1pdGl2ZS5fYmVsb25nVG9NZXNoKHRoaXMpO1xuICAgIGlmICh0aGlzLl9faXNJbnN0YW5jZVNpZFRleHR1cmVNb2RlKCkpIHtcbiAgICAgIHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuZ2V0TXVsdGlEcmF3UmVwb3NpdG9yeSh0aGlzLl9fZW5naW5lKS5tYXJrRGlydHlGb3JNZXNoKHRoaXMpO1xuICAgIH1cblxuICAgIGlmIChpc09wYXF1ZShwcmltaXRpdmUpKSB7XG4gICAgICB0aGlzLl9fb3BhcXVlUHJpbWl0aXZlcy5wdXNoKHByaW1pdGl2ZSk7XG4gICAgfSBlbHNlIGlmIChpc1RyYW5zbHVjZW50KHByaW1pdGl2ZSkpIHtcbiAgICAgIHRoaXMuX190cmFuc2x1Y2VudFByaW1pdGl2ZXMucHVzaChwcmltaXRpdmUpO1xuICAgIH0gZWxzZSBpZiAoaXNCbGVuZFdpdGhaV3JpdGUocHJpbWl0aXZlKSkge1xuICAgICAgdGhpcy5fX2JsZW5kV2l0aFpXcml0ZVByaW1pdGl2ZXMucHVzaChwcmltaXRpdmUpO1xuICAgIH0gZWxzZSBpZiAoaXNCbGVuZFdpdGhvdXRaV3JpdGUocHJpbWl0aXZlKSkge1xuICAgICAgdGhpcy5fX2JsZW5kV2l0aG91dFpXcml0ZVByaW1pdGl2ZXMucHVzaChwcmltaXRpdmUpO1xuICAgIH1cbiAgICB0aGlzLl9fc2V0UHJpbWl0aXZlcyhcbiAgICAgIHRoaXMuX19vcGFxdWVQcmltaXRpdmVzXG4gICAgICAgIC5jb25jYXQodGhpcy5fX3RyYW5zbHVjZW50UHJpbWl0aXZlcylcbiAgICAgICAgLmNvbmNhdCh0aGlzLl9fYmxlbmRXaXRoWldyaXRlUHJpbWl0aXZlcylcbiAgICAgICAgLmNvbmNhdCh0aGlzLl9fYmxlbmRXaXRob3V0WldyaXRlUHJpbWl0aXZlcylcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGFycmF5IG9mIHByaW1pdGl2ZXMgZm9yIHRoaXMgbWVzaC5cbiAgICogQHBhcmFtIHByaW1pdGl2ZXMgLSBBcnJheSBvZiBwcmltaXRpdmVzIHRvIHNldFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX3NldFByaW1pdGl2ZXMocHJpbWl0aXZlczogUHJpbWl0aXZlW10pIHtcbiAgICB0aGlzLl9fcHJpbWl0aXZlcyA9IHByaW1pdGl2ZXM7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgbWVzaCBoYXMgb3BhcXVlIHByaW1pdGl2ZXMuXG4gICAqIEByZXR1cm5zIFRydWUgaWYgb3BhcXVlIHByaW1pdGl2ZXMgZXhpc3QsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgcHVibGljIGlzRXhpc3RPcGFxdWUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX19vcGFxdWVQcmltaXRpdmVzLmxlbmd0aCA+IDA7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgbWVzaCBoYXMgdHJhbnNsdWNlbnQgcHJpbWl0aXZlcy5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0cmFuc2x1Y2VudCBwcmltaXRpdmVzIGV4aXN0LCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHB1YmxpYyBpc0V4aXN0VHJhbnNsdWNlbnQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX190cmFuc2x1Y2VudFByaW1pdGl2ZXMubGVuZ3RoID4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBtZXNoIGhhcyBibGVuZC13aXRoLXotd3JpdGUgcHJpbWl0aXZlcy5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiBibGVuZC13aXRoLXotd3JpdGUgcHJpbWl0aXZlcyBleGlzdCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBwdWJsaWMgaXNFeGlzdEJsZW5kV2l0aFpXcml0ZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fX2JsZW5kV2l0aFpXcml0ZVByaW1pdGl2ZXMubGVuZ3RoID4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBtZXNoIGhhcyBibGVuZC13aXRob3V0LXotd3JpdGUgcHJpbWl0aXZlcy5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiBibGVuZC13aXRob3V0LXotd3JpdGUgcHJpbWl0aXZlcyBleGlzdCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBwdWJsaWMgaXNFeGlzdEJsZW5kV2l0aG91dFpXcml0ZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fX2JsZW5kV2l0aG91dFpXcml0ZVByaW1pdGl2ZXMubGVuZ3RoID4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBwcmltaXRpdmUgYXQgdGhlIHNwZWNpZmllZCBpbmRleC5cbiAgICogQHBhcmFtIGkgLSBUaGUgaW5kZXggb2YgdGhlIHByaW1pdGl2ZSB0byByZXRyaWV2ZVxuICAgKiBAcmV0dXJucyBUaGUgcHJpbWl0aXZlIGF0IHRoZSBzcGVjaWZpZWQgaW5kZXhcbiAgICovXG4gIHB1YmxpYyBnZXRQcmltaXRpdmVBdChpOiBudW1iZXIpOiBQcmltaXRpdmUge1xuICAgIC8vIGlmICh0aGlzLndlaWdodHMubGVuZ3RoID4gMCkge1xuICAgIC8vIHJldHVybiB0aGlzLl9fbW9ycGhQcmltaXRpdmVzW2ldO1xuICAgIC8vIH0gZWxzZSB7XG4gICAgcmV0dXJuIHRoaXMuX19wcmltaXRpdmVzW2ldO1xuICAgIC8vIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB0b3RhbCBudW1iZXIgb2YgcHJpbWl0aXZlcyBpbiB0aGlzIG1lc2guXG4gICAqIEByZXR1cm5zIFRoZSBudW1iZXIgb2YgcHJpbWl0aXZlc1xuICAgKi9cbiAgcHVibGljIGdldFByaW1pdGl2ZU51bWJlcigpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9fcHJpbWl0aXZlcy5sZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGUgV2ViR0wgaW5zdGFuY2UgU0lEIHRleHR1cmUgcGF0aCAobXVsdGktZHJhdykgaXMgYWN0aXZlIGZvciB0aGlzIG1lc2guXG4gICAqL1xuICBwcml2YXRlIF9faXNJbnN0YW5jZVNpZFRleHR1cmVNb2RlKCk6IGJvb2xlYW4ge1xuICAgIGlmICghdGhpcy5fX2VuZ2luZS5jb25maWcuaXNNdWx0aURyYXdFbmFibGVkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLl9fZW5naW5lLmVuZ2luZVN0YXRlLmN1cnJlbnRQcm9jZXNzQXBwcm9hY2ggIT09IFByb2Nlc3NBcHByb2FjaC5XZWJHTDIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3Qgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGNvbnN0IGdsdyA9IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmN1cnJlbnRXZWJHTENvbnRleHRXcmFwcGVyO1xuICAgIHJldHVybiBnbHcgIT0gbnVsbCAmJiBnbHcud2ViZ2wyRXh0TUQgIT0gbnVsbCAmJiB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5pbnN0YW5jZVNpZFRhYmxlLmlzU3VwcG9ydGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuc3VyZXMgdGhhdCB0aGlzIG1lc2ggb3ducyBhIGNvbnRpZ3VvdXMgcmFuZ2Ugb2Ygc3RhYmxlIGluc3RhbmNlIHNsb3RzIGluIHRoZVxuICAgKiBlbmdpbmUtd2lkZSBpbnN0YW5jZSBTSUQgdGFibGUgYW5kIHdyaXRlcyB0aGUgaW5zdGFuY2UgaWRlbnRpdHkgcmVjb3Jkcy5cbiAgICogQHJldHVybnMgVGhlIGZpcnN0IHN0YWJsZSBzbG90IGluZGV4IChpbnN0YW5jZUJhc2UpLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9lbnN1cmVJbnN0YW5jZVNpZEJhc2UoKTogbnVtYmVyIHtcbiAgICBjb25zdCBjb3VudCA9IHRoaXMuX19iZWxvbmdUb0VudGl0aWVzLmxlbmd0aDtcbiAgICBjb25zdCB0YWJsZSA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuaW5zdGFuY2VTaWRUYWJsZTtcblxuICAgIGxldCBiYXNlID0gdGhpcy5fX2luc3RhbmNlU2lkQmFzZTtcbiAgICBpZiAoYmFzZSA8IDAgfHwgdGhpcy5fX2luc3RhbmNlU2lkQ291bnQgIT09IGNvdW50KSB7XG4gICAgICBpZiAoYmFzZSA+PSAwKSB7XG4gICAgICAgIHRhYmxlLmZyZWUoYmFzZSwgdGhpcy5fX2luc3RhbmNlU2lkQ291bnQpO1xuICAgICAgfVxuICAgICAgYmFzZSA9IHRhYmxlLmFsbG9jYXRlKGNvdW50KTtcbiAgICAgIHRoaXMuX19pbnN0YW5jZVNpZEJhc2UgPSBiYXNlO1xuICAgICAgdGhpcy5fX2luc3RhbmNlU2lkQ291bnQgPSBjb3VudDtcbiAgICAgIHRhYmxlLndyaXRlSWRlbnRpdHlSZW1hcChiYXNlLCBjb3VudCk7XG4gICAgfVxuXG4gICAgLy8gUmVmcmVzaCB0aGUgcmVjb3JkcyBldmVyeSB0aW1lOiBjb21wb25lbnQgU0lEcyBjYW4gY2hhbmdlIGV2ZW4gd2hlbiB0aGUgY291bnQgaXMgc3RhYmxlLlxuICAgIGNvbnN0IElOVkFMSURfSUQgPSAweGZmZmZfZmZmZjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IGVudGl0eSA9IHRoaXMuX19iZWxvbmdUb0VudGl0aWVzW2ldO1xuICAgICAgY29uc3QgY29tcG9uZW50U0lEID0gZW50aXR5LmdldFNjZW5lR3JhcGgoKS5jb21wb25lbnRTSUQ7XG4gICAgICBjb25zdCBza2VsZXRhbCA9IGVudGl0eS50cnlUb0dldFNrZWxldGFsKCk7XG4gICAgICBjb25zdCBibGVuZFNoYXBlID0gZW50aXR5LnRyeVRvR2V0QmxlbmRTaGFwZSgpO1xuICAgICAgdGFibGUuc2V0UmVjb3JkKFxuICAgICAgICBiYXNlICsgaSxcbiAgICAgICAgY29tcG9uZW50U0lELFxuICAgICAgICBza2VsZXRhbCAhPSBudWxsID8gc2tlbGV0YWwuY29tcG9uZW50U0lEIDogSU5WQUxJRF9JRCxcbiAgICAgICAgYmxlbmRTaGFwZSAhPSBudWxsID8gYmxlbmRTaGFwZS5jb21wb25lbnRTSUQgOiBJTlZBTElEX0lEXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBiYXNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGZpcnN0IHN0YWJsZSBpbnN0YW5jZSBzbG90IG9mIHRoaXMgbWVzaCAoV2ViR0wgbXVsdGktZHJhdykuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IF9pbnN0YW5jZVNpZEJhc2UoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX2luc3RhbmNlU2lkQmFzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWaXNpdCBzdGFtcCBvZiB0aGUgcGVyLXBhc3MgaW5zdGFuY2UgcHJlcGFzcyAoV2ViR0wgbXVsdGktZHJhdykuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IF9yZW1hcFByZXBhc3NJZCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9fcmVtYXBQcmVwYXNzSWQ7XG4gIH1cbiAgc2V0IF9yZW1hcFByZXBhc3NJZChpZDogbnVtYmVyKSB7XG4gICAgdGhpcy5fX3JlbWFwUHJlcGFzc0lkID0gaWQ7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgdmFyaWF0aW9uIFZCTyAoVmVydGV4IEJ1ZmZlciBPYmplY3QpIGZvciBpbnN0YW5jaW5nLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHVwZGF0ZWQsIGZhbHNlIGlmIG5vdCBjaGFuZ2VkIChub3QgZGlydHkpXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgdXBkYXRlVmFyaWF0aW9uVkJPKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy5fX2VuZ2luZS5jZ0FwaVJlc291cmNlUmVwb3NpdG9yeTtcblxuICAgIGlmICh0aGlzLl9fdmFyaWF0aW9uVkJPVWlkICE9PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkuZGVsZXRlVmVydGV4QnVmZmVyKHRoaXMuX192YXJpYXRpb25WQk9VaWQpO1xuICAgIH1cblxuICAgIGNvbnN0IElOVkFMSURfSUQgPSAweGZmZmZfZmZmZjtcbiAgICBjb25zdCBpbnN0YW5jZU51bSA9IHRoaXMuX19iZWxvbmdUb0VudGl0aWVzLmxlbmd0aDtcbiAgICAvLyBjb25zdCBlbnRpdHlJbmZvID0gbmV3IEZsb2F0MzJBcnJheShpbnN0YW5jZU51bSk7XG4gICAgY29uc3QgZW50aXR5SW5mbyA9IG5ldyBVaW50MzJBcnJheShpbnN0YW5jZU51bSAqIDQpO1xuICAgIGNvbnN0IGVudGl0eVVJRHMgPSBuZXcgSW50MzJBcnJheShpbnN0YW5jZU51bSk7XG4gICAgbGV0IGhhc1NrZWxldGFsSW5zdGFuY2UgPSBmYWxzZTtcbiAgICBsZXQgaGFzQmxlbmRTaGFwZUluc3RhbmNlID0gZmFsc2U7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnN0YW5jZU51bTsgaSsrKSB7XG4gICAgICBlbnRpdHlVSURzW2ldID0gdGhpcy5fX2JlbG9uZ1RvRW50aXRpZXNbaV0uZW50aXR5VUlEO1xuICAgICAgZW50aXR5SW5mb1s0ICogaSArIDBdID0gdGhpcy5fX2JlbG9uZ1RvRW50aXRpZXNbaV0uZ2V0U2NlbmVHcmFwaCgpLmNvbXBvbmVudFNJRDtcbiAgICAgIGNvbnN0IHNrZWxldGFsID0gdGhpcy5fX2JlbG9uZ1RvRW50aXRpZXNbaV0udHJ5VG9HZXRTa2VsZXRhbCgpO1xuICAgICAgaWYgKHNrZWxldGFsICE9IG51bGwpIHtcbiAgICAgICAgZW50aXR5SW5mb1s0ICogaSArIDFdID0gc2tlbGV0YWwuY29tcG9uZW50U0lEO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZW50aXR5SW5mb1s0ICogaSArIDFdID0gSU5WQUxJRF9JRDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGJsZW5kU2hhcGUgPSB0aGlzLl9fYmVsb25nVG9FbnRpdGllc1tpXS50cnlUb0dldEJsZW5kU2hhcGUoKTtcbiAgICAgIGlmIChibGVuZFNoYXBlICE9IG51bGwpIHtcbiAgICAgICAgZW50aXR5SW5mb1s0ICogaSArIDJdID0gYmxlbmRTaGFwZS5jb21wb25lbnRTSUQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbnRpdHlJbmZvWzQgKiBpICsgMl0gPSBJTlZBTElEX0lEO1xuICAgICAgfVxuICAgICAgaGFzU2tlbGV0YWxJbnN0YW5jZSB8fD0gc2tlbGV0YWwgIT0gbnVsbDtcbiAgICAgIGhhc0JsZW5kU2hhcGVJbnN0YW5jZSB8fD0gYmxlbmRTaGFwZSAhPSBudWxsO1xuICAgIH1cbiAgICB0aGlzLl9faGFzSW5zdGFuY2VzID0gaW5zdGFuY2VOdW0gPiAwO1xuICAgIHRoaXMuX19oYXNTa2VsZXRhbEluc3RhbmNlID0gaGFzU2tlbGV0YWxJbnN0YW5jZTtcbiAgICB0aGlzLl9faGFzQmxlbmRTaGFwZUluc3RhbmNlID0gaGFzQmxlbmRTaGFwZUluc3RhbmNlO1xuICAgIGlmICh0aGlzLl9faXNJbnN0YW5jZVNpZFRleHR1cmVNb2RlKCkpIHtcbiAgICAgIC8vIFRoZSBpbnN0YW5jZSBpZGVudGl0aWVzIGxpdmUgaW4gdGhlIGVuZ2luZS13aWRlIFNJRCB0YWJsZSBpbnN0ZWFkIG9mIGEgcGVyLW1lc2ggVkJPLlxuICAgICAgdGhpcy5fX3ZhcmlhdGlvblZCT1VpZCA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICAgICAgdGhpcy5fX3ZhcmlhdGlvbkVudGl0eUluZm8gPSBlbnRpdHlJbmZvO1xuICAgICAgdGhpcy5fX3ZhcmlhdGlvbkVudGl0eVVJRHMgPSBlbnRpdHlVSURzO1xuICAgICAgdGhpcy5fX3ZhcmlhdGlvblZCT0NvbnRlbnQgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9fcGFja2VkVmFyaWF0aW9uRW50aXR5SW5mbyA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuX192YXJpYXRpb25WQk9JbnN0YW5jZUNvdW50ID0gaW5zdGFuY2VOdW07XG4gICAgICB0aGlzLl9fdmFyaWF0aW9uVkJPQ3VsbGVkRW50aXR5U3RhbXAgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9fdmFyaWF0aW9uVkJPQ3VsbFRpY2sgPSAtMTtcbiAgICAgIHRoaXMuX2Vuc3VyZUluc3RhbmNlU2lkQmFzZSgpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgdGhpcy5fX3ZhcmlhdGlvblZCT1VpZCA9IGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5LmNyZWF0ZVZlcnRleEJ1ZmZlckZyb21UeXBlZEFycmF5KGVudGl0eUluZm8pO1xuICAgIHRoaXMuX192YXJpYXRpb25FbnRpdHlJbmZvID0gZW50aXR5SW5mbztcbiAgICB0aGlzLl9fdmFyaWF0aW9uRW50aXR5VUlEcyA9IGVudGl0eVVJRHM7XG4gICAgdGhpcy5fX3ZhcmlhdGlvblZCT0NvbnRlbnQgPSBlbnRpdHlJbmZvLnNsaWNlKCk7XG4gICAgdGhpcy5fX3BhY2tlZFZhcmlhdGlvbkVudGl0eUluZm8gPSBuZXcgVWludDMyQXJyYXkoZW50aXR5SW5mby5sZW5ndGgpO1xuICAgIHRoaXMuX192YXJpYXRpb25WQk9JbnN0YW5jZUNvdW50ID0gaW5zdGFuY2VOdW07XG4gICAgdGhpcy5fX3ZhcmlhdGlvblZCT0N1bGxlZEVudGl0eVN0YW1wID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX192YXJpYXRpb25WQk9DdWxsVGljayA9IC0xO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogUGFja3MgdGhlIGluc3RhbmNlIHZhcmlhdGlvbiBkYXRhIG9mIHRoZSBpbnN0YW5jZXMgdGhhdCB3ZXJlIG5vdCBjdWxsZWQgaW4gYSByZW5kZXIgcGFzc1xuICAgKiBpbnRvIHRoZSBmcm9udCBvZiB0aGUgdmFyaWF0aW9uIFZCTywgc28gdGhhdCBhbiBpbnN0YW5jZWQgZHJhdyBjYWxsIHJlbmRlcnMgb25seSB0aGVtLlxuICAgKiBUaGUgVkJPIGlzIHJld3JpdHRlbiBvbmx5IHdoZW4gaXRzIGNvbnRlbnQgY2hhbmdlcy4gV2ViR0wgb25seS5cbiAgICpcbiAgICogSW5zdGFuY2VzIHdob3NlIGVudGl0aWVzIGFyZSBub3QgaGFuZGxlZCBieSB0aGUgcmVuZGVyIHBhc3MncyBjdWxsaW5nIGtlZXAgYmVpbmcgZHJhd24uXG4gICAqXG4gICAqIEBwYXJhbSBjdWxsZWRFbnRpdHlTdGFtcCAtIFBlci1FbnRpdHlVSUQgc3RhbXBzIHdyaXR0ZW4gYnkgdGhlIGN1bGxpbmcgb2YgdGhlIHJlbmRlciBwYXNzXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICh1bmRlZmluZWQ6IGRyYXcgYWxsIHRoZSBpbnN0YW5jZXMpXG4gICAqIEBwYXJhbSBjdWxsVGljayAtIFRoZSBzdGFtcCB2YWx1ZSBvZiB0aGUgbGF0ZXN0IGN1bGxpbmcgb2YgdGhlIHJlbmRlciBwYXNzXG4gICAqIEByZXR1cm5zIFRoZSBudW1iZXIgb2YgdGhlIGluc3RhbmNlcyB0byBkcmF3XG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX3BhY2tWaXNpYmxlSW5zdGFuY2VzVG9WYXJpYXRpb25WQk8oY3VsbGVkRW50aXR5U3RhbXA6IFVpbnQzMkFycmF5IHwgdW5kZWZpbmVkLCBjdWxsVGljazogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBpZiAodGhpcy5fX2lzSW5zdGFuY2VTaWRUZXh0dXJlTW9kZSgpKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcGFja1Zpc2libGVJbnN0YW5jZXNUb0luc3RhbmNlUmVtYXAoY3VsbGVkRW50aXR5U3RhbXAsIGN1bGxUaWNrKTtcbiAgICB9XG4gICAgY29uc3QgZW50aXR5SW5mbyA9IHRoaXMuX192YXJpYXRpb25FbnRpdHlJbmZvO1xuICAgIGNvbnN0IGVudGl0eVVJRHMgPSB0aGlzLl9fdmFyaWF0aW9uRW50aXR5VUlEcztcbiAgICBjb25zdCB2Ym9Db250ZW50ID0gdGhpcy5fX3ZhcmlhdGlvblZCT0NvbnRlbnQ7XG4gICAgY29uc3QgcGFja2VkID0gdGhpcy5fX3BhY2tlZFZhcmlhdGlvbkVudGl0eUluZm87XG4gICAgaWYgKFxuICAgICAgZW50aXR5SW5mbyA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICBlbnRpdHlVSURzID09PSB1bmRlZmluZWQgfHxcbiAgICAgIHZib0NvbnRlbnQgPT09IHVuZGVmaW5lZCB8fFxuICAgICAgcGFja2VkID09PSB1bmRlZmluZWQgfHxcbiAgICAgIHRoaXMuX192YXJpYXRpb25WQk9VaWQgPT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkXG4gICAgKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2JlbG9uZ1RvRW50aXRpZXMubGVuZ3RoO1xuICAgIH1cblxuICAgIC8vIEFsbCB0aGUgcHJpbWl0aXZlcyBvZiB0aGlzIG1lc2ggc2hhcmUgdGhlIHZhcmlhdGlvbiBWQk8sIHNvIGl0IGlzIHBhY2tlZCBvbmNlIHBlciBjdWxsaW5nIHJlc3VsdC5cbiAgICBpZiAoY3VsbGVkRW50aXR5U3RhbXAgPT09IHRoaXMuX192YXJpYXRpb25WQk9DdWxsZWRFbnRpdHlTdGFtcCAmJiBjdWxsVGljayA9PT0gdGhpcy5fX3ZhcmlhdGlvblZCT0N1bGxUaWNrKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX3ZhcmlhdGlvblZCT0luc3RhbmNlQ291bnQ7XG4gICAgfVxuICAgIHRoaXMuX192YXJpYXRpb25WQk9DdWxsZWRFbnRpdHlTdGFtcCA9IGN1bGxlZEVudGl0eVN0YW1wO1xuICAgIHRoaXMuX192YXJpYXRpb25WQk9DdWxsVGljayA9IGN1bGxUaWNrO1xuXG4gICAgY29uc3QgaW5zdGFuY2VOdW0gPSBlbnRpdHlVSURzLmxlbmd0aDtcbiAgICBsZXQgY291bnQgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdGFuY2VOdW07IGkrKykge1xuICAgICAgaWYgKGN1bGxlZEVudGl0eVN0YW1wICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3QgZW50aXR5VUlEID0gZW50aXR5VUlEc1tpXTtcbiAgICAgICAgaWYgKGVudGl0eVVJRCA8IGN1bGxlZEVudGl0eVN0YW1wLmxlbmd0aCAmJiBjdWxsZWRFbnRpdHlTdGFtcFtlbnRpdHlVSURdID09PSBjdWxsVGljaykge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBzcmMgPSA0ICogaTtcbiAgICAgIGNvbnN0IGRzdCA9IDQgKiBjb3VudDtcbiAgICAgIHBhY2tlZFtkc3QgKyAwXSA9IGVudGl0eUluZm9bc3JjICsgMF07XG4gICAgICBwYWNrZWRbZHN0ICsgMV0gPSBlbnRpdHlJbmZvW3NyYyArIDFdO1xuICAgICAgcGFja2VkW2RzdCArIDJdID0gZW50aXR5SW5mb1tzcmMgKyAyXTtcbiAgICAgIHBhY2tlZFtkc3QgKyAzXSA9IGVudGl0eUluZm9bc3JjICsgM107XG4gICAgICBjb3VudCsrO1xuICAgIH1cblxuICAgIGNvbnN0IHBhY2tlZExlbmd0aCA9IDQgKiBjb3VudDtcbiAgICBsZXQgY2hhbmdlZCA9IGZhbHNlO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFja2VkTGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChwYWNrZWRbaV0gIT09IHZib0NvbnRlbnRbaV0pIHtcbiAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgY29uc3QgcGFja2VkRGF0YSA9IHBhY2tlZC5zdWJhcnJheSgwLCBwYWNrZWRMZW5ndGgpO1xuICAgICAgdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS51cGRhdGVWZXJ0ZXhCdWZmZXJXaXRoVHlwZWRBcnJheSh0aGlzLl9fdmFyaWF0aW9uVkJPVWlkLCBwYWNrZWREYXRhKTtcbiAgICAgIHZib0NvbnRlbnQuc2V0KHBhY2tlZERhdGEpO1xuICAgIH1cbiAgICB0aGlzLl9fdmFyaWF0aW9uVkJPSW5zdGFuY2VDb3VudCA9IGNvdW50O1xuXG4gICAgcmV0dXJuIGNvdW50O1xuICB9XG5cbiAgLyoqXG4gICAqIFBhY2tzIHRoZSB2aXNpYmxlIGluc3RhbmNlcyBpbnRvIHRoZSBlbmdpbmUtd2lkZSByZW1hcCB0YWJsZSBzbyB0aGF0IHRoZSBzaGFkZXIgY2FuXG4gICAqIHJlc29sdmUgYGluc3RhbmNlQmFzZSArIGdsX0luc3RhbmNlSURgIHRvIGEgc3RhYmxlIFNJRCBzbG90LiBXZWJHTCBtdWx0aS1kcmF3IG9ubHkuXG4gICAqXG4gICAqIEBwYXJhbSBjdWxsZWRFbnRpdHlTdGFtcCAtIFBlci1FbnRpdHlVSUQgc3RhbXBzIHdyaXR0ZW4gYnkgdGhlIHJlbmRlciBwYXNzIGN1bGxpbmdcbiAgICogQHBhcmFtIGN1bGxUaWNrIC0gVGhlIHN0YW1wIHZhbHVlIG9mIHRoZSBsYXRlc3QgY3VsbGluZyBvZiB0aGUgcmVuZGVyIHBhc3NcbiAgICogQHJldHVybnMgVGhlIG51bWJlciBvZiB2aXNpYmxlIGluc3RhbmNlc1xuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9wYWNrVmlzaWJsZUluc3RhbmNlc1RvSW5zdGFuY2VSZW1hcChjdWxsZWRFbnRpdHlTdGFtcDogVWludDMyQXJyYXkgfCB1bmRlZmluZWQsIGN1bGxUaWNrOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IGVudGl0eVVJRHMgPSB0aGlzLl9fdmFyaWF0aW9uRW50aXR5VUlEcztcbiAgICBpZiAoZW50aXR5VUlEcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2JlbG9uZ1RvRW50aXRpZXMubGVuZ3RoO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX2luc3RhbmNlU2lkQmFzZSA8IDApIHtcbiAgICAgIHRoaXMuX2Vuc3VyZUluc3RhbmNlU2lkQmFzZSgpO1xuICAgIH1cbiAgICBpZiAoY3VsbGVkRW50aXR5U3RhbXAgPT09IHRoaXMuX192YXJpYXRpb25WQk9DdWxsZWRFbnRpdHlTdGFtcCAmJiBjdWxsVGljayA9PT0gdGhpcy5fX3ZhcmlhdGlvblZCT0N1bGxUaWNrKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX3ZhcmlhdGlvblZCT0luc3RhbmNlQ291bnQ7XG4gICAgfVxuICAgIHRoaXMuX192YXJpYXRpb25WQk9DdWxsZWRFbnRpdHlTdGFtcCA9IGN1bGxlZEVudGl0eVN0YW1wO1xuICAgIHRoaXMuX192YXJpYXRpb25WQk9DdWxsVGljayA9IGN1bGxUaWNrO1xuXG4gICAgY29uc3QgdGFibGUgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5Lmluc3RhbmNlU2lkVGFibGU7XG4gICAgY29uc3QgYmFzZSA9IHRoaXMuX19pbnN0YW5jZVNpZEJhc2U7XG4gICAgY29uc3QgaW5zdGFuY2VOdW0gPSBlbnRpdHlVSURzLmxlbmd0aDtcbiAgICBsZXQgY291bnQgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdGFuY2VOdW07IGkrKykge1xuICAgICAgaWYgKGN1bGxlZEVudGl0eVN0YW1wICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3QgZW50aXR5VUlEID0gZW50aXR5VUlEc1tpXTtcbiAgICAgICAgaWYgKGVudGl0eVVJRCA8IGN1bGxlZEVudGl0eVN0YW1wLmxlbmd0aCAmJiBjdWxsZWRFbnRpdHlTdGFtcFtlbnRpdHlVSURdID09PSBjdWxsVGljaykge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0YWJsZS5zZXRSZW1hcChiYXNlICsgY291bnQsIGkpO1xuICAgICAgY291bnQrKztcbiAgICB9XG4gICAgdGhpcy5fX3ZhcmlhdGlvblZCT0luc3RhbmNlQ291bnQgPSBjb3VudDtcblxuICAgIHJldHVybiBjb3VudDtcbiAgfVxuXG4gIC8vL1xuICAvLy8gUHVibGljIFdlYkdMLXJlbGF0ZWQgTWV0aG9kc1xuICAvLy9cblxuICAvKipcbiAgICogRGVsZXRlcyB0aGUgdmFyaWF0aW9uIFZCTyAoVmVydGV4IEJ1ZmZlciBPYmplY3QpLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHVwZGF0ZWQsIGZhbHNlIGlmIG5vdCBjaGFuZ2VkIChub3QgZGlydHkpXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZGVsZXRlVmFyaWF0aW9uVkJPKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBpZiAodGhpcy5fX3ZhcmlhdGlvblZCT1VpZCAhPT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQpIHtcbiAgICAgIHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmRlbGV0ZVZlcnRleEJ1ZmZlcih0aGlzLl9fdmFyaWF0aW9uVkJPVWlkKTtcbiAgICAgIHRoaXMuX192YXJpYXRpb25WQk9VaWQgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgICAgIHRoaXMuX192YXJpYXRpb25FbnRpdHlJbmZvID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fX3ZhcmlhdGlvbkVudGl0eVVJRHMgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9fdmFyaWF0aW9uVkJPQ29udGVudCA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuX19wYWNrZWRWYXJpYXRpb25FbnRpdHlJbmZvID0gdW5kZWZpbmVkO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIFZBTyAoVmVydGV4IEFycmF5IE9iamVjdCkgZm9yIGFsbCBwcmltaXRpdmVzIGluIHRoaXMgbWVzaC5cbiAgICovXG4gIHB1YmxpYyB1cGRhdGVWQU8oKTogdm9pZCB7XG4gICAgY29uc3Qgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGlmICh3ZWJnbFJlc291cmNlUmVwb3NpdG9yeSA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gY3JlYXRlIGFuZCB1cGRhdGUgVkFPXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9fcHJpbWl0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJpbWl0aXZlID0gdGhpcy5fX3ByaW1pdGl2ZXNbaV07XG4gICAgICBjb25zdCBtdWx0aURyYXdHcm91cCA9IHByaW1pdGl2ZS5fbXVsdGlEcmF3R3JvdXA7XG4gICAgICBpZiAobXVsdGlEcmF3R3JvdXA/LnZlcnRleEhhbmRsZXMgIT0gbnVsbCkge1xuICAgICAgICAvLyBBbGwgbWVtYmVycyBvZiBhIG11bHRpLWRyYXcgZ3JvdXAgc2hhcmUgdGhlIGdyb3VwIFZBTy5cbiAgICAgICAgdGhpcy5fX3Zhb1VpZHNbaV0gPSBtdWx0aURyYXdHcm91cC52ZXJ0ZXhIYW5kbGVzLnZhb0hhbmRsZTtcbiAgICAgICAgdGhpcy5fX211bHRpRHJhd1Zhb0luZGljZXMuYWRkKGkpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHZlcnRleEhhbmRsZXMgPSBwcmltaXRpdmUudmVydGV4SGFuZGxlcyBhcyBWZXJ0ZXhIYW5kbGVzO1xuICAgICAgaWYgKElzLnVuZGVmaW5lZCh2ZXJ0ZXhIYW5kbGVzKSkge1xuICAgICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKCdOZWVkIHRvIGNyZWF0ZSAzREFQSVZlcnRleERhdGEgYmVmb3JlIHVwZGF0ZSBWQU8nKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgTnVtYmVyLmlzTmFOKHRoaXMuX192YW9VaWRzW2ldKSB8fFxuICAgICAgICB0aGlzLl9fdmFvVWlkc1tpXSA9PT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQgfHxcbiAgICAgICAgdmVydGV4SGFuZGxlcy52YW9IYW5kbGUgPT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkXG4gICAgICApIHtcbiAgICAgICAgdGhpcy5fX3Zhb1VpZHNbaV0gPSB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5jcmVhdGVWZXJ0ZXhBcnJheSgpITtcbiAgICAgICAgdmVydGV4SGFuZGxlcy52YW9IYW5kbGUgPSB0aGlzLl9fdmFvVWlkc1tpXTtcbiAgICAgIH1cblxuICAgICAgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuc2V0VmVydGV4RGF0YVRvUGlwZWxpbmUodmVydGV4SGFuZGxlcywgcHJpbWl0aXZlLCB0aGlzLl9fdmFyaWF0aW9uVkJPVWlkKTtcbiAgICB9XG5cbiAgICAvLyByZW1vdmUgdXNlbGVzcyBWQU8uIEdyb3VwIFZBT3MgYXJlIG93bmVkIGJ5IHRoZSBNdWx0aURyYXdSZXBvc2l0b3J5IGFuZCBtdXN0IG5vdCBiZSBkZWxldGVkIGhlcmUuXG4gICAgY29uc3QgbXVsdGlEcmF3UmVwb3NpdG9yeSA9IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmdldE11bHRpRHJhd1JlcG9zaXRvcnkodGhpcy5fX2VuZ2luZSk7XG4gICAgY29uc3QgcmVtb3ZlZEhhbmRsZXMgPSBuZXcgU2V0PENHQVBJUmVzb3VyY2VIYW5kbGU+KCk7XG4gICAgZm9yIChsZXQgaSA9IHRoaXMuX19wcmltaXRpdmVzLmxlbmd0aDsgaSA8IHRoaXMuX192YW9VaWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCB2YW9VaWQgPSB0aGlzLl9fdmFvVWlkc1tpXTtcbiAgICAgIGlmICh2YW9VaWQgJiYgIW11bHRpRHJhd1JlcG9zaXRvcnkuaGFzVmFvSGFuZGxlKHZhb1VpZCkpIHtcbiAgICAgICAgaWYgKCFyZW1vdmVkSGFuZGxlcy5oYXModmFvVWlkKSkge1xuICAgICAgICAgIHJlbW92ZWRIYW5kbGVzLmFkZCh2YW9VaWQpO1xuICAgICAgICAgIHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmRlbGV0ZVZlcnRleEFycmF5KHZhb1VpZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuX192YW9VaWRzW2ldID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZXMgYWxsIFZBTyAoVmVydGV4IEFycmF5IE9iamVjdCkgcmVzb3VyY2VzIGZvciB0aGlzIG1lc2guXG4gICAqIEdyb3VwIFZBT3MgYXJlIG93bmVkIGJ5IHRoZSBNdWx0aURyYXdSZXBvc2l0b3J5IGFuZCBhcmUgc2tpcHBlZC5cbiAgICovXG4gIHB1YmxpYyBkZWxldGVWQU8oKSB7XG4gICAgY29uc3Qgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGlmICh3ZWJnbFJlc291cmNlUmVwb3NpdG9yeSA9PSBudWxsKSB7XG4gICAgICB0aGlzLl9fdmFvVWlkcy5sZW5ndGggPSAwO1xuICAgICAgdGhpcy5fX211bHRpRHJhd1Zhb0luZGljZXMuY2xlYXIoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgbXVsdGlEcmF3UmVwb3NpdG9yeSA9IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmdldE11bHRpRHJhd1JlcG9zaXRvcnkodGhpcy5fX2VuZ2luZSk7XG4gICAgY29uc3QgZGVsZXRlZEhhbmRsZXMgPSBuZXcgU2V0PENHQVBJUmVzb3VyY2VIYW5kbGU+KCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9fdmFvVWlkcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgdmFvVWlkID0gdGhpcy5fX3Zhb1VpZHNbaV07XG4gICAgICBpZiAodmFvVWlkICYmICFkZWxldGVkSGFuZGxlcy5oYXModmFvVWlkKSAmJiAhbXVsdGlEcmF3UmVwb3NpdG9yeS5oYXNWYW9IYW5kbGUodmFvVWlkKSkge1xuICAgICAgICBkZWxldGVkSGFuZGxlcy5hZGQodmFvVWlkKTtcbiAgICAgICAgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuZGVsZXRlVmVydGV4QXJyYXkodmFvVWlkKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX192YW9VaWRzW2ldID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gICAgfVxuICAgIHRoaXMuX19tdWx0aURyYXdWYW9JbmRpY2VzLmNsZWFyKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIHRoZSBWQU8gZW50cmllcyB0aGF0IHBvaW50IGF0IG11bHRpLWRyYXcgZ3JvdXAgVkFPcy4gVGhlIGdyb3VwcyBvd24gdGhvc2VcbiAgICogVkFPcyBhbmQgZGVsZXRlIHRoZW0sIHNvIHRoZSBtZXNoIG11c3QgZm9yZ2V0IHRoZW0gYmVmb3JlIHRoZSBncm91cCBpcyByZWxlYXNlZC5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBfY2xlYXJNdWx0aURyYXdWYW9VaWRzKCk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgaW5kZXggb2YgdGhpcy5fX211bHRpRHJhd1Zhb0luZGljZXMpIHtcbiAgICAgIGlmIChpbmRleCA8IHRoaXMuX192YW9VaWRzLmxlbmd0aCkge1xuICAgICAgICB0aGlzLl9fdmFvVWlkc1tpbmRleF0gPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fX211bHRpRHJhd1Zhb0luZGljZXMuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtcyByYXkgY2FzdGluZyBhZ2FpbnN0IHRoaXMgbWVzaCB0byBmaW5kIGludGVyc2VjdGlvbiBwb2ludHMuXG4gICAqIEBwYXJhbSBzcmNQb2ludEluTG9jYWwgLSBUaGUgcmF5IG9yaWdpbiBwb2ludCBpbiBsb2NhbCBzcGFjZVxuICAgKiBAcGFyYW0gZGlyZWN0aW9uSW5Mb2NhbCAtIFRoZSByYXkgZGlyZWN0aW9uIGluIGxvY2FsIHNwYWNlXG4gICAqIEBwYXJhbSBkb3RUaHJlc2hvbGQgLSBUaGUgZG90IHByb2R1Y3QgdGhyZXNob2xkIGZvciBiYWNrLWZhY2UgY3VsbGluZyAoZGVmYXVsdDogMClcbiAgICogQHJldHVybnMgUmF5IGNhc3RpbmcgcmVzdWx0IHdpdGggaW50ZXJzZWN0aW9uIGluZm9ybWF0aW9uXG4gICAqL1xuICBwdWJsaWMgY2FzdFJheShzcmNQb2ludEluTG9jYWw6IElWZWN0b3IzLCBkaXJlY3Rpb25JbkxvY2FsOiBJVmVjdG9yMywgZG90VGhyZXNob2xkID0gMCk6IFJheWNhc3RSZXN1bHRFeDEge1xuICAgIGxldCBmaW5hbFNob3J0ZXN0SW50ZXJzZWN0ZWRQb3NWZWMzOiBJVmVjdG9yMyB8IHVuZGVmaW5lZDtcbiAgICBsZXQgZmluYWxTaG9ydGVzdFQgPSBOdW1iZXIuTUFYX1ZBTFVFO1xuICAgIGxldCB1ID0gMDtcbiAgICBsZXQgdiA9IDA7XG4gICAgZm9yIChjb25zdCBwcmltaXRpdmUgb2YgdGhpcy5fX3ByaW1pdGl2ZXMpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHByaW1pdGl2ZS5jYXN0UmF5KFxuICAgICAgICBzcmNQb2ludEluTG9jYWwsXG4gICAgICAgIGRpcmVjdGlvbkluTG9jYWwsXG4gICAgICAgIHRydWUsXG4gICAgICAgIHRydWUsXG4gICAgICAgIGRvdFRocmVzaG9sZCxcbiAgICAgICAgdGhpcy5fX2hhc0ZhY2VOb3JtYWxcbiAgICAgICk7XG4gICAgICBpZiAoSXMuZGVmaW5lZChyZXN1bHQuZGF0YSkgJiYgcmVzdWx0LmRhdGE/LnQgPCBmaW5hbFNob3J0ZXN0VCkge1xuICAgICAgICBmaW5hbFNob3J0ZXN0VCA9IHJlc3VsdC5kYXRhLnQ7XG4gICAgICAgIGZpbmFsU2hvcnRlc3RJbnRlcnNlY3RlZFBvc1ZlYzMgPSByZXN1bHQuZGF0YS5wb3NpdGlvbiE7XG4gICAgICAgIHUgPSByZXN1bHQuZGF0YS51O1xuICAgICAgICB2ID0gcmVzdWx0LmRhdGEudjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoSXMuZGVmaW5lZChmaW5hbFNob3J0ZXN0SW50ZXJzZWN0ZWRQb3NWZWMzKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdWx0OiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgdDogZmluYWxTaG9ydGVzdFQsXG4gICAgICAgICAgdSxcbiAgICAgICAgICB2LFxuICAgICAgICAgIHBvc2l0aW9uOiBmaW5hbFNob3J0ZXN0SW50ZXJzZWN0ZWRQb3NWZWMzLFxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3VsdDogZmFsc2UsXG4gICAgfTtcbiAgfVxuXG4gIC8vL1xuICAvLy9cbiAgLy8vIEFjY2Vzc29yc1xuICAvLy9cbiAgLy8vXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGFycmF5IG9mIHByaW1pdGl2ZXMgaW4gdGhpcyBtZXNoLlxuICAgKiBAcmV0dXJucyBBcnJheSBvZiBwcmltaXRpdmVzXG4gICAqL1xuICBnZXQgcHJpbWl0aXZlcygpIHtcbiAgICByZXR1cm4gdGhpcy5fX3ByaW1pdGl2ZXM7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoaXMgbWVzaC5cbiAgICogQHJldHVybnMgVGhlIG1lc2ggVUlEXG4gICAqL1xuICBnZXQgbWVzaFVJRCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX21lc2hVSUQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmFyaWF0aW9uIFZCTyBVSUQgZm9yIGludGVybmFsIHVzZS5cbiAgICogQHJldHVybnMgVGhlIHZhcmlhdGlvbiBWQk8gcmVzb3VyY2UgaGFuZGxlXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IF92YXJpYXRpb25WQk9VaWQoKTogQ0dBUElSZXNvdXJjZUhhbmRsZSB7XG4gICAgcmV0dXJuIHRoaXMuX192YXJpYXRpb25WQk9VaWQ7XG4gIH1cblxuICAvKipcbiAgICogVGhlIGluc3RhbmNlIHZhcmlhdGlvbiBkYXRhIG9mIHRoZSBpbnN0YW5jZXMsIGFzIHdyaXR0ZW4gdG8gdGhlIHZhcmlhdGlvbiBWQk8gYnkgYHVwZGF0ZVZhcmlhdGlvblZCT2A6XG4gICAqIGBbc2NlbmVHcmFwaFNJRCwgc2tlbGV0YWxTSUQsIGJsZW5kU2hhcGVTSUQsIDBdYCBwZXIgaW5zdGFuY2UsIGluIHRoZSBvcmRlciBvZiBgbWVzaEVudGl0aWVzSW5uZXJgLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGdldCBfdmFyaWF0aW9uRW50aXR5SW5mbygpOiBVaW50MzJBcnJheSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX192YXJpYXRpb25FbnRpdHlJbmZvO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGluc3RhbmNlcyBvZiB0aGlzIG1lc2ggY2FuIGJlIGN1bGxlZCBvbiB0aGUgR1BVIChXZWJHUFUgR1BVIGN1bGxpbmcpLlxuICAgKiBUaGUgYm91bmRpbmcgYm94ZXMgb2YgdGhlIGRlZm9ybWVkIGluc3RhbmNlcyAoc2tpbm5pbmcsIGJsZW5kIHNoYXBlcykgZGVwZW5kIG9uIHRoZSBkZWZvcm1hdGlvbjogdGhleSBhcmUgY3VsbGVkIG9uXG4gICAqIHRoZSBHUFUgb25seSB3aGVuIHRoZWlyIHZlcnRpY2VzIGFyZSBkZWZvcm1lZCBieSB0aGUgY29tcHV0ZSBzaGFkZXIgKGBDb25maWcuaXNDb21wdXRlU2tpbm5pbmdFbmFibGVkYCBhbmRcbiAgICogYF9pc0NvbXB1dGVEZWZvcm1hYmxlYCksIHdoaWNoIGNvbXB1dGVzIHRoZWlyIGJvdW5kaW5nIGJveGVzLiBPdGhlcndpc2UgdGhleSBhcmUgY3VsbGVkIG9uIHRoZSBDUFUuXG4gICAqIFVwZGF0ZWQgYnkgYHVwZGF0ZVZhcmlhdGlvblZCT2AuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IF9pc0dwdUN1bGxhYmxlKCk6IGJvb2xlYW4ge1xuICAgIGlmICghdGhpcy5fX2hhc0luc3RhbmNlcykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX25lZWRzQ29tcHV0ZURlZm9ybWF0aW9uKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX19lbmdpbmUuY29uZmlnLmlzQ29tcHV0ZVNraW5uaW5nRW5hYmxlZCAmJiB0aGlzLl9pc0NvbXB1dGVEZWZvcm1hYmxlO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIHZlcnRpY2VzIG9mIHRoZSBpbnN0YW5jZXMgYXJlIGRlZm9ybWVkIHdoZW4gZHJhd246IGFuIGluc3RhbmNlIGhhcyBhIHNrZWxldGFsIGNvbXBvbmVudCwgb3IgYSBibGVuZFxuICAgKiBzaGFwZSBjb21wb25lbnQgd2hpbGUgYSBwcmltaXRpdmUgaGFzIG1vcnBoIHRhcmdldHMuIFVwZGF0ZWQgYnkgYHVwZGF0ZVZhcmlhdGlvblZCT2AuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IF9uZWVkc0NvbXB1dGVEZWZvcm1hdGlvbigpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fX2hhc1NrZWxldGFsSW5zdGFuY2UpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX19oYXNCbGVuZFNoYXBlSW5zdGFuY2UpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9fcHJpbWl0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMuX19wcmltaXRpdmVzW2ldLnRhcmdldHMubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGNvbXB1dGUgc2hhZGVyIG9mIHRoZSBXZWJHUFUgR1BVIGN1bGxpbmcgY2FuIGRlZm9ybSB0aGUgdmVydGljZXMgb2YgdGhpcyBtZXNoIGxpa2UgdGhlIHZlcnRleCBzaGFkZXJzXG4gICAqIGRvIChwcm9jZXNzR2VvbWV0cnkpOiBldmVyeSBwcmltaXRpdmUgaGFzIGEgUE9TSVRJT04gYXR0cmlidXRlLCBwbHVzIEpPSU5UU18wIGFuZCBXRUlHSFRTXzAgd2hlbiBhbiBpbnN0YW5jZSBpc1xuICAgKiBza2lubmVkLCBhbmQgZXZlcnkgbW9ycGggdGFyZ2V0IGhhcyBhIFBPU0lUSU9OIGF0dHJpYnV0ZS5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBnZXQgX2lzQ29tcHV0ZURlZm9ybWFibGUoKTogYm9vbGVhbiB7XG4gICAgaWYgKFxuICAgICAgdGhpcy5fX2NvbXB1dGVEZWZvcm1hYmxlUHJpbWl0aXZlQ291bnQgPT09IHRoaXMuX19wcmltaXRpdmVzLmxlbmd0aCAmJlxuICAgICAgdGhpcy5fX2NvbXB1dGVEZWZvcm1hYmxlUG9zaXRpb25VcGRhdGVDb3VudCA9PT0gdGhpcy5fX3ByaW1pdGl2ZVBvc2l0aW9uVXBkYXRlQ291bnQgJiZcbiAgICAgIHRoaXMuX19jb21wdXRlRGVmb3JtYWJsZUhhc1NrZWxldGFsID09PSB0aGlzLl9faGFzU2tlbGV0YWxJbnN0YW5jZVxuICAgICkge1xuICAgICAgcmV0dXJuIHRoaXMuX19pc0NvbXB1dGVEZWZvcm1hYmxlO1xuICAgIH1cbiAgICB0aGlzLl9fY29tcHV0ZURlZm9ybWFibGVQcmltaXRpdmVDb3VudCA9IHRoaXMuX19wcmltaXRpdmVzLmxlbmd0aDtcbiAgICB0aGlzLl9fY29tcHV0ZURlZm9ybWFibGVQb3NpdGlvblVwZGF0ZUNvdW50ID0gdGhpcy5fX3ByaW1pdGl2ZVBvc2l0aW9uVXBkYXRlQ291bnQ7XG4gICAgdGhpcy5fX2NvbXB1dGVEZWZvcm1hYmxlSGFzU2tlbGV0YWwgPSB0aGlzLl9faGFzU2tlbGV0YWxJbnN0YW5jZTtcbiAgICB0aGlzLl9faXNDb21wdXRlRGVmb3JtYWJsZSA9IHRoaXMuX19jaGVja0NvbXB1dGVEZWZvcm1hYmxlKCk7XG4gICAgcmV0dXJuIHRoaXMuX19pc0NvbXB1dGVEZWZvcm1hYmxlO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2NoZWNrQ29tcHV0ZURlZm9ybWFibGUoKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX19wcmltaXRpdmVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBoYXNBdHRyaWJ1dGUgPSAoc2VtYW50aWNzOiBzdHJpbmdbXSwgbmFtZTogc3RyaW5nKSA9PiBzZW1hbnRpY3Muc29tZShzID0+IHMuc3BsaXQoJy4nKVswXSA9PT0gbmFtZSk7XG4gICAgZm9yIChjb25zdCBwcmltaXRpdmUgb2YgdGhpcy5fX3ByaW1pdGl2ZXMpIHtcbiAgICAgIGNvbnN0IHNlbWFudGljcyA9IHByaW1pdGl2ZS5hdHRyaWJ1dGVTZW1hbnRpY3M7XG4gICAgICBpZiAoIWhhc0F0dHJpYnV0ZShzZW1hbnRpY3MsICdQT1NJVElPTicpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5fX2hhc1NrZWxldGFsSW5zdGFuY2UgJiZcbiAgICAgICAgKCFoYXNBdHRyaWJ1dGUoc2VtYW50aWNzLCAnSk9JTlRTXzAnKSB8fCAhaGFzQXR0cmlidXRlKHNlbWFudGljcywgJ1dFSUdIVFNfMCcpKVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgdGFyZ2V0IG9mIHByaW1pdGl2ZS50YXJnZXRzKSB7XG4gICAgICAgIGxldCBoYXNQb3NpdGlvbiA9IGZhbHNlO1xuICAgICAgICBmb3IgKGNvbnN0IHNlbWFudGljIG9mIHRhcmdldC5rZXlzKCkpIHtcbiAgICAgICAgICBpZiAoc2VtYW50aWMuc3BsaXQoJy4nKVswXSA9PT0gJ1BPU0lUSU9OJykge1xuICAgICAgICAgICAgaGFzUG9zaXRpb24gPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWhhc1Bvc2l0aW9uKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCB3aGVuIHByaW1pdGl2ZSBwb3NpdGlvbiBkYXRhIGlzIHVwZGF0ZWQuXG4gICAqIFVwZGF0ZXMgdGhlIHBvc2l0aW9uIHVwZGF0ZSBjb3VudGVyIGFuZCBtb3ZlcyByZWxhdGVkIGVudGl0aWVzIHRvIExvYWQgc3RhZ2UuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX29uUHJpbWl0aXZlUG9zaXRpb25VcGRhdGVkKCkge1xuICAgIHRoaXMuX19wcmltaXRpdmVQb3NpdGlvblVwZGF0ZUNvdW50Kys7XG4gICAgTWVzaC5fX3ByaW1pdGl2ZVBvc2l0aW9uVXBkYXRlVmVyc2lvbisrO1xuICAgIGZvciAoY29uc3QgZW50aXR5IG9mIHRoaXMuX19iZWxvbmdUb0VudGl0aWVzKSB7XG4gICAgICBlbnRpdHkuZ2V0TWVzaFJlbmRlcmVyKCkubW92ZVN0YWdlVG8oUHJvY2Vzc1N0YWdlLkxvYWQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBwcmltaXRpdmUgcG9zaXRpb24gdXBkYXRlIGNvdW50LlxuICAgKiBAcmV0dXJucyBUaGUgbnVtYmVyIG9mIHRpbWVzIHByaW1pdGl2ZSBwb3NpdGlvbnMgaGF2ZSBiZWVuIHVwZGF0ZWRcbiAgICovXG4gIGdldCBwcmltaXRpdmVQb3NpdGlvblVwZGF0ZUNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLl9fcHJpbWl0aXZlUG9zaXRpb25VcGRhdGVDb3VudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIEFBQkIgaW4gbG9jYWwgc3BhY2UuXG4gICAqL1xuICBnZXQgQUFCQigpOiBBQUJCIHtcbiAgICBpZiAodGhpcy5fX3ByaW1pdGl2ZVBvc2l0aW9uVXBkYXRlQ291bnQgIT09IHRoaXMuX19sYXRlc3RQcmltaXRpdmVQb3NpdGlvbkFjY2Vzc29yVmVyc2lvbkZvckFBQkIpIHtcbiAgICAgIHRoaXMuX19sb2NhbEFBQkIuaW5pdGlhbGl6ZSgpO1xuICAgICAgdGhpcy5fX2xhdGVzdFByaW1pdGl2ZVBvc2l0aW9uQWNjZXNzb3JWZXJzaW9uRm9yQUFCQiA9IHRoaXMuX19wcmltaXRpdmVQb3NpdGlvblVwZGF0ZUNvdW50O1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9fbG9jYWxBQUJCLmlzVmFuaWxsYSgpKSB7XG4gICAgICBmb3IgKGNvbnN0IHByaW1pdGl2ZSBvZiB0aGlzLl9fcHJpbWl0aXZlcykge1xuICAgICAgICB0aGlzLl9fbG9jYWxBQUJCLm1lcmdlQUFCQihwcmltaXRpdmUuQUFCQik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX19sb2NhbEFBQkI7XG4gIH1cblxuICAvLy9cbiAgLy8vXG4gIC8vIEZyaWVuZCBNZW1iZXJzXG4gIC8vL1xuICAvLy9cblxuICAvLy9cbiAgLy8vXG4gIC8vLyBQcml2YXRlIE1lbWJlcnNcbiAgLy8vXG4gIC8vL1xuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIG1vcnBoIHRhcmdldCBwcmltaXRpdmVzIGJ5IGJsZW5kaW5nIHZlcnRleCBhdHRyaWJ1dGVzLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2NhbGNNb3JwaFByaW1pdGl2ZXMoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9fcHJpbWl0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbW9ycGhQcmltaXRpdmUgPSB0aGlzLl9fbW9ycGhQcmltaXRpdmVzW2ldO1xuICAgICAgY29uc3QgcHJpbWl0aXZlID0gdGhpcy5fX3ByaW1pdGl2ZXNbaV07XG4gICAgICBjb25zdCB0YXJnZXQwQXR0cmlidXRlcyA9IHByaW1pdGl2ZS50YXJnZXRzWzBdO1xuICAgICAgdGFyZ2V0MEF0dHJpYnV0ZXMuZm9yRWFjaCgoX2FjY2Vzc29yLCBzZW1hbnRpYykgPT4ge1xuICAgICAgICBjb25zdCBtb3JwaEFjY2Vzc29yID0gbW9ycGhQcmltaXRpdmUuZ2V0QXR0cmlidXRlKHNlbWFudGljKSE7XG4gICAgICAgIGNvbnN0IGVsZW1lbnRDb3VudCA9IG1vcnBoQWNjZXNzb3IuZWxlbWVudENvdW50O1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGVsZW1lbnRDb3VudDsgaisrKSB7XG4gICAgICAgICAgbW9ycGhBY2Nlc3Nvci5zZXRFbGVtZW50RnJvbVNhbWVDb21wb3NpdGlvbkFjY2Vzc29yKGosIHByaW1pdGl2ZS5nZXRBdHRyaWJ1dGUoc2VtYW50aWMpISk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBwcmltaXRpdmUudGFyZ2V0cy5mb3JFYWNoKCh0YXJnZXRBdHRyaWJ1dGVzLCBrKT0+e1xuICAgICAgLy8gICB0YXJnZXRBdHRyaWJ1dGVzLmZvckVhY2goKGFjY2Vzc29yLCBzZW1hbnRpYykgPT4ge1xuICAgICAgLy8gICAgIGNvbnN0IG1vcnBoQWNjZXNzb3IgPSBtb3JwaFByaW1pdGl2ZS5nZXRBdHRyaWJ1dGUoc2VtYW50aWMpITtcbiAgICAgIC8vICAgICBjb25zdCBlbGVtZW50Q291bnQgPSBtb3JwaEFjY2Vzc29yLmVsZW1lbnRDb3VudDtcbiAgICAgIC8vICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGVsZW1lbnRDb3VudDsgaisrKSB7XG4gICAgICAvLyAgICAgICBtb3JwaEFjY2Vzc29yLmFkZEVsZW1lbnRGcm9tU2FtZUNvbXBvc2l0aW9uQWNjZXNzb3IoaiwgYWNjZXNzb3IsIHRoaXMud2VpZ2h0c1trXSk7XG4gICAgICAvLyAgICAgfVxuICAgICAgLy8gICB9KTtcbiAgICAgIC8vIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9jYWxjVGFuZ2VudHMoKSB7XG4gICAgaWYgKCF0aGlzLl9fdXNlUHJlQ2FsY3VsYXRlZFRhbmdlbnQoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHByaW1pdGl2ZSBvZiB0aGlzLl9fcHJpbWl0aXZlcykge1xuICAgICAgY29uc3QgdGFuZ2VudElkeCA9IHByaW1pdGl2ZS5hdHRyaWJ1dGVTZW1hbnRpY3MuaW5kZXhPZihWZXJ0ZXhBdHRyaWJ1dGUuVGFuZ2VudC5YWVopO1xuICAgICAgaWYgKHRhbmdlbnRJZHggIT09IC0xICYmIHRoaXMudGFuZ2VudENhbGN1bGF0aW9uTW9kZSA9PT0gMikge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHRleGNvb3JkSWR4ID0gcHJpbWl0aXZlLmF0dHJpYnV0ZVNlbWFudGljcy5pbmRleE9mKFZlcnRleEF0dHJpYnV0ZS5UZXhjb29yZDAuWFkpO1xuICAgICAgY29uc3Qgbm9ybWFsSWR4ID0gcHJpbWl0aXZlLmF0dHJpYnV0ZVNlbWFudGljcy5pbmRleE9mKFZlcnRleEF0dHJpYnV0ZS5Ob3JtYWwuWFlaKTtcbiAgICAgIGlmICh0ZXhjb29yZElkeCAhPT0gLTEgJiYgbm9ybWFsSWR4ICE9PSAtMSkge1xuICAgICAgICBjb25zdCBwb3NpdGlvbklkeCA9IHByaW1pdGl2ZS5hdHRyaWJ1dGVTZW1hbnRpY3MuaW5kZXhPZihWZXJ0ZXhBdHRyaWJ1dGUuUG9zaXRpb24uWFlaKTtcblxuICAgICAgICBjb25zdCBwb3NpdGlvbkFjY2Vzc29yID0gcHJpbWl0aXZlLmF0dHJpYnV0ZUFjY2Vzc29yc1twb3NpdGlvbklkeF07XG4gICAgICAgIGNvbnN0IHRleGNvb3JkQWNjZXNzb3IgPSBwcmltaXRpdmUuYXR0cmlidXRlQWNjZXNzb3JzW3RleGNvb3JkSWR4XTtcbiAgICAgICAgY29uc3Qgbm9ybWFsQWNjZXNzb3IgPSBwcmltaXRpdmUuYXR0cmlidXRlQWNjZXNzb3JzW25vcm1hbElkeF07XG4gICAgICAgIGNvbnN0IGluZGljZXNBY2Nlc3NvciA9IHByaW1pdGl2ZS5pbmRpY2VzQWNjZXNzb3I7XG5cbiAgICAgICAgbGV0IGluY3JlbWVudE51bSA9IDM7IC8vIFByaW1pdGl2ZU1vZGUuVHJpYW5nbGVzXG4gICAgICAgIGlmIChcbiAgICAgICAgICBwcmltaXRpdmUucHJpbWl0aXZlTW9kZSA9PT0gUHJpbWl0aXZlTW9kZS5UcmlhbmdsZVN0cmlwIHx8XG4gICAgICAgICAgcHJpbWl0aXZlLnByaW1pdGl2ZU1vZGUgPT09IFByaW1pdGl2ZU1vZGUuVHJpYW5nbGVGYW5cbiAgICAgICAgKSB7XG4gICAgICAgICAgaW5jcmVtZW50TnVtID0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHZlcnRleE51bSA9IHByaW1pdGl2ZS5nZXRWZXJ0ZXhDb3VudEFzSW5kaWNlc0Jhc2VkKCk7XG4gICAgICAgIGNvbnN0IHRhbmdlbnRBdHRyaWJ1dGVCeXRlU2l6ZSA9IChwb3NpdGlvbkFjY2Vzc29yLmJ5dGVMZW5ndGggKiA0KSAvIDM7XG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMuX19lbmdpbmUubWVtb3J5TWFuYWdlci5jcmVhdGVCdWZmZXJPbkRlbWFuZChcbiAgICAgICAgICBCdWZmZXJVc2UuQ1BVR2VuZXJpYyxcbiAgICAgICAgICB0YW5nZW50QXR0cmlidXRlQnl0ZVNpemUsXG4gICAgICAgICAgNFxuICAgICAgICApO1xuICAgICAgICBjb25zdCB0YW5nZW50QnVmZmVyVmlldyA9IGJ1ZmZlclxuICAgICAgICAgIC50YWtlQnVmZmVyVmlldyh7XG4gICAgICAgICAgICBieXRlTGVuZ3RoVG9OZWVkOiB0YW5nZW50QXR0cmlidXRlQnl0ZVNpemUsXG4gICAgICAgICAgICBieXRlU3RyaWRlOiAwLFxuICAgICAgICAgIH0pXG4gICAgICAgICAgLnVud3JhcEZvcmNlKCk7XG4gICAgICAgIGNvbnN0IHRhbmdlbnRBY2Nlc3NvciA9IHRhbmdlbnRCdWZmZXJWaWV3XG4gICAgICAgICAgLnRha2VBY2Nlc3Nvcih7XG4gICAgICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWM0LFxuICAgICAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgICAgICAgIGNvdW50OiBwb3NpdGlvbkFjY2Vzc29yLmVsZW1lbnRDb3VudCxcbiAgICAgICAgICB9KVxuICAgICAgICAgIC51bndyYXBGb3JjZSgpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZlcnRleE51bSAtIDI7IGkgKz0gaW5jcmVtZW50TnVtKSB7XG4gICAgICAgICAgY29uc3QgcG9zMCA9IHBvc2l0aW9uQWNjZXNzb3IuZ2V0VmVjMyhpLCB7IGluZGljZXNBY2Nlc3NvciB9KTtcbiAgICAgICAgICBjb25zdCBwb3MxID0gcG9zaXRpb25BY2Nlc3Nvci5nZXRWZWMzKGkgKyAxLCB7IGluZGljZXNBY2Nlc3NvciB9KTtcbiAgICAgICAgICBjb25zdCBwb3MyID0gcG9zaXRpb25BY2Nlc3Nvci5nZXRWZWMzKGkgKyAyLCB7IGluZGljZXNBY2Nlc3NvciB9KTtcbiAgICAgICAgICBjb25zdCB1djAgPSB0ZXhjb29yZEFjY2Vzc29yLmdldFZlYzIoaSwgeyBpbmRpY2VzQWNjZXNzb3IgfSk7XG4gICAgICAgICAgY29uc3QgdXYxID0gdGV4Y29vcmRBY2Nlc3Nvci5nZXRWZWMyKGkgKyAxLCB7IGluZGljZXNBY2Nlc3NvciB9KTtcbiAgICAgICAgICBjb25zdCB1djIgPSB0ZXhjb29yZEFjY2Vzc29yLmdldFZlYzIoaSArIDIsIHsgaW5kaWNlc0FjY2Vzc29yIH0pO1xuICAgICAgICAgIGNvbnN0IG5vcm0wID0gbm9ybWFsQWNjZXNzb3IuZ2V0VmVjMyhpLCB7IGluZGljZXNBY2Nlc3NvciB9KTtcblxuICAgICAgICAgIHRoaXMuX19jYWxjVGFuZ2VudEZvcjNWZXJ0aWNlcyhpLCBwb3MwLCBwb3MxLCBwb3MyLCB1djAsIHV2MSwgdXYyLCBub3JtMCwgdGFuZ2VudEFjY2Vzc29yLCBpbmRpY2VzQWNjZXNzb3IpO1xuICAgICAgICB9XG4gICAgICAgIHByaW1pdGl2ZS5zZXRWZXJ0ZXhBdHRyaWJ1dGUodGFuZ2VudEFjY2Vzc29yLCBWZXJ0ZXhBdHRyaWJ1dGUuVGFuZ2VudC5YWVopO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRhbmdlbnQgdmVjdG9ycyBmb3IgYSB0cmlhbmdsZSBjb25zaXN0aW5nIG9mIDMgdmVydGljZXMuXG4gICAqIEBwYXJhbSBpIC0gVGhlIHN0YXJ0aW5nIHZlcnRleCBpbmRleFxuICAgKiBAcGFyYW0gcG9zMCAtIFBvc2l0aW9uIG9mIHRoZSBmaXJzdCB2ZXJ0ZXhcbiAgICogQHBhcmFtIHBvczEgLSBQb3NpdGlvbiBvZiB0aGUgc2Vjb25kIHZlcnRleFxuICAgKiBAcGFyYW0gcG9zMiAtIFBvc2l0aW9uIG9mIHRoZSB0aGlyZCB2ZXJ0ZXhcbiAgICogQHBhcmFtIHV2MCAtIFVWIGNvb3JkaW5hdGVzIG9mIHRoZSBmaXJzdCB2ZXJ0ZXhcbiAgICogQHBhcmFtIHV2MSAtIFVWIGNvb3JkaW5hdGVzIG9mIHRoZSBzZWNvbmQgdmVydGV4XG4gICAqIEBwYXJhbSB1djIgLSBVViBjb29yZGluYXRlcyBvZiB0aGUgdGhpcmQgdmVydGV4XG4gICAqIEBwYXJhbSBub3JtMCAtIE5vcm1hbCB2ZWN0b3Igb2YgdGhlIGZpcnN0IHZlcnRleFxuICAgKiBAcGFyYW0gdGFuZ2VudEFjY2Vzc29yIC0gQWNjZXNzb3IgZm9yIHdyaXRpbmcgdGFuZ2VudCBkYXRhXG4gICAqIEBwYXJhbSBpbmRpY2VzQWNjZXNzb3IgLSBPcHRpb25hbCBpbmRpY2VzIGFjY2Vzc29yXG4gICAqIEBwcml2YXRlXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBfX2NhbGNUYW5nZW50Rm9yM1ZlcnRpY2VzKFxuICAgIGk6IEluZGV4LFxuICAgIHBvczA6IFZlY3RvcjMsXG4gICAgcG9zMTogVmVjdG9yMyxcbiAgICBwb3MyOiBWZWN0b3IzLFxuICAgIHV2MDogVmVjdG9yMixcbiAgICB1djE6IFZlY3RvcjIsXG4gICAgdXYyOiBWZWN0b3IyLFxuICAgIG5vcm0wOiBWZWN0b3IzLFxuICAgIHRhbmdlbnRBY2Nlc3NvcjogQWNjZXNzb3IsXG4gICAgaW5kaWNlc0FjY2Vzc29yPzogQWNjZXNzb3JcbiAgKSB7XG4gICAgY29uc3QgdGFuMFZlYzMgPSB0aGlzLl9fY2FsY1RhbmdlbnRQZXJWZXJ0ZXgocG9zMCwgcG9zMSwgcG9zMiwgdXYwLCB1djEsIHV2Miwgbm9ybTAsIE1lc2guX190bXBSZXR1cm5WZWMzXzApO1xuICAgIGNvbnN0IHRhbjFWZWMzID0gdGhpcy5fX2NhbGNUYW5nZW50UGVyVmVydGV4KHBvczEsIHBvczIsIHBvczAsIHV2MSwgdXYyLCB1djAsIG5vcm0wLCBNZXNoLl9fdG1wUmV0dXJuVmVjM18xKTtcbiAgICBjb25zdCB0YW4yVmVjMyA9IHRoaXMuX19jYWxjVGFuZ2VudFBlclZlcnRleChwb3MyLCBwb3MwLCBwb3MxLCB1djIsIHV2MCwgdXYxLCBub3JtMCwgTWVzaC5fX3RtcFJldHVyblZlYzNfMik7XG5cbiAgICB0YW5nZW50QWNjZXNzb3Iuc2V0VmVjNChpLCB0YW4wVmVjMy54LCB0YW4wVmVjMy55LCB0YW4wVmVjMy56LCAxLCB7XG4gICAgICBpbmRpY2VzQWNjZXNzb3IsXG4gICAgfSk7XG4gICAgdGFuZ2VudEFjY2Vzc29yLnNldFZlYzQoaSArIDEsIHRhbjFWZWMzLngsIHRhbjFWZWMzLnksIHRhbjFWZWMzLnosIDEsIHtcbiAgICAgIGluZGljZXNBY2Nlc3NvcixcbiAgICB9KTtcbiAgICB0YW5nZW50QWNjZXNzb3Iuc2V0VmVjNChpICsgMiwgdGFuMlZlYzMueCwgdGFuMlZlYzMueSwgdGFuMlZlYzMueiwgMSwge1xuICAgICAgaW5kaWNlc0FjY2Vzc29yLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIHRhbmdlbnQgdmVjdG9yIGZvciBhIHNpbmdsZSB2ZXJ0ZXguXG4gICAqIEBwYXJhbSBwb3MwVmVjMyAtIFBvc2l0aW9uIG9mIHRoZSB0YXJnZXQgdmVydGV4XG4gICAqIEBwYXJhbSBwb3MxVmVjMyAtIFBvc2l0aW9uIG9mIHRoZSBzZWNvbmQgdmVydGV4XG4gICAqIEBwYXJhbSBwb3MyVmVjMyAtIFBvc2l0aW9uIG9mIHRoZSB0aGlyZCB2ZXJ0ZXhcbiAgICogQHBhcmFtIHV2MFZlYzIgLSBVViBjb29yZGluYXRlcyBvZiB0aGUgdGFyZ2V0IHZlcnRleFxuICAgKiBAcGFyYW0gdXYxVmVjMiAtIFVWIGNvb3JkaW5hdGVzIG9mIHRoZSBzZWNvbmQgdmVydGV4XG4gICAqIEBwYXJhbSB1djJWZWMyIC0gVVYgY29vcmRpbmF0ZXMgb2YgdGhlIHRoaXJkIHZlcnRleFxuICAgKiBAcGFyYW0gbm9ybTBWZWMzIC0gTm9ybWFsIHZlY3RvciBvZiB0aGUgdGFyZ2V0IHZlcnRleFxuICAgKiBAcGFyYW0gcmV0dXJuVmVjMyAtIE11dGFibGUgdmVjdG9yIHRvIHN0b3JlIHRoZSByZXN1bHRcbiAgICogQHJldHVybnMgVGhlIGNhbGN1bGF0ZWQgdGFuZ2VudCB2ZWN0b3JcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX19jYWxjVGFuZ2VudFBlclZlcnRleChcbiAgICBwb3MwVmVjMzogVmVjdG9yMyxcbiAgICBwb3MxVmVjMzogVmVjdG9yMyxcbiAgICBwb3MyVmVjMzogVmVjdG9yMyxcbiAgICB1djBWZWMyOiBWZWN0b3IyLFxuICAgIHV2MVZlYzI6IFZlY3RvcjIsXG4gICAgdXYyVmVjMjogVmVjdG9yMixcbiAgICBub3JtMFZlYzM6IFZlY3RvcjMsXG4gICAgcmV0dXJuVmVjMzogTXV0YWJsZVZlY3RvcjNcbiAgKSB7XG4gICAgY29uc3QgY3AwID0gW1xuICAgICAgTWVzaC5fX3RtcFZlYzNfMC5zZXRDb21wb25lbnRzKHBvczBWZWMzLngsIHV2MFZlYzIueCwgdXYwVmVjMi55KSxcbiAgICAgIE1lc2guX190bXBWZWMzXzEuc2V0Q29tcG9uZW50cyhwb3MwVmVjMy55LCB1djBWZWMyLngsIHV2MFZlYzIueSksXG4gICAgICBNZXNoLl9fdG1wVmVjM18yLnNldENvbXBvbmVudHMocG9zMFZlYzMueiwgdXYwVmVjMi54LCB1djBWZWMyLnkpLFxuICAgIF07XG5cbiAgICBjb25zdCBjcDEgPSBbXG4gICAgICBNZXNoLl9fdG1wVmVjM18zLnNldENvbXBvbmVudHMocG9zMVZlYzMueCwgdXYxVmVjMi54LCB1djFWZWMyLnkpLFxuICAgICAgTWVzaC5fX3RtcFZlYzNfNC5zZXRDb21wb25lbnRzKHBvczFWZWMzLnksIHV2MVZlYzIueCwgdXYxVmVjMi55KSxcbiAgICAgIE1lc2guX190bXBWZWMzXzUuc2V0Q29tcG9uZW50cyhwb3MxVmVjMy56LCB1djFWZWMyLngsIHV2MVZlYzIueSksXG4gICAgXTtcblxuICAgIGNvbnN0IGNwMiA9IFtcbiAgICAgIE1lc2guX190bXBWZWMzXzYuc2V0Q29tcG9uZW50cyhwb3MyVmVjMy54LCB1djJWZWMyLngsIHV2MlZlYzIueSksXG4gICAgICBNZXNoLl9fdG1wVmVjM183LnNldENvbXBvbmVudHMocG9zMlZlYzMueSwgdXYyVmVjMi54LCB1djJWZWMyLnkpLFxuICAgICAgTWVzaC5fX3RtcFZlYzNfOC5zZXRDb21wb25lbnRzKHBvczJWZWMzLnosIHV2MlZlYzIueCwgdXYyVmVjMi55KSxcbiAgICBdO1xuXG4gICAgY29uc3QgdSA9IFtdO1xuICAgIGNvbnN0IHYgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICBjb25zdCB2MSA9IE11dGFibGVWZWN0b3IzLnN1YnRyYWN0VG8oY3AxW2ldLCBjcDBbaV0sIE1lc2guX190bXBWZWMzXzkpO1xuICAgICAgY29uc3QgdjIgPSBNdXRhYmxlVmVjdG9yMy5zdWJ0cmFjdFRvKGNwMltpXSwgY3AxW2ldLCBNZXNoLl9fdG1wVmVjM18xMCk7XG4gICAgICBjb25zdCBhYmMgPSBNdXRhYmxlVmVjdG9yMy5jcm9zc1RvKHYxLCB2MiwgTWVzaC5fX3RtcFZlYzNfMTEpO1xuXG4gICAgICBjb25zdCB2YWxpZGF0ZSA9IE1hdGguYWJzKGFiYy54KSA8IE51bWJlci5FUFNJTE9OO1xuICAgICAgaWYgKHZhbGlkYXRlKSB7XG4gICAgICAgIExvZ2dlci5kZWZhdWx0LmFzc2VydCh2YWxpZGF0ZSwgJ1BvbHlnb25zIG9yIHBvbHlnb25zIG9uIFVWIGFyZSBkZWdlbmVyYXRlIScpO1xuICAgICAgICByZXR1cm4gVmVjdG9yMy5mcm9tQ29weUFycmF5KFswLCAwLCAwXSk7XG4gICAgICB9XG5cbiAgICAgIHVbaV0gPSAtYWJjLnkgLyBhYmMueDtcbiAgICAgIHZbaV0gPSAtYWJjLnogLyBhYmMueDtcbiAgICB9XG5cbiAgICBpZiAodVswXSAqIHVbMF0gKyB1WzFdICogdVsxXSArIHVbMl0gKiB1WzJdIDwgTnVtYmVyLkVQU0lMT04pIHtcbiAgICAgIE11dGFibGVWZWN0b3IzLmNyb3NzVG8obm9ybTBWZWMzLCBwb3MxVmVjMywgcmV0dXJuVmVjMyk7XG4gICAgICByZXR1cm4gcmV0dXJuVmVjMy5ub3JtYWxpemUoKSBhcyBWZWN0b3IzO1xuICAgIH1cblxuICAgIHJldHVybiByZXR1cm5WZWMzLnNldENvbXBvbmVudHModVswXSwgdVsxXSwgdVsyXSkubm9ybWFsaXplKCkgYXMgVmVjdG9yMztcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgdG8gdXNlIHByZS1jYWxjdWxhdGVkIHRhbmdlbnQgdmVjdG9ycyBiYXNlZCBvbiB0aGUgdGFuZ2VudCBjYWxjdWxhdGlvbiBtb2RlLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRhbmdlbnQgdmVjdG9ycyBzaG91bGQgYmUgcHJlLWNhbGN1bGF0ZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX3VzZVByZUNhbGN1bGF0ZWRUYW5nZW50KCkge1xuICAgIGlmICh0aGlzLnRhbmdlbnRDYWxjdWxhdGlvbk1vZGUgPT09IDAgfHwgdGhpcy50YW5nZW50Q2FsY3VsYXRpb25Nb2RlID09PSAxIHx8IHRoaXMudGFuZ2VudENhbGN1bGF0aW9uTW9kZSA9PT0gMykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIGJhcnljZW50cmljIGNvb3JkaW5hdGVzIGZvciBhbGwgcHJpbWl0aXZlcyBpbiB0aGlzIG1lc2guXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2NhbGNCYXJ5Q2VudHJpY0Nvb3JkKCkge1xuICAgIGZvciAoY29uc3QgcHJpbWl0aXZlIG9mIHRoaXMuX19wcmltaXRpdmVzKSB7XG4gICAgICBjb25zdCBiYXJ5Q2VudHJpY0Nvb3JkQWNjZXNzb3IgPSBwcmltaXRpdmUuZ2V0QXR0cmlidXRlKFZlcnRleEF0dHJpYnV0ZS5CYXJ5Q2VudHJpY0Nvb3JkLlhZWik7XG4gICAgICBpZiAoYmFyeUNlbnRyaWNDb29yZEFjY2Vzc29yICE9IG51bGwpIHtcbiAgICAgICAgY29uc3QgcG9zaXRpb25JZHggPSBwcmltaXRpdmUuYXR0cmlidXRlU2VtYW50aWNzLmluZGV4T2YoVmVydGV4QXR0cmlidXRlLlBvc2l0aW9uLlhZWik7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uQWNjZXNzb3IgPSBwcmltaXRpdmUuYXR0cmlidXRlQWNjZXNzb3JzW3Bvc2l0aW9uSWR4XTtcbiAgICAgICAgY29uc3QgdmVydGV4TnVtID0gcG9zaXRpb25BY2Nlc3Nvci5lbGVtZW50Q291bnQ7XG4gICAgICAgIGNvbnN0IG51bSA9IHZlcnRleE51bTtcbiAgICAgICAgZm9yIChsZXQgdmVyX2kgPSAwOyB2ZXJfaSA8IG51bTsgdmVyX2krKykge1xuICAgICAgICAgIGNvbnN0IHZlYzQgPSBiYXJ5Q2VudHJpY0Nvb3JkQWNjZXNzb3IuZ2V0VmVjNCh2ZXJfaSwge30pO1xuICAgICAgICAgIGJhcnlDZW50cmljQ29vcmRBY2Nlc3Nvci5zZXRWZWM0KFxuICAgICAgICAgICAgdmVyX2ksXG4gICAgICAgICAgICB2ZXJfaSAlIDMgPT09IDAgPyAxIDogMCwgLy8gMSAwIDAgIDEgMCAwICAxIDAgMCxcbiAgICAgICAgICAgIHZlcl9pICUgMyA9PT0gMSA/IDEgOiAwLCAvLyAwIDEgMCAgMCAxIDAgIDAgMSAwLFxuICAgICAgICAgICAgdmVyX2kgJSAzID09PSAyID8gMSA6IDAsIC8vIDAgMCAxICAwIDAgMSAgMCAwIDEsXG4gICAgICAgICAgICB2ZWM0LncsXG4gICAgICAgICAgICB7fVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uSWR4ID0gcHJpbWl0aXZlLmF0dHJpYnV0ZVNlbWFudGljcy5pbmRleE9mKFZlcnRleEF0dHJpYnV0ZS5Qb3NpdGlvbi5YWVopO1xuICAgICAgICBjb25zdCBwb3NpdGlvbkFjY2Vzc29yID0gcHJpbWl0aXZlLmF0dHJpYnV0ZUFjY2Vzc29yc1twb3NpdGlvbklkeF07XG4gICAgICAgIGNvbnN0IHZlcnRleE51bSA9IHBvc2l0aW9uQWNjZXNzb3IuZWxlbWVudENvdW50O1xuICAgICAgICBjb25zdCBudW0gPSB2ZXJ0ZXhOdW07XG5cbiAgICAgICAgY29uc3QgYmFyeUNlbnRyaWNDb29yZEF0dHJpYnV0ZUJ5dGVTaXplID0gbnVtICogNCAvKiB2ZWM0ICovICogNDsgLyogYnl0ZXMgKi9cbiAgICAgICAgY29uc3QgYnVmZmVyID0gdGhpcy5fX2VuZ2luZS5tZW1vcnlNYW5hZ2VyLmNyZWF0ZUJ1ZmZlck9uRGVtYW5kKFxuICAgICAgICAgIEJ1ZmZlclVzZS5DUFVHZW5lcmljLFxuICAgICAgICAgIGJhcnlDZW50cmljQ29vcmRBdHRyaWJ1dGVCeXRlU2l6ZSxcbiAgICAgICAgICA0XG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IGJhcnlDZW50cmljQ29vcmRCdWZmZXJWaWV3ID0gYnVmZmVyXG4gICAgICAgICAgLnRha2VCdWZmZXJWaWV3KHtcbiAgICAgICAgICAgIGJ5dGVMZW5ndGhUb05lZWQ6IGJhcnlDZW50cmljQ29vcmRBdHRyaWJ1dGVCeXRlU2l6ZSxcbiAgICAgICAgICAgIGJ5dGVTdHJpZGU6IDAsXG4gICAgICAgICAgfSlcbiAgICAgICAgICAudW53cmFwRm9yY2UoKTtcbiAgICAgICAgY29uc3QgYmFyeUNlbnRyaWNDb29yZEFjY2Vzc29yID0gYmFyeUNlbnRyaWNDb29yZEJ1ZmZlclZpZXdcbiAgICAgICAgICAudGFrZUFjY2Vzc29yKHtcbiAgICAgICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlZlYzQsXG4gICAgICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgICAgICAgICAgY291bnQ6IG51bSxcbiAgICAgICAgICB9KVxuICAgICAgICAgIC51bndyYXBGb3JjZSgpO1xuXG4gICAgICAgIGZvciAobGV0IHZlcl9pID0gMDsgdmVyX2kgPCBudW07IHZlcl9pKyspIHtcbiAgICAgICAgICBiYXJ5Q2VudHJpY0Nvb3JkQWNjZXNzb3Iuc2V0VmVjNChcbiAgICAgICAgICAgIHZlcl9pLFxuICAgICAgICAgICAgdmVyX2kgJSAzID09PSAwID8gMSA6IDAsIC8vIDEgMCAwICAxIDAgMCAgMSAwIDAsXG4gICAgICAgICAgICB2ZXJfaSAlIDMgPT09IDEgPyAxIDogMCwgLy8gMCAxIDAgIDAgMSAwICAwIDEgMCxcbiAgICAgICAgICAgIHZlcl9pICUgMyA9PT0gMiA/IDEgOiAwLCAvLyAwIDAgMSAgMCAwIDEgIDAgMCAxLFxuICAgICAgICAgICAgdmVyX2ksXG4gICAgICAgICAgICB7fVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgcHJpbWl0aXZlLnNldFZlcnRleEF0dHJpYnV0ZShiYXJ5Q2VudHJpY0Nvb3JkQWNjZXNzb3IsIFZlcnRleEF0dHJpYnV0ZS5CYXJ5Q2VudHJpY0Nvb3JkLlhZWik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgZmFjZSBub3JtYWxzIGZvciBwcmltaXRpdmVzIHRoYXQgZG9uJ3QgaGF2ZSBub3JtYWwgYXR0cmlidXRlcy5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBfY2FsY0ZhY2VOb3JtYWxzSWZOb25Ob3JtYWwoKSB7XG4gICAgZm9yIChjb25zdCBwcmltaXRpdmUgb2YgdGhpcy5fX3ByaW1pdGl2ZXMpIHtcbiAgICAgIGNvbnN0IG5vcm1hbElkeCA9IHByaW1pdGl2ZS5hdHRyaWJ1dGVTZW1hbnRpY3MuaW5kZXhPZihWZXJ0ZXhBdHRyaWJ1dGUuTm9ybWFsLlhZWik7XG4gICAgICBpZiAobm9ybWFsSWR4ICE9PSAtMSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX19oYXNGYWNlTm9ybWFsID0gdHJ1ZTtcblxuICAgICAgY29uc3QgcG9zaXRpb25JZHggPSBwcmltaXRpdmUuYXR0cmlidXRlU2VtYW50aWNzLmluZGV4T2YoVmVydGV4QXR0cmlidXRlLlBvc2l0aW9uLlhZWik7XG4gICAgICBjb25zdCBwb3NpdGlvbkFjY2Vzc29yID0gcHJpbWl0aXZlLmF0dHJpYnV0ZUFjY2Vzc29yc1twb3NpdGlvbklkeF07XG4gICAgICBjb25zdCBpbmRpY2VzQWNjZXNzb3IgPSBwcmltaXRpdmUuaW5kaWNlc0FjY2Vzc29yO1xuXG4gICAgICBsZXQgaW5jcmVtZW50TnVtID0gMzsgLy8gUHJpbWl0aXZlTW9kZS5UcmlhbmdsZXNcbiAgICAgIGlmIChcbiAgICAgICAgcHJpbWl0aXZlLnByaW1pdGl2ZU1vZGUgPT09IFByaW1pdGl2ZU1vZGUuVHJpYW5nbGVTdHJpcCB8fFxuICAgICAgICBwcmltaXRpdmUucHJpbWl0aXZlTW9kZSA9PT0gUHJpbWl0aXZlTW9kZS5UcmlhbmdsZUZhblxuICAgICAgKSB7XG4gICAgICAgIGluY3JlbWVudE51bSA9IDE7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHZlcnRleE51bSA9IHByaW1pdGl2ZS5nZXRWZXJ0ZXhDb3VudEFzSW5kaWNlc0Jhc2VkKCk7XG5cbiAgICAgIGNvbnN0IG5vcm1hbEF0dHJpYnV0ZUJ5dGVTaXplID0gcG9zaXRpb25BY2Nlc3Nvci5ieXRlTGVuZ3RoO1xuICAgICAgY29uc3QgYnVmZmVyID0gdGhpcy5fX2VuZ2luZS5tZW1vcnlNYW5hZ2VyLmNyZWF0ZUJ1ZmZlck9uRGVtYW5kKEJ1ZmZlclVzZS5DUFVHZW5lcmljLCBub3JtYWxBdHRyaWJ1dGVCeXRlU2l6ZSwgNCk7XG4gICAgICBjb25zdCBub3JtYWxCdWZmZXJWaWV3ID0gYnVmZmVyXG4gICAgICAgIC50YWtlQnVmZmVyVmlldyh7XG4gICAgICAgICAgYnl0ZUxlbmd0aFRvTmVlZDogbm9ybWFsQXR0cmlidXRlQnl0ZVNpemUsXG4gICAgICAgICAgYnl0ZVN0cmlkZTogMCxcbiAgICAgICAgfSlcbiAgICAgICAgLnVud3JhcEZvcmNlKCk7XG4gICAgICBjb25zdCBub3JtYWxBY2Nlc3NvciA9IG5vcm1hbEJ1ZmZlclZpZXdcbiAgICAgICAgLnRha2VBY2Nlc3Nvcih7XG4gICAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjMyxcbiAgICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgICAgICAgIGNvdW50OiBwb3NpdGlvbkFjY2Vzc29yLmVsZW1lbnRDb3VudCxcbiAgICAgICAgfSlcbiAgICAgICAgLnVud3JhcEZvcmNlKCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZlcnRleE51bSAtIDI7IGkgKz0gaW5jcmVtZW50TnVtKSB7XG4gICAgICAgIGNvbnN0IHBvczAgPSBwb3NpdGlvbkFjY2Vzc29yLmdldFZlYzMoaSwgeyBpbmRpY2VzQWNjZXNzb3IgfSk7XG4gICAgICAgIGNvbnN0IHBvczEgPSBwb3NpdGlvbkFjY2Vzc29yLmdldFZlYzMoaSArIDEsIHsgaW5kaWNlc0FjY2Vzc29yIH0pO1xuICAgICAgICBjb25zdCBwb3MyID0gcG9zaXRpb25BY2Nlc3Nvci5nZXRWZWMzKGkgKyAyLCB7IGluZGljZXNBY2Nlc3NvciB9KTtcblxuICAgICAgICB0aGlzLl9fY2FsY0ZhY2VOb3JtYWxGb3IzVmVydGljZXMoaSwgcG9zMCwgcG9zMSwgcG9zMiwgbm9ybWFsQWNjZXNzb3IsIGluZGljZXNBY2Nlc3Nvcik7XG4gICAgICB9XG4gICAgICBwcmltaXRpdmUuc2V0VmVydGV4QXR0cmlidXRlKG5vcm1hbEFjY2Vzc29yLCBWZXJ0ZXhBdHRyaWJ1dGUuTm9ybWFsLlhZWik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgZmFjZSBub3JtYWxzIGZvciBhIHRyaWFuZ2xlIGNvbnNpc3Rpbmcgb2YgMyB2ZXJ0aWNlcy5cbiAgICogQHBhcmFtIGkgLSBUaGUgc3RhcnRpbmcgdmVydGV4IGluZGV4XG4gICAqIEBwYXJhbSBwb3MwIC0gUG9zaXRpb24gb2YgdGhlIGZpcnN0IHZlcnRleFxuICAgKiBAcGFyYW0gcG9zMSAtIFBvc2l0aW9uIG9mIHRoZSBzZWNvbmQgdmVydGV4XG4gICAqIEBwYXJhbSBwb3MyIC0gUG9zaXRpb24gb2YgdGhlIHRoaXJkIHZlcnRleFxuICAgKiBAcGFyYW0gbm9ybWFsQWNjZXNzb3IgLSBBY2Nlc3NvciBmb3Igd3JpdGluZyBub3JtYWwgZGF0YVxuICAgKiBAcGFyYW0gaW5kaWNlc0FjY2Vzc29yIC0gT3B0aW9uYWwgaW5kaWNlcyBhY2Nlc3NvclxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2NhbGNGYWNlTm9ybWFsRm9yM1ZlcnRpY2VzKFxuICAgIGk6IEluZGV4LFxuICAgIHBvczA6IFZlY3RvcjMsXG4gICAgcG9zMTogVmVjdG9yMyxcbiAgICBwb3MyOiBWZWN0b3IzLFxuICAgIG5vcm1hbEFjY2Vzc29yOiBBY2Nlc3NvcixcbiAgICBpbmRpY2VzQWNjZXNzb3I/OiBBY2Nlc3NvclxuICApIHtcbiAgICAvLyBDYWxjIG5vcm1hbFxuICAgIGNvbnN0IGF4ID0gcG9zMS54IC0gcG9zMC54O1xuICAgIGNvbnN0IGF5ID0gcG9zMS55IC0gcG9zMC55O1xuICAgIGNvbnN0IGF6ID0gcG9zMS56IC0gcG9zMC56O1xuICAgIGNvbnN0IGJ4ID0gcG9zMi54IC0gcG9zMC54O1xuICAgIGNvbnN0IGJ5ID0gcG9zMi55IC0gcG9zMC55O1xuICAgIGNvbnN0IGJ6ID0gcG9zMi56IC0gcG9zMC56O1xuXG4gICAgbGV0IG54ID0gYXkgKiBieiAtIGF6ICogYnk7IC8vIGNyb3NzIHByb2R1Y3RcbiAgICBsZXQgbnkgPSBheiAqIGJ4IC0gYXggKiBiejtcbiAgICBsZXQgbnogPSBheCAqIGJ5IC0gYXkgKiBieDtcblxuICAgIGxldCBkYSA9IE1hdGguaHlwb3QobngsIG55LCBueik7IC8vIG5vcm1hbGl6ZVxuICAgIGlmIChkYSA8PSAxZS02KSB7XG4gICAgICBkYSA9IDAuMDAwMTtcbiAgICB9XG4gICAgZGEgPSAxLjAgLyBkYTtcbiAgICBueCAqPSBkYTtcbiAgICBueSAqPSBkYTtcbiAgICBueiAqPSBkYTtcblxuICAgIG5vcm1hbEFjY2Vzc29yLnNldFZlYzMoaSwgbngsIG55LCBueiwgeyBpbmRpY2VzQWNjZXNzb3IgfSk7XG4gICAgbm9ybWFsQWNjZXNzb3Iuc2V0VmVjMyhpICsgMSwgbngsIG55LCBueiwgeyBpbmRpY2VzQWNjZXNzb3IgfSk7XG4gICAgbm9ybWFsQWNjZXNzb3Iuc2V0VmVjMyhpICsgMiwgbngsIG55LCBueiwgeyBpbmRpY2VzQWNjZXNzb3IgfSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW5kZXggb2YgYSBwcmltaXRpdmUgd2l0aGluIHRoaXMgbWVzaC5cbiAgICogQHBhcmFtIHByaW1pdGl2ZSAtIFRoZSBwcmltaXRpdmUgdG8gZmluZCB0aGUgaW5kZXggb2ZcbiAgICogQHJldHVybnMgVGhlIGluZGV4IG9mIHRoZSBwcmltaXRpdmUgaW4gdGhlIG1lc2hcbiAgICovXG4gIGdldFByaW1pdGl2ZUluZGV4SW5NZXNoKHByaW1pdGl2ZTogUHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHRoaXMucHJpbWl0aXZlcy5pbmRleE9mKHByaW1pdGl2ZSk7XG4gIH1cblxuICAvKipcbiAgICogQXBwbHkgYSBtYXRlcmlhbCB2YXJpYW50IHRvIHRoZSBtZXNoXG4gICAqIEBwYXJhbSB2YXJpYW50TmFtZSBhIHZhcmlhbnQgbmFtZVxuICAgKi9cbiAgYXBwbHlNYXRlcmlhbFZhcmlhbnQodmFyaWFudE5hbWU6IHN0cmluZykge1xuICAgIGZvciAoY29uc3QgcHJpbWl0aXZlIG9mIHRoaXMucHJpbWl0aXZlcykge1xuICAgICAgcHJpbWl0aXZlLmFwcGx5TWF0ZXJpYWxWYXJpYW50KHZhcmlhbnROYW1lKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCBtYXRlcmlhbCB2YXJpYW50IG5hbWUgYXBwbGllZCB0byB0aGlzIG1lc2guXG4gICAqIFJldHVybnMgZW1wdHkgc3RyaW5nIGlmIG5vIHZhcmlhbnQgaXMgYXBwbGllZCBvciBpZiBwcmltaXRpdmVzIGhhdmUgZGlmZmVyZW50IHZhcmlhbnRzLlxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCB2YXJpYW50IG5hbWUgb3IgZW1wdHkgc3RyaW5nXG4gICAqL1xuICBnZXRDdXJyZW50VmFyaWFudE5hbWUoKSB7XG4gICAgZnVuY3Rpb24gYWxsRXF1YWwoYXJyOiBzdHJpbmdbXSkge1xuICAgICAgcmV0dXJuIGFyci5ldmVyeSh2YWwgPT4gdmFsID09PSBhcnJbMF0pO1xuICAgIH1cbiAgICBjb25zdCB2YXJpYW50TmFtZXMgPSB0aGlzLnByaW1pdGl2ZXMubWFwKHByaW1pdGl2ZSA9PiBwcmltaXRpdmUuZ2V0Q3VycmVudFZhcmlhbnROYW1lKCkpO1xuICAgIGlmICh2YXJpYW50TmFtZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIGlmIChhbGxFcXVhbCh2YXJpYW50TmFtZXMpKSB7XG4gICAgICByZXR1cm4gdmFyaWFudE5hbWVzWzBdO1xuICAgIH1cblxuICAgIHJldHVybiAnJztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFsbCBhdmFpbGFibGUgbWF0ZXJpYWwgdmFyaWFudCBuYW1lcyBmb3IgdGhpcyBtZXNoLlxuICAgKiBAcmV0dXJucyBBcnJheSBvZiB2YXJpYW50IG5hbWVzIGZyb20gYWxsIHByaW1pdGl2ZXNcbiAgICovXG4gIGdldFZhcmlhbnROYW1lcygpIHtcbiAgICBjb25zdCB2YXJpYW50czogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IHByaW1pdGl2ZSBvZiB0aGlzLnByaW1pdGl2ZXMpIHtcbiAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KHZhcmlhbnRzLCBwcmltaXRpdmUuZ2V0VmFyaWFudE5hbWVzKCkpO1xuICAgIH1cbiAgICByZXR1cm4gdmFyaWFudHM7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgbWVzaCBzZXR1cCBpcyBjb21wbGV0ZWQgYW5kIHJlYWR5IGZvciByZW5kZXJpbmcuXG4gICAqIEByZXR1cm5zIFRydWUgaWYgc2V0dXAgaXMgZG9uZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBpc1NldFVwRG9uZSgpIHtcbiAgICBsZXQgdmVydGV4SGFuZGxlc1JlYWR5ID0gdHJ1ZTtcbiAgICBmb3IgKGNvbnN0IHByaW1pdGl2ZSBvZiB0aGlzLnByaW1pdGl2ZXMpIHtcbiAgICAgIGlmIChwcmltaXRpdmUudmVydGV4SGFuZGxlcyA9PSBudWxsKSB7XG4gICAgICAgIHZlcnRleEhhbmRsZXNSZWFkeSA9IGZhbHNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCF2ZXJ0ZXhIYW5kbGVzUmVhZHkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fX2xhdGVzdFByaW1pdGl2ZVBvc2l0aW9uQWNjZXNzb3JWZXJzaW9uRm9yU2V0VXBEb25lICE9PSB0aGlzLl9fcHJpbWl0aXZlUG9zaXRpb25VcGRhdGVDb3VudCkge1xuICAgICAgdGhpcy5fX2xhdGVzdFByaW1pdGl2ZVBvc2l0aW9uQWNjZXNzb3JWZXJzaW9uRm9yU2V0VXBEb25lID0gdGhpcy5fX3ByaW1pdGl2ZVBvc2l0aW9uVXBkYXRlQ291bnQ7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyBWQk8gKFZlcnRleCBCdWZmZXIgT2JqZWN0KSBhbmQgVkFPIChWZXJ0ZXggQXJyYXkgT2JqZWN0KSBmb3IgYWxsIHByaW1pdGl2ZXMuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgLyoqXG4gICAqIE1hcmtzIHRoaXMgbWVzaCdzIG11bHRpLWRyYXcgZ3JvdXBzIChhbmQgdGhlIGxlZ2FjeSBzZXR1cCkgZm9yIGEgcmVidWlsZC5cbiAgICogQ2FsbGVkIHdoZW4gYSBwcmltaXRpdmUncyBhdHRyaWJ1dGVzIG9yIGluZGljZXMgY2hhbmdlLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9pbnZhbGlkYXRlTXVsdGlEcmF3U3RydWN0dXJlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9faXNJbnN0YW5jZVNpZFRleHR1cmVNb2RlKCkpIHtcbiAgICAgIHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuZ2V0TXVsdGlEcmF3UmVwb3NpdG9yeSh0aGlzLl9fZW5naW5lKS5tYXJrRGlydHlGb3JNZXNoKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIF91cGRhdGVWQk9BbmRWQU8oKSB7XG4gICAgaWYgKHRoaXMuX19pc0luc3RhbmNlU2lkVGV4dHVyZU1vZGUoKSkge1xuICAgICAgLy8gRGVmZXIgdGhlIEdQVSBzZXR1cCB0byB0aGUgTXVsdGlEcmF3UmVwb3NpdG9yeSwgd2hpY2ggcmVidWlsZHMgYWxsIGdyb3VwcyBvbmNlXG4gICAgICAvLyBhdCB0aGUgc3RhcnQgb2YgdGhlIG5leHQgZnJhbWUgKGNvYWxlc2NpbmcgdGhlIG1hbnkgbWVzaGVzIGFkZGVkIHdoaWxlIGxvYWRpbmcpLlxuICAgICAgdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5nZXRNdWx0aURyYXdSZXBvc2l0b3J5KHRoaXMuX19lbmdpbmUpLm1hcmtEaXJ0eUZvck1lc2godGhpcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHByaW1pdGl2ZU51bSA9IHRoaXMuZ2V0UHJpbWl0aXZlTnVtYmVyKCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmltaXRpdmVOdW07IGkrKykge1xuICAgICAgY29uc3QgcHJpbWl0aXZlID0gdGhpcy5nZXRQcmltaXRpdmVBdChpKTtcbiAgICAgIGlmIChJcy5leGlzdChwcmltaXRpdmUudmVydGV4SGFuZGxlcykpIHtcbiAgICAgICAgcHJpbWl0aXZlLnVwZGF0ZTNEQVBJVmVydGV4RGF0YSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJpbWl0aXZlLmNyZWF0ZTNEQVBJVmVydGV4RGF0YSgpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnVwZGF0ZVZhcmlhdGlvblZCTygpO1xuXG4gICAgaWYgKHRoaXMuX19lbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCAhPT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgdGhpcy51cGRhdGVWQU8oKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlcyBhbGwgM0QgQVBJIHZlcnRleCBkYXRhIGZvciB0aGlzIG1lc2guXG4gICAqL1xuICBkZWxldGUzREFQSVZlcnRleERhdGEoKSB7XG4gICAgZm9yIChjb25zdCBwcmltaXRpdmUgb2YgdGhpcy5fX3ByaW1pdGl2ZXMpIHtcbiAgICAgIHByaW1pdGl2ZS5kZWxldGUzREFQSVZlcnRleERhdGEoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX19pbnN0YW5jZVNpZEJhc2UgPj0gMCAmJiB0aGlzLl9fYmVsb25nVG9FbnRpdGllcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuaW5zdGFuY2VTaWRUYWJsZS5mcmVlKHRoaXMuX19pbnN0YW5jZVNpZEJhc2UsIHRoaXMuX19pbnN0YW5jZVNpZENvdW50KTtcbiAgICAgIHRoaXMuX19pbnN0YW5jZVNpZEJhc2UgPSAtMTtcbiAgICAgIHRoaXMuX19pbnN0YW5jZVNpZENvdW50ID0gMDtcbiAgICB9XG4gIH1cblxuICAvLyBtYWtlVmVydGljZXNTZXBhcmF0ZWQoKSB7XG4gIC8vICAgZm9yIChsZXQgcHJpbWl0aXZlIG9mIHRoaXMuX19wcmltaXRpdmVzKSB7XG4gIC8vICAgICBpZiAocHJpbWl0aXZlLmhhc0luZGljZXMoKSkge1xuICAvLyAgICAgICBjb25zdCBidWZmZXIgPSBNZW1vcnlNYW5hZ2VyLmdldEluc3RhbmNlKCkuY3JlYXRlT3JHZXRCdWZmZXIoQnVmZmVyVXNlLkNQVUdlbmVyaWMpO1xuICAvLyAgICAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IHByaW1pdGl2ZS5nZXRWZXJ0ZXhDb3VudEFzSW5kaWNlc0Jhc2VkKCk7XG5cbiAgLy8gICAgICAgY29uc3QgaW5kZXhBY2Nlc3NvciA9IHByaW1pdGl2ZS5pbmRpY2VzQWNjZXNzb3I7XG4gIC8vICAgICAgIGZvciAobGV0IGkgaW4gcHJpbWl0aXZlLmF0dHJpYnV0ZUFjY2Vzc29ycykge1xuICAvLyAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZUFjY2Vzc29yID0gcHJpbWl0aXZlLmF0dHJpYnV0ZUFjY2Vzc29yc1tpXTtcbiAgLy8gICAgICAgICBjb25zdCBlbGVtZW50U2l6ZUluQnl0ZXMgPSBhdHRyaWJ1dGVBY2Nlc3Nvci5lbGVtZW50U2l6ZUluQnl0ZXM7XG4gIC8vICAgICAgICAgY29uc3QgYnVmZmVyVmlldyA9IGJ1ZmZlci50YWtlQnVmZmVyVmlldyh7IGJ5dGVMZW5ndGhUb05lZWQ6IGVsZW1lbnRTaXplSW5CeXRlcyAqIHZlcnRleENvdW50LCBieXRlU3RyaWRlOiAwLCBpc0FvUzogZmFsc2UgfSk7XG4gIC8vICAgICAgICAgY29uc3QgbmV3QWNjZXNzb3IgPSBidWZmZXJWaWV3LnRha2VBY2Nlc3Nvcih7IGNvbXBvc2l0aW9uVHlwZTogYXR0cmlidXRlQWNjZXNzb3IuY29tcG9zaXRpb25UeXBlLCBjb21wb25lbnRUeXBlOiBhdHRyaWJ1dGVBY2Nlc3Nvci5jb21wb25lbnRUeXBlLCBjb3VudDogdmVydGV4Q291bnQgfSk7XG5cbiAgLy8gICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZlcnRleENvdW50OyBqKyspIHtcbiAgLy8gICAgICAgICAgIGNvbnN0IGlkeCA9IGluZGV4QWNjZXNzb3IhLmdldFNjYWxhcihqLCB7fSk7XG4gIC8vICAgICAgICAgICBuZXdBY2Nlc3Nvci5zZXRFbGVtZW50RnJvbVNhbWVDb21wb3NpdGlvbkFjY2Vzc29yKGosIGF0dHJpYnV0ZUFjY2Vzc29yLCBpZHgpO1xuICAvLyAgICAgICAgIH1cblxuICAvLyAgICAgICAgIHByaW1pdGl2ZS5zZXRWZXJ0ZXhBdHRyaWJ1dGUobmV3QWNjZXNzb3IsIHByaW1pdGl2ZS5hdHRyaWJ1dGVTZW1hbnRpY3NbaV0pO1xuICAvLyAgICAgICB9XG5cbiAgLy8gICAgICAgY29uc3QgaW5kaWNlc0FjY2Vzc29yID0gcHJpbWl0aXZlLmluZGljZXNBY2Nlc3NvciE7XG4gIC8vICAgICAgIGNvbnN0IGVsZW1lbnRTaXplSW5CeXRlcyA9IGluZGljZXNBY2Nlc3Nvci5lbGVtZW50U2l6ZUluQnl0ZXM7XG4gIC8vICAgICAgIGNvbnN0IGJ1ZmZlclZpZXcgPSBidWZmZXIudGFrZUJ1ZmZlclZpZXcoeyBieXRlTGVuZ3RoVG9OZWVkOiBlbGVtZW50U2l6ZUluQnl0ZXMgKiB2ZXJ0ZXhDb3VudCwgYnl0ZVN0cmlkZTogMCwgaXNBb1M6IGZhbHNlIH0pO1xuICAvLyAgICAgICBjb25zdCBuZXdBY2Nlc3NvciA9IGJ1ZmZlclZpZXcudGFrZUFjY2Vzc29yKHsgY29tcG9zaXRpb25UeXBlOiBpbmRpY2VzQWNjZXNzb3IuY29tcG9zaXRpb25UeXBlLCBjb21wb25lbnRUeXBlOiBpbmRpY2VzQWNjZXNzb3IuY29tcG9uZW50VHlwZSwgY291bnQ6IHZlcnRleENvdW50IH0pO1xuXG4gIC8vICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdmVydGV4Q291bnQ7IGorKykge1xuICAvLyAgICAgICAgIC8vY29uc3QgaWR4ID0gaW5kZXhBY2Nlc3NvciEuZ2V0U2NhbGFyKGosIHt9KTtcbiAgLy8gICAgICAgICBuZXdBY2Nlc3Nvci5zZXRTY2FsYXIoaiwgaiwge30pO1xuICAvLyAgICAgICB9XG5cbiAgLy8gICAgICAgcHJpbWl0aXZlLnNldEluZGljZXMobmV3QWNjZXNzb3IpO1xuICAvLyAgICAgfVxuICAvLyAgIH1cbiAgLy8gfVxuXG4gIC8vIF9faW5pdE1vcnBoUHJpbWl0aXZlcygpIHtcbiAgLy8gICBpZiAodGhpcy53ZWlnaHRzLmxlbmd0aCA9PT0gMCkge1xuICAvLyAgICAgcmV0dXJuO1xuICAvLyAgIH1cblxuICAvLyAgIGNvbnN0IGJ1ZmZlciA9IE1lbW9yeU1hbmFnZXIuZ2V0SW5zdGFuY2UoKS5jcmVhdGVPckdldEJ1ZmZlcihCdWZmZXJVc2UuQ1BVR2VuZXJpYyk7XG4gIC8vICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9fcHJpbWl0aXZlcy5sZW5ndGg7IGkrKykge1xuICAvLyAgICAgY29uc3QgcHJpbWl0aXZlID0gdGhpcy5fX3ByaW1pdGl2ZXNbaV07XG4gIC8vICAgICBpZiAodGhpcy5fX21vcnBoUHJpbWl0aXZlc1tpXSA9PSBudWxsKSB7XG4gIC8vICAgICAgIGNvbnN0IHRhcmdldCA9IHByaW1pdGl2ZS50YXJnZXRzWzBdO1xuICAvLyAgICAgICBjb25zdCBtYXAgPSBuZXcgTWFwKCk7XG4gIC8vICAgICAgIHRhcmdldC5mb3JFYWNoKChhY2Nlc3Nvciwgc2VtYW50aWMpID0+IHtcbiAgLy8gICAgICAgICBjb25zdCBidWZmZXJWaWV3ID0gYnVmZmVyLnRha2VCdWZmZXJWaWV3KHsgYnl0ZUxlbmd0aFRvTmVlZDogYWNjZXNzb3IuYnl0ZUxlbmd0aCwgYnl0ZVN0cmlkZTogMCwgaXNBb1M6IGZhbHNlIH0pO1xuICAvLyAgICAgICAgIGNvbnN0IG1vcnBoQWNjZXNzb3IgPSBidWZmZXJWaWV3LnRha2VBY2Nlc3Nvcih7IGNvbXBvc2l0aW9uVHlwZTogYWNjZXNzb3IuY29tcG9zaXRpb25UeXBlLCBjb21wb25lbnRUeXBlOiBhY2Nlc3Nvci5jb21wb25lbnRUeXBlLCBjb3VudDogYWNjZXNzb3IuZWxlbWVudENvdW50IH0pO1xuICAvLyAgICAgICAgIG1hcC5zZXQoc2VtYW50aWMsIG1vcnBoQWNjZXNzb3IpO1xuICAvLyAgICAgICB9KTtcbiAgLy8gICAgICAgY29uc3QgbW9ycGhQcmltaXRpdmUgPSBuZXcgUHJpbWl0aXZlKCk7XG4gIC8vICAgICAgIG1vcnBoUHJpbWl0aXZlLnNldERhdGEobWFwLCBwcmltaXRpdmUucHJpbWl0aXZlTW9kZSwgcHJpbWl0aXZlLm1hdGVyaWFsLCBwcmltaXRpdmUuaW5kaWNlc0FjY2Vzc29yKTtcbiAgLy8gICAgICAgbW9ycGhQcmltaXRpdmUuc2V0VGFyZ2V0cyhwcmltaXRpdmUudGFyZ2V0cyk7XG4gIC8vICAgICAgIHRoaXMuX19tb3JwaFByaW1pdGl2ZXNbaV0gPSBtb3JwaFByaW1pdGl2ZTtcbiAgLy8gICAgIH1cbiAgLy8gICB9XG4gIC8vIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFHQSxTQUFTLGlCQUFpQjtBQUMxQixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLG9CQUFvQjtBQUM3QixTQUFTLHVCQUF1QjtBQUVoQyxTQUFTLFlBQVk7QUFFckIsU0FBUyxzQkFBc0I7QUFFL0IsU0FBUyxlQUFlO0FBRXhCLFNBQVMsVUFBVTtBQUNuQixTQUFTLGNBQWM7QUFDdkIsU0FBUywrQkFBK0I7QUFHeEM7QUFBQSxFQUVFO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FB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ZXMiOiBbIl9fcHJpbWl0aXZlcyIsICJfX29wYXF1ZVByaW1pdGl2ZXMiLCAiX190cmFuc2x1Y2VudFByaW1pdGl2ZXMiLCAiX19ibGVuZFdpdGhaV3JpdGVQcmltaXRpdmVzIiwgIl9fYmxlbmRXaXRob3V0WldyaXRlUHJpbWl0aXZlcyIsICJfX21vcnBoUHJpbWl0aXZlcyIsICJfX2xvY2FsQUFCQiIsICJfX3Zhb1VpZHMiLCAiX19tdWx0aURyYXdWYW9JbmRpY2VzIiwgIl9fdmFyaWF0aW9uVkJPVWlkIiwgIl9faGFzSW5zdGFuY2VzIiwgIl9faGFzU2tlbGV0YWxJbnN0YW5jZSIsICJfX2hhc0JsZW5kU2hhcGVJbnN0YW5jZSIsICJfX2lzQ29tcHV0ZURlZm9ybWFibGUiLCAiX19jb21wdXRlRGVmb3JtYWJsZVByaW1pdGl2ZUNvdW50IiwgIl9fY29tcHV0ZURlZm9ybWFibGVQb3NpdGlvblVwZGF0ZUNvdW50IiwgIl9fY29tcHV0ZURlZm9ybWFibGVIYXNTa2VsZXRhbCIsICJfX3ZhcmlhdGlvblZCT0luc3RhbmNlQ291bnQiLCAiX192YXJpYXRpb25WQk9DdWxsVGljayIsICJfX2luc3RhbmNlU2lkQmFzZSIsICJfX2luc3RhbmNlU2lkQ291bnQiLCAiX19yZW1hcFByZXBhc3NJZCIsICJfX2xhdGVzdFByaW1pdGl2ZVBvc2l0aW9uQWNjZXNzb3JWZXJzaW9uRm9yQUFCQiIsICJfX2xhdGVzdFByaW1pdGl2ZVBvc2l0aW9uQWNjZXNzb3JWZXJzaW9uRm9yU2V0VXBEb25lIiwgIl9fYmVsb25nVG9FbnRpdGllcyIsICJfX2hhc0ZhY2VOb3JtYWwiLCAiX19wcmltaXRpdmVQb3NpdGlvblVwZGF0ZUNvdW50IiwgIl9fZW5naW5lIiwgIl9fbWVzaFVJRCIsICJfX21lc2hfdWlkX2NvdW50IiwgIl9fcHJpbWl0aXZlUG9zaXRpb25VcGRhdGVWZXJzaW9uIiwgIl9faXNJbnN0YW5jZVNpZFRleHR1cmVNb2RlIiwgIl9fc2V0UHJpbWl0aXZlcyIsICJfX3ZhcmlhdGlvbkVudGl0eUluZm8iLCAiX192YXJpYXRpb25FbnRpdHlVSURzIiwgIl9fdmFyaWF0aW9uVkJPQ29udGVudCIsICJfX3BhY2tlZFZhcmlhdGlvbkVudGl0eUluZm8iLCAiX192YXJpYXRpb25WQk9DdWxsZWRFbnRpdHlTdGFtcCIsICJfX2NoZWNrQ29tcHV0ZURlZm9ybWFibGUiLCAiX19jYWxjTW9ycGhQcmltaXRpdmVzIiwgIl9fdXNlUHJlQ2FsY3VsYXRlZFRhbmdlbnQiLCAiX19jYWxjVGFuZ2VudEZvcjNWZXJ0aWNlcyIsICJfX2NhbGNUYW5nZW50UGVyVmVydGV4IiwgIl9fdG1wUmV0dXJuVmVjM18wIiwgIl9fdG1wUmV0dXJuVmVjM18xIiwgIl9fdG1wUmV0dXJuVmVjM18yIiwgIl9fdG1wVmVjM18wIiwgIl9fdG1wVmVjM18xIiwgIl9fdG1wVmVjM18yIiwgIl9fdG1wVmVjM18zIiwgIl9fdG1wVmVjM180IiwgIl9fdG1wVmVjM181IiwgIl9fdG1wVmVjM182IiwgIl9fdG1wVmVjM183IiwgIl9fdG1wVmVjM184IiwgIl9fdG1wVmVjM185IiwgIl9fdG1wVmVjM18xMCIsICJfX3RtcFZlYzNfMTEiLCAiYmFyeUNlbnRyaWNDb29yZEFjY2Vzc29yIiwgIl9fY2FsY0ZhY2VOb3JtYWxGb3IzVmVydGljZXMiXQp9Cg==
