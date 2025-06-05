import { Is } from '../misc/Is';

export const EVENT_MOUSE_DOWN = 'mousedown';
export const EVENT_MOUSE_MOVE = 'mousemove';
export const EVENT_MOUSE_UP = 'mouseup';
export const EVENT_MOUSE_WHEEL = 'wheel';
export const EVENT_MOUSE_ENTER = 'mouseenter';
export const EVENT_MOUSE_LEAVE = 'mouseleave';
export const EVENT_MOUSE_OVER = 'mouseover';
export const EVENT_CLICK = 'click';
export const EVENT_KEY_DOWN = 'keydown';
export const EVENT_KEY_UP = 'keyup';
export const EVENT_KEY_PRESS = 'keypress';
export const EVENT_POINTER_DOWN = 'pointerdown';
export const EVENT_MSPOINTER_DOWN = 'MSPointerDown';
export const EVENT_POINTER_MOVE = 'pointermove';
export const EVENT_MSPOINTER_MOVE = 'MSPointerMove';
export const EVENT_POINTER_UP = 'pointerup';
export const EVENT_MSPOINTER_UP = 'MSPointerUp';
export const EVENT_POINTER_CANCEL = 'pointercancel';
export const EVENT_POINTER_ENTER = 'pointerenter';
export const EVENT_POINTER_LEAVE = 'pointerleave';
export const EVENT_POINTER_OVER = 'pointerover';
export const EVENT_POINTER_OUT = 'pointerout';
export const EVENT_RESIZE = 'resize';
export const EVENT_ORIENTATION_CHANGE = 'orientationchange';
export const EVENT_TOUCH_TAP = 'tap';
export const EVENT_TOUCH_DOUBLE_TAP = 'doubletap';
export const EVENT_TOUCH_LONG_TAP = 'longtap';
export const EVENT_TOUCH_HOLD = 'hold';
export const EVENT_TOUCH_DRAG = 'drag';
export const EVENT_TOUCH_SWIPE = 'swipe';
export const EVENT_TOUCH_PINCH = 'pinch';
export const EVENT_TOUCH_START = 'touchstart';
export const EVENT_TOUCH_MOVE = 'touchmove';
export const EVENT_TOUCH_END = 'touchend';
export const EVENT_TOUCH_CANCEL = 'touchcancel';
export const EVENT_TOUCH_ENTER = 'touchenter';
export const EVENT_TOUCH_LEAVE = 'touchleave';
export const EVENT_TOUCH_OVER = 'touchover';
export const EVENT_TOUCH_OUT = 'touchout';

declare global {
  interface Navigator {
    readonly pointerEnabled: boolean;
    readonly msPointerEnabled: boolean;
  }
}

/**
 * Gets the appropriate event name based on device capabilities and event type.
 * Automatically detects whether to use touch, pointer, or mouse events based on device support.
 *
 * @param type - The type of event to get ('start', 'move', 'end', or 'click')
 * @returns The appropriate event name string for the current device
 * @throws Error if called in a non-browser environment
 *
 * @example
 * ```typescript
 * const startEvent = getEvent('start'); // Returns 'touchstart', 'pointerdown', or 'mousedown'
 * element.addEventListener(startEvent, handler);
 * ```
 */
export function getEvent(type: 'start' | 'move' | 'end' | 'click'): string {
  if (typeof window === "undefined") {
    throw new Error("THis function works in Browser environment")
  }
  const deviceEvents = {
    Touch: typeof document.ontouchstart !== 'undefined',
    Pointer: window.navigator.pointerEnabled,
    MSPointer: window.navigator.msPointerEnabled,
  };

  const EventNames = {
    start: deviceEvents.Pointer
      ? EVENT_POINTER_DOWN
      : deviceEvents.MSPointer
      ? EVENT_MSPOINTER_DOWN
      : deviceEvents.Touch
      ? EVENT_TOUCH_START
      : EVENT_MOUSE_DOWN,
    move: deviceEvents.Pointer
      ? EVENT_POINTER_MOVE
      : deviceEvents.MSPointer
      ? EVENT_MSPOINTER_MOVE
      : deviceEvents.Touch
      ? EVENT_TOUCH_MOVE
      : EVENT_MOUSE_MOVE,
    end: deviceEvents.Pointer
      ? EVENT_POINTER_UP
      : deviceEvents.MSPointer
      ? EVENT_MSPOINTER_UP
      : deviceEvents.Touch
      ? EVENT_TOUCH_END
      : EVENT_MOUSE_UP,
    click: EVENT_CLICK,
  };

  return EventNames[type];
}

type EventName = string;
type ClassInstance = any;
type InputHandlingStateMap = Map<InputHandlingState, InputHandlerInfo[]>;
type ActiveMap = Map<InputHandlingState, boolean>;

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

export const INPUT_HANDLING_STATE_NONE = 'None';
export const INPUT_HANDLING_STATE_CAMERA_CONTROLLER = 'CameraController';
export const INPUT_HANDLING_STATE_GIZMO_TRANSLATION = 'GizmoTranslation';
export const INPUT_HANDLING_STATE_GIZMO_SCALE = 'GizmoScale';

/**
 * Represents different input handling states in the application.
 */
export type InputHandlingState =
  | typeof INPUT_HANDLING_STATE_NONE
  | typeof INPUT_HANDLING_STATE_CAMERA_CONTROLLER
  | typeof INPUT_HANDLING_STATE_GIZMO_TRANSLATION
  | typeof INPUT_HANDLING_STATE_GIZMO_SCALE;

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
export class InputManager {
  /** Map storing input handler information for each input handling state */
  private static __inputHandlingStateMap: InputHandlingStateMap = new Map();

  /**
   * This active information is set externally and does not change state internally.
   * Using this externally set active information, this class will add and remove event listeners as appropriate.
   * As a result, event handling for the entire Rhodonite works properly.
   */
  private static __activeMap: ActiveMap = new Map();

  /** The currently active input handling state */
  private static __currentState = INPUT_HANDLING_STATE_NONE;

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
  static register(inputHandlingState: InputHandlingState, events: InputHandlerInfo[]) {
    // add event listeners
    this.__inputHandlingStateMap.set(inputHandlingState, events);
    this.__activeMap.set(inputHandlingState, true);
    this.__processEventListeners();
  }

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
  static unregister(inputHandlingState: InputHandlingState) {
    this.__activeMap.set(inputHandlingState, false);
    this.__inputHandlingStateMap.delete(inputHandlingState);
    this.__processEventListeners();
  }

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
  static setActive(inputHandlingState: InputHandlingState, active: boolean) {
    this.__activeMap.set(inputHandlingState, active);

    if (inputHandlingState === INPUT_HANDLING_STATE_GIZMO_TRANSLATION && active) {
      this.__activeMap.set(INPUT_HANDLING_STATE_GIZMO_SCALE, false);
    } else if (inputHandlingState === INPUT_HANDLING_STATE_GIZMO_SCALE && active) {
      this.__activeMap.set(INPUT_HANDLING_STATE_GIZMO_TRANSLATION, false);
    }

    this.__processEventListeners();
  }

  /**
   * Adds event listeners for a specific input handling state.
   *
   * This private method attaches all event handlers associated with the given
   * input handling state to their respective DOM elements.
   *
   * @param inputHandlingState - The input handling state to add listeners for
   * @private
   */
  static __addEventListeners(inputHandlingState: InputHandlingState) {
    const infos = InputManager.__inputHandlingStateMap.get(inputHandlingState);
    if (Is.exist(infos)) {
      for (const inputHandlerInfo of infos) {
        inputHandlerInfo.eventTargetDom.addEventListener(
          inputHandlerInfo.eventName,
          inputHandlerInfo.handler,
          inputHandlerInfo.options
        );
      }
    }
  }

  /**
   * Removes event listeners for a specific input handling state.
   *
   * This private method detaches all event handlers associated with the given
   * input handling state from their respective DOM elements.
   *
   * @param inputHandlingState - The input handling state to remove listeners for
   * @private
   */
  static __removeEventListeners(inputHandlingState: InputHandlingState) {
    const infos = InputManager.__inputHandlingStateMap.get(inputHandlingState);
    if (Is.exist(infos)) {
      for (const inputHandlerInfo of infos) {
        inputHandlerInfo.eventTargetDom.removeEventListener(
          inputHandlerInfo.eventName,
          inputHandlerInfo.handler,
          inputHandlerInfo.options
        );
      }
    }
  }

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
   * 2. Translation gizmo (overrides camera, excludes scale gizmo)
   * 3. Scale gizmo (overrides camera, excludes translation gizmo)
   *
   * @private
   */
  static __processEventListeners() {
    const translationGizmoActive = InputManager.__inputHandlingStateMap.get(
      INPUT_HANDLING_STATE_GIZMO_TRANSLATION
    );
    const scaleGizmoActive = InputManager.__inputHandlingStateMap.get(
      INPUT_HANDLING_STATE_GIZMO_SCALE
    );
    const cameraControllerActive = InputManager.__inputHandlingStateMap.get(
      INPUT_HANDLING_STATE_CAMERA_CONTROLLER
    );

    if (cameraControllerActive) {
      this.__addEventListeners(INPUT_HANDLING_STATE_CAMERA_CONTROLLER);
      this.__currentState = INPUT_HANDLING_STATE_CAMERA_CONTROLLER;
    }

    // If translationGizmo enabled
    if (translationGizmoActive) {
      this.__addEventListeners(INPUT_HANDLING_STATE_GIZMO_TRANSLATION);
      // this.__removeEventListeners(INPUT_HANDLING_STATE_CAMERACONTROLLER);
      this.__removeEventListeners(INPUT_HANDLING_STATE_GIZMO_SCALE);
      this.__currentState = INPUT_HANDLING_STATE_GIZMO_TRANSLATION;
    }

    if (scaleGizmoActive) {
      this.__addEventListeners(INPUT_HANDLING_STATE_GIZMO_SCALE);
      // this.__removeEventListeners(INPUT_HANDLING_STATE_CAMERACONTROLLER);
      this.__removeEventListeners(INPUT_HANDLING_STATE_GIZMO_TRANSLATION);
      this.__currentState = INPUT_HANDLING_STATE_GIZMO_SCALE;
    }
  }

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
  static enableCameraController() {
    this.__addEventListeners(INPUT_HANDLING_STATE_CAMERA_CONTROLLER);
    this.__activeMap.set(INPUT_HANDLING_STATE_CAMERA_CONTROLLER, true);
    this.__processEventListeners();
  }

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
  static disableCameraController() {
    this.__removeEventListeners(INPUT_HANDLING_STATE_CAMERA_CONTROLLER);
    this.__activeMap.set(INPUT_HANDLING_STATE_CAMERA_CONTROLLER, false);
    this.__processEventListeners();
  }

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
  static getCurrentState() {
    return this.__currentState;
  }
}
