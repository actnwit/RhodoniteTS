import { EntityRepository } from '../../core/EntityRepository';
import type { IMeshEntity } from '../../helpers/EntityHelper';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export function createMeshEntity(): IMeshEntity {
  const entity = createGroupEntity();
  const entityAddedComponent = EntityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.MeshComponentTID,
    entity
  );
  const entityAddedComponent2 = EntityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.MeshRendererComponentTID,
    entityAddedComponent
  ) as IMeshEntity;
  return entityAddedComponent2;
}
