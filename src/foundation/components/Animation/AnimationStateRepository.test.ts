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
