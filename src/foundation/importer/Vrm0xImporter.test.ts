import { expect, test, vi } from 'vitest';
import type { Vrm0x } from '../../types/VRM0x';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Vrm0xImporter } from './Vrm0xImporter';

test('registers VRM 0.x custom expressions by their group name', () => {
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
      VRM: {
        blendShapeMaster: {
          blendShapeGroups: [
            {
              name: 'Joy',
              presetName: 'joy',
              isBinary: false,
              binds: [],
              materialValues: [],
            },
            {
              name: 'smirk',
              presetName: 'unknown',
              isBinary: false,
              binds: [],
              materialValues: [],
            },
          ],
        },
      },
    },
    nodes: [],
    extras: {
      rnEntities: [],
    },
  } as unknown as Vrm0x;

  Vrm0xImporter._readBlendShapeGroup(gltfModel, rootEntity);

  expect(setVrmExpressions).toHaveBeenCalledWith([
    {
      name: 'joy',
      isBinary: false,
      binds: [],
    },
    {
      name: 'smirk',
      isBinary: false,
      binds: [],
    },
  ]);
  expect(vrmComponent._version).toBe('0.x');
});
