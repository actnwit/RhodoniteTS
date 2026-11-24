import type { Count } from '../../../types/CommonTypes';
import type { Engine } from '../../system/Engine';
import type { AbstractTexture } from '../../textures/AbstractTexture';
/**
 * Creates a material for synthesizing HDR (High Dynamic Range) textures.
 * This material combines multiple textures to create HDR content for advanced lighting.
 *
 * @param options - Configuration object for the HDR synthesis material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param synthesizeTextures - Array of textures to synthesize into HDR
 * @returns A configured Synthesize HDR Material instance
 */
export declare function createSynthesizeHDRMaterial(engine: Engine, { additionalName, maxInstancesNumber, }: {
    additionalName?: string;
    maxInstancesNumber?: Count;
}, synthesizeTextures: AbstractTexture[]): import("../..").Material;
