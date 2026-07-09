import { type ComponentTypeEnum } from '../../definitions/ComponentType';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
/**
 * A shader node that merges vector components to create various vector outputs.
 *
 * This node provides the capability to combine individual scalar components (x, y, z, w)
 * or smaller vectors (xy, zw, xyz) into larger vector outputs (Vec2, Vec3, Vec4).
 * It supports multiple input configurations and automatically selects the appropriate
 * shader function based on which inputs are connected.
 * Supports float, int, and uint component types.
 *
 * @example
 * ```typescript
 * const mergeNode = new MergeVectorShaderNode(ComponentType.Float);
 * // Connect scalar inputs x, y, z, w to create a Vec4 output
 * // Or connect Vec3 xyz and scalar w to create a Vec4 output
 * ```
 */
export declare class MergeVectorShaderNode extends AbstractShaderNode {
    private __componentType;
    /**
     * Creates a new MergeVectorShaderNode instance.
     *
     * @param componentType - The component type (Float, Int, or UnsignedInt). Defaults to Float.
     *
     * Initializes the node with predefined inputs for various vector components
     * and outputs for different vector sizes. The node supports multiple input
     * combinations to create flexible vector merging operations.
     */
    constructor(componentType?: ComponentTypeEnum);
    /**
     * Determines the appropriate shader function name based on connected inputs and component type.
     *
     * This method analyzes which input connections are active and returns the
     * corresponding shader function variant. Each combination of inputs requires
     * a different shader function implementation to handle the vector merging logic.
     * For WebGPU, type suffix (I32, U32) is added for non-float types.
     *
     * Supported input combinations:
     * - XYZ + W: Vec3 input with scalar W component
     * - XY + ZW: Two Vec2 inputs for XY and ZW components
     * - XY + Z + W: Vec2 input with individual Z and W scalars
     * - ZW + X + Y: Vec2 input with individual X and Y scalars
     * - X + Y + Z + W: Four individual scalar components
     *
     * @param engine - The engine instance
     * @returns The derivative function name suffix for the shader
     * @throws {Error} When the input connection pattern is not supported
     */
    getShaderFunctionNameDerivative(engine: Engine): string;
    /**
     * Generates the shader function call statement for the merge vector operation.
     * ShaderGraphResolver already orders varOutputNames to match output socket order and generates
     * dummy variables for unconnected outputs, so we simply use them directly.
     * This node only needs custom handling for selecting the correct input indices based on
     * which inputs are connected.
     *
     * @param engine - The engine instance
     * @param i - The node index in the shader graph
     * @param _shaderNode - The shader node instance (unused in this implementation)
     * @param functionName - The name of the shader function to call
     * @param varInputNames - Array of input variable names for each node
     * @param varOutputNames - Array of output variable names for each node (already ordered by ShaderGraphResolver)
     * @returns The generated shader code string for the function call
     */
    makeCallStatement(engine: Engine, i: number, _shaderNode: AbstractShaderNode, functionName: string, varInputNames: string[][], varOutputNames: string[][]): string;
}
