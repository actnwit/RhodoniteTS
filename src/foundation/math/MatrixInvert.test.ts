import { MathUtil } from './MathUtil';
import { Matrix22 } from './Matrix22';
import { Matrix33 } from './Matrix33';
import { Matrix44 } from './Matrix44';
import { MutableMatrix22 } from './MutableMatrix22';
import { MutableMatrix33 } from './MutableMatrix33';
import { MutableMatrix44 } from './MutableMatrix44';

// The fallback path intentionally logs an error, so silence it in this file.
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});

const SINGULAR_44_DET_IS_NOT_ZERO_BUT_NEGLIGIBLE = Matrix44.fromCopy16RowMajor(
  1,
  1,
  0,
  0,
  1,
  1.000001,
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

const EXACTLY_SINGULAR_44 = Matrix44.fromCopy16RowMajor(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1);

const EXACTLY_SINGULAR_22 = Matrix22.fromCopy4RowMajor(1, 2, 2, 4);
const EXACTLY_SINGULAR_33 = Matrix33.fromCopy9RowMajor(1, 2, 3, 4, 5, 6, 7, 8, 9);

describe('MathUtil.isSingularDet', () => {
  it('treats a non-finite determinant as singular', () => {
    expect(MathUtil.isSingularDet(NaN, 1)).toBe(true);
    expect(MathUtil.isSingularDet(Infinity, 1)).toBe(true);
  });

  it('treats a zero matrix as singular', () => {
    expect(MathUtil.isSingularDet(0, 0)).toBe(true);
  });

  it('is scale independent', () => {
    // A uniformly scaled diagonal matrix stays invertible no matter how small it is.
    expect(MathUtil.isSingularDet(1e-32, 1e-32)).toBe(false);
    // The same determinant with a large scale is effectively zero.
    expect(MathUtil.isSingularDet(1e-32, 1)).toBe(true);
  });
});

describe('Matrix22 invert', () => {
  it('inverts a regular matrix', () => {
    const mat = Matrix22.fromCopy4RowMajor(2, 0, 0, 4);
    const inverse = Matrix22.tryInvert(mat);
    expect(inverse).not.toBeNull();
    expect(inverse!.isEqual(Matrix22.fromCopy4RowMajor(0.5, 0, 0, 0.25), 1e-6)).toBe(true);
  });

  it('returns null for a singular matrix instead of Infinity/NaN', () => {
    expect(Matrix22.tryInvert(EXACTLY_SINGULAR_22)).toBeNull();
  });

  it('falls back to identity for a singular matrix', () => {
    const inverse = Matrix22.invert(EXACTLY_SINGULAR_22);
    expect(inverse.isEqual(Matrix22.identity(), 1e-6)).toBe(true);
    expect(Number.isFinite(inverse.m00)).toBe(true);
    expect(Number.isFinite(inverse.m11)).toBe(true);
  });

  it('leaves the output untouched when tryInvertTo fails', () => {
    const out = MutableMatrix22.fromCopy4RowMajor(7, 0, 0, 7);
    const before = out.clone();
    expect(Matrix22.tryInvertTo(EXACTLY_SINGULAR_22, out)).toBe(false);
    expect(out.isStrictEqual(before)).toBe(true);
  });

  it('writes the result into the output when tryInvertTo succeeds', () => {
    const out = MutableMatrix22.identity();
    expect(Matrix22.tryInvertTo(Matrix22.fromCopy4RowMajor(2, 0, 0, 4), out)).toBe(true);
    expect(out.isEqual(Matrix22.fromCopy4RowMajor(0.5, 0, 0, 0.25), 1e-6)).toBe(true);
  });

  it('sets the output to identity when invertTo fails', () => {
    const out = MutableMatrix22.fromCopy4RowMajor(7, 0, 0, 7);
    expect(Matrix22.invertTo(EXACTLY_SINGULAR_22, out).isEqual(Matrix22.identity(), 1e-6)).toBe(true);
  });
});

describe('Matrix33 invert', () => {
  it('inverts a regular matrix', () => {
    const inverse = Matrix33.tryInvert(Matrix33.rotateZ(Math.PI / 2));
    expect(inverse).not.toBeNull();
    expect(inverse!.isEqual(Matrix33.rotateZ(-Math.PI / 2), 1e-6)).toBe(true);
  });

  it('returns null for a singular matrix', () => {
    expect(Matrix33.tryInvert(EXACTLY_SINGULAR_33)).toBeNull();
  });

  it('falls back to identity for a singular matrix', () => {
    expect(Matrix33.invert(EXACTLY_SINGULAR_33).isEqual(Matrix33.identity(), 1e-6)).toBe(true);
  });

  it('returns a copy for an identity matrix', () => {
    const identity = Matrix33.identity();
    const inverse = Matrix33.tryInvert(identity);
    expect(inverse).not.toBeNull();
    expect(inverse!.isEqual(identity, 1e-6)).toBe(true);
  });

  it('leaves the output untouched when tryInvertTo fails', () => {
    const out = MutableMatrix33.fromCopy9RowMajor(7, 0, 0, 0, 7, 0, 0, 0, 7);
    const before = out.clone();
    expect(Matrix33.tryInvertTo(EXACTLY_SINGULAR_33, out)).toBe(false);
    expect(out.isStrictEqual(before)).toBe(true);
  });
});

describe('Matrix44 invert', () => {
  it('inverts a scale + translation matrix', () => {
    // prettier-ignore
    const mat = Matrix44.fromCopy16RowMajor(2, 0, 0, 3, 0, 4, 0, -1, 0, 0, 0.5, 2, 0, 0, 0, 1);
    // prettier-ignore
    const expected = Matrix44.fromCopy16RowMajor(0.5, 0, 0, -1.5, 0, 0.25, 0, 0.25, 0, 0, 2, -4, 0, 0, 0, 1);

    const inverse = Matrix44.tryInvert(mat);
    expect(inverse).not.toBeNull();
    expect(inverse!.isEqual(expected, 1e-6)).toBe(true);

    // A * A^-1 must be the identity matrix.
    expect((Matrix44.multiply(mat, inverse!) as Matrix44).isEqual(Matrix44.identity(), 1e-6)).toBe(true);
  });

  it('returns null for an exactly singular matrix', () => {
    expect(Matrix44.tryInvert(EXACTLY_SINGULAR_44)).toBeNull();
  });

  it('returns null when the determinant is tiny but not exactly zero', () => {
    // The old `det === 0` check let this one through, producing a matrix with
    // huge (and wrong) values.
    expect(SINGULAR_44_DET_IS_NOT_ZERO_BUT_NEGLIGIBLE.determinant()).not.toBe(0);
    expect(Matrix44.tryInvert(SINGULAR_44_DET_IS_NOT_ZERO_BUT_NEGLIGIBLE)).toBeNull();
  });

  it('returns null for a matrix containing NaN', () => {
    // prettier-ignore
    const nanMat = Matrix44.fromCopy16RowMajor(NaN, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    expect(Matrix44.tryInvert(nanMat)).toBeNull();
  });

  it('does not reject a regular perspective projection', () => {
    const f = 2.414213562373095; // 1 / tan(45deg / 2)
    const near = 0.1;
    const far = 1000;
    // prettier-ignore
    const mat = Matrix44.fromCopy16RowMajor(
      f / 1.7777777777777777,
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

    const inverse = Matrix44.tryInvert(mat);
    expect(inverse).not.toBeNull();
    expect((Matrix44.multiply(mat, inverse!) as Matrix44).isEqual(Matrix44.identity(), 1e-4)).toBe(true);
  });

  it('does not reject a matrix with a large uniform scale', () => {
    // prettier-ignore
    const mat = Matrix44.fromCopy16RowMajor(1e6, 0, 0, 3, 0, 1e6, 0, -1, 0, 0, 1e6, 2, 0, 0, 0, 1);

    const inverse = Matrix44.tryInvert(mat);
    expect(inverse).not.toBeNull();
    expect((Matrix44.multiply(mat, inverse!) as Matrix44).isEqual(Matrix44.identity(), 1e-3)).toBe(true);
  });

  it('falls back to identity and never produces Infinity/NaN', () => {
    const inverse = Matrix44.invert(SINGULAR_44_DET_IS_NOT_ZERO_BUT_NEGLIGIBLE);
    expect(inverse.isEqual(Matrix44.identity(), 1e-6)).toBe(true);
    for (let i = 0; i < 16; i++) {
      expect(Number.isFinite(inverse._v[i])).toBe(true);
    }
  });

  it('leaves the output untouched when tryInvertTo fails', () => {
    const out = MutableMatrix44.fromCopy16RowMajor(7, 0, 0, 0, 0, 7, 0, 0, 0, 0, 7, 0, 0, 0, 0, 7);
    const before = out.clone();
    expect(Matrix44.tryInvertTo(EXACTLY_SINGULAR_44, out)).toBe(false);
    expect(out.isStrictEqual(before)).toBe(true);
  });

  it('sets the output to identity when invertTo fails', () => {
    const out = MutableMatrix44.identity();
    expect(Matrix44.invertTo(EXACTLY_SINGULAR_44, out).isEqual(Matrix44.identity(), 1e-6)).toBe(true);
  });
});

describe('MutableMatrix invert in place', () => {
  it('keeps the matrix unchanged when tryInvert fails', () => {
    const mat = MutableMatrix44.fromCopy16RowMajor(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1);
    const before = mat.clone();
    expect(mat.tryInvert()).toBe(false);
    expect(mat.isStrictEqual(before)).toBe(true);
  });

  it('falls back to identity when invert fails (44)', () => {
    const mat = MutableMatrix44.fromCopy16RowMajor(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1);
    expect(mat.invert().isEqual(MutableMatrix44.identity(), 1e-6)).toBe(true);
  });

  it('falls back to identity when invert fails (33)', () => {
    const mat = MutableMatrix33.fromCopy9RowMajor(1, 2, 3, 4, 5, 6, 7, 8, 9);
    expect(mat.tryInvert()).toBe(false);
    expect(mat.invert().isEqual(MutableMatrix33.identity(), 1e-6)).toBe(true);
  });

  it('falls back to identity when invert fails (22)', () => {
    const mat = MutableMatrix22.fromCopy4RowMajor(1, 2, 2, 4);
    expect(mat.tryInvert()).toBe(false);
    expect(mat.invert().isEqual(MutableMatrix22.identity(), 1e-6)).toBe(true);
  });

  it('inverts a regular matrix in place', () => {
    const mat = MutableMatrix44.fromCopy16RowMajor(2, 0, 0, 3, 0, 4, 0, -1, 0, 0, 0.5, 2, 0, 0, 0, 1);
    expect(mat.tryInvert()).toBe(true);
    // prettier-ignore
    const expected = MutableMatrix44.fromCopy16RowMajor(0.5, 0, 0, -1.5, 0, 0.25, 0, 0.25, 0, 0, 2, -4, 0, 0, 0, 1);
    expect(mat.isEqual(expected, 1e-6)).toBe(true);
  });
});
