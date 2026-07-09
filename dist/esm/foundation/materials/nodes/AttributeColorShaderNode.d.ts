import { AbstractShaderNode } from '../core/AbstractShaderNode';
/**
 * A shader node that reads vertex color attributes from the mesh geometry.
 * This node provides access to per-vertex color data in the shader pipeline,
 * allowing for vertex-based coloring effects and material variations.
 *
 * The node outputs a Vec4 color value containing RGBA components that can be
 * used in vertex or fragment shaders for rendering calculations.
 */
export declare class AttributeColorShaderNode extends AbstractShaderNode {
    /**
     * Creates a new AttributeColorShaderNode instance.
     * Initializes the node with vertex color attribute shader code for both
     * WebGL (GLSL) and WebGPU (WGSL) backends, and configures the output
     * to provide a Vec4 color value.
     */
    constructor();
}
