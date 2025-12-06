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
   * @param engine - The engine instance
   * @param i - The node index in the shader graph
   * @param shaderNode - The shader node instance (typically this node)
   * @param functionName - The name of the shader function to call
   * @param varInputNames - Array of input variable names for each node
   * @param varOutputNames - Array of output variable names for each node
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
        let vec2Type = 'vec2<f32>';
        let vec3Type = 'vec3<f32>';
        let vec4Type = 'vec4<f32>';
        if (this.__componentType === ComponentType.Int) {
          vec2Type = 'vec2<i32>';
          vec3Type = 'vec3<i32>';
          vec4Type = 'vec4<i32>';
        } else if (this.__componentType === ComponentType.UnsignedInt) {
          vec2Type = 'vec2<u32>';
          vec3Type = 'vec3<u32>';
          vec4Type = 'vec4<u32>';
        }
        dummyOutputVarDefines = [
          `var dummyXYZW_${i}: ${vec4Type};`,
          `var dummyXYZ_${i}: ${vec3Type};`,
          `var dummyXY_${i}: ${vec2Type};`,
          `var dummyZW_${i}: ${vec2Type};`,
        ];
      } else {
        let vec2Type = 'vec2';
        let vec3Type = 'vec3';
        let vec4Type = 'vec4';
        if (this.__componentType === ComponentType.Int) {
          vec2Type = 'ivec2';
          vec3Type = 'ivec3';
          vec4Type = 'ivec4';
        } else if (this.__componentType === ComponentType.UnsignedInt) {
          vec2Type = 'uvec2';
          vec3Type = 'uvec3';
          vec4Type = 'uvec4';
        }
        dummyOutputVarDefines = [
          `${vec4Type} dummyXYZW_${i};`,
          `${vec3Type} dummyXYZ_${i};`,
          `${vec2Type} dummyXY_${i};`,
          `${vec2Type} dummyZW_${i};`,
        ];
      }

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

      if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
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
