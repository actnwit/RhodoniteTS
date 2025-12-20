import PbrShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/PbrShader.glsl';
import PbrShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/PbrShader.wgsl';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { Scalar } from '../../math/Scalar';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs PBR shading operations.
 * @example
 * ```typescript
 * // Create an PBR node for Vec3 float operations
 * const pbrNode = new PbrShaderNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrNode.getSocketOutput();
 * ```
 */
export class PbrShaderShaderNode extends AbstractShaderNode {
  /**
   * Creates a new PbrShaderNode with the specified composition and component types.
   */
  constructor() {
    super('pbrShader', {
      codeGLSL: PbrShaderityObjectGLSL.code,
      codeWGSL: PbrShaderityObjectWGSL.code,
    });

    this.__inputs.push(
      new Socket('positionInWorld', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(0, 0, 0, 1))
    );
    this.__inputs.push(
      new Socket('normalInWorld', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0, 0, 1))
    );
    this.__inputs.push(
      new Socket('geomNormalInWorld', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0, 0, 1))
    );
    this.__inputs.push(
      new Socket('baseColor', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(1, 1, 1, 1))
    );
    this.__inputs.push(new Socket('metallic', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0)));
    this.__inputs.push(
      new Socket('roughness', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.5))
    );
    this.__inputs.push(
      new Socket('occlusionProps', CompositionType.OcclusionProps, ComponentType.Unknown, {
        // Note: Property order must match GLSL/WGSL struct field order
        occlusionTexture: Vector4.fromCopy4(1.0, 1.0, 1.0, 1.0),
        occlusionStrength: Scalar.fromCopyNumber(1.0),
      })
    );
    this.__inputs.push(
      new Socket('emissiveProps', CompositionType.EmissiveProps, ComponentType.Unknown, {
        // Note: Property order must match GLSL/WGSL struct field order
        emissive: Vector3.fromCopy3(0.0, 0.0, 0.0),
        emissiveStrength: Scalar.fromCopyNumber(1.0),
      })
    );
    this.__inputs.push(new Socket('ior', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(1.5)));
    this.__inputs.push(
      new Socket('transmission', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0))
    );
    this.__inputs.push(
      new Socket('specularProps', CompositionType.SpecularProps, ComponentType.Unknown, {
        // Note: Property order must match GLSL/WGSL struct field order
        specularWeight: Scalar.fromCopyNumber(1.0),
        specularColor: Vector3.fromCopy3(1.0, 1.0, 1.0),
      })
    );
    this.__inputs.push(
      new Socket('volumeProps', CompositionType.VolumeProps, ComponentType.Unknown, {
        // Note: Property order must match GLSL/WGSL struct field order
        attenuationColor: Vector3.fromCopy3(1.0, 1.0, 1.0),
        attenuationDistance: Scalar.fromCopyNumber(1e20),
        thickness: Scalar.fromCopyNumber(0.0),
      })
    );
    this.__inputs.push(
      new Socket('clearcoatProps', CompositionType.ClearcoatProps, ComponentType.Unknown, {
        // Note: Property order must match GLSL/WGSL struct field order
        clearcoat: Scalar.fromCopyNumber(0.0),
        clearcoatRoughness: Scalar.fromCopyNumber(0.0),
        clearcoatF0: Vector3.fromCopy3(0.0, 0.0, 0.0),
        clearcoatF90: Vector3.fromCopy3(0.0, 0.0, 0.0),
        clearcoatFresnel: Vector3.fromCopy3(0.0, 0.0, 0.0),
        clearcoatNormal_inWorld: Vector3.fromCopy3(0.0, 0.0, 0.0),
        VdotNc: Scalar.fromCopyNumber(0.0),
      })
    );
    this.__inputs.push(
      new Socket('anisotropyProps', CompositionType.AnisotropyProps, ComponentType.Unknown, {
        // Note: Property order must match GLSL/WGSL struct field order
        anisotropy: Scalar.fromCopyNumber(0.0),
        anisotropicT: Vector3.fromCopy3(0.0, 0.0, 0.0),
        anisotropicB: Vector3.fromCopy3(0.0, 0.0, 0.0),
        BdotV: Scalar.fromCopyNumber(0.0),
        TdotV: Scalar.fromCopyNumber(0.0),
      })
    );
    this.__inputs.push(
      new Socket('sheenProps', CompositionType.SheenProps, ComponentType.Unknown, {
        // Note: Property order must match GLSL/WGSL struct field order
        sheenColor: Vector3.fromCopy3(0.0, 0.0, 0.0),
        sheenRoughness: Scalar.fromCopyNumber(0.000001),
        albedoSheenScalingNdotV: Scalar.fromCopyNumber(1.0),
      })
    );
    this.__inputs.push(
      new Socket('iridescenceProps', CompositionType.IridescenceProps, ComponentType.Unknown, {
        // Note: Property order must match GLSL/WGSL struct field order
        iridescence: Scalar.fromCopyNumber(0.0),
        iridescenceIor: Scalar.fromCopyNumber(1.3),
        iridescenceThickness: Scalar.fromCopyNumber(0.0),
        fresnelDielectric: Vector3.fromCopy3(0.0, 0.0, 0.0),
        fresnelMetal: Vector3.fromCopy3(0.0, 0.0, 0.0),
      })
    );
    this.__inputs.push(
      new Socket('diffuseTransmissionProps', CompositionType.DiffuseTransmissionProps, ComponentType.Unknown, {
        // Note: Property order must match GLSL/WGSL struct field order
        diffuseTransmission: Scalar.fromCopyNumber(0.0),
        diffuseTransmissionColor: Vector3.fromCopy3(0.0, 0.0, 0.0),
        diffuseTransmissionThickness: Scalar.fromCopyNumber(0.0),
      })
    );
    this.__inputs.push(
      new Socket('dispersion', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0))
    );
    this.__outputs.push(new Socket('outColor', CompositionType.Vec4, ComponentType.Float));
  }

  /**
   * Gets the output socket that contains the result of the PBR shading operation.
   *
   * @returns The output socket containing the PBR shading result
   */
  getSocketOutput() {
    return this.__outputs[0];
  }
}
