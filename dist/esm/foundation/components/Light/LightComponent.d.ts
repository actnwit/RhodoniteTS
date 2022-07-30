import { Component } from '../../core/Component';
import { EntityRepository } from '../../core/EntityRepository';
import { Vector3 } from '../../math/Vector3';
import { SceneGraphComponent } from '../SceneGraph/SceneGraphComponent';
import { ComponentTID, EntityUID, ComponentSID } from '../../../types/CommonTypes';
import { ILightEntity } from '../../helpers/EntityHelper';
import { IEntity } from '../../core/Entity';
export declare class LightComponent extends Component {
    type: import("../..").EnumIO;
    private __intensity;
    private readonly __initialdirection;
    private __direction;
    innerConeAngle: number;
    outerConeAngle: number;
    range: number;
    enable: boolean;
    private __sceneGraphComponent?;
    private static __globalDataRepository;
    private static __tmp_vec4;
    private static __lightPositions;
    private static __lightDirections;
    private static __lightIntensities;
    private static __lightProperties;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    static get componentTID(): ComponentTID;
    get direction(): Vector3;
    set intensity(value: Vector3);
    get intensity(): Vector3;
    $create(): void;
    $load(): void;
    $logic(): void;
    /**
     * get the entity which has this component.
     * @returns the entity which has this component
     */
    get entity(): ILightEntity;
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): (SomeComponentClass extends typeof import("../../../sparkgear/SparkGearComponent").SparkGearComponent ? import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods : Exclude<SomeComponentClass extends typeof import("../../..").EffekseerComponent ? import("../../..").IEffekseerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").PhysicsComponent ? import("..").IPhysicsEntityMethods : Exclude<SomeComponentClass extends typeof import("..").BlendShapeComponent ? import("..").IBlendShapeEntityMethods : Exclude<SomeComponentClass extends typeof import("..").SkeletalComponent ? import("..").ISkeletalEntityMethods : Exclude<SomeComponentClass extends typeof LightComponent ? import("./ILightEntity").ILightEntityMethods : Exclude<SomeComponentClass extends typeof import("..").CameraComponent ? import("..").ICameraEntityMethods : Exclude<SomeComponentClass extends typeof import("..").CameraControllerComponent ? import("..").ICameraControllerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshRendererComponent ? import("..").IMeshRendererEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshComponent ? import("..").IMeshEntityMethods : Exclude<SomeComponentClass extends typeof SceneGraphComponent ? import("..").ISceneGraphEntityMethods : Exclude<SomeComponentClass extends typeof import("..").TransformComponent ? import("..").ITransformEntityMethods : Exclude<SomeComponentClass extends typeof import("..").AnimationComponent ? import("..").IAnimationEntityMethods : import("..").ITransformEntityMethods | import("..").ISceneGraphEntityMethods | import("..").ISkeletalEntityMethods | import("..").IMeshEntityMethods | import("..").IMeshRendererEntityMethods | import("..").ICameraEntityMethods | import("..").ICameraControllerEntityMethods | import("./ILightEntity").ILightEntityMethods | import("..").IBlendShapeEntityMethods | import("..").IPhysicsEntityMethods | import("../../..").IEffekseerEntityMethods | import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods, import("..").ITransformEntityMethods>, import("..").ISceneGraphEntityMethods>, import("..").IMeshEntityMethods>, import("..").IMeshRendererEntityMethods>, import("..").ICameraControllerEntityMethods>, import("..").ICameraEntityMethods>, import("./ILightEntity").ILightEntityMethods>, import("..").ISkeletalEntityMethods>, import("..").IBlendShapeEntityMethods>, import("..").IPhysicsEntityMethods>, import("../../..").IEffekseerEntityMethods>, import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods>) & EntityBase;
}
