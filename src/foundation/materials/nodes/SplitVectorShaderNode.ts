import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import SplitVectorShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/SplitVector.glsl';
import SplitVectorShaderityObjectGLSL2 from '../../../webgl/shaderity_shaders/nodes/SplitVector2.glsl';
import { SystemState } from '../../system/SystemState';
import { ProcessApproach } from '../../definitions/ProcessApproach';

export class SplitVectorShaderNode extends AbstractShaderNode {
  constructor() {
    super('splitVector', {
      codeGLSL: SplitVectorShaderityObjectGLSL2.code,
    });

    this.__inputs.push({
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'xyzw',
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
    this.__outputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Float,
      name: 'x',
    });
    this.__outputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Float,
      name: 'y',
    });
    this.__outputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Float,
      name: 'z',
    });
    this.__outputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Float,
      name: 'w',
    });
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
      const dummyOutputVarDefines = [
        `vec3 dummyXYZ_${i};`,
        `vec2 dummyXY_${i};`,
        `vec2 dummyZW_${i};`,
        `float dummyX_${i};`,
        `float dummyY_${i};`,
        `float dummyZ_${i};`,
        `float dummyW_${i};`,
      ];

      const dummyOutputArguments = [
        `dummyXYZ_${i}`,
        `dummyXY_${i}`,
        `dummyZW_${i}`,
        `dummyX_${i}`,
        `dummyY_${i}`,
        `dummyZ_${i}`,
        `dummyW_${i}`,
      ];

      for (let k = 0; k < varOutputNames[i].length; k++) {
        const outputName = varOutputNames[i][k];
        if (outputName.indexOf('xyz') >= 0) {
          dummyOutputVarDefines[0] = '';
          dummyOutputArguments[0] = outputName;
        } else if (outputName.indexOf('xy') >= 0) {
          dummyOutputVarDefines[1] = '';
          dummyOutputArguments[1] = outputName;
        } else if (outputName.indexOf('zw') >= 0) {
          dummyOutputVarDefines[2] = '';
          dummyOutputArguments[2] = outputName;
        } else if (outputName.indexOf('x') >= 0) {
          dummyOutputVarDefines[3] = '';
          dummyOutputArguments[3] = outputName;
        } else if (outputName.indexOf('y') >= 0) {
          dummyOutputVarDefines[4] = '';
          dummyOutputArguments[4] = outputName;
        } else if (outputName.indexOf('z') >= 0) {
          dummyOutputVarDefines[5] = '';
          dummyOutputArguments[5] = outputName;
        } else if (outputName.indexOf('w') >= 0) {
          dummyOutputVarDefines[6] = '';
          dummyOutputArguments[6] = outputName;
        }
      }

      // Call node functions
      rowStr += dummyOutputVarDefines.join('\n');
      rowStr += `${functionName}(`;
      const inputName = varInputNames[i][0];
      rowStr += inputName;
      rowStr += ', ' + dummyOutputArguments.join(', ');
      rowStr += ');\n';
    }

    str += rowStr;

    return str;
  }

  // getShaderFunctionNameDerivative() {
  //   if (this.inputConnections[0].inputNameOfThis === 'inXYZW') {
  //     // if ()
  //     return 'splitVector';
  //   }
  // }
}
