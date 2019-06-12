import { VertexAttributeEnum } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import { CompositionTypeEnum } from "../../foundation/main";
export declare type AttributeNames = Array<string>;
export default class ShadowMappingDecodeClassicShader extends GLSLShader {
    static __instance: ShadowMappingDecodeClassicShader;
    static readonly materialElement: import("../../foundation/definitions/ShaderNode").ShaderNodeEnum;
    private constructor();
    static getInstance(): ShadowMappingDecodeClassicShader;
    readonly vertexShaderDefinitions: string;
    vertexShaderBody: string;
    readonly fragmentShaderSimple: string;
    readonly pixelShaderDefinitions: string;
    readonly pixelShaderBody: string;
    attributeNames: AttributeNames;
    attributeSemantics: Array<VertexAttributeEnum>;
    readonly attributeCompositions: Array<CompositionTypeEnum>;
}
