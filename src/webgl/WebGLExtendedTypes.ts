export interface RnWebGLProgram extends WebGLProgram {
  _gl: WebGLRenderingContext | WebGL2RenderingContext;
  _materialTypeName: string,
  _vertexShaderStr: string,
  _fragmentShaderStr: string,
}

export interface RnWebGLTexture extends WebGLTexture {
  _resourceUid: number
}

