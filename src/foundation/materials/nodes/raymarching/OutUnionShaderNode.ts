import OutUnionShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/OutUnion.glsl';
import OutUnionShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/OutUnion.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that represents the union of two distances in a shader graph.
 * This node serves as the terminal node for fragment shaders, accepting two distance values
 * and outputting the minimum of the two.
 *
 * @example
 * ```typescript
 * const outUnionNode = new OutUnionShaderNode();
 * // Connect two distance inputs to the node
 * someColorNode.connect(outUnionNode.getSocketInput());
 * ```
 */
export class OutUnionShaderNode extends AbstractShaderNode {
  /**
   * Creates a new OutUnionShaderNode instance.
   * Initializes the node with an EndShader instance and sets up the input socket
   * for receiving Vec4 color values.
   */
  constructor() {
    super('outUnion', {
      codeGLSL: OutUnionShaderityObjectGLSL.code,
      codeWGSL: OutUnionShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__inputs.push(new Socket('value', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0)));
  }

  /**
   * Gets the input socket for connecting color values to this output node.
   * The socket accepts Vec4 values representing RGBA color components.
   *
   * @returns The input socket that accepts Vec4 color values
   */
  getSocketInput() {
    return this.__inputs[0];
  }
}
