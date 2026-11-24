import type { ComponentTypeEnum } from '../../definitions/ComponentType';
import { type CompositionTypeEnum } from '../../definitions/CompositionType';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that computes atan2(y, x).
 * Supports scalar, vec2, vec3 and vec4 float values.
 *
 * The inputs are named `y` and `x` in the argument order of atan2.
 */
export declare class Atan2ShaderNode extends AbstractShaderNode {
    /**
     * @param compositionType - The composition type (Scalar, Vec2, Vec3, Vec4)
     * @param componentType - The component type (Float)
     */
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
    /**
     * Gets the input socket for the numerator (y) of atan2.
     */
    getSocketInputY(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the input socket for the denominator (x) of atan2.
     */
    getSocketInputX(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the output socket that contains the computed angle.
     */
    getSocketOutput(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the platform-specific shader function name for the atan2 operation.
     */
    getShaderFunctionNameDerivative(engine: Engine): string;
}
