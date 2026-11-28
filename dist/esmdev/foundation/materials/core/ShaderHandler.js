// src/foundation/materials/core/ShaderHandler.ts
import ShaderityModule from "../../../_deps/shaderity.js";
import { WellKnownComponentTIDs } from "../../components/WellKnownComponentTIDs.js";
import { Component } from "../../core/Component.js";
import { ProcessApproach } from "../../definitions/ProcessApproach.js";
import { Is } from "../../misc/Is.js";
import { ModuleManager } from "../../system/ModuleManager.js";
import { ShaderityUtilityWebGL as ShaderityUtilityWebGL_ } from "./ShaderityUtilityWebGL.js";
import { ShaderityUtilityWebGPU as ShaderityUtilityWebGPU_ } from "./ShaderityUtilityWebGPU.js";
var ShaderityUtilityWebGL = typeof __RN_WEBGL__ === "undefined" || __RN_WEBGL__ ? ShaderityUtilityWebGL_ : void 0;
var ShaderityUtilityWebGPU = typeof __RN_WEBGPU__ === "undefined" || __RN_WEBGPU__ ? ShaderityUtilityWebGPU_ : void 0;
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
  const cacheQuery = Component.getStateVersion(engine) + engine.materialRepository._getBufferViewVersion(material.Rr) + material.Rr + material._materialContent.getMaterialSemanticsVariantName() + vertexAttributeDefines + material._getFingerPrint() + definitions + morphedPositionGetter + componentDataAccessMethodDefinitionsForVertexShader + componentDataAccessMethodDefinitionsForPixelShader + morphedPositionGetter + alphaMode + (isMultiViewVRRendering ? "WEBGL2_MULTI_VIEW" : "");
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
  let vertexShader = _setupGlobalShaderDefinitionWebGL(engine, material.Rr, primitive);
  vertexShader += "#define RN_IS_VERTEX_SHADER\n";
  let pixelShader = _setupGlobalShaderDefinitionWebGL(engine, material.Rr, primitive);
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
  const cacheQuery = Component.getStateVersion(engine) + engine.materialRepository._getBufferViewVersion(material.Rr) + material.Rr + material._materialContent.getMaterialSemanticsVariantName() + vertexAttributeDefines + material._getFingerPrint() + definitions + componentDataAccessMethodDefinitionsForVertexShader + componentDataAccessMethodDefinitionsForPixelShader + morphedPositionGetter + alphaMode;
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0ZXJpYWxzL2NvcmUvU2hhZGVySGFuZGxlci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IFNoYWRlcml0eU1vZHVsZSwgeyB0eXBlIFNoYWRlcml0eU9iamVjdCB9IGZyb20gJ3NoYWRlcml0eSc7XG5pbXBvcnQgdHlwZSB7IENHQVBJUmVzb3VyY2VIYW5kbGUgfSBmcm9tICcuLi8uLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgdHlwZSB7IFJuV2ViR0wgfSBmcm9tICcuLi8uLi8uLi93ZWJnbC9tYWluJztcbmltcG9ydCB0eXBlIHsgR2xzbENvbW1vbkNodW5rcyB9IGZyb20gJy4uLy4uLy4uL3dlYmdsL3NoYWRlcnMvZ2xzbENvbW1vbkNodW5rcyc7XG5pbXBvcnQgdHlwZSB7IEF0dHJpYnV0ZU5hbWVzIH0gZnJvbSAnLi4vLi4vLi4vd2ViZ2wvdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBXZWJHTENvbnRleHRXcmFwcGVyIH0gZnJvbSAnLi4vLi4vLi4vd2ViZ2wvV2ViR0xDb250ZXh0V3JhcHBlcic7XG5pbXBvcnQgdHlwZSB7IFNoYWRlclNvdXJjZXMgfSBmcm9tICcuLi8uLi8uLi93ZWJnbC9XZWJHTFN0cmF0ZWd5JztcbmltcG9ydCB0eXBlIHsgUm5XZWJHcHUgfSBmcm9tICcuLi8uLi8uLi93ZWJncHUvbWFpbic7XG5pbXBvcnQgdHlwZSB7IFdnc2xDb21tb25DaHVua3MgfSBmcm9tICcuLi8uLi8uLi93ZWJncHUvd2dzbENvbW1vbkNodW5rcyc7XG5pbXBvcnQgeyBXZWxsS25vd25Db21wb25lbnRUSURzIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9XZWxsS25vd25Db21wb25lbnRUSURzJztcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvcmUvQ29tcG9uZW50JztcbmltcG9ydCB7IFByb2Nlc3NBcHByb2FjaCB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1Byb2Nlc3NBcHByb2FjaCc7XG5pbXBvcnQgdHlwZSB7XG4gIGdldFNoYWRlclByb3BlcnR5RnVuY09mR2xvYmFsRGF0YVJlcG9zaXRvcnksXG4gIGdldFNoYWRlclByb3BlcnR5RnVuY09mTWF0ZXJpYWwsXG59IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1NoYWRlclNlbWFudGljcyc7XG5pbXBvcnQgdHlwZSB7IFZlcnRleEF0dHJpYnV0ZUVudW0gfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9WZXJ0ZXhBdHRyaWJ1dGUnO1xuaW1wb3J0IHR5cGUgeyBQcmltaXRpdmUgfSBmcm9tICcuLi8uLi9nZW9tZXRyeS9QcmltaXRpdmUnO1xuaW1wb3J0IHsgSXMgfSBmcm9tICcuLi8uLi9taXNjL0lzJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgeyBNb2R1bGVNYW5hZ2VyIH0gZnJvbSAnLi4vLi4vc3lzdGVtL01vZHVsZU1hbmFnZXInO1xuaW1wb3J0IHR5cGUgeyBBYnN0cmFjdE1hdGVyaWFsQ29udGVudCB9IGZyb20gJy4vQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQnO1xuaW1wb3J0IHR5cGUgeyBNYXRlcmlhbCB9IGZyb20gJy4vTWF0ZXJpYWwnO1xuaW1wb3J0IHsgU2hhZGVyaXR5VXRpbGl0eVdlYkdMIGFzIFNoYWRlcml0eVV0aWxpdHlXZWJHTF8gfSBmcm9tICcuL1NoYWRlcml0eVV0aWxpdHlXZWJHTCc7XG5pbXBvcnQgeyBTaGFkZXJpdHlVdGlsaXR5V2ViR1BVIGFzIFNoYWRlcml0eVV0aWxpdHlXZWJHUFVfIH0gZnJvbSAnLi9TaGFkZXJpdHlVdGlsaXR5V2ViR1BVJztcblxuLy8gQSBiYWNrZW5kIGV4Y2x1ZGVkIGF0IGJ1aWxkIHRpbWUgKHNlZSBzcmMvYmFja2VuZEZsYWdzLmQudHMpIGlzIGRyb3BwZWQgYnkgdGhlIGJ1bmRsZXIuXG5jb25zdCBTaGFkZXJpdHlVdGlsaXR5V2ViR0wgPSAoXG4gIHR5cGVvZiBfX1JOX1dFQkdMX18gPT09ICd1bmRlZmluZWQnIHx8IF9fUk5fV0VCR0xfXyA/IFNoYWRlcml0eVV0aWxpdHlXZWJHTF8gOiB1bmRlZmluZWRcbikgYXMgdHlwZW9mIFNoYWRlcml0eVV0aWxpdHlXZWJHTF87XG5jb25zdCBTaGFkZXJpdHlVdGlsaXR5V2ViR1BVID0gKFxuICB0eXBlb2YgX19STl9XRUJHUFVfXyA9PT0gJ3VuZGVmaW5lZCcgfHwgX19STl9XRUJHUFVfXyA/IFNoYWRlcml0eVV0aWxpdHlXZWJHUFVfIDogdW5kZWZpbmVkXG4pIGFzIHR5cGVvZiBTaGFkZXJpdHlVdGlsaXR5V2ViR1BVXztcblxuY29uc3QgU2hhZGVyaXR5ID0gKFNoYWRlcml0eU1vZHVsZSBhcyBhbnkpLmRlZmF1bHQgfHwgU2hhZGVyaXR5TW9kdWxlO1xuXG4vKipcbiAqIFRoZSBjb21tb24gR0xTTCBjaHVua3MgY29tZSB3aXRoIHRoZSBXZWJHTCBtb2R1bGUgKGxvYWRlZCBieSBFbmdpbmUuaW5pdCBmb3IgUHJvY2Vzc0FwcHJvYWNoLldlYkdMMiksXG4gKiBzbyB0aGF0IFdlYkdQVSBhcHBsaWNhdGlvbnMgZG8gbm90IGJ1bmRsZSB0aGVtLlxuICovXG5mdW5jdGlvbiBfX2dldEdsc2xDb21tb25DaHVua3MoKTogR2xzbENvbW1vbkNodW5rcyB7XG4gIGNvbnN0IHdlYmdsTW9kdWxlID0gTW9kdWxlTWFuYWdlci5nZXRJbnN0YW5jZSgpLmdldE1vZHVsZSgnd2ViZ2wnKSBhcyBSbldlYkdMIHwgdW5kZWZpbmVkO1xuICBpZiAod2ViZ2xNb2R1bGUgPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBFcnJvcignVGhlIFdlYkdMIG1vZHVsZSBpcyBub3QgbG9hZGVkLiBJbml0aWFsaXplIHRoZSBlbmdpbmUgd2l0aCBQcm9jZXNzQXBwcm9hY2guV2ViR0wyIGZpcnN0LicpO1xuICB9XG4gIHJldHVybiB3ZWJnbE1vZHVsZS5nbHNsQ29tbW9uQ2h1bmtzO1xufVxuXG4vKipcbiAqIFRoZSBjb21tb24gV0dTTCBjaHVua3MgY29tZSB3aXRoIHRoZSBXZWJHUFUgbW9kdWxlIChsb2FkZWQgYnkgRW5naW5lLmluaXQgZm9yIFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpLFxuICogc28gdGhhdCBXZWJHTCBhcHBsaWNhdGlvbnMgZG8gbm90IGJ1bmRsZSB0aGVtLlxuICovXG5mdW5jdGlvbiBfX2dldFdnc2xDb21tb25DaHVua3MoKTogV2dzbENvbW1vbkNodW5rcyB7XG4gIGNvbnN0IHdlYmdwdU1vZHVsZSA9IE1vZHVsZU1hbmFnZXIuZ2V0SW5zdGFuY2UoKS5nZXRNb2R1bGUoJ3dlYmdwdScpIGFzIFJuV2ViR3B1IHwgdW5kZWZpbmVkO1xuICBpZiAod2ViZ3B1TW9kdWxlID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBXZWJHUFUgbW9kdWxlIGlzIG5vdCBsb2FkZWQuIEluaXRpYWxpemUgdGhlIGVuZ2luZSB3aXRoIFByb2Nlc3NBcHByb2FjaC5XZWJHUFUgZmlyc3QuJyk7XG4gIH1cbiAgcmV0dXJuIHdlYmdwdU1vZHVsZS53Z3NsQ29tbW9uQ2h1bmtzO1xufVxuXG4vKipcbiAqIEhhbmRsZXMgc2hhZGVyIHByb2dyYW0gY3JlYXRpb24sIGNhY2hpbmcsIGFuZCBtYW5hZ2VtZW50IGZvciB0aGUgcmVuZGVyaW5nIHN5c3RlbS5cbiAqIFByb3ZpZGVzIHV0aWxpdGllcyBmb3IgY3JlYXRpbmcgc2hhZGVyIHByb2dyYW1zIHdpdGggV2ViR0wgYW5kIFdlYkdQVSBiYWNrZW5kcy5cbiAqXG4gKiBAcmVtYXJrc1xuICogU2hhZGVyIHByb2dyYW0gY2FjaGluZyBpcyBtYW5hZ2VkIHBlci1FbmdpbmUgaW5zdGFuY2UgdG8gcHJldmVudCBjcm9zcy1jb250YW1pbmF0aW9uXG4gKiBiZXR3ZWVuIGRpZmZlcmVudCBXZWJHTCBjb250ZXh0cy4gV2hlbiBhbiBFbmdpbmUgaXMgZGVzdHJveWVkLCBpdHMgc2hhZGVyIGNhY2hlXG4gKiBpcyBhdXRvbWF0aWNhbGx5IGNsZWFuZWQgdXAuXG4gKi9cbmV4cG9ydCBjbGFzcyBTaGFkZXJIYW5kbGVyIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBzaGFkZXIgcHJvZ3JhbSBvciByZXRyaWV2ZXMgaXQgZnJvbSBjYWNoZSBpZiBhbHJlYWR5IGNvbXBpbGVkLlxuICAgKiBUaGlzIG1ldGhvZCBpbXBsZW1lbnRzIHNoYWRlciBwcm9ncmFtIGNhY2hpbmcgdG8gYXZvaWQgcmVkdW5kYW50IGNvbXBpbGF0aW9uXG4gICAqIG9mIGlkZW50aWNhbCBzaGFkZXIgY29tYmluYXRpb25zLiBUaGUgY2FjaGUgaXMgc3RvcmVkIHBlci1FbmdpbmUgaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlIHRoYXQgb3ducyB0aGUgc2hhZGVyIGNhY2hlXG4gICAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCB0aGF0IHdpbGwgdXNlIHRoaXMgc2hhZGVyIHByb2dyYW1cbiAgICogQHBhcmFtIHByaW1pdGl2ZSAtIFRoZSBnZW9tZXRyaWMgcHJpbWl0aXZlIHRoYXQgZGVmaW5lcyB2ZXJ0ZXggYXR0cmlidXRlc1xuICAgKiBAcGFyYW0gdmVydGV4U2hhZGVyIC0gVGhlIHZlcnRleCBzaGFkZXIgc291cmNlIGNvZGVcbiAgICogQHBhcmFtIHBpeGVsU2hhZGVyIC0gVGhlIGZyYWdtZW50L3BpeGVsIHNoYWRlciBzb3VyY2UgY29kZVxuICAgKiBAcGFyYW0gYXR0cmlidXRlTmFtZXMgLSBBcnJheSBvZiB2ZXJ0ZXggYXR0cmlidXRlIG5hbWVzXG4gICAqIEBwYXJhbSBhdHRyaWJ1dGVTZW1hbnRpY3MgLSBBcnJheSBvZiB2ZXJ0ZXggYXR0cmlidXRlIHNlbWFudGljIG1lYW5pbmdzXG4gICAqIEBwYXJhbSBvbkVycm9yIC0gT3B0aW9uYWwgZXJyb3IgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICogQHJldHVybnMgQSB0dXBsZSBjb250YWluaW5nIHRoZSBzaGFkZXIgcHJvZ3JhbSBoYW5kbGUgYW5kIGEgYm9vbGVhbiBpbmRpY2F0aW5nIGlmIGl0J3MgbmV3bHkgY3JlYXRlZFxuICAgKi9cbiAgc3RhdGljIF9jcmVhdGVTaGFkZXJQcm9ncmFtV2l0aENhY2hlKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIG1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgICBwcmltaXRpdmU6IFByaW1pdGl2ZSxcbiAgICB2ZXJ0ZXhTaGFkZXI6IHN0cmluZyxcbiAgICBwaXhlbFNoYWRlcjogc3RyaW5nLFxuICAgIGF0dHJpYnV0ZU5hbWVzOiBBdHRyaWJ1dGVOYW1lcyxcbiAgICBhdHRyaWJ1dGVTZW1hbnRpY3M6IFZlcnRleEF0dHJpYnV0ZUVudW1bXSxcbiAgICBvbkVycm9yPzogKG1lc3NhZ2U6IHN0cmluZykgPT4gdm9pZFxuICApOiBbQ0dBUElSZXNvdXJjZUhhbmRsZSwgYm9vbGVhbl0ge1xuICAgIC8vIFVzZSB0aGUgZW5naW5lJ3Mgc2hhZGVyIHByb2dyYW0gY2FjaGVcbiAgICBjb25zdCBzaGFkZXJDYWNoZSA9IGVuZ2luZS5zaGFkZXJQcm9ncmFtQ2FjaGU7XG4gICAgY29uc3Qgd2hvbGVTaGFkZXJUZXh0ID0gX19yZW1vdmVDb21tZW50c0Zyb21TaGFkZXIodmVydGV4U2hhZGVyICsgcGl4ZWxTaGFkZXIpO1xuICAgIGxldCBzaGFkZXJQcm9ncmFtVWlkID0gc2hhZGVyQ2FjaGUuZ2V0KHdob2xlU2hhZGVyVGV4dCk7XG4gICAgaWYgKHNoYWRlclByb2dyYW1VaWQgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFtzaGFkZXJQcm9ncmFtVWlkLCBmYWxzZV07XG4gICAgfVxuXG4gICAgY29uc3QgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgPSBlbmdpbmUuY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgc2hhZGVyUHJvZ3JhbVVpZCA9IGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5LmNyZWF0ZVNoYWRlclByb2dyYW0oe1xuICAgICAgY29uZmlnOiBlbmdpbmUuY29uZmlnLFxuICAgICAgZW5naW5lLFxuICAgICAgbWF0ZXJpYWwsXG4gICAgICBwcmltaXRpdmUsXG4gICAgICB2ZXJ0ZXhTaGFkZXJTdHI6IHZlcnRleFNoYWRlcixcbiAgICAgIGZyYWdtZW50U2hhZGVyU3RyOiBwaXhlbFNoYWRlcixcbiAgICAgIGF0dHJpYnV0ZU5hbWVzOiBhdHRyaWJ1dGVOYW1lcyxcbiAgICAgIGF0dHJpYnV0ZVNlbWFudGljczogYXR0cmlidXRlU2VtYW50aWNzLFxuICAgICAgb25FcnJvcixcbiAgICB9KTtcbiAgICBzaGFkZXJDYWNoZS5zZXQod2hvbGVTaGFkZXJUZXh0LCBzaGFkZXJQcm9ncmFtVWlkKTtcbiAgICByZXR1cm4gW3NoYWRlclByb2dyYW1VaWQsIHRydWVdO1xuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlcyBjb21tZW50cyBmcm9tIHNoYWRlciBzb3VyY2UgY29kZSB0byBub3JtYWxpemUgaXQgZm9yIGNhY2hpbmcgcHVycG9zZXMuXG4gKiBUaGlzIGVuc3VyZXMgdGhhdCBmdW5jdGlvbmFsbHkgaWRlbnRpY2FsIHNoYWRlcnMgd2l0aCBkaWZmZXJlbnQgY29tbWVudHNcbiAqIGFyZSBwcm9wZXJseSBjYWNoZWQgdG9nZXRoZXIuXG4gKlxuICogQHBhcmFtIHNoYWRlciAtIFRoZSBzaGFkZXIgc291cmNlIGNvZGUgdG8gcHJvY2Vzc1xuICogQHJldHVybnMgVGhlIHNoYWRlciBzb3VyY2UgY29kZSB3aXRoIGNvbW1lbnRzIHJlbW92ZWRcbiAqL1xuZnVuY3Rpb24gX19yZW1vdmVDb21tZW50c0Zyb21TaGFkZXIoc2hhZGVyOiBzdHJpbmcpIHtcbiAgcmV0dXJuIHNoYWRlci5yZXBsYWNlKC9cXC9cXC8uKnxcXC9cXCpbXFxzXFxTXSo/XFwqXFwvL2csICcnKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgc2hhZGVyIHByb2dyYW0gdXNpbmcgcHJlLXByb2Nlc3NlZCBzaGFkZXIgc291cmNlcy5cbiAqIFRoaXMgZnVuY3Rpb24gaXMgdXNlZCB3aGVuIHNoYWRlciBzb3VyY2VzIGhhdmUgYWxyZWFkeSBiZWVuIHVwZGF0ZWRcbiAqIGFuZCBwcm9jZXNzZWQgdGhyb3VnaCB0aGUgc2hhZGVyIGNvbXBpbGF0aW9uIHBpcGVsaW5lLlxuICpcbiAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgdGhhdCB3aWxsIHVzZSB0aGlzIHNoYWRlciBwcm9ncmFtXG4gKiBAcGFyYW0gcHJpbWl0aXZlIC0gVGhlIGdlb21ldHJpYyBwcmltaXRpdmUgdGhhdCBkZWZpbmVzIHZlcnRleCBhdHRyaWJ1dGVzXG4gKiBAcGFyYW0gbWF0ZXJpYWxOb2RlIC0gVGhlIG1hdGVyaWFsIGNvbnRlbnQgbm9kZSBjb250YWluaW5nIHNoYWRlciBvYmplY3RzXG4gKiBAcGFyYW0gdXBkYXRlZFNoYWRlclNvdXJjZXMgLSBQcmUtcHJvY2Vzc2VkIHZlcnRleCBhbmQgZnJhZ21lbnQgc2hhZGVyIHNvdXJjZXNcbiAqIEBwYXJhbSBvbkVycm9yIC0gT3B0aW9uYWwgZXJyb3IgY2FsbGJhY2sgZnVuY3Rpb25cbiAqIEByZXR1cm5zIEEgdHVwbGUgY29udGFpbmluZyB0aGUgc2hhZGVyIHByb2dyYW0gaGFuZGxlIGFuZCBhIGJvb2xlYW4gaW5kaWNhdGluZyBpZiBpdCdzIG5ld2x5IGNyZWF0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF9jcmVhdGVQcm9ncmFtQXNTaW5nbGVPcGVyYXRpb25CeVVwZGF0ZWRTb3VyY2VzKFxuICBlbmdpbmU6IEVuZ2luZSxcbiAgbWF0ZXJpYWw6IE1hdGVyaWFsLFxuICBwcmltaXRpdmU6IFByaW1pdGl2ZSxcbiAgbWF0ZXJpYWxOb2RlOiBBYnN0cmFjdE1hdGVyaWFsQ29udGVudCxcbiAgdXBkYXRlZFNoYWRlclNvdXJjZXM6IFNoYWRlclNvdXJjZXMsXG4gIG9uRXJyb3I/OiAobWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkXG4pOiBbQ0dBUElSZXNvdXJjZUhhbmRsZSwgYm9vbGVhbl0ge1xuICBjb25zdCB7IGF0dHJpYnV0ZU5hbWVzLCBhdHRyaWJ1dGVTZW1hbnRpY3MgfSA9IF9nZXRBdHRyaWJ1dGVJbmZvKG1hdGVyaWFsTm9kZS52ZXJ0ZXhTaGFkZXJpdHlPYmplY3QhKTtcblxuICBjb25zdCBbc2hhZGVyUHJvZ3JhbVVpZCwgbmV3T25lXSA9IFNoYWRlckhhbmRsZXIuX2NyZWF0ZVNoYWRlclByb2dyYW1XaXRoQ2FjaGUoXG4gICAgZW5naW5lLFxuICAgIG1hdGVyaWFsLFxuICAgIHByaW1pdGl2ZSxcbiAgICB1cGRhdGVkU2hhZGVyU291cmNlcy52ZXJ0ZXgsXG4gICAgdXBkYXRlZFNoYWRlclNvdXJjZXMucGl4ZWwsXG4gICAgYXR0cmlidXRlTmFtZXMsXG4gICAgYXR0cmlidXRlU2VtYW50aWNzLFxuICAgIG9uRXJyb3JcbiAgKTtcblxuICByZXR1cm4gW3NoYWRlclByb2dyYW1VaWQsIG5ld09uZV07XG59XG5cbi8qKlxuICogRXh0cmFjdHMgdmVydGV4IGF0dHJpYnV0ZSBpbmZvcm1hdGlvbiBmcm9tIGEgU2hhZGVyaXR5IG9iamVjdC5cbiAqIFRoaXMgaW5jbHVkZXMgYm90aCBhdHRyaWJ1dGUgbmFtZXMgYW5kIHRoZWlyIHNlbWFudGljIG1lYW5pbmdzLFxuICogd2hpY2ggYXJlIGVzc2VudGlhbCBmb3IgcHJvcGVyIHZlcnRleCBidWZmZXIgYmluZGluZy5cbiAqXG4gKiBAcGFyYW0gc2hhZGVyaXR5T2JqZWN0IC0gVGhlIFNoYWRlcml0eSBvYmplY3QgY29udGFpbmluZyBzaGFkZXIgcmVmbGVjdGlvbiBkYXRhXG4gKiBAcmV0dXJucyBBbiBvYmplY3QgY29udGFpbmluZyBhdHRyaWJ1dGUgbmFtZXMgYW5kIHRoZWlyIGNvcnJlc3BvbmRpbmcgc2VtYW50aWNzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfZ2V0QXR0cmlidXRlSW5mbyhzaGFkZXJpdHlPYmplY3Q6IFNoYWRlcml0eU9iamVjdCkge1xuICBjb25zdCByZWZsZWN0aW9uID0gU2hhZGVyaXR5VXRpbGl0eVdlYkdMLmdldEF0dHJpYnV0ZVJlZmxlY3Rpb24oc2hhZGVyaXR5T2JqZWN0KTtcbiAgY29uc3QgYXR0cmlidXRlTmFtZXMgPSByZWZsZWN0aW9uLm5hbWVzO1xuICBjb25zdCBhdHRyaWJ1dGVTZW1hbnRpY3MgPSByZWZsZWN0aW9uLnNlbWFudGljcztcbiAgcmV0dXJuIHsgYXR0cmlidXRlTmFtZXMsIGF0dHJpYnV0ZVNlbWFudGljcyB9O1xufVxuXG4vKipcbiAqIEdlbmVyYXRlcyBhIGZvcm1hdHRlZCBzdHJpbmcgY29udGFpbmluZyB2ZXJ0ZXggYXR0cmlidXRlIGJpbmRpbmcgaW5mb3JtYXRpb24uXG4gKiBUaGlzIGlzIHByaW1hcmlseSB1c2VkIGZvciBkZWJ1Z2dpbmcgYW5kIHNoYWRlciBpbnNwZWN0aW9uIHB1cnBvc2VzLFxuICogcHJvdmlkaW5nIGNsZWFyIG1hcHBpbmcgYmV0d2VlbiBhdHRyaWJ1dGUgbmFtZXMgYW5kIHRoZWlyIHNlbWFudGljcy5cbiAqXG4gKiBAcGFyYW0gYXR0cmlidXRlTmFtZXMgLSBBcnJheSBvZiB2ZXJ0ZXggYXR0cmlidXRlIG5hbWVzXG4gKiBAcGFyYW0gYXR0cmlidXRlU2VtYW50aWNzIC0gQXJyYXkgb2YgY29ycmVzcG9uZGluZyB2ZXJ0ZXggYXR0cmlidXRlIHNlbWFudGljc1xuICogQHJldHVybnMgQSBmb3JtYXR0ZWQgc3RyaW5nIHdpdGggYXR0cmlidXRlIGJpbmRpbmcgaW5mb3JtYXRpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF9vdXRwdXRWZXJ0ZXhBdHRyaWJ1dGVCaW5kaW5nSW5mbyhhdHRyaWJ1dGVOYW1lczogc3RyaW5nW10sIGF0dHJpYnV0ZVNlbWFudGljczogVmVydGV4QXR0cmlidXRlRW51bVtdKSB7XG4gIGxldCB2ZXJ0ZXhBdHRyaWJ1dGVzQmluZGluZyA9ICdcXG4vLyBWZXJ0ZXggQXR0cmlidXRlcyBCaW5kaW5nIEluZm9cXG4nO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJpYnV0ZU5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmVydGV4QXR0cmlidXRlc0JpbmRpbmcgKz0gYC8vICR7YXR0cmlidXRlTmFtZXNbaV19OiAke2F0dHJpYnV0ZVNlbWFudGljc1tpXS5zdHJ9IFxcbmA7XG4gIH1cbiAgcmV0dXJuIHZlcnRleEF0dHJpYnV0ZXNCaW5kaW5nO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBjb21wbGV0ZSBzaGFkZXIgcHJvZ3JhbSBmb3IgV2ViR0wgcmVuZGVyaW5nLlxuICogVGhpcyBmdW5jdGlvbiBoYW5kbGVzIHRoZSBlbnRpcmUgc2hhZGVyIGNvbXBpbGF0aW9uIHBpcGVsaW5lIGluY2x1ZGluZzpcbiAqIC0gTWF0ZXJpYWwgcHJvcGVydHkgZXh0cmFjdGlvbiBhbmQgZW1iZWRkaW5nXG4gKiAtIFNoYWRlciBkZWZpbml0aW9uIGdlbmVyYXRpb25cbiAqIC0gVGVtcGxhdGUgZmlsbGluZyB3aXRoIHJ1bnRpbWUgdmFsdWVzXG4gKiAtIEZpbmFsIHNoYWRlciBjb21waWxhdGlvbiBhbmQgbGlua2luZ1xuICpcbiAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgY29udGFpbmluZyBzaGFkZXIgdGVtcGxhdGVzIGFuZCBwcm9wZXJ0aWVzXG4gKiBAcGFyYW0gY29tcG9uZW50RGF0YUFjY2Vzc01ldGhvZERlZmluaXRpb25zRm9yVmVydGV4U2hhZGVyIC0gbWV0aG9kIGRlZmluaXRpb25zIGZvciBjb21wb25lbnQgZGF0YSBhY2Nlc3MgZm9yIHZlcnRleCBzaGFkZXJcbiAqIEBwYXJhbSBjb21wb25lbnREYXRhQWNjZXNzTWV0aG9kRGVmaW5pdGlvbnNGb3JQaXhlbFNoYWRlciAtIG1ldGhvZCBkZWZpbml0aW9ucyBmb3IgY29tcG9uZW50IGRhdGEgYWNjZXNzIGZvciBwaXhlbCBzaGFkZXJcbiAqIEBwYXJhbSBwcm9wZXJ0eVNldHRlck9mR2xvYmFsRGF0YVJlcG9zaXRvcnkgLSBGdW5jdGlvbiBmb3Igc2V0dGluZyBzaGFkZXIgcHJvcGVydGllcyBvZiBnbG9iYWwgZGF0YSByZXBvc2l0b3J5XG4gKiBAcGFyYW0gcHJvcGVydHlTZXR0ZXJPZk1hdGVyaWFsIC0gRnVuY3Rpb24gZm9yIHNldHRpbmcgc2hhZGVyIHByb3BlcnRpZXMgb2YgbWF0ZXJpYWxcbiAqIEBwYXJhbSBtb3JwaGVkUG9zaXRpb25HZXR0ZXIgLSBGdW5jdGlvbiB0byBnZXQgdGhlIG1vcnBoZWQgcG9zaXRpb25cbiAqIEBwYXJhbSBwcmltaXRpdmUgLSBUaGUgZ2VvbWV0cmljIHByaW1pdGl2ZSB0aGF0IGRlZmluZXMgdmVydGV4IGF0dHJpYnV0ZXNcbiAqIEByZXR1cm5zIEEgdHVwbGUgY29udGFpbmluZyB0aGUgc2hhZGVyIHByb2dyYW0gaGFuZGxlIGFuZCBhIGJvb2xlYW4gaW5kaWNhdGluZyBpZiBpdCdzIG5ld2x5IGNyZWF0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF9jcmVhdGVQcm9ncmFtQXNTaW5nbGVPcGVyYXRpb25XZWJHTChcbiAgZW5naW5lOiBFbmdpbmUsXG4gIG1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgY29tcG9uZW50RGF0YUFjY2Vzc01ldGhvZERlZmluaXRpb25zRm9yVmVydGV4U2hhZGVyOiBzdHJpbmcsXG4gIGNvbXBvbmVudERhdGFBY2Nlc3NNZXRob2REZWZpbml0aW9uc0ZvclBpeGVsU2hhZGVyOiBzdHJpbmcsXG4gIHByb3BlcnR5U2V0dGVyT2ZHbG9iYWxEYXRhUmVwb3NpdG9yeTogZ2V0U2hhZGVyUHJvcGVydHlGdW5jT2ZHbG9iYWxEYXRhUmVwb3NpdG9yeSxcbiAgcHJvcGVydHlTZXR0ZXJPZk1hdGVyaWFsOiBnZXRTaGFkZXJQcm9wZXJ0eUZ1bmNPZk1hdGVyaWFsLFxuICBtb3JwaGVkUG9zaXRpb25HZXR0ZXI6IHN0cmluZyxcbiAgcHJpbWl0aXZlOiBQcmltaXRpdmVcbik6IFtDR0FQSVJlc291cmNlSGFuZGxlLCBib29sZWFuXSB7XG4gIGNvbnN0IHZlcnRleEF0dHJpYnV0ZURlZmluZXMgPSBkZWZpbmVBdHRyaWJ1dGVzKHByaW1pdGl2ZSk7XG4gIGNvbnN0IG1hdGVyaWFsTm9kZSA9IG1hdGVyaWFsLl9tYXRlcmlhbENvbnRlbnQ7XG4gIGxldCBkZWZpbml0aW9ucyA9IG1hdGVyaWFsTm9kZS5nZXREZWZpbml0aW9ucygpO1xuICBjb25zdCBzaGFkZXJEZWZpbmVzID0gbWF0ZXJpYWwuZ2V0U2hhZGVyRGVmaW5lcygpO1xuICBmb3IgKGNvbnN0IHNoYWRlckRlZmluZSBvZiBzaGFkZXJEZWZpbmVzKSB7XG4gICAgZGVmaW5pdGlvbnMgKz0gYCNkZWZpbmUgJHtzaGFkZXJEZWZpbmV9XFxuYDtcbiAgfVxuICBkZWZpbml0aW9ucyArPSB2ZXJ0ZXhBdHRyaWJ1dGVEZWZpbmVzO1xuXG4gIGxldCBhbHBoYU1vZGUgPSAnJztcbiAgaWYgKG1hdGVyaWFsLmlzQmxlbmQoKSkge1xuICAgIGFscGhhTW9kZSArPSAnI2RlZmluZSBSTl9JU19BTFBIQV9NT0RFX0JMRU5EXFxuJztcbiAgfVxuICBpZiAobWF0ZXJpYWwuaXNNYXNrKCkpIHtcbiAgICBhbHBoYU1vZGUgKz0gJyNkZWZpbmUgUk5fSVNfQUxQSEFfTU9ERV9NQVNLXFxuJztcbiAgfVxuXG4gIC8vIERldGVybWluZSBpZiBNdWx0aS1WaWV3IHJlbmRlcmluZyBpcyBlbmFibGVkIGZvciBXZWJYUlxuICBjb25zdCB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeSA9IGVuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeTtcbiAgY29uc3Qgd2ViWFJTeXN0ZW0gPSBlbmdpbmUuX3dlYlhSU3lzdGVtSWZFbmFibGVkO1xuICBjb25zdCBpc011bHRpVmlld1ZSUmVuZGVyaW5nID1cbiAgICBJcy5leGlzdCh3ZWJYUlN5c3RlbSkgJiYgd2ViWFJTeXN0ZW0/LmlzV2ViWFJNb2RlICYmIHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmlzU3VwcG9ydE11bHRpVmlld1ZSUmVuZGVyaW5nKGVuZ2luZSk7XG5cbiAgY29uc3QgY2FjaGVRdWVyeSA9XG4gICAgQ29tcG9uZW50LmdldFN0YXRlVmVyc2lvbihlbmdpbmUpICtcbiAgICBlbmdpbmUubWF0ZXJpYWxSZXBvc2l0b3J5Ll9nZXRCdWZmZXJWaWV3VmVyc2lvbihtYXRlcmlhbC5fX21hdGVyaWFsVHlwZU5hbWUpICtcbiAgICBtYXRlcmlhbC5fX21hdGVyaWFsVHlwZU5hbWUgK1xuICAgIG1hdGVyaWFsLl9tYXRlcmlhbENvbnRlbnQuZ2V0TWF0ZXJpYWxTZW1hbnRpY3NWYXJpYW50TmFtZSgpICtcbiAgICB2ZXJ0ZXhBdHRyaWJ1dGVEZWZpbmVzICtcbiAgICBtYXRlcmlhbC5fZ2V0RmluZ2VyUHJpbnQoKSArXG4gICAgZGVmaW5pdGlvbnMgK1xuICAgIG1vcnBoZWRQb3NpdGlvbkdldHRlciArXG4gICAgY29tcG9uZW50RGF0YUFjY2Vzc01ldGhvZERlZmluaXRpb25zRm9yVmVydGV4U2hhZGVyICtcbiAgICBjb21wb25lbnREYXRhQWNjZXNzTWV0aG9kRGVmaW5pdGlvbnNGb3JQaXhlbFNoYWRlciArXG4gICAgbW9ycGhlZFBvc2l0aW9uR2V0dGVyICtcbiAgICBhbHBoYU1vZGUgK1xuICAgIChpc011bHRpVmlld1ZSUmVuZGVyaW5nID8gJ1dFQkdMMl9NVUxUSV9WSUVXJyA6ICcnKTtcblxuICAvLyBVc2UgdGhlIGVuZ2luZSdzIHNoYWRlciBwcm9ncmFtIGNhY2hlXG4gIGNvbnN0IHNoYWRlckNhY2hlID0gZW5naW5lLnNoYWRlclByb2dyYW1DYWNoZTtcbiAgbGV0IHNoYWRlclByb2dyYW1VaWQgPSBzaGFkZXJDYWNoZS5nZXQoY2FjaGVRdWVyeSk7XG4gIGlmIChzaGFkZXJQcm9ncmFtVWlkICE9IG51bGwpIHtcbiAgICByZXR1cm4gW3NoYWRlclByb2dyYW1VaWQsIGZhbHNlXTtcbiAgfVxuXG4gIGNvbnN0IHsgdmVydGV4UHJvcGVydGllc1N0ciwgcGl4ZWxQcm9wZXJ0aWVzU3RyIH0gPSBtYXRlcmlhbC5fZ2V0UHJvcGVydGllcyhcbiAgICBlbmdpbmUsXG4gICAgcHJvcGVydHlTZXR0ZXJPZkdsb2JhbERhdGFSZXBvc2l0b3J5LFxuICAgIHByb3BlcnR5U2V0dGVyT2ZNYXRlcmlhbFxuICApO1xuXG4gIC8vIFNoYWRlciBDb2RlIENvbnN0cnVjdGlvblxuICBsZXQgdmVydGV4U2hhZGVyID0gX3NldHVwR2xvYmFsU2hhZGVyRGVmaW5pdGlvbldlYkdMKGVuZ2luZSwgbWF0ZXJpYWwuX19tYXRlcmlhbFR5cGVOYW1lLCBwcmltaXRpdmUpO1xuICB2ZXJ0ZXhTaGFkZXIgKz0gJyNkZWZpbmUgUk5fSVNfVkVSVEVYX1NIQURFUlxcbic7XG4gIGxldCBwaXhlbFNoYWRlciA9IF9zZXR1cEdsb2JhbFNoYWRlckRlZmluaXRpb25XZWJHTChlbmdpbmUsIG1hdGVyaWFsLl9fbWF0ZXJpYWxUeXBlTmFtZSwgcHJpbWl0aXZlKTtcbiAgcGl4ZWxTaGFkZXIgKz0gJyNkZWZpbmUgUk5fSVNfUElYRUxfU0hBREVSXFxuJztcblxuICBjb25zdCBnbHNsQ2h1bmtzID0gX19nZXRHbHNsQ29tbW9uQ2h1bmtzKCk7XG4gIGNvbnN0IHZlcnRleFNoYWRlcml0eU9iamVjdCA9IFNoYWRlcml0eVV0aWxpdHlXZWJHTC5maWxsVGVtcGxhdGUoXG4gICAgZW5naW5lLFxuICAgIG1hdGVyaWFsTm9kZS52ZXJ0ZXhTaGFkZXJpdHlPYmplY3QhLFxuICAgIHByaW1pdGl2ZSxcbiAgICB7XG4gICAgICBlbmFibGVWZXJ0ZXhFeHRlbnNpb25zOiBnbHNsQ2h1bmtzLmVuYWJsZVZlcnRleEV4dGVuc2lvbnMsXG4gICAgICBnbHNsUHJlY2lzaW9uOiBnbHNsQ2h1bmtzLmdsc2xQcmVjaXNpb24sXG4gICAgICB2ZXJ0ZXhJbk91dDogZ2xzbENodW5rcy52ZXJ0ZXhJbk91dCxcbiAgICAgIGZ1bGxzY3JlZW46IGdsc2xDaHVua3MuZnVsbHNjcmVlbixcbiAgICAgIFdlbGxLbm93bkNvbXBvbmVudFRJRHMsXG4gICAgICBnZXR0ZXJzOiB2ZXJ0ZXhQcm9wZXJ0aWVzU3RyLFxuICAgICAgZGVmaW5pdGlvbnM6IGRlZmluaXRpb25zLFxuICAgICAgcHJlcmVxdWlzaXRlczogZ2xzbENodW5rcy5wcmVyZXF1aXNpdGVzLFxuICAgICAgbWFpblByZXJlcXVpc2l0ZXM6IGdsc2xDaHVua3MubWFpblByZXJlcXVpc2l0ZXMsXG4gICAgICBtYXRyaWNlc0dldHRlcnM6IGNvbXBvbmVudERhdGFBY2Nlc3NNZXRob2REZWZpbml0aW9uc0ZvclZlcnRleFNoYWRlciArIG1vcnBoZWRQb3NpdGlvbkdldHRlcixcbiAgICAgIG9wdGljYWxEZWZpbml0aW9uOiBnbHNsQ2h1bmtzLm9wdGljYWxEZWZpbml0aW9uLFxuICAgICAgc2hhZG93RGVmaW5pdGlvbjogZ2xzbENodW5rcy5zaGFkb3csXG4gICAgICBwYnJEZWZpbml0aW9uOiBnbHNsQ2h1bmtzLnBickRlZmluaXRpb24sXG4gICAgICBpYmxEZWZpbml0aW9uOiBnbHNsQ2h1bmtzLmlibERlZmluaXRpb24sXG4gICAgICBhbHBoYVByb2Nlc3M6IGdsc2xDaHVua3MuYWxwaGFQcm9jZXNzLFxuICAgICAgcHJvY2Vzc0dlb21ldHJ5OiBnbHNsQ2h1bmtzLnByb2Nlc3NHZW9tZXRyeSxcbiAgICAgIENvbmZpZzogZW5naW5lLmNvbmZpZyxcbiAgICB9XG4gICk7XG5cbiAgY29uc3QgcGl4ZWxTaGFkZXJpdHlPYmplY3QgPSBTaGFkZXJpdHlVdGlsaXR5V2ViR0wuZmlsbFRlbXBsYXRlKFxuICAgIGVuZ2luZSxcbiAgICBtYXRlcmlhbE5vZGUucGl4ZWxTaGFkZXJpdHlPYmplY3QhLFxuICAgIHByaW1pdGl2ZSxcbiAgICB7XG4gICAgICBnbHNsUHJlY2lzaW9uOiBnbHNsQ2h1bmtzLmdsc2xQcmVjaXNpb24sXG4gICAgICBXZWxsS25vd25Db21wb25lbnRUSURzLFxuICAgICAgdmVydGV4SW46IGdsc2xDaHVua3MudmVydGV4SW4sXG4gICAgICByZW5kZXJUYXJnZXRCZWdpbjogd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuZ2V0R2xzbFJlbmRlclRhcmdldEJlZ2luU3RyaW5nKDQpLFxuICAgICAgZ2V0dGVyczogcGl4ZWxQcm9wZXJ0aWVzU3RyLFxuICAgICAgZGVmaW5pdGlvbnM6IGRlZmluaXRpb25zICsgYWxwaGFNb2RlLFxuICAgICAgcHJlcmVxdWlzaXRlczogZ2xzbENodW5rcy5wcmVyZXF1aXNpdGVzLFxuICAgICAgbWFpblByZXJlcXVpc2l0ZXM6IGdsc2xDaHVua3MubWFpblByZXJlcXVpc2l0ZXMsXG4gICAgICBtYXRyaWNlc0dldHRlcnM6IGNvbXBvbmVudERhdGFBY2Nlc3NNZXRob2REZWZpbml0aW9uc0ZvclBpeGVsU2hhZGVyLFxuICAgICAgb3B0aWNhbERlZmluaXRpb246IGdsc2xDaHVua3Mub3B0aWNhbERlZmluaXRpb24sXG4gICAgICBwYnJEZWZpbml0aW9uOiBnbHNsQ2h1bmtzLnBickRlZmluaXRpb24sXG4gICAgICBpYmxEZWZpbml0aW9uOiBnbHNsQ2h1bmtzLmlibERlZmluaXRpb24sXG4gICAgICBhbHBoYVByb2Nlc3M6IGdsc2xDaHVua3MuYWxwaGFQcm9jZXNzLFxuICAgICAgb3V0cHV0U3JnYjogZ2xzbENodW5rcy5vdXRwdXRTcmdiLFxuICAgICAgd2lyZWZyYW1lOiBnbHNsQ2h1bmtzLndpcmVmcmFtZSxcbiAgICAgIHNoYWRvd0RlZmluaXRpb246IGdsc2xDaHVua3Muc2hhZG93LFxuICAgICAgQ29uZmlnOiBlbmdpbmUuY29uZmlnLFxuICAgIH1cbiAgKTtcblxuICB2ZXJ0ZXhTaGFkZXIgKz0gdmVydGV4U2hhZGVyaXR5T2JqZWN0LmNvZGUucmVwbGFjZSgvI3ZlcnNpb25cXHMrKDEwMHwzMDBcXHMrZXMpLywgJycpO1xuICBwaXhlbFNoYWRlciArPSBwaXhlbFNoYWRlcml0eU9iamVjdC5jb2RlLnJlcGxhY2UoLyN2ZXJzaW9uXFxzKygxMDB8MzAwXFxzK2VzKS8sICcnKTtcblxuICBjb25zdCB7IGF0dHJpYnV0ZU5hbWVzLCBhdHRyaWJ1dGVTZW1hbnRpY3MgfSA9IF9nZXRBdHRyaWJ1dGVJbmZvKHZlcnRleFNoYWRlcml0eU9iamVjdCk7XG4gIGNvbnN0IHZlcnRleEF0dHJpYnV0ZXNCaW5kaW5nID0gX291dHB1dFZlcnRleEF0dHJpYnV0ZUJpbmRpbmdJbmZvKGF0dHJpYnV0ZU5hbWVzLCBhdHRyaWJ1dGVTZW1hbnRpY3MpO1xuICB2ZXJ0ZXhTaGFkZXIgKz0gdmVydGV4QXR0cmlidXRlc0JpbmRpbmc7XG5cbiAgY29uc3QgcHJlcHJvY2Vzc2VkVmVydGV4ID0gU2hhZGVyaXR5LnByb2Nlc3NQcmFnbWEoXG4gICAge1xuICAgICAgY29kZTogdmVydGV4U2hhZGVyLFxuICAgICAgc2hhZGVyU3RhZ2U6ICd2ZXJ0ZXgnLFxuICAgICAgaXNGcmFnbWVudFNoYWRlcjogZmFsc2UsXG4gICAgfSxcbiAgICB0cnVlXG4gICk7XG4gIGNvbnN0IHByZXByb2Nlc3NlZFBpeGVsID0gU2hhZGVyaXR5LnByb2Nlc3NQcmFnbWEoXG4gICAge1xuICAgICAgY29kZTogcGl4ZWxTaGFkZXIsXG4gICAgICBzaGFkZXJTdGFnZTogJ2ZyYWdtZW50JyxcbiAgICAgIGlzRnJhZ21lbnRTaGFkZXI6IHRydWUsXG4gICAgfSxcbiAgICB0cnVlXG4gICk7XG5cbiAgY29uc3QgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgPSBlbmdpbmUuY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnk7XG4gIHNoYWRlclByb2dyYW1VaWQgPSBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeS5jcmVhdGVTaGFkZXJQcm9ncmFtKHtcbiAgICBjb25maWc6IGVuZ2luZS5jb25maWcsXG4gICAgZW5naW5lLFxuICAgIG1hdGVyaWFsLFxuICAgIHByaW1pdGl2ZSxcbiAgICB2ZXJ0ZXhTaGFkZXJTdHI6IHByZXByb2Nlc3NlZFZlcnRleC5jb2RlLFxuICAgIGZyYWdtZW50U2hhZGVyU3RyOiBwcmVwcm9jZXNzZWRQaXhlbC5jb2RlLFxuICAgIGF0dHJpYnV0ZU5hbWVzOiBhdHRyaWJ1dGVOYW1lcyxcbiAgICBhdHRyaWJ1dGVTZW1hbnRpY3M6IGF0dHJpYnV0ZVNlbWFudGljcyxcbiAgfSk7XG4gIHNoYWRlckNhY2hlLnNldChjYWNoZVF1ZXJ5LCBzaGFkZXJQcm9ncmFtVWlkKTtcbiAgcmV0dXJuIFtzaGFkZXJQcm9ncmFtVWlkLCB0cnVlXTtcbn1cblxuLyoqXG4gKiBTZXRzIHVwIGdsb2JhbCBzaGFkZXIgZGVmaW5pdGlvbnMgYW5kIHByZXByb2Nlc3NvciBkaXJlY3RpdmVzIGZvciBXZWJHTC5cbiAqIFRoaXMgZnVuY3Rpb24gY29uZmlndXJlcyBwbGF0Zm9ybS1zcGVjaWZpYyBzaGFkZXIgZmVhdHVyZXMgaW5jbHVkaW5nOlxuICogLSBXZWJHTCB2ZXJzaW9uIGRldGVjdGlvbiBhbmQgR0xTTCBFUyB2ZXJzaW9uIHNlbGVjdGlvblxuICogLSBVQk8gKFVuaWZvcm0gQnVmZmVyIE9iamVjdCkgc3VwcG9ydCBkZXRlY3Rpb25cbiAqIC0gTXVsdGktdmlldyByZW5kZXJpbmcgZm9yIFdlYlhSXG4gKiAtIEJvbmUgZGF0YSB0eXBlIGRlZmluaXRpb25zXG4gKiAtIFN0YW5kYXJkIGRlcml2YXRpdmVzIGV4dGVuc2lvbiBzdXBwb3J0XG4gKlxuICogQHBhcmFtIG1hdGVyaWFsVHlwZU5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgbWF0ZXJpYWwgdHlwZSBmb3IgZGVidWdnaW5nXG4gKiBAcGFyYW0gcHJpbWl0aXZlIC0gVGhlIGdlb21ldHJpYyBwcmltaXRpdmUgZm9yIGNvbnRleHQtc3BlY2lmaWMgZGVmaW5pdGlvbnNcbiAqIEByZXR1cm5zIEEgc3RyaW5nIGNvbnRhaW5pbmcgYWxsIGdsb2JhbCBzaGFkZXIgZGVmaW5pdGlvbnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF9zZXR1cEdsb2JhbFNoYWRlckRlZmluaXRpb25XZWJHTChlbmdpbmU6IEVuZ2luZSwgbWF0ZXJpYWxUeXBlTmFtZTogc3RyaW5nLCBfcHJpbWl0aXZlOiBQcmltaXRpdmUpIHtcbiAgbGV0IGRlZmluaXRpb25zID0gJyc7XG4gIGNvbnN0IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5ID0gZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuICBjb25zdCBnbHcgPSB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5jdXJyZW50V2ViR0xDb250ZXh0V3JhcHBlciBhcyBXZWJHTENvbnRleHRXcmFwcGVyO1xuICBpZiAoZ2x3LmlzV2ViR0wyKSB7XG4gICAgZGVmaW5pdGlvbnMgKz0gJyN2ZXJzaW9uIDMwMCBlc1xcbiNkZWZpbmUgR0xTTF9FUzNcXG4nO1xuICAgIGlmIChlbmdpbmUuY29uZmlnLmlzVWJvRW5hYmxlZCkge1xuICAgICAgZGVmaW5pdGlvbnMgKz0gJyNkZWZpbmUgUk5fSVNfVUJPX0VOQUJMRURcXG4nO1xuICAgIH1cbiAgfVxuICBkZWZpbml0aW9ucyArPSBgLy8gUk5fTUFURVJJQUxfVFlQRV9OQU1FOiAke21hdGVyaWFsVHlwZU5hbWV9XFxuYDtcbiAgaWYgKFByb2Nlc3NBcHByb2FjaC5pc1dlYkdMMkFwcHJvYWNoKGVuZ2luZS5lbmdpbmVTdGF0ZS5jdXJyZW50UHJvY2Vzc0FwcHJvYWNoKSkge1xuICAgIGRlZmluaXRpb25zICs9ICcjZGVmaW5lIFJOX0lTX1dFQkdMMl9NT0RFXFxuJztcbiAgICBpZiAoZW5naW5lLmNvbmZpZy5pc011bHRpRHJhd0VuYWJsZWQgJiYgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuaXNJbnN0YW5jZVNpZFRleHR1cmVDYXBhYmxlKSB7XG4gICAgICBkZWZpbml0aW9ucyArPSAnI2RlZmluZSBSTl9VU0VfSU5TVEFOQ0VfU0lEX1RFWFRVUkVcXG4nO1xuICAgICAgZGVmaW5pdGlvbnMgKz0gJyNkZWZpbmUgUk5fVVNFX01BVEVSSUFMX1NJRF9BVFRSSUJVVEVcXG4nO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHdlYlhSU3lzdGVtID0gZW5naW5lLl93ZWJYUlN5c3RlbUlmRW5hYmxlZDtcbiAgaWYgKFxuICAgIElzLmV4aXN0KHdlYlhSU3lzdGVtKSAmJlxuICAgIHdlYlhSU3lzdGVtPy5pc1dlYlhSTW9kZSAmJlxuICAgIHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmlzU3VwcG9ydE11bHRpVmlld1ZSUmVuZGVyaW5nKGVuZ2luZSlcbiAgKSB7XG4gICAgZGVmaW5pdGlvbnMgKz0gJyNkZWZpbmUgV0VCR0wyX01VTFRJX1ZJRVdcXG4nO1xuICB9XG5cbiAgLy8gaWYgKGdsdy5faXNXZWJYUk1vZGUgJiYgZ2x3LmlzX211bHRpdmlldykge1xuICAvLyAgIGRlZmluaXRpb25zICs9ICcjZGVmaW5lIFdFQlhSX01VTFRJX1ZJRVdfVklFV19OVU1fMlxcbic7XG4gIC8vIH1cblxuICBpZiAoZ2x3LmlzV2ViR0wyIHx8IGdsdy53ZWJnbDFFeHREUlYpIHtcbiAgICBkZWZpbml0aW9ucyArPSAnI2RlZmluZSBSTl9JU19TVVBQT1JUSU5HX1NUQU5EQVJEX0RFUklWQVRJVkVTXFxuJztcbiAgfVxuICByZXR1cm4gZGVmaW5pdGlvbnM7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGNvbXBsZXRlIHNoYWRlciBwcm9ncmFtIGZvciBXZWJHUFUgcmVuZGVyaW5nLlxuICogVGhpcyBmdW5jdGlvbiBoYW5kbGVzIHRoZSBXZWJHUFUtc3BlY2lmaWMgc2hhZGVyIGNvbXBpbGF0aW9uIHBpcGVsaW5lIGluY2x1ZGluZzpcbiAqIC0gV0dTTCBzaGFkZXIgdGVtcGxhdGUgcHJvY2Vzc2luZ1xuICogLSBNYXRlcmlhbCBwcm9wZXJ0eSBlbWJlZGRpbmdcbiAqIC0gUHJhZ21hIHByZXByb2Nlc3Npbmcgd2l0aCBTaGFkZXJpdHlcbiAqIC0gV2ViR1BVLXNwZWNpZmljIGRlZmluaXRpb25zIGFuZCBjb25maWd1cmF0aW9uc1xuICpcbiAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgY29udGFpbmluZyBzaGFkZXIgdGVtcGxhdGVzIGFuZCBwcm9wZXJ0aWVzXG4gKiBAcGFyYW0gcHJpbWl0aXZlIC0gVGhlIGdlb21ldHJpYyBwcmltaXRpdmUgdGhhdCBkZWZpbmVzIHZlcnRleCBhdHRyaWJ1dGVzXG4gKiBAcGFyYW0gY29tcG9uZW50RGF0YUFjY2Vzc01ldGhvZERlZmluaXRpb25zRm9yVmVydGV4U2hhZGVyIC0gbWV0aG9kIGRlZmluaXRpb25zIGZvciBjb21wb25lbnQgZGF0YSBhY2Nlc3MgZm9yIHZlcnRleCBzaGFkZXJcbiAqIEBwYXJhbSBjb21wb25lbnREYXRhQWNjZXNzTWV0aG9kRGVmaW5pdGlvbnNGb3JQaXhlbFNoYWRlciAtIG1ldGhvZCBkZWZpbml0aW9ucyBmb3IgY29tcG9uZW50IGRhdGEgYWNjZXNzIGZvciBwaXhlbCBzaGFkZXJcbiAqIEBwYXJhbSBwcm9wZXJ0eVNldHRlck9mR2xvYmFsRGF0YVJlcG9zaXRvcnkgLSBGdW5jdGlvbiBmb3Igc2V0dGluZyBzaGFkZXIgcHJvcGVydGllcyBvZiBnbG9iYWwgZGF0YSByZXBvc2l0b3J5XG4gKiBAcGFyYW0gcHJvcGVydHlTZXR0ZXJPZk1hdGVyaWFsIC0gRnVuY3Rpb24gZm9yIHNldHRpbmcgc2hhZGVyIHByb3BlcnRpZXMgb2YgbWF0ZXJpYWxcbiAqIEBwYXJhbSBtb3JwaGVkUG9zaXRpb25HZXR0ZXIgLSBGdW5jdGlvbiB0byBnZXQgdGhlIG1vcnBoZWQgcG9zaXRpb25cbiAqIEByZXR1cm5zIFRoZSBoYW5kbGUgdG8gdGhlIGNyZWF0ZWQgc2hhZGVyIHByb2dyYW1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF9jcmVhdGVQcm9ncmFtQXNTaW5nbGVPcGVyYXRpb25XZWJHcHUoXG4gIGVuZ2luZTogRW5naW5lLFxuICBtYXRlcmlhbDogTWF0ZXJpYWwsXG4gIHByaW1pdGl2ZTogUHJpbWl0aXZlLFxuICBjb21wb25lbnREYXRhQWNjZXNzTWV0aG9kRGVmaW5pdGlvbnNGb3JWZXJ0ZXhTaGFkZXI6IHN0cmluZyxcbiAgY29tcG9uZW50RGF0YUFjY2Vzc01ldGhvZERlZmluaXRpb25zRm9yUGl4ZWxTaGFkZXI6IHN0cmluZyxcbiAgcHJvcGVydHlTZXR0ZXJPZkdsb2JhbERhdGFSZXBvc2l0b3J5OiBnZXRTaGFkZXJQcm9wZXJ0eUZ1bmNPZkdsb2JhbERhdGFSZXBvc2l0b3J5LFxuICBwcm9wZXJ0eVNldHRlck9mTWF0ZXJpYWw6IGdldFNoYWRlclByb3BlcnR5RnVuY09mTWF0ZXJpYWwsXG4gIG1vcnBoZWRQb3NpdGlvbkdldHRlcjogc3RyaW5nXG4pIHtcbiAgY29uc3QgdmVydGV4QXR0cmlidXRlRGVmaW5lcyA9IGRlZmluZUF0dHJpYnV0ZXMocHJpbWl0aXZlKTtcbiAgY29uc3QgbWF0ZXJpYWxOb2RlID0gbWF0ZXJpYWwuX21hdGVyaWFsQ29udGVudDtcbiAgbGV0IGRlZmluaXRpb25zID0gYC8vIE1hdGVyaWFsIFR5cGU6ICR7bWF0ZXJpYWwubWF0ZXJpYWxUeXBlTmFtZX1cXG5gO1xuICBkZWZpbml0aW9ucyArPSBtYXRlcmlhbE5vZGUuZ2V0RGVmaW5pdGlvbnMoKTtcbiAgY29uc3Qgc2hhZGVyRGVmaW5lcyA9IG1hdGVyaWFsLmdldFNoYWRlckRlZmluZXMoKTtcbiAgZm9yIChjb25zdCBzaGFkZXJEZWZpbmUgb2Ygc2hhZGVyRGVmaW5lcykge1xuICAgIGRlZmluaXRpb25zICs9IGAjZGVmaW5lICR7c2hhZGVyRGVmaW5lfVxcbmA7XG4gIH1cbiAgZGVmaW5pdGlvbnMgKz0gdmVydGV4QXR0cmlidXRlRGVmaW5lcztcbiAgbGV0IGFscGhhTW9kZSA9ICcnO1xuICBpZiAobWF0ZXJpYWwuaXNCbGVuZCgpKSB7XG4gICAgYWxwaGFNb2RlICs9ICcjZGVmaW5lIFJOX0lTX0FMUEhBX01PREVfQkxFTkRcXG4nO1xuICB9XG4gIGlmIChtYXRlcmlhbC5pc01hc2soKSkge1xuICAgIGFscGhhTW9kZSArPSAnI2RlZmluZSBSTl9JU19BTFBIQV9NT0RFX01BU0tcXG4nO1xuICB9XG4gIGNvbnN0IGNhY2hlUXVlcnkgPVxuICAgIENvbXBvbmVudC5nZXRTdGF0ZVZlcnNpb24oZW5naW5lKSArXG4gICAgZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5fZ2V0QnVmZmVyVmlld1ZlcnNpb24obWF0ZXJpYWwuX19tYXRlcmlhbFR5cGVOYW1lKSArXG4gICAgbWF0ZXJpYWwuX19tYXRlcmlhbFR5cGVOYW1lICtcbiAgICBtYXRlcmlhbC5fbWF0ZXJpYWxDb250ZW50LmdldE1hdGVyaWFsU2VtYW50aWNzVmFyaWFudE5hbWUoKSArXG4gICAgdmVydGV4QXR0cmlidXRlRGVmaW5lcyArXG4gICAgbWF0ZXJpYWwuX2dldEZpbmdlclByaW50KCkgK1xuICAgIGRlZmluaXRpb25zICtcbiAgICBjb21wb25lbnREYXRhQWNjZXNzTWV0aG9kRGVmaW5pdGlvbnNGb3JWZXJ0ZXhTaGFkZXIgK1xuICAgIGNvbXBvbmVudERhdGFBY2Nlc3NNZXRob2REZWZpbml0aW9uc0ZvclBpeGVsU2hhZGVyICtcbiAgICBtb3JwaGVkUG9zaXRpb25HZXR0ZXIgK1xuICAgIGFscGhhTW9kZTtcblxuICAvLyBVc2UgdGhlIGVuZ2luZSdzIHNoYWRlciBwcm9ncmFtIGNhY2hlXG4gIGNvbnN0IHNoYWRlckNhY2hlID0gZW5naW5lLnNoYWRlclByb2dyYW1DYWNoZTtcbiAgbGV0IHNoYWRlclByb2dyYW1VaWQgPSBzaGFkZXJDYWNoZS5nZXQoY2FjaGVRdWVyeSk7XG4gIGlmIChzaGFkZXJQcm9ncmFtVWlkICE9IG51bGwpIHtcbiAgICByZXR1cm4gc2hhZGVyUHJvZ3JhbVVpZDtcbiAgfVxuICBtYXRlcmlhbC51cGRhdGVTdGF0ZVZlcnNpb24oKTtcbiAgY29uc3QgeyB2ZXJ0ZXhQcm9wZXJ0aWVzU3RyLCBwaXhlbFByb3BlcnRpZXNTdHIgfSA9IG1hdGVyaWFsLl9nZXRQcm9wZXJ0aWVzKFxuICAgIGVuZ2luZSxcbiAgICBwcm9wZXJ0eVNldHRlck9mR2xvYmFsRGF0YVJlcG9zaXRvcnksXG4gICAgcHJvcGVydHlTZXR0ZXJPZk1hdGVyaWFsXG4gICk7XG5cbiAgY29uc3Qgd2dzbENodW5rcyA9IF9fZ2V0V2dzbENvbW1vbkNodW5rcygpO1xuICBjb25zdCB2ZXJ0ZXhTaGFkZXJpdHlPYmplY3QgPSBTaGFkZXJpdHlVdGlsaXR5V2ViR1BVLmZpbGxUZW1wbGF0ZShcbiAgICBlbmdpbmUsXG4gICAgbWF0ZXJpYWxOb2RlLnZlcnRleFNoYWRlcml0eU9iamVjdCEsXG4gICAgcHJpbWl0aXZlLFxuICAgIHtcbiAgICAgIFdlbGxLbm93bkNvbXBvbmVudFRJRHMsXG4gICAgICB2ZXJ0ZXhJbnB1dDogd2dzbENodW5rcy52ZXJ0ZXhJbnB1dCxcbiAgICAgIHZlcnRleE91dHB1dDogd2dzbENodW5rcy52ZXJ0ZXhPdXRwdXQsXG4gICAgICBwcmVyZXF1aXNpdGVzOiB3Z3NsQ2h1bmtzLnByZXJlcXVpc2l0ZXMsXG4gICAgICBtYWluUHJlcmVxdWlzaXRlczogd2dzbENodW5rcy5tYWluUHJlcmVxdWlzaXRlcyxcbiAgICAgIGZ1bGxzY3JlZW46IHdnc2xDaHVua3MuZnVsbHNjcmVlbixcbiAgICAgIGdldHRlcnM6IHZlcnRleFByb3BlcnRpZXNTdHIsXG4gICAgICBkZWZpbml0aW9uczogYC8vIFJOX0lTX1ZFUlRFWF9TSEFERVJcXG4jZGVmaW5lIFJOX0lTX1ZFUlRFWF9TSEFERVJcXG4ke2RlZmluaXRpb25zfWAsXG4gICAgICBtYXRyaWNlc0dldHRlcnM6IGNvbXBvbmVudERhdGFBY2Nlc3NNZXRob2REZWZpbml0aW9uc0ZvclZlcnRleFNoYWRlciArIG1vcnBoZWRQb3NpdGlvbkdldHRlcixcbiAgICAgIG9wdGljYWxEZWZpbml0aW9uOiB3Z3NsQ2h1bmtzLm9wdGljYWxEZWZpbml0aW9uLFxuICAgICAgc2hhZG93RGVmaW5pdGlvbjogd2dzbENodW5rcy5zaGFkb3csXG4gICAgICBwYnJEZWZpbml0aW9uOiB3Z3NsQ2h1bmtzLnBickRlZmluaXRpb24sXG4gICAgICBpYmxEZWZpbml0aW9uOiB3Z3NsQ2h1bmtzLmlibERlZmluaXRpb24sXG4gICAgICBhbHBoYVByb2Nlc3M6IHdnc2xDaHVua3MuYWxwaGFQcm9jZXNzLFxuICAgICAgLy8gVGhlIGJvbmUgZGVjb2RpbmcgaXMgc2hhcmVkIHdpdGggdGhlIHNraW5uaW5nIGNvbXB1dGUgc2hhZGVyIChXZWJHcHVWZXJ0ZXhEZWZvcm1lcikuXG4gICAgICBwcm9jZXNzR2VvbWV0cnk6IGAjaWZkZWYgUk5fSVNfU0tJTk5JTkdcXG4ke3dnc2xDaHVua3MuYm9uZURlY29kZX1cXG4jZW5kaWZcXG4ke3dnc2xDaHVua3MucHJvY2Vzc0dlb21ldHJ5fWAsXG4gICAgICBDb25maWc6IGVuZ2luZS5jb25maWcsXG4gICAgfVxuICApO1xuXG4gIGNvbnN0IHBpeGVsU2hhZGVyaXR5T2JqZWN0ID0gU2hhZGVyaXR5VXRpbGl0eVdlYkdQVS5maWxsVGVtcGxhdGUoXG4gICAgZW5naW5lLFxuICAgIG1hdGVyaWFsTm9kZS5waXhlbFNoYWRlcml0eU9iamVjdCEsXG4gICAgcHJpbWl0aXZlLFxuICAgIHtcbiAgICAgIFdlbGxLbm93bkNvbXBvbmVudFRJRHMsXG4gICAgICB2ZXJ0ZXhPdXRwdXQ6IHdnc2xDaHVua3MudmVydGV4T3V0cHV0LFxuICAgICAgcHJlcmVxdWlzaXRlczogd2dzbENodW5rcy5wcmVyZXF1aXNpdGVzLFxuICAgICAgbWFpblByZXJlcXVpc2l0ZXM6IHdnc2xDaHVua3MubWFpblByZXJlcXVpc2l0ZXMsXG4gICAgICBnZXR0ZXJzOiBwaXhlbFByb3BlcnRpZXNTdHIsXG4gICAgICBkZWZpbml0aW9uczogYC8vIFJOX0lTX1BJWEVMX1NIQURFUlxcbiNkZWZpbmUgUk5fSVNfUElYRUxfU0hBREVSXFxuJHtkZWZpbml0aW9uc30ke2FscGhhTW9kZX1gLFxuICAgICAgbWF0cmljZXNHZXR0ZXJzOiBjb21wb25lbnREYXRhQWNjZXNzTWV0aG9kRGVmaW5pdGlvbnNGb3JQaXhlbFNoYWRlcixcbiAgICAgIG9wdGljYWxEZWZpbml0aW9uOiB3Z3NsQ2h1bmtzLm9wdGljYWxEZWZpbml0aW9uLFxuICAgICAgc2hhZG93RGVmaW5pdGlvbjogd2dzbENodW5rcy5zaGFkb3csXG4gICAgICBwYnJEZWZpbml0aW9uOiB3Z3NsQ2h1bmtzLnBickRlZmluaXRpb24sXG4gICAgICBpYmxEZWZpbml0aW9uOiB3Z3NsQ2h1bmtzLmlibERlZmluaXRpb24sXG4gICAgICBhbHBoYVByb2Nlc3M6IHdnc2xDaHVua3MuYWxwaGFQcm9jZXNzLFxuICAgICAgb3V0cHV0U3JnYjogd2dzbENodW5rcy5vdXRwdXRTcmdiLFxuICAgICAgd2lyZWZyYW1lOiB3Z3NsQ2h1bmtzLndpcmVmcmFtZSxcbiAgICAgIENvbmZpZzogZW5naW5lLmNvbmZpZyxcbiAgICB9XG4gICk7XG5cbiAgY29uc3QgcHJlcHJvY2Vzc2VkVmVydGV4ID0gU2hhZGVyaXR5LnByb2Nlc3NQcmFnbWEodmVydGV4U2hhZGVyaXR5T2JqZWN0LCBmYWxzZSk7XG4gIGNvbnN0IHByZXByb2Nlc3NlZFBpeGVsID0gU2hhZGVyaXR5LnByb2Nlc3NQcmFnbWEocGl4ZWxTaGFkZXJpdHlPYmplY3QsIGZhbHNlKTtcblxuICBjb25zdCBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeSA9IGVuZ2luZS5jZ0FwaVJlc291cmNlUmVwb3NpdG9yeTtcbiAgc2hhZGVyUHJvZ3JhbVVpZCA9IGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5LmNyZWF0ZVNoYWRlclByb2dyYW0oe1xuICAgIGNvbmZpZzogZW5naW5lLmNvbmZpZyxcbiAgICBlbmdpbmUsXG4gICAgbWF0ZXJpYWwsXG4gICAgcHJpbWl0aXZlLFxuICAgIHZlcnRleFNoYWRlclN0cjogcHJlcHJvY2Vzc2VkVmVydGV4LmNvZGUsXG4gICAgZnJhZ21lbnRTaGFkZXJTdHI6IHByZXByb2Nlc3NlZFBpeGVsLmNvZGUsXG4gICAgYXR0cmlidXRlTmFtZXM6IFtdLFxuICAgIGF0dHJpYnV0ZVNlbWFudGljczogW10sXG4gIH0pO1xuICBzaGFkZXJDYWNoZS5zZXQoY2FjaGVRdWVyeSwgc2hhZGVyUHJvZ3JhbVVpZCk7XG4gIHJldHVybiBzaGFkZXJQcm9ncmFtVWlkO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlcyBwcmVwcm9jZXNzb3IgZGVmaW5pdGlvbnMgYmFzZWQgb24gdmVydGV4IGF0dHJpYnV0ZXMgcHJlc2VudCBpbiBhIHByaW1pdGl2ZS5cbiAqIFRoaXMgZnVuY3Rpb24gYW5hbHl6ZXMgdGhlIHZlcnRleCBhdHRyaWJ1dGVzIG9mIGEgcHJpbWl0aXZlIGFuZCBjcmVhdGVzIGNvcnJlc3BvbmRpbmdcbiAqIHNoYWRlciBwcmVwcm9jZXNzb3IgZGVmaW5pdGlvbnMgdGhhdCBlbmFibGUgYXR0cmlidXRlLXNwZWNpZmljIGNvZGUgcGF0aHMgaW4gc2hhZGVycy5cbiAqIEl0IGFsc28gaGFuZGxlcyBzcGVjaWFsIGNhc2VzIGxpa2UgbW9ycGhpbmcgdGFyZ2V0cyBhbmQgaW5zdGFuY2luZy5cbiAqXG4gKiBAcGFyYW0gcHJpbWl0aXZlIC0gVGhlIGdlb21ldHJpYyBwcmltaXRpdmUgdG8gYW5hbHl6ZSBmb3IgdmVydGV4IGF0dHJpYnV0ZXNcbiAqIEByZXR1cm5zIEEgc3RyaW5nIGNvbnRhaW5pbmcgYWxsIHJlbGV2YW50IHZlcnRleCBhdHRyaWJ1dGUgcHJlcHJvY2Vzc29yIGRlZmluaXRpb25zXG4gKi9cbmZ1bmN0aW9uIGRlZmluZUF0dHJpYnV0ZXMocHJpbWl0aXZlOiBQcmltaXRpdmUpIHtcbiAgbGV0IHZlcnRleEF0dHJpYnV0ZURlZmluZXMgPSAnJztcbiAgY29uc3QgYXR0cmlidXRlU2VtYW50aWNzID0gcHJpbWl0aXZlLmF0dHJpYnV0ZVNlbWFudGljcztcbiAgZm9yIChjb25zdCBhdHRyaWJ1dGVTZW1hbnRpYyBvZiBhdHRyaWJ1dGVTZW1hbnRpY3MpIHtcbiAgICBpZiAoYXR0cmlidXRlU2VtYW50aWMuaW5kZXhPZignUE9TSVRJT04nKSAhPT0gLTEpIHtcbiAgICAgIHZlcnRleEF0dHJpYnV0ZURlZmluZXMgKz0gJyNkZWZpbmUgUk5fVVNFX1BPU0lUSU9OXFxuJztcbiAgICAgIGNvbnN0IGFjY2Vzc29yID0gcHJpbWl0aXZlLmdldEF0dHJpYnV0ZShhdHRyaWJ1dGVTZW1hbnRpYyk7XG4gICAgICBpZiAoYWNjZXNzb3IhLmNvbXBvbmVudFR5cGUuaXNGbG9hdGluZ1BvaW50KCkpIHtcbiAgICAgICAgdmVydGV4QXR0cmlidXRlRGVmaW5lcyArPSAnI2RlZmluZSBSTl9VU0VfUE9TSVRJT05fRkxPQVRcXG4nO1xuICAgICAgfSBlbHNlIGlmIChhY2Nlc3NvciEuY29tcG9uZW50VHlwZS5pc0ludGVnZXIoKSkge1xuICAgICAgICB2ZXJ0ZXhBdHRyaWJ1dGVEZWZpbmVzICs9ICcjZGVmaW5lIFJOX1VTRV9QT1NJVElPTl9JTlRcXG4nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmVydGV4QXR0cmlidXRlRGVmaW5lcyArPSAnI2RlZmluZSBSTl9VU0VfUE9TSVRJT05fVUlOVFxcbic7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChhdHRyaWJ1dGVTZW1hbnRpYy5pbmRleE9mKCdOT1JNQUwnKSAhPT0gLTEpIHtcbiAgICAgIHZlcnRleEF0dHJpYnV0ZURlZmluZXMgKz0gJyNkZWZpbmUgUk5fVVNFX05PUk1BTFxcbic7XG4gICAgfVxuICAgIGlmIChhdHRyaWJ1dGVTZW1hbnRpYy5pbmRleE9mKCdUQU5HRU5UJykgIT09IC0xKSB7XG4gICAgICB2ZXJ0ZXhBdHRyaWJ1dGVEZWZpbmVzICs9ICcjZGVmaW5lIFJOX1VTRV9UQU5HRU5UXFxuJztcbiAgICB9XG4gICAgaWYgKGF0dHJpYnV0ZVNlbWFudGljLmluZGV4T2YoJ1RFWENPT1JEXzAnKSAhPT0gLTEpIHtcbiAgICAgIHZlcnRleEF0dHJpYnV0ZURlZmluZXMgKz0gJyNkZWZpbmUgUk5fVVNFX1RFWENPT1JEXzBcXG4nO1xuICAgIH1cbiAgICBpZiAoYXR0cmlidXRlU2VtYW50aWMuaW5kZXhPZignVEVYQ09PUkRfMScpICE9PSAtMSkge1xuICAgICAgdmVydGV4QXR0cmlidXRlRGVmaW5lcyArPSAnI2RlZmluZSBSTl9VU0VfVEVYQ09PUkRfMVxcbic7XG4gICAgfVxuICAgIGlmIChhdHRyaWJ1dGVTZW1hbnRpYy5pbmRleE9mKCdDT0xPUl8wJykgIT09IC0xKSB7XG4gICAgICB2ZXJ0ZXhBdHRyaWJ1dGVEZWZpbmVzICs9ICcjZGVmaW5lIFJOX1VTRV9DT0xPUl8wXFxuJztcbiAgICAgIGNvbnN0IGFjY2Vzc29yID0gcHJpbWl0aXZlLmdldEF0dHJpYnV0ZShhdHRyaWJ1dGVTZW1hbnRpYyk7XG4gICAgICBpZiAoYWNjZXNzb3IhLm5vcm1hbGl6ZWQpIHtcbiAgICAgICAgLy8gQSBub3JtYWxpemVkIGludGVnZXIgYXR0cmlidXRlIGlzIGJvdW5kIHdpdGggYSB1bm9ybS9zbm9ybSBXZWJHUFUgdmVydGV4IGZvcm1hdCxcbiAgICAgICAgLy8gc28gdGhlIHNoYWRlciByZWNlaXZlcyBmbG9hdHMgaW4gdGhlIFswLCAxXSAvIFstMSwgMV0gcmFuZ2UuXG4gICAgICAgIHZlcnRleEF0dHJpYnV0ZURlZmluZXMgKz0gJyNkZWZpbmUgUk5fVVNFX0NPTE9SXzBfRkxPQVRcXG4nO1xuICAgICAgfSBlbHNlIGlmIChhY2Nlc3NvciEuY29tcG9uZW50VHlwZS5pc0Zsb2F0aW5nUG9pbnQoKSkge1xuICAgICAgICB2ZXJ0ZXhBdHRyaWJ1dGVEZWZpbmVzICs9ICcjZGVmaW5lIFJOX1VTRV9DT0xPUl8wX0ZMT0FUXFxuJztcbiAgICAgIH0gZWxzZSBpZiAoYWNjZXNzb3IhLmNvbXBvbmVudFR5cGUuaXNJbnRlZ2VyKCkpIHtcbiAgICAgICAgdmVydGV4QXR0cmlidXRlRGVmaW5lcyArPSAnI2RlZmluZSBSTl9VU0VfQ09MT1JfMF9JTlRcXG4nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmVydGV4QXR0cmlidXRlRGVmaW5lcyArPSAnI2RlZmluZSBSTl9VU0VfQ09MT1JfMF9VSU5UXFxuJztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGF0dHJpYnV0ZVNlbWFudGljLmluZGV4T2YoJ0pPSU5UU18wJykgIT09IC0xKSB7XG4gICAgICB2ZXJ0ZXhBdHRyaWJ1dGVEZWZpbmVzICs9ICcjZGVmaW5lIFJOX1VTRV9KT0lOVFNfMFxcbic7XG4gICAgfVxuICAgIGlmIChhdHRyaWJ1dGVTZW1hbnRpYy5pbmRleE9mKCdXRUlHSFRTXzAnKSAhPT0gLTEpIHtcbiAgICAgIHZlcnRleEF0dHJpYnV0ZURlZmluZXMgKz0gJyNkZWZpbmUgUk5fVVNFX1dFSUdIVFNfMFxcbic7XG4gICAgfVxuICAgIGlmIChhdHRyaWJ1dGVTZW1hbnRpYy5pbmRleE9mKCdGQUNFX05PUk1BTCcpICE9PSAtMSkge1xuICAgICAgdmVydGV4QXR0cmlidXRlRGVmaW5lcyArPSAnI2RlZmluZSBSTl9VU0VfRkFDRV9OT1JNQUxcXG4nO1xuICAgIH1cbiAgICBpZiAoYXR0cmlidXRlU2VtYW50aWMuaW5kZXhPZignQkFSWV9DRU5UUklDX0NPT1JEJykgIT09IC0xKSB7XG4gICAgICB2ZXJ0ZXhBdHRyaWJ1dGVEZWZpbmVzICs9ICcjZGVmaW5lIFJOX1VTRV9CQVJZX0NFTlRSSUNfQ09PUkRcXG4nO1xuICAgIH1cbiAgICBpZiAoYXR0cmlidXRlU2VtYW50aWMuaW5kZXhPZignVEVYQ09PUkRfMicpICE9PSAtMSkge1xuICAgICAgdmVydGV4QXR0cmlidXRlRGVmaW5lcyArPSAnI2RlZmluZSBSTl9VU0VfVEVYQ09PUkRfMlxcbic7XG4gICAgfVxuICB9XG4gIGlmIChwcmltaXRpdmUudGFyZ2V0cyAhPSBudWxsICYmIHByaW1pdGl2ZS50YXJnZXRzLmxlbmd0aCA+IDApIHtcbiAgICB2ZXJ0ZXhBdHRyaWJ1dGVEZWZpbmVzICs9ICcjZGVmaW5lIFJOX0lTX01PUlBISU5HXFxuJztcbiAgfVxuXG4gIHZlcnRleEF0dHJpYnV0ZURlZmluZXMgKz0gJyNkZWZpbmUgUk5fVVNFX0lOU1RBTkNFXFxuJztcbiAgcmV0dXJuIHZlcnRleEF0dHJpYnV0ZURlZmluZXM7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQUEsT0FBTyxxQkFBK0M7QUFTdEQsU0FBUyw4QkFBOEI7QUFDdkMsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyx1QkFBdUI7QUFPaEMsU0FBUyxVQUFVO0FBRW5CLFNBQVMscUJBQXFCO0FBRzlCLFNBQVMseUJBQXlCLDhCQUE4QjtBQUNoRSxTQUFTLDBCQUEwQiwrQkFBK0I7QUFHbEUsSUFBTSx3QkFDSixPQUFPLGlCQUFpQixlQUFlLGVBQWUseUJBQXlCO0FBRWpGLElBQU0seUJBQ0osT0FBTyxrQkFBa0IsZUFB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
