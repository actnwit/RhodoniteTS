import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that performs PBR base color properties operations.
 * @example
 * ```typescript
 * // Create an PBR base color props node for Vec4 float operations
 * const pbrBaseColorPropsNode = new PbrBaseColorPropsNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrBaseColorPropsNode.getSocketOutput();
 * ```
 */
export declare class PbrBaseColorPropsShaderNode extends AbstractShaderNode {
    /**
     * Creates a new PbrBaseColorPropsNode with the specified composition and component types.
     */
    constructor();
    /**
     * Gets the output socket that contains the result of the PBR shading operation.
     *
     * @returns The output socket containing the PBR shading result
     */
    getSocketOutput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
