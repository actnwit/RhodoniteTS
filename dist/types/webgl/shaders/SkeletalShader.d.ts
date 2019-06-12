import { VertexAttributeEnum } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import { CompositionTypeEnum } from "../../foundation/main";
export declare type AttributeNames = Array<string>;
export default class SkeletalShader extends GLSLShader {
    static __instance: SkeletalShader;
    static readonly materialElement: import("../../foundation/definitions/ShaderNode").ShaderNodeEnum;
    private constructor();
    static getInstance(): SkeletalShader;
    readonly vertexShaderDefinitions: string;
    readonly pixelShaderDefinitions: string;
    vertexShaderBody: string;
    readonly pixelShaderBody: string;
    readonly attributeNames: AttributeNames;
    readonly attributeSemantics: Array<VertexAttributeEnum>;
    readonly attributeCompositions: Array<CompositionTypeEnum>;
}
