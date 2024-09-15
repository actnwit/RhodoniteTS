import type { SceneGraphComponent } from './SceneGraphComponent';
/**
 * Collects children and itself from specified sceneGraphComponent.
 * @param sceneGraphComponent collects children and itself from the sceneGraphComponent
 * @param isJointMode collects joints only
 */
export declare function flattenHierarchy(sceneGraphComponent: SceneGraphComponent, isJointMode: boolean): SceneGraphComponent[];
