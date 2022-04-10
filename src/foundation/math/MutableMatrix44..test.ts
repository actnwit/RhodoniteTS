import {Matrix44} from './Matrix44';
import MutableMatrix44 from './MutableMatrix44';
import {Vector3} from './Vector3';

test('Make MutableMatrix44 from Matrix44 (1)', () => {
  // eslint-disable-next-line prettier/prettier
  const a = new Matrix44(
    1, 0, 0, 1,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1);
  const b = new MutableMatrix44(a);

  expect(a.m03).toBe(1);
});

test('Make MutableMatrix44 from Matrix44 (2)', () => {
  // eslint-disable-next-line prettier/prettier
  const a = new Matrix44(
    1, 0, 0, 1,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1, true);
  const b = new MutableMatrix44(a);

  expect(a.m03).toBe(0);
});

test('Make MutableMatrix44 from Matrix44 (3)', () => {
  // eslint-disable-next-line prettier/prettier
  const a = new Matrix44(
    1, 0, 0, 1,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1, true);
  const b = new MutableMatrix44(a, true);

  expect(a.m03).toBe(0);
});
