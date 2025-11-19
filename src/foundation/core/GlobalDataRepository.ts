import { ProcessApproach, type ProcessApproachEnum } from '../../foundation/definitions/ProcessApproach';
import type { CGAPIResourceHandle, Count, Index, IndexOf16Bytes } from '../../types/CommonTypes';
import { WellKnownComponentTIDs } from '../components/WellKnownComponentTIDs';
import { BoneDataType } from '../definitions/BoneDataType';
import { BufferUse } from '../definitions/BufferUse';
import { ComponentType } from '../definitions/ComponentType';
import { CompositionType } from '../definitions/CompositionType';
import {
  ShaderSemantics,
  ShaderSemanticsEnum,
  ShaderSemanticsIndex,
  type ShaderSemanticsName,
  _getPropertyIndex2,
  type getShaderPropertyFunc,
} from '../definitions/ShaderSemantics';
import { type ShaderSemanticsInfo, calcAlignedByteLength } from '../definitions/ShaderSemanticsInfo';
import { ShaderType } from '../definitions/ShaderType';
import { MathClassUtil } from '../math/MathClassUtil';
import { MutableMatrix44 } from '../math/MutableMatrix44';
import { Scalar } from '../math/Scalar';
import { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';
import { Vector4 } from '../math/Vector4';
import { VectorN } from '../math/VectorN';
import type { Accessor } from '../memory/Accessor';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import { Config } from './Config';
import { MemoryManager } from './MemoryManager';

type GlobalPropertyStruct = {
  shaderSemanticsInfo: ShaderSemanticsInfo;
  values: any[];
  maxCount: Count;
  accessor: Accessor;
};

/**
 * The repository class that manages global data used throughout the rendering pipeline.
 * This singleton class handles global properties such as camera matrices, lighting data,
 * bone transformations for skeletal animation, and other shared rendering state.
 */
export class GlobalDataRepository {
  private static __instance: GlobalDataRepository;
  private __fields: Map<ShaderSemanticsName, GlobalPropertyStruct> = new Map();

  private constructor() {}

  /**
   * Initializes the GlobalDataRepository with all required global properties.
   * Sets up data structures for camera matrices, lighting, skeletal animation,
   * and other rendering parameters based on the specified process approach.
   *
   * @param approach - The processing approach that determines
   *                   how data is organized and accessed in shaders
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

    const maxSkeletalBoneNumber = ProcessApproach.isUniformApproach(approach)
      ? Config.maxSkeletalBoneNumberForUniformMode
      : Config.maxSkeletalBoneNumber;

    // Skinning
    if (Config.boneDataType === BoneDataType.Vec4x2Old) {
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
      this.__registerProperty(boneQuaternionInfo, Config.maxSkeletonNumber);
      this.__registerProperty(boneTranslateScaleInfo, Config.maxSkeletonNumber);
    } else if (Config.boneDataType === BoneDataType.Vec4x1) {
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
      this.__registerProperty(boneTranslateScaleInfo, Config.maxSkeletonNumber);
      this.__registerProperty(boneCompressedChunkInfo, Config.maxSkeletonNumber);
      this.__registerProperty(boneCompressedInfoInfo, 1);
      this.takeOne('boneCompressedInfo');
    }
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
    this.__registerProperty(skeletalComponentSIDInfo, 1);
    this.takeOne('skinningMode');

    // Lighting
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

  /**
   * Returns the singleton instance of GlobalDataRepository.
   * Creates a new instance if it doesn't exist yet.
   *
   * @returns The singleton instance of GlobalDataRepository
   */
  static getInstance() {
    if (!this.__instance) {
      this.__instance = new GlobalDataRepository();
    }
    return this.__instance;
  }

  /**
   * Registers a new global property with its semantic information and maximum count.
   * Creates the necessary buffer memory allocation and accessor for the property.
   *
   * @param semanticInfo - The shader semantic information defining the property structure
   * @param maxCount - The maximum number of instances this property can have
   * @private
   */
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

  /**
   * Allocates and returns a new instance of the specified global property.
   * Initializes the property with its default value and adds it to the internal tracking.
   *
   * @param shaderSemantic - The name of the shader semantic property to allocate
   * @returns The newly allocated property value object, or undefined if the property doesn't exist
   */
  public takeOne(shaderSemantic: ShaderSemanticsName): any {
    const globalPropertyStruct = this.__fields.get(shaderSemantic);
    if (globalPropertyStruct) {
      const semanticInfo = globalPropertyStruct.shaderSemanticsInfo;
      const typedArray = globalPropertyStruct.accessor.takeOne() as Float32Array;
      const countIndex = globalPropertyStruct.values.length;
      const valueObj = MathClassUtil.initWithFloat32Array(semanticInfo.initialValue, typedArray);
      globalPropertyStruct.values[countIndex] = valueObj;
      return valueObj;
    }
    return void 0;
  }

  /**
   * Sets the value of a specific instance of a global property.
   * Updates the underlying memory buffer with the new value.
   *
   * @param shaderSemantic - The name of the shader semantic property to update
   * @param countIndex - The index of the specific instance to update
   * @param value - The new value to set for this property instance
   */
  public setValue(shaderSemantic: ShaderSemanticsName, countIndex: Index, value: any): void {
    const globalPropertyStruct = this.__fields.get(shaderSemantic);
    if (globalPropertyStruct) {
      const valueObj = globalPropertyStruct.values[countIndex];
      MathClassUtil._setForce(valueObj, value);
    }
  }

  /**
   * Retrieves the value of a specific instance of a global property.
   *
   * @param shaderSemantic - The name of the shader semantic property to retrieve
   * @param countIndex - The index of the specific instance to retrieve
   * @returns The value object for the specified property instance, or undefined if not found
   */
  public getValue(shaderSemantic: ShaderSemanticsName, countIndex: Index): any {
    const globalPropertyStruct = this.__fields.get(shaderSemantic);
    if (globalPropertyStruct) {
      const valueObj = globalPropertyStruct.values[countIndex];
      return valueObj;
    }
    return void 0;
  }

  /**
   * Sets up uniform locations for all global properties when using uniform mode.
   * This is used internally by the WebGL resource repository for shader program setup.
   *
   * @param shaderProgramUid - The unique identifier of the shader program
   * @internal
   */
  _setUniformLocationsForUniformModeOnly(shaderProgramUid: CGAPIResourceHandle) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const semanticsInfoArray: ShaderSemanticsInfo[] = [];
    this.__fields.forEach((globalPropertyStruct: GlobalPropertyStruct) => {
      const semanticInfo = globalPropertyStruct.shaderSemanticsInfo;
      semanticsInfoArray.push(semanticInfo);
    });

    webglResourceRepository.setupUniformLocations(shaderProgramUid, semanticsInfoArray, true);
  }

  /**
   * Sets up uniform locations for properties that need uniform access in data texture mode.
   * Only sets up uniforms for properties marked with needUniformInDataTextureMode flag.
   *
   * @param shaderProgramUid - The unique identifier of the shader program
   * @internal
   */
  _setUniformLocationsForDataTextureModeOnly(shaderProgramUid: CGAPIResourceHandle) {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const semanticsInfoArray: ShaderSemanticsInfo[] = [];
    this.__fields.forEach((globalPropertyStruct: GlobalPropertyStruct) => {
      const semanticInfo = globalPropertyStruct.shaderSemanticsInfo;
      if (semanticInfo.needUniformInDataTextureMode) {
        semanticsInfoArray.push(semanticInfo);
      }
    });

    webglResourceRepository.setupUniformLocations(shaderProgramUid, semanticsInfoArray, true);
  }

  // getLocationOffsetOfProperty(propertyIndex: Index, countIndex: Index) {
  //   const globalPropertyStruct = this.__fields.get(propertyIndex);
  //   if (globalPropertyStruct) {
  //     const value = globalPropertyStruct.values[countIndex];
  //     return (value._v as Float32Array).byteOffset / 4 / 4;
  //   }
  //   return void 0;
  // }

  /**
   * Gets the memory location offset of a global property in 16-byte aligned units.
   * This is used for data texture mode to determine where properties are stored in memory.
   *
   * @param propertyName - The name of the property to get the offset for
   * @returns The offset in 16-byte units, or -1 if the property is not found
   */
  getLocationOffsetOfProperty(propertyName: ShaderSemanticsName): IndexOf16Bytes {
    const globalPropertyStruct = this.__fields.get(propertyName);
    if (globalPropertyStruct) {
      return globalPropertyStruct.accessor.byteOffsetInBuffer / 4 / 4;
    }
    return -1;
  }

  /**
   * Adds global property declarations to vertex and pixel shader code strings.
   * This method is used during shader compilation to inject the necessary uniform
   * declarations for all registered global properties.
   *
   * @param vertexPropertiesStr - The string to append vertex shader property declarations to
   * @param pixelPropertiesStr - The string to append pixel shader property declarations to
   * @param propertySetter - The function used to generate property declaration code
   * @param isWebGL2 - Whether the target is WebGL 2.0 (affects syntax generation)
   * @returns A tuple containing the updated vertex and pixel shader property strings
   * @internal
   */
  _addPropertiesStr(
    vertexPropertiesStr: string,
    pixelPropertiesStr: string,
    propertySetter: getShaderPropertyFunc,
    isWebGL2: boolean
  ) {
    this.__fields.forEach((globalPropertyStruct: GlobalPropertyStruct) => {
      const info = globalPropertyStruct.shaderSemanticsInfo;
      if (info!.stage === ShaderType.VertexShader || info!.stage === ShaderType.VertexAndPixelShader) {
        vertexPropertiesStr += propertySetter('', info!, true, isWebGL2);
      }
      if (info!.stage === ShaderType.PixelShader || info!.stage === ShaderType.VertexAndPixelShader) {
        pixelPropertiesStr += propertySetter('', info!, true, isWebGL2);
      }
    });

    return [vertexPropertiesStr, pixelPropertiesStr];
  }
}
