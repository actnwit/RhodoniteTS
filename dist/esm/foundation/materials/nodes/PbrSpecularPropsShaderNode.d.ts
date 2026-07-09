import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that performs PBR specular properties operations.
 * @example
 * ```typescript
 * // Create an PBR node for Vec3 float operations
 * const pbrSpecularPropsNode = new PbrSpecularPropsNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrSpecularPropsNode.getSocketOutput();
 * ```
 */
export declare class PbrSpecularPropsShaderNode extends AbstractShaderNode {
    /**
     * Creates a new PbrSpecularPropsNode with the specified composition and component types.
     */
    constructor();
    /**
     * Gets the output socket that contains the result of the specular properties operation.
     *
     * @returns The output socket containing the specular properties result
     */
    getSocketOutput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
