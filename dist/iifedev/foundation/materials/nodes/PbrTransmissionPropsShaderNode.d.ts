import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that performs PBR transmission properties operations.
 * @example
 * ```typescript
 * // Create an PBR transmission props node for Vec4 float operations
 * const pbrTransmissionPropsNode = new PbrTransmissionPropsNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrTransmissionPropsNode.getSocketOutput();
 * ```
 */
export declare class PbrTransmissionPropsShaderNode extends AbstractShaderNode {
    /**
     * Creates a new PbrTransmissionPropsNode with the specified composition and component types.
     */
    constructor();
    /**
     * Gets the output socket that contains the result of the transmission properties operation.
     *
     * @returns The output socket containing the transmission properties result
     */
    getSocketOutput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
