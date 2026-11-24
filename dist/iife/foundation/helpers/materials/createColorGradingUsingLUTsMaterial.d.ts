import type { Count } from '../../../types/CommonTypes';
import type { RenderPass } from '../../renderer/RenderPass';
import type { Engine } from '../../system/Engine';
import type { Texture } from '../../textures/Texture';
/**
 * Creates a material for color grading using LUT (Look-Up Table) textures.
 * This material applies color correction and grading effects using 3D LUT textures.
 *
 * @param options - Configuration object for the color grading material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.colorAttachmentsNumber - Number of color attachments
 * @param options.uri - URI path to the LUT texture
 * @param options.texture - Pre-loaded LUT texture
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param targetRenderPass - The render pass to apply color grading to
 * @returns A configured Color Grading using LUTs Material instance
 */
export declare function createColorGradingUsingLUTsMaterial(engine: Engine, { additionalName, colorAttachmentsNumber, uri, texture, maxInstancesNumber, }: {
    additionalName?: string;
    colorAttachmentsNumber?: Count;
    uri?: string;
    texture?: Texture;
    maxInstancesNumber?: Count;
}, targetRenderPass: RenderPass): import("../..").Material;
