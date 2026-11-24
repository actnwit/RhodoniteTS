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
    this.__diffuseCubeMapContribution = 1;
    this.__specularCubeMapContribution = 1;
    this.__rotationOfCubeMap = 0;
    this.__updateCount = 0;
    this.__fingerPrint = "";
    this.__fingerPrintId = 0;
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
    return this.__diffuseCubeMap;
  }
  /**
   * Gets the specular cube map used for IBL lighting.
   * @returns The specular cube map texture or undefined if not set
   */
  get specularCubeMap() {
    return this.__specularCubeMap;
  }
  /**
   * Gets the sheen cube map used for IBL lighting.
   * @returns The sheen cube map texture or undefined if not set
   */
  get sheenCubeMap() {
    return this.__sheenCubeMap;
  }
  /**
   * Gets the update count for this component instance.
   * @returns The current update count
   */
  get updateCount() {
    return this.__updateCount;
  }
  /**
   * Gets the global update count for all MeshRendererComponent instances.
   * @returns The global update count
   */
  static get updateCount() {
    return _MeshRendererComponent.__updateCount;
  }
  /**
   * Gets the contribution factor for the diffuse cube map in IBL calculations.
   * @returns The diffuse cube map contribution factor (0.0 to 1.0)
   */
  get diffuseCubeMapContribution() {
    return this.__diffuseCubeMapContribution;
  }
  /**
   * Sets the contribution factor for the diffuse cube map in IBL calculations.
   * @param contribution - The contribution factor (0.0 to 1.0)
   */
  set diffuseCubeMapContribution(contribution) {
    this.__diffuseCubeMapContribution = contribution;
    this.__updateCount++;
    _MeshRendererComponent.__updateCount++;
  }
  /**
   * Gets the contribution factor for the specular cube map in IBL calculations.
   * @returns The specular cube map contribution factor (0.0 to 1.0)
   */
  get specularCubeMapContribution() {
    return this.__specularCubeMapContribution;
  }
  /**
   * Sets the contribution factor for the specular cube map in IBL calculations.
   * @param contribution - The contribution factor (0.0 to 1.0)
   */
  set specularCubeMapContribution(contribution) {
    this.__specularCubeMapContribution = contribution;
    this.__updateCount++;
    _MeshRendererComponent.__updateCount++;
  }
  /**
   * Gets the rotation angle of the cube map in radians.
   * @returns The rotation angle in radians
   */
  get rotationOfCubeMap() {
    return this.__rotationOfCubeMap;
  }
  /**
   * Sets the rotation angle of the cube map in radians.
   * @param rotation - The rotation angle in radians
   */
  set rotationOfCubeMap(rotation) {
    this.__rotationOfCubeMap = rotation;
    this.__updateCount++;
    _MeshRendererComponent.__updateCount++;
  }
  /**
   * Calculates and updates the fingerprint for this component based on current cube map settings.
   * The fingerprint is used for caching and optimization purposes.
   */
  calcFingerPrint() {
    this.__fingerPrint = `${this.__diffuseCubeMap != null ? this.__diffuseCubeMap.textureUID : -1} ${this.__specularCubeMap != null ? this.__specularCubeMap.textureUID : -1} ${this.__sheenCubeMap != null ? this.__sheenCubeMap.textureUID : -1}`;
    this.__fingerPrintId = _MeshRendererComponent.__internFingerPrintId(this.__fingerPrint);
  }
  static __internFingerPrintId(fingerPrint) {
    let id = _MeshRendererComponent.__fingerPrintIds.get(fingerPrint);
    if (id == null) {
      id = ++_MeshRendererComponent.__nextFingerPrintId;
      _MeshRendererComponent.__fingerPrintIds.set(fingerPrint, id);
    }
    return id;
  }
  /**
   * Gets the current fingerprint of this component.
   * @returns The fingerprint string
   */
  getFingerPrint() {
    return this.__fingerPrint;
  }
  /**
   * Gets the interned numeric id of the fingerprint. Numeric ids keep the per-frame
   * multi-draw state keys cheap to compare.
   * @returns The fingerprint id
   */
  getFingerPrintId() {
    return this.__fingerPrintId;
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
    this.__diffuseCubeMap = diffuseCubeTexture;
    this.__specularCubeMap = specularCubeTexture;
    this.__sheenCubeMap = sheenCubeTexture;
    this.calcFingerPrint();
    this.__updateCount++;
    _MeshRendererComponent.__updateCount++;
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
      if (!_MeshRendererComponent.__cgApiRenderingStrategyMap.has(engineUid)) {
        _MeshRendererComponent.__cgApiRenderingStrategyMap.set(engineUid, webgpuModule.WebGpuStrategyBasic.init(engine));
      }
      _MeshRendererComponent.__cgApiRenderingStrategyMap.get(engineUid).common_$load();
    } else {
      const moduleName = "webgl";
      const webglModule = moduleManager.getModule(moduleName);
      if (!_MeshRendererComponent.__cgApiRenderingStrategyMap.has(engineUid)) {
        _MeshRendererComponent.__cgApiRenderingStrategyMap.set(
          engineUid,
          webglModule.getRenderingStrategy(engine, processApproach)
        );
      }
      _MeshRendererComponent.__cgApiRenderingStrategyMap.get(engineUid).common_$load();
    }
  }
  /**
   * Loads and initializes this mesh renderer component.
   * Sets up the component for rendering by loading the associated mesh.
   */
  $load() {
    const strategy = _MeshRendererComponent.__cgApiRenderingStrategyMap.get(this.__engine.objectUID);
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
    const scratch = _MeshRendererComponent.__getSortScratch(renderPass);
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
    const primitives = _MeshRendererComponent.__cullingWithViewFrustum(
      cameraComponent,
      renderPass._optimizedMeshComponents,
      scratch.primitives,
      scratch,
      isGpuCullingActive
    );
    _MeshRendererComponent.__removeDuplicatedPrimitives(primitives, scratch);
    if (primitives.length > 1) {
      primitives.sort(_MeshRendererComponent.__comparePrimitives);
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
    const primitiveUids = _MeshRendererComponent.__createPrimitiveUids(primitives);
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
  static __cullingWithViewFrustum(cameraComponent, meshComponents, outPrimitives, scratch, isGpuCullingActive) {
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
    scratch.cullingId = ++_MeshRendererComponent.__cullingIdCounter;
    const isFrustumCullingEnabled = cameraComponent != null && _MeshRendererComponent._isFrustumCullingEnabled;
    let frustum;
    if (isFrustumCullingEnabled) {
      cameraComponent.updateFrustum();
      frustum = cameraComponent.frustum;
    }
    for (let i = 0; i < meshComponents.length; i++) {
      const meshComponent = meshComponents[i];
      const sceneGraph = meshComponent.entity.getSceneGraph();
      if (!meshComponent._isAlive) {
        continue;
      }
      scratch.handledEntityStamp = _MeshRendererComponent.__stampEntity(
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
        _MeshRendererComponent.__appendPrimitivesOfMeshComponent(meshComponent, cameraComponent, outPrimitives);
        _MeshRendererComponent.__markMeshAppended(meshComponent, scratch, cullTick);
        continue;
      }
      if (!sceneGraph.isVisible) {
        _MeshRendererComponent.__stampCulledEntity(scratch, meshComponent.entityUID, cullTick);
        _MeshRendererComponent.__deferCulledInstancedMesh(meshComponent, scratch);
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
          _MeshRendererComponent.__stampCulledEntity(scratch, meshComponent.entityUID, cullTick);
          _MeshRendererComponent.__deferCulledInstancedMesh(meshComponent, scratch);
          continue;
        }
      }
      _MeshRendererComponent.__appendPrimitivesOfMeshComponent(meshComponent, cameraComponent, outPrimitives);
      _MeshRendererComponent.__markMeshAppended(meshComponent, scratch, cullTick);
    }
    _MeshRendererComponent.__cullSiblingInstances(meshComponents, frustum, scratch, cullTick, isGpuCullingActive);
    _MeshRendererComponent.__appendPrimitivesOfCulledInstancedMeshes(cameraComponent, outPrimitives, scratch, cullTick);
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
  static __cullSiblingInstances(meshComponents, frustum, scratch, cullTick, isGpuCullingActive) {
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
          _MeshRendererComponent.__stampCulledEntity(scratch, entityUID, cullTick);
        }
      }
    }
  }
  /**
   * Remembers a culled mesh component whose mesh is shared by other instances: an instanced draw call renders
   * every instance of the mesh, so the mesh must still be drawn when another instance is visible.
   */
  static __deferCulledInstancedMesh(meshComponent, scratch) {
    const mesh = meshComponent.mesh;
    if (mesh !== void 0 && mesh.meshEntitiesInner.length > 1) {
      scratch.culledInstancedMeshComponents.push(meshComponent);
    }
  }
  static __markMeshAppended(meshComponent, scratch, cullTick) {
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
  static __appendPrimitivesOfCulledInstancedMeshes(cameraComponent, outPrimitives, scratch, cullTick) {
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
        _MeshRendererComponent.__appendPrimitivesOfMeshComponent(meshComponent, cameraComponent, outPrimitives);
      }
    }
    meshComponents.length = 0;
  }
  static __stampCulledEntity(scratch, entityUID, cullTick) {
    scratch.culledEntityStamp = _MeshRendererComponent.__stampEntity(scratch.culledEntityStamp, entityUID, cullTick);
    scratch.culledEntityCount++;
  }
  /**
   * Writes `cullTick` into `stamp[entityUID]`, growing the array up to the largest EntityUID seen so far.
   * @returns The stamp array, which is a new array when it has grown
   */
  static __stampEntity(stamp, entityUID, cullTick) {
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
    const scratch = _MeshRendererComponent.__sortScratchMap.get(renderPass);
    if (scratch === void 0 || scratch.cullTick === 0) {
      return void 0;
    }
    return scratch;
  }
  /**
   * Appends the primitives of a mesh component to `outPrimitives` and computes the
   * view depth for blended primitives.
   */
  static __appendPrimitivesOfMeshComponent(meshComponent, cameraComponent, outPrimitives) {
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
  static __removeDuplicatedPrimitives(primitives, scratch) {
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
  static __comparePrimitives(a, b) {
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
  static __createPrimitiveUids(primitives) {
    const primitiveCount = primitives.length;
    const primitiveUids = new Array(primitiveCount + 1);
    for (let i = 0; i < primitiveCount; i++) {
      primitiveUids[i] = primitives[i].primitiveUid;
    }
    primitiveUids[primitiveCount] = -1;
    return primitiveUids;
  }
  /** Returns (and lazily creates) the reusable scratch buffers of a render pass. */
  static __getSortScratch(renderPass) {
    let scratch = _MeshRendererComponent.__sortScratchMap.get(renderPass);
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
      _MeshRendererComponent.__sortScratchMap.set(renderPass, scratch);
    }
    return scratch;
  }
  /**
   * Common pre-rendering setup method that prepares the rendering strategy.
   * Initializes the rendering strategy if not already set and calls its prerender method.
   */
  static common_$prerender(engine) {
    const engineUid = engine.objectUID;
    let strategy = _MeshRendererComponent.__prerenderStrategy;
    if (strategy === void 0 || _MeshRendererComponent.__prerenderStrategyEngineUid !== engineUid) {
      strategy = _MeshRendererComponent.__cgApiRenderingStrategyMap.get(engineUid);
      if (strategy === void 0) {
        const processApproach = engine.engineState.currentProcessApproach;
        this.common_$load({ processApproach, engine });
        strategy = _MeshRendererComponent.__cgApiRenderingStrategyMap.get(engineUid);
        if (strategy === void 0) {
          return;
        }
      }
      _MeshRendererComponent.__prerenderStrategyEngineUid = engineUid;
      _MeshRendererComponent.__prerenderStrategy = strategy;
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
    return _MeshRendererComponent.__cgApiRenderingStrategyMap.get(engine.objectUID).common_$render(primitiveUids, renderPass, renderPassTickCount, displayIdx);
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
    this.__diffuseCubeMap = component.__diffuseCubeMap;
    this.__specularCubeMap = component.__specularCubeMap;
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
    this.__diffuseCubeMap = void 0;
    this.__specularCubeMap = void 0;
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
    const strategy = _MeshRendererComponent.__cgApiRenderingStrategyMap.get(engine.objectUID);
    if (strategy != null) {
      strategy.destroy();
    }
    _MeshRendererComponent.__cgApiRenderingStrategyMap.delete(engine.objectUID);
    if (_MeshRendererComponent.__prerenderStrategyEngineUid === engine.objectUID) {
      _MeshRendererComponent.__prerenderStrategyEngineUid = -1;
      _MeshRendererComponent.__prerenderStrategy = void 0;
    }
  }
};
_MeshRendererComponent.__cgApiRenderingStrategyMap = /* @__PURE__ */ new Map();
_MeshRendererComponent.__shaderProgramHandleOfPrimitiveObjectUids = /* @__PURE__ */ new Map();
_MeshRendererComponent.__updateCount = 0;
_MeshRendererComponent._isFrustumCullingEnabled = true;
/** Monotonic id of the latest culling pass, used as a per-mesh visit stamp. */
_MeshRendererComponent.__cullingIdCounter = 0;
/**
 * Interned ids of mesh renderer fingerprints. The fingerprint changes only when the IBL cube
 * maps change, and two mesh renderers with the same cube maps must share a multi-draw batch,
 * so the id is interned by value instead of being unique per component.
 */
_MeshRendererComponent.__fingerPrintIds = /* @__PURE__ */ new Map();
_MeshRendererComponent.__nextFingerPrintId = 0;
/** Per-render-pass scratch buffers reused by sort_$render to avoid per-frame allocations. */
_MeshRendererComponent.__sortScratchMap = /* @__PURE__ */ new WeakMap();
/** Memoized rendering strategy for common_$prerender (the hot path runs once per frame). */
_MeshRendererComponent.__prerenderStrategyEngineUid = -1;
var MeshRendererComponent = _MeshRendererComponent;
export {
  MeshRendererComponent
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29tcG9uZW50cy9NZXNoUmVuZGVyZXIvTWVzaFJlbmRlcmVyQ29tcG9uZW50LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7XG4gIENHQVBJUmVzb3VyY2VIYW5kbGUsXG4gIENvbXBvbmVudFNJRCxcbiAgQ29tcG9uZW50VElELFxuICBDb3VudCxcbiAgRW50aXR5VUlELFxuICBJbmRleCxcbiAgT2JqZWN0VUlELFxuICBQcmltaXRpdmVVSUQsXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB7IGdldE11bHRpRHJhd1N0YXRlS2V5SWQsIGdldFByaW1pdGl2ZU1lc2hSZW5kZXJlckZpbmdlclByaW50SWQgfSBmcm9tICcuLi8uLi8uLi93ZWJnbC9NdWx0aURyYXcnO1xuaW1wb3J0IHR5cGUgeyBSbldlYkdMLCBXZWJHTFN0cmF0ZWd5IH0gZnJvbSAnLi4vLi4vLi4vd2ViZ2wvbWFpbic7XG5pbXBvcnQgdHlwZSB7IFJuV2ViR3B1IH0gZnJvbSAnLi4vLi4vLi4vd2ViZ3B1L21haW4nO1xuaW1wb3J0IHR5cGUgeyBXZWJHcHVTdHJhdGVneUJhc2ljIH0gZnJvbSAnLi4vLi4vLi4vd2ViZ3B1L1dlYkdwdVN0cmF0ZWd5QmFzaWMnO1xuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vY29yZS9Db21wb25lbnQnO1xuaW1wb3J0IHR5cGUgeyBJRW50aXR5IH0gZnJvbSAnLi4vLi4vY29yZS9FbnRpdHknO1xuaW1wb3J0IHsgYXBwbHlNaXhpbnMsIHR5cGUgRW50aXR5UmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL2NvcmUvRW50aXR5UmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBQcm9jZXNzQXBwcm9hY2gsIHR5cGUgUHJvY2Vzc0FwcHJvYWNoRW51bSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1Byb2Nlc3NBcHByb2FjaCc7XG5pbXBvcnQgeyBQcm9jZXNzU3RhZ2UgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Qcm9jZXNzU3RhZ2UnO1xuaW1wb3J0IHR5cGUgeyBQcmltaXRpdmUgfSBmcm9tICcuLi8uLi9nZW9tZXRyeS9QcmltaXRpdmUnO1xuaW1wb3J0IHsgaXNCbGVuZCwgaXNCbGVuZFdpdGhvdXRaV3JpdGUsIGlzQmxlbmRXaXRoWldyaXRlLCBpc1RyYW5zbHVjZW50IH0gZnJvbSAnLi4vLi4vZ2VvbWV0cnkvdHlwZXMvR2VvbWV0cnlUeXBlcyc7XG5pbXBvcnQgdHlwZSB7IENHQVBJU3RyYXRlZ3kgfSBmcm9tICcuLi8uLi9yZW5kZXJlci9DR0FQSVN0cmF0ZWd5JztcbmltcG9ydCB0eXBlIHsgUmVuZGVyUGFzcyB9IGZyb20gJy4uLy4uL3JlbmRlcmVyL1JlbmRlclBhc3MnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB7IE1vZHVsZU1hbmFnZXIgfSBmcm9tICcuLi8uLi9zeXN0ZW0vTW9kdWxlTWFuYWdlcic7XG5pbXBvcnQgdHlwZSB7IEN1YmVUZXh0dXJlIH0gZnJvbSAnLi4vLi4vdGV4dHVyZXMvQ3ViZVRleHR1cmUnO1xuaW1wb3J0IHR5cGUgeyBSZW5kZXJUYXJnZXRUZXh0dXJlQ3ViZSB9IGZyb20gJy4uLy4uL3RleHR1cmVzL1JlbmRlclRhcmdldFRleHR1cmVDdWJlJztcbmltcG9ydCB7IENhbWVyYUNvbXBvbmVudCB9IGZyb20gJy4uL0NhbWVyYS9DYW1lcmFDb21wb25lbnQnO1xuaW1wb3J0IHsgX2dldENhbWVyYUNvbnRyb2xsZXJVcGRhdGVDb3VudCB9IGZyb20gJy4uL0NhbWVyYUNvbnRyb2xsZXIvQ2FtZXJhQ29udHJvbGxlclVwZGF0ZUNvdW50JztcbmltcG9ydCB0eXBlIHsgQ29tcG9uZW50VG9Db21wb25lbnRNZXRob2RzIH0gZnJvbSAnLi4vQ29tcG9uZW50VHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBNZXNoQ29tcG9uZW50IH0gZnJvbSAnLi4vTWVzaC9NZXNoQ29tcG9uZW50JztcbmltcG9ydCB7IFNjZW5lR3JhcGhDb21wb25lbnQgfSBmcm9tICcuLi9TY2VuZUdyYXBoL1NjZW5lR3JhcGhDb21wb25lbnQnO1xuaW1wb3J0IHsgVHJhbnNmb3JtQ29tcG9uZW50IH0gZnJvbSAnLi4vVHJhbnNmb3JtL1RyYW5zZm9ybUNvbXBvbmVudCc7XG5pbXBvcnQgeyBXZWxsS25vd25Db21wb25lbnRUSURzIH0gZnJvbSAnLi4vV2VsbEtub3duQ29tcG9uZW50VElEcyc7XG5cbi8qKlxuICogUmV1c2FibGUgd29ya2luZyBidWZmZXJzIGZvciBvbmUgcmVuZGVyIHBhc3MuXG4gKlxuICogYHNvcnRfJHJlbmRlcmAgcnVucyBldmVyeSBmcmFtZSBhbmQgdXNlZCB0byBhbGxvY2F0ZSBhIGZpbHRlcmVkIG1lc2ggY29tcG9uZW50XG4gKiBhcnJheSwgYSBgU2V0YCwgYSBtYXBwZWQgYXJyYXkgYW5kIHNldmVyYWwgY2xvc3VyZXMgcGVyIGNhbGwuIEFsbCBvZiB0aGVtIGFyZVxuICogcmVwbGFjZWQgYnkgdGhlc2UgcGVyLXJlbmRlci1wYXNzIHNjcmF0Y2ggYnVmZmVycy5cbiAqL1xudHlwZSBNZXNoUmVuZGVyZXJTb3J0U2NyYXRjaCA9IHtcbiAgLyoqIFByaW1pdGl2ZXMgY29sbGVjdGVkIGJ5IHRoZSBjdWxsaW5nIHBhc3MuICovXG4gIHByaW1pdGl2ZXM6IFByaW1pdGl2ZVtdO1xuICAvKiogUGVyLXByaW1pdGl2ZSBzdGFtcCB1c2VkIHRvIHJlbW92ZSBkdXBsaWNhdGVzIHdpdGhvdXQgYSBgU2V0YC4gKi9cbiAgc3RhbXA6IFVpbnQzMkFycmF5O1xuICAvKiogQ3VycmVudCBzdGFtcCB2YWx1ZTsgYSBwcmltaXRpdmUgaXMgYSBkdXBsaWNhdGUgd2hpbGUgYHN0YW1wW3VpZF0gPT09IHN0YW1wVGlja2AuICovXG4gIHN0YW1wVGljazogbnVtYmVyO1xuICAvKiogUGVyLUVudGl0eVVJRCBzdGFtcDsgYW4gZW50aXR5IHdhcyBjdWxsZWQgYnkgdGhlIGxhdGVzdCBjdWxsaW5nIHdoaWxlIGBjdWxsZWRFbnRpdHlTdGFtcFt1aWRdID09PSBjdWxsVGlja2AuICovXG4gIGN1bGxlZEVudGl0eVN0YW1wOiBVaW50MzJBcnJheTtcbiAgLyoqIFBlci1FbnRpdHlVSUQgc3RhbXA7IGFuIGVudGl0eSB3YXMgaGFuZGxlZCBieSB0aGUgbGF0ZXN0IGN1bGxpbmcgd2hpbGUgYGhhbmRsZWRFbnRpdHlTdGFtcFt1aWRdID09PSBjdWxsVGlja2AuICovXG4gIGhhbmRsZWRFbnRpdHlTdGFtcDogVWludDMyQXJyYXk7XG4gIC8qKiBQZXItbWVzaCBzdGFtcDsgdGhlIGluc3RhbmNlcyBzaGFyaW5nIGEgbWVzaCB3ZXJlIGN1bGxlZCBieSB0aGUgbGF0ZXN0IGN1bGxpbmcgd2hpbGUgaXQgZXF1YWxzIGBjdWxsVGlja2AuICovXG4gIG1lc2hDdWxsVGljazogV2Vha01hcDxvYmplY3QsIG51bWJlcj47XG4gIC8qKiBTdGFtcCB2YWx1ZSBvZiB0aGUgbGF0ZXN0IGN1bGxpbmcgb2YgdGhpcyByZW5kZXIgcGFzcyAoMCBtZWFucyBubyBjdWxsaW5nIGhhcyBydW4geWV0KS4gKi9cbiAgY3VsbFRpY2s6IG51bWJlcjtcbiAgLyoqIE51bWJlciBvZiBlbnRpdGllcyBjdWxsZWQgYnkgdGhlIGxhdGVzdCBjdWxsaW5nLiAwIG1lYW5zIGV2ZXJ5IGluc3RhbmNlIHN0YXlzIHZpc2libGUuICovXG4gIGN1bGxlZEVudGl0eUNvdW50OiBudW1iZXI7XG4gIC8qKiBHbG9iYWxseSB1bmlxdWUgaWQgb2YgdGhlIGxhdGVzdCBjdWxsaW5nLCB1c2VkIHRvIHZpc2l0IGVhY2ggbWVzaCBvbmNlIGluIHRoZSBpbnN0YW5jZSBwcmVwYXNzLiAqL1xuICBjdWxsaW5nSWQ6IG51bWJlcjtcbiAgLyoqIFJldXNlZCBvYmplY3RzIG9mIHRoZSBvcGFxdWUgbXVsdGktZHJhdyByZW9yZGVyLCBzbyBhIHNvcnQgZG9lcyBub3QgYWxsb2NhdGUgcGVyIHByaW1pdGl2ZS4gKi9cbiAga2V5ZWRQcmltaXRpdmVzOiB7IHByaW1pdGl2ZTogUHJpbWl0aXZlIHwgbnVsbDsga2V5SWQ6IG51bWJlcjsgaW5kZXg6IG51bWJlciB9W107XG4gIC8qKiBXaGV0aGVyIHRoZSBsYXRlc3Qgc29ydCByYW4gd2l0aCBHUFUgY3VsbGluZyBhY3RpdmUgKHNlZSBgX2lzR3B1Q3VsbGluZ0FjdGl2ZWApOyB1bmRlZmluZWQgYmVmb3JlIHRoZSBmaXJzdC4gKi9cbiAgaXNHcHVDdWxsaW5nQWN0aXZlOiBib29sZWFuIHwgdW5kZWZpbmVkO1xuICAvKiogYENvbmZpZy5pc0NvbXB1dGVTa2lubmluZ0VuYWJsZWRgIG9mIHRoZSBsYXRlc3Qgc29ydDsgdW5kZWZpbmVkIGJlZm9yZSB0aGUgZmlyc3QuICovXG4gIGlzQ29tcHV0ZVNraW5uaW5nRW5hYmxlZDogYm9vbGVhbiB8IHVuZGVmaW5lZDtcbiAgLyoqXG4gICAqIFRoZSBjdWxsZWQgbWVzaCBjb21wb25lbnRzIG9mIHRoZSBsYXRlc3QgY3VsbGluZyB3aG9zZSBtZXNoIGlzIHNoYXJlZCBieSBvdGhlciBpbnN0YW5jZXMuIFRoZWlyIHByaW1pdGl2ZXMgYXJlXG4gICAqIHN0aWxsIGRyYXduIHdoZW4gYW5vdGhlciBpbnN0YW5jZSBvZiB0aGUgbWVzaCBpcyB2aXNpYmxlIChzZWUgYF9fYXBwZW5kUHJpbWl0aXZlc09mQ3VsbGVkSW5zdGFuY2VkTWVzaGVzYCkuXG4gICAqL1xuICBjdWxsZWRJbnN0YW5jZWRNZXNoQ29tcG9uZW50czogTWVzaENvbXBvbmVudFtdO1xuICAvKiogUGVyLW1lc2ggc3RhbXA7IHRoZSBwcmltaXRpdmVzIG9mIHRoZSBtZXNoIHdlcmUgYXBwZW5kZWQgYnkgdGhlIGxhdGVzdCBjdWxsaW5nIHdoaWxlIGl0IGVxdWFscyBgY3VsbFRpY2tgLiAqL1xuICBtZXNoQXBwZW5kVGljazogV2Vha01hcDxvYmplY3QsIG51bWJlcj47XG59O1xuXG4vKipcbiAqIEN1bGxpbmcgcmVzdWx0IG9mIGEgcmVuZGVyIHBhc3MgZm9yIHBlci1pbnN0YW5jZSBjdWxsaW5nIG9mIGluc3RhbmNlZCBkcmF3IGNhbGxzLlxuICogQW4gZW50aXR5IHdhcyBjdWxsZWQgaW4gdGhlIHJlbmRlciBwYXNzIHdoaWxlIGBjdWxsZWRFbnRpdHlTdGFtcFtlbnRpdHlVSURdID09PSBjdWxsVGlja2AuXG4gKi9cbmV4cG9ydCB0eXBlIEluc3RhbmNlQ3VsbGluZ1N0YXRlID0ge1xuICByZWFkb25seSBjdWxsZWRFbnRpdHlTdGFtcDogVWludDMyQXJyYXk7XG4gIHJlYWRvbmx5IGN1bGxUaWNrOiBudW1iZXI7XG4gIC8qKiBOdW1iZXIgb2YgZW50aXRpZXMgY3VsbGVkIGJ5IHRoZSBsYXRlc3QgY3VsbGluZy4gMCBtZWFucyBldmVyeSBpbnN0YW5jZSBzdGF5cyB2aXNpYmxlLiAqL1xuICByZWFkb25seSBjdWxsZWRFbnRpdHlDb3VudDogbnVtYmVyO1xuICAvKiogR2xvYmFsbHkgdW5pcXVlIGlkIG9mIHRoZSBsYXRlc3QgY3VsbGluZy4gKi9cbiAgcmVhZG9ubHkgY3VsbGluZ0lkOiBudW1iZXI7XG59O1xuXG4vKipcbiAqIE1lc2hSZW5kZXJlckNvbXBvbmVudCBpcyBhIGNvbXBvbmVudCB0aGF0IG1hbmFnZXMgdGhlIHJlbmRlcmluZyBvZiBhIG1lc2ggZW50aXR5LlxuICogSXQgaGFuZGxlcyBtZXNoIHJlbmRlcmluZyBwaXBlbGluZSwgSUJMIChJbWFnZS1CYXNlZCBMaWdodGluZykgY3ViZSBtYXBzLCBmcnVzdHVtIGN1bGxpbmcsXG4gKiBhbmQgcmVuZGVyaW5nIG9wdGltaXphdGlvbiB0aHJvdWdoIHZhcmlvdXMgc3RyYXRlZ2llcy5cbiAqL1xuZXhwb3J0IGNsYXNzIE1lc2hSZW5kZXJlckNvbXBvbmVudCBleHRlbmRzIENvbXBvbmVudCB7XG4gIHByaXZhdGUgX19kaWZmdXNlQ3ViZU1hcD86IEN1YmVUZXh0dXJlIHwgUmVuZGVyVGFyZ2V0VGV4dHVyZUN1YmU7XG4gIHByaXZhdGUgX19zcGVjdWxhckN1YmVNYXA/OiBDdWJlVGV4dHVyZSB8IFJlbmRlclRhcmdldFRleHR1cmVDdWJlO1xuICBwcml2YXRlIF9fc2hlZW5DdWJlTWFwPzogQ3ViZVRleHR1cmUgfCBSZW5kZXJUYXJnZXRUZXh0dXJlQ3ViZTtcbiAgcHJpdmF0ZSBfX2RpZmZ1c2VDdWJlTWFwQ29udHJpYnV0aW9uID0gMS4wO1xuICBwcml2YXRlIF9fc3BlY3VsYXJDdWJlTWFwQ29udHJpYnV0aW9uID0gMS4wO1xuICBwcml2YXRlIF9fcm90YXRpb25PZkN1YmVNYXAgPSAwO1xuXG4gIHByaXZhdGUgc3RhdGljIF9fY2dBcGlSZW5kZXJpbmdTdHJhdGVneU1hcDogTWFwPE9iamVjdFVJRCwgQ0dBUElTdHJhdGVneT4gPSBuZXcgTWFwKCk7XG4gIHN0YXRpYyBfX3NoYWRlclByb2dyYW1IYW5kbGVPZlByaW1pdGl2ZU9iamVjdFVpZHM6IE1hcDxPYmplY3RVSUQsIENHQVBJUmVzb3VyY2VIYW5kbGU+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIF9fdXBkYXRlQ291bnQgPSAwO1xuICBwcml2YXRlIHN0YXRpYyBfX3VwZGF0ZUNvdW50ID0gMDtcbiAgcHVibGljIHN0YXRpYyBfaXNGcnVzdHVtQ3VsbGluZ0VuYWJsZWQgPSB0cnVlO1xuICAvKiogTW9ub3RvbmljIGlkIG9mIHRoZSBsYXRlc3QgY3VsbGluZyBwYXNzLCB1c2VkIGFzIGEgcGVyLW1lc2ggdmlzaXQgc3RhbXAuICovXG4gIHByaXZhdGUgc3RhdGljIF9fY3VsbGluZ0lkQ291bnRlciA9IDA7XG5cbiAgcHJpdmF0ZSBfX2ZpbmdlclByaW50ID0gJyc7XG4gIHByaXZhdGUgX19maW5nZXJQcmludElkID0gMDtcbiAgLyoqXG4gICAqIEludGVybmVkIGlkcyBvZiBtZXNoIHJlbmRlcmVyIGZpbmdlcnByaW50cy4gVGhlIGZpbmdlcnByaW50IGNoYW5nZXMgb25seSB3aGVuIHRoZSBJQkwgY3ViZVxuICAgKiBtYXBzIGNoYW5nZSwgYW5kIHR3byBtZXNoIHJlbmRlcmVycyB3aXRoIHRoZSBzYW1lIGN1YmUgbWFwcyBtdXN0IHNoYXJlIGEgbXVsdGktZHJhdyBiYXRjaCxcbiAgICogc28gdGhlIGlkIGlzIGludGVybmVkIGJ5IHZhbHVlIGluc3RlYWQgb2YgYmVpbmcgdW5pcXVlIHBlciBjb21wb25lbnQuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2ZpbmdlclByaW50SWRzID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19uZXh0RmluZ2VyUHJpbnRJZCA9IDA7XG5cbiAgLyoqIFBlci1yZW5kZXItcGFzcyBzY3JhdGNoIGJ1ZmZlcnMgcmV1c2VkIGJ5IHNvcnRfJHJlbmRlciB0byBhdm9pZCBwZXItZnJhbWUgYWxsb2NhdGlvbnMuICovXG4gIHByaXZhdGUgc3RhdGljIF9fc29ydFNjcmF0Y2hNYXA6IFdlYWtNYXA8UmVuZGVyUGFzcywgTWVzaFJlbmRlcmVyU29ydFNjcmF0Y2g+ID0gbmV3IFdlYWtNYXAoKTtcblxuICAvKiogTWVtb2l6ZWQgcmVuZGVyaW5nIHN0cmF0ZWd5IGZvciBjb21tb25fJHByZXJlbmRlciAodGhlIGhvdCBwYXRoIHJ1bnMgb25jZSBwZXIgZnJhbWUpLiAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3ByZXJlbmRlclN0cmF0ZWd5RW5naW5lVWlkOiBPYmplY3RVSUQgPSAtMTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19wcmVyZW5kZXJTdHJhdGVneTogQ0dBUElTdHJhdGVneSB8IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNZXNoUmVuZGVyZXJDb21wb25lbnQgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBlbnRpdHlVaWQgLSBUaGUgdW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIGVudGl0eSB0aGlzIGNvbXBvbmVudCBiZWxvbmdzIHRvXG4gICAqIEBwYXJhbSBjb21wb25lbnRTaWQgLSBUaGUgY29tcG9uZW50J3Mgc3lzdGVtIGlkZW50aWZpZXJcbiAgICogQHBhcmFtIGVudGl0eVJlcG9zaXRvcnkgLSBUaGUgcmVwb3NpdG9yeSBtYW5hZ2luZyBlbnRpdGllc1xuICAgKiBAcGFyYW0gaXNSZVVzZSAtIFdoZXRoZXIgdGhpcyBjb21wb25lbnQgaXMgYmVpbmcgcmV1c2VkIGZyb20gYSBwb29sXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBlbnRpdHlVaWQ6IEVudGl0eVVJRCxcbiAgICBjb21wb25lbnRTaWQ6IENvbXBvbmVudFNJRCxcbiAgICBlbnRpdHlSZXBvc2l0b3J5OiBFbnRpdHlSZXBvc2l0b3J5LFxuICAgIGlzUmVVc2U6IGJvb2xlYW5cbiAgKSB7XG4gICAgc3VwZXIoZW5naW5lLCBlbnRpdHlVaWQsIGNvbXBvbmVudFNpZCwgZW50aXR5UmVwb3NpdG9yeSwgaXNSZVVzZSk7XG4gICAgdGhpcy5jYWxjRmluZ2VyUHJpbnQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb21wb25lbnQgdHlwZSBJRCBmb3IgTWVzaFJlbmRlcmVyQ29tcG9uZW50LlxuICAgKiBAcmV0dXJucyBUaGUgY29tcG9uZW50IHR5cGUgSURcbiAgICovXG4gIHN0YXRpYyBnZXQgY29tcG9uZW50VElEKCkge1xuICAgIHJldHVybiBXZWxsS25vd25Db21wb25lbnRUSURzLk1lc2hSZW5kZXJlckNvbXBvbmVudFRJRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb21wb25lbnQgdHlwZSBJRCBmb3IgdGhpcyBpbnN0YW5jZS5cbiAgICogQHJldHVybnMgVGhlIGNvbXBvbmVudCB0eXBlIElEXG4gICAqL1xuICBnZXQgY29tcG9uZW50VElEKCk6IENvbXBvbmVudFRJRCB7XG4gICAgcmV0dXJuIFdlbGxLbm93bkNvbXBvbmVudFRJRHMuTWVzaFJlbmRlcmVyQ29tcG9uZW50VElEO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGRpZmZ1c2UgY3ViZSBtYXAgdXNlZCBmb3IgSUJMIGxpZ2h0aW5nLlxuICAgKiBAcmV0dXJucyBUaGUgZGlmZnVzZSBjdWJlIG1hcCB0ZXh0dXJlIG9yIHVuZGVmaW5lZCBpZiBub3Qgc2V0XG4gICAqL1xuICBnZXQgZGlmZnVzZUN1YmVNYXAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19kaWZmdXNlQ3ViZU1hcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzcGVjdWxhciBjdWJlIG1hcCB1c2VkIGZvciBJQkwgbGlnaHRpbmcuXG4gICAqIEByZXR1cm5zIFRoZSBzcGVjdWxhciBjdWJlIG1hcCB0ZXh0dXJlIG9yIHVuZGVmaW5lZCBpZiBub3Qgc2V0XG4gICAqL1xuICBnZXQgc3BlY3VsYXJDdWJlTWFwKCkge1xuICAgIHJldHVybiB0aGlzLl9fc3BlY3VsYXJDdWJlTWFwO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHNoZWVuIGN1YmUgbWFwIHVzZWQgZm9yIElCTCBsaWdodGluZy5cbiAgICogQHJldHVybnMgVGhlIHNoZWVuIGN1YmUgbWFwIHRleHR1cmUgb3IgdW5kZWZpbmVkIGlmIG5vdCBzZXRcbiAgICovXG4gIGdldCBzaGVlbkN1YmVNYXAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19zaGVlbkN1YmVNYXA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdXBkYXRlIGNvdW50IGZvciB0aGlzIGNvbXBvbmVudCBpbnN0YW5jZS5cbiAgICogQHJldHVybnMgVGhlIGN1cnJlbnQgdXBkYXRlIGNvdW50XG4gICAqL1xuICBnZXQgdXBkYXRlQ291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX191cGRhdGVDb3VudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBnbG9iYWwgdXBkYXRlIGNvdW50IGZvciBhbGwgTWVzaFJlbmRlcmVyQ29tcG9uZW50IGluc3RhbmNlcy5cbiAgICogQHJldHVybnMgVGhlIGdsb2JhbCB1cGRhdGUgY291bnRcbiAgICovXG4gIHN0YXRpYyBnZXQgdXBkYXRlQ291bnQoKSB7XG4gICAgcmV0dXJuIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX3VwZGF0ZUNvdW50O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNvbnRyaWJ1dGlvbiBmYWN0b3IgZm9yIHRoZSBkaWZmdXNlIGN1YmUgbWFwIGluIElCTCBjYWxjdWxhdGlvbnMuXG4gICAqIEByZXR1cm5zIFRoZSBkaWZmdXNlIGN1YmUgbWFwIGNvbnRyaWJ1dGlvbiBmYWN0b3IgKDAuMCB0byAxLjApXG4gICAqL1xuICBnZXQgZGlmZnVzZUN1YmVNYXBDb250cmlidXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX19kaWZmdXNlQ3ViZU1hcENvbnRyaWJ1dGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjb250cmlidXRpb24gZmFjdG9yIGZvciB0aGUgZGlmZnVzZSBjdWJlIG1hcCBpbiBJQkwgY2FsY3VsYXRpb25zLlxuICAgKiBAcGFyYW0gY29udHJpYnV0aW9uIC0gVGhlIGNvbnRyaWJ1dGlvbiBmYWN0b3IgKDAuMCB0byAxLjApXG4gICAqL1xuICBzZXQgZGlmZnVzZUN1YmVNYXBDb250cmlidXRpb24oY29udHJpYnV0aW9uOiBudW1iZXIpIHtcbiAgICB0aGlzLl9fZGlmZnVzZUN1YmVNYXBDb250cmlidXRpb24gPSBjb250cmlidXRpb247XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb250cmlidXRpb24gZmFjdG9yIGZvciB0aGUgc3BlY3VsYXIgY3ViZSBtYXAgaW4gSUJMIGNhbGN1bGF0aW9ucy5cbiAgICogQHJldHVybnMgVGhlIHNwZWN1bGFyIGN1YmUgbWFwIGNvbnRyaWJ1dGlvbiBmYWN0b3IgKDAuMCB0byAxLjApXG4gICAqL1xuICBnZXQgc3BlY3VsYXJDdWJlTWFwQ29udHJpYnV0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9fc3BlY3VsYXJDdWJlTWFwQ29udHJpYnV0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGNvbnRyaWJ1dGlvbiBmYWN0b3IgZm9yIHRoZSBzcGVjdWxhciBjdWJlIG1hcCBpbiBJQkwgY2FsY3VsYXRpb25zLlxuICAgKiBAcGFyYW0gY29udHJpYnV0aW9uIC0gVGhlIGNvbnRyaWJ1dGlvbiBmYWN0b3IgKDAuMCB0byAxLjApXG4gICAqL1xuICBzZXQgc3BlY3VsYXJDdWJlTWFwQ29udHJpYnV0aW9uKGNvbnRyaWJ1dGlvbjogbnVtYmVyKSB7XG4gICAgdGhpcy5fX3NwZWN1bGFyQ3ViZU1hcENvbnRyaWJ1dGlvbiA9IGNvbnRyaWJ1dGlvbjtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHJvdGF0aW9uIGFuZ2xlIG9mIHRoZSBjdWJlIG1hcCBpbiByYWRpYW5zLlxuICAgKiBAcmV0dXJucyBUaGUgcm90YXRpb24gYW5nbGUgaW4gcmFkaWFuc1xuICAgKi9cbiAgZ2V0IHJvdGF0aW9uT2ZDdWJlTWFwKCkge1xuICAgIHJldHVybiB0aGlzLl9fcm90YXRpb25PZkN1YmVNYXA7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcm90YXRpb24gYW5nbGUgb2YgdGhlIGN1YmUgbWFwIGluIHJhZGlhbnMuXG4gICAqIEBwYXJhbSByb3RhdGlvbiAtIFRoZSByb3RhdGlvbiBhbmdsZSBpbiByYWRpYW5zXG4gICAqL1xuICBzZXQgcm90YXRpb25PZkN1YmVNYXAocm90YXRpb246IG51bWJlcikge1xuICAgIHRoaXMuX19yb3RhdGlvbk9mQ3ViZU1hcCA9IHJvdGF0aW9uO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyBhbmQgdXBkYXRlcyB0aGUgZmluZ2VycHJpbnQgZm9yIHRoaXMgY29tcG9uZW50IGJhc2VkIG9uIGN1cnJlbnQgY3ViZSBtYXAgc2V0dGluZ3MuXG4gICAqIFRoZSBmaW5nZXJwcmludCBpcyB1c2VkIGZvciBjYWNoaW5nIGFuZCBvcHRpbWl6YXRpb24gcHVycG9zZXMuXG4gICAqL1xuICBjYWxjRmluZ2VyUHJpbnQoKSB7XG4gICAgdGhpcy5fX2ZpbmdlclByaW50ID0gYCR7dGhpcy5fX2RpZmZ1c2VDdWJlTWFwICE9IG51bGwgPyB0aGlzLl9fZGlmZnVzZUN1YmVNYXAudGV4dHVyZVVJRCA6IC0xfSAke3RoaXMuX19zcGVjdWxhckN1YmVNYXAgIT0gbnVsbCA/IHRoaXMuX19zcGVjdWxhckN1YmVNYXAudGV4dHVyZVVJRCA6IC0xfSAke3RoaXMuX19zaGVlbkN1YmVNYXAgIT0gbnVsbCA/IHRoaXMuX19zaGVlbkN1YmVNYXAudGV4dHVyZVVJRCA6IC0xfWA7XG4gICAgdGhpcy5fX2ZpbmdlclByaW50SWQgPSBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19pbnRlcm5GaW5nZXJQcmludElkKHRoaXMuX19maW5nZXJQcmludCk7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2ludGVybkZpbmdlclByaW50SWQoZmluZ2VyUHJpbnQ6IHN0cmluZyk6IG51bWJlciB7XG4gICAgbGV0IGlkID0gTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fZmluZ2VyUHJpbnRJZHMuZ2V0KGZpbmdlclByaW50KTtcbiAgICBpZiAoaWQgPT0gbnVsbCkge1xuICAgICAgaWQgPSArK01lc2hSZW5kZXJlckNvbXBvbmVudC5fX25leHRGaW5nZXJQcmludElkO1xuICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fZmluZ2VyUHJpbnRJZHMuc2V0KGZpbmdlclByaW50LCBpZCk7XG4gICAgfVxuICAgIHJldHVybiBpZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IGZpbmdlcnByaW50IG9mIHRoaXMgY29tcG9uZW50LlxuICAgKiBAcmV0dXJucyBUaGUgZmluZ2VycHJpbnQgc3RyaW5nXG4gICAqL1xuICBnZXRGaW5nZXJQcmludCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2ZpbmdlclByaW50O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludGVybmVkIG51bWVyaWMgaWQgb2YgdGhlIGZpbmdlcnByaW50LiBOdW1lcmljIGlkcyBrZWVwIHRoZSBwZXItZnJhbWVcbiAgICogbXVsdGktZHJhdyBzdGF0ZSBrZXlzIGNoZWFwIHRvIGNvbXBhcmUuXG4gICAqIEByZXR1cm5zIFRoZSBmaW5nZXJwcmludCBpZFxuICAgKi9cbiAgZ2V0RmluZ2VyUHJpbnRJZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2ZpbmdlclByaW50SWQ7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgSUJMIChJbWFnZS1CYXNlZCBMaWdodGluZykgY3ViZSBtYXBzIGZvciB0aGlzIG1lc2ggcmVuZGVyZXIuXG4gICAqIEBwYXJhbSBkaWZmdXNlQ3ViZVRleHR1cmUgLSBUaGUgZGlmZnVzZSBjdWJlIG1hcCB0ZXh0dXJlIGZvciBJQkxcbiAgICogQHBhcmFtIHNwZWN1bGFyQ3ViZVRleHR1cmUgLSBUaGUgc3BlY3VsYXIgY3ViZSBtYXAgdGV4dHVyZSBmb3IgSUJMXG4gICAqIEBwYXJhbSBzaGVlbkN1YmVUZXh0dXJlIC0gT3B0aW9uYWwgc2hlZW4gY3ViZSBtYXAgdGV4dHVyZSBmb3IgSUJMXG4gICAqL1xuICBzZXRJQkxDdWJlTWFwKFxuICAgIGRpZmZ1c2VDdWJlVGV4dHVyZTogQ3ViZVRleHR1cmUgfCBSZW5kZXJUYXJnZXRUZXh0dXJlQ3ViZSxcbiAgICBzcGVjdWxhckN1YmVUZXh0dXJlOiBDdWJlVGV4dHVyZSB8IFJlbmRlclRhcmdldFRleHR1cmVDdWJlLFxuICAgIHNoZWVuQ3ViZVRleHR1cmU/OiBDdWJlVGV4dHVyZSB8IFJlbmRlclRhcmdldFRleHR1cmVDdWJlXG4gICkge1xuICAgIGlmIChkaWZmdXNlQ3ViZVRleHR1cmUgPT0gbnVsbCB8fCBzcGVjdWxhckN1YmVUZXh0dXJlID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9fZGlmZnVzZUN1YmVNYXAgPSBkaWZmdXNlQ3ViZVRleHR1cmU7XG4gICAgdGhpcy5fX3NwZWN1bGFyQ3ViZU1hcCA9IHNwZWN1bGFyQ3ViZVRleHR1cmU7XG4gICAgdGhpcy5fX3NoZWVuQ3ViZU1hcCA9IHNoZWVuQ3ViZVRleHR1cmU7XG5cbiAgICB0aGlzLmNhbGNGaW5nZXJQcmludCgpO1xuXG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21tb24gbG9hZGluZyBtZXRob2QgdGhhdCBpbml0aWFsaXplcyB0aGUgcmVuZGVyaW5nIHN0cmF0ZWd5IGJhc2VkIG9uIHRoZSBwcm9jZXNzIGFwcHJvYWNoLlxuICAgKiBUaGlzIG1ldGhvZCBzZXRzIHVwIGVpdGhlciBXZWJHUFUgb3IgV2ViR0wgcmVuZGVyaW5nIHN0cmF0ZWdpZXMuXG4gICAqIEBwYXJhbSBwcm9jZXNzQXBwcm9hY2ggLSBUaGUgZ3JhcGhpY3MgQVBJIGFwcHJvYWNoIHRvIHVzZSAoV2ViR1BVIG9yIFdlYkdMKVxuICAgKi9cbiAgc3RhdGljIGNvbW1vbl8kbG9hZCh7IHByb2Nlc3NBcHByb2FjaCwgZW5naW5lIH06IHsgcHJvY2Vzc0FwcHJvYWNoOiBQcm9jZXNzQXBwcm9hY2hFbnVtOyBlbmdpbmU6IEVuZ2luZSB9KSB7XG4gICAgY29uc3QgbW9kdWxlTWFuYWdlciA9IE1vZHVsZU1hbmFnZXIuZ2V0SW5zdGFuY2UoKTtcbiAgICBjb25zdCBlbmdpbmVVaWQgPSBlbmdpbmUub2JqZWN0VUlEO1xuXG4gICAgLy8gU3RyYXRlZ3lcbiAgICBpZiAocHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICBjb25zdCBtb2R1bGVOYW1lID0gJ3dlYmdwdSc7XG4gICAgICBjb25zdCB3ZWJncHVNb2R1bGUgPSBtb2R1bGVNYW5hZ2VyLmdldE1vZHVsZShtb2R1bGVOYW1lKSEgYXMgUm5XZWJHcHU7XG4gICAgICBpZiAoIU1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2NnQXBpUmVuZGVyaW5nU3RyYXRlZ3lNYXAuaGFzKGVuZ2luZVVpZCkpIHtcbiAgICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fY2dBcGlSZW5kZXJpbmdTdHJhdGVneU1hcC5zZXQoZW5naW5lVWlkLCB3ZWJncHVNb2R1bGUuV2ViR3B1U3RyYXRlZ3lCYXNpYy5pbml0KGVuZ2luZSkpO1xuICAgICAgfVxuICAgICAgKE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2NnQXBpUmVuZGVyaW5nU3RyYXRlZ3lNYXAuZ2V0KGVuZ2luZVVpZCkgYXMgV2ViR3B1U3RyYXRlZ3lCYXNpYykuY29tbW9uXyRsb2FkKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG1vZHVsZU5hbWUgPSAnd2ViZ2wnO1xuICAgICAgY29uc3Qgd2ViZ2xNb2R1bGUgPSBtb2R1bGVNYW5hZ2VyLmdldE1vZHVsZShtb2R1bGVOYW1lKSEgYXMgUm5XZWJHTDtcbiAgICAgIGlmICghTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fY2dBcGlSZW5kZXJpbmdTdHJhdGVneU1hcC5oYXMoZW5naW5lVWlkKSkge1xuICAgICAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19jZ0FwaVJlbmRlcmluZ1N0cmF0ZWd5TWFwLnNldChcbiAgICAgICAgICBlbmdpbmVVaWQsXG4gICAgICAgICAgd2ViZ2xNb2R1bGUuZ2V0UmVuZGVyaW5nU3RyYXRlZ3koZW5naW5lLCBwcm9jZXNzQXBwcm9hY2gpXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICAoTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fY2dBcGlSZW5kZXJpbmdTdHJhdGVneU1hcC5nZXQoZW5naW5lVWlkKSBhcyBXZWJHTFN0cmF0ZWd5KS5jb21tb25fJGxvYWQoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYW5kIGluaXRpYWxpemVzIHRoaXMgbWVzaCByZW5kZXJlciBjb21wb25lbnQuXG4gICAqIFNldHMgdXAgdGhlIGNvbXBvbmVudCBmb3IgcmVuZGVyaW5nIGJ5IGxvYWRpbmcgdGhlIGFzc29jaWF0ZWQgbWVzaC5cbiAgICovXG4gICRsb2FkKCkge1xuICAgIGNvbnN0IHN0cmF0ZWd5ID0gTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fY2dBcGlSZW5kZXJpbmdTdHJhdGVneU1hcC5nZXQodGhpcy5fX2VuZ2luZS5vYmplY3RVSUQpO1xuICAgIGNvbnN0IHJlYWR5ID0gc3RyYXRlZ3khLiRsb2FkKHRoaXMuZW50aXR5LnRyeVRvR2V0TWVzaCgpISk7XG4gICAgaWYgKHJlYWR5KSB7XG4gICAgICB0aGlzLm1vdmVTdGFnZVRvKFByb2Nlc3NTdGFnZS5Vbmtub3duKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU29ydHMgYW5kIGZpbHRlcnMgbWVzaCBjb21wb25lbnRzIGZvciByZW5kZXJpbmcgYmFzZWQgb24gY2FtZXJhIGZydXN0dW0gYW5kIG1hdGVyaWFsIHByb3BlcnRpZXMuXG4gICAqIFBlcmZvcm1zIGZydXN0dW0gY3VsbGluZyBhbmQgc29ydHMgcHJpbWl0aXZlcyBieSByZW5kZXIgb3JkZXIgYW5kIGRlcHRoLlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gcmVuZGVyUGFzcyAtIFRoZSByZW5kZXIgcGFzcyBjb250YWluaW5nIG1lc2ggY29tcG9uZW50cyBhbmQgcmVuZGVyaW5nIGNvbnRleHRcbiAgICogQHJldHVybnMgQXJyYXkgb2YgcHJpbWl0aXZlIFVJRHMgc29ydGVkIGZvciBvcHRpbWFsIHJlbmRlcmluZ1xuICAgKi9cbiAgc3RhdGljIHNvcnRfJHJlbmRlcihlbmdpbmU6IEVuZ2luZSwgcmVuZGVyUGFzczogUmVuZGVyUGFzcyk6IENvbXBvbmVudFNJRFtdIHtcbiAgICBjb25zdCB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeSA9IGVuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBjb25zdCBtdWx0aURyYXdHcm91cFZlcnNpb24gPVxuICAgICAgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkgIT0gbnVsbCA/IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmdldE11bHRpRHJhd1JlcG9zaXRvcnkoZW5naW5lKS52ZXJzaW9uIDogMDtcbiAgICBjb25zdCBzY3JhdGNoID0gTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fZ2V0U29ydFNjcmF0Y2gocmVuZGVyUGFzcyk7XG4gICAgY29uc3QgaXNHcHVDdWxsaW5nQWN0aXZlID0gTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9pc0dwdUN1bGxpbmdBY3RpdmUoZW5naW5lLCByZW5kZXJQYXNzKTtcbiAgICBpZiAoXG4gICAgICBUcmFuc2Zvcm1Db21wb25lbnQuZ2V0VXBkYXRlQ291bnQoZW5naW5lKSA9PT0gcmVuZGVyUGFzcy5fbGFzdFRyYW5zZm9ybUNvbXBvbmVudHNVcGRhdGVDb3VudCAmJlxuICAgICAgX2dldENhbWVyYUNvbnRyb2xsZXJVcGRhdGVDb3VudChlbmdpbmUpID09PSByZW5kZXJQYXNzLl9sYXN0Q2FtZXJhQ29udHJvbGxlckNvbXBvbmVudHNVcGRhdGVDb3VudCAmJlxuICAgICAgU2NlbmVHcmFwaENvbXBvbmVudC5nZXRVcGRhdGVDb3VudChlbmdpbmUpID09PSByZW5kZXJQYXNzLl9sYXN0U2NlbmVHcmFwaENvbXBvbmVudHNVcGRhdGVDb3VudCAmJlxuICAgICAgbXVsdGlEcmF3R3JvdXBWZXJzaW9uID09PSByZW5kZXJQYXNzLl9sYXN0TXVsdGlEcmF3R3JvdXBWZXJzaW9uICYmXG4gICAgICBpc0dwdUN1bGxpbmdBY3RpdmUgPT09IHNjcmF0Y2guaXNHcHVDdWxsaW5nQWN0aXZlICYmXG4gICAgICBlbmdpbmUuY29uZmlnLmlzQ29tcHV0ZVNraW5uaW5nRW5hYmxlZCA9PT0gc2NyYXRjaC5pc0NvbXB1dGVTa2lubmluZ0VuYWJsZWRcbiAgICApIHtcbiAgICAgIHJldHVybiByZW5kZXJQYXNzLl9sYXN0UHJpbWl0aXZlVWlkcztcbiAgICB9XG4gICAgc2NyYXRjaC5pc0dwdUN1bGxpbmdBY3RpdmUgPSBpc0dwdUN1bGxpbmdBY3RpdmU7XG4gICAgLy8gTWVzaC5faXNHcHVDdWxsYWJsZSBvZiB0aGUgZGVmb3JtZWQgbWVzaGVzIGRlcGVuZHMgb24gaXQuXG4gICAgc2NyYXRjaC5pc0NvbXB1dGVTa2lubmluZ0VuYWJsZWQgPSBlbmdpbmUuY29uZmlnLmlzQ29tcHV0ZVNraW5uaW5nRW5hYmxlZDtcblxuICAgIC8vIGdldCBDYW1lcmFDb21wb25lbnRcbiAgICBsZXQgY2FtZXJhQ29tcG9uZW50ID0gcmVuZGVyUGFzcy5jYW1lcmFDb21wb25lbnQ7XG4gICAgLy8gSWYgdGhlIHJlbmRlclBhc3MgZG9lc24ndCBoYXZlIGEgY2FtZXJhQ29tcG9uZW50LCB0aGVuIHdlIGdldCBpdCBvZiB0aGUgbWFpbiBjYW1lcmFcbiAgICBpZiAoY2FtZXJhQ29tcG9uZW50ID09IG51bGwpIHtcbiAgICAgIGNhbWVyYUNvbXBvbmVudCA9IGVuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudChcbiAgICAgICAgQ2FtZXJhQ29tcG9uZW50LFxuICAgICAgICBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudChlbmdpbmUpXG4gICAgICApIGFzIENhbWVyYUNvbXBvbmVudDtcbiAgICB9XG4gICAgaWYgKGNhbWVyYUNvbXBvbmVudCA9PSBudWxsKSB7XG4gICAgICBjb25zdCBjYW1lcmFDb21wb25lbnRzID0gZW5naW5lLmNvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50c1dpdGhUeXBlKENhbWVyYUNvbXBvbmVudCkgYXMgQ2FtZXJhQ29tcG9uZW50W107XG4gICAgICBjYW1lcmFDb21wb25lbnQgPSBjYW1lcmFDb21wb25lbnRzLmZpbmQoYyA9PiBjPy5faXNBbGl2ZSkhO1xuICAgICAgQ2FtZXJhQ29tcG9uZW50LnNldEN1cnJlbnQoZW5naW5lLCBjYW1lcmFDb21wb25lbnQuY29tcG9uZW50U0lEKTtcbiAgICB9XG4gICAgaWYgKHJlbmRlclBhc3MuaXNWclJlbmRlcmluZykge1xuICAgICAgY29uc3Qgd2VieHJTeXN0ZW0gPSBlbmdpbmUuX3dlYlhSU3lzdGVtSWZFbmFibGVkO1xuICAgICAgaWYgKHdlYnhyU3lzdGVtPy5pc1dlYlhSTW9kZSkge1xuICAgICAgICBjYW1lcmFDb21wb25lbnQgPSB3ZWJ4clN5c3RlbS5fZ2V0Q2FtZXJhQ29tcG9uZW50QXQoMCkgYXMgQ2FtZXJhQ29tcG9uZW50O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZydXN0dW1DdWxsaW5nICh3cml0ZXMgaW50byB0aGUgcmV1c2FibGUgcGVyLXJlbmRlci1wYXNzIHNjcmF0Y2ggYXJyYXkpXG4gICAgY29uc3QgcHJpbWl0aXZlcyA9IE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2N1bGxpbmdXaXRoVmlld0ZydXN0dW0oXG4gICAgICBjYW1lcmFDb21wb25lbnQsXG4gICAgICByZW5kZXJQYXNzLl9vcHRpbWl6ZWRNZXNoQ29tcG9uZW50cyxcbiAgICAgIHNjcmF0Y2gucHJpbWl0aXZlcyxcbiAgICAgIHNjcmF0Y2gsXG4gICAgICBpc0dwdUN1bGxpbmdBY3RpdmVcbiAgICApO1xuXG4gICAgLy8gQWZ0ZXIgRnJ1c3R1bSBDdWxsaW5nLCByZW1vdmUgZHVwbGljYXRlZCBQcmltaXRpdmVzXG4gICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fcmVtb3ZlRHVwbGljYXRlZFByaW1pdGl2ZXMocHJpbWl0aXZlcywgc2NyYXRjaCk7XG5cbiAgICAvLyBTb3J0IGJ5IHNvcnRrZXlcbiAgICBpZiAocHJpbWl0aXZlcy5sZW5ndGggPiAxKSB7XG4gICAgICBwcmltaXRpdmVzLnNvcnQoTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fY29tcGFyZVByaW1pdGl2ZXMpO1xuICAgIH1cblxuICAgIGxldCBfbGFzdE9wYXF1ZUluZGV4ID0gcHJpbWl0aXZlcy5sZW5ndGggLSAxO1xuICAgIGxldCBfbGFzdFRyYW5zbHVjZW50SW5kZXggPSBwcmltaXRpdmVzLmxlbmd0aCAtIDE7XG4gICAgbGV0IF9sYXN0QmxlbmRXaXRoWldyaXRlSW5kZXggPSBwcmltaXRpdmVzLmxlbmd0aCAtIDE7XG4gICAgbGV0IF9sYXN0QmxlbmRXaXRob3V0WldyaXRlSW5kZXggPSBwcmltaXRpdmVzLmxlbmd0aCAtIDE7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByaW1pdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHByaW1pdGl2ZSA9IHByaW1pdGl2ZXNbaV07XG4gICAgICBjb25zdCB0cmFuc2x1Y2VuY3kgPSBpc1RyYW5zbHVjZW50KHByaW1pdGl2ZSk7XG4gICAgICBpZiAodHJhbnNsdWNlbmN5KSB7XG4gICAgICAgIF9sYXN0T3BhcXVlSW5kZXggPSBpIC0gMTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjb25zdCBibGVuZFdpdGhaV3JpdGUgPSBpc0JsZW5kV2l0aFpXcml0ZShwcmltaXRpdmUpO1xuICAgICAgaWYgKGJsZW5kV2l0aFpXcml0ZSkge1xuICAgICAgICBfbGFzdE9wYXF1ZUluZGV4ID0gaSAtIDE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY29uc3QgYmxlbmRXaXRob3V0WldyaXRlID0gaXNCbGVuZFdpdGhvdXRaV3JpdGUocHJpbWl0aXZlKTtcbiAgICAgIGlmIChibGVuZFdpdGhvdXRaV3JpdGUpIHtcbiAgICAgICAgX2xhc3RPcGFxdWVJbmRleCA9IGkgLSAxO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gX2xhc3RPcGFxdWVJbmRleCArIDE7IGkgPCBwcmltaXRpdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBwcmltaXRpdmUgPSBwcmltaXRpdmVzW2ldO1xuICAgICAgY29uc3QgYmxlbmRXaXRoWldyaXRlID0gaXNCbGVuZFdpdGhaV3JpdGUocHJpbWl0aXZlKTtcbiAgICAgIGlmIChibGVuZFdpdGhaV3JpdGUpIHtcbiAgICAgICAgX2xhc3RUcmFuc2x1Y2VudEluZGV4ID0gaSAtIDE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY29uc3QgYmxlbmRXaXRob3V0WldyaXRlID0gaXNCbGVuZFdpdGhvdXRaV3JpdGUocHJpbWl0aXZlKTtcbiAgICAgIGlmIChibGVuZFdpdGhvdXRaV3JpdGUpIHtcbiAgICAgICAgX2xhc3RUcmFuc2x1Y2VudEluZGV4ID0gaSAtIDE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSBfbGFzdFRyYW5zbHVjZW50SW5kZXggKyAxOyBpIDwgcHJpbWl0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJpbWl0aXZlID0gcHJpbWl0aXZlc1tpXTtcbiAgICAgIGNvbnN0IGJsZW5kV2l0aG91dFpXcml0ZSA9IGlzQmxlbmRXaXRob3V0WldyaXRlKHByaW1pdGl2ZSk7XG4gICAgICBpZiAoYmxlbmRXaXRob3V0WldyaXRlKSB7XG4gICAgICAgIF9sYXN0QmxlbmRXaXRoWldyaXRlSW5kZXggPSBpIC0gMTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmVvcmRlciB0aGUgb3BhcXVlIHJhbmdlIGJ5IGVmZmVjdGl2ZSBtYXRlcmlhbCAoYW5kIG11bHRpLWRyYXcgZ3JvdXApIHNvIHRoYXRcbiAgICAvLyBjb25zZWN1dGl2ZSBkcmF3cyBzaGFyZSB0aGVpciBHUFUgc3RhdGUgYW5kIGNhbiBiZSBtZXJnZWQgYnkgV0VCR0xfbXVsdGlfZHJhdy5cbiAgICAvLyBPcGFxdWUgZHJhd3MgYXJlIGRlcHRoIHRlc3RlZCwgc28gdGhpcyByZW9yZGVyIGlzIHNhZmUuIFRyYW5zbHVjZW50L2JsZW5kIGJ1Y2tldHNcbiAgICAvLyBrZWVwIHRoZWlyIGRpc3RhbmNlIG9yZGVyLlxuICAgIGlmIChcbiAgICAgIF9sYXN0T3BhcXVlSW5kZXggPiAwICYmXG4gICAgICBlbmdpbmUuY29uZmlnLmlzTXVsdGlEcmF3RW5hYmxlZCAmJlxuICAgICAgUHJvY2Vzc0FwcHJvYWNoLmlzV2ViR0wyQXBwcm9hY2goZW5naW5lLmVuZ2luZVN0YXRlLmN1cnJlbnRQcm9jZXNzQXBwcm9hY2gpXG4gICAgKSB7XG4gICAgICBjb25zdCBvcGFxdWVDb3VudCA9IF9sYXN0T3BhcXVlSW5kZXggKyAxO1xuICAgICAgY29uc3Qga2V5ZWQgPSBzY3JhdGNoLmtleWVkUHJpbWl0aXZlcztcbiAgICAgIGlmIChrZXllZC5sZW5ndGggPCBvcGFxdWVDb3VudCkge1xuICAgICAgICBmb3IgKGxldCBpID0ga2V5ZWQubGVuZ3RoOyBpIDwgb3BhcXVlQ291bnQ7IGkrKykge1xuICAgICAgICAgIGtleWVkLnB1c2goeyBwcmltaXRpdmU6IG51bGwsIGtleUlkOiAwLCBpbmRleDogMCB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAga2V5ZWQubGVuZ3RoID0gb3BhcXVlQ291bnQ7XG4gICAgICB9XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9wYXF1ZUNvdW50OyBpKyspIHtcbiAgICAgICAgY29uc3QgcHJpbWl0aXZlID0gcHJpbWl0aXZlc1tpXTtcbiAgICAgICAgY29uc3QgbWF0ZXJpYWwgPSByZW5kZXJQYXNzLmdldEFwcHJvcHJpYXRlTWF0ZXJpYWwocHJpbWl0aXZlKTtcbiAgICAgICAgY29uc3QgZW50cnkgPSBrZXllZFtpXTtcbiAgICAgICAgZW50cnkucHJpbWl0aXZlID0gcHJpbWl0aXZlO1xuICAgICAgICBlbnRyeS5pbmRleCA9IGk7XG4gICAgICAgIGVudHJ5LmtleUlkID1cbiAgICAgICAgICBnZXRNdWx0aURyYXdTdGF0ZUtleUlkKHByaW1pdGl2ZSwgbWF0ZXJpYWwsIGdldFByaW1pdGl2ZU1lc2hSZW5kZXJlckZpbmdlclByaW50SWQocHJpbWl0aXZlKSkgPz9cbiAgICAgICAgICAtKG1hdGVyaWFsLm1hdGVyaWFsVUlEICsgMSk7XG4gICAgICB9XG4gICAgICBrZXllZC5zb3J0KChhLCBiKSA9PiBhLmtleUlkIC0gYi5rZXlJZCB8fCBhLmluZGV4IC0gYi5pbmRleCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9wYXF1ZUNvdW50OyBpKyspIHtcbiAgICAgICAgcHJpbWl0aXZlc1tpXSA9IGtleWVkW2ldLnByaW1pdGl2ZSE7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgcHJpbWl0aXZlVWlkcyA9IE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2NyZWF0ZVByaW1pdGl2ZVVpZHMocHJpbWl0aXZlcyk7XG5cbiAgICBsZXQgcmVzdWx0Q2hhbmdlZCA9IGZhbHNlO1xuICAgIGlmIChfbGFzdE9wYXF1ZUluZGV4ICE9PSByZW5kZXJQYXNzLl9sYXN0T3BhcXVlSW5kZXgpIHtcbiAgICAgIHJlbmRlclBhc3MuX2xhc3RPcGFxdWVJbmRleCA9IF9sYXN0T3BhcXVlSW5kZXg7XG4gICAgICByZXN1bHRDaGFuZ2VkIHx8PSB0cnVlO1xuICAgIH1cbiAgICBpZiAoX2xhc3RUcmFuc2x1Y2VudEluZGV4ICE9PSByZW5kZXJQYXNzLl9sYXN0VHJhbnNsdWNlbnRJbmRleCkge1xuICAgICAgcmVuZGVyUGFzcy5fbGFzdFRyYW5zbHVjZW50SW5kZXggPSBfbGFzdFRyYW5zbHVjZW50SW5kZXg7XG4gICAgICByZXN1bHRDaGFuZ2VkIHx8PSB0cnVlO1xuICAgIH1cbiAgICBpZiAoX2xhc3RCbGVuZFdpdGhaV3JpdGVJbmRleCAhPT0gcmVuZGVyUGFzcy5fbGFzdEJsZW5kV2l0aFpXcml0ZUluZGV4KSB7XG4gICAgICByZW5kZXJQYXNzLl9sYXN0QmxlbmRXaXRoWldyaXRlSW5kZXggPSBfbGFzdEJsZW5kV2l0aFpXcml0ZUluZGV4O1xuICAgICAgcmVzdWx0Q2hhbmdlZCB8fD0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKF9sYXN0QmxlbmRXaXRob3V0WldyaXRlSW5kZXggIT09IHJlbmRlclBhc3MuX2xhc3RCbGVuZFdpdGhvdXRaV3JpdGVJbmRleCkge1xuICAgICAgcmVuZGVyUGFzcy5fbGFzdEJsZW5kV2l0aG91dFpXcml0ZUluZGV4ID0gX2xhc3RCbGVuZFdpdGhvdXRaV3JpdGVJbmRleDtcbiAgICAgIHJlc3VsdENoYW5nZWQgfHw9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHByaW1pdGl2ZVVpZHMubGVuZ3RoICE9PSByZW5kZXJQYXNzLl9sYXN0UHJpbWl0aXZlVWlkcy5sZW5ndGgpIHtcbiAgICAgIHJlc3VsdENoYW5nZWQgfHw9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIENoZWNrIGlmIGEgcHJpbWl0aXZlIG9yIHRoZSBvcmRlciBvZiB0aGUgcHJpbWl0aXZlcyBoYXMgY2hhbmdlZC4gQWxsIHRoZSByYW5nZXMgYXJlIGNvbXBhcmVkOiB0aGUgY3VsbGluZ1xuICAgICAgLy8gY2FuIHJlcGxhY2UgYW4gb3BhcXVlIHByaW1pdGl2ZSB3aXRoIGFub3RoZXIgb25lIHdoaWxlIHRoZSBjb3VudHMgc3RheSB0aGUgc2FtZSwgYW5kIHRoZSBXZWJHUFUgcmVuZGVyXG4gICAgICAvLyBidW5kbGVzIG11c3QgdGhlbiBiZSByZS1yZWNvcmRlZC5cbiAgICAgIGNvbnN0IGxhc3RQcmltaXRpdmVVaWRzID0gcmVuZGVyUGFzcy5fbGFzdFByaW1pdGl2ZVVpZHM7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByaW1pdGl2ZVVpZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHByaW1pdGl2ZVVpZHNbaV0gIT09IGxhc3RQcmltaXRpdmVVaWRzW2ldKSB7XG4gICAgICAgICAgcmVzdWx0Q2hhbmdlZCB8fD0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZW5kZXJQYXNzLl9pc0NoYW5nZWRTb3J0UmVuZGVyUmVzdWx0ID0gcmVzdWx0Q2hhbmdlZDtcblxuICAgIHJlbmRlclBhc3MuX2xhc3RQcmltaXRpdmVVaWRzID0gcHJpbWl0aXZlVWlkcztcbiAgICAvLyBUaGUgc2NyYXRjaCBhcnJheSBpcyBvbmx5IHJlZmlsbGVkIGJ5IHRoZSBuZXh0IHNvcnQsIHdoaWNoIGFsc28gcmVwbGFjZXNcbiAgICAvLyBgX2xhc3RQcmltaXRpdmVVaWRzYCwgc28gdGhlIHBhaXIgc3RheXMgY29uc2lzdGVudCBmb3IgdGhlIHJlbmRlciBzdHJhdGVnaWVzLlxuICAgIHJlbmRlclBhc3MuX2xhc3RQcmltaXRpdmVzID0gcHJpbWl0aXZlcztcblxuICAgIHJlbmRlclBhc3MuX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQgPSBUcmFuc2Zvcm1Db21wb25lbnQuZ2V0VXBkYXRlQ291bnQoZW5naW5lKTtcbiAgICByZW5kZXJQYXNzLl9sYXN0Q2FtZXJhQ29udHJvbGxlckNvbXBvbmVudHNVcGRhdGVDb3VudCA9IF9nZXRDYW1lcmFDb250cm9sbGVyVXBkYXRlQ291bnQoZW5naW5lKTtcbiAgICByZW5kZXJQYXNzLl9sYXN0U2NlbmVHcmFwaENvbXBvbmVudHNVcGRhdGVDb3VudCA9IFNjZW5lR3JhcGhDb21wb25lbnQuZ2V0VXBkYXRlQ291bnQoZW5naW5lKTtcbiAgICByZW5kZXJQYXNzLl9sYXN0TXVsdGlEcmF3R3JvdXBWZXJzaW9uID0gbXVsdGlEcmF3R3JvdXBWZXJzaW9uO1xuICAgIGlmIChyZXN1bHRDaGFuZ2VkKSB7XG4gICAgICByZW5kZXJQYXNzLl9yZW5kZXJlZFNvbWV0aGluZ0JlZm9yZSA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByaW1pdGl2ZVVpZHM7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgZnJ1c3R1bSBjdWxsaW5nIG9uIG1lc2ggY29tcG9uZW50cyB1c2luZyB0aGUgY2FtZXJhJ3MgdmlldyBmcnVzdHVtLlxuICAgKiBGaWx0ZXJzIG91dCBtZXNoIGNvbXBvbmVudHMgdGhhdCBhcmUgbm90IHZpc2libGUgZnJvbSB0aGUgY2FtZXJhJ3MgcGVyc3BlY3RpdmUuXG4gICAqIEBwYXJhbSBjYW1lcmFDb21wb25lbnQgLSBUaGUgY2FtZXJhIGNvbXBvbmVudCB1c2VkIGZvciBmcnVzdHVtIGN1bGxpbmdcbiAgICogQHBhcmFtIG1lc2hDb21wb25lbnRzIC0gQXJyYXkgb2YgbWVzaCBjb21wb25lbnRzIHRvIGJlIGN1bGxlZFxuICAgKiBAcGFyYW0gb3V0UHJpbWl0aXZlcyAtIFJldXNhYmxlIG91dHB1dCBhcnJheS4gSXQgaXMgY2xlYXJlZCBhbmQgZmlsbGVkIHdpdGggdGhlIHByaW1pdGl2ZXMgdGhhdCBwYXNzZWQgY3VsbGluZ1xuICAgKiBAcGFyYW0gc2NyYXRjaCAtIFRoZSBzY3JhdGNoIG9mIHRoZSByZW5kZXIgcGFzcy4gVGhlIGVudGl0aWVzIGN1bGxlZCBpbiB0aGlzIHBhc3MgYXJlIHN0YW1wZWQgaW50byBpdFxuICAgKiAgICAgICAgICAgICAgICAgIHNvIHRoYXQgaW5zdGFuY2VkIGRyYXcgY2FsbHMgY2FuIHNraXAgdGhlaXIgaW5zdGFuY2VzXG4gICAqIEBwYXJhbSBpc0dwdUN1bGxpbmdBY3RpdmUgLSBXaGV0aGVyIHRoZSByZW5kZXIgcGFzcyBjdWxscyBvbiB0aGUgR1BVIChzZWUgYF9pc0dwdUN1bGxpbmdBY3RpdmVgKS4gVGhlIHByaW1pdGl2ZXNcbiAgICogICAgICAgICAgICAgICAgICBvZiB0aGUgbWVzaGVzIGN1bGxlZCBvbiB0aGUgR1BVIGFyZSBrZXB0IHJlZ2FyZGxlc3Mgb2YgdGhlaXIgdmlzaWJpbGl0eSwgc28gdGhhdCB0aGUgcmVuZGVyXG4gICAqICAgICAgICAgICAgICAgICAgbGlzdCAoYW5kIHRoZSBXZWJHUFUgcmVuZGVyIGJ1bmRsZXMpIGRvZXMgbm90IGNoYW5nZSB3aGVuIHRoZSBjYW1lcmEgbW92ZXNcbiAgICogQHJldHVybnMgVGhlIGBvdXRQcmltaXRpdmVzYCBhcnJheSAoc2FtZSByZWZlcmVuY2UpIGZvciBjb252ZW5pZW5jZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19jdWxsaW5nV2l0aFZpZXdGcnVzdHVtKFxuICAgIGNhbWVyYUNvbXBvbmVudDogQ2FtZXJhQ29tcG9uZW50LFxuICAgIG1lc2hDb21wb25lbnRzOiBNZXNoQ29tcG9uZW50W10sXG4gICAgb3V0UHJpbWl0aXZlczogUHJpbWl0aXZlW10sXG4gICAgc2NyYXRjaDogTWVzaFJlbmRlcmVyU29ydFNjcmF0Y2gsXG4gICAgaXNHcHVDdWxsaW5nQWN0aXZlOiBib29sZWFuXG4gICk6IFByaW1pdGl2ZVtdIHtcbiAgICBvdXRQcmltaXRpdmVzLmxlbmd0aCA9IDA7XG5cbiAgICBsZXQgY3VsbFRpY2sgPSBzY3JhdGNoLmN1bGxUaWNrICsgMTtcbiAgICBpZiAoY3VsbFRpY2sgPT09IDB4ZmZmZmZmZmYpIHtcbiAgICAgIC8vIFdyYXAgYXJvdW5kOiBjbGVhciB0aGUgc3RhbXBzIHNvIHRoYXQgb2xkIHZhbHVlcyBjYW5ub3QgYmUgbWlzdGFrZW4gZm9yIHRoZSBjdXJyZW50IHRpY2suXG4gICAgICBzY3JhdGNoLmN1bGxlZEVudGl0eVN0YW1wLmZpbGwoMCk7XG4gICAgICBzY3JhdGNoLmhhbmRsZWRFbnRpdHlTdGFtcC5maWxsKDApO1xuICAgICAgc2NyYXRjaC5tZXNoQ3VsbFRpY2sgPSBuZXcgV2Vha01hcCgpO1xuICAgICAgc2NyYXRjaC5tZXNoQXBwZW5kVGljayA9IG5ldyBXZWFrTWFwKCk7XG4gICAgICBjdWxsVGljayA9IDE7XG4gICAgfVxuICAgIHNjcmF0Y2guY3VsbFRpY2sgPSBjdWxsVGljaztcbiAgICBzY3JhdGNoLmN1bGxlZEVudGl0eUNvdW50ID0gMDtcbiAgICBjb25zdCBjdWxsZWRJbnN0YW5jZWRNZXNoQ29tcG9uZW50cyA9IHNjcmF0Y2guY3VsbGVkSW5zdGFuY2VkTWVzaENvbXBvbmVudHM7XG4gICAgY3VsbGVkSW5zdGFuY2VkTWVzaENvbXBvbmVudHMubGVuZ3RoID0gMDtcbiAgICBzY3JhdGNoLmN1bGxpbmdJZCA9ICsrTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fY3VsbGluZ0lkQ291bnRlcjtcblxuICAgIC8vIEEgc2luZ2xlIHBhc3Mgb3ZlciB0aGUgbWVzaCBjb21wb25lbnRzOiBjdWxsLCB1cGRhdGUgdmlzaWJpbGl0eSBmbGFncyBhbmRcbiAgICAvLyBjb2xsZWN0IHByaW1pdGl2ZXMuIFRoZSBwcmV2aW91cyBpbXBsZW1lbnRhdGlvbiBhbGxvY2F0ZWQgYSBmaWx0ZXJlZCBhcnJheVxuICAgIC8vIGFuZCBhbiBpbm5lciBjbG9zdXJlIHBlciBjYWxsLlxuICAgIGNvbnN0IGlzRnJ1c3R1bUN1bGxpbmdFbmFibGVkID0gY2FtZXJhQ29tcG9uZW50ICE9IG51bGwgJiYgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9pc0ZydXN0dW1DdWxsaW5nRW5hYmxlZDtcbiAgICBsZXQgZnJ1c3R1bTogQ2FtZXJhQ29tcG9uZW50WydmcnVzdHVtJ10gfCB1bmRlZmluZWQ7XG4gICAgaWYgKGlzRnJ1c3R1bUN1bGxpbmdFbmFibGVkKSB7XG4gICAgICBjYW1lcmFDb21wb25lbnQudXBkYXRlRnJ1c3R1bSgpO1xuICAgICAgZnJ1c3R1bSA9IGNhbWVyYUNvbXBvbmVudC5mcnVzdHVtO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWVzaENvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG1lc2hDb21wb25lbnQgPSBtZXNoQ29tcG9uZW50c1tpXTtcbiAgICAgIGNvbnN0IHNjZW5lR3JhcGggPSBtZXNoQ29tcG9uZW50LmVudGl0eS5nZXRTY2VuZUdyYXBoKCk7XG4gICAgICBpZiAoIW1lc2hDb21wb25lbnQuX2lzQWxpdmUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBzY3JhdGNoLmhhbmRsZWRFbnRpdHlTdGFtcCA9IE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX3N0YW1wRW50aXR5KFxuICAgICAgICBzY3JhdGNoLmhhbmRsZWRFbnRpdHlTdGFtcCxcbiAgICAgICAgbWVzaENvbXBvbmVudC5lbnRpdHlVSUQsXG4gICAgICAgIGN1bGxUaWNrXG4gICAgICApO1xuICAgICAgaWYgKGlzR3B1Q3VsbGluZ0FjdGl2ZSAmJiBtZXNoQ29tcG9uZW50Lm1lc2g/Ll9pc0dwdUN1bGxhYmxlID09PSB0cnVlKSB7XG4gICAgICAgIC8vIEN1bGxlZCBwZXIgaW5zdGFuY2Ugb24gdGhlIEdQVSwgaW5jbHVkaW5nIHRoZSB2aXNpYmlsaXR5IGZsYWcgKFdlYkdwdUdwdUN1bGxpbmcpLlxuICAgICAgICBzY2VuZUdyYXBoLl9pc0N1bGxlZCA9IGZhbHNlO1xuICAgICAgICBjb25zdCBza2VsZXRhbCA9IG1lc2hDb21wb25lbnQuZW50aXR5LnRyeVRvR2V0U2tlbGV0YWwoKTtcbiAgICAgICAgaWYgKHNrZWxldGFsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAvLyBUaGUgam9pbnRzIG9mIGEgc2tlbGV0b24gb3V0c2lkZSBvZiB0aGUgdmlldyBhcmUgbm90IHVwZGF0ZWQgKFNrZWxldGFsQ29tcG9uZW50LiRsb2dpYykuIFRoaXMga2VlcHMgdGhlXG4gICAgICAgICAgLy8gYXBwcm94aW1hdGUgdGVzdCBvZiB0aGUgQ1BVIGN1bGxpbmcgZm9yIGl0OyB0aGUgR1BVIGN1bGxpbmcgZGVjaWRlcyBmcm9tIHRoZSBkZWZvcm1lZCBib3VuZGluZyBib3ggd2hldGhlclxuICAgICAgICAgIC8vIHRoZSBtZXNoIGlzIGRyYXduLlxuICAgICAgICAgIGxldCB2aXNpYmxlID0gc2NlbmVHcmFwaC5pc1Zpc2libGU7XG4gICAgICAgICAgaWYgKHZpc2libGUgJiYgZnJ1c3R1bSAhPSBudWxsICYmIG1lc2hDb21wb25lbnQuZW50aXR5LmdldFRhZ1ZhbHVlKCd0eXBlJykgIT09ICdiYWNrZ3JvdW5kLWFzc2V0cycpIHtcbiAgICAgICAgICAgIHZpc2libGUgPSBmcnVzdHVtLmN1bGxpbmcobWVzaENvbXBvbmVudCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHNrZWxldGFsLl9pc0N1bGxlZCA9ICF2aXNpYmxlO1xuICAgICAgICB9XG4gICAgICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2FwcGVuZFByaW1pdGl2ZXNPZk1lc2hDb21wb25lbnQobWVzaENvbXBvbmVudCwgY2FtZXJhQ29tcG9uZW50LCBvdXRQcmltaXRpdmVzKTtcbiAgICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fbWFya01lc2hBcHBlbmRlZChtZXNoQ29tcG9uZW50LCBzY3JhdGNoLCBjdWxsVGljayk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKCFzY2VuZUdyYXBoLmlzVmlzaWJsZSkge1xuICAgICAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19zdGFtcEN1bGxlZEVudGl0eShzY3JhdGNoLCBtZXNoQ29tcG9uZW50LmVudGl0eVVJRCwgY3VsbFRpY2spO1xuICAgICAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19kZWZlckN1bGxlZEluc3RhbmNlZE1lc2gobWVzaENvbXBvbmVudCwgc2NyYXRjaCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZnJ1c3R1bSAhPSBudWxsKSB7XG4gICAgICAgIGNvbnN0IGlzQmFja2dyb3VuZEFzc2V0ID0gbWVzaENvbXBvbmVudC5lbnRpdHkuZ2V0VGFnVmFsdWUoJ3R5cGUnKSA9PT0gJ2JhY2tncm91bmQtYXNzZXRzJztcbiAgICAgICAgY29uc3QgdmlzaWJsZSA9IGlzQmFja2dyb3VuZEFzc2V0ID8gdHJ1ZSA6IGZydXN0dW0uY3VsbGluZyhtZXNoQ29tcG9uZW50KTtcbiAgICAgICAgc2NlbmVHcmFwaC5faXNDdWxsZWQgPSAhdmlzaWJsZTtcbiAgICAgICAgY29uc3Qgc2tlbGV0YWwgPSBtZXNoQ29tcG9uZW50LmVudGl0eS50cnlUb0dldFNrZWxldGFsKCk7XG4gICAgICAgIGlmIChza2VsZXRhbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgc2tlbGV0YWwuX2lzQ3VsbGVkID0gIXZpc2libGU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF2aXNpYmxlKSB7XG4gICAgICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fc3RhbXBDdWxsZWRFbnRpdHkoc2NyYXRjaCwgbWVzaENvbXBvbmVudC5lbnRpdHlVSUQsIGN1bGxUaWNrKTtcbiAgICAgICAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19kZWZlckN1bGxlZEluc3RhbmNlZE1lc2gobWVzaENvbXBvbmVudCwgc2NyYXRjaCk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fYXBwZW5kUHJpbWl0aXZlc09mTWVzaENvbXBvbmVudChtZXNoQ29tcG9uZW50LCBjYW1lcmFDb21wb25lbnQsIG91dFByaW1pdGl2ZXMpO1xuICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fbWFya01lc2hBcHBlbmRlZChtZXNoQ29tcG9uZW50LCBzY3JhdGNoLCBjdWxsVGljayk7XG4gICAgfVxuXG4gICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fY3VsbFNpYmxpbmdJbnN0YW5jZXMobWVzaENvbXBvbmVudHMsIGZydXN0dW0sIHNjcmF0Y2gsIGN1bGxUaWNrLCBpc0dwdUN1bGxpbmdBY3RpdmUpO1xuICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2FwcGVuZFByaW1pdGl2ZXNPZkN1bGxlZEluc3RhbmNlZE1lc2hlcyhjYW1lcmFDb21wb25lbnQsIG91dFByaW1pdGl2ZXMsIHNjcmF0Y2gsIGN1bGxUaWNrKTtcblxuICAgIHJldHVybiBvdXRQcmltaXRpdmVzO1xuICB9XG5cbiAgLyoqXG4gICAqIEN1bGxzIHRoZSBpbnN0YW5jZXMgdGhhdCBzaGFyZSBhIG1lc2ggd2l0aCB0aGUgbWVzaCBjb21wb25lbnRzIG9mIHRoZSByZW5kZXIgcGFzcyBidXQgYXJlIG5vdFxuICAgKiByZWdpc3RlcmVkIGluIHRoZSByZW5kZXIgcGFzcyB0aGVtc2VsdmVzLlxuICAgKlxuICAgKiBJbnN0YW5jZWQgZHJhdyBjYWxscyByZW5kZXIgZXZlcnkgZW50aXR5IHNoYXJpbmcgYSBtZXNoLiBGb3IgZXhhbXBsZSwgdGhlIFZSTSBvdXRsaW5lIHBhc3Mgb25seSBob2xkc1xuICAgKiB0aGUgb3JpZ2luYWwgbW9kZWwsIHdoaWxlIGl0cyBzaGFsbG93IGNvcGllcyBhcmUgZHJhd24gdGhyb3VnaCBpbnN0YW5jaW5nLiBTdWNoIHNpYmxpbmcgaW5zdGFuY2VzIGFyZVxuICAgKiBjdWxsZWQgd2l0aCB0aGUgY2FtZXJhIG9mIHRoaXMgcmVuZGVyIHBhc3MgYXMgd2VsbCwgb25jZSBwZXIgbWVzaC4gVGhlaXIgdmlzaWJpbGl0eSBmbGFncyBhcmUgbGVmdFxuICAgKiB1bnRvdWNoZWQgYmVjYXVzZSB0aGV5IGJlbG9uZyB0byB0aGUgcmVuZGVyIHBhc3NlcyB0aGUgZW50aXRpZXMgYXJlIHJlZ2lzdGVyZWQgaW4uXG4gICAqXG4gICAqIFRoZSBtZXNoZXMgY3VsbGVkIG9uIHRoZSBHUFUgKGBpc0dwdUN1bGxpbmdBY3RpdmVgIGFuZCBgTWVzaC5faXNHcHVDdWxsYWJsZWApIGFyZSBza2lwcGVkOiB0aGVpciBpbnN0YW5jZXMsXG4gICAqIHNpYmxpbmdzIGluY2x1ZGVkLCBhcmUgY3VsbGVkIHBlciBpbnN0YW5jZSBieSB0aGUgY3VsbGluZyBjb21wdXRlIHBhc3MsIHNvIHRlc3RpbmcgdGhlbSBoZXJlIHdvdWxkIG9ubHkgY29zdFxuICAgKiBDUFUgdGltZS5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fY3VsbFNpYmxpbmdJbnN0YW5jZXMoXG4gICAgbWVzaENvbXBvbmVudHM6IE1lc2hDb21wb25lbnRbXSxcbiAgICBmcnVzdHVtOiBDYW1lcmFDb21wb25lbnRbJ2ZydXN0dW0nXSB8IHVuZGVmaW5lZCxcbiAgICBzY3JhdGNoOiBNZXNoUmVuZGVyZXJTb3J0U2NyYXRjaCxcbiAgICBjdWxsVGljazogbnVtYmVyLFxuICAgIGlzR3B1Q3VsbGluZ0FjdGl2ZTogYm9vbGVhblxuICApIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1lc2hDb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBtZXNoQ29tcG9uZW50ID0gbWVzaENvbXBvbmVudHNbaV07XG4gICAgICBpZiAoIW1lc2hDb21wb25lbnQuX2lzQWxpdmUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBtZXNoID0gbWVzaENvbXBvbmVudC5tZXNoO1xuICAgICAgaWYgKG1lc2ggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChpc0dwdUN1bGxpbmdBY3RpdmUgJiYgbWVzaC5faXNHcHVDdWxsYWJsZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHNpYmxpbmdzID0gbWVzaC5tZXNoRW50aXRpZXNJbm5lcjtcbiAgICAgIGlmIChzaWJsaW5ncy5sZW5ndGggPD0gMSB8fCBzY3JhdGNoLm1lc2hDdWxsVGljay5nZXQobWVzaCkgPT09IGN1bGxUaWNrKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgc2NyYXRjaC5tZXNoQ3VsbFRpY2suc2V0KG1lc2gsIGN1bGxUaWNrKTtcblxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBzaWJsaW5ncy5sZW5ndGg7IGorKykge1xuICAgICAgICBjb25zdCBzaWJsaW5nID0gc2libGluZ3Nbal07XG4gICAgICAgIGNvbnN0IGVudGl0eVVJRCA9IHNpYmxpbmcuZW50aXR5VUlEO1xuICAgICAgICBpZiAoZW50aXR5VUlEIDwgc2NyYXRjaC5oYW5kbGVkRW50aXR5U3RhbXAubGVuZ3RoICYmIHNjcmF0Y2guaGFuZGxlZEVudGl0eVN0YW1wW2VudGl0eVVJRF0gPT09IGN1bGxUaWNrKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHZpc2libGUgPSBzaWJsaW5nLmdldFNjZW5lR3JhcGgoKS5pc1Zpc2libGU7XG4gICAgICAgIGlmICh2aXNpYmxlICYmIGZydXN0dW0gIT0gbnVsbCAmJiBzaWJsaW5nLmdldFRhZ1ZhbHVlKCd0eXBlJykgIT09ICdiYWNrZ3JvdW5kLWFzc2V0cycpIHtcbiAgICAgICAgICB2aXNpYmxlID0gZnJ1c3R1bS5jdWxsaW5nKHNpYmxpbmcuZ2V0TWVzaCgpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXZpc2libGUpIHtcbiAgICAgICAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19zdGFtcEN1bGxlZEVudGl0eShzY3JhdGNoLCBlbnRpdHlVSUQsIGN1bGxUaWNrKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1lbWJlcnMgYSBjdWxsZWQgbWVzaCBjb21wb25lbnQgd2hvc2UgbWVzaCBpcyBzaGFyZWQgYnkgb3RoZXIgaW5zdGFuY2VzOiBhbiBpbnN0YW5jZWQgZHJhdyBjYWxsIHJlbmRlcnNcbiAgICogZXZlcnkgaW5zdGFuY2Ugb2YgdGhlIG1lc2gsIHNvIHRoZSBtZXNoIG11c3Qgc3RpbGwgYmUgZHJhd24gd2hlbiBhbm90aGVyIGluc3RhbmNlIGlzIHZpc2libGUuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2RlZmVyQ3VsbGVkSW5zdGFuY2VkTWVzaChtZXNoQ29tcG9uZW50OiBNZXNoQ29tcG9uZW50LCBzY3JhdGNoOiBNZXNoUmVuZGVyZXJTb3J0U2NyYXRjaCkge1xuICAgIGNvbnN0IG1lc2ggPSBtZXNoQ29tcG9uZW50Lm1lc2g7XG4gICAgaWYgKG1lc2ggIT09IHVuZGVmaW5lZCAmJiBtZXNoLm1lc2hFbnRpdGllc0lubmVyLmxlbmd0aCA+IDEpIHtcbiAgICAgIHNjcmF0Y2guY3VsbGVkSW5zdGFuY2VkTWVzaENvbXBvbmVudHMucHVzaChtZXNoQ29tcG9uZW50KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX21hcmtNZXNoQXBwZW5kZWQobWVzaENvbXBvbmVudDogTWVzaENvbXBvbmVudCwgc2NyYXRjaDogTWVzaFJlbmRlcmVyU29ydFNjcmF0Y2gsIGN1bGxUaWNrOiBudW1iZXIpIHtcbiAgICBjb25zdCBtZXNoID0gbWVzaENvbXBvbmVudC5tZXNoO1xuICAgIGlmIChtZXNoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHNjcmF0Y2gubWVzaEFwcGVuZFRpY2suc2V0KG1lc2gsIGN1bGxUaWNrKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXBwZW5kcyB0aGUgcHJpbWl0aXZlcyBvZiB0aGUgaW5zdGFuY2VkIG1lc2hlcyB3aG9zZSByZWdpc3RlcmVkIGluc3RhbmNlcyB3ZXJlIGFsbCBjdWxsZWQgYnV0IHdoaWNoIGhhdmVcbiAgICogYW5vdGhlciBpbnN0YW5jZSB0aGF0IHdhcyBub3QgY3VsbGVkLlxuICAgKlxuICAgKiBUaGUgY3VsbGluZyBpcyBkZWNpZGVkIHBlciBlbnRpdHkgcmVnaXN0ZXJlZCBpbiB0aGUgcmVuZGVyIHBhc3MsIHdoaWxlIGFuIGluc3RhbmNlZCBkcmF3IGNhbGwgcmVuZGVycyBldmVyeVxuICAgKiBlbnRpdHkgc2hhcmluZyB0aGUgbWVzaCAoZS5nLiBhIHRlbXBsYXRlIGVudGl0eSByZWdpc3RlcmVkIGluIHRoZSByZW5kZXIgcGFzcyBhbmQgaXRzIHNoYWxsb3cgY29waWVzKS4gRHJvcHBpbmdcbiAgICogdGhlIG1lc2ggYmVjYXVzZSBpdHMgcmVnaXN0ZXJlZCBlbnRpdHkgaXMgb3V0c2lkZSBvZiB0aGUgdmlldyB3b3VsZCBhbHNvIGRyb3AgaXRzIHZpc2libGUgY29waWVzLiBUaGUgY3VsbGVkXG4gICAqIGVudGl0aWVzIHN0YXkgc3RhbXBlZCBpbiBgY3VsbGVkRW50aXR5U3RhbXBgLCBzbyB0aGUgcGVyLWluc3RhbmNlIGN1bGxpbmcgb2YgdGhlIFdlYkdMIHN0cmF0ZWd5IGRvZXMgbm90IGRyYXdcbiAgICogdGhlbTsgdGhlIFdlYkdQVSBzdHJhdGVneSB3aXRob3V0IEdQVSBjdWxsaW5nIGRyYXdzIGV2ZXJ5IGluc3RhbmNlICh0aGUgaGlkZGVuIG9uZXMgYXJlIGNvbGxhcHNlZCBieSB0aGUgdmVydGV4XG4gICAqIHNoYWRlciBhbmQgdGhlIGN1bGxlZCBvbmVzIGFyZSBvdXRzaWRlIG9mIHRoZSB2aWV3KS5cbiAgICpcbiAgICogTXVzdCBydW4gYWZ0ZXIgYF9fY3VsbFNpYmxpbmdJbnN0YW5jZXNgLCB3aGljaCBzdGFtcHMgdGhlIGN1bGxlZCBpbnN0YW5jZXMgdGhhdCBhcmUgbm90IHJlZ2lzdGVyZWQgaW4gdGhlIHBhc3MuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2FwcGVuZFByaW1pdGl2ZXNPZkN1bGxlZEluc3RhbmNlZE1lc2hlcyhcbiAgICBjYW1lcmFDb21wb25lbnQ6IENhbWVyYUNvbXBvbmVudCxcbiAgICBvdXRQcmltaXRpdmVzOiBQcmltaXRpdmVbXSxcbiAgICBzY3JhdGNoOiBNZXNoUmVuZGVyZXJTb3J0U2NyYXRjaCxcbiAgICBjdWxsVGljazogbnVtYmVyXG4gICkge1xuICAgIGNvbnN0IG1lc2hDb21wb25lbnRzID0gc2NyYXRjaC5jdWxsZWRJbnN0YW5jZWRNZXNoQ29tcG9uZW50cztcbiAgICBjb25zdCBjdWxsZWRFbnRpdHlTdGFtcCA9IHNjcmF0Y2guY3VsbGVkRW50aXR5U3RhbXA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtZXNoQ29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbWVzaENvbXBvbmVudCA9IG1lc2hDb21wb25lbnRzW2ldO1xuICAgICAgY29uc3QgbWVzaCA9IG1lc2hDb21wb25lbnQubWVzaDtcbiAgICAgIGlmIChtZXNoID09PSB1bmRlZmluZWQgfHwgc2NyYXRjaC5tZXNoQXBwZW5kVGljay5nZXQobWVzaCkgPT09IGN1bGxUaWNrKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLy8gRGVjaWRlZCBvbmNlIHBlciBtZXNoLCB3aGV0aGVyIG9yIG5vdCBpdCBpcyBkcmF3bi5cbiAgICAgIHNjcmF0Y2gubWVzaEFwcGVuZFRpY2suc2V0KG1lc2gsIGN1bGxUaWNrKTtcbiAgICAgIGNvbnN0IGluc3RhbmNlcyA9IG1lc2gubWVzaEVudGl0aWVzSW5uZXI7XG4gICAgICBsZXQgaGFzVmlzaWJsZUluc3RhbmNlID0gZmFsc2U7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGluc3RhbmNlcy5sZW5ndGg7IGorKykge1xuICAgICAgICBjb25zdCBlbnRpdHlVSUQgPSBpbnN0YW5jZXNbal0uZW50aXR5VUlEO1xuICAgICAgICBpZiAoZW50aXR5VUlEID49IGN1bGxlZEVudGl0eVN0YW1wLmxlbmd0aCB8fCBjdWxsZWRFbnRpdHlTdGFtcFtlbnRpdHlVSURdICE9PSBjdWxsVGljaykge1xuICAgICAgICAgIGhhc1Zpc2libGVJbnN0YW5jZSA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChoYXNWaXNpYmxlSW5zdGFuY2UpIHtcbiAgICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fYXBwZW5kUHJpbWl0aXZlc09mTWVzaENvbXBvbmVudChtZXNoQ29tcG9uZW50LCBjYW1lcmFDb21wb25lbnQsIG91dFByaW1pdGl2ZXMpO1xuICAgICAgfVxuICAgIH1cbiAgICBtZXNoQ29tcG9uZW50cy5sZW5ndGggPSAwO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19zdGFtcEN1bGxlZEVudGl0eShzY3JhdGNoOiBNZXNoUmVuZGVyZXJTb3J0U2NyYXRjaCwgZW50aXR5VUlEOiBFbnRpdHlVSUQsIGN1bGxUaWNrOiBudW1iZXIpIHtcbiAgICBzY3JhdGNoLmN1bGxlZEVudGl0eVN0YW1wID0gTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fc3RhbXBFbnRpdHkoc2NyYXRjaC5jdWxsZWRFbnRpdHlTdGFtcCwgZW50aXR5VUlELCBjdWxsVGljayk7XG4gICAgc2NyYXRjaC5jdWxsZWRFbnRpdHlDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIFdyaXRlcyBgY3VsbFRpY2tgIGludG8gYHN0YW1wW2VudGl0eVVJRF1gLCBncm93aW5nIHRoZSBhcnJheSB1cCB0byB0aGUgbGFyZ2VzdCBFbnRpdHlVSUQgc2VlbiBzbyBmYXIuXG4gICAqIEByZXR1cm5zIFRoZSBzdGFtcCBhcnJheSwgd2hpY2ggaXMgYSBuZXcgYXJyYXkgd2hlbiBpdCBoYXMgZ3Jvd25cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fc3RhbXBFbnRpdHkoc3RhbXA6IFVpbnQzMkFycmF5LCBlbnRpdHlVSUQ6IEVudGl0eVVJRCwgY3VsbFRpY2s6IG51bWJlcik6IFVpbnQzMkFycmF5IHtcbiAgICBsZXQgcmVzdWx0ID0gc3RhbXA7XG4gICAgaWYgKGVudGl0eVVJRCA+PSBzdGFtcC5sZW5ndGgpIHtcbiAgICAgIHJlc3VsdCA9IG5ldyBVaW50MzJBcnJheShNYXRoLm1heChlbnRpdHlVSUQgKyAxLCBzdGFtcC5sZW5ndGggKiAyLCA2NCkpO1xuICAgICAgcmVzdWx0LnNldChzdGFtcCk7XG4gICAgfVxuICAgIHJlc3VsdFtlbnRpdHlVSURdID0gY3VsbFRpY2s7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBtZXNoZXMgb2YgYSByZW5kZXIgcGFzcyBhcmUgZnJ1c3R1bSBjdWxsZWQgb24gdGhlIEdQVSAoV2ViR1BVLCBgQ29uZmlnLmlzR3B1Q3VsbGluZ0VuYWJsZWRgKS5cbiAgICogVGhlIENQVSBjdWxsaW5nIGFuZCB0aGUgV2ViR1BVIGRyYXcgcmVjb3JkaW5nIGJvdGggdXNlIHRoaXMsIHNvIHRoYXQgYSBtZXNoIHRoZSBDUFUga2VlcHMgZm9yIHRoZSBHUFUgaXNcbiAgICogcmVjb3JkZWQgYXMgYSBjdWxsZWQgaW5kaXJlY3QgZHJhdy4gTWVzaGVzIHdob3NlIGBNZXNoLl9pc0dwdUN1bGxhYmxlYCBpcyBmYWxzZSBrZWVwIHRoZSBDUFUgY3VsbGluZy5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBzdGF0aWMgX2lzR3B1Q3VsbGluZ0FjdGl2ZShlbmdpbmU6IEVuZ2luZSwgcmVuZGVyUGFzczogUmVuZGVyUGFzcyk6IGJvb2xlYW4ge1xuICAgIGlmIChcbiAgICAgICFlbmdpbmUuY29uZmlnLmlzR3B1Q3VsbGluZ0VuYWJsZWQgfHxcbiAgICAgICFNZXNoUmVuZGVyZXJDb21wb25lbnQuX2lzRnJ1c3R1bUN1bGxpbmdFbmFibGVkIHx8XG4gICAgICAhUHJvY2Vzc0FwcHJvYWNoLmlzV2ViR3B1QXBwcm9hY2goZW5naW5lLmVuZ2luZVN0YXRlLmN1cnJlbnRQcm9jZXNzQXBwcm9hY2gpIHx8XG4gICAgICByZW5kZXJQYXNzLmlzQnVmZmVyTGVzc1JlbmRlcmluZ01vZGUoKVxuICAgICkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBBIG11bHRpLXZpZXcgZHJhdyByZW5kZXJzIGJvdGggZXllcywgd2hpY2ggaGF2ZSBkaWZmZXJlbnQgZnJ1c3RhLlxuICAgIGNvbnN0IHdlYnhyU3lzdGVtID0gZW5naW5lLl93ZWJYUlN5c3RlbUlmRW5hYmxlZDtcbiAgICBpZiAocmVuZGVyUGFzcy5pc1ZyUmVuZGVyaW5nICYmIHdlYnhyU3lzdGVtPy5pc1dlYlhSTW9kZSAmJiB3ZWJ4clN5c3RlbS5pc011bHRpVmlldygpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGxhdGVzdCBjdWxsaW5nIHJlc3VsdCBvZiBhIHJlbmRlciBwYXNzIGZvciBwZXItaW5zdGFuY2UgY3VsbGluZyBvZiBpbnN0YW5jZWQgZHJhdyBjYWxscy5cbiAgICogVGhlIHJlc3VsdCBzdGF5cyB2YWxpZCB3aGlsZSBgc29ydF8kcmVuZGVyYCByZXVzZXMgaXRzIGNhY2hlZCBwcmltaXRpdmUgbGlzdCBmb3IgdGhlIHJlbmRlciBwYXNzLlxuICAgKiBAcGFyYW0gcmVuZGVyUGFzcyAtIFRoZSByZW5kZXIgcGFzc1xuICAgKiBAcmV0dXJucyBUaGUgY3VsbGluZyBzdGF0ZSwgb3IgdW5kZWZpbmVkIGlmIG5vIGN1bGxpbmcgaGFzIHJ1biBmb3IgdGhlIHJlbmRlciBwYXNzXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIF9nZXRJbnN0YW5jZUN1bGxpbmdTdGF0ZShyZW5kZXJQYXNzOiBSZW5kZXJQYXNzKTogSW5zdGFuY2VDdWxsaW5nU3RhdGUgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IHNjcmF0Y2ggPSBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19zb3J0U2NyYXRjaE1hcC5nZXQocmVuZGVyUGFzcyk7XG4gICAgaWYgKHNjcmF0Y2ggPT09IHVuZGVmaW5lZCB8fCBzY3JhdGNoLmN1bGxUaWNrID09PSAwKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gc2NyYXRjaDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBlbmRzIHRoZSBwcmltaXRpdmVzIG9mIGEgbWVzaCBjb21wb25lbnQgdG8gYG91dFByaW1pdGl2ZXNgIGFuZCBjb21wdXRlcyB0aGVcbiAgICogdmlldyBkZXB0aCBmb3IgYmxlbmRlZCBwcmltaXRpdmVzLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19hcHBlbmRQcmltaXRpdmVzT2ZNZXNoQ29tcG9uZW50KFxuICAgIG1lc2hDb21wb25lbnQ6IE1lc2hDb21wb25lbnQsXG4gICAgY2FtZXJhQ29tcG9uZW50OiBDYW1lcmFDb21wb25lbnQsXG4gICAgb3V0UHJpbWl0aXZlczogUHJpbWl0aXZlW11cbiAgKSB7XG4gICAgY29uc3QgbWVzaCA9IG1lc2hDb21wb25lbnQubWVzaDtcbiAgICBpZiAobWVzaCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IG1lc2hQcmltaXRpdmVzID0gbWVzaC5wcmltaXRpdmVzO1xuICAgIGNvbnN0IHByaW1pdGl2ZUNvdW50ID0gbWVzaFByaW1pdGl2ZXMubGVuZ3RoO1xuICAgIGxldCBpc0JsZW5kRXhpc3QgPSBmYWxzZTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByaW1pdGl2ZUNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IHByaW1pdGl2ZSA9IG1lc2hQcmltaXRpdmVzW2ldO1xuICAgICAgb3V0UHJpbWl0aXZlcy5wdXNoKHByaW1pdGl2ZSk7XG4gICAgICBpZiAoIWlzQmxlbmRFeGlzdCAmJiBpc0JsZW5kKHByaW1pdGl2ZSkpIHtcbiAgICAgICAgaXNCbGVuZEV4aXN0ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGlzQmxlbmRFeGlzdCkge1xuICAgICAgY29uc3Qgdmlld0RlcHRoID0gbWVzaENvbXBvbmVudC5jYWxjVmlld0RlcHRoKGNhbWVyYUNvbXBvbmVudCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByaW1pdGl2ZUNvdW50OyBpKyspIHtcbiAgICAgICAgbWVzaFByaW1pdGl2ZXNbaV0uX3ZpZXdEZXB0aCA9IHZpZXdEZXB0aDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBkdXBsaWNhdGVkIHByaW1pdGl2ZXMgaW4gcGxhY2Ugd2l0aG91dCBhbGxvY2F0aW5nIGEgYFNldGAgb3IgYSBuZXcgYXJyYXkuXG4gICAqIEEgcHJpbWl0aXZlIFVJRCBpcyB1bmlxdWUsIHNvIGEgc3RhbXAgYXJyYXkgaW5kZXhlZCBieSB0aGUgVUlEIGlzIGVub3VnaCB0byBkZXRlY3RcbiAgICogZHVwbGljYXRlcy4gYHByaW1pdGl2ZXMubGVuZ3RoYCBpcyB1cGRhdGVkIHRvIHRoZSBkZWR1cGxpY2F0ZWQgbGVuZ3RoLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19yZW1vdmVEdXBsaWNhdGVkUHJpbWl0aXZlcyhwcmltaXRpdmVzOiBQcmltaXRpdmVbXSwgc2NyYXRjaDogTWVzaFJlbmRlcmVyU29ydFNjcmF0Y2gpIHtcbiAgICBjb25zdCBsZW5ndGggPSBwcmltaXRpdmVzLmxlbmd0aDtcbiAgICBpZiAobGVuZ3RoIDw9IDEpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgc3RhbXAgPSBzY3JhdGNoLnN0YW1wO1xuICAgIGxldCBzdGFtcFRpY2sgPSBzY3JhdGNoLnN0YW1wVGljayArIDE7XG4gICAgaWYgKHN0YW1wVGljayA9PT0gMHhmZmZmZmZmZikge1xuICAgICAgLy8gV3JhcCBhcm91bmQ6IGNsZWFyIHRoZSBzdGFtcHMgc28gdGhhdCBvbGQgdmFsdWVzIGNhbm5vdCBiZSBtaXN0YWtlbiBmb3IgdGhlIGN1cnJlbnQgdGljay5cbiAgICAgIHN0YW1wLmZpbGwoMCk7XG4gICAgICBzdGFtcFRpY2sgPSAxO1xuICAgIH1cbiAgICBzY3JhdGNoLnN0YW1wVGljayA9IHN0YW1wVGljaztcblxuICAgIGxldCB1bmlxdWVMZW5ndGggPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHByaW1pdGl2ZSA9IHByaW1pdGl2ZXNbaV07XG4gICAgICBjb25zdCBwcmltaXRpdmVVaWQgPSBwcmltaXRpdmUucHJpbWl0aXZlVWlkO1xuICAgICAgaWYgKHByaW1pdGl2ZVVpZCA8IDApIHtcbiAgICAgICAgcHJpbWl0aXZlc1t1bmlxdWVMZW5ndGgrK10gPSBwcmltaXRpdmU7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKHByaW1pdGl2ZVVpZCA+PSBzdGFtcC5sZW5ndGgpIHtcbiAgICAgICAgLy8gR3JvdyB0aGUgc3RhbXAgYXJyYXkgdXAgdG8gdGhlIGxhcmdlc3QgcHJpbWl0aXZlIFVJRCBzZWVuIHNvIGZhci5cbiAgICAgICAgY29uc3QgbmV3U3RhbXAgPSBuZXcgVWludDMyQXJyYXkoTWF0aC5tYXgocHJpbWl0aXZlVWlkICsgMSwgc3RhbXAubGVuZ3RoICogMiwgNjQpKTtcbiAgICAgICAgbmV3U3RhbXAuc2V0KHN0YW1wKTtcbiAgICAgICAgc2NyYXRjaC5zdGFtcCA9IG5ld1N0YW1wO1xuICAgICAgICBzdGFtcCA9IG5ld1N0YW1wO1xuICAgICAgfVxuICAgICAgaWYgKHN0YW1wW3ByaW1pdGl2ZVVpZF0gPT09IHN0YW1wVGljaykge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHN0YW1wW3ByaW1pdGl2ZVVpZF0gPSBzdGFtcFRpY2s7XG4gICAgICBwcmltaXRpdmVzW3VuaXF1ZUxlbmd0aCsrXSA9IHByaW1pdGl2ZTtcbiAgICB9XG4gICAgcHJpbWl0aXZlcy5sZW5ndGggPSB1bmlxdWVMZW5ndGg7XG4gIH1cblxuICAvKiogU29ydCBjb21wYXJhdG9yIHNoYXJlZCBieSBldmVyeSByZW5kZXIgcGFzcyAoYXZvaWRzIGFsbG9jYXRpbmcgYSBjbG9zdXJlIHBlciBmcmFtZSkuICovXG4gIHByaXZhdGUgc3RhdGljIF9fY29tcGFyZVByaW1pdGl2ZXMoYTogUHJpbWl0aXZlLCBiOiBQcmltaXRpdmUpIHtcbiAgICBjb25zdCBkZWx0YSA9IGEuX3NvcnRrZXkgLSBiLl9zb3J0a2V5O1xuICAgIGlmIChkZWx0YSAhPT0gMCkge1xuICAgICAgcmV0dXJuIGRlbHRhO1xuICAgIH1cbiAgICByZXR1cm4gYS5fdmlld0RlcHRoIC0gYi5fdmlld0RlcHRoO1xuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkcyB0aGUgcHJpbWl0aXZlIFVJRCBsaXN0IHVzZWQgZm9yIGRyYXdpbmcuIFRoZSB0cmFpbGluZyBgLTFgIGlzIHRoZSBzZW50aW5lbFxuICAgKiB0aGF0IHRlcm1pbmF0ZXMgdGhlIGxpc3QuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2NyZWF0ZVByaW1pdGl2ZVVpZHMocHJpbWl0aXZlczogUHJpbWl0aXZlW10pOiBDb21wb25lbnRTSURbXSB7XG4gICAgY29uc3QgcHJpbWl0aXZlQ291bnQgPSBwcmltaXRpdmVzLmxlbmd0aDtcbiAgICBjb25zdCBwcmltaXRpdmVVaWRzID0gbmV3IEFycmF5PENvbXBvbmVudFNJRD4ocHJpbWl0aXZlQ291bnQgKyAxKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByaW1pdGl2ZUNvdW50OyBpKyspIHtcbiAgICAgIHByaW1pdGl2ZVVpZHNbaV0gPSBwcmltaXRpdmVzW2ldLnByaW1pdGl2ZVVpZDtcbiAgICB9XG4gICAgcHJpbWl0aXZlVWlkc1twcmltaXRpdmVDb3VudF0gPSAtMTtcbiAgICByZXR1cm4gcHJpbWl0aXZlVWlkcztcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIChhbmQgbGF6aWx5IGNyZWF0ZXMpIHRoZSByZXVzYWJsZSBzY3JhdGNoIGJ1ZmZlcnMgb2YgYSByZW5kZXIgcGFzcy4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRTb3J0U2NyYXRjaChyZW5kZXJQYXNzOiBSZW5kZXJQYXNzKTogTWVzaFJlbmRlcmVyU29ydFNjcmF0Y2gge1xuICAgIGxldCBzY3JhdGNoID0gTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fc29ydFNjcmF0Y2hNYXAuZ2V0KHJlbmRlclBhc3MpO1xuICAgIGlmIChzY3JhdGNoID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHNjcmF0Y2ggPSB7XG4gICAgICAgIHByaW1pdGl2ZXM6IFtdLFxuICAgICAgICBzdGFtcDogbmV3IFVpbnQzMkFycmF5KDY0KSxcbiAgICAgICAgc3RhbXBUaWNrOiAwLFxuICAgICAgICBjdWxsZWRFbnRpdHlTdGFtcDogbmV3IFVpbnQzMkFycmF5KDY0KSxcbiAgICAgICAgaGFuZGxlZEVudGl0eVN0YW1wOiBuZXcgVWludDMyQXJyYXkoNjQpLFxuICAgICAgICBtZXNoQ3VsbFRpY2s6IG5ldyBXZWFrTWFwKCksXG4gICAgICAgIGN1bGxUaWNrOiAwLFxuICAgICAgICBjdWxsZWRFbnRpdHlDb3VudDogMCxcbiAgICAgICAgY3VsbGluZ0lkOiAwLFxuICAgICAgICBrZXllZFByaW1pdGl2ZXM6IFtdLFxuICAgICAgICBpc0dwdUN1bGxpbmdBY3RpdmU6IHVuZGVmaW5lZCxcbiAgICAgICAgaXNDb21wdXRlU2tpbm5pbmdFbmFibGVkOiB1bmRlZmluZWQsXG4gICAgICAgIGN1bGxlZEluc3RhbmNlZE1lc2hDb21wb25lbnRzOiBbXSxcbiAgICAgICAgbWVzaEFwcGVuZFRpY2s6IG5ldyBXZWFrTWFwKCksXG4gICAgICB9O1xuICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fc29ydFNjcmF0Y2hNYXAuc2V0KHJlbmRlclBhc3MsIHNjcmF0Y2gpO1xuICAgIH1cbiAgICByZXR1cm4gc2NyYXRjaDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21tb24gcHJlLXJlbmRlcmluZyBzZXR1cCBtZXRob2QgdGhhdCBwcmVwYXJlcyB0aGUgcmVuZGVyaW5nIHN0cmF0ZWd5LlxuICAgKiBJbml0aWFsaXplcyB0aGUgcmVuZGVyaW5nIHN0cmF0ZWd5IGlmIG5vdCBhbHJlYWR5IHNldCBhbmQgY2FsbHMgaXRzIHByZXJlbmRlciBtZXRob2QuXG4gICAqL1xuICBzdGF0aWMgY29tbW9uXyRwcmVyZW5kZXIoZW5naW5lOiBFbmdpbmUpIHtcbiAgICBjb25zdCBlbmdpbmVVaWQgPSBlbmdpbmUub2JqZWN0VUlEO1xuICAgIC8vIFRoaXMgcnVucyBvbmNlIHBlciBmcmFtZSwgc28gdGhlIHN0cmF0ZWd5IGlzIG1lbW9pemVkIGluc3RlYWQgb2YgZG9pbmcgYVxuICAgIC8vIGBNYXAuaGFzYCArIGBNYXAuZ2V0YCBwYWlyIG9uIGV2ZXJ5IGZyYW1lLlxuICAgIGxldCBzdHJhdGVneSA9IE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX3ByZXJlbmRlclN0cmF0ZWd5O1xuICAgIGlmIChzdHJhdGVneSA9PT0gdW5kZWZpbmVkIHx8IE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX3ByZXJlbmRlclN0cmF0ZWd5RW5naW5lVWlkICE9PSBlbmdpbmVVaWQpIHtcbiAgICAgIHN0cmF0ZWd5ID0gTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fY2dBcGlSZW5kZXJpbmdTdHJhdGVneU1hcC5nZXQoZW5naW5lVWlkKTtcbiAgICAgIGlmIChzdHJhdGVneSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIFBvc3NpYmxlIGlmIHRoZXJlIGlzIG5vIG1lc2ggZW50aXR5IGluIHRoZSBzY2VuZVxuICAgICAgICBjb25zdCBwcm9jZXNzQXBwcm9hY2ggPSBlbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaDtcbiAgICAgICAgdGhpcy5jb21tb25fJGxvYWQoeyBwcm9jZXNzQXBwcm9hY2gsIGVuZ2luZSB9KTtcbiAgICAgICAgc3RyYXRlZ3kgPSBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19jZ0FwaVJlbmRlcmluZ1N0cmF0ZWd5TWFwLmdldChlbmdpbmVVaWQpO1xuICAgICAgICBpZiAoc3RyYXRlZ3kgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fcHJlcmVuZGVyU3RyYXRlZ3lFbmdpbmVVaWQgPSBlbmdpbmVVaWQ7XG4gICAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19wcmVyZW5kZXJTdHJhdGVneSA9IHN0cmF0ZWd5O1xuICAgIH1cbiAgICAvLyBDYWxsIGNvbW1vbl8kcHJlcmVuZGVyIG9mIHRoZSBXZWJHTC9XZWJHUFUgcmVuZGVyaW5nIHN0cmF0ZWd5XG4gICAgc3RyYXRlZ3kucHJlcmVuZGVyKCk7XG4gIH1cblxuICAvKipcbiAgICogQ29tbW9uIHJlbmRlcmluZyBtZXRob2QgdGhhdCBleGVjdXRlcyB0aGUgYWN0dWFsIHJlbmRlcmluZyBvZiBwcmltaXRpdmVzLlxuICAgKiBEZWxlZ2F0ZXMgdG8gdGhlIGFwcHJvcHJpYXRlIHJlbmRlcmluZyBzdHJhdGVneSAoV2ViR0wgb3IgV2ViR1BVKS5cbiAgICogQHBhcmFtIHJlbmRlclBhc3MgLSBUaGUgcmVuZGVyIHBhc3MgY29udGV4dFxuICAgKiBAcGFyYW0gcmVuZGVyUGFzc1RpY2tDb3VudCAtIFRoZSB0aWNrIGNvdW50IGZvciB0aGlzIHJlbmRlciBwYXNzXG4gICAqIEBwYXJhbSBwcmltaXRpdmVVaWRzIC0gQXJyYXkgb2YgcHJpbWl0aXZlIFVJRHMgdG8gcmVuZGVyXG4gICAqIEBwYXJhbSBkaXNwbGF5SWR4IC0gVGhlIGluZGV4IG9mIHRoZSBkaXNwbGF5IHRvIHJlbmRlciB0b1xuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHJlbmRlcmluZyB3YXMgc3VjY2Vzc2Z1bCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgY29tbW9uXyRyZW5kZXIoe1xuICAgIHJlbmRlclBhc3MsXG4gICAgcmVuZGVyUGFzc1RpY2tDb3VudCxcbiAgICBwcmltaXRpdmVVaWRzLFxuICAgIGRpc3BsYXlJZHgsXG4gICAgZW5naW5lLFxuICB9OiB7XG4gICAgcmVuZGVyUGFzczogUmVuZGVyUGFzcztcbiAgICByZW5kZXJQYXNzVGlja0NvdW50OiBDb3VudDtcbiAgICBwcmltaXRpdmVVaWRzOiBQcmltaXRpdmVVSURbXTtcbiAgICBkaXNwbGF5SWR4OiBJbmRleDtcbiAgICBlbmdpbmU6IEVuZ2luZTtcbiAgfSk6IGJvb2xlYW4ge1xuICAgIC8vIENhbGwgY29tbW9uXyRyZW5kZXIgb2YgV2ViR0xSZW5kZXJpbmdTdHJhdGVneVxuICAgIHJldHVybiBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19jZ0FwaVJlbmRlcmluZ1N0cmF0ZWd5TWFwXG4gICAgICAuZ2V0KGVuZ2luZS5vYmplY3RVSUQpIVxuICAgICAgLmNvbW1vbl8kcmVuZGVyKHByaW1pdGl2ZVVpZHMsIHJlbmRlclBhc3MsIHJlbmRlclBhc3NUaWNrQ291bnQsIGRpc3BsYXlJZHgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluc3RhbmNlLXNwZWNpZmljIHJlbmRlciBtZXRob2QgZm9yIHRoaXMgbWVzaCByZW5kZXJlciBjb21wb25lbnQuXG4gICAqIEN1cnJlbnRseSBlbXB0eSBhcyByZW5kZXJpbmcgaXMgaGFuZGxlZCBieSB0aGUgc3RhdGljIGNvbW1vbl8kcmVuZGVyIG1ldGhvZC5cbiAgICogQHBhcmFtIGkgLSBUaGUgaW5kZXggb2YgdGhpcyBjb21wb25lbnQgaW4gdGhlIHJlbmRlciBxdWV1ZVxuICAgKiBAcGFyYW0gcmVuZGVyUGFzcyAtIFRoZSByZW5kZXIgcGFzcyBjb250ZXh0XG4gICAqIEBwYXJhbSByZW5kZXJQYXNzVGlja0NvdW50IC0gVGhlIHRpY2sgY291bnQgZm9yIHRoaXMgcmVuZGVyIHBhc3NcbiAgICovXG4gICRyZW5kZXIoKSB7fVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtcyBhIHNoYWxsb3cgY29weSBvZiBwcm9wZXJ0aWVzIGZyb20gYW5vdGhlciBNZXNoUmVuZGVyZXJDb21wb25lbnQuXG4gICAqIENvcGllcyBjdWJlIG1hcCBzZXR0aW5ncyBhbmQgY29udHJpYnV0aW9ucyB3aXRob3V0IGRlZXAgY2xvbmluZyB0aGUgdGV4dHVyZXMuXG4gICAqIEBwYXJhbSBjb21wb25lbnRfIC0gVGhlIHNvdXJjZSBjb21wb25lbnQgdG8gY29weSBmcm9tXG4gICAqL1xuICBfc2hhbGxvd0NvcHlGcm9tKGNvbXBvbmVudF86IENvbXBvbmVudCk6IHZvaWQge1xuICAgIGNvbnN0IGNvbXBvbmVudCA9IGNvbXBvbmVudF8gYXMgTWVzaFJlbmRlcmVyQ29tcG9uZW50O1xuXG4gICAgdGhpcy5fX2RpZmZ1c2VDdWJlTWFwID0gY29tcG9uZW50Ll9fZGlmZnVzZUN1YmVNYXA7XG4gICAgdGhpcy5fX3NwZWN1bGFyQ3ViZU1hcCA9IGNvbXBvbmVudC5fX3NwZWN1bGFyQ3ViZU1hcDtcbiAgICB0aGlzLmRpZmZ1c2VDdWJlTWFwQ29udHJpYnV0aW9uID0gY29tcG9uZW50LmRpZmZ1c2VDdWJlTWFwQ29udHJpYnV0aW9uO1xuICAgIHRoaXMuc3BlY3VsYXJDdWJlTWFwQ29udHJpYnV0aW9uID0gY29tcG9uZW50LnNwZWN1bGFyQ3ViZU1hcENvbnRyaWJ1dGlvbjtcbiAgICB0aGlzLnJvdGF0aW9uT2ZDdWJlTWFwID0gY29tcG9uZW50LnJvdGF0aW9uT2ZDdWJlTWFwO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoaXMgY29tcG9uZW50IGFuZCBjbGVhbnMgdXAgaXRzIHJlc291cmNlcy5cbiAgICogQ2xlYXJzIGN1YmUgbWFwIHJlZmVyZW5jZXMgYW5kIGNhbGxzIHRoZSBwYXJlbnQgZGVzdHJveSBtZXRob2QuXG4gICAqL1xuICBfZGVzdHJveSgpOiB2b2lkIHtcbiAgICBzdXBlci5fZGVzdHJveSgpO1xuICAgIHRoaXMuX19kaWZmdXNlQ3ViZU1hcCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fc3BlY3VsYXJDdWJlTWFwID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhlIE1lc2hSZW5kZXJlciBjb21wb25lbnQgZnVuY3Rpb25hbGl0eSB0byBhbiBlbnRpdHkgY2xhc3MuXG4gICAqIFRoaXMgbWV0aG9kIGV4dGVuZHMgdGhlIGVudGl0eSBiYXNlIGNsYXNzIHdpdGggbWVzaCByZW5kZXJlciBzcGVjaWZpYyBtZXRob2RzLlxuICAgKiBAcGFyYW0gYmFzZSAtIFRoZSB0YXJnZXQgZW50aXR5IGJhc2UgY2xhc3NcbiAgICogQHBhcmFtIF9jb21wb25lbnRDbGFzcyAtIFRoZSBjb21wb25lbnQgY2xhc3MgdG8gYWRkICh1bnVzZWQgcGFyYW1ldGVyIGZvciB0eXBlIHNhZmV0eSlcbiAgICogQHJldHVybnMgVGhlIGVuaGFuY2VkIGVudGl0eSBjbGFzcyB3aXRoIG1lc2ggcmVuZGVyZXIgbWV0aG9kc1xuICAgKi9cbiAgYWRkVGhpc0NvbXBvbmVudFRvRW50aXR5PEVudGl0eUJhc2UgZXh0ZW5kcyBJRW50aXR5LCBTb21lQ29tcG9uZW50Q2xhc3MgZXh0ZW5kcyB0eXBlb2YgQ29tcG9uZW50PihcbiAgICBiYXNlOiBFbnRpdHlCYXNlLFxuICAgIF9jb21wb25lbnRDbGFzczogU29tZUNvbXBvbmVudENsYXNzXG4gICkge1xuICAgIGNsYXNzIE1lc2hSZW5kZXJlckVudGl0eSBleHRlbmRzIChiYXNlLmNvbnN0cnVjdG9yIGFzIGFueSkge1xuICAgICAgZ2V0TWVzaFJlbmRlcmVyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRDb21wb25lbnRCeUNvbXBvbmVudFRJRChcbiAgICAgICAgICBXZWxsS25vd25Db21wb25lbnRUSURzLk1lc2hSZW5kZXJlckNvbXBvbmVudFRJRFxuICAgICAgICApIGFzIE1lc2hSZW5kZXJlckNvbXBvbmVudDtcbiAgICAgIH1cbiAgICB9XG4gICAgYXBwbHlNaXhpbnMoYmFzZSwgTWVzaFJlbmRlcmVyRW50aXR5KTtcbiAgICByZXR1cm4gYmFzZSBhcyB1bmtub3duIGFzIENvbXBvbmVudFRvQ29tcG9uZW50TWV0aG9kczxTb21lQ29tcG9uZW50Q2xhc3M+ICYgRW50aXR5QmFzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhbnMgdXAgc3RhdGljIHJlc291cmNlcyBhc3NvY2lhdGVkIHdpdGggdGhlIHNwZWNpZmllZCBlbmdpbmUuXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlIHRvIGNsZWFuIHVwIHJlc291cmNlcyBmb3JcbiAgICogQGludGVybmFsXG4gICAqL1xuICBzdGF0aWMgX2NsZWFudXBGb3JFbmdpbmUoZW5naW5lOiBFbmdpbmUpOiB2b2lkIHtcbiAgICBjb25zdCBzdHJhdGVneSA9IE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2NnQXBpUmVuZGVyaW5nU3RyYXRlZ3lNYXAuZ2V0KGVuZ2luZS5vYmplY3RVSUQpO1xuICAgIGlmIChzdHJhdGVneSAhPSBudWxsKSB7XG4gICAgICBzdHJhdGVneS5kZXN0cm95KCk7XG4gICAgfVxuICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2NnQXBpUmVuZGVyaW5nU3RyYXRlZ3lNYXAuZGVsZXRlKGVuZ2luZS5vYmplY3RVSUQpO1xuICAgIC8vIERyb3AgdGhlIG1lbW9pemVkIHN0cmF0ZWd5IHNvIHRoYXQgYSBzdGFsZSBpbnN0YW5jZSBpcyBuZXZlciByZXVzZWQuXG4gICAgaWYgKE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX3ByZXJlbmRlclN0cmF0ZWd5RW5naW5lVWlkID09PSBlbmdpbmUub2JqZWN0VUlEKSB7XG4gICAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19wcmVyZW5kZXJTdHJhdGVneUVuZ2luZVVpZCA9IC0xO1xuICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50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
