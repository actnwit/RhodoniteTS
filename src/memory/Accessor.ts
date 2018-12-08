import { ComponentType, ComponentTypeEnum } from "../definitions/ComponentType";
import { CompositionType, CompositionTypeEnum } from "../definitions/CompositionType";
import RnObject from "../core/Object";
import BufferView from "./BufferView";

export default class Accessor extends RnObject {
  __bufferView: BufferView;
  __byteOffset: number;
  __compositionType: CompositionTypeEnum = CompositionType.Unknown;
  __componentType: ComponentTypeEnum = ComponentType.Unknown;
  __count: Count = 0;

  constructor({bufferView, byteOffset, compositionType, componentType, count} :
    {bufferView: BufferView, byteOffset: Byte, compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count}) {
    super();
    this.__bufferView = bufferView;
    this.__byteOffset = byteOffset;
    this.__compositionType = compositionType;
    this.__componentType = componentType;
    this.__count = count;
  }
}
