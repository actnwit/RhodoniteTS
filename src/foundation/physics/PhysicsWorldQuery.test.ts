import { describe, expect, test } from 'vitest';
import type { IEntity } from '../core/Entity';
import { Vector3 } from '../math';
import {
  PhysicsWorldQuery,
  type PhysicsWorldQueryStrategy,
  type ResolvedPhysicsRaycastOptions,
} from './PhysicsWorldQuery';

describe('PhysicsWorldQuery', () => {
  test('normalizes a ray direction and resolves option defaults', () => {
    let receivedDirection = Vector3.zero();
    let receivedOptions: ResolvedPhysicsRaycastOptions | undefined;
    const strategy: PhysicsWorldQueryStrategy = {
      castRay: (_origin, direction, _maxDistance, options) => {
        receivedDirection = Vector3.fromCopy3(direction.x, direction.y, direction.z);
        receivedOptions = options;
        return undefined;
      },
      castSphere: () => undefined,
    };

    new PhysicsWorldQuery(strategy).castRay(Vector3.zero(), Vector3.fromCopy3(0, -2, 0), 3);

    expect(receivedDirection.isEqual(Vector3.fromCopy3(0, -1, 0))).toBe(true);
    expect(receivedOptions).toMatchObject({
      includeSensors: false,
      solid: true,
      collisionGroup: 0xffff,
      collisionMask: 0xffff,
      excludeEntities: [],
      excludeColliders: [],
    });
  });

  test('casts a segment using its direction and length', () => {
    let receivedMaxDistance = 0;
    const strategy: PhysicsWorldQueryStrategy = {
      castRay: (_origin, _direction, maxDistance) => {
        receivedMaxDistance = maxDistance;
        return {
          entity: {} as IEntity,
          isSensor: false,
          position: Vector3.zero(),
          normal: Vector3.fromCopy3(0, 1, 0),
          distance: maxDistance / 2,
          fraction: 0.5,
        };
      },
      castSphere: () => undefined,
    };

    const hit = new PhysicsWorldQuery(strategy).castRaySegment(Vector3.fromCopy3(1, 2, 3), Vector3.fromCopy3(1, -2, 3));

    expect(receivedMaxDistance).toBe(4);
    expect(hit?.fraction).toBe(0.5);
  });

  test('rejects invalid rays', () => {
    const query = new PhysicsWorldQuery({ castRay: () => undefined, castSphere: () => undefined });
    expect(() => query.castRay(Vector3.zero(), Vector3.zero(), 1)).toThrow('non-zero');
    expect(() => query.castRay(Vector3.zero(), Vector3.fromCopy3(0, -1, 0), 0)).toThrow('maxDistance');
    expect(() => query.castRay(Vector3.fromCopy3(Number.NaN, 0, 0), Vector3.one(), 1)).toThrow('origin');
    expect(() => query.castRaySegment(Vector3.zero(), Vector3.zero())).toThrow('maxDistance');
  });

  test('normalizes sphere-cast input and validates its dimensions', () => {
    let receivedDirection = Vector3.zero();
    let receivedRadius = 0;
    const strategy: PhysicsWorldQueryStrategy = {
      castRay: () => undefined,
      castSphere: (_origin, radius, direction, _maxDistance, options) => {
        receivedRadius = radius;
        receivedDirection = Vector3.fromCopy3(direction.x, direction.y, direction.z);
        expect(options).toMatchObject({ targetDistance: 0, stopAtPenetration: true, includeSensors: false });
        return undefined;
      },
    };
    const query = new PhysicsWorldQuery(strategy);

    query.castSphere(Vector3.zero(), 0.4, Vector3.fromCopy3(0, -3, 0), 2);
    expect(receivedRadius).toBe(0.4);
    expect(receivedDirection.isEqual(Vector3.fromCopy3(0, -1, 0))).toBe(true);
    expect(() => query.castSphere(Vector3.zero(), 0, Vector3.fromCopy3(0, -1, 0), 2)).toThrow('sphere radius');
    expect(() => query.castSphere(Vector3.zero(), 1, Vector3.zero(), 2)).toThrow('non-zero');
    expect(() => query.castSphere(Vector3.zero(), 1, Vector3.fromCopy3(0, -1, 0), 0)).toThrow('maxDistance');
  });
});
