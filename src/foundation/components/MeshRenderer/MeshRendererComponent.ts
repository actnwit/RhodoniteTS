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
import type { WebGLStrategyDataTexture } from '../../../webgl/WebGLStrategyDataTexture';
import type { WebGLStrategyUniform } from '../../../webgl/WebGLStrategyUniform';
import type { RnWebGL, WebGLStrategy } from '../../../webgl/main';
import type { WebGpuStrategyBasic } from '../../../webgpu/WebGpuStrategyBasic';
import type { RnWebGpu } from '../../../webgpu/main';
import type { RnXR } from '../../../xr/main';
import { Component } from '../../core/Component';
import { ComponentRepository } from '../../core/ComponentRepository';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository, applyMixins } from '../../core/EntityRepository';
import { ProcessApproach, type ProcessApproachEnum } from '../../definitions/ProcessApproach';
import { ProcessStage, type ProcessStageEnum } from '../../definitions/ProcessStage';
import type { Primitive } from '../../geometry/Primitive';
import { isBlend, isBlendWithZWrite, isBlendWithoutZWrite, isTranslucent } from '../../geometry/types/GeometryTypes';
import type { CGAPIStrategy } from '../../renderer/CGAPIStrategy';
import type { RenderPass } from '../../renderer/RenderPass';
import type { Engine } from '../../system/Engine';
import { EngineState } from '../../system/EngineState';
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

  private __fingerPrint = '';

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
  static get componentTID(): ComponentTID {
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
  }

  /**
   * Gets the current fingerprint of this component.
   * @returns The fingerprint string
   */
  getFingerPrint() {
    return this.__fingerPrint;
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
    if (
      TransformComponent.getUpdateCount(engine) === renderPass._lastTransformComponentsUpdateCount &&
      CameraControllerComponent.getUpdateCount(engine) === renderPass._lastCameraControllerComponentsUpdateCount &&
      SceneGraphComponent.getUpdateCount(engine) === renderPass._lastSceneGraphComponentsUpdateCount
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

    // FrustumCulling
    let primitives: Primitive[] = [];
    const meshComponents = renderPass._optimizedMeshComponents;
    primitives = MeshRendererComponent.__cullingWithViewFrustum(cameraComponent, meshComponents);

    // After Frustum Culling, remove duplicated Primitives
    primitives = Array.from(new Set(primitives));

    // Sort by sortkey
    primitives.sort((a, b) => {
      const delta = a._sortkey - b._sortkey;
      if (delta !== 0) {
        return delta;
      }
      return a._viewDepth - b._viewDepth;
    });

    const primitiveUids = primitives.map(primitive => primitive.primitiveUid);
    primitiveUids.push(-1);

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

    renderPass._lastTransformComponentsUpdateCount = TransformComponent.getUpdateCount(engine);
    renderPass._lastCameraControllerComponentsUpdateCount = CameraControllerComponent.getUpdateCount(engine);
    renderPass._lastSceneGraphComponentsUpdateCount = SceneGraphComponent.getUpdateCount(engine);
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
   * @returns Array of primitives that passed the frustum culling test
   */
  private static __cullingWithViewFrustum(cameraComponent: CameraComponent, meshComponents: MeshComponent[]) {
    let filteredMeshComponents: MeshComponent[] = [];
    if (cameraComponent && MeshRendererComponent._isFrustumCullingEnabled) {
      cameraComponent.updateFrustum();

      // const whetherContainsSkeletal = (sg: SceneGraphComponent): boolean => {
      //   const skeletalComponent = sg.entity.tryToGetSkeletal();
      //   if (Is.exist(skeletalComponent)) {
      //     return true;
      //   } else {
      //     const children = sg.children;
      //     for (const child of children) {
      //       return whetherContainsSkeletal(child);
      //     }
      //     return false;
      //   }
      // };

      const frustum = cameraComponent.frustum;
      const frustumCulling = (meshComponent: MeshComponent, outMeshComponents: MeshComponent[]) => {
        const result =
          meshComponent.entity.getTagValue('type') === 'background-assets' ? true : frustum.culling(meshComponent);
        if (result) {
          outMeshComponents.push(meshComponent);
          meshComponent.entity.getSceneGraph()._isCulled = false;
          const skeletal = meshComponent.entity.tryToGetSkeletal();
          if (skeletal !== undefined) {
            skeletal._isCulled = false;
          }
        } else {
          meshComponent.entity.getSceneGraph()._isCulled = true;
          const skeletal = meshComponent.entity.tryToGetSkeletal();
          if (skeletal !== undefined) {
            skeletal._isCulled = true;
          }
        }
      };
      for (const meshComponent of meshComponents) {
        if (meshComponent._isAlive && meshComponent.entity.getSceneGraph().isVisible) {
          frustumCulling(meshComponent, filteredMeshComponents);
        }
      }
    } else {
      filteredMeshComponents = meshComponents.filter(
        meshComponent => meshComponent._isAlive && meshComponent.entity.getSceneGraph().isVisible
      );
    }

    const primitives: Primitive[] = [];
    for (let i = 0; i < filteredMeshComponents.length; i++) {
      const meshComponent = filteredMeshComponents[i];
      const mesh = meshComponent.mesh;
      if (mesh !== undefined) {
        const meshPrimitives = mesh.primitives;
        let isBlendExist = false;
        for (let j = 0; j < meshPrimitives.length; j++) {
          const primitive = meshPrimitives[j];
          primitives.push(primitive);
          if (isBlend(primitive)) {
            isBlendExist = true;
          }
        }
        if (isBlendExist) {
          const viewDepth = meshComponent.calcViewDepth(cameraComponent);
          for (let j = 0; j < meshPrimitives.length; j++) {
            const primitive = meshPrimitives[j];
            primitive._viewDepth = viewDepth;
          }
        }
      }
    }
    return primitives;
  }

  /**
   * Common pre-rendering setup method that prepares the rendering strategy.
   * Initializes the rendering strategy if not already set and calls its prerender method.
   */
  static common_$prerender(engine: Engine) {
    const engineUid = engine.objectUID;
    if (!MeshRendererComponent.__cgApiRenderingStrategyMap.has(engineUid)) {
      // Possible if there is no mesh entity in the scene
      const processApproach = engine.engineState.currentProcessApproach;
      this.common_$load({ processApproach, engine });
    }
    // Call common_$prerender of WebGLRenderingStrategy
    MeshRendererComponent.__cgApiRenderingStrategyMap.get(engineUid)!.prerender();
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
}
