import RnObject from "../core/Object";
import Buffer from "../memory/Buffer";
import Accessor from "../memory/Accessor";
import { CompositionTypeEnum } from "../definitions/CompositionType";
import { ComponentTypeEnum, ComponentType } from "../definitions/ComponentType";


export default class BufferView extends RnObject {
  private __buffer: Buffer;
  private __byteOffset: Byte;
  private __byteLength: Byte;
  private __byteStride: Byte = 0;
  private __target: Index = 0;
  private __takenByteIndex: Byte = 0;
  private __takenByteOffsetOfFirstElement = 0;
  private __raw: Uint8Array;
  private __accessors: Array<Accessor> = [];

  constructor({buffer, byteOffset, byteLength, raw} :
    {buffer: Buffer, byteOffset: Byte, byteLength: Byte, raw: Uint8Array})
  {
    super();
    this.__buffer = buffer;
    this.__byteOffset = byteOffset;
    this.__byteLength = byteLength;
    this.__raw = raw;
  }

  set byteStride(stride: Byte) {
    this.__byteStride = stride;
  }

  get byteStride() {
    return this.__byteStride;
  }

  get byteLength() {
    return this.__byteLength;
  }

  get isSoA() {
    return (this.__byteStride === 0) ? true : false;
  }

  get isAoS() {
    return (this.__byteStride !== 0) ? true : false;
  }

  getUint8Array() {
    return this.__raw;
  }

  takeAccessor({compositionType, componentType, count} : {compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count}) {
    const arrayBufferOfBuffer = this.__raw.buffer;
    const byteOffsetOfThisBufferView = this.__raw.byteOffset;

    let byteOffset = 0;
    if (this.isSoA) {
      byteOffset = this.__takenByteIndex;
      this.__takenByteIndex += compositionType.getNumberOfComponents() * componentType.getSizeInBytes() * count;
    } else {
      byteOffset = this.__takenByteIndex;
      this.__takenByteIndex += compositionType.getNumberOfComponents() * componentType.getSizeInBytes();
    }
    const accessor = new Accessor({
      bufferView: this, byteOffset: byteOffset, compositionType: compositionType, componentType: componentType, count: count, raw: this.__raw
    });

    this.__accessors.push(accessor);

    return accessor;
  }
}
