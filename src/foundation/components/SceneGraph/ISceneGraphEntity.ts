import Component from '../../core/Component';
import {EntityUID} from '../../../types/CommonTypes';
import SceneGraphComponent from './SceneGraphComponent';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import {MixinBase} from '../../../types/TypeGenerators';
import SkeletalComponent from '../Skeletal/SkeletalComponent';
import {Is} from '../../misc/Is';
import {IMatrix44} from '../../math/IMatrix';
import {IGroupEntity} from '../../helpers/EntityHelper';

export interface ISceneGraphEntityMethods {
  getSceneGraph(): SceneGraphComponent;
  worldMatrix: IMatrix44;
  worldMatrixInner: IMatrix44;
}

export function addSceneGraph<EntityBaseClass extends MixinBase>(
  baseClass: EntityBaseClass,
  components: typeof Component[]
) {
  const Derived = class SceneGraphEntity extends (baseClass as any) {
    __sceneGraphComponent?: SceneGraphComponent;

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

    get worldMatrixInner(): IMatrix44 {
      const skeletalComponent = this.getSkeletal() as
        | SkeletalComponent
        | undefined;
      if (
        Is.exist(skeletalComponent) &&
        skeletalComponent.isWorldMatrixUpdated
      ) {
        return skeletalComponent.worldMatrixInner;
      } else {
        const sceneGraphComponent = this.getSceneGraph();
        return sceneGraphComponent.worldMatrixInner;
      }
    }

    get worldMatrix(): IMatrix44 {
      return this.worldMatrixInner.clone();
    }

    getChildByName(name: string): IGroupEntity | undefined {
      const sceneComponent = this.getSceneGraph()!;
      const children = sceneComponent.children;
      for (const child of children) {
        if (child.entity.uniqueName === name) {
          return child.entity;
        }
      }
      return undefined;
    }
  };

  components.push(SceneGraphComponent);

  return {
    entityClass: Derived,
    components,
  };
}
