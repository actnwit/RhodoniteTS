import AbstractShaderNode from "./AbstractShaderNode";
import { ShaderTypeEnum } from "../../definitions/ShaderType";
export default class ShaderGraphResolver {
    static createVertexShaderCode(vertexNodes: AbstractShaderNode[]): {
        shader: string;
        shaderBody: string;
    };
    static createPixelShaderCode(pixelNodes: AbstractShaderNode[]): {
        shader: string;
        shaderBody: string;
    };
    private static __findBeginNode;
    private static __sortTopologically;
    static getFunctionDefinition(shaderNodes: AbstractShaderNode[], shaderType: ShaderTypeEnum): string;
    private static __constructShaderWithNodes;
}
