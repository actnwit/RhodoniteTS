import {
  ShaderSemanticsIndex,
  ShaderSemanticsInfo,
  ShaderSemanticsEnum,
  ShaderSemantics,
  getShaderPropertyFunc,
} from '../definitions/ShaderSemantics';
import {
  Count,
  Index,
  CGAPIResourceHandle,
  IndexOf16Bytes,
} from '../../types/CommonTypes';
import {BufferUse} from '../definitions/BufferUse';
import { MemoryManager } from './MemoryManager';
import {CompositionType} from '../definitions/CompositionType';
import { Material } from '../materials/core/Material';
import {ComponentType} from '../definitions/ComponentType';
import Accessor from '../memory/Accessor';
import { MathClassUtil } from '../math/MathClassUtil';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import {ShaderType} from '../definitions/ShaderType';
import VectorN from '../math/VectorN';
import {ShaderVariableUpdateInterval} from '../definitions/ShaderVariableUpdateInterval';
import Config from './Config';
import { Scalar } from '../math/Scalar';
import { Vector4 } from '../math/Vector4';
import { Vector3 } from '../math/Vector3';
import { MutableMatrix44 } from '../math/MutableMatrix44';
import {WellKnownComponentTIDs} from '../components/WellKnownComponentTIDs';
import {BoneDataType} from '../definitions/BoneDataType';
import {
  ProcessApproach,
  ProcessApproachEnum,
} from '../../foundation/definitions/ProcessApproach';

type GlobalPropertyStruct = {
  shaderSemanticsInfo: ShaderSemanticsInfo;
  values: any[];
  maxCount: Count;
  accessor: Accessor;
};

/**
 * The class which manages global data.
 */
export default class GlobalDataRepository {
  private static __instance: GlobalDataRepository;
  private __fields: Map<ShaderSemanticsIndex, GlobalPropertyStruct> = new Map();

  private constructor() {}

  initialize(approach: ProcessApproachEnum) {
    // CurrentComponentSIDs
    const currentComponentSIDsInfo = {
      semantic: ShaderSemantics.CurrentComponentSIDs,
      compositionType: CompositionType.ScalarArray,
      componentType: ComponentType.Float,
      maxIndex: WellKnownComponentTIDs.maxWellKnownTidNumber,
      stage: ShaderType.VertexAndPixelShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isSystem: true,
      needUniformInFastest: true,
      initialValue: new VectorN(
        new Float32Array(WellKnownComponentTIDs.maxWellKnownTidNumber)
      ),
    };
    this.registerProperty(currentComponentSIDsInfo, 1);
    this.takeOne(ShaderSemantics.CurrentComponentSIDs);

    // Camera
    const viewMatrixInfo = {
      semantic: ShaderSemantics.ViewMatrix,
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      stage: ShaderType.VertexShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isSystem: true,
      initialValue: MutableMatrix44.identity(),
    };
    const projectionMatrixInfo = {
      semantic: ShaderSemantics.ProjectionMatrix,
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      stage: ShaderType.VertexShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isSystem: true,
      initialValue: MutableMatrix44.identity(),
    };
    const viewPositionInfo = {
      semantic: ShaderSemantics.ViewPosition,
      compositionType: CompositionType.Vec3,
      componentType: ComponentType.Float,
      stage: ShaderType.VertexAndPixelShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isSystem: true,
      updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
      initialValue: Vector3.fromCopyArray([0, 0, 1]),
    };
    this.registerProperty(viewMatrixInfo, Config.maxCameraNumber);
    this.registerProperty(projectionMatrixInfo, Config.maxCameraNumber);
    this.registerProperty(viewPositionInfo, Config.maxCameraNumber);

    const maxSkeletalBoneNumber = ProcessApproach.isUniformApproach(approach)
      ? Config.maxSkeletalBoneNumberForUniformMode
      : Config.maxSkeletalBoneNumber;

    // Skinning
    const boneMatrixInfo = {
      semantic: ShaderSemantics.BoneMatrix,
      compositionType: CompositionType.Mat4Array,
      maxIndex: maxSkeletalBoneNumber,
      componentType: ComponentType.Float,
      stage: ShaderType.VertexShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isSystem: true,
      updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
      soloDatum: true,
      initialValue: new VectorN(new Float32Array(0)),
    };
    const boneQuaternionInfo = {
      semantic: ShaderSemantics.BoneQuaternion,
      compositionType: CompositionType.Vec4Array,
      maxIndex: maxSkeletalBoneNumber,
      componentType: ComponentType.Float,
      stage: ShaderType.VertexShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isSystem: true,
      updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
      soloDatum: true,
      initialValue: new VectorN(new Float32Array(0)),
    };
    const boneTranslateScaleInfo = {
      semantic: ShaderSemantics.BoneTranslateScale,
      compositionType: CompositionType.Vec4Array,
      maxIndex: maxSkeletalBoneNumber,
      componentType: ComponentType.Float,
      soloDatum: true,
      stage: ShaderType.VertexShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isSystem: true,
      updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
      initialValue: new VectorN(new Float32Array(0)),
    };
    const boneTranslatePackedQuatInfo = {
      semantic: ShaderSemantics.BoneTranslatePackedQuat,
      compositionType: CompositionType.Vec4Array,
      maxIndex: maxSkeletalBoneNumber,
      componentType: ComponentType.Float,
      stage: ShaderType.VertexShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isSystem: true,
      updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
      soloDatum: true,
      initialValue: new VectorN(new Float32Array(0)),
    };
    const boneScalePackedQuatInfo = {
      semantic: ShaderSemantics.BoneScalePackedQuat,
      compositionType: CompositionType.Vec4Array,
      maxIndex: maxSkeletalBoneNumber,
      componentType: ComponentType.Float,
      soloDatum: true,
      stage: ShaderType.VertexShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isSystem: true,
      updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
      initialValue: new VectorN(new Float32Array(0)),
    };
    const boneCompressedChunkInfo = {
      semantic: ShaderSemantics.BoneCompressedChunk,
      compositionType: CompositionType.Vec4Array,
      maxIndex: maxSkeletalBoneNumber,
      componentType: ComponentType.Float,
      soloDatum: true,
      stage: ShaderType.VertexShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isSystem: true,
      updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
      initialValue: new VectorN(new Float32Array(0)),
    };
    const boneCompressedInfoInfo = {
      semantic: ShaderSemantics.BoneCompressedInfo,
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      soloDatum: true,
      stage: ShaderType.VertexShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isSystem: true,
      updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
      initialValue: Vector4.zero(),
    };
    const skeletalComponentSIDInfo = {
      semantic: ShaderSemantics.SkinningMode,
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Int,
      stage: ShaderType.VertexAndPixelShader,
      min: 0,
      max: 1,
      isSystem: true,
      updateInterval: ShaderVariableUpdateInterval.EveryTime,
      initialValue: Scalar.fromCopyNumber(-1),
    };
    if (Config.boneDataType === BoneDataType.Mat44x1) {
      this.registerProperty(boneMatrixInfo, Config.maxSkeletonNumber);
    } else if (Config.boneDataType === BoneDataType.Vec4x2) {
      this.registerProperty(
        boneTranslatePackedQuatInfo,
        Config.maxSkeletonNumber
      );
      this.registerProperty(boneScalePackedQuatInfo, Config.maxSkeletonNumber);
    } else if (Config.boneDataType === BoneDataType.Vec4x2Old) {
      this.registerProperty(boneQuaternionInfo, Config.maxSkeletonNumber);
      this.registerProperty(boneTranslateScaleInfo, Config.maxSkeletonNumber);
    } else if (Config.boneDataType === BoneDataType.Vec4x1) {
      this.registerProperty(boneTranslateScaleInfo, Config.maxSkeletonNumber);
      this.registerProperty(boneCompressedChunkInfo, Config.maxSkeletonNumber);
      this.registerProperty(boneCompressedInfoInfo, 1);
      this.takeOne(ShaderSemantics.BoneCompressedInfo);
    }
    this.registerProperty(skeletalComponentSIDInfo, 1);
    this.takeOne(ShaderSemantics.SkinningMode);

    // Lighting
    const lightPositionInfo = {
      semantic: ShaderSemantics.LightPosition,
      compositionType: CompositionType.Vec4Array,
      componentType: ComponentType.Float,
      stage: ShaderType.PixelShader,
      maxIndex: Config.maxLightNumberInShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isSystem: true,
      updateInterval: ShaderVariableUpdateInterval.EveryTime,
      initialValue: new VectorN(
        new Float32Array(Config.maxLightNumberInShader)
      ),
    };
    const lightDirectionInfo = {
      semantic: ShaderSemantics.LightDirection,
      compositionType: CompositionType.Vec4Array,
      componentType: ComponentType.Float,
      stage: ShaderType.PixelShader,
      maxIndex: Config.maxLightNumberInShader,
      min: -1,
      max: 1,
      isSystem: true,
      initialValue: new VectorN(
        new Float32Array(Config.maxLightNumberInShader)
      ),
      updateInterval: ShaderVariableUpdateInterval.EveryTime,
    };
    const lightIntensityInfo = {
      semantic: ShaderSemantics.LightIntensity,
      compositionType: CompositionType.Vec4Array,
      componentType: ComponentType.Float,
      stage: ShaderType.PixelShader,
      maxIndex: Config.maxLightNumberInShader,
      min: 0,
      max: 10,
      isSystem: true,
      initialValue: new VectorN(
        new Float32Array(Config.maxLightNumberInShader)
      ),
      updateInterval: ShaderVariableUpdateInterval.EveryTime,
    };
    this.registerProperty(lightPositionInfo, 1);
    this.registerProperty(lightDirectionInfo, 1);
    this.registerProperty(lightIntensityInfo, 1);
    this.takeOne(ShaderSemantics.LightDirection);
    this.takeOne(ShaderSemantics.LightIntensity);
    this.takeOne(ShaderSemantics.LightPosition);

    const lightNumberInfo = {
      semantic: ShaderSemantics.LightNumber,
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Int,
      stage: ShaderType.VertexAndPixelShader,
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
      isSystem: true,
      updateInterval: ShaderVariableUpdateInterval.FirstTimeOnly,
      initialValue: Scalar.fromCopyNumber(0),
    };
    this.registerProperty(lightNumberInfo, 1);
    this.takeOne(ShaderSemantics.LightNumber);
  }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new GlobalDataRepository();
    }
    return this.__instance;
  }

  registerProperty(semanticInfo: ShaderSemanticsInfo, maxCount: Count) {
    const propertyIndex = Material._getPropertyIndex(semanticInfo);

    const buffer = MemoryManager.getInstance().createOrGetBuffer(
      BufferUse.GPUInstanceData
    );

    const alignedByteLength = Material._calcAlignedByteLength(semanticInfo);

    const bufferView = buffer.takeBufferView({
      byteLengthToNeed: alignedByteLength * maxCount,
      byteStride: 0,
    });

    let maxArrayLength = semanticInfo.maxIndex;
    if (
      CompositionType.isArray(semanticInfo.compositionType) &&
      maxArrayLength == null
    ) {
      maxArrayLength = 100;
    }

    const accessor = bufferView.takeAccessor({
      compositionType: semanticInfo.compositionType,
      componentType: ComponentType.Float,
      count: maxCount,
      byteStride: alignedByteLength,
      arrayLength: maxArrayLength,
    });

    const globalPropertyStruct: GlobalPropertyStruct = {
      shaderSemanticsInfo: semanticInfo,
      values: [],
      maxCount: maxCount,
      accessor: accessor,
    };

    this.__fields.set(propertyIndex, globalPropertyStruct);
  }

  takeOne(shaderSemantic: ShaderSemanticsEnum, arrayIndex?: Index) {
    const propertyIndex = Material._getPropertyIndex2(
      shaderSemantic,
      arrayIndex
    );
    const globalPropertyStruct = this.__fields.get(propertyIndex);
    if (globalPropertyStruct) {
      const semanticInfo = globalPropertyStruct.shaderSemanticsInfo;
      const typedArray =
        globalPropertyStruct.accessor.takeOne() as Float32Array;
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

  setValue(
    shaderSemantic: ShaderSemanticsEnum,
    countIndex: Index,
    value: any,
    arrayIndex?: Index
  ) {
    const propertyIndex = Material._getPropertyIndex2(
      shaderSemantic,
      arrayIndex
    );
    const globalPropertyStruct = this.__fields.get(propertyIndex);
    if (globalPropertyStruct) {
      const valueObj = globalPropertyStruct.values[countIndex];
      MathClassUtil._setForce(valueObj, value);
    }
  }

  getValue(
    shaderSemantic: ShaderSemanticsEnum,
    countIndex: Index,
    arrayIndex?: Index
  ) {
    const propertyIndex = Material._getPropertyIndex2(
      shaderSemantic,
      arrayIndex
    );
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

  getGlobalProperties() {
    return Array.from(this.__fields.values());
  }

  setUniformLocationsForUniformModeOnly(shaderProgramUid: CGAPIResourceHandle) {
    const webglResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
    const semanticsInfoArray: ShaderSemanticsInfo[] = [];
    this.__fields.forEach((globalPropertyStruct: GlobalPropertyStruct, key) => {
      const semanticInfo = globalPropertyStruct.shaderSemanticsInfo;
      semanticsInfoArray.push(semanticInfo);
    });

    webglResourceRepository.setupUniformLocations(
      shaderProgramUid,
      semanticsInfoArray,
      true
    );
  }

  setUniformValues(shaderProgram: WebGLProgram) {
    const webglResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
    this.__fields.forEach((globalPropertyStruct: GlobalPropertyStruct, key) => {
      const info = globalPropertyStruct.shaderSemanticsInfo;
      const values = globalPropertyStruct.values;
      for (let i = 0; i < values.length; i++) {
        webglResourceRepository.setUniformValue(
          shaderProgram,
          info.semantic.str,
          true,
          values[i],
          info.index
        );
      }
    });
  }

  // getLocationOffsetOfProperty(propertyIndex: Index, countIndex: Index) {
  //   const globalPropertyStruct = this.__fields.get(propertyIndex);
  //   if (globalPropertyStruct) {
  //     const value = globalPropertyStruct.values[countIndex];
  //     return (value._v as Float32Array).byteOffset / 4 / 4;
  //   }
  //   return void 0;
  // }

  getLocationOffsetOfProperty(propertyIndex: Index): IndexOf16Bytes {
    const globalPropertyStruct = this.__fields.get(propertyIndex);
    if (globalPropertyStruct) {
      return globalPropertyStruct.accessor.byteOffsetInBuffer / 4 / 4;
    }
    return -1;
  }

  getCurrentDataNumberOfTheProperty(propertyIndex: Index) {
    const globalPropertyStruct = this.__fields.get(propertyIndex);
    if (globalPropertyStruct) {
      return globalPropertyStruct.values.length;
    }
    return 0;
  }

  addPropertiesStr(
    vertexPropertiesStr: string,
    pixelPropertiesStr: string,
    propertySetter: getShaderPropertyFunc,
    isWebGL2: boolean
  ) {
    this.__fields.forEach(
      (globalPropertyStruct: GlobalPropertyStruct, propertyIndex: Index) => {
        const info = globalPropertyStruct.shaderSemanticsInfo;
        if (
          info!.stage === ShaderType.VertexShader ||
          info!.stage === ShaderType.VertexAndPixelShader
        ) {
          vertexPropertiesStr += propertySetter(
            '',
            info!,
            propertyIndex,
            true,
            isWebGL2
          );
        }
        if (
          info!.stage === ShaderType.PixelShader ||
          info!.stage === ShaderType.VertexAndPixelShader
        ) {
          pixelPropertiesStr += propertySetter(
            '',
            info!,
            propertyIndex,
            true,
            isWebGL2
          );
        }
      }
    );

    return [vertexPropertiesStr, pixelPropertiesStr];
  }
}
