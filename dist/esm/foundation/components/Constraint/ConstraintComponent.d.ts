import { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { IVrmConstraint } from '../../constraints/IVrmConstraint';
import { Component } from '../../core/Component';
import { IEntity } from '../../core/Entity';
import { EntityRepository } from '../../core/EntityRepository';
import { IConstraintEntity } from '../../helpers/EntityHelper';
export declare class ConstraintComponent extends Component {
    private __vrmConstraint?;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository, isReUse: boolean);
    /**
     * get the entity which has this component.
     * @returns the entity which has this component
     */
    get entity(): IConstraintEntity;
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    $logic(): void;
    setConstraint(constraint: IVrmConstraint): void;
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): (SomeComponentClass extends typeof ConstraintComponent ? import("./IConstraintEntity").IConstraintEntityMethods : Exclude<SomeComponentClass extends typeof import("..").VrmComponent ? import("..").IVrmEntityMethods : Exclude<SomeComponentClass extends typeof import("../../..").EffekseerComponent ? import("../../..").IEffekseerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").PhysicsComponent ? import("..").IPhysicsEntityMethods : Exclude<SomeComponentClass extends typeof import("..").BlendShapeComponent ? import("..").IBlendShapeEntityMethods : Exclude<SomeComponentClass extends typeof import("..").SkeletalComponent ? import("..").ISkeletalEntityMethods : Exclude<SomeComponentClass extends typeof import("..").LightComponent ? import("..").ILightEntityMethods : Exclude<SomeComponentClass extends typeof import("..").CameraComponent ? import("..").ICameraEntityMethods : Exclude<SomeComponentClass extends typeof import("..").CameraControllerComponent ? import("..").ICameraControllerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshRendererComponent ? import("..").IMeshRendererEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshComponent ? import("..").IMeshEntityMethods : Exclude<SomeComponentClass extends typeof import("..").SceneGraphComponent ? import("..").ISceneGraphEntityMethods : Exclude<SomeComponentClass extends typeof import("..").TransformComponent ? import("..").ITransformEntityMethods : Exclude<SomeComponentClass extends typeof import("..").AnimationComponent ? import("..").IAnimationEntityMethods : import("..").ITransformEntityMethods | import("..").ISceneGraphEntityMethods | import("..").IMeshEntityMethods | import("..").IMeshRendererEntityMethods | import("..").ILightEntityMethods | import("..").ICameraEntityMethods | import("..").ICameraControllerEntityMethods | import("..").ISkeletalEntityMethods | import("..").IBlendShapeEntityMethods | import("..").IPhysicsEntityMethods | import("../../..").IEffekseerEntityMethods | import("..").IVrmEntityMethods, import("..").ITransformEntityMethods>, import("..").ISceneGraphEntityMethods>, import("..").IMeshEntityMethods>, import("..").IMeshRendererEntityMethods>, import("..").ICameraControllerEntityMethods>, import("..").ICameraEntityMethods>, import("..").ILightEntityMethods>, import("..").ISkeletalEntityMethods>, import("..").IBlendShapeEntityMethods>, import("..").IPhysicsEntityMethods>, import("../../..").IEffekseerEntityMethods>, import("..").IVrmEntityMethods>, import("./IConstraintEntity").IConstraintEntityMethods>) & EntityBase;
}
