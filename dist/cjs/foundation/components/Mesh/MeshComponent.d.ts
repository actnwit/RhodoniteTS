import { Component } from '../../core/Component';
import { EntityRepository } from '../../core/EntityRepository';
import { Vector3 } from '../../math/Vector3';
import { CameraComponent } from '../Camera/CameraComponent';
import { Vector4 } from '../../math/Vector4';
import { Mesh } from '../../geometry/Mesh';
import { IEntity } from '../../core/Entity';
import { ComponentTID, EntityUID, ComponentSID } from '../../../types/CommonTypes';
import { SceneGraphComponent } from '../SceneGraph/SceneGraphComponent';
import { ProcessApproachEnum } from '../../definitions/ProcessApproach';
import { IMeshEntity } from '../../helpers/EntityHelper';
import { BlendShapeComponent } from '../BlendShape/BlendShapeComponent';
import { RaycastResultEx1 } from '../../geometry/types/GeometryTypes';
export declare class MeshComponent extends Component {
    private __viewDepth;
    private __mesh?;
    private __blendShapeComponent?;
    private __sceneGraphComponent?;
    isPickable: boolean;
    private static __tmpVector3_0;
    private static __tmpVector3_1;
    private static __tmpVector3_2;
    private static __returnVector3;
    private static __tmpMatrix44_0;
    private static __latestPrimitivePositionAccessorVersion;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    static get componentTID(): ComponentTID;
    setMesh(mesh: Mesh): void;
    unsetMesh(): boolean;
    get mesh(): Mesh | undefined;
    set weights(value: number[]);
    calcViewDepth(cameraComponent: CameraComponent): number;
    get viewDepth(): number;
    static alertNoMeshSet(meshComponent: MeshComponent): void;
    castRay(srcPointInWorld: Vector3, directionInWorld: Vector3, dotThreshold?: number): RaycastResultEx1;
    castRayFromScreenInLocal(x: number, y: number, camera: CameraComponent, viewport: Vector4, dotThreshold?: number): RaycastResultEx1;
    castRayFromScreenInWorld(x: number, y: number, camera: CameraComponent, viewport: Vector4, dotThreshold?: number): RaycastResultEx1;
    $create(): void;
    static common_$load({ processApproach, }: {
        processApproach: ProcessApproachEnum;
    }): void;
    $load(): void;
    $logic(): void;
    /**
     * get the entity which has this component.
     * @returns the entity which has this component
     */
    get entity(): IMeshEntity;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): (SomeComponentClass extends typeof import("../../../sparkgear/SparkGearComponent").SparkGearComponent ? import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods : Exclude<SomeComponentClass extends typeof import("../../..").EffekseerComponent ? import("../../..").IEffekseerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").PhysicsComponent ? import("..").IPhysicsEntityMethods : Exclude<SomeComponentClass extends typeof BlendShapeComponent ? import("..").IBlendShapeEntityMethods : Exclude<SomeComponentClass extends typeof import("..").SkeletalComponent ? import("..").ISkeletalEntityMethods : Exclude<SomeComponentClass extends typeof import("..").LightComponent ? import("..").ILightEntityMethods : Exclude<SomeComponentClass extends typeof CameraComponent ? import("..").ICameraEntityMethods : Exclude<SomeComponentClass extends typeof import("..").CameraControllerComponent ? import("..").ICameraControllerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshRendererComponent ? import("..").IMeshRendererEntityMethods : Exclude<SomeComponentClass extends typeof MeshComponent ? import("./IMeshEntity").IMeshEntityMethods : Exclude<SomeComponentClass extends typeof SceneGraphComponent ? import("..").ISceneGraphEntityMethods : Exclude<SomeComponentClass extends typeof import("..").TransformComponent ? import("..").ITransformEntityMethods : Exclude<SomeComponentClass extends typeof import("..").AnimationComponent ? import("..").IAnimationEntityMethods : import("..").ITransformEntityMethods | import("..").ISceneGraphEntityMethods | import("..").ISkeletalEntityMethods | import("./IMeshEntity").IMeshEntityMethods | import("..").IMeshRendererEntityMethods | import("..").ICameraEntityMethods | import("..").ICameraControllerEntityMethods | import("..").ILightEntityMethods | import("..").IBlendShapeEntityMethods | import("..").IPhysicsEntityMethods | import("../../..").IEffekseerEntityMethods | import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods, import("..").ITransformEntityMethods>, import("..").ISceneGraphEntityMethods>, import("./IMeshEntity").IMeshEntityMethods>, import("..").IMeshRendererEntityMethods>, import("..").ICameraControllerEntityMethods>, import("..").ICameraEntityMethods>, import("..").ILightEntityMethods>, import("..").ISkeletalEntityMethods>, import("..").IBlendShapeEntityMethods>, import("..").IPhysicsEntityMethods>, import("../../..").IEffekseerEntityMethods>, import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods>) & EntityBase;
}
