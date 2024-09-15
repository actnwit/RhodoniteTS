import { EntityRepository } from '../../core/EntityRepository';
import { ICameraEntity } from '../../helpers/EntityHelper';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export function createCameraEntity(): ICameraEntity {
  const entity = createGroupEntity();
  const entityAddedComponent = EntityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.CameraComponentTID,
    entity
  ) as ICameraEntity;
  return entityAddedComponent;
}
