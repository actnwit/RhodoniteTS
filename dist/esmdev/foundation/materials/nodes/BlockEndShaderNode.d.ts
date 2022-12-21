import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
export declare class BlockEndShaderNode extends AbstractShaderNode {
    constructor();
    addInputAndOutput(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum): void;
}
