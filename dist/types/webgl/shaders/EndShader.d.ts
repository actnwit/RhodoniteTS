import { VertexAttributeEnum } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import { CompositionTypeEnum } from "../../foundation/main";
export declare type AttributeNames = Array<string>;
export default class EndShader extends GLSLShader {
    static __instance: EndShader;
    static readonly materialElement: import("../../foundation/definitions/ShaderNode").ShaderNodeEnum;
    private constructor();
    static getInstance(): EndShader;
    readonly vertexShaderDefinitions: string;
    readonly vertexShaderBody: string;
    readonly pixelShaderDefinitions: string;
    readonly pixelShaderBody: string;
    readonly attributeNames: AttributeNames;
    readonly attributeSemantics: Array<VertexAttributeEnum>;
    readonly attributeCompositions: Array<CompositionTypeEnum>;
}
