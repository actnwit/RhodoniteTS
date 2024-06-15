import { CompositionType } from '../../definitions';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { IVector3 } from '../../math/IVector';
import { ConstantVariableShaderNode } from './ConstantVariableShaderNode';
export declare class ConstantVector3VariableShaderNode<T extends ComponentTypeEnum> extends ConstantVariableShaderNode<typeof CompositionType.Vec3, T> {
    constructor(componentType: T);
    setDefaultInputValue(value: IVector3): void;
}
