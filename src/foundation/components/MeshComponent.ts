import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Primitive from '../geometry/Primitive';
import EntityRepository from '../core/EntityRepository';
import { WellKnownComponentTIDs } from './WellKnownComponentTIDs';
import { VertexAttribute } from '../definitions/VertexAttribute';
import { ProcessStage } from '../definitions/ProcessStage';
import { PrimitiveMode } from '../definitions/PrimitiveMode';
import Vector3 from '../math/Vector3';
import Vector2 from '../math/Vector2';
import MemoryManager from '../core/MemoryManager';
import { BufferUse } from '../definitions/BufferUse';
import { CompositionType } from '../definitions/CompositionType';
import { ComponentType } from '../definitions/ComponentType';
import Accessor from '../memory/Accessor';

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
        const buffer = MemoryManager.getInstance().getBuffer(BufferUse.GPUVertexData);

        const tangentAttributeByteSize = positionAccessor.byteLength;
        const tangentBufferView = buffer.takeBufferView({byteLengthToNeed: tangentAttributeByteSize, byteStride: 0, isAoS: false});
        const tangentAccessor = tangentBufferView.takeAccessor({compositionType: CompositionType.Vec3, componentType: ComponentType.Float, count: positionAccessor.elementCount});
        for (let i = 0; i < vertexNum - 2; i += incrementNum) {
          const pos0 = positionAccessor.getVec3(i, {indicesAccessor});
          const pos1 = positionAccessor.getVec3(i+1, {indicesAccessor});
          const pos2 = positionAccessor.getVec3(i+2, {indicesAccessor});
          const uv0 = texcoordAccessor.getVec2(i, {indicesAccessor});
          const uv1 = texcoordAccessor.getVec2(i+1, {indicesAccessor});
          const uv2 = texcoordAccessor.getVec2(i+2, {indicesAccessor});

          this.__calcTangentFor3Vertices(i, pos0, pos1, pos2, uv0, uv1, uv2, tangentAccessor, indicesAccessor);
        }
      }
    }
  }

  __calcTangentFor3Vertices(
    i: Index,
    pos0: Vector3,
    pos1: Vector3,
    pos2: Vector3,
    uv0: Vector2,
    uv1: Vector2,
    uv2: Vector2,
    tangentAccessor: Accessor,
    indicesAccessor?: Accessor,
  ) {
    const tan0Vec3 = this.__calcTangentPerVertex(pos0, pos1, pos2, uv0, uv1, uv2);
    const tan1Vec3 = this.__calcTangentPerVertex(pos1, pos2, pos0, uv1, uv2, uv0);
    const tan2Vec3 = this.__calcTangentPerVertex(pos2, pos0, pos1, uv2, uv0, uv1);

    tangentAccessor.setVec3(i, tan0Vec3.x, tan0Vec3.y, tan0Vec3.z, {indicesAccessor});
    tangentAccessor.setVec3(i+1, tan1Vec3.x, tan1Vec3.y, tan1Vec3.z, {indicesAccessor});
    tangentAccessor.setVec3(i+2, tan2Vec3.x, tan2Vec3.y, tan2Vec3.z, {indicesAccessor});
  }

  __calcTangentPerVertex(
    pos0Vec3: Vector3,
    pos1Vec3: Vector3,
    pos2Vec3: Vector3,
    uv0Vec2: Vector2,
    uv1Vec2: Vector2,
    uv2Vec2: Vector2
  ) {
    let cp0 = [
      new Vector3(pos0Vec3.x, uv0Vec2.x, uv0Vec2.y),
      new Vector3(pos0Vec3.y, uv0Vec2.x, uv0Vec2.y),
      new Vector3(pos0Vec3.z, uv0Vec2.x, uv0Vec2.y)
    ];

    let cp1 = [
      new Vector3(pos1Vec3.x, uv1Vec2.x, uv1Vec2.y),
      new Vector3(pos1Vec3.y, uv1Vec2.x, uv1Vec2.y),
      new Vector3(pos1Vec3.z, uv1Vec2.x, uv1Vec2.y)
    ];

    let cp2 = [
      new Vector3(pos2Vec3.x, uv2Vec2.x, uv2Vec2.y),
      new Vector3(pos2Vec3.y, uv2Vec2.x, uv2Vec2.y),
      new Vector3(pos2Vec3.z, uv2Vec2.x, uv2Vec2.y)
    ];

    let u = [];
    let v = [];

    for (let i = 0; i < 3; i++) {
      let v1 = Vector3.subtract(cp1[i], cp0[i]);
      let v2 = Vector3.subtract(cp2[i], cp1[i]);
      let abc = Vector3.cross(v1, v2);

      let validate = Math.abs(abc.x) < Number.EPSILON;
      if (validate) {
        console.assert(validate, "Polygons or polygons on UV are degenerate!");
        return new Vector3(0, 0, 0);
      }

      u[i] = -abc.y / abc.x;
      v[i] = -abc.z / abc.x;
    }

    return Vector3.normalize(new Vector3(u[0], u[1], u[2]));
  }


}
ComponentRepository.registerComponentClass(MeshComponent);
