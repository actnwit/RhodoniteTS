import { AnimationTrackName } from '../../../types/AnimationTypes';
import { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import { ComponentRepository } from '../../core/ComponentRepository';
import { IEntity } from '../../core/Entity';
import { EntityRepository, applyMixins } from '../../core/EntityRepository';
import { ProcessStage } from '../../definitions/ProcessStage';
import { IAnimationStateEntity, ISceneGraphEntity } from '../../helpers/EntityHelper';
import { ComponentToComponentMethods } from '../ComponentTypes';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export class AnimationStateComponent extends Component {
  private __activeAnimationTrack: AnimationTrackName = '';
  private __interpolationStartTime = performance.now();
  private __blendingDuration = 1.0;
  private __isBlending = false;

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityComponent: EntityRepository,
    isReUse: boolean
  ) {
    super(entityUid, componentSid, entityComponent, isReUse);

    this.moveStageTo(ProcessStage.Logic);
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.AnimationStateComponentTID;
  }

  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.AnimationStateComponentTID;
  }

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
  }

  setFirstActiveAnimationTrack(trackName: AnimationTrackName) {
    this.__activeAnimationTrack = trackName;
    this.setActiveAnimationTrack(trackName);
    this.setAnimationBlendingRatio(0);
    this.__isBlending = false;
  }

  forceTransitionTo(trackName: AnimationTrackName, duration: number) {
    const prevTrack = this.__activeAnimationTrack;

    this.setActiveAnimationTrack(prevTrack);
    this.setSecondActiveAnimationTrack(trackName);
    this.__interpolationStartTime = performance.now();
    this.__blendingDuration = duration;
    this.__activeAnimationTrack = trackName;

    this.__isBlending = true;
  }

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
   * get the entity which has this component.
   * @returns the entity which has this component
   */
  get entity(): IAnimationStateEntity {
    return EntityRepository.getEntity(this.__entityUid) as unknown as IAnimationStateEntity;
  }

  /**
   * @override
   * Add this component to the entity
   * @param base the target entity
   * @param _componentClass the component class to add
   */
  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class BlendShapeEntity extends (base.constructor as any) {
      constructor(
        entityUID: EntityUID,
        isAlive: boolean,
        components?: Map<ComponentTID, Component>
      ) {
        super(entityUID, isAlive, components);
      }

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

ComponentRepository.registerComponentClass(AnimationStateComponent);
