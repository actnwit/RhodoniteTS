import type { IPhysicsEntity } from '../../helpers/EntityHelper';
import type { Engine } from '../../system/Engine';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import { PhysicsComponent } from './PhysicsComponent';

export function createPhysicsEntity(engine: Engine): IPhysicsEntity {
  const entity = createGroupEntity(engine);
  const entityAddedComponent = engine.entityRepository.addComponentToEntity(
    PhysicsComponent,
    entity
  ) as unknown as IPhysicsEntity;
  return entityAddedComponent;
}
