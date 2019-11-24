import { CompositionTypeEnum } from "../../foundation/definitions/CompositionType";
import GLSLShader from "./GLSLShader";
import ISingleShader from "./ISingleShader";
import { VertexAttributeEnum } from "../../foundation/definitions/VertexAttribute";
export declare type AttributeNames = Array<string>;
export default class GammaCorrectionShader extends GLSLShader implements ISingleShader {
    static __instance: GammaCorrectionShader;
    static readonly materialElement: import("../../foundation/definitions/ShaderNode").ShaderNodeEnum;
    private constructor();
    static getInstance(): GammaCorrectionShader;
    getVertexShaderBody(args: any): string;
    getPixelShaderBody(args: any): string;
    attributeNames: AttributeNames;
    attributeSemantics: Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}
