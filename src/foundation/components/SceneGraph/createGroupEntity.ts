import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
import type { Engine } from '../../system/Engine';
import { createTransformEntity } from '../Transform/createTransformEntity';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export function createGroupEntity(engine: Engine): ISceneGraphEntity {
  const entity = createTransformEntity(engine);
  const entityAddedComponent = entity.engine.entityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.SceneGraphComponentTID,
    entity
  ) as ISceneGraphEntity;
  return entityAddedComponent;
}
