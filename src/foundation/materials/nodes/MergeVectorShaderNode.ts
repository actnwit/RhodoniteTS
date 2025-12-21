import MergeVectorShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/MergeVector.glsl';
import MergeVectorShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/MergeVector.wgsl';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

/**
 * A shader node that merges vector components to create various vector outputs.
 *
 * This node provides the capability to combine individual scalar components (x, y, z, w)
 * or smaller vectors (xy, zw, xyz) into larger vector outputs (Vec2, Vec3, Vec4).
 * It supports multiple input configurations and automatically selects the appropriate
 * shader function based on which inputs are connected.
 * Supports float, int, and uint component types.
 *
 * @example
 * ```typescript
 * const mergeNode = new MergeVectorShaderNode(ComponentType.Float);
 * // Connect scalar inputs x, y, z, w to create a Vec4 output
 * // Or connect Vec3 xyz and scalar w to create a Vec4 output
 * ```
 */
export class MergeVectorShaderNode extends AbstractShaderNode {
  private __componentType: ComponentTypeEnum;

  /**
   * Creates a new MergeVectorShaderNode instance.
   *
   * @param componentType - The component type (Float, Int, or UnsignedInt). Defaults to Float.
   *
   * Initializes the node with predefined inputs for various vector components
   * and outputs for different vector sizes. The node supports multiple input
   * combinations to create flexible vector merging operations.
   */
  constructor(componentType: ComponentTypeEnum = ComponentType.Float) {
    super('mergeVector', {
      codeGLSL: MergeVectorShaderityObjectGLSL.code,
      codeWGSL: MergeVectorShaderityObjectWGSL.code,
    });

    this.__componentType = componentType;

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
    this.__inputs.push({
      compositionType: CompositionType.Vec2,
      componentType: componentType,
      name: 'zw',
    });
    this.__inputs.push({
      compositionType: CompositionType.Scalar,
      componentType: componentType,
      name: 'x',
    });
    this.__inputs.push({
      compositionType: CompositionType.Scalar,
      componentType: componentType,
      name: 'y',
    });
    this.__inputs.push({
      compositionType: CompositionType.Scalar,
      componentType: componentType,
      name: 'z',
    });
    this.__inputs.push({
      compositionType: CompositionType.Scalar,
      componentType: componentType,
      name: 'w',
    });

    this.__outputs.push({
      compositionType: CompositionType.Vec4,
      componentType: componentType,
      name: 'xyzw',
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
  }

  /**
   * Determines the appropriate shader function name based on connected inputs and component type.
   *
   * This method analyzes which input connections are active and returns the
   * corresponding shader function variant. Each combination of inputs requires
   * a different shader function implementation to handle the vector merging logic.
   * For WebGPU, type suffix (I32, U32) is added for non-float types.
   *
   * Supported input combinations:
   * - XYZ + W: Vec3 input with scalar W component
   * - XY + ZW: Two Vec2 inputs for XY and ZW components
   * - XY + Z + W: Vec2 input with individual Z and W scalars
   * - ZW + X + Y: Vec2 input with individual X and Y scalars
   * - X + Y + Z + W: Four individual scalar components
   *
   * @param engine - The engine instance
   * @returns The derivative function name suffix for the shader
   * @throws {Error} When the input connection pattern is not supported
   */
  getShaderFunctionNameDerivative(engine: Engine) {
    let typeSuffix = '';
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (this.__componentType === ComponentType.Int) {
        typeSuffix = 'I32';
      } else if (this.__componentType === ComponentType.UnsignedInt) {
        typeSuffix = 'U32';
      }
    }

    if (this.inputConnections[0] != null && this.inputConnections[6] != null) {
      return `${this.__shaderFunctionName}XYZ_W${typeSuffix}`;
    }
    if (this.inputConnections[1] != null && this.inputConnections[2] != null) {
      return `${this.__shaderFunctionName}XY_ZW${typeSuffix}`;
    }
    if (this.inputConnections[1] != null && this.inputConnections[5] != null && this.inputConnections[6] != null) {
      return `${this.__shaderFunctionName}XY_Z_W${typeSuffix}`;
    }
    if (this.inputConnections[2] != null && this.inputConnections[3] != null && this.inputConnections[4] != null) {
      return `${this.__shaderFunctionName}ZW_X_Y${typeSuffix}`;
    }
    if (
      this.inputConnections[3] != null &&
      this.inputConnections[4] != null &&
      this.inputConnections[5] != null &&
      this.inputConnections[6] != null
    ) {
      return `${this.__shaderFunctionName}X_Y_Z_W${typeSuffix}`;
    }
    throw new Error('Not implemented');
  }

  /**
   * Generates the shader function call statement for the merge vector operation.
   * ShaderGraphResolver already orders varOutputNames to match output socket order and generates
   * dummy variables for unconnected outputs, so we simply use them directly.
   * This node only needs custom handling for selecting the correct input indices based on
   * which inputs are connected.
   *
   * @param engine - The engine instance
   * @param i - The node index in the shader graph
   * @param _shaderNode - The shader node instance (unused in this implementation)
   * @param functionName - The name of the shader function to call
   * @param varInputNames - Array of input variable names for each node
   * @param varOutputNames - Array of output variable names for each node (already ordered by ShaderGraphResolver)
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
      // Determine which input indices to use based on function name
      // Input indices: 0: xyz, 1: xy, 2: zw, 3: x, 4: y, 5: z, 6: w
      let inputIndices: number[];
      if (functionName.includes('XYZ_W')) {
        inputIndices = [0, 6]; // xyz, w
      } else if (functionName.includes('XY_ZW')) {
        inputIndices = [1, 2]; // xy, zw
      } else if (functionName.includes('XY_Z_W')) {
        inputIndices = [1, 5, 6]; // xy, z, w
      } else if (functionName.includes('ZW_X_Y')) {
        inputIndices = [2, 3, 4]; // zw, x, y
      } else if (functionName.includes('X_Y_Z_W')) {
        inputIndices = [3, 4, 5, 6]; // x, y, z, w
      } else {
        inputIndices = [];
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
      for (let k = 0; k < inputIndices.length; k++) {
        if (k !== 0) {
          str += ', ';
        }
        const inputName = varInputNames[i][inputIndices[k]];
        str += inputName;
      }
      str += `, ${outputArguments.join(', ')}`;
      str += ');\n';
    }

    return str;
  }
}
