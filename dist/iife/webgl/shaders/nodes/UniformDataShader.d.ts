import type { ComponentTypeEnum } from '../../../foundation/definitions/ComponentType';
import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { Engine } from '../../../foundation/system/Engine';
import type { AttributeNames } from '../../types/CommonTypes';
import { StandardShaderPart } from '../StandardShaderPart';
export declare class UniformDataShader extends StandardShaderPart {
    private __functionName;
    private __compositionType;
    private __componentType;
    private __variableName;
    private __valueStr;
    constructor(__functionName: string, __compositionType: CompositionTypeEnum, __componentType: ComponentTypeEnum);
    setVariableName(name: any): void;
    setDefaultValue(value: any): void;
    getVertexShaderDefinitions(engine: Engine): string;
    getPixelShaderDefinitions(engine: Engine): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}
