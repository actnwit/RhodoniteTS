import RnObject from "../core/RnObject";
import BufferView from "./BufferView";
import { Byte, Size } from "../../types/CommonTypes";
export default class Buffer extends RnObject {
    private __byteLength;
    private __raw;
    private __name;
    private __takenBytesIndex;
    private __bufferViews;
    constructor({ byteLength, arrayBuffer, name }: {
        byteLength: Size;
        arrayBuffer: ArrayBuffer;
        name: string;
    });
    name: any;
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
    readonly byteLength: number;
    readonly takenSizeInByte: number;
}
