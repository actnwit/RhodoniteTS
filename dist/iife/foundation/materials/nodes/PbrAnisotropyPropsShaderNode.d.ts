import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that performs PBR anisotropy properties operations.
 * @example
 * ```typescript
 * // Create an PBR anisotropy props node for Vec3 float operations
 * const pbrAnisotropyPropsShaderNode = new PbrAnisotropyPropsShaderNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrAnisotropyPropsShaderNode.getSocketOutput();
 * ```
 */
export declare class PbrAnisotropyPropsShaderNode extends AbstractShaderNode {
    /**
     * Creates a new PbrAnisotropyPropsShaderNode with the specified composition and component types.
     */
    constructor();
    /**
     * Gets the output socket that contains the result of the anisotropy properties operation.
     *
     * @returns The output socket containing the anisotropy properties result
     */
    getSocketOutput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
