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
 * Gizmo classes registered by `registerGizmos()`.
 *
 * @remarks
 * Components such as SceneGraphComponent create gizmos through this registry instead of importing the gizmo
 * classes, so applications that never show a gizmo do not bundle them. The default `Rn` namespace export
 * registers every gizmo; applications that use named imports call `registerGizmos()` before showing one.
 */
const __gizmoClasses: Partial<GizmoClasses> = {};

/**
 * Registers gizmo classes. Called by `registerGizmos()`.
 * @internal
 */
export function _setGizmoClasses(classes: Partial<GizmoClasses>): void {
  Object.assign(__gizmoClasses, classes);
}

/**
 * Returns the registered gizmo class of the given kind.
 * @throws If `registerGizmos()` has not been called
 * @internal
 */
export function _getGizmoClass<K extends GizmoKind>(kind: K): GizmoClasses[K] {
  const gizmoClass = __gizmoClasses[kind];
  if (gizmoClass == null) {
    throw new Error(
      `The ${kind} gizmo is not registered. Call registerGizmos() (exported by Rhodonite) before showing gizmos. ` +
        'The default Rn namespace export registers them automatically.'
    );
  }
  return gizmoClass as GizmoClasses[K];
}

/**
 * Releases the per-Engine resources that the registered gizmo classes keep.
 * @internal
 */
export function _cleanupGizmosForEngine(engine: Engine): void {
  for (const gizmoClass of Object.values(__gizmoClasses)) {
    const cleanup = (gizmoClass as { _cleanupForEngine?: (engine: Engine) => void })._cleanupForEngine;
    cleanup?.(engine);
  }
}
