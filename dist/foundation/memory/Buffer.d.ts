import RnObject from "../core/Object";
import BufferView from "./BufferView";
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
    takeBufferView({ byteLengthToNeed, byteStride, isAoS }: {
        byteLengthToNeed: Byte;
        byteStride: Byte;
        isAoS: boolean;
    }): BufferView;
    takeBufferViewWithByteOffset({ byteLengthToNeed, byteStride, byteOffset, isAoS }: {
        byteLengthToNeed: Byte;
        byteStride: Byte;
        byteOffset: Byte;
        isAoS: boolean;
    }): BufferView;
    readonly byteSizeInUse: number;
}
