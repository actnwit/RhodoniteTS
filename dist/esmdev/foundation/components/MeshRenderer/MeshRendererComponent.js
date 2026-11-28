// src/foundation/components/MeshRenderer/MeshRendererComponent.ts
import { getMultiDrawStateKeyId, getPrimitiveMeshRendererFingerPrintId } from "../../../webgl/MultiDraw.js";
import { Component } from "../../core/Component.js";
import { applyMixins } from "../../core/EntityRepository.js";
import { ProcessApproach } from "../../definitions/ProcessApproach.js";
import { ProcessStage } from "../../definitions/ProcessStage.js";
import { isBlend, isBlendWithoutZWrite, isBlendWithZWrite, isTranslucent } from "../../geometry/types/GeometryTypes.js";
import { ModuleManager } from "../../system/ModuleManager.js";
import { CameraComponent } from "../Camera/CameraComponent.js";
import { _getCameraControllerUpdateCount } from "../CameraController/CameraControllerUpdateCount.js";
import { SceneGraphComponent } from "../SceneGraph/SceneGraphComponent.js";
import { TransformComponent } from "../Transform/TransformComponent.js";
import { WellKnownComponentTIDs } from "../WellKnownComponentTIDs.js";
var _MeshRendererComponent = class _MeshRendererComponent extends Component {
  /**
   * Creates a new MeshRendererComponent instance.
   * @param engine - The engine instance
   * @param entityUid - The unique identifier of the entity this component belongs to
   * @param componentSid - The component's system identifier
   * @param entityRepository - The repository managing entities
   * @param isReUse - Whether this component is being reused from a pool
   */
  constructor(engine, entityUid, componentSid, entityRepository, isReUse) {
    super(engine, entityUid, componentSid, entityRepository, isReUse);
    this.ee = 1;
    this.fe = 1;
    this.ge = 0;
    this.ia = 0;
    this.$d = "";
    this.he = 0;
    this.calcFingerPrint();
  }
  /**
   * Gets the component type ID for MeshRendererComponent.
   * @returns The component type ID
   */
  static get componentTID() {
    return WellKnownComponentTIDs.MeshRendererComponentTID;
  }
  /**
   * Gets the component type ID for this instance.
   * @returns The component type ID
   */
  get componentTID() {
    return WellKnownComponentTIDs.MeshRendererComponentTID;
  }
  /**
   * Gets the diffuse cube map used for IBL lighting.
   * @returns The diffuse cube map texture or undefined if not set
   */
  get diffuseCubeMap() {
    return this.Xd;
  }
  /**
   * Gets the specular cube map used for IBL lighting.
   * @returns The specular cube map texture or undefined if not set
   */
  get specularCubeMap() {
    return this.Yd;
  }
  /**
   * Gets the sheen cube map used for IBL lighting.
   * @returns The sheen cube map texture or undefined if not set
   */
  get sheenCubeMap() {
    return this.Zd;
  }
  /**
   * Gets the update count for this component instance.
   * @returns The current update count
   */
  get updateCount() {
    return this.ia;
  }
  /**
   * Gets the global update count for all MeshRendererComponent instances.
   * @returns The global update count
   */
  static get updateCount() {
    return _MeshRendererComponent.ia;
  }
  /**
   * Gets the contribution factor for the diffuse cube map in IBL calculations.
   * @returns The diffuse cube map contribution factor (0.0 to 1.0)
   */
  get diffuseCubeMapContribution() {
    return this.ee;
  }
  /**
   * Sets the contribution factor for the diffuse cube map in IBL calculations.
   * @param contribution - The contribution factor (0.0 to 1.0)
   */
  set diffuseCubeMapContribution(contribution) {
    this.ee = contribution;
    this.ia++;
    _MeshRendererComponent.ia++;
  }
  /**
   * Gets the contribution factor for the specular cube map in IBL calculations.
   * @returns The specular cube map contribution factor (0.0 to 1.0)
   */
  get specularCubeMapContribution() {
    return this.fe;
  }
  /**
   * Sets the contribution factor for the specular cube map in IBL calculations.
   * @param contribution - The contribution factor (0.0 to 1.0)
   */
  set specularCubeMapContribution(contribution) {
    this.fe = contribution;
    this.ia++;
    _MeshRendererComponent.ia++;
  }
  /**
   * Gets the rotation angle of the cube map in radians.
   * @returns The rotation angle in radians
   */
  get rotationOfCubeMap() {
    return this.ge;
  }
  /**
   * Sets the rotation angle of the cube map in radians.
   * @param rotation - The rotation angle in radians
   */
  set rotationOfCubeMap(rotation) {
    this.ge = rotation;
    this.ia++;
    _MeshRendererComponent.ia++;
  }
  /**
   * Calculates and updates the fingerprint for this component based on current cube map settings.
   * The fingerprint is used for caching and optimization purposes.
   */
  calcFingerPrint() {
    this.$d = `${this.Xd != null ? this.Xd.textureUID : -1} ${this.Yd != null ? this.Yd.textureUID : -1} ${this.Zd != null ? this.Zd.textureUID : -1}`;
    this.he = _MeshRendererComponent.oe(this.$d);
  }
  static oe(fingerPrint) {
    let id = _MeshRendererComponent.ie.get(fingerPrint);
    if (id == null) {
      id = ++_MeshRendererComponent.ne;
      _MeshRendererComponent.ie.set(fingerPrint, id);
    }
    return id;
  }
  /**
   * Gets the current fingerprint of this component.
   * @returns The fingerprint string
   */
  getFingerPrint() {
    return this.$d;
  }
  /**
   * Gets the interned numeric id of the fingerprint. Numeric ids keep the per-frame
   * multi-draw state keys cheap to compare.
   * @returns The fingerprint id
   */
  getFingerPrintId() {
    return this.he;
  }
  /**
   * Sets the IBL (Image-Based Lighting) cube maps for this mesh renderer.
   * @param diffuseCubeTexture - The diffuse cube map texture for IBL
   * @param specularCubeTexture - The specular cube map texture for IBL
   * @param sheenCubeTexture - Optional sheen cube map texture for IBL
   */
  setIBLCubeMap(diffuseCubeTexture, specularCubeTexture, sheenCubeTexture) {
    if (diffuseCubeTexture == null || specularCubeTexture == null) {
      return;
    }
    this.Xd = diffuseCubeTexture;
    this.Yd = specularCubeTexture;
    this.Zd = sheenCubeTexture;
    this.calcFingerPrint();
    this.ia++;
    _MeshRendererComponent.ia++;
  }
  /**
   * Common loading method that initializes the rendering strategy based on the process approach.
   * This method sets up either WebGPU or WebGL rendering strategies.
   * @param processApproach - The graphics API approach to use (WebGPU or WebGL)
   */
  static common_$load({ processApproach, engine }) {
    const moduleManager = ModuleManager.getInstance();
    const engineUid = engine.objectUID;
    if (processApproach === ProcessApproach.WebGPU) {
      const moduleName = "webgpu";
      const webgpuModule = moduleManager.getModule(moduleName);
      if (!_MeshRendererComponent.Wd.has(engineUid)) {
        _MeshRendererComponent.Wd.set(engineUid, webgpuModule.WebGpuStrategyBasic.init(engine));
      }
      _MeshRendererComponent.Wd.get(engineUid).common_$load();
    } else {
      const moduleName = "webgl";
      const webglModule = moduleManager.getModule(moduleName);
      if (!_MeshRendererComponent.Wd.has(engineUid)) {
        _MeshRendererComponent.Wd.set(
          engineUid,
          webglModule.getRenderingStrategy(engine, processApproach)
        );
      }
      _MeshRendererComponent.Wd.get(engineUid).common_$load();
    }
  }
  /**
   * Loads and initializes this mesh renderer component.
   * Sets up the component for rendering by loading the associated mesh.
   */
  $load() {
    const strategy = _MeshRendererComponent.Wd.get(this.c.objectUID);
    const ready = strategy.$load(this.entity.tryToGetMesh());
    if (ready) {
      this.moveStageTo(ProcessStage.Unknown);
    }
  }
  /**
   * Sorts and filters mesh components for rendering based on camera frustum and material properties.
   * Performs frustum culling and sorts primitives by render order and depth.
   * @param engine - The engine instance
   * @param renderPass - The render pass containing mesh components and rendering context
   * @returns Array of primitive UIDs sorted for optimal rendering
   */
  static sort_$render(engine, renderPass) {
    var _a;
    const webglResourceRepository = engine.webglResourceRepository;
    const multiDrawGroupVersion = webglResourceRepository != null ? webglResourceRepository.getMultiDrawRepository(engine).version : 0;
    const scratch = _MeshRendererComponent.pe(renderPass);
    const isGpuCullingActive = _MeshRendererComponent._isGpuCullingActive(engine, renderPass);
    if (TransformComponent.getUpdateCount(engine) === renderPass._lastTransformComponentsUpdateCount && _getCameraControllerUpdateCount(engine) === renderPass._lastCameraControllerComponentsUpdateCount && SceneGraphComponent.getUpdateCount(engine) === renderPass._lastSceneGraphComponentsUpdateCount && multiDrawGroupVersion === renderPass._lastMultiDrawGroupVersion && isGpuCullingActive === scratch.isGpuCullingActive && engine.config.isComputeSkinningEnabled === scratch.isComputeSkinningEnabled) {
      return renderPass._lastPrimitiveUids;
    }
    scratch.isGpuCullingActive = isGpuCullingActive;
    scratch.isComputeSkinningEnabled = engine.config.isComputeSkinningEnabled;
    let cameraComponent = renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = engine.componentRepository.getComponent(
        CameraComponent,
        CameraComponent.getCurrent(engine)
      );
    }
    if (cameraComponent == null) {
      const cameraComponents = engine.componentRepository.getComponentsWithType(CameraComponent);
      cameraComponent = cameraComponents.find((c) => c == null ? void 0 : c._isAlive);
      CameraComponent.setCurrent(engine, cameraComponent.componentSID);
    }
    if (renderPass.isVrRendering) {
      const webxrSystem = engine._webXRSystemIfEnabled;
      if (webxrSystem == null ? void 0 : webxrSystem.isWebXRMode) {
        cameraComponent = webxrSystem._getCameraComponentAt(0);
      }
    }
    const primitives = _MeshRendererComponent.qe(
      cameraComponent,
      renderPass._optimizedMeshComponents,
      scratch.primitives,
      scratch,
      isGpuCullingActive
    );
    _MeshRendererComponent.re(primitives, scratch);
    if (primitives.length > 1) {
      primitives.sort(_MeshRendererComponent.se);
    }
    let _lastOpaqueIndex = primitives.length - 1;
    let _lastTranslucentIndex = primitives.length - 1;
    let _lastBlendWithZWriteIndex = primitives.length - 1;
    let _lastBlendWithoutZWriteIndex = primitives.length - 1;
    for (let i = 0; i < primitives.length; i++) {
      const primitive = primitives[i];
      const translucency = isTranslucent(primitive);
      if (translucency) {
        _lastOpaqueIndex = i - 1;
        break;
      }
      const blendWithZWrite = isBlendWithZWrite(primitive);
      if (blendWithZWrite) {
        _lastOpaqueIndex = i - 1;
        break;
      }
      const blendWithoutZWrite = isBlendWithoutZWrite(primitive);
      if (blendWithoutZWrite) {
        _lastOpaqueIndex = i - 1;
        break;
      }
    }
    for (let i = _lastOpaqueIndex + 1; i < primitives.length; i++) {
      const primitive = primitives[i];
      const blendWithZWrite = isBlendWithZWrite(primitive);
      if (blendWithZWrite) {
        _lastTranslucentIndex = i - 1;
        break;
      }
      const blendWithoutZWrite = isBlendWithoutZWrite(primitive);
      if (blendWithoutZWrite) {
        _lastTranslucentIndex = i - 1;
        break;
      }
    }
    for (let i = _lastTranslucentIndex + 1; i < primitives.length; i++) {
      const primitive = primitives[i];
      const blendWithoutZWrite = isBlendWithoutZWrite(primitive);
      if (blendWithoutZWrite) {
        _lastBlendWithZWriteIndex = i - 1;
        break;
      }
    }
    if (_lastOpaqueIndex > 0 && engine.config.isMultiDrawEnabled && ProcessApproach.isWebGL2Approach(engine.engineState.currentProcessApproach)) {
      const opaqueCount = _lastOpaqueIndex + 1;
      const keyed = scratch.keyedPrimitives;
      if (keyed.length < opaqueCount) {
        for (let i = keyed.length; i < opaqueCount; i++) {
          keyed.push({ primitive: null, keyId: 0, index: 0 });
        }
      } else {
        keyed.length = opaqueCount;
      }
      for (let i = 0; i < opaqueCount; i++) {
        const primitive = primitives[i];
        const material = renderPass.getAppropriateMaterial(primitive);
        const entry = keyed[i];
        entry.primitive = primitive;
        entry.index = i;
        entry.keyId = (_a = getMultiDrawStateKeyId(primitive, material, getPrimitiveMeshRendererFingerPrintId(primitive))) != null ? _a : -(material.materialUID + 1);
      }
      keyed.sort((a, b) => a.keyId - b.keyId || a.index - b.index);
      for (let i = 0; i < opaqueCount; i++) {
        primitives[i] = keyed[i].primitive;
      }
    }
    const primitiveUids = _MeshRendererComponent.te(primitives);
    let resultChanged = false;
    if (_lastOpaqueIndex !== renderPass._lastOpaqueIndex) {
      renderPass._lastOpaqueIndex = _lastOpaqueIndex;
      resultChanged || (resultChanged = true);
    }
    if (_lastTranslucentIndex !== renderPass._lastTranslucentIndex) {
      renderPass._lastTranslucentIndex = _lastTranslucentIndex;
      resultChanged || (resultChanged = true);
    }
    if (_lastBlendWithZWriteIndex !== renderPass._lastBlendWithZWriteIndex) {
      renderPass._lastBlendWithZWriteIndex = _lastBlendWithZWriteIndex;
      resultChanged || (resultChanged = true);
    }
    if (_lastBlendWithoutZWriteIndex !== renderPass._lastBlendWithoutZWriteIndex) {
      renderPass._lastBlendWithoutZWriteIndex = _lastBlendWithoutZWriteIndex;
      resultChanged || (resultChanged = true);
    }
    if (primitiveUids.length !== renderPass._lastPrimitiveUids.length) {
      resultChanged || (resultChanged = true);
    } else {
      const lastPrimitiveUids = renderPass._lastPrimitiveUids;
      for (let i = 0; i < primitiveUids.length; i++) {
        if (primitiveUids[i] !== lastPrimitiveUids[i]) {
          resultChanged || (resultChanged = true);
          break;
        }
      }
    }
    renderPass._isChangedSortRenderResult = resultChanged;
    renderPass._lastPrimitiveUids = primitiveUids;
    renderPass._lastPrimitives = primitives;
    renderPass._lastTransformComponentsUpdateCount = TransformComponent.getUpdateCount(engine);
    renderPass._lastCameraControllerComponentsUpdateCount = _getCameraControllerUpdateCount(engine);
    renderPass._lastSceneGraphComponentsUpdateCount = SceneGraphComponent.getUpdateCount(engine);
    renderPass._lastMultiDrawGroupVersion = multiDrawGroupVersion;
    if (resultChanged) {
      renderPass._renderedSomethingBefore = true;
    }
    return primitiveUids;
  }
  /**
   * Performs frustum culling on mesh components using the camera's view frustum.
   * Filters out mesh components that are not visible from the camera's perspective.
   * @param cameraComponent - The camera component used for frustum culling
   * @param meshComponents - Array of mesh components to be culled
   * @param outPrimitives - Reusable output array. It is cleared and filled with the primitives that passed culling
   * @param scratch - The scratch of the render pass. The entities culled in this pass are stamped into it
   *                  so that instanced draw calls can skip their instances
   * @param isGpuCullingActive - Whether the render pass culls on the GPU (see `_isGpuCullingActive`). The primitives
   *                  of the meshes culled on the GPU are kept regardless of their visibility, so that the render
   *                  list (and the WebGPU render bundles) does not change when the camera moves
   * @returns The `outPrimitives` array (same reference) for convenience
   */
  static qe(cameraComponent, meshComponents, outPrimitives, scratch, isGpuCullingActive) {
    var _a;
    outPrimitives.length = 0;
    let cullTick = scratch.cullTick + 1;
    if (cullTick === 4294967295) {
      scratch.culledEntityStamp.fill(0);
      scratch.handledEntityStamp.fill(0);
      scratch.meshCullTick = /* @__PURE__ */ new WeakMap();
      scratch.meshAppendTick = /* @__PURE__ */ new WeakMap();
      cullTick = 1;
    }
    scratch.cullTick = cullTick;
    scratch.culledEntityCount = 0;
    const culledInstancedMeshComponents = scratch.culledInstancedMeshComponents;
    culledInstancedMeshComponents.length = 0;
    scratch.cullingId = ++_MeshRendererComponent.me;
    const isFrustumCullingEnabled = cameraComponent != null && _MeshRendererComponent._isFrustumCullingEnabled;
    let frustum;
    if (isFrustumCullingEnabled) {
      cameraComponent.updateFrustum();
      frustum = cameraComponent.frustum;
    }
    for (let i = 0; i < meshComponents.length; i++) {
      const meshComponent = meshComponents[i];
      if (!meshComponent._isAlive) {
        continue;
      }
      const entity = meshComponent.entity;
      if (entity == null) {
        continue;
      }
      const sceneGraph = entity.getSceneGraph();
      scratch.handledEntityStamp = _MeshRendererComponent.je(
        scratch.handledEntityStamp,
        meshComponent.entityUID,
        cullTick
      );
      if (isGpuCullingActive && ((_a = meshComponent.mesh) == null ? void 0 : _a._isGpuCullable) === true) {
        sceneGraph._isCulled = false;
        const skeletal = meshComponent.entity.tryToGetSkeletal();
        if (skeletal !== void 0) {
          let visible = sceneGraph.isVisible;
          if (visible && frustum != null && meshComponent.entity.getTagValue("type") !== "background-assets") {
            visible = frustum.culling(meshComponent);
          }
          skeletal._isCulled = !visible;
        }
        _MeshRendererComponent.ce(meshComponent, cameraComponent, outPrimitives);
        _MeshRendererComponent.ke(meshComponent, scratch, cullTick);
        continue;
      }
      if (!sceneGraph.isVisible) {
        _MeshRendererComponent.de(scratch, meshComponent.entityUID, cullTick);
        _MeshRendererComponent.le(meshComponent, scratch);
        continue;
      }
      if (frustum != null) {
        const isBackgroundAsset = meshComponent.entity.getTagValue("type") === "background-assets";
        const visible = isBackgroundAsset ? true : frustum.culling(meshComponent);
        sceneGraph._isCulled = !visible;
        const skeletal = meshComponent.entity.tryToGetSkeletal();
        if (skeletal !== void 0) {
          skeletal._isCulled = !visible;
        }
        if (!visible) {
          _MeshRendererComponent.de(scratch, meshComponent.entityUID, cullTick);
          _MeshRendererComponent.le(meshComponent, scratch);
          continue;
        }
      }
      _MeshRendererComponent.ce(meshComponent, cameraComponent, outPrimitives);
      _MeshRendererComponent.ke(meshComponent, scratch, cullTick);
    }
    _MeshRendererComponent.ue(meshComponents, frustum, scratch, cullTick, isGpuCullingActive);
    _MeshRendererComponent.ve(cameraComponent, outPrimitives, scratch, cullTick);
    return outPrimitives;
  }
  /**
   * Culls the instances that share a mesh with the mesh components of the render pass but are not
   * registered in the render pass themselves.
   *
   * Instanced draw calls render every entity sharing a mesh. For example, the VRM outline pass only holds
   * the original model, while its shallow copies are drawn through instancing. Such sibling instances are
   * culled with the camera of this render pass as well, once per mesh. Their visibility flags are left
   * untouched because they belong to the render passes the entities are registered in.
   *
   * The meshes culled on the GPU (`isGpuCullingActive` and `Mesh._isGpuCullable`) are skipped: their instances,
   * siblings included, are culled per instance by the culling compute pass, so testing them here would only cost
   * CPU time.
   */
  static ue(meshComponents, frustum, scratch, cullTick, isGpuCullingActive) {
    for (let i = 0; i < meshComponents.length; i++) {
      const meshComponent = meshComponents[i];
      if (!meshComponent._isAlive) {
        continue;
      }
      const mesh = meshComponent.mesh;
      if (mesh === void 0) {
        continue;
      }
      if (isGpuCullingActive && mesh._isGpuCullable) {
        continue;
      }
      const siblings = mesh.meshEntitiesInner;
      if (siblings.length <= 1 || scratch.meshCullTick.get(mesh) === cullTick) {
        continue;
      }
      scratch.meshCullTick.set(mesh, cullTick);
      for (let j = 0; j < siblings.length; j++) {
        const sibling = siblings[j];
        const entityUID = sibling.entityUID;
        if (entityUID < scratch.handledEntityStamp.length && scratch.handledEntityStamp[entityUID] === cullTick) {
          continue;
        }
        let visible = sibling.getSceneGraph().isVisible;
        if (visible && frustum != null && sibling.getTagValue("type") !== "background-assets") {
          visible = frustum.culling(sibling.getMesh());
        }
        if (!visible) {
          _MeshRendererComponent.de(scratch, entityUID, cullTick);
        }
      }
    }
  }
  /**
   * Remembers a culled mesh component whose mesh is shared by other instances: an instanced draw call renders
   * every instance of the mesh, so the mesh must still be drawn when another instance is visible.
   */
  static le(meshComponent, scratch) {
    const mesh = meshComponent.mesh;
    if (mesh !== void 0 && mesh.meshEntitiesInner.length > 1) {
      scratch.culledInstancedMeshComponents.push(meshComponent);
    }
  }
  static ke(meshComponent, scratch, cullTick) {
    const mesh = meshComponent.mesh;
    if (mesh !== void 0) {
      scratch.meshAppendTick.set(mesh, cullTick);
    }
  }
  /**
   * Appends the primitives of the instanced meshes whose registered instances were all culled but which have
   * another instance that was not culled.
   *
   * The culling is decided per entity registered in the render pass, while an instanced draw call renders every
   * entity sharing the mesh (e.g. a template entity registered in the render pass and its shallow copies). Dropping
   * the mesh because its registered entity is outside of the view would also drop its visible copies. The culled
   * entities stay stamped in `culledEntityStamp`, so the per-instance culling of the WebGL strategy does not draw
   * them; the WebGPU strategy without GPU culling draws every instance (the hidden ones are collapsed by the vertex
   * shader and the culled ones are outside of the view).
   *
   * Must run after `__cullSiblingInstances`, which stamps the culled instances that are not registered in the pass.
   */
  static ve(cameraComponent, outPrimitives, scratch, cullTick) {
    const meshComponents = scratch.culledInstancedMeshComponents;
    const culledEntityStamp = scratch.culledEntityStamp;
    for (let i = 0; i < meshComponents.length; i++) {
      const meshComponent = meshComponents[i];
      const mesh = meshComponent.mesh;
      if (mesh === void 0 || scratch.meshAppendTick.get(mesh) === cullTick) {
        continue;
      }
      scratch.meshAppendTick.set(mesh, cullTick);
      const instances = mesh.meshEntitiesInner;
      let hasVisibleInstance = false;
      for (let j = 0; j < instances.length; j++) {
        const entityUID = instances[j].entityUID;
        if (entityUID >= culledEntityStamp.length || culledEntityStamp[entityUID] !== cullTick) {
          hasVisibleInstance = true;
          break;
        }
      }
      if (hasVisibleInstance) {
        _MeshRendererComponent.ce(meshComponent, cameraComponent, outPrimitives);
      }
    }
    meshComponents.length = 0;
  }
  static de(scratch, entityUID, cullTick) {
    scratch.culledEntityStamp = _MeshRendererComponent.je(scratch.culledEntityStamp, entityUID, cullTick);
    scratch.culledEntityCount++;
  }
  /**
   * Writes `cullTick` into `stamp[entityUID]`, growing the array up to the largest EntityUID seen so far.
   * @returns The stamp array, which is a new array when it has grown
   */
  static je(stamp, entityUID, cullTick) {
    let result = stamp;
    if (entityUID >= stamp.length) {
      result = new Uint32Array(Math.max(entityUID + 1, stamp.length * 2, 64));
      result.set(stamp);
    }
    result[entityUID] = cullTick;
    return result;
  }
  /**
   * Whether the meshes of a render pass are frustum culled on the GPU (WebGPU, `Config.isGpuCullingEnabled`).
   * The CPU culling and the WebGPU draw recording both use this, so that a mesh the CPU keeps for the GPU is
   * recorded as a culled indirect draw. Meshes whose `Mesh._isGpuCullable` is false keep the CPU culling.
   * @internal
   */
  static _isGpuCullingActive(engine, renderPass) {
    if (!engine.config.isGpuCullingEnabled || !_MeshRendererComponent._isFrustumCullingEnabled || !ProcessApproach.isWebGpuApproach(engine.engineState.currentProcessApproach) || renderPass.isBufferLessRenderingMode()) {
      return false;
    }
    const webxrSystem = engine._webXRSystemIfEnabled;
    if (renderPass.isVrRendering && (webxrSystem == null ? void 0 : webxrSystem.isWebXRMode) && webxrSystem.isMultiView()) {
      return false;
    }
    return true;
  }
  /**
   * Gets the latest culling result of a render pass for per-instance culling of instanced draw calls.
   * The result stays valid while `sort_$render` reuses its cached primitive list for the render pass.
   * @param renderPass - The render pass
   * @returns The culling state, or undefined if no culling has run for the render pass
   * @internal
   */
  static _getInstanceCullingState(renderPass) {
    const scratch = _MeshRendererComponent.ae.get(renderPass);
    if (scratch === void 0 || scratch.cullTick === 0) {
      return void 0;
    }
    return scratch;
  }
  /**
   * Appends the primitives of a mesh component to `outPrimitives` and computes the
   * view depth for blended primitives.
   */
  static ce(meshComponent, cameraComponent, outPrimitives) {
    const mesh = meshComponent.mesh;
    if (mesh === void 0) {
      return;
    }
    const meshPrimitives = mesh.primitives;
    const primitiveCount = meshPrimitives.length;
    let isBlendExist = false;
    for (let i = 0; i < primitiveCount; i++) {
      const primitive = meshPrimitives[i];
      outPrimitives.push(primitive);
      if (!isBlendExist && isBlend(primitive)) {
        isBlendExist = true;
      }
    }
    if (isBlendExist) {
      const viewDepth = meshComponent.calcViewDepth(cameraComponent);
      for (let i = 0; i < primitiveCount; i++) {
        meshPrimitives[i]._viewDepth = viewDepth;
      }
    }
  }
  /**
   * Removes duplicated primitives in place without allocating a `Set` or a new array.
   * A primitive UID is unique, so a stamp array indexed by the UID is enough to detect
   * duplicates. `primitives.length` is updated to the deduplicated length.
   */
  static re(primitives, scratch) {
    const length = primitives.length;
    if (length <= 1) {
      return;
    }
    let stamp = scratch.stamp;
    let stampTick = scratch.stampTick + 1;
    if (stampTick === 4294967295) {
      stamp.fill(0);
      stampTick = 1;
    }
    scratch.stampTick = stampTick;
    let uniqueLength = 0;
    for (let i = 0; i < length; i++) {
      const primitive = primitives[i];
      const primitiveUid = primitive.primitiveUid;
      if (primitiveUid < 0) {
        primitives[uniqueLength++] = primitive;
        continue;
      }
      if (primitiveUid >= stamp.length) {
        const newStamp = new Uint32Array(Math.max(primitiveUid + 1, stamp.length * 2, 64));
        newStamp.set(stamp);
        scratch.stamp = newStamp;
        stamp = newStamp;
      }
      if (stamp[primitiveUid] === stampTick) {
        continue;
      }
      stamp[primitiveUid] = stampTick;
      primitives[uniqueLength++] = primitive;
    }
    primitives.length = uniqueLength;
  }
  /** Sort comparator shared by every render pass (avoids allocating a closure per frame). */
  static se(a, b) {
    const delta = a._sortkey - b._sortkey;
    if (delta !== 0) {
      return delta;
    }
    return a._viewDepth - b._viewDepth;
  }
  /**
   * Builds the primitive UID list used for drawing. The trailing `-1` is the sentinel
   * that terminates the list.
   */
  static te(primitives) {
    const primitiveCount = primitives.length;
    const primitiveUids = new Array(primitiveCount + 1);
    for (let i = 0; i < primitiveCount; i++) {
      primitiveUids[i] = primitives[i].primitiveUid;
    }
    primitiveUids[primitiveCount] = -1;
    return primitiveUids;
  }
  /** Returns (and lazily creates) the reusable scratch buffers of a render pass. */
  static pe(renderPass) {
    let scratch = _MeshRendererComponent.ae.get(renderPass);
    if (scratch === void 0) {
      scratch = {
        primitives: [],
        stamp: new Uint32Array(64),
        stampTick: 0,
        culledEntityStamp: new Uint32Array(64),
        handledEntityStamp: new Uint32Array(64),
        meshCullTick: /* @__PURE__ */ new WeakMap(),
        cullTick: 0,
        culledEntityCount: 0,
        cullingId: 0,
        keyedPrimitives: [],
        isGpuCullingActive: void 0,
        isComputeSkinningEnabled: void 0,
        culledInstancedMeshComponents: [],
        meshAppendTick: /* @__PURE__ */ new WeakMap()
      };
      _MeshRendererComponent.ae.set(renderPass, scratch);
    }
    return scratch;
  }
  /**
   * Common pre-rendering setup method that prepares the rendering strategy.
   * Initializes the rendering strategy if not already set and calls its prerender method.
   */
  static common_$prerender(engine) {
    const engineUid = engine.objectUID;
    let strategy = _MeshRendererComponent.be;
    if (strategy === void 0 || _MeshRendererComponent._d !== engineUid) {
      strategy = _MeshRendererComponent.Wd.get(engineUid);
      if (strategy === void 0) {
        const processApproach = engine.engineState.currentProcessApproach;
        this.common_$load({ processApproach, engine });
        strategy = _MeshRendererComponent.Wd.get(engineUid);
        if (strategy === void 0) {
          return;
        }
      }
      _MeshRendererComponent._d = engineUid;
      _MeshRendererComponent.be = strategy;
    }
    strategy.prerender();
  }
  /**
   * Common rendering method that executes the actual rendering of primitives.
   * Delegates to the appropriate rendering strategy (WebGL or WebGPU).
   * @param renderPass - The render pass context
   * @param renderPassTickCount - The tick count for this render pass
   * @param primitiveUids - Array of primitive UIDs to render
   * @param displayIdx - The index of the display to render to
   * @param engine - The engine instance
   * @returns True if rendering was successful, false otherwise
   */
  static common_$render({
    renderPass,
    renderPassTickCount,
    primitiveUids,
    displayIdx,
    engine
  }) {
    return _MeshRendererComponent.Wd.get(engine.objectUID).common_$render(primitiveUids, renderPass, renderPassTickCount, displayIdx);
  }
  /**
   * Instance-specific render method for this mesh renderer component.
   * Currently empty as rendering is handled by the static common_$render method.
   * @param i - The index of this component in the render queue
   * @param renderPass - The render pass context
   * @param renderPassTickCount - The tick count for this render pass
   */
  $render() {
  }
  /**
   * Performs a shallow copy of properties from another MeshRendererComponent.
   * Copies cube map settings and contributions without deep cloning the textures.
   * @param component_ - The source component to copy from
   */
  _shallowCopyFrom(component_) {
    const component = component_;
    this.Xd = component.Xd;
    this.Yd = component.Yd;
    this.diffuseCubeMapContribution = component.diffuseCubeMapContribution;
    this.specularCubeMapContribution = component.specularCubeMapContribution;
    this.rotationOfCubeMap = component.rotationOfCubeMap;
  }
  /**
   * Destroys this component and cleans up its resources.
   * Clears cube map references and calls the parent destroy method.
   */
  _destroy() {
    super._destroy();
    this.Xd = void 0;
    this.Yd = void 0;
  }
  /**
   * Adds the MeshRenderer component functionality to an entity class.
   * This method extends the entity base class with mesh renderer specific methods.
   * @param base - The target entity base class
   * @param _componentClass - The component class to add (unused parameter for type safety)
   * @returns The enhanced entity class with mesh renderer methods
   */
  addThisComponentToEntity(base, _componentClass) {
    class MeshRendererEntity extends base.constructor {
      getMeshRenderer() {
        return this.getComponentByComponentTID(
          WellKnownComponentTIDs.MeshRendererComponentTID
        );
      }
    }
    applyMixins(base, MeshRendererEntity);
    return base;
  }
  /**
   * Cleans up static resources associated with the specified engine.
   * @param engine - The engine instance to clean up resources for
   * @internal
   */
  static _cleanupForEngine(engine) {
    const strategy = _MeshRendererComponent.Wd.get(engine.objectUID);
    if (strategy != null) {
      strategy.destroy();
    }
    _MeshRendererComponent.Wd.delete(engine.objectUID);
    if (_MeshRendererComponent._d === engine.objectUID) {
      _MeshRendererComponent._d = -1;
      _MeshRendererComponent.be = void 0;
    }
  }
};
_MeshRendererComponent.Wd = /* @__PURE__ */ new Map();
_MeshRendererComponent.we = /* @__PURE__ */ new Map();
_MeshRendererComponent.ia = 0;
_MeshRendererComponent._isFrustumCullingEnabled = true;
/** Monotonic id of the latest culling pass, used as a per-mesh visit stamp. */
_MeshRendererComponent.me = 0;
/**
 * Interned ids of mesh renderer fingerprints. The fingerprint changes only when the IBL cube
 * maps change, and two mesh renderers with the same cube maps must share a multi-draw batch,
 * so the id is interned by value instead of being unique per component.
 */
_MeshRendererComponent.ie = /* @__PURE__ */ new Map();
_MeshRendererComponent.ne = 0;
/** Per-render-pass scratch buffers reused by sort_$render to avoid per-frame allocations. */
_MeshRendererComponent.ae = /* @__PURE__ */ new WeakMap();
/** Memoized rendering strategy for common_$prerender (the hot path runs once per frame). */
_MeshRendererComponent._d = -1;
var MeshRendererComponent = _MeshRendererComponent;
export {
  MeshRendererComponent
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29tcG9uZW50cy9NZXNoUmVuZGVyZXIvTWVzaFJlbmRlcmVyQ29tcG9uZW50LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7XG4gIENHQVBJUmVzb3VyY2VIYW5kbGUsXG4gIENvbXBvbmVudFNJRCxcbiAgQ29tcG9uZW50VElELFxuICBDb3VudCxcbiAgRW50aXR5VUlELFxuICBJbmRleCxcbiAgT2JqZWN0VUlELFxuICBQcmltaXRpdmVVSUQsXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB7IGdldE11bHRpRHJhd1N0YXRlS2V5SWQsIGdldFByaW1pdGl2ZU1lc2hSZW5kZXJlckZpbmdlclByaW50SWQgfSBmcm9tICcuLi8uLi8uLi93ZWJnbC9NdWx0aURyYXcnO1xuaW1wb3J0IHR5cGUgeyBSbldlYkdMLCBXZWJHTFN0cmF0ZWd5IH0gZnJvbSAnLi4vLi4vLi4vd2ViZ2wvbWFpbic7XG5pbXBvcnQgdHlwZSB7IFJuV2ViR3B1IH0gZnJvbSAnLi4vLi4vLi4vd2ViZ3B1L21haW4nO1xuaW1wb3J0IHR5cGUgeyBXZWJHcHVTdHJhdGVneUJhc2ljIH0gZnJvbSAnLi4vLi4vLi4vd2ViZ3B1L1dlYkdwdVN0cmF0ZWd5QmFzaWMnO1xuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vY29yZS9Db21wb25lbnQnO1xuaW1wb3J0IHR5cGUgeyBJRW50aXR5IH0gZnJvbSAnLi4vLi4vY29yZS9FbnRpdHknO1xuaW1wb3J0IHsgYXBwbHlNaXhpbnMsIHR5cGUgRW50aXR5UmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL2NvcmUvRW50aXR5UmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBQcm9jZXNzQXBwcm9hY2gsIHR5cGUgUHJvY2Vzc0FwcHJvYWNoRW51bSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1Byb2Nlc3NBcHByb2FjaCc7XG5pbXBvcnQgeyBQcm9jZXNzU3RhZ2UgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Qcm9jZXNzU3RhZ2UnO1xuaW1wb3J0IHR5cGUgeyBQcmltaXRpdmUgfSBmcm9tICcuLi8uLi9nZW9tZXRyeS9QcmltaXRpdmUnO1xuaW1wb3J0IHsgaXNCbGVuZCwgaXNCbGVuZFdpdGhvdXRaV3JpdGUsIGlzQmxlbmRXaXRoWldyaXRlLCBpc1RyYW5zbHVjZW50IH0gZnJvbSAnLi4vLi4vZ2VvbWV0cnkvdHlwZXMvR2VvbWV0cnlUeXBlcyc7XG5pbXBvcnQgdHlwZSB7IENHQVBJU3RyYXRlZ3kgfSBmcm9tICcuLi8uLi9yZW5kZXJlci9DR0FQSVN0cmF0ZWd5JztcbmltcG9ydCB0eXBlIHsgUmVuZGVyUGFzcyB9IGZyb20gJy4uLy4uL3JlbmRlcmVyL1JlbmRlclBhc3MnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB7IE1vZHVsZU1hbmFnZXIgfSBmcm9tICcuLi8uLi9zeXN0ZW0vTW9kdWxlTWFuYWdlcic7XG5pbXBvcnQgdHlwZSB7IEN1YmVUZXh0dXJlIH0gZnJvbSAnLi4vLi4vdGV4dHVyZXMvQ3ViZVRleHR1cmUnO1xuaW1wb3J0IHR5cGUgeyBSZW5kZXJUYXJnZXRUZXh0dXJlQ3ViZSB9IGZyb20gJy4uLy4uL3RleHR1cmVzL1JlbmRlclRhcmdldFRleHR1cmVDdWJlJztcbmltcG9ydCB7IENhbWVyYUNvbXBvbmVudCB9IGZyb20gJy4uL0NhbWVyYS9DYW1lcmFDb21wb25lbnQnO1xuaW1wb3J0IHsgX2dldENhbWVyYUNvbnRyb2xsZXJVcGRhdGVDb3VudCB9IGZyb20gJy4uL0NhbWVyYUNvbnRyb2xsZXIvQ2FtZXJhQ29udHJvbGxlclVwZGF0ZUNvdW50JztcbmltcG9ydCB0eXBlIHsgQ29tcG9uZW50VG9Db21wb25lbnRNZXRob2RzIH0gZnJvbSAnLi4vQ29tcG9uZW50VHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBNZXNoQ29tcG9uZW50IH0gZnJvbSAnLi4vTWVzaC9NZXNoQ29tcG9uZW50JztcbmltcG9ydCB7IFNjZW5lR3JhcGhDb21wb25lbnQgfSBmcm9tICcuLi9TY2VuZUdyYXBoL1NjZW5lR3JhcGhDb21wb25lbnQnO1xuaW1wb3J0IHsgVHJhbnNmb3JtQ29tcG9uZW50IH0gZnJvbSAnLi4vVHJhbnNmb3JtL1RyYW5zZm9ybUNvbXBvbmVudCc7XG5pbXBvcnQgeyBXZWxsS25vd25Db21wb25lbnRUSURzIH0gZnJvbSAnLi4vV2VsbEtub3duQ29tcG9uZW50VElEcyc7XG5cbi8qKlxuICogUmV1c2FibGUgd29ya2luZyBidWZmZXJzIGZvciBvbmUgcmVuZGVyIHBhc3MuXG4gKlxuICogYHNvcnRfJHJlbmRlcmAgcnVucyBldmVyeSBmcmFtZSBhbmQgdXNlZCB0byBhbGxvY2F0ZSBhIGZpbHRlcmVkIG1lc2ggY29tcG9uZW50XG4gKiBhcnJheSwgYSBgU2V0YCwgYSBtYXBwZWQgYXJyYXkgYW5kIHNldmVyYWwgY2xvc3VyZXMgcGVyIGNhbGwuIEFsbCBvZiB0aGVtIGFyZVxuICogcmVwbGFjZWQgYnkgdGhlc2UgcGVyLXJlbmRlci1wYXNzIHNjcmF0Y2ggYnVmZmVycy5cbiAqL1xudHlwZSBNZXNoUmVuZGVyZXJTb3J0U2NyYXRjaCA9IHtcbiAgLyoqIFByaW1pdGl2ZXMgY29sbGVjdGVkIGJ5IHRoZSBjdWxsaW5nIHBhc3MuICovXG4gIHByaW1pdGl2ZXM6IFByaW1pdGl2ZVtdO1xuICAvKiogUGVyLXByaW1pdGl2ZSBzdGFtcCB1c2VkIHRvIHJlbW92ZSBkdXBsaWNhdGVzIHdpdGhvdXQgYSBgU2V0YC4gKi9cbiAgc3RhbXA6IFVpbnQzMkFycmF5O1xuICAvKiogQ3VycmVudCBzdGFtcCB2YWx1ZTsgYSBwcmltaXRpdmUgaXMgYSBkdXBsaWNhdGUgd2hpbGUgYHN0YW1wW3VpZF0gPT09IHN0YW1wVGlja2AuICovXG4gIHN0YW1wVGljazogbnVtYmVyO1xuICAvKiogUGVyLUVudGl0eVVJRCBzdGFtcDsgYW4gZW50aXR5IHdhcyBjdWxsZWQgYnkgdGhlIGxhdGVzdCBjdWxsaW5nIHdoaWxlIGBjdWxsZWRFbnRpdHlTdGFtcFt1aWRdID09PSBjdWxsVGlja2AuICovXG4gIGN1bGxlZEVudGl0eVN0YW1wOiBVaW50MzJBcnJheTtcbiAgLyoqIFBlci1FbnRpdHlVSUQgc3RhbXA7IGFuIGVudGl0eSB3YXMgaGFuZGxlZCBieSB0aGUgbGF0ZXN0IGN1bGxpbmcgd2hpbGUgYGhhbmRsZWRFbnRpdHlTdGFtcFt1aWRdID09PSBjdWxsVGlja2AuICovXG4gIGhhbmRsZWRFbnRpdHlTdGFtcDogVWludDMyQXJyYXk7XG4gIC8qKiBQZXItbWVzaCBzdGFtcDsgdGhlIGluc3RhbmNlcyBzaGFyaW5nIGEgbWVzaCB3ZXJlIGN1bGxlZCBieSB0aGUgbGF0ZXN0IGN1bGxpbmcgd2hpbGUgaXQgZXF1YWxzIGBjdWxsVGlja2AuICovXG4gIG1lc2hDdWxsVGljazogV2Vha01hcDxvYmplY3QsIG51bWJlcj47XG4gIC8qKiBTdGFtcCB2YWx1ZSBvZiB0aGUgbGF0ZXN0IGN1bGxpbmcgb2YgdGhpcyByZW5kZXIgcGFzcyAoMCBtZWFucyBubyBjdWxsaW5nIGhhcyBydW4geWV0KS4gKi9cbiAgY3VsbFRpY2s6IG51bWJlcjtcbiAgLyoqIE51bWJlciBvZiBlbnRpdGllcyBjdWxsZWQgYnkgdGhlIGxhdGVzdCBjdWxsaW5nLiAwIG1lYW5zIGV2ZXJ5IGluc3RhbmNlIHN0YXlzIHZpc2libGUuICovXG4gIGN1bGxlZEVudGl0eUNvdW50OiBudW1iZXI7XG4gIC8qKiBHbG9iYWxseSB1bmlxdWUgaWQgb2YgdGhlIGxhdGVzdCBjdWxsaW5nLCB1c2VkIHRvIHZpc2l0IGVhY2ggbWVzaCBvbmNlIGluIHRoZSBpbnN0YW5jZSBwcmVwYXNzLiAqL1xuICBjdWxsaW5nSWQ6IG51bWJlcjtcbiAgLyoqIFJldXNlZCBvYmplY3RzIG9mIHRoZSBvcGFxdWUgbXVsdGktZHJhdyByZW9yZGVyLCBzbyBhIHNvcnQgZG9lcyBub3QgYWxsb2NhdGUgcGVyIHByaW1pdGl2ZS4gKi9cbiAga2V5ZWRQcmltaXRpdmVzOiB7IHByaW1pdGl2ZTogUHJpbWl0aXZlIHwgbnVsbDsga2V5SWQ6IG51bWJlcjsgaW5kZXg6IG51bWJlciB9W107XG4gIC8qKiBXaGV0aGVyIHRoZSBsYXRlc3Qgc29ydCByYW4gd2l0aCBHUFUgY3VsbGluZyBhY3RpdmUgKHNlZSBgX2lzR3B1Q3VsbGluZ0FjdGl2ZWApOyB1bmRlZmluZWQgYmVmb3JlIHRoZSBmaXJzdC4gKi9cbiAgaXNHcHVDdWxsaW5nQWN0aXZlOiBib29sZWFuIHwgdW5kZWZpbmVkO1xuICAvKiogYENvbmZpZy5pc0NvbXB1dGVTa2lubmluZ0VuYWJsZWRgIG9mIHRoZSBsYXRlc3Qgc29ydDsgdW5kZWZpbmVkIGJlZm9yZSB0aGUgZmlyc3QuICovXG4gIGlzQ29tcHV0ZVNraW5uaW5nRW5hYmxlZDogYm9vbGVhbiB8IHVuZGVmaW5lZDtcbiAgLyoqXG4gICAqIFRoZSBjdWxsZWQgbWVzaCBjb21wb25lbnRzIG9mIHRoZSBsYXRlc3QgY3VsbGluZyB3aG9zZSBtZXNoIGlzIHNoYXJlZCBieSBvdGhlciBpbnN0YW5jZXMuIFRoZWlyIHByaW1pdGl2ZXMgYXJlXG4gICAqIHN0aWxsIGRyYXduIHdoZW4gYW5vdGhlciBpbnN0YW5jZSBvZiB0aGUgbWVzaCBpcyB2aXNpYmxlIChzZWUgYF9fYXBwZW5kUHJpbWl0aXZlc09mQ3VsbGVkSW5zdGFuY2VkTWVzaGVzYCkuXG4gICAqL1xuICBjdWxsZWRJbnN0YW5jZWRNZXNoQ29tcG9uZW50czogTWVzaENvbXBvbmVudFtdO1xuICAvKiogUGVyLW1lc2ggc3RhbXA7IHRoZSBwcmltaXRpdmVzIG9mIHRoZSBtZXNoIHdlcmUgYXBwZW5kZWQgYnkgdGhlIGxhdGVzdCBjdWxsaW5nIHdoaWxlIGl0IGVxdWFscyBgY3VsbFRpY2tgLiAqL1xuICBtZXNoQXBwZW5kVGljazogV2Vha01hcDxvYmplY3QsIG51bWJlcj47XG59O1xuXG4vKipcbiAqIEN1bGxpbmcgcmVzdWx0IG9mIGEgcmVuZGVyIHBhc3MgZm9yIHBlci1pbnN0YW5jZSBjdWxsaW5nIG9mIGluc3RhbmNlZCBkcmF3IGNhbGxzLlxuICogQW4gZW50aXR5IHdhcyBjdWxsZWQgaW4gdGhlIHJlbmRlciBwYXNzIHdoaWxlIGBjdWxsZWRFbnRpdHlTdGFtcFtlbnRpdHlVSURdID09PSBjdWxsVGlja2AuXG4gKi9cbmV4cG9ydCB0eXBlIEluc3RhbmNlQ3VsbGluZ1N0YXRlID0ge1xuICByZWFkb25seSBjdWxsZWRFbnRpdHlTdGFtcDogVWludDMyQXJyYXk7XG4gIHJlYWRvbmx5IGN1bGxUaWNrOiBudW1iZXI7XG4gIC8qKiBOdW1iZXIgb2YgZW50aXRpZXMgY3VsbGVkIGJ5IHRoZSBsYXRlc3QgY3VsbGluZy4gMCBtZWFucyBldmVyeSBpbnN0YW5jZSBzdGF5cyB2aXNpYmxlLiAqL1xuICByZWFkb25seSBjdWxsZWRFbnRpdHlDb3VudDogbnVtYmVyO1xuICAvKiogR2xvYmFsbHkgdW5pcXVlIGlkIG9mIHRoZSBsYXRlc3QgY3VsbGluZy4gKi9cbiAgcmVhZG9ubHkgY3VsbGluZ0lkOiBudW1iZXI7XG59O1xuXG4vKipcbiAqIE1lc2hSZW5kZXJlckNvbXBvbmVudCBpcyBhIGNvbXBvbmVudCB0aGF0IG1hbmFnZXMgdGhlIHJlbmRlcmluZyBvZiBhIG1lc2ggZW50aXR5LlxuICogSXQgaGFuZGxlcyBtZXNoIHJlbmRlcmluZyBwaXBlbGluZSwgSUJMIChJbWFnZS1CYXNlZCBMaWdodGluZykgY3ViZSBtYXBzLCBmcnVzdHVtIGN1bGxpbmcsXG4gKiBhbmQgcmVuZGVyaW5nIG9wdGltaXphdGlvbiB0aHJvdWdoIHZhcmlvdXMgc3RyYXRlZ2llcy5cbiAqL1xuZXhwb3J0IGNsYXNzIE1lc2hSZW5kZXJlckNvbXBvbmVudCBleHRlbmRzIENvbXBvbmVudCB7XG4gIHByaXZhdGUgX19kaWZmdXNlQ3ViZU1hcD86IEN1YmVUZXh0dXJlIHwgUmVuZGVyVGFyZ2V0VGV4dHVyZUN1YmU7XG4gIHByaXZhdGUgX19zcGVjdWxhckN1YmVNYXA/OiBDdWJlVGV4dHVyZSB8IFJlbmRlclRhcmdldFRleHR1cmVDdWJlO1xuICBwcml2YXRlIF9fc2hlZW5DdWJlTWFwPzogQ3ViZVRleHR1cmUgfCBSZW5kZXJUYXJnZXRUZXh0dXJlQ3ViZTtcbiAgcHJpdmF0ZSBfX2RpZmZ1c2VDdWJlTWFwQ29udHJpYnV0aW9uID0gMS4wO1xuICBwcml2YXRlIF9fc3BlY3VsYXJDdWJlTWFwQ29udHJpYnV0aW9uID0gMS4wO1xuICBwcml2YXRlIF9fcm90YXRpb25PZkN1YmVNYXAgPSAwO1xuXG4gIHByaXZhdGUgc3RhdGljIF9fY2dBcGlSZW5kZXJpbmdTdHJhdGVneU1hcDogTWFwPE9iamVjdFVJRCwgQ0dBUElTdHJhdGVneT4gPSBuZXcgTWFwKCk7XG4gIHN0YXRpYyBfX3NoYWRlclByb2dyYW1IYW5kbGVPZlByaW1pdGl2ZU9iamVjdFVpZHM6IE1hcDxPYmplY3RVSUQsIENHQVBJUmVzb3VyY2VIYW5kbGU+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIF9fdXBkYXRlQ291bnQgPSAwO1xuICBwcml2YXRlIHN0YXRpYyBfX3VwZGF0ZUNvdW50ID0gMDtcbiAgcHVibGljIHN0YXRpYyBfaXNGcnVzdHVtQ3VsbGluZ0VuYWJsZWQgPSB0cnVlO1xuICAvKiogTW9ub3RvbmljIGlkIG9mIHRoZSBsYXRlc3QgY3VsbGluZyBwYXNzLCB1c2VkIGFzIGEgcGVyLW1lc2ggdmlzaXQgc3RhbXAuICovXG4gIHByaXZhdGUgc3RhdGljIF9fY3VsbGluZ0lkQ291bnRlciA9IDA7XG5cbiAgcHJpdmF0ZSBfX2ZpbmdlclByaW50ID0gJyc7XG4gIHByaXZhdGUgX19maW5nZXJQcmludElkID0gMDtcbiAgLyoqXG4gICAqIEludGVybmVkIGlkcyBvZiBtZXNoIHJlbmRlcmVyIGZpbmdlcnByaW50cy4gVGhlIGZpbmdlcnByaW50IGNoYW5nZXMgb25seSB3aGVuIHRoZSBJQkwgY3ViZVxuICAgKiBtYXBzIGNoYW5nZSwgYW5kIHR3byBtZXNoIHJlbmRlcmVycyB3aXRoIHRoZSBzYW1lIGN1YmUgbWFwcyBtdXN0IHNoYXJlIGEgbXVsdGktZHJhdyBiYXRjaCxcbiAgICogc28gdGhlIGlkIGlzIGludGVybmVkIGJ5IHZhbHVlIGluc3RlYWQgb2YgYmVpbmcgdW5pcXVlIHBlciBjb21wb25lbnQuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2ZpbmdlclByaW50SWRzID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19uZXh0RmluZ2VyUHJpbnRJZCA9IDA7XG5cbiAgLyoqIFBlci1yZW5kZXItcGFzcyBzY3JhdGNoIGJ1ZmZlcnMgcmV1c2VkIGJ5IHNvcnRfJHJlbmRlciB0byBhdm9pZCBwZXItZnJhbWUgYWxsb2NhdGlvbnMuICovXG4gIHByaXZhdGUgc3RhdGljIF9fc29ydFNjcmF0Y2hNYXA6IFdlYWtNYXA8UmVuZGVyUGFzcywgTWVzaFJlbmRlcmVyU29ydFNjcmF0Y2g+ID0gbmV3IFdlYWtNYXAoKTtcblxuICAvKiogTWVtb2l6ZWQgcmVuZGVyaW5nIHN0cmF0ZWd5IGZvciBjb21tb25fJHByZXJlbmRlciAodGhlIGhvdCBwYXRoIHJ1bnMgb25jZSBwZXIgZnJhbWUpLiAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3ByZXJlbmRlclN0cmF0ZWd5RW5naW5lVWlkOiBPYmplY3RVSUQgPSAtMTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19wcmVyZW5kZXJTdHJhdGVneTogQ0dBUElTdHJhdGVneSB8IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNZXNoUmVuZGVyZXJDb21wb25lbnQgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBlbnRpdHlVaWQgLSBUaGUgdW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIGVudGl0eSB0aGlzIGNvbXBvbmVudCBiZWxvbmdzIHRvXG4gICAqIEBwYXJhbSBjb21wb25lbnRTaWQgLSBUaGUgY29tcG9uZW50J3Mgc3lzdGVtIGlkZW50aWZpZXJcbiAgICogQHBhcmFtIGVudGl0eVJlcG9zaXRvcnkgLSBUaGUgcmVwb3NpdG9yeSBtYW5hZ2luZyBlbnRpdGllc1xuICAgKiBAcGFyYW0gaXNSZVVzZSAtIFdoZXRoZXIgdGhpcyBjb21wb25lbnQgaXMgYmVpbmcgcmV1c2VkIGZyb20gYSBwb29sXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBlbnRpdHlVaWQ6IEVudGl0eVVJRCxcbiAgICBjb21wb25lbnRTaWQ6IENvbXBvbmVudFNJRCxcbiAgICBlbnRpdHlSZXBvc2l0b3J5OiBFbnRpdHlSZXBvc2l0b3J5LFxuICAgIGlzUmVVc2U6IGJvb2xlYW5cbiAgKSB7XG4gICAgc3VwZXIoZW5naW5lLCBlbnRpdHlVaWQsIGNvbXBvbmVudFNpZCwgZW50aXR5UmVwb3NpdG9yeSwgaXNSZVVzZSk7XG4gICAgdGhpcy5jYWxjRmluZ2VyUHJpbnQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb21wb25lbnQgdHlwZSBJRCBmb3IgTWVzaFJlbmRlcmVyQ29tcG9uZW50LlxuICAgKiBAcmV0dXJucyBUaGUgY29tcG9uZW50IHR5cGUgSURcbiAgICovXG4gIHN0YXRpYyBnZXQgY29tcG9uZW50VElEKCkge1xuICAgIHJldHVybiBXZWxsS25vd25Db21wb25lbnRUSURzLk1lc2hSZW5kZXJlckNvbXBvbmVudFRJRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb21wb25lbnQgdHlwZSBJRCBmb3IgdGhpcyBpbnN0YW5jZS5cbiAgICogQHJldHVybnMgVGhlIGNvbXBvbmVudCB0eXBlIElEXG4gICAqL1xuICBnZXQgY29tcG9uZW50VElEKCk6IENvbXBvbmVudFRJRCB7XG4gICAgcmV0dXJuIFdlbGxLbm93bkNvbXBvbmVudFRJRHMuTWVzaFJlbmRlcmVyQ29tcG9uZW50VElEO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGRpZmZ1c2UgY3ViZSBtYXAgdXNlZCBmb3IgSUJMIGxpZ2h0aW5nLlxuICAgKiBAcmV0dXJucyBUaGUgZGlmZnVzZSBjdWJlIG1hcCB0ZXh0dXJlIG9yIHVuZGVmaW5lZCBpZiBub3Qgc2V0XG4gICAqL1xuICBnZXQgZGlmZnVzZUN1YmVNYXAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19kaWZmdXNlQ3ViZU1hcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzcGVjdWxhciBjdWJlIG1hcCB1c2VkIGZvciBJQkwgbGlnaHRpbmcuXG4gICAqIEByZXR1cm5zIFRoZSBzcGVjdWxhciBjdWJlIG1hcCB0ZXh0dXJlIG9yIHVuZGVmaW5lZCBpZiBub3Qgc2V0XG4gICAqL1xuICBnZXQgc3BlY3VsYXJDdWJlTWFwKCkge1xuICAgIHJldHVybiB0aGlzLl9fc3BlY3VsYXJDdWJlTWFwO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHNoZWVuIGN1YmUgbWFwIHVzZWQgZm9yIElCTCBsaWdodGluZy5cbiAgICogQHJldHVybnMgVGhlIHNoZWVuIGN1YmUgbWFwIHRleHR1cmUgb3IgdW5kZWZpbmVkIGlmIG5vdCBzZXRcbiAgICovXG4gIGdldCBzaGVlbkN1YmVNYXAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19zaGVlbkN1YmVNYXA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdXBkYXRlIGNvdW50IGZvciB0aGlzIGNvbXBvbmVudCBpbnN0YW5jZS5cbiAgICogQHJldHVybnMgVGhlIGN1cnJlbnQgdXBkYXRlIGNvdW50XG4gICAqL1xuICBnZXQgdXBkYXRlQ291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX191cGRhdGVDb3VudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBnbG9iYWwgdXBkYXRlIGNvdW50IGZvciBhbGwgTWVzaFJlbmRlcmVyQ29tcG9uZW50IGluc3RhbmNlcy5cbiAgICogQHJldHVybnMgVGhlIGdsb2JhbCB1cGRhdGUgY291bnRcbiAgICovXG4gIHN0YXRpYyBnZXQgdXBkYXRlQ291bnQoKSB7XG4gICAgcmV0dXJuIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX3VwZGF0ZUNvdW50O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNvbnRyaWJ1dGlvbiBmYWN0b3IgZm9yIHRoZSBkaWZmdXNlIGN1YmUgbWFwIGluIElCTCBjYWxjdWxhdGlvbnMuXG4gICAqIEByZXR1cm5zIFRoZSBkaWZmdXNlIGN1YmUgbWFwIGNvbnRyaWJ1dGlvbiBmYWN0b3IgKDAuMCB0byAxLjApXG4gICAqL1xuICBnZXQgZGlmZnVzZUN1YmVNYXBDb250cmlidXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX19kaWZmdXNlQ3ViZU1hcENvbnRyaWJ1dGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjb250cmlidXRpb24gZmFjdG9yIGZvciB0aGUgZGlmZnVzZSBjdWJlIG1hcCBpbiBJQkwgY2FsY3VsYXRpb25zLlxuICAgKiBAcGFyYW0gY29udHJpYnV0aW9uIC0gVGhlIGNvbnRyaWJ1dGlvbiBmYWN0b3IgKDAuMCB0byAxLjApXG4gICAqL1xuICBzZXQgZGlmZnVzZUN1YmVNYXBDb250cmlidXRpb24oY29udHJpYnV0aW9uOiBudW1iZXIpIHtcbiAgICB0aGlzLl9fZGlmZnVzZUN1YmVNYXBDb250cmlidXRpb24gPSBjb250cmlidXRpb247XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb250cmlidXRpb24gZmFjdG9yIGZvciB0aGUgc3BlY3VsYXIgY3ViZSBtYXAgaW4gSUJMIGNhbGN1bGF0aW9ucy5cbiAgICogQHJldHVybnMgVGhlIHNwZWN1bGFyIGN1YmUgbWFwIGNvbnRyaWJ1dGlvbiBmYWN0b3IgKDAuMCB0byAxLjApXG4gICAqL1xuICBnZXQgc3BlY3VsYXJDdWJlTWFwQ29udHJpYnV0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9fc3BlY3VsYXJDdWJlTWFwQ29udHJpYnV0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGNvbnRyaWJ1dGlvbiBmYWN0b3IgZm9yIHRoZSBzcGVjdWxhciBjdWJlIG1hcCBpbiBJQkwgY2FsY3VsYXRpb25zLlxuICAgKiBAcGFyYW0gY29udHJpYnV0aW9uIC0gVGhlIGNvbnRyaWJ1dGlvbiBmYWN0b3IgKDAuMCB0byAxLjApXG4gICAqL1xuICBzZXQgc3BlY3VsYXJDdWJlTWFwQ29udHJpYnV0aW9uKGNvbnRyaWJ1dGlvbjogbnVtYmVyKSB7XG4gICAgdGhpcy5fX3NwZWN1bGFyQ3ViZU1hcENvbnRyaWJ1dGlvbiA9IGNvbnRyaWJ1dGlvbjtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHJvdGF0aW9uIGFuZ2xlIG9mIHRoZSBjdWJlIG1hcCBpbiByYWRpYW5zLlxuICAgKiBAcmV0dXJucyBUaGUgcm90YXRpb24gYW5nbGUgaW4gcmFkaWFuc1xuICAgKi9cbiAgZ2V0IHJvdGF0aW9uT2ZDdWJlTWFwKCkge1xuICAgIHJldHVybiB0aGlzLl9fcm90YXRpb25PZkN1YmVNYXA7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcm90YXRpb24gYW5nbGUgb2YgdGhlIGN1YmUgbWFwIGluIHJhZGlhbnMuXG4gICAqIEBwYXJhbSByb3RhdGlvbiAtIFRoZSByb3RhdGlvbiBhbmdsZSBpbiByYWRpYW5zXG4gICAqL1xuICBzZXQgcm90YXRpb25PZkN1YmVNYXAocm90YXRpb246IG51bWJlcikge1xuICAgIHRoaXMuX19yb3RhdGlvbk9mQ3ViZU1hcCA9IHJvdGF0aW9uO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyBhbmQgdXBkYXRlcyB0aGUgZmluZ2VycHJpbnQgZm9yIHRoaXMgY29tcG9uZW50IGJhc2VkIG9uIGN1cnJlbnQgY3ViZSBtYXAgc2V0dGluZ3MuXG4gICAqIFRoZSBmaW5nZXJwcmludCBpcyB1c2VkIGZvciBjYWNoaW5nIGFuZCBvcHRpbWl6YXRpb24gcHVycG9zZXMuXG4gICAqL1xuICBjYWxjRmluZ2VyUHJpbnQoKSB7XG4gICAgdGhpcy5fX2ZpbmdlclByaW50ID0gYCR7dGhpcy5fX2RpZmZ1c2VDdWJlTWFwICE9IG51bGwgPyB0aGlzLl9fZGlmZnVzZUN1YmVNYXAudGV4dHVyZVVJRCA6IC0xfSAke3RoaXMuX19zcGVjdWxhckN1YmVNYXAgIT0gbnVsbCA/IHRoaXMuX19zcGVjdWxhckN1YmVNYXAudGV4dHVyZVVJRCA6IC0xfSAke3RoaXMuX19zaGVlbkN1YmVNYXAgIT0gbnVsbCA/IHRoaXMuX19zaGVlbkN1YmVNYXAudGV4dHVyZVVJRCA6IC0xfWA7XG4gICAgdGhpcy5fX2ZpbmdlclByaW50SWQgPSBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19pbnRlcm5GaW5nZXJQcmludElkKHRoaXMuX19maW5nZXJQcmludCk7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2ludGVybkZpbmdlclByaW50SWQoZmluZ2VyUHJpbnQ6IHN0cmluZyk6IG51bWJlciB7XG4gICAgbGV0IGlkID0gTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fZmluZ2VyUHJpbnRJZHMuZ2V0KGZpbmdlclByaW50KTtcbiAgICBpZiAoaWQgPT0gbnVsbCkge1xuICAgICAgaWQgPSArK01lc2hSZW5kZXJlckNvbXBvbmVudC5fX25leHRGaW5nZXJQcmludElkO1xuICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fZmluZ2VyUHJpbnRJZHMuc2V0KGZpbmdlclByaW50LCBpZCk7XG4gICAgfVxuICAgIHJldHVybiBpZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IGZpbmdlcnByaW50IG9mIHRoaXMgY29tcG9uZW50LlxuICAgKiBAcmV0dXJucyBUaGUgZmluZ2VycHJpbnQgc3RyaW5nXG4gICAqL1xuICBnZXRGaW5nZXJQcmludCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2ZpbmdlclByaW50O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludGVybmVkIG51bWVyaWMgaWQgb2YgdGhlIGZpbmdlcnByaW50LiBOdW1lcmljIGlkcyBrZWVwIHRoZSBwZXItZnJhbWVcbiAgICogbXVsdGktZHJhdyBzdGF0ZSBrZXlzIGNoZWFwIHRvIGNvbXBhcmUuXG4gICAqIEByZXR1cm5zIFRoZSBmaW5nZXJwcmludCBpZFxuICAgKi9cbiAgZ2V0RmluZ2VyUHJpbnRJZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2ZpbmdlclByaW50SWQ7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgSUJMIChJbWFnZS1CYXNlZCBMaWdodGluZykgY3ViZSBtYXBzIGZvciB0aGlzIG1lc2ggcmVuZGVyZXIuXG4gICAqIEBwYXJhbSBkaWZmdXNlQ3ViZVRleHR1cmUgLSBUaGUgZGlmZnVzZSBjdWJlIG1hcCB0ZXh0dXJlIGZvciBJQkxcbiAgICogQHBhcmFtIHNwZWN1bGFyQ3ViZVRleHR1cmUgLSBUaGUgc3BlY3VsYXIgY3ViZSBtYXAgdGV4dHVyZSBmb3IgSUJMXG4gICAqIEBwYXJhbSBzaGVlbkN1YmVUZXh0dXJlIC0gT3B0aW9uYWwgc2hlZW4gY3ViZSBtYXAgdGV4dHVyZSBmb3IgSUJMXG4gICAqL1xuICBzZXRJQkxDdWJlTWFwKFxuICAgIGRpZmZ1c2VDdWJlVGV4dHVyZTogQ3ViZVRleHR1cmUgfCBSZW5kZXJUYXJnZXRUZXh0dXJlQ3ViZSxcbiAgICBzcGVjdWxhckN1YmVUZXh0dXJlOiBDdWJlVGV4dHVyZSB8IFJlbmRlclRhcmdldFRleHR1cmVDdWJlLFxuICAgIHNoZWVuQ3ViZVRleHR1cmU/OiBDdWJlVGV4dHVyZSB8IFJlbmRlclRhcmdldFRleHR1cmVDdWJlXG4gICkge1xuICAgIGlmIChkaWZmdXNlQ3ViZVRleHR1cmUgPT0gbnVsbCB8fCBzcGVjdWxhckN1YmVUZXh0dXJlID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9fZGlmZnVzZUN1YmVNYXAgPSBkaWZmdXNlQ3ViZVRleHR1cmU7XG4gICAgdGhpcy5fX3NwZWN1bGFyQ3ViZU1hcCA9IHNwZWN1bGFyQ3ViZVRleHR1cmU7XG4gICAgdGhpcy5fX3NoZWVuQ3ViZU1hcCA9IHNoZWVuQ3ViZVRleHR1cmU7XG5cbiAgICB0aGlzLmNhbGNGaW5nZXJQcmludCgpO1xuXG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21tb24gbG9hZGluZyBtZXRob2QgdGhhdCBpbml0aWFsaXplcyB0aGUgcmVuZGVyaW5nIHN0cmF0ZWd5IGJhc2VkIG9uIHRoZSBwcm9jZXNzIGFwcHJvYWNoLlxuICAgKiBUaGlzIG1ldGhvZCBzZXRzIHVwIGVpdGhlciBXZWJHUFUgb3IgV2ViR0wgcmVuZGVyaW5nIHN0cmF0ZWdpZXMuXG4gICAqIEBwYXJhbSBwcm9jZXNzQXBwcm9hY2ggLSBUaGUgZ3JhcGhpY3MgQVBJIGFwcHJvYWNoIHRvIHVzZSAoV2ViR1BVIG9yIFdlYkdMKVxuICAgKi9cbiAgc3RhdGljIGNvbW1vbl8kbG9hZCh7IHByb2Nlc3NBcHByb2FjaCwgZW5naW5lIH06IHsgcHJvY2Vzc0FwcHJvYWNoOiBQcm9jZXNzQXBwcm9hY2hFbnVtOyBlbmdpbmU6IEVuZ2luZSB9KSB7XG4gICAgY29uc3QgbW9kdWxlTWFuYWdlciA9IE1vZHVsZU1hbmFnZXIuZ2V0SW5zdGFuY2UoKTtcbiAgICBjb25zdCBlbmdpbmVVaWQgPSBlbmdpbmUub2JqZWN0VUlEO1xuXG4gICAgLy8gU3RyYXRlZ3lcbiAgICBpZiAocHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICBjb25zdCBtb2R1bGVOYW1lID0gJ3dlYmdwdSc7XG4gICAgICBjb25zdCB3ZWJncHVNb2R1bGUgPSBtb2R1bGVNYW5hZ2VyLmdldE1vZHVsZShtb2R1bGVOYW1lKSEgYXMgUm5XZWJHcHU7XG4gICAgICBpZiAoIU1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2NnQXBpUmVuZGVyaW5nU3RyYXRlZ3lNYXAuaGFzKGVuZ2luZVVpZCkpIHtcbiAgICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fY2dBcGlSZW5kZXJpbmdTdHJhdGVneU1hcC5zZXQoZW5naW5lVWlkLCB3ZWJncHVNb2R1bGUuV2ViR3B1U3RyYXRlZ3lCYXNpYy5pbml0KGVuZ2luZSkpO1xuICAgICAgfVxuICAgICAgKE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2NnQXBpUmVuZGVyaW5nU3RyYXRlZ3lNYXAuZ2V0KGVuZ2luZVVpZCkgYXMgV2ViR3B1U3RyYXRlZ3lCYXNpYykuY29tbW9uXyRsb2FkKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG1vZHVsZU5hbWUgPSAnd2ViZ2wnO1xuICAgICAgY29uc3Qgd2ViZ2xNb2R1bGUgPSBtb2R1bGVNYW5hZ2VyLmdldE1vZHVsZShtb2R1bGVOYW1lKSEgYXMgUm5XZWJHTDtcbiAgICAgIGlmICghTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fY2dBcGlSZW5kZXJpbmdTdHJhdGVneU1hcC5oYXMoZW5naW5lVWlkKSkge1xuICAgICAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19jZ0FwaVJlbmRlcmluZ1N0cmF0ZWd5TWFwLnNldChcbiAgICAgICAgICBlbmdpbmVVaWQsXG4gICAgICAgICAgd2ViZ2xNb2R1bGUuZ2V0UmVuZGVyaW5nU3RyYXRlZ3koZW5naW5lLCBwcm9jZXNzQXBwcm9hY2gpXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICAoTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fY2dBcGlSZW5kZXJpbmdTdHJhdGVneU1hcC5nZXQoZW5naW5lVWlkKSBhcyBXZWJHTFN0cmF0ZWd5KS5jb21tb25fJGxvYWQoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYW5kIGluaXRpYWxpemVzIHRoaXMgbWVzaCByZW5kZXJlciBjb21wb25lbnQuXG4gICAqIFNldHMgdXAgdGhlIGNvbXBvbmVudCBmb3IgcmVuZGVyaW5nIGJ5IGxvYWRpbmcgdGhlIGFzc29jaWF0ZWQgbWVzaC5cbiAgICovXG4gICRsb2FkKCkge1xuICAgIGNvbnN0IHN0cmF0ZWd5ID0gTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fY2dBcGlSZW5kZXJpbmdTdHJhdGVneU1hcC5nZXQodGhpcy5fX2VuZ2luZS5vYmplY3RVSUQpO1xuICAgIGNvbnN0IHJlYWR5ID0gc3RyYXRlZ3khLiRsb2FkKHRoaXMuZW50aXR5LnRyeVRvR2V0TWVzaCgpISk7XG4gICAgaWYgKHJlYWR5KSB7XG4gICAgICB0aGlzLm1vdmVTdGFnZVRvKFByb2Nlc3NTdGFnZS5Vbmtub3duKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU29ydHMgYW5kIGZpbHRlcnMgbWVzaCBjb21wb25lbnRzIGZvciByZW5kZXJpbmcgYmFzZWQgb24gY2FtZXJhIGZydXN0dW0gYW5kIG1hdGVyaWFsIHByb3BlcnRpZXMuXG4gICAqIFBlcmZvcm1zIGZydXN0dW0gY3VsbGluZyBhbmQgc29ydHMgcHJpbWl0aXZlcyBieSByZW5kZXIgb3JkZXIgYW5kIGRlcHRoLlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gcmVuZGVyUGFzcyAtIFRoZSByZW5kZXIgcGFzcyBjb250YWluaW5nIG1lc2ggY29tcG9uZW50cyBhbmQgcmVuZGVyaW5nIGNvbnRleHRcbiAgICogQHJldHVybnMgQXJyYXkgb2YgcHJpbWl0aXZlIFVJRHMgc29ydGVkIGZvciBvcHRpbWFsIHJlbmRlcmluZ1xuICAgKi9cbiAgc3RhdGljIHNvcnRfJHJlbmRlcihlbmdpbmU6IEVuZ2luZSwgcmVuZGVyUGFzczogUmVuZGVyUGFzcyk6IENvbXBvbmVudFNJRFtdIHtcbiAgICBjb25zdCB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeSA9IGVuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBjb25zdCBtdWx0aURyYXdHcm91cFZlcnNpb24gPVxuICAgICAgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkgIT0gbnVsbCA/IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmdldE11bHRpRHJhd1JlcG9zaXRvcnkoZW5naW5lKS52ZXJzaW9uIDogMDtcbiAgICBjb25zdCBzY3JhdGNoID0gTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fZ2V0U29ydFNjcmF0Y2gocmVuZGVyUGFzcyk7XG4gICAgY29uc3QgaXNHcHVDdWxsaW5nQWN0aXZlID0gTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9pc0dwdUN1bGxpbmdBY3RpdmUoZW5naW5lLCByZW5kZXJQYXNzKTtcbiAgICBpZiAoXG4gICAgICBUcmFuc2Zvcm1Db21wb25lbnQuZ2V0VXBkYXRlQ291bnQoZW5naW5lKSA9PT0gcmVuZGVyUGFzcy5fbGFzdFRyYW5zZm9ybUNvbXBvbmVudHNVcGRhdGVDb3VudCAmJlxuICAgICAgX2dldENhbWVyYUNvbnRyb2xsZXJVcGRhdGVDb3VudChlbmdpbmUpID09PSByZW5kZXJQYXNzLl9sYXN0Q2FtZXJhQ29udHJvbGxlckNvbXBvbmVudHNVcGRhdGVDb3VudCAmJlxuICAgICAgU2NlbmVHcmFwaENvbXBvbmVudC5nZXRVcGRhdGVDb3VudChlbmdpbmUpID09PSByZW5kZXJQYXNzLl9sYXN0U2NlbmVHcmFwaENvbXBvbmVudHNVcGRhdGVDb3VudCAmJlxuICAgICAgbXVsdGlEcmF3R3JvdXBWZXJzaW9uID09PSByZW5kZXJQYXNzLl9sYXN0TXVsdGlEcmF3R3JvdXBWZXJzaW9uICYmXG4gICAgICBpc0dwdUN1bGxpbmdBY3RpdmUgPT09IHNjcmF0Y2guaXNHcHVDdWxsaW5nQWN0aXZlICYmXG4gICAgICBlbmdpbmUuY29uZmlnLmlzQ29tcHV0ZVNraW5uaW5nRW5hYmxlZCA9PT0gc2NyYXRjaC5pc0NvbXB1dGVTa2lubmluZ0VuYWJsZWRcbiAgICApIHtcbiAgICAgIHJldHVybiByZW5kZXJQYXNzLl9sYXN0UHJpbWl0aXZlVWlkcztcbiAgICB9XG4gICAgc2NyYXRjaC5pc0dwdUN1bGxpbmdBY3RpdmUgPSBpc0dwdUN1bGxpbmdBY3RpdmU7XG4gICAgLy8gTWVzaC5faXNHcHVDdWxsYWJsZSBvZiB0aGUgZGVmb3JtZWQgbWVzaGVzIGRlcGVuZHMgb24gaXQuXG4gICAgc2NyYXRjaC5pc0NvbXB1dGVTa2lubmluZ0VuYWJsZWQgPSBlbmdpbmUuY29uZmlnLmlzQ29tcHV0ZVNraW5uaW5nRW5hYmxlZDtcblxuICAgIC8vIGdldCBDYW1lcmFDb21wb25lbnRcbiAgICBsZXQgY2FtZXJhQ29tcG9uZW50ID0gcmVuZGVyUGFzcy5jYW1lcmFDb21wb25lbnQ7XG4gICAgLy8gSWYgdGhlIHJlbmRlclBhc3MgZG9lc24ndCBoYXZlIGEgY2FtZXJhQ29tcG9uZW50LCB0aGVuIHdlIGdldCBpdCBvZiB0aGUgbWFpbiBjYW1lcmFcbiAgICBpZiAoY2FtZXJhQ29tcG9uZW50ID09IG51bGwpIHtcbiAgICAgIGNhbWVyYUNvbXBvbmVudCA9IGVuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudChcbiAgICAgICAgQ2FtZXJhQ29tcG9uZW50LFxuICAgICAgICBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudChlbmdpbmUpXG4gICAgICApIGFzIENhbWVyYUNvbXBvbmVudDtcbiAgICB9XG4gICAgaWYgKGNhbWVyYUNvbXBvbmVudCA9PSBudWxsKSB7XG4gICAgICBjb25zdCBjYW1lcmFDb21wb25lbnRzID0gZW5naW5lLmNvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50c1dpdGhUeXBlKENhbWVyYUNvbXBvbmVudCkgYXMgQ2FtZXJhQ29tcG9uZW50W107XG4gICAgICBjYW1lcmFDb21wb25lbnQgPSBjYW1lcmFDb21wb25lbnRzLmZpbmQoYyA9PiBjPy5faXNBbGl2ZSkhO1xuICAgICAgQ2FtZXJhQ29tcG9uZW50LnNldEN1cnJlbnQoZW5naW5lLCBjYW1lcmFDb21wb25lbnQuY29tcG9uZW50U0lEKTtcbiAgICB9XG4gICAgaWYgKHJlbmRlclBhc3MuaXNWclJlbmRlcmluZykge1xuICAgICAgY29uc3Qgd2VieHJTeXN0ZW0gPSBlbmdpbmUuX3dlYlhSU3lzdGVtSWZFbmFibGVkO1xuICAgICAgaWYgKHdlYnhyU3lzdGVtPy5pc1dlYlhSTW9kZSkge1xuICAgICAgICBjYW1lcmFDb21wb25lbnQgPSB3ZWJ4clN5c3RlbS5fZ2V0Q2FtZXJhQ29tcG9uZW50QXQoMCkgYXMgQ2FtZXJhQ29tcG9uZW50O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZydXN0dW1DdWxsaW5nICh3cml0ZXMgaW50byB0aGUgcmV1c2FibGUgcGVyLXJlbmRlci1wYXNzIHNjcmF0Y2ggYXJyYXkpXG4gICAgY29uc3QgcHJpbWl0aXZlcyA9IE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2N1bGxpbmdXaXRoVmlld0ZydXN0dW0oXG4gICAgICBjYW1lcmFDb21wb25lbnQsXG4gICAgICByZW5kZXJQYXNzLl9vcHRpbWl6ZWRNZXNoQ29tcG9uZW50cyxcbiAgICAgIHNjcmF0Y2gucHJpbWl0aXZlcyxcbiAgICAgIHNjcmF0Y2gsXG4gICAgICBpc0dwdUN1bGxpbmdBY3RpdmVcbiAgICApO1xuXG4gICAgLy8gQWZ0ZXIgRnJ1c3R1bSBDdWxsaW5nLCByZW1vdmUgZHVwbGljYXRlZCBQcmltaXRpdmVzXG4gICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fcmVtb3ZlRHVwbGljYXRlZFByaW1pdGl2ZXMocHJpbWl0aXZlcywgc2NyYXRjaCk7XG5cbiAgICAvLyBTb3J0IGJ5IHNvcnRrZXlcbiAgICBpZiAocHJpbWl0aXZlcy5sZW5ndGggPiAxKSB7XG4gICAgICBwcmltaXRpdmVzLnNvcnQoTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fY29tcGFyZVByaW1pdGl2ZXMpO1xuICAgIH1cblxuICAgIGxldCBfbGFzdE9wYXF1ZUluZGV4ID0gcHJpbWl0aXZlcy5sZW5ndGggLSAxO1xuICAgIGxldCBfbGFzdFRyYW5zbHVjZW50SW5kZXggPSBwcmltaXRpdmVzLmxlbmd0aCAtIDE7XG4gICAgbGV0IF9sYXN0QmxlbmRXaXRoWldyaXRlSW5kZXggPSBwcmltaXRpdmVzLmxlbmd0aCAtIDE7XG4gICAgbGV0IF9sYXN0QmxlbmRXaXRob3V0WldyaXRlSW5kZXggPSBwcmltaXRpdmVzLmxlbmd0aCAtIDE7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByaW1pdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHByaW1pdGl2ZSA9IHByaW1pdGl2ZXNbaV07XG4gICAgICBjb25zdCB0cmFuc2x1Y2VuY3kgPSBpc1RyYW5zbHVjZW50KHByaW1pdGl2ZSk7XG4gICAgICBpZiAodHJhbnNsdWNlbmN5KSB7XG4gICAgICAgIF9sYXN0T3BhcXVlSW5kZXggPSBpIC0gMTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjb25zdCBibGVuZFdpdGhaV3JpdGUgPSBpc0JsZW5kV2l0aFpXcml0ZShwcmltaXRpdmUpO1xuICAgICAgaWYgKGJsZW5kV2l0aFpXcml0ZSkge1xuICAgICAgICBfbGFzdE9wYXF1ZUluZGV4ID0gaSAtIDE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY29uc3QgYmxlbmRXaXRob3V0WldyaXRlID0gaXNCbGVuZFdpdGhvdXRaV3JpdGUocHJpbWl0aXZlKTtcbiAgICAgIGlmIChibGVuZFdpdGhvdXRaV3JpdGUpIHtcbiAgICAgICAgX2xhc3RPcGFxdWVJbmRleCA9IGkgLSAxO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gX2xhc3RPcGFxdWVJbmRleCArIDE7IGkgPCBwcmltaXRpdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBwcmltaXRpdmUgPSBwcmltaXRpdmVzW2ldO1xuICAgICAgY29uc3QgYmxlbmRXaXRoWldyaXRlID0gaXNCbGVuZFdpdGhaV3JpdGUocHJpbWl0aXZlKTtcbiAgICAgIGlmIChibGVuZFdpdGhaV3JpdGUpIHtcbiAgICAgICAgX2xhc3RUcmFuc2x1Y2VudEluZGV4ID0gaSAtIDE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY29uc3QgYmxlbmRXaXRob3V0WldyaXRlID0gaXNCbGVuZFdpdGhvdXRaV3JpdGUocHJpbWl0aXZlKTtcbiAgICAgIGlmIChibGVuZFdpdGhvdXRaV3JpdGUpIHtcbiAgICAgICAgX2xhc3RUcmFuc2x1Y2VudEluZGV4ID0gaSAtIDE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSBfbGFzdFRyYW5zbHVjZW50SW5kZXggKyAxOyBpIDwgcHJpbWl0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJpbWl0aXZlID0gcHJpbWl0aXZlc1tpXTtcbiAgICAgIGNvbnN0IGJsZW5kV2l0aG91dFpXcml0ZSA9IGlzQmxlbmRXaXRob3V0WldyaXRlKHByaW1pdGl2ZSk7XG4gICAgICBpZiAoYmxlbmRXaXRob3V0WldyaXRlKSB7XG4gICAgICAgIF9sYXN0QmxlbmRXaXRoWldyaXRlSW5kZXggPSBpIC0gMTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmVvcmRlciB0aGUgb3BhcXVlIHJhbmdlIGJ5IGVmZmVjdGl2ZSBtYXRlcmlhbCAoYW5kIG11bHRpLWRyYXcgZ3JvdXApIHNvIHRoYXRcbiAgICAvLyBjb25zZWN1dGl2ZSBkcmF3cyBzaGFyZSB0aGVpciBHUFUgc3RhdGUgYW5kIGNhbiBiZSBtZXJnZWQgYnkgV0VCR0xfbXVsdGlfZHJhdy5cbiAgICAvLyBPcGFxdWUgZHJhd3MgYXJlIGRlcHRoIHRlc3RlZCwgc28gdGhpcyByZW9yZGVyIGlzIHNhZmUuIFRyYW5zbHVjZW50L2JsZW5kIGJ1Y2tldHNcbiAgICAvLyBrZWVwIHRoZWlyIGRpc3RhbmNlIG9yZGVyLlxuICAgIGlmIChcbiAgICAgIF9sYXN0T3BhcXVlSW5kZXggPiAwICYmXG4gICAgICBlbmdpbmUuY29uZmlnLmlzTXVsdGlEcmF3RW5hYmxlZCAmJlxuICAgICAgUHJvY2Vzc0FwcHJvYWNoLmlzV2ViR0wyQXBwcm9hY2goZW5naW5lLmVuZ2luZVN0YXRlLmN1cnJlbnRQcm9jZXNzQXBwcm9hY2gpXG4gICAgKSB7XG4gICAgICBjb25zdCBvcGFxdWVDb3VudCA9IF9sYXN0T3BhcXVlSW5kZXggKyAxO1xuICAgICAgY29uc3Qga2V5ZWQgPSBzY3JhdGNoLmtleWVkUHJpbWl0aXZlcztcbiAgICAgIGlmIChrZXllZC5sZW5ndGggPCBvcGFxdWVDb3VudCkge1xuICAgICAgICBmb3IgKGxldCBpID0ga2V5ZWQubGVuZ3RoOyBpIDwgb3BhcXVlQ291bnQ7IGkrKykge1xuICAgICAgICAgIGtleWVkLnB1c2goeyBwcmltaXRpdmU6IG51bGwsIGtleUlkOiAwLCBpbmRleDogMCB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAga2V5ZWQubGVuZ3RoID0gb3BhcXVlQ291bnQ7XG4gICAgICB9XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9wYXF1ZUNvdW50OyBpKyspIHtcbiAgICAgICAgY29uc3QgcHJpbWl0aXZlID0gcHJpbWl0aXZlc1tpXTtcbiAgICAgICAgY29uc3QgbWF0ZXJpYWwgPSByZW5kZXJQYXNzLmdldEFwcHJvcHJpYXRlTWF0ZXJpYWwocHJpbWl0aXZlKTtcbiAgICAgICAgY29uc3QgZW50cnkgPSBrZXllZFtpXTtcbiAgICAgICAgZW50cnkucHJpbWl0aXZlID0gcHJpbWl0aXZlO1xuICAgICAgICBlbnRyeS5pbmRleCA9IGk7XG4gICAgICAgIGVudHJ5LmtleUlkID1cbiAgICAgICAgICBnZXRNdWx0aURyYXdTdGF0ZUtleUlkKHByaW1pdGl2ZSwgbWF0ZXJpYWwsIGdldFByaW1pdGl2ZU1lc2hSZW5kZXJlckZpbmdlclByaW50SWQocHJpbWl0aXZlKSkgPz9cbiAgICAgICAgICAtKG1hdGVyaWFsLm1hdGVyaWFsVUlEICsgMSk7XG4gICAgICB9XG4gICAgICBrZXllZC5zb3J0KChhLCBiKSA9PiBhLmtleUlkIC0gYi5rZXlJZCB8fCBhLmluZGV4IC0gYi5pbmRleCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9wYXF1ZUNvdW50OyBpKyspIHtcbiAgICAgICAgcHJpbWl0aXZlc1tpXSA9IGtleWVkW2ldLnByaW1pdGl2ZSE7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgcHJpbWl0aXZlVWlkcyA9IE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2NyZWF0ZVByaW1pdGl2ZVVpZHMocHJpbWl0aXZlcyk7XG5cbiAgICBsZXQgcmVzdWx0Q2hhbmdlZCA9IGZhbHNlO1xuICAgIGlmIChfbGFzdE9wYXF1ZUluZGV4ICE9PSByZW5kZXJQYXNzLl9sYXN0T3BhcXVlSW5kZXgpIHtcbiAgICAgIHJlbmRlclBhc3MuX2xhc3RPcGFxdWVJbmRleCA9IF9sYXN0T3BhcXVlSW5kZXg7XG4gICAgICByZXN1bHRDaGFuZ2VkIHx8PSB0cnVlO1xuICAgIH1cbiAgICBpZiAoX2xhc3RUcmFuc2x1Y2VudEluZGV4ICE9PSByZW5kZXJQYXNzLl9sYXN0VHJhbnNsdWNlbnRJbmRleCkge1xuICAgICAgcmVuZGVyUGFzcy5fbGFzdFRyYW5zbHVjZW50SW5kZXggPSBfbGFzdFRyYW5zbHVjZW50SW5kZXg7XG4gICAgICByZXN1bHRDaGFuZ2VkIHx8PSB0cnVlO1xuICAgIH1cbiAgICBpZiAoX2xhc3RCbGVuZFdpdGhaV3JpdGVJbmRleCAhPT0gcmVuZGVyUGFzcy5fbGFzdEJsZW5kV2l0aFpXcml0ZUluZGV4KSB7XG4gICAgICByZW5kZXJQYXNzLl9sYXN0QmxlbmRXaXRoWldyaXRlSW5kZXggPSBfbGFzdEJsZW5kV2l0aFpXcml0ZUluZGV4O1xuICAgICAgcmVzdWx0Q2hhbmdlZCB8fD0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKF9sYXN0QmxlbmRXaXRob3V0WldyaXRlSW5kZXggIT09IHJlbmRlclBhc3MuX2xhc3RCbGVuZFdpdGhvdXRaV3JpdGVJbmRleCkge1xuICAgICAgcmVuZGVyUGFzcy5fbGFzdEJsZW5kV2l0aG91dFpXcml0ZUluZGV4ID0gX2xhc3RCbGVuZFdpdGhvdXRaV3JpdGVJbmRleDtcbiAgICAgIHJlc3VsdENoYW5nZWQgfHw9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHByaW1pdGl2ZVVpZHMubGVuZ3RoICE9PSByZW5kZXJQYXNzLl9sYXN0UHJpbWl0aXZlVWlkcy5sZW5ndGgpIHtcbiAgICAgIHJlc3VsdENoYW5nZWQgfHw9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIENoZWNrIGlmIGEgcHJpbWl0aXZlIG9yIHRoZSBvcmRlciBvZiB0aGUgcHJpbWl0aXZlcyBoYXMgY2hhbmdlZC4gQWxsIHRoZSByYW5nZXMgYXJlIGNvbXBhcmVkOiB0aGUgY3VsbGluZ1xuICAgICAgLy8gY2FuIHJlcGxhY2UgYW4gb3BhcXVlIHByaW1pdGl2ZSB3aXRoIGFub3RoZXIgb25lIHdoaWxlIHRoZSBjb3VudHMgc3RheSB0aGUgc2FtZSwgYW5kIHRoZSBXZWJHUFUgcmVuZGVyXG4gICAgICAvLyBidW5kbGVzIG11c3QgdGhlbiBiZSByZS1yZWNvcmRlZC5cbiAgICAgIGNvbnN0IGxhc3RQcmltaXRpdmVVaWRzID0gcmVuZGVyUGFzcy5fbGFzdFByaW1pdGl2ZVVpZHM7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByaW1pdGl2ZVVpZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHByaW1pdGl2ZVVpZHNbaV0gIT09IGxhc3RQcmltaXRpdmVVaWRzW2ldKSB7XG4gICAgICAgICAgcmVzdWx0Q2hhbmdlZCB8fD0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZW5kZXJQYXNzLl9pc0NoYW5nZWRTb3J0UmVuZGVyUmVzdWx0ID0gcmVzdWx0Q2hhbmdlZDtcblxuICAgIHJlbmRlclBhc3MuX2xhc3RQcmltaXRpdmVVaWRzID0gcHJpbWl0aXZlVWlkcztcbiAgICAvLyBUaGUgc2NyYXRjaCBhcnJheSBpcyBvbmx5IHJlZmlsbGVkIGJ5IHRoZSBuZXh0IHNvcnQsIHdoaWNoIGFsc28gcmVwbGFjZXNcbiAgICAvLyBgX2xhc3RQcmltaXRpdmVVaWRzYCwgc28gdGhlIHBhaXIgc3RheXMgY29uc2lzdGVudCBmb3IgdGhlIHJlbmRlciBzdHJhdGVnaWVzLlxuICAgIHJlbmRlclBhc3MuX2xhc3RQcmltaXRpdmVzID0gcHJpbWl0aXZlcztcblxuICAgIHJlbmRlclBhc3MuX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQgPSBUcmFuc2Zvcm1Db21wb25lbnQuZ2V0VXBkYXRlQ291bnQoZW5naW5lKTtcbiAgICByZW5kZXJQYXNzLl9sYXN0Q2FtZXJhQ29udHJvbGxlckNvbXBvbmVudHNVcGRhdGVDb3VudCA9IF9nZXRDYW1lcmFDb250cm9sbGVyVXBkYXRlQ291bnQoZW5naW5lKTtcbiAgICByZW5kZXJQYXNzLl9sYXN0U2NlbmVHcmFwaENvbXBvbmVudHNVcGRhdGVDb3VudCA9IFNjZW5lR3JhcGhDb21wb25lbnQuZ2V0VXBkYXRlQ291bnQoZW5naW5lKTtcbiAgICByZW5kZXJQYXNzLl9sYXN0TXVsdGlEcmF3R3JvdXBWZXJzaW9uID0gbXVsdGlEcmF3R3JvdXBWZXJzaW9uO1xuICAgIGlmIChyZXN1bHRDaGFuZ2VkKSB7XG4gICAgICByZW5kZXJQYXNzLl9yZW5kZXJlZFNvbWV0aGluZ0JlZm9yZSA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByaW1pdGl2ZVVpZHM7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgZnJ1c3R1bSBjdWxsaW5nIG9uIG1lc2ggY29tcG9uZW50cyB1c2luZyB0aGUgY2FtZXJhJ3MgdmlldyBmcnVzdHVtLlxuICAgKiBGaWx0ZXJzIG91dCBtZXNoIGNvbXBvbmVudHMgdGhhdCBhcmUgbm90IHZpc2libGUgZnJvbSB0aGUgY2FtZXJhJ3MgcGVyc3BlY3RpdmUuXG4gICAqIEBwYXJhbSBjYW1lcmFDb21wb25lbnQgLSBUaGUgY2FtZXJhIGNvbXBvbmVudCB1c2VkIGZvciBmcnVzdHVtIGN1bGxpbmdcbiAgICogQHBhcmFtIG1lc2hDb21wb25lbnRzIC0gQXJyYXkgb2YgbWVzaCBjb21wb25lbnRzIHRvIGJlIGN1bGxlZFxuICAgKiBAcGFyYW0gb3V0UHJpbWl0aXZlcyAtIFJldXNhYmxlIG91dHB1dCBhcnJheS4gSXQgaXMgY2xlYXJlZCBhbmQgZmlsbGVkIHdpdGggdGhlIHByaW1pdGl2ZXMgdGhhdCBwYXNzZWQgY3VsbGluZ1xuICAgKiBAcGFyYW0gc2NyYXRjaCAtIFRoZSBzY3JhdGNoIG9mIHRoZSByZW5kZXIgcGFzcy4gVGhlIGVudGl0aWVzIGN1bGxlZCBpbiB0aGlzIHBhc3MgYXJlIHN0YW1wZWQgaW50byBpdFxuICAgKiAgICAgICAgICAgICAgICAgIHNvIHRoYXQgaW5zdGFuY2VkIGRyYXcgY2FsbHMgY2FuIHNraXAgdGhlaXIgaW5zdGFuY2VzXG4gICAqIEBwYXJhbSBpc0dwdUN1bGxpbmdBY3RpdmUgLSBXaGV0aGVyIHRoZSByZW5kZXIgcGFzcyBjdWxscyBvbiB0aGUgR1BVIChzZWUgYF9pc0dwdUN1bGxpbmdBY3RpdmVgKS4gVGhlIHByaW1pdGl2ZXNcbiAgICogICAgICAgICAgICAgICAgICBvZiB0aGUgbWVzaGVzIGN1bGxlZCBvbiB0aGUgR1BVIGFyZSBrZXB0IHJlZ2FyZGxlc3Mgb2YgdGhlaXIgdmlzaWJpbGl0eSwgc28gdGhhdCB0aGUgcmVuZGVyXG4gICAqICAgICAgICAgICAgICAgICAgbGlzdCAoYW5kIHRoZSBXZWJHUFUgcmVuZGVyIGJ1bmRsZXMpIGRvZXMgbm90IGNoYW5nZSB3aGVuIHRoZSBjYW1lcmEgbW92ZXNcbiAgICogQHJldHVybnMgVGhlIGBvdXRQcmltaXRpdmVzYCBhcnJheSAoc2FtZSByZWZlcmVuY2UpIGZvciBjb252ZW5pZW5jZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19jdWxsaW5nV2l0aFZpZXdGcnVzdHVtKFxuICAgIGNhbWVyYUNvbXBvbmVudDogQ2FtZXJhQ29tcG9uZW50LFxuICAgIG1lc2hDb21wb25lbnRzOiBNZXNoQ29tcG9uZW50W10sXG4gICAgb3V0UHJpbWl0aXZlczogUHJpbWl0aXZlW10sXG4gICAgc2NyYXRjaDogTWVzaFJlbmRlcmVyU29ydFNjcmF0Y2gsXG4gICAgaXNHcHVDdWxsaW5nQWN0aXZlOiBib29sZWFuXG4gICk6IFByaW1pdGl2ZVtdIHtcbiAgICBvdXRQcmltaXRpdmVzLmxlbmd0aCA9IDA7XG5cbiAgICBsZXQgY3VsbFRpY2sgPSBzY3JhdGNoLmN1bGxUaWNrICsgMTtcbiAgICBpZiAoY3VsbFRpY2sgPT09IDB4ZmZmZmZmZmYpIHtcbiAgICAgIC8vIFdyYXAgYXJvdW5kOiBjbGVhciB0aGUgc3RhbXBzIHNvIHRoYXQgb2xkIHZhbHVlcyBjYW5ub3QgYmUgbWlzdGFrZW4gZm9yIHRoZSBjdXJyZW50IHRpY2suXG4gICAgICBzY3JhdGNoLmN1bGxlZEVudGl0eVN0YW1wLmZpbGwoMCk7XG4gICAgICBzY3JhdGNoLmhhbmRsZWRFbnRpdHlTdGFtcC5maWxsKDApO1xuICAgICAgc2NyYXRjaC5tZXNoQ3VsbFRpY2sgPSBuZXcgV2Vha01hcCgpO1xuICAgICAgc2NyYXRjaC5tZXNoQXBwZW5kVGljayA9IG5ldyBXZWFrTWFwKCk7XG4gICAgICBjdWxsVGljayA9IDE7XG4gICAgfVxuICAgIHNjcmF0Y2guY3VsbFRpY2sgPSBjdWxsVGljaztcbiAgICBzY3JhdGNoLmN1bGxlZEVudGl0eUNvdW50ID0gMDtcbiAgICBjb25zdCBjdWxsZWRJbnN0YW5jZWRNZXNoQ29tcG9uZW50cyA9IHNjcmF0Y2guY3VsbGVkSW5zdGFuY2VkTWVzaENvbXBvbmVudHM7XG4gICAgY3VsbGVkSW5zdGFuY2VkTWVzaENvbXBvbmVudHMubGVuZ3RoID0gMDtcbiAgICBzY3JhdGNoLmN1bGxpbmdJZCA9ICsrTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fY3VsbGluZ0lkQ291bnRlcjtcblxuICAgIC8vIEEgc2luZ2xlIHBhc3Mgb3ZlciB0aGUgbWVzaCBjb21wb25lbnRzOiBjdWxsLCB1cGRhdGUgdmlzaWJpbGl0eSBmbGFncyBhbmRcbiAgICAvLyBjb2xsZWN0IHByaW1pdGl2ZXMuIFRoZSBwcmV2aW91cyBpbXBsZW1lbnRhdGlvbiBhbGxvY2F0ZWQgYSBmaWx0ZXJlZCBhcnJheVxuICAgIC8vIGFuZCBhbiBpbm5lciBjbG9zdXJlIHBlciBjYWxsLlxuICAgIGNvbnN0IGlzRnJ1c3R1bUN1bGxpbmdFbmFibGVkID0gY2FtZXJhQ29tcG9uZW50ICE9IG51bGwgJiYgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9pc0ZydXN0dW1DdWxsaW5nRW5hYmxlZDtcbiAgICBsZXQgZnJ1c3R1bTogQ2FtZXJhQ29tcG9uZW50WydmcnVzdHVtJ10gfCB1bmRlZmluZWQ7XG4gICAgaWYgKGlzRnJ1c3R1bUN1bGxpbmdFbmFibGVkKSB7XG4gICAgICBjYW1lcmFDb21wb25lbnQudXBkYXRlRnJ1c3R1bSgpO1xuICAgICAgZnJ1c3R1bSA9IGNhbWVyYUNvbXBvbmVudC5mcnVzdHVtO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWVzaENvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG1lc2hDb21wb25lbnQgPSBtZXNoQ29tcG9uZW50c1tpXTtcbiAgICAgIGlmICghbWVzaENvbXBvbmVudC5faXNBbGl2ZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8vIEEgcmVuZGVyIHBhc3Mga2VlcHMgaXRzIG1lc2ggY29tcG9uZW50cyB1bnRpbCBpdCBpcyByZWJ1aWx0LCBzbyB0aGUgZW50aXR5IG9mIGEgY29tcG9uZW50IGNhblxuICAgICAgLy8gYWxyZWFkeSBiZSBnb25lIGZyb20gdGhlIEVudGl0eVJlcG9zaXRvcnkgd2hlbiBhIGdpem1vIGVudGl0eSBpcyBkZWxldGVkLlxuICAgICAgY29uc3QgZW50aXR5ID0gbWVzaENvbXBvbmVudC5lbnRpdHk7XG4gICAgICBpZiAoZW50aXR5ID09IG51bGwpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBzY2VuZUdyYXBoID0gZW50aXR5LmdldFNjZW5lR3JhcGgoKTtcbiAgICAgIHNjcmF0Y2guaGFuZGxlZEVudGl0eVN0YW1wID0gTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fc3RhbXBFbnRpdHkoXG4gICAgICAgIHNjcmF0Y2guaGFuZGxlZEVudGl0eVN0YW1wLFxuICAgICAgICBtZXNoQ29tcG9uZW50LmVudGl0eVVJRCxcbiAgICAgICAgY3VsbFRpY2tcbiAgICAgICk7XG4gICAgICBpZiAoaXNHcHVDdWxsaW5nQWN0aXZlICYmIG1lc2hDb21wb25lbnQubWVzaD8uX2lzR3B1Q3VsbGFibGUgPT09IHRydWUpIHtcbiAgICAgICAgLy8gQ3VsbGVkIHBlciBpbnN0YW5jZSBvbiB0aGUgR1BVLCBpbmNsdWRpbmcgdGhlIHZpc2liaWxpdHkgZmxhZyAoV2ViR3B1R3B1Q3VsbGluZykuXG4gICAgICAgIHNjZW5lR3JhcGguX2lzQ3VsbGVkID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IHNrZWxldGFsID0gbWVzaENvbXBvbmVudC5lbnRpdHkudHJ5VG9HZXRTa2VsZXRhbCgpO1xuICAgICAgICBpZiAoc2tlbGV0YWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIC8vIFRoZSBqb2ludHMgb2YgYSBza2VsZXRvbiBvdXRzaWRlIG9mIHRoZSB2aWV3IGFyZSBub3QgdXBkYXRlZCAoU2tlbGV0YWxDb21wb25lbnQuJGxvZ2ljKS4gVGhpcyBrZWVwcyB0aGVcbiAgICAgICAgICAvLyBhcHByb3hpbWF0ZSB0ZXN0IG9mIHRoZSBDUFUgY3VsbGluZyBmb3IgaXQ7IHRoZSBHUFUgY3VsbGluZyBkZWNpZGVzIGZyb20gdGhlIGRlZm9ybWVkIGJvdW5kaW5nIGJveCB3aGV0aGVyXG4gICAgICAgICAgLy8gdGhlIG1lc2ggaXMgZHJhd24uXG4gICAgICAgICAgbGV0IHZpc2libGUgPSBzY2VuZUdyYXBoLmlzVmlzaWJsZTtcbiAgICAgICAgICBpZiAodmlzaWJsZSAmJiBmcnVzdHVtICE9IG51bGwgJiYgbWVzaENvbXBvbmVudC5lbnRpdHkuZ2V0VGFnVmFsdWUoJ3R5cGUnKSAhPT0gJ2JhY2tncm91bmQtYXNzZXRzJykge1xuICAgICAgICAgICAgdmlzaWJsZSA9IGZydXN0dW0uY3VsbGluZyhtZXNoQ29tcG9uZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc2tlbGV0YWwuX2lzQ3VsbGVkID0gIXZpc2libGU7XG4gICAgICAgIH1cbiAgICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fYXBwZW5kUHJpbWl0aXZlc09mTWVzaENvbXBvbmVudChtZXNoQ29tcG9uZW50LCBjYW1lcmFDb21wb25lbnQsIG91dFByaW1pdGl2ZXMpO1xuICAgICAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19tYXJrTWVzaEFwcGVuZGVkKG1lc2hDb21wb25lbnQsIHNjcmF0Y2gsIGN1bGxUaWNrKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoIXNjZW5lR3JhcGguaXNWaXNpYmxlKSB7XG4gICAgICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX3N0YW1wQ3VsbGVkRW50aXR5KHNjcmF0Y2gsIG1lc2hDb21wb25lbnQuZW50aXR5VUlELCBjdWxsVGljayk7XG4gICAgICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2RlZmVyQ3VsbGVkSW5zdGFuY2VkTWVzaChtZXNoQ29tcG9uZW50LCBzY3JhdGNoKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChmcnVzdHVtICE9IG51bGwpIHtcbiAgICAgICAgY29uc3QgaXNCYWNrZ3JvdW5kQXNzZXQgPSBtZXNoQ29tcG9uZW50LmVudGl0eS5nZXRUYWdWYWx1ZSgndHlwZScpID09PSAnYmFja2dyb3VuZC1hc3NldHMnO1xuICAgICAgICBjb25zdCB2aXNpYmxlID0gaXNCYWNrZ3JvdW5kQXNzZXQgPyB0cnVlIDogZnJ1c3R1bS5jdWxsaW5nKG1lc2hDb21wb25lbnQpO1xuICAgICAgICBzY2VuZUdyYXBoLl9pc0N1bGxlZCA9ICF2aXNpYmxlO1xuICAgICAgICBjb25zdCBza2VsZXRhbCA9IG1lc2hDb21wb25lbnQuZW50aXR5LnRyeVRvR2V0U2tlbGV0YWwoKTtcbiAgICAgICAgaWYgKHNrZWxldGFsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBza2VsZXRhbC5faXNDdWxsZWQgPSAhdmlzaWJsZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXZpc2libGUpIHtcbiAgICAgICAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19zdGFtcEN1bGxlZEVudGl0eShzY3JhdGNoLCBtZXNoQ29tcG9uZW50LmVudGl0eVVJRCwgY3VsbFRpY2spO1xuICAgICAgICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2RlZmVyQ3VsbGVkSW5zdGFuY2VkTWVzaChtZXNoQ29tcG9uZW50LCBzY3JhdGNoKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19hcHBlbmRQcmltaXRpdmVzT2ZNZXNoQ29tcG9uZW50KG1lc2hDb21wb25lbnQsIGNhbWVyYUNvbXBvbmVudCwgb3V0UHJpbWl0aXZlcyk7XG4gICAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19tYXJrTWVzaEFwcGVuZGVkKG1lc2hDb21wb25lbnQsIHNjcmF0Y2gsIGN1bGxUaWNrKTtcbiAgICB9XG5cbiAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19jdWxsU2libGluZ0luc3RhbmNlcyhtZXNoQ29tcG9uZW50cywgZnJ1c3R1bSwgc2NyYXRjaCwgY3VsbFRpY2ssIGlzR3B1Q3VsbGluZ0FjdGl2ZSk7XG4gICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fYXBwZW5kUHJpbWl0aXZlc09mQ3VsbGVkSW5zdGFuY2VkTWVzaGVzKGNhbWVyYUNvbXBvbmVudCwgb3V0UHJpbWl0aXZlcywgc2NyYXRjaCwgY3VsbFRpY2spO1xuXG4gICAgcmV0dXJuIG91dFByaW1pdGl2ZXM7XG4gIH1cblxuICAvKipcbiAgICogQ3VsbHMgdGhlIGluc3RhbmNlcyB0aGF0IHNoYXJlIGEgbWVzaCB3aXRoIHRoZSBtZXNoIGNvbXBvbmVudHMgb2YgdGhlIHJlbmRlciBwYXNzIGJ1dCBhcmUgbm90XG4gICAqIHJlZ2lzdGVyZWQgaW4gdGhlIHJlbmRlciBwYXNzIHRoZW1zZWx2ZXMuXG4gICAqXG4gICAqIEluc3RhbmNlZCBkcmF3IGNhbGxzIHJlbmRlciBldmVyeSBlbnRpdHkgc2hhcmluZyBhIG1lc2guIEZvciBleGFtcGxlLCB0aGUgVlJNIG91dGxpbmUgcGFzcyBvbmx5IGhvbGRzXG4gICAqIHRoZSBvcmlnaW5hbCBtb2RlbCwgd2hpbGUgaXRzIHNoYWxsb3cgY29waWVzIGFyZSBkcmF3biB0aHJvdWdoIGluc3RhbmNpbmcuIFN1Y2ggc2libGluZyBpbnN0YW5jZXMgYXJlXG4gICAqIGN1bGxlZCB3aXRoIHRoZSBjYW1lcmEgb2YgdGhpcyByZW5kZXIgcGFzcyBhcyB3ZWxsLCBvbmNlIHBlciBtZXNoLiBUaGVpciB2aXNpYmlsaXR5IGZsYWdzIGFyZSBsZWZ0XG4gICAqIHVudG91Y2hlZCBiZWNhdXNlIHRoZXkgYmVsb25nIHRvIHRoZSByZW5kZXIgcGFzc2VzIHRoZSBlbnRpdGllcyBhcmUgcmVnaXN0ZXJlZCBpbi5cbiAgICpcbiAgICogVGhlIG1lc2hlcyBjdWxsZWQgb24gdGhlIEdQVSAoYGlzR3B1Q3VsbGluZ0FjdGl2ZWAgYW5kIGBNZXNoLl9pc0dwdUN1bGxhYmxlYCkgYXJlIHNraXBwZWQ6IHRoZWlyIGluc3RhbmNlcyxcbiAgICogc2libGluZ3MgaW5jbHVkZWQsIGFyZSBjdWxsZWQgcGVyIGluc3RhbmNlIGJ5IHRoZSBjdWxsaW5nIGNvbXB1dGUgcGFzcywgc28gdGVzdGluZyB0aGVtIGhlcmUgd291bGQgb25seSBjb3N0XG4gICAqIENQVSB0aW1lLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19jdWxsU2libGluZ0luc3RhbmNlcyhcbiAgICBtZXNoQ29tcG9uZW50czogTWVzaENvbXBvbmVudFtdLFxuICAgIGZydXN0dW06IENhbWVyYUNvbXBvbmVudFsnZnJ1c3R1bSddIHwgdW5kZWZpbmVkLFxuICAgIHNjcmF0Y2g6IE1lc2hSZW5kZXJlclNvcnRTY3JhdGNoLFxuICAgIGN1bGxUaWNrOiBudW1iZXIsXG4gICAgaXNHcHVDdWxsaW5nQWN0aXZlOiBib29sZWFuXG4gICkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWVzaENvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG1lc2hDb21wb25lbnQgPSBtZXNoQ29tcG9uZW50c1tpXTtcbiAgICAgIGlmICghbWVzaENvbXBvbmVudC5faXNBbGl2ZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG1lc2ggPSBtZXNoQ29tcG9uZW50Lm1lc2g7XG4gICAgICBpZiAobWVzaCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKGlzR3B1Q3VsbGluZ0FjdGl2ZSAmJiBtZXNoLl9pc0dwdUN1bGxhYmxlKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3Qgc2libGluZ3MgPSBtZXNoLm1lc2hFbnRpdGllc0lubmVyO1xuICAgICAgaWYgKHNpYmxpbmdzLmxlbmd0aCA8PSAxIHx8IHNjcmF0Y2gubWVzaEN1bGxUaWNrLmdldChtZXNoKSA9PT0gY3VsbFRpY2spIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBzY3JhdGNoLm1lc2hDdWxsVGljay5zZXQobWVzaCwgY3VsbFRpY2spO1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHNpYmxpbmdzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNvbnN0IHNpYmxpbmcgPSBzaWJsaW5nc1tqXTtcbiAgICAgICAgY29uc3QgZW50aXR5VUlEID0gc2libGluZy5lbnRpdHlVSUQ7XG4gICAgICAgIGlmIChlbnRpdHlVSUQgPCBzY3JhdGNoLmhhbmRsZWRFbnRpdHlTdGFtcC5sZW5ndGggJiYgc2NyYXRjaC5oYW5kbGVkRW50aXR5U3RhbXBbZW50aXR5VUlEXSA9PT0gY3VsbFRpY2spIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdmlzaWJsZSA9IHNpYmxpbmcuZ2V0U2NlbmVHcmFwaCgpLmlzVmlzaWJsZTtcbiAgICAgICAgaWYgKHZpc2libGUgJiYgZnJ1c3R1bSAhPSBudWxsICYmIHNpYmxpbmcuZ2V0VGFnVmFsdWUoJ3R5cGUnKSAhPT0gJ2JhY2tncm91bmQtYXNzZXRzJykge1xuICAgICAgICAgIHZpc2libGUgPSBmcnVzdHVtLmN1bGxpbmcoc2libGluZy5nZXRNZXNoKCkpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdmlzaWJsZSkge1xuICAgICAgICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX3N0YW1wQ3VsbGVkRW50aXR5KHNjcmF0Y2gsIGVudGl0eVVJRCwgY3VsbFRpY2spO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbWVtYmVycyBhIGN1bGxlZCBtZXNoIGNvbXBvbmVudCB3aG9zZSBtZXNoIGlzIHNoYXJlZCBieSBvdGhlciBpbnN0YW5jZXM6IGFuIGluc3RhbmNlZCBkcmF3IGNhbGwgcmVuZGVyc1xuICAgKiBldmVyeSBpbnN0YW5jZSBvZiB0aGUgbWVzaCwgc28gdGhlIG1lc2ggbXVzdCBzdGlsbCBiZSBkcmF3biB3aGVuIGFub3RoZXIgaW5zdGFuY2UgaXMgdmlzaWJsZS5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZGVmZXJDdWxsZWRJbnN0YW5jZWRNZXNoKG1lc2hDb21wb25lbnQ6IE1lc2hDb21wb25lbnQsIHNjcmF0Y2g6IE1lc2hSZW5kZXJlclNvcnRTY3JhdGNoKSB7XG4gICAgY29uc3QgbWVzaCA9IG1lc2hDb21wb25lbnQubWVzaDtcbiAgICBpZiAobWVzaCAhPT0gdW5kZWZpbmVkICYmIG1lc2gubWVzaEVudGl0aWVzSW5uZXIubGVuZ3RoID4gMSkge1xuICAgICAgc2NyYXRjaC5jdWxsZWRJbnN0YW5jZWRNZXNoQ29tcG9uZW50cy5wdXNoKG1lc2hDb21wb25lbnQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fbWFya01lc2hBcHBlbmRlZChtZXNoQ29tcG9uZW50OiBNZXNoQ29tcG9uZW50LCBzY3JhdGNoOiBNZXNoUmVuZGVyZXJTb3J0U2NyYXRjaCwgY3VsbFRpY2s6IG51bWJlcikge1xuICAgIGNvbnN0IG1lc2ggPSBtZXNoQ29tcG9uZW50Lm1lc2g7XG4gICAgaWYgKG1lc2ggIT09IHVuZGVmaW5lZCkge1xuICAgICAgc2NyYXRjaC5tZXNoQXBwZW5kVGljay5zZXQobWVzaCwgY3VsbFRpY2spO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBlbmRzIHRoZSBwcmltaXRpdmVzIG9mIHRoZSBpbnN0YW5jZWQgbWVzaGVzIHdob3NlIHJlZ2lzdGVyZWQgaW5zdGFuY2VzIHdlcmUgYWxsIGN1bGxlZCBidXQgd2hpY2ggaGF2ZVxuICAgKiBhbm90aGVyIGluc3RhbmNlIHRoYXQgd2FzIG5vdCBjdWxsZWQuXG4gICAqXG4gICAqIFRoZSBjdWxsaW5nIGlzIGRlY2lkZWQgcGVyIGVudGl0eSByZWdpc3RlcmVkIGluIHRoZSByZW5kZXIgcGFzcywgd2hpbGUgYW4gaW5zdGFuY2VkIGRyYXcgY2FsbCByZW5kZXJzIGV2ZXJ5XG4gICAqIGVudGl0eSBzaGFyaW5nIHRoZSBtZXNoIChlLmcuIGEgdGVtcGxhdGUgZW50aXR5IHJlZ2lzdGVyZWQgaW4gdGhlIHJlbmRlciBwYXNzIGFuZCBpdHMgc2hhbGxvdyBjb3BpZXMpLiBEcm9wcGluZ1xuICAgKiB0aGUgbWVzaCBiZWNhdXNlIGl0cyByZWdpc3RlcmVkIGVudGl0eSBpcyBvdXRzaWRlIG9mIHRoZSB2aWV3IHdvdWxkIGFsc28gZHJvcCBpdHMgdmlzaWJsZSBjb3BpZXMuIFRoZSBjdWxsZWRcbiAgICogZW50aXRpZXMgc3RheSBzdGFtcGVkIGluIGBjdWxsZWRFbnRpdHlTdGFtcGAsIHNvIHRoZSBwZXItaW5zdGFuY2UgY3VsbGluZyBvZiB0aGUgV2ViR0wgc3RyYXRlZ3kgZG9lcyBub3QgZHJhd1xuICAgKiB0aGVtOyB0aGUgV2ViR1BVIHN0cmF0ZWd5IHdpdGhvdXQgR1BVIGN1bGxpbmcgZHJhd3MgZXZlcnkgaW5zdGFuY2UgKHRoZSBoaWRkZW4gb25lcyBhcmUgY29sbGFwc2VkIGJ5IHRoZSB2ZXJ0ZXhcbiAgICogc2hhZGVyIGFuZCB0aGUgY3VsbGVkIG9uZXMgYXJlIG91dHNpZGUgb2YgdGhlIHZpZXcpLlxuICAgKlxuICAgKiBNdXN0IHJ1biBhZnRlciBgX19jdWxsU2libGluZ0luc3RhbmNlc2AsIHdoaWNoIHN0YW1wcyB0aGUgY3VsbGVkIGluc3RhbmNlcyB0aGF0IGFyZSBub3QgcmVnaXN0ZXJlZCBpbiB0aGUgcGFzcy5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fYXBwZW5kUHJpbWl0aXZlc09mQ3VsbGVkSW5zdGFuY2VkTWVzaGVzKFxuICAgIGNhbWVyYUNvbXBvbmVudDogQ2FtZXJhQ29tcG9uZW50LFxuICAgIG91dFByaW1pdGl2ZXM6IFByaW1pdGl2ZVtdLFxuICAgIHNjcmF0Y2g6IE1lc2hSZW5kZXJlclNvcnRTY3JhdGNoLFxuICAgIGN1bGxUaWNrOiBudW1iZXJcbiAgKSB7XG4gICAgY29uc3QgbWVzaENvbXBvbmVudHMgPSBzY3JhdGNoLmN1bGxlZEluc3RhbmNlZE1lc2hDb21wb25lbnRzO1xuICAgIGNvbnN0IGN1bGxlZEVudGl0eVN0YW1wID0gc2NyYXRjaC5jdWxsZWRFbnRpdHlTdGFtcDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1lc2hDb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBtZXNoQ29tcG9uZW50ID0gbWVzaENvbXBvbmVudHNbaV07XG4gICAgICBjb25zdCBtZXNoID0gbWVzaENvbXBvbmVudC5tZXNoO1xuICAgICAgaWYgKG1lc2ggPT09IHVuZGVmaW5lZCB8fCBzY3JhdGNoLm1lc2hBcHBlbmRUaWNrLmdldChtZXNoKSA9PT0gY3VsbFRpY2spIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvLyBEZWNpZGVkIG9uY2UgcGVyIG1lc2gsIHdoZXRoZXIgb3Igbm90IGl0IGlzIGRyYXduLlxuICAgICAgc2NyYXRjaC5tZXNoQXBwZW5kVGljay5zZXQobWVzaCwgY3VsbFRpY2spO1xuICAgICAgY29uc3QgaW5zdGFuY2VzID0gbWVzaC5tZXNoRW50aXRpZXNJbm5lcjtcbiAgICAgIGxldCBoYXNWaXNpYmxlSW5zdGFuY2UgPSBmYWxzZTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgaW5zdGFuY2VzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGVudGl0eVVJRCA9IGluc3RhbmNlc1tqXS5lbnRpdHlVSUQ7XG4gICAgICAgIGlmIChlbnRpdHlVSUQgPj0gY3VsbGVkRW50aXR5U3RhbXAubGVuZ3RoIHx8IGN1bGxlZEVudGl0eVN0YW1wW2VudGl0eVVJRF0gIT09IGN1bGxUaWNrKSB7XG4gICAgICAgICAgaGFzVmlzaWJsZUluc3RhbmNlID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGhhc1Zpc2libGVJbnN0YW5jZSkge1xuICAgICAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19hcHBlbmRQcmltaXRpdmVzT2ZNZXNoQ29tcG9uZW50KG1lc2hDb21wb25lbnQsIGNhbWVyYUNvbXBvbmVudCwgb3V0UHJpbWl0aXZlcyk7XG4gICAgICB9XG4gICAgfVxuICAgIG1lc2hDb21wb25lbnRzLmxlbmd0aCA9IDA7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX3N0YW1wQ3VsbGVkRW50aXR5KHNjcmF0Y2g6IE1lc2hSZW5kZXJlclNvcnRTY3JhdGNoLCBlbnRpdHlVSUQ6IEVudGl0eVVJRCwgY3VsbFRpY2s6IG51bWJlcikge1xuICAgIHNjcmF0Y2guY3VsbGVkRW50aXR5U3RhbXAgPSBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19zdGFtcEVudGl0eShzY3JhdGNoLmN1bGxlZEVudGl0eVN0YW1wLCBlbnRpdHlVSUQsIGN1bGxUaWNrKTtcbiAgICBzY3JhdGNoLmN1bGxlZEVudGl0eUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogV3JpdGVzIGBjdWxsVGlja2AgaW50byBgc3RhbXBbZW50aXR5VUlEXWAsIGdyb3dpbmcgdGhlIGFycmF5IHVwIHRvIHRoZSBsYXJnZXN0IEVudGl0eVVJRCBzZWVuIHNvIGZhci5cbiAgICogQHJldHVybnMgVGhlIHN0YW1wIGFycmF5LCB3aGljaCBpcyBhIG5ldyBhcnJheSB3aGVuIGl0IGhhcyBncm93blxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19zdGFtcEVudGl0eShzdGFtcDogVWludDMyQXJyYXksIGVudGl0eVVJRDogRW50aXR5VUlELCBjdWxsVGljazogbnVtYmVyKTogVWludDMyQXJyYXkge1xuICAgIGxldCByZXN1bHQgPSBzdGFtcDtcbiAgICBpZiAoZW50aXR5VUlEID49IHN0YW1wLmxlbmd0aCkge1xuICAgICAgcmVzdWx0ID0gbmV3IFVpbnQzMkFycmF5KE1hdGgubWF4KGVudGl0eVVJRCArIDEsIHN0YW1wLmxlbmd0aCAqIDIsIDY0KSk7XG4gICAgICByZXN1bHQuc2V0KHN0YW1wKTtcbiAgICB9XG4gICAgcmVzdWx0W2VudGl0eVVJRF0gPSBjdWxsVGljaztcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIG1lc2hlcyBvZiBhIHJlbmRlciBwYXNzIGFyZSBmcnVzdHVtIGN1bGxlZCBvbiB0aGUgR1BVIChXZWJHUFUsIGBDb25maWcuaXNHcHVDdWxsaW5nRW5hYmxlZGApLlxuICAgKiBUaGUgQ1BVIGN1bGxpbmcgYW5kIHRoZSBXZWJHUFUgZHJhdyByZWNvcmRpbmcgYm90aCB1c2UgdGhpcywgc28gdGhhdCBhIG1lc2ggdGhlIENQVSBrZWVwcyBmb3IgdGhlIEdQVSBpc1xuICAgKiByZWNvcmRlZCBhcyBhIGN1bGxlZCBpbmRpcmVjdCBkcmF3LiBNZXNoZXMgd2hvc2UgYE1lc2guX2lzR3B1Q3VsbGFibGVgIGlzIGZhbHNlIGtlZXAgdGhlIENQVSBjdWxsaW5nLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHN0YXRpYyBfaXNHcHVDdWxsaW5nQWN0aXZlKGVuZ2luZTogRW5naW5lLCByZW5kZXJQYXNzOiBSZW5kZXJQYXNzKTogYm9vbGVhbiB7XG4gICAgaWYgKFxuICAgICAgIWVuZ2luZS5jb25maWcuaXNHcHVDdWxsaW5nRW5hYmxlZCB8fFxuICAgICAgIU1lc2hSZW5kZXJlckNvbXBvbmVudC5faXNGcnVzdHVtQ3VsbGluZ0VuYWJsZWQgfHxcbiAgICAgICFQcm9jZXNzQXBwcm9hY2guaXNXZWJHcHVBcHByb2FjaChlbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCkgfHxcbiAgICAgIHJlbmRlclBhc3MuaXNCdWZmZXJMZXNzUmVuZGVyaW5nTW9kZSgpXG4gICAgKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIEEgbXVsdGktdmlldyBkcmF3IHJlbmRlcnMgYm90aCBleWVzLCB3aGljaCBoYXZlIGRpZmZlcmVudCBmcnVzdGEuXG4gICAgY29uc3Qgd2VieHJTeXN0ZW0gPSBlbmdpbmUuX3dlYlhSU3lzdGVtSWZFbmFibGVkO1xuICAgIGlmIChyZW5kZXJQYXNzLmlzVnJSZW5kZXJpbmcgJiYgd2VieHJTeXN0ZW0/LmlzV2ViWFJNb2RlICYmIHdlYnhyU3lzdGVtLmlzTXVsdGlWaWV3KCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbGF0ZXN0IGN1bGxpbmcgcmVzdWx0IG9mIGEgcmVuZGVyIHBhc3MgZm9yIHBlci1pbnN0YW5jZSBjdWxsaW5nIG9mIGluc3RhbmNlZCBkcmF3IGNhbGxzLlxuICAgKiBUaGUgcmVzdWx0IHN0YXlzIHZhbGlkIHdoaWxlIGBzb3J0XyRyZW5kZXJgIHJldXNlcyBpdHMgY2FjaGVkIHByaW1pdGl2ZSBsaXN0IGZvciB0aGUgcmVuZGVyIHBhc3MuXG4gICAqIEBwYXJhbSByZW5kZXJQYXNzIC0gVGhlIHJlbmRlciBwYXNzXG4gICAqIEByZXR1cm5zIFRoZSBjdWxsaW5nIHN0YXRlLCBvciB1bmRlZmluZWQgaWYgbm8gY3VsbGluZyBoYXMgcnVuIGZvciB0aGUgcmVuZGVyIHBhc3NcbiAgICogQGludGVybmFsXG4gICAqL1xuICBzdGF0aWMgX2dldEluc3RhbmNlQ3VsbGluZ1N0YXRlKHJlbmRlclBhc3M6IFJlbmRlclBhc3MpOiBJbnN0YW5jZUN1bGxpbmdTdGF0ZSB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3Qgc2NyYXRjaCA9IE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX3NvcnRTY3JhdGNoTWFwLmdldChyZW5kZXJQYXNzKTtcbiAgICBpZiAoc2NyYXRjaCA9PT0gdW5kZWZpbmVkIHx8IHNjcmF0Y2guY3VsbFRpY2sgPT09IDApIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiBzY3JhdGNoO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGVuZHMgdGhlIHByaW1pdGl2ZXMgb2YgYSBtZXNoIGNvbXBvbmVudCB0byBgb3V0UHJpbWl0aXZlc2AgYW5kIGNvbXB1dGVzIHRoZVxuICAgKiB2aWV3IGRlcHRoIGZvciBibGVuZGVkIHByaW1pdGl2ZXMuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2FwcGVuZFByaW1pdGl2ZXNPZk1lc2hDb21wb25lbnQoXG4gICAgbWVzaENvbXBvbmVudDogTWVzaENvbXBvbmVudCxcbiAgICBjYW1lcmFDb21wb25lbnQ6IENhbWVyYUNvbXBvbmVudCxcbiAgICBvdXRQcmltaXRpdmVzOiBQcmltaXRpdmVbXVxuICApIHtcbiAgICBjb25zdCBtZXNoID0gbWVzaENvbXBvbmVudC5tZXNoO1xuICAgIGlmIChtZXNoID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgbWVzaFByaW1pdGl2ZXMgPSBtZXNoLnByaW1pdGl2ZXM7XG4gICAgY29uc3QgcHJpbWl0aXZlQ291bnQgPSBtZXNoUHJpbWl0aXZlcy5sZW5ndGg7XG4gICAgbGV0IGlzQmxlbmRFeGlzdCA9IGZhbHNlO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJpbWl0aXZlQ291bnQ7IGkrKykge1xuICAgICAgY29uc3QgcHJpbWl0aXZlID0gbWVzaFByaW1pdGl2ZXNbaV07XG4gICAgICBvdXRQcmltaXRpdmVzLnB1c2gocHJpbWl0aXZlKTtcbiAgICAgIGlmICghaXNCbGVuZEV4aXN0ICYmIGlzQmxlbmQocHJpbWl0aXZlKSkge1xuICAgICAgICBpc0JsZW5kRXhpc3QgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNCbGVuZEV4aXN0KSB7XG4gICAgICBjb25zdCB2aWV3RGVwdGggPSBtZXNoQ29tcG9uZW50LmNhbGNWaWV3RGVwdGgoY2FtZXJhQ29tcG9uZW50KTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJpbWl0aXZlQ291bnQ7IGkrKykge1xuICAgICAgICBtZXNoUHJpbWl0aXZlc1tpXS5fdmlld0RlcHRoID0gdmlld0RlcHRoO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGR1cGxpY2F0ZWQgcHJpbWl0aXZlcyBpbiBwbGFjZSB3aXRob3V0IGFsbG9jYXRpbmcgYSBgU2V0YCBvciBhIG5ldyBhcnJheS5cbiAgICogQSBwcmltaXRpdmUgVUlEIGlzIHVuaXF1ZSwgc28gYSBzdGFtcCBhcnJheSBpbmRleGVkIGJ5IHRoZSBVSUQgaXMgZW5vdWdoIHRvIGRldGVjdFxuICAgKiBkdXBsaWNhdGVzLiBgcHJpbWl0aXZlcy5sZW5ndGhgIGlzIHVwZGF0ZWQgdG8gdGhlIGRlZHVwbGljYXRlZCBsZW5ndGguXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3JlbW92ZUR1cGxpY2F0ZWRQcmltaXRpdmVzKHByaW1pdGl2ZXM6IFByaW1pdGl2ZVtdLCBzY3JhdGNoOiBNZXNoUmVuZGVyZXJTb3J0U2NyYXRjaCkge1xuICAgIGNvbnN0IGxlbmd0aCA9IHByaW1pdGl2ZXMubGVuZ3RoO1xuICAgIGlmIChsZW5ndGggPD0gMSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBzdGFtcCA9IHNjcmF0Y2guc3RhbXA7XG4gICAgbGV0IHN0YW1wVGljayA9IHNjcmF0Y2guc3RhbXBUaWNrICsgMTtcbiAgICBpZiAoc3RhbXBUaWNrID09PSAweGZmZmZmZmZmKSB7XG4gICAgICAvLyBXcmFwIGFyb3VuZDogY2xlYXIgdGhlIHN0YW1wcyBzbyB0aGF0IG9sZCB2YWx1ZXMgY2Fubm90IGJlIG1pc3Rha2VuIGZvciB0aGUgY3VycmVudCB0aWNrLlxuICAgICAgc3RhbXAuZmlsbCgwKTtcbiAgICAgIHN0YW1wVGljayA9IDE7XG4gICAgfVxuICAgIHNjcmF0Y2guc3RhbXBUaWNrID0gc3RhbXBUaWNrO1xuXG4gICAgbGV0IHVuaXF1ZUxlbmd0aCA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJpbWl0aXZlID0gcHJpbWl0aXZlc1tpXTtcbiAgICAgIGNvbnN0IHByaW1pdGl2ZVVpZCA9IHByaW1pdGl2ZS5wcmltaXRpdmVVaWQ7XG4gICAgICBpZiAocHJpbWl0aXZlVWlkIDwgMCkge1xuICAgICAgICBwcmltaXRpdmVzW3VuaXF1ZUxlbmd0aCsrXSA9IHByaW1pdGl2ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAocHJpbWl0aXZlVWlkID49IHN0YW1wLmxlbmd0aCkge1xuICAgICAgICAvLyBHcm93IHRoZSBzdGFtcCBhcnJheSB1cCB0byB0aGUgbGFyZ2VzdCBwcmltaXRpdmUgVUlEIHNlZW4gc28gZmFyLlxuICAgICAgICBjb25zdCBuZXdTdGFtcCA9IG5ldyBVaW50MzJBcnJheShNYXRoLm1heChwcmltaXRpdmVVaWQgKyAxLCBzdGFtcC5sZW5ndGggKiAyLCA2NCkpO1xuICAgICAgICBuZXdTdGFtcC5zZXQoc3RhbXApO1xuICAgICAgICBzY3JhdGNoLnN0YW1wID0gbmV3U3RhbXA7XG4gICAgICAgIHN0YW1wID0gbmV3U3RhbXA7XG4gICAgICB9XG4gICAgICBpZiAoc3RhbXBbcHJpbWl0aXZlVWlkXSA9PT0gc3RhbXBUaWNrKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgc3RhbXBbcHJpbWl0aXZlVWlkXSA9IHN0YW1wVGljaztcbiAgICAgIHByaW1pdGl2ZXNbdW5pcXVlTGVuZ3RoKytdID0gcHJpbWl0aXZlO1xuICAgIH1cbiAgICBwcmltaXRpdmVzLmxlbmd0aCA9IHVuaXF1ZUxlbmd0aDtcbiAgfVxuXG4gIC8qKiBTb3J0IGNvbXBhcmF0b3Igc2hhcmVkIGJ5IGV2ZXJ5IHJlbmRlciBwYXNzIChhdm9pZHMgYWxsb2NhdGluZyBhIGNsb3N1cmUgcGVyIGZyYW1lKS4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19jb21wYXJlUHJpbWl0aXZlcyhhOiBQcmltaXRpdmUsIGI6IFByaW1pdGl2ZSkge1xuICAgIGNvbnN0IGRlbHRhID0gYS5fc29ydGtleSAtIGIuX3NvcnRrZXk7XG4gICAgaWYgKGRlbHRhICE9PSAwKSB7XG4gICAgICByZXR1cm4gZGVsdGE7XG4gICAgfVxuICAgIHJldHVybiBhLl92aWV3RGVwdGggLSBiLl92aWV3RGVwdGg7XG4gIH1cblxuICAvKipcbiAgICogQnVpbGRzIHRoZSBwcmltaXRpdmUgVUlEIGxpc3QgdXNlZCBmb3IgZHJhd2luZy4gVGhlIHRyYWlsaW5nIGAtMWAgaXMgdGhlIHNlbnRpbmVsXG4gICAqIHRoYXQgdGVybWluYXRlcyB0aGUgbGlzdC5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fY3JlYXRlUHJpbWl0aXZlVWlkcyhwcmltaXRpdmVzOiBQcmltaXRpdmVbXSk6IENvbXBvbmVudFNJRFtdIHtcbiAgICBjb25zdCBwcmltaXRpdmVDb3VudCA9IHByaW1pdGl2ZXMubGVuZ3RoO1xuICAgIGNvbnN0IHByaW1pdGl2ZVVpZHMgPSBuZXcgQXJyYXk8Q29tcG9uZW50U0lEPihwcmltaXRpdmVDb3VudCArIDEpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJpbWl0aXZlQ291bnQ7IGkrKykge1xuICAgICAgcHJpbWl0aXZlVWlkc1tpXSA9IHByaW1pdGl2ZXNbaV0ucHJpbWl0aXZlVWlkO1xuICAgIH1cbiAgICBwcmltaXRpdmVVaWRzW3ByaW1pdGl2ZUNvdW50XSA9IC0xO1xuICAgIHJldHVybiBwcmltaXRpdmVVaWRzO1xuICB9XG5cbiAgLyoqIFJldHVybnMgKGFuZCBsYXppbHkgY3JlYXRlcykgdGhlIHJldXNhYmxlIHNjcmF0Y2ggYnVmZmVycyBvZiBhIHJlbmRlciBwYXNzLiAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldFNvcnRTY3JhdGNoKHJlbmRlclBhc3M6IFJlbmRlclBhc3MpOiBNZXNoUmVuZGVyZXJTb3J0U2NyYXRjaCB7XG4gICAgbGV0IHNjcmF0Y2ggPSBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19zb3J0U2NyYXRjaE1hcC5nZXQocmVuZGVyUGFzcyk7XG4gICAgaWYgKHNjcmF0Y2ggPT09IHVuZGVmaW5lZCkge1xuICAgICAgc2NyYXRjaCA9IHtcbiAgICAgICAgcHJpbWl0aXZlczogW10sXG4gICAgICAgIHN0YW1wOiBuZXcgVWludDMyQXJyYXkoNjQpLFxuICAgICAgICBzdGFtcFRpY2s6IDAsXG4gICAgICAgIGN1bGxlZEVudGl0eVN0YW1wOiBuZXcgVWludDMyQXJyYXkoNjQpLFxuICAgICAgICBoYW5kbGVkRW50aXR5U3RhbXA6IG5ldyBVaW50MzJBcnJheSg2NCksXG4gICAgICAgIG1lc2hDdWxsVGljazogbmV3IFdlYWtNYXAoKSxcbiAgICAgICAgY3VsbFRpY2s6IDAsXG4gICAgICAgIGN1bGxlZEVudGl0eUNvdW50OiAwLFxuICAgICAgICBjdWxsaW5nSWQ6IDAsXG4gICAgICAgIGtleWVkUHJpbWl0aXZlczogW10sXG4gICAgICAgIGlzR3B1Q3VsbGluZ0FjdGl2ZTogdW5kZWZpbmVkLFxuICAgICAgICBpc0NvbXB1dGVTa2lubmluZ0VuYWJsZWQ6IHVuZGVmaW5lZCxcbiAgICAgICAgY3VsbGVkSW5zdGFuY2VkTWVzaENvbXBvbmVudHM6IFtdLFxuICAgICAgICBtZXNoQXBwZW5kVGljazogbmV3IFdlYWtNYXAoKSxcbiAgICAgIH07XG4gICAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19zb3J0U2NyYXRjaE1hcC5zZXQocmVuZGVyUGFzcywgc2NyYXRjaCk7XG4gICAgfVxuICAgIHJldHVybiBzY3JhdGNoO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbW1vbiBwcmUtcmVuZGVyaW5nIHNldHVwIG1ldGhvZCB0aGF0IHByZXBhcmVzIHRoZSByZW5kZXJpbmcgc3RyYXRlZ3kuXG4gICAqIEluaXRpYWxpemVzIHRoZSByZW5kZXJpbmcgc3RyYXRlZ3kgaWYgbm90IGFscmVhZHkgc2V0IGFuZCBjYWxscyBpdHMgcHJlcmVuZGVyIG1ldGhvZC5cbiAgICovXG4gIHN0YXRpYyBjb21tb25fJHByZXJlbmRlcihlbmdpbmU6IEVuZ2luZSkge1xuICAgIGNvbnN0IGVuZ2luZVVpZCA9IGVuZ2luZS5vYmplY3RVSUQ7XG4gICAgLy8gVGhpcyBydW5zIG9uY2UgcGVyIGZyYW1lLCBzbyB0aGUgc3RyYXRlZ3kgaXMgbWVtb2l6ZWQgaW5zdGVhZCBvZiBkb2luZyBhXG4gICAgLy8gYE1hcC5oYXNgICsgYE1hcC5nZXRgIHBhaXIgb24gZXZlcnkgZnJhbWUuXG4gICAgbGV0IHN0cmF0ZWd5ID0gTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fcHJlcmVuZGVyU3RyYXRlZ3k7XG4gICAgaWYgKHN0cmF0ZWd5ID09PSB1bmRlZmluZWQgfHwgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fcHJlcmVuZGVyU3RyYXRlZ3lFbmdpbmVVaWQgIT09IGVuZ2luZVVpZCkge1xuICAgICAgc3RyYXRlZ3kgPSBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19jZ0FwaVJlbmRlcmluZ1N0cmF0ZWd5TWFwLmdldChlbmdpbmVVaWQpO1xuICAgICAgaWYgKHN0cmF0ZWd5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gUG9zc2libGUgaWYgdGhlcmUgaXMgbm8gbWVzaCBlbnRpdHkgaW4gdGhlIHNjZW5lXG4gICAgICAgIGNvbnN0IHByb2Nlc3NBcHByb2FjaCA9IGVuZ2luZS5lbmdpbmVTdGF0ZS5jdXJyZW50UHJvY2Vzc0FwcHJvYWNoO1xuICAgICAgICB0aGlzLmNvbW1vbl8kbG9hZCh7IHByb2Nlc3NBcHByb2FjaCwgZW5naW5lIH0pO1xuICAgICAgICBzdHJhdGVneSA9IE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2NnQXBpUmVuZGVyaW5nU3RyYXRlZ3lNYXAuZ2V0KGVuZ2luZVVpZCk7XG4gICAgICAgIGlmIChzdHJhdGVneSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19wcmVyZW5kZXJTdHJhdGVneUVuZ2luZVVpZCA9IGVuZ2luZVVpZDtcbiAgICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX3ByZXJlbmRlclN0cmF0ZWd5ID0gc3RyYXRlZ3k7XG4gICAgfVxuICAgIC8vIENhbGwgY29tbW9uXyRwcmVyZW5kZXIgb2YgdGhlIFdlYkdML1dlYkdQVSByZW5kZXJpbmcgc3RyYXRlZ3lcbiAgICBzdHJhdGVneS5wcmVyZW5kZXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21tb24gcmVuZGVyaW5nIG1ldGhvZCB0aGF0IGV4ZWN1dGVzIHRoZSBhY3R1YWwgcmVuZGVyaW5nIG9mIHByaW1pdGl2ZXMuXG4gICAqIERlbGVnYXRlcyB0byB0aGUgYXBwcm9wcmlhdGUgcmVuZGVyaW5nIHN0cmF0ZWd5IChXZWJHTCBvciBXZWJHUFUpLlxuICAgKiBAcGFyYW0gcmVuZGVyUGFzcyAtIFRoZSByZW5kZXIgcGFzcyBjb250ZXh0XG4gICAqIEBwYXJhbSByZW5kZXJQYXNzVGlja0NvdW50IC0gVGhlIHRpY2sgY291bnQgZm9yIHRoaXMgcmVuZGVyIHBhc3NcbiAgICogQHBhcmFtIHByaW1pdGl2ZVVpZHMgLSBBcnJheSBvZiBwcmltaXRpdmUgVUlEcyB0byByZW5kZXJcbiAgICogQHBhcmFtIGRpc3BsYXlJZHggLSBUaGUgaW5kZXggb2YgdGhlIGRpc3BsYXkgdG8gcmVuZGVyIHRvXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEByZXR1cm5zIFRydWUgaWYgcmVuZGVyaW5nIHdhcyBzdWNjZXNzZnVsLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBjb21tb25fJHJlbmRlcih7XG4gICAgcmVuZGVyUGFzcyxcbiAgICByZW5kZXJQYXNzVGlja0NvdW50LFxuICAgIHByaW1pdGl2ZVVpZHMsXG4gICAgZGlzcGxheUlkeCxcbiAgICBlbmdpbmUsXG4gIH06IHtcbiAgICByZW5kZXJQYXNzOiBSZW5kZXJQYXNzO1xuICAgIHJlbmRlclBhc3NUaWNrQ291bnQ6IENvdW50O1xuICAgIHByaW1pdGl2ZVVpZHM6IFByaW1pdGl2ZVVJRFtdO1xuICAgIGRpc3BsYXlJZHg6IEluZGV4O1xuICAgIGVuZ2luZTogRW5naW5lO1xuICB9KTogYm9vbGVhbiB7XG4gICAgLy8gQ2FsbCBjb21tb25fJHJlbmRlciBvZiBXZWJHTFJlbmRlcmluZ1N0cmF0ZWd5XG4gICAgcmV0dXJuIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2NnQXBpUmVuZGVyaW5nU3RyYXRlZ3lNYXBcbiAgICAgIC5nZXQoZW5naW5lLm9iamVjdFVJRCkhXG4gICAgICAuY29tbW9uXyRyZW5kZXIocHJpbWl0aXZlVWlkcywgcmVuZGVyUGFzcywgcmVuZGVyUGFzc1RpY2tDb3VudCwgZGlzcGxheUlkeCk7XG4gIH1cblxuICAvKipcbiAgICogSW5zdGFuY2Utc3BlY2lmaWMgcmVuZGVyIG1ldGhvZCBmb3IgdGhpcyBtZXNoIHJlbmRlcmVyIGNvbXBvbmVudC5cbiAgICogQ3VycmVudGx5IGVtcHR5IGFzIHJlbmRlcmluZyBpcyBoYW5kbGVkIGJ5IHRoZSBzdGF0aWMgY29tbW9uXyRyZW5kZXIgbWV0aG9kLlxuICAgKiBAcGFyYW0gaSAtIFRoZSBpbmRleCBvZiB0aGlzIGNvbXBvbmVudCBpbiB0aGUgcmVuZGVyIHF1ZXVlXG4gICAqIEBwYXJhbSByZW5kZXJQYXNzIC0gVGhlIHJlbmRlciBwYXNzIGNvbnRleHRcbiAgICogQHBhcmFtIHJlbmRlclBhc3NUaWNrQ291bnQgLSBUaGUgdGljayBjb3VudCBmb3IgdGhpcyByZW5kZXIgcGFzc1xuICAgKi9cbiAgJHJlbmRlcigpIHt9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIGEgc2hhbGxvdyBjb3B5IG9mIHByb3BlcnRpZXMgZnJvbSBhbm90aGVyIE1lc2hSZW5kZXJlckNvbXBvbmVudC5cbiAgICogQ29waWVzIGN1YmUgbWFwIHNldHRpbmdzIGFuZCBjb250cmlidXRpb25zIHdpdGhvdXQgZGVlcCBjbG9uaW5nIHRoZSB0ZXh0dXJlcy5cbiAgICogQHBhcmFtIGNvbXBvbmVudF8gLSBUaGUgc291cmNlIGNvbXBvbmVudCB0byBjb3B5IGZyb21cbiAgICovXG4gIF9zaGFsbG93Q29weUZyb20oY29tcG9uZW50XzogQ29tcG9uZW50KTogdm9pZCB7XG4gICAgY29uc3QgY29tcG9uZW50ID0gY29tcG9uZW50XyBhcyBNZXNoUmVuZGVyZXJDb21wb25lbnQ7XG5cbiAgICB0aGlzLl9fZGlmZnVzZUN1YmVNYXAgPSBjb21wb25lbnQuX19kaWZmdXNlQ3ViZU1hcDtcbiAgICB0aGlzLl9fc3BlY3VsYXJDdWJlTWFwID0gY29tcG9uZW50Ll9fc3BlY3VsYXJDdWJlTWFwO1xuICAgIHRoaXMuZGlmZnVzZUN1YmVNYXBDb250cmlidXRpb24gPSBjb21wb25lbnQuZGlmZnVzZUN1YmVNYXBDb250cmlidXRpb247XG4gICAgdGhpcy5zcGVjdWxhckN1YmVNYXBDb250cmlidXRpb24gPSBjb21wb25lbnQuc3BlY3VsYXJDdWJlTWFwQ29udHJpYnV0aW9uO1xuICAgIHRoaXMucm90YXRpb25PZkN1YmVNYXAgPSBjb21wb25lbnQucm90YXRpb25PZkN1YmVNYXA7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhpcyBjb21wb25lbnQgYW5kIGNsZWFucyB1cCBpdHMgcmVzb3VyY2VzLlxuICAgKiBDbGVhcnMgY3ViZSBtYXAgcmVmZXJlbmNlcyBhbmQgY2FsbHMgdGhlIHBhcmVudCBkZXN0cm95IG1ldGhvZC5cbiAgICovXG4gIF9kZXN0cm95KCk6IHZvaWQge1xuICAgIHN1cGVyLl9kZXN0cm95KCk7XG4gICAgdGhpcy5fX2RpZmZ1c2VDdWJlTWFwID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX19zcGVjdWxhckN1YmVNYXAgPSB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGUgTWVzaFJlbmRlcmVyIGNvbXBvbmVudCBmdW5jdGlvbmFsaXR5IHRvIGFuIGVudGl0eSBjbGFzcy5cbiAgICogVGhpcyBtZXRob2QgZXh0ZW5kcyB0aGUgZW50aXR5IGJhc2UgY2xhc3Mgd2l0aCBtZXNoIHJlbmRlcmVyIHNwZWNpZmljIG1ldGhvZHMuXG4gICAqIEBwYXJhbSBiYXNlIC0gVGhlIHRhcmdldCBlbnRpdHkgYmFzZSBjbGFzc1xuICAgKiBAcGFyYW0gX2NvbXBvbmVudENsYXNzIC0gVGhlIGNvbXBvbmVudCBjbGFzcyB0byBhZGQgKHVudXNlZCBwYXJhbWV0ZXIgZm9yIHR5cGUgc2FmZXR5KVxuICAgKiBAcmV0dXJucyBUaGUgZW5oYW5jZWQgZW50aXR5IGNsYXNzIHdpdGggbWVzaCByZW5kZXJlciBtZXRob2RzXG4gICAqL1xuICBhZGRUaGlzQ29tcG9uZW50VG9FbnRpdHk8RW50aXR5QmFzZSBleHRlbmRzIElFbnRpdHksIFNvbWVDb21wb25lbnRDbGFzcyBleHRlbmRzIHR5cGVvZiBDb21wb25lbnQ+KFxuICAgIGJhc2U6IEVudGl0eUJhc2UsXG4gICAgX2NvbXBvbmVudENsYXNzOiBTb21lQ29tcG9uZW50Q2xhc3NcbiAgKSB7XG4gICAgY2xhc3MgTWVzaFJlbmRlcmVyRW50aXR5IGV4dGVuZHMgKGJhc2UuY29uc3RydWN0b3IgYXMgYW55KSB7XG4gICAgICBnZXRNZXNoUmVuZGVyZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldENvbXBvbmVudEJ5Q29tcG9uZW50VElEKFxuICAgICAgICAgIFdlbGxLbm93bkNvbXBvbmVudFRJRHMuTWVzaFJlbmRlcmVyQ29tcG9uZW50VElEXG4gICAgICAgICkgYXMgTWVzaFJlbmRlcmVyQ29tcG9uZW50O1xuICAgICAgfVxuICAgIH1cbiAgICBhcHBseU1peGlucyhiYXNlLCBNZXNoUmVuZGVyZXJFbnRpdHkpO1xuICAgIHJldHVybiBiYXNlIGFzIHVua25vd24gYXMgQ29tcG9uZW50VG9Db21wb25lbnRNZXRob2RzPFNvbWVDb21wb25lbnRDbGFzcz4gJiBFbnRpdHlCYXNlO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFucyB1cCBzdGF0aWMgcmVzb3VyY2VzIGFzc29jaWF0ZWQgd2l0aCB0aGUgc3BlY2lmaWVkIGVuZ2luZS5cbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2UgdG8gY2xlYW4gdXAgcmVzb3VyY2VzIGZvclxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHN0YXRpYyBfY2xlYW51cEZvckVuZ2luZShlbmdpbmU6IEVuZ2luZSk6IHZvaWQge1xuICAgIGNvbnN0IHN0cmF0ZWd5ID0gTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fY2dBcGlSZW5kZXJpbmdTdHJhdGVneU1hcC5nZXQoZW5naW5lLm9iamVjdFVJRCk7XG4gICAgaWYgKHN0cmF0ZWd5ICE9IG51bGwpIHtcbiAgICAgIHN0cmF0ZWd5LmRlc3Ryb3koKTtcbiAgICB9XG4gICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fY2dBcGlSZW5kZXJpbmdTdHJhdGVneU1hcC5kZWxldGUoZW5naW5lLm9iamVjdFVJRCk7XG4gICAgLy8gRHJvcCB0aGUgbWVtb2l6ZWQgc3RyYXRlZ3kgc28gdGhhdCBhIHN0YWxlIGluc3RhbmNlIGlzIG5ldmVyIHJldXNlZC5cbiAgICBpZiAoTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fcHJlcmVuZGVyU3RyYXRlZ3lFbmdpbmVVaWQgPT09IGVuZ2luZS5vYmplY3RVSUQpIHtcbiAgICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX3ByZXJlbmRlclN0cmF0ZWd5RW5naW5lVWlkID0gLTE7XG4gICAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19wcmVyZW5kZXJTdHJhdGVneSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFVQSxTQUFTLHdCQUF3Qiw2Q0FBNkM7QUFJOUUsU0FBUyxpQkFBaUI7QUFFMUIsU0FBUyxtQkFBMEM7QUFDbkQsU0FBUyx1QkFBaUQ7QUFDMUQsU0FBUyxvQkFBb0I7QUFFN0IsU0FBUyxTQUFTLHNCQUFzQixtQkFBbUIscUJBQXFCO0FBSWhGLFNBQVMscUJBQXFCO0FBRzlCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsdUNBQXVDO0FBR2hELFNBQVMsMkJBQTJCO0FBQ3BDLFNBQVMsMEJBQTBCO0FBQ25DLFNBQVMsOEJBQThCO0FBNkRoQyxJQUFNLHlCQUFOLE1BQU0sK0JBQThCLFVBQVU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUF5Q25ELFlBQ0UsUUFDQSxXQUNBLGNBQ0Esa0JBQ0EsU0FDQTtBQUNBLFVBQU0sUUFBUSxXQUFXLGNBQWMsa0JBQWtCLE9BQU87QUE1Q2xFLFNBQVFBLEtBQStCO0FBQ3ZDLFNBQVFDLEtBQWdDO0FBQ3hDLFNBQVFDLEtBQXNCO0FBSTlCLFNBQVFDLEtBQWdCO0FBTXhCLFNBQVFDLEtBQWdCO0FBQ3hCLFNBQVFDLEtBQWtCO0FBZ0N4QixTQUFLLGdCQUFnQjtBQUFBLEVBQ3ZCO0FBQUE7QUFBQTtBQUFBO0FBQUE7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aEIsZUFBTyxLQUFLO0FBQUEsVUFDVix1QkFBdUI7QUFBQSxRQUN6QjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQ0EsZ0JBQVksTUFBTSxrQkFBa0I7QUFDcEMsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxPQUFPLGtCQUFrQixRQUFzQjtBQUM3QyxVQUFNLFdBQVcsdUJBQXNCSyxHQUE0QixJQUFJLE9BQU8sU0FBUztBQUN2RixRQUFJLFlBQVksTUFBTTtBQUNwQixlQUFTLFFBQVE7QUFBQSxJQUNuQjtBQUNBLDJCQUFzQkEsR0FBNEIsT0FBTyxPQUFPLFNBQVM7QUFFekUsUUFBSSx1QkFBc0JpQixPQUFpQyxPQUFPLFdBQVc7QUFDM0UsNkJBQXNCQSxLQUErQjtBQUNyRCw2QkFBc0JELEtBQXNCO0FBQUEsSUFDOUM7QUFBQSxFQUNGO0FBQ0Y7QUExK0JhLHVCQVFJaEIsS0FBNkQsb0JBQUksSUFBSTtBQVJ6RSx1QkFTSmtCLEtBQWtGLG9CQUFJLElBQUk7QUFUdEYsdUJBV0kzQixLQUFnQjtBQVhwQix1QkFZRywyQkFBMkI7QUFBQTtBQVo5Qix1QkFjSWdCLEtBQXFCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQWR6Qix1QkF1QklULEtBQW1CLG9CQUFJLElBQW9CO0FBdkIvQyx1QkF3QklDLEtBQXNCO0FBQUE7QUF4QjFCLHVCQTJCSWdCLEtBQWlFLG9CQUFJLFFBQVE7QUFBQTtBQTNCakYsdUJBOEJJRSxLQUEwQztBQTlCcEQsSUFBTSx3QkFBTjsiLAogICJuYW1lcyI6IFsiX19kaWZmdXNlQ3ViZU1hcENvbnRyaWJ1dGlvbiIsICJfX3NwZWN1bGFyQ3ViZU1hcENvbnRyaWJ1dGlvbiIsICJfX3JvdGF0aW9uT2ZDdWJlTWFwIiwgIl9fdXBkYXRlQ291bnQiLCAiX19maW5nZXJQcmludCIsICJfX2ZpbmdlclByaW50SWQiLCAiX19kaWZmdXNlQ3ViZU1hcCIsICJfX3NwZWN1bGFyQ3ViZU1hcCIsICJfX3NoZWVuQ3ViZU1hcCIsICJfX2ludGVybkZpbmdlclByaW50SWQiLCAiX19maW5nZXJQcmludElkcyIsICJfX25leHRGaW5nZXJQcmludElkIiwgIl9fY2dBcGlSZW5kZXJpbmdTdHJhdGVneU1hcCIsICJfX2VuZ2luZSIsICJfX2dldFNvcnRTY3JhdGNoIiwgIl9fY3VsbGluZ1dpdGhWaWV3RnJ1c3R1bSIsICJfX3JlbW92ZUR1cGxpY2F0ZWRQcmltaXRpdmVzIiwgIl9fY29tcGFyZVByaW1pdGl2ZXMiLCAiX19jcmVhdGVQcmltaXRpdmVVaWRzIiwgIl9fY3VsbGluZ0lkQ291bnRlciIsICJfX3N0YW1wRW50aXR5IiwgIl9fYXBwZW5kUHJpbWl0aXZlc09mTWVzaENvbXBvbmVudCIsICJfX21hcmtNZXNoQXBwZW5kZWQiLCAiX19zdGFtcEN1bGxlZEVudGl0eSIsICJfX2RlZmVyQ3VsbGVkSW5zdGFuY2VkTWVzaCIsICJfX2N1bGxTaWJsaW5nSW5zdGFuY2VzIiwgIl9fYXBwZW5kUHJpbWl0aXZlc09mQ3VsbGVkSW5zdGFuY2VkTWVzaGVzIiwgIl9fc29ydFNjcmF0Y2hNYXAiLCAiX19wcmVyZW5kZXJTdHJhdGVneSIsICJfX3ByZXJlbmRlclN0cmF0ZWd5RW5naW5lVWlkIiwgIl9fc2hhZGVyUHJvZ3JhbUhhbmRsZU9mUHJpbWl0aXZlT2JqZWN0VWlkcyJdCn0K
