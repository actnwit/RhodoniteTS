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

function createSphereGraphWithoutWorldMatrix(): Rn.NodeJSON {
  const initialNode = {
    id: 'initial',
    name: 'InitialPosition',
    outputs: { outPosition: { id: 'initial_out', label: 'Out Position', socket: { name: 'Vector3<float>' } } },
    inputs: {},
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
    nodes: [initialNode, sphereNode, outNode] as Rn.NodeJSON['nodes'],
    connections: [
      {
        id: 'c1',
        from: { id: 'initial', portName: 'outPosition' },
        to: { id: 'sphere', portName: 'position' },
      },
      {
        id: 'c2',
        from: { id: 'sphere', portName: 'outDistance' },
        to: { id: 'out', portName: 'in1' },
      },
    ],
  };
}

function createSphereGraphWithRadius(radius: number): Rn.NodeJSON {
  const graph = createSphereGraph();
  const radiusNode = {
    id: 'radius',
    name: 'ConstantScalarFloat',
    outputs: { out1: { id: 'radius_out', label: 'Scalar<float> Out', socket: { name: 'Scalar<float>' } } },
    inputs: {},
    controls: { in1: { value: radius } },
    position: { x: 0, y: 0 },
  };
  const sphere = graph.nodes.find(node => node.name === 'SdSphere');
  if (sphere == null) {
    throw new Error('Sphere node is missing.');
  }
  graph.nodes.push(radiusNode as Rn.NodeJSON['nodes'][number]);
  graph.connections.push({
    id: 'c_radius',
    from: { id: 'radius', portName: 'out1' },
    to: { id: sphere.id, portName: 'radius' },
  });
  return graph;
}

function createInfiniteTubeGraph(): Rn.NodeJSON {
  const initialNode = {
    id: 'initial',
    name: 'InitialPosition',
    outputs: { outPosition: { id: 'initial_out', label: 'Out Position', socket: { name: 'Vector3<float>' } } },
    inputs: {},
    controls: {},
    position: { x: 0, y: 0 },
  };
  const tubeNode = {
    id: 'tube',
    name: 'SdTubeX',
    outputs: { outDistance: { id: 'tube_out', label: 'Out Distance', socket: { name: 'Scalar<float>' } } },
    inputs: {
      position: { id: 'tube_in', label: 'Position', socket: { name: 'Vector3<float>' } },
      width: { id: 'tube_width', label: 'Width', socket: { name: 'Scalar<float>' } },
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
    nodes: [initialNode, tubeNode, outNode] as Rn.NodeJSON['nodes'],
    connections: [
      {
        id: 'c1',
        from: { id: 'initial', portName: 'outPosition' },
        to: { id: 'tube', portName: 'position' },
      },
      {
        id: 'c2',
        from: { id: 'tube', portName: 'outDistance' },
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

  test('creates an exact sphere collider for a single sphere SDF', () => {
    const entity = Rn.createRaymarchingEntity(engine);
    const component = entity.getRaymarching();
    component.rrnJson = createSphereGraph();

    const sphere = component.calcLocalSphereCollider();
    expect(sphere).not.toBeNull();
    expect(sphere?.center.isEqual(Rn.Vector3.zero())).toBe(true);
    expect(sphere?.radius).toBeCloseTo(1);

    const result = component.addColliderShape();
    expect(result?.shapeType).toBe('sphere');
    if (result?.shapeType !== 'sphere') {
      return;
    }
    const shape = entity.tryToGetShape()?.getShape(result.shapeIndex);
    expect(shape?.shape.type).toBe('sphere');
    if (shape?.shape.type === 'sphere') {
      expect(shape.shape.radius).toBeCloseTo(1);
    }
    expect(shape?.localPosition.isEqual(Rn.Vector3.zero())).toBe(true);
  });

  test('falls back to a box without SdApplyWorldMatrix', () => {
    const entity = Rn.createRaymarchingEntity(engine);
    const component = entity.getRaymarching();
    component.rrnJson = createSphereGraphWithoutWorldMatrix();

    expect(component.calcLocalSphereCollider()).toBeNull();
    const result = component.addColliderShape();
    expect(result?.shapeType).toBe('box');
    if (result?.shapeType !== 'box') {
      return;
    }
    expect(result.aabb.sizeX).toBeCloseTo(2);
    const shape = entity.tryToGetShape()?.getShape(result.shapeIndex);
    expect(shape?.shape.type).toBe('box');
  });

  test('updates generated collider shapes when the graph changes', () => {
    const entity = Rn.createRaymarchingEntity(engine);
    const component = entity.getRaymarching();
    component.rrnJson = createSphereGraphWithRadius(1);

    const result = component.addColliderShape();
    expect(result?.shapeType).toBe('sphere');
    if (result?.shapeType !== 'sphere') {
      return;
    }

    const shapeComponent = entity.tryToGetShape();
    expect(shapeComponent).toBeDefined();
    if (shapeComponent == null) {
      return;
    }

    const physicsEntity = entity.engine.entityRepository.addComponentToEntity(Rn.PhysicsComponent, entity);
    const physics = physicsEntity.getPhysics();
    const bindingCalls: Array<readonly Rn.PhysicsShapeInstanceBinding[]> = [];
    physics.setStrategy({
      update: () => {},
      setShapeInstances: bindings => {
        bindingCalls.push(bindings);
      },
      clearShapeInstances: () => {},
    });
    physics.bindShape({
      shapeComponent,
      shapeIndex: result.shapeIndex,
      body: { move: false, density: 1 },
      collider: { friction: 0.5, restitution: 0 },
    });

    expect(component.updateColliderShapes()).toBe(0);

    component.rrnJson = createSphereGraphWithRadius(3);
    expect(component.updateColliderShapes()).toBe(1);

    const updated = shapeComponent.getShape(result.shapeIndex);
    expect(updated?.shape.type).toBe('sphere');
    if (updated?.shape.type === 'sphere') {
      expect(updated.shape.radius).toBeCloseTo(3);
    }
    const latestBinding = bindingCalls.at(-1)?.[0];
    expect(latestBinding?.shape.shape.type).toBe('sphere');
    if (latestBinding?.shape.shape.type === 'sphere') {
      expect(latestBinding.shape.shape.radius).toBeCloseTo(3);
    }

    component.rrnJson = createInfiniteTubeGraph();
    expect(component.updateColliderShapes()).toBe(1);
    expect(shapeComponent.getShape(result.shapeIndex)).toBeUndefined();
    expect(physics.shapeBindingCount).toBe(0);
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
