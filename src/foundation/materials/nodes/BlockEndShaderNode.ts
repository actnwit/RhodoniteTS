import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { BlockEndShader } from '../../../webgl/shaders/nodes/BlockEndShader';

/**
 * Represents a block end shader node that manages shader block termination.
 * This node extends AbstractShaderNode and provides functionality to handle
 * the end of shader code blocks with configurable inputs and outputs.
 */
export class BlockEndShaderNode extends AbstractShaderNode {
  /**
   * Constructs a new BlockEndShaderNode instance.
   * Initializes the node with 'blockEnd' identifier and sets up the shader function
   * with a unique name based on the shader node UID.
   */
  constructor() {
    super('blockEnd', {});

    this.__shaderFunctionName += '_' + this.__shaderNodeUid;

    this.__commonPart = new BlockEndShader(
      this.__shaderFunctionName,
      this.__inputs,
      this.__outputs
    );
  }

  /**
   * Adds a new input-output pair to the shader node with matching composition and component types.
   * This method creates corresponding input and output definitions that can be used
   * for data flow through the shader node.
   *
   * @param compositionType - The composition type enum value that defines the data structure
   * @param componentType - The component type enum value that defines the data component format
   */
  addInputAndOutput(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    const input = {
      compositionType: compositionType,
      componentType: componentType,
      name: `value_${this.__inputs.length}`,
    };
    const output = {
      compositionType: compositionType,
      componentType: componentType,
      name: `outValue_${this.__outputs.length}`,
    };
    this.__inputs.push(input);
    this.__outputs.push(output);
  }
}
