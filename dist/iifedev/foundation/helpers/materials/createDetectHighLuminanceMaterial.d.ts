import type { Engine } from '../../system/Engine';
import type { AbstractTexture } from '../../textures/AbstractTexture';
/**
 * Creates a material for detecting high luminance areas in textures.
 * This material is typically used in HDR rendering pipelines for bloom effects.
 *
 * @param options - Configuration object for the high luminance detection material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param textureToDetectHighLuminance - The texture to analyze for high luminance areas
 * @returns A configured Detect High Luminance Material instance
 */
export declare function createDetectHighLuminanceMaterial(engine: Engine, { additionalName, maxInstancesNumber }: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}, textureToDetectHighLuminance: AbstractTexture): import("../..").Material;
