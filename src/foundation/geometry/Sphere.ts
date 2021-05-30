import Primitive from './Primitive';
import {CompositionType} from '../definitions/CompositionType';
import {
  VertexAttribute,
  VertexAttributeEnum,
} from '../definitions/VertexAttribute';
import {PrimitiveMode} from '../definitions/PrimitiveMode';
import MemoryManager from '../core/MemoryManager';
import {ComponentType, ComponentTypeEnum} from '../definitions/ComponentType';
import Accessor from '../memory/Accessor';
import Material from '../materials/core/Material';
import Vector3 from '../math/Vector3';
import {Size} from '../../types/CommonTypes';

export default class Sphere extends Primitive {
  constructor() {
    super();
  }

  generate({
    radius,
    widthSegments,
    heightSegments,
    material,
  }: {
    radius: number;
    widthSegments: Size;
    heightSegments: Size;
    material?: Material;
  }) {
    const positions = [];
    const texcoords = [];
    const normals = [];

    if (Math.abs(radius) < Number.EPSILON) {
      console.warn(
        'The argument radius is zero / nearly zero. Rn will take the radius as 0.001 for safety. Check your code.'
      );
      radius = 0.001;
    }

    const shiftValue = 0.00001; // for avoid Singular point
    for (let latNumber = 0; latNumber <= heightSegments; latNumber++) {
      const theta = (latNumber * Math.PI) / heightSegments + shiftValue;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let longNumber = 0; longNumber <= widthSegments; longNumber++) {
        const phi = (longNumber * 2 * Math.PI) / widthSegments;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const x = radius * cosPhi * sinTheta;
        const y = radius * cosTheta;
        const z = radius * sinPhi * sinTheta;
        const position = new Vector3(x, y, z);
        positions.push(x);
        positions.push(y);
        positions.push(z);
        const u = 1 - longNumber / widthSegments;
        const v = latNumber / heightSegments;
        texcoords.push(u);
        texcoords.push(v);
        const normal = Vector3.normalize(position);
        normals.push(normal.x);
        normals.push(normal.y);
        normals.push(normal.z);
      }
    }

    // first    first+1
    //    +-------+
    //    |     / |
    //    |   /   |
    //    | /     |
    //    +-------+
    // second   second+1
    //
    const indices = [];
    for (let latNumber = 0; latNumber < heightSegments; latNumber++) {
      for (let longNumber = 0; longNumber < widthSegments; longNumber++) {
        const first = latNumber * (widthSegments + 1) + longNumber;
        const second = first + widthSegments + 1;

        indices.push(first + 1);
        indices.push(second);
        indices.push(first);

        indices.push(first + 1);
        indices.push(second + 1);
        indices.push(second);
      }
    }

    const attributeCompositionTypes = [
      CompositionType.Vec3,
      CompositionType.Vec3,
      CompositionType.Vec2,
    ];
    const attributeSemantics = [
      VertexAttribute.Position,
      VertexAttribute.Normal,
      VertexAttribute.Texcoord0,
    ];
    const primitiveMode = PrimitiveMode.Triangles;
    const attributes = [
      new Float32Array(positions),
      new Float32Array(normals),
      new Float32Array(texcoords),
    ];
    let sumOfAttributesByteSize = 0;
    attributes.forEach(attribute => {
      sumOfAttributesByteSize += attribute.byteLength;
    });
    const indexSizeInByte = indices.length * 2;

    const buffer = MemoryManager.getInstance().createBufferOnDemand(
      indexSizeInByte + sumOfAttributesByteSize,
      this,
      4
    );

    const indicesBufferView = buffer.takeBufferView({
      byteLengthToNeed: indexSizeInByte /*byte*/,
      byteStride: 0,
    });
    const indicesAccessor = indicesBufferView.takeAccessor({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.UnsignedShort,
      count: indices.length,
    });
    for (let i = 0; i < indices.length; i++) {
      indicesAccessor!.setScalar(i, indices![i], {});
    }

    const attributesBufferView = buffer.takeBufferView({
      byteLengthToNeed: sumOfAttributesByteSize,
      byteStride: 0,
    });

    const attributeAccessors: Array<Accessor> = [];
    const attributeComponentTypes: Array<ComponentTypeEnum> = [];

    attributes.forEach((attribute, i) => {
      attributeComponentTypes[i] = ComponentType.fromTypedArray(attributes[i]);
      const accessor: Accessor = attributesBufferView.takeAccessor({
        compositionType: attributeCompositionTypes[i],
        componentType: ComponentType.fromTypedArray(attributes[i]),
        count:
          attribute.byteLength /
          attributeCompositionTypes[i].getNumberOfComponents() /
          attributeComponentTypes[i].getSizeInBytes(),
      });
      accessor.copyFromTypedArray(attribute);
      attributeAccessors.push(accessor);
    });

    const attributeMap: Map<VertexAttributeEnum, Accessor> = new Map();
    for (let i = 0; i < attributeSemantics.length; i++) {
      attributeMap.set(attributeSemantics[i], attributeAccessors[i]);
    }

    this.setData(attributeMap, primitiveMode, material, indicesAccessor);
  }
}
