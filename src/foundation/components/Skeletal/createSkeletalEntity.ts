import type { ISkeletalEntity } from '../../helpers/EntityHelper';
import type { Engine } from '../../system/Engine';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import { SkeletalComponent } from './SkeletalComponent';

export function createSkeletalEntity(engine: Engine): ISkeletalEntity {
  const entity = createGroupEntity(engine);
  const entityAddedComponent = engine.entityRepository.addComponentToEntity(
    SkeletalComponent,
    entity
  ) as unknown as ISkeletalEntity;
  return entityAddedComponent;
}
