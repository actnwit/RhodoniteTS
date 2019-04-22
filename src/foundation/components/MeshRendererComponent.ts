import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import MeshComponent from './MeshComponent';
import WebGLStrategy from '../../webgl/WebGLStrategy';
import { ProcessApproachEnum } from '../definitions/ProcessApproach';
import { ProcessStage } from '../definitions/ProcessStage';
import EntityRepository from '../core/EntityRepository';
import SceneGraphComponent from './SceneGraphComponent';
import WebGLResourceRepository, { VertexHandles } from '../../webgl/WebGLResourceRepository';
import { WellKnownComponentTIDs } from './WellKnownComponentTIDs';
import CameraComponent from './CameraComponent';
import Matrix44 from '../math/Matrix44';
import Accessor from '../memory/Accessor';
import CGAPIResourceRepository from '../renderer/CGAPIResourceRepository';
import MemoryManager from '../core/MemoryManager';
import Config from '../core/Config';
import { BufferUse } from '../definitions/BufferUse';
import { CompositionType } from '../definitions/CompositionType';
import { ComponentType } from '../definitions/ComponentType';
import ModuleManager from '../system/ModuleManager';
import CubeTexture from '../textures/CubeTexture';

export default class MeshRendererComponent extends Component {
  private __meshComponent?: MeshComponent;
  __vertexHandles: Array<VertexHandles> = [];
  static __shaderProgramHandleOfPrimitiveObjectUids: Map<ObjectUID, CGAPIResourceHandle> = new Map()
  private __webglRenderingStrategy?: WebGLStrategy;
  private __sceneGraphComponent?: SceneGraphComponent;
  private __webglModule?: any;
  private static __staticWebglModule?: any;
  public diffuseCubeMap?: CubeTexture;
  public specularCubeMap?: CubeTexture;
  public diffuseCubeMapContribution = 1.0;
  public specularCubeMapContribution = 1.0;
  public rotationOfCubeMap = 0;
  public isVisible = true;

  private static __webglResourceRepository?: WebGLResourceRepository;
  private static __componentRepository: ComponentRepository = ComponentRepository.getInstance();
  private static __instanceIDBufferUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static __webGLStrategy?: WebGLStrategy;
  private static __instanceIdAccessor?: Accessor;
  private static __tmp_indentityMatrix: Matrix44 = Matrix44.identity();
  private static __cameraComponent?: CameraComponent;
  private static __firstOpaqueSid = Component.invalidComponentSID;
  private static __firstTransparentSid = Component.invalidComponentSID;
  private static __manualTransparentSids?: ComponentSID[];

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);

    this.__sceneGraphComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, SceneGraphComponent) as SceneGraphComponent;
    const componentRepository = ComponentRepository.getInstance();
    const cameraComponents  = componentRepository.getComponentsWithType(CameraComponent) as CameraComponent[];

    if (cameraComponents) {
      MeshRendererComponent.__cameraComponent = cameraComponents[0];
    }
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.MeshRendererComponentTID;
  }

  static get firstOpaqueSid() {
    return MeshRendererComponent.__firstOpaqueSid;
  }

  static get firstTranparentSid() {
    return MeshRendererComponent.__firstTransparentSid;
  }

  $create({processApproach}: {
    processApproach: ProcessApproachEnum
  }
    ) {
    if (this.__meshComponent != null) {
      return;
    }
    this.__meshComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, MeshComponent) as MeshComponent;


    const moduleManager = ModuleManager.getInstance();
    const moduleName = 'webgl';
    const webglModule = (moduleManager.getModule(moduleName)! as any);
    this.__webglRenderingStrategy = webglModule.getRenderingStrategy(processApproach);

    this.moveStageTo(ProcessStage.Load);
  }

  $load() {

    this.__webglRenderingStrategy!.$load(this.__meshComponent!);

    if (this.diffuseCubeMap && !this.diffuseCubeMap.startedToLoad) {
      this.diffuseCubeMap.loadTextureImagesAsync();
    }
    if (this.specularCubeMap && !this.specularCubeMap.startedToLoad) {
      this.specularCubeMap.loadTextureImagesAsync();
    }

    this.moveStageTo(ProcessStage.PreRender);

  }

  $prerender() {

    this.__webglRenderingStrategy!.$prerender(this.__meshComponent!, MeshRendererComponent.__instanceIDBufferUid);

    this.moveStageTo(ProcessStage.Render);
  }

  $render() {
    if (this.__webglRenderingStrategy!.$render == null) {
      return;
    }

    const entity = this.__entityRepository.getEntity(this.__entityUid);

    this.__webglRenderingStrategy!.$render!(this.__meshComponent!, this.__sceneGraphComponent!.worldMatrixInner, this.__sceneGraphComponent!.normalMatrixInner,
      entity, this.diffuseCubeMap, this.specularCubeMap);

    if (this.__meshComponent!.weights.length > 0) {
      this.moveStageTo(ProcessStage.PreRender);
    }
  }

  static common_$load({processApproach} : {processApproach: ProcessApproachEnum}) {
    const moduleManager = ModuleManager.getInstance();
    const moduleName = 'webgl';
    const webglModule = (moduleManager.getModule(moduleName)! as any);
    MeshRendererComponent.__staticWebglModule = webglModule;

    // Strategy
    MeshRendererComponent.__webGLStrategy = webglModule.getRenderingStrategy(processApproach);

    // ResourceRepository
    MeshRendererComponent.__webglResourceRepository = webglModule.WebGLResourceRepository.getInstance();

  }

  static common_$prerender(): CGAPIResourceHandle {
    const gl = MeshRendererComponent.__webglResourceRepository!.currentWebGLContextWrapper;

    if (gl == null) {
      throw new Error('No WebGLRenderingContext!');
    }

    MeshRendererComponent.__webGLStrategy!.common_$prerender();

    if (MeshRendererComponent.__isReady()) {
      return 0;
    }

    MeshRendererComponent.__instanceIDBufferUid = MeshRendererComponent.__setupInstanceIDBuffer();

    return MeshRendererComponent.__instanceIDBufferUid;
  }

  private static __isReady() {
    if (MeshRendererComponent.__instanceIDBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      return true;
    } else {
      return false;
    }
  }

  private static __setupInstanceIDBuffer() {
    if (MeshRendererComponent.__instanceIdAccessor == null) {
      const buffer = MemoryManager.getInstance().getBuffer(BufferUse.CPUGeneric);
      const count = Config.maxEntityNumber;
      const bufferView = buffer.takeBufferView({byteLengthToNeed: 4/*byte*/ * count, byteStride: 0, isAoS: false});
      MeshRendererComponent.__instanceIdAccessor = bufferView.takeAccessor({compositionType: CompositionType.Scalar, componentType: ComponentType.Float, count: count});
    }

    const meshComponents = MeshRendererComponent.__componentRepository.getComponentsWithType(MeshComponent);
    if (meshComponents == null) {
      return CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }

    for (var i = 0; i < meshComponents.length; i++) {
      MeshRendererComponent.__instanceIdAccessor!.setScalar(i, meshComponents[i].entityUID, {});
    }

    return MeshRendererComponent.__webglResourceRepository!.createVertexBuffer(MeshRendererComponent.__instanceIdAccessor!);
  }

  static common_$render(){
    MeshRendererComponent.__cameraComponent = MeshRendererComponent.__componentRepository.getComponent(CameraComponent, CameraComponent.main) as CameraComponent;
    let viewMatrix = MeshRendererComponent.__tmp_indentityMatrix;
    let projectionMatrix = MeshRendererComponent.__tmp_indentityMatrix;
    if (MeshRendererComponent.__cameraComponent) {
      viewMatrix = MeshRendererComponent.__cameraComponent.viewMatrix;
      projectionMatrix = MeshRendererComponent.__cameraComponent.projectionMatrix;
    }

    const meshComponents = MeshRendererComponent.__componentRepository.getComponentsWithType(MeshComponent)!;
    const meshComponent = meshComponents[0] as MeshComponent;
    const primitiveNum = meshComponent.getPrimitiveNumber();
    const glw = MeshRendererComponent.__webglResourceRepository!.currentWebGLContextWrapper!;
    for(let i=0; i<primitiveNum; i++) {
      const primitive = meshComponent.getPrimitiveAt(i);
      if (!MeshRendererComponent.__webGLStrategy!.common_$render(primitive, viewMatrix, projectionMatrix)) {
        break;
      }

      MeshRendererComponent.__webGLStrategy!.attachVertexData(i, primitive, glw, MeshRendererComponent.__instanceIDBufferUid);
      MeshRendererComponent.__webGLStrategy!.attatchShaderProgram(primitive.material!);
      MeshRendererComponent.__webGLStrategy!.attachGPUData(primitive);

      const meshComponents = MeshRendererComponent.__componentRepository.getComponentsWithType(MeshComponent)!;
//      glw.drawElementsInstanced(primitive.primitiveMode.index, primitive.indicesAccessor!.elementCount, primitive.indicesAccessor!.componentType.index, primitive.indicesAccessor!.byteOffsetInBuffer, meshComponents.length);
      glw.drawElementsInstanced(primitive.primitiveMode.index, primitive.indicesAccessor!.elementCount, primitive.indicesAccessor!.componentType.index, 0, meshComponents.length);

    }

  }

  static sort_$render(): ComponentSID[] {
    if (MeshRendererComponent.__manualTransparentSids == null) {
      const sortedMeshComponentSids = MeshRendererComponent.sort_$render_inner();

      return sortedMeshComponentSids;
    } else if (MeshRendererComponent.__manualTransparentSids.length === 0) {
      return [];
    } else {
      const sortedMeshComponentSids = MeshRendererComponent.sort_$render_inner(MeshRendererComponent.__manualTransparentSids);

      return sortedMeshComponentSids;
    }

    return [];
  }

  private static sort_$render_inner(transparentMeshComponentSids: ComponentSID[] = []) {
    const meshComponents = ComponentRepository.getInstance().getComponentsWithType(MeshComponent) as MeshComponent[];
    const opaqueMeshComponentSids: ComponentSID[] = [];
    const transparentMeshComponents: MeshComponent[] = [];
    for (let i = 0; i < meshComponents.length; i++) {
      const meshRendererComponent = meshComponents[i].entity.getComponent(MeshRendererComponent) as MeshRendererComponent;
      if (!meshRendererComponent.isVisible) {
        continue;
      }
      if (meshRendererComponent.currentProcessStage === ProcessStage.Render) {
        const meshComponent = meshComponents[i];
        let isBlendTypeMesh = false;
        for (let j = 0; j < meshComponent.getPrimitiveNumber(); j++) {
          const primitive = meshComponent.getPrimitiveAt(j);
          if (primitive.material != null && primitive.material.isBlend()) {
            isBlendTypeMesh = true;
          }
        }
        if (transparentMeshComponentSids.length === 0 && isBlendTypeMesh) {
          transparentMeshComponents.push(meshComponent);
        }
        else {
          opaqueMeshComponentSids.push(meshComponent.componentSID);
        }
        const cameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;
        if (cameraComponent) {
          meshComponent.calcViewDepth(cameraComponent);
        }
      }
    }
    transparentMeshComponents.sort(function (a, b) {
      if (a.viewDepth < b.viewDepth)
        return -1;
      if (a.viewDepth > b.viewDepth)
        return 1;
      return 0;
    });

    if (transparentMeshComponentSids.length === 0) {
      transparentMeshComponentSids = transparentMeshComponents.map((meshComponent) => {
        return meshComponent.componentSID;
      });
    }

    MeshRendererComponent.__firstOpaqueSid = opaqueMeshComponentSids[0];
    MeshRendererComponent.__firstTransparentSid = transparentMeshComponentSids[0];
    const sortedMeshComponentSids = opaqueMeshComponentSids.concat(transparentMeshComponentSids);
    sortedMeshComponentSids.push(Component.invalidComponentSID);
    return sortedMeshComponentSids;
  }

  static set manualTransparentSids(sids: ComponentSID[]) {
    MeshRendererComponent.__manualTransparentSids = sids;
  }
}
ComponentRepository.registerComponentClass(MeshRendererComponent);
