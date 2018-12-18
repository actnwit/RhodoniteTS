import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Primitive from '../geometry/Primitive';
import MemoryManager from '../core/MemoryManager';
import EntityRepository from '../core/EntityRepository';
import Accessor from '../memory/Accessor';
import BufferView from '../memory/BufferView';
import { CompositionType } from '../definitions/CompositionType';
import { ComponentType } from '../definitions/ComponentType';
import MeshComponent from './MeshComponent';
import WebGLResouceRepository from '../renderer/webgl/WebGLResourceRepository';
import GLSLShader from '../renderer/webgl/GLSLShader';

export default class MeshRendererComponent extends Component {
  private __meshComponent?: MeshComponent;
  private __webglResourceRepository: WebGLResouceRepository = WebGLResouceRepository.getInstance();
  constructor(entityUid: EntityUID) {
    super(entityUid);
    
  }
  static get maxCount() {
    return 1000000;
  }

  static get componentTID(): ComponentTID {
    return 4;
  }

  $create() {
    this.__meshComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, MeshComponent.componentTID) as MeshComponent;
  }

  $load() {
    if (this.__meshComponent == null) {
      return;
    }
    const primitiveNum = this.__meshComponent.getPrimitiveNumber();
    for (let i=0; i<primitiveNum; i++) {
      const primitive = this.__meshComponent.getPrimitiveAt(i);
      this.__webglResourceRepository.createVertexDataResources(primitive);
    }

    this.__webglResourceRepository.createShaderProgram(
      GLSLShader.vertexShader,
      GLSLShader.fragmentShader,
      GLSLShader.attributeNanes,
      GLSLShader.attributeSemantics
    );
  }

}
ComponentRepository.registerComponentClass(MeshRendererComponent.componentTID, MeshRendererComponent);
