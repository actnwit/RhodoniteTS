import type { Byte, Count, Size } from '../../types/CommonTypes';
import type { ComponentTypeEnum } from '../definitions/ComponentType';
import type { CompositionTypeEnum } from '../definitions/CompositionType';
import type { Buffer } from '../memory/Buffer';
import { type Result } from '../misc';
import { Accessor } from './Accessor';
/**
 * BufferView represents a view into a Buffer with specific byte offset and length.
 * It manages memory allocation for Accessors and provides methods to create Accessors
 * that read data from the underlying buffer in various formats.
 *
 * BufferView acts as an intermediate layer between Buffer and Accessor, allowing
 * multiple Accessors to share the same buffer memory while maintaining proper
 * byte alignment and bounds checking.
 */
export declare class BufferView {
    private __buffer;
    private __byteOffsetInRawArrayBufferOfBuffer;
    private __byteOffsetInBuffer;
    private __byteLength;
    private __defaultByteStride;
    private __takenByte;
    private __takenAccessorCount;
    private __raw;
    private __accessors;
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
    constructor({ buffer, byteOffsetInBuffer, defaultByteStride, byteLength, raw, }: {
        buffer: Buffer;
        byteOffsetInBuffer: Byte;
        defaultByteStride: Byte;
        byteLength: Byte;
        raw: ArrayBuffer;
    });
    /**
     * Gets the default byte stride for this BufferView.
     * The stride determines the number of bytes between consecutive elements.
     *
     * @returns The default byte stride in bytes
     */
    get defaultByteStride(): number;
    /**
     * Gets the total byte length of this BufferView.
     *
     * @returns The byte length of this BufferView
     */
    get byteLength(): number;
    /**
     * Gets the byte offset of this BufferView within its parent Buffer.
     * This is the relative offset from the start of the Buffer.
     *
     * @returns The byte offset within the parent Buffer
     */
    get byteOffsetInBuffer(): Byte;
    /**
     * Gets the absolute byte offset in the raw ArrayBuffer.
     * This includes the Buffer's own offset within the raw ArrayBuffer.
     *
     * @returns The absolute byte offset in the raw ArrayBuffer
     */
    get byteOffsetInRawArrayBufferOfBuffer(): number;
    /**
     * Gets the parent Buffer that this BufferView references.
     *
     * @returns The parent Buffer instance
     */
    get buffer(): Buffer;
    /**
     * Checks if this BufferView uses Structure of Arrays (SoA) layout.
     * SoA layout stores each component type in separate arrays.
     *
     * @returns True if using SoA layout, false otherwise
     */
    get isSoA(): boolean;
    /**
     * Checks if this BufferView uses Array of Structures (AoS) layout.
     * AoS layout interleaves different component types within the same array.
     *
     * @returns True if any accessor uses AoS layout, false otherwise
     */
    get isAoS(): boolean;
    /**
     * Creates a Uint8Array view of this BufferView's memory area.
     * This provides direct access to the raw bytes within the BufferView's bounds.
     *
     * @returns A Uint8Array representing the BufferView's memory area
     */
    getUint8Array(): Uint8Array;
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
    takeAccessor({ compositionType, componentType, count, byteStride, max, min, arrayLength, normalized, }: {
        compositionType: CompositionTypeEnum;
        componentType: ComponentTypeEnum;
        count: Count;
        byteStride?: Byte;
        max?: number[];
        min?: number[];
        arrayLength?: Size;
        normalized?: boolean;
    }): Result<Accessor, undefined>;
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
    takeAccessorWithByteOffset({ compositionType, componentType, count, byteOffsetInBufferView, byteStride, max, min, normalized, }: {
        compositionType: CompositionTypeEnum;
        componentType: ComponentTypeEnum;
        count: Count;
        byteOffsetInBufferView: Byte;
        byteStride?: Byte;
        max?: number[];
        min?: number[];
        normalized?: boolean;
    }): Result<Accessor, undefined>;
    /**
     * Internal method to create an Accessor at the current allocation position.
     * Performs bounds checking and updates the internal allocation state.
     *
     * @param params - Configuration parameters for the Accessor
     * @returns A Result containing the created Accessor on success, or an error on failure
     * @private
     */
    private __takeAccessorInner;
    /**
     * Internal method to create an Accessor at a specific byte offset.
     * Performs bounds checking but does not update the internal allocation state.
     *
     * @param params - Configuration parameters for the Accessor
     * @returns A Result containing the created Accessor on success, or an error on failure
     * @private
     */
    private __takeAccessorInnerWithByteOffset;
    /**
     * Compares this BufferView with another BufferView for equality.
     * Two BufferViews are considered the same if they have identical byte length,
     * byte offset, default byte stride, and reference the same underlying ArrayBuffer.
     *
     * @param rnBufferView - The BufferView to compare with
     * @returns True if the BufferViews are identical, false otherwise
     */
    isSame(rnBufferView: BufferView): boolean;
}
