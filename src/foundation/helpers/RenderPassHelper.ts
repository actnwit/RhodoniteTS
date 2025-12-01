import { ShaderSemantics } from '../definitions/ShaderSemantics';
import { TextureParameter } from '../definitions/TextureParameter';
import type { Material } from '../materials/core/Material';
import { Is } from '../misc/Is';
import { RenderPass } from '../renderer/RenderPass';
import type { Engine } from '../system/Engine';
import type { AbstractTexture } from '../textures/AbstractTexture';
import { Sampler } from '../textures/Sampler';
import { MeshHelper } from './MeshHelper';

let _sampler: Sampler | undefined;

/**
 * Creates a RenderPass optimized for full-screen rendering without depth testing.
 * This render pass is configured to skip color and depth buffer clearing,
 * disable depth testing, and use buffer-less full-screen rendering for optimal performance.
 *
 * @param material - The material to be used for rendering. Should contain appropriate shaders for screen-space operations.
 * @returns A configured RenderPass instance ready for full-screen rendering operations.
 *
 * @example
 * ```typescript
 * const material = new Material();
 * const renderPass = RenderPassHelper.createScreenDrawRenderPass(material);
 * ```
 */
function createScreenDrawRenderPass(engine: Engine, material: Material) {
  const renderPass = new RenderPass(engine);
  renderPass.toClearColorBuffer = false;
  renderPass.toClearDepthBuffer = false;
  renderPass.isDepthTest = false;
  renderPass.depthWriteMask = false;
  renderPass.setBufferLessFullScreenRendering(material);

  return renderPass;
}

/**
 * Creates a RenderPass for full-screen rendering with a base color texture.
 * This method automatically sets up texture sampling with linear filtering and clamp-to-edge wrapping.
 * A default sampler is created and cached for reuse if no custom sampler is provided.
 *
 * @param material - The material to be used for rendering. The base color texture will be bound to this material.
 * @param texture - The texture to be used as the base color texture for rendering.
 * @param sampler - Optional custom sampler for texture sampling. If not provided, a default linear sampler with clamp-to-edge wrapping will be used.
 * @returns A configured RenderPass instance with the texture properly bound to the material.
 *
 * @example
 * ```typescript
 * const material = new Material();
 * const texture = new Texture2D();
 * const renderPass = RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(material, texture);
 *
 * // With custom sampler
 * const customSampler = new Sampler({ magFilter: TextureParameter.Nearest });
 * const renderPassWithCustomSampler = RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
 *   material,
 *   texture,
 *   customSampler
 * );
 * ```
 */
function createScreenDrawRenderPassWithBaseColorTexture(
  engine: Engine,
  material: Material,
  texture: AbstractTexture,
  sampler?: Sampler
) {
  if (_sampler === undefined) {
    _sampler = new Sampler(engine, {
      magFilter: TextureParameter.Linear,
      minFilter: TextureParameter.Linear,
      wrapS: TextureParameter.ClampToEdge,
      wrapT: TextureParameter.ClampToEdge,
    });
    _sampler.create();
  }
  material.setTextureParameter('baseColorTexture', texture, sampler ?? _sampler);

  const renderPass = new RenderPass(engine);
  renderPass.toClearColorBuffer = false;
  renderPass.toClearDepthBuffer = false;
  renderPass.isDepthTest = false;
  renderPass.depthWriteMask = false;
  renderPass.setBufferLessFullScreenRendering(material);

  return renderPass;
}

/**
 * A collection of utility functions for creating and configuring RenderPass instances.
 * This helper provides convenient methods for common rendering scenarios, particularly
 * full-screen post-processing effects and screen-space operations.
 *
 * @namespace RenderPassHelper
 */
export const RenderPassHelper = Object.freeze({
  createScreenDrawRenderPass,
  createScreenDrawRenderPassWithBaseColorTexture,
});
