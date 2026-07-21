import { describe, expect, test } from 'vitest';
import type { RnM2Vrma } from '../../types';
import { VrmaImporter } from './VrmaImporter';

describe('VrmaImporter expressions', () => {
  test('maps preset and custom expression names by node without dropping shared nodes', () => {
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
              smirk: { node: 4 },
            },
          },
        },
      },
    } as unknown as RnM2Vrma;

    VrmaImporter.readExpressions(vrma);

    expect(vrma.extensions.VRMC_vrm_animation.expressionNamesMap).toEqual(
      new Map([
        [4, ['happy', 'smirk']],
        [5, ['blink']],
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
