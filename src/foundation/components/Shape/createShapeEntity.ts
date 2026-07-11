import type { Engine } from '../../system/Engine';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import type { IShapeEntityMethods } from './IShapeEntity';

export function createShapeEntity(engine: Engine) {
  const entity = createGroupEntity(engine);
  return engine.entityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.ShapeComponentTID,
    entity
  ) as typeof entity & IShapeEntityMethods;
}
