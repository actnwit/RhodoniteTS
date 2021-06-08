import RnObject from '../../core/RnObject';
import {AlphaMode, AlphaModeEnum} from '../../definitions/AlphaMode';
import AbstractMaterialNode from './AbstractMaterialNode';
import {
  ShaderSemanticsEnum,
  ShaderSemanticsInfo,
  ShaderSemantics,
  ShaderSemanticsIndex,
  getShaderPropertyFunc,
} from '../../definitions/ShaderSemantics';
import {CompositionType} from '../../definitions/CompositionType';
import MathClassUtil from '../../math/MathClassUtil';
import {ComponentType} from '../../definitions/ComponentType';
import CGAPIResourceRepository from '../../renderer/CGAPIResourceRepository';
import AbstractTexture from '../../textures/AbstractTexture';
import MemoryManager from '../../core/MemoryManager';
import {BufferUse} from '../../definitions/BufferUse';
import Config from '../../core/Config';
import BufferView from '../../memory/BufferView';
import Accessor from '../../memory/Accessor';
import {ShaderType} from '../../definitions/ShaderType';
import {
  Index,
  CGAPIResourceHandle,
  Count,
  IndexOf16Bytes,
} from '../../../types/CommonTypes';
import DataUtil from '../../misc/DataUtil';
import GlobalDataRepository from '../../core/GlobalDataRepository';
import System from '../../system/System';
import {ProcessApproach} from '../../definitions/ProcessApproach';
import ShaderityUtility from './ShaderityUtility';
import {BoneDataType} from '../../definitions/BoneDataType';
import {ShaderVariableUpdateInterval} from '../../definitions/ShaderVariableUpdateInterval';
import WebGLContextWrapper from '../../../webgl/WebGLContextWrapper';

type MaterialTypeName = string;
type ShaderVariable = {
  value: any;
  info: ShaderSemanticsInfo;
};

/**
 * The material class.
 * This class has one or more material nodes.
 */
export default class Material extends RnObject {
  private __materialNodes: AbstractMaterialNode[] = [];

  private __fields: Map<ShaderSemanticsIndex, ShaderVariable> = new Map();
  private __fieldsForNonSystem: Map<ShaderSemanticsIndex, ShaderVariable> =
    new Map();
  private static __soloDatumFields: Map<
    MaterialTypeName,
    Map<ShaderSemanticsIndex, ShaderVariable>
  > = new Map();
  private __fieldsInfo: Map<ShaderSemanticsIndex, ShaderSemanticsInfo> =
    new Map();

  public _shaderProgramUid: CGAPIResourceHandle =
    CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __alphaMode = AlphaMode.Opaque;
  private static __shaderHashMap: Map<number, CGAPIResourceHandle> = new Map();
  private static __shaderStringMap: Map<string, CGAPIResourceHandle> =
    new Map();
  private static __materials: Material[] = [];
  private static __instancesByTypes: Map<MaterialTypeName, Material> =
    new Map();
  private __materialTid: Index;
  private static __materialTidCount = -1;

  private static __materialTids: Map<MaterialTypeName, Index> = new Map();
  private static __materialInstanceCountOfType: Map<MaterialTypeName, Count> =
    new Map();
  private __materialSid: Index = -1;
  private static __materialTypes: Map<
    MaterialTypeName,
    AbstractMaterialNode[]
  > = new Map();
  private static __maxInstances: Map<MaterialTypeName, number> = new Map();
  private __materialTypeName: MaterialTypeName;
  private static __bufferViews: Map<MaterialTypeName, BufferView> = new Map();
  private static __accessors: Map<
    MaterialTypeName,
    Map<ShaderSemanticsIndex, Accessor>
  > = new Map();

  public cullFace = true; // If true, enable gl.CULL_FACE
  public cullFrontFaceCCW = true;

  private __blendEquationMode = 32774; // gl.FUNC_ADD
  private __blendEquationModeAlpha = 32774; // gl.FUNC_ADD
  private __blendFuncSrcFactor = 770; // gl.SRC_ALPHA
  private __blendFuncDstFactor = 771; // gl.ONE_MINUS_SRC_ALPHA
  private __blendFuncAlphaSrcFactor = 1; // gl.ONE
  private __blendFuncAlphaDstFactor = 1; // gl.ONE

  private constructor(
    materialTid: Index,
    materialTypeName: string,
    materialNodes: AbstractMaterialNode[]
  ) {
    super();
    this.__materialNodes = materialNodes;
    this.__materialTid = materialTid;
    this.__materialTypeName = materialTypeName;

    Material.__materials.push(this);
    Material.__instancesByTypes.set(materialTypeName, this);
    this.tryToSetUniqueName(materialTypeName, true);
    this.initialize();
  }

  get materialTypeName() {
    return this.__materialTypeName;
  }

  /**
   * Gets materialTID.
   */
  get materialTID() {
    return this.__materialTid;
  }

  get fieldsInfoArray() {
    return Array.from(this.__fieldsInfo.values());
  }

  /**
   * Creates an instance of this Material class.
   * @param materialTypeName The material type to create.
   * @param materialNodes_ The material nodes to add to the created material.
   */
  static createMaterial(
    materialTypeName: string,
    materialNodes_?: AbstractMaterialNode[]
  ) {
    let materialNodes = materialNodes_;
    if (!materialNodes) {
      materialNodes = Material.__materialTypes.get(materialTypeName)!;
    }

    return new Material(
      Material.__materialTids.get(materialTypeName)!,
      materialTypeName,
      materialNodes
    );
  }

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
      const maxArrayLength = semanticInfo.maxIndex;
      if (maxArrayLength != null) {
        alignedByteLength *= maxArrayLength;
      } else {
        console.error('semanticInfo has invalid maxIndex!');
        alignedByteLength *= 100;
      }
    }
    return alignedByteLength;
  }

  private static __allocateBufferView(
    materialTypeName: string,
    materialNodes: AbstractMaterialNode[]
  ) {
    let totalByteLength = 0;
    const alignedByteLengthAndSemanticInfoArray = [];
    for (const materialNode of materialNodes) {
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
      bufferView = buffer.takeBufferView({
        byteLengthToNeed: totalByteLength,
        byteStride: 0,
      });
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
      let maxArrayLength = semanticInfo.maxIndex;
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
      });

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
    materialNodes: AbstractMaterialNode[],
    maxInstanceNumber: number = Config.maxMaterialInstanceForEachType
  ) {
    if (!Material.__materialTypes.has(materialTypeName)) {
      Material.__materialTypes.set(materialTypeName, materialNodes);

      const materialTid = ++Material.__materialTidCount;
      Material.__materialTids.set(materialTypeName, materialTid);
      Material.__maxInstances.set(materialTypeName, maxInstanceNumber);

      Material.__allocateBufferView(materialTypeName, materialNodes);
      Material.__materialInstanceCountOfType.set(materialTypeName, 0);

      return true;
    } else {
      console.info(`${materialTypeName} is already registered.`);
      return false;
    }
  }

  static forceRegisterMaterial(
    materialTypeName: string,
    materialNodes: AbstractMaterialNode[],
    maxInstanceNumber: number = Config.maxMaterialInstanceForEachType
  ) {
    Material.__materialTypes.set(materialTypeName, materialNodes);

    const materialTid = ++Material.__materialTidCount;
    Material.__materialTids.set(materialTypeName, materialTid);
    Material.__maxInstances.set(materialTypeName, maxInstanceNumber);

    Material.__allocateBufferView(materialTypeName, materialNodes);
    Material.__materialInstanceCountOfType.set(materialTypeName, 0);

    return true;
  }

  static getAllMaterials() {
    return Material.__materials;
  }

  setMaterialNodes(materialNodes: AbstractMaterialNode[]) {
    this.__materialNodes = materialNodes;
  }

  get materialSID() {
    return this.__materialSid;
  }

  get isSkinning() {
    return this.__materialNodes[0].isSkinning;
  }
  get isMorphing() {
    return this.__materialNodes[0].isMorphing;
  }
  get isLighting() {
    return this.__materialNodes[0].isLighting;
  }

  /**
   * @private
   */
  static _getPropertyIndex(semanticInfo: ShaderSemanticsInfo) {
    let propertyIndex = semanticInfo.semantic.index;
    if (semanticInfo.index != null) {
      propertyIndex += semanticInfo.index;
      propertyIndex *= -1;
    }
    return propertyIndex;
  }

  /**
   * @private
   */
  static _getPropertyIndex2(
    shaderSemantic: ShaderSemanticsEnum,
    index?: Index
  ) {
    let propertyIndex = shaderSemantic.index;
    if (index != null) {
      propertyIndex += index;
      propertyIndex *= -1;
    }
    return propertyIndex;
  }

  initialize() {
    let countOfThisType = Material.__materialInstanceCountOfType.get(
      this.__materialTypeName
    ) as number;
    this.__materialSid = countOfThisType++;
    Material.__materialInstanceCountOfType.set(
      this.__materialTypeName,
      countOfThisType
    );

    this.__materialNodes.forEach(materialNode => {
      const semanticsInfoArray = materialNode._semanticsInfoArray;
      const accessorMap = Material.__accessors.get(this.__materialTypeName);
      semanticsInfoArray.forEach(semanticsInfo => {
        const propertyIndex = Material._getPropertyIndex(semanticsInfo);
        this.__fieldsInfo.set(propertyIndex, semanticsInfo);
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
          this.__fields.set(propertyIndex, shaderVariable);
          if (!semanticsInfo.isSystem) {
            this.__fieldsForNonSystem.set(propertyIndex, shaderVariable);
          }
        }
      });
    });
  }

  setParameter(shaderSemantic: ShaderSemanticsEnum, value: any, index?: Index) {
    const propertyIndex = Material._getPropertyIndex2(shaderSemantic, index);
    const info = this.__fieldsInfo.get(propertyIndex);
    if (info != null) {
      let valueObj: ShaderVariable | undefined;
      if (info.soloDatum) {
        valueObj = Material.__soloDatumFields
          .get(this.__materialTypeName)!
          .get(propertyIndex);
      } else {
        valueObj = this.__fields.get(propertyIndex);
      }
      MathClassUtil._setForce(valueObj!.value, value);
    }
  }

  setTextureParameter(
    shaderSemantic: ShaderSemanticsEnum,
    value: AbstractTexture
  ): void {
    if (this.__fieldsInfo.has(shaderSemantic.index)) {
      const array = this.__fields.get(shaderSemantic.index)!;
      const shaderVariable = {
        value: [array.value[0], value],
        info: array.info,
      };
      this.__fields.set(shaderSemantic.index, shaderVariable);
      if (!array.info.isSystem) {
        this.__fieldsForNonSystem.set(shaderSemantic.index, shaderVariable);
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

  getParameter(shaderSemantic: ShaderSemanticsEnum): any {
    const info = this.__fieldsInfo.get(shaderSemantic.index);
    if (info != null) {
      if (info.soloDatum) {
        return Material.__soloDatumFields
          .get(this.__materialTypeName)!
          .get(shaderSemantic.index)?.value;
      } else {
        return this.__fields.get(shaderSemantic.index)?.value;
      }
    }

    return void 0;
  }

  setUniformLocations(
    shaderProgramUid: CGAPIResourceHandle,
    isUniformOnlyMode: boolean
  ) {
    const webglResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
    const map: Map<string, ShaderSemanticsInfo> = new Map();
    let array: ShaderSemanticsInfo[] = [];
    this.__materialNodes.forEach(materialNode => {
      const semanticsInfoArray = materialNode._semanticsInfoArray;
      array = array.concat(semanticsInfoArray);
    });

    webglResourceRepository.setupUniformLocations(
      shaderProgramUid,
      array,
      isUniformOnlyMode
    );
  }

  /**
   * @private
   */
  _setParametersForGPU({
    material,
    shaderProgram,
    firstTime,
    args,
  }: {
    material: Material;
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    args?: any;
  }) {
    this.__materialNodes.forEach(materialNode => {
      if (materialNode.setParametersForGPU) {
        materialNode.setParametersForGPU({
          material,
          shaderProgram,
          firstTime,
          args,
        });
      }
    });

    const webglResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
    if (args.setUniform) {
      this.__fieldsForNonSystem.forEach(value => {
        const info = value.info;
        if (
          firstTime ||
          info.updateInterval !== ShaderVariableUpdateInterval.FirstTimeOnly
        ) {
          webglResourceRepository.setUniformValue(
            shaderProgram,
            info.semantic.str,
            firstTime,
            value.value,
            info.index
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
      this.__fieldsForNonSystem.forEach(value => {
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
              value.value,
              info.index
            );
          } else {
            webglResourceRepository.bindTexture(info, value.value);
          }
        }
      });
    }

    this.setSoloDatumParametersForGPU({shaderProgram, firstTime, args});
  }

  setSoloDatumParametersForGPU({
    shaderProgram,
    firstTime,
    args,
  }: {
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    args?: any;
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
        if (!info.isSystem) {
          if (
            firstTime ||
            info.updateInterval !== ShaderVariableUpdateInterval.FirstTimeOnly
          ) {
            webglResourceRepository.setUniformValue(
              shaderProgram,
              info.semantic.str,
              firstTime,
              value.value,
              info.index
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
    if (
      ProcessApproach.isFastestApproach(System.getInstance().processApproach)
    ) {
      definitions += '#define RN_IS_FASTEST_MODE\n';
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

  createProgramAsSingleOperation(
    vertexShaderMethodDefinitions_uniform: string,
    propertySetter: getShaderPropertyFunc,
    isWebGL2: boolean
  ) {
    const webglResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
    const materialNode = this.__materialNodes[0];
    const glslShader = materialNode.shader;

    const {vertexPropertiesStr, pixelPropertiesStr} = this._getProperties(
      propertySetter,
      isWebGL2
    );

    const definitions = materialNode.definitions;

    // Shader Construction
    let vertexShader = this.__setupGlobalShaderDefinition();
    let pixelShader = this.__setupGlobalShaderDefinition();
    let vertexShaderBody = '';
    let pixelShaderBody = '';
    vertexShaderBody = ShaderityUtility.getInstance().getVertexShaderBody(
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
    pixelShaderBody = ShaderityUtility.getInstance().getPixelShaderBody(
      materialNode.pixelShaderityObject!,
      {
        getters: pixelPropertiesStr,
        definitions: definitions,
        dataUBODefinition:
          webglResourceRepository.getGlslDataUBODefinitionString(),
        dataUBOVec4Size: webglResourceRepository.getGlslDataUBOVec4SizeString(),
      }
    );

    vertexShader += vertexShaderBody.replace(/#version\s+300\s+es/, '');
    pixelShader += pixelShaderBody.replace(/#version\s+300\s+es/, '');

    let attributeNames;
    let attributeSemantics;
    if (materialNode.vertexShaderityObject != null) {
      const reflection = ShaderityUtility.getInstance().getReflection(
        materialNode.vertexShaderityObject
      );
      attributeNames = reflection.names;
      attributeSemantics = reflection.semantics;
    } else {
      attributeNames = glslShader!.attributeNames;
      attributeSemantics = glslShader!.attributeSemantics;
    }
    let vertexAttributesBinding = '\n// Vertex Attributes Binding Info\n';
    for (let i = 0; i < attributeNames.length; i++) {
      vertexAttributesBinding += `// ${attributeNames[i]}: ${attributeSemantics[i].str} \n`;
    }
    vertexShader += vertexAttributesBinding;

    const wholeShaderText = vertexShader + pixelShader;

    // Cache
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
      this._shaderProgramUid = webglResourceRepository.createShaderProgram({
        materialTypeName: this.__materialTypeName,
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

  /**
   * @private
   * @param propertySetter
   */
  _getProperties(propertySetter: getShaderPropertyFunc, isWebGL2: boolean) {
    let vertexPropertiesStr = '';
    let pixelPropertiesStr = '';
    this.__fieldsInfo.forEach((value, propertyIndex: Index) => {
      const info = this.__fieldsInfo.get(propertyIndex);
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

  createProgram(
    vertexShaderMethodDefinitions_uniform: string,
    propertySetter: getShaderPropertyFunc,
    isWebGL2: boolean
  ) {
    return this.createProgramAsSingleOperation(
      vertexShaderMethodDefinitions_uniform,
      propertySetter,
      isWebGL2
    );
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

  static getLocationOffsetOfMemberOfMaterial(
    materialTypeName: string,
    propertyIndex: Index
  ): IndexOf16Bytes {
    const material = Material.__instancesByTypes.get(materialTypeName)!;
    const info = material.__fieldsInfo.get(propertyIndex)!;
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

  static getAccessorOfMemberOfMaterial(
    materialTypeName: string,
    propertyIndex: Index
  ) {
    const material = Material.__instancesByTypes.get(materialTypeName)!;
    const info = material.__fieldsInfo.get(propertyIndex)!;
    if (info.soloDatum) {
      return void 0;
    } else {
      const properties = this.__accessors.get(materialTypeName);
      const accessor = properties!.get(propertyIndex);
      return accessor;
    }
  }

  get alphaMode() {
    return this.__alphaMode;
  }

  set alphaMode(mode: AlphaModeEnum) {
    this.__alphaMode = mode;
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

  isEmptyMaterial(): boolean {
    if (this.__materialNodes.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  getShaderSemanticInfoFromName(name: string) {
    for (const materialNode of this.__materialNodes) {
      return materialNode.getShaderSemanticInfoFromName(name);
    }
    return void 0;
  }
}
