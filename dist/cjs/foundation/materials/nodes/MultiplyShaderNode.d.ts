import { ComponentTypeEnum } from '../../../foundation/definitions/ComponentType';
import { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
export declare class MultiplyShaderNode extends AbstractShaderNode {
    constructor(lhsCompositionType: CompositionTypeEnum, lhsComponentType: ComponentTypeEnum, rhsCompositionType: CompositionTypeEnum, rhsComponentType: ComponentTypeEnum);
}
