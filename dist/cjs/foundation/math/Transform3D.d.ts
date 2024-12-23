import { Array3, Array4 } from '../../types';
import { IMatrix44 } from './IMatrix';
import { IQuaternion } from './IQuaternion';
import { IVector3 } from './IVector';
import { MutableMatrix44 } from './MutableMatrix44';
import { MutableQuaternion } from './MutableQuaternion';
import { MutableVector3 } from './MutableVector3';
import { Quaternion } from './Quaternion';
import { Vector3 } from './Vector3';
export declare class Transform3D {
    private __position;
    private __scale;
    private __rotation;
    private __updateCount;
    private static __tmpMatrix44_0;
    private static __tmpVector3_0;
    private static __tmpVector3_1;
    private static __tmpVector3_2;
    private static __tmpQuaternion_0;
    constructor();
    constructor(Transform3D: Transform3D);
    isEqual(rhs: Transform3D, delta?: number): boolean;
    clone(): Transform3D;
    set position(vec: IVector3);
    setPositionAsArray3(array: Array3<number>): void;
    /**
     * return a copy of a local position vector
     */
    get position(): MutableVector3;
    /**
     * return a local position vector
     */
    get positionInner(): MutableVector3;
    set eulerAngles(vec: IVector3);
    /**
     * return a copy of a local rotation (XYZ euler) vector
     */
    get eulerAngles(): IVector3;
    /**
     * return a local rotation (XYZ euler) vector
     */
    get eulerAnglesInner(): Vector3;
    set scale(vec: IVector3);
    setScaleAsArray3(array: Array3<number>): void;
    /**
     * return a copy of a local scale vector
     */
    get scale(): IVector3;
    /**
     * return a local scale vector
     */
    get scaleInner(): MutableVector3;
    set rotation(quat: IQuaternion);
    setRotationAsArray4(array: Array4<number>): void;
    /**
     * return a copy of a local quaternion vector
     */
    get rotation(): IQuaternion;
    /**
     * return a local quaternion vector
     */
    get rotationInner(): Quaternion;
    __updateTransform(): void;
    set matrix(mat: IMatrix44);
    /**
     * return a copy of local transform matrix
     */
    get matrix(): IMatrix44;
    /**
     * return a local transform matrix
     */
    get matrixInner(): MutableMatrix44;
    getMatrixInnerTo(mat: MutableMatrix44): void;
    get updateCount(): number;
    set rotateMatrix44(rotateMatrix: IMatrix44);
    get rotateMatrix44(): IMatrix44;
    setPropertiesFromJson(arg: JSON): void;
    setRotationFromNewUpAndFront(UpVec: IVector3, FrontVec: IVector3): void;
    headToDirection(fromVec: Vector3, toVec: Vector3): void;
    /**
     * Set multiple transform information at once. By using this method,
     * we reduce the cost of automatically updating other transform components inside this class.
     * This method may be useful for animation processing and so on.
     *
     * The transform components of these arguments must not be mutually discrepant.
     * for example. The transform components of matrix argument (translate, rotate/quaternion, scale)
     * must be equal to translate, rotate, scale, quaternion arguments.
     * And both rotate and quaternion arguments must be same rotation.
     * If there is an argument passed with null or undefined, it is interpreted as unchanged.
     *
     * @param {*} translate
     * @param {*} scale
     * @param {*} rotation
     */
    setTransform(translate: MutableVector3, scale: MutableVector3, rotation: MutableQuaternion): void;
}
