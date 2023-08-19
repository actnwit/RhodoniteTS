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
import { ShaderityUtility } from './ShaderityUtility';

export class ShaderHandler {
  private static __shaderHashMap: Map<number, CGAPIResourceHandle> = new Map();
  private static __shaderStringMap: Map<string, CGAPIResourceHandle> = new Map();

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
  const reflection = ShaderityUtility.getAttributeReflection(materialNode.vertexShaderityObject!);
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

export function _createProgramAsSingleOperationWebGL(
  material: Material,
  vertexPropertiesStr: string,
  pixelPropertiesStr: string,
  vertexShaderMethodDefinitions_uniform: string,
  isWebGL2: boolean
): CGAPIResourceHandle {
  const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
  const materialNode = material._materialContent;

  const definitions = materialNode.getDefinitions(material);

  // Shader Construction
  let vertexShader = _setupGlobalShaderDefinitionWebGL(material.__materialTypeName);
  vertexShader += '#define RN_IS_VERTEX_SHADER\n';
  let pixelShader = _setupGlobalShaderDefinitionWebGL(material.__materialTypeName);
  pixelShader += '#define RN_IS_PIXEL_SHADER\n';

  const vertexShaderityObject = ShaderityUtility.fillTemplate(materialNode.vertexShaderityObject!, {
    getters: vertexPropertiesStr,
    definitions: definitions,
    dataUBODefinition: webglResourceRepository.getGlslDataUBODefinitionString(),
    dataUBOVec4Size: webglResourceRepository.getGlslDataUBOVec4SizeString(),
    matricesGetters: vertexShaderMethodDefinitions_uniform,
  });
  const vertexShaderBody = ShaderityUtility.transformWebGLVersion(
    vertexShaderityObject,
    isWebGL2
  ).code;

  const pixelShaderityObject = ShaderityUtility.fillTemplate(materialNode.pixelShaderityObject!, {
    renderTargetBegin: webglResourceRepository.getGlslRenderTargetBeginString(4),
    getters: pixelPropertiesStr,
    definitions: definitions,
    dataUBODefinition: webglResourceRepository.getGlslDataUBODefinitionString(),
    dataUBOVec4Size: webglResourceRepository.getGlslDataUBOVec4SizeString(),
    matricesGetters: vertexShaderMethodDefinitions_uniform,
    renderTargetEnd: webglResourceRepository.getGlslRenderTargetEndString(4),
  });
  const pixelShaderBody = ShaderityUtility.transformWebGLVersion(
    pixelShaderityObject,
    isWebGL2
  ).code;

  vertexShader += vertexShaderBody.replace(/#version\s+(100|300\s+es)/, '');
  pixelShader += pixelShaderBody.replace(/#version\s+(100|300\s+es)/, '');

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

export function _setupGlobalShaderDefinitionWebGL(materialTypeName: string) {
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
  // if (glw.webgl1ExtSTL) {
  //   definitions += '#define WEBGL1_EXT_SHADER_TEXTURE_LOD\n';
  // }
  // if (glw.webgl1ExtDRV) {
  //   definitions += '#define WEBGL1_EXT_STANDARD_DERIVATIVES\n';
  // }
  // if (glw.webgl1ExtDB) {
  //   definitions += '#define WEBGL1_EXT_DRAW_BUFFERS\n';
  // }

  if (glw.is_multiview) {
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
