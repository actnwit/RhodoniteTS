import { expect, test } from 'vitest';
import { RaymarchingShaderPart } from '../../../webgl/shaders/RaymarchingShaderPart';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { Engine } from '../../system/Engine';
import { ShaderGraphResolver } from './ShaderGraphResolver';

function createGraphWithShadingSection(): any {
  const vector3 = { name: 'Vector3<float>' };
  const vector4 = { name: 'Vector4<float>' };
  const scalar = { name: 'Scalar<float>' };

  return {
    nodes: [
      {
        id: 'initial',
        name: 'InitialPosition',
        outputs: { outPosition: { id: 'initial_out', label: 'Out Position', socket: vector3 } },
        inputs: {},
        controls: {},
        position: { x: 0, y: 0 },
      },
      {
        id: 'sphere',
        name: 'SdSphere',
        outputs: { outDistance: { id: 'sphere_out', label: 'Out Distance', socket: scalar } },
        inputs: {
          position: { id: 'sphere_in', label: 'Position', socket: vector3 },
          radius: { id: 'sphere_radius', label: 'Radius', socket: scalar },
        },
        controls: {},
        position: { x: 0, y: 0 },
      },
      {
        id: 'outUnion',
        name: 'OutUnion',
        outputs: {},
        inputs: { in1: { id: 'out_union_in', label: 'In Scalar<float>', socket: scalar } },
        controls: {},
        position: { x: 0, y: 0 },
      },
      {
        id: 'hitPosition',
        name: 'RaymarchHitPosition',
        outputs: { outPosition: { id: 'hit_position_out', label: 'Out Position', socket: vector4 } },
        inputs: {},
        controls: {},
        position: { x: 0, y: 0 },
      },
      {
        id: 'hitNormal',
        name: 'RaymarchHitNormal',
        outputs: { outNormal: { id: 'hit_normal_out', label: 'Out Normal', socket: vector3 } },
        inputs: {},
        controls: {},
        position: { x: 0, y: 0 },
      },
      {
        id: 'pbr',
        name: 'PbrShader',
        outputs: { outColor: { id: 'pbr_out', label: 'Out Color', socket: vector4 } },
        inputs: {
          positionInWorld: { id: 'pbr_position', label: 'In Position In World', socket: vector4 },
          normalInWorld: { id: 'pbr_normal', label: 'In Normal In World', socket: vector3 },
        },
        controls: { shaderStage: { value: 'Neutral' } },
        position: { x: 0, y: 0 },
      },
      {
        id: 'outShading',
        name: 'OutShadingColor',
        outputs: {},
        inputs: { value: { id: 'out_shading_in', label: 'In Color', socket: vector4 } },
        controls: {},
        position: { x: 0, y: 0 },
      },
    ],
    connections: [
      { id: 'c1', from: { id: 'initial', portName: 'outPosition' }, to: { id: 'sphere', portName: 'position' } },
      { id: 'c2', from: { id: 'sphere', portName: 'outDistance' }, to: { id: 'outUnion', portName: 'in1' } },
      {
        id: 'c3',
        from: { id: 'hitPosition', portName: 'outPosition' },
        to: { id: 'pbr', portName: 'positionInWorld' },
      },
      { id: 'c4', from: { id: 'hitNormal', portName: 'outNormal' }, to: { id: 'pbr', portName: 'normalInWorld' } },
      { id: 'c5', from: { id: 'pbr', portName: 'outColor' }, to: { id: 'outShading', portName: 'value' } },
    ],
  };
}

test('emits the raymarching shading graph as a separate function called once per hit', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
  });

  const code = ShaderGraphResolver.generateShaderCodeFromJson(
    engine,
    createGraphWithShadingSection(),
    new RaymarchingShaderPart()
  );
  expect(code).toBeDefined();
  const pixelShader = code!.pixelShader;

  // The shading graph is emitted as its own per-object function (object id 0 for
  // a graph without a component prefix), outside the distance function.
  expect(pixelShader).toContain('void shade_0() {');
  expect(pixelShader).toContain('raymarchHitPosition');
  expect(pixelShader).toContain('raymarchHitNormal');
  expect(pixelShader).toContain('outShadingColor');
  expect(pixelShader).toContain('shade_0();');
  expect(pixelShader).toContain('hitObjectId == 0');
  expect(pixelShader.indexOf('void shade_0() {')).toBeGreaterThan(pixelShader.indexOf('return g_distance;'));

  // The hit position/normal are handed to the shading section.
  expect(pixelShader).toContain('g_hitPosition = p;');
  expect(pixelShader).toContain('g_hitNormal = normal;');
  expect(pixelShader).toContain('g_shadingColor.rgb');
});

test('generates one shading function per raymarching component and dispatches by object id', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
  });

  const prefixGraph = (graph: any, prefix: string) => {
    const nodes = graph.nodes.map((node: any) => ({
      ...node,
      id: `${prefix}${node.id}`,
      inputs: Object.fromEntries(
        Object.entries(node.inputs).map(([key, input]: [string, any]) => [
          key,
          { ...input, id: `${prefix}${input.id}` },
        ])
      ),
      outputs: Object.fromEntries(
        Object.entries(node.outputs).map(([key, output]: [string, any]) => [
          key,
          { ...output, id: `${prefix}${output.id}` },
        ])
      ),
    }));
    const connections = graph.connections.map((connection: any) => ({
      ...connection,
      id: `${prefix}${connection.id}`,
      from: { ...connection.from, id: `${prefix}${connection.from.id}` },
      to: { ...connection.to, id: `${prefix}${connection.to.id}` },
    }));
    return { nodes, connections };
  };

  const component0 = prefixGraph(createGraphWithShadingSection(), 'comp0_');
  const component1 = prefixGraph(createGraphWithShadingSection(), 'comp1_');
  const merged = {
    nodes: [...component0.nodes, ...component1.nodes],
    connections: [...component0.connections, ...component1.connections],
  };

  const code = ShaderGraphResolver.generateShaderCodeFromJson(engine, merged, new RaymarchingShaderPart());
  expect(code).toBeDefined();
  const pixelShader = code!.pixelShader;

  expect(pixelShader).toContain('void shade_0() {');
  expect(pixelShader).toContain('void shade_1() {');
  expect(pixelShader).toContain('hitObjectId == 0');
  expect(pixelShader).toContain('hitObjectId == 1');
});

test('keeps the fixed shading when the graph has no shading output', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
  });

  const removedNodeIds = ['hitPosition', 'hitNormal', 'pbr', 'outShading'];
  const graph = createGraphWithShadingSection();
  graph.nodes = graph.nodes.filter((node: any) => !removedNodeIds.includes(node.id));
  graph.connections = graph.connections.filter(
    (connection: any) => !removedNodeIds.includes(connection.from.id) && !removedNodeIds.includes(connection.to.id)
  );

  const code = ShaderGraphResolver.generateShaderCodeFromJson(engine, graph, new RaymarchingShaderPart());
  expect(code).toBeDefined();
  const pixelShader = code!.pixelShader;

  expect(pixelShader).not.toContain('void shade_0() {');
  expect(pixelShader).toContain('raymarchingPbr(p, normal)');
});
