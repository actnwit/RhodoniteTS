import {ComponentType, ComponentTypeEnum} from '../definitions/ComponentType';
import {
  CompositionType,
  CompositionTypeEnum,
} from '../definitions/CompositionType';
import RnObject from '../core/RnObject';
import BufferView from './BufferView';
import Vector2 from '../math/Vector2';
import Vector3 from '../math/Vector3';
import Vector4 from '../math/Vector4';
import MutableVector2 from '../math/MutableVector2';
import MutableVector3 from '../math/MutableVector3';
import MutableVector4 from '../math/MutableVector4';
import Matrix33 from '../math/Matrix33';
import MutableMatrix33 from '../math/MutableMatrix33';
import MutableMatrix44 from '../math/MutableMatrix44';
import {
  Byte,
  Index,
  Count,
  TypedArrayConstructor,
  TypedArray,
  Size,
} from '../../commontypes/CommonTypes';

export default class Accessor extends RnObject {
  private __bufferView: BufferView;
  private __byteOffsetInRawArrayBufferOfBuffer: number;
  private __compositionType: CompositionTypeEnum = CompositionType.Unknown;
  private __componentType: ComponentTypeEnum = ComponentType.Unknown;
  private __count: Count = 0;
  private __raw: ArrayBuffer;
  private __typedArray?: TypedArray;
  private __takenCount: Count = 0;
  private __byteStride: Byte = 0;
  private __typedArrayClass?: TypedArrayConstructor;
  private __dataViewGetter: any;
  private __dataViewSetter: any;
  private __max: MutableVector4 = new MutableVector4(
    -Number.MAX_VALUE,
    -Number.MAX_VALUE,
    -Number.MAX_VALUE,
    -Number.MAX_VALUE
  );
  private __min: MutableVector4 = new MutableVector4(
    Number.MAX_VALUE,
    Number.MAX_VALUE,
    Number.MAX_VALUE,
    Number.MAX_VALUE
  );
  private __arrayLength = 1;
  private __normalized = false;
  private __isMinMixDirty = true;

  private static __tmpVector4_0 = MutableVector4.zero();
  private static __tmpVector3_0 = MutableVector3.zero();
  private static __tmpVector2_0 = MutableVector2.zero();
  private __dataView?: DataView;

  constructor({
    bufferView,
    byteOffset,
    compositionType,
    componentType,
    byteStride,
    count,
    raw,
    max,
    min,
    arrayLength,
    normalized,
    dataView,
  }: {
    bufferView: BufferView;
    byteOffset: Byte;
    compositionType: CompositionTypeEnum;
    componentType: ComponentTypeEnum;
    byteStride: Byte;
    count: Count;
    raw: ArrayBuffer;
    max?: number[];
    min?: number[];
    arrayLength: Size;
    normalized: boolean;
    dataView: DataView;
  }) {
    super();

    this.__bufferView = bufferView;
    this.__byteOffsetInRawArrayBufferOfBuffer =
      bufferView.byteOffsetInRawArrayBufferOfBuffer + byteOffset;
    this.__compositionType = compositionType;
    this.__componentType = componentType;
    this.__count = count;
    this.__arrayLength = arrayLength;
    this.__dataView = dataView;

    if (max) {
      this.__max.setComponents(
        max[0] || -Number.MAX_VALUE,
        max[1] || -Number.MAX_VALUE,
        max[2] || -Number.MAX_VALUE,
        max[3] || -Number.MAX_VALUE
      );
    }

    if (min) {
      this.__min.setComponents(
        min[0] || Number.MAX_VALUE,
        min[1] || Number.MAX_VALUE,
        min[2] || Number.MAX_VALUE,
        min[3] || Number.MAX_VALUE
      );
    }

    this.__raw = raw;
    this.__normalized = normalized;

    this.__byteStride = byteStride;

    if (this.__byteStride === 0) {
      this.__byteStride =
        this.__compositionType.getNumberOfComponents() *
        this.__componentType.getSizeInBytes() *
        this.__arrayLength;
    }

    this.prepare();
  }

  prepare() {
    const typedArrayClass = this.getTypedArrayClass(this.__componentType);
    this.__typedArrayClass = typedArrayClass;

    if (this.__componentType.getSizeInBytes() === 8) {
      if (this.__byteOffsetInRawArrayBufferOfBuffer % 8 !== 0) {
        console.info(
          'Padding added because of byteOffset of accessor is not 8 bytes aligned despite of Double precision.'
        );
        this.__byteOffsetInRawArrayBufferOfBuffer +=
          this.__byteOffsetInRawArrayBufferOfBuffer % 8 === 0
            ? 0
            : 8 - (this.__byteOffsetInRawArrayBufferOfBuffer % 8);
      }
    }
    //  else if (this.__componentType.getSizeInBytes() === 4) {
    //   if (this.__byteOffsetInBuffer % 4 !== 0) {
    //     console.info('Padding added because of byteOffset of accessor is not 4 bytes aligned despite of Double precision.');
    //     this.__byteOffsetInBuffer += 4 - this.__byteOffsetInBuffer % 4;
    //   }
    // }
    /// Check
    if (
      this.__raw.byteLength - this.__byteOffsetInRawArrayBufferOfBuffer <
      this.byteStride * this.__count
    ) {
      console.error(
        `Requesting a data size that exceeds the remaining capacity of the buffer: ${
          this.bufferView.buffer.name
        }.
        this.__raw.byteLength: ${this.__raw.byteLength}
        this.__byteOffsetInRawArrayBufferOfBuffer: ${
          this.byteOffsetInRawArrayBufferOfBuffer
        }
        this.byteStride: ${this.byteStride}
        this.__count: ${this.__count}
        this.__raw.byteLength - this.__byteOffsetInRawArrayBufferOfBuffer: ${
          this.__raw.byteLength - this.__byteOffsetInRawArrayBufferOfBuffer
        }
        this.byteStride * this.__count: ${this.byteStride * this.__count}
        `
      );
    }

    if (
      this.__byteOffsetInRawArrayBufferOfBuffer %
        this.__componentType.getSizeInBytes() ===
      0
    ) {
      this.__typedArray = new typedArrayClass!(
        this.__raw,
        this.__byteOffsetInRawArrayBufferOfBuffer,
        this.__compositionType.getNumberOfComponents() * this.__count
      );
    }
    this.__dataViewGetter = (this.__dataView as any)[
      this.getDataViewGetter(this.__componentType)!
    ].bind(this.__dataView);
    this.__dataViewSetter = (this.__dataView as any)[
      this.getDataViewSetter(this.__componentType)!
    ].bind(this.__dataView);
  }

  getTypedArrayClass(
    componentType: ComponentTypeEnum
  ): TypedArrayConstructor | undefined {
    switch (componentType) {
      case ComponentType.Byte:
        return Int8Array;
      case ComponentType.UnsignedByte:
        return Uint8Array;
      case ComponentType.Short:
        return Int16Array;
      case ComponentType.UnsignedShort:
        return Uint16Array;
      case ComponentType.Int:
        return Int32Array;
      case ComponentType.UnsignedInt:
        return Uint32Array;
      case ComponentType.Float:
        return Float32Array;
      case ComponentType.Double:
        return Float64Array;
      default:
        console.error('Unexpected ComponentType!');
        return void 0;
    }
  }

  getDataViewGetter(componentType: ComponentTypeEnum): string | undefined {
    switch (componentType) {
      case ComponentType.Byte:
        return 'getInt8';
      case ComponentType.UnsignedByte:
        return 'getUint8';
      case ComponentType.Short:
        return 'getInt16';
      case ComponentType.UnsignedShort:
        return 'getUint16';
      case ComponentType.Int:
        return 'getInt32';
      case ComponentType.UnsignedInt:
        return 'getUint32';
      case ComponentType.Float:
        return 'getFloat32';
      case ComponentType.Double:
        return 'getFloat64';
      default:
        console.error('Unexpected ComponentType!');
        return 'unknown';
    }
  }

  getDataViewSetter(componentType: ComponentTypeEnum): string | undefined {
    switch (componentType) {
      case ComponentType.Byte:
        return 'setInt8';
      case ComponentType.UnsignedByte:
        return 'setUint8';
      case ComponentType.Short:
        return 'setInt16';
      case ComponentType.UnsignedShort:
        return 'setUint16';
      case ComponentType.Int:
        return 'setInt32';
      case ComponentType.UnsignedInt:
        return 'setUint32';
      case ComponentType.Float:
        return 'setFloat32';
      case ComponentType.Double:
        return 'setFloat64';
      default:
        console.error('Unexpected ComponentType!');
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
    const subTypedArray = new this.__typedArrayClass!(
      arrayBufferOfBufferView,
      this.__byteOffsetInRawArrayBufferOfBuffer +
        this.__byteStride * this.__takenCount,
      this.__compositionType.getNumberOfComponents() * this.__arrayLength
    );
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
    return this.__count;
  }

  get byteLength(): Byte {
    return this.__byteStride * this.__count;
  }

  get componentType(): ComponentTypeEnum {
    return this.__componentType;
  }

  get compositionType(): CompositionTypeEnum {
    return this.__compositionType;
  }

  getTypedArray(): TypedArray {
    if (this.__bufferView.isAoS) {
      console.warn(
        'Be careful. this reference bufferView is AoS(Array on Structure), it means Interleaved Data. So you can not access your data properly by this TypedArray.'
      );
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

  getScalar(
    i: Index,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ): number {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    return this.__dataViewGetter(this.__byteStride * index, endian);
  }

  getScalarAt(
    i: Index,
    compositionOffset: Index,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ): number {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    return this.__dataViewGetter(
      this.__byteStride * index + compositionOffset,
      endian
    );
  }

  getVec2AsArray(
    i: Index,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ): Array<number> {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return [
      this.__dataViewGetter(this.__byteStride * index, endian),
      this.__dataViewGetter(this.__byteStride * index + 1 * byteSize, endian),
    ];
  }

  getVec3AsArray(
    i: Index,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ): Array<number> {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return [
      this.__dataViewGetter(this.__byteStride * index, endian),
      this.__dataViewGetter(this.__byteStride * index + 1 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 2 * byteSize, endian),
    ];
  }

  getVec4AsArray(
    i: Index,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ): Array<number> {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return [
      this.__dataViewGetter(this.__byteStride * index, endian),
      this.__dataViewGetter(this.__byteStride * index + 1 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 2 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 3 * byteSize, endian),
    ];
  }

  getMat3AsArray(
    i: Index,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ): Array<number> {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return [
      this.__dataViewGetter(this.__byteStride * index, endian),
      this.__dataViewGetter(this.__byteStride * index + 1 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 2 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 3 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 4 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 5 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 6 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 7 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 8 * byteSize, endian),
    ];
  }

  getMat4AsArray(
    i: Index,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ): Array<number> {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return [
      this.__dataViewGetter(this.__byteStride * index, endian),
      this.__dataViewGetter(this.__byteStride * index + 1 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 2 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 3 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 4 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 5 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 6 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 7 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 8 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 9 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 10 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 11 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 12 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 13 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 14 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 15 * byteSize, endian),
    ];
  }

  getVec2(
    i: Index,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ): Vector2 {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return new Vector2(
      this.__dataViewGetter(this.__byteStride * index, endian),
      this.__dataViewGetter(this.__byteStride * index + 1 * byteSize, endian)
    );
  }

  getVec3(
    i: Index,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ): Vector3 {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return new Vector3(
      this.__dataViewGetter(this.__byteStride * index, endian),
      this.__dataViewGetter(this.__byteStride * index + 1 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 2 * byteSize, endian)
    );
  }

  getVec4(
    i: Index,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ): Vector4 {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return new Vector4(
      this.__dataViewGetter(this.__byteStride * index, endian),
      this.__dataViewGetter(this.__byteStride * index + 1 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 2 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 3 * byteSize, endian)
    );
  }

  getMat3(
    i: Index,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ): Matrix33 {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return new Matrix33(
      this.__dataViewGetter(this.__byteStride * index, endian),
      this.__dataViewGetter(this.__byteStride * index + 1 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 2 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 3 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 4 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 5 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 6 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 7 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 8 * byteSize, endian)
    );
  }

  getMat4(
    i: Index,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ): MutableMatrix44 {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return new MutableMatrix44(
      this.__dataViewGetter(this.__byteStride * index, endian),
      this.__dataViewGetter(this.__byteStride * index + 1 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 2 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 3 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 4 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 5 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 6 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 7 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 8 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 9 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 10 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 11 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 12 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 13 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 14 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 15 * byteSize, endian)
    );
  }

  getVec2To(
    i: Index,
    out: MutableVector2,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ): Vector2 {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return out.setComponents(
      this.__dataViewGetter(this.__byteStride * index, endian),
      this.__dataViewGetter(this.__byteStride * index + 1 * byteSize, endian)
    );
  }

  getVec3To(
    i: Index,
    out: MutableVector3,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ): Vector3 {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return out.setComponents(
      this.__dataViewGetter(this.__byteStride * index, endian),
      this.__dataViewGetter(this.__byteStride * index + 1 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 2 * byteSize, endian)
    );
  }

  getVec4To(
    i: Index,
    out: MutableVector4,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ): Vector4 {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return out.setComponents(
      this.__dataViewGetter(this.__byteStride * index, endian),
      this.__dataViewGetter(this.__byteStride * index + 1 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 2 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 3 * byteSize, endian)
    );
  }

  getMat3To(
    i: Index,
    out: MutableMatrix33,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ): Matrix33 {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return out.setComponents(
      this.__dataViewGetter(this.__byteStride * index, endian),
      this.__dataViewGetter(this.__byteStride * index + 1 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 2 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 3 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 4 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 5 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 6 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 7 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 8 * byteSize, endian)
    );
  }

  getMat4To(
    i: Index,
    out: MutableMatrix44,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ): MutableMatrix44 {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return out.setComponents(
      this.__dataViewGetter(this.__byteStride * index, endian),
      this.__dataViewGetter(this.__byteStride * index + 1 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 2 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 3 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 4 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 5 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 6 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 7 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 8 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 9 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 10 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 11 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 12 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 13 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 14 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 15 * byteSize, endian)
    );
  }

  setScalar(
    i: Index,
    value: number,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    this.__dataViewSetter(this.__byteStride * index, value, endian);
    this.__isMinMixDirty = true;
  }

  setVec2(
    i: Index,
    x: number,
    y: number,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride * index, x, endian);
    this.__dataViewSetter(
      this.__byteStride * index + 1 * sizeInBytes,
      y,
      endian
    );
    this.__isMinMixDirty = true;
  }

  setVec3(
    i: Index,
    x: number,
    y: number,
    z: number,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride * index, x, endian);
    this.__dataViewSetter(
      this.__byteStride * index + 1 * sizeInBytes,
      y,
      endian
    );
    this.__dataViewSetter(
      this.__byteStride * index + 2 * sizeInBytes,
      z,
      endian
    );
    this.__isMinMixDirty = true;
  }

  setVec4(
    i: Index,
    x: number,
    y: number,
    z: number,
    w: number,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride * index, x, endian);
    this.__dataViewSetter(
      this.__byteStride * index + 1 * sizeInBytes,
      y,
      endian
    );
    this.__dataViewSetter(
      this.__byteStride * index + 2 * sizeInBytes,
      z,
      endian
    );
    this.__dataViewSetter(
      this.__byteStride * index + 3 * sizeInBytes,
      w,
      endian
    );
    this.__isMinMixDirty = true;
  }

  setVec2AsVector(
    i: Index,
    vec: Vector2,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride * index, vec.x, endian);
    this.__dataViewSetter(
      this.__byteStride * index + 1 * sizeInBytes,
      vec.y,
      endian
    );
    this.__isMinMixDirty = true;
  }

  setVec3AsVector(
    i: Index,
    vec: Vector3,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride * index, vec.x, endian);
    this.__dataViewSetter(
      this.__byteStride * index + 1 * sizeInBytes,
      vec.y,
      endian
    );
    this.__dataViewSetter(
      this.__byteStride * index + 2 * sizeInBytes,
      vec.z,
      endian
    );
    this.__isMinMixDirty = true;
  }

  setVec4AsVector(
    i: Index,
    vec: Vector4,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride * index, vec.x, endian);
    this.__dataViewSetter(
      this.__byteStride * index + 1 * sizeInBytes,
      vec.y,
      endian
    );
    this.__dataViewSetter(
      this.__byteStride * index + 2 * sizeInBytes,
      vec.z,
      endian
    );
    this.__dataViewSetter(
      this.__byteStride * index + 3 * sizeInBytes,
      vec.w,
      endian
    );
    this.__isMinMixDirty = true;
  }

  copyFromTypedArray(typedArray: TypedArray) {
    const componentN = this.numberOfComponents;
    for (
      let j = 0;
      j < typedArray.byteLength / this.componentSizeInBytes;
      j++
    ) {
      const idx = Math.floor(j / componentN);
      const idxN = idx * componentN;
      switch (componentN) {
        case 1:
          this.setScalar(idx, typedArray[idxN + 0], {});
          break;
        case 2:
          this.setVec2(idx, typedArray[idxN + 0], typedArray[idxN + 1], {});
          break;
        case 3:
          this.setVec3(
            idx,
            typedArray[idxN + 0],
            typedArray[idxN + 1],
            typedArray[idxN + 2],
            {}
          );
          break;
        case 4:
          this.setVec4(
            idx,
            typedArray[idxN + 0],
            typedArray[idxN + 1],
            typedArray[idxN + 2],
            typedArray[idxN + 3],
            {}
          );
          break;
        default:
          throw new Error('Other than vectors are currently not supported.');
      }
    }
  }

  setScalarAt(
    i: Index,
    compositionOffset: Index,
    value: number,
    {
      indicesAccessor,
      endian = true,
    }: {indicesAccessor?: Accessor | undefined; endian?: boolean}
  ) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    this.__dataViewSetter(
      this.__byteStride * index + compositionOffset,
      value,
      endian
    );
    this.__isMinMixDirty = true;
  }

  setElementFromSameCompositionAccessor(
    i: Index,
    accessor: Accessor,
    secondIdx?: Index
  ) {
    const j = secondIdx != null ? secondIdx : i;
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

  copyBuffer(accessor: Accessor) {
    new Uint8Array(this.__raw).set(
      new Uint8Array(
        accessor.__raw,
        accessor.__byteOffsetInRawArrayBufferOfBuffer
      ),
      this.__byteOffsetInRawArrayBufferOfBuffer
    );
    this.__isMinMixDirty = true;
  }

  setElementFromAccessor(i: Index, accessor: Accessor, secondIdx?: Index) {
    const j = secondIdx != null ? secondIdx : i;
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

  addElementFromSameCompositionAccessor(
    i: Index,
    accessor: Accessor,
    coeff: number,
    secondIdx?: Index
  ) {
    const j = secondIdx != null ? secondIdx : i;
    if (this.compositionType.getNumberOfComponents() === 1) {
      this.setScalar(
        i,
        this.getScalar(i, {}) + coeff * accessor.getScalar(j, {}),
        {}
      );
    } else if (this.compositionType.getNumberOfComponents() === 2) {
      this.setVec2AsVector(
        i,
        Vector2.add(
          this.getVec2(i, {}),
          Vector2.multiply(accessor.getVec2(j, {}), coeff)
        ),
        {}
      );
    } else if (this.compositionType.getNumberOfComponents() === 3) {
      this.setVec3AsVector(
        i,
        Vector3.add(
          this.getVec3(i, {}),
          Vector3.multiply(accessor.getVec3(j, {}), coeff)
        ),
        {}
      );
    } else if (this.compositionType.getNumberOfComponents() === 4) {
      this.setVec4AsVector(
        i,
        Vector4.add(
          this.getVec4(i, {}),
          Vector4.multiply(accessor.getVec4(j, {}), coeff)
        ),
        {}
      );
    }
  }

  get arrayBufferOfBufferView(): ArrayBuffer {
    return this.__raw;
  }

  get dataViewOfBufferView(): DataView {
    return this.__dataView!;
  }

  get byteOffsetInBufferView(): Byte {
    return (
      this.__byteOffsetInRawArrayBufferOfBuffer -
      this.__bufferView.byteOffsetInRawArrayBufferOfBuffer
    );
  }

  get byteOffsetInBuffer(): Byte {
    return (
      this.__byteOffsetInRawArrayBufferOfBuffer -
      this.__bufferView.buffer.byteOffsetInRawArrayBuffer
    );
  }

  get byteOffsetInRawArrayBufferOfBuffer() {
    return this.__byteOffsetInRawArrayBufferOfBuffer;
  }

  get bufferView(): BufferView {
    return this.__bufferView;
  }

  get min() {
    const componentN = this.compositionType.getNumberOfComponents();
    if (componentN === 4) {
      return [
        this.__min.v[0],
        this.__min.v[1],
        this.__min.v[2],
        this.__min.v[3],
      ];
    } else if (componentN === 3) {
      return [this.__min.v[0], this.__min.v[1], this.__min.v[2]];
    } else if (componentN === 2) {
      return [this.__min.v[0], this.__min.v[1]];
    } else {
      return [this.__min.v[0]];
    }
  }

  get max() {
    const componentN = this.compositionType.getNumberOfComponents();
    if (componentN === 4) {
      return [
        this.__max.v[0],
        this.__max.v[1],
        this.__max.v[2],
        this.__max.v[3],
      ];
    } else if (componentN === 3) {
      return [this.__max.v[0], this.__max.v[1], this.__max.v[2]];
    } else if (componentN === 2) {
      return [this.__max.v[0], this.__max.v[1]];
    } else {
      return [this.__max.v[0]];
    }
  }

  get normalized() {
    return this.__normalized;
  }

  calcMinMax() {
    const componentN = this.compositionType.getNumberOfComponents();
    if (componentN === 4) {
      this.__max.setComponents(
        -Number.MAX_VALUE,
        -Number.MAX_VALUE,
        -Number.MAX_VALUE,
        -Number.MAX_VALUE
      );
      this.__min.setComponents(
        Number.MAX_VALUE,
        Number.MAX_VALUE,
        Number.MAX_VALUE,
        Number.MAX_VALUE
      );

      const vec4 = Accessor.__tmpVector4_0;
      for (let i = 0; i < this.elementCount; i++) {
        this.getVec4To(i, vec4, {});
        for (let j = 0; j < 4; j++) {
          if (this.__max.v[j] < vec4.v[j]) {
            this.__max.v[j] = vec4.v[j];
          }
          if (vec4.v[j] < this.__min.v[j]) {
            this.__min.v[j] = vec4.v[j];
          }
        }
      }
    } else if (componentN === 3) {
      this.__max.setComponents(
        -Number.MAX_VALUE,
        -Number.MAX_VALUE,
        -Number.MAX_VALUE,
        -Number.MAX_VALUE
      );
      this.__min.setComponents(
        Number.MAX_VALUE,
        Number.MAX_VALUE,
        Number.MAX_VALUE,
        Number.MAX_VALUE
      );

      const vec3 = Accessor.__tmpVector3_0;
      for (let i = 0; i < this.elementCount; i++) {
        this.getVec3To(i, vec3, {});
        for (let j = 0; j < 3; j++) {
          if (this.__max.v[j] < vec3.v[j]) {
            this.__max.v[j] = vec3.v[j];
          }
          if (vec3.v[j] < this.__min.v[j]) {
            this.__min.v[j] = vec3.v[j];
          }
        }
      }
    } else if (componentN === 2) {
      this.__max.setComponents(
        -Number.MAX_VALUE,
        -Number.MAX_VALUE,
        -Number.MAX_VALUE,
        -Number.MAX_VALUE
      );
      this.__min.setComponents(
        Number.MAX_VALUE,
        Number.MAX_VALUE,
        Number.MAX_VALUE,
        Number.MAX_VALUE
      );

      const vec2 = Accessor.__tmpVector2_0;
      for (let i = 0; i < this.elementCount; i++) {
        this.getVec2To(i, vec2, {});
        for (let j = 0; j < 2; j++) {
          if (this.__max.v[j] < vec2.v[j]) {
            this.__max.v[j] = vec2.v[j];
          }
          if (vec2.v[j] < this.__min.v[j]) {
            this.__min.v[j] = vec2.v[j];
          }
        }
      }
    } else if (componentN === 1) {
      this.__max.setComponents(
        -Number.MAX_VALUE,
        -Number.MAX_VALUE,
        -Number.MAX_VALUE,
        -Number.MAX_VALUE
      );
      this.__min.setComponents(
        Number.MAX_VALUE,
        Number.MAX_VALUE,
        Number.MAX_VALUE,
        Number.MAX_VALUE
      );

      for (let i = 0; i < this.elementCount; i++) {
        const scalar = this.getScalar(i, {});
        if (this.__max.v[0] < scalar) {
          this.__max.v[0] = scalar;
        }
        if (scalar < this.__min.v[0]) {
          this.__min.v[0] = scalar;
        }
      }
    }
    this.__isMinMixDirty = false;
  }

  get isMinMaxDirty() {
    return this.__isMinMixDirty;
  }
}
