import { Component } from '../../core/Component';
import { EntityRepository } from '../../core/EntityRepository';
import { Vector3 } from '../../math/Vector3';
import { SceneGraphComponent } from '../SceneGraph/SceneGraphComponent';
import { ComponentTID, EntityUID, ComponentSID } from '../../../types/CommonTypes';
import { ILightEntity } from '../../helpers/EntityHelper';
import { IEntity } from '../../core/Entity';
/**
 * The Component that represents a light.
 *
 * @remarks
 * the light looks towards the local -Z axis in right hand coordinate system.
 */
export declare class LightComponent extends Component {
    type: import("../..").EnumIO;
    private __intensity;
    private readonly __initialDirection;
    private __direction;
    innerConeAngle: number;
    outerConeAngle: number;
    range: number;
    enable: boolean;
    shadowAreaSizeForDirectionalLight: number;
    private __sceneGraphComponent?;
    private static __globalDataRepository;
    private static __tmp_vec4;
    private static __lightPositions;
    private static __lightDirections;
    private static __lightIntensities;
    private static __lightProperties;
    private static __lightNumber;
    private __lightGizmo?;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    get direction(): Vector3;
    set intensity(value: Vector3);
    get intensity(): Vector3;
    get _up(): Vector3;
    set isLightGizmoVisible(flg: boolean);
    get isLightGizmoVisible(): boolean;
    $create(): void;
    $load(): void;
    private __updateGizmo;
    static common_$logic(): void;
    $logic(): void;
    _destroy(): void;
    /**
     * get the entity which has this component.
     * @returns the entity which has this component
     */
    get entity(): ILightEntity;
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): (SomeComponentClass extends typeof import("../Constraint").ConstraintComponent ? import("../Constraint").IConstraintEntityMethods : Exclude<SomeComponentClass extends typeof import("..").VrmComponent ? import("..").IVrmEntityMethods : Exclude<SomeComponentClass extends typeof import("../../..").EffekseerComponent ? import("../../..").IEffekseerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").PhysicsComponent ? import("..").IPhysicsEntityMethods : Exclude<SomeComponentClass extends typeof import("..").BlendShapeComponent ? import("..").IBlendShapeEntityMethods : Exclude<SomeComponentClass extends typeof import("..").SkeletalComponent ? import("..").ISkeletalEntityMethods : Exclude<SomeComponentClass extends typeof LightComponent ? import("./ILightEntity").ILightEntityMethods : Exclude<SomeComponentClass extends typeof import("..").CameraComponent ? import("..").ICameraEntityMethods : Exclude<SomeComponentClass extends typeof import("..").CameraControllerComponent ? import("..").ICameraControllerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshRendererComponent ? import("..").IMeshRendererEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshComponent ? import("..").IMeshEntityMethods : Exclude<SomeComponentClass extends typeof SceneGraphComponent ? import("..").ISceneGraphEntityMethods : Exclude<SomeComponentClass extends typeof import("..").TransformComponent ? import("..").ITransformEntityMethods : Exclude<SomeComponentClass extends typeof import("..").AnimationComponent ? import("..").IAnimationEntityMethods : import("..").ITransformEntityMethods | import("..").ISceneGraphEntityMethods | import("..").IMeshEntityMethods | import("..").IMeshRendererEntityMethods | import("./ILightEntity").ILightEntityMethods | import("..").ICameraEntityMethods | import("..").ICameraControllerEntityMethods | import("..").ISkeletalEntityMethods | import("..").IBlendShapeEntityMethods | import("..").IPhysicsEntityMethods | import("../../..").IEffekseerEntityMethods | import("..").IVrmEntityMethods, import("..").ITransformEntityMethods>, import("..").ISceneGraphEntityMethods>, import("..").IMeshEntityMethods>, import("..").IMeshRendererEntityMethods>, import("..").ICameraControllerEntityMethods>, import("..").ICameraEntityMethods>, import("./ILightEntity").ILightEntityMethods>, import("..").ISkeletalEntityMethods>, import("..").IBlendShapeEntityMethods>, import("..").IPhysicsEntityMethods>, import("../../..").IEffekseerEntityMethods>, import("..").IVrmEntityMethods>, import("../Constraint").IConstraintEntityMethods>) & EntityBase;
}
