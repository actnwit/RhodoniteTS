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
import { PrimitiveSortKey_BitOffset_TranslucencyType } from '../../geometry/types/GeometryTypes';
import { Primitive } from '../../geometry/Primitive';
import { isSkipDrawing } from '../../renderer/RenderingCommonMethods';
import { CGAPIStrategy } from '../../renderer/CGAPIStrategy';
import { RnXR } from '../../../xr/main';
import { TransformComponent } from '../Transform/TransformComponent';
import { CameraControllerComponent } from '../CameraController/CameraControllerComponent';
import { WebGpuStrategyBasic } from '../../../webgpu/WebGpuStrategyBasic';
import { SceneGraphComponent } from '../SceneGraph/SceneGraphComponent';

export class MeshRendererComponent extends Component {
  private __diffuseCubeMap?: CubeTexture;
  private __specularCubeMap?: CubeTexture;
  public diffuseCubeMapContribution = 1.0;
  public specularCubeMapContribution = 1.0;
  public rotationOfCubeMap = 0;

  private static __cgApiRenderingStrategy?: CGAPIStrategy;
  public static isDepthMaskTrueForTransparencies = false;
  static __shaderProgramHandleOfPrimitiveObjectUids: Map<ObjectUID, CGAPIResourceHandle> =
    new Map();
  public _updateCount = 0;

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository,
    isReUse: boolean
  ) {
    super(entityUid, componentSid, entityRepository, isReUse);
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

  setIBLCubeMap(diffuseCubeTexture: CubeTexture, specularCubeTexture: CubeTexture) {
    if (diffuseCubeTexture == null || specularCubeTexture == null) {
      return;
    }

    this.__diffuseCubeMap = diffuseCubeTexture;
    this.__specularCubeMap = specularCubeTexture;

    const promises = [];
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

    return Promise.all(promises).then(() => {
      this._updateCount++;
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
    const meshComponents = renderPass.meshComponents;
    primitives = MeshRendererComponent.__cullingWithViewFrustum(cameraComponent, meshComponents);

    // After Frustum Culling, remove duplicated Primitives
    primitives = Array.from(new Set(primitives));

    // Sort by sortkey
    primitives.sort((a, b) => {
      const deltaKey = a._sortkey - b._sortkey;
      if (deltaKey === 0) {
        return a._viewDepth - b._viewDepth;
      } else {
        return deltaKey;
      }
    });

    const primitiveUids = primitives.map((primitive) => primitive.primitiveUid);
    primitiveUids.push(-1);

    renderPass._lastOpaqueIndex = primitives.length - 1;
    renderPass._lastTransparentIndex = -1;
    renderPass._firstTransparentSortKey = -1;
    renderPass._lastTransparentSortKey = -1;

    for (let i = 0; i < primitives.length; i++) {
      const primitive = primitives[i];
      const bitOffset = PrimitiveSortKey_BitOffset_TranslucencyType + 1;
      const isTranslucency = (primitive._sortkey >> bitOffset) & 1;
      if (isTranslucency) {
        renderPass._lastOpaqueIndex = i - 1;
        renderPass._firstTransparentSortKey = primitive._sortkey;
        break;
      }
    }

    if (primitives.length > 0) {
      renderPass._lastTransparentIndex = primitives.length - 1;
      renderPass._lastTransparentSortKey = primitives[primitives.length - 1]._sortkey;
    }

    renderPass._lastTransformComponentsUpdateCount = TransformComponent.updateCount;
    renderPass._lastCameraControllerComponentsUpdateCount = CameraControllerComponent.updateCount;
    renderPass._lastPrimitiveUids = primitiveUids;

    return primitiveUids;
  }

  private static __cullingWithViewFrustum(
    cameraComponent: CameraComponent,
    meshComponents: MeshComponent[]
  ) {
    let filteredMeshComponents: MeshComponent[] = [];
    if (cameraComponent) {
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
        if (meshComponent.entity.getSceneGraph().isVisible) {
          frustumCulling(meshComponent, filteredMeshComponents);
        }
      }
    } else {
      filteredMeshComponents = meshComponents.filter(
        (meshComponent) => meshComponent.entity.getSceneGraph().isVisible
      );
    }

    const primitives: Primitive[] = [];
    for (let i = 0; i < filteredMeshComponents.length; i++) {
      const meshComponent = filteredMeshComponents[i];
      const viewDepth = meshComponent.calcViewDepth(cameraComponent);
      const mesh = meshComponent.mesh;
      if (mesh !== undefined) {
        const meshPrimitives = mesh.primitives;
        for (let j = 0; j < meshPrimitives.length; j++) {
          const primitive = meshPrimitives[j];
          if (isSkipDrawing(primitive.material)) {
            // continue;
          }
          primitive._viewDepth = viewDepth;
          primitives.push(primitive);
        }
      }
    }
    return primitives;
  }

  static common_$prerender() {
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
ComponentRepository.registerComponentClass(MeshRendererComponent);
