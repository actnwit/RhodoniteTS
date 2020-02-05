import { VertexAttributeEnum } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import { CompositionTypeEnum } from "../../foundation/definitions/CompositionType";
import ISingleShader from "./ISingleShader";
export declare type AttributeNames = Array<string>;
export default class EnvConstantShader extends GLSLShader implements ISingleShader {
    static __instance: EnvConstantShader;
    static readonly materialElement: import("../../foundation/definitions/ShaderNode").ShaderNodeEnum;
    private constructor();
    static getInstance(): EnvConstantShader;
    getVertexShaderBody(args: any): string;
    getPixelShaderBody(args: any): string;
    attributeNames: AttributeNames;
    attributeSemantics: Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}
