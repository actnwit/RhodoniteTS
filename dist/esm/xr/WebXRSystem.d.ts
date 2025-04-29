import { Vector3 } from '../foundation/math/Vector3';
import { MutableMatrix44 } from '../foundation/math/MutableMatrix44';
import { Index } from '../types/CommonTypes';
import { Vector4 } from '../foundation/math/Vector4';
import { IEntity } from '../foundation/core/Entity';
import { ISceneGraphEntity } from '../foundation/helpers/EntityHelper';
/**
 * WebXRSystem class manages WebXR session and rendering
 */
export declare class WebXRSystem {
    private static __instance;
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
    private constructor();
    /**
     * Ready for WebXR
     *
     * @param requestButtonDom
     * @returns true: prepared properly, false: failed to prepare
     */
    readyForWebXR(requestButtonDom: HTMLElement, basePath: string): Promise<never[]>;
    /**
     * Enter to WebXR (VR mode)
     * @param initialUserPosition the initial user position in world space
     * @param callbackOnXrSessionEnd the callback function for XrSession ending
     * @returns boolean value about succeeded or not
     */
    enterWebXR({ initialUserPosition, callbackOnXrSessionStart, callbackOnXrSessionEnd, profilePriorities, }: {
        initialUserPosition?: Vector3;
        callbackOnXrSessionStart: () => void;
        callbackOnXrSessionEnd: () => void;
        profilePriorities: string[];
    }): Promise<IEntity[] | undefined>;
    /**
     * Disable WebXR (Close the XrSession)
     */
    exitWebXR(): Promise<void>;
    getCanvasWidthForVr(): number;
    getCanvasHeightForVr(): number;
    getControllerEntities(): ISceneGraphEntity[];
    get leftViewMatrix(): import("../foundation").Matrix44;
    get rightViewMatrix(): import("../foundation").Matrix44;
    get leftProjectionMatrix(): MutableMatrix44;
    get rightProjectionMatrix(): MutableMatrix44;
    get framebuffer(): WebGLFramebuffer | undefined;
    isMultiView(): boolean;
    get requestedToEnterWebXR(): boolean;
    get xrSession(): XRSession | undefined;
    get requestedToEnterWebVR(): boolean;
    get isWebXRMode(): boolean;
    private __setWebXRMode;
    get isReadyForWebXR(): boolean;
    static getInstance(): WebXRSystem;
    /**
     * Getter of the view matrix of right eye
     * @param index (0: left, 1: right)
     * @internal
     * @returns The view matrix vector of right eye
     */
    _getViewMatrixAt(index: Index): import("../foundation").Matrix44;
    /**
     * Getter of the project matrix of right eye
     * @param index (0: left, 1: right)
     * @internal
     * @returns The project matrix of right eye
     */
    _getProjectMatrixAt(index: Index): MutableMatrix44;
    /**
     * Getter of the viewport vector
     * @param index (0: left, 1: right)
     * @internal
     * @returns the viewport vector
     */
    _getViewportAt(index: Index): Vector4;
    /**
     * Getter of the viewport vector of left eye
     * @internal
     * @returns The viewport vector of left eye
     */
    _getLeftViewport(): Vector4;
    /**
     * Getter of the viewport vector of right eye
     * @internal
     * @returns The viewport vector of right eye
     */
    _getRightViewport(): Vector4;
    _setValuesToGlobalDataRepository(): void;
    /**
     * Getter of the position of the VR camera in world space
     * @internal
     * @param displayIdx (0: left, 1: right)
     * @returns The position of the VR camera in world space
     */
    _getCameraWorldPositionAt(displayIdx: Index): Vector3;
    /**
     * Getter of the CameraComponent SID of left/right eye
     * @internal
     * @param index (0: left, 1: right)
     * @returns the SID of the CameraComponent of left/right eye
     */
    _getCameraComponentSIDAt(index: Index): number;
    /**
     * Getter of the CameraComponent of left/right eye
     * @internal
     * @param index (0: left, 1: right)
     * @returns the CameraComponent of left/right eye
     */
    _getCameraComponentAt(index: Index): import("../foundation").CameraComponent;
    /**
     * Pre process for rendering
     * @internal
     * @param xrFrame XRFrame object
     */
    _preRender(time: number, xrFrame: XRFrame): void;
    resetViewerTransform(): void;
    /**
     * Post process for rendering
     * @internal
     */
    _postRender(): void;
    private __onInputSourcesChange;
    private __setCameraInfoFromXRViews;
    private __setupWebGLLayer;
    private __updateView;
    private __updateInputSources;
}
