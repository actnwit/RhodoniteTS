import type { MeshComponent } from '../components/Mesh/MeshComponent';
import { AABB } from '../math/AABB';
import { Matrix44 } from '../math/Matrix44';
import { MutableMatrix44 } from '../math/MutableMatrix44';
import { Vector3 } from '../math/Vector3';
import { Frustum } from './Frustum';

/** The original culling test, which checks all the 8 corners against each plane. */
function referenceCulling(frustum: Frustum, aabb: AABB) {
  const min = aabb.minPoint;
  const max = aabb.maxPoint;
  for (let i = 0; i < 6; i++) {
    const p = frustum.getPlane(i);
    let out = 0;
    for (const x of [min.x, max.x]) {
      for (const y of [min.y, max.y]) {
        for (const z of [min.z, max.z]) {
          out += p.x * x + p.y * y + p.z * z + p.w < 0 ? 1 : 0;
        }
      }
    }
    if (out === 8) {
      return false;
    }
  }
  const checks: [number, (c: { x: number; y: number; z: number }) => boolean][] = [
    [0, c => c.x > max.x],
    [0, c => c.x < min.x],
    [0, c => c.y > max.y],
    [0, c => c.y < min.y],
    [0, c => c.z > max.z],
    [0, c => c.z < min.z],
  ];
  for (const [, check] of checks) {
    let out = 0;
    for (let i = 0; i < 8; i++) {
      out += check(frustum.corners[i]) ? 1 : 0;
    }
    if (out === 8) {
      return false;
    }
  }
  return true;
}

function createMeshComponentStub(aabb: AABB) {
  return {
    entity: { getSceneGraph: () => ({ worldMergedAABBWithSkeletal: aabb }) },
  } as unknown as MeshComponent;
}

test('Frustum.culling matches the 8-corner reference test', () => {
  let seed = 12345;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  const projection = MutableMatrix44.identity();
  const view = MutableMatrix44.identity();
  let mismatches = 0;
  let visibleCount = 0;
  const trials = 4000;
  for (let t = 0; t < trials; t++) {
    // Perspective projection with a random field of view.
    const fovy = 0.3 + random() * 1.5;
    const aspect = 0.5 + random() * 2;
    const near = 0.1;
    const far = 50 + random() * 100;
    const f = 1 / Math.tan(fovy / 2);
    projection.setComponents(
      f / aspect,
      0,
      0,
      0,
      0,
      f,
      0,
      0,
      0,
      0,
      (far + near) / (near - far),
      (2 * far * near) / (near - far),
      0,
      0,
      -1,
      0
    );
    // A camera rotated around Y and translated randomly.
    const angle = random() * Math.PI * 2;
    const camera = Matrix44.multiply(
      Matrix44.translate(Vector3.fromCopy3(random() * 20 - 10, random() * 20 - 10, random() * 20 - 10)),
      Matrix44.rotateY(angle)
    );
    view.copyComponents(Matrix44.invert(camera));

    const frustum = new Frustum();
    frustum.update(view, projection);

    const aabb = new AABB();
    const cx = random() * 120 - 60;
    const cy = random() * 120 - 60;
    const cz = random() * 120 - 60;
    aabb.addPosition(Vector3.fromCopy3(cx, cy, cz));
    aabb.addPosition(Vector3.fromCopy3(cx + random() * 10, cy + random() * 10, cz + random() * 10));

    const expected = referenceCulling(frustum, aabb);
    const actual = frustum.culling(createMeshComponentStub(aabb));
    if (expected !== actual) {
      mismatches++;
    }
    if (actual) {
      visibleCount++;
    }
  }

  expect(mismatches).toBe(0);
  // Make sure that both visible and culled cases were exercised.
  expect(visibleCount).toBeGreaterThan(0);
  expect(visibleCount).toBeLessThan(trials);
});
