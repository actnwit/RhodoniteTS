import type { ComponentTypeEnum } from '../../definitions/ComponentType';
import { type CompositionTypeEnum } from '../../definitions/CompositionType';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that computes the arc cosine of its input.
 * Supports scalar, vec2, vec3 and vec4 float values.
 */
export declare class AcosShaderNode extends AbstractShaderNode {
    /**
     * @param compositionType - The composition type (Scalar, Vec2, Vec3, Vec4)
     * @param componentType - The component type (Float)
     */
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
    /**
     * Gets the input socket that accepts the value to compute the arc cosine of.
     */
    getSocketInputValue(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the output socket that contains the computed arc cosine.
     */
    getSocketOutput(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the platform-specific shader function name for the acos operation.
     */
    getShaderFunctionNameDerivative(engine: Engine): string;
}
