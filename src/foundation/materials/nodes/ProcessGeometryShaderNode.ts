import { ComponentType } from "../../definitions/ComponentType";
import { CompositionType } from "../../definitions/CompositionType";
import { ProcessApproach } from "../../definitions/ProcessApproach";
import { Scalar } from "../../math/Scalar";
import { SystemState } from "../../system/SystemState";
import { AbstractShaderNode } from "../core/AbstractShaderNode";
import { Socket } from "../core/Socket";

export class ProcessGeometryShaderNode extends AbstractShaderNode {
  constructor() {
    super('processGeometry', {
      codeGLSL: '/* shaderity: @{processGeometry} */',
      codeWGSL: '/* shaderity: @{processGeometry} */',
    });

    this.__inputs.push(new Socket('worldMatrix', CompositionType.Mat4, ComponentType.Float));
    this.__inputs.push(new Socket('normalMatrix', CompositionType.Mat3, ComponentType.Float));
    this.__inputs.push(new Socket('viewMatrix', CompositionType.Mat4, ComponentType.Float));
    this.__inputs.push(new Socket('position', CompositionType.Vec4, ComponentType.Float));
    this.__inputs.push(new Socket('normal', CompositionType.Vec3, ComponentType.Float));
    this.__inputs.push(new Socket('joint', CompositionType.Vec4, ComponentType.UnsignedInt));
    this.__inputs.push(new Socket('weight', CompositionType.Vec4, ComponentType.Float));
    this.__inputs.push(new Socket('isBillboard', CompositionType.Scalar, ComponentType.Bool, Scalar.fromCopyNumber(0)));

    this.__outputs.push(new Socket('outNormalMatrix', CompositionType.Mat3, ComponentType.Float));
    this.__outputs.push(new Socket('outPositionInWorld', CompositionType.Vec4, ComponentType.Float));
    this.__outputs.push(new Socket('outNormalInWorld', CompositionType.Vec3, ComponentType.Float));
  }

  getSocketInputWorldMatrix() {
    return this.__inputs[0];
  }

  getSocketInputNormalMatrix() {
    return this.__inputs[1];
  }

  getSocketInputViewMatrix() {
    return this.__inputs[2];
  }

  getSocketInputPosition() {
    return this.__inputs[3];
  }

  getSocketInputNormal() {
    return this.__inputs[4];
  }

  getSocketInputJoint() {
    return this.__inputs[5];
  }

  getSocketInputWeight() {
    return this.__inputs[6];
  }

  getSocketInputIsBillboard() {
    return this.__inputs[7];
  }

  getSocketOutputNormalMatrix() {
    return this.__outputs[0];
  }

  getSocketOutputPositionInWorld() {
    return this.__outputs[1];
  }

  getSocketOutputNormalInWorld() {
    return this.__outputs[2];
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
              `var dummyNormalMatrix_${i}: mat3x3<f32>;`,
              `var dummyPositionInWorld_${i}: vec4<f32>;`,
              `var dummyNormalInWorld_${i}: vec3<f32>;`,
            ]
          : [
              `mat3 dummyNormalMatrix_${i};`,
              `vec4 dummyPositionInWorld_${i};`,
              `vec3 dummyNormalInWorld_${i};`,
            ];

      const dummyOutputArguments = [
        `dummyNormalMatrix_${i}`,
        `dummyPositionInWorld_${i}`,
        `dummyNormalInWorld_${i}`,
      ];

      for (let k = 0; k < varOutputNames[i].length; k++) {
        const outputName = varOutputNames[i][k];
        if (outputName.indexOf('outNormalMatrix') >= 0) {
          dummyOutputVarDefines[0] = '';
          dummyOutputArguments[0] = outputName;
        } else if (outputName.indexOf('outPositionInWorld') >= 0) {
          dummyOutputVarDefines[1] = '';
          dummyOutputArguments[1] = outputName;
        } else if (outputName.indexOf('outNormalInWorld') >= 0) {
          dummyOutputVarDefines[2] = '';
          dummyOutputArguments[2] = outputName;
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
