import { Matrix44 } from './Matrix44';
import { MutableQuaternion } from './MutableQuaternion';
import { Quaternion } from './Quaternion';
import { Vector3 } from './Vector3';

// The fallback path intentionally logs an error, so silence it in this file.
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});

/**
 * Quaternions q and -q represent the same rotation, so compare |dot| with 1.
 */
function isSameRotation(a: Quaternion, b: Quaternion): boolean {
  const dot = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
  return Math.abs(Math.abs(dot) - 1) < 1e-5;
}

const ZERO_SCALE_44 = Matrix44.fromCopy16RowMajor(0, 0, 0, 5, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

const DEGENERATE_44 = Matrix44.fromCopy16RowMajor(1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

const NAN_44 = Matrix44.fromCopy16RowMajor(NaN, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

describe('Quaternion fromMatrix', () => {
  it('round-trips a rotation matrix', () => {
    const q = Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 1, 0), Math.PI / 2);
    const extracted = Quaternion.fromMatrix(Matrix44.fromCopyQuaternion(q));
    expect(isSameRotation(q, extracted)).toBe(true);
  });

  it('ignores scale and translation', () => {
    // 90 degrees around Y, scaled by 2, translated by (3, 4, 5).
    const mat = Matrix44.fromCopy16RowMajor(0, 0, 2, 3, 0, 2, 0, 4, -2, 0, 0, 5, 0, 0, 0, 1);
    const expected = Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 1, 0), Math.PI / 2);

    const extracted = Quaternion.tryFromMatrix(mat);
    expect(extracted).not.toBeNull();
    expect(isSameRotation(expected, extracted!)).toBe(true);
  });

  it('returns an identity quaternion for a zero-scale matrix', () => {
    expect(Quaternion.tryFromMatrix(ZERO_SCALE_44)).toBeNull();

    const quat = Quaternion.fromMatrix(ZERO_SCALE_44);
    expect(quat.x).toBe(0);
    expect(quat.y).toBe(0);
    expect(quat.z).toBe(0);
    expect(quat.w).toBe(1);
  });

  it('returns null for a degenerate matrix', () => {
    expect(Quaternion.tryFromMatrix(DEGENERATE_44)).toBeNull();
  });

  it('returns null for a matrix containing NaN', () => {
    expect(Quaternion.tryFromMatrix(NAN_44)).toBeNull();
    const quat = Quaternion.fromMatrix(NAN_44);
    expect(Number.isNaN(quat.x)).toBe(false);
    expect(Number.isNaN(quat.w)).toBe(false);
  });

  it('leaves the output untouched when tryFromMatrixTo fails', () => {
    const out = MutableQuaternion.fromCopy4(0.1, 0.2, 0.3, 0.9);
    const before = out.clone();
    expect(Quaternion.tryFromMatrixTo(ZERO_SCALE_44, out)).toBe(false);
    expect(out.isStrictEqual(before)).toBe(true);
  });

  it('sets the output to identity when fromMatrixTo fails', () => {
    const out = MutableQuaternion.fromCopy4(0.1, 0.2, 0.3, 0.9);
    Quaternion.fromMatrixTo(ZERO_SCALE_44, out);
    expect(out.x).toBe(0);
    expect(out.y).toBe(0);
    expect(out.z).toBe(0);
    expect(out.w).toBe(1);
  });
});

describe('MutableQuaternion fromMatrix', () => {
  it('keeps the quaternion unchanged when tryFromMatrix fails', () => {
    const out = MutableQuaternion.fromCopy4(0.1, 0.2, 0.3, 0.9);
    const before = out.clone();
    expect(out.tryFromMatrix(NAN_44)).toBe(false);
    expect(out.isStrictEqual(before)).toBe(true);
  });

  it('falls back to identity when fromMatrix fails', () => {
    const out = MutableQuaternion.fromCopy4(0.1, 0.2, 0.3, 0.9);
    out.fromMatrix(NAN_44);
    expect(out.x).toBe(0);
    expect(out.y).toBe(0);
    expect(out.z).toBe(0);
    expect(out.w).toBe(1);
  });

  it('extracts the rotation in place', () => {
    const q = Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 1, 0), Math.PI / 3);
    const out = MutableQuaternion.identity();
    expect(out.tryFromMatrix(Matrix44.fromCopyQuaternion(q))).toBe(true);
    expect(isSameRotation(q, out)).toBe(true);
  });
});
