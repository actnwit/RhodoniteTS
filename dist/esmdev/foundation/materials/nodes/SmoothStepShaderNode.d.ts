import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { Socket } from '../core/Socket';
export declare class SmoothStepShaderNode extends AbstractShaderNode {
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
    getSocketInputValue(): Socket<string, CompositionTypeEnum, ComponentTypeEnum>;
    getSocketOutput(): Socket<string, CompositionTypeEnum, ComponentTypeEnum>;
    getShaderFunctionNameDerivative(): string;
}
