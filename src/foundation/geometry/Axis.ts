import {Primitive} from './Primitive';
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

export interface AxisDescriptor {
  /** the length of axis */
  length: Size;
  /** attach a rhodonite material to this plane(the default material is the classicUberMaterial */
  material?: Material;
}

/**
 * the Axis class
 */
export class Axis extends Primitive {
  /**
   * Generates a plane object
   * @param desc a descriptor object of a Plane
   */
  public generate(desc: AxisDescriptor): void {
    const positions = new Float32Array([
      // X axis
      0,
      0,
      0,
      desc.length,
      0,
      0,

      // Y axis
      0,
      0,
      0,
      0,
      desc.length,
      0,

      // Z axis
      0,
      0,
      0,
      0,
      0,
      desc.length,
    ]);

    const colors = new Float32Array([
      // X axis as Red
      1, 0, 0, 1, 0, 0,

      // Y axis as Green
      0, 1, 0, 0, 1, 0,

      // Z axis as Blue
      0, 0, 1, 0, 0, 1,
    ]);

    let sumOfAttributesByteSize = 0;
    const attributes = [new Float32Array(positions), new Float32Array(colors)];
    attributes.forEach(attribute => {
      sumOfAttributesByteSize += attribute.byteLength;
    });

    // Create Buffer
    const buffer = MemoryManager.getInstance().createBufferOnDemand(
      sumOfAttributesByteSize,
      this,
      4
    );

    // Index Buffer
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

    this.setData(attributeMap, PrimitiveMode.Lines, desc.material);
  }
}
