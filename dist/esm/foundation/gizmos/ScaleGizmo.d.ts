import type { Engine } from '../system/Engine';
import { Gizmo } from './Gizmo';
/**
 * Scale Gizmo class for handling object scaling operations in 3D space
 * Provides interactive handles for scaling objects along individual axes (X, Y, Z)
 * or within specific planes (XY, YZ, ZX) in both local and world coordinate spaces
 */
export declare class ScaleGizmo extends Gizmo {
    /** Resources managed per-Engine instance */
    private static __resourcesMap;
    private static __originalX;
    private static __originalY;
    private __pickStatedPoint;
    private __deltaPoint;
    private __targetScaleBackup;
    private __isPointerDown;
    private __isCameraControllerDisabled;
    private static __activeAxis;
    private static __space;
    private static __latestTargetEntity?;
    private static __length;
    private __onPointerDownFunc;
    private __onPointerMoveFunc;
    private __onPointerUpFunc;
    /**
     * Gets the resources for a specific engine, or undefined if not initialized.
     */
    private static __getResources;
    /**
     * Checks if the gizmo has been properly set up and initialized
     * @returns True if the gizmo is set up, false otherwise
     */
    get isSetup(): boolean;
    /**
     * Sets the length of the gizmo handles
     * @param val - The length value to set
     */
    set length(val: number);
    /**
     * Gets the current length of the gizmo handles
     * @returns The current length value
     */
    get length(): number;
    /**
     * Sets the visibility of the gizmo and manages input event registration
     * @param flg - True to show the gizmo, false to hide it
     */
    set isVisible(flg: boolean);
    /**
     * Sets the coordinate space for gizmo operations
     * @param space - The coordinate space to use ('local' or 'world')
     */
    setSpace(space: 'local' | 'world'): void;
    /**
     * Gets the current visibility state of the gizmo
     * @returns True if the gizmo is visible, false otherwise
     */
    get isVisible(): boolean;
    /**
     * @internal
     * Sets up the gizmo entities and their visual components if not already done
     * Creates all necessary meshes, materials, and entity hierarchies for the scale gizmo
     */
    _setup(): void;
    /**
     * Creates all resources needed for the gizmo.
     */
    private __createResources;
    /**
     * @internal
     * Updates the gizmo's transform, scale, and position based on the target entity
     * Called each frame to maintain proper gizmo positioning and scaling behavior
     */
    _update(): void;
    /**
     * Generates a primitive for line-based gizmo visualization
     * @returns A primitive containing position and color data for axis lines
     * @private
     */
    private static __generatePrimitive;
    /**
     * Handles pointer down events for initiating scaling operations
     * @param evt - The pointer event containing input information
     * @private
     */
    private __onPointerDown;
    /**
     * Handles pointer move events for performing real-time scaling
     * @param evt - The pointer event containing current pointer position
     * @private
     */
    private __onPointerMove;
    /**
     * Handles pointer up events for finalizing scaling operations
     * @param evt - The pointer event indicating the end of interaction
     * @private
     */
    private __onPointerUp;
    private __disableCameraController;
    private __enableCameraControllerIfNeeded;
    /**
     * Performs ray casting against the entire gizmo group entity
     * @param evt - The pointer event containing screen coordinates
     * @returns Ray casting result for the group entity
     * @private
     */
    private static castRay2;
    /**
     * Performs ray casting against individual axis entities to determine interaction
     * @param evt - The pointer event containing screen coordinates
     * @returns Object containing ray casting results for X, Y, and Z axes
     * @private
     */
    private static castRay;
    /**
     * Destroys the gizmo and cleans up associated resources
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
