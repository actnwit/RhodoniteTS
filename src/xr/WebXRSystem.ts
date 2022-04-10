import CGAPIResourceRepository from '../foundation/renderer/CGAPIResourceRepository';
import { Vector3 } from '../foundation/math/Vector3';
import MutableMatrix44 from '../foundation/math/MutableMatrix44';
import {Index} from '../types/CommonTypes';
import { Vector4 } from '../foundation/math/Vector4';
import {IEntity} from '../foundation/core/Entity';
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
  XRInputSource,
} from 'webxr';
import { System } from '../foundation/system/System';
import ModuleManager from '../foundation/system/ModuleManager';
import {
  updateGamePad,
  createMotionController,
  updateMotionControllerModel,
  getMotionController,
} from './WebXRInput';
import {Is} from '../foundation/misc/Is';
import MutableVector3 from '../foundation/math/MutableVector3';
import MutableQuaternion from '../foundation/math/MutableQuaternion';
import MutableScalar from '../foundation/math/MutableScalar';
import EntityHelper, {
  ICameraEntity,
  ISceneGraphEntity,
} from '../foundation/helpers/EntityHelper';

declare const navigator: Navigator;
declare const window: any;
const defaultUserPositionInVR = Vector3.fromCopyArray([0.0, 1.1, 0]);

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

  private constructor() {
    this.__viewerEntity = EntityHelper.createGroupEntity();
    this.__viewerEntity.tryToSetUniqueName('WebXR Viewer', true);
    this.__viewerEntity.tryToSetTag({
      tag: 'type',
      value: 'background-assets',
    });

    this.__leftCameraEntity = EntityHelper.createCameraEntity();
    this.__leftCameraEntity.tryToSetUniqueName('WebXR Left Camera', true);
    this.__leftCameraEntity.tryToSetTag({
      tag: 'type',
      value: 'background-assets',
    });
    this.__rightCameraEntity = EntityHelper.createCameraEntity();
    this.__rightCameraEntity.tryToSetUniqueName('WebXR Right Camera', true);
    this.__rightCameraEntity.tryToSetTag({
      tag: 'type',
      value: 'background-assets',
    });

    this.__viewerEntity
      .getSceneGraph()
      .addChild(this.__leftCameraEntity.getSceneGraph());
    this.__viewerEntity
      .getSceneGraph()
      .addChild(this.__rightCameraEntity.getSceneGraph());
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

    const glw =
      CGAPIResourceRepository.getWebGLResourceRepository()
        .currentWebGLContextWrapper;
    if (glw == null) {
      console.error('WebGL Context is not ready yet.');
      return [];
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
      return [];
    }
    return [];
  }

  /**
   * Enter to WebXR (VR mode)
   * @param initialUserPosition the initial user position in world space
   * @param callbackOnXrSessionEnd the callback function for XrSession ending
   * @returns boolean value about succeeded or not
   */
  async enterWebXR({
    initialUserPosition,
    callbackOnXrSessionStart = () => {},
    callbackOnXrSessionEnd = () => {},
    profilePriorities = [],
  }: {
    initialUserPosition?: Vector3;
    callbackOnXrSessionStart: Function;
    callbackOnXrSessionEnd: Function;
    profilePriorities: string[];
  }) {
    const webglResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
    const glw = webglResourceRepository.currentWebGLContextWrapper;

    if (glw != null && this.__isReadyForWebXR) {
      let referenceSpace: XRReferenceSpace;
      const session = (await navigator.xr.requestSession(
        'immersive-vr'
      )) as XRSession;
      this.__xrSession = session;

      session.addEventListener('end', () => {
        glw.__gl.bindFramebuffer(glw.__gl.FRAMEBUFFER, null);
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
        System.stopRenderLoop();
        System.restartRenderLoop();
        callbackOnXrSessionEnd();
      });

      const promiseFn = (resolve: (entities: IEntity[]) => void) => {
        session.addEventListener('inputsourceschange', (e: any) => {
          this.__onInputSourcesChange(e, resolve, profilePriorities);
        });
      };
      const promise = new Promise(promiseFn);

      try {
        referenceSpace = await session.requestReferenceSpace('local-floor');
        this.__spaceType = 'local-floor';
        this.__defaultPositionInLocalSpaceMode =
          initialUserPosition ?? Vector3.zero();
      } catch (err) {
        console.error(`Failed to start XRSession: ${err}`);
        referenceSpace = await session.requestReferenceSpace('local');
        this.__spaceType = 'local';
        this.__defaultPositionInLocalSpaceMode =
          initialUserPosition ?? defaultUserPositionInVR;
      }
      this.__xrReferenceSpace = referenceSpace;
      await this.__setupWebGLLayer(session, callbackOnXrSessionStart);
      this.__requestedToEnterWebXR = true;
      System.stopRenderLoop();
      System.restartRenderLoop();
      console.warn('End of enterWebXR.');
      return promise;
    } else {
      console.error('WebGL context or WebXRSession is not ready yet.');
      return undefined;
    }
  }

  /**
   * Disable WebXR (Close the XrSession)
   */
  async exitWebXR() {
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

  getControllerEntities() {
    return this.__controllerEntities;
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
    return Vector4.fromCopyArray([
      0,
      0,
      this.__canvasWidthForVR / 2,
      this.__canvasHeightForVR,
    ]);
  }

  /**
   * Getter of the viewport vector of right eye
   * @private
   * @returns The viewport vector of right eye
   */
  _getRightViewport() {
    return Vector4.fromCopyArray([
      this.__canvasWidthForVR / 2,
      0,
      this.__canvasWidthForVR / 2,
      this.__canvasHeightForVR,
    ]);
  }

  _setValuesToGlobalDataRepository() {
    this.__leftCameraEntity.getCamera().projectionMatrix =
      this.leftProjectionMatrix;
    this.__rightCameraEntity.getCamera().projectionMatrix =
      this.rightProjectionMatrix;
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
    if (Is.exist(xrView)) {
      const pos = xrView.transform.position;
      const def = this.__defaultPositionInLocalSpaceMode;
      const translate = this.__viewerTranslate;
      const viewerHeadPos = Vector3.add(
        Vector3.fromCopyArray([pos.x, pos.y, pos.z]),
        def
      );
      return Vector3.fromCopyArray([
        (viewerHeadPos.x + translate.x) * this.__viewerScale.x,
        (viewerHeadPos.y + translate.y) * this.__viewerScale.y,
        (viewerHeadPos.z + translate.z) * this.__viewerScale.z,
      ]);
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

  private async __onInputSourcesChange(
    event: XRInputSourceChangeEvent,
    resolve: (entities: ISceneGraphEntity[]) => void,
    profilePriorities: string[]
  ) {
    this.__xrInputSources.length = 0;
    for (const xrInputSource of event.added) {
      this.__xrInputSources.push(xrInputSource);
      const controller = await createMotionController(
        xrInputSource,
        this.__basePath as string,
        profilePriorities
      );
      if (Is.exist(controller)) {
        this.__controllerEntities.push(controller);
        this.__viewerEntity
          .getSceneGraph()!
          .addChild(controller.getSceneGraph()!);
      }
    }
    resolve(this.__controllerEntities);
  }

  private __setCameraInfoFromXRViews(xrViewerPose: XRViewerPose) {
    if (Is.not.exist(xrViewerPose)) {
      console.warn('xrViewerPose not exist');
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

    const lm = new MutableMatrix44(
      xrViewLeft?.transform.matrix as Float32Array,
      true
    );
    const rm = new MutableMatrix44(
      xrViewRight?.transform.matrix as Float32Array,
      true
    );

    const rotateMatLeft = lm;
    const rotateMatRight = rm;

    const scale = this.__viewerScale.x;
    const pos = xrViewLeft.transform.position;
    const translateLeftScaled = MutableVector3.add(
      this.__defaultPositionInLocalSpaceMode,
      this.__viewerTranslate
    );
    const translateRightScaled = MutableVector3.add(
      this.__defaultPositionInLocalSpaceMode,
      this.__viewerTranslate
    );
    const xrViewerPosLeft = Vector3.fromCopyArray([pos.x, pos.y, pos.z]);
    const xrViewerPosRight = Vector3.fromCopyArray([pos.x, pos.y, pos.z]);
    const translateLeft = MutableVector3.add(
      this.__defaultPositionInLocalSpaceMode,
      this.__viewerTranslate
    ).add(xrViewerPosLeft);
    const translateRight = MutableVector3.add(
      this.__defaultPositionInLocalSpaceMode,
      this.__viewerTranslate
    ).add(xrViewerPosRight);
    const viewerTranslateScaledX =
      (translateLeftScaled.x + translateRightScaled.x) / 2;
    const viewerTranslateScaledZ =
      (translateLeftScaled.z + translateRightScaled.z) / 2;
    const viewerTranslateX = (translateLeft.x + translateRight.x) / 2;
    const viewerTranslateZ = (translateLeft.z + translateRight.z) / 2;
    const viewerTransform = this.__viewerEntity.getTransform()!;
    viewerTransform.translate = Vector3.fromCopyArray([
      viewerTranslateScaledX,
      0,
      viewerTranslateScaledZ,
    ]);
    viewerTransform.scale = Vector3.fromCopyArray([scale, scale, scale]);
    viewerTransform.rotate = Vector3.fromCopyArray([
      0,
      this.__viewerAzimuthAngle.x,
      0,
    ]);

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

    this.__leftCameraEntity.getTransform()!.matrix = rotateMatLeft;
    this.__rightCameraEntity.getTransform()!.matrix = rotateMatRight;
  }

  private async __setupWebGLLayer(
    xrSession: XRSession,
    callbackOnXrSessionStart: Function
    ) {
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
      const webglResourceRepository =
        CGAPIResourceRepository.getWebGLResourceRepository();
      this.__canvasWidthForVR = webglLayer.framebufferWidth;
      this.__canvasHeightForVR = webglLayer.framebufferHeight;
      console.log(this.__canvasWidthForVR);
      console.log(this.__canvasHeightForVR);
      webglResourceRepository.resizeCanvas(
        this.__canvasWidthForVR,
        this.__canvasHeightForVR
      );
      callbackOnXrSessionStart();
    } else {
      console.error('WebGL context is not ready for WebXR.');
    }
  }

  private __updateView(xrFrame: XRFrame) {
    this.__xrViewerPose = xrFrame.getViewerPose(this.__xrReferenceSpace!);
    this.__setCameraInfoFromXRViews(this.__xrViewerPose!);
  }

  private __updateInputSources(xrFrame: XRFrame) {
    this.__xrInputSources.forEach((input, i) => {
      if (Is.exist(input.gripSpace)) {
        const xrPose = xrFrame.getPose(
          input.gripSpace,
          this.__xrReferenceSpace!
        );
        if (Is.exist(xrPose)) {
          const hand = this.__controllerEntities[i];
          if (Is.exist(hand)) {
            // update the transform of the controller itself
            const handWorldMatrix = new MutableMatrix44(
              xrPose.transform.matrix,
              true
            );
            const rotateMat = new MutableMatrix44(handWorldMatrix);
            rotateMat.translateY += this.__defaultPositionInLocalSpaceMode.y;
            rotateMat.translateY += this.__viewerTranslate.y;
            hand.getTransform()!.matrix = rotateMat;

            // update the components (buttons, etc...) of the controller
            const motionController = getMotionController(input);
            if (Is.exist(motionController)) {
              updateMotionControllerModel(hand, motionController);
            } else {
              console.warn('motionController not found');
            }
          }
        }
      }
    });
  }
}
