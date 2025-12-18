import { Texture2DShader } from '../../../webgl/shaders/nodes/Texture2DShader';
import type { UniformDataShader } from '../../../webgl/shaders/nodes/UniformDataShader';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { Scalar } from '../../math/Scalar';
import { Vector2 } from '../../math/Vector2';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that provides texture input functionality.
 * This node wraps TextureShader to provide a standardized interface
 * for passing textures to shader programs.
 */
export class Texture2DShaderNode extends AbstractShaderNode {
  constructor() {
    super('texture2D', {});

    this.__shaderFunctionName += `_${this.__shaderNodeUid}`;

    this.__commonPart = new Texture2DShader(this.__shaderFunctionName);

    this.__inputs.push(new Socket('uv', CompositionType.Vec2, ComponentType.Float));
    this.__inputs.push(new Socket('scale', CompositionType.Vec2, ComponentType.Float, Vector2.fromCopy2(1, 1)));
    this.__inputs.push(new Socket('offset', CompositionType.Vec2, ComponentType.Float, Vector2.fromCopy2(0, 0)));
    this.__inputs.push(new Socket('rotation', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0)));
    this.__inputs.push(new Socket('lod', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(-1)));

    this.__outputs.push(new Socket('rgba', CompositionType.Vec4, ComponentType.Float));
    this.__outputs.push(new Socket('rgb', CompositionType.Vec3, ComponentType.Float));
    this.__outputs.push(new Socket('r', CompositionType.Scalar, ComponentType.Float));
    this.__outputs.push(new Socket('g', CompositionType.Scalar, ComponentType.Float));
    this.__outputs.push(new Socket('b', CompositionType.Scalar, ComponentType.Float));
    this.__outputs.push(new Socket('a', CompositionType.Scalar, ComponentType.Float));
    this.__outputs.push(new Socket('uvOut', CompositionType.Vec2, ComponentType.Float));
  }

  /**
   * Sets sRGB flag for the texture
   *
   * @param sRGB - The sRGB flag
   */
  setSrgbFlag(sRGB: boolean) {
    (this.__commonPart as Texture2DShader).setSrgbFlag(sRGB);
  }

  /**
   * Sets the texture variable name in the shader.
   * This name will be used to reference the texture variable in the generated shader code.
   *
   * @param value - The variable name to use for the texture in the shader
   */
  setTextureName(value: any) {
    (this.__commonPart as Texture2DShader).setVariableName(value);
  }
}
