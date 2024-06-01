import { Material } from '../materials/core/Material';
import { RenderPass } from '../renderer/RenderPass';
import { AbstractTexture } from '../textures/AbstractTexture';
/**
 * Creates a RenderPass for Screen rendering.
 *
 * @param material
 * @returns
 */
declare function createScreenDrawRenderPass(material: Material): RenderPass;
/**
 * Creates a RenderPass for Screen rendering.
 *
 * @note Don't forget to set 'noUseCameraTransform' property to the material
 *
 * @param material
 * @returns
 */
declare function createScreenDrawRenderPassWithBaseColorTexture(material: Material, texture: AbstractTexture): RenderPass;
export declare const RenderPassHelper: Readonly<{
    createScreenDrawRenderPass: typeof createScreenDrawRenderPass;
    createScreenDrawRenderPassWithBaseColorTexture: typeof createScreenDrawRenderPassWithBaseColorTexture;
}>;
export {};
