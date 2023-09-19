import { IQuaternion } from './IQuaternion';
import { IMutableVector3, IVector3 } from './IVector';
export declare abstract class AbstractQuaternion implements IQuaternion {
    get className(): string;
    get x(): number;
    get y(): number;
    get z(): number;
    get w(): number;
    at(i: number): number;
    length(): number;
    lengthSquared(): number;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    isEqual(vec: IQuaternion, delta?: number): boolean;
    isStrictEqual(vec: IQuaternion): boolean;
    toEulerAnglesTo(out: IMutableVector3): IMutableVector3;
    toEulerAngles(): IVector3;
    transformVector3(vec: IVector3): IVector3;
    transformVector3Inverse(vec: IVector3): IVector3;
    /**
     * dot product
     */
    dot(quat: IQuaternion): number;
    clone(): IQuaternion;
    _v: Float32Array;
}
