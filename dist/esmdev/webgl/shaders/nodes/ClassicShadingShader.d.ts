import { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import { CommonShaderPart } from '../CommonShaderPart';
import { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import { AttributeNames } from '../../types/CommonTypes';
export declare class ClassicShadingShader extends CommonShaderPart {
    static __instance: ClassicShadingShader;
    static readonly materialElement: import("../../../foundation").EnumIO;
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
