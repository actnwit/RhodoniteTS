import { SdApplyWorldMatrixShader } from '../../../../webgl/shaders/nodes/SdApplyWorldMatrix';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Vector3 } from '../../../math/Vector3';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that applies a world matrix to a signed distance function.
 * This node accepts a position and a world matrix and outputs the signed distance to the transformed position.
 *
 * @example
 * ```typescript
 * // Create a world matrix node
 * const worldMatrixNode = new WorldMatrixShaderNode();
 * const sdApplyWorldMatrixNode = new SdApplyWorldMatrixShaderNode();
 * sdApplyWorldMatrixNode.setInput('position', transformNode.getOutput('outValue'));
 * sdApplyWorldMatrixNode.setInput('worldMatrix', worldMatrixNode.getOutput('outValue'));
 * sdApplyWorldMatrixNode.setOutput('outDistance', worldMatrixNode.getOutput('outValue'));
 * ```
 */
export class SdApplyWorldMatrixShaderNode extends AbstractShaderNode {
  /**
   * Creates a new SdApplyWorldMatrixShaderNode instance.
   */
  constructor() {
    super('sdApplyWorldMatrix', {});

    this.__shaderFunctionName += `_${this.__shaderNodeUid}`;

    this.__commonPart = new SdApplyWorldMatrixShader(this.__shaderFunctionName);

    this.setShaderStage('Fragment');

    this.__inputs.push(
      new Socket('position', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0.0, 0.0, 0.0))
    );
    this.__outputs.push(
      new Socket('outTransformedPosition', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0.0, 0.0, 0.0))
    );
  }

  setUniformDataName(value: any) {
    (this.__commonPart as SdApplyWorldMatrixShader).setVariableName(value);
  }
}
