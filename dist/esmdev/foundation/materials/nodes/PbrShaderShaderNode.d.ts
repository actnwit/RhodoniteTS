import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that performs PBR shading operations.
 * @example
 * ```typescript
 * // Create an PBR node for Vec3 float operations
 * const pbrNode = new PbrShaderNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrNode.getSocketOutput();
 * ```
 */
export declare class PbrShaderShaderNode extends AbstractShaderNode {
    /**
     * Creates a new PbrShaderNode with the specified composition and component types.
     */
    constructor();
    /**
     * Gets the output socket that contains the result of the PBR shading operation.
     *
     * @returns The output socket containing the PBR shading result
     */
    getSocketOutput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
