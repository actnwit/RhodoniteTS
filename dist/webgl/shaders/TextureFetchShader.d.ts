import { VertexAttributeEnum } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import { CompositionTypeEnum } from "../../foundation/definitions/CompositionType";
import { MaterialNodeUID } from "../../commontypes/CommonTypes";
export declare type AttributeNames = Array<string>;
export default class TextureFetchShader extends GLSLShader {
    static __instance: TextureFetchShader;
    private __materialNodeUid;
    constructor();
    set materialNodeUid(materialNodeUid: MaterialNodeUID);
    get vertexShaderDefinitions(): string;
    get pixelShaderDefinitions(): string;
    vertexShaderBody: string;
    get pixelShaderBody(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}
