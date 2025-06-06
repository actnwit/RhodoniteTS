import { BufferView } from './BufferView';
import type { Byte, TypedArray } from '../../types/CommonTypes';
import { CompositionType, type CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import { ComponentType, type ComponentTypeEnum } from '../../foundation/definitions/ComponentType';

import { DataUtil } from '../misc/DataUtil';
import { Err, Ok, type Result } from '../misc/Result';
import { Logger } from '../misc/Logger';

/**
 * A Buffer class that manages memory allocation and provides BufferView creation functionality.
 * This class wraps an ArrayBuffer and manages byte allocation with alignment considerations.
 * It tracks the used bytes and provides methods to create BufferView instances from the underlying buffer.
 *
 * @example
 * ```typescript
 * const buffer = new Buffer({
 *   byteLength: 1024,
 *   buffer: new ArrayBuffer(1024),
 *   name: 'MyBuffer',
 *   byteAlign: 4
 * });
 *
 * const bufferViewResult = buffer.takeBufferView({
 *   byteLengthToNeed: 64,
 *   byteStride: 16
 * });
 * ```
 */
export class Buffer {
  private __byteLength: Byte = 0;
  private __byteOffset: Byte = 0;
  private __takenBytesIndex: Byte = 0;
  private __byteAlign: Byte;
  private __raw: ArrayBuffer;
  private __name = '';
  private __bufferViews: Array<BufferView> = [];

  /**
   * Creates a new Buffer instance.
   *
   * @param options - Configuration object for the buffer
   * @param options.byteLength - The total byte length of the buffer
   * @param options.buffer - The underlying ArrayBuffer or Uint8Array to wrap
   * @param options.name - A descriptive name for the buffer
   * @param options.byteAlign - The byte alignment requirement for memory allocation
   */
  constructor({
    byteLength,
    buffer,
    name,
    byteAlign,
  }: {
    byteLength: Byte;
    buffer: ArrayBuffer;
    name: string;
    byteAlign: Byte;
  }) {
    this.__name = name;
    this.__byteLength = byteLength;
    this.__byteAlign = byteAlign;

    if (buffer instanceof Uint8Array) {
      this.__raw = buffer.buffer as ArrayBuffer;
      this.__byteOffset = buffer.byteOffset;
    } else {
      this.__raw = buffer;
    }
  }

  /**
   * Sets the name of the buffer.
   *
   * @param str - The new name for the buffer
   */
  set name(str) {
    this.__name = str;
  }

  /**
   * Gets the name of the buffer.
   *
   * @returns The current name of the buffer
   */
  get name() {
    return this.__name;
  }

  /**
   * Gets the underlying ArrayBuffer.
   *
   * @returns The raw ArrayBuffer instance
   */
  getArrayBuffer() {
    return this.__raw;
  }

  /**
   * Calculates padding bytes needed for proper alignment.
   *
   * @param byteLengthToNeed - The number of bytes that need to be allocated
   * @param byteAlign - The alignment requirement in bytes
   * @returns The number of padding bytes needed
   * @private
   */
  private __padding(byteLengthToNeed: Byte, byteAlign: Byte) {
    const paddingSize = DataUtil.calcPaddingBytes(byteLengthToNeed, byteAlign);
    if (paddingSize > 0) {
      Logger.info('Padding bytes added to takenBytesIndex.');
    }
    return paddingSize;
  }

  /**
   * Creates a new BufferView from the available space in this buffer.
   * This method allocates a portion of the buffer and returns a BufferView that provides
   * typed access to that memory region.
   *
   * @param options - Configuration for the BufferView to create
   * @param options.byteLengthToNeed - The number of bytes needed for the BufferView
   * @param options.byteStride - The stride between elements in bytes
   * @returns A Result containing either the created BufferView or an error with buffer state information
   *
   * @example
   * ```typescript
   * const result = buffer.takeBufferView({
   *   byteLengthToNeed: 256,
   *   byteStride: 16
   * });
   *
   * if (result.isOk()) {
   *   const bufferView = result.get();
   *   // Use the bufferView...
   * }
   * ```
   */
  takeBufferView({
    byteLengthToNeed,
    byteStride,
  }: {
    byteLengthToNeed: Byte;
    byteStride: Byte;
  }): Result<
    BufferView,
    {
      'Buffer.byteLength': Byte;
      'Buffer.takenSizeInByte': Byte;
    }
  > {
    // const byteAlign = this.__byteAlign;
    // const paddingBytes = this.__padding(byteLengthToNeed, byteAlign);

    // const byteSizeToTake = byteLengthToNeed + paddingBytes;
    const byteSizeToTake = byteLengthToNeed; // + paddingBytes;
    // byteSizeToTake = DataUtil.addPaddingBytes(byteSizeToTake, this.__byteAlign);

    if (byteSizeToTake + this.__takenBytesIndex > this.byteLength) {
      const message = `The size of the BufferView you are trying to take exceeds the byte length left in the Buffer.
Buffer.byteLength: ${this.byteLength}, Buffer.takenSizeInByte: ${this.takenSizeInByte},
byteSizeToTake: ${byteSizeToTake}, the byte length left in the Buffer: ${this.__byteLength - this.__takenBytesIndex}`;
      // console.error(message);
      return new Err({
        message,
        error: {
          'Buffer.byteLength': this.takenSizeInByte,
          'Buffer.takenSizeInByte': this.takenSizeInByte,
        },
      });
    }

    const bufferView = new BufferView({
      buffer: this,
      byteOffsetInBuffer: this.__takenBytesIndex,
      defaultByteStride: byteStride,
      byteLength: byteSizeToTake,
      raw: this.__raw,
    });
    this.__takenBytesIndex += byteSizeToTake;
    this.__takenBytesIndex = DataUtil.addPaddingBytes(this.__takenBytesIndex, this.__byteAlign);
    this.__bufferViews.push(bufferView);

    return new Ok(bufferView);
  }

  /**
   * Creates a new BufferView at a specific byte offset within this buffer.
   * Unlike takeBufferView, this method allows you to specify the exact offset
   * where the BufferView should be created, which is useful for accessing
   * pre-defined memory layouts.
   *
   * @param options - Configuration for the BufferView to create
   * @param options.byteLengthToNeed - The number of bytes needed for the BufferView
   * @param options.byteStride - The stride between elements in bytes
   * @param options.byteOffset - The specific byte offset within the buffer where the BufferView should start
   * @returns A Result containing either the created BufferView or an error
   *
   * @example
   * ```typescript
   * const result = buffer.takeBufferViewWithByteOffset({
   *   byteLengthToNeed: 128,
   *   byteStride: 8,
   *   byteOffset: 256
   * });
   * ```
   */
  takeBufferViewWithByteOffset({
    byteLengthToNeed,
    byteStride,
    byteOffset,
  }: {
    byteLengthToNeed: Byte;
    byteStride: Byte;
    byteOffset: Byte;
  }): Result<BufferView, undefined> {
    const byteSizeToTake = byteLengthToNeed;
    if (byteSizeToTake + byteOffset > this.byteLength) {
      const message = `The size of the BufferView you are trying to take exceeds the byte length left in the Buffer.
Buffer.byteLength: ${this.byteLength}, Buffer.takenSizeInByte: ${this.takenSizeInByte},
byteSizeToTake: ${byteLengthToNeed}, the byte length left in the Buffer: ${this.__byteLength - this.__takenBytesIndex}`;
      return new Err({
        message,
        error: undefined,
      });
    }

    const bufferView = new BufferView({
      buffer: this,
      byteOffsetInBuffer: byteOffset,
      defaultByteStride: byteStride,
      byteLength: byteLengthToNeed,
      raw: this.__raw,
    });

    const takenBytesIndex = Uint8Array.BYTES_PER_ELEMENT * byteLengthToNeed + byteOffset;
    if (this.__takenBytesIndex < takenBytesIndex) {
      this.__takenBytesIndex = takenBytesIndex;
    }

    this.__bufferViews.push(bufferView);

    return new Ok(bufferView);
  }

  /**
   * Manually adds to the taken byte index counter.
   * This is an internal method used to track memory usage.
   *
   * @param value - The number of bytes to add to the taken bytes index
   * @internal
   */
  _addTakenByteIndex(value: Byte) {
    this.__takenBytesIndex += value;
  }

  /**
   * Gets the total byte length of the buffer.
   *
   * @returns The total capacity of the buffer in bytes
   */
  get byteLength() {
    return this.__byteLength;
  }

  /**
   * Gets the number of bytes currently allocated from this buffer.
   *
   * @returns The number of bytes that have been taken from the buffer
   */
  get takenSizeInByte() {
    return this.__takenBytesIndex;
  }

  /**
   * Gets the byte offset of this buffer within the raw ArrayBuffer.
   * This is useful when the buffer is a view into a larger ArrayBuffer.
   *
   * @returns The byte offset within the raw ArrayBuffer
   */
  get byteOffsetInRawArrayBuffer() {
    return this.__byteOffset;
  }

  /**
   * Creates a typed array view into the buffer at a specific offset.
   * This method provides direct access to the buffer data as a typed array,
   * which is useful for reading and writing numeric data efficiently.
   *
   * @param offset4bytesUnit - The offset in 4-byte units from the start of the buffer
   * @param compositionType - The composition type (scalar, vector, matrix, etc.)
   * @param componentType - The component type (float, int, etc.)
   * @param length - The number of elements to include in the typed array (default: 100)
   * @returns A typed array view into the buffer data
   *
   * @example
   * ```typescript
   * const floatArray = buffer.getTypedArray(
   *   0,
   *   CompositionType.Vec3,
   *   ComponentType.Float,
   *   10
   * );
   * ```
   */
  getTypedArray(
    offset4bytesUnit: number,
    compositionType: CompositionTypeEnum,
    componentType: ComponentTypeEnum,
    length = 100
  ) {
    let ret: TypedArray;
    const typedArray = ComponentType.toTypedArray(componentType)!;
    if (typedArray === undefined) {
      Logger.warn('componentType is Invalid');
    }
    if (CompositionType.isArray(compositionType)) {
      ret = new typedArray(this.__raw, this.__byteOffset + offset4bytesUnit * 4, length);
    } else {
      ret = new typedArray(this.__raw, this.__byteOffset + offset4bytesUnit * 4, 1);
    }

    return ret;
  }

  /**
   * Checks if this buffer uses the same underlying ArrayBuffer as another buffer.
   * This is useful for determining if two Buffer instances share the same memory.
   *
   * @param buffer - The other buffer to compare with
   * @returns True if both buffers use the same underlying ArrayBuffer, false otherwise
   *
   * @example
   * ```typescript
   * const buffer1 = new Buffer({...});
   * const buffer2 = new Buffer({...});
   *
   * if (buffer1.isSame(buffer2)) {
   *   console.log('Buffers share the same memory');
   * }
   * ```
   */
  isSame(buffer: Buffer): boolean {
    return this.__raw === buffer.__raw;
  }
}
