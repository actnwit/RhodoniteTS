import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that performs PBR emissive properties operations.
 * @example
 * ```typescript
 * // Create an PBR emissive props node for Vec4 float operations
 * const pbrEmissivePropsNode = new PbrEmissivePropsNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrEmissivePropsNode.getSocketOutput();
 * ```
 */
export declare class PbrEmissivePropsShaderNode extends AbstractShaderNode {
    /**
     * Creates a new PbrEmissivePropsNode with the specified composition and component types.
     */
    constructor();
    /**
     * Gets the output socket that contains the result of the PBR shading operation.
     *
     * @returns The output socket containing the PBR shading result
     */
    getSocketOutput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
