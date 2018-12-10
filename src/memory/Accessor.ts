import { ComponentType, ComponentTypeEnum } from "../definitions/ComponentType";
import { CompositionType, CompositionTypeEnum } from "../definitions/CompositionType";
import RnObject from "../core/Object";
import BufferView from "./BufferView";
import Vector2 from "../math/Vector2";
import Vector3 from "../math/Vector3";
import Vector4 from "../math/Vector4";
import Matrix44 from "../math/Matrix44";
import Matrix33 from "../math/Matrix33";

export default class Accessor extends RnObject {
  private __bufferView: BufferView;
  private __byteOffset: number;
  private __compositionType: CompositionTypeEnum = CompositionType.Unknown;
  private __componentType: ComponentTypeEnum = ComponentType.Unknown;
  private __count: Count = 0;
  private __raw: ArrayBuffer;
  private __dataView: DataView;
  private __typedArray: TypedArray;
  private __takenCount: Count = 0;
  private __byteStride: Byte = 0;
  private __typedArrayClass: any;
  private __dataViewGetter: any;
  private __dataViewSetter: any;

  constructor({bufferView, byteOffset, compositionType, componentType, count, raw} :
    {bufferView: BufferView, byteOffset: Byte, compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count, raw: Uint8Array}) {
    super();
    this.__bufferView = bufferView;
    this.__byteOffset = byteOffset;
    this.__compositionType = compositionType;
    this.__componentType = componentType;
    this.__count = count;
    this.__raw = raw.buffer;

    this.__typedArrayClass = this.getTypedArrayClass(componentType);
    this.__dataView = new DataView(raw.buffer, this.__byteOffset, compositionType.getNumberOfComponents() * componentType.getSizeInBytes() * count);
    this.__typedArray = new this.__typedArrayClass!(raw.buffer, this.__byteOffset, compositionType.getNumberOfComponents() * count);
    this.__dataViewGetter = (this.__dataView as any)[this.getDataViewGetter(componentType)!].bind(this.__dataView);
    this.__dataViewSetter = (this.__dataView as any)[this.getDataViewSetter(componentType)!].bind(this.__dataView);

    this.__byteStride = this.__compositionType.getNumberOfComponents() * this.__componentType.getSizeInBytes();
    if (this.__bufferView.isAoS) {
      this.__byteStride = this.__bufferView.byteStride;
    }

    console.log('Test', this.__byteOffset + this.__byteStride * (count - 1), this.__bufferView.__byteLength)
    if (this.__byteOffset + this.__byteStride * (count - 1) > this.__bufferView.__byteLength) {
      throw new Error('The range of the accessor exceeds the range of the buffer view.')
    }
  }

  getTypedArrayClass(componentType: ComponentTypeEnum)
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

  getDataViewGetter(componentType: ComponentTypeEnum)
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

  getDataViewSetter(componentType: ComponentTypeEnum)
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
  }

  takeOne(): TypedArray {
    const arrayBufferOfBufferView = this.__raw;
    let stride = this.__compositionType.getNumberOfComponents() * this.__componentType.getSizeInBytes();
    if (this.__bufferView.isAoS) {
      stride = this.__bufferView.byteStride;
    }
    const subTypedArray = new this.__typedArrayClass!(arrayBufferOfBufferView, this.__byteOffset + stride * this.__takenCount, this.__compositionType.getNumberOfComponents());
    this.__takenCount += 1;

    return subTypedArray;
  }

  getTypedArray(): TypedArray {
    if (this.__bufferView.isAoS) {
      console.warn('Be careful. this referance bufferView is AoS(Array on Structure), it means Interleaved Data. So you can not access your data properly by this TypedArray.');
    }
    return this.__typedArray!;
  }

  byteStride() {
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
    return new Vector4(this.__dataViewGetter(this.__byteStride*index, endian), this.__dataViewGetter(this.__byteStride*index+1, endian), this.__dataViewGetter(this.__byteStride*index+2, endian), this.__dataViewGetter(this.__byteStride*index+3, endian));
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
    this.__dataViewSetter(this.__byteStride*index, x, endian);
    this.__dataViewSetter(this.__byteStride*index+1, y, endian);
  }

  setVec3(index: Index, x: number, y: number, z: number, endian: boolean = true) {
    this.__dataViewSetter(this.__byteStride*index, x, endian);
    this.__dataViewSetter(this.__byteStride*index+1, y, endian);
    this.__dataViewSetter(this.__byteStride*index+2, z, endian);
  }

  setVec4(index: Index, x: number, y: number, z: number, w: number, endian: boolean = true) {
    this.__dataViewSetter(this.__byteStride*index, x, endian);
    this.__dataViewSetter(this.__byteStride*index+1, y, endian);
    this.__dataViewSetter(this.__byteStride*index+2, z, endian);
    this.__dataViewSetter(this.__byteStride*index+3, w, endian);
  }

  setScalarAt(index: Index, conpositionOffset: Index, value: number, endian: boolean = true) {
    this.__dataViewSetter(this.__byteStride*index + conpositionOffset, value, endian);
  }
}
