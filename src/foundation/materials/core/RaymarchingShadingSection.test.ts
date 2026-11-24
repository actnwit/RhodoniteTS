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

test('emits the smooth combination and domain transform nodes', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
  });

  const node = (id: string, name: string, inputs: Record<string, unknown>, outputs: Record<string, unknown>) => ({
    id,
    name,
    inputs,
    outputs,
    controls: {},
    position: { x: 0, y: 0 },
  });
  const input = (id: string, name: string) => ({ id, label: name, socket: { name } });
  const output = (id: string, name: string) => ({ id, label: name, socket: { name } });

  const graph = {
    nodes: [
      node('init', 'InitialPosition', {}, { outPosition: output('init_out', 'Vector3<float>') }),
      node(
        'twistX',
        'TwistX',
        { position: input('twistX_pos', 'Vector3<float>') },
        {
          outPosition: output('twistX_out', 'Vector3<float>'),
        }
      ),
      node(
        'twistY',
        'TwistY',
        { position: input('twistY_pos', 'Vector3<float>') },
        {
          outPosition: output('twistY_out', 'Vector3<float>'),
        }
      ),
      node(
        'twistZ',
        'TwistZ',
        { position: input('twistZ_pos', 'Vector3<float>') },
        {
          outPosition: output('twistZ_out', 'Vector3<float>'),
        }
      ),
      node(
        'bendXY',
        'BendXY',
        { position: input('bendXY_pos', 'Vector3<float>') },
        {
          outPosition: output('bendXY_out', 'Vector3<float>'),
        }
      ),
      node(
        'bendXZ',
        'BendXZ',
        { position: input('bendXZ_pos', 'Vector3<float>') },
        {
          outPosition: output('bendXZ_out', 'Vector3<float>'),
        }
      ),
      node(
        'bendYZ',
        'BendYZ',
        { position: input('bendYZ_pos', 'Vector3<float>') },
        {
          outPosition: output('bendYZ_out', 'Vector3<float>'),
        }
      ),
      node(
        'bendYX',
        'BendYX',
        { position: input('bendYX_pos', 'Vector3<float>') },
        {
          outPosition: output('bendYX_out', 'Vector3<float>'),
        }
      ),
      node(
        'bendZX',
        'BendZX',
        { position: input('bendZX_pos', 'Vector3<float>') },
        {
          outPosition: output('bendZX_out', 'Vector3<float>'),
        }
      ),
      node(
        'bendZY',
        'BendZY',
        { position: input('bendZY_pos', 'Vector3<float>') },
        {
          outPosition: output('bendZY_out', 'Vector3<float>'),
        }
      ),
      {
        id: 'radius',
        name: 'ConstantScalarFloat',
        outputs: { out1: output('radius_out', 'Scalar<float>') },
        inputs: {},
        controls: {
          shaderStage: null,
          in1: { __type: 'NumberInputControl', id: 'radius_ctrl', value: 1, step: 0.1 },
        },
        position: { x: 0, y: 0 },
      },
      node(
        'sphereA',
        'SdSphere',
        {
          position: input('a_pos', 'Vector3<float>'),
          radius: input('a_radius', 'Scalar<float>'),
        },
        { outDistance: output('a_dist', 'Scalar<float>') }
      ),
      node(
        'sphereB',
        'SdSphere',
        {
          position: input('b_pos', 'Vector3<float>'),
          radius: input('b_radius', 'Scalar<float>'),
        },
        { outDistance: output('b_dist', 'Scalar<float>') }
      ),
      node(
        'sphereC',
        'SdSphere',
        {
          position: input('c_pos', 'Vector3<float>'),
          radius: input('c_radius', 'Scalar<float>'),
        },
        { outDistance: output('c_dist', 'Scalar<float>') }
      ),
      node(
        'sphereD',
        'SdSphere',
        {
          position: input('d_pos', 'Vector3<float>'),
          radius: input('d_radius', 'Scalar<float>'),
        },
        { outDistance: output('d_dist', 'Scalar<float>') }
      ),
      node(
        'smoothUnion',
        'OpSmoothUnion',
        {
          lhs: input('union_lhs', 'Scalar<float>'),
          rhs: input('union_rhs', 'Scalar<float>'),
        },
        { outValue: output('union_out', 'Scalar<float>') }
      ),
      node(
        'smoothSub',
        'OpSmoothSubtraction',
        {
          base: input('sub_base', 'Scalar<float>'),
          subtractor: input('sub_subtractor', 'Scalar<float>'),
        },
        { outValue: output('sub_out', 'Scalar<float>') }
      ),
      node(
        'smoothInter',
        'OpSmoothIntersection',
        {
          lhs: input('inter_lhs', 'Scalar<float>'),
          rhs: input('inter_rhs', 'Scalar<float>'),
        },
        { outValue: output('inter_out', 'Scalar<float>') }
      ),
      node('out', 'OutUnion', { in1: input('out_in', 'Scalar<float>') }, {}),
    ],
    connections: [
      { id: 'c1', from: { id: 'init', portName: 'outPosition' }, to: { id: 'twistX', portName: 'position' } },
      { id: 'c2', from: { id: 'twistX', portName: 'outPosition' }, to: { id: 'twistY', portName: 'position' } },
      { id: 'c3', from: { id: 'twistY', portName: 'outPosition' }, to: { id: 'twistZ', portName: 'position' } },
      { id: 'c3b', from: { id: 'twistZ', portName: 'outPosition' }, to: { id: 'bendXY', portName: 'position' } },
      { id: 'c3c', from: { id: 'bendXY', portName: 'outPosition' }, to: { id: 'bendXZ', portName: 'position' } },
      { id: 'c3d', from: { id: 'bendXZ', portName: 'outPosition' }, to: { id: 'bendYZ', portName: 'position' } },
      { id: 'c3e', from: { id: 'bendYZ', portName: 'outPosition' }, to: { id: 'bendYX', portName: 'position' } },
      { id: 'c3f', from: { id: 'bendYX', portName: 'outPosition' }, to: { id: 'bendZX', portName: 'position' } },
      { id: 'c3g', from: { id: 'bendZX', portName: 'outPosition' }, to: { id: 'bendZY', portName: 'position' } },
      { id: 'c3h', from: { id: 'bendZY', portName: 'outPosition' }, to: { id: 'sphereA', portName: 'position' } },
      { id: 'c4', from: { id: 'init', portName: 'outPosition' }, to: { id: 'sphereB', portName: 'position' } },
      { id: 'c5', from: { id: 'init', portName: 'outPosition' }, to: { id: 'sphereC', portName: 'position' } },
      { id: 'c6', from: { id: 'init', portName: 'outPosition' }, to: { id: 'sphereD', portName: 'position' } },
      { id: 'c7', from: { id: 'radius', portName: 'out1' }, to: { id: 'sphereA', portName: 'radius' } },
      { id: 'c8', from: { id: 'radius', portName: 'out1' }, to: { id: 'sphereB', portName: 'radius' } },
      { id: 'c9', from: { id: 'radius', portName: 'out1' }, to: { id: 'sphereC', portName: 'radius' } },
      { id: 'c10', from: { id: 'radius', portName: 'out1' }, to: { id: 'sphereD', portName: 'radius' } },
      {
        id: 'c11',
        from: { id: 'sphereA', portName: 'outDistance' },
        to: { id: 'smoothUnion', portName: 'lhs' },
      },
      {
        id: 'c12',
        from: { id: 'sphereB', portName: 'outDistance' },
        to: { id: 'smoothUnion', portName: 'rhs' },
      },
      {
        id: 'c13',
        from: { id: 'smoothUnion', portName: 'outValue' },
        to: { id: 'smoothSub', portName: 'base' },
      },
      {
        id: 'c14',
        from: { id: 'sphereC', portName: 'outDistance' },
        to: { id: 'smoothSub', portName: 'subtractor' },
      },
      {
        id: 'c15',
        from: { id: 'smoothSub', portName: 'outValue' },
        to: { id: 'smoothInter', portName: 'lhs' },
      },
      {
        id: 'c16',
        from: { id: 'sphereD', portName: 'outDistance' },
        to: { id: 'smoothInter', portName: 'rhs' },
      },
      { id: 'c17', from: { id: 'smoothInter', portName: 'outValue' }, to: { id: 'out', portName: 'in1' } },
    ],
  };

  const code = ShaderGraphResolver.generateShaderCodeFromJson(engine, graph as any, new RaymarchingShaderPart());
  expect(code).toBeDefined();
  const pixelShader = code!.pixelShader;

  expect(pixelShader).toContain('opSmoothUnion');
  expect(pixelShader).toContain('opSmoothSubtraction');
  expect(pixelShader).toContain('opSmoothIntersection');
  expect(pixelShader).toContain('twistX');
  expect(pixelShader).toContain('twistY');
  expect(pixelShader).toContain('twistZ');
  expect(pixelShader).toContain('bendXY');
  expect(pixelShader).toContain('bendXZ');
  expect(pixelShader).toContain('bendYZ');
  expect(pixelShader).toContain('bendYX');
  expect(pixelShader).toContain('bendZX');
  expect(pixelShader).toContain('bendZY');
  expect(pixelShader).toContain('return g_distance;');
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

test('emits the torus, capsule and round box primitives', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
  });

  const node = (id: string, name: string, inputs: Record<string, unknown>, outputs: Record<string, unknown>) => ({
    id,
    name,
    inputs,
    outputs,
    controls: {},
    position: { x: 0, y: 0 },
  });
  const input = (id: string, name: string) => ({ id, label: name, socket: { name } });
  const output = (id: string, name: string) => ({ id, label: name, socket: { name } });

  const graph = {
    nodes: [
      node('init', 'InitialPosition', {}, { outPosition: output('init_out', 'Vector3<float>') }),
      node(
        'torus',
        'SdTorus',
        { position: input('torus_pos', 'Vector3<float>') },
        { outDistance: output('torus_dist', 'Scalar<float>') }
      ),
      node(
        'capsule',
        'SdCapsule',
        { position: input('capsule_pos', 'Vector3<float>') },
        { outDistance: output('capsule_dist', 'Scalar<float>') }
      ),
      node(
        'roundBox',
        'SdRoundBox',
        { position: input('roundBox_pos', 'Vector3<float>') },
        { outDistance: output('roundBox_dist', 'Scalar<float>') }
      ),
      node(
        'union1',
        'OpUnion',
        { lhs: input('union1_lhs', 'Scalar<float>'), rhs: input('union1_rhs', 'Scalar<float>') },
        { outValue: output('union1_out', 'Scalar<float>') }
      ),
      node(
        'union2',
        'OpUnion',
        { lhs: input('union2_lhs', 'Scalar<float>'), rhs: input('union2_rhs', 'Scalar<float>') },
        { outValue: output('union2_out', 'Scalar<float>') }
      ),
      node('out', 'OutUnion', { in1: input('out_in', 'Scalar<float>') }, {}),
    ],
    connections: [
      { id: 'c1', from: { id: 'init', portName: 'outPosition' }, to: { id: 'torus', portName: 'position' } },
      { id: 'c2', from: { id: 'init', portName: 'outPosition' }, to: { id: 'capsule', portName: 'position' } },
      { id: 'c3', from: { id: 'init', portName: 'outPosition' }, to: { id: 'roundBox', portName: 'position' } },
      { id: 'c4', from: { id: 'torus', portName: 'outDistance' }, to: { id: 'union1', portName: 'lhs' } },
      { id: 'c5', from: { id: 'capsule', portName: 'outDistance' }, to: { id: 'union1', portName: 'rhs' } },
      { id: 'c6', from: { id: 'union1', portName: 'outValue' }, to: { id: 'union2', portName: 'lhs' } },
      { id: 'c7', from: { id: 'roundBox', portName: 'outDistance' }, to: { id: 'union2', portName: 'rhs' } },
      { id: 'c8', from: { id: 'union2', portName: 'outValue' }, to: { id: 'out', portName: 'in1' } },
    ],
  };

  const code = ShaderGraphResolver.generateShaderCodeFromJson(engine, graph as any, new RaymarchingShaderPart());
  expect(code).toBeDefined();
  const pixelShader = code!.pixelShader;

  expect(pixelShader).toContain('sdTorus');
  expect(pixelShader).toContain('sdCapsule');
  expect(pixelShader).toContain('sdRoundBox');
});

test('links an SdApplyTransform scale global to the raymarching terminal that uses it', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
  });

  const node = (id: string, name: string, inputs: Record<string, unknown>, outputs: Record<string, unknown>) => ({
    id,
    name,
    inputs,
    outputs,
    controls: {},
    position: { x: 0, y: 0 },
  });
  const input = (id: string, name: string) => ({ id, label: name, socket: { name } });
  const output = (id: string, name: string) => ({ id, label: name, socket: { name } });

  const graph = {
    nodes: [
      node('init', 'InitialPosition', {}, { outPosition: output('init_out', 'Vector3<float>') }),
      node(
        'transform',
        'SdApplyTransform',
        {
          position: input('transform_pos', 'Vector3<float>'),
          translation: input('transform_translation', 'Vector3<float>'),
          xyzEulerAngles: input('transform_euler', 'Vector3<float>'),
          scale: input('transform_scale', 'Vector3<float>'),
        },
        { outTransformedPosition: output('transform_out', 'Vector3<float>') }
      ),
      node(
        'box',
        'SdBox',
        { position: input('box_pos', 'Vector3<float>') },
        { outDistance: output('box_dist', 'Scalar<float>') }
      ),
      node('out', 'OutUnion', { in1: input('out_in', 'Scalar<float>') }, {}),
    ],
    connections: [
      { id: 'c1', from: { id: 'init', portName: 'outPosition' }, to: { id: 'transform', portName: 'position' } },
      {
        id: 'c2',
        from: { id: 'transform', portName: 'outTransformedPosition' },
        to: { id: 'box', portName: 'position' },
      },
      { id: 'c3', from: { id: 'box', portName: 'outDistance' }, to: { id: 'out', portName: 'in1' } },
    ],
  };

  const code = ShaderGraphResolver.generateShaderCodeFromJson(engine, graph as any, new RaymarchingShaderPart());
  expect(code).toBeDefined();
  const pixelShader = code!.pixelShader;

  // The transform function records the node's smallest axis scale.
  expect(pixelShader).toMatch(/g_sdApplyTransformScale_\d+ = clamp\(min\(abs\(scale\.x\)/);
  // The terminal that consumes the transformed distance multiplies it by that global.
  expect(pixelShader).toMatch(/distanceScale = min\(distanceScale, g_sdApplyTransformScale_\d+\)/);
  // The global is declared (and initialized) at shader scope before its function.
  expect(pixelShader).toMatch(/float g_sdApplyTransformScale_\d+ = 1\.0;/);
});

test('march the distance field inside the component AABB', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
  });

  const graph = {
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
        id: 'box',
        name: 'SdBox',
        outputs: { outDistance: { id: 'box_dist', label: 'OutDistance', socket: { name: 'Scalar<float>' } } },
        inputs: { position: { id: 'box_pos', label: 'Position', socket: { name: 'Vector3<float>' } } },
        controls: {},
        position: { x: 0, y: 0 },
      },
      {
        id: 'out',
        name: 'OutUnion',
        outputs: {},
        inputs: { in1: { id: 'out_in', label: 'InScalar<float>', socket: { name: 'Scalar<float>' } } },
        controls: {},
        position: { x: 0, y: 0 },
      },
    ],
    connections: [
      { id: 'c1', from: { id: 'init', portName: 'outPosition' }, to: { id: 'box', portName: 'position' } },
      { id: 'c2', from: { id: 'box', portName: 'outDistance' }, to: { id: 'out', portName: 'in1' } },
    ],
  };

  const code = ShaderGraphResolver.generateShaderCodeFromJson(engine, graph as any, new RaymarchingShaderPart());
  expect(code).toBeDefined();
  const pixelShader = code!.pixelShader;

  // The march is clipped to the world AABB the pipeline supplies per component.
  expect(pixelShader).toContain('rnRayAabbInterval(');
  expect(pixelShader).toContain('get_raymarchAabbMin(');
  expect(pixelShader).toContain('get_raymarchAabbMax(');
  expect(pixelShader).toContain('aabbHits');
});
