import { IVector3, IVector4 } from './IVector';
import { Array4 } from '../../types/CommonTypes';
import { IQuaternion, ILogQuaternion, IMutableQuaternion } from './IQuaternion';
import { IMutableVector3 } from './IVector';
import { IMatrix44 } from './IMatrix';
import { AbstractQuaternion } from './AbstractQuaternion';
import { Vector3 } from './Vector3';
export declare class Quaternion extends AbstractQuaternion implements IQuaternion {
    private static __tmp_upVec;
    private static __tmp_vec3_0;
    private static __tmp_vec3_1;
    private static __tmp_vec3_2;
    private static __tmp_vec3_3;
    private static __tmp_vec3_4;
    constructor(x: Float32Array);
    get className(): string;
    static get compositionType(): {
        readonly __numberOfComponents: number;
        readonly __glslStr: string;
        readonly __hlslStr: string;
        readonly __webgpuStr: string;
        readonly __wgslStr: string;
        readonly __isArray: boolean;
        readonly __vec4SizeOfProperty: import("../../types/CommonTypes").IndexOf16Bytes;
        readonly __dummyStr: "VEC4";
        readonly webgpu: string;
        readonly wgsl: string;
        getNumberOfComponents(): import("../../types/CommonTypes").Count;
        getGlslStr(componentType: import("..").ComponentTypeEnum): string;
        getGlslInitialValue(componentType: import("..").ComponentTypeEnum): string;
        getWgslInitialValue(componentType: import("..").ComponentTypeEnum): string;
        toWGSLType(componentType: import("..").ComponentTypeEnum): string;
        getVec4SizeOfProperty(): import("../../types/CommonTypes").IndexOf16Bytes;
        readonly index: number;
        readonly symbol: symbol;
        readonly str: string;
        toString(): string;
        toJSON(): number;
    };
    static identity(): Quaternion;
    static dummy(): Quaternion;
    static invert(quat: IQuaternion): IQuaternion;
    static invertTo(quat: IQuaternion, out: IMutableQuaternion): IQuaternion;
    /**
     * Compute spherical linear interpolation
     */
    static qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): IQuaternion;
    /**
     *  Compute the spherical linear interpolation and output it as the fourth argument
     */
    static qlerpTo(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number, out: IMutableQuaternion): IMutableQuaternion;
    static lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): Quaternion;
    static lerpTo(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number, out: IMutableQuaternion): IMutableQuaternion;
    static axisAngle(vec: IVector3, radian: number): Quaternion;
    static fromMatrix(mat: IMatrix44): Quaternion;
    static fromMatrixTo(mat: IMatrix44, out: IMutableQuaternion): IMutableQuaternion;
    static lookFromTo(fromDirection: IVector3, toDirection: IVector3): IQuaternion;
    static lookForward(forward: IVector3): IQuaternion;
    static lookForwardAccordingToThisUp(forward: IVector3, up: IVector3): IQuaternion;
    static fromPosition(vec: IVector3): Quaternion;
    static add(l_quat: IQuaternion, r_quat: IQuaternion): Quaternion;
    static addTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion;
    static subtract(l_quat: IQuaternion, r_quat: IQuaternion): Quaternion;
    static subtractTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion;
    static multiply(l_quat: IQuaternion, r_quat: IQuaternion): Quaternion;
    static multiplyTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion;
    static multiplyNumber(quat: IQuaternion, value: number): Quaternion;
    static multiplyNumberTo(quat: IQuaternion, value: number, out: IMutableQuaternion): IMutableQuaternion;
    static divideNumber(quat: IQuaternion, value: number): Quaternion;
    static divideNumberTo(quat: IQuaternion, value: number, out: IMutableQuaternion): IMutableQuaternion;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    isEqual(quat: IQuaternion, delta?: number): boolean;
    isStrictEqual(quat: IQuaternion): boolean;
    toEulerAnglesTo(out: IMutableVector3): IMutableVector3;
    toEulerAngles(): Vector3;
    /**
     * divide(static version)
     */
    private static _divide;
    /**
     * divide(static version)
     */
    private static _divideTo;
    /**
     * normalize(static version)
     */
    static normalize(vec: IQuaternion): Quaternion;
    /**
     * normalize(static version)
     */
    static normalizeTo(vec: IQuaternion, out: IMutableQuaternion): IMutableQuaternion;
    fromToRotation(from: IVector3, to: IVector3): Quaternion;
    static fromToRotation(from: IVector3, to: IVector3): Quaternion;
    static fromToRotationTo(from: IVector3, to: IVector3, out: IMutableQuaternion): IMutableQuaternion;
    transformVector3(v: IVector3): Vector3;
    transformVector3To(v: IVector3, out: IMutableVector3): IMutableVector3;
    transformVector3Inverse(v: IVector3): IVector3;
    clone(): IQuaternion;
    static fromFloat32Array(array: Float32Array): Quaternion;
    static fromCopyArray4(array: Array4<number>): Quaternion;
    static fromCopyArray(array: Array<number>): Quaternion;
    static fromCopy4(x: number, y: number, z: number, w: number): Quaternion;
    static fromCopyQuaternion(quat: IQuaternion): Quaternion;
    static fromCopyVector4(vec: IVector4): Quaternion;
    static fromCopyLogQuaternion(x: ILogQuaternion): Quaternion;
    static fromAxisAngle(axis: IVector3, rad: number): Quaternion;
    static fromAxisAngleTo(axis: IVector3, rad: number, out: IMutableQuaternion): IMutableQuaternion;
}
