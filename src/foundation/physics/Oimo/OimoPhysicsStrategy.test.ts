import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { Quaternion, Vector3 } from '../../math';

let lastProperty: any;

class FakeBody {
  constructor(private property: any) {}
  getPosition() {
    return { x: this.property.pos[0], y: this.property.pos[1], z: this.property.pos[2] };
  }
  getQuaternion() {
    return { x: 0, y: 0, z: 0, w: 1 };
  }
  remove() {}
}

class FakeWorld {
  add(property: any) {
    lastProperty = property;
    return new FakeBody(property);
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
