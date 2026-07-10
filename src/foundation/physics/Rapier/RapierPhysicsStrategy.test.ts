import type { Config } from '../../core/Config';
import { PhysicsShape } from '../../definitions/PhysicsShapeType';
import type { ISceneGraphEntity } from '../../helpers';
import { Quaternion, Vector3 } from '../../math';
import type { PhysicsPropertyInner } from '../PhysicsProperty';
import { type RapierPhysicsModuleLike, RapierPhysicsStrategy } from './RapierPhysicsStrategy';

class FakeRigidBodyDesc {
  translation = { x: 0, y: 0, z: 0 };
  rotation = { x: 0, y: 0, z: 0, w: 1 };

  setTranslation(x: number, y: number, z: number): FakeRigidBodyDesc {
    this.translation = { x, y, z };
    return this;
  }

  setRotation(rotation: { x: number; y: number; z: number; w: number }): FakeRigidBodyDesc {
    this.rotation = rotation;
    return this;
  }
}

class FakeColliderDesc {
  density = 0;
  friction = 0;
  restitution = 0;

  constructor(
    readonly type: 'ball' | 'cuboid',
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
}

class FakeRigidBody {
  translationValue: { x: number; y: number; z: number };
  rotationValue: { x: number; y: number; z: number; w: number };

  constructor(desc: FakeRigidBodyDesc) {
    this.translationValue = { ...desc.translation };
    this.rotationValue = { ...desc.rotation };
  }

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
      dynamic: () => new FakeRigidBodyDesc(),
      fixed: () => new FakeRigidBodyDesc(),
    },
    ColliderDesc: {
      cuboid: (x: number, y: number, z: number) => new FakeColliderDesc('cuboid', [x, y, z]),
      ball: (radius: number) => new FakeColliderDesc('ball', [radius]),
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
