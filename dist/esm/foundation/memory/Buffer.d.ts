import { BufferView } from './BufferView';
import { Byte, TypedArray } from '../../types/CommonTypes';
import { CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import { ComponentTypeEnum } from '../../foundation/definitions/ComponentType';
import { IResult } from '../misc';
export declare class Buffer {
    private __byteLength;
    private __byteOffset;
    private __takenBytesIndex;
    private __byteAlign;
    private __raw;
    private __name;
    private __bufferViews;
    constructor({ byteLength, buffer, name, byteAlign, }: {
        byteLength: Byte;
        buffer: ArrayBuffer;
        name: string;
        byteAlign: Byte;
    });
    set name(str: string);
    get name(): string;
    getArrayBuffer(): ArrayBuffer;
    private __padding;
    takeBufferView({ byteLengthToNeed, byteStride, }: {
        byteLengthToNeed: Byte;
        byteStride: Byte;
    }): IResult<BufferView, undefined>;
    takeBufferViewWithByteOffset({ byteLengthToNeed, byteStride, byteOffset, }: {
        byteLengthToNeed: Byte;
        byteStride: Byte;
        byteOffset: Byte;
    }): IResult<BufferView, undefined>;
    _addTakenByteIndex(value: Byte): void;
    get byteLength(): number;
    get takenSizeInByte(): number;
    get byteOffsetInRawArrayBuffer(): number;
    getTypedArray(offset4bytesUnit: number, compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, length?: number): TypedArray;
    isSame(buffer: Buffer): boolean;
}
