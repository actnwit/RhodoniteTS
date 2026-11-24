// src/xr/WebXRSystem.ts
import { createCameraEntity } from "../foundation/components/Camera/createCameraEntity.js";
import { createGroupEntity } from "../foundation/components/SceneGraph/createGroupEntity.js";
import { ProcessApproach } from "../foundation/definitions/ProcessApproach.js";
import { MutableMatrix44 } from "../foundation/math/MutableMatrix44.js";
import { MutableQuaternion } from "../foundation/math/MutableQuaternion.js";
import { MutableScalar } from "../foundation/math/MutableScalar.js";
import { MutableVector3 } from "../foundation/math/MutableVector3.js";
import { Vector3 } from "../foundation/math/Vector3.js";
import { Vector4 } from "../foundation/math/Vector4.js";
import { Is } from "../foundation/misc/Is.js";
import { Logger } from "../foundation/misc/Logger.js";
import { ModuleManager } from "../foundation/system/ModuleManager.js";
import { createMotionController, getMotionController, updateGamePad, updateMotionControllerModel } from "./WebXRInput.js";
var defaultUserPositionInVR = Vector3.fromCopyArray([0, 1.1, 0]);
var WebXRSystem = class _WebXRSystem {
  /**
   * Private constructor for singleton pattern.
   * Initializes the viewer entity and left/right camera entities for stereo rendering.
   * Sets up the scene graph hierarchy with cameras as children of the viewer entity.
   */
  constructor(engine) {
    this.zK = false;
    this.fK = "local";
    this.tK = false;
    this.vK = false;
    this.ZJ = defaultUserPositionInVR;
    this.mK = 0;
    this.nK = 0;
    this.wK = [];
    this.xK = [];
    this.gK = MutableVector3.zero();
    this.hK = MutableScalar.zero();
    this.aK = MutableQuaternion.identity();
    this.iK = MutableVector3.one();
    this.HK = -1;
    this.IK = -1;
    this.c = engine;
    this.rK = createGroupEntity(engine);
    this.rK.tryToSetUniqueName("WebXR Viewer", true);
    this.rK.tryToSetTag({
      tag: "type",
      value: "background-assets"
    });
    this.oK = createCameraEntity(engine, false);
    this.oK.tryToSetUniqueName("WebXR Left Camera", true);
    this.oK.tryToSetTag({
      tag: "type",
      value: "background-assets"
    });
    this.oK.getCamera()._xrLeft = true;
    this.pK = createCameraEntity(engine, false);
    this.pK.tryToSetUniqueName("WebXR Right Camera", true);
    this.pK.tryToSetTag({
      tag: "type",
      value: "background-assets"
    });
    this.pK.getCamera()._xrRight = true;
    this.rK.getSceneGraph().addChild(this.oK.getSceneGraph());
    this.rK.getSceneGraph().addChild(this.pK.getSceneGraph());
  }
  /// Public Methods
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
  async readyForWebXR(requestButtonDom, basePath) {
    if (typeof window === "undefined") {
      throw new Error("This method works in Browser environment");
    }
    this.DK = basePath;
    await ModuleManager.getInstance().loadModule("xr");
    const isWebGPU = this.c.engineState.currentProcessApproach === ProcessApproach.WebGPU;
    if (isWebGPU) {
      const webgpuDeviceWrapper = this.c.webGpuResourceRepository.getWebGpuDeviceWrapper();
      if (webgpuDeviceWrapper == null) {
        Logger.default.error("WebGPU Device Wrapper is not ready yet.");
        return [];
      }
    } else {
      const glw = this.c.webglResourceRepository.currentWebGLContextWrapper;
      if (glw == null) {
        Logger.default.error("WebGL Context is not ready yet.");
        return [];
      }
      this.WC = glw;
    }
    const supported = await navigator.xr.isSessionSupported("immersive-vr");
    if (supported) {
      if (requestButtonDom) {
        requestButtonDom.style.display = "block";
      } else {
        const paragraph = document.createElement("p");
        const anchor = document.createElement("a");
        anchor.setAttribute("id", "enter-vr");
        const enterVr = document.createTextNode("Enter VR");
        anchor.appendChild(enterVr);
        paragraph.appendChild(anchor);
        if (isWebGPU) {
          const canvas = this.c.webGpuResourceRepository.getWebGpuDeviceWrapper().canvas;
          canvas.parentNode.insertBefore(paragraph, canvas);
          window.addEventListener("click", this.enterWebXR.bind(this));
        } else {
          const canvas = this.WC.canvas;
          canvas.parentNode.insertBefore(paragraph, canvas);
          window.addEventListener("click", this.enterWebXR.bind(this));
        }
      }
      this.vK = true;
    } else {
      throw new Error("WebXR is not supported in this environment.");
    }
    return [];
  }
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
  async enterWebXR({
    initialUserPosition,
    callbackOnXrSessionStart = () => {
    },
    callbackOnXrSessionEnd = () => {
    },
    profilePriorities = []
  }) {
    const cgApiResourceRepository = this.c.cgApiResourceRepository;
    if (cgApiResourceRepository != null && this.vK) {
      let referenceSpace;
      const isWebGPU = this.c.engineState.currentProcessApproach === ProcessApproach.WebGPU;
      const requiredFeatures = isWebGPU ? ["webgpu"] : [];
      const xrSession = await navigator.xr.requestSession("immersive-vr", { requiredFeatures });
      xrSession.addEventListener("end", () => {
        if (!isWebGPU) {
          const glw = cgApiResourceRepository.currentWebGLContextWrapper;
          glw.jC.bindFramebuffer(glw.jC.FRAMEBUFFER, null);
        }
        this.sK = void 0;
        this.yK = void 0;
        this.qK = void 0;
        this.uK = void 0;
        this.fK = "local";
        this.vK = false;
        this.tK = false;
        this.xK.length = 0;
        this.CK(false);
        this.c.materialRepository._makeShaderInvalidateToAllMaterials();
        this.ZJ = defaultUserPositionInVR;
        Logger.default.info("XRSession ends.");
        this.c.stopRenderLoop();
        this.c.restartRenderLoop();
        callbackOnXrSessionEnd();
      });
      const promiseFn = (resolve) => {
        xrSession.addEventListener("inputsourceschange", (e) => {
          this.EK(e, resolve, profilePriorities);
        });
      };
      const promise = new Promise(promiseFn);
      referenceSpace = await xrSession.requestReferenceSpace("local");
      this.fK = "local";
      this.ZJ = initialUserPosition != null ? initialUserPosition : defaultUserPositionInVR;
      this.uK = referenceSpace;
      this.sK = xrSession;
      this.c.stopRenderLoop();
      if (isWebGPU) {
        const webgpuResourceRepository = this.c.webGpuResourceRepository;
        const webgpuDeviceWrapper = webgpuResourceRepository.getWebGpuDeviceWrapper();
        const webgpuDevice = webgpuDeviceWrapper.gpuDevice;
        const xrGpuBinding = new window.XRGPUBinding(xrSession, webgpuDevice);
        this.AK = xrGpuBinding;
        const projectionLayer = xrGpuBinding.createProjectionLayer({
          colorFormat: xrGpuBinding.getPreferredColorFormat(),
          depthStencilFormat: "depth32float"
        });
        this.BK = projectionLayer;
        await this.FK(xrSession, projectionLayer, callbackOnXrSessionStart);
      } else {
        await this.jK(xrSession, callbackOnXrSessionStart);
      }
      this.tK = true;
      this.c.restartRenderLoop();
      Logger.default.warn("End of enterWebXR.");
      return promise;
    }
    Logger.default.error("WebGL/WebGPU context or WebXRSession is not ready yet.");
    return void 0;
  }
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
  async exitWebXR() {
    if (this.sK != null) {
      await this.sK.end();
    }
  }
  /// Getter Methods
  /**
   * Gets the canvas width configured for VR rendering.
   *
   * @returns The width of the VR canvas in pixels.
   */
  getCanvasWidthForVr() {
    return this.mK;
  }
  /**
   * Gets the canvas height configured for VR rendering.
   *
   * @returns The height of the VR canvas in pixels.
   */
  getCanvasHeightForVr() {
    return this.nK;
  }
  /**
   * Gets all currently tracked controller entities.
   *
   * @returns Array of scene graph entities representing VR controllers.
   */
  getControllerEntities() {
    return this.wK;
  }
  /// Accessors
  /**
   * Gets the view matrix for the left eye camera.
   *
   * @returns The view matrix for left eye rendering.
   */
  get leftViewMatrix() {
    return this.oK.getCamera().viewMatrix;
  }
  /**
   * Gets the view matrix for the right eye camera.
   *
   * @returns The view matrix for right eye rendering.
   */
  get rightViewMatrix() {
    return this.pK.getCamera().viewMatrix;
  }
  /**
   * Gets the projection matrix for the left eye.
   * Derived from the XR system's view information.
   *
   * @returns The projection matrix for left eye rendering.
   */
  get leftProjectionMatrix() {
    var _a;
    const xrViewLeft = (_a = this.qK) == null ? void 0 : _a.views[0];
    return MutableMatrix44.fromCopyFloat32ArrayColumnMajor(
      Is.exist(xrViewLeft) ? xrViewLeft.projectionMatrix : MutableMatrix44.identity()._v
    );
  }
  /**
   * Gets the projection matrix for the right eye.
   * Derived from the XR system's view information.
   *
   * @returns The projection matrix for right eye rendering.
   */
  get rightProjectionMatrix() {
    var _a;
    const xrViewRight = (_a = this.qK) == null ? void 0 : _a.views[1];
    return MutableMatrix44.fromCopyFloat32ArrayColumnMajor(
      Is.exist(xrViewRight) ? xrViewRight.projectionMatrix : MutableMatrix44.identity()._v
    );
  }
  /**
   * Gets the WebXR framebuffer for rendering.
   *
   * @returns The WebGL framebuffer provided by the XR system, or undefined if not available.
   */
  get framebuffer() {
    var _a, _b;
    return (_b = (_a = this.sK) == null ? void 0 : _a.renderState.baseLayer) == null ? void 0 : _b.framebuffer;
  }
  /**
   * Checks if multiview rendering is supported and enabled.
   *
   * @returns True if multiview VR rendering is supported.
   */
  isMultiView() {
    const cgApiResourceRepository = this.c.cgApiResourceRepository;
    return cgApiResourceRepository.isSupportMultiViewVRRendering(this.c);
  }
  /**
   * Checks if a WebXR session has been requested.
   *
   * @returns True if WebXR session entry has been requested.
   */
  get requestedToEnterWebXR() {
    return this.tK;
  }
  /**
   * Gets the current XR session object.
   *
   * @returns The active XRSession, or undefined if no session is active.
   */
  get xrSession() {
    return this.sK;
  }
  /**
   * Legacy property for backward compatibility.
   *
   * @deprecated Use requestedToEnterWebXR instead.
   * @returns True if WebXR session entry has been requested.
   */
  get requestedToEnterWebVR() {
    return this.tK;
  }
  /**
   * Checks if currently in WebXR rendering mode.
   *
   * @returns True if WebXR mode is active.
   */
  get isWebXRMode() {
    return this.zK;
  }
  /**
   * Sets the WebXR mode state for this system and the WebGL context.
   *
   * @param mode - Whether WebXR mode should be enabled.
   */
  CK(mode) {
    this.zK = mode;
    if (this.WC != null) {
      this.WC._isWebXRMode = mode;
    }
  }
  /**
   * Checks if the system is ready to enter WebXR.
   *
   * @returns True if WebXR initialization is complete and ready for session start.
   */
  get isReadyForWebXR() {
    return this.vK;
  }
  /// Public Static Methods
  /**
   * Gets the singleton instance of WebXRSystem.
   * Creates a new instance if one doesn't exist.
   *
   * @returns The singleton WebXRSystem instance.
   */
  static init(engine) {
    return new _WebXRSystem(engine);
  }
  /// Friend methods
  /**
   * Gets the view matrix for the specified eye.
   *
   * @internal
   * @param index - Eye index (0: left, 1: right).
   * @returns The view matrix for the specified eye.
   */
  _getViewMatrixAt(index) {
    if (index === 0) {
      return this.leftViewMatrix;
    }
    return this.rightViewMatrix;
  }
  /**
   * Gets the projection matrix for the specified eye.
   *
   * @internal
   * @param index - Eye index (0: left, 1: right).
   * @returns The projection matrix for the specified eye.
   */
  _getProjectMatrixAt(index) {
    if (index === 0) {
      return this.leftProjectionMatrix;
    }
    return this.rightProjectionMatrix;
  }
  /**
   * Gets the viewport configuration for the specified eye.
   *
   * @internal
   * @param index - Eye index (0: left, 1: right).
   * @returns The viewport vector (x, y, width, height) for the specified eye.
   */
  _getViewportAt(index) {
    if (index === 0) {
      return this._getLeftViewport();
    }
    return this._getRightViewport();
  }
  /**
   * Gets the viewport configuration for the left eye.
   *
   * @internal
   * @returns The viewport vector (x, y, width, height) for the left eye.
   */
  _getLeftViewport() {
    return Vector4.fromCopyArray([0, 0, this.mK / 2, this.nK]);
  }
  /**
   * Gets the viewport configuration for the right eye.
   * Accounts for multiview rendering mode differences.
   *
   * @internal
   * @returns The viewport vector (x, y, width, height) for the right eye.
   */
  _getRightViewport() {
    if (this.isMultiView()) {
      return Vector4.fromCopyArray([0, 0, this.mK / 2, this.nK]);
    }
    return Vector4.fromCopyArray([
      this.mK / 2,
      0,
      this.mK / 2,
      this.nK
    ]);
  }
  /**
   * Gets the world position of the specified VR camera.
   * Combines XR pose data with user position offset and viewer transformations.
   *
   * @internal
   * @param displayIdx - Eye index (0: left, 1: right).
   * @returns The world position of the VR camera.
   */
  _getCameraWorldPositionAt(displayIdx) {
    var _a;
    const xrView = (_a = this.qK) == null ? void 0 : _a.views[displayIdx];
    if (Is.exist(xrView)) {
      const pos = xrView.transform.position;
      const def = this.ZJ;
      const translate = this.gK;
      const viewerHeadPos = Vector3.add(Vector3.fromCopyArray([pos.x, pos.y, pos.z]), def);
      return Vector3.fromCopyArray([
        (viewerHeadPos.x + translate.x) * this.iK.x,
        (viewerHeadPos.y + translate.y) * this.iK.y,
        (viewerHeadPos.z + translate.z) * this.iK.z
      ]);
    }
    return this.ZJ;
  }
  /**
   * Gets the component SID (System ID) for the specified camera.
   *
   * @internal
   * @param index - Eye index (0: left, 1: right).
   * @returns The SID of the CameraComponent for the specified eye.
   */
  _getCameraComponentSIDAt(index) {
    if (index === 0) {
      return this.oK.getCamera().componentSID;
    }
    return this.pK.getCamera().componentSID;
  }
  /**
   * Gets the camera component for the specified eye.
   *
   * @internal
   * @param index - Eye index (0: left, 1: right).
   * @returns The CameraComponent for the specified eye.
   */
  _getCameraComponentAt(index) {
    if (index === 0) {
      return this.oK.getCamera();
    }
    return this.pK.getCamera();
  }
  /**
   * Performs pre-rendering updates for WebXR.
   * Updates view matrices, input sources, and gamepad states.
   * Called once per frame before rendering begins.
   *
   * @internal
   * @param time - Current time in milliseconds.
   * @param xrFrame - The XRFrame object for this rendering frame.
   */
  _preRender(time, xrFrame) {
    if (this.isWebXRMode && this.tK && xrFrame != null) {
      this.kK(xrFrame);
      this.GK(xrFrame);
      updateGamePad(time, xrFrame, {
        viewerTranslate: this.gK,
        viewerScale: this.iK,
        viewerOrientation: this.aK,
        viewerAzimuthAngle: this.hK
      });
    }
  }
  /**
   * Resets all viewer transformation parameters to their default values.
   * Useful for resetting user position and orientation to origin.
   */
  resetViewerTransform() {
    this.gK = MutableVector3.zero();
    this.hK = MutableScalar.zero();
    this.aK = MutableQuaternion.identity();
    this.iK = MutableVector3.one();
  }
  /**
   * Performs post-rendering cleanup for WebXR.
   * Currently handles multiview framebuffer operations when enabled.
   * Called once per frame after rendering is complete.
   *
   * @internal
   */
  _postRender() {
    if (this.zK) {
    }
  }
  /// Private Methods
  /**
   * Handles changes in XR input sources (controllers).
   * Creates motion controller entities for newly added input sources.
   *
   * @private
   * @param event - XRInputSourceChangeEvent containing added/removed input sources.
   * @param resolve - Promise resolve function to return controller entities.
   * @param profilePriorities - Array of controller profile names in priority order.
   */
  async EK(event, resolve, profilePriorities) {
    this.xK.length = 0;
    for (const xrInputSource of event.added) {
      this.xK.push(xrInputSource);
      const controller = await createMotionController(
        this.c,
        xrInputSource,
        this.DK,
        profilePriorities
      );
      if (Is.exist(controller)) {
        this.wK.push(controller);
        this.rK.getSceneGraph().addChild(controller.getSceneGraph());
      }
    }
    resolve(this.wK);
  }
  /**
   * Updates camera information from XR viewer pose data.
   * Calculates and applies transformations for left and right eye cameras based on XR pose.
   *
   * @private
   * @param xrViewerPose - The XRViewerPose containing view and transform data.
   */
  lK(xrViewerPose) {
    if (Is.not.exist(xrViewerPose)) {
      Logger.default.warn("xrViewerPose not exist");
      return;
    }
    const xrViewLeft = xrViewerPose.views[0];
    const xrViewRight = xrViewerPose.views[1];
    if (Is.not.exist(xrViewLeft) || Is.not.exist(xrViewRight)) {
      return;
    }
    const orientation = xrViewerPose.transform.orientation;
    this.aK.x = orientation.x;
    this.aK.y = orientation.y;
    this.aK.z = orientation.z;
    this.aK.w = orientation.w;
    const lm = MutableMatrix44.fromCopyFloat32ArrayColumnMajor(xrViewLeft == null ? void 0 : xrViewLeft.transform.matrix);
    const rm = MutableMatrix44.fromCopyFloat32ArrayColumnMajor(xrViewRight == null ? void 0 : xrViewRight.transform.matrix);
    const rotateMatLeft = lm;
    const rotateMatRight = rm;
    const scale = this.iK.x;
    const posLeft = xrViewLeft.transform.position;
    const posRight = xrViewRight.transform.position;
    const translateLeftScaled = MutableVector3.add(this.ZJ, this.gK);
    const translateRightScaled = MutableVector3.add(this.ZJ, this.gK);
    const xrViewerPosLeft = Vector3.fromCopyArray([posLeft.x, posLeft.y, posLeft.z]);
    const xrViewerPosRight = Vector3.fromCopyArray([posRight.x, posRight.y, posRight.z]);
    const translateLeft = MutableVector3.add(this.ZJ, this.gK).add(
      xrViewerPosLeft
    );
    const translateRight = MutableVector3.add(this.ZJ, this.gK).add(
      xrViewerPosRight
    );
    const viewerTranslateScaledX = (translateLeftScaled.x + translateRightScaled.x) / 2;
    const viewerTranslateScaledZ = (translateLeftScaled.z + translateRightScaled.z) / 2;
    const viewerTranslateX = (translateLeft.x + translateRight.x) / 2;
    const viewerTranslateZ = (translateLeft.z + translateRight.z) / 2;
    const viewerTransform = this.rK.getTransform();
    viewerTransform.localPosition = Vector3.fromCopyArray([viewerTranslateScaledX, 0, viewerTranslateScaledZ]);
    viewerTransform.localScale = Vector3.fromCopyArray([scale, scale, scale]);
    viewerTransform.localEulerAngles = Vector3.fromCopyArray([0, this.hK.x, 0]);
    rotateMatLeft.translateY = translateLeft.y;
    rotateMatLeft.translateX = translateLeft.x - viewerTranslateX;
    rotateMatLeft.translateZ = translateLeft.z - viewerTranslateZ;
    rotateMatLeft.translateY += xrViewerPosLeft.y;
    rotateMatLeft.translateX += xrViewerPosLeft.x;
    rotateMatLeft.translateZ += xrViewerPosLeft.z;
    rotateMatRight.translateY = translateRight.y;
    rotateMatRight.translateX = translateRight.x - viewerTranslateX;
    rotateMatRight.translateZ = translateRight.z - viewerTranslateZ;
    rotateMatRight.translateY += xrViewerPosRight.y;
    rotateMatRight.translateX += xrViewerPosRight.x;
    rotateMatRight.translateZ += xrViewerPosRight.z;
    this.oK.getTransform().localMatrix = rotateMatLeft;
    this.pK.getTransform().localMatrix = rotateMatRight;
  }
  /**
   * Sets up the WebGL layer for XR rendering.
   * Makes the WebGL context XR-compatible and configures the XR session's base layer.
   *
   * @private
   * @param xrSession - The XRSession to configure.
   * @param callbackOnXrSessionStart - Callback to execute when setup is complete.
   */
  async jK(xrSession, callbackOnXrSessionStart) {
    var _a;
    const gl = (_a = this.WC) == null ? void 0 : _a.getRawContextAsWebGL2();
    if (gl != null) {
      await gl.makeXRCompatible();
      if (typeof window === "undefined") {
        throw new Error("This method works in Browser environment");
      }
      this.yK = new window.XRWebGLLayer(xrSession, gl);
      const webglLayer = this.yK;
      xrSession.updateRenderState({
        baseLayer: webglLayer,
        depthNear: 0.01,
        depthFar: 1e3
      });
      const webglResourceRepository = this.c.webglResourceRepository;
      this.mK = webglLayer.framebufferWidth;
      this.nK = webglLayer.framebufferHeight;
      Logger.default.info(this.mK.toString());
      Logger.default.info(this.nK.toString());
      this.c.materialRepository._makeShaderInvalidateToAllMaterials();
      webglResourceRepository.resizeCanvas(this.mK, this.nK);
      this.CK(true);
      callbackOnXrSessionStart();
    } else {
      Logger.default.error("WebGL context is not ready for WebXR.");
    }
  }
  async FK(xrSession, projectionLayer, callbackOnXrSessionStart) {
    var _a, _b;
    xrSession.updateRenderState({ layers: [projectionLayer] });
    const webgpuResourceRepository = this.c.webGpuResourceRepository;
    const webgpuDeviceWrapper = webgpuResourceRepository.getWebGpuDeviceWrapper();
    const canvas = webgpuDeviceWrapper.canvas;
    const projectionLayerTyped = projectionLayer;
    let resolvedWidth = (_a = projectionLayerTyped == null ? void 0 : projectionLayerTyped.textureWidth) != null ? _a : 0;
    let resolvedHeight = (_b = projectionLayerTyped == null ? void 0 : projectionLayerTyped.textureHeight) != null ? _b : 0;
    if (resolvedWidth <= 0 || resolvedHeight <= 0) {
      const [currentWidth, currentHeight] = this.c.getCanvasSize();
      resolvedWidth = currentWidth;
      resolvedHeight = currentHeight;
    }
    if (resolvedWidth <= 0 || resolvedHeight <= 0) {
      resolvedWidth = canvas.width;
      resolvedHeight = canvas.height;
    }
    if (resolvedWidth > 0 && resolvedHeight > 0) {
      this.mK = resolvedWidth;
      this.nK = resolvedHeight;
      webgpuResourceRepository.resizeCanvas(resolvedWidth, resolvedHeight);
    } else {
      Logger.default.warn(
        "Unable to resolve XR canvas size during WebGPU layer setup. Deferring resize until first frame."
      );
    }
    this.c.materialRepository._makeShaderInvalidateToAllMaterials();
    this.CK(true);
    callbackOnXrSessionStart();
  }
  /**
   * Updates the viewer pose from the current XR frame.
   * Retrieves the current viewer pose and updates camera transformations.
   *
   * @private
   * @param xrFrame - The current XRFrame containing pose data.
   */
  kK(xrFrame) {
    var _a, _b, _c, _d;
    this.qK = xrFrame.getViewerPose(this.uK);
    this.lK(this.qK);
    const isWebGPU = this.c.engineState.currentProcessApproach === ProcessApproach.WebGPU;
    if (isWebGPU) {
      const view = this.qK.views[0];
      const subImage = this.AK.getViewSubImage(this.BK, view);
      const vp = subImage.viewport;
      const resolvedWidth = (_b = (_a = subImage.textureWidth) != null ? _a : vp == null ? void 0 : vp.width) != null ? _b : 0;
      const resolvedHeight = (_d = (_c = subImage.textureHeight) != null ? _c : vp == null ? void 0 : vp.height) != null ? _d : 0;
      if (resolvedWidth > 0 && resolvedHeight > 0) {
        this.mK = resolvedWidth;
        this.nK = resolvedHeight;
        const webgpuResourceRepository = this.c.webGpuResourceRepository;
        webgpuResourceRepository.resizeCanvas(this.mK, this.nK);
      } else {
        Logger.default.warn("XRWebGPU subImage returned zero-sized extent. Skipping canvas resize for this frame.");
      }
      this.c.engineState.xrPoseWebGPU = this.qK;
      this.c.engineState.xrGpuBinding = this.AK;
      this.c.engineState.xrProjectionLayerWebGPU = this.BK;
    }
  }
  /**
   * Updates the transforms and states of XR input sources (controllers).
   * Applies XR pose data to controller entities and updates their visual models.
   *
   * @private
   * @param xrFrame - The current XRFrame containing input source pose data.
   */
  GK(xrFrame) {
    this.xK.forEach((input, i) => {
      if (Is.exist(input.gripSpace)) {
        const xrPose = xrFrame.getPose(input.gripSpace, this.uK);
        if (Is.exist(xrPose)) {
          const hand = this.wK[i];
          if (Is.exist(hand)) {
            const handWorldMatrix = MutableMatrix44.fromCopyFloat32ArrayColumnMajor(xrPose.transform.matrix);
            const rotateMat = MutableMatrix44.fromCopyMatrix44(handWorldMatrix);
            rotateMat.translateY += this.ZJ.y;
            rotateMat.translateY += this.gK.y;
            hand.getTransform().localMatrix = rotateMat;
            const motionController = getMotionController(input);
            if (Is.exist(motionController)) {
              updateMotionControllerModel(hand, motionController);
            } else {
              Logger.default.warn("motionController not found");
            }
          }
        }
      }
    });
  }
};
export {
  WebXRSystem
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3JjL3hyL1dlYlhSU3lzdGVtLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvLy8gPHJlZmVyZW5jZSB0eXBlcz1cIndlYnhyXCIgLz5cbmltcG9ydCB7IGNyZWF0ZUNhbWVyYUVudGl0eSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29tcG9uZW50cy9DYW1lcmEvY3JlYXRlQ2FtZXJhRW50aXR5JztcbmltcG9ydCB7IGNyZWF0ZUdyb3VwRW50aXR5IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb21wb25lbnRzL1NjZW5lR3JhcGgvY3JlYXRlR3JvdXBFbnRpdHknO1xuaW1wb3J0IHR5cGUgeyBJRW50aXR5IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb3JlL0VudGl0eSc7XG5pbXBvcnQgeyBQcm9jZXNzQXBwcm9hY2ggfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1Byb2Nlc3NBcHByb2FjaCc7XG5pbXBvcnQgdHlwZSB7IElDYW1lcmFFbnRpdHksIElTY2VuZUdyYXBoRW50aXR5IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9oZWxwZXJzL0VudGl0eUhlbHBlcic7XG5pbXBvcnQgeyBNdXRhYmxlTWF0cml4NDQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL21hdGgvTXV0YWJsZU1hdHJpeDQ0JztcbmltcG9ydCB7IE11dGFibGVRdWF0ZXJuaW9uIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9tYXRoL011dGFibGVRdWF0ZXJuaW9uJztcbmltcG9ydCB7IE11dGFibGVTY2FsYXIgfSBmcm9tICcuLi9mb3VuZGF0aW9uL21hdGgvTXV0YWJsZVNjYWxhcic7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMyB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWF0aC9NdXRhYmxlVmVjdG9yMyc7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9tYXRoL1ZlY3RvcjMnO1xuaW1wb3J0IHsgVmVjdG9yNCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWF0aC9WZWN0b3I0JztcbmltcG9ydCB7IElzIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9taXNjL0lzJztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi9mb3VuZGF0aW9uL3N5c3RlbS9FbmdpbmUnO1xuaW1wb3J0IHsgTW9kdWxlTWFuYWdlciB9IGZyb20gJy4uL2ZvdW5kYXRpb24vc3lzdGVtL01vZHVsZU1hbmFnZXInO1xuaW1wb3J0IHR5cGUgeyBJbmRleCB9IGZyb20gJy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB0eXBlIHsgV2ViR0xDb250ZXh0V3JhcHBlciB9IGZyb20gJy4uL3dlYmdsL1dlYkdMQ29udGV4dFdyYXBwZXInO1xuaW1wb3J0IHR5cGUgeyBXZWJHTFJlc291cmNlUmVwb3NpdG9yeSB9IGZyb20gJy4uL3dlYmdsL1dlYkdMUmVzb3VyY2VSZXBvc2l0b3J5JztcbmltcG9ydCB0eXBlIHsgV2ViR0xTdGVyZW9VdGlsIH0gZnJvbSAnLi4vd2ViZ2wvV2ViR0xTdGVyZW9VdGlsJztcbmltcG9ydCB7IGNyZWF0ZU1vdGlvbkNvbnRyb2xsZXIsIGdldE1vdGlvbkNvbnRyb2xsZXIsIHVwZGF0ZUdhbWVQYWQsIHVwZGF0ZU1vdGlvbkNvbnRyb2xsZXJNb2RlbCB9IGZyb20gJy4vV2ViWFJJbnB1dCc7XG5cbmRlY2xhcmUgY29uc3Qgd2luZG93OiBhbnk7XG5jb25zdCBkZWZhdWx0VXNlclBvc2l0aW9uSW5WUiA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbMC4wLCAxLjEsIDBdKTtcblxuLyoqXG4gKiBXZWJYUlN5c3RlbSBjbGFzcyBtYW5hZ2VzIFdlYlhSIHNlc3Npb24gYW5kIHJlbmRlcmluZyBmb3IgdmlydHVhbCByZWFsaXR5IGV4cGVyaWVuY2VzLlxuICogVGhpcyBzaW5nbGV0b24gY2xhc3MgaGFuZGxlcyBXZWJYUiBzZXNzaW9uIGxpZmVjeWNsZSwgY2FtZXJhIHNldHVwIGZvciBzdGVyZW8gcmVuZGVyaW5nLFxuICogaW5wdXQgc291cmNlIG1hbmFnZW1lbnQsIGFuZCBjb29yZGluYXRlIHNwYWNlIHRyYW5zZm9ybWF0aW9ucyBmb3IgVlIgYXBwbGljYXRpb25zLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb25zdCB3ZWJYUlN5c3RlbSA9IFdlYlhSU3lzdGVtLmdldEluc3RhbmNlKCk7XG4gKiBhd2FpdCB3ZWJYUlN5c3RlbS5yZWFkeUZvcldlYlhSKHJlcXVlc3RCdXR0b24sICcvYXNzZXRzLycpO1xuICogY29uc3QgY29udHJvbGxlcnMgPSBhd2FpdCB3ZWJYUlN5c3RlbS5lbnRlcldlYlhSKHtcbiAqICAgaW5pdGlhbFVzZXJQb3NpdGlvbjogVmVjdG9yMy5mcm9tQ29weUFycmF5KFswLCAxLjYsIDBdKSxcbiAqICAgY2FsbGJhY2tPblhyU2Vzc2lvblN0YXJ0OiAoKSA9PiBjb25zb2xlLmxvZygnVlIgc3RhcnRlZCcpLFxuICogICBjYWxsYmFja09uWHJTZXNzaW9uRW5kOiAoKSA9PiBjb25zb2xlLmxvZygnVlIgZW5kZWQnKSxcbiAqICAgcHJvZmlsZVByaW9yaXRpZXM6IFsnb2N1bHVzLXRvdWNoJywgJ2dlbmVyaWMtdHJpZ2dlciddXG4gKiB9KTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgV2ViWFJTeXN0ZW0ge1xuICBwcml2YXRlIF9fZW5naW5lOiBFbmdpbmU7XG4gIHByaXZhdGUgX194clNlc3Npb24/OiBYUlNlc3Npb247XG4gIHByaXZhdGUgX194clJlZmVyZW5jZVNwYWNlPzogWFJSZWZlcmVuY2VTcGFjZTtcbiAgcHJpdmF0ZSBfX3dlYmdsTGF5ZXI/OiBYUldlYkdMTGF5ZXI7XG4gIHByaXZhdGUgX19nbHc/OiBXZWJHTENvbnRleHRXcmFwcGVyO1xuICBwcml2YXRlIF9feHJWaWV3ZXJQb3NlPzogWFJWaWV3ZXJQb3NlIHwgbnVsbDtcbiAgcHJpdmF0ZSBfX2lzV2ViWFJNb2RlID0gZmFsc2U7XG4gIHByaXZhdGUgX19zcGFjZVR5cGU6IFhSUmVmZXJlbmNlU3BhY2VUeXBlID0gJ2xvY2FsJztcbiAgcHJpdmF0ZSBfX3JlcXVlc3RlZFRvRW50ZXJXZWJYUiA9IGZhbHNlO1xuICBwcml2YXRlIF9faXNSZWFkeUZvcldlYlhSID0gZmFsc2U7XG4gIHByaXZhdGUgX19kZWZhdWx0UG9zaXRpb25JbkxvY2FsU3BhY2VNb2RlID0gZGVmYXVsdFVzZXJQb3NpdGlvbkluVlI7XG4gIHByaXZhdGUgX19jYW52YXNXaWR0aEZvclZSID0gMDtcbiAgcHJpdmF0ZSBfX2NhbnZhc0hlaWdodEZvclZSID0gMDtcbiAgcHJpdmF0ZSBfX3ZpZXdlckVudGl0eTogSVNjZW5lR3JhcGhFbnRpdHk7XG4gIHByaXZhdGUgX19sZWZ0Q2FtZXJhRW50aXR5OiBJQ2FtZXJhRW50aXR5O1xuICBwcml2YXRlIF9fcmlnaHRDYW1lcmFFbnRpdHk6IElDYW1lcmFFbnRpdHk7XG4gIHByaXZhdGUgX19iYXNlUGF0aD86IHN0cmluZztcbiAgcHJpdmF0ZSBfX2NvbnRyb2xsZXJFbnRpdGllczogSVNjZW5lR3JhcGhFbnRpdHlbXSA9IFtdO1xuICBwcml2YXRlIF9feHJJbnB1dFNvdXJjZXM6IFhSSW5wdXRTb3VyY2VbXSA9IFtdO1xuICBwcml2YXRlIF9fdmlld2VyVHJhbnNsYXRlID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIF9fdmlld2VyQXppbXV0aEFuZ2xlID0gTXV0YWJsZVNjYWxhci56ZXJvKCk7XG4gIHByaXZhdGUgX192aWV3ZXJPcmllbnRhdGlvbiA9IE11dGFibGVRdWF0ZXJuaW9uLmlkZW50aXR5KCk7XG4gIHByaXZhdGUgX192aWV3ZXJTY2FsZSA9IE11dGFibGVWZWN0b3IzLm9uZSgpO1xuICBwcml2YXRlIF9fbXVsdGl2aWV3RnJhbWVidWZmZXJIYW5kbGUgPSAtMTtcbiAgcHJpdmF0ZSBfX211bHRpdmlld0NvbG9yVGV4dHVyZUhhbmRsZSA9IC0xO1xuICBwcml2YXRlIF9fd2ViZ2xTdGVyZW9VdGlsPzogV2ViR0xTdGVyZW9VdGlsO1xuICBwcml2YXRlIF9feHJHcHVCaW5kaW5nPzogYW55O1xuICBwcml2YXRlIF9feHJQcm9qZWN0aW9uTGF5ZXJXZWJHUFU/OiBYUkxheWVyO1xuICAvKipcbiAgICogUHJpdmF0ZSBjb25zdHJ1Y3RvciBmb3Igc2luZ2xldG9uIHBhdHRlcm4uXG4gICAqIEluaXRpYWxpemVzIHRoZSB2aWV3ZXIgZW50aXR5IGFuZCBsZWZ0L3JpZ2h0IGNhbWVyYSBlbnRpdGllcyBmb3Igc3RlcmVvIHJlbmRlcmluZy5cbiAgICogU2V0cyB1cCB0aGUgc2NlbmUgZ3JhcGggaGllcmFyY2h5IHdpdGggY2FtZXJhcyBhcyBjaGlsZHJlbiBvZiB0aGUgdmlld2VyIGVudGl0eS5cbiAgICovXG4gIHByaXZhdGUgY29uc3RydWN0b3IoZW5naW5lOiBFbmdpbmUpIHtcbiAgICB0aGlzLl9fZW5naW5lID0gZW5naW5lO1xuICAgIHRoaXMuX192aWV3ZXJFbnRpdHkgPSBjcmVhdGVHcm91cEVudGl0eShlbmdpbmUpO1xuICAgIHRoaXMuX192aWV3ZXJFbnRpdHkudHJ5VG9TZXRVbmlxdWVOYW1lKCdXZWJYUiBWaWV3ZXInLCB0cnVlKTtcbiAgICB0aGlzLl9fdmlld2VyRW50aXR5LnRyeVRvU2V0VGFnKHtcbiAgICAgIHRhZzogJ3R5cGUnLFxuICAgICAgdmFsdWU6ICdiYWNrZ3JvdW5kLWFzc2V0cycsXG4gICAgfSk7XG5cbiAgICB0aGlzLl9fbGVmdENhbWVyYUVudGl0eSA9IGNyZWF0ZUNhbWVyYUVudGl0eShlbmdpbmUsIGZhbHNlKTtcbiAgICB0aGlzLl9fbGVmdENhbWVyYUVudGl0eS50cnlUb1NldFVuaXF1ZU5hbWUoJ1dlYlhSIExlZnQgQ2FtZXJhJywgdHJ1ZSk7XG4gICAgdGhpcy5fX2xlZnRDYW1lcmFFbnRpdHkudHJ5VG9TZXRUYWcoe1xuICAgICAgdGFnOiAndHlwZScsXG4gICAgICB2YWx1ZTogJ2JhY2tncm91bmQtYXNzZXRzJyxcbiAgICB9KTtcbiAgICB0aGlzLl9fbGVmdENhbWVyYUVudGl0eS5nZXRDYW1lcmEoKS5feHJMZWZ0ID0gdHJ1ZTtcblxuICAgIHRoaXMuX19yaWdodENhbWVyYUVudGl0eSA9IGNyZWF0ZUNhbWVyYUVudGl0eShlbmdpbmUsIGZhbHNlKTtcbiAgICB0aGlzLl9fcmlnaHRDYW1lcmFFbnRpdHkudHJ5VG9TZXRVbmlxdWVOYW1lKCdXZWJYUiBSaWdodCBDYW1lcmEnLCB0cnVlKTtcbiAgICB0aGlzLl9fcmlnaHRDYW1lcmFFbnRpdHkudHJ5VG9TZXRUYWcoe1xuICAgICAgdGFnOiAndHlwZScsXG4gICAgICB2YWx1ZTogJ2JhY2tncm91bmQtYXNzZXRzJyxcbiAgICB9KTtcbiAgICB0aGlzLl9fcmlnaHRDYW1lcmFFbnRpdHkuZ2V0Q2FtZXJhKCkuX3hyUmlnaHQgPSB0cnVlO1xuXG4gICAgdGhpcy5fX3ZpZXdlckVudGl0eS5nZXRTY2VuZUdyYXBoKCkuYWRkQ2hpbGQodGhpcy5fX2xlZnRDYW1lcmFFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpKTtcbiAgICB0aGlzLl9fdmlld2VyRW50aXR5LmdldFNjZW5lR3JhcGgoKS5hZGRDaGlsZCh0aGlzLl9fcmlnaHRDYW1lcmFFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpKTtcbiAgfVxuXG4gIC8vLyBQdWJsaWMgTWV0aG9kc1xuXG4gIC8qKlxuICAgKiBQcmVwYXJlcyB0aGUgV2ViWFIgc3lzdGVtIGZvciBWUiBzZXNzaW9uIGluaXRpYWxpemF0aW9uLlxuICAgKiBDaGVja3MgZm9yIFdlYlhSIHN1cHBvcnQsIGxvYWRzIHJlcXVpcmVkIG1vZHVsZXMsIGFuZCBzZXRzIHVwIHRoZSBlbnRyeSBwb2ludC5cbiAgICpcbiAgICogQHBhcmFtIHJlcXVlc3RCdXR0b25Eb20gLSBIVE1MIGVsZW1lbnQgdG8gc2VydmUgYXMgdGhlIFZSIGVudHJ5IGJ1dHRvbi4gSWYgbnVsbCwgY3JlYXRlcyBhIGRlZmF1bHQgYnV0dG9uLlxuICAgKiBAcGFyYW0gYmFzZVBhdGggLSBCYXNlIHBhdGggZm9yIGxvYWRpbmcgY29udHJvbGxlciBtb2RlbHMgYW5kIGFzc2V0cy5cbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGFuIGVtcHR5IGFycmF5IG9uIHN1Y2Nlc3MuXG4gICAqIEB0aHJvd3Mge0Vycm9yfSBXaGVuIG5vdCBydW5uaW5nIGluIGEgYnJvd3NlciBlbnZpcm9ubWVudCBvciBXZWJYUiBpcyBub3Qgc3VwcG9ydGVkLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IGVudGVyQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2VudGVyLXZyLWJ1dHRvbicpO1xuICAgKiBhd2FpdCB3ZWJYUlN5c3RlbS5yZWFkeUZvcldlYlhSKGVudGVyQnV0dG9uLCAnL2Fzc2V0cy9jb250cm9sbGVycy8nKTtcbiAgICogYGBgXG4gICAqL1xuICBhc3luYyByZWFkeUZvcldlYlhSKHJlcXVlc3RCdXR0b25Eb206IEhUTUxFbGVtZW50LCBiYXNlUGF0aDogc3RyaW5nKSB7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoaXMgbWV0aG9kIHdvcmtzIGluIEJyb3dzZXIgZW52aXJvbm1lbnQnKTtcbiAgICB9XG4gICAgdGhpcy5fX2Jhc2VQYXRoID0gYmFzZVBhdGg7XG4gICAgYXdhaXQgTW9kdWxlTWFuYWdlci5nZXRJbnN0YW5jZSgpLmxvYWRNb2R1bGUoJ3hyJyk7XG5cbiAgICBjb25zdCBpc1dlYkdQVSA9IHRoaXMuX19lbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVTtcbiAgICBpZiAoaXNXZWJHUFUpIHtcbiAgICAgIGNvbnN0IHdlYmdwdURldmljZVdyYXBwZXIgPSB0aGlzLl9fZW5naW5lLndlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5nZXRXZWJHcHVEZXZpY2VXcmFwcGVyKCk7XG4gICAgICBpZiAod2ViZ3B1RGV2aWNlV3JhcHBlciA9PSBudWxsKSB7XG4gICAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdXZWJHUFUgRGV2aWNlIFdyYXBwZXIgaXMgbm90IHJlYWR5IHlldC4nKTtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBnbHcgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmN1cnJlbnRXZWJHTENvbnRleHRXcmFwcGVyO1xuICAgICAgaWYgKGdsdyA9PSBudWxsKSB7XG4gICAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdXZWJHTCBDb250ZXh0IGlzIG5vdCByZWFkeSB5ZXQuJyk7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19nbHcgPSBnbHc7XG4gICAgfVxuICAgIGNvbnN0IHN1cHBvcnRlZCA9IGF3YWl0IG5hdmlnYXRvci54ciEuaXNTZXNzaW9uU3VwcG9ydGVkKCdpbW1lcnNpdmUtdnInKTtcbiAgICBpZiAoc3VwcG9ydGVkKSB7XG4gICAgICBpZiAocmVxdWVzdEJ1dHRvbkRvbSkge1xuICAgICAgICByZXF1ZXN0QnV0dG9uRG9tLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcGFyYWdyYXBoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICAgICAgICBjb25zdCBhbmNob3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgIGFuY2hvci5zZXRBdHRyaWJ1dGUoJ2lkJywgJ2VudGVyLXZyJyk7XG4gICAgICAgIGNvbnN0IGVudGVyVnIgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnRW50ZXIgVlInKTtcblxuICAgICAgICBhbmNob3IuYXBwZW5kQ2hpbGQoZW50ZXJWcik7XG4gICAgICAgIHBhcmFncmFwaC5hcHBlbmRDaGlsZChhbmNob3IpO1xuXG4gICAgICAgIGlmIChpc1dlYkdQVSkge1xuICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IHRoaXMuX19lbmdpbmUud2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmdldFdlYkdwdURldmljZVdyYXBwZXIoKS5jYW52YXM7XG4gICAgICAgICAgY2FudmFzLnBhcmVudE5vZGUhLmluc2VydEJlZm9yZShwYXJhZ3JhcGgsIGNhbnZhcyk7XG4gICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5lbnRlcldlYlhSLmJpbmQodGhpcykgYXMgYW55KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBjYW52YXMgPSB0aGlzLl9fZ2x3IS5jYW52YXM7XG4gICAgICAgICAgY2FudmFzLnBhcmVudE5vZGUhLmluc2VydEJlZm9yZShwYXJhZ3JhcGgsIGNhbnZhcyk7XG4gICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5lbnRlcldlYlhSLmJpbmQodGhpcykgYXMgYW55KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLl9faXNSZWFkeUZvcldlYlhSID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdXZWJYUiBpcyBub3Qgc3VwcG9ydGVkIGluIHRoaXMgZW52aXJvbm1lbnQuJyk7XG4gICAgfVxuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZXMgYSBXZWJYUiBWUiBzZXNzaW9uIHdpdGggc3BlY2lmaWVkIGNvbmZpZ3VyYXRpb24uXG4gICAqIFJlcXVlc3RzIGFuIGltbWVyc2l2ZSBWUiBzZXNzaW9uLCBzZXRzIHVwIHJlZmVyZW5jZSBzcGFjZSwgV2ViR0wgbGF5ZXIsIGFuZCBpbnB1dCBoYW5kbGluZy5cbiAgICpcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBDb25maWd1cmF0aW9uIG9iamVjdCBmb3IgV2ViWFIgc2Vzc2lvbi5cbiAgICogQHBhcmFtIG9wdGlvbnMuaW5pdGlhbFVzZXJQb3NpdGlvbiAtIEluaXRpYWwgcG9zaXRpb24gb2YgdGhlIHVzZXIgaW4gd29ybGQgc3BhY2UuIERlZmF1bHRzIHRvIFswLCAxLjEsIDBdLlxuICAgKiBAcGFyYW0gb3B0aW9ucy5jYWxsYmFja09uWHJTZXNzaW9uU3RhcnQgLSBDYWxsYmFjayBmdW5jdGlvbiBleGVjdXRlZCB3aGVuIHRoZSBYUiBzZXNzaW9uIHN0YXJ0cy5cbiAgICogQHBhcmFtIG9wdGlvbnMuY2FsbGJhY2tPblhyU2Vzc2lvbkVuZCAtIENhbGxiYWNrIGZ1bmN0aW9uIGV4ZWN1dGVkIHdoZW4gdGhlIFhSIHNlc3Npb24gZW5kcy5cbiAgICogQHBhcmFtIG9wdGlvbnMucHJvZmlsZVByaW9yaXRpZXMgLSBBcnJheSBvZiBjb250cm9sbGVyIHByb2ZpbGUgbmFtZXMgaW4gcHJpb3JpdHkgb3JkZXIgZm9yIGlucHV0IG1hcHBpbmcuXG4gICAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB0byBhbiBhcnJheSBvZiBjb250cm9sbGVyIGVudGl0aWVzLCBvciB1bmRlZmluZWQgb24gZmFpbHVyZS5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBjb250cm9sbGVycyA9IGF3YWl0IHdlYlhSU3lzdGVtLmVudGVyV2ViWFIoe1xuICAgKiAgIGluaXRpYWxVc2VyUG9zaXRpb246IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbMCwgMS42LCAyXSksXG4gICAqICAgY2FsbGJhY2tPblhyU2Vzc2lvblN0YXJ0OiAoKSA9PiB7XG4gICAqICAgICBjb25zb2xlLmxvZygnVlIgc2Vzc2lvbiBzdGFydGVkJyk7XG4gICAqICAgICAvLyBJbml0aWFsaXplIFZSLXNwZWNpZmljIFVJIG9yIGdhbWUgbG9naWNcbiAgICogICB9LFxuICAgKiAgIGNhbGxiYWNrT25YclNlc3Npb25FbmQ6ICgpID0+IHtcbiAgICogICAgIGNvbnNvbGUubG9nKCdWUiBzZXNzaW9uIGVuZGVkJyk7XG4gICAqICAgICAvLyBDbGVhbiB1cCBWUi1zcGVjaWZpYyByZXNvdXJjZXNcbiAgICogICB9LFxuICAgKiAgIHByb2ZpbGVQcmlvcml0aWVzOiBbJ29jdWx1cy10b3VjaC12MicsICdvY3VsdXMtdG91Y2gnLCAnZ2VuZXJpYy10cmlnZ2VyJ11cbiAgICogfSk7XG4gICAqIGBgYFxuICAgKi9cbiAgYXN5bmMgZW50ZXJXZWJYUih7XG4gICAgaW5pdGlhbFVzZXJQb3NpdGlvbixcbiAgICBjYWxsYmFja09uWHJTZXNzaW9uU3RhcnQgPSAoKSA9PiB7fSxcbiAgICBjYWxsYmFja09uWHJTZXNzaW9uRW5kID0gKCkgPT4ge30sXG4gICAgcHJvZmlsZVByaW9yaXRpZXMgPSBbXSxcbiAgfToge1xuICAgIGluaXRpYWxVc2VyUG9zaXRpb24/OiBWZWN0b3IzO1xuICAgIGNhbGxiYWNrT25YclNlc3Npb25TdGFydDogKCkgPT4gdm9pZDtcbiAgICBjYWxsYmFja09uWHJTZXNzaW9uRW5kOiAoKSA9PiB2b2lkO1xuICAgIHByb2ZpbGVQcmlvcml0aWVzOiBzdHJpbmdbXTtcbiAgfSkge1xuICAgIGNvbnN0IGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy5fX2VuZ2luZS5jZ0FwaVJlc291cmNlUmVwb3NpdG9yeTtcblxuICAgIGlmIChjZ0FwaVJlc291cmNlUmVwb3NpdG9yeSAhPSBudWxsICYmIHRoaXMuX19pc1JlYWR5Rm9yV2ViWFIpIHtcbiAgICAgIGxldCByZWZlcmVuY2VTcGFjZTogWFJSZWZlcmVuY2VTcGFjZTtcbiAgICAgIGNvbnN0IGlzV2ViR1BVID0gdGhpcy5fX2VuZ2luZS5lbmdpbmVTdGF0ZS5jdXJyZW50UHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVO1xuICAgICAgY29uc3QgcmVxdWlyZWRGZWF0dXJlczogc3RyaW5nW10gPSBpc1dlYkdQVSA/IFsnd2ViZ3B1J10gOiBbXTtcbiAgICAgIGNvbnN0IHhyU2Vzc2lvbiA9IChhd2FpdCBuYXZpZ2F0b3IueHIhLnJlcXVlc3RTZXNzaW9uKCdpbW1lcnNpdmUtdnInLCB7IHJlcXVpcmVkRmVhdHVyZXMgfSkpIGFzIFhSU2Vzc2lvbjtcblxuICAgICAgeHJTZXNzaW9uLmFkZEV2ZW50TGlzdGVuZXIoJ2VuZCcsICgpID0+IHtcbiAgICAgICAgaWYgKCFpc1dlYkdQVSkge1xuICAgICAgICAgIGNvbnN0IGdsdyA9IChjZ0FwaVJlc291cmNlUmVwb3NpdG9yeSBhcyBXZWJHTFJlc291cmNlUmVwb3NpdG9yeSkuY3VycmVudFdlYkdMQ29udGV4dFdyYXBwZXIhO1xuICAgICAgICAgIGdsdy5fX2dsLmJpbmRGcmFtZWJ1ZmZlcihnbHcuX19nbC5GUkFNRUJVRkZFUiwgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fX3hyU2Vzc2lvbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5fX3dlYmdsTGF5ZXIgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX194clZpZXdlclBvc2UgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX194clJlZmVyZW5jZVNwYWNlID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLl9fc3BhY2VUeXBlID0gJ2xvY2FsJztcbiAgICAgICAgdGhpcy5fX2lzUmVhZHlGb3JXZWJYUiA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9fcmVxdWVzdGVkVG9FbnRlcldlYlhSID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX194cklucHV0U291cmNlcy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLl9fc2V0V2ViWFJNb2RlKGZhbHNlKTtcbiAgICAgICAgdGhpcy5fX2VuZ2luZS5tYXRlcmlhbFJlcG9zaXRvcnkuX21ha2VTaGFkZXJJbnZhbGlkYXRlVG9BbGxNYXRlcmlhbHMoKTtcbiAgICAgICAgdGhpcy5fX2RlZmF1bHRQb3NpdGlvbkluTG9jYWxTcGFjZU1vZGUgPSBkZWZhdWx0VXNlclBvc2l0aW9uSW5WUjtcbiAgICAgICAgTG9nZ2VyLmRlZmF1bHQuaW5mbygnWFJTZXNzaW9uIGVuZHMuJyk7XG4gICAgICAgIHRoaXMuX19lbmdpbmUuc3RvcFJlbmRlckxvb3AoKTtcbiAgICAgICAgdGhpcy5fX2VuZ2luZS5yZXN0YXJ0UmVuZGVyTG9vcCgpO1xuICAgICAgICBjYWxsYmFja09uWHJTZXNzaW9uRW5kKCk7XG4gICAgICB9KTtcblxuICAgICAgY29uc3QgcHJvbWlzZUZuID0gKHJlc29sdmU6IChlbnRpdGllczogSUVudGl0eVtdKSA9PiB2b2lkKSA9PiB7XG4gICAgICAgIHhyU2Vzc2lvbi5hZGRFdmVudExpc3RlbmVyKCdpbnB1dHNvdXJjZXNjaGFuZ2UnLCAoZTogYW55KSA9PiB7XG4gICAgICAgICAgdGhpcy5fX29uSW5wdXRTb3VyY2VzQ2hhbmdlKGUsIHJlc29sdmUsIHByb2ZpbGVQcmlvcml0aWVzKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKHByb21pc2VGbik7XG5cbiAgICAgIC8vIHRyeSB7XG4gICAgICAvLyAgIHJlZmVyZW5jZVNwYWNlID0gYXdhaXQgc2Vzc2lvbi5yZXF1ZXN0UmVmZXJlbmNlU3BhY2UoJ2xvY2FsLWZsb29yJyk7XG4gICAgICAvLyAgIHRoaXMuX19zcGFjZVR5cGUgPSAnbG9jYWwtZmxvb3InO1xuICAgICAgLy8gICB0aGlzLl9fZGVmYXVsdFBvc2l0aW9uSW5Mb2NhbFNwYWNlTW9kZSA9XG4gICAgICAvLyAgICAgaW5pdGlhbFVzZXJQb3NpdGlvbiA/PyBWZWN0b3IzLnplcm8oKTtcbiAgICAgIC8vIH0gY2F0Y2ggKGVycikge1xuICAgICAgLy8gTG9nZ2VyLmRlZmF1bHQuZXJyb3IoYEZhaWxlZCB0byBzdGFydCBYUlNlc3Npb246ICR7ZXJyfWApO1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHByZWZlci1jb25zdFxuICAgICAgcmVmZXJlbmNlU3BhY2UgPSBhd2FpdCB4clNlc3Npb24ucmVxdWVzdFJlZmVyZW5jZVNwYWNlKCdsb2NhbCcpO1xuICAgICAgdGhpcy5fX3NwYWNlVHlwZSA9ICdsb2NhbCc7XG4gICAgICB0aGlzLl9fZGVmYXVsdFBvc2l0aW9uSW5Mb2NhbFNwYWNlTW9kZSA9IGluaXRpYWxVc2VyUG9zaXRpb24gPz8gZGVmYXVsdFVzZXJQb3NpdGlvbkluVlI7XG4gICAgICB0aGlzLl9feHJSZWZlcmVuY2VTcGFjZSA9IHJlZmVyZW5jZVNwYWNlO1xuXG4gICAgICB0aGlzLl9feHJTZXNzaW9uID0geHJTZXNzaW9uO1xuICAgICAgdGhpcy5fX2VuZ2luZS5zdG9wUmVuZGVyTG9vcCgpO1xuICAgICAgaWYgKGlzV2ViR1BVKSB7XG4gICAgICAgIGNvbnN0IHdlYmdwdVJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgICAgICBjb25zdCB3ZWJncHVEZXZpY2VXcmFwcGVyID0gd2ViZ3B1UmVzb3VyY2VSZXBvc2l0b3J5LmdldFdlYkdwdURldmljZVdyYXBwZXIoKTtcbiAgICAgICAgY29uc3Qgd2ViZ3B1RGV2aWNlID0gd2ViZ3B1RGV2aWNlV3JhcHBlci5ncHVEZXZpY2U7XG4gICAgICAgIGNvbnN0IHhyR3B1QmluZGluZyA9IG5ldyB3aW5kb3cuWFJHUFVCaW5kaW5nKHhyU2Vzc2lvbiwgd2ViZ3B1RGV2aWNlKTtcbiAgICAgICAgdGhpcy5fX3hyR3B1QmluZGluZyA9IHhyR3B1QmluZGluZztcbiAgICAgICAgY29uc3QgcHJvamVjdGlvbkxheWVyID0geHJHcHVCaW5kaW5nLmNyZWF0ZVByb2plY3Rpb25MYXllcih7XG4gICAgICAgICAgY29sb3JGb3JtYXQ6IHhyR3B1QmluZGluZy5nZXRQcmVmZXJyZWRDb2xvckZvcm1hdCgpLFxuICAgICAgICAgIGRlcHRoU3RlbmNpbEZvcm1hdDogJ2RlcHRoMzJmbG9hdCcsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9feHJQcm9qZWN0aW9uTGF5ZXJXZWJHUFUgPSBwcm9qZWN0aW9uTGF5ZXI7XG4gICAgICAgIGF3YWl0IHRoaXMuX19zZXR1cFdlYkdQVUxheWVyKHhyU2Vzc2lvbiwgcHJvamVjdGlvbkxheWVyLCBjYWxsYmFja09uWHJTZXNzaW9uU3RhcnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgdGhpcy5fX3NldHVwV2ViR0xMYXllcih4clNlc3Npb24sIGNhbGxiYWNrT25YclNlc3Npb25TdGFydCk7XG4gICAgICB9XG4gICAgICB0aGlzLl9fcmVxdWVzdGVkVG9FbnRlcldlYlhSID0gdHJ1ZTtcbiAgICAgIHRoaXMuX19lbmdpbmUucmVzdGFydFJlbmRlckxvb3AoKTtcbiAgICAgIExvZ2dlci5kZWZhdWx0Lndhcm4oJ0VuZCBvZiBlbnRlcldlYlhSLicpO1xuICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdXZWJHTC9XZWJHUFUgY29udGV4dCBvciBXZWJYUlNlc3Npb24gaXMgbm90IHJlYWR5IHlldC4nKTtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4aXRzIHRoZSBjdXJyZW50IFdlYlhSIHNlc3Npb24gYW5kIHJldHVybnMgdG8gbm9ybWFsIHJlbmRlcmluZyBtb2RlLlxuICAgKiBHcmFjZWZ1bGx5IHRlcm1pbmF0ZXMgdGhlIFhSIHNlc3Npb24sIHRyaWdnZXJpbmcgY2xlYW51cCBjYWxsYmFja3MuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogLy8gRXhpdCBWUiBtb2RlIHdoZW4gdXNlciBjbGlja3MgYSBidXR0b25cbiAgICogZXhpdEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGFzeW5jICgpID0+IHtcbiAgICogICBhd2FpdCB3ZWJYUlN5c3RlbS5leGl0V2ViWFIoKTtcbiAgICogfSk7XG4gICAqIGBgYFxuICAgKi9cbiAgYXN5bmMgZXhpdFdlYlhSKCkge1xuICAgIGlmICh0aGlzLl9feHJTZXNzaW9uICE9IG51bGwpIHtcbiAgICAgIC8vIEVuZCB0aGUgWFIgc2Vzc2lvbiBub3cuXG4gICAgICBhd2FpdCB0aGlzLl9feHJTZXNzaW9uLmVuZCgpO1xuICAgIH1cbiAgfVxuXG4gIC8vLyBHZXR0ZXIgTWV0aG9kc1xuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjYW52YXMgd2lkdGggY29uZmlndXJlZCBmb3IgVlIgcmVuZGVyaW5nLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgd2lkdGggb2YgdGhlIFZSIGNhbnZhcyBpbiBwaXhlbHMuXG4gICAqL1xuICBnZXRDYW52YXNXaWR0aEZvclZyKCkge1xuICAgIHJldHVybiB0aGlzLl9fY2FudmFzV2lkdGhGb3JWUjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjYW52YXMgaGVpZ2h0IGNvbmZpZ3VyZWQgZm9yIFZSIHJlbmRlcmluZy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGhlaWdodCBvZiB0aGUgVlIgY2FudmFzIGluIHBpeGVscy5cbiAgICovXG4gIGdldENhbnZhc0hlaWdodEZvclZyKCkge1xuICAgIHJldHVybiB0aGlzLl9fY2FudmFzSGVpZ2h0Rm9yVlI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbGwgY3VycmVudGx5IHRyYWNrZWQgY29udHJvbGxlciBlbnRpdGllcy5cbiAgICpcbiAgICogQHJldHVybnMgQXJyYXkgb2Ygc2NlbmUgZ3JhcGggZW50aXRpZXMgcmVwcmVzZW50aW5nIFZSIGNvbnRyb2xsZXJzLlxuICAgKi9cbiAgZ2V0Q29udHJvbGxlckVudGl0aWVzKCkge1xuICAgIHJldHVybiB0aGlzLl9fY29udHJvbGxlckVudGl0aWVzO1xuICB9XG5cbiAgLy8vIEFjY2Vzc29yc1xuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2aWV3IG1hdHJpeCBmb3IgdGhlIGxlZnQgZXllIGNhbWVyYS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHZpZXcgbWF0cml4IGZvciBsZWZ0IGV5ZSByZW5kZXJpbmcuXG4gICAqL1xuICBnZXQgbGVmdFZpZXdNYXRyaXgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19sZWZ0Q2FtZXJhRW50aXR5LmdldENhbWVyYSgpLnZpZXdNYXRyaXg7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmlldyBtYXRyaXggZm9yIHRoZSByaWdodCBleWUgY2FtZXJhLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdmlldyBtYXRyaXggZm9yIHJpZ2h0IGV5ZSByZW5kZXJpbmcuXG4gICAqL1xuICBnZXQgcmlnaHRWaWV3TWF0cml4KCkge1xuICAgIHJldHVybiB0aGlzLl9fcmlnaHRDYW1lcmFFbnRpdHkuZ2V0Q2FtZXJhKCkudmlld01hdHJpeDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBwcm9qZWN0aW9uIG1hdHJpeCBmb3IgdGhlIGxlZnQgZXllLlxuICAgKiBEZXJpdmVkIGZyb20gdGhlIFhSIHN5c3RlbSdzIHZpZXcgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBwcm9qZWN0aW9uIG1hdHJpeCBmb3IgbGVmdCBleWUgcmVuZGVyaW5nLlxuICAgKi9cbiAgZ2V0IGxlZnRQcm9qZWN0aW9uTWF0cml4KCkge1xuICAgIGNvbnN0IHhyVmlld0xlZnQgPSB0aGlzLl9feHJWaWV3ZXJQb3NlPy52aWV3c1swXTtcbiAgICByZXR1cm4gTXV0YWJsZU1hdHJpeDQ0LmZyb21Db3B5RmxvYXQzMkFycmF5Q29sdW1uTWFqb3IoXG4gICAgICBJcy5leGlzdCh4clZpZXdMZWZ0KSA/IHhyVmlld0xlZnQucHJvamVjdGlvbk1hdHJpeCA6IChNdXRhYmxlTWF0cml4NDQuaWRlbnRpdHkoKS5fdiBhcyBGbG9hdDMyQXJyYXkpXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBwcm9qZWN0aW9uIG1hdHJpeCBmb3IgdGhlIHJpZ2h0IGV5ZS5cbiAgICogRGVyaXZlZCBmcm9tIHRoZSBYUiBzeXN0ZW0ncyB2aWV3IGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgcHJvamVjdGlvbiBtYXRyaXggZm9yIHJpZ2h0IGV5ZSByZW5kZXJpbmcuXG4gICAqL1xuICBnZXQgcmlnaHRQcm9qZWN0aW9uTWF0cml4KCkge1xuICAgIGNvbnN0IHhyVmlld1JpZ2h0ID0gdGhpcy5fX3hyVmlld2VyUG9zZT8udmlld3NbMV07XG4gICAgcmV0dXJuIE11dGFibGVNYXRyaXg0NC5mcm9tQ29weUZsb2F0MzJBcnJheUNvbHVtbk1ham9yKFxuICAgICAgSXMuZXhpc3QoeHJWaWV3UmlnaHQpID8geHJWaWV3UmlnaHQucHJvamVjdGlvbk1hdHJpeCA6IChNdXRhYmxlTWF0cml4NDQuaWRlbnRpdHkoKS5fdiBhcyBGbG9hdDMyQXJyYXkpXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBXZWJYUiBmcmFtZWJ1ZmZlciBmb3IgcmVuZGVyaW5nLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgV2ViR0wgZnJhbWVidWZmZXIgcHJvdmlkZWQgYnkgdGhlIFhSIHN5c3RlbSwgb3IgdW5kZWZpbmVkIGlmIG5vdCBhdmFpbGFibGUuXG4gICAqL1xuICBnZXQgZnJhbWVidWZmZXIoKSB7XG4gICAgLy8gaWYgKHRoaXMuX19tdWx0aXZpZXdGcmFtZWJ1ZmZlckhhbmRsZSA+IDApIHtcbiAgICAvLyAgIGNvbnN0IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5ID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuZ2V0V2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkoKTtcbiAgICAvLyAgIGNvbnN0IGZyYW1lYnVmZmVyID0gd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuZ2V0V2ViR0xSZXNvdXJjZShcbiAgICAvLyAgICAgdGhpcy5fX211bHRpdmlld0ZyYW1lYnVmZmVySGFuZGxlXG4gICAgLy8gICApO1xuICAgIC8vICAgcmV0dXJuIGZyYW1lYnVmZmVyIGFzIFdlYkdMRnJhbWVidWZmZXIgfCB1bmRlZmluZWQ7XG4gICAgLy8gfVxuXG4gICAgcmV0dXJuIHRoaXMuX194clNlc3Npb24/LnJlbmRlclN0YXRlLmJhc2VMYXllcj8uZnJhbWVidWZmZXI7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIG11bHRpdmlldyByZW5kZXJpbmcgaXMgc3VwcG9ydGVkIGFuZCBlbmFibGVkLlxuICAgKlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIG11bHRpdmlldyBWUiByZW5kZXJpbmcgaXMgc3VwcG9ydGVkLlxuICAgKi9cbiAgaXNNdWx0aVZpZXcoKSB7XG4gICAgY29uc3QgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLmNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIHJldHVybiBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeS5pc1N1cHBvcnRNdWx0aVZpZXdWUlJlbmRlcmluZyh0aGlzLl9fZW5naW5lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYSBXZWJYUiBzZXNzaW9uIGhhcyBiZWVuIHJlcXVlc3RlZC5cbiAgICpcbiAgICogQHJldHVybnMgVHJ1ZSBpZiBXZWJYUiBzZXNzaW9uIGVudHJ5IGhhcyBiZWVuIHJlcXVlc3RlZC5cbiAgICovXG4gIGdldCByZXF1ZXN0ZWRUb0VudGVyV2ViWFIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19yZXF1ZXN0ZWRUb0VudGVyV2ViWFI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCBYUiBzZXNzaW9uIG9iamVjdC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGFjdGl2ZSBYUlNlc3Npb24sIG9yIHVuZGVmaW5lZCBpZiBubyBzZXNzaW9uIGlzIGFjdGl2ZS5cbiAgICovXG4gIGdldCB4clNlc3Npb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX194clNlc3Npb247XG4gIH1cblxuICAvKipcbiAgICogTGVnYWN5IHByb3BlcnR5IGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5LlxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBVc2UgcmVxdWVzdGVkVG9FbnRlcldlYlhSIGluc3RlYWQuXG4gICAqIEByZXR1cm5zIFRydWUgaWYgV2ViWFIgc2Vzc2lvbiBlbnRyeSBoYXMgYmVlbiByZXF1ZXN0ZWQuXG4gICAqL1xuICBnZXQgcmVxdWVzdGVkVG9FbnRlcldlYlZSKCkge1xuICAgIHJldHVybiB0aGlzLl9fcmVxdWVzdGVkVG9FbnRlcldlYlhSO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBjdXJyZW50bHkgaW4gV2ViWFIgcmVuZGVyaW5nIG1vZGUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRydWUgaWYgV2ViWFIgbW9kZSBpcyBhY3RpdmUuXG4gICAqL1xuICBnZXQgaXNXZWJYUk1vZGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19pc1dlYlhSTW9kZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBXZWJYUiBtb2RlIHN0YXRlIGZvciB0aGlzIHN5c3RlbSBhbmQgdGhlIFdlYkdMIGNvbnRleHQuXG4gICAqXG4gICAqIEBwYXJhbSBtb2RlIC0gV2hldGhlciBXZWJYUiBtb2RlIHNob3VsZCBiZSBlbmFibGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfX3NldFdlYlhSTW9kZShtb2RlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fX2lzV2ViWFJNb2RlID0gbW9kZTtcbiAgICBpZiAodGhpcy5fX2dsdyAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9fZ2x3Ll9pc1dlYlhSTW9kZSA9IG1vZGU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgc3lzdGVtIGlzIHJlYWR5IHRvIGVudGVyIFdlYlhSLlxuICAgKlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIFdlYlhSIGluaXRpYWxpemF0aW9uIGlzIGNvbXBsZXRlIGFuZCByZWFkeSBmb3Igc2Vzc2lvbiBzdGFydC5cbiAgICovXG4gIGdldCBpc1JlYWR5Rm9yV2ViWFIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19pc1JlYWR5Rm9yV2ViWFI7XG4gIH1cblxuICAvLy8gUHVibGljIFN0YXRpYyBNZXRob2RzXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiBXZWJYUlN5c3RlbS5cbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBpZiBvbmUgZG9lc24ndCBleGlzdC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHNpbmdsZXRvbiBXZWJYUlN5c3RlbSBpbnN0YW5jZS5cbiAgICovXG4gIHN0YXRpYyBpbml0KGVuZ2luZTogRW5naW5lKTogV2ViWFJTeXN0ZW0ge1xuICAgIHJldHVybiBuZXcgV2ViWFJTeXN0ZW0oZW5naW5lKTtcbiAgfVxuXG4gIC8vLyBGcmllbmQgbWV0aG9kc1xuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2aWV3IG1hdHJpeCBmb3IgdGhlIHNwZWNpZmllZCBleWUuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKiBAcGFyYW0gaW5kZXggLSBFeWUgaW5kZXggKDA6IGxlZnQsIDE6IHJpZ2h0KS5cbiAgICogQHJldHVybnMgVGhlIHZpZXcgbWF0cml4IGZvciB0aGUgc3BlY2lmaWVkIGV5ZS5cbiAgICovXG4gIF9nZXRWaWV3TWF0cml4QXQoaW5kZXg6IEluZGV4KSB7XG4gICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5sZWZ0Vmlld01hdHJpeDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucmlnaHRWaWV3TWF0cml4O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHByb2plY3Rpb24gbWF0cml4IGZvciB0aGUgc3BlY2lmaWVkIGV5ZS5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqIEBwYXJhbSBpbmRleCAtIEV5ZSBpbmRleCAoMDogbGVmdCwgMTogcmlnaHQpLlxuICAgKiBAcmV0dXJucyBUaGUgcHJvamVjdGlvbiBtYXRyaXggZm9yIHRoZSBzcGVjaWZpZWQgZXllLlxuICAgKi9cbiAgX2dldFByb2plY3RNYXRyaXhBdChpbmRleDogSW5kZXgpIHtcbiAgICBpZiAoaW5kZXggPT09IDApIHtcbiAgICAgIHJldHVybiB0aGlzLmxlZnRQcm9qZWN0aW9uTWF0cml4O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5yaWdodFByb2plY3Rpb25NYXRyaXg7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmlld3BvcnQgY29uZmlndXJhdGlvbiBmb3IgdGhlIHNwZWNpZmllZCBleWUuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKiBAcGFyYW0gaW5kZXggLSBFeWUgaW5kZXggKDA6IGxlZnQsIDE6IHJpZ2h0KS5cbiAgICogQHJldHVybnMgVGhlIHZpZXdwb3J0IHZlY3RvciAoeCwgeSwgd2lkdGgsIGhlaWdodCkgZm9yIHRoZSBzcGVjaWZpZWQgZXllLlxuICAgKi9cbiAgX2dldFZpZXdwb3J0QXQoaW5kZXg6IEluZGV4KSB7XG4gICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZ2V0TGVmdFZpZXdwb3J0KCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9nZXRSaWdodFZpZXdwb3J0KCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmlld3BvcnQgY29uZmlndXJhdGlvbiBmb3IgdGhlIGxlZnQgZXllLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICogQHJldHVybnMgVGhlIHZpZXdwb3J0IHZlY3RvciAoeCwgeSwgd2lkdGgsIGhlaWdodCkgZm9yIHRoZSBsZWZ0IGV5ZS5cbiAgICovXG4gIF9nZXRMZWZ0Vmlld3BvcnQoKSB7XG4gICAgcmV0dXJuIFZlY3RvcjQuZnJvbUNvcHlBcnJheShbMCwgMCwgdGhpcy5fX2NhbnZhc1dpZHRoRm9yVlIgLyAyLCB0aGlzLl9fY2FudmFzSGVpZ2h0Rm9yVlJdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2aWV3cG9ydCBjb25maWd1cmF0aW9uIGZvciB0aGUgcmlnaHQgZXllLlxuICAgKiBBY2NvdW50cyBmb3IgbXVsdGl2aWV3IHJlbmRlcmluZyBtb2RlIGRpZmZlcmVuY2VzLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICogQHJldHVybnMgVGhlIHZpZXdwb3J0IHZlY3RvciAoeCwgeSwgd2lkdGgsIGhlaWdodCkgZm9yIHRoZSByaWdodCBleWUuXG4gICAqL1xuICBfZ2V0UmlnaHRWaWV3cG9ydCgpIHtcbiAgICBpZiAodGhpcy5pc011bHRpVmlldygpKSB7XG4gICAgICByZXR1cm4gVmVjdG9yNC5mcm9tQ29weUFycmF5KFswLCAwLCB0aGlzLl9fY2FudmFzV2lkdGhGb3JWUiAvIDIsIHRoaXMuX19jYW52YXNIZWlnaHRGb3JWUl0pO1xuICAgIH1cbiAgICByZXR1cm4gVmVjdG9yNC5mcm9tQ29weUFycmF5KFtcbiAgICAgIHRoaXMuX19jYW52YXNXaWR0aEZvclZSIC8gMixcbiAgICAgIDAsXG4gICAgICB0aGlzLl9fY2FudmFzV2lkdGhGb3JWUiAvIDIsXG4gICAgICB0aGlzLl9fY2FudmFzSGVpZ2h0Rm9yVlIsXG4gICAgXSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQgcG9zaXRpb24gb2YgdGhlIHNwZWNpZmllZCBWUiBjYW1lcmEuXG4gICAqIENvbWJpbmVzIFhSIHBvc2UgZGF0YSB3aXRoIHVzZXIgcG9zaXRpb24gb2Zmc2V0IGFuZCB2aWV3ZXIgdHJhbnNmb3JtYXRpb25zLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICogQHBhcmFtIGRpc3BsYXlJZHggLSBFeWUgaW5kZXggKDA6IGxlZnQsIDE6IHJpZ2h0KS5cbiAgICogQHJldHVybnMgVGhlIHdvcmxkIHBvc2l0aW9uIG9mIHRoZSBWUiBjYW1lcmEuXG4gICAqL1xuICBfZ2V0Q2FtZXJhV29ybGRQb3NpdGlvbkF0KGRpc3BsYXlJZHg6IEluZGV4KSB7XG4gICAgY29uc3QgeHJWaWV3ID0gdGhpcy5fX3hyVmlld2VyUG9zZT8udmlld3NbZGlzcGxheUlkeF07XG4gICAgaWYgKElzLmV4aXN0KHhyVmlldykpIHtcbiAgICAgIGNvbnN0IHBvcyA9IHhyVmlldy50cmFuc2Zvcm0ucG9zaXRpb247XG4gICAgICBjb25zdCBkZWYgPSB0aGlzLl9fZGVmYXVsdFBvc2l0aW9uSW5Mb2NhbFNwYWNlTW9kZTtcbiAgICAgIGNvbnN0IHRyYW5zbGF0ZSA9IHRoaXMuX192aWV3ZXJUcmFuc2xhdGU7XG4gICAgICBjb25zdCB2aWV3ZXJIZWFkUG9zID0gVmVjdG9yMy5hZGQoVmVjdG9yMy5mcm9tQ29weUFycmF5KFtwb3MueCwgcG9zLnksIHBvcy56XSksIGRlZik7XG4gICAgICByZXR1cm4gVmVjdG9yMy5mcm9tQ29weUFycmF5KFtcbiAgICAgICAgKHZpZXdlckhlYWRQb3MueCArIHRyYW5zbGF0ZS54KSAqIHRoaXMuX192aWV3ZXJTY2FsZS54LFxuICAgICAgICAodmlld2VySGVhZFBvcy55ICsgdHJhbnNsYXRlLnkpICogdGhpcy5fX3ZpZXdlclNjYWxlLnksXG4gICAgICAgICh2aWV3ZXJIZWFkUG9zLnogKyB0cmFuc2xhdGUueikgKiB0aGlzLl9fdmlld2VyU2NhbGUueixcbiAgICAgIF0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX2RlZmF1bHRQb3NpdGlvbkluTG9jYWxTcGFjZU1vZGU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY29tcG9uZW50IFNJRCAoU3lzdGVtIElEKSBmb3IgdGhlIHNwZWNpZmllZCBjYW1lcmEuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKiBAcGFyYW0gaW5kZXggLSBFeWUgaW5kZXggKDA6IGxlZnQsIDE6IHJpZ2h0KS5cbiAgICogQHJldHVybnMgVGhlIFNJRCBvZiB0aGUgQ2FtZXJhQ29tcG9uZW50IGZvciB0aGUgc3BlY2lmaWVkIGV5ZS5cbiAgICovXG4gIF9nZXRDYW1lcmFDb21wb25lbnRTSURBdChpbmRleDogSW5kZXgpIHtcbiAgICBpZiAoaW5kZXggPT09IDApIHtcbiAgICAgIHJldHVybiB0aGlzLl9fbGVmdENhbWVyYUVudGl0eS5nZXRDYW1lcmEoKS5jb21wb25lbnRTSUQ7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fcmlnaHRDYW1lcmFFbnRpdHkuZ2V0Q2FtZXJhKCkuY29tcG9uZW50U0lEO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNhbWVyYSBjb21wb25lbnQgZm9yIHRoZSBzcGVjaWZpZWQgZXllLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICogQHBhcmFtIGluZGV4IC0gRXllIGluZGV4ICgwOiBsZWZ0LCAxOiByaWdodCkuXG4gICAqIEByZXR1cm5zIFRoZSBDYW1lcmFDb21wb25lbnQgZm9yIHRoZSBzcGVjaWZpZWQgZXllLlxuICAgKi9cbiAgX2dldENhbWVyYUNvbXBvbmVudEF0KGluZGV4OiBJbmRleCkge1xuICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuX19sZWZ0Q2FtZXJhRW50aXR5LmdldENhbWVyYSgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX3JpZ2h0Q2FtZXJhRW50aXR5LmdldENhbWVyYSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIHByZS1yZW5kZXJpbmcgdXBkYXRlcyBmb3IgV2ViWFIuXG4gICAqIFVwZGF0ZXMgdmlldyBtYXRyaWNlcywgaW5wdXQgc291cmNlcywgYW5kIGdhbWVwYWQgc3RhdGVzLlxuICAgKiBDYWxsZWQgb25jZSBwZXIgZnJhbWUgYmVmb3JlIHJlbmRlcmluZyBiZWdpbnMuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKiBAcGFyYW0gdGltZSAtIEN1cnJlbnQgdGltZSBpbiBtaWxsaXNlY29uZHMuXG4gICAqIEBwYXJhbSB4ckZyYW1lIC0gVGhlIFhSRnJhbWUgb2JqZWN0IGZvciB0aGlzIHJlbmRlcmluZyBmcmFtZS5cbiAgICovXG4gIF9wcmVSZW5kZXIodGltZTogbnVtYmVyLCB4ckZyYW1lOiBYUkZyYW1lKSB7XG4gICAgaWYgKHRoaXMuaXNXZWJYUk1vZGUgJiYgdGhpcy5fX3JlcXVlc3RlZFRvRW50ZXJXZWJYUiAmJiB4ckZyYW1lICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX191cGRhdGVWaWV3KHhyRnJhbWUpO1xuICAgICAgdGhpcy5fX3VwZGF0ZUlucHV0U291cmNlcyh4ckZyYW1lKTtcbiAgICAgIHVwZGF0ZUdhbWVQYWQodGltZSwgeHJGcmFtZSwge1xuICAgICAgICB2aWV3ZXJUcmFuc2xhdGU6IHRoaXMuX192aWV3ZXJUcmFuc2xhdGUsXG4gICAgICAgIHZpZXdlclNjYWxlOiB0aGlzLl9fdmlld2VyU2NhbGUsXG4gICAgICAgIHZpZXdlck9yaWVudGF0aW9uOiB0aGlzLl9fdmlld2VyT3JpZW50YXRpb24sXG4gICAgICAgIHZpZXdlckF6aW11dGhBbmdsZTogdGhpcy5fX3ZpZXdlckF6aW11dGhBbmdsZSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldHMgYWxsIHZpZXdlciB0cmFuc2Zvcm1hdGlvbiBwYXJhbWV0ZXJzIHRvIHRoZWlyIGRlZmF1bHQgdmFsdWVzLlxuICAgKiBVc2VmdWwgZm9yIHJlc2V0dGluZyB1c2VyIHBvc2l0aW9uIGFuZCBvcmllbnRhdGlvbiB0byBvcmlnaW4uXG4gICAqL1xuICByZXNldFZpZXdlclRyYW5zZm9ybSgpIHtcbiAgICB0aGlzLl9fdmlld2VyVHJhbnNsYXRlID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICAgIHRoaXMuX192aWV3ZXJBemltdXRoQW5nbGUgPSBNdXRhYmxlU2NhbGFyLnplcm8oKTtcbiAgICB0aGlzLl9fdmlld2VyT3JpZW50YXRpb24gPSBNdXRhYmxlUXVhdGVybmlvbi5pZGVudGl0eSgpO1xuICAgIHRoaXMuX192aWV3ZXJTY2FsZSA9IE11dGFibGVWZWN0b3IzLm9uZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIHBvc3QtcmVuZGVyaW5nIGNsZWFudXAgZm9yIFdlYlhSLlxuICAgKiBDdXJyZW50bHkgaGFuZGxlcyBtdWx0aXZpZXcgZnJhbWVidWZmZXIgb3BlcmF0aW9ucyB3aGVuIGVuYWJsZWQuXG4gICAqIENhbGxlZCBvbmNlIHBlciBmcmFtZSBhZnRlciByZW5kZXJpbmcgaXMgY29tcGxldGUuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX3Bvc3RSZW5kZXIoKSB7XG4gICAgaWYgKHRoaXMuX19pc1dlYlhSTW9kZSkge1xuICAgICAgLy8gY29uc3QgZ2wgPSB0aGlzLl9fZ2x3IS5nZXRSYXdDb250ZXh0QXNXZWJHTDIoKSE7XG4gICAgICAvLyBpZiAodGhpcy5fX211bHRpdmlld0ZyYW1lYnVmZmVySGFuZGxlID4gMCkge1xuICAgICAgLy8gICBjb25zdCB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeSA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LmdldFdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5KCk7XG4gICAgICAvLyAgIGdsLmludmFsaWRhdGVGcmFtZWJ1ZmZlcihnbC5EUkFXX0ZSQU1FQlVGRkVSLCBbZ2wuREVQVEhfU1RFTkNJTF9BVFRBQ0hNRU5UXSk7XG4gICAgICAvLyAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihcbiAgICAgIC8vICAgICBnbC5EUkFXX0ZSQU1FQlVGRkVSLFxuICAgICAgLy8gICAgIHRoaXMuX194clNlc3Npb24hLnJlbmRlclN0YXRlLmJhc2VMYXllciEuZnJhbWVidWZmZXIhXG4gICAgICAvLyAgICk7XG4gICAgICAvLyAgIGNvbnN0IGNvbG9yVGV4dHVyZSA9IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmdldFdlYkdMUmVzb3VyY2UoXG4gICAgICAvLyAgICAgdGhpcy5fX211bHRpdmlld0NvbG9yVGV4dHVyZUhhbmRsZVxuICAgICAgLy8gICApIGFzIFdlYkdMVGV4dHVyZTtcbiAgICAgIC8vICAgdGhpcy5fX3dlYmdsU3RlcmVvVXRpbCEuYmxpdChcbiAgICAgIC8vICAgICBjb2xvclRleHR1cmUhLFxuICAgICAgLy8gICAgIDAsXG4gICAgICAvLyAgICAgMCxcbiAgICAgIC8vICAgICAxLFxuICAgICAgLy8gICAgIDEsXG4gICAgICAvLyAgICAgdGhpcy5fX2NhbnZhc1dpZHRoRm9yVlIsXG4gICAgICAvLyAgICAgdGhpcy5fX2NhbnZhc0hlaWdodEZvclZSXG4gICAgICAvLyAgICk7XG4gICAgICAvLyB9XG4gICAgfVxuICB9XG5cbiAgLy8vIFByaXZhdGUgTWV0aG9kc1xuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGNoYW5nZXMgaW4gWFIgaW5wdXQgc291cmNlcyAoY29udHJvbGxlcnMpLlxuICAgKiBDcmVhdGVzIG1vdGlvbiBjb250cm9sbGVyIGVudGl0aWVzIGZvciBuZXdseSBhZGRlZCBpbnB1dCBzb3VyY2VzLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0gZXZlbnQgLSBYUklucHV0U291cmNlQ2hhbmdlRXZlbnQgY29udGFpbmluZyBhZGRlZC9yZW1vdmVkIGlucHV0IHNvdXJjZXMuXG4gICAqIEBwYXJhbSByZXNvbHZlIC0gUHJvbWlzZSByZXNvbHZlIGZ1bmN0aW9uIHRvIHJldHVybiBjb250cm9sbGVyIGVudGl0aWVzLlxuICAgKiBAcGFyYW0gcHJvZmlsZVByaW9yaXRpZXMgLSBBcnJheSBvZiBjb250cm9sbGVyIHByb2ZpbGUgbmFtZXMgaW4gcHJpb3JpdHkgb3JkZXIuXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIF9fb25JbnB1dFNvdXJjZXNDaGFuZ2UoXG4gICAgZXZlbnQ6IFhSSW5wdXRTb3VyY2VzQ2hhbmdlRXZlbnQsXG4gICAgcmVzb2x2ZTogKGVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdKSA9PiB2b2lkLFxuICAgIHByb2ZpbGVQcmlvcml0aWVzOiBzdHJpbmdbXVxuICApIHtcbiAgICB0aGlzLl9feHJJbnB1dFNvdXJjZXMubGVuZ3RoID0gMDtcbiAgICBmb3IgKGNvbnN0IHhySW5wdXRTb3VyY2Ugb2YgZXZlbnQuYWRkZWQpIHtcbiAgICAgIHRoaXMuX194cklucHV0U291cmNlcy5wdXNoKHhySW5wdXRTb3VyY2UpO1xuICAgICAgY29uc3QgY29udHJvbGxlciA9IGF3YWl0IGNyZWF0ZU1vdGlvbkNvbnRyb2xsZXIoXG4gICAgICAgIHRoaXMuX19lbmdpbmUsXG4gICAgICAgIHhySW5wdXRTb3VyY2UsXG4gICAgICAgIHRoaXMuX19iYXNlUGF0aCBhcyBzdHJpbmcsXG4gICAgICAgIHByb2ZpbGVQcmlvcml0aWVzXG4gICAgICApO1xuICAgICAgaWYgKElzLmV4aXN0KGNvbnRyb2xsZXIpKSB7XG4gICAgICAgIHRoaXMuX19jb250cm9sbGVyRW50aXRpZXMucHVzaChjb250cm9sbGVyKTtcbiAgICAgICAgdGhpcy5fX3ZpZXdlckVudGl0eS5nZXRTY2VuZUdyYXBoKCkhLmFkZENoaWxkKGNvbnRyb2xsZXIuZ2V0U2NlbmVHcmFwaCgpISk7XG4gICAgICB9XG4gICAgfVxuICAgIHJlc29sdmUodGhpcy5fX2NvbnRyb2xsZXJFbnRpdGllcyk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyBjYW1lcmEgaW5mb3JtYXRpb24gZnJvbSBYUiB2aWV3ZXIgcG9zZSBkYXRhLlxuICAgKiBDYWxjdWxhdGVzIGFuZCBhcHBsaWVzIHRyYW5zZm9ybWF0aW9ucyBmb3IgbGVmdCBhbmQgcmlnaHQgZXllIGNhbWVyYXMgYmFzZWQgb24gWFIgcG9zZS5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHhyVmlld2VyUG9zZSAtIFRoZSBYUlZpZXdlclBvc2UgY29udGFpbmluZyB2aWV3IGFuZCB0cmFuc2Zvcm0gZGF0YS5cbiAgICovXG4gIHByaXZhdGUgX19zZXRDYW1lcmFJbmZvRnJvbVhSVmlld3MoeHJWaWV3ZXJQb3NlOiBYUlZpZXdlclBvc2UpIHtcbiAgICBpZiAoSXMubm90LmV4aXN0KHhyVmlld2VyUG9zZSkpIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0Lndhcm4oJ3hyVmlld2VyUG9zZSBub3QgZXhpc3QnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgeHJWaWV3TGVmdCA9IHhyVmlld2VyUG9zZS52aWV3c1swXTtcbiAgICBjb25zdCB4clZpZXdSaWdodCA9IHhyVmlld2VyUG9zZS52aWV3c1sxXTtcbiAgICBpZiAoSXMubm90LmV4aXN0KHhyVmlld0xlZnQpIHx8IElzLm5vdC5leGlzdCh4clZpZXdSaWdodCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBvcmllbnRhdGlvbiA9IHhyVmlld2VyUG9zZS50cmFuc2Zvcm0ub3JpZW50YXRpb247XG4gICAgdGhpcy5fX3ZpZXdlck9yaWVudGF0aW9uLnggPSBvcmllbnRhdGlvbi54O1xuICAgIHRoaXMuX192aWV3ZXJPcmllbnRhdGlvbi55ID0gb3JpZW50YXRpb24ueTtcbiAgICB0aGlzLl9fdmlld2VyT3JpZW50YXRpb24ueiA9IG9yaWVudGF0aW9uLno7XG4gICAgdGhpcy5fX3ZpZXdlck9yaWVudGF0aW9uLncgPSBvcmllbnRhdGlvbi53O1xuXG4gICAgY29uc3QgbG0gPSBNdXRhYmxlTWF0cml4NDQuZnJvbUNvcHlGbG9hdDMyQXJyYXlDb2x1bW5NYWpvcih4clZpZXdMZWZ0Py50cmFuc2Zvcm0ubWF0cml4IGFzIEZsb2F0MzJBcnJheSk7XG4gICAgY29uc3Qgcm0gPSBNdXRhYmxlTWF0cml4NDQuZnJvbUNvcHlGbG9hdDMyQXJyYXlDb2x1bW5NYWpvcih4clZpZXdSaWdodD8udHJhbnNmb3JtLm1hdHJpeCBhcyBGbG9hdDMyQXJyYXkpO1xuXG4gICAgY29uc3Qgcm90YXRlTWF0TGVmdCA9IGxtO1xuICAgIGNvbnN0IHJvdGF0ZU1hdFJpZ2h0ID0gcm07XG5cbiAgICBjb25zdCBzY2FsZSA9IHRoaXMuX192aWV3ZXJTY2FsZS54O1xuICAgIGNvbnN0IHBvc0xlZnQgPSB4clZpZXdMZWZ0LnRyYW5zZm9ybS5wb3NpdGlvbjtcbiAgICBjb25zdCBwb3NSaWdodCA9IHhyVmlld1JpZ2h0LnRyYW5zZm9ybS5wb3NpdGlvbjtcbiAgICBjb25zdCB0cmFuc2xhdGVMZWZ0U2NhbGVkID0gTXV0YWJsZVZlY3RvcjMuYWRkKHRoaXMuX19kZWZhdWx0UG9zaXRpb25JbkxvY2FsU3BhY2VNb2RlLCB0aGlzLl9fdmlld2VyVHJhbnNsYXRlKTtcbiAgICBjb25zdCB0cmFuc2xhdGVSaWdodFNjYWxlZCA9IE11dGFibGVWZWN0b3IzLmFkZCh0aGlzLl9fZGVmYXVsdFBvc2l0aW9uSW5Mb2NhbFNwYWNlTW9kZSwgdGhpcy5fX3ZpZXdlclRyYW5zbGF0ZSk7XG4gICAgY29uc3QgeHJWaWV3ZXJQb3NMZWZ0ID0gVmVjdG9yMy5mcm9tQ29weUFycmF5KFtwb3NMZWZ0LngsIHBvc0xlZnQueSwgcG9zTGVmdC56XSk7XG4gICAgY29uc3QgeHJWaWV3ZXJQb3NSaWdodCA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbcG9zUmlnaHQueCwgcG9zUmlnaHQueSwgcG9zUmlnaHQuel0pO1xuICAgIGNvbnN0IHRyYW5zbGF0ZUxlZnQgPSBNdXRhYmxlVmVjdG9yMy5hZGQodGhpcy5fX2RlZmF1bHRQb3NpdGlvbkluTG9jYWxTcGFjZU1vZGUsIHRoaXMuX192aWV3ZXJUcmFuc2xhdGUpLmFkZChcbiAgICAgIHhyVmlld2VyUG9zTGVmdFxuICAgICk7XG4gICAgY29uc3QgdHJhbnNsYXRlUmlnaHQgPSBNdXRhYmxlVmVjdG9yMy5hZGQodGhpcy5fX2RlZmF1bHRQb3NpdGlvbkluTG9jYWxTcGFjZU1vZGUsIHRoaXMuX192aWV3ZXJUcmFuc2xhdGUpLmFkZChcbiAgICAgIHhyVmlld2VyUG9zUmlnaHRcbiAgICApO1xuICAgIGNvbnN0IHZpZXdlclRyYW5zbGF0ZVNjYWxlZFggPSAodHJhbnNsYXRlTGVmdFNjYWxlZC54ICsgdHJhbnNsYXRlUmlnaHRTY2FsZWQueCkgLyAyO1xuICAgIGNvbnN0IHZpZXdlclRyYW5zbGF0ZVNjYWxlZFogPSAodHJhbnNsYXRlTGVmdFNjYWxlZC56ICsgdHJhbnNsYXRlUmlnaHRTY2FsZWQueikgLyAyO1xuICAgIGNvbnN0IHZpZXdlclRyYW5zbGF0ZVggPSAodHJhbnNsYXRlTGVmdC54ICsgdHJhbnNsYXRlUmlnaHQueCkgLyAyO1xuICAgIGNvbnN0IHZpZXdlclRyYW5zbGF0ZVogPSAodHJhbnNsYXRlTGVmdC56ICsgdHJhbnNsYXRlUmlnaHQueikgLyAyO1xuICAgIGNvbnN0IHZpZXdlclRyYW5zZm9ybSA9IHRoaXMuX192aWV3ZXJFbnRpdHkuZ2V0VHJhbnNmb3JtKCkhO1xuICAgIHZpZXdlclRyYW5zZm9ybS5sb2NhbFBvc2l0aW9uID0gVmVjdG9yMy5mcm9tQ29weUFycmF5KFt2aWV3ZXJUcmFuc2xhdGVTY2FsZWRYLCAwLCB2aWV3ZXJUcmFuc2xhdGVTY2FsZWRaXSk7XG4gICAgdmlld2VyVHJhbnNmb3JtLmxvY2FsU2NhbGUgPSBWZWN0b3IzLmZyb21Db3B5QXJyYXkoW3NjYWxlLCBzY2FsZSwgc2NhbGVdKTtcbiAgICB2aWV3ZXJUcmFuc2Zvcm0ubG9jYWxFdWxlckFuZ2xlcyA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbMCwgdGhpcy5fX3ZpZXdlckF6aW11dGhBbmdsZS54LCAwXSk7XG5cbiAgICByb3RhdGVNYXRMZWZ0LnRyYW5zbGF0ZVkgPSB0cmFuc2xhdGVMZWZ0Lnk7XG4gICAgcm90YXRlTWF0TGVmdC50cmFuc2xhdGVYID0gdHJhbnNsYXRlTGVmdC54IC0gdmlld2VyVHJhbnNsYXRlWDtcbiAgICByb3RhdGVNYXRMZWZ0LnRyYW5zbGF0ZVogPSB0cmFuc2xhdGVMZWZ0LnogLSB2aWV3ZXJUcmFuc2xhdGVaO1xuICAgIHJvdGF0ZU1hdExlZnQudHJhbnNsYXRlWSArPSB4clZpZXdlclBvc0xlZnQueTtcbiAgICByb3RhdGVNYXRMZWZ0LnRyYW5zbGF0ZVggKz0geHJWaWV3ZXJQb3NMZWZ0Lng7XG4gICAgcm90YXRlTWF0TGVmdC50cmFuc2xhdGVaICs9IHhyVmlld2VyUG9zTGVmdC56O1xuICAgIHJvdGF0ZU1hdFJpZ2h0LnRyYW5zbGF0ZVkgPSB0cmFuc2xhdGVSaWdodC55O1xuICAgIHJvdGF0ZU1hdFJpZ2h0LnRyYW5zbGF0ZVggPSB0cmFuc2xhdGVSaWdodC54IC0gdmlld2VyVHJhbnNsYXRlWDtcbiAgICByb3RhdGVNYXRSaWdodC50cmFuc2xhdGVaID0gdHJhbnNsYXRlUmlnaHQueiAtIHZpZXdlclRyYW5zbGF0ZVo7XG4gICAgcm90YXRlTWF0UmlnaHQudHJhbnNsYXRlWSArPSB4clZpZXdlclBvc1JpZ2h0Lnk7XG4gICAgcm90YXRlTWF0UmlnaHQudHJhbnNsYXRlWCArPSB4clZpZXdlclBvc1JpZ2h0Lng7XG4gICAgcm90YXRlTWF0UmlnaHQudHJhbnNsYXRlWiArPSB4clZpZXdlclBvc1JpZ2h0Lno7XG5cbiAgICB0aGlzLl9fbGVmdENhbWVyYUVudGl0eS5nZXRUcmFuc2Zvcm0oKSEubG9jYWxNYXRyaXggPSByb3RhdGVNYXRMZWZ0O1xuICAgIHRoaXMuX19yaWdodENhbWVyYUVudGl0eS5nZXRUcmFuc2Zvcm0oKSEubG9jYWxNYXRyaXggPSByb3RhdGVNYXRSaWdodDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIHRoZSBXZWJHTCBsYXllciBmb3IgWFIgcmVuZGVyaW5nLlxuICAgKiBNYWtlcyB0aGUgV2ViR0wgY29udGV4dCBYUi1jb21wYXRpYmxlIGFuZCBjb25maWd1cmVzIHRoZSBYUiBzZXNzaW9uJ3MgYmFzZSBsYXllci5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHhyU2Vzc2lvbiAtIFRoZSBYUlNlc3Npb24gdG8gY29uZmlndXJlLlxuICAgKiBAcGFyYW0gY2FsbGJhY2tPblhyU2Vzc2lvblN0YXJ0IC0gQ2FsbGJhY2sgdG8gZXhlY3V0ZSB3aGVuIHNldHVwIGlzIGNvbXBsZXRlLlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBfX3NldHVwV2ViR0xMYXllcih4clNlc3Npb246IFhSU2Vzc2lvbiwgY2FsbGJhY2tPblhyU2Vzc2lvblN0YXJ0OiAoKSA9PiB2b2lkKSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLl9fZ2x3Py5nZXRSYXdDb250ZXh0QXNXZWJHTDIoKTtcblxuICAgIGlmIChnbCAhPSBudWxsKSB7XG4gICAgICAvLyBNYWtlIHN1cmUgdGhlIGNhbnZhcyBjb250ZXh0IHdlIHdhbnQgdG8gdXNlIGlzIGNvbXBhdGlibGUgd2l0aCB0aGUgY3VycmVudCB4ciBkZXZpY2UuXG4gICAgICBhd2FpdCAoZ2wgYXMgYW55KS5tYWtlWFJDb21wYXRpYmxlKCk7XG4gICAgICAvLyBUaGUgY29udGVudCB0aGF0IHdpbGwgYmUgc2hvd24gb24gdGhlIGRldmljZSBpcyBkZWZpbmVkIGJ5IHRoZSBzZXNzaW9uJ3NcbiAgICAgIC8vIGJhc2VMYXllci5cblxuICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGhpcyBtZXRob2Qgd29ya3MgaW4gQnJvd3NlciBlbnZpcm9ubWVudCcpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9fd2ViZ2xMYXllciA9IG5ldyB3aW5kb3cuWFJXZWJHTExheWVyKHhyU2Vzc2lvbiwgZ2wpIGFzIFhSV2ViR0xMYXllcjtcbiAgICAgIGNvbnN0IHdlYmdsTGF5ZXIgPSB0aGlzLl9fd2ViZ2xMYXllcjtcbiAgICAgIHhyU2Vzc2lvbi51cGRhdGVSZW5kZXJTdGF0ZSh7XG4gICAgICAgIGJhc2VMYXllcjogd2ViZ2xMYXllcixcbiAgICAgICAgZGVwdGhOZWFyOiAwLjAxLFxuICAgICAgICBkZXB0aEZhcjogMTAwMCxcbiAgICAgIH0pO1xuICAgICAgY29uc3Qgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgICAgdGhpcy5fX2NhbnZhc1dpZHRoRm9yVlIgPSB3ZWJnbExheWVyLmZyYW1lYnVmZmVyV2lkdGg7XG4gICAgICB0aGlzLl9fY2FudmFzSGVpZ2h0Rm9yVlIgPSB3ZWJnbExheWVyLmZyYW1lYnVmZmVySGVpZ2h0O1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuaW5mbyh0aGlzLl9fY2FudmFzV2lkdGhGb3JWUi50b1N0cmluZygpKTtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmluZm8odGhpcy5fX2NhbnZhc0hlaWdodEZvclZSLnRvU3RyaW5nKCkpO1xuXG4gICAgICAvLyBpZiAodGhpcy5fX211bHRpdmlld0ZyYW1lYnVmZmVySGFuZGxlID09PSAtMSkge1xuICAgICAgLy8gY29uc3Qgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5nZXRXZWJHTFJlc291cmNlUmVwb3NpdG9yeSgpO1xuICAgICAgLy8gW3RoaXMuX19tdWx0aXZpZXdGcmFtZWJ1ZmZlckhhbmRsZSwgdGhpcy5fX211bHRpdmlld0NvbG9yVGV4dHVyZUhhbmRsZV0gPVxuICAgICAgLy8gICB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5jcmVhdGVNdWx0aXZpZXdGcmFtZWJ1ZmZlcihcbiAgICAgIC8vICAgICB3ZWJnbExheWVyLmZyYW1lYnVmZmVyV2lkdGgsXG4gICAgICAvLyAgICAgd2ViZ2xMYXllci5mcmFtZWJ1ZmZlckhlaWdodCxcbiAgICAgIC8vICAgICA0XG4gICAgICAvLyAgICk7XG4gICAgICAvLyB0aGlzLl9fd2ViZ2xTdGVyZW9VdGlsID0gbmV3IFdlYkdMU3RlcmVvVXRpbChnbCk7XG4gICAgICAvLyB9XG5cbiAgICAgIHRoaXMuX19lbmdpbmUubWF0ZXJpYWxSZXBvc2l0b3J5Ll9tYWtlU2hhZGVySW52YWxpZGF0ZVRvQWxsTWF0ZXJpYWxzKCk7XG5cbiAgICAgIHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LnJlc2l6ZUNhbnZhcyh0aGlzLl9fY2FudmFzV2lkdGhGb3JWUiwgdGhpcy5fX2NhbnZhc0hlaWdodEZvclZSKTtcbiAgICAgIHRoaXMuX19zZXRXZWJYUk1vZGUodHJ1ZSk7XG4gICAgICBjYWxsYmFja09uWHJTZXNzaW9uU3RhcnQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJ1dlYkdMIGNvbnRleHQgaXMgbm90IHJlYWR5IGZvciBXZWJYUi4nKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIF9fc2V0dXBXZWJHUFVMYXllcihcbiAgICB4clNlc3Npb246IFhSU2Vzc2lvbixcbiAgICBwcm9qZWN0aW9uTGF5ZXI6IFhSTGF5ZXIsXG4gICAgY2FsbGJhY2tPblhyU2Vzc2lvblN0YXJ0OiAoKSA9PiB2b2lkXG4gICkge1xuICAgIHhyU2Vzc2lvbi51cGRhdGVSZW5kZXJTdGF0ZSh7IGxheWVyczogW3Byb2plY3Rpb25MYXllcl0gfSk7XG5cbiAgICBjb25zdCB3ZWJncHVSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYkdwdVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBjb25zdCB3ZWJncHVEZXZpY2VXcmFwcGVyID0gd2ViZ3B1UmVzb3VyY2VSZXBvc2l0b3J5LmdldFdlYkdwdURldmljZVdyYXBwZXIoKTtcbiAgICBjb25zdCBjYW52YXMgPSB3ZWJncHVEZXZpY2VXcmFwcGVyLmNhbnZhcztcbiAgICBjb25zdCBwcm9qZWN0aW9uTGF5ZXJUeXBlZCA9IHByb2plY3Rpb25MYXllciBhcyBYUlByb2plY3Rpb25MYXllcjtcblxuICAgIGxldCByZXNvbHZlZFdpZHRoID0gcHJvamVjdGlvbkxheWVyVHlwZWQ/LnRleHR1cmVXaWR0aCA/PyAwO1xuICAgIGxldCByZXNvbHZlZEhlaWdodCA9IHByb2plY3Rpb25MYXllclR5cGVkPy50ZXh0dXJlSGVpZ2h0ID8/IDA7XG5cbiAgICBpZiAocmVzb2x2ZWRXaWR0aCA8PSAwIHx8IHJlc29sdmVkSGVpZ2h0IDw9IDApIHtcbiAgICAgIGNvbnN0IFtjdXJyZW50V2lkdGgsIGN1cnJlbnRIZWlnaHRdID0gdGhpcy5fX2VuZ2luZS5nZXRDYW52YXNTaXplKCk7XG4gICAgICByZXNvbHZlZFdpZHRoID0gY3VycmVudFdpZHRoO1xuICAgICAgcmVzb2x2ZWRIZWlnaHQgPSBjdXJyZW50SGVpZ2h0O1xuICAgIH1cblxuICAgIGlmIChyZXNvbHZlZFdpZHRoIDw9IDAgfHwgcmVzb2x2ZWRIZWlnaHQgPD0gMCkge1xuICAgICAgcmVzb2x2ZWRXaWR0aCA9IGNhbnZhcy53aWR0aDtcbiAgICAgIHJlc29sdmVkSGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcbiAgICB9XG5cbiAgICBpZiAocmVzb2x2ZWRXaWR0aCA+IDAgJiYgcmVzb2x2ZWRIZWlnaHQgPiAwKSB7XG4gICAgICB0aGlzLl9fY2FudmFzV2lkdGhGb3JWUiA9IHJlc29sdmVkV2lkdGg7XG4gICAgICB0aGlzLl9fY2FudmFzSGVpZ2h0Rm9yVlIgPSByZXNvbHZlZEhlaWdodDtcbiAgICAgIHdlYmdwdVJlc291cmNlUmVwb3NpdG9yeS5yZXNpemVDYW52YXMocmVzb2x2ZWRXaWR0aCwgcmVzb2x2ZWRIZWlnaHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKFxuICAgICAgICAnVW5hYmxlIHRvIHJlc29sdmUgWFIgY2FudmFzIHNpemUgZHVyaW5nIFdlYkdQVSBsYXllciBzZXR1cC4gRGVmZXJyaW5nIHJlc2l6ZSB1bnRpbCBmaXJzdCBmcmFtZS4nXG4gICAgICApO1xuICAgIH1cblxuICAgIHRoaXMuX19lbmdpbmUubWF0ZXJpYWxSZXBvc2l0b3J5Ll9tYWtlU2hhZGVySW52YWxpZGF0ZVRvQWxsTWF0ZXJpYWxzKCk7XG4gICAgdGhpcy5fX3NldFdlYlhSTW9kZSh0cnVlKTtcbiAgICBjYWxsYmFja09uWHJTZXNzaW9uU3RhcnQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSB2aWV3ZXIgcG9zZSBmcm9tIHRoZSBjdXJyZW50IFhSIGZyYW1lLlxuICAgKiBSZXRyaWV2ZXMgdGhlIGN1cnJlbnQgdmlld2VyIHBvc2UgYW5kIHVwZGF0ZXMgY2FtZXJhIHRyYW5zZm9ybWF0aW9ucy5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHhyRnJhbWUgLSBUaGUgY3VycmVudCBYUkZyYW1lIGNvbnRhaW5pbmcgcG9zZSBkYXRhLlxuICAgKi9cbiAgcHJpdmF0ZSBfX3VwZGF0ZVZpZXcoeHJGcmFtZTogWFJGcmFtZSkge1xuICAgIHRoaXMuX194clZpZXdlclBvc2UgPSB4ckZyYW1lLmdldFZpZXdlclBvc2UodGhpcy5fX3hyUmVmZXJlbmNlU3BhY2UhKTtcbiAgICB0aGlzLl9fc2V0Q2FtZXJhSW5mb0Zyb21YUlZpZXdzKHRoaXMuX194clZpZXdlclBvc2UhKTtcbiAgICBjb25zdCBpc1dlYkdQVSA9IHRoaXMuX19lbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVTtcbiAgICBpZiAoaXNXZWJHUFUpIHtcbiAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLl9feHJWaWV3ZXJQb3NlIS52aWV3c1swXTtcbiAgICAgIGNvbnN0IHN1YkltYWdlID0gdGhpcy5fX3hyR3B1QmluZGluZyEuZ2V0Vmlld1N1YkltYWdlKHRoaXMuX194clByb2plY3Rpb25MYXllcldlYkdQVSEsIHZpZXcpO1xuICAgICAgY29uc3QgdnAgPSBzdWJJbWFnZS52aWV3cG9ydDtcbiAgICAgIGNvbnN0IHJlc29sdmVkV2lkdGggPSBzdWJJbWFnZS50ZXh0dXJlV2lkdGggPz8gdnA/LndpZHRoID8/IDA7XG4gICAgICBjb25zdCByZXNvbHZlZEhlaWdodCA9IHN1YkltYWdlLnRleHR1cmVIZWlnaHQgPz8gdnA/LmhlaWdodCA/PyAwO1xuICAgICAgaWYgKHJlc29sdmVkV2lkdGggPiAwICYmIHJlc29sdmVkSGVpZ2h0ID4gMCkge1xuICAgICAgICB0aGlzLl9fY2FudmFzV2lkdGhGb3JWUiA9IHJlc29sdmVkV2lkdGg7XG4gICAgICAgIHRoaXMuX19jYW52YXNIZWlnaHRGb3JWUiA9IHJlc29sdmVkSGVpZ2h0O1xuICAgICAgICBjb25zdCB3ZWJncHVSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYkdwdVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICAgICAgd2ViZ3B1UmVzb3VyY2VSZXBvc2l0b3J5LnJlc2l6ZUNhbnZhcyh0aGlzLl9fY2FudmFzV2lkdGhGb3JWUiwgdGhpcy5fX2NhbnZhc0hlaWdodEZvclZSKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIExvZ2dlci5kZWZhdWx0Lndhcm4oJ1hSV2ViR1BVIHN1YkltYWdlIHJldHVybmVkIHplcm8tc2l6ZWQgZXh0ZW50LiBTa2lwcGluZyBjYW52YXMgcmVzaXplIGZvciB0aGlzIGZyYW1lLicpO1xuICAgICAgfVxuICAgICAgdGhpcy5fX2VuZ2luZS5lbmdpbmVTdGF0ZS54clBvc2VXZWJHUFUgPSB0aGlzLl9feHJWaWV3ZXJQb3NlO1xuICAgICAgdGhpcy5fX2VuZ2luZS5lbmdpbmVTdGF0ZS54ckdwdUJpbmRpbmcgPSB0aGlzLl9feHJHcHVCaW5kaW5nO1xuICAgICAgdGhpcy5fX2VuZ2luZS5lbmdpbmVTdGF0ZS54clByb2plY3Rpb25MYXllcldlYkdQVSA9IHRoaXMuX194clByb2plY3Rpb25MYXllcldlYkdQVTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgdHJhbnNmb3JtcyBhbmQgc3RhdGVzIG9mIFhSIGlucHV0IHNvdXJjZXMgKGNvbnRyb2xsZXJzKS5cbiAgICogQXBwbGllcyBYUiBwb3NlIGRhdGEgdG8gY29udHJvbGxlciBlbnRpdGllcyBhbmQgdXBkYXRlcyB0aGVpciB2aXN1YWwgbW9kZWxzLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0geHJGcmFtZSAtIFRoZSBjdXJyZW50IFhSRnJhbWUgY29udGFpbmluZyBpbnB1dCBzb3VyY2UgcG9zZSBkYXRhLlxuICAgKi9cbiAgcHJpdmF0ZSBfX3VwZGF0ZUlucHV0U291cmNlcyh4ckZyYW1lOiBYUkZyYW1lKSB7XG4gICAgdGhpcy5fX3hySW5wdXRTb3VyY2VzLmZvckVhY2goKGlucHV0LCBpKSA9PiB7XG4gICAgICBpZiAoSXMuZXhpc3QoaW5wdXQuZ3JpcFNwYWNlKSkge1xuICAgICAgICBjb25zdCB4clBvc2UgPSB4ckZyYW1lLmdldFBvc2UoaW5wdXQuZ3JpcFNwYWNlLCB0aGlzLl9feHJSZWZlcmVuY2VTcGFjZSEpO1xuICAgICAgICBpZiAoSXMuZXhpc3QoeHJQb3NlKSkge1xuICAgICAgICAgIGNvbnN0IGhhbmQgPSB0aGlzLl9fY29udHJvbGxlckVudGl0aWVzW2ldO1xuICAgICAgICAgIGlmIChJcy5leGlzdChoYW5kKSkge1xuICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSB0cmFuc2Zvcm0gb2YgdGhlIGNvbnRyb2xsZXIgaXRzZWxmXG4gICAgICAgICAgICBjb25zdCBoYW5kV29ybGRNYXRyaXggPSBNdXRhYmxlTWF0cml4NDQuZnJvbUNvcHlGbG9hdDMyQXJyYXlDb2x1bW5NYWpvcih4clBvc2UudHJhbnNmb3JtLm1hdHJpeCk7XG4gICAgICAgICAgICBjb25zdCByb3RhdGVNYXQgPSBNdXRhYmxlTWF0cml4NDQuZnJvbUNvcHlNYXRyaXg0NChoYW5kV29ybGRNYXRyaXgpO1xuICAgICAgICAgICAgcm90YXRlTWF0LnRyYW5zbGF0ZVkgKz0gdGhpcy5fX2RlZmF1bHRQb3NpdGlvbkluTG9jYWxTcGFjZU1vZGUueTtcbiAgICAgICAgICAgIHJvdGF0ZU1hdC50cmFuc2xhdGVZICs9IHRoaXMuX192aWV3ZXJUcmFuc2xhdGUueTtcbiAgICAgICAgICAgIGhhbmQuZ2V0VHJhbnNmb3JtKCkhLmxvY2FsTWF0cml4ID0gcm90YXRlTWF0O1xuXG4gICAgICAgICAgICAvLyB1cGRhdGUgdGhlIGNvbXBvbmVudHMgKGJ1dHRvbnMsIGV0Yy4uLikgb2YgdGhlIGNvbnRyb2xsZXJcbiAgICAgICAgICAgIGNvbnN0IG1vdGlvbkNvbnRyb2xsZXIgPSBnZXRNb3Rpb25Db250cm9sbGVyKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChJcy5leGlzdChtb3Rpb25Db250cm9sbGVyKSkge1xuICAgICAgICAgICAgICB1cGRhdGVNb3Rpb25Db250cm9sbGVyTW9kZWwoaGFuZCwgbW90aW9uQ29udHJvbGxlcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKCdtb3Rpb25Db250cm9sbGVyIG5vdCBmb3VuZCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUywwQkFBMEI7QUFDbkMsU0FBUyx5QkFBeUI7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QUFpQixRQUFRLENBQUMsT0FBTyxNQUFNO0FBQzFDLFVBQUksR0FBRyxNQUFNLE1BQU0sU0FBUyxHQUFHO0FBQzdCLGNBQU0sU0FBUyxRQUFRLFFBQVEsTUFBTSxXQUFXLEtBQUtpQixFQUFtQjtBQUN4RSxZQUFJLEdBQUcsTUFBTSxNQUFNLEdBQUc7QUFDcEIsZ0JBQU0sT0FBTyxLQUFLbEIsR0FBcUIsQ0FBQztBQUN4QyxjQUFJLEdBQUcsTUFBTSxJQUFJLEdBQUc7QUFFbEIsa0JBQU0sa0JBQWtCLGdCQUFnQixnQ0FBZ0MsT0FBTyxVQUFVLE1BQU07QUFDL0Ysa0JBQU0sWUFBWSxnQkFBZ0IsaUJBQWlCLGVBQWU7QUFDbEUsc0JBQVUsY0FBYyxLQUFLSCxHQUFrQztBQUMvRCxzQkFBVSxjQUFjLEtBQUtLLEdBQWtCO0FBQy9DLGlCQUFLLGFBQWEsRUFBRyxjQUFjO0FBR25DLGtCQUFNLG1CQUFtQixvQkFBb0IsS0FBSztBQUNsRCxnQkFBSSxHQUFHLE1BQU0sZ0JBQWdCLEdBQUc7QUFDOUIsMENBQTRCLE1BQU0sZ0JBQWdCO0FBQUEsWUFDcEQsT0FBTztBQUNMLHFCQUFPLFFBQVEsS0FBSyw0QkFBNEI7QUFBQSxZQUNsRDtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFDRjsiLAogICJuYW1lcyI6IFsiX19pc1dlYlhSTW9kZSIsICJfX3NwYWNlVHlwZSIsICJfX3JlcXVlc3RlZFRvRW50ZXJXZWJYUiIsICJfX2lzUmVhZHlGb3JXZWJYUiIsICJfX2RlZmF1bHRQb3NpdGlvbkluTG9jYWxTcGFjZU1vZGUiLCAiX19jYW52YXNXaWR0aEZvclZSIiwgIl9fY2FudmFzSGVpZ2h0Rm9yVlIiLCAiX19jb250cm9sbGVyRW50aXRpZXMiLCAiX194cklucHV0U291cmNlcyIsICJfX3ZpZXdlclRyYW5zbGF0ZSIsICJfX3ZpZXdlckF6aW11dGhBbmdsZSIsICJfX3ZpZXdlck9yaWVudGF0aW9uIiwgIl9fdmlld2VyU2NhbGUiLCAiX19tdWx0aXZpZXdGcmFtZWJ1ZmZlckhhbmRsZSIsICJfX211bHRpdmlld0NvbG9yVGV4dHVyZUhhbmRsZSIsICJfX2VuZ2luZSIsICJfX3ZpZXdlckVudGl0eSIsICJfX2xlZnRDYW1lcmFFbnRpdHkiLCAiX19yaWdodENhbWVyYUVudGl0eSIsICJfX2Jhc2VQYXRoIiwgIl9fZ2x3IiwgIl9fZ2wiLCAiX194clNlc3Npb24iLCAiX193ZWJnbExheWVyIiwgIl9feHJWaWV3ZXJQb3NlIiwgIl9feHJSZWZlcmVuY2VTcGFjZSIsICJfX3NldFdlYlhSTW9kZSIsICJfX29uSW5wdXRTb3VyY2VzQ2hhbmdlIiwgIl9feHJHcHVCaW5kaW5nIiwgIl9feHJQcm9qZWN0aW9uTGF5ZXJXZWJHUFUiLCAiX19zZXR1cFdlYkdQVUxheWVyIiwgIl9fc2V0dXBXZWJHTExheWVyIiwgIl9fdXBkYXRlVmlldyIsICJfX3VwZGF0ZUlucHV0U291cmNlcyIsICJfX3NldENhbWVyYUluZm9Gcm9tWFJWaWV3cyJdCn0K
