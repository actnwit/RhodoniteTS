import RnObject from "../core/RnObject";
import Buffer from "../memory/Buffer";
import Accessor from "./AccessorBase";
import { CompositionTypeEnum } from "../definitions/CompositionType";
import { ComponentTypeEnum } from "../definitions/ComponentType";
import FlexibleAccessor from "./FlexibleAccessor";
export default class BufferView extends RnObject {
    private __buffer;
    private __byteOffset;
    private __byteLength;
    private __byteStride;
    private __target;
    private __takenByteIndex;
    private __takenByteOffsetOfFirstElement;
    private __raw;
    private __isAoS;
    private __accessors;
    constructor({ buffer, byteOffset, byteLength, raw, isAoS }: {
        buffer: Buffer;
        byteOffset: Byte;
        byteLength: Byte;
        raw: Uint8Array;
        isAoS: boolean;
    });
    byteStride: Byte;
    readonly byteLength: number;
    readonly byteOffset: number;
    readonly buffer: Buffer;
    readonly isSoA: boolean;
    recheckIsSoA(): boolean;
    readonly isAoS: boolean;
    getUint8Array(): Uint8Array;
    takeAccessor({ compositionType, componentType, count, max, min }: {
        compositionType: CompositionTypeEnum;
        componentType: ComponentTypeEnum;
        count: Count;
        max?: number;
        min?: number;
    }): Accessor;
    takeFlexibleAccessor({ compositionType, componentType, count, byteStride, max, min }: {
        compositionType: CompositionTypeEnum;
        componentType: ComponentTypeEnum;
        count: Count;
        byteStride: Byte;
        max?: number;
        min?: number;
    }): FlexibleAccessor;
    takeAccessorWithByteOffset({ compositionType, componentType, count, byteOffset, max, min }: {
        compositionType: CompositionTypeEnum;
        componentType: ComponentTypeEnum;
        count: Count;
        byteOffset: Byte;
        max?: number;
        min?: number;
    }): Accessor;
    takeFlexibleAccessorWithByteOffset({ compositionType, componentType, count, byteStride, byteOffset, max, min }: {
        compositionType: CompositionTypeEnum;
        componentType: ComponentTypeEnum;
        count: Count;
        byteStride: Byte;
        byteOffset: Byte;
        max?: number;
        min?: number;
    }): FlexibleAccessor;
    private __takeAccessorInner;
    private __takeAccessorInnerWithByteOffset;
}
