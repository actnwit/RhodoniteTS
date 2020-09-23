import { VertexAttributeEnum } from "../../../foundation/definitions/VertexAttribute";
import GLSLShader from "../GLSLShader";
import { CompositionTypeEnum } from "../../../foundation/definitions/CompositionType";
export declare type AttributeNames = Array<string>;
export default class ClassicShadingShader extends GLSLShader {
    static __instance: ClassicShadingShader;
    static readonly materialElement: import("../../../foundation/definitions/ShaderNode").ShaderNodeEnum;
    private constructor();
    static getInstance(): ClassicShadingShader;
    get vertexShaderDefinitions(): string;
    get pixelShaderDefinitions(): string;
    vertexShaderBody: string;
    get pixelShaderBody(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}
