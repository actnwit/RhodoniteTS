import type { Array2, Array3, Array4, Byte, Count, Index, Size, TypedArray, TypedArrayConstructor } from '../../types/CommonTypes';
import { type ComponentTypeEnum } from '../definitions/ComponentType';
import { type CompositionTypeEnum } from '../definitions/CompositionType';
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
import type { BufferView } from './BufferView';
export type IndicesAccessOption = {
    indicesAccessor?: Accessor;
    endian?: boolean;
};
/**
 * Accessor class provides a high-level interface for reading and writing data from/to a BufferView.
 * It handles different data types (scalar, vector, matrix) and provides type-safe access to buffer data.
 * This class is commonly used in 3D graphics applications for managing vertex attributes, indices, and other buffer data.
 */
export declare class Accessor {
    private __bufferView;
    private __byteOffsetInRawArrayBufferOfBuffer;
    private __compositionType;
    private __componentType;
    private __count;
    private __raw;
    private __dataView?;
    private __typedArray;
    private __takenCount;
    private __byteStride;
    private __typedArrayClass?;
    private __dataViewGetter;
    private __dataViewSetter;
    private __max;
    private __min;
    private __arrayLength;
    private __normalized;
    private __isMinMixDirty;
    private static __tmpVector4_0;
    private static __tmpVector3_0;
    private static __tmpVector2_0;
    private __version;
    _primitive?: WeakRef<Primitive>;
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
    constructor({ bufferView, byteOffsetInBufferView, compositionType, componentType, byteStride, count, raw, max, min, arrayLength, normalized, }: {
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
    });
    /**
     * Copies buffer data to a typed array when byte alignment doesn't match.
     * This is necessary when the buffer offset is not aligned with the typed array's BYTES_PER_ELEMENT.
     * @private
     */
    private __copyBufferDataToTypedArray;
    /**
     * Called when the accessor data is updated. Increments version and notifies associated primitives.
     * @private
     */
    private __onUpdated;
    /**
     * Gets the appropriate TypedArray constructor for the given component type.
     * @param componentType - The component type to get the constructor for
     * @returns The TypedArray constructor class, or undefined if unknown
     */
    getTypedArrayClass(componentType: ComponentTypeEnum): TypedArrayConstructor | undefined;
    /**
     * Gets the DataView getter method name for the given component type.
     * @param componentType - The component type to get the getter for
     * @returns The DataView getter method name, or undefined if unknown
     */
    getDataViewGetter(componentType: ComponentTypeEnum): string | undefined;
    /**
     * Gets the DataView setter method name for the given component type.
     * @param componentType - The component type to get the setter for
     * @returns The DataView setter method name, or undefined if unknown
     */
    getDataViewSetter(componentType: ComponentTypeEnum): string | undefined;
    /**
     * Takes one element from the accessor and returns a TypedArray view of it.
     * This method allocates a new view for the next available element.
     * @returns A TypedArray view of the taken element
     * @throws Error if trying to allocate more elements than available
     */
    takeOne(): TypedArray;
    /**
     * Takes an existing element at the specified index and returns a TypedArray view of it.
     * This method creates a view for an element that has already been allocated.
     * @param idx - The index of the element to take
     * @returns A TypedArray view of the element at the specified index
     * @throws Error if the index exceeds the available element count
     * @private
     */
    _takeExistedOne(idx: number): TypedArray;
    /**
     * Gets the number of elements that have been taken from this accessor.
     * @returns The count of taken elements
     */
    get takenCount(): Count;
    /**
     * Gets the number of components per element (e.g., 3 for Vec3, 4 for Vec4).
     * @returns The number of components
     */
    get numberOfComponents(): number;
    /**
     * Gets the size in bytes of each component.
     * @returns The component size in bytes
     */
    get componentSizeInBytes(): number;
    /**
     * Gets the size in bytes of each element (numberOfComponents * componentSizeInBytes).
     * @returns The element size in bytes
     */
    get elementSizeInBytes(): number;
    /**
     * Gets the total number of elements in this accessor.
     * Each element may be a scalar, vec2, vec3, vec4, matrix, etc.
     * @returns The element count
     */
    get elementCount(): Count;
    /**
     * Gets the total byte length of all data in this accessor.
     * @returns The byte length
     */
    get byteLength(): Byte;
    /**
     * Gets the component type of this accessor.
     * @returns The component type enum
     */
    get componentType(): ComponentTypeEnum;
    /**
     * Gets the composition type of this accessor.
     * @returns The composition type enum
     */
    get compositionType(): CompositionTypeEnum;
    /**
     * Gets the underlying TypedArray for this accessor.
     * Note: If the buffer view uses interleaved data (AoS), direct access may not work as expected.
     * @returns The TypedArray containing the data
     */
    getTypedArray(): TypedArray;
    /**
     * Sets the data from a TypedArray into this accessor.
     * If the provided array uses the same buffer, no copying is needed.
     * Otherwise, data is copied element by element with proper type conversion.
     * @param typedArray - The TypedArray to copy data from
     */
    setTypedArray(typedArray: TypedArray): void;
    /**
     * Gets a Uint8Array view of this accessor's data.
     * Useful for raw byte-level access to the buffer data.
     * @returns A Uint8Array view of the accessor's data
     */
    getUint8Array(): Uint8Array;
    /**
     * Checks if this accessor uses Array of Structures (AoS) layout.
     * AoS means data is interleaved (e.g., XYZXYZXYZ for positions).
     * @returns True if using AoS layout
     */
    get isAoS(): boolean;
    /**
     * Checks if this accessor uses Structure of Arrays (SoA) layout.
     * SoA means data is tightly packed (e.g., XXXYYYZZZ for positions).
     * @returns True if using SoA layout
     */
    get isSoA(): boolean;
    /**
     * Gets the byte stride between elements.
     * For tightly packed data, this equals elementSizeInBytes.
     * For interleaved data, this may be larger.
     * @returns The byte stride
     */
    get byteStride(): number;
    /**
     * Gets a scalar value at the specified index.
     * @param i - The element index
     * @param options - Access options including indices accessor and endianness
     * @returns The scalar value
     */
    getScalar(i: Index, { indicesAccessor, endian }: IndicesAccessOption): number;
    /**
     * Gets a scalar value at the specified index with a composition offset.
     * @param i - The element index
     * @param compositionOffset - Byte offset within the element
     * @param options - Access options including indices accessor and endianness
     * @returns The scalar value
     */
    getScalarAt(i: Index, compositionOffset: Index, { indicesAccessor, endian }: IndicesAccessOption): number;
    /**
     * Gets a 2D vector as an array at the specified index.
     * @param i - The element index
     * @param options - Access options including indices accessor and endianness
     * @returns A 2-element array containing the vector components
     */
    getVec2AsArray(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Array2<number>;
    /**
     * Gets a 3D vector as an array at the specified index.
     * @param i - The element index
     * @param options - Access options including indices accessor and endianness
     * @returns A 3-element array containing the vector components
     */
    getVec3AsArray(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Array3<number>;
    /**
     * Gets a 4D vector as an array at the specified index.
     * @param i - The element index
     * @param options - Access options including indices accessor and endianness
     * @returns A 4-element array containing the vector components
     */
    getVec4AsArray(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Array4<number>;
    /**
     * Gets a 3x3 matrix as an array at the specified index.
     * @param i - The element index
     * @param options - Access options including indices accessor and endianness
     * @returns A 9-element array containing the matrix components in row-major order
     */
    getMat3AsArray(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Array<number>;
    /**
     * Gets a 4x4 matrix as an array at the specified index.
     * @param i - The element index
     * @param options - Access options including indices accessor and endianness
     * @returns A 16-element array containing the matrix components in row-major order
     */
    getMat4AsArray(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Array<number>;
    /**
     * Gets a 2D vector object at the specified index.
     * @param i - The element index
     * @param options - Access options including indices accessor and endianness
     * @returns A Vector2 object containing the vector components
     */
    getVec2(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Vector2;
    /**
     * Gets a 3D vector object at the specified index.
     * @param i - The element index
     * @param options - Access options including indices accessor and endianness
     * @returns A Vector3 object containing the vector components
     */
    getVec3(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Vector3;
    /**
     * Gets a 4D vector object at the specified index.
     * @param i - The element index
     * @param options - Access options including indices accessor and endianness
     * @returns A Vector4 object containing the vector components
     */
    getVec4(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Vector4;
    /**
     * Gets a 3x3 matrix object at the specified index.
     * @param i - The element index
     * @param options - Access options including indices accessor and endianness
     * @returns A Matrix33 object containing the matrix components
     */
    getMat3(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Matrix33;
    /**
     * Gets a 4x4 matrix object at the specified index.
     * @param i - The element index
     * @param options - Access options including indices accessor and endianness
     * @returns A MutableMatrix44 object containing the matrix components
     */
    getMat4(i: Index, { indicesAccessor, endian }: IndicesAccessOption): MutableMatrix44;
    /**
     * Gets a 2D vector at the specified index and stores it in the provided output object.
     * This method avoids creating new objects and is more memory-efficient.
     * @param i - The element index
     * @param out - The output MutableVector2 object to store the result
     * @param options - Access options including indices accessor and endianness
     * @returns The output Vector2 object (same as the out parameter)
     */
    getVec2To(i: Index, out: MutableVector2, { indicesAccessor, endian }: IndicesAccessOption): Vector2;
    /**
     * Gets a 3D vector at the specified index and stores it in the provided output object.
     * This method avoids creating new objects and is more memory-efficient.
     * @param i - The element index
     * @param out - The output MutableVector3 object to store the result
     * @param options - Access options including indices accessor and endianness
     * @returns The output Vector3 object (same as the out parameter)
     */
    getVec3To(i: Index, out: MutableVector3, { indicesAccessor, endian }: IndicesAccessOption): Vector3;
    /**
     * Gets a 4D vector at the specified index and stores it in the provided output object.
     * This method avoids creating new objects and is more memory-efficient.
     * @param i - The element index
     * @param out - The output MutableVector4 object to store the result
     * @param options - Access options including indices accessor and endianness
     * @returns The output Vector4 object (same as the out parameter)
     */
    getVec4To(i: Index, out: MutableVector4, { indicesAccessor, endian }: IndicesAccessOption): Vector4;
    /**
     * Gets a 3x3 matrix at the specified index and stores it in the provided output object.
     * This method avoids creating new objects and is more memory-efficient.
     * @param i - The element index
     * @param out - The output MutableMatrix33 object to store the result
     * @param options - Access options including indices accessor and endianness
     * @returns The output Matrix33 object (same as the out parameter)
     */
    getMat3To(i: Index, out: MutableMatrix33, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): Matrix33;
    /**
     * Gets a 4x4 matrix at the specified index and stores it in the provided output object.
     * This method avoids creating new objects and is more memory-efficient.
     * @param i - The element index
     * @param out - The output MutableMatrix44 object to store the result
     * @param options - Access options including indices accessor and endianness
     * @returns The output MutableMatrix44 object (same as the out parameter)
     */
    getMat4To(i: Index, out: MutableMatrix44, { indicesAccessor, endian }: IndicesAccessOption): MutableMatrix44;
    /**
     * Sets a scalar value at the specified index.
     * @param i - The element index
     * @param value - The scalar value to set
     * @param options - Access options including indices accessor and endianness
     */
    setScalar(i: Index, value: number, { indicesAccessor, endian }: IndicesAccessOption): void;
    /**
     * Sets a 2D vector at the specified index.
     * @param i - The element index
     * @param x - The X component value
     * @param y - The Y component value
     * @param options - Access options including indices accessor and endianness
     */
    setVec2(i: Index, x: number, y: number, { indicesAccessor, endian }: IndicesAccessOption): void;
    /**
     * Sets a 3D vector at the specified index.
     * @param i - The element index
     * @param x - The X component value
     * @param y - The Y component value
     * @param z - The Z component value
     * @param options - Access options including indices accessor and endianness
     */
    setVec3(i: Index, x: number, y: number, z: number, { indicesAccessor, endian }: IndicesAccessOption): void;
    /**
     * Sets a 4D vector at the specified index.
     * @param i - The element index
     * @param x - The X component value
     * @param y - The Y component value
     * @param z - The Z component value
     * @param w - The W component value
     * @param options - Access options including indices accessor and endianness
     */
    setVec4(i: Index, x: number, y: number, z: number, w: number, { indicesAccessor, endian }: IndicesAccessOption): void;
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
    setMat3(i: Index, v0: number, v1: number, v2: number, v3: number, v4: number, v5: number, v6: number, v7: number, v8: number, { indicesAccessor, endian }: IndicesAccessOption): void;
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
    setMat4(i: Index, v0: number, v1: number, v2: number, v3: number, v4: number, v5: number, v6: number, v7: number, v8: number, v9: number, v10: number, v11: number, v12: number, v13: number, v14: number, v15: number, { indicesAccessor, endian }: IndicesAccessOption): void;
    /**
     * Sets a 2D vector at the specified index using a Vector2 object.
     * @param i - The element index
     * @param vec - The Vector2 object containing the values to set
     * @param options - Access options including indices accessor and endianness
     */
    setVec2AsVector(i: Index, vec: Vector2, { indicesAccessor, endian }: IndicesAccessOption): void;
    /**
     * Sets a 3D vector at the specified index using a Vector3 object.
     * @param i - The element index
     * @param vec - The Vector3 object containing the values to set
     * @param options - Access options including indices accessor and endianness
     */
    setVec3AsVector(i: Index, vec: Vector3, { indicesAccessor, endian }: IndicesAccessOption): void;
    /**
     * Sets a 4D vector at the specified index using a Vector4 object.
     * @param i - The element index
     * @param vec - The Vector4 object containing the values to set
     * @param options - Access options including indices accessor and endianness
     */
    setVec4AsVector(i: Index, vec: Vector4, { indicesAccessor, endian }: IndicesAccessOption): void;
    /**
     * Sets a 4x4 matrix at the specified index using a Matrix44 object.
     * @param i - The element index
     * @param mat - The Matrix44 object containing the values to set
     * @param options - Access options including indices accessor and endianness
     */
    setMat4AsMatrix44(i: Index, mat: Matrix44, { indicesAccessor, endian }: IndicesAccessOption): void;
    /**
     * Copies data from a TypedArray into this accessor.
     * The data is copied element by element with proper type conversion.
     * @param typedArray - The TypedArray to copy data from
     */
    copyFromTypedArray(typedArray: TypedArray): void;
    /**
     * Sets a scalar value at the specified index with a composition offset.
     * @param i - The element index
     * @param compositionOffset - Byte offset within the element
     * @param value - The scalar value to set
     * @param options - Access options including indices accessor and endianness
     */
    setScalarAt(i: Index, compositionOffset: Index, value: number, { indicesAccessor, endian }: IndicesAccessOption): void;
    /**
     * Sets an element from another accessor with the same composition type.
     * @param i - The target element index
     * @param accessor - The source accessor to copy from
     * @param secondIdx - Optional source index (defaults to i)
     */
    setElementFromSameCompositionAccessor(i: Index, accessor: Accessor, secondIdx?: Index): void;
    /**
     * Copies the entire buffer from another accessor.
     * @param accessor - The source accessor to copy the buffer from
     */
    copyBuffer(accessor: Accessor): void;
    /**
     * Sets an element from another accessor, handling different composition types.
     * Automatically converts between different vector/scalar types as needed.
     * @param i - The target element index
     * @param accessor - The source accessor to copy from
     * @param secondIdx - Optional source index (defaults to i)
     */
    setElementFromAccessor(i: Index, accessor: Accessor, secondIdx?: Index): void;
    /**
     * Adds an element from another accessor with the same composition type, scaled by a coefficient.
     * @param i - The target element index
     * @param accessor - The source accessor to add from
     * @param coeff - The coefficient to multiply the source values by
     * @param secondIdx - Optional source index (defaults to i)
     */
    addElementFromSameCompositionAccessor(i: Index, accessor: Accessor, coeff: number, secondIdx?: Index): void;
    /**
     * Gets the underlying ArrayBuffer of the buffer view.
     * @returns The ArrayBuffer containing the data
     */
    get arrayBufferOfBufferView(): ArrayBuffer;
    /**
     * Gets the DataView of the buffer view.
     * @returns The DataView for accessing the buffer data
     */
    get dataViewOfBufferView(): DataView;
    /**
     * Gets the byte offset within the buffer view.
     * @returns The byte offset in the buffer view
     */
    get byteOffsetInBufferView(): Byte;
    /**
     * Gets the byte offset within the buffer.
     * @returns The byte offset in the buffer
     */
    get byteOffsetInBuffer(): Byte;
    /**
     * Gets the byte offset in the raw ArrayBuffer of the buffer.
     * @returns The byte offset in the raw ArrayBuffer
     */
    get byteOffsetInRawArrayBufferOfBuffer(): number;
    /**
     * Gets the BufferView that contains this accessor's data.
     * @returns The BufferView object
     */
    get bufferView(): BufferView;
    /**
     * Sets the minimum and maximum values for this accessor.
     * @param min - Array of minimum values for each component
     * @param max - Array of maximum values for each component
     */
    setMinMax(min: number[], max: number[]): void;
    /**
     * Gets the minimum values for each component.
     * Calculates min/max if dirty.
     * @returns Array of minimum values
     */
    get min(): number[];
    /**
     * Gets the maximum values for each component.
     * Calculates min/max if dirty.
     * @returns Array of maximum values
     */
    get max(): number[];
    /**
     * Gets whether the data should be normalized.
     * @returns True if data should be normalized
     */
    get normalized(): boolean;
    /**
     * Calculates the minimum and maximum values for all elements.
     * @private
     */
    private __calcMinMax;
    /**
     * Gets whether the min/max values are dirty and need recalculation.
     * @returns True if min/max values are dirty
     */
    get isMinMaxDirty(): boolean;
    /**
     * Gets the version number of this accessor.
     * Increments when data is modified.
     * @returns The version number
     */
    get version(): number;
    /**
     * Gets the actual byte stride, accounting for zero stride.
     * @returns The actual byte stride
     */
    get actualByteStride(): number;
    /**
     * Checks if this accessor is the same as another accessor.
     * Compares byte length, offset, and underlying buffer.
     * @param rnAccessor - The accessor to compare with
     * @returns True if the accessors are the same
     */
    isSame(rnAccessor: Accessor): boolean;
}
