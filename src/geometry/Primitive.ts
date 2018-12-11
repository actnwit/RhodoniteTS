import { PrimitiveMode, PrimitiveModeEnum} from '../definitions/PrimitiveMode';
import { VertexAttributeEnum } from '../definitions/VertexAttribute';
import Accessor from '../memory/Accessor';
import RnObject from '../core/Object';
import BufferView from '../memory/BufferView';
import { ComponentTypeEnum } from '../definitions/ComponentType';
import MemoryManager from '../core/MemoryManager';

export default class Primitive extends RnObject {
  private __mode: PrimitiveModeEnum;
  private __attributes: Array<Accessor>;
  private __material: ObjectUID;
  private __indices: Accessor;
  private __indicesBufferView: BufferView;
  private __attributesBufferView: BufferView;

  private constructor(
    indicesAccessor: Accessor,
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
  }

  static createPrimitive(
    {indicesComponentType, indices, attributeComponentTypes, attributes, material, primitiveMode} :
    {
      indicesComponentType: ComponentTypeEnum,
      indices: ArrayBuffer,
      attributeComponentTypes: Array<ComponentTypeEnum>,
      attributes: Array<ArrayBuffer>,
      primitiveMode: PrimitiveModeEnum,
      material: ObjectUID
    })
  {
    const buffer = MemoryManager.getInstance().getBufferForCPU();
    Primitive.__bufferView = buffer.takeBufferView({byteLengthToNeed: thisClass.byteSizeOfThisComponent * count, byteStride: 0});
    thisClass.__accesseor_worldMatrix = thisClass.__bufferView.takeAccessor({compositionType: CompositionType.Mat4, componentType: ComponentType.Double, count: count});
  }
}
