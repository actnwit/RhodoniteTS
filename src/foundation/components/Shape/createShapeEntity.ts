import type { Engine } from '../../system/Engine';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import type { IShapeEntityMethods } from './IShapeEntity';
import { ShapeComponent } from './ShapeComponent';

export function createShapeEntity(engine: Engine) {
  const entity = createGroupEntity(engine);
  return engine.entityRepository.addComponentToEntity(ShapeComponent, entity) as unknown as typeof entity &
    IShapeEntityMethods;
}
