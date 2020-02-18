import AccessorBase from "./AccessorBase";
import BufferView from "./BufferView";
import { ComponentTypeEnum } from "../definitions/ComponentType";
import { CompositionTypeEnum } from "../definitions/CompositionType";
import { Count, Byte, Size } from "../../commontypes/CommonTypes";
export default class FlexibleAccessor extends AccessorBase {
    constructor({ bufferView, byteOffset, compositionType, componentType, byteStride, count, raw, arrayLength }: {
        bufferView: BufferView;
        byteOffset: Byte;
        byteOffsetFromBuffer: Byte;
        compositionType: CompositionTypeEnum;
        componentType: ComponentTypeEnum;
        byteStride: Byte;
        count: Count;
        raw: ArrayBuffer;
        arrayLength: Size;
    });
}
