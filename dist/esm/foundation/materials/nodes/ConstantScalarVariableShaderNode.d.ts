import { CompositionType } from '../../definitions';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { IScalar } from '../../math/IVector';
import { ConstantVariableShaderNode } from './ConstantVariableShaderNode';
export declare class ConstantScalarVariableShaderNode<T extends ComponentTypeEnum> extends ConstantVariableShaderNode<typeof CompositionType.Scalar, T> {
    constructor(componentType: T);
    setDefaultInputValue(value: IScalar): void;
}
