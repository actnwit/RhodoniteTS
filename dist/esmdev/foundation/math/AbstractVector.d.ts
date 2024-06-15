import { TypedArray } from '../../types/CommonTypes';
import { IVector } from './IVector';
/**
 * the Abstract base class of Vector classes
 */
export declare abstract class AbstractVector implements IVector {
    _v: TypedArray;
    get x(): number;
    get glslStrAsFloat(): string;
    get glslStrAsInt(): string;
    isEqual(vec: IVector, delta?: number): boolean;
    isStrictEqual(vec: IVector): boolean;
    length(): number;
    lengthSquared(): number;
    lengthTo(vec: IVector): number;
    dot(vec: IVector): number;
    at(i: number): number;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    v(i: number): number;
    isTheSourceSame(arrayBuffer: ArrayBuffer): boolean;
    get className(): string;
    get bytesPerComponent(): number;
}
