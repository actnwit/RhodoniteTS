import RnObject from "../core/Object";
import Buffer from "../memory/Buffer";
import Accessor from "../memory/Accessor";
import { CompositionTypeEnum } from "../definitions/CompositionType";
import { ComponentTypeEnum, ComponentType } from "../definitions/ComponentType";


export default class BufferView extends RnObject {
  __buffer: Buffer;
  __byteOffset: Byte;
  __byteLength: Byte;
  __byteStride: Byte = 0;
  __target: Index = 0;
  __takenByteIndex: Byte = 0;
  __takenByteOffsetOfFirstElement = 0;
  __raw: Uint8Array;

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

  isSoA() {
    return (this.__byteStride === 0) ? true : false;
  }

  isAoS() {
    return (this.__byteStride !== 0) ? true : false;
  }

  takeAccessor({compositionType, componentType, count} : {compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count}) {
    const arrayBufferOfBuffer = this.__raw.buffer;
    const byteOffsetOfThisBufferView = this.__raw.byteOffset;

    /*
    const getTypedArrayClass = (componentType: ComponentTypeEnum) => {
      switch (componentType) {
        case ComponentType.Byte: return Int8Array;
        case ComponentType.UnsignedByte: return Uint8Array;
        case ComponentType.Short: return Int16Array;
        case ComponentType.UnsignedShort: return Uint16Array;
        case ComponentType.Int: return Int32Array;
        case ComponentType.UnsingedInt: return Uint32Array;
        case ComponentType.Float: return Float32Array;
        case ComponentType.Double: return Float64Array;
        default: console.error('Unexpected ComponentType!');
      }
    }
    const typedArrayClass = getTypedArrayClass(componentType);
    */

    let byteOffset = 0;
    if (this.isAoS) {
      byteOffset = this.__takenByteIndex;
      this.__takenByteIndex += compositionType.getNumberOfComponents() * componentType.getSizeInBytes() * count;
    } else {
      byteOffset = this.__takenByteIndex;
      this.__takenByteIndex += compositionType.getNumberOfComponents() * componentType.getSizeInBytes();
    }
    const accessor = new Accessor({
      bufferView: this, byteOffset: byteOffset, compositionType: compositionType, componentType: componentType, count: count, raw: this.__raw
    });

    return accessor;
  }
}
