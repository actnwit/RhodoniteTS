import CGAPIResourceRepository from '../foundation/renderer/CGAPIResourceRepository';
import Vector3 from '../foundation/math/Vector3';
import MutableMatrix44 from '../foundation/math/MutableMatrix44';
import {Index} from '../types/CommonTypes';
import Vector4 from '../foundation/math/Vector4';
import Entity from '../foundation/core/Entity';
import EntityRepository from '../foundation/core/EntityRepository';
import TransformComponent from '../foundation/components/TransformComponent';
import SceneGraphComponent from '../foundation/components/SceneGraphComponent';
import CameraComponent from '../foundation/components/CameraComponent';
import WebGLContextWrapper from '../webgl/WebGLContextWrapper';
import type {
  Navigator,
  XRSession,
  XRReferenceSpace,
  XRViewerPose,
  XRWebGLLayer,
  XRFrame,
  XRReferenceSpaceType,
  XRInputSourceChangeEvent,
} from 'webxr';
import System from '../foundation/system/System';
import ModuleManager from '../foundation/system/ModuleManager';
import {updateGamePad, createMotionController} from './WebXRInput';

declare const navigator: Navigator;
declare const window: any;
const defaultUserPositionInVR = new Vector3(0.0, 1.1, 0);

export default class WebXRSystem {
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
  private __canvasWidthBackup = 0;
  private __canvasHeightBackup = 0;
  private __canvasWidthForVR = 0;
  private __canvasHeightForVR = 0;
  private __leftCameraEntity: Entity;
  private __rightCameraEntity: Entity;
  private __basePath?: string;

  private constructor() {
    const repo = EntityRepository.getInstance();
    this.__leftCameraEntity = repo.createEntity([
      TransformComponent,
      SceneGraphComponent,
      CameraComponent,
    ]);
    this.__rightCameraEntity = repo.createEntity([
      TransformComponent,
      SceneGraphComponent,
      CameraComponent,
    ]);
  }

  /// Public Methods

  /**
   * Ready for WebXR
   *
   * @param requestButtonDom
   * @returns true: prepared properly, false: failed to prepare
   */
  async readyForWebXR(requestButtonDom: HTMLElement, basePath: string) {
    this.__basePath = basePath;
    await ModuleManager.getInstance().loadModule('xr');

    const glw = CGAPIResourceRepository.getWebGLResourceRepository()
      .currentWebGLContextWrapper;
    if (glw == null) {
      console.error('WebGL Context is not ready yet.');
      return false;
    }
    this.__glw = glw;
    const supported = await navigator.xr.isSessionSupported('immersive-vr');
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
      console.error('WebXR is not supported in this environment.');
      return false;
    }
    return true;
  }

  /**
   * Enter to WebXR (VR mode)
   * @param initialUserPosition the initial user position in world space
   * @param callbackOnXrSessionEnd the callback function for XrSession ending
   * @returns boolean value about succeeded or not
   */
  async enterWebXR({
    initialUserPosition,
    callbackOnXrSessionEnd = () => {},
  }: {
    initialUserPosition?: Vector3;
    callbackOnXrSessionEnd: Function;
  }) {
    this.__defaultPositionInLocalSpaceMode =
      initialUserPosition ?? defaultUserPositionInVR;
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const glw = webglResourceRepository.currentWebGLContextWrapper;

    if (this.__xrSession != null) {
      this.__requestedToEnterWebXR = true;
      this.__isWebXRMode = true;
      return true;
    }

    if (glw != null && this.__isReadyForWebXR) {
      let referenceSpace: XRReferenceSpace;
      const session = (await navigator.xr.requestSession(
        'immersive-vr'
      )) as XRSession;
      this.__xrSession = session;

      session.addEventListener('end', e => {
        this.__xrSession = undefined;
        this.__webglLayer = undefined;
        this.__xrViewerPose = undefined;
        this.__xrReferenceSpace = undefined;
        this.__spaceType = 'local';
        this.__isReadyForWebXR = false;
        this.__requestedToEnterWebXR = false;
        this.__isWebXRMode = false;
        this.__defaultPositionInLocalSpaceMode = defaultUserPositionInVR;
        console.log('XRSession ends.');
        System.getInstance().stopRenderLoop();
        System.getInstance().restartRenderLoop();
        callbackOnXrSessionEnd();
      });

      session.addEventListener('inputsourceschange', this.__onInputSourcesChange.bind(this) as EventHandlerNonNull);

      try {
        referenceSpace = await session.requestReferenceSpace('local-floor');
        this.__spaceType = 'local-floor';
      } catch (err) {
        console.error(`Failed to start XRSession: ${err}`);
        referenceSpace = await session.requestReferenceSpace('local');
        this.__spaceType = 'local';
      }
      this.__xrReferenceSpace = referenceSpace;
      await this.__setupWebGLLayer(session);
      this.__requestedToEnterWebXR = true;
      System.getInstance().stopRenderLoop();
      System.getInstance().restartRenderLoop();
      console.warn('End of enterWebXR.');
      return true;
    } else {
      console.error('WebGL context or WebXRSession is not ready yet.');
      return false;
    }
  }

  /**
   * exit from WebXR
   */
  exitWebXR() {
    this.__requestedToEnterWebXR = false;
    this.__isWebXRMode = false;
  }

  /**
   * Disable WebXR (Close the XrSession)
   */
  async disableWebXR() {
    if (this.__xrSession != null) {
      // End the XR session now.
      await this.__xrSession.end();
    }
  }

  /// Getter Methods

  getCanvasWidthForVr() {
    return this.__canvasWidthForVR;
  }

  getCanvasHeightForVr() {
    return this.__canvasHeightForVR;
  }

  /// Accessors

  get leftViewMatrix() {
    return this.__leftCameraEntity.getCamera().viewMatrix;
  }

  get rightViewMatrix() {
    return this.__rightCameraEntity.getCamera().viewMatrix;
  }

  get leftProjectionMatrix() {
    const xrViewLeft = this.__xrViewerPose?.views[0];
    return new MutableMatrix44(
      xrViewLeft?.projectionMatrix as Float32Array,
      true
    );
  }

  get rightProjectionMatrix() {
    const xrViewRight = this.__xrViewerPose?.views[1];
    return new MutableMatrix44(
      xrViewRight?.projectionMatrix as Float32Array,
      true
    );
  }

  get framebuffer() {
    return this.__xrSession?.renderState.baseLayer?.framebuffer;
  }

  get requestedToEnterWebXR() {
    return this.__requestedToEnterWebXR;
  }

  get xrSession() {
    return this.__xrSession;
  }

  get requestedToEnterWebVR() {
    return this.__requestedToEnterWebXR;
  }

  get isWebXRMode() {
    return this.__isWebXRMode;
  }

  get isReadyForWebXR() {
    return this.__isReadyForWebXR;
  }

  /// Public Static Methods

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new WebXRSystem();
    }

    return this.__instance;
  }

  /// Friend methods

  /**
   * Getter of the view matrix of right eye
   * @param index (0: left, 1: right)
   * @private
   * @returns The view matrix vector of right eye
   */
  _getViewMatrixAt(index: Index) {
    if (index === 0) {
      return this.leftViewMatrix;
    } else {
      return this.rightViewMatrix;
    }
  }

  /**
   * Getter of the project matrix of right eye
   * @param index (0: left, 1: right)
   * @private
   * @returns The project matrix of right eye
   */
  _getProjectMatrixAt(index: Index) {
    if (index === 0) {
      return this.leftProjectionMatrix;
    } else {
      return this.rightProjectionMatrix;
    }
  }

  /**
   * Getter of the viewport vector
   * @param index (0: left, 1: right)
   * @private
   * @returns the viewport vector
   */
  _getViewportAt(index: Index) {
    if (index === 0) {
      return this._getLeftViewport();
    } else {
      return this._getRightViewport();
    }
  }

  /**
   * Getter of the viewport vector of left eye
   * @private
   * @returns The viewport vector of left eye
   */
  _getLeftViewport() {
    return new Vector4(
      0,
      0,
      this.__canvasWidthForVR / 2,
      this.__canvasHeightForVR
    );
  }

  /**
   * Getter of the viewport vector of right eye
   * @private
   * @returns The viewport vector of right eye
   */
  _getRightViewport() {
    return new Vector4(
      this.__canvasWidthForVR / 2,
      0,
      this.__canvasWidthForVR / 2,
      this.__canvasHeightForVR
    );
  }

  _setValuesToGlobalDataRepository() {
    this.__leftCameraEntity.getCamera().projectionMatrix = this.leftProjectionMatrix;
    this.__rightCameraEntity.getCamera().projectionMatrix = this.rightProjectionMatrix;
    this.__leftCameraEntity.getCamera().setValuesToGlobalDataRepository();
    this.__rightCameraEntity.getCamera().setValuesToGlobalDataRepository();
  }

  /**
   * Getter of the position of the VR camera in world space
   * @private
   * @param displayIdx (0: left, 1: right)
   * @returns The position of the VR camera in world space
   */
  _getCameraWorldPositionAt(displayIdx: Index) {
    const xrView = this.__xrViewerPose?.views[displayIdx];
    const pos = xrView?.transform.position;
    if (pos != null) {
      const def = this.__defaultPositionInLocalSpaceMode;
      if (this.__spaceType === 'local') {
        return new Vector3(def.x + pos.x, def.y + pos.y, def.z + pos.z);
      } else {
        return new Vector3(pos.x, pos.y, pos.z);
      }
    } else {
      return this.__defaultPositionInLocalSpaceMode;
    }
  }

  /**
   * Getter of the CameraComponent SID of left/right eye
   * @private
   * @param index (0: left, 1: right)
   * @returns the SID of the CameraComponent of left/right eye
   */
  _getCameraComponentSIDAt(index: Index) {
    if (index === 0) {
      return this.__leftCameraEntity.getCamera().componentSID;
    } else {
      return this.__rightCameraEntity.getCamera().componentSID;
    }
  }

  /**
   * Pre process for rendering
   * @private
   * @param xrFrame XRFrame object
   */
  _preRender(time: number, xrFrame: XRFrame) {
    if (this.isWebXRMode && this.__requestedToEnterWebXR && xrFrame != null) {
      this.__xrViewerPose = xrFrame.getViewerPose(this.__xrReferenceSpace!);
      this.__setCameraInfoFromXRViews(this.__xrViewerPose!);
      updateGamePad(time, xrFrame);
    }
  }

  /**
   * Post process for rendering
   * @private
   */
  _postRender() {
    if (this.__isWebXRMode) {
      const gl = this.__glw?.getRawContext();
      // gl?.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    if (this.requestedToEnterWebVR) {
      this.__isWebXRMode = true;
    }
  }

  /// Private Methods

  private __onInputSourcesChange(event: XRInputSourceChangeEvent) {
    const added = event.added
    // const leftInputSource = added[0];
    // const rightInputSource = added[1];

    // let inputSourcePose = xrFrame.getPose(leftInputSource.targetRaySpace, this.__xrReferenceSpace!);
    // if (inputSourcePose) {
    //   // do something with the result
    //   console.log('WebXRInputSourcePose:'+ inputSourcePose.transform.position);
    // }

    event.added.forEach((xrInputSource) => {
      createMotionController(xrInputSource, this.__basePath as string);
    });
  }

  private __setCameraInfoFromXRViews(xrViewerPose: XRViewerPose) {
    const xrViewLeft = xrViewerPose?.views[0];
    const xrViewRight = xrViewerPose?.views[1];

    const lm = new MutableMatrix44(
      xrViewLeft?.transform.matrix as Float32Array,
      true
    );
    const rm = new MutableMatrix44(
      xrViewRight?.transform.matrix as Float32Array,
      true
    );
    if (this.__spaceType === 'local') {
      lm.addTranslate(this.__defaultPositionInLocalSpaceMode);
      rm.addTranslate(this.__defaultPositionInLocalSpaceMode);
    }
    this.__leftCameraEntity.getTransform().matrix = lm;
    this.__rightCameraEntity.getTransform().matrix = rm;
  }

  private async __setupWebGLLayer(xrSession: XRSession) {
    const gl = this.__glw?.getRawContext();

    if (gl != null) {
      // Make sure the canvas context we want to use is compatible with the current xr device.
      await (gl as any).makeXRCompatible();
      // The content that will be shown on the device is defined by the session's
      // baseLayer.

      this.__webglLayer = new window.XRWebGLLayer(
        xrSession,
        gl
      ) as XRWebGLLayer;
      const webglLayer = this.__webglLayer;
      xrSession.updateRenderState({
        baseLayer: webglLayer,
        depthNear: 0.1,
        depthFar: 10000,
      });
      const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
      this.__canvasWidthBackup = this.__glw!.width;
      this.__canvasHeightBackup = this.__glw!.height;
      this.__canvasWidthForVR = webglLayer.framebufferWidth;
      this.__canvasHeightForVR = webglLayer.framebufferHeight;
      console.log(this.__canvasWidthForVR);
      console.log(this.__canvasHeightForVR);
      webglResourceRepository.resizeCanvas(
        this.__canvasWidthForVR,
        this.__canvasHeightForVR
      );
    } else {
      console.error('WebGL context is not ready for WebXR.');
    }
  }
}
