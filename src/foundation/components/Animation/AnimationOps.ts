/**
 * AnimationOps.ts is a module that provides utility functions for animation operations.
 *
 * @internal
 */
import type { AnimationSampler } from '../../../types/AnimationTypes';
import type { Array1, Array2, Array3, Array4, Index } from '../../../types/CommonTypes';
import { AnimationAttribute } from '../../definitions/AnimationAttribute';
import { AnimationInterpolation } from '../../definitions/AnimationInterpolation';
import type { KeyframeCursor } from '../../math/AnimatedValueEvaluationState';
import {
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
} from '../../math/raw/raw_extension';

/**
 * Scratch buffer used to normalize cubic-spline quaternions in double precision before the result is
 * written into a Float32Array. Normalizing after the Float32 rounding would change the result by ulps.
 */
const __cubicSplineQuaternionScratch = new Float64Array(4);

/**
 * Cubic spline interpolation writing the result into an existing array.
 * Uses the Hermite interpolation formula from the glTF 2.0 specification.
 */
function __cubicSplineTo(
  p0: Array<number>,
  p1: Array<number>,
  m0: Array<number>,
  m1: Array<number>,
  t: number,
  out: WritableNumberArray
): void {
  const t2 = t ** 2;
  const t3 = t ** 3;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  for (let i = 0; i < p0.length; i++) {
    out[i] = h00 * p0[i] + h10 * m0[i] + h01 * p1[i] + h11 * m1[i];
  }
}

/**
 * Reads a tangent vector from the animation output array and scales it without mutating the source.
 *
 * The previous implementation used the in-place `mulArray*WithScalar_offset` helpers, which both
 * mutated `sampler.output` on every evaluation and returned the whole array instead of the tangent
 * slice. This helper keeps the sampler data immutable.
 *
 * @param outputArray - Animation output data array
 * @param offset - Offset of the tangent vector in the flat output array
 * @param componentN - Number of components per value
 * @param scale - Scale factor (the keyframe time difference)
 * @returns A new array containing the scaled tangent components
 */
function __getScaledTangent(
  outputArray: globalThis.Float32Array,
  offset: number,
  componentN: number,
  scale: number
): Array<number> {
  const tangent = new Array<number>(componentN);
  for (let c = 0; c < componentN; c++) {
    tangent[c] = outputArray[offset + c] * scale;
  }
  return tangent;
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

  // In glTF CUBICSPLINE interpolation, tangents (ak, bk) and values (vk) are grouped within keyframes: a1,a2,…an,v1,v2,…vn,b1,b2,…bn
  const valueOffset0 = componentN * 3 * i + componentN;
  const valueOffset1 = componentN * 3 * (i + 1) + componentN;
  const outTangentOffset0 = componentN * 3 * i + componentN * 2;
  const inTangentOffset1 = componentN * 3 * (i + 1);

  let p_0: Array<number>;
  let p_1: Array<number>;
  if (componentN === 4) {
    p_0 = outputArray[get4_offset](valueOffset0) as Array<number>;
    p_1 = outputArray[get4_offset](valueOffset1) as Array<number>;
  } else if (componentN === 3) {
    p_0 = outputArray[get3_offset](valueOffset0) as Array<number>;
    p_1 = outputArray[get3_offset](valueOffset1) as Array<number>;
  } else {
    p_0 = outputArray[getN_offset](valueOffset0, componentN) as Array<number>;
    p_1 = outputArray[getN_offset](valueOffset1, componentN) as Array<number>;
  }

  const m_0 = __getScaledTangent(outputArray, outTangentOffset0, componentN, t_diff);
  const m_1 = __getScaledTangent(outputArray, inTangentOffset1, componentN, t_diff);
  return { p_0, p_1, m_0, m_1 };
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
    }
    if (sampler.outputComponentN === 3) {
      // Translate/Scale/weights
      const value = array[get3_offset](
        sampler.outputComponentN * 3 * keyFrameId + sampler.outputComponentN
      ) as Array3<number>;
      return value;
    }
    if (sampler.outputComponentN === 2) {
      // Vector2
      const value = array[get2_offset](
        sampler.outputComponentN * 3 * keyFrameId + sampler.outputComponentN
      ) as Array2<number>;
      return value;
    }
    if (sampler.outputComponentN === 1) {
      const value = array[get1_offset](
        sampler.outputComponentN * 3 * keyFrameId + sampler.outputComponentN
      ) as Array1<number>;
      return value;
    }
    // weights // outputComponentN === N
    const value = array[getN_offset](
      sampler.outputComponentN * 3 * keyFrameId + sampler.outputComponentN,
      sampler.outputComponentN
    ) as Array<number>;
    return value;
  }
  // For Other than CUBICSPLINE interpolation
  if (sampler.outputComponentN === 4) {
    // Quaternion/weights
    const value = array[get4_offsetAsComposition](keyFrameId) as Array4<number>;
    return value;
  }
  if (sampler.outputComponentN === 3) {
    // Translate/Scale/weights
    const value = array[get3_offsetAsComposition](keyFrameId) as Array3<number>;
    return value;
  }
  if (sampler.outputComponentN === 2) {
    // Vector2
    const value = array[get2_offsetAsComposition](keyFrameId) as Array2<number>;
    return value;
  }
  if (sampler.outputComponentN === 1) {
    // Effekseer (Animation Event)
    const value = array[get1_offsetAsComposition](keyFrameId) as Array1<number>;
    return value;
  }
  // weights
  const value = array[getN_offsetAsComposition](keyFrameId, sampler.outputComponentN) as Array<number>;
  return value;
}

/**
 * Performs binary search to find the keyframe index for a given time value.
 * This is an efficient O(log n) search algorithm for sorted time arrays.
 *
 * @param inputArray - Sorted array of time values
 * @param currentTime - Time value to search for
 * @returns Index of the keyframe at or before the current time
 */
function _binarySearch(inputArray: Float32Array, currentTime: number) {
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
function _bruteForceSearch(inputArray: Float32Array, currentTime: number) {
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
 * Finds the keyframe segment index for a given time, reusing the previous result when possible.
 *
 * Animation playback usually advances monotonically, so the previously found segment (or the next
 * one) is almost always the right answer. The interpolation search is only used when the cursor
 * misses (loop wrap, track switch, out-of-order time).
 *
 * @param inputArray - Sorted array of time values
 * @param currentTime - Time value to search for
 * @param cursor - Optional memoized segment index for this evaluation site
 * @returns Index of the keyframe at or before the current time
 */
function __findKeyframe(inputArray: Float32Array | number[], currentTime: number, cursor?: KeyframeCursor): number {
  if (cursor !== undefined) {
    const i = cursor.i;
    if (i >= 0 && i < inputArray.length - 1 && inputArray[i] <= currentTime && currentTime < inputArray[i + 1]) {
      return i;
    }
    const next = i + 1;
    if (
      next >= 0 &&
      next < inputArray.length - 1 &&
      inputArray[next] <= currentTime &&
      currentTime < inputArray[next + 1]
    ) {
      cursor.i = next;
      return next;
    }
  }

  const found = interpolationSearch(inputArray, currentTime);
  if (cursor !== undefined) {
    cursor.i = found;
  }
  return found;
}

/**
 * A mutable array-like target for interpolation results (number[], Float32Array, Float64Array).
 */
export type WritableNumberArray = { [index: number]: number };

/**
 * Performs quaternion SLERP into an existing array.
 * The arithmetic order matches `qlerp_offsetAsComposition_fn`.
 */
function __qlerpTo(
  data: globalThis.Float32Array,
  ratio: number,
  selfOffsetAsComposition: number,
  argOffsetAsComposition: number,
  out: WritableNumberArray
): void {
  const s = selfOffsetAsComposition * 4;
  const a = argOffsetAsComposition * 4;
  let dotProduct =
    data[0 + s] * data[0 + a] + data[1 + s] * data[1 + a] + data[2 + s] * data[2 + a] + data[3 + s] * data[3 + a];
  const ss = 1.0 - dotProduct * dotProduct;

  if (ss === 0.0) {
    out[0] = data[0 + s];
    out[1] = data[1 + s];
    out[2] = data[2 + s];
    out[3] = data[3 + s];
    return;
  }

  if (dotProduct > 1) {
    dotProduct = 0.999;
  } else if (dotProduct < -1) {
    dotProduct = -0.999;
  }

  let theta = Math.acos(dotProduct);
  const sinTheta = Math.sin(theta);

  let s2: number;
  if (dotProduct < 0.0) {
    dotProduct *= -1;
    theta = Math.acos(dotProduct);
    s2 = (-1 * Math.sin(theta * ratio)) / sinTheta;
  } else {
    s2 = Math.sin(theta * ratio) / sinTheta;
  }
  const s1 = Math.sin(theta * (1.0 - ratio)) / sinTheta;

  out[0] = data[0 + s] * s1 + data[0 + a] * s2;
  out[1] = data[1 + s] * s1 + data[1 + a] * s2;
  out[2] = data[2 + s] * s1 + data[2 + a] * s2;
  out[3] = data[3 + s] * s1 + data[3 + a] * s2;
}

/**
 * Performs linear interpolation into an existing array.
 * The arithmetic order matches the `array*_lerp_offsetAsComposition` helpers.
 */
function __lerpTo(
  data_: Float32Array | number[],
  ratio: number,
  animationAttributeIndex: Index,
  i: Index,
  outputComponentN: number,
  out: WritableNumberArray
): void {
  const data = data_ as globalThis.Float32Array;
  if (animationAttributeIndex === AnimationAttribute.Quaternion.index) {
    __qlerpTo(data, ratio, i, i + 1, out);
    return;
  }
  if (
    animationAttributeIndex === AnimationAttribute.Weights.index ||
    animationAttributeIndex === AnimationAttribute.VectorN.index
  ) {
    for (let c = 0; c < outputComponentN; c++) {
      out[c] = data[i * outputComponentN + c] * (1 - ratio) + data[(i + 1) * outputComponentN + c] * ratio;
    }
    return;
  }
  if (
    animationAttributeIndex === AnimationAttribute.Translate.index ||
    animationAttributeIndex === AnimationAttribute.Scale.index ||
    animationAttributeIndex === AnimationAttribute.Vector3.index
  ) {
    for (let c = 0; c < 3; c++) {
      out[c] = data[i * 3 + c] * (1 - ratio) + data[(i + 1) * 3 + c] * ratio;
    }
    return;
  }
  if (animationAttributeIndex === AnimationAttribute.Vector2.index) {
    for (let c = 0; c < 2; c++) {
      out[c] = data[i * 2 + c] * (1 - ratio) + data[(i + 1) * 2 + c] * ratio;
    }
    return;
  }
  if (animationAttributeIndex === AnimationAttribute.Vector4.index) {
    for (let c = 0; c < 4; c++) {
      out[c] = data[i * 4 + c] * (1 - ratio) + data[(i + 1) * 4 + c] * ratio;
    }
    return;
  }
  if (animationAttributeIndex === AnimationAttribute.Scalar.index) {
    out[0] = data[i] * (1 - ratio) + data[i + 1] * ratio;
    return;
  }
  throw new Error('non supported type');
}

/**
 * Copies the output value at a keyframe into an existing array.
 */
function __copyOutputValueTo(
  keyFrameId: Index,
  sampler: AnimationSampler,
  outputArray: Float32Array | number[],
  out: WritableNumberArray
): void {
  const value = __getOutputValue(keyFrameId, sampler, outputArray);
  for (let i = 0; i < value.length; i++) {
    out[i] = value[i];
  }
}

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
export function __interpolateTo(
  sampler: AnimationSampler,
  currentTime: number,
  animationAttributeIndex: Index,
  out: WritableNumberArray,
  cursor?: KeyframeCursor
): void {
  const inputArray = sampler.input;
  const outputArray = sampler.output;
  const method = sampler.interpolationMethod ?? AnimationInterpolation.Linear;

  // out of range
  if (currentTime <= inputArray[0]) {
    __copyOutputValueTo(0, sampler, outputArray, out);
    return;
  }
  if (inputArray[inputArray.length - 1] <= currentTime) {
    __copyOutputValueTo(inputArray.length - 1, sampler, outputArray, out);
    return;
  }

  if (method === AnimationInterpolation.CubicSpline) {
    // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#appendix-c-spline-interpolation
    const i = __findKeyframe(inputArray, currentTime, cursor);
    const t_diff = inputArray[i + 1] - inputArray[i]; // t_(k+1) - t_k
    const t = (currentTime - inputArray[i]) / t_diff;
    const { p_0, p_1, m_0, m_1 } = __prepareVariablesForCubicSpline(outputArray, i, sampler.outputComponentN, t_diff);
    if (animationAttributeIndex === AnimationAttribute.Quaternion.index) {
      __cubicSplineTo(p_0, p_1, m_0, m_1, t, __cubicSplineQuaternionScratch);
      const length = Math.hypot(
        __cubicSplineQuaternionScratch[0],
        __cubicSplineQuaternionScratch[1],
        __cubicSplineQuaternionScratch[2],
        __cubicSplineQuaternionScratch[3]
      );
      out[0] = __cubicSplineQuaternionScratch[0] / length;
      out[1] = __cubicSplineQuaternionScratch[1] / length;
      out[2] = __cubicSplineQuaternionScratch[2] / length;
      out[3] = __cubicSplineQuaternionScratch[3] / length;
    } else {
      __cubicSplineTo(p_0, p_1, m_0, m_1, t, out);
    }
    return;
  }
  if (method === AnimationInterpolation.Linear) {
    const i = __findKeyframe(inputArray, currentTime, cursor);
    const ratio = (currentTime - inputArray[i]) / (inputArray[i + 1] - inputArray[i]);
    __lerpTo(outputArray, ratio, animationAttributeIndex, i, sampler.outputComponentN, out);
    return;
  }
  if (method === AnimationInterpolation.Step) {
    const i = __findKeyframe(inputArray, currentTime, cursor);
    if (i >= 0 && i < inputArray.length - 1) {
      __copyOutputValueTo(i, sampler, outputArray, out);
      return;
    }
    __copyOutputValueTo(inputArray.length - 1, sampler, outputArray, out);
    return;
  }
}

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
export function __interpolate(
  sampler: AnimationSampler,
  currentTime: number,
  animationAttributeIndex: Index,
  cursor?: KeyframeCursor
): Array<number> {
  const ret = new Array<number>(sampler.outputComponentN);
  __interpolateTo(sampler, currentTime, animationAttributeIndex, ret, cursor);
  return ret;
}
