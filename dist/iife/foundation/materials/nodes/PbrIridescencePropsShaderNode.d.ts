import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that performs PBR iridescence properties operations.
 * @example
 * ```typescript
 * // Create an PBR iridescence props node for Vec4 float operations
 * const pbrIridescencePropsNode = new PbrIridescencePropsNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrIridescencePropsNode.getSocketOutput();
 * ```
 */
export declare class PbrIridescencePropsShaderNode extends AbstractShaderNode {
    /**
     * Creates a new PbrIridescencePropsNode with the specified composition and component types.
     */
    constructor();
    /**
     * Gets the output socket that contains the result of the PBR sheen properties operation.
     *
     * @returns The output socket containing the PBR sheen properties result
     */
    getSocketOutput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
