import AccessorBase from "./AccessorBase";
import BufferView from "./BufferView";
import { ComponentType, ComponentTypeEnum } from "../definitions/ComponentType";
import { CompositionType, CompositionTypeEnum } from "../definitions/CompositionType";


export default class Accessor extends AccessorBase {
  constructor({bufferView, byteOffset, compositionType, componentType, byteStride, count, raw} :
    {bufferView: BufferView, byteOffset: Byte, compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, byteStride: Byte, count: Count, raw: Uint8Array}) {
      super({bufferView, byteOffset, compositionType, componentType, byteStride, count, raw});
/*
      this.__byteStride = this.__compositionType.getNumberOfComponents() * this.__componentType.getSizeInBytes();
      if (this.__bufferView.isAoS) {
        this.__byteStride = this.__bufferView.byteStride;
      }
  
      const typedArrayClass = this.getTypedArrayClass(componentType);
      this.__typedArrayClass = typedArrayClass;
      if (this.__bufferView.isSoA) {
        this.__dataView = new DataView(raw.buffer, this.__byteOffset, compositionType.getNumberOfComponents() * componentType.getSizeInBytes() * count);
      } else {
        this.__dataView = new DataView(raw.buffer, this.__byteOffset);
      }
      this.__typedArray = new typedArrayClass!(raw.buffer, this.__byteOffset, compositionType.getNumberOfComponents() * count);
      this.__dataViewGetter = (this.__dataView as any)[this.getDataViewGetter(componentType)!].bind(this.__dataView);
      this.__dataViewSetter = (this.__dataView as any)[this.getDataViewSetter(componentType)!].bind(this.__dataView);
  
  
      //console.log('Test', this.__byteOffset + this.__byteStride * (count - 1), this.__bufferView.byteLength)
      if (this.__byteOffset + this.__byteStride * (count - 1) > this.__bufferView.byteLength) {
        throw new Error('The range of the accessor exceeds the range of the buffer view.')
      }
      */
  }
}

