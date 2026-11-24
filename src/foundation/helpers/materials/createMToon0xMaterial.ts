import type { Vrm0xMaterialProperty } from '../../../types';
import type { Count } from '../../../types/CommonTypes';
import { MToon0xMaterialContent } from '../../materials/contents/MToon0xMaterialContent';
import type { Engine } from '../../system/Engine';
import type { Sampler } from '../../textures/Sampler';
import { createMaterial } from './createMaterial';

/**
 * Creates an MToon 0.x material for VRM character rendering with toon shading.
 * This material implements the MToon 0.x specification for anime/toon-style rendering.
 *
 * @param options - Configuration object for the MToon 0.x material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.isMorphing - Enable morph target animation support
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isLighting - Enable lighting calculations
 * @param options.useTangentAttribute - Use tangent attributes for normal mapping
 * @param options.isOutline - Enable outline rendering
 * @param options.materialProperties - MToon material property definitions
 * @param options.textures - Array of textures used by the material
 * @param options.samplers - Array of texture samplers
 * @param options.debugMode - Debug mode settings
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param options.makeOutputSrgb - Whether to convert output to sRGB color space
 * @returns A configured MToon 0.x Material instance
 */
export function createMToon0xMaterial(
  engine: Engine,
  {
    additionalName = '',
    isMorphing = false,
    isSkinning = false,
    isLighting = true,
    useTangentAttribute = false,
    isOutline = false,
    materialProperties,
    textures,
    samplers,
    debugMode,
    maxInstancesNumber = engine.config.materialCountPerBufferView,
    makeOutputSrgb = true,
  }: {
    additionalName?: string;
    isMorphing?: boolean;
    isSkinning?: boolean;
    isLighting?: boolean;
    useTangentAttribute?: boolean;
    isOutline?: boolean;
    materialProperties?: Vrm0xMaterialProperty;
    textures?: any[];
    samplers?: Sampler[];
    debugMode?: any;
    maxInstancesNumber?: Count;
    makeOutputSrgb?: boolean;
  }
) {
  const materialName = `MToon0x_${additionalName}_`;

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

  const materialContent = new MToon0xMaterialContent(
    engine,
    isOutline,
    materialProperties,
    textures,
    samplers!,
    isMorphing,
    isSkinning,
    isLighting,
    useTangentAttribute,
    debugMode,
    makeOutputSrgb,
    materialName,
    definitions
  );

  const material = createMaterial(engine, materialContent, maxInstancesNumber);
  materialContent.setMaterialParameters(engine, material, isOutline);

  for (const definition of definitions) {
    material.addShaderDefine(definition);
  }

  return material;
}
