import { afterEach, expect, test } from 'vitest';
import type { Engine } from '../../system/Engine';
import { AnimationStateRepository } from './AnimationStateRepository';

const engines: Engine[] = [];

function createEngine(): Engine {
  const engine = {} as Engine;
  engines.push(engine);
  return engine;
}

afterEach(() => {
  for (const engine of engines) {
    AnimationStateRepository._cleanupForEngine(engine);
  }
  engines.length = 0;
});

test('uses an Engine.process frame token independently from global animation time', () => {
  const engine = createEngine();
  AnimationStateRepository.setGlobalTime(engine, 0);

  const firstToken = AnimationStateRepository.beginProcessFrame(engine);
  const secondToken = AnimationStateRepository.beginProcessFrame(engine);

  expect(secondToken).not.toBe(firstToken);
  expect(AnimationStateRepository.getGlobalTime(engine)).toBe(0);
  expect(AnimationStateRepository.getProcessFrameToken(engine)).toBe(secondToken);
});

test('swaps cached follower joints for every process frame even when global animation time is unchanged', () => {
  const engine = createEngine();
  AnimationStateRepository.setGlobalTime(engine, 0);
  const firstToken = AnimationStateRepository.beginProcessFrame(engine);

  expect(AnimationStateRepository.handleFrameTransitionIfNeeded(engine, firstToken)).toBe(true);
  AnimationStateRepository.getOrCreateCurrentFrameCachedEntityUIDs(engine).add(42);
  expect(AnimationStateRepository.handleFrameTransitionIfNeeded(engine, firstToken)).toBe(false);

  const secondToken = AnimationStateRepository.beginProcessFrame(engine);
  expect(AnimationStateRepository.isEntityCached(42, engine)).toBe(true);
  expect(AnimationStateRepository.getOrCreatePreviousFrameCachedEntityUIDs(engine)).toEqual(new Set([42]));
  expect(AnimationStateRepository.getOrCreateCurrentFrameCachedEntityUIDs(engine)).toEqual(new Set());
  expect(AnimationStateRepository.getLastCacheFrameToken(engine)).toBe(secondToken);
});

test('does not reuse process frame tokens across engines', () => {
  const firstEngine = createEngine();
  const secondEngine = createEngine();

  const firstToken = AnimationStateRepository.beginProcessFrame(firstEngine);
  const secondToken = AnimationStateRepository.beginProcessFrame(secondEngine);

  expect(secondToken).not.toBe(firstToken);
});

test('registers joints of culled skeletons for early return, excluding leader joints', () => {
  const engine = createEngine();
  const firstToken = AnimationStateRepository.beginProcessFrame(engine);
  AnimationStateRepository.handleFrameTransitionIfNeeded(engine, firstToken);

  // A visible leader computed skinning for 'skin' with joints 10 (jointIndex 0) and 11 (jointIndex 1)
  AnimationStateRepository.getOrCreateCacheLeaders(engine).set('skin', 1);
  const leaderJoints = AnimationStateRepository.getOrCreateLeaderJointIndexToEntityUID(engine);
  leaderJoints.set(0, 10);
  leaderJoints.set(1, 11);

  // Culled skeleton of another model (different joint entities)
  AnimationStateRepository.addCulledSkeletonJoints(engine, 'skin', [
    { jointIndex: 0, entityUID: 20 },
    { jointIndex: 1, entityUID: 21 },
  ]);
  // Culled skeleton sharing joints with the leader (e.g. Face mesh of the leader model)
  AnimationStateRepository.addCulledSkeletonJoints(engine, 'skin', [
    { jointIndex: 0, entityUID: 10 },
    { jointIndex: 1, entityUID: 11 },
  ]);
  // Culled skeleton whose cache key had no leader in this frame
  AnimationStateRepository.addCulledSkeletonJoints(engine, 'other', [{ jointIndex: 0, entityUID: 30 }]);

  AnimationStateRepository.beginProcessFrame(engine);
  expect(AnimationStateRepository.isEntityCached(20, engine)).toBe(true);
  expect(AnimationStateRepository.isEntityCached(21, engine)).toBe(true);
  expect(AnimationStateRepository.isEntityCached(10, engine)).toBe(false);
  expect(AnimationStateRepository.isEntityCached(11, engine)).toBe(false);
  expect(AnimationStateRepository.isEntityCached(30, engine)).toBe(false);

  // Pending culled joints are consumed by the transition and do not leak into later frames
  AnimationStateRepository.beginProcessFrame(engine);
  expect(AnimationStateRepository.isEntityCached(20, engine)).toBe(false);
});

test('increments the animation binding version when bindings change', () => {
  const before = AnimationStateRepository.getAnimationBindingVersion();
  AnimationStateRepository.markAnimationBindingChanged();
  expect(AnimationStateRepository.getAnimationBindingVersion()).toBe(before + 1);
});
