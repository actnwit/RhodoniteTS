import Component from '../foundation/core/Component';
import EntityRepository from '../foundation/core/EntityRepository';
import {WellKnownComponentTIDs} from '../foundation/components/WellKnownComponentTIDs';
import {ProcessStage} from '../foundation/definitions/ProcessStage';
import Matrix44 from '../foundation/math/Matrix44';
import LightComponent from '../foundation/components/Camera/CameraComponent';
import ComponentRepository from '../foundation/core/ComponentRepository';
import WebGLResourceRepository from '../webgl/WebGLResourceRepository';
import SceneGraphComponent from '../foundation/components/SceneGraph/SceneGraphComponent';
import ModuleManager from '../foundation/system/ModuleManager';
import {ComponentTID, EntityUID, ComponentSID} from '../types/CommonTypes';
import {IMatrix44} from '../foundation/math/IMatrix';

declare let window: any;
declare let _SPARK_Data_Delete: Function;
declare let _SPARK_Instance_Create: Function;
declare let _SPARK_Draw: Function;
declare let _SPARK_Instance_Play: Function;
declare let _SPARK_Instance_Stop: Function;
declare let _SPARK_Instance_Pause: Function;
declare let _SPARK_Instance_IsPlaying: Function;
declare let _SPARK_Instance_KickTrigger: Function;
declare let _SPARK_InitializeFor3D: Function;
declare let _SPARK_Uninitialize: Function;
declare let _SPARK_SetMatrix: Function;
declare let _SPARK_Instance_SetTransformFor3D: Function;
declare let _SPARK_Update: Function;
declare let _SPARK_DrawAll: Function;
declare let _SPARK_DrawDebugInfo: Function;

export default class SparkGearComponent extends Component {
  public url?: string;
  private __hSPFXInst: any;
  private static __isInitialized = false;
  private __sceneGraphComponent?: SceneGraphComponent;

  private static SPFX_WebGLResourceRepository: WebGLResourceRepository;
  private static SPFX_TempVAO: any;
  private static SPFX_CurrentVAO: any;
  private static SPFX_UsingVAO: any;
  private static SPFX_ArrayBuffer: any;
  private static SPFX_ElementArrayBuffer: any;
  private static SPFX_CurrentProgram: any;
  private static SPFX_FrontFace: any;
  private static SPFX_DepthFunc: any;
  private static SPFX_DepthWriteMask: any;
  private static SPFX_StencilTestEnabled: any;
  private static SPFX_DepthTestEnabled: any;
  private static SPFX_CullFaceEnabled: any;
  private static SPFX_BlendEnabled: any;
  private static SPFX_BlendSrcRgb: any;
  private static SPFX_BlendDstRgb: any;
  private static SPFX_BlendSrcAlpha: any;
  private static SPFX_BlendDstAlpha: any;
  private static SPFX_ActiveTexture: any;
  private static SPFX_Texture: any[] = [];
  private static __tmp_indentityMatrix: IMatrix44 = Matrix44.identity();

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository
  ) {
    super(entityUid, componentSid, entityRepository);
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.SparkGearComponentTID;
  }

  onBeforeRender() {}
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
  stop() {
    _SPARK_Instance_Stop(this.__hSPFXInst);
  }
  pause() {
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
    const gl =
      ThisClass.SPFX_WebGLResourceRepository.currentWebGLContextWrapper!.getRawContext();

    ThisClass.SPFX_ArrayBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
    ThisClass.SPFX_ElementArrayBuffer = gl.getParameter(
      gl.ELEMENT_ARRAY_BUFFER_BINDING
    );
    ThisClass.SPFX_CurrentProgram = gl.getParameter(gl.CURRENT_PROGRAM);

    ThisClass.SPFX_FrontFace = gl.getParameter(gl.FRONT_FACE);
    ThisClass.SPFX_DepthFunc = gl.getParameter(gl.DEPTH_FUNC);
    ThisClass.SPFX_DepthWriteMask = gl.getParameter(gl.DEPTH_WRITEMASK);
    ThisClass.SPFX_StencilTestEnabled = gl.isEnabled(gl.STENCIL_TEST);
    ThisClass.SPFX_DepthTestEnabled = gl.isEnabled(gl.DEPTH_TEST);
    ThisClass.SPFX_CullFaceEnabled = gl.isEnabled(gl.CULL_FACE);
    ThisClass.SPFX_BlendEnabled = gl.isEnabled(gl.BLEND);
    ThisClass.SPFX_BlendSrcRgb = gl.getParameter(gl.BLEND_SRC_RGB);
    ThisClass.SPFX_BlendDstRgb = gl.getParameter(gl.BLEND_DST_RGB);
    ThisClass.SPFX_BlendSrcAlpha = gl.getParameter(gl.BLEND_SRC_ALPHA);
    ThisClass.SPFX_BlendDstAlpha = gl.getParameter(gl.BLEND_DST_ALPHA);

    ThisClass.SPFX_ActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
    for (let i = 0; i < 8; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      ThisClass.SPFX_Texture[i] = gl.getParameter(gl.TEXTURE_BINDING_2D);
    }

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  }

  static SPARK_RestoreStatus = function () {
    const ThisClass = SparkGearComponent;

    const gl =
      ThisClass.SPFX_WebGLResourceRepository.currentWebGLContextWrapper!.getRawContext();

    gl.useProgram(ThisClass.SPFX_CurrentProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, ThisClass.SPFX_ArrayBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ThisClass.SPFX_ElementArrayBuffer);

    gl.frontFace(ThisClass.SPFX_FrontFace);
    gl.depthFunc(ThisClass.SPFX_DepthFunc);
    gl.depthMask(ThisClass.SPFX_DepthWriteMask);
    gl.blendFuncSeparate(
      ThisClass.SPFX_BlendSrcRgb,
      ThisClass.SPFX_BlendDstRgb,
      ThisClass.SPFX_BlendSrcAlpha,
      ThisClass.SPFX_BlendDstAlpha
    );

    ThisClass.SPFX_StencilTestEnabled
      ? gl.enable(gl.STENCIL_TEST)
      : gl.disable(gl.STENCIL_TEST);
    ThisClass.SPFX_DepthTestEnabled
      ? gl.enable(gl.DEPTH_TEST)
      : gl.disable(gl.DEPTH_TEST);
    ThisClass.SPFX_CullFaceEnabled
      ? gl.enable(gl.CULL_FACE)
      : gl.disable(gl.CULL_FACE);
    ThisClass.SPFX_BlendEnabled ? gl.enable(gl.BLEND) : gl.disable(gl.BLEND);

    for (let i = 0; i < 8; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, ThisClass.SPFX_Texture[i]);
    }
    gl.activeTexture(ThisClass.SPFX_ActiveTexture);
  };

  static SPFX_Initialize = function (repository: WebGLResourceRepository) {
    const ThisClass = SparkGearComponent;

    if (repository.currentWebGLContextWrapper == null) {
      return;
    }
    ThisClass.SPFX_WebGLResourceRepository = repository;
    window.GLctx =
      ThisClass.SPFX_WebGLResourceRepository.currentWebGLContextWrapper!.getRawContext();
    ThisClass.SPARK_BackupStatus();
    const glw =
      ThisClass.SPFX_WebGLResourceRepository.currentWebGLContextWrapper!;
    _SPARK_InitializeFor3D(glw.width, glw.height);
    ThisClass.SPARK_RestoreStatus();

    ThisClass.__isInitialized = true;
  };

  static SPFX_Uninitialize() {
    const ThisClass = SparkGearComponent;
    ThisClass.SPARK_BackupStatus();
    _SPARK_Uninitialize();
    ThisClass.SPARK_RestoreStatus();
  }

  static SPARK_SetCameraMatrix(
    viewMatrix: IMatrix44,
    projectionMatrix: IMatrix44
  ) {
    const vMv = (viewMatrix as Matrix44)._v;
    _SPARK_SetMatrix(
      0,
      vMv[0],
      vMv[1],
      vMv[2],
      vMv[3],
      vMv[4],
      vMv[5],
      vMv[6],
      vMv[7],
      vMv[8],
      vMv[9],
      vMv[10],
      vMv[11],
      vMv[12],
      vMv[13],
      vMv[14],
      vMv[15]
    );
    const pMv = (projectionMatrix as Matrix44)._v;
    _SPARK_SetMatrix(
      1,
      pMv[0],
      pMv[1],
      pMv[2],
      pMv[3],
      pMv[4],
      pMv[5],
      pMv[6],
      pMv[7],
      pMv[8],
      pMv[9],
      pMv[10],
      pMv[11],
      pMv[12],
      pMv[13],
      pMv[14],
      pMv[15]
    );
  }

  static SPFX_Update = function (DeltaTime: number) {
    _SPARK_Update(DeltaTime);
  };

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

  $create() {
    this.__sceneGraphComponent = this.__entityRepository.getComponentOfEntity(
      this.__entityUid,
      SceneGraphComponent
    ) as SceneGraphComponent;
    this.moveStageTo(ProcessStage.Load);
  }

  static common_$load() {
    if (SparkGearComponent.__isInitialized) {
      return;
    }

    const moduleManager = ModuleManager.getInstance();
    const moduleName = 'webgl';
    const webglModule = moduleManager.getModule(moduleName)! as any;

    // Initialize SPARKGEAR
    SparkGearComponent.SPFX_Initialize(
      webglModule.WebGLResourceRepository.getInstance()
    );
  }

  $load() {
    if (this.url == null) {
      return;
    }
    const loadBytes = function (
      path: string,
      type: XMLHttpRequestResponseType,
      callback: Function
    ) {
      const request = new XMLHttpRequest();
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
      };
      request.send(null);
    };

    const ThisClass = SparkGearComponent;

    loadBytes(this.url, 'arraybuffer', (data: ArrayBuffer) => {
      const buffer = new Uint8Array(data);
      ThisClass.SPARK_BackupStatus();
      const SPFXData = window.Module.ccall(
        'SPARK_Data_Create',
        'number',
        ['string', 'number', 'array', 'number'],
        [this.url, this.url!.length, buffer, buffer.length]
      );
      this.__hSPFXInst = _SPARK_Instance_Create(SPFXData);
      _SPARK_Data_Delete(SPFXData);
      ThisClass.SPARK_RestoreStatus();

      this.moveStageTo(ProcessStage.Logic);
    });
  }

  $logic() {
    // Keep Playing
    if (!this.isPlaying()) {
      this.play();
    }

    const cameraComponent = ComponentRepository.getInstance().getComponent(
      LightComponent,
      LightComponent.main
    ) as LightComponent;
    let viewMatrix = SparkGearComponent.__tmp_indentityMatrix;
    let projectionMatrix = SparkGearComponent.__tmp_indentityMatrix;
    if (cameraComponent) {
      viewMatrix = cameraComponent.viewMatrix;
      projectionMatrix = cameraComponent.projectionMatrix;
    }
    SparkGearComponent.SPARK_SetCameraMatrix(viewMatrix, projectionMatrix);

    SparkGearComponent.SPFX_Update(1.0);

    const m = this.__sceneGraphComponent!.worldMatrixInner;
    _SPARK_Instance_SetTransformFor3D(
      this.__hSPFXInst,
      m._v[0],
      m._v[4],
      m._v[8],
      m._v[12],
      m._v[1],
      m._v[5],
      m._v[9],
      m._v[13],
      m._v[2],
      m._v[6],
      m._v[10],
      m._v[14],
      m._v[3],
      m._v[7],
      m._v[11],
      m._v[15]
    );

    this.moveStageTo(ProcessStage.Render);
  }

  $render() {
    this.onAfterRender();
    this.moveStageTo(ProcessStage.Logic);
  }
}
ComponentRepository.registerComponentClass(SparkGearComponent);
