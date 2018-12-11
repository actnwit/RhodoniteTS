import { PrimitiveMode, PrimitiveModeEnum} from '../definitions/PrimitiveMode';
import { VertexAttributeEnum } from '../definitions/VertexAttribute';
import Accessor from '../memory/Accessor';
import RnObject from '../core/Object';
import Primitive from './Primitive';
import MemoryManager from '../core/MemoryManager';
import EntityRepository from '../core/EntityRepository';

export default class Geometry  extends RnObject {
  private __primitives: Array<Primitive>

  constructor(primitives: Array<Primitive>) {
    super();
    this.__primitives = primitives;

  }

}
