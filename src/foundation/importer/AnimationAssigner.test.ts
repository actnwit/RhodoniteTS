import { afterEach, expect, test, vi } from 'vitest';
import type { AnimationPathName, AnimationSampler, RnM2Vrma } from '../../types';
import { AnimationComponent } from '../components/Animation/AnimationComponent';
import { AnimationInterpolation } from '../definitions/AnimationInterpolation';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
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
  interpolation = 'CUBICSPLINE',
  output = new Float32Array([-1, 9, 9, 0.25, 9, 9, 2, 9, 9, -2, 9, 9, 1.5, 9, 9, 3, 9, 9]),
}: {
  interpolation?: 'LINEAR' | 'STEP' | 'CUBICSPLINE';
  output?: Float32Array;
} = {}): RnM2Vrma {
  const input = new Float32Array([0, 1]);
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
  const animationState = {};
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

function createExpressionAssignerFixture(availableExpressions = new Set(['happy', 'smirk'])) {
  const setAnimation = vi.fn();
  const rootAnimation = {
    resetAnimationTracks: vi.fn(),
    resetAnimationTrackByPostfix: vi.fn(),
    setAnimation,
  };
  const root = {
    entityUID: 42,
    tryToGetVrm: () => ({
      _version: '1.0',
      getExpressionWeight: (name: string) => (availableExpressions.has(name) ? 0 : undefined),
    }),
    tryToGetAnimationState: () => ({}),
    tryToGetAnimation: () => rootAnimation,
    getTransform: () => ({ _restoreTransformFromRest: vi.fn() }),
    children: [],
  } as unknown as ISceneGraphEntity;
  const entityRepository = {
    addComponentToEntity: vi.fn((_component: unknown, entity: unknown) => entity),
    deleteEntityRecursively: vi.fn(),
  };
  const assigner = new AnimationAssigner({ entityRepository } as any);
  return { assigner, entityRepository, root, setAnimation };
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
  expect(vrma.extensions.VRMC_vrm_animation.expressionNamesMap?.get(2)).toEqual(['happy', 'smirk']);
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
