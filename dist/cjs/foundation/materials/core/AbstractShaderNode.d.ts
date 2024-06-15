import { RnObject } from '../../core/RnObject';
import { GLSLShader } from '../../../webgl/shaders/GLSLShader';
import { VertexAttributeEnum } from '../../definitions/VertexAttribute';
import { ShaderSemanticsEnum } from '../../definitions/ShaderSemantics';
import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { Socket } from './Socket';
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
    private __shaderCode?;
    protected __inputs: Socket<string, CompositionTypeEnum, ComponentTypeEnum>[];
    protected __outputs: Socket<string, CompositionTypeEnum, ComponentTypeEnum>[];
    protected __inputConnections: ShaderNodeInputConnectionType[];
    private static __invalidShaderNodeCount;
    protected __shaderNodeUid: ShaderNodeUID;
    protected __shader?: GLSLShader;
    private _shaderStage;
    constructor(shaderNodeName: string, shaderCode?: string, shader?: GLSLShader);
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
    get shaderCode(): string | undefined;
    get shaderNodeUid(): ShaderNodeUID;
    getInput(name: string): Socket<string, CompositionTypeEnum, ComponentTypeEnum> | undefined;
    getInputs(): Socket<string, CompositionTypeEnum, ComponentTypeEnum>[];
    getOutput(name: string): Socket<string, CompositionTypeEnum, ComponentTypeEnum> | undefined;
    getOutputs(): Socket<string, CompositionTypeEnum, ComponentTypeEnum>[];
    get inputConnections(): ShaderNodeInputConnectionType[];
    get shader(): GLSLShader | undefined;
}
export {};
