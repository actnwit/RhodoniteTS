import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import MeshComponent from './MeshComponent';
import WebGLResourceRepository, { VertexHandles } from '../renderer/webgl/WebGLResourceRepository';
import GLSLShader from '../renderer/webgl/GLSLShader';
import RenderingPipeline from '../renderer/RenderingPipeline';
import Primitive from '../geometry/Primitive';
import WebGLStrategy from '../renderer/webgl/WebGLStrategy';
import getRenderingStrategy from '../renderer/webgl/getRenderingStrategy';
import { ProcessApproachEnum } from '../definitions/ProcessApproach';
import { ProcessStage } from '../definitions/ProcessStage';
import EntityRepository from '../core/EntityRepository';

export default class MeshRendererComponent extends Component {
  private __meshComponent?: MeshComponent;
  __vertexHandles: Array<VertexHandles> = [];
  static __shaderProgramHandleOfPrimitiveObjectUids: Map<ObjectUID, CGAPIResourceHandle> = new Map()
  private __webglRenderingStrategy?: WebGLStrategy;

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository) {
    super(entityUid, componentSid, entityComponent);
    this.__currentProcessStage = ProcessStage.Create;

    let count = Component.__lengthOfArrayOfProcessStages.get(ProcessStage.Create)!;
    const array: Int32Array = Component.__componentsOfProcessStages.get(ProcessStage.Create)!;
    array[count++] = this.componentSID;
    array[count] = Component.invalidComponentSID;
    Component.__lengthOfArrayOfProcessStages.set(ProcessStage.Create, count)!;
  }

  static get componentTID(): ComponentTID {
    return 4;
  }

  private __isLoaded(index: Index) {
    if (this.__vertexHandles[index] != null) {
      return true;
    } else {
      return false
    }
  }

  $create({processApproach}: {
    processApproach: ProcessApproachEnum}
    ) {
    if (this.__meshComponent != null) {
      return;
    }
    this.__meshComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, MeshComponent.componentTID) as MeshComponent;

    this.__webglRenderingStrategy = getRenderingStrategy(processApproach);

    this.moveStageTo(ProcessStage.Load);
  }

  $load() {
    this.__webglRenderingStrategy!.$load(this.__meshComponent!);
    this.moveStageTo(ProcessStage.PreRender);
  }

  $prerender(
    {processApproech, instanceIDBufferUid}:{
      processApproech: ProcessApproachEnum,
      instanceIDBufferUid: WebGLResourceHandle
    }) {

    this.__webglRenderingStrategy!.$prerender(this.__meshComponent!, instanceIDBufferUid);
  }

  $render() {
    if (this.__webglRenderingStrategy!.$render == null) {
      return;
    }

    const primitiveNum = this.__meshComponent!.getPrimitiveNumber();
      for(let i=0; i<primitiveNum; i++) {
      const primitive = this.__meshComponent!.getPrimitiveAt(i);
      this.__webglRenderingStrategy!.$render!(primitive);
      }
    }

}
ComponentRepository.registerComponentClass(MeshRendererComponent.componentTID, MeshRendererComponent);
