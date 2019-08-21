import { VertexAttributeEnum } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import { CompositionTypeEnum } from "../../foundation/main";
import ISingleShader from "./ISingleShader";
export declare type AttributeNames = Array<string>;
export default class GammaCorrectionShader extends GLSLShader implements ISingleShader {
    static __instance: GammaCorrectionShader;
    static readonly materialElement: import("../../foundation/definitions/ShaderNode").ShaderNodeEnum;
    private constructor();
    static getInstance(): GammaCorrectionShader;
    readonly vertexShaderDefinitions: string;
    vertexShaderBody: string;
    getVertexShaderBody(args: any): string;
    getFragmentShader(args: any): string;
    readonly pixelShaderDefinitions: string;
    getPixelShaderBody(args: Object): string;
    attributeNames: AttributeNames;
    attributeSemantics: Array<VertexAttributeEnum>;
    readonly attributeCompositions: Array<CompositionTypeEnum>;
}
