import { AABB } from './AABB';
import { Matrix44 } from './Matrix44';
import { Vector3 } from './Vector3';

test('AABB is vanilla first', () => {
  const aabb = new AABB();
  expect(aabb.isVanilla()).toBe(true);

  aabb.addPosition(Vector3.fromCopyArray([0, 0, 0]));

  expect(aabb.isVanilla()).toBe(false);
});

test('AABB clone method works properly', () => {
  const aabb = new AABB();
  expect(aabb.isVanilla()).toBe(true);
});

test('AABB multiply', () => {
  const aabb = new AABB();
  aabb.addPosition(Vector3.fromCopyArray([1, 0, 0]));
  aabb.addPosition(Vector3.fromCopyArray([0, 1, 0]));

  const aabb2 = new AABB();
  AABB.multiplyMatrixTo(Matrix44.rotateZ(Math.PI / 4), aabb, aabb2);

  console.log(aabb2.toStringApproximately());

  expect(aabb2.minPoint.isEqual(Vector3.fromCopy3(-Math.SQRT1_2, 0, 0), 0.001)).toBe(true);
  expect(aabb2.maxPoint.isEqual(Vector3.fromCopy3(Math.SQRT1_2, Math.SQRT2, 0), 0.001)).toBe(true);
  expect(aabb2.centerPoint.isEqual(Vector3.fromCopy3(0, Math.SQRT1_2, 0), 0.001)).toBe(true);
});
