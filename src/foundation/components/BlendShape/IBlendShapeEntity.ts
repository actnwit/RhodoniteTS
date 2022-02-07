import {EntityUID} from '../../../types/CommonTypes';
import {MixinBase} from '../../../types/TypeGenerators';
import Component from '../../core/Component';
import BlendShapeComponent from '../BlendShape/BlendShapeComponent';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';

export interface IBlendShapeEntityMethods {
  getBlendShape(): BlendShapeComponent;
}

export function addBlendShape<EntityBaseClass extends MixinBase>(
  baseClass: EntityBaseClass,
  components: typeof Component[]
) {
  const Derived = class BlendShapeEntity extends (baseClass as any) {
    __blendShapeComponent?: BlendShapeComponent;

    constructor(entityUID: EntityUID, isAlive: Boolean) {
      super(entityUID, isAlive);
    }

    /**
     * Get the BlendShapeComponent of the entity.
     * It's a shortcut method of getComponent(BlendShapeComponent).
     */
    getCamera(): BlendShapeComponent {
      if (this.__blendShapeComponent == null) {
        this.__blendShapeComponent = this.getComponentByComponentTID(
          WellKnownComponentTIDs.BlendShapeComponentTID
        ) as BlendShapeComponent;
      }
      return this.__blendShapeComponent;
    }
  };

  components.push(BlendShapeComponent);

  return {
    entityClass: Derived,
    components,
  };
}
