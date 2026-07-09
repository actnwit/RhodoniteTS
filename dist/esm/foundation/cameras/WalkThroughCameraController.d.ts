import type { CameraComponent } from '../components/Camera/CameraComponent';
import type { CameraControllerComponent } from '../components/CameraController/CameraControllerComponent';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { MutableVector3 } from '../math/MutableVector3';
import { AbstractCameraController } from './AbstractCameraController';
import type { ICameraController } from './ICameraController';
/**
 * WalkThroughCameraController is a camera controller that allows the user to walk through a scene.
 *
 */
export declare class WalkThroughCameraController extends AbstractCameraController implements ICameraController {
    private __updateCount;
    private _horizontalSpeed;
    private _verticalSpeed;
    private _turnSpeed;
    private _mouseWheelSpeedScale;
    private _inverseVerticalRotating;
    private _inverseHorizontalRotating;
    private _onKeydown;
    private _isKeyDown;
    private _isMouseDrag;
    private _lastKeyCode;
    private _onKeyup;
    private _currentDir;
    private _currentPos;
    private _currentCenter;
    private _currentHorizontalDir;
    private _newDir;
    private _isMouseDown;
    private _clickedMouseXOnCanvas;
    private _clickedMouseYOnCanvas;
    private _draggedMouseXOnCanvas;
    private _draggedMouseYOnCanvas;
    private _deltaMouseXOnCanvas;
    private _deltaMouseYOnCanvas;
    private _mouseXAdjustScale;
    private _mouseYAdjustScale;
    private _deltaY;
    private _deltaX;
    private _mouseUpBind;
    private _mouseDownBind;
    private _mouseMoveBind;
    private _mouseWheelBind;
    private _eventTargetDom?;
    private __doPreventDefault;
    private _needInitialize;
    protected __targetEntities: ISceneGraphEntity[];
    private static __tmpInvMat;
    private static __tmpRotateMat;
    private static __tmp_Vec3_0;
    private static __tmp_Vec3_1;
    aabbWithSkeletal: boolean;
    private __cameraControllerComponent;
    constructor(cameraControllerComponent: CameraControllerComponent, options?: {
        eventTargetDom: Document;
        verticalSpeed: number;
        horizontalSpeed: number;
        turnSpeed: number;
        mouseWheelSpeedScale: number;
        inverseVerticalRotating: boolean;
        inverseHorizontalRotating: boolean;
    });
    /**
     * Updates the internal counter and notifies the camera controller component.
     * @private
     */
    private _updateCount;
    /**
     * Gets the current update count.
     * @returns The current update count
     */
    get updateCount(): number;
    /**
     * Registers event listeners for mouse and keyboard input handling.
     * @param eventTargetDom - The DOM element to attach event listeners to, defaults to document
     */
    registerEventListeners(eventTargetDom?: Document): void;
    /**
     * Unregisters all event listeners for this camera controller.
     */
    unregisterEventListeners(): void;
    /**
     * Attempts to prevent default behavior of events if configured to do so.
     * @param evt - The event to potentially prevent default on
     * @private
     */
    private __tryToPreventDefault;
    /**
     * Handles mouse wheel events for camera movement.
     * @param e - The wheel event
     * @private
     */
    _mouseWheel(e: WheelEvent): void;
    /**
     * Handles mouse down events.
     * @param evt - The mouse event
     * @private
     */
    _mouseDown(evt: MouseEvent): boolean;
    /**
     * Handles mouse move events for camera rotation during drag.
     * @param evt - The mouse event
     * @private
     */
    _mouseMove(evt: MouseEvent): void;
    /**
     * Handles mouse up events to stop dragging.
     * @param evt - The mouse event
     * @private
     */
    _mouseUp(evt: MouseEvent): void;
    /**
     * Attempts to reset the controller state. Currently not implemented.
     */
    tryReset(): void;
    /**
     * Resets the camera controller to its initial state.
     */
    reset(): void;
    /**
     * Main logic method that updates the camera component based on input.
     * @param cameraComponent - The camera component to update
     */
    logic(cameraComponent: CameraComponent): void;
    /**
     * Updates the camera component with new position, direction, and other properties.
     * @param camera - The camera component to update
     * @private
     */
    private __updateCameraComponent;
    /**
     * Gets the current camera direction.
     * @returns The current direction vector or null if not available
     */
    getDirection(): MutableVector3 | null;
    /**
     * Sets the horizontal movement speed.
     * @param value - The new horizontal speed value
     */
    set horizontalSpeed(value: number);
    /**
     * Gets the current horizontal movement speed.
     * @returns The current horizontal speed
     */
    get horizontalSpeed(): number;
    /**
     * Sets the vertical movement speed.
     * @param value - The new vertical speed value
     */
    set verticalSpeed(value: number);
    /**
     * Gets the current vertical movement speed.
     * @returns The current vertical speed
     */
    get verticalSpeed(): number;
    /**
     * Sets the mouse wheel speed scale.
     * @param value - The new mouse wheel speed scale
     */
    set mouseWheelSpeed(value: number);
    /**
     * Gets the current mouse wheel speed scale.
     * @returns The current mouse wheel speed scale
     */
    get mouseWheelSpeed(): number;
    /**
     * Sets a single target entity for the camera to focus on.
     * @param targetEntity - The entity to set as the target
     */
    setTarget(targetEntity: ISceneGraphEntity): void;
    /**
     * Gets the axis-aligned bounding box for a target entity.
     * @param targetEntity - The entity to get the AABB for
     * @returns The AABB of the target entity
     * @private
     */
    private __getTargetAABB;
    /**
     * Sets multiple target entities for the camera to focus on.
     * Automatically adjusts movement speeds based on the size of the targets.
     * @param targetEntities - Array of entities to set as targets
     */
    setTargets(targetEntities: ISceneGraphEntity[]): void;
    /**
     * Gets the current target entities.
     * @returns Array of current target entities
     */
    getTargets(): ISceneGraphEntity[];
    /**
     * Gets all camera controller information for serialization.
     * @returns Object containing all controller state information
     */
    get allInfo(): any;
    /**
     * Sets all camera controller information from serialized data.
     * @param arg - Object or JSON string containing controller state information
     */
    set allInfo(arg: any);
}
