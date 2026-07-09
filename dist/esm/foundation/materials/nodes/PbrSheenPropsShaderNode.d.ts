import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that performs PBR sheen properties operations.
 * @example
 * ```typescript
 * // Create an PBR sheen props node for Vec4 float operations
 * const pbrSheenPropsNode = new PbrSheenPropsNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrSheenPropsNode.getSocketOutput();
 * ```
 */
export declare class PbrSheenPropsShaderNode extends AbstractShaderNode {
    /**
     * Creates a new PbrSheenPropsNode with the specified composition and component types.
     */
    constructor();
    /**
     * Gets the output socket that contains the result of the PBR sheen properties operation.
     *
     * @returns The output socket containing the PBR sheen properties result
     */
    getSocketOutput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
