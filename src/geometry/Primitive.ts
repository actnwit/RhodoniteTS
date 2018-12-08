import { PrimitiveMode, PrimitiveModeEnum} from '../definitions/PrimitiveMode';
import { VertexAttributeEnum } from '../definitions/VertexAttribute';

export default class Primitive {
  __mode: PrimitiveModeEnum = PrimitiveMode.Unknown;
  __indices: ObjectUID = 0;
  __attributes: Map<VertexAttributeEnum, ObjectUID> = new Map();
  __material: ObjectUID = 0;
}
