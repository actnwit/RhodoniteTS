import type { AnimationTrackName } from '../../../types/AnimationTypes';
import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository, applyMixins } from '../../core/EntityRepository';
import { ProcessStage } from '../../definitions/ProcessStage';
import type { IAnimationStateEntity, ISceneGraphEntity } from '../../helpers/EntityHelper';
import type { Engine } from '../../system/Engine';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

/**
 * AnimationStateComponent is a component that manages the state of an animation.
 * It handles animation blending, track transitions, and provides control over animation playback parameters.
 */
export class AnimationStateComponent extends Component {
  private __activeAnimationTrack: AnimationTrackName = '';
  private __interpolationStartTime = performance.now();
  private __blendingDuration = 1.0;
  private __isBlending = false;
  private __blendingRatio = 0.0;

  /**
   * Creates a new AnimationStateComponent instance.
   * @param engine - The engine instance
   * @param entityUid - The unique identifier of the entity this component belongs to
   * @param componentSid - The system identifier for this component instance
   * @param entityComponent - The entity repository for component management
   * @param isReUse - Whether this component is being reused from a pool
   */
  constructor(
    engine: Engine,
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityComponent: EntityRepository,
    isReUse: boolean
  ) {
    super(engine, entityUid, componentSid, entityComponent, isReUse);

    this.moveStageTo(ProcessStage.Logic);
  }

  /**
   * Gets the component type identifier for AnimationStateComponent.
   * @returns The component type ID for AnimationStateComponent
   */
  static get componentTID() {
    return WellKnownComponentTIDs.AnimationStateComponentTID;
  }

  /**
   * Gets the component type identifier for this component instance.
   * @returns The component type ID for AnimationStateComponent
   */
  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.AnimationStateComponentTID;
  }

  /**
   * Checks if animation blending is currently active.
   * @returns True if animation blending is in progress, false otherwise
   */
  get isBlending() {
    return this.__isBlending;
  }

  /**
   * Gets the current blending ratio between animations.
   * @returns The blending ratio value between 0.0 and 1.0
   */
  get blendingRatio() {
    return this.__blendingRatio;
  }

  /**
   * Logic update method called every frame during the Logic process stage.
   * Handles animation blending calculations and updates the blending ratio over time.
   */
  $logic() {
    if (!this.__isBlending) {
      return;
    }
    const elapsedTime = (performance.now() - this.__interpolationStartTime) / 1000;
    const blendingTime = elapsedTime / this.__blendingDuration;
    if (blendingTime >= 1) {
      this.__isBlending = false;
    }
    const ratio = Math.min(blendingTime, 1);
    this.setAnimationBlendingRatio(ratio);
    this.__blendingRatio = ratio;
  }

  /**
   * Sets the first active animation track without blending.
   * This is typically used for initial animation setup.
   * @param trackName - The name of the animation track to activate
   */
  setFirstActiveAnimationTrack(trackName: AnimationTrackName) {
    this.__activeAnimationTrack = trackName;
    this.setActiveAnimationTrack(trackName);
    this.setAnimationBlendingRatio(0);
    this.__isBlending = false;
  }

  /**
   * Forces a transition to a new animation track with blending over a specified duration.
   * The previous track will blend out while the new track blends in.
   * @param trackName - The name of the animation track to transition to
   * @param duration - The duration of the blending transition in seconds
   */
  forceTransitionTo(trackName: AnimationTrackName, duration: number) {
    const prevTrack = this.__activeAnimationTrack;

    this.setActiveAnimationTrack(prevTrack);
    this.setSecondActiveAnimationTrack(trackName);
    this.__interpolationStartTime = performance.now();
    this.__blendingDuration = duration;
    this.__activeAnimationTrack = trackName;

    this.__isBlending = true;
  }

  /**
   * Sets the active animation track for this entity and all its children recursively.
   * @param animationTrackName - The name of the animation track to set as active
   */
  setActiveAnimationTrack(animationTrackName: AnimationTrackName) {
    function processRecursively(entity: ISceneGraphEntity) {
      const anim = entity.tryToGetAnimation();
      if (anim != null) {
        anim.setActiveAnimationTrack(animationTrackName);
      }
      for (const child of entity.children) {
        processRecursively(child.entity);
      }
    }
    processRecursively(this.entity);
  }

  /**
   * Sets the second active animation track for blending purposes.
   * This track is used as the target during animation transitions.
   * @param animationTrackName - The name of the animation track to set as the second active track
   */
  setSecondActiveAnimationTrack(animationTrackName: AnimationTrackName) {
    function processRecursively(entity: ISceneGraphEntity) {
      const anim = entity.tryToGetAnimation();
      if (anim != null) {
        anim.setSecondActiveAnimationTrack(animationTrackName);
      }
      for (const child of entity.children) {
        processRecursively(child.entity);
      }
    }
    processRecursively(this.entity);
  }

  /**
   * Sets whether animations should use global time for synchronization.
   * Applies the setting recursively to this entity and all its children.
   * @param flg - True to use global time, false to use local time
   */
  setUseGlobalTime(flg: boolean) {
    function processRecursively(entity: ISceneGraphEntity) {
      const anim = entity.tryToGetAnimation();
      if (anim != null) {
        anim.useGlobalTime = flg;
      }
      for (const child of entity.children) {
        processRecursively(child.entity);
      }
    }
    processRecursively(this.entity);
  }

  /**
   * Sets whether animations should loop when they reach the end.
   * Applies the setting recursively to this entity and all its children.
   * @param flg - True to enable looping, false to disable looping
   */
  setIsLoop(flg: boolean) {
    function processRecursively(entity: ISceneGraphEntity) {
      const anim = entity.tryToGetAnimation();
      if (anim != null) {
        anim.isLoop = flg;
      }
      for (const child of entity.children) {
        processRecursively(child.entity);
      }
    }
    processRecursively(this.entity);
  }

  /**
   * Sets the current playback time for animations.
   * Applies the time setting recursively to this entity and all its children.
   * @param time - The time value to set for animation playback
   */
  setTime(time: number) {
    function processRecursively(entity: ISceneGraphEntity) {
      const anim = entity.tryToGetAnimation();
      if (anim != null) {
        anim.time = time;
      }
      for (const child of entity.children) {
        processRecursively(child.entity);
      }
    }
    processRecursively(this.entity);
  }

  /**
   * Sets the blending ratio between the first and second active animation tracks.
   * Applies the ratio recursively to this entity and all its children.
   * @param ratio - The blending ratio value between 0.0 (first track) and 1.0 (second track)
   */
  setAnimationBlendingRatio(ratio: number) {
    function processRecursively(entity: ISceneGraphEntity) {
      const anim = entity.tryToGetAnimation();
      if (anim != null) {
        anim.animationBlendingRatio = ratio;
      }
      for (const child of entity.children) {
        processRecursively(child.entity);
      }
    }
    processRecursively(this.entity);
  }

  /**
   * Destroys the component and cleans up resources.
   * @override
   */
  _destroy(): void {
    super._destroy();
  }

  /**
   * Gets the entity that owns this component.
   * @returns The entity which has this component as an IAnimationStateEntity
   */
  get entity(): IAnimationStateEntity {
    return this.__engine.entityRepository.getEntity(this.__entityUid) as unknown as IAnimationStateEntity;
  }

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
  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class BlendShapeEntity extends (base.constructor as any) {
      getAnimationState() {
        return this.getComponentByComponentTID(
          WellKnownComponentTIDs.AnimationStateComponentTID
        ) as AnimationStateComponent;
      }
    }
    applyMixins(base, BlendShapeEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
