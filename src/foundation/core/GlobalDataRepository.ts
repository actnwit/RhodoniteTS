import { ShaderSemanticsIndex, ShaderSemanticsInfo } from "../definitions/ShaderSemantics";
import { Count } from "../../types/CommonTypes";
import { BufferUse } from "../definitions/BufferUse";
import MemoryManager from "./MemoryManager";
import BufferView from "../memory/BufferView";
import { CompositionType } from "../definitions/CompositionType";
import Material from "../materials/Material";
import { ComponentType } from "../definitions/ComponentType";
import Accessor from "../memory/Accessor";


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

  private __getPropertyIndex(semanticInfo: ShaderSemanticsInfo) {
    let propertyIndex = semanticInfo.semantic.index;
    if (semanticInfo.index != null) {
      propertyIndex += semanticInfo.index;
      propertyIndex *= -1;
    }
    return propertyIndex;
  }

  registerProperty(semanticInfo: ShaderSemanticsInfo, count: Count) {
    const propertyIndex = this.__getPropertyIndex(semanticInfo);

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

    const globalPropertyStruct: GlobalPropertyStruct = {
      shaderSemanticsInfo: semanticInfo,
      values: [],
      count: count,
      accsessor: accessor
    }

    this.__fields.set(propertyIndex, globalPropertyStruct);
  }
}
