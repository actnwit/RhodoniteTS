import { Vector3 } from '../../math/Vector3';
import { Quaternion } from '../../math/Quaternion';
import { Matrix44 } from '../../math/Matrix44';
import { Component } from '../../core/Component';
import { EntityRepository } from '../../core/EntityRepository';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { MutableMatrix33 } from '../../math/MutableMatrix33';
import { MutableVector3 } from '../../math/MutableVector3';
import { ComponentTID, ComponentSID, EntityUID } from '../../../types/CommonTypes';
import { IQuaternion } from '../../math/IQuaternion';
import { IMatrix44 } from '../../math/IMatrix';
import { IVector3 } from '../../math/IVector';
import { IEntity } from '../../core/Entity';
import { ITransformEntity } from '../../helpers';
export declare class TransformComponent extends Component {
    private _translate;
    private _scale;
    private _quaternion;
    private _matrix;
    private _invMatrix;
    private _normalMatrix;
    private _is_translate_updated;
    private _is_scale_updated;
    private _is_quaternion_updated;
    private _is_trs_matrix_updated;
    private _is_inverse_trs_matrix_updated;
    private _is_normal_trs_matrix_updated;
    private static __tmpMatrix44_0;
    private static __tmpVector3_0;
    private static __tmpVector3_1;
    private static __tmpVector3_2;
    private static __tmpQuaternion_0;
    private _updateCount;
    private __updateCountAtLastLogic;
    private _dependentAnimationComponentId;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository);
    static get renderedPropertyCount(): null;
    static get componentTID(): ComponentTID;
    _needUpdate(): void;
    set translate(vec: IVector3);
    get translate(): IVector3;
    get translateInner(): MutableVector3;
    set rotate(vec: IVector3);
    get rotate(): IVector3;
    get rotateInner(): Vector3;
    set scale(vec: IVector3);
    get scale(): IVector3;
    get scaleInner(): MutableVector3;
    set quaternion(quat: IQuaternion);
    get quaternion(): IQuaternion;
    get quaternionInner(): Quaternion;
    set matrix(mat: IMatrix44);
    get matrix(): IMatrix44;
    get matrixInner(): MutableMatrix44;
    get inverseMatrix(): Matrix44;
    get inverseMatrixInner(): MutableMatrix44;
    get normalMatrix(): MutableMatrix33;
    get normalMatrixInner(): MutableMatrix33;
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
    setTransform(translate: IVector3, rotate: IVector3, scale: IVector3, quaternion: IQuaternion, matrix: IMatrix44): void;
    __updateTransform(): void;
    __updateRotation(): void;
    __updateTranslate(): void;
    __updateScale(): void;
    __updateMatrix(): void;
    setPropertiesFromJson(arg: JSON): void;
    setRotationFromNewUpAndFront(UpVec: IVector3, FrontVec: IVector3): void;
    headToDirection(fromVec: Vector3, toVec: Vector3): void;
    set rotateMatrix44(rotateMatrix: IMatrix44);
    get rotateMatrix44(): IMatrix44;
    $logic(): void;
    /**
     * get the entity which has this component.
     * @returns the entity which has this component
     */
    get entity(): ITransformEntity;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): (SomeComponentClass extends typeof import("../../../sparkgear/SparkGearComponent").SparkGearComponent ? import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods : Exclude<SomeComponentClass extends typeof import("../../..").EffekseerComponent ? import("../../..").IEffekseerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").PhysicsComponent ? import("..").IPhysicsEntityMethods : Exclude<SomeComponentClass extends typeof import("..").BlendShapeComponent ? import("..").IBlendShapeEntityMethods : Exclude<SomeComponentClass extends typeof import("..").SkeletalComponent ? import("..").ISkeletalEntityMethods : Exclude<SomeComponentClass extends typeof import("..").LightComponent ? import("..").ILightEntityMethods : Exclude<SomeComponentClass extends typeof import("..").CameraComponent ? import("..").ICameraEntityMethods : Exclude<SomeComponentClass extends typeof import("..").CameraControllerComponent ? import("..").ICameraControllerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshRendererComponent ? import("..").IMeshRendererEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshComponent ? import("..").IMeshEntityMethods : Exclude<SomeComponentClass extends typeof import("..").SceneGraphComponent ? import("..").ISceneGraphEntityMethods : Exclude<SomeComponentClass extends typeof TransformComponent ? import("./ITransformEntity").ITransformEntityMethods : Exclude<SomeComponentClass extends typeof import("..").AnimationComponent ? import("..").IAnimationEntityMethods : import("./ITransformEntity").ITransformEntityMethods | import("..").ISceneGraphEntityMethods | import("..").ISkeletalEntityMethods | import("..").IMeshEntityMethods | import("..").IMeshRendererEntityMethods | import("..").ICameraEntityMethods | import("..").ICameraControllerEntityMethods | import("..").ILightEntityMethods | import("..").IBlendShapeEntityMethods | import("..").IPhysicsEntityMethods | import("../../..").IEffekseerEntityMethods | import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods, import("./ITransformEntity").ITransformEntityMethods>, import("..").ISceneGraphEntityMethods>, import("..").IMeshEntityMethods>, import("..").IMeshRendererEntityMethods>, import("..").ICameraControllerEntityMethods>, import("..").ICameraEntityMethods>, import("..").ILightEntityMethods>, import("..").ISkeletalEntityMethods>, import("..").IBlendShapeEntityMethods>, import("..").IPhysicsEntityMethods>, import("../../..").IEffekseerEntityMethods>, import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods>) & EntityBase;
}
