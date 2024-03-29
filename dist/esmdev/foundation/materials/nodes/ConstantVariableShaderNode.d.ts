import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
export declare class ConstantVariableShaderNode extends AbstractShaderNode {
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
    setDefaultInputValue(inputName: string, value: any): void;
}
