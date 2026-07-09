import type { Material } from '../materials/core/Material';
import { RenderPass } from '../renderer/RenderPass';
import type { Engine } from '../system/Engine';
import type { AbstractTexture } from '../textures/AbstractTexture';
import { Sampler } from '../textures/Sampler';
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
declare function createScreenDrawRenderPass(engine: Engine, material: Material): RenderPass;
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
declare function createScreenDrawRenderPassWithBaseColorTexture(engine: Engine, material: Material, texture: AbstractTexture, sampler?: Sampler): RenderPass;
/**
 * Cleans up the sampler cache for a specific engine instance.
 * This should be called when an engine is destroyed to prevent memory leaks.
 *
 * @param engine - The engine instance being destroyed
 * @internal
 */
export declare function _cleanupRenderPassHelperForEngine(engine: Engine): void;
/**
 * A collection of utility functions for creating and configuring RenderPass instances.
 * This helper provides convenient methods for common rendering scenarios, particularly
 * full-screen post-processing effects and screen-space operations.
 *
 * @namespace RenderPassHelper
 */
export declare const RenderPassHelper: Readonly<{
    createScreenDrawRenderPass: typeof createScreenDrawRenderPass;
    createScreenDrawRenderPassWithBaseColorTexture: typeof createScreenDrawRenderPassWithBaseColorTexture;
}>;
export {};
