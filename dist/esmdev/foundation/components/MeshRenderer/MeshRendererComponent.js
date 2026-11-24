// src/foundation/components/MeshRenderer/MeshRendererComponent.ts
import { getMultiDrawStateKeyId, getPrimitiveMeshRendererFingerPrintId } from "../../../webgl/MultiDraw.js";
import { Component } from "../../core/Component.js";
import { applyMixins } from "../../core/EntityRepository.js";
import { ProcessApproach } from "../../definitions/ProcessApproach.js";
import { ProcessStage } from "../../definitions/ProcessStage.js";
import { isBlend, isBlendWithoutZWrite, isBlendWithZWrite, isTranslucent } from "../../geometry/types/GeometryTypes.js";
import { ModuleManager } from "../../system/ModuleManager.js";
import { CameraComponent } from "../Camera/CameraComponent.js";
import { CameraControllerComponent } from "../CameraController/CameraControllerComponent.js";
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
    if (TransformComponent.getUpdateCount(engine) === renderPass._lastTransformComponentsUpdateCount && CameraControllerComponent.getUpdateCount(engine) === renderPass._lastCameraControllerComponentsUpdateCount && SceneGraphComponent.getUpdateCount(engine) === renderPass._lastSceneGraphComponentsUpdateCount && multiDrawGroupVersion === renderPass._lastMultiDrawGroupVersion && isGpuCullingActive === scratch.isGpuCullingActive && engine.config.isComputeSkinningEnabled === scratch.isComputeSkinningEnabled) {
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
    renderPass._lastCameraControllerComponentsUpdateCount = CameraControllerComponent.getUpdateCount(engine);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29tcG9uZW50cy9NZXNoUmVuZGVyZXIvTWVzaFJlbmRlcmVyQ29tcG9uZW50LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7XG4gIENHQVBJUmVzb3VyY2VIYW5kbGUsXG4gIENvbXBvbmVudFNJRCxcbiAgQ29tcG9uZW50VElELFxuICBDb3VudCxcbiAgRW50aXR5VUlELFxuICBJbmRleCxcbiAgT2JqZWN0VUlELFxuICBQcmltaXRpdmVVSUQsXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB7IGdldE11bHRpRHJhd1N0YXRlS2V5SWQsIGdldFByaW1pdGl2ZU1lc2hSZW5kZXJlckZpbmdlclByaW50SWQgfSBmcm9tICcuLi8uLi8uLi93ZWJnbC9NdWx0aURyYXcnO1xuaW1wb3J0IHR5cGUgeyBSbldlYkdMLCBXZWJHTFN0cmF0ZWd5IH0gZnJvbSAnLi4vLi4vLi4vd2ViZ2wvbWFpbic7XG5pbXBvcnQgdHlwZSB7IFJuV2ViR3B1IH0gZnJvbSAnLi4vLi4vLi4vd2ViZ3B1L21haW4nO1xuaW1wb3J0IHR5cGUgeyBXZWJHcHVTdHJhdGVneUJhc2ljIH0gZnJvbSAnLi4vLi4vLi4vd2ViZ3B1L1dlYkdwdVN0cmF0ZWd5QmFzaWMnO1xuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vY29yZS9Db21wb25lbnQnO1xuaW1wb3J0IHR5cGUgeyBJRW50aXR5IH0gZnJvbSAnLi4vLi4vY29yZS9FbnRpdHknO1xuaW1wb3J0IHsgYXBwbHlNaXhpbnMsIHR5cGUgRW50aXR5UmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL2NvcmUvRW50aXR5UmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBQcm9jZXNzQXBwcm9hY2gsIHR5cGUgUHJvY2Vzc0FwcHJvYWNoRW51bSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1Byb2Nlc3NBcHByb2FjaCc7XG5pbXBvcnQgeyBQcm9jZXNzU3RhZ2UgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Qcm9jZXNzU3RhZ2UnO1xuaW1wb3J0IHR5cGUgeyBQcmltaXRpdmUgfSBmcm9tICcuLi8uLi9nZW9tZXRyeS9QcmltaXRpdmUnO1xuaW1wb3J0IHsgaXNCbGVuZCwgaXNCbGVuZFdpdGhvdXRaV3JpdGUsIGlzQmxlbmRXaXRoWldyaXRlLCBpc1RyYW5zbHVjZW50IH0gZnJvbSAnLi4vLi4vZ2VvbWV0cnkvdHlwZXMvR2VvbWV0cnlUeXBlcyc7XG5pbXBvcnQgdHlwZSB7IENHQVBJU3RyYXRlZ3kgfSBmcm9tICcuLi8uLi9yZW5kZXJlci9DR0FQSVN0cmF0ZWd5JztcbmltcG9ydCB0eXBlIHsgUmVuZGVyUGFzcyB9IGZyb20gJy4uLy4uL3JlbmRlcmVyL1JlbmRlclBhc3MnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB7IE1vZHVsZU1hbmFnZXIgfSBmcm9tICcuLi8uLi9zeXN0ZW0vTW9kdWxlTWFuYWdlcic7XG5pbXBvcnQgdHlwZSB7IEN1YmVUZXh0dXJlIH0gZnJvbSAnLi4vLi4vdGV4dHVyZXMvQ3ViZVRleHR1cmUnO1xuaW1wb3J0IHR5cGUgeyBSZW5kZXJUYXJnZXRUZXh0dXJlQ3ViZSB9IGZyb20gJy4uLy4uL3RleHR1cmVzL1JlbmRlclRhcmdldFRleHR1cmVDdWJlJztcbmltcG9ydCB7IENhbWVyYUNvbXBvbmVudCB9IGZyb20gJy4uL0NhbWVyYS9DYW1lcmFDb21wb25lbnQnO1xuaW1wb3J0IHsgQ2FtZXJhQ29udHJvbGxlckNvbXBvbmVudCB9IGZyb20gJy4uL0NhbWVyYUNvbnRyb2xsZXIvQ2FtZXJhQ29udHJvbGxlckNvbXBvbmVudCc7XG5pbXBvcnQgdHlwZSB7IENvbXBvbmVudFRvQ29tcG9uZW50TWV0aG9kcyB9IGZyb20gJy4uL0NvbXBvbmVudFR5cGVzJztcbmltcG9ydCB0eXBlIHsgTWVzaENvbXBvbmVudCB9IGZyb20gJy4uL01lc2gvTWVzaENvbXBvbmVudCc7XG5pbXBvcnQgeyBTY2VuZUdyYXBoQ29tcG9uZW50IH0gZnJvbSAnLi4vU2NlbmVHcmFwaC9TY2VuZUdyYXBoQ29tcG9uZW50JztcbmltcG9ydCB7IFRyYW5zZm9ybUNvbXBvbmVudCB9IGZyb20gJy4uL1RyYW5zZm9ybS9UcmFuc2Zvcm1Db21wb25lbnQnO1xuaW1wb3J0IHsgV2VsbEtub3duQ29tcG9uZW50VElEcyB9IGZyb20gJy4uL1dlbGxLbm93bkNvbXBvbmVudFRJRHMnO1xuXG4vKipcbiAqIFJldXNhYmxlIHdvcmtpbmcgYnVmZmVycyBmb3Igb25lIHJlbmRlciBwYXNzLlxuICpcbiAqIGBzb3J0XyRyZW5kZXJgIHJ1bnMgZXZlcnkgZnJhbWUgYW5kIHVzZWQgdG8gYWxsb2NhdGUgYSBmaWx0ZXJlZCBtZXNoIGNvbXBvbmVudFxuICogYXJyYXksIGEgYFNldGAsIGEgbWFwcGVkIGFycmF5IGFuZCBzZXZlcmFsIGNsb3N1cmVzIHBlciBjYWxsLiBBbGwgb2YgdGhlbSBhcmVcbiAqIHJlcGxhY2VkIGJ5IHRoZXNlIHBlci1yZW5kZXItcGFzcyBzY3JhdGNoIGJ1ZmZlcnMuXG4gKi9cbnR5cGUgTWVzaFJlbmRlcmVyU29ydFNjcmF0Y2ggPSB7XG4gIC8qKiBQcmltaXRpdmVzIGNvbGxlY3RlZCBieSB0aGUgY3VsbGluZyBwYXNzLiAqL1xuICBwcmltaXRpdmVzOiBQcmltaXRpdmVbXTtcbiAgLyoqIFBlci1wcmltaXRpdmUgc3RhbXAgdXNlZCB0byByZW1vdmUgZHVwbGljYXRlcyB3aXRob3V0IGEgYFNldGAuICovXG4gIHN0YW1wOiBVaW50MzJBcnJheTtcbiAgLyoqIEN1cnJlbnQgc3RhbXAgdmFsdWU7IGEgcHJpbWl0aXZlIGlzIGEgZHVwbGljYXRlIHdoaWxlIGBzdGFtcFt1aWRdID09PSBzdGFtcFRpY2tgLiAqL1xuICBzdGFtcFRpY2s6IG51bWJlcjtcbiAgLyoqIFBlci1FbnRpdHlVSUQgc3RhbXA7IGFuIGVudGl0eSB3YXMgY3VsbGVkIGJ5IHRoZSBsYXRlc3QgY3VsbGluZyB3aGlsZSBgY3VsbGVkRW50aXR5U3RhbXBbdWlkXSA9PT0gY3VsbFRpY2tgLiAqL1xuICBjdWxsZWRFbnRpdHlTdGFtcDogVWludDMyQXJyYXk7XG4gIC8qKiBQZXItRW50aXR5VUlEIHN0YW1wOyBhbiBlbnRpdHkgd2FzIGhhbmRsZWQgYnkgdGhlIGxhdGVzdCBjdWxsaW5nIHdoaWxlIGBoYW5kbGVkRW50aXR5U3RhbXBbdWlkXSA9PT0gY3VsbFRpY2tgLiAqL1xuICBoYW5kbGVkRW50aXR5U3RhbXA6IFVpbnQzMkFycmF5O1xuICAvKiogUGVyLW1lc2ggc3RhbXA7IHRoZSBpbnN0YW5jZXMgc2hhcmluZyBhIG1lc2ggd2VyZSBjdWxsZWQgYnkgdGhlIGxhdGVzdCBjdWxsaW5nIHdoaWxlIGl0IGVxdWFscyBgY3VsbFRpY2tgLiAqL1xuICBtZXNoQ3VsbFRpY2s6IFdlYWtNYXA8b2JqZWN0LCBudW1iZXI+O1xuICAvKiogU3RhbXAgdmFsdWUgb2YgdGhlIGxhdGVzdCBjdWxsaW5nIG9mIHRoaXMgcmVuZGVyIHBhc3MgKDAgbWVhbnMgbm8gY3VsbGluZyBoYXMgcnVuIHlldCkuICovXG4gIGN1bGxUaWNrOiBudW1iZXI7XG4gIC8qKiBOdW1iZXIgb2YgZW50aXRpZXMgY3VsbGVkIGJ5IHRoZSBsYXRlc3QgY3VsbGluZy4gMCBtZWFucyBldmVyeSBpbnN0YW5jZSBzdGF5cyB2aXNpYmxlLiAqL1xuICBjdWxsZWRFbnRpdHlDb3VudDogbnVtYmVyO1xuICAvKiogR2xvYmFsbHkgdW5pcXVlIGlkIG9mIHRoZSBsYXRlc3QgY3VsbGluZywgdXNlZCB0byB2aXNpdCBlYWNoIG1lc2ggb25jZSBpbiB0aGUgaW5zdGFuY2UgcHJlcGFzcy4gKi9cbiAgY3VsbGluZ0lkOiBudW1iZXI7XG4gIC8qKiBSZXVzZWQgb2JqZWN0cyBvZiB0aGUgb3BhcXVlIG11bHRpLWRyYXcgcmVvcmRlciwgc28gYSBzb3J0IGRvZXMgbm90IGFsbG9jYXRlIHBlciBwcmltaXRpdmUuICovXG4gIGtleWVkUHJpbWl0aXZlczogeyBwcmltaXRpdmU6IFByaW1pdGl2ZSB8IG51bGw7IGtleUlkOiBudW1iZXI7IGluZGV4OiBudW1iZXIgfVtdO1xuICAvKiogV2hldGhlciB0aGUgbGF0ZXN0IHNvcnQgcmFuIHdpdGggR1BVIGN1bGxpbmcgYWN0aXZlIChzZWUgYF9pc0dwdUN1bGxpbmdBY3RpdmVgKTsgdW5kZWZpbmVkIGJlZm9yZSB0aGUgZmlyc3QuICovXG4gIGlzR3B1Q3VsbGluZ0FjdGl2ZTogYm9vbGVhbiB8IHVuZGVmaW5lZDtcbiAgLyoqIGBDb25maWcuaXNDb21wdXRlU2tpbm5pbmdFbmFibGVkYCBvZiB0aGUgbGF0ZXN0IHNvcnQ7IHVuZGVmaW5lZCBiZWZvcmUgdGhlIGZpcnN0LiAqL1xuICBpc0NvbXB1dGVTa2lubmluZ0VuYWJsZWQ6IGJvb2xlYW4gfCB1bmRlZmluZWQ7XG4gIC8qKlxuICAgKiBUaGUgY3VsbGVkIG1lc2ggY29tcG9uZW50cyBvZiB0aGUgbGF0ZXN0IGN1bGxpbmcgd2hvc2UgbWVzaCBpcyBzaGFyZWQgYnkgb3RoZXIgaW5zdGFuY2VzLiBUaGVpciBwcmltaXRpdmVzIGFyZVxuICAgKiBzdGlsbCBkcmF3biB3aGVuIGFub3RoZXIgaW5zdGFuY2Ugb2YgdGhlIG1lc2ggaXMgdmlzaWJsZSAoc2VlIGBfX2FwcGVuZFByaW1pdGl2ZXNPZkN1bGxlZEluc3RhbmNlZE1lc2hlc2ApLlxuICAgKi9cbiAgY3VsbGVkSW5zdGFuY2VkTWVzaENvbXBvbmVudHM6IE1lc2hDb21wb25lbnRbXTtcbiAgLyoqIFBlci1tZXNoIHN0YW1wOyB0aGUgcHJpbWl0aXZlcyBvZiB0aGUgbWVzaCB3ZXJlIGFwcGVuZGVkIGJ5IHRoZSBsYXRlc3QgY3VsbGluZyB3aGlsZSBpdCBlcXVhbHMgYGN1bGxUaWNrYC4gKi9cbiAgbWVzaEFwcGVuZFRpY2s6IFdlYWtNYXA8b2JqZWN0LCBudW1iZXI+O1xufTtcblxuLyoqXG4gKiBDdWxsaW5nIHJlc3VsdCBvZiBhIHJlbmRlciBwYXNzIGZvciBwZXItaW5zdGFuY2UgY3VsbGluZyBvZiBpbnN0YW5jZWQgZHJhdyBjYWxscy5cbiAqIEFuIGVudGl0eSB3YXMgY3VsbGVkIGluIHRoZSByZW5kZXIgcGFzcyB3aGlsZSBgY3VsbGVkRW50aXR5U3RhbXBbZW50aXR5VUlEXSA9PT0gY3VsbFRpY2tgLlxuICovXG5leHBvcnQgdHlwZSBJbnN0YW5jZUN1bGxpbmdTdGF0ZSA9IHtcbiAgcmVhZG9ubHkgY3VsbGVkRW50aXR5U3RhbXA6IFVpbnQzMkFycmF5O1xuICByZWFkb25seSBjdWxsVGljazogbnVtYmVyO1xuICAvKiogTnVtYmVyIG9mIGVudGl0aWVzIGN1bGxlZCBieSB0aGUgbGF0ZXN0IGN1bGxpbmcuIDAgbWVhbnMgZXZlcnkgaW5zdGFuY2Ugc3RheXMgdmlzaWJsZS4gKi9cbiAgcmVhZG9ubHkgY3VsbGVkRW50aXR5Q291bnQ6IG51bWJlcjtcbiAgLyoqIEdsb2JhbGx5IHVuaXF1ZSBpZCBvZiB0aGUgbGF0ZXN0IGN1bGxpbmcuICovXG4gIHJlYWRvbmx5IGN1bGxpbmdJZDogbnVtYmVyO1xufTtcblxuLyoqXG4gKiBNZXNoUmVuZGVyZXJDb21wb25lbnQgaXMgYSBjb21wb25lbnQgdGhhdCBtYW5hZ2VzIHRoZSByZW5kZXJpbmcgb2YgYSBtZXNoIGVudGl0eS5cbiAqIEl0IGhhbmRsZXMgbWVzaCByZW5kZXJpbmcgcGlwZWxpbmUsIElCTCAoSW1hZ2UtQmFzZWQgTGlnaHRpbmcpIGN1YmUgbWFwcywgZnJ1c3R1bSBjdWxsaW5nLFxuICogYW5kIHJlbmRlcmluZyBvcHRpbWl6YXRpb24gdGhyb3VnaCB2YXJpb3VzIHN0cmF0ZWdpZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBNZXNoUmVuZGVyZXJDb21wb25lbnQgZXh0ZW5kcyBDb21wb25lbnQge1xuICBwcml2YXRlIF9fZGlmZnVzZUN1YmVNYXA/OiBDdWJlVGV4dHVyZSB8IFJlbmRlclRhcmdldFRleHR1cmVDdWJlO1xuICBwcml2YXRlIF9fc3BlY3VsYXJDdWJlTWFwPzogQ3ViZVRleHR1cmUgfCBSZW5kZXJUYXJnZXRUZXh0dXJlQ3ViZTtcbiAgcHJpdmF0ZSBfX3NoZWVuQ3ViZU1hcD86IEN1YmVUZXh0dXJlIHwgUmVuZGVyVGFyZ2V0VGV4dHVyZUN1YmU7XG4gIHByaXZhdGUgX19kaWZmdXNlQ3ViZU1hcENvbnRyaWJ1dGlvbiA9IDEuMDtcbiAgcHJpdmF0ZSBfX3NwZWN1bGFyQ3ViZU1hcENvbnRyaWJ1dGlvbiA9IDEuMDtcbiAgcHJpdmF0ZSBfX3JvdGF0aW9uT2ZDdWJlTWFwID0gMDtcblxuICBwcml2YXRlIHN0YXRpYyBfX2NnQXBpUmVuZGVyaW5nU3RyYXRlZ3lNYXA6IE1hcDxPYmplY3RVSUQsIENHQVBJU3RyYXRlZ3k+ID0gbmV3IE1hcCgpO1xuICBzdGF0aWMgX19zaGFkZXJQcm9ncmFtSGFuZGxlT2ZQcmltaXRpdmVPYmplY3RVaWRzOiBNYXA8T2JqZWN0VUlELCBDR0FQSVJlc291cmNlSGFuZGxlPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfX3VwZGF0ZUNvdW50ID0gMDtcbiAgcHJpdmF0ZSBzdGF0aWMgX191cGRhdGVDb3VudCA9IDA7XG4gIHB1YmxpYyBzdGF0aWMgX2lzRnJ1c3R1bUN1bGxpbmdFbmFibGVkID0gdHJ1ZTtcbiAgLyoqIE1vbm90b25pYyBpZCBvZiB0aGUgbGF0ZXN0IGN1bGxpbmcgcGFzcywgdXNlZCBhcyBhIHBlci1tZXNoIHZpc2l0IHN0YW1wLiAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2N1bGxpbmdJZENvdW50ZXIgPSAwO1xuXG4gIHByaXZhdGUgX19maW5nZXJQcmludCA9ICcnO1xuICBwcml2YXRlIF9fZmluZ2VyUHJpbnRJZCA9IDA7XG4gIC8qKlxuICAgKiBJbnRlcm5lZCBpZHMgb2YgbWVzaCByZW5kZXJlciBmaW5nZXJwcmludHMuIFRoZSBmaW5nZXJwcmludCBjaGFuZ2VzIG9ubHkgd2hlbiB0aGUgSUJMIGN1YmVcbiAgICogbWFwcyBjaGFuZ2UsIGFuZCB0d28gbWVzaCByZW5kZXJlcnMgd2l0aCB0aGUgc2FtZSBjdWJlIG1hcHMgbXVzdCBzaGFyZSBhIG11bHRpLWRyYXcgYmF0Y2gsXG4gICAqIHNvIHRoZSBpZCBpcyBpbnRlcm5lZCBieSB2YWx1ZSBpbnN0ZWFkIG9mIGJlaW5nIHVuaXF1ZSBwZXIgY29tcG9uZW50LlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19maW5nZXJQcmludElkcyA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG4gIHByaXZhdGUgc3RhdGljIF9fbmV4dEZpbmdlclByaW50SWQgPSAwO1xuXG4gIC8qKiBQZXItcmVuZGVyLXBhc3Mgc2NyYXRjaCBidWZmZXJzIHJldXNlZCBieSBzb3J0XyRyZW5kZXIgdG8gYXZvaWQgcGVyLWZyYW1lIGFsbG9jYXRpb25zLiAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3NvcnRTY3JhdGNoTWFwOiBXZWFrTWFwPFJlbmRlclBhc3MsIE1lc2hSZW5kZXJlclNvcnRTY3JhdGNoPiA9IG5ldyBXZWFrTWFwKCk7XG5cbiAgLyoqIE1lbW9pemVkIHJlbmRlcmluZyBzdHJhdGVneSBmb3IgY29tbW9uXyRwcmVyZW5kZXIgKHRoZSBob3QgcGF0aCBydW5zIG9uY2UgcGVyIGZyYW1lKS4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19wcmVyZW5kZXJTdHJhdGVneUVuZ2luZVVpZDogT2JqZWN0VUlEID0gLTE7XG4gIHByaXZhdGUgc3RhdGljIF9fcHJlcmVuZGVyU3RyYXRlZ3k6IENHQVBJU3RyYXRlZ3kgfCB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgTWVzaFJlbmRlcmVyQ29tcG9uZW50IGluc3RhbmNlLlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gZW50aXR5VWlkIC0gVGhlIHVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSBlbnRpdHkgdGhpcyBjb21wb25lbnQgYmVsb25ncyB0b1xuICAgKiBAcGFyYW0gY29tcG9uZW50U2lkIC0gVGhlIGNvbXBvbmVudCdzIHN5c3RlbSBpZGVudGlmaWVyXG4gICAqIEBwYXJhbSBlbnRpdHlSZXBvc2l0b3J5IC0gVGhlIHJlcG9zaXRvcnkgbWFuYWdpbmcgZW50aXRpZXNcbiAgICogQHBhcmFtIGlzUmVVc2UgLSBXaGV0aGVyIHRoaXMgY29tcG9uZW50IGlzIGJlaW5nIHJldXNlZCBmcm9tIGEgcG9vbFxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgZW50aXR5VWlkOiBFbnRpdHlVSUQsXG4gICAgY29tcG9uZW50U2lkOiBDb21wb25lbnRTSUQsXG4gICAgZW50aXR5UmVwb3NpdG9yeTogRW50aXR5UmVwb3NpdG9yeSxcbiAgICBpc1JlVXNlOiBib29sZWFuXG4gICkge1xuICAgIHN1cGVyKGVuZ2luZSwgZW50aXR5VWlkLCBjb21wb25lbnRTaWQsIGVudGl0eVJlcG9zaXRvcnksIGlzUmVVc2UpO1xuICAgIHRoaXMuY2FsY0ZpbmdlclByaW50KCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY29tcG9uZW50IHR5cGUgSUQgZm9yIE1lc2hSZW5kZXJlckNvbXBvbmVudC5cbiAgICogQHJldHVybnMgVGhlIGNvbXBvbmVudCB0eXBlIElEXG4gICAqL1xuICBzdGF0aWMgZ2V0IGNvbXBvbmVudFRJRCgpIHtcbiAgICByZXR1cm4gV2VsbEtub3duQ29tcG9uZW50VElEcy5NZXNoUmVuZGVyZXJDb21wb25lbnRUSUQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY29tcG9uZW50IHR5cGUgSUQgZm9yIHRoaXMgaW5zdGFuY2UuXG4gICAqIEByZXR1cm5zIFRoZSBjb21wb25lbnQgdHlwZSBJRFxuICAgKi9cbiAgZ2V0IGNvbXBvbmVudFRJRCgpOiBDb21wb25lbnRUSUQge1xuICAgIHJldHVybiBXZWxsS25vd25Db21wb25lbnRUSURzLk1lc2hSZW5kZXJlckNvbXBvbmVudFRJRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBkaWZmdXNlIGN1YmUgbWFwIHVzZWQgZm9yIElCTCBsaWdodGluZy5cbiAgICogQHJldHVybnMgVGhlIGRpZmZ1c2UgY3ViZSBtYXAgdGV4dHVyZSBvciB1bmRlZmluZWQgaWYgbm90IHNldFxuICAgKi9cbiAgZ2V0IGRpZmZ1c2VDdWJlTWFwKCkge1xuICAgIHJldHVybiB0aGlzLl9fZGlmZnVzZUN1YmVNYXA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc3BlY3VsYXIgY3ViZSBtYXAgdXNlZCBmb3IgSUJMIGxpZ2h0aW5nLlxuICAgKiBAcmV0dXJucyBUaGUgc3BlY3VsYXIgY3ViZSBtYXAgdGV4dHVyZSBvciB1bmRlZmluZWQgaWYgbm90IHNldFxuICAgKi9cbiAgZ2V0IHNwZWN1bGFyQ3ViZU1hcCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX3NwZWN1bGFyQ3ViZU1hcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzaGVlbiBjdWJlIG1hcCB1c2VkIGZvciBJQkwgbGlnaHRpbmcuXG4gICAqIEByZXR1cm5zIFRoZSBzaGVlbiBjdWJlIG1hcCB0ZXh0dXJlIG9yIHVuZGVmaW5lZCBpZiBub3Qgc2V0XG4gICAqL1xuICBnZXQgc2hlZW5DdWJlTWFwKCkge1xuICAgIHJldHVybiB0aGlzLl9fc2hlZW5DdWJlTWFwO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHVwZGF0ZSBjb3VudCBmb3IgdGhpcyBjb21wb25lbnQgaW5zdGFuY2UuXG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50IHVwZGF0ZSBjb3VudFxuICAgKi9cbiAgZ2V0IHVwZGF0ZUNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLl9fdXBkYXRlQ291bnQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZ2xvYmFsIHVwZGF0ZSBjb3VudCBmb3IgYWxsIE1lc2hSZW5kZXJlckNvbXBvbmVudCBpbnN0YW5jZXMuXG4gICAqIEByZXR1cm5zIFRoZSBnbG9iYWwgdXBkYXRlIGNvdW50XG4gICAqL1xuICBzdGF0aWMgZ2V0IHVwZGF0ZUNvdW50KCkge1xuICAgIHJldHVybiBNZXNoUmVuZGVyZXJDb21wb25lbnQuX191cGRhdGVDb3VudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb250cmlidXRpb24gZmFjdG9yIGZvciB0aGUgZGlmZnVzZSBjdWJlIG1hcCBpbiBJQkwgY2FsY3VsYXRpb25zLlxuICAgKiBAcmV0dXJucyBUaGUgZGlmZnVzZSBjdWJlIG1hcCBjb250cmlidXRpb24gZmFjdG9yICgwLjAgdG8gMS4wKVxuICAgKi9cbiAgZ2V0IGRpZmZ1c2VDdWJlTWFwQ29udHJpYnV0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9fZGlmZnVzZUN1YmVNYXBDb250cmlidXRpb247XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY29udHJpYnV0aW9uIGZhY3RvciBmb3IgdGhlIGRpZmZ1c2UgY3ViZSBtYXAgaW4gSUJMIGNhbGN1bGF0aW9ucy5cbiAgICogQHBhcmFtIGNvbnRyaWJ1dGlvbiAtIFRoZSBjb250cmlidXRpb24gZmFjdG9yICgwLjAgdG8gMS4wKVxuICAgKi9cbiAgc2V0IGRpZmZ1c2VDdWJlTWFwQ29udHJpYnV0aW9uKGNvbnRyaWJ1dGlvbjogbnVtYmVyKSB7XG4gICAgdGhpcy5fX2RpZmZ1c2VDdWJlTWFwQ29udHJpYnV0aW9uID0gY29udHJpYnV0aW9uO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY29udHJpYnV0aW9uIGZhY3RvciBmb3IgdGhlIHNwZWN1bGFyIGN1YmUgbWFwIGluIElCTCBjYWxjdWxhdGlvbnMuXG4gICAqIEByZXR1cm5zIFRoZSBzcGVjdWxhciBjdWJlIG1hcCBjb250cmlidXRpb24gZmFjdG9yICgwLjAgdG8gMS4wKVxuICAgKi9cbiAgZ2V0IHNwZWN1bGFyQ3ViZU1hcENvbnRyaWJ1dGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fX3NwZWN1bGFyQ3ViZU1hcENvbnRyaWJ1dGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjb250cmlidXRpb24gZmFjdG9yIGZvciB0aGUgc3BlY3VsYXIgY3ViZSBtYXAgaW4gSUJMIGNhbGN1bGF0aW9ucy5cbiAgICogQHBhcmFtIGNvbnRyaWJ1dGlvbiAtIFRoZSBjb250cmlidXRpb24gZmFjdG9yICgwLjAgdG8gMS4wKVxuICAgKi9cbiAgc2V0IHNwZWN1bGFyQ3ViZU1hcENvbnRyaWJ1dGlvbihjb250cmlidXRpb246IG51bWJlcikge1xuICAgIHRoaXMuX19zcGVjdWxhckN1YmVNYXBDb250cmlidXRpb24gPSBjb250cmlidXRpb247XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSByb3RhdGlvbiBhbmdsZSBvZiB0aGUgY3ViZSBtYXAgaW4gcmFkaWFucy5cbiAgICogQHJldHVybnMgVGhlIHJvdGF0aW9uIGFuZ2xlIGluIHJhZGlhbnNcbiAgICovXG4gIGdldCByb3RhdGlvbk9mQ3ViZU1hcCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX3JvdGF0aW9uT2ZDdWJlTWFwO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHJvdGF0aW9uIGFuZ2xlIG9mIHRoZSBjdWJlIG1hcCBpbiByYWRpYW5zLlxuICAgKiBAcGFyYW0gcm90YXRpb24gLSBUaGUgcm90YXRpb24gYW5nbGUgaW4gcmFkaWFuc1xuICAgKi9cbiAgc2V0IHJvdGF0aW9uT2ZDdWJlTWFwKHJvdGF0aW9uOiBudW1iZXIpIHtcbiAgICB0aGlzLl9fcm90YXRpb25PZkN1YmVNYXAgPSByb3RhdGlvbjtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgYW5kIHVwZGF0ZXMgdGhlIGZpbmdlcnByaW50IGZvciB0aGlzIGNvbXBvbmVudCBiYXNlZCBvbiBjdXJyZW50IGN1YmUgbWFwIHNldHRpbmdzLlxuICAgKiBUaGUgZmluZ2VycHJpbnQgaXMgdXNlZCBmb3IgY2FjaGluZyBhbmQgb3B0aW1pemF0aW9uIHB1cnBvc2VzLlxuICAgKi9cbiAgY2FsY0ZpbmdlclByaW50KCkge1xuICAgIHRoaXMuX19maW5nZXJQcmludCA9IGAke3RoaXMuX19kaWZmdXNlQ3ViZU1hcCAhPSBudWxsID8gdGhpcy5fX2RpZmZ1c2VDdWJlTWFwLnRleHR1cmVVSUQgOiAtMX0gJHt0aGlzLl9fc3BlY3VsYXJDdWJlTWFwICE9IG51bGwgPyB0aGlzLl9fc3BlY3VsYXJDdWJlTWFwLnRleHR1cmVVSUQgOiAtMX0gJHt0aGlzLl9fc2hlZW5DdWJlTWFwICE9IG51bGwgPyB0aGlzLl9fc2hlZW5DdWJlTWFwLnRleHR1cmVVSUQgOiAtMX1gO1xuICAgIHRoaXMuX19maW5nZXJQcmludElkID0gTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9faW50ZXJuRmluZ2VyUHJpbnRJZCh0aGlzLl9fZmluZ2VyUHJpbnQpO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19pbnRlcm5GaW5nZXJQcmludElkKGZpbmdlclByaW50OiBzdHJpbmcpOiBudW1iZXIge1xuICAgIGxldCBpZCA9IE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2ZpbmdlclByaW50SWRzLmdldChmaW5nZXJQcmludCk7XG4gICAgaWYgKGlkID09IG51bGwpIHtcbiAgICAgIGlkID0gKytNZXNoUmVuZGVyZXJDb21wb25lbnQuX19uZXh0RmluZ2VyUHJpbnRJZDtcbiAgICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2ZpbmdlclByaW50SWRzLnNldChmaW5nZXJQcmludCwgaWQpO1xuICAgIH1cbiAgICByZXR1cm4gaWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCBmaW5nZXJwcmludCBvZiB0aGlzIGNvbXBvbmVudC5cbiAgICogQHJldHVybnMgVGhlIGZpbmdlcnByaW50IHN0cmluZ1xuICAgKi9cbiAgZ2V0RmluZ2VyUHJpbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19maW5nZXJQcmludDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbnRlcm5lZCBudW1lcmljIGlkIG9mIHRoZSBmaW5nZXJwcmludC4gTnVtZXJpYyBpZHMga2VlcCB0aGUgcGVyLWZyYW1lXG4gICAqIG11bHRpLWRyYXcgc3RhdGUga2V5cyBjaGVhcCB0byBjb21wYXJlLlxuICAgKiBAcmV0dXJucyBUaGUgZmluZ2VycHJpbnQgaWRcbiAgICovXG4gIGdldEZpbmdlclByaW50SWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19maW5nZXJQcmludElkO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIElCTCAoSW1hZ2UtQmFzZWQgTGlnaHRpbmcpIGN1YmUgbWFwcyBmb3IgdGhpcyBtZXNoIHJlbmRlcmVyLlxuICAgKiBAcGFyYW0gZGlmZnVzZUN1YmVUZXh0dXJlIC0gVGhlIGRpZmZ1c2UgY3ViZSBtYXAgdGV4dHVyZSBmb3IgSUJMXG4gICAqIEBwYXJhbSBzcGVjdWxhckN1YmVUZXh0dXJlIC0gVGhlIHNwZWN1bGFyIGN1YmUgbWFwIHRleHR1cmUgZm9yIElCTFxuICAgKiBAcGFyYW0gc2hlZW5DdWJlVGV4dHVyZSAtIE9wdGlvbmFsIHNoZWVuIGN1YmUgbWFwIHRleHR1cmUgZm9yIElCTFxuICAgKi9cbiAgc2V0SUJMQ3ViZU1hcChcbiAgICBkaWZmdXNlQ3ViZVRleHR1cmU6IEN1YmVUZXh0dXJlIHwgUmVuZGVyVGFyZ2V0VGV4dHVyZUN1YmUsXG4gICAgc3BlY3VsYXJDdWJlVGV4dHVyZTogQ3ViZVRleHR1cmUgfCBSZW5kZXJUYXJnZXRUZXh0dXJlQ3ViZSxcbiAgICBzaGVlbkN1YmVUZXh0dXJlPzogQ3ViZVRleHR1cmUgfCBSZW5kZXJUYXJnZXRUZXh0dXJlQ3ViZVxuICApIHtcbiAgICBpZiAoZGlmZnVzZUN1YmVUZXh0dXJlID09IG51bGwgfHwgc3BlY3VsYXJDdWJlVGV4dHVyZSA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fX2RpZmZ1c2VDdWJlTWFwID0gZGlmZnVzZUN1YmVUZXh0dXJlO1xuICAgIHRoaXMuX19zcGVjdWxhckN1YmVNYXAgPSBzcGVjdWxhckN1YmVUZXh0dXJlO1xuICAgIHRoaXMuX19zaGVlbkN1YmVNYXAgPSBzaGVlbkN1YmVUZXh0dXJlO1xuXG4gICAgdGhpcy5jYWxjRmluZ2VyUHJpbnQoKTtcblxuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogQ29tbW9uIGxvYWRpbmcgbWV0aG9kIHRoYXQgaW5pdGlhbGl6ZXMgdGhlIHJlbmRlcmluZyBzdHJhdGVneSBiYXNlZCBvbiB0aGUgcHJvY2VzcyBhcHByb2FjaC5cbiAgICogVGhpcyBtZXRob2Qgc2V0cyB1cCBlaXRoZXIgV2ViR1BVIG9yIFdlYkdMIHJlbmRlcmluZyBzdHJhdGVnaWVzLlxuICAgKiBAcGFyYW0gcHJvY2Vzc0FwcHJvYWNoIC0gVGhlIGdyYXBoaWNzIEFQSSBhcHByb2FjaCB0byB1c2UgKFdlYkdQVSBvciBXZWJHTClcbiAgICovXG4gIHN0YXRpYyBjb21tb25fJGxvYWQoeyBwcm9jZXNzQXBwcm9hY2gsIGVuZ2luZSB9OiB7IHByb2Nlc3NBcHByb2FjaDogUHJvY2Vzc0FwcHJvYWNoRW51bTsgZW5naW5lOiBFbmdpbmUgfSkge1xuICAgIGNvbnN0IG1vZHVsZU1hbmFnZXIgPSBNb2R1bGVNYW5hZ2VyLmdldEluc3RhbmNlKCk7XG4gICAgY29uc3QgZW5naW5lVWlkID0gZW5naW5lLm9iamVjdFVJRDtcblxuICAgIC8vIFN0cmF0ZWd5XG4gICAgaWYgKHByb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgY29uc3QgbW9kdWxlTmFtZSA9ICd3ZWJncHUnO1xuICAgICAgY29uc3Qgd2ViZ3B1TW9kdWxlID0gbW9kdWxlTWFuYWdlci5nZXRNb2R1bGUobW9kdWxlTmFtZSkhIGFzIFJuV2ViR3B1O1xuICAgICAgaWYgKCFNZXNoUmVuZGVyZXJDb21wb25lbnQuX19jZ0FwaVJlbmRlcmluZ1N0cmF0ZWd5TWFwLmhhcyhlbmdpbmVVaWQpKSB7XG4gICAgICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2NnQXBpUmVuZGVyaW5nU3RyYXRlZ3lNYXAuc2V0KGVuZ2luZVVpZCwgd2ViZ3B1TW9kdWxlLldlYkdwdVN0cmF0ZWd5QmFzaWMuaW5pdChlbmdpbmUpKTtcbiAgICAgIH1cbiAgICAgIChNZXNoUmVuZGVyZXJDb21wb25lbnQuX19jZ0FwaVJlbmRlcmluZ1N0cmF0ZWd5TWFwLmdldChlbmdpbmVVaWQpIGFzIFdlYkdwdVN0cmF0ZWd5QmFzaWMpLmNvbW1vbl8kbG9hZCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBtb2R1bGVOYW1lID0gJ3dlYmdsJztcbiAgICAgIGNvbnN0IHdlYmdsTW9kdWxlID0gbW9kdWxlTWFuYWdlci5nZXRNb2R1bGUobW9kdWxlTmFtZSkhIGFzIFJuV2ViR0w7XG4gICAgICBpZiAoIU1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2NnQXBpUmVuZGVyaW5nU3RyYXRlZ3lNYXAuaGFzKGVuZ2luZVVpZCkpIHtcbiAgICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fY2dBcGlSZW5kZXJpbmdTdHJhdGVneU1hcC5zZXQoXG4gICAgICAgICAgZW5naW5lVWlkLFxuICAgICAgICAgIHdlYmdsTW9kdWxlLmdldFJlbmRlcmluZ1N0cmF0ZWd5KGVuZ2luZSwgcHJvY2Vzc0FwcHJvYWNoKVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgKE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2NnQXBpUmVuZGVyaW5nU3RyYXRlZ3lNYXAuZ2V0KGVuZ2luZVVpZCkgYXMgV2ViR0xTdHJhdGVneSkuY29tbW9uXyRsb2FkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIGFuZCBpbml0aWFsaXplcyB0aGlzIG1lc2ggcmVuZGVyZXIgY29tcG9uZW50LlxuICAgKiBTZXRzIHVwIHRoZSBjb21wb25lbnQgZm9yIHJlbmRlcmluZyBieSBsb2FkaW5nIHRoZSBhc3NvY2lhdGVkIG1lc2guXG4gICAqL1xuICAkbG9hZCgpIHtcbiAgICBjb25zdCBzdHJhdGVneSA9IE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2NnQXBpUmVuZGVyaW5nU3RyYXRlZ3lNYXAuZ2V0KHRoaXMuX19lbmdpbmUub2JqZWN0VUlEKTtcbiAgICBjb25zdCByZWFkeSA9IHN0cmF0ZWd5IS4kbG9hZCh0aGlzLmVudGl0eS50cnlUb0dldE1lc2goKSEpO1xuICAgIGlmIChyZWFkeSkge1xuICAgICAgdGhpcy5tb3ZlU3RhZ2VUbyhQcm9jZXNzU3RhZ2UuVW5rbm93bik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNvcnRzIGFuZCBmaWx0ZXJzIG1lc2ggY29tcG9uZW50cyBmb3IgcmVuZGVyaW5nIGJhc2VkIG9uIGNhbWVyYSBmcnVzdHVtIGFuZCBtYXRlcmlhbCBwcm9wZXJ0aWVzLlxuICAgKiBQZXJmb3JtcyBmcnVzdHVtIGN1bGxpbmcgYW5kIHNvcnRzIHByaW1pdGl2ZXMgYnkgcmVuZGVyIG9yZGVyIGFuZCBkZXB0aC5cbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIHJlbmRlclBhc3MgLSBUaGUgcmVuZGVyIHBhc3MgY29udGFpbmluZyBtZXNoIGNvbXBvbmVudHMgYW5kIHJlbmRlcmluZyBjb250ZXh0XG4gICAqIEByZXR1cm5zIEFycmF5IG9mIHByaW1pdGl2ZSBVSURzIHNvcnRlZCBmb3Igb3B0aW1hbCByZW5kZXJpbmdcbiAgICovXG4gIHN0YXRpYyBzb3J0XyRyZW5kZXIoZW5naW5lOiBFbmdpbmUsIHJlbmRlclBhc3M6IFJlbmRlclBhc3MpOiBDb21wb25lbnRTSURbXSB7XG4gICAgY29uc3Qgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkgPSBlbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgY29uc3QgbXVsdGlEcmF3R3JvdXBWZXJzaW9uID1cbiAgICAgIHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5ICE9IG51bGwgPyB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5nZXRNdWx0aURyYXdSZXBvc2l0b3J5KGVuZ2luZSkudmVyc2lvbiA6IDA7XG4gICAgY29uc3Qgc2NyYXRjaCA9IE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2dldFNvcnRTY3JhdGNoKHJlbmRlclBhc3MpO1xuICAgIGNvbnN0IGlzR3B1Q3VsbGluZ0FjdGl2ZSA9IE1lc2hSZW5kZXJlckNvbXBvbmVudC5faXNHcHVDdWxsaW5nQWN0aXZlKGVuZ2luZSwgcmVuZGVyUGFzcyk7XG4gICAgaWYgKFxuICAgICAgVHJhbnNmb3JtQ29tcG9uZW50LmdldFVwZGF0ZUNvdW50KGVuZ2luZSkgPT09IHJlbmRlclBhc3MuX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQgJiZcbiAgICAgIENhbWVyYUNvbnRyb2xsZXJDb21wb25lbnQuZ2V0VXBkYXRlQ291bnQoZW5naW5lKSA9PT0gcmVuZGVyUGFzcy5fbGFzdENhbWVyYUNvbnRyb2xsZXJDb21wb25lbnRzVXBkYXRlQ291bnQgJiZcbiAgICAgIFNjZW5lR3JhcGhDb21wb25lbnQuZ2V0VXBkYXRlQ291bnQoZW5naW5lKSA9PT0gcmVuZGVyUGFzcy5fbGFzdFNjZW5lR3JhcGhDb21wb25lbnRzVXBkYXRlQ291bnQgJiZcbiAgICAgIG11bHRpRHJhd0dyb3VwVmVyc2lvbiA9PT0gcmVuZGVyUGFzcy5fbGFzdE11bHRpRHJhd0dyb3VwVmVyc2lvbiAmJlxuICAgICAgaXNHcHVDdWxsaW5nQWN0aXZlID09PSBzY3JhdGNoLmlzR3B1Q3VsbGluZ0FjdGl2ZSAmJlxuICAgICAgZW5naW5lLmNvbmZpZy5pc0NvbXB1dGVTa2lubmluZ0VuYWJsZWQgPT09IHNjcmF0Y2guaXNDb21wdXRlU2tpbm5pbmdFbmFibGVkXG4gICAgKSB7XG4gICAgICByZXR1cm4gcmVuZGVyUGFzcy5fbGFzdFByaW1pdGl2ZVVpZHM7XG4gICAgfVxuICAgIHNjcmF0Y2guaXNHcHVDdWxsaW5nQWN0aXZlID0gaXNHcHVDdWxsaW5nQWN0aXZlO1xuICAgIC8vIE1lc2guX2lzR3B1Q3VsbGFibGUgb2YgdGhlIGRlZm9ybWVkIG1lc2hlcyBkZXBlbmRzIG9uIGl0LlxuICAgIHNjcmF0Y2guaXNDb21wdXRlU2tpbm5pbmdFbmFibGVkID0gZW5naW5lLmNvbmZpZy5pc0NvbXB1dGVTa2lubmluZ0VuYWJsZWQ7XG5cbiAgICAvLyBnZXQgQ2FtZXJhQ29tcG9uZW50XG4gICAgbGV0IGNhbWVyYUNvbXBvbmVudCA9IHJlbmRlclBhc3MuY2FtZXJhQ29tcG9uZW50O1xuICAgIC8vIElmIHRoZSByZW5kZXJQYXNzIGRvZXNuJ3QgaGF2ZSBhIGNhbWVyYUNvbXBvbmVudCwgdGhlbiB3ZSBnZXQgaXQgb2YgdGhlIG1haW4gY2FtZXJhXG4gICAgaWYgKGNhbWVyYUNvbXBvbmVudCA9PSBudWxsKSB7XG4gICAgICBjYW1lcmFDb21wb25lbnQgPSBlbmdpbmUuY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnQoXG4gICAgICAgIENhbWVyYUNvbXBvbmVudCxcbiAgICAgICAgQ2FtZXJhQ29tcG9uZW50LmdldEN1cnJlbnQoZW5naW5lKVxuICAgICAgKSBhcyBDYW1lcmFDb21wb25lbnQ7XG4gICAgfVxuICAgIGlmIChjYW1lcmFDb21wb25lbnQgPT0gbnVsbCkge1xuICAgICAgY29uc3QgY2FtZXJhQ29tcG9uZW50cyA9IGVuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudHNXaXRoVHlwZShDYW1lcmFDb21wb25lbnQpIGFzIENhbWVyYUNvbXBvbmVudFtdO1xuICAgICAgY2FtZXJhQ29tcG9uZW50ID0gY2FtZXJhQ29tcG9uZW50cy5maW5kKGMgPT4gYz8uX2lzQWxpdmUpITtcbiAgICAgIENhbWVyYUNvbXBvbmVudC5zZXRDdXJyZW50KGVuZ2luZSwgY2FtZXJhQ29tcG9uZW50LmNvbXBvbmVudFNJRCk7XG4gICAgfVxuICAgIGlmIChyZW5kZXJQYXNzLmlzVnJSZW5kZXJpbmcpIHtcbiAgICAgIGNvbnN0IHdlYnhyU3lzdGVtID0gZW5naW5lLl93ZWJYUlN5c3RlbUlmRW5hYmxlZDtcbiAgICAgIGlmICh3ZWJ4clN5c3RlbT8uaXNXZWJYUk1vZGUpIHtcbiAgICAgICAgY2FtZXJhQ29tcG9uZW50ID0gd2VieHJTeXN0ZW0uX2dldENhbWVyYUNvbXBvbmVudEF0KDApIGFzIENhbWVyYUNvbXBvbmVudDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBGcnVzdHVtQ3VsbGluZyAod3JpdGVzIGludG8gdGhlIHJldXNhYmxlIHBlci1yZW5kZXItcGFzcyBzY3JhdGNoIGFycmF5KVxuICAgIGNvbnN0IHByaW1pdGl2ZXMgPSBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19jdWxsaW5nV2l0aFZpZXdGcnVzdHVtKFxuICAgICAgY2FtZXJhQ29tcG9uZW50LFxuICAgICAgcmVuZGVyUGFzcy5fb3B0aW1pemVkTWVzaENvbXBvbmVudHMsXG4gICAgICBzY3JhdGNoLnByaW1pdGl2ZXMsXG4gICAgICBzY3JhdGNoLFxuICAgICAgaXNHcHVDdWxsaW5nQWN0aXZlXG4gICAgKTtcblxuICAgIC8vIEFmdGVyIEZydXN0dW0gQ3VsbGluZywgcmVtb3ZlIGR1cGxpY2F0ZWQgUHJpbWl0aXZlc1xuICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX3JlbW92ZUR1cGxpY2F0ZWRQcmltaXRpdmVzKHByaW1pdGl2ZXMsIHNjcmF0Y2gpO1xuXG4gICAgLy8gU29ydCBieSBzb3J0a2V5XG4gICAgaWYgKHByaW1pdGl2ZXMubGVuZ3RoID4gMSkge1xuICAgICAgcHJpbWl0aXZlcy5zb3J0KE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2NvbXBhcmVQcmltaXRpdmVzKTtcbiAgICB9XG5cbiAgICBsZXQgX2xhc3RPcGFxdWVJbmRleCA9IHByaW1pdGl2ZXMubGVuZ3RoIC0gMTtcbiAgICBsZXQgX2xhc3RUcmFuc2x1Y2VudEluZGV4ID0gcHJpbWl0aXZlcy5sZW5ndGggLSAxO1xuICAgIGxldCBfbGFzdEJsZW5kV2l0aFpXcml0ZUluZGV4ID0gcHJpbWl0aXZlcy5sZW5ndGggLSAxO1xuICAgIGxldCBfbGFzdEJsZW5kV2l0aG91dFpXcml0ZUluZGV4ID0gcHJpbWl0aXZlcy5sZW5ndGggLSAxO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmltaXRpdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBwcmltaXRpdmUgPSBwcmltaXRpdmVzW2ldO1xuICAgICAgY29uc3QgdHJhbnNsdWNlbmN5ID0gaXNUcmFuc2x1Y2VudChwcmltaXRpdmUpO1xuICAgICAgaWYgKHRyYW5zbHVjZW5jeSkge1xuICAgICAgICBfbGFzdE9wYXF1ZUluZGV4ID0gaSAtIDE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY29uc3QgYmxlbmRXaXRoWldyaXRlID0gaXNCbGVuZFdpdGhaV3JpdGUocHJpbWl0aXZlKTtcbiAgICAgIGlmIChibGVuZFdpdGhaV3JpdGUpIHtcbiAgICAgICAgX2xhc3RPcGFxdWVJbmRleCA9IGkgLSAxO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNvbnN0IGJsZW5kV2l0aG91dFpXcml0ZSA9IGlzQmxlbmRXaXRob3V0WldyaXRlKHByaW1pdGl2ZSk7XG4gICAgICBpZiAoYmxlbmRXaXRob3V0WldyaXRlKSB7XG4gICAgICAgIF9sYXN0T3BhcXVlSW5kZXggPSBpIC0gMTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IF9sYXN0T3BhcXVlSW5kZXggKyAxOyBpIDwgcHJpbWl0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJpbWl0aXZlID0gcHJpbWl0aXZlc1tpXTtcbiAgICAgIGNvbnN0IGJsZW5kV2l0aFpXcml0ZSA9IGlzQmxlbmRXaXRoWldyaXRlKHByaW1pdGl2ZSk7XG4gICAgICBpZiAoYmxlbmRXaXRoWldyaXRlKSB7XG4gICAgICAgIF9sYXN0VHJhbnNsdWNlbnRJbmRleCA9IGkgLSAxO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNvbnN0IGJsZW5kV2l0aG91dFpXcml0ZSA9IGlzQmxlbmRXaXRob3V0WldyaXRlKHByaW1pdGl2ZSk7XG4gICAgICBpZiAoYmxlbmRXaXRob3V0WldyaXRlKSB7XG4gICAgICAgIF9sYXN0VHJhbnNsdWNlbnRJbmRleCA9IGkgLSAxO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gX2xhc3RUcmFuc2x1Y2VudEluZGV4ICsgMTsgaSA8IHByaW1pdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHByaW1pdGl2ZSA9IHByaW1pdGl2ZXNbaV07XG4gICAgICBjb25zdCBibGVuZFdpdGhvdXRaV3JpdGUgPSBpc0JsZW5kV2l0aG91dFpXcml0ZShwcmltaXRpdmUpO1xuICAgICAgaWYgKGJsZW5kV2l0aG91dFpXcml0ZSkge1xuICAgICAgICBfbGFzdEJsZW5kV2l0aFpXcml0ZUluZGV4ID0gaSAtIDE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlb3JkZXIgdGhlIG9wYXF1ZSByYW5nZSBieSBlZmZlY3RpdmUgbWF0ZXJpYWwgKGFuZCBtdWx0aS1kcmF3IGdyb3VwKSBzbyB0aGF0XG4gICAgLy8gY29uc2VjdXRpdmUgZHJhd3Mgc2hhcmUgdGhlaXIgR1BVIHN0YXRlIGFuZCBjYW4gYmUgbWVyZ2VkIGJ5IFdFQkdMX211bHRpX2RyYXcuXG4gICAgLy8gT3BhcXVlIGRyYXdzIGFyZSBkZXB0aCB0ZXN0ZWQsIHNvIHRoaXMgcmVvcmRlciBpcyBzYWZlLiBUcmFuc2x1Y2VudC9ibGVuZCBidWNrZXRzXG4gICAgLy8ga2VlcCB0aGVpciBkaXN0YW5jZSBvcmRlci5cbiAgICBpZiAoXG4gICAgICBfbGFzdE9wYXF1ZUluZGV4ID4gMCAmJlxuICAgICAgZW5naW5lLmNvbmZpZy5pc011bHRpRHJhd0VuYWJsZWQgJiZcbiAgICAgIFByb2Nlc3NBcHByb2FjaC5pc1dlYkdMMkFwcHJvYWNoKGVuZ2luZS5lbmdpbmVTdGF0ZS5jdXJyZW50UHJvY2Vzc0FwcHJvYWNoKVxuICAgICkge1xuICAgICAgY29uc3Qgb3BhcXVlQ291bnQgPSBfbGFzdE9wYXF1ZUluZGV4ICsgMTtcbiAgICAgIGNvbnN0IGtleWVkID0gc2NyYXRjaC5rZXllZFByaW1pdGl2ZXM7XG4gICAgICBpZiAoa2V5ZWQubGVuZ3RoIDwgb3BhcXVlQ291bnQpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IGtleWVkLmxlbmd0aDsgaSA8IG9wYXF1ZUNvdW50OyBpKyspIHtcbiAgICAgICAgICBrZXllZC5wdXNoKHsgcHJpbWl0aXZlOiBudWxsLCBrZXlJZDogMCwgaW5kZXg6IDAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGtleWVkLmxlbmd0aCA9IG9wYXF1ZUNvdW50O1xuICAgICAgfVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcGFxdWVDb3VudDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHByaW1pdGl2ZSA9IHByaW1pdGl2ZXNbaV07XG4gICAgICAgIGNvbnN0IG1hdGVyaWFsID0gcmVuZGVyUGFzcy5nZXRBcHByb3ByaWF0ZU1hdGVyaWFsKHByaW1pdGl2ZSk7XG4gICAgICAgIGNvbnN0IGVudHJ5ID0ga2V5ZWRbaV07XG4gICAgICAgIGVudHJ5LnByaW1pdGl2ZSA9IHByaW1pdGl2ZTtcbiAgICAgICAgZW50cnkuaW5kZXggPSBpO1xuICAgICAgICBlbnRyeS5rZXlJZCA9XG4gICAgICAgICAgZ2V0TXVsdGlEcmF3U3RhdGVLZXlJZChwcmltaXRpdmUsIG1hdGVyaWFsLCBnZXRQcmltaXRpdmVNZXNoUmVuZGVyZXJGaW5nZXJQcmludElkKHByaW1pdGl2ZSkpID8/XG4gICAgICAgICAgLShtYXRlcmlhbC5tYXRlcmlhbFVJRCArIDEpO1xuICAgICAgfVxuICAgICAga2V5ZWQuc29ydCgoYSwgYikgPT4gYS5rZXlJZCAtIGIua2V5SWQgfHwgYS5pbmRleCAtIGIuaW5kZXgpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcGFxdWVDb3VudDsgaSsrKSB7XG4gICAgICAgIHByaW1pdGl2ZXNbaV0gPSBrZXllZFtpXS5wcmltaXRpdmUhO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHByaW1pdGl2ZVVpZHMgPSBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19jcmVhdGVQcmltaXRpdmVVaWRzKHByaW1pdGl2ZXMpO1xuXG4gICAgbGV0IHJlc3VsdENoYW5nZWQgPSBmYWxzZTtcbiAgICBpZiAoX2xhc3RPcGFxdWVJbmRleCAhPT0gcmVuZGVyUGFzcy5fbGFzdE9wYXF1ZUluZGV4KSB7XG4gICAgICByZW5kZXJQYXNzLl9sYXN0T3BhcXVlSW5kZXggPSBfbGFzdE9wYXF1ZUluZGV4O1xuICAgICAgcmVzdWx0Q2hhbmdlZCB8fD0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKF9sYXN0VHJhbnNsdWNlbnRJbmRleCAhPT0gcmVuZGVyUGFzcy5fbGFzdFRyYW5zbHVjZW50SW5kZXgpIHtcbiAgICAgIHJlbmRlclBhc3MuX2xhc3RUcmFuc2x1Y2VudEluZGV4ID0gX2xhc3RUcmFuc2x1Y2VudEluZGV4O1xuICAgICAgcmVzdWx0Q2hhbmdlZCB8fD0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKF9sYXN0QmxlbmRXaXRoWldyaXRlSW5kZXggIT09IHJlbmRlclBhc3MuX2xhc3RCbGVuZFdpdGhaV3JpdGVJbmRleCkge1xuICAgICAgcmVuZGVyUGFzcy5fbGFzdEJsZW5kV2l0aFpXcml0ZUluZGV4ID0gX2xhc3RCbGVuZFdpdGhaV3JpdGVJbmRleDtcbiAgICAgIHJlc3VsdENoYW5nZWQgfHw9IHRydWU7XG4gICAgfVxuICAgIGlmIChfbGFzdEJsZW5kV2l0aG91dFpXcml0ZUluZGV4ICE9PSByZW5kZXJQYXNzLl9sYXN0QmxlbmRXaXRob3V0WldyaXRlSW5kZXgpIHtcbiAgICAgIHJlbmRlclBhc3MuX2xhc3RCbGVuZFdpdGhvdXRaV3JpdGVJbmRleCA9IF9sYXN0QmxlbmRXaXRob3V0WldyaXRlSW5kZXg7XG4gICAgICByZXN1bHRDaGFuZ2VkIHx8PSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChwcmltaXRpdmVVaWRzLmxlbmd0aCAhPT0gcmVuZGVyUGFzcy5fbGFzdFByaW1pdGl2ZVVpZHMubGVuZ3RoKSB7XG4gICAgICByZXN1bHRDaGFuZ2VkIHx8PSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBDaGVjayBpZiBhIHByaW1pdGl2ZSBvciB0aGUgb3JkZXIgb2YgdGhlIHByaW1pdGl2ZXMgaGFzIGNoYW5nZWQuIEFsbCB0aGUgcmFuZ2VzIGFyZSBjb21wYXJlZDogdGhlIGN1bGxpbmdcbiAgICAgIC8vIGNhbiByZXBsYWNlIGFuIG9wYXF1ZSBwcmltaXRpdmUgd2l0aCBhbm90aGVyIG9uZSB3aGlsZSB0aGUgY291bnRzIHN0YXkgdGhlIHNhbWUsIGFuZCB0aGUgV2ViR1BVIHJlbmRlclxuICAgICAgLy8gYnVuZGxlcyBtdXN0IHRoZW4gYmUgcmUtcmVjb3JkZWQuXG4gICAgICBjb25zdCBsYXN0UHJpbWl0aXZlVWlkcyA9IHJlbmRlclBhc3MuX2xhc3RQcmltaXRpdmVVaWRzO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmltaXRpdmVVaWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChwcmltaXRpdmVVaWRzW2ldICE9PSBsYXN0UHJpbWl0aXZlVWlkc1tpXSkge1xuICAgICAgICAgIHJlc3VsdENoYW5nZWQgfHw9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmVuZGVyUGFzcy5faXNDaGFuZ2VkU29ydFJlbmRlclJlc3VsdCA9IHJlc3VsdENoYW5nZWQ7XG5cbiAgICByZW5kZXJQYXNzLl9sYXN0UHJpbWl0aXZlVWlkcyA9IHByaW1pdGl2ZVVpZHM7XG4gICAgLy8gVGhlIHNjcmF0Y2ggYXJyYXkgaXMgb25seSByZWZpbGxlZCBieSB0aGUgbmV4dCBzb3J0LCB3aGljaCBhbHNvIHJlcGxhY2VzXG4gICAgLy8gYF9sYXN0UHJpbWl0aXZlVWlkc2AsIHNvIHRoZSBwYWlyIHN0YXlzIGNvbnNpc3RlbnQgZm9yIHRoZSByZW5kZXIgc3RyYXRlZ2llcy5cbiAgICByZW5kZXJQYXNzLl9sYXN0UHJpbWl0aXZlcyA9IHByaW1pdGl2ZXM7XG5cbiAgICByZW5kZXJQYXNzLl9sYXN0VHJhbnNmb3JtQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gVHJhbnNmb3JtQ29tcG9uZW50LmdldFVwZGF0ZUNvdW50KGVuZ2luZSk7XG4gICAgcmVuZGVyUGFzcy5fbGFzdENhbWVyYUNvbnRyb2xsZXJDb21wb25lbnRzVXBkYXRlQ291bnQgPSBDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50LmdldFVwZGF0ZUNvdW50KGVuZ2luZSk7XG4gICAgcmVuZGVyUGFzcy5fbGFzdFNjZW5lR3JhcGhDb21wb25lbnRzVXBkYXRlQ291bnQgPSBTY2VuZUdyYXBoQ29tcG9uZW50LmdldFVwZGF0ZUNvdW50KGVuZ2luZSk7XG4gICAgcmVuZGVyUGFzcy5fbGFzdE11bHRpRHJhd0dyb3VwVmVyc2lvbiA9IG11bHRpRHJhd0dyb3VwVmVyc2lvbjtcbiAgICBpZiAocmVzdWx0Q2hhbmdlZCkge1xuICAgICAgcmVuZGVyUGFzcy5fcmVuZGVyZWRTb21ldGhpbmdCZWZvcmUgPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBwcmltaXRpdmVVaWRzO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIGZydXN0dW0gY3VsbGluZyBvbiBtZXNoIGNvbXBvbmVudHMgdXNpbmcgdGhlIGNhbWVyYSdzIHZpZXcgZnJ1c3R1bS5cbiAgICogRmlsdGVycyBvdXQgbWVzaCBjb21wb25lbnRzIHRoYXQgYXJlIG5vdCB2aXNpYmxlIGZyb20gdGhlIGNhbWVyYSdzIHBlcnNwZWN0aXZlLlxuICAgKiBAcGFyYW0gY2FtZXJhQ29tcG9uZW50IC0gVGhlIGNhbWVyYSBjb21wb25lbnQgdXNlZCBmb3IgZnJ1c3R1bSBjdWxsaW5nXG4gICAqIEBwYXJhbSBtZXNoQ29tcG9uZW50cyAtIEFycmF5IG9mIG1lc2ggY29tcG9uZW50cyB0byBiZSBjdWxsZWRcbiAgICogQHBhcmFtIG91dFByaW1pdGl2ZXMgLSBSZXVzYWJsZSBvdXRwdXQgYXJyYXkuIEl0IGlzIGNsZWFyZWQgYW5kIGZpbGxlZCB3aXRoIHRoZSBwcmltaXRpdmVzIHRoYXQgcGFzc2VkIGN1bGxpbmdcbiAgICogQHBhcmFtIHNjcmF0Y2ggLSBUaGUgc2NyYXRjaCBvZiB0aGUgcmVuZGVyIHBhc3MuIFRoZSBlbnRpdGllcyBjdWxsZWQgaW4gdGhpcyBwYXNzIGFyZSBzdGFtcGVkIGludG8gaXRcbiAgICogICAgICAgICAgICAgICAgICBzbyB0aGF0IGluc3RhbmNlZCBkcmF3IGNhbGxzIGNhbiBza2lwIHRoZWlyIGluc3RhbmNlc1xuICAgKiBAcGFyYW0gaXNHcHVDdWxsaW5nQWN0aXZlIC0gV2hldGhlciB0aGUgcmVuZGVyIHBhc3MgY3VsbHMgb24gdGhlIEdQVSAoc2VlIGBfaXNHcHVDdWxsaW5nQWN0aXZlYCkuIFRoZSBwcmltaXRpdmVzXG4gICAqICAgICAgICAgICAgICAgICAgb2YgdGhlIG1lc2hlcyBjdWxsZWQgb24gdGhlIEdQVSBhcmUga2VwdCByZWdhcmRsZXNzIG9mIHRoZWlyIHZpc2liaWxpdHksIHNvIHRoYXQgdGhlIHJlbmRlclxuICAgKiAgICAgICAgICAgICAgICAgIGxpc3QgKGFuZCB0aGUgV2ViR1BVIHJlbmRlciBidW5kbGVzKSBkb2VzIG5vdCBjaGFuZ2Ugd2hlbiB0aGUgY2FtZXJhIG1vdmVzXG4gICAqIEByZXR1cm5zIFRoZSBgb3V0UHJpbWl0aXZlc2AgYXJyYXkgKHNhbWUgcmVmZXJlbmNlKSBmb3IgY29udmVuaWVuY2VcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fY3VsbGluZ1dpdGhWaWV3RnJ1c3R1bShcbiAgICBjYW1lcmFDb21wb25lbnQ6IENhbWVyYUNvbXBvbmVudCxcbiAgICBtZXNoQ29tcG9uZW50czogTWVzaENvbXBvbmVudFtdLFxuICAgIG91dFByaW1pdGl2ZXM6IFByaW1pdGl2ZVtdLFxuICAgIHNjcmF0Y2g6IE1lc2hSZW5kZXJlclNvcnRTY3JhdGNoLFxuICAgIGlzR3B1Q3VsbGluZ0FjdGl2ZTogYm9vbGVhblxuICApOiBQcmltaXRpdmVbXSB7XG4gICAgb3V0UHJpbWl0aXZlcy5sZW5ndGggPSAwO1xuXG4gICAgbGV0IGN1bGxUaWNrID0gc2NyYXRjaC5jdWxsVGljayArIDE7XG4gICAgaWYgKGN1bGxUaWNrID09PSAweGZmZmZmZmZmKSB7XG4gICAgICAvLyBXcmFwIGFyb3VuZDogY2xlYXIgdGhlIHN0YW1wcyBzbyB0aGF0IG9sZCB2YWx1ZXMgY2Fubm90IGJlIG1pc3Rha2VuIGZvciB0aGUgY3VycmVudCB0aWNrLlxuICAgICAgc2NyYXRjaC5jdWxsZWRFbnRpdHlTdGFtcC5maWxsKDApO1xuICAgICAgc2NyYXRjaC5oYW5kbGVkRW50aXR5U3RhbXAuZmlsbCgwKTtcbiAgICAgIHNjcmF0Y2gubWVzaEN1bGxUaWNrID0gbmV3IFdlYWtNYXAoKTtcbiAgICAgIHNjcmF0Y2gubWVzaEFwcGVuZFRpY2sgPSBuZXcgV2Vha01hcCgpO1xuICAgICAgY3VsbFRpY2sgPSAxO1xuICAgIH1cbiAgICBzY3JhdGNoLmN1bGxUaWNrID0gY3VsbFRpY2s7XG4gICAgc2NyYXRjaC5jdWxsZWRFbnRpdHlDb3VudCA9IDA7XG4gICAgY29uc3QgY3VsbGVkSW5zdGFuY2VkTWVzaENvbXBvbmVudHMgPSBzY3JhdGNoLmN1bGxlZEluc3RhbmNlZE1lc2hDb21wb25lbnRzO1xuICAgIGN1bGxlZEluc3RhbmNlZE1lc2hDb21wb25lbnRzLmxlbmd0aCA9IDA7XG4gICAgc2NyYXRjaC5jdWxsaW5nSWQgPSArK01lc2hSZW5kZXJlckNvbXBvbmVudC5fX2N1bGxpbmdJZENvdW50ZXI7XG5cbiAgICAvLyBBIHNpbmdsZSBwYXNzIG92ZXIgdGhlIG1lc2ggY29tcG9uZW50czogY3VsbCwgdXBkYXRlIHZpc2liaWxpdHkgZmxhZ3MgYW5kXG4gICAgLy8gY29sbGVjdCBwcmltaXRpdmVzLiBUaGUgcHJldmlvdXMgaW1wbGVtZW50YXRpb24gYWxsb2NhdGVkIGEgZmlsdGVyZWQgYXJyYXlcbiAgICAvLyBhbmQgYW4gaW5uZXIgY2xvc3VyZSBwZXIgY2FsbC5cbiAgICBjb25zdCBpc0ZydXN0dW1DdWxsaW5nRW5hYmxlZCA9IGNhbWVyYUNvbXBvbmVudCAhPSBudWxsICYmIE1lc2hSZW5kZXJlckNvbXBvbmVudC5faXNGcnVzdHVtQ3VsbGluZ0VuYWJsZWQ7XG4gICAgbGV0IGZydXN0dW06IENhbWVyYUNvbXBvbmVudFsnZnJ1c3R1bSddIHwgdW5kZWZpbmVkO1xuICAgIGlmIChpc0ZydXN0dW1DdWxsaW5nRW5hYmxlZCkge1xuICAgICAgY2FtZXJhQ29tcG9uZW50LnVwZGF0ZUZydXN0dW0oKTtcbiAgICAgIGZydXN0dW0gPSBjYW1lcmFDb21wb25lbnQuZnJ1c3R1bTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1lc2hDb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBtZXNoQ29tcG9uZW50ID0gbWVzaENvbXBvbmVudHNbaV07XG4gICAgICBjb25zdCBzY2VuZUdyYXBoID0gbWVzaENvbXBvbmVudC5lbnRpdHkuZ2V0U2NlbmVHcmFwaCgpO1xuICAgICAgaWYgKCFtZXNoQ29tcG9uZW50Ll9pc0FsaXZlKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgc2NyYXRjaC5oYW5kbGVkRW50aXR5U3RhbXAgPSBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19zdGFtcEVudGl0eShcbiAgICAgICAgc2NyYXRjaC5oYW5kbGVkRW50aXR5U3RhbXAsXG4gICAgICAgIG1lc2hDb21wb25lbnQuZW50aXR5VUlELFxuICAgICAgICBjdWxsVGlja1xuICAgICAgKTtcbiAgICAgIGlmIChpc0dwdUN1bGxpbmdBY3RpdmUgJiYgbWVzaENvbXBvbmVudC5tZXNoPy5faXNHcHVDdWxsYWJsZSA9PT0gdHJ1ZSkge1xuICAgICAgICAvLyBDdWxsZWQgcGVyIGluc3RhbmNlIG9uIHRoZSBHUFUsIGluY2x1ZGluZyB0aGUgdmlzaWJpbGl0eSBmbGFnIChXZWJHcHVHcHVDdWxsaW5nKS5cbiAgICAgICAgc2NlbmVHcmFwaC5faXNDdWxsZWQgPSBmYWxzZTtcbiAgICAgICAgY29uc3Qgc2tlbGV0YWwgPSBtZXNoQ29tcG9uZW50LmVudGl0eS50cnlUb0dldFNrZWxldGFsKCk7XG4gICAgICAgIGlmIChza2VsZXRhbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgLy8gVGhlIGpvaW50cyBvZiBhIHNrZWxldG9uIG91dHNpZGUgb2YgdGhlIHZpZXcgYXJlIG5vdCB1cGRhdGVkIChTa2VsZXRhbENvbXBvbmVudC4kbG9naWMpLiBUaGlzIGtlZXBzIHRoZVxuICAgICAgICAgIC8vIGFwcHJveGltYXRlIHRlc3Qgb2YgdGhlIENQVSBjdWxsaW5nIGZvciBpdDsgdGhlIEdQVSBjdWxsaW5nIGRlY2lkZXMgZnJvbSB0aGUgZGVmb3JtZWQgYm91bmRpbmcgYm94IHdoZXRoZXJcbiAgICAgICAgICAvLyB0aGUgbWVzaCBpcyBkcmF3bi5cbiAgICAgICAgICBsZXQgdmlzaWJsZSA9IHNjZW5lR3JhcGguaXNWaXNpYmxlO1xuICAgICAgICAgIGlmICh2aXNpYmxlICYmIGZydXN0dW0gIT0gbnVsbCAmJiBtZXNoQ29tcG9uZW50LmVudGl0eS5nZXRUYWdWYWx1ZSgndHlwZScpICE9PSAnYmFja2dyb3VuZC1hc3NldHMnKSB7XG4gICAgICAgICAgICB2aXNpYmxlID0gZnJ1c3R1bS5jdWxsaW5nKG1lc2hDb21wb25lbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBza2VsZXRhbC5faXNDdWxsZWQgPSAhdmlzaWJsZTtcbiAgICAgICAgfVxuICAgICAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19hcHBlbmRQcmltaXRpdmVzT2ZNZXNoQ29tcG9uZW50KG1lc2hDb21wb25lbnQsIGNhbWVyYUNvbXBvbmVudCwgb3V0UHJpbWl0aXZlcyk7XG4gICAgICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX21hcmtNZXNoQXBwZW5kZWQobWVzaENvbXBvbmVudCwgc2NyYXRjaCwgY3VsbFRpY2spO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmICghc2NlbmVHcmFwaC5pc1Zpc2libGUpIHtcbiAgICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fc3RhbXBDdWxsZWRFbnRpdHkoc2NyYXRjaCwgbWVzaENvbXBvbmVudC5lbnRpdHlVSUQsIGN1bGxUaWNrKTtcbiAgICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fZGVmZXJDdWxsZWRJbnN0YW5jZWRNZXNoKG1lc2hDb21wb25lbnQsIHNjcmF0Y2gpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGZydXN0dW0gIT0gbnVsbCkge1xuICAgICAgICBjb25zdCBpc0JhY2tncm91bmRBc3NldCA9IG1lc2hDb21wb25lbnQuZW50aXR5LmdldFRhZ1ZhbHVlKCd0eXBlJykgPT09ICdiYWNrZ3JvdW5kLWFzc2V0cyc7XG4gICAgICAgIGNvbnN0IHZpc2libGUgPSBpc0JhY2tncm91bmRBc3NldCA/IHRydWUgOiBmcnVzdHVtLmN1bGxpbmcobWVzaENvbXBvbmVudCk7XG4gICAgICAgIHNjZW5lR3JhcGguX2lzQ3VsbGVkID0gIXZpc2libGU7XG4gICAgICAgIGNvbnN0IHNrZWxldGFsID0gbWVzaENvbXBvbmVudC5lbnRpdHkudHJ5VG9HZXRTa2VsZXRhbCgpO1xuICAgICAgICBpZiAoc2tlbGV0YWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHNrZWxldGFsLl9pc0N1bGxlZCA9ICF2aXNpYmxlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdmlzaWJsZSkge1xuICAgICAgICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX3N0YW1wQ3VsbGVkRW50aXR5KHNjcmF0Y2gsIG1lc2hDb21wb25lbnQuZW50aXR5VUlELCBjdWxsVGljayk7XG4gICAgICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fZGVmZXJDdWxsZWRJbnN0YW5jZWRNZXNoKG1lc2hDb21wb25lbnQsIHNjcmF0Y2gpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2FwcGVuZFByaW1pdGl2ZXNPZk1lc2hDb21wb25lbnQobWVzaENvbXBvbmVudCwgY2FtZXJhQ29tcG9uZW50LCBvdXRQcmltaXRpdmVzKTtcbiAgICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX21hcmtNZXNoQXBwZW5kZWQobWVzaENvbXBvbmVudCwgc2NyYXRjaCwgY3VsbFRpY2spO1xuICAgIH1cblxuICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2N1bGxTaWJsaW5nSW5zdGFuY2VzKG1lc2hDb21wb25lbnRzLCBmcnVzdHVtLCBzY3JhdGNoLCBjdWxsVGljaywgaXNHcHVDdWxsaW5nQWN0aXZlKTtcbiAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19hcHBlbmRQcmltaXRpdmVzT2ZDdWxsZWRJbnN0YW5jZWRNZXNoZXMoY2FtZXJhQ29tcG9uZW50LCBvdXRQcmltaXRpdmVzLCBzY3JhdGNoLCBjdWxsVGljayk7XG5cbiAgICByZXR1cm4gb3V0UHJpbWl0aXZlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDdWxscyB0aGUgaW5zdGFuY2VzIHRoYXQgc2hhcmUgYSBtZXNoIHdpdGggdGhlIG1lc2ggY29tcG9uZW50cyBvZiB0aGUgcmVuZGVyIHBhc3MgYnV0IGFyZSBub3RcbiAgICogcmVnaXN0ZXJlZCBpbiB0aGUgcmVuZGVyIHBhc3MgdGhlbXNlbHZlcy5cbiAgICpcbiAgICogSW5zdGFuY2VkIGRyYXcgY2FsbHMgcmVuZGVyIGV2ZXJ5IGVudGl0eSBzaGFyaW5nIGEgbWVzaC4gRm9yIGV4YW1wbGUsIHRoZSBWUk0gb3V0bGluZSBwYXNzIG9ubHkgaG9sZHNcbiAgICogdGhlIG9yaWdpbmFsIG1vZGVsLCB3aGlsZSBpdHMgc2hhbGxvdyBjb3BpZXMgYXJlIGRyYXduIHRocm91Z2ggaW5zdGFuY2luZy4gU3VjaCBzaWJsaW5nIGluc3RhbmNlcyBhcmVcbiAgICogY3VsbGVkIHdpdGggdGhlIGNhbWVyYSBvZiB0aGlzIHJlbmRlciBwYXNzIGFzIHdlbGwsIG9uY2UgcGVyIG1lc2guIFRoZWlyIHZpc2liaWxpdHkgZmxhZ3MgYXJlIGxlZnRcbiAgICogdW50b3VjaGVkIGJlY2F1c2UgdGhleSBiZWxvbmcgdG8gdGhlIHJlbmRlciBwYXNzZXMgdGhlIGVudGl0aWVzIGFyZSByZWdpc3RlcmVkIGluLlxuICAgKlxuICAgKiBUaGUgbWVzaGVzIGN1bGxlZCBvbiB0aGUgR1BVIChgaXNHcHVDdWxsaW5nQWN0aXZlYCBhbmQgYE1lc2guX2lzR3B1Q3VsbGFibGVgKSBhcmUgc2tpcHBlZDogdGhlaXIgaW5zdGFuY2VzLFxuICAgKiBzaWJsaW5ncyBpbmNsdWRlZCwgYXJlIGN1bGxlZCBwZXIgaW5zdGFuY2UgYnkgdGhlIGN1bGxpbmcgY29tcHV0ZSBwYXNzLCBzbyB0ZXN0aW5nIHRoZW0gaGVyZSB3b3VsZCBvbmx5IGNvc3RcbiAgICogQ1BVIHRpbWUuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2N1bGxTaWJsaW5nSW5zdGFuY2VzKFxuICAgIG1lc2hDb21wb25lbnRzOiBNZXNoQ29tcG9uZW50W10sXG4gICAgZnJ1c3R1bTogQ2FtZXJhQ29tcG9uZW50WydmcnVzdHVtJ10gfCB1bmRlZmluZWQsXG4gICAgc2NyYXRjaDogTWVzaFJlbmRlcmVyU29ydFNjcmF0Y2gsXG4gICAgY3VsbFRpY2s6IG51bWJlcixcbiAgICBpc0dwdUN1bGxpbmdBY3RpdmU6IGJvb2xlYW5cbiAgKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtZXNoQ29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbWVzaENvbXBvbmVudCA9IG1lc2hDb21wb25lbnRzW2ldO1xuICAgICAgaWYgKCFtZXNoQ29tcG9uZW50Ll9pc0FsaXZlKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgbWVzaCA9IG1lc2hDb21wb25lbnQubWVzaDtcbiAgICAgIGlmIChtZXNoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoaXNHcHVDdWxsaW5nQWN0aXZlICYmIG1lc2guX2lzR3B1Q3VsbGFibGUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBzaWJsaW5ncyA9IG1lc2gubWVzaEVudGl0aWVzSW5uZXI7XG4gICAgICBpZiAoc2libGluZ3MubGVuZ3RoIDw9IDEgfHwgc2NyYXRjaC5tZXNoQ3VsbFRpY2suZ2V0KG1lc2gpID09PSBjdWxsVGljaykge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHNjcmF0Y2gubWVzaEN1bGxUaWNrLnNldChtZXNoLCBjdWxsVGljayk7XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgc2libGluZ3MubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgY29uc3Qgc2libGluZyA9IHNpYmxpbmdzW2pdO1xuICAgICAgICBjb25zdCBlbnRpdHlVSUQgPSBzaWJsaW5nLmVudGl0eVVJRDtcbiAgICAgICAgaWYgKGVudGl0eVVJRCA8IHNjcmF0Y2guaGFuZGxlZEVudGl0eVN0YW1wLmxlbmd0aCAmJiBzY3JhdGNoLmhhbmRsZWRFbnRpdHlTdGFtcFtlbnRpdHlVSURdID09PSBjdWxsVGljaykge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGxldCB2aXNpYmxlID0gc2libGluZy5nZXRTY2VuZUdyYXBoKCkuaXNWaXNpYmxlO1xuICAgICAgICBpZiAodmlzaWJsZSAmJiBmcnVzdHVtICE9IG51bGwgJiYgc2libGluZy5nZXRUYWdWYWx1ZSgndHlwZScpICE9PSAnYmFja2dyb3VuZC1hc3NldHMnKSB7XG4gICAgICAgICAgdmlzaWJsZSA9IGZydXN0dW0uY3VsbGluZyhzaWJsaW5nLmdldE1lc2goKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF2aXNpYmxlKSB7XG4gICAgICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fc3RhbXBDdWxsZWRFbnRpdHkoc2NyYXRjaCwgZW50aXR5VUlELCBjdWxsVGljayk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVtZW1iZXJzIGEgY3VsbGVkIG1lc2ggY29tcG9uZW50IHdob3NlIG1lc2ggaXMgc2hhcmVkIGJ5IG90aGVyIGluc3RhbmNlczogYW4gaW5zdGFuY2VkIGRyYXcgY2FsbCByZW5kZXJzXG4gICAqIGV2ZXJ5IGluc3RhbmNlIG9mIHRoZSBtZXNoLCBzbyB0aGUgbWVzaCBtdXN0IHN0aWxsIGJlIGRyYXduIHdoZW4gYW5vdGhlciBpbnN0YW5jZSBpcyB2aXNpYmxlLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19kZWZlckN1bGxlZEluc3RhbmNlZE1lc2gobWVzaENvbXBvbmVudDogTWVzaENvbXBvbmVudCwgc2NyYXRjaDogTWVzaFJlbmRlcmVyU29ydFNjcmF0Y2gpIHtcbiAgICBjb25zdCBtZXNoID0gbWVzaENvbXBvbmVudC5tZXNoO1xuICAgIGlmIChtZXNoICE9PSB1bmRlZmluZWQgJiYgbWVzaC5tZXNoRW50aXRpZXNJbm5lci5sZW5ndGggPiAxKSB7XG4gICAgICBzY3JhdGNoLmN1bGxlZEluc3RhbmNlZE1lc2hDb21wb25lbnRzLnB1c2gobWVzaENvbXBvbmVudCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19tYXJrTWVzaEFwcGVuZGVkKG1lc2hDb21wb25lbnQ6IE1lc2hDb21wb25lbnQsIHNjcmF0Y2g6IE1lc2hSZW5kZXJlclNvcnRTY3JhdGNoLCBjdWxsVGljazogbnVtYmVyKSB7XG4gICAgY29uc3QgbWVzaCA9IG1lc2hDb21wb25lbnQubWVzaDtcbiAgICBpZiAobWVzaCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBzY3JhdGNoLm1lc2hBcHBlbmRUaWNrLnNldChtZXNoLCBjdWxsVGljayk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFwcGVuZHMgdGhlIHByaW1pdGl2ZXMgb2YgdGhlIGluc3RhbmNlZCBtZXNoZXMgd2hvc2UgcmVnaXN0ZXJlZCBpbnN0YW5jZXMgd2VyZSBhbGwgY3VsbGVkIGJ1dCB3aGljaCBoYXZlXG4gICAqIGFub3RoZXIgaW5zdGFuY2UgdGhhdCB3YXMgbm90IGN1bGxlZC5cbiAgICpcbiAgICogVGhlIGN1bGxpbmcgaXMgZGVjaWRlZCBwZXIgZW50aXR5IHJlZ2lzdGVyZWQgaW4gdGhlIHJlbmRlciBwYXNzLCB3aGlsZSBhbiBpbnN0YW5jZWQgZHJhdyBjYWxsIHJlbmRlcnMgZXZlcnlcbiAgICogZW50aXR5IHNoYXJpbmcgdGhlIG1lc2ggKGUuZy4gYSB0ZW1wbGF0ZSBlbnRpdHkgcmVnaXN0ZXJlZCBpbiB0aGUgcmVuZGVyIHBhc3MgYW5kIGl0cyBzaGFsbG93IGNvcGllcykuIERyb3BwaW5nXG4gICAqIHRoZSBtZXNoIGJlY2F1c2UgaXRzIHJlZ2lzdGVyZWQgZW50aXR5IGlzIG91dHNpZGUgb2YgdGhlIHZpZXcgd291bGQgYWxzbyBkcm9wIGl0cyB2aXNpYmxlIGNvcGllcy4gVGhlIGN1bGxlZFxuICAgKiBlbnRpdGllcyBzdGF5IHN0YW1wZWQgaW4gYGN1bGxlZEVudGl0eVN0YW1wYCwgc28gdGhlIHBlci1pbnN0YW5jZSBjdWxsaW5nIG9mIHRoZSBXZWJHTCBzdHJhdGVneSBkb2VzIG5vdCBkcmF3XG4gICAqIHRoZW07IHRoZSBXZWJHUFUgc3RyYXRlZ3kgd2l0aG91dCBHUFUgY3VsbGluZyBkcmF3cyBldmVyeSBpbnN0YW5jZSAodGhlIGhpZGRlbiBvbmVzIGFyZSBjb2xsYXBzZWQgYnkgdGhlIHZlcnRleFxuICAgKiBzaGFkZXIgYW5kIHRoZSBjdWxsZWQgb25lcyBhcmUgb3V0c2lkZSBvZiB0aGUgdmlldykuXG4gICAqXG4gICAqIE11c3QgcnVuIGFmdGVyIGBfX2N1bGxTaWJsaW5nSW5zdGFuY2VzYCwgd2hpY2ggc3RhbXBzIHRoZSBjdWxsZWQgaW5zdGFuY2VzIHRoYXQgYXJlIG5vdCByZWdpc3RlcmVkIGluIHRoZSBwYXNzLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19hcHBlbmRQcmltaXRpdmVzT2ZDdWxsZWRJbnN0YW5jZWRNZXNoZXMoXG4gICAgY2FtZXJhQ29tcG9uZW50OiBDYW1lcmFDb21wb25lbnQsXG4gICAgb3V0UHJpbWl0aXZlczogUHJpbWl0aXZlW10sXG4gICAgc2NyYXRjaDogTWVzaFJlbmRlcmVyU29ydFNjcmF0Y2gsXG4gICAgY3VsbFRpY2s6IG51bWJlclxuICApIHtcbiAgICBjb25zdCBtZXNoQ29tcG9uZW50cyA9IHNjcmF0Y2guY3VsbGVkSW5zdGFuY2VkTWVzaENvbXBvbmVudHM7XG4gICAgY29uc3QgY3VsbGVkRW50aXR5U3RhbXAgPSBzY3JhdGNoLmN1bGxlZEVudGl0eVN0YW1wO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWVzaENvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG1lc2hDb21wb25lbnQgPSBtZXNoQ29tcG9uZW50c1tpXTtcbiAgICAgIGNvbnN0IG1lc2ggPSBtZXNoQ29tcG9uZW50Lm1lc2g7XG4gICAgICBpZiAobWVzaCA9PT0gdW5kZWZpbmVkIHx8IHNjcmF0Y2gubWVzaEFwcGVuZFRpY2suZ2V0KG1lc2gpID09PSBjdWxsVGljaykge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8vIERlY2lkZWQgb25jZSBwZXIgbWVzaCwgd2hldGhlciBvciBub3QgaXQgaXMgZHJhd24uXG4gICAgICBzY3JhdGNoLm1lc2hBcHBlbmRUaWNrLnNldChtZXNoLCBjdWxsVGljayk7XG4gICAgICBjb25zdCBpbnN0YW5jZXMgPSBtZXNoLm1lc2hFbnRpdGllc0lubmVyO1xuICAgICAgbGV0IGhhc1Zpc2libGVJbnN0YW5jZSA9IGZhbHNlO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBpbnN0YW5jZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgY29uc3QgZW50aXR5VUlEID0gaW5zdGFuY2VzW2pdLmVudGl0eVVJRDtcbiAgICAgICAgaWYgKGVudGl0eVVJRCA+PSBjdWxsZWRFbnRpdHlTdGFtcC5sZW5ndGggfHwgY3VsbGVkRW50aXR5U3RhbXBbZW50aXR5VUlEXSAhPT0gY3VsbFRpY2spIHtcbiAgICAgICAgICBoYXNWaXNpYmxlSW5zdGFuY2UgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoaGFzVmlzaWJsZUluc3RhbmNlKSB7XG4gICAgICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2FwcGVuZFByaW1pdGl2ZXNPZk1lc2hDb21wb25lbnQobWVzaENvbXBvbmVudCwgY2FtZXJhQ29tcG9uZW50LCBvdXRQcmltaXRpdmVzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgbWVzaENvbXBvbmVudHMubGVuZ3RoID0gMDtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fc3RhbXBDdWxsZWRFbnRpdHkoc2NyYXRjaDogTWVzaFJlbmRlcmVyU29ydFNjcmF0Y2gsIGVudGl0eVVJRDogRW50aXR5VUlELCBjdWxsVGljazogbnVtYmVyKSB7XG4gICAgc2NyYXRjaC5jdWxsZWRFbnRpdHlTdGFtcCA9IE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX3N0YW1wRW50aXR5KHNjcmF0Y2guY3VsbGVkRW50aXR5U3RhbXAsIGVudGl0eVVJRCwgY3VsbFRpY2spO1xuICAgIHNjcmF0Y2guY3VsbGVkRW50aXR5Q291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBXcml0ZXMgYGN1bGxUaWNrYCBpbnRvIGBzdGFtcFtlbnRpdHlVSURdYCwgZ3Jvd2luZyB0aGUgYXJyYXkgdXAgdG8gdGhlIGxhcmdlc3QgRW50aXR5VUlEIHNlZW4gc28gZmFyLlxuICAgKiBAcmV0dXJucyBUaGUgc3RhbXAgYXJyYXksIHdoaWNoIGlzIGEgbmV3IGFycmF5IHdoZW4gaXQgaGFzIGdyb3duXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3N0YW1wRW50aXR5KHN0YW1wOiBVaW50MzJBcnJheSwgZW50aXR5VUlEOiBFbnRpdHlVSUQsIGN1bGxUaWNrOiBudW1iZXIpOiBVaW50MzJBcnJheSB7XG4gICAgbGV0IHJlc3VsdCA9IHN0YW1wO1xuICAgIGlmIChlbnRpdHlVSUQgPj0gc3RhbXAubGVuZ3RoKSB7XG4gICAgICByZXN1bHQgPSBuZXcgVWludDMyQXJyYXkoTWF0aC5tYXgoZW50aXR5VUlEICsgMSwgc3RhbXAubGVuZ3RoICogMiwgNjQpKTtcbiAgICAgIHJlc3VsdC5zZXQoc3RhbXApO1xuICAgIH1cbiAgICByZXN1bHRbZW50aXR5VUlEXSA9IGN1bGxUaWNrO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGUgbWVzaGVzIG9mIGEgcmVuZGVyIHBhc3MgYXJlIGZydXN0dW0gY3VsbGVkIG9uIHRoZSBHUFUgKFdlYkdQVSwgYENvbmZpZy5pc0dwdUN1bGxpbmdFbmFibGVkYCkuXG4gICAqIFRoZSBDUFUgY3VsbGluZyBhbmQgdGhlIFdlYkdQVSBkcmF3IHJlY29yZGluZyBib3RoIHVzZSB0aGlzLCBzbyB0aGF0IGEgbWVzaCB0aGUgQ1BVIGtlZXBzIGZvciB0aGUgR1BVIGlzXG4gICAqIHJlY29yZGVkIGFzIGEgY3VsbGVkIGluZGlyZWN0IGRyYXcuIE1lc2hlcyB3aG9zZSBgTWVzaC5faXNHcHVDdWxsYWJsZWAgaXMgZmFsc2Uga2VlcCB0aGUgQ1BVIGN1bGxpbmcuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIF9pc0dwdUN1bGxpbmdBY3RpdmUoZW5naW5lOiBFbmdpbmUsIHJlbmRlclBhc3M6IFJlbmRlclBhc3MpOiBib29sZWFuIHtcbiAgICBpZiAoXG4gICAgICAhZW5naW5lLmNvbmZpZy5pc0dwdUN1bGxpbmdFbmFibGVkIHx8XG4gICAgICAhTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9pc0ZydXN0dW1DdWxsaW5nRW5hYmxlZCB8fFxuICAgICAgIVByb2Nlc3NBcHByb2FjaC5pc1dlYkdwdUFwcHJvYWNoKGVuZ2luZS5lbmdpbmVTdGF0ZS5jdXJyZW50UHJvY2Vzc0FwcHJvYWNoKSB8fFxuICAgICAgcmVuZGVyUGFzcy5pc0J1ZmZlckxlc3NSZW5kZXJpbmdNb2RlKClcbiAgICApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQSBtdWx0aS12aWV3IGRyYXcgcmVuZGVycyBib3RoIGV5ZXMsIHdoaWNoIGhhdmUgZGlmZmVyZW50IGZydXN0YS5cbiAgICBjb25zdCB3ZWJ4clN5c3RlbSA9IGVuZ2luZS5fd2ViWFJTeXN0ZW1JZkVuYWJsZWQ7XG4gICAgaWYgKHJlbmRlclBhc3MuaXNWclJlbmRlcmluZyAmJiB3ZWJ4clN5c3RlbT8uaXNXZWJYUk1vZGUgJiYgd2VieHJTeXN0ZW0uaXNNdWx0aVZpZXcoKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBsYXRlc3QgY3VsbGluZyByZXN1bHQgb2YgYSByZW5kZXIgcGFzcyBmb3IgcGVyLWluc3RhbmNlIGN1bGxpbmcgb2YgaW5zdGFuY2VkIGRyYXcgY2FsbHMuXG4gICAqIFRoZSByZXN1bHQgc3RheXMgdmFsaWQgd2hpbGUgYHNvcnRfJHJlbmRlcmAgcmV1c2VzIGl0cyBjYWNoZWQgcHJpbWl0aXZlIGxpc3QgZm9yIHRoZSByZW5kZXIgcGFzcy5cbiAgICogQHBhcmFtIHJlbmRlclBhc3MgLSBUaGUgcmVuZGVyIHBhc3NcbiAgICogQHJldHVybnMgVGhlIGN1bGxpbmcgc3RhdGUsIG9yIHVuZGVmaW5lZCBpZiBubyBjdWxsaW5nIGhhcyBydW4gZm9yIHRoZSByZW5kZXIgcGFzc1xuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHN0YXRpYyBfZ2V0SW5zdGFuY2VDdWxsaW5nU3RhdGUocmVuZGVyUGFzczogUmVuZGVyUGFzcyk6IEluc3RhbmNlQ3VsbGluZ1N0YXRlIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBzY3JhdGNoID0gTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fc29ydFNjcmF0Y2hNYXAuZ2V0KHJlbmRlclBhc3MpO1xuICAgIGlmIChzY3JhdGNoID09PSB1bmRlZmluZWQgfHwgc2NyYXRjaC5jdWxsVGljayA9PT0gMCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIHNjcmF0Y2g7XG4gIH1cblxuICAvKipcbiAgICogQXBwZW5kcyB0aGUgcHJpbWl0aXZlcyBvZiBhIG1lc2ggY29tcG9uZW50IHRvIGBvdXRQcmltaXRpdmVzYCBhbmQgY29tcHV0ZXMgdGhlXG4gICAqIHZpZXcgZGVwdGggZm9yIGJsZW5kZWQgcHJpbWl0aXZlcy5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fYXBwZW5kUHJpbWl0aXZlc09mTWVzaENvbXBvbmVudChcbiAgICBtZXNoQ29tcG9uZW50OiBNZXNoQ29tcG9uZW50LFxuICAgIGNhbWVyYUNvbXBvbmVudDogQ2FtZXJhQ29tcG9uZW50LFxuICAgIG91dFByaW1pdGl2ZXM6IFByaW1pdGl2ZVtdXG4gICkge1xuICAgIGNvbnN0IG1lc2ggPSBtZXNoQ29tcG9uZW50Lm1lc2g7XG4gICAgaWYgKG1lc2ggPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBtZXNoUHJpbWl0aXZlcyA9IG1lc2gucHJpbWl0aXZlcztcbiAgICBjb25zdCBwcmltaXRpdmVDb3VudCA9IG1lc2hQcmltaXRpdmVzLmxlbmd0aDtcbiAgICBsZXQgaXNCbGVuZEV4aXN0ID0gZmFsc2U7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmltaXRpdmVDb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCBwcmltaXRpdmUgPSBtZXNoUHJpbWl0aXZlc1tpXTtcbiAgICAgIG91dFByaW1pdGl2ZXMucHVzaChwcmltaXRpdmUpO1xuICAgICAgaWYgKCFpc0JsZW5kRXhpc3QgJiYgaXNCbGVuZChwcmltaXRpdmUpKSB7XG4gICAgICAgIGlzQmxlbmRFeGlzdCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpc0JsZW5kRXhpc3QpIHtcbiAgICAgIGNvbnN0IHZpZXdEZXB0aCA9IG1lc2hDb21wb25lbnQuY2FsY1ZpZXdEZXB0aChjYW1lcmFDb21wb25lbnQpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmltaXRpdmVDb3VudDsgaSsrKSB7XG4gICAgICAgIG1lc2hQcmltaXRpdmVzW2ldLl92aWV3RGVwdGggPSB2aWV3RGVwdGg7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgZHVwbGljYXRlZCBwcmltaXRpdmVzIGluIHBsYWNlIHdpdGhvdXQgYWxsb2NhdGluZyBhIGBTZXRgIG9yIGEgbmV3IGFycmF5LlxuICAgKiBBIHByaW1pdGl2ZSBVSUQgaXMgdW5pcXVlLCBzbyBhIHN0YW1wIGFycmF5IGluZGV4ZWQgYnkgdGhlIFVJRCBpcyBlbm91Z2ggdG8gZGV0ZWN0XG4gICAqIGR1cGxpY2F0ZXMuIGBwcmltaXRpdmVzLmxlbmd0aGAgaXMgdXBkYXRlZCB0byB0aGUgZGVkdXBsaWNhdGVkIGxlbmd0aC5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fcmVtb3ZlRHVwbGljYXRlZFByaW1pdGl2ZXMocHJpbWl0aXZlczogUHJpbWl0aXZlW10sIHNjcmF0Y2g6IE1lc2hSZW5kZXJlclNvcnRTY3JhdGNoKSB7XG4gICAgY29uc3QgbGVuZ3RoID0gcHJpbWl0aXZlcy5sZW5ndGg7XG4gICAgaWYgKGxlbmd0aCA8PSAxKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IHN0YW1wID0gc2NyYXRjaC5zdGFtcDtcbiAgICBsZXQgc3RhbXBUaWNrID0gc2NyYXRjaC5zdGFtcFRpY2sgKyAxO1xuICAgIGlmIChzdGFtcFRpY2sgPT09IDB4ZmZmZmZmZmYpIHtcbiAgICAgIC8vIFdyYXAgYXJvdW5kOiBjbGVhciB0aGUgc3RhbXBzIHNvIHRoYXQgb2xkIHZhbHVlcyBjYW5ub3QgYmUgbWlzdGFrZW4gZm9yIHRoZSBjdXJyZW50IHRpY2suXG4gICAgICBzdGFtcC5maWxsKDApO1xuICAgICAgc3RhbXBUaWNrID0gMTtcbiAgICB9XG4gICAgc2NyYXRjaC5zdGFtcFRpY2sgPSBzdGFtcFRpY2s7XG5cbiAgICBsZXQgdW5pcXVlTGVuZ3RoID0gMDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBwcmltaXRpdmUgPSBwcmltaXRpdmVzW2ldO1xuICAgICAgY29uc3QgcHJpbWl0aXZlVWlkID0gcHJpbWl0aXZlLnByaW1pdGl2ZVVpZDtcbiAgICAgIGlmIChwcmltaXRpdmVVaWQgPCAwKSB7XG4gICAgICAgIHByaW1pdGl2ZXNbdW5pcXVlTGVuZ3RoKytdID0gcHJpbWl0aXZlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChwcmltaXRpdmVVaWQgPj0gc3RhbXAubGVuZ3RoKSB7XG4gICAgICAgIC8vIEdyb3cgdGhlIHN0YW1wIGFycmF5IHVwIHRvIHRoZSBsYXJnZXN0IHByaW1pdGl2ZSBVSUQgc2VlbiBzbyBmYXIuXG4gICAgICAgIGNvbnN0IG5ld1N0YW1wID0gbmV3IFVpbnQzMkFycmF5KE1hdGgubWF4KHByaW1pdGl2ZVVpZCArIDEsIHN0YW1wLmxlbmd0aCAqIDIsIDY0KSk7XG4gICAgICAgIG5ld1N0YW1wLnNldChzdGFtcCk7XG4gICAgICAgIHNjcmF0Y2guc3RhbXAgPSBuZXdTdGFtcDtcbiAgICAgICAgc3RhbXAgPSBuZXdTdGFtcDtcbiAgICAgIH1cbiAgICAgIGlmIChzdGFtcFtwcmltaXRpdmVVaWRdID09PSBzdGFtcFRpY2spIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBzdGFtcFtwcmltaXRpdmVVaWRdID0gc3RhbXBUaWNrO1xuICAgICAgcHJpbWl0aXZlc1t1bmlxdWVMZW5ndGgrK10gPSBwcmltaXRpdmU7XG4gICAgfVxuICAgIHByaW1pdGl2ZXMubGVuZ3RoID0gdW5pcXVlTGVuZ3RoO1xuICB9XG5cbiAgLyoqIFNvcnQgY29tcGFyYXRvciBzaGFyZWQgYnkgZXZlcnkgcmVuZGVyIHBhc3MgKGF2b2lkcyBhbGxvY2F0aW5nIGEgY2xvc3VyZSBwZXIgZnJhbWUpLiAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2NvbXBhcmVQcmltaXRpdmVzKGE6IFByaW1pdGl2ZSwgYjogUHJpbWl0aXZlKSB7XG4gICAgY29uc3QgZGVsdGEgPSBhLl9zb3J0a2V5IC0gYi5fc29ydGtleTtcbiAgICBpZiAoZGVsdGEgIT09IDApIHtcbiAgICAgIHJldHVybiBkZWx0YTtcbiAgICB9XG4gICAgcmV0dXJuIGEuX3ZpZXdEZXB0aCAtIGIuX3ZpZXdEZXB0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZHMgdGhlIHByaW1pdGl2ZSBVSUQgbGlzdCB1c2VkIGZvciBkcmF3aW5nLiBUaGUgdHJhaWxpbmcgYC0xYCBpcyB0aGUgc2VudGluZWxcbiAgICogdGhhdCB0ZXJtaW5hdGVzIHRoZSBsaXN0LlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19jcmVhdGVQcmltaXRpdmVVaWRzKHByaW1pdGl2ZXM6IFByaW1pdGl2ZVtdKTogQ29tcG9uZW50U0lEW10ge1xuICAgIGNvbnN0IHByaW1pdGl2ZUNvdW50ID0gcHJpbWl0aXZlcy5sZW5ndGg7XG4gICAgY29uc3QgcHJpbWl0aXZlVWlkcyA9IG5ldyBBcnJheTxDb21wb25lbnRTSUQ+KHByaW1pdGl2ZUNvdW50ICsgMSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmltaXRpdmVDb3VudDsgaSsrKSB7XG4gICAgICBwcmltaXRpdmVVaWRzW2ldID0gcHJpbWl0aXZlc1tpXS5wcmltaXRpdmVVaWQ7XG4gICAgfVxuICAgIHByaW1pdGl2ZVVpZHNbcHJpbWl0aXZlQ291bnRdID0gLTE7XG4gICAgcmV0dXJuIHByaW1pdGl2ZVVpZHM7XG4gIH1cblxuICAvKiogUmV0dXJucyAoYW5kIGxhemlseSBjcmVhdGVzKSB0aGUgcmV1c2FibGUgc2NyYXRjaCBidWZmZXJzIG9mIGEgcmVuZGVyIHBhc3MuICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0U29ydFNjcmF0Y2gocmVuZGVyUGFzczogUmVuZGVyUGFzcyk6IE1lc2hSZW5kZXJlclNvcnRTY3JhdGNoIHtcbiAgICBsZXQgc2NyYXRjaCA9IE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX3NvcnRTY3JhdGNoTWFwLmdldChyZW5kZXJQYXNzKTtcbiAgICBpZiAoc2NyYXRjaCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBzY3JhdGNoID0ge1xuICAgICAgICBwcmltaXRpdmVzOiBbXSxcbiAgICAgICAgc3RhbXA6IG5ldyBVaW50MzJBcnJheSg2NCksXG4gICAgICAgIHN0YW1wVGljazogMCxcbiAgICAgICAgY3VsbGVkRW50aXR5U3RhbXA6IG5ldyBVaW50MzJBcnJheSg2NCksXG4gICAgICAgIGhhbmRsZWRFbnRpdHlTdGFtcDogbmV3IFVpbnQzMkFycmF5KDY0KSxcbiAgICAgICAgbWVzaEN1bGxUaWNrOiBuZXcgV2Vha01hcCgpLFxuICAgICAgICBjdWxsVGljazogMCxcbiAgICAgICAgY3VsbGVkRW50aXR5Q291bnQ6IDAsXG4gICAgICAgIGN1bGxpbmdJZDogMCxcbiAgICAgICAga2V5ZWRQcmltaXRpdmVzOiBbXSxcbiAgICAgICAgaXNHcHVDdWxsaW5nQWN0aXZlOiB1bmRlZmluZWQsXG4gICAgICAgIGlzQ29tcHV0ZVNraW5uaW5nRW5hYmxlZDogdW5kZWZpbmVkLFxuICAgICAgICBjdWxsZWRJbnN0YW5jZWRNZXNoQ29tcG9uZW50czogW10sXG4gICAgICAgIG1lc2hBcHBlbmRUaWNrOiBuZXcgV2Vha01hcCgpLFxuICAgICAgfTtcbiAgICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX3NvcnRTY3JhdGNoTWFwLnNldChyZW5kZXJQYXNzLCBzY3JhdGNoKTtcbiAgICB9XG4gICAgcmV0dXJuIHNjcmF0Y2g7XG4gIH1cblxuICAvKipcbiAgICogQ29tbW9uIHByZS1yZW5kZXJpbmcgc2V0dXAgbWV0aG9kIHRoYXQgcHJlcGFyZXMgdGhlIHJlbmRlcmluZyBzdHJhdGVneS5cbiAgICogSW5pdGlhbGl6ZXMgdGhlIHJlbmRlcmluZyBzdHJhdGVneSBpZiBub3QgYWxyZWFkeSBzZXQgYW5kIGNhbGxzIGl0cyBwcmVyZW5kZXIgbWV0aG9kLlxuICAgKi9cbiAgc3RhdGljIGNvbW1vbl8kcHJlcmVuZGVyKGVuZ2luZTogRW5naW5lKSB7XG4gICAgY29uc3QgZW5naW5lVWlkID0gZW5naW5lLm9iamVjdFVJRDtcbiAgICAvLyBUaGlzIHJ1bnMgb25jZSBwZXIgZnJhbWUsIHNvIHRoZSBzdHJhdGVneSBpcyBtZW1vaXplZCBpbnN0ZWFkIG9mIGRvaW5nIGFcbiAgICAvLyBgTWFwLmhhc2AgKyBgTWFwLmdldGAgcGFpciBvbiBldmVyeSBmcmFtZS5cbiAgICBsZXQgc3RyYXRlZ3kgPSBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19wcmVyZW5kZXJTdHJhdGVneTtcbiAgICBpZiAoc3RyYXRlZ3kgPT09IHVuZGVmaW5lZCB8fCBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19wcmVyZW5kZXJTdHJhdGVneUVuZ2luZVVpZCAhPT0gZW5naW5lVWlkKSB7XG4gICAgICBzdHJhdGVneSA9IE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX2NnQXBpUmVuZGVyaW5nU3RyYXRlZ3lNYXAuZ2V0KGVuZ2luZVVpZCk7XG4gICAgICBpZiAoc3RyYXRlZ3kgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBQb3NzaWJsZSBpZiB0aGVyZSBpcyBubyBtZXNoIGVudGl0eSBpbiB0aGUgc2NlbmVcbiAgICAgICAgY29uc3QgcHJvY2Vzc0FwcHJvYWNoID0gZW5naW5lLmVuZ2luZVN0YXRlLmN1cnJlbnRQcm9jZXNzQXBwcm9hY2g7XG4gICAgICAgIHRoaXMuY29tbW9uXyRsb2FkKHsgcHJvY2Vzc0FwcHJvYWNoLCBlbmdpbmUgfSk7XG4gICAgICAgIHN0cmF0ZWd5ID0gTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fY2dBcGlSZW5kZXJpbmdTdHJhdGVneU1hcC5nZXQoZW5naW5lVWlkKTtcbiAgICAgICAgaWYgKHN0cmF0ZWd5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX3ByZXJlbmRlclN0cmF0ZWd5RW5naW5lVWlkID0gZW5naW5lVWlkO1xuICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fcHJlcmVuZGVyU3RyYXRlZ3kgPSBzdHJhdGVneTtcbiAgICB9XG4gICAgLy8gQ2FsbCBjb21tb25fJHByZXJlbmRlciBvZiB0aGUgV2ViR0wvV2ViR1BVIHJlbmRlcmluZyBzdHJhdGVneVxuICAgIHN0cmF0ZWd5LnByZXJlbmRlcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbW1vbiByZW5kZXJpbmcgbWV0aG9kIHRoYXQgZXhlY3V0ZXMgdGhlIGFjdHVhbCByZW5kZXJpbmcgb2YgcHJpbWl0aXZlcy5cbiAgICogRGVsZWdhdGVzIHRvIHRoZSBhcHByb3ByaWF0ZSByZW5kZXJpbmcgc3RyYXRlZ3kgKFdlYkdMIG9yIFdlYkdQVSkuXG4gICAqIEBwYXJhbSByZW5kZXJQYXNzIC0gVGhlIHJlbmRlciBwYXNzIGNvbnRleHRcbiAgICogQHBhcmFtIHJlbmRlclBhc3NUaWNrQ291bnQgLSBUaGUgdGljayBjb3VudCBmb3IgdGhpcyByZW5kZXIgcGFzc1xuICAgKiBAcGFyYW0gcHJpbWl0aXZlVWlkcyAtIEFycmF5IG9mIHByaW1pdGl2ZSBVSURzIHRvIHJlbmRlclxuICAgKiBAcGFyYW0gZGlzcGxheUlkeCAtIFRoZSBpbmRleCBvZiB0aGUgZGlzcGxheSB0byByZW5kZXIgdG9cbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHJldHVybnMgVHJ1ZSBpZiByZW5kZXJpbmcgd2FzIHN1Y2Nlc3NmdWwsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGNvbW1vbl8kcmVuZGVyKHtcbiAgICByZW5kZXJQYXNzLFxuICAgIHJlbmRlclBhc3NUaWNrQ291bnQsXG4gICAgcHJpbWl0aXZlVWlkcyxcbiAgICBkaXNwbGF5SWR4LFxuICAgIGVuZ2luZSxcbiAgfToge1xuICAgIHJlbmRlclBhc3M6IFJlbmRlclBhc3M7XG4gICAgcmVuZGVyUGFzc1RpY2tDb3VudDogQ291bnQ7XG4gICAgcHJpbWl0aXZlVWlkczogUHJpbWl0aXZlVUlEW107XG4gICAgZGlzcGxheUlkeDogSW5kZXg7XG4gICAgZW5naW5lOiBFbmdpbmU7XG4gIH0pOiBib29sZWFuIHtcbiAgICAvLyBDYWxsIGNvbW1vbl8kcmVuZGVyIG9mIFdlYkdMUmVuZGVyaW5nU3RyYXRlZ3lcbiAgICByZXR1cm4gTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fY2dBcGlSZW5kZXJpbmdTdHJhdGVneU1hcFxuICAgICAgLmdldChlbmdpbmUub2JqZWN0VUlEKSFcbiAgICAgIC5jb21tb25fJHJlbmRlcihwcmltaXRpdmVVaWRzLCByZW5kZXJQYXNzLCByZW5kZXJQYXNzVGlja0NvdW50LCBkaXNwbGF5SWR4KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnN0YW5jZS1zcGVjaWZpYyByZW5kZXIgbWV0aG9kIGZvciB0aGlzIG1lc2ggcmVuZGVyZXIgY29tcG9uZW50LlxuICAgKiBDdXJyZW50bHkgZW1wdHkgYXMgcmVuZGVyaW5nIGlzIGhhbmRsZWQgYnkgdGhlIHN0YXRpYyBjb21tb25fJHJlbmRlciBtZXRob2QuXG4gICAqIEBwYXJhbSBpIC0gVGhlIGluZGV4IG9mIHRoaXMgY29tcG9uZW50IGluIHRoZSByZW5kZXIgcXVldWVcbiAgICogQHBhcmFtIHJlbmRlclBhc3MgLSBUaGUgcmVuZGVyIHBhc3MgY29udGV4dFxuICAgKiBAcGFyYW0gcmVuZGVyUGFzc1RpY2tDb3VudCAtIFRoZSB0aWNrIGNvdW50IGZvciB0aGlzIHJlbmRlciBwYXNzXG4gICAqL1xuICAkcmVuZGVyKCkge31cblxuICAvKipcbiAgICogUGVyZm9ybXMgYSBzaGFsbG93IGNvcHkgb2YgcHJvcGVydGllcyBmcm9tIGFub3RoZXIgTWVzaFJlbmRlcmVyQ29tcG9uZW50LlxuICAgKiBDb3BpZXMgY3ViZSBtYXAgc2V0dGluZ3MgYW5kIGNvbnRyaWJ1dGlvbnMgd2l0aG91dCBkZWVwIGNsb25pbmcgdGhlIHRleHR1cmVzLlxuICAgKiBAcGFyYW0gY29tcG9uZW50XyAtIFRoZSBzb3VyY2UgY29tcG9uZW50IHRvIGNvcHkgZnJvbVxuICAgKi9cbiAgX3NoYWxsb3dDb3B5RnJvbShjb21wb25lbnRfOiBDb21wb25lbnQpOiB2b2lkIHtcbiAgICBjb25zdCBjb21wb25lbnQgPSBjb21wb25lbnRfIGFzIE1lc2hSZW5kZXJlckNvbXBvbmVudDtcblxuICAgIHRoaXMuX19kaWZmdXNlQ3ViZU1hcCA9IGNvbXBvbmVudC5fX2RpZmZ1c2VDdWJlTWFwO1xuICAgIHRoaXMuX19zcGVjdWxhckN1YmVNYXAgPSBjb21wb25lbnQuX19zcGVjdWxhckN1YmVNYXA7XG4gICAgdGhpcy5kaWZmdXNlQ3ViZU1hcENvbnRyaWJ1dGlvbiA9IGNvbXBvbmVudC5kaWZmdXNlQ3ViZU1hcENvbnRyaWJ1dGlvbjtcbiAgICB0aGlzLnNwZWN1bGFyQ3ViZU1hcENvbnRyaWJ1dGlvbiA9IGNvbXBvbmVudC5zcGVjdWxhckN1YmVNYXBDb250cmlidXRpb247XG4gICAgdGhpcy5yb3RhdGlvbk9mQ3ViZU1hcCA9IGNvbXBvbmVudC5yb3RhdGlvbk9mQ3ViZU1hcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGlzIGNvbXBvbmVudCBhbmQgY2xlYW5zIHVwIGl0cyByZXNvdXJjZXMuXG4gICAqIENsZWFycyBjdWJlIG1hcCByZWZlcmVuY2VzIGFuZCBjYWxscyB0aGUgcGFyZW50IGRlc3Ryb3kgbWV0aG9kLlxuICAgKi9cbiAgX2Rlc3Ryb3koKTogdm9pZCB7XG4gICAgc3VwZXIuX2Rlc3Ryb3koKTtcbiAgICB0aGlzLl9fZGlmZnVzZUN1YmVNYXAgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fX3NwZWN1bGFyQ3ViZU1hcCA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBNZXNoUmVuZGVyZXIgY29tcG9uZW50IGZ1bmN0aW9uYWxpdHkgdG8gYW4gZW50aXR5IGNsYXNzLlxuICAgKiBUaGlzIG1ldGhvZCBleHRlbmRzIHRoZSBlbnRpdHkgYmFzZSBjbGFzcyB3aXRoIG1lc2ggcmVuZGVyZXIgc3BlY2lmaWMgbWV0aG9kcy5cbiAgICogQHBhcmFtIGJhc2UgLSBUaGUgdGFyZ2V0IGVudGl0eSBiYXNlIGNsYXNzXG4gICAqIEBwYXJhbSBfY29tcG9uZW50Q2xhc3MgLSBUaGUgY29tcG9uZW50IGNsYXNzIHRvIGFkZCAodW51c2VkIHBhcmFtZXRlciBmb3IgdHlwZSBzYWZldHkpXG4gICAqIEByZXR1cm5zIFRoZSBlbmhhbmNlZCBlbnRpdHkgY2xhc3Mgd2l0aCBtZXNoIHJlbmRlcmVyIG1ldGhvZHNcbiAgICovXG4gIGFkZFRoaXNDb21wb25lbnRUb0VudGl0eTxFbnRpdHlCYXNlIGV4dGVuZHMgSUVudGl0eSwgU29tZUNvbXBvbmVudENsYXNzIGV4dGVuZHMgdHlwZW9mIENvbXBvbmVudD4oXG4gICAgYmFzZTogRW50aXR5QmFzZSxcbiAgICBfY29tcG9uZW50Q2xhc3M6IFNvbWVDb21wb25lbnRDbGFzc1xuICApIHtcbiAgICBjbGFzcyBNZXNoUmVuZGVyZXJFbnRpdHkgZXh0ZW5kcyAoYmFzZS5jb25zdHJ1Y3RvciBhcyBhbnkpIHtcbiAgICAgIGdldE1lc2hSZW5kZXJlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29tcG9uZW50QnlDb21wb25lbnRUSUQoXG4gICAgICAgICAgV2VsbEtub3duQ29tcG9uZW50VElEcy5NZXNoUmVuZGVyZXJDb21wb25lbnRUSURcbiAgICAgICAgKSBhcyBNZXNoUmVuZGVyZXJDb21wb25lbnQ7XG4gICAgICB9XG4gICAgfVxuICAgIGFwcGx5TWl4aW5zKGJhc2UsIE1lc2hSZW5kZXJlckVudGl0eSk7XG4gICAgcmV0dXJuIGJhc2UgYXMgdW5rbm93biBhcyBDb21wb25lbnRUb0NvbXBvbmVudE1ldGhvZHM8U29tZUNvbXBvbmVudENsYXNzPiAmIEVudGl0eUJhc2U7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW5zIHVwIHN0YXRpYyByZXNvdXJjZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBzcGVjaWZpZWQgZW5naW5lLlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZSB0byBjbGVhbiB1cCByZXNvdXJjZXMgZm9yXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIF9jbGVhbnVwRm9yRW5naW5lKGVuZ2luZTogRW5naW5lKTogdm9pZCB7XG4gICAgY29uc3Qgc3RyYXRlZ3kgPSBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19jZ0FwaVJlbmRlcmluZ1N0cmF0ZWd5TWFwLmdldChlbmdpbmUub2JqZWN0VUlEKTtcbiAgICBpZiAoc3RyYXRlZ3kgIT0gbnVsbCkge1xuICAgICAgc3RyYXRlZ3kuZGVzdHJveSgpO1xuICAgIH1cbiAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuX19jZ0FwaVJlbmRlcmluZ1N0cmF0ZWd5TWFwLmRlbGV0ZShlbmdpbmUub2JqZWN0VUlEKTtcbiAgICAvLyBEcm9wIHRoZSBtZW1vaXplZCBzdHJhdGVneSBzbyB0aGF0IGEgc3RhbGUgaW5zdGFuY2UgaXMgbmV2ZXIgcmV1c2VkLlxuICAgIGlmIChNZXNoUmVuZGVyZXJDb21wb25lbnQuX19wcmVyZW5kZXJTdHJhdGVneUVuZ2luZVVpZCA9PT0gZW5naW5lLm9iamVjdFVJRCkge1xuICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9fcHJlcmVuZGVyU3RyYXRlZ3lFbmdpbmVVaWQgPSAtMTtcbiAgICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fX3ByZXJlbmRlclN0cmF0ZWd5ID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQVVBLFNBQVMsd0JBQXdCLDZDQUE2QztBQUk5RSxTQUFTLGlCQUFpQjtBQUUxQixTQUFTLG1CQUEwQztBQUNuRCxTQUFTLHVCQUFpRDtBQUMxRCxTQUFTLG9CQUFvQjtBQUU3QixTQUFTLFNBQVMsc0JBQXNCLG1CQUFtQixxQkFBcUI7QUFJaEYsU0FBUyxxQkFBcUI7QUFHOUIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxpQ0FBaUM7QUFHMUMsU0FBUywyQkFBMkI7QUFDcEMsU0FBUywwQkFBMEI7QUFDbkMsU0FBUyw4QkFBOEI7QUE2RGhDLElBQU0seUJBQU4sTUFBTSwrQkFBOEIsVUFBVTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQXlDbkQsWUFDRSxRQUNBLFdBQ0EsY0FDQSxrQkFDQSxTQUNBO0FBQ0EsVUFBTSxRQUFRLFdBQVcsY0FBYyxrQkFBa0IsT0FBTztBQTVDbEUsU0FBUSwrQkFBK0I7QUFDdkMsU0FBUSxnQ0FBZ0M7QUFDeEMsU0FBUSxzQkFBc0I7QUFJOUIsU0FBUSxnQkFBZ0I7QUFNeEIsU0FBUSxnQkFBZ0I7QUFDeEIsU0FBUSxrQkFBa0I7QUFnQ3hCLFNBQUssZ0JBQWdCO0FBQUEsRUFDdkI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsV0FBVyxlQUFlO0FBQ3hCLFdBQU8sdUJBQXVCO0FBQUEsRUFDaEM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxlQUE2QjtBQUMvQixXQUFPLHVCQUF1QjtBQUFBLEVBQ2hDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksaUJBQWlCO0FBQ25CLFdBQU8sS0FBSztBQUFBLEVBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxrQkFBa0I7QUFDcEIsV0FBTyxLQUFLO0FBQUEsRUFDZDtBQUFBO0FBQUE7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
