import { expect, test } from 'vitest';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { SdfShapeType, type SdfShapeTypeEnum } from '../../definitions/SdfShapeType';
import { Engine } from '../../system/Engine';
import { createRaymarchingEntity } from './createRaymarchingEntity';
import type { RaymarchingComponent } from './RaymarchingComponent';

const presetCases: Array<[SdfShapeTypeEnum, string]> = [
  [SdfShapeType.Sphere, 'SdSphere'],
  [SdfShapeType.Box, 'SdBox'],
  [SdfShapeType.Torus, 'SdTorus'],
  [SdfShapeType.Capsule, 'SdCapsule'],
  [SdfShapeType.RoundBox, 'SdRoundBox'],
];

const presetNodeNames = presetCases.map(([, nodeName]) => nodeName);

async function createRaymarchingComponent(): Promise<RaymarchingComponent> {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
    notToDisplayRnInfoAtInit: true,
  });
  return createRaymarchingEntity(engine).getRaymarching();
}

test('sdfShapeType builds a template graph around the selected preset SDF node', async () => {
  const component = await createRaymarchingComponent();

  for (const [shapeType, nodeName] of presetCases) {
    component.sdfShapeType = shapeType;

    // Each preset replaces the previous SDF node instead of accumulating them.
    const presetNodes = component.rrnJson.nodes.filter(node => presetNodeNames.includes(node.name));
    expect(presetNodes).toHaveLength(1);
    const presetNode = presetNodes[0];
    expect(presetNode.name).toBe(nodeName);

    // The preset receives the world-transformed position and feeds the terminal.
    const incoming = component.rrnJson.connections.find(
      connection => connection.to.id === presetNode.id && connection.to.portName === 'position'
    );
    expect(incoming?.from.portName).toBe('outTransformedPosition');
    const outgoing = component.rrnJson.connections.find(
      connection => connection.from.id === presetNode.id && connection.from.portName === 'outDistance'
    );
    expect(outgoing?.to.portName).toBe('in1');

    // A finite AABB is what collider creation and the shadow volume fit rely on.
    expect(component.calcLocalAABB()).not.toBeNull();
  }
});
