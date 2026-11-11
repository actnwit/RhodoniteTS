import { LogQuaternion, LogQuaternionD } from './LogQuaternion';
import { Quaternion, QuaternionD } from './Quaternion';
import { Vector3 } from './Vector3';

describe('LogQuaternionD', () => {
  it('stores data in a Float64Array', () => {
    expect(LogQuaternionD.fromCopy3(1, 2, 3)._v).toBeInstanceOf(Float64Array);
    expect(LogQuaternion.fromCopy3(1, 2, 3)._v).toBeInstanceOf(Float32Array);
  });

  it('keeps double precision values', () => {
    const logQuat = LogQuaternionD.fromCopy3(1 / 3, 1 / 7, 1 / 9);
    expect(logQuat.x).toBeCloseTo(1 / 3, 15);
    expect(logQuat.y).toBeCloseTo(1 / 7, 15);
    expect(logQuat.z).toBeCloseTo(1 / 9, 15);
  });

  it('shares memory with a provided Float64Array', () => {
    const array = new Float64Array([0, 0, 0]);
    const logQuat = LogQuaternionD.fromFloat64Array(array);
    array[0] = 5;
    expect(logQuat.x).toBe(5);
    expect(logQuat._v).toBe(array);
  });

  it('converts a quaternion to its logarithm in double precision', () => {
    const quat = QuaternionD.fromAxisAngle(Vector3.fromCopy3(0, 1, 0), Math.PI / 2);
    const logQuat = LogQuaternionD.fromCopyQuaternion(quat);
    expect(logQuat._v).toBeInstanceOf(Float64Array);
    expect(logQuat.x).toBeCloseTo(0, 12);
    expect(logQuat.y).toBeCloseTo(Math.PI / 4, 12);
    expect(logQuat.z).toBeCloseTo(0, 12);
  });

  it('returns a zero log quaternion for the identity rotation', () => {
    const logQuat = LogQuaternionD.fromCopyQuaternion(QuaternionD.identity());
    expect(logQuat._v).toBeInstanceOf(Float64Array);
    expect(logQuat.x).toBe(0);
    expect(logQuat.y).toBe(0);
    expect(logQuat.z).toBe(0);
  });

  it('never produces Infinity/NaN for a 180 degree rotation', () => {
    const quat = QuaternionD.fromAxisAngle(Vector3.fromCopy3(1, 0, 0), Math.PI);
    const logQuat = LogQuaternionD.fromCopyQuaternion(quat);
    for (let i = 0; i < 3; i++) {
      expect(Number.isFinite(logQuat._v[i])).toBe(true);
    }
  });

  it('converts a zero log quaternion to the identity quaternion', () => {
    const quat = QuaternionD.fromCopyLogQuaternion(LogQuaternionD.fromCopy3(0, 0, 0));
    expect(quat._v).toBeInstanceOf(Float64Array);
    expect(quat.x).toBe(0);
    expect(quat.y).toBe(0);
    expect(quat.z).toBe(0);
    expect(quat.w).toBe(1);
  });

  it('round-trips a quaternion through log space in double precision', () => {
    const original = QuaternionD.fromAxisAngle(Vector3.fromCopy3(0, 1, 0), Math.PI / 2);
    const logQuat = LogQuaternionD.fromCopyQuaternion(original);
    const restored = QuaternionD.fromCopyLogQuaternion(logQuat);
    expect(restored._v).toBeInstanceOf(Float64Array);

    const dot = restored.x * original.x + restored.y * original.y + restored.z * original.z + restored.w * original.w;
    expect(Math.abs(Math.abs(dot) - 1)).toBeLessThan(1e-12);
  });
});

describe('LogQuaternion', () => {
  it('converts a quaternion to its logarithm', () => {
    const quat = Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 1, 0), Math.PI / 2);
    const logQuat = LogQuaternion.fromCopyQuaternion(quat);
    expect(logQuat._v).toBeInstanceOf(Float32Array);
    expect(logQuat.y).toBeCloseTo(Math.PI / 4, 5);
  });

  it('returns a zero log quaternion for the identity rotation', () => {
    const logQuat = LogQuaternion.fromCopyQuaternion(Quaternion.identity());
    expect(logQuat.x).toBe(0);
    expect(logQuat.y).toBe(0);
    expect(logQuat.z).toBe(0);
  });
});
