import {ComponentRepository} from '../../core/ComponentRepository';
import {Component} from '../../core/Component';
import {MeshComponent} from '../Mesh/MeshComponent';
import {WebGLStrategy} from '../../../webgl/WebGLStrategy';
import {ProcessApproachEnum} from '../../definitions/ProcessApproach';
import {ProcessStage, ProcessStageEnum} from '../../definitions/ProcessStage';
import {applyMixins, EntityRepository} from '../../core/EntityRepository';
import {SceneGraphComponent} from '../SceneGraph/SceneGraphComponent';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import {CameraComponent} from '../Camera/CameraComponent';
import {Matrix44} from '../../math/Matrix44';
import {ModuleManager} from '../../system/ModuleManager';
import {CubeTexture} from '../../textures/CubeTexture';
import {RenderPass} from '../../renderer/RenderPass';
import {Visibility} from '../../definitions/Visibility';
import {
  ComponentSID,
  CGAPIResourceHandle,
  Count,
  Index,
  ObjectUID,
  ComponentTID,
  EntityUID,
} from '../../../types/CommonTypes';
import {AbstractMaterialContent} from '../../materials/core/AbstractMaterialContent';
import {IMatrix44} from '../../math/IMatrix';
import {IEntity} from '../../core/Entity';
import {ComponentToComponentMethods} from '../ComponentTypes';
import {Is} from '../../misc/Is';
import {Primitive} from '../../..';
import {PrimitiveSortKey_BitOffset_TranslucencyType} from '../../geometry/types/GeometryTypes';
import WebGLStrategyCommonMethod from '../../../webgl/WebGLStrategyCommonMethod';

export class MeshRendererComponent extends Component {
  private __meshComponent?: MeshComponent;
  static __shaderProgramHandleOfPrimitiveObjectUids: Map<
    ObjectUID,
    CGAPIResourceHandle
  > = new Map();
  public diffuseCubeMap?: CubeTexture;
  public specularCubeMap?: CubeTexture;
  public diffuseCubeMapContribution = 1.0;
  public specularCubeMapContribution = 1.0;
  public rotationOfCubeMap = 0;

  private static __webglRenderingStrategy?: WebGLStrategy;
  private static __tmp_identityMatrix: IMatrix44 = Matrix44.identity();
  private static __firstTransparentIndex = -1;
  private static __lastTransparentIndex = -1;
  private static __manualTransparentSids?: ComponentSID[];
  public _readyForRendering = false;
  public static isViewFrustumCullingEnabled = true;
  public static isDepthMaskTrueForTransparencies = false;

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository
  ) {
    super(entityUid, componentSid, entityRepository);
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.MeshRendererComponentTID;
  }

  static get firstTransparentIndex() {
    return MeshRendererComponent.__firstTransparentIndex;
  }

  static get lastTransparentIndex() {
    return MeshRendererComponent.__lastTransparentIndex;
  }

  $create() {
    this.__meshComponent = EntityRepository.getComponentOfEntity(
      this.__entityUid,
      MeshComponent
    ) as MeshComponent;
    this.moveStageTo(ProcessStage.Load);
  }

  static common_$load({
    processApproach,
  }: {
    processApproach: ProcessApproachEnum;
  }) {
    const moduleManager = ModuleManager.getInstance();
    const moduleName = 'webgl';
    const webglModule = moduleManager.getModule(moduleName)! as any;

    // Strategy
    MeshRendererComponent.__webglRenderingStrategy =
      webglModule.getRenderingStrategy(processApproach);

    AbstractMaterialContent.initDefaultTextures();
  }

  $load() {
    MeshRendererComponent.__webglRenderingStrategy!.$load(
      this.__meshComponent!
    );

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
    const sceneGraphComponents = renderPass.sceneTopLevelGraphComponents!;
    primitives = MeshRendererComponent.__cullingWithViewFrustum(
      cameraComponent,
      sceneGraphComponents,
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

    const primitiveUids = primitives.map(primitive => primitive.primitiveUid);
    primitiveUids.push(-1);

    MeshRendererComponent.__firstTransparentIndex = -1;
    for (let i = 0; i < primitives.length; i++) {
      const primitive = primitives[i];
      const bitOffset = PrimitiveSortKey_BitOffset_TranslucencyType + 1;
      const isTranslucency = (primitive._sortkey >> bitOffset) & 1;
      if (isTranslucency) {
        MeshRendererComponent.__firstTransparentIndex = primitive._sortkey;
        break;
      }
    }

    if (primitives.length > 1) {
      MeshRendererComponent.__lastTransparentIndex =
        primitives[primitives.length - 1]._sortkey;
    }

    return primitiveUids;
  }

  private static __cullingWithViewFrustum(
    cameraComponent: CameraComponent,
    sceneGraphComponents: SceneGraphComponent[],
    renderPass: RenderPass
  ) {
    let meshComponents: MeshComponent[] = [];
    if (cameraComponent && MeshRendererComponent.isViewFrustumCullingEnabled) {
      cameraComponent.updateFrustum();

      const whetherContainsSkeletal = (sg: SceneGraphComponent): boolean => {
        const skeletalComponent = sg.entity.tryToGetSkeletal();
        if (Is.exist(skeletalComponent)) {
          return true;
        } else {
          const children = sg.children;
          for (const child of children) {
            return whetherContainsSkeletal(child);
          }
          return false;
        }
      };

      const frustum = cameraComponent.frustum;
      const doAsVisible = (
        sg: SceneGraphComponent,
        meshComponents: MeshComponent[]
      ) => {
        const sgs = SceneGraphComponent.flattenHierarchy(sg, false);
        for (const sg of sgs) {
          const mesh = sg.entity.tryToGetMesh();
          if (mesh) {
            meshComponents!.push(mesh);
          }
        }
      };
      const frustumCullingRecursively = (
        sg: SceneGraphComponent,
        meshComponents: MeshComponent[]
      ) => {
        const result = frustum.culling(sg);
        if (result === Visibility.Visible) {
          doAsVisible(sg, meshComponents);
        } else if (
          result === Visibility.Neutral ||
          whetherContainsSkeletal(sg)
        ) {
          const children = sg.children;
          const mesh = sg.entity.tryToGetMesh();
          if (mesh) {
            meshComponents.push(mesh);
          }
          for (const child of children) {
            frustumCullingRecursively(child, meshComponents);
          }
        }
      };

      for (const tlsg of sceneGraphComponents) {
        frustumCullingRecursively(tlsg, meshComponents);
      }
    } else {
      meshComponents = renderPass!.meshComponents!;
    }

    const primitives: Primitive[] = [];
    for (let i = 0; i < meshComponents.length; i++) {
      const meshComponent = meshComponents[i];
      const viewDepth = meshComponent.calcViewDepth(cameraComponent);
      const mesh = meshComponent.mesh;
      if (mesh !== undefined) {
        const meshPrimitives = mesh.primitives;
        for (let j = 0; j < meshPrimitives.length; j++) {
          const primitive = meshPrimitives[j];
          if (WebGLStrategyCommonMethod.isSkipDrawing(primitive.material)) {
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
    let cameraComponent = renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent =
        ComponentRepository.getComponent(
          CameraComponent,
          CameraComponent.current
        ) as CameraComponent;
    }
    let viewMatrix = MeshRendererComponent.__tmp_identityMatrix;
    let projectionMatrix = MeshRendererComponent.__tmp_identityMatrix;
    if (cameraComponent != null) {
      viewMatrix = cameraComponent.viewMatrix;
      projectionMatrix = cameraComponent.projectionMatrix;
    }

    // Call common_$render of WebGLRenderingStrategy
    const primitiveUids =
      Component.__componentsOfProcessStages.get(processStage)!;
    const meshComponents = ComponentRepository._getComponents(
      MeshComponent
    ) as MeshComponent[];
    MeshRendererComponent.__webglRenderingStrategy!.common_$render(
      primitiveUids,
      meshComponents,
      viewMatrix,
      projectionMatrix,
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

  /**
   * @override
   * Add this component to the entity
   * @param base the target entity
   * @param _componentClass the component class to add
   */
  addThisComponentToEntity<
    EntityBase extends IEntity,
    SomeComponentClass extends typeof Component
  >(base: EntityBase, _componentClass: SomeComponentClass) {
    class MeshRendererEntity extends (base.constructor as any) {
      constructor(
        entityUID: EntityUID,
        isAlive: Boolean,
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
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> &
      EntityBase;
  }
}
ComponentRepository.registerComponentClass(MeshRendererComponent);
