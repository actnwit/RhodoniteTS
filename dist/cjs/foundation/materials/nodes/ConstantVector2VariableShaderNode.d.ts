import { CompositionType } from '../../definitions';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { IVector2 } from '../../math/IVector';
import { ConstantVariableShaderNode } from './ConstantVariableShaderNode';
export declare class ConstantVector2VariableShaderNode<T extends ComponentTypeEnum> extends ConstantVariableShaderNode<typeof CompositionType.Vec2, T> {
    constructor(componentType: T);
    setDefaultInputValue(value: IVector2): void;
}
