import type { Buffer } from '../memory/Buffer';
import type { CompositionTypeEnum } from '../definitions/CompositionType';
import type { ComponentTypeEnum } from '../definitions/ComponentType';
import { Accessor } from './Accessor';
import type { Byte, Count, Size } from '../../types/CommonTypes';
import { Err, type Result, Ok } from '../misc';

/**
 * BufferView represents a view into a Buffer with specific byte offset and length.
 * It manages memory allocation for Accessors and provides methods to create Accessors
 * that read data from the underlying buffer in various formats.
 *
 * BufferView acts as an intermediate layer between Buffer and Accessor, allowing
 * multiple Accessors to share the same buffer memory while maintaining proper
 * byte alignment and bounds checking.
 */
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

  /**
   * Creates a new BufferView instance.
   *
   * @param params - Configuration object for the BufferView
   * @param params.buffer - The parent Buffer that this BufferView references
   * @param params.byteOffsetInBuffer - Byte offset within the parent buffer
   * @param params.defaultByteStride - Default stride in bytes between elements
   * @param params.byteLength - Total byte length of this BufferView
   * @param params.raw - The underlying ArrayBuffer containing the actual data
   */
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
    this.__byteOffsetInRawArrayBufferOfBuffer = buffer.byteOffsetInRawArrayBuffer + byteOffsetInBuffer;
    this.__byteLength = byteLength;
    this.__defaultByteStride = defaultByteStride;
    this.__raw = raw;
  }

  /**
   * Gets the default byte stride for this BufferView.
   * The stride determines the number of bytes between consecutive elements.
   *
   * @returns The default byte stride in bytes
   */
  get defaultByteStride() {
    return this.__defaultByteStride;
  }

  /**
   * Gets the total byte length of this BufferView.
   *
   * @returns The byte length of this BufferView
   */
  get byteLength() {
    return this.__byteLength;
  }

  /**
   * Gets the byte offset of this BufferView within its parent Buffer.
   * This is the relative offset from the start of the Buffer.
   *
   * @returns The byte offset within the parent Buffer
   */
  get byteOffsetInBuffer(): Byte {
    return this.__byteOffsetInRawArrayBufferOfBuffer - this.__buffer.byteOffsetInRawArrayBuffer;
  }

  /**
   * Gets the absolute byte offset in the raw ArrayBuffer.
   * This includes the Buffer's own offset within the raw ArrayBuffer.
   *
   * @returns The absolute byte offset in the raw ArrayBuffer
   */
  get byteOffsetInRawArrayBufferOfBuffer() {
    return this.__byteOffsetInRawArrayBufferOfBuffer;
  }

  /**
   * Gets the parent Buffer that this BufferView references.
   *
   * @returns The parent Buffer instance
   */
  get buffer(): Buffer {
    return this.__buffer;
  }

  /**
   * Checks if this BufferView uses Structure of Arrays (SoA) layout.
   * SoA layout stores each component type in separate arrays.
   *
   * @returns True if using SoA layout, false otherwise
   */
  get isSoA() {
    return !this.isAoS;
  }

  /**
   * Checks if this BufferView uses Array of Structures (AoS) layout.
   * AoS layout interleaves different component types within the same array.
   *
   * @returns True if any accessor uses AoS layout, false otherwise
   */
  get isAoS() {
    for (const accessor of this.__accessors) {
      if (accessor.isAoS) {
        return true;
      }
    }
    return false;
  }

  /**
   * Creates a Uint8Array view of this BufferView's memory area.
   * This provides direct access to the raw bytes within the BufferView's bounds.
   *
   * @returns A Uint8Array representing the BufferView's memory area
   */
  getUint8Array(): Uint8Array {
    return new Uint8Array(this.__raw, this.__byteOffsetInRawArrayBufferOfBuffer, this.__byteLength);
  }

  /**
   * Creates and allocates a new Accessor within this BufferView.
   * The Accessor will be positioned at the current end of allocated space.
   *
   * @param params - Configuration object for the Accessor
   * @param params.compositionType - The composition type (e.g., SCALAR, VEC2, VEC3, VEC4, MAT4)
   * @param params.componentType - The component data type (e.g., FLOAT, UNSIGNED_SHORT)
   * @param params.count - Number of elements in the accessor
   * @param params.byteStride - Optional byte stride between elements (defaults to defaultByteStride)
   * @param params.max - Optional maximum values for each component
   * @param params.min - Optional minimum values for each component
   * @param params.arrayLength - Optional array length for array attributes (defaults to 1)
   * @param params.normalized - Whether integer values should be normalized to [0,1] or [-1,1] range
   * @returns A Result containing the created Accessor on success, or an error on failure
   */
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
  }): Result<Accessor, undefined> {
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

  /**
   * Creates and allocates a new Accessor at a specific byte offset within this BufferView.
   * Unlike takeAccessor, this method allows specifying the exact position within the BufferView.
   *
   * @param params - Configuration object for the Accessor
   * @param params.compositionType - The composition type (e.g., SCALAR, VEC2, VEC3, VEC4, MAT4)
   * @param params.componentType - The component data type (e.g., FLOAT, UNSIGNED_SHORT)
   * @param params.count - Number of elements in the accessor
   * @param params.byteOffsetInBufferView - Specific byte offset within this BufferView
   * @param params.byteStride - Optional byte stride between elements (defaults to defaultByteStride)
   * @param params.max - Optional maximum values for each component
   * @param params.min - Optional minimum values for each component
   * @param params.normalized - Whether integer values should be normalized to [0,1] or [-1,1] range
   * @returns A Result containing the created Accessor on success, or an error on failure
   */
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
  }): Result<Accessor, undefined> {
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

  /**
   * Internal method to create an Accessor at the current allocation position.
   * Performs bounds checking and updates the internal allocation state.
   *
   * @param params - Configuration parameters for the Accessor
   * @returns A Result containing the created Accessor on success, or an error on failure
   * @private
   */
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
  }): Result<Accessor, undefined> {
    const byteOffsetInBufferView = this.__takenByte;
    let actualByteStride = byteStride;
    if (actualByteStride === 0) {
      actualByteStride = compositionType.getNumberOfComponents() * componentType.getSizeInBytes() * arrayLength;
    }

    // Each accessor MUST fit its bufferView, i.e.,
    // accessor.byteOffset + EFFECTIVE_BYTE_STRIDE * (accessor.count - 1) + SIZE_OF_COMPONENT * NUMBER_OF_COMPONENTS
    // See: https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#data-alignment
    if (
      this.__takenByte +
        actualByteStride * (count - 1) +
        componentType.getSizeInBytes() * compositionType.getNumberOfComponents() >
      this.byteLength
    ) {
      const message = `The size of the Accessor you are trying to take exceeds the byte length left in the BufferView.
BufferView.byteLength: ${this.byteLength}, BufferView.takenSizeInByte: ${
        this.__takenByte
      }, Accessor.byteStride: ${byteStride}, Accessor.count: ${count};
byteSizeToTake: ${actualByteStride * count}, the byte length left in the Buffer: ${this.byteLength - this.__takenByte}`;
      // console.error(message);
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

  /**
   * Internal method to create an Accessor at a specific byte offset.
   * Performs bounds checking but does not update the internal allocation state.
   *
   * @param params - Configuration parameters for the Accessor
   * @returns A Result containing the created Accessor on success, or an error on failure
   * @private
   */
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
  }): Result<Accessor, undefined> {
    // Each accessor MUST fit its bufferView, i.e.,
    // accessor.byteOffset + EFFECTIVE_BYTE_STRIDE * (accessor.count - 1) + SIZE_OF_COMPONENT * NUMBER_OF_COMPONENTS
    // See: https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#data-alignment
    if (
      this.__takenByte +
        byteStride * (count - 1) +
        componentType.getSizeInBytes() * compositionType.getNumberOfComponents() >
      this.byteLength
    ) {
      const message = `The size of the Accessor you are trying to take exceeds the byte length left in the BufferView.
BufferView.byteLength: ${this.byteLength}, BufferView.takenSizeInByte: ${
        this.__takenByte
      }, Accessor.byteStride: ${byteStride}, Accessor.count: ${count};
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

  /**
   * Compares this BufferView with another BufferView for equality.
   * Two BufferViews are considered the same if they have identical byte length,
   * byte offset, default byte stride, and reference the same underlying ArrayBuffer.
   *
   * @param rnBufferView - The BufferView to compare with
   * @returns True if the BufferViews are identical, false otherwise
   */
  isSame(rnBufferView: BufferView) {
    return (
      this.byteLength === rnBufferView.byteLength &&
      this.byteOffsetInRawArrayBufferOfBuffer === rnBufferView.byteOffsetInRawArrayBufferOfBuffer &&
      this.defaultByteStride === rnBufferView.defaultByteStride &&
      this.buffer.getArrayBuffer() === rnBufferView.buffer.getArrayBuffer()
    );
  }
}
