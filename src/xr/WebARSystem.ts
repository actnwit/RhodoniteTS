/* eslint-disable @typescript-eslint/no-empty-function */
import { createCameraEntity } from '../foundation/components/Camera/createCameraEntity';
import type { ICameraEntity } from '../foundation/helpers/EntityHelper';
import { MutableMatrix44 } from '../foundation/math/MutableMatrix44';
import { MutableQuaternion } from '../foundation/math/MutableQuaternion';
import { MutableScalar } from '../foundation/math/MutableScalar';
import { MutableVector3 } from '../foundation/math/MutableVector3';
import { Vector3 } from '../foundation/math/Vector3';
import { Is } from '../foundation/misc/Is';
import { Logger } from '../foundation/misc/Logger';
import { None, type Option, Some } from '../foundation/misc/Option';
import { CGAPIResourceRepository } from '../foundation/renderer/CGAPIResourceRepository';
import { Engine } from '../foundation/system/Engine';
import { ModuleManager } from '../foundation/system/ModuleManager';
import type { WebGLContextWrapper } from '../webgl/WebGLContextWrapper';

const defaultUserPositionInVR = Vector3.fromCopyArray([0.0, 1.1, 0]);
declare const window: any;

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
export class WebARSystem {
  private static __instance: WebARSystem;
  private __oGlw: Option<WebGLContextWrapper> = new None();
  private __isReadyForWebAR = false;
  private __oArSession: Option<XRSession> = new None();
  private __oWebglLayer: Option<XRWebGLLayer> = new None();
  private __spaceType: 'local' | 'local-floor' = 'local';
  private __isWebARMode = false;
  private __requestedToEnterWebAR = false;
  private __oArViewerPose: Option<XRViewerPose> = new None();
  private __oArReferenceSpace: Option<XRReferenceSpace> = new None();
  private __defaultPositionInLocalSpaceMode = defaultUserPositionInVR;
  private __canvasWidthForAR = 0;
  private __canvasHeightForAR = 0;
  private _cameraEntity: ICameraEntity = createCameraEntity();
  private __viewerTranslate = MutableVector3.zero();
  private __viewerAzimuthAngle = MutableScalar.zero();
  private __viewerOrientation = MutableQuaternion.identity();
  private __viewerScale = MutableVector3.one();

  /**
   * Creates a new WebARSystem instance.
   * Initializes the camera entity with default settings for WebAR operations.
   *
   * @private Use getInstance() to get the singleton instance instead.
   */
  constructor() {
    this._cameraEntity.tryToSetUniqueName('WebAR Viewer', true);
    this._cameraEntity.tryToSetTag({
      tag: 'type',
      value: 'background-assets',
    });
  }

  /**
   * Gets the singleton instance of WebARSystem.
   * Creates a new instance if one doesn't exist.
   *
   * @returns The singleton WebARSystem instance
   */
  static getInstance() {
    if (!this.__instance) {
      this.__instance = new WebARSystem();
    }

    return this.__instance;
  }

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
  async readyForWebAR(requestButtonDom: HTMLElement) {
    if (typeof window === 'undefined') {
      throw new Error('This method works in Browser environment');
    }

    await ModuleManager.getInstance().loadModule('xr');

    const glw = CGAPIResourceRepository.getWebGLResourceRepository().currentWebGLContextWrapper;
    if (glw == null) {
      throw new Error('WebGL Context is not ready yet.');
    }
    this.__oGlw = new Some(glw);
    const supported = await navigator.xr!.isSessionSupported('immersive-ar');
    if (supported) {
      Logger.info('WebAR is supported.');
      if (requestButtonDom) {
        requestButtonDom.style.display = 'block';
      } else {
        const paragraph = document.createElement('p');
        const anchor = document.createElement('a');
        anchor.setAttribute('id', 'enter-ar');
        const enterVr = document.createTextNode('Enter AR');

        anchor.appendChild(enterVr);
        paragraph.appendChild(anchor);

        const canvas = glw.canvas;
        canvas.parentNode!.insertBefore(paragraph, canvas);
        window.addEventListener('click', this.enterWebAR.bind(this) as any);
      }

      this.__isReadyForWebAR = true;
    } else {
      throw new Error('WebAR is not supported in this environment.');
    }
    return [];
  }

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
  async enterWebAR({
    initialUserPosition,
    callbackOnXrSessionStart = () => {},
    callbackOnXrSessionEnd = () => {},
  }: {
    initialUserPosition?: Vector3;
    callbackOnXrSessionStart: () => void;
    callbackOnXrSessionEnd: () => void;
  }) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const glw = webglResourceRepository.currentWebGLContextWrapper;

    if (glw != null && this.__isReadyForWebAR) {
      const session = (await navigator.xr!.requestSession('immersive-vr')) as XRSession;
      this.__oArSession = new Some(session);

      session.addEventListener('end', () => {
        glw.__gl.bindFramebuffer(glw.__gl.FRAMEBUFFER, null);
        this.__oArSession = new None();
        this.__oWebglLayer = new None();
        this.__oArViewerPose = new None();
        this.__oArReferenceSpace = new None();
        this.__spaceType = 'local';
        this.__isReadyForWebAR = false;
        this.__requestedToEnterWebAR = false;
        this.__isWebARMode = false;
        this.__defaultPositionInLocalSpaceMode = defaultUserPositionInVR;
        Logger.info('XRSession ends.');
        Engine.stopRenderLoop();
        Engine.restartRenderLoop();
        callbackOnXrSessionEnd();
      });

      const referenceSpace = await session.requestReferenceSpace('local');
      this.__spaceType = 'local';
      this.__defaultPositionInLocalSpaceMode = initialUserPosition ?? defaultUserPositionInVR;
      this.__oArReferenceSpace = new Some(referenceSpace);
      Engine.stopRenderLoop();
      await this.__setupWebGLLayer(session, callbackOnXrSessionStart);
      this.__requestedToEnterWebAR = true;
      Engine.restartRenderLoop();
      Logger.warn('End of enterWebXR.');
      return;
    }
    Logger.error('WebGL context or WebXRSession is not ready yet.');
    return;
  }

  /**
   * Sets up the WebGL layer for the XR session.
   * Configures the rendering context, creates the XR WebGL layer, and updates render state.
   *
   * @private
   * @param xrSession - The active XR session
   * @param callbackOnXrSessionStart - Callback to execute when setup is complete
   * @throws Error if not in browser environment or WebGL context is not ready
   */
  private async __setupWebGLLayer(xrSession: XRSession, callbackOnXrSessionStart: () => void) {
    const gl = this.__oGlw.unwrapForce().getRawContext();

    if (gl != null) {
      // Make sure the canvas context we want to use is compatible with the current xr device.
      await (gl as any).makeXRCompatible();
      // The content that will be shown on the device is defined by the session's
      // baseLayer.

      if (typeof window === 'undefined') {
        throw new Error('This method works in Browser Environment');
      }

      this.__oWebglLayer = new Some(window.XRWebGLLayer(xrSession, gl) as XRWebGLLayer);
      const webglLayer = this.__oWebglLayer.unwrapForce();
      xrSession.updateRenderState({
        baseLayer: webglLayer,
        depthNear: 0.1,
        depthFar: 10000,
      });
      const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
      this.__canvasWidthForAR = webglLayer.framebufferWidth;
      this.__canvasHeightForAR = webglLayer.framebufferHeight;
      Logger.info(this.__canvasWidthForAR.toString());
      Logger.info(this.__canvasHeightForAR.toString());
      webglResourceRepository.resizeCanvas(this.__canvasWidthForAR, this.__canvasHeightForAR);
      this.__isWebARMode = true;
      callbackOnXrSessionStart();
    } else {
      Logger.error('WebGL context is not ready for WebXR.');
    }
  }

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
  async exitWebAR() {
    if (this.__oArSession.has()) {
      // End the XR session now.
      await this.__oArSession.get().end();
    }
  }

  /// Getter Methods

  /**
   * Gets the canvas width configured for AR rendering.
   *
   * @returns The width of the AR canvas in pixels
   */
  getCanvasWidthForVr() {
    return this.__canvasWidthForAR;
  }

  /**
   * Gets the canvas height configured for AR rendering.
   *
   * @returns The height of the AR canvas in pixels
   */
  getCanvasHeightForVr() {
    return this.__canvasHeightForAR;
  }

  /**
   * Gets the current view matrix from the camera entity.
   *
   * @returns The current view matrix for rendering
   */
  get viewMatrix() {
    return this._cameraEntity.getCamera().viewMatrix;
  }

  /**
   * Updates the viewer pose and camera information from the XR frame.
   *
   * @private
   * @param xrFrame - The current XR frame containing pose information
   */
  private __updateView(xrFrame: XRFrame) {
    this.__oArViewerPose = new Some(xrFrame.getViewerPose(this.__oArReferenceSpace.unwrapForce())!);
    this.__setCameraInfoFromXRViews(this.__oArViewerPose.unwrapForce());
  }

  /**
   * Updates camera transform information based on XR viewer pose data.
   * Applies position, orientation, and scale transformations to the camera entity.
   *
   * @private
   * @param xrViewerPose - The XR viewer pose containing transform data
   */
  private __setCameraInfoFromXRViews(xrViewerPose: XRViewerPose) {
    if (Is.not.exist(xrViewerPose)) {
      Logger.warn('xrViewerPose not exist');
      return;
    }
    const xrView = xrViewerPose.views[0];
    if (Is.not.exist(xrView)) {
      return;
    }

    const orientation = xrViewerPose.transform.orientation;
    this.__viewerOrientation.x = orientation.x;
    this.__viewerOrientation.y = orientation.y;
    this.__viewerOrientation.z = orientation.z;
    this.__viewerOrientation.w = orientation.w;

    const m = MutableMatrix44.fromCopyFloat32ArrayColumnMajor(xrView?.transform.matrix as Float32Array);

    const rotateMat = m;

    const scale = this.__viewerScale.x;
    const pos = xrView.transform.position;
    const translateScaled = MutableVector3.add(this.__defaultPositionInLocalSpaceMode, this.__viewerTranslate);
    const xrViewerPos = Vector3.fromCopyArray([pos.x, pos.y, pos.z]);
    const translate = MutableVector3.add(this.__defaultPositionInLocalSpaceMode, this.__viewerTranslate).add(
      xrViewerPos
    );
    const viewerTranslateScaledX = translateScaled.x;
    const viewerTranslateScaledZ = translateScaled.z;
    const viewerTranslateX = translate.x;
    const viewerTranslateZ = translate.z;
    const viewerTransform = this._cameraEntity.getTransform()!;
    viewerTransform.localPosition = Vector3.fromCopyArray([viewerTranslateScaledX, 0, viewerTranslateScaledZ]);
    viewerTransform.localScale = Vector3.fromCopyArray([scale, scale, scale]);
    viewerTransform.localEulerAngles = Vector3.fromCopyArray([0, this.__viewerAzimuthAngle.x, 0]);

    rotateMat.translateY = translate.y;
    rotateMat.translateX = translate.x - viewerTranslateX;
    rotateMat.translateZ = translate.z - viewerTranslateZ;
    rotateMat.translateY += xrViewerPos.y;
    rotateMat.translateX += xrViewerPos.x;
    rotateMat.translateZ += xrViewerPos.z;

    this._cameraEntity.getTransform()!.localMatrix = rotateMat;
  }

  /**
   * Gets the current projection matrix from the XR view.
   *
   * @returns The projection matrix for the current AR view, or identity matrix if no view exists
   */
  get projectionMatrix() {
    const xrView = this.__oArViewerPose.unwrapForce().views[0];
    return MutableMatrix44.fromCopyFloat32ArrayColumnMajor(
      Is.exist(xrView) ? xrView.projectionMatrix : MutableMatrix44.identity()._v
    );
  }

  /**
   * Pre-render processing for AR frames.
   * Updates view information if in AR mode and frame data is available.
   *
   * @internal
   * @param time - The current time timestamp
   * @param xrFrame - The XR frame object containing pose and view data
   */
  _preRender(_time: number, xrFrame: XRFrame) {
    if (this.isWebARMode && this.__requestedToEnterWebAR && xrFrame != null) {
      this.__updateView(xrFrame);
    }
  }

  /**
   * Post-render processing for AR frames.
   * Handles framebuffer operations and state management after rendering.
   *
   * @internal
   */
  _postRender() {
    if (this.isWebARMode) {
      // gl?.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    if (this.requestedToEnterWebAR) {
      // this.__isWebXRMode = true;
    }
  }

  /**
   * Indicates whether the system is currently in WebAR mode.
   *
   * @returns True if currently in AR mode, false otherwise
   */
  get isWebARMode() {
    return this.__isWebARMode;
  }

  /**
   * Indicates whether the system is ready for WebAR operations.
   *
   * @returns True if ready for AR, false otherwise
   */
  get isReadyForWebAR() {
    return this.__isReadyForWebAR;
  }

  /**
   * Indicates whether a request to enter WebAR has been made.
   *
   * @returns True if AR entry was requested, false otherwise
   */
  get requestedToEnterWebAR() {
    return this.__requestedToEnterWebAR;
  }

  /**
   * Gets the current AR session instance.
   *
   * @returns The active XR session or undefined if no session exists
   */
  get arSession() {
    return this.__oArSession.unwrapOrUndefined();
  }

  /**
   * Gets the current framebuffer for AR rendering.
   *
   * @returns The framebuffer from the base layer, or undefined if not available
   */
  get framebuffer() {
    return this.__oArSession.unwrapOrUndefined()?.renderState.baseLayer?.framebuffer;
  }
}
