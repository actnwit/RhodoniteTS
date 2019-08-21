import { VertexAttributeEnum } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import { CompositionTypeEnum } from "../../foundation/main";
import ISingleShader from "./ISingleShader";
export declare type AttributeNames = Array<string>;
export default class EntityUIDOutputShader extends GLSLShader implements ISingleShader {
    static __instance: EntityUIDOutputShader;
    static readonly materialElement: import("../../foundation/definitions/ShaderNode").ShaderNodeEnum;
    private constructor();
    static getInstance(): EntityUIDOutputShader;
    getVertexShaderBody(args: any): string;
    readonly vertexShaderDefinitions: string;
    vertexShaderBody: string;
    getFragmentShader(args: any): string;
    readonly pixelShaderDefinitions: string;
    getPixelShaderBody(args: Object): string;
    attributeNames: AttributeNames;
    attributeSemantics: Array<VertexAttributeEnum>;
    readonly attributeCompositions: Array<CompositionTypeEnum>;
}
