import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that performs PBR diffuse transmission properties operations.
 * @example
 * ```typescript
 * // Create an PBR diffuse transmission props node for Scalar float operations
 * const pbrDiffuseTransmissionPropsShaderNode = new PbrDiffuseTransmissionPropsShaderNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrDiffuseTransmissionPropsShaderNode.getSocketOutput();
 * ```
 */
export declare class PbrDiffuseTransmissionPropsShaderNode extends AbstractShaderNode {
    /**
     * Creates a new PbrDiffuseTransmissionPropsNode with the specified composition and component types.
     */
    constructor();
    /**
     * Gets the output socket that contains the result of the diffuse transmission properties operation.
     *
     * @returns The output socket containing the diffuse transmission properties result
     */
    getSocketOutput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
