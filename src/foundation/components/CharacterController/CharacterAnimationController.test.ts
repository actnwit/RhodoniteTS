import { afterEach, expect, test, vi } from 'vitest';
import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { Vector3 } from '../../math';
import type { CharacterMotionState } from '../../physics/CharacterControllerStrategy';
import { AnimationComponent } from '../Animation/AnimationComponent';
import { CharacterAnimationController } from './CharacterAnimationController';
import type { CharacterControllerComponent } from './CharacterControllerComponent';

const createMotion = (state: CharacterMotionState['state'], horizontalSpeed = 0): CharacterMotionState => ({
  state,
  velocity: Vector3.zero(),
  horizontalSpeed,
  verticalSpeed: 0,
  groundedDuration: 0,
  airborneDuration: 0,
  stateElapsedTime: 0,
  landingImpactSpeed: 0,
});

afterEach(() => vi.restoreAllMocks());

test('selects semantics safely when the character has no animation tracks', () => {
  const characterState: { motionState: CharacterMotionState } = { motionState: createMotion('grounded') };
  const character = characterState as CharacterControllerComponent;
  const root = {
    tryToGetAnimation: () => undefined,
    tryToGetAnimationState: () => undefined,
    children: [],
    engine: {},
  } as unknown as ISceneGraphEntity;
  const controller = new CharacterAnimationController(character, root);

  controller.update(0.1);
  expect(controller.selection).toMatchObject({ semantic: 'idle', hasTrack: false, activeTrack: undefined });
  characterState.motionState = createMotion('rising');
  controller.update(0.1);
  expect(controller.selection).toMatchObject({ semantic: 'jump', requestedTrack: 'Jump', hasTrack: false });
});

test('resolves tracks, speed, transitions, fallback, and landing one-shot', () => {
  const calls = {
    first: [] as string[],
    transitions: [] as Array<[string, number]>,
    loop: [] as boolean[],
    time: [] as number[],
  };
  const animationState = {
    setUseGlobalTime: vi.fn(),
    setFirstActiveAnimationTrack: (track: string) => calls.first.push(track),
    forceTransitionTo: (track: string, duration: number) => calls.transitions.push([track, duration]),
    setIsLoop: (value: boolean) => calls.loop.push(value),
    setTime: (value: number) => calls.time.push(value),
  };
  const child = {
    tryToGetAnimation: () => ({ getAnimationTrackNames: () => ['IDLE', 'Walk', 'Landing'] }),
    children: [],
  };
  const engine = {};
  const root = {
    tryToGetAnimation: () => undefined,
    tryToGetAnimationState: () => animationState,
    children: [{ entity: child }],
    engine,
  } as unknown as ISceneGraphEntity;
  vi.spyOn(AnimationComponent, 'getAnimationInfo').mockReturnValue(
    new Map([
      ['IDLE', { name: 'IDLE', minStartInputTime: 0, maxEndInputTime: 2 }],
      ['Walk', { name: 'Walk', minStartInputTime: 0, maxEndInputTime: 1 }],
      ['Landing', { name: 'Landing', minStartInputTime: 0, maxEndInputTime: 0.5 }],
    ])
  );
  const characterState: { motionState: CharacterMotionState } = { motionState: createMotion('grounded') };
  const character = characterState as CharacterControllerComponent;
  const controller = new CharacterAnimationController(character, root, {}, { crossFadeDuration: 0.2 });

  controller.update(0.1);
  expect(controller.selection).toMatchObject({ semantic: 'idle', activeTrack: 'IDLE', isFallback: false });
  expect(calls.first).toEqual(['IDLE']);

  characterState.motionState = createMotion('grounded', 4.4);
  controller.update(0.1);
  expect(controller.selection).toMatchObject({ semantic: 'walk', activeTrack: 'Walk', playbackSpeed: 1.5 });
  expect(calls.transitions.at(-1)).toEqual(['Walk', 0.2]);

  characterState.motionState = createMotion('rising');
  controller.update(0.1);
  expect(controller.selection).toMatchObject({ semantic: 'jump', activeTrack: 'IDLE', isFallback: true });

  characterState.motionState = createMotion('landing');
  controller.update(0.1);
  expect(controller.selection).toMatchObject({ semantic: 'landing', activeTrack: 'Landing', isOneShotPlaying: true });
  characterState.motionState = createMotion('grounded');
  controller.update(0.2);
  expect(controller.selection.semantic).toBe('landing');
  controller.update(0.3);
  expect(controller.selection.semantic).toBe('idle');
});

test('validates time and speed options', () => {
  const character = { motionState: createMotion('falling') } as CharacterControllerComponent;
  const root = {
    tryToGetAnimation: () => undefined,
    tryToGetAnimationState: () => undefined,
    children: [],
    engine: {},
  } as unknown as ISceneGraphEntity;
  expect(() => new CharacterAnimationController(character, root, {}, { referenceWalkSpeed: 0 })).toThrow(
    'speed settings'
  );
  const controller = new CharacterAnimationController(character, root);
  expect(() => controller.update(-1)).toThrow('deltaTime');
});
