import type { AnimationTrackName } from '../../../types/AnimationTypes';
import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository } from '../../core/EntityRepository';
import type { IAnimationStateEntity } from '../../helpers/EntityHelper';
import type { Engine } from '../../system/Engine';
import type { ComponentToComponentMethods } from '../ComponentTypes';
/**
 * AnimationStateComponent is a component that manages the state of an animation.
 * It handles animation blending, track transitions, and provides control over animation playback parameters.
 */
export declare class AnimationStateComponent extends Component {
    private __activeAnimationTrack;
    private __interpolationStartTime;
    private __blendingDuration;
    private __isBlending;
    private __blendingRatio;
    /**
     * Creates a new AnimationStateComponent instance.
     * @param engine - The engine instance
     * @param entityUid - The unique identifier of the entity this component belongs to
     * @param componentSid - The system identifier for this component instance
     * @param entityComponent - The entity repository for component management
     * @param isReUse - Whether this component is being reused from a pool
     */
    constructor(engine: Engine, entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository, isReUse: boolean);
    /**
     * Gets the component type identifier for AnimationStateComponent.
     * @returns The component type ID for AnimationStateComponent
     */
    static get componentTID(): 1;
    /**
     * Gets the component type identifier for this component instance.
     * @returns The component type ID for AnimationStateComponent
     */
    get componentTID(): ComponentTID;
    /**
     * Checks if animation blending is currently active.
     * @returns True if animation blending is in progress, false otherwise
     */
    get isBlending(): boolean;
    /**
     * Gets the current blending ratio between animations.
     * @returns The blending ratio value between 0.0 and 1.0
     */
    get blendingRatio(): number;
    /**
     * Logic update method called every frame during the Logic process stage.
     * Handles animation blending calculations and updates the blending ratio over time.
     */
    $logic(): void;
    /**
     * Sets the first active animation track without blending.
     * This is typically used for initial animation setup.
     * @param trackName - The name of the animation track to activate
     */
    setFirstActiveAnimationTrack(trackName: AnimationTrackName): void;
    /**
     * Forces a transition to a new animation track with blending over a specified duration.
     * The previous track will blend out while the new track blends in.
     * @param trackName - The name of the animation track to transition to
     * @param duration - The duration of the blending transition in seconds
     */
    forceTransitionTo(trackName: AnimationTrackName, duration: number): void;
    /**
     * Sets the active animation track for this entity and all its children recursively.
     * @param animationTrackName - The name of the animation track to set as active
     */
    setActiveAnimationTrack(animationTrackName: AnimationTrackName): void;
    /**
     * Sets the second active animation track for blending purposes.
     * This track is used as the target during animation transitions.
     * @param animationTrackName - The name of the animation track to set as the second active track
     */
    setSecondActiveAnimationTrack(animationTrackName: AnimationTrackName): void;
    /**
     * Sets whether animations should use global time for synchronization.
     * Applies the setting recursively to this entity and all its children.
     * @param flg - True to use global time, false to use local time
     */
    setUseGlobalTime(flg: boolean): void;
    /**
     * Sets whether animations should loop when they reach the end.
     * Applies the setting recursively to this entity and all its children.
     * @param flg - True to enable looping, false to disable looping
     */
    setIsLoop(flg: boolean): void;
    /**
     * Sets the current playback time for animations.
     * Applies the time setting recursively to this entity and all its children.
     * @param time - The time value to set for animation playback
     */
    setTime(time: number): void;
    /**
     * Sets the blending ratio between the first and second active animation tracks.
     * Applies the ratio recursively to this entity and all its children.
     * @param ratio - The blending ratio value between 0.0 (first track) and 1.0 (second track)
     */
    setAnimationBlendingRatio(ratio: number): void;
    /**
     * Destroys the component and cleans up resources.
     * @override
     */
    _destroy(): void;
    /**
     * Gets the entity that owns this component.
     * @returns The entity which has this component as an IAnimationStateEntity
     */
    get entity(): IAnimationStateEntity;
    /**
     * Adds this component to an entity by extending the entity with AnimationState-specific methods.
     * This method uses mixins to add the getAnimationState() method to the target entity.
     * @override
     * @template EntityBase - The base entity type
     * @template SomeComponentClass - The component class type
     * @param base - The target entity to extend
     * @param _componentClass - The component class to add (unused in this implementation)
     * @returns The extended entity with AnimationState component methods
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}
