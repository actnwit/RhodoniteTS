import { EntityRepository } from '../../core/EntityRepository';
import type { ICameraControllerEntity } from '../../helpers/EntityHelper';
import { createCameraEntity } from '../Camera/createCameraEntity';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export function createCameraControllerEntity(): ICameraControllerEntity {
  const entity = createCameraEntity();
  const entityAddedComponent = EntityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.CameraControllerComponentTID,
    entity
  ) as ICameraControllerEntity;
  return entityAddedComponent;
}
