import { IVector3 } from './IVector';
import { Quaternion } from './Quaternion';
import { Array3 } from '../../types/CommonTypes';
import { ILogQuaternion, IQuaternion } from './IQuaternion';
export declare class LogQuaternion implements ILogQuaternion {
    _v: Float32Array;
    constructor(x: Float32Array);
    get x(): number;
    get y(): number;
    get z(): number;
    get w(): number;
    static fromFloat32Array(array: Float32Array): LogQuaternion;
    static fromCopyArray3(array: Array3<number>): Quaternion;
    static fromCopyArray(array: Array<number>): Quaternion;
    static fromCopy3(x: number, y: number, z: number): Quaternion;
    static fromCopyLogQuaternion(quat: ILogQuaternion): Quaternion;
    static fromCopyVector4(vec: IVector3): Quaternion;
    static fromCopyQuaternion(x: IQuaternion): LogQuaternion;
    get className(): string;
}
