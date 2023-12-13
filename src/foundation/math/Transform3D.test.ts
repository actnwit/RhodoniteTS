import { Quaternion } from './Quaternion';
import { Transform3D } from './Transform3D';
import { Vector3 } from './Vector3';

test('Transform3D', () => {
  const t = new Transform3D();
  t.position = Vector3.fromCopy3(1, 2, 3);
  t.rotation = Quaternion.fromCopy4(0.5, 0.5, 0.5, 0.5);
  t.scale = Vector3.fromCopy3(1, 2, 3);

  const m = t.matrix;
  const t2 = t.clone();
  t2.matrix = m;

  console.log(t.positionInner.toStringApproximately());
  console.log(t.rotationInner.toStringApproximately());
  console.log(t.scaleInner.toStringApproximately());
  console.log(t2.positionInner.toStringApproximately());
  console.log(t2.rotationInner.toStringApproximately());
  console.log(t2.scaleInner.toStringApproximately());

  expect(t.isEqual(t2)).toBe(true);
});
