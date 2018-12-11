import { PrimitiveMode, PrimitiveModeEnum} from '../definitions/PrimitiveMode';
import { VertexAttributeEnum } from '../definitions/VertexAttribute';
import Accessor from '../memory/Accessor';
import RnObject from '../core/Object';
import BufferView from '../memory/BufferView';

export default class Primitive extends RnObject {
  private __mode: PrimitiveModeEnum = PrimitiveMode.Unknown;
  private __attributes: Array<Accessor>;
  private __material: ObjectUID;
  private __indices: Accessor;
  private static __bufferView: BufferView;

  private constructor(indicesAccessor: Accessor, attributeAccessors: Array<Accessor>, material: ObjectUID) {
    super();
    this.__indices = indicesAccessor;
    this.__attributes = attributeAccessors;
    this.__material = material;
  }

  static createPrimitive(indices: ArrayBuffer, attributes: ArrayBuffer, material: ObjectUID) {

  }
}
