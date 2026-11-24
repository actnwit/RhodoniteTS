import type { Count } from '../../../types/CommonTypes';
import { ColorGradingUsingLUTsMaterialContent } from '../../materials/contents/ColorGradingUsingLUTsMaterialContent';
import type { RenderPass } from '../../renderer/RenderPass';
import type { Engine } from '../../system/Engine';
import type { Texture } from '../../textures/Texture';
import { createMaterial } from './createMaterial';

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
export function createColorGradingUsingLUTsMaterial(
  engine: Engine,
  {
    additionalName = '',
    colorAttachmentsNumber = 0,
    uri,
    texture,
    maxInstancesNumber = 1,
  }: {
    additionalName?: string;
    colorAttachmentsNumber?: Count;
    uri?: string;
    texture?: Texture;
    maxInstancesNumber?: Count;
  },
  targetRenderPass: RenderPass
) {
  const materialName = `ColorGradingUsingLUTs_${additionalName}`;

  const materialContent = new ColorGradingUsingLUTsMaterialContent(
    engine,
    materialName,
    targetRenderPass,
    colorAttachmentsNumber,
    uri,
    texture
  );
  const material = createMaterial(engine, materialContent, maxInstancesNumber);

  return material;
}
