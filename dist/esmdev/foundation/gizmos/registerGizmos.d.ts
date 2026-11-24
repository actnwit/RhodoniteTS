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
export declare function registerGizmos(): void;
