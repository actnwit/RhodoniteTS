import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
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
export declare class PreviousFrameDataTracker {
    private __entities;
    private __states;
    /**
     * Sets the entities to track. The state of the entities that are no longer tracked is dropped.
     *
     * @param entities - The entities rendered with motion vectors
     */
    setEntities(entities: readonly ISceneGraphEntity[]): void;
    /**
     * Writes the previous world matrices and bone data of the tracked entities that moved.
     *
     * @returns Whether a previous world matrix was written (the GPU instance data has to be uploaded)
     */
    update(): boolean;
    /** Drops all tracked entities. */
    clear(): void;
}
