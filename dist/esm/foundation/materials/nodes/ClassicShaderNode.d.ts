import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that performs classic shading operations.
 * @example
 * ```typescript
 * // Create an classic node for Vec3 float operations
 * const classicNode = new ClassicShaderNode();
 *
 * // Connect inputs and get output
 * const outputSocket = classicNode.getSocketOutput();
 * ```
 */
export declare class ClassicShaderNode extends AbstractShaderNode {
    /**
     * Creates a new ClassicShaderNode with the specified composition and component types.
     */
    constructor();
    /**
     * Gets the output socket that contains the result of the addition operation.
     *
     * @returns The output socket containing the addition result
     */
    getSocketOutput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Sets the shading model value for this ClassicShader node.
     * This updates the default value of the shadingModel input socket.
     *
     * @param value - The shading model value (1: Lambert, 2: Blinn-Phong, 3: Phong)
     */
    setShadingModel(value: number): void;
}
