import { IScalar } from "./IVector";
import { TypedArray, TypedArrayConstructor } from "../../commontypes/CommonTypes";
export declare class Scalar_<T extends TypedArrayConstructor> implements IScalar {
    v: TypedArray;
    constructor(x: number | TypedArray | null, { type }: {
        type: T;
    });
    getValue(): number;
    getValueInArray(): number[];
    get x(): number;
    get raw(): TypedArray;
    isStrictEqual(scalar: Scalar_<T>): boolean;
    isEqual(scalar: Scalar_<T>, delta?: number): boolean;
    get glslStrAsFloat(): string;
    get glslStrAsInt(): string;
}
export default class Scalar extends Scalar_<Float32ArrayConstructor> {
    constructor(x: number | TypedArray | null);
    static zero(): Scalar;
    static one(): Scalar;
    static dummy(): Scalar;
    clone(): Scalar;
}
export declare class Scalard extends Scalar_<Float64ArrayConstructor> {
    constructor(x: number | TypedArray | null);
    static zero(): Scalard;
    static one(): Scalard;
    static dummy(): Scalard;
    clone(): Scalard;
}
export declare type Scalarf = Scalar;
