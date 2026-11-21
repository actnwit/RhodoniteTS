import type { ISceneGraphEntity } from '../../../helpers';
import { type IVector3, Vector3 } from '../../../math';
import type { IQuaternion } from '../../../math/IQuaternion';
import { Is } from '../../../misc/Is';
import type { SceneGraphComponent } from '../../SceneGraph/SceneGraphComponent';

export interface IAnimationRetarget {
  retargetQuaternion(dstEntity: ISceneGraphEntity): IQuaternion;
  retargetTranslate(dstEntity: ISceneGraphEntity): IVector3;
  retargetScale(dstEntity: ISceneGraphEntity): IVector3;
  getEntity(): ISceneGraphEntity;
}

/**
 * Returns the scene graph of the skeleton root: the nearest ancestor that owns a
 * VRM component when the entity belongs to a VRM model, otherwise the topmost
 * ancestor. Scene-level placement above the model is therefore excluded.
 */
function getSkeletonRootSceneGraph(sceneGraph: SceneGraphComponent): SceneGraphComponent {
  let topMost = sceneGraph;
  let parent = sceneGraph.parent;
  while (Is.exist(parent)) {
    if (Is.exist(parent.entity.tryToGetVrm())) {
      return parent;
    }
    topMost = parent;
    parent = parent.parent;
  }
  return topMost;
}

/**
 * Returns the rest-pose distance from the skeleton root to the given entity.
 * For the hips this is the body's hip height.
 */
export function getRestHeight(entity: ISceneGraphEntity): number {
  const sceneGraph = entity.getSceneGraph();
  const rootSceneGraph = getSkeletonRootSceneGraph(sceneGraph);
  return Vector3.subtract(sceneGraph.positionRest, rootSceneGraph.positionRest).length();
}

/**
 * Computes the scale factor applied to a source translation delta so that it
 * produces a proportionally sized motion on the destination skeleton.
 *
 * The scale is the ratio of the rest-pose distances from each skeleton root,
 * which is proportional to the body size. A VRM Animation may store the hip
 * height in a separate parent node (e.g. `hipsBase`), so a bone's own local rest
 * translation is not a reliable size reference.
 */
export function getTranslationScale(
  srcEntity: ISceneGraphEntity,
  dstEntity: ISceneGraphEntity,
  srcLocalRestTranslation: IVector3,
  dstLocalRestTranslation: IVector3
): number {
  const srcRestHeight = getRestHeight(srcEntity);
  if (srcRestHeight > 1e-6) {
    const scale = getRestHeight(dstEntity) / srcRestHeight;
    if (Number.isFinite(scale) && scale > 0) {
      return scale;
    }
  }

  // Fallback for a degenerate rest height (the bone sits on the skeleton root):
  // approximate the scale with the local rest translation lengths.
  const srcLocalRestLength = srcLocalRestTranslation.length();
  if (srcLocalRestLength > 1e-6) {
    return dstLocalRestTranslation.length() / srcLocalRestLength;
  }
  return 1;
}
