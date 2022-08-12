import {ComponentRepository} from '../../core/ComponentRepository';
import {Is} from '../../misc/Is';
import {RenderPass} from '../../renderer/RenderPass';
import {CameraComponent} from './CameraComponent';

export function _getCameraComponentForRendering(
  renderPass: RenderPass
): CameraComponent | undefined {
  let cameraComponent = renderPass.cameraComponent;
  if (Is.not.exist(cameraComponent)) {
    // if renderPass doesn't have cameraComponent, use the CameraComponent specified by CameraComponent.current
    cameraComponent = ComponentRepository.getComponent(
      CameraComponent,
      CameraComponent.current
    ) as CameraComponent;
  }

  return cameraComponent;
}
