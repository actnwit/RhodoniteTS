/**
 * AnimationOps.ts is a module that provides utility functions for animation operations.
 *
 * @internal
 */
import type { AnimationSampler } from '../../../types/AnimationTypes';
import type { Index } from '../../../types/CommonTypes';
import type { KeyframeCursor } from '../../math/AnimatedValueEvaluationState';
/**
 * Extracts the output value at a specific keyframe from the animation sampler data.
 * Handles different interpolation methods and component counts appropriately.
 *
 * @param keyFrameId - Index of the keyframe to extract
 * @param sampler - Animation sampler containing the data and metadata
 * @param array_ - Animation output data array
 * @returns The extracted value as an array of numbers
 */
export declare function __getOutputValue(keyFrameId: Index, sampler: AnimationSampler, array_: Float32Array | number[]): number[];
/**
 * A mutable array-like target for interpolation results (number[], Float32Array, Float64Array).
 */
export type WritableNumberArray = {
    [index: number]: number;
};
/**
 * Interpolates animation values at a specific time and writes them into an existing array.
 * This is the allocation-free path used by the Animated* value classes every frame.
 *
 * @param sampler - Animation sampler containing input/output data and interpolation settings
 * @param currentTime - Time value to interpolate at
 * @param animationAttributeIndex - Type of animation attribute being interpolated
 * @param out - Destination array (length must be at least `sampler.outputComponentN`)
 * @param cursor - Optional memoized keyframe segment index
 */
export declare function __interpolateTo(sampler: AnimationSampler, currentTime: number, animationAttributeIndex: Index, out: WritableNumberArray, cursor?: KeyframeCursor): void;
/**
 * Interpolates animation values at a specific time using the specified interpolation method.
 * Supports linear, step, and cubic spline interpolation methods according to glTF 2.0 specification.
 *
 * @param sampler - Animation sampler containing input/output data and interpolation settings
 * @param currentTime - Time value to interpolate at
 * @param animationAttributeIndex - Type of animation attribute being interpolated
 * @param cursor - Optional memoized keyframe segment index
 * @returns Interpolated animation values as an array
 */
export declare function __interpolate(sampler: AnimationSampler, currentTime: number, animationAttributeIndex: Index, cursor?: KeyframeCursor): Array<number>;
