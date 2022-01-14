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
import {Size} from '../../types/CommonTypes';

export type PlaneDescriptor = {
  /** the length of U(X)-axis direction */
  width: Size;
  /** the length of V(Y)-axis direction */
  height: Size;
  /** number of spans in U(X)-axis direction */
  uSpan: Size;
  /** number of spans in V(Y)-axis direction */
  vSpan: Size;
  /** draw uSpan times vSpan number of textures */
  isUVRepeat: boolean;
  /** draw textures by flipping on the V(Y)-axis */
  flipTextureCoordinateY?: boolean;
  /** attach a rhodonite material to this plane(the default material is the classicUberMaterial */
  material?: Material;
};

/**
 * Plane class
 *
 */
export default class Plane extends Primitive {
  /**
   * Generates a plane object
   * @param desc a descriptor object of a Plane
   */
  public generate(desc: PlaneDescriptor): void {
    const positions = [];

    for (let i = 0; i <= desc.vSpan; i++) {
      for (let j = 0; j <= desc.uSpan; j++) {
        positions.push((j / desc.uSpan - 1 / 2) * desc.width);
        positions.push(0);
        positions.push((i / desc.vSpan - 1 / 2) * desc.height);
      }
    }

    const indices = [];
    for (let i = 0; i < desc.vSpan; i++) {
      let degenerate_left_index = 0;
      let degenerate_right_index = 0;
      for (let j = 0; j <= desc.uSpan; j++) {
        indices.push(i * (desc.uSpan + 1) + j);
        indices.push((i + 1) * (desc.uSpan + 1) + j);
        if (j === 0) {
          degenerate_left_index = (i + 1) * (desc.uSpan + 1) + j;
        } else if (j === desc.uSpan) {
          degenerate_right_index = (i + 1) * (desc.uSpan + 1) + j;
        }
      }
      indices.push(degenerate_right_index);
      indices.push(degenerate_left_index);
    }

    const normals = [];
    for (let i = 0; i <= desc.vSpan; i++) {
      for (let j = 0; j <= desc.uSpan; j++) {
        normals.push(0);
        normals.push(1);
        normals.push(0);
      }
    }

    const texcoords = [];
    for (let i = 0; i <= desc.vSpan; i++) {
      const i_ = desc.flipTextureCoordinateY ? i : desc.vSpan - i;

      for (let j = 0; j <= desc.uSpan; j++) {
        if (desc.isUVRepeat) {
          texcoords.push(j);
          texcoords.push(i_);
        } else {
          texcoords.push(j / desc.uSpan);
          texcoords.push(i_ / desc.vSpan);
        }
      }
    }

    // Check Size
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
    const primitiveMode = PrimitiveMode.TriangleStrip;
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

    // Create Buffer
    const buffer = MemoryManager.getInstance().createBufferOnDemand(
      indexSizeInByte + sumOfAttributesByteSize,
      this,
      4
    );

    // Index Buffer
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

    // VertexBuffer
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

    this.setData(attributeMap, primitiveMode, desc.material, indicesAccessor);
  }
}
