import { RnObject } from '../../core/RnObject';
import { AlphaMode, AlphaModeEnum } from '../../definitions/AlphaMode';
import { AbstractMaterialContent } from './AbstractMaterialContent';
import {
  ShaderSemanticsEnum,
  ShaderSemantics,
  ShaderSemanticsIndex,
  getShaderPropertyFunc,
  _getPropertyIndex2,
  ShaderSemanticsName,
} from '../../definitions/ShaderSemantics';
import { CompositionType } from '../../definitions/CompositionType';
import { MathClassUtil } from '../../math/MathClassUtil';
import { CGAPIResourceRepository } from '../../renderer/CGAPIResourceRepository';
import type { AbstractTexture } from '../../textures/AbstractTexture';
import { ShaderType } from '../../definitions/ShaderType';
import {
  Index,
  CGAPIResourceHandle,
  PrimitiveUID,
  MaterialSID,
  MaterialTID,
  MaterialUID,
} from '../../../types/CommonTypes';
import { GlobalDataRepository } from '../../core/GlobalDataRepository';
import type { ShaderSources } from '../../../webgl/WebGLStrategy';
import type { Primitive } from '../../geometry/Primitive';
import type { RenderingArgWebGL, RenderingArgWebGpu } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsInfo, TextureParameter } from '../../definitions';
import { MaterialTypeName, ShaderVariable } from './MaterialTypes';
import { Sampler } from '../../textures/Sampler';
import { Blend, BlendEnum } from '../../definitions/Blend';
import {
  _createProgramAsSingleOperationWebGL,
  _createProgramAsSingleOperationByUpdatedSources,
  _getAttributeInfo,
  _outputVertexAttributeBindingInfo,
  _setupGlobalShaderDefinitionWebGL,
  _createProgramAsSingleOperationWebGpu,
} from './ShaderHandler';
import { Texture } from '../../textures';
import type { WebGLResourceRepository } from '../../../webgl/WebGLResourceRepository';
import { Logger } from '../../misc/Logger';
import { AnimatedScalar } from '../../math/AnimatedScalar';
import { AnimatedVector4 } from '../../math/AnimatedVector4';
import { AnimatedVector3 } from '../../math/AnimatedVector3';
import { AnimatedQuaternion } from '../../math/AnimatedQuaternion';
import { AnimatedVectorN } from '../../math/AnimatedVectorN';
import { IAnimatedValue } from '../../math/IAnimatedValue';
import { AnimatedVector2 } from '../../math/AnimatedVector2';
import { Is } from '../../misc/Is';

type PrimitiveFingerPrint = string;
/**
 * The material class.
 * This class has one or more material nodes.
 */
export class Material extends RnObject {
  // Internal Resources
  __materialTypeName: MaterialTypeName;
  _materialContent: AbstractMaterialContent;
  _allFieldVariables: Map<ShaderSemanticsName, ShaderVariable> = new Map();
  _autoFieldVariablesOnly: Map<ShaderSemanticsName, ShaderVariable> = new Map();
  _allFieldsInfo: Map<ShaderSemanticsName, ShaderSemanticsInfo> = new Map();
  private __belongPrimitives: Map<PrimitiveUID, Primitive> = new Map();

  // Ids
  private _shaderProgramUidMap: Map<PrimitiveFingerPrint, CGAPIResourceHandle> = new Map();
  __materialUid: MaterialUID = -1;
  private __materialTid: MaterialTID;
  __materialSid: MaterialSID = -1; // material serial Id in the material type

  // Common Rendering States
  private __alphaMode = AlphaMode.Opaque;
  public zWriteWhenBlend = false;
  public colorWriteMask = [true, true, true, true];
  public isTranslucent = false;
  public cullFace = true; // If true, enable gl.CULL_FACE
  public cullFrontFaceCCW = true;
  public cullFaceBack = true; // if true, cull back face. if false, cull front face
  private __alphaToCoverage = false;
  private __blendEquationMode = Blend.EquationFuncAdd; // gl.FUNC_ADD
  private __blendEquationModeAlpha = Blend.EquationFuncAdd; // gl.FUNC_ADD
  private __blendFuncSrcFactor = Blend.One; // Not SrcAlpha. Because In Rhodonite, premultiplied alpha is used
  private __blendFuncDstFactor = Blend.OneMinusSrcAlpha; // gl.ONE_MINUS_SRC_ALPHA
  private __blendFuncAlphaSrcFactor = Blend.One; // gl.ONE
  private __blendFuncAlphaDstFactor = Blend.OneMinusSrcAlpha; // gl.ONE_MINUS_SRC_ALPHA

  private __stateVersion = 0;
  private static __stateVersion = 0;
  private __fingerPrint = '';

  private __shaderDefines: Set<string> = new Set();

  private static __webglResourceRepository?: WebGLResourceRepository;

  private static __defaultSampler = new Sampler({
    magFilter: TextureParameter.Linear,
    minFilter: TextureParameter.Linear,
    wrapS: TextureParameter.Repeat,
    wrapT: TextureParameter.Repeat,
  });

  // static fields
  static _soloDatumFields: Map<MaterialTypeName, Map<ShaderSemanticsName, ShaderVariable>> =
    new Map();

  constructor(
    materialTid: Index,
    materialUid: MaterialUID,
    materialSid: MaterialSID,
    materialTypeName: string,
    materialNode: AbstractMaterialContent
  ) {
    super();
    this._materialContent = materialNode;
    this.__materialTid = materialTid;
    this.__materialUid = materialUid;
    this.__materialSid = materialSid;
    this.__materialTypeName = materialTypeName;
  }

  addShaderDefine(define: string) {
    this.__shaderDefines.add(define);
    this.makeShadersInvalidate();
  }

  removeShaderDefine(define: string) {
    this.__shaderDefines.delete(define);
    this.makeShadersInvalidate();
  }

  getShaderDefines() {
    return this.__shaderDefines;
  }

  calcFingerPrint() {
    let str = '';
    str += this.alphaMode.index;
    str += this.blendFuncSrcFactor.webgpu;
    str += this.blendFuncDstFactor.webgpu;
    str += this.blendFuncAlphaSrcFactor.webgpu;
    str += this.blendFuncAlphaDstFactor.webgpu;
    str += this.blendEquationMode.webgpu;
    str += this.blendEquationModeAlpha.webgpu;
    str += this.cullFace ? '1' : '0';
    str += this.cullFrontFaceCCW ? '1' : '0';
    str += this.cullFaceBack ? '1' : '0';

    // for (const [key, value] of this._autoFieldVariablesOnly) {
    //   if (CompositionType.isTexture(value.info.compositionType)) {
    //     str += value.info.semantic.str;
    //     str += value.value[0];
    //     str += value.value[1];
    //     str += value.value[2];
    //   }
    // }

    this.__fingerPrint = str;
  }

  _getFingerPrint() {
    return this.__fingerPrint;
  }

  static get stateVersion() {
    return Material.__stateVersion;
  }

  ///
  /// Parameter Setters
  ///

  public _isAnimatedValue(value: any): value is IAnimatedValue {
    return value instanceof AnimatedScalar || value instanceof AnimatedVector2 || value instanceof AnimatedVector3 || value instanceof AnimatedVector4 || value instanceof AnimatedQuaternion || value instanceof AnimatedVectorN;
  }

  public setParameter(shaderSemanticName: ShaderSemanticsName, value: any) {
    const info = this._allFieldsInfo.get(shaderSemanticName);
    if (info != null) {
      let valueObj: ShaderVariable | undefined;
      if (info.soloDatum) {
        valueObj = Material._soloDatumFields.get(this.__materialTypeName)!.get(shaderSemanticName);
      } else {
        valueObj = this._allFieldVariables.get(shaderSemanticName);
      }
      if (this._isAnimatedValue(value)) {
        value.setFloat32Array(valueObj!.value._v);
        valueObj!.value = value;
        this.__stateVersion++;
        Material.__stateVersion++;
        this.calcFingerPrint();
      } else {
        const updated = MathClassUtil._setForce(valueObj!.value, value);
        if (updated) {
          this.__stateVersion++;
          Material.__stateVersion++;
          this.calcFingerPrint();
        }
      }
    }
  }

  public setTextureParameter(
    shaderSemantic: ShaderSemanticsName,
    texture: AbstractTexture,
    sampler?: Sampler
  ): void {
    if (Is.not.exist(sampler)) {
      sampler = Material.__defaultSampler;
    }
    if (!sampler.created) {
      sampler.create();
    }

    if (this._allFieldsInfo.has(shaderSemantic)) {
      const setter = async () => {
        if (typeof (texture as Texture).loadFromUrlLazy !== 'undefined') {
          await (texture as Texture).loadFromUrlLazy();
          await (texture as Texture).loadFromImgLazy();
        }
        const array = this._allFieldVariables.get(shaderSemantic)!;
        const shaderVariable = {
          value: [array.value[0], texture, sampler],
          info: array.info,
        };
        this._allFieldVariables.set(shaderSemantic, shaderVariable);
        if (!array.info.isInternalSetting) {
          this._autoFieldVariablesOnly.set(shaderSemantic, shaderVariable);
        }
        if (shaderSemantic === 'diffuseColorTexture' || shaderSemantic === 'baseColorTexture') {
          if (texture.isTransparent) {
            this.alphaMode = AlphaMode.Blend;
          }
        }
        this.__stateVersion++;
        Material.__stateVersion++;
        this.calcFingerPrint();
      };

      setter();
    }
  }

  public getTextureParameter(shaderSemantic: ShaderSemanticsName) {
    if (this._allFieldsInfo.has(shaderSemantic)) {
      const array = this._allFieldVariables.get(shaderSemantic)!;
      return array.value;
    }
    return undefined;
  }

  public setTextureParameterAsPromise(
    shaderSemantic: ShaderSemanticsName,
    promise: Promise<AbstractTexture>
  ): void {
    promise.then((texture) => {
      if (this._allFieldsInfo.has(shaderSemantic)) {
        const array = this._allFieldVariables.get(shaderSemantic)!;
        const shaderVariable = {
          value: [array.value[0], texture],
          info: array.info,
        };
        this._allFieldVariables.set(shaderSemantic, shaderVariable);
        if (!array.info.isInternalSetting) {
          this._autoFieldVariablesOnly.set(shaderSemantic, shaderVariable);
        }
        if (shaderSemantic === 'diffuseColorTexture' || shaderSemantic === 'baseColorTexture') {
          if (texture.isTransparent) {
            this.alphaMode = AlphaMode.Blend;
          }
        }
      }
      this.__stateVersion++;
      Material.__stateVersion++;
      this.calcFingerPrint();
    });
  }

  public getParameter(shaderSemantic: ShaderSemanticsName): any {
    const info = this._allFieldsInfo.get(shaderSemantic);
    if (info != null) {
      if (info.soloDatum) {
        return Material._soloDatumFields.get(this.__materialTypeName)!.get(shaderSemantic)?.value;
      } else {
        return this._allFieldVariables.get(shaderSemantic)?.value;
      }
    }

    return void 0;
  }

  /**
   * return whether the shader program ready or not
   * @returns is shader program ready or not
   */
  public isShaderProgramReady(primitive: Primitive): boolean {
    return this._shaderProgramUidMap.has(primitive._getFingerPrint());
  }

  /**
   * @internal
   * called from WebGLStrategyDataTexture and WebGLStrategyUniform only
   * @param isUniformOnlyMode
   */
  _setUniformLocationsOfMaterialNodes(isUniformOnlyMode: boolean, primitive: Primitive) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();

    let array: ShaderSemanticsInfo[] = [];
    if (this._materialContent != null) {
      const semanticsInfoArray = this._materialContent._semanticsInfoArray;
      array = array.concat(semanticsInfoArray);
    }

    const shaderProgramUid = this._shaderProgramUidMap.get(primitive._getFingerPrint());
    webglResourceRepository.setupUniformLocations(shaderProgramUid!, array, isUniformOnlyMode);
  }

  getShaderProgramUid(primitive: Primitive): CGAPIResourceHandle {
    const primitiveFingerPrint = primitive._getFingerPrint();
    return this._shaderProgramUidMap.get(primitiveFingerPrint) ?? -1;
  }

  /**
   * @internal
   * called from Primitive class only
   * @param primitive
   */
  _addBelongPrimitive(primitive: Primitive) {
    this.__belongPrimitives.set(primitive.primitiveUid, primitive);
  }

  getBelongPrimitives() {
    return this.__belongPrimitives;
  }

  /**
   * @internal
   * called from WebGLStrategyDataTexture and WebGLStrategyUniform
   * @param vertexShaderMethodDefinitions_uniform
   * @param propertySetter
   * @param isWebGL2
   * @returns
   */
  _createProgramWebGL(
    vertexShaderMethodDefinitions_uniform: string,
    propertySetter: getShaderPropertyFunc,
    primitive: Primitive,
    isWebGL2: boolean
  ): [CGAPIResourceHandle, boolean] {
    const [programUid, newOne] = _createProgramAsSingleOperationWebGL(
      this,
      propertySetter,
      primitive,
      vertexShaderMethodDefinitions_uniform,
      isWebGL2
    );
    this._shaderProgramUidMap.set(primitive._getFingerPrint(), programUid);

    Material.__stateVersion++;

    return [programUid, newOne];
  }

  _createProgramWebGpu(
    primitive: Primitive,
    vertexShaderMethodDefinitions: string,
    propertySetter: getShaderPropertyFunc
  ) {
    const programUid = _createProgramAsSingleOperationWebGpu(
      this,
      primitive,
      vertexShaderMethodDefinitions,
      propertySetter
    );

    this._shaderProgramUidMap.set(primitive._getFingerPrint(), programUid);
    Material.__stateVersion++;
  }

  /**
   * create program by updated shader source code
   * @internal
   * called from WebGLStrategyDataTexture and WebGLStrategyUniform
   *
   * @param updatedShaderSources - updated shader source code
   * @param onError
   * @returns
   */
  _createProgramByUpdatedSources(
    updatedShaderSources: ShaderSources,
    primitive: Primitive,
    onError?: (message: string) => void
  ): [CGAPIResourceHandle, boolean] {
    const [programUid, newOne] = _createProgramAsSingleOperationByUpdatedSources(
      this,
      primitive,
      this._materialContent,
      updatedShaderSources,
      onError
    );
    this._shaderProgramUidMap.set(primitive._getFingerPrint(), programUid);

    if (programUid > 0) {
      // this.__updatedShaderSources = updatedShaderSources;
    }

    Material.__stateVersion++;
    return [programUid, newOne];
  }

  /**
   * @internal
   * called WebGLStrategyDataTexture and WebGLStrategyUniform only
   */
  _setupBasicUniformsLocations(primitive: Primitive) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();

    const primitiveFingerPrint = primitive._getFingerPrint();
    const shaderProgramUid = this._shaderProgramUidMap.get(primitiveFingerPrint);
    webglResourceRepository.setupBasicUniformLocations(shaderProgramUid!);
  }

  /**
   * @internal
   * called WebGLStrategyDataTexture and WebGLStrategyUniform only
   */
  _setupAdditionalUniformLocations(
    shaderSemantics: ShaderSemanticsInfo[],
    isUniformOnlyMode: boolean,
    primitive: Primitive
  ) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const primitiveFingerPrint = primitive._getFingerPrint();
    const shaderProgramUid = this._shaderProgramUidMap.get(primitiveFingerPrint);
    webglResourceRepository.setupUniformLocations(
      shaderProgramUid!,
      shaderSemantics,
      isUniformOnlyMode
    );
  }

  _setInternalSettingParametersToGpuWebGpu({
    material,
    args,
  }: {
    material: Material;
    args: RenderingArgWebGpu;
  }) {
    this._materialContent._setInternalSettingParametersToGpuWebGpu({
      material,
      args,
    });
  }

  /**
   * @internal
   * called from WebGLStrategyDataTexture and WebGLStrategyUniform only
   */
  _setParametersToGpuWebGL({
    material,
    shaderProgram,
    firstTime,
    args,
  }: {
    material: Material;
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    args: RenderingArgWebGL;
  }) {
    // For Auto Parameters
    this.__setAutoParametersToGpuWebGL(args.setUniform, firstTime, shaderProgram);

    // For Custom Setting Parameters
    this._materialContent._setInternalSettingParametersToGpuWebGL({
      material,
      shaderProgram,
      firstTime,
      args,
    });

    // For SoloDatum Parameters
    this.__setSoloDatumParametersToGpuWebGL({
      shaderProgram,
      firstTime,
      isUniformMode: args.setUniform,
    });
  }

  _setParametersToGpuWebGLPerPrimitive({
    material,
    shaderProgram,
    firstTime,
    args,
  }: {
    material: Material;
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    args: RenderingArgWebGL;
  }) {
    // For Custom Setting Parameters
    this._materialContent._setInternalSettingParametersToGpuWebGLPerPrimitive({
      material,
      shaderProgram,
      firstTime,
      args,
    });
  }

  _setParametersToGpuWebGLWithOutInternalSetting({
    shaderProgram,
    firstTime,
    isUniformMode,
  }: {
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    isUniformMode: boolean;
  }) {
    // For Auto Parameters
    this.__setAutoParametersToGpuWebGL(isUniformMode, firstTime, shaderProgram);

    // For SoloDatum Parameters
    this.__setSoloDatumParametersToGpuWebGL({
      shaderProgram,
      firstTime,
      isUniformMode,
    });
  }
  /**
   * @internal
   * @param propertySetter
   */
  _getProperties(propertySetter: getShaderPropertyFunc, isWebGL2: boolean) {
    let vertexPropertiesStr = '';
    let pixelPropertiesStr = '';
    this._allFieldsInfo.forEach((info) => {
      if (
        info!.stage === ShaderType.VertexShader ||
        info!.stage === ShaderType.VertexAndPixelShader
      ) {
        vertexPropertiesStr += propertySetter(this.__materialTypeName, info!, false, isWebGL2);
      }
      if (
        info!.stage === ShaderType.PixelShader ||
        info!.stage === ShaderType.VertexAndPixelShader
      ) {
        pixelPropertiesStr += propertySetter(this.__materialTypeName, info!, false, isWebGL2);
      }
    });
    const globalDataRepository = GlobalDataRepository.getInstance();
    [vertexPropertiesStr, pixelPropertiesStr] = globalDataRepository._addPropertiesStr(
      vertexPropertiesStr,
      pixelPropertiesStr,
      propertySetter,
      isWebGL2
    );
    return { vertexPropertiesStr, pixelPropertiesStr };
  }

  private __setAutoParametersToGpuWebGL(
    isUniformMode: boolean,
    firstTime: boolean,
    shaderProgram: WebGLProgram
  ) {
    if (Material.__webglResourceRepository == null) {
      Material.__webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    }
    const webglResourceRepository = Material.__webglResourceRepository!;
    if (isUniformMode) {
      this._autoFieldVariablesOnly.forEach((value) => {
        const info = value.info;
        webglResourceRepository.setUniformValue(
          shaderProgram,
          info.semantic,
          firstTime,
          value.value
        );
      });
    } else {
      for (const [key, value] of this._autoFieldVariablesOnly) {
        const info = value.info;
        if (CompositionType.isTexture(info.compositionType)) {
          if (firstTime) {
            webglResourceRepository.setUniform1iForTexture(
              shaderProgram,
              info.semantic,
              value.value
            );
          } else {
            webglResourceRepository.bindTexture(info, value.value);
          }
        } else if (info.needUniformInDataTextureMode) {
          webglResourceRepository.setUniformValue(
            shaderProgram,
            info.semantic,
            firstTime,
            value.value
          );
        }
      }
    }
  }

  private __setSoloDatumParametersToGpuWebGL({
    shaderProgram,
    firstTime,
    isUniformMode,
  }: {
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    isUniformMode: boolean;
  }) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const materialTypeName = this.__materialTypeName;
    const map = Material._soloDatumFields.get(materialTypeName);
    if (map == null) return;
    const values = map.values();
    for (const value of values) {
      const info = value.info;
      if (isUniformMode || CompositionType.isTexture(info.compositionType)) {
        if (!info.isInternalSetting) {
          if (firstTime) {
            webglResourceRepository.setUniformValue(
              shaderProgram,
              info.semantic,
              firstTime,
              value.value
            );
          } else {
            webglResourceRepository.bindTexture(info, value.value);
          }
        }
      }
    }
  }

  /**
   * Change the blendEquations
   * This method works only if this alphaMode is the blend
   * @param blendEquationMode the argument of gl.blendEquation of the first argument of gl.blendEquationSeparate such as gl.FUNC_ADD
   * @param blendEquationModeAlpha the second argument of gl.blendEquationSeparate
   */
  public setBlendEquationMode(blendEquationMode: BlendEnum, blendEquationModeAlpha?: BlendEnum) {
    this.__blendEquationMode = blendEquationMode;
    this.__blendEquationModeAlpha = blendEquationModeAlpha ?? blendEquationMode;

    this.__treatForMinMax();

    this.__stateVersion++;
    Material.__stateVersion++;
    this.calcFingerPrint();
  }

  private __treatForMinMax() {
    // due to the limitation of WebGPU, See the last part of https://www.w3.org/TR/webgpu/#fragment-state
    if (this.__blendEquationMode === Blend.Min || this.__blendEquationMode === Blend.Max) {
      this.__blendFuncDstFactor = Blend.One;
      this.__blendFuncSrcFactor = Blend.One;
    }
    if (
      this.__blendEquationModeAlpha === Blend.Min ||
      this.__blendEquationModeAlpha === Blend.Max
    ) {
      this.__blendFuncAlphaDstFactor = Blend.One;
      this.__blendFuncAlphaSrcFactor = Blend.One;
    }
  }

  /**
   * Change the blendFuncSeparateFactors
   * This method works only if this alphaMode is the blend
   */
  public setBlendFuncSeparateFactor(
    blendFuncSrcFactor: BlendEnum,
    blendFuncDstFactor: BlendEnum,
    blendFuncAlphaSrcFactor: BlendEnum,
    blendFuncAlphaDstFactor: BlendEnum
  ) {
    this.__blendFuncSrcFactor = blendFuncSrcFactor;
    this.__blendFuncDstFactor = blendFuncDstFactor;
    this.__blendFuncAlphaSrcFactor = blendFuncAlphaSrcFactor;
    this.__blendFuncAlphaDstFactor = blendFuncAlphaDstFactor;

    this.__treatForMinMax();

    this.__stateVersion++;
    Material.__stateVersion++;
    this.calcFingerPrint();
  }

  /**
   * Change the blendFuncFactors
   * This method works only if this alphaMode is the blend
   */
  public setBlendFuncFactor(blendFuncSrcFactor: BlendEnum, blendFuncDstFactor: BlendEnum) {
    this.__blendFuncSrcFactor = blendFuncSrcFactor;
    this.__blendFuncDstFactor = blendFuncDstFactor;
    this.__blendFuncAlphaSrcFactor = blendFuncSrcFactor;
    this.__blendFuncAlphaDstFactor = blendFuncDstFactor;

    this.__treatForMinMax();

    this.__stateVersion++;
    Material.__stateVersion++;
    this.calcFingerPrint();
  }

  // setMaterialNode(materialNode: AbstractMaterialNode) {
  //   this.__materialNode = materialNode;
  // }

  ///
  /// Getters
  ///

  isBlend() {
    if (this.alphaMode === AlphaMode.Blend) {
      return true;
    } else {
      return false;
    }
  }

  /**
   *
   * @returns return true if (alphaMode is Opaque or Mask) and translucent
   */
  isTranslucentOpaque() {
    if (this.alphaMode !== AlphaMode.Blend && this.isTranslucent) {
      return true;
    } else {
      return false;
    }
  }

  isBlendOrTranslucent() {
    if (this.alphaMode === AlphaMode.Blend || this.isTranslucent) {
      return true;
    } else {
      return false;
    }
  }

  isOpaque() {
    return this.alphaMode === AlphaMode.Opaque;
  }

  isMask() {
    return this.alphaMode === AlphaMode.Mask;
  }

  /**
   * NOTE: To apply the alphaToCoverage, the output alpha value must not be fixed to constant value.
   * However, some shaders in the Rhodonite fixes the output alpha value to 1 by setAlphaIfNotInAlphaBlendMode.
   * So we need to improve the shader to use the alphaToCoverage.
   * @param alphaToCoverage apply alphaToCoverage to this material or not
   */
  set alphaToCoverage(alphaToCoverage: boolean) {
    if (alphaToCoverage && this.alphaMode === AlphaMode.Blend) {
      Logger.warn(
        'If you set alphaToCoverage = true on a material whose AlphaMode is Translucent, you may get drawing problems.'
      );
    }
    this.__alphaToCoverage = alphaToCoverage;
    this.makeShadersInvalidate();
    this.calcFingerPrint();
  }
  get alphaToCoverage(): boolean {
    return this.__alphaToCoverage;
  }

  /**
   * Gets materialTID.
   */
  get materialTID(): MaterialTID {
    return this.__materialTid;
  }

  get fieldsInfoArray() {
    return Array.from(this._allFieldsInfo.values());
  }

  get blendEquationMode() {
    return this.__blendEquationMode;
  }

  get blendEquationModeAlpha() {
    return this.__blendEquationModeAlpha;
  }

  get blendFuncSrcFactor() {
    return this.__blendFuncSrcFactor;
  }

  get blendFuncDstFactor() {
    return this.__blendFuncDstFactor;
  }

  get blendFuncAlphaSrcFactor() {
    return this.__blendFuncAlphaSrcFactor;
  }

  get blendFuncAlphaDstFactor() {
    return this.__blendFuncAlphaDstFactor;
  }

  get alphaMode() {
    return this.__alphaMode;
  }

  set alphaMode(mode: AlphaModeEnum) {
    this.__alphaMode = mode;
    this.makeShadersInvalidate();
  }

  get materialUID(): MaterialUID {
    return this.__materialUid;
  }

  get materialSID(): MaterialSID {
    return this.__materialSid;
  }

  get isSkinning(): boolean {
    return this._materialContent.isSkinning;
  }

  get isMorphing(): boolean {
    return this._materialContent.isMorphing;
  }

  get isLighting(): boolean {
    return this._materialContent.isLighting;
  }

  get materialTypeName(): string {
    return this.__materialTypeName;
  }

  get stateVersion(): number {
    return this.__stateVersion;
  }

  makeShadersInvalidate() {
    this._shaderProgramUidMap.clear();
    this.__stateVersion++;
    Material.__stateVersion++;
  }
}
