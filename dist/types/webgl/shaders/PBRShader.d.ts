import { VertexAttributeEnum } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import { CompositionTypeEnum } from "../../foundation/main";
import ISingleShader from "./ISingleShader";
export declare type AttributeNames = Array<string>;
export default class PBRShader extends GLSLShader implements ISingleShader {
    static __instance: PBRShader;
    static readonly materialElement: import("../../foundation/definitions/ShaderNode").ShaderNodeEnum;
    private constructor();
    static getInstance(): PBRShader;
    readonly vertexShaderDefinitions: string;
    getVertexShaderBody(args: any): string;
    vertexShaderBody: string;
    getFragmentShader(args: any): string;
    readonly pixelShaderDefinitions: string;
    getPixelShaderBody(args: Object): string;
    attributeNames: AttributeNames;
    attributeSemantics: Array<VertexAttributeEnum>;
    readonly attributeCompositions: Array<CompositionTypeEnum>;
}
