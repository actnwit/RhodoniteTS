import Component from "../core/Component";
import EntityRepository from "../core/EntityRepository";
import { WellKnownComponentTIDs } from "./WellKnownComponentTIDs";
import { ProcessStage } from "../definitions/ProcessStage";

declare var Module: any;
declare var _SPARK_Data_Delete: Function;
declare var _SPARK_Instance_Create: Function;
declare var _SPARK_Draw: Function;
declare var _SPARK_Instance_Play: Function;
declare var _SPARK_Instance_Stop: Function;
declare var _SPARK_Instance_Pause: Function;
declare var _SPARK_Instance_IsPlaying: Function;
declare var _SPARK_Instance_KickTrigger: Function;
declare var _SPARK_InitializeFor3D: Function;
declare var _SPARK_Uninitialize: Function;
declare var _SPARK_SetMatrix: Function;
declare var _SPARK_Update: Function;
declare var _SPARK_DrawAll: Function;
declare var _SPARK_DrawDebugInfo: Function;

export default class SparkGearComponent extends Component {
  public url?: string;
  private __hSPFXInst: any;
  private static __isInitialized = false;
  private static __renderer: any;

  private static SPFX_WebGLRenderer: any;
  private static SPFX_TempVAO: any;
  private static SPFX_CurrentVAO: any;
  private static SPFX_UsingVAO: any;
  private static SPFX_ArrayBuffer: any;
  private static SPFX_ElementArrayBuffer: any;
  private static SPFX_CurrentProgram: any;
  private static SPFX_FrontFace: any;
  private static SPFX_StencilTestEnabled: any;
  private static SPFX_DepthTestEnabled: any;
  private static SPFX_CullFaceEnabled: any;
  private static SPFX_BlendEnabled: any;
  private static SPFX_ActiveTexture: any;
  private static SPFX_Texture: any[] = [];

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);

  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.SparkGearComponentTID;
  }

  static common_$load() {
    if (SparkGearComponent.__isInitialized) {
      return;
    }

    // SPARKGEAR初期化
    SparkGearComponent.SPFX_Initialize(SparkGearComponent.__renderer);
  }

  $load() {
    if (this.url == null) {
      return;
    }
    const loadBytes = function (path: string, type: XMLHttpRequestResponseType, callback: Function) {
      var request = new XMLHttpRequest();
      request.open('GET', path, true);
      request.responseType = type;
      request.onload = () => {
          switch (request.status) {
              case 200:
                  callback(request.response);
                  break;
              default:
                  console.error('Failed to load (' + request.status + ') : ' + path);
                  break;
          }
      }
      request.send(null);
    }

    const ThisClass = SparkGearComponent;

    loadBytes(this.url, 'arraybuffer', (data: ArrayBuffer) => {
      var buffer = new Uint8Array(data);
      ThisClass.SPARK_BackupStatus();
      var SPFXData = Module.ccall(
              "SPARK_Data_Create",
              'number',
              ['string', 'number', 'array', 'number'],
              [this.url, this.url!.length, buffer, buffer.length]);
      this.__hSPFXInst = _SPARK_Instance_Create(SPFXData);
      _SPARK_Data_Delete(SPFXData);
      ThisClass.SPARK_RestoreStatus();

      this.moveStageTo(ProcessStage.Logic);
    });
  }

  $create() {
    this.moveStageTo(ProcessStage.Load);
  }

  onBeforeRender() {
  }
  onAfterRender() {
    const ThisClass = SparkGearComponent;
    ThisClass.SPARK_BackupStatus();
    _SPARK_Draw(this.__hSPFXInst);
    ThisClass.SPARK_RestoreStatus();
  }
  // clone() {
  //   return new this.constructor(this._LoadingManager, this._Url).copy(this);
  // }
  play() {
    _SPARK_Instance_Play(this.__hSPFXInst, 1.0, false, 0);
  }
  stop () {
    _SPARK_Instance_Stop(this.__hSPFXInst);
  }
  pause () {
    _SPARK_Instance_Pause(this.__hSPFXInst);
  }
  isPlaying() {
    return _SPARK_Instance_IsPlaying(this.__hSPFXInst);
  }
  kickTrigger(trigger: any) {
    _SPARK_Instance_KickTrigger(this.__hSPFXInst, trigger);
  }

  static SPARK_BackupStatus() {
    const ThisClass = SparkGearComponent;
    const gl = ThisClass.SPFX_WebGLRenderer.getContext();

    ThisClass.SPFX_ArrayBuffer        = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
    ThisClass.SPFX_ElementArrayBuffer = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
    ThisClass.SPFX_CurrentProgram     = gl.getParameter(gl.CURRENT_PROGRAM);

    ThisClass.SPFX_FrontFace          = gl.getParameter(gl.FRONT_FACE);
    ThisClass.SPFX_StencilTestEnabled = gl.isEnabled(gl.STENCIL_TEST);
    ThisClass.SPFX_DepthTestEnabled   = gl.isEnabled(gl.DEPTH_TEST);
    ThisClass.SPFX_CullFaceEnabled    = gl.isEnabled(gl.CULL_FACE);
    ThisClass.SPFX_BlendEnabled       = gl.isEnabled(gl.BLEND);

    ThisClass.SPFX_ActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
    for (let i = 0; i < 8; i++)
    {
        gl.activeTexture(gl.TEXTURE0 + i);
        ThisClass.SPFX_Texture[i] = gl.getParameter(gl.TEXTURE_BINDING_2D);
    }

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  }

  static SPARK_RestoreStatus = function () {
    const ThisClass = SparkGearComponent;

    const gl = ThisClass.SPFX_WebGLRenderer.getContext();

    gl.useProgram(ThisClass.SPFX_CurrentProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, ThisClass.SPFX_ArrayBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ThisClass.SPFX_ElementArrayBuffer);

    gl.frontFace(ThisClass.SPFX_FrontFace);
    ThisClass.SPFX_StencilTestEnabled ? gl.enable(gl.STENCIL_TEST) : gl.disable(gl.STENCIL_TEST);
    ThisClass.SPFX_DepthTestEnabled   ? gl.enable(gl.DEPTH_TEST)   : gl.disable(gl.DEPTH_TEST);
    ThisClass.SPFX_CullFaceEnabled    ? gl.enable(gl.CULL_FACE)    : gl.disable(gl.CULL_FACE);
    ThisClass.SPFX_BlendEnabled       ? gl.enable(gl.BLEND)        : gl.disable(gl.BLEND);

    for (let i = 0; i < 8; i++)
    {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, ThisClass.SPFX_Texture[i]);
    }
    gl.activeTexture(ThisClass.SPFX_ActiveTexture);
  }

  static SPFX_Initialize = function (Renderer: any) {
    const ThisClass = SparkGearComponent;
    ThisClass.SPFX_WebGLRenderer = Renderer;
//    ThisClass.SPFX_WebGLRenderer.getContext();
    ThisClass.SPARK_BackupStatus();
    _SPARK_InitializeFor3D(ThisClass.SPFX_WebGLRenderer.width, ThisClass.SPFX_WebGLRenderer.height);
    ThisClass.SPARK_RestoreStatus();
  }

  static SPFX_Uninitialize() {
    const ThisClass = SparkGearComponent;
    ThisClass.SPARK_BackupStatus();
    _SPARK_Uninitialize();
    ThisClass.SPARK_RestoreStatus();
  }

  static SPARK_SetCameraMatrix(camera: any) {
    _SPARK_SetMatrix(0,
        camera.matrixWorldInverse.elements[ 0],
        camera.matrixWorldInverse.elements[ 1],
        camera.matrixWorldInverse.elements[ 2],
        camera.matrixWorldInverse.elements[ 3],
        camera.matrixWorldInverse.elements[ 4],
        camera.matrixWorldInverse.elements[ 5],
        camera.matrixWorldInverse.elements[ 6],
        camera.matrixWorldInverse.elements[ 7],
        camera.matrixWorldInverse.elements[ 8],
        camera.matrixWorldInverse.elements[ 9],
        camera.matrixWorldInverse.elements[10],
        camera.matrixWorldInverse.elements[11],
        camera.matrixWorldInverse.elements[12],
        camera.matrixWorldInverse.elements[13],
        camera.matrixWorldInverse.elements[14],
        camera.matrixWorldInverse.elements[15]);
    _SPARK_SetMatrix(1,
        camera.projectionMatrix.elements[ 0],
        camera.projectionMatrix.elements[ 1],
        camera.projectionMatrix.elements[ 2],
        camera.projectionMatrix.elements[ 3],
        camera.projectionMatrix.elements[ 4],
        camera.projectionMatrix.elements[ 5],
        camera.projectionMatrix.elements[ 6],
        camera.projectionMatrix.elements[ 7],
        camera.projectionMatrix.elements[ 8],
        camera.projectionMatrix.elements[ 9],
        camera.projectionMatrix.elements[10],
        camera.projectionMatrix.elements[11],
        camera.projectionMatrix.elements[12],
        camera.projectionMatrix.elements[13],
        camera.projectionMatrix.elements[14],
        camera.projectionMatrix.elements[15]);
  }

  static SPFX_Update = function (DeltaTime: number) {
    _SPARK_Update(DeltaTime);
  }

  static SPARK_Draw() {
    const ThisClass = SparkGearComponent;
    ThisClass.SPARK_BackupStatus();
    _SPARK_DrawAll();
    ThisClass.SPARK_RestoreStatus();
  }

  static SPARK_DrawDebugInfo(InfoType: any) {
    const ThisClass = SparkGearComponent;
    ThisClass.SPARK_BackupStatus();
    _SPARK_DrawDebugInfo(InfoType);
    ThisClass.SPARK_RestoreStatus();
  }
}
