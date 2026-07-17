import type { RnM2 } from '../../types';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Vector3 } from '../math/Vector3';
import {
  collectKhrRigidBodyGroups,
  collectKhrStaticBoxColliders,
  collectKhrStaticColliders,
  setupKhrStaticBoxColliders,
} from './KhrPhysicsImporter';

function createGltf(nodes: unknown[], extensions: Record<string, unknown>): RnM2 {
  return {
    nodes,
    extensions,
  } as unknown as RnM2;
}

test('collects shared static box shapes and applies schema defaults', () => {
  const gltf = createGltf(
    [
      {
        extensions: {
          KHR_physics_rigid_bodies: {
            collider: { geometry: { shape: 0 } },
          },
        },
      },
      {
        extensions: {
          KHR_physics_rigid_bodies: {
            collider: { geometry: { shape: 0 }, physicsMaterial: 0 },
          },
        },
      },
    ],
    {
      KHR_implicit_shapes: {
        shapes: [{ type: 'box' }],
      },
      KHR_physics_rigid_bodies: {
        physicsMaterials: [{ dynamicFriction: 0.25, restitution: 0.75 }],
      },
    }
  );

  const result = collectKhrStaticBoxColliders(gltf);

  expect(result.warnings).toEqual([]);
  expect(result.colliders).toEqual([
    {
      nodeIndex: 0,
      shapeIndex: 0,
      size: [1, 1, 1],
      dynamicFriction: 0.6,
      restitution: 0,
    },
    {
      nodeIndex: 1,
      shapeIndex: 0,
      size: [1, 1, 1],
      dynamicFriction: 0.25,
      restitution: 0.75,
    },
  ]);
});

test('applies KHR defaults for finite implicit shapes', () => {
  const gltf = createGltf(
    ['box', 'sphere', 'cylinder', 'capsule'].map((_, shape) => ({
      extensions: { KHR_physics_rigid_bodies: { collider: { geometry: { shape } } } },
    })),
    {
      KHR_implicit_shapes: {
        shapes: [{ type: 'box' }, { type: 'sphere' }, { type: 'cylinder' }, { type: 'capsule' }],
      },
    }
  );

  const result = collectKhrStaticColliders(gltf);

  expect(result.warnings).toEqual([]);
  expect(result.colliders.map(collider => collider.descriptor)).toEqual([
    { type: 'box', size: expect.objectContaining({ x: 1, y: 1, z: 1 }) },
    { type: 'sphere', radius: 0.5 },
    { type: 'cylinder', height: 0.5, radiusBottom: 0.25, radiusTop: 0.25 },
    { type: 'capsule', height: 0.5, radiusBottom: 0.25, radiusTop: 0.25 },
  ]);
});

test('preserves asymmetric radii and rejects degenerate finite shapes', () => {
  const gltf = createGltf(
    [0, 1, 2].map(shape => ({
      extensions: { KHR_physics_rigid_bodies: { collider: { geometry: { shape } } } },
    })),
    {
      KHR_implicit_shapes: {
        shapes: [
          { type: 'cylinder', cylinder: { height: 2, radiusBottom: 0, radiusTop: 1 } },
          { type: 'capsule', capsule: { height: 1, radiusBottom: 0.25, radiusTop: 0.5 } },
          { type: 'capsule', capsule: { height: 1, radiusBottom: 0, radiusTop: 0 } },
        ],
      },
    }
  );

  const result = collectKhrStaticColliders(gltf);

  expect(result.colliders.map(collider => collider.descriptor)).toEqual([
    { type: 'cylinder', height: 2, radiusBottom: 0, radiusTop: 1 },
    { type: 'capsule', height: 1, radiusBottom: 0.25, radiusTop: 0.5 },
  ]);
  expect(result.warnings[0]).toContain('invalid capsule shape');
});

test('creates shared generic shapes even when Rapier is not initialized', () => {
  const gltf = createGltf(
    [
      { extensions: { KHR_physics_rigid_bodies: { collider: { geometry: { shape: 0 } } } } },
      { extensions: { KHR_physics_rigid_bodies: { collider: { geometry: { shape: 0 } } } } },
    ],
    {
      KHR_implicit_shapes: { shapes: [{ type: 'box', box: { size: [2, 3, 4] } }] },
    }
  );
  const descriptors: unknown[] = [];
  const entities = [0, 1].map(
    () =>
      ({
        tryToGetPhysics: () => undefined,
        tryToGetShape: () => undefined,
        engine: {
          entityRepository: {
            addComponentToEntity: (_component: unknown, entity: object) => ({
              ...entity,
              getShape: () => ({
                addShape: (descriptor: unknown) => {
                  descriptors.push(descriptor);
                  return 0;
                },
              }),
            }),
          },
        },
      }) as unknown as ISceneGraphEntity
  );

  setupKhrStaticBoxColliders(gltf, entities);

  expect(descriptors).toHaveLength(2);
  expect(descriptors[0]).toBe(descriptors[1]);
});

test('skips malformed, dynamic, and unsupported collider declarations with diagnostics', () => {
  const gltf = createGltf(
    [
      {
        extensions: {
          KHR_physics_rigid_bodies: {
            collider: { geometry: { shape: 0 } },
          },
        },
      },
      {
        extensions: {
          KHR_physics_rigid_bodies: {
            motion: {},
            collider: { geometry: { shape: 1 } },
          },
        },
      },
      {
        extensions: {
          KHR_physics_rigid_bodies: {
            collider: { geometry: { shape: 2 } },
          },
        },
      },
      {
        extensions: {
          KHR_physics_rigid_bodies: {
            collider: { geometry: { shape: 99 } },
          },
        },
      },
    ],
    {
      KHR_implicit_shapes: {
        shapes: [
          { type: 'box', box: { size: [1, 0, 1] } },
          { type: 'box', box: { size: [1, 1, 1] } },
          { type: 'sphere', sphere: { radius: 1 } },
        ],
      },
    }
  );

  const result = collectKhrStaticBoxColliders(gltf);

  expect(result.colliders).toEqual([]);
  expect(result.warnings).toHaveLength(4);
  expect(result.warnings.some(warning => warning.includes('invalid box shape'))).toBe(true);
  expect(result.warnings.some(warning => warning.includes('dynamic motion'))).toBe(true);
  expect(result.warnings.some(warning => warning.includes("unsupported shape type 'sphere'"))).toBe(true);
  expect(result.warnings.some(warning => warning.includes('missing implicit shape 99'))).toBe(true);
});

test('rejects a box shape containing parameters for a different built-in shape', () => {
  const gltf = createGltf(
    [
      {
        extensions: {
          KHR_physics_rigid_bodies: {
            collider: { geometry: { shape: 0 } },
          },
        },
      },
    ],
    {
      KHR_implicit_shapes: {
        shapes: [{ type: 'box', box: { size: [1, 1, 1] }, sphere: { radius: 1 } }],
      },
    }
  );

  const result = collectKhrStaticBoxColliders(gltf);

  expect(result.colliders).toEqual([]);
  expect(result.warnings[0]).toContain('invalid box shape');
});

test('groups colliders by their nearest motion ancestor and keeps static colliders independent', () => {
  const gltf = createGltf(
    [
      {
        translation: [10, 0, 0],
        scale: [2, 2, 2],
        children: [1, 2, 3],
        extensions: { KHR_physics_rigid_bodies: { motion: { isKinematic: true, mass: 5 } } },
      },
      {
        translation: [1, 0, 0],
        extensions: { KHR_physics_rigid_bodies: { collider: { geometry: { shape: 0 } } } },
      },
      {
        translation: [0, 2, 0],
        scale: [2, 3, 4],
        extensions: { KHR_physics_rigid_bodies: { collider: { geometry: { shape: 1 } } } },
      },
      {
        translation: [0, 0, 3],
        children: [4],
        extensions: { KHR_physics_rigid_bodies: { motion: {} } },
      },
      {
        translation: [0, 1, 0],
        extensions: { KHR_physics_rigid_bodies: { collider: { geometry: { shape: 0 } } } },
      },
      {
        translation: [-2, 0, 0],
        extensions: { KHR_physics_rigid_bodies: { collider: { geometry: { shape: 0 } } } },
      },
    ],
    {
      KHR_implicit_shapes: {
        shapes: [
          { type: 'box', box: { size: [1, 1, 1] } },
          { type: 'sphere', sphere: { radius: 0.5 } },
        ],
      },
    }
  );

  const result = collectKhrRigidBodyGroups(gltf);

  expect(result.groups.map(group => group.bodyNodeIndex)).toEqual([0, 3, 5]);
  expect(result.groups[0].colliders).toHaveLength(2);
  expect(result.groups[0].motion?.isKinematic).toBe(true);
  expect(result.groups[0].motion?.mass).toBe(5);
  expect(result.groups[0].colliders[0].localPosition.isEqual(Vector3.fromCopy3(1, 0, 0))).toBe(true);
  expect(result.groups[0].colliders[1].descriptor).toEqual({ type: 'sphere', radius: 2 });
  expect(result.groups[1].colliders[0].localPosition.isEqual(Vector3.fromCopy3(0, 1, 0))).toBe(true);
  expect(result.groups[2].motion).toBeUndefined();
  expect(result.groups[2].colliders[0].localPosition.isEqual(Vector3.zero())).toBe(true);
  expect(result.warnings.some(warning => warning.includes('unsupported') && warning.includes('mass'))).toBe(false);
  expect(result.warnings.some(warning => warning.includes('non-uniform'))).toBe(true);
});

test('skips child colliders with zero body-relative scale', () => {
  const gltf = createGltf(
    [
      {
        children: [1, 2],
        extensions: { KHR_physics_rigid_bodies: { motion: {} } },
      },
      {
        scale: [1, 0, 1],
        extensions: { KHR_physics_rigid_bodies: { collider: { geometry: { shape: 0 } } } },
      },
      {
        extensions: { KHR_physics_rigid_bodies: { collider: { geometry: { shape: 0 } } } },
      },
    ],
    { KHR_implicit_shapes: { shapes: [{ type: 'box' }] } }
  );

  const result = collectKhrRigidBodyGroups(gltf);

  expect(result.groups).toHaveLength(1);
  expect(result.groups[0].colliders.map(collider => collider.nodeIndex)).toEqual([2]);
  expect(result.warnings).toContain(
    'KHR_physics_rigid_bodies: collider node 1 has zero body-relative scale; its collider was skipped.'
  );
});

test('normalizes supported motion values and diagnoses malformed or deferred mass properties', () => {
  const gltf = createGltf(
    [
      {
        children: [1],
        extensions: {
          KHR_physics_rigid_bodies: {
            motion: {
              mass: 0,
              linearVelocity: [1, 2],
              angularVelocity: [0, 1, 2],
              gravityFactor: -1,
              centerOfMass: [0, 0, 0],
              inertiaDiagonal: [0, 2, -1],
              inertiaOrientation: [0, 0, 0, 2],
            },
          },
        },
      },
      { extensions: { KHR_physics_rigid_bodies: { collider: { geometry: { shape: 0 } } } } },
    ],
    { KHR_implicit_shapes: { shapes: [{ type: 'box' }] } }
  );

  const result = collectKhrRigidBodyGroups(gltf);

  expect(result.groups[0].motion?.mass).toBe(0);
  expect(result.groups[0].motion?.centerOfMass).toEqual([0, 0, 0]);
  expect(result.groups[0].motion?.inertiaDiagonal).toBeUndefined();
  expect(result.groups[0].motion?.inertiaOrientation).toEqual([0, 0, 0, 1]);
  expect(result.groups[0].motion?.linearVelocity).toBeUndefined();
  expect(result.groups[0].motion?.angularVelocity).toEqual([0, 1, 2]);
  expect(result.groups[0].motion?.gravityFactor).toBe(-1);
  expect(result.warnings.some(warning => warning.includes('infinite mass'))).toBe(false);
  expect(result.warnings.some(warning => warning.includes('invalid linearVelocity'))).toBe(true);
  expect(result.warnings.some(warning => warning.includes('centerOfMass'))).toBe(false);
  expect(result.warnings.some(warning => warning.includes('invalid inertiaDiagonal'))).toBe(true);
});

test('resolves KHR collision filter set semantics into deterministic Rapier profiles', () => {
  const filters = [
    { collisionSystems: ['character', 'character'], collideWithSystems: ['landscape'] },
    { collisionSystems: ['landscape'] },
    { collisionSystems: ['ghost'], notCollideWithSystems: ['character'] },
    { collideWithSystems: ['landscape'], collisionSystems: ['character'] },
  ];
  const nodes = [0, 1, 2, 3, undefined].map(collisionFilter => ({
    extensions: {
      KHR_physics_rigid_bodies: {
        collider: {
          geometry: { shape: 0 },
          ...(collisionFilter == null ? {} : { collisionFilter }),
        },
      },
    },
  }));
  const gltf = createGltf(nodes, {
    KHR_implicit_shapes: { shapes: [{ type: 'box' }] },
    KHR_physics_rigid_bodies: { collisionFilters: filters },
  });

  const result = collectKhrRigidBodyGroups(gltf);
  const colliders = result.groups.flatMap(group => group.colliders);

  expect(result.warnings).toEqual([]);
  expect(colliders.map(collider => collider.collisionGroup)).toEqual([1, 2, 4, 1, 0x8000]);
  expect(colliders.map(collider => collider.collisionMask)).toEqual([0x8002, 0x8007, 0x8006, 0x8002, 0xffff]);
});

test('allows collision systems when the allow sets have a non-empty intersection', () => {
  const filters = [
    { collisionSystems: ['character'], collideWithSystems: ['landscape'] },
    { collisionSystems: ['landscape', 'static'] },
    { collisionSystems: [], collideWithSystems: [] },
  ];
  const gltf = createGltf(
    filters.map((_, collisionFilter) => ({
      extensions: {
        KHR_physics_rigid_bodies: {
          collider: { geometry: { shape: 0 }, collisionFilter },
        },
      },
    })),
    {
      KHR_implicit_shapes: { shapes: [{ type: 'box' }] },
      KHR_physics_rigid_bodies: { collisionFilters: filters },
    }
  );

  const result = collectKhrRigidBodyGroups(gltf);
  const colliders = result.groups.flatMap(group => group.colliders);

  expect(result.warnings).toEqual([]);
  expect(colliders.map(collider => collider.collisionGroup)).toEqual([1, 2, 4]);
  expect(colliders.map(collider => collider.collisionMask)).toEqual([0x8002, 0x8003, 0x8000]);
});

test('uses fallback collision for invalid filters and profiles beyond the 15-profile limit', () => {
  const filters = Array.from({ length: 16 }, (_, index) => ({ collisionSystems: [`system-${index}`] }));
  filters.push({
    collisionSystems: ['invalid'],
    collideWithSystems: ['a'],
    notCollideWithSystems: ['b'],
  } as (typeof filters)[number]);
  const filterIndices = [...Array.from({ length: 16 }, (_, index) => index), 16, 99];
  const gltf = createGltf(
    filterIndices.map(collisionFilter => ({
      extensions: {
        KHR_physics_rigid_bodies: { collider: { geometry: { shape: 0 }, collisionFilter } },
      },
    })),
    {
      KHR_implicit_shapes: { shapes: [{ type: 'box' }] },
      KHR_physics_rigid_bodies: { collisionFilters: filters },
    }
  );

  const result = collectKhrRigidBodyGroups(gltf);
  const colliders = result.groups.flatMap(group => group.colliders);

  expect(colliders.slice(0, 15).map(collider => collider.collisionGroup)).toEqual(
    Array.from({ length: 15 }, (_, index) => 1 << index)
  );
  expect(colliders.slice(15).map(collider => collider.collisionGroup)).toEqual([0x8000, 0x8000, 0x8000]);
  expect(colliders.slice(15).every(collider => collider.collisionMask === 0xffff)).toBe(true);
  expect(result.warnings.filter(warning => warning.includes('more than 15'))).toHaveLength(1);
  expect(result.warnings.some(warning => warning.includes('defines both'))).toBe(true);
  expect(result.warnings.some(warning => warning.includes('missing collision filter 99'))).toBe(true);
});

test('collects simple and compound trigger geometries without duplicating compound children', () => {
  const gltf = createGltf(
    [
      {
        children: [1, 2],
        extensions: { KHR_physics_rigid_bodies: { trigger: { nodes: [1, 2, 2] } } },
      },
      {
        extensions: {
          KHR_physics_rigid_bodies: { trigger: { geometry: { shape: 0 } } },
        },
      },
      {
        extensions: {
          KHR_physics_rigid_bodies: { trigger: { geometry: { shape: 1 } } },
        },
      },
      {
        extensions: {
          KHR_physics_rigid_bodies: { trigger: { geometry: { shape: 0 } } },
        },
      },
    ],
    {
      KHR_implicit_shapes: { shapes: [{ type: 'box' }, { type: 'sphere' }] },
    }
  );

  const result = collectKhrRigidBodyGroups(gltf);
  const sensors = result.groups.flatMap(group => group.colliders).filter(collider => collider.isSensor);

  expect(result.warnings).toEqual([]);
  expect(sensors).toHaveLength(3);
  expect(sensors.map(sensor => sensor.nodeIndex)).toEqual([1, 2, 3]);
  expect(sensors.map(sensor => sensor.triggerNodeIndex)).toEqual([0, 0, 3]);
});
