import { Quaternion, Vector3 } from '../math';
import { resolveScaledBox } from './ShapeTransformResolver';

test('resolves a locally rotated non-square box under a mirrored scale to the same OBB axes', () => {
  const axisX = Vector3.fromCopy3(1, 0, 0);
  const axisY = Vector3.fromCopy3(0, 1, 0);
  const axisZ = Vector3.fromCopy3(0, 0, 1);
  const localRotation = Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 0, 1), Math.PI / 4);
  const scale = Vector3.fromCopy3(-1, 1, 1);
  const resolved = resolveScaledBox(Vector3.fromCopy3(4, 2, 1), localRotation, scale);

  const expectedXAxis = Vector3.normalize(Vector3.multiplyVector(localRotation.transformVector3(axisX), scale));
  const expectedYAxis = Vector3.normalize(Vector3.multiplyVector(localRotation.transformVector3(axisY), scale));
  const actualXAxis = resolved.rotation.transformVector3(axisX);
  const actualYAxis = resolved.rotation.transformVector3(axisY);
  const actualZAxis = resolved.rotation.transformVector3(axisZ);
  const expectedZAxis = Vector3.normalize(Vector3.multiplyVector(localRotation.transformVector3(axisZ), scale));

  expect(resolved.approximated).toBe(false);
  expect(resolved.halfExtents.x).toBeCloseTo(2);
  expect(resolved.halfExtents.y).toBeCloseTo(1);
  expect(resolved.halfExtents.z).toBeCloseTo(0.5);
  // A centered box is symmetric about each local axis, so either direction represents the same OBB axis.
  expect(Math.abs(Vector3.dot(actualXAxis, expectedXAxis))).toBeCloseTo(1);
  expect(Math.abs(Vector3.dot(actualYAxis, expectedYAxis))).toBeCloseTo(1);
  expect(Math.abs(Vector3.dot(actualZAxis, expectedZAxis))).toBeCloseTo(1);
});
