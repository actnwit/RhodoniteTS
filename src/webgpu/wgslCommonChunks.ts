import { alphaProcessWgsl } from './shaderity_shaders/common/alphaProcess';
import { boneDecodeWgsl } from './shaderity_shaders/common/boneDecode';
import { fullscreenWgsl } from './shaderity_shaders/common/fullscreen';
import { iblDefinitionWgsl } from './shaderity_shaders/common/iblDefinition';
import { mainPrerequisitesWgsl } from './shaderity_shaders/common/mainPrerequisites';
import { opticalDefinitionWgsl } from './shaderity_shaders/common/opticalDefinition';
import { outputSrgbWgsl } from './shaderity_shaders/common/outputSrgb';
import { pbrDefinitionWgsl } from './shaderity_shaders/common/pbrDefinition';
import { prerequisitesWgsl } from './shaderity_shaders/common/prerequisites';
import { processGeometryWgsl } from './shaderity_shaders/common/processGeometry';
import { shadowWgsl } from './shaderity_shaders/common/shadow';
import { vertexInputWgsl } from './shaderity_shaders/common/vertexInput';
import { vertexOutputWgsl } from './shaderity_shaders/common/vertexOutput';
import { wireframeWgsl } from './shaderity_shaders/common/wireframe';

/**
 * Common WGSL chunks that ShaderHandler fills into the shader templates of every material.
 *
 * @remarks
 * The chunks are part of the webgpu module, which the engine loads only for its process approach,
 * so an application bundles and downloads only the chunks of the backend it uses.
 */
export const wgslCommonChunks = Object.freeze({
  alphaProcess: alphaProcessWgsl.code,
  boneDecode: boneDecodeWgsl.code,
  fullscreen: fullscreenWgsl.code,
  iblDefinition: iblDefinitionWgsl.code,
  mainPrerequisites: mainPrerequisitesWgsl.code,
  opticalDefinition: opticalDefinitionWgsl.code,
  outputSrgb: outputSrgbWgsl.code,
  pbrDefinition: pbrDefinitionWgsl.code,
  prerequisites: prerequisitesWgsl.code,
  processGeometry: processGeometryWgsl.code,
  shadow: shadowWgsl.code,
  vertexInput: vertexInputWgsl.code,
  vertexOutput: vertexOutputWgsl.code,
  wireframe: wireframeWgsl.code,
});

export type WgslCommonChunks = typeof wgslCommonChunks;
