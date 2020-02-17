import RnObject from "../../core/RnObject";
import MutableColorRgb from "../../math/MutableColorRgb";
import Texture from "../../textures/Texture";
import Vector3 from "../../math/Vector3";
import { AlphaMode, AlphaModeEnum } from "../../definitions/AlphaMode";
import { ShaderNode } from "../../definitions/ShaderNode";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { ShaderSemanticsEnum, ShaderSemanticsInfo, ShaderSemanticsClass, ShaderSemantics, ShaderSemanticsIndex } from "../../definitions/ShaderSemantics";
import { CompositionType } from "../../definitions/CompositionType";
import MathClassUtil from "../../math/MathClassUtil";
import { ComponentType } from "../../definitions/ComponentType";
import Vector2 from "../../math/Vector2";
import CGAPIResourceRepository from "../../renderer/CGAPIResourceRepository";
import { VertexAttribute, VertexAttributeEnum } from "../../definitions/VertexAttribute";
import AbstractTexture from "../../textures/AbstractTexture";
import MemoryManager from "../../core/MemoryManager";
import { BufferUse } from "../../definitions/BufferUse";
import Config from "../../core/Config";
import BufferView from "../../memory/BufferView";
import Accessor from "../../memory/Accessor";
import ISingleShader from "../../../webgl/shaders/ISingleShader";
import { ShaderType } from "../../definitions/ShaderType";
import { thisExpression } from "@babel/types";
import { Index, CGAPIResourceHandle, Count, Byte, MaterialNodeUID } from "../../../types/CommonTypes";
import DataUtil from "../../misc/DataUtil";
import GlobalDataRepository from "../../core/GlobalDataRepository";
import System from "../../system/System";
import { ProcessApproach } from "../../definitions/ProcessApproach";
import ShaderityUtility from "./ShaderityUtility";
import { BoneDataType } from "../../definitions/BoneDataType";
import { ShaderVariableUpdateInterval } from "../../definitions/ShaderVariableUpdateInterval";
import { AttributeNames } from "../../../webgl/shaders/EnvConstantShader";
import GLSLShader from "../../../webgl/shaders/GLSLShader";
import mainPrerequisitesShaderityObject from "../../../webgl/shaderity_shaders/common/mainPrerequisites.glsl"
import prerequisitesShaderityObject from "../../../webgl/shaderity_shaders/common/prerequisites.glsl"

type MaterialTypeName = string;
type PropertyName = string;
type ShaderVariable = {
  value: any,
  info: ShaderSemanticsInfo
};

export type getShaderPropertyFunc = (materialTypeName: string, info: ShaderSemanticsInfo, propertyIndex: Index, isGlobalData: boolean) => string;


/**
 * The material class.
 * This class has one or more material nodes.
 */
export default class Material extends RnObject {
  private __materialNodes: AbstractMaterialNode[] = [];

  private __fields: Map<ShaderSemanticsIndex, ShaderVariable> = new Map();
  private __fieldsForNonSystem: Map<ShaderSemanticsIndex, ShaderVariable> = new Map();
  private static __soloDatumFields: Map<MaterialTypeName, Map<ShaderSemanticsIndex, ShaderVariable>> = new Map();
  private __fieldsInfo: Map<ShaderSemanticsIndex, ShaderSemanticsInfo> = new Map();

  public _shaderProgramUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __alphaMode = AlphaMode.Opaque;
  private static __shaderHashMap: Map<number, CGAPIResourceHandle> = new Map();
  private static __shaderStringMap: Map<string, CGAPIResourceHandle> = new Map();
  private static __materials: Material[] = [];
  private static __instancesByTypes: Map<MaterialTypeName, Material> = new Map();
  private __materialTid: Index;
  private static __materialTidCount = -1;

  private static __materialTids: Map<MaterialTypeName, Index> = new Map();
  private static __materialInstanceCountOfType: Map<MaterialTypeName, Count> = new Map();
  private __materialSid: Index = -1;
  private static __materialTypes: Map<MaterialTypeName, AbstractMaterialNode[]> = new Map();
  private static __maxInstances: Map<MaterialTypeName, number> = new Map();
  private __materialTypeName: MaterialTypeName;
  private static __bufferViews: Map<MaterialTypeName, BufferView> = new Map();
  private static __accessors: Map<MaterialTypeName, Map<ShaderSemanticsIndex, Accessor>> = new Map();

  public cullFace: boolean | null = null;
  public cullFrontFaceCCW: boolean = true;

  private __blendEquationMode: number = 32774;            // gl.FUNC_ADD
  private __blendEquationModeAlpha: number | null = null; // use blendEquation instead of blendEquationSeparate
  private __blendFuncSrcFactor: number = 770;             // gl.SRC_ALPHA
  private __blendFuncDstFactor: number = 771;             // gl.ONE_MINUS_SRC_ALPHA
  private __blendFuncAlphaSrcFactor: number | null = 1;   // gl.ONE
  private __blendFuncAlphaDstFactor: number | null = 1;   // gl.ONE

  private constructor(materialTid: Index, materialTypeName: string, materialNodes: AbstractMaterialNode[]) {
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
    return Array.from(this.__fieldsInfo.values())
  }


  /**
   * Creates an instance of this Material class.
   * @param materialTypeName The material type to create.
   * @param materialNodes_ The material nodes to add to the created material.
   */
  static createMaterial(materialTypeName: string, materialNodes_?: AbstractMaterialNode[]) {
    let materialNodes = materialNodes_;
    if (!materialNodes) {
      materialNodes = Material.__materialTypes.get(materialTypeName)!;
    }

    return new Material(Material.__materialTids.get(materialTypeName)!, materialTypeName, materialNodes);
  }


  static isRegisteredMaterialType(materialTypeName: string) {
    return Material.__materialTypes.has(materialTypeName);
  }

  static _calcAlignedByteLength(semanticInfo: ShaderSemanticsInfo) {
    const compositionNumber = semanticInfo.compositionType.getNumberOfComponents();
    const componentSizeInByte = semanticInfo.componentType.getSizeInBytes();
    const semanticInfoByte = compositionNumber * componentSizeInByte;
    let alignedByteLength = semanticInfoByte;
    if (alignedByteLength % 16 !== 0) {
      alignedByteLength = semanticInfoByte + 16 - semanticInfoByte % 16;
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

  private static __allocateBufferView(materialTypeName: string, materialNodes: AbstractMaterialNode[]) {
    let totalByteLength = 0;
    const alignedByteLengthAndSemanticInfoArray = [];
    for (let materialNode of materialNodes) {
      for (let semanticInfo of materialNode._semanticsInfoArray) {
        const alignedByteLength = Material._calcAlignedByteLength(semanticInfo);
        let dataCount = 1;
        if (!semanticInfo.soloDatum) {
          dataCount = Material.__maxInstances.get(materialTypeName)!;
        }

        totalByteLength += alignedByteLength * dataCount;
        alignedByteLengthAndSemanticInfoArray.push({ alignedByte: alignedByteLength, semanticInfo: semanticInfo });

      }
    }

    if (!this.__accessors.has(materialTypeName)) {
      this.__accessors.set(materialTypeName, new Map());
    }


    const buffer = MemoryManager.getInstance().createOrGetBuffer(BufferUse.GPUInstanceData);
    let bufferView;
    if (this.__bufferViews.has(materialTypeName)) {
      bufferView = this.__bufferViews.get(materialTypeName);
    } else {
      bufferView = buffer.takeBufferView({
        byteLengthToNeed: totalByteLength,
        byteStride: 0,
        byteAlign: 16,
        isAoS: false
      });
      this.__bufferViews.set(materialTypeName, bufferView);
    }

    for (let i = 0; i < alignedByteLengthAndSemanticInfoArray.length; i++) {
      const alignedByte = alignedByteLengthAndSemanticInfoArray[i].alignedByte;
      const semanticInfo = alignedByteLengthAndSemanticInfoArray[i].semanticInfo;

      let count = 1;
      if (!semanticInfo.soloDatum) {
        count = Material.__maxInstances.get(materialTypeName)!;
      }
      let maxArrayLength = semanticInfo.maxIndex;
      if (CompositionType.isArray(semanticInfo.compositionType) && maxArrayLength == null) {
        maxArrayLength = 100;
      }
      const accessor = bufferView!.takeFlexibleAccessor({
        compositionType: semanticInfo.compositionType,
        componentType: ComponentType.Float,
        count: count,
        byteStride: alignedByte,
        arrayLength: maxArrayLength,
        byteAlign: 16
      });

      const propertyName = this._getPropertyIndex(semanticInfo);
      if (semanticInfo.soloDatum) {
        const typedArray = accessor.takeOne() as Float32Array;
        let map = this.__soloDatumFields.get(materialTypeName);
        if (map == null) {
          map = new Map();
          this.__soloDatumFields.set(materialTypeName, map);
        }

        map.set(
          this._getPropertyIndex(semanticInfo), {
            info: semanticInfo,
            value: MathClassUtil.initWithFloat32Array(
              semanticInfo.initialValue,
              semanticInfo.initialValue,
              typedArray,
              semanticInfo.compositionType
            )
          }
        );
      } else {
        const properties = this.__accessors.get(materialTypeName)!;
        properties.set(propertyName, accessor);
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
  static registerMaterial(materialTypeName: string, materialNodes: AbstractMaterialNode[], maxInstanceNumber: number = Config.maxMaterialInstanceForEachType) {
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

  static forceRegisterMaterial(materialTypeName: string, materialNodes: AbstractMaterialNode[], maxInstanceNumber: number = Config.maxMaterialInstanceForEachType) {
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
  static _getPropertyIndex2(shaderSemantic: ShaderSemanticsEnum, index?: Index) {
    let propertyIndex = shaderSemantic.index;
    if (index != null) {
      propertyIndex += index;
      propertyIndex *= -1;
    }
    return propertyIndex;
  }

  initialize() {
    let countOfThisType = Material.__materialInstanceCountOfType.get(this.__materialTypeName) as number;
    this.__materialSid = countOfThisType++;
    Material.__materialInstanceCountOfType.set(this.__materialTypeName, countOfThisType);

    this.__materialNodes.forEach((materialNode) => {
      const semanticsInfoArray = materialNode._semanticsInfoArray;
      const accessorMap = Material.__accessors.get(this.__materialTypeName);
      semanticsInfoArray.forEach((semanticsInfo) => {
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
              )
            };
          this.__fields.set(
            propertyIndex,
            shaderVariable
          )
          if (!semanticsInfo.isSystem) {
            this.__fieldsForNonSystem.set(
              propertyIndex,
              shaderVariable
            );
          }
        }
      });
    });
  }

  setParameter(shaderSemantic: ShaderSemanticsEnum, value: any, index?: Index) {
    const propertyIndex = Material._getPropertyIndex2(shaderSemantic, index);
    const info = this.__fieldsInfo.get(propertyIndex);
    if (info != null) {
      let valueObj: ShaderVariable|undefined;
      if (info.soloDatum) {
        valueObj = Material.__soloDatumFields.get(this.__materialTypeName)!.get(propertyIndex);
      } else {
        valueObj = this.__fields.get(propertyIndex);
      }
      MathClassUtil._setForce(valueObj!.value, value);
    }
  }

  setTextureParameter(shaderSemantic: ShaderSemanticsEnum, value: AbstractTexture): void {
    if (this.__fieldsInfo.has(shaderSemantic.index)) {
      const array = this.__fields.get(shaderSemantic.index)!;
      const shaderVariable = {
        value: [array.value[0], value],
        info: array.info
      };
      this.__fields.set(shaderSemantic.index, shaderVariable);
      if (!array.info.isSystem) {
        this.__fieldsForNonSystem.set(
          shaderSemantic.index,
          shaderVariable
        );
      }
      if (shaderSemantic === ShaderSemantics.DiffuseColorTexture || shaderSemantic === ShaderSemantics.BaseColorTexture) {
        if (value.isTransparent) {
          this.alphaMode = AlphaMode.Blend;
        }
      }
    }
  }

  getParameter(shaderSemantic: ShaderSemanticsEnum): any {
    const info = this.__fieldsInfo.get(shaderSemantic.index);
    if (info != null) {
      if (info.soloDatum) {
        return Material.__soloDatumFields.get(this.__materialTypeName)!.get(shaderSemantic.index);
      } else {
        return this.__fields.get(shaderSemantic.index)?.value;
      }
    }

    return void 0;
  }

  setUniformLocations(shaderProgramUid: CGAPIResourceHandle) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const map: Map<string, ShaderSemanticsInfo> = new Map();
    let array: ShaderSemanticsInfo[] = [];
    this.__materialNodes.forEach((materialNode) => {
      const semanticsInfoArray = materialNode._semanticsInfoArray;
      array = array.concat(semanticsInfoArray);
    });

    webglResourceRepository.setupUniformLocations(shaderProgramUid, array);
  }

  setParametersForGPU({ material, shaderProgram, firstTime, args }: { material: Material, shaderProgram: WebGLProgram, firstTime: boolean, args?: any }) {
    this.__materialNodes.forEach((materialNode) => {
      if (materialNode.setParametersForGPU) {
        materialNode.setParametersForGPU({ material, shaderProgram, firstTime, args });
      }
    });

    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    if (args.setUniform) {
      this.__fieldsForNonSystem.forEach((value) => {
        const info = value.info
        if (firstTime || info.updateInterval !== ShaderVariableUpdateInterval.FirstTimeOnly) {
          webglResourceRepository.setUniformValue(shaderProgram, info.semantic.str, firstTime, value.value, info.index);
        } else {
          if (info.compositionType === CompositionType.Texture2D || info.compositionType === CompositionType.TextureCube) {
            webglResourceRepository.bindTexture(info, value.value);
          }
        }
      });
    } else {
      this.__fieldsForNonSystem.forEach((value) => {
        const info = value.info
        if (info.compositionType === CompositionType.Texture2D || info.compositionType === CompositionType.TextureCube) {
          if (firstTime || info.updateInterval !== ShaderVariableUpdateInterval.FirstTimeOnly) {
            webglResourceRepository.setUniformValue(shaderProgram, info.semantic.str, firstTime, value.value, info.index);
          } else {
            webglResourceRepository.bindTexture(info, value.value);
          }
        }
      });
    }

    this.setSoloDatumParametersForGPU({ shaderProgram, firstTime, args });
  }

  setSoloDatumParametersForGPU({ shaderProgram, firstTime, args }: { shaderProgram: WebGLProgram, firstTime: boolean, args?: any }) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const materialTypeName = this.__materialTypeName;
    const map = Material.__soloDatumFields.get(materialTypeName);
    if (map == null) return;
    map.forEach((value, key) => {
      const info = value.info;
      if (args.setUniform || info.compositionType === CompositionType.Texture2D || info.compositionType === CompositionType.TextureCube) {
        if (!info.isSystem) {
          if (firstTime || info.updateInterval !== ShaderVariableUpdateInterval.FirstTimeOnly) {
            webglResourceRepository.setUniformValue(shaderProgram, info.semantic.str, firstTime, value.value, info.index);
          } else {
            webglResourceRepository.bindTexture(info, value.value);
          }
        }
      }
    });
  }

  private __setupGlobalShaderDefinition() {
    let definitions = '';
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    if (webglResourceRepository.currentWebGLContextWrapper?.isWebGL2) {
      definitions += '#version 300 es\n#define GLSL_ES3\n';
    }
    definitions += `#define RN_MATERIAL_TYPE_NAME ${this.__materialTypeName}\n`;
    if (System.getInstance().processApproach === ProcessApproach.FastestWebGL1) {
      definitions += '#define RN_IS_FASTEST_MODE\n';
    }
    if (webglResourceRepository.currentWebGLContextWrapper?.webgl1ExtSTL) {
      definitions += '#define WEBGL1_EXT_SHADER_TEXTURE_LOD\n';
    }
    if (webglResourceRepository.currentWebGLContextWrapper?.webgl1ExtDRV) {
      definitions += '#define WEBGL1_EXT_STANDARD_DERIVATIVES\n';
    }
    if (Config.boneDataType === BoneDataType.Mat4x4) {
      definitions += '#define RN_BONE_DATA_TYPE_MAT4X4\n';
    } else if (Config.boneDataType === BoneDataType.Vec4x2) {
      definitions += '#define RN_BONE_DATA_TYPE_VEC4X2\n';
    } else if (Config.boneDataType === BoneDataType.Vec4x1) {
      definitions += '#define RN_BONE_DATA_TYPE_VEC4X1\n';
    }

    return definitions;
  }

  createProgramAsSingleOperation(vertexShaderMethodDefinitions_uniform: string, propertySetter: getShaderPropertyFunc) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const materialNode = this.__materialNodes[0];
    const glslShader = materialNode.shader;

    let { vertexPropertiesStr, pixelPropertiesStr } = this.__getProperties(propertySetter);

    let definitions = materialNode.definitions;

    // Shader Construction
    let vertexShader = this.__setupGlobalShaderDefinition();
    let fragmentShader = this.__setupGlobalShaderDefinition();
    if (materialNode.vertexShaderityObject != null) {
      vertexShader += ShaderityUtility.getInstance().getVertexShaderBody(materialNode.vertexShaderityObject, { getters: vertexPropertiesStr, definitions: definitions, matricesGetters: vertexShaderMethodDefinitions_uniform })
      fragmentShader += ShaderityUtility.getInstance().getPixelShaderBody(materialNode.pixelShaderityObject!, { getters: pixelPropertiesStr, definitions: definitions });
    } else {
      vertexShader += (glslShader as any as ISingleShader).getVertexShaderBody({ getters: vertexPropertiesStr, definitions: definitions, matricesGetters: vertexShaderMethodDefinitions_uniform });
      fragmentShader += (glslShader as any as ISingleShader).getPixelShaderBody({ getters: pixelPropertiesStr, definitions: definitions, materialNode: materialNode });
    }


    const wholeShaderText = vertexShader + fragmentShader;

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
      let attributeNames;
      let attributeSemantics;
      if (materialNode.vertexShaderityObject != null) {
        const reflection = ShaderityUtility.getInstance().getReflection(materialNode.vertexShaderityObject);
        attributeNames = reflection.names;
        attributeSemantics = reflection.semantics;
      } else {
        attributeNames = glslShader!.attributeNames
        attributeSemantics = glslShader!.attributeSemantics;
      }

      this._shaderProgramUid = webglResourceRepository.createShaderProgram(
        {
          materialTypeName: this.__materialTypeName,
          vertexShaderStr: vertexShader,
          fragmentShaderStr: fragmentShader,
          attributeNames: attributeNames,
          attributeSemantics: attributeSemantics
        }
      );
      Material.__shaderStringMap.set(wholeShaderText, this._shaderProgramUid);
      Material.__shaderHashMap.set(hash, this._shaderProgramUid);
      return this._shaderProgramUid;
    }
  }


  private __getProperties(propertySetter: getShaderPropertyFunc) {
    let vertexPropertiesStr = '';
    let pixelPropertiesStr = '';
    this.__fieldsInfo.forEach((value, propertyIndex: Index) => {
      const info = this.__fieldsInfo.get(propertyIndex);
      if (info!.stage === ShaderType.VertexShader || info!.stage === ShaderType.VertexAndPixelShader) {
        vertexPropertiesStr += propertySetter(this.__materialTypeName, info!, propertyIndex, false);
      }
      if (info!.stage === ShaderType.PixelShader || info!.stage === ShaderType.VertexAndPixelShader) {
        pixelPropertiesStr += propertySetter(this.__materialTypeName, info!, propertyIndex, false);
      }
    });
    const globalDataRepository = GlobalDataRepository.getInstance();
    [vertexPropertiesStr, pixelPropertiesStr] = globalDataRepository.addPropertiesStr(vertexPropertiesStr, pixelPropertiesStr, propertySetter);
    return { vertexPropertiesStr, pixelPropertiesStr };
  }

  createProgramString(vertexShaderMethodDefinitions_uniform = '', propertySetter?: getShaderPropertyFunc) {

    const materialNodesVertex = this.__materialNodes.filter((node)=>{
      if (node.shaderType === ShaderType.VertexShader || node.shaderType === ShaderType.VertexAndPixelShader) {
        return true;
      } else {
        return false;
      }
    });
    const materialNodesPixel = this.__materialNodes.filter((node)=>{
      if (node.shaderType === ShaderType.PixelShader || node.shaderType === ShaderType.VertexAndPixelShader) {
        return true;
      } else {
        return false;
      }
    });

    // Find Start Node
    let firstMaterialNodeVertex: AbstractMaterialNode;
    let firstMaterialNodePixel: AbstractMaterialNode;
    for (let i = 0; i < materialNodesVertex.length; i++) {
      const materialNode = materialNodesVertex[i];
      if (materialNode.vertexInputConnections.length === 0) {
        firstMaterialNodeVertex = materialNode;
      }
    }
    for (let i = 0; i < materialNodesPixel.length; i++) {
      const materialNode = materialNodesPixel[i];
      if (materialNode.pixelInputConnections.length === 0) {
        firstMaterialNodePixel = materialNode;
      }
    }

    if (firstMaterialNodeVertex! == null || firstMaterialNodePixel! == null) {
      return void 0;
    }

    // Topological Sorting
    const ignoredInputUidsVertex: Index[] = [firstMaterialNodeVertex!.materialNodeUid];
    const sortedNodeArrayVertex: AbstractMaterialNode[] = [firstMaterialNodeVertex!];
    const ignoredInputUidsPixel: Index[] = [firstMaterialNodePixel!.materialNodeUid];
    const sortedNodeArrayPixel: AbstractMaterialNode[] = [firstMaterialNodePixel!];
    /// delete first nodes from existing array
    materialNodesVertex.splice(materialNodesVertex.indexOf(firstMaterialNodeVertex!), 1);
    materialNodesPixel.splice(materialNodesPixel.indexOf(firstMaterialNodePixel!), 1);
    do {
      let materialNodeWhichHasNoInputs: AbstractMaterialNode;
      materialNodesVertex.forEach((materialNode) => {
        let inputCount = 0;
        for (let inputConnection of materialNode.vertexInputConnections) {
          if (ignoredInputUidsVertex.indexOf(inputConnection.materialNodeUid) === -1) {
            inputCount++;
          }
        }
        if (inputCount === 0) {
          materialNodeWhichHasNoInputs = materialNode;
        }
      });
      sortedNodeArrayVertex.push(materialNodeWhichHasNoInputs!);
      ignoredInputUidsVertex.push(materialNodeWhichHasNoInputs!.materialNodeUid);
      materialNodesVertex.splice(materialNodesVertex.indexOf(materialNodeWhichHasNoInputs!), 1);

    } while (materialNodesVertex.length !== 0);
    do {
      let materialNodeWhichHasNoInputs: AbstractMaterialNode;
      materialNodesPixel.forEach((materialNode) => {
        let inputCount = 0;
        for (let inputConnection of materialNode.pixelInputConnections) {
          if (ignoredInputUidsPixel.indexOf(inputConnection.materialNodeUid) === -1) {
            inputCount++;
          }
        }
        if (inputCount === 0) {
          materialNodeWhichHasNoInputs = materialNode;
        }
      });
      sortedNodeArrayPixel.push(materialNodeWhichHasNoInputs!);
      ignoredInputUidsPixel.push(materialNodeWhichHasNoInputs!.materialNodeUid);
      materialNodesPixel.splice(materialNodesPixel.indexOf(materialNodeWhichHasNoInputs!), 1);
    } while (materialNodesPixel.length !== 0);

    let vertexShaderPrerequisites = '';
    let pixelShaderPrerequisites = '';


    // // Get GLSL Beginning code
    // let vertexShader = firstMaterialNodePixel!.shader!.glsl_versionText + firstMaterialNodeVertex!.shader!.glslPrecision;
    // let pixelShader = firstMaterialNodePixel!.shader!.glsl_versionText + firstMaterialNodeVertex!.shader!.glslPrecision;

    // // attribute variables definitions in Vertex Shader
    // for (let i = 0; i < sortedNodeArrayVertex.length; i++) {
    //   const materialNode = sortedNodeArrayVertex[i];
    //   const attributeNames = materialNode.shader!.attributeNames;
    //   const attributeSemantics = materialNode.shader!.attributeSemantics;
    //   const attributeCompositions = materialNode.shader!.attributeCompositions;
    //   for (let j = 0; j < attributeSemantics.length; j++) {
    //     const attributeName = attributeNames[j];
    //     const attributeComposition = attributeCompositions[j];
    //     vertexShader += `${attributeComposition.getGlslStr(ComponentType.Float)} ${attributeName};\n`;
    //   }
    // }
    // vertexShader += '\n';

    // uniform variables definitions
    // for (let i = 0; i < sortedNodeArrayVertex.length; i++) {
    //   const materialNode = sortedNodeArrayVertex[i];
    //   const semanticsInfoArray = materialNode._semanticsInfoArray;
    //   for (let j = 0; j < semanticsInfoArray.length; j++) {
    //     const semanticInfo = semanticsInfoArray[j];
    //     const attributeComposition = semanticInfo.compositionType!;
    //     vertexShader += `uniform ${attributeComposition.getGlslStr(semanticInfo.componentType!)} u_${semanticInfo.semantic!.str};\n`;
    //   }
    // }
    // vertexShader += '\n';
    // for (let i = 0; i < sortedNodeArrayPixel.length; i++) {
    //   const materialNode = sortedNodeArrayPixel[i];
    //   const semanticsInfoArray = materialNode._semanticsInfoArray;
    //   for (let j = 0; j < semanticsInfoArray.length; j++) {
    //     const semanticInfo = semanticsInfoArray[j];
    //     const attributeComposition = semanticInfo.compositionType!;
    //     pixelShader += `uniform ${attributeComposition.getGlslStr(semanticInfo.componentType!)} u_${semanticInfo.semantic!.str};\n`;
    //   }
    // }
    // pixelShader += '\n';


    // remove node which don't have inputConnections (except first node)
    const vertexMaterialNodes = [];
    const pixelMaterialNodes = [];
    for (let i = 0; i < sortedNodeArrayVertex.length; i++) {
      const materialNode = sortedNodeArrayVertex[i];
      vertexMaterialNodes.push(materialNode);
    }
    for (let i = 0; i < sortedNodeArrayPixel.length; i++) {
      const materialNode = sortedNodeArrayPixel[i];
      pixelMaterialNodes.push(materialNode);
    }

    // Add additional functions by system
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    let in_ = 'attribute'
    if (webglResourceRepository.currentWebGLContextWrapper?.isWebGL2) {
      in_ = 'in'
    }
    vertexShaderPrerequisites += `
precision highp float;
precision highp int;
${prerequisitesShaderityObject.code}

    ${in_} float a_instanceID;\n`;
    vertexShaderPrerequisites += `
uniform bool u_vertexAttributesExistenceArray[${VertexAttribute.AttributeTypeNumber}];
`
    vertexShaderPrerequisites += '/* shaderity: ${matricesGetters} */'
    vertexShaderPrerequisites += '/* shaderity: ${getters} */'

    vertexShaderPrerequisites += vertexShaderMethodDefinitions_uniform;

    pixelShaderPrerequisites += `
precision highp float;
precision highp int;
${prerequisitesShaderityObject.code}
`
    pixelShaderPrerequisites += '/* shaderity: ${getters} */'

    if (propertySetter) {
      let { vertexPropertiesStr, pixelPropertiesStr } = this.__getProperties(propertySetter);
      vertexShaderPrerequisites += vertexPropertiesStr;
      pixelShaderPrerequisites += pixelPropertiesStr;
    }

    let vertexShaderBody = ''
    let pixelShaderBody = ''

    // function definitions
    const existVertexFunctions: string[] = [];
    for (let i = 0; i < vertexMaterialNodes.length; i++) {
      const materialNode = vertexMaterialNodes[i];
      if (existVertexFunctions.indexOf(materialNode.shaderFunctionName) !== -1) {
        continue;
      }
      if ((materialNode.shaderType === ShaderType.VertexShader || materialNode.shaderType === ShaderType.VertexAndPixelShader)) {
        if (materialNode.vertexShaderityObject) {
          vertexShaderBody += materialNode.vertexShaderityObject.code;
        } else {
          vertexShaderBody += (materialNode.shader! as any).vertexShaderDefinitions;
        }
        existVertexFunctions.push(materialNode.shaderFunctionName);
      }
    }
    const existPixelFunctions: string[] = [];
    for (let i = 0; i < pixelMaterialNodes.length; i++) {
      const materialNode = pixelMaterialNodes[i];
      if (existPixelFunctions.indexOf(materialNode.shaderFunctionName) !== -1) {
        continue;
      }
      if ((materialNode.shaderType === ShaderType.PixelShader || materialNode.shaderType === ShaderType.VertexAndPixelShader)) {
        if (materialNode.pixelShaderityObject) {
          pixelShaderBody += materialNode.pixelShaderityObject.code;
        } else {
          pixelShaderBody += (materialNode.shader! as any).pixelShaderDefinitions;
        }
        existPixelFunctions.push(materialNode.shaderFunctionName);
      }
    }

    // vertex main process
    {
      vertexShaderBody += GLSLShader.glslMainBegin;
      vertexShaderBody += mainPrerequisitesShaderityObject.code;
      const varInputNames: Array<Array<string>> = [];
      const varOutputNames: Array<Array<string>> = [];
      const existingInputs: MaterialNodeUID[] = [];
      const existingOutputsVarName: Map<MaterialNodeUID, string> = new Map()
      const existingOutputs: MaterialNodeUID[] = [];
      for (let i = 1; i < vertexMaterialNodes.length; i++) {
        const materialNode = vertexMaterialNodes[i];
        if (varInputNames[i] == null) {
          varInputNames[i] = [];
        }
        if (i - 1 >= 0) {
          if (varOutputNames[i - 1] == null) {
            varOutputNames[i - 1] = [];
          }
        }
        for (let j = 0; j < materialNode.vertexInputConnections.length; j++) {
          const inputConnection = materialNode.vertexInputConnections[j];
          const inputNode = AbstractMaterialNode.materialNodes[inputConnection.materialNodeUid];
          const outputSocketOfPrev = inputNode.getVertexOutput(inputConnection.outputNameOfPrev);
          const inputSocketOfThis = materialNode.getVertexInput(inputConnection.inputNameOfThis);
          const glslTypeStr = inputSocketOfThis!.compositionType.getGlslStr(inputSocketOfThis!.componentType);
          let varName = `${outputSocketOfPrev!.name}_${inputConnection.materialNodeUid}_to_${materialNode.materialNodeUid}`;
          if (existingInputs.indexOf(inputNode.materialNodeUid) === -1) {
            const rowStr = `${glslTypeStr} ${varName};\n`;
            vertexShaderBody += rowStr;
          }
          const existVarName = existingOutputsVarName.get(inputNode.materialNodeUid);
          if (existVarName) {
            varName = existVarName;
          }
          varInputNames[i].push(varName);
          existingInputs.push(inputConnection.materialNodeUid)
        }
        for (let j = i; j < vertexMaterialNodes.length; j++) {
          const materialNodeInner = vertexMaterialNodes[j];
          const prevMaterialNodeInner = vertexMaterialNodes[i - 1];
          for (let k = 0; k < materialNodeInner.vertexInputConnections.length; k++) {
            const inputConnection = materialNodeInner.vertexInputConnections[k];
            if (prevMaterialNodeInner != null && inputConnection.materialNodeUid !== prevMaterialNodeInner.materialNodeUid) {
              continue;
            }
            const inputNode = AbstractMaterialNode.materialNodes[inputConnection.materialNodeUid];
            if (existingOutputs.indexOf(inputNode.materialNodeUid) === -1) {
              const outputSocketOfPrev = inputNode.getVertexOutput(inputConnection.outputNameOfPrev);
              const varName = `${outputSocketOfPrev!.name}_${inputConnection.materialNodeUid}_to_${materialNodeInner.materialNodeUid}`;

              if (i - 1 >= 0) {
                varOutputNames[i - 1].push(varName);
              }
              existingOutputsVarName.set(inputConnection.materialNodeUid, varName)
            }
            existingOutputs.push(inputConnection.materialNodeUid)
          }
        }

      }

      for (let i = 0; i < vertexMaterialNodes.length; i++) {
        const materialNode = vertexMaterialNodes[i];
        const functionName = materialNode.shaderFunctionName;
        if (varInputNames[i] == null) {
          varInputNames[i] = [];
        }
        if (varOutputNames[i] == null) {
          varOutputNames[i] = [];
        }
        if (materialNode.getVertexInputs().length != varInputNames[i].length ||
          materialNode.getVertexOutputs().length != varOutputNames[i].length) {
          continue;
        }
        const varNames = varInputNames[i].concat(varOutputNames[i]);
        if (varNames.length === 0) {
          continue;
        }
        let rowStr = `${functionName}(`;
        for (let k = 0; k < varNames.length; k++) {
          const varName = varNames[k];
          if (varName == null) {
            continue;
          }
          if (k !== 0) {
            rowStr += ', ';
          }
          rowStr += varNames[k];
        }
        rowStr += ');\n';
        vertexShaderBody += rowStr;
      }

      vertexShaderBody += GLSLShader.glslMainEnd;
    }

    // pixel main process
    {
      pixelShaderBody += GLSLShader.glslMainBegin;
      pixelShaderBody += mainPrerequisitesShaderityObject.code;
      const varInputNames: Array<Array<string>> = [];
      const varOutputNames: Array<Array<string>> = [];
      const existingInputs: MaterialNodeUID[] = [];
      const existingOutputsVarName: Map<MaterialNodeUID, string> = new Map()
      const existingOutputs: MaterialNodeUID[] = [];
      for (let i = 1; i < pixelMaterialNodes.length; i++) {
        const materialNode = pixelMaterialNodes[i];
        if (varInputNames[i] == null) {
          varInputNames[i] = [];
        }
        if (i - 1 >= 0) {
          if (varOutputNames[i - 1] == null) {
            varOutputNames[i - 1] = [];
          }
        }
        for (let j = 0; j < materialNode.pixelInputConnections.length; j++) {
          const inputConnection = materialNode.pixelInputConnections[j];
          const inputNode = AbstractMaterialNode.materialNodes[inputConnection.materialNodeUid];
          const outputSocketOfPrev = inputNode.getPixelOutput(inputConnection.outputNameOfPrev);
          const inputSocketOfThis = materialNode.getPixelInput(inputConnection.inputNameOfThis);
          const glslTypeStr = inputSocketOfThis!.compositionType.getGlslStr(inputSocketOfThis!.componentType);
          let varName = `${outputSocketOfPrev!.name}_${inputConnection.materialNodeUid}_to_${materialNode.materialNodeUid}`;
          if (existingInputs.indexOf(inputNode.materialNodeUid) === -1) {
            const rowStr = `${glslTypeStr} ${varName};\n`;
            pixelShaderBody += rowStr;
          }
          const existVarName = existingOutputsVarName.get(inputNode.materialNodeUid);
          if (existVarName) {
            varName = existVarName;
          }
          varInputNames[i].push(varName);
          existingInputs.push(inputConnection.materialNodeUid)
        }
        for (let j = i; j < pixelMaterialNodes.length; j++) {
          const materialNodeInner = pixelMaterialNodes[j];
          const prevMaterialNodeInner = pixelMaterialNodes[i - 1];
          for (let k = 0; k < materialNodeInner.pixelInputConnections.length; k++) {
            const inputConnection = materialNodeInner.pixelInputConnections[k];
            if (prevMaterialNodeInner != null && inputConnection.materialNodeUid !== prevMaterialNodeInner.materialNodeUid) {
              continue;
            }
            const inputNode = AbstractMaterialNode.materialNodes[inputConnection.materialNodeUid];
            if (existingOutputs.indexOf(inputNode.materialNodeUid) === -1) {
              const outputSocketOfPrev = inputNode.getPixelOutput(inputConnection.outputNameOfPrev);
              const varName = `${outputSocketOfPrev!.name}_${inputConnection.materialNodeUid}_to_${materialNodeInner.materialNodeUid}`;

              if (i - 1 >= 0) {
                varOutputNames[i - 1].push(varName);
              }
              existingOutputsVarName.set(inputConnection.materialNodeUid, varName)
            }
            existingOutputs.push(inputConnection.materialNodeUid)
          }
        }

      }

      for (let i = 0; i < pixelMaterialNodes.length; i++) {
        const materialNode = pixelMaterialNodes[i];
        const functionName = materialNode.shaderFunctionName;
        if (varInputNames[i] == null) {
          varInputNames[i] = [];
        }
        if (varOutputNames[i] == null) {
          varOutputNames[i] = [];
        }
        if (materialNode.getPixelInputs().length != varInputNames[i].length ||
          materialNode.getPixelOutputs().length != varOutputNames[i].length) {
          continue;
        }
        const varNames = varInputNames[i].concat(varOutputNames[i]);
        if (varNames.length === 0) {
          continue;
        }
        let rowStr = `${functionName}(`;
        for (let k = 0; k < varNames.length; k++) {
          const varName = varNames[k];
          if (varName == null) {
            continue;
          }
          if (k !== 0) {
            rowStr += ', ';
          }
          rowStr += varNames[k];
        }
        rowStr += ');\n';
        pixelShaderBody += rowStr;
      }

      pixelShaderBody += GLSLShader.glslMainEnd;
    }


    let attributeNames: AttributeNames = [];
    let attributeSemantics: Array<VertexAttributeEnum> = [];
    for (let i = 0; i < vertexMaterialNodes.length; i++) {
      const materialNode = vertexMaterialNodes[i];
      if (materialNode.shader != null) {
        Array.prototype.push.apply(attributeNames, materialNode.shader.attributeNames);
        Array.prototype.push.apply(attributeSemantics, materialNode.shader.attributeSemantics);
      }
    }
    // remove duplicate values
    attributeNames = Array.from(new Set(attributeNames))
    attributeSemantics = Array.from(new Set(attributeSemantics))

    const vertexShader = vertexShaderPrerequisites + vertexShaderBody;
    const pixelShader = pixelShaderPrerequisites + pixelShaderBody;

    return { vertexShader, pixelShader, attributeNames, attributeSemantics, vertexShaderBody, pixelShaderBody };
  }


  createProgram(vertexShaderMethodDefinitions_uniform: string, propertySetter: getShaderPropertyFunc) {

    if (this.__materialNodes[0].isSingleOperation) {
      return this.createProgramAsSingleOperation(vertexShaderMethodDefinitions_uniform, propertySetter);
    } else {
      const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
      let returnValue = this.createProgramString(vertexShaderMethodDefinitions_uniform)!;

      const wholeShaderText = returnValue.vertexShader + returnValue.pixelShader;


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
        this._shaderProgramUid = webglResourceRepository.createShaderProgram(
        {
          materialTypeName: this.__materialTypeName,
          vertexShaderStr: returnValue.vertexShader,
          fragmentShaderStr: returnValue.pixelShader,
          attributeNames: returnValue.attributeNames,
          attributeSemantics: returnValue.attributeSemantics
        }
        );
        Material.__shaderStringMap.set(wholeShaderText, this._shaderProgramUid);
        Material.__shaderHashMap.set(hash, this._shaderProgramUid);
        return this._shaderProgramUid;
      }
    }
  }

  isBlend() {
    if (this.alphaMode === AlphaMode.Blend) {
      return true;
    } else {
      return false;
    }
  }

  static getLocationOffsetOfMemberOfMaterial(materialTypeName: string, propertyIndex: Index) {
    const material = Material.__instancesByTypes.get(materialTypeName)!;
    const info = material.__fieldsInfo.get(propertyIndex)!;
    if (info.soloDatum) {
      const value = Material.__soloDatumFields.get(material.__materialTypeName)!.get(propertyIndex);
      return (value!.value.v as Float32Array).byteOffset / 4 / 4;
    } else {
      const properties = this.__accessors.get(materialTypeName);
      const accessor = properties!.get(propertyIndex);
      return accessor!.byteOffsetInBuffer / 4 / 4;
    }
  }

  static getAccessorOfMemberOfMaterial(materialTypeName: string, propertyIndex: Index) {
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

  setBlendEquationMode(blendEquationMode: number, blendEquationModeAlpha: number | null) {
    this.__blendEquationMode = blendEquationMode;
    this.__blendEquationModeAlpha = blendEquationModeAlpha;
  }

  setBlendFuncSeparateFactor(blendFuncSrcFactor: number, blendFuncDstFactor: number, blendFuncAlphaSrcFactor: number, blendFuncAlphaDstFactor: number) {
    this.__blendFuncSrcFactor = blendFuncSrcFactor;
    this.__blendFuncDstFactor = blendFuncDstFactor;
    this.__blendFuncAlphaSrcFactor = blendFuncAlphaSrcFactor;
    this.__blendFuncAlphaDstFactor = blendFuncAlphaDstFactor;
  }

  setBlendFuncFactor(blendFuncSrcFactor: number, blendFuncDstFactor: number) {
    this.__blendFuncSrcFactor = blendFuncSrcFactor;
    this.__blendFuncDstFactor = blendFuncDstFactor;
    this.__blendFuncAlphaSrcFactor = null;
    this.__blendFuncAlphaDstFactor = null;
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
    for (let materialNode of this.__materialNodes) {
      return materialNode.getShaderSemanticInfoFromName(name);
    }
    return void 0
  }
}
