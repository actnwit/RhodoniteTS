import type { ICameraControllerEntity } from '../../helpers/EntityHelper';
import type { Engine } from '../../system/Engine';
import { createCameraEntity } from '../Camera/createCameraEntity';
import { CameraControllerComponent } from './CameraControllerComponent';

export function createCameraControllerEntity(engine: Engine, switchToThisCamera: boolean): ICameraControllerEntity {
  const entity = createCameraEntity(engine, switchToThisCamera);
  // Add the class (not its TID) so the component registers itself and its runtime hooks on first use.
  const entityAddedComponent = engine.entityRepository.addComponentToEntity(
    CameraControllerComponent,
    entity
  ) as ICameraControllerEntity;

  return entityAddedComponent;
}
