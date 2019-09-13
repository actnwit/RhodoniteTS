export default interface ISingleShader {
  getPixelShaderBody(args?: Object): string;
  getVertexShaderBody(args?: Object): string;
}
