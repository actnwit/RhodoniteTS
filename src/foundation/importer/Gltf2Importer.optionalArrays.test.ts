import type { RnM2 } from '../../types';
import { Gltf2Importer } from './Gltf2Importer';

test('loads a collision-only glTF that omits buffers and other optional collections', async () => {
  const gltfModel = {
    asset: { version: '2.0', extras: {} },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'FloorCollider' }],
  } as unknown as RnM2;

  await Gltf2Importer._loadInner(gltfModel, {}, {});

  expect(gltfModel.buffers).toEqual([]);
  expect(gltfModel.bufferViews).toEqual([]);
  expect(gltfModel.accessors).toEqual([]);
  expect(gltfModel.meshes).toEqual([]);
  expect(gltfModel.materials).toEqual([]);
  expect(gltfModel.animations).toEqual([]);
  expect(gltfModel.extensions).toEqual({});
});
