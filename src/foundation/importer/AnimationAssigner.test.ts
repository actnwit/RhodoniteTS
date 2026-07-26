import { afterEach, expect, test, vi } from 'vitest';
import type { AnimationPathName, AnimationSampler, RnM2, RnM2Vrma } from '../../types';
import { AnimationComponent } from '../components/Animation/AnimationComponent';
import { AnimationInterpolation } from '../definitions/AnimationInterpolation';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { AnimatedScalar } from '../math/AnimatedScalar';
import { AnimatedVector3 } from '../math/AnimatedVector3';
import { Quaternion } from '../math/Quaternion';
import { AnimationAssigner, type CharacterVrmaAnimationSet, type VrmaRootMotionPolicy } from './AnimationAssigner';
import { ModelConverter } from './ModelConverter';

const semantics = ['idle', 'walk', 'run', 'jump', 'fall', 'landing', 'slide'] as const;

type RetargetCall = [unknown, string | undefined, readonly AnimationPathName[] | undefined];

function createVrma(trackName = 'Clip'): RnM2Vrma {
  const sourceEntities = [{ tryToSetUniqueName: vi.fn() }, { tryToSetUniqueName: vi.fn() }];
  return {
    animations: [
      {
        name: trackName,
        samplers: [{ inputObject: {}, outputObject: {} }],
        channels: [
          { target: { node: 0, path: 'translation' } },
          { target: { node: 0, path: 'rotation' } },
          { target: { node: 1, path: 'rotation' } },
        ],
      },
    ],
    extensions: {
      VRMC_vrm_animation: {
        specVersion: '1.0',
        humanoid: { humanBones: { hips: { node: 0 }, spine: { node: 1 } } },
        humanoidBoneNameMap: new Map([
          [0, 'hips'],
          [1, 'spine'],
        ]),
      },
    },
    extras: { rnEntities: sourceEntities },
  } as unknown as RnM2Vrma;
}

function createCharacterVrmaSet(): CharacterVrmaAnimationSet {
  return Object.fromEntries(semantics.map(semantic => [semantic, createVrma()])) as CharacterVrmaAnimationSet;
}

function createExpressionVrma({
  input = new Float32Array([0, 1]),
  interpolation = 'CUBICSPLINE',
  output = new Float32Array([-1, 9, 9, 0.25, 9, 9, 2, 9, 9, -2, 9, 9, 1.5, 9, 9, 3, 9, 9]),
}: {
  input?: Float32Array;
  interpolation?: 'LINEAR' | 'STEP' | 'CUBICSPLINE';
  output?: Float32Array;
} = {}): RnM2Vrma {
  const samplerObject = {
    interpolation,
    inputObject: { extras: { typedDataArray: input } },
    outputObject: { extras: { typedDataArray: output } },
  };
  return {
    animations: [
      {
        name: 'Face',
        samplers: [samplerObject],
        channels: [{ samplerObject, target: { node: 2, path: 'translation' } }],
      },
    ],
    extensions: {
      VRMC_vrm_animation: {
        specVersion: '1.0',
        expressions: {
          preset: { happy: { node: 2 } },
          custom: { smirk: { node: 2 } },
        },
      },
    },
    extras: { rnEntities: [] },
  } as unknown as RnM2Vrma;
}

function createAssignerFixture({ version = '1.0' }: { version?: string } = {}) {
  const hipsRetarget = vi.fn((_retarget: unknown, postfix: string | undefined) => [`Clip${postfix ?? ''}`]);
  const spineRetarget = vi.fn((_retarget: unknown, postfix: string | undefined) => [`Clip${postfix ?? ''}`]);
  const hipsEntity = { getAnimation: () => ({ _setRetarget: hipsRetarget }) };
  const spineEntity = { getAnimation: () => ({ _setRetarget: spineRetarget }) };
  const animationState = { setFirstActiveAnimationTrack: vi.fn() };
  const root = {
    entityUID: 42,
    tryToGetVrm: () => ({ _version: version }),
    tryToGetAnimationState: () => animationState,
    tryToGetAnimation: () => undefined,
    getTagValue: (tag: string) => {
      if (tag === 'humanoid_map_name_nodeId') {
        return new Map([
          ['hips', 0],
          ['spine', 1],
        ]);
      }
      if (tag === 'rnEntities') {
        return [hipsEntity, spineEntity];
      }
      return undefined;
    },
    getTransform: () => ({ _restoreTransformFromRest: vi.fn() }),
    children: [],
  } as unknown as ISceneGraphEntity;
  const entityRepository = {
    addComponentToEntity: vi.fn((_component: unknown, entity: unknown) => entity),
    deleteEntityRecursively: vi.fn(),
  };
  const assigner = new AnimationAssigner({ entityRepository } as any);

  return { assigner, entityRepository, hipsRetarget, root, spineRetarget };
}

function createExpressionAssignerFixture(availableExpressions = new Set(['happy', 'smirk']), version = '1.0') {
  const animationChannels = new Map<AnimationPathName, any>();
  const setExpressionWeight = vi.fn();
  const setAnimation = vi.fn((pathName: AnimationPathName, animatedValue: any) => {
    const existingChannel = animationChannels.get(pathName);
    if (existingChannel == null) {
      animationChannels.set(pathName, {
        animatedValue,
        target: { pathName },
      });
      return;
    }
    for (const trackName of animatedValue.getAllTrackNames()) {
      existingChannel.animatedValue.setAnimationSampler(trackName, animatedValue.getAnimationSampler(trackName));
    }
  });
  const rootAnimation = {
    getAnimation: (pathName: AnimationPathName) => animationChannels.get(pathName)?.animatedValue,
    getAnimationChannelsOfTrack: () => animationChannels,
    getAnimationTrackNames: () =>
      Array.from(animationChannels.values()).flatMap(channel => channel.animatedValue.getAllTrackNames()),
    resetAnimationTracks: vi.fn(() => animationChannels.clear()),
    resetAnimationTrackByPostfix: vi.fn((postfix: string) => {
      for (const channel of animationChannels.values()) {
        for (const trackName of channel.animatedValue.getAllTrackNames()) {
          if (trackName.endsWith(postfix)) {
            channel.animatedValue.deleteAnimationSampler(trackName);
          }
        }
      }
    }),
    setActiveAnimationTrack: vi.fn((trackName: string) => {
      for (const channel of animationChannels.values()) {
        channel.animatedValue.setFirstActiveAnimationTrackName(trackName);
      }
    }),
    setSecondActiveAnimationTrack: vi.fn((trackName: string) => {
      for (const channel of animationChannels.values()) {
        channel.animatedValue.setSecondActiveAnimationTrackName(trackName);
      }
    }),
    setAnimation,
  };
  const setSecondActiveAnimationTrack = vi.fn((trackName: string) => {
    rootAnimation.setSecondActiveAnimationTrack(trackName);
  });
  const animationState = {
    setFirstActiveAnimationTrack: vi.fn((trackName: string) => {
      rootAnimation.setActiveAnimationTrack(trackName);
      for (const channel of animationChannels.values()) {
        channel.animatedValue.blendingRatio = 0;
      }
    }),
    setSecondActiveAnimationTrack,
    replaceSecondActiveAnimationTrack: vi.fn((_replacedTrackName: string, replacementTrackName: string) => {
      setSecondActiveAnimationTrack(replacementTrackName);
    }),
  };
  const rootVrm = {
    _version: version,
    getExpressionNames: () => Array.from(availableExpressions),
    getExpressionWeight: (name: string) => (availableExpressions.has(name) ? 0 : undefined),
    setExpressionWeight,
  };
  const root = {
    entityUID: 42,
    tryToGetVrm: () => rootVrm,
    tryToGetAnimationState: () => animationState,
    tryToGetAnimation: () => rootAnimation,
    getTransform: () => ({ _restoreTransformFromRest: vi.fn() }),
    children: [],
  } as unknown as ISceneGraphEntity;
  const entityRepository = {
    addComponentToEntity: vi.fn((_component: unknown, entity: unknown) => entity),
    deleteEntityRecursively: vi.fn(),
  };
  const assigner = new AnimationAssigner({ entityRepository } as any);
  return { animationState, assigner, entityRepository, root, rootAnimation, setAnimation, setExpressionWeight };
}

function mockModelConversion() {
  vi.spyOn(ModelConverter, 'convertToRhodoniteObjectSimple').mockReturnValue({ entityUID: 99 } as any);
  vi.spyOn(ModelConverter, '_readBinaryFromAccessorAndSetItToAccessorExtras').mockImplementation(() => {});
}

afterEach(() => vi.restoreAllMocks());

test('assigns a complete character VRMA set with root-scoped semantic tracks and in-place hips motion', () => {
  mockModelConversion();
  const { assigner, entityRepository, hipsRetarget, root, spineRetarget } = createAssignerFixture();

  const result = assigner.assignCharacterAnimationsWithVrma(root, createCharacterVrmaSet());

  for (const semantic of semantics) {
    const trackName = `Clip__character_42_${semantic}`;
    expect(result.mapping[semantic]).toEqual([trackName]);
    expect(result.trackNames[semantic]).toEqual([trackName]);
  }
  expect(hipsRetarget).toHaveBeenCalledTimes(semantics.length);
  expect(spineRetarget).toHaveBeenCalledTimes(semantics.length);
  for (const [, , excludedPathNames] of hipsRetarget.mock.calls as RetargetCall[]) {
    expect(excludedPathNames).toEqual(['translate']);
  }
  for (const [, , excludedPathNames] of spineRetarget.mock.calls as RetargetCall[]) {
    expect(excludedPathNames).toBeUndefined();
  }
  expect(entityRepository.deleteEntityRecursively).toHaveBeenCalledTimes(semantics.length);
});

test('preserves hips translation in the existing single-VRMA API unless explicitly disabled', () => {
  mockModelConversion();
  const { assigner, hipsRetarget, root } = createAssignerFixture();

  assigner.assignAnimationWithVrma(root, createVrma(), '__direct');
  expect(hipsRetarget).toHaveBeenLastCalledWith(expect.anything(), '__direct', undefined);

  assigner.assignAnimationWithVrma(root, createVrma(), '__in_place', {
    rootMotion: 'ignoreHipsTranslation' satisfies VrmaRootMotionPolicy,
  });
  expect(hipsRetarget).toHaveBeenLastCalledWith(expect.anything(), '__in_place', ['translate']);
});

test('allows an omitted slide VRMA and returns no slide mapping', () => {
  mockModelConversion();
  const { assigner, root } = createAssignerFixture();
  const vrmaSet: Partial<Record<(typeof semantics)[number], RnM2Vrma>> = { ...createCharacterVrmaSet() };
  vrmaSet.slide = undefined;

  const result = assigner.assignCharacterAnimationsWithVrma(root, vrmaSet);

  expect(result.mapping.slide).toBeUndefined();
  expect(result.trackNames.slide).toBeUndefined();
  expect(result.mapping.run).toEqual(['Clip__character_42_run']);
});

test('rejects an invalid character VRMA set before assigning any partial tracks', () => {
  mockModelConversion();
  const { assigner, root } = createAssignerFixture();
  const vrmaSet = createCharacterVrmaSet() as Record<(typeof semantics)[number], RnM2Vrma>;
  vrmaSet.fall = { ...createVrma(), animations: [] } as RnM2Vrma;

  expect(() => assigner.assignCharacterAnimationsWithVrma(root, vrmaSet)).toThrow(
    "Character VRMA animation 'fall' does not contain any animations."
  );
  expect(ModelConverter.convertToRhodoniteObjectSimple).not.toHaveBeenCalled();
});

test('rejects unsupported target VRM versions before converting a VRMA', () => {
  mockModelConversion();
  const { assigner, root } = createAssignerFixture({ version: 'unsupported' });

  expect(() => assigner.assignAnimationWithVrma(root, createVrma())).toThrow("Unsupported VRM version 'unsupported'");
  expect(ModelConverter.convertToRhodoniteObjectSimple).not.toHaveBeenCalled();
});

test('preserves manually controlled VRM expressions when assigning a regular glTF animation', () => {
  const { assigner, root, rootAnimation, setExpressionWeight } = createExpressionAssignerFixture();
  const gltfModel = {
    animations: [{ samplers: [], channels: [] }],
  } as unknown as RnM2;

  assigner.assignAnimation(root, gltfModel, {} as any, false, 'none');

  expect(setExpressionWeight).not.toHaveBeenCalled();
  expect(rootAnimation.resetAnimationTracks).toHaveBeenCalledTimes(1);
});

test('assigns preset and custom VRMA expressions as scalar root tracks', () => {
  mockModelConversion();
  const { assigner, entityRepository, root, setAnimation } = createExpressionAssignerFixture();
  const vrma = createExpressionVrma();

  const trackNames = assigner.assignAnimationWithVrma(root, vrma, '__expression');

  expect(trackNames).toEqual(['Face__expression']);
  expect(setAnimation.mock.calls.map(([pathName]) => pathName)).toEqual(['vrmExpression/happy', 'vrmExpression/smirk']);
  for (const [, animatedValue] of setAnimation.mock.calls) {
    const sampler = animatedValue.getAnimationSampler('Face__expression');
    expect(Array.from(sampler.input)).toEqual([0, 1]);
    expect(Array.from(sampler.output)).toEqual([-1, 0.25, 2, -2, 1.5, 3]);
    expect(sampler.outputComponentN).toBe(1);
    expect(sampler.interpolationMethod).toBe(AnimationInterpolation.CubicSpline);
  }
  expect(vrma.extensions.VRMC_vrm_animation.expressionNamesMap?.get(2)).toEqual([
    { name: 'happy', isPreset: true },
    { name: 'smirk', isPreset: false },
  ]);
  expect(entityRepository.deleteEntityRecursively).toHaveBeenCalledWith(99);
});

test.each([
  ['LINEAR', AnimationInterpolation.Linear],
  ['STEP', AnimationInterpolation.Step],
] as const)('preserves %s interpolation for VRMA expression tracks', (interpolation, expectedInterpolation) => {
  mockModelConversion();
  const { assigner, root, setAnimation } = createExpressionAssignerFixture(new Set(['happy']));
  const vrma = createExpressionVrma({
    interpolation,
    output: new Float32Array([-0.2, 9, 9, 1.2, 9, 9]),
  });

  assigner.assignAnimationWithVrma(root, vrma);

  const sampler = setAnimation.mock.calls[0][1].getAnimationSampler('Face');
  expect(Array.from(sampler.output)).toEqual(Array.from(new Float32Array([-0.2, 1.2])));
  expect(sampler.interpolationMethod).toBe(expectedInterpolation);
});

test.each([
  ['LINEAR', new Float32Array([0.75, 9, 9])],
  ['CUBICSPLINE', new Float32Array([0, 9, 9, 0.75, 9, 9, 0, 9, 9])],
] as const)('treats a zero-duration single-key %s expression track as a constant', (interpolation, output) => {
  mockModelConversion();
  const { assigner, root, rootAnimation } = createExpressionAssignerFixture(new Set(['happy']));
  const vrma = createExpressionVrma({
    input: new Float32Array([0]),
    interpolation,
    output,
  });
  vrma.extensions.VRMC_vrm_animation.expressions!.custom = undefined;

  assigner.assignAnimationWithVrma(root, vrma);

  const happyAnimation = rootAnimation.getAnimation('vrmExpression/happy');
  happyAnimation.setTime(10);
  expect(happyAnimation.x).toBeCloseTo(0.75);
});

test('uses the first track for every expression on the initial multi-animation VRMA assignment', () => {
  mockModelConversion();
  const { assigner, root, rootAnimation } = createExpressionAssignerFixture();
  const vrma = createExpressionVrma();
  vrma.animations[0].name = 'Happy';
  const smirkAnimation = createExpressionVrma().animations[0];
  smirkAnimation.name = 'Smirk';
  smirkAnimation.channels[0].target!.node = 3;
  vrma.animations.push(smirkAnimation);
  vrma.extensions.VRMC_vrm_animation.expressions = {
    preset: {
      happy: { node: 2 },
    },
    custom: {
      smirk: { node: 3 },
    },
  };

  assigner.assignAnimationWithVrma(root, vrma);

  expect(rootAnimation.getAnimation('vrmExpression/happy').getFirstActiveAnimationTrackName()).toBe('Happy');
  expect(rootAnimation.getAnimation('vrmExpression/smirk').getFirstActiveAnimationTrackName()).toBe('Happy');
});

test('fills missing expression channels with zero samplers across assigned VRMA tracks', () => {
  mockModelConversion();
  const { assigner, root, rootAnimation } = createExpressionAssignerFixture();
  const happyVrma = createExpressionVrma();
  happyVrma.animations[0].name = 'Happy';
  happyVrma.extensions.VRMC_vrm_animation.expressions!.custom = undefined;
  const smirkVrma = createExpressionVrma();
  smirkVrma.animations[0].name = 'Smirk';
  smirkVrma.extensions.VRMC_vrm_animation.expressions!.preset = undefined;

  assigner.assignAnimationWithVrma(root, happyVrma, '__happy');
  assigner.assignAnimationWithVrma(root, smirkVrma, '__smirk');

  const happyAnimation = rootAnimation.getAnimation('vrmExpression/happy');
  const smirkAnimation = rootAnimation.getAnimation('vrmExpression/smirk');
  expect(happyAnimation.getAllTrackNames()).toEqual(['Happy__happy', 'Smirk__smirk']);
  expect(smirkAnimation.getAllTrackNames()).toEqual(['Smirk__smirk', 'Happy__happy']);
  expect(Array.from(happyAnimation.getAnimationSampler('Smirk__smirk').output)).toEqual(new Array(6).fill(0));
  expect(Array.from(smirkAnimation.getAnimationSampler('Happy__happy').output)).toEqual(new Array(6).fill(0));
  expect(happyAnimation.getFirstActiveAnimationTrackName()).toBe('Happy__happy');
  expect(smirkAnimation.getFirstActiveAnimationTrackName()).toBe('Happy__happy');

  happyAnimation.setFirstActiveAnimationTrackName('Smirk__smirk');
  happyAnimation.setTime(0.5);
  expect(happyAnimation.x).toBe(0);
});

test('uses the full track time range for missing expression zero samplers', () => {
  const { assigner, root, rootAnimation } = createExpressionAssignerFixture();
  const shortBoneSampler: AnimationSampler = {
    input: new Float32Array([0, 0.5]),
    output: new Float32Array(6),
    outputComponentN: 3,
    interpolationMethod: AnimationInterpolation.Linear,
  };
  const faceSampler: AnimationSampler = {
    input: new Float32Array([0, 2]),
    output: new Float32Array([0, 1]),
    outputComponentN: 1,
    interpolationMethod: AnimationInterpolation.Linear,
  };
  const existingSmirkSampler: AnimationSampler = {
    input: new Float32Array([0, 2]),
    output: new Float32Array([0, 1]),
    outputComponentN: 1,
    interpolationMethod: AnimationInterpolation.Linear,
  };
  rootAnimation.setAnimation('translate', new AnimatedVector3(new Map([['Face', shortBoneSampler]]), 'Face'));
  rootAnimation.setAnimation('vrmExpression/happy', new AnimatedScalar(new Map([['Face', faceSampler]]), 'Face'));
  const smirkAnimation = new AnimatedScalar(new Map([['Existing', existingSmirkSampler]]), 'Existing');
  rootAnimation.setAnimation('vrmExpression/smirk', smirkAnimation);

  (assigner as any).__fillMissingVrmaExpressionTracks(root, 'Existing');

  expect(Array.from(smirkAnimation.getAnimationSampler('Face').input)).toEqual([0, 2]);
  smirkAnimation.setSecondActiveAnimationTrackName('Face');
  smirkAnimation.blendingRatio = 0.5;
  smirkAnimation.setTime(1.25);
  expect(smirkAnimation.x).toBeCloseTo(0.3125);
});

test.each([
  ['LINEAR', AnimationInterpolation.Linear, new Float32Array([0, 1])],
  ['STEP', AnimationInterpolation.Step, new Float32Array([0, 1])],
  ['CUBICSPLINE', AnimationInterpolation.CubicSpline, new Float32Array([0, 0, 2, 3, 1, 4])],
] as const)('extends an existing %s expression sampler to the full track duration', (_name, interpolation, output) => {
  const { assigner, root, rootAnimation } = createExpressionAssignerFixture();
  const boneSampler: AnimationSampler = {
    input: new Float32Array([0, 2]),
    output: new Float32Array(6),
    outputComponentN: 3,
    interpolationMethod: AnimationInterpolation.Linear,
  };
  const expressionSampler: AnimationSampler = {
    input: new Float32Array([0, 1]),
    output,
    outputComponentN: 1,
    interpolationMethod: interpolation,
  };
  rootAnimation.setAnimation('translate', new AnimatedVector3(new Map([['Face', boneSampler]]), 'Face'));
  const happyAnimation = new AnimatedScalar(new Map([['Face', expressionSampler]]), 'Face');
  rootAnimation.setAnimation('vrmExpression/happy', happyAnimation);

  (assigner as any).__fillMissingVrmaExpressionTracks(root, 'Face');

  expect(Array.from(happyAnimation.getAnimationSampler('Face').input)).toEqual([0, 1, 2]);
  happyAnimation.setTime(1.5);
  expect(happyAnimation.x).toBeCloseTo(1);
});

test('preserves blending state when adding a postfix track without removing the active track', () => {
  mockModelConversion();
  const { animationState, assigner, root, rootAnimation } = createExpressionAssignerFixture(new Set(['happy']));
  const existingVrma = createExpressionVrma();
  existingVrma.animations[0].name = 'Existing';
  existingVrma.extensions.VRMC_vrm_animation.expressions!.custom = undefined;
  const targetVrma = createExpressionVrma();
  targetVrma.animations[0].name = 'Target';
  targetVrma.extensions.VRMC_vrm_animation.expressions!.custom = undefined;
  const addedVrma = createExpressionVrma();
  addedVrma.animations[0].name = 'Added';
  addedVrma.extensions.VRMC_vrm_animation.expressions!.custom = undefined;

  assigner.assignAnimationWithVrma(root, existingVrma, '__existing');
  assigner.assignAnimationWithVrma(root, targetVrma, '__target');
  const happyAnimation = rootAnimation.getAnimation('vrmExpression/happy');
  happyAnimation.setSecondActiveAnimationTrackName('Target__target');
  happyAnimation.blendingRatio = 0.5;
  animationState.setFirstActiveAnimationTrack.mockClear();

  assigner.assignAnimationWithVrma(root, addedVrma, '__added');

  expect(animationState.setFirstActiveAnimationTrack).not.toHaveBeenCalled();
  expect(happyAnimation.getFirstActiveAnimationTrackName()).toBe('Existing__existing');
  expect(happyAnimation.getSecondActiveAnimationTrackName()).toBe('Target__target');
  expect(happyAnimation.blendingRatio).toBe(0.5);
});

test('rebinds the second active track when its postfix slot is replaced', () => {
  mockModelConversion();
  const { animationState, assigner, root, rootAnimation } = createExpressionAssignerFixture(new Set(['happy']));
  const firstVrma = createExpressionVrma({
    interpolation: 'LINEAR',
    output: new Float32Array([0, 9, 9, 0, 9, 9]),
  });
  firstVrma.animations[0].name = 'First';
  firstVrma.extensions.VRMC_vrm_animation.expressions!.custom = undefined;
  const oldTargetVrma = createExpressionVrma({
    interpolation: 'LINEAR',
    output: new Float32Array([1, 9, 9, 1, 9, 9]),
  });
  oldTargetVrma.animations[0].name = 'OldTarget';
  oldTargetVrma.extensions.VRMC_vrm_animation.expressions!.custom = undefined;
  const newTargetVrma = createExpressionVrma({
    interpolation: 'LINEAR',
    output: new Float32Array([0.2, 9, 9, 0.2, 9, 9]),
  });
  newTargetVrma.animations[0].name = 'NewTarget';
  newTargetVrma.extensions.VRMC_vrm_animation.expressions!.custom = undefined;

  assigner.assignAnimationWithVrma(root, firstVrma, '__first');
  assigner.assignAnimationWithVrma(root, oldTargetVrma, '__target');
  const happyAnimation = rootAnimation.getAnimation('vrmExpression/happy');
  happyAnimation.setSecondActiveAnimationTrackName('OldTarget__target');
  happyAnimation.blendingRatio = 0.5;
  animationState.setSecondActiveAnimationTrack.mockClear();

  assigner.assignAnimationWithVrma(root, newTargetVrma, '__target');

  expect(animationState.setSecondActiveAnimationTrack).toHaveBeenCalledWith('NewTarget__target');
  expect(animationState.replaceSecondActiveAnimationTrack).toHaveBeenCalledWith(
    'OldTarget__target',
    'NewTarget__target'
  );
  expect(happyAnimation.getSecondActiveAnimationTrackName()).toBe('NewTarget__target');
  expect(happyAnimation.blendingRatio).toBe(0.5);
  happyAnimation.setTime(0.5);
  expect(happyAnimation.x).toBeCloseTo(0.1);
});

test('falls back to the replacement track when an active postfix slot is assigned a differently named clip', () => {
  mockModelConversion();
  const { assigner, root, rootAnimation } = createExpressionAssignerFixture();
  const oldVrma = createExpressionVrma({
    interpolation: 'LINEAR',
    output: new Float32Array([1, 9, 9, 1, 9, 9]),
  });
  oldVrma.animations[0].name = 'Old';
  const newVrma = createExpressionVrma({
    interpolation: 'LINEAR',
    output: new Float32Array([0, 9, 9, 1, 9, 9]),
  });
  newVrma.animations[0].name = 'New';

  assigner.assignAnimationWithVrma(root, oldVrma, '__slot');
  const happyAnimation = rootAnimation.getAnimation('vrmExpression/happy');
  happyAnimation.setFirstActiveAnimationTrackName('Old__slot');

  assigner.assignAnimationWithVrma(root, newVrma, '__slot');

  expect(happyAnimation.getAllTrackNames()).toEqual(['New__slot']);
  expect(happyAnimation.getFirstActiveAnimationTrackName()).toBe('New__slot');
  happyAnimation.setTime(0.5);
  expect(happyAnimation.x).toBe(0.5);
});

test('refreshes the animation state when an active postfix slot keeps the same track name', () => {
  mockModelConversion();
  const { animationState, assigner, root } = createExpressionAssignerFixture(new Set(['happy']));
  const oldVrma = createExpressionVrma();
  oldVrma.animations[0].name = 'Same';
  oldVrma.extensions.VRMC_vrm_animation.expressions!.custom = undefined;
  const replacementVrma = createExpressionVrma();
  replacementVrma.animations[0].name = 'Same';
  replacementVrma.extensions.VRMC_vrm_animation.expressions!.custom = undefined;

  assigner.assignAnimationWithVrma(root, oldVrma, '__slot');
  animationState.setFirstActiveAnimationTrack.mockClear();
  assigner.assignAnimationWithVrma(root, replacementVrma, '__slot');

  expect(animationState.setFirstActiveAnimationTrack).toHaveBeenCalledWith('Same__slot');
});

test('applies a replacement fallback track to the animation state and bone channels', () => {
  mockModelConversion();
  const { assigner, root } = createExpressionAssignerFixture(new Set(['happy']));
  const oldSampler: AnimationSampler = {
    input: new Float32Array([0, 1]),
    output: new Float32Array([9, 0, 0, 9, 0, 0]),
    outputComponentN: 3,
    interpolationMethod: AnimationInterpolation.Linear,
  };
  const boneAnimationValue = new AnimatedVector3(new Map([['Old__slot', oldSampler]]), 'Old__slot');
  const boneAnimationChannels = new Map<AnimationPathName, any>([
    ['translate', { animatedValue: boneAnimationValue, target: { pathName: 'translate' } }],
  ]);
  const boneAnimation = {
    getAnimationChannelsOfTrack: () => boneAnimationChannels,
    getAnimationTrackNames: () => boneAnimationValue.getAllTrackNames(),
    resetAnimationTrackByPostfix: vi.fn((postfix: string) => {
      for (const trackName of boneAnimationValue.getAllTrackNames()) {
        if (trackName.endsWith(postfix)) {
          boneAnimationValue.deleteAnimationSampler(trackName);
        }
      }
    }),
    _setRetarget: vi.fn((_retarget: unknown, postfix: string | undefined) => {
      const trackName = `New${postfix ?? ''}`;
      boneAnimationValue.setAnimationSampler(trackName, {
        input: new Float32Array([0, 1]),
        output: new Float32Array([0, 0, 0, 2, 0, 0]),
        outputComponentN: 3,
        interpolationMethod: AnimationInterpolation.Linear,
      });
      return [trackName];
    }),
    setActiveAnimationTrack: vi.fn((trackName: string) => {
      boneAnimationValue.setFirstActiveAnimationTrackName(trackName);
    }),
  };
  const boneEntity = {
    tryToGetAnimation: () => boneAnimation,
    getAnimation: () => boneAnimation,
    getTransform: () => ({ _restoreTransformFromRest: vi.fn() }),
    children: [],
  } as unknown as ISceneGraphEntity;
  (root.children as any).push({ entity: boneEntity });
  (root as any).getTagValue = (tag: string) => {
    if (tag === 'humanoid_map_name_nodeId') {
      return new Map([['hips', 0]]);
    }
    if (tag === 'rnEntities') {
      return [boneEntity];
    }
    return undefined;
  };
  const setFirstActiveAnimationTrack = vi.fn((trackName: string) => {
    boneAnimation.setActiveAnimationTrack(trackName);
  });
  (root as any).tryToGetAnimationState = () => ({ setFirstActiveAnimationTrack });

  const replacement = createExpressionVrma({
    interpolation: 'LINEAR',
    output: new Float32Array([0, 9, 9, 1, 9, 9]),
  });
  replacement.animations[0].name = 'New';
  const samplerObject = replacement.animations[0].samplers[0];
  replacement.animations[0].channels.push({
    samplerObject,
    target: { node: 0, path: 'rotation' },
  });
  replacement.extensions.VRMC_vrm_animation.humanoidBoneNameMap = new Map([[0, 'hips']]);
  replacement.extras.rnEntities[0] = { tryToSetUniqueName: vi.fn() } as any;

  assigner.assignAnimationWithVrma(root, replacement, '__slot');

  expect(setFirstActiveAnimationTrack).toHaveBeenCalledWith('New__slot');
  expect(boneAnimationValue.getFirstActiveAnimationTrackName()).toBe('New__slot');
  boneAnimationValue.setTime(0.5);
  expect(boneAnimationValue.x).toBe(1);
});

test('clears an expression channel and weight when its last postfix sampler is removed', () => {
  mockModelConversion();
  const { assigner, root, rootAnimation, setExpressionWeight } = createExpressionAssignerFixture(new Set(['happy']));
  const oldVrma = createExpressionVrma();
  oldVrma.animations[0].name = 'Old';
  oldVrma.extensions.VRMC_vrm_animation.expressions!.custom = undefined;
  assigner.assignAnimationWithVrma(root, oldVrma, '__slot');
  setExpressionWeight.mockClear();

  const unavailableVrma = createExpressionVrma();
  unavailableVrma.animations[0].name = 'Unavailable';
  unavailableVrma.extensions.VRMC_vrm_animation.expressions = {
    custom: { unavailable: { node: 2 } },
  };
  assigner.assignAnimationWithVrma(root, unavailableVrma, '__slot');

  expect(rootAnimation.getAnimation('vrmExpression/happy')).toBeUndefined();
  expect(setExpressionWeight).toHaveBeenCalledWith('happy', 0);
});

test('resets expression weights before replacing unpostfixed VRMA tracks', () => {
  mockModelConversion();
  const { assigner, root, rootAnimation, setExpressionWeight } = createExpressionAssignerFixture();
  const happyVrma = createExpressionVrma();
  happyVrma.extensions.VRMC_vrm_animation.expressions!.custom = undefined;
  const smirkVrma = createExpressionVrma();
  smirkVrma.extensions.VRMC_vrm_animation.expressions!.preset = undefined;

  assigner.assignAnimationWithVrma(root, happyVrma);
  setExpressionWeight.mockClear();
  rootAnimation.resetAnimationTracks.mockClear();

  assigner.assignAnimationWithVrma(root, smirkVrma);

  expect(setExpressionWeight).toHaveBeenCalledWith('happy', 0);
  expect(setExpressionWeight).not.toHaveBeenCalledWith('smirk', 0);
  expect(setExpressionWeight.mock.invocationCallOrder[0]).toBeLessThan(
    rootAnimation.resetAnimationTracks.mock.invocationCallOrder[0]
  );
  expect(rootAnimation.getAnimation('vrmExpression/happy')).toBeUndefined();
});

test('maps VRMA 1.0 preset names and preserves custom names for VRM 0.x', () => {
  mockModelConversion();
  const vrmaNames = [
    'happy',
    'sad',
    'relaxed',
    'aa',
    'ih',
    'ou',
    'ee',
    'oh',
    'blinkLeft',
    'blinkRight',
    'lookUp',
    'lookDown',
    'lookLeft',
    'lookRight',
    'smirk',
  ];
  const vrm0xNames = [
    'joy',
    'sorrow',
    'fun',
    'a',
    'i',
    'u',
    'e',
    'o',
    'blink_l',
    'blink_r',
    'lookup',
    'lookdown',
    'lookleft',
    'lookright',
    'smirk',
  ];
  const { assigner, root, setAnimation } = createExpressionAssignerFixture(new Set(vrm0xNames), '0.x');
  const vrma = createExpressionVrma();
  vrma.extensions.VRMC_vrm_animation.expressionNamesMap = new Map([
    [2, vrmaNames.map(name => ({ name, isPreset: name !== 'smirk' }))],
  ]);

  assigner.assignAnimationWithVrma(root, vrma, '__vrm0');

  expect(setAnimation.mock.calls.map(([pathName]) => pathName)).toEqual(
    vrm0xNames.map(name => `vrmExpression/${name}`)
  );
});

test('keeps preset and custom VRMA expressions distinct when they share a name for VRM 0.x', () => {
  mockModelConversion();
  const { assigner, root, setAnimation } = createExpressionAssignerFixture(new Set(['happy', 'joy']), '0.x');
  const vrma = createExpressionVrma();
  vrma.extensions.VRMC_vrm_animation.expressions = {
    preset: {
      happy: { node: 2 },
    },
    custom: {
      happy: { node: 2 },
    },
  };

  assigner.assignAnimationWithVrma(root, vrma);

  expect(setAnimation.mock.calls.map(([pathName]) => pathName)).toEqual(['vrmExpression/joy', 'vrmExpression/happy']);
});

test.each([
  'constructor',
  'toString',
])('preserves the VRM 0.x custom expression name %s when it collides with Object.prototype', expressionName => {
  mockModelConversion();
  const { assigner, root, setAnimation } = createExpressionAssignerFixture(new Set([expressionName]), '0.x');
  const vrma = createExpressionVrma();
  vrma.extensions.VRMC_vrm_animation.expressionNamesMap = new Map([[2, [{ name: expressionName, isPreset: false }]]]);

  assigner.assignAnimationWithVrma(root, vrma);

  expect(setAnimation).toHaveBeenCalledTimes(1);
  expect(setAnimation.mock.calls[0][0]).toBe(`vrmExpression/${expressionName}`);
});

test('skips VRMA expressions that do not exist on the target model', () => {
  mockModelConversion();
  const { assigner, root, setAnimation } = createExpressionAssignerFixture(new Set(['happy']));

  const trackNames = assigner.assignAnimationWithVrma(root, createExpressionVrma());

  expect(trackNames).toEqual(['Face']);
  expect(setAnimation).toHaveBeenCalledTimes(1);
  expect(setAnimation.mock.calls[0][0]).toBe('vrmExpression/happy');
});

test('omits filtered retarget paths while retaining other paths', () => {
  const sampler: AnimationSampler = {
    input: new Float32Array([0, 1]),
    output: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1]),
    outputComponentN: 4,
    interpolationMethod: AnimationInterpolation.Linear,
  };
  const sourceAnimation = {
    useGlobalTime: true,
    time: 0,
    __applyAnimation: vi.fn(),
    __animationTrack: new Map([
      [
        'translate',
        {
          target: { pathName: 'translate' },
          animatedValue: {
            getAllTrackNames: () => ['Clip'],
            getAnimationSampler: () => sampler,
          },
        },
      ],
      [
        'quaternion',
        {
          target: { pathName: 'quaternion' },
          animatedValue: {
            getAllTrackNames: () => ['Clip'],
            getAnimationSampler: () => sampler,
          },
        },
      ],
    ]),
  };
  const sourceEntity = { tryToGetAnimation: () => sourceAnimation };
  const setAnimation = vi.fn();
  const targetAnimation = {
    entity: { getTransform: () => ({ _backupTransformAsRest: vi.fn() }) },
    setAnimation,
  };
  const retarget = {
    getEntity: () => sourceEntity,
    retargetQuaternion: () => Quaternion.identity(),
    retargetTranslate: () => ({ x: 0, y: 0, z: 0 }),
    retargetScale: () => ({ x: 1, y: 1, z: 1 }),
  };

  const trackNames = AnimationComponent.prototype._setRetarget.call(targetAnimation, retarget as any, '__filtered', [
    'translate',
  ]);

  expect(trackNames).toEqual(['Clip__filtered']);
  expect(setAnimation).toHaveBeenCalledTimes(1);
  expect(setAnimation.mock.calls[0][0]).toBe('quaternion');
  expect(sourceAnimation.useGlobalTime).toBe(false);
});
