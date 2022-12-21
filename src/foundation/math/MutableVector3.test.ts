import { MutableVector3 } from './MutableVector3';
import { Vector3 } from './Vector3';

test('rotateX', () => {
  const a = Vector3.fromCopy3(0, 1, 0);
  const b = MutableVector3.zero();
  MutableVector3.rotateX(a, Math.PI / 2, b);

  expect(b.isEqual(Vector3.fromCopy3(0, 0, 1))).toBe(true);
});

test('rotateY', () => {
  const a = Vector3.fromCopy3(1, 0, 0);
  const b = MutableVector3.zero();
  MutableVector3.rotateY(a, Math.PI / 2, b);

  expect(b.isEqual(Vector3.fromCopy3(0, 0, -1))).toBe(true);
});

test('rotateZ', () => {
  const a = Vector3.fromCopy3(1, 0, 0);
  const b = MutableVector3.zero();
  MutableVector3.rotateZ(a, Math.PI / 2, b);

  expect(b.isEqual(Vector3.fromCopy3(0, 1, 0))).toBe(true);
});
