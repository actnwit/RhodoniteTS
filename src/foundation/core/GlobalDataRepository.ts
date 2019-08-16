import { ShaderSemanticsIndex, ShaderSemanticsInfo, ShaderSemanticsClass, ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import { Count, Index } from "../../types/CommonTypes";
import { BufferUse } from "../definitions/BufferUse";
import MemoryManager from "./MemoryManager";
import BufferView from "../memory/BufferView";
import { CompositionType } from "../definitions/CompositionType";
import Material from "../materials/Material";
import { ComponentType } from "../definitions/ComponentType";
import Accessor from "../memory/Accessor";
import MathClassUtil from "../math/MathClassUtil";


type GlobalPropertyStruct = {
  shaderSemanticsInfo: ShaderSemanticsInfo,
  values: any[],
  count: Count,
  accsessor: Accessor
};

/**
 * The class which manages global data.
 */
export default class GlobalDataRepository {
  private static __instance: GlobalDataRepository;
  private __fields: Map<ShaderSemanticsIndex, GlobalPropertyStruct> = new Map();

  private constructor() {
  }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new GlobalDataRepository();
    }
    return this.__instance;
  }

  registerProperty(semanticInfo: ShaderSemanticsInfo, count: Count) {
    const propertyIndex = Material._getPropertyIndex(semanticInfo);

    const buffer = MemoryManager.getInstance().getBuffer(BufferUse.GPUInstanceData);

    const alignedByteLength = Material._calcAlignedByteLength(semanticInfo);

    const bufferView = buffer.takeBufferView({
      byteLengthToNeed: alignedByteLength * count,
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
      count: count,
      byteStride: alignedByteLength,
      arrayLength: maxArrayLength,
      byteAlign: 16
    });

    const values: any = [];
    for (let i=0; i<count; i++) {
      const value = accessor.takeOne();
      values.push(value);
    }

    const globalPropertyStruct: GlobalPropertyStruct = {
      shaderSemanticsInfo: semanticInfo,
      values: values,
      count: count,
      accsessor: accessor
    }

    this.__fields.set(propertyIndex, globalPropertyStruct);
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
}
