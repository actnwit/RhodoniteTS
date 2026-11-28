// src/foundation/memory/Buffer.ts
import { ComponentType } from "../definitions/ComponentType.js";
import { CompositionType } from "../definitions/CompositionType.js";
import { BufferUse } from "../definitions/BufferUse.js";
import { DataUtil } from "../misc/DataUtil.js";
import { Logger } from "../misc/Logger.js";
import { Err, Ok } from "../misc/Result.js";
import { BufferView } from "./BufferView.js";
var Buffer = class {
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
    bufferUsage,
    indexOfTheBufferUsage
  }) {
    this.su = 0;
    this.tu = 0;
    this.ru = 0;
    this.uu = "";
    this.ts = [];
    this.wu = BufferUse.CPUGeneric;
    this.xu = 0;
    this.uu = name;
    this.su = byteLength;
    this.vu = byteAlign;
    this.wu = bufferUsage;
    this.xu = indexOfTheBufferUsage;
    if (buffer instanceof Uint8Array) {
      if (!(buffer.buffer instanceof ArrayBuffer)) {
        throw new Error("SharedArrayBuffer is not supported in this code path.");
      }
      this.Lj = buffer.buffer;
      this.tu = buffer.byteOffset;
    } else {
      this.Lj = buffer;
    }
  }
  /**
   * Sets the name of the buffer.
   *
   * @param str - The new name for the buffer
   */
  set name(str) {
    this.uu = str;
  }
  /**
   * Gets the name of the buffer.
   *
   * @returns The current name of the buffer
   */
  get name() {
    return this.uu;
  }
  /**
   * Gets the underlying ArrayBuffer.
   *
   * @returns The raw ArrayBuffer instance
   */
  getArrayBuffer() {
    return this.Lj;
  }
  /**
   * Calculates padding bytes needed for proper alignment.
   *
   * @param byteLengthToNeed - The number of bytes that need to be allocated
   * @param byteAlign - The alignment requirement in bytes
   * @returns The number of padding bytes needed
   * @private
   */
  yu(byteLengthToNeed, byteAlign) {
    const paddingSize = DataUtil.calcPaddingBytes(byteLengthToNeed, byteAlign);
    if (paddingSize > 0) {
      Logger.default.info("Padding bytes added to takenBytesIndex.");
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
  takeBufferView({ byteLengthToNeed, byteStride }) {
    const byteSizeToTake = byteLengthToNeed;
    if (byteSizeToTake + this.ru > this.byteLength) {
      const message = `The size of the BufferView you are trying to take exceeds the byte length left in the Buffer.
Buffer.byteLength: ${this.byteLength}, Buffer.takenSizeInByte: ${this.takenSizeInByte},
byteSizeToTake: ${byteSizeToTake}, the byte length left in the Buffer: ${this.su - this.ru}`;
      return new Err({
        message,
        error: {
          "Buffer.byteLength": this.takenSizeInByte,
          "Buffer.takenSizeInByte": this.takenSizeInByte
        }
      });
    }
    const bufferView = new BufferView({
      buffer: this,
      byteOffsetInBuffer: this.ru,
      defaultByteStride: byteStride,
      byteLength: byteSizeToTake,
      raw: this.Lj
    });
    this.ru += byteSizeToTake;
    this.ru = DataUtil.addPaddingBytes(this.ru, this.vu);
    this.ts.push(bufferView);
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
    byteOffset
  }) {
    const byteSizeToTake = byteLengthToNeed;
    if (byteSizeToTake + byteOffset > this.byteLength) {
      const message = `The size of the BufferView you are trying to take exceeds the byte length left in the Buffer.
Buffer.byteLength: ${this.byteLength}, Buffer.takenSizeInByte: ${this.takenSizeInByte},
byteSizeToTake: ${byteLengthToNeed}, the byte length left in the Buffer: ${this.su - this.ru}`;
      return new Err({
        message,
        error: void 0
      });
    }
    const bufferView = new BufferView({
      buffer: this,
      byteOffsetInBuffer: byteOffset,
      defaultByteStride: byteStride,
      byteLength: byteLengthToNeed,
      raw: this.Lj
    });
    const takenBytesIndex = Uint8Array.BYTES_PER_ELEMENT * byteLengthToNeed + byteOffset;
    if (this.ru < takenBytesIndex) {
      this.ru = takenBytesIndex;
    }
    this.ts.push(bufferView);
    return new Ok(bufferView);
  }
  /**
   * Manually adds to the taken byte index counter.
   * This is an internal method used to track memory usage.
   *
   * @param value - The number of bytes to add to the taken bytes index
   * @internal
   */
  _addTakenByteIndex(value) {
    this.ru += value;
  }
  /**
   * Gets the total byte length of the buffer.
   *
   * @returns The total capacity of the buffer in bytes
   */
  get byteLength() {
    return this.su;
  }
  /**
   * Gets the number of bytes currently allocated from this buffer.
   *
   * @returns The number of bytes that have been taken from the buffer
   */
  get takenSizeInByte() {
    return this.ru;
  }
  /**
   * Gets the byte offset of this buffer within the raw ArrayBuffer.
   * This is useful when the buffer is a view into a larger ArrayBuffer.
   *
   * @returns The byte offset within the raw ArrayBuffer
   */
  get byteOffsetInRawArrayBuffer() {
    return this.tu;
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
  getTypedArray(offset4bytesUnit, compositionType, componentType, length = 100) {
    let ret;
    const typedArray = ComponentType.toTypedArray(componentType);
    if (typedArray === void 0) {
      Logger.default.warn("componentType is Invalid");
    }
    if (CompositionType.isArray(compositionType)) {
      ret = new typedArray(this.Lj, this.tu + offset4bytesUnit * 4, length);
    } else {
      ret = new typedArray(this.Lj, this.tu + offset4bytesUnit * 4, 1);
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
  isSame(buffer) {
    return this.Lj === buffer.Lj;
  }
  get indexOfTheBufferUsage() {
    return this.xu;
  }
  get bufferUsage() {
    return this.wu;
  }
};
export {
  Buffer
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWVtb3J5L0J1ZmZlci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgQ29tcG9uZW50VHlwZSwgdHlwZSBDb21wb25lbnRUeXBlRW51bSB9IGZyb20gJy4uLy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvQ29tcG9uZW50VHlwZSc7XG5pbXBvcnQgeyBDb21wb3NpdGlvblR5cGUsIHR5cGUgQ29tcG9zaXRpb25UeXBlRW51bSB9IGZyb20gJy4uLy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvQ29tcG9zaXRpb25UeXBlJztcbmltcG9ydCB0eXBlIHsgQnl0ZSwgSW5kZXgsIFR5cGVkQXJyYXkgfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgeyBCdWZmZXJVc2UsIHR5cGUgQnVmZmVyVXNlRW51bSB9IGZyb20gJy4uL2RlZmluaXRpb25zL0J1ZmZlclVzZSc7XG5pbXBvcnQgeyBEYXRhVXRpbCB9IGZyb20gJy4uL21pc2MvRGF0YVV0aWwnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHsgRXJyLCBPaywgdHlwZSBSZXN1bHQgfSBmcm9tICcuLi9taXNjL1Jlc3VsdCc7XG5pbXBvcnQgeyBCdWZmZXJWaWV3IH0gZnJvbSAnLi9CdWZmZXJWaWV3JztcblxuLyoqXG4gKiBBIEJ1ZmZlciBjbGFzcyB0aGF0IG1hbmFnZXMgbWVtb3J5IGFsbG9jYXRpb24gYW5kIHByb3ZpZGVzIEJ1ZmZlclZpZXcgY3JlYXRpb24gZnVuY3Rpb25hbGl0eS5cbiAqIFRoaXMgY2xhc3Mgd3JhcHMgYW4gQXJyYXlCdWZmZXIgYW5kIG1hbmFnZXMgYnl0ZSBhbGxvY2F0aW9uIHdpdGggYWxpZ25tZW50IGNvbnNpZGVyYXRpb25zLlxuICogSXQgdHJhY2tzIHRoZSB1c2VkIGJ5dGVzIGFuZCBwcm92aWRlcyBtZXRob2RzIHRvIGNyZWF0ZSBCdWZmZXJWaWV3IGluc3RhbmNlcyBmcm9tIHRoZSB1bmRlcmx5aW5nIGJ1ZmZlci5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogY29uc3QgYnVmZmVyID0gbmV3IEJ1ZmZlcih7XG4gKiAgIGJ5dGVMZW5ndGg6IDEwMjQsXG4gKiAgIGJ1ZmZlcjogbmV3IEFycmF5QnVmZmVyKDEwMjQpLFxuICogICBuYW1lOiAnTXlCdWZmZXInLFxuICogICBieXRlQWxpZ246IDRcbiAqIH0pO1xuICpcbiAqIGNvbnN0IGJ1ZmZlclZpZXdSZXN1bHQgPSBidWZmZXIudGFrZUJ1ZmZlclZpZXcoe1xuICogICBieXRlTGVuZ3RoVG9OZWVkOiA2NCxcbiAqICAgYnl0ZVN0cmlkZTogMTZcbiAqIH0pO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBCdWZmZXIge1xuICBwcml2YXRlIF9fYnl0ZUxlbmd0aDogQnl0ZSA9IDA7XG4gIHByaXZhdGUgX19ieXRlT2Zmc2V0OiBCeXRlID0gMDtcbiAgcHJpdmF0ZSBfX3Rha2VuQnl0ZXNJbmRleDogQnl0ZSA9IDA7XG4gIHByaXZhdGUgX19ieXRlQWxpZ246IEJ5dGU7XG4gIHByaXZhdGUgX19yYXc6IEFycmF5QnVmZmVyO1xuICBwcml2YXRlIF9fbmFtZSA9ICcnO1xuICBwcml2YXRlIF9fYnVmZmVyVmlld3M6IEFycmF5PEJ1ZmZlclZpZXc+ID0gW107XG4gIHByaXZhdGUgX19idWZmZXJVc2FnZTogQnVmZmVyVXNlRW51bSA9IEJ1ZmZlclVzZS5DUFVHZW5lcmljO1xuICBwcml2YXRlIF9faW5kZXhPZlRoZUJ1ZmZlclVzYWdlOiBJbmRleCA9IDA7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgQnVmZmVyIGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIENvbmZpZ3VyYXRpb24gb2JqZWN0IGZvciB0aGUgYnVmZmVyXG4gICAqIEBwYXJhbSBvcHRpb25zLmJ5dGVMZW5ndGggLSBUaGUgdG90YWwgYnl0ZSBsZW5ndGggb2YgdGhlIGJ1ZmZlclxuICAgKiBAcGFyYW0gb3B0aW9ucy5idWZmZXIgLSBUaGUgdW5kZXJseWluZyBBcnJheUJ1ZmZlciBvciBVaW50OEFycmF5IHRvIHdyYXBcbiAgICogQHBhcmFtIG9wdGlvbnMubmFtZSAtIEEgZGVzY3JpcHRpdmUgbmFtZSBmb3IgdGhlIGJ1ZmZlclxuICAgKiBAcGFyYW0gb3B0aW9ucy5ieXRlQWxpZ24gLSBUaGUgYnl0ZSBhbGlnbm1lbnQgcmVxdWlyZW1lbnQgZm9yIG1lbW9yeSBhbGxvY2F0aW9uXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih7XG4gICAgYnl0ZUxlbmd0aCxcbiAgICBidWZmZXIsXG4gICAgbmFtZSxcbiAgICBieXRlQWxpZ24sXG4gICAgYnVmZmVyVXNhZ2UsXG4gICAgaW5kZXhPZlRoZUJ1ZmZlclVzYWdlLFxuICB9OiB7XG4gICAgYnl0ZUxlbmd0aDogQnl0ZTtcbiAgICBidWZmZXI6IEFycmF5QnVmZmVyIHwgVWludDhBcnJheTtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgYnl0ZUFsaWduOiBCeXRlO1xuICAgIGJ1ZmZlclVzYWdlOiBCdWZmZXJVc2VFbnVtO1xuICAgIGluZGV4T2ZUaGVCdWZmZXJVc2FnZTogSW5kZXg7XG4gIH0pIHtcbiAgICB0aGlzLl9fbmFtZSA9IG5hbWU7XG4gICAgdGhpcy5fX2J5dGVMZW5ndGggPSBieXRlTGVuZ3RoO1xuICAgIHRoaXMuX19ieXRlQWxpZ24gPSBieXRlQWxpZ247XG4gICAgdGhpcy5fX2J1ZmZlclVzYWdlID0gYnVmZmVyVXNhZ2U7XG4gICAgdGhpcy5fX2luZGV4T2ZUaGVCdWZmZXJVc2FnZSA9IGluZGV4T2ZUaGVCdWZmZXJVc2FnZTtcblxuICAgIGlmIChidWZmZXIgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XG4gICAgICBpZiAoIShidWZmZXIuYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU2hhcmVkQXJyYXlCdWZmZXIgaXMgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGNvZGUgcGF0aC4nKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19yYXcgPSBidWZmZXIuYnVmZmVyO1xuICAgICAgdGhpcy5fX2J5dGVPZmZzZXQgPSBidWZmZXIuYnl0ZU9mZnNldDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fX3JhdyA9IGJ1ZmZlcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbmFtZSBvZiB0aGUgYnVmZmVyLlxuICAgKlxuICAgKiBAcGFyYW0gc3RyIC0gVGhlIG5ldyBuYW1lIGZvciB0aGUgYnVmZmVyXG4gICAqL1xuICBzZXQgbmFtZShzdHIpIHtcbiAgICB0aGlzLl9fbmFtZSA9IHN0cjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBuYW1lIG9mIHRoZSBidWZmZXIuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50IG5hbWUgb2YgdGhlIGJ1ZmZlclxuICAgKi9cbiAgZ2V0IG5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19uYW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHVuZGVybHlpbmcgQXJyYXlCdWZmZXIuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSByYXcgQXJyYXlCdWZmZXIgaW5zdGFuY2VcbiAgICovXG4gIGdldEFycmF5QnVmZmVyKCkge1xuICAgIHJldHVybiB0aGlzLl9fcmF3O1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgcGFkZGluZyBieXRlcyBuZWVkZWQgZm9yIHByb3BlciBhbGlnbm1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSBieXRlTGVuZ3RoVG9OZWVkIC0gVGhlIG51bWJlciBvZiBieXRlcyB0aGF0IG5lZWQgdG8gYmUgYWxsb2NhdGVkXG4gICAqIEBwYXJhbSBieXRlQWxpZ24gLSBUaGUgYWxpZ25tZW50IHJlcXVpcmVtZW50IGluIGJ5dGVzXG4gICAqIEByZXR1cm5zIFRoZSBudW1iZXIgb2YgcGFkZGluZyBieXRlcyBuZWVkZWRcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX19wYWRkaW5nKGJ5dGVMZW5ndGhUb05lZWQ6IEJ5dGUsIGJ5dGVBbGlnbjogQnl0ZSkge1xuICAgIGNvbnN0IHBhZGRpbmdTaXplID0gRGF0YVV0aWwuY2FsY1BhZGRpbmdCeXRlcyhieXRlTGVuZ3RoVG9OZWVkLCBieXRlQWxpZ24pO1xuICAgIGlmIChwYWRkaW5nU2l6ZSA+IDApIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmluZm8oJ1BhZGRpbmcgYnl0ZXMgYWRkZWQgdG8gdGFrZW5CeXRlc0luZGV4LicpO1xuICAgIH1cbiAgICByZXR1cm4gcGFkZGluZ1NpemU7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBCdWZmZXJWaWV3IGZyb20gdGhlIGF2YWlsYWJsZSBzcGFjZSBpbiB0aGlzIGJ1ZmZlci5cbiAgICogVGhpcyBtZXRob2QgYWxsb2NhdGVzIGEgcG9ydGlvbiBvZiB0aGUgYnVmZmVyIGFuZCByZXR1cm5zIGEgQnVmZmVyVmlldyB0aGF0IHByb3ZpZGVzXG4gICAqIHR5cGVkIGFjY2VzcyB0byB0aGF0IG1lbW9yeSByZWdpb24uXG4gICAqXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gQ29uZmlndXJhdGlvbiBmb3IgdGhlIEJ1ZmZlclZpZXcgdG8gY3JlYXRlXG4gICAqIEBwYXJhbSBvcHRpb25zLmJ5dGVMZW5ndGhUb05lZWQgLSBUaGUgbnVtYmVyIG9mIGJ5dGVzIG5lZWRlZCBmb3IgdGhlIEJ1ZmZlclZpZXdcbiAgICogQHBhcmFtIG9wdGlvbnMuYnl0ZVN0cmlkZSAtIFRoZSBzdHJpZGUgYmV0d2VlbiBlbGVtZW50cyBpbiBieXRlc1xuICAgKiBAcmV0dXJucyBBIFJlc3VsdCBjb250YWluaW5nIGVpdGhlciB0aGUgY3JlYXRlZCBCdWZmZXJWaWV3IG9yIGFuIGVycm9yIHdpdGggYnVmZmVyIHN0YXRlIGluZm9ybWF0aW9uXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgcmVzdWx0ID0gYnVmZmVyLnRha2VCdWZmZXJWaWV3KHtcbiAgICogICBieXRlTGVuZ3RoVG9OZWVkOiAyNTYsXG4gICAqICAgYnl0ZVN0cmlkZTogMTZcbiAgICogfSk7XG4gICAqXG4gICAqIGlmIChyZXN1bHQuaXNPaygpKSB7XG4gICAqICAgY29uc3QgYnVmZmVyVmlldyA9IHJlc3VsdC5nZXQoKTtcbiAgICogICAvLyBVc2UgdGhlIGJ1ZmZlclZpZXcuLi5cbiAgICogfVxuICAgKiBgYGBcbiAgICovXG4gIHRha2VCdWZmZXJWaWV3KHsgYnl0ZUxlbmd0aFRvTmVlZCwgYnl0ZVN0cmlkZSB9OiB7IGJ5dGVMZW5ndGhUb05lZWQ6IEJ5dGU7IGJ5dGVTdHJpZGU6IEJ5dGUgfSk6IFJlc3VsdDxcbiAgICBCdWZmZXJWaWV3LFxuICAgIHtcbiAgICAgICdCdWZmZXIuYnl0ZUxlbmd0aCc6IEJ5dGU7XG4gICAgICAnQnVmZmVyLnRha2VuU2l6ZUluQnl0ZSc6IEJ5dGU7XG4gICAgfVxuICA+IHtcbiAgICAvLyBjb25zdCBieXRlQWxpZ24gPSB0aGlzLl9fYnl0ZUFsaWduO1xuICAgIC8vIGNvbnN0IHBhZGRpbmdCeXRlcyA9IHRoaXMuX19wYWRkaW5nKGJ5dGVMZW5ndGhUb05lZWQsIGJ5dGVBbGlnbik7XG5cbiAgICAvLyBjb25zdCBieXRlU2l6ZVRvVGFrZSA9IGJ5dGVMZW5ndGhUb05lZWQgKyBwYWRkaW5nQnl0ZXM7XG4gICAgY29uc3QgYnl0ZVNpemVUb1Rha2UgPSBieXRlTGVuZ3RoVG9OZWVkOyAvLyArIHBhZGRpbmdCeXRlcztcbiAgICAvLyBieXRlU2l6ZVRvVGFrZSA9IERhdGFVdGlsLmFkZFBhZGRpbmdCeXRlcyhieXRlU2l6ZVRvVGFrZSwgdGhpcy5fX2J5dGVBbGlnbik7XG5cbiAgICBpZiAoYnl0ZVNpemVUb1Rha2UgKyB0aGlzLl9fdGFrZW5CeXRlc0luZGV4ID4gdGhpcy5ieXRlTGVuZ3RoKSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gYFRoZSBzaXplIG9mIHRoZSBCdWZmZXJWaWV3IHlvdSBhcmUgdHJ5aW5nIHRvIHRha2UgZXhjZWVkcyB0aGUgYnl0ZSBsZW5ndGggbGVmdCBpbiB0aGUgQnVmZmVyLlxuQnVmZmVyLmJ5dGVMZW5ndGg6ICR7dGhpcy5ieXRlTGVuZ3RofSwgQnVmZmVyLnRha2VuU2l6ZUluQnl0ZTogJHt0aGlzLnRha2VuU2l6ZUluQnl0ZX0sXG5ieXRlU2l6ZVRvVGFrZTogJHtieXRlU2l6ZVRvVGFrZX0sIHRoZSBieXRlIGxlbmd0aCBsZWZ0IGluIHRoZSBCdWZmZXI6ICR7dGhpcy5fX2J5dGVMZW5ndGggLSB0aGlzLl9fdGFrZW5CeXRlc0luZGV4fWA7XG4gICAgICAvLyBjb25zb2xlLmVycm9yKG1lc3NhZ2UpO1xuICAgICAgcmV0dXJuIG5ldyBFcnIoe1xuICAgICAgICBtZXNzYWdlLFxuICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICdCdWZmZXIuYnl0ZUxlbmd0aCc6IHRoaXMudGFrZW5TaXplSW5CeXRlLFxuICAgICAgICAgICdCdWZmZXIudGFrZW5TaXplSW5CeXRlJzogdGhpcy50YWtlblNpemVJbkJ5dGUsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBidWZmZXJWaWV3ID0gbmV3IEJ1ZmZlclZpZXcoe1xuICAgICAgYnVmZmVyOiB0aGlzLFxuICAgICAgYnl0ZU9mZnNldEluQnVmZmVyOiB0aGlzLl9fdGFrZW5CeXRlc0luZGV4LFxuICAgICAgZGVmYXVsdEJ5dGVTdHJpZGU6IGJ5dGVTdHJpZGUsXG4gICAgICBieXRlTGVuZ3RoOiBieXRlU2l6ZVRvVGFrZSxcbiAgICAgIHJhdzogdGhpcy5fX3JhdyxcbiAgICB9KTtcbiAgICB0aGlzLl9fdGFrZW5CeXRlc0luZGV4ICs9IGJ5dGVTaXplVG9UYWtlO1xuICAgIHRoaXMuX190YWtlbkJ5dGVzSW5kZXggPSBEYXRhVXRpbC5hZGRQYWRkaW5nQnl0ZXModGhpcy5fX3Rha2VuQnl0ZXNJbmRleCwgdGhpcy5fX2J5dGVBbGlnbik7XG4gICAgdGhpcy5fX2J1ZmZlclZpZXdzLnB1c2goYnVmZmVyVmlldyk7XG5cbiAgICByZXR1cm4gbmV3IE9rKGJ1ZmZlclZpZXcpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgQnVmZmVyVmlldyBhdCBhIHNwZWNpZmljIGJ5dGUgb2Zmc2V0IHdpdGhpbiB0aGlzIGJ1ZmZlci5cbiAgICogVW5saWtlIHRha2VCdWZmZXJWaWV3LCB0aGlzIG1ldGhvZCBhbGxvd3MgeW91IHRvIHNwZWNpZnkgdGhlIGV4YWN0IG9mZnNldFxuICAgKiB3aGVyZSB0aGUgQnVmZmVyVmlldyBzaG91bGQgYmUgY3JlYXRlZCwgd2hpY2ggaXMgdXNlZnVsIGZvciBhY2Nlc3NpbmdcbiAgICogcHJlLWRlZmluZWQgbWVtb3J5IGxheW91dHMuXG4gICAqXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gQ29uZmlndXJhdGlvbiBmb3IgdGhlIEJ1ZmZlclZpZXcgdG8gY3JlYXRlXG4gICAqIEBwYXJhbSBvcHRpb25zLmJ5dGVMZW5ndGhUb05lZWQgLSBUaGUgbnVtYmVyIG9mIGJ5dGVzIG5lZWRlZCBmb3IgdGhlIEJ1ZmZlclZpZXdcbiAgICogQHBhcmFtIG9wdGlvbnMuYnl0ZVN0cmlkZSAtIFRoZSBzdHJpZGUgYmV0d2VlbiBlbGVtZW50cyBpbiBieXRlc1xuICAgKiBAcGFyYW0gb3B0aW9ucy5ieXRlT2Zmc2V0IC0gVGhlIHNwZWNpZmljIGJ5dGUgb2Zmc2V0IHdpdGhpbiB0aGUgYnVmZmVyIHdoZXJlIHRoZSBCdWZmZXJWaWV3IHNob3VsZCBzdGFydFxuICAgKiBAcmV0dXJucyBBIFJlc3VsdCBjb250YWluaW5nIGVpdGhlciB0aGUgY3JlYXRlZCBCdWZmZXJWaWV3IG9yIGFuIGVycm9yXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgcmVzdWx0ID0gYnVmZmVyLnRha2VCdWZmZXJWaWV3V2l0aEJ5dGVPZmZzZXQoe1xuICAgKiAgIGJ5dGVMZW5ndGhUb05lZWQ6IDEyOCxcbiAgICogICBieXRlU3RyaWRlOiA4LFxuICAgKiAgIGJ5dGVPZmZzZXQ6IDI1NlxuICAgKiB9KTtcbiAgICogYGBgXG4gICAqL1xuICB0YWtlQnVmZmVyVmlld1dpdGhCeXRlT2Zmc2V0KHtcbiAgICBieXRlTGVuZ3RoVG9OZWVkLFxuICAgIGJ5dGVTdHJpZGUsXG4gICAgYnl0ZU9mZnNldCxcbiAgfToge1xuICAgIGJ5dGVMZW5ndGhUb05lZWQ6IEJ5dGU7XG4gICAgYnl0ZVN0cmlkZTogQnl0ZTtcbiAgICBieXRlT2Zmc2V0OiBCeXRlO1xuICB9KTogUmVzdWx0PEJ1ZmZlclZpZXcsIHVuZGVmaW5lZD4ge1xuICAgIGNvbnN0IGJ5dGVTaXplVG9UYWtlID0gYnl0ZUxlbmd0aFRvTmVlZDtcbiAgICBpZiAoYnl0ZVNpemVUb1Rha2UgKyBieXRlT2Zmc2V0ID4gdGhpcy5ieXRlTGVuZ3RoKSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gYFRoZSBzaXplIG9mIHRoZSBCdWZmZXJWaWV3IHlvdSBhcmUgdHJ5aW5nIHRvIHRha2UgZXhjZWVkcyB0aGUgYnl0ZSBsZW5ndGggbGVmdCBpbiB0aGUgQnVmZmVyLlxuQnVmZmVyLmJ5dGVMZW5ndGg6ICR7dGhpcy5ieXRlTGVuZ3RofSwgQnVmZmVyLnRha2VuU2l6ZUluQnl0ZTogJHt0aGlzLnRha2VuU2l6ZUluQnl0ZX0sXG5ieXRlU2l6ZVRvVGFrZTogJHtieXRlTGVuZ3RoVG9OZWVkfSwgdGhlIGJ5dGUgbGVuZ3RoIGxlZnQgaW4gdGhlIEJ1ZmZlcjogJHt0aGlzLl9fYnl0ZUxlbmd0aCAtIHRoaXMuX190YWtlbkJ5dGVzSW5kZXh9YDtcbiAgICAgIHJldHVybiBuZXcgRXJyKHtcbiAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgZXJyb3I6IHVuZGVmaW5lZCxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1ZmZlclZpZXcgPSBuZXcgQnVmZmVyVmlldyh7XG4gICAgICBidWZmZXI6IHRoaXMsXG4gICAgICBieXRlT2Zmc2V0SW5CdWZmZXI6IGJ5dGVPZmZzZXQsXG4gICAgICBkZWZhdWx0Qnl0ZVN0cmlkZTogYnl0ZVN0cmlkZSxcbiAgICAgIGJ5dGVMZW5ndGg6IGJ5dGVMZW5ndGhUb05lZWQsXG4gICAgICByYXc6IHRoaXMuX19yYXcsXG4gICAgfSk7XG5cbiAgICBjb25zdCB0YWtlbkJ5dGVzSW5kZXggPSBVaW50OEFycmF5LkJZVEVTX1BFUl9FTEVNRU5UICogYnl0ZUxlbmd0aFRvTmVlZCArIGJ5dGVPZmZzZXQ7XG4gICAgaWYgKHRoaXMuX190YWtlbkJ5dGVzSW5kZXggPCB0YWtlbkJ5dGVzSW5kZXgpIHtcbiAgICAgIHRoaXMuX190YWtlbkJ5dGVzSW5kZXggPSB0YWtlbkJ5dGVzSW5kZXg7XG4gICAgfVxuXG4gICAgdGhpcy5fX2J1ZmZlclZpZXdzLnB1c2goYnVmZmVyVmlldyk7XG5cbiAgICByZXR1cm4gbmV3IE9rKGJ1ZmZlclZpZXcpO1xuICB9XG5cbiAgLyoqXG4gICAqIE1hbnVhbGx5IGFkZHMgdG8gdGhlIHRha2VuIGJ5dGUgaW5kZXggY291bnRlci5cbiAgICogVGhpcyBpcyBhbiBpbnRlcm5hbCBtZXRob2QgdXNlZCB0byB0cmFjayBtZW1vcnkgdXNhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBudW1iZXIgb2YgYnl0ZXMgdG8gYWRkIHRvIHRoZSB0YWtlbiBieXRlcyBpbmRleFxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9hZGRUYWtlbkJ5dGVJbmRleCh2YWx1ZTogQnl0ZSkge1xuICAgIHRoaXMuX190YWtlbkJ5dGVzSW5kZXggKz0gdmFsdWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdG90YWwgYnl0ZSBsZW5ndGggb2YgdGhlIGJ1ZmZlci5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHRvdGFsIGNhcGFjaXR5IG9mIHRoZSBidWZmZXIgaW4gYnl0ZXNcbiAgICovXG4gIGdldCBieXRlTGVuZ3RoKCkge1xuICAgIHJldHVybiB0aGlzLl9fYnl0ZUxlbmd0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBudW1iZXIgb2YgYnl0ZXMgY3VycmVudGx5IGFsbG9jYXRlZCBmcm9tIHRoaXMgYnVmZmVyLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbnVtYmVyIG9mIGJ5dGVzIHRoYXQgaGF2ZSBiZWVuIHRha2VuIGZyb20gdGhlIGJ1ZmZlclxuICAgKi9cbiAgZ2V0IHRha2VuU2l6ZUluQnl0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fX3Rha2VuQnl0ZXNJbmRleDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBieXRlIG9mZnNldCBvZiB0aGlzIGJ1ZmZlciB3aXRoaW4gdGhlIHJhdyBBcnJheUJ1ZmZlci5cbiAgICogVGhpcyBpcyB1c2VmdWwgd2hlbiB0aGUgYnVmZmVyIGlzIGEgdmlldyBpbnRvIGEgbGFyZ2VyIEFycmF5QnVmZmVyLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYnl0ZSBvZmZzZXQgd2l0aGluIHRoZSByYXcgQXJyYXlCdWZmZXJcbiAgICovXG4gIGdldCBieXRlT2Zmc2V0SW5SYXdBcnJheUJ1ZmZlcigpIHtcbiAgICByZXR1cm4gdGhpcy5fX2J5dGVPZmZzZXQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHR5cGVkIGFycmF5IHZpZXcgaW50byB0aGUgYnVmZmVyIGF0IGEgc3BlY2lmaWMgb2Zmc2V0LlxuICAgKiBUaGlzIG1ldGhvZCBwcm92aWRlcyBkaXJlY3QgYWNjZXNzIHRvIHRoZSBidWZmZXIgZGF0YSBhcyBhIHR5cGVkIGFycmF5LFxuICAgKiB3aGljaCBpcyB1c2VmdWwgZm9yIHJlYWRpbmcgYW5kIHdyaXRpbmcgbnVtZXJpYyBkYXRhIGVmZmljaWVudGx5LlxuICAgKlxuICAgKiBAcGFyYW0gb2Zmc2V0NGJ5dGVzVW5pdCAtIFRoZSBvZmZzZXQgaW4gNC1ieXRlIHVuaXRzIGZyb20gdGhlIHN0YXJ0IG9mIHRoZSBidWZmZXJcbiAgICogQHBhcmFtIGNvbXBvc2l0aW9uVHlwZSAtIFRoZSBjb21wb3NpdGlvbiB0eXBlIChzY2FsYXIsIHZlY3RvciwgbWF0cml4LCBldGMuKVxuICAgKiBAcGFyYW0gY29tcG9uZW50VHlwZSAtIFRoZSBjb21wb25lbnQgdHlwZSAoZmxvYXQsIGludCwgZXRjLilcbiAgICogQHBhcmFtIGxlbmd0aCAtIFRoZSBudW1iZXIgb2YgZWxlbWVudHMgdG8gaW5jbHVkZSBpbiB0aGUgdHlwZWQgYXJyYXkgKGRlZmF1bHQ6IDEwMClcbiAgICogQHJldHVybnMgQSB0eXBlZCBhcnJheSB2aWV3IGludG8gdGhlIGJ1ZmZlciBkYXRhXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgZmxvYXRBcnJheSA9IGJ1ZmZlci5nZXRUeXBlZEFycmF5KFxuICAgKiAgIDAsXG4gICAqICAgQ29tcG9zaXRpb25UeXBlLlZlYzMsXG4gICAqICAgQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICogICAxMFxuICAgKiApO1xuICAgKiBgYGBcbiAgICovXG4gIGdldFR5cGVkQXJyYXkoXG4gICAgb2Zmc2V0NGJ5dGVzVW5pdDogbnVtYmVyLFxuICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlRW51bSxcbiAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlRW51bSxcbiAgICBsZW5ndGggPSAxMDBcbiAgKSB7XG4gICAgbGV0IHJldDogVHlwZWRBcnJheTtcbiAgICBjb25zdCB0eXBlZEFycmF5ID0gQ29tcG9uZW50VHlwZS50b1R5cGVkQXJyYXkoY29tcG9uZW50VHlwZSkhO1xuICAgIGlmICh0eXBlZEFycmF5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0Lndhcm4oJ2NvbXBvbmVudFR5cGUgaXMgSW52YWxpZCcpO1xuICAgIH1cbiAgICBpZiAoQ29tcG9zaXRpb25UeXBlLmlzQXJyYXkoY29tcG9zaXRpb25UeXBlKSkge1xuICAgICAgcmV0ID0gbmV3IHR5cGVkQXJyYXkodGhpcy5fX3JhdywgdGhpcy5fX2J5dGVPZmZzZXQgKyBvZmZzZXQ0Ynl0ZXNVbml0ICogNCwgbGVuZ3RoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0ID0gbmV3IHR5cGVkQXJyYXkodGhpcy5fX3JhdywgdGhpcy5fX2J5dGVPZmZzZXQgKyBvZmZzZXQ0Ynl0ZXNVbml0ICogNCwgMSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBidWZmZXIgdXNlcyB0aGUgc2FtZSB1bmRlcmx5aW5nIEFycmF5QnVmZmVyIGFzIGFub3RoZXIgYnVmZmVyLlxuICAgKiBUaGlzIGlzIHVzZWZ1bCBmb3IgZGV0ZXJtaW5pbmcgaWYgdHdvIEJ1ZmZlciBpbnN0YW5jZXMgc2hhcmUgdGhlIHNhbWUgbWVtb3J5LlxuICAgKlxuICAgKiBAcGFyYW0gYnVmZmVyIC0gVGhlIG90aGVyIGJ1ZmZlciB0byBjb21wYXJlIHdpdGhcbiAgICogQHJldHVybnMgVHJ1ZSBpZiBib3RoIGJ1ZmZlcnMgdXNlIHRoZSBzYW1lIHVuZGVybHlpbmcgQXJyYXlCdWZmZXIsIGZhbHNlIG90aGVyd2lzZVxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IGJ1ZmZlcjEgPSBuZXcgQnVmZmVyKHsuLi59KTtcbiAgICogY29uc3QgYnVmZmVyMiA9IG5ldyBCdWZmZXIoey4uLn0pO1xuICAgKlxuICAgKiBpZiAoYnVmZmVyMS5pc1NhbWUoYnVmZmVyMikpIHtcbiAgICogICBjb25zb2xlLmxvZygnQnVmZmVycyBzaGFyZSB0aGUgc2FtZSBtZW1vcnknKTtcbiAgICogfVxuICAgKiBgYGBcbiAgICovXG4gIGlzU2FtZShidWZmZXI6IEJ1ZmZlcik6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9fcmF3ID09PSBidWZmZXIuX19yYXc7XG4gIH1cblxuICBnZXQgaW5kZXhPZlRoZUJ1ZmZlclVzYWdlKCkge1xuICAgIHJldHVybiB0aGlzLl9faW5kZXhPZlRoZUJ1ZmZlclVzYWdlO1xuICB9XG5cbiAgZ2V0IGJ1ZmZlclVzYWdlKCkge1xuICAgIHJldHVybiB0aGlzLl9fYnVmZmVyVXNhZ2U7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxTQUFTLHFCQUE2QztBQUN0RCxTQUFTLHVCQUFpRDtBQUUxRCxTQUFTLGlCQUFxQztBQUM5QyxTQUFTLGdCQUFnQjtBQUN6QixTQUFTLGNBQWM7QUFDdkIsU0FBUyxLQUFLLFVBQXVCO0FBQ3JDLFNBQVMsa0JBQWtCO0FBc0JwQixJQUFNLFNBQU4sTUFBYTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBb0JsQixZQUFZO0FBQUEsSUFDVjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRixHQU9HO0FBakNILFNBQVFBLEtBQXFCO0FBQzdCLFNBQVFDLEtBQXFCO0FBQzdCLFNBQVFDLEtBQTBCO0FBR2xDLFNBQVFDLEtBQVM7QUFDakIsU0FBUUMsS0FBbUMsQ0FBQztBQUM1QyxTQUFRQyxLQUErQixVQUFVO0FBQ2pELFNBQVFDLEtBQWlDO0FBMEJ2QyxTQUFLSCxLQUFTO0FBQ2QsU0FBS0gsS0FBZTtBQUNwQixTQUFLTyxLQUFjO0FBQ25CLFNBQUtGLEtBQWdCO0FBQ3JCLFNBQUtDLEtBQTBCO0FBRS9CLFFBQUksa0JBQWtCLFlBQVk7QUFDaEMsVUFBSSxFQUFFLE9BQU8sa0JBQWtCLGNBQWM7QUFDM0MsY0FBTSxJQUFJLE1BQU0sdURBQXVEO0FBQUEsTUFDekU7QUFDQSxXQUFLRSxLQUFRLE9BQU87QUFDcEIsV0FBS1AsS0FBZSxPQUFPO0FBQUEsSUFDN0IsT0FBTztBQUNMLFdBQUtPLEtBQVE7QUFBQSxJQUNmO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQUksS0FBSyxLQUFLO0FBQ1osU0FBS0wsS0FBUztBQUFBLEVBQ2hCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSxPQUFPO0FBQ1QsV0FBTyxLQUFLQTtBQUFBLEVBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxpQkFBaUI7QUFDZixXQUFPLEtBQUtLO0FBQUEsRUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVRQyxHQUFVLGtCQUF3QixXQUFpQjtBQUN6RCxVQUFNLGNBQWMsU0FBUyxpQkFBaUIsa0JBQWtCLFNBQVM7QUFDekUsUUFBSSxjQUFjLEdBQUc7QUFDbkIsYUFBTyxRQUFRLEtBQUsseUNBQXlDO0FBQUEsSUFDL0Q7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQXlCQSxlQUFlLEVBQUUsa0JBQWtCLFdBQVcsR0FNNUM7QUFLQSxVQUFNLGlCQUFpQjtBQUd2QixRQUFJLGlCQUFpQixLQUFLUCxLQUFvQixLQUFLLFlBQVk7QUFDN0QsWUFBTSxVQUFVO0FBQUEscUJBQ0QsS0FBSyxVQUFVLDZCQUE2QixLQUFLLGVBQWU7QUFBQSxrQkFDbkUsY0FBYyx5Q0FBeUMsS0FBS0YsS0FBZSxLQUFLRSxFQUFpQjtBQUU3RyxhQUFPLElBQUksSUFBSTtBQUFBLFFBQ2I7QUFBQSxRQUNBLE9BQU87QUFBQSxVQUNMLHFCQUFxQixLQUFLO0FBQUEsVUFDMUIsMEJBQTBCLEtBQUs7QUFBQSxRQUNqQztBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0g7QUFFQSxVQUFNLGFBQWEsSUFBSSxXQUFXO0FBQUEsTUFDaEMsUUFBUTtBQUFBLE1BQ1Isb0JBQW9CLEtBQUtBO0FBQUEsTUFDekIsbUJBQW1CO0FBQUEsTUFDbkIsWUFBWTtBQUFBLE1BQ1osS0FBSyxLQUFLTTtBQUFBLElBQ1osQ0FBQztBQUNELFNBQUtOLE1BQXFCO0FBQzFCLFNBQUtBLEtBQW9CLFNBQVMsZ0JBQWdCLEtBQUtBLElBQW1CLEtBQUtLLEVBQVc7QUFDMUYsU0FBS0gsR0FBYyxLQUFLLFVBQVU7QUFFbEMsV0FBTyxJQUFJLEdBQUcsVUFBVTtBQUFBLEVBQzFCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUF1QkEsNkJBQTZCO0FBQUEsSUFDM0I7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0YsR0FJa0M7QUFDaEMsVUFBTSxpQkFBaUI7QUFDdkIsUUFBSSxpQkFBaUIsYUFBYSxLQUFLLFlBQVk7QUFDakQsWUFBTSxVQUFVO0FBQUEscUJBQ0QsS0FBSyxVQUFVLDZCQUE2QixLQUFLLGVBQWU7QUFBQSxrQkFDbkUsZ0JBQWdCLHlDQUF5QyxLQUFLSixLQUFlLEtBQUtFLEVBQWlCO0FBQy9HLGFBQU8sSUFBSSxJQUFJO0FBQUEsUUFDYjtBQUFBLFFBQ0EsT0FBTztBQUFBLE1BQ1QsQ0FBQztBQUFBLElBQ0g7QUFFQSxVQUFNLGFBQWEsSUFBSSxXQUFXO0FBQUEsTUFDaEMsUUFBUTtBQUFBLE1BQ1Isb0JBQW9CO0FBQUEsTUFDcEIsbUJBQW1CO0FBQUEsTUFDbkIsWUFBWTtBQUFBLE1BQ1osS0FBSyxLQUFLTTtBQUFBLElBQ1osQ0FBQztBQUVELFVBQU0sa0JBQWtCLFdBQVcsb0JBQW9CLG1CQUFtQjtBQUMxRSxRQUFJLEtBQUtOLEtBQW9CLGlCQUFpQjtBQUM1QyxXQUFLQSxLQUFvQjtBQUFBLElBQzNCO0FBRUEsU0FBS0UsR0FBYyxLQUFLLFVBQVU7QUFFbEMsV0FBTyxJQUFJLEdBQUcsVUFBVTtBQUFBLEVBQzFCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLG1CQUFtQixPQUFhO0FBQzlCLFNBQUtGLE1BQXFCO0FBQUEsRUFDNUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLGFBQWE7QUFDZixXQUFPLEtBQUtGO0FBQUEsRUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQUksa0JBQWtCO0FBQ3BCLFdBQU8sS0FBS0U7QUFBQSxFQUNkO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxJQUFJLDZCQUE2QjtBQUMvQixXQUFPLEtBQUtEO0FBQUEsRUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBdUJBLGNBQ0Usa0JBQ0EsaUJBQ0EsZUFDQSxTQUFTLEtBQ1Q7QUFDQSxRQUFJO0FBQ0osVUFBTSxhQUFhLGNBQWMsYUFBYSxhQUFhO0FBQzNELFFBQUksZUFBZSxRQUFXO0FBQzVCLGFBQU8sUUFBUSxLQUFLLDBCQUEwQjtBQUFBLElBQ2hEO0FBQ0EsUUFBSSxnQkFBZ0IsUUFBUSxlQUFlLEdBQUc7QUFDNUMsWUFBTSxJQUFJLFdBQVcsS0FBS08sSUFBTyxLQUFLUCxLQUFlLG1CQUFtQixHQUFHLE1BQU07QUFBQSxJQUNuRixPQUFPO0FBQ0wsWUFBTSxJQUFJLFdBQVcsS0FBS08sSUFBTyxLQUFLUCxLQUFlLG1CQUFtQixHQUFHLENBQUM7QUFBQSxJQUM5RTtBQUVBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBbUJBLE9BQU8sUUFBeUI7QUFDOUIsV0FBTyxLQUFLTyxPQUFVLE9BQU9BO0FBQUEsRUFDL0I7QUFBQSxFQUVBLElBQUksd0JBQXdCO0FBQzFCLFdBQU8sS0FBS0Y7QUFBQSxFQUNkO0FBQUEsRUFFQSxJQUFJLGNBQWM7QUFDaEIsV0FBTyxLQUFLRDtBQUFBLEVBQ2Q7QUFDRjsiLAogICJuYW1lcyI6IFsiX19ieXRlTGVuZ3RoIiwgIl9fYnl0ZU9mZnNldCIsICJfX3Rha2VuQnl0ZXNJbmRleCIsICJfX25hbWUiLCAiX19idWZmZXJWaWV3cyIsICJfX2J1ZmZlclVzYWdlIiwgIl9faW5kZXhPZlRoZUJ1ZmZlclVzYWdlIiwgIl9fYnl0ZUFsaWduIiwgIl9fcmF3IiwgIl9fcGFkZGluZyJdCn0K
