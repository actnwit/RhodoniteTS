import { Component } from '../../core/Component';
import { EntityRepository } from '../../core/EntityRepository';
import { AnimationInterpolationEnum } from '../../definitions/AnimationInterpolation';
import { TransformComponent } from '../Transform/TransformComponent';
import { ComponentTID, ComponentSID, EntityUID, Index, VectorComponentN } from '../../../types/CommonTypes';
import { AnimationPathName, AnimationTrack, AnimationComponentEventType, AnimationInfo, AnimationTrackName } from '../../../types/AnimationTypes';
import { EventHandler } from '../../system/EventPubSub';
import { IAnimationEntity } from '../../helpers/EntityHelper';
import { IEntity } from '../../core/Entity';
import { EffekseerComponent } from '../../../effekseer';
import { IAnimationRetarget, ISkeletalEntityMethods, SkeletalComponent } from '../Skeletal';
import { BlendShapeComponent } from '../BlendShape/BlendShapeComponent';
/**
 * A component that manages animation.
 */
export declare class AnimationComponent extends Component {
    private __firstActiveAnimationTrackName?;
    private __secondActiveAnimationTrackName?;
    private __interpolationRatioBtwFirstAndSecond;
    private __animationTracks;
    private static __animationGlobalInfo;
    private __transformComponent?;
    private __blendShapeComponent?;
    private __effekseerComponent?;
    private __isEffekseerState;
    private __isAnimating;
    static isAnimating: boolean;
    private isLoop;
    useGlobalTime: boolean;
    static globalTime: number;
    time: number;
    static readonly Event: {
        ChangeAnimationInfo: symbol;
        PlayEnd: symbol;
    };
    private static __pubsub;
    private static __vector3Zero;
    private static __vector3One;
    private static __identityQuaternion;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    $create(): void;
    $logic(): void;
    private __applyAnimation;
    static subscribe(type: AnimationComponentEventType, handler: EventHandler): void;
    setIsAnimating(flg: boolean): void;
    static setIsAnimatingForAll(flg: boolean): void;
    static setActiveAnimationForAll(animationTrackName: AnimationTrackName): void;
    setActiveAnimationTrack(animationTrackName: AnimationTrackName): boolean;
    static setActiveAnimationsForAll(animationTrackName: AnimationTrackName, secondTrackName: AnimationTrackName, interpolationRatioBtwFirstAndSecond: number): void;
    setActiveAnimationTracks(firstTrackName: AnimationTrackName, secondTrackName: AnimationTrackName, interpolationRatioBtwFirstAndSecond: number): boolean;
    setSecondActiveAnimationTrack(animationTrackName: AnimationTrackName): boolean;
    set interpolationRatioBtwFirstAndSecond(ratio: number);
    getActiveAnimationTrack(): string | undefined;
    hasAnimation(trackName: AnimationTrackName, pathName: AnimationPathName): boolean;
    /**
     * set an animation channel to AnimationSet
     * @param trackName - the name of animation track
     * @param pathName - the name of animation path
     * @param inputArray - the array of input values
     * @param outputArray - the array of output values
     * @param outputComponentN - the number of output value's components
     * @param interpolation - the interpolation type
     * @param makeThisActiveAnimation - if true, set this animation track as current active animation
     */
    setAnimation(trackName: AnimationTrackName, pathName: AnimationPathName, inputArray: Float32Array, outputArray: Float32Array, outputComponentN: VectorComponentN, interpolation: AnimationInterpolationEnum, makeThisActiveAnimation?: boolean): void;
    getStartInputValueOfAnimation(animationTrackName: string): number;
    getEndInputValueOfAnimation(animationTrackName: string): number;
    /**
     * get the Array of Animation Track Name
     * @returns Array of Animation Track Name
     */
    static getAnimationList(): AnimationTrackName[];
    /**
     * get the AnimationInfo of the Component
     * @returns the map of
     */
    static getAnimationInfo(): Map<AnimationTrackName, AnimationInfo>;
    /**
     * get animation track names of this component
     * @returns an array of animation track name
     */
    getAnimationTrackNames(): AnimationTrackName[];
    /**
     * get the animation channels of the animation track
     * @param animationTrackName the name of animation track to get
     * @returns the channel maps of the animation track
     */
    getAnimationChannelsOfTrack(animationTrackName: AnimationTrackName): AnimationTrack | undefined;
    get isAnimating(): boolean;
    static get startInputValue(): number;
    static get endInputValue(): number;
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    /**
     * get the entity which has this component.
     * @returns the entity which has this component
     */
    get entity(): IAnimationEntity;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): (SomeComponentClass extends typeof import("../Constraint").ConstraintComponent ? import("../Constraint").IConstraintEntityMethods : Exclude<SomeComponentClass extends typeof import("..").VrmComponent ? import("..").IVrmEntityMethods : Exclude<SomeComponentClass extends typeof EffekseerComponent ? import("../../../effekseer").IEffekseerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").PhysicsComponent ? import("..").IPhysicsEntityMethods : Exclude<SomeComponentClass extends typeof BlendShapeComponent ? import("..").IBlendShapeEntityMethods : Exclude<SomeComponentClass extends typeof SkeletalComponent ? ISkeletalEntityMethods : Exclude<SomeComponentClass extends typeof import("..").LightComponent ? import("..").ILightEntityMethods : Exclude<SomeComponentClass extends typeof import("..").CameraComponent ? import("..").ICameraEntityMethods : Exclude<SomeComponentClass extends typeof import("..").CameraControllerComponent ? import("..").ICameraControllerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshRendererComponent ? import("..").IMeshRendererEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshComponent ? import("..").IMeshEntityMethods : Exclude<SomeComponentClass extends typeof import("..").SceneGraphComponent ? import("..").ISceneGraphEntityMethods : Exclude<SomeComponentClass extends typeof TransformComponent ? import("..").ITransformEntityMethods : Exclude<SomeComponentClass extends typeof AnimationComponent ? import("./IAnimationEntity").IAnimationEntityMethods : import("..").ITransformEntityMethods | import("..").ISceneGraphEntityMethods | import("..").IMeshEntityMethods | import("..").IMeshRendererEntityMethods | import("..").ILightEntityMethods | import("..").ICameraEntityMethods | import("..").ICameraControllerEntityMethods | ISkeletalEntityMethods | import("..").IBlendShapeEntityMethods | import("..").IPhysicsEntityMethods | import("../../../effekseer").IEffekseerEntityMethods | import("..").IVrmEntityMethods, import("..").ITransformEntityMethods>, import("..").ISceneGraphEntityMethods>, import("..").IMeshEntityMethods>, import("..").IMeshRendererEntityMethods>, import("..").ICameraControllerEntityMethods>, import("..").ICameraEntityMethods>, import("..").ILightEntityMethods>, ISkeletalEntityMethods>, import("..").IBlendShapeEntityMethods>, import("..").IPhysicsEntityMethods>, import("../../../effekseer").IEffekseerEntityMethods>, import("..").IVrmEntityMethods>, import("../Constraint").IConstraintEntityMethods>) & EntityBase;
    addKeyFrame(trackName: AnimationTrackName, pathName: AnimationPathName, frameToInsert: Index, fps: number): boolean;
    addKeyFrameWithValue(trackName: AnimationTrackName, pathName: AnimationPathName, frameToInsert: Index, output: Array<number>, fps: number): boolean;
    deleteKeysAtFrame(trackName: AnimationTrackName, pathName: AnimationPathName, frameToDelete: Index, fps: number): boolean;
    hasKeyFramesAtFrame(trackName: AnimationTrackName, pathName: AnimationPathName, frame: Index, fps: number): boolean;
    static setIsAnimating(flag: boolean): void;
    _shallowCopyFrom(component_: Component): void;
    _setRetarget(retarget: IAnimationRetarget, is2nd: boolean, postFixToTrackName?: string): void;
    resetAnimationTracks(): void;
}
