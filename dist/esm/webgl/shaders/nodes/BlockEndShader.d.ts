import { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import { GLSLShader } from '../GLSLShader';
import { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import { ShaderSocket } from '../../../foundation/materials/core/AbstractMaterialContent';
import { AttributeNames } from '../../types/CommonTypes';
export declare class BlockEndShader extends GLSLShader {
    private __functionName;
    private __valueInputs;
    private __valueOutputs;
    constructor(__functionName: string, __valueInputs: ShaderSocket[], __valueOutputs: ShaderSocket[]);
    get vertexShaderDefinitions(): string;
    get pixelShaderDefinitions(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}