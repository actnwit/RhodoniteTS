import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
export declare class TransformShaderNode extends AbstractShaderNode {
    constructor(lhsCompositionType: CompositionTypeEnum, lhsComponentType: ComponentTypeEnum, rhsCompositionType: CompositionTypeEnum, rhsComponentType: ComponentTypeEnum);
    getShaderFunctionNameDerivative(): string;
}
