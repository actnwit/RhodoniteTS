/* eslint-disable @typescript-eslint/no-empty-function */
import { createCameraEntity } from '../foundation/components/Camera/createCameraEntity';
import { ICameraEntity } from '../foundation/helpers/EntityHelper';
import { MutableMatrix44 } from '../foundation/math/MutableMatrix44';
import { MutableQuaternion } from '../foundation/math/MutableQuaternion';
import { MutableScalar } from '../foundation/math/MutableScalar';
import { MutableVector3 } from '../foundation/math/MutableVector3';
import { Vector3 } from '../foundation/math/Vector3';
import { Is } from '../foundation/misc/Is';
import { IOption, None, Some } from '../foundation/misc/Option';
import { CGAPIResourceRepository } from '../foundation/renderer/CGAPIResourceRepository';
import { ModuleManager } from '../foundation/system/ModuleManager';
import { System } from '../foundation/system/System';
import { WebGLContextWrapper } from '../webgl/WebGLContextWrapper';

const defaultUserPositionInVR = Vector3.fromCopyArray([0.0, 1.1, 0]);
declare const window: any;

export class WebARSystem {
  private static __instance: WebARSystem;
  private __oGlw: IOption<WebGLContextWrapper> = new None();
  private __isReadyForWebAR = false;
  private __oArSession: IOption<XRSession> = new None();
  private __oWebglLayer: IOption<XRWebGLLayer> = new None();
  private __spaceType: 'local' | 'local-floor' = 'local';
  private __isWebARMode = false;
  private __requestedToEnterWebAR = false;
  private __oArViewerPose: IOption<XRViewerPose> = new None();
  private __oArReferenceSpace: IOption<XRReferenceSpace> = new None();
  private __defaultPositionInLocalSpaceMode = defaultUserPositionInVR;
  private __canvasWidthForAR = 0;
  private __canvasHeightForAR = 0;
  private _cameraEntity: ICameraEntity = createCameraEntity();
  private __viewerTranslate = MutableVector3.zero();
  private __viewerAzimuthAngle = MutableScalar.zero();
  private __viewerOrientation = MutableQuaternion.identity();
  private __viewerScale = MutableVector3.one();

  constructor() {
    this._cameraEntity.tryToSetUniqueName('WebAR Viewer', true);
    this._cameraEntity.tryToSetTag({
      tag: 'type',
      value: 'background-assets',
    });
  }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new WebARSystem();
    }

    return this.__instance;
  }

  /**
   * Ready for WebAR
   *
   * @param requestButtonDom
   * @returns true: prepared properly, false: failed to prepare
   */
  async readyForWebAR(requestButtonDom: HTMLElement) {
    await ModuleManager.getInstance().loadModule('xr');

    const glw = CGAPIResourceRepository.getWebGLResourceRepository().currentWebGLContextWrapper;
    if (glw == null) {
      throw new Error('WebGL Context is not ready yet.');
    }
    this.__oGlw = new Some(glw);
    const supported = await navigator.xr!.isSessionSupported('immersive-ar');
    if (supported) {
      console.log('WebAR is supported.');
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
   * Enter to WebXR (AR mode)
   * @param initialUserPosition the initial user position in world space
   * @param callbackOnXrSessionEnd the callback function for XrSession ending
   * @returns boolean value about succeeded or not
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
        console.log('XRSession ends.');
        System.stopRenderLoop();
        System.restartRenderLoop();
        callbackOnXrSessionEnd();
      });

      const referenceSpace = await session.requestReferenceSpace('local');
      this.__spaceType = 'local';
      this.__defaultPositionInLocalSpaceMode = initialUserPosition ?? defaultUserPositionInVR;
      this.__oArReferenceSpace = new Some(referenceSpace);
      System.stopRenderLoop();
      await this.__setupWebGLLayer(session, callbackOnXrSessionStart);
      this.__requestedToEnterWebAR = true;
      System.restartRenderLoop();
      console.warn('End of enterWebXR.');
      return;
    } else {
      console.error('WebGL context or WebXRSession is not ready yet.');
      return;
    }
  }

  private async __setupWebGLLayer(xrSession: XRSession, callbackOnXrSessionStart: () => void) {
    const gl = this.__oGlw.unwrapForce().getRawContext();

    if (gl != null) {
      // Make sure the canvas context we want to use is compatible with the current xr device.
      await (gl as any).makeXRCompatible();
      // The content that will be shown on the device is defined by the session's
      // baseLayer.

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
      console.log(this.__canvasWidthForAR);
      console.log(this.__canvasHeightForAR);
      webglResourceRepository.resizeCanvas(this.__canvasWidthForAR, this.__canvasHeightForAR);
      this.__isWebARMode = true;
      callbackOnXrSessionStart();
    } else {
      console.error('WebGL context is not ready for WebXR.');
    }
  }

  /**
   * Disable WebXR (Close the XrSession)
   */
  async exitWebAR() {
    if (this.__oArSession.has()) {
      // End the XR session now.
      await this.__oArSession.get().end();
    }
  }

  /// Getter Methods

  getCanvasWidthForVr() {
    return this.__canvasWidthForAR;
  }

  getCanvasHeightForVr() {
    return this.__canvasHeightForAR;
  }

  get viewMatrix() {
    return this._cameraEntity.getCamera().viewMatrix;
  }

  private __updateView(xrFrame: XRFrame) {
    this.__oArViewerPose = new Some(xrFrame.getViewerPose(this.__oArReferenceSpace.unwrapForce())!);
    this.__setCameraInfoFromXRViews(this.__oArViewerPose.unwrapForce());
  }

  private __setCameraInfoFromXRViews(xrViewerPose: XRViewerPose) {
    if (Is.not.exist(xrViewerPose)) {
      console.warn('xrViewerPose not exist');
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

    const m = MutableMatrix44.fromCopyFloat32ArrayColumnMajor(
      xrView?.transform.matrix as Float32Array
    );

    const rotateMat = m;

    const scale = this.__viewerScale.x;
    const pos = xrView.transform.position;
    const translateScaled = MutableVector3.add(
      this.__defaultPositionInLocalSpaceMode,
      this.__viewerTranslate
    );
    const xrViewerPos = Vector3.fromCopyArray([pos.x, pos.y, pos.z]);
    const translate = MutableVector3.add(
      this.__defaultPositionInLocalSpaceMode,
      this.__viewerTranslate
    ).add(xrViewerPos);
    const viewerTranslateScaledX = translateScaled.x;
    const viewerTranslateScaledZ = translateScaled.z;
    const viewerTranslateX = translate.x;
    const viewerTranslateZ = translate.z;
    const viewerTransform = this._cameraEntity.getTransform()!;
    viewerTransform.localPosition = Vector3.fromCopyArray([
      viewerTranslateScaledX,
      0,
      viewerTranslateScaledZ,
    ]);
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

  get projectionMatrix() {
    const xrView = this.__oArViewerPose.unwrapForce().views[0];
    return MutableMatrix44.fromCopyFloat32ArrayColumnMajor(
      Is.exist(xrView) ? xrView.projectionMatrix : MutableMatrix44.identity()._v
    );
  }

  /**
   * Pre process for rendering
   * @internal
   * @param xrFrame XRFrame object
   */
  _preRender(time: number, xrFrame: XRFrame) {
    if (this.isWebARMode && this.__requestedToEnterWebAR && xrFrame != null) {
      this.__updateView(xrFrame);
    }
  }

  /**
   * Post process for rendering
   * @internal
   */
  _postRender() {
    if (this.isWebARMode) {
      const gl = this.__oGlw.unwrapForce().getRawContext();
      // gl?.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    if (this.requestedToEnterWebAR) {
      // this.__isWebXRMode = true;
    }
  }

  get isWebARMode() {
    return this.__isWebARMode;
  }

  get isReadyForWebAR() {
    return this.__isReadyForWebAR;
  }

  get requestedToEnterWebAR() {
    return this.__requestedToEnterWebAR;
  }

  get arSession() {
    return this.__oArSession.unwrapOrUndefined();
  }

  get framebuffer() {
    return this.__oArSession.unwrapOrUndefined()?.renderState.baseLayer?.framebuffer;
  }
}
