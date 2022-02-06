import Component from '../../core/Component';
import {EntityUID} from '../../../types/CommonTypes';
import SceneGraphComponent from './SceneGraphComponent';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import {MixinBase} from '../../../types/TypeGenerators';

export interface ISceneGraphEntityMethods {
  getSceneGraph(): SceneGraphComponent;
}

export function addSceneGraph<EntityBaseClass extends MixinBase>(
  baseClass: EntityBaseClass,
  components: typeof Component[]
) {
  const Derived = class SceneGraphEntity extends (baseClass as any) {
    constructor(entityUID: EntityUID, isAlive: Boolean) {
      super(entityUID, isAlive);
    }

    /**
     * Get the SceneGraphComponent of the entity.
     * It's a shortcut method of getComponent(SceneGraphComponent).
     */
    getSceneGraph(): SceneGraphComponent {
      if (this.__sceneGraphComponent == null) {
        this.__sceneGraphComponent = this.getComponentByComponentTID(
          WellKnownComponentTIDs.SceneGraphComponentTID
        ) as SceneGraphComponent;
      }
      return this.__sceneGraphComponent;
    }
  };

  components.push(SceneGraphComponent);

  return {
    entityClass: Derived,
    components,
  };
}
