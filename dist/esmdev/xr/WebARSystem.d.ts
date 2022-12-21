/// <reference types="webxr" />
import { MutableMatrix44 } from '../foundation/math/MutableMatrix44';
import { Vector3 } from '../foundation/math/Vector3';
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
    private __viewerTranslate;
    private __viewerAzimuthAngle;
    private __viewerOrientation;
    private __viewerScale;
    constructor();
    static getInstance(): WebARSystem;
    /**
     * Ready for WebAR
     *
     * @param requestButtonDom
     * @returns true: prepared properly, false: failed to prepare
     */
    readyForWebAR(requestButtonDom: HTMLElement): Promise<never[]>;
    /**
     * Enter to WebXR (AR mode)
     * @param initialUserPosition the initial user position in world space
     * @param callbackOnXrSessionEnd the callback function for XrSession ending
     * @returns boolean value about succeeded or not
     */
    enterWebAR({ initialUserPosition, callbackOnXrSessionStart, callbackOnXrSessionEnd, }: {
        initialUserPosition?: Vector3;
        callbackOnXrSessionStart: Function;
        callbackOnXrSessionEnd: Function;
    }): Promise<void>;
    private __setupWebGLLayer;
    /**
     * Disable WebXR (Close the XrSession)
     */
    exitWebAR(): Promise<void>;
    getCanvasWidthForVr(): number;
    getCanvasHeightForVr(): number;
    get viewMatrix(): import("..").Matrix44;
    private __updateView;
    private __setCameraInfoFromXRViews;
    get projectionMatrix(): MutableMatrix44;
    /**
     * Pre process for rendering
     * @internal
     * @param xrFrame XRFrame object
     */
    _preRender(time: number, xrFrame: XRFrame): void;
    /**
     * Post process for rendering
     * @internal
     */
    _postRender(): void;
    get isWebARMode(): boolean;
    get isReadyForWebAR(): boolean;
    get requestedToEnterWebAR(): boolean;
    get arSession(): XRSession | undefined;
    get framebuffer(): WebGLFramebuffer | undefined;
}
