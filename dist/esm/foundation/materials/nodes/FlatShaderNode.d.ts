import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that performs flat shading operations.
 * @example
 * ```typescript
 * // Create an flat node for Vec3 float operations
 * const flatNode = new FlatShaderNode();
 *
 * // Connect inputs and get output
 * const outputSocket = flatNode.getSocketOutput();
 * ```
 */
export declare class FlatShaderNode extends AbstractShaderNode {
    /**
     * Creates a new AddShaderNode with the specified composition and component types.
     */
    constructor();
    /**
     * Gets the output socket that contains the result of the addition operation.
     *
     * @returns The output socket containing the addition result
     */
    getSocketOutput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
