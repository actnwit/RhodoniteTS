import {
  ShaderSemanticsInfo,
  ShaderSemanticsName,
} from '../foundation/definitions/ShaderSemantics';

export interface RnWebGLProgram extends WebGLProgram {
  _gl: WebGLRenderingContext | WebGL2RenderingContext;
  _materialTypeName: string;
  _vertexShaderStr: string;
  _fragmentShaderStr: string;
  _shaderSemanticsInfoMap: Map<ShaderSemanticsName, ShaderSemanticsInfo>;
  __SPECTOR_rebuildProgram: unknown;
}

export interface RnWebGLTexture extends WebGLTexture {
  _resourceUid: number;
}
