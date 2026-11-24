import { FurnaceTestMaterialContent } from '../../materials/contents/FurnaceTestMaterialContent';
import type { Material } from '../../materials/core/Material';
import type { Engine } from '../../system/Engine';
import { createMaterial } from './createMaterial';

/**
 * Creates a furnace test material for validating material energy conservation.
 * This material is used for testing purposes to ensure materials conserve energy properly.
 *
 * @param options - Configuration object for the furnace test material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Furnace Test Material instance
 */
export function createFurnaceTestMaterial(
  engine: Engine,
  { additionalName = '', maxInstancesNumber = 1 } = {}
): Material {
  const materialName = `FurnaceTest_${additionalName}`;
  const materialContent = new FurnaceTestMaterialContent(engine, materialName);
  const material = createMaterial(engine, materialContent, maxInstancesNumber);

  return material;
}
