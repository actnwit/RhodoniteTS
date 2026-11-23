import { expect, test } from 'vitest';
import { createRaymarchingEntity } from '../components/Raymarching/createRaymarchingEntity';
import { ProcessApproach } from '../definitions/ProcessApproach';
import { SdfShapeType } from '../definitions/SdfShapeType';
import { Engine } from '../system/Engine';
import { MaterialHelper } from './MaterialHelper';

function createSphereGraph(): any {
  const vec3 = { name: 'Vector3<float>' };
  const vec4 = { name: 'Vector4<float>' };
  const scalar = { name: 'Scalar<float>' };
  return {
    nodes: [
      {
        id: 'initial',
        name: 'InitialPosition',
        outputs: { outPosition: { id: 'initial_out', label: 'Out Position', socket: vec3 } },
        inputs: {},
        controls: {},
        position: { x: 0, y: 0 },
      },
      {
        id: 'sphere',
        name: 'SdSphere',
        outputs: { outDistance: { id: 'sphere_out', label: 'Out Distance', socket: scalar } },
        inputs: {
          position: { id: 'sphere_in', label: 'Position', socket: vec3 },
          radius: { id: 'sphere_radius', label: 'Radius', socket: scalar },
        },
        controls: {},
        position: { x: 0, y: 0 },
      },
      {
        id: 'out',
        name: 'OutUnion',
        outputs: {},
        inputs: { in1: { id: 'out_in', label: 'In Scalar<float>', socket: scalar } },
        controls: {},
        position: { x: 0, y: 0 },
      },
      {
        id: 'hitPos',
        name: 'RaymarchHitPosition',
        outputs: { outPosition: { id: 'hitPos_out', label: 'Out Position', socket: vec4 } },
        inputs: {},
        controls: {},
        position: { x: 0, y: 0 },
      },
      {
        id: 'hitNormal',
        name: 'RaymarchHitNormal',
        outputs: { outNormal: { id: 'hitNormal_out', label: 'Out Normal', socket: vec3 } },
        inputs: {},
        controls: {},
        position: { x: 0, y: 0 },
      },
      {
        id: 'pbr',
        name: 'PbrShader',
        outputs: { outColor: { id: 'pbr_out', label: 'Out Color', socket: vec4 } },
        inputs: {
          positionInWorld: { id: 'pbr_position', label: 'In Position', socket: vec4 },
          normalInWorld: { id: 'pbr_normal', label: 'In Normal', socket: vec3 },
        },
        controls: { shaderStage: { value: 'Neutral' } },
        position: { x: 0, y: 0 },
      },
      {
        id: 'outShading',
        name: 'OutShadingColor',
        outputs: {},
        inputs: { value: { id: 'outShading_in', label: 'In Color', socket: vec4 } },
        controls: {},
        position: { x: 0, y: 0 },
      },
    ],
    connections: [
      { id: 'c1', from: { id: 'initial', portName: 'outPosition' }, to: { id: 'sphere', portName: 'position' } },
      { id: 'c2', from: { id: 'sphere', portName: 'outDistance' }, to: { id: 'out', portName: 'in1' } },
      { id: 'c3', from: { id: 'hitPos', portName: 'outPosition' }, to: { id: 'pbr', portName: 'positionInWorld' } },
      { id: 'c4', from: { id: 'hitNormal', portName: 'outNormal' }, to: { id: 'pbr', portName: 'normalInWorld' } },
      { id: 'c5', from: { id: 'pbr', portName: 'outColor' }, to: { id: 'outShading', portName: 'value' } },
    ],
  };
}

test('creates the shadow caster materials with the distance-only shader', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
  });

  const materials = MaterialHelper.createNodeBasedRaymarchingShadowMaterials(engine, createSphereGraph());
  expect(materials).toBeDefined();
  const { regular, paraboloidFront, paraboloidBack } = materials!;
  expect(regular).toBeDefined();
  expect(paraboloidFront).toBeDefined();
  expect(paraboloidBack).toBeDefined();

  // The caster materials are not lit and do not receive shadows.
  for (const material of [regular!, paraboloidFront!, paraboloidBack!]) {
    expect(material.getShaderDefines().has('RN_IS_LIGHTING')).toBe(false);
    expect(material.getShaderDefines().has('RN_USE_PBR')).toBe(false);
    expect(material.getShaderDefines().has('RN_USE_SHADOW_MAPPING')).toBe(false);
  }

  // Only the paraboloid materials expose the point light parameters.
  expect(regular!._allFieldsInfo.has('lightIndex')).toBe(false);
  expect(regular!._allFieldsInfo.has('shadowFarPlane')).toBe(false);
  for (const material of [paraboloidFront!, paraboloidBack!]) {
    expect(material._allFieldsInfo.has('lightIndex')).toBe(true);
    expect(material._allFieldsInfo.has('shadowFarPlane')).toBe(true);
  }

  // The hemispheres write disjoint channels; the regular target is RG16F.
  expect(regular!.colorWriteMask).toEqual([true, true, false, false]);
  expect(paraboloidFront!.colorWriteMask).toEqual([true, true, false, false]);
  expect(paraboloidBack!.colorWriteMask).toEqual([false, false, true, true]);

  const regularCode: string = (regular! as any)._materialContent.pixelShaderityObject.code;
  expect(regularCode).toContain('gl_FragDepth');
  expect(regularCode).toContain('map(ro + rd * t)');

  const frontCode: string = (paraboloidFront! as any)._materialContent.pixelShaderityObject.code;
  expect(frontCode).toContain('get_lightIndex');
  expect(frontCode).toContain('get_lightPosition');
  expect(frontCode).toContain('get_shadowFarPlane');
  expect(frontCode).toContain('gl_FragDepth');

  // The shadow shader only emits the distance subgraph: the OutShadingColor section and
  // its per-object shade function are not generated, while the visible material has them.
  expect(regularCode).not.toContain('outShadingColor');
  expect(regularCode).not.toContain('shade_');
  const visibleResult = MaterialHelper.createNodeBasedRaymarchingCustomMaterial(engine, createSphereGraph());
  expect(visibleResult).toBeDefined();
  const visibleCode: string = (visibleResult!.material as any)._materialContent.pixelShaderityObject.code;
  expect(visibleCode).toContain('outShadingColor');
  expect(visibleCode).toContain('shade_');
});

test('collectRrnJson with castShadowOnly excludes non-casting components', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
  });

  const castingEntity = createRaymarchingEntity(engine);
  const castingComponent = castingEntity.getRaymarching();
  castingComponent.sdfShapeType = SdfShapeType.Sphere;
  const nonCastingEntity = createRaymarchingEntity(engine);
  const nonCastingComponent = nonCastingEntity.getRaymarching();
  nonCastingComponent.sdfShapeType = SdfShapeType.Sphere;
  nonCastingComponent.castShadow = false;

  const allJson = MaterialHelper.collectRrnJson(engine);
  const castShadowJson = MaterialHelper.collectRrnJson(engine, { castShadowOnly: true });

  const castingPrefix = `comp${castingComponent.componentSID}_`;
  const nonCastingPrefix = `comp${nonCastingComponent.componentSID}_`;
  expect(allJson.nodes.some(node => node.id.startsWith(nonCastingPrefix))).toBe(true);
  expect(castShadowJson.nodes.some(node => node.id.startsWith(castingPrefix))).toBe(true);
  expect(castShadowJson.nodes.some(node => node.id.startsWith(nonCastingPrefix))).toBe(false);
});
