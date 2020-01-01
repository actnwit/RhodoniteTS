import { VertexAttributeEnum } from "../../../foundation/definitions/VertexAttribute";
import GLSLShader from "../GLSLShader";
import { CompositionTypeEnum } from "../../../foundation/definitions/CompositionType";
export declare type AttributeNames = Array<string>;
export default class AddShader extends GLSLShader {
    static __instance: AddShader;
    static readonly materialElement: import("../../../foundation/definitions/ShaderNode").ShaderNodeEnum;
    private constructor();
    static getInstance(): AddShader;
    get vertexShaderDefinitions(): string;
    get vertexShaderBody(): string;
    get pixelShaderDefinitions(): string;
    get pixelShaderBody(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}
