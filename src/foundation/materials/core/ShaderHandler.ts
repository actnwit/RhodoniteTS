import { AbstractMaterialContent, Material, ShaderityUtility } from '.';
import { CGAPIResourceHandle } from '../../../types/CommonTypes';
import { AttributeNames } from '../../../webgl/types/CommonTypes';
import { ShaderSources } from '../../../webgl/WebGLStrategy';
import { VertexAttributeEnum } from '../../definitions/VertexAttribute';
import { DataUtil } from '../../misc/DataUtil';
import { CGAPIResourceRepository } from '../../renderer/CGAPIResourceRepository';

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
      const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
      const shaderProgramUid = webglResourceRepository.createShaderProgram({
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
