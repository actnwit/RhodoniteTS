import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that performs PBR normal properties operations.
 * @example
 * ```typescript
 * // Create an PBR normal props node for Vec3 float operations
 * const pbrNormalPropsNode = new PbrNormalPropsNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrNormalPropsNode.getSocketOutput();
 * ```
 */
export declare class PbrNormalPropsShaderNode extends AbstractShaderNode {
    /**
     * Creates a new PbrNormalPropsNode with the specified composition and component types.
     */
    constructor();
    /**
     * Gets the output socket that contains the result of the PBR normal properties operation.
     *
     * @returns The output socket containing the PBR normal properties result
     */
    getSocketOutput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
