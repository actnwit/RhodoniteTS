import { expect, test } from 'vitest';
import { createRaymarchingEntity } from '../components/Raymarching/createRaymarchingEntity';
import { ProcessApproach } from '../definitions/ProcessApproach';
import { Engine } from '../system/Engine';
import { MaterialHelper } from './MaterialHelper';

function createUnionOnlyGraph(): any {
  return {
    nodes: [
      {
        id: 'out',
        name: 'OutUnion',
        outputs: {},
        inputs: { in1: { id: 'out_in', label: 'In Scalar<float>', socket: { name: 'Scalar<float>' } } },
        controls: {},
        position: { x: 0, y: 0 },
      },
    ],
    connections: [],
  };
}

test('collectRrnJson assigns an object id to each raymarching component', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
  });
  const entityA = createRaymarchingEntity(engine);
  const entityB = createRaymarchingEntity(engine);
  entityA.getRaymarching().rrnJson = createUnionOnlyGraph();
  entityB.getRaymarching().rrnJson = createUnionOnlyGraph();

  const collected = MaterialHelper.collectRrnJson(engine) as any;
  const objectIdNodes = collected.nodes.filter((node: any) => node.name === 'RaymarchObjectIdUniform');
  expect(objectIdNodes).toHaveLength(2);
  expect(new Set(objectIdNodes.map((node: any) => node.controls.name.value)).size).toBe(2);

  const unions = collected.nodes.filter((node: any) => node.name === 'OutUnion');
  expect(unions).toHaveLength(2);
  for (const union of unions) {
    const connection = collected.connections.find(
      (conn: any) => conn.to.id === union.id && conn.to.portName === 'objectId'
    );
    expect(connection).toBeDefined();
    const source = objectIdNodes.find((node: any) => node.id === connection.from.id);
    expect(source).toBeDefined();
    // The id node of a component feeds only that component's unions.
    const componentPrefix = source.id.split('__')[0];
    expect(union.id.startsWith(componentPrefix)).toBe(true);
  }
});
