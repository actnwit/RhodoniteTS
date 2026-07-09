import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that performs PBR metallic roughness properties operations.
 * @example
 * ```typescript
 * // Create an PBR metallic roughness props node for Vec4 float operations
 * const pbrMetallicRoughnessPropsNode = new PbrMetallicRoughnessPropsShaderNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrMetallicRoughnessPropsNode.getSocketOutput();
 * ```
 */
export declare class PbrMetallicRoughnessPropsShaderNode extends AbstractShaderNode {
    /**
     * Creates a new PbrMetallicRoughnessPropsShaderNode with the specified composition and component types.
     */
    constructor();
    /**
     * Gets the output socket that contains the result of the PBR shading operation.
     *
     * @returns The output socket containing the PBR shading result
     */
    getSocketOutput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
