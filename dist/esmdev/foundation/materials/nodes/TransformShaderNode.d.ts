import type { ComponentTypeEnum } from '../../definitions/ComponentType';
import type { CompositionTypeEnum } from '../../definitions/CompositionType';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
/**
 * A shader node that performs matrix-vector transformation operations.
 * This node multiplies a matrix (left-hand side) with a vector (right-hand side)
 * to produce a transformed vector output. Supports Mat2x2*Vec2, Mat3x3*Vec3, and Mat4x4*Vec4 operations.
 */
export declare class TransformShaderNode extends AbstractShaderNode {
    /**
     * Creates a new TransformShaderNode instance.
     *
     * @param lhsCompositionType - The composition type of the left-hand side operand (matrix)
     * @param lhsComponentType - The component type of the left-hand side operand
     * @param rhsCompositionType - The composition type of the right-hand side operand (vector)
     * @param rhsComponentType - The component type of the right-hand side operand
     *
     * @throws {Error} When unsupported matrix-vector combinations are provided
     */
    constructor(lhsCompositionType: CompositionTypeEnum, lhsComponentType: ComponentTypeEnum, rhsCompositionType: CompositionTypeEnum, rhsComponentType: ComponentTypeEnum);
    /**
     * Gets the appropriate shader function name derivative based on the current process approach.
     * For WebGPU, returns a specific function name based on matrix and vector dimensions.
     * For other approaches, returns the base shader function name.
     *
     * @param engine - The engine instance
     * @returns The shader function name to use for this transformation
     * @throws {Error} When the matrix-vector combination is not implemented for WebGPU
     */
    getShaderFunctionNameDerivative(engine: Engine): string;
}
