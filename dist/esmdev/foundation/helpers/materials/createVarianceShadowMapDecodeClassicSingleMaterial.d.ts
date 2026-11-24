import type { Count } from '../../../types/CommonTypes';
import type { CameraComponent } from '../../components/Camera/CameraComponent';
import type { RenderPass } from '../../renderer/RenderPass';
import type { Engine } from '../../system/Engine';
/**
 * Creates a material for decoding variance shadow maps with classic single-pass rendering.
 * This material implements variance shadow mapping for soft shadow effects.
 *
 * @param options - Configuration object for the variance shadow map material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isMorphing - Enable morph target animation support
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isDebugging - Enable debugging features
 * @param options.isLighting - Enable lighting calculations
 * @param options.colorAttachmentsNumberDepth - Number of depth color attachments
 * @param options.colorAttachmentsNumberSquareDepth - Number of squared depth color attachments
 * @param options.depthCameraComponent - Camera component for depth calculations
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param encodedDepthRenderPasses - Array of render passes that encode depth information
 * @returns A configured Variance Shadow Map Decode Classic Material instance
 */
export declare function createVarianceShadowMapDecodeClassicSingleMaterial(engine: Engine, { additionalName, isMorphing, isSkinning, isDebugging, isLighting, colorAttachmentsNumberDepth, colorAttachmentsNumberSquareDepth, depthCameraComponent, maxInstancesNumber, }: {
    additionalName?: string;
    isMorphing?: boolean;
    isSkinning?: boolean;
    isDebugging?: boolean;
    isLighting?: boolean;
    colorAttachmentsNumberDepth?: Count;
    colorAttachmentsNumberSquareDepth?: Count;
    depthCameraComponent?: CameraComponent;
    maxInstancesNumber?: Count;
}, encodedDepthRenderPasses: RenderPass[]): import("../..").Material;
