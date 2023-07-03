import { ComponentRepository } from '../../core/ComponentRepository';
import { Component } from '../../core/Component';
import { MeshComponent } from '../Mesh/MeshComponent';
import { ProcessApproachEnum } from '../../definitions/ProcessApproach';
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
} from '../../../types/CommonTypes';
import { IEntity } from '../../core/Entity';
import { ComponentToComponentMethods } from '../ComponentTypes';
import { PrimitiveSortKey_BitOffset_TranslucencyType } from '../../geometry/types/GeometryTypes';
import { Primitive } from '../../geometry/Primitive';
import { isSkipDrawing } from '../../renderer/RenderingCommonMethods';
import { CGAPIStrategy } from '../../renderer/CGAPIStrategy';

export class MeshRendererComponent extends Component {
  public diffuseCubeMap?: CubeTexture;
  public specularCubeMap?: CubeTexture;
  public diffuseCubeMapContribution = 1.0;
  public specularCubeMapContribution = 1.0;
  public rotationOfCubeMap = 0;
  public _readyForRendering = false;
  private __meshComponent?: MeshComponent;

  private static __webglRenderingStrategy?: CGAPIStrategy;
  public static _lastOpaqueIndex = -1;
  public static _lastTransparentIndex = -1;
  public static _firstTransparentSortKey = -1;
  public static _lastTransparentSortKey = -1;
  public static isViewFrustumCullingEnabled = true;
  public static isDepthMaskTrueForTransparencies = false;
  static __shaderProgramHandleOfPrimitiveObjectUids: Map<ObjectUID, CGAPIResourceHandle> =
    new Map();

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

  $create() {
    this.__meshComponent = EntityRepository.getComponentOfEntity(
      this.__entityUid,
      MeshComponent
    ) as MeshComponent;
    this.moveStageTo(ProcessStage.Load);
  }

  static common_$load({ processApproach }: { processApproach: ProcessApproachEnum }) {
    const moduleManager = ModuleManager.getInstance();
    const moduleName = 'webgl';
    const webglModule = moduleManager.getModule(moduleName)! as any;

    // Strategy
    MeshRendererComponent.__webglRenderingStrategy =
      webglModule.getRenderingStrategy(processApproach);
  }

  $load() {
    MeshRendererComponent.__webglRenderingStrategy!.$load(this.__meshComponent!);

    if (this.diffuseCubeMap && !this.diffuseCubeMap.startedToLoad) {
      this.diffuseCubeMap.loadTextureImagesAsync();
    }
    if (this.specularCubeMap && !this.specularCubeMap.startedToLoad) {
      this.specularCubeMap.loadTextureImagesAsync();
    }

    // this.moveStageTo(ProcessStage.PreRender);
  }

  static common_$prerender() {
    MeshRendererComponent.__webglRenderingStrategy!.common_$prerender();

    return;
  }

  // $prerender() {
  // }

  static sort_$render(renderPass: RenderPass): ComponentSID[] {
    const primitiveUids = MeshRendererComponent.sort_$render_inner(renderPass);
    return primitiveUids;
  }

  private static sort_$render_inner(renderPass: RenderPass) {
    // get CameraComponent
    let cameraComponent = renderPass.cameraComponent;
    // If the renderPass doesn't have a cameraComponent, then we get it of the main camera
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getComponent(
        CameraComponent,
        CameraComponent.current
      ) as CameraComponent;
    }

    // FrustumCulling
    let primitives: Primitive[] = [];
    const meshComponents = renderPass.meshComponents;
    primitives = MeshRendererComponent.__cullingWithViewFrustum(
      cameraComponent,
      meshComponents,
      renderPass
    );

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

    MeshRendererComponent._lastOpaqueIndex = primitives.length - 1;
    MeshRendererComponent._lastTransparentIndex = -1;
    MeshRendererComponent._firstTransparentSortKey = -1;
    MeshRendererComponent._lastTransparentSortKey = -1;
    for (let i = 0; i < primitives.length; i++) {
      const primitive = primitives[i];
      const bitOffset = PrimitiveSortKey_BitOffset_TranslucencyType + 1;
      const isTranslucency = (primitive._sortkey >> bitOffset) & 1;
      if (isTranslucency) {
        MeshRendererComponent._lastOpaqueIndex = i - 1;
        MeshRendererComponent._firstTransparentSortKey = primitive._sortkey;
        break;
      }
    }

    if (primitives.length > 0) {
      MeshRendererComponent._lastTransparentIndex = primitives.length - 1;
      MeshRendererComponent._lastTransparentSortKey = primitives[primitives.length - 1]._sortkey;
    }

    return primitiveUids;
  }

  private static __cullingWithViewFrustum(
    cameraComponent: CameraComponent,
    meshComponents: MeshComponent[],
    renderPass: RenderPass
  ) {
    let filteredMeshComponents: MeshComponent[] = [];
    if (cameraComponent && MeshRendererComponent.isViewFrustumCullingEnabled) {
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
        frustumCulling(meshComponent, filteredMeshComponents);
      }
    } else {
      filteredMeshComponents = renderPass!.meshComponents!;
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

  static common_$render({
    renderPass,
    processStage,
    renderPassTickCount,
  }: {
    renderPass: RenderPass;
    processStage: ProcessStageEnum;
    renderPassTickCount: Count;
  }) {
    // Call common_$render of WebGLRenderingStrategy
    const primitiveUids = Component.__componentsOfProcessStages.get(processStage)!;
    MeshRendererComponent.__webglRenderingStrategy!.common_$render(
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

    this.diffuseCubeMap = component.diffuseCubeMap;
    this.specularCubeMap = component.specularCubeMap;
    this.diffuseCubeMapContribution = component.diffuseCubeMapContribution;
    this.specularCubeMapContribution = component.specularCubeMapContribution;
    this.rotationOfCubeMap = component.rotationOfCubeMap;
    this._readyForRendering = component._readyForRendering;
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
