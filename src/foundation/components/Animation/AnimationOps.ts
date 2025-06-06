/**
 * AnimationOps.ts is a module that provides utility functions for animation operations.
 *
 * @internal
 */
import { AnimationChannel, AnimationSampler } from '../../../types/AnimationTypes';
import { Array1, Array2, Array3, Array4, Index } from '../../../types/CommonTypes';
import { AnimationAttribute } from '../../definitions/AnimationAttribute';
import { AnimationInterpolation } from '../../definitions/AnimationInterpolation';
import {
  array2_lerp_offsetAsComposition,
  array3_lerp_offsetAsComposition,
  array4_lerp_offsetAsComposition,
  arrayN_lerp_offsetAsComposition,
  get1_offset,
  get1_offsetAsComposition,
  get2_offset,
  get2_offsetAsComposition,
  get3_offset,
  get3_offsetAsComposition,
  get4_offset,
  get4_offsetAsComposition,
  getN_offset,
  getN_offsetAsComposition,
  mulArray3WithScalar_offset,
  mulArray4WithScalar_offset,
  mulArrayNWithScalar_offset,
  normalizeArray4,
  qlerp_offsetAsComposition,
  scalar_lerp_offsetAsComposition,
} from '../../math/raw/raw_extension';

/**
 * Computes cubic spline interpolation using the Hermite interpolation formula.
 * This is typically used for smooth animation curves with tangent control.
 *
 * @param p0 - Starting point values
 * @param p1 - Ending point values
 * @param m0 - Input tangent values at the starting point
 * @param m1 - Output tangent values at the ending point
 * @param t - Interpolation parameter (0.0 to 1.0)
 * @returns Interpolated values as an array
 */
function cubicSpline(
  p0: Array<number>,
  p1: Array<number>,
  m0: Array<number>,
  m1: Array<number>,
  t: number
): Array<number> {
  const ret = new Array(p0.length);
  for (let i = 0; i < p0.length; i++) {
    ret[i] =
      (2 * t ** 3 - 3 * t ** 2 + 1) * p0[i] +
      (t ** 3 - 2 * t ** 2 + t) * m0[i] +
      (-2 * t ** 3 + 3 * t ** 2) * p1[i] +
      (t ** 3 - t ** 2) * m1[i];
  }
  return ret;
}

/**
 * Prepares the required variables for cubic spline interpolation according to glTF 2.0 specification.
 * Extracts control points and tangent vectors from the animation output array based on component count.
 *
 * In glTF CUBICSPLINE interpolation, data is organized as: a1,a2,…an,v1,v2,…vn,b1,b2,…bn
 * where 'a' are in-tangents, 'v' are values, and 'b' are out-tangents.
 *
 * @param outputArray_ - Animation output data array
 * @param i - Current keyframe index
 * @param componentN - Number of components per value (1, 2, 3, 4, or N)
 * @param t_diff - Time difference between current and next keyframe
 * @returns Object containing control points and tangent vectors for interpolation
 */
function __prepareVariablesForCubicSpline(
  outputArray_: Float32Array | number[],
  i: number,
  componentN: number,
  t_diff: number
): {
  p_0: Array<number>;
  p_1: Array<number>;
  m_0: Array<number>;
  m_1: Array<number>;
} {
  const outputArray = outputArray_ as globalThis.Float32Array;

  if (componentN === 4) {
    const p_0 = outputArray[get4_offset](
      // In glTF CUBICSPLINE interpolation, tangents (ak, bk) and values (vk) are grouped within keyframes: a1,a2,…an,v1,v2,…vn,b1,b2,…bn
      componentN * 3 * i + componentN
    );
    const p_1 = outputArray[get4_offset](
      // In glTF CUBICSPLINE interpolation, tangents (ak, bk) and values (vk) are grouped within keyframes: a1,a2,…an,v1,v2,…vn,b1,b2,…bn
      componentN * 3 * (i + 1) + componentN
    );
    const m_0 = outputArray[mulArray4WithScalar_offset](componentN * 3 * i + componentN * 2, t_diff);
    const m_1 = outputArray[mulArray4WithScalar_offset](componentN * 3 * (i + 1), t_diff);
    return { p_0, p_1, m_0, m_1 };
  } else if (componentN === 3) {
    const p_0 = outputArray[get3_offset](
      // In glTF CUBICSPLINE interpolation, tangents (ak, bk) and values (vk) are grouped within keyframes: a1,a2,…an,v1,v2,…vn,b1,b2,…bn
      componentN * 3 * i + componentN
    ) as Array<number>;
    const p_1 = outputArray[get3_offset](
      // In glTF CUBICSPLINE interpolation, tangents (ak, bk) and values (vk) are grouped within keyframes: a1,a2,…an,v1,v2,…vn,b1,b2,…bn
      componentN * 3 * (i + 1) + componentN
    ) as Array<number>;
    const m_0 = outputArray[mulArray3WithScalar_offset](componentN * 3 * i + componentN * 2, t_diff) as Array<number>;
    const m_1 = outputArray[mulArray3WithScalar_offset](componentN * 3 * (i + 1), t_diff) as Array<number>;
    return { p_0, p_1, m_0, m_1 };
  } else {
    const p_0 = outputArray[getN_offset](
      // In glTF CUBICSPLINE interpolation, tangents (ak, bk) and values (vk) are grouped within keyframes: a1,a2,…an,v1,v2,…vn,b1,b2,…bn
      componentN * 3 * i + componentN,
      componentN
    );
    const p_1 = outputArray[getN_offset](
      // In glTF CUBICSPLINE interpolation, tangents (ak, bk) and values (vk) are grouped within keyframes: a1,a2,…an,v1,v2,…vn,b1,b2,…bn
      componentN * 3 * (i + 1) + componentN,
      componentN
    );
    const m_0 = outputArray[mulArrayNWithScalar_offset](
      componentN * 3 * i + componentN * 2,
      componentN,
      t_diff
    ) as Array<number>;
    const m_1 = outputArray[mulArrayNWithScalar_offset](componentN * 3 * (i + 1), componentN, t_diff) as Array<number>;
    return { p_0, p_1, m_0, m_1 };
  }
}

/**
 * Extracts the output value at a specific keyframe from the animation sampler data.
 * Handles different interpolation methods and component counts appropriately.
 *
 * @param keyFrameId - Index of the keyframe to extract
 * @param sampler - Animation sampler containing the data and metadata
 * @param array_ - Animation output data array
 * @returns The extracted value as an array of numbers
 */
export function __getOutputValue(keyFrameId: Index, sampler: AnimationSampler, array_: Float32Array | number[]) {
  const array = array_ as globalThis.Float32Array;
  if (sampler.interpolationMethod === AnimationInterpolation.CubicSpline) {
    // In glTF CUBICSPLINE interpolation, tangents (ak, bk) and values (vk) are grouped within keyframes: a1,a2,…an,v1,v2,…vn,b1,b2,…bn
    if (sampler.outputComponentN === 4) {
      // Quaternion/weights
      const value = array[get4_offset](
        sampler.outputComponentN * 3 * keyFrameId + sampler.outputComponentN
      ) as Array4<number>;
      return value;
    } else if (sampler.outputComponentN === 3) {
      // Translate/Scale/weights
      const value = array[get3_offset](
        sampler.outputComponentN * 3 * keyFrameId + sampler.outputComponentN
      ) as Array3<number>;
      return value;
    } else if (sampler.outputComponentN === 2) {
      // Vector2
      const value = array[get2_offset](
        sampler.outputComponentN * 3 * keyFrameId + sampler.outputComponentN
      ) as Array2<number>;
      return value;
    } else if (sampler.outputComponentN === 1) {
      const value = array[get1_offset](
        sampler.outputComponentN * 3 * keyFrameId + sampler.outputComponentN
      ) as Array1<number>;
      return value;
    } else {
      // weights // outputComponentN === N
      const value = array[getN_offset](
        sampler.outputComponentN * 3 * keyFrameId + sampler.outputComponentN,
        sampler.outputComponentN
      ) as Array<number>;
      return value;
    }
  } else {
    // For Other than CUBICSPLINE interpolation
    if (sampler.outputComponentN === 4) {
      // Quaternion/weights
      const value = array[get4_offsetAsComposition](keyFrameId) as Array4<number>;
      return value;
    } else if (sampler.outputComponentN === 3) {
      // Translate/Scale/weights
      const value = array[get3_offsetAsComposition](keyFrameId) as Array3<number>;
      return value;
    } else if (sampler.outputComponentN === 2) {
      // Vector2
      const value = array[get2_offsetAsComposition](keyFrameId) as Array2<number>;
      return value;
    } else if (sampler.outputComponentN === 1) {
      // Effekseer (Animation Event)
      const value = array[get1_offsetAsComposition](keyFrameId) as Array1<number>;
      return value;
    } else {
      // weights
      const value = array[getN_offsetAsComposition](keyFrameId, sampler.outputComponentN) as Array<number>;
      return value;
    }
  }
}

/**
 * Performs binary search to find the keyframe index for a given time value.
 * This is an efficient O(log n) search algorithm for sorted time arrays.
 *
 * @param inputArray - Sorted array of time values
 * @param currentTime - Time value to search for
 * @returns Index of the keyframe at or before the current time
 */
function binarySearch(inputArray: Float32Array, currentTime: number) {
  let low = 0;
  let high = inputArray.length - 1;
  let mid = 0;
  let retVal = 0;
  while (low <= high) {
    mid = low + ((high - low) >> 1);

    if (inputArray[mid] < currentTime) {
      low = mid + 1;
      retVal = mid;
    } else if (currentTime < inputArray[mid]) {
      high = mid - 1;
      retVal = high;
    } else {
      // if (inputArray[mid] === input) {
      return mid;
    }
  }

  return retVal;
}

/**
 * Performs brute force linear search to find the keyframe index for a given time value.
 * This is an O(n) search algorithm that checks each element sequentially.
 * Less efficient than binary search but useful for small datasets or debugging.
 *
 * @param inputArray - Array of time values
 * @param currentTime - Time value to search for
 * @returns Index of the keyframe at or before the current time
 */
function bruteForceSearch(inputArray: Float32Array, currentTime: number) {
  for (let i = 0; i < inputArray.length; i++) {
    if (inputArray[i] <= currentTime && currentTime < inputArray[i + 1]) {
      return i;
    }
  }
  return inputArray.length - 1;
}

/**
 * Performs interpolation search to find the keyframe index for a given time value.
 * This algorithm assumes uniform distribution of time values and can be more efficient
 * than binary search in such cases, with average O(log log n) complexity.
 *
 * @param inputArray - Sorted array of time values
 * @param currentTime - Time value to search for
 * @returns Index of the keyframe at or before the current time
 */
function interpolationSearch(inputArray: Float32Array | number[], currentTime: number) {
  let mid = 0;
  let lower = 0;
  let upper = inputArray.length - 1;
  let retVal = 0;

  while (lower <= upper && currentTime >= inputArray[lower] && currentTime <= inputArray[upper]) {
    mid = Math.floor(
      lower + ((currentTime - inputArray[lower]) * (upper - lower)) / (inputArray[upper] - inputArray[lower])
    );

    if (inputArray[mid] < currentTime) {
      lower = mid + 1;
      retVal = mid;
    } else if (currentTime < inputArray[mid]) {
      upper = mid - 1;
      retVal = upper;
    } else {
      // if (inputArray[mid] === input) {
      return mid;
    }
  }

  return retVal;
}

/**
 * Performs linear interpolation between two keyframes based on animation attribute type.
 * Handles different data types including quaternions, vectors, scalars, and weights.
 *
 * @param data_ - Animation output data array
 * @param ratio - Interpolation ratio (0.0 to 1.0)
 * @param animationAttributeIndex - Type of animation attribute being interpolated
 * @param i - Index of the first keyframe
 * @param outputComponentN - Number of components per value
 * @returns Interpolated value as an array or scalar
 */
function __lerp(
  data_: Float32Array | number[],
  ratio: number,
  animationAttributeIndex: Index,
  i: Index,
  outputComponentN: number
) {
  const data = data_ as globalThis.Float32Array;
  if (animationAttributeIndex === AnimationAttribute.Quaternion.index) {
    const array4 = data[qlerp_offsetAsComposition](data, ratio, i, i + 1);
    return array4;
  } else if (
    animationAttributeIndex === AnimationAttribute.Weights.index ||
    animationAttributeIndex === AnimationAttribute.VectorN.index
  ) {
    const arrayN = data[arrayN_lerp_offsetAsComposition](data, outputComponentN, ratio, i, i + 1);
    return arrayN;
  } else if (
    animationAttributeIndex === AnimationAttribute.Translate.index ||
    animationAttributeIndex === AnimationAttribute.Scale.index ||
    animationAttributeIndex === AnimationAttribute.Vector3.index
  ) {
    // Translate / Scale
    const array3 = data[array3_lerp_offsetAsComposition](data, ratio, i, i + 1);
    return array3;
  } else if (animationAttributeIndex === AnimationAttribute.Vector2.index) {
    const array2 = data[array2_lerp_offsetAsComposition](data, ratio, i, i + 1);
    return array2;
  } else if (animationAttributeIndex === AnimationAttribute.Vector4.index) {
    const array4 = data[array4_lerp_offsetAsComposition](data, ratio, i, i + 1);
    return array4;
  } else if (animationAttributeIndex === AnimationAttribute.Scalar.index) {
    const scalar = data[scalar_lerp_offsetAsComposition](data, ratio, i, i + 1);
    return scalar;
  } else {
    // non supported type
    throw new Error('non supported type');
  }
}

/**
 * Interpolates animation values at a specific time using the specified interpolation method.
 * Supports linear, step, and cubic spline interpolation methods according to glTF 2.0 specification.
 *
 * @param sampler - Animation sampler containing input/output data and interpolation settings
 * @param currentTime - Time value to interpolate at
 * @param animationAttributeIndex - Type of animation attribute being interpolated
 * @returns Interpolated animation values as an array
 */
export function __interpolate(
  sampler: AnimationSampler,
  currentTime: number,
  animationAttributeIndex: Index
): Array<number> {
  const inputArray = sampler.input;
  const outputArray = sampler.output;
  const method = sampler.interpolationMethod ?? AnimationInterpolation.Linear;

  // out of range
  if (currentTime <= inputArray[0]) {
    const outputOfZeroFrame = __getOutputValue(0, sampler, outputArray);
    return outputOfZeroFrame;
  } else if (inputArray[inputArray.length - 1] <= currentTime) {
    const outputOfEndFrame = __getOutputValue(inputArray.length - 1, sampler, outputArray);
    return outputOfEndFrame;
  }

  if (method === AnimationInterpolation.CubicSpline) {
    // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#appendix-c-spline-interpolation
    const i = interpolationSearch(inputArray, currentTime);
    const t_diff = inputArray[i + 1] - inputArray[i]; // t_(k+1) - t_k
    const t = (currentTime - inputArray[i]) / t_diff;
    const { p_0, p_1, m_0, m_1 } = __prepareVariablesForCubicSpline(outputArray, i, sampler.outputComponentN, t_diff);
    const ret = cubicSpline(p_0, p_1, m_0, m_1, t) as globalThis.Array<number>;
    if (animationAttributeIndex === AnimationAttribute.Quaternion.index) {
      (ret as any)[normalizeArray4]();
    }
    return ret;
  } else if (method === AnimationInterpolation.Linear) {
    const i = interpolationSearch(inputArray, currentTime);
    const ratio = (currentTime - inputArray[i]) / (inputArray[i + 1] - inputArray[i]);
    const ret = __lerp(outputArray, ratio, animationAttributeIndex, i, sampler.outputComponentN);
    return ret as Array<number>;
  } else if (method === AnimationInterpolation.Step) {
    for (let i = 0; i < inputArray.length - 1; i++) {
      if (inputArray[i] <= currentTime && currentTime < inputArray[i + 1]) {
        const output_frame_i = __getOutputValue(i, sampler, outputArray);
        return output_frame_i;
      }
    }
    const outputOfEndFrame = __getOutputValue(inputArray.length - 1, sampler, outputArray);
    return outputOfEndFrame;
  }

  // non supported type
  return [];
}
