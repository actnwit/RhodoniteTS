import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { Matrix44, Quaternion, Vector3 } from '../../math';

let lastProperty: any;
const bodies: FakeBody[] = [];

class FakeBody {
  removeCount = 0;

  constructor(private property: any) {}
  getPosition() {
    return { x: this.property.pos[0], y: this.property.pos[1], z: this.property.pos[2] };
  }
  getQuaternion() {
    const rotation = Quaternion.fromMatrix(
      Matrix44.rotateXYZ(
        (this.property.rot[0] * Math.PI) / 180,
        (this.property.rot[1] * Math.PI) / 180,
        (this.property.rot[2] * Math.PI) / 180
      )
    );
    return { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w };
  }
  remove() {
    this.removeCount++;
  }
}

class FakeWorld {
  add(property: any) {
    lastProperty = property;
    const body = new FakeBody(property);
    bodies.push(body);
    return body;
  }
  step() {}
}

(globalThis as any).OIMO = { World: FakeWorld };

test('OimoPhysicsStrategy maps a local generic shape pose to and from the body pose', async () => {
  const { OimoPhysicsStrategy } = await import('./OimoPhysicsStrategy');
  const state = {
    position: Vector3.fromCopy3(10, 0, 0),
    rotation: Quaternion.identity(),
  };
  const entity = {
    getSceneGraph: () => ({
      get position() {
        return state.position;
      },
      getQuaternionRecursively: () => state.rotation,
      setPositionWithoutPhysics: (position: Vector3) => {
        state.position = position;
      },
      setRotationWithoutPhysics: (rotation: Quaternion) => {
        state.rotation = rotation;
      },
    }),
  } as unknown as ISceneGraphEntity;
  const strategy = new OimoPhysicsStrategy();

  strategy.setShapeInstance(
    {
      shape: { type: 'box', size: Vector3.fromCopy3(1, 1, 1) },
      localPosition: Vector3.fromCopy3(1, 2, 3),
      localRotation: Quaternion.identity(),
    },
    { move: false, density: 1 },
    { friction: 0.5, restitution: 0 },
    entity,
    Vector3.fromCopy3(2, 3, 4)
  );

  expect(lastProperty.pos).toEqual([12, 6, 12]);
  expect(lastProperty.size).toEqual([2, 3, 4]);
  strategy.update({} as never);
  expect(state.position.isEqual(Vector3.fromCopy3(10, 0, 0))).toBe(true);
});

test('OimoPhysicsStrategy preserves mirrored local shape offsets', async () => {
  const { OimoPhysicsStrategy } = await import('./OimoPhysicsStrategy');
  const state = {
    position: Vector3.fromCopy3(10, 0, 0),
    rotation: Quaternion.identity(),
  };
  const entity = {
    getSceneGraph: () => ({
      get position() {
        return state.position;
      },
      getQuaternionRecursively: () => state.rotation,
      setPositionWithoutPhysics: (position: Vector3) => {
        state.position = position;
      },
      setRotationWithoutPhysics: (rotation: Quaternion) => {
        state.rotation = rotation;
      },
    }),
  } as unknown as ISceneGraphEntity;
  const strategy = new OimoPhysicsStrategy();

  strategy.setShapeInstance(
    {
      shape: { type: 'box', size: Vector3.one() },
      localPosition: Vector3.fromCopy3(1, 2, 3),
      localRotation: Quaternion.identity(),
    },
    { move: false, density: 1 },
    { friction: 0.5, restitution: 0 },
    entity,
    Vector3.fromCopy3(-2, 3, -4)
  );

  expect(lastProperty.pos).toEqual([8, 6, -12]);
  expect(lastProperty.size).toEqual([2, 3, 4]);
  strategy.update({} as never);
  expect(state.position.x).toBeCloseTo(10);
  expect(state.position.y).toBeCloseTo(0);
  expect(state.position.z).toBeCloseTo(0);
});

test('OimoPhysicsStrategy converts a generic cylinder and rejects capsules explicitly', async () => {
  const { OimoPhysicsStrategy } = await import('./OimoPhysicsStrategy');
  const entity = {
    getSceneGraph: () => ({
      position: Vector3.zero(),
      getQuaternionRecursively: () => Quaternion.identity(),
    }),
  } as unknown as ISceneGraphEntity;
  const pose = {
    localPosition: Vector3.zero(),
    localRotation: Quaternion.identity(),
  };
  const strategy = new OimoPhysicsStrategy();

  strategy.setShapeInstance(
    {
      shape: { type: 'cylinder', height: 2, radiusBottom: 0.25, radiusTop: 0.5 },
      ...pose,
    },
    { move: false, density: 1 },
    { friction: 0.5, restitution: 0 },
    entity,
    Vector3.fromCopy3(2, 3, 4)
  );

  expect(lastProperty.type).toBe('cylinder');
  expect(lastProperty.size).toEqual([2, 6, 2]);
  expect(() =>
    strategy.setShapeInstance(
      {
        shape: { type: 'capsule', height: 1, radiusBottom: 0.25, radiusTop: 0.25 },
        ...pose,
      },
      { move: false, density: 1 },
      { friction: 0.5, restitution: 0 },
      entity
    )
  ).toThrow('does not support capsule');
});

test('OimoPhysicsStrategy scales a rotated cylinder along its transformed axis', async () => {
  const { OimoPhysicsStrategy } = await import('./OimoPhysicsStrategy');
  const entity = {
    getSceneGraph: () => ({
      position: Vector3.zero(),
      getQuaternionRecursively: () => Quaternion.identity(),
    }),
  } as unknown as ISceneGraphEntity;
  const strategy = new OimoPhysicsStrategy();

  strategy.setShapeInstance(
    {
      shape: { type: 'cylinder', height: 2, radiusBottom: 0.5, radiusTop: 0.5 },
      localPosition: Vector3.zero(),
      localRotation: Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 0, 1), -Math.PI / 2),
    },
    { move: false, density: 1 },
    { friction: 0.5, restitution: 0 },
    entity,
    Vector3.fromCopy3(2, 1, 1)
  );

  expect(lastProperty.size[0]).toBeCloseTo(0.5);
  expect(lastProperty.size[1]).toBeCloseTo(4);
  expect(lastProperty.size[2]).toBeCloseTo(0.5);
  expect(Math.abs(lastProperty.rot[2])).toBeGreaterThan(89);
});

test('OimoPhysicsStrategy conservatively encloses a sheared box transform', async () => {
  const { OimoPhysicsStrategy } = await import('./OimoPhysicsStrategy');
  const entity = {
    getSceneGraph: () => ({
      position: Vector3.zero(),
      getQuaternionRecursively: () => Quaternion.identity(),
    }),
  } as unknown as ISceneGraphEntity;
  const strategy = new OimoPhysicsStrategy();

  strategy.setShapeInstance(
    {
      shape: { type: 'box', size: Vector3.fromCopy3(2, 2, 2) },
      localPosition: Vector3.zero(),
      localRotation: Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 0, 1), Math.PI / 4),
    },
    { move: false, density: 1 },
    { friction: 0.5, restitution: 0 },
    entity,
    Vector3.fromCopy3(2, 1, 1)
  );

  expect(lastProperty.size[0]).toBeCloseTo(4 * Math.SQRT2);
  expect(lastProperty.size[1]).toBeCloseTo(2 * Math.SQRT2);
  expect(lastProperty.size[2]).toBeCloseTo(2);
  expect(lastProperty.rot[0]).toBeCloseTo(0);
  expect(lastProperty.rot[1]).toBeCloseTo(0);
  expect(lastProperty.rot[2]).toBeCloseTo(0);
});

test('OimoPhysicsStrategy conservatively scales a generic sphere by the largest axis', async () => {
  const { OimoPhysicsStrategy } = await import('./OimoPhysicsStrategy');
  const entity = {
    getSceneGraph: () => ({
      position: Vector3.zero(),
      getQuaternionRecursively: () => Quaternion.identity(),
    }),
  } as unknown as ISceneGraphEntity;
  const strategy = new OimoPhysicsStrategy();

  strategy.setShapeInstance(
    {
      shape: { type: 'sphere', radius: 0.5 },
      localPosition: Vector3.zero(),
      localRotation: Quaternion.identity(),
    },
    { move: false, density: 1 },
    { friction: 0.5, restitution: 0 },
    entity,
    Vector3.fromCopy3(1, 3, 2)
  );

  expect(lastProperty.size).toEqual([1.5, 1.5, 1.5]);
  strategy.setScale(Vector3.fromCopy3(4, 1, 2));
  expect(lastProperty.size).toEqual([2, 2, 2]);
});

test('OimoPhysicsStrategy preserves local shape rotation when repositioned', async () => {
  const { OimoPhysicsStrategy } = await import('./OimoPhysicsStrategy');
  const entity = {
    eulerAngles: Vector3.zero(),
    getSceneGraph: () => ({
      position: Vector3.zero(),
      getQuaternionRecursively: () => Quaternion.identity(),
    }),
  } as unknown as ISceneGraphEntity;
  const strategy = new OimoPhysicsStrategy();

  strategy.setShapeInstance(
    {
      shape: { type: 'box', size: Vector3.one() },
      localPosition: Vector3.zero(),
      localRotation: Quaternion.fromCopy4(0, Math.SQRT1_2, 0, Math.SQRT1_2),
    },
    { move: false, density: 1 },
    { friction: 0.5, restitution: 0 },
    entity
  );
  const initialRotation = [...lastProperty.rot];
  strategy.setPosition(Vector3.fromCopy3(1, 2, 3));

  expect(lastProperty.pos).toEqual([1, 2, 3]);
  expect(initialRotation[1]).toBeGreaterThan(89);
  expect(lastProperty.rot[0]).toBeCloseTo(initialRotation[0]);
  expect(lastProperty.rot[1]).toBeCloseTo(initialRotation[1]);
  expect(lastProperty.rot[2]).toBeCloseTo(initialRotation[2]);
});

test('OimoPhysicsStrategy removes the previous body when replacing a shape instance', async () => {
  const { OimoPhysicsStrategy } = await import('./OimoPhysicsStrategy');
  const entity = {
    getSceneGraph: () => ({
      position: Vector3.zero(),
      getQuaternionRecursively: () => Quaternion.identity(),
    }),
  } as unknown as ISceneGraphEntity;
  const strategy = new OimoPhysicsStrategy();
  const pose = {
    localPosition: Vector3.zero(),
    localRotation: Quaternion.identity(),
  };
  bodies.length = 0;

  strategy.setShapeInstance(
    { shape: { type: 'box', size: Vector3.one() }, ...pose },
    { move: false, density: 1 },
    { friction: 0.5, restitution: 0 },
    entity
  );
  const firstBody = bodies[0];
  strategy.setShapeInstance(
    { shape: { type: 'sphere', radius: 0.5 }, ...pose },
    { move: false, density: 1 },
    { friction: 0.5, restitution: 0 },
    entity
  );

  expect(bodies).toHaveLength(2);
  expect(firstBody.removeCount).toBe(1);
  expect(bodies[1].removeCount).toBe(0);
  strategy.clearShapeInstances();
  expect(firstBody.removeCount).toBe(1);
  expect(bodies[1].removeCount).toBe(1);
});
