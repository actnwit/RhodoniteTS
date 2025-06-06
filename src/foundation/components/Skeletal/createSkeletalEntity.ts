import { EntityRepository } from '../../core/EntityRepository';
import type { ISkeletalEntity } from '../../helpers/EntityHelper';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export function createSkeletalEntity(): ISkeletalEntity {
  const entity = createGroupEntity();
  const entityAddedComponent = EntityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.SkeletalComponentTID,
    entity
  ) as ISkeletalEntity;
  return entityAddedComponent;
}
