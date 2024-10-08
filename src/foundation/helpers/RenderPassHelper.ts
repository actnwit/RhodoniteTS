import { ShaderSemantics } from '../definitions/ShaderSemantics';
import { TextureParameter } from '../definitions/TextureParameter';
import { Material } from '../materials/core/Material';
import { Is } from '../misc/Is';
import { RenderPass } from '../renderer/RenderPass';
import { AbstractTexture } from '../textures/AbstractTexture';
import { Sampler } from '../textures/Sampler';
import { MeshHelper } from './MeshHelper';

let _sampler: Sampler | undefined;

/**
 * Creates a RenderPass for Screen rendering.
 *
 * @param material
 * @returns
 */
function createScreenDrawRenderPass(material: Material) {
  const renderPass = new RenderPass();
  renderPass.toClearColorBuffer = false;
  renderPass.toClearDepthBuffer = false;
  renderPass.isDepthTest = false;
  renderPass.setBufferLessFullScreenRendering(material);

  return renderPass;
}

/**
 * Creates a RenderPass for Screen rendering.
 *
 * @param material
 * @returns
 */
function createScreenDrawRenderPassWithBaseColorTexture(
  material: Material,
  texture: AbstractTexture,
  sampler?: Sampler
) {
  if (_sampler === undefined) {
    _sampler = new Sampler({
      magFilter: TextureParameter.Linear,
      minFilter: TextureParameter.Linear,
      wrapS: TextureParameter.ClampToEdge,
      wrapT: TextureParameter.ClampToEdge,
    });
    _sampler.create();
  }
  material.setTextureParameter('baseColorTexture', texture, sampler ?? _sampler);

  const renderPass = new RenderPass();
  renderPass.toClearColorBuffer = false;
  renderPass.toClearDepthBuffer = false;
  renderPass.isDepthTest = false;
  renderPass.setBufferLessFullScreenRendering(material);

  return renderPass;
}

export const RenderPassHelper = Object.freeze({
  createScreenDrawRenderPass,
  createScreenDrawRenderPassWithBaseColorTexture,
});
