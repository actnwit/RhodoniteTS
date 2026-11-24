import RaymarchTBNShaderityObjectGLSL_ from '../../../../webgl/shaderity_shaders/nodes/raymarching/RaymarchTBN.glsl';
import RaymarchTBNShaderityObjectWGSL_ from '../../../../webgpu/shaderity_shaders/nodes/raymarching/RaymarchTBN.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Matrix33 } from '../../../math/Matrix33';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const RaymarchTBNShaderityObjectGLSL =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? RaymarchTBNShaderityObjectGLSL_ : undefined;
const RaymarchTBNShaderityObjectWGSL =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? RaymarchTBNShaderityObjectWGSL_ : undefined;

/**
 * A shader node that outputs a tangent-bitangent-normal matrix built from the hit
 * normal. It has no UV parameterization; the frame is an orthonormal basis that can
 * be fed into the PBR shader's TBN input (e.g. for anisotropy).
 *
 * Only meaningful in the raymarching shading section.
 */
export class RaymarchTBNShaderNode extends AbstractShaderNode {
  constructor() {
    super('raymarchTBN', {
      codeGLSL: RaymarchTBNShaderityObjectGLSL.code,
      codeWGSL: RaymarchTBNShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__outputs.push(
      new Socket('outValue', CompositionType.Mat3, ComponentType.Float, Matrix33.identity() as Matrix33)
    );
  }

  getSocketOutput() {
    return this.__outputs[0];
  }
}
