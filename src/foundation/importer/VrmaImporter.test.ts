import { describe, expect, test } from 'vitest';
import type { RnM2Vrma } from '../../types';
import { VrmaImporter } from './VrmaImporter';

describe('VrmaImporter expressions', () => {
  test('maps expression names and their preset/custom origin by node without dropping shared nodes', () => {
    const vrma = {
      extensions: {
        VRMC_vrm_animation: {
          specVersion: '1.0',
          expressions: {
            preset: {
              happy: { node: 4 },
              blink: { node: 5 },
            },
            custom: {
              happy: { node: 4 },
              smirk: { node: 4 },
            },
          },
        },
      },
    } as unknown as RnM2Vrma;

    VrmaImporter.readExpressions(vrma);

    expect(vrma.extensions.VRMC_vrm_animation.expressionNamesMap).toEqual(
      new Map([
        [
          4,
          [
            { name: 'happy', isPreset: true },
            { name: 'happy', isPreset: false },
            { name: 'smirk', isPreset: false },
          ],
        ],
        [5, [{ name: 'blink', isPreset: true }]],
      ])
    );
  });

  test('leaves VRMA data without expressions unchanged', () => {
    const vrma = {
      extensions: { VRMC_vrm_animation: { specVersion: '1.0' } },
    } as unknown as RnM2Vrma;

    VrmaImporter.readExpressions(vrma);

    expect(vrma.extensions.VRMC_vrm_animation.expressionNamesMap).toBeUndefined();
  });
});
