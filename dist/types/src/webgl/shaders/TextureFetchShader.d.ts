import { VertexAttributeEnum } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import { CompositionTypeEnum } from "../../foundation/main";
export declare type AttributeNames = Array<string>;
export default class TextureFetchShader extends GLSLShader {
    static __instance: TextureFetchShader;
    private __materialNodeUid;
    constructor();
    materialNodeUid: MaterialNodeUID;
    readonly vertexShaderDefinitions: string;
    readonly pixelShaderDefinitions: string;
    vertexShaderBody: string;
    readonly pixelShaderBody: string;
    readonly attributeNames: AttributeNames;
    readonly attributeSemantics: Array<VertexAttributeEnum>;
    readonly attributeCompositions: Array<CompositionTypeEnum>;
}
