import { expect, test } from 'vitest';
import type { NodeJSON } from '../../types/NodeJSON';
import { createRaymarchingEntity } from '../components/Raymarching/createRaymarchingEntity';
import { ProcessApproach } from '../definitions/ProcessApproach';
import { Vector3 } from '../math/Vector3';
import { Engine } from '../system/Engine';
import { GLTF2_EXPORT_NO_DOWNLOAD, Gltf2Exporter } from './Gltf2Exporter';

function createSphereGraph(): NodeJSON {
  return {
    nodes: [
      {
        id: 'init',
        name: 'InitialPosition',
        outputs: { outPosition: { id: 'init_out', label: 'OutPosition', socket: { name: 'Vector3<float>' } } },
        inputs: {},
        controls: {},
        position: { x: 0, y: 0 },
      },
      {
        id: 'sphere',
        name: 'SdSphere',
        outputs: { outDistance: { id: 'sphere_out', label: 'OutDistance', socket: { name: 'Scalar<float>' } } },
        inputs: {
          position: { id: 'sphere_pos', label: 'Position', socket: { name: 'Vector3<float>' } },
          radius: { id: 'sphere_radius', label: 'Radius', socket: { name: 'Scalar<float>' } },
        },
        controls: {},
        position: { x: 0, y: 0 },
      },
      {
        id: 'radius',
        name: 'ConstantScalarFloat',
        outputs: { out1: { id: 'radius_out', label: 'Scalar<float>Out', socket: { name: 'Scalar<float>' } } },
        inputs: {},
        controls: {
          shaderStage: null,
          in1: { __type: 'NumberInputControl', id: 'radius_ctrl', value: 1, step: 0.1 },
        },
        position: { x: 0, y: 0 },
      },
      {
        id: 'out',
        name: 'OutUnion',
        outputs: {},
        inputs: { in1: { id: 'out_in', label: 'InScalar<float>', socket: { name: 'Scalar<float>' } } },
        controls: { shaderStage: null },
        position: { x: 0, y: 0 },
      },
    ],
    connections: [
      { id: 'c1', from: { id: 'init', portName: 'outPosition' }, to: { id: 'sphere', portName: 'position' } },
      { id: 'c2', from: { id: 'radius', portName: 'out1' }, to: { id: 'sphere', portName: 'radius' } },
      { id: 'c3', from: { id: 'sphere', portName: 'outDistance' }, to: { id: 'out', portName: 'in1' } },
    ],
  } as NodeJSON;
}

function parseGlbJson(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  const jsonLength = view.getUint32(12, true);
  return JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, jsonLength)));
}

test('exports a RaymarchingComponent graph as a glTF node extension', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
    notToDisplayRnInfoAtInit: true,
  });
  const entity = createRaymarchingEntity(engine);
  entity.position = Vector3.fromCopy3(1, 2, 3);
  entity.tryToSetUniqueName('Test Raymarching', true);
  entity.getRaymarching().rrnJson = createSphereGraph();
  entity.getRaymarching().isPickable = false;

  const buffer = await Gltf2Exporter.export(engine, 'RaymarchingRoundTrip', {
    entities: [entity],
    type: GLTF2_EXPORT_NO_DOWNLOAD,
  });
  const json = parseGlbJson(buffer);
  const extension = json.nodes[0].extensions.RHODONITE_raymarching;
  expect(json.extensionsUsed).toContain('RHODONITE_raymarching');
  expect(extension.graph.nodes).toHaveLength(4);
  expect(extension.isPickable).toBe(false);
  expect(json.nodes[0].translation).toEqual([1, 2, 3]);
});
