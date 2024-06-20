import { RnObject } from '../../core/RnObject';
import { CommonShaderPart } from '../../../webgl/shaders/CommonShaderPart';
import { VertexAttributeEnum } from '../../definitions/VertexAttribute';
import { ShaderSemanticsEnum } from '../../definitions/ShaderSemantics';
import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { Socket } from './Socket';
import { ShaderTypeEnum } from '../../definitions/ShaderType';
export type ShaderAttributeOrSemanticsOrString = string | VertexAttributeEnum | ShaderSemanticsEnum;
export type ShaderSocket = {
    compositionType: CompositionTypeEnum;
    componentType: ComponentTypeEnum;
    name: ShaderAttributeOrSemanticsOrString;
    isClosed?: boolean;
};
export type ShaderNodeUID = number;
type ShaderNodeInputConnectionType = {
    shaderNodeUid: number;
    outputNameOfPrev: string;
    inputNameOfThis: string;
};
type ShaderStage = 'Neutral' | 'Vertex' | 'Fragment';
/**
 * AbstractShaderNode is a abstract class that represents a shader node.
 */
export declare abstract class AbstractShaderNode extends RnObject {
    static _shaderNodes: AbstractShaderNode[];
    protected __shaderFunctionName: string;
    protected __inputs: Socket<string, CompositionTypeEnum, ComponentTypeEnum>[];
    protected __outputs: Socket<string, CompositionTypeEnum, ComponentTypeEnum>[];
    protected __inputConnections: ShaderNodeInputConnectionType[];
    private static __invalidShaderNodeCount;
    protected __shaderNodeUid: ShaderNodeUID;
    private __codeGLSL?;
    private __codeWGSL?;
    protected __commonPart?: CommonShaderPart;
    private _shaderStage;
    constructor(shaderNodeName: string, shader: {
        codeGLSL?: string;
        codeWGSL?: string;
        commonPart?: CommonShaderPart;
    });
    setShaderStage(stage: ShaderStage): void;
    getShaderStage(): ShaderStage;
    static getShaderNodeByUid(uid: ShaderNodeUID): AbstractShaderNode;
    /**
     * Add a node connection to this node as an input.
     * @param inputShaderNode - a shader node to connect to this node.
     * @param outputSocketOfInput- the output socket of the inputShaderNode.
     * @param inputSocketOfThis - the input socket of this node.
     */
    addInputConnection<N extends CompositionTypeEnum, T extends ComponentTypeEnum>(inputShaderNode: AbstractShaderNode, outputSocketOfInput: Socket<string, N, T>, inputSocketOfThis: Socket<string, N, T>): void;
    get shaderFunctionName(): string;
    getShaderFunctionNameDerivative(): string;
    getShaderCode(shaderStage: ShaderTypeEnum): string;
    get shaderNodeUid(): ShaderNodeUID;
    getInput(name: string): Socket<string, CompositionTypeEnum, ComponentTypeEnum> | undefined;
    getInputs(): Socket<string, CompositionTypeEnum, ComponentTypeEnum>[];
    getOutput(name: string): Socket<string, CompositionTypeEnum, ComponentTypeEnum> | undefined;
    getOutputs(): Socket<string, CompositionTypeEnum, ComponentTypeEnum>[];
    get inputConnections(): ShaderNodeInputConnectionType[];
    makeCallStatement(i: number, shaderNode: AbstractShaderNode, functionName: string, varInputNames: string[][], varOutputNames: string[][]): string;
}
export {};
