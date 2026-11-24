import type { Engine } from '../../system/Engine';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import type { IShapeEntityMethods } from '../Shape/IShapeEntity';
import { ShapeComponent } from '../Shape/ShapeComponent';
import { CharacterControllerComponent } from './CharacterControllerComponent';
import type { ICharacterControllerEntityMethods } from './ICharacterControllerEntity';

export function createCharacterControllerEntity(engine: Engine) {
  const entity = createGroupEntity(engine);
  const shapeEntity = engine.entityRepository.addComponentToEntity(ShapeComponent, entity) as typeof entity &
    IShapeEntityMethods;
  return engine.entityRepository.addComponentToEntity(
    CharacterControllerComponent,
    shapeEntity
  ) as unknown as typeof shapeEntity & ICharacterControllerEntityMethods;
}
