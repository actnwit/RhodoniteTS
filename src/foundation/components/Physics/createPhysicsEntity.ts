import type { IPhysicsEntity } from '../../helpers/EntityHelper';
import type { Engine } from '../../system/Engine';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export function createPhysicsEntity(engine: Engine): IPhysicsEntity {
  const entity = createGroupEntity(engine);
  const entityAddedComponent = engine.entityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.PhysicsComponentTID,
    entity
  ) as IPhysicsEntity;
  return entityAddedComponent;
}
