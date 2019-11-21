import RnObject from "../core/RnObject";
import Buffer from "../memory/Buffer";
import Accessor from "./Accessor";
import { CompositionTypeEnum } from "../definitions/CompositionType";
import { ComponentTypeEnum, ComponentType } from "../definitions/ComponentType";
import { access } from "fs-extra";
import AccessorBase from "./AccessorBase";
import FlexibleAccessor from "./FlexibleAccessor";
import { Byte, Count, Index, Size } from "../../types/CommonTypes";


export default class BufferView extends RnObject {
  private __buffer: Buffer;
  private __byteOffsetInRawArrayBufferOfBuffer: Byte;
  private __byteLength: Byte;
  private __byteStride: Byte = 0;
  private __target: Index = 0;
  private __takenByteIndex: Byte = 0;
  private __takenByteOffsetOfFirstElement = 0;
  private __raw: ArrayBuffer;
  private __isAoS: boolean;
  private __accessors: Array<Accessor> = [];

  constructor({buffer, byteOffset, byteLength, raw, isAoS} :
    {buffer: Buffer, byteOffset: Byte, byteLength: Byte, raw: ArrayBuffer, isAoS: boolean})
  {
    super();
    this.__buffer = buffer;
    this.__byteOffsetInRawArrayBufferOfBuffer = byteOffset;
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

  /**
   * byteOffset in Buffer (includes byteOffset of Buffer in it's inner arraybuffer)
   */
  get byteOffsetInBuffer() {
    return this.__byteOffsetInRawArrayBufferOfBuffer - this.__buffer.byteOffsetInRawArrayBuffer;
  }

  /**
   * byteOffset in Buffer (includes byteOffset of Buffer in it's inner arraybuffer)
   */
  get byteOffsetInRawArrayBufferOfBuffer() {
    return this.__byteOffsetInRawArrayBufferOfBuffer;
  }

  get buffer() {
    return this.__buffer;
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
    } else {
      return false;
    }
  }

  get isAoS() {
    return this.__isAoS;
  }

  getUint8Array() {
    return new Uint8Array(this.__raw, this.__byteOffsetInRawArrayBufferOfBuffer, this.__byteLength);
  }

  takeAccessor({compositionType, componentType, count, max, min, byteAlign = 4, arrayLength}:
    {compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count, max?: number, min?: number, byteAlign?: Byte, arrayLength?: Size}): Accessor {
    const byteStride = this.byteStride;
    const _arrayLength = (arrayLength != null) ? arrayLength : 1;

    const accessor = this.__takeAccessorInner({compositionType, componentType, count, byteStride, accessorClass: Accessor, max: max, min: min, byteAlign, arrayLength: _arrayLength});

    return accessor;
  }

  takeFlexibleAccessor({compositionType, componentType, count, byteStride, max, min, byteAlign = 4, arrayLength}:
    {compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count, byteStride: Byte, max?: number, min?: number, byteAlign?: Byte, arrayLength?: Size}): FlexibleAccessor {
    const _arrayLength = (arrayLength != null) ? arrayLength : 1;

    const accessor = this.__takeAccessorInner({compositionType, componentType, count, byteStride, accessorClass: FlexibleAccessor, max: max, min: min, byteAlign, arrayLength: _arrayLength});

    return accessor;

  }

  takeAccessorWithByteOffset({compositionType, componentType, count, byteOffset, max, min}:
    {compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count, byteOffset: Byte, max?: number, min?: number}): Accessor {
    const byteStride = this.byteStride;

    const accessor = this.__takeAccessorInnerWithByteOffset({compositionType, componentType, count, byteStride, byteOffset, accessorClass: Accessor, max, min});

    return accessor;
  }

  takeFlexibleAccessorWithByteOffset({compositionType, componentType, count, byteStride, byteOffset, max, min}:
    {compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count, byteStride: Byte, byteOffset: Byte, max?: number, min?: number}): FlexibleAccessor {
    const accessor = this.__takeAccessorInnerWithByteOffset({compositionType, componentType, count, byteStride, byteOffset, accessorClass: FlexibleAccessor, max, min});

    return accessor;

  }

  private __takeAccessorInner({compositionType, componentType, count, byteStride, accessorClass, max, min, byteAlign, arrayLength}:
    {compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count, byteStride: Byte, accessorClass:any, max?: number, min?: number, byteAlign: Byte, arrayLength: Size}): AccessorBase {
    let byteOffset = 0;
    if (this.isSoA) {
      byteOffset = this.__takenByteIndex;
      if (byteStride === 0) {
        this.__takenByteIndex += compositionType.getNumberOfComponents() * componentType.getSizeInBytes() * arrayLength * count;
      } else {
        this.__takenByteIndex += byteStride * count;
      }
    } else {
      byteOffset = this.__takenByteIndex;
      // if (byteStride === 0) {
      this.__takenByteIndex += compositionType.getNumberOfComponents() * componentType.getSizeInBytes() * arrayLength;
      // } else {
      //   this.__takenByteIndex += byteStride;
      // }
    }

    if (byteOffset % byteAlign !== 0) {
      console.info(`Padding bytes added because byteOffset is not ${byteAlign}byte aligned.`);
      const paddingBytes = byteAlign - byteOffset % byteAlign;
      byteOffset += paddingBytes;
      this.__takenByteIndex += paddingBytes;
    }

    // if (this.__byteOffset % byteAlign !== 0) {
    //   console.info(`Padding bytes added because byteOffsetFromBuffer is not ${byteAlign}byte aligned.`);
    //   const paddingBytes = byteAlign - this.__byteOffset % byteAlign;
    //   // this.__byteOffset += paddingBytes;
    //   this.__takenByteIndex += paddingBytes;
    //   // this.buffer._addTakenByteIndex(paddingBytes);
    // }

    const accessor = new accessorClass({
      bufferView: this, byteOffset: byteOffset, compositionType: compositionType, componentType: componentType, byteStride: byteStride, count: count, raw: this.__raw, max: max, min: min, arrayLength
    });

    this.__accessors.push(accessor);

    return accessor;

  }

  private __takeAccessorInnerWithByteOffset({compositionType, componentType, count, byteStride, byteOffset, accessorClass, max, min}:
    {compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count, byteStride: Byte, byteOffset: Byte, accessorClass:any, max?: number, min?: number}): AccessorBase {

    // if (byteOffset % 4 !== 0) {
    //   console.info('Padding bytes added because byteOffset is not 4byte aligned.');
    //   byteOffset += 4 - byteOffset % 4;
    // }

    // if (this.__byteOffset % 4 !== 0) {
    //   console.info('Padding bytes added because byteOffsetFromBuffer is not 4byte aligned.');
    //   this.__byteOffset += 4 - this.__byteOffset % 4;
    // this.buffer._addTakenByteIndex(4 - this.__byteOffset % 4);
    // }

    const accessor = new accessorClass({
      bufferView: this, byteOffset: byteOffset, compositionType: compositionType, componentType: componentType, byteStride: byteStride, count: count, raw: this.__raw, max: max, min: min, arrayLength: 1
    });

    this.__accessors.push(accessor);

    return accessor;

  }
}
