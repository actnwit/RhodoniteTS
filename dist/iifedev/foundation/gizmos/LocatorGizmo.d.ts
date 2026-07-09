import type { Engine } from '../system/Engine';
import { Gizmo } from './Gizmo';
/**
 * Locator Gizmo class that provides visual coordinate axes for 3D objects.
 * Displays X (red), Y (green), and Z (blue) axis lines to help visualize object orientation and position.
 */
export declare class LocatorGizmo extends Gizmo {
    private static __mesh;
    private static __length;
    /**
     * Gets whether the gizmo has been properly set up and initialized.
     * @returns True if the gizmo is set up, false otherwise
     */
    get isSetup(): boolean;
    /**
     * Sets the length of the axis lines displayed by the gizmo.
     * @param val - The length value for the axis lines
     */
    set length(val: number);
    /**
     * Gets the current length of the axis lines displayed by the gizmo.
     * @returns The current axis line length
     */
    get length(): number;
    /**
     * Sets up the gizmo entities and mesh if not already done.
     * Creates the coordinate axis visualization with colored lines representing X, Y, and Z axes.
     * @internal
     */
    _setup(): void;
    /**
     * Updates the gizmo's transform properties to match the target object.
     * Positions the gizmo at the target's center point and scales it based on the target's bounding box.
     * @internal
     */
    _update(): void;
    /**
     * Generates the primitive geometry for the coordinate axes visualization.
     * Creates three colored lines: red for X-axis, green for Y-axis, and blue for Z-axis.
     * @returns The primitive object containing the axis line geometry and colors
     */
    private static __generatePrimitive;
    /**
     * Destroys the gizmo and cleans up its resources.
     * Removes the gizmo entity and frees associated memory.
     */
    _destroy(): void;
    /**
     * Cleans up all static resources for a specific Engine.
     * This resets static members so that gizmos can be recreated with a new Engine.
     * @internal Called from Engine.destroy()
     */
    static _cleanupForEngine(_engine: Engine): void;
}
