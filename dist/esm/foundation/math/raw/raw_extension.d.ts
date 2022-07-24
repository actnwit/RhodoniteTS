import type { Array1, Array2, Array3, Array4, ArrayType } from '../../../types/CommonTypes';
export declare const get1: unique symbol;
export declare const get1_offset: unique symbol;
export declare const get1_offsetAsComposition: unique symbol;
export declare const get2: unique symbol;
export declare const get2_offset: unique symbol;
export declare const get2_offsetAsComposition: unique symbol;
export declare const get3: unique symbol;
export declare const get3_offset: unique symbol;
export declare const get3_offsetAsComposition: unique symbol;
export declare const get4: unique symbol;
export declare const get4_offset: unique symbol;
export declare const get4_offsetAsComposition: unique symbol;
export declare const getN_offset: unique symbol;
export declare const getN_offsetAsComposition: unique symbol;
export declare const add2: unique symbol;
export declare const add2_offset: unique symbol;
export declare const add3: unique symbol;
export declare const add3_offset: unique symbol;
export declare const add4: unique symbol;
export declare const mulArray3WithScalar_offset: unique symbol;
export declare const mulArray4WithScalar_offset: unique symbol;
export declare const mulArrayNWithScalar_offset: unique symbol;
export declare const mulThatAndThisToOutAsMat44_offsetAsComposition: unique symbol;
export declare const add4_offset: unique symbol;
export declare const qlerp_offsetAsComposition: unique symbol;
export declare const scalar_lerp_offsetAsComposition: unique symbol;
export declare const array3_lerp_offsetAsComposition: unique symbol;
export declare const arrayN_lerp_offsetAsComposition: unique symbol;
export declare const normalizeArray4: unique symbol;
declare global {
    interface Extension {
        [get1](this: ArrayType): Array1<number>;
        [get1_offset](this: ArrayType, offset: number): Array1<number>;
        [get1_offsetAsComposition](this: ArrayType, offsetAsComposition: number): Array1<number>;
        [get2](this: ArrayType): Array2<number>;
        [get2_offset](this: ArrayType, offset: number): Array2<number>;
        [get2_offsetAsComposition](this: ArrayType, offsetAsComposition: number): Array2<number>;
        [get3](this: ArrayType): Array3<number>;
        [get3_offset](this: ArrayType, offset: number): Array3<number>;
        [get3_offsetAsComposition](this: ArrayType, offsetAsComposition: number): Array3<number>;
        [get4](this: ArrayType): Array4<number>;
        [get4_offset](this: ArrayType, offset: number): Array4<number>;
        [get4_offsetAsComposition](this: ArrayType, offsetAsComposition: number): Array4<number>;
        [getN_offset](this: ArrayType, offset: number, componentN: number): Array<number>;
        [getN_offsetAsComposition](this: ArrayType, offsetAsComposition: number, componentN: number): Array<number>;
        [add2](this: ArrayType, array: ArrayType): ArrayType;
        [add2_offset](this: ArrayType, array: ArrayType, selfOffset: number, argOffset: number): ArrayType;
        [add3](this: ArrayType, array: ArrayType): ArrayType;
        [add3_offset](this: ArrayType, array: ArrayType, selfOffset: number, argOffset: number): ArrayType;
        [add4](this: ArrayType, array: ArrayType): ArrayType;
        [add4_offset](this: ArrayType, array: ArrayType, selfOffset: number, argOffset: number): ArrayType;
        [mulArray3WithScalar_offset](this: ArrayType, offset: number, value: number): Array4<number>;
        [mulArray4WithScalar_offset](this: ArrayType, offset: number, value: number): Array4<number>;
        [mulArrayNWithScalar_offset](this: ArrayType, offset: number, componentN: number, value: number): Array4<number>;
        [mulThatAndThisToOutAsMat44_offsetAsComposition](this: ArrayType, thisOffsetAsComposition: number, that: ArrayType, thatOffsetAsComposition: number, out: ArrayType): ArrayType;
        [qlerp_offsetAsComposition](this: ArrayType, array: ArrayType, ratio: number, selfOffsetAsComposition: number, argOffsetAsComposition: number): Array4<number>;
        [scalar_lerp_offsetAsComposition](this: ArrayType, array: ArrayType, ratio: number, selfOffset: number, argOffset: number): number;
        [array3_lerp_offsetAsComposition](this: ArrayType, array: ArrayType, ratio: number, selfOffsetAsComposition: number, argOffsetAsComposition: number): Array3<number>;
        [arrayN_lerp_offsetAsComposition](this: ArrayType, array: ArrayType, componentN: number, ratio: number, selfOffsetAsComposition: number, argOffsetAsComposition: number): Array<number>;
        [normalizeArray4](this: Array4<number>): Array4<number>;
    }
    interface Array<T> extends Extension {
    }
    interface ReadonlyArray<T> extends Extension {
    }
    interface Float32Array extends Extension {
    }
}
