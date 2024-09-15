import { EntityRepository } from '../../core/EntityRepository';
import { ILightEntity } from '../../helpers/EntityHelper';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export function createLightEntity(): ILightEntity {
  const entity = createGroupEntity();
  const entityAddedComponent = EntityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.LightComponentTID,
    entity
  ) as ILightEntity;
  return entityAddedComponent;
}
