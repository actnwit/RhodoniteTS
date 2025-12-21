import SplitVectorShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/SplitVector.glsl';
import SplitVectorShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/SplitVector.wgsl';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

/**
 * A shader node that splits vector inputs into their individual components or smaller vectors.
 * This node can take vec4, vec3, or vec2 inputs and output various combinations of their components
 * including individual scalars (x, y, z, w) and smaller vectors (xy, zw, xyz).
 *
 * Supports both WebGL/GLSL and WebGPU/WGSL shader compilation.
 * Supports float, int, and uint component types.
 *
 * @example
 * ```typescript
 * const splitNode = new SplitVectorShaderNode(ComponentType.Float);
 * // Connect a vec4 input to get x, y, z, w components separately
 * // Or connect vec3 input to get xyz, xy components
 * ```
 */
export class SplitVectorShaderNode extends AbstractShaderNode {
  private __componentType: ComponentTypeEnum;

  /**
   * Creates a new SplitVectorShaderNode instance.
   * Sets up input and output connections for vector splitting operations.
   *
   * @param componentType - The component type (Float, Int, or UnsignedInt). Defaults to Float.
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
  constructor(componentType: ComponentTypeEnum = ComponentType.Float) {
    super('splitVector', {
      codeGLSL: SplitVectorShaderityObjectGLSL.code,
      codeWGSL: SplitVectorShaderityObjectWGSL.code,
    });

    this.__componentType = componentType;

    this.__inputs.push({
      compositionType: CompositionType.Vec4,
      componentType: componentType,
      name: 'xyzw',
    });
    this.__inputs.push({
      compositionType: CompositionType.Vec3,
      componentType: componentType,
      name: 'xyz',
    });
    this.__inputs.push({
      compositionType: CompositionType.Vec2,
      componentType: componentType,
      name: 'xy',
    });

    this.__outputs.push({
      compositionType: CompositionType.Vec3,
      componentType: componentType,
      name: 'xyz',
    });
    this.__outputs.push({
      compositionType: CompositionType.Vec2,
      componentType: componentType,
      name: 'xy',
    });
    this.__outputs.push({
      compositionType: CompositionType.Vec2,
      componentType: componentType,
      name: 'zw',
    });
    this.__outputs.push({
      compositionType: CompositionType.Scalar,
      componentType: componentType,
      name: 'x',
    });
    this.__outputs.push({
      compositionType: CompositionType.Scalar,
      componentType: componentType,
      name: 'y',
    });
    this.__outputs.push({
      compositionType: CompositionType.Scalar,
      componentType: componentType,
      name: 'z',
    });
    this.__outputs.push({
      compositionType: CompositionType.Scalar,
      componentType: componentType,
      name: 'w',
    });
  }

  /**
   * Gets the derivative shader function name based on the connected input type and component type.
   * For WebGPU, returns specialized function names (splitVectorXYZW, splitVectorXYZ, splitVectorXY)
   * based on which input is connected, with type suffix (I32, U32) for non-float types.
   * For WebGL, returns the base function name.
   *
   * @returns The appropriate shader function name for the current input connection and process approach
   * @throws {Error} When no valid input connection is found in WebGPU mode
   */
  getShaderFunctionNameDerivative(engine: Engine) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      let typeSuffix = '';
      if (this.__componentType === ComponentType.Int) {
        typeSuffix = 'I32';
      } else if (this.__componentType === ComponentType.UnsignedInt) {
        typeSuffix = 'U32';
      }

      for (const inputConnection of this.inputConnections) {
        if (inputConnection != null) {
          if (inputConnection.inputNameOfThis === 'xyzw') {
            return `${this.__shaderFunctionName}XYZW${typeSuffix}`;
          }
          if (inputConnection.inputNameOfThis === 'xyz') {
            return `${this.__shaderFunctionName}XYZ${typeSuffix}`;
          }
          if (inputConnection.inputNameOfThis === 'xy') {
            return `${this.__shaderFunctionName}XY${typeSuffix}`;
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
  /**
   * Generates shader code for calling the split vector function.
   * ShaderGraphResolver already orders varOutputNames to match output socket order and generates
   * dummy variables for unconnected outputs, so we simply use them directly.
   * This node only needs custom handling for selecting the correct input (xyzw, xyz, or xy).
   *
   * @param engine - The engine instance
   * @param i - The index of the current shader node call
   * @param _shaderNode - The shader node instance (unused in this implementation)
   * @param functionName - The name of the shader function to call
   * @param varInputNames - Array of input variable names for each call
   * @param varOutputNames - Array of output variable names for each call (already ordered by ShaderGraphResolver)
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
    if (varInputNames[i].length > 0 && varOutputNames[i].length > 0) {
      // Determine which input index to use based on actual connections
      // Input indices: 0: xyzw, 1: xyz, 2: xy
      let inputIndex = 0; // default to xyzw
      for (let j = 0; j < this.inputConnections.length; j++) {
        if (this.inputConnections[j] != null) {
          inputIndex = j;
          break;
        }
      }

      // Use varOutputNames directly - ShaderGraphResolver already orders them correctly
      // and generates dummy variables for unconnected outputs
      const outputArguments = [...varOutputNames[i]];
      if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
        for (let j = 0; j < outputArguments.length; j++) {
          outputArguments[j] = `&${outputArguments[j]}`;
        }
      }

      // Call node functions
      str += `${functionName}(`;
      const inputName = varInputNames[i][inputIndex];
      str += inputName;
      str += `, ${outputArguments.join(', ')}`;
      str += ');\n';
    }

    return str;
  }
}
