import { Component } from '../foundation/core/Component';
import { EntityRepository } from '../foundation/core/EntityRepository';
import { CameraComponent } from '../foundation/components/Camera/CameraComponent';
import { WebGLResourceRepository } from '../webgl/WebGLResourceRepository';
import { SceneGraphComponent } from '../foundation/components/SceneGraph/SceneGraphComponent';
import { ComponentTID, EntityUID, ComponentSID } from '../types/CommonTypes';
import { IMatrix44 } from '../foundation/math/IMatrix';
import { IEntity } from '../foundation/core/Entity';
export declare class SparkGearComponent extends Component {
    url?: string;
    private __hSPFXInst;
    private static __isInitialized;
    private __sceneGraphComponent?;
    private static SPFX_WebGLResourceRepository;
    private static SPFX_TempVAO;
    private static SPFX_CurrentVAO;
    private static SPFX_UsingVAO;
    private static SPFX_ArrayBuffer;
    private static SPFX_ElementArrayBuffer;
    private static SPFX_CurrentProgram;
    private static SPFX_FrontFace;
    private static SPFX_DepthFunc;
    private static SPFX_DepthWriteMask;
    private static SPFX_StencilTestEnabled;
    private static SPFX_DepthTestEnabled;
    private static SPFX_CullFaceEnabled;
    private static SPFX_BlendEnabled;
    private static SPFX_BlendSrcRgb;
    private static SPFX_BlendDstRgb;
    private static SPFX_BlendSrcAlpha;
    private static SPFX_BlendDstAlpha;
    private static SPFX_ActiveTexture;
    private static SPFX_Texture;
    private static __tmp_indentityMatrix;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    static get componentTID(): ComponentTID;
    onBeforeRender(): void;
    onAfterRender(): void;
    play(): void;
    stop(): void;
    pause(): void;
    isPlaying(): any;
    kickTrigger(trigger: any): void;
    static SPARK_BackupStatus(): void;
    static SPARK_RestoreStatus: () => void;
    static SPFX_Initialize: (repository: WebGLResourceRepository) => void;
    static SPFX_Uninitialize(): void;
    static SPARK_SetCameraMatrix(viewMatrix: IMatrix44, projectionMatrix: IMatrix44): void;
    static SPFX_Update: (DeltaTime: number) => void;
    static SPARK_Draw(): void;
    static SPARK_DrawDebugInfo(InfoType: any): void;
    $create(): void;
    static common_$load(): void;
    $load(): void;
    $logic(): void;
    $render(): void;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): (SomeComponentClass extends typeof SparkGearComponent ? ISparkGearEntityMethods : Exclude<SomeComponentClass extends typeof import("..").EffekseerComponent ? import("..").IEffekseerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").PhysicsComponent ? import("..").IPhysicsEntityMethods : Exclude<SomeComponentClass extends typeof import("..").BlendShapeComponent ? import("..").IBlendShapeEntityMethods : Exclude<SomeComponentClass extends typeof import("..").SkeletalComponent ? import("..").ISkeletalEntityMethods : Exclude<SomeComponentClass extends typeof import("..").LightComponent ? import("..").ILightEntityMethods : Exclude<SomeComponentClass extends typeof CameraComponent ? import("..").ICameraEntityMethods : Exclude<SomeComponentClass extends typeof import("..").CameraControllerComponent ? import("..").ICameraControllerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshRendererComponent ? import("..").IMeshRendererEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshComponent ? import("..").IMeshEntityMethods : Exclude<SomeComponentClass extends typeof SceneGraphComponent ? import("..").ISceneGraphEntityMethods : Exclude<SomeComponentClass extends typeof import("..").TransformComponent ? import("..").ITransformEntityMethods : Exclude<SomeComponentClass extends typeof import("..").AnimationComponent ? import("..").IAnimationEntityMethods : import("..").ITransformEntityMethods | import("..").ISceneGraphEntityMethods | import("..").ISkeletalEntityMethods | import("..").IMeshEntityMethods | import("..").IMeshRendererEntityMethods | import("..").ICameraEntityMethods | import("..").ICameraControllerEntityMethods | import("..").ILightEntityMethods | import("..").IBlendShapeEntityMethods | import("..").IPhysicsEntityMethods | import("..").IEffekseerEntityMethods | ISparkGearEntityMethods, import("..").ITransformEntityMethods>, import("..").ISceneGraphEntityMethods>, import("..").IMeshEntityMethods>, import("..").IMeshRendererEntityMethods>, import("..").ICameraControllerEntityMethods>, import("..").ICameraEntityMethods>, import("..").ILightEntityMethods>, import("..").ISkeletalEntityMethods>, import("..").IBlendShapeEntityMethods>, import("..").IPhysicsEntityMethods>, import("..").IEffekseerEntityMethods>, ISparkGearEntityMethods>) & EntityBase;
}
export interface ISparkGearEntityMethods {
    getSparkGear(): SparkGearComponent;
}
