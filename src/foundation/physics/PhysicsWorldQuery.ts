import type { IEntity } from '../core/Entity';
import { type IVector3, Vector3 } from '../math';

export interface PhysicsQueryCandidate {
  entity: IEntity;
  bindingId?: number;
  isSensor: boolean;
}

export interface PhysicsRaycastHit extends PhysicsQueryCandidate {
  position: IVector3;
  normal: IVector3;
  distance: number;
  fraction: number;
}

export interface PhysicsColliderQueryTarget {
  entity: IEntity;
  bindingId?: number;
}

export interface PhysicsRaycastOptions {
  includeSensors?: boolean;
  solid?: boolean;
  collisionGroup?: number;
  collisionMask?: number;
  excludeEntities?: readonly IEntity[];
  excludeColliders?: readonly PhysicsColliderQueryTarget[];
  predicate?: (candidate: PhysicsQueryCandidate) => boolean;
}

/** @internal Fully resolved query settings passed to a backend strategy. */
export interface ResolvedPhysicsRaycastOptions {
  includeSensors: boolean;
  solid: boolean;
  collisionGroup: number;
  collisionMask: number;
  excludeEntities: readonly IEntity[];
  excludeColliders: readonly PhysicsColliderQueryTarget[];
  predicate?: (candidate: PhysicsQueryCandidate) => boolean;
}

export interface PhysicsWorldQueryStrategy {
  castRay(
    origin: IVector3,
    normalizedDirection: IVector3,
    maxDistance: number,
    options: ResolvedPhysicsRaycastOptions
  ): PhysicsRaycastHit | undefined;
}

/** Backend-neutral physics scene-query facade. */
export class PhysicsWorldQuery {
  constructor(private readonly __strategy: PhysicsWorldQueryStrategy) {}

  castRay(
    origin: IVector3,
    direction: IVector3,
    maxDistance: number,
    options: PhysicsRaycastOptions = {}
  ): PhysicsRaycastHit | undefined {
    PhysicsWorldQuery.__assertFiniteVector(origin, 'origin');
    PhysicsWorldQuery.__assertFiniteVector(direction, 'direction');
    if (!Number.isFinite(maxDistance) || maxDistance <= 0) {
      throw new Error(`Physics ray maxDistance must be a finite positive number: ${maxDistance}`);
    }
    const directionLength = direction.length();
    if (!Number.isFinite(directionLength) || directionLength === 0) {
      throw new Error('Physics ray direction must be non-zero.');
    }

    return this.__strategy.castRay(origin, Vector3.normalize(direction), maxDistance, {
      includeSensors: options.includeSensors ?? false,
      solid: options.solid ?? true,
      collisionGroup: options.collisionGroup ?? 0xffff,
      collisionMask: options.collisionMask ?? 0xffff,
      excludeEntities: options.excludeEntities ?? [],
      excludeColliders: options.excludeColliders ?? [],
      predicate: options.predicate,
    });
  }

  castRaySegment(start: IVector3, end: IVector3, options: PhysicsRaycastOptions = {}): PhysicsRaycastHit | undefined {
    PhysicsWorldQuery.__assertFiniteVector(start, 'start');
    PhysicsWorldQuery.__assertFiniteVector(end, 'end');
    const direction = Vector3.subtract(end, start);
    return this.castRay(start, direction, direction.length(), options);
  }

  private static __assertFiniteVector(vector: IVector3, label: string): void {
    if (!Number.isFinite(vector.x) || !Number.isFinite(vector.y) || !Number.isFinite(vector.z)) {
      throw new Error(`Physics ray ${label} must contain only finite values.`);
    }
  }
}
