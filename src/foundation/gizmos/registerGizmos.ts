import { AABBGizmo } from './AABBGizmo';
import { CapsuleColliderGizmo } from './CapsuleColliderGizmo';
import { _setGizmoClasses } from './GizmoRegistry';
import { JointGizmo } from './JointGizmo';
import { LightGizmo } from './LightGizmo';
import { LocatorGizmo } from './LocatorGizmo';
import { RotationGizmo } from './RotationGizmo';
import { ScaleGizmo } from './ScaleGizmo';
import { ShapeGizmo } from './ShapeGizmo';
import { SphereColliderGizmo } from './SphereColliderGizmo';
import { TranslationGizmo } from './TranslationGizmo';

/**
 * Registers every gizmo class, so that properties such as `SceneGraphComponent.isTranslationGizmoVisible`,
 * `LightComponent.isLightGizmoVisible` and `ShapeComponent.isShapeGizmoVisible` can create gizmos.
 *
 * @remarks
 * The default `Rn` namespace export calls this automatically. Applications that use named imports call it once
 * before showing a gizmo; applications that never show one leave it out, and their bundler drops the gizmo
 * classes. Calling it more than once is harmless.
 *
 * @example
 * ```typescript
 * import { registerGizmos } from 'rhodonite';
 * registerGizmos();
 * entity.getSceneGraph().isTranslationGizmoVisible = true;
 * ```
 */
export function registerGizmos(): void {
  _setGizmoClasses({
    translation: TranslationGizmo,
    rotation: RotationGizmo,
    scale: ScaleGizmo,
    aabb: AABBGizmo,
    locator: LocatorGizmo,
    joint: JointGizmo,
    light: LightGizmo,
    shape: ShapeGizmo,
    sphereCollider: SphereColliderGizmo,
    capsuleCollider: CapsuleColliderGizmo,
  });
}
