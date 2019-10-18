import RnObject from "../core/RnObject";
import MutableColorRgb from "../math/MutableColorRgb";
import Texture from "../textures/Texture";
import Vector3 from "../math/Vector3";
import { AlphaMode, AlphaModeEnum } from "../definitions/AlphaMode";
import { ShaderNode } from "../definitions/ShaderNode";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { ShaderSemanticsEnum, ShaderSemanticsInfo, ShaderSemanticsClass, ShaderSemantics, ShaderSemanticsIndex } from "../definitions/ShaderSemantics";
import { CompositionType } from "../definitions/CompositionType";
import MathClassUtil from "../math/MathClassUtil";
import WebGLResourceRepository from "../../webgl/WebGLResourceRepository";
import { ComponentType } from "../definitions/ComponentType";
import Vector2 from "../math/Vector2";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";
import { runInThisContext } from "vm";
import GLSLShader, { AttributeNames } from "../../webgl/shaders/GLSLShader";
import { pathExists } from "fs-extra";
import { VertexAttributeEnum } from "../main";
import { VertexAttribute } from "../definitions/VertexAttribute";
import AbstractTexture from "../textures/AbstractTexture";
import MemoryManager from "../core/MemoryManager";
import { BufferUse } from "../definitions/BufferUse";
import Config from "../core/Config";
import BufferView from "../memory/BufferView";
import Accessor from "../memory/Accessor";
import ISingleShader from "../../webgl/shaders/ISingleShader";
import { ShaderType } from "../definitions/ShaderType";
import { thisExpression } from "@babel/types";
import { Index, CGAPIResourceHandle, Count, Byte } from "../../types/CommonTypes";
import DataUtil from "../misc/DataUtil";
import GlobalDataRepository from "../core/GlobalDataRepository";

type MaterialTypeName = string;
type PropertyName = string;

export type getShaderPropertyFunc = (materialTypeName: string, info: ShaderSemanticsInfo, propertyIndex: Index, isGlobalData: boolean) => string;


/**
 * The material class.
 * This class has one or more material nodes.
 */
export default class Material extends RnObject {
  private __materialNodes: AbstractMaterialNode[] = [];
  private __fields: Map<ShaderSemanticsIndex, any> = new Map();
  private static __soloDatumFields: Map<MaterialTypeName, Map<ShaderSemanticsIndex, any>> = new Map();
  private __fieldsInfo: Map<ShaderSemanticsIndex, ShaderSemanticsInfo> = new Map();
  public _shaderProgramUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __alphaMode = AlphaMode.Opaque;
  private static __shaderMap: Map<number, CGAPIResourceHandle> = new Map();
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

  public cullface: boolean | null = null;
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
   * @param materialNodes_ The material nodes to add to the created materlal.
   */
  static createMaterial(materialTypeName: string, materialNodes_?: AbstractMaterialNode[]) {
    let materialNodes = materialNodes_;
    if (!materialNodes) {
      materialNodes = Material.__materialTypes.get(materialTypeName)!;
    }

    return new Material(Material.__materialTids.get(materialTypeName)!, materialTypeName, materialNodes);
  }


  static isRegistedMaterialType(materialTypeName: string) {
    return Material.__materialTypes.has(materialTypeName);
  }

  static _calcAlignedByteLength(semanticInfo: ShaderSemanticsInfo) {
    const compsitionNumber = semanticInfo.compositionType.getNumberOfComponents();
    const componentSizeInByte = semanticInfo.componentType.getSizeInBytes();
    const semanticInfoByte = compsitionNumber * componentSizeInByte;
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
    const alignedByteLengthAndsemanticInfoArray = [];
    for (let materialNode of materialNodes) {
      for (let semanticInfo of materialNode._semanticsInfoArray) {
        const alignedByteLength = Material._calcAlignedByteLength(semanticInfo);
        let dataCount = 1;
        if (!semanticInfo.soloDatum) {
          dataCount = Material.__maxInstances.get(materialTypeName)!;
        }

        totalByteLength += alignedByteLength * dataCount;
        alignedByteLengthAndsemanticInfoArray.push({ alignedByte: alignedByteLength, semanticInfo: semanticInfo });

      }
    }

    if (!this.__accessors.has(materialTypeName)) {
      this.__accessors.set(materialTypeName, new Map());
    }


    const buffer = MemoryManager.getInstance().getBuffer(BufferUse.GPUInstanceData);
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

    for (let i = 0; i < alignedByteLengthAndsemanticInfoArray.length; i++) {
      const alignedByte = alignedByteLengthAndsemanticInfoArray[i].alignedByte;
      const semanticInfo = alignedByteLengthAndsemanticInfoArray[i].semanticInfo;

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
          this._getPropertyIndex(semanticInfo),
          MathClassUtil.initWithFloat32Array(
            semanticInfo.initialValue,
            semanticInfo.initialValue,
            typedArray,
            semanticInfo.compositionType
          ));
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

  static getAllMaterials() {
    return Material.__materials;
  }

  setMaterialNodes(materialNodes: AbstractMaterialNode[]) {
    this.__materialNodes = materialNodes;
  }

  get materialSID() {
    return this.__materialSid;
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
          this.__fields.set(
            propertyIndex,
            MathClassUtil.initWithFloat32Array(
              semanticsInfo.initialValue,
              semanticsInfo.initialValue,
              typedArray,
              semanticsInfo.compositionType
            ));
        }
      });
    });
  }

  setParameter(shaderSemantic: ShaderSemanticsEnum, value: any, index?: Index) {
    const propertyIndex = Material._getPropertyIndex2(shaderSemantic, index);
    const info = this.__fieldsInfo.get(propertyIndex);
    if (info != null) {
      let valueObj;
      if (info.soloDatum) {
        valueObj = Material.__soloDatumFields.get(this.__materialTypeName)!.get(propertyIndex);
      } else {
        valueObj = this.__fields.get(propertyIndex);
      }
      MathClassUtil._setForce(valueObj, value);
    }
  }

  setTextureParameter(shaderSemantic: ShaderSemanticsEnum, value: AbstractTexture): void {
    if (this.__fieldsInfo.has(shaderSemantic.index)) {
      const array = this.__fields.get(shaderSemantic.index)!;
      this.__fields.set(shaderSemantic.index, [array[0], value]);

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
        return this.__fields.get(shaderSemantic.index);
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

  setUniformValues(firstTime: boolean, args?: Object) {
    const shaderProgramUid = this._shaderProgramUid;
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const shaderProgram = webglResourceRepository.getWebGLResource(shaderProgramUid) as any;

    this.__fields.forEach((value, key) => {
      const shaderSemantic = ShaderSemanticsClass.getShaderSemanticByIndex(key);
      webglResourceRepository.setUniformValue(shaderProgram, shaderSemantic.str, firstTime, value);
    });
  }

  setUniformValuesForOnlyTextures(firstTime: boolean) {
    const shaderProgramUid = this._shaderProgramUid;
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const shaderProgram = webglResourceRepository.getWebGLResource(shaderProgramUid) as any;

    this.__fields.forEach((value, key) => {
      const info = this.__fieldsInfo.get(key)!;
      if (info.compositionType === CompositionType.Texture2D || info.compositionType === CompositionType.TextureCube) {
        this.__fields.forEach((value, key) => {
          const shaderSemantic = ShaderSemanticsClass.getShaderSemanticByIndex(key);
          webglResourceRepository.setUniformValue(shaderProgram, shaderSemantic.str, firstTime, value);
        });
      }
    });
  }

  setParemetersForGPU({ material, shaderProgram, firstTime, args }: { material: Material, shaderProgram: WebGLProgram, firstTime: boolean, args?: any }) {
    this.__materialNodes.forEach((materialNode) => {
      if (materialNode.setParametersForGPU) {
        materialNode.setParametersForGPU({ material, shaderProgram, firstTime, args });
      }
    });

    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    this.__fields.forEach((value, key) => {
      const info = this.__fieldsInfo.get(key)!;
      if (args.setUniform || info.compositionType === CompositionType.Texture2D || info.compositionType === CompositionType.TextureCube) {
        if (!info.isSystem) {
          webglResourceRepository.setUniformValue(shaderProgram, info.semantic.str, firstTime, value, info.index);
        }
      }
    });

    this.setSoloDatumParemetersForGPU({ shaderProgram, firstTime, args });
  }

  setSoloDatumParemetersForGPU({ shaderProgram, firstTime, args }: { shaderProgram: WebGLProgram, firstTime: boolean, args?: any }) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const materialTypeName = this.__materialTypeName;
    const map = Material.__soloDatumFields.get(materialTypeName);
    if (map == null) return;
    map.forEach((value, key) => {
      const info = this.__fieldsInfo.get(key)!;
      if (args.setUniform || info.compositionType === CompositionType.Texture2D || info.compositionType === CompositionType.TextureCube) {
        if (!info.isSystem) {
          webglResourceRepository.setUniformValue(shaderProgram, info.semantic.str, firstTime, value, info.index);
        }
      }
    });
  }

  createProgramAsSingleOperation(vertexShaderMethodDefinitions_uniform: string, propertySetter: getShaderPropertyFunc) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const materialNode = this.__materialNodes[0];
    const glslShader = materialNode.shader;

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

    // Shader Construction
    let vertexShader = (glslShader as any as ISingleShader).getVertexShaderBody({ getters: vertexPropertiesStr, definitions: materialNode.definitions, matricesGetters: vertexShaderMethodDefinitions_uniform });

    let fragmentShader = (glslShader as any as ISingleShader).getPixelShaderBody({ getters: pixelPropertiesStr, definitions: materialNode.definitions });

    const hash = DataUtil.toCRC32(vertexShader + fragmentShader);

    // Cache
    if (Material.__shaderMap.has(hash)) {
      this._shaderProgramUid = Material.__shaderMap.get(hash)!;
      return this._shaderProgramUid;
    } else {
      this._shaderProgramUid = webglResourceRepository.createShaderProgram(
        {
          materialTypeName: this.__materialTypeName,
          vertexShaderStr: vertexShader,
          fragmentShaderStr: fragmentShader,
          attributeNames: glslShader.attributeNames,
          attributeSemantics: glslShader.attributeSemantics
        }
      );
      Material.__shaderMap.set(hash, this._shaderProgramUid);
      return this._shaderProgramUid;
    }
  }

  /*
  createProgramString(vertexShaderMethodDefinitions_uniform = '') {

    // Find Start Node
    let firstMaterialNodeVertex: AbstractMaterialNode;
    let firstMaterialNodePixel: AbstractMaterialNode;
    for (let i = 0; i < this.__materialNodes.length; i++) {
      const materialNode = this.__materialNodes[i];
      if (materialNode.vertexInputConnections.length === 0) {
        firstMaterialNodeVertex = materialNode;
      }
      if (materialNode.pixelInputConnections.length === 0) {
        firstMaterialNodePixel = materialNode;
      }
    }

    // Topological Sorting
    const ignoredInputUidsVertex: Index[] = [firstMaterialNodeVertex!.materialNodeUid];
    const sortedNodeArrayVertex: AbstractMaterialNode[] = [firstMaterialNodeVertex!];
    const ignoredInputUidsPixel: Index[] = [firstMaterialNodePixel!.materialNodeUid];
    const sortedNodeArrayPixel: AbstractMaterialNode[] = [firstMaterialNodePixel!];
    /// delete first nodes from existing array
    const materialNodesVertex = this.__materialNodes.concat();
    const materialNodesPixel = this.__materialNodes.concat();
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

    // Get GLSL Beginning code
    let vertexShader = firstMaterialNodePixel!.shader.glsl_versionText + firstMaterialNodeVertex!.shader.glslPrecision;
    let pixelShader = firstMaterialNodePixel!.shader.glsl_versionText + firstMaterialNodeVertex!.shader.glslPrecision;

    // attribute variables definitions in Vertex Shader
    for (let i = 0; i < sortedNodeArrayVertex.length; i++) {
      const materialNode = sortedNodeArrayVertex[i];
      const attributeNames = materialNode.shader.attributeNames;
      const attributeSemantics = materialNode.shader.attributeSemantics;
      const attributeCompositions = materialNode.shader.attributeCompositions;
      for (let j = 0; j < attributeSemantics.length; j++) {
        const attributeName = attributeNames[j];
        const attributeComposition = attributeCompositions[j];
        vertexShader += `${attributeComposition.getGlslStr(ComponentType.Float)} ${attributeName};\n`;
      }
    }
    vertexShader += '\n';

    // uniform variables definitions
    for (let i = 0; i < sortedNodeArrayVertex.length; i++) {
      const materialNode = sortedNodeArrayVertex[i];
      const semanticsInfoArray = materialNode._semanticsInfoArray;
      for (let j = 0; j < semanticsInfoArray.length; j++) {
        const semanticInfo = semanticsInfoArray[j];
        const attributeComposition = semanticInfo.compositionType!;
        vertexShader += `uniform ${attributeComposition.getGlslStr(semanticInfo.componentType!)} u_${semanticInfo.semantic!.str};\n`;
      }
    }
    vertexShader += '\n';
    for (let i = 0; i < sortedNodeArrayPixel.length; i++) {
      const materialNode = sortedNodeArrayPixel[i];
      const semanticsInfoArray = materialNode._semanticsInfoArray;
      for (let j = 0; j < semanticsInfoArray.length; j++) {
        const semanticInfo = semanticsInfoArray[j];
        const attributeComposition = semanticInfo.compositionType!;
        pixelShader += `uniform ${attributeComposition.getGlslStr(semanticInfo.componentType!)} u_${semanticInfo.semantic!.str};\n`;
      }
    }
    pixelShader += '\n';


    // remove node which don't have inputConnections (except first node)
    const vertexMaterialNodes = [];
    const pixelMaterialNodes = [];
    for (let i = 0; i < sortedNodeArrayVertex.length; i++) {
      const materialNode = sortedNodeArrayVertex[i];
      if (i === 0 || materialNode.vertexInputConnections.length > 0) {
        vertexMaterialNodes.push(materialNode);
      }
    }
    for (let i = 0; i < sortedNodeArrayPixel.length; i++) {
      const materialNode = sortedNodeArrayPixel[i];
      if (i === 0 || materialNode.pixelInputConnections.length > 0) {
        pixelMaterialNodes.push(materialNode);
      }
    }

    // Add additional functions by system

    vertexShader += `
uniform bool u_vertexAttributesExistenceArray[${VertexAttribute.AttributeTypeNumber}];
`
    vertexShader += vertexShaderMethodDefinitions_uniform;

    // function definitions
    const existFunctions: string[] = [];
    for (let i = 0; i < vertexMaterialNodes.length; i++) {
      const materialNode = vertexMaterialNodes[i];
      if (existFunctions.indexOf(materialNode.shaderFunctionName) !== -1) {
        continue;
      }
      vertexShader += materialNode.shader.vertexShaderDefinitions;
      pixelShader += materialNode.shader.pixelShaderDefinitions;
      existFunctions.push(materialNode.shaderFunctionName);
    }

    // vertex main process
    {
      vertexShader += firstMaterialNodeVertex!.shader.glslMainBegin;
      const varInputNames: Array<Array<string>> = [];
      const varOutputNames: Array<Array<string>> = [];
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
          const varName = `${outputSocketOfPrev!.name}_${inputConnection.materialNodeUid}_to_${inputSocketOfThis!.name}_${materialNode.materialNodeUid}`;
          varInputNames[i].push(varName);

          const rowStr = `${glslTypeStr} ${varName};\n`;
          vertexShader += rowStr;
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
            const outputSocketOfPrev = inputNode.getVertexOutput(inputConnection.outputNameOfPrev);
            const inputSocketOfThis = materialNodeInner.getVertexInput(inputConnection.inputNameOfThis);
            const glslTypeStr = inputSocketOfThis!.compositionType.getGlslStr(inputSocketOfThis!.componentType);
            const varName = `${outputSocketOfPrev!.name}_${inputConnection.materialNodeUid}_to_${inputSocketOfThis!.name}_${materialNodeInner.materialNodeUid}`;

            if (i - 1 >= 0) {
              varOutputNames[i - 1].push(varName);
            }

          }
        }

      }

      for (let i = 0; i < vertexMaterialNodes.length; i++) {
        const materialNode = vertexMaterialNodes[i];

        const functionName = materialNode.shaderFunctionName;
        if (varInputNames[i] == null) {
          varInputNames[i] = [];
        }
        const varNames = varInputNames[i].concat(varOutputNames[i]);
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
        vertexShader += rowStr;
      }

      vertexShader += firstMaterialNodeVertex!.shader.glslMainEnd;
    }

    // pixel main process
    {
      pixelShader += firstMaterialNodePixel!.shader.glslMainBegin;
      const varInputNames: Array<Array<string>> = [];
      const varOutputNames: Array<Array<string>> = [];
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
          const varName = `${outputSocketOfPrev!.name}_${inputConnection.materialNodeUid}_to_${inputSocketOfThis!.name}_${materialNode.materialNodeUid}`;
          varInputNames[i].push(varName);

          const rowStr = `${glslTypeStr} ${varName};\n`;
          pixelShader += rowStr;
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
            const outputSocketOfPrev = inputNode.getPixelOutput(inputConnection.outputNameOfPrev);
            const inputSocketOfThis = materialNodeInner.getPixelInput(inputConnection.inputNameOfThis);
            const glslTypeStr = inputSocketOfThis!.compositionType.getGlslStr(inputSocketOfThis!.componentType);
            const varName = `${outputSocketOfPrev!.name}_${inputConnection.materialNodeUid}_to_${inputSocketOfThis!.name}_${materialNodeInner.materialNodeUid}`;

            if (i - 1 >= 0) {
              varOutputNames[i - 1].push(varName);
            }

          }
        }

      }

      for (let i = 0; i < pixelMaterialNodes.length; i++) {
        const materialNode = pixelMaterialNodes[i];

        const functionName = materialNode.shaderFunctionName;
        if (varInputNames[i] == null) {
          varInputNames[i] = [];
        }
        const varNames = varInputNames[i].concat(varOutputNames[i]);
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
        pixelShader += rowStr;
      }

      pixelShader += firstMaterialNodePixel!.shader.glslMainEnd;
    }


    let attributeNames: AttributeNames = [];
    let attributeSemantics: Array<VertexAttributeEnum> = [];
    for (let i = 0; i < vertexMaterialNodes.length; i++) {
      const materialNode = vertexMaterialNodes[i];
      Array.prototype.push.apply(attributeNames, materialNode.shader.attributeNames);
      Array.prototype.push.apply(attributeSemantics, materialNode.shader.attributeSemantics);
    }
    // remove duplicate values
    attributeNames = Array.from(new Set(attributeNames))
    attributeSemantics = Array.from(new Set(attributeSemantics))

    return { vertexShader, pixelShader, attributeNames, attributeSemantics };
  }
  */

  createProgram(vertexShaderMethodDefinitions_uniform: string, propertySetter: getShaderPropertyFunc) {

    if (this.__materialNodes[0].isSingleOperation) {
      return this.createProgramAsSingleOperation(vertexShaderMethodDefinitions_uniform, propertySetter);
    } else {
      /*
      const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
      let returnValue = this.createProgramString(vertexShaderMethodDefinitions_uniform);

      const hash = DataUtil.toCRC32(returnValue.vertexShader + returnValue.pixelShader);

      // Cache
      if (Material.__shaderMap.has(hash)) {
        this._shaderProgramUid = Material.__shaderMap.get(hash)!;
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
        Material.__shaderMap.set(hash, this._shaderProgramUid);
        return this._shaderProgramUid;
      }
      */
      return -1;
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
      return (value.v as Float32Array).byteOffset / 4 / 4;
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

}
