export declare const EVENT_MOUSE_DOWN = "mousedown";
export declare const EVENT_MOUSE_MOVE = "mousemove";
export declare const EVENT_MOUSE_UP = "mouseup";
export declare const EVENT_MOUSE_WHEEL = "wheel";
export declare const EVENT_MOUSE_ENTER = "mouseenter";
export declare const EVENT_MOUSE_LEAVE = "mouseleave";
export declare const EVENT_MOUSE_OVER = "mouseover";
export declare const EVENT_CLICK = "click";
export declare const EVENT_KEY_DOWN = "keydown";
export declare const EVENT_KEY_UP = "keyup";
export declare const EVENT_KEY_PRESS = "keypress";
export declare const EVENT_POINTER_DOWN = "pointerdown";
export declare const EVENT_MSPOINTER_DOWN = "MSPointerDown";
export declare const EVENT_POINTER_MOVE = "pointermove";
export declare const EVENT_MSPOINTER_MOVE = "MSPointerMove";
export declare const EVENT_POINTER_UP = "pointerup";
export declare const EVENT_MSPOINTER_UP = "MSPointerUp";
export declare const EVENT_POINTER_CANCEL = "pointercancel";
export declare const EVENT_POINTER_ENTER = "pointerenter";
export declare const EVENT_POINTER_LEAVE = "pointerleave";
export declare const EVENT_POINTER_OVER = "pointerover";
export declare const EVENT_POINTER_OUT = "pointerout";
export declare const EVENT_RESIZE = "resize";
export declare const EVENT_ORIENTATION_CHANGE = "orientationchange";
export declare const EVENT_TOUCH_TAP = "tap";
export declare const EVENT_TOUCH_DOUBLE_TAP = "doubletap";
export declare const EVENT_TOUCH_LONG_TAP = "longtap";
export declare const EVENT_TOUCH_HOLD = "hold";
export declare const EVENT_TOUCH_DRAG = "drag";
export declare const EVENT_TOUCH_SWIPE = "swipe";
export declare const EVENT_TOUCH_PINCH = "pinch";
export declare const EVENT_TOUCH_START = "touchstart";
export declare const EVENT_TOUCH_MOVE = "touchmove";
export declare const EVENT_TOUCH_END = "touchend";
export declare const EVENT_TOUCH_CANCEL = "touchcancel";
export declare const EVENT_TOUCH_ENTER = "touchenter";
export declare const EVENT_TOUCH_LEAVE = "touchleave";
export declare const EVENT_TOUCH_OVER = "touchover";
export declare const EVENT_TOUCH_OUT = "touchout";
declare global {
    interface Navigator {
        readonly pointerEnabled: boolean;
        readonly msPointerEnabled: boolean;
    }
}
/**
 * Gets the appropriate event name based on device capabilities and event type.
 * Automatically detects whether to use touch, pointer, or mouse events based on device support.
 * Priority order: Pointer events (modern browsers) > MS Pointer events (legacy IE) > Touch events > Mouse events
 *
 * @param type - The type of event to get ('start', 'move', 'end', or 'click')
 * @returns The appropriate event name string for the current device
 * @throws Error if called in a non-browser environment
 *
 * @example
 * ```typescript
 * const startEvent = getEvent('start'); // Returns 'pointerdown', 'touchstart', or 'mousedown'
 * element.addEventListener(startEvent, handler);
 * ```
 */
export declare function getEvent(type: 'start' | 'move' | 'end' | 'click'): string;
type ClassInstance = any;
/**
 * Information about an input event handler including the event details and target.
 */
export interface InputHandlerInfo {
    /** The name of the event to listen for */
    eventName: string;
    /** The event handler function */
    handler: (event: any) => void;
    /** Options for addEventListener */
    options: AddEventListenerOptions;
    /** The class instance that owns this handler */
    classInstance: ClassInstance;
    /** The DOM element to attach the event listener to */
    eventTargetDom: EventTarget;
}
export declare const INPUT_HANDLING_STATE_NONE = "None";
export declare const INPUT_HANDLING_STATE_CAMERA_CONTROLLER = "CameraController";
export declare const INPUT_HANDLING_STATE_GIZMO_TRANSLATION = "GizmoTranslation";
export declare const INPUT_HANDLING_STATE_GIZMO_ROTATION = "GizmoRotation";
export declare const INPUT_HANDLING_STATE_GIZMO_SCALE = "GizmoScale";
/**
 * Represents different input handling states in the application.
 */
export type InputHandlingState = typeof INPUT_HANDLING_STATE_NONE | typeof INPUT_HANDLING_STATE_CAMERA_CONTROLLER | typeof INPUT_HANDLING_STATE_GIZMO_TRANSLATION | typeof INPUT_HANDLING_STATE_GIZMO_ROTATION | typeof INPUT_HANDLING_STATE_GIZMO_SCALE;
/**
 * Manages input event handling across different states in the Rhodonite engine.
 *
 * This class provides a centralized way to manage input events for different interaction modes
 * such as camera control, gizmo manipulation, etc. It automatically handles adding and removing
 * event listeners based on the current active state, ensuring that only the appropriate
 * input handlers are active at any given time.
 *
 * The InputManager uses a state-based approach where different input handling states
 * (like camera control or gizmo manipulation) can be registered with their respective
 * event handlers. The manager then activates/deactivates these handlers based on the
 * current application state.
 *
 * @example
 * ```typescript
 * // Register input handlers for camera control
 * InputManager.register(INPUT_HANDLING_STATE_CAMERA_CONTROLLER, [
 *   {
 *     eventName: 'mousedown',
 *     handler: onMouseDown,
 *     options: {},
 *     classInstance: cameraController,
 *     eventTargetDom: canvas
 *   }
 * ]);
 *
 * // Activate camera controller
 * InputManager.setActive(INPUT_HANDLING_STATE_CAMERA_CONTROLLER, true);
 * ```
 */
export declare class InputManager {
    /** Map storing input handler information for each input handling state */
    private static __inputHandlingStateMap;
    /**
     * This active information is set externally and does not change state internally.
     * Using this externally set active information, this class will add and remove event listeners as appropriate.
     * As a result, event handling for the entire Rhodonite works properly.
     */
    private static __activeMap;
    /** The currently active input handling state */
    private static __currentState;
    /**
     * Registers input handlers for a specific input handling state.
     *
     * This method associates a set of input event handlers with a particular state.
     * When the state becomes active, these handlers will be automatically attached
     * to their respective DOM elements.
     *
     * @param inputHandlingState - The input handling state to register handlers for
     * @param events - Array of input handler information objects
     *
     * @example
     * ```typescript
     * InputManager.register(INPUT_HANDLING_STATE_CAMERA_CONTROLLER, [
     *   {
     *     eventName: 'mousedown',
     *     handler: (e) => console.log('Mouse down'),
     *     options: { passive: false },
     *     classInstance: this,
     *     eventTargetDom: document.getElementById('canvas')
     *   }
     * ]);
     * ```
     */
    static register(inputHandlingState: InputHandlingState, events: InputHandlerInfo[]): void;
    /**
     * Unregisters and deactivates input handlers for a specific input handling state.
     *
     * This method removes all event handlers associated with the specified state
     * and marks the state as inactive. All event listeners will be removed from
     * their respective DOM elements.
     *
     * @param inputHandlingState - The input handling state to unregister
     *
     * @example
     * ```typescript
     * InputManager.unregister(INPUT_HANDLING_STATE_CAMERA_CONTROLLER);
     * ```
     */
    static unregister(inputHandlingState: InputHandlingState): void;
    /**
     * Sets the active state of a specific input handling state.
     *
     * This method controls whether the input handlers for a particular state
     * should be active or inactive. When set to active, the corresponding event
     * listeners will be attached. When set to inactive, they will be removed.
     *
     * Special handling is implemented for gizmo states - activating one gizmo
     * state will automatically deactivate the other to prevent conflicts.
     *
     * @param inputHandlingState - The input handling state to modify
     * @param active - Whether the state should be active (true) or inactive (false)
     *
     * @example
     * ```typescript
     * // Activate camera controller
     * InputManager.setActive(INPUT_HANDLING_STATE_CAMERA_CONTROLLER, true);
     *
     * // Deactivate camera controller
     * InputManager.setActive(INPUT_HANDLING_STATE_CAMERA_CONTROLLER, false);
     * ```
     */
    static setActive(inputHandlingState: InputHandlingState, active: boolean): void;
    /**
     * Adds event listeners for a specific input handling state.
     *
     * This private method attaches all event handlers associated with the given
     * input handling state to their respective DOM elements.
     *
     * @param inputHandlingState - The input handling state to add listeners for
     * @private
     */
    static __addEventListeners(inputHandlingState: InputHandlingState): void;
    /**
     * Removes event listeners for a specific input handling state.
     *
     * This private method detaches all event handlers associated with the given
     * input handling state from their respective DOM elements.
     *
     * @param inputHandlingState - The input handling state to remove listeners for
     * @private
     */
    static __removeEventListeners(inputHandlingState: InputHandlingState): void;
    /**
     * Processes and manages event listeners based on current active states.
     *
     * This private method handles the logic for determining which event listeners
     * should be active based on the current state configuration. It implements
     * priority rules where gizmo interactions take precedence over camera control,
     * and ensures mutual exclusivity between different gizmo modes.
     *
     * The processing order is:
     * 1. Camera controller (base level)
     * 2. Translation gizmo (overrides camera, excludes rotation and scale gizmos)
     * 3. Rotation gizmo (overrides camera, excludes translation and scale gizmos)
     * 4. Scale gizmo (overrides camera, excludes translation and rotation gizmos)
     *
     * @private
     */
    static __processEventListeners(): void;
    /**
     * Enables the camera controller input handling.
     *
     * This is a convenience method that activates the camera controller state
     * and processes the event listeners accordingly. It's equivalent to calling
     * `setActive(INPUT_HANDLING_STATE_CAMERA_CONTROLLER, true)`.
     *
     * @example
     * ```typescript
     * InputManager.enableCameraController();
     * ```
     */
    static enableCameraController(): void;
    /**
     * Disables the camera controller input handling.
     *
     * This is a convenience method that deactivates the camera controller state
     * and processes the event listeners accordingly. It's equivalent to calling
     * `setActive(INPUT_HANDLING_STATE_CAMERA_CONTROLLER, false)`.
     *
     * @example
     * ```typescript
     * InputManager.disableCameraController();
     * ```
     */
    static disableCameraController(): void;
    /**
     * Gets the current active input handling state.
     *
     * @returns The currently active input handling state
     *
     * @example
     * ```typescript
     * const currentState = InputManager.getCurrentState();
     * if (currentState === INPUT_HANDLING_STATE_CAMERA_CONTROLLER) {
     *   console.log('Camera controller is active');
     * }
     * ```
     */
    static getCurrentState(): string;
}
export {};
