import { EntityRepository } from '../../core/EntityRepository';
import { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { createTransformEntity } from '../Transform/TransformComponent';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import { SceneGraphComponent } from './SceneGraphComponent';

export function createGroupEntity(): ISceneGraphEntity {
  const entity = createTransformEntity();
  const entityAddedComponent = EntityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.SceneGraphComponentTID,
    entity
  ) as ISceneGraphEntity;
  // const entityAddedComponent = EntityRepository.addComponentToEntity(
  //   SceneGraphComponent,
  //   entity
  // ) as ISceneGraphEntity;
  return entityAddedComponent;
}
