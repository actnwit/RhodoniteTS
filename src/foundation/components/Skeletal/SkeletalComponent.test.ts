import { expect, test } from 'vitest';
import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { SkeletalComponent } from './SkeletalComponent';

function createEntity(animation: object, children: ISceneGraphEntity[] = []) {
  return {
    tryToGetAnimation: () => animation,
    children: children.map(entity => ({ entity })),
  } as unknown as ISceneGraphEntity;
}

test('ignores an expression-only root animation when finding the skeletal cache hash', () => {
  const boneAnimation = {
    currentTrackFeatureHash: () => 202,
    getAnimationChannelsOfTrack: () => new Map([['quaternion', {}]]),
  };
  const boneEntity = createEntity(boneAnimation);
  const expressionAnimation = {
    currentTrackFeatureHash: () => 101,
    getAnimationChannelsOfTrack: () => new Map([['vrmExpression/happy', {}]]),
  };
  const rootEntity = createEntity(expressionAnimation, [boneEntity]);
  const skeletalComponent = Object.create(SkeletalComponent.prototype) as SkeletalComponent;

  expect((skeletalComponent as any).__findAnimationTrackFeatureHash(rootEntity)).toBe(202);
});
