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
  private _shaderProgramUidMap: Map<PrimitiveUID, CGAPIResourceHandle> = new Map();
  private _primitiveUid: PrimitiveUID = -1;
  __materialUid: MaterialUID = -1;
  private __materialTid: MaterialTID;
  __materialSid: MaterialSID = -1; // material serial Id in the material type

  // Common Rendering States
  private __alphaMode = AlphaMode.Opaque;
  public isTranslucent = false;
  public cullFace = true; // If true, enable gl.CULL_FACE
  public cullFrontFaceCCW = true;
  private __alphaToCoverage = false;
  private __blendEquationMode = Blend.EquationFuncAdd; // gl.FUNC_ADD
  private __blendEquationModeAlpha = Blend.EquationFuncAdd; // gl.FUNC_ADD
  private __blendFuncSrcFactor = Blend.One; // Not SrcAlpha. Because In Rhodonite, premultiplied alpha is used
  private __blendFuncDstFactor = Blend.OneMinusSrcAlpha; // gl.ONE_MINUS_SRC_ALPHA
  private __blendFuncAlphaSrcFactor = Blend.One; // gl.ONE
  private __blendFuncAlphaDstFactor = Blend.OneMinusSrcAlpha; // gl.ONE_MINUS_SRC_ALPHA

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
        if (!array.info.isInternalSetting) {
          this._autoFieldVariablesOnly.set(shaderSemantic.index, shaderVariable);
        }
        if (
          shaderSemantic === ShaderSemantics.DiffuseColorTexture ||
          shaderSemantic === ShaderSemantics.BaseColorTexture
        ) {
          if (texture.isTransparent) {
            this.alphaMode = AlphaMode.Blend;
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
        if (!array.info.isInternalSetting) {
          this._autoFieldVariablesOnly.set(shaderSemantic.index, shaderVariable);
        }
        if (
          shaderSemantic === ShaderSemantics.DiffuseColorTexture ||
          shaderSemantic === ShaderSemantics.BaseColorTexture
        ) {
          if (texture.isTransparent) {
            this.alphaMode = AlphaMode.Blend;
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
  public isShaderProgramReady(primitive: Primitive): boolean {
    return this._shaderProgramUidMap.has(primitive.primitiveUid);
  }

  /**
   * @internal
   * called from WebGLStrategyDataTexture and WebGLStrategyUniform only
   * @param isUniformOnlyMode
   */
  _setUniformLocationsOfMaterialNodes(isUniformOnlyMode: boolean, primitive?: Primitive) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();

    let array: ShaderSemanticsInfo[] = [];
    if (this._materialContent != null) {
      const semanticsInfoArray = this._materialContent._semanticsInfoArray;
      array = array.concat(semanticsInfoArray);
    }

    const shaderProgramUid = this._shaderProgramUidMap.get(
      primitive != null ? primitive.primitiveUid : this._primitiveUid
    );
    webglResourceRepository.setupUniformLocations(shaderProgramUid!, array, isUniformOnlyMode);
  }

  getShaderProgramUid(primitive?: Primitive): CGAPIResourceHandle {
    const primitiveUid = primitive !== undefined ? primitive.primitiveUid : this._primitiveUid;
    return this._shaderProgramUidMap.get(primitiveUid) ?? -1;
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
    primitive: Primitive,
    isWebGL2: boolean
  ): [CGAPIResourceHandle, boolean] {
    const { vertexPropertiesStr, pixelPropertiesStr } = this._getProperties(
      propertySetter,
      isWebGL2
    );

    const [programUid, newOne] = _createProgramAsSingleOperationWebGL(
      this,
      primitive,
      vertexPropertiesStr,
      pixelPropertiesStr,
      vertexShaderMethodDefinitions_uniform,
      isWebGL2
    );
    this._shaderProgramUidMap.set(primitive.primitiveUid, programUid);
    this._primitiveUid = primitive.primitiveUid;

    Material.__stateVersion++;

    return [programUid, newOne];
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

    this._shaderProgramUidMap.set(primitive.primitiveUid, programUid);
    this._primitiveUid = primitive.primitiveUid;
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
    onError?: (message: string) => void
  ): [CGAPIResourceHandle, boolean] {
    const [programUid, newOne] = _createProgramAsSingleOperationByUpdatedSources(
      this,
      this._materialContent,
      updatedShaderSources,
      onError
    );
    this._shaderProgramUidMap.set(this._primitiveUid, programUid);

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
  _setupBasicUniformsLocations(primitive?: Primitive) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();

    const primitiveUid = primitive != null ? primitive.primitiveUid : this._primitiveUid;
    const shaderProgramUid = this._shaderProgramUidMap.get(primitiveUid);
    webglResourceRepository.setupBasicUniformLocations(shaderProgramUid!);
  }

  /**
   * @internal
   * called WebGLStrategyDataTexture and WebGLStrategyUniform only
   */
  _setupAdditionalUniformLocations(
    shaderSemantics: ShaderSemanticsInfo[],
    isUniformOnlyMode: boolean,
    primitive?: Primitive
  ) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const primitiveUid = primitive != null ? primitive.primitiveUid : this._primitiveUid;
    const shaderProgramUid = this._shaderProgramUidMap.get(primitiveUid);
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
          info.semantic.str,
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

  /**
   * Change the blendEquations
   * This method works only if this alphaMode is the blend
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
    this.__stateVersion++;
    Material.__stateVersion++;
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
    this.__stateVersion++;
    Material.__stateVersion++;
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
    this._shaderProgramUidMap.clear();
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
