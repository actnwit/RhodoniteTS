import { type ComponentTypeEnum } from '../../foundation/definitions/ComponentType';
import { type CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import type { Byte, Index, TypedArray } from '../../types/CommonTypes';
import { type BufferUseEnum } from '../definitions/BufferUse';
import { type Result } from '../misc/Result';
import { BufferView } from './BufferView';
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
export declare class Buffer {
    private __byteLength;
    private __byteOffset;
    private __takenBytesIndex;
    private __byteAlign;
    private __raw;
    private __name;
    private __bufferViews;
    private __bufferUsage;
    private __indexOfTheBufferUsage;
    /**
     * Creates a new Buffer instance.
     *
     * @param options - Configuration object for the buffer
     * @param options.byteLength - The total byte length of the buffer
     * @param options.buffer - The underlying ArrayBuffer or Uint8Array to wrap
     * @param options.name - A descriptive name for the buffer
     * @param options.byteAlign - The byte alignment requirement for memory allocation
     */
    constructor({ byteLength, buffer, name, byteAlign, bufferUsage, indexOfTheBufferUsage, }: {
        byteLength: Byte;
        buffer: ArrayBuffer | Uint8Array;
        name: string;
        byteAlign: Byte;
        bufferUsage: BufferUseEnum;
        indexOfTheBufferUsage: Index;
    });
    /**
     * Sets the name of the buffer.
     *
     * @param str - The new name for the buffer
     */
    set name(str: string);
    /**
     * Gets the name of the buffer.
     *
     * @returns The current name of the buffer
     */
    get name(): string;
    /**
     * Gets the underlying ArrayBuffer.
     *
     * @returns The raw ArrayBuffer instance
     */
    getArrayBuffer(): ArrayBuffer;
    /**
     * Calculates padding bytes needed for proper alignment.
     *
     * @param byteLengthToNeed - The number of bytes that need to be allocated
     * @param byteAlign - The alignment requirement in bytes
     * @returns The number of padding bytes needed
     * @private
     */
    private __padding;
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
    takeBufferView({ byteLengthToNeed, byteStride }: {
        byteLengthToNeed: Byte;
        byteStride: Byte;
    }): Result<BufferView, {
        'Buffer.byteLength': Byte;
        'Buffer.takenSizeInByte': Byte;
    }>;
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
    takeBufferViewWithByteOffset({ byteLengthToNeed, byteStride, byteOffset, }: {
        byteLengthToNeed: Byte;
        byteStride: Byte;
        byteOffset: Byte;
    }): Result<BufferView, undefined>;
    /**
     * Manually adds to the taken byte index counter.
     * This is an internal method used to track memory usage.
     *
     * @param value - The number of bytes to add to the taken bytes index
     * @internal
     */
    _addTakenByteIndex(value: Byte): void;
    /**
     * Gets the total byte length of the buffer.
     *
     * @returns The total capacity of the buffer in bytes
     */
    get byteLength(): number;
    /**
     * Gets the number of bytes currently allocated from this buffer.
     *
     * @returns The number of bytes that have been taken from the buffer
     */
    get takenSizeInByte(): number;
    /**
     * Gets the byte offset of this buffer within the raw ArrayBuffer.
     * This is useful when the buffer is a view into a larger ArrayBuffer.
     *
     * @returns The byte offset within the raw ArrayBuffer
     */
    get byteOffsetInRawArrayBuffer(): number;
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
    getTypedArray(offset4bytesUnit: number, compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, length?: number): TypedArray;
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
    isSame(buffer: Buffer): boolean;
    get indexOfTheBufferUsage(): number;
    get bufferUsage(): import("..").EnumIO;
}
