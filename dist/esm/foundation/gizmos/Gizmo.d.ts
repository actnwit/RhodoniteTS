import { RnObject } from '../core/RnObject';
import type { IMeshEntity, ISceneGraphEntity } from '../helpers/EntityHelper';
import type { IVector3 } from '../math/IVector';
import type { Engine } from '../system/Engine';
/**
 * Abstract Gizmo class that provides a foundation for creating interactive gizmo objects
 * in 3D scenes. Gizmos are typically used for manipulation tools like transform handles,
 * rotation rings, or other interactive visual aids.
 */
export declare abstract class Gizmo extends RnObject {
    /** Scratch vector used to transform a world position into view space. */
    private static readonly __tmpViewPosition;
    /**
     * The top entity of this gizmo group.
     * A programmer who implements a gizmo class has to make this entity
     * a child of the target entity's scene graph component
     * that the gizmo will belong to manually.
     */
    protected __topEntity?: IMeshEntity | ISceneGraphEntity;
    /** the target entity which this gizmo belong to */
    protected __target: ISceneGraphEntity;
    protected __isVisible: boolean;
    protected __engine: Engine;
    /**
     * Creates a new Gizmo instance
     * @param target - The entity that this gizmo will be associated with and manipulate
     */
    constructor(engine: Engine, target: ISceneGraphEntity);
    /**
     * Sets the visibility state of the gizmo
     * @param flg - True to make the gizmo visible, false to hide it
     */
    set isVisible(flg: boolean);
    /**
     * Gets the current visibility state of the gizmo
     * @returns True if the gizmo is visible, false otherwise
     */
    get isVisible(): boolean;
    /**
     * Internal method to set the visibility of the gizmo and all its child entities
     * @param flg - True to show the gizmo, false to hide it
     */
    protected __setVisible(flg: boolean): void;
    /**
     * Indicates whether the gizmo has been set up and is ready for use
     * Must be implemented by concrete gizmo classes
     */
    abstract isSetup: boolean;
    /**
     * Sets up the entities and components required for the gizmo
     * This method is called internally and should only be executed once
     * @internal
     */
    abstract _setup(): void;
    /**
     * Updates the gizmo's transform, appearance, and other properties
     * This method is typically called every frame to keep the gizmo synchronized
     * with its target entity
     * @internal
     */
    abstract _update(): void;
    /**
     * Cleans up and destroys the gizmo, releasing all associated resources
     * @internal
     */
    abstract _destroy(): void;
    /**
     * Determines whether the gizmo setup should be skipped
     * @returns True if setup should be skipped, false otherwise
     */
    protected __toSkipSetup(): boolean;
    /**
     * Applies appropriate tags to the gizmo entities for identification and categorization
     * This method ensures that all gizmo entities are properly tagged for rendering
     * and processing pipelines
     */
    protected setGizmoTag(): void;
    /**
     * Marks the gizmo subtree's world matrices as dirty and materializes them immediately.
     *
     * The GPU instance data (world and normal matrices) is uploaded at the beginning of the Render
     * stage from component buffers, and those buffers are only written when the matrices are
     * recalculated. A gizmo updated after the Logic stage (for example when only the camera
     * changed) therefore has to recalculate its matrices here, otherwise the gizmo keeps being
     * rendered with its previous transform until some later frame re-uploads the data.
     * @internal
     */
    protected __updateWorldMatricesOfSubtree(): void;
    /**
     * Calculates a uniform world-space scale that keeps a unit-length gizmo element
     * (an axis of length 1, or a ring of radius 1) at a constant fraction of the
     * viewport height, independent of the target size and the camera distance.
     *
     * The scale is derived from the vertical scale of the camera's projection matrix,
     * so the on-screen size stays proportional to the viewport height for both
     * perspective and orthographic cameras.
     *
     * @param engine - The engine used to resolve the current camera
     * @param worldPosition - The world-space position of the gizmo center
     * @param screenSpaceRatio - The target size as a fraction of the viewport height
     * @returns The uniform scale to apply to the gizmo's top entity
     * @internal
     */
    protected static __calcScreenSpaceScale(engine: Engine, worldPosition: IVector3, screenSpaceRatio: number): number;
}
