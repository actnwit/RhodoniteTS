import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Primitive from '../geometry/Primitive';
import WebGLResourceRepository from '../renderer/webgl/WebGLResourceRepository';
import GLSLShader from '../renderer/webgl/GLSLShader';
import RenderingPipeline from '../renderer/RenderingPipeline';
import { WebGLRenderingPipeline } from '../renderer/webgl/WebGLRenderingPipeline';

export default class MeshComponent extends Component {
  private __primitives: Array<Primitive> = [];

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

  getPrimitiveAt(i: number) {
    return this.__primitives[i];
  }
  getPrimitiveNumber() {
    return this.__primitives.length;
  }

}
ComponentRepository.registerComponentClass(MeshComponent.componentTID, MeshComponent);
