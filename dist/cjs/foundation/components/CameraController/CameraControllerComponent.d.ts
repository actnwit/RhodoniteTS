import { Component } from '../../core/Component';
import { EntityUID, ComponentSID, ComponentTID } from '../../../types/CommonTypes';
import { EntityRepository } from '../../core/EntityRepository';
import { CameraComponent } from '../Camera/CameraComponent';
import { ICameraController } from '../../cameras/ICameraController';
import { CameraControllerTypeEnum } from '../../definitions/CameraControllerType';
import { IEntity } from '../../core/Entity';
/**
 * The Component that controls camera posture.
 */
export declare class CameraControllerComponent extends Component {
    private __cameraComponent?;
    private __cameraController;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    set type(type: CameraControllerTypeEnum);
    get type(): CameraControllerTypeEnum;
    get controller(): ICameraController;
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    $create(): void;
    $logic(): void;
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): (SomeComponentClass extends typeof import("../Constraint").ConstraintComponent ? import("../Constraint").IConstraintEntityMethods : Exclude<SomeComponentClass extends typeof import("..").VrmComponent ? import("..").IVrmEntityMethods : Exclude<SomeComponentClass extends typeof import("../../..").EffekseerComponent ? import("../../..").IEffekseerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").PhysicsComponent ? import("..").IPhysicsEntityMethods : Exclude<SomeComponentClass extends typeof import("..").BlendShapeComponent ? import("..").IBlendShapeEntityMethods : Exclude<SomeComponentClass extends typeof import("..").SkeletalComponent ? import("..").ISkeletalEntityMethods : Exclude<SomeComponentClass extends typeof import("..").LightComponent ? import("..").ILightEntityMethods : Exclude<SomeComponentClass extends typeof CameraComponent ? import("..").ICameraEntityMethods : Exclude<SomeComponentClass extends typeof CameraControllerComponent ? import("./ICameraControllerEntity").ICameraControllerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshRendererComponent ? import("..").IMeshRendererEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshComponent ? import("..").IMeshEntityMethods : Exclude<SomeComponentClass extends typeof import("..").SceneGraphComponent ? import("..").ISceneGraphEntityMethods : Exclude<SomeComponentClass extends typeof import("..").TransformComponent ? import("..").ITransformEntityMethods : Exclude<SomeComponentClass extends typeof import("..").AnimationComponent ? import("..").IAnimationEntityMethods : import("..").ITransformEntityMethods | import("..").ISceneGraphEntityMethods | import("..").IMeshEntityMethods | import("..").IMeshRendererEntityMethods | import("..").ILightEntityMethods | import("..").ICameraEntityMethods | import("./ICameraControllerEntity").ICameraControllerEntityMethods | import("..").ISkeletalEntityMethods | import("..").IBlendShapeEntityMethods | import("..").IPhysicsEntityMethods | import("../../..").IEffekseerEntityMethods | import("..").IVrmEntityMethods, import("..").ITransformEntityMethods>, import("..").ISceneGraphEntityMethods>, import("..").IMeshEntityMethods>, import("..").IMeshRendererEntityMethods>, import("./ICameraControllerEntity").ICameraControllerEntityMethods>, import("..").ICameraEntityMethods>, import("..").ILightEntityMethods>, import("..").ISkeletalEntityMethods>, import("..").IBlendShapeEntityMethods>, import("..").IPhysicsEntityMethods>, import("../../..").IEffekseerEntityMethods>, import("..").IVrmEntityMethods>, import("../Constraint").IConstraintEntityMethods>) & EntityBase;
}
