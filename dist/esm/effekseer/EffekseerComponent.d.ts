/// <reference path="../../../vendor/effekseer.d.ts" />
/// <reference types="node" />
import { Component } from '../foundation/core/Component';
import { EntityRepository } from '../foundation/core/EntityRepository';
import { SceneGraphComponent } from '../foundation/components/SceneGraph/SceneGraphComponent';
import { TransformComponent } from '../foundation/components/Transform/TransformComponent';
import { CameraComponent } from '../foundation/components/Camera/CameraComponent';
import { ComponentTID, EntityUID, ComponentSID, Second } from '../types/CommonTypes';
import { IVector3 } from '../foundation/math/IVector';
import type { Unzip } from 'zlib';
import { IEntity } from '../foundation/core/Entity';
import { RenderPass } from '../foundation/renderer/RenderPass';
export declare class EffekseerComponent extends Component {
    static readonly ANIMATION_EVENT_PLAY = 0;
    static readonly ANIMATION_EVENT_PAUSE = 1;
    static readonly ANIMATION_EVENT_END = 2;
    static Unzip?: Unzip;
    uri?: string;
    arrayBuffer?: ArrayBuffer;
    type: string;
    playJustAfterLoaded: boolean;
    isLoop: boolean;
    isPause: boolean;
    static wasmModuleUri: undefined;
    randomSeed: number;
    isImageLoadWithCredential: boolean;
    private __effect?;
    private __context?;
    private __handle?;
    private __speed;
    private __timer?;
    private __sceneGraphComponent?;
    private __transformComponent?;
    private static __isInitialized;
    private static __tmp_identityMatrix_0;
    private static __tmp_identityMatrix_1;
    private isLoadEffect;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    static get componentTID(): ComponentTID;
    cancelLoop(): void;
    isPlay(): boolean;
    play(): boolean;
    continue(): void;
    pause(): void;
    stop(): void;
    set playSpeed(val: number);
    get playSpeed(): number;
    setTime(targetSec: Second): boolean;
    set translate(vec: IVector3);
    get translate(): IVector3;
    set rotate(vec: IVector3);
    get rotate(): IVector3;
    set scale(vec: IVector3);
    get scale(): IVector3;
    $create(): void;
    private __createEffekseerContext;
    $load(): void;
    $logic(): void;
    $render(): void;
    static sort_$render(renderPass: RenderPass): ComponentSID[];
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): (SomeComponentClass extends typeof import("../sparkgear/SparkGearComponent").SparkGearComponent ? import("../sparkgear/SparkGearComponent").ISparkGearEntityMethods : Exclude<SomeComponentClass extends typeof EffekseerComponent ? IEffekseerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").PhysicsComponent ? import("..").IPhysicsEntityMethods : Exclude<SomeComponentClass extends typeof import("..").BlendShapeComponent ? import("..").IBlendShapeEntityMethods : Exclude<SomeComponentClass extends typeof import("..").SkeletalComponent ? import("..").ISkeletalEntityMethods : Exclude<SomeComponentClass extends typeof import("..").LightComponent ? import("..").ILightEntityMethods : Exclude<SomeComponentClass extends typeof CameraComponent ? import("..").ICameraEntityMethods : Exclude<SomeComponentClass extends typeof import("..").CameraControllerComponent ? import("..").ICameraControllerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshRendererComponent ? import("..").IMeshRendererEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshComponent ? import("..").IMeshEntityMethods : Exclude<SomeComponentClass extends typeof SceneGraphComponent ? import("..").ISceneGraphEntityMethods : Exclude<SomeComponentClass extends typeof TransformComponent ? import("..").ITransformEntityMethods : Exclude<SomeComponentClass extends typeof import("..").AnimationComponent ? import("..").IAnimationEntityMethods : import("..").ITransformEntityMethods | import("..").ISceneGraphEntityMethods | import("..").ISkeletalEntityMethods | import("..").IMeshEntityMethods | import("..").IMeshRendererEntityMethods | import("..").ICameraEntityMethods | import("..").ICameraControllerEntityMethods | import("..").ILightEntityMethods | import("..").IBlendShapeEntityMethods | import("..").IPhysicsEntityMethods | IEffekseerEntityMethods | import("../sparkgear/SparkGearComponent").ISparkGearEntityMethods, import("..").ITransformEntityMethods>, import("..").ISceneGraphEntityMethods>, import("..").IMeshEntityMethods>, import("..").IMeshRendererEntityMethods>, import("..").ICameraControllerEntityMethods>, import("..").ICameraEntityMethods>, import("..").ILightEntityMethods>, import("..").ISkeletalEntityMethods>, import("..").IBlendShapeEntityMethods>, import("..").IPhysicsEntityMethods>, IEffekseerEntityMethods>, import("../sparkgear/SparkGearComponent").ISparkGearEntityMethods>) & EntityBase;
}
export interface IEffekseerEntityMethods {
    getEffekseer(): EffekseerComponent;
}
