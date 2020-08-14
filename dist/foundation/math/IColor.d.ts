import { IVector3 } from "./IVector";
import { TypedArray } from "../../commontypes/CommonTypes";
export interface IColorRgb {
    readonly r: number;
    readonly g: number;
    readonly b: number;
    readonly a: number;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): Array<number>;
    isDummy(): boolean;
    isEqual(vec: IVector3, delta: number): boolean;
    isStrictEqual(vec: IVector3): boolean;
    at(i: number): number;
    length(): number;
    lengthSquared(): number;
    lengthTo(vec: IVector3): number;
    dot(vec: IVector3): number;
    clone(): IColorRgb;
}
export interface IMutableColorRgb {
    r: number;
    g: number;
    b: number;
    readonly a: number;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): Array<number>;
    isDummy(): boolean;
    isEqual(vec: IVector3, delta: number): boolean;
    isStrictEqual(vec: IVector3): boolean;
    at(i: number): number;
    length(): number;
    lengthSquared(): number;
    lengthTo(vec: IVector3): number;
    dot(vec: IVector3): number;
    clone(): IMutableColorRgb;
    raw(): TypedArray;
    setAt(i: number, value: number): IMutableColorRgb;
    setComponents(x: number, y: number, z: number): IMutableColorRgb;
    copyComponents(vec: IVector3): IMutableColorRgb;
    zero(): IMutableColorRgb;
    one(): IMutableColorRgb;
    normalize(): IMutableColorRgb;
    add(vec: IVector3): IMutableColorRgb;
    subtract(vec: IVector3): IMutableColorRgb;
    multiply(value: number): IMutableColorRgb;
    multiplyVector(vec: IVector3): IMutableColorRgb;
    divide(value: number): IMutableColorRgb;
    divideVector(vec: IVector3): IMutableColorRgb;
    cross(vec: IVector3): IMutableColorRgb;
}
export interface IColorRgba {
    readonly r: number;
    readonly g: number;
    readonly b: number;
    readonly a: number;
}
export interface IMutableColorRgba {
    r: number;
    g: number;
    b: number;
    a: number;
}
