import { Buffer } from '../memory/Buffer';
import { CompositionTypeEnum } from '../definitions/CompositionType';
import { ComponentTypeEnum } from '../definitions/ComponentType';
import { Accessor } from './Accessor';
import { Byte, Count, Size } from '../../types/CommonTypes';
import { Result } from '../misc';
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
    constructor({ buffer, byteOffsetInBuffer, defaultByteStride, byteLength, raw, }: {
        buffer: Buffer;
        byteOffsetInBuffer: Byte;
        defaultByteStride: Byte;
        byteLength: Byte;
        raw: ArrayBuffer;
    });
    get defaultByteStride(): number;
    get byteLength(): number;
    /**
     * byteOffset in Buffer (includes byteOffset of Buffer in it's inner arraybuffer)
     */
    get byteOffsetInBuffer(): Byte;
    /**
     * byteOffset in Buffer (includes byteOffset of Buffer in it's inner arraybuffer)
     */
    get byteOffsetInRawArrayBufferOfBuffer(): number;
    get buffer(): Buffer;
    get isSoA(): boolean;
    get isAoS(): boolean;
    /**
     * get memory buffer as Uint8Array of this BufferView memory area data
     */
    getUint8Array(): Uint8Array;
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
    private __takeAccessorInner;
    private __takeAccessorInnerWithByteOffset;
    isSame(rnBufferView: BufferView): boolean;
}
