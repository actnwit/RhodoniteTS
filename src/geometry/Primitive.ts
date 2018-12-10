import { PrimitiveMode, PrimitiveModeEnum} from '../definitions/PrimitiveMode';
import { VertexAttributeEnum } from '../definitions/VertexAttribute';
import Accessor from '../memory/Accessor';
import RnObject from '../core/Object';

export default class Primitive extends RnObject {
  __mode: PrimitiveModeEnum = PrimitiveMode.Unknown;
  __indices: Accessor;
  __attributes: Map<VertexAttributeEnum, Accessor> = new Map();
  __material: ObjectUID;

  constructor() {
    super()
  }
}
