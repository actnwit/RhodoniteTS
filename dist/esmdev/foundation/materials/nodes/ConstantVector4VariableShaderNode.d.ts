import { CompositionType } from '../../definitions';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { IVector4 } from '../../math/IVector';
import { ConstantVariableShaderNode } from './ConstantVariableShaderNode';
export declare class ConstantVector4VariableShaderNode<T extends ComponentTypeEnum> extends ConstantVariableShaderNode<typeof CompositionType.Vec4, T> {
    constructor(componentType: T);
    setDefaultInputValue(value: IVector4): void;
}
