import ShaderityModule, { type ShaderityObject } from 'shaderity';
import type { CGAPIResourceHandle } from '../../../types/CommonTypes';
import type { RnWebGL } from '../../../webgl/main';
import type { GlslCommonChunks } from '../../../webgl/shaders/glslCommonChunks';
import type { AttributeNames } from '../../../webgl/types/CommonTypes';
import type { WebGLContextWrapper } from '../../../webgl/WebGLContextWrapper';
import type { ShaderSources } from '../../../webgl/WebGLStrategy';
import type { RnWebGpu } from '../../../webgpu/main';
import type { WgslCommonChunks } from '../../../webgpu/wgslCommonChunks';
import { WellKnownComponentTIDs } from '../../components/WellKnownComponentTIDs';
import { Component } from '../../core/Component';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import type {
  getShaderPropertyFuncOfGlobalDataRepository,
  getShaderPropertyFuncOfMaterial,
} from '../../definitions/ShaderSemantics';
import type { VertexAttributeEnum } from '../../definitions/VertexAttribute';
import type { Primitive } from '../../geometry/Primitive';
import { Is } from '../../misc/Is';
import type { Engine } from '../../system/Engine';
import { ModuleManager } from '../../system/ModuleManager';
import type { AbstractMaterialContent } from './AbstractMaterialContent';
import type { Material } from './Material';
import { ShaderityUtilityWebGL } from './ShaderityUtilityWebGL';
import { ShaderityUtilityWebGPU } from './ShaderityUtilityWebGPU';

const Shaderity = (ShaderityModule as any).default || ShaderityModule;

/**
 * The common GLSL chunks come with the WebGL module (loaded by Engine.init for ProcessApproach.WebGL2),
 * so that WebGPU applications do not bundle them.
 */
function __getGlslCommonChunks(): GlslCommonChunks {
  const webglModule = ModuleManager.getInstance().getModule('webgl') as RnWebGL | undefined;
  if (webglModule == null) {
    throw new Error('The WebGL module is not loaded. Initialize the engine with ProcessApproach.WebGL2 first.');
  }
  return webglModule.glslCommonChunks;
}

/**
 * The common WGSL chunks come with the WebGPU module (loaded by Engine.init for ProcessApproach.WebGPU),
 * so that WebGL applications do not bundle them.
 */
function __getWgslCommonChunks(): WgslCommonChunks {
  const webgpuModule = ModuleManager.getInstance().getModule('webgpu') as RnWebGpu | undefined;
  if (webgpuModule == null) {
    throw new Error('The WebGPU module is not loaded. Initialize the engine with ProcessApproach.WebGPU first.');
  }
  return webgpuModule.wgslCommonChunks;
}

/**
 * Handles shader program creation, caching, and management for the rendering system.
 * Provides utilities for creating shader programs with WebGL and WebGPU backends.
 *
 * @remarks
 * Shader program caching is managed per-Engine instance to prevent cross-contamination
 * between different WebGL contexts. When an Engine is destroyed, its shader cache
 * is automatically cleaned up.
 */
export class ShaderHandler {
  /**
   * Creates a shader program or retrieves it from cache if already compiled.
   * This method implements shader program caching to avoid redundant compilation
   * of identical shader combinations. The cache is stored per-Engine instance.
   *
   * @param engine - The engine instance that owns the shader cache
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
    engine: Engine,
    material: Material,
    primitive: Primitive,
    vertexShader: string,
    pixelShader: string,
    attributeNames: AttributeNames,
    attributeSemantics: VertexAttributeEnum[],
    onError?: (message: string) => void
  ): [CGAPIResourceHandle, boolean] {
    // Use the engine's shader program cache
    const shaderCache = engine.shaderProgramCache;
    const wholeShaderText = __removeCommentsFromShader(vertexShader + pixelShader);
    let shaderProgramUid = shaderCache.get(wholeShaderText);
    if (shaderProgramUid != null) {
      return [shaderProgramUid, false];
    }

    const cgApiResourceRepository = engine.cgApiResourceRepository;
    shaderProgramUid = cgApiResourceRepository.createShaderProgram({
      config: engine.config,
      engine,
      material,
      primitive,
      vertexShaderStr: vertexShader,
      fragmentShaderStr: pixelShader,
      attributeNames: attributeNames,
      attributeSemantics: attributeSemantics,
      onError,
    });
    shaderCache.set(wholeShaderText, shaderProgramUid);
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
 * @param engine - The engine instance
 * @param material - The material that will use this shader program
 * @param primitive - The geometric primitive that defines vertex attributes
 * @param materialNode - The material content node containing shader objects
 * @param updatedShaderSources - Pre-processed vertex and fragment shader sources
 * @param onError - Optional error callback function
 * @returns A tuple containing the shader program handle and a boolean indicating if it's newly created
 */
export function _createProgramAsSingleOperationByUpdatedSources(
  engine: Engine,
  material: Material,
  primitive: Primitive,
  materialNode: AbstractMaterialContent,
  updatedShaderSources: ShaderSources,
  onError?: (message: string) => void
): [CGAPIResourceHandle, boolean] {
  const { attributeNames, attributeSemantics } = _getAttributeInfo(materialNode.vertexShaderityObject!);

  const [shaderProgramUid, newOne] = ShaderHandler._createShaderProgramWithCache(
    engine,
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
 * @param engine - The engine instance
 * @param material - The material containing shader templates and properties
 * @param componentDataAccessMethodDefinitionsForVertexShader - method definitions for component data access for vertex shader
 * @param componentDataAccessMethodDefinitionsForPixelShader - method definitions for component data access for pixel shader
 * @param propertySetterOfGlobalDataRepository - Function for setting shader properties of global data repository
 * @param propertySetterOfMaterial - Function for setting shader properties of material
 * @param morphedPositionGetter - Function to get the morphed position
 * @param primitive - The geometric primitive that defines vertex attributes
 * @returns A tuple containing the shader program handle and a boolean indicating if it's newly created
 */
export function _createProgramAsSingleOperationWebGL(
  engine: Engine,
  material: Material,
  componentDataAccessMethodDefinitionsForVertexShader: string,
  componentDataAccessMethodDefinitionsForPixelShader: string,
  propertySetterOfGlobalDataRepository: getShaderPropertyFuncOfGlobalDataRepository,
  propertySetterOfMaterial: getShaderPropertyFuncOfMaterial,
  morphedPositionGetter: string,
  primitive: Primitive
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

  // Determine if Multi-View rendering is enabled for WebXR
  const webglResourceRepository = engine.webglResourceRepository;
  const webXRSystem = engine.webXRSystem;
  const isMultiViewVRRendering =
    Is.exist(webXRSystem) && webXRSystem.isWebXRMode && webglResourceRepository.isSupportMultiViewVRRendering(engine);

  const cacheQuery =
    Component.getStateVersion(engine) +
    engine.materialRepository._getBufferViewVersion(material.__materialTypeName) +
    material.__materialTypeName +
    material._materialContent.getMaterialSemanticsVariantName() +
    vertexAttributeDefines +
    material._getFingerPrint() +
    definitions +
    morphedPositionGetter +
    componentDataAccessMethodDefinitionsForVertexShader +
    componentDataAccessMethodDefinitionsForPixelShader +
    morphedPositionGetter +
    alphaMode +
    (isMultiViewVRRendering ? 'WEBGL2_MULTI_VIEW' : '');

  // Use the engine's shader program cache
  const shaderCache = engine.shaderProgramCache;
  let shaderProgramUid = shaderCache.get(cacheQuery);
  if (shaderProgramUid != null) {
    return [shaderProgramUid, false];
  }

  const { vertexPropertiesStr, pixelPropertiesStr } = material._getProperties(
    engine,
    propertySetterOfGlobalDataRepository,
    propertySetterOfMaterial
  );

  // Shader Code Construction
  let vertexShader = _setupGlobalShaderDefinitionWebGL(engine, material.__materialTypeName, primitive);
  vertexShader += '#define RN_IS_VERTEX_SHADER\n';
  let pixelShader = _setupGlobalShaderDefinitionWebGL(engine, material.__materialTypeName, primitive);
  pixelShader += '#define RN_IS_PIXEL_SHADER\n';

  const glslChunks = __getGlslCommonChunks();
  const vertexShaderityObject = ShaderityUtilityWebGL.fillTemplate(
    engine,
    materialNode.vertexShaderityObject!,
    primitive,
    {
      enableVertexExtensions: glslChunks.enableVertexExtensions,
      glslPrecision: glslChunks.glslPrecision,
      vertexInOut: glslChunks.vertexInOut,
      fullscreen: glslChunks.fullscreen,
      WellKnownComponentTIDs,
      getters: vertexPropertiesStr,
      definitions: definitions,
      prerequisites: glslChunks.prerequisites,
      mainPrerequisites: glslChunks.mainPrerequisites,
      matricesGetters: componentDataAccessMethodDefinitionsForVertexShader + morphedPositionGetter,
      opticalDefinition: glslChunks.opticalDefinition,
      shadowDefinition: glslChunks.shadow,
      pbrDefinition: glslChunks.pbrDefinition,
      iblDefinition: glslChunks.iblDefinition,
      alphaProcess: glslChunks.alphaProcess,
      processGeometry: glslChunks.processGeometry,
      Config: engine.config,
    }
  );

  const pixelShaderityObject = ShaderityUtilityWebGL.fillTemplate(
    engine,
    materialNode.pixelShaderityObject!,
    primitive,
    {
      glslPrecision: glslChunks.glslPrecision,
      WellKnownComponentTIDs,
      vertexIn: glslChunks.vertexIn,
      renderTargetBegin: webglResourceRepository.getGlslRenderTargetBeginString(4),
      getters: pixelPropertiesStr,
      definitions: definitions + alphaMode,
      prerequisites: glslChunks.prerequisites,
      mainPrerequisites: glslChunks.mainPrerequisites,
      matricesGetters: componentDataAccessMethodDefinitionsForPixelShader,
      opticalDefinition: glslChunks.opticalDefinition,
      pbrDefinition: glslChunks.pbrDefinition,
      iblDefinition: glslChunks.iblDefinition,
      alphaProcess: glslChunks.alphaProcess,
      outputSrgb: glslChunks.outputSrgb,
      wireframe: glslChunks.wireframe,
      shadowDefinition: glslChunks.shadow,
      Config: engine.config,
    }
  );

  vertexShader += vertexShaderityObject.code.replace(/#version\s+(100|300\s+es)/, '');
  pixelShader += pixelShaderityObject.code.replace(/#version\s+(100|300\s+es)/, '');

  const { attributeNames, attributeSemantics } = _getAttributeInfo(vertexShaderityObject);
  const vertexAttributesBinding = _outputVertexAttributeBindingInfo(attributeNames, attributeSemantics);
  vertexShader += vertexAttributesBinding;

  const preprocessedVertex = Shaderity.processPragma(
    {
      code: vertexShader,
      shaderStage: 'vertex',
      isFragmentShader: false,
    },
    true
  );
  const preprocessedPixel = Shaderity.processPragma(
    {
      code: pixelShader,
      shaderStage: 'fragment',
      isFragmentShader: true,
    },
    true
  );

  const cgApiResourceRepository = engine.cgApiResourceRepository;
  shaderProgramUid = cgApiResourceRepository.createShaderProgram({
    config: engine.config,
    engine,
    material,
    primitive,
    vertexShaderStr: preprocessedVertex.code,
    fragmentShaderStr: preprocessedPixel.code,
    attributeNames: attributeNames,
    attributeSemantics: attributeSemantics,
  });
  shaderCache.set(cacheQuery, shaderProgramUid);
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
export function _setupGlobalShaderDefinitionWebGL(engine: Engine, materialTypeName: string, _primitive: Primitive) {
  let definitions = '';
  const webglResourceRepository = engine.webglResourceRepository;
  const glw = webglResourceRepository.currentWebGLContextWrapper as WebGLContextWrapper;
  if (glw.isWebGL2) {
    definitions += '#version 300 es\n#define GLSL_ES3\n';
    if (engine.config.isUboEnabled) {
      definitions += '#define RN_IS_UBO_ENABLED\n';
    }
  }
  definitions += `// RN_MATERIAL_TYPE_NAME: ${materialTypeName}\n`;
  if (ProcessApproach.isWebGL2Approach(engine.engineState.currentProcessApproach)) {
    definitions += '#define RN_IS_WEBGL2_MODE\n';
    if (engine.config.isMultiDrawEnabled && webglResourceRepository.isInstanceSidTextureCapable) {
      definitions += '#define RN_USE_INSTANCE_SID_TEXTURE\n';
      definitions += '#define RN_USE_MATERIAL_SID_ATTRIBUTE\n';
    }
  }

  const webXRSystem = engine.webXRSystem;
  if (
    Is.exist(webXRSystem) &&
    webXRSystem.isWebXRMode &&
    webglResourceRepository.isSupportMultiViewVRRendering(engine)
  ) {
    definitions += '#define WEBGL2_MULTI_VIEW\n';
  }

  // if (glw._isWebXRMode && glw.is_multiview) {
  //   definitions += '#define WEBXR_MULTI_VIEW_VIEW_NUM_2\n';
  // }

  if (glw.isWebGL2 || glw.webgl1ExtDRV) {
    definitions += '#define RN_IS_SUPPORTING_STANDARD_DERIVATIVES\n';
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
 * @param engine - The engine instance
 * @param material - The material containing shader templates and properties
 * @param primitive - The geometric primitive that defines vertex attributes
 * @param componentDataAccessMethodDefinitionsForVertexShader - method definitions for component data access for vertex shader
 * @param componentDataAccessMethodDefinitionsForPixelShader - method definitions for component data access for pixel shader
 * @param propertySetterOfGlobalDataRepository - Function for setting shader properties of global data repository
 * @param propertySetterOfMaterial - Function for setting shader properties of material
 * @param morphedPositionGetter - Function to get the morphed position
 * @returns The handle to the created shader program
 */
export function _createProgramAsSingleOperationWebGpu(
  engine: Engine,
  material: Material,
  primitive: Primitive,
  componentDataAccessMethodDefinitionsForVertexShader: string,
  componentDataAccessMethodDefinitionsForPixelShader: string,
  propertySetterOfGlobalDataRepository: getShaderPropertyFuncOfGlobalDataRepository,
  propertySetterOfMaterial: getShaderPropertyFuncOfMaterial,
  morphedPositionGetter: string
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
    Component.getStateVersion(engine) +
    engine.materialRepository._getBufferViewVersion(material.__materialTypeName) +
    material.__materialTypeName +
    material._materialContent.getMaterialSemanticsVariantName() +
    vertexAttributeDefines +
    material._getFingerPrint() +
    definitions +
    componentDataAccessMethodDefinitionsForVertexShader +
    componentDataAccessMethodDefinitionsForPixelShader +
    morphedPositionGetter +
    alphaMode;

  // Use the engine's shader program cache
  const shaderCache = engine.shaderProgramCache;
  let shaderProgramUid = shaderCache.get(cacheQuery);
  if (shaderProgramUid != null) {
    return shaderProgramUid;
  }
  material.updateStateVersion();
  const { vertexPropertiesStr, pixelPropertiesStr } = material._getProperties(
    engine,
    propertySetterOfGlobalDataRepository,
    propertySetterOfMaterial
  );

  const wgslChunks = __getWgslCommonChunks();
  const vertexShaderityObject = ShaderityUtilityWebGPU.fillTemplate(
    engine,
    materialNode.vertexShaderityObject!,
    primitive,
    {
      WellKnownComponentTIDs,
      vertexInput: wgslChunks.vertexInput,
      vertexOutput: wgslChunks.vertexOutput,
      prerequisites: wgslChunks.prerequisites,
      mainPrerequisites: wgslChunks.mainPrerequisites,
      fullscreen: wgslChunks.fullscreen,
      getters: vertexPropertiesStr,
      definitions: `// RN_IS_VERTEX_SHADER\n#define RN_IS_VERTEX_SHADER\n${definitions}`,
      matricesGetters: componentDataAccessMethodDefinitionsForVertexShader + morphedPositionGetter,
      opticalDefinition: wgslChunks.opticalDefinition,
      shadowDefinition: wgslChunks.shadow,
      pbrDefinition: wgslChunks.pbrDefinition,
      iblDefinition: wgslChunks.iblDefinition,
      alphaProcess: wgslChunks.alphaProcess,
      // The bone decoding is shared with the skinning compute shader (WebGpuVertexDeformer).
      processGeometry: `#ifdef RN_IS_SKINNING\n${wgslChunks.boneDecode}\n#endif\n${wgslChunks.processGeometry}`,
      Config: engine.config,
    }
  );

  const pixelShaderityObject = ShaderityUtilityWebGPU.fillTemplate(
    engine,
    materialNode.pixelShaderityObject!,
    primitive,
    {
      WellKnownComponentTIDs,
      vertexOutput: wgslChunks.vertexOutput,
      prerequisites: wgslChunks.prerequisites,
      mainPrerequisites: wgslChunks.mainPrerequisites,
      getters: pixelPropertiesStr,
      definitions: `// RN_IS_PIXEL_SHADER\n#define RN_IS_PIXEL_SHADER\n${definitions}${alphaMode}`,
      matricesGetters: componentDataAccessMethodDefinitionsForPixelShader,
      opticalDefinition: wgslChunks.opticalDefinition,
      shadowDefinition: wgslChunks.shadow,
      pbrDefinition: wgslChunks.pbrDefinition,
      iblDefinition: wgslChunks.iblDefinition,
      alphaProcess: wgslChunks.alphaProcess,
      outputSrgb: wgslChunks.outputSrgb,
      wireframe: wgslChunks.wireframe,
      Config: engine.config,
    }
  );

  const preprocessedVertex = Shaderity.processPragma(vertexShaderityObject, false);
  const preprocessedPixel = Shaderity.processPragma(pixelShaderityObject, false);

  const cgApiResourceRepository = engine.cgApiResourceRepository;
  shaderProgramUid = cgApiResourceRepository.createShaderProgram({
    config: engine.config,
    engine,
    material,
    primitive,
    vertexShaderStr: preprocessedVertex.code,
    fragmentShaderStr: preprocessedPixel.code,
    attributeNames: [],
    attributeSemantics: [],
  });
  shaderCache.set(cacheQuery, shaderProgramUid);
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
      if (accessor!.normalized) {
        // A normalized integer attribute is bound with a unorm/snorm WebGPU vertex format,
        // so the shader receives floats in the [0, 1] / [-1, 1] range.
        vertexAttributeDefines += '#define RN_USE_COLOR_0_FLOAT\n';
      } else if (accessor!.componentType.isFloatingPoint()) {
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
