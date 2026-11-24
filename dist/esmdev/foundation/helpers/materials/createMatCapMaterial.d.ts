import type { Count } from '../../../types/CommonTypes';
import type { Engine } from '../../system/Engine';
import type { Sampler } from '../../textures/Sampler';
import type { Texture } from '../../textures/Texture';
/**
 * Creates a Material Capture (MatCap) material for stylized lighting effects.
 * This material uses a material capture texture to simulate lighting without actual light sources.
 *
 * @param options - Configuration object for the MatCap material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.uri - URI path to the MatCap texture
 * @param options.texture - Pre-loaded MatCap texture
 * @param options.sampler - Texture sampler for the MatCap texture
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured MatCap Material instance
 */
export declare function createMatCapMaterial(engine: Engine, { additionalName, isSkinning, uri, texture, sampler, maxInstancesNumber, }: {
    additionalName?: string;
    isSkinning?: boolean;
    uri?: string;
    texture?: Texture;
    sampler?: Sampler;
    maxInstancesNumber?: Count;
}): import("../..").Material;
