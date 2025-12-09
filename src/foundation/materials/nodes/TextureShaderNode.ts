import { TextureShader } from '../../../webgl/shaders/nodes/TextureShader';
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
export class TextureShaderNode extends AbstractShaderNode {
  constructor(compositionType: CompositionTypeEnum) {
    super('texture', {});

    this.__shaderFunctionName += `_${this.__shaderNodeUid}`;

    this.__commonPart = new TextureShader(this.__shaderFunctionName, compositionType);

    // Add UV input socket based on texture type
    if (compositionType === CompositionType.Texture2D || compositionType === CompositionType.Texture2DArray) {
      this.__inputs.push(new Socket('uv', CompositionType.Vec2, ComponentType.Float));
    } else if (compositionType === CompositionType.TextureCube) {
      this.__inputs.push(new Socket('uv', CompositionType.Vec3, ComponentType.Float));
    }

    this.__inputs.push(new Socket('scale', CompositionType.Vec2, ComponentType.Float, Vector2.fromCopy2(1, 1)));
    this.__inputs.push(new Socket('offset', CompositionType.Vec2, ComponentType.Float, Vector2.fromCopy2(0, 0)));
    this.__inputs.push(new Socket('rotation', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0)));
    this.__inputs.push(new Socket('lod', CompositionType.Scalar, ComponentType.Int, Scalar.fromCopyNumber(-1)));

    this.__outputs.push(new Socket('rgba', CompositionType.Vec4, ComponentType.Float));
    this.__outputs.push(new Socket('rgb', CompositionType.Vec3, ComponentType.Float));
    this.__outputs.push(new Socket('r', CompositionType.Scalar, ComponentType.Float));
    this.__outputs.push(new Socket('g', CompositionType.Scalar, ComponentType.Float));
    this.__outputs.push(new Socket('b', CompositionType.Scalar, ComponentType.Float));
    this.__outputs.push(new Socket('a', CompositionType.Scalar, ComponentType.Float));
  }

  /**
   * Sets the default input value for the specified input parameter.
   * Currently only supports setting the default value for the 'value' input.
   *
   * @param inputName - The name of the input parameter to set the default value for
   * @param value - The default value to assign to the input parameter
   */
  setDefaultInputValue(inputName: string, value: any) {
    if (inputName === 'value') {
      (this.__commonPart as UniformDataShader).setDefaultValue(value);
    }
  }

  /**
   * Sets the texture variable name in the shader.
   * This name will be used to reference the texture variable in the generated shader code.
   *
   * @param value - The variable name to use for the texture in the shader
   */
  setTextureName(value: any) {
    (this.__commonPart as UniformDataShader).setVariableName(value);
  }

  /**
   * Generates shader code for calling the texture sampling function with appropriate input and output handling.
   * Creates dummy variables for unused outputs and maps connected outputs to their proper variable names.
   * Handles differences between WebGL/GLSL and WebGPU/WGSL syntax, including reference parameters for WebGPU.
   *
   * @param engine - The engine instance
   * @param i - The index of the current shader node call
   * @param _shaderNode - The shader node instance (unused in this implementation)
   * @param functionName - The name of the shader function to call
   * @param varInputNames - Array of input variable names for each call
   * @param varOutputNames - Array of output variable names for each call
   * @returns The generated shader code string for the function call
   */
  makeCallStatement(
    engine: Engine,
    i: number,
    _shaderNode: AbstractShaderNode,
    functionName: string,
    varInputNames: string[][],
    varOutputNames: string[][]
  ): string {
    let str = '';
    let rowStr = '';
    if (varInputNames[i].length > 0 && varOutputNames[i].length > 0) {
      let dummyOutputVarDefines: string[];

      if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
        dummyOutputVarDefines = [
          `var dummyRGBA_${i}: vec4<f32>;`,
          `var dummyRGB_${i}: vec3<f32>;`,
          `var dummyR_${i}: f32;`,
          `var dummyG_${i}: f32;`,
          `var dummyB_${i}: f32;`,
          `var dummyA_${i}: f32;`,
        ];
      } else {
        dummyOutputVarDefines = [
          `vec4 dummyRGBA_${i};`,
          `vec3 dummyRGB_${i};`,
          `float dummyR_${i};`,
          `float dummyG_${i};`,
          `float dummyB_${i};`,
          `float dummyA_${i};`,
        ];
      }

      const dummyOutputArguments = [
        `dummyRGBA_${i}`,
        `dummyRGB_${i}`,
        `dummyR_${i}`,
        `dummyG_${i}`,
        `dummyB_${i}`,
        `dummyA_${i}`,
      ];

      // Map connected outputs to their variable names
      // Variable name format: {socketName}_{fromNodeId}_to_{toNodeId}
      // Output order: rgba, rgb, r, g, b, a
      for (let k = 0; k < varOutputNames[i].length; k++) {
        const outputName = varOutputNames[i][k];
        // Extract socket name from variable name (first part before '_')
        const socketName = outputName.split('_')[0];
        if (socketName === 'rgba') {
          dummyOutputVarDefines[0] = '';
          dummyOutputArguments[0] = outputName;
        } else if (socketName === 'rgb') {
          dummyOutputVarDefines[1] = '';
          dummyOutputArguments[1] = outputName;
        } else if (socketName === 'r') {
          dummyOutputVarDefines[2] = '';
          dummyOutputArguments[2] = outputName;
        } else if (socketName === 'g') {
          dummyOutputVarDefines[3] = '';
          dummyOutputArguments[3] = outputName;
        } else if (socketName === 'b') {
          dummyOutputVarDefines[4] = '';
          dummyOutputArguments[4] = outputName;
        } else if (socketName === 'a') {
          dummyOutputVarDefines[5] = '';
          dummyOutputArguments[5] = outputName;
        }
      }

      if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
        for (let j = 0; j < dummyOutputArguments.length; j++) {
          dummyOutputArguments[j] = `&${dummyOutputArguments[j]}`;
        }
      }

      // Generate variable definitions for dummy outputs
      rowStr += dummyOutputVarDefines.filter(d => d !== '').join('\n');
      if (rowStr.length > 0) {
        rowStr += '\n';
      }

      // Call the texture function with all inputs and outputs
      // Input order: uv, scale, offset, rotation, lod
      rowStr += `${functionName}(`;
      rowStr += varInputNames[i].join(', ');
      rowStr += `, ${dummyOutputArguments.join(', ')}`;
      rowStr += ');\n';
    }

    str += rowStr;

    return str;
  }
}
