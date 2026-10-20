import { expect, test } from 'vitest';
import type { Gltf2Ex } from '../../types/glTF2ForOutput';
import { __createBufferViewsAndAccessorsOfAnimation, isRuntimeOnlyAnimationPath } from './Gltf2ExporterOps';

test('omits runtime VRM expression channels from regular glTF export', () => {
  expect(isRuntimeOnlyAnimationPath('vrmExpression/happy')).toBe(true);
  expect(isRuntimeOnlyAnimationPath('quaternion')).toBe(false);
});

test('does not register an empty glTF animation for expression-only tracks', () => {
  const json = {
    animations: [],
    extras: {
      bufferViewByteLengthAccumulatedArray: [],
    },
  } as unknown as Gltf2Ex;
  const expressionChannel = {
    target: { pathName: 'vrmExpression/happy' },
    animatedValue: {
      getAllTrackNames: () => ['ExpressionOnly'],
    },
  };
  const entity = {
    tryToGetAnimation: () => ({
      getAnimationChannelsOfTrack: () => new Map([['vrmExpression/happy', expressionChannel]]),
    }),
  };

  __createBufferViewsAndAccessorsOfAnimation(json, [entity] as any, {
    resolveAnimationTarget: ({ channel }) => (isRuntimeOnlyAnimationPath(channel.target.pathName) ? null : undefined),
  });

  expect(json.animations).toEqual([]);
});
