import type { IEntity } from '../core/Entity';
import { type IVector3 } from '../math';
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
export interface PhysicsShapeCastHit extends PhysicsQueryCandidate {
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
export interface PhysicsShapeCastOptions extends PhysicsRaycastOptions {
    targetDistance?: number;
    stopAtPenetration?: boolean;
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
/** @internal Fully resolved shape-cast settings passed to a backend strategy. */
export interface ResolvedPhysicsShapeCastOptions extends ResolvedPhysicsRaycastOptions {
    targetDistance: number;
    stopAtPenetration: boolean;
}
export interface PhysicsWorldQueryStrategy {
    castRay(origin: IVector3, normalizedDirection: IVector3, maxDistance: number, options: ResolvedPhysicsRaycastOptions): PhysicsRaycastHit | undefined;
    castSphere(origin: IVector3, radius: number, normalizedDirection: IVector3, maxDistance: number, options: ResolvedPhysicsShapeCastOptions): PhysicsShapeCastHit | undefined;
}
/** Backend-neutral physics scene-query facade. */
export declare class PhysicsWorldQuery {
    private readonly __strategy;
    constructor(__strategy: PhysicsWorldQueryStrategy);
    castRay(origin: IVector3, direction: IVector3, maxDistance: number, options?: PhysicsRaycastOptions): PhysicsRaycastHit | undefined;
    castRaySegment(start: IVector3, end: IVector3, options?: PhysicsRaycastOptions): PhysicsRaycastHit | undefined;
    castSphere(origin: IVector3, radius: number, direction: IVector3, maxDistance: number, options?: PhysicsShapeCastOptions): PhysicsShapeCastHit | undefined;
    private static __assertFiniteVector;
    private static __assertPositive;
}
