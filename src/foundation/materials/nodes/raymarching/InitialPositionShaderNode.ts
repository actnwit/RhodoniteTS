import InitialPositionShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/InitialPosition.glsl';
import { OutDistanceShader } from '../../../../webgl/shaders/nodes/OutDistance';
import InitialPositionShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/InitialPosition.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { Vector3 } from '../../../math/Vector3';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that represents the initial position in a shader graph.
 * This node serves as the initial position node for fragment shaders, outputting a Vec3 position value.
 *
 * @example
 * ```typescript
 * const initialPositionNode = new InitialPositionShaderNode();
 * // Connect a position input to the node
 * somePositionNode.connect(initialPositionNode.getSocketInput());
 * ```
 */
export class InitialPositionShaderNode extends AbstractShaderNode {
  /**
   * Creates a new InitialPositionShaderNode instance.
   * Initializes the node with an InitialPositionShader instance and sets up the output socket
   * for receiving Vec3 position values.
   */
  constructor() {
    super('initialPosition', {
      codeGLSL: InitialPositionShaderityObjectGLSL.code,
      codeWGSL: InitialPositionShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__outputs.push(
      new Socket('outPosition', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0.0, 0.0, 0.0))
    );
  }
}
