import type { ICameraEntity } from '../../helpers/EntityHelper';
import type { Engine } from '../../system/Engine';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import { CameraComponent } from './CameraComponent';

export function createCameraEntity(engine: Engine, switchToThisCamera: boolean): ICameraEntity {
  const entity = createGroupEntity(engine);
  const entityAddedComponent = entity.engine.entityRepository.addComponentToEntity(
    CameraComponent,
    entity
  ) as unknown as ICameraEntity;
  if (switchToThisCamera) {
    CameraComponent.setCurrent(engine, entityAddedComponent.getCamera().componentSID);
  }
  return entityAddedComponent;
}
