import {Matrix44} from './Matrix44';
import {MutableMatrix44} from './MutableMatrix44';
import {Vector3} from './Vector3';

test('Make MutableMatrix44 from Matrix44 (1)', () => {
  // eslint-disable-next-line prettier/prettier
  const a = Matrix44.fromCopy16RowMajor(
    1, 0, 0, 1,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1);
  const b = MutableMatrix44.fromCopyMatrix44(a);

  expect(b.m03).toBe(1);
});

test('Make MutableMatrix44 from Matrix44 (2)', () => {
  // eslint-disable-next-line prettier/prettier
  const a = Matrix44.fromCopy16ColumnMajor(
    1, 0, 0, 1,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1);
  const b = MutableMatrix44.fromCopyMatrix44(a);

  expect(b.m03).toBe(0);
});
