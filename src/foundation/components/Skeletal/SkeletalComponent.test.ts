import { expect, test } from 'vitest';
import type { AnimationSampler } from '../../../types';
import { AnimationInterpolation } from '../../definitions/AnimationInterpolation';
import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { AnimatedQuaternion } from '../../math/AnimatedQuaternion';
import { SkeletalComponent } from './SkeletalComponent';

function createEntity(animation: object, children: ISceneGraphEntity[] = []) {
  return {
    tryToGetAnimation: () => animation,
    children: children.map(entity => ({ entity })),
  } as unknown as ISceneGraphEntity;
}

function createAnimation(hash: number, activeTrackName: string, channels: Array<[string, string[]]>) {
  return {
    currentTrackFeatureHash: () => hash,
    getAnimationTrackFeatureHash: (trackName: string) =>
      channels.some(([, trackNames]) => trackNames.includes(trackName)) ? hash : undefined,
    getActiveAnimationTrack: () => activeTrackName,
    getAnimationChannelsOfTrack: () =>
      new Map(
        channels.map(([pathName, trackNames]) => [
          pathName,
          {
            animatedValue: {
              getAllTrackNames: () => trackNames,
              getFirstActiveAnimationSamplerTrackName: () =>
                trackNames.includes(activeTrackName) ? activeTrackName : trackNames[0],
            },
          },
        ])
      ),
  };
}

test('ignores an expression-only root animation when finding the skeletal cache hash', () => {
  const boneAnimation = createAnimation(202, 'Body', [['quaternion', ['Body']]]);
  const boneEntity = createEntity(boneAnimation);
  const expressionAnimation = createAnimation(101, 'Face', [['vrmExpression/happy', ['Face']]]);
  const rootEntity = createEntity(expressionAnimation, [boneEntity]);
  const skeletalComponent = Object.create(SkeletalComponent.prototype) as SkeletalComponent;

  expect((skeletalComponent as any).__findAnimationTrackFeatureHash(rootEntity)).toBe(202);
});

test('ignores non-expression root channels that do not contain the active track', () => {
  const boneAnimation = createAnimation(202, 'Face', [['quaternion', ['Face']]]);
  const boneEntity = createEntity(boneAnimation);
  const expressionAnimation = createAnimation(101, 'Face', [
    ['vrmExpression/happy', ['Face']],
    ['translate', ['Body']],
  ]);
  const rootEntity = createEntity(expressionAnimation, [boneEntity]);
  const skeletalComponent = Object.create(SkeletalComponent.prototype) as SkeletalComponent;

  expect((skeletalComponent as any).__findAnimationTrackFeatureHash(rootEntity)).toBe(202);
});

test('uses the cached bone sampler hash when the requested expression-only track is missing', () => {
  const bodySampler: AnimationSampler = {
    input: new Float32Array([0, 1]),
    output: new Float32Array(8),
    outputComponentN: 4,
    interpolationMethod: AnimationInterpolation.Linear,
  };
  const boneAnimatedValue = new AnimatedQuaternion(new Map([['Body', bodySampler]]), 'Body');
  boneAnimatedValue.setFirstActiveAnimationTrackName('Face');
  const boneAnimation = {
    currentTrackFeatureHash: () => undefined,
    getAnimationTrackFeatureHash: (trackName: string) => (trackName === 'Body' ? 202 : undefined),
    getActiveAnimationTrack: () => boneAnimatedValue.getFirstActiveAnimationTrackName(),
    getAnimationChannelsOfTrack: () => new Map([['quaternion', { animatedValue: boneAnimatedValue }]]),
  };
  const boneEntity = createEntity(boneAnimation);
  const expressionAnimation = createAnimation(101, 'Face', [['vrmExpression/happy', ['Face']]]);
  const rootEntity = createEntity(expressionAnimation, [boneEntity]);
  const skeletalComponent = Object.create(SkeletalComponent.prototype) as SkeletalComponent;

  expect((skeletalComponent as any).__findAnimationTrackFeatureHash(rootEntity)).toBe(202);
});

test('combines an ancestor fallback hash with the active child bone track hash', () => {
  const runRoot = createEntity(createAnimation(101, 'Run', [['translate', ['Fallback']]]), [
    createEntity(createAnimation(202, 'Run', [['quaternion', ['Run']]])),
  ]);
  const walkRoot = createEntity(createAnimation(101, 'Walk', [['translate', ['Fallback']]]), [
    createEntity(createAnimation(303, 'Walk', [['quaternion', ['Walk']]])),
  ]);
  const skeletalComponent = Object.create(SkeletalComponent.prototype) as SkeletalComponent;

  const runHash = (skeletalComponent as any).__findAnimationTrackFeatureHash(runRoot);
  const walkHash = (skeletalComponent as any).__findAnimationTrackFeatureHash(walkRoot);

  expect(runHash).not.toBe(101);
  expect(walkHash).not.toBe(101);
  expect(runHash).not.toBe(walkHash);
});
