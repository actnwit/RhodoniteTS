import { PrimitiveMode, PrimitiveModeEnum} from '../definitions/PrimitiveMode';
import { VertexAttributeEnum } from '../definitions/VertexAttribute';
import Accessor from '../memory/Accessor';
import RnObject from '../core/Object';
import Primitive from './Primitive';
import MemoryManager from '../core/MemoryManager';
import EntityRepository from '../core/EntityRepository';

export default class Geometry  extends RnObject {
  private __mode: PrimitiveModeEnum = PrimitiveMode.Unknown;
  private __primitives: Array<Primitive>

  constructor(primitives: Array<Primitive>) {
    super();
    this.__primitives = primitives;

  }

  static setupBufferView() {
    const thisClass = Geometry;
    const buffer = MemoryManager.getInstance().getBufferForGPU();
    const count = EntityRepository.getMaxEntityNumber();
    thisClass.__bufferView = buffer.takeBufferView({byteLengthToNeed: thisClass.byteSizeOfThisComponent * count, byteStride: 0});
    thisClass.__accesseor_worldMatrix = thisClass.__bufferView.takeAccessor({compositionType: CompositionType.Mat4, componentType: ComponentType.Double, count: count});
  }

}
