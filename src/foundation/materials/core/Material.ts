import {RnObject} from '../../core/RnObject';
import {AlphaMode, AlphaModeEnum} from '../../definitions/AlphaMode';
import {AbstractMaterialContent} from './AbstractMaterialContent';
import {
  ShaderSemanticsEnum,
  ShaderSemanticsInfo,
  ShaderSemantics,
  ShaderSemanticsIndex,
  getShaderPropertyFunc,
} from '../../definitions/ShaderSemantics';
import {CompositionType} from '../../definitions/CompositionType';
import {MathClassUtil} from '../../math/MathClassUtil';
import {ComponentType} from '../../definitions/ComponentType';
import {CGAPIResourceRepository} from '../../renderer/CGAPIResourceRepository';
import {AbstractTexture} from '../../textures/AbstractTexture';
import {MemoryManager} from '../../core/MemoryManager';
import {BufferUse} from '../../definitions/BufferUse';
import {Config} from '../../core/Config';
import {BufferView} from '../../memory/BufferView';
import {Accessor} from '../../memory/Accessor';
import {ShaderType} from '../../definitions/ShaderType';
import {
  Index,
  CGAPIResourceHandle,
  Count,
  IndexOf16Bytes,
  PrimitiveUID,
} from '../../../types/CommonTypes';
import {DataUtil} from '../../misc/DataUtil';
import {GlobalDataRepository} from '../../core/GlobalDataRepository';
import {System} from '../../system/System';
import {ProcessApproach} from '../../definitions/ProcessApproach';
import {BoneDataType} from '../../definitions/BoneDataType';
import {ShaderVariableUpdateInterval} from '../../definitions/ShaderVariableUpdateInterval';
import {WebGLContextWrapper} from '../../../webgl/WebGLContextWrapper';
import {ShaderityUtility} from './ShaderityUtility';
import {Is} from '../../misc/Is';
import {ShaderSources} from '../../../webgl/WebGLStrategy';
import {Primitive} from '../../geometry/Primitive';
import {AttributeNames, RenderingArg} from '../../../webgl/types/CommonTypes';
import {
  GL_FUNC_ADD,
  GL_ONE,
  GL_ONE_MINUS_SRC_ALPHA,
  GL_SRC_ALPHA,
} from '../../../types';
import {VertexAttributeEnum} from '../../definitions';

type MaterialTypeName = string;
type ShaderVariable = {
  value: any;
  info: ShaderSemanticsInfo;
};
type MaterialUID = Index; // a unique number of any Material
type MaterialSID = Index; // a serial number in the Material Type
type MaterialTID = Index; // a type number of the Material Type

/**
 * The material class.
 * This class has one or more material nodes.
 */
export class Material extends RnObject {
  // Internal Resources
  private __materialContent?: AbstractMaterialContent;
  private __allFieldVariables: Map<ShaderSemanticsIndex, ShaderVariable> =
    new Map();
  private __autoFieldVariablesOnly: Map<ShaderSemanticsIndex, ShaderVariable> =
    new Map();
  private __allFieldsInfo: Map<ShaderSemanticsIndex, ShaderSemanticsInfo> =
    new Map();
  private __belongPrimitives: Map<PrimitiveUID, Primitive> = new Map();
  private __updatedShaderSources?: ShaderSources;

  // Ids
  public _shaderProgramUid: CGAPIResourceHandle =
    CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __materialUid: MaterialUID = -1;
  private __materialTid: MaterialTID;
  private __materialSid: MaterialSID = -1;

  // Rendering States
  private __alphaMode = AlphaMode.Opaque;
  public cullFace = true; // If true, enable gl.CULL_FACE
  public cullFrontFaceCCW = true;
  private __alphaToCoverage = false;
  private __blendEquationMode = GL_FUNC_ADD; // gl.FUNC_ADD
  private __blendEquationModeAlpha = GL_FUNC_ADD; // gl.FUNC_ADD
  private __blendFuncSrcFactor = GL_SRC_ALPHA; // gl.SRC_ALPHA
  private __blendFuncDstFactor = GL_ONE_MINUS_SRC_ALPHA; // gl.ONE_MINUS_SRC_ALPHA
  private __blendFuncAlphaSrcFactor = GL_ONE; // gl.ONE
  private __blendFuncAlphaDstFactor = GL_ONE; // gl.ONE
  private __materialTypeName: MaterialTypeName;

  ///
  /// static members
  ///
  private static __soloDatumFields: Map<
    MaterialTypeName,
    Map<ShaderSemanticsIndex, ShaderVariable>
  > = new Map();
  private static __shaderHashMap: Map<number, CGAPIResourceHandle> = new Map();
  private static __shaderStringMap: Map<string, CGAPIResourceHandle> =
    new Map();
  private static __materialMap: Map<MaterialUID, Material> = new Map();
  private static __instances: Map<
    MaterialTypeName,
    Map<MaterialSID, Material>
  > = new Map();
  private static __instancesByTypes: Map<MaterialTypeName, Material> =
    new Map();
  private static __materialTids: Map<MaterialTypeName, MaterialTID> = new Map();
  private static __materialInstanceCountOfType: Map<MaterialTypeName, Count> =
    new Map();
  private static __materialTypes: Map<
    MaterialTypeName,
    AbstractMaterialContent | undefined
  > = new Map();
  private static __maxInstances: Map<MaterialTypeName, MaterialSID> = new Map();
  private static __bufferViews: Map<MaterialTypeName, BufferView> = new Map();
  private static __accessors: Map<
    MaterialTypeName,
    Map<ShaderSemanticsIndex, Accessor>
  > = new Map();
  private static __materialTidCount = -1;
  private static __materialUidCount = -1;

  private constructor(
    materialTid: Index,
    materialTypeName: string,
    materialNode: AbstractMaterialContent
  ) {
    super();
    this.__materialContent = materialNode;
    this.__materialTid = materialTid;
    this.__materialTypeName = materialTypeName;

    this.__initialize();
  }

  /**
   * Initialize Method
   */
  private __initialize() {
    this.__materialUid = ++Material.__materialUidCount;

    Material.__materialMap.set(this.__materialUid, this);
    Material.__instancesByTypes.set(this.__materialTypeName, this);

    this.tryToSetUniqueName(this.__materialTypeName, true);

    let countOfThisType = Material.__materialInstanceCountOfType.get(
      this.__materialTypeName
    ) as number;
    this.__materialSid = countOfThisType++;

    // set this material instance for the material type
    let map = Material.__instances.get(this.__materialTypeName);
    if (Is.not.exist(map)) {
      map = new Map();
      Material.__instances.set(this.__materialTypeName, map);
    }
    map.set(this.__materialSid, this);

    // set the count of instance for the material type
    Material.__materialInstanceCountOfType.set(
      this.__materialTypeName,
      countOfThisType
    );

    if (Is.exist(this.__materialContent)) {
      const semanticsInfoArray = this.__materialContent._semanticsInfoArray;
      const accessorMap = Material.__accessors.get(this.__materialTypeName);
      semanticsInfoArray.forEach(semanticsInfo => {
        const propertyIndex = Material._getPropertyIndex(semanticsInfo);
        this.__allFieldsInfo.set(propertyIndex, semanticsInfo);
        if (!semanticsInfo.soloDatum) {
          const accessor = accessorMap!.get(propertyIndex) as Accessor;
          const typedArray = accessor.takeOne() as Float32Array;
          const shaderVariable = {
            info: semanticsInfo,
            value: MathClassUtil.initWithFloat32Array(
              semanticsInfo.initialValue,
              semanticsInfo.initialValue,
              typedArray,
              semanticsInfo.compositionType
            ),
          };
          this.__allFieldVariables.set(propertyIndex, shaderVariable);
          if (!semanticsInfo.isCustomSetting) {
            this.__autoFieldVariablesOnly.set(propertyIndex, shaderVariable);
          }
        }
      });
    }
  }

  /**
   * @private
   * called from Primitive class only
   * @param primitive
   */
  _addBelongPrimitive(primitive: Primitive) {
    this.__belongPrimitives.set(primitive.primitiveUid, primitive);
  }

  // _belongPrimitives() {
  //   return Array.from(this.__belongPrimitives.values());
  // }

  ///
  /// Parameter Setters
  ///

  public setParameter(shaderSemantic: ShaderSemanticsEnum, value: any) {
    const propertyIndex = Material._getPropertyIndex2(shaderSemantic);
    const info = this.__allFieldsInfo.get(propertyIndex);
    if (info != null) {
      let valueObj: ShaderVariable | undefined;
      if (info.soloDatum) {
        valueObj = Material.__soloDatumFields
          .get(this.__materialTypeName)!
          .get(propertyIndex);
      } else {
        valueObj = this.__allFieldVariables.get(propertyIndex);
      }
      MathClassUtil._setForce(valueObj!.value, value);
    }
  }

  public setTextureParameter(
    shaderSemantic: ShaderSemanticsEnum,
    value: AbstractTexture
  ): void {
    if (this.__allFieldsInfo.has(shaderSemantic.index)) {
      const array = this.__allFieldVariables.get(shaderSemantic.index)!;
      const shaderVariable = {
        value: [array.value[0], value],
        info: array.info,
      };
      this.__allFieldVariables.set(shaderSemantic.index, shaderVariable);
      if (!array.info.isCustomSetting) {
        this.__autoFieldVariablesOnly.set(shaderSemantic.index, shaderVariable);
      }
      if (
        shaderSemantic === ShaderSemantics.DiffuseColorTexture ||
        shaderSemantic === ShaderSemantics.BaseColorTexture
      ) {
        if (value.isTransparent) {
          this.alphaMode = AlphaMode.Translucent;
        }
      }
    }
  }

  public getTextureParameter(shaderSemantic: ShaderSemanticsEnum) {
    if (this.__allFieldsInfo.has(shaderSemantic.index)) {
      const array = this.__allFieldVariables.get(shaderSemantic.index)!;
      return array.value[1];
    }
    return undefined;
  }

  public setTextureParameterAsPromise(
    shaderSemantic: ShaderSemanticsEnum,
    promise: Promise<AbstractTexture>
  ): void {
    promise.then(texture => {
      if (this.__allFieldsInfo.has(shaderSemantic.index)) {
        const array = this.__allFieldVariables.get(shaderSemantic.index)!;
        const shaderVariable = {
          value: [array.value[0], texture],
          info: array.info,
        };
        this.__allFieldVariables.set(shaderSemantic.index, shaderVariable);
        if (!array.info.isCustomSetting) {
          this.__autoFieldVariablesOnly.set(
            shaderSemantic.index,
            shaderVariable
          );
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
    });
  }

  // Note: The uniform defined in the GlobalDataRepository and the VertexAttributesExistenceArray,
  //       WorldMatrix, NormalMatrix, PointSize, and PointDistanceAttenuation cannot be set.
  public setParameterByUniformName(uniformName: string, value: any) {
    const targetShaderSemantics = this.__getTargetShaderSemantics(uniformName);
    if (targetShaderSemantics != null) {
      this.setParameter(targetShaderSemantics, value);
    }
  }

  public setTextureParameterByUniformName(uniformName: string, value: any) {
    const targetShaderSemantics = this.__getTargetShaderSemantics(uniformName);
    if (targetShaderSemantics != null) {
      this.setTextureParameter(targetShaderSemantics, value);
    }
  }

  public getParameter(shaderSemantic: ShaderSemanticsEnum): any {
    const info = this.__allFieldsInfo.get(shaderSemantic.index);
    if (info != null) {
      if (info.soloDatum) {
        return Material.__soloDatumFields
          .get(this.__materialTypeName)!
          .get(shaderSemantic.index)?.value;
      } else {
        return this.__allFieldVariables.get(shaderSemantic.index)?.value;
      }
    }

    return void 0;
  }

  /**
   * @private
   * called from WebGLStrategyFastest and WebGLStrategyUnfirom only
   * @param isUniformOnlyMode
   */
  _setUniformLocationsOfMaterialNodes(isUniformOnlyMode: boolean) {
    const webglResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();

    let array: ShaderSemanticsInfo[] = [];
    if (Is.exist(this.__materialContent)) {
      const semanticsInfoArray = this.__materialContent._semanticsInfoArray;
      array = array.concat(semanticsInfoArray);
    }

    webglResourceRepository.setupUniformLocations(
      this._shaderProgramUid,
      array,
      isUniformOnlyMode
    );
  }

  /**
   * return whether the shader program ready or not
   * @returns is shader program ready or not
   */
  public isShaderProgramReady() {
    return (
      this._shaderProgramUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid
    );
  }

  /**
   * @private
   * called from WebGLStrategyFastest and WebGLStrategyUnitform only
   */
  _setParametersToGpu({
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
    this.__setAutoParametersToGpu(args, firstTime, shaderProgram);

    // For Custom Setting Parameters
    if (
      Is.exist(this.__materialContent) &&
      Is.exist(this.__materialContent.setCustomSettingParametersToGpu)
    ) {
      this.__materialContent.setCustomSettingParametersToGpu({
        material,
        shaderProgram,
        firstTime,
        args,
      });
    }

    // For SoloDatum Parameters
    this.__setSoloDatumParametersToGpu({shaderProgram, firstTime, args});
  }

  private __setAutoParametersToGpu(
    args: RenderingArg,
    firstTime: boolean,
    shaderProgram: WebGLProgram
  ) {
    const webglResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
    if (args.setUniform) {
      this.__autoFieldVariablesOnly.forEach(value => {
        const info = value.info;
        if (
          firstTime ||
          info.updateInterval !== ShaderVariableUpdateInterval.FirstTimeOnly
        ) {
          webglResourceRepository.setUniformValue(
            shaderProgram,
            info.semantic.str,
            firstTime,
            value.value
          );
        } else {
          if (
            info.compositionType === CompositionType.Texture2D ||
            info.compositionType === CompositionType.TextureCube
          ) {
            webglResourceRepository.bindTexture(info, value.value);
          }
        }
      });
    } else {
      this.__autoFieldVariablesOnly.forEach(value => {
        const info = value.info;
        if (
          info.compositionType === CompositionType.Texture2D ||
          info.compositionType === CompositionType.TextureCube
        ) {
          if (
            firstTime ||
            info.updateInterval !== ShaderVariableUpdateInterval.FirstTimeOnly
          ) {
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
      });
    }
  }

  private __setSoloDatumParametersToGpu({
    shaderProgram,
    firstTime,
    args,
  }: {
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    args: RenderingArg;
  }) {
    const webglResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
    const materialTypeName = this.__materialTypeName;
    const map = Material.__soloDatumFields.get(materialTypeName);
    if (map == null) return;
    map.forEach((value, key) => {
      const info = value.info;
      if (
        args.setUniform ||
        info.compositionType === CompositionType.Texture2D ||
        info.compositionType === CompositionType.TextureCube
      ) {
        if (!info.isCustomSetting) {
          if (
            firstTime ||
            info.updateInterval !== ShaderVariableUpdateInterval.FirstTimeOnly
          ) {
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
    });
  }

  private __setupGlobalShaderDefinition() {
    let definitions = '';
    const webglResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
    const glw =
      webglResourceRepository.currentWebGLContextWrapper as WebGLContextWrapper;
    if (glw.isWebGL2) {
      definitions += '#version 300 es\n#define GLSL_ES3\n';
      if (Config.isUboEnabled) {
        definitions += '#define RN_IS_UBO_ENABLED\n';
      }
    }
    definitions += `#define RN_MATERIAL_TYPE_NAME ${this.__materialTypeName}\n`;
    if (ProcessApproach.isFastestApproach(System.processApproach)) {
      definitions += '#define RN_IS_FASTEST_MODE\n';
    } else {
      definitions += '#define RN_IS_UNIFORM_MODE\n';
    }
    if (glw.webgl1ExtSTL) {
      definitions += '#define WEBGL1_EXT_SHADER_TEXTURE_LOD\n';
    }
    if (glw.webgl1ExtDRV) {
      definitions += '#define WEBGL1_EXT_STANDARD_DERIVATIVES\n';
    }

    if (glw.isWebGL2 || glw.webgl1ExtDRV) {
      definitions += '#define RN_IS_SUPPORTING_STANDARD_DERIVATIVES\n';
    }
    if (Config.boneDataType === BoneDataType.Mat44x1) {
      definitions += '#define RN_BONE_DATA_TYPE_Mat44x1\n';
    } else if (Config.boneDataType === BoneDataType.Vec4x2) {
      definitions += '#define RN_BONE_DATA_TYPE_VEC4X2\n';
    } else if (Config.boneDataType === BoneDataType.Vec4x2Old) {
      definitions += '#define RN_BONE_DATA_TYPE_VEC4X2_OLD\n';
    } else if (Config.boneDataType === BoneDataType.Vec4x1) {
      definitions += '#define RN_BONE_DATA_TYPE_VEC4X1\n';
    }

    return definitions;
  }

  private __createProgramAsSingleOperation(
    vertexShaderMethodDefinitions_uniform: string,
    propertySetter: getShaderPropertyFunc,
    isWebGL2: boolean
  ): CGAPIResourceHandle {
    const webglResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
    const materialNode = this.__materialContent!;

    const {vertexPropertiesStr, pixelPropertiesStr} = this._getProperties(
      propertySetter,
      isWebGL2
    );

    const definitions = materialNode.definitions;

    // Shader Construction
    let vertexShader = this.__setupGlobalShaderDefinition();
    let pixelShader = this.__setupGlobalShaderDefinition();

    const vertexShaderityObject = ShaderityUtility.fillTemplate(
      materialNode.vertexShaderityObject!,
      {
        getters: vertexPropertiesStr,
        definitions: definitions,
        dataUBODefinition:
          webglResourceRepository.getGlslDataUBODefinitionString(),
        dataUBOVec4Size: webglResourceRepository.getGlslDataUBOVec4SizeString(),
        matricesGetters: vertexShaderMethodDefinitions_uniform,
      }
    );
    const vertexShaderBody = ShaderityUtility.transformWebGLVersion(
      vertexShaderityObject,
      isWebGL2
    ).code;

    const pixelShaderityObject = ShaderityUtility.fillTemplate(
      materialNode.pixelShaderityObject!,
      {
        getters: pixelPropertiesStr,
        definitions: definitions,
        dataUBODefinition:
          webglResourceRepository.getGlslDataUBODefinitionString(),
        dataUBOVec4Size: webglResourceRepository.getGlslDataUBOVec4SizeString(),
      }
    );
    const pixelShaderBody = ShaderityUtility.transformWebGLVersion(
      pixelShaderityObject,
      isWebGL2
    ).code;

    vertexShader += vertexShaderBody.replace(/#version\s+(100|300\s+es)/, '');
    pixelShader += pixelShaderBody.replace(/#version\s+(100|300\s+es)/, '');

    const {attributeNames, attributeSemantics} =
      this.__getAttributeInfo(materialNode);
    const vertexAttributesBinding = this.__outputVertexAttributeBindingInfo(
      attributeNames,
      attributeSemantics
    );
    vertexShader += vertexAttributesBinding;

    return this.__createShaderProgramWithCache(
      vertexShader,
      pixelShader,
      attributeNames,
      attributeSemantics
    );
  }

  private __createProgramAsSingleOperationByUpdatedSources(
    updatedShaderSources: ShaderSources
  ) {
    const materialNode = this.__materialContent!;
    const {attributeNames, attributeSemantics} =
      this.__getAttributeInfo(materialNode);

    return this.__createShaderProgramWithCache(
      updatedShaderSources.vertex,
      updatedShaderSources.pixel,
      attributeNames,
      attributeSemantics
    );
  }

  private __createShaderProgramWithCache(
    vertexShader: string,
    pixelShader: string,
    attributeNames: AttributeNames,
    attributeSemantics: VertexAttributeEnum[]
  ) {
    // Cache
    const wholeShaderText = vertexShader + pixelShader;
    let shaderProgramUid = Material.__shaderStringMap.get(wholeShaderText);
    if (shaderProgramUid) {
      this._shaderProgramUid = shaderProgramUid;
      return shaderProgramUid;
    }
    const hash = DataUtil.toCRC32(wholeShaderText);
    shaderProgramUid = Material.__shaderHashMap.get(hash);
    if (shaderProgramUid) {
      this._shaderProgramUid = shaderProgramUid;
      return this._shaderProgramUid;
    } else {
      const webglResourceRepository =
        CGAPIResourceRepository.getWebGLResourceRepository();
      this._shaderProgramUid = webglResourceRepository.createShaderProgram({
        material: this,
        vertexShaderStr: vertexShader,
        fragmentShaderStr: pixelShader,
        attributeNames: attributeNames,
        attributeSemantics: attributeSemantics,
      });
      Material.__shaderStringMap.set(wholeShaderText, this._shaderProgramUid);
      Material.__shaderHashMap.set(hash, this._shaderProgramUid);
      return this._shaderProgramUid;
    }
  }

  private __getAttributeInfo(materialNode: AbstractMaterialContent) {
    const reflection = ShaderityUtility.getAttributeReflection(
      materialNode.vertexShaderityObject!
    );
    const attributeNames = reflection.names;
    const attributeSemantics = reflection.semantics;
    return {attributeNames, attributeSemantics};
  }

  private __outputVertexAttributeBindingInfo(
    attributeNames: string[],
    attributeSemantics: VertexAttributeEnum[]
  ) {
    let vertexAttributesBinding = '\n// Vertex Attributes Binding Info\n';
    for (let i = 0; i < attributeNames.length; i++) {
      vertexAttributesBinding += `// ${attributeNames[i]}: ${attributeSemantics[i].str} \n`;
    }
    return vertexAttributesBinding;
  }

  /**
   * @private
   * @param propertySetter
   */
  _getProperties(propertySetter: getShaderPropertyFunc, isWebGL2: boolean) {
    let vertexPropertiesStr = '';
    let pixelPropertiesStr = '';
    this.__allFieldsInfo.forEach((value, propertyIndex: Index) => {
      const info = this.__allFieldsInfo.get(propertyIndex);
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
    [vertexPropertiesStr, pixelPropertiesStr] =
      globalDataRepository.addPropertiesStr(
        vertexPropertiesStr,
        pixelPropertiesStr,
        propertySetter,
        isWebGL2
      );
    return {vertexPropertiesStr, pixelPropertiesStr};
  }

  private __getTargetShaderSemantics(uniformName: string) {
    const targetFieldsInfo = this.fieldsInfoArray.find(fieldsInfo => {
      const prefix = fieldsInfo.none_u_prefix ? '' : 'u_';
      return prefix + fieldsInfo.semantic.str === uniformName;
    });

    if (targetFieldsInfo == null) {
      console.error(
        `Material.__getTargetShaderSemantics: uniform ${uniformName} is not found`
      );
      return;
    }

    return targetFieldsInfo.semantic;
  }

  /**
   * @private
   * called from WebGLStrategyFastest and WebGLStrategyUnfirom
   * @param vertexShaderMethodDefinitions_uniform
   * @param propertySetter
   * @param isWebGL2
   * @returns
   */
  _createProgram(
    vertexShaderMethodDefinitions_uniform: string,
    propertySetter: getShaderPropertyFunc,
    isWebGL2: boolean
  ): CGAPIResourceHandle {
    const programUid = this.__createProgramAsSingleOperation(
      vertexShaderMethodDefinitions_uniform,
      propertySetter,
      isWebGL2
    );

    return programUid;
  }

  createProgramByUpdatedSources(
    updatedShaderSources: ShaderSources
  ): CGAPIResourceHandle {
    const programUid =
      this.__createProgramAsSingleOperationByUpdatedSources(
        updatedShaderSources
      );

    if (programUid > 0) {
      this.__updatedShaderSources = updatedShaderSources;
    }

    return programUid;
  }

  /**
   * Change the blendEquations
   * This method works only if this alphaMode is the translucent
   * @param blendEquationMode the argument of gl.blendEquation of the first argument of gl.blendEquationSeparate such as gl.FUNC_ADD
   * @param blendEquationModeAlpha the second argument of gl.blendEquationSeparate
   */
  setBlendEquationMode(
    blendEquationMode: number,
    blendEquationModeAlpha?: number
  ) {
    this.__blendEquationMode = blendEquationMode;
    this.__blendEquationModeAlpha = blendEquationModeAlpha ?? blendEquationMode;
  }

  /**
   * Change the blendFuncSeparateFactors
   * This method works only if this alphaMode is the translucent
   */
  setBlendFuncSeparateFactor(
    blendFuncSrcFactor: number,
    blendFuncDstFactor: number,
    blendFuncAlphaSrcFactor: number,
    blendFuncAlphaDstFactor: number
  ) {
    this.__blendFuncSrcFactor = blendFuncSrcFactor;
    this.__blendFuncDstFactor = blendFuncDstFactor;
    this.__blendFuncAlphaSrcFactor = blendFuncAlphaSrcFactor;
    this.__blendFuncAlphaDstFactor = blendFuncAlphaDstFactor;
  }

  /**
   * Change the blendFuncFactors
   * This method works only if this alphaMode is the translucent
   */
  setBlendFuncFactor(blendFuncSrcFactor: number, blendFuncDstFactor: number) {
    this.__blendFuncSrcFactor = blendFuncSrcFactor;
    this.__blendFuncDstFactor = blendFuncDstFactor;
    this.__blendFuncAlphaSrcFactor = blendFuncSrcFactor;
    this.__blendFuncAlphaDstFactor = blendFuncDstFactor;
  }

  /**
   * @private
   * called WebGLStrategyFastest and WebGLStrategyUniform only
   */
  _setupBasicUniformsLocations() {
    const webglResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
    webglResourceRepository.setupBasicUniformLocations(this._shaderProgramUid);
  }

  ////////////////
  /// Setters
  ////////////////

  /**
   * @private
   * called WebGLStrategyFastest and WebGLStrategyUniform only
   */
  _setupAdditionalUniformLocations(
    shaderSemantics: ShaderSemanticsInfo[],
    isUniformOnlyMode: boolean
  ) {
    const webglResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
    return webglResourceRepository.setupUniformLocations(
      this._shaderProgramUid,
      shaderSemantics,
      isUniformOnlyMode
    );
  }

  // setMaterialNode(materialNode: AbstractMaterialNode) {
  //   this.__materialNode = materialNode;
  // }

  ///
  /// Getters
  ///

  isEmptyMaterial(): boolean {
    if (this.__materialContent === undefined) {
      return true;
    } else {
      return false;
    }
  }

  isBlend() {
    if (
      this.alphaMode === AlphaMode.Translucent ||
      this.alphaMode === AlphaMode.Additive
    ) {
      return true;
    } else {
      return false;
    }
  }

  // getShaderSemanticInfoFromName(name: string) {
  //   if (Is.exist(this.__materialNode)) {
  //     return this.__materialNode.getShaderSemanticInfoFromName(name);
  //   }
  //   return undefined;
  // }

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
  }
  get alphaToCoverage() {
    return this.__alphaToCoverage;
  }

  /**
   * Gets materialTID.
   */
  get materialTID() {
    return this.__materialTid;
  }

  get fieldsInfoArray() {
    return Array.from(this.__allFieldsInfo.values());
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
  }

  get materialUID() {
    return this.__materialUid;
  }

  get materialSID() {
    return this.__materialSid;
  }

  get isSkinning() {
    return this.__materialContent!.isSkinning;
  }

  get isMorphing() {
    return this.__materialContent!.isMorphing;
  }

  get isLighting() {
    return this.__materialContent!.isLighting;
  }

  get materialTypeName() {
    return this.__materialTypeName;
  }

  /**
   * Creates an instance of this Material class.
   * @param materialTypeName The material type to create.
   * @param materialNodes_ The material nodes to add to the created material.
   */
  static createMaterial(
    materialTypeName: string,
    materialNode_?: AbstractMaterialContent
  ) {
    let materialNode = materialNode_;
    if (!materialNode) {
      materialNode = Material.__materialTypes.get(materialTypeName)!;
    }

    return new Material(
      Material.__materialTids.get(materialTypeName)!,
      materialTypeName,
      materialNode
    );
  }

  static getLocationOffsetOfMemberOfMaterial(
    materialTypeName: string,
    propertyIndex: Index
  ): IndexOf16Bytes {
    const material = Material.__instancesByTypes.get(materialTypeName)!;
    const info = material.__allFieldsInfo.get(propertyIndex)!;
    if (info.soloDatum) {
      const value = Material.__soloDatumFields
        .get(material.__materialTypeName)!
        .get(propertyIndex);
      return (value!.value._v as Float32Array).byteOffset / 4 / 4;
    } else {
      const properties = this.__accessors.get(materialTypeName);
      const accessor = properties!.get(propertyIndex);
      return accessor!.byteOffsetInBuffer / 4 / 4;
    }
  }

  // static getAccessorOfMemberOfMaterial(
  //   materialTypeName: string,
  //   propertyIndex: Index
  // ): Accessor | undefined {
  //   const material = Material.__instancesByTypes.get(materialTypeName)!;
  //   const info = material.__fieldsInfo.get(propertyIndex)!;
  //   if (info.soloDatum) {
  //     return void 0;
  //   } else {
  //     const properties = this.__accessors.get(materialTypeName);
  //     const accessor = properties!.get(propertyIndex);
  //     return accessor;
  //   }
  // }

  static isRegisteredMaterialType(materialTypeName: string) {
    return Material.__materialTypes.has(materialTypeName);
  }

  static _calcAlignedByteLength(semanticInfo: ShaderSemanticsInfo) {
    const compositionNumber =
      semanticInfo.compositionType.getNumberOfComponents();
    const componentSizeInByte = semanticInfo.componentType.getSizeInBytes();
    const semanticInfoByte = compositionNumber * componentSizeInByte;
    let alignedByteLength = semanticInfoByte;
    if (alignedByteLength % 16 !== 0) {
      alignedByteLength = semanticInfoByte + 16 - (semanticInfoByte % 16);
    }
    if (CompositionType.isArray(semanticInfo.compositionType)) {
      const maxArrayLength = semanticInfo.arrayLength;
      if (maxArrayLength != null) {
        alignedByteLength *= maxArrayLength;
      } else {
        console.error('semanticInfo has invalid maxIndex!');
        alignedByteLength *= 100;
      }
    }
    return alignedByteLength;
  }

  public static getMaterialByMaterialUid(materialUid: MaterialSID) {
    return this.__materialMap.get(materialUid);
  }

  private static __allocateBufferView(
    materialTypeName: string,
    materialNode: AbstractMaterialContent
  ) {
    let totalByteLength = 0;
    const alignedByteLengthAndSemanticInfoArray = [];
    for (const semanticInfo of materialNode._semanticsInfoArray) {
      const alignedByteLength = Material._calcAlignedByteLength(semanticInfo);
      let dataCount = 1;
      if (!semanticInfo.soloDatum) {
        dataCount = Material.__maxInstances.get(materialTypeName)!;
      }

      totalByteLength += alignedByteLength * dataCount;
      alignedByteLengthAndSemanticInfoArray.push({
        alignedByte: alignedByteLength,
        semanticInfo: semanticInfo,
      });
    }

    if (!this.__accessors.has(materialTypeName)) {
      this.__accessors.set(materialTypeName, new Map());
    }

    const buffer = MemoryManager.getInstance().createOrGetBuffer(
      BufferUse.GPUInstanceData
    );
    let bufferView;
    if (this.__bufferViews.has(materialTypeName)) {
      bufferView = this.__bufferViews.get(materialTypeName);
    } else {
      const result = buffer.takeBufferView({
        byteLengthToNeed: totalByteLength,
        byteStride: 0,
      });
      bufferView = result.unwrapForce();
      this.__bufferViews.set(materialTypeName, bufferView);
    }

    for (let i = 0; i < alignedByteLengthAndSemanticInfoArray.length; i++) {
      const alignedByte = alignedByteLengthAndSemanticInfoArray[i].alignedByte;
      const semanticInfo =
        alignedByteLengthAndSemanticInfoArray[i].semanticInfo;

      let count = 1;
      if (!semanticInfo.soloDatum) {
        count = Material.__maxInstances.get(materialTypeName)!;
      }
      let maxArrayLength = semanticInfo.arrayLength;
      if (
        CompositionType.isArray(semanticInfo.compositionType) &&
        maxArrayLength == null
      ) {
        maxArrayLength = 100;
      }
      const accessor = bufferView!.takeAccessor({
        compositionType: semanticInfo.compositionType,
        componentType: ComponentType.Float,
        count: count,
        byteStride: alignedByte,
        arrayLength: maxArrayLength,
      }).unwrapForce();

      const propertyIndex = this._getPropertyIndex(semanticInfo);
      if (semanticInfo.soloDatum) {
        const typedArray = accessor.takeOne() as Float32Array;
        let map = this.__soloDatumFields.get(materialTypeName);
        if (map == null) {
          map = new Map();
          this.__soloDatumFields.set(materialTypeName, map);
        }

        map.set(this._getPropertyIndex(semanticInfo), {
          info: semanticInfo,
          value: MathClassUtil.initWithFloat32Array(
            semanticInfo.initialValue,
            semanticInfo.initialValue,
            typedArray,
            semanticInfo.compositionType
          ),
        });
      } else {
        const properties = this.__accessors.get(materialTypeName)!;
        properties.set(propertyIndex, accessor);
      }
    }

    return bufferView;
  }

  /**
   * Registers the material type.
   * @param materialTypeName The type name of the material.
   * @param materialNodes The material nodes to register.
   * @param maxInstancesNumber The maximum number to create the material instances.
   */
  static registerMaterial(
    materialTypeName: string,
    materialNode?: AbstractMaterialContent,
    maxInstanceNumber: number = Config.maxMaterialInstanceForEachType
  ) {
    if (!Material.__materialTypes.has(materialTypeName)) {
      Material.__materialTypes.set(materialTypeName, materialNode);

      const materialTid = ++Material.__materialTidCount;
      Material.__materialTids.set(materialTypeName, materialTid);
      Material.__maxInstances.set(materialTypeName, maxInstanceNumber);

      if (Is.exist(materialNode)) {
        Material.__allocateBufferView(materialTypeName, materialNode);
      }
      Material.__materialInstanceCountOfType.set(materialTypeName, 0);

      return true;
    } else {
      console.info(`${materialTypeName} is already registered.`);
      return false;
    }
  }

  static forceRegisterMaterial(
    materialTypeName: string,
    materialNode: AbstractMaterialContent,
    maxInstanceNumber: number = Config.maxMaterialInstanceForEachType
  ) {
    Material.__materialTypes.set(materialTypeName, materialNode);

    const materialTid = ++Material.__materialTidCount;
    Material.__materialTids.set(materialTypeName, materialTid);
    Material.__maxInstances.set(materialTypeName, maxInstanceNumber);

    Material.__allocateBufferView(materialTypeName, materialNode);
    Material.__materialInstanceCountOfType.set(materialTypeName, 0);

    return true;
  }

  static getAllMaterials() {
    return Array.from(Material.__materialMap.values());
  }

  /**
   * @private
   */
  static _getPropertyIndex(semanticInfo: ShaderSemanticsInfo) {
    const propertyIndex = semanticInfo.semantic.index;
    return propertyIndex;
  }

  /**
   * @private
   */
  static _getPropertyIndex2(shaderSemantic: ShaderSemanticsEnum) {
    const propertyIndex = shaderSemantic.index;
    return propertyIndex;
  }
}
