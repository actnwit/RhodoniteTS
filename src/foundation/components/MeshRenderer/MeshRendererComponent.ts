import { ComponentRepository } from '../../core/ComponentRepository';
import { Component } from '../../core/Component';
import { MeshComponent } from '../Mesh/MeshComponent';
import { ProcessApproach, ProcessApproachEnum } from '../../definitions/ProcessApproach';
import { ProcessStage, ProcessStageEnum } from '../../definitions/ProcessStage';
import { applyMixins, EntityRepository } from '../../core/EntityRepository';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import { CameraComponent } from '../Camera/CameraComponent';
import { ModuleManager } from '../../system/ModuleManager';
import { CubeTexture } from '../../textures/CubeTexture';
import { RenderPass } from '../../renderer/RenderPass';
import {
  ComponentSID,
  CGAPIResourceHandle,
  Count,
  Index,
  ObjectUID,
  ComponentTID,
  EntityUID,
  PrimitiveUID,
} from '../../../types/CommonTypes';
import { IEntity } from '../../core/Entity';
import { ComponentToComponentMethods } from '../ComponentTypes';
import {
  isBlend,
  isBlendWithoutZWrite,
  isBlendWithZWrite,
  isTranslucent,
} from '../../geometry/types/GeometryTypes';
import { Primitive } from '../../geometry/Primitive';
import { CGAPIStrategy } from '../../renderer/CGAPIStrategy';
import { RnXR } from '../../../xr/main';
import { TransformComponent } from '../Transform/TransformComponent';
import { CameraControllerComponent } from '../CameraController/CameraControllerComponent';
import { WebGpuStrategyBasic } from '../../../webgpu/WebGpuStrategyBasic';
import { SceneGraphComponent } from '../SceneGraph/SceneGraphComponent';
import { SystemState } from '../../system/SystemState';
import { RenderTargetTextureCube } from '../../textures/RenderTargetTextureCube';

export class MeshRendererComponent extends Component {
  private __diffuseCubeMap?: CubeTexture | RenderTargetTextureCube;
  private __specularCubeMap?: CubeTexture | RenderTargetTextureCube;
  private __sheenCubeMap?: CubeTexture | RenderTargetTextureCube;
  private __diffuseCubeMapContribution = 1.0;
  private __specularCubeMapContribution = 1.0;
  private __rotationOfCubeMap = 0;

  private static __cgApiRenderingStrategy?: CGAPIStrategy;
  public static isDepthMaskTrueForBlendPrimitives = false;
  static __shaderProgramHandleOfPrimitiveObjectUids: Map<ObjectUID, CGAPIResourceHandle> =
    new Map();
  private __updateCount = 0;
  private static __updateCount = 0;
  public static _isFrustumCullingEnabled = true;

  private __fingerPrint = '';

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository,
    isReUse: boolean
  ) {
    super(entityUid, componentSid, entityRepository, isReUse);
    this.calcFingerPrint();
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.MeshRendererComponentTID;
  }

  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.MeshRendererComponentTID;
  }

  get diffuseCubeMap() {
    return this.__diffuseCubeMap;
  }

  get specularCubeMap() {
    return this.__specularCubeMap;
  }

  get sheenCubeMap() {
    return this.__sheenCubeMap;
  }

  get updateCount() {
    return this.__updateCount;
  }

  static get updateCount() {
    return MeshRendererComponent.__updateCount;
  }

  get diffuseCubeMapContribution() {
    return this.__diffuseCubeMapContribution;
  }

  set diffuseCubeMapContribution(contribution: number) {
    this.__diffuseCubeMapContribution = contribution;
    this.__updateCount++;
    MeshRendererComponent.__updateCount++;
  }

  get specularCubeMapContribution() {
    return this.__specularCubeMapContribution;
  }

  set specularCubeMapContribution(contribution: number) {
    this.__specularCubeMapContribution = contribution;
    this.__updateCount++;
    MeshRendererComponent.__updateCount++;
  }

  get rotationOfCubeMap() {
    return this.__rotationOfCubeMap;
  }

  set rotationOfCubeMap(rotation: number) {
    this.__rotationOfCubeMap = rotation;
    this.__updateCount++;
    MeshRendererComponent.__updateCount++;
  }

  calcFingerPrint() {
    this.__fingerPrint = `${this.__diffuseCubeMap != null ? this.__diffuseCubeMap.textureUID : -1} ${this.__specularCubeMap != null ? this.__specularCubeMap.textureUID : -1} ${this.__sheenCubeMap != null ? this.__sheenCubeMap.textureUID : -1}`;
  }

  getFingerPrint() {
    return this.__fingerPrint;
  }

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

    const promises = [];

    if (diffuseCubeTexture instanceof RenderTargetTextureCube) {
      promises.push(
        new Promise<void>((resolve) => {
          diffuseCubeTexture.setIsTextureReady();
          resolve();
        })
      );
    } else {
      promises.push(
        new Promise<void>((resolve) => {
          if (!diffuseCubeTexture.startedToLoad) {
            diffuseCubeTexture.loadTextureImagesAsync().then(() => {
              resolve();
            });
          } else if (diffuseCubeTexture.isTextureReady) {
            resolve();
          } else {
            diffuseCubeTexture.registerOnTextureLoaded(() => {
              resolve();
            });
          }
        })
      );
    }

    if (specularCubeTexture instanceof RenderTargetTextureCube) {
      promises.push(
        new Promise<void>((resolve) => {
          specularCubeTexture.setIsTextureReady();
          resolve();
        })
      );
    } else {
      promises.push(
        new Promise<void>((resolve) => {
          if (!specularCubeTexture.startedToLoad) {
            specularCubeTexture.loadTextureImagesAsync().then(() => {
              resolve();
            });
          } else if (specularCubeTexture.isTextureReady) {
            resolve();
          } else {
            specularCubeTexture.registerOnTextureLoaded(() => {
              resolve();
            });
          }
        })
      );
    }

    if (sheenCubeTexture != null) {
      if (sheenCubeTexture instanceof RenderTargetTextureCube) {
        promises.push(
          new Promise<void>((resolve) => {
            sheenCubeTexture.setIsTextureReady();
            resolve();
          })
        );
      } else {
        promises.push(
          new Promise<void>((resolve) => {
            if (!sheenCubeTexture.startedToLoad) {
              sheenCubeTexture.loadTextureImagesAsync().then(() => {
                resolve();
              });
            } else if (sheenCubeTexture.isTextureReady) {
              resolve();
            } else {
              sheenCubeTexture.registerOnTextureLoaded(() => {
                resolve();
              });
            }
          })
        );
      }
    }

    return Promise.all(promises).then(() => {
      this.__updateCount++;
      MeshRendererComponent.__updateCount++;
    });
  }

  static common_$load({ processApproach }: { processApproach: ProcessApproachEnum }) {
    const moduleManager = ModuleManager.getInstance();

    // Strategy
    if (processApproach === ProcessApproach.WebGPU) {
      const moduleName = 'webgpu';
      const webgpuModule = moduleManager.getModule(moduleName)! as any;
      MeshRendererComponent.__cgApiRenderingStrategy =
        webgpuModule.WebGpuStrategyBasic.getInstance();
      (MeshRendererComponent.__cgApiRenderingStrategy as WebGpuStrategyBasic).common_$load();
    } else {
      const moduleName = 'webgl';
      const webglModule = moduleManager.getModule(moduleName)! as any;
      MeshRendererComponent.__cgApiRenderingStrategy =
        webglModule.getRenderingStrategy(processApproach);
    }
  }

  $load() {
    const ready = MeshRendererComponent.__cgApiRenderingStrategy!.$load(
      this.entity.tryToGetMesh()!
    );
    if (ready) {
      this.moveStageTo(ProcessStage.Unknown);
    }
  }

  static sort_$render(renderPass: RenderPass): ComponentSID[] {
    if (
      TransformComponent.updateCount === renderPass._lastTransformComponentsUpdateCount &&
      CameraControllerComponent.updateCount ===
        renderPass._lastCameraControllerComponentsUpdateCount &&
      SceneGraphComponent.updateCount === renderPass._lastSceneGraphComponentsUpdateCount
    ) {
      return renderPass._lastPrimitiveUids;
    }

    // get CameraComponent
    let cameraComponent = renderPass.cameraComponent;
    // If the renderPass doesn't have a cameraComponent, then we get it of the main camera
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getComponent(
        CameraComponent,
        CameraComponent.current
      ) as CameraComponent;
    }
    if (cameraComponent == null) {
      const cameraComponents = ComponentRepository.getComponentsWithType(
        CameraComponent
      ) as CameraComponent[];
      cameraComponent = cameraComponents.find((c) => c != null && c._isAlive)!;
      CameraComponent.current = cameraComponent.componentSID;
    }
    if (renderPass.isVrRendering) {
      const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
      if (rnXRModule != null) {
        const webxrSystem = rnXRModule.WebXRSystem.getInstance();
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

    const primitiveUids = primitives.map((primitive) => primitive.primitiveUid);
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
    if (_lastOpaqueIndex != renderPass._lastOpaqueIndex) {
      renderPass._lastOpaqueIndex = _lastOpaqueIndex;
      resultChanged ||= true;
    }
    if (_lastTranslucentIndex != renderPass._lastTranslucentIndex) {
      renderPass._lastTranslucentIndex = _lastTranslucentIndex;
      resultChanged ||= true;
    }
    if (_lastBlendWithZWriteIndex != renderPass._lastBlendWithZWriteIndex) {
      renderPass._lastBlendWithZWriteIndex = _lastBlendWithZWriteIndex;
      resultChanged ||= true;
    }
    if (_lastBlendWithoutZWriteIndex != renderPass._lastBlendWithoutZWriteIndex) {
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

    renderPass._lastTransformComponentsUpdateCount = TransformComponent.updateCount;
    renderPass._lastCameraControllerComponentsUpdateCount = CameraControllerComponent.updateCount;
    renderPass._lastSceneGraphComponentsUpdateCount = SceneGraphComponent.updateCount;
    if (resultChanged) {
      renderPass._renderedSomethingBefore = true;
    }

    return primitiveUids;
  }

  private static __cullingWithViewFrustum(
    cameraComponent: CameraComponent,
    meshComponents: MeshComponent[]
  ) {
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
          meshComponent.entity.getTagValue('type') === 'background-assets'
            ? true
            : frustum.culling(meshComponent);
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
        (meshComponent) => meshComponent._isAlive && meshComponent.entity.getSceneGraph().isVisible
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

  static common_$prerender() {
    if (MeshRendererComponent.__cgApiRenderingStrategy == null) {
      // Possible if there is no mesh entity in the scene
      const processApproach = SystemState.currentProcessApproach;
      this.common_$load({ processApproach });
    }
    // Call common_$prerender of WebGLRenderingStrategy
    MeshRendererComponent.__cgApiRenderingStrategy!.prerender();
  }

  static common_$render({
    renderPass,
    processStage,
    renderPassTickCount,
    primitiveUids,
  }: {
    renderPass: RenderPass;
    processStage: ProcessStageEnum;
    renderPassTickCount: Count;
    primitiveUids: PrimitiveUID[];
  }): boolean {
    // Call common_$render of WebGLRenderingStrategy
    return MeshRendererComponent.__cgApiRenderingStrategy!.common_$render(
      primitiveUids,
      renderPass,
      renderPassTickCount
    );
  }

  $render({
    i,
    renderPass,
    renderPassTickCount,
  }: {
    i: Index;
    renderPass: RenderPass;
    renderPassTickCount: Count;
  }) {}

  _shallowCopyFrom(component_: Component): void {
    const component = component_ as MeshRendererComponent;

    this.__diffuseCubeMap = component.__diffuseCubeMap;
    this.__specularCubeMap = component.__specularCubeMap;
    this.diffuseCubeMapContribution = component.diffuseCubeMapContribution;
    this.specularCubeMapContribution = component.specularCubeMapContribution;
    this.rotationOfCubeMap = component.rotationOfCubeMap;
  }

  _destroy(): void {
    super._destroy();
    this.__diffuseCubeMap = undefined;
    this.__specularCubeMap = undefined;
  }

  /**
   * @override
   * Add this component to the entity
   * @param base the target entity
   * @param _componentClass the component class to add
   */
  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class MeshRendererEntity extends (base.constructor as any) {
      constructor(
        entityUID: EntityUID,
        isAlive: boolean,
        components?: Map<ComponentTID, Component>
      ) {
        super(entityUID, isAlive, components);
      }

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
