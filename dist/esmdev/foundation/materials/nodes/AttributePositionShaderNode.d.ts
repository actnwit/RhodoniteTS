import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that provides access to vertex position attributes.
 * This node outputs the position attribute data from the vertex buffer,
 * typically used as input for vertex transformations in the rendering pipeline.
 */
export declare class AttributePositionShaderNode extends AbstractShaderNode {
    /**
     * Creates a new AttributePositionShaderNode instance.
     * Initializes the node with position attribute shader code for both GLSL and WGSL,
     * sets up the vertex shader stage, and configures the output socket for Vec4 position data.
     */
    constructor();
    /**
     * Gets the output socket of this attribute position node.
     * The output socket provides a Vec4 value representing the vertex position attribute.
     *
     * @returns The output socket containing the position attribute data
     */
    getSocketOutput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
