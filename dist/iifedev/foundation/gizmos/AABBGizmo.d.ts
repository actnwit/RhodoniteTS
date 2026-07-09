import type { Engine } from '../system/Engine';
import { Gizmo } from './Gizmo';
/**
 * AABB Gizmo class that visualizes the Axis-Aligned Bounding Box of a target entity.
 * This gizmo renders a wireframe box around the target entity showing its spatial boundaries.
 */
export declare class AABBGizmo extends Gizmo {
    private static __mesh?;
    /**
     * Checks if the gizmo has been properly set up and initialized.
     * @returns True if the gizmo is set up and ready to render, false otherwise
     */
    get isSetup(): boolean;
    /**
     * Initializes the gizmo entities and mesh components if not already done.
     * Creates the wireframe mesh entity, sets up the primitive geometry,
     * and attaches it to the target entity's scene graph.
     * @internal
     */
    _setup(): void;
    /**
     * Generates the wireframe primitive geometry for the AABB visualization.
     * Creates a unit cube with line primitives that form the edges of the bounding box.
     * The cube vertices are arranged from -1 to +1 in each axis and will be scaled
     * appropriately during rendering.
     * @returns A primitive object containing the wireframe geometry for the AABB
     */
    private static generatePrimitive;
    /**
     * Updates the gizmo's transform to match the target entity's current AABB.
     * Repositions and rescales the wireframe to accurately represent the target's
     * world-space bounding box including skeletal deformations.
     * @internal
     */
    _update(): void;
    /**
     * Destroys the gizmo and cleans up all associated resources.
     * Removes the gizmo entity from the scene graph and frees memory.
     * @internal
     */
    _destroy(): void;
    /**
     * Cleans up all static resources for a specific Engine.
     * This resets static members so that gizmos can be recreated with a new Engine.
     * @internal Called from Engine.destroy()
     */
    static _cleanupForEngine(_engine: Engine): void;
}
