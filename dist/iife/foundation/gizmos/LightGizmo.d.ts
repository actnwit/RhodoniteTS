import { Gizmo } from './Gizmo';
export declare class LightGizmo extends Gizmo {
    private static __mesh;
    private static __length;
    /**
     * Checks whether the gizmo has been properly initialized and set up.
     * @returns True if the gizmo's top entity exists and setup is complete, false otherwise
     */
    get isSetup(): boolean;
    /**
     * Initializes the gizmo entities and visual representation if not already done.
     * Creates a mesh entity with a light gizmo primitive and attaches it to the target entity.
     * @internal
     */
    _setup(): void;
    /**
     * Updates the transform properties (position, rotation, scale) of the gizmo to match the target entity.
     * The gizmo's position is set to either the target's position or the center of its bounding box,
     * and its scale is adjusted based on the target's bounding box size.
     * @internal
     */
    _update(): void;
    /**
     * Destroys the gizmo and cleans up its resources.
     * Removes the top entity and all associated components from the scene.
     * @internal
     */
    _destroy(): void;
    /**
     * Generates the primitive geometry for the light gizmo visualization.
     * Creates a line-based representation showing a directional arrow pointing in the negative Z direction,
     * which is commonly used to represent light direction in 3D graphics.
     * @returns A primitive object containing the line geometry for the light gizmo
     * @private
     */
    private static __generatePrimitive;
}
