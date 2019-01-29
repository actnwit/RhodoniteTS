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
import RowMajarMatrix44 from '../math/RowMajarMatrix44';
import Matrix44 from '../math/Matrix44';
import Accessor from '../memory/Accessor';
import CGAPIResourceRepository from '../renderer/CGAPIResourceRepository';
import MemoryManager from '../core/MemoryManager';
import Config from '../core/Config';
import { BufferUse } from '../definitions/BufferUse';
import { CompositionType } from '../definitions/CompositionType';
import { ComponentType } from '../definitions/ComponentType';
import getRenderingStrategy from '../../webgl/getRenderingStrategy';

export default class MeshRendererComponent extends Component {
  private __meshComponent?: MeshComponent;
  __vertexHandles: Array<VertexHandles> = [];
  static __shaderProgramHandleOfPrimitiveObjectUids: Map<ObjectUID, CGAPIResourceHandle> = new Map()
  private __webglRenderingStrategy?: WebGLStrategy;
  private __sceneGraphComponent?: SceneGraphComponent;
  private __cameraComponent?: CameraComponent;


  private static __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private static __componentRepository: ComponentRepository = ComponentRepository.getInstance();
  private static __instanceIDBufferUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static __webGLStrategy?: WebGLStrategy;
  private static __instanceIdAccessor?: Accessor;
  private static __tmp_indentityMatrix: Matrix44 = Matrix44.identity();
  private static __cameraComponent?: CameraComponent;

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);
    this.__currentProcessStage = ProcessStage.Create;

    let count = Component.__lengthOfArrayOfProcessStages.get(ProcessStage.Create)!;
    const array: Int32Array = Component.__componentsOfProcessStages.get(ProcessStage.Create)!;
    array[count++] = this.componentSID;
    array[count] = Component.invalidComponentSID;
    Component.__lengthOfArrayOfProcessStages.set(ProcessStage.Create, count)!;

    this.__sceneGraphComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, SceneGraphComponent) as SceneGraphComponent;
    const componentRepository = ComponentRepository.getInstance();
    const cameraComponents  = componentRepository.getComponentsWithType(CameraComponent) as CameraComponent[];

    if (cameraComponents) {
      this.__cameraComponent = cameraComponents[0];
    }
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.MeshRendererComponentTID;
  }

  private __isLoaded(index: Index) {
    if (this.__vertexHandles[index] != null) {
      return true;
    } else {
      return false
    }
  }

  $create({strategy}: {
    strategy: WebGLStrategy}
    ) {
    if (this.__meshComponent != null) {
      return;
    }
    this.__meshComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, MeshComponent) as MeshComponent;

    this.__webglRenderingStrategy = strategy;

    this.moveStageTo(ProcessStage.Load);
  }

  $load() {
    this.__webglRenderingStrategy!.$load(this.__meshComponent!);
    this.moveStageTo(ProcessStage.PreRender);
  }

  $prerender(
    {processApproech}:{
      processApproech: ProcessApproachEnum,
    }) {

    this.__webglRenderingStrategy!.$prerender(this.__meshComponent!, MeshRendererComponent.__instanceIDBufferUid);

    if (this.__webglRenderingStrategy!.$render != null) {
      this.moveStageTo(ProcessStage.Render);
    }
  }

  $render() {
    if (this.__webglRenderingStrategy!.$render == null) {
      return;
    }

    const entity = this.__entityRepository.getEntity(this.__entityUid);

    const primitiveNum = this.__meshComponent!.getPrimitiveNumber();
    for(let i=0; i<primitiveNum; i++) {
      const primitive = this.__meshComponent!.getPrimitiveAt(i);
      this.__webglRenderingStrategy!.$render!(i, primitive, this.__sceneGraphComponent!.worldMatrix, this.__sceneGraphComponent!.normalMatrix, entity);
    }
  }

  static common_$load(processApproach: ProcessApproachEnum) {

    // Strategy
    MeshRendererComponent.__webGLStrategy = getRenderingStrategy(processApproach);

    // Shader setup
    MeshRendererComponent.__webGLStrategy!.setupShaderProgram();

  }

  static common_$prerender(): CGAPIResourceHandle {
    const gl = MeshRendererComponent.__webglResourceRepository.currentWebGLContextWrapper;

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
      MeshRendererComponent.__instanceIdAccessor!.setScalar(i, meshComponents[i].entityUID);
    }

    return MeshRendererComponent.__webglResourceRepository.createVertexBuffer(MeshRendererComponent.__instanceIdAccessor!);
  }

  static common_$render(){
    MeshRendererComponent.__cameraComponent = MeshRendererComponent.__componentRepository.getComponent(CameraComponent, CameraComponent.main) as CameraComponent;
    let viewMatrix = MeshRendererComponent.__tmp_indentityMatrix;
    let projectionMatrix = MeshRendererComponent.__tmp_indentityMatrix;
    if (MeshRendererComponent.__cameraComponent) {
      viewMatrix = MeshRendererComponent.__cameraComponent.viewMatrix;
      projectionMatrix = MeshRendererComponent.__cameraComponent.projectionMatrix;
    }
    if (!MeshRendererComponent.__webGLStrategy!.common_$render(viewMatrix, projectionMatrix)) {
      return;
    }

    const meshComponents = MeshRendererComponent.__componentRepository.getComponentsWithType(MeshComponent)!;
    const meshComponent = meshComponents[0] as MeshComponent;
    const primitiveNum = meshComponent.getPrimitiveNumber();
    const glw = MeshRendererComponent.__webglResourceRepository.currentWebGLContextWrapper!;
    for(let i=0; i<primitiveNum; i++) {
      const primitive = meshComponent.getPrimitiveAt(i);

      MeshRendererComponent.__webGLStrategy!.attachVertexData(i, primitive, glw, MeshRendererComponent.__instanceIDBufferUid);
      MeshRendererComponent.__webGLStrategy!.attatchShaderProgram();
      MeshRendererComponent.__webGLStrategy!.attachGPUData();

      const meshComponents = MeshRendererComponent.__componentRepository.getComponentsWithType(MeshComponent)!;
//      glw.drawElementsInstanced(primitive.primitiveMode.index, primitive.indicesAccessor!.elementCount, primitive.indicesAccessor!.componentType.index, primitive.indicesAccessor!.byteOffsetInBuffer, meshComponents.length);
      glw.drawElementsInstanced(primitive.primitiveMode.index, primitive.indicesAccessor!.elementCount, primitive.indicesAccessor!.componentType.index, 0, meshComponents.length);

    }

  }
}
ComponentRepository.registerComponentClass(MeshRendererComponent);
