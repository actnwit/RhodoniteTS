import type { IQuaternion, IVector3 } from '../math';
import { Vector3 } from '../math';

export type BoxShapeDescriptor = {
  readonly type: 'box';
  readonly size: IVector3;
};

export type SphereShapeDescriptor = {
  readonly type: 'sphere';
  readonly radius: number;
};

export type ShapeDescriptor = BoxShapeDescriptor | SphereShapeDescriptor;

export type ShapeLocalTransform = {
  readonly position?: IVector3;
  readonly rotation?: IQuaternion;
};

export type ShapeInstance = {
  readonly shape: ShapeDescriptor;
  readonly localPosition: IVector3;
  readonly localRotation: IQuaternion;
};

const normalizedDescriptors = new WeakSet<object>();

/** Creates or validates an immutable, shareable shape descriptor. */
export function normalizeShapeDescriptor(descriptor: ShapeDescriptor): ShapeDescriptor {
  if (normalizedDescriptors.has(descriptor)) {
    return descriptor;
  }
  let normalized: ShapeDescriptor;
  if (descriptor.type === 'box') {
    if (
      !Number.isFinite(descriptor.size.x) ||
      !Number.isFinite(descriptor.size.y) ||
      !Number.isFinite(descriptor.size.z) ||
      descriptor.size.x <= 0 ||
      descriptor.size.y <= 0 ||
      descriptor.size.z <= 0
    ) {
      throw new Error('Box shape size must contain finite positive values.');
    }
    normalized = Object.freeze({
      type: 'box',
      size: Vector3.fromCopy3(descriptor.size.x, descriptor.size.y, descriptor.size.z),
    });
  } else {
    if (!Number.isFinite(descriptor.radius) || descriptor.radius <= 0) {
      throw new Error('Sphere shape radius must be a finite positive value.');
    }
    normalized = Object.freeze({ type: 'sphere', radius: descriptor.radius });
  }
  normalizedDescriptors.add(normalized);
  return normalized;
}
