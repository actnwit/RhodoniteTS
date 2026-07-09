import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that performs PBR volume properties operations.
 * @example
 * ```typescript
 * // Create an PBR volume props node for Vec3 float operations
 * const pbrVolumePropsNode = new PbrVolumePropsShaderNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrVolumePropsNode.getSocketOutput();
 * ```
 */
export declare class PbrVolumePropsShaderNode extends AbstractShaderNode {
    /**
     * Creates a new PbrVolumePropsNode with the specified composition and component types.
     */
    constructor();
    /**
     * Gets the output socket that contains the result of the volume properties operation.
     *
     * @returns The output socket containing the volume properties result
     */
    getSocketOutput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
