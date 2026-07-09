import { type ComponentTypeEnum } from '../../definitions/ComponentType';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
/**
 * A shader node that splits vector inputs into their individual components or smaller vectors.
 * This node can take vec4, vec3, or vec2 inputs and output various combinations of their components
 * including individual scalars (x, y, z, w) and smaller vectors (xy, zw, xyz).
 *
 * Supports both WebGL/GLSL and WebGPU/WGSL shader compilation.
 * Supports float, int, and uint component types.
 *
 * @example
 * ```typescript
 * const splitNode = new SplitVectorShaderNode(ComponentType.Float);
 * // Connect a vec4 input to get x, y, z, w components separately
 * // Or connect vec3 input to get xyz, xy components
 * ```
 */
export declare class SplitVectorShaderNode extends AbstractShaderNode {
    private __componentType;
    /**
     * Creates a new SplitVectorShaderNode instance.
     * Sets up input and output connections for vector splitting operations.
     *
     * @param componentType - The component type (Float, Int, or UnsignedInt). Defaults to Float.
     *
     * Inputs:
     * - xyzw: Vec4 input for 4-component vectors
     * - xyz: Vec3 input for 3-component vectors
     * - xy: Vec2 input for 2-component vectors
     *
     * Outputs:
     * - xyz: Vec3 output (first 3 components)
     * - xy: Vec2 output (first 2 components)
     * - zw: Vec2 output (last 2 components of vec4)
     * - x, y, z, w: Individual scalar components
     */
    constructor(componentType?: ComponentTypeEnum);
    /**
     * Gets the derivative shader function name based on the connected input type and component type.
     * For WebGPU, returns specialized function names (splitVectorXYZW, splitVectorXYZ, splitVectorXY)
     * based on which input is connected, with type suffix (I32, U32) for non-float types.
     * For WebGL, returns the base function name.
     *
     * @returns The appropriate shader function name for the current input connection and process approach
     * @throws {Error} When no valid input connection is found in WebGPU mode
     */
    getShaderFunctionNameDerivative(engine: Engine): string;
    /**
     * Generates shader code for calling the split vector function with appropriate input and output handling.
     * Creates dummy variables for unused outputs and maps connected outputs to their proper variable names.
     * Handles differences between WebGL/GLSL and WebGPU/WGSL syntax, including reference parameters for WebGPU.
     *
     * @param i - The index of the current shader node call
     * @param shaderNode - The shader node instance (unused in this implementation)
     * @param functionName - The name of the shader function to call
     * @param varInputNames - Array of input variable names for each call
     * @param varOutputNames - Array of output variable names for each call
     * @returns The generated shader code string for the function call
     */
    /**
     * Generates shader code for calling the split vector function.
     * ShaderGraphResolver already orders varOutputNames to match output socket order and generates
     * dummy variables for unconnected outputs, so we simply use them directly.
     * This node only needs custom handling for selecting the correct input (xyzw, xyz, or xy).
     *
     * @param engine - The engine instance
     * @param i - The index of the current shader node call
     * @param _shaderNode - The shader node instance (unused in this implementation)
     * @param functionName - The name of the shader function to call
     * @param varInputNames - Array of input variable names for each call
     * @param varOutputNames - Array of output variable names for each call (already ordered by ShaderGraphResolver)
     * @returns The generated shader code string for the function call
     */
    makeCallStatement(engine: Engine, i: number, _shaderNode: AbstractShaderNode, functionName: string, varInputNames: string[][], varOutputNames: string[][]): string;
}
