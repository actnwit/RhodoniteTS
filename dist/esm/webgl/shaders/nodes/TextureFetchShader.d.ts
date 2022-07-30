import { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import { GLSLShader } from '../GLSLShader';
import { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import { MaterialNodeUID } from '../../../types/CommonTypes';
import { AttributeNames } from '../../types';
export declare class TextureFetchShader extends GLSLShader {
    static __instance: TextureFetchShader;
    private __materialNodeUid;
    constructor();
    set materialNodeUid(materialNodeUid: MaterialNodeUID);
    vertexShaderBody: string;
    getPixelShaderBody(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}
