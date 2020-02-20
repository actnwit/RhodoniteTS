import RnObject from "../../core/RnObject";
import { ShaderSocket } from "./AbstractMaterialNode";
import GLSLShader from "../../../webgl/shaders/GLSLShader";
export declare type ShaderNodeUID = number;
declare type ShaderNodeInputConnectionType = {
    shaderNodeUid: number;
    outputNameOfPrev: string;
    inputNameOfThis: string;
};
export default abstract class AbstractShaderNode extends RnObject {
    static shaderNodes: AbstractShaderNode[];
    protected __shaderFunctionName: string;
    private __shaderCode?;
    protected __inputs: ShaderSocket[];
    protected __outputs: ShaderSocket[];
    protected __inputConnections: ShaderNodeInputConnectionType[];
    private static readonly __invalidShaderNodeUid;
    private static __invalidShaderNodeCount;
    protected __shaderNodeUid: ShaderNodeUID;
    protected __shader?: GLSLShader;
    constructor(shaderNodeName: string, shaderCode?: string, shader?: GLSLShader);
    get shaderFunctionName(): string;
    get shaderCode(): string | undefined;
    get shaderNodeUid(): number;
    getInput(name: string): ShaderSocket | undefined;
    getInputs(): ShaderSocket[];
    getOutput(name: string): ShaderSocket | undefined;
    getOutputs(): ShaderSocket[];
    addInputConnection(inputShaderNode: AbstractShaderNode, outputNameOfPrev: string, inputNameOfThis: string): void;
    get inputConnections(): ShaderNodeInputConnectionType[];
    get shader(): GLSLShader | undefined;
}
export {};
