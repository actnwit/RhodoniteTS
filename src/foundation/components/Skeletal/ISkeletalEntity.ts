import Component from '../../core/Component';
import {EntityUID} from '../../../types/CommonTypes';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import {MixinBase} from '../../../types/TypeGenerators';
import SkeletalComponent from './SkeletalComponent';

export interface ISkeletalEntityMethods {
  getSkeletal(): SkeletalComponent;
}

export function addSkeletal<EntityBaseClass extends MixinBase>(
  baseClass: EntityBaseClass,
  components: typeof Component[]
) {
  const Derived = class SkeletalEntity extends (baseClass as any) {
    __skeletalComponent?: SkeletalComponent;

    constructor(entityUID: EntityUID, isAlive: Boolean) {
      super(entityUID, isAlive);
    }

    /**
     * Get the SkeletalComponent of the entity.
     * It's a shortcut method of getComponent(SkeletalComponent).
     */
    getSceneGraph(): SkeletalComponent {
      if (this.__skeletalGraphComponent == null) {
        this.__skeletalComponent = this.getComponentByComponentTID(
          WellKnownComponentTIDs.SkeletalComponentTID
        ) as SkeletalComponent;
      }
      return this.__skeletalComponent!;
    }
  };

  components.push(SkeletalComponent);

  return {
    entityClass: Derived,
    components,
  };
}
