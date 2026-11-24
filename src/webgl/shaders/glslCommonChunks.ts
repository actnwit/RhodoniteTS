import { alphaProcessGlsl } from '../shaderity_shaders/common/alphaProcess';
import { enableVertexExtensionsGlsl } from '../shaderity_shaders/common/enableVertexExtensions';
import { fullscreenGlsl } from '../shaderity_shaders/common/fullscreen';
import { glslPrecisionGlsl } from '../shaderity_shaders/common/glslPrecision';
import { iblDefinitionGlsl } from '../shaderity_shaders/common/iblDefinition';
import { mainPrerequisitesGlsl } from '../shaderity_shaders/common/mainPrerequisites';
import { opticalDefinitionGlsl } from '../shaderity_shaders/common/opticalDefinition';
import { outputSrgbGlsl } from '../shaderity_shaders/common/outputSrgb';
import { pbrDefinitionGlsl } from '../shaderity_shaders/common/pbrDefinition';
import { prerequisitesGlsl } from '../shaderity_shaders/common/prerequisites';
import { processGeometryGlsl } from '../shaderity_shaders/common/processGeometry';
import { shadowGlsl } from '../shaderity_shaders/common/shadow';
import { vertexInGlsl } from '../shaderity_shaders/common/vertexIn';
import { vertexInOutGlsl } from '../shaderity_shaders/common/vertexInOut';
import { wireframeGlsl } from '../shaderity_shaders/common/wireframe';

/**
 * Common GLSL chunks that ShaderHandler fills into the shader templates of every material.
 *
 * @remarks
 * The chunks are part of the webgl module, which the engine loads only for its process approach,
 * so an application bundles and downloads only the chunks of the backend it uses.
 */
export const glslCommonChunks = Object.freeze({
  alphaProcess: alphaProcessGlsl.code,
  enableVertexExtensions: enableVertexExtensionsGlsl.code,
  fullscreen: fullscreenGlsl.code,
  glslPrecision: glslPrecisionGlsl.code,
  iblDefinition: iblDefinitionGlsl.code,
  mainPrerequisites: mainPrerequisitesGlsl.code,
  opticalDefinition: opticalDefinitionGlsl.code,
  outputSrgb: outputSrgbGlsl.code,
  pbrDefinition: pbrDefinitionGlsl.code,
  prerequisites: prerequisitesGlsl.code,
  processGeometry: processGeometryGlsl.code,
  shadow: shadowGlsl.code,
  vertexIn: vertexInGlsl.code,
  vertexInOut: vertexInOutGlsl.code,
  wireframe: wireframeGlsl.code,
});

export type GlslCommonChunks = typeof glslCommonChunks;
