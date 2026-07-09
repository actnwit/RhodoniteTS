import { type ComponentTypeEnum } from '../../../foundation/definitions/ComponentType';
import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
/**
 * A shader node that performs multiplication operations between two inputs.
 * Supports various data types including scalars, vectors, and matrices for both WebGL and WebGPU.
 *
 * @example
 * ```typescript
 * // Create a multiplication node for two Vec3 float values
 * const multiplyNode = new MultiplyShaderNode(CompositionType.Vec3, ComponentType.Float);
 * ```
 */
export declare class MultiplyShaderNode extends AbstractShaderNode {
    /**
     * Creates a new MultiplyShaderNode instance.
     *
     * @param compositionType - The composition type (Scalar, Vec2, Vec3, Vec4, Mat2, Mat3, Mat4) for both inputs and output
     * @param componentType - The component type (Float, Int, etc.) for both inputs and output
     *
     * @remarks
     * The node will have two inputs ('lhs' and 'rhs') and one output ('outValue'),
     * all sharing the same composition and component types.
     */
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
    /**
     * Gets the platform-specific shader function name for the multiplication operation.
     *
     * @returns The appropriate shader function name based on the current process approach and input types
     *
     * @throws {Error} Throws an error if the combination of composition and component types is not implemented
     *
     * @remarks
     * For WebGPU, returns type-specific function names (e.g., 'multiplyF32F32', 'multiplyVec3fVec3f').
     * For WebGL, returns the generic function name 'multiply'.
     *
     * Supported WebGPU type combinations:
     * - Scalar: Float-Float (F32F32), Int-Int (I32I32)
     * - Vec2, Vec3, Vec4: Float vectors
     * - Mat2, Mat3, Mat4: Float matrices
     */
    getShaderFunctionNameDerivative(engine: Engine): string;
}
