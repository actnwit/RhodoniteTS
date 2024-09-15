import type { SceneGraphComponent } from './SceneGraphComponent';

/**
 * Collects children and itself from specified sceneGraphComponent.
 * @param sceneGraphComponent collects children and itself from the sceneGraphComponent
 * @param isJointMode collects joints only
 */
export function flattenHierarchy(
  sceneGraphComponent: SceneGraphComponent,
  isJointMode: boolean
): SceneGraphComponent[] {
  const results: SceneGraphComponent[] = [];
  if (!isJointMode || sceneGraphComponent.isJoint()) {
    results.push(sceneGraphComponent);
  }

  const children = sceneGraphComponent.children!;
  for (let i = 0; i < children.length; i++) {
    const hitChildren = flattenHierarchy(children[i], isJointMode);
    Array.prototype.push.apply(results, hitChildren);
  }

  return results;
}
