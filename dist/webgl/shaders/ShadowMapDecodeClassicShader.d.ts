import { VertexAttributeEnum } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import { CompositionTypeEnum } from "../../foundation/definitions/CompositionType";
import ISingleShader from "./ISingleShader";
export declare type AttributeNames = Array<string>;
export default class ShadowMapDecodeClassicShader extends GLSLShader implements ISingleShader {
    static __instance: ShadowMapDecodeClassicShader;
    static readonly materialElement: import("../../foundation/definitions/ShaderNode").ShaderNodeEnum;
    private constructor();
    static getInstance(): ShadowMapDecodeClassicShader;
    getVertexShaderBody(args: any): string;
    getFragmentShader(args: any): string;
    getPixelShaderBody(args: Object): string;
    attributeNames: AttributeNames;
    attributeSemantics: Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}
