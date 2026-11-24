import SummedAreaTableShaderFragment from '../../../webgl/shaderity_shaders/SummedAreaTableShader/SummedAreaTableShader.frag';
import SummedAreaTableShaderVertex from '../../../webgl/shaderity_shaders/SummedAreaTableShader/SummedAreaTableShader.vert';
import { CustomMaterialContent } from '../../materials/contents/CustomMaterialContent';
import type { Material } from '../../materials/core/Material';
import type { Engine } from '../../system/Engine';
import { createMaterial } from './createMaterial';

/**
 * Creates a material for generating summed area tables from textures.
 * This material is used for efficient area sampling and filtering operations.
 *
 * @param options - Configuration object for the summed area table material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Summed Area Table Material instance
 */
export function createSummedAreaTableMaterial(
  engine: Engine,
  { additionalName = '', maxInstancesNumber = 1 } = {}
): Material {
  const materialName = `SummedAreaTable_${additionalName}`;

  const materialContent = new CustomMaterialContent(engine, {
    name: materialName,
    isSkinning: false,
    isLighting: false,
    isMorphing: false,
    vertexShader: SummedAreaTableShaderVertex,
    pixelShader: SummedAreaTableShaderFragment,
    additionalShaderSemanticInfo: [],
  });
  const material = createMaterial(engine, materialContent, maxInstancesNumber);

  return material;
}
