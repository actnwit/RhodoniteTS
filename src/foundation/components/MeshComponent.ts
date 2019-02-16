import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Primitive from '../geometry/Primitive';
import EntityRepository from '../core/EntityRepository';
import { WellKnownComponentTIDs } from './WellKnownComponentTIDs';
import { VertexAttribute } from '../definitions/VertexAttribute';
import { ProcessStage } from '../definitions/ProcessStage';

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

  // _calcTangent(
  //   vertexNum,
  //   positionElementNumPerVertex,
  //   texcoordElementNumPerVertex,
  //   primitiveType
  // ) {
  //   // Allocate Memory
  //   this._vertices.tangent = new Float32Array(
  //     vertexNum * positionElementNumPerVertex
  //   );
  //   // set ComponentNum
  //   this._vertices.components.tangent = 3;
  //   // set ComponentType
  //   this._vertices.componentType.tangent = 5126; // gl.FLOAT

  //   let incrementNum = 3; // gl.TRIANGLES
  //   if (primitiveType === GLBoost.TRIANGLE_STRIP) {
  //     // gl.TRIANGLE_STRIP
  //     incrementNum = 1;
  //   }

    
  //   if (this._vertices.texcoord) {
  //     if (!this._indicesArray) {
  //       for (let i = 0; i < vertexNum - 2; i += incrementNum) {


  //         let pos0IndexBase = i * positionElementNumPerVertex;
  //         let pos1IndexBase = (i + 1) * positionElementNumPerVertex;
  //         let pos2IndexBase = (i + 2) * positionElementNumPerVertex;
  //         let uv0IndexBase = i * texcoordElementNumPerVertex;
  //         let uv1IndexBase = (i + 1) * texcoordElementNumPerVertex;
  //         let uv2IndexBase = (i + 2) * texcoordElementNumPerVertex;

  //         this._calcTangentFor3Vertices(
  //           null,
  //           i,
  //           pos0IndexBase,
  //           pos1IndexBase,
  //           pos2IndexBase,
  //           uv0IndexBase,
  //           uv1IndexBase,
  //           uv2IndexBase,
  //           incrementNum
  //         );
  //       }
  //     } else {
  //       for (let i = 0; i < this._indicesArray.length; i++) {
  //         let vertexIndices = this._indicesArray[i];
  //         for (let j = 0; j < vertexIndices.length - 2; j += incrementNum) {
  //           let pos0IndexBase = vertexIndices[j] * positionElementNumPerVertex; /// ０つ目の頂点
  //           let pos1IndexBase =
  //             vertexIndices[j + 1] * positionElementNumPerVertex; /// １つ目の頂点
  //           let pos2IndexBase =
  //             vertexIndices[j + 2] * positionElementNumPerVertex; /// ２つ目の頂点
  //           let uv0IndexBase = vertexIndices[j] * texcoordElementNumPerVertex;
  //           let uv1IndexBase =
  //             vertexIndices[j + 1] * texcoordElementNumPerVertex;
  //           let uv2IndexBase =
  //             vertexIndices[j + 2] * texcoordElementNumPerVertex;

  //           this._calcTangentFor3Vertices(
  //             vertexIndices,
  //             j,
  //             pos0IndexBase,
  //             pos1IndexBase,
  //             pos2IndexBase,
  //             uv0IndexBase,
  //             uv1IndexBase,
  //             uv2IndexBase,
  //             incrementNum
  //           );
  //         }
  //       }
  //     }
  //   }
  // }

}
ComponentRepository.registerComponentClass(MeshComponent);
