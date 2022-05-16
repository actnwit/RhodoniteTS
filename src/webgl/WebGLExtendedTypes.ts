import {ShaderSemanticsName} from '../foundation/definitions/ShaderSemantics';
import {ShaderSemanticsInfo} from '../foundation/definitions/ShaderSemanticsInfo';
import {Material} from '../foundation/materials/core/Material';

export interface RnWebGLProgram extends WebGLProgram {
  _gl: WebGLRenderingContext | WebGL2RenderingContext;
  _materialTypeName: string;
  _vertexShaderStr: string;
  _fragmentShaderStr: string;
  _shaderSemanticsInfoMap: Map<ShaderSemanticsName, ShaderSemanticsInfo>;
  __SPECTOR_rebuildProgram: unknown;
  _material: Material;
}

export interface RnWebGLTexture extends WebGLTexture {
  _resourceUid: number;
}
