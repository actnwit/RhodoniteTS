import {ComponentTypeEnum, VertexAttributeEnum} from '../..';
import MemoryManager from '../core/MemoryManager';
import {ComponentType} from '../definitions/ComponentType';
import {CompositionType} from '../definitions/CompositionType';
import {PrimitiveMode} from '../definitions/PrimitiveMode';
import {VertexAttribute} from '../definitions/VertexAttribute';
import Material from '../materials/core/Material';
import {IColorRgba} from '../math/IColor';
import {IVector3} from '../math/IVector';
import Accessor from '../memory/Accessor';
import {Is} from '../misc/Is';
import {Primitive} from './Primitive';

export interface CubeDescriptor {
  /** three width (width, height, depth) in (x, y, z) */
  widthVector: IVector3;
  /** color */
  color?: IColorRgba;
  /** attach a rhodonite material to this plane(the default material is the classicUberMaterial */
  material?: Material;
}

/**
 * The Color Primitive class
 */
export class Cube extends Primitive {
  /**
   * Generates a plane object
   * @param desc a descriptor object of a Plane
   */
  public generate(desc: CubeDescriptor): void {
    // prettier-ignore
    const indices = [
      3, 1, 0, 2, 1, 3,
      4, 5, 7, 7, 5, 6,
      8, 9, 11, 11, 9, 10,
      15, 13, 12, 14, 13, 15,
      19, 17, 16, 18, 17, 19,
      20, 21, 23, 23, 21, 22
    ];

    // prettier-ignore
    const positions = [
      // upper
      -desc.widthVector.x, desc.widthVector.y, -desc.widthVector.z,
      desc.widthVector.x,  desc.widthVector.y, -desc.widthVector.z,
      desc.widthVector.x,  desc.widthVector.y, desc.widthVector.z,
      -desc.widthVector.x, desc.widthVector.y, desc.widthVector.z,
      // lower
      -desc.widthVector.x, -desc.widthVector.y, -desc.widthVector.z,
      desc.widthVector.x,  -desc.widthVector.y, -desc.widthVector.z,
      desc.widthVector.x,  -desc.widthVector.y, desc.widthVector.z,
      -desc.widthVector.x, -desc.widthVector.y, desc.widthVector.z,
      // front
      -desc.widthVector.x, -desc.widthVector.y, desc.widthVector.z,
      desc.widthVector.x,  -desc.widthVector.y, desc.widthVector.z,
      desc.widthVector.x,  desc.widthVector.y, desc.widthVector.z,
      -desc.widthVector.x, desc.widthVector.y, desc.widthVector.z,
      // back
      -desc.widthVector.x, -desc.widthVector.y, -desc.widthVector.z,
      desc.widthVector.x,  -desc.widthVector.y, -desc.widthVector.z,
      desc.widthVector.x,  desc.widthVector.y, -desc.widthVector.z,
      -desc.widthVector.x, desc.widthVector.y, -desc.widthVector.z,
      // right
      desc.widthVector.x, -desc.widthVector.y, -desc.widthVector.z,
      desc.widthVector.x,  -desc.widthVector.y, desc.widthVector.z,
      desc.widthVector.x,  desc.widthVector.y, desc.widthVector.z,
      desc.widthVector.x, desc.widthVector.y, -desc.widthVector.z,
      // left
      -desc.widthVector.x, -desc.widthVector.y, -desc.widthVector.z,
      -desc.widthVector.x,  -desc.widthVector.y, desc.widthVector.z,
      -desc.widthVector.x,  desc.widthVector.y, desc.widthVector.z,
      -desc.widthVector.x, desc.widthVector.y, -desc.widthVector.z,
    ];

    // prettier-ignore
    const colors = Is.not.exist(desc.color) ? [] : [
        desc.color.r, desc.color.g, desc.color.b, desc.color.a,
        desc.color.r, desc.color.g, desc.color.b, desc.color.a,
        desc.color.r, desc.color.g, desc.color.b, desc.color.a,
        desc.color.r, desc.color.g, desc.color.b, desc.color.a,

        desc.color.r, desc.color.g, desc.color.b, desc.color.a,
        desc.color.r, desc.color.g, desc.color.b, desc.color.a,
        desc.color.r, desc.color.g, desc.color.b, desc.color.a,
        desc.color.r, desc.color.g, desc.color.b, desc.color.a,

        desc.color.r, desc.color.g, desc.color.b, desc.color.a,
        desc.color.r, desc.color.g, desc.color.b, desc.color.a,
        desc.color.r, desc.color.g, desc.color.b, desc.color.a,
        desc.color.r, desc.color.g, desc.color.b, desc.color.a,

        desc.color.r, desc.color.g, desc.color.b, desc.color.a,
        desc.color.r, desc.color.g, desc.color.b, desc.color.a,
        desc.color.r, desc.color.g, desc.color.b, desc.color.a,
        desc.color.r, desc.color.g, desc.color.b, desc.color.a,

        desc.color.r, desc.color.g, desc.color.b, desc.color.a,
        desc.color.r, desc.color.g, desc.color.b, desc.color.a,
        desc.color.r, desc.color.g, desc.color.b, desc.color.a,
        desc.color.r, desc.color.g, desc.color.b, desc.color.a,

        desc.color.r, desc.color.g, desc.color.b, desc.color.a,
        desc.color.r, desc.color.g, desc.color.b, desc.color.a,
        desc.color.r, desc.color.g, desc.color.b, desc.color.a,
        desc.color.r, desc.color.g, desc.color.b, desc.color.a,
      ];

    // prettier-ignore
    const texcoords = [
      // upper
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      // lower
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      // front
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      // back
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      // right
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      // left
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
    ];

    // prettier-ignore
    const normals = [
      // upper
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      // lower
      0, -1, 0,
      0, -1, 0,
      0, -1, 0,
      0, -1, 0,
      // front
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      // back
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,
      // right
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
      // left
      -1, 0, 0,
      -1, 0, 0,
      -1, 0, 0,
      -1, 0, 0,
    ];

    /// Check Size ///
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
    const attributes = [
      new Float32Array(positions),
      new Float32Array(normals),
      new Float32Array(texcoords),
    ];
    if (Is.exist(desc.color)) {
      attributeCompositionTypes.push(CompositionType.Vec3);
      attributeSemantics.push(VertexAttribute.Color0);
      attributes.push(new Float32Array(colors));
    }
    const primitiveMode = PrimitiveMode.Triangles;
    let sumOfAttributesByteSize = 0;
    attributes.forEach(attribute => {
      sumOfAttributesByteSize += attribute.byteLength;
    });
    const indexSizeInByte =
      indices.length * ComponentType.UnsignedShort.getSizeInBytes();

    /// Create a Rhodonite Buffer object ///
    const buffer = MemoryManager.getInstance().createBufferOnDemand(
      indexSizeInByte + sumOfAttributesByteSize,
      this,
      4
    );

    /// Index Buffer ///
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

    /// VertexBuffer ///
    const attributesBufferView = buffer.takeBufferView({
      byteLengthToNeed: sumOfAttributesByteSize,
      byteStride: 0,
    });

    const attributeAccessors: Array<Accessor> = [];
    const attributeComponentTypes: Array<ComponentTypeEnum> = [];
    // setup vertex attributes
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

    this.setData(attributeMap, primitiveMode, desc.material, indicesAccessor);
  }
}