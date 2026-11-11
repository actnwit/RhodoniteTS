import { Matrix44 } from './Matrix44';
import { MutableQuaternion, MutableQuaterniond } from './MutableQuaternion';
import { Quaternion, Quaterniond } from './Quaternion';
import { Vector3 } from './Vector3';

// The singular fallback intentionally logs an error, so silence it in this file.
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('Quaterniond', () => {
  it('stores data in a Float64Array', () => {
    expect(Quaterniond.identity()._v).toBeInstanceOf(Float64Array);
    expect(Quaternion.identity()._v).toBeInstanceOf(Float32Array);
    expect(Quaterniond.dummy()._v).toBeInstanceOf(Float64Array);
  });

  it('keeps double precision values', () => {
    const quat = Quaterniond.fromCopy4(1 / 3, 1 / 7, 1 / 9, 1);
    expect(quat._v).toBeInstanceOf(Float64Array);
    expect(quat.x).toBeCloseTo(1 / 3, 15);
    expect(quat.y).toBeCloseTo(1 / 7, 15);
    expect(quat.z).toBeCloseTo(1 / 9, 15);
  });

  it('creates axis-angle rotations in double precision', () => {
    const quat = Quaterniond.fromAxisAngle(Vector3.fromCopy3(0, 1, 0), Math.PI / 2);
    expect(quat._v).toBeInstanceOf(Float64Array);
    expect(quat.y).toBeCloseTo(Math.SQRT1_2, 15);
    expect(quat.w).toBeCloseTo(Math.SQRT1_2, 15);
  });

  it('multiplies into a Float64Array', () => {
    const a = Quaterniond.fromAxisAngle(Vector3.fromCopy3(0, 1, 0), Math.PI / 2);
    const b = Quaterniond.fromAxisAngle(Vector3.fromCopy3(1, 0, 0), Math.PI / 2);
    const multiplied = Quaterniond.multiply(a, b);
    expect(multiplied._v).toBeInstanceOf(Float64Array);
    expect(multiplied.length()).toBeCloseTo(1, 12);
  });

  it('extracts a quaternion from a matrix into a Float64Array', () => {
    const quat = Quaterniond.fromAxisAngle(Vector3.fromCopy3(0, 1, 0), Math.PI / 3);
    const mat = Matrix44.fromCopyQuaternion(quat);
    const extracted = Quaterniond.fromMatrix(mat);
    expect(extracted._v).toBeInstanceOf(Float64Array);
    const dot = extracted.x * quat.x + extracted.y * quat.y + extracted.z * quat.z + extracted.w * quat.w;
    expect(Math.abs(Math.abs(dot) - 1)).toBeLessThan(1e-5);
  });

  it('shares memory with a provided Float64Array', () => {
    const array = new Float64Array([0, 0, 0, 1]);
    const quat = Quaterniond.fromFloat64Array(array);
    array[3] = 0.5;
    expect(quat.w).toBe(0.5);
    expect(quat._v).toBe(array);
  });

  it('clamps the rotation angle with double precision', () => {
    const quat = Quaterniond.fromAxisAngle(Vector3.fromCopy3(0, 1, 0), Math.PI / 2);
    const clamped = Quaterniond.clampRotation(quat, Math.PI / 4);
    expect(clamped._v).toBeInstanceOf(Float64Array);
    expect(Quaterniond.getQuaternionAngle(clamped as Quaterniond)).toBeCloseTo(Math.PI / 4, 6);
  });
});

describe('MutableQuaterniond', () => {
  it('stores data in a Float64Array', () => {
    expect(MutableQuaterniond.identity()._v).toBeInstanceOf(Float64Array);
    expect(MutableQuaternion.identity()._v).toBeInstanceOf(Float32Array);
  });

  it('mutates in double precision', () => {
    const quat = MutableQuaterniond.identity();
    quat.setComponents(0.1, 0.2, 0.3, 0.4);
    expect(quat.x).toBeCloseTo(0.1, 15);
    expect(quat.y).toBeCloseTo(0.2, 15);
    expect(quat._v).toBeInstanceOf(Float64Array);
    expect(quat.clone()._v).toBeInstanceOf(Float64Array);
  });

  it('normalizes in place in double precision', () => {
    const quat = MutableQuaterniond.fromCopy4(0, 2, 0, 0);
    quat.normalize();
    expect(quat.y).toBeCloseTo(1, 15);
    expect(quat.length()).toBeCloseTo(1, 15);
    expect(quat._v).toBeInstanceOf(Float64Array);
  });
});
