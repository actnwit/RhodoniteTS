import RnObject from "../core/Object";
import BufferView from "./BufferView";

export default class Buffer extends RnObject {
  private __byteLength: Size = 0;
  private __raw: ArrayBuffer;
  private __name: string = '';
  private __takenBytesIndex: Byte = 0;

  constructor({byteLength, arrayBuffer, name} : {byteLength: Size, arrayBuffer: ArrayBuffer, name: string}) {
    super();
    this.__name = this.__name;
    this.__byteLength = this.__byteLength;
    this.__raw = arrayBuffer;
  }

  set name(str) {
    this.__name = str;
  }

  get name() {
    return this.__name;
  }

  get raw() {
    return this.__raw;
  }

  /*
  takeAsFloat64Array(countsOfElement: Count) {
    const array = new Float64Array(this.__raw, this.__takenBytesIndex, countsOfElement);
    this.__takenBytesIndex += Uint8Array.BYTES_PER_ELEMENT * countsOfElement;
    return array;
  }
  */
  takeBufferView(byteLengthToNeed: Byte, byteStride: Byte = 0) {
    if (byteLengthToNeed % 4 !== 0) {
      console.error('Because of memory alignment constraints, byteLengthToNeed must be a multiple of 4.');
    }
    if (byteStride % 4 !== 0) {
      console.error('Because of memory alignment constraints, byteStride must be a multiple of 4.');
    }
    const array = new Uint8Array(this.__raw, this.__takenBytesIndex, byteLengthToNeed);

    const bufferView = new BufferView({buffer: this, byteOffset: this.__takenBytesIndex, byteLength: byteLengthToNeed, raw: array});
    bufferView.byteStride = byteStride;

    this.__takenBytesIndex += Uint8Array.BYTES_PER_ELEMENT * byteLengthToNeed;

    return bufferView;
  }
}
