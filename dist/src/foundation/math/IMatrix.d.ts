export interface IMatrix22 {
    readonly m00: number;
    readonly m01: number;
    readonly m10: number;
    readonly m11: number;
}
export interface IMatrix33 {
    readonly m00: number;
    readonly m01: number;
    readonly m02: number;
    readonly m10: number;
    readonly m11: number;
    readonly m12: number;
    readonly m20: number;
    readonly m21: number;
    readonly m22: number;
}
export interface IMatrix44 {
    readonly m00: number;
    readonly m01: number;
    readonly m02: number;
    readonly m03: number;
    readonly m10: number;
    readonly m11: number;
    readonly m12: number;
    readonly m13: number;
    readonly m20: number;
    readonly m21: number;
    readonly m22: number;
    readonly m23: number;
    readonly m30: number;
    readonly m31: number;
    readonly m32: number;
    readonly m33: number;
}
export interface IMutableMatrix22 {
    m00: number;
    m01: number;
    m10: number;
    m11: number;
}
export interface IMutableMatrix33 {
    m00: number;
    m01: number;
    m02: number;
    m10: number;
    m11: number;
    m12: number;
    m20: number;
    m21: number;
    m22: number;
}
export interface IMutableMatrix44 {
    m00: number;
    m01: number;
    m02: number;
    m03: number;
    m10: number;
    m11: number;
    m12: number;
    m13: number;
    m20: number;
    m21: number;
    m22: number;
    m23: number;
    m30: number;
    m31: number;
    m32: number;
    m33: number;
}
