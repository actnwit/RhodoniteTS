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
export declare class TransformComponent extends Component {
    private __rest;
    private __pose;
    private __updateCountAtLastLogic;
    private _dependentAnimationComponentId;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository);
    static get renderedPropertyCount(): null;
    static get componentTID(): ComponentTID;
    get restOrPose(): Transform3D;
    _backupTransformAsRest(): void;
    _restoreTransformFromRest(): void;
    get transform(): Transform3D;
    get transformRest(): Transform3D;
    set translate(vec: IVector3);
    /**
     * return a copy of a local translate vector
     */
    get translate(): IVector3;
    /**
     * return a local translate vector
     */
    get translateInner(): MutableVector3;
    /**
     * return a copy of a local translate vector
     */
    get translateRest(): IVector3;
    /**
     * return a local translate vector
     */
    get translateRestInner(): MutableVector3;
    set rotate(vec: IVector3);
    /**
     * return a copy of a local rotation (XYZ euler) vector
     */
    get rotate(): IVector3;
    /**
     * return a local rotation (XYZ euler) vector
     */
    get rotateInner(): import("../../math").Vector3;
    /**
     * return a copy of a local rotation (XYZ euler) vector
     */
    get rotateRest(): IVector3;
    /**
     * return a local rotation (XYZ euler) vector
     */
    get rotateRestInner(): import("../../math").Vector3;
    set scale(vec: IVector3);
    /**
     * return a copy of a local scale vector
     */
    get scale(): IVector3;
    /**
     * return a local scale vector
     */
    get scaleInner(): MutableVector3;
    /**
     * return a copy of a local scale vector
     */
    get scaleRest(): IVector3;
    /**
     * return a local scale vector
     */
    get scaleRestInner(): MutableVector3;
    set quaternion(quat: IQuaternion);
    /**
     * return a copy of a local quaternion vector
     */
    get quaternion(): IQuaternion;
    /**
     * return a local quaternion vector
     */
    get quaternionInner(): Quaternion;
    /**
     * return a copy of a local quaternion vector
     */
    get quaternionRest(): IQuaternion;
    /**
     * return a local quaternion vector
     */
    get quaternionRestInner(): Quaternion;
    set matrix(mat: IMatrix44);
    /**
     * return a copy of local transform matrix
     */
    get matrix(): IMatrix44;
    /**
     * return a local transform matrix
     */
    get matrixInner(): import("../../math").MutableMatrix44;
    /**
     * return a copy of local transform matrix
     */
    get matrixRest(): IMatrix44;
    /**
     * return a local transform matrix
     */
    get matrixRestInner(): import("../../math").MutableMatrix44;
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
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): (SomeComponentClass extends typeof import("../../../sparkgear/SparkGearComponent").SparkGearComponent ? import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods : Exclude<SomeComponentClass extends typeof import("../../..").EffekseerComponent ? import("../../..").IEffekseerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").PhysicsComponent ? import("..").IPhysicsEntityMethods : Exclude<SomeComponentClass extends typeof import("..").BlendShapeComponent ? import("..").IBlendShapeEntityMethods : Exclude<SomeComponentClass extends typeof import("..").SkeletalComponent ? import("..").ISkeletalEntityMethods : Exclude<SomeComponentClass extends typeof import("..").LightComponent ? import("..").ILightEntityMethods : Exclude<SomeComponentClass extends typeof import("..").CameraComponent ? import("..").ICameraEntityMethods : Exclude<SomeComponentClass extends typeof import("..").CameraControllerComponent ? import("..").ICameraControllerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshRendererComponent ? import("..").IMeshRendererEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshComponent ? import("..").IMeshEntityMethods : Exclude<SomeComponentClass extends typeof import("..").SceneGraphComponent ? import("..").ISceneGraphEntityMethods : Exclude<SomeComponentClass extends typeof TransformComponent ? import("./ITransformEntity").ITransformEntityMethods : Exclude<SomeComponentClass extends typeof import("..").AnimationComponent ? import("..").IAnimationEntityMethods : import("./ITransformEntity").ITransformEntityMethods | import("..").ISceneGraphEntityMethods | import("..").ILightEntityMethods | import("..").IMeshEntityMethods | import("..").IMeshRendererEntityMethods | import("..").ICameraEntityMethods | import("..").ICameraControllerEntityMethods | import("..").ISkeletalEntityMethods | import("..").IBlendShapeEntityMethods | import("..").IPhysicsEntityMethods | import("../../..").IEffekseerEntityMethods | import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods, import("./ITransformEntity").ITransformEntityMethods>, import("..").ISceneGraphEntityMethods>, import("..").IMeshEntityMethods>, import("..").IMeshRendererEntityMethods>, import("..").ICameraControllerEntityMethods>, import("..").ICameraEntityMethods>, import("..").ILightEntityMethods>, import("..").ISkeletalEntityMethods>, import("..").IBlendShapeEntityMethods>, import("..").IPhysicsEntityMethods>, import("../../..").IEffekseerEntityMethods>, import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods>) & EntityBase;
}
