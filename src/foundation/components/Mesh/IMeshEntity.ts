import {EntityUID} from '../../../types/CommonTypes';
import {MixinBase} from '../../../types/TypeGenerators';
import Component from '../../core/Component';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import MeshComponent from './MeshComponent';

export interface IMeshEntityMethods {
  getMesh(): MeshComponent;
}

export function addMesh<EntityBaseClass extends MixinBase>(
  baseClass: EntityBaseClass,
  components: typeof Component[]
) {
  const Derived = class SceneGraphEntity extends (baseClass as any) {
    __meshComponent?: MeshComponent;

    constructor(entityUID: EntityUID, isAlive: Boolean) {
      super(entityUID, isAlive);
    }

    /**
     * Get the CameraComponent of the entity.
     * It's a shortcut method of getComponent(CameraComponent).
     */
    getMesh(): MeshComponent {
      if (this.__meshComponent == null) {
        this.__meshComponent = this.getComponentByComponentTID(
          WellKnownComponentTIDs.MeshComponentTID
        ) as MeshComponent;
      }
      return this.__meshComponent;
    }
  };

  components.push(MeshComponent);

  return {
    entityClass: Derived,
    components,
  };
}
