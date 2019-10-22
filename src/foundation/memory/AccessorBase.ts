import { ComponentType, ComponentTypeEnum } from "../definitions/ComponentType";
import { CompositionType, CompositionTypeEnum } from "../definitions/CompositionType";
import RnObject from "../core/RnObject";
import BufferView from "./BufferView";
import Vector2 from "../math/Vector2";
import Vector3 from "../math/Vector3";
import Vector4 from "../math/Vector4";
import Matrix44 from "../math/Matrix44";
import Matrix33 from "../math/Matrix33";
import MutableMatrix44 from "../math/MutableMatrix44";
import Accessor from "./Accessor";
import { Byte, Index, Count, TypedArrayConstructor, TypedArray, Size } from "../../types/CommonTypes";

export default class AccessorBase extends RnObject {
  protected __bufferView: BufferView;
  protected __byteOffsetInRawArrayBufferOfBuffer: number;
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
  protected __max?: any;
  protected __min?: any;
  protected __arrayLength = 1;

  constructor({bufferView, byteOffset, compositionType, componentType, byteStride, count, raw, max, min, arrayLength} :
    {bufferView: BufferView, byteOffset: Byte, compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, byteStride: Byte, count: Count, raw: ArrayBuffer, max?: number, min?: number, arrayLength: Size}) {
    super();

    this.__bufferView = bufferView;
    this.__byteOffsetInRawArrayBufferOfBuffer = bufferView.byteOffsetInRawArrayBufferOfBuffer + byteOffset;
    this.__compositionType = compositionType;
    this.__componentType = componentType;
    this.__count = count;
    this.__arrayLength = arrayLength;
    this.__raw = raw;

    if (max != null) {
      this.__max = max;
    }
    if (min != null) {
      this.__min = min;
    }

    this.__byteStride = byteStride;

    if (this.__byteStride === 0) {
      this.__byteStride = this.__compositionType.getNumberOfComponents() * this.__componentType.getSizeInBytes() * this.__arrayLength;
    }

    this.prepare();
  }

  prepare() {
    const typedArrayClass = this.getTypedArrayClass(this.__componentType);
    this.__typedArrayClass = typedArrayClass;

    if (this.__componentType.getSizeInBytes() === 8) {
      if (this.__byteOffsetInRawArrayBufferOfBuffer % 8 !== 0) {
        console.info('Padding added because of byteOffset of accessor is not 8 bytes aligned despite of Double precision.');
        this.__byteOffsetInRawArrayBufferOfBuffer += 8 - this.__byteOffsetInRawArrayBufferOfBuffer % 8;
      }
    }
    //  else if (this.__componentType.getSizeInBytes() === 4) {
    //   if (this.__byteOffsetInBuffer % 4 !== 0) {
    //     console.info('Padding added because of byteOffset of accessor is not 4 bytes aligned despite of Double precision.');
    //     this.__byteOffsetInBuffer += 4 - this.__byteOffsetInBuffer % 4;
    //   }
    // }
    if (this.__bufferView.isSoA) {
      this.__dataView = new DataView(this.__raw, this.__byteOffsetInRawArrayBufferOfBuffer, this.__compositionType.getNumberOfComponents() * this.__componentType.getSizeInBytes() * this.__count);
    } else {
      this.__dataView = new DataView(this.__raw, this.__byteOffsetInRawArrayBufferOfBuffer);
    }
    if (this.__byteOffsetInRawArrayBufferOfBuffer % this.__componentType.getSizeInBytes() === 0) {
      this.__typedArray = new typedArrayClass!(this.__raw, this.__byteOffsetInRawArrayBufferOfBuffer, this.__compositionType.getNumberOfComponents() * this.__count);
    }
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
      default: console.error('Unexpected ComponentType!'); return void 0;
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
      default: console.error('Unexpected ComponentType!'); return 'unkown';
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

    if (this.__takenCount >= this.__count) {
      console.error('You are trying to allocate more than you have secured.');
    }
    const subTypedArray = new this.__typedArrayClass!(arrayBufferOfBufferView, this.__byteOffsetInRawArrayBufferOfBuffer + this.__byteStride * this.__takenCount, this.__compositionType.getNumberOfComponents() * this.__arrayLength);
    this.__takenCount += 1;

    (subTypedArray as any)._accessor = this;
    (subTypedArray as any)._idx_of_accessor = this.__takenCount;

    return subTypedArray;
  }

  get takenCount(): Count {
    return this.takenCount;
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

  getScalar(i: Index, {indicesAccessor, endian = true}: {indicesAccessor?: Accessor|undefined, endian?: boolean}): number {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    return this.__dataViewGetter(this.__byteStride*index, endian);
  }

  getScalarAt(i: Index, compositionOffset: Index, {indicesAccessor, endian = true}: {indicesAccessor?: Accessor|undefined, endian?: boolean}): number {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    return this.__dataViewGetter(this.__byteStride*index + compositionOffset, endian);
  }

  getVec2AsArray(i: Index, {indicesAccessor, endian = true}: {indicesAccessor?: Accessor|undefined, endian?: boolean}): Array<number> {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return [this.__dataViewGetter(this.__byteStride*index, endian), this.__dataViewGetter(this.__byteStride*index+1*byteSize, endian)];
  }

  getVec3AsArray(i: Index, {indicesAccessor, endian = true}: {indicesAccessor?: Accessor|undefined, endian?: boolean}): Array<number> {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return [this.__dataViewGetter(this.__byteStride*index, endian), this.__dataViewGetter(this.__byteStride*index+1*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+2*byteSize, endian)];
  }

  getVec4AsArray(i: Index, {indicesAccessor, endian = true}: {indicesAccessor?: Accessor|undefined, endian?: boolean}): Array<number> {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return [this.__dataViewGetter(this.__byteStride*index, endian), this.__dataViewGetter(this.__byteStride*index+1*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+2*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+3*byteSize, endian)];
  }

  getMat3AsArray(i: Index, {indicesAccessor, endian = true}: {indicesAccessor?: Accessor|undefined, endian?: boolean}): Array<number> {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return [
      this.__dataViewGetter(this.__byteStride*index, endian), this.__dataViewGetter(this.__byteStride*index+1*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+2*byteSize, endian),
      this.__dataViewGetter(this.__byteStride*index+3*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+4*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+5*byteSize, endian),
      this.__dataViewGetter(this.__byteStride*index+6*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+7*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+8*byteSize, endian),
    ];
  }

  getMat4AsArray(i: Index, {indicesAccessor, endian = true}: {indicesAccessor?: Accessor|undefined, endian?: boolean}): Array<number> {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return [
      this.__dataViewGetter(this.__byteStride*index, endian), this.__dataViewGetter(this.__byteStride*index+1*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+2*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+3*byteSize, endian),
      this.__dataViewGetter(this.__byteStride*index+4*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+5*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+6*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+7*byteSize, endian),
      this.__dataViewGetter(this.__byteStride*index+8*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+9*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+10*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+11*byteSize, endian),
      this.__dataViewGetter(this.__byteStride*index+12*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+13*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+14*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+15*byteSize, endian),
    ];
  }

  getVec2(i: Index, {indicesAccessor, endian = true}: {indicesAccessor?: Accessor|undefined, endian?: boolean}): Vector2 {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return new Vector2(this.__dataViewGetter(this.__byteStride*index, endian), this.__dataViewGetter(this.__byteStride*index+1*byteSize, endian));
  }

  getVec3(i: Index, {indicesAccessor, endian = true}: {indicesAccessor?: Accessor|undefined, endian?: boolean}): Vector3 {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return new Vector3(this.__dataViewGetter(this.__byteStride*index, endian), this.__dataViewGetter(this.__byteStride*index+1*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+2*byteSize, endian));
  }

  getVec4(i: Index, {indicesAccessor, endian = true}: {indicesAccessor?: Accessor|undefined, endian?: boolean}): Vector4 {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return new Vector4(this.__dataViewGetter(this.__byteStride*index, endian), this.__dataViewGetter(this.__byteStride*index+1*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+2*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+3*byteSize, endian));
  }

  getMat3(i: Index, {indicesAccessor, endian = true}: {indicesAccessor?: Accessor|undefined, endian?: boolean}): Matrix33 {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return new Matrix33(
      this.__dataViewGetter(this.__byteStride*index, endian), this.__dataViewGetter(this.__byteStride*index+1*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+2*byteSize, endian),
      this.__dataViewGetter(this.__byteStride*index+3*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+4*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+5*byteSize, endian),
      this.__dataViewGetter(this.__byteStride*index+6*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+7*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+8*byteSize, endian),
    );
  }

  getMat4(i: Index, {indicesAccessor, endian = true}: {indicesAccessor?: Accessor|undefined, endian?: boolean}): MutableMatrix44 {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return new MutableMatrix44(
      this.__dataViewGetter(this.__byteStride*index, endian), this.__dataViewGetter(this.__byteStride*index+1*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+2*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+3*byteSize, endian),
      this.__dataViewGetter(this.__byteStride*index+4*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+5*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+6*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+7*byteSize, endian),
      this.__dataViewGetter(this.__byteStride*index+8*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+9*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+10*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+11*byteSize, endian),
      this.__dataViewGetter(this.__byteStride*index+12*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+13*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+14*byteSize, endian), this.__dataViewGetter(this.__byteStride*index+15*byteSize, endian),
    );
  }

  setScalar(i: Index, value: number, {indicesAccessor, endian = true}: {indicesAccessor?: Accessor|undefined, endian?: boolean}) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    this.__dataViewSetter(this.__byteStride*index, value, endian);
  }

  setVec2(i: Index, x: number, y: number, {indicesAccessor, endian = true}: {indicesAccessor?: Accessor|undefined, endian?: boolean}) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride*index, x, endian);
    this.__dataViewSetter(this.__byteStride*index+1*sizeInBytes, y, endian);
  }

  setVec3(i: Index, x: number, y: number, z: number, {indicesAccessor, endian = true}: {indicesAccessor?: Accessor|undefined, endian?: boolean}) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride*index, x, endian);
    this.__dataViewSetter(this.__byteStride*index+1*sizeInBytes, y, endian);
    this.__dataViewSetter(this.__byteStride*index+2*sizeInBytes, z, endian);
  }

  setVec4(i: Index, x: number, y: number, z: number, w: number, {indicesAccessor, endian = true}: {indicesAccessor?: Accessor|undefined, endian?: boolean}) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride*index, x, endian);
    this.__dataViewSetter(this.__byteStride*index+1*sizeInBytes, y, endian);
    this.__dataViewSetter(this.__byteStride*index+2*sizeInBytes, z, endian);
    this.__dataViewSetter(this.__byteStride*index+3*sizeInBytes, w, endian);
  }

  setVec2AsVector(i: Index, vec: Vector2, {indicesAccessor, endian = true}: {indicesAccessor?: Accessor|undefined, endian?: boolean}) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride*index, vec.x, endian);
    this.__dataViewSetter(this.__byteStride*index+1*sizeInBytes, vec.y, endian);
  }

  setVec3AsVector(i: Index, vec: Vector3, {indicesAccessor, endian = true}: {indicesAccessor?: Accessor|undefined, endian?: boolean}) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride*index, vec.x, endian);
    this.__dataViewSetter(this.__byteStride*index+1*sizeInBytes, vec.y, endian);
    this.__dataViewSetter(this.__byteStride*index+2*sizeInBytes, vec.z, endian);
  }

  setVec4AsVector(i: Index, vec: Vector4, {indicesAccessor, endian = true}: {indicesAccessor?: Accessor|undefined, endian?: boolean}) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride*index, vec.x, endian);
    this.__dataViewSetter(this.__byteStride*index+1*sizeInBytes, vec.y, endian);
    this.__dataViewSetter(this.__byteStride*index+2*sizeInBytes, vec.z, endian);
    this.__dataViewSetter(this.__byteStride*index+3*sizeInBytes, vec.w, endian);
  }

  copyFromTypedArray(typedArray: TypedArray) {
    const componentN = this.numberOfComponents;
    const setter = (this as any)['setVec'+componentN];
    for (let j=0; j<(typedArray.byteLength/this.componentSizeInBytes); j++) {
      const idx = Math.floor(j/componentN);
      const idxN = idx * componentN;
      switch(componentN) {
        case 1: setter.call(this, idx, typedArray[idxN+0], {}); break;
        case 2: setter.call(this, idx, typedArray[idxN+0], typedArray[idxN+1], {}); break;
        case 3: setter.call(this, idx, typedArray[idxN+0], typedArray[idxN+1], typedArray[idxN+2], {}); break;
        case 4: setter.call(this, idx, typedArray[idxN+0], typedArray[idxN+1], typedArray[idxN+2], typedArray[idxN+3], {}); break;
        default: throw new Error('Other than vectors are currently not supported.');
      }
    }
  }

  setScalarAt(i: Index, conpositionOffset: Index, value: number, {indicesAccessor, endian = true}: {indicesAccessor?: Accessor|undefined, endian?: boolean}) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    this.__dataViewSetter(this.__byteStride*index + conpositionOffset, value, endian);
  }

  setElementFromSameCompositionAccessor(i:Index, accessor: Accessor, secondIdx?:Index) {
    const j = (secondIdx != null) ? secondIdx : i;
    if (this.compositionType.getNumberOfComponents() === 1) {
      this.setScalar(i, accessor.getScalar(j, {}), {});
    } else if (this.compositionType.getNumberOfComponents() === 2) {
      this.setVec2AsVector(i, accessor.getVec2(j, {}), {});
    } else if (this.compositionType.getNumberOfComponents() === 3) {
      this.setVec3AsVector(i, accessor.getVec3(j, {}), {});
    } else if (this.compositionType.getNumberOfComponents() === 4) {
      this.setVec4AsVector(i, accessor.getVec4(j, {}), {});
    }
  }

  setElementFromAccessor(i:Index, accessor: Accessor, secondIdx?:Index) {
    const j = (secondIdx != null) ? secondIdx : i
    if (this.compositionType.getNumberOfComponents() === 1) {
      if (accessor.compositionType.getNumberOfComponents() === 1) {
        this.setScalar(i, accessor.getScalar(j, {}), {});
      } else if (accessor.compositionType.getNumberOfComponents() === 2) {
        this.setScalar(i, accessor.getVec2(j, {}).x, {});
      } else if (accessor.compositionType.getNumberOfComponents() === 3) {
        this.setScalar(i, accessor.getVec3(j, {}).x, {});
      } else if (accessor.compositionType.getNumberOfComponents() === 4) {
        this.setScalar(i, accessor.getVec4(j, {}).x, {});
      }
    } else if (this.compositionType.getNumberOfComponents() === 2) {
      if (accessor.compositionType.getNumberOfComponents() === 1) {
        const scalar = accessor.getScalar(j, {});
        this.setVec2(i, scalar, 0, {});
      } else if (accessor.compositionType.getNumberOfComponents() === 2) {
        this.setVec2AsVector(i, accessor.getVec2(j, {}), {});
      } else if (accessor.compositionType.getNumberOfComponents() === 3) {
        const vec = accessor.getVec3(j, {});
        this.setVec2(i, vec.x, vec.y, {});
      } else if (accessor.compositionType.getNumberOfComponents() === 4) {
        const vec = accessor.getVec4(j, {});
        this.setVec2(i, vec.x, vec.y, {});
      }
    } else if (this.compositionType.getNumberOfComponents() === 3) {
      if (accessor.compositionType.getNumberOfComponents() === 1) {
        const scalar = accessor.getScalar(j, {});
        this.setVec3(i, scalar, 0, 0, {});
      } else if (accessor.compositionType.getNumberOfComponents() === 2) {
        const vec = accessor.getVec2(j, {});
        this.setVec3(i, vec.x, vec.y, 0, {});
      } else if (accessor.compositionType.getNumberOfComponents() === 3) {
        const vec = accessor.getVec3(j, {});
        this.setVec3AsVector(i, vec, {});
      } else if (accessor.compositionType.getNumberOfComponents() === 4) {
        const vec = accessor.getVec4(j, {});
        this.setVec3(i, vec.x, vec.y, vec.z, {});
      }
    } else if (this.compositionType.getNumberOfComponents() === 4) {
      if (accessor.compositionType.getNumberOfComponents() === 1) {
        const scalar = accessor.getScalar(j, {});
        this.setVec4(i, scalar, 0, 0, 0, {});
      } else if (accessor.compositionType.getNumberOfComponents() === 2) {
        const vec = accessor.getVec2(j, {});
        this.setVec4(i, vec.x, vec.y, 0, 0, {});
      } else if (accessor.compositionType.getNumberOfComponents() === 3) {
        const vec = accessor.getVec3(j, {});
        this.setVec4(i, vec.x, vec.y, vec.z, 0, {});
      } else if (accessor.compositionType.getNumberOfComponents() === 4) {
        const vec = accessor.getVec4(j, {});
        this.setVec4AsVector(i, vec, {});
      }
    }
  }

  addElementFromSameCompositionAccessor(i:Index, accessor: Accessor, coeff: number, secondIdx?:Index) {
    const j = (secondIdx != null) ? secondIdx : i;
    if (this.compositionType.getNumberOfComponents() === 1) {
      this.setScalar(i, this.getScalar(i, {}) + coeff * accessor.getScalar(j, {}), {});
    } else if (this.compositionType.getNumberOfComponents() === 2) {
      this.setVec2AsVector(i, Vector2.add(this.getVec2(i, {}), Vector2.multiply(accessor.getVec2(j, {}), coeff)), {});
    } else if (this.compositionType.getNumberOfComponents() === 3) {
      this.setVec3AsVector(i, Vector3.add(this.getVec3(i, {}), Vector3.multiply(accessor.getVec3(j, {}), coeff)), {});
    } else if (this.compositionType.getNumberOfComponents() === 4) {
      this.setVec4AsVector(i, Vector4.add(this.getVec4(i, {}), Vector4.multiply(accessor.getVec4(j, {}), coeff)), {});
    }
  }

  get arrayBufferOfBufferView(): ArrayBuffer {
    return this.__raw;
  }

  get dataViewOfBufferView(): DataView {
    return this.__dataView!;
  }

  get byteOffsetInBufferView(): Byte {
    return this.__byteOffsetInRawArrayBufferOfBuffer - this.__bufferView.byteOffsetInRawArrayBufferOfBuffer;
  }

  get byteOffsetInBuffer(): Byte {
    return this.__byteOffsetInRawArrayBufferOfBuffer - this.__bufferView.buffer.byteOffsetInRawArrayBuffer;
  }

  get byteOffsetInRawArrayBufferOfBuffer() {
    return this.__byteOffsetInRawArrayBufferOfBuffer;
  }

  get bufferView(): BufferView {
    return this.__bufferView;
  }

  get min() {
    return this.__min;
  }

  get max() {
    return this.__max;
  }

  calcMinMax() {
    const componentN = this.compositionType.getNumberOfComponents();
    if (componentN === 4) {
      const minVec4 = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE];
      const maxVec4 = [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE];
      for(let i=0; i<this.elementCount; i++) {
        const vec4array = this.getVec4AsArray(i, {});
        for (let j=0; j<4; j++) {
          if (vec4array[j] < minVec4[j]) {
            minVec4[j] = vec4array[j];
          }
          if (maxVec4[j] < vec4array[j]) {
            maxVec4[j] = vec4array[j];
          }
        }
      }
      this.__min = minVec4;
      this.__max = maxVec4;
    } else if (componentN === 3) {
      const minVec3 = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE];
      const maxVec3 = [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE];
      for(let i=0; i<this.elementCount; i++) {
        const vec3array = this.getVec3AsArray(i, {});
        for (let j=0; j<3; j++) {
          if (vec3array[j] < minVec3[j]) {
            minVec3[j] = vec3array[j];
          }
          if (maxVec3[j] < vec3array[j]) {
            maxVec3[j] = vec3array[j];
          }
        }
      }
      this.__min = minVec3;
      this.__max = maxVec3;
    } else if (componentN === 2) {
      const minVec2 = [Number.MAX_VALUE, Number.MAX_VALUE];
      const maxVec2 = [-Number.MAX_VALUE, -Number.MAX_VALUE];
      for(let i=0; i<this.elementCount; i++) {
        const vec2array = this.getVec2AsArray(i, {});
        for (let j=0; j<2; j++) {
          if (vec2array[j] < minVec2[j]) {
            minVec2[j] = vec2array[j];
          }
          if (maxVec2[j] < vec2array[j]) {
            maxVec2[j] = vec2array[j];
          }
        }
      }
      this.__min = minVec2;
      this.__max = maxVec2;
    } else if (componentN === 1) {
      let min = Number.MAX_VALUE;
      let max = -Number.MAX_VALUE;
      for(let i=0; i<this.elementCount; i++) {
        const scalar = this.getScalar(i, {});
        if (scalar < min) {
          min = scalar;
        }
        if (max < scalar) {
          max = scalar;
        }
      }
      this.__min = min;
      this.__max = max;
    }
  }
}
