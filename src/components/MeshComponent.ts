import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Primitive from '../geometry/Primitive';
import WebGLResourceRepository from '../renderer/webgl/WebGLResourceRepository';
import GLSLShader from '../renderer/webgl/GLSLShader';
import RenderingPipeline from '../renderer/RenderingPipeline';
import { WebGLRenderingPipeline } from '../renderer/webgl/WebGLRenderingPipeline';

export default class MeshComponent extends Component {
  private __primitives: Array<Primitive> = [];
  private __vertexVaoHandles: Array<CGAPIResourceHandle> = [];
  private __vertexShaderProgramHandles: Array<CGAPIResourceHandle> = [];
  private __webglResourceRepository = WebGLResourceRepository.getInstance();
  private __renderingPipeline: RenderingPipeline = WebGLRenderingPipeline;

  constructor(entityUid: EntityUID) {
    super(entityUid);

  }
  static get maxCount() {
    return 1000000;
  }

  static get componentTID(): ComponentTID {
    return 3;
  }

  addPrimitive(primitive: Primitive) {
    this.__primitives.push(primitive);
  }

  getPrimitiveAt(i:number) {
    return this.__primitives[i];
  }
  getPrimitiveNumber() {
    return this.__primitives.length;
  }

  $prerender() {

    this.__primitives.forEach((primitive, i)=>{
      const vertexHandles = this.__webglResourceRepository.createVertexDataResources(primitive);
      this.__vertexVaoHandles[i] = vertexHandles.vaoHandle;

      const shaderProgramHandle = this.__webglResourceRepository.createShaderProgram(
        GLSLShader.vertexShader,
        GLSLShader.fragmentShader,
        GLSLShader.attributeNanes,
        GLSLShader.attributeSemantics
      );
      this.__vertexShaderProgramHandles[i] = shaderProgramHandle;

      this.__webglResourceRepository.setVertexDataToShaderProgram(vertexHandles, shaderProgramHandle, primitive);
    });

  }

  $render() {
    this.__primitives.forEach((primitive, i)=>{
      this.__renderingPipeline.render(this.__vertexVaoHandles[i], this.__vertexShaderProgramHandles[i], primitive);
    });
  }
}
ComponentRepository.registerComponentClass(MeshComponent.componentTID, MeshComponent);
