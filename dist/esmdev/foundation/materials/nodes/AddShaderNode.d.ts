import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { Socket } from '../core/Socket';
export declare class AddShaderNode extends AbstractShaderNode {
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
    getSocketInputLhs(): Socket<string, CompositionTypeEnum, ComponentTypeEnum>;
    getSocketInputRhs(): Socket<string, CompositionTypeEnum, ComponentTypeEnum>;
    getSocketOutput(): Socket<string, CompositionTypeEnum, ComponentTypeEnum>;
}
