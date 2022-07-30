import { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import { GLSLShader } from '../GLSLShader';
import { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import { AttributeNames } from '../../types';
export declare class EndShader extends GLSLShader {
    static __instance: EndShader;
    static readonly materialElement: import("../../..").EnumIO;
    private constructor();
    static getInstance(): EndShader;
    get vertexShaderDefinitions(): string;
    get vertexShaderBody(): string;
    get pixelShaderDefinitions(): string;
    getPixelShaderBody(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}
