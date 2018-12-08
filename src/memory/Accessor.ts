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
  __raw: Uint8Array;
  __takenCount: Count = 0;

  constructor({bufferView, byteOffset, compositionType, componentType, count, raw} :
    {bufferView: BufferView, byteOffset: Byte, compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count, raw: Uint8Array}) {
    super();
    this.__bufferView = bufferView;
    this.__byteOffset = byteOffset;
    this.__compositionType = compositionType;
    this.__componentType = componentType;
    this.__count = count;
    this.__raw = raw;
  }

  takeOne() {
    const componentType = this.__componentType
    const getTypedArrayClass = (componentType: ComponentTypeEnum) => {
      switch (componentType) {
        case ComponentType.Byte: return Int8Array;
        case ComponentType.UnsignedByte: return Uint8Array;
        case ComponentType.Short: return Int16Array;
        case ComponentType.UnsignedShort: return Uint16Array;
        case ComponentType.Int: return Int32Array;
        case ComponentType.UnsingedInt: return Uint32Array;
        case ComponentType.Float: return Float32Array;
        case ComponentType.Double: return Float64Array;
        default: console.error('Unexpected ComponentType!');
      }
    }
    const typedArrayClass = getTypedArrayClass(componentType);
    const arrayBufferOfBufferView = this.__raw.buffer;

    let stride = this.__compositionType.getNumberOfComponents() * this.__componentType.getSizeInBytes();
    if (this.__bufferView.isAoS) {
      stride = this.__bufferView.byteStride;
    }
    const subTypedArray = new typedArrayClass!(arrayBufferOfBufferView, this.__byteOffset + stride * this.__takenCount, this.__compositionType.getNumberOfComponents());
    this.__takenCount += 1;

    return subTypedArray
  }
}
