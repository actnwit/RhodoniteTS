import Component from '../../core/Component';
import {EntityUID} from '../../../types/CommonTypes';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import {MixinBase} from '../../../types/TypeGenerators';
import AnimationComponent from '../../components/Animation/AnimationComponent';

export interface IAnimationEntityMethods {
  getAnimation(): AnimationComponent;
}

export function addAnimation<EntityBaseClass extends MixinBase>(
  baseClass: EntityBaseClass,
  components: typeof Component[]
) {
  const Derived = class SceneGraphEntity extends (baseClass as any) {
    __animationComponent?: AnimationComponent;
    constructor(entityUID: EntityUID, isAlive: Boolean) {
      super(entityUID, isAlive);
    }

    /**
     * Get the AnimationComponent of the entity.
     * It's a shortcut method of getComponent(AnimationComponent).
     */
    getAnimation(): AnimationComponent {
      if (this.__animationComponent == null) {
        this.__animationComponent = this.getComponentByComponentTID(
          WellKnownComponentTIDs.AnimationComponentTID
        ) as AnimationComponent;
      }
      return this.__animationComponent;
    }
  };

  components.push(AnimationComponent);

  return {
    entityClass: Derived,
    components,
  };
}
