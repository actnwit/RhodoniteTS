import ComponentRepository from '../../core/ComponentRepository';
import Component from '../../core/Component';
import MeshComponent from '../Mesh/MeshComponent';
import WebGLStrategy from '../../../webgl/WebGLStrategy';
import {ProcessApproachEnum} from '../../definitions/ProcessApproach';
import {ProcessStage, ProcessStageEnum} from '../../definitions/ProcessStage';
import EntityRepository, { applyMixins } from '../../core/EntityRepository';
import SceneGraphComponent from '../SceneGraph/SceneGraphComponent';
import WebGLResourceRepository from '../../../webgl/WebGLResourceRepository';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import CameraComponent from '../Camera/CameraComponent';
import Matrix44 from '../../math/Matrix44';
import Accessor from '../../memory/Accessor';
import CGAPIResourceRepository from '../../renderer/CGAPIResourceRepository';
import MemoryManager from '../../core/MemoryManager';
import Config from '../../core/Config';
import {BufferUse} from '../../definitions/BufferUse';
import {CompositionType} from '../../definitions/CompositionType';
import {ComponentType} from '../../definitions/ComponentType';
import ModuleManager from '../../system/ModuleManager';
import CubeTexture from '../../textures/CubeTexture';
import RenderPass from '../../renderer/RenderPass';
import {Visibility} from '../../definitions/visibility';
import RnObject from '../../core/RnObject';
import {
  ComponentSID,
  CGAPIResourceHandle,
  Count,
  Index,
  ObjectUID,
  ComponentTID,
  EntityUID,
} from '../../../types/CommonTypes';
import AbstractMaterialNode from '../../materials/core/AbstractMaterialNode';
import {IMatrix44} from '../../math/IMatrix';
import { IMeshEntity, ISkeletalEntity } from '../../helpers/EntityHelper';
import { IEntity } from '../../core/Entity';
import { ComponentToComponentMethods } from '../ComponentTypes';
import { Is } from '../../misc/Is';

export default class MeshRendererComponent extends Component {
  private __meshComponent?: MeshComponent;
  static __shaderProgramHandleOfPrimitiveObjectUids: Map<
    ObjectUID,
    CGAPIResourceHandle
  > = new Map();
  private __sceneGraphComponent?: SceneGraphComponent;
  public diffuseCubeMap?: CubeTexture;
  public specularCubeMap?: CubeTexture;
  public diffuseCubeMapContribution = 1.0;
  public specularCubeMapContribution = 1.0;
  public rotationOfCubeMap = 0;

  private static __webglResourceRepository?: WebGLResourceRepository;
  private static __componentRepository: ComponentRepository =
    ComponentRepository.getInstance();
  private static __instanceIDBufferUid: CGAPIResourceHandle =
    CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static __webglRenderingStrategy?: WebGLStrategy;
  private static __instanceIdAccessor?: Accessor;
  private static __tmp_identityMatrix: IMatrix44 = Matrix44.identity();
  private static __cameraComponent?: CameraComponent;
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

    this.__sceneGraphComponent = this.__entityRepository.getComponentOfEntity(
      this.__entityUid,
      SceneGraphComponent
    ) as SceneGraphComponent;
    const componentRepository = ComponentRepository.getInstance();
    const cameraComponents = componentRepository.getComponentsWithType(
      CameraComponent
    ) as CameraComponent[];

    if (cameraComponents) {
      MeshRendererComponent.__cameraComponent = cameraComponents[0];
    }
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

  private static __isReady() {
    if (
      MeshRendererComponent.__instanceIDBufferUid !==
      CGAPIResourceRepository.InvalidCGAPIResourceUid
    ) {
      return true;
    } else {
      return false;
    }
  }

  private static __setupInstanceIDBuffer() {
    if (MeshRendererComponent.__instanceIdAccessor == null) {
      const buffer = MemoryManager.getInstance().createOrGetBuffer(
        BufferUse.CPUGeneric
      );
      const count = Config.maxEntityNumber;
      const bufferView = buffer.takeBufferView({
        byteLengthToNeed: 4 /*byte*/ * count,
        byteStride: 0,
      });
      MeshRendererComponent.__instanceIdAccessor = bufferView.takeAccessor({
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Float,
        count: count,
      });
    }

    const meshComponents =
      MeshRendererComponent.__componentRepository.getComponentsWithType(
        MeshComponent
      );
    if (meshComponents == null) {
      return CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }

    for (let i = 0; i < meshComponents.length; i++) {
      MeshRendererComponent.__instanceIdAccessor!.setScalar(
        i,
        meshComponents[i].entityUID,
        {}
      );
    }

    return MeshRendererComponent.__webglResourceRepository!.createVertexBuffer(
      MeshRendererComponent.__instanceIdAccessor!
    );
  }

  static set manualTransparentSids(sids: ComponentSID[]) {
    MeshRendererComponent.__manualTransparentSids = sids;
  }

  static set manualTransparentEntityNames(names: string[]) {
    MeshRendererComponent.__manualTransparentSids = [];
    for (const name of names) {
      const entity = RnObject.getRnObjectByName(name) as unknown as IMeshEntity;
      if (entity) {
        const meshComponent = entity.tryToGetMesh();
        if (meshComponent) {
          const mesh = meshComponent.mesh;
          if (mesh) {
            if (!mesh.isOpaque()) {
              MeshRendererComponent.__manualTransparentSids.push(
                meshComponent.componentSID
              );
            }
          }
        }
      }
    }
  }

  $create() {
    this.__meshComponent = this.__entityRepository.getComponentOfEntity(
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

    // ResourceRepository
    MeshRendererComponent.__webglResourceRepository =
      webglModule.WebGLResourceRepository.getInstance();

    AbstractMaterialNode.initDefaultTextures();
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

    this.moveStageTo(ProcessStage.PreRender);
  }

  static common_$prerender(): CGAPIResourceHandle {
    const gl =
      MeshRendererComponent.__webglResourceRepository!
        .currentWebGLContextWrapper;

    if (gl == null) {
      throw new Error('No WebGLRenderingContext!');
    }

    MeshRendererComponent.__webglRenderingStrategy!.common_$prerender();

    if (MeshRendererComponent.__isReady()) {
      return 0;
    }

    MeshRendererComponent.__instanceIDBufferUid =
      MeshRendererComponent.__setupInstanceIDBuffer();

    return MeshRendererComponent.__instanceIDBufferUid;
  }

  $prerender() {
    MeshRendererComponent.__webglRenderingStrategy!.$prerender(
      this.__meshComponent!,
      this,
      MeshRendererComponent.__instanceIDBufferUid
    );

    this.moveStageTo(ProcessStage.Render);
  }

  static sort_$render(renderPass: RenderPass): ComponentSID[] {
    if (MeshRendererComponent.__manualTransparentSids == null) {
      const sortedMeshComponentSids = MeshRendererComponent.sort_$render_inner(
        void 0,
        renderPass
      );
      // const sortedMeshComponentSids = MeshRendererComponent.sort_$render_inner();

      return sortedMeshComponentSids;
    } else {
      const sortedMeshComponentSids = MeshRendererComponent.sort_$render_inner(
        MeshRendererComponent.__manualTransparentSids,
        renderPass
      );
      // const sortedMeshComponentSids = MeshRendererComponent.sort_$render_inner(MeshRendererComponent.__manualTransparentSids);

      return sortedMeshComponentSids;
    }
  }

  private static sort_$render_inner(
    transparentMeshComponentSids_: ComponentSID[] = [],
    renderPass: RenderPass
  ) {
    const sceneGraphComponents = renderPass.sceneTopLevelGraphComponents!;

    let meshComponents: MeshComponent[] = [];
    const componentRepository = ComponentRepository.getInstance();
    let cameraComponent = renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = componentRepository.getComponent(
        CameraComponent,
        CameraComponent.main
      ) as CameraComponent;
    }
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

    meshComponents = Array.from(new Set(meshComponents));

    const opaqueAndTransparentPartiallyMeshComponentSids: ComponentSID[] = [];
    const transparentPartiallyMeshComponents: MeshComponent[] = [];
    const transparentCompletelyMeshComponents: MeshComponent[] = [];

    for (let i = 0; i < meshComponents.length; i++) {
      if (!meshComponents[i].entity.getSceneGraph()!.isVisible) {
        continue;
      }
      const meshRendererComponent = meshComponents[i].entity.tryToGetMeshRenderer()!;
      if (meshRendererComponent.currentProcessStage === ProcessStage.Render) {
        const meshComponent = meshComponents[i];
        if (meshComponent.mesh) {
          if (
            transparentMeshComponentSids_.length === 0 &&
            meshComponent.mesh.isBlendPartially()
          ) {
            transparentPartiallyMeshComponents.push(meshComponent);
            opaqueAndTransparentPartiallyMeshComponentSids.push(
              meshComponent.componentSID
            );
          } else if (
            transparentMeshComponentSids_.length === 0 &&
            meshComponent.mesh.isAllBlend()
          ) {
            transparentCompletelyMeshComponents.push(meshComponent);
          }

          if (meshComponent.mesh.isOpaque()) {
            opaqueAndTransparentPartiallyMeshComponentSids.push(
              meshComponent.componentSID
            );
          } else {
            if (cameraComponent) {
              meshComponent.calcViewDepth(cameraComponent);
            }
          }
        }
      }
    }

    // Sort transparent meshes
    const transparentPartiallyOrAllMeshComponents =
      transparentPartiallyMeshComponents.concat(
        transparentCompletelyMeshComponents
      );
    transparentPartiallyOrAllMeshComponents.sort((a, b) => {
      return a.viewDepth - b.viewDepth;
    });

    let transparentMeshComponentSids;
    if (transparentMeshComponentSids_.length === 0) {
      transparentMeshComponentSids =
        transparentPartiallyOrAllMeshComponents.map(meshComponent => {
          return meshComponent.componentSID;
        });
    } else {
      transparentMeshComponentSids = transparentMeshComponentSids_;
    }

    MeshRendererComponent.__firstTransparentIndex =
      opaqueAndTransparentPartiallyMeshComponentSids.length;

    // Concat opaque and transparent meshes
    const sortedMeshComponentSids =
      opaqueAndTransparentPartiallyMeshComponentSids.concat(
        transparentMeshComponentSids
      );

    MeshRendererComponent.__lastTransparentIndex =
      sortedMeshComponentSids.length - 1;

    // Add terminator
    sortedMeshComponentSids.push(Component.invalidComponentSID);

    return sortedMeshComponentSids;
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
    MeshRendererComponent.__cameraComponent = renderPass.cameraComponent;
    if (MeshRendererComponent.__cameraComponent == null) {
      MeshRendererComponent.__cameraComponent =
        MeshRendererComponent.__componentRepository.getComponent(
          CameraComponent,
          CameraComponent.main
        ) as CameraComponent;
    }
    let viewMatrix = MeshRendererComponent.__tmp_identityMatrix;
    let projectionMatrix = MeshRendererComponent.__tmp_identityMatrix;
    if (MeshRendererComponent.__cameraComponent) {
      viewMatrix = MeshRendererComponent.__cameraComponent.viewMatrix;
      projectionMatrix =
        MeshRendererComponent.__cameraComponent.projectionMatrix;
    }

    const meshComponentSids =
      Component.__componentsOfProcessStages.get(processStage)!;
    const meshComponents =
      MeshRendererComponent.__componentRepository._getComponents(
        MeshComponent
      ) as MeshComponent[];
    MeshRendererComponent.__webglRenderingStrategy!.common_$render(
      meshComponentSids,
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
  }) {
    if (MeshRendererComponent.__webglRenderingStrategy!.$render == null) {
      return;
    }

    const entity = this.__entityRepository.getEntity(
      this.__entityUid
    ) as IMeshEntity;

    MeshRendererComponent.__webglRenderingStrategy!.$render!(
      i,
      this.__meshComponent!,
      this.__sceneGraphComponent!.worldMatrixInner,
      this.__sceneGraphComponent!.normalMatrixInner,
      entity,
      renderPass,
      renderPassTickCount,
      this.diffuseCubeMap,
      this.specularCubeMap
    );

    if (this.__meshComponent!.mesh) {
      if (this.__meshComponent!.mesh.weights.length > 0) {
        this.moveStageTo(ProcessStage.PreRender);
      }
    } else {
      MeshComponent.alertNoMeshSet(this.__meshComponent!);
    }
  }

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
