import type { ILightEntity } from '../../helpers/EntityHelper';
import type { Engine } from '../../system/Engine';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export function createLightEntity(engine: Engine): ILightEntity {
  const entity = createGroupEntity(engine);
  const entityAddedComponent = engine.entityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.LightComponentTID,
    entity
  ) as ILightEntity;
  return entityAddedComponent;
}
