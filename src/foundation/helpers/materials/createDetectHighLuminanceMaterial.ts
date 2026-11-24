import { DetectHighLuminanceMaterialContent } from '../../materials/contents/DetectHighLuminanceMaterialContent';
import type { Engine } from '../../system/Engine';
import type { AbstractTexture } from '../../textures/AbstractTexture';
import { createMaterial } from './createMaterial';

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
export function createDetectHighLuminanceMaterial(
  engine: Engine,
  { additionalName = '', maxInstancesNumber = 5 },
  textureToDetectHighLuminance: AbstractTexture
) {
  const materialName = `DetectHighLuminance_${additionalName}_`;
  const materialContent = new DetectHighLuminanceMaterialContent(engine, materialName, textureToDetectHighLuminance);
  const material = createMaterial(engine, materialContent, maxInstancesNumber);
  return material;
}
