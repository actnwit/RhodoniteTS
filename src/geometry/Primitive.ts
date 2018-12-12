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
  private __indices: Accessor;
  private __indicesBufferView: BufferView;
  private __attributesBufferView: BufferView;
  private __indicesComponentType: ComponentTypeEnum;
  private __attributeCompositionTypes: Array<CompositionTypeEnum>;
  private __attributeComponentTypes: Array<ComponentTypeEnum>;

  private constructor(
    indicesComponentType: ComponentTypeEnum,
    indicesAccessor: Accessor,
    attributeCompositionTypes: Array<CompositionTypeEnum>,
    attributeComponentTypes: Array<ComponentTypeEnum>,
    attributeAccessors: Array<Accessor>,
    mode: PrimitiveModeEnum,
    material: ObjectUID,
    indicesBufferView: BufferView,
    attributesBufferView: BufferView)
  {
    super();

    this.__indices = indicesAccessor;
    this.__attributes = attributeAccessors;
    this.__material = material;
    this.__mode = mode;
    this.__indicesBufferView = indicesBufferView;
    this.__attributesBufferView = attributesBufferView;
    this.__indicesComponentType = indicesComponentType;
    this.__attributeCompositionTypes = attributeCompositionTypes;
    this.__attributeComponentTypes = attributeComponentTypes;
  }

  static createPrimitive(
    {indices, attributeCompositionTypes, attributes, material, primitiveMode} :
    {
      indices: TypedArray,
      attributeCompositionTypes: Array<CompositionTypeEnum>,
      attributes: Array<TypedArray>,
      primitiveMode: PrimitiveModeEnum,
      material: ObjectUID
    })
  {

    const indicesComponentType = ComponentType.fromTypedArray(indices);
    const buffer = MemoryManager.getInstance().getBufferForCPU();
    const indicesBufferView = buffer.takeBufferView({byteLengthToNeed: indices.byteLength, byteStride: 0});
    const indicesAccessor = indicesBufferView.takeAccessor({
      compositionType: CompositionType.Scalar,
      componentType: indicesComponentType,
      count: indices.byteLength / indicesComponentType.getSizeInBytes()
    });

    let sumOfAttributesByteSize = 0;
    attributes.forEach(attribute=>{
      sumOfAttributesByteSize += attribute.byteLength;
    });
    const attributesBufferView = buffer.takeBufferView({byteLengthToNeed: sumOfAttributesByteSize, byteStride: 0});

    const attributeAccessors: Array<Accessor> = [];
    const attributeComponentTypes: Array<ComponentTypeEnum> = [];
    attributes.forEach((attribute, i)=>{
      attributeComponentTypes[i] = ComponentType.fromTypedArray(attributes[i]);
      attributeAccessors.push(
        attributesBufferView.takeAccessor({
          compositionType: attributeCompositionTypes[i],
          componentType: ComponentType.fromTypedArray(attributes[i]),
          count: indices.byteLength / attributeCompositionTypes[i].getNumberOfComponents() / attributeComponentTypes[i].getSizeInBytes()
        })
      );
    });

    return new Primitive(
      indicesComponentType,
      indicesAccessor,
      attributeCompositionTypes,
      attributeComponentTypes,
      attributeAccessors,
      primitiveMode,
      material,
      indicesBufferView,
      attributesBufferView
    );
  }
}
