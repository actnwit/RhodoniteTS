import {AABB} from './AABB';
import {Vector3} from './Vector3';

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
