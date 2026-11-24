import type { RenderPass } from '../../renderer/RenderPass';
import type { Engine } from '../../system/Engine';
/**
 * Creates a material for decoding classic shadow maps in the rendering pipeline.
 * This material applies shadow mapping techniques to create realistic shadows.
 *
 * @param options - Configuration object for the shadow map decode material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isMorphing - Enable morph target animation support
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isLighting - Enable lighting calculations
 * @param options.isDebugging - Enable debugging features
 * @param options.colorAttachmentsNumber - Number of color attachments
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param depthEncodeRenderPass - The render pass that encodes depth information
 * @returns A configured Shadow Map Decode Classic Material instance
 */
export declare function createShadowMapDecodeClassicSingleMaterial(engine: Engine, { additionalName, isMorphing, isSkinning, isLighting, isDebugging, colorAttachmentsNumber, maxInstancesNumber, }: {
    additionalName?: string | undefined;
    colorAttachmentsNumber?: number | undefined;
    isDebugging?: boolean | undefined;
    isLighting?: boolean | undefined;
    isMorphing?: boolean | undefined;
    isSkinning?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}, depthEncodeRenderPass: RenderPass): import("../..").Material;
