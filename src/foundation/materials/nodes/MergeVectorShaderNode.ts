import MergeVectorShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/MergeVector.glsl';
import MergeVectorShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/MergeVector.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { SystemState } from '../../system/SystemState';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

/**
 * A shader node that merges vector components to create various vector outputs.
 *
 * This node provides the capability to combine individual scalar components (x, y, z, w)
 * or smaller vectors (xy, zw, xyz) into larger vector outputs (Vec2, Vec3, Vec4).
 * It supports multiple input configurations and automatically selects the appropriate
 * shader function based on which inputs are connected.
 *
 * @example
 * ```typescript
 * const mergeNode = new MergeVectorShaderNode();
 * // Connect scalar inputs x, y, z, w to create a Vec4 output
 * // Or connect Vec3 xyz and scalar w to create a Vec4 output
 * ```
 */
export class MergeVectorShaderNode extends AbstractShaderNode {
  /**
   * Creates a new MergeVectorShaderNode instance.
   *
   * Initializes the node with predefined inputs for various vector components
   * and outputs for different vector sizes. The node supports multiple input
   * combinations to create flexible vector merging operations.
   */
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

  /**
   * Determines the appropriate shader function name based on connected inputs.
   *
   * This method analyzes which input connections are active and returns the
   * corresponding shader function variant. Each combination of inputs requires
   * a different shader function implementation to handle the vector merging logic.
   *
   * Supported input combinations:
   * - XYZ + W: Vec3 input with scalar W component
   * - XY + ZW: Two Vec2 inputs for XY and ZW components
   * - XY + Z + W: Vec2 input with individual Z and W scalars
   * - ZW + X + Y: Vec2 input with individual X and Y scalars
   * - X + Y + Z + W: Four individual scalar components
   *
   * @returns The derivative function name suffix for the shader
   * @throws {Error} When the input connection pattern is not supported
   */
  getShaderFunctionNameDerivative() {
    if (this.inputConnections[0] != null && this.inputConnections[6] != null) {
      return `${this.__shaderFunctionName}XYZ_W`;
    }
    if (this.inputConnections[1] != null && this.inputConnections[2] != null) {
      return `${this.__shaderFunctionName}XY_ZW`;
    }
    if (this.inputConnections[1] != null && this.inputConnections[5] != null && this.inputConnections[6] != null) {
      return `${this.__shaderFunctionName}XY_Z_W`;
    }
    if (this.inputConnections[2] != null && this.inputConnections[3] != null && this.inputConnections[4] != null) {
      return `${this.__shaderFunctionName}ZW_X_Y`;
    }
    if (
      this.inputConnections[3] != null &&
      this.inputConnections[4] != null &&
      this.inputConnections[5] != null &&
      this.inputConnections[6] != null
    ) {
      return `${this.__shaderFunctionName}X_Y_Z_W`;
    }
    throw new Error('Not implemented');
  }

  /**
   * Generates the shader function call statement for the merge vector operation.
   *
   * This method creates the appropriate shader code to call the merge vector function
   * with the correct input and output parameters. It handles both WebGL (GLSL) and
   * WebGPU (WGSL) syntax differences and manages dummy variables for unused outputs.
   *
   * The method generates dummy output variables for each possible output (xyzw, xyz, xy, zw)
   * and replaces them with actual output variable names when they are used. This ensures
   * that the shader function signature remains consistent regardless of which outputs
   * are actually connected.
   *
   * @param i - The node index in the shader graph
   * @param shaderNode - The shader node instance (typically this node)
   * @param functionName - The name of the shader function to call
   * @param varInputNames - Array of input variable names for each node
   * @param varOutputNames - Array of output variable names for each node
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
              `var dummyXYZW_${i}: vec4<f32>;`,
              `var dummyXYZ_${i}: vec3<f32>;`,
              `var dummyXY_${i}: vec2<f32>;`,
              `var dummyZW_${i}: vec2<f32>;`,
            ]
          : [`vec4 dummyXYZW_${i};`, `vec3 dummyXYZ_${i};`, `vec2 dummyXY_${i};`, `vec2 dummyZW_${i};`];

      const dummyOutputArguments = [`dummyXYZW_${i}`, `dummyXYZ_${i}`, `dummyXY_${i}`, `dummyZW_${i}`];

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
          dummyOutputArguments[i] = `&${dummyOutputArguments[i]}`;
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
      rowStr += `, ${dummyOutputArguments.join(', ')}`;
      rowStr += ');\n';
    }

    str += rowStr;

    return str;
  }
}
