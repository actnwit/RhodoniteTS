import type { AnimationComponentEventType, AnimationInfo, AnimationPathName, AnimationTrack, AnimationTrackName } from '../../../types/AnimationTypes';
import type { ComponentTID, Index } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import type { IAnimationEntity } from '../../helpers/EntityHelper';
import type { IAnimatedValue } from '../../math/IAnimatedValue';
import type { Engine } from '../../system/Engine';
import { type EventHandler } from '../../system/EventPubSub';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import type { IAnimationRetarget } from '../Skeletal';
/**
 * A component that manages animation data and applies animation transformations to entities.
 * This component handles various types of animations including transform, blend shape, material,
 * light, camera, and Effekseer particle system animations.
 */
export declare class AnimationComponent extends Component {
    private __animationBlendingRatio;
    private __animationTrack;
    private __animationTrackFeatureHashes;
    /** Map to store animation global info per Engine instance for multi-engine support */
    private static __animationGlobalInfoMap;
    private __isEffekseerState;
    private __isAnimating;
    isLoop: boolean;
    useGlobalTime: boolean;
    time: number;
    static readonly Event: {
        ChangeAnimationInfo: symbol;
        PlayEnd: symbol;
    };
    private static __tmpQuat;
    private static __tmpPos;
    private static __tmpScale;
    private static __pubsub;
    /**
     * Component load lifecycle method. Moves the component to the Logic process stage.
     */
    $load(): void;
    /**
     * Component logic lifecycle method. Applies animation if animation is enabled.
     *
     * ## Early Return Optimization for VRM Models with Shared Skeleton
     *
     * When multiple VRM models share the same skeleton (joint entities), animation
     * calculations only need to be performed once per frame. This optimization works
     * by checking if the SkeletalComponent's skinning cache will be used for this entity.
     *
     * The optimization flow:
     * 1. SkeletalComponent tracks which joint EntityUIDs had skinning cache hits
     * 2. Joints belonging to "leader" SkeletalComponents (those that compute skinning)
     *    are excluded from this tracking
     * 3. AnimationComponent checks if its entity is in the cached list
     * 4. If cached, early return skips animation calculation (skinning result will be reused)
     *
     * This significantly reduces CPU overhead when many VRM models share the same skeleton.
     */
    $logic(): void;
    isAnimationEnabled(): boolean;
    /**
     * Sets the animation blending ratio and applies the animation.
     * @param value - The blending ratio value between 0 and 1
     */
    set animationBlendingRatio(value: number);
    /**
     * Gets the current animation blending ratio.
     * @returns The blending ratio value between 0 and 1
     */
    get animationBlendingRatio(): number;
    /**
     * Applies animation to the entity based on the current time and animation tracks.
     * Handles various animation types including transform, blend shape, material, light, camera, and Effekseer.
     * @private
     */
    private __applyAnimation;
    private __applyChannelAnimation;
    private __applyTransformAnimation;
    private __applyBlendShapeAnimation;
    private __applyMaterialAnimation;
    private __applyLightAnimation;
    private __applyCameraAnimation;
    private __applyEffekseerAnimation;
    /**
     * Subscribes to animation component events.
     * @param type - The type of event to subscribe to
     * @param handler - The event handler function
     */
    static subscribe(type: AnimationComponentEventType, handler: EventHandler): void;
    /**
     * Sets whether this animation component is animating.
     * @param flg - True to enable animation, false to disable
     */
    setIsAnimating(flg: boolean): void;
    /**
     * Sets the active animation track for all animation components.
     * @param animationTrackName - The name of the animation track to activate
     */
    static setActiveAnimationForAll(engine: Engine, animationTrackName: AnimationTrackName): void;
    /**
     * Sets the active animation track for this component.
     * @param animationTrackName - The name of the animation track to activate
     */
    setActiveAnimationTrack(animationTrackName: AnimationTrackName): void;
    /**
     * Sets the second active animation track for blending purposes.
     * @param animationTrackName - The name of the second animation track to activate
     */
    setSecondActiveAnimationTrack(animationTrackName: AnimationTrackName): void;
    /**
     * Gets the name of the currently active animation track.
     * @returns The name of the active animation track
     * @throws Error if no active animation track is found
     */
    getActiveAnimationTrack(): string;
    /**
     * Checks if this component has a specific animation for the given track and path.
     * @param trackName - The animation track name to check
     * @param pathName - The animation path name to check
     * @returns True if the animation exists, false otherwise
     */
    hasAnimation(trackName: AnimationTrackName, pathName: AnimationPathName): boolean;
    /**
     * Sets an animation channel for the specified path. If a channel already exists for the path,
     * it merges the new animation data with the existing one.
     * @param pathName - The name of the animation path (e.g., 'translate', 'rotate', 'scale')
     * @param animatedValueArg - The animated value containing animation data
     */
    setAnimation(pathName: AnimationPathName, animatedValueArg: IAnimatedValue): void;
    /**
     * Gets the animated value for the specified animation path.
     * @param pathName - The name of the animation path
     * @returns The animated value or undefined if not found
     */
    getAnimation(pathName: AnimationPathName): IAnimatedValue | undefined;
    /**
     * Gets the start input time value for the specified animation track.
     * @param animationTrackName - The name of the animation track
     * @returns The minimum start input time value
     */
    getStartInputValueOfAnimation(animationTrackName: string): number;
    /**
     * Gets the end input time value for the specified animation track.
     * @param animationTrackName - The name of the animation track
     * @returns The maximum end input time value
     */
    getEndInputValueOfAnimation(animationTrackName: string): number;
    /**
     * Gets an array of all available animation track names.
     * @param engine - The engine instance to get the animation list for
     * @returns Array of animation track names
     */
    static getAnimationList(engine: Engine): AnimationTrackName[];
    /**
     * Gets the animation information for all tracks.
     * @param engine - The engine instance to get the animation info for
     * @returns A map containing animation track names and their corresponding information
     */
    static getAnimationInfo(engine: Engine): Map<AnimationTrackName, AnimationInfo>;
    /**
     * Gets all animation track names associated with this component.
     * @returns An array of animation track names
     */
    getAnimationTrackNames(): AnimationTrackName[];
    /**
     * Gets the animation channels of the animation track.
     * @returns The channel maps of the animation track
     */
    getAnimationChannelsOfTrack(): AnimationTrack;
    /**
     * Gets whether this component is currently animating.
     * @returns True if animating, false otherwise
     */
    get isAnimating(): boolean;
    /**
     * Gets the global start input value for all animation components.
     * @param engine - The engine instance to get the start input value for
     * @returns The start input value
     */
    static getStartInputValue(engine: Engine): number;
    /**
     * Gets the global end input value for all animation components.
     * @param engine - The engine instance to get the end input value for
     * @returns The end input value
     */
    static getEndInputValue(engine: Engine): number;
    /**
     * Gets the component type identifier for AnimationComponent.
     * @returns The component type identifier
     */
    static get componentTID(): 2;
    /**
     * Gets the component type identifier for this instance.
     * @returns The component type identifier
     */
    get componentTID(): ComponentTID;
    /**
     * Gets the entity that owns this animation component.
     * @returns The entity which has this component
     */
    get entity(): IAnimationEntity;
    /**
     * Adds this animation component to an entity, extending the entity with animation methods.
     * @param base - The target entity to add this component to
     * @param _componentClass - The component class to add
     * @returns The entity extended with animation component methods
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
    /**
     * Adds a keyframe to the specified animation track at the given frame.
     * @param trackName - The name of the animation track
     * @param pathName - The name of the animation path
     * @param frameToInsert - The frame number where to insert the keyframe
     * @param fps - The frames per second rate
     * @returns True if the keyframe was successfully added, false otherwise
     */
    addKeyFrame(trackName: AnimationTrackName, pathName: AnimationPathName, frameToInsert: Index, fps: number): boolean;
    /**
     * Adds a keyframe with a specific value to the specified animation track at the given frame.
     * @param trackName - The name of the animation track
     * @param pathName - The name of the animation path
     * @param frameToInsert - The frame number where to insert the keyframe
     * @param output - The array of output values for the keyframe
     * @param fps - The frames per second rate
     * @returns True if the keyframe was successfully added, false otherwise
     */
    addKeyFrameWithValue(trackName: AnimationTrackName, pathName: AnimationPathName, frameToInsert: Index, output: Array<number>, fps: number): boolean;
    /**
     * Deletes keyframes at the specified frame for the given animation track and path.
     * @param trackName - The name of the animation track
     * @param pathName - The name of the animation path
     * @param frameToDelete - The frame number where to delete keyframes
     * @param fps - The frames per second rate
     * @returns True if keyframes were successfully deleted, false otherwise
     */
    deleteKeysAtFrame(trackName: AnimationTrackName, pathName: AnimationPathName, frameToDelete: Index, fps: number): boolean;
    /**
     * Checks if keyframes exist at the specified frame for the given animation track and path.
     * @param trackName - The name of the animation track
     * @param pathName - The name of the animation path
     * @param frame - The frame number to check
     * @param fps - The frames per second rate
     * @returns True if keyframes exist at the frame, false otherwise
     */
    hasKeyFramesAtFrame(trackName: AnimationTrackName, pathName: AnimationPathName, frame: Index, fps: number): boolean;
    /**
     * Gets the animation global info map for a specific engine.
     * Creates a new map if one doesn't exist for the engine.
     * @param engine - The engine instance to get the animation info for
     * @returns The animation global info map for the engine
     */
    static getAnimationGlobalInfo(engine: Engine): Map<AnimationTrackName, AnimationInfo>;
    /**
     * Sets the animation state for the specified engine.
     * @param engine - The engine instance to set the animation state for
     * @param flag - True to enable animation, false to disable
     */
    static setIsAnimating(engine: Engine, flag: boolean): void;
    /**
     * Gets the animation state for the specified engine.
     * @param engine - The engine instance to get the animation state for
     * @returns True if animation is enabled for the engine, defaults to true if not set
     */
    static getIsAnimating(engine: Engine): boolean;
    /**
     * Sets the global animation time for the specified engine.
     * @param engine - The engine instance to set the global time for
     * @param time - The global animation time in seconds
     */
    static setGlobalTime(engine: Engine, time: number): void;
    /**
     * Gets the global animation time for the specified engine.
     * @param engine - The engine instance to get the global time for
     * @returns The global animation time for the engine, defaults to 0 if not set
     */
    static getGlobalTime(engine: Engine): number;
    /**
     * Performs a shallow copy of another animation component's data into this component.
     * @param component_ - The source animation component to copy from
     * @override
     */
    _shallowCopyFrom(component_: Component): void;
    /**
     * Sets up animation retargeting from a source entity to this entity.
     * @param retarget - The retargeting interface that defines how to map animations
     * @param postfixToTrackName - Optional postfix to append to track names
     * @returns An array of created track names
     * @private
     */
    _setRetarget(retarget: IAnimationRetarget, postfixToTrackName?: string): string[];
    /**
     * Resets all animation tracks, clearing all animation data from this component.
     */
    resetAnimationTracks(): void;
    /**
     * Resets a specific animation track by removing its animation sampler data.
     * @param trackName - The name of the animation track to reset
     */
    resetAnimationTrack(trackName: string): void;
    /**
     * Resets all animation tracks that have names ending with the specified postfix.
     * @param postfix - The postfix to match against track names
     */
    resetAnimationTrackByPostfix(postfix: string): void;
    currentTrackFeatureHash(): number | undefined;
    /**
     * Destroys this component, cleaning up resources and clearing animation data.
     * @override
     */
    _destroy(): void;
    private __updateAnimationTrackFeatureHashes;
    /**
     * Cleans up static resources associated with the specified engine.
     * @param engine - The engine instance to clean up resources for
     * @internal
     */
    static _cleanupForEngine(engine: Engine): void;
}
