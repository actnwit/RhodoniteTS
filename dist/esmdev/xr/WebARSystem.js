// src/xr/WebARSystem.ts
import { createCameraEntity } from "../foundation/components/Camera/createCameraEntity.js";
import { MutableMatrix44 } from "../foundation/math/MutableMatrix44.js";
import { MutableQuaternion } from "../foundation/math/MutableQuaternion.js";
import { MutableScalar } from "../foundation/math/MutableScalar.js";
import { MutableVector3 } from "../foundation/math/MutableVector3.js";
import { Vector3 } from "../foundation/math/Vector3.js";
import { Is } from "../foundation/misc/Is.js";
import { Logger } from "../foundation/misc/Logger.js";
import { None, Some } from "../foundation/misc/Option.js";
import { ModuleManager } from "../foundation/system/ModuleManager.js";
var defaultUserPositionInVR = Vector3.fromCopyArray([0, 1.1, 0]);
var WebARSystem = class _WebARSystem {
  /**
   * Creates a new WebARSystem instance.
   * Initializes the camera entity with default settings for WebAR operations.
   *
   * @private Use getInstance() to get the singleton instance instead.
   */
  constructor(engine) {
    this.__oGlw = new None();
    this.__isReadyForWebAR = false;
    this.__oArSession = new None();
    this.__oWebglLayer = new None();
    this.__spaceType = "local";
    this.__isWebARMode = false;
    this.__requestedToEnterWebAR = false;
    this.__oArViewerPose = new None();
    this.__oArReferenceSpace = new None();
    this.__defaultPositionInLocalSpaceMode = defaultUserPositionInVR;
    this.__canvasWidthForAR = 0;
    this.__canvasHeightForAR = 0;
    this.__viewerTranslate = MutableVector3.zero();
    this.__viewerAzimuthAngle = MutableScalar.zero();
    this.__viewerOrientation = MutableQuaternion.identity();
    this.__viewerScale = MutableVector3.one();
    this.__engine = engine;
    this._cameraEntity = createCameraEntity(engine, false);
    this._cameraEntity.tryToSetUniqueName("WebAR Viewer", true);
    this._cameraEntity.tryToSetTag({
      tag: "type",
      value: "background-assets"
    });
  }
  /**
   * Gets the singleton instance of WebARSystem.
   * Creates a new instance if one doesn't exist.
   *
   * @returns The singleton WebARSystem instance
   */
  static init(engine) {
    return new _WebARSystem(engine);
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
  async readyForWebAR(requestButtonDom) {
    if (typeof window === "undefined") {
      throw new Error("This method works in Browser environment");
    }
    await ModuleManager.getInstance().loadModule("xr");
    const glw = this.__engine.webglResourceRepository.currentWebGLContextWrapper;
    if (glw == null) {
      throw new Error("WebGL Context is not ready yet.");
    }
    this.__oGlw = new Some(glw);
    const supported = await navigator.xr.isSessionSupported("immersive-ar");
    if (supported) {
      Logger.default.info("WebAR is supported.");
      if (requestButtonDom) {
        requestButtonDom.style.display = "block";
      } else {
        const paragraph = document.createElement("p");
        const anchor = document.createElement("a");
        anchor.setAttribute("id", "enter-ar");
        const enterVr = document.createTextNode("Enter AR");
        anchor.appendChild(enterVr);
        paragraph.appendChild(anchor);
        const canvas = glw.canvas;
        canvas.parentNode.insertBefore(paragraph, canvas);
        window.addEventListener("click", this.enterWebAR.bind(this));
      }
      this.__isReadyForWebAR = true;
    } else {
      throw new Error("WebAR is not supported in this environment.");
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
    callbackOnXrSessionStart = () => {
    },
    callbackOnXrSessionEnd = () => {
    }
  }) {
    const webglResourceRepository = this.__engine.webglResourceRepository;
    const glw = webglResourceRepository.currentWebGLContextWrapper;
    if (glw != null && this.__isReadyForWebAR) {
      const session = await navigator.xr.requestSession("immersive-vr");
      this.__oArSession = new Some(session);
      session.addEventListener("end", () => {
        glw.__gl.bindFramebuffer(glw.__gl.FRAMEBUFFER, null);
        this.__oArSession = new None();
        this.__oWebglLayer = new None();
        this.__oArViewerPose = new None();
        this.__oArReferenceSpace = new None();
        this.__spaceType = "local";
        this.__isReadyForWebAR = false;
        this.__requestedToEnterWebAR = false;
        this.__isWebARMode = false;
        this.__defaultPositionInLocalSpaceMode = defaultUserPositionInVR;
        Logger.default.info("XRSession ends.");
        this._cameraEntity.engine.stopRenderLoop();
        this._cameraEntity.engine.restartRenderLoop();
        callbackOnXrSessionEnd();
      });
      const referenceSpace = await session.requestReferenceSpace("local");
      this.__spaceType = "local";
      this.__defaultPositionInLocalSpaceMode = initialUserPosition != null ? initialUserPosition : defaultUserPositionInVR;
      this.__oArReferenceSpace = new Some(referenceSpace);
      this._cameraEntity.engine.stopRenderLoop();
      await this.__setupWebGLLayer(session, callbackOnXrSessionStart);
      this.__requestedToEnterWebAR = true;
      this._cameraEntity.engine.restartRenderLoop();
      Logger.default.warn("End of enterWebXR.");
      return;
    }
    Logger.default.error("WebGL context or WebXRSession is not ready yet.");
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
  async __setupWebGLLayer(xrSession, callbackOnXrSessionStart) {
    const gl = this.__oGlw.unwrapForce().getRawContext();
    if (gl != null) {
      await gl.makeXRCompatible();
      if (typeof window === "undefined") {
        throw new Error("This method works in Browser Environment");
      }
      this.__oWebglLayer = new Some(window.XRWebGLLayer(xrSession, gl));
      const webglLayer = this.__oWebglLayer.unwrapForce();
      xrSession.updateRenderState({
        baseLayer: webglLayer,
        depthNear: 0.1,
        depthFar: 1e4
      });
      const webglResourceRepository = this.__engine.webglResourceRepository;
      this.__canvasWidthForAR = webglLayer.framebufferWidth;
      this.__canvasHeightForAR = webglLayer.framebufferHeight;
      Logger.default.info(this.__canvasWidthForAR.toString());
      Logger.default.info(this.__canvasHeightForAR.toString());
      webglResourceRepository.resizeCanvas(this.__canvasWidthForAR, this.__canvasHeightForAR);
      this.__isWebARMode = true;
      callbackOnXrSessionStart();
    } else {
      Logger.default.error("WebGL context is not ready for WebXR.");
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
  __updateView(xrFrame) {
    this.__oArViewerPose = new Some(xrFrame.getViewerPose(this.__oArReferenceSpace.unwrapForce()));
    this.__setCameraInfoFromXRViews(this.__oArViewerPose.unwrapForce());
  }
  /**
   * Updates camera transform information based on XR viewer pose data.
   * Applies position, orientation, and scale transformations to the camera entity.
   *
   * @private
   * @param xrViewerPose - The XR viewer pose containing transform data
   */
  __setCameraInfoFromXRViews(xrViewerPose) {
    if (Is.not.exist(xrViewerPose)) {
      Logger.default.warn("xrViewerPose not exist");
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
    const m = MutableMatrix44.fromCopyFloat32ArrayColumnMajor(xrView == null ? void 0 : xrView.transform.matrix);
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
    const viewerTransform = this._cameraEntity.getTransform();
    viewerTransform.localPosition = Vector3.fromCopyArray([viewerTranslateScaledX, 0, viewerTranslateScaledZ]);
    viewerTransform.localScale = Vector3.fromCopyArray([scale, scale, scale]);
    viewerTransform.localEulerAngles = Vector3.fromCopyArray([0, this.__viewerAzimuthAngle.x, 0]);
    rotateMat.translateY = translate.y;
    rotateMat.translateX = translate.x - viewerTranslateX;
    rotateMat.translateZ = translate.z - viewerTranslateZ;
    rotateMat.translateY += xrViewerPos.y;
    rotateMat.translateX += xrViewerPos.x;
    rotateMat.translateZ += xrViewerPos.z;
    this._cameraEntity.getTransform().localMatrix = rotateMat;
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
  _preRender(_time, xrFrame) {
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
    }
    if (this.requestedToEnterWebAR) {
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
    var _a, _b;
    return (_b = (_a = this.__oArSession.unwrapOrUndefined()) == null ? void 0 : _a.renderState.baseLayer) == null ? void 0 : _b.framebuffer;
  }
};
export {
  WebARSystem
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3JjL3hyL1dlYkFSU3lzdGVtLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZW1wdHktZnVuY3Rpb24gKi9cbmltcG9ydCB7IGNyZWF0ZUNhbWVyYUVudGl0eSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29tcG9uZW50cy9DYW1lcmEvY3JlYXRlQ2FtZXJhRW50aXR5JztcbmltcG9ydCB0eXBlIHsgSUNhbWVyYUVudGl0eSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vaGVscGVycy9FbnRpdHlIZWxwZXInO1xuaW1wb3J0IHsgTXV0YWJsZU1hdHJpeDQ0IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9tYXRoL011dGFibGVNYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlUXVhdGVybmlvbiB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWF0aC9NdXRhYmxlUXVhdGVybmlvbic7XG5pbXBvcnQgeyBNdXRhYmxlU2NhbGFyIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9tYXRoL011dGFibGVTY2FsYXInO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjMgfSBmcm9tICcuLi9mb3VuZGF0aW9uL21hdGgvTXV0YWJsZVZlY3RvcjMnO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWF0aC9WZWN0b3IzJztcbmltcG9ydCB7IElzIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9taXNjL0lzJztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHsgTm9uZSwgdHlwZSBPcHRpb24sIFNvbWUgfSBmcm9tICcuLi9mb3VuZGF0aW9uL21pc2MvT3B0aW9uJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB7IE1vZHVsZU1hbmFnZXIgfSBmcm9tICcuLi9mb3VuZGF0aW9uL3N5c3RlbS9Nb2R1bGVNYW5hZ2VyJztcbmltcG9ydCB0eXBlIHsgV2ViR0xDb250ZXh0V3JhcHBlciB9IGZyb20gJy4uL3dlYmdsL1dlYkdMQ29udGV4dFdyYXBwZXInO1xuXG5jb25zdCBkZWZhdWx0VXNlclBvc2l0aW9uSW5WUiA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbMC4wLCAxLjEsIDBdKTtcbmRlY2xhcmUgY29uc3Qgd2luZG93OiBhbnk7XG5cbi8qKlxuICogV2ViQVIgKEF1Z21lbnRlZCBSZWFsaXR5KSBzeXN0ZW0gZm9yIG1hbmFnaW5nIFdlYlhSIEFSIHNlc3Npb25zIGFuZCBjYW1lcmEgb3BlcmF0aW9ucy5cbiAqIFRoaXMgc2luZ2xldG9uIGNsYXNzIHByb3ZpZGVzIGZ1bmN0aW9uYWxpdHkgdG8gaW5pdGlhbGl6ZSwgZW50ZXIsIGFuZCBtYW5hZ2UgV2ViQVIgc2Vzc2lvbnMsXG4gKiBoYW5kbGluZyBjYW1lcmEgcG9zaXRpb25pbmcsIHZpZXcgbWF0cmljZXMsIGFuZCByZW5kZXJpbmcgb3BlcmF0aW9ucyBmb3IgQVIgZXhwZXJpZW5jZXMuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IGFyU3lzdGVtID0gV2ViQVJTeXN0ZW0uZ2V0SW5zdGFuY2UoKTtcbiAqIGF3YWl0IGFyU3lzdGVtLnJlYWR5Rm9yV2ViQVIoYnV0dG9uRWxlbWVudCk7XG4gKiBhd2FpdCBhclN5c3RlbS5lbnRlcldlYkFSKHtcbiAqICAgY2FsbGJhY2tPblhyU2Vzc2lvblN0YXJ0OiAoKSA9PiBjb25zb2xlLmxvZygnQVIgc3RhcnRlZCcpLFxuICogICBjYWxsYmFja09uWHJTZXNzaW9uRW5kOiAoKSA9PiBjb25zb2xlLmxvZygnQVIgZW5kZWQnKVxuICogfSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIFdlYkFSU3lzdGVtIHtcbiAgcHJpdmF0ZSBzdGF0aWMgX19pbnN0YW5jZTogV2ViQVJTeXN0ZW07XG4gIHByaXZhdGUgX19vR2x3OiBPcHRpb248V2ViR0xDb250ZXh0V3JhcHBlcj4gPSBuZXcgTm9uZSgpO1xuICBwcml2YXRlIF9faXNSZWFkeUZvcldlYkFSID0gZmFsc2U7XG4gIHByaXZhdGUgX19vQXJTZXNzaW9uOiBPcHRpb248WFJTZXNzaW9uPiA9IG5ldyBOb25lKCk7XG4gIHByaXZhdGUgX19vV2ViZ2xMYXllcjogT3B0aW9uPFhSV2ViR0xMYXllcj4gPSBuZXcgTm9uZSgpO1xuICBwcml2YXRlIF9fc3BhY2VUeXBlOiAnbG9jYWwnIHwgJ2xvY2FsLWZsb29yJyA9ICdsb2NhbCc7XG4gIHByaXZhdGUgX19pc1dlYkFSTW9kZSA9IGZhbHNlO1xuICBwcml2YXRlIF9fcmVxdWVzdGVkVG9FbnRlcldlYkFSID0gZmFsc2U7XG4gIHByaXZhdGUgX19vQXJWaWV3ZXJQb3NlOiBPcHRpb248WFJWaWV3ZXJQb3NlPiA9IG5ldyBOb25lKCk7XG4gIHByaXZhdGUgX19vQXJSZWZlcmVuY2VTcGFjZTogT3B0aW9uPFhSUmVmZXJlbmNlU3BhY2U+ID0gbmV3IE5vbmUoKTtcbiAgcHJpdmF0ZSBfX2RlZmF1bHRQb3NpdGlvbkluTG9jYWxTcGFjZU1vZGUgPSBkZWZhdWx0VXNlclBvc2l0aW9uSW5WUjtcbiAgcHJpdmF0ZSBfX2NhbnZhc1dpZHRoRm9yQVIgPSAwO1xuICBwcml2YXRlIF9fY2FudmFzSGVpZ2h0Rm9yQVIgPSAwO1xuICBwcml2YXRlIF9jYW1lcmFFbnRpdHk6IElDYW1lcmFFbnRpdHk7XG4gIHByaXZhdGUgX19lbmdpbmU6IEVuZ2luZTtcbiAgcHJpdmF0ZSBfX3ZpZXdlclRyYW5zbGF0ZSA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBfX3ZpZXdlckF6aW11dGhBbmdsZSA9IE11dGFibGVTY2FsYXIuemVybygpO1xuICBwcml2YXRlIF9fdmlld2VyT3JpZW50YXRpb24gPSBNdXRhYmxlUXVhdGVybmlvbi5pZGVudGl0eSgpO1xuICBwcml2YXRlIF9fdmlld2VyU2NhbGUgPSBNdXRhYmxlVmVjdG9yMy5vbmUoKTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBXZWJBUlN5c3RlbSBpbnN0YW5jZS5cbiAgICogSW5pdGlhbGl6ZXMgdGhlIGNhbWVyYSBlbnRpdHkgd2l0aCBkZWZhdWx0IHNldHRpbmdzIGZvciBXZWJBUiBvcGVyYXRpb25zLlxuICAgKlxuICAgKiBAcHJpdmF0ZSBVc2UgZ2V0SW5zdGFuY2UoKSB0byBnZXQgdGhlIHNpbmdsZXRvbiBpbnN0YW5jZSBpbnN0ZWFkLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZW5naW5lOiBFbmdpbmUpIHtcbiAgICB0aGlzLl9fZW5naW5lID0gZW5naW5lO1xuICAgIHRoaXMuX2NhbWVyYUVudGl0eSA9IGNyZWF0ZUNhbWVyYUVudGl0eShlbmdpbmUsIGZhbHNlKTtcbiAgICB0aGlzLl9jYW1lcmFFbnRpdHkudHJ5VG9TZXRVbmlxdWVOYW1lKCdXZWJBUiBWaWV3ZXInLCB0cnVlKTtcbiAgICB0aGlzLl9jYW1lcmFFbnRpdHkudHJ5VG9TZXRUYWcoe1xuICAgICAgdGFnOiAndHlwZScsXG4gICAgICB2YWx1ZTogJ2JhY2tncm91bmQtYXNzZXRzJyxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzaW5nbGV0b24gaW5zdGFuY2Ugb2YgV2ViQVJTeXN0ZW0uXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2UgaWYgb25lIGRvZXNuJ3QgZXhpc3QuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBzaW5nbGV0b24gV2ViQVJTeXN0ZW0gaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBpbml0KGVuZ2luZTogRW5naW5lKTogV2ViQVJTeXN0ZW0ge1xuICAgIHJldHVybiBuZXcgV2ViQVJTeXN0ZW0oZW5naW5lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVwYXJlcyB0aGUgc3lzdGVtIGZvciBXZWJBUiBieSBjaGVja2luZyBkZXZpY2Ugc3VwcG9ydCBhbmQgc2V0dGluZyB1cCB0aGUgVUkuXG4gICAqIFRoaXMgbWV0aG9kIG11c3QgYmUgY2FsbGVkIGJlZm9yZSBlbnRlcmluZyBXZWJBUiBtb2RlLlxuICAgKlxuICAgKiBAcGFyYW0gcmVxdWVzdEJ1dHRvbkRvbSAtIFRoZSBIVE1MIGVsZW1lbnQgdG8gdXNlIGFzIHRoZSBBUiBlbnRyeSBidXR0b24uXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICBJZiBudWxsLCBhIGRlZmF1bHQgYnV0dG9uIHdpbGwgYmUgY3JlYXRlZC5cbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGFuIGVtcHR5IGFycmF5IG9uIHN1Y2Nlc3NcbiAgICogQHRocm93cyBFcnJvciBpZiBub3QgaW4gYnJvd3NlciBlbnZpcm9ubWVudCwgV2ViR0wgY29udGV4dCBpcyBub3QgcmVhZHksIG9yIFdlYkFSIGlzIG5vdCBzdXBwb3J0ZWRcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBidXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXItYnV0dG9uJyk7XG4gICAqIGF3YWl0IGFyU3lzdGVtLnJlYWR5Rm9yV2ViQVIoYnV0dG9uKTtcbiAgICogYGBgXG4gICAqL1xuICBhc3luYyByZWFkeUZvcldlYkFSKHJlcXVlc3RCdXR0b25Eb206IEhUTUxFbGVtZW50KSB7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoaXMgbWV0aG9kIHdvcmtzIGluIEJyb3dzZXIgZW52aXJvbm1lbnQnKTtcbiAgICB9XG5cbiAgICBhd2FpdCBNb2R1bGVNYW5hZ2VyLmdldEluc3RhbmNlKCkubG9hZE1vZHVsZSgneHInKTtcblxuICAgIGNvbnN0IGdsdyA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuY3VycmVudFdlYkdMQ29udGV4dFdyYXBwZXI7XG4gICAgaWYgKGdsdyA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1dlYkdMIENvbnRleHQgaXMgbm90IHJlYWR5IHlldC4nKTtcbiAgICB9XG4gICAgdGhpcy5fX29HbHcgPSBuZXcgU29tZShnbHcpO1xuICAgIGNvbnN0IHN1cHBvcnRlZCA9IGF3YWl0IG5hdmlnYXRvci54ciEuaXNTZXNzaW9uU3VwcG9ydGVkKCdpbW1lcnNpdmUtYXInKTtcbiAgICBpZiAoc3VwcG9ydGVkKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5pbmZvKCdXZWJBUiBpcyBzdXBwb3J0ZWQuJyk7XG4gICAgICBpZiAocmVxdWVzdEJ1dHRvbkRvbSkge1xuICAgICAgICByZXF1ZXN0QnV0dG9uRG9tLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcGFyYWdyYXBoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICAgICAgICBjb25zdCBhbmNob3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgIGFuY2hvci5zZXRBdHRyaWJ1dGUoJ2lkJywgJ2VudGVyLWFyJyk7XG4gICAgICAgIGNvbnN0IGVudGVyVnIgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnRW50ZXIgQVInKTtcblxuICAgICAgICBhbmNob3IuYXBwZW5kQ2hpbGQoZW50ZXJWcik7XG4gICAgICAgIHBhcmFncmFwaC5hcHBlbmRDaGlsZChhbmNob3IpO1xuXG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IGdsdy5jYW52YXM7XG4gICAgICAgIGNhbnZhcy5wYXJlbnROb2RlIS5pbnNlcnRCZWZvcmUocGFyYWdyYXBoLCBjYW52YXMpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmVudGVyV2ViQVIuYmluZCh0aGlzKSBhcyBhbnkpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9faXNSZWFkeUZvcldlYkFSID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdXZWJBUiBpcyBub3Qgc3VwcG9ydGVkIGluIHRoaXMgZW52aXJvbm1lbnQuJyk7XG4gICAgfVxuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbnRlcnMgV2ViQVIgbW9kZSBieSBjcmVhdGluZyBhbiBYUiBzZXNzaW9uIGFuZCBzZXR0aW5nIHVwIHRoZSBBUiBlbnZpcm9ubWVudC5cbiAgICogVGhpcyBtZXRob2QgaGFuZGxlcyBzZXNzaW9uIGluaXRpYWxpemF0aW9uLCByZWZlcmVuY2Ugc3BhY2Ugc2V0dXAsIGFuZCByZW5kZXIgbG9vcCBtYW5hZ2VtZW50LlxuICAgKlxuICAgKiBAcGFyYW0gcGFyYW1zIC0gQ29uZmlndXJhdGlvbiBvYmplY3QgZm9yIEFSIHNlc3Npb25cbiAgICogQHBhcmFtIHBhcmFtcy5pbml0aWFsVXNlclBvc2l0aW9uIC0gSW5pdGlhbCBwb3NpdGlvbiBvZiB0aGUgdXNlciBpbiB3b3JsZCBzcGFjZSBjb29yZGluYXRlc1xuICAgKiBAcGFyYW0gcGFyYW1zLmNhbGxiYWNrT25YclNlc3Npb25TdGFydCAtIENhbGxiYWNrIGZ1bmN0aW9uIGV4ZWN1dGVkIHdoZW4gQVIgc2Vzc2lvbiBzdGFydHNcbiAgICogQHBhcmFtIHBhcmFtcy5jYWxsYmFja09uWHJTZXNzaW9uRW5kIC0gQ2FsbGJhY2sgZnVuY3Rpb24gZXhlY3V0ZWQgd2hlbiBBUiBzZXNzaW9uIGVuZHNcbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gQVIgc2Vzc2lvbiBpcyBzdWNjZXNzZnVsbHkgc3RhcnRlZFxuICAgKiBAdGhyb3dzIEVycm9yIGlmIFdlYkdMIGNvbnRleHQgb3IgV2ViQVIgcmVhZGluZXNzIGlzIG5vdCBzYXRpc2ZpZWRcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBhd2FpdCBhclN5c3RlbS5lbnRlcldlYkFSKHtcbiAgICogICBpbml0aWFsVXNlclBvc2l0aW9uOiBWZWN0b3IzLmZyb21Db3B5QXJyYXkoWzAsIDAsIDBdKSxcbiAgICogICBjYWxsYmFja09uWHJTZXNzaW9uU3RhcnQ6ICgpID0+IGNvbnNvbGUubG9nKCdBUiBzZXNzaW9uIHN0YXJ0ZWQnKSxcbiAgICogICBjYWxsYmFja09uWHJTZXNzaW9uRW5kOiAoKSA9PiBjb25zb2xlLmxvZygnQVIgc2Vzc2lvbiBlbmRlZCcpXG4gICAqIH0pO1xuICAgKiBgYGBcbiAgICovXG4gIGFzeW5jIGVudGVyV2ViQVIoe1xuICAgIGluaXRpYWxVc2VyUG9zaXRpb24sXG4gICAgY2FsbGJhY2tPblhyU2Vzc2lvblN0YXJ0ID0gKCkgPT4ge30sXG4gICAgY2FsbGJhY2tPblhyU2Vzc2lvbkVuZCA9ICgpID0+IHt9LFxuICB9OiB7XG4gICAgaW5pdGlhbFVzZXJQb3NpdGlvbj86IFZlY3RvcjM7XG4gICAgY2FsbGJhY2tPblhyU2Vzc2lvblN0YXJ0OiAoKSA9PiB2b2lkO1xuICAgIGNhbGxiYWNrT25YclNlc3Npb25FbmQ6ICgpID0+IHZvaWQ7XG4gIH0pIHtcbiAgICBjb25zdCB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgY29uc3QgZ2x3ID0gd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuY3VycmVudFdlYkdMQ29udGV4dFdyYXBwZXI7XG5cbiAgICBpZiAoZ2x3ICE9IG51bGwgJiYgdGhpcy5fX2lzUmVhZHlGb3JXZWJBUikge1xuICAgICAgY29uc3Qgc2Vzc2lvbiA9IChhd2FpdCBuYXZpZ2F0b3IueHIhLnJlcXVlc3RTZXNzaW9uKCdpbW1lcnNpdmUtdnInKSkgYXMgWFJTZXNzaW9uO1xuICAgICAgdGhpcy5fX29BclNlc3Npb24gPSBuZXcgU29tZShzZXNzaW9uKTtcblxuICAgICAgc2Vzc2lvbi5hZGRFdmVudExpc3RlbmVyKCdlbmQnLCAoKSA9PiB7XG4gICAgICAgIGdsdy5fX2dsLmJpbmRGcmFtZWJ1ZmZlcihnbHcuX19nbC5GUkFNRUJVRkZFUiwgbnVsbCk7XG4gICAgICAgIHRoaXMuX19vQXJTZXNzaW9uID0gbmV3IE5vbmUoKTtcbiAgICAgICAgdGhpcy5fX29XZWJnbExheWVyID0gbmV3IE5vbmUoKTtcbiAgICAgICAgdGhpcy5fX29BclZpZXdlclBvc2UgPSBuZXcgTm9uZSgpO1xuICAgICAgICB0aGlzLl9fb0FyUmVmZXJlbmNlU3BhY2UgPSBuZXcgTm9uZSgpO1xuICAgICAgICB0aGlzLl9fc3BhY2VUeXBlID0gJ2xvY2FsJztcbiAgICAgICAgdGhpcy5fX2lzUmVhZHlGb3JXZWJBUiA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9fcmVxdWVzdGVkVG9FbnRlcldlYkFSID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX19pc1dlYkFSTW9kZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9fZGVmYXVsdFBvc2l0aW9uSW5Mb2NhbFNwYWNlTW9kZSA9IGRlZmF1bHRVc2VyUG9zaXRpb25JblZSO1xuICAgICAgICBMb2dnZXIuZGVmYXVsdC5pbmZvKCdYUlNlc3Npb24gZW5kcy4nKTtcbiAgICAgICAgdGhpcy5fY2FtZXJhRW50aXR5LmVuZ2luZS5zdG9wUmVuZGVyTG9vcCgpO1xuICAgICAgICB0aGlzLl9jYW1lcmFFbnRpdHkuZW5naW5lLnJlc3RhcnRSZW5kZXJMb29wKCk7XG4gICAgICAgIGNhbGxiYWNrT25YclNlc3Npb25FbmQoKTtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZWZlcmVuY2VTcGFjZSA9IGF3YWl0IHNlc3Npb24ucmVxdWVzdFJlZmVyZW5jZVNwYWNlKCdsb2NhbCcpO1xuICAgICAgdGhpcy5fX3NwYWNlVHlwZSA9ICdsb2NhbCc7XG4gICAgICB0aGlzLl9fZGVmYXVsdFBvc2l0aW9uSW5Mb2NhbFNwYWNlTW9kZSA9IGluaXRpYWxVc2VyUG9zaXRpb24gPz8gZGVmYXVsdFVzZXJQb3NpdGlvbkluVlI7XG4gICAgICB0aGlzLl9fb0FyUmVmZXJlbmNlU3BhY2UgPSBuZXcgU29tZShyZWZlcmVuY2VTcGFjZSk7XG4gICAgICB0aGlzLl9jYW1lcmFFbnRpdHkuZW5naW5lLnN0b3BSZW5kZXJMb29wKCk7XG4gICAgICBhd2FpdCB0aGlzLl9fc2V0dXBXZWJHTExheWVyKHNlc3Npb24sIGNhbGxiYWNrT25YclNlc3Npb25TdGFydCk7XG4gICAgICB0aGlzLl9fcmVxdWVzdGVkVG9FbnRlcldlYkFSID0gdHJ1ZTtcbiAgICAgIHRoaXMuX2NhbWVyYUVudGl0eS5lbmdpbmUucmVzdGFydFJlbmRlckxvb3AoKTtcbiAgICAgIExvZ2dlci5kZWZhdWx0Lndhcm4oJ0VuZCBvZiBlbnRlcldlYlhSLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignV2ViR0wgY29udGV4dCBvciBXZWJYUlNlc3Npb24gaXMgbm90IHJlYWR5IHlldC4nKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCB0aGUgV2ViR0wgbGF5ZXIgZm9yIHRoZSBYUiBzZXNzaW9uLlxuICAgKiBDb25maWd1cmVzIHRoZSByZW5kZXJpbmcgY29udGV4dCwgY3JlYXRlcyB0aGUgWFIgV2ViR0wgbGF5ZXIsIGFuZCB1cGRhdGVzIHJlbmRlciBzdGF0ZS5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHhyU2Vzc2lvbiAtIFRoZSBhY3RpdmUgWFIgc2Vzc2lvblxuICAgKiBAcGFyYW0gY2FsbGJhY2tPblhyU2Vzc2lvblN0YXJ0IC0gQ2FsbGJhY2sgdG8gZXhlY3V0ZSB3aGVuIHNldHVwIGlzIGNvbXBsZXRlXG4gICAqIEB0aHJvd3MgRXJyb3IgaWYgbm90IGluIGJyb3dzZXIgZW52aXJvbm1lbnQgb3IgV2ViR0wgY29udGV4dCBpcyBub3QgcmVhZHlcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgX19zZXR1cFdlYkdMTGF5ZXIoeHJTZXNzaW9uOiBYUlNlc3Npb24sIGNhbGxiYWNrT25YclNlc3Npb25TdGFydDogKCkgPT4gdm9pZCkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5fX29HbHcudW53cmFwRm9yY2UoKS5nZXRSYXdDb250ZXh0KCk7XG5cbiAgICBpZiAoZ2wgIT0gbnVsbCkge1xuICAgICAgLy8gTWFrZSBzdXJlIHRoZSBjYW52YXMgY29udGV4dCB3ZSB3YW50IHRvIHVzZSBpcyBjb21wYXRpYmxlIHdpdGggdGhlIGN1cnJlbnQgeHIgZGV2aWNlLlxuICAgICAgYXdhaXQgKGdsIGFzIGFueSkubWFrZVhSQ29tcGF0aWJsZSgpO1xuICAgICAgLy8gVGhlIGNvbnRlbnQgdGhhdCB3aWxsIGJlIHNob3duIG9uIHRoZSBkZXZpY2UgaXMgZGVmaW5lZCBieSB0aGUgc2Vzc2lvbidzXG4gICAgICAvLyBiYXNlTGF5ZXIuXG5cbiAgICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoaXMgbWV0aG9kIHdvcmtzIGluIEJyb3dzZXIgRW52aXJvbm1lbnQnKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fX29XZWJnbExheWVyID0gbmV3IFNvbWUod2luZG93LlhSV2ViR0xMYXllcih4clNlc3Npb24sIGdsKSBhcyBYUldlYkdMTGF5ZXIpO1xuICAgICAgY29uc3Qgd2ViZ2xMYXllciA9IHRoaXMuX19vV2ViZ2xMYXllci51bndyYXBGb3JjZSgpO1xuICAgICAgeHJTZXNzaW9uLnVwZGF0ZVJlbmRlclN0YXRlKHtcbiAgICAgICAgYmFzZUxheWVyOiB3ZWJnbExheWVyLFxuICAgICAgICBkZXB0aE5lYXI6IDAuMSxcbiAgICAgICAgZGVwdGhGYXI6IDEwMDAwLFxuICAgICAgfSk7XG4gICAgICBjb25zdCB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgICB0aGlzLl9fY2FudmFzV2lkdGhGb3JBUiA9IHdlYmdsTGF5ZXIuZnJhbWVidWZmZXJXaWR0aDtcbiAgICAgIHRoaXMuX19jYW52YXNIZWlnaHRGb3JBUiA9IHdlYmdsTGF5ZXIuZnJhbWVidWZmZXJIZWlnaHQ7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5pbmZvKHRoaXMuX19jYW52YXNXaWR0aEZvckFSLnRvU3RyaW5nKCkpO1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuaW5mbyh0aGlzLl9fY2FudmFzSGVpZ2h0Rm9yQVIudG9TdHJpbmcoKSk7XG4gICAgICB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5yZXNpemVDYW52YXModGhpcy5fX2NhbnZhc1dpZHRoRm9yQVIsIHRoaXMuX19jYW52YXNIZWlnaHRGb3JBUik7XG4gICAgICB0aGlzLl9faXNXZWJBUk1vZGUgPSB0cnVlO1xuICAgICAgY2FsbGJhY2tPblhyU2Vzc2lvblN0YXJ0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdXZWJHTCBjb250ZXh0IGlzIG5vdCByZWFkeSBmb3IgV2ViWFIuJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV4aXRzIFdlYkFSIG1vZGUgYnkgZW5kaW5nIHRoZSBjdXJyZW50IFhSIHNlc3Npb24uXG4gICAqIFRoaXMgd2lsbCB0cmlnZ2VyIHRoZSBzZXNzaW9uIGVuZCBldmVudCBoYW5kbGVycyBhbmQgY2xlYW51cC5cbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIHNlc3Npb24gaXMgc3VjY2Vzc2Z1bGx5IGVuZGVkXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogYXdhaXQgYXJTeXN0ZW0uZXhpdFdlYkFSKCk7XG4gICAqIGBgYFxuICAgKi9cbiAgYXN5bmMgZXhpdFdlYkFSKCkge1xuICAgIGlmICh0aGlzLl9fb0FyU2Vzc2lvbi5oYXMoKSkge1xuICAgICAgLy8gRW5kIHRoZSBYUiBzZXNzaW9uIG5vdy5cbiAgICAgIGF3YWl0IHRoaXMuX19vQXJTZXNzaW9uLmdldCgpLmVuZCgpO1xuICAgIH1cbiAgfVxuXG4gIC8vLyBHZXR0ZXIgTWV0aG9kc1xuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjYW52YXMgd2lkdGggY29uZmlndXJlZCBmb3IgQVIgcmVuZGVyaW5nLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgd2lkdGggb2YgdGhlIEFSIGNhbnZhcyBpbiBwaXhlbHNcbiAgICovXG4gIGdldENhbnZhc1dpZHRoRm9yVnIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19jYW52YXNXaWR0aEZvckFSO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNhbnZhcyBoZWlnaHQgY29uZmlndXJlZCBmb3IgQVIgcmVuZGVyaW5nLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgaGVpZ2h0IG9mIHRoZSBBUiBjYW52YXMgaW4gcGl4ZWxzXG4gICAqL1xuICBnZXRDYW52YXNIZWlnaHRGb3JWcigpIHtcbiAgICByZXR1cm4gdGhpcy5fX2NhbnZhc0hlaWdodEZvckFSO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgdmlldyBtYXRyaXggZnJvbSB0aGUgY2FtZXJhIGVudGl0eS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGN1cnJlbnQgdmlldyBtYXRyaXggZm9yIHJlbmRlcmluZ1xuICAgKi9cbiAgZ2V0IHZpZXdNYXRyaXgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NhbWVyYUVudGl0eS5nZXRDYW1lcmEoKS52aWV3TWF0cml4O1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIHZpZXdlciBwb3NlIGFuZCBjYW1lcmEgaW5mb3JtYXRpb24gZnJvbSB0aGUgWFIgZnJhbWUuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB4ckZyYW1lIC0gVGhlIGN1cnJlbnQgWFIgZnJhbWUgY29udGFpbmluZyBwb3NlIGluZm9ybWF0aW9uXG4gICAqL1xuICBwcml2YXRlIF9fdXBkYXRlVmlldyh4ckZyYW1lOiBYUkZyYW1lKSB7XG4gICAgdGhpcy5fX29BclZpZXdlclBvc2UgPSBuZXcgU29tZSh4ckZyYW1lLmdldFZpZXdlclBvc2UodGhpcy5fX29BclJlZmVyZW5jZVNwYWNlLnVud3JhcEZvcmNlKCkpISk7XG4gICAgdGhpcy5fX3NldENhbWVyYUluZm9Gcm9tWFJWaWV3cyh0aGlzLl9fb0FyVmlld2VyUG9zZS51bndyYXBGb3JjZSgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIGNhbWVyYSB0cmFuc2Zvcm0gaW5mb3JtYXRpb24gYmFzZWQgb24gWFIgdmlld2VyIHBvc2UgZGF0YS5cbiAgICogQXBwbGllcyBwb3NpdGlvbiwgb3JpZW50YXRpb24sIGFuZCBzY2FsZSB0cmFuc2Zvcm1hdGlvbnMgdG8gdGhlIGNhbWVyYSBlbnRpdHkuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB4clZpZXdlclBvc2UgLSBUaGUgWFIgdmlld2VyIHBvc2UgY29udGFpbmluZyB0cmFuc2Zvcm0gZGF0YVxuICAgKi9cbiAgcHJpdmF0ZSBfX3NldENhbWVyYUluZm9Gcm9tWFJWaWV3cyh4clZpZXdlclBvc2U6IFhSVmlld2VyUG9zZSkge1xuICAgIGlmIChJcy5ub3QuZXhpc3QoeHJWaWV3ZXJQb3NlKSkge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQud2FybigneHJWaWV3ZXJQb3NlIG5vdCBleGlzdCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB4clZpZXcgPSB4clZpZXdlclBvc2Uudmlld3NbMF07XG4gICAgaWYgKElzLm5vdC5leGlzdCh4clZpZXcpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgb3JpZW50YXRpb24gPSB4clZpZXdlclBvc2UudHJhbnNmb3JtLm9yaWVudGF0aW9uO1xuICAgIHRoaXMuX192aWV3ZXJPcmllbnRhdGlvbi54ID0gb3JpZW50YXRpb24ueDtcbiAgICB0aGlzLl9fdmlld2VyT3JpZW50YXRpb24ueSA9IG9yaWVudGF0aW9uLnk7XG4gICAgdGhpcy5fX3ZpZXdlck9yaWVudGF0aW9uLnogPSBvcmllbnRhdGlvbi56O1xuICAgIHRoaXMuX192aWV3ZXJPcmllbnRhdGlvbi53ID0gb3JpZW50YXRpb24udztcblxuICAgIGNvbnN0IG0gPSBNdXRhYmxlTWF0cml4NDQuZnJvbUNvcHlGbG9hdDMyQXJyYXlDb2x1bW5NYWpvcih4clZpZXc/LnRyYW5zZm9ybS5tYXRyaXggYXMgRmxvYXQzMkFycmF5KTtcblxuICAgIGNvbnN0IHJvdGF0ZU1hdCA9IG07XG5cbiAgICBjb25zdCBzY2FsZSA9IHRoaXMuX192aWV3ZXJTY2FsZS54O1xuICAgIGNvbnN0IHBvcyA9IHhyVmlldy50cmFuc2Zvcm0ucG9zaXRpb247XG4gICAgY29uc3QgdHJhbnNsYXRlU2NhbGVkID0gTXV0YWJsZVZlY3RvcjMuYWRkKHRoaXMuX19kZWZhdWx0UG9zaXRpb25JbkxvY2FsU3BhY2VNb2RlLCB0aGlzLl9fdmlld2VyVHJhbnNsYXRlKTtcbiAgICBjb25zdCB4clZpZXdlclBvcyA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbcG9zLngsIHBvcy55LCBwb3Muel0pO1xuICAgIGNvbnN0IHRyYW5zbGF0ZSA9IE11dGFibGVWZWN0b3IzLmFkZCh0aGlzLl9fZGVmYXVsdFBvc2l0aW9uSW5Mb2NhbFNwYWNlTW9kZSwgdGhpcy5fX3ZpZXdlclRyYW5zbGF0ZSkuYWRkKFxuICAgICAgeHJWaWV3ZXJQb3NcbiAgICApO1xuICAgIGNvbnN0IHZpZXdlclRyYW5zbGF0ZVNjYWxlZFggPSB0cmFuc2xhdGVTY2FsZWQueDtcbiAgICBjb25zdCB2aWV3ZXJUcmFuc2xhdGVTY2FsZWRaID0gdHJhbnNsYXRlU2NhbGVkLno7XG4gICAgY29uc3Qgdmlld2VyVHJhbnNsYXRlWCA9IHRyYW5zbGF0ZS54O1xuICAgIGNvbnN0IHZpZXdlclRyYW5zbGF0ZVogPSB0cmFuc2xhdGUuejtcbiAgICBjb25zdCB2aWV3ZXJUcmFuc2Zvcm0gPSB0aGlzLl9jYW1lcmFFbnRpdHkuZ2V0VHJhbnNmb3JtKCkhO1xuICAgIHZpZXdlclRyYW5zZm9ybS5sb2NhbFBvc2l0aW9uID0gVmVjdG9yMy5mcm9tQ29weUFycmF5KFt2aWV3ZXJUcmFuc2xhdGVTY2FsZWRYLCAwLCB2aWV3ZXJUcmFuc2xhdGVTY2FsZWRaXSk7XG4gICAgdmlld2VyVHJhbnNmb3JtLmxvY2FsU2NhbGUgPSBWZWN0b3IzLmZyb21Db3B5QXJyYXkoW3NjYWxlLCBzY2FsZSwgc2NhbGVdKTtcbiAgICB2aWV3ZXJUcmFuc2Zvcm0ubG9jYWxFdWxlckFuZ2xlcyA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbMCwgdGhpcy5fX3ZpZXdlckF6aW11dGhBbmdsZS54LCAwXSk7XG5cbiAgICByb3RhdGVNYXQudHJhbnNsYXRlWSA9IHRyYW5zbGF0ZS55O1xuICAgIHJvdGF0ZU1hdC50cmFuc2xhdGVYID0gdHJhbnNsYXRlLnggLSB2aWV3ZXJUcmFuc2xhdGVYO1xuICAgIHJvdGF0ZU1hdC50cmFuc2xhdGVaID0gdHJhbnNsYXRlLnogLSB2aWV3ZXJUcmFuc2xhdGVaO1xuICAgIHJvdGF0ZU1hdC50cmFuc2xhdGVZICs9IHhyVmlld2VyUG9zLnk7XG4gICAgcm90YXRlTWF0LnRyYW5zbGF0ZVggKz0geHJWaWV3ZXJQb3MueDtcbiAgICByb3RhdGVNYXQudHJhbnNsYXRlWiArPSB4clZpZXdlclBvcy56O1xuXG4gICAgdGhpcy5fY2FtZXJhRW50aXR5LmdldFRyYW5zZm9ybSgpIS5sb2NhbE1hdHJpeCA9IHJvdGF0ZU1hdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IHByb2plY3Rpb24gbWF0cml4IGZyb20gdGhlIFhSIHZpZXcuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBwcm9qZWN0aW9uIG1hdHJpeCBmb3IgdGhlIGN1cnJlbnQgQVIgdmlldywgb3IgaWRlbnRpdHkgbWF0cml4IGlmIG5vIHZpZXcgZXhpc3RzXG4gICAqL1xuICBnZXQgcHJvamVjdGlvbk1hdHJpeCgpIHtcbiAgICBjb25zdCB4clZpZXcgPSB0aGlzLl9fb0FyVmlld2VyUG9zZS51bndyYXBGb3JjZSgpLnZpZXdzWzBdO1xuICAgIHJldHVybiBNdXRhYmxlTWF0cml4NDQuZnJvbUNvcHlGbG9hdDMyQXJyYXlDb2x1bW5NYWpvcihcbiAgICAgIElzLmV4aXN0KHhyVmlldykgPyB4clZpZXcucHJvamVjdGlvbk1hdHJpeCA6IChNdXRhYmxlTWF0cml4NDQuaWRlbnRpdHkoKS5fdiBhcyBGbG9hdDMyQXJyYXkpXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmUtcmVuZGVyIHByb2Nlc3NpbmcgZm9yIEFSIGZyYW1lcy5cbiAgICogVXBkYXRlcyB2aWV3IGluZm9ybWF0aW9uIGlmIGluIEFSIG1vZGUgYW5kIGZyYW1lIGRhdGEgaXMgYXZhaWxhYmxlLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICogQHBhcmFtIHRpbWUgLSBUaGUgY3VycmVudCB0aW1lIHRpbWVzdGFtcFxuICAgKiBAcGFyYW0geHJGcmFtZSAtIFRoZSBYUiBmcmFtZSBvYmplY3QgY29udGFpbmluZyBwb3NlIGFuZCB2aWV3IGRhdGFcbiAgICovXG4gIF9wcmVSZW5kZXIoX3RpbWU6IG51bWJlciwgeHJGcmFtZTogWFJGcmFtZSkge1xuICAgIGlmICh0aGlzLmlzV2ViQVJNb2RlICYmIHRoaXMuX19yZXF1ZXN0ZWRUb0VudGVyV2ViQVIgJiYgeHJGcmFtZSAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9fdXBkYXRlVmlldyh4ckZyYW1lKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUG9zdC1yZW5kZXIgcHJvY2Vzc2luZyBmb3IgQVIgZnJhbWVzLlxuICAgKiBIYW5kbGVzIGZyYW1lYnVmZmVyIG9wZXJhdGlvbnMgYW5kIHN0YXRlIG1hbmFnZW1lbnQgYWZ0ZXIgcmVuZGVyaW5nLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9wb3N0UmVuZGVyKCkge1xuICAgIGlmICh0aGlzLmlzV2ViQVJNb2RlKSB7XG4gICAgICAvLyBnbD8uYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcbiAgICB9XG4gICAgaWYgKHRoaXMucmVxdWVzdGVkVG9FbnRlcldlYkFSKSB7XG4gICAgICAvLyB0aGlzLl9faXNXZWJYUk1vZGUgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgd2hldGhlciB0aGUgc3lzdGVtIGlzIGN1cnJlbnRseSBpbiBXZWJBUiBtb2RlLlxuICAgKlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIGN1cnJlbnRseSBpbiBBUiBtb2RlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGdldCBpc1dlYkFSTW9kZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2lzV2ViQVJNb2RlO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyB3aGV0aGVyIHRoZSBzeXN0ZW0gaXMgcmVhZHkgZm9yIFdlYkFSIG9wZXJhdGlvbnMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRydWUgaWYgcmVhZHkgZm9yIEFSLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGdldCBpc1JlYWR5Rm9yV2ViQVIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19pc1JlYWR5Rm9yV2ViQVI7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIHdoZXRoZXIgYSByZXF1ZXN0IHRvIGVudGVyIFdlYkFSIGhhcyBiZWVuIG1hZGUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRydWUgaWYgQVIgZW50cnkgd2FzIHJlcXVlc3RlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXQgcmVxdWVzdGVkVG9FbnRlcldlYkFSKCkge1xuICAgIHJldHVybiB0aGlzLl9fcmVxdWVzdGVkVG9FbnRlcldlYkFSO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgQVIgc2Vzc2lvbiBpbnN0YW5jZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGFjdGl2ZSBYUiBzZXNzaW9uIG9yIHVuZGVmaW5lZCBpZiBubyBzZXNzaW9uIGV4aXN0c1xuICAgKi9cbiAgZ2V0IGFyU2Vzc2lvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fX29BclNlc3Npb24udW53cmFwT3JVbmRlZmluZWQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IGZyYW1lYnVmZmVyIGZvciBBUiByZW5kZXJpbmcuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBmcmFtZWJ1ZmZlciBmcm9tIHRoZSBiYXNlIGxheWVyLCBvciB1bmRlZmluZWQgaWYgbm90IGF2YWlsYWJsZVxuICAgKi9cbiAgZ2V0IGZyYW1lYnVmZmVyKCkge1xuICAgIHJldHVybiB0aGlzLl9fb0FyU2Vzc2lvbi51bndyYXBPclVuZGVmaW5lZCgpPy5yZW5kZXJTdGF0ZS5iYXNlTGF5ZXI/LmZyYW1lYnVmZmVyO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUywwQkFBMEI7QUFFbkMsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyx5QkFBeUI7QUFDbEMsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsVUFBVTtBQUNuQixTQUFTLGNBQWM7QUFDdkIsU0FBUyxNQUFtQixZQUFZO0FBRXhDLFNBQVMscUJBQXFCO0FBRzlCLElBQU0sMEJBQTBCLFFBQVEsY0FBYyxDQUFDLEdBQUssS0FBSyxDQUFDLENBQUM7QUFrQjVELElBQU0sY0FBTixNQUFNLGFBQVk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQTJCdkIsWUFBWSxRQUFnQjtBQXpCNUIsU0FBUSxTQUFzQyxJQUFJLEtBQUs7QUFDdkQsU0FBUSxvQkFBb0I7QUFDNUIsU0FBUSxlQUFrQyxJQUFJLEtBQUs7QUFDbkQsU0FBUSxnQkFBc0MsSUFBSSxLQUFLO0FBQ3ZELFNBQVEsY0FBdUM7QUFDL0MsU0FBUSxnQkFBZ0I7QUFDeEIsU0FBUSwwQkFBMEI7QUFDbEMsU0FBUSxrQkFBd0MsSUFBSSxLQUFLO0FBQ3pELFNBQVEsc0JBQWdELElBQUksS0FBSztBQUNqRSxTQUFRLG9DQUFvQztBQUM1QyxTQUFRLHFCQUFxQjtBQUM3QixTQUFRLHNCQUFzQjtBQUc5QixTQUFRLG9CQUFvQixlQUFlLEtBQUs7QUFDaEQsU0FBUSx1QkFBdUIsY0FBYyxLQUFLO0FBQ2xELFNBQVEs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
