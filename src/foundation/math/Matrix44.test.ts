import { MathUtil } from './MathUtil';
import { Matrix44 } from './Matrix44';
import { MutableMatrix44 } from './MutableMatrix44';
import { Vector3 } from './Vector3';
import { Vector4 } from './Vector4';

test('Test isEqual', () => {
  const a = Matrix44.fromCopy16RowMajor(1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  const b = MutableMatrix44.identity();
  b.translate(Vector3.fromCopyArray([1, 0, 0]));

  expect(a.isEqual(b)).toBe(true);
});

test('Make Matrix44 from MutableMatrix44 (1)', () => {
  const a = MutableMatrix44.fromCopy16RowMajor(1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  const b = Matrix44.fromCopyMatrix44(a);

  expect(b.m03).toBe(1);
});
test('Make Matrix44 from MutableMatrix44 (2)', () => {
  const a = MutableMatrix44.fromCopy16ColumnMajor(1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  const b = Matrix44.fromCopyMatrix44(a);

  expect(b.m03).toBe(0);
});

test('Make Matrix44 from MutableMatrix44 (3)', () => {
  const a = MutableMatrix44.fromCopy16ColumnMajor(1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  const b = Matrix44.fromCopyMatrix44(a);

  expect(b.m03).toBe(0);
});

test('Make Matrix44 from MutableMatrix44 (4)', () => {
  const a = MutableMatrix44.fromCopy16ColumnMajor(1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  const b = Matrix44.fromCopyMatrix44(a);

  expect(b.m03).toBe(0);
});

// prettier-ignore
test('Matrix44 multiply', () => {
  const a = Matrix44.fromCopy16RowMajor(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
  const b = Matrix44.fromCopy16RowMajor(17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32);
  const c = Matrix44.fromCopy16RowMajor(
    250,
    260,
    270,
    280,
    618,
    644,
    670,
    696,
    986,
    1028,
    1070,
    1112,
    1354,
    1412,
    1470,
    1528
  );

  expect((Matrix44.multiply(a, b) as Matrix44).isEqual(c)).toBe(true);
});

// prettier-ignore
test('Matrix44 multiplyVector', () => {
  const a = Matrix44.fromCopy16RowMajor(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);

  const b = Vector4.fromCopy4(1, 2, 3, 4);

  const c = Vector4.fromCopy4(30, 70, 110, 150);

  expect(a.multiplyVector(b).isEqual(c)).toBe(true);
});

// prettier-ignore
test('Matrix44 translate', () => {
  const a = Matrix44.translate(Vector3.fromCopy3(1, 2, 3));
  const b = Matrix44.fromCopy16RowMajor(1, 0, 0, 1, 0, 1, 0, 2, 0, 0, 1, 3, 0, 0, 0, 1);

  expect(a.isEqual(b)).toBe(true);
});

// prettier-ignore
test('Matrix44 rotateX', () => {
  const a = Matrix44.rotateX(MathUtil.degreeToRadian(90));

  const b = Matrix44.fromCopy16RowMajor(1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1);

  expect(a.isEqual(b)).toBe(true);
});

// prettier-ignore
test('Matrix44 rotateY', () => {
  const a = Matrix44.rotateY(MathUtil.degreeToRadian(90));

  const b = Matrix44.fromCopy16RowMajor(0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 1);

  expect(a.isEqual(b)).toBe(true);
});

// prettier-ignore
test('Matrix44 rotateZ', () => {
  const a = Matrix44.rotateZ(MathUtil.degreeToRadian(90));

  const b = Matrix44.fromCopy16RowMajor(0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

  expect(a.isEqual(b)).toBe(true);
});

// prettier-ignore
test('Matrix44 rotateXYZ', () => {
  const a = Matrix44.rotateXYZ(MathUtil.degreeToRadian(90), MathUtil.degreeToRadian(90), MathUtil.degreeToRadian(90));

  const x = Matrix44.rotateX(MathUtil.degreeToRadian(90));
  const y = Matrix44.rotateY(MathUtil.degreeToRadian(90));
  const z = Matrix44.rotateZ(MathUtil.degreeToRadian(90));

  const b = Matrix44.multiply(Matrix44.multiply(z, y), x);

  const c = Matrix44.fromCopy16RowMajor(0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 1);

  expect(a.isEqual(b)).toBe(true);
  expect(a.isEqual(c)).toBe(true);
});

// prettier-ignore
test('Matrix44 scale', () => {
  const a = Matrix44.scale(Vector3.fromCopy3(1, 2, 3));

  const b = Matrix44.fromCopy16RowMajor(1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1);

  expect(a.isEqual(b)).toBe(true);
});
