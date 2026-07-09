import type { IEntity } from '../foundation/core/Entity';
import type { ISceneGraphEntity } from '../foundation/helpers/EntityHelper';
import { MutableMatrix44 } from '../foundation/math/MutableMatrix44';
import { Vector3 } from '../foundation/math/Vector3';
import { Vector4 } from '../foundation/math/Vector4';
import type { Engine } from '../foundation/system/Engine';
import type { Index } from '../types/CommonTypes';
/**
 * WebXRSystem class manages WebXR session and rendering for virtual reality experiences.
 * This singleton class handles WebXR session lifecycle, camera setup for stereo rendering,
 * input source management, and coordinate space transformations for VR applications.
 *
 * @example
 * ```typescript
 * const webXRSystem = WebXRSystem.getInstance();
 * await webXRSystem.readyForWebXR(requestButton, '/assets/');
 * const controllers = await webXRSystem.enterWebXR({
 *   initialUserPosition: Vector3.fromCopyArray([0, 1.6, 0]),
 *   callbackOnXrSessionStart: () => console.log('VR started'),
 *   callbackOnXrSessionEnd: () => console.log('VR ended'),
 *   profilePriorities: ['oculus-touch', 'generic-trigger']
 * });
 * ```
 */
export declare class WebXRSystem {
    private __engine;
    private __xrSession?;
    private __xrReferenceSpace?;
    private __webglLayer?;
    private __glw?;
    private __xrViewerPose?;
    private __isWebXRMode;
    private __spaceType;
    private __requestedToEnterWebXR;
    private __isReadyForWebXR;
    private __defaultPositionInLocalSpaceMode;
    private __canvasWidthForVR;
    private __canvasHeightForVR;
    private __viewerEntity;
    private __leftCameraEntity;
    private __rightCameraEntity;
    private __basePath?;
    private __controllerEntities;
    private __xrInputSources;
    private __viewerTranslate;
    private __viewerAzimuthAngle;
    private __viewerOrientation;
    private __viewerScale;
    private __multiviewFramebufferHandle;
    private __multiviewColorTextureHandle;
    private __webglStereoUtil?;
    private __xrGpuBinding?;
    private __xrProjectionLayerWebGPU?;
    /**
     * Private constructor for singleton pattern.
     * Initializes the viewer entity and left/right camera entities for stereo rendering.
     * Sets up the scene graph hierarchy with cameras as children of the viewer entity.
     */
    private constructor();
    /**
     * Prepares the WebXR system for VR session initialization.
     * Checks for WebXR support, loads required modules, and sets up the entry point.
     *
     * @param requestButtonDom - HTML element to serve as the VR entry button. If null, creates a default button.
     * @param basePath - Base path for loading controller models and assets.
     * @returns Promise that resolves to an empty array on success.
     * @throws {Error} When not running in a browser environment or WebXR is not supported.
     *
     * @example
     * ```typescript
     * const enterButton = document.getElementById('enter-vr-button');
     * await webXRSystem.readyForWebXR(enterButton, '/assets/controllers/');
     * ```
     */
    readyForWebXR(requestButtonDom: HTMLElement, basePath: string): Promise<never[]>;
    /**
     * Initiates a WebXR VR session with specified configuration.
     * Requests an immersive VR session, sets up reference space, WebGL layer, and input handling.
     *
     * @param options - Configuration object for WebXR session.
     * @param options.initialUserPosition - Initial position of the user in world space. Defaults to [0, 1.1, 0].
     * @param options.callbackOnXrSessionStart - Callback function executed when the XR session starts.
     * @param options.callbackOnXrSessionEnd - Callback function executed when the XR session ends.
     * @param options.profilePriorities - Array of controller profile names in priority order for input mapping.
     * @returns Promise that resolves to an array of controller entities, or undefined on failure.
     *
     * @example
     * ```typescript
     * const controllers = await webXRSystem.enterWebXR({
     *   initialUserPosition: Vector3.fromCopyArray([0, 1.6, 2]),
     *   callbackOnXrSessionStart: () => {
     *     console.log('VR session started');
     *     // Initialize VR-specific UI or game logic
     *   },
     *   callbackOnXrSessionEnd: () => {
     *     console.log('VR session ended');
     *     // Clean up VR-specific resources
     *   },
     *   profilePriorities: ['oculus-touch-v2', 'oculus-touch', 'generic-trigger']
     * });
     * ```
     */
    enterWebXR({ initialUserPosition, callbackOnXrSessionStart, callbackOnXrSessionEnd, profilePriorities, }: {
        initialUserPosition?: Vector3;
        callbackOnXrSessionStart: () => void;
        callbackOnXrSessionEnd: () => void;
        profilePriorities: string[];
    }): Promise<IEntity[] | undefined>;
    /**
     * Exits the current WebXR session and returns to normal rendering mode.
     * Gracefully terminates the XR session, triggering cleanup callbacks.
     *
     * @example
     * ```typescript
     * // Exit VR mode when user clicks a button
     * exitButton.addEventListener('click', async () => {
     *   await webXRSystem.exitWebXR();
     * });
     * ```
     */
    exitWebXR(): Promise<void>;
    /**
     * Gets the canvas width configured for VR rendering.
     *
     * @returns The width of the VR canvas in pixels.
     */
    getCanvasWidthForVr(): number;
    /**
     * Gets the canvas height configured for VR rendering.
     *
     * @returns The height of the VR canvas in pixels.
     */
    getCanvasHeightForVr(): number;
    /**
     * Gets all currently tracked controller entities.
     *
     * @returns Array of scene graph entities representing VR controllers.
     */
    getControllerEntities(): ISceneGraphEntity[];
    /**
     * Gets the view matrix for the left eye camera.
     *
     * @returns The view matrix for left eye rendering.
     */
    get leftViewMatrix(): import("../foundation").Matrix44;
    /**
     * Gets the view matrix for the right eye camera.
     *
     * @returns The view matrix for right eye rendering.
     */
    get rightViewMatrix(): import("../foundation").Matrix44;
    /**
     * Gets the projection matrix for the left eye.
     * Derived from the XR system's view information.
     *
     * @returns The projection matrix for left eye rendering.
     */
    get leftProjectionMatrix(): MutableMatrix44;
    /**
     * Gets the projection matrix for the right eye.
     * Derived from the XR system's view information.
     *
     * @returns The projection matrix for right eye rendering.
     */
    get rightProjectionMatrix(): MutableMatrix44;
    /**
     * Gets the WebXR framebuffer for rendering.
     *
     * @returns The WebGL framebuffer provided by the XR system, or undefined if not available.
     */
    get framebuffer(): WebGLFramebuffer | undefined;
    /**
     * Checks if multiview rendering is supported and enabled.
     *
     * @returns True if multiview VR rendering is supported.
     */
    isMultiView(): boolean;
    /**
     * Checks if a WebXR session has been requested.
     *
     * @returns True if WebXR session entry has been requested.
     */
    get requestedToEnterWebXR(): boolean;
    /**
     * Gets the current XR session object.
     *
     * @returns The active XRSession, or undefined if no session is active.
     */
    get xrSession(): XRSession | undefined;
    /**
     * Legacy property for backward compatibility.
     *
     * @deprecated Use requestedToEnterWebXR instead.
     * @returns True if WebXR session entry has been requested.
     */
    get requestedToEnterWebVR(): boolean;
    /**
     * Checks if currently in WebXR rendering mode.
     *
     * @returns True if WebXR mode is active.
     */
    get isWebXRMode(): boolean;
    /**
     * Sets the WebXR mode state for this system and the WebGL context.
     *
     * @param mode - Whether WebXR mode should be enabled.
     */
    private __setWebXRMode;
    /**
     * Checks if the system is ready to enter WebXR.
     *
     * @returns True if WebXR initialization is complete and ready for session start.
     */
    get isReadyForWebXR(): boolean;
    /**
     * Gets the singleton instance of WebXRSystem.
     * Creates a new instance if one doesn't exist.
     *
     * @returns The singleton WebXRSystem instance.
     */
    static init(engine: Engine): WebXRSystem;
    /**
     * Gets the view matrix for the specified eye.
     *
     * @internal
     * @param index - Eye index (0: left, 1: right).
     * @returns The view matrix for the specified eye.
     */
    _getViewMatrixAt(index: Index): import("../foundation").Matrix44;
    /**
     * Gets the projection matrix for the specified eye.
     *
     * @internal
     * @param index - Eye index (0: left, 1: right).
     * @returns The projection matrix for the specified eye.
     */
    _getProjectMatrixAt(index: Index): MutableMatrix44;
    /**
     * Gets the viewport configuration for the specified eye.
     *
     * @internal
     * @param index - Eye index (0: left, 1: right).
     * @returns The viewport vector (x, y, width, height) for the specified eye.
     */
    _getViewportAt(index: Index): Vector4;
    /**
     * Gets the viewport configuration for the left eye.
     *
     * @internal
     * @returns The viewport vector (x, y, width, height) for the left eye.
     */
    _getLeftViewport(): Vector4;
    /**
     * Gets the viewport configuration for the right eye.
     * Accounts for multiview rendering mode differences.
     *
     * @internal
     * @returns The viewport vector (x, y, width, height) for the right eye.
     */
    _getRightViewport(): Vector4;
    /**
     * Gets the world position of the specified VR camera.
     * Combines XR pose data with user position offset and viewer transformations.
     *
     * @internal
     * @param displayIdx - Eye index (0: left, 1: right).
     * @returns The world position of the VR camera.
     */
    _getCameraWorldPositionAt(displayIdx: Index): Vector3;
    /**
     * Gets the component SID (System ID) for the specified camera.
     *
     * @internal
     * @param index - Eye index (0: left, 1: right).
     * @returns The SID of the CameraComponent for the specified eye.
     */
    _getCameraComponentSIDAt(index: Index): number;
    /**
     * Gets the camera component for the specified eye.
     *
     * @internal
     * @param index - Eye index (0: left, 1: right).
     * @returns The CameraComponent for the specified eye.
     */
    _getCameraComponentAt(index: Index): import("../foundation").CameraComponent;
    /**
     * Performs pre-rendering updates for WebXR.
     * Updates view matrices, input sources, and gamepad states.
     * Called once per frame before rendering begins.
     *
     * @internal
     * @param time - Current time in milliseconds.
     * @param xrFrame - The XRFrame object for this rendering frame.
     */
    _preRender(time: number, xrFrame: XRFrame): void;
    /**
     * Resets all viewer transformation parameters to their default values.
     * Useful for resetting user position and orientation to origin.
     */
    resetViewerTransform(): void;
    /**
     * Performs post-rendering cleanup for WebXR.
     * Currently handles multiview framebuffer operations when enabled.
     * Called once per frame after rendering is complete.
     *
     * @internal
     */
    _postRender(): void;
    /**
     * Handles changes in XR input sources (controllers).
     * Creates motion controller entities for newly added input sources.
     *
     * @private
     * @param event - XRInputSourceChangeEvent containing added/removed input sources.
     * @param resolve - Promise resolve function to return controller entities.
     * @param profilePriorities - Array of controller profile names in priority order.
     */
    private __onInputSourcesChange;
    /**
     * Updates camera information from XR viewer pose data.
     * Calculates and applies transformations for left and right eye cameras based on XR pose.
     *
     * @private
     * @param xrViewerPose - The XRViewerPose containing view and transform data.
     */
    private __setCameraInfoFromXRViews;
    /**
     * Sets up the WebGL layer for XR rendering.
     * Makes the WebGL context XR-compatible and configures the XR session's base layer.
     *
     * @private
     * @param xrSession - The XRSession to configure.
     * @param callbackOnXrSessionStart - Callback to execute when setup is complete.
     */
    private __setupWebGLLayer;
    private __setupWebGPULayer;
    /**
     * Updates the viewer pose from the current XR frame.
     * Retrieves the current viewer pose and updates camera transformations.
     *
     * @private
     * @param xrFrame - The current XRFrame containing pose data.
     */
    private __updateView;
    /**
     * Updates the transforms and states of XR input sources (controllers).
     * Applies XR pose data to controller entities and updates their visual models.
     *
     * @private
     * @param xrFrame - The current XRFrame containing input source pose data.
     */
    private __updateInputSources;
}
