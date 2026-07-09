import { type ComponentTypeEnum } from '../../definitions/ComponentType';
import { type CompositionTypeEnum } from '../../definitions/CompositionType';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
/**
 * A shader node that casts bool, int, or uint types to float.
 * Supports scalar and vector types (Vec2, Vec3, Vec4).
 *
 * This node is useful for converting integer-based data (like joint indices)
 * to floating-point values for use in shader calculations.
 *
 * @example
 * ```typescript
 * const castNode = new CastToFloatShaderNode(CompositionType.Vec4, ComponentType.UnsignedInt);
 * // Converts uvec4 to vec4<float>
 * ```
 */
export declare class CastToFloatShaderNode extends AbstractShaderNode {
    private __inputComponentType;
    private __compositionType;
    /**
     * Creates a new CastToFloatShaderNode instance.
     *
     * @param compositionType - The composition type (Scalar, Vec2, Vec3, or Vec4)
     * @param inputComponentType - The input component type (Bool, Int, or UnsignedInt)
     */
    constructor(compositionType: CompositionTypeEnum, inputComponentType: ComponentTypeEnum);
    /**
     * Gets the derivative shader function name based on the current process approach,
     * composition type, and input component type.
     *
     * For WebGPU, it generates specialized function names like:
     * - castToFloatBoolScalar, castToFloatIntScalar, castToFloatUintScalar
     * - castToFloatBoolVec2, castToFloatIntVec2, castToFloatUintVec2
     * - etc.
     *
     * For WebGL, it returns the base function name (uses GLSL function overloading).
     *
     * @param engine - The engine instance
     * @returns The appropriate shader function name for the current context
     */
    getShaderFunctionNameDerivative(engine: Engine): string;
}
