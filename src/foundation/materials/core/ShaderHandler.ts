import ShaderityModule, { type ShaderityObject } from 'shaderity';
import type { CGAPIResourceHandle } from '../../../types/CommonTypes';
import type { WebGLContextWrapper } from '../../../webgl/WebGLContextWrapper';
import type { ShaderSources } from '../../../webgl/WebGLStrategy';
import { alphaProcessGlsl } from '../../../webgl/shaderity_shaders/common/alphaProcess';
import { enableVertexExtensionsGlsl } from '../../../webgl/shaderity_shaders/common/enableVertexExtensions';
import { fullscreenGlsl } from '../../../webgl/shaderity_shaders/common/fullscreen';
import { glslPrecisionGlsl } from '../../../webgl/shaderity_shaders/common/glslPrecision';
import { iblDefinitionGlsl } from '../../../webgl/shaderity_shaders/common/iblDefinition';
import { mainPrerequisitesGlsl } from '../../../webgl/shaderity_shaders/common/mainPrerequisites';
import { opticalDefinitionGlsl } from '../../../webgl/shaderity_shaders/common/opticalDefinition';
import { outputSrgbGlsl } from '../../../webgl/shaderity_shaders/common/outputSrgb';
import { pbrDefinitionGlsl } from '../../../webgl/shaderity_shaders/common/pbrDefinition';
import { prerequisitesGlsl } from '../../../webgl/shaderity_shaders/common/prerequisites';
import { processGeometryGlsl } from '../../../webgl/shaderity_shaders/common/processGeometry';
import { vertexInGlsl } from '../../../webgl/shaderity_shaders/common/vertexIn';
import { vertexInOutGlsl } from '../../../webgl/shaderity_shaders/common/vertexInOut';
import { wireframeGlsl } from '../../../webgl/shaderity_shaders/common/wireframe';
import type { AttributeNames } from '../../../webgl/types/CommonTypes';
import { alphaProcessWgsl } from '../../../webgpu/shaderity_shaders/common/alphaProcess';
import { fullscreenWgsl } from '../../../webgpu/shaderity_shaders/common/fullscreen';
import { iblDefinitionWgsl } from '../../../webgpu/shaderity_shaders/common/iblDefinition';
import { mainPrerequisitesWgsl } from '../../../webgpu/shaderity_shaders/common/mainPrerequisites';
import { opticalDefinitionWgsl } from '../../../webgpu/shaderity_shaders/common/opticalDefinition';
import { outputSrgbWgsl } from '../../../webgpu/shaderity_shaders/common/outputSrgb';
import { pbrDefinitionWgsl } from '../../../webgpu/shaderity_shaders/common/pbrDefinition';
import { prerequisitesWgsl } from '../../../webgpu/shaderity_shaders/common/prerequisites';
import { processGeometryWgsl } from '../../../webgpu/shaderity_shaders/common/processGeometry';
import { vertexInputWgsl } from '../../../webgpu/shaderity_shaders/common/vertexInput';
import { vertexOutputWgsl } from '../../../webgpu/shaderity_shaders/common/vertexOutput';
import { wireframeWgsl } from '../../../webgpu/shaderity_shaders/common/wireframe';
import type { RnXR } from '../../../xr/main';
import { WellKnownComponentTIDs } from '../../components/WellKnownComponentTIDs';
import { Config } from '../../core/Config';
import { BoneDataType } from '../../definitions/BoneDataType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import type { getShaderPropertyFunc } from '../../definitions/ShaderSemantics';
import type { VertexAttributeEnum } from '../../definitions/VertexAttribute';
import type { Primitive } from '../../geometry/Primitive';
import { Is } from '../../misc/Is';
import { CGAPIResourceRepository } from '../../renderer/CGAPIResourceRepository';
import { ModuleManager } from '../../system/ModuleManager';
import { SystemState } from '../../system/SystemState';
import type { AbstractMaterialContent } from './AbstractMaterialContent';
import type { Material } from './Material';
import { ShaderityUtilityWebGL } from './ShaderityUtilityWebGL';
import { ShaderityUtilityWebGPU } from './ShaderityUtilityWebGPU';

const Shaderity = (ShaderityModule as any).default || ShaderityModule;
const __shaderStringMap: Map<string, CGAPIResourceHandle> = new Map();

/**
 * Handles shader program creation, caching, and management for the rendering system.
 * Provides utilities for creating shader programs with WebGL and WebGPU backends.
 */
export class ShaderHandler {
  private static __shaderStringMap: Map<string, CGAPIResourceHandle> = new Map();

  /**
   * Creates a shader program or retrieves it from cache if already compiled.
   * This method implements shader program caching to avoid redundant compilation
   * of identical shader combinations.
   *
   * @param material - The material that will use this shader program
   * @param primitive - The geometric primitive that defines vertex attributes
   * @param vertexShader - The vertex shader source code
   * @param pixelShader - The fragment/pixel shader source code
   * @param attributeNames - Array of vertex attribute names
   * @param attributeSemantics - Array of vertex attribute semantic meanings
   * @param onError - Optional error callback function
   * @returns A tuple containing the shader program handle and a boolean indicating if it's newly created
   */
  static _createShaderProgramWithCache(
    material: Material,
    primitive: Primitive,
    vertexShader: string,
    pixelShader: string,
    attributeNames: AttributeNames,
    attributeSemantics: VertexAttributeEnum[],
    onError?: (message: string) => void
  ): [CGAPIResourceHandle, boolean] {
    // Cache
    const wholeShaderText = __removeCommentsFromShader(vertexShader + pixelShader);
    let shaderProgramUid = this.__shaderStringMap.get(wholeShaderText);
    if (shaderProgramUid) {
      return [shaderProgramUid, false];
    }

    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    shaderProgramUid = cgApiResourceRepository.createShaderProgram({
      material,
      primitive,
      vertexShaderStr: vertexShader,
      fragmentShaderStr: pixelShader,
      attributeNames: attributeNames,
      attributeSemantics: attributeSemantics,
      onError,
    });
    this.__shaderStringMap.set(wholeShaderText, shaderProgramUid);
    return [shaderProgramUid, true];
  }
}

/**
 * Removes comments from shader source code to normalize it for caching purposes.
 * This ensures that functionally identical shaders with different comments
 * are properly cached together.
 *
 * @param shader - The shader source code to process
 * @returns The shader source code with comments removed
 */
function __removeCommentsFromShader(shader: string) {
  return shader.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
}

/**
 * Creates a shader program using pre-processed shader sources.
 * This function is used when shader sources have already been updated
 * and processed through the shader compilation pipeline.
 *
 * @param material - The material that will use this shader program
 * @param primitive - The geometric primitive that defines vertex attributes
 * @param materialNode - The material content node containing shader objects
 * @param updatedShaderSources - Pre-processed vertex and fragment shader sources
 * @param onError - Optional error callback function
 * @returns A tuple containing the shader program handle and a boolean indicating if it's newly created
 */
export function _createProgramAsSingleOperationByUpdatedSources(
  material: Material,
  primitive: Primitive,
  materialNode: AbstractMaterialContent,
  updatedShaderSources: ShaderSources,
  onError?: (message: string) => void
): [CGAPIResourceHandle, boolean] {
  const { attributeNames, attributeSemantics } = _getAttributeInfo(materialNode.vertexShaderityObject!);

  const [shaderProgramUid, newOne] = ShaderHandler._createShaderProgramWithCache(
    material,
    primitive,
    updatedShaderSources.vertex,
    updatedShaderSources.pixel,
    attributeNames,
    attributeSemantics,
    onError
  );

  return [shaderProgramUid, newOne];
}

/**
 * Extracts vertex attribute information from a Shaderity object.
 * This includes both attribute names and their semantic meanings,
 * which are essential for proper vertex buffer binding.
 *
 * @param shaderityObject - The Shaderity object containing shader reflection data
 * @returns An object containing attribute names and their corresponding semantics
 */
export function _getAttributeInfo(shaderityObject: ShaderityObject) {
  const reflection = ShaderityUtilityWebGL.getAttributeReflection(shaderityObject);
  const attributeNames = reflection.names;
  const attributeSemantics = reflection.semantics;
  return { attributeNames, attributeSemantics };
}

/**
 * Generates a formatted string containing vertex attribute binding information.
 * This is primarily used for debugging and shader inspection purposes,
 * providing clear mapping between attribute names and their semantics.
 *
 * @param attributeNames - Array of vertex attribute names
 * @param attributeSemantics - Array of corresponding vertex attribute semantics
 * @returns A formatted string with attribute binding information
 */
export function _outputVertexAttributeBindingInfo(attributeNames: string[], attributeSemantics: VertexAttributeEnum[]) {
  let vertexAttributesBinding = '\n// Vertex Attributes Binding Info\n';
  for (let i = 0; i < attributeNames.length; i++) {
    vertexAttributesBinding += `// ${attributeNames[i]}: ${attributeSemantics[i].str} \n`;
  }
  return vertexAttributesBinding;
}

/**
 * Creates a complete shader program for WebGL rendering.
 * This function handles the entire shader compilation pipeline including:
 * - Material property extraction and embedding
 * - Shader definition generation
 * - Template filling with runtime values
 * - Final shader compilation and linking
 *
 * @param material - The material containing shader templates and properties
 * @param propertySetter - Function for setting shader properties
 * @param primitive - The geometric primitive that defines vertex attributes
 * @param vertexShaderMethodDefinitions_uniform - Uniform-based method definitions for vertex shader
 * @param isWebGL2 - Flag indicating if the current context is WebGL2
 * @returns A tuple containing the shader program handle and a boolean indicating if it's newly created
 */
export function _createProgramAsSingleOperationWebGL(
  material: Material,
  propertySetter: getShaderPropertyFunc,
  primitive: Primitive,
  vertexShaderMethodDefinitions_uniform: string,
  isWebGL2: boolean
): [CGAPIResourceHandle, boolean] {
  const vertexAttributeDefines = defineAttributes(primitive);
  const materialNode = material._materialContent;
  let definitions = materialNode.getDefinitions();
  const shaderDefines = material.getShaderDefines();
  for (const shaderDefine of shaderDefines) {
    definitions += `#define ${shaderDefine}\n`;
  }
  definitions += vertexAttributeDefines;

  let alphaMode = '';
  if (material.isBlend()) {
    alphaMode += '#define RN_IS_ALPHA_MODE_BLEND\n';
  }
  if (material.isMask()) {
    alphaMode += '#define RN_IS_ALPHA_MODE_MASK\n';
  }
  const cacheQuery =
    material.__materialTypeName +
    material._materialContent.getMaterialSemanticsVariantName() +
    vertexAttributeDefines +
    material._getFingerPrint() +
    definitions +
    alphaMode;

  let shaderProgramUid = __shaderStringMap.get(cacheQuery);
  if (shaderProgramUid) {
    return [shaderProgramUid, false];
  }

  const { vertexPropertiesStr, pixelPropertiesStr } = material._getProperties(propertySetter, isWebGL2);
  const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();

  // Shader Code Construction
  let vertexShader = _setupGlobalShaderDefinitionWebGL(material.__materialTypeName, primitive);
  vertexShader += '#define RN_IS_VERTEX_SHADER\n';
  let pixelShader = _setupGlobalShaderDefinitionWebGL(material.__materialTypeName, primitive);
  pixelShader += '#define RN_IS_PIXEL_SHADER\n';

  const vertexShaderityObject = ShaderityUtilityWebGL.fillTemplate(materialNode.vertexShaderityObject!, {
    enableVertexExtensions: enableVertexExtensionsGlsl.code,
    glslPrecision: glslPrecisionGlsl.code,
    vertexInOut: vertexInOutGlsl.code,
    fullscreen: fullscreenGlsl.code,
    WellKnownComponentTIDs,
    getters: vertexPropertiesStr,
    definitions: definitions,
    prerequisites: prerequisitesGlsl.code,
    mainPrerequisites: mainPrerequisitesGlsl.code,
    matricesGetters: vertexShaderMethodDefinitions_uniform,
    processGeometry: processGeometryGlsl.code,
    Config,
  });

  const pixelShaderityObject = ShaderityUtilityWebGL.fillTemplate(materialNode.pixelShaderityObject!, {
    glslPrecision: glslPrecisionGlsl.code,
    WellKnownComponentTIDs,
    vertexIn: vertexInGlsl.code,
    renderTargetBegin: webglResourceRepository.getGlslRenderTargetBeginString(4),
    getters: pixelPropertiesStr,
    definitions: definitions + alphaMode,
    prerequisites: prerequisitesGlsl.code,
    mainPrerequisites: mainPrerequisitesGlsl.code,
    matricesGetters: vertexShaderMethodDefinitions_uniform,
    opticalDefinition: opticalDefinitionGlsl.code,
    pbrDefinition: pbrDefinitionGlsl.code,
    iblDefinition: iblDefinitionGlsl.code,
    alphaProcess: alphaProcessGlsl.code,
    outputSrgb: outputSrgbGlsl.code,
    wireframe: wireframeGlsl.code,
    Config,
  });

  vertexShader += vertexShaderityObject.code.replace(/#version\s+(100|300\s+es)/, '');
  pixelShader += pixelShaderityObject.code.replace(/#version\s+(100|300\s+es)/, '');

  const { attributeNames, attributeSemantics } = _getAttributeInfo(vertexShaderityObject);
  const vertexAttributesBinding = _outputVertexAttributeBindingInfo(attributeNames, attributeSemantics);
  vertexShader += vertexAttributesBinding;

  const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
  shaderProgramUid = cgApiResourceRepository.createShaderProgram({
    material,
    primitive,
    vertexShaderStr: vertexShader,
    fragmentShaderStr: pixelShader,
    attributeNames: attributeNames,
    attributeSemantics: attributeSemantics,
  });
  __shaderStringMap.set(cacheQuery, shaderProgramUid);
  return [shaderProgramUid, true];
}

/**
 * Sets up global shader definitions and preprocessor directives for WebGL.
 * This function configures platform-specific shader features including:
 * - WebGL version detection and GLSL ES version selection
 * - UBO (Uniform Buffer Object) support detection
 * - Multi-view rendering for WebXR
 * - Bone data type definitions
 * - Standard derivatives extension support
 *
 * @param materialTypeName - The name of the material type for debugging
 * @param primitive - The geometric primitive for context-specific definitions
 * @returns A string containing all global shader definitions
 */
export function _setupGlobalShaderDefinitionWebGL(materialTypeName: string, primitive: Primitive) {
  let definitions = '';
  const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
  const glw = webglResourceRepository.currentWebGLContextWrapper as WebGLContextWrapper;
  if (glw.isWebGL2) {
    definitions += '#version 300 es\n#define GLSL_ES3\n';
    if (Config.isUboEnabled) {
      definitions += '#define RN_IS_UBO_ENABLED\n';
    }
  }
  definitions += `// RN_MATERIAL_TYPE_NAME: ${materialTypeName}\n`;
  if (ProcessApproach.isDataTextureApproach(SystemState.currentProcessApproach)) {
    definitions += '#define RN_IS_DATATEXTURE_MODE\n';
  } else {
    definitions += '#define RN_IS_UNIFORM_MODE\n';
  }

  const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR | undefined;
  const webXRSystem = rnXRModule?.WebXRSystem.getInstance();
  if (Is.exist(webXRSystem) && webXRSystem.isWebXRMode && webglResourceRepository.isSupportMultiViewVRRendering()) {
    definitions += '#define WEBGL2_MULTI_VIEW\n';
  }

  // if (glw._isWebXRMode && glw.is_multiview) {
  //   definitions += '#define WEBXR_MULTI_VIEW_VIEW_NUM_2\n';
  // }

  if (glw.isWebGL2 || glw.webgl1ExtDRV) {
    definitions += '#define RN_IS_SUPPORTING_STANDARD_DERIVATIVES\n';
  }
  if (Config.boneDataType === BoneDataType.Mat43x1) {
    definitions += '#define RN_BONE_DATA_TYPE_Mat43x1\n';
  } else if (Config.boneDataType === BoneDataType.Vec4x2) {
    definitions += '#define RN_BONE_DATA_TYPE_VEC4X2\n';
  } else if (Config.boneDataType === BoneDataType.Vec4x2Old) {
    definitions += '#define RN_BONE_DATA_TYPE_VEC4X2_OLD\n';
  } else if (Config.boneDataType === BoneDataType.Vec4x1) {
    definitions += '#define RN_BONE_DATA_TYPE_VEC4X1\n';
  }

  return definitions;
}

/**
 * Creates a complete shader program for WebGPU rendering.
 * This function handles the WebGPU-specific shader compilation pipeline including:
 * - WGSL shader template processing
 * - Material property embedding
 * - Pragma preprocessing with Shaderity
 * - WebGPU-specific definitions and configurations
 *
 * @param material - The material containing shader templates and properties
 * @param primitive - The geometric primitive that defines vertex attributes
 * @param vertexShaderMethodDefinitions - Method definitions for vertex shader
 * @param propertySetter - Function for setting shader properties
 * @returns The handle to the created shader program
 */
export function _createProgramAsSingleOperationWebGpu(
  material: Material,
  primitive: Primitive,
  vertexShaderMethodDefinitions: string,
  propertySetter: getShaderPropertyFunc
) {
  const vertexAttributeDefines = defineAttributes(primitive);
  const materialNode = material._materialContent;
  let definitions = `// Material Type: ${material.materialTypeName}\n`;
  definitions += materialNode.getDefinitions();
  const shaderDefines = material.getShaderDefines();
  for (const shaderDefine of shaderDefines) {
    definitions += `#define ${shaderDefine}\n`;
  }
  definitions += vertexAttributeDefines;
  let alphaMode = '';
  if (material.isBlend()) {
    alphaMode += '#define RN_IS_ALPHA_MODE_BLEND\n';
  }
  if (material.isMask()) {
    alphaMode += '#define RN_IS_ALPHA_MODE_MASK\n';
  }
  const cacheQuery =
    material._materialContent.getMaterialSemanticsVariantName() +
    vertexAttributeDefines +
    material._getFingerPrint() +
    definitions +
    alphaMode;

  let shaderProgramUid = __shaderStringMap.get(cacheQuery);
  if (shaderProgramUid) {
    return shaderProgramUid;
  }
  const { vertexPropertiesStr, pixelPropertiesStr } = material._getProperties(propertySetter, true);

  if (Config.boneDataType === BoneDataType.Mat43x1) {
    definitions += '#define RN_BONE_DATA_TYPE_Mat43x1\n';
  } else if (Config.boneDataType === BoneDataType.Vec4x2) {
    definitions += '#define RN_BONE_DATA_TYPE_VEC4X2\n';
  } else if (Config.boneDataType === BoneDataType.Vec4x2Old) {
    definitions += '#define RN_BONE_DATA_TYPE_VEC4X2_OLD\n';
  } else if (Config.boneDataType === BoneDataType.Vec4x1) {
    definitions += '#define RN_BONE_DATA_TYPE_VEC4X1\n';
  }

  const vertexShaderityObject = ShaderityUtilityWebGPU.fillTemplate(materialNode.vertexShaderityObject!, {
    WellKnownComponentTIDs,
    vertexInput: vertexInputWgsl.code,
    vertexOutput: vertexOutputWgsl.code,
    prerequisites: prerequisitesWgsl.code,
    mainPrerequisites: mainPrerequisitesWgsl.code,
    fullscreen: fullscreenWgsl.code,
    getters: vertexPropertiesStr,
    definitions: `// RN_IS_VERTEX_SHADER\n#define RN_IS_VERTEX_SHADER\n${definitions}`,
    matricesGetters: vertexShaderMethodDefinitions,
    processGeometry: processGeometryWgsl.code,
    Config,
  });

  const pixelShaderityObject = ShaderityUtilityWebGPU.fillTemplate(materialNode.pixelShaderityObject!, {
    WellKnownComponentTIDs,
    vertexOutput: vertexOutputWgsl.code,
    prerequisites: prerequisitesWgsl.code,
    mainPrerequisites: mainPrerequisitesWgsl.code,
    getters: pixelPropertiesStr,
    definitions: `// RN_IS_PIXEL_SHADER\n#define RN_IS_PIXEL_SHADER\n${definitions}${alphaMode}`,
    matricesGetters: vertexShaderMethodDefinitions,
    opticalDefinition: opticalDefinitionWgsl.code,
    pbrDefinition: pbrDefinitionWgsl.code,
    iblDefinition: iblDefinitionWgsl.code,
    alphaProcess: alphaProcessWgsl.code,
    outputSrgb: outputSrgbWgsl.code,
    wireframe: wireframeWgsl.code,
    Config,
  });

  const preprocessedVertex = Shaderity.processPragma(vertexShaderityObject);
  const preprocessedPixel = Shaderity.processPragma(pixelShaderityObject);

  const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
  shaderProgramUid = cgApiResourceRepository.createShaderProgram({
    material,
    primitive,
    vertexShaderStr: preprocessedVertex.code,
    fragmentShaderStr: preprocessedPixel.code,
    attributeNames: [],
    attributeSemantics: [],
  });
  __shaderStringMap.set(cacheQuery, shaderProgramUid);
  return shaderProgramUid;
}

/**
 * Generates preprocessor definitions based on vertex attributes present in a primitive.
 * This function analyzes the vertex attributes of a primitive and creates corresponding
 * shader preprocessor definitions that enable attribute-specific code paths in shaders.
 * It also handles special cases like morphing targets and instancing.
 *
 * @param primitive - The geometric primitive to analyze for vertex attributes
 * @returns A string containing all relevant vertex attribute preprocessor definitions
 */
function defineAttributes(primitive: Primitive) {
  let vertexAttributeDefines = '';
  const attributeSemantics = primitive.attributeSemantics;
  for (const attributeSemantic of attributeSemantics) {
    if (attributeSemantic.indexOf('POSITION') !== -1) {
      vertexAttributeDefines += '#define RN_USE_POSITION\n';
      const accessor = primitive.getAttribute(attributeSemantic);
      if (accessor!.componentType.isFloatingPoint()) {
        vertexAttributeDefines += '#define RN_USE_POSITION_FLOAT\n';
      } else if (accessor!.componentType.isInteger()) {
        vertexAttributeDefines += '#define RN_USE_POSITION_INT\n';
      } else {
        vertexAttributeDefines += '#define RN_USE_POSITION_UINT\n';
      }
    }
    if (attributeSemantic.indexOf('NORMAL') !== -1) {
      vertexAttributeDefines += '#define RN_USE_NORMAL\n';
    }
    if (attributeSemantic.indexOf('TANGENT') !== -1) {
      vertexAttributeDefines += '#define RN_USE_TANGENT\n';
    }
    if (attributeSemantic.indexOf('TEXCOORD_0') !== -1) {
      vertexAttributeDefines += '#define RN_USE_TEXCOORD_0\n';
    }
    if (attributeSemantic.indexOf('TEXCOORD_1') !== -1) {
      vertexAttributeDefines += '#define RN_USE_TEXCOORD_1\n';
    }
    if (attributeSemantic.indexOf('COLOR_0') !== -1) {
      vertexAttributeDefines += '#define RN_USE_COLOR_0\n';
      const accessor = primitive.getAttribute(attributeSemantic);
      if (accessor!.componentType.isFloatingPoint()) {
        vertexAttributeDefines += '#define RN_USE_COLOR_0_FLOAT\n';
      } else if (accessor!.componentType.isInteger()) {
        vertexAttributeDefines += '#define RN_USE_COLOR_0_INT\n';
      } else {
        vertexAttributeDefines += '#define RN_USE_COLOR_0_UINT\n';
      }
    }
    if (attributeSemantic.indexOf('JOINTS_0') !== -1) {
      vertexAttributeDefines += '#define RN_USE_JOINTS_0\n';
    }
    if (attributeSemantic.indexOf('WEIGHTS_0') !== -1) {
      vertexAttributeDefines += '#define RN_USE_WEIGHTS_0\n';
    }
    if (attributeSemantic.indexOf('FACE_NORMAL') !== -1) {
      vertexAttributeDefines += '#define RN_USE_FACE_NORMAL\n';
    }
    if (attributeSemantic.indexOf('BARY_CENTRIC_COORD') !== -1) {
      vertexAttributeDefines += '#define RN_USE_BARY_CENTRIC_COORD\n';
    }
    if (attributeSemantic.indexOf('TEXCOORD_2') !== -1) {
      vertexAttributeDefines += '#define RN_USE_TEXCOORD_2\n';
    }
  }
  if (primitive.targets != null && primitive.targets.length > 0) {
    vertexAttributeDefines += '#define RN_IS_MORPHING\n';
  }

  vertexAttributeDefines += '#define RN_USE_INSTANCE\n';
  return vertexAttributeDefines;
}
