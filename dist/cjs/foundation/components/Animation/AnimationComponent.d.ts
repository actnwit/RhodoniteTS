import { Component } from '../../core/Component';
import { EntityRepository } from '../../core/EntityRepository';
import { AnimationInterpolationEnum } from '../../definitions/AnimationInterpolation';
import { ComponentTID, ComponentSID, EntityUID, Index, VectorComponentN } from '../../../types/CommonTypes';
import { AnimationPathName, AnimationTrack, AnimationComponentEventType, AnimationInfo, AnimationTrackName } from '../../../types/AnimationTypes';
import { EventHandler } from '../../system/EventPubSub';
import { IAnimationEntity } from '../../helpers/EntityHelper';
import { IEntity } from '../../core/Entity';
import { ComponentToComponentMethods } from '../ComponentTypes';
import { IAnimationRetarget } from '../Skeletal';
/**
 * A component that manages animation.
 */
export declare class AnimationComponent extends Component {
    private __firstActiveAnimationTrackName?;
    private __secondActiveAnimationTrackName?;
    animationBlendingRatio: number;
    private __animationTracks;
    private static __animationGlobalInfo;
    private __isEffekseerState;
    private __isAnimating;
    static isAnimating: boolean;
    isLoop: boolean;
    useGlobalTime: boolean;
    static globalTime: number;
    time: number;
    static readonly Event: {
        ChangeAnimationInfo: symbol;
        PlayEnd: symbol;
    };
    private static __pubsub;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    $load(): void;
    $logic(): void;
    private __applyAnimation;
    static subscribe(type: AnimationComponentEventType, handler: EventHandler): void;
    setIsAnimating(flg: boolean): void;
    static setActiveAnimationForAll(animationTrackName: AnimationTrackName): void;
    setActiveAnimationTrack(animationTrackName: AnimationTrackName): boolean;
    setSecondActiveAnimationTrack(animationTrackName: AnimationTrackName): boolean;
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
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
    addKeyFrame(trackName: AnimationTrackName, pathName: AnimationPathName, frameToInsert: Index, fps: number): boolean;
    addKeyFrameWithValue(trackName: AnimationTrackName, pathName: AnimationPathName, frameToInsert: Index, output: Array<number>, fps: number): boolean;
    deleteKeysAtFrame(trackName: AnimationTrackName, pathName: AnimationPathName, frameToDelete: Index, fps: number): boolean;
    hasKeyFramesAtFrame(trackName: AnimationTrackName, pathName: AnimationPathName, frame: Index, fps: number): boolean;
    static setIsAnimating(flag: boolean): void;
    _shallowCopyFrom(component_: Component): void;
    _setRetarget(retarget: IAnimationRetarget, postfixToTrackName?: string): string[];
    resetAnimationTracks(): void;
    resetAnimationTrack(trackName: string): void;
    resetAnimationTrackByPostfix(postfix: string): void;
    _destroy(): void;
}
