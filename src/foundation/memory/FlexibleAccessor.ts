import AccessorBase from "./AccessorBase";
import BufferView from "./BufferView";
import { ComponentType, ComponentTypeEnum } from "../definitions/ComponentType";
import { CompositionType, CompositionTypeEnum } from "../definitions/CompositionType";
import { Count, Byte } from "../../types/CommonTypes";


export default class FlexibleAccessor extends AccessorBase {
  constructor({bufferView, byteOffset, compositionType, componentType, byteStride, count, raw} :
    {bufferView: BufferView, byteOffset: Byte, byteOffsetFromBuffer:Byte, compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, byteStride:Byte, count: Count, raw: Uint8Array}) {
      super({bufferView, byteOffset, compositionType, componentType, byteStride, count, raw});
  }
}

