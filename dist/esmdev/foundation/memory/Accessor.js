// src/foundation/memory/Accessor.ts
import { ComponentType } from "../definitions/ComponentType.js";
import { CompositionType } from "../definitions/CompositionType.js";
import { Matrix33 } from "../math/Matrix33.js";
import { MutableMatrix44 } from "../math/MutableMatrix44.js";
import { MutableVector2 } from "../math/MutableVector2.js";
import { MutableVector3 } from "../math/MutableVector3.js";
import { MutableVector4 } from "../math/MutableVector4.js";
import { Vector2 } from "../math/Vector2.js";
import { Vector3 } from "../math/Vector3.js";
import { Vector4 } from "../math/Vector4.js";
import { Is } from "../misc/Is.js";
import { Logger } from "../misc/Logger.js";
var _Accessor = class _Accessor {
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
    normalized
  }) {
    this.Xs = CompositionType.Unknown;
    this.Zs = ComponentType.Unknown;
    this.Wt = 0;
    this.bu = new Float32Array();
    // init with a dummy Float32Array at first
    this._t = 0;
    this.St = 0;
    this.ft = MutableVector4.fromCopyArray([
      -Number.MAX_VALUE,
      -Number.MAX_VALUE,
      -Number.MAX_VALUE,
      -Number.MAX_VALUE
    ]);
    this.et = MutableVector4.fromCopyArray([
      Number.MAX_VALUE,
      Number.MAX_VALUE,
      Number.MAX_VALUE,
      Number.MAX_VALUE
    ]);
    this.$t = 1;
    this.eu = false;
    this.Vt = true;
    this.du = 0;
    var _a, _b, _c, _d, _e, _f, _g, _h;
    this.au = bufferView;
    this.Xt = bufferView.byteOffsetInRawArrayBufferOfBuffer + byteOffsetInBufferView;
    this.Xs = compositionType;
    this.Zs = componentType;
    this.Wt = count;
    this.$t = arrayLength;
    if (Is.exist(max)) {
      this.ft.setComponents(
        (_a = max[0]) != null ? _a : -Number.MAX_VALUE,
        (_b = max[1]) != null ? _b : -Number.MAX_VALUE,
        (_c = max[2]) != null ? _c : -Number.MAX_VALUE,
        (_d = max[3]) != null ? _d : -Number.MAX_VALUE
      );
    }
    if (Is.exist(min)) {
      this.et.setComponents(
        (_e = min[0]) != null ? _e : Number.MAX_VALUE,
        (_f = min[1]) != null ? _f : Number.MAX_VALUE,
        (_g = min[2]) != null ? _g : Number.MAX_VALUE,
        (_h = min[3]) != null ? _h : Number.MAX_VALUE
      );
    }
    if (Is.exist(max) && Is.exist(min)) {
      this.Vt = false;
    }
    this.Ej = raw;
    this.eu = normalized;
    this.St = byteStride;
    if (this.St === 0) {
      this.St = this.Xs.getNumberOfComponents() * this.Zs.getSizeInBytes() * this.$t;
    }
    const typedArrayClass = this.getTypedArrayClass(this.Zs);
    this.cu = typedArrayClass;
    const maxExceededSizeOnAoS = this.St - this.Xs.getNumberOfComponents() * this.Zs.getSizeInBytes();
    const sizeFromAccessorBeginToArrayBufferEnd = this.Ej.byteLength - this.Xt;
    const maxLimitSizeToAccess = this.byteStride * this.Wt - maxExceededSizeOnAoS;
    if (sizeFromAccessorBeginToArrayBufferEnd < maxLimitSizeToAccess) {
      Logger.default.error(
        `Requesting a data size that exceeds the remaining capacity of the buffer: ${this.bufferView.buffer.name}.
        Exceeded Size: ${maxLimitSizeToAccess - sizeFromAccessorBeginToArrayBufferEnd}
        this.__raw.byteLength: ${this.Ej.byteLength}
        this.__byteOffsetInRawArrayBufferOfBuffer: ${this.byteOffsetInRawArrayBufferOfBuffer}
        this.byteStride: ${this.byteStride}
        this.__count: ${this.Wt}
        this.__raw.byteLength - this.__byteOffsetInRawArrayBufferOfBuffer: ${this.Ej.byteLength - this.Xt}
        this.byteStride * this.__count: ${this.byteStride * this.Wt}
        maxExceededSizeOnAoS: ${maxExceededSizeOnAoS}
        `
      );
    }
    this.Zt = new DataView(
      this.Ej,
      this.Xt,
      Math.min(this.St * this.Wt, this.Ej.byteLength - this.Xt)
    );
    if (this.Xt % typedArrayClass.BYTES_PER_ELEMENT === 0) {
      this.bu = new typedArrayClass(
        this.Ej,
        this.Xt,
        this.Xs.getNumberOfComponents() * this.Wt
      );
    } else {
      Logger.default.warn(`This Accessor's byteOffsetInRawArrayBufferOfBuffer is not aligned with the typedArrayClass's BYTES_PER_ELEMENT. So we need to copy the buffer.
So the typedArray data got by getTypedArray() is copied data, not reference to the original buffer.
`);
      this.fu();
    }
    this.Tt = this.Zt[this.getDataViewGetter(this.Zs)].bind(
      this.Zt
    );
    this.Ut = this.Zt[this.getDataViewSetter(this.Zs)].bind(
      this.Zt
    );
  }
  /**
   * Copies buffer data to a typed array when byte alignment doesn't match.
   * This is necessary when the buffer offset is not aligned with the typed array's BYTES_PER_ELEMENT.
   * @private
   */
  fu() {
    const typedArrayClass = this.getTypedArrayClass(this.Zs);
    const copyBuffer = this.Ej.slice(
      this.Xt,
      this.Xt + this.Xs.getNumberOfComponents() * this.Wt * typedArrayClass.BYTES_PER_ELEMENT
    );
    this.bu = new typedArrayClass(copyBuffer);
  }
  /**
   * Called when the accessor data is updated. Increments version and notifies associated primitives.
   * @private
   */
  Yt() {
    var _a;
    this.du++;
    if (this._primitive != null) {
      (_a = this._primitive.deref()) == null ? void 0 : _a.onAccessorUpdated(this.du);
    }
  }
  /**
   * Gets the appropriate TypedArray constructor for the given component type.
   * @param componentType - The component type to get the constructor for
   * @returns The TypedArray constructor class, or undefined if unknown
   */
  getTypedArrayClass(componentType) {
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
        Logger.default.error("Unexpected ComponentType!");
        return void 0;
    }
  }
  /**
   * Gets the DataView getter method name for the given component type.
   * @param componentType - The component type to get the getter for
   * @returns The DataView getter method name, or undefined if unknown
   */
  getDataViewGetter(componentType) {
    switch (componentType) {
      case ComponentType.Byte:
        return "getInt8";
      case ComponentType.UnsignedByte:
        return "getUint8";
      case ComponentType.Short:
        return "getInt16";
      case ComponentType.UnsignedShort:
        return "getUint16";
      case ComponentType.Int:
        return "getInt32";
      case ComponentType.UnsignedInt:
        return "getUint32";
      case ComponentType.Float:
        return "getFloat32";
      case ComponentType.Double:
        return "getFloat64";
      default:
        Logger.default.error("Unexpected ComponentType!");
        return "unknown";
    }
  }
  /**
   * Gets the DataView setter method name for the given component type.
   * @param componentType - The component type to get the setter for
   * @returns The DataView setter method name, or undefined if unknown
   */
  getDataViewSetter(componentType) {
    switch (componentType) {
      case ComponentType.Byte:
        return "setInt8";
      case ComponentType.UnsignedByte:
        return "setUint8";
      case ComponentType.Short:
        return "setInt16";
      case ComponentType.UnsignedShort:
        return "setUint16";
      case ComponentType.Int:
        return "setInt32";
      case ComponentType.UnsignedInt:
        return "setUint32";
      case ComponentType.Float:
        return "setFloat32";
      case ComponentType.Double:
        return "setFloat64";
      default:
        Logger.default.error("Unexpected ComponentType!");
    }
    return void 0;
  }
  /**
   * Takes one element from the accessor and returns a TypedArray view of it.
   * This method allocates a new view for the next available element.
   * @returns A TypedArray view of the taken element
   * @throws Error if trying to allocate more elements than available
   */
  takeOne() {
    const arrayBufferOfBufferView = this.Ej;
    if (this._t >= this.Wt) {
      Logger.default.error("You are trying to allocate more than you have secured.");
    }
    const subTypedArray = new this.cu(
      arrayBufferOfBufferView,
      this.Xt + this.St * this._t,
      this.Xs.getNumberOfComponents() * this.$t
    );
    subTypedArray._accessor = this;
    subTypedArray._idx_of_accessor = this._t;
    this._t += 1;
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
  _takeExistedOne(idx) {
    const arrayBufferOfBufferView = this.Ej;
    if (idx >= this.Wt) {
      Logger.default.error("You are trying to allocate more than you have secured.");
    }
    const subTypedArray = new this.cu(
      arrayBufferOfBufferView,
      this.Xt + this.St * idx,
      this.Xs.getNumberOfComponents() * this.$t
    );
    subTypedArray._accessor = this;
    subTypedArray._idx_of_accessor = idx;
    return subTypedArray;
  }
  /**
   * Gets the number of elements that have been taken from this accessor.
   * @returns The count of taken elements
   */
  get takenCount() {
    return this._t;
  }
  /**
   * Gets the number of components per element (e.g., 3 for Vec3, 4 for Vec4).
   * @returns The number of components
   */
  get numberOfComponents() {
    return this.Xs.getNumberOfComponents();
  }
  /**
   * Gets the size in bytes of each component.
   * @returns The component size in bytes
   */
  get componentSizeInBytes() {
    return this.Zs.getSizeInBytes();
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
  get elementCount() {
    return this.Wt;
  }
  /**
   * Gets the total byte length of all data in this accessor.
   * @returns The byte length
   */
  get byteLength() {
    return this.St * this.Wt;
  }
  /**
   * Gets the component type of this accessor.
   * @returns The component type enum
   */
  get componentType() {
    return this.Zs;
  }
  /**
   * Gets the composition type of this accessor.
   * @returns The composition type enum
   */
  get compositionType() {
    return this.Xs;
  }
  /**
   * Gets the underlying TypedArray for this accessor.
   * Note: If the buffer view uses interleaved data (AoS), direct access may not work as expected.
   * @returns The TypedArray containing the data
   */
  getTypedArray() {
    return this.bu;
  }
  /**
   * Sets the data from a TypedArray into this accessor.
   * If the provided array uses the same buffer, no copying is needed.
   * Otherwise, data is copied element by element with proper type conversion.
   * @param typedArray - The TypedArray to copy data from
   */
  setTypedArray(typedArray) {
    if (typedArray.buffer === this.Ej) {
    } else {
      if (this.Xs === CompositionType.Scalar) {
        for (let i = 0; i < this.Wt; i++) {
          this.setScalar(i, typedArray[i], { endian: true });
        }
      } else if (this.Xs === CompositionType.Vec2) {
        for (let i = 0; i < this.Wt; i++) {
          this.setVec2(i, typedArray[i * 2], typedArray[i * 2 + 1], { endian: true });
        }
      } else if (this.Xs === CompositionType.Vec3) {
        for (let i = 0; i < this.Wt; i++) {
          this.setVec3(i, typedArray[i * 3], typedArray[i * 3 + 1], typedArray[i * 3 + 2], { endian: true });
        }
      } else if (this.Xs === CompositionType.Vec4) {
        for (let i = 0; i < this.Wt; i++) {
          this.setVec4(i, typedArray[i * 4], typedArray[i * 4 + 1], typedArray[i * 4 + 2], typedArray[i * 4 + 3], {
            endian: true
          });
        }
      } else if (this.Xs === CompositionType.Mat3) {
        for (let i = 0; i < this.Wt; i++) {
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
      } else if (this.Xs === CompositionType.Mat4) {
        for (let i = 0; i < this.Wt; i++) {
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
        throw new Error("Unexpected CompositionType!");
      }
      this.fu();
    }
  }
  /**
   * Gets a Uint8Array view of this accessor's data.
   * Useful for raw byte-level access to the buffer data.
   * @returns A Uint8Array view of the accessor's data
   */
  getUint8Array() {
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
    const isSoA = this.byteStride === this.Xs.getNumberOfComponents() * this.Zs.getSizeInBytes();
    return isSoA;
  }
  /**
   * Gets the byte stride between elements.
   * For tightly packed data, this equals elementSizeInBytes.
   * For interleaved data, this may be larger.
   * @returns The byte stride
   */
  get byteStride() {
    return this.St;
  }
  /**
   * Gets a scalar value at the specified index.
   * @param i - The element index
   * @param options - Access options including indices accessor and endianness
   * @returns The scalar value
   */
  getScalar(i, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    return this.Tt(this.St * index, endian);
  }
  /**
   * Gets a scalar value at the specified index with a composition offset.
   * @param i - The element index
   * @param compositionOffset - Byte offset within the element
   * @param options - Access options including indices accessor and endianness
   * @returns The scalar value
   */
  getScalarAt(i, compositionOffset, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    return this.Tt(this.St * index + compositionOffset, endian);
  }
  /**
   * Gets a 2D vector as an array at the specified index.
   * @param i - The element index
   * @param options - Access options including indices accessor and endianness
   * @returns A 2-element array containing the vector components
   */
  getVec2AsArray(i, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return [
      this.Tt(this.St * index, endian),
      this.Tt(this.St * index + 1 * byteSize, endian)
    ];
  }
  /**
   * Gets a 3D vector as an array at the specified index.
   * @param i - The element index
   * @param options - Access options including indices accessor and endianness
   * @returns A 3-element array containing the vector components
   */
  getVec3AsArray(i, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return [
      this.Tt(this.St * index, endian),
      this.Tt(this.St * index + 1 * byteSize, endian),
      this.Tt(this.St * index + 2 * byteSize, endian)
    ];
  }
  /**
   * Gets a 4D vector as an array at the specified index.
   * @param i - The element index
   * @param options - Access options including indices accessor and endianness
   * @returns A 4-element array containing the vector components
   */
  getVec4AsArray(i, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return [
      this.Tt(this.St * index, endian),
      this.Tt(this.St * index + 1 * byteSize, endian),
      this.Tt(this.St * index + 2 * byteSize, endian),
      this.Tt(this.St * index + 3 * byteSize, endian)
    ];
  }
  /**
   * Gets a 3x3 matrix as an array at the specified index.
   * @param i - The element index
   * @param options - Access options including indices accessor and endianness
   * @returns A 9-element array containing the matrix components in row-major order
   */
  getMat3AsArray(i, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return [
      this.Tt(this.St * index, endian),
      this.Tt(this.St * index + 1 * byteSize, endian),
      this.Tt(this.St * index + 2 * byteSize, endian),
      this.Tt(this.St * index + 3 * byteSize, endian),
      this.Tt(this.St * index + 4 * byteSize, endian),
      this.Tt(this.St * index + 5 * byteSize, endian),
      this.Tt(this.St * index + 6 * byteSize, endian),
      this.Tt(this.St * index + 7 * byteSize, endian),
      this.Tt(this.St * index + 8 * byteSize, endian)
    ];
  }
  /**
   * Gets a 4x4 matrix as an array at the specified index.
   * @param i - The element index
   * @param options - Access options including indices accessor and endianness
   * @returns A 16-element array containing the matrix components in row-major order
   */
  getMat4AsArray(i, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return [
      this.Tt(this.St * index, endian),
      this.Tt(this.St * index + 1 * byteSize, endian),
      this.Tt(this.St * index + 2 * byteSize, endian),
      this.Tt(this.St * index + 3 * byteSize, endian),
      this.Tt(this.St * index + 4 * byteSize, endian),
      this.Tt(this.St * index + 5 * byteSize, endian),
      this.Tt(this.St * index + 6 * byteSize, endian),
      this.Tt(this.St * index + 7 * byteSize, endian),
      this.Tt(this.St * index + 8 * byteSize, endian),
      this.Tt(this.St * index + 9 * byteSize, endian),
      this.Tt(this.St * index + 10 * byteSize, endian),
      this.Tt(this.St * index + 11 * byteSize, endian),
      this.Tt(this.St * index + 12 * byteSize, endian),
      this.Tt(this.St * index + 13 * byteSize, endian),
      this.Tt(this.St * index + 14 * byteSize, endian),
      this.Tt(this.St * index + 15 * byteSize, endian)
    ];
  }
  /**
   * Gets a 2D vector object at the specified index.
   * @param i - The element index
   * @param options - Access options including indices accessor and endianness
   * @returns A Vector2 object containing the vector components
   */
  getVec2(i, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return Vector2.fromCopyArray2([
      this.Tt(this.St * index, endian),
      this.Tt(this.St * index + 1 * byteSize, endian)
    ]);
  }
  /**
   * Gets a 3D vector object at the specified index.
   * @param i - The element index
   * @param options - Access options including indices accessor and endianness
   * @returns A Vector3 object containing the vector components
   */
  getVec3(i, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return Vector3.fromCopyArray([
      this.Tt(this.St * index, endian),
      this.Tt(this.St * index + 1 * byteSize, endian),
      this.Tt(this.St * index + 2 * byteSize, endian)
    ]);
  }
  /**
   * Gets a 4D vector object at the specified index.
   * @param i - The element index
   * @param options - Access options including indices accessor and endianness
   * @returns A Vector4 object containing the vector components
   */
  getVec4(i, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return Vector4.fromCopyArray([
      this.Tt(this.St * index, endian),
      this.Tt(this.St * index + 1 * byteSize, endian),
      this.Tt(this.St * index + 2 * byteSize, endian),
      this.Tt(this.St * index + 3 * byteSize, endian)
    ]);
  }
  /**
   * Gets a 3x3 matrix object at the specified index.
   * @param i - The element index
   * @param options - Access options including indices accessor and endianness
   * @returns A Matrix33 object containing the matrix components
   */
  getMat3(i, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return Matrix33.fromCopy9RowMajor(
      this.Tt(this.St * index, endian),
      this.Tt(this.St * index + 1 * byteSize, endian),
      this.Tt(this.St * index + 2 * byteSize, endian),
      this.Tt(this.St * index + 3 * byteSize, endian),
      this.Tt(this.St * index + 4 * byteSize, endian),
      this.Tt(this.St * index + 5 * byteSize, endian),
      this.Tt(this.St * index + 6 * byteSize, endian),
      this.Tt(this.St * index + 7 * byteSize, endian),
      this.Tt(this.St * index + 8 * byteSize, endian)
    );
  }
  /**
   * Gets a 4x4 matrix object at the specified index.
   * @param i - The element index
   * @param options - Access options including indices accessor and endianness
   * @returns A MutableMatrix44 object containing the matrix components
   */
  getMat4(i, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return MutableMatrix44.fromCopy16RowMajor(
      this.Tt(this.St * index, endian),
      this.Tt(this.St * index + 1 * byteSize, endian),
      this.Tt(this.St * index + 2 * byteSize, endian),
      this.Tt(this.St * index + 3 * byteSize, endian),
      this.Tt(this.St * index + 4 * byteSize, endian),
      this.Tt(this.St * index + 5 * byteSize, endian),
      this.Tt(this.St * index + 6 * byteSize, endian),
      this.Tt(this.St * index + 7 * byteSize, endian),
      this.Tt(this.St * index + 8 * byteSize, endian),
      this.Tt(this.St * index + 9 * byteSize, endian),
      this.Tt(this.St * index + 10 * byteSize, endian),
      this.Tt(this.St * index + 11 * byteSize, endian),
      this.Tt(this.St * index + 12 * byteSize, endian),
      this.Tt(this.St * index + 13 * byteSize, endian),
      this.Tt(this.St * index + 14 * byteSize, endian),
      this.Tt(this.St * index + 15 * byteSize, endian)
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
  getVec2To(i, out, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return out.setComponents(
      this.Tt(this.St * index, endian),
      this.Tt(this.St * index + 1 * byteSize, endian)
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
  getVec3To(i, out, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return out.setComponents(
      this.Tt(this.St * index, endian),
      this.Tt(this.St * index + 1 * byteSize, endian),
      this.Tt(this.St * index + 2 * byteSize, endian)
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
  getVec4To(i, out, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return out.setComponents(
      this.Tt(this.St * index, endian),
      this.Tt(this.St * index + 1 * byteSize, endian),
      this.Tt(this.St * index + 2 * byteSize, endian),
      this.Tt(this.St * index + 3 * byteSize, endian)
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
  getMat3To(i, out, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return out.setComponents(
      this.Tt(this.St * index, endian),
      this.Tt(this.St * index + 1 * byteSize, endian),
      this.Tt(this.St * index + 2 * byteSize, endian),
      this.Tt(this.St * index + 3 * byteSize, endian),
      this.Tt(this.St * index + 4 * byteSize, endian),
      this.Tt(this.St * index + 5 * byteSize, endian),
      this.Tt(this.St * index + 6 * byteSize, endian),
      this.Tt(this.St * index + 7 * byteSize, endian),
      this.Tt(this.St * index + 8 * byteSize, endian)
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
  getMat4To(i, out, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const byteSize = this.componentSizeInBytes;
    return out.setComponents(
      this.Tt(this.St * index, endian),
      this.Tt(this.St * index + 1 * byteSize, endian),
      this.Tt(this.St * index + 2 * byteSize, endian),
      this.Tt(this.St * index + 3 * byteSize, endian),
      this.Tt(this.St * index + 4 * byteSize, endian),
      this.Tt(this.St * index + 5 * byteSize, endian),
      this.Tt(this.St * index + 6 * byteSize, endian),
      this.Tt(this.St * index + 7 * byteSize, endian),
      this.Tt(this.St * index + 8 * byteSize, endian),
      this.Tt(this.St * index + 9 * byteSize, endian),
      this.Tt(this.St * index + 10 * byteSize, endian),
      this.Tt(this.St * index + 11 * byteSize, endian),
      this.Tt(this.St * index + 12 * byteSize, endian),
      this.Tt(this.St * index + 13 * byteSize, endian),
      this.Tt(this.St * index + 14 * byteSize, endian),
      this.Tt(this.St * index + 15 * byteSize, endian)
    );
  }
  /**
   * Sets a scalar value at the specified index.
   * @param i - The element index
   * @param value - The scalar value to set
   * @param options - Access options including indices accessor and endianness
   */
  setScalar(i, value, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    this.Ut(this.St * index, value, endian);
    this.Vt = true;
    this.Yt();
  }
  /**
   * Sets a 2D vector at the specified index.
   * @param i - The element index
   * @param x - The X component value
   * @param y - The Y component value
   * @param options - Access options including indices accessor and endianness
   */
  setVec2(i, x, y, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.Ut(this.St * index, x, endian);
    this.Ut(this.St * index + 1 * sizeInBytes, y, endian);
    this.Vt = true;
    this.Yt();
  }
  /**
   * Sets a 3D vector at the specified index.
   * @param i - The element index
   * @param x - The X component value
   * @param y - The Y component value
   * @param z - The Z component value
   * @param options - Access options including indices accessor and endianness
   */
  setVec3(i, x, y, z, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.Ut(this.St * index, x, endian);
    this.Ut(this.St * index + 1 * sizeInBytes, y, endian);
    this.Ut(this.St * index + 2 * sizeInBytes, z, endian);
    this.Vt = true;
    this.Yt();
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
  setVec4(i, x, y, z, w, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.Ut(this.St * index, x, endian);
    this.Ut(this.St * index + 1 * sizeInBytes, y, endian);
    this.Ut(this.St * index + 2 * sizeInBytes, z, endian);
    this.Ut(this.St * index + 3 * sizeInBytes, w, endian);
    this.Vt = true;
    this.Yt();
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
  setMat3(i, v0, v1, v2, v3, v4, v5, v6, v7, v8, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.Ut(this.St * index, v0, endian);
    this.Ut(this.St * index + 1 * sizeInBytes, v1, endian);
    this.Ut(this.St * index + 2 * sizeInBytes, v2, endian);
    this.Ut(this.St * index + 3 * sizeInBytes, v3, endian);
    this.Ut(this.St * index + 4 * sizeInBytes, v4, endian);
    this.Ut(this.St * index + 5 * sizeInBytes, v5, endian);
    this.Ut(this.St * index + 6 * sizeInBytes, v6, endian);
    this.Ut(this.St * index + 7 * sizeInBytes, v7, endian);
    this.Ut(this.St * index + 8 * sizeInBytes, v8, endian);
    this.Vt = true;
    this.Yt();
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
  setMat4(i, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.Ut(this.St * index, v0, endian);
    this.Ut(this.St * index + 1 * sizeInBytes, v1, endian);
    this.Ut(this.St * index + 2 * sizeInBytes, v2, endian);
    this.Ut(this.St * index + 3 * sizeInBytes, v3, endian);
    this.Ut(this.St * index + 4 * sizeInBytes, v4, endian);
    this.Ut(this.St * index + 5 * sizeInBytes, v5, endian);
    this.Ut(this.St * index + 6 * sizeInBytes, v6, endian);
    this.Ut(this.St * index + 7 * sizeInBytes, v7, endian);
    this.Ut(this.St * index + 8 * sizeInBytes, v8, endian);
    this.Ut(this.St * index + 9 * sizeInBytes, v9, endian);
    this.Ut(this.St * index + 10 * sizeInBytes, v10, endian);
    this.Ut(this.St * index + 11 * sizeInBytes, v11, endian);
    this.Ut(this.St * index + 12 * sizeInBytes, v12, endian);
    this.Ut(this.St * index + 13 * sizeInBytes, v13, endian);
    this.Ut(this.St * index + 14 * sizeInBytes, v14, endian);
    this.Ut(this.St * index + 15 * sizeInBytes, v15, endian);
    this.Vt = true;
    this.Yt();
  }
  /**
   * Sets a 2D vector at the specified index using a Vector2 object.
   * @param i - The element index
   * @param vec - The Vector2 object containing the values to set
   * @param options - Access options including indices accessor and endianness
   */
  setVec2AsVector(i, vec, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.Ut(this.St * index, vec.x, endian);
    this.Ut(this.St * index + 1 * sizeInBytes, vec.y, endian);
    this.Vt = true;
    this.Yt();
  }
  /**
   * Sets a 3D vector at the specified index using a Vector3 object.
   * @param i - The element index
   * @param vec - The Vector3 object containing the values to set
   * @param options - Access options including indices accessor and endianness
   */
  setVec3AsVector(i, vec, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.Ut(this.St * index, vec.x, endian);
    this.Ut(this.St * index + 1 * sizeInBytes, vec.y, endian);
    this.Ut(this.St * index + 2 * sizeInBytes, vec.z, endian);
    this.Vt = true;
    this.Yt();
  }
  /**
   * Sets a 4D vector at the specified index using a Vector4 object.
   * @param i - The element index
   * @param vec - The Vector4 object containing the values to set
   * @param options - Access options including indices accessor and endianness
   */
  setVec4AsVector(i, vec, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.Ut(this.St * index, vec.x, endian);
    this.Ut(this.St * index + 1 * sizeInBytes, vec.y, endian);
    this.Ut(this.St * index + 2 * sizeInBytes, vec.z, endian);
    this.Ut(this.St * index + 3 * sizeInBytes, vec.w, endian);
    this.Vt = true;
    this.Yt();
  }
  /**
   * Sets a 4x4 matrix at the specified index using a Matrix44 object.
   * @param i - The element index
   * @param mat - The Matrix44 object containing the values to set
   * @param options - Access options including indices accessor and endianness
   */
  setMat4AsMatrix44(i, mat, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    const sizeInBytes = this.componentSizeInBytes;
    this.Ut(this.St * index, mat._v[0], endian);
    this.Ut(this.St * index + 1 * sizeInBytes, mat._v[1], endian);
    this.Ut(this.St * index + 2 * sizeInBytes, mat._v[2], endian);
    this.Ut(this.St * index + 3 * sizeInBytes, mat._v[3], endian);
    this.Ut(this.St * index + 4 * sizeInBytes, mat._v[4], endian);
    this.Ut(this.St * index + 5 * sizeInBytes, mat._v[5], endian);
    this.Ut(this.St * index + 6 * sizeInBytes, mat._v[6], endian);
    this.Ut(this.St * index + 7 * sizeInBytes, mat._v[7], endian);
    this.Ut(this.St * index + 8 * sizeInBytes, mat._v[8], endian);
    this.Ut(this.St * index + 9 * sizeInBytes, mat._v[9], endian);
    this.Ut(this.St * index + 10 * sizeInBytes, mat._v[10], endian);
    this.Ut(this.St * index + 11 * sizeInBytes, mat._v[11], endian);
    this.Ut(this.St * index + 12 * sizeInBytes, mat._v[12], endian);
    this.Ut(this.St * index + 13 * sizeInBytes, mat._v[13], endian);
    this.Ut(this.St * index + 14 * sizeInBytes, mat._v[14], endian);
    this.Ut(this.St * index + 15 * sizeInBytes, mat._v[15], endian);
    this.Vt = true;
    this.Yt();
  }
  /**
   * Copies data from a TypedArray into this accessor.
   * The data is copied element by element with proper type conversion.
   * @param typedArray - The TypedArray to copy data from
   */
  copyFromTypedArray(typedArray) {
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
          throw new Error("Other than vectors are currently not supported.");
      }
    }
    this.Vt = true;
    this.Yt();
  }
  /**
   * Sets a scalar value at the specified index with a composition offset.
   * @param i - The element index
   * @param compositionOffset - Byte offset within the element
   * @param value - The scalar value to set
   * @param options - Access options including indices accessor and endianness
   */
  setScalarAt(i, compositionOffset, value, { indicesAccessor, endian = true }) {
    let index = i;
    if (indicesAccessor) {
      index = indicesAccessor.getScalar(i, {});
    }
    this.Ut(this.St * index + compositionOffset, value, endian);
    this.Vt = true;
    this.Yt();
  }
  /**
   * Sets an element from another accessor with the same composition type.
   * @param i - The target element index
   * @param accessor - The source accessor to copy from
   * @param secondIdx - Optional source index (defaults to i)
   */
  setElementFromSameCompositionAccessor(i, accessor, secondIdx) {
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
    this.Vt = true;
    this.Yt();
  }
  /**
   * Copies the entire buffer from another accessor.
   * @param accessor - The source accessor to copy the buffer from
   */
  copyBuffer(accessor) {
    new Uint8Array(this.Ej).set(
      new Uint8Array(accessor.Ej, accessor.Xt, accessor.byteLength),
      this.Xt
    );
    this.Vt = true;
    this.Yt();
  }
  /**
   * Sets an element from another accessor, handling different composition types.
   * Automatically converts between different vector/scalar types as needed.
   * @param i - The target element index
   * @param accessor - The source accessor to copy from
   * @param secondIdx - Optional source index (defaults to i)
   */
  setElementFromAccessor(i, accessor, secondIdx) {
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
    this.Vt = true;
    this.Yt();
  }
  /**
   * Adds an element from another accessor with the same composition type, scaled by a coefficient.
   * @param i - The target element index
   * @param accessor - The source accessor to add from
   * @param coeff - The coefficient to multiply the source values by
   * @param secondIdx - Optional source index (defaults to i)
   */
  addElementFromSameCompositionAccessor(i, accessor, coeff, secondIdx) {
    const j = secondIdx != null ? secondIdx : i;
    if (this.compositionType.getNumberOfComponents() === 1) {
      this.setScalar(i, this.getScalar(i, {}) + coeff * accessor.getScalar(j, {}), {});
    } else if (this.compositionType.getNumberOfComponents() === 2) {
      this.setVec2AsVector(i, Vector2.add(this.getVec2(i, {}), Vector2.multiply(accessor.getVec2(j, {}), coeff)), {});
    } else if (this.compositionType.getNumberOfComponents() === 3) {
      this.setVec3AsVector(i, Vector3.add(this.getVec3(i, {}), Vector3.multiply(accessor.getVec3(j, {}), coeff)), {});
    } else if (this.compositionType.getNumberOfComponents() === 4) {
      this.setVec4AsVector(i, Vector4.add(this.getVec4(i, {}), Vector4.multiply(accessor.getVec4(j, {}), coeff)), {});
    }
    this.Vt = true;
    this.Yt();
  }
  /**
   * Gets the underlying ArrayBuffer of the buffer view.
   * @returns The ArrayBuffer containing the data
   */
  get arrayBufferOfBufferView() {
    return this.Ej;
  }
  /**
   * Gets the DataView of the buffer view.
   * @returns The DataView for accessing the buffer data
   */
  get dataViewOfBufferView() {
    return this.Zt;
  }
  /**
   * Gets the byte offset within the buffer view.
   * @returns The byte offset in the buffer view
   */
  get byteOffsetInBufferView() {
    return this.Xt - this.au.byteOffsetInRawArrayBufferOfBuffer;
  }
  /**
   * Gets the byte offset within the buffer.
   * @returns The byte offset in the buffer
   */
  get byteOffsetInBuffer() {
    return this.Xt - this.au.buffer.byteOffsetInRawArrayBuffer;
  }
  /**
   * Gets the byte offset in the raw ArrayBuffer of the buffer.
   * @returns The byte offset in the raw ArrayBuffer
   */
  get byteOffsetInRawArrayBufferOfBuffer() {
    return this.Xt;
  }
  /**
   * Gets the BufferView that contains this accessor's data.
   * @returns The BufferView object
   */
  get bufferView() {
    return this.au;
  }
  /**
   * Sets the minimum and maximum values for this accessor.
   * @param min - Array of minimum values for each component
   * @param max - Array of maximum values for each component
   */
  setMinMax(min, max) {
    const componentN = this.compositionType.getNumberOfComponents();
    if (componentN === 1) {
      this.et._v[0] = min[0];
      this.ft._v[0] = max[0];
    } else if (componentN === 2) {
      this.et._v[0] = min[0];
      this.et._v[1] = min[1];
      this.ft._v[0] = max[0];
      this.ft._v[1] = max[1];
    } else if (componentN === 3) {
      this.et._v[0] = min[0];
      this.et._v[1] = min[1];
      this.et._v[2] = min[2];
      this.ft._v[0] = max[0];
      this.ft._v[1] = max[1];
      this.ft._v[2] = max[2];
    } else if (componentN === 4) {
      this.et._v[0] = min[0];
      this.et._v[1] = min[1];
      this.et._v[2] = min[2];
      this.et._v[3] = min[3];
      this.ft._v[0] = max[0];
      this.ft._v[1] = max[1];
      this.ft._v[2] = max[2];
      this.ft._v[3] = max[3];
    }
    this.Vt = false;
  }
  /**
   * Gets the minimum values for each component.
   * Calculates min/max if dirty.
   * @returns Array of minimum values
   */
  get min() {
    if (this.Vt) {
      this.gu();
    }
    const componentN = this.compositionType.getNumberOfComponents();
    if (componentN === 4) {
      return [this.et._v[0], this.et._v[1], this.et._v[2], this.et._v[3]];
    }
    if (componentN === 3) {
      return [this.et._v[0], this.et._v[1], this.et._v[2]];
    }
    if (componentN === 2) {
      return [this.et._v[0], this.et._v[1]];
    }
    return [this.et._v[0]];
  }
  /**
   * Gets the maximum values for each component.
   * Calculates min/max if dirty.
   * @returns Array of maximum values
   */
  get max() {
    if (this.Vt) {
      this.gu();
    }
    const componentN = this.compositionType.getNumberOfComponents();
    if (componentN === 4) {
      return [this.ft._v[0], this.ft._v[1], this.ft._v[2], this.ft._v[3]];
    }
    if (componentN === 3) {
      return [this.ft._v[0], this.ft._v[1], this.ft._v[2]];
    }
    if (componentN === 2) {
      return [this.ft._v[0], this.ft._v[1]];
    }
    return [this.ft._v[0]];
  }
  /**
   * Gets whether the data should be normalized.
   * @returns True if data should be normalized
   */
  get normalized() {
    return this.eu;
  }
  /**
   * Calculates the minimum and maximum values for all elements.
   * @private
   */
  gu() {
    const componentN = this.compositionType.getNumberOfComponents();
    if (componentN === 4) {
      this.ft.setComponents(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
      this.et.setComponents(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
      const vec4 = _Accessor.gn;
      for (let i = 0; i < this.elementCount; i++) {
        this.getVec4To(i, vec4, {});
        for (let j = 0; j < 4; j++) {
          if (this.ft._v[j] < vec4._v[j]) {
            this.ft._v[j] = vec4._v[j];
          }
          if (vec4._v[j] < this.et._v[j]) {
            this.et._v[j] = vec4._v[j];
          }
        }
      }
    } else if (componentN === 3) {
      this.ft.setComponents(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
      this.et.setComponents(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
      const vec3 = _Accessor.Dc;
      for (let i = 0; i < this.elementCount; i++) {
        this.getVec3To(i, vec3, {});
        for (let j = 0; j < 3; j++) {
          if (this.ft._v[j] < vec3._v[j]) {
            this.ft._v[j] = vec3._v[j];
          }
          if (vec3._v[j] < this.et._v[j]) {
            this.et._v[j] = vec3._v[j];
          }
        }
      }
    } else if (componentN === 2) {
      this.ft.setComponents(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
      this.et.setComponents(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
      const vec2 = _Accessor.hu;
      for (let i = 0; i < this.elementCount; i++) {
        this.getVec2To(i, vec2, {});
        for (let j = 0; j < 2; j++) {
          if (this.ft._v[j] < vec2._v[j]) {
            this.ft._v[j] = vec2._v[j];
          }
          if (vec2._v[j] < this.et._v[j]) {
            this.et._v[j] = vec2._v[j];
          }
        }
      }
    } else if (componentN === 1) {
      this.ft.setComponents(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
      this.et.setComponents(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
      for (let i = 0; i < this.elementCount; i++) {
        const scalar = this.getScalar(i, {});
        if (this.ft._v[0] < scalar) {
          this.ft._v[0] = scalar;
        }
        if (scalar < this.et._v[0]) {
          this.et._v[0] = scalar;
        }
      }
    }
    this.Vt = false;
  }
  /**
   * Gets whether the min/max values are dirty and need recalculation.
   * @returns True if min/max values are dirty
   */
  get isMinMaxDirty() {
    return this.Vt;
  }
  /**
   * Gets the version number of this accessor.
   * Increments when data is modified.
   * @returns The version number
   */
  get version() {
    return this.du;
  }
  /**
   * Gets the actual byte stride, accounting for zero stride.
   * @returns The actual byte stride
   */
  get actualByteStride() {
    if (this.St === 0) {
      const actualByteStride = this.Xs.getNumberOfComponents() * this.Zs.getSizeInBytes() * this.$t;
      return actualByteStride;
    }
    return this.St;
  }
  /**
   * Checks if this accessor is the same as another accessor.
   * Compares byte length, offset, and underlying buffer.
   * @param rnAccessor - The accessor to compare with
   * @returns True if the accessors are the same
   */
  isSame(rnAccessor) {
    return this.byteLength === rnAccessor.byteLength && this.byteOffsetInRawArrayBufferOfBuffer === rnAccessor.byteOffsetInRawArrayBufferOfBuffer && this.bufferView.buffer.getArrayBuffer() === rnAccessor.bufferView.buffer.getArrayBuffer();
  }
};
_Accessor.gn = MutableVector4.zero();
_Accessor.Dc = MutableVector3.zero();
_Accessor.hu = MutableVector2.zero();
var Accessor = _Accessor;
export {
  Accessor
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWVtb3J5L0FjY2Vzc29yLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7XG4gIEFycmF5MixcbiAgQXJyYXkzLFxuICBBcnJheTQsXG4gIEJ5dGUsXG4gIENvdW50LFxuICBJbmRleCxcbiAgU2l6ZSxcbiAgVHlwZWRBcnJheSxcbiAgVHlwZWRBcnJheUNvbnN0cnVjdG9yLFxufSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgeyBDb21wb25lbnRUeXBlLCB0eXBlIENvbXBvbmVudFR5cGVFbnVtIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvQ29tcG9uZW50VHlwZSc7XG5pbXBvcnQgeyBDb21wb3NpdGlvblR5cGUsIHR5cGUgQ29tcG9zaXRpb25UeXBlRW51bSB9IGZyb20gJy4uL2RlZmluaXRpb25zL0NvbXBvc2l0aW9uVHlwZSc7XG5pbXBvcnQgdHlwZSB7IFByaW1pdGl2ZSB9IGZyb20gJy4uL2dlb21ldHJ5L1ByaW1pdGl2ZSc7XG5pbXBvcnQgeyBNYXRyaXgzMyB9IGZyb20gJy4uL21hdGgvTWF0cml4MzMnO1xuaW1wb3J0IHR5cGUgeyBNYXRyaXg0NCB9IGZyb20gJy4uL21hdGgvTWF0cml4NDQnO1xuaW1wb3J0IHR5cGUgeyBNdXRhYmxlTWF0cml4MzMgfSBmcm9tICcuLi9tYXRoL011dGFibGVNYXRyaXgzMyc7XG5pbXBvcnQgeyBNdXRhYmxlTWF0cml4NDQgfSBmcm9tICcuLi9tYXRoL011dGFibGVNYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMiB9IGZyb20gJy4uL21hdGgvTXV0YWJsZVZlY3RvcjInO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjMgfSBmcm9tICcuLi9tYXRoL011dGFibGVWZWN0b3IzJztcbmltcG9ydCB7IE11dGFibGVWZWN0b3I0IH0gZnJvbSAnLi4vbWF0aC9NdXRhYmxlVmVjdG9yNCc7XG5pbXBvcnQgeyBWZWN0b3IyIH0gZnJvbSAnLi4vbWF0aC9WZWN0b3IyJztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICcuLi9tYXRoL1ZlY3RvcjMnO1xuaW1wb3J0IHsgVmVjdG9yNCB9IGZyb20gJy4uL21hdGgvVmVjdG9yNCc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uL21pc2MvSXMnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHR5cGUgeyBCdWZmZXJWaWV3IH0gZnJvbSAnLi9CdWZmZXJWaWV3JztcblxudHlwZSBEYXRhVmlld0dldHRlciA9IChieXRlT2Zmc2V0OiBCeXRlLCBsaXR0bGVFbmRpYW4/OiBib29sZWFuKSA9PiBudW1iZXI7XG50eXBlIERhdGFWaWV3U2V0dGVyID0gKGJ5dGVPZmZzZXQ6IEJ5dGUsIHZhbHVlOiBudW1iZXIsIGxpdHRsZUVuZGlhbj86IGJvb2xlYW4pID0+IHZvaWQ7XG5cbmV4cG9ydCB0eXBlIEluZGljZXNBY2Nlc3NPcHRpb24gPSB7XG4gIGluZGljZXNBY2Nlc3Nvcj86IEFjY2Vzc29yO1xuICBlbmRpYW4/OiBib29sZWFuO1xufTtcblxuLyoqXG4gKiBBY2Nlc3NvciBjbGFzcyBwcm92aWRlcyBhIGhpZ2gtbGV2ZWwgaW50ZXJmYWNlIGZvciByZWFkaW5nIGFuZCB3cml0aW5nIGRhdGEgZnJvbS90byBhIEJ1ZmZlclZpZXcuXG4gKiBJdCBoYW5kbGVzIGRpZmZlcmVudCBkYXRhIHR5cGVzIChzY2FsYXIsIHZlY3RvciwgbWF0cml4KSBhbmQgcHJvdmlkZXMgdHlwZS1zYWZlIGFjY2VzcyB0byBidWZmZXIgZGF0YS5cbiAqIFRoaXMgY2xhc3MgaXMgY29tbW9ubHkgdXNlZCBpbiAzRCBncmFwaGljcyBhcHBsaWNhdGlvbnMgZm9yIG1hbmFnaW5nIHZlcnRleCBhdHRyaWJ1dGVzLCBpbmRpY2VzLCBhbmQgb3RoZXIgYnVmZmVyIGRhdGEuXG4gKi9cbmV4cG9ydCBjbGFzcyBBY2Nlc3NvciB7XG4gIHByaXZhdGUgX19idWZmZXJWaWV3OiBCdWZmZXJWaWV3O1xuICBwcml2YXRlIF9fYnl0ZU9mZnNldEluUmF3QXJyYXlCdWZmZXJPZkJ1ZmZlcjogQnl0ZTtcbiAgcHJpdmF0ZSBfX2NvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlRW51bSA9IENvbXBvc2l0aW9uVHlwZS5Vbmtub3duO1xuICBwcml2YXRlIF9fY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZUVudW0gPSBDb21wb25lbnRUeXBlLlVua25vd247XG4gIHByaXZhdGUgX19jb3VudDogQ291bnQgPSAwO1xuICBwcml2YXRlIF9fcmF3OiBBcnJheUJ1ZmZlcjtcbiAgcHJpdmF0ZSBfX2RhdGFWaWV3PzogRGF0YVZpZXc7XG4gIHByaXZhdGUgX190eXBlZEFycmF5OiBUeXBlZEFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSgpOyAvLyBpbml0IHdpdGggYSBkdW1teSBGbG9hdDMyQXJyYXkgYXQgZmlyc3RcbiAgcHJpdmF0ZSBfX3Rha2VuQ291bnQ6IENvdW50ID0gMDtcbiAgcHJpdmF0ZSBfX2J5dGVTdHJpZGU6IEJ5dGUgPSAwOyAvLyBBY2Nlc3NvciBoYXMgdGhlIGJ5dGVTdHJpZGUuIEJ1ZmZlclZpZXcgZG9lc24ndC4gRm9yIHN1cHBvcnRpbmcgZ2xURjEsIG5vdCBvbmx5IGdsVEYyXG4gIHByaXZhdGUgX190eXBlZEFycmF5Q2xhc3M/OiBUeXBlZEFycmF5Q29uc3RydWN0b3I7XG4gIHByaXZhdGUgX19kYXRhVmlld0dldHRlcjogRGF0YVZpZXdHZXR0ZXI7XG4gIHByaXZhdGUgX19kYXRhVmlld1NldHRlcjogRGF0YVZpZXdTZXR0ZXI7XG4gIHByaXZhdGUgX19tYXg6IE11dGFibGVWZWN0b3I0ID0gTXV0YWJsZVZlY3RvcjQuZnJvbUNvcHlBcnJheShbXG4gICAgLU51bWJlci5NQVhfVkFMVUUsXG4gICAgLU51bWJlci5NQVhfVkFMVUUsXG4gICAgLU51bWJlci5NQVhfVkFMVUUsXG4gICAgLU51bWJlci5NQVhfVkFMVUUsXG4gIF0pO1xuICBwcml2YXRlIF9fbWluOiBNdXRhYmxlVmVjdG9yNCA9IE11dGFibGVWZWN0b3I0LmZyb21Db3B5QXJyYXkoW1xuICAgIE51bWJlci5NQVhfVkFMVUUsXG4gICAgTnVtYmVyLk1BWF9WQUxVRSxcbiAgICBOdW1iZXIuTUFYX1ZBTFVFLFxuICAgIE51bWJlci5NQVhfVkFMVUUsXG4gIF0pO1xuICBwcml2YXRlIF9fYXJyYXlMZW5ndGggPSAxO1xuICBwcml2YXRlIF9fbm9ybWFsaXplZCA9IGZhbHNlO1xuICBwcml2YXRlIF9faXNNaW5NaXhEaXJ0eSA9IHRydWU7XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBWZWN0b3I0XzAgPSBNdXRhYmxlVmVjdG9yNC56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wVmVjdG9yM18wID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFZlY3RvcjJfMCA9IE11dGFibGVWZWN0b3IyLnplcm8oKTtcbiAgcHJpdmF0ZSBfX3ZlcnNpb24gPSAwO1xuXG4gIHB1YmxpYyBfcHJpbWl0aXZlPzogV2Vha1JlZjxQcmltaXRpdmU+O1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IEFjY2Vzc29yIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gcGFyYW1zIC0gQ29uZmlndXJhdGlvbiBvYmplY3QgZm9yIHRoZSBhY2Nlc3NvclxuICAgKiBAcGFyYW0gcGFyYW1zLmJ1ZmZlclZpZXcgLSBUaGUgQnVmZmVyVmlldyB0aGF0IGNvbnRhaW5zIHRoZSBkYXRhXG4gICAqIEBwYXJhbSBwYXJhbXMuYnl0ZU9mZnNldEluQnVmZmVyVmlldyAtIEJ5dGUgb2Zmc2V0IHdpdGhpbiB0aGUgYnVmZmVyIHZpZXdcbiAgICogQHBhcmFtIHBhcmFtcy5jb21wb3NpdGlvblR5cGUgLSBUeXBlIG9mIGRhdGEgY29tcG9zaXRpb24gKHNjYWxhciwgdmVjMiwgdmVjMywgdmVjNCwgbWF0MywgbWF0NClcbiAgICogQHBhcmFtIHBhcmFtcy5jb21wb25lbnRUeXBlIC0gQ29tcG9uZW50IGRhdGEgdHlwZSAoYnl0ZSwgc2hvcnQsIGludCwgZmxvYXQsIGV0Yy4pXG4gICAqIEBwYXJhbSBwYXJhbXMuYnl0ZVN0cmlkZSAtIEJ5dGUgc3RyaWRlIGJldHdlZW4gZWxlbWVudHMgKDAgZm9yIHRpZ2h0bHkgcGFja2VkKVxuICAgKiBAcGFyYW0gcGFyYW1zLmNvdW50IC0gTnVtYmVyIG9mIGVsZW1lbnRzXG4gICAqIEBwYXJhbSBwYXJhbXMucmF3IC0gUmF3IEFycmF5QnVmZmVyIGNvbnRhaW5pbmcgdGhlIGRhdGFcbiAgICogQHBhcmFtIHBhcmFtcy5tYXggLSBPcHRpb25hbCBtYXhpbXVtIHZhbHVlcyBmb3IgZWFjaCBjb21wb25lbnRcbiAgICogQHBhcmFtIHBhcmFtcy5taW4gLSBPcHRpb25hbCBtaW5pbXVtIHZhbHVlcyBmb3IgZWFjaCBjb21wb25lbnRcbiAgICogQHBhcmFtIHBhcmFtcy5hcnJheUxlbmd0aCAtIExlbmd0aCBvZiBhcnJheSBmb3IgZWFjaCBlbGVtZW50XG4gICAqIEBwYXJhbSBwYXJhbXMubm9ybWFsaXplZCAtIFdoZXRoZXIgaW50ZWdlciB2YWx1ZXMgc2hvdWxkIGJlIG5vcm1hbGl6ZWQgdG8gWzAsMV0gb3IgWy0xLDFdXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih7XG4gICAgYnVmZmVyVmlldyxcbiAgICBieXRlT2Zmc2V0SW5CdWZmZXJWaWV3LFxuICAgIGNvbXBvc2l0aW9uVHlwZSxcbiAgICBjb21wb25lbnRUeXBlLFxuICAgIGJ5dGVTdHJpZGUsXG4gICAgY291bnQsXG4gICAgcmF3LFxuICAgIG1heCxcbiAgICBtaW4sXG4gICAgYXJyYXlMZW5ndGgsXG4gICAgbm9ybWFsaXplZCxcbiAgfToge1xuICAgIGJ1ZmZlclZpZXc6IEJ1ZmZlclZpZXc7XG4gICAgYnl0ZU9mZnNldEluQnVmZmVyVmlldzogQnl0ZTtcbiAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZUVudW07XG4gICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZUVudW07XG4gICAgYnl0ZVN0cmlkZTogQnl0ZTtcbiAgICBjb3VudDogQ291bnQ7XG4gICAgcmF3OiBBcnJheUJ1ZmZlcjtcbiAgICBtYXg/OiBudW1iZXJbXTtcbiAgICBtaW4/OiBudW1iZXJbXTtcbiAgICBhcnJheUxlbmd0aDogU2l6ZTtcbiAgICBub3JtYWxpemVkOiBib29sZWFuO1xuICB9KSB7XG4gICAgdGhpcy5fX2J1ZmZlclZpZXcgPSBidWZmZXJWaWV3O1xuICAgIHRoaXMuX19ieXRlT2Zmc2V0SW5SYXdBcnJheUJ1ZmZlck9mQnVmZmVyID0gYnVmZmVyVmlldy5ieXRlT2Zmc2V0SW5SYXdBcnJheUJ1ZmZlck9mQnVmZmVyICsgYnl0ZU9mZnNldEluQnVmZmVyVmlldztcbiAgICB0aGlzLl9fY29tcG9zaXRpb25UeXBlID0gY29tcG9zaXRpb25UeXBlO1xuICAgIHRoaXMuX19jb21wb25lbnRUeXBlID0gY29tcG9uZW50VHlwZTtcbiAgICB0aGlzLl9fY291bnQgPSBjb3VudDtcbiAgICB0aGlzLl9fYXJyYXlMZW5ndGggPSBhcnJheUxlbmd0aDtcblxuICAgIGlmIChJcy5leGlzdChtYXgpKSB7XG4gICAgICB0aGlzLl9fbWF4LnNldENvbXBvbmVudHMoXG4gICAgICAgIG1heFswXSA/PyAtTnVtYmVyLk1BWF9WQUxVRSxcbiAgICAgICAgbWF4WzFdID8/IC1OdW1iZXIuTUFYX1ZBTFVFLFxuICAgICAgICBtYXhbMl0gPz8gLU51bWJlci5NQVhfVkFMVUUsXG4gICAgICAgIG1heFszXSA/PyAtTnVtYmVyLk1BWF9WQUxVRVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoSXMuZXhpc3QobWluKSkge1xuICAgICAgdGhpcy5fX21pbi5zZXRDb21wb25lbnRzKFxuICAgICAgICBtaW5bMF0gPz8gTnVtYmVyLk1BWF9WQUxVRSxcbiAgICAgICAgbWluWzFdID8/IE51bWJlci5NQVhfVkFMVUUsXG4gICAgICAgIG1pblsyXSA/PyBOdW1iZXIuTUFYX1ZBTFVFLFxuICAgICAgICBtaW5bM10gPz8gTnVtYmVyLk1BWF9WQUxVRVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoSXMuZXhpc3QobWF4KSAmJiBJcy5leGlzdChtaW4pKSB7XG4gICAgICB0aGlzLl9faXNNaW5NaXhEaXJ0eSA9IGZhbHNlO1xuICAgIH1cblxuICAgIHRoaXMuX19yYXcgPSByYXc7XG4gICAgdGhpcy5fX25vcm1hbGl6ZWQgPSBub3JtYWxpemVkO1xuXG4gICAgdGhpcy5fX2J5dGVTdHJpZGUgPSBieXRlU3RyaWRlO1xuXG4gICAgaWYgKHRoaXMuX19ieXRlU3RyaWRlID09PSAwKSB7XG4gICAgICB0aGlzLl9fYnl0ZVN0cmlkZSA9XG4gICAgICAgIHRoaXMuX19jb21wb3NpdGlvblR5cGUuZ2V0TnVtYmVyT2ZDb21wb25lbnRzKCkgKiB0aGlzLl9fY29tcG9uZW50VHlwZS5nZXRTaXplSW5CeXRlcygpICogdGhpcy5fX2FycmF5TGVuZ3RoO1xuICAgIH1cblxuICAgIGNvbnN0IHR5cGVkQXJyYXlDbGFzcyA9IHRoaXMuZ2V0VHlwZWRBcnJheUNsYXNzKHRoaXMuX19jb21wb25lbnRUeXBlKTtcbiAgICB0aGlzLl9fdHlwZWRBcnJheUNsYXNzID0gdHlwZWRBcnJheUNsYXNzO1xuXG4gICAgLy8vIENoZWNrXG4gICAgY29uc3QgbWF4RXhjZWVkZWRTaXplT25Bb1MgPVxuICAgICAgdGhpcy5fX2J5dGVTdHJpZGUgLSB0aGlzLl9fY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpICogdGhpcy5fX2NvbXBvbmVudFR5cGUuZ2V0U2l6ZUluQnl0ZXMoKTtcbiAgICBjb25zdCBzaXplRnJvbUFjY2Vzc29yQmVnaW5Ub0FycmF5QnVmZmVyRW5kID0gdGhpcy5fX3Jhdy5ieXRlTGVuZ3RoIC0gdGhpcy5fX2J5dGVPZmZzZXRJblJhd0FycmF5QnVmZmVyT2ZCdWZmZXI7XG4gICAgY29uc3QgbWF4TGltaXRTaXplVG9BY2Nlc3MgPSB0aGlzLmJ5dGVTdHJpZGUgKiB0aGlzLl9fY291bnQgLSBtYXhFeGNlZWRlZFNpemVPbkFvUztcbiAgICBpZiAoc2l6ZUZyb21BY2Nlc3NvckJlZ2luVG9BcnJheUJ1ZmZlckVuZCA8IG1heExpbWl0U2l6ZVRvQWNjZXNzKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcihcbiAgICAgICAgYFJlcXVlc3RpbmcgYSBkYXRhIHNpemUgdGhhdCBleGNlZWRzIHRoZSByZW1haW5pbmcgY2FwYWNpdHkgb2YgdGhlIGJ1ZmZlcjogJHt0aGlzLmJ1ZmZlclZpZXcuYnVmZmVyLm5hbWV9LlxuICAgICAgICBFeGNlZWRlZCBTaXplOiAke21heExpbWl0U2l6ZVRvQWNjZXNzIC0gc2l6ZUZyb21BY2Nlc3NvckJlZ2luVG9BcnJheUJ1ZmZlckVuZH1cbiAgICAgICAgdGhpcy5fX3Jhdy5ieXRlTGVuZ3RoOiAke3RoaXMuX19yYXcuYnl0ZUxlbmd0aH1cbiAgICAgICAgdGhpcy5fX2J5dGVPZmZzZXRJblJhd0FycmF5QnVmZmVyT2ZCdWZmZXI6ICR7dGhpcy5ieXRlT2Zmc2V0SW5SYXdBcnJheUJ1ZmZlck9mQnVmZmVyfVxuICAgICAgICB0aGlzLmJ5dGVTdHJpZGU6ICR7dGhpcy5ieXRlU3RyaWRlfVxuICAgICAgICB0aGlzLl9fY291bnQ6ICR7dGhpcy5fX2NvdW50fVxuICAgICAgICB0aGlzLl9fcmF3LmJ5dGVMZW5ndGggLSB0aGlzLl9fYnl0ZU9mZnNldEluUmF3QXJyYXlCdWZmZXJPZkJ1ZmZlcjogJHtcbiAgICAgICAgICB0aGlzLl9fcmF3LmJ5dGVMZW5ndGggLSB0aGlzLl9fYnl0ZU9mZnNldEluUmF3QXJyYXlCdWZmZXJPZkJ1ZmZlclxuICAgICAgICB9XG4gICAgICAgIHRoaXMuYnl0ZVN0cmlkZSAqIHRoaXMuX19jb3VudDogJHt0aGlzLmJ5dGVTdHJpZGUgKiB0aGlzLl9fY291bnR9XG4gICAgICAgIG1heEV4Y2VlZGVkU2l6ZU9uQW9TOiAke21heEV4Y2VlZGVkU2l6ZU9uQW9TfVxuICAgICAgICBgXG4gICAgICApO1xuICAgIH1cbiAgICB0aGlzLl9fZGF0YVZpZXcgPSBuZXcgRGF0YVZpZXcoXG4gICAgICB0aGlzLl9fcmF3LFxuICAgICAgdGhpcy5fX2J5dGVPZmZzZXRJblJhd0FycmF5QnVmZmVyT2ZCdWZmZXIsXG4gICAgICBNYXRoLm1pbih0aGlzLl9fYnl0ZVN0cmlkZSAqIHRoaXMuX19jb3VudCwgdGhpcy5fX3Jhdy5ieXRlTGVuZ3RoIC0gdGhpcy5fX2J5dGVPZmZzZXRJblJhd0FycmF5QnVmZmVyT2ZCdWZmZXIpXG4gICAgKTtcblxuICAgIGlmICh0aGlzLl9fYnl0ZU9mZnNldEluUmF3QXJyYXlCdWZmZXJPZkJ1ZmZlciAlIHR5cGVkQXJyYXlDbGFzcyEuQllURVNfUEVSX0VMRU1FTlQgPT09IDApIHtcbiAgICAgIHRoaXMuX190eXBlZEFycmF5ID0gbmV3IHR5cGVkQXJyYXlDbGFzcyEoXG4gICAgICAgIHRoaXMuX19yYXcsXG4gICAgICAgIHRoaXMuX19ieXRlT2Zmc2V0SW5SYXdBcnJheUJ1ZmZlck9mQnVmZmVyLFxuICAgICAgICB0aGlzLl9fY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpICogdGhpcy5fX2NvdW50XG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKGBUaGlzIEFjY2Vzc29yJ3MgYnl0ZU9mZnNldEluUmF3QXJyYXlCdWZmZXJPZkJ1ZmZlciBpcyBub3QgYWxpZ25lZCB3aXRoIHRoZSB0eXBlZEFycmF5Q2xhc3MncyBCWVRFU19QRVJfRUxFTUVOVC4gU28gd2UgbmVlZCB0byBjb3B5IHRoZSBidWZmZXIuXG5TbyB0aGUgdHlwZWRBcnJheSBkYXRhIGdvdCBieSBnZXRUeXBlZEFycmF5KCkgaXMgY29waWVkIGRhdGEsIG5vdCByZWZlcmVuY2UgdG8gdGhlIG9yaWdpbmFsIGJ1ZmZlci5cbmApO1xuICAgICAgdGhpcy5fX2NvcHlCdWZmZXJEYXRhVG9UeXBlZEFycmF5KCk7XG4gICAgfVxuICAgIHRoaXMuX19kYXRhVmlld0dldHRlciA9ICh0aGlzLl9fZGF0YVZpZXcgYXMgYW55KVt0aGlzLmdldERhdGFWaWV3R2V0dGVyKHRoaXMuX19jb21wb25lbnRUeXBlKSFdLmJpbmQoXG4gICAgICB0aGlzLl9fZGF0YVZpZXdcbiAgICApO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlciA9ICh0aGlzLl9fZGF0YVZpZXcgYXMgYW55KVt0aGlzLmdldERhdGFWaWV3U2V0dGVyKHRoaXMuX19jb21wb25lbnRUeXBlKSFdLmJpbmQoXG4gICAgICB0aGlzLl9fZGF0YVZpZXdcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIENvcGllcyBidWZmZXIgZGF0YSB0byBhIHR5cGVkIGFycmF5IHdoZW4gYnl0ZSBhbGlnbm1lbnQgZG9lc24ndCBtYXRjaC5cbiAgICogVGhpcyBpcyBuZWNlc3Nhcnkgd2hlbiB0aGUgYnVmZmVyIG9mZnNldCBpcyBub3QgYWxpZ25lZCB3aXRoIHRoZSB0eXBlZCBhcnJheSdzIEJZVEVTX1BFUl9FTEVNRU5ULlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2NvcHlCdWZmZXJEYXRhVG9UeXBlZEFycmF5KCkge1xuICAgIGNvbnN0IHR5cGVkQXJyYXlDbGFzcyA9IHRoaXMuZ2V0VHlwZWRBcnJheUNsYXNzKHRoaXMuX19jb21wb25lbnRUeXBlKTtcbiAgICBjb25zdCBjb3B5QnVmZmVyID0gdGhpcy5fX3Jhdy5zbGljZShcbiAgICAgIHRoaXMuX19ieXRlT2Zmc2V0SW5SYXdBcnJheUJ1ZmZlck9mQnVmZmVyLFxuICAgICAgdGhpcy5fX2J5dGVPZmZzZXRJblJhd0FycmF5QnVmZmVyT2ZCdWZmZXIgK1xuICAgICAgICB0aGlzLl9fY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpICogdGhpcy5fX2NvdW50ICogdHlwZWRBcnJheUNsYXNzIS5CWVRFU19QRVJfRUxFTUVOVFxuICAgICk7XG4gICAgdGhpcy5fX3R5cGVkQXJyYXkgPSBuZXcgdHlwZWRBcnJheUNsYXNzIShjb3B5QnVmZmVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgd2hlbiB0aGUgYWNjZXNzb3IgZGF0YSBpcyB1cGRhdGVkLiBJbmNyZW1lbnRzIHZlcnNpb24gYW5kIG5vdGlmaWVzIGFzc29jaWF0ZWQgcHJpbWl0aXZlcy5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX19vblVwZGF0ZWQoKSB7XG4gICAgdGhpcy5fX3ZlcnNpb24rKztcbiAgICBpZiAodGhpcy5fcHJpbWl0aXZlICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX3ByaW1pdGl2ZS5kZXJlZigpPy5vbkFjY2Vzc29yVXBkYXRlZCh0aGlzLl9fdmVyc2lvbik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGFwcHJvcHJpYXRlIFR5cGVkQXJyYXkgY29uc3RydWN0b3IgZm9yIHRoZSBnaXZlbiBjb21wb25lbnQgdHlwZS5cbiAgICogQHBhcmFtIGNvbXBvbmVudFR5cGUgLSBUaGUgY29tcG9uZW50IHR5cGUgdG8gZ2V0IHRoZSBjb25zdHJ1Y3RvciBmb3JcbiAgICogQHJldHVybnMgVGhlIFR5cGVkQXJyYXkgY29uc3RydWN0b3IgY2xhc3MsIG9yIHVuZGVmaW5lZCBpZiB1bmtub3duXG4gICAqL1xuICBnZXRUeXBlZEFycmF5Q2xhc3MoY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZUVudW0pOiBUeXBlZEFycmF5Q29uc3RydWN0b3IgfCB1bmRlZmluZWQge1xuICAgIHN3aXRjaCAoY29tcG9uZW50VHlwZSkge1xuICAgICAgY2FzZSBDb21wb25lbnRUeXBlLkJ5dGU6XG4gICAgICAgIHJldHVybiBJbnQ4QXJyYXk7XG4gICAgICBjYXNlIENvbXBvbmVudFR5cGUuVW5zaWduZWRCeXRlOlxuICAgICAgICByZXR1cm4gVWludDhBcnJheTtcbiAgICAgIGNhc2UgQ29tcG9uZW50VHlwZS5TaG9ydDpcbiAgICAgICAgcmV0dXJuIEludDE2QXJyYXk7XG4gICAgICBjYXNlIENvbXBvbmVudFR5cGUuVW5zaWduZWRTaG9ydDpcbiAgICAgICAgcmV0dXJuIFVpbnQxNkFycmF5O1xuICAgICAgY2FzZSBDb21wb25lbnRUeXBlLkludDpcbiAgICAgICAgcmV0dXJuIEludDMyQXJyYXk7XG4gICAgICBjYXNlIENvbXBvbmVudFR5cGUuVW5zaWduZWRJbnQ6XG4gICAgICAgIHJldHVybiBVaW50MzJBcnJheTtcbiAgICAgIGNhc2UgQ29tcG9uZW50VHlwZS5GbG9hdDpcbiAgICAgICAgcmV0dXJuIEZsb2F0MzJBcnJheTtcbiAgICAgIGNhc2UgQ29tcG9uZW50VHlwZS5Eb3VibGU6XG4gICAgICAgIHJldHVybiBGbG9hdDY0QXJyYXk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignVW5leHBlY3RlZCBDb21wb25lbnRUeXBlIScpO1xuICAgICAgICByZXR1cm4gdm9pZCAwO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBEYXRhVmlldyBnZXR0ZXIgbWV0aG9kIG5hbWUgZm9yIHRoZSBnaXZlbiBjb21wb25lbnQgdHlwZS5cbiAgICogQHBhcmFtIGNvbXBvbmVudFR5cGUgLSBUaGUgY29tcG9uZW50IHR5cGUgdG8gZ2V0IHRoZSBnZXR0ZXIgZm9yXG4gICAqIEByZXR1cm5zIFRoZSBEYXRhVmlldyBnZXR0ZXIgbWV0aG9kIG5hbWUsIG9yIHVuZGVmaW5lZCBpZiB1bmtub3duXG4gICAqL1xuICBnZXREYXRhVmlld0dldHRlcihjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlRW51bSk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgc3dpdGNoIChjb21wb25lbnRUeXBlKSB7XG4gICAgICBjYXNlIENvbXBvbmVudFR5cGUuQnl0ZTpcbiAgICAgICAgcmV0dXJuICdnZXRJbnQ4JztcbiAgICAgIGNhc2UgQ29tcG9uZW50VHlwZS5VbnNpZ25lZEJ5dGU6XG4gICAgICAgIHJldHVybiAnZ2V0VWludDgnO1xuICAgICAgY2FzZSBDb21wb25lbnRUeXBlLlNob3J0OlxuICAgICAgICByZXR1cm4gJ2dldEludDE2JztcbiAgICAgIGNhc2UgQ29tcG9uZW50VHlwZS5VbnNpZ25lZFNob3J0OlxuICAgICAgICByZXR1cm4gJ2dldFVpbnQxNic7XG4gICAgICBjYXNlIENvbXBvbmVudFR5cGUuSW50OlxuICAgICAgICByZXR1cm4gJ2dldEludDMyJztcbiAgICAgIGNhc2UgQ29tcG9uZW50VHlwZS5VbnNpZ25lZEludDpcbiAgICAgICAgcmV0dXJuICdnZXRVaW50MzInO1xuICAgICAgY2FzZSBDb21wb25lbnRUeXBlLkZsb2F0OlxuICAgICAgICByZXR1cm4gJ2dldEZsb2F0MzInO1xuICAgICAgY2FzZSBDb21wb25lbnRUeXBlLkRvdWJsZTpcbiAgICAgICAgcmV0dXJuICdnZXRGbG9hdDY0JztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdVbmV4cGVjdGVkIENvbXBvbmVudFR5cGUhJyk7XG4gICAgICAgIHJldHVybiAndW5rbm93bic7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIERhdGFWaWV3IHNldHRlciBtZXRob2QgbmFtZSBmb3IgdGhlIGdpdmVuIGNvbXBvbmVudCB0eXBlLlxuICAgKiBAcGFyYW0gY29tcG9uZW50VHlwZSAtIFRoZSBjb21wb25lbnQgdHlwZSB0byBnZXQgdGhlIHNldHRlciBmb3JcbiAgICogQHJldHVybnMgVGhlIERhdGFWaWV3IHNldHRlciBtZXRob2QgbmFtZSwgb3IgdW5kZWZpbmVkIGlmIHVua25vd25cbiAgICovXG4gIGdldERhdGFWaWV3U2V0dGVyKGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGVFbnVtKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBzd2l0Y2ggKGNvbXBvbmVudFR5cGUpIHtcbiAgICAgIGNhc2UgQ29tcG9uZW50VHlwZS5CeXRlOlxuICAgICAgICByZXR1cm4gJ3NldEludDgnO1xuICAgICAgY2FzZSBDb21wb25lbnRUeXBlLlVuc2lnbmVkQnl0ZTpcbiAgICAgICAgcmV0dXJuICdzZXRVaW50OCc7XG4gICAgICBjYXNlIENvbXBvbmVudFR5cGUuU2hvcnQ6XG4gICAgICAgIHJldHVybiAnc2V0SW50MTYnO1xuICAgICAgY2FzZSBDb21wb25lbnRUeXBlLlVuc2lnbmVkU2hvcnQ6XG4gICAgICAgIHJldHVybiAnc2V0VWludDE2JztcbiAgICAgIGNhc2UgQ29tcG9uZW50VHlwZS5JbnQ6XG4gICAgICAgIHJldHVybiAnc2V0SW50MzInO1xuICAgICAgY2FzZSBDb21wb25lbnRUeXBlLlVuc2lnbmVkSW50OlxuICAgICAgICByZXR1cm4gJ3NldFVpbnQzMic7XG4gICAgICBjYXNlIENvbXBvbmVudFR5cGUuRmxvYXQ6XG4gICAgICAgIHJldHVybiAnc2V0RmxvYXQzMic7XG4gICAgICBjYXNlIENvbXBvbmVudFR5cGUuRG91YmxlOlxuICAgICAgICByZXR1cm4gJ3NldEZsb2F0NjQnO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJ1VuZXhwZWN0ZWQgQ29tcG9uZW50VHlwZSEnKTtcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBvbmUgZWxlbWVudCBmcm9tIHRoZSBhY2Nlc3NvciBhbmQgcmV0dXJucyBhIFR5cGVkQXJyYXkgdmlldyBvZiBpdC5cbiAgICogVGhpcyBtZXRob2QgYWxsb2NhdGVzIGEgbmV3IHZpZXcgZm9yIHRoZSBuZXh0IGF2YWlsYWJsZSBlbGVtZW50LlxuICAgKiBAcmV0dXJucyBBIFR5cGVkQXJyYXkgdmlldyBvZiB0aGUgdGFrZW4gZWxlbWVudFxuICAgKiBAdGhyb3dzIEVycm9yIGlmIHRyeWluZyB0byBhbGxvY2F0ZSBtb3JlIGVsZW1lbnRzIHRoYW4gYXZhaWxhYmxlXG4gICAqL1xuICB0YWtlT25lKCk6IFR5cGVkQXJyYXkge1xuICAgIGNvbnN0IGFycmF5QnVmZmVyT2ZCdWZmZXJWaWV3ID0gdGhpcy5fX3JhdztcbiAgICAvLyBsZXQgc3RyaWRlID0gdGhpcy5fX2NvbXBvc2l0aW9uVHlwZS5nZXROdW1iZXJPZkNvbXBvbmVudHMoKSAqIHRoaXMuX19jb21wb25lbnRUeXBlLmdldFNpemVJbkJ5dGVzKCk7XG4gICAgLy8gaWYgKHRoaXMuX19idWZmZXJWaWV3LmlzQW9TKSB7XG4gICAgLy8gICBzdHJpZGUgPSB0aGlzLl9fYnVmZmVyVmlldy5ieXRlU3RyaWRlO1xuICAgIC8vIH1cblxuICAgIGlmICh0aGlzLl9fdGFrZW5Db3VudCA+PSB0aGlzLl9fY291bnQpIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdZb3UgYXJlIHRyeWluZyB0byBhbGxvY2F0ZSBtb3JlIHRoYW4geW91IGhhdmUgc2VjdXJlZC4nKTtcbiAgICB9XG4gICAgY29uc3Qgc3ViVHlwZWRBcnJheSA9IG5ldyB0aGlzLl9fdHlwZWRBcnJheUNsYXNzIShcbiAgICAgIGFycmF5QnVmZmVyT2ZCdWZmZXJWaWV3LFxuICAgICAgdGhpcy5fX2J5dGVPZmZzZXRJblJhd0FycmF5QnVmZmVyT2ZCdWZmZXIgKyB0aGlzLl9fYnl0ZVN0cmlkZSAqIHRoaXMuX190YWtlbkNvdW50LFxuICAgICAgdGhpcy5fX2NvbXBvc2l0aW9uVHlwZS5nZXROdW1iZXJPZkNvbXBvbmVudHMoKSAqIHRoaXMuX19hcnJheUxlbmd0aFxuICAgICk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmJ5dGVPZmZzZXRJblJhd0FycmF5QnVmZmVyT2ZCdWZmZXIsIHRoaXMuX19ieXRlU3RyaWRlLCB0aGlzLl9fdGFrZW5Db3VudCwgdGhpcy5fX2FycmF5TGVuZ3RoKTtcblxuICAgIChzdWJUeXBlZEFycmF5IGFzIGFueSkuX2FjY2Vzc29yID0gdGhpcztcbiAgICAoc3ViVHlwZWRBcnJheSBhcyBhbnkpLl9pZHhfb2ZfYWNjZXNzb3IgPSB0aGlzLl9fdGFrZW5Db3VudDtcblxuICAgIHRoaXMuX190YWtlbkNvdW50ICs9IDE7XG5cbiAgICByZXR1cm4gc3ViVHlwZWRBcnJheTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhbiBleGlzdGluZyBlbGVtZW50IGF0IHRoZSBzcGVjaWZpZWQgaW5kZXggYW5kIHJldHVybnMgYSBUeXBlZEFycmF5IHZpZXcgb2YgaXQuXG4gICAqIFRoaXMgbWV0aG9kIGNyZWF0ZXMgYSB2aWV3IGZvciBhbiBlbGVtZW50IHRoYXQgaGFzIGFscmVhZHkgYmVlbiBhbGxvY2F0ZWQuXG4gICAqIEBwYXJhbSBpZHggLSBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gdGFrZVxuICAgKiBAcmV0dXJucyBBIFR5cGVkQXJyYXkgdmlldyBvZiB0aGUgZWxlbWVudCBhdCB0aGUgc3BlY2lmaWVkIGluZGV4XG4gICAqIEB0aHJvd3MgRXJyb3IgaWYgdGhlIGluZGV4IGV4Y2VlZHMgdGhlIGF2YWlsYWJsZSBlbGVtZW50IGNvdW50XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfdGFrZUV4aXN0ZWRPbmUoaWR4OiBudW1iZXIpOiBUeXBlZEFycmF5IHtcbiAgICBjb25zdCBhcnJheUJ1ZmZlck9mQnVmZmVyVmlldyA9IHRoaXMuX19yYXc7XG5cbiAgICBpZiAoaWR4ID49IHRoaXMuX19jb3VudCkge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJ1lvdSBhcmUgdHJ5aW5nIHRvIGFsbG9jYXRlIG1vcmUgdGhhbiB5b3UgaGF2ZSBzZWN1cmVkLicpO1xuICAgIH1cbiAgICBjb25zdCBzdWJUeXBlZEFycmF5ID0gbmV3IHRoaXMuX190eXBlZEFycmF5Q2xhc3MhKFxuICAgICAgYXJyYXlCdWZmZXJPZkJ1ZmZlclZpZXcsXG4gICAgICB0aGlzLl9fYnl0ZU9mZnNldEluUmF3QXJyYXlCdWZmZXJPZkJ1ZmZlciArIHRoaXMuX19ieXRlU3RyaWRlICogaWR4LFxuICAgICAgdGhpcy5fX2NvbXBvc2l0aW9uVHlwZS5nZXROdW1iZXJPZkNvbXBvbmVudHMoKSAqIHRoaXMuX19hcnJheUxlbmd0aFxuICAgICk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmJ5dGVPZmZzZXRJblJhd0FycmF5QnVmZmVyT2ZCdWZmZXIsIHRoaXMuX19ieXRlU3RyaWRlLCB0aGlzLl9fdGFrZW5Db3VudCwgdGhpcy5fX2FycmF5TGVuZ3RoKTtcblxuICAgIChzdWJUeXBlZEFycmF5IGFzIGFueSkuX2FjY2Vzc29yID0gdGhpcztcbiAgICAoc3ViVHlwZWRBcnJheSBhcyBhbnkpLl9pZHhfb2ZfYWNjZXNzb3IgPSBpZHg7XG5cbiAgICByZXR1cm4gc3ViVHlwZWRBcnJheTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBoYXZlIGJlZW4gdGFrZW4gZnJvbSB0aGlzIGFjY2Vzc29yLlxuICAgKiBAcmV0dXJucyBUaGUgY291bnQgb2YgdGFrZW4gZWxlbWVudHNcbiAgICovXG4gIGdldCB0YWtlbkNvdW50KCk6IENvdW50IHtcbiAgICByZXR1cm4gdGhpcy5fX3Rha2VuQ291bnQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbnVtYmVyIG9mIGNvbXBvbmVudHMgcGVyIGVsZW1lbnQgKGUuZy4sIDMgZm9yIFZlYzMsIDQgZm9yIFZlYzQpLlxuICAgKiBAcmV0dXJucyBUaGUgbnVtYmVyIG9mIGNvbXBvbmVudHNcbiAgICovXG4gIGdldCBudW1iZXJPZkNvbXBvbmVudHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19jb21wb3NpdGlvblR5cGUuZ2V0TnVtYmVyT2ZDb21wb25lbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc2l6ZSBpbiBieXRlcyBvZiBlYWNoIGNvbXBvbmVudC5cbiAgICogQHJldHVybnMgVGhlIGNvbXBvbmVudCBzaXplIGluIGJ5dGVzXG4gICAqL1xuICBnZXQgY29tcG9uZW50U2l6ZUluQnl0ZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19jb21wb25lbnRUeXBlLmdldFNpemVJbkJ5dGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc2l6ZSBpbiBieXRlcyBvZiBlYWNoIGVsZW1lbnQgKG51bWJlck9mQ29tcG9uZW50cyAqIGNvbXBvbmVudFNpemVJbkJ5dGVzKS5cbiAgICogQHJldHVybnMgVGhlIGVsZW1lbnQgc2l6ZSBpbiBieXRlc1xuICAgKi9cbiAgZ2V0IGVsZW1lbnRTaXplSW5CeXRlcygpIHtcbiAgICByZXR1cm4gdGhpcy5udW1iZXJPZkNvbXBvbmVudHMgKiB0aGlzLmNvbXBvbmVudFNpemVJbkJ5dGVzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHRvdGFsIG51bWJlciBvZiBlbGVtZW50cyBpbiB0aGlzIGFjY2Vzc29yLlxuICAgKiBFYWNoIGVsZW1lbnQgbWF5IGJlIGEgc2NhbGFyLCB2ZWMyLCB2ZWMzLCB2ZWM0LCBtYXRyaXgsIGV0Yy5cbiAgICogQHJldHVybnMgVGhlIGVsZW1lbnQgY291bnRcbiAgICovXG4gIGdldCBlbGVtZW50Q291bnQoKTogQ291bnQge1xuICAgIHJldHVybiB0aGlzLl9fY291bnQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdG90YWwgYnl0ZSBsZW5ndGggb2YgYWxsIGRhdGEgaW4gdGhpcyBhY2Nlc3Nvci5cbiAgICogQHJldHVybnMgVGhlIGJ5dGUgbGVuZ3RoXG4gICAqL1xuICBnZXQgYnl0ZUxlbmd0aCgpOiBCeXRlIHtcbiAgICByZXR1cm4gdGhpcy5fX2J5dGVTdHJpZGUgKiB0aGlzLl9fY291bnQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY29tcG9uZW50IHR5cGUgb2YgdGhpcyBhY2Nlc3Nvci5cbiAgICogQHJldHVybnMgVGhlIGNvbXBvbmVudCB0eXBlIGVudW1cbiAgICovXG4gIGdldCBjb21wb25lbnRUeXBlKCk6IENvbXBvbmVudFR5cGVFbnVtIHtcbiAgICByZXR1cm4gdGhpcy5fX2NvbXBvbmVudFR5cGU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY29tcG9zaXRpb24gdHlwZSBvZiB0aGlzIGFjY2Vzc29yLlxuICAgKiBAcmV0dXJucyBUaGUgY29tcG9zaXRpb24gdHlwZSBlbnVtXG4gICAqL1xuICBnZXQgY29tcG9zaXRpb25UeXBlKCk6IENvbXBvc2l0aW9uVHlwZUVudW0ge1xuICAgIHJldHVybiB0aGlzLl9fY29tcG9zaXRpb25UeXBlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHVuZGVybHlpbmcgVHlwZWRBcnJheSBmb3IgdGhpcyBhY2Nlc3Nvci5cbiAgICogTm90ZTogSWYgdGhlIGJ1ZmZlciB2aWV3IHVzZXMgaW50ZXJsZWF2ZWQgZGF0YSAoQW9TKSwgZGlyZWN0IGFjY2VzcyBtYXkgbm90IHdvcmsgYXMgZXhwZWN0ZWQuXG4gICAqIEByZXR1cm5zIFRoZSBUeXBlZEFycmF5IGNvbnRhaW5pbmcgdGhlIGRhdGFcbiAgICovXG4gIGdldFR5cGVkQXJyYXkoKTogVHlwZWRBcnJheSB7XG4gICAgLy8gaWYgKHRoaXMuX19idWZmZXJWaWV3LmlzQW9TKSB7XG4gICAgLy8gICBjb25zb2xlLndhcm4oXG4gICAgLy8gICAgICdCZSBjYXJlZnVsLiB0aGlzIHJlZmVyZW5jZSBidWZmZXJWaWV3IGlzIEFvUyhBcnJheSBvbiBTdHJ1Y3R1cmUpLCBpdCBtZWFucyBJbnRlcmxlYXZlZCBEYXRhLiBTbyB5b3UgY2FuIG5vdCBhY2Nlc3MgeW91ciBkYXRhIHByb3Blcmx5IGJ5IHRoaXMgVHlwZWRBcnJheS4nXG4gICAgLy8gICApO1xuICAgIC8vIH1cbiAgICByZXR1cm4gdGhpcy5fX3R5cGVkQXJyYXk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZGF0YSBmcm9tIGEgVHlwZWRBcnJheSBpbnRvIHRoaXMgYWNjZXNzb3IuXG4gICAqIElmIHRoZSBwcm92aWRlZCBhcnJheSB1c2VzIHRoZSBzYW1lIGJ1ZmZlciwgbm8gY29weWluZyBpcyBuZWVkZWQuXG4gICAqIE90aGVyd2lzZSwgZGF0YSBpcyBjb3BpZWQgZWxlbWVudCBieSBlbGVtZW50IHdpdGggcHJvcGVyIHR5cGUgY29udmVyc2lvbi5cbiAgICogQHBhcmFtIHR5cGVkQXJyYXkgLSBUaGUgVHlwZWRBcnJheSB0byBjb3B5IGRhdGEgZnJvbVxuICAgKi9cbiAgc2V0VHlwZWRBcnJheSh0eXBlZEFycmF5OiBUeXBlZEFycmF5KSB7XG4gICAgaWYgKHR5cGVkQXJyYXkuYnVmZmVyID09PSB0aGlzLl9fcmF3KSB7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLl9fY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuU2NhbGFyKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fX2NvdW50OyBpKyspIHtcbiAgICAgICAgICB0aGlzLnNldFNjYWxhcihpLCB0eXBlZEFycmF5W2ldLCB7IGVuZGlhbjogdHJ1ZSB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0aGlzLl9fY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVmVjMikge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX19jb3VudDsgaSsrKSB7XG4gICAgICAgICAgdGhpcy5zZXRWZWMyKGksIHR5cGVkQXJyYXlbaSAqIDJdLCB0eXBlZEFycmF5W2kgKiAyICsgMV0sIHsgZW5kaWFuOiB0cnVlIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX19jb21wb3NpdGlvblR5cGUgPT09IENvbXBvc2l0aW9uVHlwZS5WZWMzKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fX2NvdW50OyBpKyspIHtcbiAgICAgICAgICB0aGlzLnNldFZlYzMoaSwgdHlwZWRBcnJheVtpICogM10sIHR5cGVkQXJyYXlbaSAqIDMgKyAxXSwgdHlwZWRBcnJheVtpICogMyArIDJdLCB7IGVuZGlhbjogdHJ1ZSB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0aGlzLl9fY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVmVjNCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX19jb3VudDsgaSsrKSB7XG4gICAgICAgICAgdGhpcy5zZXRWZWM0KGksIHR5cGVkQXJyYXlbaSAqIDRdLCB0eXBlZEFycmF5W2kgKiA0ICsgMV0sIHR5cGVkQXJyYXlbaSAqIDQgKyAyXSwgdHlwZWRBcnJheVtpICogNCArIDNdLCB7XG4gICAgICAgICAgICBlbmRpYW46IHRydWUsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fX2NvbXBvc2l0aW9uVHlwZSA9PT0gQ29tcG9zaXRpb25UeXBlLk1hdDMpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9fY291bnQ7IGkrKykge1xuICAgICAgICAgIHRoaXMuc2V0TWF0MyhcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICB0eXBlZEFycmF5W2kgKiA5XSxcbiAgICAgICAgICAgIHR5cGVkQXJyYXlbaSAqIDkgKyAxXSxcbiAgICAgICAgICAgIHR5cGVkQXJyYXlbaSAqIDkgKyAyXSxcbiAgICAgICAgICAgIHR5cGVkQXJyYXlbaSAqIDkgKyAzXSxcbiAgICAgICAgICAgIHR5cGVkQXJyYXlbaSAqIDkgKyA0XSxcbiAgICAgICAgICAgIHR5cGVkQXJyYXlbaSAqIDkgKyA1XSxcbiAgICAgICAgICAgIHR5cGVkQXJyYXlbaSAqIDkgKyA2XSxcbiAgICAgICAgICAgIHR5cGVkQXJyYXlbaSAqIDkgKyA3XSxcbiAgICAgICAgICAgIHR5cGVkQXJyYXlbaSAqIDkgKyA4XSxcbiAgICAgICAgICAgIHsgZW5kaWFuOiB0cnVlIH1cbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX19jb21wb3NpdGlvblR5cGUgPT09IENvbXBvc2l0aW9uVHlwZS5NYXQ0KSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fX2NvdW50OyBpKyspIHtcbiAgICAgICAgICB0aGlzLnNldE1hdDQoXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgdHlwZWRBcnJheVtpICogMTZdLFxuICAgICAgICAgICAgdHlwZWRBcnJheVtpICogMTYgKyAxXSxcbiAgICAgICAgICAgIHR5cGVkQXJyYXlbaSAqIDE2ICsgMl0sXG4gICAgICAgICAgICB0eXBlZEFycmF5W2kgKiAxNiArIDNdLFxuICAgICAgICAgICAgdHlwZWRBcnJheVtpICogMTYgKyA0XSxcbiAgICAgICAgICAgIHR5cGVkQXJyYXlbaSAqIDE2ICsgNV0sXG4gICAgICAgICAgICB0eXBlZEFycmF5W2kgKiAxNiArIDZdLFxuICAgICAgICAgICAgdHlwZWRBcnJheVtpICogMTYgKyA3XSxcbiAgICAgICAgICAgIHR5cGVkQXJyYXlbaSAqIDE2ICsgOF0sXG4gICAgICAgICAgICB0eXBlZEFycmF5W2kgKiAxNiArIDldLFxuICAgICAgICAgICAgdHlwZWRBcnJheVtpICogMTYgKyAxMF0sXG4gICAgICAgICAgICB0eXBlZEFycmF5W2kgKiAxNiArIDExXSxcbiAgICAgICAgICAgIHR5cGVkQXJyYXlbaSAqIDE2ICsgMTJdLFxuICAgICAgICAgICAgdHlwZWRBcnJheVtpICogMTYgKyAxM10sXG4gICAgICAgICAgICB0eXBlZEFycmF5W2kgKiAxNiArIDE0XSxcbiAgICAgICAgICAgIHR5cGVkQXJyYXlbaSAqIDE2ICsgMTVdLFxuICAgICAgICAgICAgeyBlbmRpYW46IHRydWUgfVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVW5leHBlY3RlZCBDb21wb3NpdGlvblR5cGUhJyk7XG4gICAgICB9XG4gICAgICB0aGlzLl9fY29weUJ1ZmZlckRhdGFUb1R5cGVkQXJyYXkoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIFVpbnQ4QXJyYXkgdmlldyBvZiB0aGlzIGFjY2Vzc29yJ3MgZGF0YS5cbiAgICogVXNlZnVsIGZvciByYXcgYnl0ZS1sZXZlbCBhY2Nlc3MgdG8gdGhlIGJ1ZmZlciBkYXRhLlxuICAgKiBAcmV0dXJucyBBIFVpbnQ4QXJyYXkgdmlldyBvZiB0aGUgYWNjZXNzb3IncyBkYXRhXG4gICAqL1xuICBnZXRVaW50OEFycmF5KCk6IFVpbnQ4QXJyYXkge1xuICAgIC8vIGlmICh0aGlzLl9fYnVmZmVyVmlldy5pc0FvUykge1xuICAgIC8vICAgY29uc29sZS53YXJuKFxuICAgIC8vICAgICAnQmUgY2FyZWZ1bC4gdGhpcyByZWZlcmVuY2UgYnVmZmVyVmlldyBpcyBBb1MoQXJyYXkgb24gU3RydWN0dXJlKSwgaXQgbWVhbnMgSW50ZXJsZWF2ZWQgRGF0YS4gU28geW91IGNhbiBub3QgYWNjZXNzIHlvdXIgZGF0YSBwcm9wZXJseSBieSB0aGlzIFR5cGVkQXJyYXkuJ1xuICAgIC8vICAgKTtcbiAgICAvLyB9XG4gICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KFxuICAgICAgdGhpcy5idWZmZXJWaWV3LmJ1ZmZlci5nZXRBcnJheUJ1ZmZlcigpLFxuICAgICAgdGhpcy5ieXRlT2Zmc2V0SW5SYXdBcnJheUJ1ZmZlck9mQnVmZmVyLFxuICAgICAgdGhpcy5ieXRlTGVuZ3RoXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBhY2Nlc3NvciB1c2VzIEFycmF5IG9mIFN0cnVjdHVyZXMgKEFvUykgbGF5b3V0LlxuICAgKiBBb1MgbWVhbnMgZGF0YSBpcyBpbnRlcmxlYXZlZCAoZS5nLiwgWFlaWFlaWFlaIGZvciBwb3NpdGlvbnMpLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHVzaW5nIEFvUyBsYXlvdXRcbiAgICovXG4gIGdldCBpc0FvUygpIHtcbiAgICByZXR1cm4gIXRoaXMuaXNTb0E7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgYWNjZXNzb3IgdXNlcyBTdHJ1Y3R1cmUgb2YgQXJyYXlzIChTb0EpIGxheW91dC5cbiAgICogU29BIG1lYW5zIGRhdGEgaXMgdGlnaHRseSBwYWNrZWQgKGUuZy4sIFhYWFlZWVpaWiBmb3IgcG9zaXRpb25zKS5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiB1c2luZyBTb0EgbGF5b3V0XG4gICAqL1xuICBnZXQgaXNTb0EoKSB7XG4gICAgY29uc3QgaXNTb0EgPVxuICAgICAgdGhpcy5ieXRlU3RyaWRlID09PSB0aGlzLl9fY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpICogdGhpcy5fX2NvbXBvbmVudFR5cGUuZ2V0U2l6ZUluQnl0ZXMoKTtcbiAgICByZXR1cm4gaXNTb0E7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgYnl0ZSBzdHJpZGUgYmV0d2VlbiBlbGVtZW50cy5cbiAgICogRm9yIHRpZ2h0bHkgcGFja2VkIGRhdGEsIHRoaXMgZXF1YWxzIGVsZW1lbnRTaXplSW5CeXRlcy5cbiAgICogRm9yIGludGVybGVhdmVkIGRhdGEsIHRoaXMgbWF5IGJlIGxhcmdlci5cbiAgICogQHJldHVybnMgVGhlIGJ5dGUgc3RyaWRlXG4gICAqL1xuICBnZXQgYnl0ZVN0cmlkZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2J5dGVTdHJpZGU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIHNjYWxhciB2YWx1ZSBhdCB0aGUgc3BlY2lmaWVkIGluZGV4LlxuICAgKiBAcGFyYW0gaSAtIFRoZSBlbGVtZW50IGluZGV4XG4gICAqIEBwYXJhbSBvcHRpb25zIC0gQWNjZXNzIG9wdGlvbnMgaW5jbHVkaW5nIGluZGljZXMgYWNjZXNzb3IgYW5kIGVuZGlhbm5lc3NcbiAgICogQHJldHVybnMgVGhlIHNjYWxhciB2YWx1ZVxuICAgKi9cbiAgZ2V0U2NhbGFyKGk6IEluZGV4LCB7IGluZGljZXNBY2Nlc3NvciwgZW5kaWFuID0gdHJ1ZSB9OiBJbmRpY2VzQWNjZXNzT3B0aW9uKTogbnVtYmVyIHtcbiAgICBsZXQgaW5kZXggPSBpO1xuICAgIGlmIChpbmRpY2VzQWNjZXNzb3IpIHtcbiAgICAgIGluZGV4ID0gaW5kaWNlc0FjY2Vzc29yLmdldFNjYWxhcihpLCB7fSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCwgZW5kaWFuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgc2NhbGFyIHZhbHVlIGF0IHRoZSBzcGVjaWZpZWQgaW5kZXggd2l0aCBhIGNvbXBvc2l0aW9uIG9mZnNldC5cbiAgICogQHBhcmFtIGkgLSBUaGUgZWxlbWVudCBpbmRleFxuICAgKiBAcGFyYW0gY29tcG9zaXRpb25PZmZzZXQgLSBCeXRlIG9mZnNldCB3aXRoaW4gdGhlIGVsZW1lbnRcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBBY2Nlc3Mgb3B0aW9ucyBpbmNsdWRpbmcgaW5kaWNlcyBhY2Nlc3NvciBhbmQgZW5kaWFubmVzc1xuICAgKiBAcmV0dXJucyBUaGUgc2NhbGFyIHZhbHVlXG4gICAqL1xuICBnZXRTY2FsYXJBdChpOiBJbmRleCwgY29tcG9zaXRpb25PZmZzZXQ6IEluZGV4LCB7IGluZGljZXNBY2Nlc3NvciwgZW5kaWFuID0gdHJ1ZSB9OiBJbmRpY2VzQWNjZXNzT3B0aW9uKTogbnVtYmVyIHtcbiAgICBsZXQgaW5kZXggPSBpO1xuICAgIGlmIChpbmRpY2VzQWNjZXNzb3IpIHtcbiAgICAgIGluZGV4ID0gaW5kaWNlc0FjY2Vzc29yLmdldFNjYWxhcihpLCB7fSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIGNvbXBvc2l0aW9uT2Zmc2V0LCBlbmRpYW4pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSAyRCB2ZWN0b3IgYXMgYW4gYXJyYXkgYXQgdGhlIHNwZWNpZmllZCBpbmRleC5cbiAgICogQHBhcmFtIGkgLSBUaGUgZWxlbWVudCBpbmRleFxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIEFjY2VzcyBvcHRpb25zIGluY2x1ZGluZyBpbmRpY2VzIGFjY2Vzc29yIGFuZCBlbmRpYW5uZXNzXG4gICAqIEByZXR1cm5zIEEgMi1lbGVtZW50IGFycmF5IGNvbnRhaW5pbmcgdGhlIHZlY3RvciBjb21wb25lbnRzXG4gICAqL1xuICBnZXRWZWMyQXNBcnJheShpOiBJbmRleCwgeyBpbmRpY2VzQWNjZXNzb3IsIGVuZGlhbiA9IHRydWUgfTogSW5kaWNlc0FjY2Vzc09wdGlvbik6IEFycmF5MjxudW1iZXI+IHtcbiAgICBsZXQgaW5kZXggPSBpO1xuICAgIGlmIChpbmRpY2VzQWNjZXNzb3IpIHtcbiAgICAgIGluZGV4ID0gaW5kaWNlc0FjY2Vzc29yLmdldFNjYWxhcihpLCB7fSk7XG4gICAgfVxuICAgIGNvbnN0IGJ5dGVTaXplID0gdGhpcy5jb21wb25lbnRTaXplSW5CeXRlcztcbiAgICByZXR1cm4gW1xuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXgsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDEgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICBdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSAzRCB2ZWN0b3IgYXMgYW4gYXJyYXkgYXQgdGhlIHNwZWNpZmllZCBpbmRleC5cbiAgICogQHBhcmFtIGkgLSBUaGUgZWxlbWVudCBpbmRleFxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIEFjY2VzcyBvcHRpb25zIGluY2x1ZGluZyBpbmRpY2VzIGFjY2Vzc29yIGFuZCBlbmRpYW5uZXNzXG4gICAqIEByZXR1cm5zIEEgMy1lbGVtZW50IGFycmF5IGNvbnRhaW5pbmcgdGhlIHZlY3RvciBjb21wb25lbnRzXG4gICAqL1xuICBnZXRWZWMzQXNBcnJheShpOiBJbmRleCwgeyBpbmRpY2VzQWNjZXNzb3IsIGVuZGlhbiA9IHRydWUgfTogSW5kaWNlc0FjY2Vzc09wdGlvbik6IEFycmF5MzxudW1iZXI+IHtcbiAgICBsZXQgaW5kZXggPSBpO1xuICAgIGlmIChpbmRpY2VzQWNjZXNzb3IpIHtcbiAgICAgIGluZGV4ID0gaW5kaWNlc0FjY2Vzc29yLmdldFNjYWxhcihpLCB7fSk7XG4gICAgfVxuICAgIGNvbnN0IGJ5dGVTaXplID0gdGhpcy5jb21wb25lbnRTaXplSW5CeXRlcztcbiAgICByZXR1cm4gW1xuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXgsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDEgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMiAqIGJ5dGVTaXplLCBlbmRpYW4pLFxuICAgIF07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIDREIHZlY3RvciBhcyBhbiBhcnJheSBhdCB0aGUgc3BlY2lmaWVkIGluZGV4LlxuICAgKiBAcGFyYW0gaSAtIFRoZSBlbGVtZW50IGluZGV4XG4gICAqIEBwYXJhbSBvcHRpb25zIC0gQWNjZXNzIG9wdGlvbnMgaW5jbHVkaW5nIGluZGljZXMgYWNjZXNzb3IgYW5kIGVuZGlhbm5lc3NcbiAgICogQHJldHVybnMgQSA0LWVsZW1lbnQgYXJyYXkgY29udGFpbmluZyB0aGUgdmVjdG9yIGNvbXBvbmVudHNcbiAgICovXG4gIGdldFZlYzRBc0FycmF5KGk6IEluZGV4LCB7IGluZGljZXNBY2Nlc3NvciwgZW5kaWFuID0gdHJ1ZSB9OiBJbmRpY2VzQWNjZXNzT3B0aW9uKTogQXJyYXk0PG51bWJlcj4ge1xuICAgIGxldCBpbmRleCA9IGk7XG4gICAgaWYgKGluZGljZXNBY2Nlc3Nvcikge1xuICAgICAgaW5kZXggPSBpbmRpY2VzQWNjZXNzb3IuZ2V0U2NhbGFyKGksIHt9KTtcbiAgICB9XG4gICAgY29uc3QgYnl0ZVNpemUgPSB0aGlzLmNvbXBvbmVudFNpemVJbkJ5dGVzO1xuICAgIHJldHVybiBbXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMSAqIGJ5dGVTaXplLCBlbmRpYW4pLFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyAyICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDMgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICBdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSAzeDMgbWF0cml4IGFzIGFuIGFycmF5IGF0IHRoZSBzcGVjaWZpZWQgaW5kZXguXG4gICAqIEBwYXJhbSBpIC0gVGhlIGVsZW1lbnQgaW5kZXhcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBBY2Nlc3Mgb3B0aW9ucyBpbmNsdWRpbmcgaW5kaWNlcyBhY2Nlc3NvciBhbmQgZW5kaWFubmVzc1xuICAgKiBAcmV0dXJucyBBIDktZWxlbWVudCBhcnJheSBjb250YWluaW5nIHRoZSBtYXRyaXggY29tcG9uZW50cyBpbiByb3ctbWFqb3Igb3JkZXJcbiAgICovXG4gIGdldE1hdDNBc0FycmF5KGk6IEluZGV4LCB7IGluZGljZXNBY2Nlc3NvciwgZW5kaWFuID0gdHJ1ZSB9OiBJbmRpY2VzQWNjZXNzT3B0aW9uKTogQXJyYXk8bnVtYmVyPiB7XG4gICAgbGV0IGluZGV4ID0gaTtcbiAgICBpZiAoaW5kaWNlc0FjY2Vzc29yKSB7XG4gICAgICBpbmRleCA9IGluZGljZXNBY2Nlc3Nvci5nZXRTY2FsYXIoaSwge30pO1xuICAgIH1cbiAgICBjb25zdCBieXRlU2l6ZSA9IHRoaXMuY29tcG9uZW50U2l6ZUluQnl0ZXM7XG4gICAgcmV0dXJuIFtcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4LCBlbmRpYW4pLFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyAxICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDIgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMyAqIGJ5dGVTaXplLCBlbmRpYW4pLFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyA0ICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDUgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgNiAqIGJ5dGVTaXplLCBlbmRpYW4pLFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyA3ICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDggKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICBdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSA0eDQgbWF0cml4IGFzIGFuIGFycmF5IGF0IHRoZSBzcGVjaWZpZWQgaW5kZXguXG4gICAqIEBwYXJhbSBpIC0gVGhlIGVsZW1lbnQgaW5kZXhcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBBY2Nlc3Mgb3B0aW9ucyBpbmNsdWRpbmcgaW5kaWNlcyBhY2Nlc3NvciBhbmQgZW5kaWFubmVzc1xuICAgKiBAcmV0dXJucyBBIDE2LWVsZW1lbnQgYXJyYXkgY29udGFpbmluZyB0aGUgbWF0cml4IGNvbXBvbmVudHMgaW4gcm93LW1ham9yIG9yZGVyXG4gICAqL1xuICBnZXRNYXQ0QXNBcnJheShpOiBJbmRleCwgeyBpbmRpY2VzQWNjZXNzb3IsIGVuZGlhbiA9IHRydWUgfTogSW5kaWNlc0FjY2Vzc09wdGlvbik6IEFycmF5PG51bWJlcj4ge1xuICAgIGxldCBpbmRleCA9IGk7XG4gICAgaWYgKGluZGljZXNBY2Nlc3Nvcikge1xuICAgICAgaW5kZXggPSBpbmRpY2VzQWNjZXNzb3IuZ2V0U2NhbGFyKGksIHt9KTtcbiAgICB9XG4gICAgY29uc3QgYnl0ZVNpemUgPSB0aGlzLmNvbXBvbmVudFNpemVJbkJ5dGVzO1xuICAgIHJldHVybiBbXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMSAqIGJ5dGVTaXplLCBlbmRpYW4pLFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyAyICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDMgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgNCAqIGJ5dGVTaXplLCBlbmRpYW4pLFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyA1ICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDYgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgNyAqIGJ5dGVTaXplLCBlbmRpYW4pLFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyA4ICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDkgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMTAgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMTEgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMTIgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMTMgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMTQgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMTUgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICBdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSAyRCB2ZWN0b3Igb2JqZWN0IGF0IHRoZSBzcGVjaWZpZWQgaW5kZXguXG4gICAqIEBwYXJhbSBpIC0gVGhlIGVsZW1lbnQgaW5kZXhcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBBY2Nlc3Mgb3B0aW9ucyBpbmNsdWRpbmcgaW5kaWNlcyBhY2Nlc3NvciBhbmQgZW5kaWFubmVzc1xuICAgKiBAcmV0dXJucyBBIFZlY3RvcjIgb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHZlY3RvciBjb21wb25lbnRzXG4gICAqL1xuICBnZXRWZWMyKGk6IEluZGV4LCB7IGluZGljZXNBY2Nlc3NvciwgZW5kaWFuID0gdHJ1ZSB9OiBJbmRpY2VzQWNjZXNzT3B0aW9uKTogVmVjdG9yMiB7XG4gICAgbGV0IGluZGV4ID0gaTtcbiAgICBpZiAoaW5kaWNlc0FjY2Vzc29yKSB7XG4gICAgICBpbmRleCA9IGluZGljZXNBY2Nlc3Nvci5nZXRTY2FsYXIoaSwge30pO1xuICAgIH1cbiAgICBjb25zdCBieXRlU2l6ZSA9IHRoaXMuY29tcG9uZW50U2l6ZUluQnl0ZXM7XG4gICAgcmV0dXJuIFZlY3RvcjIuZnJvbUNvcHlBcnJheTIoW1xuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXgsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDEgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICBdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgM0QgdmVjdG9yIG9iamVjdCBhdCB0aGUgc3BlY2lmaWVkIGluZGV4LlxuICAgKiBAcGFyYW0gaSAtIFRoZSBlbGVtZW50IGluZGV4XG4gICAqIEBwYXJhbSBvcHRpb25zIC0gQWNjZXNzIG9wdGlvbnMgaW5jbHVkaW5nIGluZGljZXMgYWNjZXNzb3IgYW5kIGVuZGlhbm5lc3NcbiAgICogQHJldHVybnMgQSBWZWN0b3IzIG9iamVjdCBjb250YWluaW5nIHRoZSB2ZWN0b3IgY29tcG9uZW50c1xuICAgKi9cbiAgZ2V0VmVjMyhpOiBJbmRleCwgeyBpbmRpY2VzQWNjZXNzb3IsIGVuZGlhbiA9IHRydWUgfTogSW5kaWNlc0FjY2Vzc09wdGlvbik6IFZlY3RvcjMge1xuICAgIGxldCBpbmRleCA9IGk7XG4gICAgaWYgKGluZGljZXNBY2Nlc3Nvcikge1xuICAgICAgaW5kZXggPSBpbmRpY2VzQWNjZXNzb3IuZ2V0U2NhbGFyKGksIHt9KTtcbiAgICB9XG4gICAgY29uc3QgYnl0ZVNpemUgPSB0aGlzLmNvbXBvbmVudFNpemVJbkJ5dGVzO1xuICAgIHJldHVybiBWZWN0b3IzLmZyb21Db3B5QXJyYXkoW1xuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXgsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDEgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMiAqIGJ5dGVTaXplLCBlbmRpYW4pLFxuICAgIF0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSA0RCB2ZWN0b3Igb2JqZWN0IGF0IHRoZSBzcGVjaWZpZWQgaW5kZXguXG4gICAqIEBwYXJhbSBpIC0gVGhlIGVsZW1lbnQgaW5kZXhcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBBY2Nlc3Mgb3B0aW9ucyBpbmNsdWRpbmcgaW5kaWNlcyBhY2Nlc3NvciBhbmQgZW5kaWFubmVzc1xuICAgKiBAcmV0dXJucyBBIFZlY3RvcjQgb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHZlY3RvciBjb21wb25lbnRzXG4gICAqL1xuICBnZXRWZWM0KGk6IEluZGV4LCB7IGluZGljZXNBY2Nlc3NvciwgZW5kaWFuID0gdHJ1ZSB9OiBJbmRpY2VzQWNjZXNzT3B0aW9uKTogVmVjdG9yNCB7XG4gICAgbGV0IGluZGV4ID0gaTtcbiAgICBpZiAoaW5kaWNlc0FjY2Vzc29yKSB7XG4gICAgICBpbmRleCA9IGluZGljZXNBY2Nlc3Nvci5nZXRTY2FsYXIoaSwge30pO1xuICAgIH1cbiAgICBjb25zdCBieXRlU2l6ZSA9IHRoaXMuY29tcG9uZW50U2l6ZUluQnl0ZXM7XG4gICAgcmV0dXJuIFZlY3RvcjQuZnJvbUNvcHlBcnJheShbXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMSAqIGJ5dGVTaXplLCBlbmRpYW4pLFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyAyICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDMgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICBdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgM3gzIG1hdHJpeCBvYmplY3QgYXQgdGhlIHNwZWNpZmllZCBpbmRleC5cbiAgICogQHBhcmFtIGkgLSBUaGUgZWxlbWVudCBpbmRleFxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIEFjY2VzcyBvcHRpb25zIGluY2x1ZGluZyBpbmRpY2VzIGFjY2Vzc29yIGFuZCBlbmRpYW5uZXNzXG4gICAqIEByZXR1cm5zIEEgTWF0cml4MzMgb2JqZWN0IGNvbnRhaW5pbmcgdGhlIG1hdHJpeCBjb21wb25lbnRzXG4gICAqL1xuICBnZXRNYXQzKGk6IEluZGV4LCB7IGluZGljZXNBY2Nlc3NvciwgZW5kaWFuID0gdHJ1ZSB9OiBJbmRpY2VzQWNjZXNzT3B0aW9uKTogTWF0cml4MzMge1xuICAgIGxldCBpbmRleCA9IGk7XG4gICAgaWYgKGluZGljZXNBY2Nlc3Nvcikge1xuICAgICAgaW5kZXggPSBpbmRpY2VzQWNjZXNzb3IuZ2V0U2NhbGFyKGksIHt9KTtcbiAgICB9XG4gICAgY29uc3QgYnl0ZVNpemUgPSB0aGlzLmNvbXBvbmVudFNpemVJbkJ5dGVzO1xuICAgIHJldHVybiBNYXRyaXgzMy5mcm9tQ29weTlSb3dNYWpvcihcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4LCBlbmRpYW4pLFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyAxICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDIgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMyAqIGJ5dGVTaXplLCBlbmRpYW4pLFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyA0ICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDUgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgNiAqIGJ5dGVTaXplLCBlbmRpYW4pLFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyA3ICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDggKiBieXRlU2l6ZSwgZW5kaWFuKVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIDR4NCBtYXRyaXggb2JqZWN0IGF0IHRoZSBzcGVjaWZpZWQgaW5kZXguXG4gICAqIEBwYXJhbSBpIC0gVGhlIGVsZW1lbnQgaW5kZXhcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBBY2Nlc3Mgb3B0aW9ucyBpbmNsdWRpbmcgaW5kaWNlcyBhY2Nlc3NvciBhbmQgZW5kaWFubmVzc1xuICAgKiBAcmV0dXJucyBBIE11dGFibGVNYXRyaXg0NCBvYmplY3QgY29udGFpbmluZyB0aGUgbWF0cml4IGNvbXBvbmVudHNcbiAgICovXG4gIGdldE1hdDQoaTogSW5kZXgsIHsgaW5kaWNlc0FjY2Vzc29yLCBlbmRpYW4gPSB0cnVlIH06IEluZGljZXNBY2Nlc3NPcHRpb24pOiBNdXRhYmxlTWF0cml4NDQge1xuICAgIGxldCBpbmRleCA9IGk7XG4gICAgaWYgKGluZGljZXNBY2Nlc3Nvcikge1xuICAgICAgaW5kZXggPSBpbmRpY2VzQWNjZXNzb3IuZ2V0U2NhbGFyKGksIHt9KTtcbiAgICB9XG4gICAgY29uc3QgYnl0ZVNpemUgPSB0aGlzLmNvbXBvbmVudFNpemVJbkJ5dGVzO1xuICAgIHJldHVybiBNdXRhYmxlTWF0cml4NDQuZnJvbUNvcHkxNlJvd01ham9yKFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXgsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDEgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMiAqIGJ5dGVTaXplLCBlbmRpYW4pLFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyAzICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDQgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgNSAqIGJ5dGVTaXplLCBlbmRpYW4pLFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyA2ICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDcgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgOCAqIGJ5dGVTaXplLCBlbmRpYW4pLFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyA5ICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDEwICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDExICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDEyICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDEzICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDE0ICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDE1ICogYnl0ZVNpemUsIGVuZGlhbilcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSAyRCB2ZWN0b3IgYXQgdGhlIHNwZWNpZmllZCBpbmRleCBhbmQgc3RvcmVzIGl0IGluIHRoZSBwcm92aWRlZCBvdXRwdXQgb2JqZWN0LlxuICAgKiBUaGlzIG1ldGhvZCBhdm9pZHMgY3JlYXRpbmcgbmV3IG9iamVjdHMgYW5kIGlzIG1vcmUgbWVtb3J5LWVmZmljaWVudC5cbiAgICogQHBhcmFtIGkgLSBUaGUgZWxlbWVudCBpbmRleFxuICAgKiBAcGFyYW0gb3V0IC0gVGhlIG91dHB1dCBNdXRhYmxlVmVjdG9yMiBvYmplY3QgdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIEFjY2VzcyBvcHRpb25zIGluY2x1ZGluZyBpbmRpY2VzIGFjY2Vzc29yIGFuZCBlbmRpYW5uZXNzXG4gICAqIEByZXR1cm5zIFRoZSBvdXRwdXQgVmVjdG9yMiBvYmplY3QgKHNhbWUgYXMgdGhlIG91dCBwYXJhbWV0ZXIpXG4gICAqL1xuICBnZXRWZWMyVG8oaTogSW5kZXgsIG91dDogTXV0YWJsZVZlY3RvcjIsIHsgaW5kaWNlc0FjY2Vzc29yLCBlbmRpYW4gPSB0cnVlIH06IEluZGljZXNBY2Nlc3NPcHRpb24pOiBWZWN0b3IyIHtcbiAgICBsZXQgaW5kZXggPSBpO1xuICAgIGlmIChpbmRpY2VzQWNjZXNzb3IpIHtcbiAgICAgIGluZGV4ID0gaW5kaWNlc0FjY2Vzc29yLmdldFNjYWxhcihpLCB7fSk7XG4gICAgfVxuICAgIGNvbnN0IGJ5dGVTaXplID0gdGhpcy5jb21wb25lbnRTaXplSW5CeXRlcztcbiAgICByZXR1cm4gb3V0LnNldENvbXBvbmVudHMoXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMSAqIGJ5dGVTaXplLCBlbmRpYW4pXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgM0QgdmVjdG9yIGF0IHRoZSBzcGVjaWZpZWQgaW5kZXggYW5kIHN0b3JlcyBpdCBpbiB0aGUgcHJvdmlkZWQgb3V0cHV0IG9iamVjdC5cbiAgICogVGhpcyBtZXRob2QgYXZvaWRzIGNyZWF0aW5nIG5ldyBvYmplY3RzIGFuZCBpcyBtb3JlIG1lbW9yeS1lZmZpY2llbnQuXG4gICAqIEBwYXJhbSBpIC0gVGhlIGVsZW1lbnQgaW5kZXhcbiAgICogQHBhcmFtIG91dCAtIFRoZSBvdXRwdXQgTXV0YWJsZVZlY3RvcjMgb2JqZWN0IHRvIHN0b3JlIHRoZSByZXN1bHRcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBBY2Nlc3Mgb3B0aW9ucyBpbmNsdWRpbmcgaW5kaWNlcyBhY2Nlc3NvciBhbmQgZW5kaWFubmVzc1xuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IFZlY3RvcjMgb2JqZWN0IChzYW1lIGFzIHRoZSBvdXQgcGFyYW1ldGVyKVxuICAgKi9cbiAgZ2V0VmVjM1RvKGk6IEluZGV4LCBvdXQ6IE11dGFibGVWZWN0b3IzLCB7IGluZGljZXNBY2Nlc3NvciwgZW5kaWFuID0gdHJ1ZSB9OiBJbmRpY2VzQWNjZXNzT3B0aW9uKTogVmVjdG9yMyB7XG4gICAgbGV0IGluZGV4ID0gaTtcbiAgICBpZiAoaW5kaWNlc0FjY2Vzc29yKSB7XG4gICAgICBpbmRleCA9IGluZGljZXNBY2Nlc3Nvci5nZXRTY2FsYXIoaSwge30pO1xuICAgIH1cbiAgICBjb25zdCBieXRlU2l6ZSA9IHRoaXMuY29tcG9uZW50U2l6ZUluQnl0ZXM7XG4gICAgcmV0dXJuIG91dC5zZXRDb21wb25lbnRzKFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXgsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDEgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMiAqIGJ5dGVTaXplLCBlbmRpYW4pXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgNEQgdmVjdG9yIGF0IHRoZSBzcGVjaWZpZWQgaW5kZXggYW5kIHN0b3JlcyBpdCBpbiB0aGUgcHJvdmlkZWQgb3V0cHV0IG9iamVjdC5cbiAgICogVGhpcyBtZXRob2QgYXZvaWRzIGNyZWF0aW5nIG5ldyBvYmplY3RzIGFuZCBpcyBtb3JlIG1lbW9yeS1lZmZpY2llbnQuXG4gICAqIEBwYXJhbSBpIC0gVGhlIGVsZW1lbnQgaW5kZXhcbiAgICogQHBhcmFtIG91dCAtIFRoZSBvdXRwdXQgTXV0YWJsZVZlY3RvcjQgb2JqZWN0IHRvIHN0b3JlIHRoZSByZXN1bHRcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBBY2Nlc3Mgb3B0aW9ucyBpbmNsdWRpbmcgaW5kaWNlcyBhY2Nlc3NvciBhbmQgZW5kaWFubmVzc1xuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IFZlY3RvcjQgb2JqZWN0IChzYW1lIGFzIHRoZSBvdXQgcGFyYW1ldGVyKVxuICAgKi9cbiAgZ2V0VmVjNFRvKGk6IEluZGV4LCBvdXQ6IE11dGFibGVWZWN0b3I0LCB7IGluZGljZXNBY2Nlc3NvciwgZW5kaWFuID0gdHJ1ZSB9OiBJbmRpY2VzQWNjZXNzT3B0aW9uKTogVmVjdG9yNCB7XG4gICAgbGV0IGluZGV4ID0gaTtcbiAgICBpZiAoaW5kaWNlc0FjY2Vzc29yKSB7XG4gICAgICBpbmRleCA9IGluZGljZXNBY2Nlc3Nvci5nZXRTY2FsYXIoaSwge30pO1xuICAgIH1cbiAgICBjb25zdCBieXRlU2l6ZSA9IHRoaXMuY29tcG9uZW50U2l6ZUluQnl0ZXM7XG4gICAgcmV0dXJuIG91dC5zZXRDb21wb25lbnRzKFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXgsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDEgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMiAqIGJ5dGVTaXplLCBlbmRpYW4pLFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyAzICogYnl0ZVNpemUsIGVuZGlhbilcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSAzeDMgbWF0cml4IGF0IHRoZSBzcGVjaWZpZWQgaW5kZXggYW5kIHN0b3JlcyBpdCBpbiB0aGUgcHJvdmlkZWQgb3V0cHV0IG9iamVjdC5cbiAgICogVGhpcyBtZXRob2QgYXZvaWRzIGNyZWF0aW5nIG5ldyBvYmplY3RzIGFuZCBpcyBtb3JlIG1lbW9yeS1lZmZpY2llbnQuXG4gICAqIEBwYXJhbSBpIC0gVGhlIGVsZW1lbnQgaW5kZXhcbiAgICogQHBhcmFtIG91dCAtIFRoZSBvdXRwdXQgTXV0YWJsZU1hdHJpeDMzIG9iamVjdCB0byBzdG9yZSB0aGUgcmVzdWx0XG4gICAqIEBwYXJhbSBvcHRpb25zIC0gQWNjZXNzIG9wdGlvbnMgaW5jbHVkaW5nIGluZGljZXMgYWNjZXNzb3IgYW5kIGVuZGlhbm5lc3NcbiAgICogQHJldHVybnMgVGhlIG91dHB1dCBNYXRyaXgzMyBvYmplY3QgKHNhbWUgYXMgdGhlIG91dCBwYXJhbWV0ZXIpXG4gICAqL1xuICBnZXRNYXQzVG8oXG4gICAgaTogSW5kZXgsXG4gICAgb3V0OiBNdXRhYmxlTWF0cml4MzMsXG4gICAgeyBpbmRpY2VzQWNjZXNzb3IsIGVuZGlhbiA9IHRydWUgfTogeyBpbmRpY2VzQWNjZXNzb3I/OiBBY2Nlc3NvciB8IHVuZGVmaW5lZDsgZW5kaWFuPzogYm9vbGVhbiB9XG4gICk6IE1hdHJpeDMzIHtcbiAgICBsZXQgaW5kZXggPSBpO1xuICAgIGlmIChpbmRpY2VzQWNjZXNzb3IpIHtcbiAgICAgIGluZGV4ID0gaW5kaWNlc0FjY2Vzc29yLmdldFNjYWxhcihpLCB7fSk7XG4gICAgfVxuICAgIGNvbnN0IGJ5dGVTaXplID0gdGhpcy5jb21wb25lbnRTaXplSW5CeXRlcztcbiAgICByZXR1cm4gb3V0LnNldENvbXBvbmVudHMoXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMSAqIGJ5dGVTaXplLCBlbmRpYW4pLFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyAyICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDMgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgNCAqIGJ5dGVTaXplLCBlbmRpYW4pLFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyA1ICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDYgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgNyAqIGJ5dGVTaXplLCBlbmRpYW4pLFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyA4ICogYnl0ZVNpemUsIGVuZGlhbilcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSA0eDQgbWF0cml4IGF0IHRoZSBzcGVjaWZpZWQgaW5kZXggYW5kIHN0b3JlcyBpdCBpbiB0aGUgcHJvdmlkZWQgb3V0cHV0IG9iamVjdC5cbiAgICogVGhpcyBtZXRob2QgYXZvaWRzIGNyZWF0aW5nIG5ldyBvYmplY3RzIGFuZCBpcyBtb3JlIG1lbW9yeS1lZmZpY2llbnQuXG4gICAqIEBwYXJhbSBpIC0gVGhlIGVsZW1lbnQgaW5kZXhcbiAgICogQHBhcmFtIG91dCAtIFRoZSBvdXRwdXQgTXV0YWJsZU1hdHJpeDQ0IG9iamVjdCB0byBzdG9yZSB0aGUgcmVzdWx0XG4gICAqIEBwYXJhbSBvcHRpb25zIC0gQWNjZXNzIG9wdGlvbnMgaW5jbHVkaW5nIGluZGljZXMgYWNjZXNzb3IgYW5kIGVuZGlhbm5lc3NcbiAgICogQHJldHVybnMgVGhlIG91dHB1dCBNdXRhYmxlTWF0cml4NDQgb2JqZWN0IChzYW1lIGFzIHRoZSBvdXQgcGFyYW1ldGVyKVxuICAgKi9cbiAgZ2V0TWF0NFRvKGk6IEluZGV4LCBvdXQ6IE11dGFibGVNYXRyaXg0NCwgeyBpbmRpY2VzQWNjZXNzb3IsIGVuZGlhbiA9IHRydWUgfTogSW5kaWNlc0FjY2Vzc09wdGlvbik6IE11dGFibGVNYXRyaXg0NCB7XG4gICAgbGV0IGluZGV4ID0gaTtcbiAgICBpZiAoaW5kaWNlc0FjY2Vzc29yKSB7XG4gICAgICBpbmRleCA9IGluZGljZXNBY2Nlc3Nvci5nZXRTY2FsYXIoaSwge30pO1xuICAgIH1cbiAgICBjb25zdCBieXRlU2l6ZSA9IHRoaXMuY29tcG9uZW50U2l6ZUluQnl0ZXM7XG4gICAgcmV0dXJuIG91dC5zZXRDb21wb25lbnRzKFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXgsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDEgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMiAqIGJ5dGVTaXplLCBlbmRpYW4pLFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyAzICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDQgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgNSAqIGJ5dGVTaXplLCBlbmRpYW4pLFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyA2ICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDcgKiBieXRlU2l6ZSwgZW5kaWFuKSxcbiAgICAgIHRoaXMuX19kYXRhVmlld0dldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgOCAqIGJ5dGVTaXplLCBlbmRpYW4pLFxuICAgICAgdGhpcy5fX2RhdGFWaWV3R2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyA5ICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDEwICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDExICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDEyICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDEzICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDE0ICogYnl0ZVNpemUsIGVuZGlhbiksXG4gICAgICB0aGlzLl9fZGF0YVZpZXdHZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDE1ICogYnl0ZVNpemUsIGVuZGlhbilcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSBzY2FsYXIgdmFsdWUgYXQgdGhlIHNwZWNpZmllZCBpbmRleC5cbiAgICogQHBhcmFtIGkgLSBUaGUgZWxlbWVudCBpbmRleFxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIHNldFxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIEFjY2VzcyBvcHRpb25zIGluY2x1ZGluZyBpbmRpY2VzIGFjY2Vzc29yIGFuZCBlbmRpYW5uZXNzXG4gICAqL1xuICBzZXRTY2FsYXIoaTogSW5kZXgsIHZhbHVlOiBudW1iZXIsIHsgaW5kaWNlc0FjY2Vzc29yLCBlbmRpYW4gPSB0cnVlIH06IEluZGljZXNBY2Nlc3NPcHRpb24pIHtcbiAgICBsZXQgaW5kZXggPSBpO1xuICAgIGlmIChpbmRpY2VzQWNjZXNzb3IpIHtcbiAgICAgIGluZGV4ID0gaW5kaWNlc0FjY2Vzc29yLmdldFNjYWxhcihpLCB7fSk7XG4gICAgfVxuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4LCB2YWx1ZSwgZW5kaWFuKTtcbiAgICB0aGlzLl9faXNNaW5NaXhEaXJ0eSA9IHRydWU7XG4gICAgdGhpcy5fX29uVXBkYXRlZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSAyRCB2ZWN0b3IgYXQgdGhlIHNwZWNpZmllZCBpbmRleC5cbiAgICogQHBhcmFtIGkgLSBUaGUgZWxlbWVudCBpbmRleFxuICAgKiBAcGFyYW0geCAtIFRoZSBYIGNvbXBvbmVudCB2YWx1ZVxuICAgKiBAcGFyYW0geSAtIFRoZSBZIGNvbXBvbmVudCB2YWx1ZVxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIEFjY2VzcyBvcHRpb25zIGluY2x1ZGluZyBpbmRpY2VzIGFjY2Vzc29yIGFuZCBlbmRpYW5uZXNzXG4gICAqL1xuICBzZXRWZWMyKGk6IEluZGV4LCB4OiBudW1iZXIsIHk6IG51bWJlciwgeyBpbmRpY2VzQWNjZXNzb3IsIGVuZGlhbiA9IHRydWUgfTogSW5kaWNlc0FjY2Vzc09wdGlvbikge1xuICAgIGxldCBpbmRleCA9IGk7XG4gICAgaWYgKGluZGljZXNBY2Nlc3Nvcikge1xuICAgICAgaW5kZXggPSBpbmRpY2VzQWNjZXNzb3IuZ2V0U2NhbGFyKGksIHt9KTtcbiAgICB9XG4gICAgY29uc3Qgc2l6ZUluQnl0ZXMgPSB0aGlzLmNvbXBvbmVudFNpemVJbkJ5dGVzO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4LCB4LCBlbmRpYW4pO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMSAqIHNpemVJbkJ5dGVzLCB5LCBlbmRpYW4pO1xuICAgIHRoaXMuX19pc01pbk1peERpcnR5ID0gdHJ1ZTtcbiAgICB0aGlzLl9fb25VcGRhdGVkKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIDNEIHZlY3RvciBhdCB0aGUgc3BlY2lmaWVkIGluZGV4LlxuICAgKiBAcGFyYW0gaSAtIFRoZSBlbGVtZW50IGluZGV4XG4gICAqIEBwYXJhbSB4IC0gVGhlIFggY29tcG9uZW50IHZhbHVlXG4gICAqIEBwYXJhbSB5IC0gVGhlIFkgY29tcG9uZW50IHZhbHVlXG4gICAqIEBwYXJhbSB6IC0gVGhlIFogY29tcG9uZW50IHZhbHVlXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gQWNjZXNzIG9wdGlvbnMgaW5jbHVkaW5nIGluZGljZXMgYWNjZXNzb3IgYW5kIGVuZGlhbm5lc3NcbiAgICovXG4gIHNldFZlYzMoaTogSW5kZXgsIHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIsIHsgaW5kaWNlc0FjY2Vzc29yLCBlbmRpYW4gPSB0cnVlIH06IEluZGljZXNBY2Nlc3NPcHRpb24pIHtcbiAgICBsZXQgaW5kZXggPSBpO1xuICAgIGlmIChpbmRpY2VzQWNjZXNzb3IpIHtcbiAgICAgIGluZGV4ID0gaW5kaWNlc0FjY2Vzc29yLmdldFNjYWxhcihpLCB7fSk7XG4gICAgfVxuICAgIGNvbnN0IHNpemVJbkJ5dGVzID0gdGhpcy5jb21wb25lbnRTaXplSW5CeXRlcztcbiAgICB0aGlzLl9fZGF0YVZpZXdTZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCwgeCwgZW5kaWFuKTtcbiAgICB0aGlzLl9fZGF0YVZpZXdTZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDEgKiBzaXplSW5CeXRlcywgeSwgZW5kaWFuKTtcbiAgICB0aGlzLl9fZGF0YVZpZXdTZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDIgKiBzaXplSW5CeXRlcywgeiwgZW5kaWFuKTtcbiAgICB0aGlzLl9faXNNaW5NaXhEaXJ0eSA9IHRydWU7XG4gICAgdGhpcy5fX29uVXBkYXRlZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSA0RCB2ZWN0b3IgYXQgdGhlIHNwZWNpZmllZCBpbmRleC5cbiAgICogQHBhcmFtIGkgLSBUaGUgZWxlbWVudCBpbmRleFxuICAgKiBAcGFyYW0geCAtIFRoZSBYIGNvbXBvbmVudCB2YWx1ZVxuICAgKiBAcGFyYW0geSAtIFRoZSBZIGNvbXBvbmVudCB2YWx1ZVxuICAgKiBAcGFyYW0geiAtIFRoZSBaIGNvbXBvbmVudCB2YWx1ZVxuICAgKiBAcGFyYW0gdyAtIFRoZSBXIGNvbXBvbmVudCB2YWx1ZVxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIEFjY2VzcyBvcHRpb25zIGluY2x1ZGluZyBpbmRpY2VzIGFjY2Vzc29yIGFuZCBlbmRpYW5uZXNzXG4gICAqL1xuICBzZXRWZWM0KFxuICAgIGk6IEluZGV4LFxuICAgIHg6IG51bWJlcixcbiAgICB5OiBudW1iZXIsXG4gICAgejogbnVtYmVyLFxuICAgIHc6IG51bWJlcixcbiAgICB7IGluZGljZXNBY2Nlc3NvciwgZW5kaWFuID0gdHJ1ZSB9OiBJbmRpY2VzQWNjZXNzT3B0aW9uXG4gICkge1xuICAgIGxldCBpbmRleCA9IGk7XG4gICAgaWYgKGluZGljZXNBY2Nlc3Nvcikge1xuICAgICAgaW5kZXggPSBpbmRpY2VzQWNjZXNzb3IuZ2V0U2NhbGFyKGksIHt9KTtcbiAgICB9XG4gICAgY29uc3Qgc2l6ZUluQnl0ZXMgPSB0aGlzLmNvbXBvbmVudFNpemVJbkJ5dGVzO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4LCB4LCBlbmRpYW4pO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMSAqIHNpemVJbkJ5dGVzLCB5LCBlbmRpYW4pO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMiAqIHNpemVJbkJ5dGVzLCB6LCBlbmRpYW4pO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMyAqIHNpemVJbkJ5dGVzLCB3LCBlbmRpYW4pO1xuICAgIHRoaXMuX19pc01pbk1peERpcnR5ID0gdHJ1ZTtcbiAgICB0aGlzLl9fb25VcGRhdGVkKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIDN4MyBtYXRyaXggYXQgdGhlIHNwZWNpZmllZCBpbmRleC5cbiAgICogQHBhcmFtIGkgLSBUaGUgZWxlbWVudCBpbmRleFxuICAgKiBAcGFyYW0gdjAgLSBNYXRyaXggY29tcG9uZW50IGF0IHBvc2l0aW9uIFswLDBdXG4gICAqIEBwYXJhbSB2MSAtIE1hdHJpeCBjb21wb25lbnQgYXQgcG9zaXRpb24gWzAsMV1cbiAgICogQHBhcmFtIHYyIC0gTWF0cml4IGNvbXBvbmVudCBhdCBwb3NpdGlvbiBbMCwyXVxuICAgKiBAcGFyYW0gdjMgLSBNYXRyaXggY29tcG9uZW50IGF0IHBvc2l0aW9uIFsxLDBdXG4gICAqIEBwYXJhbSB2NCAtIE1hdHJpeCBjb21wb25lbnQgYXQgcG9zaXRpb24gWzEsMV1cbiAgICogQHBhcmFtIHY1IC0gTWF0cml4IGNvbXBvbmVudCBhdCBwb3NpdGlvbiBbMSwyXVxuICAgKiBAcGFyYW0gdjYgLSBNYXRyaXggY29tcG9uZW50IGF0IHBvc2l0aW9uIFsyLDBdXG4gICAqIEBwYXJhbSB2NyAtIE1hdHJpeCBjb21wb25lbnQgYXQgcG9zaXRpb24gWzIsMV1cbiAgICogQHBhcmFtIHY4IC0gTWF0cml4IGNvbXBvbmVudCBhdCBwb3NpdGlvbiBbMiwyXVxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIEFjY2VzcyBvcHRpb25zIGluY2x1ZGluZyBpbmRpY2VzIGFjY2Vzc29yIGFuZCBlbmRpYW5uZXNzXG4gICAqL1xuICBzZXRNYXQzKFxuICAgIGk6IEluZGV4LFxuICAgIHYwOiBudW1iZXIsXG4gICAgdjE6IG51bWJlcixcbiAgICB2MjogbnVtYmVyLFxuICAgIHYzOiBudW1iZXIsXG4gICAgdjQ6IG51bWJlcixcbiAgICB2NTogbnVtYmVyLFxuICAgIHY2OiBudW1iZXIsXG4gICAgdjc6IG51bWJlcixcbiAgICB2ODogbnVtYmVyLFxuICAgIHsgaW5kaWNlc0FjY2Vzc29yLCBlbmRpYW4gPSB0cnVlIH06IEluZGljZXNBY2Nlc3NPcHRpb25cbiAgKSB7XG4gICAgbGV0IGluZGV4ID0gaTtcbiAgICBpZiAoaW5kaWNlc0FjY2Vzc29yKSB7XG4gICAgICBpbmRleCA9IGluZGljZXNBY2Nlc3Nvci5nZXRTY2FsYXIoaSwge30pO1xuICAgIH1cbiAgICBjb25zdCBzaXplSW5CeXRlcyA9IHRoaXMuY29tcG9uZW50U2l6ZUluQnl0ZXM7XG4gICAgdGhpcy5fX2RhdGFWaWV3U2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXgsIHYwLCBlbmRpYW4pO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMSAqIHNpemVJbkJ5dGVzLCB2MSwgZW5kaWFuKTtcbiAgICB0aGlzLl9fZGF0YVZpZXdTZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDIgKiBzaXplSW5CeXRlcywgdjIsIGVuZGlhbik7XG4gICAgdGhpcy5fX2RhdGFWaWV3U2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyAzICogc2l6ZUluQnl0ZXMsIHYzLCBlbmRpYW4pO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgNCAqIHNpemVJbkJ5dGVzLCB2NCwgZW5kaWFuKTtcbiAgICB0aGlzLl9fZGF0YVZpZXdTZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDUgKiBzaXplSW5CeXRlcywgdjUsIGVuZGlhbik7XG4gICAgdGhpcy5fX2RhdGFWaWV3U2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyA2ICogc2l6ZUluQnl0ZXMsIHY2LCBlbmRpYW4pO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgNyAqIHNpemVJbkJ5dGVzLCB2NywgZW5kaWFuKTtcbiAgICB0aGlzLl9fZGF0YVZpZXdTZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDggKiBzaXplSW5CeXRlcywgdjgsIGVuZGlhbik7XG4gICAgdGhpcy5fX2lzTWluTWl4RGlydHkgPSB0cnVlO1xuICAgIHRoaXMuX19vblVwZGF0ZWQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgNHg0IG1hdHJpeCBhdCB0aGUgc3BlY2lmaWVkIGluZGV4LlxuICAgKiBAcGFyYW0gaSAtIFRoZSBlbGVtZW50IGluZGV4XG4gICAqIEBwYXJhbSB2MCAtIE1hdHJpeCBjb21wb25lbnQgYXQgcG9zaXRpb24gWzAsMF1cbiAgICogQHBhcmFtIHYxIC0gTWF0cml4IGNvbXBvbmVudCBhdCBwb3NpdGlvbiBbMCwxXVxuICAgKiBAcGFyYW0gdjIgLSBNYXRyaXggY29tcG9uZW50IGF0IHBvc2l0aW9uIFswLDJdXG4gICAqIEBwYXJhbSB2MyAtIE1hdHJpeCBjb21wb25lbnQgYXQgcG9zaXRpb24gWzAsM11cbiAgICogQHBhcmFtIHY0IC0gTWF0cml4IGNvbXBvbmVudCBhdCBwb3NpdGlvbiBbMSwwXVxuICAgKiBAcGFyYW0gdjUgLSBNYXRyaXggY29tcG9uZW50IGF0IHBvc2l0aW9uIFsxLDFdXG4gICAqIEBwYXJhbSB2NiAtIE1hdHJpeCBjb21wb25lbnQgYXQgcG9zaXRpb24gWzEsMl1cbiAgICogQHBhcmFtIHY3IC0gTWF0cml4IGNvbXBvbmVudCBhdCBwb3NpdGlvbiBbMSwzXVxuICAgKiBAcGFyYW0gdjggLSBNYXRyaXggY29tcG9uZW50IGF0IHBvc2l0aW9uIFsyLDBdXG4gICAqIEBwYXJhbSB2OSAtIE1hdHJpeCBjb21wb25lbnQgYXQgcG9zaXRpb24gWzIsMV1cbiAgICogQHBhcmFtIHYxMCAtIE1hdHJpeCBjb21wb25lbnQgYXQgcG9zaXRpb24gWzIsMl1cbiAgICogQHBhcmFtIHYxMSAtIE1hdHJpeCBjb21wb25lbnQgYXQgcG9zaXRpb24gWzIsM11cbiAgICogQHBhcmFtIHYxMiAtIE1hdHJpeCBjb21wb25lbnQgYXQgcG9zaXRpb24gWzMsMF1cbiAgICogQHBhcmFtIHYxMyAtIE1hdHJpeCBjb21wb25lbnQgYXQgcG9zaXRpb24gWzMsMV1cbiAgICogQHBhcmFtIHYxNCAtIE1hdHJpeCBjb21wb25lbnQgYXQgcG9zaXRpb24gWzMsMl1cbiAgICogQHBhcmFtIHYxNSAtIE1hdHJpeCBjb21wb25lbnQgYXQgcG9zaXRpb24gWzMsM11cbiAgICogQHBhcmFtIG9wdGlvbnMgLSBBY2Nlc3Mgb3B0aW9ucyBpbmNsdWRpbmcgaW5kaWNlcyBhY2Nlc3NvciBhbmQgZW5kaWFubmVzc1xuICAgKi9cbiAgc2V0TWF0NChcbiAgICBpOiBJbmRleCxcbiAgICB2MDogbnVtYmVyLFxuICAgIHYxOiBudW1iZXIsXG4gICAgdjI6IG51bWJlcixcbiAgICB2MzogbnVtYmVyLFxuICAgIHY0OiBudW1iZXIsXG4gICAgdjU6IG51bWJlcixcbiAgICB2NjogbnVtYmVyLFxuICAgIHY3OiBudW1iZXIsXG4gICAgdjg6IG51bWJlcixcbiAgICB2OTogbnVtYmVyLFxuICAgIHYxMDogbnVtYmVyLFxuICAgIHYxMTogbnVtYmVyLFxuICAgIHYxMjogbnVtYmVyLFxuICAgIHYxMzogbnVtYmVyLFxuICAgIHYxNDogbnVtYmVyLFxuICAgIHYxNTogbnVtYmVyLFxuICAgIHsgaW5kaWNlc0FjY2Vzc29yLCBlbmRpYW4gPSB0cnVlIH06IEluZGljZXNBY2Nlc3NPcHRpb25cbiAgKSB7XG4gICAgbGV0IGluZGV4ID0gaTtcbiAgICBpZiAoaW5kaWNlc0FjY2Vzc29yKSB7XG4gICAgICBpbmRleCA9IGluZGljZXNBY2Nlc3Nvci5nZXRTY2FsYXIoaSwge30pO1xuICAgIH1cbiAgICBjb25zdCBzaXplSW5CeXRlcyA9IHRoaXMuY29tcG9uZW50U2l6ZUluQnl0ZXM7XG4gICAgdGhpcy5fX2RhdGFWaWV3U2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXgsIHYwLCBlbmRpYW4pO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMSAqIHNpemVJbkJ5dGVzLCB2MSwgZW5kaWFuKTtcbiAgICB0aGlzLl9fZGF0YVZpZXdTZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDIgKiBzaXplSW5CeXRlcywgdjIsIGVuZGlhbik7XG4gICAgdGhpcy5fX2RhdGFWaWV3U2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyAzICogc2l6ZUluQnl0ZXMsIHYzLCBlbmRpYW4pO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgNCAqIHNpemVJbkJ5dGVzLCB2NCwgZW5kaWFuKTtcbiAgICB0aGlzLl9fZGF0YVZpZXdTZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDUgKiBzaXplSW5CeXRlcywgdjUsIGVuZGlhbik7XG4gICAgdGhpcy5fX2RhdGFWaWV3U2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyA2ICogc2l6ZUluQnl0ZXMsIHY2LCBlbmRpYW4pO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgNyAqIHNpemVJbkJ5dGVzLCB2NywgZW5kaWFuKTtcbiAgICB0aGlzLl9fZGF0YVZpZXdTZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDggKiBzaXplSW5CeXRlcywgdjgsIGVuZGlhbik7XG4gICAgdGhpcy5fX2RhdGFWaWV3U2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyA5ICogc2l6ZUluQnl0ZXMsIHY5LCBlbmRpYW4pO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMTAgKiBzaXplSW5CeXRlcywgdjEwLCBlbmRpYW4pO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMTEgKiBzaXplSW5CeXRlcywgdjExLCBlbmRpYW4pO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMTIgKiBzaXplSW5CeXRlcywgdjEyLCBlbmRpYW4pO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMTMgKiBzaXplSW5CeXRlcywgdjEzLCBlbmRpYW4pO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMTQgKiBzaXplSW5CeXRlcywgdjE0LCBlbmRpYW4pO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMTUgKiBzaXplSW5CeXRlcywgdjE1LCBlbmRpYW4pO1xuICAgIHRoaXMuX19pc01pbk1peERpcnR5ID0gdHJ1ZTtcbiAgICB0aGlzLl9fb25VcGRhdGVkKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIDJEIHZlY3RvciBhdCB0aGUgc3BlY2lmaWVkIGluZGV4IHVzaW5nIGEgVmVjdG9yMiBvYmplY3QuXG4gICAqIEBwYXJhbSBpIC0gVGhlIGVsZW1lbnQgaW5kZXhcbiAgICogQHBhcmFtIHZlYyAtIFRoZSBWZWN0b3IyIG9iamVjdCBjb250YWluaW5nIHRoZSB2YWx1ZXMgdG8gc2V0XG4gICAqIEBwYXJhbSBvcHRpb25zIC0gQWNjZXNzIG9wdGlvbnMgaW5jbHVkaW5nIGluZGljZXMgYWNjZXNzb3IgYW5kIGVuZGlhbm5lc3NcbiAgICovXG4gIHNldFZlYzJBc1ZlY3RvcihpOiBJbmRleCwgdmVjOiBWZWN0b3IyLCB7IGluZGljZXNBY2Nlc3NvciwgZW5kaWFuID0gdHJ1ZSB9OiBJbmRpY2VzQWNjZXNzT3B0aW9uKSB7XG4gICAgbGV0IGluZGV4ID0gaTtcbiAgICBpZiAoaW5kaWNlc0FjY2Vzc29yKSB7XG4gICAgICBpbmRleCA9IGluZGljZXNBY2Nlc3Nvci5nZXRTY2FsYXIoaSwge30pO1xuICAgIH1cbiAgICBjb25zdCBzaXplSW5CeXRlcyA9IHRoaXMuY29tcG9uZW50U2l6ZUluQnl0ZXM7XG4gICAgdGhpcy5fX2RhdGFWaWV3U2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXgsIHZlYy54LCBlbmRpYW4pO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMSAqIHNpemVJbkJ5dGVzLCB2ZWMueSwgZW5kaWFuKTtcbiAgICB0aGlzLl9faXNNaW5NaXhEaXJ0eSA9IHRydWU7XG4gICAgdGhpcy5fX29uVXBkYXRlZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSAzRCB2ZWN0b3IgYXQgdGhlIHNwZWNpZmllZCBpbmRleCB1c2luZyBhIFZlY3RvcjMgb2JqZWN0LlxuICAgKiBAcGFyYW0gaSAtIFRoZSBlbGVtZW50IGluZGV4XG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgVmVjdG9yMyBvYmplY3QgY29udGFpbmluZyB0aGUgdmFsdWVzIHRvIHNldFxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIEFjY2VzcyBvcHRpb25zIGluY2x1ZGluZyBpbmRpY2VzIGFjY2Vzc29yIGFuZCBlbmRpYW5uZXNzXG4gICAqL1xuICBzZXRWZWMzQXNWZWN0b3IoaTogSW5kZXgsIHZlYzogVmVjdG9yMywgeyBpbmRpY2VzQWNjZXNzb3IsIGVuZGlhbiA9IHRydWUgfTogSW5kaWNlc0FjY2Vzc09wdGlvbikge1xuICAgIGxldCBpbmRleCA9IGk7XG4gICAgaWYgKGluZGljZXNBY2Nlc3Nvcikge1xuICAgICAgaW5kZXggPSBpbmRpY2VzQWNjZXNzb3IuZ2V0U2NhbGFyKGksIHt9KTtcbiAgICB9XG4gICAgY29uc3Qgc2l6ZUluQnl0ZXMgPSB0aGlzLmNvbXBvbmVudFNpemVJbkJ5dGVzO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4LCB2ZWMueCwgZW5kaWFuKTtcbiAgICB0aGlzLl9fZGF0YVZpZXdTZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDEgKiBzaXplSW5CeXRlcywgdmVjLnksIGVuZGlhbik7XG4gICAgdGhpcy5fX2RhdGFWaWV3U2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyAyICogc2l6ZUluQnl0ZXMsIHZlYy56LCBlbmRpYW4pO1xuICAgIHRoaXMuX19pc01pbk1peERpcnR5ID0gdHJ1ZTtcbiAgICB0aGlzLl9fb25VcGRhdGVkKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIDREIHZlY3RvciBhdCB0aGUgc3BlY2lmaWVkIGluZGV4IHVzaW5nIGEgVmVjdG9yNCBvYmplY3QuXG4gICAqIEBwYXJhbSBpIC0gVGhlIGVsZW1lbnQgaW5kZXhcbiAgICogQHBhcmFtIHZlYyAtIFRoZSBWZWN0b3I0IG9iamVjdCBjb250YWluaW5nIHRoZSB2YWx1ZXMgdG8gc2V0XG4gICAqIEBwYXJhbSBvcHRpb25zIC0gQWNjZXNzIG9wdGlvbnMgaW5jbHVkaW5nIGluZGljZXMgYWNjZXNzb3IgYW5kIGVuZGlhbm5lc3NcbiAgICovXG4gIHNldFZlYzRBc1ZlY3RvcihpOiBJbmRleCwgdmVjOiBWZWN0b3I0LCB7IGluZGljZXNBY2Nlc3NvciwgZW5kaWFuID0gdHJ1ZSB9OiBJbmRpY2VzQWNjZXNzT3B0aW9uKSB7XG4gICAgbGV0IGluZGV4ID0gaTtcbiAgICBpZiAoaW5kaWNlc0FjY2Vzc29yKSB7XG4gICAgICBpbmRleCA9IGluZGljZXNBY2Nlc3Nvci5nZXRTY2FsYXIoaSwge30pO1xuICAgIH1cbiAgICBjb25zdCBzaXplSW5CeXRlcyA9IHRoaXMuY29tcG9uZW50U2l6ZUluQnl0ZXM7XG4gICAgdGhpcy5fX2RhdGFWaWV3U2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXgsIHZlYy54LCBlbmRpYW4pO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMSAqIHNpemVJbkJ5dGVzLCB2ZWMueSwgZW5kaWFuKTtcbiAgICB0aGlzLl9fZGF0YVZpZXdTZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDIgKiBzaXplSW5CeXRlcywgdmVjLnosIGVuZGlhbik7XG4gICAgdGhpcy5fX2RhdGFWaWV3U2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyAzICogc2l6ZUluQnl0ZXMsIHZlYy53LCBlbmRpYW4pO1xuICAgIHRoaXMuX19pc01pbk1peERpcnR5ID0gdHJ1ZTtcbiAgICB0aGlzLl9fb25VcGRhdGVkKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIDR4NCBtYXRyaXggYXQgdGhlIHNwZWNpZmllZCBpbmRleCB1c2luZyBhIE1hdHJpeDQ0IG9iamVjdC5cbiAgICogQHBhcmFtIGkgLSBUaGUgZWxlbWVudCBpbmRleFxuICAgKiBAcGFyYW0gbWF0IC0gVGhlIE1hdHJpeDQ0IG9iamVjdCBjb250YWluaW5nIHRoZSB2YWx1ZXMgdG8gc2V0XG4gICAqIEBwYXJhbSBvcHRpb25zIC0gQWNjZXNzIG9wdGlvbnMgaW5jbHVkaW5nIGluZGljZXMgYWNjZXNzb3IgYW5kIGVuZGlhbm5lc3NcbiAgICovXG4gIHNldE1hdDRBc01hdHJpeDQ0KGk6IEluZGV4LCBtYXQ6IE1hdHJpeDQ0LCB7IGluZGljZXNBY2Nlc3NvciwgZW5kaWFuID0gdHJ1ZSB9OiBJbmRpY2VzQWNjZXNzT3B0aW9uKSB7XG4gICAgbGV0IGluZGV4ID0gaTtcbiAgICBpZiAoaW5kaWNlc0FjY2Vzc29yKSB7XG4gICAgICBpbmRleCA9IGluZGljZXNBY2Nlc3Nvci5nZXRTY2FsYXIoaSwge30pO1xuICAgIH1cbiAgICBjb25zdCBzaXplSW5CeXRlcyA9IHRoaXMuY29tcG9uZW50U2l6ZUluQnl0ZXM7XG4gICAgdGhpcy5fX2RhdGFWaWV3U2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXgsIG1hdC5fdlswXSwgZW5kaWFuKTtcbiAgICB0aGlzLl9fZGF0YVZpZXdTZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDEgKiBzaXplSW5CeXRlcywgbWF0Ll92WzFdLCBlbmRpYW4pO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMiAqIHNpemVJbkJ5dGVzLCBtYXQuX3ZbMl0sIGVuZGlhbik7XG4gICAgdGhpcy5fX2RhdGFWaWV3U2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyAzICogc2l6ZUluQnl0ZXMsIG1hdC5fdlszXSwgZW5kaWFuKTtcbiAgICB0aGlzLl9fZGF0YVZpZXdTZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDQgKiBzaXplSW5CeXRlcywgbWF0Ll92WzRdLCBlbmRpYW4pO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgNSAqIHNpemVJbkJ5dGVzLCBtYXQuX3ZbNV0sIGVuZGlhbik7XG4gICAgdGhpcy5fX2RhdGFWaWV3U2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyA2ICogc2l6ZUluQnl0ZXMsIG1hdC5fdls2XSwgZW5kaWFuKTtcbiAgICB0aGlzLl9fZGF0YVZpZXdTZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDcgKiBzaXplSW5CeXRlcywgbWF0Ll92WzddLCBlbmRpYW4pO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgOCAqIHNpemVJbkJ5dGVzLCBtYXQuX3ZbOF0sIGVuZGlhbik7XG4gICAgdGhpcy5fX2RhdGFWaWV3U2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyA5ICogc2l6ZUluQnl0ZXMsIG1hdC5fdls5XSwgZW5kaWFuKTtcbiAgICB0aGlzLl9fZGF0YVZpZXdTZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDEwICogc2l6ZUluQnl0ZXMsIG1hdC5fdlsxMF0sIGVuZGlhbik7XG4gICAgdGhpcy5fX2RhdGFWaWV3U2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyAxMSAqIHNpemVJbkJ5dGVzLCBtYXQuX3ZbMTFdLCBlbmRpYW4pO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMTIgKiBzaXplSW5CeXRlcywgbWF0Ll92WzEyXSwgZW5kaWFuKTtcbiAgICB0aGlzLl9fZGF0YVZpZXdTZXR0ZXIodGhpcy5fX2J5dGVTdHJpZGUgKiBpbmRleCArIDEzICogc2l6ZUluQnl0ZXMsIG1hdC5fdlsxM10sIGVuZGlhbik7XG4gICAgdGhpcy5fX2RhdGFWaWV3U2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyAxNCAqIHNpemVJbkJ5dGVzLCBtYXQuX3ZbMTRdLCBlbmRpYW4pO1xuICAgIHRoaXMuX19kYXRhVmlld1NldHRlcih0aGlzLl9fYnl0ZVN0cmlkZSAqIGluZGV4ICsgMTUgKiBzaXplSW5CeXRlcywgbWF0Ll92WzE1XSwgZW5kaWFuKTtcbiAgICB0aGlzLl9faXNNaW5NaXhEaXJ0eSA9IHRydWU7XG4gICAgdGhpcy5fX29uVXBkYXRlZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvcGllcyBkYXRhIGZyb20gYSBUeXBlZEFycmF5IGludG8gdGhpcyBhY2Nlc3Nvci5cbiAgICogVGhlIGRhdGEgaXMgY29waWVkIGVsZW1lbnQgYnkgZWxlbWVudCB3aXRoIHByb3BlciB0eXBlIGNvbnZlcnNpb24uXG4gICAqIEBwYXJhbSB0eXBlZEFycmF5IC0gVGhlIFR5cGVkQXJyYXkgdG8gY29weSBkYXRhIGZyb21cbiAgICovXG4gIGNvcHlGcm9tVHlwZWRBcnJheSh0eXBlZEFycmF5OiBUeXBlZEFycmF5KSB7XG4gICAgY29uc3QgY29tcG9uZW50TiA9IHRoaXMubnVtYmVyT2ZDb21wb25lbnRzO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgdHlwZWRBcnJheS5ieXRlTGVuZ3RoIC8gdGhpcy5jb21wb25lbnRTaXplSW5CeXRlczsgaisrKSB7XG4gICAgICBjb25zdCBpZHggPSBNYXRoLmZsb29yKGogLyBjb21wb25lbnROKTtcbiAgICAgIGNvbnN0IGlkeE4gPSBpZHggKiBjb21wb25lbnROO1xuICAgICAgc3dpdGNoIChjb21wb25lbnROKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICB0aGlzLnNldFNjYWxhcihpZHgsIHR5cGVkQXJyYXlbaWR4TiArIDBdLCB7fSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICB0aGlzLnNldFZlYzIoaWR4LCB0eXBlZEFycmF5W2lkeE4gKyAwXSwgdHlwZWRBcnJheVtpZHhOICsgMV0sIHt9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgIHRoaXMuc2V0VmVjMyhpZHgsIHR5cGVkQXJyYXlbaWR4TiArIDBdLCB0eXBlZEFycmF5W2lkeE4gKyAxXSwgdHlwZWRBcnJheVtpZHhOICsgMl0sIHt9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgIHRoaXMuc2V0VmVjNChpZHgsIHR5cGVkQXJyYXlbaWR4TiArIDBdLCB0eXBlZEFycmF5W2lkeE4gKyAxXSwgdHlwZWRBcnJheVtpZHhOICsgMl0sIHR5cGVkQXJyYXlbaWR4TiArIDNdLCB7fSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdPdGhlciB0aGFuIHZlY3RvcnMgYXJlIGN1cnJlbnRseSBub3Qgc3VwcG9ydGVkLicpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9faXNNaW5NaXhEaXJ0eSA9IHRydWU7XG4gICAgdGhpcy5fX29uVXBkYXRlZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSBzY2FsYXIgdmFsdWUgYXQgdGhlIHNwZWNpZmllZCBpbmRleCB3aXRoIGEgY29tcG9zaXRpb24gb2Zmc2V0LlxuICAgKiBAcGFyYW0gaSAtIFRoZSBlbGVtZW50IGluZGV4XG4gICAqIEBwYXJhbSBjb21wb3NpdGlvbk9mZnNldCAtIEJ5dGUgb2Zmc2V0IHdpdGhpbiB0aGUgZWxlbWVudFxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIHNldFxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIEFjY2VzcyBvcHRpb25zIGluY2x1ZGluZyBpbmRpY2VzIGFjY2Vzc29yIGFuZCBlbmRpYW5uZXNzXG4gICAqL1xuICBzZXRTY2FsYXJBdChcbiAgICBpOiBJbmRleCxcbiAgICBjb21wb3NpdGlvbk9mZnNldDogSW5kZXgsXG4gICAgdmFsdWU6IG51bWJlcixcbiAgICB7IGluZGljZXNBY2Nlc3NvciwgZW5kaWFuID0gdHJ1ZSB9OiBJbmRpY2VzQWNjZXNzT3B0aW9uXG4gICkge1xuICAgIGxldCBpbmRleCA9IGk7XG4gICAgaWYgKGluZGljZXNBY2Nlc3Nvcikge1xuICAgICAgaW5kZXggPSBpbmRpY2VzQWNjZXNzb3IuZ2V0U2NhbGFyKGksIHt9KTtcbiAgICB9XG4gICAgdGhpcy5fX2RhdGFWaWV3U2V0dGVyKHRoaXMuX19ieXRlU3RyaWRlICogaW5kZXggKyBjb21wb3NpdGlvbk9mZnNldCwgdmFsdWUsIGVuZGlhbik7XG4gICAgdGhpcy5fX2lzTWluTWl4RGlydHkgPSB0cnVlO1xuICAgIHRoaXMuX19vblVwZGF0ZWQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGFuIGVsZW1lbnQgZnJvbSBhbm90aGVyIGFjY2Vzc29yIHdpdGggdGhlIHNhbWUgY29tcG9zaXRpb24gdHlwZS5cbiAgICogQHBhcmFtIGkgLSBUaGUgdGFyZ2V0IGVsZW1lbnQgaW5kZXhcbiAgICogQHBhcmFtIGFjY2Vzc29yIC0gVGhlIHNvdXJjZSBhY2Nlc3NvciB0byBjb3B5IGZyb21cbiAgICogQHBhcmFtIHNlY29uZElkeCAtIE9wdGlvbmFsIHNvdXJjZSBpbmRleCAoZGVmYXVsdHMgdG8gaSlcbiAgICovXG4gIHNldEVsZW1lbnRGcm9tU2FtZUNvbXBvc2l0aW9uQWNjZXNzb3IoaTogSW5kZXgsIGFjY2Vzc29yOiBBY2Nlc3Nvciwgc2Vjb25kSWR4PzogSW5kZXgpIHtcbiAgICBjb25zdCBqID0gc2Vjb25kSWR4ID8/IGk7XG4gICAgaWYgKHRoaXMuY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpID09PSAxKSB7XG4gICAgICB0aGlzLnNldFNjYWxhcihpLCBhY2Nlc3Nvci5nZXRTY2FsYXIoaiwge30pLCB7fSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmNvbXBvc2l0aW9uVHlwZS5nZXROdW1iZXJPZkNvbXBvbmVudHMoKSA9PT0gMikge1xuICAgICAgdGhpcy5zZXRWZWMyQXNWZWN0b3IoaSwgYWNjZXNzb3IuZ2V0VmVjMihqLCB7fSksIHt9KTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpID09PSAzKSB7XG4gICAgICB0aGlzLnNldFZlYzNBc1ZlY3RvcihpLCBhY2Nlc3Nvci5nZXRWZWMzKGosIHt9KSwge30pO1xuICAgIH0gZWxzZSBpZiAodGhpcy5jb21wb3NpdGlvblR5cGUuZ2V0TnVtYmVyT2ZDb21wb25lbnRzKCkgPT09IDQpIHtcbiAgICAgIHRoaXMuc2V0VmVjNEFzVmVjdG9yKGksIGFjY2Vzc29yLmdldFZlYzQoaiwge30pLCB7fSk7XG4gICAgfVxuICAgIHRoaXMuX19pc01pbk1peERpcnR5ID0gdHJ1ZTtcbiAgICB0aGlzLl9fb25VcGRhdGVkKCk7XG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIHRoZSBlbnRpcmUgYnVmZmVyIGZyb20gYW5vdGhlciBhY2Nlc3Nvci5cbiAgICogQHBhcmFtIGFjY2Vzc29yIC0gVGhlIHNvdXJjZSBhY2Nlc3NvciB0byBjb3B5IHRoZSBidWZmZXIgZnJvbVxuICAgKi9cbiAgY29weUJ1ZmZlcihhY2Nlc3NvcjogQWNjZXNzb3IpIHtcbiAgICBuZXcgVWludDhBcnJheSh0aGlzLl9fcmF3KS5zZXQoXG4gICAgICBuZXcgVWludDhBcnJheShhY2Nlc3Nvci5fX3JhdywgYWNjZXNzb3IuX19ieXRlT2Zmc2V0SW5SYXdBcnJheUJ1ZmZlck9mQnVmZmVyLCBhY2Nlc3Nvci5ieXRlTGVuZ3RoKSxcbiAgICAgIHRoaXMuX19ieXRlT2Zmc2V0SW5SYXdBcnJheUJ1ZmZlck9mQnVmZmVyXG4gICAgKTtcbiAgICB0aGlzLl9faXNNaW5NaXhEaXJ0eSA9IHRydWU7XG4gICAgdGhpcy5fX29uVXBkYXRlZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYW4gZWxlbWVudCBmcm9tIGFub3RoZXIgYWNjZXNzb3IsIGhhbmRsaW5nIGRpZmZlcmVudCBjb21wb3NpdGlvbiB0eXBlcy5cbiAgICogQXV0b21hdGljYWxseSBjb252ZXJ0cyBiZXR3ZWVuIGRpZmZlcmVudCB2ZWN0b3Ivc2NhbGFyIHR5cGVzIGFzIG5lZWRlZC5cbiAgICogQHBhcmFtIGkgLSBUaGUgdGFyZ2V0IGVsZW1lbnQgaW5kZXhcbiAgICogQHBhcmFtIGFjY2Vzc29yIC0gVGhlIHNvdXJjZSBhY2Nlc3NvciB0byBjb3B5IGZyb21cbiAgICogQHBhcmFtIHNlY29uZElkeCAtIE9wdGlvbmFsIHNvdXJjZSBpbmRleCAoZGVmYXVsdHMgdG8gaSlcbiAgICovXG4gIHNldEVsZW1lbnRGcm9tQWNjZXNzb3IoaTogSW5kZXgsIGFjY2Vzc29yOiBBY2Nlc3Nvciwgc2Vjb25kSWR4PzogSW5kZXgpIHtcbiAgICBjb25zdCBqID0gc2Vjb25kSWR4ID8/IGk7XG4gICAgaWYgKHRoaXMuY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpID09PSAxKSB7XG4gICAgICBpZiAoYWNjZXNzb3IuY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpID09PSAxKSB7XG4gICAgICAgIHRoaXMuc2V0U2NhbGFyKGksIGFjY2Vzc29yLmdldFNjYWxhcihqLCB7fSksIHt9KTtcbiAgICAgIH0gZWxzZSBpZiAoYWNjZXNzb3IuY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpID09PSAyKSB7XG4gICAgICAgIHRoaXMuc2V0U2NhbGFyKGksIGFjY2Vzc29yLmdldFZlYzIoaiwge30pLngsIHt9KTtcbiAgICAgIH0gZWxzZSBpZiAoYWNjZXNzb3IuY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpID09PSAzKSB7XG4gICAgICAgIHRoaXMuc2V0U2NhbGFyKGksIGFjY2Vzc29yLmdldFZlYzMoaiwge30pLngsIHt9KTtcbiAgICAgIH0gZWxzZSBpZiAoYWNjZXNzb3IuY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpID09PSA0KSB7XG4gICAgICAgIHRoaXMuc2V0U2NhbGFyKGksIGFjY2Vzc29yLmdldFZlYzQoaiwge30pLngsIHt9KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMuY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpID09PSAyKSB7XG4gICAgICBpZiAoYWNjZXNzb3IuY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpID09PSAxKSB7XG4gICAgICAgIGNvbnN0IHNjYWxhciA9IGFjY2Vzc29yLmdldFNjYWxhcihqLCB7fSk7XG4gICAgICAgIHRoaXMuc2V0VmVjMihpLCBzY2FsYXIsIDAsIHt9KTtcbiAgICAgIH0gZWxzZSBpZiAoYWNjZXNzb3IuY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpID09PSAyKSB7XG4gICAgICAgIHRoaXMuc2V0VmVjMkFzVmVjdG9yKGksIGFjY2Vzc29yLmdldFZlYzIoaiwge30pLCB7fSk7XG4gICAgICB9IGVsc2UgaWYgKGFjY2Vzc29yLmNvbXBvc2l0aW9uVHlwZS5nZXROdW1iZXJPZkNvbXBvbmVudHMoKSA9PT0gMykge1xuICAgICAgICBjb25zdCB2ZWMgPSBhY2Nlc3Nvci5nZXRWZWMzKGosIHt9KTtcbiAgICAgICAgdGhpcy5zZXRWZWMyKGksIHZlYy54LCB2ZWMueSwge30pO1xuICAgICAgfSBlbHNlIGlmIChhY2Nlc3Nvci5jb21wb3NpdGlvblR5cGUuZ2V0TnVtYmVyT2ZDb21wb25lbnRzKCkgPT09IDQpIHtcbiAgICAgICAgY29uc3QgdmVjID0gYWNjZXNzb3IuZ2V0VmVjNChqLCB7fSk7XG4gICAgICAgIHRoaXMuc2V0VmVjMihpLCB2ZWMueCwgdmVjLnksIHt9KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMuY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpID09PSAzKSB7XG4gICAgICBpZiAoYWNjZXNzb3IuY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpID09PSAxKSB7XG4gICAgICAgIGNvbnN0IHNjYWxhciA9IGFjY2Vzc29yLmdldFNjYWxhcihqLCB7fSk7XG4gICAgICAgIHRoaXMuc2V0VmVjMyhpLCBzY2FsYXIsIDAsIDAsIHt9KTtcbiAgICAgIH0gZWxzZSBpZiAoYWNjZXNzb3IuY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpID09PSAyKSB7XG4gICAgICAgIGNvbnN0IHZlYyA9IGFjY2Vzc29yLmdldFZlYzIoaiwge30pO1xuICAgICAgICB0aGlzLnNldFZlYzMoaSwgdmVjLngsIHZlYy55LCAwLCB7fSk7XG4gICAgICB9IGVsc2UgaWYgKGFjY2Vzc29yLmNvbXBvc2l0aW9uVHlwZS5nZXROdW1iZXJPZkNvbXBvbmVudHMoKSA9PT0gMykge1xuICAgICAgICBjb25zdCB2ZWMgPSBhY2Nlc3Nvci5nZXRWZWMzKGosIHt9KTtcbiAgICAgICAgdGhpcy5zZXRWZWMzQXNWZWN0b3IoaSwgdmVjLCB7fSk7XG4gICAgICB9IGVsc2UgaWYgKGFjY2Vzc29yLmNvbXBvc2l0aW9uVHlwZS5nZXROdW1iZXJPZkNvbXBvbmVudHMoKSA9PT0gNCkge1xuICAgICAgICBjb25zdCB2ZWMgPSBhY2Nlc3Nvci5nZXRWZWM0KGosIHt9KTtcbiAgICAgICAgdGhpcy5zZXRWZWMzKGksIHZlYy54LCB2ZWMueSwgdmVjLnosIHt9KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMuY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpID09PSA0KSB7XG4gICAgICBpZiAoYWNjZXNzb3IuY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpID09PSAxKSB7XG4gICAgICAgIGNvbnN0IHNjYWxhciA9IGFjY2Vzc29yLmdldFNjYWxhcihqLCB7fSk7XG4gICAgICAgIHRoaXMuc2V0VmVjNChpLCBzY2FsYXIsIDAsIDAsIDAsIHt9KTtcbiAgICAgIH0gZWxzZSBpZiAoYWNjZXNzb3IuY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpID09PSAyKSB7XG4gICAgICAgIGNvbnN0IHZlYyA9IGFjY2Vzc29yLmdldFZlYzIoaiwge30pO1xuICAgICAgICB0aGlzLnNldFZlYzQoaSwgdmVjLngsIHZlYy55LCAwLCAwLCB7fSk7XG4gICAgICB9IGVsc2UgaWYgKGFjY2Vzc29yLmNvbXBvc2l0aW9uVHlwZS5nZXROdW1iZXJPZkNvbXBvbmVudHMoKSA9PT0gMykge1xuICAgICAgICBjb25zdCB2ZWMgPSBhY2Nlc3Nvci5nZXRWZWMzKGosIHt9KTtcbiAgICAgICAgdGhpcy5zZXRWZWM0KGksIHZlYy54LCB2ZWMueSwgdmVjLnosIDAsIHt9KTtcbiAgICAgIH0gZWxzZSBpZiAoYWNjZXNzb3IuY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpID09PSA0KSB7XG4gICAgICAgIGNvbnN0IHZlYyA9IGFjY2Vzc29yLmdldFZlYzQoaiwge30pO1xuICAgICAgICB0aGlzLnNldFZlYzRBc1ZlY3RvcihpLCB2ZWMsIHt9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fX2lzTWluTWl4RGlydHkgPSB0cnVlO1xuICAgIHRoaXMuX19vblVwZGF0ZWQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGFuIGVsZW1lbnQgZnJvbSBhbm90aGVyIGFjY2Vzc29yIHdpdGggdGhlIHNhbWUgY29tcG9zaXRpb24gdHlwZSwgc2NhbGVkIGJ5IGEgY29lZmZpY2llbnQuXG4gICAqIEBwYXJhbSBpIC0gVGhlIHRhcmdldCBlbGVtZW50IGluZGV4XG4gICAqIEBwYXJhbSBhY2Nlc3NvciAtIFRoZSBzb3VyY2UgYWNjZXNzb3IgdG8gYWRkIGZyb21cbiAgICogQHBhcmFtIGNvZWZmIC0gVGhlIGNvZWZmaWNpZW50IHRvIG11bHRpcGx5IHRoZSBzb3VyY2UgdmFsdWVzIGJ5XG4gICAqIEBwYXJhbSBzZWNvbmRJZHggLSBPcHRpb25hbCBzb3VyY2UgaW5kZXggKGRlZmF1bHRzIHRvIGkpXG4gICAqL1xuICBhZGRFbGVtZW50RnJvbVNhbWVDb21wb3NpdGlvbkFjY2Vzc29yKGk6IEluZGV4LCBhY2Nlc3NvcjogQWNjZXNzb3IsIGNvZWZmOiBudW1iZXIsIHNlY29uZElkeD86IEluZGV4KSB7XG4gICAgY29uc3QgaiA9IHNlY29uZElkeCA/PyBpO1xuICAgIGlmICh0aGlzLmNvbXBvc2l0aW9uVHlwZS5nZXROdW1iZXJPZkNvbXBvbmVudHMoKSA9PT0gMSkge1xuICAgICAgdGhpcy5zZXRTY2FsYXIoaSwgdGhpcy5nZXRTY2FsYXIoaSwge30pICsgY29lZmYgKiBhY2Nlc3Nvci5nZXRTY2FsYXIoaiwge30pLCB7fSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmNvbXBvc2l0aW9uVHlwZS5nZXROdW1iZXJPZkNvbXBvbmVudHMoKSA9PT0gMikge1xuICAgICAgdGhpcy5zZXRWZWMyQXNWZWN0b3IoaSwgVmVjdG9yMi5hZGQodGhpcy5nZXRWZWMyKGksIHt9KSwgVmVjdG9yMi5tdWx0aXBseShhY2Nlc3Nvci5nZXRWZWMyKGosIHt9KSwgY29lZmYpKSwge30pO1xuICAgIH0gZWxzZSBpZiAodGhpcy5jb21wb3NpdGlvblR5cGUuZ2V0TnVtYmVyT2ZDb21wb25lbnRzKCkgPT09IDMpIHtcbiAgICAgIHRoaXMuc2V0VmVjM0FzVmVjdG9yKGksIFZlY3RvcjMuYWRkKHRoaXMuZ2V0VmVjMyhpLCB7fSksIFZlY3RvcjMubXVsdGlwbHkoYWNjZXNzb3IuZ2V0VmVjMyhqLCB7fSksIGNvZWZmKSksIHt9KTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpID09PSA0KSB7XG4gICAgICB0aGlzLnNldFZlYzRBc1ZlY3RvcihpLCBWZWN0b3I0LmFkZCh0aGlzLmdldFZlYzQoaSwge30pLCBWZWN0b3I0Lm11bHRpcGx5KGFjY2Vzc29yLmdldFZlYzQoaiwge30pLCBjb2VmZikpLCB7fSk7XG4gICAgfVxuICAgIHRoaXMuX19pc01pbk1peERpcnR5ID0gdHJ1ZTtcbiAgICB0aGlzLl9fb25VcGRhdGVkKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdW5kZXJseWluZyBBcnJheUJ1ZmZlciBvZiB0aGUgYnVmZmVyIHZpZXcuXG4gICAqIEByZXR1cm5zIFRoZSBBcnJheUJ1ZmZlciBjb250YWluaW5nIHRoZSBkYXRhXG4gICAqL1xuICBnZXQgYXJyYXlCdWZmZXJPZkJ1ZmZlclZpZXcoKTogQXJyYXlCdWZmZXIge1xuICAgIHJldHVybiB0aGlzLl9fcmF3O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIERhdGFWaWV3IG9mIHRoZSBidWZmZXIgdmlldy5cbiAgICogQHJldHVybnMgVGhlIERhdGFWaWV3IGZvciBhY2Nlc3NpbmcgdGhlIGJ1ZmZlciBkYXRhXG4gICAqL1xuICBnZXQgZGF0YVZpZXdPZkJ1ZmZlclZpZXcoKTogRGF0YVZpZXcge1xuICAgIHJldHVybiB0aGlzLl9fZGF0YVZpZXchO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGJ5dGUgb2Zmc2V0IHdpdGhpbiB0aGUgYnVmZmVyIHZpZXcuXG4gICAqIEByZXR1cm5zIFRoZSBieXRlIG9mZnNldCBpbiB0aGUgYnVmZmVyIHZpZXdcbiAgICovXG4gIGdldCBieXRlT2Zmc2V0SW5CdWZmZXJWaWV3KCk6IEJ5dGUge1xuICAgIHJldHVybiB0aGlzLl9fYnl0ZU9mZnNldEluUmF3QXJyYXlCdWZmZXJPZkJ1ZmZlciAtIHRoaXMuX19idWZmZXJWaWV3LmJ5dGVPZmZzZXRJblJhd0FycmF5QnVmZmVyT2ZCdWZmZXI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgYnl0ZSBvZmZzZXQgd2l0aGluIHRoZSBidWZmZXIuXG4gICAqIEByZXR1cm5zIFRoZSBieXRlIG9mZnNldCBpbiB0aGUgYnVmZmVyXG4gICAqL1xuICBnZXQgYnl0ZU9mZnNldEluQnVmZmVyKCk6IEJ5dGUge1xuICAgIHJldHVybiB0aGlzLl9fYnl0ZU9mZnNldEluUmF3QXJyYXlCdWZmZXJPZkJ1ZmZlciAtIHRoaXMuX19idWZmZXJWaWV3LmJ1ZmZlci5ieXRlT2Zmc2V0SW5SYXdBcnJheUJ1ZmZlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBieXRlIG9mZnNldCBpbiB0aGUgcmF3IEFycmF5QnVmZmVyIG9mIHRoZSBidWZmZXIuXG4gICAqIEByZXR1cm5zIFRoZSBieXRlIG9mZnNldCBpbiB0aGUgcmF3IEFycmF5QnVmZmVyXG4gICAqL1xuICBnZXQgYnl0ZU9mZnNldEluUmF3QXJyYXlCdWZmZXJPZkJ1ZmZlcigpIHtcbiAgICByZXR1cm4gdGhpcy5fX2J5dGVPZmZzZXRJblJhd0FycmF5QnVmZmVyT2ZCdWZmZXI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgQnVmZmVyVmlldyB0aGF0IGNvbnRhaW5zIHRoaXMgYWNjZXNzb3IncyBkYXRhLlxuICAgKiBAcmV0dXJucyBUaGUgQnVmZmVyVmlldyBvYmplY3RcbiAgICovXG4gIGdldCBidWZmZXJWaWV3KCk6IEJ1ZmZlclZpZXcge1xuICAgIHJldHVybiB0aGlzLl9fYnVmZmVyVmlldztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBtaW5pbXVtIGFuZCBtYXhpbXVtIHZhbHVlcyBmb3IgdGhpcyBhY2Nlc3Nvci5cbiAgICogQHBhcmFtIG1pbiAtIEFycmF5IG9mIG1pbmltdW0gdmFsdWVzIGZvciBlYWNoIGNvbXBvbmVudFxuICAgKiBAcGFyYW0gbWF4IC0gQXJyYXkgb2YgbWF4aW11bSB2YWx1ZXMgZm9yIGVhY2ggY29tcG9uZW50XG4gICAqL1xuICBzZXRNaW5NYXgobWluOiBudW1iZXJbXSwgbWF4OiBudW1iZXJbXSkge1xuICAgIGNvbnN0IGNvbXBvbmVudE4gPSB0aGlzLmNvbXBvc2l0aW9uVHlwZS5nZXROdW1iZXJPZkNvbXBvbmVudHMoKTtcbiAgICBpZiAoY29tcG9uZW50TiA9PT0gMSkge1xuICAgICAgdGhpcy5fX21pbi5fdlswXSA9IG1pblswXTtcbiAgICAgIHRoaXMuX19tYXguX3ZbMF0gPSBtYXhbMF07XG4gICAgfSBlbHNlIGlmIChjb21wb25lbnROID09PSAyKSB7XG4gICAgICB0aGlzLl9fbWluLl92WzBdID0gbWluWzBdO1xuICAgICAgdGhpcy5fX21pbi5fdlsxXSA9IG1pblsxXTtcbiAgICAgIHRoaXMuX19tYXguX3ZbMF0gPSBtYXhbMF07XG4gICAgICB0aGlzLl9fbWF4Ll92WzFdID0gbWF4WzFdO1xuICAgIH0gZWxzZSBpZiAoY29tcG9uZW50TiA9PT0gMykge1xuICAgICAgdGhpcy5fX21pbi5fdlswXSA9IG1pblswXTtcbiAgICAgIHRoaXMuX19taW4uX3ZbMV0gPSBtaW5bMV07XG4gICAgICB0aGlzLl9fbWluLl92WzJdID0gbWluWzJdO1xuICAgICAgdGhpcy5fX21heC5fdlswXSA9IG1heFswXTtcbiAgICAgIHRoaXMuX19tYXguX3ZbMV0gPSBtYXhbMV07XG4gICAgICB0aGlzLl9fbWF4Ll92WzJdID0gbWF4WzJdO1xuICAgIH0gZWxzZSBpZiAoY29tcG9uZW50TiA9PT0gNCkge1xuICAgICAgdGhpcy5fX21pbi5fdlswXSA9IG1pblswXTtcbiAgICAgIHRoaXMuX19taW4uX3ZbMV0gPSBtaW5bMV07XG4gICAgICB0aGlzLl9fbWluLl92WzJdID0gbWluWzJdO1xuICAgICAgdGhpcy5fX21pbi5fdlszXSA9IG1pblszXTtcbiAgICAgIHRoaXMuX19tYXguX3ZbMF0gPSBtYXhbMF07XG4gICAgICB0aGlzLl9fbWF4Ll92WzFdID0gbWF4WzFdO1xuICAgICAgdGhpcy5fX21heC5fdlsyXSA9IG1heFsyXTtcbiAgICAgIHRoaXMuX19tYXguX3ZbM10gPSBtYXhbM107XG4gICAgfVxuICAgIHRoaXMuX19pc01pbk1peERpcnR5ID0gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWluaW11bSB2YWx1ZXMgZm9yIGVhY2ggY29tcG9uZW50LlxuICAgKiBDYWxjdWxhdGVzIG1pbi9tYXggaWYgZGlydHkuXG4gICAqIEByZXR1cm5zIEFycmF5IG9mIG1pbmltdW0gdmFsdWVzXG4gICAqL1xuICBnZXQgbWluKCk6IG51bWJlcltdIHtcbiAgICBpZiAodGhpcy5fX2lzTWluTWl4RGlydHkpIHtcbiAgICAgIHRoaXMuX19jYWxjTWluTWF4KCk7XG4gICAgfVxuXG4gICAgY29uc3QgY29tcG9uZW50TiA9IHRoaXMuY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpO1xuICAgIGlmIChjb21wb25lbnROID09PSA0KSB7XG4gICAgICByZXR1cm4gW3RoaXMuX19taW4uX3ZbMF0sIHRoaXMuX19taW4uX3ZbMV0sIHRoaXMuX19taW4uX3ZbMl0sIHRoaXMuX19taW4uX3ZbM11dO1xuICAgIH1cbiAgICBpZiAoY29tcG9uZW50TiA9PT0gMykge1xuICAgICAgcmV0dXJuIFt0aGlzLl9fbWluLl92WzBdLCB0aGlzLl9fbWluLl92WzFdLCB0aGlzLl9fbWluLl92WzJdXTtcbiAgICB9XG4gICAgaWYgKGNvbXBvbmVudE4gPT09IDIpIHtcbiAgICAgIHJldHVybiBbdGhpcy5fX21pbi5fdlswXSwgdGhpcy5fX21pbi5fdlsxXV07XG4gICAgfVxuICAgIHJldHVybiBbdGhpcy5fX21pbi5fdlswXV07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF4aW11bSB2YWx1ZXMgZm9yIGVhY2ggY29tcG9uZW50LlxuICAgKiBDYWxjdWxhdGVzIG1pbi9tYXggaWYgZGlydHkuXG4gICAqIEByZXR1cm5zIEFycmF5IG9mIG1heGltdW0gdmFsdWVzXG4gICAqL1xuICBnZXQgbWF4KCk6IG51bWJlcltdIHtcbiAgICBpZiAodGhpcy5fX2lzTWluTWl4RGlydHkpIHtcbiAgICAgIHRoaXMuX19jYWxjTWluTWF4KCk7XG4gICAgfVxuICAgIGNvbnN0IGNvbXBvbmVudE4gPSB0aGlzLmNvbXBvc2l0aW9uVHlwZS5nZXROdW1iZXJPZkNvbXBvbmVudHMoKTtcbiAgICBpZiAoY29tcG9uZW50TiA9PT0gNCkge1xuICAgICAgcmV0dXJuIFt0aGlzLl9fbWF4Ll92WzBdLCB0aGlzLl9fbWF4Ll92WzFdLCB0aGlzLl9fbWF4Ll92WzJdLCB0aGlzLl9fbWF4Ll92WzNdXTtcbiAgICB9XG4gICAgaWYgKGNvbXBvbmVudE4gPT09IDMpIHtcbiAgICAgIHJldHVybiBbdGhpcy5fX21heC5fdlswXSwgdGhpcy5fX21heC5fdlsxXSwgdGhpcy5fX21heC5fdlsyXV07XG4gICAgfVxuICAgIGlmIChjb21wb25lbnROID09PSAyKSB7XG4gICAgICByZXR1cm4gW3RoaXMuX19tYXguX3ZbMF0sIHRoaXMuX19tYXguX3ZbMV1dO1xuICAgIH1cbiAgICByZXR1cm4gW3RoaXMuX19tYXguX3ZbMF1dO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgd2hldGhlciB0aGUgZGF0YSBzaG91bGQgYmUgbm9ybWFsaXplZC5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiBkYXRhIHNob3VsZCBiZSBub3JtYWxpemVkXG4gICAqL1xuICBnZXQgbm9ybWFsaXplZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX25vcm1hbGl6ZWQ7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyB0aGUgbWluaW11bSBhbmQgbWF4aW11bSB2YWx1ZXMgZm9yIGFsbCBlbGVtZW50cy5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX19jYWxjTWluTWF4KCkge1xuICAgIGNvbnN0IGNvbXBvbmVudE4gPSB0aGlzLmNvbXBvc2l0aW9uVHlwZS5nZXROdW1iZXJPZkNvbXBvbmVudHMoKTtcbiAgICBpZiAoY29tcG9uZW50TiA9PT0gNCkge1xuICAgICAgdGhpcy5fX21heC5zZXRDb21wb25lbnRzKC1OdW1iZXIuTUFYX1ZBTFVFLCAtTnVtYmVyLk1BWF9WQUxVRSwgLU51bWJlci5NQVhfVkFMVUUsIC1OdW1iZXIuTUFYX1ZBTFVFKTtcbiAgICAgIHRoaXMuX19taW4uc2V0Q29tcG9uZW50cyhOdW1iZXIuTUFYX1ZBTFVFLCBOdW1iZXIuTUFYX1ZBTFVFLCBOdW1iZXIuTUFYX1ZBTFVFLCBOdW1iZXIuTUFYX1ZBTFVFKTtcblxuICAgICAgY29uc3QgdmVjNCA9IEFjY2Vzc29yLl9fdG1wVmVjdG9yNF8wO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmVsZW1lbnRDb3VudDsgaSsrKSB7XG4gICAgICAgIHRoaXMuZ2V0VmVjNFRvKGksIHZlYzQsIHt9KTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCA0OyBqKyspIHtcbiAgICAgICAgICBpZiAodGhpcy5fX21heC5fdltqXSA8IHZlYzQuX3Zbal0pIHtcbiAgICAgICAgICAgIHRoaXMuX19tYXguX3Zbal0gPSB2ZWM0Ll92W2pdO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodmVjNC5fdltqXSA8IHRoaXMuX19taW4uX3Zbal0pIHtcbiAgICAgICAgICAgIHRoaXMuX19taW4uX3Zbal0gPSB2ZWM0Ll92W2pdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY29tcG9uZW50TiA9PT0gMykge1xuICAgICAgdGhpcy5fX21heC5zZXRDb21wb25lbnRzKC1OdW1iZXIuTUFYX1ZBTFVFLCAtTnVtYmVyLk1BWF9WQUxVRSwgLU51bWJlci5NQVhfVkFMVUUsIC1OdW1iZXIuTUFYX1ZBTFVFKTtcbiAgICAgIHRoaXMuX19taW4uc2V0Q29tcG9uZW50cyhOdW1iZXIuTUFYX1ZBTFVFLCBOdW1iZXIuTUFYX1ZBTFVFLCBOdW1iZXIuTUFYX1ZBTFVFLCBOdW1iZXIuTUFYX1ZBTFVFKTtcblxuICAgICAgY29uc3QgdmVjMyA9IEFjY2Vzc29yLl9fdG1wVmVjdG9yM18wO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmVsZW1lbnRDb3VudDsgaSsrKSB7XG4gICAgICAgIHRoaXMuZ2V0VmVjM1RvKGksIHZlYzMsIHt9KTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAzOyBqKyspIHtcbiAgICAgICAgICBpZiAodGhpcy5fX21heC5fdltqXSA8IHZlYzMuX3Zbal0pIHtcbiAgICAgICAgICAgIHRoaXMuX19tYXguX3Zbal0gPSB2ZWMzLl92W2pdO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodmVjMy5fdltqXSA8IHRoaXMuX19taW4uX3Zbal0pIHtcbiAgICAgICAgICAgIHRoaXMuX19taW4uX3Zbal0gPSB2ZWMzLl92W2pdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY29tcG9uZW50TiA9PT0gMikge1xuICAgICAgdGhpcy5fX21heC5zZXRDb21wb25lbnRzKC1OdW1iZXIuTUFYX1ZBTFVFLCAtTnVtYmVyLk1BWF9WQUxVRSwgLU51bWJlci5NQVhfVkFMVUUsIC1OdW1iZXIuTUFYX1ZBTFVFKTtcbiAgICAgIHRoaXMuX19taW4uc2V0Q29tcG9uZW50cyhOdW1iZXIuTUFYX1ZBTFVFLCBOdW1iZXIuTUFYX1ZBTFVFLCBOdW1iZXIuTUFYX1ZBTFVFLCBOdW1iZXIuTUFYX1ZBTFVFKTtcblxuICAgICAgY29uc3QgdmVjMiA9IEFjY2Vzc29yLl9fdG1wVmVjdG9yMl8wO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmVsZW1lbnRDb3VudDsgaSsrKSB7XG4gICAgICAgIHRoaXMuZ2V0VmVjMlRvKGksIHZlYzIsIHt9KTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAyOyBqKyspIHtcbiAgICAgICAgICBpZiAodGhpcy5fX21heC5fdltqXSA8IHZlYzIuX3Zbal0pIHtcbiAgICAgICAgICAgIHRoaXMuX19tYXguX3Zbal0gPSB2ZWMyLl92W2pdO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodmVjMi5fdltqXSA8IHRoaXMuX19taW4uX3Zbal0pIHtcbiAgICAgICAgICAgIHRoaXMuX19taW4uX3Zbal0gPSB2ZWMyLl92W2pdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY29tcG9uZW50TiA9PT0gMSkge1xuICAgICAgdGhpcy5fX21heC5zZXRDb21wb25lbnRzKC1OdW1iZXIuTUFYX1ZBTFVFLCAtTnVtYmVyLk1BWF9WQUxVRSwgLU51bWJlci5NQVhfVkFMVUUsIC1OdW1iZXIuTUFYX1ZBTFVFKTtcbiAgICAgIHRoaXMuX19taW4uc2V0Q29tcG9uZW50cyhOdW1iZXIuTUFYX1ZBTFVFLCBOdW1iZXIuTUFYX1ZBTFVFLCBOdW1iZXIuTUFYX1ZBTFVFLCBOdW1iZXIuTUFYX1ZBTFVFKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmVsZW1lbnRDb3VudDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHNjYWxhciA9IHRoaXMuZ2V0U2NhbGFyKGksIHt9KTtcbiAgICAgICAgaWYgKHRoaXMuX19tYXguX3ZbMF0gPCBzY2FsYXIpIHtcbiAgICAgICAgICB0aGlzLl9fbWF4Ll92WzBdID0gc2NhbGFyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzY2FsYXIgPCB0aGlzLl9fbWluLl92WzBdKSB7XG4gICAgICAgICAgdGhpcy5fX21pbi5fdlswXSA9IHNjYWxhcjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9faXNNaW5NaXhEaXJ0eSA9IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgd2hldGhlciB0aGUgbWluL21heCB2YWx1ZXMgYXJlIGRpcnR5IGFuZCBuZWVkIHJlY2FsY3VsYXRpb24uXG4gICAqIEByZXR1cm5zIFRydWUgaWYgbWluL21heCB2YWx1ZXMgYXJlIGRpcnR5XG4gICAqL1xuICBnZXQgaXNNaW5NYXhEaXJ0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2lzTWluTWl4RGlydHk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmVyc2lvbiBudW1iZXIgb2YgdGhpcyBhY2Nlc3Nvci5cbiAgICogSW5jcmVtZW50cyB3aGVuIGRhdGEgaXMgbW9kaWZpZWQuXG4gICAqIEByZXR1cm5zIFRoZSB2ZXJzaW9uIG51bWJlclxuICAgKi9cbiAgZ2V0IHZlcnNpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX192ZXJzaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGFjdHVhbCBieXRlIHN0cmlkZSwgYWNjb3VudGluZyBmb3IgemVybyBzdHJpZGUuXG4gICAqIEByZXR1cm5zIFRoZSBhY3R1YWwgYnl0ZSBzdHJpZGVcbiAgICovXG4gIGdldCBhY3R1YWxCeXRlU3RyaWRlKCkge1xuICAgIGlmICh0aGlzLl9fYnl0ZVN0cmlkZSA9PT0gMCkge1xuICAgICAgY29uc3QgYWN0dWFsQnl0ZVN0cmlkZSA9XG4gICAgICAgIHRoaXMuX19jb21wb3NpdGlvblR5cGUuZ2V0TnVtYmVyT2ZDb21wb25lbnRzKCkgKiB0aGlzLl9fY29tcG9uZW50VHlwZS5nZXRTaXplSW5CeXRlcygpICogdGhpcy5fX2FycmF5TGVuZ3RoO1xuICAgICAgcmV0dXJuIGFjdHVhbEJ5dGVTdHJpZGU7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fYnl0ZVN0cmlkZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBhY2Nlc3NvciBpcyB0aGUgc2FtZSBhcyBhbm90aGVyIGFjY2Vzc29yLlxuICAgKiBDb21wYXJlcyBieXRlIGxlbmd0aCwgb2Zmc2V0LCBhbmQgdW5kZXJseWluZyBidWZmZXIuXG4gICAqIEBwYXJhbSBybkFjY2Vzc29yIC0gVGhlIGFjY2Vzc29yIHRvIGNvbXBhcmUgd2l0aFxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBhY2Nlc3NvcnMgYXJlIHRoZSBzYW1lXG4gICAqL1xuICBpc1NhbWUocm5BY2Nlc3NvcjogQWNjZXNzb3IpOiBib29sZWFuIHtcbiAgICByZXR1cm4gKFxuICAgICAgdGhpcy5ieXRlTGVuZ3RoID09PSBybkFjY2Vzc29yLmJ5dGVMZW5ndGggJiZcbiAgICAgIHRoaXMuYnl0ZU9mZnNldEluUmF3QXJyYXlCdWZmZXJPZkJ1ZmZlciA9PT0gcm5BY2Nlc3Nvci5ieXRlT2Zmc2V0SW5SYXdBcnJheUJ1ZmZlck9mQnVmZmVyICYmXG4gICAgICB0aGlzLmJ1ZmZlclZpZXcuYnVmZmVyLmdldEFycmF5QnVmZmVyKCkgPT09IHJuQWNjZXNzb3IuYnVmZmVyVmlldy5idWZmZXIuZ2V0QXJyYXlCdWZmZXIoKVxuICAgICk7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFXQSxTQUFTLHFCQUE2QztBQUN0RCxTQUFTLHVCQUFpRDtBQUUxRCxTQUFTLGdCQUFnQjtBQUd6QixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHNCQUFzQjtBQUMvQixTQUFTLHNCQUFzQjtBQUMvQixTQUFTLHNCQUFzQjtBQUMvQixTQUFTLGVBQWU7QUFDeEIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsZUFBZTtBQUN4QixTQUFTLFVBQVU7QUFDbkIsU0FBUyxjQUFjO0FBZ0JoQixJQUFNLFlB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QUFBQSxNQUN2RCxLQUFLYSxHQUFpQixLQUFLYixLQUFlLFFBQVEsSUFBSSxVQUFVLE1BQU07QUFBQSxNQUN0RSxLQUFLYSxHQUFpQixLQUFLYixLQUFlLFFBQVEsSUFBSSxVQUFVLE1BQU07QUFBQSxNQUN0RSxLQUFLYSxHQUFpQixLQUFLYixLQUFlLFFBQVEsSUFBSSxVQUFVLE1BQU07QUFBQSxNQUN0RSxLQUFLYSxHQUFpQixLQUFLYixLQUFlLFFBQVEsSUFBSSxVQUFVLE1BQU07QUFBQSxNQUN0RSxLQUFLYSxHQUFpQixLQUFLYixLQUFlLFFBQVEsSUFBSSxVQUFVLE1BQU07QUFBQSxNQUN0RSxLQUFLYSxHQUFpQixLQUFLYixLQUFlLFFBQVEsSUFBSSxVQUFVLE1BQU07QUFBQSxNQUN0RSxLQUFLYSxHQUFpQixLQUFLYixLQUFlLFFBQVEsSUFBSSxVQUFVLE1BQU07QUFBQSxNQUN0RSxLQUFLYSxHQUFpQixLQUFLYixLQUFlLFFBQVEsSUFBSSxVQUFVLE1BQU07QUFBQSxNQUN0RSxLQUFLYSxHQUFpQixLQUFLYixLQUFlLFFBQVEsSUFBSSxVQUFVLE1BQU07QUFBQSxNQUN0RSxLQUFLYSxHQUFpQixLQUFLYixLQUFlLFFBQVEsS0FBSyxVQUFVLE1BQU07QUFBQSxNQUN2RSxLQUFLYSxHQUFpQixLQUFLYixLQUFlLFFBQVEsS0FBSyxVQUFVLE1BQU07QUFBQSxNQUN2RSxLQUFLYSxHQUFpQixLQUFLYixLQUFlLFFBQVEsS0FBSyxVQUFVLE1BQU07QUFBQSxNQUN2RSxLQUFLYSxHQUFpQixLQUFLYixLQUFlLFFBQVEsS0FBSyxVQUFVLE1BQU07QUFBQSxNQUN2RSxLQUFLYSxHQUFpQixLQUFLYixLQUFlLFFBQVEsS0FBSyxVQUFVLE1BQU07QUFBQSxNQUN2RSxLQUFLYSxHQUFpQixLQUFLYixLQUFlLFFBQVEsS0FBSyxVQUFVLE1BQU07QUFBQSxJQUN6RTtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLFVBQVUsR0FBVSxPQUFlLEVBQUUsaUJBQWlCLFNB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L0IsS0FBSyx1Q0FBdUMsV0FBVyxzQ0FDdkQsS0FBSyxXQUFXLE9BQU8sZUFBZSxNQUFNLFdBQVcsV0FBVyxPQUFPLGVBQWU7QUFBQSxFQUU1RjtBQUNGO0FBbG1EYSxVQThCSWlCLEtBQWlCLGVBQWUsS0FBSztBQTlCekMsVUErQklDLEtBQWlCLGVBQWUsS0FBSztBQS9CekMsVUFnQ0lDLEtBQWlCLGVBQWUsS0FBSztBQWhDL0MsSUFBTSxXQUFOOyIsCiAgIm5hbWVzIjogWyJfX2NvbXBvc2l0aW9uVHlwZSIsICJfX2NvbXBvbmVudFR5cGUiLCAiX19jb3VudCIsICJfX3R5cGVkQXJyYXkiLCAiX190YWtlbkNvdW50IiwgIl9fYnl0ZVN0cmlkZSIsICJfX21heCIsICJfX21pbiIsICJfX2FycmF5TGVuZ3RoIiwgIl9fbm9ybWFsaXplZCIsICJfX2lzTWluTWl4RGlydHkiLCAiX192ZXJzaW9uIiwgIl9fYnVmZmVyVmlldyIsICJfX2J5dGVPZmZzZXRJblJhd0FycmF5QnVmZmVyT2ZCdWZmZXIiLCAiX19yYXciLCAiX190eXBlZEFycmF5Q2xhc3MiLCAiX19kYXRhVmlldyIsICJfX2NvcHlCdWZmZXJEYXRhVG9UeXBlZEFycmF5IiwgIl9fZGF0YVZpZXdHZXR0ZXIiLCAiX19kYXRhVmlld1NldHRlciIsICJfX29uVXBkYXRlZCIsICJfX2NhbGNNaW5NYXgiLCAiX190bXBWZWN0b3I0XzAiLCAiX190bXBWZWN0b3IzXzAiLCAiX190bXBWZWN0b3IyXzAiXQp9Cg==
