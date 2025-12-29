import type { IRaymarchingEntity } from '../../helpers/EntityHelper';
import type { Engine } from '../../system/Engine';
import { createMeshEntity } from '../MeshRenderer/createMeshEntity';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export function createRaymarchingEntity(engine: Engine): IRaymarchingEntity {
  const entity = createMeshEntity(engine);
  const entityAddedComponent = engine.entityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.RaymarchingComponentTID,
    entity
  ) as IRaymarchingEntity;
  return entityAddedComponent;
}
