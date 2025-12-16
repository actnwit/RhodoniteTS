import AlphaTestShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/AlphaTest.glsl';
import AlphaTestShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/AlphaTest.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { Scalar } from '../../math/Scalar';
import { Vector4 } from '../../math/Vector4';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs alpha testing on a fragment.
 * This node is used in fragment shaders to conditionally discard fragments based on the color value and alpha cutoff value,
 * which is useful for implementing alpha testing, cutout effects, and other
 * techniques that require discarding pixels based on the color value and alpha cutoff value.
 *
 * @example
 * ```typescript
 * const alphaTestNode = new AlphaTestShaderNode();
 * // Connect the color value to the node
 * // When the alpha value is less than the alpha cutoff, the fragment will be discarded
 * colorNode.connect(alphaTestNode.getSocketInputColor());
 * alphaCutoffNode.connect(alphaTestNode.getSocketInputAlphaCutoff());
 * forceCutoffNode.connect(alphaTestNode.getSocketInputForceCutoff());
 * ```
 */
export class AlphaTestShaderNode extends AbstractShaderNode {
  /**
   * Creates a new AlphaTestShaderNode instance.
   * Initializes the node with a AlphaTestShaderityObject instance and sets up the input socket
   * for receiving a vec4 color value and a float alpha cutoff value.
   */
  constructor() {
    super('alphaTest', {
      codeGLSL: AlphaTestShaderityObjectGLSL.code,
      codeWGSL: AlphaTestShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__inputs.push(new Socket('color', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(1, 1, 1, 1)));
    this.__inputs.push(
      new Socket('alphaCutoff', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.01))
    );
    this.__inputs.push(new Socket('forceCutoff', CompositionType.Scalar, ComponentType.Bool));
    this.__outputs.push(new Socket('outColor', CompositionType.Vec4, ComponentType.Float));
  }

  /**
   * Gets the input socket for connecting the alpha value.
   * The socket accepts a float value - when the alpha value is less than the alpha cutoff, the fragment will be discarded.
   *
   * @returns The input socket that accepts a vec4 value
   */
  getSocketInput() {
    return this.__inputs[0];
  }
}
