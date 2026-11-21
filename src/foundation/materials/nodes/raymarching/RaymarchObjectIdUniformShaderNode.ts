import { RaymarchObjectIdUniformShader } from '../../../../webgl/shaders/nodes/RaymarchObjectIdUniform';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * Internal node injected for each raymarching component: outputs the component's
 * object id uniform. OutUnion records this value when the component's SDF wins.
 *
 * The public RaymarchObjectId node (shading section) reads the recorded hit id.
 */
export class RaymarchObjectIdUniformShaderNode extends AbstractShaderNode {
  constructor() {
    super('raymarchObjectIdUniform', {});

    this.__shaderFunctionName += `_${this.__shaderNodeUid}`;

    this.__commonPart = new RaymarchObjectIdUniformShader(this.__shaderFunctionName);

    this.setShaderStage('Fragment');

    this.__outputs.push(new Socket('outValue', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0)));
  }

  /**
   * Sets the shader semantic name of the per-component object id uniform.
   */
  setUniformDataName(value: any) {
    (this.__commonPart as RaymarchObjectIdUniformShader).setVariableName(value);
  }
}
