import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';
/**
 * A shader node that represents the final output color in a shader graph.
 * This node serves as the terminal node for fragment shaders, accepting a Vec4 color value
 * and outputting it as the final rendered color.
 *
 * The generated function converts the distance of the component's local space into a
 * conservative world-space distance using the component's world matrix (see
 * {@link OutDistanceShader}). The matrix uniform names are supplied by the merged graph
 * (`MaterialHelper.collectRrnJson`), one per component that uses `SdApplyWorldMatrix`.
 *
 * @example
 * ```typescript
 * const outColorNode = new OutColorShaderNode();
 * // Connect a color input to the node
 * someColorNode.connect(outColorNode.getSocketInput());
 * ```
 */
export declare class OutDistanceShaderNode extends AbstractShaderNode {
    private __distanceCorrectionUniformNames;
    private __distanceScaleGlobalNames;
    /**
     * Creates a new OutColorShaderNode instance.
     * Initializes the node with an EndShader instance and sets up the input socket
     * for receiving Vec4 color values.
     */
    constructor();
    /**
     * Sets the per-component world matrix uniforms used to convert the local-space
     * distance to a conservative world-space distance.
     * @param uniformNames - Uniform names of the component's world matrices
     */
    setDistanceCorrectionUniformNames(uniformNames: readonly string[]): void;
    /**
     * Sets the per-`SdApplyTransform` scale globals of the transform nodes in this
     * terminal's subtree, so their local-space distances become world-space steps.
     * @param globalNames - Global names written by the reachable transform nodes
     */
    setDistanceScaleGlobalNames(globalNames: readonly string[]): void;
    private __rebuildCommonPart;
    /**
     * Gets the input socket for connecting color values to this output node.
     * The socket accepts Vec4 values representing RGBA color components.
     *
     * @returns The input socket that accepts Vec4 color values
     */
    getSocketInput(): Socket<string, import("../../..").CompositionTypeEnum, import("../../..").ComponentTypeEnum, import("../../core/Socket").SocketDefaultValue>;
}
