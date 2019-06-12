import RnObject from "../core/RnObject";
import { ShaderSemanticsInfo, ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import { CompositionTypeEnum, ComponentTypeEnum, VertexAttributeEnum } from "../main";
import GLSLShader from "../../webgl/shaders/GLSLShader";
export declare type ShaderAttributeOrSemanticsOrString = string | VertexAttributeEnum | ShaderSemanticsEnum;
export declare type ShaderSocket = {
    compositionType: CompositionTypeEnum;
    componentType: ComponentTypeEnum;
    name: ShaderAttributeOrSemanticsOrString;
    isImmediateValue: boolean;
    immediateValue?: string;
};
declare type MaterialNodeUID = number;
declare type InputConnectionType = {
    materialNodeUid: number;
    outputNameOfPrev: string;
    inputNameOfThis: string;
};
export default abstract class AbstractMaterialNode extends RnObject {
    protected __semantics: ShaderSemanticsInfo[];
    private __shaderNode;
    protected __vertexInputs: ShaderSocket[];
    protected __pixelInputs: ShaderSocket[];
    protected __vertexOutputs: ShaderSocket[];
    protected __pixelOutputs: ShaderSocket[];
    private static readonly __invalidMaterialNodeUid;
    private static __invalidMaterialNodeCount;
    private __materialNodeUid;
    protected __vertexInputConnections: InputConnectionType[];
    protected __pixelInputConnections: InputConnectionType[];
    static materialNodes: AbstractMaterialNode[];
    readonly shader: GLSLShader;
    readonly shaderFunctionName: string;
    isSingleOperation: boolean;
    constructor(shader: GLSLShader, shaderFunctionName: string);
    static getMaterialNode(materialNodeUid: MaterialNodeUID): AbstractMaterialNode;
    readonly materialNodeUid: number;
    readonly _semanticsInfoArray: ShaderSemanticsInfo[];
    setShaderSemanticsInfoArray(shaderSemanticsInfoArray: ShaderSemanticsInfo[]): void;
    addVertexInputConnection(materialNode: AbstractMaterialNode, outputNameOfPrev: string, inputNameOfThis: string): void;
    addPixelInputConnection(materialNode: AbstractMaterialNode, outputNameOfPrev: string, inputNameOfThis: string): void;
    readonly vertexInputConnections: InputConnectionType[];
    readonly pixelInputConnections: InputConnectionType[];
    getVertexInput(name: string): ShaderSocket | undefined;
    getVertexOutput(name: string): ShaderSocket | undefined;
    getPixelInput(name: string): ShaderSocket | undefined;
    getPixelOutput(name: string): ShaderSocket | undefined;
}
export {};
