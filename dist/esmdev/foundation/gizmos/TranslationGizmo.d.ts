import type { Engine } from '../system/Engine';
import { Gizmo } from './Gizmo';
/**
 * Translation Gizmo class
 * Provides an interactive 3D translation gizmo for manipulating object positions in 3D space.
 * The gizmo displays colored axes (red for X, green for Y, blue for Z) that can be dragged
 * to translate objects along specific axes or planes.
 */
export declare class TranslationGizmo extends Gizmo {
    /** Resources managed per-Engine instance */
    private static __resourcesMap;
    private static __originalX;
    private static __originalY;
    private __pickStatedPoint;
    private __deltaPoint;
    private __targetPointBackup;
    private __isPointerDown;
    private static __activeAxis;
    private static __space;
    private __latestTargetEntity?;
    private __onPointerDownFunc;
    private __onPointerMoveFunc;
    private __onPointerUpFunc;
    private __isCameraControllerDisabled;
    private static __length;
    /**
     * Gets the resources for a specific engine, or undefined if not initialized.
     */
    private static __getResources;
    /**
     * Indicates whether the gizmo has been properly set up and initialized.
     * @returns True if the gizmo is set up and ready to use, false otherwise
     */
    get isSetup(): boolean;
    /**
     * Sets the length/scale of the gizmo axes.
     * @param val - The length value for the gizmo axes
     */
    set length(val: number);
    /**
     * Gets the current length/scale of the gizmo axes.
     * @returns The current length value of the gizmo axes
     */
    get length(): number;
    /**
     * Sets the visibility of the gizmo and manages input event registration.
     * When set to visible, registers pointer event handlers and adds the gizmo to the scene.
     * When set to invisible, unregisters events and resets gizmo state.
     * @param flg - True to show the gizmo, false to hide it
     */
    set isVisible(flg: boolean);
    /**
     * Sets the coordinate space for gizmo operations.
     * @param space - Either 'local' for object-relative coordinates or 'world' for global coordinates
     */
    setSpace(space: 'local' | 'world'): void;
    /**
     * Gets the current visibility state of the gizmo.
     * @returns True if the gizmo is currently visible, false otherwise
     */
    get isVisible(): boolean;
    /**
     * Sets up the gizmo entities and geometry if not already initialized.
     * Creates the visual components (cubes for axes, planes for multi-axis movement)
     * and configures their materials, positioning, and hierarchy.
     * @internal
     */
    _setup(): void;
    /**
     * Creates all resources needed for the gizmo.
     */
    private __createResources;
    /**
     * Updates the gizmo's transform and visual state each frame.
     * Positions the gizmo at the target's location, scales it appropriately,
     * and applies any ongoing translation operations.
     * @internal
     */
    _update(): void;
    /**
     * Generates a primitive for line-based gizmo visualization.
     * Creates geometry for X, Y, and Z axis lines with appropriate colors.
     * @returns A primitive containing the line geometry for the gizmo axes
     */
    private static __generatePrimitive;
    /**
     * Handles pointer down events for starting gizmo interaction.
     * Determines which axis was clicked, sets up the initial state for dragging,
     * and configures the coordinate space transformation matrices.
     * @param evt - The pointer event containing click information
     */
    private __onPointerDown;
    /**
     * Handles pointer move events during gizmo interaction.
     * Calculates the translation delta based on mouse movement and the active axis,
     * performs coordinate space transformations, and updates the target object's position.
     * @param evt - The pointer event containing movement information
     */
    private __onPointerMove;
    /**
     * Handles pointer up events to end gizmo interaction.
     * Resets the gizmo state, re-enables camera controls, and finalizes
     * the translation operation.
     * @param evt - The pointer event containing release information
     */
    private __onPointerUp;
    private __disableCameraController;
    private __enableCameraControllerIfNeeded;
    /**
     * Performs ray casting against the entire gizmo group entity.
     * Used for general intersection testing with the gizmo.
     * @param evt - The pointer event to cast a ray from
     * @returns Ray casting result containing intersection information
     */
    private static castRay2;
    private static __castFromEntities;
    /**
     * Performs ray casting against individual gizmo axis entities.
     * Tests intersection with X, Y, and Z axis cubes separately to determine
     * which axis was clicked for translation.
     * @param evt - The pointer event to cast a ray from
     * @returns Object containing ray casting results for each axis (xResult, yResult, zResult)
     */
    private static castRay;
    /**
     * Destroys the gizmo and cleans up its resources.
     * Removes the gizmo from the scene and frees associated memory.
     * @internal
     */
    _destroy(): void;
    /**
     * Cleans up all static resources for a specific Engine.
     * This removes the resources associated with the engine from the map.
     * @internal Called from Engine.destroy()
     */
    static _cleanupForEngine(engine: Engine): void;
}
