import type { Size } from '../../types/CommonTypes';
import type { CameraComponent } from '../components/Camera/CameraComponent';
import type { CameraControllerComponent } from '../components/CameraController/CameraControllerComponent';
import type { Config } from '../core/Config';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { AbstractCameraController } from './AbstractCameraController';
import type { ICameraController } from './ICameraController';
/**
 * OrbitCameraController is a camera controller that allows the user to orbit around a target.
 *
 */
export declare class OrbitCameraController extends AbstractCameraController implements ICameraController {
    dollyScale: number;
    scaleOfLengthCenterToCamera: number;
    moveSpeed: number;
    followTargetAABB: boolean;
    autoUpdate: boolean;
    private __updated;
    private __updateCount;
    private __fixedLengthOfCenterToEye;
    private __isMouseDown;
    private __lastMouseDownTimeStamp;
    private __lastMouseUpTimeStamp;
    private __originalY;
    private __originalX;
    private __buttonNumber;
    private __mouse_translate_y;
    private __mouse_translate_x;
    private __efficiency;
    private __lengthOfCenterToEye;
    private __fovyBias;
    private __scaleOfTranslation;
    private __mouseTranslateVec;
    private __newEyeVec;
    private __newCenterVec;
    private __newUpVec;
    private __newTangentVec;
    private __isSymmetryMode;
    private __rot_bgn_x;
    private __rot_bgn_y;
    private __rot_x;
    private __rot_y;
    private __dolly;
    private __eyeVec;
    private __centerVec;
    private __upVec;
    protected __targetEntities: ISceneGraphEntity[];
    private __scaleOfZNearAndZFar;
    private __doPreventDefault;
    private __isPressingShift;
    private __isPressingCtrl;
    private __pinchInOutControl;
    private __pinchInOutOriginalDistance?;
    private __maximum_y?;
    private __minimum_y?;
    private __resetDollyTouchTime;
    private __initialTargetAABB?;
    aabbWithSkeletal: boolean;
    useInitialTargetAABBForLength: boolean;
    private __mouseDownFunc;
    private __mouseUpFunc;
    private __mouseMoveFunc;
    private __touchDownFunc;
    private __touchUpFunc;
    private __touchMoveFunc;
    private __pinchInOutFunc;
    private __pinchInOutEndFunc;
    private __mouseWheelFunc;
    private __mouseDblClickFunc;
    private __contextMenuFunc;
    private __pressShiftFunc;
    private __releaseShiftFunc;
    private __pressCtrlFunc;
    private __releaseCtrlFunc;
    private __resetDollyAndPositionFunc;
    private static readonly __tmp_up;
    private static __tmpVec3_0;
    private static __tmpVec3_1;
    private static __tmpVec3_2;
    private static __tmp_rotateM_X;
    private static __tmp_rotateM_Y;
    private static __tmp_rotateM;
    private static __tmp_rotateM_Reset;
    private static __tmp_rotateM_Revert;
    private static __tmpMat44_0;
    private __cameraControllerComponent;
    constructor(cameraControllerComponent: CameraControllerComponent, config: Config);
    /**
     * Gets the current update count.
     * @returns The current update count
     */
    get updateCount(): number;
    /**
     * Updates the update count and notifies the camera controller component.
     * @internal
     */
    private _updateCount;
    /**
     * Resets the dolly and translation values to their default state.
     */
    resetDollyAndTranslation(): void;
    /**
     * Sets a single target entity for the camera to focus on.
     * @param targetEntity - The entity to set as target
     */
    setTarget(targetEntity: ISceneGraphEntity): void;
    /**
     * Sets multiple target entities for the camera to focus on.
     * @param targetEntities - Array of entities to set as targets
     */
    setTargets(targetEntities: ISceneGraphEntity[]): void;
    /**
     * Gets the current target entities.
     * @returns Array of target entities
     */
    getTargets(): ISceneGraphEntity[];
    /**
     * Sets whether to prevent default behavior on events.
     * @param flag - True to prevent default, false otherwise
     */
    set doPreventDefault(flag: boolean);
    /**
     * Gets whether default behavior is prevented on events.
     * @returns True if default is prevented, false otherwise
     */
    get doPreventDefault(): boolean;
    /**
     * Handles mouse down events.
     * @param e - The mouse event
     * @internal
     */
    __mouseDown(e: MouseEvent): void;
    /**
     * Handles mouse move events for camera control.
     * @param e - The mouse event
     * @internal
     */
    __mouseMove(e: MouseEvent): void;
    /**
     * Handles mouse up events.
     * @param e - The mouse event
     * @internal
     */
    __mouseUp(e: MouseEvent): void;
    /**
     * Handles touch down events.
     * @param e - The touch event
     * @internal
     */
    __touchDown(e: TouchEvent): void;
    /**
     * Handles touch move events for camera control.
     * @param e - The touch event
     * @internal
     */
    __touchMove(e: TouchEvent): void;
    /**
     * Handles touch up events.
     * @param e - The touch event
     * @internal
     */
    __touchUp(e: TouchEvent): void;
    /**
     * Sets the X-axis rotation value.
     * @param value - The rotation value in degrees
     */
    set rotX(value: number);
    /**
     * Gets the X-axis rotation value.
     * @returns The rotation value in degrees
     */
    get rotX(): number;
    /**
     * Sets the Y-axis rotation value.
     * @param value - The rotation value in degrees
     */
    set rotY(value: number);
    /**
     * Gets the Y-axis rotation value.
     * @returns The rotation value in degrees
     */
    get rotY(): number;
    /**
     * Sets the maximum Y rotation angle limit.
     * @param maximum_y - The maximum Y rotation angle
     */
    set maximumY(maximum_y: number);
    /**
     * Sets the minimum Y rotation angle limit.
     * @param minimum_y - The minimum Y rotation angle
     */
    set minimumY(minimum_y: number);
    /**
     * Controls rotation based on mouse/touch movement.
     * @param originalX - Original X position
     * @param originalY - Original Y position
     * @param currentX - Current X position
     * @param currentY - Current Y position
     * @internal
     */
    __rotateControl(originalX: Size, originalY: Size, currentX: Size, currentY: Size): void;
    /**
     * Controls zoom/dolly based on mouse movement.
     * @param originalValue - Original position value
     * @param currentValue - Current position value
     * @internal
     */
    __zoomControl(originalValue: Size, currentValue: Size): void;
    /**
     * Controls parallel translation based on mouse/touch movement.
     * @param originalX - Original X position
     * @param originalY - Original Y position
     * @param currentX - Current X position
     * @param currentY - Current Y position
     * @internal
     */
    __parallelTranslateControl(originalX: Size, originalY: Size, currentX: Size, currentY: Size): void;
    /**
     * Calculates the distance between two touch points.
     * @param e - The touch event
     * @returns The distance between touch points
     * @internal
     */
    __getTouchesDistance(e: TouchEvent): number;
    /**
     * Handles pinch in/out gestures for zoom control.
     * @param e - The touch event
     * @internal
     */
    __pinchInOut(e: TouchEvent): void;
    /**
     * Handles the end of pinch in/out gestures.
     * @param e - The touch event
     * @internal
     */
    __pinchInOutEnd(e: TouchEvent): void;
    /**
     * Tries to prevent default behavior if configured to do so.
     * @param evt - The event to prevent default on
     * @internal
     */
    private __tryToPreventDefault;
    /**
     * Handles mouse wheel events for zoom control.
     * @param evt - The wheel event
     * @internal
     */
    __mouseWheel(evt: WheelEvent): void;
    /**
     * Handles context menu events.
     * @param evt - The context menu event
     * @internal
     */
    __contextMenu(evt: Event): void;
    /**
     * Sets the dolly (zoom) value with gamma correction.
     * @param value - The dolly value (0-1)
     */
    set dolly(value: number);
    /**
     * Gets the dolly (zoom) value with gamma correction.
     * @returns The dolly value (0-1)
     */
    get dolly(): number;
    /**
     * Handles mouse double-click events for resetting camera state.
     * @param evt - The mouse event
     * @internal
     */
    __mouseDblClick(evt: MouseEvent): void;
    /**
     * Resets dolly and position on double tap for touch devices.
     * @param e - The touch event
     * @internal
     */
    __resetDollyAndPosition(e: TouchEvent): void;
    /**
     * Handles shift key press events.
     * @param e - The keyboard event
     * @internal
     */
    __pressShift(e: KeyboardEvent): void;
    /**
     * Handles shift key release events.
     * @param e - The keyboard event
     * @internal
     */
    __releaseShift(e: KeyboardEvent): void;
    /**
     * Handles ctrl key press events.
     * @param e - The keyboard event
     * @internal
     */
    __pressCtrl(e: KeyboardEvent): void;
    /**
     * Handles ctrl key release events.
     * @param e - The keyboard event
     * @internal
     */
    __releaseCtrl(e: KeyboardEvent): void;
    /**
     * Registers event listeners for mouse, touch, and keyboard events.
     */
    registerEventListeners(config: Config): void;
    /**
     * Unregisters all event listeners.
     */
    unregisterEventListeners(): void;
    /**
     * Gets the field of view Y value from the camera component.
     * @param camera - The camera component
     * @returns The fovy value in degrees
     * @internal
     */
    __getFovyFromCamera(camera: CameraComponent): number;
    /**
     * Main logic method that updates the camera based on controller state.
     * @param cameraComponent - The camera component to update
     */
    logic(cameraComponent: CameraComponent): void;
    /**
     * Gets the target AABB (Axis-Aligned Bounding Box) for a target entity.
     * @param targetEntity - The target entity
     * @returns The AABB of the target entity
     * @internal
     */
    private __getTargetAABB;
    /**
     * update center, eye and up vectors of OrbitCameraController
     * @internal
     */
    __updateTargeting(camera: CameraComponent): void;
    /**
     * calculate up, eye, center and tangent vector with controller influence
     * @internal
     */
    __calculateInfluenceOfController(): void;
    /**
     * Updates the camera component with new calculated values.
     * @param camera - The camera component to update
     * @internal
     */
    __updateCameraComponent(camera: CameraComponent): void;
    /**
     * Sets the scale factor for zNear and zFar calculations.
     * @param value - The scale factor
     */
    set scaleOfZNearAndZFar(value: number);
    /**
     * Gets the scale factor for zNear and zFar calculations.
     * @returns The scale factor
     */
    get scaleOfZNearAndZFar(): number;
    /**
     * Gets whether the mouse is currently pressed down.
     * @returns True if mouse is down, false otherwise
     */
    get isMouseDown(): boolean;
    /**
     * Gets the timestamp of the last mouse down event.
     * @returns The timestamp in milliseconds
     */
    get lastMouseDownTimeStamp(): number;
    /**
     * Gets the timestamp of the last mouse up event.
     * @returns The timestamp in milliseconds
     */
    get lastMouseUpTimeStamp(): number;
}
