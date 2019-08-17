import { ShaderSemanticsIndex, ShaderSemanticsInfo, ShaderSemanticsClass, ShaderSemanticsEnum, ShaderSemantics } from "../definitions/ShaderSemantics";
import { Count, Index, CGAPIResourceHandle } from "../../types/CommonTypes";
import { BufferUse } from "../definitions/BufferUse";
import MemoryManager from "./MemoryManager";
import BufferView from "../memory/BufferView";
import { CompositionType } from "../definitions/CompositionType";
import Material, { getShaderPropertyFunc } from "../materials/Material";
import { ComponentType } from "../definitions/ComponentType";
import Accessor from "../memory/Accessor";
import MathClassUtil from "../math/MathClassUtil";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";
import { ShaderType } from "../definitions/ShaderType";
import VectorN from "../math/VectorN";
import { ShaderVariableUpdateInterval } from "../definitions/ShaderVariableUpdateInterval";
import Config from "./Config";
import Scalar from "../math/Scalar";
import Vector4 from "../math/Vector4";


type GlobalPropertyStruct = {
  shaderSemanticsInfo: ShaderSemanticsInfo,
  values: any[],
  maxCount: Count,
  accessor: Accessor
};

/**
 * The class which manages global data.
 */
export default class GlobalDataRepository {
  private static __instance: GlobalDataRepository;
  private __fields: Map<ShaderSemanticsIndex, GlobalPropertyStruct> = new Map();

  private constructor() {

  }

  initialize() {

    // Skinning
    const boneQuaternionInfo = {semantic: ShaderSemantics.BoneQuaternion, compositionType: CompositionType.Vec4Array, maxIndex: 250, componentType: ComponentType.Float,
      stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: true, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, soloDatum: true, initialValue: new VectorN(new Float32Array(0))};
    const boneTranslateScaleInfo = {semantic: ShaderSemantics.BoneTranslateScale, compositionType: CompositionType.Vec4Array, maxIndex: 250, componentType: ComponentType.Float, soloDatum: true,
      stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: true, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: new VectorN(new Float32Array(0))};
    this.registerProperty(boneQuaternionInfo, Config.maxSkeletonNumber);
    this.registerProperty(boneTranslateScaleInfo, Config.maxSkeletonNumber);

    // Lighting
    // const lightNumberInfo = { semantic: ShaderSemantics.LightNumber, compositionType: CompositionType.Scalar, componentType: ComponentType.Int, stage: ShaderType.PixelShader,
      // min: 0, max: Number.MAX_SAFE_INTEGER, isSystem: true, updateInteval: ShaderVariableUpdateInterval.FirstTimeOnly, initialValue: new Scalar(0), soloDatum: true };
    const maxLightNumber = Config.maxLightNumberInShader;
    const lightPositionInfo = { semantic: ShaderSemantics.LightPosition, compositionType: CompositionType.Vec4, componentType: ComponentType.Float, stage: ShaderType.PixelShader,
      min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime, initialValue: new Vector4(0, 0, 0, 1), soloDatum: true};
    const lightDirectionInfo = { semantic: ShaderSemantics.LightDirection, compositionType: CompositionType.Vec4, componentType: ComponentType.Float, stage: ShaderType.PixelShader,
      min: -1, max: 1, isSystem: true, initialValue: new Vector4(0, 1, 0, 1), updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: true };
    const lightIntensity = { semantic: ShaderSemantics.LightIntensity, compositionType: CompositionType.Vec4, componentType: ComponentType.Float, stage: ShaderType.PixelShader,
      min: 0, max: 10, isSystem: true, initialValue: new Vector4(1, 1, 1, 1), updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: true };
    this.registerProperty(lightPositionInfo, maxLightNumber);
    this.registerProperty(lightDirectionInfo, maxLightNumber);
    this.registerProperty(lightIntensity, maxLightNumber);
  }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new GlobalDataRepository();
    }
    return this.__instance;
  }

  registerProperty(semanticInfo: ShaderSemanticsInfo, maxCount: Count) {
    const propertyIndex = Material._getPropertyIndex(semanticInfo);

    const buffer = MemoryManager.getInstance().getBuffer(BufferUse.GPUInstanceData);

    const alignedByteLength = Material._calcAlignedByteLength(semanticInfo);

    const bufferView = buffer.takeBufferView({
      byteLengthToNeed: alignedByteLength * maxCount,
      byteStride: 0,
      byteAlign: 16,
      isAoS: false
    });

    let maxArrayLength = semanticInfo.maxIndex;
    if (CompositionType.isArray(semanticInfo.compositionType) && maxArrayLength == null) {
      maxArrayLength = 100;
    }

    const accessor = bufferView.takeFlexibleAccessor({
      compositionType: semanticInfo.compositionType,
      componentType: ComponentType.Float,
      count: maxCount,
      byteStride: alignedByteLength,
      arrayLength: maxArrayLength,
      byteAlign: 16
    });

    const globalPropertyStruct: GlobalPropertyStruct = {
      shaderSemanticsInfo: semanticInfo,
      values: [],
      maxCount: maxCount,
      accessor: accessor
    }

    this.__fields.set(propertyIndex, globalPropertyStruct);
  }

  takeOne(shaderSemantic: ShaderSemanticsEnum, arrayIndex?: Index) {
    const propertyIndex = Material._getPropertyIndex2(shaderSemantic, arrayIndex);
    const globalPropertyStruct = this.__fields.get(propertyIndex);
    if (globalPropertyStruct) {
      const semanticInfo = globalPropertyStruct.shaderSemanticsInfo;
      const typedArray = globalPropertyStruct.accessor.takeOne() as Float32Array;
      const countIndex = globalPropertyStruct.values.length;
      const valueObj = MathClassUtil.initWithFloat32Array(
        semanticInfo.initialValue,
        semanticInfo.initialValue,
        typedArray,
        semanticInfo.compositionType
      );
      globalPropertyStruct.values[countIndex] = valueObj;
      return valueObj;
    }
    return void 0;
  }

  setValue(shaderSemantic: ShaderSemanticsEnum, countIndex: Index, value: any, arrayIndex?: Index) {
    const propertyIndex = Material._getPropertyIndex2(shaderSemantic, arrayIndex);
    const globalPropertyStruct = this.__fields.get(propertyIndex);
    if (globalPropertyStruct) {
      const valueObj = globalPropertyStruct.values[countIndex];
      MathClassUtil._setForce(valueObj, value);
    }
  }

  getValue(shaderSemantic: ShaderSemanticsEnum, countIndex: Index, arrayIndex?: Index) {
    const propertyIndex = Material._getPropertyIndex2(shaderSemantic, arrayIndex);
    const globalPropertyStruct = this.__fields.get(propertyIndex);
    if (globalPropertyStruct) {
      const valueObj = globalPropertyStruct.values[countIndex];
      return valueObj;
    }
    return void 0;
  }

  getGlobalPropertyStruct(propertyIndex: Index) {
    return this.__fields.get(propertyIndex);
  }

  setUniformLocations(shaderProgramUid: CGAPIResourceHandle) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const semanticsInfoArray: ShaderSemanticsInfo[] = [];
    this.__fields.forEach((globalPropertyStruct: GlobalPropertyStruct, key) => {
      const semanticInfo = globalPropertyStruct.shaderSemanticsInfo;
      semanticsInfoArray.push(semanticInfo);
    });

    webglResourceRepository.setupUniformLocations(shaderProgramUid, semanticsInfoArray);
  }

  setUniformValues(shaderProgram: WebGLProgram) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    this.__fields.forEach((globalPropertyStruct: GlobalPropertyStruct, key) => {
      const info = globalPropertyStruct.shaderSemanticsInfo;
      const values  = globalPropertyStruct.values;
      for (let i=0; i<values.length; i++) {
        webglResourceRepository.setUniformValue(shaderProgram, info.semantic.str, true, values[i], info.index);
      }
    });
  }

  // getLocationOffsetOfProperty(propertyIndex: Index, countIndex: Index) {
  //   const globalPropertyStruct = this.__fields.get(propertyIndex);
  //   if (globalPropertyStruct) {
  //     const value = globalPropertyStruct.values[countIndex];
  //     return (value.v as Float32Array).byteOffset / 4 / 4;
  //   }
  //   return void 0;
  // }

  getLocationOffsetOfProperty(propertyIndex: Index) {
    const globalPropertyStruct = this.__fields.get(propertyIndex);
    if (globalPropertyStruct) {
      return globalPropertyStruct.accessor.byteOffsetInBuffer / 4 / 4;
    }
    return void 0;
  }


  getCurrentDataNumberOfTheProperty(propertyIndex: Index) {
    const globalPropertyStruct = this.__fields.get(propertyIndex);
    if (globalPropertyStruct) {
      return globalPropertyStruct.values.length;
    }
    return 0;
  }

  addPropertiesStr(vertexPropertiesStr: string, pixelPropertiesStr: string, propertySetter: getShaderPropertyFunc) {
    this.__fields.forEach((globalPropertyStruct: GlobalPropertyStruct, propertyIndex: Index) => {
      const info = globalPropertyStruct.shaderSemanticsInfo;
      if (info!.stage === ShaderType.VertexShader || info!.stage === ShaderType.VertexAndPixelShader) {
        vertexPropertiesStr += propertySetter('', info!, propertyIndex, true);
      }
      if (info!.stage === ShaderType.PixelShader || info!.stage === ShaderType.VertexAndPixelShader) {
        pixelPropertiesStr += propertySetter('', info!, propertyIndex, true);
      }
    });

    return [vertexPropertiesStr, pixelPropertiesStr];
  }
}
