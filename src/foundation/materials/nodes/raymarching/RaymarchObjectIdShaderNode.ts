import RaymarchObjectIdShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/RaymarchObjectId.glsl';
import RaymarchObjectIdShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/RaymarchObjectId.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that outputs the object id of the raymarching component whose SDF
 * is closest at the hit point.
 *
 * The value is the component's stable (component SID based) object id and is only
 * meaningful in the raymarching shading section (the nodes reachable from an
 * OutShadingColor node). It is recorded by the OutUnion node of each component,
 * which the engine feeds with the per-component id.
 */
export class RaymarchObjectIdShaderNode extends AbstractShaderNode {
  constructor() {
    super('raymarchObjectId', {
      codeGLSL: RaymarchObjectIdShaderityObjectGLSL.code,
      codeWGSL: RaymarchObjectIdShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__outputs.push(new Socket('outValue', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0)));
  }

  /**
   * Gets the output socket that contains the hit object id.
   */
  getSocketOutput() {
    return this.__outputs[0];
  }
}
