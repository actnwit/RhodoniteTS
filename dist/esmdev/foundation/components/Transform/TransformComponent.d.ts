import { Quaternion } from '../../math/Quaternion';
import { Component } from '../../core/Component';
import { EntityRepository } from '../../core/EntityRepository';
import { MutableVector3 } from '../../math/MutableVector3';
import { ComponentTID, ComponentSID, EntityUID } from '../../../types/CommonTypes';
import { IQuaternion } from '../../math/IQuaternion';
import { IMatrix44 } from '../../math/IMatrix';
import { IVector3 } from '../../math/IVector';
import { IEntity } from '../../core/Entity';
import { ITransformEntity } from '../../helpers';
import { Transform3D } from '../../math';
import { SceneGraphComponent } from '../SceneGraph';
export declare class TransformComponent extends Component {
    private __rest;
    private __pose;
    private __updateCountAtLastLogic;
    private __sceneGraphComponent;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository, isReUse: boolean);
    $create(): void;
    static get renderedPropertyCount(): null;
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    get restOrPose(): Transform3D;
    _backupTransformAsRest(): void;
    _restoreTransformFromRest(): void;
    get localTransform(): Transform3D;
    set localTransform(transform: Transform3D);
    get localTransformRest(): Transform3D;
    set localTransformRest(transform: Transform3D);
    set localPosition(vec: IVector3);
    /**
     * return a copy of a local translate vector
     */
    get localPosition(): IVector3;
    /**
     * return a local translate vector
     */
    get localPositionInner(): MutableVector3;
    /**
     * set a local translate vector as Rest
     */
    set localPositionRest(vec: IVector3);
    /**
     * return a copy of a local translate vector
     */
    get localPositionRest(): IVector3;
    /**
     * return a local translate vector
     */
    get localPositionRestInner(): MutableVector3;
    set localEulerAngles(vec: IVector3);
    /**
     * return a copy of a local rotation (XYZ euler) vector
     */
    get localEulerAngles(): IVector3;
    /**
     * return a local rotation (XYZ euler) vector
     */
    get localEulerAnglesInner(): import("../../math").Vector3;
    /**
     * set a local rotation (XYZ euler) vector as Rest
     */
    set localEulerAnglesRest(vec: IVector3);
    /**
     * return a copy of a local rotation (XYZ euler) vector
     */
    get localEulerAnglesRest(): IVector3;
    /**
     * return a local rotation (XYZ euler) vector
     */
    get localEulerAnglesRestInner(): import("../../math").Vector3;
    set localScale(vec: IVector3);
    /**
     * return a copy of a local scale vector
     */
    get localScale(): IVector3;
    /**
     * return a local scale vector
     */
    get localScaleInner(): MutableVector3;
    /**
     * set a local scale vector as Rest
     */
    set localScaleRest(vec: IVector3);
    /**
     * return a copy of a local scale vector
     */
    get localScaleRest(): IVector3;
    /**
     * return a local scale vector
     */
    get localScaleRestInner(): MutableVector3;
    set localRotation(quat: IQuaternion);
    /**
     * return a copy of a local quaternion vector
     */
    get localRotation(): IQuaternion;
    /**
     * return a local quaternion vector
     */
    get localRotationInner(): Quaternion;
    /**
     * set a local quaternion vector as Rest
     */
    set localRotationRest(quat: IQuaternion);
    /**
     * return a copy of a local quaternion vector
     */
    get localRotationRest(): IQuaternion;
    /**
     * return a local quaternion vector
     */
    get localRotationRestInner(): Quaternion;
    set localMatrix(mat: IMatrix44);
    /**
     * return a copy of local transform matrix
     */
    get localMatrix(): IMatrix44;
    /**
     * return a local transform matrix
     */
    get localMatrixInner(): import("../../math").MutableMatrix44;
    /**
     * set a local transform matrix as Rest
     */
    set localMatrixRest(mat: IMatrix44);
    /**
     * return a copy of local transform matrix
     */
    get localMatrixRest(): IMatrix44;
    /**
     * return a local transform matrix
     */
    get localMatrixRestInner(): import("../../math").MutableMatrix44;
    $logic(): void;
    _shallowCopyFrom(component_: Component): void;
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
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): (SomeComponentClass extends typeof import("../Constraint").ConstraintComponent ? import("../Constraint").IConstraintEntityMethods : Exclude<SomeComponentClass extends typeof import("..").VrmComponent ? import("..").IVrmEntityMethods : Exclude<SomeComponentClass extends typeof import("../../..").EffekseerComponent ? import("../../..").IEffekseerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").PhysicsComponent ? import("..").IPhysicsEntityMethods : Exclude<SomeComponentClass extends typeof import("..").BlendShapeComponent ? import("..").IBlendShapeEntityMethods : Exclude<SomeComponentClass extends typeof import("..").SkeletalComponent ? import("..").ISkeletalEntityMethods : Exclude<SomeComponentClass extends typeof import("..").LightComponent ? import("..").ILightEntityMethods : Exclude<SomeComponentClass extends typeof import("..").CameraComponent ? import("..").ICameraEntityMethods : Exclude<SomeComponentClass extends typeof import("..").CameraControllerComponent ? import("..").ICameraControllerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshRendererComponent ? import("..").IMeshRendererEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshComponent ? import("..").IMeshEntityMethods : Exclude<SomeComponentClass extends typeof SceneGraphComponent ? import("../SceneGraph").ISceneGraphEntityMethods : Exclude<SomeComponentClass extends typeof TransformComponent ? import("./ITransformEntity").ITransformEntityMethods : Exclude<SomeComponentClass extends typeof import("..").AnimationComponent ? import("..").IAnimationEntityMethods : import("./ITransformEntity").ITransformEntityMethods | import("../SceneGraph").ISceneGraphEntityMethods | import("..").IMeshEntityMethods | import("..").IMeshRendererEntityMethods | import("..").ILightEntityMethods | import("..").ICameraEntityMethods | import("..").ICameraControllerEntityMethods | import("..").ISkeletalEntityMethods | import("..").IBlendShapeEntityMethods | import("..").IPhysicsEntityMethods | import("../../..").IEffekseerEntityMethods | import("..").IVrmEntityMethods, import("./ITransformEntity").ITransformEntityMethods>, import("../SceneGraph").ISceneGraphEntityMethods>, import("..").IMeshEntityMethods>, import("..").IMeshRendererEntityMethods>, import("..").ICameraControllerEntityMethods>, import("..").ICameraEntityMethods>, import("..").ILightEntityMethods>, import("..").ISkeletalEntityMethods>, import("..").IBlendShapeEntityMethods>, import("..").IPhysicsEntityMethods>, import("../../..").IEffekseerEntityMethods>, import("..").IVrmEntityMethods>, import("../Constraint").IConstraintEntityMethods>) & EntityBase;
}
