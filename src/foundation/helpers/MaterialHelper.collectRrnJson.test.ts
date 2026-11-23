import { expect, test } from 'vitest';
import { createRaymarchingEntity } from '../components/Raymarching/createRaymarchingEntity';
import { ProcessApproach } from '../definitions/ProcessApproach';
import { SdfShapeType } from '../definitions/SdfShapeType';
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

function getObjectIdNodes(collected: any) {
  return collected.nodes.filter((node: any) => node.name === 'RaymarchObjectIdUniform');
}

test('collectRrnJson assigns a stable component SID based object id', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
  });
  const entityA = createRaymarchingEntity(engine);
  const entityB = createRaymarchingEntity(engine);
  entityA.getRaymarching().rrnJson = createUnionOnlyGraph();
  entityB.getRaymarching().rrnJson = createUnionOnlyGraph();

  const collected = MaterialHelper.collectRrnJson(engine) as any;
  const objectIdNodes = getObjectIdNodes(collected);
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
    // The id node of a component feeds only that component's unions and its id is
    // derived from the component SID, which is also the node id prefix.
    const sid = Number.parseInt(source.controls.name.value.replace('raymarchObjectId_', ''), 10);
    expect(source.id.startsWith(`comp${sid}_`)).toBe(true);
    expect(union.id.startsWith(`comp${sid}_`)).toBe(true);
  }

  // The ids do not change when another component is removed.
  const survivor = objectIdNodes[1];
  engine.entityRepository.deleteEntityRecursively(entityA.entityUID);
  const collectedAfterDelete = MaterialHelper.collectRrnJson(engine) as any;
  const remainingNodes = getObjectIdNodes(collectedAfterDelete);
  expect(remainingNodes).toHaveLength(1);
  expect(remainingNodes[0].controls.name.value).toBe(survivor.controls.name.value);
  expect(remainingNodes[0].id).toBe(survivor.id);
});

test('collectRrnJson passes the component world matrix to the SDF terminals for distance scaling', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
  });
  const entity = createRaymarchingEntity(engine);
  const raymarchingComponent = entity.getRaymarching();
  raymarchingComponent.sdfShapeType = SdfShapeType.Box;

  const collected = MaterialHelper.collectRrnJson(engine) as any;
  const union = collected.nodes.find((node: any) => node.name === 'OutUnion');
  expect(union).toBeDefined();
  // The terminal scales its local-space distance by the smallest axis scale of this
  // matrix, so a scaled entity no longer loses parts when it is ray marched.
  expect(union.controls.distanceCorrectionMatrices.value).toEqual([`worldMatrix_${raymarchingComponent.componentSID}`]);

  // The component's authored graph is not modified by the merged copy.
  const authoredUnion = raymarchingComponent.rrnJson.nodes.find(node => node.name === 'OutUnion');
  expect(authoredUnion?.controls?.distanceCorrectionMatrices).toBeUndefined();
});
