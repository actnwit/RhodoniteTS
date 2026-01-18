import PbrVolumePropsShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/PbrVolumeProps.glsl';
import PbrVolumePropsShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/PbrVolumeProps.wgsl';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { Scalar } from '../../math/Scalar';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs PBR volume properties operations.
 * @example
 * ```typescript
 * // Create an PBR volume props node for Vec3 float operations
 * const pbrVolumePropsNode = new PbrVolumePropsShaderNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrVolumePropsNode.getSocketOutput();
 * ```
 */
export class PbrVolumePropsShaderNode extends AbstractShaderNode {
  /**
   * Creates a new PbrVolumePropsNode with the specified composition and component types.
   */
  constructor() {
    super('pbrVolumeProps', {
      codeGLSL: PbrVolumePropsShaderityObjectGLSL.code,
      codeWGSL: PbrVolumePropsShaderityObjectWGSL.code,
    });

    this.__inputs.push(
      new Socket('thicknessFactor', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0))
    );
    this.__inputs.push(
      new Socket('thicknessTexture', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(1, 1, 1, 1))
    );
    this.__inputs.push(
      new Socket('attenuationDistance', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(1e20))
    );
    this.__inputs.push(
      new Socket('attenuationColor', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(1, 1, 1))
    );
    this.__outputs.push(new Socket('outVolumeProps', CompositionType.VolumeProps, ComponentType.Unknown));
  }

  /**
   * Gets the output socket that contains the result of the volume properties operation.
   *
   * @returns The output socket containing the volume properties result
   */
  getSocketOutput() {
    return this.__outputs[0];
  }
}
