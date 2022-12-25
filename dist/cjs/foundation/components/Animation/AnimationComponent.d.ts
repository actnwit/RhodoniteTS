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
import { IMatrix44 } from '../../math';
import { IAnimationRetarget, ISkeletalEntityMethods, SkeletalComponent } from '../Skeletal';
import { SceneGraphComponent } from '../SceneGraph';
import { BlendShapeComponent } from '../BlendShape/BlendShapeComponent';
/**
 * A component that manages animation.
 */
export declare class AnimationComponent extends Component {
    private __currentActiveAnimationTrackName?;
    private __animationTracks;
    private __transformComponent?;
    private __blendShapeComponent?;
    private __effekseerComponent?;
    private __isEffekseerState;
    private __isAnimating;
    static isAnimating: boolean;
    /**
     * @private
     */
    __skeletalComponent?: SkeletalComponent;
    _animationRetarget?: IAnimationRetarget;
    static globalTime: number;
    static readonly Event: {
        ChangeAnimationInfo: symbol;
        PlayEnd: symbol;
    };
    private static __animationGlobalInfo;
    private static __pubsub;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    $create(): void;
    $logic(): void;
    private __applyAnimation;
    static subscribe(type: AnimationComponentEventType, handler: EventHandler): void;
    /**
     * Compute cubic spline interpolation.
     * @param p_0 starting point
     * @param p_1 ending point
     * @param m_0 inTangent
     * @param m_1 outTangent
     * @param t ratio
     * @param animationAttributeIndex index of attribution
     */
    static cubicSpline(p0: Array<number>, p1: Array<number>, m0: Array<number>, m1: Array<number>, t: number): Array<number>;
    static binarySearch(inputArray: Float32Array, currentTime: number): number;
    static interpolationSearch(inputArray: Float32Array | number[], currentTime: number): number;
    static bruteForceSearch(inputArray: Float32Array, currentTime: number): number;
    setIsAnimating(flg: boolean): void;
    static setIsAnimatingForAll(flg: boolean): void;
    static setActiveAnimationForAll(animationName: AnimationTrackName): void;
    setActiveAnimationTrack(animationName: AnimationTrackName): boolean;
    getActiveAnimationTrack(): string | undefined;
    hasAnimation(trackName: AnimationTrackName, pathName: AnimationPathName): boolean;
    setAnimation(trackName: AnimationTrackName, pathName: AnimationPathName, inputArray: Float32Array, outputArray: Float32Array, outputComponentN: VectorComponentN, interpolation: AnimationInterpolationEnum, makeThisActiveAnimation?: boolean): void;
    getStartInputValueOfAnimation(animationTrackName?: string): number;
    getEndInputValueOfAnimation(animationTrackName?: string): number;
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
    private static __prepareVariablesForCubicSpline;
    private static __getOutputValue;
    private static __lerp;
    private static __interpolate;
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
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): (SomeComponentClass extends typeof import("..").VrmComponent ? import("..").IVrmEntityMethods : Exclude<SomeComponentClass extends typeof EffekseerComponent ? import("../../../effekseer").IEffekseerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").PhysicsComponent ? import("..").IPhysicsEntityMethods : Exclude<SomeComponentClass extends typeof BlendShapeComponent ? import("..").IBlendShapeEntityMethods : Exclude<SomeComponentClass extends typeof SkeletalComponent ? ISkeletalEntityMethods : Exclude<SomeComponentClass extends typeof import("..").LightComponent ? import("..").ILightEntityMethods : Exclude<SomeComponentClass extends typeof import("..").CameraComponent ? import("..").ICameraEntityMethods : Exclude<SomeComponentClass extends typeof import("..").CameraControllerComponent ? import("..").ICameraControllerEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshRendererComponent ? import("..").IMeshRendererEntityMethods : Exclude<SomeComponentClass extends typeof import("..").MeshComponent ? import("..").IMeshEntityMethods : Exclude<SomeComponentClass extends typeof SceneGraphComponent ? import("../SceneGraph").ISceneGraphEntityMethods : Exclude<SomeComponentClass extends typeof TransformComponent ? import("..").ITransformEntityMethods : Exclude<SomeComponentClass extends typeof AnimationComponent ? import("./IAnimationEntity").IAnimationEntityMethods : import("..").ITransformEntityMethods | import("../SceneGraph").ISceneGraphEntityMethods | import("..").ILightEntityMethods | import("..").IMeshEntityMethods | import("..").IMeshRendererEntityMethods | import("..").ICameraEntityMethods | import("..").ICameraControllerEntityMethods | ISkeletalEntityMethods | import("..").IBlendShapeEntityMethods | import("..").IPhysicsEntityMethods | import("../../../effekseer").IEffekseerEntityMethods | import("..").IVrmEntityMethods, import("..").ITransformEntityMethods>, import("../SceneGraph").ISceneGraphEntityMethods>, import("..").IMeshEntityMethods>, import("..").IMeshRendererEntityMethods>, import("..").ICameraControllerEntityMethods>, import("..").ICameraEntityMethods>, import("..").ILightEntityMethods>, ISkeletalEntityMethods>, import("..").IBlendShapeEntityMethods>, import("..").IPhysicsEntityMethods>, import("../../../effekseer").IEffekseerEntityMethods>, import("..").IVrmEntityMethods>) & EntityBase;
    addKeyFrame(trackName: AnimationTrackName, pathName: AnimationPathName, frameToInsert: Index, fps: number): boolean;
    addKeyFrameWithValue(trackName: AnimationTrackName, pathName: AnimationPathName, frameToInsert: Index, output: Array<number>, fps: number): boolean;
    deleteKeysAtFrame(trackName: AnimationTrackName, pathName: AnimationPathName, frameToDelete: Index, fps: number): boolean;
    hasKeyFramesAtFrame(trackName: AnimationTrackName, pathName: AnimationPathName, frame: Index, fps: number): boolean;
    static setIsAnimating(flag: boolean): void;
    private __calcGlobalInverseBindMatrix;
    get inverseBindMatrix(): IMatrix44 | undefined;
    get globalInverseBindMatrix(): IMatrix44;
    _shallowCopyFrom(component_: Component): void;
}
