import Vector3 from './Vector3';
import { IVector4 } from './IVector';
import Matrix44 from './Matrix44';
import Vector4 from './Vector4';
export default class Quaternion implements IVector4 {
    v: TypedArray;
    constructor(x?: number | TypedArray | Vector3 | Vector4 | Quaternion | Array<number> | null, y?: number, z?: number, w?: number);
    isEqual(quat: Quaternion): boolean;
    static readonly compositionType: import("../definitions/CompositionType").CompositionTypeEnum;
    static dummy(): Quaternion;
    isDummy(): boolean;
    readonly className: string;
    clone(): Quaternion;
    static invert(quat: Quaternion): Quaternion;
    static qlerp(lhq: Quaternion, rhq: Quaternion, ratio: number): Quaternion;
    static axisAngle(axisVec3: Vector3, radian: number): Quaternion;
    static multiply(q1: Quaternion, q2: Quaternion): Quaternion;
    static fromMatrix(m: Matrix44): Quaternion;
    static fromPosition(vec3: Vector3): Quaternion;
    at(i: number): number | undefined;
    toString(): string;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
}
