import { EntityRepository } from '../../core/EntityRepository';
import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { createTransformEntity } from '../Transform/createTransformEntity';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export function createGroupEntity(): ISceneGraphEntity {
  const entity = createTransformEntity();
  const entityAddedComponent = EntityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.SceneGraphComponentTID,
    entity
  ) as ISceneGraphEntity;
  return entityAddedComponent;
}
