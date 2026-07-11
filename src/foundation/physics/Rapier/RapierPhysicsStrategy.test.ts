import type { Config } from '../../core/Config';
import { PhysicsShape } from '../../definitions/PhysicsShapeType';
import type { ISceneGraphEntity } from '../../helpers';
import { Quaternion, Vector3 } from '../../math';
import type { PhysicsPropertyInner } from '../PhysicsProperty';
import { type RapierPhysicsModuleLike, RapierPhysicsStrategy } from './RapierPhysicsStrategy';

class FakeRigidBodyDesc {
  translation = { x: 0, y: 0, z: 0 };
  rotation = { x: 0, y: 0, z: 0, w: 1 };
  linearVelocity = { x: 0, y: 0, z: 0 };
  angularVelocity = { x: 0, y: 0, z: 0 };
  gravityScale = 1;

  constructor(readonly kind: 'dynamic' | 'fixed' | 'kinematic' = 'dynamic') {}

  setTranslation(x: number, y: number, z: number): FakeRigidBodyDesc {
    this.translation = { x, y, z };
    return this;
  }

  setRotation(rotation: { x: number; y: number; z: number; w: number }): FakeRigidBodyDesc {
    this.rotation = rotation;
    return this;
  }

  setLinvel(x: number, y: number, z: number): FakeRigidBodyDesc {
    this.linearVelocity = { x, y, z };
    return this;
  }

  setAngvel(velocity: { x: number; y: number; z: number }): FakeRigidBodyDesc {
    this.angularVelocity = { ...velocity };
    return this;
  }

  setGravityScale(factor: number): FakeRigidBodyDesc {
    this.gravityScale = factor;
    return this;
  }
}

class FakeColliderDesc {
  density = 0;
  friction = 0;
  restitution = 0;
  translation = { x: 0, y: 0, z: 0 };
  rotation = { x: 0, y: 0, z: 0, w: 1 };

  constructor(
    readonly type: 'ball' | 'cuboid' | 'capsule' | 'cylinder',
    readonly size: number[]
  ) {}

  setDensity(density: number): FakeColliderDesc {
    this.density = density;
    return this;
  }

  setFriction(friction: number): FakeColliderDesc {
    this.friction = friction;
    return this;
  }

  setRestitution(restitution: number): FakeColliderDesc {
    this.restitution = restitution;
    return this;
  }

  setTranslation(x: number, y: number, z: number): FakeColliderDesc {
    this.translation = { x, y, z };
    return this;
  }

  setRotation(rotation: { x: number; y: number; z: number; w: number }): FakeColliderDesc {
    this.rotation = rotation;
    return this;
  }
}

class FakeRigidBody {
  translationValue: { x: number; y: number; z: number };
  rotationValue: { x: number; y: number; z: number; w: number };

  constructor(desc: FakeRigidBodyDesc) {
    this.translationValue = { ...desc.translation };
    this.rotationValue = { ...desc.rotation };
    this.kind = desc.kind;
    this.linearVelocity = { ...desc.linearVelocity };
    this.angularVelocity = { ...desc.angularVelocity };
    this.gravityScale = desc.gravityScale;
  }

  readonly kind: 'dynamic' | 'fixed' | 'kinematic';
  readonly linearVelocity: { x: number; y: number; z: number };
  readonly angularVelocity: { x: number; y: number; z: number };
  readonly gravityScale: number;

  translation() {
    return this.translationValue;
  }

  rotation() {
    return this.rotationValue;
  }

  setTranslation(translation: { x: number; y: number; z: number }, _wakeUp: boolean): void {
    this.translationValue = { ...translation };
  }

  setRotation(rotation: { x: number; y: number; z: number; w: number }, _wakeUp: boolean): void {
    this.rotationValue = { ...rotation };
  }
}

class FakeWorld {
  bodies: FakeRigidBody[] = [];
  colliders: FakeColliderDesc[] = [];
  removedBodies = 0;

  constructor(readonly gravity: { x: number; y: number; z: number }) {
    lastWorld = this;
  }

  step(): void {
    for (const body of this.bodies) {
      body.translationValue = {
        x: body.translationValue.x,
        y: body.translationValue.y - 1,
        z: body.translationValue.z,
      };
    }
  }

  createRigidBody(desc: FakeRigidBodyDesc): FakeRigidBody {
    const body = new FakeRigidBody(desc);
    this.bodies.push(body);
    return body;
  }

  createCollider(desc: FakeColliderDesc, _rigidBody?: FakeRigidBody): FakeColliderDesc {
    this.colliders.push(desc);
    return desc;
  }

  removeRigidBody(rigidBody: FakeRigidBody): void {
    this.removedBodies++;
    this.bodies = this.bodies.filter(body => body !== rigidBody);
  }
}

let lastWorld: FakeWorld | undefined;

function createFakeRapier(onInit?: () => void): RapierPhysicsModuleLike {
  return {
    init: () => {
      onInit?.();
    },
    World: FakeWorld,
    RigidBodyDesc: {
      dynamic: () => new FakeRigidBodyDesc('dynamic'),
      fixed: () => new FakeRigidBodyDesc('fixed'),
      kinematicPositionBased: () => new FakeRigidBodyDesc('kinematic'),
    },
    ColliderDesc: {
      cuboid: (x: number, y: number, z: number) => new FakeColliderDesc('cuboid', [x, y, z]),
      ball: (radius: number) => new FakeColliderDesc('ball', [radius]),
      capsule: (halfHeight: number, radius: number) => new FakeColliderDesc('capsule', [halfHeight, radius]),
      cylinder: (halfHeight: number, radius: number) => new FakeColliderDesc('cylinder', [halfHeight, radius]),
    },
  };
}

function createSceneGraphEntity() {
  const state = {
    position: Vector3.zero(),
    rotation: Quaternion.identity(),
  };

  return {
    entity: {
      getSceneGraph: () => ({
        get position() {
          return state.position;
        },
        eulerAngles: Vector3.zero(),
        scale: Vector3.one(),
        getQuaternionRecursively: () => state.rotation,
        setPositionWithoutPhysics: (position: Vector3) => {
          state.position = position;
        },
        setRotationWithoutPhysics: (rotation: Quaternion) => {
          state.rotation = rotation;
        },
      }),
    } as unknown as ISceneGraphEntity,
    state,
  };
}

function createPhysicsProperty(type = PhysicsShape.Box): PhysicsPropertyInner {
  return {
    type,
    size: Vector3.fromCopy3(2, 4, 6),
    position: Vector3.fromCopy3(1, 3, 5),
    rotation: Vector3.fromCopy3(0, 0, 0),
    move: true,
    density: 2,
    friction: 0.4,
    restitution: 0.6,
  };
}

test('RapierPhysicsStrategy initializes from an externally injected module', async () => {
  let initCalled = false;
  await RapierPhysicsStrategy.initialize(
    createFakeRapier(() => {
      initCalled = true;
    })
  );

  expect(initCalled).toBe(true);
  expect(RapierPhysicsStrategy.isInitialized).toBe(true);
  expect(lastWorld?.gravity.x).toBe(0);
  expect(lastWorld?.gravity.y).toBeCloseTo(-9.8);
  expect(lastWorld?.gravity.z).toBe(0);
});

test('RapierPhysicsStrategy syncs Rapier body transforms to the scene graph entity', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const strategy = new RapierPhysicsStrategy();
  const { entity, state } = createSceneGraphEntity();

  strategy.setShape(createPhysicsProperty(), entity);
  RapierPhysicsStrategy.update();
  strategy.update({} as Config);

  expect(state.position.isEqual(Vector3.fromCopy3(1, 2, 5))).toBe(true);
});

test('RapierPhysicsStrategy recreates the collider when scale changes', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const strategy = new RapierPhysicsStrategy();
  const { entity } = createSceneGraphEntity();

  strategy.setShape(createPhysicsProperty(), entity);
  strategy.setScale(Vector3.fromCopy3(2, 3, 4));

  expect(lastWorld).toBeDefined();
  const world = lastWorld!;
  expect(world.removedBodies).toBe(1);
  expect(world.colliders[world.colliders.length - 1]?.size).toEqual([2, 6, 12]);
});

test('RapierPhysicsStrategy applies absolute initial scale to a collider', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const strategy = new RapierPhysicsStrategy();
  const { entity } = createSceneGraphEntity();

  strategy.setShape(createPhysicsProperty(), entity, Vector3.fromCopy3(-2, 3, -4));

  expect(lastWorld?.colliders[0]?.size).toEqual([2, 6, 12]);
});

test('RapierPhysicsStrategy disables and recreates a collider across zero scale', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const strategy = new RapierPhysicsStrategy();
  const { entity } = createSceneGraphEntity();
  strategy.setShape(createPhysicsProperty(), entity);
  const world = lastWorld!;

  strategy.setScale(Vector3.fromCopy3(0, 1, 1));
  expect(world.removedBodies).toBe(1);
  expect(world.colliders).toHaveLength(1);

  strategy.setScale(Vector3.fromCopy3(2, 3, 4));
  expect(world.colliders).toHaveLength(2);
  expect(world.colliders[1]?.size).toEqual([2, 6, 12]);
});

test('RapierPhysicsStrategy consumes a generic shape instance with a local transform', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const strategy = new RapierPhysicsStrategy();
  const { entity } = createSceneGraphEntity();

  strategy.setShapeInstance(
    {
      shape: { type: 'box', size: Vector3.fromCopy3(2, 4, 6) },
      localPosition: Vector3.fromCopy3(1, 2, 3),
      localRotation: Quaternion.identity(),
    },
    { move: false, density: 1 },
    { friction: 0.5, restitution: 0.1 },
    entity,
    Vector3.fromCopy3(2, 3, 4)
  );

  expect(lastWorld?.colliders[0]?.size).toEqual([2, 6, 12]);
  expect(lastWorld?.colliders[0]?.translation).toEqual({ x: 2, y: 6, z: 12 });
});

test('RapierPhysicsStrategy converts cylinder and capsule shapes conservatively', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const { entity } = createSceneGraphEntity();
  const cylinder = new RapierPhysicsStrategy();
  cylinder.setShapeInstance(
    {
      shape: { type: 'cylinder', height: 0.5, radiusBottom: 0.25, radiusTop: 0.5 },
      localPosition: Vector3.zero(),
      localRotation: Quaternion.identity(),
    },
    { move: false, density: 1 },
    { friction: 0.5, restitution: 0 },
    entity,
    Vector3.fromCopy3(2, 3, 4)
  );
  const capsule = new RapierPhysicsStrategy();
  capsule.setShapeInstance(
    {
      shape: { type: 'capsule', height: 1, radiusBottom: 0.2, radiusTop: 0.3 },
      localPosition: Vector3.zero(),
      localRotation: Quaternion.identity(),
    },
    { move: false, density: 1 },
    { friction: 0.5, restitution: 0 },
    entity,
    Vector3.fromCopy3(2, 3, 4)
  );

  expect(lastWorld?.colliders[0]?.type).toBe('cylinder');
  expect(lastWorld?.colliders[0]?.size).toEqual([0.75, 2]);
  expect(lastWorld?.colliders[1]?.type).toBe('capsule');
  expect(lastWorld?.colliders[1]?.size[0]).toBeCloseTo(1.5);
  expect(lastWorld?.colliders[1]?.size[1]).toBeCloseTo(1.2);
});

test('RapierPhysicsStrategy creates one body with multiple colliders and rebuilds them together', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const strategy = new RapierPhysicsStrategy();
  const { entity } = createSceneGraphEntity();
  const bindings = [
    {
      shape: {
        shape: { type: 'box' as const, size: Vector3.fromCopy3(2, 4, 6) },
        localPosition: Vector3.fromCopy3(1, 2, 3),
        localRotation: Quaternion.identity(),
      },
      body: { move: false, density: 1 },
      collider: { friction: 0.2, restitution: 0.1 },
    },
    {
      shape: {
        shape: { type: 'sphere' as const, radius: 0.5 },
        localPosition: Vector3.fromCopy3(-1, 0, 0),
        localRotation: Quaternion.identity(),
      },
      body: { move: false, density: 2 },
      collider: { friction: 0.4, restitution: 0.3 },
    },
    {
      shape: {
        shape: { type: 'capsule' as const, height: 1, radiusBottom: 0.25, radiusTop: 0.25 },
        localPosition: Vector3.zero(),
        localRotation: Quaternion.identity(),
      },
      body: { move: false, density: 3 },
      collider: { friction: 0.6, restitution: 0.5 },
    },
  ];

  strategy.setShapeInstances(bindings, entity);
  const world = lastWorld!;
  expect(world.bodies).toHaveLength(1);
  expect(world.colliders).toHaveLength(3);
  expect(world.colliders.map(collider => collider.density)).toEqual([1, 2, 3]);
  expect(world.colliders.map(collider => collider.friction)).toEqual([0.2, 0.4, 0.6]);
  expect(world.colliders[0].translation).toEqual({ x: 1, y: 2, z: 3 });

  strategy.setScale(Vector3.fromCopy3(2, 3, 4));
  expect(world.removedBodies).toBe(1);
  expect(world.bodies).toHaveLength(1);
  expect(world.colliders).toHaveLength(6);
  expect(world.colliders[3].size).toEqual([2, 6, 12]);
  expect(world.colliders[3].translation).toEqual({ x: 2, y: 6, z: 12 });

  const bodyBeforeInvalidUpdate = world.bodies[0];
  expect(() =>
    strategy.setShapeInstances([bindings[0], { ...bindings[1], body: { ...bindings[1].body, move: true } }], entity)
  ).toThrow('same body.move');
  expect(world.bodies[0]).toBe(bodyBeforeInvalidUpdate);
  expect(world.removedBodies).toBe(1);

  strategy.clearShapeInstances();
  expect(world.bodies).toHaveLength(0);
  expect(world.removedBodies).toBe(2);
});

test('RapierPhysicsStrategy creates a position-based kinematic compound body', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const strategy = new RapierPhysicsStrategy();
  const { entity } = createSceneGraphEntity();

  strategy.setShapeInstances(
    [
      {
        shape: {
          shape: { type: 'box', size: Vector3.one() },
          localPosition: Vector3.zero(),
          localRotation: Quaternion.identity(),
        },
        body: { move: true, isKinematic: true, density: 1 },
        collider: { friction: 0.5, restitution: 0 },
      },
    ],
    entity
  );

  expect(lastWorld?.bodies[0].kind).toBe('kinematic');
});

test('RapierPhysicsStrategy applies explicit total mass, local velocities, and gravity factor', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const strategy = new RapierPhysicsStrategy();
  const { entity, state } = createSceneGraphEntity();
  state.rotation = Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 1, 0), Math.PI / 2);
  const box = {
    shape: { type: 'box' as const, size: Vector3.one() },
    localPosition: Vector3.zero(),
    localRotation: Quaternion.identity(),
  };

  strategy.setShapeInstances(
    [
      { shape: box, body: { move: true, density: 99 }, collider: { friction: 0.5, restitution: 0 } },
      {
        shape: { ...box, localPosition: Vector3.fromCopy3(2, 0, 0) },
        body: { move: true, density: 99 },
        collider: { friction: 0.5, restitution: 0 },
      },
    ],
    entity,
    Vector3.one(),
    {
      move: true,
      mass: 10,
      linearVelocity: Vector3.fromCopy3(1, 0, 0),
      angularVelocity: Vector3.fromCopy3(0, 0, 2),
      gravityFactor: -0.5,
    }
  );

  expect(lastWorld?.colliders.map(collider => collider.density)).toEqual([5, 5]);
  expect(lastWorld?.bodies[0].linearVelocity.x).toBeCloseTo(0);
  expect(lastWorld?.bodies[0].linearVelocity.z).toBeCloseTo(-1);
  expect(lastWorld?.bodies[0].angularVelocity.x).toBeCloseTo(2);
  expect(lastWorld?.bodies[0].gravityScale).toBe(-0.5);
});
