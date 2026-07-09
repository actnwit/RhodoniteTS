import { AbstractShaderNode } from '../../core/AbstractShaderNode';
/**
 * A shader node that applies a world matrix to a signed distance function.
 * This node accepts a position and a world matrix and outputs the signed distance to the transformed position.
 *
 * @example
 * ```typescript
 * // Create a world matrix node
 * const worldMatrixNode = new WorldMatrixShaderNode();
 * const sdApplyWorldMatrixNode = new SdApplyWorldMatrixShaderNode();
 * sdApplyWorldMatrixNode.setInput('position', transformNode.getOutput('outValue'));
 * sdApplyWorldMatrixNode.setInput('worldMatrix', worldMatrixNode.getOutput('outValue'));
 * sdApplyWorldMatrixNode.setOutput('outDistance', worldMatrixNode.getOutput('outValue'));
 * ```
 */
export declare class SdApplyWorldMatrixShaderNode extends AbstractShaderNode {
    /**
     * Creates a new SdApplyWorldMatrixShaderNode instance.
     */
    constructor();
    setUniformDataName(value: any): void;
}
