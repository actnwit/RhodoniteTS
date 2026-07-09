/**
 * AnimationOps.ts is a module that provides utility functions for animation operations.
 *
 * @internal
 */
import type { AnimationSampler } from '../../../types/AnimationTypes';
import type { Index } from '../../../types/CommonTypes';
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
 * Interpolates animation values at a specific time using the specified interpolation method.
 * Supports linear, step, and cubic spline interpolation methods according to glTF 2.0 specification.
 *
 * @param sampler - Animation sampler containing input/output data and interpolation settings
 * @param currentTime - Time value to interpolate at
 * @param animationAttributeIndex - Type of animation attribute being interpolated
 * @returns Interpolated animation values as an array
 */
export declare function __interpolate(sampler: AnimationSampler, currentTime: number, animationAttributeIndex: Index): Array<number>;
