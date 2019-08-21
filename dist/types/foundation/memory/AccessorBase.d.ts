import { ComponentTypeEnum } from "../definitions/ComponentType";
import { CompositionTypeEnum } from "../definitions/CompositionType";
import RnObject from "../core/RnObject";
import BufferView from "./BufferView";
import Vector2 from "../math/Vector2";
import Vector3 from "../math/Vector3";
import Vector4 from "../math/Vector4";
import Matrix33 from "../math/Matrix33";
import MutableMatrix44 from "../math/MutableMatrix44";
import Accessor from "./Accessor";
import { Byte, Index, Count, TypedArrayConstructor, TypedArray, Size } from "../../types/CommonTypes";
export default class AccessorBase extends RnObject {
    protected __bufferView: BufferView;
    protected __byteOffsetInBuffer: number;
    protected __compositionType: CompositionTypeEnum;
    protected __componentType: ComponentTypeEnum;
    protected __count: Count;
    protected __raw: ArrayBuffer;
    protected __dataView?: DataView;
    protected __typedArray?: TypedArray;
    protected __takenCount: Count;
    protected __byteStride: Byte;
    protected __typedArrayClass?: TypedArrayConstructor;
    protected __dataViewGetter: any;
    protected __dataViewSetter: any;
    protected __max?: any;
    protected __min?: any;
    protected __arrayLength: number;
    constructor({ bufferView, byteOffset, compositionType, componentType, byteStride, count, raw, max, min, arrayLength }: {
        bufferView: BufferView;
        byteOffset: Byte;
        compositionType: CompositionTypeEnum;
        componentType: ComponentTypeEnum;
        byteStride: Byte;
        count: Count;
        raw: Uint8Array;
        max?: number;
        min?: number;
        arrayLength: Size;
    });
    prepare(): void;
    getTypedArrayClass(componentType: ComponentTypeEnum): TypedArrayConstructor | undefined;
    getDataViewGetter(componentType: ComponentTypeEnum): string | undefined;
    getDataViewSetter(componentType: ComponentTypeEnum): string | undefined;
    takeOne(): TypedArray;
    readonly takenCount: Count;
    readonly numberOfComponents: number;
    readonly componentSizeInBytes: number;
    readonly elementSizeInBytes: number;
    readonly elementCount: Count;
    readonly byteLength: Byte;
    readonly componentType: ComponentTypeEnum;
    readonly compositionType: CompositionTypeEnum;
    getTypedArray(): TypedArray;
    readonly isAoS: boolean;
    readonly isSoA: boolean;
    readonly byteStride: number;
    getScalar(i: Index, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): number;
    getScalarAt(i: Index, compositionOffset: Index, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): number;
    getVec2AsArray(i: Index, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): Array<number>;
    getVec3AsArray(i: Index, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): Array<number>;
    getVec4AsArray(i: Index, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): Array<number>;
    getMat3AsArray(i: Index, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): Array<number>;
    getMat4AsArray(i: Index, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): Array<number>;
    getVec2(i: Index, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): Vector2;
    getVec3(i: Index, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): Vector3;
    getVec4(i: Index, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): Vector4;
    getMat3(i: Index, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): Matrix33;
    getMat4(i: Index, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): MutableMatrix44;
    setScalar(i: Index, value: number, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): void;
    setVec2(i: Index, x: number, y: number, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): void;
    setVec3(i: Index, x: number, y: number, z: number, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): void;
    setVec4(i: Index, x: number, y: number, z: number, w: number, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): void;
    setVec2AsVector(i: Index, vec: Vector2, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): void;
    setVec3AsVector(i: Index, vec: Vector3, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): void;
    setVec4AsVector(i: Index, vec: Vector4, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): void;
    copyFromTypedArray(typedArray: TypedArray): void;
    setScalarAt(i: Index, conpositionOffset: Index, value: number, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): void;
    setElementFromSameCompositionAccessor(i: Index, accessor: Accessor, secondIdx?: Index): void;
    setElementFromAccessor(i: Index, accessor: Accessor, secondIdx?: Index): void;
    addElementFromSameCompositionAccessor(i: Index, accessor: Accessor, coeff: number, secondIdx?: Index): void;
    readonly arrayBufferOfBufferView: ArrayBuffer;
    readonly dataViewOfBufferView: DataView;
    readonly byteOffsetInBufferView: Byte;
    readonly byteOffsetInBuffer: Byte;
    readonly bufferView: BufferView;
    readonly min: any;
    readonly max: any;
    calcMinMax(): void;
}
