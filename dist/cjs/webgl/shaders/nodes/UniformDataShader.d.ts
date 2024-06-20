import { CommonShaderPart } from '../CommonShaderPart';
import { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import { ComponentTypeEnum } from '../../../foundation/definitions/ComponentType';
import { AttributeNames } from '../../types/CommonTypes';
import { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
export declare class UniformDataShader extends CommonShaderPart {
    private __functionName;
    private __compositionType;
    private __componentType;
    private __variableName;
    private __valueStr;
    constructor(__functionName: string, __compositionType: CompositionTypeEnum, __componentType: ComponentTypeEnum);
    setVariableName(name: any): void;
    setDefaultValue(value: any): void;
    get vertexShaderDefinitions(): string;
    get pixelShaderDefinitions(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}
