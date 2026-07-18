import type { IQuaternion } from '../math/IQuaternion';
import type { IVector3 } from '../math/IVector';
import { Matrix44 } from '../math/Matrix44';
import { Quaternion } from '../math/Quaternion';
import { Vector3 } from '../math/Vector3';

const orthogonalityTolerance = 0.00001;

export type ResolvedBoxTransform = {
  halfExtents: IVector3;
  rotation: IQuaternion;
  approximated: boolean;
};

export type ResolvedAxialTransform = {
  halfHeight: number;
  radius: number;
  rotation: IQuaternion;
  approximated: boolean;
};

function getScaledAxes(localRotation: IQuaternion, scale: IVector3) {
  const rotatedAxes = [
    localRotation.transformVector3(Vector3.fromCopy3(1, 0, 0)),
    localRotation.transformVector3(Vector3.fromCopy3(0, 1, 0)),
    localRotation.transformVector3(Vector3.fromCopy3(0, 0, 1)),
  ];
  const scaledAxes = rotatedAxes.map(axis => Vector3.fromCopy3(axis.x * scale.x, axis.y * scale.y, axis.z * scale.z));
  return { rotatedAxes, scaledAxes };
}

/** Resolves S * R for a box, falling back to a conservative entity-local AABB when it contains shear. */
export function resolveScaledBox(size: IVector3, localRotation: IQuaternion, scale: IVector3): ResolvedBoxTransform {
  const halfSize = Vector3.fromCopy3(size.x * 0.5, size.y * 0.5, size.z * 0.5);
  const { rotatedAxes, scaledAxes } = getScaledAxes(localRotation, scale);
  const axisLengths = scaledAxes.map(axis => Math.hypot(axis.x, axis.y, axis.z));
  const normalizedAxes = scaledAxes.map((axis, index) => Vector3.multiply(axis, 1 / axisLengths[index]));
  const hasShear =
    Math.abs(Vector3.dot(normalizedAxes[0], normalizedAxes[1])) > orthogonalityTolerance ||
    Math.abs(Vector3.dot(normalizedAxes[0], normalizedAxes[2])) > orthogonalityTolerance ||
    Math.abs(Vector3.dot(normalizedAxes[1], normalizedAxes[2])) > orthogonalityTolerance;

  if (!hasShear) {
    const rotationMatrix = Matrix44.fromCopy16RowMajor(
      normalizedAxes[0].x,
      normalizedAxes[1].x,
      normalizedAxes[2].x,
      0,
      normalizedAxes[0].y,
      normalizedAxes[1].y,
      normalizedAxes[2].y,
      0,
      normalizedAxes[0].z,
      normalizedAxes[1].z,
      normalizedAxes[2].z,
      0,
      0,
      0,
      0,
      1
    );
    return {
      halfExtents: Vector3.fromCopy3(
        halfSize.x * axisLengths[0],
        halfSize.y * axisLengths[1],
        halfSize.z * axisLengths[2]
      ),
      rotation: Quaternion.normalize(Quaternion.fromMatrix(rotationMatrix)),
      approximated: false,
    };
  }

  return {
    halfExtents: Vector3.fromCopy3(
      scale.x *
        (Math.abs(rotatedAxes[0].x) * halfSize.x +
          Math.abs(rotatedAxes[1].x) * halfSize.y +
          Math.abs(rotatedAxes[2].x) * halfSize.z),
      scale.y *
        (Math.abs(rotatedAxes[0].y) * halfSize.x +
          Math.abs(rotatedAxes[1].y) * halfSize.y +
          Math.abs(rotatedAxes[2].y) * halfSize.z),
      scale.z *
        (Math.abs(rotatedAxes[0].z) * halfSize.x +
          Math.abs(rotatedAxes[1].z) * halfSize.y +
          Math.abs(rotatedAxes[2].z) * halfSize.z)
    ),
    rotation: Quaternion.identity(),
    approximated: true,
  };
}

/** Resolves a scaled cylinder to a containing circular cylinder aligned with its transformed local Y axis. */
export function resolveScaledCylinder(
  height: number,
  radius: number,
  localRotation: IQuaternion,
  scale: IVector3
): ResolvedAxialTransform {
  const { scaledAxes } = getScaledAxes(localRotation, scale);
  const radialAxis0 = scaledAxes[0];
  const axialVector = scaledAxes[1];
  const radialAxis1 = scaledAxes[2];
  const axialScale = Math.hypot(axialVector.x, axialVector.y, axialVector.z);
  const normalizedAxis = Vector3.multiply(axialVector, 1 / axialScale);
  const axialRadial0 = Vector3.dot(normalizedAxis, radialAxis0);
  const axialRadial1 = Vector3.dot(normalizedAxis, radialAxis1);
  const projectedRadial0 = Vector3.subtract(radialAxis0, Vector3.multiply(normalizedAxis, axialRadial0));
  const projectedRadial1 = Vector3.subtract(radialAxis1, Vector3.multiply(normalizedAxis, axialRadial1));
  const gram00 = Vector3.dot(projectedRadial0, projectedRadial0);
  const gram01 = Vector3.dot(projectedRadial0, projectedRadial1);
  const gram11 = Vector3.dot(projectedRadial1, projectedRadial1);
  const discriminant = Math.sqrt(Math.max(0, (gram00 - gram11) ** 2 + 4 * gram01 ** 2));
  const radialScale = Math.sqrt(Math.max(0, (gram00 + gram11 + discriminant) * 0.5));
  const axialShearScale = Math.hypot(axialRadial0, axialRadial1);
  const comparisonScale = Math.max(1, axialScale, radialScale);
  const approximated =
    axialShearScale > orthogonalityTolerance * comparisonScale ||
    Math.abs(gram00 - gram11) > orthogonalityTolerance * comparisonScale ** 2 ||
    Math.abs(gram01) > orthogonalityTolerance * comparisonScale ** 2;

  return {
    halfHeight: height * axialScale * 0.5 + radius * axialShearScale,
    radius: radius * radialScale,
    rotation: Quaternion.fromToRotation(Vector3.fromCopy3(0, 1, 0), normalizedAxis),
    approximated,
  };
}

/** Resolves a scaled capsule using its transformed segment and a sphere containing the scaled end caps. */
export function resolveScaledCapsule(
  height: number,
  radius: number,
  localRotation: IQuaternion,
  scale: IVector3
): ResolvedAxialTransform {
  const axialVector = localRotation.transformVector3(Vector3.fromCopy3(0, 1, 0));
  const scaledAxis = Vector3.fromCopy3(axialVector.x * scale.x, axialVector.y * scale.y, axialVector.z * scale.z);
  const axialScale = Math.hypot(scaledAxis.x, scaledAxis.y, scaledAxis.z);
  const normalizedAxis = Vector3.multiply(scaledAxis, 1 / axialScale);
  const maxScale = Math.max(scale.x, scale.y, scale.z);
  const minScale = Math.min(scale.x, scale.y, scale.z);
  return {
    halfHeight: height * axialScale * 0.5,
    radius: radius * maxScale,
    rotation: Quaternion.fromToRotation(Vector3.fromCopy3(0, 1, 0), normalizedAxis),
    approximated: maxScale - minScale > orthogonalityTolerance,
  };
}
