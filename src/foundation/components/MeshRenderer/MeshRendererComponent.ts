import type {
  CGAPIResourceHandle,
  ComponentSID,
  ComponentTID,
  Count,
  EntityUID,
  Index,
  ObjectUID,
  PrimitiveUID,
} from '../../../types/CommonTypes';
import { getMultiDrawStateKeyId, getPrimitiveMeshRendererFingerPrintId } from '../../../webgl/MultiDraw';
import type { RnWebGL, WebGLStrategy } from '../../../webgl/main';
import type { RnWebGpu } from '../../../webgpu/main';
import type { WebGpuStrategyBasic } from '../../../webgpu/WebGpuStrategyBasic';
import type { RnXR } from '../../../xr/main';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { applyMixins, type EntityRepository } from '../../core/EntityRepository';
import { ProcessApproach, type ProcessApproachEnum } from '../../definitions/ProcessApproach';
import { ProcessStage } from '../../definitions/ProcessStage';
import type { Primitive } from '../../geometry/Primitive';
import { isBlend, isBlendWithoutZWrite, isBlendWithZWrite, isTranslucent } from '../../geometry/types/GeometryTypes';
import type { CGAPIStrategy } from '../../renderer/CGAPIStrategy';
import type { RenderPass } from '../../renderer/RenderPass';
import type { Engine } from '../../system/Engine';
import { ModuleManager } from '../../system/ModuleManager';
import type { CubeTexture } from '../../textures/CubeTexture';
import type { RenderTargetTextureCube } from '../../textures/RenderTargetTextureCube';
import { CameraComponent } from '../Camera/CameraComponent';
import { CameraControllerComponent } from '../CameraController/CameraControllerComponent';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import type { MeshComponent } from '../Mesh/MeshComponent';
import { SceneGraphComponent } from '../SceneGraph/SceneGraphComponent';
import { TransformComponent } from '../Transform/TransformComponent';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

/**
 * Reusable working buffers for one render pass.
 *
 * `sort_$render` runs every frame and used to allocate a filtered mesh component
 * array, a `Set`, a mapped array and several closures per call. All of them are
 * replaced by these per-render-pass scratch buffers.
 */
type MeshRendererSortScratch = {
  /** Primitives collected by the culling pass. */
  primitives: Primitive[];
  /** Per-primitive stamp used to remove duplicates without a `Set`. */
  stamp: Uint32Array;
  /** Current stamp value; a primitive is a duplicate while `stamp[uid] === stampTick`. */
  stampTick: number;
  /** Per-EntityUID stamp; an entity was culled by the latest culling while `culledEntityStamp[uid] === cullTick`. */
  culledEntityStamp: Uint32Array;
  /** Per-EntityUID stamp; an entity was handled by the latest culling while `handledEntityStamp[uid] === cullTick`. */
  handledEntityStamp: Uint32Array;
  /** Per-mesh stamp; the instances sharing a mesh were culled by the latest culling while it equals `cullTick`. */
  meshCullTick: WeakMap<object, number>;
  /** Stamp value of the latest culling of this render pass (0 means no culling has run yet). */
  cullTick: number;
  /** Number of entities culled by the latest culling. 0 means every instance stays visible. */
  culledEntityCount: number;
  /** Globally unique id of the latest culling, used to visit each mesh once in the instance prepass. */
  cullingId: number;
  /** Reused objects of the opaque multi-draw reorder, so a sort does not allocate per primitive. */
  keyedPrimitives: { primitive: Primitive | null; keyId: number; index: number }[];
};

/**
 * Culling result of a render pass for per-instance culling of instanced draw calls.
 * An entity was culled in the render pass while `culledEntityStamp[entityUID] === cullTick`.
 */
export type InstanceCullingState = {
  readonly culledEntityStamp: Uint32Array;
  readonly cullTick: number;
  /** Number of entities culled by the latest culling. 0 means every instance stays visible. */
  readonly culledEntityCount: number;
  /** Globally unique id of the latest culling. */
  readonly cullingId: number;
};

/**
 * MeshRendererComponent is a component that manages the rendering of a mesh entity.
 * It handles mesh rendering pipeline, IBL (Image-Based Lighting) cube maps, frustum culling,
 * and rendering optimization through various strategies.
 */
export class MeshRendererComponent extends Component {
  private __diffuseCubeMap?: CubeTexture | RenderTargetTextureCube;
  private __specularCubeMap?: CubeTexture | RenderTargetTextureCube;
  private __sheenCubeMap?: CubeTexture | RenderTargetTextureCube;
  private __diffuseCubeMapContribution = 1.0;
  private __specularCubeMapContribution = 1.0;
  private __rotationOfCubeMap = 0;

  private static __cgApiRenderingStrategyMap: Map<ObjectUID, CGAPIStrategy> = new Map();
  static __shaderProgramHandleOfPrimitiveObjectUids: Map<ObjectUID, CGAPIResourceHandle> = new Map();
  private __updateCount = 0;
  private static __updateCount = 0;
  public static _isFrustumCullingEnabled = true;
  /** Monotonic id of the latest culling pass, used as a per-mesh visit stamp. */
  private static __cullingIdCounter = 0;

  private __fingerPrint = '';
  private __fingerPrintId = 0;
  /**
   * Interned ids of mesh renderer fingerprints. The fingerprint changes only when the IBL cube
   * maps change, and two mesh renderers with the same cube maps must share a multi-draw batch,
   * so the id is interned by value instead of being unique per component.
   */
  private static __fingerPrintIds = new Map<string, number>();
  private static __nextFingerPrintId = 0;

  /** Per-render-pass scratch buffers reused by sort_$render to avoid per-frame allocations. */
  private static __sortScratchMap: WeakMap<RenderPass, MeshRendererSortScratch> = new WeakMap();

  /** Memoized rendering strategy for common_$prerender (the hot path runs once per frame). */
  private static __prerenderStrategyEngineUid: ObjectUID = -1;
  private static __prerenderStrategy: CGAPIStrategy | undefined;

  /**
   * Creates a new MeshRendererComponent instance.
   * @param engine - The engine instance
   * @param entityUid - The unique identifier of the entity this component belongs to
   * @param componentSid - The component's system identifier
   * @param entityRepository - The repository managing entities
   * @param isReUse - Whether this component is being reused from a pool
   */
  constructor(
    engine: Engine,
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository,
    isReUse: boolean
  ) {
    super(engine, entityUid, componentSid, entityRepository, isReUse);
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
  get componentTID(): ComponentTID {
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
    return MeshRendererComponent.__updateCount;
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
  set diffuseCubeMapContribution(contribution: number) {
    this.__diffuseCubeMapContribution = contribution;
    this.__updateCount++;
    MeshRendererComponent.__updateCount++;
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
  set specularCubeMapContribution(contribution: number) {
    this.__specularCubeMapContribution = contribution;
    this.__updateCount++;
    MeshRendererComponent.__updateCount++;
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
  set rotationOfCubeMap(rotation: number) {
    this.__rotationOfCubeMap = rotation;
    this.__updateCount++;
    MeshRendererComponent.__updateCount++;
  }

  /**
   * Calculates and updates the fingerprint for this component based on current cube map settings.
   * The fingerprint is used for caching and optimization purposes.
   */
  calcFingerPrint() {
    this.__fingerPrint = `${this.__diffuseCubeMap != null ? this.__diffuseCubeMap.textureUID : -1} ${this.__specularCubeMap != null ? this.__specularCubeMap.textureUID : -1} ${this.__sheenCubeMap != null ? this.__sheenCubeMap.textureUID : -1}`;
    this.__fingerPrintId = MeshRendererComponent.__internFingerPrintId(this.__fingerPrint);
  }

  private static __internFingerPrintId(fingerPrint: string): number {
    let id = MeshRendererComponent.__fingerPrintIds.get(fingerPrint);
    if (id == null) {
      id = ++MeshRendererComponent.__nextFingerPrintId;
      MeshRendererComponent.__fingerPrintIds.set(fingerPrint, id);
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
  setIBLCubeMap(
    diffuseCubeTexture: CubeTexture | RenderTargetTextureCube,
    specularCubeTexture: CubeTexture | RenderTargetTextureCube,
    sheenCubeTexture?: CubeTexture | RenderTargetTextureCube
  ) {
    if (diffuseCubeTexture == null || specularCubeTexture == null) {
      return;
    }

    this.__diffuseCubeMap = diffuseCubeTexture;
    this.__specularCubeMap = specularCubeTexture;
    this.__sheenCubeMap = sheenCubeTexture;

    this.calcFingerPrint();

    this.__updateCount++;
    MeshRendererComponent.__updateCount++;
  }

  /**
   * Common loading method that initializes the rendering strategy based on the process approach.
   * This method sets up either WebGPU or WebGL rendering strategies.
   * @param processApproach - The graphics API approach to use (WebGPU or WebGL)
   */
  static common_$load({ processApproach, engine }: { processApproach: ProcessApproachEnum; engine: Engine }) {
    const moduleManager = ModuleManager.getInstance();
    const engineUid = engine.objectUID;

    // Strategy
    if (processApproach === ProcessApproach.WebGPU) {
      const moduleName = 'webgpu';
      const webgpuModule = moduleManager.getModule(moduleName)! as RnWebGpu;
      if (!MeshRendererComponent.__cgApiRenderingStrategyMap.has(engineUid)) {
        MeshRendererComponent.__cgApiRenderingStrategyMap.set(engineUid, webgpuModule.WebGpuStrategyBasic.init(engine));
      }
      (MeshRendererComponent.__cgApiRenderingStrategyMap.get(engineUid) as WebGpuStrategyBasic).common_$load();
    } else {
      const moduleName = 'webgl';
      const webglModule = moduleManager.getModule(moduleName)! as RnWebGL;
      if (!MeshRendererComponent.__cgApiRenderingStrategyMap.has(engineUid)) {
        MeshRendererComponent.__cgApiRenderingStrategyMap.set(
          engineUid,
          webglModule.getRenderingStrategy(engine, processApproach)
        );
      }
      (MeshRendererComponent.__cgApiRenderingStrategyMap.get(engineUid) as WebGLStrategy).common_$load();
    }
  }

  /**
   * Loads and initializes this mesh renderer component.
   * Sets up the component for rendering by loading the associated mesh.
   */
  $load() {
    const strategy = MeshRendererComponent.__cgApiRenderingStrategyMap.get(this.__engine.objectUID);
    const ready = strategy!.$load(this.entity.tryToGetMesh()!);
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
  static sort_$render(engine: Engine, renderPass: RenderPass): ComponentSID[] {
    const webglResourceRepository = engine.webglResourceRepository;
    const multiDrawGroupVersion =
      webglResourceRepository != null ? webglResourceRepository.getMultiDrawRepository(engine).version : 0;
    if (
      TransformComponent.getUpdateCount(engine) === renderPass._lastTransformComponentsUpdateCount &&
      CameraControllerComponent.getUpdateCount(engine) === renderPass._lastCameraControllerComponentsUpdateCount &&
      SceneGraphComponent.getUpdateCount(engine) === renderPass._lastSceneGraphComponentsUpdateCount &&
      multiDrawGroupVersion === renderPass._lastMultiDrawGroupVersion
    ) {
      return renderPass._lastPrimitiveUids;
    }

    // get CameraComponent
    let cameraComponent = renderPass.cameraComponent;
    // If the renderPass doesn't have a cameraComponent, then we get it of the main camera
    if (cameraComponent == null) {
      cameraComponent = engine.componentRepository.getComponent(
        CameraComponent,
        CameraComponent.getCurrent(engine)
      ) as CameraComponent;
    }
    if (cameraComponent == null) {
      const cameraComponents = engine.componentRepository.getComponentsWithType(CameraComponent) as CameraComponent[];
      cameraComponent = cameraComponents.find(c => c?._isAlive)!;
      CameraComponent.setCurrent(engine, cameraComponent.componentSID);
    }
    if (renderPass.isVrRendering) {
      const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
      if (rnXRModule != null) {
        const webxrSystem = engine.webXRSystem;
        if (webxrSystem.isWebXRMode) {
          cameraComponent = webxrSystem._getCameraComponentAt(0) as CameraComponent;
        }
      }
    }

    // FrustumCulling (writes into the reusable per-render-pass scratch array)
    const scratch = MeshRendererComponent.__getSortScratch(renderPass);
    const primitives = MeshRendererComponent.__cullingWithViewFrustum(
      cameraComponent,
      renderPass._optimizedMeshComponents,
      scratch.primitives,
      scratch
    );

    // After Frustum Culling, remove duplicated Primitives
    MeshRendererComponent.__removeDuplicatedPrimitives(primitives, scratch);

    // Sort by sortkey
    if (primitives.length > 1) {
      primitives.sort(MeshRendererComponent.__comparePrimitives);
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

    // Reorder the opaque range by effective material (and multi-draw group) so that
    // consecutive draws share their GPU state and can be merged by WEBGL_multi_draw.
    // Opaque draws are depth tested, so this reorder is safe. Translucent/blend buckets
    // keep their distance order.
    if (
      _lastOpaqueIndex > 0 &&
      engine.config.isMultiDrawEnabled &&
      ProcessApproach.isDataTextureApproach(engine.engineState.currentProcessApproach)
    ) {
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
        entry.keyId =
          getMultiDrawStateKeyId(primitive, material, getPrimitiveMeshRendererFingerPrintId(primitive)) ??
          -(material.materialUID + 1);
      }
      keyed.sort((a, b) => a.keyId - b.keyId || a.index - b.index);
      for (let i = 0; i < opaqueCount; i++) {
        primitives[i] = keyed[i].primitive!;
      }
    }

    const primitiveUids = MeshRendererComponent.__createPrimitiveUids(primitives);

    let resultChanged = false;
    if (_lastOpaqueIndex !== renderPass._lastOpaqueIndex) {
      renderPass._lastOpaqueIndex = _lastOpaqueIndex;
      resultChanged ||= true;
    }
    if (_lastTranslucentIndex !== renderPass._lastTranslucentIndex) {
      renderPass._lastTranslucentIndex = _lastTranslucentIndex;
      resultChanged ||= true;
    }
    if (_lastBlendWithZWriteIndex !== renderPass._lastBlendWithZWriteIndex) {
      renderPass._lastBlendWithZWriteIndex = _lastBlendWithZWriteIndex;
      resultChanged ||= true;
    }
    if (_lastBlendWithoutZWriteIndex !== renderPass._lastBlendWithoutZWriteIndex) {
      renderPass._lastBlendWithoutZWriteIndex = _lastBlendWithoutZWriteIndex;
      resultChanged ||= true;
    }

    if (primitiveUids.length !== renderPass._lastPrimitiveUids.length) {
      resultChanged ||= true;
    } else {
      // Check if the order of the blend primitives has changed
      for (let i = _lastTranslucentIndex + 1; i < primitiveUids.length; i++) {
        if (primitiveUids[i] !== renderPass._lastPrimitiveUids[i]) {
          resultChanged ||= true;
          break;
        }
      }
    }
    renderPass._isChangedSortRenderResult = resultChanged;

    renderPass._lastPrimitiveUids = primitiveUids;
    // The scratch array is only refilled by the next sort, which also replaces
    // `_lastPrimitiveUids`, so the pair stays consistent for the render strategies.
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
   * @returns The `outPrimitives` array (same reference) for convenience
   */
  private static __cullingWithViewFrustum(
    cameraComponent: CameraComponent,
    meshComponents: MeshComponent[],
    outPrimitives: Primitive[],
    scratch: MeshRendererSortScratch
  ): Primitive[] {
    outPrimitives.length = 0;

    let cullTick = scratch.cullTick + 1;
    if (cullTick === 0xffffffff) {
      // Wrap around: clear the stamps so that old values cannot be mistaken for the current tick.
      scratch.culledEntityStamp.fill(0);
      scratch.handledEntityStamp.fill(0);
      scratch.meshCullTick = new WeakMap();
      cullTick = 1;
    }
    scratch.cullTick = cullTick;
    scratch.culledEntityCount = 0;
    scratch.cullingId = ++MeshRendererComponent.__cullingIdCounter;

    // A single pass over the mesh components: cull, update visibility flags and
    // collect primitives. The previous implementation allocated a filtered array
    // and an inner closure per call.
    const isFrustumCullingEnabled = cameraComponent != null && MeshRendererComponent._isFrustumCullingEnabled;
    let frustum: CameraComponent['frustum'] | undefined;
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
      scratch.handledEntityStamp = MeshRendererComponent.__stampEntity(
        scratch.handledEntityStamp,
        meshComponent.entityUID,
        cullTick
      );
      if (!sceneGraph.isVisible) {
        MeshRendererComponent.__stampCulledEntity(scratch, meshComponent.entityUID, cullTick);
        continue;
      }

      if (frustum != null) {
        const isBackgroundAsset = meshComponent.entity.getTagValue('type') === 'background-assets';
        const visible = isBackgroundAsset ? true : frustum.culling(meshComponent);
        sceneGraph._isCulled = !visible;
        const skeletal = meshComponent.entity.tryToGetSkeletal();
        if (skeletal !== undefined) {
          skeletal._isCulled = !visible;
        }
        if (!visible) {
          MeshRendererComponent.__stampCulledEntity(scratch, meshComponent.entityUID, cullTick);
          continue;
        }
      }

      MeshRendererComponent.__appendPrimitivesOfMeshComponent(meshComponent, cameraComponent, outPrimitives);
    }

    MeshRendererComponent.__cullSiblingInstances(meshComponents, frustum, scratch, cullTick);

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
   */
  private static __cullSiblingInstances(
    meshComponents: MeshComponent[],
    frustum: CameraComponent['frustum'] | undefined,
    scratch: MeshRendererSortScratch,
    cullTick: number
  ) {
    for (let i = 0; i < meshComponents.length; i++) {
      const meshComponent = meshComponents[i];
      if (!meshComponent._isAlive) {
        continue;
      }
      const mesh = meshComponent.mesh;
      if (mesh === undefined) {
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
        if (visible && frustum != null && sibling.getTagValue('type') !== 'background-assets') {
          visible = frustum.culling(sibling.getMesh());
        }
        if (!visible) {
          MeshRendererComponent.__stampCulledEntity(scratch, entityUID, cullTick);
        }
      }
    }
  }

  private static __stampCulledEntity(scratch: MeshRendererSortScratch, entityUID: EntityUID, cullTick: number) {
    scratch.culledEntityStamp = MeshRendererComponent.__stampEntity(scratch.culledEntityStamp, entityUID, cullTick);
    scratch.culledEntityCount++;
  }

  /**
   * Writes `cullTick` into `stamp[entityUID]`, growing the array up to the largest EntityUID seen so far.
   * @returns The stamp array, which is a new array when it has grown
   */
  private static __stampEntity(stamp: Uint32Array, entityUID: EntityUID, cullTick: number): Uint32Array {
    let result = stamp;
    if (entityUID >= stamp.length) {
      result = new Uint32Array(Math.max(entityUID + 1, stamp.length * 2, 64));
      result.set(stamp);
    }
    result[entityUID] = cullTick;
    return result;
  }

  /**
   * Gets the latest culling result of a render pass for per-instance culling of instanced draw calls.
   * The result stays valid while `sort_$render` reuses its cached primitive list for the render pass.
   * @param renderPass - The render pass
   * @returns The culling state, or undefined if no culling has run for the render pass
   * @internal
   */
  static _getInstanceCullingState(renderPass: RenderPass): InstanceCullingState | undefined {
    const scratch = MeshRendererComponent.__sortScratchMap.get(renderPass);
    if (scratch === undefined || scratch.cullTick === 0) {
      return undefined;
    }
    return scratch;
  }

  /**
   * Appends the primitives of a mesh component to `outPrimitives` and computes the
   * view depth for blended primitives.
   */
  private static __appendPrimitivesOfMeshComponent(
    meshComponent: MeshComponent,
    cameraComponent: CameraComponent,
    outPrimitives: Primitive[]
  ) {
    const mesh = meshComponent.mesh;
    if (mesh === undefined) {
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
  private static __removeDuplicatedPrimitives(primitives: Primitive[], scratch: MeshRendererSortScratch) {
    const length = primitives.length;
    if (length <= 1) {
      return;
    }

    let stamp = scratch.stamp;
    let stampTick = scratch.stampTick + 1;
    if (stampTick === 0xffffffff) {
      // Wrap around: clear the stamps so that old values cannot be mistaken for the current tick.
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
        // Grow the stamp array up to the largest primitive UID seen so far.
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
  private static __comparePrimitives(a: Primitive, b: Primitive) {
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
  private static __createPrimitiveUids(primitives: Primitive[]): ComponentSID[] {
    const primitiveCount = primitives.length;
    const primitiveUids = new Array<ComponentSID>(primitiveCount + 1);
    for (let i = 0; i < primitiveCount; i++) {
      primitiveUids[i] = primitives[i].primitiveUid;
    }
    primitiveUids[primitiveCount] = -1;
    return primitiveUids;
  }

  /** Returns (and lazily creates) the reusable scratch buffers of a render pass. */
  private static __getSortScratch(renderPass: RenderPass): MeshRendererSortScratch {
    let scratch = MeshRendererComponent.__sortScratchMap.get(renderPass);
    if (scratch === undefined) {
      scratch = {
        primitives: [],
        stamp: new Uint32Array(64),
        stampTick: 0,
        culledEntityStamp: new Uint32Array(64),
        handledEntityStamp: new Uint32Array(64),
        meshCullTick: new WeakMap(),
        cullTick: 0,
        culledEntityCount: 0,
        cullingId: 0,
        keyedPrimitives: [],
      };
      MeshRendererComponent.__sortScratchMap.set(renderPass, scratch);
    }
    return scratch;
  }

  /**
   * Common pre-rendering setup method that prepares the rendering strategy.
   * Initializes the rendering strategy if not already set and calls its prerender method.
   */
  static common_$prerender(engine: Engine) {
    const engineUid = engine.objectUID;
    // This runs once per frame, so the strategy is memoized instead of doing a
    // `Map.has` + `Map.get` pair on every frame.
    let strategy = MeshRendererComponent.__prerenderStrategy;
    if (strategy === undefined || MeshRendererComponent.__prerenderStrategyEngineUid !== engineUid) {
      strategy = MeshRendererComponent.__cgApiRenderingStrategyMap.get(engineUid);
      if (strategy === undefined) {
        // Possible if there is no mesh entity in the scene
        const processApproach = engine.engineState.currentProcessApproach;
        this.common_$load({ processApproach, engine });
        strategy = MeshRendererComponent.__cgApiRenderingStrategyMap.get(engineUid);
        if (strategy === undefined) {
          return;
        }
      }
      MeshRendererComponent.__prerenderStrategyEngineUid = engineUid;
      MeshRendererComponent.__prerenderStrategy = strategy;
    }
    // Call common_$prerender of the WebGL/WebGPU rendering strategy
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
    engine,
  }: {
    renderPass: RenderPass;
    renderPassTickCount: Count;
    primitiveUids: PrimitiveUID[];
    displayIdx: Index;
    engine: Engine;
  }): boolean {
    // Call common_$render of WebGLRenderingStrategy
    return MeshRendererComponent.__cgApiRenderingStrategyMap
      .get(engine.objectUID)!
      .common_$render(primitiveUids, renderPass, renderPassTickCount, displayIdx);
  }

  /**
   * Instance-specific render method for this mesh renderer component.
   * Currently empty as rendering is handled by the static common_$render method.
   * @param i - The index of this component in the render queue
   * @param renderPass - The render pass context
   * @param renderPassTickCount - The tick count for this render pass
   */
  $render() {}

  /**
   * Performs a shallow copy of properties from another MeshRendererComponent.
   * Copies cube map settings and contributions without deep cloning the textures.
   * @param component_ - The source component to copy from
   */
  _shallowCopyFrom(component_: Component): void {
    const component = component_ as MeshRendererComponent;

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
  _destroy(): void {
    super._destroy();
    this.__diffuseCubeMap = undefined;
    this.__specularCubeMap = undefined;
  }

  /**
   * Adds the MeshRenderer component functionality to an entity class.
   * This method extends the entity base class with mesh renderer specific methods.
   * @param base - The target entity base class
   * @param _componentClass - The component class to add (unused parameter for type safety)
   * @returns The enhanced entity class with mesh renderer methods
   */
  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class MeshRendererEntity extends (base.constructor as any) {
      getMeshRenderer() {
        return this.getComponentByComponentTID(
          WellKnownComponentTIDs.MeshRendererComponentTID
        ) as MeshRendererComponent;
      }
    }
    applyMixins(base, MeshRendererEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }

  /**
   * Cleans up static resources associated with the specified engine.
   * @param engine - The engine instance to clean up resources for
   * @internal
   */
  static _cleanupForEngine(engine: Engine): void {
    const strategy = MeshRendererComponent.__cgApiRenderingStrategyMap.get(engine.objectUID);
    if (strategy != null) {
      strategy.destroy();
    }
    MeshRendererComponent.__cgApiRenderingStrategyMap.delete(engine.objectUID);
    // Drop the memoized strategy so that a stale instance is never reused.
    if (MeshRendererComponent.__prerenderStrategyEngineUid === engine.objectUID) {
      MeshRendererComponent.__prerenderStrategyEngineUid = -1;
      MeshRendererComponent.__prerenderStrategy = undefined;
    }
  }
}
