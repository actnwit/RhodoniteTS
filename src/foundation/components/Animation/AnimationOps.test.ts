import { describe, expect, test } from 'vitest';
import type { AnimationSampler } from '../../../types/AnimationTypes';
import { AnimationAttribute } from '../../definitions/AnimationAttribute';
import { AnimationInterpolation } from '../../definitions/AnimationInterpolation';
import { __interpolate, __interpolateTo } from './AnimationOps';

function createSampler(
  input: number[],
  output: number[],
  outputComponentN: number,
  interpolationMethod: AnimationSampler['interpolationMethod']
): AnimationSampler {
  return {
    input: new Float32Array(input),
    output: new Float32Array(output),
    outputComponentN: outputComponentN as AnimationSampler['outputComponentN'],
    interpolationMethod,
  };
}

/**
 * Builds a two-keyframe CUBICSPLINE sampler for a 3-component attribute.
 * Layout per keyframe: inTangent (3), value (3), outTangent (3).
 */
function createCubicSplineSampler3(): AnimationSampler {
  return createSampler(
    [0, 1],
    [
      // keyframe 0: a = (0,0,0), v = (0,0,0), b = (1,0,0)
      0, 0, 0, 0, 0, 0, 1, 0, 0,
      // keyframe 1: a = (2,0,0), v = (10,0,0), b = (0,0,0)
      2, 0, 0, 10, 0, 0, 0, 0, 0,
    ],
    3,
    AnimationInterpolation.CubicSpline
  );
}

describe('__interpolate', () => {
  test('CubicSpline evaluates Hermite interpolation without mutating the sampler output', () => {
    const sampler = createCubicSplineSampler3();
    const outputBefore = Array.from(sampler.output);

    // h00*p0 + h10*m0 + h01*p1 + h11*m1 with p0=0, p1=10, m0=1, m1=2, t=0.5
    expect(__interpolate(sampler, 0.5, AnimationAttribute.Translate.index)).toEqual([4.875, 0, 0]);
    expect(Array.from(sampler.output)).toEqual(outputBefore);

    // Repeated evaluation at the same time must be stable.
    expect(__interpolate(sampler, 0.5, AnimationAttribute.Translate.index)).toEqual([4.875, 0, 0]);
    expect(Array.from(sampler.output)).toEqual(outputBefore);
  });

  test('CubicSpline evaluates each segment with its own tangents', () => {
    const sampler = createSampler(
      [0, 1, 2],
      [
        // keyframe 0
        0, 0, 0, 0, 0, 0, 1, 0, 0,
        // keyframe 1
        2, 0, 0, 10, 0, 0, 3, 0, 0,
        // keyframe 2
        4, 0, 0, 20, 0, 0, 0, 0, 0,
      ],
      3,
      AnimationInterpolation.CubicSpline
    );

    // Segment [1, 2]: p0=10, p1=20, m0=3, m1=4, t=0.5
    // 0.5*10 + 0.125*3 + 0.5*20 + (-0.125)*4 = 5 + 0.375 + 10 - 0.5 = 14.875
    expect(__interpolate(sampler, 1.5, AnimationAttribute.Translate.index)).toEqual([14.875, 0, 0]);
  });

  test('CubicSpline scales tangents by the keyframe time difference', () => {
    const sampler = createSampler(
      [0, 2],
      [
        // keyframe 0: a = 0, v = 0, b = (1,0,0)
        0, 0, 0, 0, 0, 0, 1, 0, 0,
        // keyframe 1: a = (2,0,0), v = (10,0,0), b = 0
        2, 0, 0, 10, 0, 0, 0, 0, 0,
      ],
      3,
      AnimationInterpolation.CubicSpline
    );

    // t_diff = 2, so m0 = 2 and m1 = 4 at the segment midpoint:
    // 0.5*0 + 0.125*2 + 0.5*10 + (-0.125)*4 = 4.75
    expect(__interpolate(sampler, 1, AnimationAttribute.Translate.index)).toEqual([4.75, 0, 0]);
    expect(Array.from(sampler.output)).toEqual([0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 10, 0, 0, 0, 0, 0]);
  });

  test('CubicSpline clamps out of range times to the end keyframe values', () => {
    const sampler = createCubicSplineSampler3();
    expect(__interpolate(sampler, -1, AnimationAttribute.Translate.index)).toEqual([0, 0, 0]);
    expect(__interpolate(sampler, 2, AnimationAttribute.Translate.index)).toEqual([10, 0, 0]);
  });

  test('CubicSpline normalizes quaternion results', () => {
    const sampler = createSampler(
      [0, 1],
      [
        // keyframe 0: a = 0, v = (0,0,0,2), b = 0
        0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0,
        // keyframe 1: a = 0, v = (0,0,0,2), b = 0
        0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0,
      ],
      4,
      AnimationInterpolation.CubicSpline
    );

    const value = __interpolate(sampler, 0.5, AnimationAttribute.Quaternion.index);
    expect(value[0]).toBeCloseTo(0);
    expect(value[1]).toBeCloseTo(0);
    expect(value[2]).toBeCloseTo(0);
    expect(value[3]).toBeCloseTo(1);
  });

  test('Linear interpolates between two keyframes', () => {
    const sampler = createSampler([0, 1], [0, 0, 0, 10, 20, 30], 3, AnimationInterpolation.Linear);
    expect(__interpolate(sampler, 0.5, AnimationAttribute.Translate.index)).toEqual([5, 10, 15]);
  });

  test('__interpolateTo writes only the sampled components', () => {
    const sampler = createSampler([0, 1], [0, 0, 0, 10, 20, 30], 3, AnimationInterpolation.Linear);
    const out = new Float64Array([9, 9, 9, 9, 9, 9]);
    __interpolateTo(sampler, 0.5, AnimationAttribute.Translate.index, out);
    expect(Array.from(out)).toEqual([5, 10, 15, 9, 9, 9]);
  });

  test('Step holds the previous keyframe value', () => {
    const sampler = createSampler([0, 1], [1, 2, 3, 4, 5, 6], 3, AnimationInterpolation.Step);
    expect(__interpolate(sampler, 0, AnimationAttribute.Translate.index)).toEqual([1, 2, 3]);
    expect(__interpolate(sampler, 0.5, AnimationAttribute.Translate.index)).toEqual([1, 2, 3]);
    expect(__interpolate(sampler, 0.999, AnimationAttribute.Translate.index)).toEqual([1, 2, 3]);
    expect(__interpolate(sampler, 1, AnimationAttribute.Translate.index)).toEqual([4, 5, 6]);
  });

  test('cursor-based keyframe search matches uncached search for linear interpolation', () => {
    const input: number[] = [];
    const output: number[] = [];
    for (let i = 0; i < 50; i++) {
      input.push(i * 0.1);
      output.push(i, i * 2, i * 3);
    }
    const sampler = createSampler(input, output, 3, AnimationInterpolation.Linear);
    const cursor = { i: -1 };
    const times: number[] = [];
    for (let t = 0.001; t < 4.9; t += 0.017) {
      times.push(t);
    }
    // Loop wrap and out-of-order jumps force the fallback path.
    times.push(0.05, 1.2, 4.0, 0.2);

    for (const t of times) {
      const withCursor = __interpolate(sampler, t, AnimationAttribute.Translate.index, cursor);
      const withoutCursor = __interpolate(sampler, t, AnimationAttribute.Translate.index);
      expect(withCursor).toEqual(withoutCursor);
    }
  });

  test('cursor-based keyframe search matches uncached search for step interpolation', () => {
    const input: number[] = [];
    const output: number[] = [];
    for (let i = 0; i < 20; i++) {
      input.push(i);
      output.push(i, i * 2, i * 3);
    }
    const sampler = createSampler(input, output, 3, AnimationInterpolation.Step);
    const cursor = { i: -1 };

    for (let t = 0.1; t < 19; t += 0.37) {
      const withCursor = __interpolate(sampler, t, AnimationAttribute.Translate.index, cursor);
      const withoutCursor = __interpolate(sampler, t, AnimationAttribute.Translate.index);
      expect(withCursor).toEqual(withoutCursor);
    }
    // Exact keyframe boundaries.
    for (let i = 1; i < 19; i++) {
      expect(__interpolate(sampler, i, AnimationAttribute.Translate.index, cursor)).toEqual([i, i * 2, i * 3]);
    }
  });
});
