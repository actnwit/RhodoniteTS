import type { RnM2 } from '../../types';
import { collectKhrStaticBoxColliders } from './KhrPhysicsImporter';

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
  expect(result.warnings[0]).toContain('invalid box shape');
  expect(result.warnings[1]).toContain('dynamic motion');
  expect(result.warnings[2]).toContain("unsupported shape type 'sphere'");
  expect(result.warnings[3]).toContain('missing implicit shape 99');
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
