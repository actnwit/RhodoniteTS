import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import MergeVectorShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/MergeVector.glsl';
import MergeVectorShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/MergeVector.wgsl';
import { SystemState } from '../../system/SystemState';
import { ProcessApproach } from '../../definitions/ProcessApproach';

export class MergeVectorShaderNode extends AbstractShaderNode {
  constructor() {
    super('mergeVector', {
      codeGLSL: MergeVectorShaderityObjectGLSL.code,
      codeWGSL: MergeVectorShaderityObjectWGSL.code,
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

  makeCallStatement(
    i: number,
    shaderNode: AbstractShaderNode,
    functionName: string,
    varInputNames: string[][],
    varOutputNames: string[][]
  ): string {
    let str = '';
    let rowStr = '';
    if (varInputNames[i].length > 0 && varOutputNames[i].length > 0) {
      const dummyOutputVarDefines =
        SystemState.currentProcessApproach === ProcessApproach.WebGPU
          ? [
              `var dummyXYZW_${i}: vec4<f32>;`,
              `var dummyXYZ_${i}: vec3<f32>;`,
              `var dummyXY_${i}: vec2<f32>;`,
              `var dummyZW_${i}: vec2<f32>;`,
            ]
          : [
              `vec4 dummyXYZW_${i};`,
              `vec3 dummyXYZ_${i};`,
              `vec2 dummyXY_${i};`,
              `vec2 dummyZW_${i};`,
            ];

      const dummyOutputArguments = [
        `dummyXYZW_${i}`,
        `dummyXYZ_${i}`,
        `dummyXY_${i}`,
        `dummyZW_${i}`,
      ];

      for (let k = 0; k < varOutputNames[i].length; k++) {
        const outputName = varOutputNames[i][k];
        if (outputName.indexOf('xyzw') >= 0) {
          dummyOutputVarDefines[0] = '';
          dummyOutputArguments[0] = outputName;
        } else if (outputName.indexOf('xyz') >= 0) {
          dummyOutputVarDefines[1] = '';
          dummyOutputArguments[1] = outputName;
        } else if (outputName.indexOf('xy') >= 0) {
          dummyOutputVarDefines[2] = '';
          dummyOutputArguments[2] = outputName;
        } else if (outputName.indexOf('zw') >= 0) {
          dummyOutputVarDefines[3] = '';
          dummyOutputArguments[3] = outputName;
        }
      }

      if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
        for (let i = 0; i < dummyOutputArguments.length; i++) {
          dummyOutputArguments[i] = '&' + dummyOutputArguments[i];
        }
      }

      // Call node functions
      rowStr += dummyOutputVarDefines.join('\n');
      rowStr += `${functionName}(`;
      for (let k = 0; k < varInputNames[i].length; k++) {
        if (k !== 0) {
          rowStr += ', ';
        }
        const inputName = varInputNames[i][k];
        rowStr += inputName;
      }
      rowStr += ', ' + dummyOutputArguments.join(', ');
      rowStr += ');\n';
    }

    str += rowStr;

    return str;
  }
}
