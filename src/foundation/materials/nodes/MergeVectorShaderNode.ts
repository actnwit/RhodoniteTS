import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { AbstractShaderNode } from '../core';
import MergeVectorShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/MergeVector.glsl';
import { SystemState } from '../../system/SystemState';
import { ProcessApproach } from '../../definitions/ProcessApproach';

export class MergeVectorShaderNode extends AbstractShaderNode {
  constructor() {
    super('mergeVector', {
      codeGLSL: MergeVectorShaderityObjectGLSL.code,
    });

    this.__inputs.push({
      compositionType: CompositionType.Vec3,
      componentType: ComponentType.Float,
      name: 'xyz',
    });
    this.__inputs.push({
      compositionType: CompositionType.Vec2,
      componentType: ComponentType.Float,
      name: 'xy',
    });
    this.__inputs.push({
      compositionType: CompositionType.Vec2,
      componentType: ComponentType.Float,
      name: 'zw',
    });
    this.__inputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Float,
      name: 'x',
    });
    this.__inputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Float,
      name: 'y',
    });
    this.__inputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Float,
      name: 'z',
    });
    this.__inputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Float,
      name: 'w',
    });

    this.__outputs.push({
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'xyzw',
    });
    this.__outputs.push({
      compositionType: CompositionType.Vec3,
      componentType: ComponentType.Float,
      name: 'xyz',
    });
    this.__outputs.push({
      compositionType: CompositionType.Vec2,
      componentType: ComponentType.Float,
      name: 'xy',
    });
    this.__outputs.push({
      compositionType: CompositionType.Vec2,
      componentType: ComponentType.Float,
      name: 'zw',
    });
  }

  getShaderFunctionNameDerivative() {
    if (this.inputConnections[0] != null && this.inputConnections[6] != null) {
      return this.__shaderFunctionName + 'XYZ_W';
    } else if (this.inputConnections[1] != null && this.inputConnections[2] != null) {
      return this.__shaderFunctionName + 'XY_ZW';
    } else if (
      this.inputConnections[1] != null &&
      this.inputConnections[5] != null &&
      this.inputConnections[6] != null
    ) {
      return this.__shaderFunctionName + 'XY_Z_W';
    } else if (
      this.inputConnections[2] != null &&
      this.inputConnections[3] != null &&
      this.inputConnections[4] != null
    ) {
      return this.__shaderFunctionName + 'ZW_X_Y';
    } else if (
      this.inputConnections[3] != null &&
      this.inputConnections[4] != null &&
      this.inputConnections[5] != null &&
      this.inputConnections[6] != null
    ) {
      return this.__shaderFunctionName + 'X_Y_Z_W';
    }
    throw new Error('Not implemented');
  }
}
