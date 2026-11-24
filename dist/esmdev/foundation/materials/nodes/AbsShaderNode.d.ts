import type { ComponentTypeEnum } from '../../definitions/ComponentType';
import { type CompositionTypeEnum } from '../../definitions/CompositionType';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that computes the absolute value of its input.
 * Supports scalar, vec2, vec3 and vec4 float values.
 */
export declare class AbsShaderNode extends AbstractShaderNode {
    /**
     * @param compositionType - The composition type (Scalar, Vec2, Vec3, Vec4)
     * @param componentType - The component type (Float)
     */
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
    /**
     * Gets the input socket that accepts the value to compute the absolute value of.
     */
    getSocketInputValue(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the output socket that contains the computed absolute value.
     */
    getSocketOutput(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the platform-specific shader function name for the abs operation.
     */
    getShaderFunctionNameDerivative(engine: Engine): string;
}
