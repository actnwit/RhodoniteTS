import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Primitive from '../geometry/Primitive';
import WebGLResourceRepository from '../renderer/webgl/WebGLResourceRepository';
import GLSLShader from '../renderer/webgl/GLSLShader';
import RenderingPipeline from '../renderer/RenderingPipeline';
import { WebGLRenderingPipeline } from '../renderer/webgl/WebGLRenderingPipeline';

export default class MeshComponent extends Component {
  private __primitives: Array<Primitive> = [];
  private __instancedEntityUids: Array<EntityUID> = [];
//  private static __instanceCountOfPrimitiveObjectUids: Map<ObjectUID, Count> = new Map();

  constructor(entityUid: EntityUID) {
    super(entityUid);

  }
  static get maxCount() {
    return 1000000;
  }

  static get componentTID(): ComponentTID {
    return 3;
  }

  addPrimitive(primitive: Primitive, isInstance: boolean = false) {
    this.__primitives.push(primitive);

    if (isInstance) {
      // if (MeshComponent.__instanceCountOfPrimitiveObjectUids.has(primitive.objectUid)) {
      //   const count: Count = MeshComponent.__instanceCountOfPrimitiveObjectUids.get(primitive.objectUid)!;
      //   MeshComponent.__instanceCountOfPrimitiveObjectUids.set(primitive.objectUid, count+1);
      //   this.__instancedEntityUid = count+1;
      // } else {
      //   this.__instanceId = 1;
      //   MeshComponent.__instanceCountOfPrimitiveObjectUids.set(primitive.objectUid, 1);
      // }
      this.__instancedEntityUids[this.__primitives.length-1] = this.__entityUid;
    } else {
      this.__instancedEntityUids[this.__primitives.length-1] = 0;
    }
  }

  getPrimitiveAt(i: number) {
    return this.__primitives[i];
  }
  getPrimitiveNumber() {
    return this.__primitives.length;
  }

  getInstancedEntityUid(index: Index): EntityUID {
    return this.__instancedEntityUids[index];
  }

}
ComponentRepository.registerComponentClass(MeshComponent.componentTID, MeshComponent);
