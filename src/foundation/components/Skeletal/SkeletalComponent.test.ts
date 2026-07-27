import { expect, test } from 'vitest';
import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
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
    getActiveAnimationTrack: () => activeTrackName,
    getAnimationChannelsOfTrack: () =>
      new Map(
        channels.map(([pathName, trackNames]) => [pathName, { animatedValue: { getAllTrackNames: () => trackNames } }])
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
