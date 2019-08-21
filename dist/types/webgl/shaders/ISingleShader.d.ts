export default interface ISingleShader {
    getFragmentShader(args?: Object): string;
    getPixelShaderBody(args?: Object): string;
    getVertexShaderBody?(args?: Object): string;
}
