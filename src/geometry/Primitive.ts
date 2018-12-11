import { PrimitiveMode, PrimitiveModeEnum} from '../definitions/PrimitiveMode';
import { VertexAttributeEnum } from '../definitions/VertexAttribute';
import Accessor from '../memory/Accessor';
import RnObject from '../core/Object';
import BufferView from '../memory/BufferView';
import { ComponentTypeEnum } from '../definitions/ComponentType';

export default class Primitive extends RnObject {
  private __mode: PrimitiveModeEnum;
  private __attributes: Array<Accessor>;
  private __material: ObjectUID;
  private __indices: Accessor;
  private static __bufferView: BufferView;

  private constructor(
    indicesAccessor: Accessor,
    attributeAccessors: Array<Accessor>,
    mode: PrimitiveModeEnum,
    material: ObjectUID)
  {
    super();

    this.__indices = indicesAccessor;
    this.__attributes = attributeAccessors;
    this.__material = material;
    this.__mode = mode;
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
    
  }
}
