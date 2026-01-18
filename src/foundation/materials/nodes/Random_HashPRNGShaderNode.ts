import Random_HashPRNGShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/Random_HashPRNG.glsl';
import Random_HashPRNGShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/Random_HashPRNG.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { Vector3 } from '../../math/Vector3';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that outputs a random number between 0 and 1 using Hash-based PRNG.
 * This node outputs a random number between 0 and 1.
 * The node optimizes random_f32() calls based on which outputs are connected.
 *
 * Output sockets and their required random_f32() calls:
 * - outX: 1 call
 * - outY, outXY: 2 calls
 * - outZ, outXYZ, outXYZ1: 3 calls
 * - outW, outZW, outXYZW: 4 calls
 */
export class Random_HashPRNGShaderNode extends AbstractShaderNode {
  /**
   * Creates a new Random_HashPRNGShaderNode instance.
   */
  constructor() {
    super('random_HashPRNG', {
      codeGLSL: Random_HashPRNGShaderityObjectGLSL.code,
      codeWGSL: Random_HashPRNGShaderityObjectWGSL.code,
    });

    this.__inputs.push(new Socket('seed', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0, 0, 0)));
    this.__outputs.push(new Socket('outXYZW', CompositionType.Vec4, ComponentType.Float));
    this.__outputs.push(new Socket('outXYZ1', CompositionType.Vec4, ComponentType.Float));
    this.__outputs.push(new Socket('outXYZ', CompositionType.Vec3, ComponentType.Float));
    this.__outputs.push(new Socket('outXY', CompositionType.Vec2, ComponentType.Float));
    this.__outputs.push(new Socket('outZW', CompositionType.Vec2, ComponentType.Float));
    this.__outputs.push(new Socket('outX', CompositionType.Scalar, ComponentType.Float));
    this.__outputs.push(new Socket('outY', CompositionType.Scalar, ComponentType.Float));
    this.__outputs.push(new Socket('outZ', CompositionType.Scalar, ComponentType.Float));
    this.__outputs.push(new Socket('outW', CompositionType.Scalar, ComponentType.Float));
  }

  /**
   * Determines the minimum number of random_f32() calls needed based on connected outputs.
   * Output socket indices and their required call counts:
   * - 0: outXYZW (4 calls)
   * - 1: outXYZ1 (3 calls)
   * - 2: outXYZ (3 calls)
   * - 3: outXY (2 calls)
   * - 4: outZW (4 calls)
   * - 5: outX (1 call)
   * - 6: outY (2 calls)
   * - 7: outZ (3 calls)
   * - 8: outW (4 calls)
   *
   * @param varOutputNames - Array of output variable names (dummy* prefix indicates unconnected)
   * @returns The minimum number of random_f32() calls needed (1-4)
   */
  private __getRequiredRandomCalls(varOutputNames: string[]): number {
    // Map output index to required random call count
    const requiredCallsMap: number[] = [
      4, // 0: outXYZW
      3, // 1: outXYZ1
      3, // 2: outXYZ
      2, // 3: outXY
      4, // 4: outZW
      1, // 5: outX
      2, // 6: outY
      3, // 7: outZ
      4, // 8: outW
    ];

    let maxCalls = 1; // Minimum 1 call if any output is connected

    for (let i = 0; i < varOutputNames.length; i++) {
      const varName = varOutputNames[i];
      // Dummy variables start with "dummy" - these are unconnected outputs
      if (!varName.startsWith('dummy')) {
        const requiredCalls = requiredCallsMap[i] || 4;
        maxCalls = Math.max(maxCalls, requiredCalls);
      }
    }

    return maxCalls;
  }

  /**
   * Generates shader code for calling the random function.
   * Analyzes connected outputs and selects the optimal function variant
   * to minimize random_f32() calls.
   *
   * @param engine - The engine instance
   * @param i - The index of the current shader node call
   * @param _shaderNode - The shader node instance (unused)
   * @param _functionName - The base function name (overridden based on analysis)
   * @param varInputNames - Array of input variable names for each call
   * @param varOutputNames - Array of output variable names for each call
   * @returns The generated shader code string for the function call
   */
  makeCallStatement(
    engine: Engine,
    i: number,
    _shaderNode: AbstractShaderNode,
    _functionName: string,
    varInputNames: string[][],
    varOutputNames: string[][]
  ): string {
    let str = '';
    if (varInputNames[i].length > 0 && varOutputNames[i].length > 0) {
      // Determine the minimum required random_f32() calls
      const requiredCalls = this.__getRequiredRandomCalls(varOutputNames[i]);

      // Select the appropriate optimized function
      const optimizedFunctionName = `random_HashPRNG${requiredCalls}`;

      // Build output arguments with proper WebGPU reference handling
      const outputArguments = [...varOutputNames[i]];
      if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
        for (let j = 0; j < outputArguments.length; j++) {
          outputArguments[j] = `&${outputArguments[j]}`;
        }
      }

      // Call the optimized function
      str += `${optimizedFunctionName}(`;
      str += varInputNames[i][0]; // seed input
      str += `, ${outputArguments.join(', ')}`;
      str += ');\n';
    }

    return str;
  }
}
