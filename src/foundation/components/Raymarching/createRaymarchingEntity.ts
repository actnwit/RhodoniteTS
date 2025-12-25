import type { IRaymarchingEntity } from '../../helpers/EntityHelper';
import type { Engine } from '../../system/Engine';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export function createRaymarchingEntity(engine: Engine): IRaymarchingEntity {
  const entity = createGroupEntity(engine);
  const entityAddedComponent = engine.entityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.RaymarchingComponentTID,
    entity
  ) as IRaymarchingEntity;
  return entityAddedComponent;
}
