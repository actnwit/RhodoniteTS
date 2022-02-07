import {EntityUID} from '../../../types/CommonTypes';
import {MixinBase} from '../../../types/TypeGenerators';
import Component from '../../core/Component';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import MeshRendererComponent from './MeshRendererComponent';

export interface IMeshRendererEntityMethods {
  getMeshRenderer(): MeshRendererComponent;
}

export function addMeshRenderer<EntityBaseClass extends MixinBase>(
  baseClass: EntityBaseClass,
  components: typeof Component[]
) {
  const Derived = class MeshRendererEntity extends (baseClass as any) {
    __meshRendererComponent?: MeshRendererComponent;

    constructor(entityUID: EntityUID, isAlive: Boolean) {
      super(entityUID, isAlive);
    }

    /**
     * Get the MeshRendererComponent of the entity.
     * It's a shortcut method of getComponent(MeshRendererComponent).
     */
    getMesh(): MeshRendererComponent {
      if (this.__meshRendererComponent == null) {
        this.__meshRendererComponent = this.getComponentByComponentTID(
          WellKnownComponentTIDs.MeshComponentTID
        ) as MeshRendererComponent;
      }
      return this.__meshRendererComponent;
    }
  };

  components.push(MeshRendererComponent);

  return {
    entityClass: Derived,
    components,
  };
}
