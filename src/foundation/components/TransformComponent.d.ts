import Vector3 from '../math/Vector3';
import Quaternion from '../math/Quaternion';
import Matrix33 from '../math/Matrix33';
import Matrix44 from '../math/Matrix44';
import Component from '../core/Component';
import EntityRepository from '../core/EntityRepository';
import MutableMatrix44 from '../math/MutableMatrix44';
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
    private _dependentAnimationComponentId;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository);
    static readonly renderedPropertyCount: null;
    static readonly componentTID: ComponentTID;
    $logic(): void;
    toUpdateAllTransform: boolean;
    _needUpdate(): void;
    translate: Vector3;
    readonly translateInner: Vector3;
    rotate: Vector3;
    readonly rotateInner: Vector3;
    scale: Vector3;
    readonly scaleInner: Vector3;
    quaternion: Quaternion;
    readonly quaternionInner: Quaternion;
    matrix: Matrix44;
    readonly matrixInner: MutableMatrix44;
    readonly inverseMatrix: Matrix44;
    readonly inverseMatrixInner: Matrix44;
    readonly normalMatrix: Matrix33;
    readonly normalMatrixInner: Matrix33;
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
    rotateMatrix44: Matrix44;
}
