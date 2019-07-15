import { VertexAttributeEnum } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import { CompositionTypeEnum } from "../../foundation/main";
import ISingleShader from "./ISingleShader";
export declare type AttributeNames = Array<string>;
export default class ShadowMapping32bitClassicShader extends GLSLShader implements ISingleShader {
    static __instance: ShadowMapping32bitClassicShader;
    static readonly materialElement: import("../../foundation/definitions/ShaderNode").ShaderNodeEnum;
    private constructor();
    static getInstance(): ShadowMapping32bitClassicShader;
    readonly vertexShaderDefinitions: string;
    vertexShaderBody: string;
    getFragmentShader(): string;
    readonly pixelShaderDefinitions: string;
    getPixelShaderBody(): string;
    attributeNames: AttributeNames;
    attributeSemantics: Array<VertexAttributeEnum>;
    readonly attributeCompositions: Array<CompositionTypeEnum>;
}
