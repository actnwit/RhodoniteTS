import { expect, test } from 'vitest';
import type { AnimationSampler, AnimationTrackName } from '../../../types/AnimationTypes';
import { AnimationInterpolation } from '../../definitions/AnimationInterpolation';
import { AnimatedQuaternion } from '../../math/AnimatedQuaternion';
import { AnimatedVector3 } from '../../math/AnimatedVector3';
import { AnimationComponent } from './AnimationComponent';

function createVector3Sampler(output: number[]): AnimationSampler {
  return {
    input: new Float32Array([0, 1]),
    output: new Float32Array(output),
    outputComponentN: 3,
    interpolationMethod: AnimationInterpolation.Linear,
  };
}

function createAnimatedVector3(output: number[]): AnimatedVector3 {
  const animated = new AnimatedVector3(
    new Map<AnimationTrackName, AnimationSampler>([['Clip' as AnimationTrackName, createVector3Sampler(output)]]),
    'Clip' as AnimationTrackName
  );
  animated.isLoop = false;
  return animated;
}

function createComponent(hasPhysics: boolean) {
  const component = Object.create(AnimationComponent.prototype) as any;
  Object.defineProperty(component, 'entity', {
    value: {
      getSceneGraph: () => ({ _hasPhysicsComponentInSubtree: hasPhysics }),
    },
    configurable: true,
  });
  return component;
}

function createTransform(calls: string[], position: number[], rotation: number[], scale: number[]) {
  return {
    localPositionInner: { _v: new Float32Array(position) },
    localRotationInner: { _v: new Float32Array(rotation) },
    localScaleInner: { _v: new Float32Array(scale) },
    set localPosition(_v: unknown) {
      calls.push('position');
    },
    set localRotation(_v: unknown) {
      calls.push('rotation');
    },
    set localScale(_v: unknown) {
      calls.push('scale');
    },
  };
}

function createChannel(animatedValue: unknown) {
  return { animatedValue, target: { pathName: 'translate', entity: null } };
}

const applyTransform = (AnimationComponent.prototype as any).__applyTransformAnimation;

test('skips writing a position that already matches the animated value', () => {
  const animated = createAnimatedVector3([0, 0, 0, 10, 20, 30]);
  animated.setTimeAndBlendingRatio(0.5, 0);
  const calls: string[] = [];
  const transform = createTransform(calls, [5, 10, 15], [0, 0, 0, 1], [1, 1, 1]);

  applyTransform.call(createComponent(false), 'translate', createChannel(animated), transform, true);

  expect(calls).toEqual([]);
});

test('writes a position when the animated value changed', () => {
  const animated = createAnimatedVector3([0, 0, 0, 10, 20, 30]);
  animated.setTimeAndBlendingRatio(0.75, 0);
  const calls: string[] = [];
  const transform = createTransform(calls, [5, 10, 15], [0, 0, 0, 1], [1, 1, 1]);

  applyTransform.call(createComponent(false), 'translate', createChannel(animated), transform, true);

  expect(calls).toEqual(['position']);
});

test('restores the animated value after an external transform edit', () => {
  const animated = createAnimatedVector3([0, 0, 0, 10, 20, 30]);
  animated.setTimeAndBlendingRatio(0.5, 0);
  const calls: string[] = [];
  const transform = createTransform(calls, [0, 0, 0], [0, 0, 0, 1], [1, 1, 1]);

  applyTransform.call(createComponent(false), 'translate', createChannel(animated), transform, true);

  expect(calls).toEqual(['position']);
});

test('always writes in physics subtrees because setters notify the physics strategy', () => {
  const animated = createAnimatedVector3([0, 0, 0, 10, 20, 30]);
  animated.setTimeAndBlendingRatio(0.5, 0);
  const calls: string[] = [];
  const transform = createTransform(calls, [5, 10, 15], [0, 0, 0, 1], [1, 1, 1]);

  applyTransform.call(createComponent(true), 'translate', createChannel(animated), transform, false);

  expect(calls).toEqual(['position']);
});

test('skips identical quaternion and scale writes', () => {
  const sampler: AnimationSampler = {
    input: new Float32Array([0, 1]),
    output: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1]),
    outputComponentN: 4,
    interpolationMethod: AnimationInterpolation.Linear,
  };
  const quaternion = new AnimatedQuaternion(
    new Map<AnimationTrackName, AnimationSampler>([['Clip' as AnimationTrackName, sampler]]),
    'Clip' as AnimationTrackName
  );
  quaternion.isLoop = false;
  quaternion.setTimeAndBlendingRatio(0.5, 0);

  const scale = createAnimatedVector3([1, 1, 1, 1, 1, 1]);
  scale.setTimeAndBlendingRatio(0.5, 0);

  const calls: string[] = [];
  const transform = createTransform(calls, [5, 10, 15], [0, 0, 0, 1], [1, 1, 1]);
  const component = createComponent(false);

  applyTransform.call(component, 'quaternion', createChannel(quaternion), transform, true);
  applyTransform.call(component, 'scale', createChannel(scale), transform, true);

  expect(calls).toEqual([]);
});
