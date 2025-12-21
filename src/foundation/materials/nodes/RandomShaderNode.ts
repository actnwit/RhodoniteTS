import RandomShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/Random.glsl';
import RandomShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/Random.wgsl';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { Vector3 } from '../../math/Vector3';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that outputs a random number between 0 and 1.
 * This node outputs a random number between 0 and 1.
 */
export class RandomShaderNode extends AbstractShaderNode {
  /**
   * Creates a new RandomShaderNode instance.
   */
  constructor() {
    super('_random', {
      codeGLSL: RandomShaderityObjectGLSL.code,
      codeWGSL: RandomShaderityObjectWGSL.code,
    });

    this.__inputs.push(new Socket('seed', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0, 0, 0)));
    this.__outputs.push(new Socket('outXYZW', CompositionType.Vec4, ComponentType.Float));
    this.__outputs.push(new Socket('outXYZ1', CompositionType.Vec4, ComponentType.Float));
    this.__outputs.push(new Socket('outXYZ', CompositionType.Vec3, ComponentType.Float));
    this.__outputs.push(new Socket('outXY', CompositionType.Vec2, ComponentType.Float));
    this.__outputs.push(new Socket('outZW', CompositionType.Vec2, ComponentType.Float));
    this.__outputs.push(new Socket('outX', CompositionType.Scalar, ComponentType.Float));
    this.__outputs.push(new Socket('outY', CompositionType.Scalar, ComponentType.Float));
    this.__outputs.push(new Socket('outZ', CompositionType.Scalar, ComponentType.Float));
    this.__outputs.push(new Socket('outW', CompositionType.Scalar, ComponentType.Float));
  }
}
