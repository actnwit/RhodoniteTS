import { IVector2, IVector3, IVector4 } from './IVector';
import { TypedArray } from '../../commontypes/CommonTypes';
import { IQuaternion, ILogQuaternion, IMutableQuaternion } from './IQuaternion';
import { IMutableVector3 } from './IVector';
import { IMatrix44 } from './IMatrix';
export default class Quaternion implements IQuaternion {
    private static __tmp_upVec;
    v: TypedArray;
    constructor(x?: number | TypedArray | IVector2 | IVector3 | IVector4 | IQuaternion | ILogQuaternion | Array<number> | null, y?: number, z?: number, w?: number);
    get x(): number;
    get y(): number;
    get z(): number;
    get w(): number;
    get className(): string;
    static get compositionType(): import("../definitions/CompositionType").CompositionTypeEnum;
    static identity(): Quaternion;
    static dummy(): Quaternion;
    static invert(quat: IQuaternion): Quaternion;
    static invertTo(quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion;
    static qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): IQuaternion;
    static qlerpTo(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number, out: IMutableQuaternion): IMutableQuaternion;
    static lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): Quaternion;
    static lerpTo(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number, out: IMutableQuaternion): IMutableQuaternion;
    static axisAngle(vec: IVector3, radian: number): Quaternion;
    static fromMatrix(mat: IMatrix44): Quaternion;
    static fromMatrixTo(mat: IMatrix44, out: IMutableQuaternion): IMutableQuaternion;
    static lookFromTo(fromDirection: IVector3, toDirection: IVector3): IQuaternion;
    static lookForward(forward: IVector3): Quaternion;
    static lookForwardAccordingToThisUp(forward: IVector3, up: IVector3): Quaternion;
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
    at(i: number): number;
    length(): number;
    lengthSquared(): number;
    /**
     * dot product
     */
    dot(quat: IQuaternion): number;
    toEulerAnglesTo(out: IMutableVector3): IMutableVector3;
    clone(): Quaternion;
}
