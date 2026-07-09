import { MutableMatrix44 } from '../foundation/math/MutableMatrix44';
import { Vector3 } from '../foundation/math/Vector3';
import type { Engine } from '../foundation/system/Engine';
/**
 * WebAR (Augmented Reality) system for managing WebXR AR sessions and camera operations.
 * This singleton class provides functionality to initialize, enter, and manage WebAR sessions,
 * handling camera positioning, view matrices, and rendering operations for AR experiences.
 *
 * @example
 * ```typescript
 * const arSystem = WebARSystem.getInstance();
 * await arSystem.readyForWebAR(buttonElement);
 * await arSystem.enterWebAR({
 *   callbackOnXrSessionStart: () => console.log('AR started'),
 *   callbackOnXrSessionEnd: () => console.log('AR ended')
 * });
 * ```
 */
export declare class WebARSystem {
    private static __instance;
    private __oGlw;
    private __isReadyForWebAR;
    private __oArSession;
    private __oWebglLayer;
    private __spaceType;
    private __isWebARMode;
    private __requestedToEnterWebAR;
    private __oArViewerPose;
    private __oArReferenceSpace;
    private __defaultPositionInLocalSpaceMode;
    private __canvasWidthForAR;
    private __canvasHeightForAR;
    private _cameraEntity;
    private __engine;
    private __viewerTranslate;
    private __viewerAzimuthAngle;
    private __viewerOrientation;
    private __viewerScale;
    /**
     * Creates a new WebARSystem instance.
     * Initializes the camera entity with default settings for WebAR operations.
     *
     * @private Use getInstance() to get the singleton instance instead.
     */
    constructor(engine: Engine);
    /**
     * Gets the singleton instance of WebARSystem.
     * Creates a new instance if one doesn't exist.
     *
     * @returns The singleton WebARSystem instance
     */
    static init(engine: Engine): WebARSystem;
    /**
     * Prepares the system for WebAR by checking device support and setting up the UI.
     * This method must be called before entering WebAR mode.
     *
     * @param requestButtonDom - The HTML element to use as the AR entry button.
     *                          If null, a default button will be created.
     * @returns Promise that resolves to an empty array on success
     * @throws Error if not in browser environment, WebGL context is not ready, or WebAR is not supported
     *
     * @example
     * ```typescript
     * const button = document.getElementById('ar-button');
     * await arSystem.readyForWebAR(button);
     * ```
     */
    readyForWebAR(requestButtonDom: HTMLElement): Promise<never[]>;
    /**
     * Enters WebAR mode by creating an XR session and setting up the AR environment.
     * This method handles session initialization, reference space setup, and render loop management.
     *
     * @param params - Configuration object for AR session
     * @param params.initialUserPosition - Initial position of the user in world space coordinates
     * @param params.callbackOnXrSessionStart - Callback function executed when AR session starts
     * @param params.callbackOnXrSessionEnd - Callback function executed when AR session ends
     * @returns Promise that resolves when AR session is successfully started
     * @throws Error if WebGL context or WebAR readiness is not satisfied
     *
     * @example
     * ```typescript
     * await arSystem.enterWebAR({
     *   initialUserPosition: Vector3.fromCopyArray([0, 0, 0]),
     *   callbackOnXrSessionStart: () => console.log('AR session started'),
     *   callbackOnXrSessionEnd: () => console.log('AR session ended')
     * });
     * ```
     */
    enterWebAR({ initialUserPosition, callbackOnXrSessionStart, callbackOnXrSessionEnd, }: {
        initialUserPosition?: Vector3;
        callbackOnXrSessionStart: () => void;
        callbackOnXrSessionEnd: () => void;
    }): Promise<void>;
    /**
     * Sets up the WebGL layer for the XR session.
     * Configures the rendering context, creates the XR WebGL layer, and updates render state.
     *
     * @private
     * @param xrSession - The active XR session
     * @param callbackOnXrSessionStart - Callback to execute when setup is complete
     * @throws Error if not in browser environment or WebGL context is not ready
     */
    private __setupWebGLLayer;
    /**
     * Exits WebAR mode by ending the current XR session.
     * This will trigger the session end event handlers and cleanup.
     *
     * @returns Promise that resolves when the session is successfully ended
     *
     * @example
     * ```typescript
     * await arSystem.exitWebAR();
     * ```
     */
    exitWebAR(): Promise<void>;
    /**
     * Gets the canvas width configured for AR rendering.
     *
     * @returns The width of the AR canvas in pixels
     */
    getCanvasWidthForVr(): number;
    /**
     * Gets the canvas height configured for AR rendering.
     *
     * @returns The height of the AR canvas in pixels
     */
    getCanvasHeightForVr(): number;
    /**
     * Gets the current view matrix from the camera entity.
     *
     * @returns The current view matrix for rendering
     */
    get viewMatrix(): import("../foundation").Matrix44;
    /**
     * Updates the viewer pose and camera information from the XR frame.
     *
     * @private
     * @param xrFrame - The current XR frame containing pose information
     */
    private __updateView;
    /**
     * Updates camera transform information based on XR viewer pose data.
     * Applies position, orientation, and scale transformations to the camera entity.
     *
     * @private
     * @param xrViewerPose - The XR viewer pose containing transform data
     */
    private __setCameraInfoFromXRViews;
    /**
     * Gets the current projection matrix from the XR view.
     *
     * @returns The projection matrix for the current AR view, or identity matrix if no view exists
     */
    get projectionMatrix(): MutableMatrix44;
    /**
     * Pre-render processing for AR frames.
     * Updates view information if in AR mode and frame data is available.
     *
     * @internal
     * @param time - The current time timestamp
     * @param xrFrame - The XR frame object containing pose and view data
     */
    _preRender(_time: number, xrFrame: XRFrame): void;
    /**
     * Post-render processing for AR frames.
     * Handles framebuffer operations and state management after rendering.
     *
     * @internal
     */
    _postRender(): void;
    /**
     * Indicates whether the system is currently in WebAR mode.
     *
     * @returns True if currently in AR mode, false otherwise
     */
    get isWebARMode(): boolean;
    /**
     * Indicates whether the system is ready for WebAR operations.
     *
     * @returns True if ready for AR, false otherwise
     */
    get isReadyForWebAR(): boolean;
    /**
     * Indicates whether a request to enter WebAR has been made.
     *
     * @returns True if AR entry was requested, false otherwise
     */
    get requestedToEnterWebAR(): boolean;
    /**
     * Gets the current AR session instance.
     *
     * @returns The active XR session or undefined if no session exists
     */
    get arSession(): XRSession | undefined;
    /**
     * Gets the current framebuffer for AR rendering.
     *
     * @returns The framebuffer from the base layer, or undefined if not available
     */
    get framebuffer(): WebGLFramebuffer | undefined;
}
