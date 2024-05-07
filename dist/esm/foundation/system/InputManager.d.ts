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
export declare function getEvent(type: 'start' | 'move' | 'end' | 'click'): string;
type ClassInstance = any;
export interface InputHandlerInfo {
    eventName: string;
    handler: (event: any) => void;
    options: AddEventListenerOptions;
    classInstance: ClassInstance;
    eventTargetDom: EventTarget;
}
export declare const INPUT_HANDLING_STATE_NONE = "None";
export declare const INPUT_HANDLING_STATE_CAMERA_CONTROLLER = "CameraController";
export declare const INPUT_HANDLING_STATE_GIZMO_TRANSLATION = "GizmoTranslation";
export declare const INPUT_HANDLING_STATE_GIZMO_SCALE = "GizmoScale";
export type InputHandlingState = typeof INPUT_HANDLING_STATE_NONE | typeof INPUT_HANDLING_STATE_CAMERA_CONTROLLER | typeof INPUT_HANDLING_STATE_GIZMO_TRANSLATION | typeof INPUT_HANDLING_STATE_GIZMO_SCALE;
export declare class InputManager {
    private static __inputHandlingStateMap;
    /**
     * This active information is set externally and does not change state internally.
     * Using this externally set active information, this class will add and remove event listeners as appropriate.
     * As a result, event handling for the entire Rhodonite works properly.
     */
    private static __activeMap;
    private static __currentState;
    static register(inputHandlingState: InputHandlingState, events: InputHandlerInfo[]): void;
    static unregister(inputHandlingState: InputHandlingState): void;
    static setActive(inputHandlingState: InputHandlingState, active: boolean): void;
    static __addEventListeners(inputHandlingState: InputHandlingState): void;
    static __removeEventListeners(inputHandlingState: InputHandlingState): void;
    static __processEventListeners(): void;
    static enableCameraController(): void;
    static disableCameraController(): void;
    static getCurrentState(): string;
}
export {};
