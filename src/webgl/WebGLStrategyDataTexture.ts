import { AnimationComponent } from '../foundation/components/Animation/AnimationComponent';
import { BlendShapeComponent } from '../foundation/components/BlendShape/BlendShapeComponent';
import { CameraComponent } from '../foundation/components/Camera/CameraComponent';
import { CameraControllerComponent } from '../foundation/components/CameraController/CameraControllerComponent';
import { LightComponent } from '../foundation/components/Light/LightComponent';
import { MeshComponent } from '../foundation/components/Mesh/MeshComponent';
import { MeshRendererComponent } from '../foundation/components/MeshRenderer/MeshRendererComponent';
import { SceneGraphComponent } from '../foundation/components/SceneGraph/SceneGraphComponent';
import { TransformComponent } from '../foundation/components/Transform/TransformComponent';
import { WellKnownComponentTIDs } from '../foundation/components/WellKnownComponentTIDs';
import { Component, type MemberInfo } from '../foundation/core/Component';
import { ComponentRepository } from '../foundation/core/ComponentRepository';
import { Config } from '../foundation/core/Config';
import { GlobalDataRepository } from '../foundation/core/GlobalDataRepository';
import { MemoryManager } from '../foundation/core/MemoryManager';
import { BufferUse, type BufferUseEnum } from '../foundation/definitions/BufferUse';
import { ComponentType, type ComponentTypeEnum } from '../foundation/definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../foundation/definitions/CompositionType';
import { PixelFormat } from '../foundation/definitions/PixelFormat';
import { ShaderSemantics, type ShaderSemanticsName } from '../foundation/definitions/ShaderSemantics';
import type { ShaderSemanticsInfo } from '../foundation/definitions/ShaderSemanticsInfo';
import { ShaderType, type ShaderTypeEnum } from '../foundation/definitions/ShaderType';
import { TextureFormat } from '../foundation/definitions/TextureFormat';
import { TextureParameter } from '../foundation/definitions/TextureParameter';
import { VertexAttribute } from '../foundation/definitions/VertexAttribute';
import type { Mesh } from '../foundation/geometry/Mesh';
import { Primitive } from '../foundation/geometry/Primitive';
import { Material } from '../foundation/materials/core/Material';
import { MaterialRepository } from '../foundation/materials/core/MaterialRepository';
import type { Vector2 } from '../foundation/math/Vector2';
import type { VectorN } from '../foundation/math/VectorN';
import type { Accessor } from '../foundation/memory/Accessor';
import type { Buffer } from '../foundation/memory/Buffer';
import { Is } from '../foundation/misc/Is';
import { Logger } from '../foundation/misc/Logger';
import { MiscUtil } from '../foundation/misc/MiscUtil';
import { CGAPIResourceRepository } from '../foundation/renderer/CGAPIResourceRepository';
import type { CGAPIStrategy } from '../foundation/renderer/CGAPIStrategy';
import type { RenderPass } from '../foundation/renderer/RenderPass';
import { isSkipDrawing } from '../foundation/renderer/RenderingCommonMethods';
import { ModuleManager } from '../foundation/system/ModuleManager';
import { SystemState } from '../foundation/system/SystemState';
import type {
  Byte,
  CGAPIResourceHandle,
  Count,
  Index,
  IndexOf4Bytes,
  IndexOf16Bytes,
  PrimitiveUID,
  WebGLResourceHandle,
} from '../types/CommonTypes';
import type { WebXRSystem } from '../xr/WebXRSystem';
import type { RnXR } from '../xr/main';
import type { WebGLContextWrapper } from './WebGLContextWrapper';
import { WebGLResourceRepository } from './WebGLResourceRepository';
import type { ShaderSources, WebGLStrategy } from './WebGLStrategy';
import WebGLStrategyCommonMethod, { setupShaderProgram } from './WebGLStrategyCommonMethod';
import type { RenderingArgWebGL } from './types/CommonTypes';

declare const spector: any;

/**
 * WebGL rendering strategy implementation that uses data textures for storing shader data.
 * This strategy stores uniform data in textures rather than traditional uniform variables,
 * enabling support for larger amounts of instance data and more efficient batch rendering.
 *
 * @remarks
 * This class implements both CGAPIStrategy and WebGLStrategy interfaces, providing
 * a complete rendering pipeline for WebGL with data texture optimization.
 * The strategy is particularly useful for rendering many instances with unique properties.
 */
export class WebGLStrategyDataTexture implements CGAPIStrategy, WebGLStrategy {
  private static __instance: WebGLStrategyDataTexture;
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private __dataTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __dataUBOUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __morphOffsetsUniformBufferUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __morphWeightsUniformBufferUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __lastShader: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __lastMaterial?: WeakRef<Material>;
  private __lastMaterialStateVersion = -1;
  private static __shaderProgram: WebGLProgram;
  private __lastRenderPassTickCount = -1;
  private __lightComponents?: LightComponent[];
  private static __globalDataRepository = GlobalDataRepository.getInstance();
  private static __currentComponentSIDs?: VectorN;
  public _totalSizeOfGPUShaderDataStorageExceptMorphData = 0;
  private static __isDebugOperationToDataTextureBufferDone = true;
  private static __webxrSystem: WebXRSystem;

  private __uniformMorphOffsetsTypedArray?: Uint32Array;
  private __uniformMorphWeightsTypedArray?: Float32Array;
  private __lastBlendShapeComponentsUpdateCountForWeights = -1;
  private __lastMorphMaxIndex = -1;
  private __lastMaterialsUpdateCount = -1;
  private __lastTransformComponentsUpdateCount = -1;
  private __lastSceneGraphComponentsUpdateCount = -1;
  private __lastCameraComponentsUpdateCount = -1;
  private __lastCameraControllerComponentsUpdateCount = -1;
  private __lastGpuInstanceDataBufferCount = -1;

  /**
   * Private constructor to enforce singleton pattern.
   */
  private constructor() {}

  /**
   * Initiates the dumping of the data texture buffer for debugging purposes.
   * This method flags the system to export the data texture buffer contents
   * on the next rendering cycle.
   *
   * @remarks
   * The dumped buffer will be downloaded as a binary file named 'Rhodonite_dataTextureBuffer.bin'.
   * This is useful for debugging shader data layout and content issues.
   */
  public static dumpDataTextureBuffer() {
    this.__isDebugOperationToDataTextureBufferDone = false;
  }

  /**
   * method definitions for component data access for data texture-based rendering.
   * Provides GLSL functions for accessing component data through data textures.
   * @param shaderType - The shader type (VertexShader or PixelShader)
   * @returns GLSL shader code string for the component data access method definitions
   */
  static __getComponentDataAccessMethodDefinitions_dataTexture(shaderType: ShaderTypeEnum) {
    let str = '';
    const memberInfo = Component.getMemberInfo();
    memberInfo.forEach((mapMemberNameMemberInfo, componentClass) => {
      mapMemberNameMemberInfo.forEach((memberInfo, memberName) => {
        if (memberInfo.shaderType !== shaderType && memberInfo.shaderType !== ShaderType.VertexAndPixelShader) {
          return;
        }
        const componentCountPerBufferView = Component.getComponentCountPerBufferView().get(componentClass) ?? 1;
        if (CompositionType.isArray(memberInfo.compositionType)) {
          processForArrayType(memberInfo, componentClass, memberName, componentCountPerBufferView);
        } else {
          processForNonArrayType(memberInfo, componentClass, memberName, componentCountPerBufferView);
        }
      });
    });

    if (shaderType === ShaderType.VertexShader) {
      const morphingStr = `

#ifdef RN_IS_VERTEX_SHADER
  #ifdef RN_IS_MORPHING
  vec3 get_position(float vertexId, vec3 basePosition, int blendShapeComponentSID) {
    vec3 position = basePosition;
    int scalar_idx = 3 * int(vertexId);
    for (int i=0; i<u_morphTargetNumber; i++) {
      int currentPrimitiveIdx = u_currentPrimitiveIdx;
      int idx = ${Config.maxMorphTargetNumber} * currentPrimitiveIdx + i;
      ivec4 offsets = uniformMorphOffsets.data[ idx / 4];
      int offsetPosition = offsets[idx % 4];

      int basePosIn4bytes = offsetPosition * 4 + scalar_idx;
      vec3 addPos = fetchVec3No16BytesAligned(basePosIn4bytes);

      int idx2 = ${Config.maxMorphTargetNumber} * blendShapeComponentSID + i;
      vec4 morphWeights = uniformMorphWeights.data[ idx2 / 4];
      float morphWeight = morphWeights[idx2 % 4];

      position += addPos * morphWeight;
    }

    return position;
  }
  #endif
#endif
`;

      str += morphingStr;
    }
    return str;

    function processForArrayType(
      memberInfo: MemberInfo,
      componentClass: typeof Component,
      memberName: string,
      componentCountPerBufferView: number
    ) {
      let typeStr = '';
      let fetchTypeStr = '';
      switch (memberInfo.compositionType) {
        case CompositionType.Vec4Array:
          typeStr = 'vec4';
          fetchTypeStr = 'fetchVec4';
          break;
        case CompositionType.Mat4Array:
          typeStr = 'mat4';
          fetchTypeStr = 'fetchMat4';
          break;
        case CompositionType.Mat4x3Array:
          typeStr = 'mat4x3';
          fetchTypeStr = 'fetchMat4x3';
          break;
        default:
          throw new Error(`Unsupported composition type: ${memberInfo.compositionType.str}`);
      }

      const locationOffsets_vec4_idx = Component.getLocationOffsetOfMemberOfComponent(componentClass, memberName);
      const vec4SizeOfProperty: IndexOf16Bytes = memberInfo.compositionType.getVec4SizeOfProperty();
      const arrayLengthMap = Component.getArrayLengthOfMember().get(componentClass)?.get(memberName) ?? new Map();
      const arrayLengthArray = Array.from(arrayLengthMap.values());
      if (arrayLengthArray.length === 0) {
        arrayLengthArray[0] = 0;
      }
      const arrayLengthArrayStr = `int arrayLengthArray[] = int[](${arrayLengthArray.join(', ')});`;
      const indexStr = `int index = indices[instanceIdOfBufferViews] + instanceIdInBufferView * ${vec4SizeOfProperty} * arrayLengthArray[int(instanceId)] + ${vec4SizeOfProperty} * idxOfArray;`; // vec4_idx
      let conversionStr = '';
      if (memberInfo.convertToBool) {
        conversionStr = 'return (value > 0.5) ? true : false;';
      }
      str += `
  ${memberInfo.convertToBool ? 'bool' : typeStr} get_${memberName}(float instanceId, int idxOfArray) {
    int instanceIdOfBufferViews = int(instanceId) / ${componentCountPerBufferView};
    int instanceIdInBufferView = int(instanceId) % ${componentCountPerBufferView};
    int indices[] = int[](${locationOffsets_vec4_idx.join(', ')});
    ${arrayLengthArrayStr}
    ${indexStr}
    ${typeStr} value = ${fetchTypeStr}(index);
    ${memberInfo.convertToBool ? conversionStr : 'return value;'}
  }
`;
    }
    function processForNonArrayType(
      memberInfo: MemberInfo,
      componentClass: typeof Component,
      memberName: string,
      componentCountPerBufferView: number
    ) {
      let typeStr = '';
      let fetchTypeStr = '';
      switch (memberInfo.compositionType) {
        case CompositionType.Mat4:
          typeStr = 'mat4';
          fetchTypeStr = 'fetchMat4';
          break;
        case CompositionType.Mat3:
          typeStr = 'mat3';
          fetchTypeStr = 'fetchMat3No16BytesAligned';
          break;
        case CompositionType.Vec4:
          typeStr = 'vec4';
          fetchTypeStr = 'fetchVec4';
          break;
        case CompositionType.Vec3:
          typeStr = 'vec3';
          fetchTypeStr = 'fetchVec3No16BytesAligned';
          break;
        case CompositionType.Scalar:
          typeStr = 'float';
          fetchTypeStr = 'fetchScalarNo16BytesAligned';
          break;
        default:
          throw new Error(`Unsupported composition type: ${memberInfo.compositionType.str}`);
      }

      const locationOffsets_vec4_idx = Component.getLocationOffsetOfMemberOfComponent(componentClass, memberName);
      let indexStr = '';
      switch (memberInfo.compositionType) {
        case CompositionType.Mat4:
          indexStr = 'int index = indices[instanceIdOfBufferViews] + 4 * instanceIdInBufferView;'; // vec4_idx
          break;
        case CompositionType.Mat3:
          indexStr = 'int index = indices[instanceIdOfBufferViews] * 4 + 9 * instanceIdInBufferView;'; // scalar_idx
          break;
        case CompositionType.Vec4:
          indexStr = 'int index = indices[instanceIdOfBufferViews] + 1 * instanceIdInBufferView;'; // vec4_idx
          break;
        case CompositionType.Vec3:
          indexStr = 'int index = indices[instanceIdOfBufferViews] * 4 + 3 * instanceIdInBufferView;'; // scalar_idx
          break;
        case CompositionType.Scalar:
          indexStr = 'int index = indices[instanceIdOfBufferViews] * 4 + 1 * instanceIdInBufferView;'; // scalar_idx
          break;
        default:
          throw new Error(`Unsupported composition type: ${memberInfo.compositionType.str}`);
      }
      let conversionStr = '';
      if (memberInfo.convertToBool) {
        conversionStr = 'return (value > 0.5) ? true : false;';
      }
      str += `
  ${memberInfo.convertToBool ? 'bool' : typeStr} get_${memberName}(float instanceId) {
    int instanceIdOfBufferViews = int(instanceId) / ${componentCountPerBufferView};
    int instanceIdInBufferView = int(instanceId) % ${componentCountPerBufferView};
    int indices[] = int[](${locationOffsets_vec4_idx.join(', ')});
    ${indexStr}
    ${typeStr} value = ${fetchTypeStr}(index);
    ${memberInfo.convertToBool ? conversionStr : 'return value;'}
  }
`;
    }
  }

  /**
   * Sets up a shader program for the specified material and primitive.
   * This method creates and configures the complete shader program including
   * uniform locations and data texture-specific shader definitions.
   *
   * @param material - The material that requires shader setup
   * @param primitive - The primitive geometry that will use this shader
   * @returns The resource handle of the created or retrieved shader program
   *
   * @remarks
   * This method handles:
   * - Creating the WebGL shader program with data texture method definitions
   * - Setting up basic uniform locations for the material
   * - Configuring material node uniform locations
   * - Setting up additional uniform locations for point sprites
   * - Configuring data texture-specific uniform locations
   */
  public setupShaderForMaterial(material: Material, primitive: Primitive): CGAPIResourceHandle {
    const webglResourceRepository = WebGLResourceRepository.getInstance();
    const _glw = webglResourceRepository.currentWebGLContextWrapper!;

    const [programUid, newOne] = material._createProgramWebGL(
      WebGLStrategyDataTexture.__getComponentDataAccessMethodDefinitions_dataTexture(ShaderType.VertexShader),
      WebGLStrategyDataTexture.__getComponentDataAccessMethodDefinitions_dataTexture(ShaderType.PixelShader),
      WebGLStrategyDataTexture.__getShaderPropertyOfGlobalDataRepository,
      WebGLStrategyDataTexture.__getShaderPropertyOfMaterial,
      primitive
    );

    if (newOne) {
      material._setupBasicUniformsLocations(primitive);

      material._setUniformLocationsOfMaterialNodes(false, primitive);

      material._setupAdditionalUniformLocations(
        WebGLStrategyCommonMethod.getPointSpriteShaderSemanticsInfoArray(),
        false,
        primitive
      );

      WebGLStrategyDataTexture.__globalDataRepository._setUniformLocationsForDataTextureModeOnly(
        material.getShaderProgramUid(primitive)
      );

      webglResourceRepository.setUniformBlockBindingForMorphOffsetsAndWeights(
        programUid,
        this.__morphOffsetsUniformBufferUid,
        this.__morphWeightsUniformBufferUid
      );
    }

    return programUid;
  }

  /**
   * Re-establishes a shader program for a material using updated shader sources.
   * This method is typically called by debugging tools like Spector.js when
   * shader sources are modified at runtime for inspection or debugging.
   *
   * @param material - The material whose shader needs to be re-setup
   * @param primitive - The primitive geometry associated with the shader
   * @param updatedShaderSources - The modified shader source code
   * @param onError - Callback function to handle compilation or linking errors
   * @returns The resource handle of the updated shader program, or InvalidCGAPIResourceUid on failure
   *
   * @remarks
   * This method performs the same setup as setupShaderForMaterial but uses
   * externally provided shader sources instead of generating them. It's primarily
   * used for debugging workflows where shaders are modified at runtime.
   */
  public _reSetupShaderForMaterialBySpector(
    material: Material,
    primitive: Primitive,
    updatedShaderSources: ShaderSources,
    onError: (message: string) => void
  ): CGAPIResourceHandle {
    const [programUid, newOne] = material._createProgramByUpdatedSources(updatedShaderSources, primitive, onError);
    if (programUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      return programUid;
    }

    if (newOne) {
      material._setupBasicUniformsLocations(primitive);

      material._setUniformLocationsOfMaterialNodes(false, primitive);

      material._setupAdditionalUniformLocations(
        WebGLStrategyCommonMethod.getPointSpriteShaderSemanticsInfoArray(),
        false,
        primitive
      );
    }

    WebGLStrategyDataTexture.__globalDataRepository._setUniformLocationsForDataTextureModeOnly(
      material.getShaderProgramUid(primitive)
    );

    return programUid;
  }

  /**
   * Generates GLSL shader code for accessing global properties.
   * This method creates shader functions that can fetch data from either data textures
   * or uniform variables, depending on the property type and rendering configuration.
   *
   * @param info - Detailed information about the shader semantic property
   * @returns GLSL shader code string for the property accessor function
   *
   * @remarks
   * This method handles different data types including:
   * - Scalars, vectors, and matrices of various sizes
   * - Array types with proper indexing
   * - Texture samplers
   * - Properties that require explicit uniform variables
   * The generated code optimizes data access based on the property layout in data textures.
   */
  private static __getShaderPropertyOfGlobalDataRepository(info: ShaderSemanticsInfo) {
    const returnType = info.compositionType.getGlslStr(info.componentType);

    let indexStr: string;

    const isTexture = CompositionType.isTexture(info.compositionType);

    const methodName = info.semantic.replace('.', '_');

    // definition of uniform variable for texture sampler or what must be explicitly uniform variabl)
    let varDef = '';
    const varType = info.compositionType.getGlslStr(info.componentType);
    let varIndexStr = '';
    if (info.arrayLength) {
      varIndexStr = `[${info.arrayLength}]`;
    }
    if (info.needUniformInDataTextureMode || isTexture) {
      varDef = `  uniform ${varType} u_${methodName}${varIndexStr};\n`;
    }

    // inner contents of 'get_' shader function
    const vec4SizeOfProperty: IndexOf16Bytes = info.compositionType.getVec4SizeOfProperty();
    // for non-`index` property (this is general case)
    const scalarSizeOfProperty: IndexOf4Bytes = info.compositionType.getNumberOfComponents();
    const offsetOfProperty: IndexOf16Bytes = WebGLStrategyDataTexture.getOffsetOfPropertyOfGlobalDataRepository(
      info.semantic
    );

    if (offsetOfProperty === -1) {
      Logger.error('Could not get the location offset of the property.');
    }

    let instanceSize = vec4SizeOfProperty;
    indexStr = `int vec4_idx = ${offsetOfProperty} + ${instanceSize} * instanceId;\n`;
    if (CompositionType.isArray(info.compositionType)) {
      instanceSize = vec4SizeOfProperty * (info.arrayLength ?? 1);
      const paddedAsVec4 = Math.ceil(scalarSizeOfProperty / 4) * 4;
      const instanceSizeInScalar = paddedAsVec4 * (info.arrayLength ?? 1);
      indexStr = `int vec4_idx = ${offsetOfProperty} + ${instanceSize} * instanceId + ${vec4SizeOfProperty} * idxOfArray;\n`;
      indexStr += `int scalar_idx = ${
        // IndexOf4Bytes
        offsetOfProperty * 4 // IndexOf16bytes to IndexOf4Bytes
      } + ${instanceSizeInScalar} * instanceId + ${scalarSizeOfProperty} * idxOfArray;\n`;
    }

    let intStr = '';
    if (info.componentType === ComponentType.Int && info.compositionType !== CompositionType.Scalar) {
      intStr = 'i';
    }

    let firstPartOfInnerFunc = '';
    if (!isTexture && !info.needUniformInDataTextureMode) {
      firstPartOfInnerFunc += `
${returnType} get_${methodName}(highp float _instanceId, const int idxOfArray) {
  int instanceId = int(_instanceId);
  ${indexStr}
  `;

      let str = `${varDef}\n${firstPartOfInnerFunc}`;

      switch (info.compositionType) {
        case CompositionType.Vec4:
        case CompositionType.Vec4Array:
          str += '        highp vec4 val = fetchElement(vec4_idx);\n';
          break;
        case CompositionType.Vec3:
          str += '        vec4 col0 = fetchElement(vec4_idx);\n';
          str += `        highp ${intStr}vec3 val = ${intStr}vec3(col0.xyz);`;
          break;
        case CompositionType.Vec3Array:
          str += '        vec3 val = fetchVec3No16BytesAligned(scalar_idx);\n';
          break;
        case CompositionType.Vec2:
          str += '        highp vec4 col0 = fetchElement(vec4_idx);\n';
          str += `        highp ${intStr}vec2 val = ${intStr}vec2(col0.xy);`;
          break;
        case CompositionType.Vec2Array:
          str += '        highp vec2 val = fetchVec2No16BytesAligned(scalar_idx);\n';
          break;
        case CompositionType.Scalar:
          str += '        vec4 col0 = fetchElement(vec4_idx);\n';
          if (info.componentType === ComponentType.Int) {
            str += '        int val = int(col0.x);';
          } else if (info.componentType === ComponentType.Bool) {
            str += '        bool val = bool(col0.x);';
          } else {
            str += '       float val = col0.x;';
          }
          break;
        case CompositionType.ScalarArray:
          str += '        float col0 = fetchScalarNo16BytesAligned(scalar_idx);\n';
          if (info.componentType === ComponentType.Int) {
            str += '        int val = int(col0);';
          } else if (info.componentType === ComponentType.Bool) {
            str += '        bool val = bool(col0);';
          } else {
            str += '       float val = col0;';
          }
          break;
        case CompositionType.Mat4:
          str += '        mat4 val = fetchMat4(vec4_idx);\n';
          break;
        case CompositionType.Mat4Array:
          str += '        mat4 val = fetchMat4(vec4_idx);\n';
          break;
        case CompositionType.Mat3:
          str += '        mat3 val = fetchMat3(vec4_idx);\n';
          break;
        case CompositionType.Mat3Array:
          str += '        mat3 val = fetchMat3No16BytesAligned(scalar_idx);\n';
          break;
        case CompositionType.Mat2:
          str += '        mat2 val = fetchMat2(vec4_idx);\n';
          break;
        case CompositionType.Mat2Array:
          str += '        mat2 val = fetchMat2No16BytesAligned(scalar_idx);\n';
          break;
        case CompositionType.Mat4x3Array:
          str += '        mat4x3 val = fetchMat4x3(vec4_idx);\n';
          break;
        default:
          // Logger.error('unknown composition type', info.compositionType.str, memberName);
          str += '';
      }
      str += `
  return val;
}
`;
      return str;
    }
    if (!isTexture && info.needUniformInDataTextureMode) {
      let varIndexStr = '';
      if (info.arrayLength) {
        varIndexStr = '[idxOfArray]';
      }
      const str = `${varDef}
${returnType} get_${methodName}(highp float _instanceId, const int idxOfArray) {
  return u_${methodName}${varIndexStr};
}
`;
      return str;
    }
    return varDef;
  }

  /**
   * Generates GLSL shader code for accessing material properties.
   * This method creates shader functions that can fetch data from either data textures
   * or uniform variables, depending on the property type and rendering configuration.
   *
   * @param info - Detailed information about the shader semantic property
   * @returns GLSL shader code string for the property accessor function
   *
   * @remarks
   * This method handles different data types including:
   * - Scalars, vectors, and matrices of various sizes
   * - Array types with proper indexing
   * - Texture samplers
   * - Properties that require explicit uniform variables
   * The generated code optimizes data access based on the property layout in data textures.
   */
  private static __getShaderPropertyOfMaterial(materialTypeName: string, info: ShaderSemanticsInfo) {
    const returnType = info.compositionType.getGlslStr(info.componentType);

    let indexStr: string;

    const isTexture = CompositionType.isTexture(info.compositionType);

    const methodName = info.semantic.replace('.', '_');

    // definition of uniform variable for texture sampler or what must be explicitly uniform variabl)
    let varDef = '';
    const varType = info.compositionType.getGlslStr(info.componentType);
    let varIndexStr = '';
    if (info.arrayLength) {
      varIndexStr = `[${info.arrayLength}]`;
    }
    if (info.needUniformInDataTextureMode || isTexture) {
      varDef = `  uniform ${varType} u_${methodName}${varIndexStr};\n`;
    }

    // inner contents of 'get_' shader function
    const vec4SizeOfProperty: IndexOf16Bytes = info.compositionType.getVec4SizeOfProperty();
    // for non-`index` property (this is general case)
    const scalarSizeOfProperty: IndexOf4Bytes = info.compositionType.getNumberOfComponents();
    const offsetOfProperty: IndexOf16Bytes[] = WebGLStrategyDataTexture.getOffsetOfPropertyOfMaterial(
      info.semantic,
      materialTypeName
    );
    const materialCountPerBufferView = MaterialRepository._getMaterialCountPerBufferView(materialTypeName)!;

    const offsetStr = `int offsets[] = int[](${offsetOfProperty.join(', ')});`;

    let instanceSize = vec4SizeOfProperty;
    indexStr = `int vec4_idx = offsets[instanceIdOfBufferViews] + ${instanceSize} * instanceIdInBufferView;\n`;
    if (CompositionType.isArray(info.compositionType)) {
      instanceSize = vec4SizeOfProperty * (info.arrayLength ?? 1);
      const paddedAsVec4 = Math.ceil(scalarSizeOfProperty / 4) * 4;
      const instanceSizeInScalar = paddedAsVec4 * (info.arrayLength ?? 1);
      indexStr = `int vec4_idx = offsets[instanceIdOfBufferViews] + ${instanceSize} * instanceIdInBufferView + ${vec4SizeOfProperty} * idxOfArray;\n`;
      indexStr += `int scalar_idx = offsets[instanceIdOfBufferViews] * 4 + ${instanceSizeInScalar} * instanceIdInBufferView + ${scalarSizeOfProperty} * idxOfArray;\n`;
    }

    let intStr = '';
    if (info.componentType === ComponentType.Int && info.compositionType !== CompositionType.Scalar) {
      intStr = 'i';
    }

    let firstPartOfInnerFunc = '';
    if (!isTexture && !info.needUniformInDataTextureMode) {
      firstPartOfInnerFunc += `
${returnType} get_${methodName}(highp float _instanceId, const int idxOfArray) {
  int instanceId = int(_instanceId);
  int instanceIdOfBufferViews = int(instanceId) / ${materialCountPerBufferView};
  int instanceIdInBufferView = int(instanceId) % ${materialCountPerBufferView};
  ${offsetStr}
  ${indexStr}
  `;

      let str = `${varDef}\n${firstPartOfInnerFunc}`;

      switch (info.compositionType) {
        case CompositionType.Vec4:
        case CompositionType.Vec4Array:
          str += '        highp vec4 val = fetchElement(vec4_idx);\n';
          break;
        case CompositionType.Vec3:
          str += '        vec4 col0 = fetchElement(vec4_idx);\n';
          str += `        highp ${intStr}vec3 val = ${intStr}vec3(col0.xyz);`;
          break;
        case CompositionType.Vec3Array:
          str += '        vec3 val = fetchVec3No16BytesAligned(scalar_idx);\n';
          break;
        case CompositionType.Vec2:
          str += '        highp vec4 col0 = fetchElement(vec4_idx);\n';
          str += `        highp ${intStr}vec2 val = ${intStr}vec2(col0.xy);`;
          break;
        case CompositionType.Vec2Array:
          str += '        highp vec2 val = fetchVec2No16BytesAligned(scalar_idx);\n';
          break;
        case CompositionType.Scalar:
          str += '        vec4 col0 = fetchElement(vec4_idx);\n';
          if (info.componentType === ComponentType.Int) {
            str += '        int val = int(col0.x);';
          } else if (info.componentType === ComponentType.Bool) {
            str += '        bool val = bool(col0.x);';
          } else {
            str += '       float val = col0.x;';
          }
          break;
        case CompositionType.ScalarArray:
          str += '        float col0 = fetchScalarNo16BytesAligned(scalar_idx);\n';
          if (info.componentType === ComponentType.Int) {
            str += '        int val = int(col0);';
          } else if (info.componentType === ComponentType.Bool) {
            str += '        bool val = bool(col0);';
          } else {
            str += '       float val = col0;';
          }
          break;
        case CompositionType.Mat4:
          str += '        mat4 val = fetchMat4(vec4_idx);\n';
          break;
        case CompositionType.Mat4Array:
          str += '        mat4 val = fetchMat4(vec4_idx);\n';
          break;
        case CompositionType.Mat3:
          str += '        mat3 val = fetchMat3(vec4_idx);\n';
          break;
        case CompositionType.Mat3Array:
          str += '        mat3 val = fetchMat3No16BytesAligned(scalar_idx);\n';
          break;
        case CompositionType.Mat2:
          str += '        mat2 val = fetchMat2(vec4_idx);\n';
          break;
        case CompositionType.Mat2Array:
          str += '        mat2 val = fetchMat2No16BytesAligned(scalar_idx);\n';
          break;
        case CompositionType.Mat4x3Array:
          str += '        mat4x3 val = fetchMat4x3(vec4_idx);\n';
          break;
        default:
          // Logger.error('unknown composition type', info.compositionType.str, memberName);
          str += '';
      }
      str += `
  return val;
}
`;
      return str;
    }
    if (!isTexture && info.needUniformInDataTextureMode) {
      let varIndexStr = '';
      if (info.arrayLength) {
        varIndexStr = '[idxOfArray]';
      }
      const str = `${varDef}
${returnType} get_${methodName}(highp float _instanceId, const int idxOfArray) {
  return u_${methodName}${varIndexStr};
}
`;
      return str;
    }
    return varDef;
  }

  /**
   * Retrieves the offset position of a property within the shader data layout.
   * This method calculates where a specific property is located in either the
   * global data repository or material-specific data storage.
   *
   * @param isGlobalData - Whether to look in global data or material-specific data
   * @param propertyName - The semantic name of the property to locate
   * @param materialTypeName - The name of the material type (used for material-specific properties)
   * @returns The offset position of the property in the data layout, or -1 if not found
   *
   * @remarks
   * This method is essential for generating correct shader code that can access
   * properties from the data texture at the right memory locations.
   */
  private static getOffsetOfPropertyOfMaterial(propertyName: ShaderSemanticsName, materialTypeName: string) {
    const dataBeginPos = MaterialRepository.getLocationOffsetOfMemberOfMaterial(materialTypeName, propertyName);
    return dataBeginPos;
  }

  /**
   * Retrieves the offset position of a property within the global data repository.
   * This method calculates where a specific property is located in the global data repository.
   *
   * @param propertyName - The semantic name of the property to locate
   * @returns The offset position of the property in the global data repository, or -1 if not found
   *
   * @remarks
   * This method is essential for generating correct shader code that can access
   * properties from the data texture at the right memory locations.
   */
  private static getOffsetOfPropertyOfGlobalDataRepository(propertyName: ShaderSemanticsName) {
    const globalDataRepository = GlobalDataRepository.getInstance();
    const dataBeginPos = globalDataRepository.getLocationOffsetOfProperty(propertyName);
    return dataBeginPos;
  }

  /**
   * Loads and prepares a mesh component for rendering with the data texture strategy.
   * This method validates the mesh, updates current component SIDs, and ensures
   * the mesh's VBO and VAO are properly set up.
   *
   * @param meshComponent - The mesh component to load and prepare for rendering
   * @returns true if the mesh was successfully loaded, false if there was an error
   *
   * @remarks
   * This method performs several important tasks:
   * - Validates that the mesh component has a valid mesh
   * - Updates the current component SIDs for data texture access
   * - Triggers VBO/VAO setup if the mesh hasn't been set up yet
   * - Deletes and recreates the data texture if needed for mesh updates
   */
  $load(meshComponent: MeshComponent) {
    const mesh = meshComponent.mesh as Mesh;
    if (mesh == null) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return false;
    }

    WebGLStrategyDataTexture.__currentComponentSIDs = WebGLStrategyDataTexture.__globalDataRepository.getValue(
      'currentComponentSIDs',
      0
    );

    // update VBO and VAO
    if (!mesh.isSetUpDone()) {
      this.deleteDataTexture(); // delete data texture to recreate one on next
      mesh._updateVBOAndVAO();
    }

    return true;
  }

  private __createAndUpdateMorphOffsetsAndWeightsUniformBuffers() {
    const inputArray = new Uint32Array(
      Math.ceil((Config.maxMorphPrimitiveNumber * Config.maxMorphTargetNumber) / 4) * 4
    );
    if (this.__morphOffsetsUniformBufferUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      this.__morphOffsetsUniformBufferUid =
        this.__webglResourceRepository.createUniformBufferWithBufferView(inputArray);
    }
    if (this.__morphWeightsUniformBufferUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      this.__morphWeightsUniformBufferUid =
        this.__webglResourceRepository.createUniformBufferWithBufferView(inputArray);
    }

    if (this.__uniformMorphOffsetsTypedArray == null) {
      this.__uniformMorphOffsetsTypedArray = new Uint32Array(
        Math.ceil((Config.maxMorphPrimitiveNumber * Config.maxMorphTargetNumber) / 4) * 4
      );
    }

    if (this.__uniformMorphWeightsTypedArray == null) {
      this.__uniformMorphWeightsTypedArray = new Float32Array(
        Math.ceil((Config.maxMorphPrimitiveNumber * Config.maxMorphTargetNumber) / 4) * 4
      );
    }

    let i = 0;
    for (; i < Config.maxMorphPrimitiveNumber; i++) {
      const primitive = Primitive.getPrimitiveHasMorph(i);
      if (primitive != null) {
        for (let j = 0; j < primitive.targets.length; j++) {
          const target = primitive.targets[j];
          const accessor = target.get(VertexAttribute.Position.XYZ) as Accessor;
          this.__uniformMorphOffsetsTypedArray![Config.maxMorphTargetNumber * i + j] =
            (SystemState.totalSizeOfGPUShaderDataStorageExceptMorphData + accessor.byteOffsetInBuffer) / 4 / 4;
        }
        this.__lastMorphMaxIndex = Config.maxMorphTargetNumber * i + primitive.targets.length - 1;
      } else {
        break;
      }
    }
    const elementNumToCopy = Config.maxMorphTargetNumber * i;
    this.__webglResourceRepository.updateUniformBuffer(
      this.__morphOffsetsUniformBufferUid,
      this.__uniformMorphOffsetsTypedArray,
      0,
      elementNumToCopy * 4
    );
  }

  common_$load(): void {
    let i = 0;
    let morphMaxIndex = 0;
    for (; i < Config.maxMorphPrimitiveNumber; i++) {
      const primitive = Primitive.getPrimitiveHasMorph(i);
      if (primitive != null) {
        morphMaxIndex = Config.maxMorphTargetNumber * i + primitive.targets.length - 1;
      } else {
        break;
      }
    }
    if (morphMaxIndex !== this.__lastMorphMaxIndex) {
      this.__createAndUpdateMorphOffsetsAndWeightsUniformBuffers();
    }
  }
  /**
   * Creates and updates the data texture with current shader data.
   * This is the main entry point for data texture management that handles
   * the complete update process.
   *
   * @remarks
   * This method delegates to __createAndUpdateDataTextureInner with no size limit,
   * ensuring the entire GPU instance data buffer is copied to the data texture.
   */
  private __createAndUpdateDataTexture() {
    this.__createAndUpdateDataTextureInner();
  }

  /**
   * Internal implementation for creating and updating the data texture.
   * This method handles the actual texture creation, data copying, and GPU upload.
   *
   * @param _copySizeInByte - Optional limit on how many bytes to copy from the GPU instance data buffer
   *
   * @remarks
   * This method performs several critical operations:
   * - Retrieves the GPU instance data buffer from memory manager
   * - Calculates appropriate texture size based on available data
   * - Handles both texture creation (first time) and texture updates (subsequent calls)
   * - Combines GPU instance data with morph target data for complete texture
   * - Provides debug functionality to dump texture contents
   * - Manages texture alignment and padding requirements
   */
  private __createAndUpdateDataTextureInner() {
    const memoryManager: MemoryManager = MemoryManager.getInstance();

    // the GPU global Storage
    const sizesOfTheBuffers = memoryManager.getSizesOfTheBuffers(BufferUse.GPUInstanceData);
    const totalSizeOfTheBuffers = sizesOfTheBuffers.reduce((acc, size) => acc + size, 0);
    const gpuInstanceDataBuffers = memoryManager.getBuffers(BufferUse.GPUInstanceData);
    const gpuInstanceDataBufferCount = gpuInstanceDataBuffers.length;
    if (gpuInstanceDataBufferCount !== this.__lastGpuInstanceDataBufferCount) {
      this.__lastGpuInstanceDataBufferCount = gpuInstanceDataBufferCount;
      this.deleteDataTexture();
    }

    const glw = this.__webglResourceRepository.currentWebGLContextWrapper;
    if (glw == null) {
      return;
    }
    const dataTextureWidth = glw.getMaxTextureSize();
    if (this.__dataTextureUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const totalSizeOfTheBuffersInTexel = totalSizeOfTheBuffers / 4 / 4;
      const dataTextureHeight = Math.ceil(totalSizeOfTheBuffersInTexel / dataTextureWidth);
      const dataTextureByteSize = dataTextureWidth * dataTextureHeight * 4 * 4;
      let copiedHeights = 0;
      for (let i = 0; i < gpuInstanceDataBuffers.length; i++) {
        const gpuInstanceDataBuffer = gpuInstanceDataBuffers[i];
        const bufferSizeForDataTextureInByte =
          i === gpuInstanceDataBuffers.length - 1
            ? gpuInstanceDataBuffer.takenSizeInByte
            : gpuInstanceDataBuffer.byteLength;

        const dataTextureWidthInByte = dataTextureWidth * 4 * 4;
        const height = Math.min(Math.ceil(bufferSizeForDataTextureInByte / dataTextureWidthInByte), dataTextureHeight);
        const updateByteSize = dataTextureWidth * height * 4 * 4;
        if (bufferSizeForDataTextureInByte > dataTextureByteSize) {
          Logger.warn('The buffer size exceeds the size of the data texture.');
        }
        const floatDataTextureBuffer = new Float32Array(gpuInstanceDataBuffer.getArrayBuffer(), 0, updateByteSize / 4);
        this.__webglResourceRepository.updateTexture(this.__dataTextureUid, floatDataTextureBuffer, {
          level: 0,
          offsetX: 0,
          offsetY: copiedHeights,
          width: dataTextureWidth,
          height: height,
          format: PixelFormat.RGBA,
          type: ComponentType.Float,
        });

        // debug
        if (!WebGLStrategyDataTexture.__isDebugOperationToDataTextureBufferDone) {
          MiscUtil.downloadTypedArray('Rhodonite_dataTextureBuffer.bin', floatDataTextureBuffer);
          WebGLStrategyDataTexture.__isDebugOperationToDataTextureBufferDone = true;
        }

        copiedHeights += height;
      }
    } else {
      const morphBuffer = memoryManager.getBuffer(BufferUse.GPUVertexData);
      let _morphBufferTakenSizeInByte = 0;
      let _morphBufferArrayBuffer = new ArrayBuffer(0);
      if (Is.exist(morphBuffer)) {
        _morphBufferTakenSizeInByte = morphBuffer.takenSizeInByte;
        _morphBufferArrayBuffer = morphBuffer.getArrayBuffer();
      }
      let floatDataTextureBuffer: Float32Array;

      // the size of morph buffer.
      let morphBufferTakenSizeInByte = 0;
      if (Is.exist(morphBuffer)) {
        morphBufferTakenSizeInByte = morphBuffer.takenSizeInByte;
      }

      // the arraybuffer of morph buffer.
      let morphBufferArrayBuffer = new ArrayBuffer(0);
      if (Is.exist(morphBuffer)) {
        morphBufferArrayBuffer = morphBuffer.getArrayBuffer();
      }

      const srcs = gpuInstanceDataBuffers.map(buffer => buffer.getArrayBuffer());
      srcs.push(morphBufferArrayBuffer);

      const srcsCopySizes: Byte[] = [];
      const srcsOffsets: Byte[] = [];
      gpuInstanceDataBuffers.forEach(buffer => {
        // spare padding texel for texture alignment (to edge of the width of texture)
        const paddingSpaceTexel = dataTextureWidth - ((buffer.takenSizeInByte / 4 / 4) % dataTextureWidth);
        const paddingSpaceBytes = paddingSpaceTexel * 4 * 4;
        srcsCopySizes.push(buffer.takenSizeInByte + paddingSpaceBytes);
        srcsOffsets.push(0);
      });
      srcsOffsets.push(0);
      const srcCopySizesExceptMorphBuffer = srcsCopySizes.slice();
      srcsCopySizes.push(morphBufferTakenSizeInByte);

      const totalSizeOfTheBuffersInTexel = (totalSizeOfTheBuffers + morphBufferTakenSizeInByte) / 4 / 4;
      const dataTextureHeight = Math.ceil(totalSizeOfTheBuffersInTexel / dataTextureWidth);
      const dataTextureByteSize = dataTextureWidth * dataTextureHeight * 4 * 4;
      const finalArrayBuffer = MiscUtil.concatArrayBuffers2({
        finalSize: dataTextureByteSize,
        srcs: srcs,
        srcsCopySize: srcsCopySizes,
        srcsOffset: srcsOffsets,
      });

      // warning if the used memory exceeds the size of the data texture.
      if (srcsCopySizes.reduce((acc, size) => acc + size, 0) > dataTextureByteSize) {
        Logger.warn('The buffer size exceeds the size of the data texture.');
      }

      floatDataTextureBuffer = new Float32Array(finalArrayBuffer);
      SystemState.totalSizeOfGPUShaderDataStorageExceptMorphData = srcCopySizesExceptMorphBuffer.reduce(
        (acc, size) => acc + size,
        0
      );

      // write data
      this.__dataTextureUid = this.__webglResourceRepository.createTextureFromTypedArray(floatDataTextureBuffer!, {
        internalFormat: TextureFormat.RGBA32F,
        width: dataTextureWidth,
        height: dataTextureHeight,
        format: PixelFormat.RGBA,
        type: ComponentType.Float,
        generateMipmap: false,
      });
    }
  }

  /**
   * Deletes the current data texture and frees associated GPU resources.
   * This method should be called when the data texture needs to be recreated
   * or when cleaning up resources.
   *
   * @remarks
   * After calling this method, the data texture UID is reset to an invalid state,
   * and a new data texture will be created on the next rendering cycle.
   */
  deleteDataTexture(): void {
    if (this.__dataTextureUid != null) {
      this.__webglResourceRepository.deleteTexture(this.__dataTextureUid);
      this.__dataTextureUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
  }

  /**
   * Prepares the rendering pipeline before actual rendering begins.
   * This method updates GPU storage (data texture and UBO) based on component
   * update states and manages light components for the current frame.
   *
   * @remarks
   * This method performs conditional updates based on what has changed:
   * - Full update: When animation, transforms, scene graph, or materials change
   * - Camera-only update: When only camera or camera controller data changes
   * - Also retrieves current light components for the rendering pass
   *
   * The method tracks update counts to avoid unnecessary GPU uploads and
   * provides optimal performance by updating only what has changed.
   */
  prerender(): void {
    if (
      AnimationComponent.isAnimating ||
      TransformComponent.updateCount !== this.__lastTransformComponentsUpdateCount ||
      SceneGraphComponent.updateCount !== this.__lastSceneGraphComponentsUpdateCount ||
      CameraComponent.currentCameraUpdateCount !== this.__lastCameraComponentsUpdateCount ||
      CameraControllerComponent.updateCount !== this.__lastCameraControllerComponentsUpdateCount ||
      Material.stateVersion !== this.__lastMaterialsUpdateCount
    ) {
      // Setup GPU Storage (Data Texture & UBO)
      this.__createAndUpdateDataTexture();
      this.__createAndUpdateUBO();
      this.__lastTransformComponentsUpdateCount = TransformComponent.updateCount;
      this.__lastSceneGraphComponentsUpdateCount = SceneGraphComponent.updateCount;
      this.__lastCameraComponentsUpdateCount = CameraComponent.currentCameraUpdateCount;
      this.__lastCameraControllerComponentsUpdateCount = CameraControllerComponent.updateCount;
      this.__lastMaterialsUpdateCount = Material.stateVersion;
    }

    if (BlendShapeComponent.updateCount !== this.__lastBlendShapeComponentsUpdateCountForWeights) {
      this.__updateUniformMorph();
      this.__lastBlendShapeComponentsUpdateCountForWeights = BlendShapeComponent.updateCount;
    }

    this.__lightComponents = ComponentRepository.getComponentsWithType(LightComponent) as LightComponent[] | undefined;
  }

  /**
   * Updates uniform buffers containing morph target weights for blend shape animation.
   * Copies weight values from blend shape components to GPU-accessible uniform buffers.
   */
  private __updateUniformMorph() {
    const memoryManager: MemoryManager = MemoryManager.getInstance();
    const blendShapeDataBuffer: Buffer | undefined = memoryManager.getBuffer(BufferUse.GPUVertexData);
    if (blendShapeDataBuffer == null) {
      return;
    }
    if (blendShapeDataBuffer.takenSizeInByte === 0) {
      return;
    }

    const blendShapeComponents = ComponentRepository.getComponentsWithType(BlendShapeComponent);
    for (let i = 0; i < blendShapeComponents.length; i++) {
      const blendShapeComponent = blendShapeComponents[i] as BlendShapeComponent;
      const weights = blendShapeComponent!.weights;
      for (let j = 0; j < weights.length; j++) {
        this.__uniformMorphWeightsTypedArray![Config.maxMorphTargetNumber * blendShapeComponent.componentSID + j] =
          weights[j];
      }
    }
    if (blendShapeComponents.length > 0) {
      const elementNumToCopy = Config.maxMorphTargetNumber * blendShapeComponents.length;
      this.__webglResourceRepository.updateUniformBuffer(
        this.__morphWeightsUniformBufferUid,
        this.__uniformMorphWeightsTypedArray!,
        0,
        elementNumToCopy * 4
      );
    }
  }

  /**
   * Determines whether Uniform Buffer Objects (UBO) should be used for data storage.
   * UBOs are only used when both WebGL 2.0 is available and UBO usage is enabled in configuration.
   *
   * @returns true if UBOs should be used, false otherwise
   *
   * @remarks
   * UBOs provide more efficient uniform data transfer for WebGL 2.0 contexts
   * and can store larger amounts of uniform data compared to individual uniforms.
   */
  private __isUboUse() {
    return this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2 && Config.isUboEnabled;
  }

  /**
   * Creates and updates the Uniform Buffer Object (UBO) with current shader data.
   * This method is only active when UBO usage is enabled and WebGL 2.0 is available.
   *
   * @remarks
   * The UBO stores the same data as the data texture but in a different format
   * optimized for uniform buffer access. This method handles:
   * - Initial UBO creation with proper size allocation
   * - Updating existing UBO with new data from GPU instance buffer
   * - Respecting alignment requirements for uniform buffer layouts
   */
  private __createAndUpdateUBO() {
    if (this.__isUboUse()) {
      const glw = this.__webglResourceRepository.currentWebGLContextWrapper;
      const alignedMaxUniformBlockSize = glw!.getAlignedMaxUniformBlockSize();
      const maxConventionBlocks = glw!.getMaxConventionUniformBlocks();
      const memoryManager: MemoryManager = MemoryManager.getInstance();
      const buffer: Buffer | undefined = memoryManager.getBuffer(BufferUse.GPUInstanceData);
      if (this.__dataUBOUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        this.__dataUBOUid = this.__webglResourceRepository.setupUniformBufferDataArea(
          new Float32Array(buffer!.getArrayBuffer())
        );
      } else {
        const array = new Float32Array(buffer!.getArrayBuffer());
        this.__webglResourceRepository.updateUniformBuffer(
          this.__dataUBOUid,
          array,
          0,
          (alignedMaxUniformBlockSize * maxConventionBlocks) / 4 // (4 bytes unit)
        );
      }
    }
  }

  /**
   * Attaches GPU data for a primitive (placeholder implementation).
   * This method is part of the CGAPIStrategy interface but is not used
   * in the data texture strategy since data is handled through textures.
   *
   * @param primitive - The primitive to attach GPU data for
   */
  attachGPUData(_primitive: Primitive): void {}

  /**
   * Internal GPU data attachment (placeholder implementation).
   * This method is part of the interface but not actively used in data texture strategy.
   *
   * @param gl - The WebGL rendering context
   * @param shaderProgram - The shader program to attach data to
   */
  attachGPUDataInner(_gl: WebGLRenderingContext, _shaderProgram: WebGLProgram) {}

  /**
   * Attaches vertex data for a primitive (placeholder implementation).
   * This method is part of the interface but delegates to attachVertexDataInner.
   *
   * @param i - Index parameter (unused in this implementation)
   * @param primitive - The primitive to attach vertex data for
   * @param glw - The WebGL context wrapper
   * @param instanceIDBufferUid - The instance ID buffer resource handle
   */
  attachVertexData(
    _i: number,
    _primitive: Primitive,
    _glw: WebGLContextWrapper,
    _instanceIDBufferUid: WebGLResourceHandle
  ): void {}

  /**
   * Internal implementation for attaching vertex data to the rendering pipeline.
   * This method binds the appropriate Vertex Array Object (VAO) or sets up
   * vertex attribute pointers and element buffer bindings.
   *
   * @param mesh - The mesh containing the vertex data
   * @param primitive - The specific primitive within the mesh
   * @param primitiveIndex - Index of the primitive within the mesh
   * @param glw - The WebGL context wrapper for WebGL operations
   * @param instanceIDBufferUid - Resource handle for instance ID buffer
   *
   * @remarks
   * This method handles two scenarios:
   * - If a VAO exists, it simply binds the VAO (most efficient)
   * - If no VAO exists, it manually sets up vertex attributes and index buffer
   */
  attachVertexDataInner(
    mesh: Mesh,
    primitive: Primitive,
    primitiveIndex: Index,
    glw: WebGLContextWrapper,
    _instanceIDBufferUid: WebGLResourceHandle
  ): void {
    // bind
    const vao = this.__webglResourceRepository.getWebGLResource(
      mesh.getVaoUids(primitiveIndex)
    ) as WebGLVertexArrayObjectOES;
    if (vao != null) {
      glw.bindVertexArray(vao);
    } else {
      const vertexHandles = primitive.vertexHandles!;
      this.__webglResourceRepository.setVertexDataToPipeline(vertexHandles, primitive, mesh._variationVBOUid);
      const ibo = this.__webglResourceRepository.getWebGLResource(vertexHandles.iboHandle!) as WebGLBuffer;
      const gl = glw.getRawContext();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    }
  }

  /**
   * Gets the singleton instance of WebGLStrategyDataTexture.
   * Creates the instance if it doesn't exist and initializes the WebXR system reference.
   *
   * @returns The singleton instance of WebGLStrategyDataTexture
   *
   * @remarks
   * This method ensures only one instance of the strategy exists throughout the application
   * and properly initializes the WebXR system for VR/AR rendering capabilities.
   */
  static getInstance() {
    if (!this.__instance) {
      this.__instance = new WebGLStrategyDataTexture();
      const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
      const webxrSystem = rnXRModule.WebXRSystem.getInstance();
      WebGLStrategyDataTexture.__webxrSystem = webxrSystem;
    }

    return this.__instance;
  }

  /**
   * Sets the current component SIDs for each display index in VR/non-VR rendering.
   * This method configures camera component SIDs based on the rendering mode
   * and display configuration.
   *
   * @param renderPass - The current render pass being processed
   * @param displayIdx - The display index (0 or 1 for stereo rendering)
   * @param isVRMainPass - Whether this is a VR main rendering pass
   *
   * @remarks
   * For VR rendering:
   * - Uses WebXR system to get appropriate camera component SID
   * - Handles both multiview and separate eye rendering
   * For non-VR rendering:
   * - Uses the render pass camera or falls back to current camera
   * - Sets camera component SID to -1 if no camera is available
   */
  private __setCurrentComponentSIDsForEachDisplayIdx(renderPass: RenderPass, displayIdx: 0 | 1, isVRMainPass: boolean) {
    if (isVRMainPass) {
      let cameraComponentSid = -1;
      const webxrSystem = WebGLStrategyDataTexture.__webxrSystem;
      if (webxrSystem.isWebXRMode) {
        if (webxrSystem.isMultiView()) {
          cameraComponentSid = webxrSystem._getCameraComponentSIDAt(0);
        } else {
          cameraComponentSid = webxrSystem._getCameraComponentSIDAt(displayIdx);
        }
      }
      WebGLStrategyDataTexture.__currentComponentSIDs!._v[WellKnownComponentTIDs.CameraComponentTID] =
        cameraComponentSid;
    } else {
      // Non-VR Rendering
      let cameraComponent = renderPass.cameraComponent;
      if (cameraComponent == null) {
        // if the renderPass has no cameraComponent, try to get the current cameraComponent
        cameraComponent = ComponentRepository.getComponent(CameraComponent, CameraComponent.current) as CameraComponent;
      }
      if (cameraComponent) {
        WebGLStrategyDataTexture.__currentComponentSIDs!._v[WellKnownComponentTIDs.CameraComponentTID] =
          cameraComponent.componentSID;
      } else {
        WebGLStrategyDataTexture.__currentComponentSIDs!._v[WellKnownComponentTIDs.CameraComponentTID] = -1;
      }
    }
  }

  /**
   * Sets the current component SIDs for each primitive being rendered.
   * This method updates the global component SID array with material-specific information.
   *
   * @param gl - The WebGL rendering context
   * @param material - The material being used for rendering
   * @param shaderProgram - The active shader program
   *
   * @remarks
   * This method ensures the shader has access to the correct material SID
   * and initializes the component SID array if it hasn't been set up yet.
   * The material SID is stored at index 0 of the component SID array.
   */
  private __setCurrentComponentSIDsForEachPrimitive(
    _gl: WebGLRenderingContext,
    material: Material,
    _shaderProgram: WebGLProgram
  ) {
    if (WebGLStrategyDataTexture.__currentComponentSIDs == null) {
      WebGLStrategyDataTexture.__currentComponentSIDs = WebGLStrategyDataTexture.__globalDataRepository.getValue(
        'currentComponentSIDs',
        0
      );
    }

    WebGLStrategyDataTexture.__currentComponentSIDs!._v[0] = material.materialSID;
  }

  /**
   * Main rendering method that processes all primitives in a render pass.
   * This method handles different primitive types (opaque, translucent, blend)
   * and manages VR/non-VR rendering modes.
   *
   * @param primitiveUids - Array of primitive UIDs to render
   * @param renderPass - The render pass configuration
   * @param renderPassTickCount - Current tick count for the render pass
   * @param displayIdx - The index of the display to render to
   * @returns true if any primitives were successfully rendered, false otherwise
   *
   * @remarks
   * This method processes primitives in the following order:
   * 1. Opaque primitives (back-to-front for depth optimization)
   * 2. Translucent primitives (front-to-back for proper blending)
   * 3. Blend primitives with Z-write enabled
   * 4. Blend primitives without Z-write
   *
   * The method also handles buffer-less rendering mode for special cases
   * and manages depth mask settings for different primitive types.
   */
  common_$render(
    primitiveUids: PrimitiveUID[],
    renderPass: RenderPass,
    renderPassTickCount: Count,
    _displayIdx: Index
  ) {
    if (typeof spector !== 'undefined') {
      spector.setMarker('|  |  DataTexture:common_$render#');
    }
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContextAsWebGL2();

    const isVRMainPass = WebGLStrategyCommonMethod.isVrMainPass(renderPass);
    const displayCount = WebGLStrategyCommonMethod.getDisplayCount(
      isVRMainPass,
      WebGLStrategyDataTexture.__webxrSystem
    );

    if (renderPass.isBufferLessRenderingMode()) {
      this.__renderWithoutBuffers(gl, renderPass, isVRMainPass);
      gl.depthMask(true);
      return true;
    }

    let renderedSomething = false;

    // For opaque primitives
    if (renderPass._toRenderOpaquePrimitives) {
      if (!renderPass.depthWriteMask) {
        gl.depthMask(false);
      }
      for (let i = renderPass._lastOpaqueIndex; i >= 0; i--) {
        // Drawing from the nearest object
        const primitiveUid = primitiveUids[i];
        const rendered = this.__renderInner(primitiveUid, glw, renderPass, isVRMainPass, displayCount);
        renderedSomething ||= rendered;
      }
    }

    if (renderPass._toRenderTranslucentPrimitives) {
      // Draw Translucent primitives
      for (let i = renderPass._lastOpaqueIndex + 1; i <= renderPass._lastTranslucentIndex; i++) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.__renderInner(primitiveUid, glw, renderPass, isVRMainPass, displayCount);
        renderedSomething ||= rendered;
      }
    }

    if (renderPass._toRenderBlendWithZWritePrimitives) {
      // Draw Blend primitives with ZWrite
      for (let i = renderPass._lastTranslucentIndex + 1; i <= renderPass._lastBlendWithZWriteIndex; i++) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.__renderInner(primitiveUid, glw, renderPass, isVRMainPass, displayCount);
        renderedSomething ||= rendered;
      }
    }

    if (renderPass._toRenderBlendWithoutZWritePrimitives) {
      // disable depth write for blend primitives
      gl.depthMask(false);

      // Draw Blend primitives without ZWrite
      for (let i = renderPass._lastBlendWithZWriteIndex + 1; i <= renderPass._lastBlendWithoutZWriteIndex; i++) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.__renderInner(primitiveUid, glw, renderPass, isVRMainPass, displayCount);
        renderedSomething ||= rendered;
      }
    }

    gl.depthMask(true);

    this.__lastRenderPassTickCount = renderPassTickCount;

    // this.__webglResourceRepository.unbindTextureSamplers();

    return renderedSomething;
  }

  /**
   * Renders primitives without using vertex/index buffers.
   * This specialized rendering mode is used for certain types of procedural
   * or shader-generated geometry.
   *
   * @param gl - The WebGL 2.0 rendering context
   * @param renderPass - The render pass configuration
   * @param isVRMainPass - Whether this is a VR main rendering pass
   *
   * @remarks
   * This method handles buffer-less rendering by:
   * - Setting up the shader program and data texture binding
   * - Configuring component SIDs and VR state
   * - Setting material parameters directly
   * - Using drawArrays with the specified primitive mode and vertex count
   */
  private __renderWithoutBuffers(gl: WebGL2RenderingContext, renderPass: RenderPass, isVRMainPass: boolean) {
    // setup shader program
    const material: Material = renderPass.material!;
    const primitive: Primitive = renderPass._dummyPrimitiveForBufferLessRendering;
    setupShaderProgram(material, primitive, this);

    const shaderProgramUid = material.getShaderProgramUid(primitive);
    const shaderProgram = this.__webglResourceRepository.getWebGLResource(shaderProgramUid)! as WebGLProgram;
    gl.useProgram(shaderProgram);
    this.__lastShader = shaderProgramUid;

    // Bind DataTexture
    this.bindDataTexture(gl, shaderProgram);

    this.__setCurrentComponentSIDsForEachPrimitive(gl, material, shaderProgram);

    gl.uniform1fv(
      (shaderProgram as any).currentComponentSIDs,
      WebGLStrategyDataTexture.__currentComponentSIDs!._v as Float32Array
    );

    if ((shaderProgram as any).vrState != null && isVRMainPass) {
      const vrState = GlobalDataRepository.getInstance().getValue('vrState', 0) as Vector2;
      vrState._v[0] = isVRMainPass ? 1 : 0;
      vrState._v[1] = 0;
      (shaderProgram as any)._gl.uniform2iv((shaderProgram as any).vrState, vrState._v);
    }

    WebGLStrategyCommonMethod.setWebGLParameters(material, gl);

    material._setParametersToGpuWebGLWithOutInternalSetting({
      shaderProgram,
      firstTime: true,
      isUniformMode: false,
    });

    if (renderPass.depthWriteMask) {
      gl.depthMask(true);
    } else {
      gl.depthMask(false);
    }

    this.__webglResourceRepository.setViewport(renderPass.getViewport());

    gl.drawArrays(
      renderPass._primitiveModeForBufferLessRendering.index,
      0,
      renderPass._drawVertexNumberForBufferLessRendering
    );
  }

  /**
   * Internal rendering implementation for individual primitives.
   * This method handles the complete rendering pipeline for a single primitive,
   * including shader setup, material configuration, and draw calls.
   *
   * @param primitiveUid - Unique identifier of the primitive to render
   * @param glw - The WebGL context wrapper
   * @param renderPass - The current render pass configuration
   * @param isVRMainPass - Whether this is a VR main rendering pass
   * @param displayCount - Number of displays to render to (1 for normal, 2 for stereo VR)
   * @returns true if the primitive was successfully rendered, false otherwise
   *
   * @remarks
   * This method performs the following operations:
   * - Validates the primitive and retrieves associated mesh and material
   * - Sets up shader program if needed (with caching for performance)
   * - Configures vertex data and VAO/VBO bindings
   * - Sets material parameters and uniforms
   * - Handles per-display rendering for VR stereo
   * - Executes draw calls (instanced rendering for multiple mesh entities)
   *
   * The method optimizes performance by caching shader programs and materials
   * between draw calls and only updating GPU state when necessary.
   */
  private __renderInner(
    primitiveUid: PrimitiveUID,
    glw: WebGLContextWrapper,
    renderPass: RenderPass,
    isVRMainPass: boolean,
    displayCount: number
  ) {
    const gl = glw.getRawContextAsWebGL2();
    const primitive = Primitive.getPrimitive(primitiveUid);
    if (primitive == null) {
      return false;
    }
    const mesh = primitive.mesh as Mesh;
    const entity = mesh.meshEntitiesInner[0]; // get base mesh for instancing draw
    // setup shader program
    const material: Material = renderPass.getAppropriateMaterial(primitive);
    setupShaderProgram(material, primitive, this);

    const meshRendererComponent = entity.getMeshRenderer()!;
    const primitiveIndex = mesh.getPrimitiveIndexInMesh(primitive);
    this.attachVertexDataInner(mesh, primitive, primitiveIndex, glw, mesh._variationVBOUid);

    let firstTimeForShaderProgram = false;
    let firstTimeForMaterial = false;
    const shaderProgramUid = material.getShaderProgramUid(primitive);
    if (shaderProgramUid !== this.__lastShader || (gl as any).__changedProgram) {
      if (isSkipDrawing(material, primitive)) {
        return false;
      }

      const shaderProgram = this.__webglResourceRepository.getWebGLResource(shaderProgramUid)! as WebGLProgram;
      gl.useProgram(shaderProgram);
      (gl as any).__changedProgram = false;
      // Bind DataTexture
      this.bindDataTexture(gl, shaderProgram);

      // gl.uniform1i((shaderProgram as any).isMainVr, isVRMainPass ? 1 : 0); // VR MultiView is not supported yet

      WebGLStrategyDataTexture.__shaderProgram = shaderProgram;
      firstTimeForShaderProgram = true;
      firstTimeForMaterial = true;
    }
    if (this.__lastMaterial?.deref() !== material) {
      firstTimeForMaterial = true;
      this.__lastMaterial = new WeakRef(material);
    }
    if (this.__lastMaterialStateVersion !== material.stateVersion) {
      firstTimeForMaterial = true;
      this.__lastMaterialStateVersion = material.stateVersion;
    }

    const renderingArg: RenderingArgWebGL = {
      glw: glw,
      entity: entity,
      worldMatrix: entity.getSceneGraph()!.matrixInner,
      normalMatrix: entity.getSceneGraph()!.normalMatrixInner,
      isBillboard: entity.getSceneGraph().isBillboard,
      isVisible: entity.getSceneGraph().isVisible,
      lightComponents: this.__lightComponents!,
      renderPass: renderPass,
      primitive: primitive,
      diffuseCube: meshRendererComponent.diffuseCubeMap,
      specularCube: meshRendererComponent.specularCubeMap!,
      sheenCube: meshRendererComponent.sheenCubeMap,
      setUniform: false,
      isVr: isVRMainPass,
      displayIdx: -1,
    };

    if (firstTimeForShaderProgram) {
      material._setParametersToGpuWebGLPerShaderProgram({
        material,
        shaderProgram: WebGLStrategyDataTexture.__shaderProgram,
        firstTime: firstTimeForShaderProgram,
        args: renderingArg,
      });
    }

    if (firstTimeForMaterial) {
      this.__setCurrentComponentSIDsForEachPrimitive(gl, material, WebGLStrategyDataTexture.__shaderProgram);

      WebGLStrategyCommonMethod.setWebGLParameters(material, gl);

      material._setParametersToGpuWebGL({
        material: material,
        shaderProgram: WebGLStrategyDataTexture.__shaderProgram,
        firstTime: firstTimeForMaterial,
        args: renderingArg,
      });
    }
    material._setParametersToGpuWebGLPerPrimitive({
      material: material,
      shaderProgram: WebGLStrategyDataTexture.__shaderProgram,
      firstTime: firstTimeForMaterial,
      args: renderingArg,
    });

    for (let displayIdx = 0; displayIdx < displayCount; displayIdx++) {
      if (isVRMainPass) {
        WebGLStrategyCommonMethod.setVRViewport(renderPass, displayIdx);
      }
      this.__setCurrentComponentSIDsForEachDisplayIdx(renderPass, displayIdx as 0 | 1, isVRMainPass);

      gl.uniform1fv(
        (WebGLStrategyDataTexture.__shaderProgram as any).currentComponentSIDs,
        WebGLStrategyDataTexture.__currentComponentSIDs!._v as Float32Array
      );

      if ((WebGLStrategyDataTexture.__shaderProgram as any).vrState != null && isVRMainPass && displayCount > 1) {
        const vrState = GlobalDataRepository.getInstance().getValue('vrState', 0) as Vector2;
        vrState._v[0] = isVRMainPass ? 1 : 0;
        vrState._v[1] = displayIdx;
        (WebGLStrategyDataTexture.__shaderProgram as any)._gl.uniform2iv(
          (WebGLStrategyDataTexture.__shaderProgram as any).vrState,
          vrState._v
        );
      }

      if (primitive.indicesAccessor) {
        gl.drawElementsInstanced(
          primitive.primitiveMode.index,
          primitive.indicesAccessor.elementCount,
          primitive.indicesAccessor.componentType.index,
          0,
          mesh.meshEntitiesInner.length
        );
      } else {
        gl.drawArraysInstanced(
          primitive.primitiveMode.index,
          0,
          primitive.getVertexCountAsVerticesBased(),
          mesh.meshEntitiesInner.length
        );
      }
    }

    this.__lastShader = shaderProgramUid;

    return true;
  }

  /**
   * Binds the data texture to the WebGL context for shader access.
   * This method sets up the texture binding and sampler configuration
   * that allows shaders to access the data texture.
   *
   * @param gl - The WebGL rendering context
   * @param shaderProgram - The shader program that will access the data texture
   *
   * @remarks
   * This method performs the following operations:
   * - Sets the data texture uniform to texture unit 7
   * - Binds the data texture to texture unit 7
   * - Creates and binds a repeat/nearest sampler for optimal data texture access
   *
   * Texture unit 7 is used as a dedicated slot for data texture access
   * to avoid conflicts with regular material textures.
   */
  private bindDataTexture(gl: WebGLRenderingContext | WebGL2RenderingContext, shaderProgram: WebGLProgram) {
    gl.uniform1i((shaderProgram as any).dataTexture, 7);
    this.__webglResourceRepository.bindTexture2D(7, this.__dataTextureUid);
    const samplerUid = this.__webglResourceRepository.createOrGetTextureSamplerRepeatNearest();
    this.__webglResourceRepository.bindTextureSampler(7, samplerUid);
  }
  // $render(): void {}
}
