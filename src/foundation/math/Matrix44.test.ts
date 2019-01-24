import Matrix44 from './Matrix44';
import MutableMatrix44 from './MutableMatrix44';
import Vector3 from './Vector3';


test('Test isEqual', () => {
  const a = new Matrix44(
    1, 0, 0, 1,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1);
  const b = MutableMatrix44.identity();
  b.translate(new Vector3(1, 0, 0));

  expect(a.isEqual(b)).toBe(true);
});

test('Make Matrix44 from MutableMatrix44 (1)', () => {
  const a = new MutableMatrix44(
    1, 0, 0, 1,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1);
  const b = new Matrix44(a);

  expect(a.m03).toBe(1);
});
test('Make Matrix44 from MutableMatrix44 (2)', () => {
  const a = new MutableMatrix44(
    1, 0, 0, 1,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1, true);
  const b = new Matrix44(a);

  expect(a.m03).toBe(0);
});

test('Make Matrix44 from MutableMatrix44 (3)', () => {
  const a = new MutableMatrix44(
    1, 0, 0, 1,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1, true);
  const b = new Matrix44(a, true);

  expect(a.m03).toBe(0);
});