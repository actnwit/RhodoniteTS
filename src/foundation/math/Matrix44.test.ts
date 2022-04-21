import {Matrix44} from './Matrix44';
import {MutableMatrix44} from './MutableMatrix44';
import {Vector3} from './Vector3';

test('Test isEqual', () => {
  const a = Matrix44.fromCopy16RowMajor(
    1, 0, 0, 1,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  );
  const b = MutableMatrix44.identity();
  b.translate(Vector3.fromCopyArray([1, 0, 0]));

  expect(a.isEqual(b)).toBe(true);
});

test('Make Matrix44 from MutableMatrix44 (1)', () => {
  const a = MutableMatrix44.fromCopy16RowMajor(
    1, 0, 0, 1,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  );
  const b = Matrix44.fromCopyMatrix44(a);

  expect(b.m03).toBe(1);
});
test('Make Matrix44 from MutableMatrix44 (2)', () => {
  const a = MutableMatrix44.fromCopy16ColumnMajor(
    1,
    0,
    0,
    1,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1
  );
  const b = Matrix44.fromCopyMatrix44(a);

  expect(b.m03).toBe(0);
});

test('Make Matrix44 from MutableMatrix44 (3)', () => {
  const a = MutableMatrix44.fromCopy16ColumnMajor(
    1,
    0,
    0,
    1,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1
  );
  const b = Matrix44.fromCopyMatrix44(a);

  expect(b.m03).toBe(0);
});

test('Make Matrix44 from MutableMatrix44 (4)', () => {
  const a = MutableMatrix44.fromCopy16ColumnMajor(
    1,
    0,
    0,
    1,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1
  );
  const b = Matrix44.fromCopyMatrix44(a);

  expect(b.m03).toBe(0);
});
