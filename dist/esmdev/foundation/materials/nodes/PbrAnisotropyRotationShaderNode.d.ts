import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that performs PBR anisotropy rotation operations.
 * @example
 * ```typescript
 * // Create an PBR anisotropy rotation node for Vec2 float operations
 * const pbrAnisotropyRotationShaderNode = new PbrAnisotropyRotationShaderNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrAnisotropyRotationShaderNode.getSocketOutput();
 * ```
 */
export declare class PbrAnisotropyRotationShaderNode extends AbstractShaderNode {
    /**
     * Creates a new PbrAnisotropyRotationShaderNode with the specified composition and component types.
     */
    constructor();
    /**
     * Gets the output socket that contains the result of the anisotropy rotation operation.
     *
     * @returns The output socket containing the anisotropy rotation result
     */
    getSocketOutput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
