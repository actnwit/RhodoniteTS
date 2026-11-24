import type { Count } from '../../../types/CommonTypes';
import type { Vrm1_Material } from '../../../types/VRMC_materials_mtoon';
import { MToon1MaterialContent } from '../../materials/contents/MToon1MaterialContent';
import { Scalar } from '../../math/Scalar';
import type { Engine } from '../../system/Engine';
import type { Sampler } from '../../textures/Sampler';
import { createMaterial } from './createMaterial';

/**
 * Creates an MToon 1.0 material for VRM 1.0 character rendering with enhanced toon shading.
 * This material implements the MToon 1.0 specification with improved features over 0.x.
 *
 * @param options - Configuration object for the MToon 1.0 material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isMorphing - Enable morph target animation support
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isLighting - Enable lighting calculations
 * @param options.useTangentAttribute - Use tangent attributes for normal mapping
 * @param options.isOutline - Enable outline rendering
 * @param options.materialJson - MToon 1.0 material JSON definition
 * @param options.textures - Array of textures used by the material
 * @param options.samplers - Array of texture samplers
 * @param options.debugMode - Debug mode settings
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param options.makeOutputSrgb - Whether to convert output to sRGB color space
 * @returns A configured MToon 1.0 Material instance
 */
export function createMToon1Material(
  engine: Engine,
  {
    additionalName = '',
    isMorphing = false,
    isSkinning = false,
    isLighting = true,
    isOutline = false,
    materialJson,
    maxInstancesNumber = engine.config.materialCountPerBufferView,
    makeOutputSrgb = true,
  }: {
    additionalName?: string;
    isMorphing?: boolean;
    isSkinning?: boolean;
    isLighting?: boolean;
    useTangentAttribute?: boolean;
    isOutline?: boolean;
    materialJson: Vrm1_Material;
    textures?: any[];
    samplers?: Sampler[];
    debugMode?: any;
    maxInstancesNumber?: Count;
    makeOutputSrgb?: boolean;
  }
) {
  const materialName = `MToon1_${additionalName}_`;

  const definitions = [];
  definitions.push('RN_USE_PBR');
  if (isSkinning) {
    definitions.push('RN_IS_SKINNING');
  }
  if (isMorphing) {
    definitions.push('RN_IS_MORPHING');
  }
  if (isLighting) {
    definitions.push('RN_USE_LIGHTING');
  }
  if (isOutline) {
    definitions.push('RN_USE_OUTLINE');
  }

  const materialContent = new MToon1MaterialContent(
    engine,
    materialName,
    isMorphing,
    isSkinning,
    isLighting,
    isOutline,
    definitions
  );

  const material = createMaterial(engine, materialContent, maxInstancesNumber);
  materialContent.setMaterialParameters(material, isOutline, materialJson);
  material.setParameter('makeOutputSrgb', Scalar.fromCopyNumber(makeOutputSrgb ? 1.0 : 0.0));
  material.zWriteWhenBlend = materialJson.extensions.VRMC_materials_mtoon.transparentWithZWrite;
  if (materialJson.normalTexture != null) {
    material.addShaderDefine('RN_USE_NORMAL_TEXTURE');
  }

  for (const definition of definitions) {
    material.addShaderDefine(definition);
  }

  return material;
}
