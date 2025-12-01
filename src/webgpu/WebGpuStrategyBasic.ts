import { AnimationComponent } from '../foundation/components/Animation/AnimationComponent';
import { BlendShapeComponent } from '../foundation/components/BlendShape/BlendShapeComponent';
import { CameraComponent } from '../foundation/components/Camera/CameraComponent';
import { CameraControllerComponent } from '../foundation/components/CameraController/CameraControllerComponent';
import { MeshComponent } from '../foundation/components/Mesh/MeshComponent';
import { SceneGraphComponent } from '../foundation/components/SceneGraph/SceneGraphComponent';
import { TransformComponent } from '../foundation/components/Transform/TransformComponent';
import { Component, type MemberInfo } from '../foundation/core/Component';
import { ComponentRepository } from '../foundation/core/ComponentRepository';
import { Config } from '../foundation/core/Config';
import { GlobalDataRepository } from '../foundation/core/GlobalDataRepository';
import { MemoryManager } from '../foundation/core/MemoryManager';
import { BufferUse } from '../foundation/definitions/BufferUse';
import { ComponentType } from '../foundation/definitions/ComponentType';
import { CompositionType } from '../foundation/definitions/CompositionType';
import type {
  ShaderSemanticsName,
  getShaderPropertyFuncOfGlobalDataRepository,
  getShaderPropertyFuncOfMaterial,
} from '../foundation/definitions/ShaderSemantics';
import type { ShaderSemanticsInfo } from '../foundation/definitions/ShaderSemanticsInfo';
import { ShaderType, type ShaderTypeEnum } from '../foundation/definitions/ShaderType';
import { VertexAttribute } from '../foundation/definitions/VertexAttribute';
import { Primitive } from '../foundation/geometry/Primitive';
import { Material } from '../foundation/materials/core/Material';
import { MaterialRepository } from '../foundation/materials/core/MaterialRepository';
import type { Accessor } from '../foundation/memory/Accessor';
import type { Buffer } from '../foundation/memory/Buffer';
import { Logger } from '../foundation/misc/Logger';
import { CGAPIResourceRepository } from '../foundation/renderer/CGAPIResourceRepository';
import type { CGAPIStrategy } from '../foundation/renderer/CGAPIStrategy';
import type { RenderPass } from '../foundation/renderer/RenderPass';
import { isSkipDrawing } from '../foundation/renderer/RenderingCommonMethods';
import type { Engine } from '../foundation/system/Engine';
import { ModuleManager } from '../foundation/system/ModuleManager';
import type {
  CGAPIResourceHandle,
  Count,
  Index,
  IndexOf4Bytes,
  IndexOf16Bytes,
  PrimitiveUID,
} from '../types/CommonTypes';
import type { WebXRSystem } from '../xr/WebXRSystem';
import type { RnXR } from '../xr/main';
import { WebGpuResourceRepository } from './WebGpuResourceRepository';

/**
 * Basic WebGPU rendering strategy implementation that handles mesh rendering,
 * storage buffer management, and shader program setup for WebGPU-based rendering pipeline.
 *
 * This class provides a complete rendering solution using WebGPU API, including:
 * - Storage buffer management for efficient GPU data transfer
 * - Shader program compilation and setup
 * - Morph target and blend shape handling
 * - Camera and transform matrix updates
 * - Render pass execution with proper primitive sorting
 *
 * @example
 * ```typescript
 * const strategy = WebGpuStrategyBasic.getInstance();
 * strategy.prerender();
 * strategy.common_$render(primitiveUids, renderPass, tickCount);
 * ```
 */
export class WebGpuStrategyBasic implements CGAPIStrategy {
  private __engine: Engine;
  private __storageBufferUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __storageBlendShapeBufferUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __uniformMorphOffsetsTypedArray?: Uint32Array;
  private __uniformMorphWeightsTypedArray?: Float32Array;

  private __lastMaterialsUpdateCount = -1;
  private __lastTransformComponentsUpdateCount = -1;
  private __lastSceneGraphComponentsUpdateCount = -1;
  private __lastCameraComponentsUpdateCount = -1;
  private __lastCameraControllerComponentsUpdateCount = -1;

  private __lastBlendShapeComponentsUpdateCountForWeights = -1;
  private __lastMorphMaxIndex = -1;
  private __lastGpuInstanceDataBufferCount = -1;
  private __lastMorphOffsetsUniformDataSize = -1;
  private __lastMorphWeightsUniformDataSize = -1;
  private __morphOffsetsUniformBufferUid = -1;
  private __morphWeightsUniformBufferUid = -1;
  private __storageBlendShapeBufferByteLength = -1;
  private __countOfBlendShapeComponents = -1;

  private constructor(engine: Engine) {
    this.__engine = engine;
  }

  /**
   * Gets the singleton instance of WebGpuStrategyBasic.
   * Creates a new instance if none exists.
   *
   * @returns The singleton instance of WebGpuStrategyBasic
   */
  static init(engine: Engine) {
    return new WebGpuStrategyBasic(engine);
  }

  /**
   * Generates vertex shader method definitions for storage buffer access.
   * These methods provide standardized access to transform matrices, visibility flags,
   * and morphing functionality in vertex shaders.
   *
   * @returns WGSL shader code containing helper functions for storage buffer access
   */
  static getVertexShaderMethodDefinitions_storageBuffer(shaderType: ShaderTypeEnum) {
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
          typeStr = 'vec4<f32>';
          fetchTypeStr = 'fetchVec4';
          break;
        case CompositionType.Mat4Array:
          typeStr = 'mat4x4<f32>';
          fetchTypeStr = 'fetchMat4';
          break;
        case CompositionType.Mat4x3Array:
          typeStr = 'mat4x3<f32>';
          fetchTypeStr = 'fetchMat4x3';
          break;
        default:
          throw new Error(`Unsupported composition type: ${memberInfo.compositionType.str}`);
      }
      const locationOffsets_vec4_idx = Component.getLocationOffsetOfMemberOfComponent(componentClass, memberName);
      const vec4SizeOfProperty: IndexOf16Bytes = memberInfo.compositionType.getVec4SizeOfProperty();
      const arrayLength = Component.getArrayLengthOfMember().get(componentClass)?.get(memberName) ?? 0;
      const arrayLengthStr = `let arrayLength: u32 = ${arrayLength}u;`;
      const indexStr = `indices[instanceIdOfBufferViews] + instanceIdInBufferView * ${vec4SizeOfProperty}u * arrayLength + ${vec4SizeOfProperty}u * idxOfArray;`; // vec4_idx
      let conversionStr = '';
      if (memberInfo.convertToBool) {
        conversionStr = 'if (value > 0.5) { return true; } else { return false; }';
      }
      str += `
  fn get_${memberName}(instanceId: u32, idxOfArray: u32) -> ${memberInfo.convertToBool ? 'bool' : typeStr} {
    let instanceIdOfBufferViews = instanceId / ${componentCountPerBufferView};
    let instanceIdInBufferView = instanceId % ${componentCountPerBufferView};
    var<function> indices: array<u32, ${locationOffsets_vec4_idx.length}> = array<u32, ${locationOffsets_vec4_idx.length}>(${locationOffsets_vec4_idx.map(offset => `${offset}u`).join(', ')});
    ${arrayLengthStr}
    let index: u32 = ${indexStr};
    let value = ${fetchTypeStr}(index);
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
          typeStr = 'mat4x4<f32>';
          fetchTypeStr = 'fetchMat4';
          break;
        case CompositionType.Mat3:
          typeStr = 'mat3x3<f32>';
          fetchTypeStr = 'fetchMat3No16BytesAligned';
          break;
        case CompositionType.Vec4:
          typeStr = 'vec4<f32>';
          fetchTypeStr = 'fetchVec4';
          break;
        case CompositionType.Vec3:
          typeStr = 'vec3<f32>';
          fetchTypeStr = 'fetchVec3No16BytesAligned';
          break;
        case CompositionType.Scalar:
          typeStr = 'f32';
          fetchTypeStr = 'fetchScalarNo16BytesAligned';
          break;
        default:
          throw new Error(`Unsupported composition type: ${memberInfo.compositionType.str}`);
      }

      const locationOffsets = Component.getLocationOffsetOfMemberOfComponent(componentClass, memberName);
      let indexStr = '';
      switch (memberInfo.compositionType) {
        case CompositionType.Mat4:
          indexStr = 'indices[instanceIdOfBufferViews] + 4u * instanceIdInBufferView;';
          break;
        case CompositionType.Mat3:
          indexStr = 'indices[instanceIdOfBufferViews] * 4u + 9u * instanceIdInBufferView;';
          break;
        case CompositionType.Vec4:
          indexStr = 'indices[instanceIdOfBufferViews] + 1u * instanceIdInBufferView;';
          break;
        case CompositionType.Vec3:
          indexStr = 'indices[instanceIdOfBufferViews] * 4u + 3u * instanceIdInBufferView;';
          break;
        case CompositionType.Scalar:
          indexStr = 'indices[instanceIdOfBufferViews] * 4u + 1u * instanceIdInBufferView;';
          break;
        default:
          throw new Error(`Unsupported composition type: ${memberInfo.compositionType.str}`);
      }
      let conversionStr = '';
      if (memberInfo.convertToBool) {
        conversionStr = 'if (value > 0.5) { return true; } else { return false; }';
      }
      str += `
  fn get_${memberName}(instanceId: u32) -> ${memberInfo.convertToBool ? 'bool' : typeStr} {
    let instanceIdOfBufferViews = instanceId / ${componentCountPerBufferView};
    let instanceIdInBufferView = instanceId % ${componentCountPerBufferView};
    var<function> indices: array<u32, ${locationOffsets.length}> = array<u32, ${locationOffsets.length}>(${locationOffsets.map(offset => `${offset}u`).join(', ')});
    let index: u32 = ${indexStr};
    let value = ${fetchTypeStr}(index);
    ${memberInfo.convertToBool ? conversionStr : 'return value;'}
  }
  `;
    }
  }

  private static __getMorphedPositionGetter(engine: Engine): string {
    const morphUniformDataTargetNumbers = Primitive.getMorphUniformDataTargetNumbers();
    const morphUniformDataTargetNumbersStr = `
    var<function> morphUniformDataTargetNumbers: array<u32, ${morphUniformDataTargetNumbers.length}> = array<u32, ${morphUniformDataTargetNumbers.length}>(${morphUniformDataTargetNumbers.map(num => `${num}u`).join(', ')});
    `;
    const morphUniformDataOffsets = Primitive.getMorphUniformDataOffsets();
    const morphUniformDataOffsetsStr = `
    var<function> morphUniformDataOffsets: array<u32, ${morphUniformDataOffsets.length}> = array<u32, ${morphUniformDataOffsets.length}>(${morphUniformDataOffsets.map(offset => `${offset}u`).join(', ')});
    `;
    const blendShapeUniformDataOffsets = BlendShapeComponent.getOffsetsInUniform(engine);
    const blendShapeUniformDataOffsetsStr = `
    var<function> blendShapeUniformDataOffsets: array<u32, ${blendShapeUniformDataOffsets.length}> = array<u32, ${blendShapeUniformDataOffsets.length}>(${blendShapeUniformDataOffsets.map(offset => `${offset}u`).join(', ')});
    `;

    const morphingStr = `

    #ifdef RN_IS_VERTEX_SHADER
    #ifdef RN_IS_MORPHING
    fn get_position(vertexId: u32, basePosition: vec3<f32>, blendShapeComponentSID: u32) -> vec3<f32> {
      ${morphUniformDataTargetNumbersStr}
      ${morphUniformDataOffsetsStr}
      ${blendShapeUniformDataOffsetsStr}
      let currentPrimitiveIdx = uniformDrawParameters.currentPrimitiveIdx;
      let offsetInUniform = morphUniformDataOffsets[currentPrimitiveIdx];
      let offsetInUniform2 = blendShapeUniformDataOffsets[blendShapeComponentSID];
      var position = basePosition;
      let scalar_idx = 3u * vertexId;
      for (var i=0u; i<morphUniformDataTargetNumbers[currentPrimitiveIdx]; i++) {
        let idx = offsetInUniform + i;
        let offsets = uniformMorphOffsets.data[ idx / 4u];
        let offsetPosition = offsets[idx % 4u];

        let basePosIn4bytes = offsetPosition * 4u + scalar_idx;
        let addPos = fetchVec3No16BytesAlignedFromBlendShapeBuffer(basePosIn4bytes);

        let idx2 = offsetInUniform2 + i;
        let morphWeights: vec4f = uniformMorphWeights.data[ idx2 / 4u];
        let morphWeight: f32 = morphWeights[idx2 % 4u];

        position += addPos * morphWeight;
      }

      return position;
    }
    #endif
  #endif
    `;

    return morphingStr;
  }

  /**
   * Generates shader property accessor functions for global data.
   * Creates WGSL functions that can fetch property values from storage buffers
   * based on shader semantics information.
   *
   * @param info - Shader semantics information containing type and binding details
   * @returns WGSL shader code for the property accessor function
   */
  private static __getShaderPropertyOfGlobalDataRepository(engine: Engine, info: ShaderSemanticsInfo) {
    const returnType = info.compositionType.toWGSLType(info.componentType);
    const methodName = info.semantic.replace('.', '_');
    const isTexture = CompositionType.isTexture(info.compositionType);

    if (isTexture) {
      let textureType = 'texture_2d<f32>';
      if (info.compositionType === CompositionType.TextureCube) {
        textureType = 'texture_cube<f32>';
      } else if (info.compositionType === CompositionType.Texture2DArray) {
        textureType = 'texture_2d_array<f32>';
      }
      const samplerName = methodName.replace('Texture', 'Sampler');
      return `
@group(1) @binding(${info.initialValue[0]}) var ${methodName}: ${textureType};
@group(2) @binding(${info.initialValue[0]}) var ${samplerName}: sampler;
`;
    }

    // inner contents of 'get_' shader function
    const vec4SizeOfProperty: IndexOf16Bytes = info.compositionType.getVec4SizeOfProperty();
    // for non-`index` property (this is general case)
    const scalarSizeOfProperty: IndexOf4Bytes = info.compositionType.getNumberOfComponents();
    const offsetOfProperty: IndexOf16Bytes = WebGpuStrategyBasic.getOffsetOfPropertyOfGlobalDataRepository(
      engine,
      info.semantic
    );

    if (offsetOfProperty === -1) {
      Logger.error('Could not get the location offset of the property.');
    }

    let indexStr: string;
    let instanceSize = vec4SizeOfProperty;
    indexStr = `  let vec4_idx: u32 = ${offsetOfProperty}u + ${instanceSize}u * instanceId;\n`;
    if (CompositionType.isArray(info.compositionType)) {
      instanceSize = vec4SizeOfProperty * (info.arrayLength ?? 1);
      const paddedAsVec4 = Math.ceil(scalarSizeOfProperty / 4) * 4;
      const instanceSizeInScalar = paddedAsVec4 * (info.arrayLength ?? 1);
      indexStr = `  let vec4_idx: u32 = ${offsetOfProperty}u + ${instanceSize} * instanceId + ${vec4SizeOfProperty}u * idxOfArray;\n`;
      indexStr += `  let scalar_idx: u32 = ${
        // IndexOf4Bytes
        offsetOfProperty * 4 // IndexOf16bytes to IndexOf4Bytes
      } + ${instanceSizeInScalar} * instanceId + ${scalarSizeOfProperty}u * idxOfArray;\n`;
    }

    const firstPartOfInnerFunc = `
fn get_${methodName}(instanceId: u32, idxOfArray: u32) -> ${returnType} {
${indexStr}
`;

    let str = `${firstPartOfInnerFunc}`;

    switch (info.compositionType) {
      case CompositionType.Vec4:
      case CompositionType.Vec4Array:
        str += '  let val = fetchElement(vec4_idx);\n';
        break;
      case CompositionType.Vec3:
        str += '  let col0 = fetchElement(vec4_idx);\n';
        str += `  let val = ${returnType}(col0.xyz);`;
        break;
      case CompositionType.Vec3Array:
        str += '  let val = fetchVec3No16BytesAligned(scalar_idx);\n';
        break;
      case CompositionType.Vec2:
        str += '  let col0 = fetchElement(vec4_idx);\n';
        str += `  let val = ${returnType}(col0.xy);`;
        break;
      case CompositionType.Vec2Array:
        str += '  let val = fetchVec2No16BytesAligned(scalar_idx);\n';
        break;
      case CompositionType.Scalar:
        str += '  let col0 = fetchElement(vec4_idx);\n';
        if (info.componentType === ComponentType.Int) {
          str += '  let val = i32(col0.x);';
        } else if (info.componentType === ComponentType.UnsignedInt) {
          str += '  let val = u32(col0.x);';
        } else if (info.componentType === ComponentType.Bool) {
          str += '  let val = col0.x >= 0.5;';
        } else {
          str += '  let val = col0.x;';
        }
        break;
      case CompositionType.ScalarArray:
        str += '  let col0 = fetchScalarNo16BytesAligned(scalar_idx);\n';
        if (info.componentType === ComponentType.Int) {
          str += '  let val = i32(col0);';
        } else if (info.componentType === ComponentType.UnsignedInt) {
          str += '  let val = u32(col0);';
        } else if (info.componentType === ComponentType.Bool) {
          str += '  let val = col0 >= 0.5;';
        } else {
          str += '  let val = col0;';
        }
        break;
      case CompositionType.Mat4:
        str += '  let val = fetchMat4(vec4_idx);\n';
        break;
      case CompositionType.Mat4Array:
        str += '  let val = fetchMat4(vec4_idx);\n';
        break;
      case CompositionType.Mat3:
        str += '  let val = fetchMat3(vec4_idx);\n';
        break;
      case CompositionType.Mat3Array:
        str += '  let val = fetchMat3No16BytesAligned(scalar_idx);\n';
        break;
      case CompositionType.Mat2:
        str += '  let val = fetchMat2(vec4_idx);\n';
        break;
      case CompositionType.Mat2Array:
        str += '  let val = fetchMat2No16BytesAligned(scalar_idx);\n';
        break;
      case CompositionType.Mat4x3Array:
        str += '  let val = fetchMat4x3(vec4_idx);\n';
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

  /**
   * Generates shader property accessor functions for materials.
   * Creates WGSL functions that can fetch property values from storage buffers
   * based on shader semantics information.
   *
   * @param materialTypeName - The name of the material type
   * @param info - Shader semantics information containing type and binding details
   * @returns WGSL shader code for the property accessor function
   */
  private static __getShaderPropertyOfMaterial(engine: Engine, materialTypeName: string, info: ShaderSemanticsInfo) {
    const returnType = info.compositionType.toWGSLType(info.componentType);
    const methodName = info.semantic.replace('.', '_');
    const isTexture = CompositionType.isTexture(info.compositionType);

    if (isTexture) {
      let textureType = 'texture_2d<f32>';
      if (info.compositionType === CompositionType.TextureCube) {
        textureType = 'texture_cube<f32>';
      } else if (info.compositionType === CompositionType.Texture2DArray) {
        textureType = 'texture_2d_array<f32>';
      }
      const samplerName = methodName.replace('Texture', 'Sampler');
      return `
@group(1) @binding(${info.initialValue[0]}) var ${methodName}: ${textureType};
@group(2) @binding(${info.initialValue[0]}) var ${samplerName}: sampler;
`;
    }

    // inner contents of 'get_' shader function
    const vec4SizeOfProperty: IndexOf16Bytes = info.compositionType.getVec4SizeOfProperty();
    // for non-`index` property (this is general case)
    const scalarSizeOfProperty: IndexOf4Bytes = info.compositionType.getNumberOfComponents();
    const offsetOfProperty: IndexOf16Bytes[] = WebGpuStrategyBasic.getOffsetOfPropertyOfMaterial(
      engine,
      info.semantic,
      materialTypeName
    );
    const materialCountPerBufferView = engine.materialRepository._getMaterialCountPerBufferView(materialTypeName)!;

    const offsetsStr = `var<function> offsets: array<u32, ${offsetOfProperty.length}> = array<u32, ${offsetOfProperty.length}>(${offsetOfProperty.map(offset => `${offset}u`).join(', ')});`;

    let indexStr: string;
    let instanceSize = vec4SizeOfProperty;
    indexStr = `  let vec4_idx: u32 = offsets[instanceIdOfBufferViews] + ${instanceSize}u * instanceIdInBufferView;\n`;
    if (CompositionType.isArray(info.compositionType)) {
      instanceSize = vec4SizeOfProperty * (info.arrayLength ?? 1);
      const paddedAsVec4 = Math.ceil(scalarSizeOfProperty / 4) * 4;
      const instanceSizeInScalar = paddedAsVec4 * (info.arrayLength ?? 1);
      indexStr = `  let vec4_idx: u32 = offsets[instanceIdOfBufferViews] + ${instanceSize} * instanceIdInBufferView + ${vec4SizeOfProperty}u * idxOfArray;\n`;
      indexStr += `  let scalar_idx: u32 = offsets[instanceIdOfBufferViews] * 4 + ${instanceSizeInScalar} * instanceIdInBufferView + ${scalarSizeOfProperty}u * idxOfArray;\n`;
    }

    const firstPartOfInnerFunc = `
fn get_${methodName}(instanceId: u32, idxOfArray: u32) -> ${returnType} {
  let instanceIdOfBufferViews = instanceId / ${materialCountPerBufferView};
  let instanceIdInBufferView = instanceId % ${materialCountPerBufferView};
${offsetsStr}
${indexStr}
`;

    let str = `${firstPartOfInnerFunc}`;

    switch (info.compositionType) {
      case CompositionType.Vec4:
      case CompositionType.Vec4Array:
        str += '  let val = fetchElement(vec4_idx);\n';
        break;
      case CompositionType.Vec3:
        str += '  let col0 = fetchElement(vec4_idx);\n';
        str += `  let val = ${returnType}(col0.xyz);`;
        break;
      case CompositionType.Vec3Array:
        str += '  let val = fetchVec3No16BytesAligned(scalar_idx);\n';
        break;
      case CompositionType.Vec2:
        str += '  let col0 = fetchElement(vec4_idx);\n';
        str += `  let val = ${returnType}(col0.xy);`;
        break;
      case CompositionType.Vec2Array:
        str += '  let val = fetchVec2No16BytesAligned(scalar_idx);\n';
        break;
      case CompositionType.Scalar:
        str += '  let col0 = fetchElement(vec4_idx);\n';
        if (info.componentType === ComponentType.Int) {
          str += '  let val = i32(col0.x);';
        } else if (info.componentType === ComponentType.UnsignedInt) {
          str += '  let val = u32(col0.x);';
        } else if (info.componentType === ComponentType.Bool) {
          str += '  let val = col0.x >= 0.5;';
        } else {
          str += '  let val = col0.x;';
        }
        break;
      case CompositionType.ScalarArray:
        str += '  let col0 = fetchScalarNo16BytesAligned(scalar_idx);\n';
        if (info.componentType === ComponentType.Int) {
          str += '  let val = i32(col0);';
        } else if (info.componentType === ComponentType.UnsignedInt) {
          str += '  let val = u32(col0);';
        } else if (info.componentType === ComponentType.Bool) {
          str += '  let val = col0 >= 0.5;';
        } else {
          str += '  let val = col0;';
        }
        break;
      case CompositionType.Mat4:
        str += '  let val = fetchMat4(vec4_idx);\n';
        break;
      case CompositionType.Mat4Array:
        str += '  let val = fetchMat4(vec4_idx);\n';
        break;
      case CompositionType.Mat3:
        str += '  let val = fetchMat3(vec4_idx);\n';
        break;
      case CompositionType.Mat3Array:
        str += '  let val = fetchMat3No16BytesAligned(scalar_idx);\n';
        break;
      case CompositionType.Mat2:
        str += '  let val = fetchMat2(vec4_idx);\n';
        break;
      case CompositionType.Mat2Array:
        str += '  let val = fetchMat2No16BytesAligned(scalar_idx);\n';
        break;
      case CompositionType.Mat4x3Array:
        str += '  let val = fetchMat4x3(vec4_idx);\n';
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

  /**
   * Calculates the memory offset of a shader property within storage buffers.
   *
   * @param engine - The engine instance
   * @param isGlobalData - Whether to look in global data repository or material repository
   * @param propertyName - The semantic name of the property
   * @param materialTypeName - The material type name for material-specific properties
   * @returns The byte offset of the property in the storage buffer, or -1 if not found
   */
  private static getOffsetOfPropertyOfMaterial(
    engine: Engine,
    propertyName: ShaderSemanticsName,
    materialTypeName: string
  ) {
    const dataBeginPos = engine.materialRepository.getLocationOffsetOfMemberOfMaterial(
      engine,
      materialTypeName,
      propertyName
    );
    return dataBeginPos;
  }

  private static getOffsetOfPropertyOfGlobalDataRepository(engine: Engine, propertyName: ShaderSemanticsName) {
    const globalDataRepository = engine.globalDataRepository;
    const dataBeginPos = globalDataRepository.getLocationOffsetOfProperty(propertyName);
    return dataBeginPos;
  }

  /**
   * Loads and prepares a mesh component for rendering.
   * Sets up vertex buffer objects (VBO) and vertex array objects (VAO) if not already done.
   *
   * @param meshComponent - The mesh component to load
   * @returns True if the mesh was successfully loaded, false if the mesh is null
   */
  $load(meshComponent: MeshComponent): boolean {
    const mesh = meshComponent.mesh;
    if (mesh == null) {
      return false;
    }

    // setup VBO and VAO
    if (!mesh.isSetUpDone()) {
      mesh._updateVBOAndVAO();
    }

    return true;
  }

  /**
   * Performs common loading operations required for the WebGPU strategy.
   * Initializes morph target arrays and updates blend shape storage buffers when needed.
   */
  common_$load(): void {
    this.__initMorphUniformBuffers();
  }

  private __initMorphUniformBuffers() {
    const morphUniformDataOffsets = Primitive.getMorphUniformDataOffsets();
    const morphOffsetsUniformDataSize = Math.max(
      Math.ceil(morphUniformDataOffsets[morphUniformDataOffsets.length - 1] / 4) * 4 * 4,
      4
    );

    if (morphOffsetsUniformDataSize !== this.__lastMorphOffsetsUniformDataSize) {
      const webGpuResourceRepository = this.__engine.webGpuResourceRepository;
      // delete the old morph offsets uniform buffer
      if (this.__morphOffsetsUniformBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        webGpuResourceRepository.flush();
        webGpuResourceRepository.clearCache();
        webGpuResourceRepository.deleteUniformBuffer(this.__morphOffsetsUniformBufferUid);
        this.__morphOffsetsUniformBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      }
      // create the new morph offsets uniform buffer
      this.__lastMorphOffsetsUniformDataSize = morphOffsetsUniformDataSize;
      if (this.__morphOffsetsUniformBufferUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        const inputArrayOffsets = new Uint32Array(morphOffsetsUniformDataSize);
        this.__uniformMorphOffsetsTypedArray = inputArrayOffsets;
        this.__morphOffsetsUniformBufferUid = webGpuResourceRepository.createUniformMorphOffsetsBuffer(
          morphOffsetsUniformDataSize * 4
        );
        this.__updateMorphOffsetsUniformBuffer();
      }

      this.__lastMorphOffsetsUniformDataSize = morphOffsetsUniformDataSize;
    }

    const blendShapeUniformDataOffsets = BlendShapeComponent.getOffsetsInUniform(this.__engine);
    const blendShapeWeightsUniformDataSize = Math.max(
      Math.ceil(blendShapeUniformDataOffsets[blendShapeUniformDataOffsets.length - 1] / 4) * 4 * 4,
      4
    );

    if (blendShapeWeightsUniformDataSize !== this.__lastMorphWeightsUniformDataSize) {
      const webGpuResourceRepository = this.__engine.webGpuResourceRepository;
      // delete the old morph weights uniform buffer
      if (this.__morphWeightsUniformBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        webGpuResourceRepository.flush();
        webGpuResourceRepository.clearCache();
        webGpuResourceRepository.deleteUniformBuffer(this.__morphWeightsUniformBufferUid);
        this.__morphWeightsUniformBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      }

      // create the new morph weights uniform buffer
      if (this.__morphWeightsUniformBufferUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        const inputArrayWeights = new Float32Array(blendShapeWeightsUniformDataSize);
        this.__uniformMorphWeightsTypedArray = inputArrayWeights;
        this.__morphWeightsUniformBufferUid = webGpuResourceRepository.createUniformMorphWeightsBuffer(
          blendShapeWeightsUniformDataSize * 4
        );
        this.__updateMorphWeightsUniformBuffer();
      }

      this.__lastMorphWeightsUniformDataSize = blendShapeWeightsUniformDataSize;
    }
  }

  /**
   * Sets up shader programs for all primitives in the given mesh component.
   * Iterates through all primitives and ensures their materials have proper shader programs.
   *
   * @param meshComponent - The mesh component containing primitives to setup
   */
  private __setupShaderProgramForMeshComponent(meshComponent: MeshComponent) {
    if (meshComponent.mesh == null) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return;
    }

    const primitiveNum = meshComponent.mesh.getPrimitiveNumber();
    for (let i = 0; i < primitiveNum; i++) {
      const primitive = meshComponent.mesh.getPrimitiveAt(i);
      const material = primitive.material;
      this._setupShaderProgram(material, primitive);
    }
  }

  /**
   * Sets up a shader program for a specific material and primitive combination.
   * Handles shader compilation errors by falling back to backup materials when necessary.
   *
   * @param material - The material to setup the shader for
   * @param primitive - The primitive that will use this material
   */
  private _setupShaderProgram(material: Material, primitive: Primitive) {
    if (material == null) {
      return;
    }

    if (material.isShaderProgramReady(primitive)) {
      return;
    }

    try {
      this.setupShaderForMaterial(
        material,
        primitive,
        WebGpuStrategyBasic.getVertexShaderMethodDefinitions_storageBuffer(ShaderType.VertexShader),
        WebGpuStrategyBasic.getVertexShaderMethodDefinitions_storageBuffer(ShaderType.PixelShader),
        WebGpuStrategyBasic.__getShaderPropertyOfGlobalDataRepository,
        WebGpuStrategyBasic.__getShaderPropertyOfMaterial,
        WebGpuStrategyBasic.__getMorphedPositionGetter(this.__engine)
      );
      primitive._backupMaterial();
    } catch (e) {
      Logger.error(e as string);
      primitive._restoreMaterial();
      this.setupShaderForMaterial(
        primitive.material,
        primitive,
        WebGpuStrategyBasic.getVertexShaderMethodDefinitions_storageBuffer(ShaderType.VertexShader),
        WebGpuStrategyBasic.getVertexShaderMethodDefinitions_storageBuffer(ShaderType.PixelShader),
        WebGpuStrategyBasic.__getShaderPropertyOfGlobalDataRepository,
        WebGpuStrategyBasic.__getShaderPropertyOfMaterial,
        WebGpuStrategyBasic.__getMorphedPositionGetter(this.__engine)
      );
    }
  }

  /**
   * Sets up shader programs for materials using the WebGPU rendering strategy.
   * This method orchestrates the shader compilation process by providing the necessary
   * method definitions and property setters.
   *
   * @param material - The material to create shader programs for
   * @param primitive - The primitive geometry that will use this material
   * @param vertexShaderMethodDefinitionsForVertexShader - WGSL code containing vertex shader helper methods
   * @param vertexShaderMethodDefinitionsForPixelShader - WGSL code containing pixel shader helper methods
   * @param propertySetter - Function to generate property accessor methods
   */
  public setupShaderForMaterial(
    material: Material,
    primitive: Primitive,
    vertexShaderMethodDefinitionsForVertexShader: string,
    vertexShaderMethodDefinitionsForPixelShader: string,
    propertySetterOfGlobalDataRepository: getShaderPropertyFuncOfGlobalDataRepository,
    propertySetterOfMaterial: getShaderPropertyFuncOfMaterial,
    morphedPositionGetter: string
  ): void {
    material._createProgramWebGpu(
      this.__engine,
      primitive,
      vertexShaderMethodDefinitionsForVertexShader,
      vertexShaderMethodDefinitionsForPixelShader,
      propertySetterOfGlobalDataRepository,
      propertySetterOfMaterial,
      morphedPositionGetter
    );
  }

  /**
   * Performs pre-rendering operations required before drawing.
   * Updates storage buffers when components have been modified and handles morph target updates.
   * This method should be called once per frame before any rendering operations.
   */
  prerender(): void {
    if (
      AnimationComponent.isAnimating ||
      TransformComponent.updateCount !== this.__lastTransformComponentsUpdateCount ||
      SceneGraphComponent.updateCount !== this.__lastSceneGraphComponentsUpdateCount ||
      CameraComponent.getCurrentCameraUpdateCount(this.__engine) !== this.__lastCameraComponentsUpdateCount ||
      CameraControllerComponent.updateCount !== this.__lastCameraControllerComponentsUpdateCount ||
      Material.stateVersion !== this.__lastMaterialsUpdateCount
    ) {
      this.__createAndUpdateStorageBuffer();
      this.__lastTransformComponentsUpdateCount = TransformComponent.updateCount;
      this.__lastSceneGraphComponentsUpdateCount = SceneGraphComponent.updateCount;
      this.__lastCameraComponentsUpdateCount = CameraComponent.getCurrentCameraUpdateCount(this.__engine);
      this.__lastCameraControllerComponentsUpdateCount = CameraControllerComponent.updateCount;
      this.__lastMaterialsUpdateCount = Material.stateVersion;
    }

    const morphMaxIndex = Primitive.getPrimitiveCountHasMorph();
    if (morphMaxIndex !== this.__lastMorphMaxIndex) {
      this.__createOrUpdateStorageBlendShapeBuffer();
      this.__lastMorphMaxIndex = morphMaxIndex;
    }

    if (
      BlendShapeComponent.updateCount !== this.__lastBlendShapeComponentsUpdateCountForWeights ||
      BlendShapeComponent.getCountOfBlendShapeComponents(this.__engine) !== this.__countOfBlendShapeComponents
    ) {
      this.__updateMorphWeightsUniformBuffer();
      this.__lastBlendShapeComponentsUpdateCountForWeights = BlendShapeComponent.updateCount;
      this.__countOfBlendShapeComponents = BlendShapeComponent.getCountOfBlendShapeComponents(this.__engine);
      this.__engine.materialRepository._makeShaderInvalidateToMorphMaterials();
    }
  }

  /**
   * Main rendering method that draws all primitives in the specified render pass.
   * Handles different primitive types (opaque, translucent, blend) with appropriate depth writing settings.
   *
   * @param primitiveUids - Array of primitive UIDs to render, sorted by rendering order
   * @param renderPass - The render pass configuration containing rendering settings
   * @param renderPassTickCount - Current tick count for animation and timing purposes
   * @param displayIdx - The index of the display to render to
   * @returns True if any primitives were successfully rendered
   */
  common_$render(
    primitiveUids: PrimitiveUID[],
    renderPass: RenderPass,
    _renderPassTickCount: Count,
    displayIdx: Index
  ): boolean {
    if (renderPass.isBufferLessRenderingMode()) {
      this.__renderWithoutBuffers(renderPass);
      return true;
    }

    let renderedSomething = false;
    const isZWrite = renderPass.isDepthTest && renderPass.depthWriteMask;
    // For opaque primitives
    if (renderPass._toRenderOpaquePrimitives) {
      for (let i = renderPass._lastOpaqueIndex; i >= 0; i--) {
        // Drawing from the nearest object
        const primitiveUid = primitiveUids[i];
        const rendered = this.renderInner(primitiveUid, renderPass, isZWrite, displayIdx);
        renderedSomething ||= rendered;
      }
    }

    // For translucent primitives
    if (renderPass._toRenderTranslucentPrimitives) {
      // Draw Translucent primitives
      for (let i = renderPass._lastOpaqueIndex + 1; i <= renderPass._lastTranslucentIndex; i++) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.renderInner(primitiveUid, renderPass, isZWrite, displayIdx);
        renderedSomething ||= rendered;
      }
    }

    if (renderPass._toRenderBlendWithZWritePrimitives) {
      // Draw Blend primitives with ZWrite
      for (let i = renderPass._lastTranslucentIndex + 1; i <= renderPass._lastBlendWithZWriteIndex; i++) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.renderInner(primitiveUid, renderPass, isZWrite, displayIdx);
        renderedSomething ||= rendered;
      }
    }

    if (renderPass._toRenderBlendWithoutZWritePrimitives) {
      // Draw Blend primitives without ZWrite
      for (let i = renderPass._lastBlendWithZWriteIndex + 1; i <= renderPass._lastBlendWithoutZWriteIndex; i++) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.renderInner(primitiveUid, renderPass, false, displayIdx);
        renderedSomething ||= rendered;
      }
    }

    return renderedSomething;
  }

  /**
   * Renders primitives without using vertex/index buffers.
   * This is used for special rendering modes like full-screen effects or procedural geometry.
   *
   * @param renderPass - The render pass containing the material and rendering configuration
   */
  private __renderWithoutBuffers(renderPass: RenderPass) {
    const material = renderPass.material!;
    const primitive = renderPass._dummyPrimitiveForBufferLessRendering;
    this._setupShaderProgram(material, primitive);

    const webGpuResourceRepository = this.__engine.webGpuResourceRepository;
    webGpuResourceRepository.updateUniformBufferForDrawParameters(
      `${renderPass.renderPassUID}-${primitive.primitiveUid}-${0}`,
      material.materialSID,
      0,
      0,
      0
    );
    const isZWrite = renderPass.isDepthTest && renderPass.depthWriteMask;
    webGpuResourceRepository.draw(this.__engine, primitive, material, renderPass, 0, isZWrite, 0);
  }

  /**
   * Renders a single primitive with the specified material and render settings.
   * Handles shader setup, uniform buffer updates, and the actual draw call.
   *
   * @param primitiveUid - Unique identifier of the primitive to render
   * @param renderPass - Render pass containing rendering configuration
   * @param zWrite - Whether to enable depth buffer writing
   * @param displayIdx - The index of the display to render to
   * @returns True if the primitive was successfully rendered
   */
  renderInner(primitiveUid: PrimitiveUID, renderPass: RenderPass, zWrite: boolean, displayIdx: Index) {
    if (primitiveUid === -1) {
      return false;
    }
    const primitive = Primitive.getPrimitive(primitiveUid);
    if (primitive == null) {
      return false;
    }
    const material: Material = renderPass.getAppropriateMaterial(primitive);
    this._setupShaderProgram(material, primitive);
    if (isSkipDrawing(material, primitive)) {
      return false;
    }

    const webGpuResourceRepository = this.__engine.webGpuResourceRepository;
    const webxrSystem = this.__engine.webXRSystem;
    const cameraSID = this.__getAppropriateCameraComponentSID(
      renderPass,
      displayIdx as 0 | 1,
      webxrSystem.isWebXRMode && renderPass.isVrRendering
    );

    const primitiveIdxHasMorph = Primitive.getPrimitiveIdxHasMorph(primitive.primitiveUid) ?? 0;
    webGpuResourceRepository.updateUniformBufferForDrawParameters(
      `${renderPass.renderPassUID}-${primitive.primitiveUid}-${displayIdx}`,
      material.materialSID,
      cameraSID,
      primitiveIdxHasMorph,
      primitive.targets.length
    );
    webGpuResourceRepository.draw(this.__engine, primitive, material, renderPass, cameraSID, zWrite, displayIdx);
    return true;
  }

  /**
   * Creates or updates the main storage buffer containing all GPU instance data.
   * This buffer holds transform matrices, material properties, and other per-instance data
   * required for rendering all objects in the scene.
   */
  private __createAndUpdateStorageBuffer() {
    const memoryManager = this.__engine.memoryManager;

    // the GPU global Storage
    const gpuInstanceDataBuffers = memoryManager.getBuffers(BufferUse.GPUInstanceData);
    const gpuInstanceDataBufferCount = gpuInstanceDataBuffers.length;
    const webGpuResourceRepository = this.__engine.webGpuResourceRepository;
    if (gpuInstanceDataBufferCount !== this.__lastGpuInstanceDataBufferCount) {
      this.__lastGpuInstanceDataBufferCount = gpuInstanceDataBufferCount;
      webGpuResourceRepository.destroyStorageBuffer(this.__storageBufferUid);
      this.__storageBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }

    // const dataTextureByteSize =
    //   MemoryManager.bufferWidthLength * MemoryManager.bufferHeightLength * 4 * 4;
    if (this.__storageBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      // Update
      webGpuResourceRepository.updateStorageBuffer(this.__storageBufferUid, gpuInstanceDataBuffers);
    } else {
      // Create
      this.__storageBufferUid = webGpuResourceRepository.createStorageBuffer(gpuInstanceDataBuffers);
    }
  }

  /**
   * Creates or updates the storage buffer containing blend shape vertex data.
   * This buffer holds morph target positions and other vertex attributes needed for blend shape animation.
   */
  private __createOrUpdateStorageBlendShapeBuffer() {
    const memoryManager = this.__engine.memoryManager;

    // the GPU global Storage
    const blendShapeDataBuffers: Buffer[] = memoryManager.getBuffers(BufferUse.GPUVertexData);

    if (blendShapeDataBuffers.length === 0) {
      return;
    }

    const blendShapeDataBufferByteLength = blendShapeDataBuffers.reduce((acc, buffer) => acc + buffer.byteLength, 0);

    if (blendShapeDataBufferByteLength !== this.__storageBlendShapeBufferByteLength) {
      this.__engine.webGpuResourceRepository.deleteStorageBlendShapeBuffer(this.__storageBlendShapeBufferUid);
      this.__storageBlendShapeBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      this.__storageBlendShapeBufferByteLength = blendShapeDataBufferByteLength;
    }

    const webGpuResourceRepository = this.__engine.webGpuResourceRepository;
    const float32Array = new Float32Array(blendShapeDataBufferByteLength / 4);
    // copy the data from the blendShapeDataBuffers to the float32Array
    let offset = 0;
    for (let i = 0; i < blendShapeDataBuffers.length; i++) {
      const buffer = blendShapeDataBuffers[i];
      float32Array.set(new Float32Array(buffer.getArrayBuffer()), offset);
      offset += buffer.byteLength / 4;
    }

    if (this.__storageBlendShapeBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      // Update
      const componentSizeForDataTexture = blendShapeDataBufferByteLength / 4;
      webGpuResourceRepository.updateStorageBlendShapeBuffer(
        this.__storageBlendShapeBufferUid,
        float32Array,
        componentSizeForDataTexture
      );
    } else {
      // Create
      this.__storageBlendShapeBufferUid = webGpuResourceRepository.createStorageBlendShapeBuffer(float32Array);
    }

    this.__updateMorphOffsetsUniformBuffer();
  }

  private __updateMorphOffsetsUniformBuffer() {
    const webGpuResourceRepository = this.__engine.webGpuResourceRepository;
    const morphUniformDataOffsets = Primitive.getMorphUniformDataOffsets();
    for (let i = 0; i < Primitive.getPrimitiveCountHasMorph(); i++) {
      const primitive = Primitive.getPrimitiveHasMorph(i);
      if (primitive != null) {
        for (let j = 0; j < primitive.targets.length; j++) {
          const target = primitive.targets[j];
          const accessor = target.get(VertexAttribute.Position.XYZ) as Accessor;
          const byteOffsetOfExistingBuffer = this.__engine.memoryManager.getByteOffsetOfExistingBuffers(
            BufferUse.GPUVertexData,
            accessor.bufferView.buffer.indexOfTheBufferUsage
          );
          this.__uniformMorphOffsetsTypedArray![morphUniformDataOffsets[i] + j] =
            (byteOffsetOfExistingBuffer + accessor.byteOffsetInBuffer) / 4 / 4;
        }
      } else {
        break;
      }
    }
    const elementNumToCopy = morphUniformDataOffsets[morphUniformDataOffsets.length - 1];
    webGpuResourceRepository.updateUniformMorphOffsetsBuffer(this.__uniformMorphOffsetsTypedArray!, elementNumToCopy);
  }

  /**
   * Updates uniform buffers containing morph target weights for blend shape animation.
   * Copies weight values from blend shape components to GPU-accessible uniform buffers.
   */
  private __updateMorphWeightsUniformBuffer() {
    const memoryManager = this.__engine.memoryManager;
    const blendShapeDataBuffer: Buffer | undefined = memoryManager.getBuffer(BufferUse.GPUVertexData);
    if (blendShapeDataBuffer == null) {
      return;
    }
    if (blendShapeDataBuffer.takenSizeInByte === 0) {
      return;
    }

    const blendShapeUniformDataOffsets = BlendShapeComponent.getOffsetsInUniform(this.__engine);
    const blendShapeComponents = this.__engine.componentRepository.getComponentsWithTypeWithoutFiltering(
      BlendShapeComponent
    ) as (BlendShapeComponent | undefined)[];
    for (let i = 0; i < blendShapeComponents.length; i++) {
      const blendShapeComponent = blendShapeComponents[i];
      const weights = blendShapeComponent != null ? blendShapeComponent!.weights : [];
      for (let j = 0; j < weights.length; j++) {
        this.__uniformMorphWeightsTypedArray![blendShapeUniformDataOffsets[i] + j] = weights[j];
      }
    }
    if (blendShapeComponents.length > 0) {
      const webGpuResourceRepository = this.__engine.webGpuResourceRepository;
      const elementNumToCopy = blendShapeUniformDataOffsets[blendShapeUniformDataOffsets.length - 1];
      webGpuResourceRepository.updateUniformMorphWeightsBuffer(this.__uniformMorphWeightsTypedArray!, elementNumToCopy);
    }
  }

  /**
   * Determines the appropriate camera component SID for the current rendering context.
   * Handles both VR and non-VR rendering scenarios, including multi-view stereo rendering.
   *
   * @param renderPass - The current render pass
   * @param displayIdx - Display index for stereo rendering (0 for left eye, 1 for right eye)
   * @param isVRMainPass - Whether this is a VR main rendering pass
   * @returns The component SID of the appropriate camera, or -1 if no camera is available
   */
  private __getAppropriateCameraComponentSID(renderPass: RenderPass, displayIdx: 0 | 1, isVRMainPass: boolean): number {
    if (isVRMainPass) {
      const webxrSystem = this.__engine.webXRSystem;
      let cameraComponentSid = -1;
      if (webxrSystem.isWebXRMode) {
        if (webxrSystem.isMultiView()) {
          cameraComponentSid = webxrSystem._getCameraComponentSIDAt(0);
        } else {
          cameraComponentSid = webxrSystem._getCameraComponentSIDAt(displayIdx);
        }
      }
      return cameraComponentSid;
    }
    // Non-VR Rendering
    let cameraComponent = renderPass.cameraComponent;
    if (cameraComponent == null) {
      // if the renderPass has no cameraComponent, try to get the current cameraComponent
      cameraComponent = this.__engine.componentRepository.getComponent(
        CameraComponent,
        CameraComponent.current
      ) as CameraComponent;
    }
    if (cameraComponent) {
      return cameraComponent.componentSID;
    }
    return -1;
  }
}
