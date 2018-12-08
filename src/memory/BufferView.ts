import RnObject from "../core/Object";
import Buffer from "../memory/Buffer";
import Accessor from "../memory/Accessor";
import { CompositionTypeEnum } from "../definitions/CompositionType";
import { ComponentTypeEnum } from "../definitions/ComponentType";


export default class BufferView extends RnObject {
  __buffer: Buffer;
  __byteOffset: Byte;
  __byteLength: Byte;
  __byteStride: Byte = 0;
  __target: Index = 0;
  __takenByteIndex: Byte = 0;

  constructor({buffer, byteOffset, byteLength} :
    {buffer: Buffer, byteOffset: Byte, byteLength: Byte})
  {
    super();
    this.__buffer = buffer;
    this.__byteOffset = byteOffset;
    this.__byteLength = byteLength;
  }

  set byteStride(stride: Byte) {
    this.__byteStride = stride;
  }

  get byteStride() {
    return this.__byteStride;
  }

  isSoA() {
    return (this.__byteOffset === 0) ? true : false;
  }

  isAoS() {
    return (this.__byteOffset !== 0) ? true : false;
  }

  takeAccessor({compositionType, componentType, count} : {compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count}) {
    const accessor = new Accessor({
      bufferView: this, byteOffset: this.__takenByteIndex, compositionType: compositionType, componentType: componentType, count: count
    });

    this.__takenByteIndex += compositionType.getNumberOfComponents() * componentType.getSizeInBytes() * count;

    return accessor;
  }
}
