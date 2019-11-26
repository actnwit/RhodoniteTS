import CGAPIResourceRepository from "../foundation/renderer/CGAPIResourceRepository";

export default class WebVRSystem {
  private __isWebVRMode = false;
  private __webvrFrameData?: VRFrameData;
  private __webvrDisplay?: VRDisplay;
  private __requestedToEnterWebVR = false;
  private __isReadyForWebVR = false;
  private __animationFrameObject: Window|VRDisplay = window;
  private __defaultUserSittingPositionInVR = false;
  private __minRenderWidthFromUser = 0;
  private __minRenderHeightFromUser = 0;
  private __canvasWidthBackup = 0;
  private __canvasHeightBackup = 0;

  async enterWebVR(
    initialUserSittingPositionIfStageParametersDoNotExist: boolean = false,
    minRenderWidth?: number,
    minRenderHeight?: number
  ) {
    return new Promise((resolve, reject) => {
      const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
      const glw = webglResourceRepository.currentWebGLContextWrapper;
      if (glw != null && this.__webvrDisplay != null && !this.__webvrDisplay.isPresenting) {

        if (initialUserSittingPositionIfStageParametersDoNotExist) {
          this.__defaultUserSittingPositionInVR = initialUserSittingPositionIfStageParametersDoNotExist;
        }
        if (minRenderWidth != null)  {
          this.__minRenderWidthFromUser = minRenderWidth;
        }
        if (minRenderHeight != null) {
          this.__minRenderHeightFromUser = minRenderHeight;
        }

        this.__animationFrameObject = this.__webvrDisplay;
        const leftEye = this.__webvrDisplay.getEyeParameters("left");
        const rightEye = this.__webvrDisplay.getEyeParameters("right");


        this.__canvasWidthBackup = glw.width;
        this.__canvasHeightBackup = glw.height;

        if (
          this.__minRenderWidthFromUser > leftEye.renderWidth &&
          this.__minRenderHeightFromUser > rightEye.renderWidth
        ) {
          webglResourceRepository.resizeCanvas(
            this.__minRenderWidthFromUser * 2,
            this.__minRenderHeightFromUser
          );
        } else {
          webglResourceRepository.resizeCanvas(
            Math.max(leftEye.renderWidth, rightEye.renderWidth) * 2,
            Math.max(leftEye.renderHeight, rightEye.renderHeight)
          );
        }
        this.__webvrDisplay
          .requestPresent([{ source: glw.canvas }])
          .then(() => {
            //this.__switchAnimationFrameFunctions(this.__webvrDisplay);
            this.__requestedToEnterWebVR = true;
            resolve();
          })
          .catch(() => {
            console.error(
              "Failed to requestPresent. Please check your VR Setting, or something wrong with your VR system?"
            );
            reject();
          });
      } else {
        reject("WebGL context or WebVRDisplay is not readly yet.")
      }
    });
  }

  async readyForWebVR(requestButtonDom: HTMLElement) {

    return new Promise((resolve, reject) => {
      const glw = CGAPIResourceRepository.getWebGLResourceRepository().currentWebGLContextWrapper;
      if (glw == null) {
        reject("WebGL Context is not ready yet.");
        return;
      }
      if (window.VRFrameData) {
        this.__webvrFrameData = new window.VRFrameData();
      } else {
        reject("WebVR is not supported in this environment.")
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
                  requestButtonDom.style.display = "block";
                } else {
                  const paragrach = document.createElement("p");
                  const anchor = document.createElement("a");
                  anchor.setAttribute("id", "enter-vr");
                  const enterVr = document.createTextNode("Enter VR");

                  anchor.appendChild(enterVr);
                  paragrach.appendChild(anchor);

                  const canvas = glw.canvas;
                  canvas.parentNode!.insertBefore(paragrach, canvas);
                  window.addEventListener("click", this.enterWebVR.bind(this) as any);
                }

                this.__isReadyForWebVR = true;
                resolve();
              } else {
                console.error("Can't requestPresent now. try again.");
                reject();
              }
            } else {
              console.error(
                "Failed to get VR Display. Please check your VR Setting, or something wrong with your VR system?"
              );
              reject();
            }
          })
          .catch(() => {
            console.error(
              "Failed to get VR Displays. Please check your VR Setting."
            );
            reject();
          });
      } else {
        console.error(
          "Your browser does not support WebVR. Or it is disabled. Check again."
        );
        reject();
      }
    });
  }

  async exitWebVR() {
    this.__isWebVRMode = false;
    if (this.__webvrDisplay && this.__webvrDisplay.isPresenting) {
      await this.__webvrDisplay.exitPresent();
    }
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webglResourceRepository.resizeCanvas(this.__canvasWidthBackup, this.__canvasHeightBackup);
    this.__isReadyForWebVR = false;
    this.__animationFrameObject = window;
  }

  async disableWebVR() {
    this.__isWebVRMode = false;
    this.__requestedToEnterWebVR = false;
    this.__isReadyForWebVR = false;
    if (this.__webvrDisplay && this.__webvrDisplay.isPresenting) {
      await this.__webvrDisplay.exitPresent();
    }
    this.__animationFrameObject = window;
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
}
