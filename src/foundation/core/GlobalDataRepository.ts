import {
  ShaderSemanticsIndex,
  ShaderSemanticsEnum,
  ShaderSemantics,
  getShaderPropertyFunc,
  _getPropertyIndex2,
  ShaderSemanticsName,
} from '../definitions/ShaderSemantics';
import { Count, Index, CGAPIResourceHandle, IndexOf16Bytes } from '../../types/CommonTypes';
import { BufferUse } from '../definitions/BufferUse';
import { MemoryManager } from './MemoryManager';
import { CompositionType } from '../definitions/CompositionType';
import { ComponentType } from '../definitions/ComponentType';
import { Accessor } from '../memory/Accessor';
import { MathClassUtil } from '../math/MathClassUtil';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import { ShaderType } from '../definitions/ShaderType';
import { VectorN } from '../math/VectorN';
import { Config } from './Config';
import { Scalar } from '../math/Scalar';
import { Vector4 } from '../math/Vector4';
import { Vector3 } from '../math/Vector3';
import { MutableMatrix44 } from '../math/MutableMatrix44';
import { WellKnownComponentTIDs } from '../components/WellKnownComponentTIDs';
import { BoneDataType } from '../definitions/BoneDataType';
import { ProcessApproach, ProcessApproachEnum } from '../../foundation/definitions/ProcessApproach';
import { calcAlignedByteLength, ShaderSemanticsInfo } from '../definitions/ShaderSemanticsInfo';
import { Vector2 } from '../math';

type GlobalPropertyStruct = {
  shaderSemanticsInfo: ShaderSemanticsInfo;
  values: any[];
  maxCount: Count;
  accessor: Accessor;
};

/**
 * The class which manages global data.
 */
export class GlobalDataRepository {
  private static __instance: GlobalDataRepository;
  private __fields: Map<ShaderSemanticsName, GlobalPropertyStruct> = new Map();

  private constructor() {}

  /**
   * Initialize the GlobalDataRepository
   * @param approach - ProcessApproachEnum for initialization
   */
  initialize(approach: ProcessApproachEnum) {
    // CurrentComponentSIDs
    const currentComponentSIDsInfo = {
      semantic: 'currentComponentSIDs',
      compositionType: CompositionType.ScalarArray,
      componentType: ComponentType.Float,
      arrayLength: WellKnownComponentTIDs.maxWellKnownTidNumber,
      stage: ShaderType.VertexAndPixelShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isInternalSetting: true,
      needUniformInDataTextureMode: true,
      initialValue: new VectorN(new Float32Array(WellKnownComponentTIDs.maxWellKnownTidNumber)),
    };
    this.__registerProperty(currentComponentSIDsInfo, 1);
    this.takeOne('currentComponentSIDs');

    // Camera
    const viewMatrixInfo = {
      semantic: 'viewMatrix',
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      stage: ShaderType.VertexAndPixelShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isInternalSetting: true,
      initialValue: MutableMatrix44.identity(),
    };
    const projectionMatrixInfo = {
      semantic: 'projectionMatrix',
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      stage: ShaderType.VertexAndPixelShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isInternalSetting: true,
      initialValue: MutableMatrix44.identity(),
    };
    const viewPositionInfo = {
      semantic: 'viewPosition',
      compositionType: CompositionType.Vec3,
      componentType: ComponentType.Float,
      stage: ShaderType.VertexAndPixelShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isInternalSetting: true,
      initialValue: Vector3.fromCopyArray([0, 0, 1]),
    };
    this.__registerProperty(viewMatrixInfo, Config.maxCameraNumber);
    this.__registerProperty(projectionMatrixInfo, Config.maxCameraNumber);
    this.__registerProperty(viewPositionInfo, Config.maxCameraNumber);

    const maxSkeletalBoneNumber = ProcessApproach.isUniformApproach(approach)
      ? Config.maxSkeletalBoneNumberForUniformMode
      : Config.maxSkeletalBoneNumber;

    // Skinning
    const boneMatrixInfo = {
      semantic: 'boneMatrix',
      compositionType: CompositionType.Mat4x3Array,
      arrayLength: maxSkeletalBoneNumber,
      componentType: ComponentType.Float,
      stage: ShaderType.VertexShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isInternalSetting: true,
      soloDatum: true,
      initialValue: new VectorN(new Float32Array(0)),
    };
    const boneQuaternionInfo = {
      semantic: 'boneQuaternion',
      compositionType: CompositionType.Vec4Array,
      arrayLength: maxSkeletalBoneNumber,
      componentType: ComponentType.Float,
      stage: ShaderType.VertexShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isInternalSetting: true,
      soloDatum: true,
      initialValue: new VectorN(new Float32Array(0)),
    };
    const boneTranslateScaleInfo = {
      semantic: 'boneTranslateScale',
      compositionType: CompositionType.Vec4Array,
      arrayLength: maxSkeletalBoneNumber,
      componentType: ComponentType.Float,
      soloDatum: true,
      stage: ShaderType.VertexShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isInternalSetting: true,
      initialValue: new VectorN(new Float32Array(0)),
    };
    const boneTranslatePackedQuatInfo = {
      semantic: 'boneTranslatePackedQuat',
      compositionType: CompositionType.Vec4Array,
      arrayLength: maxSkeletalBoneNumber,
      componentType: ComponentType.Float,
      stage: ShaderType.VertexShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isInternalSetting: true,
      soloDatum: true,
      initialValue: new VectorN(new Float32Array(0)),
    };
    const boneScalePackedQuatInfo = {
      semantic: 'boneScalePackedQuat',
      compositionType: CompositionType.Vec4Array,
      arrayLength: maxSkeletalBoneNumber,
      componentType: ComponentType.Float,
      soloDatum: true,
      stage: ShaderType.VertexShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isInternalSetting: true,
      initialValue: new VectorN(new Float32Array(0)),
    };
    const boneCompressedChunkInfo = {
      semantic: 'boneCompressedChunk',
      compositionType: CompositionType.Vec4Array,
      arrayLength: maxSkeletalBoneNumber,
      componentType: ComponentType.Float,
      soloDatum: true,
      stage: ShaderType.VertexShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isInternalSetting: true,
      initialValue: new VectorN(new Float32Array(0)),
    };
    const boneCompressedInfoInfo = {
      semantic: 'boneCompressedInfo',
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      soloDatum: true,
      stage: ShaderType.VertexShader,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isInternalSetting: true,
      initialValue: Vector4.zero(),
    };
    const skeletalComponentSIDInfo = {
      semantic: 'skinningMode',
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Int,
      stage: ShaderType.VertexAndPixelShader,
      min: 0,
      max: 1,
      isInternalSetting: true,
      initialValue: Scalar.fromCopyNumber(-1),
    };
    if (Config.boneDataType === BoneDataType.Mat43x1) {
      this.__registerProperty(boneMatrixInfo, Config.maxSkeletonNumber);
    } else if (Config.boneDataType === BoneDataType.Vec4x2) {
      this.__registerProperty(boneTranslatePackedQuatInfo, Config.maxSkeletonNumber);
      this.__registerProperty(boneScalePackedQuatInfo, Config.maxSkeletonNumber);
    } else if (Config.boneDataType === BoneDataType.Vec4x2Old) {
      this.__registerProperty(boneQuaternionInfo, Config.maxSkeletonNumber);
      this.__registerProperty(boneTranslateScaleInfo, Config.maxSkeletonNumber);
    } else if (Config.boneDataType === BoneDataType.Vec4x1) {
      this.__registerProperty(boneTranslateScaleInfo, Config.maxSkeletonNumber);
      this.__registerProperty(boneCompressedChunkInfo, Config.maxSkeletonNumber);
      this.__registerProperty(boneCompressedInfoInfo, 1);
      this.takeOne('boneCompressedInfo');
    }
    this.__registerProperty(skeletalComponentSIDInfo, 1);
    this.takeOne('skinningMode');

    // Lighting
    const lightPositionInfo = {
      semantic: 'lightPosition',
      compositionType: CompositionType.Vec3Array,
      componentType: ComponentType.Float,
      stage: ShaderType.VertexAndPixelShader,
      arrayLength: Config.maxLightNumber,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      isInternalSetting: true,
      initialValue: new VectorN(new Float32Array(Config.maxLightNumber)),
    };
    const lightDirectionInfo = {
      semantic: 'lightDirection',
      compositionType: CompositionType.Vec3Array,
      componentType: ComponentType.Float,
      stage: ShaderType.PixelShader,
      arrayLength: Config.maxLightNumber,
      min: -1,
      max: 1,
      isInternalSetting: true,
      initialValue: new VectorN(new Float32Array(Config.maxLightNumber)),
    };
    const lightIntensityInfo = {
      semantic: 'lightIntensity',
      compositionType: CompositionType.Vec3Array,
      componentType: ComponentType.Float,
      stage: ShaderType.PixelShader,
      arrayLength: Config.maxLightNumber,
      min: 0,
      max: 10,
      isInternalSetting: true,
      initialValue: new VectorN(new Float32Array(Config.maxLightNumber)),
    };
    const lightPropertyInfo = {
      semantic: 'lightProperty',
      compositionType: CompositionType.Vec4Array,
      componentType: ComponentType.Float,
      stage: ShaderType.PixelShader,
      arrayLength: Config.maxLightNumber,
      min: 0,
      max: 10,
      isInternalSetting: true,
      initialValue: new VectorN(new Float32Array(Config.maxLightNumber)),
    };
    this.__registerProperty(lightPositionInfo, 1);
    this.__registerProperty(lightDirectionInfo, 1);
    this.__registerProperty(lightIntensityInfo, 1);
    this.__registerProperty(lightPropertyInfo, 1);
    this.takeOne('lightDirection');
    this.takeOne('lightIntensity');
    this.takeOne('lightPosition');
    this.takeOne('lightProperty');

    const lightNumberInfo = {
      semantic: 'lightNumber',
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Int,
      stage: ShaderType.VertexAndPixelShader,
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
      isInternalSetting: true,
      initialValue: Scalar.fromCopyNumber(0),
    };
    this.__registerProperty(lightNumberInfo, 1);
    this.takeOne('lightNumber');

    // BackBufferTextureSize
    const backBufferTextureSize = {
      semantic: 'backBufferTextureSize',
      compositionType: CompositionType.Vec2,
      componentType: ComponentType.Float,
      stage: ShaderType.PixelShader,
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
      isInternalSetting: true,
      needUniformInDataTextureMode: true,
      initialValue: Vector2.fromCopy2(0, 0),
    };
    this.__registerProperty(backBufferTextureSize, 1);
    this.takeOne('backBufferTextureSize');

    // VrState
    const vrState = {
      semantic: 'vrState',
      compositionType: CompositionType.Vec2,
      componentType: ComponentType.Int,
      stage: ShaderType.PixelShader,
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
      isInternalSetting: true,
      needUniformInDataTextureMode: true,
      initialValue: Vector2.fromCopy2(0, 0),
      // x: 0: not vr, 1: vr
      // y: 0: left eye, 1: right eye
    };
    this.__registerProperty(vrState, 1);
    this.takeOne('vrState');

    // Time
    const timeInfo = {
      semantic: 'time',
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Float,
      stage: ShaderType.VertexAndPixelShader,
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
      isInternalSetting: true,
      initialValue: Scalar.fromCopyNumber(0),
    };
    this.__registerProperty(timeInfo, 1);
    this.takeOne('time');
  }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new GlobalDataRepository();
    }
    return this.__instance;
  }

  private __registerProperty(semanticInfo: ShaderSemanticsInfo, maxCount: Count): void {
    const buffer = MemoryManager.getInstance().createOrGetBuffer(BufferUse.GPUInstanceData);

    const alignedByteLength = calcAlignedByteLength(semanticInfo);

    const bufferView = buffer
      .takeBufferView({
        byteLengthToNeed: alignedByteLength * maxCount,
        byteStride: 0,
      })
      .unwrapForce();

    let maxArrayLength = semanticInfo.arrayLength;
    if (CompositionType.isArray(semanticInfo.compositionType) && maxArrayLength == null) {
      maxArrayLength = 100;
    }

    const accessor = bufferView
      .takeAccessor({
        compositionType: semanticInfo.compositionType,
        componentType: ComponentType.Float,
        count: maxCount,
        byteStride: alignedByteLength,
        arrayLength: maxArrayLength,
      })
      .unwrapForce();

    const globalPropertyStruct: GlobalPropertyStruct = {
      shaderSemanticsInfo: semanticInfo,
      values: [],
      maxCount: maxCount,
      accessor: accessor,
    };

    this.__fields.set(semanticInfo.semantic, globalPropertyStruct);
  }

  public takeOne(shaderSemantic: ShaderSemanticsName): any {
    const globalPropertyStruct = this.__fields.get(shaderSemantic);
    if (globalPropertyStruct) {
      const semanticInfo = globalPropertyStruct.shaderSemanticsInfo;
      const typedArray = globalPropertyStruct.accessor.takeOne() as Float32Array;
      const countIndex = globalPropertyStruct.values.length;
      const valueObj = MathClassUtil.initWithFloat32Array(
        semanticInfo.initialValue,
        typedArray,
      );
      globalPropertyStruct.values[countIndex] = valueObj;
      return valueObj;
    }
    return void 0;
  }

  public setValue(shaderSemantic: ShaderSemanticsName, countIndex: Index, value: any): void {
    const globalPropertyStruct = this.__fields.get(shaderSemantic);
    if (globalPropertyStruct) {
      const valueObj = globalPropertyStruct.values[countIndex];
      MathClassUtil._setForce(valueObj, value);
    }
  }

  public getValue(shaderSemantic: ShaderSemanticsName, countIndex: Index): any {
    const globalPropertyStruct = this.__fields.get(shaderSemantic);
    if (globalPropertyStruct) {
      const valueObj = globalPropertyStruct.values[countIndex];
      return valueObj;
    }
    return void 0;
  }

  getGlobalPropertyStruct(propertyName: ShaderSemanticsName) {
    return this.__fields.get(propertyName);
  }

  public getGlobalProperties(): GlobalPropertyStruct[] {
    return Array.from(this.__fields.values());
  }

  _setUniformLocationsForUniformModeOnly(shaderProgramUid: CGAPIResourceHandle) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const semanticsInfoArray: ShaderSemanticsInfo[] = [];
    this.__fields.forEach((globalPropertyStruct: GlobalPropertyStruct, key) => {
      const semanticInfo = globalPropertyStruct.shaderSemanticsInfo;
      semanticsInfoArray.push(semanticInfo);
    });

    webglResourceRepository.setupUniformLocations(shaderProgramUid, semanticsInfoArray, true);
  }

  _setUniformLocationsForDataTextureModeOnly(shaderProgramUid: CGAPIResourceHandle) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const semanticsInfoArray: ShaderSemanticsInfo[] = [];
    this.__fields.forEach((globalPropertyStruct: GlobalPropertyStruct, key) => {
      const semanticInfo = globalPropertyStruct.shaderSemanticsInfo;
      if (semanticInfo.needUniformInDataTextureMode) {
        semanticsInfoArray.push(semanticInfo);
      }
    });

    webglResourceRepository.setupUniformLocations(shaderProgramUid, semanticsInfoArray, true);
  }

  setUniformValues(shaderProgram: WebGLProgram) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    this.__fields.forEach((globalPropertyStruct: GlobalPropertyStruct, key) => {
      const info = globalPropertyStruct.shaderSemanticsInfo;
      const values = globalPropertyStruct.values;
      for (let i = 0; i < values.length; i++) {
        webglResourceRepository.setUniformValue(shaderProgram, info.semantic, true, values[i]);
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

  getLocationOffsetOfProperty(propertyName: ShaderSemanticsName): IndexOf16Bytes {
    const globalPropertyStruct = this.__fields.get(propertyName);
    if (globalPropertyStruct) {
      return globalPropertyStruct.accessor.byteOffsetInBuffer / 4 / 4;
    }
    return -1;
  }

  getCurrentDataNumberOfTheProperty(propertyName: ShaderSemanticsName) {
    const globalPropertyStruct = this.__fields.get(propertyName);
    if (globalPropertyStruct) {
      return globalPropertyStruct.values.length;
    }
    return 0;
  }

  _addPropertiesStr(
    vertexPropertiesStr: string,
    pixelPropertiesStr: string,
    propertySetter: getShaderPropertyFunc,
    isWebGL2: boolean
  ) {
    this.__fields.forEach((globalPropertyStruct: GlobalPropertyStruct) => {
      const info = globalPropertyStruct.shaderSemanticsInfo;
      if (
        info!.stage === ShaderType.VertexShader ||
        info!.stage === ShaderType.VertexAndPixelShader
      ) {
        vertexPropertiesStr += propertySetter('', info!, true, isWebGL2);
      }
      if (
        info!.stage === ShaderType.PixelShader ||
        info!.stage === ShaderType.VertexAndPixelShader
      ) {
        pixelPropertiesStr += propertySetter('', info!, true, isWebGL2);
      }
    });

    return [vertexPropertiesStr, pixelPropertiesStr];
  }
}
