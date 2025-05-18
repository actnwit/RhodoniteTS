import ShaderityModule from 'shaderity';
import { CGAPIResourceHandle } from '../../../types/CommonTypes';
import { AttributeNames } from '../../../webgl/types/CommonTypes';
import { WebGLContextWrapper } from '../../../webgl/WebGLContextWrapper';
import { ShaderSources } from '../../../webgl/WebGLStrategy';
import { Config } from '../../core/Config';
import { BoneDataType } from '../../definitions/BoneDataType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { VertexAttributeEnum } from '../../definitions/VertexAttribute';
import { CGAPIResourceRepository } from '../../renderer/CGAPIResourceRepository';
import { SystemState } from '../../system/SystemState';
import { AbstractMaterialContent } from './AbstractMaterialContent';
import { Material } from './Material';
import { ShaderityUtilityWebGL } from './ShaderityUtilityWebGL';
import { Primitive } from '../../geometry/Primitive';
import { ModuleManager } from '../../system/ModuleManager';
import { Is } from '../../misc/Is';
import { RnXR } from '../../../xr/main';
import { getShaderPropertyFunc } from '../../definitions/ShaderSemantics';
import { ShaderityUtilityWebGPU } from './ShaderityUtilityWebGPU';
import { processGeometryWgsl } from '../../../webgpu/shaderity_shaders/common/processGeometry';
import { processGeometryGlsl } from '../../../webgl/shaderity_shaders/common/processGeometry';
import { prerequisitesGlsl } from '../../../webgl/shaderity_shaders/common/prerequisites';
import { WellKnownComponentTIDs } from '../../components/WellKnownComponentTIDs';

const Shaderity = (ShaderityModule as any).default || ShaderityModule;
const __shaderStringMap: Map<string, CGAPIResourceHandle> = new Map();
export class ShaderHandler {
  private static __shaderStringMap: Map<string, CGAPIResourceHandle> = new Map();

  /**
   * Create a shader program Or Get a shader program from cache
   * @param material
   * @param primitive
   * @param vertexShader
   * @param pixelShader
   * @param attributeNames
   * @param attributeSemantics
   * @param onError
   * @returns
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

function __removeCommentsFromShader(shader: string) {
  return shader.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
}

export function _createProgramAsSingleOperationByUpdatedSources(
  material: Material,
  primitive: Primitive,
  materialNode: AbstractMaterialContent,
  updatedShaderSources: ShaderSources,
  onError?: (message: string) => void
): [CGAPIResourceHandle, boolean] {
  const { attributeNames, attributeSemantics } = _getAttributeInfo(materialNode);

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

export function _getAttributeInfo(materialNode: AbstractMaterialContent) {
  const reflection = ShaderityUtilityWebGL.getAttributeReflection(
    materialNode.vertexShaderityObject!
  );
  const attributeNames = reflection.names;
  const attributeSemantics = reflection.semantics;
  return { attributeNames, attributeSemantics };
}

export function _outputVertexAttributeBindingInfo(
  attributeNames: string[],
  attributeSemantics: VertexAttributeEnum[]
) {
  let vertexAttributesBinding = '\n// Vertex Attributes Binding Info\n';
  for (let i = 0; i < attributeNames.length; i++) {
    vertexAttributesBinding += `// ${attributeNames[i]}: ${attributeSemantics[i].str} \n`;
  }
  return vertexAttributesBinding;
}

/**
 * Create a shader program
 *
 * @remarks
 * This method creates the final shader source code
 * by embedding variables and adding definitions
 * to the prototype shader source code during processing.
 *
 * @param material - A material
 * @param vertexPropertiesStr - A string of vertex properties
 * @param pixelPropertiesStr - A string of pixel properties
 * @param vertexShaderMethodDefinitions_uniform - A string of vertex shader method definitions in Uniform Strategy
 * @param isWebGL2 - A flag whether the current WebGL context is WebGL2 or not
 * @returns
 */
export function _createProgramAsSingleOperationWebGL(
  material: Material,
  propertySetter: getShaderPropertyFunc,
  primitive: Primitive,
  vertexShaderMethodDefinitions_uniform: string,
  isWebGL2: boolean
): [CGAPIResourceHandle, boolean] {
  const vertexAttributeDefines = defineAttributes(primitive);
  const cacheQuery = material.__materialTypeName + vertexAttributeDefines + material._getFingerPrint();

  let shaderProgramUid = __shaderStringMap.get(cacheQuery);
  if (shaderProgramUid) {
    return [shaderProgramUid, false];
  }

  const { vertexPropertiesStr, pixelPropertiesStr } = material._getProperties(
    propertySetter,
    isWebGL2
  );
  const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
  const materialNode = material._materialContent;

  let definitions = materialNode.getDefinitions();
  const shaderDefines = material.getShaderDefines();
  for (const shaderDefine of shaderDefines) {
    definitions += `#define ${shaderDefine}\n`;
  }
  definitions += vertexAttributeDefines;

  // Shader Code Construction
  let vertexShader = _setupGlobalShaderDefinitionWebGL(material.__materialTypeName, primitive);
  vertexShader += '#define RN_IS_VERTEX_SHADER\n';
  let pixelShader = _setupGlobalShaderDefinitionWebGL(material.__materialTypeName, primitive);
  pixelShader += '#define RN_IS_PIXEL_SHADER\n';
  if (material.isBlend()) {
    pixelShader += '#define RN_IS_ALPHA_MODE_BLEND\n';
  }
  if (material.isMask()) {
    pixelShader += '#define RN_IS_ALPHA_MODE_MASK\n';
  }

  const vertexShaderityObject = ShaderityUtilityWebGL.fillTemplate(
    materialNode.vertexShaderityObject!,
    {
      WellKnownComponentTIDs,
      getters: vertexPropertiesStr,
      definitions: definitions,
      prerequisites: prerequisitesGlsl.code,
      matricesGetters: vertexShaderMethodDefinitions_uniform,
      processGeometry: processGeometryGlsl.code,
      Config,
    }
  );

  const pixelShaderityObject = ShaderityUtilityWebGL.fillTemplate(
    materialNode.pixelShaderityObject!,
    {
      WellKnownComponentTIDs,
      renderTargetBegin: webglResourceRepository.getGlslRenderTargetBeginString(4),
      getters: pixelPropertiesStr,
      definitions: definitions,
      prerequisites: prerequisitesGlsl.code,
      matricesGetters: vertexShaderMethodDefinitions_uniform,
      renderTargetEnd: webglResourceRepository.getGlslRenderTargetEndString(4),
      Config,
    }
  );

  vertexShader += vertexShaderityObject.code.replace(/#version\s+(100|300\s+es)/, '');
  pixelShader += pixelShaderityObject.code.replace(/#version\s+(100|300\s+es)/, '');

  const { attributeNames, attributeSemantics } = _getAttributeInfo(materialNode);
  const vertexAttributesBinding = _outputVertexAttributeBindingInfo(
    attributeNames,
    attributeSemantics
  );
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
  if (
    Is.exist(webXRSystem) &&
    webXRSystem.isWebXRMode &&
    webglResourceRepository.isSupportMultiViewVRRendering()
  ) {
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

export function _createProgramAsSingleOperationWebGpu(
  material: Material,
  primitive: Primitive,
  vertexShaderMethodDefinitions: string,
  propertySetter: getShaderPropertyFunc
) {
  const vertexAttributeDefines = defineAttributes(primitive);
  const cacheQuery = material.__materialTypeName + vertexAttributeDefines + material._getFingerPrint();

  let shaderProgramUid = __shaderStringMap.get(cacheQuery);
  if (shaderProgramUid) {
    return shaderProgramUid;
  }
  const { vertexPropertiesStr, pixelPropertiesStr } = material._getProperties(propertySetter, true);

  const materialNode = material._materialContent;

  let definitions = `// Material Type: ${material.materialTypeName}\n`;
  definitions += materialNode.getDefinitions();
  const shaderDefines = material.getShaderDefines();
  for (const shaderDefine of shaderDefines) {
    definitions += `#define ${shaderDefine}\n`;
  }
  definitions += vertexAttributeDefines;

  if (Config.boneDataType === BoneDataType.Mat43x1) {
    definitions += '#define RN_BONE_DATA_TYPE_Mat43x1\n';
  } else if (Config.boneDataType === BoneDataType.Vec4x2) {
    definitions += '#define RN_BONE_DATA_TYPE_VEC4X2\n';
  } else if (Config.boneDataType === BoneDataType.Vec4x2Old) {
    definitions += '#define RN_BONE_DATA_TYPE_VEC4X2_OLD\n';
  } else if (Config.boneDataType === BoneDataType.Vec4x1) {
    definitions += '#define RN_BONE_DATA_TYPE_VEC4X1\n';
  }

  const vertexShaderityObject = ShaderityUtilityWebGPU.fillTemplate(
    materialNode.vertexShaderityObject!,
    {
      getters: vertexPropertiesStr,
      definitions: '// RN_IS_VERTEX_SHADER\n#define RN_IS_VERTEX_SHADER\n' + definitions,
      matricesGetters: vertexShaderMethodDefinitions,
      maxMorphDataNumber:
        '' +
        Math.ceil(
          (Config.maxVertexPrimitiveNumberInShader * Config.maxVertexMorphNumberInShader) / 4
        ),
      processGeometry: processGeometryWgsl.code,
    }
  );

  let alphaMode = '';
  if (material.isBlend()) {
    alphaMode += '#define RN_IS_ALPHA_MODE_BLEND\n';
  }
  if (material.isMask()) {
    alphaMode += '#define RN_IS_ALPHA_MODE_MASK\n';
  }

  const pixelShaderityObject = ShaderityUtilityWebGPU.fillTemplate(
    materialNode.pixelShaderityObject!,
    {
      getters: pixelPropertiesStr,
      definitions: '// RN_IS_PIXEL_SHADER\n#define RN_IS_PIXEL_SHADER\n' + definitions + alphaMode,
      matricesGetters: vertexShaderMethodDefinitions,
      maxMorphDataNumber:
        '' +
        Math.ceil(
          (Config.maxVertexPrimitiveNumberInShader * Config.maxVertexMorphNumberInShader) / 4
        ),
    }
  );

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

function defineAttributes(primitive: Primitive) {
  let vertexAttributeDefines = '';
  const attributeSemantics = primitive.attributeSemantics;
  for (const attributeSemantic of attributeSemantics) {
    if (attributeSemantic.indexOf('POSITION') !== -1) {
      vertexAttributeDefines += `#define RN_USE_POSITION\n`;
      const accessor = primitive.getAttribute(attributeSemantic);
      if (accessor!.componentType.isFloatingPoint()) {
        vertexAttributeDefines += `#define RN_USE_POSITION_FLOAT\n`;
      } else if (accessor!.componentType.isInteger()) {
        vertexAttributeDefines += `#define RN_USE_POSITION_INT\n`;
      } else {
        vertexAttributeDefines += `#define RN_USE_POSITION_UINT\n`;
      }
    }
    if (attributeSemantic.indexOf('NORMAL') !== -1) {
      vertexAttributeDefines += `#define RN_USE_NORMAL\n`;
    }
    if (attributeSemantic.indexOf('TANGENT') !== -1) {
      vertexAttributeDefines += `#define RN_USE_TANGENT\n`;
    }
    if (attributeSemantic.indexOf('TEXCOORD_0') !== -1) {
      vertexAttributeDefines += `#define RN_USE_TEXCOORD_0\n`;
    }
    if (attributeSemantic.indexOf('TEXCOORD_1') !== -1) {
      vertexAttributeDefines += `#define RN_USE_TEXCOORD_1\n`;
    }
    if (attributeSemantic.indexOf('COLOR_0') !== -1) {
      vertexAttributeDefines += `#define RN_USE_COLOR_0\n`;
      const accessor = primitive.getAttribute(attributeSemantic);
      if (accessor!.componentType.isFloatingPoint()) {
        vertexAttributeDefines += `#define RN_USE_COLOR_0_FLOAT\n`;
      } else if (accessor!.componentType.isInteger()) {
        vertexAttributeDefines += `#define RN_USE_COLOR_0_INT\n`;
      } else {
        vertexAttributeDefines += `#define RN_USE_COLOR_0_UINT\n`;
      }
    }
    if (attributeSemantic.indexOf('JOINTS_0') !== -1) {
      vertexAttributeDefines += `#define RN_USE_JOINTS_0\n`;
    }
    if (attributeSemantic.indexOf('WEIGHTS_0') !== -1) {
      vertexAttributeDefines += `#define RN_USE_WEIGHTS_0\n`;
    }
    if (attributeSemantic.indexOf('FACE_NORMAL') !== -1) {
      vertexAttributeDefines += `#define RN_USE_FACE_NORMAL\n`;
    }
    if (attributeSemantic.indexOf('BARY_CENTRIC_COORD') !== -1) {
      vertexAttributeDefines += `#define RN_USE_BARY_CENTRIC_COORD\n`;
    }
    if (attributeSemantic.indexOf('TEXCOORD_2') !== -1) {
      vertexAttributeDefines += `#define RN_USE_TEXCOORD_2\n`;
    }
  }
  if (primitive.targets != null && primitive.targets.length > 0) {
    vertexAttributeDefines += '#define RN_IS_MORPHING\n';
  }

  vertexAttributeDefines += `#define RN_USE_INSTANCE\n`;
  return vertexAttributeDefines;
}
