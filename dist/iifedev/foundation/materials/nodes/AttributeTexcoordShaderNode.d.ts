import { AbstractShaderNode } from '../core/AbstractShaderNode';
/**
 * A shader node that provides texture coordinate attributes from vertex data.
 * This node outputs UV coordinates for texture mapping operations.
 *
 * @extends AbstractShaderNode
 */
export declare class AttributeTexcoordShaderNode extends AbstractShaderNode {
    /**
     * Creates a new AttributeTexcoordShaderNode instance.
     * Initializes the node with GLSL and WGSL shader codes for texture coordinate attributes.
     * Sets up the vertex shader stage and configures the output as a Vec3 float value.
     */
    constructor();
}
