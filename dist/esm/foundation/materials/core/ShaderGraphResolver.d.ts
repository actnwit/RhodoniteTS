import { AbstractShaderNode } from './AbstractShaderNode';
import { ShaderTypeEnum } from '../../definitions/ShaderType';
export declare class ShaderGraphResolver {
    static createVertexShaderCode(vertexNodes: AbstractShaderNode[], varyingNodes: AbstractShaderNode[], isFullVersion?: boolean): {
        shader: string;
        shaderBody: string;
    } | undefined;
    static createPixelShaderCode(pixelNodes: AbstractShaderNode[], isFullVersion?: boolean): {
        shader: string;
        shaderBody: string;
    } | undefined;
    private static __validateShaderNodes;
    private static __sortTopologically;
    static getFunctionDefinition(shaderNodes: AbstractShaderNode[], shaderType: ShaderTypeEnum): string;
    private static __constructShaderWithNodes;
}
