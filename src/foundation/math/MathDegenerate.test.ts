import { MutableQuaternion } from './MutableQuaternion';
import { MutableVector3 } from './MutableVector3';
import { Quaternion } from './Quaternion';
import { Vector3 } from './Vector3';

// The fallback paths intentionally log an error, so silence them in this file.
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('Quaternion.axisAngle', () => {
  it('returns null for a zero-length axis', () => {
    expect(Quaternion.tryAxisAngle(Vector3.fromCopy3(0, 0, 0), Math.PI / 2)).toBeNull();
  });

  it('falls back to identity for a zero-length axis', () => {
    const quat = Quaternion.axisAngle(Vector3.fromCopy3(0, 0, 0), Math.PI / 2);
    expect(quat.x).toBe(0);
    expect(quat.y).toBe(0);
    expect(quat.z).toBe(0);
    expect(quat.w).toBe(1);
  });

  it('still creates a rotation for a valid axis', () => {
    const quat = Quaternion.axisAngle(Vector3.fromCopy3(0, 1, 0), Math.PI / 2);
    expect(quat.y).toBeCloseTo(Math.SQRT1_2, 5);
    expect(quat.w).toBeCloseTo(Math.SQRT1_2, 5);
  });

  it('leaves a mutable quaternion unchanged when tryAxisAngle fails', () => {
    const quat = MutableQuaternion.fromCopy4(0.1, 0.2, 0.3, 0.9);
    const before = quat.clone();
    expect(quat.tryAxisAngle(Vector3.fromCopy3(0, 0, 0), Math.PI / 2)).toBe(false);
    expect(quat.isStrictEqual(before)).toBe(true);
  });

  it('sets a mutable quaternion to identity when axisAngle fails', () => {
    const quat = MutableQuaternion.fromCopy4(0.1, 0.2, 0.3, 0.9);
    quat.axisAngle(Vector3.fromCopy3(0, 0, 0), Math.PI / 2);
    expect(quat.x).toBe(0);
    expect(quat.y).toBe(0);
    expect(quat.z).toBe(0);
    expect(quat.w).toBe(1);
  });
});

describe('Quaternion.lookForward', () => {
  it('returns null for a zero-length forward vector', () => {
    expect(Quaternion.tryLookForward(Vector3.fromCopy3(0, 0, 0))).toBeNull();
  });

  it('returns null when forward is parallel to up', () => {
    const forward = Vector3.fromCopy3(0, 1, 0);
    const up = Vector3.fromCopy3(0, 1, 0);
    expect(Quaternion.tryLookForwardAccordingToThisUp(forward, up)).toBeNull();
  });

  it('falls back to identity for degenerate directions', () => {
    const quat = Quaternion.lookForward(Vector3.fromCopy3(0, 0, 0));
    expect(quat.x).toBe(0);
    expect(quat.y).toBe(0);
    expect(quat.z).toBe(0);
    expect(quat.w).toBe(1);
  });

  it('creates a rotation that keeps the forward direction', () => {
    const quat = Quaternion.tryLookForwardAccordingToThisUp(Vector3.fromCopy3(0, 0, 1), Vector3.fromCopy3(0, 1, 0));
    expect(quat).not.toBeNull();

    const rotated = quat!.transformVector3(Vector3.fromCopy3(0, 0, 1));
    expect(rotated.isEqual(Vector3.fromCopy3(0, 0, 1), 1e-4)).toBe(true);
  });
});

describe('Quaternion normalize', () => {
  it('returns an identity quaternion for a zero quaternion', () => {
    const quat = Quaternion.normalize(Quaternion.fromCopy4(0, 0, 0, 0));
    expect(quat.x).toBe(0);
    expect(quat.y).toBe(0);
    expect(quat.z).toBe(0);
    expect(quat.w).toBe(1);
  });

  it('normalizes a non-zero quaternion', () => {
    const quat = Quaternion.normalize(Quaternion.fromCopy4(0, 2, 0, 2));
    expect(quat.length()).toBeCloseTo(1, 5);
  });

  it('sets a mutable zero quaternion to identity', () => {
    const quat = MutableQuaternion.fromCopy4(0, 0, 0, 0);
    quat.normalize();
    expect(quat.w).toBe(1);
    expect(quat.x).toBe(0);
  });
});

describe('Vector divide and normalize', () => {
  it('normalizes a zero vector to a zero vector instead of Infinity', () => {
    const vec = MutableVector3.fromCopy3(0, 0, 0);
    vec.normalize();
    expect(vec.x).toBe(0);
    expect(vec.y).toBe(0);
    expect(vec.z).toBe(0);
  });

  it('normalizes a zero vector to a zero vector (static)', () => {
    const vec = Vector3.normalize(Vector3.fromCopy3(0, 0, 0));
    expect(vec.x).toBe(0);
    expect(vec.y).toBe(0);
    expect(vec.z).toBe(0);
  });

  it('sets components to zero when dividing by a zero scalar', () => {
    const vec = MutableVector3.fromCopy3(1, 2, 3);
    vec.divide(0);
    expect(vec.x).toBe(0);
    expect(vec.y).toBe(0);
    expect(vec.z).toBe(0);
  });

  it('zeroes only the components whose divisor is zero', () => {
    const vec = MutableVector3.fromCopy3(1, 2, 3);
    vec.divideVector(MutableVector3.fromCopy3(2, 0, 4));
    expect(vec.x).toBeCloseTo(0.5, 6);
    expect(vec.y).toBe(0);
    expect(vec.z).toBeCloseTo(0.75, 6);
  });

  it('still normalizes a non-zero vector', () => {
    const vec = MutableVector3.fromCopy3(0, 3, 4);
    vec.normalize();
    expect(vec.y).toBeCloseTo(0.6, 5);
    expect(vec.z).toBeCloseTo(0.8, 5);
  });
});
