import { type IVector3, Vector3 } from '../../math';
import type { PhysicsRaycastHit, PhysicsWorldQueryStrategy, ResolvedPhysicsRaycastOptions } from '../PhysicsWorldQuery';
import { type RapierColliderLike, RapierPhysicsStrategy } from './RapierPhysicsStrategy';

/** Physics scene queries backed by the shared Rapier world. */
export class RapierPhysicsWorldQueryStrategy implements PhysicsWorldQueryStrategy {
  castRay(
    origin: IVector3,
    normalizedDirection: IVector3,
    maxDistance: number,
    options: ResolvedPhysicsRaycastOptions
  ): PhysicsRaycastHit | undefined {
    const rapier = RapierPhysicsStrategy._getRapier();
    const world = RapierPhysicsStrategy._getWorld();
    if (rapier.Ray == null || world.castRayAndGetNormal == null) {
      throw new Error('The injected Rapier module does not support ray casting.');
    }

    const excludedEntityUIDs = new Set(options.excludeEntities.map(entity => entity.entityUID));
    const predicate = (collider: RapierColliderLike) => {
      const metadata = RapierPhysicsStrategy._getColliderMetadata(collider);
      if (metadata == null || excludedEntityUIDs.has(metadata.entity.entityUID)) {
        return false;
      }
      if (
        options.excludeColliders.some(
          target => target.entity.entityUID === metadata.entity.entityUID && target.bindingId === metadata.bindingId
        )
      ) {
        return false;
      }
      return options.predicate?.(metadata) ?? true;
    };
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
    const metadata = RapierPhysicsStrategy._getColliderMetadata(hit.collider);
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
}
