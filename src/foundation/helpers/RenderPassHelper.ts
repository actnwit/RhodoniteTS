import { IMeshEntity } from '.';
import { Material } from '../materials';
import { Is } from '../misc';
import { RenderPass } from '../renderer';
import { MeshHelper } from './MeshHelper';

let planeEntity: IMeshEntity | undefined = undefined;

/**
 * Creates a RenderPass for Screen rendering.
 *
 * @note Don't forget to set 'noUseCameraTransform' property to the material
 *
 * @param material
 * @returns
 */
function createScreenDrawRenderPass(material: Material) {
  if (Is.not.exist(planeEntity)) {
    planeEntity = MeshHelper.createPlane({
      width: 2,
      height: 2,
      uSpan: 1,
      vSpan: 1,
      isUVRepeat: false,
      flipTextureCoordinateY: false,
      direction: 'xy',
      material,
    });
  }

  const renderPass = new RenderPass();
  renderPass.toClearColorBuffer = false;
  renderPass.addEntities([planeEntity]);

  return renderPass;
}

export const RenderPassHelper = Object.freeze({
  createScreenDrawRenderPass,
});
