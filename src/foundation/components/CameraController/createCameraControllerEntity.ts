import { EntityRepository } from '../../core/EntityRepository';
import type { ICameraControllerEntity } from '../../helpers/EntityHelper';
import type { Engine } from '../../system/Engine';
import { createCameraEntity } from '../Camera/createCameraEntity';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export function createCameraControllerEntity(engine: Engine): ICameraControllerEntity {
  const entity = createCameraEntity(engine);
  const entityAddedComponent = engine.entityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.CameraControllerComponentTID,
    entity
  ) as ICameraControllerEntity;
  return entityAddedComponent;
}
