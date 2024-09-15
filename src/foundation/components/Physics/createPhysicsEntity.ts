import { EntityRepository } from '../../core/EntityRepository';
import { IPhysicsEntity } from '../../helpers/EntityHelper';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export function createPhysicsEntity(): IPhysicsEntity {
  const entity = createGroupEntity();
  const entityAddedComponent = EntityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.PhysicsComponentTID,
    entity
  ) as IPhysicsEntity;
  return entityAddedComponent;
}
