import type { ISkeletalEntity } from '../../helpers/EntityHelper';
import type { Engine } from '../../system/Engine';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export function createSkeletalEntity(engine: Engine): ISkeletalEntity {
  const entity = createGroupEntity(engine);
  const entityAddedComponent = engine.entityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.SkeletalComponentTID,
    entity
  ) as ISkeletalEntity;
  return entityAddedComponent;
}
