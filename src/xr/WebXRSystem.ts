import { createCameraEntity } from '../foundation/components/Camera/createCameraEntity';
import { createGroupEntity } from '../foundation/components/SceneGraph/createGroupEntity';
import type { IEntity } from '../foundation/core/Entity';
import { ProcessApproach } from '../foundation/definitions/ProcessApproach';
import type { ICameraEntity, ISceneGraphEntity } from '../foundation/helpers/EntityHelper';
import { MaterialRepository } from '../foundation/materials/core/MaterialRepository';
import { MutableMatrix44 } from '../foundation/math/MutableMatrix44';
import { MutableQuaternion } from '../foundation/math/MutableQuaternion';
import { MutableScalar } from '../foundation/math/MutableScalar';
import { MutableVector3 } from '../foundation/math/MutableVector3';
import { Vector3 } from '../foundation/math/Vector3';
import { Vector4 } from '../foundation/math/Vector4';
import { Is } from '../foundation/misc/Is';
import { Logger } from '../foundation/misc/Logger';
/* eslint-disable @typescript-eslint/no-empty-function */
import { CGAPIResourceRepository } from '../foundation/renderer/CGAPIResourceRepository';
import { ModuleManager } from '../foundation/system/ModuleManager';
import { System } from '../foundation/system/System';
import { SystemState } from '../foundation/system/SystemState';
import type { Index } from '../types/CommonTypes';
import type { WebGLContextWrapper } from '../webgl/WebGLContextWrapper';
import type { WebGLResourceRepository } from '../webgl/WebGLResourceRepository';
import type { WebGLStereoUtil } from '../webgl/WebGLStereoUtil';
import type { WebGpuResourceRepository } from '../webgpu/WebGpuResourceRepository';
import { createMotionController, getMotionController, updateGamePad, updateMotionControllerModel } from './WebXRInput';
declare const navigator: Navigator;
declare const window: any;
const defaultUserPositionInVR = Vector3.fromCopyArray([0.0, 1.1, 0]);

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
export class WebXRSystem {
  private static __instance: WebXRSystem;
  private __xrSession?: XRSession;
  private __xrReferenceSpace?: XRReferenceSpace;
  private __webglLayer?: XRWebGLLayer;
  private __glw?: WebGLContextWrapper;
  private __xrViewerPose?: XRViewerPose | null;
  private __isWebXRMode = false;
  private __spaceType: XRReferenceSpaceType = 'local';
  private __requestedToEnterWebXR = false;
  private __isReadyForWebXR = false;
  private __defaultPositionInLocalSpaceMode = defaultUserPositionInVR;
  private __canvasWidthForVR = 0;
  private __canvasHeightForVR = 0;
  private __viewerEntity: ISceneGraphEntity;
  private __leftCameraEntity: ICameraEntity;
  private __rightCameraEntity: ICameraEntity;
  private __basePath?: string;
  private __controllerEntities: ISceneGraphEntity[] = [];
  private __xrInputSources: XRInputSource[] = [];
  private __viewerTranslate = MutableVector3.zero();
  private __viewerAzimuthAngle = MutableScalar.zero();
  private __viewerOrientation = MutableQuaternion.identity();
  private __viewerScale = MutableVector3.one();
  private __multiviewFramebufferHandle = -1;
  private __multiviewColorTextureHandle = -1;
  private __webglStereoUtil?: WebGLStereoUtil;

  /**
   * Private constructor for singleton pattern.
   * Initializes the viewer entity and left/right camera entities for stereo rendering.
   * Sets up the scene graph hierarchy with cameras as children of the viewer entity.
   */
  private constructor() {
    this.__viewerEntity = createGroupEntity();
    this.__viewerEntity.tryToSetUniqueName('WebXR Viewer', true);
    this.__viewerEntity.tryToSetTag({
      tag: 'type',
      value: 'background-assets',
    });

    this.__leftCameraEntity = createCameraEntity();
    this.__leftCameraEntity.tryToSetUniqueName('WebXR Left Camera', true);
    this.__leftCameraEntity.tryToSetTag({
      tag: 'type',
      value: 'background-assets',
    });
    this.__leftCameraEntity.getCamera()._xrLeft = true;

    this.__rightCameraEntity = createCameraEntity();
    this.__rightCameraEntity.tryToSetUniqueName('WebXR Right Camera', true);
    this.__rightCameraEntity.tryToSetTag({
      tag: 'type',
      value: 'background-assets',
    });
    this.__rightCameraEntity.getCamera()._xrRight = true;

    this.__viewerEntity.getSceneGraph().addChild(this.__leftCameraEntity.getSceneGraph());
    this.__viewerEntity.getSceneGraph().addChild(this.__rightCameraEntity.getSceneGraph());
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
  async readyForWebXR(requestButtonDom: HTMLElement, basePath: string) {
    if (typeof window === 'undefined') {
      throw new Error('This method works in Browser environment');
    }
    this.__basePath = basePath;
    await ModuleManager.getInstance().loadModule('xr');

    const glw = CGAPIResourceRepository.getWebGLResourceRepository().currentWebGLContextWrapper;
    if (glw == null) {
      Logger.error('WebGL Context is not ready yet.');
      return [];
    }
    this.__glw = glw;
    const supported = await navigator.xr!.isSessionSupported('immersive-vr');
    if (supported) {
      if (requestButtonDom) {
        requestButtonDom.style.display = 'block';
      } else {
        const paragraph = document.createElement('p');
        const anchor = document.createElement('a');
        anchor.setAttribute('id', 'enter-vr');
        const enterVr = document.createTextNode('Enter VR');

        anchor.appendChild(enterVr);
        paragraph.appendChild(anchor);

        const canvas = glw.canvas;
        canvas.parentNode!.insertBefore(paragraph, canvas);
        window.addEventListener('click', this.enterWebXR.bind(this) as any);
      }

      this.__isReadyForWebXR = true;
    } else {
      throw new Error('WebXR is not supported in this environment.');
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
    callbackOnXrSessionStart = () => {},
    callbackOnXrSessionEnd = () => {},
    profilePriorities = [],
  }: {
    initialUserPosition?: Vector3;
    callbackOnXrSessionStart: () => void;
    callbackOnXrSessionEnd: () => void;
    profilePriorities: string[];
  }) {
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();

    if (cgApiResourceRepository != null && this.__isReadyForWebXR) {
      let referenceSpace: XRReferenceSpace;
      const isWebGPU = SystemState.currentProcessApproach === ProcessApproach.WebGPU;
      const requiredFeatures: string[] = isWebGPU ? ['webgpu'] : [];
      const xrSession = (await navigator.xr!.requestSession('immersive-vr', { requiredFeatures })) as XRSession;

      xrSession.addEventListener('end', () => {
        if (!isWebGPU) {
          const glw = (cgApiResourceRepository as WebGLResourceRepository).currentWebGLContextWrapper!;
          glw.__gl.bindFramebuffer(glw.__gl.FRAMEBUFFER, null);
        }
        this.__xrSession = undefined;
        this.__webglLayer = undefined;
        this.__xrViewerPose = undefined;
        this.__xrReferenceSpace = undefined;
        this.__spaceType = 'local';
        this.__isReadyForWebXR = false;
        this.__requestedToEnterWebXR = false;
        this.__xrInputSources.length = 0;
        this.__setWebXRMode(false);
        MaterialRepository._makeShaderInvalidateToAllMaterials();
        this.__defaultPositionInLocalSpaceMode = defaultUserPositionInVR;
        Logger.info('XRSession ends.');
        System.stopRenderLoop();
        System.restartRenderLoop();
        callbackOnXrSessionEnd();
      });

      const promiseFn = (resolve: (entities: IEntity[]) => void) => {
        xrSession.addEventListener('inputsourceschange', (e: any) => {
          this.__onInputSourcesChange(e, resolve, profilePriorities);
        });
      };
      const promise = new Promise(promiseFn);

      // try {
      //   referenceSpace = await session.requestReferenceSpace('local-floor');
      //   this.__spaceType = 'local-floor';
      //   this.__defaultPositionInLocalSpaceMode =
      //     initialUserPosition ?? Vector3.zero();
      // } catch (err) {
      // Logger.error(`Failed to start XRSession: ${err}`);
      // eslint-disable-next-line prefer-const
      referenceSpace = await xrSession.requestReferenceSpace('local');
      this.__spaceType = 'local';
      this.__defaultPositionInLocalSpaceMode = initialUserPosition ?? defaultUserPositionInVR;
      this.__xrReferenceSpace = referenceSpace;

      this.__xrSession = xrSession;
      System.stopRenderLoop();
      if (isWebGPU) {
        const webgpuDeviceWrapper = (cgApiResourceRepository as WebGpuResourceRepository).getWebGpuDeviceWrapper();
        const webgpuDevice = webgpuDeviceWrapper.gpuDevice;
        const xrGpuBinding = new window.XRGPUBinding(xrSession, webgpuDevice);
        const projectionLayer = xrGpuBinding.createProjectionLayer({
          colorFormat: xrGpuBinding.getPreferredColorFormat(),
          depthStencilFormat: 'depth24plus',
        });
        await this.__setupWebGPULayer(xrSession, projectionLayer, callbackOnXrSessionStart);
      } else {
        await this.__setupWebGLLayer(xrSession, callbackOnXrSessionStart);
      }
      this.__requestedToEnterWebXR = true;
      System.restartRenderLoop();
      Logger.warn('End of enterWebXR.');
      return promise;
    }
    Logger.error('WebGL context or WebXRSession is not ready yet.');
    return undefined;
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
    if (this.__xrSession != null) {
      // End the XR session now.
      await this.__xrSession.end();
    }
  }

  /// Getter Methods

  /**
   * Gets the canvas width configured for VR rendering.
   *
   * @returns The width of the VR canvas in pixels.
   */
  getCanvasWidthForVr() {
    return this.__canvasWidthForVR;
  }

  /**
   * Gets the canvas height configured for VR rendering.
   *
   * @returns The height of the VR canvas in pixels.
   */
  getCanvasHeightForVr() {
    return this.__canvasHeightForVR;
  }

  /**
   * Gets all currently tracked controller entities.
   *
   * @returns Array of scene graph entities representing VR controllers.
   */
  getControllerEntities() {
    return this.__controllerEntities;
  }

  /// Accessors

  /**
   * Gets the view matrix for the left eye camera.
   *
   * @returns The view matrix for left eye rendering.
   */
  get leftViewMatrix() {
    return this.__leftCameraEntity.getCamera().viewMatrix;
  }

  /**
   * Gets the view matrix for the right eye camera.
   *
   * @returns The view matrix for right eye rendering.
   */
  get rightViewMatrix() {
    return this.__rightCameraEntity.getCamera().viewMatrix;
  }

  /**
   * Gets the projection matrix for the left eye.
   * Derived from the XR system's view information.
   *
   * @returns The projection matrix for left eye rendering.
   */
  get leftProjectionMatrix() {
    const xrViewLeft = this.__xrViewerPose?.views[0];
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
    const xrViewRight = this.__xrViewerPose?.views[1];
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
    // if (this.__multiviewFramebufferHandle > 0) {
    //   const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    //   const framebuffer = webglResourceRepository.getWebGLResource(
    //     this.__multiviewFramebufferHandle
    //   );
    //   return framebuffer as WebGLFramebuffer | undefined;
    // }

    return this.__xrSession?.renderState.baseLayer?.framebuffer;
  }

  /**
   * Checks if multiview rendering is supported and enabled.
   *
   * @returns True if multiview VR rendering is supported.
   */
  isMultiView() {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    return webglResourceRepository.isSupportMultiViewVRRendering();
  }

  /**
   * Checks if a WebXR session has been requested.
   *
   * @returns True if WebXR session entry has been requested.
   */
  get requestedToEnterWebXR() {
    return this.__requestedToEnterWebXR;
  }

  /**
   * Gets the current XR session object.
   *
   * @returns The active XRSession, or undefined if no session is active.
   */
  get xrSession() {
    return this.__xrSession;
  }

  /**
   * Legacy property for backward compatibility.
   *
   * @deprecated Use requestedToEnterWebXR instead.
   * @returns True if WebXR session entry has been requested.
   */
  get requestedToEnterWebVR() {
    return this.__requestedToEnterWebXR;
  }

  /**
   * Checks if currently in WebXR rendering mode.
   *
   * @returns True if WebXR mode is active.
   */
  get isWebXRMode() {
    return this.__isWebXRMode;
  }

  /**
   * Sets the WebXR mode state for this system and the WebGL context.
   *
   * @param mode - Whether WebXR mode should be enabled.
   */
  private __setWebXRMode(mode: boolean) {
    this.__isWebXRMode = mode;
    this.__glw!._isWebXRMode = mode;
  }

  /**
   * Checks if the system is ready to enter WebXR.
   *
   * @returns True if WebXR initialization is complete and ready for session start.
   */
  get isReadyForWebXR() {
    return this.__isReadyForWebXR;
  }

  /// Public Static Methods

  /**
   * Gets the singleton instance of WebXRSystem.
   * Creates a new instance if one doesn't exist.
   *
   * @returns The singleton WebXRSystem instance.
   */
  static getInstance() {
    if (!this.__instance) {
      this.__instance = new WebXRSystem();
    }

    return this.__instance;
  }

  /// Friend methods

  /**
   * Gets the view matrix for the specified eye.
   *
   * @internal
   * @param index - Eye index (0: left, 1: right).
   * @returns The view matrix for the specified eye.
   */
  _getViewMatrixAt(index: Index) {
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
  _getProjectMatrixAt(index: Index) {
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
  _getViewportAt(index: Index) {
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
    return Vector4.fromCopyArray([0, 0, this.__canvasWidthForVR / 2, this.__canvasHeightForVR]);
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
      return Vector4.fromCopyArray([0, 0, this.__canvasWidthForVR / 2, this.__canvasHeightForVR]);
    }
    return Vector4.fromCopyArray([
      this.__canvasWidthForVR / 2,
      0,
      this.__canvasWidthForVR / 2,
      this.__canvasHeightForVR,
    ]);
  }

  /**
   * Updates camera projection matrices and pushes values to the global data repository.
   * Called during the rendering pipeline to ensure cameras have current XR projection data.
   *
   * @internal
   */
  _setValuesToGlobalDataRepository() {
    this.__leftCameraEntity.getCamera().projectionMatrix = this.leftProjectionMatrix;
    this.__rightCameraEntity.getCamera().projectionMatrix = this.rightProjectionMatrix;
    this.__leftCameraEntity.getCamera().setValuesToGlobalDataRepository();
    this.__rightCameraEntity.getCamera().setValuesToGlobalDataRepository();
  }

  /**
   * Gets the world position of the specified VR camera.
   * Combines XR pose data with user position offset and viewer transformations.
   *
   * @internal
   * @param displayIdx - Eye index (0: left, 1: right).
   * @returns The world position of the VR camera.
   */
  _getCameraWorldPositionAt(displayIdx: Index) {
    const xrView = this.__xrViewerPose?.views[displayIdx];
    if (Is.exist(xrView)) {
      const pos = xrView.transform.position;
      const def = this.__defaultPositionInLocalSpaceMode;
      const translate = this.__viewerTranslate;
      const viewerHeadPos = Vector3.add(Vector3.fromCopyArray([pos.x, pos.y, pos.z]), def);
      return Vector3.fromCopyArray([
        (viewerHeadPos.x + translate.x) * this.__viewerScale.x,
        (viewerHeadPos.y + translate.y) * this.__viewerScale.y,
        (viewerHeadPos.z + translate.z) * this.__viewerScale.z,
      ]);
    }
    return this.__defaultPositionInLocalSpaceMode;
  }

  /**
   * Gets the component SID (System ID) for the specified camera.
   *
   * @internal
   * @param index - Eye index (0: left, 1: right).
   * @returns The SID of the CameraComponent for the specified eye.
   */
  _getCameraComponentSIDAt(index: Index) {
    if (index === 0) {
      return this.__leftCameraEntity.getCamera().componentSID;
    }
    return this.__rightCameraEntity.getCamera().componentSID;
  }

  /**
   * Gets the camera component for the specified eye.
   *
   * @internal
   * @param index - Eye index (0: left, 1: right).
   * @returns The CameraComponent for the specified eye.
   */
  _getCameraComponentAt(index: Index) {
    if (index === 0) {
      return this.__leftCameraEntity.getCamera();
    }
    return this.__rightCameraEntity.getCamera();
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
  _preRender(time: number, xrFrame: XRFrame) {
    if (this.isWebXRMode && this.__requestedToEnterWebXR && xrFrame != null) {
      this.__updateView(xrFrame);
      this.__updateInputSources(xrFrame);
      updateGamePad(time, xrFrame, {
        viewerTranslate: this.__viewerTranslate,
        viewerScale: this.__viewerScale,
        viewerOrientation: this.__viewerOrientation,
        viewerAzimuthAngle: this.__viewerAzimuthAngle,
      });
    }
  }

  /**
   * Resets all viewer transformation parameters to their default values.
   * Useful for resetting user position and orientation to origin.
   */
  resetViewerTransform() {
    this.__viewerTranslate = MutableVector3.zero();
    this.__viewerAzimuthAngle = MutableScalar.zero();
    this.__viewerOrientation = MutableQuaternion.identity();
    this.__viewerScale = MutableVector3.one();
  }

  /**
   * Performs post-rendering cleanup for WebXR.
   * Currently handles multiview framebuffer operations when enabled.
   * Called once per frame after rendering is complete.
   *
   * @internal
   */
  _postRender() {
    if (this.__isWebXRMode) {
      // const gl = this.__glw!.getRawContextAsWebGL2()!;
      // if (this.__multiviewFramebufferHandle > 0) {
      //   const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
      //   gl.invalidateFramebuffer(gl.DRAW_FRAMEBUFFER, [gl.DEPTH_STENCIL_ATTACHMENT]);
      //   gl.bindFramebuffer(
      //     gl.DRAW_FRAMEBUFFER,
      //     this.__xrSession!.renderState.baseLayer!.framebuffer!
      //   );
      //   const colorTexture = webglResourceRepository.getWebGLResource(
      //     this.__multiviewColorTextureHandle
      //   ) as WebGLTexture;
      //   this.__webglStereoUtil!.blit(
      //     colorTexture!,
      //     0,
      //     0,
      //     1,
      //     1,
      //     this.__canvasWidthForVR,
      //     this.__canvasHeightForVR
      //   );
      // }
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
  private async __onInputSourcesChange(
    event: XRInputSourcesChangeEvent,
    resolve: (entities: ISceneGraphEntity[]) => void,
    profilePriorities: string[]
  ) {
    this.__xrInputSources.length = 0;
    for (const xrInputSource of event.added) {
      this.__xrInputSources.push(xrInputSource);
      const controller = await createMotionController(xrInputSource, this.__basePath as string, profilePriorities);
      if (Is.exist(controller)) {
        this.__controllerEntities.push(controller);
        this.__viewerEntity.getSceneGraph()!.addChild(controller.getSceneGraph()!);
      }
    }
    resolve(this.__controllerEntities);
  }

  /**
   * Updates camera information from XR viewer pose data.
   * Calculates and applies transformations for left and right eye cameras based on XR pose.
   *
   * @private
   * @param xrViewerPose - The XRViewerPose containing view and transform data.
   */
  private __setCameraInfoFromXRViews(xrViewerPose: XRViewerPose) {
    if (Is.not.exist(xrViewerPose)) {
      Logger.warn('xrViewerPose not exist');
      return;
    }
    const xrViewLeft = xrViewerPose.views[0];
    const xrViewRight = xrViewerPose.views[1];
    if (Is.not.exist(xrViewLeft) || Is.not.exist(xrViewRight)) {
      return;
    }

    const orientation = xrViewerPose.transform.orientation;
    this.__viewerOrientation.x = orientation.x;
    this.__viewerOrientation.y = orientation.y;
    this.__viewerOrientation.z = orientation.z;
    this.__viewerOrientation.w = orientation.w;

    const lm = MutableMatrix44.fromCopyFloat32ArrayColumnMajor(xrViewLeft?.transform.matrix as Float32Array);
    const rm = MutableMatrix44.fromCopyFloat32ArrayColumnMajor(xrViewRight?.transform.matrix as Float32Array);

    const rotateMatLeft = lm;
    const rotateMatRight = rm;

    const scale = this.__viewerScale.x;
    const pos = xrViewLeft.transform.position;
    const translateLeftScaled = MutableVector3.add(this.__defaultPositionInLocalSpaceMode, this.__viewerTranslate);
    const translateRightScaled = MutableVector3.add(this.__defaultPositionInLocalSpaceMode, this.__viewerTranslate);
    const xrViewerPosLeft = Vector3.fromCopyArray([pos.x, pos.y, pos.z]);
    const xrViewerPosRight = Vector3.fromCopyArray([pos.x, pos.y, pos.z]);
    const translateLeft = MutableVector3.add(this.__defaultPositionInLocalSpaceMode, this.__viewerTranslate).add(
      xrViewerPosLeft
    );
    const translateRight = MutableVector3.add(this.__defaultPositionInLocalSpaceMode, this.__viewerTranslate).add(
      xrViewerPosRight
    );
    const viewerTranslateScaledX = (translateLeftScaled.x + translateRightScaled.x) / 2;
    const viewerTranslateScaledZ = (translateLeftScaled.z + translateRightScaled.z) / 2;
    const viewerTranslateX = (translateLeft.x + translateRight.x) / 2;
    const viewerTranslateZ = (translateLeft.z + translateRight.z) / 2;
    const viewerTransform = this.__viewerEntity.getTransform()!;
    viewerTransform.localPosition = Vector3.fromCopyArray([viewerTranslateScaledX, 0, viewerTranslateScaledZ]);
    viewerTransform.localScale = Vector3.fromCopyArray([scale, scale, scale]);
    viewerTransform.localEulerAngles = Vector3.fromCopyArray([0, this.__viewerAzimuthAngle.x, 0]);

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

    this.__leftCameraEntity.getTransform()!.localMatrix = rotateMatLeft;
    this.__rightCameraEntity.getTransform()!.localMatrix = rotateMatRight;
  }

  /**
   * Sets up the WebGL layer for XR rendering.
   * Makes the WebGL context XR-compatible and configures the XR session's base layer.
   *
   * @private
   * @param xrSession - The XRSession to configure.
   * @param callbackOnXrSessionStart - Callback to execute when setup is complete.
   */
  private async __setupWebGLLayer(xrSession: XRSession, callbackOnXrSessionStart: () => void) {
    const gl = this.__glw?.getRawContextAsWebGL2();

    if (gl != null) {
      // Make sure the canvas context we want to use is compatible with the current xr device.
      await (gl as any).makeXRCompatible();
      // The content that will be shown on the device is defined by the session's
      // baseLayer.

      if (typeof window === 'undefined') {
        throw new Error('This method works in Browser environment');
      }

      this.__webglLayer = new window.XRWebGLLayer(xrSession, gl) as XRWebGLLayer;
      const webglLayer = this.__webglLayer;
      xrSession.updateRenderState({
        baseLayer: webglLayer,
        depthNear: 0.01,
        depthFar: 1000,
      });
      const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
      this.__canvasWidthForVR = webglLayer.framebufferWidth;
      this.__canvasHeightForVR = webglLayer.framebufferHeight;
      Logger.info(this.__canvasWidthForVR.toString());
      Logger.info(this.__canvasHeightForVR.toString());

      // if (this.__multiviewFramebufferHandle === -1) {
      // const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
      // [this.__multiviewFramebufferHandle, this.__multiviewColorTextureHandle] =
      //   webglResourceRepository.createMultiviewFramebuffer(
      //     webglLayer.framebufferWidth,
      //     webglLayer.framebufferHeight,
      //     4
      //   );
      // this.__webglStereoUtil = new WebGLStereoUtil(gl);
      // }

      MaterialRepository._makeShaderInvalidateToAllMaterials();

      webglResourceRepository.resizeCanvas(this.__canvasWidthForVR, this.__canvasHeightForVR);
      this.__setWebXRMode(true);
      callbackOnXrSessionStart();
    } else {
      Logger.error('WebGL context is not ready for WebXR.');
    }
  }

  private async __setupWebGPULayer(
    xrSession: XRSession,
    projectionLayer: XRLayer,
    callbackOnXrSessionStart: () => void
  ) {
    xrSession.updateRenderState({ layers: [projectionLayer] });
    this.__setWebXRMode(true);
    callbackOnXrSessionStart();
  }

  /**
   * Updates the viewer pose from the current XR frame.
   * Retrieves the current viewer pose and updates camera transformations.
   *
   * @private
   * @param xrFrame - The current XRFrame containing pose data.
   */
  private __updateView(xrFrame: XRFrame) {
    this.__xrViewerPose = xrFrame.getViewerPose(this.__xrReferenceSpace!);
    this.__setCameraInfoFromXRViews(this.__xrViewerPose!);
  }

  /**
   * Updates the transforms and states of XR input sources (controllers).
   * Applies XR pose data to controller entities and updates their visual models.
   *
   * @private
   * @param xrFrame - The current XRFrame containing input source pose data.
   */
  private __updateInputSources(xrFrame: XRFrame) {
    this.__xrInputSources.forEach((input, i) => {
      if (Is.exist(input.gripSpace)) {
        const xrPose = xrFrame.getPose(input.gripSpace, this.__xrReferenceSpace!);
        if (Is.exist(xrPose)) {
          const hand = this.__controllerEntities[i];
          if (Is.exist(hand)) {
            // update the transform of the controller itself
            const handWorldMatrix = MutableMatrix44.fromCopyFloat32ArrayColumnMajor(xrPose.transform.matrix);
            const rotateMat = MutableMatrix44.fromCopyMatrix44(handWorldMatrix);
            rotateMat.translateY += this.__defaultPositionInLocalSpaceMode.y;
            rotateMat.translateY += this.__viewerTranslate.y;
            hand.getTransform()!.localMatrix = rotateMat;

            // update the components (buttons, etc...) of the controller
            const motionController = getMotionController(input);
            if (Is.exist(motionController)) {
              updateMotionControllerModel(hand, motionController);
            } else {
              Logger.warn('motionController not found');
            }
          }
        }
      }
    });
  }
}
