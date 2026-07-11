import type { Engine } from '../../system/Engine';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import type { IShapeEntityMethods } from '../Shape/IShapeEntity';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import type { ICharacterControllerEntityMethods } from './ICharacterControllerEntity';

export function createCharacterControllerEntity(engine: Engine) {
  const entity = createGroupEntity(engine);
  const shapeEntity = engine.entityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.ShapeComponentTID,
    entity
  ) as typeof entity & IShapeEntityMethods;
  return engine.entityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.CharacterControllerComponentTID,
    shapeEntity
  ) as typeof shapeEntity & ICharacterControllerEntityMethods;
}
