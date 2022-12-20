import { IMatrix44, IQuaternion, IVector3, Quaternion, Vector3 } from '.';
import { MutableMatrix44 } from './MutableMatrix44';
import { MutableQuaternion } from './MutableQuaternion';
import { MutableVector3 } from './MutableVector3';
export declare class Transform3D {
    private __translate;
    private __scale;
    private __quaternion;
    private __matrix;
    private __is_translate_updated;
    private __is_scale_updated;
    private __is_quaternion_updated;
    private __is_trs_matrix_updated;
    private __updateCount;
    private static __tmpMatrix44_0;
    private static __tmpVector3_0;
    private static __tmpVector3_1;
    private static __tmpVector3_2;
    private static __tmpQuaternion_0;
    constructor();
    constructor(Transform3D: Transform3D);
    clone(): Transform3D;
    set translate(vec: IVector3);
    /**
     * return a copy of a local translate vector
     */
    get translate(): IVector3;
    /**
     * return a local translate vector
     */
    get translateInner(): MutableVector3;
    set rotate(vec: IVector3);
    /**
     * return a copy of a local rotation (XYZ euler) vector
     */
    get rotate(): IVector3;
    /**
     * return a local rotation (XYZ euler) vector
     */
    get rotateInner(): Vector3;
    set scale(vec: IVector3);
    /**
     * return a copy of a local scale vector
     */
    get scale(): IVector3;
    /**
     * return a local scale vector
     */
    get scaleInner(): MutableVector3;
    set quaternion(quat: IQuaternion);
    /**
     * return a copy of a local quaternion vector
     */
    get quaternion(): IQuaternion;
    /**
     * return a local quaternion vector
     */
    get quaternionInner(): Quaternion;
    __updateTransform(): void;
    __updateRotation(): void;
    __updateTranslate(): void;
    __updateScale(): void;
    __updateMatrix(): void;
    set matrix(mat: IMatrix44);
    /**
     * return a copy of local transform matrix
     */
    get matrix(): IMatrix44;
    /**
     * return a local transform matrix
     */
    get matrixInner(): MutableMatrix44;
    __needUpdate(): void;
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
     * @param {*} rotate
     * @param {*} scale
     * @param {*} quaternion
     * @param {*} matrix
     */
    setTransform(translate: MutableVector3, rotate: MutableVector3, scale: MutableVector3, quaternion: MutableQuaternion, matrix: MutableMatrix44): void;
}
