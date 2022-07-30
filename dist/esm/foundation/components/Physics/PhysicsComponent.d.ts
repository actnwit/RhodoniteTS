import { Component } from '../../core/Component';
import { EntityRepository } from '../../core/EntityRepository';
import { ComponentTID, ComponentSID, EntityUID } from '../../../types/CommonTypes';
import { PhysicsStrategy } from '../../physics/PhysicsStrategy';
import { IEntity } from '../../core/Entity';
export declare class PhysicsComponent extends Component {
    private __strategy;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository);
    static get componentTID(): ComponentTID;
    get strategy(): PhysicsStrategy;
    static common_$logic(): void;
    $logic(): void;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): (SomeComponentClass extends typeof import("../../../sparkgear/SparkGearComponent").SparkGearComponent ? import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods : Exclude<SomeComponentClass extends typeof import("../../..").EffekseerComponent ? import("../../..").IEffekseerEntityMethods : Exclude<SomeComponentClass extends typeof PhysicsComponent ? import("./IPhysicsEntity").IPhysicsEntityMethods : Exclude<SomeComponentClass extends typeof import("..").BlendShapeComponent ? import("..").IBlendShapeEntityMethods : Exclude<SomeComponentClass extends typeof import("..").SkeletalComponent ? import("..").ISkeletalEntityMethods : Exclude<SomeComponentClass extends typeof import("..").LightComponent ? import("..").ILightEntityMethods : Exclude<SomeComponentClass extends typeof import("..").CameraComponent ? import("..").ICameraEntityMethods : Exclude<SomeComponentClass extends typeof import("..").CameraControllerComponent ? import("..").ICameraControllerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshRendererComponent ? import("..").IMeshRendererEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshComponent ? import("..").IMeshEntityMethods : Exclude<SomeComponentClass extends typeof import("..").SceneGraphComponent ? import("..").ISceneGraphEntityMethods : Exclude<SomeComponentClass extends typeof import("..").TransformComponent ? import("..").ITransformEntityMethods : Exclude<SomeComponentClass extends typeof import("..").AnimationComponent ? import("..").IAnimationEntityMethods : import("..").ITransformEntityMethods | import("..").ISceneGraphEntityMethods | import("..").ISkeletalEntityMethods | import("..").IMeshEntityMethods | import("..").IMeshRendererEntityMethods | import("..").ICameraEntityMethods | import("..").ICameraControllerEntityMethods | import("..").ILightEntityMethods | import("..").IBlendShapeEntityMethods | import("./IPhysicsEntity").IPhysicsEntityMethods | import("../../..").IEffekseerEntityMethods | import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods, import("..").ITransformEntityMethods>, import("..").ISceneGraphEntityMethods>, import("..").IMeshEntityMethods>, import("..").IMeshRendererEntityMethods>, import("..").ICameraControllerEntityMethods>, import("..").ICameraEntityMethods>, import("..").ILightEntityMethods>, import("..").ISkeletalEntityMethods>, import("..").IBlendShapeEntityMethods>, import("./IPhysicsEntity").IPhysicsEntityMethods>, import("../../..").IEffekseerEntityMethods>, import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods>) & EntityBase;
}
