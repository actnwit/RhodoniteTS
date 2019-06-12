import { VertexAttributeEnum } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import { CompositionTypeEnum } from "../../foundation/main";
export declare type AttributeNames = Array<string>;
export default class WireframeShader extends GLSLShader {
    static __instance: WireframeShader;
    static readonly materialElement: import("../../foundation/definitions/ShaderNode").ShaderNodeEnum;
    private constructor();
    static getInstance(): WireframeShader;
    readonly vertexShaderDefinitions: string;
    readonly pixelShaderDefinitions: string;
    vertexShaderBody: string;
    readonly pixelShaderBody: string;
    readonly attributeNames: AttributeNames;
    readonly attributeSemantics: Array<VertexAttributeEnum>;
    readonly attributeCompositions: Array<CompositionTypeEnum>;
}
