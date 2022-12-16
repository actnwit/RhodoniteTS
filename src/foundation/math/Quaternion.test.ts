import { Vector3 } from '.';
import { Quaternion } from './Quaternion';

test('Quaternion is immutable', () => {
  const vec = Quaternion.fromCopyArray([0, 3, 4, 0]);
  expect(() => {
    (vec as any).x = 1;
  }).toThrowError();
  expect(() => {
    (vec as any).y = 1;
  }).toThrowError();
  expect(() => {
    (vec as any).z = 1;
  }).toThrowError();
  expect(() => {
    (vec as any).w = 1;
  }).toThrowError();

  expect(vec.w).toBe(0);
});

test('Transform vector with quaternion', () => {
  const vec = Vector3.fromCopy3(0, 0, 1);

  // Rotate 90 degrees around the +y axis in CW.
  const q = Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 1, 0), Math.PI / 2);
  const result_vec = q.transformVector3(vec);
  console.log(result_vec);
  expect(result_vec.isEqual(Vector3.fromCopy3(1, 0, 0), 0.0001)).toBe(true);
});

test('Transform vector with (quat * quat). (1)', () => {
  const vec = Vector3.fromCopy3(0, 0, 1);
  // Rotate 90 degrees around the +y axis in CW.
  const q = Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 1, 0), Math.PI / 2);
  // Rotate 90 degrees around the +y axis in CW.
  const q2 = Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 1, 0), Math.PI / 2);
  const qq = Quaternion.multiply(q, q2);
  const result_vec = qq.transformVector3(vec);
  console.log(result_vec);
  expect(result_vec.isEqual(Vector3.fromCopy3(0, 0, -1), 0.0001)).toBe(true);
});

test('Transform vector with (quat * quat). (2)', () => {
  const vec = Vector3.fromCopy3(0, 0, 1);
  // Rotate 90 degrees around the +y axis in CW.
  const q = Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 1, 0), Math.PI / 2);
  // Rotate 90 degrees around the +z axis in CW.
  const q2 = Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 0, 1), Math.PI / 2);
  const qq = Quaternion.multiply(q2, q); // First, q works, then q2 works.
  const result_vec = qq.transformVector3(vec);
  console.log(result_vec);
  expect(result_vec.isEqual(Vector3.fromCopy3(0, 1, 0), 0.0001)).toBe(true);
});

test('Transform vector with (quat * quat). (3)', () => {
  const vec = Vector3.fromCopy3(0, 0, 1);
  // Rotate 90 degrees around the +y axis in CW.
  const q = Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 0, 1), Math.PI / 2);
  // Rotate 90 degrees around the +z axis in CW.
  const q2 = Quaternion.fromAxisAngle(Vector3.fromCopy3(1, 0, 0), Math.PI / 2);
  const qq = Quaternion.multiply(q, q2); // First, q2 works, then q works.
  const result_vec = qq.transformVector3(vec);
  console.log(result_vec);
  expect(result_vec.isEqual(Vector3.fromCopy3(1, 0, 0), 0.0001)).toBe(true);
});

test('fromToRotation', () => {
  const v1 = Vector3.fromCopy3(0, 0, 1);
  const v2 = Vector3.fromCopy3(1, 0, 0);
  const q = Quaternion.fromToRotation(v1, v2);
  const v = Vector3.fromCopy3(0, 0, 1);
  const result_vec = q.transformVector3(v);
  expect(result_vec.isEqual(Vector3.fromCopy3(1, 0, 0), 0.0001)).toBe(true);
});

test('Inverse Transform vector with quaternion', () => {
  const vec = Vector3.fromCopy3(0, 0, 1);

  // Rotate -90 degrees around the +y axis in CW.
  const q = Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 1, 0), Math.PI / 2);
  const result_vec = q.transformVector3Inverse(vec);

  console.log(result_vec);
  expect(result_vec.isEqual(Vector3.fromCopy3(-1, 0, 0), 0.0001)).toBe(true);
});
