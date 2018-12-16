import RnObject from "../core/Object";
import Buffer from "../memory/Buffer";
import Accessor from "./AccessorBase";
import { CompositionTypeEnum } from "../definitions/CompositionType";
import { ComponentTypeEnum, ComponentType } from "../definitions/ComponentType";
import { access } from "fs-extra";
import AccessorBase from "./AccessorBase";
import FlexibleAccessor from "./FlexibleAccessor";


export default class BufferView extends RnObject {
  private __buffer: Buffer;
  private __byteOffset: Byte;
  private __byteLength: Byte;
  private __byteStride: Byte = 0;
  private __target: Index = 0;
  private __takenByteIndex: Byte = 0;
  private __takenByteOffsetOfFirstElement = 0;
  private __raw: Uint8Array;
  private __isAoS: boolean;
  private __accessors: Array<Accessor> = [];

  constructor({buffer, byteOffset, byteLength, raw, isAoS} :
    {buffer: Buffer, byteOffset: Byte, byteLength: Byte, raw: Uint8Array, isAoS: boolean})
  {
    super();
    this.__buffer = buffer;
    this.__byteOffset = byteOffset;
    this.__byteLength = byteLength;
    this.__raw = raw;
    this.__isAoS = isAoS;
  }

  set byteStride(stride: Byte) {
    this.__byteStride = stride;
  }

  get byteStride() {
    return this.__byteStride;
  }

  get byteLength() {
    return this.__byteLength;
  }

  get isSoA() {
    return !this.__isAoS;
  }

  recheckIsSoA() {
    if (this.__accessors.length <= 1) {
      return true;
    }

    let firstStrideBytes = this.__accessors[0].byteStride;
    let secondStrideBytes = this.__accessors[1].byteStride;
    let firstElementSizeInBytes = this.__accessors[0].elementSizeInBytes;
    let secondElementSizeInBytes = this.__accessors[1].elementSizeInBytes;

    if (firstStrideBytes === secondStrideBytes &&
      (firstElementSizeInBytes + secondElementSizeInBytes) < firstElementSizeInBytes) {
        return true;
    }
  }

  get isAoS() {
    return this.__isAoS;
  }

  getUint8Array() {
    return this.__raw;
  }

  takeAccessor({compositionType, componentType, count}: {compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count}): Accessor {
    const byteStride = this.byteStride;

    const accessor = this.__takeAccessorInner({compositionType, componentType, count, byteStride, accessorClass: Accessor});

    return accessor;
  }

  takeFlexibleAccessor({compositionType, componentType, count, byteStride}: {compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count, byteStride: Byte}) {
    const accessor = this.__takeAccessorInner({compositionType, componentType, count, byteStride, accessorClass: FlexibleAccessor});

    return accessor;

  }

  private __takeAccessorInner({compositionType, componentType, count, byteStride, accessorClass}: {compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count, byteStride: Byte, accessorClass:any}): AccessorBase {
    let byteOffset = 0;
    if (this.isSoA) {
      byteOffset = this.__takenByteIndex;
      this.__takenByteIndex += compositionType.getNumberOfComponents() * componentType.getSizeInBytes() * count;
    } else {
      byteOffset = this.__takenByteIndex;
      this.__takenByteIndex += compositionType.getNumberOfComponents() * componentType.getSizeInBytes();
    }
    const accessor = new accessorClass({
      bufferView: this, byteOffset: byteOffset, compositionType: compositionType, componentType: componentType, byteStride: byteStride, count: count, raw: this.__raw
    });

    this.__accessors.push(accessor);

    return accessor;

  }
}
