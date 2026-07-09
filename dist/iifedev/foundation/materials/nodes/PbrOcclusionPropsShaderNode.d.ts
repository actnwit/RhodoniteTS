import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that performs PBR occlusion properties operations.
 * @example
 * ```typescript
 * // Create an PBR occlusion props node for Vec4 float operations
 * const pbrOcclusionPropsNode = new PbrOcclusionPropsNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrOcclusionPropsNode.getSocketOutput();
 * ```
 */
export declare class PbrOcclusionPropsShaderNode extends AbstractShaderNode {
    /**
     * Creates a new PbrOcclusionPropsNode with the specified composition and component types.
     */
    constructor();
    /**
     * Gets the output socket that contains the result of the PBR shading operation.
     *
     * @returns The output socket containing the PBR shading result
     */
    getSocketOutput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
