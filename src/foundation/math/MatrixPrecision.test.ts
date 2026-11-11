import { Matrix22, Matrix22D } from './Matrix22';
import { Matrix33, Matrix33D } from './Matrix33';
import { Matrix44, Matrix44D } from './Matrix44';
import { MutableMatrix22, MutableMatrix22D } from './MutableMatrix22';
import { MutableMatrix33, MutableMatrix33D } from './MutableMatrix33';
import { MutableMatrix44, MutableMatrix44D } from './MutableMatrix44';
import { Quaternion } from './Quaternion';
import { Vector3 } from './Vector3';

// The singular fallback intentionally logs an error, so silence it in this file.
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('Matrix22D / MutableMatrix22D', () => {
  it('stores data in a Float64Array', () => {
    expect(Matrix22D.identity()._v).toBeInstanceOf(Float64Array);
    expect(Matrix22.identity()._v).toBeInstanceOf(Float32Array);
    expect(MutableMatrix22D.identity()._v).toBeInstanceOf(Float64Array);
    expect(MutableMatrix22.identity()._v).toBeInstanceOf(Float32Array);
  });

  it('keeps double precision values', () => {
    const mat = Matrix22D.fromCopy4RowMajor(1 / 3, 0, 0, 1 / 7);
    expect(mat.m00).toBeCloseTo(1 / 3, 15);
    expect(mat.m11).toBeCloseTo(1 / 7, 15);
    expect(mat._v).toBeInstanceOf(Float64Array);
  });

  it('inverts a matrix that is only invertible in double precision', () => {
    // det = 1e-6 with Float64 input. Float32 would reject this (its rounding
    // error is on the same order), while Float64 can invert it reliably.
    const mat = Matrix22D.fromCopy4RowMajor(1, 1, 1, 1.000001);
    const inverse = Matrix22D.tryInvert(mat);
    expect(inverse).not.toBeNull();
    expect(inverse!._v).toBeInstanceOf(Float64Array);
    expect(Matrix22D.multiply(mat, inverse!).isEqual(Matrix22D.identity(), 1e-9)).toBe(true);
  });

  it('supports mutable in-place operations with Float64Array', () => {
    const mat = MutableMatrix22D.fromCopy4RowMajor(2, 0, 0, 4);
    expect(mat.raw()).toBeInstanceOf(Float64Array);
    mat.invert();
    expect(mat.m00).toBeCloseTo(0.5, 15);
    expect(mat.clone()._v).toBeInstanceOf(Float64Array);
  });
});

describe('Matrix33D / MutableMatrix33D', () => {
  it('stores data in a Float64Array', () => {
    expect(Matrix33D.identity()._v).toBeInstanceOf(Float64Array);
    expect(Matrix33.identity()._v).toBeInstanceOf(Float32Array);
    expect(MutableMatrix33D.identity()._v).toBeInstanceOf(Float64Array);
    expect(MutableMatrix33.identity()._v).toBeInstanceOf(Float32Array);
  });

  it('creates rotations with double precision', () => {
    const mat = Matrix33D.rotateZ(Math.PI / 2);
    expect(mat._v).toBeInstanceOf(Float64Array);
    expect(mat.m00).toBeCloseTo(0, 15);
    expect(mat.m01).toBeCloseTo(-1, 15);
  });

  it('creates a matrix from a quaternion with double precision', () => {
    const quat = Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 1, 0), Math.PI / 2);
    const mat = Matrix33D.fromCopyQuaternion(quat);
    expect(mat._v).toBeInstanceOf(Float64Array);
    expect(mat.m00).toBeCloseTo(0, 6);
    expect(mat.m02).toBeCloseTo(1, 6);
    expect(mat.m11).toBeCloseTo(1, 6);
  });

  it('inverts in place with Float64Array', () => {
    const mat = MutableMatrix33D.fromCopy9RowMajor(2, 0, 0, 0, 4, 0, 0, 0, 0.5);
    mat.invert();
    expect(mat.m00).toBeCloseTo(0.5, 15);
    expect(mat.m11).toBeCloseTo(0.25, 15);
    expect(mat.m22).toBeCloseTo(2, 15);
    expect(mat._v).toBeInstanceOf(Float64Array);
  });
});

describe('Matrix44D / MutableMatrix44D', () => {
  it('stores data in a Float64Array', () => {
    expect(Matrix44D.identity()._v).toBeInstanceOf(Float64Array);
    expect(Matrix44.identity()._v).toBeInstanceOf(Float32Array);
    expect(MutableMatrix44D.identity()._v).toBeInstanceOf(Float64Array);
    expect(MutableMatrix44.identity()._v).toBeInstanceOf(Float32Array);
  });

  it('creates transforms with double precision', () => {
    // prettier-ignore
    const mat = Matrix44D.fromCopy16RowMajor(1 / 3, 0, 0, 0, 0, 1 / 7, 0, 0, 0, 0, 1 / 9, 0, 0, 0, 0, 1);
    expect(mat._v).toBeInstanceOf(Float64Array);
    expect(mat.m00).toBeCloseTo(1 / 3, 15);
    expect(mat.m11).toBeCloseTo(1 / 7, 15);
  });

  it('multiplies and inverts transforms', () => {
    // prettier-ignore
    const mat = Matrix44D.fromCopy16RowMajor(2, 0, 0, 3, 0, 4, 0, -1, 0, 0, 0.5, 2, 0, 0, 0, 1);
    const inverse = Matrix44D.tryInvert(mat);
    expect(inverse).not.toBeNull();
    expect(inverse!._v).toBeInstanceOf(Float64Array);
    expect(Matrix44D.multiply(mat, inverse!).isEqual(Matrix44D.identity(), 1e-9)).toBe(true);
  });

  it('accepts a near-singular matrix that Float32 rejects', () => {
    // prettier-ignore
    const mat = Matrix44D.fromCopy16RowMajor(1, 1, 0, 0, 1, 1.000001, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    expect(Matrix44D.tryInvert(mat)).not.toBeNull();

    // The same values rounded to Float32 lose the difference between the columns.
    const floatMat = Matrix44.fromCopy16RowMajor(1, 1, 0, 0, 1, 1.000001, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    expect(Matrix44.tryInvert(floatMat)).toBeNull();
  });

  it('supports mutable operations with Float64Array', () => {
    const mat = MutableMatrix44D.fromCopy16RowMajor(2, 0, 0, 3, 0, 4, 0, -1, 0, 0, 0.5, 2, 0, 0, 0, 1);
    expect(mat._v).toBeInstanceOf(Float64Array);

    mat.setComponents(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    expect(mat.m00).toBe(1);
    expect(mat._v).toBeInstanceOf(Float64Array);

    const inverse = mat.clone();
    expect(inverse._v).toBeInstanceOf(Float64Array);
    expect(inverse.isEqual(MutableMatrix44D.identity(), 1e-12)).toBe(true);
  });

  it('shares memory with a provided Float64Array', () => {
    const buffer = new Float64Array(16);
    buffer[0] = 5;
    const mat = Matrix44D.fromFloat64ArrayColumnMajor(buffer);
    buffer[0] = 7;
    expect(mat.m00).toBe(7);
    expect(mat._v).toBe(buffer);
  });
});
