import { EntityRepository } from '../../core/EntityRepository';
import type { ICameraEntity } from '../../helpers/EntityHelper';
import type { Engine } from '../../system/Engine';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export function createCameraEntity(engine: Engine): ICameraEntity {
  const entity = createGroupEntity(engine);
  const entityAddedComponent = entity.engine.entityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.CameraComponentTID,
    entity
  ) as ICameraEntity;
  return entityAddedComponent;
}
