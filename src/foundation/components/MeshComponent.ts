import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Primitive from '../geometry/Primitive';
import EntityRepository from '../core/EntityRepository';
import { WellKnownComponentTIDs } from './WellKnownComponentTIDs';
import { VertexAttribute } from '../definitions/VertexAttribute';
import { ProcessStage } from '../definitions/ProcessStage';
import { PrimitiveMode } from '../definitions/PrimitiveMode';
import Vector3 from '../math/Vector3';
import Vector2_F64 from '../math/Vector2';

export default class MeshComponent extends Component {
  private __primitives: Array<Primitive> = [];

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);

    this.moveStageTo(ProcessStage.Logic);
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.MeshComponentTID;
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

  $logic() {
    this.__calcTangent();
    this.moveStageTo(ProcessStage.Mount);
  }

  __calcTangent() {
    for (let primitive of this.__primitives) {
      const texcoordIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Texcoord0);
      const positionIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Texcoord0);
      if (texcoordIdx !== -1) {
        const positionAccessor = primitive.attributeAccessors[texcoordIdx];
        const texcoordAccessor = primitive.attributeAccessors[texcoordIdx];
        const indicesAccessor = primitive.indicesAccessor;
        positionAccessor.getVec3(0, {indicesAccessor});
      }
    }
  }

  // __calcTangentFor3Vertices(
  //   pos0: Vector3,
  //   pos1: Vector3,
  //   pos2: Vector3,
  //   uv0: Vector2_F64,
  //   uv1: Vector2_F64,
  //   uv: Vector2_F64
  // ) {
}
ComponentRepository.registerComponentClass(MeshComponent);
