import SplitVectorShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/SplitVector.glsl';
import SplitVectorShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/SplitVector.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { SystemState } from '../../system/SystemState';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

/**
 * A shader node that splits vector inputs into their individual components or smaller vectors.
 * This node can take vec4, vec3, or vec2 inputs and output various combinations of their components
 * including individual scalars (x, y, z, w) and smaller vectors (xy, zw, xyz).
 *
 * Supports both WebGL/GLSL and WebGPU/WGSL shader compilation.
 *
 * @example
 * ```typescript
 * const splitNode = new SplitVectorShaderNode();
 * // Connect a vec4 input to get x, y, z, w components separately
 * // Or connect vec3 input to get xyz, xy components
 * ```
 */
export class SplitVectorShaderNode extends AbstractShaderNode {
  /**
   * Creates a new SplitVectorShaderNode instance.
   * Sets up input and output connections for vector splitting operations.
   *
   * Inputs:
   * - xyzw: Vec4 input for 4-component vectors
   * - xyz: Vec3 input for 3-component vectors
   * - xy: Vec2 input for 2-component vectors
   *
   * Outputs:
   * - xyz: Vec3 output (first 3 components)
   * - xy: Vec2 output (first 2 components)
   * - zw: Vec2 output (last 2 components of vec4)
   * - x, y, z, w: Individual scalar components
   */
  constructor() {
    super('splitVector', {
      codeGLSL: SplitVectorShaderityObjectGLSL.code,
      codeWGSL: SplitVectorShaderityObjectWGSL.code,
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

  /**
   * Gets the derivative shader function name based on the connected input type.
   * For WebGPU, returns specialized function names (splitVectorXYZW, splitVectorXYZ, splitVectorXY)
   * based on which input is connected. For WebGL, returns the base function name.
   *
   * @returns The appropriate shader function name for the current input connection and process approach
   * @throws {Error} When no valid input connection is found in WebGPU mode
   */
  getShaderFunctionNameDerivative() {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      for (const inputConnection of this.inputConnections) {
        if (inputConnection != null) {
          if (inputConnection.inputNameOfThis === 'xyzw') {
            return `${this.__shaderFunctionName}XYZW`;
          }
          if (inputConnection.inputNameOfThis === 'xyz') {
            return `${this.__shaderFunctionName}XYZ`;
          }
          if (inputConnection.inputNameOfThis === 'xy') {
            return `${this.__shaderFunctionName}XY`;
          }
        }
      }
      throw new Error('Not implemented');
    }
    return this.__shaderFunctionName;
  }

  /**
   * Generates shader code for calling the split vector function with appropriate input and output handling.
   * Creates dummy variables for unused outputs and maps connected outputs to their proper variable names.
   * Handles differences between WebGL/GLSL and WebGPU/WGSL syntax, including reference parameters for WebGPU.
   *
   * @param i - The index of the current shader node call
   * @param shaderNode - The shader node instance (unused in this implementation)
   * @param functionName - The name of the shader function to call
   * @param varInputNames - Array of input variable names for each call
   * @param varOutputNames - Array of output variable names for each call
   * @returns The generated shader code string for the function call
   */
  makeCallStatement(
    i: number,
    _shaderNode: AbstractShaderNode,
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
              `var dummyXYZ_${i}: vec3<f32>;`,
              `var dummyXY_${i}: vec2<f32>;`,
              `var dummyZW_${i}: vec2<f32>;`,
              `var dummyX_${i}: f32;`,
              `var dummyY_${i}: f32;`,
              `var dummyZ_${i}: f32;`,
              `var dummyW_${i}: f32;`,
            ]
          : [
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

      if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
        for (let i = 0; i < dummyOutputArguments.length; i++) {
          dummyOutputArguments[i] = `&${dummyOutputArguments[i]}`;
        }
      }

      // Call node functions
      rowStr += dummyOutputVarDefines.join('\n');
      rowStr += `${functionName}(`;
      const inputName = varInputNames[i][0];
      rowStr += inputName;
      rowStr += `, ${dummyOutputArguments.join(', ')}`;
      rowStr += ');\n';
    }

    str += rowStr;

    return str;
  }
}
