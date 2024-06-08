import Shaderity from 'shaderity';
import { CGAPIResourceHandle } from '../../../types/CommonTypes';
import { AttributeNames } from '../../../webgl/types/CommonTypes';
import { WebGLContextWrapper } from '../../../webgl/WebGLContextWrapper';
import { ShaderSources } from '../../../webgl/WebGLStrategy';
import { Config } from '../../core/Config';
import { BoneDataType } from '../../definitions/BoneDataType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { VertexAttributeEnum } from '../../definitions/VertexAttribute';
import { DataUtil } from '../../misc/DataUtil';
import { CGAPIResourceRepository } from '../../renderer/CGAPIResourceRepository';
import { SystemState } from '../../system/SystemState';
import { AbstractMaterialContent } from './AbstractMaterialContent';
import { Material } from './Material';
import { ShaderityUtilityWebGL } from './ShaderityUtilityWebGL';
import { Primitive } from '../../geometry/Primitive';
import { ModuleManager } from '../../system/ModuleManager';
import { Is } from '../../misc/Is';
import { RnXR } from '../../../xr/main';

export class ShaderHandler {
  private static __shaderHashMap: Map<number, CGAPIResourceHandle> = new Map();
  private static __shaderStringMap: Map<string, CGAPIResourceHandle> = new Map();

  /**
   * Create a shader program Or Get a shader program from cache
   * @param material
   * @param vertexShader
   * @param pixelShader
   * @param attributeNames
   * @param attributeSemantics
   * @param onError
   * @returns
   */
  static _createShaderProgramWithCache(
    material: Material,
    vertexShader: string,
    pixelShader: string,
    attributeNames: AttributeNames,
    attributeSemantics: VertexAttributeEnum[],
    onError?: (message: string) => void
  ): CGAPIResourceHandle {
    // Cache
    const wholeShaderText = vertexShader + pixelShader;
    let shaderProgramUid = this.__shaderStringMap.get(wholeShaderText);
    if (shaderProgramUid) {
      return shaderProgramUid;
    }
    const hash = DataUtil.toCRC32(wholeShaderText);
    shaderProgramUid = this.__shaderHashMap.get(hash);
    if (shaderProgramUid) {
      return shaderProgramUid;
    } else {
      const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
      const shaderProgramUid = cgApiResourceRepository.createShaderProgram({
        material,
        vertexShaderStr: vertexShader,
        fragmentShaderStr: pixelShader,
        attributeNames: attributeNames,
        attributeSemantics: attributeSemantics,
        onError,
      });
      this.__shaderStringMap.set(wholeShaderText, shaderProgramUid);
      this.__shaderHashMap.set(hash, shaderProgramUid);
      return shaderProgramUid;
    }
  }
}

export function _createProgramAsSingleOperationByUpdatedSources(
  material: Material,
  materialNode: AbstractMaterialContent,
  updatedShaderSources: ShaderSources,
  onError?: (message: string) => void
) {
  const { attributeNames, attributeSemantics } = _getAttributeInfo(materialNode);

  const shaderProgramUid = ShaderHandler._createShaderProgramWithCache(
    material,
    updatedShaderSources.vertex,
    updatedShaderSources.pixel,
    attributeNames,
    attributeSemantics,
    onError
  );

  return shaderProgramUid;
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
  primitive: Primitive,
  vertexPropertiesStr: string,
  pixelPropertiesStr: string,
  vertexShaderMethodDefinitions_uniform: string,
  isWebGL2: boolean
): CGAPIResourceHandle {
  const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
  const materialNode = material._materialContent;

  const definitions = materialNode.getDefinitions(material);

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
      getters: vertexPropertiesStr,
      definitions: definitions,
      dataUBODefinition: webglResourceRepository.getGlslDataUBODefinitionString(),
      dataUBOVec4Size: webglResourceRepository.getGlslDataUBOVec4SizeString(),
      matricesGetters: vertexShaderMethodDefinitions_uniform,
    }
  );

  const pixelShaderityObject = ShaderityUtilityWebGL.fillTemplate(
    materialNode.pixelShaderityObject!,
    {
      renderTargetBegin: webglResourceRepository.getGlslRenderTargetBeginString(4),
      getters: pixelPropertiesStr,
      definitions: definitions,
      dataUBODefinition: webglResourceRepository.getGlslDataUBODefinitionString(),
      dataUBOVec4Size: webglResourceRepository.getGlslDataUBOVec4SizeString(),
      matricesGetters: vertexShaderMethodDefinitions_uniform,
      renderTargetEnd: webglResourceRepository.getGlslRenderTargetEndString(4),
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

  const shaderProgramUid = ShaderHandler._createShaderProgramWithCache(
    material,
    vertexShader,
    pixelShader,
    attributeNames,
    attributeSemantics
  );

  return shaderProgramUid;
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
  definitions += `#define RN_MATERIAL_TYPE_NAME ${materialTypeName}\n`;
  if (ProcessApproach.isDataTextureApproach(SystemState.currentProcessApproach)) {
    definitions += '#define RN_IS_DATATEXTURE_MODE\n';
  } else {
    definitions += '#define RN_IS_UNIFORM_MODE\n';
  }

  const attributeSemantics = primitive.attributeSemantics;
  for (const attributeSemantic of attributeSemantics) {
    if (attributeSemantic.indexOf('TANGENT') !== -1) {
      definitions += `#define RN_USE_TANGENT\n`;
    }
  }
  if (primitive.targets != null && primitive.targets.length > 0) {
    definitions += '#define RN_IS_MORPHING\n';
  }

  // if (glw.webgl1ExtSTL) {
  //   definitions += '#define WEBGL1_EXT_SHADER_TEXTURE_LOD\n';
  // }
  // if (glw.webgl1ExtDRV) {
  //   definitions += '#define WEBGL1_EXT_STANDARD_DERIVATIVES\n';
  // }
  // if (glw.webgl1ExtDB) {
  //   definitions += '#define WEBGL1_EXT_DRAW_BUFFERS\n';
  // }
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
  vertexPropertiesStr: string,
  pixelPropertiesStr: string
) {
  const materialNode = material._materialContent;

  let vertexAttributeDefines = ``;
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

  let definitions = `// Material Type: ${material.materialTypeName}\n`;
  definitions += materialNode.getDefinitions(material);
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

  const vertexShaderityObject = ShaderityUtilityWebGL.fillTemplate(
    materialNode.vertexShaderityObject!,
    {
      getters: vertexPropertiesStr,
      definitions: '// RN_IS_VERTEX_SHADER\n' + definitions,
      matricesGetters: vertexShaderMethodDefinitions,
      maxMorphDataNumber:
        '' +
        Math.ceil(
          (Config.maxVertexPrimitiveNumberInShader * Config.maxVertexMorphNumberInShader) / 4
        ),
    }
  );

  let alphaMode = '';
  if (material.isBlend()) {
    alphaMode += '#define RN_IS_ALPHA_MODE_BLEND\n';
  }
  if (material.isMask()) {
    alphaMode += '#define RN_IS_ALPHA_MODE_MASK\n';
  }

  const pixelShaderityObject = ShaderityUtilityWebGL.fillTemplate(
    materialNode.pixelShaderityObject!,
    {
      getters: pixelPropertiesStr,
      definitions: '// RN_IS_PIXEL_SHADER\n' + definitions + alphaMode,
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

  const programUid = ShaderHandler._createShaderProgramWithCache(
    material,
    preprocessedVertex.code,
    preprocessedPixel.code,
    [],
    []
  );
  return programUid;
}
