import type { IMeshEntity } from '../../helpers/EntityHelper';
import type { Engine } from '../../system/Engine';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export function createMeshEntity(engine: Engine): IMeshEntity {
  const entity = createGroupEntity(engine);
  const entityAddedComponent = engine.entityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.MeshComponentTID,
    entity
  );
  const entityAddedComponent2 = engine.entityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.MeshRendererComponentTID,
    entityAddedComponent
  ) as IMeshEntity;
  return entityAddedComponent2;
}
