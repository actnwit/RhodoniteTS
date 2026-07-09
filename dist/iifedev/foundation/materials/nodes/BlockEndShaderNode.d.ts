import type { ComponentTypeEnum } from '../../definitions/ComponentType';
import type { CompositionTypeEnum } from '../../definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
/**
 * Represents a block end shader node that manages shader block termination.
 * This node extends AbstractShaderNode and provides functionality to handle
 * the end of shader code blocks with configurable inputs and outputs.
 */
export declare class BlockEndShaderNode extends AbstractShaderNode {
    /**
     * Constructs a new BlockEndShaderNode instance.
     * Initializes the node with 'blockEnd' identifier and sets up the shader function
     * with a unique name based on the shader node UID.
     */
    constructor();
    /**
     * Adds a new input-output pair to the shader node with matching composition and component types.
     * This method creates corresponding input and output definitions that can be used
     * for data flow through the shader node.
     *
     * @param compositionType - The composition type enum value that defines the data structure
     * @param componentType - The component type enum value that defines the data component format
     */
    addInputAndOutput(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum): void;
}
