import { PrimitiveMode, PrimitiveModeEnum} from '../definitions/PrimitiveMode';
import { VertexAttributeEnum } from '../definitions/VertexAttribute';
import Accessor from '../memory/Accessor';
import RnObject from '../core/Object';
import BufferView from '../memory/BufferView';
import { ComponentTypeEnum, ComponentType } from '../definitions/ComponentType';
import MemoryManager from '../core/MemoryManager';
import { CompositionType, CompositionTypeEnum } from '../definitions/CompositionType';

export default class Primitive extends RnObject {
  private __mode: PrimitiveModeEnum;
  private __attributes: Array<Accessor>;
  private __material: ObjectUID;
  private __attributesBufferView: BufferView;
  private __attributeCompositionTypes: Array<CompositionTypeEnum>;
  private __attributeComponentTypes: Array<ComponentTypeEnum>;
  private __attributeSemantics: Array<VertexAttributeEnum>;
  private __indicesComponentType?: ComponentTypeEnum;
  private __indices?: Accessor;
  private __indicesBufferView?: BufferView;

  private constructor(
    attributeCompositionTypes: Array<CompositionTypeEnum>,
    attributeComponentTypes: Array<ComponentTypeEnum>,
    attributeAccessors: Array<Accessor>,
    attributeSemantics: Array<VertexAttributeEnum>,
    mode: PrimitiveModeEnum,
    material: ObjectUID,
    attributesBufferView: BufferView,
    indicesComponentType?: ComponentTypeEnum,
    indicesAccessor?: Accessor,
    indicesBufferView?: BufferView,
    )
  {
    super();

    this.__indices = indicesAccessor;
    this.__attributeCompositionTypes = attributeCompositionTypes;
    this.__attributeComponentTypes = attributeComponentTypes;
    this.__attributes = attributeAccessors;
    this.__attributeSemantics = attributeSemantics;
    this.__material = material;
    this.__mode = mode;
    this.__indicesBufferView = indicesBufferView;
    this.__attributesBufferView = attributesBufferView;
    this.__indicesComponentType = indicesComponentType;
  }

  static createPrimitive(
    {indices, attributeCompositionTypes, attributeSemantics, attributes, material, primitiveMode} :
    {
      indices?: TypedArray,
      attributeCompositionTypes: Array<CompositionTypeEnum>,
      attributeSemantics: Array<VertexAttributeEnum>,
      attributes: Array<TypedArray>,
      primitiveMode: PrimitiveModeEnum,
      material: ObjectUID
    })
  {

      let indicesComponentType;
      let indicesBufferView;
      let indicesAccessor;
    if (indices != null) {
      indicesComponentType = ComponentType.fromTypedArray(indices);
      const buffer = MemoryManager.getInstance().getBufferForCPU();
      indicesBufferView = buffer.takeBufferView({byteLengthToNeed: indices.byteLength, byteStride: 0, isAoS: false});
      indicesAccessor = indicesBufferView.takeAccessor({
        compositionType: CompositionType.Scalar,
        componentType: indicesComponentType,
        count: indices.byteLength / indicesComponentType.getSizeInBytes()
      });
    }

    let sumOfAttributesByteSize = 0;
    attributes.forEach(attribute=>{
      sumOfAttributesByteSize += attribute.byteLength;
    });
    const memoryManager = MemoryManager.getInstance();
    const buffer = memoryManager.getBufferForCPU();
    const attributesBufferView = buffer.takeBufferView({byteLengthToNeed: sumOfAttributesByteSize, byteStride: 0, isAoS: false});

    const attributeAccessors: Array<Accessor> = [];
    const attributeComponentTypes: Array<ComponentTypeEnum> = [];

    let byteLength: number;
    if (indices != null) {
      byteLength = indices.byteLength;
    } else {
      byteLength = attributes[0].byteLength;
    }

    attributes.forEach((attribute, i)=>{
      attributeComponentTypes[i] = ComponentType.fromTypedArray(attributes[i]);
      attributeAccessors.push(
        attributesBufferView.takeAccessor({
          compositionType: attributeCompositionTypes[i],
          componentType: ComponentType.fromTypedArray(attributes[i]),
          count: byteLength / attributeCompositionTypes[i].getNumberOfComponents() / attributeComponentTypes[i].getSizeInBytes()
        })
      );
    });

    return new Primitive(
      attributeCompositionTypes,
      attributeComponentTypes,
      attributeAccessors,
      attributeSemantics,
      primitiveMode,
      material,
      attributesBufferView,
      indicesComponentType,
      indicesAccessor,
      indicesBufferView
    );
  }

  get indicesAccessor(): Accessor | undefined {
    return this.__indices;
  }

  hasIndices() {
    return this.__indices != null;
  }

  get attributeAccessors(): Array<Accessor> {
    return this.__attributes.concat();
  }

  get attributeSemantics(): Array<VertexAttributeEnum> {
    return this.__attributeSemantics.concat();
  }

  get attributeCompositionTypes(): Array<CompositionTypeEnum> {
    return this.__attributeCompositionTypes;
  }

  get attributeComponentTypes(): Array<ComponentTypeEnum> {
    return this.__attributeComponentTypes;
  }

  get primitiveMode(): PrimitiveModeEnum {
    return this.__mode;
  }
}
