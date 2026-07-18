import { type IVector3, Vector3 } from '../../math';
import type { Engine } from '../../system/Engine';
import type {
  PhysicsRaycastHit,
  PhysicsShapeCastHit,
  PhysicsWorldQueryStrategy,
  ResolvedPhysicsRaycastOptions,
  ResolvedPhysicsShapeCastOptions,
} from '../PhysicsWorldQuery';
import { type RapierColliderLike, RapierPhysicsStrategy } from './RapierPhysicsStrategy';

/** Physics scene queries backed by one Engine's Rapier world. */
export class RapierPhysicsWorldQueryStrategy implements PhysicsWorldQueryStrategy {
  constructor(private readonly __engine?: Engine) {}

  castRay(
    origin: IVector3,
    normalizedDirection: IVector3,
    maxDistance: number,
    options: ResolvedPhysicsRaycastOptions
  ): PhysicsRaycastHit | undefined {
    const rapier = RapierPhysicsStrategy._getRapier();
    const world = RapierPhysicsStrategy._getWorld(this.__engine);
    if (rapier.Ray == null || world.castRayAndGetNormal == null) {
      throw new Error('The injected Rapier module does not support ray casting.');
    }

    const predicate = this.__createPredicate(options);
    const hit = world.castRayAndGetNormal(
      new rapier.Ray(origin, normalizedDirection),
      maxDistance,
      options.solid,
      options.includeSensors ? 0 : (rapier.QueryFilterFlags?.EXCLUDE_SENSORS ?? 8),
      RapierPhysicsStrategy._packCollisionGroups(options.collisionGroup, options.collisionMask),
      undefined,
      undefined,
      predicate
    );
    if (hit == null) {
      return undefined;
    }
    const metadata = RapierPhysicsStrategy._getColliderMetadata(hit.collider, this.__engine);
    if (metadata == null) {
      return undefined;
    }
    const distance = hit.timeOfImpact;
    return {
      ...metadata,
      position: Vector3.add(origin, Vector3.multiply(normalizedDirection, distance)),
      normal: Vector3.fromCopy3(hit.normal.x, hit.normal.y, hit.normal.z),
      distance,
      fraction: distance / maxDistance,
    };
  }

  castSphere(
    origin: IVector3,
    radius: number,
    normalizedDirection: IVector3,
    maxDistance: number,
    options: ResolvedPhysicsShapeCastOptions
  ): PhysicsShapeCastHit | undefined {
    const rapier = RapierPhysicsStrategy._getRapier();
    const world = RapierPhysicsStrategy._getWorld(this.__engine);
    if (rapier.Ball == null || world.castShape == null) {
      throw new Error('The injected Rapier module does not support sphere casting.');
    }
    const hit = world.castShape(
      origin,
      { x: 0, y: 0, z: 0, w: 1 },
      normalizedDirection,
      new rapier.Ball(radius),
      options.targetDistance,
      maxDistance,
      options.stopAtPenetration,
      options.includeSensors ? 0 : (rapier.QueryFilterFlags?.EXCLUDE_SENSORS ?? 8),
      RapierPhysicsStrategy._packCollisionGroups(options.collisionGroup, options.collisionMask),
      undefined,
      undefined,
      this.__createPredicate(options)
    );
    if (hit == null) {
      return undefined;
    }
    const metadata = RapierPhysicsStrategy._getColliderMetadata(hit.collider, this.__engine);
    if (metadata == null) {
      return undefined;
    }
    const distance = hit.time_of_impact;
    // World.castShape reports the hit collider as shape 1 and the cast shape as shape 2.
    const normal = Vector3.normalize(Vector3.fromCopy3(hit.normal1.x, hit.normal1.y, hit.normal1.z));
    return {
      ...metadata,
      position: Vector3.fromCopy3(hit.witness1.x, hit.witness1.y, hit.witness1.z),
      normal,
      distance,
      fraction: distance / maxDistance,
    };
  }

  private __createPredicate(options: ResolvedPhysicsRaycastOptions): (collider: RapierColliderLike) => boolean {
    const excludedEntities = new Set(options.excludeEntities);
    return collider => {
      const metadata = RapierPhysicsStrategy._getColliderMetadata(collider, this.__engine);
      if (metadata == null || excludedEntities.has(metadata.entity)) {
        return false;
      }
      if (
        options.excludeColliders.some(
          target => target.entity === metadata.entity && target.bindingId === metadata.bindingId
        )
      ) {
        return false;
      }
      return options.predicate?.(metadata) ?? true;
    };
  }
}
