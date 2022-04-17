import { Buffer } from '../memory/Buffer';
import {CompositionTypeEnum} from '../definitions/CompositionType';
import {ComponentTypeEnum} from '../definitions/ComponentType';
import { Accessor } from './Accessor';
import {Byte, Count, Size} from '../../types/CommonTypes';
import { Err, IResult, Ok } from '../misc';

export class BufferView {
  private __buffer: Buffer;
  private __byteOffsetInRawArrayBufferOfBuffer: Byte;
  private __byteOffsetInBuffer: Byte;
  private __byteLength: Byte;
  private __defaultByteStride: Byte = 0;
  private __takenByte: Byte = 0;
  private __takenAccessorCount = 0;
  private __raw: ArrayBuffer;
  private __accessors: Array<Accessor> = [];

  constructor({
    buffer,
    byteOffsetInBuffer,
    defaultByteStride,
    byteLength,
    raw,
  }: {
    buffer: Buffer;
    byteOffsetInBuffer: Byte;
    defaultByteStride: Byte;
    byteLength: Byte;
    raw: ArrayBuffer;
  }) {
    this.__buffer = buffer;
    this.__byteOffsetInBuffer = byteOffsetInBuffer;
    this.__byteOffsetInRawArrayBufferOfBuffer =
      buffer.byteOffsetInRawArrayBuffer + byteOffsetInBuffer;
    this.__byteLength = byteLength;
    this.__defaultByteStride = defaultByteStride;
    this.__raw = raw;
  }

  get defaultByteStride() {
    return this.__defaultByteStride;
  }

  get byteLength() {
    return this.__byteLength;
  }

  /**
   * byteOffset in Buffer (includes byteOffset of Buffer in it's inner arraybuffer)
   */
  get byteOffsetInBuffer(): Byte {
    return (
      this.__byteOffsetInRawArrayBufferOfBuffer -
      this.__buffer.byteOffsetInRawArrayBuffer
    );
  }

  /**
   * byteOffset in Buffer (includes byteOffset of Buffer in it's inner arraybuffer)
   */
  get byteOffsetInRawArrayBufferOfBuffer() {
    return this.__byteOffsetInRawArrayBufferOfBuffer;
  }

  get buffer(): Buffer {
    return this.__buffer;
  }

  get isSoA() {
    return !this.isAoS;
  }

  get isAoS() {
    for (const accessor of this.__accessors) {
      if (accessor.isAoS) {
        return true;
      }
    }
    return false;
  }

  /**
   * get memory buffer as Uint8Array of this BufferView memory area data
   */
  getUint8Array(): Uint8Array {
    return new Uint8Array(
      this.__raw,
      this.__byteOffsetInRawArrayBufferOfBuffer,
      this.__byteLength
    );
  }

  takeAccessor({
    compositionType,
    componentType,
    count,
    byteStride = this.defaultByteStride,
    max,
    min,
    arrayLength = 1,
    normalized = false,
  }: {
    compositionType: CompositionTypeEnum;
    componentType: ComponentTypeEnum;
    count: Count;
    byteStride?: Byte;
    max?: number[];
    min?: number[];
    arrayLength?: Size;
    normalized?: boolean;
  }): IResult<Accessor, undefined> {

    const accessor = this.__takeAccessorInner({
      compositionType,
      componentType,
      count,
      byteStride,
      max,
      min,
      normalized,
      arrayLength,
    });

    return accessor;
  }

  takeAccessorWithByteOffset({
    compositionType,
    componentType,
    count,
    byteOffsetInBufferView,
    byteStride = this.defaultByteStride,
    max,
    min,
    normalized = false,
  }: {
    compositionType: CompositionTypeEnum;
    componentType: ComponentTypeEnum;
    count: Count;
    byteOffsetInBufferView: Byte;
    byteStride?: Byte;
    max?: number[];
    min?: number[];
    normalized?: boolean;
  }): IResult<Accessor, undefined> {
    const accessor = this.__takeAccessorInnerWithByteOffset({
      compositionType,
      componentType,
      count,
      byteStride,
      byteOffsetInBufferView,
      max,
      min,
      normalized,
    });

    return accessor;
  }

  private __takeAccessorInner({
    compositionType,
    componentType,
    count,
    byteStride,
    max,
    min,
    arrayLength,
    normalized,
  }: {
    compositionType: CompositionTypeEnum;
    componentType: ComponentTypeEnum;
    count: Count;
    byteStride: Byte;
    max?: number[];
    min?: number[];
    arrayLength: Size;
    normalized: boolean;
  }): IResult<Accessor, undefined> {
    const byteOffsetInBufferView = this.__takenByte;
    let actualByteStride = byteStride;
    if (actualByteStride === 0) {
      actualByteStride =
        compositionType.getNumberOfComponents() *
        componentType.getSizeInBytes() *
        arrayLength;
    }

    if (this.__takenByte + actualByteStride * count > this.byteLength) {
      const message = `The size of the Accessor you are trying to take exceeds the byte length left in the BufferView.
BufferView.byteLength: ${this.byteLength}, BufferView.takenSizeInByte: ${this.__takenByte}, Accessor.byteStride: ${byteStride}, Accessor.count: ${count};
byteSizeToTake: ${actualByteStride * count}, the byte length left in the Buffer: ${this.byteLength - this.__takenByte}`;
      return new Err({
        message,
        error: undefined,
      });
    }

    const accessor = new Accessor({
      bufferView: this,
      byteOffsetInBufferView: byteOffsetInBufferView,
      compositionType,
      componentType,
      byteStride,
      count,
      raw: this.__raw,
      max,
      min,
      arrayLength,
      normalized,
    });

    this.__accessors.push(accessor);

    this.__takenByte += actualByteStride * count;

    return new Ok(accessor);
  }

  private __takeAccessorInnerWithByteOffset({
    compositionType,
    componentType,
    count,
    byteStride,
    byteOffsetInBufferView,
    max,
    min,
    normalized,
  }: {
    compositionType: CompositionTypeEnum;
    componentType: ComponentTypeEnum;
    count: Count;
    byteStride: Byte;
    byteOffsetInBufferView: Byte;
    max?: number[];
    min?: number[];
    normalized: boolean;
  }): IResult<Accessor, undefined> {

    if (this.__takenByte + byteStride * count > this.byteLength) {
      const message = `The size of the Accessor you are trying to take exceeds the byte length left in the BufferView.
BufferView.byteLength: ${this.byteLength}, BufferView.takenSizeInByte: ${this.__takenByte}, Accessor.byteStride: ${byteStride}, Accessor.count: ${count};
byteSizeToTake: ${byteStride * count}, the byte length left in the Buffer: ${this.byteLength - this.__takenByte}`;
      return new Err({
        message,
        error: undefined,
      });
    }

    const accessor = new Accessor({
      bufferView: this,
      byteOffsetInBufferView,
      compositionType,
      componentType,
      byteStride,
      count,
      raw: this.__raw,
      max,
      min,
      arrayLength: 1,
      normalized,
    });

    this.__accessors.push(accessor);

    return new Ok(accessor);
  }

  isSame(rnBufferView: BufferView) {
    return (
      this.byteLength === rnBufferView.byteLength &&
      this.byteOffsetInRawArrayBufferOfBuffer ===
        rnBufferView.byteOffsetInRawArrayBufferOfBuffer &&
      this.defaultByteStride === rnBufferView.defaultByteStride &&
      this.buffer.getArrayBuffer() === rnBufferView.buffer.getArrayBuffer()
    );
  }
}
