import { expect, test } from 'vitest';
import { ProcessApproach } from '../definitions/ProcessApproach';
import { Engine } from '../system/Engine';
import { MaterialHelper } from './MaterialHelper';

function createSphereGraph(): any {
  return {
    nodes: [
      {
        id: 'initial',
        name: 'InitialPosition',
        outputs: { outPosition: { id: 'initial_out', label: 'Out Position', socket: { name: 'Vector3<float>' } } },
        inputs: {},
        controls: {},
        position: { x: 0, y: 0 },
      },
      {
        id: 'sphere',
        name: 'SdSphere',
        outputs: { outDistance: { id: 'sphere_out', label: 'Out Distance', socket: { name: 'Scalar<float>' } } },
        inputs: {
          position: { id: 'sphere_in', label: 'Position', socket: { name: 'Vector3<float>' } },
          radius: { id: 'sphere_radius', label: 'Radius', socket: { name: 'Scalar<float>' } },
        },
        controls: {},
        position: { x: 0, y: 0 },
      },
      {
        id: 'out',
        name: 'OutUnion',
        outputs: {},
        inputs: { in1: { id: 'out_in', label: 'In Scalar<float>', socket: { name: 'Scalar<float>' } } },
        controls: {},
        position: { x: 0, y: 0 },
      },
    ],
    connections: [
      { id: 'c1', from: { id: 'initial', portName: 'outPosition' }, to: { id: 'sphere', portName: 'position' } },
      { id: 'c2', from: { id: 'sphere', portName: 'outDistance' }, to: { id: 'out', portName: 'in1' } },
    ],
  };
}

test('raymarching material enables PBR shading and its material parameters', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
  });

  const result = MaterialHelper.createNodeBasedRaymarchingCustomMaterial(engine, createSphereGraph());
  expect(result).toBeDefined();
  const material = result!.material;

  const defines = material.getShaderDefines();
  expect(defines).toContain('RN_USE_PBR');
  expect(defines).toContain('RN_IS_LIGHTING');

  for (const semantic of [
    'raymarchingBaseColor',
    'raymarchingMetallic',
    'raymarchingRoughness',
    'raymarchingEmissive',
    'raymarchingIor',
    'raymarchingSpecularWeight',
    'raymarchingSpecularColor',
  ]) {
    expect(material._allFieldsInfo.has(semantic)).toBe(true);
  }

  // IBL parameters and environment textures (set by ForwardRenderPipeline).
  for (const semantic of [
    'diffuseEnvTexture',
    'specularEnvTexture',
    'inverseEnvironment',
    'iblParameter',
    'hdriFormat',
  ]) {
    expect(material._allFieldsInfo.has(semantic)).toBe(true);
  }
  // The transmission back buffer texture is not used without RN_USE_TRANSMISSION.
  expect(material._allFieldsInfo.has('backBufferTexture')).toBe(false);
});
