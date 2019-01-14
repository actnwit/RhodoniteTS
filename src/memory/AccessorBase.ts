import { ComponentType, ComponentTypeEnum } from "../definitions/ComponentType";
import { CompositionType, CompositionTypeEnum } from "../definitions/CompositionType";
import RnObject from "../core/Object";
import BufferView from "./BufferView";
import Vector2 from "../math/Vector2";
import Vector3 from "../math/Vector3";
import Vector4 from "../math/ImmutableVector4";
import Matrix44 from "../math/Matrix44";
import Matrix33 from "../math/Matrix33";
import ImmutableVector4 from "../math/ImmutableVector4";

export default class AccessorBase extends RnObject {
  protected __bufferView: BufferView;
  protected __byteOffsetInBuffer: number;
  protected __compositionType: CompositionTypeEnum = CompositionType.Unknown;
  protected __componentType: ComponentTypeEnum = ComponentType.Unknown;
  protected __count: Count = 0;
  protected __raw: ArrayBuffer;
  protected __dataView?: DataView;
  protected __typedArray?: TypedArray;
  protected __takenCount: Count = 0;
  protected __byteStride: Byte = 0;
  protected __typedArrayClass?: TypedArrayConstructor;
  protected __dataViewGetter: any;
  protected __dataViewSetter: any;

  constructor({bufferView, byteOffset, compositionType, componentType, byteStride, count, raw} :
    {bufferView: BufferView, byteOffset: Byte, compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, byteStride: Byte, count: Count, raw: Uint8Array}) {
    super(true);

    this.__bufferView = bufferView;
    this.__byteOffsetInBuffer = bufferView.byteOffset + byteOffset;
    this.__compositionType = compositionType;
    this.__componentType = componentType;
    this.__count = count;
    this.__raw = raw.buffer;

    this.__byteStride = byteStride;

    if (this.__byteStride === 0) {
      this.__byteStride = this.__compositionType.getNumberOfComponents() * this.__componentType.getSizeInBytes();
    }

    this.prepare();
  }

  prepare() {
    const typedArrayClass = this.getTypedArrayClass(this.__componentType);
    this.__typedArrayClass = typedArrayClass;

    if (this.__componentType.getSizeInBytes() === 8) {
      if (this.__byteOffsetInBuffer % 8 !== 0) {
        console.info('Padding added because of byteOffset of accessor is not 8byte aligned despite of Double precision.');
        this.__byteOffsetInBuffer += 8 - this.__byteOffsetInBuffer % 8;
      }
    }
    if (this.__bufferView.isSoA) {
      this.__dataView = new DataView(this.__raw, this.__byteOffsetInBuffer, this.__compositionType.getNumberOfComponents() * this.__componentType.getSizeInBytes() * this.__count);
    } else {
      this.__dataView = new DataView(this.__raw, this.__byteOffsetInBuffer);
    }
    this.__typedArray = new typedArrayClass!(this.__raw, this.__byteOffsetInBuffer, this.__compositionType.getNumberOfComponents() * this.__count);
    this.__dataViewGetter = (this.__dataView as any)[this.getDataViewGetter(this.__componentType)!].bind(this.__dataView);
    this.__dataViewSetter = (this.__dataView as any)[this.getDataViewSetter(this.__componentType)!].bind(this.__dataView);

  }

  getTypedArrayClass(componentType: ComponentTypeEnum): TypedArrayConstructor | undefined
   {
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

  getDataViewGetter(componentType: ComponentTypeEnum): string | undefined
  {
    switch (componentType) {
      case ComponentType.Byte: return 'getInt8';
      case ComponentType.UnsignedByte: return 'getUint8';
      case ComponentType.Short: return 'getInt16';
      case ComponentType.UnsignedShort: return 'getUint16';
      case ComponentType.Int: return 'getInt32';
      case ComponentType.UnsingedInt: return 'getUint32';
      case ComponentType.Float: return 'getFloat32';
      case ComponentType.Double: return 'getFloat64';
      default: console.error('Unexpected ComponentType!');
    }
  }

  getDataViewSetter(componentType: ComponentTypeEnum): string | undefined
  {
    switch (componentType) {
      case ComponentType.Byte: return 'setInt8';
      case ComponentType.UnsignedByte: return 'setUint8';
      case ComponentType.Short: return 'setInt16';
      case ComponentType.UnsignedShort: return 'setUint16';
      case ComponentType.Int: return 'setInt32';
      case ComponentType.UnsingedInt: return 'setUint32';
      case ComponentType.Float: return 'setFloat32';
      case ComponentType.Double: return 'setFloat64';
      default: console.error('Unexpected ComponentType!');
    }
    return undefined;
  }

  takeOne(): TypedArray {
    const arrayBufferOfBufferView = this.__raw;
    // let stride = this.__compositionType.getNumberOfComponents() * this.__componentType.getSizeInBytes();
    // if (this.__bufferView.isAoS) {
    //   stride = this.__bufferView.byteStride;
    // }
    const subTypedArray = new this.__typedArrayClass!(arrayBufferOfBufferView, this.__byteOffsetInBuffer + this.__byteStride * this.__takenCount, this.__compositionType.getNumberOfComponents());
    this.__takenCount += 1;

    return subTypedArray;
  }

  get numberOfComponents() {
    return this.__compositionType.getNumberOfComponents();
  }

  get componentSizeInBytes() {
    return this.__componentType.getSizeInBytes();
  }

  get elementSizeInBytes() {
    return this.numberOfComponents * this.componentSizeInBytes;
  }

  get elementCount(): Count {
    return this.__dataView!.byteLength / (this.numberOfComponents * this.componentSizeInBytes);
  }

  get byteLength(): Byte {
    return this.__byteStride * this.__count;
  }

  get componentType(): ComponentTypeEnum {
    return this.__componentType;
  }

  get compositionType(): CompositionTypeEnum{
    return this.__compositionType;
  }

  getTypedArray(): TypedArray {
    if (this.__bufferView.isAoS) {
      console.warn('Be careful. this referance bufferView is AoS(Array on Structure), it means Interleaved Data. So you can not access your data properly by this TypedArray.');
    }
    return this.__typedArray!;
  }

  get isAoS() {
    return this.__bufferView.isAoS;
  }

  get isSoA() {
    return this.__bufferView.isSoA;
  }

  get byteStride() {
    return this.__byteStride;
  }

  getScalar(index: Index, endian: boolean = true): number {
    return this.__dataViewGetter(this.__byteStride*index, endian);
  }

  getScalarAt(index: Index, compositionOffset: Index, endian: boolean = true): number {
    return this.__dataViewGetter(this.__byteStride*index + compositionOffset, endian);
  }

  getVec2AsArray(index: Index, endian: boolean = true): Array<number> {
    return [this.__dataViewGetter(this.__byteStride*index, endian), this.__dataViewGetter(this.__byteStride*index+1, endian)];
  }

  getVec3AsArray(index: Index, endian: boolean = true): Array<number> {
    return [this.__dataViewGetter(this.__byteStride*index, endian), this.__dataViewGetter(this.__byteStride*index+1, endian), this.__dataViewGetter(this.__byteStride*index+2, endian)];
  }

  getVec4AsArray(index: Index, endian: boolean = true): Array<number> {
    return [this.__dataViewGetter(this.__byteStride*index, endian), this.__dataViewGetter(this.__byteStride*index+1, endian), this.__dataViewGetter(this.__byteStride*index+2, endian), this.__dataViewGetter(this.__byteStride*index+3, endian)];
  }

  getMat3AsArray(index: Index, endian: boolean = true): Array<number> {
    return [
      this.__dataViewGetter(this.__byteStride*index, endian), this.__dataViewGetter(this.__byteStride*index+1, endian), this.__dataViewGetter(this.__byteStride*index+2, endian),
      this.__dataViewGetter(this.__byteStride*index+3, endian), this.__dataViewGetter(this.__byteStride*index+4, endian), this.__dataViewGetter(this.__byteStride*index+5, endian),
      this.__dataViewGetter(this.__byteStride*index+6, endian), this.__dataViewGetter(this.__byteStride*index+7, endian), this.__dataViewGetter(this.__byteStride*index+8, endian),
    ];
  }

  getMat4AsArray(index: Index, endian: boolean = true): Array<number> {
    return [
      this.__dataViewGetter(this.__byteStride*index, endian), this.__dataViewGetter(this.__byteStride*index+1, endian), this.__dataViewGetter(this.__byteStride*index+2, endian), this.__dataViewGetter(this.__byteStride*index+3, endian),
      this.__dataViewGetter(this.__byteStride*index+4, endian), this.__dataViewGetter(this.__byteStride*index+5, endian), this.__dataViewGetter(this.__byteStride*index+6, endian), this.__dataViewGetter(this.__byteStride*index+7, endian),
      this.__dataViewGetter(this.__byteStride*index+8, endian), this.__dataViewGetter(this.__byteStride*index+9, endian), this.__dataViewGetter(this.__byteStride*index+10, endian), this.__dataViewGetter(this.__byteStride*index+11, endian),
      this.__dataViewGetter(this.__byteStride*index+12, endian), this.__dataViewGetter(this.__byteStride*index+13, endian), this.__dataViewGetter(this.__byteStride*index+14, endian), this.__dataViewGetter(this.__byteStride*index+15, endian),
    ];
  }

  getVec2(index: Index, endian: boolean = true): Vector2 {
    return new Vector2(this.__dataViewGetter(this.__byteStride*index, endian), this.__dataViewGetter(this.__byteStride*index+1, endian));
  }

  getVec3(index: Index, endian: boolean = true): Vector3 {
    return new Vector3(this.__dataViewGetter(this.__byteStride*index, endian), this.__dataViewGetter(this.__byteStride*index+1, endian), this.__dataViewGetter(this.__byteStride*index+2, endian));
  }

  getVec4(index: Index, endian: boolean = true): Vector4 {
    return new ImmutableVector4(this.__dataViewGetter(this.__byteStride*index, endian), this.__dataViewGetter(this.__byteStride*index+1, endian), this.__dataViewGetter(this.__byteStride*index+2, endian), this.__dataViewGetter(this.__byteStride*index+3, endian));
  }

  getMat3(index: Index, endian: boolean = true): Matrix33 {
    return new Matrix33(
      this.__dataViewGetter(this.__byteStride*index, endian), this.__dataViewGetter(this.__byteStride*index+1, endian), this.__dataViewGetter(this.__byteStride*index+2, endian),
      this.__dataViewGetter(this.__byteStride*index+3, endian), this.__dataViewGetter(this.__byteStride*index+4, endian), this.__dataViewGetter(this.__byteStride*index+5, endian),
      this.__dataViewGetter(this.__byteStride*index+6, endian), this.__dataViewGetter(this.__byteStride*index+7, endian), this.__dataViewGetter(this.__byteStride*index+8, endian),
    );
  }

  getMat4(index: Index, endian: boolean = true): Matrix44 {
    return new Matrix44(
      this.__dataViewGetter(this.__byteStride*index, endian), this.__dataViewGetter(this.__byteStride*index+1, endian), this.__dataViewGetter(this.__byteStride*index+2, endian), this.__dataViewGetter(this.__byteStride*index+3, endian),
      this.__dataViewGetter(this.__byteStride*index+4, endian), this.__dataViewGetter(this.__byteStride*index+5, endian), this.__dataViewGetter(this.__byteStride*index+6, endian), this.__dataViewGetter(this.__byteStride*index+7, endian),
      this.__dataViewGetter(this.__byteStride*index+8, endian), this.__dataViewGetter(this.__byteStride*index+9, endian), this.__dataViewGetter(this.__byteStride*index+10, endian), this.__dataViewGetter(this.__byteStride*index+11, endian),
      this.__dataViewGetter(this.__byteStride*index+12, endian), this.__dataViewGetter(this.__byteStride*index+13, endian), this.__dataViewGetter(this.__byteStride*index+14, endian), this.__dataViewGetter(this.__byteStride*index+15, endian),
    );
  }

  setScalar(index: Index, value: number, endian: boolean = true) {
    this.__dataViewSetter(this.__byteStride*index, value, endian);
  }

  setVec2(index: Index, x: number, y: number, endian: boolean = true) {
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride*index, x, endian);
    this.__dataViewSetter(this.__byteStride*index+1*sizeInBytes, y, endian);
  }

  setVec3(index: Index, x: number, y: number, z: number, endian: boolean = true) {
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride*index, x, endian);
    this.__dataViewSetter(this.__byteStride*index+1*sizeInBytes, y, endian);
    this.__dataViewSetter(this.__byteStride*index+2*sizeInBytes, z, endian);
  }

  setVec4(index: Index, x: number, y: number, z: number, w: number, endian: boolean = true) {
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride*index, x, endian);
    this.__dataViewSetter(this.__byteStride*index+1*sizeInBytes, y, endian);
    this.__dataViewSetter(this.__byteStride*index+2*sizeInBytes, z, endian);
    this.__dataViewSetter(this.__byteStride*index+3*sizeInBytes, w, endian);
  }

  copyFromTypedArray(typedArray: TypedArray) {
    const componentN = this.numberOfComponents;
    const setter = (this as any)['setVec'+componentN];
    for (let j=0; j<(typedArray.byteLength/this.componentSizeInBytes); j++) {
      const idx = Math.floor(j/componentN);
      const idxN = idx * componentN;
      switch(componentN) {
        case 1: setter.call(this, idx, typedArray[idxN+0]); break;
        case 2: setter.call(this, idx, typedArray[idxN+0], typedArray[idxN+1]); break;
        case 3: setter.call(this, idx, typedArray[idxN+0], typedArray[idxN+1], typedArray[idxN+2]); break;
        case 4: setter.call(this, idx, typedArray[idxN+0], typedArray[idxN+1], typedArray[idxN+2], typedArray[idxN+3]); break;
        default: throw new Error('Other than vectors are currently not supported.');
      }
    }
  }

  setScalarAt(index: Index, conpositionOffset: Index, value: number, endian: boolean = true) {
    this.__dataViewSetter(this.__byteStride*index + conpositionOffset, value, endian);
  }

  get arrayBufferOfBufferView(): ArrayBuffer {
    return this.__raw;
  }

  get dataViewOfBufferView(): DataView {
    return this.__dataView!;
  }

  get byteOffsetInBufferView(): Byte {
    return this.__byteOffsetInBuffer - this.__bufferView.byteOffset;
  }

  get byteOffsetInBuffer(): Byte {
    return this.__byteOffsetInBuffer;
  }

  get bufferView(): BufferView {
    return this.__bufferView;
  }

}
