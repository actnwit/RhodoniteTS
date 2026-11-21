import Rn from '../../../../dist/esm';

function createSphereGraph(): Rn.NodeJSON {
  const initialNode = {
    id: 'initial',
    name: 'InitialPosition',
    outputs: { outPosition: { id: 'initial_out', label: 'Out Position', socket: { name: 'Vector3<float>' } } },
    inputs: {},
    controls: {},
    position: { x: 0, y: 0 },
  };
  const worldMatrixNode = {
    id: 'worldMatrix',
    name: 'SdApplyWorldMatrix',
    outputs: {
      outTransformedPosition: {
        id: 'worldMatrix_out',
        label: 'Out Transformed Position',
        socket: { name: 'Vector3<float>' },
      },
    },
    inputs: {
      position: { id: 'worldMatrix_in', label: 'Position', socket: { name: 'Vector3<float>' } },
    },
    controls: {},
    position: { x: 0, y: 0 },
  };
  const sphereNode = {
    id: 'sphere',
    name: 'SdSphere',
    outputs: { outDistance: { id: 'sphere_out', label: 'Out Distance', socket: { name: 'Scalar<float>' } } },
    inputs: {
      position: { id: 'sphere_in', label: 'Position', socket: { name: 'Vector3<float>' } },
      radius: { id: 'sphere_radius', label: 'Radius', socket: { name: 'Scalar<float>' } },
    },
    controls: {},
    position: { x: 0, y: 0 },
  };
  const outNode = {
    id: 'out',
    name: 'OutUnion',
    outputs: {},
    inputs: { in1: { id: 'out_in', label: 'In Scalar<float>', socket: { name: 'Scalar<float>' } } },
    controls: {},
    position: { x: 0, y: 0 },
  };

  return {
    nodes: [initialNode, worldMatrixNode, sphereNode, outNode] as Rn.NodeJSON['nodes'],
    connections: [
      {
        id: 'c1',
        from: { id: 'initial', portName: 'outPosition' },
        to: { id: 'worldMatrix', portName: 'position' },
      },
      {
        id: 'c2',
        from: { id: 'worldMatrix', portName: 'outTransformedPosition' },
        to: { id: 'sphere', portName: 'position' },
      },
      {
        id: 'c3',
        from: { id: 'sphere', portName: 'outDistance' },
        to: { id: 'out', portName: 'in1' },
      },
    ],
  };
}

describe('Raymarching AABB integration', async () => {
  const engine = await Rn.Engine.init({
    approach: Rn.ProcessApproach.None,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

  test('includes SDF bounds in the scene graph world AABB', () => {
    const entity = Rn.createRaymarchingEntity(engine);
    entity.getRaymarching().rrnJson = createSphereGraph();
    entity.getTransform().localPosition = Rn.Vector3.fromCopy3(5, 0, 0);

    const aabb = entity.getSceneGraph().worldMergedAABBWithSkeletal;
    expect(aabb.minPoint.x).toBeCloseTo(4);
    expect(aabb.minPoint.y).toBeCloseTo(-1);
    expect(aabb.minPoint.z).toBeCloseTo(-1);
    expect(aabb.maxPoint.x).toBeCloseTo(6);
    expect(aabb.maxPoint.y).toBeCloseTo(1);
    expect(aabb.maxPoint.z).toBeCloseTo(1);
  });

  test('calculates local bounds and creates a box shape', () => {
    const entity = Rn.createRaymarchingEntity(engine);
    const component = entity.getRaymarching();
    component.rrnJson = createSphereGraph();
    entity.getTransform().localPosition = Rn.Vector3.fromCopy3(5, 0, 0);

    const localAABB = component.calcLocalAABB();
    expect(localAABB).not.toBeNull();
    expect(localAABB?.minPoint.x).toBeCloseTo(-1);
    expect(localAABB?.maxPoint.x).toBeCloseTo(1);

    const shapeIndex = component.addAabbBoxShape();
    expect(shapeIndex).toBeDefined();
    const shape = entity.tryToGetShape()?.getShape(shapeIndex!);
    expect(shape?.shape.type).toBe('box');
    if (shape?.shape.type === 'box') {
      expect(shape.shape.size.x).toBeCloseTo(2);
      expect(shape.shape.size.y).toBeCloseTo(2);
      expect(shape.shape.size.z).toBeCloseTo(2);
    }
    expect(shape?.localPosition.isEqual(Rn.Vector3.zero())).toBe(true);
  });

  test('copies the SDF graph when the component is copied', () => {
    const source = Rn.createRaymarchingEntity(engine).getRaymarching();
    source.rrnJson = createSphereGraph();

    const target = Rn.createRaymarchingEntity(engine).getRaymarching();
    target._shallowCopyFrom(source);

    expect(target.rrnJson.nodes).toHaveLength(4);
    expect(target.rrnJson).not.toBe(source.rrnJson);
  });

  test('casts a world ray against the SDF', () => {
    const entity = Rn.createRaymarchingEntity(engine);
    const component = entity.getRaymarching();
    component.rrnJson = createSphereGraph();
    entity.getTransform().localPosition = Rn.Vector3.fromCopy3(5, 0, 0);

    const hit = component.castRay(Rn.Vector3.fromCopy3(5, 0, 5), Rn.Vector3.fromCopy3(0, 0, -1));
    expect(hit).toBeDefined();
    expect(hit?.t).toBeCloseTo(4);
    expect(hit?.position.z).toBeCloseTo(1);

    const miss = component.castRay(Rn.Vector3.fromCopy3(8, 0, 5), Rn.Vector3.fromCopy3(0, 0, -1));
    expect(miss).toBeUndefined();
  });
});
