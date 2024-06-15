import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { IVector } from '../../math/IVector';
import { Socket } from '../core/Socket';
export declare abstract class ConstantVariableShaderNode<N extends CompositionTypeEnum, T extends ComponentTypeEnum> extends AbstractShaderNode {
    constructor(nodeName: string, compositionType: N, componentType: T);
    setDefaultInputValue(value: IVector): void;
    getSocketOutput(): Socket<string, CompositionTypeEnum, ComponentTypeEnum>;
}
