import type { SceneGraphComponent } from '../../components/SceneGraph/SceneGraphComponent';
import type { ISceneGraphEntity } from '../../helpers/EntityHelper';

type PreviousWorldMatrixState = {
  /** `SceneGraphComponent.worldMatrixVersion` when the previous world matrix was last written. */
  version: number;
  /** Whether the previous world matrix has to be written again in the next frame. */
  isSettling: boolean;
};

/**
 * Keeps the previous frame data of a set of entities (in the GPU instance data) up to date for the motion vectors
 * of temporal anti-aliasing: `previousWorldMatrix` of their scene graph and the previous bone data of their
 * skeleton.
 *
 * @remarks
 * `update` runs once per frame before the logic stage, when the world matrices and the bone data in the GPU instance
 * data are still those of the previous frame. An entity whose world matrix version changed is written in this frame
 * and once more in the next frame: a change made between two frames (after rendering) is only computed in the next
 * frame, so its previous world matrix is only known one frame later. Entities that do not move are not written.
 * The previous bone data is copied whenever it differs from the bone data, which gives the same result.
 *
 * @internal
 */
export class PreviousFrameDataTracker {
  private __entities: readonly ISceneGraphEntity[] = [];
  private __states: Map<SceneGraphComponent, PreviousWorldMatrixState> = new Map();

  /**
   * Sets the entities to track. The state of the entities that are no longer tracked is dropped.
   *
   * @param entities - The entities rendered with motion vectors
   */
  setEntities(entities: readonly ISceneGraphEntity[]) {
    this.__entities = entities;
    const sceneGraphs = new Set<SceneGraphComponent>();
    for (const entity of entities) {
      sceneGraphs.add(entity.getSceneGraph());
    }
    for (const sceneGraph of this.__states.keys()) {
      if (!sceneGraphs.has(sceneGraph)) {
        this.__states.delete(sceneGraph);
      }
    }
  }

  /**
   * Writes the previous world matrices and bone data of the tracked entities that moved.
   *
   * @returns Whether a previous world matrix was written (the GPU instance data has to be uploaded)
   */
  update(): boolean {
    let isWritten = false;
    for (const entity of this.__entities) {
      const skeletal = entity.tryToGetSkeletal();
      if (skeletal != null) {
        skeletal._enablePreviousBoneData();
        if (skeletal._updatePreviousBoneData()) {
          isWritten = true;
        }
      }
      const sceneGraph = entity.getSceneGraph();
      const state = this.__states.get(sceneGraph);
      if (state == null) {
        // The first frame of this entity: no motion.
        sceneGraph._previousWorldMatrixInner.copyComponents(sceneGraph.matrixInner);
        this.__states.set(sceneGraph, { version: sceneGraph.worldMatrixVersion, isSettling: true });
        isWritten = true;
        continue;
      }
      const version = sceneGraph.worldMatrixVersion;
      if (state.version !== version || state.isSettling) {
        sceneGraph._previousWorldMatrixInner.copyComponents(sceneGraph._lastComputedWorldMatrixInner);
        state.isSettling = state.version !== version;
        state.version = version;
        isWritten = true;
      }
    }
    return isWritten;
  }

  /** Drops all tracked entities. */
  clear() {
    this.__entities = [];
    this.__states.clear();
  }
}
