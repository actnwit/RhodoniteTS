import { Component } from '../../core/Component';
import { MeshComponent } from '../Mesh/MeshComponent';
import { ProcessApproachEnum } from '../../definitions/ProcessApproach';
import { ProcessStageEnum } from '../../definitions/ProcessStage';
import { EntityRepository } from '../../core/EntityRepository';
import { CameraComponent } from '../Camera/CameraComponent';
import { CubeTexture } from '../../textures/CubeTexture';
import { RenderPass } from '../../renderer/RenderPass';
import { ComponentSID, CGAPIResourceHandle, Count, Index, ObjectUID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { IEntity } from '../../core/Entity';
export declare class MeshRendererComponent extends Component {
    diffuseCubeMap?: CubeTexture;
    specularCubeMap?: CubeTexture;
    diffuseCubeMapContribution: number;
    specularCubeMapContribution: number;
    rotationOfCubeMap: number;
    _readyForRendering: boolean;
    private __meshComponent?;
    private static __webglRenderingStrategy?;
    static _lastOpaqueIndex: number;
    static _lastTransparentIndex: number;
    static _firstTransparentSortKey: number;
    static _lastTransparentSortKey: number;
    static isViewFrustumCullingEnabled: boolean;
    static isDepthMaskTrueForTransparencies: boolean;
    static __shaderProgramHandleOfPrimitiveObjectUids: Map<ObjectUID, CGAPIResourceHandle>;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    $create(): void;
    static common_$load({ processApproach }: {
        processApproach: ProcessApproachEnum;
    }): void;
    $load(): void;
    static common_$prerender(): void;
    static sort_$render(renderPass: RenderPass): ComponentSID[];
    private static sort_$render_inner;
    private static __cullingWithViewFrustum;
    static common_$render({ renderPass, processStage, renderPassTickCount, }: {
        renderPass: RenderPass;
        processStage: ProcessStageEnum;
        renderPassTickCount: Count;
    }): void;
    $render({ i, renderPass, renderPassTickCount, }: {
        i: Index;
        renderPass: RenderPass;
        renderPassTickCount: Count;
    }): void;
    _shallowCopyFrom(component_: Component): void;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): (SomeComponentClass extends typeof import("../Constraint").ConstraintComponent ? import("../Constraint").IConstraintEntityMethods : Exclude<SomeComponentClass extends typeof import("..").VrmComponent ? import("..").IVrmEntityMethods : Exclude<SomeComponentClass extends typeof import("../../..").EffekseerComponent ? import("../../..").IEffekseerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").PhysicsComponent ? import("..").IPhysicsEntityMethods : Exclude<SomeComponentClass extends typeof import("..").BlendShapeComponent ? import("..").IBlendShapeEntityMethods : Exclude<SomeComponentClass extends typeof import("..").SkeletalComponent ? import("..").ISkeletalEntityMethods : Exclude<SomeComponentClass extends typeof import("..").LightComponent ? import("..").ILightEntityMethods : Exclude<SomeComponentClass extends typeof CameraComponent ? import("..").ICameraEntityMethods : Exclude<SomeComponentClass extends typeof import("..").CameraControllerComponent ? import("..").ICameraControllerEntityMethods : Exclude<SomeComponentClass extends typeof MeshRendererComponent ? import("./IMeshRendererEntity").IMeshRendererEntityMethods : Exclude<SomeComponentClass extends typeof MeshComponent ? import("..").IMeshEntityMethods : Exclude<SomeComponentClass extends typeof import("..").SceneGraphComponent ? import("..").ISceneGraphEntityMethods : Exclude<SomeComponentClass extends typeof import("..").TransformComponent ? import("..").ITransformEntityMethods : Exclude<SomeComponentClass extends typeof import("..").AnimationComponent ? import("..").IAnimationEntityMethods : import("..").ITransformEntityMethods | import("..").ISceneGraphEntityMethods | import("..").IMeshEntityMethods | import("./IMeshRendererEntity").IMeshRendererEntityMethods | import("..").ILightEntityMethods | import("..").ICameraEntityMethods | import("..").ICameraControllerEntityMethods | import("..").ISkeletalEntityMethods | import("..").IBlendShapeEntityMethods | import("..").IPhysicsEntityMethods | import("../../..").IEffekseerEntityMethods | import("..").IVrmEntityMethods, import("..").ITransformEntityMethods>, import("..").ISceneGraphEntityMethods>, import("..").IMeshEntityMethods>, import("./IMeshRendererEntity").IMeshRendererEntityMethods>, import("..").ICameraControllerEntityMethods>, import("..").ICameraEntityMethods>, import("..").ILightEntityMethods>, import("..").ISkeletalEntityMethods>, import("..").IBlendShapeEntityMethods>, import("..").IPhysicsEntityMethods>, import("../../..").IEffekseerEntityMethods>, import("..").IVrmEntityMethods>, import("../Constraint").IConstraintEntityMethods>) & EntityBase;
}
