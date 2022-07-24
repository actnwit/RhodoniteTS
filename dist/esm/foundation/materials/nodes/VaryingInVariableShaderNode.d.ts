import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
export declare class VaryingInVariableShaderNode extends AbstractShaderNode {
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
    setVaryingVariableName(value: any): void;
}
