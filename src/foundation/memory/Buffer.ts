import RnObject from "../core/RnObject";
import BufferView from "./BufferView";
import { Byte, Size } from "../../types/CommonTypes";

export default class Buffer extends RnObject {
  private __byteLength: Size = 0;
  private __byteOffset: Size = 0;
  private __raw: ArrayBuffer;
  private __name: string = '';
  private __takenBytesIndex: Byte = 0;
  private __bufferViews: Array<BufferView> = [];

  constructor({byteLength, buffer, name} : {byteLength: Size, buffer: ArrayBuffer | Uint8Array, name: string}) {
    super();
    this.__name = name;
    this.__byteLength = byteLength;
    if (buffer instanceof Uint8Array) {
      this.__raw = buffer.buffer
      this.__byteOffset = buffer.byteOffset;
      this.__takenBytesIndex = buffer.byteOffset;
    } else {
      this.__raw = buffer;
    }
  }

  set name(str) {
    this.__name = str;
  }

  get name() {
    return this.__name;
  }

  getArrayBuffer() {
    return this.__raw;
  }

  takeBufferView({byteLengthToNeed, byteStride, isAoS, byteAlign = 4} : {byteLengthToNeed: Byte, byteStride: Byte, isAoS: boolean, byteAlign?: Byte}) {
    if (byteLengthToNeed % byteAlign !== 0) {
      console.info(`Padding bytes added because byteLengthToNeed must be a multiple of ${byteAlign}.`);
      byteLengthToNeed += byteAlign - (byteLengthToNeed % byteAlign);
    }
    // if (byteStride % 4 !== 0) {
    //   console.info('Padding bytes added, byteStride must be a multiple of 4.');
    //   byteStride += 4 - (byteStride % 4);
    // }

    const bufferView = new BufferView({buffer: this, byteOffset: this.__takenBytesIndex, byteLength: byteLengthToNeed, raw: this.__raw, isAoS: isAoS});
    bufferView.byteStride = byteStride;
    this.__takenBytesIndex += Uint8Array.BYTES_PER_ELEMENT * byteLengthToNeed;

    this.__bufferViews.push(bufferView);

    return bufferView;
  }

  takeBufferViewWithByteOffset({byteLengthToNeed, byteStride, byteOffset, isAoS} :
    {byteLengthToNeed: Byte, byteStride: Byte, byteOffset: Byte, isAoS: boolean}) {
    // if (byteLengthToNeed % 4 !== 0) {
    //   console.info('Padding bytes added because byteLengthToNeed must be a multiple of 4.');
    //   byteLengthToNeed += 4 - (byteLengthToNeed % 4);
    // }
    // if (byteStride % 4 !== 0) {
    //   console.info('Padding bytes added, byteStride must be a multiple of 4.');
    //   byteStride += 4 - (byteStride % 4);
    // }

    const bufferView = new BufferView({buffer: this, byteOffset: byteOffset + this.__byteOffset, byteLength: byteLengthToNeed, raw: this.__raw, isAoS: isAoS});

    const takenBytesIndex = Uint8Array.BYTES_PER_ELEMENT * byteLengthToNeed + byteOffset + this.__byteOffset;
    if (this.__takenBytesIndex < takenBytesIndex) {
      this.__takenBytesIndex = takenBytesIndex;
    }

    bufferView.byteStride = byteStride;

    this.__bufferViews.push(bufferView);

    return bufferView;
  }

  _addTakenByteIndex(value: Byte) {
    this.__takenBytesIndex += value;
  }

  get byteLength() {
    return this.__byteLength;
  }

  get takenSizeInByte() {
    return this.__takenBytesIndex;
  }

  get byteOffsetInRawArrayBuffer() {
    return this.__byteOffset;
  }

}
