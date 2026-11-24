import type { Engine } from '../system/Engine';
import type { AABBGizmo } from './AABBGizmo';
import type { CapsuleColliderGizmo } from './CapsuleColliderGizmo';
import type { JointGizmo } from './JointGizmo';
import type { LightGizmo } from './LightGizmo';
import type { LocatorGizmo } from './LocatorGizmo';
import type { RotationGizmo } from './RotationGizmo';
import type { ScaleGizmo } from './ScaleGizmo';
import type { ShapeGizmo } from './ShapeGizmo';
import type { SphereColliderGizmo } from './SphereColliderGizmo';
import type { TranslationGizmo } from './TranslationGizmo';
/** The gizmo classes that components create on demand, keyed by kind. */
export type GizmoClasses = {
    translation: typeof TranslationGizmo;
    rotation: typeof RotationGizmo;
    scale: typeof ScaleGizmo;
    aabb: typeof AABBGizmo;
    locator: typeof LocatorGizmo;
    joint: typeof JointGizmo;
    light: typeof LightGizmo;
    shape: typeof ShapeGizmo;
    sphereCollider: typeof SphereColliderGizmo;
    capsuleCollider: typeof CapsuleColliderGizmo;
};
export type GizmoKind = keyof GizmoClasses;
/**
 * Registers gizmo classes. Called by `registerGizmos()`.
 * @internal
 */
export declare function _setGizmoClasses(classes: Partial<GizmoClasses>): void;
/**
 * Returns the registered gizmo class of the given kind.
 * @throws If `registerGizmos()` has not been called
 * @internal
 */
export declare function _getGizmoClass<K extends GizmoKind>(kind: K): GizmoClasses[K];
/**
 * Releases the per-Engine resources that the registered gizmo classes keep.
 * @internal
 */
export declare function _cleanupGizmosForEngine(engine: Engine): void;
