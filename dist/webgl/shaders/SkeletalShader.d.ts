import { CompositionTypeEnum } from "../../foundation/definitions/CompositionType";
import GLSLShader from "./GLSLShader";
import { VertexAttributeEnum } from "../../foundation/definitions/VertexAttribute";
export declare type AttributeNames = Array<string>;
export default class SkeletalShader extends GLSLShader {
    static __instance: SkeletalShader;
    static readonly materialElement: import("../../foundation/definitions/ShaderNode").ShaderNodeEnum;
    private constructor();
    static getInstance(): SkeletalShader;
    get vertexShaderDefinitions(): string;
    get pixelShaderDefinitions(): string;
    vertexShaderBody: string;
    get pixelShaderBody(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}
