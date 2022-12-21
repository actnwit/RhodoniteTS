import { Matrix33 } from './Matrix33';
import { Vector3 } from './Vector3';

test('rotateX', () => {
  const r = Matrix33.rotateX(Math.PI / 2);
  const a = Vector3.fromCopy3(0, 1, 0);
  const b = r.multiplyVector(a);
  expect(b.isEqual(Vector3.fromCopy3(0, 0, 1))).toBe(true);
});

test('rotateY', () => {
  const r = Matrix33.rotateY(Math.PI / 2);
  const a = Vector3.fromCopy3(1, 0, 0);
  const b = r.multiplyVector(a);
  expect(b.isEqual(Vector3.fromCopy3(0, 0, -1))).toBe(true);
});

test('rotateZ', () => {
  const r = Matrix33.rotateZ(Math.PI / 2);
  const a = Vector3.fromCopy3(1, 0, 0);
  const b = r.multiplyVector(a);
  expect(b.isEqual(Vector3.fromCopy3(0, 1, 0))).toBe(true);
});
