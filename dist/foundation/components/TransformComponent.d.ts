import Vector3 from '../math/Vector3';
import Quaternion from '../math/Quaternion';
import Matrix33 from '../math/Matrix33';
import Matrix44 from '../math/Matrix44';
import Component from '../core/Component';
import EntityRepository from '../core/EntityRepository';
import MutableMatrix44 from '../math/MutableMatrix44';
import { ComponentTID, ComponentSID, EntityUID } from '../../commontypes/CommonTypes';
export default class TransformComponent extends Component {
    private _translate;
    private _rotate;
    private _scale;
    private _quaternion;
    private _matrix;
    private _invMatrix;
    private _normalMatrix;
    private _is_translate_updated;
    private _is_euler_angles_updated;
    private _is_scale_updated;
    private _is_quaternion_updated;
    private _is_trs_matrix_updated;
    private _is_inverse_trs_matrix_updated;
    private _is_normal_trs_matrix_updated;
    private static __tmpMat_updateRotation;
    private static __tmpMat_quaternionInner;
    private __toUpdateAllTransform;
    private _updateCount;
    private __updateCountAtLastLogic;
    private static returnMatrix33;
    private static invertedMatrix44;
    private static updateRotationMatrix44;
    private static updateRotationVector3;
    private _dependentAnimationComponentId;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository);
    static get renderedPropertyCount(): null;
    static get componentTID(): ComponentTID;
    $logic(): void;
    set toUpdateAllTransform(flag: boolean);
    get toUpdateAllTransform(): boolean;
    _needUpdate(): void;
    set translate(vec: Vector3);
    get translate(): Vector3;
    get translateInner(): Vector3;
    set rotate(vec: Vector3);
    get rotate(): Vector3;
    get rotateInner(): Vector3;
    set scale(vec: Vector3);
    get scale(): Vector3;
    get scaleInner(): Vector3;
    set quaternion(quat: Quaternion);
    get quaternion(): Quaternion;
    get quaternionInner(): Quaternion;
    set matrix(mat: Matrix44);
    get matrix(): Matrix44;
    get matrixInner(): MutableMatrix44;
    get inverseMatrix(): Matrix44;
    get inverseMatrixInner(): Matrix44;
    get normalMatrix(): Matrix33;
    get normalMatrixInner(): Matrix33;
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
    setTransform(translate: Vector3, rotate: Vector3, scale: Vector3, quaternion: Quaternion, matrix: Matrix44): void;
    __updateTransform(): void;
    __updateRotation(): void;
    __updateTranslate(): void;
    __updateScale(): void;
    __updateMatrix(): void;
    setPropertiesFromJson(arg: JSON): void;
    setRotationFromNewUpAndFront(UpVec: Vector3, FrontVec: Vector3): void;
    headToDirection(fromVec: Vector3, toVec: Vector3): void;
    set rotateMatrix44(rotateMatrix: Matrix44);
    get rotateMatrix44(): Matrix44;
}
