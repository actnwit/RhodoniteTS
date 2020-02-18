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
import { Byte, Index, Count, TypedArrayConstructor, TypedArray, Size } from "../../commontypes/CommonTypes";
export default class AccessorBase extends RnObject {
    protected __bufferView: BufferView;
    protected __byteOffsetInRawArrayBufferOfBuffer: number;
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
        raw: ArrayBuffer;
        max?: number;
        min?: number;
        arrayLength: Size;
    });
    prepare(): void;
    getTypedArrayClass(componentType: ComponentTypeEnum): TypedArrayConstructor | undefined;
    getDataViewGetter(componentType: ComponentTypeEnum): string | undefined;
    getDataViewSetter(componentType: ComponentTypeEnum): string | undefined;
    takeOne(): TypedArray;
    get takenCount(): Count;
    get numberOfComponents(): number;
    get componentSizeInBytes(): number;
    get elementSizeInBytes(): number;
    get elementCount(): Count;
    get byteLength(): Byte;
    get componentType(): ComponentTypeEnum;
    get compositionType(): CompositionTypeEnum;
    getTypedArray(): TypedArray;
    get isAoS(): boolean;
    get isSoA(): boolean;
    get byteStride(): number;
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
    setScalarAt(i: Index, compositionOffset: Index, value: number, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): void;
    setElementFromSameCompositionAccessor(i: Index, accessor: Accessor, secondIdx?: Index): void;
    setElementFromAccessor(i: Index, accessor: Accessor, secondIdx?: Index): void;
    addElementFromSameCompositionAccessor(i: Index, accessor: Accessor, coeff: number, secondIdx?: Index): void;
    get arrayBufferOfBufferView(): ArrayBuffer;
    get dataViewOfBufferView(): DataView;
    get byteOffsetInBufferView(): Byte;
    get byteOffsetInBuffer(): Byte;
    get byteOffsetInRawArrayBufferOfBuffer(): number;
    get bufferView(): BufferView;
    get min(): any;
    get max(): any;
    calcMinMax(): void;
}
