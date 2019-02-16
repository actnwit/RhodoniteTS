import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Primitive from '../geometry/Primitive';
import EntityRepository from '../core/EntityRepository';
import { WellKnownComponentTIDs } from './WellKnownComponentTIDs';
import { VertexAttribute } from '../definitions/VertexAttribute';
import { ProcessStage } from '../definitions/ProcessStage';
import { PrimitiveMode } from '../definitions/PrimitiveMode';

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
    this.__calcTangents();
    this.moveStageTo(ProcessStage.Mount);
  }

  __calcTangents() {
    for (let primitive of this.__primitives) {
      const texcoordIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Texcoord0);
      const positionIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Texcoord0);
      if (texcoordIdx !== -1) {
        const positionAccessor = primitive.attributeAccessors[texcoordIdx];
        const texcoordAccessor = primitive.attributeAccessors[texcoordIdx];
        const indicesAccessor = primitive.indicesAccessor;

        let incrementNum = 3; // PrimitiveMode.Triangles
        if (primitive.primitiveMode === PrimitiveMode.TriangleStrip ||
          primitive.primitiveMode === PrimitiveMode.TriangleFan) {
          incrementNum = 1;
        }

        const vertexNum = primitive.getVertexCountAsIndicesBased();
        for (let i = 0; i < vertexNum - 2; i += incrementNum) {
          const pos0 = positionAccessor.getVec3(i, {indicesAccessor});
          const pos1 = positionAccessor.getVec3(i+1, {indicesAccessor});
          const pos2 = positionAccessor.getVec3(i+2, {indicesAccessor});
          const uv0 = texcoordAccessor.getVec2(i, {indicesAccessor});
          const uv1 = texcoordAccessor.getVec2(i+1, {indicesAccessor});
          const uv2 = texcoordAccessor.getVec2(i+2, {indicesAccessor});
        }
      }
    }
  }

}
ComponentRepository.registerComponentClass(MeshComponent);
