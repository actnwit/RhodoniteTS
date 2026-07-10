import type { Engine } from '../../system/Engine';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import type { ICharacterControllerEntityMethods } from './ICharacterControllerEntity';

export function createCharacterControllerEntity(engine: Engine) {
  const entity = createGroupEntity(engine);
  return engine.entityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.CharacterControllerComponentTID,
    entity
  ) as typeof entity & ICharacterControllerEntityMethods;
}
