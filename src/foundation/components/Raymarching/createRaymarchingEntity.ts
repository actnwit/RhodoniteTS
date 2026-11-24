import type { IRaymarchingEntity } from '../../helpers/EntityHelper';
import type { Engine } from '../../system/Engine';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import { RaymarchingComponent } from './RaymarchingComponent';

export function createRaymarchingEntity(engine: Engine): IRaymarchingEntity {
  const entity = createGroupEntity(engine);
  const entityAddedComponent = engine.entityRepository.addComponentToEntity(
    RaymarchingComponent,
    entity
  ) as unknown as IRaymarchingEntity;
  return entityAddedComponent;
}
