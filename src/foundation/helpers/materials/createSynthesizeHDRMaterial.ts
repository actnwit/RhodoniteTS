import type { Count } from '../../../types/CommonTypes';
import { SynthesizeHdrMaterialContent as SynthesizeHDRMaterialContent } from '../../materials/contents/SynthesizeHdrMaterialContent';
import type { Engine } from '../../system/Engine';
import type { AbstractTexture } from '../../textures/AbstractTexture';
import { createMaterial } from './createMaterial';

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
export function createSynthesizeHDRMaterial(
  engine: Engine,
  {
    additionalName = '',
    maxInstancesNumber = 1,
  }: {
    additionalName?: string;
    maxInstancesNumber?: Count;
  },
  synthesizeTextures: AbstractTexture[]
) {
  const materialName = `SynthesizeHDR_${additionalName}`;

  const materialContent = new SynthesizeHDRMaterialContent(engine, materialName, synthesizeTextures);
  const material = createMaterial(engine, materialContent, maxInstancesNumber);

  return material;
}
