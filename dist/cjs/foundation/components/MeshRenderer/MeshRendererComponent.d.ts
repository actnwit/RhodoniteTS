import { Component } from '../../core/Component';
import { MeshComponent } from '../Mesh/MeshComponent';
import { ProcessApproachEnum } from '../../definitions/ProcessApproach';
import { ProcessStageEnum } from '../../definitions/ProcessStage';
import { EntityRepository } from '../../core/EntityRepository';
import { SceneGraphComponent } from '../SceneGraph/SceneGraphComponent';
import { CameraComponent } from '../Camera/CameraComponent';
import { CubeTexture } from '../../textures/CubeTexture';
import { RenderPass } from '../../renderer/RenderPass';
import { ComponentSID, CGAPIResourceHandle, Count, Index, ObjectUID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { IEntity } from '../../core/Entity';
export declare class MeshRendererComponent extends Component {
    private __meshComponent?;
    static __shaderProgramHandleOfPrimitiveObjectUids: Map<ObjectUID, CGAPIResourceHandle>;
    diffuseCubeMap?: CubeTexture;
    specularCubeMap?: CubeTexture;
    diffuseCubeMapContribution: number;
    specularCubeMapContribution: number;
    rotationOfCubeMap: number;
    private static __webglRenderingStrategy?;
    private static __tmp_identityMatrix;
    static _lastOpaqueIndex: number;
    static _lastTransparentIndex: number;
    static _firstTransparentSortKey: number;
    static _lastTransparentSortKey: number;
    private static __manualTransparentSids?;
    _readyForRendering: boolean;
    static isViewFrustumCullingEnabled: boolean;
    static isDepthMaskTrueForTransparencies: boolean;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    static get componentTID(): ComponentTID;
    $create(): void;
    static common_$load({ processApproach, }: {
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
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): (SomeComponentClass extends typeof import("../../../sparkgear/SparkGearComponent").SparkGearComponent ? import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods : Exclude<SomeComponentClass extends typeof import("../../..").EffekseerComponent ? import("../../..").IEffekseerEntityMethods : Exclude<SomeComponentClass extends typeof import("../Physics/PhysicsComponent").PhysicsComponent ? import("../Physics/IPhysicsEntity").IPhysicsEntityMethods : Exclude<SomeComponentClass extends typeof import("../BlendShape/BlendShapeComponent").BlendShapeComponent ? import("../BlendShape/IBlendShapeEntity").IBlendShapeEntityMethods : Exclude<SomeComponentClass extends typeof import("../Skeletal/SkeletalComponent").SkeletalComponent ? import("../Skeletal/ISkeletalEntity").ISkeletalEntityMethods : Exclude<SomeComponentClass extends typeof import("../Light/LightComponent").LightComponent ? import("../Light/ILightEntity").ILightEntityMethods : Exclude<SomeComponentClass extends typeof CameraComponent ? import("../Camera/ICameraEntity").ICameraEntityMethods : Exclude<SomeComponentClass extends typeof import("../CameraController/CameraControllerComponent").CameraControllerComponent ? import("../CameraController/ICameraControllerEntity").ICameraControllerEntityMethods : Exclude<SomeComponentClass extends typeof MeshRendererComponent ? import("./IMeshRendererEntity").IMeshRendererEntityMethods : Exclude<SomeComponentClass extends typeof MeshComponent ? import("../Mesh/IMeshEntity").IMeshEntityMethods : Exclude<SomeComponentClass extends typeof SceneGraphComponent ? import("../SceneGraph/ISceneGraphEntity").ISceneGraphEntityMethods : Exclude<SomeComponentClass extends typeof import("../Transform/TransformComponent").TransformComponent ? import("../Transform/ITransformEntity").ITransformEntityMethods : Exclude<SomeComponentClass extends typeof import("../Animation/AnimationComponent").AnimationComponent ? import("../Animation/IAnimationEntity").IAnimationEntityMethods : import("../Transform/ITransformEntity").ITransformEntityMethods | import("../SceneGraph/ISceneGraphEntity").ISceneGraphEntityMethods | import("../Light/ILightEntity").ILightEntityMethods | import("../Mesh/IMeshEntity").IMeshEntityMethods | import("./IMeshRendererEntity").IMeshRendererEntityMethods | import("../Camera/ICameraEntity").ICameraEntityMethods | import("../CameraController/ICameraControllerEntity").ICameraControllerEntityMethods | import("../Skeletal/ISkeletalEntity").ISkeletalEntityMethods | import("../BlendShape/IBlendShapeEntity").IBlendShapeEntityMethods | import("../Physics/IPhysicsEntity").IPhysicsEntityMethods | import("../../..").IEffekseerEntityMethods | import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods, import("../Transform/ITransformEntity").ITransformEntityMethods>, import("../SceneGraph/ISceneGraphEntity").ISceneGraphEntityMethods>, import("../Mesh/IMeshEntity").IMeshEntityMethods>, import("./IMeshRendererEntity").IMeshRendererEntityMethods>, import("../CameraController/ICameraControllerEntity").ICameraControllerEntityMethods>, import("../Camera/ICameraEntity").ICameraEntityMethods>, import("../Light/ILightEntity").ILightEntityMethods>, import("../Skeletal/ISkeletalEntity").ISkeletalEntityMethods>, import("../BlendShape/IBlendShapeEntity").IBlendShapeEntityMethods>, import("../Physics/IPhysicsEntity").IPhysicsEntityMethods>, import("../../..").IEffekseerEntityMethods>, import("../../../sparkgear/SparkGearComponent").ISparkGearEntityMethods>) & EntityBase;
}
