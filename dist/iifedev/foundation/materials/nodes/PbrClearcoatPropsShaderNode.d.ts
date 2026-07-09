import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that performs PBR clearcoat properties operations.
 * @example
 * ```typescript
 * // Create an PBR clearcoat props node for Vec4 float operations
 * const pbrClearcoatPropsNode = new PbrClearcoatPropsNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrClearcoatPropsNode.getSocketOutput();
 * ```
 */
export declare class PbrClearcoatPropsShaderNode extends AbstractShaderNode {
    /**
     * Creates a new PbrClearcoatPropsNode with the specified composition and component types.
     */
    constructor();
    /**
     * Gets the output socket that contains the result of the PBR shading operation.
     *
     * @returns The output socket containing the PBR shading result
     */
    getSocketOutput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
