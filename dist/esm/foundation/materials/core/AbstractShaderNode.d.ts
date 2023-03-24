import { RnObject } from '../../core/RnObject';
import { ShaderSocket } from './AbstractMaterialContent';
import { GLSLShader } from '../../../webgl/shaders/GLSLShader';
export declare type ShaderNodeUID = number;
declare type ShaderNodeInputConnectionType = {
    shaderNodeUid: number;
    outputNameOfPrev: string;
    inputNameOfThis: string;
};
/**
 * AbstractShaderNode is a class that represents a shader node.
 */
export declare abstract class AbstractShaderNode extends RnObject {
    static _shaderNodes: AbstractShaderNode[];
    protected __shaderFunctionName: string;
    private __shaderCode?;
    protected __inputs: ShaderSocket[];
    protected __outputs: ShaderSocket[];
    protected __inputConnections: ShaderNodeInputConnectionType[];
    private static __invalidShaderNodeCount;
    protected __shaderNodeUid: ShaderNodeUID;
    protected __shader?: GLSLShader;
    constructor(shaderNodeName: string, shaderCode?: string, shader?: GLSLShader);
    addInputConnection(inputShaderNode: AbstractShaderNode, outputNameOfPrev: string, inputNameOfThis: string): void;
    get shaderFunctionName(): string;
    get shaderCode(): string | undefined;
    get shaderNodeUid(): ShaderNodeUID;
    getInput(name: string): ShaderSocket | undefined;
    getInputs(): ShaderSocket[];
    getOutput(name: string): ShaderSocket | undefined;
    getOutputs(): ShaderSocket[];
    get inputConnections(): ShaderNodeInputConnectionType[];
    get shader(): GLSLShader | undefined;
}
export {};
