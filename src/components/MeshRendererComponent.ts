import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import MeshComponent from './MeshComponent';
import WebGLResourceRepository from '../renderer/webgl/WebGLResourceRepository';
import GLSLShader from '../renderer/webgl/GLSLShader';
import { WebGLRenderingPipeline } from '../renderer/webgl/WebGLRenderingPipeline';
import RenderingPipeline from '../renderer/RenderingPipeline';
import Primitive from '../geometry/Primitive';

export default class MeshRendererComponent extends Component {
  private __meshComponent?: MeshComponent;
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private __vertexShaderProgramHandles: Array<CGAPIResourceHandle> = [];
  private __renderingPipeline: RenderingPipeline = WebGLRenderingPipeline;
  private __vertexVaoHandles: Array<{
    vaoHandle: CGAPIResourceHandle, iboHandle?: CGAPIResourceHandle, vboHandles: Array<CGAPIResourceHandle>
  }> = [];
  private static __vertexVaoHandleOfPrimitiveObjectUids: Map<ObjectUID, CGAPIResourceHandle> = new Map();
  private static __shaderProgramHandleOfPrimitiveObjectUids: Map<ObjectUID, CGAPIResourceHandle> = new Map();

  constructor(entityUid: EntityUID) {
    super(entityUid);
  }
  static get maxCount() {
    return 1000000;
  }

  static get componentTID(): ComponentTID {
    return 4;
  }

  private __isLoaded() {
    if (this.__vertexVaoHandles.length > 0) {
      return true;
    } else {
      return false
    }
  }

  private __isInstanced() {
    if (this.__meshComponent!.instanceID !== 0) {
      return true;
    } else {
      return false;
    }
  }

  $create() {
    this.__meshComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, MeshComponent.componentTID) as MeshComponent;
  }

  $load() {
    if (this.__isLoaded()) {
      return;
    }

    if (this.__isInstanced()) {
      return;
    }

    const primitiveNum = this.__meshComponent!.getPrimitiveNumber();
    for(let i=0; i<primitiveNum; i++) {
      const primitive = this.__meshComponent!.getPrimitiveAt(i);
      const vertexHandles = this.__webglResourceRepository.createVertexDataResources(primitive);
      this.__vertexVaoHandles[i] = vertexHandles;
      MeshRendererComponent.__vertexVaoHandleOfPrimitiveObjectUids.set(primitive.objectUid, vertexHandles.vaoHandle);

      const shaderProgramHandle = this.__webglResourceRepository.createShaderProgram(
        GLSLShader.vertexShader,
        GLSLShader.fragmentShader,
        GLSLShader.attributeNanes,
        GLSLShader.attributeSemantics
      );
      this.__vertexShaderProgramHandles[i] = shaderProgramHandle;
      MeshRendererComponent.__shaderProgramHandleOfPrimitiveObjectUids.set(primitive.objectUid, shaderProgramHandle);
    }
  }

  $prerender(instanceIDBufferUid: CGAPIResourceHandle) {
    if (this.__isInstanced()) {
      return;
    }

    const primitiveNum = this.__meshComponent!.getPrimitiveNumber();
    for(let i=0; i<primitiveNum; i++) {
      const primitive = this.__meshComponent!.getPrimitiveAt(i);
      this.__webglResourceRepository.setVertexDataToShaderProgram(
        this.__vertexVaoHandles[i], this.__vertexShaderProgramHandles[i], primitive, instanceIDBufferUid
        );
    }
  }

  $render() {
    const primitiveNum = this.__meshComponent!.getPrimitiveNumber();
      for(let i=0; i<primitiveNum; i++) {
      const primitive = this.__meshComponent!.getPrimitiveAt(i);
      let vaoHandle, shaderProgramHandle;
      if (this.__isInstanced()) {
        vaoHandle = MeshRendererComponent.__vertexVaoHandleOfPrimitiveObjectUids.get(primitive.objectUid)!;
        shaderProgramHandle = MeshRendererComponent.__shaderProgramHandleOfPrimitiveObjectUids.get(primitive.objectUid)!;
      } else {
        vaoHandle = this.__vertexVaoHandles[i].vaoHandle;
        shaderProgramHandle = this.__vertexShaderProgramHandles[i];
      }
      this.__renderingPipeline.render(vaoHandle, shaderProgramHandle, primitive);
    }
  }

}
ComponentRepository.registerComponentClass(MeshRendererComponent.componentTID, MeshRendererComponent);
