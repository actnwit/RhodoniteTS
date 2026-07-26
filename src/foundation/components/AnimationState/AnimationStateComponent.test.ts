import { expect, test, vi } from 'vitest';
import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { AnimationStateComponent } from './AnimationStateComponent';

function createAnimationStateFixture() {
  const animation = {
    setActiveAnimationTrack: vi.fn(),
    setSecondActiveAnimationTrack: vi.fn(),
    setAnimationBlendingRatio: vi.fn(),
  };
  const rootEntity = {
    tryToGetAnimation: () => animation,
    children: [],
  } as unknown as ISceneGraphEntity;
  const animationState = Object.create(AnimationStateComponent.prototype) as AnimationStateComponent;
  Object.defineProperty(animationState, 'entity', { value: rootEntity });

  return { animation, animationState };
}

test('preparing a second track does not change the next transition source', () => {
  const { animation, animationState } = createAnimationStateFixture();
  animationState.setFirstActiveAnimationTrack('Idle');
  animationState.setSecondActiveAnimationTrack('Run');
  animation.setActiveAnimationTrack.mockClear();

  animationState.forceTransitionTo('Jump', 1);

  expect(animation.setActiveAnimationTrack).toHaveBeenCalledWith('Idle');
});

test('replacing a prepared second track does not change the current track', () => {
  const { animation, animationState } = createAnimationStateFixture();
  animationState.setFirstActiveAnimationTrack('Idle');
  animationState.setSecondActiveAnimationTrack('Run');
  animationState.replaceSecondActiveAnimationTrack('Run', 'Sprint');
  animation.setActiveAnimationTrack.mockClear();

  animationState.forceTransitionTo('Jump', 1);

  expect(animation.setActiveAnimationTrack).toHaveBeenCalledWith('Idle');
});

test('replacing the current blend target updates the next transition source', () => {
  const { animation, animationState } = createAnimationStateFixture();
  animationState.setFirstActiveAnimationTrack('Idle');
  animationState.forceTransitionTo('Run', 1);
  animationState.replaceSecondActiveAnimationTrack('Run', 'Sprint');
  animation.setActiveAnimationTrack.mockClear();

  animationState.forceTransitionTo('Jump', 1);

  expect(animation.setActiveAnimationTrack).toHaveBeenCalledWith('Sprint');
});
