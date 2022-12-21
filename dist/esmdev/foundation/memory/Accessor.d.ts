import { ComponentTypeEnum } from '../definitions/ComponentType';
import { CompositionTypeEnum } from '../definitions/CompositionType';
import { BufferView } from './BufferView';
import { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';
import { Vector4 } from '../math/Vector4';
import { MutableVector2 } from '../math/MutableVector2';
import { MutableVector3 } from '../math/MutableVector3';
import { MutableVector4 } from '../math/MutableVector4';
import { Matrix33 } from '../math/Matrix33';
import { MutableMatrix33 } from '../math/MutableMatrix33';
import { MutableMatrix44 } from '../math/MutableMatrix44';
import { Byte, Index, Count, TypedArray, Size, TypedArrayConstructor, Array2, Array3, Array4 } from '../../types/CommonTypes';
import { Matrix44 } from '../math/Matrix44';
export declare type IndicesAccessOption = {
    indicesAccessor?: Accessor;
    endian?: boolean;
};
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
    getTypedArrayClass(componentType: ComponentTypeEnum): TypedArrayConstructor | undefined;
    getDataViewGetter(componentType: ComponentTypeEnum): string | undefined;
    getDataViewSetter(componentType: ComponentTypeEnum): string | undefined;
    takeOne(): TypedArray;
    get takenCount(): Count;
    get numberOfComponents(): number;
    get componentSizeInBytes(): number;
    get elementSizeInBytes(): number;
    /**
     * get element count
     * element may be scalar, vec2, vec3, vec4, ...
     */
    get elementCount(): Count;
    get byteLength(): Byte;
    get componentType(): ComponentTypeEnum;
    get compositionType(): CompositionTypeEnum;
    /**
     *
     * @returns
     */
    getTypedArray(): TypedArray;
    getUint8Array(): Uint8Array;
    get isAoS(): boolean;
    get isSoA(): boolean;
    get byteStride(): number;
    getScalar(i: Index, { indicesAccessor, endian }: IndicesAccessOption): number;
    getScalarAt(i: Index, compositionOffset: Index, { indicesAccessor, endian }: IndicesAccessOption): number;
    getVec2AsArray(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Array2<number>;
    getVec3AsArray(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Array3<number>;
    getVec4AsArray(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Array4<number>;
    getMat3AsArray(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Array<number>;
    getMat4AsArray(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Array<number>;
    getVec2(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Vector2;
    getVec3(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Vector3;
    getVec4(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Vector4;
    getMat3(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Matrix33;
    getMat4(i: Index, { indicesAccessor, endian }: IndicesAccessOption): MutableMatrix44;
    getVec2To(i: Index, out: MutableVector2, { indicesAccessor, endian }: IndicesAccessOption): Vector2;
    getVec3To(i: Index, out: MutableVector3, { indicesAccessor, endian }: IndicesAccessOption): Vector3;
    getVec4To(i: Index, out: MutableVector4, { indicesAccessor, endian }: IndicesAccessOption): Vector4;
    getMat3To(i: Index, out: MutableMatrix33, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): Matrix33;
    getMat4To(i: Index, out: MutableMatrix44, { indicesAccessor, endian }: IndicesAccessOption): MutableMatrix44;
    setScalar(i: Index, value: number, { indicesAccessor, endian }: IndicesAccessOption): void;
    setVec2(i: Index, x: number, y: number, { indicesAccessor, endian }: IndicesAccessOption): void;
    setVec3(i: Index, x: number, y: number, z: number, { indicesAccessor, endian }: IndicesAccessOption): void;
    setVec4(i: Index, x: number, y: number, z: number, w: number, { indicesAccessor, endian }: IndicesAccessOption): void;
    setMat4(i: Index, v0: number, v1: number, v2: number, v3: number, v4: number, v5: number, v6: number, v7: number, v8: number, v9: number, v10: number, v11: number, v12: number, v13: number, v14: number, v15: number, { indicesAccessor, endian }: IndicesAccessOption): void;
    setVec2AsVector(i: Index, vec: Vector2, { indicesAccessor, endian }: IndicesAccessOption): void;
    setVec3AsVector(i: Index, vec: Vector3, { indicesAccessor, endian }: IndicesAccessOption): void;
    setVec4AsVector(i: Index, vec: Vector4, { indicesAccessor, endian }: IndicesAccessOption): void;
    setMat4AsMatrix44(i: Index, mat: Matrix44, { indicesAccessor, endian }: IndicesAccessOption): void;
    copyFromTypedArray(typedArray: TypedArray): void;
    setScalarAt(i: Index, compositionOffset: Index, value: number, { indicesAccessor, endian }: IndicesAccessOption): void;
    setElementFromSameCompositionAccessor(i: Index, accessor: Accessor, secondIdx?: Index): void;
    copyBuffer(accessor: Accessor): void;
    setElementFromAccessor(i: Index, accessor: Accessor, secondIdx?: Index): void;
    addElementFromSameCompositionAccessor(i: Index, accessor: Accessor, coeff: number, secondIdx?: Index): void;
    get arrayBufferOfBufferView(): ArrayBuffer;
    get dataViewOfBufferView(): DataView;
    get byteOffsetInBufferView(): Byte;
    get byteOffsetInBuffer(): Byte;
    get byteOffsetInRawArrayBufferOfBuffer(): number;
    get bufferView(): BufferView;
    get min(): number[];
    get max(): number[];
    get normalized(): boolean;
    calcMinMax(): void;
    get isMinMaxDirty(): boolean;
    get version(): number;
    get actualByteStride(): number;
    isSame(rnAccessor: Accessor): boolean;
}
