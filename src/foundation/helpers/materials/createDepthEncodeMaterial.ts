import { DepthEncodeMaterialContent } from '../../materials/contents/DepthEncodeMaterialContent';
import type { Engine } from '../../system/Engine';
import { createMaterial } from './createMaterial';

/**
 * Creates a material for encoding depth values into color channels.
 * This material is used for depth-based effects and shadow mapping.
 *
 * @param options - Configuration object for the depth encode material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.depthPow - Power value for depth encoding (affects depth precision)
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Depth Encode Material instance
 */
export function createDepthEncodeMaterial(
  engine: Engine,
  { additionalName = '', isSkinning = false, depthPow = 1.0, maxInstancesNumber = 10 } = {}
) {
  const materialName = `DepthEncode_${additionalName}_`;

  const materialContent = new DepthEncodeMaterialContent(engine, materialName, depthPow, {
    isSkinning,
  });
  const material = createMaterial(engine, materialContent, maxInstancesNumber);
  if (isSkinning) {
    material.addShaderDefine('RN_IS_SKINNING');
  }

  return material;
}
