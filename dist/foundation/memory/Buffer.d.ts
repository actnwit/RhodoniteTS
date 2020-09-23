import RnObject from "../core/RnObject";
import BufferView from "./BufferView";
import { Byte, Size } from "../../commontypes/CommonTypes";
export default class Buffer extends RnObject {
    private __byteLength;
    private __byteOffset;
    private __raw;
    private __name;
    private __takenBytesIndex;
    private __bufferViews;
    constructor({ byteLength, buffer, name }: {
        byteLength: Size;
        buffer: ArrayBuffer | Uint8Array;
        name: string;
    });
    set name(str: string);
    get name(): string;
    getArrayBuffer(): ArrayBuffer;
    takeBufferView({ byteLengthToNeed, byteStride, isAoS, byteAlign }: {
        byteLengthToNeed: Byte;
        byteStride: Byte;
        isAoS: boolean;
        byteAlign?: Byte;
    }): BufferView;
    takeBufferViewWithByteOffset({ byteLengthToNeed, byteStride, byteOffset, isAoS }: {
        byteLengthToNeed: Byte;
        byteStride: Byte;
        byteOffset: Byte;
        isAoS: boolean;
    }): BufferView;
    _addTakenByteIndex(value: Byte): void;
    get byteLength(): number;
    get takenSizeInByte(): number;
    get byteOffsetInRawArrayBuffer(): number;
}
