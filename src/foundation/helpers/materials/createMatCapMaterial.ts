import type { Count } from '../../../types/CommonTypes';
import { MatCapMaterialContent } from '../../materials/contents/MatCapMaterialContent';
import type { Engine } from '../../system/Engine';
import type { Sampler } from '../../textures/Sampler';
import type { Texture } from '../../textures/Texture';
import { createMaterial } from './createMaterial';

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
export function createMatCapMaterial(
  engine: Engine,
  {
    additionalName = '',
    isSkinning = false,
    uri,
    texture,
    sampler,
    maxInstancesNumber = 10,
  }: {
    additionalName?: string;
    isSkinning?: boolean;
    uri?: string;
    texture?: Texture;
    sampler?: Sampler;
    maxInstancesNumber?: Count;
  }
) {
  const materialName = `MatCap_${additionalName}`;

  const materialContent = new MatCapMaterialContent(engine, materialName, isSkinning, uri, texture, sampler);
  const material = createMaterial(engine, materialContent, maxInstancesNumber);
  if (isSkinning) {
    material.addShaderDefine('RN_IS_SKINNING');
  }

  return material;
}
