import Component from "../core/Component";
import EntityRepository from "../core/EntityRepository";
import { WellKnownComponentTIDs } from "./WellKnownComponentTIDs";
import { ProcessStage } from "../definitions/ProcessStage";
import Matrix44 from "../math/Matrix44";
import CameraComponent from "./CameraComponent";
import ComponentRepository from "../core/ComponentRepository";
import WebGLResourceRepository from "../../webgl/WebGLResourceRepository";

declare var window: any;
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

  private static SPFX_WebGLResourceRepository: WebGLResourceRepository;
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

  private static __tmp_indentityMatrix: Matrix44 = Matrix44.identity();

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
    // Initialize SPARKGEAR
    SparkGearComponent.SPFX_Initialize(WebGLResourceRepository.getInstance());
  }

  $logic() {
    // Keep Playing
    if (!this.isPlaying()) {
      this.play();
    }

    const cameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;
    let viewMatrix = SparkGearComponent.__tmp_indentityMatrix;
    let projectionMatrix = SparkGearComponent.__tmp_indentityMatrix;
    if (cameraComponent) {
      viewMatrix = cameraComponent.viewMatrix;
      projectionMatrix = cameraComponent.projectionMatrix;
    }
    SparkGearComponent.SPARK_SetCameraMatrix(viewMatrix, projectionMatrix);

    SparkGearComponent.SPFX_Update(1.0);

    this.moveStageTo(ProcessStage.Render);
  }

  $render() {
    this.onAfterRender();
    this.moveStageTo(ProcessStage.Logic);
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
      var SPFXData = window.Module.ccall(
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
    const gl = ThisClass.SPFX_WebGLResourceRepository.currentWebGLContextWrapper!.getRawContext();

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

    const gl = ThisClass.SPFX_WebGLResourceRepository.currentWebGLContextWrapper!.getRawContext();

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

  static SPFX_Initialize = function(repository: WebGLResourceRepository) {
    const ThisClass = SparkGearComponent;

    if (repository.currentWebGLContextWrapper == null) {
      return;
    }
    ThisClass.SPFX_WebGLResourceRepository = repository;
    window.GLctx = ThisClass.SPFX_WebGLResourceRepository.currentWebGLContextWrapper!.getRawContext();
    ThisClass.SPARK_BackupStatus();
    const glw = ThisClass.SPFX_WebGLResourceRepository.currentWebGLContextWrapper!;
    _SPARK_InitializeFor3D(glw.width, glw.height);
    ThisClass.SPARK_RestoreStatus();

    ThisClass.__isInitialized = true;
  }

  static SPFX_Uninitialize() {
    const ThisClass = SparkGearComponent;
    ThisClass.SPARK_BackupStatus();
    _SPARK_Uninitialize();
    ThisClass.SPARK_RestoreStatus();
  }

  static SPARK_SetCameraMatrix(viewMatrix: Matrix44, projectionMatrix: Matrix44) {
    _SPARK_SetMatrix(0,
        viewMatrix.v[ 0],
        viewMatrix.v[ 1],
        viewMatrix.v[ 2],
        viewMatrix.v[ 3],
        viewMatrix.v[ 4],
        viewMatrix.v[ 5],
        viewMatrix.v[ 6],
        viewMatrix.v[ 7],
        viewMatrix.v[ 8],
        viewMatrix.v[ 9],
        viewMatrix.v[10],
        viewMatrix.v[11],
        viewMatrix.v[12],
        viewMatrix.v[13],
        viewMatrix.v[14],
        viewMatrix.v[15]);
    _SPARK_SetMatrix(1,
        projectionMatrix.v[ 0],
        projectionMatrix.v[ 1],
        projectionMatrix.v[ 2],
        projectionMatrix.v[ 3],
        projectionMatrix.v[ 4],
        projectionMatrix.v[ 5],
        projectionMatrix.v[ 6],
        projectionMatrix.v[ 7],
        projectionMatrix.v[ 8],
        projectionMatrix.v[ 9],
        projectionMatrix.v[10],
        projectionMatrix.v[11],
        projectionMatrix.v[12],
        projectionMatrix.v[13],
        projectionMatrix.v[14],
        projectionMatrix.v[15]);
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
ComponentRepository.registerComponentClass(SparkGearComponent);
