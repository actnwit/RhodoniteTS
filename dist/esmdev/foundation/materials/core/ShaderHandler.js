// src/foundation/materials/core/ShaderHandler.ts
import ShaderityModule from "../../../_deps/shaderity.js";
import { WellKnownComponentTIDs } from "../../components/WellKnownComponentTIDs.js";
import { Component } from "../../core/Component.js";
import { ProcessApproach } from "../../definitions/ProcessApproach.js";
import { Is } from "../../misc/Is.js";
import { ModuleManager } from "../../system/ModuleManager.js";
import { ShaderityUtilityWebGL } from "./ShaderityUtilityWebGL.js";
import { ShaderityUtilityWebGPU } from "./ShaderityUtilityWebGPU.js";
var Shaderity = ShaderityModule.default || ShaderityModule;
function __getGlslCommonChunks() {
  const webglModule = ModuleManager.getInstance().getModule("webgl");
  if (webglModule == null) {
    throw new Error("The WebGL module is not loaded. Initialize the engine with ProcessApproach.WebGL2 first.");
  }
  return webglModule.glslCommonChunks;
}
function __getWgslCommonChunks() {
  const webgpuModule = ModuleManager.getInstance().getModule("webgpu");
  if (webgpuModule == null) {
    throw new Error("The WebGPU module is not loaded. Initialize the engine with ProcessApproach.WebGPU first.");
  }
  return webgpuModule.wgslCommonChunks;
}
var ShaderHandler = class {
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
  static _createShaderProgramWithCache(engine, material, primitive, vertexShader, pixelShader, attributeNames, attributeSemantics, onError) {
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
      attributeNames,
      attributeSemantics,
      onError
    });
    shaderCache.set(wholeShaderText, shaderProgramUid);
    return [shaderProgramUid, true];
  }
};
function __removeCommentsFromShader(shader) {
  return shader.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "");
}
function _createProgramAsSingleOperationByUpdatedSources(engine, material, primitive, materialNode, updatedShaderSources, onError) {
  const { attributeNames, attributeSemantics } = _getAttributeInfo(materialNode.vertexShaderityObject);
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
function _getAttributeInfo(shaderityObject) {
  const reflection = ShaderityUtilityWebGL.getAttributeReflection(shaderityObject);
  const attributeNames = reflection.names;
  const attributeSemantics = reflection.semantics;
  return { attributeNames, attributeSemantics };
}
function _outputVertexAttributeBindingInfo(attributeNames, attributeSemantics) {
  let vertexAttributesBinding = "\n// Vertex Attributes Binding Info\n";
  for (let i = 0; i < attributeNames.length; i++) {
    vertexAttributesBinding += `// ${attributeNames[i]}: ${attributeSemantics[i].str} 
`;
  }
  return vertexAttributesBinding;
}
function _createProgramAsSingleOperationWebGL(engine, material, componentDataAccessMethodDefinitionsForVertexShader, componentDataAccessMethodDefinitionsForPixelShader, propertySetterOfGlobalDataRepository, propertySetterOfMaterial, morphedPositionGetter, primitive) {
  const vertexAttributeDefines = defineAttributes(primitive);
  const materialNode = material._materialContent;
  let definitions = materialNode.getDefinitions();
  const shaderDefines = material.getShaderDefines();
  for (const shaderDefine of shaderDefines) {
    definitions += `#define ${shaderDefine}
`;
  }
  definitions += vertexAttributeDefines;
  let alphaMode = "";
  if (material.isBlend()) {
    alphaMode += "#define RN_IS_ALPHA_MODE_BLEND\n";
  }
  if (material.isMask()) {
    alphaMode += "#define RN_IS_ALPHA_MODE_MASK\n";
  }
  const webglResourceRepository = engine.webglResourceRepository;
  const webXRSystem = engine._webXRSystemIfEnabled;
  const isMultiViewVRRendering = Is.exist(webXRSystem) && (webXRSystem == null ? void 0 : webXRSystem.isWebXRMode) && webglResourceRepository.isSupportMultiViewVRRendering(engine);
  const cacheQuery = Component.getStateVersion(engine) + engine.materialRepository._getBufferViewVersion(material.__materialTypeName) + material.__materialTypeName + material._materialContent.getMaterialSemanticsVariantName() + vertexAttributeDefines + material._getFingerPrint() + definitions + morphedPositionGetter + componentDataAccessMethodDefinitionsForVertexShader + componentDataAccessMethodDefinitionsForPixelShader + morphedPositionGetter + alphaMode + (isMultiViewVRRendering ? "WEBGL2_MULTI_VIEW" : "");
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
  let vertexShader = _setupGlobalShaderDefinitionWebGL(engine, material.__materialTypeName, primitive);
  vertexShader += "#define RN_IS_VERTEX_SHADER\n";
  let pixelShader = _setupGlobalShaderDefinitionWebGL(engine, material.__materialTypeName, primitive);
  pixelShader += "#define RN_IS_PIXEL_SHADER\n";
  const glslChunks = __getGlslCommonChunks();
  const vertexShaderityObject = ShaderityUtilityWebGL.fillTemplate(
    engine,
    materialNode.vertexShaderityObject,
    primitive,
    {
      enableVertexExtensions: glslChunks.enableVertexExtensions,
      glslPrecision: glslChunks.glslPrecision,
      vertexInOut: glslChunks.vertexInOut,
      fullscreen: glslChunks.fullscreen,
      WellKnownComponentTIDs,
      getters: vertexPropertiesStr,
      definitions,
      prerequisites: glslChunks.prerequisites,
      mainPrerequisites: glslChunks.mainPrerequisites,
      matricesGetters: componentDataAccessMethodDefinitionsForVertexShader + morphedPositionGetter,
      opticalDefinition: glslChunks.opticalDefinition,
      shadowDefinition: glslChunks.shadow,
      pbrDefinition: glslChunks.pbrDefinition,
      iblDefinition: glslChunks.iblDefinition,
      alphaProcess: glslChunks.alphaProcess,
      processGeometry: glslChunks.processGeometry,
      Config: engine.config
    }
  );
  const pixelShaderityObject = ShaderityUtilityWebGL.fillTemplate(
    engine,
    materialNode.pixelShaderityObject,
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
      Config: engine.config
    }
  );
  vertexShader += vertexShaderityObject.code.replace(/#version\s+(100|300\s+es)/, "");
  pixelShader += pixelShaderityObject.code.replace(/#version\s+(100|300\s+es)/, "");
  const { attributeNames, attributeSemantics } = _getAttributeInfo(vertexShaderityObject);
  const vertexAttributesBinding = _outputVertexAttributeBindingInfo(attributeNames, attributeSemantics);
  vertexShader += vertexAttributesBinding;
  const preprocessedVertex = Shaderity.processPragma(
    {
      code: vertexShader,
      shaderStage: "vertex",
      isFragmentShader: false
    },
    true
  );
  const preprocessedPixel = Shaderity.processPragma(
    {
      code: pixelShader,
      shaderStage: "fragment",
      isFragmentShader: true
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
    attributeNames,
    attributeSemantics
  });
  shaderCache.set(cacheQuery, shaderProgramUid);
  return [shaderProgramUid, true];
}
function _setupGlobalShaderDefinitionWebGL(engine, materialTypeName, _primitive) {
  let definitions = "";
  const webglResourceRepository = engine.webglResourceRepository;
  const glw = webglResourceRepository.currentWebGLContextWrapper;
  if (glw.isWebGL2) {
    definitions += "#version 300 es\n#define GLSL_ES3\n";
    if (engine.config.isUboEnabled) {
      definitions += "#define RN_IS_UBO_ENABLED\n";
    }
  }
  definitions += `// RN_MATERIAL_TYPE_NAME: ${materialTypeName}
`;
  if (ProcessApproach.isWebGL2Approach(engine.engineState.currentProcessApproach)) {
    definitions += "#define RN_IS_WEBGL2_MODE\n";
    if (engine.config.isMultiDrawEnabled && webglResourceRepository.isInstanceSidTextureCapable) {
      definitions += "#define RN_USE_INSTANCE_SID_TEXTURE\n";
      definitions += "#define RN_USE_MATERIAL_SID_ATTRIBUTE\n";
    }
  }
  const webXRSystem = engine._webXRSystemIfEnabled;
  if (Is.exist(webXRSystem) && (webXRSystem == null ? void 0 : webXRSystem.isWebXRMode) && webglResourceRepository.isSupportMultiViewVRRendering(engine)) {
    definitions += "#define WEBGL2_MULTI_VIEW\n";
  }
  if (glw.isWebGL2 || glw.webgl1ExtDRV) {
    definitions += "#define RN_IS_SUPPORTING_STANDARD_DERIVATIVES\n";
  }
  return definitions;
}
function _createProgramAsSingleOperationWebGpu(engine, material, primitive, componentDataAccessMethodDefinitionsForVertexShader, componentDataAccessMethodDefinitionsForPixelShader, propertySetterOfGlobalDataRepository, propertySetterOfMaterial, morphedPositionGetter) {
  const vertexAttributeDefines = defineAttributes(primitive);
  const materialNode = material._materialContent;
  let definitions = `// Material Type: ${material.materialTypeName}
`;
  definitions += materialNode.getDefinitions();
  const shaderDefines = material.getShaderDefines();
  for (const shaderDefine of shaderDefines) {
    definitions += `#define ${shaderDefine}
`;
  }
  definitions += vertexAttributeDefines;
  let alphaMode = "";
  if (material.isBlend()) {
    alphaMode += "#define RN_IS_ALPHA_MODE_BLEND\n";
  }
  if (material.isMask()) {
    alphaMode += "#define RN_IS_ALPHA_MODE_MASK\n";
  }
  const cacheQuery = Component.getStateVersion(engine) + engine.materialRepository._getBufferViewVersion(material.__materialTypeName) + material.__materialTypeName + material._materialContent.getMaterialSemanticsVariantName() + vertexAttributeDefines + material._getFingerPrint() + definitions + componentDataAccessMethodDefinitionsForVertexShader + componentDataAccessMethodDefinitionsForPixelShader + morphedPositionGetter + alphaMode;
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
    materialNode.vertexShaderityObject,
    primitive,
    {
      WellKnownComponentTIDs,
      vertexInput: wgslChunks.vertexInput,
      vertexOutput: wgslChunks.vertexOutput,
      prerequisites: wgslChunks.prerequisites,
      mainPrerequisites: wgslChunks.mainPrerequisites,
      fullscreen: wgslChunks.fullscreen,
      getters: vertexPropertiesStr,
      definitions: `// RN_IS_VERTEX_SHADER
#define RN_IS_VERTEX_SHADER
${definitions}`,
      matricesGetters: componentDataAccessMethodDefinitionsForVertexShader + morphedPositionGetter,
      opticalDefinition: wgslChunks.opticalDefinition,
      shadowDefinition: wgslChunks.shadow,
      pbrDefinition: wgslChunks.pbrDefinition,
      iblDefinition: wgslChunks.iblDefinition,
      alphaProcess: wgslChunks.alphaProcess,
      // The bone decoding is shared with the skinning compute shader (WebGpuVertexDeformer).
      processGeometry: `#ifdef RN_IS_SKINNING
${wgslChunks.boneDecode}
#endif
${wgslChunks.processGeometry}`,
      Config: engine.config
    }
  );
  const pixelShaderityObject = ShaderityUtilityWebGPU.fillTemplate(
    engine,
    materialNode.pixelShaderityObject,
    primitive,
    {
      WellKnownComponentTIDs,
      vertexOutput: wgslChunks.vertexOutput,
      prerequisites: wgslChunks.prerequisites,
      mainPrerequisites: wgslChunks.mainPrerequisites,
      getters: pixelPropertiesStr,
      definitions: `// RN_IS_PIXEL_SHADER
#define RN_IS_PIXEL_SHADER
${definitions}${alphaMode}`,
      matricesGetters: componentDataAccessMethodDefinitionsForPixelShader,
      opticalDefinition: wgslChunks.opticalDefinition,
      shadowDefinition: wgslChunks.shadow,
      pbrDefinition: wgslChunks.pbrDefinition,
      iblDefinition: wgslChunks.iblDefinition,
      alphaProcess: wgslChunks.alphaProcess,
      outputSrgb: wgslChunks.outputSrgb,
      wireframe: wgslChunks.wireframe,
      Config: engine.config
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
    attributeSemantics: []
  });
  shaderCache.set(cacheQuery, shaderProgramUid);
  return shaderProgramUid;
}
function defineAttributes(primitive) {
  let vertexAttributeDefines = "";
  const attributeSemantics = primitive.attributeSemantics;
  for (const attributeSemantic of attributeSemantics) {
    if (attributeSemantic.indexOf("POSITION") !== -1) {
      vertexAttributeDefines += "#define RN_USE_POSITION\n";
      const accessor = primitive.getAttribute(attributeSemantic);
      if (accessor.componentType.isFloatingPoint()) {
        vertexAttributeDefines += "#define RN_USE_POSITION_FLOAT\n";
      } else if (accessor.componentType.isInteger()) {
        vertexAttributeDefines += "#define RN_USE_POSITION_INT\n";
      } else {
        vertexAttributeDefines += "#define RN_USE_POSITION_UINT\n";
      }
    }
    if (attributeSemantic.indexOf("NORMAL") !== -1) {
      vertexAttributeDefines += "#define RN_USE_NORMAL\n";
    }
    if (attributeSemantic.indexOf("TANGENT") !== -1) {
      vertexAttributeDefines += "#define RN_USE_TANGENT\n";
    }
    if (attributeSemantic.indexOf("TEXCOORD_0") !== -1) {
      vertexAttributeDefines += "#define RN_USE_TEXCOORD_0\n";
    }
    if (attributeSemantic.indexOf("TEXCOORD_1") !== -1) {
      vertexAttributeDefines += "#define RN_USE_TEXCOORD_1\n";
    }
    if (attributeSemantic.indexOf("COLOR_0") !== -1) {
      vertexAttributeDefines += "#define RN_USE_COLOR_0\n";
      const accessor = primitive.getAttribute(attributeSemantic);
      if (accessor.normalized) {
        vertexAttributeDefines += "#define RN_USE_COLOR_0_FLOAT\n";
      } else if (accessor.componentType.isFloatingPoint()) {
        vertexAttributeDefines += "#define RN_USE_COLOR_0_FLOAT\n";
      } else if (accessor.componentType.isInteger()) {
        vertexAttributeDefines += "#define RN_USE_COLOR_0_INT\n";
      } else {
        vertexAttributeDefines += "#define RN_USE_COLOR_0_UINT\n";
      }
    }
    if (attributeSemantic.indexOf("JOINTS_0") !== -1) {
      vertexAttributeDefines += "#define RN_USE_JOINTS_0\n";
    }
    if (attributeSemantic.indexOf("WEIGHTS_0") !== -1) {
      vertexAttributeDefines += "#define RN_USE_WEIGHTS_0\n";
    }
    if (attributeSemantic.indexOf("FACE_NORMAL") !== -1) {
      vertexAttributeDefines += "#define RN_USE_FACE_NORMAL\n";
    }
    if (attributeSemantic.indexOf("BARY_CENTRIC_COORD") !== -1) {
      vertexAttributeDefines += "#define RN_USE_BARY_CENTRIC_COORD\n";
    }
    if (attributeSemantic.indexOf("TEXCOORD_2") !== -1) {
      vertexAttributeDefines += "#define RN_USE_TEXCOORD_2\n";
    }
  }
  if (primitive.targets != null && primitive.targets.length > 0) {
    vertexAttributeDefines += "#define RN_IS_MORPHING\n";
  }
  vertexAttributeDefines += "#define RN_USE_INSTANCE\n";
  return vertexAttributeDefines;
}
export {
  ShaderHandler,
  _createProgramAsSingleOperationByUpdatedSources,
  _createProgramAsSingleOperationWebGL,
  _createProgramAsSingleOperationWebGpu,
  _getAttributeInfo,
  _outputVertexAttributeBindingInfo,
  _setupGlobalShaderDefinitionWebGL
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0ZXJpYWxzL2NvcmUvU2hhZGVySGFuZGxlci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IFNoYWRlcml0eU1vZHVsZSwgeyB0eXBlIFNoYWRlcml0eU9iamVjdCB9IGZyb20gJ3NoYWRlcml0eSc7XG5pbXBvcnQgdHlwZSB7IENHQVBJUmVzb3VyY2VIYW5kbGUgfSBmcm9tICcuLi8uLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgdHlwZSB7IFJuV2ViR0wgfSBmcm9tICcuLi8uLi8uLi93ZWJnbC9tYWluJztcbmltcG9ydCB0eXBlIHsgR2xzbENvbW1vbkNodW5rcyB9IGZyb20gJy4uLy4uLy4uL3dlYmdsL3NoYWRlcnMvZ2xzbENvbW1vbkNodW5rcyc7XG5pbXBvcnQgdHlwZSB7IEF0dHJpYnV0ZU5hbWVzIH0gZnJvbSAnLi4vLi4vLi4vd2ViZ2wvdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBXZWJHTENvbnRleHRXcmFwcGVyIH0gZnJvbSAnLi4vLi4vLi4vd2ViZ2wvV2ViR0xDb250ZXh0V3JhcHBlcic7XG5pbXBvcnQgdHlwZSB7IFNoYWRlclNvdXJjZXMgfSBmcm9tICcuLi8uLi8uLi93ZWJnbC9XZWJHTFN0cmF0ZWd5JztcbmltcG9ydCB0eXBlIHsgUm5XZWJHcHUgfSBmcm9tICcuLi8uLi8uLi93ZWJncHUvbWFpbic7XG5pbXBvcnQgdHlwZSB7IFdnc2xDb21tb25DaHVua3MgfSBmcm9tICcuLi8uLi8uLi93ZWJncHUvd2dzbENvbW1vbkNodW5rcyc7XG5pbXBvcnQgeyBXZWxsS25vd25Db21wb25lbnRUSURzIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9XZWxsS25vd25Db21wb25lbnRUSURzJztcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvcmUvQ29tcG9uZW50JztcbmltcG9ydCB7IFByb2Nlc3NBcHByb2FjaCB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1Byb2Nlc3NBcHByb2FjaCc7XG5pbXBvcnQgdHlwZSB7XG4gIGdldFNoYWRlclByb3BlcnR5RnVuY09mR2xvYmFsRGF0YVJlcG9zaXRvcnksXG4gIGdldFNoYWRlclByb3BlcnR5RnVuY09mTWF0ZXJpYWwsXG59IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1NoYWRlclNlbWFudGljcyc7XG5pbXBvcnQgdHlwZSB7IFZlcnRleEF0dHJpYnV0ZUVudW0gfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9WZXJ0ZXhBdHRyaWJ1dGUnO1xuaW1wb3J0IHR5cGUgeyBQcmltaXRpdmUgfSBmcm9tICcuLi8uLi9nZW9tZXRyeS9QcmltaXRpdmUnO1xuaW1wb3J0IHsgSXMgfSBmcm9tICcuLi8uLi9taXNjL0lzJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgeyBNb2R1bGVNYW5hZ2VyIH0gZnJvbSAnLi4vLi4vc3lzdGVtL01vZHVsZU1hbmFnZXInO1xuaW1wb3J0IHR5cGUgeyBBYnN0cmFjdE1hdGVyaWFsQ29udGVudCB9IGZyb20gJy4vQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQnO1xuaW1wb3J0IHR5cGUgeyBNYXRlcmlhbCB9IGZyb20gJy4vTWF0ZXJpYWwnO1xuaW1wb3J0IHsgU2hhZGVyaXR5VXRpbGl0eVdlYkdMIH0gZnJvbSAnLi9TaGFkZXJpdHlVdGlsaXR5V2ViR0wnO1xuaW1wb3J0IHsgU2hhZGVyaXR5VXRpbGl0eVdlYkdQVSB9IGZyb20gJy4vU2hhZGVyaXR5VXRpbGl0eVdlYkdQVSc7XG5cbmNvbnN0IFNoYWRlcml0eSA9IChTaGFkZXJpdHlNb2R1bGUgYXMgYW55KS5kZWZhdWx0IHx8IFNoYWRlcml0eU1vZHVsZTtcblxuLyoqXG4gKiBUaGUgY29tbW9uIEdMU0wgY2h1bmtzIGNvbWUgd2l0aCB0aGUgV2ViR0wgbW9kdWxlIChsb2FkZWQgYnkgRW5naW5lLmluaXQgZm9yIFByb2Nlc3NBcHByb2FjaC5XZWJHTDIpLFxuICogc28gdGhhdCBXZWJHUFUgYXBwbGljYXRpb25zIGRvIG5vdCBidW5kbGUgdGhlbS5cbiAqL1xuZnVuY3Rpb24gX19nZXRHbHNsQ29tbW9uQ2h1bmtzKCk6IEdsc2xDb21tb25DaHVua3Mge1xuICBjb25zdCB3ZWJnbE1vZHVsZSA9IE1vZHVsZU1hbmFnZXIuZ2V0SW5zdGFuY2UoKS5nZXRNb2R1bGUoJ3dlYmdsJykgYXMgUm5XZWJHTCB8IHVuZGVmaW5lZDtcbiAgaWYgKHdlYmdsTW9kdWxlID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBXZWJHTCBtb2R1bGUgaXMgbm90IGxvYWRlZC4gSW5pdGlhbGl6ZSB0aGUgZW5naW5lIHdpdGggUHJvY2Vzc0FwcHJvYWNoLldlYkdMMiBmaXJzdC4nKTtcbiAgfVxuICByZXR1cm4gd2ViZ2xNb2R1bGUuZ2xzbENvbW1vbkNodW5rcztcbn1cblxuLyoqXG4gKiBUaGUgY29tbW9uIFdHU0wgY2h1bmtzIGNvbWUgd2l0aCB0aGUgV2ViR1BVIG1vZHVsZSAobG9hZGVkIGJ5IEVuZ2luZS5pbml0IGZvciBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSxcbiAqIHNvIHRoYXQgV2ViR0wgYXBwbGljYXRpb25zIGRvIG5vdCBidW5kbGUgdGhlbS5cbiAqL1xuZnVuY3Rpb24gX19nZXRXZ3NsQ29tbW9uQ2h1bmtzKCk6IFdnc2xDb21tb25DaHVua3Mge1xuICBjb25zdCB3ZWJncHVNb2R1bGUgPSBNb2R1bGVNYW5hZ2VyLmdldEluc3RhbmNlKCkuZ2V0TW9kdWxlKCd3ZWJncHUnKSBhcyBSbldlYkdwdSB8IHVuZGVmaW5lZDtcbiAgaWYgKHdlYmdwdU1vZHVsZSA9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgV2ViR1BVIG1vZHVsZSBpcyBub3QgbG9hZGVkLiBJbml0aWFsaXplIHRoZSBlbmdpbmUgd2l0aCBQcm9jZXNzQXBwcm9hY2guV2ViR1BVIGZpcnN0LicpO1xuICB9XG4gIHJldHVybiB3ZWJncHVNb2R1bGUud2dzbENvbW1vbkNodW5rcztcbn1cblxuLyoqXG4gKiBIYW5kbGVzIHNoYWRlciBwcm9ncmFtIGNyZWF0aW9uLCBjYWNoaW5nLCBhbmQgbWFuYWdlbWVudCBmb3IgdGhlIHJlbmRlcmluZyBzeXN0ZW0uXG4gKiBQcm92aWRlcyB1dGlsaXRpZXMgZm9yIGNyZWF0aW5nIHNoYWRlciBwcm9ncmFtcyB3aXRoIFdlYkdMIGFuZCBXZWJHUFUgYmFja2VuZHMuXG4gKlxuICogQHJlbWFya3NcbiAqIFNoYWRlciBwcm9ncmFtIGNhY2hpbmcgaXMgbWFuYWdlZCBwZXItRW5naW5lIGluc3RhbmNlIHRvIHByZXZlbnQgY3Jvc3MtY29udGFtaW5hdGlvblxuICogYmV0d2VlbiBkaWZmZXJlbnQgV2ViR0wgY29udGV4dHMuIFdoZW4gYW4gRW5naW5lIGlzIGRlc3Ryb3llZCwgaXRzIHNoYWRlciBjYWNoZVxuICogaXMgYXV0b21hdGljYWxseSBjbGVhbmVkIHVwLlxuICovXG5leHBvcnQgY2xhc3MgU2hhZGVySGFuZGxlciB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgc2hhZGVyIHByb2dyYW0gb3IgcmV0cmlldmVzIGl0IGZyb20gY2FjaGUgaWYgYWxyZWFkeSBjb21waWxlZC5cbiAgICogVGhpcyBtZXRob2QgaW1wbGVtZW50cyBzaGFkZXIgcHJvZ3JhbSBjYWNoaW5nIHRvIGF2b2lkIHJlZHVuZGFudCBjb21waWxhdGlvblxuICAgKiBvZiBpZGVudGljYWwgc2hhZGVyIGNvbWJpbmF0aW9ucy4gVGhlIGNhY2hlIGlzIHN0b3JlZCBwZXItRW5naW5lIGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZSB0aGF0IG93bnMgdGhlIHNoYWRlciBjYWNoZVxuICAgKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgdGhhdCB3aWxsIHVzZSB0aGlzIHNoYWRlciBwcm9ncmFtXG4gICAqIEBwYXJhbSBwcmltaXRpdmUgLSBUaGUgZ2VvbWV0cmljIHByaW1pdGl2ZSB0aGF0IGRlZmluZXMgdmVydGV4IGF0dHJpYnV0ZXNcbiAgICogQHBhcmFtIHZlcnRleFNoYWRlciAtIFRoZSB2ZXJ0ZXggc2hhZGVyIHNvdXJjZSBjb2RlXG4gICAqIEBwYXJhbSBwaXhlbFNoYWRlciAtIFRoZSBmcmFnbWVudC9waXhlbCBzaGFkZXIgc291cmNlIGNvZGVcbiAgICogQHBhcmFtIGF0dHJpYnV0ZU5hbWVzIC0gQXJyYXkgb2YgdmVydGV4IGF0dHJpYnV0ZSBuYW1lc1xuICAgKiBAcGFyYW0gYXR0cmlidXRlU2VtYW50aWNzIC0gQXJyYXkgb2YgdmVydGV4IGF0dHJpYnV0ZSBzZW1hbnRpYyBtZWFuaW5nc1xuICAgKiBAcGFyYW0gb25FcnJvciAtIE9wdGlvbmFsIGVycm9yIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAqIEByZXR1cm5zIEEgdHVwbGUgY29udGFpbmluZyB0aGUgc2hhZGVyIHByb2dyYW0gaGFuZGxlIGFuZCBhIGJvb2xlYW4gaW5kaWNhdGluZyBpZiBpdCdzIG5ld2x5IGNyZWF0ZWRcbiAgICovXG4gIHN0YXRpYyBfY3JlYXRlU2hhZGVyUHJvZ3JhbVdpdGhDYWNoZShcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBtYXRlcmlhbDogTWF0ZXJpYWwsXG4gICAgcHJpbWl0aXZlOiBQcmltaXRpdmUsXG4gICAgdmVydGV4U2hhZGVyOiBzdHJpbmcsXG4gICAgcGl4ZWxTaGFkZXI6IHN0cmluZyxcbiAgICBhdHRyaWJ1dGVOYW1lczogQXR0cmlidXRlTmFtZXMsXG4gICAgYXR0cmlidXRlU2VtYW50aWNzOiBWZXJ0ZXhBdHRyaWJ1dGVFbnVtW10sXG4gICAgb25FcnJvcj86IChtZXNzYWdlOiBzdHJpbmcpID0+IHZvaWRcbiAgKTogW0NHQVBJUmVzb3VyY2VIYW5kbGUsIGJvb2xlYW5dIHtcbiAgICAvLyBVc2UgdGhlIGVuZ2luZSdzIHNoYWRlciBwcm9ncmFtIGNhY2hlXG4gICAgY29uc3Qgc2hhZGVyQ2FjaGUgPSBlbmdpbmUuc2hhZGVyUHJvZ3JhbUNhY2hlO1xuICAgIGNvbnN0IHdob2xlU2hhZGVyVGV4dCA9IF9fcmVtb3ZlQ29tbWVudHNGcm9tU2hhZGVyKHZlcnRleFNoYWRlciArIHBpeGVsU2hhZGVyKTtcbiAgICBsZXQgc2hhZGVyUHJvZ3JhbVVpZCA9IHNoYWRlckNhY2hlLmdldCh3aG9sZVNoYWRlclRleHQpO1xuICAgIGlmIChzaGFkZXJQcm9ncmFtVWlkICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBbc2hhZGVyUHJvZ3JhbVVpZCwgZmFsc2VdO1xuICAgIH1cblxuICAgIGNvbnN0IGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5ID0gZW5naW5lLmNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIHNoYWRlclByb2dyYW1VaWQgPSBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeS5jcmVhdGVTaGFkZXJQcm9ncmFtKHtcbiAgICAgIGNvbmZpZzogZW5naW5lLmNvbmZpZyxcbiAgICAgIGVuZ2luZSxcbiAgICAgIG1hdGVyaWFsLFxuICAgICAgcHJpbWl0aXZlLFxuICAgICAgdmVydGV4U2hhZGVyU3RyOiB2ZXJ0ZXhTaGFkZXIsXG4gICAgICBmcmFnbWVudFNoYWRlclN0cjogcGl4ZWxTaGFkZXIsXG4gICAgICBhdHRyaWJ1dGVOYW1lczogYXR0cmlidXRlTmFtZXMsXG4gICAgICBhdHRyaWJ1dGVTZW1hbnRpY3M6IGF0dHJpYnV0ZVNlbWFudGljcyxcbiAgICAgIG9uRXJyb3IsXG4gICAgfSk7XG4gICAgc2hhZGVyQ2FjaGUuc2V0KHdob2xlU2hhZGVyVGV4dCwgc2hhZGVyUHJvZ3JhbVVpZCk7XG4gICAgcmV0dXJuIFtzaGFkZXJQcm9ncmFtVWlkLCB0cnVlXTtcbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZXMgY29tbWVudHMgZnJvbSBzaGFkZXIgc291cmNlIGNvZGUgdG8gbm9ybWFsaXplIGl0IGZvciBjYWNoaW5nIHB1cnBvc2VzLlxuICogVGhpcyBlbnN1cmVzIHRoYXQgZnVuY3Rpb25hbGx5IGlkZW50aWNhbCBzaGFkZXJzIHdpdGggZGlmZmVyZW50IGNvbW1lbnRzXG4gKiBhcmUgcHJvcGVybHkgY2FjaGVkIHRvZ2V0aGVyLlxuICpcbiAqIEBwYXJhbSBzaGFkZXIgLSBUaGUgc2hhZGVyIHNvdXJjZSBjb2RlIHRvIHByb2Nlc3NcbiAqIEByZXR1cm5zIFRoZSBzaGFkZXIgc291cmNlIGNvZGUgd2l0aCBjb21tZW50cyByZW1vdmVkXG4gKi9cbmZ1bmN0aW9uIF9fcmVtb3ZlQ29tbWVudHNGcm9tU2hhZGVyKHNoYWRlcjogc3RyaW5nKSB7XG4gIHJldHVybiBzaGFkZXIucmVwbGFjZSgvXFwvXFwvLip8XFwvXFwqW1xcc1xcU10qP1xcKlxcLy9nLCAnJyk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHNoYWRlciBwcm9ncmFtIHVzaW5nIHByZS1wcm9jZXNzZWQgc2hhZGVyIHNvdXJjZXMuXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgd2hlbiBzaGFkZXIgc291cmNlcyBoYXZlIGFscmVhZHkgYmVlbiB1cGRhdGVkXG4gKiBhbmQgcHJvY2Vzc2VkIHRocm91Z2ggdGhlIHNoYWRlciBjb21waWxhdGlvbiBwaXBlbGluZS5cbiAqXG4gKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIHRoYXQgd2lsbCB1c2UgdGhpcyBzaGFkZXIgcHJvZ3JhbVxuICogQHBhcmFtIHByaW1pdGl2ZSAtIFRoZSBnZW9tZXRyaWMgcHJpbWl0aXZlIHRoYXQgZGVmaW5lcyB2ZXJ0ZXggYXR0cmlidXRlc1xuICogQHBhcmFtIG1hdGVyaWFsTm9kZSAtIFRoZSBtYXRlcmlhbCBjb250ZW50IG5vZGUgY29udGFpbmluZyBzaGFkZXIgb2JqZWN0c1xuICogQHBhcmFtIHVwZGF0ZWRTaGFkZXJTb3VyY2VzIC0gUHJlLXByb2Nlc3NlZCB2ZXJ0ZXggYW5kIGZyYWdtZW50IHNoYWRlciBzb3VyY2VzXG4gKiBAcGFyYW0gb25FcnJvciAtIE9wdGlvbmFsIGVycm9yIGNhbGxiYWNrIGZ1bmN0aW9uXG4gKiBAcmV0dXJucyBBIHR1cGxlIGNvbnRhaW5pbmcgdGhlIHNoYWRlciBwcm9ncmFtIGhhbmRsZSBhbmQgYSBib29sZWFuIGluZGljYXRpbmcgaWYgaXQncyBuZXdseSBjcmVhdGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfY3JlYXRlUHJvZ3JhbUFzU2luZ2xlT3BlcmF0aW9uQnlVcGRhdGVkU291cmNlcyhcbiAgZW5naW5lOiBFbmdpbmUsXG4gIG1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgcHJpbWl0aXZlOiBQcmltaXRpdmUsXG4gIG1hdGVyaWFsTm9kZTogQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQsXG4gIHVwZGF0ZWRTaGFkZXJTb3VyY2VzOiBTaGFkZXJTb3VyY2VzLFxuICBvbkVycm9yPzogKG1lc3NhZ2U6IHN0cmluZykgPT4gdm9pZFxuKTogW0NHQVBJUmVzb3VyY2VIYW5kbGUsIGJvb2xlYW5dIHtcbiAgY29uc3QgeyBhdHRyaWJ1dGVOYW1lcywgYXR0cmlidXRlU2VtYW50aWNzIH0gPSBfZ2V0QXR0cmlidXRlSW5mbyhtYXRlcmlhbE5vZGUudmVydGV4U2hhZGVyaXR5T2JqZWN0ISk7XG5cbiAgY29uc3QgW3NoYWRlclByb2dyYW1VaWQsIG5ld09uZV0gPSBTaGFkZXJIYW5kbGVyLl9jcmVhdGVTaGFkZXJQcm9ncmFtV2l0aENhY2hlKFxuICAgIGVuZ2luZSxcbiAgICBtYXRlcmlhbCxcbiAgICBwcmltaXRpdmUsXG4gICAgdXBkYXRlZFNoYWRlclNvdXJjZXMudmVydGV4LFxuICAgIHVwZGF0ZWRTaGFkZXJTb3VyY2VzLnBpeGVsLFxuICAgIGF0dHJpYnV0ZU5hbWVzLFxuICAgIGF0dHJpYnV0ZVNlbWFudGljcyxcbiAgICBvbkVycm9yXG4gICk7XG5cbiAgcmV0dXJuIFtzaGFkZXJQcm9ncmFtVWlkLCBuZXdPbmVdO1xufVxuXG4vKipcbiAqIEV4dHJhY3RzIHZlcnRleCBhdHRyaWJ1dGUgaW5mb3JtYXRpb24gZnJvbSBhIFNoYWRlcml0eSBvYmplY3QuXG4gKiBUaGlzIGluY2x1ZGVzIGJvdGggYXR0cmlidXRlIG5hbWVzIGFuZCB0aGVpciBzZW1hbnRpYyBtZWFuaW5ncyxcbiAqIHdoaWNoIGFyZSBlc3NlbnRpYWwgZm9yIHByb3BlciB2ZXJ0ZXggYnVmZmVyIGJpbmRpbmcuXG4gKlxuICogQHBhcmFtIHNoYWRlcml0eU9iamVjdCAtIFRoZSBTaGFkZXJpdHkgb2JqZWN0IGNvbnRhaW5pbmcgc2hhZGVyIHJlZmxlY3Rpb24gZGF0YVxuICogQHJldHVybnMgQW4gb2JqZWN0IGNvbnRhaW5pbmcgYXR0cmlidXRlIG5hbWVzIGFuZCB0aGVpciBjb3JyZXNwb25kaW5nIHNlbWFudGljc1xuICovXG5leHBvcnQgZnVuY3Rpb24gX2dldEF0dHJpYnV0ZUluZm8oc2hhZGVyaXR5T2JqZWN0OiBTaGFkZXJpdHlPYmplY3QpIHtcbiAgY29uc3QgcmVmbGVjdGlvbiA9IFNoYWRlcml0eVV0aWxpdHlXZWJHTC5nZXRBdHRyaWJ1dGVSZWZsZWN0aW9uKHNoYWRlcml0eU9iamVjdCk7XG4gIGNvbnN0IGF0dHJpYnV0ZU5hbWVzID0gcmVmbGVjdGlvbi5uYW1lcztcbiAgY29uc3QgYXR0cmlidXRlU2VtYW50aWNzID0gcmVmbGVjdGlvbi5zZW1hbnRpY3M7XG4gIHJldHVybiB7IGF0dHJpYnV0ZU5hbWVzLCBhdHRyaWJ1dGVTZW1hbnRpY3MgfTtcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSBmb3JtYXR0ZWQgc3RyaW5nIGNvbnRhaW5pbmcgdmVydGV4IGF0dHJpYnV0ZSBiaW5kaW5nIGluZm9ybWF0aW9uLlxuICogVGhpcyBpcyBwcmltYXJpbHkgdXNlZCBmb3IgZGVidWdnaW5nIGFuZCBzaGFkZXIgaW5zcGVjdGlvbiBwdXJwb3NlcyxcbiAqIHByb3ZpZGluZyBjbGVhciBtYXBwaW5nIGJldHdlZW4gYXR0cmlidXRlIG5hbWVzIGFuZCB0aGVpciBzZW1hbnRpY3MuXG4gKlxuICogQHBhcmFtIGF0dHJpYnV0ZU5hbWVzIC0gQXJyYXkgb2YgdmVydGV4IGF0dHJpYnV0ZSBuYW1lc1xuICogQHBhcmFtIGF0dHJpYnV0ZVNlbWFudGljcyAtIEFycmF5IG9mIGNvcnJlc3BvbmRpbmcgdmVydGV4IGF0dHJpYnV0ZSBzZW1hbnRpY3NcbiAqIEByZXR1cm5zIEEgZm9ybWF0dGVkIHN0cmluZyB3aXRoIGF0dHJpYnV0ZSBiaW5kaW5nIGluZm9ybWF0aW9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfb3V0cHV0VmVydGV4QXR0cmlidXRlQmluZGluZ0luZm8oYXR0cmlidXRlTmFtZXM6IHN0cmluZ1tdLCBhdHRyaWJ1dGVTZW1hbnRpY3M6IFZlcnRleEF0dHJpYnV0ZUVudW1bXSkge1xuICBsZXQgdmVydGV4QXR0cmlidXRlc0JpbmRpbmcgPSAnXFxuLy8gVmVydGV4IEF0dHJpYnV0ZXMgQmluZGluZyBJbmZvXFxuJztcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRyaWJ1dGVOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgIHZlcnRleEF0dHJpYnV0ZXNCaW5kaW5nICs9IGAvLyAke2F0dHJpYnV0ZU5hbWVzW2ldfTogJHthdHRyaWJ1dGVTZW1hbnRpY3NbaV0uc3RyfSBcXG5gO1xuICB9XG4gIHJldHVybiB2ZXJ0ZXhBdHRyaWJ1dGVzQmluZGluZztcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgY29tcGxldGUgc2hhZGVyIHByb2dyYW0gZm9yIFdlYkdMIHJlbmRlcmluZy5cbiAqIFRoaXMgZnVuY3Rpb24gaGFuZGxlcyB0aGUgZW50aXJlIHNoYWRlciBjb21waWxhdGlvbiBwaXBlbGluZSBpbmNsdWRpbmc6XG4gKiAtIE1hdGVyaWFsIHByb3BlcnR5IGV4dHJhY3Rpb24gYW5kIGVtYmVkZGluZ1xuICogLSBTaGFkZXIgZGVmaW5pdGlvbiBnZW5lcmF0aW9uXG4gKiAtIFRlbXBsYXRlIGZpbGxpbmcgd2l0aCBydW50aW1lIHZhbHVlc1xuICogLSBGaW5hbCBzaGFkZXIgY29tcGlsYXRpb24gYW5kIGxpbmtpbmdcbiAqXG4gKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIGNvbnRhaW5pbmcgc2hhZGVyIHRlbXBsYXRlcyBhbmQgcHJvcGVydGllc1xuICogQHBhcmFtIGNvbXBvbmVudERhdGFBY2Nlc3NNZXRob2REZWZpbml0aW9uc0ZvclZlcnRleFNoYWRlciAtIG1ldGhvZCBkZWZpbml0aW9ucyBmb3IgY29tcG9uZW50IGRhdGEgYWNjZXNzIGZvciB2ZXJ0ZXggc2hhZGVyXG4gKiBAcGFyYW0gY29tcG9uZW50RGF0YUFjY2Vzc01ldGhvZERlZmluaXRpb25zRm9yUGl4ZWxTaGFkZXIgLSBtZXRob2QgZGVmaW5pdGlvbnMgZm9yIGNvbXBvbmVudCBkYXRhIGFjY2VzcyBmb3IgcGl4ZWwgc2hhZGVyXG4gKiBAcGFyYW0gcHJvcGVydHlTZXR0ZXJPZkdsb2JhbERhdGFSZXBvc2l0b3J5IC0gRnVuY3Rpb24gZm9yIHNldHRpbmcgc2hhZGVyIHByb3BlcnRpZXMgb2YgZ2xvYmFsIGRhdGEgcmVwb3NpdG9yeVxuICogQHBhcmFtIHByb3BlcnR5U2V0dGVyT2ZNYXRlcmlhbCAtIEZ1bmN0aW9uIGZvciBzZXR0aW5nIHNoYWRlciBwcm9wZXJ0aWVzIG9mIG1hdGVyaWFsXG4gKiBAcGFyYW0gbW9ycGhlZFBvc2l0aW9uR2V0dGVyIC0gRnVuY3Rpb24gdG8gZ2V0IHRoZSBtb3JwaGVkIHBvc2l0aW9uXG4gKiBAcGFyYW0gcHJpbWl0aXZlIC0gVGhlIGdlb21ldHJpYyBwcmltaXRpdmUgdGhhdCBkZWZpbmVzIHZlcnRleCBhdHRyaWJ1dGVzXG4gKiBAcmV0dXJucyBBIHR1cGxlIGNvbnRhaW5pbmcgdGhlIHNoYWRlciBwcm9ncmFtIGhhbmRsZSBhbmQgYSBib29sZWFuIGluZGljYXRpbmcgaWYgaXQncyBuZXdseSBjcmVhdGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfY3JlYXRlUHJvZ3JhbUFzU2luZ2xlT3BlcmF0aW9uV2ViR0woXG4gIGVuZ2luZTogRW5naW5lLFxuICBtYXRlcmlhbDogTWF0ZXJpYWwsXG4gIGNvbXBvbmVudERhdGFBY2Nlc3NNZXRob2REZWZpbml0aW9uc0ZvclZlcnRleFNoYWRlcjogc3RyaW5nLFxuICBjb21wb25lbnREYXRhQWNjZXNzTWV0aG9kRGVmaW5pdGlvbnNGb3JQaXhlbFNoYWRlcjogc3RyaW5nLFxuICBwcm9wZXJ0eVNldHRlck9mR2xvYmFsRGF0YVJlcG9zaXRvcnk6IGdldFNoYWRlclByb3BlcnR5RnVuY09mR2xvYmFsRGF0YVJlcG9zaXRvcnksXG4gIHByb3BlcnR5U2V0dGVyT2ZNYXRlcmlhbDogZ2V0U2hhZGVyUHJvcGVydHlGdW5jT2ZNYXRlcmlhbCxcbiAgbW9ycGhlZFBvc2l0aW9uR2V0dGVyOiBzdHJpbmcsXG4gIHByaW1pdGl2ZTogUHJpbWl0aXZlXG4pOiBbQ0dBUElSZXNvdXJjZUhhbmRsZSwgYm9vbGVhbl0ge1xuICBjb25zdCB2ZXJ0ZXhBdHRyaWJ1dGVEZWZpbmVzID0gZGVmaW5lQXR0cmlidXRlcyhwcmltaXRpdmUpO1xuICBjb25zdCBtYXRlcmlhbE5vZGUgPSBtYXRlcmlhbC5fbWF0ZXJpYWxDb250ZW50O1xuICBsZXQgZGVmaW5pdGlvbnMgPSBtYXRlcmlhbE5vZGUuZ2V0RGVmaW5pdGlvbnMoKTtcbiAgY29uc3Qgc2hhZGVyRGVmaW5lcyA9IG1hdGVyaWFsLmdldFNoYWRlckRlZmluZXMoKTtcbiAgZm9yIChjb25zdCBzaGFkZXJEZWZpbmUgb2Ygc2hhZGVyRGVmaW5lcykge1xuICAgIGRlZmluaXRpb25zICs9IGAjZGVmaW5lICR7c2hhZGVyRGVmaW5lfVxcbmA7XG4gIH1cbiAgZGVmaW5pdGlvbnMgKz0gdmVydGV4QXR0cmlidXRlRGVmaW5lcztcblxuICBsZXQgYWxwaGFNb2RlID0gJyc7XG4gIGlmIChtYXRlcmlhbC5pc0JsZW5kKCkpIHtcbiAgICBhbHBoYU1vZGUgKz0gJyNkZWZpbmUgUk5fSVNfQUxQSEFfTU9ERV9CTEVORFxcbic7XG4gIH1cbiAgaWYgKG1hdGVyaWFsLmlzTWFzaygpKSB7XG4gICAgYWxwaGFNb2RlICs9ICcjZGVmaW5lIFJOX0lTX0FMUEhBX01PREVfTUFTS1xcbic7XG4gIH1cblxuICAvLyBEZXRlcm1pbmUgaWYgTXVsdGktVmlldyByZW5kZXJpbmcgaXMgZW5hYmxlZCBmb3IgV2ViWFJcbiAgY29uc3Qgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkgPSBlbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnk7XG4gIGNvbnN0IHdlYlhSU3lzdGVtID0gZW5naW5lLl93ZWJYUlN5c3RlbUlmRW5hYmxlZDtcbiAgY29uc3QgaXNNdWx0aVZpZXdWUlJlbmRlcmluZyA9XG4gICAgSXMuZXhpc3Qod2ViWFJTeXN0ZW0pICYmIHdlYlhSU3lzdGVtPy5pc1dlYlhSTW9kZSAmJiB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5pc1N1cHBvcnRNdWx0aVZpZXdWUlJlbmRlcmluZyhlbmdpbmUpO1xuXG4gIGNvbnN0IGNhY2hlUXVlcnkgPVxuICAgIENvbXBvbmVudC5nZXRTdGF0ZVZlcnNpb24oZW5naW5lKSArXG4gICAgZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5fZ2V0QnVmZmVyVmlld1ZlcnNpb24obWF0ZXJpYWwuX19tYXRlcmlhbFR5cGVOYW1lKSArXG4gICAgbWF0ZXJpYWwuX19tYXRlcmlhbFR5cGVOYW1lICtcbiAgICBtYXRlcmlhbC5fbWF0ZXJpYWxDb250ZW50LmdldE1hdGVyaWFsU2VtYW50aWNzVmFyaWFudE5hbWUoKSArXG4gICAgdmVydGV4QXR0cmlidXRlRGVmaW5lcyArXG4gICAgbWF0ZXJpYWwuX2dldEZpbmdlclByaW50KCkgK1xuICAgIGRlZmluaXRpb25zICtcbiAgICBtb3JwaGVkUG9zaXRpb25HZXR0ZXIgK1xuICAgIGNvbXBvbmVudERhdGFBY2Nlc3NNZXRob2REZWZpbml0aW9uc0ZvclZlcnRleFNoYWRlciArXG4gICAgY29tcG9uZW50RGF0YUFjY2Vzc01ldGhvZERlZmluaXRpb25zRm9yUGl4ZWxTaGFkZXIgK1xuICAgIG1vcnBoZWRQb3NpdGlvbkdldHRlciArXG4gICAgYWxwaGFNb2RlICtcbiAgICAoaXNNdWx0aVZpZXdWUlJlbmRlcmluZyA/ICdXRUJHTDJfTVVMVElfVklFVycgOiAnJyk7XG5cbiAgLy8gVXNlIHRoZSBlbmdpbmUncyBzaGFkZXIgcHJvZ3JhbSBjYWNoZVxuICBjb25zdCBzaGFkZXJDYWNoZSA9IGVuZ2luZS5zaGFkZXJQcm9ncmFtQ2FjaGU7XG4gIGxldCBzaGFkZXJQcm9ncmFtVWlkID0gc2hhZGVyQ2FjaGUuZ2V0KGNhY2hlUXVlcnkpO1xuICBpZiAoc2hhZGVyUHJvZ3JhbVVpZCAhPSBudWxsKSB7XG4gICAgcmV0dXJuIFtzaGFkZXJQcm9ncmFtVWlkLCBmYWxzZV07XG4gIH1cblxuICBjb25zdCB7IHZlcnRleFByb3BlcnRpZXNTdHIsIHBpeGVsUHJvcGVydGllc1N0ciB9ID0gbWF0ZXJpYWwuX2dldFByb3BlcnRpZXMoXG4gICAgZW5naW5lLFxuICAgIHByb3BlcnR5U2V0dGVyT2ZHbG9iYWxEYXRhUmVwb3NpdG9yeSxcbiAgICBwcm9wZXJ0eVNldHRlck9mTWF0ZXJpYWxcbiAgKTtcblxuICAvLyBTaGFkZXIgQ29kZSBDb25zdHJ1Y3Rpb25cbiAgbGV0IHZlcnRleFNoYWRlciA9IF9zZXR1cEdsb2JhbFNoYWRlckRlZmluaXRpb25XZWJHTChlbmdpbmUsIG1hdGVyaWFsLl9fbWF0ZXJpYWxUeXBlTmFtZSwgcHJpbWl0aXZlKTtcbiAgdmVydGV4U2hhZGVyICs9ICcjZGVmaW5lIFJOX0lTX1ZFUlRFWF9TSEFERVJcXG4nO1xuICBsZXQgcGl4ZWxTaGFkZXIgPSBfc2V0dXBHbG9iYWxTaGFkZXJEZWZpbml0aW9uV2ViR0woZW5naW5lLCBtYXRlcmlhbC5fX21hdGVyaWFsVHlwZU5hbWUsIHByaW1pdGl2ZSk7XG4gIHBpeGVsU2hhZGVyICs9ICcjZGVmaW5lIFJOX0lTX1BJWEVMX1NIQURFUlxcbic7XG5cbiAgY29uc3QgZ2xzbENodW5rcyA9IF9fZ2V0R2xzbENvbW1vbkNodW5rcygpO1xuICBjb25zdCB2ZXJ0ZXhTaGFkZXJpdHlPYmplY3QgPSBTaGFkZXJpdHlVdGlsaXR5V2ViR0wuZmlsbFRlbXBsYXRlKFxuICAgIGVuZ2luZSxcbiAgICBtYXRlcmlhbE5vZGUudmVydGV4U2hhZGVyaXR5T2JqZWN0ISxcbiAgICBwcmltaXRpdmUsXG4gICAge1xuICAgICAgZW5hYmxlVmVydGV4RXh0ZW5zaW9uczogZ2xzbENodW5rcy5lbmFibGVWZXJ0ZXhFeHRlbnNpb25zLFxuICAgICAgZ2xzbFByZWNpc2lvbjogZ2xzbENodW5rcy5nbHNsUHJlY2lzaW9uLFxuICAgICAgdmVydGV4SW5PdXQ6IGdsc2xDaHVua3MudmVydGV4SW5PdXQsXG4gICAgICBmdWxsc2NyZWVuOiBnbHNsQ2h1bmtzLmZ1bGxzY3JlZW4sXG4gICAgICBXZWxsS25vd25Db21wb25lbnRUSURzLFxuICAgICAgZ2V0dGVyczogdmVydGV4UHJvcGVydGllc1N0cixcbiAgICAgIGRlZmluaXRpb25zOiBkZWZpbml0aW9ucyxcbiAgICAgIHByZXJlcXVpc2l0ZXM6IGdsc2xDaHVua3MucHJlcmVxdWlzaXRlcyxcbiAgICAgIG1haW5QcmVyZXF1aXNpdGVzOiBnbHNsQ2h1bmtzLm1haW5QcmVyZXF1aXNpdGVzLFxuICAgICAgbWF0cmljZXNHZXR0ZXJzOiBjb21wb25lbnREYXRhQWNjZXNzTWV0aG9kRGVmaW5pdGlvbnNGb3JWZXJ0ZXhTaGFkZXIgKyBtb3JwaGVkUG9zaXRpb25HZXR0ZXIsXG4gICAgICBvcHRpY2FsRGVmaW5pdGlvbjogZ2xzbENodW5rcy5vcHRpY2FsRGVmaW5pdGlvbixcbiAgICAgIHNoYWRvd0RlZmluaXRpb246IGdsc2xDaHVua3Muc2hhZG93LFxuICAgICAgcGJyRGVmaW5pdGlvbjogZ2xzbENodW5rcy5wYnJEZWZpbml0aW9uLFxuICAgICAgaWJsRGVmaW5pdGlvbjogZ2xzbENodW5rcy5pYmxEZWZpbml0aW9uLFxuICAgICAgYWxwaGFQcm9jZXNzOiBnbHNsQ2h1bmtzLmFscGhhUHJvY2VzcyxcbiAgICAgIHByb2Nlc3NHZW9tZXRyeTogZ2xzbENodW5rcy5wcm9jZXNzR2VvbWV0cnksXG4gICAgICBDb25maWc6IGVuZ2luZS5jb25maWcsXG4gICAgfVxuICApO1xuXG4gIGNvbnN0IHBpeGVsU2hhZGVyaXR5T2JqZWN0ID0gU2hhZGVyaXR5VXRpbGl0eVdlYkdMLmZpbGxUZW1wbGF0ZShcbiAgICBlbmdpbmUsXG4gICAgbWF0ZXJpYWxOb2RlLnBpeGVsU2hhZGVyaXR5T2JqZWN0ISxcbiAgICBwcmltaXRpdmUsXG4gICAge1xuICAgICAgZ2xzbFByZWNpc2lvbjogZ2xzbENodW5rcy5nbHNsUHJlY2lzaW9uLFxuICAgICAgV2VsbEtub3duQ29tcG9uZW50VElEcyxcbiAgICAgIHZlcnRleEluOiBnbHNsQ2h1bmtzLnZlcnRleEluLFxuICAgICAgcmVuZGVyVGFyZ2V0QmVnaW46IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmdldEdsc2xSZW5kZXJUYXJnZXRCZWdpblN0cmluZyg0KSxcbiAgICAgIGdldHRlcnM6IHBpeGVsUHJvcGVydGllc1N0cixcbiAgICAgIGRlZmluaXRpb25zOiBkZWZpbml0aW9ucyArIGFscGhhTW9kZSxcbiAgICAgIHByZXJlcXVpc2l0ZXM6IGdsc2xDaHVua3MucHJlcmVxdWlzaXRlcyxcbiAgICAgIG1haW5QcmVyZXF1aXNpdGVzOiBnbHNsQ2h1bmtzLm1haW5QcmVyZXF1aXNpdGVzLFxuICAgICAgbWF0cmljZXNHZXR0ZXJzOiBjb21wb25lbnREYXRhQWNjZXNzTWV0aG9kRGVmaW5pdGlvbnNGb3JQaXhlbFNoYWRlcixcbiAgICAgIG9wdGljYWxEZWZpbml0aW9uOiBnbHNsQ2h1bmtzLm9wdGljYWxEZWZpbml0aW9uLFxuICAgICAgcGJyRGVmaW5pdGlvbjogZ2xzbENodW5rcy5wYnJEZWZpbml0aW9uLFxuICAgICAgaWJsRGVmaW5pdGlvbjogZ2xzbENodW5rcy5pYmxEZWZpbml0aW9uLFxuICAgICAgYWxwaGFQcm9jZXNzOiBnbHNsQ2h1bmtzLmFscGhhUHJvY2VzcyxcbiAgICAgIG91dHB1dFNyZ2I6IGdsc2xDaHVua3Mub3V0cHV0U3JnYixcbiAgICAgIHdpcmVmcmFtZTogZ2xzbENodW5rcy53aXJlZnJhbWUsXG4gICAgICBzaGFkb3dEZWZpbml0aW9uOiBnbHNsQ2h1bmtzLnNoYWRvdyxcbiAgICAgIENvbmZpZzogZW5naW5lLmNvbmZpZyxcbiAgICB9XG4gICk7XG5cbiAgdmVydGV4U2hhZGVyICs9IHZlcnRleFNoYWRlcml0eU9iamVjdC5jb2RlLnJlcGxhY2UoLyN2ZXJzaW9uXFxzKygxMDB8MzAwXFxzK2VzKS8sICcnKTtcbiAgcGl4ZWxTaGFkZXIgKz0gcGl4ZWxTaGFkZXJpdHlPYmplY3QuY29kZS5yZXBsYWNlKC8jdmVyc2lvblxccysoMTAwfDMwMFxccytlcykvLCAnJyk7XG5cbiAgY29uc3QgeyBhdHRyaWJ1dGVOYW1lcywgYXR0cmlidXRlU2VtYW50aWNzIH0gPSBfZ2V0QXR0cmlidXRlSW5mbyh2ZXJ0ZXhTaGFkZXJpdHlPYmplY3QpO1xuICBjb25zdCB2ZXJ0ZXhBdHRyaWJ1dGVzQmluZGluZyA9IF9vdXRwdXRWZXJ0ZXhBdHRyaWJ1dGVCaW5kaW5nSW5mbyhhdHRyaWJ1dGVOYW1lcywgYXR0cmlidXRlU2VtYW50aWNzKTtcbiAgdmVydGV4U2hhZGVyICs9IHZlcnRleEF0dHJpYnV0ZXNCaW5kaW5nO1xuXG4gIGNvbnN0IHByZXByb2Nlc3NlZFZlcnRleCA9IFNoYWRlcml0eS5wcm9jZXNzUHJhZ21hKFxuICAgIHtcbiAgICAgIGNvZGU6IHZlcnRleFNoYWRlcixcbiAgICAgIHNoYWRlclN0YWdlOiAndmVydGV4JyxcbiAgICAgIGlzRnJhZ21lbnRTaGFkZXI6IGZhbHNlLFxuICAgIH0sXG4gICAgdHJ1ZVxuICApO1xuICBjb25zdCBwcmVwcm9jZXNzZWRQaXhlbCA9IFNoYWRlcml0eS5wcm9jZXNzUHJhZ21hKFxuICAgIHtcbiAgICAgIGNvZGU6IHBpeGVsU2hhZGVyLFxuICAgICAgc2hhZGVyU3RhZ2U6ICdmcmFnbWVudCcsXG4gICAgICBpc0ZyYWdtZW50U2hhZGVyOiB0cnVlLFxuICAgIH0sXG4gICAgdHJ1ZVxuICApO1xuXG4gIGNvbnN0IGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5ID0gZW5naW5lLmNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5O1xuICBzaGFkZXJQcm9ncmFtVWlkID0gY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkuY3JlYXRlU2hhZGVyUHJvZ3JhbSh7XG4gICAgY29uZmlnOiBlbmdpbmUuY29uZmlnLFxuICAgIGVuZ2luZSxcbiAgICBtYXRlcmlhbCxcbiAgICBwcmltaXRpdmUsXG4gICAgdmVydGV4U2hhZGVyU3RyOiBwcmVwcm9jZXNzZWRWZXJ0ZXguY29kZSxcbiAgICBmcmFnbWVudFNoYWRlclN0cjogcHJlcHJvY2Vzc2VkUGl4ZWwuY29kZSxcbiAgICBhdHRyaWJ1dGVOYW1lczogYXR0cmlidXRlTmFtZXMsXG4gICAgYXR0cmlidXRlU2VtYW50aWNzOiBhdHRyaWJ1dGVTZW1hbnRpY3MsXG4gIH0pO1xuICBzaGFkZXJDYWNoZS5zZXQoY2FjaGVRdWVyeSwgc2hhZGVyUHJvZ3JhbVVpZCk7XG4gIHJldHVybiBbc2hhZGVyUHJvZ3JhbVVpZCwgdHJ1ZV07XG59XG5cbi8qKlxuICogU2V0cyB1cCBnbG9iYWwgc2hhZGVyIGRlZmluaXRpb25zIGFuZCBwcmVwcm9jZXNzb3IgZGlyZWN0aXZlcyBmb3IgV2ViR0wuXG4gKiBUaGlzIGZ1bmN0aW9uIGNvbmZpZ3VyZXMgcGxhdGZvcm0tc3BlY2lmaWMgc2hhZGVyIGZlYXR1cmVzIGluY2x1ZGluZzpcbiAqIC0gV2ViR0wgdmVyc2lvbiBkZXRlY3Rpb24gYW5kIEdMU0wgRVMgdmVyc2lvbiBzZWxlY3Rpb25cbiAqIC0gVUJPIChVbmlmb3JtIEJ1ZmZlciBPYmplY3QpIHN1cHBvcnQgZGV0ZWN0aW9uXG4gKiAtIE11bHRpLXZpZXcgcmVuZGVyaW5nIGZvciBXZWJYUlxuICogLSBCb25lIGRhdGEgdHlwZSBkZWZpbml0aW9uc1xuICogLSBTdGFuZGFyZCBkZXJpdmF0aXZlcyBleHRlbnNpb24gc3VwcG9ydFxuICpcbiAqIEBwYXJhbSBtYXRlcmlhbFR5cGVOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIG1hdGVyaWFsIHR5cGUgZm9yIGRlYnVnZ2luZ1xuICogQHBhcmFtIHByaW1pdGl2ZSAtIFRoZSBnZW9tZXRyaWMgcHJpbWl0aXZlIGZvciBjb250ZXh0LXNwZWNpZmljIGRlZmluaXRpb25zXG4gKiBAcmV0dXJucyBBIHN0cmluZyBjb250YWluaW5nIGFsbCBnbG9iYWwgc2hhZGVyIGRlZmluaXRpb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfc2V0dXBHbG9iYWxTaGFkZXJEZWZpbml0aW9uV2ViR0woZW5naW5lOiBFbmdpbmUsIG1hdGVyaWFsVHlwZU5hbWU6IHN0cmluZywgX3ByaW1pdGl2ZTogUHJpbWl0aXZlKSB7XG4gIGxldCBkZWZpbml0aW9ucyA9ICcnO1xuICBjb25zdCB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeSA9IGVuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeTtcbiAgY29uc3QgZ2x3ID0gd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuY3VycmVudFdlYkdMQ29udGV4dFdyYXBwZXIgYXMgV2ViR0xDb250ZXh0V3JhcHBlcjtcbiAgaWYgKGdsdy5pc1dlYkdMMikge1xuICAgIGRlZmluaXRpb25zICs9ICcjdmVyc2lvbiAzMDAgZXNcXG4jZGVmaW5lIEdMU0xfRVMzXFxuJztcbiAgICBpZiAoZW5naW5lLmNvbmZpZy5pc1Vib0VuYWJsZWQpIHtcbiAgICAgIGRlZmluaXRpb25zICs9ICcjZGVmaW5lIFJOX0lTX1VCT19FTkFCTEVEXFxuJztcbiAgICB9XG4gIH1cbiAgZGVmaW5pdGlvbnMgKz0gYC8vIFJOX01BVEVSSUFMX1RZUEVfTkFNRTogJHttYXRlcmlhbFR5cGVOYW1lfVxcbmA7XG4gIGlmIChQcm9jZXNzQXBwcm9hY2guaXNXZWJHTDJBcHByb2FjaChlbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCkpIHtcbiAgICBkZWZpbml0aW9ucyArPSAnI2RlZmluZSBSTl9JU19XRUJHTDJfTU9ERVxcbic7XG4gICAgaWYgKGVuZ2luZS5jb25maWcuaXNNdWx0aURyYXdFbmFibGVkICYmIHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmlzSW5zdGFuY2VTaWRUZXh0dXJlQ2FwYWJsZSkge1xuICAgICAgZGVmaW5pdGlvbnMgKz0gJyNkZWZpbmUgUk5fVVNFX0lOU1RBTkNFX1NJRF9URVhUVVJFXFxuJztcbiAgICAgIGRlZmluaXRpb25zICs9ICcjZGVmaW5lIFJOX1VTRV9NQVRFUklBTF9TSURfQVRUUklCVVRFXFxuJztcbiAgICB9XG4gIH1cblxuICBjb25zdCB3ZWJYUlN5c3RlbSA9IGVuZ2luZS5fd2ViWFJTeXN0ZW1JZkVuYWJsZWQ7XG4gIGlmIChcbiAgICBJcy5leGlzdCh3ZWJYUlN5c3RlbSkgJiZcbiAgICB3ZWJYUlN5c3RlbT8uaXNXZWJYUk1vZGUgJiZcbiAgICB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5pc1N1cHBvcnRNdWx0aVZpZXdWUlJlbmRlcmluZyhlbmdpbmUpXG4gICkge1xuICAgIGRlZmluaXRpb25zICs9ICcjZGVmaW5lIFdFQkdMMl9NVUxUSV9WSUVXXFxuJztcbiAgfVxuXG4gIC8vIGlmIChnbHcuX2lzV2ViWFJNb2RlICYmIGdsdy5pc19tdWx0aXZpZXcpIHtcbiAgLy8gICBkZWZpbml0aW9ucyArPSAnI2RlZmluZSBXRUJYUl9NVUxUSV9WSUVXX1ZJRVdfTlVNXzJcXG4nO1xuICAvLyB9XG5cbiAgaWYgKGdsdy5pc1dlYkdMMiB8fCBnbHcud2ViZ2wxRXh0RFJWKSB7XG4gICAgZGVmaW5pdGlvbnMgKz0gJyNkZWZpbmUgUk5fSVNfU1VQUE9SVElOR19TVEFOREFSRF9ERVJJVkFUSVZFU1xcbic7XG4gIH1cbiAgcmV0dXJuIGRlZmluaXRpb25zO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBjb21wbGV0ZSBzaGFkZXIgcHJvZ3JhbSBmb3IgV2ViR1BVIHJlbmRlcmluZy5cbiAqIFRoaXMgZnVuY3Rpb24gaGFuZGxlcyB0aGUgV2ViR1BVLXNwZWNpZmljIHNoYWRlciBjb21waWxhdGlvbiBwaXBlbGluZSBpbmNsdWRpbmc6XG4gKiAtIFdHU0wgc2hhZGVyIHRlbXBsYXRlIHByb2Nlc3NpbmdcbiAqIC0gTWF0ZXJpYWwgcHJvcGVydHkgZW1iZWRkaW5nXG4gKiAtIFByYWdtYSBwcmVwcm9jZXNzaW5nIHdpdGggU2hhZGVyaXR5XG4gKiAtIFdlYkdQVS1zcGVjaWZpYyBkZWZpbml0aW9ucyBhbmQgY29uZmlndXJhdGlvbnNcbiAqXG4gKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIGNvbnRhaW5pbmcgc2hhZGVyIHRlbXBsYXRlcyBhbmQgcHJvcGVydGllc1xuICogQHBhcmFtIHByaW1pdGl2ZSAtIFRoZSBnZW9tZXRyaWMgcHJpbWl0aXZlIHRoYXQgZGVmaW5lcyB2ZXJ0ZXggYXR0cmlidXRlc1xuICogQHBhcmFtIGNvbXBvbmVudERhdGFBY2Nlc3NNZXRob2REZWZpbml0aW9uc0ZvclZlcnRleFNoYWRlciAtIG1ldGhvZCBkZWZpbml0aW9ucyBmb3IgY29tcG9uZW50IGRhdGEgYWNjZXNzIGZvciB2ZXJ0ZXggc2hhZGVyXG4gKiBAcGFyYW0gY29tcG9uZW50RGF0YUFjY2Vzc01ldGhvZERlZmluaXRpb25zRm9yUGl4ZWxTaGFkZXIgLSBtZXRob2QgZGVmaW5pdGlvbnMgZm9yIGNvbXBvbmVudCBkYXRhIGFjY2VzcyBmb3IgcGl4ZWwgc2hhZGVyXG4gKiBAcGFyYW0gcHJvcGVydHlTZXR0ZXJPZkdsb2JhbERhdGFSZXBvc2l0b3J5IC0gRnVuY3Rpb24gZm9yIHNldHRpbmcgc2hhZGVyIHByb3BlcnRpZXMgb2YgZ2xvYmFsIGRhdGEgcmVwb3NpdG9yeVxuICogQHBhcmFtIHByb3BlcnR5U2V0dGVyT2ZNYXRlcmlhbCAtIEZ1bmN0aW9uIGZvciBzZXR0aW5nIHNoYWRlciBwcm9wZXJ0aWVzIG9mIG1hdGVyaWFsXG4gKiBAcGFyYW0gbW9ycGhlZFBvc2l0aW9uR2V0dGVyIC0gRnVuY3Rpb24gdG8gZ2V0IHRoZSBtb3JwaGVkIHBvc2l0aW9uXG4gKiBAcmV0dXJucyBUaGUgaGFuZGxlIHRvIHRoZSBjcmVhdGVkIHNoYWRlciBwcm9ncmFtXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfY3JlYXRlUHJvZ3JhbUFzU2luZ2xlT3BlcmF0aW9uV2ViR3B1KFxuICBlbmdpbmU6IEVuZ2luZSxcbiAgbWF0ZXJpYWw6IE1hdGVyaWFsLFxuICBwcmltaXRpdmU6IFByaW1pdGl2ZSxcbiAgY29tcG9uZW50RGF0YUFjY2Vzc01ldGhvZERlZmluaXRpb25zRm9yVmVydGV4U2hhZGVyOiBzdHJpbmcsXG4gIGNvbXBvbmVudERhdGFBY2Nlc3NNZXRob2REZWZpbml0aW9uc0ZvclBpeGVsU2hhZGVyOiBzdHJpbmcsXG4gIHByb3BlcnR5U2V0dGVyT2ZHbG9iYWxEYXRhUmVwb3NpdG9yeTogZ2V0U2hhZGVyUHJvcGVydHlGdW5jT2ZHbG9iYWxEYXRhUmVwb3NpdG9yeSxcbiAgcHJvcGVydHlTZXR0ZXJPZk1hdGVyaWFsOiBnZXRTaGFkZXJQcm9wZXJ0eUZ1bmNPZk1hdGVyaWFsLFxuICBtb3JwaGVkUG9zaXRpb25HZXR0ZXI6IHN0cmluZ1xuKSB7XG4gIGNvbnN0IHZlcnRleEF0dHJpYnV0ZURlZmluZXMgPSBkZWZpbmVBdHRyaWJ1dGVzKHByaW1pdGl2ZSk7XG4gIGNvbnN0IG1hdGVyaWFsTm9kZSA9IG1hdGVyaWFsLl9tYXRlcmlhbENvbnRlbnQ7XG4gIGxldCBkZWZpbml0aW9ucyA9IGAvLyBNYXRlcmlhbCBUeXBlOiAke21hdGVyaWFsLm1hdGVyaWFsVHlwZU5hbWV9XFxuYDtcbiAgZGVmaW5pdGlvbnMgKz0gbWF0ZXJpYWxOb2RlLmdldERlZmluaXRpb25zKCk7XG4gIGNvbnN0IHNoYWRlckRlZmluZXMgPSBtYXRlcmlhbC5nZXRTaGFkZXJEZWZpbmVzKCk7XG4gIGZvciAoY29uc3Qgc2hhZGVyRGVmaW5lIG9mIHNoYWRlckRlZmluZXMpIHtcbiAgICBkZWZpbml0aW9ucyArPSBgI2RlZmluZSAke3NoYWRlckRlZmluZX1cXG5gO1xuICB9XG4gIGRlZmluaXRpb25zICs9IHZlcnRleEF0dHJpYnV0ZURlZmluZXM7XG4gIGxldCBhbHBoYU1vZGUgPSAnJztcbiAgaWYgKG1hdGVyaWFsLmlzQmxlbmQoKSkge1xuICAgIGFscGhhTW9kZSArPSAnI2RlZmluZSBSTl9JU19BTFBIQV9NT0RFX0JMRU5EXFxuJztcbiAgfVxuICBpZiAobWF0ZXJpYWwuaXNNYXNrKCkpIHtcbiAgICBhbHBoYU1vZGUgKz0gJyNkZWZpbmUgUk5fSVNfQUxQSEFfTU9ERV9NQVNLXFxuJztcbiAgfVxuICBjb25zdCBjYWNoZVF1ZXJ5ID1cbiAgICBDb21wb25lbnQuZ2V0U3RhdGVWZXJzaW9uKGVuZ2luZSkgK1xuICAgIGVuZ2luZS5tYXRlcmlhbFJlcG9zaXRvcnkuX2dldEJ1ZmZlclZpZXdWZXJzaW9uKG1hdGVyaWFsLl9fbWF0ZXJpYWxUeXBlTmFtZSkgK1xuICAgIG1hdGVyaWFsLl9fbWF0ZXJpYWxUeXBlTmFtZSArXG4gICAgbWF0ZXJpYWwuX21hdGVyaWFsQ29udGVudC5nZXRNYXRlcmlhbFNlbWFudGljc1ZhcmlhbnROYW1lKCkgK1xuICAgIHZlcnRleEF0dHJpYnV0ZURlZmluZXMgK1xuICAgIG1hdGVyaWFsLl9nZXRGaW5nZXJQcmludCgpICtcbiAgICBkZWZpbml0aW9ucyArXG4gICAgY29tcG9uZW50RGF0YUFjY2Vzc01ldGhvZERlZmluaXRpb25zRm9yVmVydGV4U2hhZGVyICtcbiAgICBjb21wb25lbnREYXRhQWNjZXNzTWV0aG9kRGVmaW5pdGlvbnNGb3JQaXhlbFNoYWRlciArXG4gICAgbW9ycGhlZFBvc2l0aW9uR2V0dGVyICtcbiAgICBhbHBoYU1vZGU7XG5cbiAgLy8gVXNlIHRoZSBlbmdpbmUncyBzaGFkZXIgcHJvZ3JhbSBjYWNoZVxuICBjb25zdCBzaGFkZXJDYWNoZSA9IGVuZ2luZS5zaGFkZXJQcm9ncmFtQ2FjaGU7XG4gIGxldCBzaGFkZXJQcm9ncmFtVWlkID0gc2hhZGVyQ2FjaGUuZ2V0KGNhY2hlUXVlcnkpO1xuICBpZiAoc2hhZGVyUHJvZ3JhbVVpZCAhPSBudWxsKSB7XG4gICAgcmV0dXJuIHNoYWRlclByb2dyYW1VaWQ7XG4gIH1cbiAgbWF0ZXJpYWwudXBkYXRlU3RhdGVWZXJzaW9uKCk7XG4gIGNvbnN0IHsgdmVydGV4UHJvcGVydGllc1N0ciwgcGl4ZWxQcm9wZXJ0aWVzU3RyIH0gPSBtYXRlcmlhbC5fZ2V0UHJvcGVydGllcyhcbiAgICBlbmdpbmUsXG4gICAgcHJvcGVydHlTZXR0ZXJPZkdsb2JhbERhdGFSZXBvc2l0b3J5LFxuICAgIHByb3BlcnR5U2V0dGVyT2ZNYXRlcmlhbFxuICApO1xuXG4gIGNvbnN0IHdnc2xDaHVua3MgPSBfX2dldFdnc2xDb21tb25DaHVua3MoKTtcbiAgY29uc3QgdmVydGV4U2hhZGVyaXR5T2JqZWN0ID0gU2hhZGVyaXR5VXRpbGl0eVdlYkdQVS5maWxsVGVtcGxhdGUoXG4gICAgZW5naW5lLFxuICAgIG1hdGVyaWFsTm9kZS52ZXJ0ZXhTaGFkZXJpdHlPYmplY3QhLFxuICAgIHByaW1pdGl2ZSxcbiAgICB7XG4gICAgICBXZWxsS25vd25Db21wb25lbnRUSURzLFxuICAgICAgdmVydGV4SW5wdXQ6IHdnc2xDaHVua3MudmVydGV4SW5wdXQsXG4gICAgICB2ZXJ0ZXhPdXRwdXQ6IHdnc2xDaHVua3MudmVydGV4T3V0cHV0LFxuICAgICAgcHJlcmVxdWlzaXRlczogd2dzbENodW5rcy5wcmVyZXF1aXNpdGVzLFxuICAgICAgbWFpblByZXJlcXVpc2l0ZXM6IHdnc2xDaHVua3MubWFpblByZXJlcXVpc2l0ZXMsXG4gICAgICBmdWxsc2NyZWVuOiB3Z3NsQ2h1bmtzLmZ1bGxzY3JlZW4sXG4gICAgICBnZXR0ZXJzOiB2ZXJ0ZXhQcm9wZXJ0aWVzU3RyLFxuICAgICAgZGVmaW5pdGlvbnM6IGAvLyBSTl9JU19WRVJURVhfU0hBREVSXFxuI2RlZmluZSBSTl9JU19WRVJURVhfU0hBREVSXFxuJHtkZWZpbml0aW9uc31gLFxuICAgICAgbWF0cmljZXNHZXR0ZXJzOiBjb21wb25lbnREYXRhQWNjZXNzTWV0aG9kRGVmaW5pdGlvbnNGb3JWZXJ0ZXhTaGFkZXIgKyBtb3JwaGVkUG9zaXRpb25HZXR0ZXIsXG4gICAgICBvcHRpY2FsRGVmaW5pdGlvbjogd2dzbENodW5rcy5vcHRpY2FsRGVmaW5pdGlvbixcbiAgICAgIHNoYWRvd0RlZmluaXRpb246IHdnc2xDaHVua3Muc2hhZG93LFxuICAgICAgcGJyRGVmaW5pdGlvbjogd2dzbENodW5rcy5wYnJEZWZpbml0aW9uLFxuICAgICAgaWJsRGVmaW5pdGlvbjogd2dzbENodW5rcy5pYmxEZWZpbml0aW9uLFxuICAgICAgYWxwaGFQcm9jZXNzOiB3Z3NsQ2h1bmtzLmFscGhhUHJvY2VzcyxcbiAgICAgIC8vIFRoZSBib25lIGRlY29kaW5nIGlzIHNoYXJlZCB3aXRoIHRoZSBza2lubmluZyBjb21wdXRlIHNoYWRlciAoV2ViR3B1VmVydGV4RGVmb3JtZXIpLlxuICAgICAgcHJvY2Vzc0dlb21ldHJ5OiBgI2lmZGVmIFJOX0lTX1NLSU5OSU5HXFxuJHt3Z3NsQ2h1bmtzLmJvbmVEZWNvZGV9XFxuI2VuZGlmXFxuJHt3Z3NsQ2h1bmtzLnByb2Nlc3NHZW9tZXRyeX1gLFxuICAgICAgQ29uZmlnOiBlbmdpbmUuY29uZmlnLFxuICAgIH1cbiAgKTtcblxuICBjb25zdCBwaXhlbFNoYWRlcml0eU9iamVjdCA9IFNoYWRlcml0eVV0aWxpdHlXZWJHUFUuZmlsbFRlbXBsYXRlKFxuICAgIGVuZ2luZSxcbiAgICBtYXRlcmlhbE5vZGUucGl4ZWxTaGFkZXJpdHlPYmplY3QhLFxuICAgIHByaW1pdGl2ZSxcbiAgICB7XG4gICAgICBXZWxsS25vd25Db21wb25lbnRUSURzLFxuICAgICAgdmVydGV4T3V0cHV0OiB3Z3NsQ2h1bmtzLnZlcnRleE91dHB1dCxcbiAgICAgIHByZXJlcXVpc2l0ZXM6IHdnc2xDaHVua3MucHJlcmVxdWlzaXRlcyxcbiAgICAgIG1haW5QcmVyZXF1aXNpdGVzOiB3Z3NsQ2h1bmtzLm1haW5QcmVyZXF1aXNpdGVzLFxuICAgICAgZ2V0dGVyczogcGl4ZWxQcm9wZXJ0aWVzU3RyLFxuICAgICAgZGVmaW5pdGlvbnM6IGAvLyBSTl9JU19QSVhFTF9TSEFERVJcXG4jZGVmaW5lIFJOX0lTX1BJWEVMX1NIQURFUlxcbiR7ZGVmaW5pdGlvbnN9JHthbHBoYU1vZGV9YCxcbiAgICAgIG1hdHJpY2VzR2V0dGVyczogY29tcG9uZW50RGF0YUFjY2Vzc01ldGhvZERlZmluaXRpb25zRm9yUGl4ZWxTaGFkZXIsXG4gICAgICBvcHRpY2FsRGVmaW5pdGlvbjogd2dzbENodW5rcy5vcHRpY2FsRGVmaW5pdGlvbixcbiAgICAgIHNoYWRvd0RlZmluaXRpb246IHdnc2xDaHVua3Muc2hhZG93LFxuICAgICAgcGJyRGVmaW5pdGlvbjogd2dzbENodW5rcy5wYnJEZWZpbml0aW9uLFxuICAgICAgaWJsRGVmaW5pdGlvbjogd2dzbENodW5rcy5pYmxEZWZpbml0aW9uLFxuICAgICAgYWxwaGFQcm9jZXNzOiB3Z3NsQ2h1bmtzLmFscGhhUHJvY2VzcyxcbiAgICAgIG91dHB1dFNyZ2I6IHdnc2xDaHVua3Mub3V0cHV0U3JnYixcbiAgICAgIHdpcmVmcmFtZTogd2dzbENodW5rcy53aXJlZnJhbWUsXG4gICAgICBDb25maWc6IGVuZ2luZS5jb25maWcsXG4gICAgfVxuICApO1xuXG4gIGNvbnN0IHByZXByb2Nlc3NlZFZlcnRleCA9IFNoYWRlcml0eS5wcm9jZXNzUHJhZ21hKHZlcnRleFNoYWRlcml0eU9iamVjdCwgZmFsc2UpO1xuICBjb25zdCBwcmVwcm9jZXNzZWRQaXhlbCA9IFNoYWRlcml0eS5wcm9jZXNzUHJhZ21hKHBpeGVsU2hhZGVyaXR5T2JqZWN0LCBmYWxzZSk7XG5cbiAgY29uc3QgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgPSBlbmdpbmUuY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnk7XG4gIHNoYWRlclByb2dyYW1VaWQgPSBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeS5jcmVhdGVTaGFkZXJQcm9ncmFtKHtcbiAgICBjb25maWc6IGVuZ2luZS5jb25maWcsXG4gICAgZW5naW5lLFxuICAgIG1hdGVyaWFsLFxuICAgIHByaW1pdGl2ZSxcbiAgICB2ZXJ0ZXhTaGFkZXJTdHI6IHByZXByb2Nlc3NlZFZlcnRleC5jb2RlLFxuICAgIGZyYWdtZW50U2hhZGVyU3RyOiBwcmVwcm9jZXNzZWRQaXhlbC5jb2RlLFxuICAgIGF0dHJpYnV0ZU5hbWVzOiBbXSxcbiAgICBhdHRyaWJ1dGVTZW1hbnRpY3M6IFtdLFxuICB9KTtcbiAgc2hhZGVyQ2FjaGUuc2V0KGNhY2hlUXVlcnksIHNoYWRlclByb2dyYW1VaWQpO1xuICByZXR1cm4gc2hhZGVyUHJvZ3JhbVVpZDtcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgcHJlcHJvY2Vzc29yIGRlZmluaXRpb25zIGJhc2VkIG9uIHZlcnRleCBhdHRyaWJ1dGVzIHByZXNlbnQgaW4gYSBwcmltaXRpdmUuXG4gKiBUaGlzIGZ1bmN0aW9uIGFuYWx5emVzIHRoZSB2ZXJ0ZXggYXR0cmlidXRlcyBvZiBhIHByaW1pdGl2ZSBhbmQgY3JlYXRlcyBjb3JyZXNwb25kaW5nXG4gKiBzaGFkZXIgcHJlcHJvY2Vzc29yIGRlZmluaXRpb25zIHRoYXQgZW5hYmxlIGF0dHJpYnV0ZS1zcGVjaWZpYyBjb2RlIHBhdGhzIGluIHNoYWRlcnMuXG4gKiBJdCBhbHNvIGhhbmRsZXMgc3BlY2lhbCBjYXNlcyBsaWtlIG1vcnBoaW5nIHRhcmdldHMgYW5kIGluc3RhbmNpbmcuXG4gKlxuICogQHBhcmFtIHByaW1pdGl2ZSAtIFRoZSBnZW9tZXRyaWMgcHJpbWl0aXZlIHRvIGFuYWx5emUgZm9yIHZlcnRleCBhdHRyaWJ1dGVzXG4gKiBAcmV0dXJucyBBIHN0cmluZyBjb250YWluaW5nIGFsbCByZWxldmFudCB2ZXJ0ZXggYXR0cmlidXRlIHByZXByb2Nlc3NvciBkZWZpbml0aW9uc1xuICovXG5mdW5jdGlvbiBkZWZpbmVBdHRyaWJ1dGVzKHByaW1pdGl2ZTogUHJpbWl0aXZlKSB7XG4gIGxldCB2ZXJ0ZXhBdHRyaWJ1dGVEZWZpbmVzID0gJyc7XG4gIGNvbnN0IGF0dHJpYnV0ZVNlbWFudGljcyA9IHByaW1pdGl2ZS5hdHRyaWJ1dGVTZW1hbnRpY3M7XG4gIGZvciAoY29uc3QgYXR0cmlidXRlU2VtYW50aWMgb2YgYXR0cmlidXRlU2VtYW50aWNzKSB7XG4gICAgaWYgKGF0dHJpYnV0ZVNlbWFudGljLmluZGV4T2YoJ1BPU0lUSU9OJykgIT09IC0xKSB7XG4gICAgICB2ZXJ0ZXhBdHRyaWJ1dGVEZWZpbmVzICs9ICcjZGVmaW5lIFJOX1VTRV9QT1NJVElPTlxcbic7XG4gICAgICBjb25zdCBhY2Nlc3NvciA9IHByaW1pdGl2ZS5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlU2VtYW50aWMpO1xuICAgICAgaWYgKGFjY2Vzc29yIS5jb21wb25lbnRUeXBlLmlzRmxvYXRpbmdQb2ludCgpKSB7XG4gICAgICAgIHZlcnRleEF0dHJpYnV0ZURlZmluZXMgKz0gJyNkZWZpbmUgUk5fVVNFX1BPU0lUSU9OX0ZMT0FUXFxuJztcbiAgICAgIH0gZWxzZSBpZiAoYWNjZXNzb3IhLmNvbXBvbmVudFR5cGUuaXNJbnRlZ2VyKCkpIHtcbiAgICAgICAgdmVydGV4QXR0cmlidXRlRGVmaW5lcyArPSAnI2RlZmluZSBSTl9VU0VfUE9TSVRJT05fSU5UXFxuJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZlcnRleEF0dHJpYnV0ZURlZmluZXMgKz0gJyNkZWZpbmUgUk5fVVNFX1BPU0lUSU9OX1VJTlRcXG4nO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoYXR0cmlidXRlU2VtYW50aWMuaW5kZXhPZignTk9STUFMJykgIT09IC0xKSB7XG4gICAgICB2ZXJ0ZXhBdHRyaWJ1dGVEZWZpbmVzICs9ICcjZGVmaW5lIFJOX1VTRV9OT1JNQUxcXG4nO1xuICAgIH1cbiAgICBpZiAoYXR0cmlidXRlU2VtYW50aWMuaW5kZXhPZignVEFOR0VOVCcpICE9PSAtMSkge1xuICAgICAgdmVydGV4QXR0cmlidXRlRGVmaW5lcyArPSAnI2RlZmluZSBSTl9VU0VfVEFOR0VOVFxcbic7XG4gICAgfVxuICAgIGlmIChhdHRyaWJ1dGVTZW1hbnRpYy5pbmRleE9mKCdURVhDT09SRF8wJykgIT09IC0xKSB7XG4gICAgICB2ZXJ0ZXhBdHRyaWJ1dGVEZWZpbmVzICs9ICcjZGVmaW5lIFJOX1VTRV9URVhDT09SRF8wXFxuJztcbiAgICB9XG4gICAgaWYgKGF0dHJpYnV0ZVNlbWFudGljLmluZGV4T2YoJ1RFWENPT1JEXzEnKSAhPT0gLTEpIHtcbiAgICAgIHZlcnRleEF0dHJpYnV0ZURlZmluZXMgKz0gJyNkZWZpbmUgUk5fVVNFX1RFWENPT1JEXzFcXG4nO1xuICAgIH1cbiAgICBpZiAoYXR0cmlidXRlU2VtYW50aWMuaW5kZXhPZignQ09MT1JfMCcpICE9PSAtMSkge1xuICAgICAgdmVydGV4QXR0cmlidXRlRGVmaW5lcyArPSAnI2RlZmluZSBSTl9VU0VfQ09MT1JfMFxcbic7XG4gICAgICBjb25zdCBhY2Nlc3NvciA9IHByaW1pdGl2ZS5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlU2VtYW50aWMpO1xuICAgICAgaWYgKGFjY2Vzc29yIS5ub3JtYWxpemVkKSB7XG4gICAgICAgIC8vIEEgbm9ybWFsaXplZCBpbnRlZ2VyIGF0dHJpYnV0ZSBpcyBib3VuZCB3aXRoIGEgdW5vcm0vc25vcm0gV2ViR1BVIHZlcnRleCBmb3JtYXQsXG4gICAgICAgIC8vIHNvIHRoZSBzaGFkZXIgcmVjZWl2ZXMgZmxvYXRzIGluIHRoZSBbMCwgMV0gLyBbLTEsIDFdIHJhbmdlLlxuICAgICAgICB2ZXJ0ZXhBdHRyaWJ1dGVEZWZpbmVzICs9ICcjZGVmaW5lIFJOX1VTRV9DT0xPUl8wX0ZMT0FUXFxuJztcbiAgICAgIH0gZWxzZSBpZiAoYWNjZXNzb3IhLmNvbXBvbmVudFR5cGUuaXNGbG9hdGluZ1BvaW50KCkpIHtcbiAgICAgICAgdmVydGV4QXR0cmlidXRlRGVmaW5lcyArPSAnI2RlZmluZSBSTl9VU0VfQ09MT1JfMF9GTE9BVFxcbic7XG4gICAgICB9IGVsc2UgaWYgKGFjY2Vzc29yIS5jb21wb25lbnRUeXBlLmlzSW50ZWdlcigpKSB7XG4gICAgICAgIHZlcnRleEF0dHJpYnV0ZURlZmluZXMgKz0gJyNkZWZpbmUgUk5fVVNFX0NPTE9SXzBfSU5UXFxuJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZlcnRleEF0dHJpYnV0ZURlZmluZXMgKz0gJyNkZWZpbmUgUk5fVVNFX0NPTE9SXzBfVUlOVFxcbic7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChhdHRyaWJ1dGVTZW1hbnRpYy5pbmRleE9mKCdKT0lOVFNfMCcpICE9PSAtMSkge1xuICAgICAgdmVydGV4QXR0cmlidXRlRGVmaW5lcyArPSAnI2RlZmluZSBSTl9VU0VfSk9JTlRTXzBcXG4nO1xuICAgIH1cbiAgICBpZiAoYXR0cmlidXRlU2VtYW50aWMuaW5kZXhPZignV0VJR0hUU18wJykgIT09IC0xKSB7XG4gICAgICB2ZXJ0ZXhBdHRyaWJ1dGVEZWZpbmVzICs9ICcjZGVmaW5lIFJOX1VTRV9XRUlHSFRTXzBcXG4nO1xuICAgIH1cbiAgICBpZiAoYXR0cmlidXRlU2VtYW50aWMuaW5kZXhPZignRkFDRV9OT1JNQUwnKSAhPT0gLTEpIHtcbiAgICAgIHZlcnRleEF0dHJpYnV0ZURlZmluZXMgKz0gJyNkZWZpbmUgUk5fVVNFX0ZBQ0VfTk9STUFMXFxuJztcbiAgICB9XG4gICAgaWYgKGF0dHJpYnV0ZVNlbWFudGljLmluZGV4T2YoJ0JBUllfQ0VOVFJJQ19DT09SRCcpICE9PSAtMSkge1xuICAgICAgdmVydGV4QXR0cmlidXRlRGVmaW5lcyArPSAnI2RlZmluZSBSTl9VU0VfQkFSWV9DRU5UUklDX0NPT1JEXFxuJztcbiAgICB9XG4gICAgaWYgKGF0dHJpYnV0ZVNlbWFudGljLmluZGV4T2YoJ1RFWENPT1JEXzInKSAhPT0gLTEpIHtcbiAgICAgIHZlcnRleEF0dHJpYnV0ZURlZmluZXMgKz0gJyNkZWZpbmUgUk5fVVNFX1RFWENPT1JEXzJcXG4nO1xuICAgIH1cbiAgfVxuICBpZiAocHJpbWl0aXZlLnRhcmdldHMgIT0gbnVsbCAmJiBwcmltaXRpdmUudGFyZ2V0cy5sZW5ndGggPiAwKSB7XG4gICAgdmVydGV4QXR0cmlidXRlRGVmaW5lcyArPSAnI2RlZmluZSBSTl9JU19NT1JQSElOR1xcbic7XG4gIH1cblxuICB2ZXJ0ZXhBdHRyaWJ1dGVEZWZpbmVzICs9ICcjZGVmaW5lIFJOX1VTRV9JTlNUQU5DRVxcbic7XG4gIHJldHVybiB2ZXJ0ZXhBdHRyaWJ1dGVEZWZpbmVzO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFBLE9BQU8scUJBQStDO0FBU3RELFNBQVMsOEJBQThCO0FBQ3ZDLFNBQVMsaUJBQWlCO0FBQzFCLFNBQVMsdUJBQXVCO0FBT2hDLFNBQVMsVUFBVTtBQUVuQixTQUFTLHFCQUFxQjtBQUc5QixTQUFTLDZCQUE2QjtBQUN0QyxTQUFTLDhCQUE4QjtBQUV2QyxJQUFNLFlBQWEsZ0JBQXdCLFdBQVc7QUFNdEQsU0FBUyx3QkFBMEM7QUFDakQsUUFBTSxjQUFjLGNBQWMsWUFBWSxFQUFFLFVBQVUsT0FBTztBQUNqRSxNQUFJLGVBQWUsTUFBTTtBQUN2QixVQUFNLElBQUksTUFBTSwwRkFBMEY7QUFBQSxFQUM1RztBQUNBLFNBQU8sWUFBWTtBQUNyQjtBQU1BLFNBQVMsd0JBQTBDO0FBQ2pELFFBQU0sZUFBZSxjQUFjLFlBQVksRUFBRSxVQUFVLFFBQVE7QUFDbkUsTUFBSSxnQkFBZ0IsTUFBTTtBQUN4QixVQUFNLElBQUksTUFBTSwyRkFBMkY7QUFBQSxFQUM3RztBQUNBLFNBQU8sYUFBYTtBQUN0QjtBQVdPLElBQU0sZ0JBQU4sTUFBb0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWdCekIsT0FBTyw4QkFDTCxRQUNBLFVBQ0EsV0FDQSxjQUNBLGFBQ0EsZ0JBQ0Esb0JBQ0EsU0FDZ0M7QUFFaEMsVUFBTSxjQUFjLE9BQU87QUFDM0IsVUFBTSxrQkFBa0IsMkJBQTJCLGVBQWUsV0FBVztBQUM3RSxRQUFJLG1CQUFtQixZQUFZLElBQUksZUFBZTtBQUN0RCxR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
