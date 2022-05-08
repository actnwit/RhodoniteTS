import { TranslationGizmo } from '../gizmos/TranslationGizmo';
import {Is} from '../misc/Is';
import {assertExist} from '../misc/MiscUtil';

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

export function getEvent(type: 'start' | 'move' | 'end' | 'click'): string {
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

export interface InputHandlerInfo {
  eventName: string
  handler: (event: any) => void;
  options: AddEventListenerOptions;
  classInstance: ClassInstance;
  eventTargetDom: EventTarget;
}

export const INPUT_HANDLING_STATE_NONE = 'None';
export const INPUT_HANDLING_STATE_CAMERACONTROLLER = 'CameraController';
export const INPUT_HANDLING_STATE_GIZMO_TRNSLATION = 'GizmoTranslation';
export const INPUT_HANDLING_STATE_GIZMO_SCALE = 'GizmoScale';

export type InputHandlingState =
  | typeof INPUT_HANDLING_STATE_NONE
  | typeof INPUT_HANDLING_STATE_CAMERACONTROLLER
  | typeof INPUT_HANDLING_STATE_GIZMO_TRNSLATION
  | typeof INPUT_HANDLING_STATE_GIZMO_SCALE;

export class InputManager {
  private static __inputHandlingStateMap: InputHandlingStateMap = new Map();

  /**
   * This active information is set externally and does not change state internally.
   * Using this externally set active information, this class will add and remove event listeners as appropriate.
   * As a result, event handling for the entire Rhodonite works properly.
   */
  private static __activeMap: ActiveMap = new Map();

  private static __currentState = INPUT_HANDLING_STATE_NONE;

  static register(
    inputHandlingState: InputHandlingState,
    events: InputHandlerInfo[]
  ) {
    // add event listeners
    this.__inputHandlingStateMap.set(inputHandlingState, events);
    this.__activeMap.set(inputHandlingState, true);
    this.__processEventListners();
  }

  static unregister(inputHandlingState: InputHandlingState) {
    this.__inputHandlingStateMap.delete(inputHandlingState);
    this.__activeMap.set(inputHandlingState, false);
    this.__processEventListners();
  }

  static setActive(inputHandlingState: InputHandlingState, active: boolean) {
    this.__activeMap.set(inputHandlingState, active);

    if (inputHandlingState === INPUT_HANDLING_STATE_GIZMO_TRNSLATION && active) {
      this.__activeMap.set(INPUT_HANDLING_STATE_GIZMO_SCALE, false);
    } else if (inputHandlingState === INPUT_HANDLING_STATE_GIZMO_SCALE && active) {
      this.__activeMap.set(INPUT_HANDLING_STATE_GIZMO_TRNSLATION, false);
    }

    this.__processEventListners();
  }

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

  static __processEventListners() {
    const translationGizmoActive = InputManager.__inputHandlingStateMap.get(INPUT_HANDLING_STATE_GIZMO_TRNSLATION);
    const scaleGizmoActive = InputManager.__inputHandlingStateMap.get(INPUT_HANDLING_STATE_GIZMO_SCALE);
    const cameraControllerActive = InputManager.__inputHandlingStateMap.get(INPUT_HANDLING_STATE_CAMERACONTROLLER);

    if (cameraControllerActive) {
      this.__addEventListeners(INPUT_HANDLING_STATE_CAMERACONTROLLER);
      this.__currentState = INPUT_HANDLING_STATE_CAMERACONTROLLER;
    }

    // If translationGizmo enabled
    if (translationGizmoActive) {
      this.__addEventListeners(INPUT_HANDLING_STATE_GIZMO_TRNSLATION);
      // this.__removeEventListeners(INPUT_HANDLING_STATE_CAMERACONTROLLER);
      this.__removeEventListeners(INPUT_HANDLING_STATE_GIZMO_SCALE);
      this.__currentState = INPUT_HANDLING_STATE_GIZMO_TRNSLATION;
    }

    if (scaleGizmoActive) {
      this.__addEventListeners(INPUT_HANDLING_STATE_GIZMO_SCALE);
      // this.__removeEventListeners(INPUT_HANDLING_STATE_CAMERACONTROLLER);
      this.__removeEventListeners(INPUT_HANDLING_STATE_GIZMO_TRNSLATION);
      this.__currentState = INPUT_HANDLING_STATE_GIZMO_SCALE;
    }
  }

  static enableCameraController() {
    this.__addEventListeners(INPUT_HANDLING_STATE_CAMERACONTROLLER);
  }

  static disableCameraController() {
    this.__removeEventListeners(INPUT_HANDLING_STATE_CAMERACONTROLLER);
  }

  static getCurrentState() {
    return this.__currentState;
  }
}
