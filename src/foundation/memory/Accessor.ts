import type {
  Array2,
  Array3,
  Array4,
  Byte,
  Count,
  Index,
  Size,
  TypedArray,
  TypedArrayConstructor,
} from '../../types/CommonTypes';
import { ComponentType, type ComponentTypeEnum } from '../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../definitions/CompositionType';
import type { Primitive } from '../geometry/Primitive';
import { Matrix33 } from '../math/Matrix33';
import type { Matrix44 } from '../math/Matrix44';
import type { MutableMatrix33 } from '../math/MutableMatrix33';
import { MutableMatrix44 } from '../math/MutableMatrix44';
import { MutableVector2 } from '../math/MutableVector2';
import { MutableVector3 } from '../math/MutableVector3';
import { MutableVector4 } from '../math/MutableVector4';
import { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';
import { Vector4 } from '../math/Vector4';
import { Is } from '../misc/Is';
import { Logger } from '../misc/Logger';
import type { BufferView } from './BufferView';

type DataViewGetter = (byteOffset: Byte, littleEndian?: boolean) => number;
type DataViewSetter = (byteOffset: Byte, value: number, littleEndian?: boolean) => void;

export type IndicesAccessOption = {
  indicesAccessor?: Accessor;
  endian?: boolean;
};

/**
 * Accessor class provides a high-level interface for reading and writing data from/to a BufferView.
 * It handles different data types (scalar, vector, matrix) and provides type-safe access to buffer data.
 * This class is commonly used in 3D graphics applications for managing vertex attributes, indices, and other buffer data.
 */
export class Accessor {
  private __bufferView: BufferView;
  private __byteOffsetInRawArrayBufferOfBuffer: Byte;
  private __compositionType: CompositionTypeEnum = CompositionType.Unknown;
  private __componentType: ComponentTypeEnum = ComponentType.Unknown;
  private __count: Count = 0;
  private __raw: ArrayBuffer;
  private __dataView?: DataView;
  private __typedArray: TypedArray = new Float32Array(); // init with a dummy Float32Array at first
  private __takenCount: Count = 0;
  private __byteStride: Byte = 0; // Accessor has the byteStride. BufferView doesn't. For supporting glTF1, not only glTF2
  private __typedArrayClass?: TypedArrayConstructor;
  private __dataViewGetter: DataViewGetter;
  private __dataViewSetter: DataViewSetter;
  private __max: MutableVector4 = MutableVector4.fromCopyArray([
    -Number.MAX_VALUE,
    -Number.MAX_VALUE,
    -Number.MAX_VALUE,
    -Number.MAX_VALUE,
  ]);
  private __min: MutableVector4 = MutableVector4.fromCopyArray([
    Number.MAX_VALUE,
    Number.MAX_VALUE,
    Number.MAX_VALUE,
    Number.MAX_VALUE,
  ]);
  private __arrayLength = 1;
  private __normalized = false;
  private __isMinMixDirty = true;

  private static __tmpVector4_0 = MutableVector4.zero();
  private static __tmpVector3_0 = MutableVector3.zero();
  private static __tmpVector2_0 = MutableVector2.zero();
  private __version = 0;

  public _primitive?: WeakRef<Primitive>;

  /**
   * Creates a new Accessor instance.
   * @param params - Configuration object for the accessor
   * @param params.bufferView - The BufferView that contains the data
   * @param params.byteOffsetInBufferView - Byte offset within the buffer view
   * @param params.compositionType - Type of data composition (scalar, vec2, vec3, vec4, mat3, mat4)
   * @param params.componentType - Component data type (byte, short, int, float, etc.)
   * @param params.byteStride - Byte stride between elements (0 for tightly packed)
   * @param params.count - Number of elements
   * @param params.raw - Raw ArrayBuffer containing the data
   * @param params.max - Optional maximum values for each component
   * @param params.min - Optional minimum values for each component
   * @param params.arrayLength - Length of array for each element
   * @param params.normalized - Whether integer values should be normalized to [0,1] or [-1,1]
   */
  constructor({
    bufferView,
    byteOffsetInBufferView,
    compositionType,
    componentType,
    byteStride,
    count,
    raw,
    max,
    min,
    arrayLength,
    normalized,
  }: {
    bufferView: BufferView;
    byteOffsetInBufferView: Byte;
    compositionType: CompositionTypeEnum;
    componentType: ComponentTypeEnum;
    byteStride: Byte;
    count: Count;
    raw: ArrayBuffer;
    max?: number[];
    min?: number[];
    arrayLength: Size;
    normalized: boolean;
  }) {
    this.__bufferView = bufferView;
    this.__byteOffsetInRawArrayBufferOfBuffer = bufferView.byteOffsetInRawArrayBufferOfBuffer + byteOffsetInBufferView;
    this.__compositionType = compositionType;
    this.__componentType = componentType;
    this.__count = count;
    this.__arrayLength = arrayLength;

    if (Is.exist(max)) {
      this.__max.setComponents(
        max[0] ?? -Number.MAX_VALUE,
        max[1] ?? -Number.MAX_VALUE,
        max[2] ?? -Number.MAX_VALUE,
        max[3] ?? -Number.MAX_VALUE
      );
    }

    if (Is.exist(min)) {
      this.__min.setComponents(
        min[0] ?? Number.MAX_VALUE,
        min[1] ?? Number.MAX_VALUE,
        min[2] ?? Number.MAX_VALUE,
        min[3] ?? Number.MAX_VALUE
      );
    }

    if (Is.exist(max) && Is.exist(min)) {
      this.__isMinMixDirty = false;
    }

    this.__raw = raw;
    this.__normalized = normalized;

    this.__byteStride = byteStride;

    if (this.__byteStride === 0) {
      this.__byteStride =
        this.__compositionType.getNumberOfComponents() * this.__componentType.getSizeInBytes() * this.__arrayLength;
    }

    const typedArrayClass = this.getTypedArrayClass(this.__componentType);
    this.__typedArrayClass = typedArrayClass;

    /// Check
    const maxExceededSizeOnAoS =
      this.__byteStride - this.__compositionType.getNumberOfComponents() * this.__componentType.getSizeInBytes();
    const sizeFromAccessorBeginToArrayBufferEnd = this.__raw.byteLength - this.__byteOffsetInRawArrayBufferOfBuffer;
    const maxLimitSizeToAccess = this.byteStride * this.__count - maxExceededSizeOnAoS;
    if (sizeFromAccessorBeginToArrayBufferEnd < maxLimitSizeToAccess) {
      Logger.error(
        `Requesting a data size that exceeds the remaining capacity of the buffer: ${this.bufferView.buffer.name}.
        Exceeded Size: ${maxLimitSizeToAccess - sizeFromAccessorBeginToArrayBufferEnd}
        this.__raw.byteLength: ${this.__raw.byteLength}
        this.__byteOffsetInRawArrayBufferOfBuffer: ${this.byteOffsetInRawArrayBufferOfBuffer}
        this.byteStride: ${this.byteStride}
        this.__count: ${this.__count}
        this.__raw.byteLength - this.__byteOffsetInRawArrayBufferOfBuffer: ${
          this.__raw.byteLength - this.__byteOffsetInRawArrayBufferOfBuffer
        }
        this.byteStride * this.__count: ${this.byteStride * this.__count}
        maxExceededSizeOnAoS: ${maxExceededSizeOnAoS}
        `
      );
    }
    this.__dataView = new DataView(
      this.__raw,
      this.__byteOffsetInRawArrayBufferOfBuffer,
      Math.min(this.__byteStride * this.__count, this.__raw.byteLength - this.__byteOffsetInRawArrayBufferOfBuffer)
    );

    if (this.__byteOffsetInRawArrayBufferOfBuffer % typedArrayClass!.BYTES_PER_ELEMENT === 0) {
      this.__typedArray = new typedArrayClass!(
        this.__raw,
        this.__byteOffsetInRawArrayBufferOfBuffer,
        this.__compositionType.getNumberOfComponents() * this.__count
      );
    } else {
      Logger.warn(`This Accessor's byteOffsetInRawArrayBufferOfBuffer is not aligned with the typedArrayClass's BYTES_PER_ELEMENT. So we need to copy the buffer.
So the typedArray data got by getTypedArray() is copied data, not reference to the original buffer.
`);
      this.__copyBufferDataToTypedArray();
    }
    this.__dataViewGetter = (this.__dataView as any)[this.getDataViewGetter(this.__componentType)!].bind(
      this.__dataView
    );
    this.__dataViewSetter = (this.__dataView as any)[this.getDataViewSetter(this.__componentType)!].bind(
      this.__dataView
    );
  }

  /**
   * Copies buffer data to a typed array when byte alignment doesn't match.
   * This is necessary when the buffer offset is not aligned with the typed array's BYTES_PER_ELEMENT.
   * @private
   */
  private __copyBufferDataToTypedArray() {
    const typedArrayClass = this.getTypedArrayClass(this.__componentType);
    const copyBuffer = this.__raw.slice(
      this.__byteOffsetInRawArrayBufferOfBuffer,
      this.__byteOffsetInRawArrayBufferOfBuffer +
        this.__compositionType.getNumberOfComponents() * this.__count * typedArrayClass!.BYTES_PER_ELEMENT
    );
    this.__typedArray = new typedArrayClass!(copyBuffer);
  }

  /**
   * Called when the accessor data is updated. Increments version and notifies associated primitives.
   * @private
   */
  private __onUpdated() {
    this.__version++;
    if (this._primitive != null) {
      this._primitive.deref()?.onAccessorUpdated(this.__version);
    }
  }

  /**
   * Gets the appropriate TypedArray constructor for the given component type.
   * @param componentType - The component type to get the constructor for
   * @returns The TypedArray constructor class, or undefined if unknown
   */
  getTypedArrayClass(componentType: ComponentTypeEnum): TypedArrayConstructor | undefined {
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
        Logger.error('Unexpected ComponentType!');
        return void 0;
    }
  }

  /**
   * Gets the DataView getter method name for the given component type.
   * @param componentType - The component type to get the getter for
   * @returns The DataView getter method name, or undefined if unknown
   */
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
        Logger.error('Unexpected ComponentType!');
        return 'unknown';
    }
  }

  /**
   * Gets the DataView setter method name for the given component type.
   * @param componentType - The component type to get the setter for
   * @returns The DataView setter method name, or undefined if unknown
   */
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
        Logger.error('Unexpected ComponentType!');
    }
    return undefined;
  }

  /**
   * Takes one element from the accessor and returns a TypedArray view of it.
   * This method allocates a new view for the next available element.
   * @returns A TypedArray view of the taken element
   * @throws Error if trying to allocate more elements than available
   */
  takeOne(): TypedArray {
    const arrayBufferOfBufferView = this.__raw;
    // let stride = this.__compositionType.getNumberOfComponents() * this.__componentType.getSizeInBytes();
    // if (this.__bufferView.isAoS) {
    //   stride = this.__bufferView.byteStride;
    // }

    if (this.__takenCount >= this.__count) {
      Logger.error('You are trying to allocate more than you have secured.');
    }
    const subTypedArray = new this.__typedArrayClass!(
      arrayBufferOfBufferView,
      this.__byteOffsetInRawArrayBufferOfBuffer + this.__byteStride * this.__takenCount,
      this.__compositionType.getNumberOfComponents() * this.__arrayLength
    );

    // console.log(this.byteOffsetInRawArrayBufferOfBuffer, this.__byteStride, this.__takenCount, this.__arrayLength);

    (subTypedArray as any)._accessor = this;
    (subTypedArray as any)._idx_of_accessor = this.__takenCount;

    this.__takenCount += 1;

    return subTypedArray;
  }

  /**
   * Takes an existing element at the specified index and returns a TypedArray view of it.
   * This method creates a view for an element that has already been allocated.
   * @param idx - The index of the element to take
   * @returns A TypedArray view of the element at the specified index
   * @throws Error if the index exceeds the available element count
   * @private
   */
  _takeExistedOne(idx: number): TypedArray {
    const arrayBufferOfBufferView = this.__raw;

    if (idx >= this.__count) {
      Logger.error('You are trying to allocate more than you have secured.');
    }
    const subTypedArray = new this.__typedArrayClass!(
      arrayBufferOfBufferView,
      this.__byteOffsetInRawArrayBufferOfBuffer + this.__byteStride * idx,
      this.__compositionType.getNumberOfComponents() * this.__arrayLength
    );

    // console.log(this.byteOffsetInRawArrayBufferOfBuffer, this.__byteStride, this.__takenCount, this.__arrayLength);

    (subTypedArray as any)._accessor = this;
    (subTypedArray as any)._idx_of_accessor = idx;

    return subTypedArray;
  }

  /**
   * Gets the number of elements that have been taken from this accessor.
   * @returns The count of taken elements
   */
  get takenCount(): Count {
    return this.__takenCount;
  }

  /**
   * Gets the number of components per element (e.g., 3 for Vec3, 4 for Vec4).
   * @returns The number of components
   */
  get numberOfComponents() {
    return this.__compositionType.getNumberOfComponents();
  }

  /**
   * Gets the size in bytes of each component.
   * @returns The component size in bytes
   */
  get componentSizeInBytes() {
    return this.__componentType.getSizeInBytes();
  }

  /**
   * Gets the size in bytes of each element (numberOfComponents * componentSizeInBytes).
   * @returns The element size in bytes
   */
  get elementSizeInBytes() {
    return this.numberOfComponents * this.componentSizeInBytes;
  }

  /**
   * Gets the total number of elements in this accessor.
   * Each element may be a scalar, vec2, vec3, vec4, matrix, etc.
   * @returns The element count
   */
  get elementCount(): Count {
    return this.__count;
  }

  /**
   * Gets the total byte length of all data in this accessor.
   * @returns The byte length
   */
  get byteLength(): Byte {
    return this.__byteStride * this.__count;
  }

  /**
   * Gets the component type of this accessor.
   * @returns The component type enum
   */
  get componentType(): ComponentTypeEnum {
    return this.__componentType;
  }

  /**
   * Gets the composition type of this accessor.
   * @returns The composition type enum
   */
  get compositionType(): CompositionTypeEnum {
    return this.__compositionType;
  }

  /**
   * Gets the underlying TypedArray for this accessor.
   * Note: If the buffer view uses interleaved data (AoS), direct access may not work as expected.
   * @returns The TypedArray containing the data
   */
  getTypedArray(): TypedArray {
    // if (this.__bufferView.isAoS) {
    //   console.warn(
    //     'Be careful. this reference bufferView is AoS(Array on Structure), it means Interleaved Data. So you can not access your data properly by this TypedArray.'
    //   );
    // }
    return this.__typedArray;
  }

  /**
   * Sets the data from a TypedArray into this accessor.
   * If the provided array uses the same buffer, no copying is needed.
   * Otherwise, data is copied element by element with proper type conversion.
   * @param typedArray - The TypedArray to copy data from
   */
  setTypedArray(typedArray: TypedArray) {
    if (typedArray.buffer === this.__raw) {
    } else {
      if (this.__compositionType === CompositionType.Scalar) {
        for (let i = 0; i < this.__count; i++) {
          this.setScalar(i, typedArray[i], { endian: true });
        }
      } else if (this.__compositionType === CompositionType.Vec2) {
        for (let i = 0; i < this.__count; i++) {
          this.setVec2(i, typedArray[i * 2], typedArray[i * 2 + 1], { endian: true });
        }
      } else if (this.__compositionType === CompositionType.Vec3) {
        for (let i = 0; i < this.__count; i++) {
          this.setVec3(i, typedArray[i * 3], typedArray[i * 3 + 1], typedArray[i * 3 + 2], { endian: true });
        }
      } else if (this.__compositionType === CompositionType.Vec4) {
        for (let i = 0; i < this.__count; i++) {
          this.setVec4(i, typedArray[i * 4], typedArray[i * 4 + 1], typedArray[i * 4 + 2], typedArray[i * 4 + 3], {
            endian: true,
          });
        }
      } else if (this.__compositionType === CompositionType.Mat3) {
        for (let i = 0; i < this.__count; i++) {
          this.setMat3(
            i,
            typedArray[i * 9],
            typedArray[i * 9 + 1],
            typedArray[i * 9 + 2],
            typedArray[i * 9 + 3],
            typedArray[i * 9 + 4],
            typedArray[i * 9 + 5],
            typedArray[i * 9 + 6],
            typedArray[i * 9 + 7],
            typedArray[i * 9 + 8],
            { endian: true }
          );
        }
      } else if (this.__compositionType === CompositionType.Mat4) {
        for (let i = 0; i < this.__count; i++) {
          this.setMat4(
            i,
            typedArray[i * 16],
            typedArray[i * 16 + 1],
            typedArray[i * 16 + 2],
            typedArray[i * 16 + 3],
            typedArray[i * 16 + 4],
            typedArray[i * 16 + 5],
            typedArray[i * 16 + 6],
            typedArray[i * 16 + 7],
            typedArray[i * 16 + 8],
            typedArray[i * 16 + 9],
            typedArray[i * 16 + 10],
            typedArray[i * 16 + 11],
            typedArray[i * 16 + 12],
            typedArray[i * 16 + 13],
            typedArray[i * 16 + 14],
            typedArray[i * 16 + 15],
            { endian: true }
          );
        }
      } else {
        throw new Error('Unexpected CompositionType!');
      }
      this.__copyBufferDataToTypedArray();
    }
  }

  /**
   * Gets a Uint8Array view of this accessor's data.
   * Useful for raw byte-level access to the buffer data.
   * @returns A Uint8Array view of the accessor's data
   */
  getUint8Array(): Uint8Array {
    // if (this.__bufferView.isAoS) {
    //   console.warn(
    //     'Be careful. this reference bufferView is AoS(Array on Structure), it means Interleaved Data. So you can not access your data properly by this TypedArray.'
    //   );
    // }
    return new Uint8Array(
      this.bufferView.buffer.getArrayBuffer(),
      this.byteOffsetInRawArrayBufferOfBuffer,
      this.byteLength
    );
  }

  /**
   * Checks if this accessor uses Array of Structures (AoS) layout.
   * AoS means data is interleaved (e.g., XYZXYZXYZ for positions).
   * @returns True if using AoS layout
   */
  get isAoS() {
    return !this.isSoA;
  }

  /**
   * Checks if this accessor uses Structure of Arrays (SoA) layout.
   * SoA means data is tightly packed (e.g., XXXYYYZZZ for positions).
   * @returns True if using SoA layout
   */
  get isSoA() {
    const isSoA =
      this.byteStride === this.__compositionType.getNumberOfComponents() * this.__componentType.getSizeInBytes();
    return isSoA;
  }

  /**
   * Gets the byte stride between elements.
   * For tightly packed data, this equals elementSizeInBytes.
   * For interleaved data, this may be larger.
   * @returns The byte stride
   */
  get byteStride() {
    return this.__byteStride;
  }

  /**
   * Gets a scalar value at the specified index.
   * @param i - The element index
   * @param options - Access options including indices accessor and endianness
   * @returns The scalar value
   */
  getScalar(i: Index, { indicesAccessor, endian = true }: IndicesAccessOption): number {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    return this.__dataViewGetter(this.__byteStride * index, endian);
  }

  /**
   * Gets a scalar value at the specified index with a composition offset.
   * @param i - The element index
   * @param compositionOffset - Byte offset within the element
   * @param options - Access options including indices accessor and endianness
   * @returns The scalar value
   */
  getScalarAt(i: Index, compositionOffset: Index, { indicesAccessor, endian = true }: IndicesAccessOption): number {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    return this.__dataViewGetter(this.__byteStride * index + compositionOffset, endian);
  }

  /**
   * Gets a 2D vector as an array at the specified index.
   * @param i - The element index
   * @param options - Access options including indices accessor and endianness
   * @returns A 2-element array containing the vector components
   */
  getVec2AsArray(i: Index, { indicesAccessor, endian = true }: IndicesAccessOption): Array2<number> {
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

  /**
   * Gets a 3D vector as an array at the specified index.
   * @param i - The element index
   * @param options - Access options including indices accessor and endianness
   * @returns A 3-element array containing the vector components
   */
  getVec3AsArray(i: Index, { indicesAccessor, endian = true }: IndicesAccessOption): Array3<number> {
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

  /**
   * Gets a 4D vector as an array at the specified index.
   * @param i - The element index
   * @param options - Access options including indices accessor and endianness
   * @returns A 4-element array containing the vector components
   */
  getVec4AsArray(i: Index, { indicesAccessor, endian = true }: IndicesAccessOption): Array4<number> {
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

  /**
   * Gets a 3x3 matrix as an array at the specified index.
   * @param i - The element index
   * @param options - Access options including indices accessor and endianness
   * @returns A 9-element array containing the matrix components in row-major order
   */
  getMat3AsArray(i: Index, { indicesAccessor, endian = true }: IndicesAccessOption): Array<number> {
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

  /**
   * Gets a 4x4 matrix as an array at the specified index.
   * @param i - The element index
   * @param options - Access options including indices accessor and endianness
   * @returns A 16-element array containing the matrix components in row-major order
   */
  getMat4AsArray(i: Index, { indicesAccessor, endian = true }: IndicesAccessOption): Array<number> {
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

  /**
   * Gets a 2D vector object at the specified index.
   * @param i - The element index
   * @param options - Access options including indices accessor and endianness
   * @returns A Vector2 object containing the vector components
   */
  getVec2(i: Index, { indicesAccessor, endian = true }: IndicesAccessOption): Vector2 {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return Vector2.fromCopyArray2([
      this.__dataViewGetter(this.__byteStride * index, endian),
      this.__dataViewGetter(this.__byteStride * index + 1 * byteSize, endian),
    ]);
  }

  /**
   * Gets a 3D vector object at the specified index.
   * @param i - The element index
   * @param options - Access options including indices accessor and endianness
   * @returns A Vector3 object containing the vector components
   */
  getVec3(i: Index, { indicesAccessor, endian = true }: IndicesAccessOption): Vector3 {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return Vector3.fromCopyArray([
      this.__dataViewGetter(this.__byteStride * index, endian),
      this.__dataViewGetter(this.__byteStride * index + 1 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 2 * byteSize, endian),
    ]);
  }

  /**
   * Gets a 4D vector object at the specified index.
   * @param i - The element index
   * @param options - Access options including indices accessor and endianness
   * @returns A Vector4 object containing the vector components
   */
  getVec4(i: Index, { indicesAccessor, endian = true }: IndicesAccessOption): Vector4 {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return Vector4.fromCopyArray([
      this.__dataViewGetter(this.__byteStride * index, endian),
      this.__dataViewGetter(this.__byteStride * index + 1 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 2 * byteSize, endian),
      this.__dataViewGetter(this.__byteStride * index + 3 * byteSize, endian),
    ]);
  }

  /**
   * Gets a 3x3 matrix object at the specified index.
   * @param i - The element index
   * @param options - Access options including indices accessor and endianness
   * @returns A Matrix33 object containing the matrix components
   */
  getMat3(i: Index, { indicesAccessor, endian = true }: IndicesAccessOption): Matrix33 {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return Matrix33.fromCopy9RowMajor(
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

  /**
   * Gets a 4x4 matrix object at the specified index.
   * @param i - The element index
   * @param options - Access options including indices accessor and endianness
   * @returns A MutableMatrix44 object containing the matrix components
   */
  getMat4(i: Index, { indicesAccessor, endian = true }: IndicesAccessOption): MutableMatrix44 {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return MutableMatrix44.fromCopy16RowMajor(
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

  /**
   * Gets a 2D vector at the specified index and stores it in the provided output object.
   * This method avoids creating new objects and is more memory-efficient.
   * @param i - The element index
   * @param out - The output MutableVector2 object to store the result
   * @param options - Access options including indices accessor and endianness
   * @returns The output Vector2 object (same as the out parameter)
   */
  getVec2To(i: Index, out: MutableVector2, { indicesAccessor, endian = true }: IndicesAccessOption): Vector2 {
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

  /**
   * Gets a 3D vector at the specified index and stores it in the provided output object.
   * This method avoids creating new objects and is more memory-efficient.
   * @param i - The element index
   * @param out - The output MutableVector3 object to store the result
   * @param options - Access options including indices accessor and endianness
   * @returns The output Vector3 object (same as the out parameter)
   */
  getVec3To(i: Index, out: MutableVector3, { indicesAccessor, endian = true }: IndicesAccessOption): Vector3 {
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

  /**
   * Gets a 4D vector at the specified index and stores it in the provided output object.
   * This method avoids creating new objects and is more memory-efficient.
   * @param i - The element index
   * @param out - The output MutableVector4 object to store the result
   * @param options - Access options including indices accessor and endianness
   * @returns The output Vector4 object (same as the out parameter)
   */
  getVec4To(i: Index, out: MutableVector4, { indicesAccessor, endian = true }: IndicesAccessOption): Vector4 {
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

  /**
   * Gets a 3x3 matrix at the specified index and stores it in the provided output object.
   * This method avoids creating new objects and is more memory-efficient.
   * @param i - The element index
   * @param out - The output MutableMatrix33 object to store the result
   * @param options - Access options including indices accessor and endianness
   * @returns The output Matrix33 object (same as the out parameter)
   */
  getMat3To(
    i: Index,
    out: MutableMatrix33,
    { indicesAccessor, endian = true }: { indicesAccessor?: Accessor | undefined; endian?: boolean }
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

  /**
   * Gets a 4x4 matrix at the specified index and stores it in the provided output object.
   * This method avoids creating new objects and is more memory-efficient.
   * @param i - The element index
   * @param out - The output MutableMatrix44 object to store the result
   * @param options - Access options including indices accessor and endianness
   * @returns The output MutableMatrix44 object (same as the out parameter)
   */
  getMat4To(i: Index, out: MutableMatrix44, { indicesAccessor, endian = true }: IndicesAccessOption): MutableMatrix44 {
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

  /**
   * Sets a scalar value at the specified index.
   * @param i - The element index
   * @param value - The scalar value to set
   * @param options - Access options including indices accessor and endianness
   */
  setScalar(i: Index, value: number, { indicesAccessor, endian = true }: IndicesAccessOption) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    this.__dataViewSetter(this.__byteStride * index, value, endian);
    this.__isMinMixDirty = true;
    this.__onUpdated();
  }

  /**
   * Sets a 2D vector at the specified index.
   * @param i - The element index
   * @param x - The X component value
   * @param y - The Y component value
   * @param options - Access options including indices accessor and endianness
   */
  setVec2(i: Index, x: number, y: number, { indicesAccessor, endian = true }: IndicesAccessOption) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride * index, x, endian);
    this.__dataViewSetter(this.__byteStride * index + 1 * sizeInBytes, y, endian);
    this.__isMinMixDirty = true;
    this.__onUpdated();
  }

  /**
   * Sets a 3D vector at the specified index.
   * @param i - The element index
   * @param x - The X component value
   * @param y - The Y component value
   * @param z - The Z component value
   * @param options - Access options including indices accessor and endianness
   */
  setVec3(i: Index, x: number, y: number, z: number, { indicesAccessor, endian = true }: IndicesAccessOption) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride * index, x, endian);
    this.__dataViewSetter(this.__byteStride * index + 1 * sizeInBytes, y, endian);
    this.__dataViewSetter(this.__byteStride * index + 2 * sizeInBytes, z, endian);
    this.__isMinMixDirty = true;
    this.__onUpdated();
  }

  /**
   * Sets a 4D vector at the specified index.
   * @param i - The element index
   * @param x - The X component value
   * @param y - The Y component value
   * @param z - The Z component value
   * @param w - The W component value
   * @param options - Access options including indices accessor and endianness
   */
  setVec4(
    i: Index,
    x: number,
    y: number,
    z: number,
    w: number,
    { indicesAccessor, endian = true }: IndicesAccessOption
  ) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride * index, x, endian);
    this.__dataViewSetter(this.__byteStride * index + 1 * sizeInBytes, y, endian);
    this.__dataViewSetter(this.__byteStride * index + 2 * sizeInBytes, z, endian);
    this.__dataViewSetter(this.__byteStride * index + 3 * sizeInBytes, w, endian);
    this.__isMinMixDirty = true;
    this.__onUpdated();
  }

  /**
   * Sets a 3x3 matrix at the specified index.
   * @param i - The element index
   * @param v0 - Matrix component at position [0,0]
   * @param v1 - Matrix component at position [0,1]
   * @param v2 - Matrix component at position [0,2]
   * @param v3 - Matrix component at position [1,0]
   * @param v4 - Matrix component at position [1,1]
   * @param v5 - Matrix component at position [1,2]
   * @param v6 - Matrix component at position [2,0]
   * @param v7 - Matrix component at position [2,1]
   * @param v8 - Matrix component at position [2,2]
   * @param options - Access options including indices accessor and endianness
   */
  setMat3(
    i: Index,
    v0: number,
    v1: number,
    v2: number,
    v3: number,
    v4: number,
    v5: number,
    v6: number,
    v7: number,
    v8: number,
    { indicesAccessor, endian = true }: IndicesAccessOption
  ) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride * index, v0, endian);
    this.__dataViewSetter(this.__byteStride * index + 1 * sizeInBytes, v1, endian);
    this.__dataViewSetter(this.__byteStride * index + 2 * sizeInBytes, v2, endian);
    this.__dataViewSetter(this.__byteStride * index + 3 * sizeInBytes, v3, endian);
    this.__dataViewSetter(this.__byteStride * index + 4 * sizeInBytes, v4, endian);
    this.__dataViewSetter(this.__byteStride * index + 5 * sizeInBytes, v5, endian);
    this.__dataViewSetter(this.__byteStride * index + 6 * sizeInBytes, v6, endian);
    this.__dataViewSetter(this.__byteStride * index + 7 * sizeInBytes, v7, endian);
    this.__dataViewSetter(this.__byteStride * index + 8 * sizeInBytes, v8, endian);
    this.__isMinMixDirty = true;
    this.__onUpdated();
  }

  /**
   * Sets a 4x4 matrix at the specified index.
   * @param i - The element index
   * @param v0 - Matrix component at position [0,0]
   * @param v1 - Matrix component at position [0,1]
   * @param v2 - Matrix component at position [0,2]
   * @param v3 - Matrix component at position [0,3]
   * @param v4 - Matrix component at position [1,0]
   * @param v5 - Matrix component at position [1,1]
   * @param v6 - Matrix component at position [1,2]
   * @param v7 - Matrix component at position [1,3]
   * @param v8 - Matrix component at position [2,0]
   * @param v9 - Matrix component at position [2,1]
   * @param v10 - Matrix component at position [2,2]
   * @param v11 - Matrix component at position [2,3]
   * @param v12 - Matrix component at position [3,0]
   * @param v13 - Matrix component at position [3,1]
   * @param v14 - Matrix component at position [3,2]
   * @param v15 - Matrix component at position [3,3]
   * @param options - Access options including indices accessor and endianness
   */
  setMat4(
    i: Index,
    v0: number,
    v1: number,
    v2: number,
    v3: number,
    v4: number,
    v5: number,
    v6: number,
    v7: number,
    v8: number,
    v9: number,
    v10: number,
    v11: number,
    v12: number,
    v13: number,
    v14: number,
    v15: number,
    { indicesAccessor, endian = true }: IndicesAccessOption
  ) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride * index, v0, endian);
    this.__dataViewSetter(this.__byteStride * index + 1 * sizeInBytes, v1, endian);
    this.__dataViewSetter(this.__byteStride * index + 2 * sizeInBytes, v2, endian);
    this.__dataViewSetter(this.__byteStride * index + 3 * sizeInBytes, v3, endian);
    this.__dataViewSetter(this.__byteStride * index + 4 * sizeInBytes, v4, endian);
    this.__dataViewSetter(this.__byteStride * index + 5 * sizeInBytes, v5, endian);
    this.__dataViewSetter(this.__byteStride * index + 6 * sizeInBytes, v6, endian);
    this.__dataViewSetter(this.__byteStride * index + 7 * sizeInBytes, v7, endian);
    this.__dataViewSetter(this.__byteStride * index + 8 * sizeInBytes, v8, endian);
    this.__dataViewSetter(this.__byteStride * index + 9 * sizeInBytes, v9, endian);
    this.__dataViewSetter(this.__byteStride * index + 10 * sizeInBytes, v10, endian);
    this.__dataViewSetter(this.__byteStride * index + 11 * sizeInBytes, v11, endian);
    this.__dataViewSetter(this.__byteStride * index + 12 * sizeInBytes, v12, endian);
    this.__dataViewSetter(this.__byteStride * index + 13 * sizeInBytes, v13, endian);
    this.__dataViewSetter(this.__byteStride * index + 14 * sizeInBytes, v14, endian);
    this.__dataViewSetter(this.__byteStride * index + 15 * sizeInBytes, v15, endian);
    this.__isMinMixDirty = true;
    this.__onUpdated();
  }

  /**
   * Sets a 2D vector at the specified index using a Vector2 object.
   * @param i - The element index
   * @param vec - The Vector2 object containing the values to set
   * @param options - Access options including indices accessor and endianness
   */
  setVec2AsVector(i: Index, vec: Vector2, { indicesAccessor, endian = true }: IndicesAccessOption) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride * index, vec.x, endian);
    this.__dataViewSetter(this.__byteStride * index + 1 * sizeInBytes, vec.y, endian);
    this.__isMinMixDirty = true;
    this.__onUpdated();
  }

  /**
   * Sets a 3D vector at the specified index using a Vector3 object.
   * @param i - The element index
   * @param vec - The Vector3 object containing the values to set
   * @param options - Access options including indices accessor and endianness
   */
  setVec3AsVector(i: Index, vec: Vector3, { indicesAccessor, endian = true }: IndicesAccessOption) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride * index, vec.x, endian);
    this.__dataViewSetter(this.__byteStride * index + 1 * sizeInBytes, vec.y, endian);
    this.__dataViewSetter(this.__byteStride * index + 2 * sizeInBytes, vec.z, endian);
    this.__isMinMixDirty = true;
    this.__onUpdated();
  }

  /**
   * Sets a 4D vector at the specified index using a Vector4 object.
   * @param i - The element index
   * @param vec - The Vector4 object containing the values to set
   * @param options - Access options including indices accessor and endianness
   */
  setVec4AsVector(i: Index, vec: Vector4, { indicesAccessor, endian = true }: IndicesAccessOption) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride * index, vec.x, endian);
    this.__dataViewSetter(this.__byteStride * index + 1 * sizeInBytes, vec.y, endian);
    this.__dataViewSetter(this.__byteStride * index + 2 * sizeInBytes, vec.z, endian);
    this.__dataViewSetter(this.__byteStride * index + 3 * sizeInBytes, vec.w, endian);
    this.__isMinMixDirty = true;
    this.__onUpdated();
  }

  /**
   * Sets a 4x4 matrix at the specified index using a Matrix44 object.
   * @param i - The element index
   * @param mat - The Matrix44 object containing the values to set
   * @param options - Access options including indices accessor and endianness
   */
  setMat4AsMatrix44(i: Index, mat: Matrix44, { indicesAccessor, endian = true }: IndicesAccessOption) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.__dataViewSetter(this.__byteStride * index, mat._v[0], endian);
    this.__dataViewSetter(this.__byteStride * index + 1 * sizeInBytes, mat._v[1], endian);
    this.__dataViewSetter(this.__byteStride * index + 2 * sizeInBytes, mat._v[2], endian);
    this.__dataViewSetter(this.__byteStride * index + 3 * sizeInBytes, mat._v[3], endian);
    this.__dataViewSetter(this.__byteStride * index + 4 * sizeInBytes, mat._v[4], endian);
    this.__dataViewSetter(this.__byteStride * index + 5 * sizeInBytes, mat._v[5], endian);
    this.__dataViewSetter(this.__byteStride * index + 6 * sizeInBytes, mat._v[6], endian);
    this.__dataViewSetter(this.__byteStride * index + 7 * sizeInBytes, mat._v[7], endian);
    this.__dataViewSetter(this.__byteStride * index + 8 * sizeInBytes, mat._v[8], endian);
    this.__dataViewSetter(this.__byteStride * index + 9 * sizeInBytes, mat._v[9], endian);
    this.__dataViewSetter(this.__byteStride * index + 10 * sizeInBytes, mat._v[10], endian);
    this.__dataViewSetter(this.__byteStride * index + 11 * sizeInBytes, mat._v[11], endian);
    this.__dataViewSetter(this.__byteStride * index + 12 * sizeInBytes, mat._v[12], endian);
    this.__dataViewSetter(this.__byteStride * index + 13 * sizeInBytes, mat._v[13], endian);
    this.__dataViewSetter(this.__byteStride * index + 14 * sizeInBytes, mat._v[14], endian);
    this.__dataViewSetter(this.__byteStride * index + 15 * sizeInBytes, mat._v[15], endian);
    this.__isMinMixDirty = true;
    this.__onUpdated();
  }

  /**
   * Copies data from a TypedArray into this accessor.
   * The data is copied element by element with proper type conversion.
   * @param typedArray - The TypedArray to copy data from
   */
  copyFromTypedArray(typedArray: TypedArray) {
    const componentN = this.numberOfComponents;
    for (let j = 0; j < typedArray.byteLength / this.componentSizeInBytes; j++) {
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
          this.setVec3(idx, typedArray[idxN + 0], typedArray[idxN + 1], typedArray[idxN + 2], {});
          break;
        case 4:
          this.setVec4(idx, typedArray[idxN + 0], typedArray[idxN + 1], typedArray[idxN + 2], typedArray[idxN + 3], {});
          break;
        default:
          throw new Error('Other than vectors are currently not supported.');
      }
    }
    this.__isMinMixDirty = true;
    this.__onUpdated();
  }

  /**
   * Sets a scalar value at the specified index with a composition offset.
   * @param i - The element index
   * @param compositionOffset - Byte offset within the element
   * @param value - The scalar value to set
   * @param options - Access options including indices accessor and endianness
   */
  setScalarAt(
    i: Index,
    compositionOffset: Index,
    value: number,
    { indicesAccessor, endian = true }: IndicesAccessOption
  ) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    this.__dataViewSetter(this.__byteStride * index + compositionOffset, value, endian);
    this.__isMinMixDirty = true;
    this.__onUpdated();
  }

  /**
   * Sets an element from another accessor with the same composition type.
   * @param i - The target element index
   * @param accessor - The source accessor to copy from
   * @param secondIdx - Optional source index (defaults to i)
   */
  setElementFromSameCompositionAccessor(i: Index, accessor: Accessor, secondIdx?: Index) {
    const j = secondIdx ?? i;
    if (this.compositionType.getNumberOfComponents() === 1) {
      this.setScalar(i, accessor.getScalar(j, {}), {});
    } else if (this.compositionType.getNumberOfComponents() === 2) {
      this.setVec2AsVector(i, accessor.getVec2(j, {}), {});
    } else if (this.compositionType.getNumberOfComponents() === 3) {
      this.setVec3AsVector(i, accessor.getVec3(j, {}), {});
    } else if (this.compositionType.getNumberOfComponents() === 4) {
      this.setVec4AsVector(i, accessor.getVec4(j, {}), {});
    }
    this.__isMinMixDirty = true;
    this.__onUpdated();
  }

  /**
   * Copies the entire buffer from another accessor.
   * @param accessor - The source accessor to copy the buffer from
   */
  copyBuffer(accessor: Accessor) {
    new Uint8Array(this.__raw).set(
      new Uint8Array(accessor.__raw, accessor.__byteOffsetInRawArrayBufferOfBuffer, accessor.byteLength),
      this.__byteOffsetInRawArrayBufferOfBuffer
    );
    this.__isMinMixDirty = true;
    this.__onUpdated();
  }

  /**
   * Sets an element from another accessor, handling different composition types.
   * Automatically converts between different vector/scalar types as needed.
   * @param i - The target element index
   * @param accessor - The source accessor to copy from
   * @param secondIdx - Optional source index (defaults to i)
   */
  setElementFromAccessor(i: Index, accessor: Accessor, secondIdx?: Index) {
    const j = secondIdx ?? i;
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
    this.__isMinMixDirty = true;
    this.__onUpdated();
  }

  /**
   * Adds an element from another accessor with the same composition type, scaled by a coefficient.
   * @param i - The target element index
   * @param accessor - The source accessor to add from
   * @param coeff - The coefficient to multiply the source values by
   * @param secondIdx - Optional source index (defaults to i)
   */
  addElementFromSameCompositionAccessor(i: Index, accessor: Accessor, coeff: number, secondIdx?: Index) {
    const j = secondIdx ?? i;
    if (this.compositionType.getNumberOfComponents() === 1) {
      this.setScalar(i, this.getScalar(i, {}) + coeff * accessor.getScalar(j, {}), {});
    } else if (this.compositionType.getNumberOfComponents() === 2) {
      this.setVec2AsVector(i, Vector2.add(this.getVec2(i, {}), Vector2.multiply(accessor.getVec2(j, {}), coeff)), {});
    } else if (this.compositionType.getNumberOfComponents() === 3) {
      this.setVec3AsVector(i, Vector3.add(this.getVec3(i, {}), Vector3.multiply(accessor.getVec3(j, {}), coeff)), {});
    } else if (this.compositionType.getNumberOfComponents() === 4) {
      this.setVec4AsVector(i, Vector4.add(this.getVec4(i, {}), Vector4.multiply(accessor.getVec4(j, {}), coeff)), {});
    }
    this.__isMinMixDirty = true;
    this.__onUpdated();
  }

  /**
   * Gets the underlying ArrayBuffer of the buffer view.
   * @returns The ArrayBuffer containing the data
   */
  get arrayBufferOfBufferView(): ArrayBuffer {
    return this.__raw;
  }

  /**
   * Gets the DataView of the buffer view.
   * @returns The DataView for accessing the buffer data
   */
  get dataViewOfBufferView(): DataView {
    return this.__dataView!;
  }

  /**
   * Gets the byte offset within the buffer view.
   * @returns The byte offset in the buffer view
   */
  get byteOffsetInBufferView(): Byte {
    return this.__byteOffsetInRawArrayBufferOfBuffer - this.__bufferView.byteOffsetInRawArrayBufferOfBuffer;
  }

  /**
   * Gets the byte offset within the buffer.
   * @returns The byte offset in the buffer
   */
  get byteOffsetInBuffer(): Byte {
    return this.__byteOffsetInRawArrayBufferOfBuffer - this.__bufferView.buffer.byteOffsetInRawArrayBuffer;
  }

  /**
   * Gets the byte offset in the raw ArrayBuffer of the buffer.
   * @returns The byte offset in the raw ArrayBuffer
   */
  get byteOffsetInRawArrayBufferOfBuffer() {
    return this.__byteOffsetInRawArrayBufferOfBuffer;
  }

  /**
   * Gets the BufferView that contains this accessor's data.
   * @returns The BufferView object
   */
  get bufferView(): BufferView {
    return this.__bufferView;
  }

  /**
   * Sets the minimum and maximum values for this accessor.
   * @param min - Array of minimum values for each component
   * @param max - Array of maximum values for each component
   */
  setMinMax(min: number[], max: number[]) {
    const componentN = this.compositionType.getNumberOfComponents();
    if (componentN === 1) {
      this.__min._v[0] = min[0];
      this.__max._v[0] = max[0];
    } else if (componentN === 2) {
      this.__min._v[0] = min[0];
      this.__min._v[1] = min[1];
      this.__max._v[0] = max[0];
      this.__max._v[1] = max[1];
    } else if (componentN === 3) {
      this.__min._v[0] = min[0];
      this.__min._v[1] = min[1];
      this.__min._v[2] = min[2];
      this.__max._v[0] = max[0];
      this.__max._v[1] = max[1];
      this.__max._v[2] = max[2];
    } else if (componentN === 4) {
      this.__min._v[0] = min[0];
      this.__min._v[1] = min[1];
      this.__min._v[2] = min[2];
      this.__min._v[3] = min[3];
      this.__max._v[0] = max[0];
      this.__max._v[1] = max[1];
      this.__max._v[2] = max[2];
      this.__max._v[3] = max[3];
    }
    this.__isMinMixDirty = false;
  }

  /**
   * Gets the minimum values for each component.
   * Calculates min/max if dirty.
   * @returns Array of minimum values
   */
  get min(): number[] {
    if (this.__isMinMixDirty) {
      this.__calcMinMax();
    }

    const componentN = this.compositionType.getNumberOfComponents();
    if (componentN === 4) {
      return [this.__min._v[0], this.__min._v[1], this.__min._v[2], this.__min._v[3]];
    }
    if (componentN === 3) {
      return [this.__min._v[0], this.__min._v[1], this.__min._v[2]];
    }
    if (componentN === 2) {
      return [this.__min._v[0], this.__min._v[1]];
    }
    return [this.__min._v[0]];
  }

  /**
   * Gets the maximum values for each component.
   * Calculates min/max if dirty.
   * @returns Array of maximum values
   */
  get max(): number[] {
    if (this.__isMinMixDirty) {
      this.__calcMinMax();
    }
    const componentN = this.compositionType.getNumberOfComponents();
    if (componentN === 4) {
      return [this.__max._v[0], this.__max._v[1], this.__max._v[2], this.__max._v[3]];
    }
    if (componentN === 3) {
      return [this.__max._v[0], this.__max._v[1], this.__max._v[2]];
    }
    if (componentN === 2) {
      return [this.__max._v[0], this.__max._v[1]];
    }
    return [this.__max._v[0]];
  }

  /**
   * Gets whether the data should be normalized.
   * @returns True if data should be normalized
   */
  get normalized() {
    return this.__normalized;
  }

  /**
   * Calculates the minimum and maximum values for all elements.
   * @private
   */
  private __calcMinMax() {
    const componentN = this.compositionType.getNumberOfComponents();
    if (componentN === 4) {
      this.__max.setComponents(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
      this.__min.setComponents(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);

      const vec4 = Accessor.__tmpVector4_0;
      for (let i = 0; i < this.elementCount; i++) {
        this.getVec4To(i, vec4, {});
        for (let j = 0; j < 4; j++) {
          if (this.__max._v[j] < vec4._v[j]) {
            this.__max._v[j] = vec4._v[j];
          }
          if (vec4._v[j] < this.__min._v[j]) {
            this.__min._v[j] = vec4._v[j];
          }
        }
      }
    } else if (componentN === 3) {
      this.__max.setComponents(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
      this.__min.setComponents(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);

      const vec3 = Accessor.__tmpVector3_0;
      for (let i = 0; i < this.elementCount; i++) {
        this.getVec3To(i, vec3, {});
        for (let j = 0; j < 3; j++) {
          if (this.__max._v[j] < vec3._v[j]) {
            this.__max._v[j] = vec3._v[j];
          }
          if (vec3._v[j] < this.__min._v[j]) {
            this.__min._v[j] = vec3._v[j];
          }
        }
      }
    } else if (componentN === 2) {
      this.__max.setComponents(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
      this.__min.setComponents(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);

      const vec2 = Accessor.__tmpVector2_0;
      for (let i = 0; i < this.elementCount; i++) {
        this.getVec2To(i, vec2, {});
        for (let j = 0; j < 2; j++) {
          if (this.__max._v[j] < vec2._v[j]) {
            this.__max._v[j] = vec2._v[j];
          }
          if (vec2._v[j] < this.__min._v[j]) {
            this.__min._v[j] = vec2._v[j];
          }
        }
      }
    } else if (componentN === 1) {
      this.__max.setComponents(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
      this.__min.setComponents(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);

      for (let i = 0; i < this.elementCount; i++) {
        const scalar = this.getScalar(i, {});
        if (this.__max._v[0] < scalar) {
          this.__max._v[0] = scalar;
        }
        if (scalar < this.__min._v[0]) {
          this.__min._v[0] = scalar;
        }
      }
    }
    this.__isMinMixDirty = false;
  }

  /**
   * Gets whether the min/max values are dirty and need recalculation.
   * @returns True if min/max values are dirty
   */
  get isMinMaxDirty() {
    return this.__isMinMixDirty;
  }

  /**
   * Gets the version number of this accessor.
   * Increments when data is modified.
   * @returns The version number
   */
  get version() {
    return this.__version;
  }

  /**
   * Gets the actual byte stride, accounting for zero stride.
   * @returns The actual byte stride
   */
  get actualByteStride() {
    if (this.__byteStride === 0) {
      const actualByteStride =
        this.__compositionType.getNumberOfComponents() * this.__componentType.getSizeInBytes() * this.__arrayLength;
      return actualByteStride;
    }
    return this.__byteStride;
  }

  /**
   * Checks if this accessor is the same as another accessor.
   * Compares byte length, offset, and underlying buffer.
   * @param rnAccessor - The accessor to compare with
   * @returns True if the accessors are the same
   */
  isSame(rnAccessor: Accessor): boolean {
    return (
      this.byteLength === rnAccessor.byteLength &&
      this.byteOffsetInRawArrayBufferOfBuffer === rnAccessor.byteOffsetInRawArrayBufferOfBuffer &&
      this.bufferView.buffer.getArrayBuffer() === rnAccessor.bufferView.buffer.getArrayBuffer()
    );
  }
}
