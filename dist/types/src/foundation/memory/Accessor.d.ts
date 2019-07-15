import AccessorBase from "./AccessorBase";
import BufferView from "./BufferView";
import { ComponentTypeEnum } from "../definitions/ComponentType";
import { CompositionTypeEnum } from "../definitions/CompositionType";
export default class Accessor extends AccessorBase {
    constructor({ bufferView, byteOffset, compositionType, componentType, byteStride, count, raw }: {
        bufferView: BufferView;
        byteOffset: Byte;
        byteOffsetFromBuffer: Byte;
        compositionType: CompositionTypeEnum;
        componentType: ComponentTypeEnum;
        byteStride: Byte;
        count: Count;
        raw: Uint8Array;
    });
}
