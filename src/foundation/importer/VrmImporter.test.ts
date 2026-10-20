import { expect, test, vi } from 'vitest';
import type { Vrm1 } from '../../types/VRM1';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { VrmImporter } from './VrmImporter';

test('registers preset and custom VRM 1.0 expressions', () => {
  const setVrmExpressions = vi.fn();
  const vrmComponent = { setVrmExpressions, _version: '' };
  const rootEntity = {
    engine: {
      entityRepository: {
        addComponentToEntity: () => ({ getVrm: () => vrmComponent }),
      },
    },
  } as unknown as ISceneGraphEntity;
  const gltfModel = {
    extensions: {
      VRMC_vrm: {
        expressions: {
          preset: {
            happy: {
              isBinary: true,
              morphTargetBinds: [{ node: 0, index: 1, weight: 0.8 }],
            },
          },
          custom: {
            smirk: {
              morphTargetBinds: [{ node: 1, index: 2, weight: 0.6 }],
            },
          },
        },
      },
    },
    extras: {
      rnEntities: [{ entityUID: 10 }, { entityUID: 11 }],
    },
  } as unknown as Vrm1;

  VrmImporter._readExpressions(gltfModel, rootEntity);

  expect(setVrmExpressions).toHaveBeenCalledWith([
    {
      name: 'happy',
      isBinary: true,
      binds: [{ entityIdx: 10, blendShapeIdx: 1, weight: 0.8 }],
    },
    {
      name: 'smirk',
      isBinary: false,
      binds: [{ entityIdx: 11, blendShapeIdx: 2, weight: 0.6 }],
    },
  ]);
  expect(vrmComponent._version).toBe('1.0');
});
