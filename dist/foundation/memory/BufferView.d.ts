import RnObject from "../core/Object";
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
    recheckIsSoA(): true | undefined;
    readonly isAoS: boolean;
    getUint8Array(): Uint8Array;
    takeAccessor({ compositionType, componentType, count }: {
        compositionType: CompositionTypeEnum;
        componentType: ComponentTypeEnum;
        count: Count;
    }): Accessor;
    takeFlexibleAccessor({ compositionType, componentType, count, byteStride }: {
        compositionType: CompositionTypeEnum;
        componentType: ComponentTypeEnum;
        count: Count;
        byteStride: Byte;
    }): FlexibleAccessor;
    takeAccessorWithByteOffset({ compositionType, componentType, count, byteOffset }: {
        compositionType: CompositionTypeEnum;
        componentType: ComponentTypeEnum;
        count: Count;
        byteOffset: Byte;
    }): Accessor;
    takeFlexibleAccessorWithByteOffset({ compositionType, componentType, count, byteStride, byteOffset }: {
        compositionType: CompositionTypeEnum;
        componentType: ComponentTypeEnum;
        count: Count;
        byteStride: Byte;
        byteOffset: Byte;
    }): FlexibleAccessor;
    private __takeAccessorInner;
    private __takeAccessorInnerWithByteOffset;
}
