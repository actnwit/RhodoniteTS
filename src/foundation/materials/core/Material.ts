import { RnObject } from '../../core/RnObject';
import { AlphaMode, AlphaModeEnum } from '../../definitions/AlphaMode';
import { AbstractMaterialContent } from './AbstractMaterialContent';
import {
  ShaderSemanticsEnum,
  ShaderSemantics,
  ShaderSemanticsIndex,
  getShaderPropertyFunc,
  _getPropertyIndex2,
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
import { ShaderVariableUpdateInterval } from '../../definitions/ShaderVariableUpdateInterval';
import { Is } from '../../misc/Is';
import type { ShaderSources } from '../../../webgl/WebGLStrategy';
import type { Primitive } from '../../geometry/Primitive';
import type { RenderingArg } from '../../../webgl/types/CommonTypes';
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

/**
 * The material class.
 * This class has one or more material nodes.
 */
export class Material extends RnObject {
  // Internal Resources
  __materialTypeName: MaterialTypeName;
  _materialContent: AbstractMaterialContent;
  _allFieldVariables: Map<ShaderSemanticsIndex, ShaderVariable> = new Map();
  _autoFieldVariablesOnly: Map<ShaderSemanticsIndex, ShaderVariable> = new Map();
  _allFieldsInfo: Map<ShaderSemanticsIndex, ShaderSemanticsInfo> = new Map();
  private __belongPrimitives: Map<PrimitiveUID, Primitive> = new Map();

  // Ids
  public _shaderProgramUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  __materialUid: MaterialUID = -1;
  private __materialTid: MaterialTID;
  __materialSid: MaterialSID = -1; // material serial Id in the material type

  // Common Rendering States
  private __alphaMode = AlphaMode.Opaque;
  public cullFace = true; // If true, enable gl.CULL_FACE
  public cullFrontFaceCCW = true;
  private __alphaToCoverage = false;
  private __blendEquationMode = Blend.EquationFuncAdd; // gl.FUNC_ADD
  private __blendEquationModeAlpha = Blend.EquationFuncAdd; // gl.FUNC_ADD
  private __blendFuncSrcFactor = Blend.SrcAlpha; // gl.SRC_ALPHA
  private __blendFuncDstFactor = Blend.OneMinusSrcAlpha; // gl.ONE_MINUS_SRC_ALPHA
  private __blendFuncAlphaSrcFactor = Blend.One; // gl.ONE
  private __blendFuncAlphaDstFactor = Blend.One; // gl.ONE

  private __stateVersion = 0;
  private static __stateVersion = 0;

  private static __webglResourceRepository?: WebGLResourceRepository;

  // static fields
  static _soloDatumFields: Map<MaterialTypeName, Map<ShaderSemanticsIndex, ShaderVariable>> =
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

  static get stateVersion() {
    return Material.__stateVersion;
  }

  ///
  /// Parameter Setters
  ///

  public setParameter(shaderSemantic: ShaderSemanticsEnum, value: any) {
    const propertyIndex = _getPropertyIndex2(shaderSemantic);
    const info = this._allFieldsInfo.get(propertyIndex);
    if (info != null) {
      let valueObj: ShaderVariable | undefined;
      if (info.soloDatum) {
        valueObj = Material._soloDatumFields.get(this.__materialTypeName)!.get(propertyIndex);
      } else {
        valueObj = this._allFieldVariables.get(propertyIndex);
      }
      const updated = MathClassUtil._setForce(valueObj!.value, value);

      if (updated) {
        this.__stateVersion++;
        Material.__stateVersion++;
      }
    }
  }

  public setTextureParameter(
    shaderSemantic: ShaderSemanticsEnum,
    texture: AbstractTexture,
    sampler: Sampler
  ): void {
    if (!sampler.created) {
      sampler.create();
    }

    if (this._allFieldsInfo.has(shaderSemantic.index)) {
      const setter = async () => {
        if (typeof (texture as Texture).loadFromUrlLazy !== 'undefined') {
          await (texture as Texture).loadFromUrlLazy();
          await (texture as Texture).loadFromImgLazy();
        }
        const array = this._allFieldVariables.get(shaderSemantic.index)!;
        const shaderVariable = {
          value: [array.value[0], texture, sampler],
          info: array.info,
        };
        this._allFieldVariables.set(shaderSemantic.index, shaderVariable);
        if (!array.info.isCustomSetting) {
          this._autoFieldVariablesOnly.set(shaderSemantic.index, shaderVariable);
        }
        if (
          shaderSemantic === ShaderSemantics.DiffuseColorTexture ||
          shaderSemantic === ShaderSemantics.BaseColorTexture
        ) {
          if (texture.isTransparent) {
            this.alphaMode = AlphaMode.Translucent;
          }
        }
        this.__stateVersion++;
        Material.__stateVersion++;
      };

      if (typeof (texture as Texture).hasDataToLoadLazy !== 'undefined') {
        if ((texture as Texture).hasDataToLoadLazy) {
          setTimeout(setter, 0);
        } else {
          setter();
        }
      } else {
        setter();
      }
    }
  }

  public getTextureParameter(shaderSemantic: ShaderSemanticsEnum) {
    if (this._allFieldsInfo.has(shaderSemantic.index)) {
      const array = this._allFieldVariables.get(shaderSemantic.index)!;
      return array.value[1];
    }
    return undefined;
  }

  public setTextureParameterAsPromise(
    shaderSemantic: ShaderSemanticsEnum,
    promise: Promise<AbstractTexture>
  ): void {
    promise.then((texture) => {
      if (this._allFieldsInfo.has(shaderSemantic.index)) {
        const array = this._allFieldVariables.get(shaderSemantic.index)!;
        const shaderVariable = {
          value: [array.value[0], texture],
          info: array.info,
        };
        this._allFieldVariables.set(shaderSemantic.index, shaderVariable);
        if (!array.info.isCustomSetting) {
          this._autoFieldVariablesOnly.set(shaderSemantic.index, shaderVariable);
        }
        if (
          shaderSemantic === ShaderSemantics.DiffuseColorTexture ||
          shaderSemantic === ShaderSemantics.BaseColorTexture
        ) {
          if (texture.isTransparent) {
            this.alphaMode = AlphaMode.Translucent;
          }
        }
      }
      this.__stateVersion++;
      Material.__stateVersion++;
    });
  }

  public getParameter(shaderSemantic: ShaderSemanticsEnum): any {
    const info = this._allFieldsInfo.get(shaderSemantic.index);
    if (info != null) {
      if (info.soloDatum) {
        return Material._soloDatumFields.get(this.__materialTypeName)!.get(shaderSemantic.index)
          ?.value;
      } else {
        return this._allFieldVariables.get(shaderSemantic.index)?.value;
      }
    }

    return void 0;
  }

  /**
   * return whether the shader program ready or not
   * @returns is shader program ready or not
   */
  public isShaderProgramReady() {
    return this._shaderProgramUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid;
  }

  /**
   * @internal
   * called from WebGLStrategyDataTexture and WebGLStrategyUniform only
   * @param isUniformOnlyMode
   */
  _setUniformLocationsOfMaterialNodes(isUniformOnlyMode: boolean) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();

    let array: ShaderSemanticsInfo[] = [];
    if (Is.exist(this._materialContent)) {
      const semanticsInfoArray = this._materialContent._semanticsInfoArray;
      array = array.concat(semanticsInfoArray);
    }

    webglResourceRepository.setupUniformLocations(this._shaderProgramUid, array, isUniformOnlyMode);
  }

  /**
   * @internal
   * called from Primitive class only
   * @param primitive
   */
  _addBelongPrimitive(primitive: Primitive) {
    this.__belongPrimitives.set(primitive.primitiveUid, primitive);
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
    isWebGL2: boolean
  ): CGAPIResourceHandle {
    const { vertexPropertiesStr, pixelPropertiesStr } = this._getProperties(
      propertySetter,
      isWebGL2
    );

    const programUid = _createProgramAsSingleOperationWebGL(
      this,
      vertexPropertiesStr,
      pixelPropertiesStr,
      vertexShaderMethodDefinitions_uniform,
      isWebGL2
    );
    this._shaderProgramUid = programUid;

    return programUid;
  }

  _createProgramWebGpu(
    primitive: Primitive,
    vertexShaderMethodDefinitions: string,
    propertySetter: getShaderPropertyFunc
  ) {
    const { vertexPropertiesStr, pixelPropertiesStr } = this._getProperties(propertySetter, true);
    const programUid = _createProgramAsSingleOperationWebGpu(
      this,
      primitive,
      vertexShaderMethodDefinitions,
      vertexPropertiesStr,
      pixelPropertiesStr
    );

    this._shaderProgramUid = programUid;
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
    onError?: (message: string) => void
  ): CGAPIResourceHandle {
    const programUid = _createProgramAsSingleOperationByUpdatedSources(
      this,
      this._materialContent,
      updatedShaderSources,
      onError
    );
    this._shaderProgramUid = programUid;

    if (programUid > 0) {
      // this.__updatedShaderSources = updatedShaderSources;
    }

    return programUid;
  }

  /**
   * @internal
   * called WebGLStrategyDataTexture and WebGLStrategyUniform only
   */
  _setupBasicUniformsLocations() {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webglResourceRepository.setupBasicUniformLocations(this._shaderProgramUid);
  }

  /**
   * @internal
   * called WebGLStrategyDataTexture and WebGLStrategyUniform only
   */
  _setupAdditionalUniformLocations(
    shaderSemantics: ShaderSemanticsInfo[],
    isUniformOnlyMode: boolean
  ) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    return webglResourceRepository.setupUniformLocations(
      this._shaderProgramUid,
      shaderSemantics,
      isUniformOnlyMode
    );
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
    args: RenderingArg;
  }) {
    // For Auto Parameters
    this.__setAutoParametersToGpuWebGL(args, firstTime, shaderProgram);

    // For Custom Setting Parameters
    if (Is.exist(this._materialContent._setCustomSettingParametersToGpuWebGL)) {
      this._materialContent._setCustomSettingParametersToGpuWebGL({
        material,
        shaderProgram,
        firstTime,
        args,
      });
    }

    // For SoloDatum Parameters
    this.__setSoloDatumParametersToGpuWebGL({
      shaderProgram,
      firstTime,
      args,
    });
  }

  /**
   * @internal
   * @param propertySetter
   */
  _getProperties(propertySetter: getShaderPropertyFunc, isWebGL2: boolean) {
    let vertexPropertiesStr = '';
    let pixelPropertiesStr = '';
    this._allFieldsInfo.forEach((value, propertyIndex: Index) => {
      const info = this._allFieldsInfo.get(propertyIndex);
      if (
        info!.stage === ShaderType.VertexShader ||
        info!.stage === ShaderType.VertexAndPixelShader
      ) {
        vertexPropertiesStr += propertySetter(
          this.__materialTypeName,
          info!,
          propertyIndex,
          false,
          isWebGL2
        );
      }
      if (
        info!.stage === ShaderType.PixelShader ||
        info!.stage === ShaderType.VertexAndPixelShader
      ) {
        pixelPropertiesStr += propertySetter(
          this.__materialTypeName,
          info!,
          propertyIndex,
          false,
          isWebGL2
        );
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
    args: RenderingArg,
    firstTime: boolean,
    shaderProgram: WebGLProgram
  ) {
    if (Material.__webglResourceRepository == null) {
      Material.__webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    }
    const webglResourceRepository = Material.__webglResourceRepository!;
    if (args.setUniform) {
      this._autoFieldVariablesOnly.forEach((value) => {
        const info = value.info;
        if (firstTime || info.updateInterval !== ShaderVariableUpdateInterval.FirstTimeOnly) {
          webglResourceRepository.setUniformValue(
            shaderProgram,
            info.semantic.str,
            firstTime,
            value.value
          );
        } else {
          if (CompositionType.isTexture(info.compositionType)) {
            webglResourceRepository.bindTexture(info, value.value);
          }
        }
      });
    } else {
      for (const [key, value] of this._autoFieldVariablesOnly) {
        const info = value.info;
        if (CompositionType.isTexture(info.compositionType)) {
          if (firstTime || info.updateInterval !== ShaderVariableUpdateInterval.FirstTimeOnly) {
            webglResourceRepository.setUniform1iForTexture(
              shaderProgram,
              info.semantic.str,
              value.value
            );
          } else {
            webglResourceRepository.bindTexture(info, value.value);
          }
        } else if (info.needUniformInDataTextureMode) {
          webglResourceRepository.setUniformValue(
            shaderProgram,
            info.semantic.str,
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
    args,
  }: {
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    args: RenderingArg;
  }) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const materialTypeName = this.__materialTypeName;
    const map = Material._soloDatumFields.get(materialTypeName);
    if (map == null) return;
    const values = map.values();
    for (const value of values) {
      const info = value.info;
      if (args.setUniform || CompositionType.isTexture(info.compositionType)) {
        if (!info.isCustomSetting) {
          if (firstTime || info.updateInterval !== ShaderVariableUpdateInterval.FirstTimeOnly) {
            webglResourceRepository.setUniformValue(
              shaderProgram,
              info.semantic.str,
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

  private __getTargetShaderSemantics(uniformName: string) {
    const targetFieldsInfo = this.fieldsInfoArray.find((fieldsInfo) => {
      const prefix = fieldsInfo.none_u_prefix ? '' : 'u_';
      return prefix + fieldsInfo.semantic.str === uniformName;
    });

    if (targetFieldsInfo == null) {
      console.error(`Material.__getTargetShaderSemantics: uniform ${uniformName} is not found`);
      return;
    }

    return targetFieldsInfo.semantic;
  }

  /**
   * Change the blendEquations
   * This method works only if this alphaMode is the translucent
   * @param blendEquationMode the argument of gl.blendEquation of the first argument of gl.blendEquationSeparate such as gl.FUNC_ADD
   * @param blendEquationModeAlpha the second argument of gl.blendEquationSeparate
   */
  public setBlendEquationMode(blendEquationMode: BlendEnum, blendEquationModeAlpha?: BlendEnum) {
    this.__blendEquationMode = blendEquationMode;
    this.__blendEquationModeAlpha = blendEquationModeAlpha ?? blendEquationMode;
    this.__stateVersion++;
    Material.__stateVersion++;
  }

  /**
   * Change the blendFuncSeparateFactors
   * This method works only if this alphaMode is the translucent
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
    this.__stateVersion++;
    Material.__stateVersion++;
  }

  /**
   * Change the blendFuncFactors
   * This method works only if this alphaMode is the translucent
   */
  public setBlendFuncFactor(blendFuncSrcFactor: BlendEnum, blendFuncDstFactor: BlendEnum) {
    this.__blendFuncSrcFactor = blendFuncSrcFactor;
    this.__blendFuncDstFactor = blendFuncDstFactor;
    this.__blendFuncAlphaSrcFactor = blendFuncSrcFactor;
    this.__blendFuncAlphaDstFactor = blendFuncDstFactor;
    this.__stateVersion++;
    Material.__stateVersion++;
  }

  // setMaterialNode(materialNode: AbstractMaterialNode) {
  //   this.__materialNode = materialNode;
  // }

  ///
  /// Getters
  ///

  isEmptyMaterial(): boolean {
    if (this._materialContent === undefined) {
      return true;
    } else {
      return false;
    }
  }

  isBlend() {
    if (this.alphaMode === AlphaMode.Translucent || this.alphaMode === AlphaMode.Additive) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * NOTE: To apply the alphaToCoverage, the output alpha value must not be fixed to constant value.
   * However, some shaders in the Rhodonite fixes the output alpha value to 1 by setAlphaIfNotInAlphaBlendMode.
   * So we need to improve the shader to use the alphaToCoverage.
   * @param alphaToCoverage apply alphaToCoverage to this material or not
   */
  set alphaToCoverage(alphaToCoverage: boolean) {
    if (alphaToCoverage && this.alphaMode === AlphaMode.Translucent) {
      console.warn(
        'If you set alphaToCoverage = true on a material whose AlphaMode is Translucent, you may get drawing problems.'
      );
    }
    this.__alphaToCoverage = alphaToCoverage;
    this.__stateVersion++;
    Material.__stateVersion++;
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
    this._shaderProgramUid = -1;
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
}
