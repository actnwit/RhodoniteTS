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

test('raymarching material exposes Texture2D semantics and enables normal mapping', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
  });

  const vector2 = { name: 'Vector2<float>' };
  const vector3 = { name: 'Vector3<float>' };
  const vector4 = { name: 'Vector4<float>' };
  const graph = createSphereGraph();
  graph.nodes.push(
    {
      id: 'hitPosition',
      name: 'RaymarchHitPosition',
      outputs: { outPosition: { id: 'hitPosition_out', label: 'Out Position', socket: vector4 } },
      inputs: {},
      controls: {},
      position: { x: 0, y: 0 },
    },
    {
      id: 'hitNormal',
      name: 'RaymarchHitNormal',
      outputs: { outNormal: { id: 'hitNormal_out', label: 'Out Normal', socket: vector3 } },
      inputs: {},
      controls: {},
      position: { x: 0, y: 0 },
    },
    {
      id: 'normalTexture',
      name: 'Texture2D',
      outputs: { rgba: { id: 'normalTexture_rgba', label: 'rgba Out', socket: vector4 } },
      inputs: { uv: { id: 'normalTexture_uv', label: 'In UV', socket: vector2 } },
      controls: {
        shaderStage: { value: 'Neutral' },
        name: { value: 'raymarchNormalTexture' },
        defaultTexture: { value: 'dummyWhiteTexture' },
        sRGB: { value: false },
      },
      position: { x: 0, y: 0 },
    },
    {
      id: 'normalProps',
      name: 'PbrNormalProps',
      outputs: {
        outNormalInWorld: { id: 'normalProps_normal', label: 'Out Normal', socket: vector3 },
        outTBN: { id: 'normalProps_tbn', label: 'Out TBN', socket: { name: 'Matrix3<float>' } },
      },
      inputs: {
        positionInWorld: { id: 'normalProps_position', label: 'In Position', socket: vector4 },
        normalInWorld: { id: 'normalProps_normalIn', label: 'In Normal', socket: vector3 },
        normalTexture: { id: 'normalProps_texture', label: 'In Normal Texture', socket: vector4 },
      },
      controls: { shaderStage: { value: 'Neutral' } },
      position: { x: 0, y: 0 },
    },
    {
      id: 'pbr',
      name: 'PbrShader',
      outputs: { outColor: { id: 'pbr_out', label: 'Out Color', socket: vector4 } },
      inputs: {
        positionInWorld: { id: 'pbr_position', label: 'In Position', socket: vector4 },
        normalInWorld: { id: 'pbr_normal', label: 'In Normal', socket: vector3 },
      },
      controls: { shaderStage: { value: 'Neutral' } },
      position: { x: 0, y: 0 },
    },
    {
      id: 'outShading',
      name: 'OutShadingColor',
      outputs: {},
      inputs: { value: { id: 'outShading_in', label: 'In Color', socket: vector4 } },
      controls: {},
      position: { x: 0, y: 0 },
    }
  );
  graph.connections.push(
    {
      id: 's1',
      from: { id: 'hitPosition', portName: 'outPosition' },
      to: { id: 'pbr', portName: 'positionInWorld' },
    },
    {
      id: 's2',
      from: { id: 'hitPosition', portName: 'outPosition' },
      to: { id: 'normalProps', portName: 'positionInWorld' },
    },
    {
      id: 's3',
      from: { id: 'hitNormal', portName: 'outNormal' },
      to: { id: 'normalProps', portName: 'normalInWorld' },
    },
    {
      id: 's4',
      from: { id: 'normalTexture', portName: 'rgba' },
      to: { id: 'normalProps', portName: 'normalTexture' },
    },
    {
      id: 's5',
      from: { id: 'normalProps', portName: 'outNormalInWorld' },
      to: { id: 'pbr', portName: 'normalInWorld' },
    },
    {
      id: 's6',
      from: { id: 'pbr', portName: 'outColor' },
      to: { id: 'outShading', portName: 'value' },
    }
  );

  const result = MaterialHelper.createNodeBasedRaymarchingCustomMaterial(engine, graph);
  expect(result).toBeDefined();
  const material = result!.material;

  // The Texture2D node's texture name becomes a material texture semantic.
  expect(material._allFieldsInfo.has('raymarchNormalTexture')).toBe(true);
  // A normal texture on PbrNormalProps enables normal mapping in the shared PBR shader.
  expect(material.getShaderDefines()).toContain('RN_USE_NORMAL_TEXTURE');
});
