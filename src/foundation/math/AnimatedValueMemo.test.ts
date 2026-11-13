import { beforeEach, describe, expect, test } from 'vitest';
import type { AnimationSampler, AnimationSamplers, AnimationTrackName } from '../../types/AnimationTypes';
import { AnimationInterpolation } from '../definitions/AnimationInterpolation';
import { AnimatedVector3 } from './AnimatedVector3';

function createSampler(output: number[]): AnimationSampler {
  return {
    input: new Float32Array([0, 1]),
    output: new Float32Array(output),
    outputComponentN: 3,
    interpolationMethod: AnimationInterpolation.Linear,
  };
}

describe('AnimatedValue evaluation memoization', () => {
  let samplers: AnimationSamplers;
  let animated: AnimatedVector3;

  beforeEach(() => {
    samplers = new Map<AnimationTrackName, AnimationSampler>();
    samplers.set('A' as AnimationTrackName, createSampler([0, 0, 0, 10, 20, 30]));
    samplers.set('B' as AnimationTrackName, createSampler([100, 100, 100, 200, 200, 200]));
    animated = new AnimatedVector3(samplers, 'A' as AnimationTrackName);
    animated.isLoop = false;
  });

  test('evaluates once when time and ratio are unchanged', () => {
    animated.setTimeAndBlendingRatio(0.5, 0);
    expect(animated.getEvaluationCount()).toBe(1);
    expect(Array.from(animated.getValueArray())).toEqual([5, 10, 15]);

    animated.setTimeAndBlendingRatio(0.5, 0);
    expect(animated.getEvaluationCount()).toBe(1);

    animated.update();
    expect(animated.getEvaluationCount()).toBe(1);
  });

  test('re-evaluates when the time changes', () => {
    animated.setTimeAndBlendingRatio(0.5, 0);
    animated.setTimeAndBlendingRatio(0.75, 0);
    expect(animated.getEvaluationCount()).toBe(2);
    expect(Array.from(animated.getValueArray())).toEqual([7.5, 15, 22.5]);
  });

  test('ignores ratio changes while no second sampler is bound', () => {
    animated.setTimeAndBlendingRatio(0.5, 0);
    animated.setTimeAndBlendingRatio(0.5, 1);
    expect(animated.getEvaluationCount()).toBe(1);
    expect(Array.from(animated.getValueArray())).toEqual([5, 10, 15]);
  });

  test('re-evaluates ratio changes when a second sampler is bound', () => {
    animated.setSecondActiveAnimationTrackName('B' as AnimationTrackName);
    animated.setTimeAndBlendingRatio(0.5, 0);
    const first = Array.from(animated.getValueArray());
    expect(first).toEqual([5, 10, 15]);

    animated.setTimeAndBlendingRatio(0.5, 1);
    expect(animated.getEvaluationCount()).toBe(2);
    expect(Array.from(animated.getValueArray())).toEqual([150, 150, 150]);

    animated.setTimeAndBlendingRatio(0.5, 0.5);
    expect(animated.getEvaluationCount()).toBe(3);
    expect(Array.from(animated.getValueArray())).toEqual([77.5, 80, 82.5]);
  });

  test('a new sampler binding invalidates the memo', () => {
    animated.setTimeAndBlendingRatio(0.5, 0);
    expect(animated.getEvaluationCount()).toBe(1);

    animated.setAnimationSampler('A' as AnimationTrackName, createSampler([0, 0, 0, 40, 40, 40]));
    animated.setTimeAndBlendingRatio(0.5, 0);
    expect(animated.getEvaluationCount()).toBe(2);
    expect(Array.from(animated.getValueArray())).toEqual([20, 20, 20]);
  });

  test('switching the first active track invalidates the memo', () => {
    animated.setTimeAndBlendingRatio(0.5, 0);
    animated.setFirstActiveAnimationTrackName('B' as AnimationTrackName);
    animated.setTimeAndBlendingRatio(0.5, 0);
    expect(animated.getEvaluationCount()).toBe(2);
    expect(Array.from(animated.getValueArray())).toEqual([150, 150, 150]);
  });

  test('adding a second sampler after an evaluation invalidates the memo', () => {
    animated.setTimeAndBlendingRatio(0.5, 0);
    expect(animated.getEvaluationCount()).toBe(1);

    animated.setSecondActiveAnimationTrackName('B' as AnimationTrackName);
    animated.setTimeAndBlendingRatio(0.5, 0);
    expect(animated.getEvaluationCount()).toBe(2);
    expect(Array.from(animated.getValueArray())).toEqual([5, 10, 15]);
  });

  test('loop wrapping reuses the memo for the same effective time', () => {
    animated.isLoop = true;
    animated.setTime(1.25);
    expect(animated.getEvaluationCount()).toBe(1);
    expect(Array.from(animated.getValueArray())).toEqual([2.5, 5, 7.5]);

    animated.setTime(0.25);
    expect(animated.getEvaluationCount()).toBe(1);
  });

  test('invalidateAnimationCache picks up direct sampler mutations', () => {
    animated.setTimeAndBlendingRatio(0.5, 0);
    expect(Array.from(animated.getValueArray())).toEqual([5, 10, 15]);

    const sampler = animated.getAnimationSampler('A' as AnimationTrackName);
    sampler.output[3] = 20;
    sampler.output[4] = 40;
    sampler.output[5] = 60;
    animated.update();
    // Still memoized: direct mutation is not observable until invalidated.
    expect(Array.from(animated.getValueArray())).toEqual([5, 10, 15]);

    animated.invalidateAnimationCache();
    animated.update();
    expect(Array.from(animated.getValueArray())).toEqual([10, 20, 30]);
  });

  test('setFloat32Array with the same array is a no-op', () => {
    animated.setTimeAndBlendingRatio(0.5, 0);
    const value = animated.getValueArray();
    animated.setFloat32Array(value as Float32Array);
    expect(animated.getEvaluationCount()).toBe(1);
  });
});
