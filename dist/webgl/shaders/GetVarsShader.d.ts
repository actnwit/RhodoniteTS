import { VertexAttributeEnum } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import { ShaderSocket } from "../../foundation/materials/AbstractMaterialNode";
import { CompositionTypeEnum } from "../../foundation/definitions/CompositionType";
export declare type AttributeNames = Array<string>;
export default class GetVarsShader extends GLSLShader {
    static __instance: GetVarsShader;
    static readonly materialElement: import("../../foundation/definitions/ShaderNode").ShaderNodeEnum;
    private __vertexInputs;
    private __vertexOutputs;
    private __pixelInputs;
    private __pixelOutputs;
    private __attributeNames;
    private __attributeSemantics;
    private __attributeCompositions;
    constructor();
    addVertexInputAndOutput(inShaderSocket: ShaderSocket, outShaderSocket: ShaderSocket): void;
    addPixelInputAndOutput(inShaderSocket: ShaderSocket, outShaderSocket: ShaderSocket): void;
    get vertexShaderDefinitions(): string;
    get vertexShaderBody(): string;
    get pixelShaderDefinitions(): string;
    get pixelShaderBody(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}
