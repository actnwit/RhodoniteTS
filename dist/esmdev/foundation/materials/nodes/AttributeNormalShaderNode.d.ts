import { AbstractShaderNode } from '../core/AbstractShaderNode';
/**
 * A shader node that provides access to vertex normal attributes.
 * This node outputs the normal vector attribute of vertices for use in shader computations.
 * It supports both WebGL (GLSL) and WebGPU (WGSL) rendering backends.
 *
 * @example
 * ```typescript
 * const normalNode = new AttributeNormalShaderNode();
 * // Use the normal output in other shader nodes
 * const normalOutput = normalNode.getOutput('outValue');
 * ```
 */
export declare class AttributeNormalShaderNode extends AbstractShaderNode {
    /**
     * Creates a new AttributeNormalShaderNode instance.
     *
     * Initializes the shader node with vertex stage shader code for both GLSL and WGSL,
     * and sets up a Vec3 float output for the normal vector attribute.
     * The output represents the normal vector in 3D space with floating-point precision.
     */
    constructor();
}
