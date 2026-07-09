import { AbstractShaderNode } from '../core/AbstractShaderNode';
/**
 * A shader node that provides access to vertex tangent attributes.
 * This node outputs the tangent vector attribute of vertices for use in shader computations.
 * The tangent is a Vec4 where xyz represents the tangent direction and w represents the
 * bitangent sign (handedness) used to calculate the bitangent vector.
 * It supports both WebGL (GLSL) and WebGPU (WGSL) rendering backends.
 *
 * @example
 * ```typescript
 * const tangentNode = new AttributeTangentShaderNode();
 * // Use the tangent output in other shader nodes
 * const tangentOutput = tangentNode.getOutput('outValue');
 * ```
 */
export declare class AttributeTangentShaderNode extends AbstractShaderNode {
    /**
     * Creates a new AttributeTangentShaderNode instance.
     *
     * Initializes the shader node with vertex stage shader code for both GLSL and WGSL,
     * and sets up a Vec4 float output for the tangent vector attribute.
     * The output represents the tangent vector in 3D space (xyz) with the bitangent sign (w)
     * with floating-point precision.
     */
    constructor();
}
