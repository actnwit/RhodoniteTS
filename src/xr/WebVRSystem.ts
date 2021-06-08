import CGAPIResourceRepository from '../foundation/renderer/CGAPIResourceRepository';
import Vector3 from '../foundation/math/Vector3';
import Matrix44 from '../foundation/math/Matrix44';
import MutableMatrix44 from '../foundation/math/MutableMatrix44';
import {Index} from '../types/CommonTypes';
import Vector4 from '../foundation/math/Vector4';
import Entity from '../foundation/core/Entity';
import EntityRepository from '../foundation/core/EntityRepository';
import TransformComponent from '../foundation/components/TransformComponent';
import SceneGraphComponent from '../foundation/components/SceneGraphComponent';
import CameraComponent from '../foundation/components/CameraComponent';
import {IMatrix44} from '../foundation/math/IMatrix';
import GlobalDataRepository from '../foundation/core/GlobalDataRepository';
import {ShaderSemantics} from '../foundation/definitions/ShaderSemantics';

export default class WebVRSystem {
  private static __instance: WebVRSystem;
  private __isWebVRMode = false;
  private __webvrFrameData?: VRFrameData;
  private __webvrDisplay?: VRDisplay;
  private __requestedToEnterWebVR = false;
  private __isReadyForWebVR = false;
  private __vrDisplay?: VRDisplay;
  private __defaultUserSittingPositionInVR = new Vector3(0.0, 1.1, 1.5);
  private __invertSittingToStandingTransform: IMatrix44 = Matrix44.identity();
  private __minRenderWidthFromUser = 0;
  private __minRenderHeightFromUser = 0;
  private __canvasWidthBackup = 0;
  private __canvasHeightBackup = 0;
  private __canvasWidthForVR = 0;
  private __canvasHeightForVR = 0;
  private __leftViewMatrix: MutableMatrix44 = MutableMatrix44.identity();
  private __rightViewMatrix: MutableMatrix44 = MutableMatrix44.identity();
  private __leftCameraEntity: Entity;
  private __rightCameraEntity: Entity;

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

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new WebVRSystem();
    }

    return this.__instance;
  }

  getFrameData() {
    if (this.__webvrDisplay == null) {
      return;
    }
    this.__webvrDisplay.getFrameData(this.__webvrFrameData!);
    if (this.__webvrDisplay.stageParameters) {
      this.__invertSittingToStandingTransform = Matrix44.invert(
        new Matrix44(
          this.__webvrDisplay.stageParameters.sittingToStandingTransform!,
          true
        )
      );
    } else {
      this.__invertSittingToStandingTransform = Matrix44.invert(
        Matrix44.translate(this.__defaultUserSittingPositionInVR)
      );
    }
  }

  async enterWebVR(
    initialUserSittingPositionIfStageParametersDoNotExist?: Vector3,
    minRenderWidth?: number,
    minRenderHeight?: number
  ) {
    return new Promise((resolve, reject) => {
      const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
      const glw = webglResourceRepository.currentWebGLContextWrapper;
      if (
        glw != null &&
        this.__webvrDisplay != null &&
        !this.__webvrDisplay.isPresenting
      ) {
        if (initialUserSittingPositionIfStageParametersDoNotExist != null) {
          this.__defaultUserSittingPositionInVR = initialUserSittingPositionIfStageParametersDoNotExist;
        }
        if (minRenderWidth != null) {
          this.__minRenderWidthFromUser = minRenderWidth;
        }
        if (minRenderHeight != null) {
          this.__minRenderHeightFromUser = minRenderHeight;
        }

        this.__vrDisplay = this.__webvrDisplay;
        const leftEye = this.__webvrDisplay.getEyeParameters('left');
        const rightEye = this.__webvrDisplay.getEyeParameters('right');

        this.__canvasWidthBackup = glw.width;
        this.__canvasHeightBackup = glw.height;
        if (
          this.__minRenderWidthFromUser > leftEye.renderWidth &&
          this.__minRenderHeightFromUser > rightEye.renderWidth
        ) {
          this.__canvasWidthForVR = this.__minRenderWidthFromUser * 2;
          this.__canvasHeightForVR = this.__minRenderHeightFromUser;
        } else {
          this.__canvasWidthForVR =
            Math.max(leftEye.renderWidth, rightEye.renderWidth) * 2;
          this.__canvasHeightForVR = Math.max(
            leftEye.renderHeight,
            rightEye.renderHeight
          );
        }
        webglResourceRepository.resizeCanvas(
          this.__canvasWidthForVR,
          this.__canvasHeightForVR
        );
        this.__webvrDisplay
          .requestPresent([{source: glw.canvas}])
          .then(() => {
            this.__requestedToEnterWebVR = true;
            console.info('requestPresent is succeeded.');
            resolve();
          })
          .catch(() => {
            console.error(
              'Failed to requestPresent. Please check your VR Setting, or something wrong with your VR system?'
            );
            reject();
          });
      } else {
        reject('WebGL context or WebVRDisplay is not ready yet.');
      }
    }) as Promise<void>;
  }

  async readyForWebVR(requestButtonDom: HTMLElement) {
    return new Promise((resolve, reject) => {
      const glw = CGAPIResourceRepository.getWebGLResourceRepository()
        .currentWebGLContextWrapper;
      if (glw == null) {
        reject('WebGL Context is not ready yet.');
        return;
      }
      if (window.VRFrameData) {
        this.__webvrFrameData = new window.VRFrameData();
      } else {
        reject('WebVR is not supported in this environment.');
      }

      if (navigator.getVRDisplays) {
        navigator
          .getVRDisplays()
          .then((vrDisplays: VRDisplay[]) => {
            if (vrDisplays.length > 0) {
              const webvrDisplay = vrDisplays[vrDisplays.length - 1];
              webvrDisplay.depthNear = 0.01;
              webvrDisplay.depthFar = 10000;

              if (webvrDisplay.capabilities.canPresent) {
                this.__webvrDisplay = webvrDisplay;

                if (requestButtonDom) {
                  requestButtonDom.style.display = 'block';
                } else {
                  const paragrach = document.createElement('p');
                  const anchor = document.createElement('a');
                  anchor.setAttribute('id', 'enter-vr');
                  const enterVr = document.createTextNode('Enter VR');

                  anchor.appendChild(enterVr);
                  paragrach.appendChild(anchor);

                  const canvas = glw.canvas;
                  canvas.parentNode!.insertBefore(paragrach, canvas);
                  window.addEventListener(
                    'click',
                    this.enterWebVR.bind(this) as any
                  );
                }

                this.__isReadyForWebVR = true;
                resolve();
              } else {
                console.error("Can't requestPresent now. try again.");
                reject();
              }
            } else {
              console.error(
                'Failed to get VR Display. Please check your VR Setting, or something wrong with your VR system?'
              );
              reject();
            }
          })
          .catch(() => {
            console.error(
              'Failed to get VR Displays. Please check your VR Setting.'
            );
            reject();
          });
      } else {
        console.error(
          'Your browser does not support WebVR. Or it is disabled. Check again.'
        );
        reject();
      }
    }) as Promise<void>;
  }

  async exitWebVR() {
    this.__isWebVRMode = false;
    if (this.__webvrDisplay && this.__webvrDisplay.isPresenting) {
      await this.__webvrDisplay.exitPresent();
    }
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webglResourceRepository.resizeCanvas(
      this.__canvasWidthBackup,
      this.__canvasHeightBackup
    );
    this.__isReadyForWebVR = false;
  }

  async disableWebVR() {
    this.__isWebVRMode = false;
    this.__requestedToEnterWebVR = false;
    this.__isReadyForWebVR = false;
    if (this.__webvrDisplay && this.__webvrDisplay.isPresenting) {
      await this.__webvrDisplay.exitPresent();
    }
    this.__webvrDisplay = void 0;
  }

  get isWebVRMode() {
    return this.__isWebVRMode;
  }

  get isReadyForWebVR() {
    return this.__isReadyForWebVR;
  }

  webVrSubmitFrame() {
    if (this.__webvrDisplay && this.__webvrDisplay.isPresenting) {
      this.__webvrDisplay.submitFrame();
    }
  }

  get webVrFrameData() {
    return this.__webvrFrameData;
  }

  get leftViewMatrix() {
    Matrix44.multiplyTo(
      new Matrix44(this.__webvrFrameData!.leftViewMatrix, true),
      this.__invertSittingToStandingTransform,
      this.__leftViewMatrix
    );
    return this.__leftViewMatrix;
  }

  get rightViewMatrix() {
    Matrix44.multiplyTo(
      new Matrix44(this.__webvrFrameData!.rightViewMatrix, true),
      this.__invertSittingToStandingTransform,
      this.__rightViewMatrix
    );
    return this.__rightViewMatrix;
  }

  get leftProjectionMatrix() {
    return new MutableMatrix44(
      this.__webvrFrameData!.leftProjectionMatrix,
      true
    );
  }

  get rightProjectionMatrix() {
    return new MutableMatrix44(
      this.__webvrFrameData!.rightProjectionMatrix,
      true
    );
  }

  getLeftViewport(originalViewport: Vector4) {
    return new Vector4(
      0,
      0,
      this.__canvasWidthForVR / 2,
      this.__canvasHeightForVR
    );
  }

  getRightViewport(originalViewport: Vector4) {
    return new Vector4(
      this.__canvasWidthForVR / 2,
      0,
      this.__canvasWidthForVR / 2,
      this.__canvasHeightForVR
    );
  }

  getViewMatrixAt(index: Index) {
    if (index === 0) {
      return this.leftViewMatrix;
    } else {
      return this.rightViewMatrix;
    }
  }

  getProjectMatrixAt(index: Index) {
    if (index === 0) {
      return this.leftProjectionMatrix;
    } else {
      return this.rightProjectionMatrix;
    }
  }

  getViewportAt(viewport: Vector4, index: Index) {
    if (index === 0) {
      return this.getLeftViewport(viewport);
    } else {
      return this.getRightViewport(viewport);
    }
  }

  getCameraWorldPosition() {
    const pos = this.__webvrDisplay?.getPose()?.position;
    if (pos != null) {
      console.log(pos);
      return new Vector3(pos);
    } else {
      return Vector3.zero();
    }
  }

  get vrDisplay() {
    return this.__vrDisplay;
  }

  setValuesToGlobalDataRepository() {
    const leftCamera = this.__leftCameraEntity.getCamera();
    const rightCamera = this.__rightCameraEntity.getCamera();
    leftCamera.viewMatrix = this.leftViewMatrix;
    rightCamera.viewMatrix = this.rightViewMatrix;
    leftCamera.projectionMatrix = this.leftProjectionMatrix;
    rightCamera.projectionMatrix = this.rightProjectionMatrix;
    leftCamera.setValuesToGlobalDataRepositoryOnlyMatrices();
    rightCamera.setValuesToGlobalDataRepositoryOnlyMatrices();
    const globalDataRepository = GlobalDataRepository.getInstance();
    const cameraPos = this.getCameraWorldPosition();
    globalDataRepository.setValue(
      ShaderSemantics.ViewPosition,
      leftCamera.componentSID,
      cameraPos
    );
    globalDataRepository.setValue(
      ShaderSemantics.ViewPosition,
      rightCamera.componentSID,
      cameraPos
    );
  }

  getCameraComponentSIDAt(index: Index) {
    if (index === 0) {
      return this.__leftCameraEntity.getCamera().componentSID;
    } else {
      return this.__rightCameraEntity.getCamera().componentSID;
    }
  }

  get requestedToEnterWebVR() {
    return this.__requestedToEnterWebVR;
  }

  _setIsWebVRMode() {
    this.__isWebVRMode = true;
  }

  getCanvasWidthForVr() {
    return this.__canvasWidthForVR;
  }

  getCanvasHeightForVr() {
    return this.__canvasHeightForVR;
  }

  preRender() {
    if (this?.isWebVRMode && this.vrDisplay?.isPresenting) {
      this.getFrameData();
    }
  }

  postRender() {
    if (this?.isWebVRMode && this.vrDisplay?.isPresenting) {
      this.vrDisplay!.submitFrame();
    }
    if (this?.requestedToEnterWebVR) {
      this._setIsWebVRMode();
    }
  }
}
