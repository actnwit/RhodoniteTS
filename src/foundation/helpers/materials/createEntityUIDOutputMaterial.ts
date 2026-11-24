import { EntityUIDOutputMaterialContent } from '../../materials/contents/EntityUIDOutputMaterialContent';
import type { Material } from '../../materials/core/Material';
import type { Engine } from '../../system/Engine';
import { createMaterial } from './createMaterial';

/**
 * Creates a material for outputting entity unique identifiers to render targets.
 * This material is used for object picking and selection by rendering entity IDs.
 *
 * @param options - Configuration object for the entity UID output material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns A configured Entity UID Output Material instance
 */
export function createEntityUIDOutputMaterial(
  engine: Engine,
  { additionalName = '', maxInstancesNumber = 10 } = {}
): Material {
  const materialName = `EntityUIDOutput_${additionalName}`;

  const materialContent = new EntityUIDOutputMaterialContent(engine, materialName);
  const material = createMaterial(engine, materialContent, maxInstancesNumber);
  material.addShaderDefine('RN_IS_SKINNING');
  return material;
}
