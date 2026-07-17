import { type IVector3 } from '../../math';
import type { PhysicsRaycastHit, PhysicsShapeCastHit, PhysicsWorldQueryStrategy, ResolvedPhysicsRaycastOptions, ResolvedPhysicsShapeCastOptions } from '../PhysicsWorldQuery';
/** Physics scene queries backed by the shared Rapier world. */
export declare class RapierPhysicsWorldQueryStrategy implements PhysicsWorldQueryStrategy {
    castRay(origin: IVector3, normalizedDirection: IVector3, maxDistance: number, options: ResolvedPhysicsRaycastOptions): PhysicsRaycastHit | undefined;
    castSphere(origin: IVector3, radius: number, normalizedDirection: IVector3, maxDistance: number, options: ResolvedPhysicsShapeCastOptions): PhysicsShapeCastHit | undefined;
    private __createPredicate;
}
