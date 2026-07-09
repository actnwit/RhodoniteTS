import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
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
export declare class Random_HashPRNGShaderNode extends AbstractShaderNode {
    /**
     * Creates a new Random_HashPRNGShaderNode instance.
     */
    constructor();
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
    private __getRequiredRandomCalls;
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
    makeCallStatement(engine: Engine, i: number, _shaderNode: AbstractShaderNode, _functionName: string, varInputNames: string[][], varOutputNames: string[][]): string;
}
