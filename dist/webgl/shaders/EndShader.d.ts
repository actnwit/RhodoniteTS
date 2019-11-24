import { VertexAttributeEnum } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import { CompositionTypeEnum } from "../../foundation/definitions/CompositionType";
export declare type AttributeNames = Array<string>;
export default class EndShader extends GLSLShader {
    static __instance: EndShader;
    static readonly materialElement: import("../../foundation/definitions/ShaderNode").ShaderNodeEnum;
    private constructor();
    static getInstance(): EndShader;
    get vertexShaderDefinitions(): string;
    get vertexShaderBody(): string;
    get pixelShaderDefinitions(): string;
    get pixelShaderBody(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}
