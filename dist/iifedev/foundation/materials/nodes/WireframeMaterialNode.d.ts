import { AbstractShaderNode } from '../core/AbstractShaderNode';
/**
 * A material node that applies wireframe rendering effects to geometry.
 * This node takes an existing fragment color and a wireframe color as inputs,
 * and outputs a combined color that renders the wireframe effect.
 */
export declare class WireframeMaterialNode extends AbstractShaderNode {
    /**
     * Creates a new WireframeMaterialNode instance.
     * Sets up the shader node with wireframe GLSL code and defines input/output parameters:
     * - Inputs: existingFragColor (Vec4), wireframeColor (Vec4)
     * - Output: outColor (Vec4)
     */
    constructor();
}
