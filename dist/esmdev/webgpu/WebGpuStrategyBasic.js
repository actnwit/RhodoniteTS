// src/webgpu/WebGpuStrategyBasic.ts
import { AnimationComponent } from "../foundation/components/Animation/AnimationComponent.js";
import { BlendShapeComponent } from "../foundation/components/BlendShape/BlendShapeComponent.js";
import { CameraComponent } from "../foundation/components/Camera/CameraComponent.js";
import { _getCameraControllerUpdateCount } from "../foundation/components/CameraController/CameraControllerUpdateCount.js";
import { LightComponent } from "../foundation/components/Light/LightComponent.js";
import { MeshComponent } from "../foundation/components/Mesh/MeshComponent.js";
import { SceneGraphComponent } from "../foundation/components/SceneGraph/SceneGraphComponent.js";
import { TransformComponent } from "../foundation/components/Transform/TransformComponent.js";
import { Component } from "../foundation/core/Component.js";
import { AlphaMode } from "../foundation/definitions/AlphaMode.js";
import { BufferUse } from "../foundation/definitions/BufferUse.js";
import { ComponentType } from "../foundation/definitions/ComponentType.js";
import { CompositionType } from "../foundation/definitions/CompositionType.js";
import { ShaderType } from "../foundation/definitions/ShaderType.js";
import { VertexAttribute } from "../foundation/definitions/VertexAttribute.js";
import { Primitive } from "../foundation/geometry/Primitive.js";
import { getTextureAndSamplerNames } from "../foundation/helpers/ShaderHelper.js";
import { Logger } from "../foundation/misc/Logger.js";
import { CGAPIResourceRepository } from "../foundation/renderer/CGAPIResourceRepository.js";
import { isSkipDrawing } from "../foundation/renderer/RenderingCommonMethods.js";
import { WebGpuLightClusterBuilder } from "./WebGpuLightClusterBuilder.js";
var WebGpuStrategyBasic = class _WebGpuStrategyBasic {
  constructor(engine) {
    this.__storageBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.__storageBlendShapeBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.__lastMaterialsUpdateCount = -1;
    this.__lastLightClusterDataVersion = -1;
    this.__lastLightComponentsUpdateCount = -1;
    this.__lastLightClusterBuildDataVersion = -1;
    this.__lastTransformComponentsUpdateCount = -1;
    this.__lastSceneGraphComponentsUpdateCount = -1;
    this.__lastCameraComponentsUpdateCount = -1;
    this.__lastCameraControllerComponentsUpdateCount = -1;
    this.__lastBlendShapeComponentsUpdateCountForWeights = -1;
    this.__lastMorphMaxIndex = -1;
    this.__lastGpuInstanceDataBufferCount = -1;
    this.__lastMorphOffsetsUniformDataSize = -1;
    this.__lastMorphWeightsUniformDataSize = -1;
    this.__morphOffsetsUniformBufferUid = -1;
    this.__morphWeightsUniformBufferUid = -1;
    this.__storageBlendShapeBufferByteLength = -1;
    this.__countOfBlendShapeComponents = -1;
    this.__engine = engine;
  }
  /**
   * Gets the singleton instance of WebGpuStrategyBasic.
   * Creates a new instance if none exists.
   *
   * @returns The singleton instance of WebGpuStrategyBasic
   */
  static init(engine) {
    return new _WebGpuStrategyBasic(engine);
  }
  /**
   * Generates vertex shader method definitions for storage buffer access.
   * These methods provide standardized access to transform matrices, visibility flags,
   * and morphing functionality in vertex shaders.
   *
   * @returns WGSL shader code containing helper functions for storage buffer access
   */
  static getVertexShaderMethodDefinitions_storageBuffer(engine, shaderType) {
    let str = "";
    const memberInfo = Component.getMemberInfo(engine);
    memberInfo.forEach((mapMemberNameMemberInfo, componentClass) => {
      mapMemberNameMemberInfo.forEach((memberInfo2, memberName) => {
        var _a;
        if (memberInfo2.shaderType !== shaderType && memberInfo2.shaderType !== ShaderType.VertexAndPixelShader) {
          return;
        }
        const componentCountPerBufferView = (_a = Component.getComponentCountPerBufferView(engine).get(componentClass)) != null ? _a : 1;
        if (CompositionType.isArray(memberInfo2.compositionType)) {
          processForArrayType(memberInfo2, componentClass, memberName, componentCountPerBufferView);
        } else {
          processForNonArrayType(memberInfo2, componentClass, memberName, componentCountPerBufferView);
        }
      });
    });
    return str;
    function processForArrayType(memberInfo2, componentClass, memberName, componentCountPerBufferView) {
      var _a, _b;
      let typeStr = "";
      let fetchTypeStr = "";
      switch (memberInfo2.compositionType) {
        case CompositionType.Vec4Array:
          typeStr = "vec4<f32>";
          fetchTypeStr = "fetchVec4";
          break;
        case CompositionType.Mat4Array:
          typeStr = "mat4x4<f32>";
          fetchTypeStr = "fetchMat4";
          break;
        case CompositionType.Mat4x3Array:
          typeStr = "mat4x3<f32>";
          fetchTypeStr = "fetchMat4x3";
          break;
        default:
          throw new Error(`Unsupported composition type: ${memberInfo2.compositionType.str}`);
      }
      const vec4SizeOfProperty = memberInfo2.compositionType.getVec4SizeOfProperty();
      if (memberInfo2.isVariableLength === true) {
        const radix = Component._variableLengthLocationRadix;
        str += `
  fn get_${memberName}(instanceId: u32, idxOfArray: u32) -> ${typeStr} {
    let location = get_${Component._getVariableLengthLocationMemberName(memberName)}(instanceId);
    let index: u32 = u32(location.x) * ${radix}u + u32(location.y) + ${vec4SizeOfProperty}u * idxOfArray;
    let value = ${fetchTypeStr}(index);
    return value;
  }
  `;
        return;
      }
      const locationOffsets_vec4_idx = Component.getLocationOffsetOfMemberOfComponent(
        engine,
        componentClass,
        memberName
      );
      const arrayLength = (_b = (_a = Component.getArrayLengthOfMember(engine).get(componentClass)) == null ? void 0 : _a.get(memberName)) != null ? _b : 0;
      const arrayLengthStr = `let arrayLength: u32 = ${arrayLength}u;`;
      const indicesName = `rnIndices_${memberName}`;
      const indexStr = `${indicesName}[instanceIdOfBufferViews] + instanceIdInBufferView * ${vec4SizeOfProperty}u * arrayLength + ${vec4SizeOfProperty}u * idxOfArray;`;
      let conversionStr = "";
      if (memberInfo2.convertToBool) {
        conversionStr = "if (value > 0.5) { return true; } else { return false; }";
      }
      str += `
  const ${indicesName}: array<u32, ${locationOffsets_vec4_idx.length}> = array<u32, ${locationOffsets_vec4_idx.length}>(${locationOffsets_vec4_idx.map((offset) => `${offset}u`).join(", ")});
  fn get_${memberName}(instanceId: u32, idxOfArray: u32) -> ${memberInfo2.convertToBool ? "bool" : typeStr} {
    let instanceIdOfBufferViews = instanceId / ${componentCountPerBufferView};
    let instanceIdInBufferView = instanceId % ${componentCountPerBufferView};
    ${arrayLengthStr}
    let index: u32 = ${indexStr};
    let value = ${fetchTypeStr}(index);
    ${memberInfo2.convertToBool ? conversionStr : "return value;"}
  }
  `;
    }
    function processForNonArrayType(memberInfo2, componentClass, memberName, componentCountPerBufferView) {
      let typeStr = "";
      let fetchTypeStr = "";
      switch (memberInfo2.compositionType) {
        case CompositionType.Mat4:
          typeStr = "mat4x4<f32>";
          fetchTypeStr = "fetchMat4";
          break;
        case CompositionType.Mat3:
          typeStr = "mat3x3<f32>";
          fetchTypeStr = "fetchMat3No16BytesAligned";
          break;
        case CompositionType.Vec4:
          typeStr = "vec4<f32>";
          fetchTypeStr = "fetchVec4";
          break;
        case CompositionType.Vec3:
          typeStr = "vec3<f32>";
          fetchTypeStr = "fetchVec3No16BytesAligned";
          break;
        case CompositionType.Scalar:
          typeStr = "f32";
          fetchTypeStr = "fetchScalarNo16BytesAligned";
          break;
        default:
          throw new Error(`Unsupported composition type: ${memberInfo2.compositionType.str}`);
      }
      const locationOffsets = Component.getLocationOffsetOfMemberOfComponent(engine, componentClass, memberName);
      const indicesName = `rnIndices_${memberName}`;
      let indexStr = "";
      switch (memberInfo2.compositionType) {
        case CompositionType.Mat4:
          indexStr = `${indicesName}[instanceIdOfBufferViews] + 4u * instanceIdInBufferView;`;
          break;
        case CompositionType.Mat3:
          indexStr = `${indicesName}[instanceIdOfBufferViews] * 4u + 9u * instanceIdInBufferView;`;
          break;
        case CompositionType.Vec4:
          indexStr = `${indicesName}[instanceIdOfBufferViews] + 1u * instanceIdInBufferView;`;
          break;
        case CompositionType.Vec3:
          indexStr = `${indicesName}[instanceIdOfBufferViews] * 4u + 3u * instanceIdInBufferView;`;
          break;
        case CompositionType.Scalar:
          indexStr = `${indicesName}[instanceIdOfBufferViews] * 4u + 1u * instanceIdInBufferView;`;
          break;
        default:
          throw new Error(`Unsupported composition type: ${memberInfo2.compositionType.str}`);
      }
      let conversionStr = "";
      if (memberInfo2.convertToBool) {
        conversionStr = "if (value > 0.5) { return true; } else { return false; }";
      }
      str += `
  const ${indicesName}: array<u32, ${locationOffsets.length}> = array<u32, ${locationOffsets.length}>(${locationOffsets.map((offset) => `${offset}u`).join(", ")});
  fn get_${memberName}(instanceId: u32) -> ${memberInfo2.convertToBool ? "bool" : typeStr} {
    let instanceIdOfBufferViews = instanceId / ${componentCountPerBufferView};
    let instanceIdInBufferView = instanceId % ${componentCountPerBufferView};
    let index: u32 = ${indexStr};
    let value = ${fetchTypeStr}(index);
    ${memberInfo2.convertToBool ? conversionStr : "return value;"}
  }
  `;
    }
  }
  static __getMorphedPositionGetter(engine) {
    const morphUniformDataTargetNumbers = Primitive.getMorphUniformDataTargetNumbers();
    const morphUniformDataTargetNumbersStr = `
    const rnMorphUniformDataTargetNumbers: array<u32, ${morphUniformDataTargetNumbers.length}> = array<u32, ${morphUniformDataTargetNumbers.length}>(${morphUniformDataTargetNumbers.map((num) => `${num}u`).join(", ")});
    `;
    const morphUniformDataOffsets = Primitive.getMorphUniformDataOffsets();
    const morphUniformDataOffsetsStr = `
    const rnMorphUniformDataOffsets: array<u32, ${morphUniformDataOffsets.length}> = array<u32, ${morphUniformDataOffsets.length}>(${morphUniformDataOffsets.map((offset) => `${offset}u`).join(", ")});
    `;
    const blendShapeUniformDataOffsets = BlendShapeComponent.getOffsetsInUniform(engine);
    const blendShapeUniformDataOffsetsStr = `
    const rnBlendShapeUniformDataOffsets: array<u32, ${blendShapeUniformDataOffsets.length}> = array<u32, ${blendShapeUniformDataOffsets.length}>(${blendShapeUniformDataOffsets.map((offset) => `${offset}u`).join(", ")});
    `;
    const morphingStr = `

    #ifdef RN_IS_VERTEX_SHADER
    #ifdef RN_IS_MORPHING
    ${morphUniformDataTargetNumbersStr}
    ${morphUniformDataOffsetsStr}
    ${blendShapeUniformDataOffsetsStr}
    fn get_position(vertexId: u32, basePosition: vec3<f32>, blendShapeComponentSID: u32) -> vec3<f32> {
      let currentPrimitiveIdx = uniformDrawParameters.currentPrimitiveIdx;
      let offsetInUniform = rnMorphUniformDataOffsets[currentPrimitiveIdx];
      let offsetInUniform2 = rnBlendShapeUniformDataOffsets[blendShapeComponentSID];
      var position = basePosition;
      let scalar_idx = 3u * vertexId;
      for (var i=0u; i<rnMorphUniformDataTargetNumbers[currentPrimitiveIdx]; i++) {
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
  static __getShaderPropertyOfGlobalDataRepository(engine, info) {
    var _a, _b;
    const returnType = info.compositionType.toWGSLType(info.componentType);
    const methodName = info.semantic.replace(".", "_");
    const isTexture = CompositionType.isTexture(info.compositionType);
    if (isTexture) {
      let textureType = "texture_2d<f32>";
      if (info.compositionType === CompositionType.TextureCube) {
        textureType = "texture_cube<f32>";
      } else if (info.compositionType === CompositionType.Texture2DArray) {
        textureType = "texture_2d_array<f32>";
      }
      const { textureName, samplerName } = getTextureAndSamplerNames(methodName);
      return `
@group(1) @binding(${info.initialValue[0]}) var ${textureName}: ${textureType};
@group(2) @binding(${info.initialValue[0]}) var ${samplerName}: sampler;
`;
    }
    const vec4SizeOfProperty = info.compositionType.getVec4SizeOfProperty();
    const scalarSizeOfProperty = info.compositionType.getNumberOfComponents();
    const offsetOfProperty = _WebGpuStrategyBasic.getOffsetOfPropertyOfGlobalDataRepository(
      engine,
      info.semantic
    );
    if (offsetOfProperty === -1) {
      Logger.default.error("Could not get the location offset of the property.");
    }
    let indexStr;
    let instanceSize = vec4SizeOfProperty;
    indexStr = `  let vec4_idx: u32 = ${offsetOfProperty}u + ${instanceSize}u * instanceId;
`;
    if (CompositionType.isArray(info.compositionType)) {
      instanceSize = vec4SizeOfProperty * ((_a = info.arrayLength) != null ? _a : 1);
      const paddedAsVec4 = Math.ceil(scalarSizeOfProperty / 4) * 4;
      const instanceSizeInScalar = paddedAsVec4 * ((_b = info.arrayLength) != null ? _b : 1);
      indexStr = `  let vec4_idx: u32 = ${offsetOfProperty}u + ${instanceSize} * instanceId + ${vec4SizeOfProperty}u * idxOfArray;
`;
      indexStr += `  let scalar_idx: u32 = ${// IndexOf4Bytes
      offsetOfProperty * 4} + ${instanceSizeInScalar} * instanceId + ${scalarSizeOfProperty}u * idxOfArray;
`;
    }
    const firstPartOfInnerFunc = `
fn get_${methodName}(instanceId: u32, idxOfArray: u32) -> ${returnType} {
${indexStr}
`;
    let str = `${firstPartOfInnerFunc}`;
    switch (info.compositionType) {
      case CompositionType.Vec4:
      case CompositionType.Vec4Array:
        str += "  let val = fetchElement(vec4_idx);\n";
        break;
      case CompositionType.Vec3:
        str += "  let col0 = fetchElement(vec4_idx);\n";
        str += `  let val = ${returnType}(col0.xyz);`;
        break;
      case CompositionType.Vec3Array:
        str += "  let val = fetchVec3No16BytesAligned(scalar_idx);\n";
        break;
      case CompositionType.Vec2:
        str += "  let col0 = fetchElement(vec4_idx);\n";
        str += `  let val = ${returnType}(col0.xy);`;
        break;
      case CompositionType.Vec2Array:
        str += "  let val = fetchVec2No16BytesAligned(scalar_idx);\n";
        break;
      case CompositionType.Scalar:
        str += "  let col0 = fetchElement(vec4_idx);\n";
        if (info.componentType === ComponentType.Int) {
          str += "  let val = i32(col0.x);";
        } else if (info.componentType === ComponentType.UnsignedInt) {
          str += "  let val = u32(col0.x);";
        } else if (info.componentType === ComponentType.Bool) {
          str += "  let val = col0.x >= 0.5;";
        } else {
          str += "  let val = col0.x;";
        }
        break;
      case CompositionType.ScalarArray:
        str += "  let col0 = fetchScalarNo16BytesAligned(scalar_idx);\n";
        if (info.componentType === ComponentType.Int) {
          str += "  let val = i32(col0);";
        } else if (info.componentType === ComponentType.UnsignedInt) {
          str += "  let val = u32(col0);";
        } else if (info.componentType === ComponentType.Bool) {
          str += "  let val = col0 >= 0.5;";
        } else {
          str += "  let val = col0;";
        }
        break;
      case CompositionType.Mat4:
        str += "  let val = fetchMat4(vec4_idx);\n";
        break;
      case CompositionType.Mat4Array:
        str += "  let val = fetchMat4(vec4_idx);\n";
        break;
      case CompositionType.Mat3:
        str += "  let val = fetchMat3(vec4_idx);\n";
        break;
      case CompositionType.Mat3Array:
        str += "  let val = fetchMat3No16BytesAligned(scalar_idx);\n";
        break;
      case CompositionType.Mat2:
        str += "  let val = fetchMat2(vec4_idx);\n";
        break;
      case CompositionType.Mat2Array:
        str += "  let val = fetchMat2No16BytesAligned(scalar_idx);\n";
        break;
      case CompositionType.Mat4x3Array:
        str += "  let val = fetchMat4x3(vec4_idx);\n";
        break;
      default:
        str += "";
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
  static __getShaderPropertyOfMaterial(engine, materialTypeName, info) {
    var _a, _b;
    const returnType = info.compositionType.toWGSLType(info.componentType);
    const methodName = info.semantic.replace(".", "_");
    const isTexture = CompositionType.isTexture(info.compositionType);
    if (isTexture) {
      let textureType = "texture_2d<f32>";
      if (info.compositionType === CompositionType.TextureCube) {
        textureType = "texture_cube<f32>";
      } else if (info.compositionType === CompositionType.Texture2DArray) {
        textureType = "texture_2d_array<f32>";
      }
      const { textureName, samplerName } = getTextureAndSamplerNames(methodName);
      return `
@group(1) @binding(${info.initialValue[0]}) var ${textureName}: ${textureType};
@group(2) @binding(${info.initialValue[0]}) var ${samplerName}: sampler;
`;
    }
    const vec4SizeOfProperty = info.compositionType.getVec4SizeOfProperty();
    const scalarSizeOfProperty = info.compositionType.getNumberOfComponents();
    const offsetOfProperty = _WebGpuStrategyBasic.getOffsetOfPropertyOfMaterial(
      engine,
      info.semantic,
      materialTypeName
    );
    const materialCountPerBufferView = engine.materialRepository._getMaterialCountPerBufferView(materialTypeName);
    const offsetsName = `rnOffsets_${methodName}`;
    const offsetsStr = `const ${offsetsName}: array<u32, ${offsetOfProperty.length}> = array<u32, ${offsetOfProperty.length}>(${offsetOfProperty.map((offset) => `${offset}u`).join(", ")});`;
    let indexStr;
    let instanceSize = vec4SizeOfProperty;
    indexStr = `  let vec4_idx: u32 = ${offsetsName}[instanceIdOfBufferViews] + ${instanceSize}u * instanceIdInBufferView;
`;
    if (CompositionType.isArray(info.compositionType)) {
      instanceSize = vec4SizeOfProperty * ((_a = info.arrayLength) != null ? _a : 1);
      const paddedAsVec4 = Math.ceil(scalarSizeOfProperty / 4) * 4;
      const instanceSizeInScalar = paddedAsVec4 * ((_b = info.arrayLength) != null ? _b : 1);
      indexStr = `  let vec4_idx: u32 = ${offsetsName}[instanceIdOfBufferViews] + ${instanceSize} * instanceIdInBufferView + ${vec4SizeOfProperty}u * idxOfArray;
`;
      indexStr += `  let scalar_idx: u32 = ${offsetsName}[instanceIdOfBufferViews] * 4 + ${instanceSizeInScalar} * instanceIdInBufferView + ${scalarSizeOfProperty}u * idxOfArray;
`;
    }
    const firstPartOfInnerFunc = `
${offsetsStr}
fn get_${methodName}(instanceId: u32, idxOfArray: u32) -> ${returnType} {
  let instanceIdOfBufferViews = instanceId / ${materialCountPerBufferView};
  let instanceIdInBufferView = instanceId % ${materialCountPerBufferView};
${indexStr}
`;
    let str = `${firstPartOfInnerFunc}`;
    switch (info.compositionType) {
      case CompositionType.Vec4:
      case CompositionType.Vec4Array:
        str += "  let val = fetchElement(vec4_idx);\n";
        break;
      case CompositionType.Vec3:
        str += "  let col0 = fetchElement(vec4_idx);\n";
        str += `  let val = ${returnType}(col0.xyz);`;
        break;
      case CompositionType.Vec3Array:
        str += "  let val = fetchVec3No16BytesAligned(scalar_idx);\n";
        break;
      case CompositionType.Vec2:
        str += "  let col0 = fetchElement(vec4_idx);\n";
        str += `  let val = ${returnType}(col0.xy);`;
        break;
      case CompositionType.Vec2Array:
        str += "  let val = fetchVec2No16BytesAligned(scalar_idx);\n";
        break;
      case CompositionType.Scalar:
        str += "  let col0 = fetchElement(vec4_idx);\n";
        if (info.componentType === ComponentType.Int) {
          str += "  let val = i32(col0.x);";
        } else if (info.componentType === ComponentType.UnsignedInt) {
          str += "  let val = u32(col0.x);";
        } else if (info.componentType === ComponentType.Bool) {
          str += "  let val = col0.x >= 0.5;";
        } else {
          str += "  let val = col0.x;";
        }
        break;
      case CompositionType.ScalarArray:
        str += "  let col0 = fetchScalarNo16BytesAligned(scalar_idx);\n";
        if (info.componentType === ComponentType.Int) {
          str += "  let val = i32(col0);";
        } else if (info.componentType === ComponentType.UnsignedInt) {
          str += "  let val = u32(col0);";
        } else if (info.componentType === ComponentType.Bool) {
          str += "  let val = col0 >= 0.5;";
        } else {
          str += "  let val = col0;";
        }
        break;
      case CompositionType.Mat4:
        str += "  let val = fetchMat4(vec4_idx);\n";
        break;
      case CompositionType.Mat4Array:
        str += "  let val = fetchMat4(vec4_idx);\n";
        break;
      case CompositionType.Mat3:
        str += "  let val = fetchMat3(vec4_idx);\n";
        break;
      case CompositionType.Mat3Array:
        str += "  let val = fetchMat3No16BytesAligned(scalar_idx);\n";
        break;
      case CompositionType.Mat2:
        str += "  let val = fetchMat2(vec4_idx);\n";
        break;
      case CompositionType.Mat2Array:
        str += "  let val = fetchMat2No16BytesAligned(scalar_idx);\n";
        break;
      case CompositionType.Mat4x3Array:
        str += "  let val = fetchMat4x3(vec4_idx);\n";
        break;
      default:
        str += "";
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
  static getOffsetOfPropertyOfMaterial(engine, propertyName, materialTypeName) {
    const dataBeginPos = engine.materialRepository.getLocationOffsetOfMemberOfMaterial(
      engine,
      materialTypeName,
      propertyName
    );
    return dataBeginPos;
  }
  static getOffsetOfPropertyOfGlobalDataRepository(engine, propertyName) {
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
  $load(meshComponent) {
    const mesh = meshComponent.mesh;
    if (mesh == null) {
      return false;
    }
    if (!mesh.isSetUpDone()) {
      mesh._updateVBOAndVAO();
    }
    return true;
  }
  /**
   * Performs common loading operations required for the WebGPU strategy.
   * Initializes morph target arrays and updates blend shape storage buffers when needed.
   */
  common_$load() {
    this.__initMorphUniformBuffers();
  }
  __initMorphUniformBuffers() {
    const morphUniformDataOffsets = Primitive.getMorphUniformDataOffsets();
    const morphOffsetsUniformDataSize = Math.max(
      Math.ceil(morphUniformDataOffsets[morphUniformDataOffsets.length - 1] / 4) * 4 * 4,
      4
    );
    if (morphOffsetsUniformDataSize !== this.__lastMorphOffsetsUniformDataSize) {
      const webGpuResourceRepository = this.__engine.webGpuResourceRepository;
      if (this.__morphOffsetsUniformBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        webGpuResourceRepository.flush();
        webGpuResourceRepository.clearCache();
        webGpuResourceRepository.deleteUniformBuffer(this.__morphOffsetsUniformBufferUid);
        this.__morphOffsetsUniformBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      }
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
      if (this.__morphWeightsUniformBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        webGpuResourceRepository.flush();
        webGpuResourceRepository.clearCache();
        webGpuResourceRepository.deleteUniformBuffer(this.__morphWeightsUniformBufferUid);
        this.__morphWeightsUniformBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      }
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
  __setupShaderProgramForMeshComponent(meshComponent) {
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
  _setupShaderProgram(material, primitive) {
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
        _WebGpuStrategyBasic.getVertexShaderMethodDefinitions_storageBuffer(this.__engine, ShaderType.VertexShader),
        _WebGpuStrategyBasic.getVertexShaderMethodDefinitions_storageBuffer(this.__engine, ShaderType.PixelShader),
        _WebGpuStrategyBasic.__getShaderPropertyOfGlobalDataRepository,
        _WebGpuStrategyBasic.__getShaderPropertyOfMaterial,
        _WebGpuStrategyBasic.__getMorphedPositionGetter(this.__engine)
      );
      primitive._backupMaterial();
    } catch (e) {
      Logger.default.error(e);
      primitive._restoreMaterial();
      this.setupShaderForMaterial(
        primitive.material,
        primitive,
        _WebGpuStrategyBasic.getVertexShaderMethodDefinitions_storageBuffer(this.__engine, ShaderType.VertexShader),
        _WebGpuStrategyBasic.getVertexShaderMethodDefinitions_storageBuffer(this.__engine, ShaderType.PixelShader),
        _WebGpuStrategyBasic.__getShaderPropertyOfGlobalDataRepository,
        _WebGpuStrategyBasic.__getShaderPropertyOfMaterial,
        _WebGpuStrategyBasic.__getMorphedPositionGetter(this.__engine)
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
  setupShaderForMaterial(material, primitive, vertexShaderMethodDefinitionsForVertexShader, vertexShaderMethodDefinitionsForPixelShader, propertySetterOfGlobalDataRepository, propertySetterOfMaterial, morphedPositionGetter) {
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
  prerender() {
    if (AnimationComponent.getIsAnimating(this.__engine) || TransformComponent.getUpdateCount(this.__engine) !== this.__lastTransformComponentsUpdateCount || SceneGraphComponent.getUpdateCount(this.__engine) !== this.__lastSceneGraphComponentsUpdateCount || CameraComponent.getCurrentCameraUpdateCount(this.__engine) !== this.__lastCameraComponentsUpdateCount || _getCameraControllerUpdateCount(this.__engine) !== this.__lastCameraControllerComponentsUpdateCount || this.__engine.materialRepository.stateVersion !== this.__lastMaterialsUpdateCount || this.__engine.lightClusterSystem.dataVersion !== this.__lastLightClusterDataVersion || LightComponent.getUpdateCount(this.__engine) !== this.__lastLightComponentsUpdateCount) {
      const isStorageBufferRecreated = this.__createAndUpdateStorageBuffer();
      this.__engine.webGpuResourceRepository._markGpuCullingInputsDirty();
      const lightClusterDataVersion = this.__engine.lightClusterSystem.dataVersion;
      if (isStorageBufferRecreated || lightClusterDataVersion !== this.__lastLightClusterBuildDataVersion) {
        this.__buildLightClustersOnGpu();
        this.__lastLightClusterBuildDataVersion = lightClusterDataVersion;
      }
      this.__lastTransformComponentsUpdateCount = TransformComponent.getUpdateCount(this.__engine);
      this.__lastSceneGraphComponentsUpdateCount = SceneGraphComponent.getUpdateCount(this.__engine);
      this.__lastCameraComponentsUpdateCount = CameraComponent.getCurrentCameraUpdateCount(this.__engine);
      this.__lastCameraControllerComponentsUpdateCount = _getCameraControllerUpdateCount(this.__engine);
      this.__lastMaterialsUpdateCount = this.__engine.materialRepository.stateVersion;
      this.__lastLightClusterDataVersion = this.__engine.lightClusterSystem.dataVersion;
      this.__lastLightComponentsUpdateCount = LightComponent.getUpdateCount(this.__engine);
    }
    const morphMaxIndex = Primitive.getPrimitiveCountHasMorph();
    if (morphMaxIndex !== this.__lastMorphMaxIndex) {
      this.__createOrUpdateStorageBlendShapeBuffer();
      this.__lastMorphMaxIndex = morphMaxIndex;
      this.__engine.webGpuResourceRepository._markGpuCullingInputsDirty();
    }
    if (BlendShapeComponent.updateCount !== this.__lastBlendShapeComponentsUpdateCountForWeights || BlendShapeComponent.getCountOfBlendShapeComponents(this.__engine) !== this.__countOfBlendShapeComponents) {
      this.__updateMorphWeightsUniformBuffer();
      this.__engine.webGpuResourceRepository._markGpuCullingInputsDirty();
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
  common_$render(primitiveUids, renderPass, _renderPassTickCount, displayIdx) {
    if (renderPass.isBufferLessRenderingMode()) {
      this.__renderWithoutBuffers(renderPass);
      return true;
    }
    let renderedSomething = false;
    const isZWrite = renderPass.isDepthTest && renderPass.depthWriteMask;
    const useDepthPrepass = this.__isDepthPrepassAvailable(renderPass);
    if (useDepthPrepass) {
      for (let i = renderPass._lastOpaqueIndex; i >= 0; i--) {
        this.renderInner(primitiveUids[i], renderPass, true, displayIdx, { depthOnly: true });
      }
    }
    if (renderPass._toRenderOpaquePrimitives) {
      for (let i = renderPass._lastOpaqueIndex; i >= 0; i--) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.renderInner(primitiveUid, renderPass, isZWrite, displayIdx, {
          allowEqualDepth: useDepthPrepass
        });
        renderedSomething || (renderedSomething = rendered);
      }
    }
    if (renderPass._toRenderTranslucentPrimitives) {
      for (let i = renderPass._lastOpaqueIndex + 1; i <= renderPass._lastTranslucentIndex; i++) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.renderInner(primitiveUid, renderPass, isZWrite, displayIdx);
        renderedSomething || (renderedSomething = rendered);
      }
    }
    if (renderPass._toRenderBlendWithZWritePrimitives) {
      for (let i = renderPass._lastTranslucentIndex + 1; i <= renderPass._lastBlendWithZWriteIndex; i++) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.renderInner(primitiveUid, renderPass, isZWrite, displayIdx);
        renderedSomething || (renderedSomething = rendered);
      }
    }
    if (renderPass._toRenderBlendWithoutZWritePrimitives) {
      for (let i = renderPass._lastBlendWithZWriteIndex + 1; i <= renderPass._lastBlendWithoutZWriteIndex; i++) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.renderInner(primitiveUid, renderPass, false, displayIdx);
        renderedSomething || (renderedSomething = rendered);
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
  __renderWithoutBuffers(renderPass) {
    const material = renderPass.material;
    const primitive = renderPass._dummyPrimitiveForBufferLessRendering;
    this._setupShaderProgram(material, primitive);
    const webGpuResourceRepository = this.__engine.webGpuResourceRepository;
    const cameraSID = this.__getAppropriateCameraComponentSID(renderPass, 0, false);
    webGpuResourceRepository.setDrawParameters(material.materialSID, cameraSID, 0, 0);
    const isZWrite = renderPass.isDepthTest && renderPass.depthWriteMask;
    webGpuResourceRepository.draw(this.__engine, primitive, material, renderPass, cameraSID, isZWrite, 0);
  }
  /**
   * Whether the depth prepass can run for the render pass: it must be enabled, draw the scene itself (render passes
   * with a material override such as shadow maps and post effects are excluded), and write depth.
   */
  __isDepthPrepassAvailable(renderPass) {
    const framebuffer = renderPass.getFramebuffer();
    return this.__engine.config.isDepthPrepassEnabled && renderPass.material == null && renderPass.isDepthTest && renderPass.depthWriteMask && (framebuffer == null || framebuffer.depthAttachment != null) && renderPass._toRenderOpaquePrimitives && renderPass._lastOpaqueIndex >= 0;
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
  renderInner(primitiveUid, renderPass, zWrite, displayIdx, options = {}) {
    var _a, _b;
    if (primitiveUid === -1) {
      return false;
    }
    const primitive = Primitive.getPrimitive(primitiveUid);
    if (primitive == null) {
      return false;
    }
    const material = renderPass.getAppropriateMaterial(primitive);
    this._setupShaderProgram(material, primitive);
    if (isSkipDrawing(material, primitive)) {
      return false;
    }
    if (options.depthOnly && (material.alphaMode === AlphaMode.Mask || material.alphaToCoverage || material.isShaderDefine("RN_USE_WIREFRAME"))) {
      return false;
    }
    const webGpuResourceRepository = this.__engine.webGpuResourceRepository;
    const webxrSystem = this.__engine._webXRSystemIfEnabled;
    const cameraSID = this.__getAppropriateCameraComponentSID(
      renderPass,
      displayIdx,
      ((_a = webxrSystem == null ? void 0 : webxrSystem.isWebXRMode) != null ? _a : false) && renderPass.isVrRendering
    );
    const primitiveIdxHasMorph = (_b = Primitive.getPrimitiveIdxHasMorph(primitive.primitiveUid)) != null ? _b : 0;
    webGpuResourceRepository.setDrawParameters(
      material.materialSID,
      cameraSID,
      primitiveIdxHasMorph,
      primitive.targets.length
    );
    webGpuResourceRepository.draw(
      this.__engine,
      primitive,
      material,
      renderPass,
      cameraSID,
      zWrite,
      displayIdx,
      options
    );
    return true;
  }
  /**
   * Creates or updates the main storage buffer containing all GPU instance data.
   * This buffer holds transform matrices, material properties, and other per-instance data
   * required for rendering all objects in the scene.
   */
  __createAndUpdateStorageBuffer() {
    const memoryManager = this.__engine.memoryManager;
    const gpuInstanceDataBuffers = memoryManager.getBuffers(BufferUse.GPUInstanceData);
    const gpuInstanceDataBufferCount = gpuInstanceDataBuffers.length;
    const webGpuResourceRepository = this.__engine.webGpuResourceRepository;
    if (gpuInstanceDataBufferCount !== this.__lastGpuInstanceDataBufferCount) {
      this.__lastGpuInstanceDataBufferCount = gpuInstanceDataBufferCount;
      webGpuResourceRepository.destroyStorageBuffer(this.__storageBufferUid);
      this.__storageBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
    if (this.__storageBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const lightClusterSystem = this.__engine.lightClusterSystem;
      webGpuResourceRepository.updateStorageBuffer(
        this.__storageBufferUid,
        gpuInstanceDataBuffers,
        lightClusterSystem._getExcludedByteRanges()
      );
      const dirtyRanges = lightClusterSystem._takeDirtyByteRanges();
      if (dirtyRanges.length > 0) {
        webGpuResourceRepository.updateStorageBufferRanges(
          this.__storageBufferUid,
          gpuInstanceDataBuffers,
          dirtyRanges
        );
      }
      return false;
    }
    this.__storageBufferUid = webGpuResourceRepository.createStorageBuffer(gpuInstanceDataBuffers);
    this.__engine.lightClusterSystem._takeDirtyByteRanges();
    return true;
  }
  /**
   * Builds the Clustered Forward light cluster tables with compute shaders when the LightClusterSystem
   * builds them on the GPU. It must run after every upload of the GPU instance data, which overwrites the tables.
   */
  __buildLightClustersOnGpu() {
    var _a;
    const params = this.__engine.lightClusterSystem._getGpuBuildParams();
    if (params == null) {
      return;
    }
    const webGpuResourceRepository = this.__engine.webGpuResourceRepository;
    const storageBuffer = webGpuResourceRepository._getStorageBuffer();
    if (storageBuffer == null) {
      return;
    }
    (_a = this.__lightClusterBuilder) != null ? _a : this.__lightClusterBuilder = new WebGpuLightClusterBuilder(
      webGpuResourceRepository.getWebGpuDeviceWrapper().gpuDevice
    );
    const gpuTimer = this.__engine.gpuTimerEnabled ? webGpuResourceRepository._getGpuTimer() : void 0;
    this.__lightClusterBuilder.build(storageBuffer, params, gpuTimer);
  }
  /**
   * Creates or updates the storage buffer containing blend shape vertex data.
   * This buffer holds morph target positions and other vertex attributes needed for blend shape animation.
   */
  __createOrUpdateStorageBlendShapeBuffer() {
    const memoryManager = this.__engine.memoryManager;
    const blendShapeDataBuffers = memoryManager.getBuffers(BufferUse.GPUVertexData);
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
    let offset = 0;
    for (let i = 0; i < blendShapeDataBuffers.length; i++) {
      const buffer = blendShapeDataBuffers[i];
      float32Array.set(new Float32Array(buffer.getArrayBuffer()), offset);
      offset += buffer.byteLength / 4;
    }
    if (this.__storageBlendShapeBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const componentSizeForDataTexture = blendShapeDataBufferByteLength / 4;
      webGpuResourceRepository.updateStorageBlendShapeBuffer(
        this.__storageBlendShapeBufferUid,
        float32Array,
        componentSizeForDataTexture
      );
    } else {
      this.__storageBlendShapeBufferUid = webGpuResourceRepository.createStorageBlendShapeBuffer(float32Array);
    }
    this.__updateMorphOffsetsUniformBuffer();
  }
  __updateMorphOffsetsUniformBuffer() {
    const webGpuResourceRepository = this.__engine.webGpuResourceRepository;
    const morphUniformDataOffsets = Primitive.getMorphUniformDataOffsets();
    for (let i = 0; i < Primitive.getPrimitiveCountHasMorph(); i++) {
      const primitive = Primitive.getPrimitiveHasMorph(i);
      if (primitive != null) {
        for (let j = 0; j < primitive.targets.length; j++) {
          const target = primitive.targets[j];
          const accessor = target.get(VertexAttribute.Position.XYZ);
          const byteOffsetOfExistingBuffer = this.__engine.memoryManager.getByteOffsetOfExistingBuffers(
            BufferUse.GPUVertexData,
            accessor.bufferView.buffer.indexOfTheBufferUsage
          );
          this.__uniformMorphOffsetsTypedArray[morphUniformDataOffsets[i] + j] = (byteOffsetOfExistingBuffer + accessor.byteOffsetInBuffer) / 4 / 4;
        }
      } else {
        break;
      }
    }
    const elementNumToCopy = morphUniformDataOffsets[morphUniformDataOffsets.length - 1];
    webGpuResourceRepository.updateUniformMorphOffsetsBuffer(this.__uniformMorphOffsetsTypedArray, elementNumToCopy);
  }
  /**
   * Updates uniform buffers containing morph target weights for blend shape animation.
   * Copies weight values from blend shape components to GPU-accessible uniform buffers.
   */
  __updateMorphWeightsUniformBuffer() {
    const memoryManager = this.__engine.memoryManager;
    const blendShapeDataBuffer = memoryManager.getBuffer(BufferUse.GPUVertexData);
    if (blendShapeDataBuffer == null) {
      return;
    }
    if (blendShapeDataBuffer.takenSizeInByte === 0) {
      return;
    }
    const blendShapeUniformDataOffsets = BlendShapeComponent.getOffsetsInUniform(this.__engine);
    const blendShapeComponents = this.__engine.componentRepository.getComponentsWithTypeWithoutFiltering(
      BlendShapeComponent
    );
    for (let i = 0; i < blendShapeComponents.length; i++) {
      const blendShapeComponent = blendShapeComponents[i];
      const weights = blendShapeComponent != null ? blendShapeComponent.weights : [];
      for (let j = 0; j < weights.length; j++) {
        this.__uniformMorphWeightsTypedArray[blendShapeUniformDataOffsets[i] + j] = weights[j];
      }
    }
    if (blendShapeComponents.length > 0) {
      const webGpuResourceRepository = this.__engine.webGpuResourceRepository;
      const elementNumToCopy = blendShapeUniformDataOffsets[blendShapeUniformDataOffsets.length - 1];
      webGpuResourceRepository.updateUniformMorphWeightsBuffer(this.__uniformMorphWeightsTypedArray, elementNumToCopy);
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
  __getAppropriateCameraComponentSID(renderPass, displayIdx, isVRMainPass) {
    if (isVRMainPass) {
      const webxrSystem = this.__engine._webXRSystemIfEnabled;
      let cameraComponentSid = -1;
      if (webxrSystem == null ? void 0 : webxrSystem.isWebXRMode) {
        if (webxrSystem.isMultiView()) {
          cameraComponentSid = webxrSystem._getCameraComponentSIDAt(0);
        } else {
          cameraComponentSid = webxrSystem._getCameraComponentSIDAt(displayIdx);
        }
      }
      return cameraComponentSid;
    }
    let cameraComponent = renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = this.__engine.componentRepository.getComponent(
        CameraComponent,
        CameraComponent.getCurrent(this.__engine)
      );
    }
    if (cameraComponent) {
      return cameraComponent.componentSID;
    }
    return -1;
  }
  /**
   * Destroys all GPU resources held by this strategy.
   * Should be called when the engine is being destroyed.
   */
  destroy() {
    var _a;
    const webGpuResourceRepository = this.__engine.webGpuResourceRepository;
    (_a = this.__lightClusterBuilder) == null ? void 0 : _a.destroy();
    this.__lightClusterBuilder = void 0;
    webGpuResourceRepository._destroyGpuCulling();
    if (this.__storageBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      webGpuResourceRepository.destroyStorageBuffer(this.__storageBufferUid);
      this.__storageBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
    if (this.__storageBlendShapeBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      webGpuResourceRepository.deleteStorageBlendShapeBuffer(this.__storageBlendShapeBufferUid);
      this.__storageBlendShapeBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
    if (this.__morphOffsetsUniformBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      webGpuResourceRepository.deleteUniformBuffer(this.__morphOffsetsUniformBufferUid);
      this.__morphOffsetsUniformBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
    if (this.__morphWeightsUniformBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      webGpuResourceRepository.deleteUniformBuffer(this.__morphWeightsUniformBufferUid);
      this.__morphWeightsUniformBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
  }
};
export {
  WebGpuStrategyBasic
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3JjL3dlYmdwdS9XZWJHcHVTdHJhdGVneUJhc2ljLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBBbmltYXRpb25Db21wb25lbnQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvbXBvbmVudHMvQW5pbWF0aW9uL0FuaW1hdGlvbkNvbXBvbmVudCc7XG5pbXBvcnQgeyBCbGVuZFNoYXBlQ29tcG9uZW50IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb21wb25lbnRzL0JsZW5kU2hhcGUvQmxlbmRTaGFwZUNvbXBvbmVudCc7XG5pbXBvcnQgeyBDYW1lcmFDb21wb25lbnQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvbXBvbmVudHMvQ2FtZXJhL0NhbWVyYUNvbXBvbmVudCc7XG5pbXBvcnQgeyBfZ2V0Q2FtZXJhQ29udHJvbGxlclVwZGF0ZUNvdW50IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb21wb25lbnRzL0NhbWVyYUNvbnRyb2xsZXIvQ2FtZXJhQ29udHJvbGxlclVwZGF0ZUNvdW50JztcbmltcG9ydCB7IExpZ2h0Q29tcG9uZW50IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb21wb25lbnRzL0xpZ2h0L0xpZ2h0Q29tcG9uZW50JztcbmltcG9ydCB7IE1lc2hDb21wb25lbnQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvbXBvbmVudHMvTWVzaC9NZXNoQ29tcG9uZW50JztcbmltcG9ydCB7IFNjZW5lR3JhcGhDb21wb25lbnQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvbXBvbmVudHMvU2NlbmVHcmFwaC9TY2VuZUdyYXBoQ29tcG9uZW50JztcbmltcG9ydCB7IFRyYW5zZm9ybUNvbXBvbmVudCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29tcG9uZW50cy9UcmFuc2Zvcm0vVHJhbnNmb3JtQ29tcG9uZW50JztcbmltcG9ydCB7IENvbXBvbmVudCwgdHlwZSBNZW1iZXJJbmZvIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb3JlL0NvbXBvbmVudCc7XG5pbXBvcnQgeyBBbHBoYU1vZGUgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL0FscGhhTW9kZSc7XG5pbXBvcnQgeyBCdWZmZXJVc2UgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL0J1ZmZlclVzZSc7XG5pbXBvcnQgeyBDb21wb25lbnRUeXBlIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9Db21wb25lbnRUeXBlJztcbmltcG9ydCB7IENvbXBvc2l0aW9uVHlwZSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvQ29tcG9zaXRpb25UeXBlJztcbmltcG9ydCB0eXBlIHtcbiAgZ2V0U2hhZGVyUHJvcGVydHlGdW5jT2ZHbG9iYWxEYXRhUmVwb3NpdG9yeSxcbiAgZ2V0U2hhZGVyUHJvcGVydHlGdW5jT2ZNYXRlcmlhbCxcbiAgU2hhZGVyU2VtYW50aWNzTmFtZSxcbn0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9TaGFkZXJTZW1hbnRpY3MnO1xuaW1wb3J0IHR5cGUgeyBTaGFkZXJTZW1hbnRpY3NJbmZvIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9TaGFkZXJTZW1hbnRpY3NJbmZvJztcbmltcG9ydCB7IFNoYWRlclR5cGUsIHR5cGUgU2hhZGVyVHlwZUVudW0gfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1NoYWRlclR5cGUnO1xuaW1wb3J0IHsgVmVydGV4QXR0cmlidXRlIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9WZXJ0ZXhBdHRyaWJ1dGUnO1xuaW1wb3J0IHsgUHJpbWl0aXZlIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9nZW9tZXRyeS9QcmltaXRpdmUnO1xuaW1wb3J0IHsgZ2V0VGV4dHVyZUFuZFNhbXBsZXJOYW1lcyB9IGZyb20gJy4uL2ZvdW5kYXRpb24vaGVscGVycy9TaGFkZXJIZWxwZXInO1xuaW1wb3J0IHR5cGUgeyBNYXRlcmlhbCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWF0ZXJpYWxzL2NvcmUvTWF0ZXJpYWwnO1xuaW1wb3J0IHR5cGUgeyBBY2Nlc3NvciB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWVtb3J5L0FjY2Vzc29yJztcbmltcG9ydCB0eXBlIHsgQnVmZmVyIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9tZW1vcnkvQnVmZmVyJztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHsgQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkgfSBmcm9tICcuLi9mb3VuZGF0aW9uL3JlbmRlcmVyL0NHQVBJUmVzb3VyY2VSZXBvc2l0b3J5JztcbmltcG9ydCB0eXBlIHsgQ0dBUElTdHJhdGVneSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vcmVuZGVyZXIvQ0dBUElTdHJhdGVneSc7XG5pbXBvcnQgeyBpc1NraXBEcmF3aW5nIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9yZW5kZXJlci9SZW5kZXJpbmdDb21tb25NZXRob2RzJztcbmltcG9ydCB0eXBlIHsgUmVuZGVyUGFzcyB9IGZyb20gJy4uL2ZvdW5kYXRpb24vcmVuZGVyZXIvUmVuZGVyUGFzcyc7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgdHlwZSB7XG4gIENHQVBJUmVzb3VyY2VIYW5kbGUsXG4gIENvdW50LFxuICBJbmRleCxcbiAgSW5kZXhPZjRCeXRlcyxcbiAgSW5kZXhPZjE2Qnl0ZXMsXG4gIFByaW1pdGl2ZVVJRCxcbn0gZnJvbSAnLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgV2ViR3B1TGlnaHRDbHVzdGVyQnVpbGRlciB9IGZyb20gJy4vV2ViR3B1TGlnaHRDbHVzdGVyQnVpbGRlcic7XG5cbi8qKlxuICogQmFzaWMgV2ViR1BVIHJlbmRlcmluZyBzdHJhdGVneSBpbXBsZW1lbnRhdGlvbiB0aGF0IGhhbmRsZXMgbWVzaCByZW5kZXJpbmcsXG4gKiBzdG9yYWdlIGJ1ZmZlciBtYW5hZ2VtZW50LCBhbmQgc2hhZGVyIHByb2dyYW0gc2V0dXAgZm9yIFdlYkdQVS1iYXNlZCByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKlxuICogVGhpcyBjbGFzcyBwcm92aWRlcyBhIGNvbXBsZXRlIHJlbmRlcmluZyBzb2x1dGlvbiB1c2luZyBXZWJHUFUgQVBJLCBpbmNsdWRpbmc6XG4gKiAtIFN0b3JhZ2UgYnVmZmVyIG1hbmFnZW1lbnQgZm9yIGVmZmljaWVudCBHUFUgZGF0YSB0cmFuc2ZlclxuICogLSBTaGFkZXIgcHJvZ3JhbSBjb21waWxhdGlvbiBhbmQgc2V0dXBcbiAqIC0gTW9ycGggdGFyZ2V0IGFuZCBibGVuZCBzaGFwZSBoYW5kbGluZ1xuICogLSBDYW1lcmEgYW5kIHRyYW5zZm9ybSBtYXRyaXggdXBkYXRlc1xuICogLSBSZW5kZXIgcGFzcyBleGVjdXRpb24gd2l0aCBwcm9wZXIgcHJpbWl0aXZlIHNvcnRpbmdcbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogY29uc3Qgc3RyYXRlZ3kgPSBXZWJHcHVTdHJhdGVneUJhc2ljLmdldEluc3RhbmNlKCk7XG4gKiBzdHJhdGVneS5wcmVyZW5kZXIoKTtcbiAqIHN0cmF0ZWd5LmNvbW1vbl8kcmVuZGVyKHByaW1pdGl2ZVVpZHMsIHJlbmRlclBhc3MsIHRpY2tDb3VudCk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIFdlYkdwdVN0cmF0ZWd5QmFzaWMgaW1wbGVtZW50cyBDR0FQSVN0cmF0ZWd5IHtcbiAgcHJpdmF0ZSBfX2VuZ2luZTogRW5naW5lO1xuICBwcml2YXRlIF9fc3RvcmFnZUJ1ZmZlclVpZDogQ0dBUElSZXNvdXJjZUhhbmRsZSA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICBwcml2YXRlIF9fc3RvcmFnZUJsZW5kU2hhcGVCdWZmZXJVaWQ6IENHQVBJUmVzb3VyY2VIYW5kbGUgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgcHJpdmF0ZSBfX3VuaWZvcm1Nb3JwaE9mZnNldHNUeXBlZEFycmF5PzogVWludDMyQXJyYXk7XG4gIHByaXZhdGUgX191bmlmb3JtTW9ycGhXZWlnaHRzVHlwZWRBcnJheT86IEZsb2F0MzJBcnJheTtcblxuICBwcml2YXRlIF9fbGFzdE1hdGVyaWFsc1VwZGF0ZUNvdW50ID0gLTE7XG4gIHByaXZhdGUgX19sYXN0TGlnaHRDbHVzdGVyRGF0YVZlcnNpb24gPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RMaWdodENvbXBvbmVudHNVcGRhdGVDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fbGlnaHRDbHVzdGVyQnVpbGRlcj86IFdlYkdwdUxpZ2h0Q2x1c3RlckJ1aWxkZXI7XG4gIHByaXZhdGUgX19sYXN0TGlnaHRDbHVzdGVyQnVpbGREYXRhVmVyc2lvbiA9IC0xO1xuICBwcml2YXRlIF9fbGFzdFRyYW5zZm9ybUNvbXBvbmVudHNVcGRhdGVDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdFNjZW5lR3JhcGhDb21wb25lbnRzVXBkYXRlQ291bnQgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RDYW1lcmFDb21wb25lbnRzVXBkYXRlQ291bnQgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gLTE7XG5cbiAgcHJpdmF0ZSBfX2xhc3RCbGVuZFNoYXBlQ29tcG9uZW50c1VwZGF0ZUNvdW50Rm9yV2VpZ2h0cyA9IC0xO1xuICBwcml2YXRlIF9fbGFzdE1vcnBoTWF4SW5kZXggPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RHcHVJbnN0YW5jZURhdGFCdWZmZXJDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdE1vcnBoT2Zmc2V0c1VuaWZvcm1EYXRhU2l6ZSA9IC0xO1xuICBwcml2YXRlIF9fbGFzdE1vcnBoV2VpZ2h0c1VuaWZvcm1EYXRhU2l6ZSA9IC0xO1xuICBwcml2YXRlIF9fbW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlclVpZCA9IC0xO1xuICBwcml2YXRlIF9fbW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlclVpZCA9IC0xO1xuICBwcml2YXRlIF9fc3RvcmFnZUJsZW5kU2hhcGVCdWZmZXJCeXRlTGVuZ3RoID0gLTE7XG4gIHByaXZhdGUgX19jb3VudE9mQmxlbmRTaGFwZUNvbXBvbmVudHMgPSAtMTtcblxuICBwcml2YXRlIGNvbnN0cnVjdG9yKGVuZ2luZTogRW5naW5lKSB7XG4gICAgdGhpcy5fX2VuZ2luZSA9IGVuZ2luZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzaW5nbGV0b24gaW5zdGFuY2Ugb2YgV2ViR3B1U3RyYXRlZ3lCYXNpYy5cbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBpZiBub25lIGV4aXN0cy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiBXZWJHcHVTdHJhdGVneUJhc2ljXG4gICAqL1xuICBzdGF0aWMgaW5pdChlbmdpbmU6IEVuZ2luZSkge1xuICAgIHJldHVybiBuZXcgV2ViR3B1U3RyYXRlZ3lCYXNpYyhlbmdpbmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyB2ZXJ0ZXggc2hhZGVyIG1ldGhvZCBkZWZpbml0aW9ucyBmb3Igc3RvcmFnZSBidWZmZXIgYWNjZXNzLlxuICAgKiBUaGVzZSBtZXRob2RzIHByb3ZpZGUgc3RhbmRhcmRpemVkIGFjY2VzcyB0byB0cmFuc2Zvcm0gbWF0cmljZXMsIHZpc2liaWxpdHkgZmxhZ3MsXG4gICAqIGFuZCBtb3JwaGluZyBmdW5jdGlvbmFsaXR5IGluIHZlcnRleCBzaGFkZXJzLlxuICAgKlxuICAgKiBAcmV0dXJucyBXR1NMIHNoYWRlciBjb2RlIGNvbnRhaW5pbmcgaGVscGVyIGZ1bmN0aW9ucyBmb3Igc3RvcmFnZSBidWZmZXIgYWNjZXNzXG4gICAqL1xuICBzdGF0aWMgZ2V0VmVydGV4U2hhZGVyTWV0aG9kRGVmaW5pdGlvbnNfc3RvcmFnZUJ1ZmZlcihlbmdpbmU6IEVuZ2luZSwgc2hhZGVyVHlwZTogU2hhZGVyVHlwZUVudW0pIHtcbiAgICBsZXQgc3RyID0gJyc7XG4gICAgY29uc3QgbWVtYmVySW5mbyA9IENvbXBvbmVudC5nZXRNZW1iZXJJbmZvKGVuZ2luZSk7XG4gICAgbWVtYmVySW5mby5mb3JFYWNoKChtYXBNZW1iZXJOYW1lTWVtYmVySW5mbywgY29tcG9uZW50Q2xhc3MpID0+IHtcbiAgICAgIG1hcE1lbWJlck5hbWVNZW1iZXJJbmZvLmZvckVhY2goKG1lbWJlckluZm8sIG1lbWJlck5hbWUpID0+IHtcbiAgICAgICAgaWYgKG1lbWJlckluZm8uc2hhZGVyVHlwZSAhPT0gc2hhZGVyVHlwZSAmJiBtZW1iZXJJbmZvLnNoYWRlclR5cGUgIT09IFNoYWRlclR5cGUuVmVydGV4QW5kUGl4ZWxTaGFkZXIpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3ID0gQ29tcG9uZW50LmdldENvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldyhlbmdpbmUpLmdldChjb21wb25lbnRDbGFzcykgPz8gMTtcbiAgICAgICAgaWYgKENvbXBvc2l0aW9uVHlwZS5pc0FycmF5KG1lbWJlckluZm8uY29tcG9zaXRpb25UeXBlKSkge1xuICAgICAgICAgIHByb2Nlc3NGb3JBcnJheVR5cGUobWVtYmVySW5mbywgY29tcG9uZW50Q2xhc3MsIG1lbWJlck5hbWUsIGNvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJvY2Vzc0Zvck5vbkFycmF5VHlwZShtZW1iZXJJbmZvLCBjb21wb25lbnRDbGFzcywgbWVtYmVyTmFtZSwgY29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gc3RyO1xuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc0ZvckFycmF5VHlwZShcbiAgICAgIG1lbWJlckluZm86IE1lbWJlckluZm8sXG4gICAgICBjb21wb25lbnRDbGFzczogdHlwZW9mIENvbXBvbmVudCxcbiAgICAgIG1lbWJlck5hbWU6IHN0cmluZyxcbiAgICAgIGNvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldzogbnVtYmVyXG4gICAgKSB7XG4gICAgICBsZXQgdHlwZVN0ciA9ICcnO1xuICAgICAgbGV0IGZldGNoVHlwZVN0ciA9ICcnO1xuICAgICAgc3dpdGNoIChtZW1iZXJJbmZvLmNvbXBvc2l0aW9uVHlwZSkge1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWM0QXJyYXk6XG4gICAgICAgICAgdHlwZVN0ciA9ICd2ZWM0PGYzMj4nO1xuICAgICAgICAgIGZldGNoVHlwZVN0ciA9ICdmZXRjaFZlYzQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQ0QXJyYXk6XG4gICAgICAgICAgdHlwZVN0ciA9ICdtYXQ0eDQ8ZjMyPic7XG4gICAgICAgICAgZmV0Y2hUeXBlU3RyID0gJ2ZldGNoTWF0NCc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDR4M0FycmF5OlxuICAgICAgICAgIHR5cGVTdHIgPSAnbWF0NHgzPGYzMj4nO1xuICAgICAgICAgIGZldGNoVHlwZVN0ciA9ICdmZXRjaE1hdDR4Myc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBjb21wb3NpdGlvbiB0eXBlOiAke21lbWJlckluZm8uY29tcG9zaXRpb25UeXBlLnN0cn1gKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHZlYzRTaXplT2ZQcm9wZXJ0eTogSW5kZXhPZjE2Qnl0ZXMgPSBtZW1iZXJJbmZvLmNvbXBvc2l0aW9uVHlwZS5nZXRWZWM0U2l6ZU9mUHJvcGVydHkoKTtcblxuICAgICAgaWYgKG1lbWJlckluZm8uaXNWYXJpYWJsZUxlbmd0aCA9PT0gdHJ1ZSkge1xuICAgICAgICAvLyBFYWNoIGluc3RhbmNlIGhhcyBpdHMgb3duIGNodW5rLiBJdHMgbG9jYXRpb24gaXMgc3RvcmVkIGluIHRoZSBgJHttZW1iZXJOYW1lfUxvY2F0aW9uYCBtZW1iZXIuXG4gICAgICAgIGNvbnN0IHJhZGl4ID0gQ29tcG9uZW50Ll92YXJpYWJsZUxlbmd0aExvY2F0aW9uUmFkaXg7XG4gICAgICAgIHN0ciArPSBgXG4gIGZuIGdldF8ke21lbWJlck5hbWV9KGluc3RhbmNlSWQ6IHUzMiwgaWR4T2ZBcnJheTogdTMyKSAtPiAke3R5cGVTdHJ9IHtcbiAgICBsZXQgbG9jYXRpb24gPSBnZXRfJHtDb21wb25lbnQuX2dldFZhcmlhYmxlTGVuZ3RoTG9jYXRpb25NZW1iZXJOYW1lKG1lbWJlck5hbWUpfShpbnN0YW5jZUlkKTtcbiAgICBsZXQgaW5kZXg6IHUzMiA9IHUzMihsb2NhdGlvbi54KSAqICR7cmFkaXh9dSArIHUzMihsb2NhdGlvbi55KSArICR7dmVjNFNpemVPZlByb3BlcnR5fXUgKiBpZHhPZkFycmF5O1xuICAgIGxldCB2YWx1ZSA9ICR7ZmV0Y2hUeXBlU3RyfShpbmRleCk7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIGA7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbG9jYXRpb25PZmZzZXRzX3ZlYzRfaWR4ID0gQ29tcG9uZW50LmdldExvY2F0aW9uT2Zmc2V0T2ZNZW1iZXJPZkNvbXBvbmVudChcbiAgICAgICAgZW5naW5lLFxuICAgICAgICBjb21wb25lbnRDbGFzcyxcbiAgICAgICAgbWVtYmVyTmFtZVxuICAgICAgKTtcbiAgICAgIGNvbnN0IGFycmF5TGVuZ3RoID0gQ29tcG9uZW50LmdldEFycmF5TGVuZ3RoT2ZNZW1iZXIoZW5naW5lKS5nZXQoY29tcG9uZW50Q2xhc3MpPy5nZXQobWVtYmVyTmFtZSkgPz8gMDtcbiAgICAgIGNvbnN0IGFycmF5TGVuZ3RoU3RyID0gYGxldCBhcnJheUxlbmd0aDogdTMyID0gJHthcnJheUxlbmd0aH11O2A7XG4gICAgICAvLyBUaGUgb2Zmc2V0cyBvZiB0aGUgYnVmZmVyIHZpZXdzIGFyZSBhIGNvbXBpbGUtdGltZSBjb25zdGFudC4gVGhleSBtdXN0IGJlIGRlY2xhcmVkIGF0IG1vZHVsZSBzY29wZTogYVxuICAgICAgLy8gdmFyPGZ1bmN0aW9uPiBhcnJheSBpcyBpbml0aWFsaXplZCBvbiBldmVyeSBjYWxsLCB3aGljaCBpcyBleHBlbnNpdmUgd2hlbiBhIHNjZW5lIGhhcyBtYW55IGNvbXBvbmVudHMgb2ZcbiAgICAgIC8vIHRoZSBjbGFzcyAodGhlIHRhYmxlIGhhcyBvbmUgZW50cnkgcGVyIGJ1ZmZlciB2aWV3LCBpLmUuIHBlciBjYW1lcmEgZm9yIGNhbWVyYUNvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldyAxKS5cbiAgICAgIGNvbnN0IGluZGljZXNOYW1lID0gYHJuSW5kaWNlc18ke21lbWJlck5hbWV9YDtcbiAgICAgIGNvbnN0IGluZGV4U3RyID0gYCR7aW5kaWNlc05hbWV9W2luc3RhbmNlSWRPZkJ1ZmZlclZpZXdzXSArIGluc3RhbmNlSWRJbkJ1ZmZlclZpZXcgKiAke3ZlYzRTaXplT2ZQcm9wZXJ0eX11ICogYXJyYXlMZW5ndGggKyAke3ZlYzRTaXplT2ZQcm9wZXJ0eX11ICogaWR4T2ZBcnJheTtgOyAvLyB2ZWM0X2lkeFxuICAgICAgbGV0IGNvbnZlcnNpb25TdHIgPSAnJztcbiAgICAgIGlmIChtZW1iZXJJbmZvLmNvbnZlcnRUb0Jvb2wpIHtcbiAgICAgICAgY29udmVyc2lvblN0ciA9ICdpZiAodmFsdWUgPiAwLjUpIHsgcmV0dXJuIHRydWU7IH0gZWxzZSB7IHJldHVybiBmYWxzZTsgfSc7XG4gICAgICB9XG4gICAgICBzdHIgKz0gYFxuICBjb25zdCAke2luZGljZXNOYW1lfTogYXJyYXk8dTMyLCAke2xvY2F0aW9uT2Zmc2V0c192ZWM0X2lkeC5sZW5ndGh9PiA9IGFycmF5PHUzMiwgJHtsb2NhdGlvbk9mZnNldHNfdmVjNF9pZHgubGVuZ3RofT4oJHtsb2NhdGlvbk9mZnNldHNfdmVjNF9pZHgubWFwKG9mZnNldCA9PiBgJHtvZmZzZXR9dWApLmpvaW4oJywgJyl9KTtcbiAgZm4gZ2V0XyR7bWVtYmVyTmFtZX0oaW5zdGFuY2VJZDogdTMyLCBpZHhPZkFycmF5OiB1MzIpIC0+ICR7bWVtYmVySW5mby5jb252ZXJ0VG9Cb29sID8gJ2Jvb2wnIDogdHlwZVN0cn0ge1xuICAgIGxldCBpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3cyA9IGluc3RhbmNlSWQgLyAke2NvbXBvbmVudENvdW50UGVyQnVmZmVyVmlld307XG4gICAgbGV0IGluc3RhbmNlSWRJbkJ1ZmZlclZpZXcgPSBpbnN0YW5jZUlkICUgJHtjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXd9O1xuICAgICR7YXJyYXlMZW5ndGhTdHJ9XG4gICAgbGV0IGluZGV4OiB1MzIgPSAke2luZGV4U3RyfTtcbiAgICBsZXQgdmFsdWUgPSAke2ZldGNoVHlwZVN0cn0oaW5kZXgpO1xuICAgICR7bWVtYmVySW5mby5jb252ZXJ0VG9Cb29sID8gY29udmVyc2lvblN0ciA6ICdyZXR1cm4gdmFsdWU7J31cbiAgfVxuICBgO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NGb3JOb25BcnJheVR5cGUoXG4gICAgICBtZW1iZXJJbmZvOiBNZW1iZXJJbmZvLFxuICAgICAgY29tcG9uZW50Q2xhc3M6IHR5cGVvZiBDb21wb25lbnQsXG4gICAgICBtZW1iZXJOYW1lOiBzdHJpbmcsXG4gICAgICBjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXc6IG51bWJlclxuICAgICkge1xuICAgICAgbGV0IHR5cGVTdHIgPSAnJztcbiAgICAgIGxldCBmZXRjaFR5cGVTdHIgPSAnJztcbiAgICAgIHN3aXRjaCAobWVtYmVySW5mby5jb21wb3NpdGlvblR5cGUpIHtcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0NDpcbiAgICAgICAgICB0eXBlU3RyID0gJ21hdDR4NDxmMzI+JztcbiAgICAgICAgICBmZXRjaFR5cGVTdHIgPSAnZmV0Y2hNYXQ0JztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0MzpcbiAgICAgICAgICB0eXBlU3RyID0gJ21hdDN4MzxmMzI+JztcbiAgICAgICAgICBmZXRjaFR5cGVTdHIgPSAnZmV0Y2hNYXQzTm8xNkJ5dGVzQWxpZ25lZCc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzQ6XG4gICAgICAgICAgdHlwZVN0ciA9ICd2ZWM0PGYzMj4nO1xuICAgICAgICAgIGZldGNoVHlwZVN0ciA9ICdmZXRjaFZlYzQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWMzOlxuICAgICAgICAgIHR5cGVTdHIgPSAndmVjMzxmMzI+JztcbiAgICAgICAgICBmZXRjaFR5cGVTdHIgPSAnZmV0Y2hWZWMzTm8xNkJ5dGVzQWxpZ25lZCc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlNjYWxhcjpcbiAgICAgICAgICB0eXBlU3RyID0gJ2YzMic7XG4gICAgICAgICAgZmV0Y2hUeXBlU3RyID0gJ2ZldGNoU2NhbGFyTm8xNkJ5dGVzQWxpZ25lZCc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBjb21wb3NpdGlvbiB0eXBlOiAke21lbWJlckluZm8uY29tcG9zaXRpb25UeXBlLnN0cn1gKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbG9jYXRpb25PZmZzZXRzID0gQ29tcG9uZW50LmdldExvY2F0aW9uT2Zmc2V0T2ZNZW1iZXJPZkNvbXBvbmVudChlbmdpbmUsIGNvbXBvbmVudENsYXNzLCBtZW1iZXJOYW1lKTtcbiAgICAgIGNvbnN0IGluZGljZXNOYW1lID0gYHJuSW5kaWNlc18ke21lbWJlck5hbWV9YDtcbiAgICAgIGxldCBpbmRleFN0ciA9ICcnO1xuICAgICAgc3dpdGNoIChtZW1iZXJJbmZvLmNvbXBvc2l0aW9uVHlwZSkge1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQ0OlxuICAgICAgICAgIGluZGV4U3RyID0gYCR7aW5kaWNlc05hbWV9W2luc3RhbmNlSWRPZkJ1ZmZlclZpZXdzXSArIDR1ICogaW5zdGFuY2VJZEluQnVmZmVyVmlldztgO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQzOlxuICAgICAgICAgIGluZGV4U3RyID0gYCR7aW5kaWNlc05hbWV9W2luc3RhbmNlSWRPZkJ1ZmZlclZpZXdzXSAqIDR1ICsgOXUgKiBpbnN0YW5jZUlkSW5CdWZmZXJWaWV3O2A7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzQ6XG4gICAgICAgICAgaW5kZXhTdHIgPSBgJHtpbmRpY2VzTmFtZX1baW5zdGFuY2VJZE9mQnVmZmVyVmlld3NdICsgMXUgKiBpbnN0YW5jZUlkSW5CdWZmZXJWaWV3O2A7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzM6XG4gICAgICAgICAgaW5kZXhTdHIgPSBgJHtpbmRpY2VzTmFtZX1baW5zdGFuY2VJZE9mQnVmZmVyVmlld3NdICogNHUgKyAzdSAqIGluc3RhbmNlSWRJbkJ1ZmZlclZpZXc7YDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuU2NhbGFyOlxuICAgICAgICAgIGluZGV4U3RyID0gYCR7aW5kaWNlc05hbWV9W2luc3RhbmNlSWRPZkJ1ZmZlclZpZXdzXSAqIDR1ICsgMXUgKiBpbnN0YW5jZUlkSW5CdWZmZXJWaWV3O2A7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBjb21wb3NpdGlvbiB0eXBlOiAke21lbWJlckluZm8uY29tcG9zaXRpb25UeXBlLnN0cn1gKTtcbiAgICAgIH1cbiAgICAgIGxldCBjb252ZXJzaW9uU3RyID0gJyc7XG4gICAgICBpZiAobWVtYmVySW5mby5jb252ZXJ0VG9Cb29sKSB7XG4gICAgICAgIGNvbnZlcnNpb25TdHIgPSAnaWYgKHZhbHVlID4gMC41KSB7IHJldHVybiB0cnVlOyB9IGVsc2UgeyByZXR1cm4gZmFsc2U7IH0nO1xuICAgICAgfVxuICAgICAgLy8gTW9kdWxlLXNjb3BlIGNvbnN0LCBmb3IgdGhlIHNhbWUgcmVhc29uIGFzIGluIHByb2Nlc3NGb3JBcnJheVR5cGUuXG4gICAgICBzdHIgKz0gYFxuICBjb25zdCAke2luZGljZXNOYW1lfTogYXJyYXk8dTMyLCAke2xvY2F0aW9uT2Zmc2V0cy5sZW5ndGh9PiA9IGFycmF5PHUzMiwgJHtsb2NhdGlvbk9mZnNldHMubGVuZ3RofT4oJHtsb2NhdGlvbk9mZnNldHMubWFwKG9mZnNldCA9PiBgJHtvZmZzZXR9dWApLmpvaW4oJywgJyl9KTtcbiAgZm4gZ2V0XyR7bWVtYmVyTmFtZX0oaW5zdGFuY2VJZDogdTMyKSAtPiAke21lbWJlckluZm8uY29udmVydFRvQm9vbCA/ICdib29sJyA6IHR5cGVTdHJ9IHtcbiAgICBsZXQgaW5zdGFuY2VJZE9mQnVmZmVyVmlld3MgPSBpbnN0YW5jZUlkIC8gJHtjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXd9O1xuICAgIGxldCBpbnN0YW5jZUlkSW5CdWZmZXJWaWV3ID0gaW5zdGFuY2VJZCAlICR7Y29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3fTtcbiAgICBsZXQgaW5kZXg6IHUzMiA9ICR7aW5kZXhTdHJ9O1xuICAgIGxldCB2YWx1ZSA9ICR7ZmV0Y2hUeXBlU3RyfShpbmRleCk7XG4gICAgJHttZW1iZXJJbmZvLmNvbnZlcnRUb0Jvb2wgPyBjb252ZXJzaW9uU3RyIDogJ3JldHVybiB2YWx1ZTsnfVxuICB9XG4gIGA7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRNb3JwaGVkUG9zaXRpb25HZXR0ZXIoZW5naW5lOiBFbmdpbmUpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1vcnBoVW5pZm9ybURhdGFUYXJnZXROdW1iZXJzID0gUHJpbWl0aXZlLmdldE1vcnBoVW5pZm9ybURhdGFUYXJnZXROdW1iZXJzKCk7XG4gICAgY29uc3QgbW9ycGhVbmlmb3JtRGF0YVRhcmdldE51bWJlcnNTdHIgPSBgXG4gICAgY29uc3Qgcm5Nb3JwaFVuaWZvcm1EYXRhVGFyZ2V0TnVtYmVyczogYXJyYXk8dTMyLCAke21vcnBoVW5pZm9ybURhdGFUYXJnZXROdW1iZXJzLmxlbmd0aH0+ID0gYXJyYXk8dTMyLCAke21vcnBoVW5pZm9ybURhdGFUYXJnZXROdW1iZXJzLmxlbmd0aH0+KCR7bW9ycGhVbmlmb3JtRGF0YVRhcmdldE51bWJlcnMubWFwKG51bSA9PiBgJHtudW19dWApLmpvaW4oJywgJyl9KTtcbiAgICBgO1xuICAgIGNvbnN0IG1vcnBoVW5pZm9ybURhdGFPZmZzZXRzID0gUHJpbWl0aXZlLmdldE1vcnBoVW5pZm9ybURhdGFPZmZzZXRzKCk7XG4gICAgY29uc3QgbW9ycGhVbmlmb3JtRGF0YU9mZnNldHNTdHIgPSBgXG4gICAgY29uc3Qgcm5Nb3JwaFVuaWZvcm1EYXRhT2Zmc2V0czogYXJyYXk8dTMyLCAke21vcnBoVW5pZm9ybURhdGFPZmZzZXRzLmxlbmd0aH0+ID0gYXJyYXk8dTMyLCAke21vcnBoVW5pZm9ybURhdGFPZmZzZXRzLmxlbmd0aH0+KCR7bW9ycGhVbmlmb3JtRGF0YU9mZnNldHMubWFwKG9mZnNldCA9PiBgJHtvZmZzZXR9dWApLmpvaW4oJywgJyl9KTtcbiAgICBgO1xuICAgIGNvbnN0IGJsZW5kU2hhcGVVbmlmb3JtRGF0YU9mZnNldHMgPSBCbGVuZFNoYXBlQ29tcG9uZW50LmdldE9mZnNldHNJblVuaWZvcm0oZW5naW5lKTtcbiAgICBjb25zdCBibGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzU3RyID0gYFxuICAgIGNvbnN0IHJuQmxlbmRTaGFwZVVuaWZvcm1EYXRhT2Zmc2V0czogYXJyYXk8dTMyLCAke2JsZW5kU2hhcGVVbmlmb3JtRGF0YU9mZnNldHMubGVuZ3RofT4gPSBhcnJheTx1MzIsICR7YmxlbmRTaGFwZVVuaWZvcm1EYXRhT2Zmc2V0cy5sZW5ndGh9Pigke2JsZW5kU2hhcGVVbmlmb3JtRGF0YU9mZnNldHMubWFwKG9mZnNldCA9PiBgJHtvZmZzZXR9dWApLmpvaW4oJywgJyl9KTtcbiAgICBgO1xuXG4gICAgY29uc3QgbW9ycGhpbmdTdHIgPSBgXG5cbiAgICAjaWZkZWYgUk5fSVNfVkVSVEVYX1NIQURFUlxuICAgICNpZmRlZiBSTl9JU19NT1JQSElOR1xuICAgICR7bW9ycGhVbmlmb3JtRGF0YVRhcmdldE51bWJlcnNTdHJ9XG4gICAgJHttb3JwaFVuaWZvcm1EYXRhT2Zmc2V0c1N0cn1cbiAgICAke2JsZW5kU2hhcGVVbmlmb3JtRGF0YU9mZnNldHNTdHJ9XG4gICAgZm4gZ2V0X3Bvc2l0aW9uKHZlcnRleElkOiB1MzIsIGJhc2VQb3NpdGlvbjogdmVjMzxmMzI+LCBibGVuZFNoYXBlQ29tcG9uZW50U0lEOiB1MzIpIC0+IHZlYzM8ZjMyPiB7XG4gICAgICBsZXQgY3VycmVudFByaW1pdGl2ZUlkeCA9IHVuaWZvcm1EcmF3UGFyYW1ldGVycy5jdXJyZW50UHJpbWl0aXZlSWR4O1xuICAgICAgbGV0IG9mZnNldEluVW5pZm9ybSA9IHJuTW9ycGhVbmlmb3JtRGF0YU9mZnNldHNbY3VycmVudFByaW1pdGl2ZUlkeF07XG4gICAgICBsZXQgb2Zmc2V0SW5Vbmlmb3JtMiA9IHJuQmxlbmRTaGFwZVVuaWZvcm1EYXRhT2Zmc2V0c1tibGVuZFNoYXBlQ29tcG9uZW50U0lEXTtcbiAgICAgIHZhciBwb3NpdGlvbiA9IGJhc2VQb3NpdGlvbjtcbiAgICAgIGxldCBzY2FsYXJfaWR4ID0gM3UgKiB2ZXJ0ZXhJZDtcbiAgICAgIGZvciAodmFyIGk9MHU7IGk8cm5Nb3JwaFVuaWZvcm1EYXRhVGFyZ2V0TnVtYmVyc1tjdXJyZW50UHJpbWl0aXZlSWR4XTsgaSsrKSB7XG4gICAgICAgIGxldCBpZHggPSBvZmZzZXRJblVuaWZvcm0gKyBpO1xuICAgICAgICBsZXQgb2Zmc2V0cyA9IHVuaWZvcm1Nb3JwaE9mZnNldHMuZGF0YVsgaWR4IC8gNHVdO1xuICAgICAgICBsZXQgb2Zmc2V0UG9zaXRpb24gPSBvZmZzZXRzW2lkeCAlIDR1XTtcblxuICAgICAgICBsZXQgYmFzZVBvc0luNGJ5dGVzID0gb2Zmc2V0UG9zaXRpb24gKiA0dSArIHNjYWxhcl9pZHg7XG4gICAgICAgIGxldCBhZGRQb3MgPSBmZXRjaFZlYzNObzE2Qnl0ZXNBbGlnbmVkRnJvbUJsZW5kU2hhcGVCdWZmZXIoYmFzZVBvc0luNGJ5dGVzKTtcblxuICAgICAgICBsZXQgaWR4MiA9IG9mZnNldEluVW5pZm9ybTIgKyBpO1xuICAgICAgICBsZXQgbW9ycGhXZWlnaHRzOiB2ZWM0ZiA9IHVuaWZvcm1Nb3JwaFdlaWdodHMuZGF0YVsgaWR4MiAvIDR1XTtcbiAgICAgICAgbGV0IG1vcnBoV2VpZ2h0OiBmMzIgPSBtb3JwaFdlaWdodHNbaWR4MiAlIDR1XTtcblxuICAgICAgICBwb3NpdGlvbiArPSBhZGRQb3MgKiBtb3JwaFdlaWdodDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHBvc2l0aW9uO1xuICAgIH1cbiAgICAjZW5kaWZcbiAgI2VuZGlmXG4gICAgYDtcblxuICAgIHJldHVybiBtb3JwaGluZ1N0cjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgc2hhZGVyIHByb3BlcnR5IGFjY2Vzc29yIGZ1bmN0aW9ucyBmb3IgZ2xvYmFsIGRhdGEuXG4gICAqIENyZWF0ZXMgV0dTTCBmdW5jdGlvbnMgdGhhdCBjYW4gZmV0Y2ggcHJvcGVydHkgdmFsdWVzIGZyb20gc3RvcmFnZSBidWZmZXJzXG4gICAqIGJhc2VkIG9uIHNoYWRlciBzZW1hbnRpY3MgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBpbmZvIC0gU2hhZGVyIHNlbWFudGljcyBpbmZvcm1hdGlvbiBjb250YWluaW5nIHR5cGUgYW5kIGJpbmRpbmcgZGV0YWlsc1xuICAgKiBAcmV0dXJucyBXR1NMIHNoYWRlciBjb2RlIGZvciB0aGUgcHJvcGVydHkgYWNjZXNzb3IgZnVuY3Rpb25cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0U2hhZGVyUHJvcGVydHlPZkdsb2JhbERhdGFSZXBvc2l0b3J5KGVuZ2luZTogRW5naW5lLCBpbmZvOiBTaGFkZXJTZW1hbnRpY3NJbmZvKSB7XG4gICAgY29uc3QgcmV0dXJuVHlwZSA9IGluZm8uY29tcG9zaXRpb25UeXBlLnRvV0dTTFR5cGUoaW5mby5jb21wb25lbnRUeXBlKTtcbiAgICBjb25zdCBtZXRob2ROYW1lID0gaW5mby5zZW1hbnRpYy5yZXBsYWNlKCcuJywgJ18nKTtcbiAgICBjb25zdCBpc1RleHR1cmUgPSBDb21wb3NpdGlvblR5cGUuaXNUZXh0dXJlKGluZm8uY29tcG9zaXRpb25UeXBlKTtcblxuICAgIGlmIChpc1RleHR1cmUpIHtcbiAgICAgIGxldCB0ZXh0dXJlVHlwZSA9ICd0ZXh0dXJlXzJkPGYzMj4nO1xuICAgICAgaWYgKGluZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVGV4dHVyZUN1YmUpIHtcbiAgICAgICAgdGV4dHVyZVR5cGUgPSAndGV4dHVyZV9jdWJlPGYzMj4nO1xuICAgICAgfSBlbHNlIGlmIChpbmZvLmNvbXBvc2l0aW9uVHlwZSA9PT0gQ29tcG9zaXRpb25UeXBlLlRleHR1cmUyREFycmF5KSB7XG4gICAgICAgIHRleHR1cmVUeXBlID0gJ3RleHR1cmVfMmRfYXJyYXk8ZjMyPic7XG4gICAgICB9XG4gICAgICBjb25zdCB7IHRleHR1cmVOYW1lLCBzYW1wbGVyTmFtZSB9ID0gZ2V0VGV4dHVyZUFuZFNhbXBsZXJOYW1lcyhtZXRob2ROYW1lKTtcbiAgICAgIHJldHVybiBgXG5AZ3JvdXAoMSkgQGJpbmRpbmcoJHtpbmZvLmluaXRpYWxWYWx1ZVswXX0pIHZhciAke3RleHR1cmVOYW1lfTogJHt0ZXh0dXJlVHlwZX07XG5AZ3JvdXAoMikgQGJpbmRpbmcoJHtpbmZvLmluaXRpYWxWYWx1ZVswXX0pIHZhciAke3NhbXBsZXJOYW1lfTogc2FtcGxlcjtcbmA7XG4gICAgfVxuXG4gICAgLy8gaW5uZXIgY29udGVudHMgb2YgJ2dldF8nIHNoYWRlciBmdW5jdGlvblxuICAgIGNvbnN0IHZlYzRTaXplT2ZQcm9wZXJ0eTogSW5kZXhPZjE2Qnl0ZXMgPSBpbmZvLmNvbXBvc2l0aW9uVHlwZS5nZXRWZWM0U2l6ZU9mUHJvcGVydHkoKTtcbiAgICAvLyBmb3Igbm9uLWBpbmRleGAgcHJvcGVydHkgKHRoaXMgaXMgZ2VuZXJhbCBjYXNlKVxuICAgIGNvbnN0IHNjYWxhclNpemVPZlByb3BlcnR5OiBJbmRleE9mNEJ5dGVzID0gaW5mby5jb21wb3NpdGlvblR5cGUuZ2V0TnVtYmVyT2ZDb21wb25lbnRzKCk7XG4gICAgY29uc3Qgb2Zmc2V0T2ZQcm9wZXJ0eTogSW5kZXhPZjE2Qnl0ZXMgPSBXZWJHcHVTdHJhdGVneUJhc2ljLmdldE9mZnNldE9mUHJvcGVydHlPZkdsb2JhbERhdGFSZXBvc2l0b3J5KFxuICAgICAgZW5naW5lLFxuICAgICAgaW5mby5zZW1hbnRpY1xuICAgICk7XG5cbiAgICBpZiAob2Zmc2V0T2ZQcm9wZXJ0eSA9PT0gLTEpIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdDb3VsZCBub3QgZ2V0IHRoZSBsb2NhdGlvbiBvZmZzZXQgb2YgdGhlIHByb3BlcnR5LicpO1xuICAgIH1cblxuICAgIGxldCBpbmRleFN0cjogc3RyaW5nO1xuICAgIGxldCBpbnN0YW5jZVNpemUgPSB2ZWM0U2l6ZU9mUHJvcGVydHk7XG4gICAgaW5kZXhTdHIgPSBgICBsZXQgdmVjNF9pZHg6IHUzMiA9ICR7b2Zmc2V0T2ZQcm9wZXJ0eX11ICsgJHtpbnN0YW5jZVNpemV9dSAqIGluc3RhbmNlSWQ7XFxuYDtcbiAgICBpZiAoQ29tcG9zaXRpb25UeXBlLmlzQXJyYXkoaW5mby5jb21wb3NpdGlvblR5cGUpKSB7XG4gICAgICBpbnN0YW5jZVNpemUgPSB2ZWM0U2l6ZU9mUHJvcGVydHkgKiAoaW5mby5hcnJheUxlbmd0aCA/PyAxKTtcbiAgICAgIGNvbnN0IHBhZGRlZEFzVmVjNCA9IE1hdGguY2VpbChzY2FsYXJTaXplT2ZQcm9wZXJ0eSAvIDQpICogNDtcbiAgICAgIGNvbnN0IGluc3RhbmNlU2l6ZUluU2NhbGFyID0gcGFkZGVkQXNWZWM0ICogKGluZm8uYXJyYXlMZW5ndGggPz8gMSk7XG4gICAgICBpbmRleFN0ciA9IGAgIGxldCB2ZWM0X2lkeDogdTMyID0gJHtvZmZzZXRPZlByb3BlcnR5fXUgKyAke2luc3RhbmNlU2l6ZX0gKiBpbnN0YW5jZUlkICsgJHt2ZWM0U2l6ZU9mUHJvcGVydHl9dSAqIGlkeE9mQXJyYXk7XFxuYDtcbiAgICAgIGluZGV4U3RyICs9IGAgIGxldCBzY2FsYXJfaWR4OiB1MzIgPSAke1xuICAgICAgICAvLyBJbmRleE9mNEJ5dGVzXG4gICAgICAgIG9mZnNldE9mUHJvcGVydHkgKiA0IC8vIEluZGV4T2YxNmJ5dGVzIHRvIEluZGV4T2Y0Qnl0ZXNcbiAgICAgIH0gKyAke2luc3RhbmNlU2l6ZUluU2NhbGFyfSAqIGluc3RhbmNlSWQgKyAke3NjYWxhclNpemVPZlByb3BlcnR5fXUgKiBpZHhPZkFycmF5O1xcbmA7XG4gICAgfVxuXG4gICAgY29uc3QgZmlyc3RQYXJ0T2ZJbm5lckZ1bmMgPSBgXG5mbiBnZXRfJHttZXRob2ROYW1lfShpbnN0YW5jZUlkOiB1MzIsIGlkeE9mQXJyYXk6IHUzMikgLT4gJHtyZXR1cm5UeXBlfSB7XG4ke2luZGV4U3RyfVxuYDtcblxuICAgIGxldCBzdHIgPSBgJHtmaXJzdFBhcnRPZklubmVyRnVuY31gO1xuXG4gICAgc3dpdGNoIChpbmZvLmNvbXBvc2l0aW9uVHlwZSkge1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjNDpcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzRBcnJheTpcbiAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBmZXRjaEVsZW1lbnQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjMzpcbiAgICAgICAgc3RyICs9ICcgIGxldCBjb2wwID0gZmV0Y2hFbGVtZW50KHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBzdHIgKz0gYCAgbGV0IHZhbCA9ICR7cmV0dXJuVHlwZX0oY29sMC54eXopO2A7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjM0FycmF5OlxuICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGZldGNoVmVjM05vMTZCeXRlc0FsaWduZWQoc2NhbGFyX2lkeCk7XFxuJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWMyOlxuICAgICAgICBzdHIgKz0gJyAgbGV0IGNvbDAgPSBmZXRjaEVsZW1lbnQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgIHN0ciArPSBgICBsZXQgdmFsID0gJHtyZXR1cm5UeXBlfShjb2wwLnh5KTtgO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzJBcnJheTpcbiAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBmZXRjaFZlYzJObzE2Qnl0ZXNBbGlnbmVkKHNjYWxhcl9pZHgpO1xcbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuU2NhbGFyOlxuICAgICAgICBzdHIgKz0gJyAgbGV0IGNvbDAgPSBmZXRjaEVsZW1lbnQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgIGlmIChpbmZvLmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuSW50KSB7XG4gICAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBpMzIoY29sMC54KTsnO1xuICAgICAgICB9IGVsc2UgaWYgKGluZm8uY29tcG9uZW50VHlwZSA9PT0gQ29tcG9uZW50VHlwZS5VbnNpZ25lZEludCkge1xuICAgICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gdTMyKGNvbDAueCk7JztcbiAgICAgICAgfSBlbHNlIGlmIChpbmZvLmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuQm9vbCkge1xuICAgICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gY29sMC54ID49IDAuNTsnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gY29sMC54Oyc7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5TY2FsYXJBcnJheTpcbiAgICAgICAgc3RyICs9ICcgIGxldCBjb2wwID0gZmV0Y2hTY2FsYXJObzE2Qnl0ZXNBbGlnbmVkKHNjYWxhcl9pZHgpO1xcbic7XG4gICAgICAgIGlmIChpbmZvLmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuSW50KSB7XG4gICAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBpMzIoY29sMCk7JztcbiAgICAgICAgfSBlbHNlIGlmIChpbmZvLmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuVW5zaWduZWRJbnQpIHtcbiAgICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IHUzMihjb2wwKTsnO1xuICAgICAgICB9IGVsc2UgaWYgKGluZm8uY29tcG9uZW50VHlwZSA9PT0gQ29tcG9uZW50VHlwZS5Cb29sKSB7XG4gICAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBjb2wwID49IDAuNTsnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gY29sMDsnO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0NDpcbiAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBmZXRjaE1hdDQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0NEFycmF5OlxuICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGZldGNoTWF0NCh2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQzOlxuICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGZldGNoTWF0Myh2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQzQXJyYXk6XG4gICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gZmV0Y2hNYXQzTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDI6XG4gICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gZmV0Y2hNYXQyKHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDJBcnJheTpcbiAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBmZXRjaE1hdDJObzE2Qnl0ZXNBbGlnbmVkKHNjYWxhcl9pZHgpO1xcbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0NHgzQXJyYXk6XG4gICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gZmV0Y2hNYXQ0eDModmVjNF9pZHgpO1xcbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgLy8gTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJ3Vua25vd24gY29tcG9zaXRpb24gdHlwZScsIGluZm8uY29tcG9zaXRpb25UeXBlLnN0ciwgbWVtYmVyTmFtZSk7XG4gICAgICAgIHN0ciArPSAnJztcbiAgICB9XG4gICAgc3RyICs9IGBcbiAgcmV0dXJuIHZhbDtcbn1cbmA7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgc2hhZGVyIHByb3BlcnR5IGFjY2Vzc29yIGZ1bmN0aW9ucyBmb3IgbWF0ZXJpYWxzLlxuICAgKiBDcmVhdGVzIFdHU0wgZnVuY3Rpb25zIHRoYXQgY2FuIGZldGNoIHByb3BlcnR5IHZhbHVlcyBmcm9tIHN0b3JhZ2UgYnVmZmVyc1xuICAgKiBiYXNlZCBvbiBzaGFkZXIgc2VtYW50aWNzIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gbWF0ZXJpYWxUeXBlTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBtYXRlcmlhbCB0eXBlXG4gICAqIEBwYXJhbSBpbmZvIC0gU2hhZGVyIHNlbWFudGljcyBpbmZvcm1hdGlvbiBjb250YWluaW5nIHR5cGUgYW5kIGJpbmRpbmcgZGV0YWlsc1xuICAgKiBAcmV0dXJucyBXR1NMIHNoYWRlciBjb2RlIGZvciB0aGUgcHJvcGVydHkgYWNjZXNzb3IgZnVuY3Rpb25cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0U2hhZGVyUHJvcGVydHlPZk1hdGVyaWFsKGVuZ2luZTogRW5naW5lLCBtYXRlcmlhbFR5cGVOYW1lOiBzdHJpbmcsIGluZm86IFNoYWRlclNlbWFudGljc0luZm8pIHtcbiAgICBjb25zdCByZXR1cm5UeXBlID0gaW5mby5jb21wb3NpdGlvblR5cGUudG9XR1NMVHlwZShpbmZvLmNvbXBvbmVudFR5cGUpO1xuICAgIGNvbnN0IG1ldGhvZE5hbWUgPSBpbmZvLnNlbWFudGljLnJlcGxhY2UoJy4nLCAnXycpO1xuICAgIGNvbnN0IGlzVGV4dHVyZSA9IENvbXBvc2l0aW9uVHlwZS5pc1RleHR1cmUoaW5mby5jb21wb3NpdGlvblR5cGUpO1xuXG4gICAgaWYgKGlzVGV4dHVyZSkge1xuICAgICAgbGV0IHRleHR1cmVUeXBlID0gJ3RleHR1cmVfMmQ8ZjMyPic7XG4gICAgICBpZiAoaW5mby5jb21wb3NpdGlvblR5cGUgPT09IENvbXBvc2l0aW9uVHlwZS5UZXh0dXJlQ3ViZSkge1xuICAgICAgICB0ZXh0dXJlVHlwZSA9ICd0ZXh0dXJlX2N1YmU8ZjMyPic7XG4gICAgICB9IGVsc2UgaWYgKGluZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVGV4dHVyZTJEQXJyYXkpIHtcbiAgICAgICAgdGV4dHVyZVR5cGUgPSAndGV4dHVyZV8yZF9hcnJheTxmMzI+JztcbiAgICAgIH1cbiAgICAgIGNvbnN0IHsgdGV4dHVyZU5hbWUsIHNhbXBsZXJOYW1lIH0gPSBnZXRUZXh0dXJlQW5kU2FtcGxlck5hbWVzKG1ldGhvZE5hbWUpO1xuICAgICAgcmV0dXJuIGBcbkBncm91cCgxKSBAYmluZGluZygke2luZm8uaW5pdGlhbFZhbHVlWzBdfSkgdmFyICR7dGV4dHVyZU5hbWV9OiAke3RleHR1cmVUeXBlfTtcbkBncm91cCgyKSBAYmluZGluZygke2luZm8uaW5pdGlhbFZhbHVlWzBdfSkgdmFyICR7c2FtcGxlck5hbWV9OiBzYW1wbGVyO1xuYDtcbiAgICB9XG5cbiAgICAvLyBpbm5lciBjb250ZW50cyBvZiAnZ2V0Xycgc2hhZGVyIGZ1bmN0aW9uXG4gICAgY29uc3QgdmVjNFNpemVPZlByb3BlcnR5OiBJbmRleE9mMTZCeXRlcyA9IGluZm8uY29tcG9zaXRpb25UeXBlLmdldFZlYzRTaXplT2ZQcm9wZXJ0eSgpO1xuICAgIC8vIGZvciBub24tYGluZGV4YCBwcm9wZXJ0eSAodGhpcyBpcyBnZW5lcmFsIGNhc2UpXG4gICAgY29uc3Qgc2NhbGFyU2l6ZU9mUHJvcGVydHk6IEluZGV4T2Y0Qnl0ZXMgPSBpbmZvLmNvbXBvc2l0aW9uVHlwZS5nZXROdW1iZXJPZkNvbXBvbmVudHMoKTtcbiAgICBjb25zdCBvZmZzZXRPZlByb3BlcnR5OiBJbmRleE9mMTZCeXRlc1tdID0gV2ViR3B1U3RyYXRlZ3lCYXNpYy5nZXRPZmZzZXRPZlByb3BlcnR5T2ZNYXRlcmlhbChcbiAgICAgIGVuZ2luZSxcbiAgICAgIGluZm8uc2VtYW50aWMsXG4gICAgICBtYXRlcmlhbFR5cGVOYW1lXG4gICAgKTtcbiAgICBjb25zdCBtYXRlcmlhbENvdW50UGVyQnVmZmVyVmlldyA9IGVuZ2luZS5tYXRlcmlhbFJlcG9zaXRvcnkuX2dldE1hdGVyaWFsQ291bnRQZXJCdWZmZXJWaWV3KG1hdGVyaWFsVHlwZU5hbWUpITtcblxuICAgIC8vIE1vZHVsZS1zY29wZSBjb25zdDogYSB2YXI8ZnVuY3Rpb24+IGFycmF5IGlzIGluaXRpYWxpemVkIG9uIGV2ZXJ5IGNhbGwsIHdoaWNoIGlzIGV4cGVuc2l2ZSB3aGVuIHRoZSBtYXRlcmlhbFxuICAgIC8vIHR5cGUgc3BhbnMgbWFueSBidWZmZXIgdmlld3MuXG4gICAgY29uc3Qgb2Zmc2V0c05hbWUgPSBgcm5PZmZzZXRzXyR7bWV0aG9kTmFtZX1gO1xuICAgIGNvbnN0IG9mZnNldHNTdHIgPSBgY29uc3QgJHtvZmZzZXRzTmFtZX06IGFycmF5PHUzMiwgJHtvZmZzZXRPZlByb3BlcnR5Lmxlbmd0aH0+ID0gYXJyYXk8dTMyLCAke29mZnNldE9mUHJvcGVydHkubGVuZ3RofT4oJHtvZmZzZXRPZlByb3BlcnR5Lm1hcChvZmZzZXQgPT4gYCR7b2Zmc2V0fXVgKS5qb2luKCcsICcpfSk7YDtcblxuICAgIGxldCBpbmRleFN0cjogc3RyaW5nO1xuICAgIGxldCBpbnN0YW5jZVNpemUgPSB2ZWM0U2l6ZU9mUHJvcGVydHk7XG4gICAgaW5kZXhTdHIgPSBgICBsZXQgdmVjNF9pZHg6IHUzMiA9ICR7b2Zmc2V0c05hbWV9W2luc3RhbmNlSWRPZkJ1ZmZlclZpZXdzXSArICR7aW5zdGFuY2VTaXplfXUgKiBpbnN0YW5jZUlkSW5CdWZmZXJWaWV3O1xcbmA7XG4gICAgaWYgKENvbXBvc2l0aW9uVHlwZS5pc0FycmF5KGluZm8uY29tcG9zaXRpb25UeXBlKSkge1xuICAgICAgaW5zdGFuY2VTaXplID0gdmVjNFNpemVPZlByb3BlcnR5ICogKGluZm8uYXJyYXlMZW5ndGggPz8gMSk7XG4gICAgICBjb25zdCBwYWRkZWRBc1ZlYzQgPSBNYXRoLmNlaWwoc2NhbGFyU2l6ZU9mUHJvcGVydHkgLyA0KSAqIDQ7XG4gICAgICBjb25zdCBpbnN0YW5jZVNpemVJblNjYWxhciA9IHBhZGRlZEFzVmVjNCAqIChpbmZvLmFycmF5TGVuZ3RoID8/IDEpO1xuICAgICAgaW5kZXhTdHIgPSBgICBsZXQgdmVjNF9pZHg6IHUzMiA9ICR7b2Zmc2V0c05hbWV9W2luc3RhbmNlSWRPZkJ1ZmZlclZpZXdzXSArICR7aW5zdGFuY2VTaXplfSAqIGluc3RhbmNlSWRJbkJ1ZmZlclZpZXcgKyAke3ZlYzRTaXplT2ZQcm9wZXJ0eX11ICogaWR4T2ZBcnJheTtcXG5gO1xuICAgICAgaW5kZXhTdHIgKz0gYCAgbGV0IHNjYWxhcl9pZHg6IHUzMiA9ICR7b2Zmc2V0c05hbWV9W2luc3RhbmNlSWRPZkJ1ZmZlclZpZXdzXSAqIDQgKyAke2luc3RhbmNlU2l6ZUluU2NhbGFyfSAqIGluc3RhbmNlSWRJbkJ1ZmZlclZpZXcgKyAke3NjYWxhclNpemVPZlByb3BlcnR5fXUgKiBpZHhPZkFycmF5O1xcbmA7XG4gICAgfVxuXG4gICAgY29uc3QgZmlyc3RQYXJ0T2ZJbm5lckZ1bmMgPSBgXG4ke29mZnNldHNTdHJ9XG5mbiBnZXRfJHttZXRob2ROYW1lfShpbnN0YW5jZUlkOiB1MzIsIGlkeE9mQXJyYXk6IHUzMikgLT4gJHtyZXR1cm5UeXBlfSB7XG4gIGxldCBpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3cyA9IGluc3RhbmNlSWQgLyAke21hdGVyaWFsQ291bnRQZXJCdWZmZXJWaWV3fTtcbiAgbGV0IGluc3RhbmNlSWRJbkJ1ZmZlclZpZXcgPSBpbnN0YW5jZUlkICUgJHttYXRlcmlhbENvdW50UGVyQnVmZmVyVmlld307XG4ke2luZGV4U3RyfVxuYDtcblxuICAgIGxldCBzdHIgPSBgJHtmaXJzdFBhcnRPZklubmVyRnVuY31gO1xuXG4gICAgc3dpdGNoIChpbmZvLmNvbXBvc2l0aW9uVHlwZSkge1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjNDpcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzRBcnJheTpcbiAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBmZXRjaEVsZW1lbnQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjMzpcbiAgICAgICAgc3RyICs9ICcgIGxldCBjb2wwID0gZmV0Y2hFbGVtZW50KHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBzdHIgKz0gYCAgbGV0IHZhbCA9ICR7cmV0dXJuVHlwZX0oY29sMC54eXopO2A7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjM0FycmF5OlxuICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGZldGNoVmVjM05vMTZCeXRlc0FsaWduZWQoc2NhbGFyX2lkeCk7XFxuJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWMyOlxuICAgICAgICBzdHIgKz0gJyAgbGV0IGNvbDAgPSBmZXRjaEVsZW1lbnQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgIHN0ciArPSBgICBsZXQgdmFsID0gJHtyZXR1cm5UeXBlfShjb2wwLnh5KTtgO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzJBcnJheTpcbiAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBmZXRjaFZlYzJObzE2Qnl0ZXNBbGlnbmVkKHNjYWxhcl9pZHgpO1xcbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuU2NhbGFyOlxuICAgICAgICBzdHIgKz0gJyAgbGV0IGNvbDAgPSBmZXRjaEVsZW1lbnQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgIGlmIChpbmZvLmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuSW50KSB7XG4gICAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBpMzIoY29sMC54KTsnO1xuICAgICAgICB9IGVsc2UgaWYgKGluZm8uY29tcG9uZW50VHlwZSA9PT0gQ29tcG9uZW50VHlwZS5VbnNpZ25lZEludCkge1xuICAgICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gdTMyKGNvbDAueCk7JztcbiAgICAgICAgfSBlbHNlIGlmIChpbmZvLmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuQm9vbCkge1xuICAgICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gY29sMC54ID49IDAuNTsnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gY29sMC54Oyc7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5TY2FsYXJBcnJheTpcbiAgICAgICAgc3RyICs9ICcgIGxldCBjb2wwID0gZmV0Y2hTY2FsYXJObzE2Qnl0ZXNBbGlnbmVkKHNjYWxhcl9pZHgpO1xcbic7XG4gICAgICAgIGlmIChpbmZvLmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuSW50KSB7XG4gICAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBpMzIoY29sMCk7JztcbiAgICAgICAgfSBlbHNlIGlmIChpbmZvLmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuVW5zaWduZWRJbnQpIHtcbiAgICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IHUzMihjb2wwKTsnO1xuICAgICAgICB9IGVsc2UgaWYgKGluZm8uY29tcG9uZW50VHlwZSA9PT0gQ29tcG9uZW50VHlwZS5Cb29sKSB7XG4gICAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBjb2wwID49IDAuNTsnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gY29sMDsnO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0NDpcbiAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBmZXRjaE1hdDQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0NEFycmF5OlxuICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGZldGNoTWF0NCh2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQzOlxuICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGZldGNoTWF0Myh2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQzQXJyYXk6XG4gICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gZmV0Y2hNYXQzTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDI6XG4gICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gZmV0Y2hNYXQyKHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDJBcnJheTpcbiAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBmZXRjaE1hdDJObzE2Qnl0ZXNBbGlnbmVkKHNjYWxhcl9pZHgpO1xcbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0NHgzQXJyYXk6XG4gICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gZmV0Y2hNYXQ0eDModmVjNF9pZHgpO1xcbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgLy8gTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJ3Vua25vd24gY29tcG9zaXRpb24gdHlwZScsIGluZm8uY29tcG9zaXRpb25UeXBlLnN0ciwgbWVtYmVyTmFtZSk7XG4gICAgICAgIHN0ciArPSAnJztcbiAgICB9XG4gICAgc3RyICs9IGBcbiAgcmV0dXJuIHZhbDtcbn1cbmA7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRoZSBtZW1vcnkgb2Zmc2V0IG9mIGEgc2hhZGVyIHByb3BlcnR5IHdpdGhpbiBzdG9yYWdlIGJ1ZmZlcnMuXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBpc0dsb2JhbERhdGEgLSBXaGV0aGVyIHRvIGxvb2sgaW4gZ2xvYmFsIGRhdGEgcmVwb3NpdG9yeSBvciBtYXRlcmlhbCByZXBvc2l0b3J5XG4gICAqIEBwYXJhbSBwcm9wZXJ0eU5hbWUgLSBUaGUgc2VtYW50aWMgbmFtZSBvZiB0aGUgcHJvcGVydHlcbiAgICogQHBhcmFtIG1hdGVyaWFsVHlwZU5hbWUgLSBUaGUgbWF0ZXJpYWwgdHlwZSBuYW1lIGZvciBtYXRlcmlhbC1zcGVjaWZpYyBwcm9wZXJ0aWVzXG4gICAqIEByZXR1cm5zIFRoZSBieXRlIG9mZnNldCBvZiB0aGUgcHJvcGVydHkgaW4gdGhlIHN0b3JhZ2UgYnVmZmVyLCBvciAtMSBpZiBub3QgZm91bmRcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIGdldE9mZnNldE9mUHJvcGVydHlPZk1hdGVyaWFsKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHByb3BlcnR5TmFtZTogU2hhZGVyU2VtYW50aWNzTmFtZSxcbiAgICBtYXRlcmlhbFR5cGVOYW1lOiBzdHJpbmdcbiAgKSB7XG4gICAgY29uc3QgZGF0YUJlZ2luUG9zID0gZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5nZXRMb2NhdGlvbk9mZnNldE9mTWVtYmVyT2ZNYXRlcmlhbChcbiAgICAgIGVuZ2luZSxcbiAgICAgIG1hdGVyaWFsVHlwZU5hbWUsXG4gICAgICBwcm9wZXJ0eU5hbWVcbiAgICApO1xuICAgIHJldHVybiBkYXRhQmVnaW5Qb3M7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBnZXRPZmZzZXRPZlByb3BlcnR5T2ZHbG9iYWxEYXRhUmVwb3NpdG9yeShlbmdpbmU6IEVuZ2luZSwgcHJvcGVydHlOYW1lOiBTaGFkZXJTZW1hbnRpY3NOYW1lKSB7XG4gICAgY29uc3QgZ2xvYmFsRGF0YVJlcG9zaXRvcnkgPSBlbmdpbmUuZ2xvYmFsRGF0YVJlcG9zaXRvcnk7XG4gICAgY29uc3QgZGF0YUJlZ2luUG9zID0gZ2xvYmFsRGF0YVJlcG9zaXRvcnkuZ2V0TG9jYXRpb25PZmZzZXRPZlByb3BlcnR5KHByb3BlcnR5TmFtZSk7XG4gICAgcmV0dXJuIGRhdGFCZWdpblBvcztcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBhbmQgcHJlcGFyZXMgYSBtZXNoIGNvbXBvbmVudCBmb3IgcmVuZGVyaW5nLlxuICAgKiBTZXRzIHVwIHZlcnRleCBidWZmZXIgb2JqZWN0cyAoVkJPKSBhbmQgdmVydGV4IGFycmF5IG9iamVjdHMgKFZBTykgaWYgbm90IGFscmVhZHkgZG9uZS5cbiAgICpcbiAgICogQHBhcmFtIG1lc2hDb21wb25lbnQgLSBUaGUgbWVzaCBjb21wb25lbnQgdG8gbG9hZFxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBtZXNoIHdhcyBzdWNjZXNzZnVsbHkgbG9hZGVkLCBmYWxzZSBpZiB0aGUgbWVzaCBpcyBudWxsXG4gICAqL1xuICAkbG9hZChtZXNoQ29tcG9uZW50OiBNZXNoQ29tcG9uZW50KTogYm9vbGVhbiB7XG4gICAgY29uc3QgbWVzaCA9IG1lc2hDb21wb25lbnQubWVzaDtcbiAgICBpZiAobWVzaCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gc2V0dXAgVkJPIGFuZCBWQU9cbiAgICBpZiAoIW1lc2guaXNTZXRVcERvbmUoKSkge1xuICAgICAgbWVzaC5fdXBkYXRlVkJPQW5kVkFPKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgY29tbW9uIGxvYWRpbmcgb3BlcmF0aW9ucyByZXF1aXJlZCBmb3IgdGhlIFdlYkdQVSBzdHJhdGVneS5cbiAgICogSW5pdGlhbGl6ZXMgbW9ycGggdGFyZ2V0IGFycmF5cyBhbmQgdXBkYXRlcyBibGVuZCBzaGFwZSBzdG9yYWdlIGJ1ZmZlcnMgd2hlbiBuZWVkZWQuXG4gICAqL1xuICBjb21tb25fJGxvYWQoKTogdm9pZCB7XG4gICAgdGhpcy5fX2luaXRNb3JwaFVuaWZvcm1CdWZmZXJzKCk7XG4gIH1cblxuICBwcml2YXRlIF9faW5pdE1vcnBoVW5pZm9ybUJ1ZmZlcnMoKSB7XG4gICAgY29uc3QgbW9ycGhVbmlmb3JtRGF0YU9mZnNldHMgPSBQcmltaXRpdmUuZ2V0TW9ycGhVbmlmb3JtRGF0YU9mZnNldHMoKTtcbiAgICBjb25zdCBtb3JwaE9mZnNldHNVbmlmb3JtRGF0YVNpemUgPSBNYXRoLm1heChcbiAgICAgIE1hdGguY2VpbChtb3JwaFVuaWZvcm1EYXRhT2Zmc2V0c1ttb3JwaFVuaWZvcm1EYXRhT2Zmc2V0cy5sZW5ndGggLSAxXSAvIDQpICogNCAqIDQsXG4gICAgICA0XG4gICAgKTtcblxuICAgIGlmIChtb3JwaE9mZnNldHNVbmlmb3JtRGF0YVNpemUgIT09IHRoaXMuX19sYXN0TW9ycGhPZmZzZXRzVW5pZm9ybURhdGFTaXplKSB7XG4gICAgICBjb25zdCB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYkdwdVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICAgIC8vIGRlbGV0ZSB0aGUgb2xkIG1vcnBoIG9mZnNldHMgdW5pZm9ybSBidWZmZXJcbiAgICAgIGlmICh0aGlzLl9fbW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlclVpZCAhPT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQpIHtcbiAgICAgICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmZsdXNoKCk7XG4gICAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5jbGVhckNhY2hlKCk7XG4gICAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5kZWxldGVVbmlmb3JtQnVmZmVyKHRoaXMuX19tb3JwaE9mZnNldHNVbmlmb3JtQnVmZmVyVWlkKTtcbiAgICAgICAgdGhpcy5fX21vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJVaWQgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgICAgIH1cbiAgICAgIC8vIGNyZWF0ZSB0aGUgbmV3IG1vcnBoIG9mZnNldHMgdW5pZm9ybSBidWZmZXJcbiAgICAgIHRoaXMuX19sYXN0TW9ycGhPZmZzZXRzVW5pZm9ybURhdGFTaXplID0gbW9ycGhPZmZzZXRzVW5pZm9ybURhdGFTaXplO1xuICAgICAgaWYgKHRoaXMuX19tb3JwaE9mZnNldHNVbmlmb3JtQnVmZmVyVWlkID09PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgICBjb25zdCBpbnB1dEFycmF5T2Zmc2V0cyA9IG5ldyBVaW50MzJBcnJheShtb3JwaE9mZnNldHNVbmlmb3JtRGF0YVNpemUpO1xuICAgICAgICB0aGlzLl9fdW5pZm9ybU1vcnBoT2Zmc2V0c1R5cGVkQXJyYXkgPSBpbnB1dEFycmF5T2Zmc2V0cztcbiAgICAgICAgdGhpcy5fX21vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJVaWQgPSB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuY3JlYXRlVW5pZm9ybU1vcnBoT2Zmc2V0c0J1ZmZlcihcbiAgICAgICAgICBtb3JwaE9mZnNldHNVbmlmb3JtRGF0YVNpemUgKiA0XG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuX191cGRhdGVNb3JwaE9mZnNldHNVbmlmb3JtQnVmZmVyKCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX19sYXN0TW9ycGhPZmZzZXRzVW5pZm9ybURhdGFTaXplID0gbW9ycGhPZmZzZXRzVW5pZm9ybURhdGFTaXplO1xuICAgIH1cblxuICAgIGNvbnN0IGJsZW5kU2hhcGVVbmlmb3JtRGF0YU9mZnNldHMgPSBCbGVuZFNoYXBlQ29tcG9uZW50LmdldE9mZnNldHNJblVuaWZvcm0odGhpcy5fX2VuZ2luZSk7XG4gICAgY29uc3QgYmxlbmRTaGFwZVdlaWdodHNVbmlmb3JtRGF0YVNpemUgPSBNYXRoLm1heChcbiAgICAgIE1hdGguY2VpbChibGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzW2JsZW5kU2hhcGVVbmlmb3JtRGF0YU9mZnNldHMubGVuZ3RoIC0gMV0gLyA0KSAqIDQgKiA0LFxuICAgICAgNFxuICAgICk7XG5cbiAgICBpZiAoYmxlbmRTaGFwZVdlaWdodHNVbmlmb3JtRGF0YVNpemUgIT09IHRoaXMuX19sYXN0TW9ycGhXZWlnaHRzVW5pZm9ybURhdGFTaXplKSB7XG4gICAgICBjb25zdCB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYkdwdVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICAgIC8vIGRlbGV0ZSB0aGUgb2xkIG1vcnBoIHdlaWdodHMgdW5pZm9ybSBidWZmZXJcbiAgICAgIGlmICh0aGlzLl9fbW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlclVpZCAhPT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQpIHtcbiAgICAgICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmZsdXNoKCk7XG4gICAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5jbGVhckNhY2hlKCk7XG4gICAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5kZWxldGVVbmlmb3JtQnVmZmVyKHRoaXMuX19tb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyVWlkKTtcbiAgICAgICAgdGhpcy5fX21vcnBoV2VpZ2h0c1VuaWZvcm1CdWZmZXJVaWQgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgICAgIH1cblxuICAgICAgLy8gY3JlYXRlIHRoZSBuZXcgbW9ycGggd2VpZ2h0cyB1bmlmb3JtIGJ1ZmZlclxuICAgICAgaWYgKHRoaXMuX19tb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyVWlkID09PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgICBjb25zdCBpbnB1dEFycmF5V2VpZ2h0cyA9IG5ldyBGbG9hdDMyQXJyYXkoYmxlbmRTaGFwZVdlaWdodHNVbmlmb3JtRGF0YVNpemUpO1xuICAgICAgICB0aGlzLl9fdW5pZm9ybU1vcnBoV2VpZ2h0c1R5cGVkQXJyYXkgPSBpbnB1dEFycmF5V2VpZ2h0cztcbiAgICAgICAgdGhpcy5fX21vcnBoV2VpZ2h0c1VuaWZvcm1CdWZmZXJVaWQgPSB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuY3JlYXRlVW5pZm9ybU1vcnBoV2VpZ2h0c0J1ZmZlcihcbiAgICAgICAgICBibGVuZFNoYXBlV2VpZ2h0c1VuaWZvcm1EYXRhU2l6ZSAqIDRcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5fX3VwZGF0ZU1vcnBoV2VpZ2h0c1VuaWZvcm1CdWZmZXIoKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fX2xhc3RNb3JwaFdlaWdodHNVbmlmb3JtRGF0YVNpemUgPSBibGVuZFNoYXBlV2VpZ2h0c1VuaWZvcm1EYXRhU2l6ZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCBzaGFkZXIgcHJvZ3JhbXMgZm9yIGFsbCBwcmltaXRpdmVzIGluIHRoZSBnaXZlbiBtZXNoIGNvbXBvbmVudC5cbiAgICogSXRlcmF0ZXMgdGhyb3VnaCBhbGwgcHJpbWl0aXZlcyBhbmQgZW5zdXJlcyB0aGVpciBtYXRlcmlhbHMgaGF2ZSBwcm9wZXIgc2hhZGVyIHByb2dyYW1zLlxuICAgKlxuICAgKiBAcGFyYW0gbWVzaENvbXBvbmVudCAtIFRoZSBtZXNoIGNvbXBvbmVudCBjb250YWluaW5nIHByaW1pdGl2ZXMgdG8gc2V0dXBcbiAgICovXG4gIHByaXZhdGUgX19zZXR1cFNoYWRlclByb2dyYW1Gb3JNZXNoQ29tcG9uZW50KG1lc2hDb21wb25lbnQ6IE1lc2hDb21wb25lbnQpIHtcbiAgICBpZiAobWVzaENvbXBvbmVudC5tZXNoID09IG51bGwpIHtcbiAgICAgIE1lc2hDb21wb25lbnQuYWxlcnROb01lc2hTZXQobWVzaENvbXBvbmVudCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcHJpbWl0aXZlTnVtID0gbWVzaENvbXBvbmVudC5tZXNoLmdldFByaW1pdGl2ZU51bWJlcigpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJpbWl0aXZlTnVtOyBpKyspIHtcbiAgICAgIGNvbnN0IHByaW1pdGl2ZSA9IG1lc2hDb21wb25lbnQubWVzaC5nZXRQcmltaXRpdmVBdChpKTtcbiAgICAgIGNvbnN0IG1hdGVyaWFsID0gcHJpbWl0aXZlLm1hdGVyaWFsO1xuICAgICAgdGhpcy5fc2V0dXBTaGFkZXJQcm9ncmFtKG1hdGVyaWFsLCBwcmltaXRpdmUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIGEgc2hhZGVyIHByb2dyYW0gZm9yIGEgc3BlY2lmaWMgbWF0ZXJpYWwgYW5kIHByaW1pdGl2ZSBjb21iaW5hdGlvbi5cbiAgICogSGFuZGxlcyBzaGFkZXIgY29tcGlsYXRpb24gZXJyb3JzIGJ5IGZhbGxpbmcgYmFjayB0byBiYWNrdXAgbWF0ZXJpYWxzIHdoZW4gbmVjZXNzYXJ5LlxuICAgKlxuICAgKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgdG8gc2V0dXAgdGhlIHNoYWRlciBmb3JcbiAgICogQHBhcmFtIHByaW1pdGl2ZSAtIFRoZSBwcmltaXRpdmUgdGhhdCB3aWxsIHVzZSB0aGlzIG1hdGVyaWFsXG4gICAqL1xuICBwcml2YXRlIF9zZXR1cFNoYWRlclByb2dyYW0obWF0ZXJpYWw6IE1hdGVyaWFsLCBwcmltaXRpdmU6IFByaW1pdGl2ZSkge1xuICAgIGlmIChtYXRlcmlhbCA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKG1hdGVyaWFsLmlzU2hhZGVyUHJvZ3JhbVJlYWR5KHByaW1pdGl2ZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgdGhpcy5zZXR1cFNoYWRlckZvck1hdGVyaWFsKFxuICAgICAgICBtYXRlcmlhbCxcbiAgICAgICAgcHJpbWl0aXZlLFxuICAgICAgICBXZWJHcHVTdHJhdGVneUJhc2ljLmdldFZlcnRleFNoYWRlck1ldGhvZERlZmluaXRpb25zX3N0b3JhZ2VCdWZmZXIodGhpcy5fX2VuZ2luZSwgU2hhZGVyVHlwZS5WZXJ0ZXhTaGFkZXIpLFxuICAgICAgICBXZWJHcHVTdHJhdGVneUJhc2ljLmdldFZlcnRleFNoYWRlck1ldGhvZERlZmluaXRpb25zX3N0b3JhZ2VCdWZmZXIodGhpcy5fX2VuZ2luZSwgU2hhZGVyVHlwZS5QaXhlbFNoYWRlciksXG4gICAgICAgIFdlYkdwdVN0cmF0ZWd5QmFzaWMuX19nZXRTaGFkZXJQcm9wZXJ0eU9mR2xvYmFsRGF0YVJlcG9zaXRvcnksXG4gICAgICAgIFdlYkdwdVN0cmF0ZWd5QmFzaWMuX19nZXRTaGFkZXJQcm9wZXJ0eU9mTWF0ZXJpYWwsXG4gICAgICAgIFdlYkdwdVN0cmF0ZWd5QmFzaWMuX19nZXRNb3JwaGVkUG9zaXRpb25HZXR0ZXIodGhpcy5fX2VuZ2luZSlcbiAgICAgICk7XG4gICAgICBwcmltaXRpdmUuX2JhY2t1cE1hdGVyaWFsKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoZSBhcyBzdHJpbmcpO1xuICAgICAgcHJpbWl0aXZlLl9yZXN0b3JlTWF0ZXJpYWwoKTtcbiAgICAgIHRoaXMuc2V0dXBTaGFkZXJGb3JNYXRlcmlhbChcbiAgICAgICAgcHJpbWl0aXZlLm1hdGVyaWFsLFxuICAgICAgICBwcmltaXRpdmUsXG4gICAgICAgIFdlYkdwdVN0cmF0ZWd5QmFzaWMuZ2V0VmVydGV4U2hhZGVyTWV0aG9kRGVmaW5pdGlvbnNfc3RvcmFnZUJ1ZmZlcih0aGlzLl9fZW5naW5lLCBTaGFkZXJUeXBlLlZlcnRleFNoYWRlciksXG4gICAgICAgIFdlYkdwdVN0cmF0ZWd5QmFzaWMuZ2V0VmVydGV4U2hhZGVyTWV0aG9kRGVmaW5pdGlvbnNfc3RvcmFnZUJ1ZmZlcih0aGlzLl9fZW5naW5lLCBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyKSxcbiAgICAgICAgV2ViR3B1U3RyYXRlZ3lCYXNpYy5fX2dldFNoYWRlclByb3BlcnR5T2ZHbG9iYWxEYXRhUmVwb3NpdG9yeSxcbiAgICAgICAgV2ViR3B1U3RyYXRlZ3lCYXNpYy5fX2dldFNoYWRlclByb3BlcnR5T2ZNYXRlcmlhbCxcbiAgICAgICAgV2ViR3B1U3RyYXRlZ3lCYXNpYy5fX2dldE1vcnBoZWRQb3NpdGlvbkdldHRlcih0aGlzLl9fZW5naW5lKVxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCBzaGFkZXIgcHJvZ3JhbXMgZm9yIG1hdGVyaWFscyB1c2luZyB0aGUgV2ViR1BVIHJlbmRlcmluZyBzdHJhdGVneS5cbiAgICogVGhpcyBtZXRob2Qgb3JjaGVzdHJhdGVzIHRoZSBzaGFkZXIgY29tcGlsYXRpb24gcHJvY2VzcyBieSBwcm92aWRpbmcgdGhlIG5lY2Vzc2FyeVxuICAgKiBtZXRob2QgZGVmaW5pdGlvbnMgYW5kIHByb3BlcnR5IHNldHRlcnMuXG4gICAqXG4gICAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCB0byBjcmVhdGUgc2hhZGVyIHByb2dyYW1zIGZvclxuICAgKiBAcGFyYW0gcHJpbWl0aXZlIC0gVGhlIHByaW1pdGl2ZSBnZW9tZXRyeSB0aGF0IHdpbGwgdXNlIHRoaXMgbWF0ZXJpYWxcbiAgICogQHBhcmFtIHZlcnRleFNoYWRlck1ldGhvZERlZmluaXRpb25zRm9yVmVydGV4U2hhZGVyIC0gV0dTTCBjb2RlIGNvbnRhaW5pbmcgdmVydGV4IHNoYWRlciBoZWxwZXIgbWV0aG9kc1xuICAgKiBAcGFyYW0gdmVydGV4U2hhZGVyTWV0aG9kRGVmaW5pdGlvbnNGb3JQaXhlbFNoYWRlciAtIFdHU0wgY29kZSBjb250YWluaW5nIHBpeGVsIHNoYWRlciBoZWxwZXIgbWV0aG9kc1xuICAgKiBAcGFyYW0gcHJvcGVydHlTZXR0ZXIgLSBGdW5jdGlvbiB0byBnZW5lcmF0ZSBwcm9wZXJ0eSBhY2Nlc3NvciBtZXRob2RzXG4gICAqL1xuICBwdWJsaWMgc2V0dXBTaGFkZXJGb3JNYXRlcmlhbChcbiAgICBtYXRlcmlhbDogTWF0ZXJpYWwsXG4gICAgcHJpbWl0aXZlOiBQcmltaXRpdmUsXG4gICAgdmVydGV4U2hhZGVyTWV0aG9kRGVmaW5pdGlvbnNGb3JWZXJ0ZXhTaGFkZXI6IHN0cmluZyxcbiAgICB2ZXJ0ZXhTaGFkZXJNZXRob2REZWZpbml0aW9uc0ZvclBpeGVsU2hhZGVyOiBzdHJpbmcsXG4gICAgcHJvcGVydHlTZXR0ZXJPZkdsb2JhbERhdGFSZXBvc2l0b3J5OiBnZXRTaGFkZXJQcm9wZXJ0eUZ1bmNPZkdsb2JhbERhdGFSZXBvc2l0b3J5LFxuICAgIHByb3BlcnR5U2V0dGVyT2ZNYXRlcmlhbDogZ2V0U2hhZGVyUHJvcGVydHlGdW5jT2ZNYXRlcmlhbCxcbiAgICBtb3JwaGVkUG9zaXRpb25HZXR0ZXI6IHN0cmluZ1xuICApOiB2b2lkIHtcbiAgICBtYXRlcmlhbC5fY3JlYXRlUHJvZ3JhbVdlYkdwdShcbiAgICAgIHRoaXMuX19lbmdpbmUsXG4gICAgICBwcmltaXRpdmUsXG4gICAgICB2ZXJ0ZXhTaGFkZXJNZXRob2REZWZpbml0aW9uc0ZvclZlcnRleFNoYWRlcixcbiAgICAgIHZlcnRleFNoYWRlck1ldGhvZERlZmluaXRpb25zRm9yUGl4ZWxTaGFkZXIsXG4gICAgICBwcm9wZXJ0eVNldHRlck9mR2xvYmFsRGF0YVJlcG9zaXRvcnksXG4gICAgICBwcm9wZXJ0eVNldHRlck9mTWF0ZXJpYWwsXG4gICAgICBtb3JwaGVkUG9zaXRpb25HZXR0ZXJcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIHByZS1yZW5kZXJpbmcgb3BlcmF0aW9ucyByZXF1aXJlZCBiZWZvcmUgZHJhd2luZy5cbiAgICogVXBkYXRlcyBzdG9yYWdlIGJ1ZmZlcnMgd2hlbiBjb21wb25lbnRzIGhhdmUgYmVlbiBtb2RpZmllZCBhbmQgaGFuZGxlcyBtb3JwaCB0YXJnZXQgdXBkYXRlcy5cbiAgICogVGhpcyBtZXRob2Qgc2hvdWxkIGJlIGNhbGxlZCBvbmNlIHBlciBmcmFtZSBiZWZvcmUgYW55IHJlbmRlcmluZyBvcGVyYXRpb25zLlxuICAgKi9cbiAgcHJlcmVuZGVyKCk6IHZvaWQge1xuICAgIC8vIFJlLXVwbG9hZCB0aGUgR1BVIGluc3RhbmNlIGRhdGEgd2hlbiBhbnkgb2YgaXRzIHNvdXJjZXMgY2hhbmdlZC4gVGhlIGxpZ2h0IGNsdXN0ZXIgc3lzdGVtIHdyaXRlcyB0aGVcbiAgICAvLyBhbGwtbGlnaHQgbGlzdCBhbmQgdGhlIGNsdXN0ZXIgdGFibGVzIGludG8gdGhlIHNhbWUgc3RvcmFnZSBidWZmZXIsIHNvIGl0cyBgZGF0YVZlcnNpb25gIGlzIGNvbXBhcmVkIGhlcmVcbiAgICAvLyBsaWtlIHRoZSBjb21wb25lbnQgdXBkYXRlIGNvdW50cy5cbiAgICBpZiAoXG4gICAgICBBbmltYXRpb25Db21wb25lbnQuZ2V0SXNBbmltYXRpbmcodGhpcy5fX2VuZ2luZSkgfHxcbiAgICAgIFRyYW5zZm9ybUNvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKSAhPT0gdGhpcy5fX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQgfHxcbiAgICAgIFNjZW5lR3JhcGhDb21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSkgIT09IHRoaXMuX19sYXN0U2NlbmVHcmFwaENvbXBvbmVudHNVcGRhdGVDb3VudCB8fFxuICAgICAgQ2FtZXJhQ29tcG9uZW50LmdldEN1cnJlbnRDYW1lcmFVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKSAhPT0gdGhpcy5fX2xhc3RDYW1lcmFDb21wb25lbnRzVXBkYXRlQ291bnQgfHxcbiAgICAgIF9nZXRDYW1lcmFDb250cm9sbGVyVXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSkgIT09IHRoaXMuX19sYXN0Q2FtZXJhQ29udHJvbGxlckNvbXBvbmVudHNVcGRhdGVDb3VudCB8fFxuICAgICAgdGhpcy5fX2VuZ2luZS5tYXRlcmlhbFJlcG9zaXRvcnkuc3RhdGVWZXJzaW9uICE9PSB0aGlzLl9fbGFzdE1hdGVyaWFsc1VwZGF0ZUNvdW50IHx8XG4gICAgICB0aGlzLl9fZW5naW5lLmxpZ2h0Q2x1c3RlclN5c3RlbS5kYXRhVmVyc2lvbiAhPT0gdGhpcy5fX2xhc3RMaWdodENsdXN0ZXJEYXRhVmVyc2lvbiB8fFxuICAgICAgTGlnaHRDb21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSkgIT09IHRoaXMuX19sYXN0TGlnaHRDb21wb25lbnRzVXBkYXRlQ291bnRcbiAgICApIHtcbiAgICAgIGNvbnN0IGlzU3RvcmFnZUJ1ZmZlclJlY3JlYXRlZCA9IHRoaXMuX19jcmVhdGVBbmRVcGRhdGVTdG9yYWdlQnVmZmVyKCk7XG4gICAgICAvLyBUaGUgR1BVIGN1bGxpbmcgcmVhZHMgdGhlIHRyYW5zZm9ybXMgYW5kIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSBpbnN0YW5jZXMgZnJvbSB0aGUgR1BVIGluc3RhbmNlIGRhdGEuXG4gICAgICB0aGlzLl9fZW5naW5lLndlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5fbWFya0dwdUN1bGxpbmdJbnB1dHNEaXJ0eSgpO1xuICAgICAgLy8gVGhlIGNvbXB1dGUgc2hhZGVycyByZWJ1aWxkIHRoZSBsaWdodCBjbHVzdGVycyB3aGVuIHRoZWlyIGlucHV0cyBjaGFuZ2VkLCBhbmQgYWZ0ZXIgYSBuZXcgc3RvcmFnZSBidWZmZXIgd2FzXG4gICAgICAvLyBjcmVhdGVkIGZyb20gdGhlIENQVSBkYXRhICh3aGljaCBkb2VzIG5vdCBjb250YWluIHRoZSBjbHVzdGVycyBidWlsdCBvbiB0aGUgR1BVKS5cbiAgICAgIC8vIFRoZSBvcmRlciBtYXR0ZXJzOiB0aGUgYnVpbGQgZGlzcGF0Y2hlcyBtdXN0IGJlIHJlY29yZGVkIGFmdGVyIHRoZSB1cGxvYWRzLCBzbyB0aGF0IHRoZXkgb3ZlcndyaXRlIHRoZVxuICAgICAgLy8gKHN0YWxlIG9yIHplcm9lZCkgY2x1c3RlciByZWdpb25zIG9mIHRoZSBDUFUgZGF0YS5cbiAgICAgIGNvbnN0IGxpZ2h0Q2x1c3RlckRhdGFWZXJzaW9uID0gdGhpcy5fX2VuZ2luZS5saWdodENsdXN0ZXJTeXN0ZW0uZGF0YVZlcnNpb247XG4gICAgICBpZiAoaXNTdG9yYWdlQnVmZmVyUmVjcmVhdGVkIHx8IGxpZ2h0Q2x1c3RlckRhdGFWZXJzaW9uICE9PSB0aGlzLl9fbGFzdExpZ2h0Q2x1c3RlckJ1aWxkRGF0YVZlcnNpb24pIHtcbiAgICAgICAgdGhpcy5fX2J1aWxkTGlnaHRDbHVzdGVyc09uR3B1KCk7XG4gICAgICAgIHRoaXMuX19sYXN0TGlnaHRDbHVzdGVyQnVpbGREYXRhVmVyc2lvbiA9IGxpZ2h0Q2x1c3RlckRhdGFWZXJzaW9uO1xuICAgICAgfVxuICAgICAgdGhpcy5fX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQgPSBUcmFuc2Zvcm1Db21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSk7XG4gICAgICB0aGlzLl9fbGFzdFNjZW5lR3JhcGhDb21wb25lbnRzVXBkYXRlQ291bnQgPSBTY2VuZUdyYXBoQ29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICAgICAgdGhpcy5fX2xhc3RDYW1lcmFDb21wb25lbnRzVXBkYXRlQ291bnQgPSBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudENhbWVyYVVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICAgICAgdGhpcy5fX2xhc3RDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gX2dldENhbWVyYUNvbnRyb2xsZXJVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKTtcbiAgICAgIHRoaXMuX19sYXN0TWF0ZXJpYWxzVXBkYXRlQ291bnQgPSB0aGlzLl9fZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5zdGF0ZVZlcnNpb247XG4gICAgICB0aGlzLl9fbGFzdExpZ2h0Q2x1c3RlckRhdGFWZXJzaW9uID0gdGhpcy5fX2VuZ2luZS5saWdodENsdXN0ZXJTeXN0ZW0uZGF0YVZlcnNpb247XG4gICAgICB0aGlzLl9fbGFzdExpZ2h0Q29tcG9uZW50c1VwZGF0ZUNvdW50ID0gTGlnaHRDb21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSk7XG4gICAgfVxuXG4gICAgY29uc3QgbW9ycGhNYXhJbmRleCA9IFByaW1pdGl2ZS5nZXRQcmltaXRpdmVDb3VudEhhc01vcnBoKCk7XG4gICAgaWYgKG1vcnBoTWF4SW5kZXggIT09IHRoaXMuX19sYXN0TW9ycGhNYXhJbmRleCkge1xuICAgICAgdGhpcy5fX2NyZWF0ZU9yVXBkYXRlU3RvcmFnZUJsZW5kU2hhcGVCdWZmZXIoKTtcbiAgICAgIHRoaXMuX19sYXN0TW9ycGhNYXhJbmRleCA9IG1vcnBoTWF4SW5kZXg7XG4gICAgICAvLyBUaGUgdmVydGV4IGRlZm9ybWF0aW9uIG9mIHRoZSBHUFUgY3VsbGluZyByZWFkcyB0aGUgbW9ycGggdGFyZ2V0cy5cbiAgICAgIHRoaXMuX19lbmdpbmUud2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5Ll9tYXJrR3B1Q3VsbGluZ0lucHV0c0RpcnR5KCk7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgQmxlbmRTaGFwZUNvbXBvbmVudC51cGRhdGVDb3VudCAhPT0gdGhpcy5fX2xhc3RCbGVuZFNoYXBlQ29tcG9uZW50c1VwZGF0ZUNvdW50Rm9yV2VpZ2h0cyB8fFxuICAgICAgQmxlbmRTaGFwZUNvbXBvbmVudC5nZXRDb3VudE9mQmxlbmRTaGFwZUNvbXBvbmVudHModGhpcy5fX2VuZ2luZSkgIT09IHRoaXMuX19jb3VudE9mQmxlbmRTaGFwZUNvbXBvbmVudHNcbiAgICApIHtcbiAgICAgIHRoaXMuX191cGRhdGVNb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyKCk7XG4gICAgICAvLyBUaGUgdmVydGV4IGRlZm9ybWF0aW9uIG9mIHRoZSBHUFUgY3VsbGluZyByZWFkcyB0aGUgYmxlbmQgc2hhcGUgd2VpZ2h0cy5cbiAgICAgIHRoaXMuX19lbmdpbmUud2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5Ll9tYXJrR3B1Q3VsbGluZ0lucHV0c0RpcnR5KCk7XG4gICAgICB0aGlzLl9fbGFzdEJsZW5kU2hhcGVDb21wb25lbnRzVXBkYXRlQ291bnRGb3JXZWlnaHRzID0gQmxlbmRTaGFwZUNvbXBvbmVudC51cGRhdGVDb3VudDtcbiAgICAgIHRoaXMuX19jb3VudE9mQmxlbmRTaGFwZUNvbXBvbmVudHMgPSBCbGVuZFNoYXBlQ29tcG9uZW50LmdldENvdW50T2ZCbGVuZFNoYXBlQ29tcG9uZW50cyh0aGlzLl9fZW5naW5lKTtcbiAgICAgIHRoaXMuX19lbmdpbmUubWF0ZXJpYWxSZXBvc2l0b3J5Ll9tYWtlU2hhZGVySW52YWxpZGF0ZVRvTW9ycGhNYXRlcmlhbHMoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTWFpbiByZW5kZXJpbmcgbWV0aG9kIHRoYXQgZHJhd3MgYWxsIHByaW1pdGl2ZXMgaW4gdGhlIHNwZWNpZmllZCByZW5kZXIgcGFzcy5cbiAgICogSGFuZGxlcyBkaWZmZXJlbnQgcHJpbWl0aXZlIHR5cGVzIChvcGFxdWUsIHRyYW5zbHVjZW50LCBibGVuZCkgd2l0aCBhcHByb3ByaWF0ZSBkZXB0aCB3cml0aW5nIHNldHRpbmdzLlxuICAgKlxuICAgKiBAcGFyYW0gcHJpbWl0aXZlVWlkcyAtIEFycmF5IG9mIHByaW1pdGl2ZSBVSURzIHRvIHJlbmRlciwgc29ydGVkIGJ5IHJlbmRlcmluZyBvcmRlclxuICAgKiBAcGFyYW0gcmVuZGVyUGFzcyAtIFRoZSByZW5kZXIgcGFzcyBjb25maWd1cmF0aW9uIGNvbnRhaW5pbmcgcmVuZGVyaW5nIHNldHRpbmdzXG4gICAqIEBwYXJhbSByZW5kZXJQYXNzVGlja0NvdW50IC0gQ3VycmVudCB0aWNrIGNvdW50IGZvciBhbmltYXRpb24gYW5kIHRpbWluZyBwdXJwb3Nlc1xuICAgKiBAcGFyYW0gZGlzcGxheUlkeCAtIFRoZSBpbmRleCBvZiB0aGUgZGlzcGxheSB0byByZW5kZXIgdG9cbiAgICogQHJldHVybnMgVHJ1ZSBpZiBhbnkgcHJpbWl0aXZlcyB3ZXJlIHN1Y2Nlc3NmdWxseSByZW5kZXJlZFxuICAgKi9cbiAgY29tbW9uXyRyZW5kZXIoXG4gICAgcHJpbWl0aXZlVWlkczogUHJpbWl0aXZlVUlEW10sXG4gICAgcmVuZGVyUGFzczogUmVuZGVyUGFzcyxcbiAgICBfcmVuZGVyUGFzc1RpY2tDb3VudDogQ291bnQsXG4gICAgZGlzcGxheUlkeDogSW5kZXhcbiAgKTogYm9vbGVhbiB7XG4gICAgaWYgKHJlbmRlclBhc3MuaXNCdWZmZXJMZXNzUmVuZGVyaW5nTW9kZSgpKSB7XG4gICAgICB0aGlzLl9fcmVuZGVyV2l0aG91dEJ1ZmZlcnMocmVuZGVyUGFzcyk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBsZXQgcmVuZGVyZWRTb21ldGhpbmcgPSBmYWxzZTtcbiAgICBjb25zdCBpc1pXcml0ZSA9IHJlbmRlclBhc3MuaXNEZXB0aFRlc3QgJiYgcmVuZGVyUGFzcy5kZXB0aFdyaXRlTWFzaztcbiAgICBjb25zdCB1c2VEZXB0aFByZXBhc3MgPSB0aGlzLl9faXNEZXB0aFByZXBhc3NBdmFpbGFibGUocmVuZGVyUGFzcyk7XG4gICAgLy8gRHJhdyB0aGUgb3BhcXVlIHByaW1pdGl2ZXMgZGVwdGgtb25seSBmaXJzdCwgc28gdGhlIGNvbG9yIHBhc3MgY2FuIHJlamVjdCBoaWRkZW4gZnJhZ21lbnRzIGJlZm9yZSBzaGFkaW5nLlxuICAgIGlmICh1c2VEZXB0aFByZXBhc3MpIHtcbiAgICAgIGZvciAobGV0IGkgPSByZW5kZXJQYXNzLl9sYXN0T3BhcXVlSW5kZXg7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIHRoaXMucmVuZGVySW5uZXIocHJpbWl0aXZlVWlkc1tpXSwgcmVuZGVyUGFzcywgdHJ1ZSwgZGlzcGxheUlkeCwgeyBkZXB0aE9ubHk6IHRydWUgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIEZvciBvcGFxdWUgcHJpbWl0aXZlc1xuICAgIGlmIChyZW5kZXJQYXNzLl90b1JlbmRlck9wYXF1ZVByaW1pdGl2ZXMpIHtcbiAgICAgIGZvciAobGV0IGkgPSByZW5kZXJQYXNzLl9sYXN0T3BhcXVlSW5kZXg7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIC8vIERyYXdpbmcgZnJvbSB0aGUgbmVhcmVzdCBvYmplY3RcbiAgICAgICAgY29uc3QgcHJpbWl0aXZlVWlkID0gcHJpbWl0aXZlVWlkc1tpXTtcbiAgICAgICAgY29uc3QgcmVuZGVyZWQgPSB0aGlzLnJlbmRlcklubmVyKHByaW1pdGl2ZVVpZCwgcmVuZGVyUGFzcywgaXNaV3JpdGUsIGRpc3BsYXlJZHgsIHtcbiAgICAgICAgICBhbGxvd0VxdWFsRGVwdGg6IHVzZURlcHRoUHJlcGFzcyxcbiAgICAgICAgfSk7XG4gICAgICAgIHJlbmRlcmVkU29tZXRoaW5nIHx8PSByZW5kZXJlZDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBGb3IgdHJhbnNsdWNlbnQgcHJpbWl0aXZlc1xuICAgIGlmIChyZW5kZXJQYXNzLl90b1JlbmRlclRyYW5zbHVjZW50UHJpbWl0aXZlcykge1xuICAgICAgLy8gRHJhdyBUcmFuc2x1Y2VudCBwcmltaXRpdmVzXG4gICAgICBmb3IgKGxldCBpID0gcmVuZGVyUGFzcy5fbGFzdE9wYXF1ZUluZGV4ICsgMTsgaSA8PSByZW5kZXJQYXNzLl9sYXN0VHJhbnNsdWNlbnRJbmRleDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHByaW1pdGl2ZVVpZCA9IHByaW1pdGl2ZVVpZHNbaV07XG4gICAgICAgIGNvbnN0IHJlbmRlcmVkID0gdGhpcy5yZW5kZXJJbm5lcihwcmltaXRpdmVVaWQsIHJlbmRlclBhc3MsIGlzWldyaXRlLCBkaXNwbGF5SWR4KTtcbiAgICAgICAgcmVuZGVyZWRTb21ldGhpbmcgfHw9IHJlbmRlcmVkO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChyZW5kZXJQYXNzLl90b1JlbmRlckJsZW5kV2l0aFpXcml0ZVByaW1pdGl2ZXMpIHtcbiAgICAgIC8vIERyYXcgQmxlbmQgcHJpbWl0aXZlcyB3aXRoIFpXcml0ZVxuICAgICAgZm9yIChsZXQgaSA9IHJlbmRlclBhc3MuX2xhc3RUcmFuc2x1Y2VudEluZGV4ICsgMTsgaSA8PSByZW5kZXJQYXNzLl9sYXN0QmxlbmRXaXRoWldyaXRlSW5kZXg7IGkrKykge1xuICAgICAgICBjb25zdCBwcmltaXRpdmVVaWQgPSBwcmltaXRpdmVVaWRzW2ldO1xuICAgICAgICBjb25zdCByZW5kZXJlZCA9IHRoaXMucmVuZGVySW5uZXIocHJpbWl0aXZlVWlkLCByZW5kZXJQYXNzLCBpc1pXcml0ZSwgZGlzcGxheUlkeCk7XG4gICAgICAgIHJlbmRlcmVkU29tZXRoaW5nIHx8PSByZW5kZXJlZDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocmVuZGVyUGFzcy5fdG9SZW5kZXJCbGVuZFdpdGhvdXRaV3JpdGVQcmltaXRpdmVzKSB7XG4gICAgICAvLyBEcmF3IEJsZW5kIHByaW1pdGl2ZXMgd2l0aG91dCBaV3JpdGVcbiAgICAgIGZvciAobGV0IGkgPSByZW5kZXJQYXNzLl9sYXN0QmxlbmRXaXRoWldyaXRlSW5kZXggKyAxOyBpIDw9IHJlbmRlclBhc3MuX2xhc3RCbGVuZFdpdGhvdXRaV3JpdGVJbmRleDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHByaW1pdGl2ZVVpZCA9IHByaW1pdGl2ZVVpZHNbaV07XG4gICAgICAgIGNvbnN0IHJlbmRlcmVkID0gdGhpcy5yZW5kZXJJbm5lcihwcmltaXRpdmVVaWQsIHJlbmRlclBhc3MsIGZhbHNlLCBkaXNwbGF5SWR4KTtcbiAgICAgICAgcmVuZGVyZWRTb21ldGhpbmcgfHw9IHJlbmRlcmVkO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZW5kZXJlZFNvbWV0aGluZztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5kZXJzIHByaW1pdGl2ZXMgd2l0aG91dCB1c2luZyB2ZXJ0ZXgvaW5kZXggYnVmZmVycy5cbiAgICogVGhpcyBpcyB1c2VkIGZvciBzcGVjaWFsIHJlbmRlcmluZyBtb2RlcyBsaWtlIGZ1bGwtc2NyZWVuIGVmZmVjdHMgb3IgcHJvY2VkdXJhbCBnZW9tZXRyeS5cbiAgICpcbiAgICogQHBhcmFtIHJlbmRlclBhc3MgLSBUaGUgcmVuZGVyIHBhc3MgY29udGFpbmluZyB0aGUgbWF0ZXJpYWwgYW5kIHJlbmRlcmluZyBjb25maWd1cmF0aW9uXG4gICAqL1xuICBwcml2YXRlIF9fcmVuZGVyV2l0aG91dEJ1ZmZlcnMocmVuZGVyUGFzczogUmVuZGVyUGFzcykge1xuICAgIGNvbnN0IG1hdGVyaWFsID0gcmVuZGVyUGFzcy5tYXRlcmlhbCE7XG4gICAgY29uc3QgcHJpbWl0aXZlID0gcmVuZGVyUGFzcy5fZHVtbXlQcmltaXRpdmVGb3JCdWZmZXJMZXNzUmVuZGVyaW5nO1xuICAgIHRoaXMuX3NldHVwU2hhZGVyUHJvZ3JhbShtYXRlcmlhbCwgcHJpbWl0aXZlKTtcblxuICAgIGNvbnN0IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGNvbnN0IGNhbWVyYVNJRCA9IHRoaXMuX19nZXRBcHByb3ByaWF0ZUNhbWVyYUNvbXBvbmVudFNJRChyZW5kZXJQYXNzLCAwLCBmYWxzZSk7XG4gICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LnNldERyYXdQYXJhbWV0ZXJzKG1hdGVyaWFsLm1hdGVyaWFsU0lELCBjYW1lcmFTSUQsIDAsIDApO1xuICAgIGNvbnN0IGlzWldyaXRlID0gcmVuZGVyUGFzcy5pc0RlcHRoVGVzdCAmJiByZW5kZXJQYXNzLmRlcHRoV3JpdGVNYXNrO1xuICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5kcmF3KHRoaXMuX19lbmdpbmUsIHByaW1pdGl2ZSwgbWF0ZXJpYWwsIHJlbmRlclBhc3MsIGNhbWVyYVNJRCwgaXNaV3JpdGUsIDApO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGRlcHRoIHByZXBhc3MgY2FuIHJ1biBmb3IgdGhlIHJlbmRlciBwYXNzOiBpdCBtdXN0IGJlIGVuYWJsZWQsIGRyYXcgdGhlIHNjZW5lIGl0c2VsZiAocmVuZGVyIHBhc3Nlc1xuICAgKiB3aXRoIGEgbWF0ZXJpYWwgb3ZlcnJpZGUgc3VjaCBhcyBzaGFkb3cgbWFwcyBhbmQgcG9zdCBlZmZlY3RzIGFyZSBleGNsdWRlZCksIGFuZCB3cml0ZSBkZXB0aC5cbiAgICovXG4gIHByaXZhdGUgX19pc0RlcHRoUHJlcGFzc0F2YWlsYWJsZShyZW5kZXJQYXNzOiBSZW5kZXJQYXNzKSB7XG4gICAgY29uc3QgZnJhbWVidWZmZXIgPSByZW5kZXJQYXNzLmdldEZyYW1lYnVmZmVyKCk7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuX19lbmdpbmUuY29uZmlnLmlzRGVwdGhQcmVwYXNzRW5hYmxlZCAmJlxuICAgICAgcmVuZGVyUGFzcy5tYXRlcmlhbCA9PSBudWxsICYmXG4gICAgICByZW5kZXJQYXNzLmlzRGVwdGhUZXN0ICYmXG4gICAgICByZW5kZXJQYXNzLmRlcHRoV3JpdGVNYXNrICYmXG4gICAgICAoZnJhbWVidWZmZXIgPT0gbnVsbCB8fCBmcmFtZWJ1ZmZlci5kZXB0aEF0dGFjaG1lbnQgIT0gbnVsbCkgJiZcbiAgICAgIHJlbmRlclBhc3MuX3RvUmVuZGVyT3BhcXVlUHJpbWl0aXZlcyAmJlxuICAgICAgcmVuZGVyUGFzcy5fbGFzdE9wYXF1ZUluZGV4ID49IDBcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbmRlcnMgYSBzaW5nbGUgcHJpbWl0aXZlIHdpdGggdGhlIHNwZWNpZmllZCBtYXRlcmlhbCBhbmQgcmVuZGVyIHNldHRpbmdzLlxuICAgKiBIYW5kbGVzIHNoYWRlciBzZXR1cCwgdW5pZm9ybSBidWZmZXIgdXBkYXRlcywgYW5kIHRoZSBhY3R1YWwgZHJhdyBjYWxsLlxuICAgKlxuICAgKiBAcGFyYW0gcHJpbWl0aXZlVWlkIC0gVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIHByaW1pdGl2ZSB0byByZW5kZXJcbiAgICogQHBhcmFtIHJlbmRlclBhc3MgLSBSZW5kZXIgcGFzcyBjb250YWluaW5nIHJlbmRlcmluZyBjb25maWd1cmF0aW9uXG4gICAqIEBwYXJhbSB6V3JpdGUgLSBXaGV0aGVyIHRvIGVuYWJsZSBkZXB0aCBidWZmZXIgd3JpdGluZ1xuICAgKiBAcGFyYW0gZGlzcGxheUlkeCAtIFRoZSBpbmRleCBvZiB0aGUgZGlzcGxheSB0byByZW5kZXIgdG9cbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgcHJpbWl0aXZlIHdhcyBzdWNjZXNzZnVsbHkgcmVuZGVyZWRcbiAgICovXG4gIHJlbmRlcklubmVyKFxuICAgIHByaW1pdGl2ZVVpZDogUHJpbWl0aXZlVUlELFxuICAgIHJlbmRlclBhc3M6IFJlbmRlclBhc3MsXG4gICAgeldyaXRlOiBib29sZWFuLFxuICAgIGRpc3BsYXlJZHg6IEluZGV4LFxuICAgIG9wdGlvbnM6IHsgZGVwdGhPbmx5PzogYm9vbGVhbjsgYWxsb3dFcXVhbERlcHRoPzogYm9vbGVhbiB9ID0ge31cbiAgKSB7XG4gICAgaWYgKHByaW1pdGl2ZVVpZCA9PT0gLTEpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgcHJpbWl0aXZlID0gUHJpbWl0aXZlLmdldFByaW1pdGl2ZShwcmltaXRpdmVVaWQpO1xuICAgIGlmIChwcmltaXRpdmUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBtYXRlcmlhbDogTWF0ZXJpYWwgPSByZW5kZXJQYXNzLmdldEFwcHJvcHJpYXRlTWF0ZXJpYWwocHJpbWl0aXZlKTtcbiAgICB0aGlzLl9zZXR1cFNoYWRlclByb2dyYW0obWF0ZXJpYWwsIHByaW1pdGl2ZSk7XG4gICAgaWYgKGlzU2tpcERyYXdpbmcobWF0ZXJpYWwsIHByaW1pdGl2ZSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgb3B0aW9ucy5kZXB0aE9ubHkgJiZcbiAgICAgIChtYXRlcmlhbC5hbHBoYU1vZGUgPT09IEFscGhhTW9kZS5NYXNrIHx8IG1hdGVyaWFsLmFscGhhVG9Db3ZlcmFnZSB8fCBtYXRlcmlhbC5pc1NoYWRlckRlZmluZSgnUk5fVVNFX1dJUkVGUkFNRScpKVxuICAgICkge1xuICAgICAgLy8gVGhlIHByZXBhc3MgY2Fubm90IGRpc2NhcmQgKG9yIGFwcGx5IGEgcGVyLXNhbXBsZSBjb3ZlcmFnZSksIHNvIHRob3NlIHByaW1pdGl2ZXMga2VlcCB0aGVpciBub3JtYWwgZHJhd1xuICAgICAgLy8gYW5kIGRlcHRoIHdyaXRlLiBJbmNsdWRpbmcgdGhlbSB3b3VsZCBvY2NsdWRlIHRoZSBzdXJmYWNlcyBiZWhpbmQgdGhlIGRpc2NhcmRlZCBmcmFnbWVudHMuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3Qgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy5fX2VuZ2luZS53ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgY29uc3Qgd2VieHJTeXN0ZW0gPSB0aGlzLl9fZW5naW5lLl93ZWJYUlN5c3RlbUlmRW5hYmxlZDtcbiAgICBjb25zdCBjYW1lcmFTSUQgPSB0aGlzLl9fZ2V0QXBwcm9wcmlhdGVDYW1lcmFDb21wb25lbnRTSUQoXG4gICAgICByZW5kZXJQYXNzLFxuICAgICAgZGlzcGxheUlkeCBhcyAwIHwgMSxcbiAgICAgICh3ZWJ4clN5c3RlbT8uaXNXZWJYUk1vZGUgPz8gZmFsc2UpICYmIHJlbmRlclBhc3MuaXNWclJlbmRlcmluZ1xuICAgICk7XG5cbiAgICBjb25zdCBwcmltaXRpdmVJZHhIYXNNb3JwaCA9IFByaW1pdGl2ZS5nZXRQcmltaXRpdmVJZHhIYXNNb3JwaChwcmltaXRpdmUucHJpbWl0aXZlVWlkKSA/PyAwO1xuICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5zZXREcmF3UGFyYW1ldGVycyhcbiAgICAgIG1hdGVyaWFsLm1hdGVyaWFsU0lELFxuICAgICAgY2FtZXJhU0lELFxuICAgICAgcHJpbWl0aXZlSWR4SGFzTW9ycGgsXG4gICAgICBwcmltaXRpdmUudGFyZ2V0cy5sZW5ndGhcbiAgICApO1xuICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5kcmF3KFxuICAgICAgdGhpcy5fX2VuZ2luZSxcbiAgICAgIHByaW1pdGl2ZSxcbiAgICAgIG1hdGVyaWFsLFxuICAgICAgcmVuZGVyUGFzcyxcbiAgICAgIGNhbWVyYVNJRCxcbiAgICAgIHpXcml0ZSxcbiAgICAgIGRpc3BsYXlJZHgsXG4gICAgICBvcHRpb25zXG4gICAgKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIG9yIHVwZGF0ZXMgdGhlIG1haW4gc3RvcmFnZSBidWZmZXIgY29udGFpbmluZyBhbGwgR1BVIGluc3RhbmNlIGRhdGEuXG4gICAqIFRoaXMgYnVmZmVyIGhvbGRzIHRyYW5zZm9ybSBtYXRyaWNlcywgbWF0ZXJpYWwgcHJvcGVydGllcywgYW5kIG90aGVyIHBlci1pbnN0YW5jZSBkYXRhXG4gICAqIHJlcXVpcmVkIGZvciByZW5kZXJpbmcgYWxsIG9iamVjdHMgaW4gdGhlIHNjZW5lLlxuICAgKi9cbiAgcHJpdmF0ZSBfX2NyZWF0ZUFuZFVwZGF0ZVN0b3JhZ2VCdWZmZXIoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbWVtb3J5TWFuYWdlciA9IHRoaXMuX19lbmdpbmUubWVtb3J5TWFuYWdlcjtcblxuICAgIC8vIHRoZSBHUFUgZ2xvYmFsIFN0b3JhZ2VcbiAgICBjb25zdCBncHVJbnN0YW5jZURhdGFCdWZmZXJzID0gbWVtb3J5TWFuYWdlci5nZXRCdWZmZXJzKEJ1ZmZlclVzZS5HUFVJbnN0YW5jZURhdGEpO1xuICAgIGNvbnN0IGdwdUluc3RhbmNlRGF0YUJ1ZmZlckNvdW50ID0gZ3B1SW5zdGFuY2VEYXRhQnVmZmVycy5sZW5ndGg7XG4gICAgY29uc3Qgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy5fX2VuZ2luZS53ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgaWYgKGdwdUluc3RhbmNlRGF0YUJ1ZmZlckNvdW50ICE9PSB0aGlzLl9fbGFzdEdwdUluc3RhbmNlRGF0YUJ1ZmZlckNvdW50KSB7XG4gICAgICB0aGlzLl9fbGFzdEdwdUluc3RhbmNlRGF0YUJ1ZmZlckNvdW50ID0gZ3B1SW5zdGFuY2VEYXRhQnVmZmVyQ291bnQ7XG4gICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuZGVzdHJveVN0b3JhZ2VCdWZmZXIodGhpcy5fX3N0b3JhZ2VCdWZmZXJVaWQpO1xuICAgICAgdGhpcy5fX3N0b3JhZ2VCdWZmZXJVaWQgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgICB9XG5cbiAgICAvLyBjb25zdCBkYXRhVGV4dHVyZUJ5dGVTaXplID1cbiAgICAvLyAgIE1lbW9yeU1hbmFnZXIuYnVmZmVyV2lkdGhMZW5ndGggKiBNZW1vcnlNYW5hZ2VyLmJ1ZmZlckhlaWdodExlbmd0aCAqIDQgKiA0O1xuICAgIGlmICh0aGlzLl9fc3RvcmFnZUJ1ZmZlclVpZCAhPT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQpIHtcbiAgICAgIC8vIFVwZGF0ZS4gVGhlIGxpZ2h0IGNsdXN0ZXIgbGlzdHMgYXJlIGxhcmdlIGFuZCB3cml0dGVuIGJ5IHRoZSBjb21wdXRlIHNoYWRlcnMgb3IgdXBsb2FkZWQgYXMgZGlydHkgcmFuZ2VzLFxuICAgICAgLy8gc28gdGhlIGdlbmVyaWMgdXBsb2FkIHNraXBzIHRoZW0uXG4gICAgICBjb25zdCBsaWdodENsdXN0ZXJTeXN0ZW0gPSB0aGlzLl9fZW5naW5lLmxpZ2h0Q2x1c3RlclN5c3RlbTtcbiAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS51cGRhdGVTdG9yYWdlQnVmZmVyKFxuICAgICAgICB0aGlzLl9fc3RvcmFnZUJ1ZmZlclVpZCxcbiAgICAgICAgZ3B1SW5zdGFuY2VEYXRhQnVmZmVycyxcbiAgICAgICAgbGlnaHRDbHVzdGVyU3lzdGVtLl9nZXRFeGNsdWRlZEJ5dGVSYW5nZXMoKVxuICAgICAgKTtcbiAgICAgIGNvbnN0IGRpcnR5UmFuZ2VzID0gbGlnaHRDbHVzdGVyU3lzdGVtLl90YWtlRGlydHlCeXRlUmFuZ2VzKCk7XG4gICAgICBpZiAoZGlydHlSYW5nZXMubGVuZ3RoID4gMCkge1xuICAgICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkudXBkYXRlU3RvcmFnZUJ1ZmZlclJhbmdlcyhcbiAgICAgICAgICB0aGlzLl9fc3RvcmFnZUJ1ZmZlclVpZCxcbiAgICAgICAgICBncHVJbnN0YW5jZURhdGFCdWZmZXJzLFxuICAgICAgICAgIGRpcnR5UmFuZ2VzXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIENyZWF0ZSAodXBsb2FkcyBldmVyeXRoaW5nLCBpbmNsdWRpbmcgdGhlIGxpZ2h0IGNsdXN0ZXJzIGJ1aWx0IG9uIHRoZSBDUFUpXG4gICAgdGhpcy5fX3N0b3JhZ2VCdWZmZXJVaWQgPSB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuY3JlYXRlU3RvcmFnZUJ1ZmZlcihncHVJbnN0YW5jZURhdGFCdWZmZXJzKTtcbiAgICB0aGlzLl9fZW5naW5lLmxpZ2h0Q2x1c3RlclN5c3RlbS5fdGFrZURpcnR5Qnl0ZVJhbmdlcygpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkcyB0aGUgQ2x1c3RlcmVkIEZvcndhcmQgbGlnaHQgY2x1c3RlciB0YWJsZXMgd2l0aCBjb21wdXRlIHNoYWRlcnMgd2hlbiB0aGUgTGlnaHRDbHVzdGVyU3lzdGVtXG4gICAqIGJ1aWxkcyB0aGVtIG9uIHRoZSBHUFUuIEl0IG11c3QgcnVuIGFmdGVyIGV2ZXJ5IHVwbG9hZCBvZiB0aGUgR1BVIGluc3RhbmNlIGRhdGEsIHdoaWNoIG92ZXJ3cml0ZXMgdGhlIHRhYmxlcy5cbiAgICovXG4gIHByaXZhdGUgX19idWlsZExpZ2h0Q2x1c3RlcnNPbkdwdSgpIHtcbiAgICBjb25zdCBwYXJhbXMgPSB0aGlzLl9fZW5naW5lLmxpZ2h0Q2x1c3RlclN5c3RlbS5fZ2V0R3B1QnVpbGRQYXJhbXMoKTtcbiAgICBpZiAocGFyYW1zID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy5fX2VuZ2luZS53ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgY29uc3Qgc3RvcmFnZUJ1ZmZlciA9IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5fZ2V0U3RvcmFnZUJ1ZmZlcigpO1xuICAgIGlmIChzdG9yYWdlQnVmZmVyID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fX2xpZ2h0Q2x1c3RlckJ1aWxkZXIgPz89IG5ldyBXZWJHcHVMaWdodENsdXN0ZXJCdWlsZGVyKFxuICAgICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmdldFdlYkdwdURldmljZVdyYXBwZXIoKS5ncHVEZXZpY2VcbiAgICApO1xuICAgIGNvbnN0IGdwdVRpbWVyID0gdGhpcy5fX2VuZ2luZS5ncHVUaW1lckVuYWJsZWQgPyB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuX2dldEdwdVRpbWVyKCkgOiB1bmRlZmluZWQ7XG4gICAgdGhpcy5fX2xpZ2h0Q2x1c3RlckJ1aWxkZXIuYnVpbGQoc3RvcmFnZUJ1ZmZlciwgcGFyYW1zLCBncHVUaW1lcik7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBvciB1cGRhdGVzIHRoZSBzdG9yYWdlIGJ1ZmZlciBjb250YWluaW5nIGJsZW5kIHNoYXBlIHZlcnRleCBkYXRhLlxuICAgKiBUaGlzIGJ1ZmZlciBob2xkcyBtb3JwaCB0YXJnZXQgcG9zaXRpb25zIGFuZCBvdGhlciB2ZXJ0ZXggYXR0cmlidXRlcyBuZWVkZWQgZm9yIGJsZW5kIHNoYXBlIGFuaW1hdGlvbi5cbiAgICovXG4gIHByaXZhdGUgX19jcmVhdGVPclVwZGF0ZVN0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyKCkge1xuICAgIGNvbnN0IG1lbW9yeU1hbmFnZXIgPSB0aGlzLl9fZW5naW5lLm1lbW9yeU1hbmFnZXI7XG5cbiAgICAvLyB0aGUgR1BVIGdsb2JhbCBTdG9yYWdlXG4gICAgY29uc3QgYmxlbmRTaGFwZURhdGFCdWZmZXJzOiBCdWZmZXJbXSA9IG1lbW9yeU1hbmFnZXIuZ2V0QnVmZmVycyhCdWZmZXJVc2UuR1BVVmVydGV4RGF0YSk7XG5cbiAgICBpZiAoYmxlbmRTaGFwZURhdGFCdWZmZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGJsZW5kU2hhcGVEYXRhQnVmZmVyQnl0ZUxlbmd0aCA9IGJsZW5kU2hhcGVEYXRhQnVmZmVycy5yZWR1Y2UoKGFjYywgYnVmZmVyKSA9PiBhY2MgKyBidWZmZXIuYnl0ZUxlbmd0aCwgMCk7XG5cbiAgICBpZiAoYmxlbmRTaGFwZURhdGFCdWZmZXJCeXRlTGVuZ3RoICE9PSB0aGlzLl9fc3RvcmFnZUJsZW5kU2hhcGVCdWZmZXJCeXRlTGVuZ3RoKSB7XG4gICAgICB0aGlzLl9fZW5naW5lLndlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5kZWxldGVTdG9yYWdlQmxlbmRTaGFwZUJ1ZmZlcih0aGlzLl9fc3RvcmFnZUJsZW5kU2hhcGVCdWZmZXJVaWQpO1xuICAgICAgdGhpcy5fX3N0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyVWlkID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gICAgICB0aGlzLl9fc3RvcmFnZUJsZW5kU2hhcGVCdWZmZXJCeXRlTGVuZ3RoID0gYmxlbmRTaGFwZURhdGFCdWZmZXJCeXRlTGVuZ3RoO1xuICAgIH1cblxuICAgIGNvbnN0IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGNvbnN0IGZsb2F0MzJBcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoYmxlbmRTaGFwZURhdGFCdWZmZXJCeXRlTGVuZ3RoIC8gNCk7XG4gICAgLy8gY29weSB0aGUgZGF0YSBmcm9tIHRoZSBibGVuZFNoYXBlRGF0YUJ1ZmZlcnMgdG8gdGhlIGZsb2F0MzJBcnJheVxuICAgIGxldCBvZmZzZXQgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmxlbmRTaGFwZURhdGFCdWZmZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBidWZmZXIgPSBibGVuZFNoYXBlRGF0YUJ1ZmZlcnNbaV07XG4gICAgICBmbG9hdDMyQXJyYXkuc2V0KG5ldyBGbG9hdDMyQXJyYXkoYnVmZmVyLmdldEFycmF5QnVmZmVyKCkpLCBvZmZzZXQpO1xuICAgICAgb2Zmc2V0ICs9IGJ1ZmZlci5ieXRlTGVuZ3RoIC8gNDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fX3N0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyVWlkICE9PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgLy8gVXBkYXRlXG4gICAgICBjb25zdCBjb21wb25lbnRTaXplRm9yRGF0YVRleHR1cmUgPSBibGVuZFNoYXBlRGF0YUJ1ZmZlckJ5dGVMZW5ndGggLyA0O1xuICAgICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LnVwZGF0ZVN0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyKFxuICAgICAgICB0aGlzLl9fc3RvcmFnZUJsZW5kU2hhcGVCdWZmZXJVaWQsXG4gICAgICAgIGZsb2F0MzJBcnJheSxcbiAgICAgICAgY29tcG9uZW50U2l6ZUZvckRhdGFUZXh0dXJlXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBDcmVhdGVcbiAgICAgIHRoaXMuX19zdG9yYWdlQmxlbmRTaGFwZUJ1ZmZlclVpZCA9IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5jcmVhdGVTdG9yYWdlQmxlbmRTaGFwZUJ1ZmZlcihmbG9hdDMyQXJyYXkpO1xuICAgIH1cblxuICAgIHRoaXMuX191cGRhdGVNb3JwaE9mZnNldHNVbmlmb3JtQnVmZmVyKCk7XG4gIH1cblxuICBwcml2YXRlIF9fdXBkYXRlTW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlcigpIHtcbiAgICBjb25zdCB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYkdwdVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBjb25zdCBtb3JwaFVuaWZvcm1EYXRhT2Zmc2V0cyA9IFByaW1pdGl2ZS5nZXRNb3JwaFVuaWZvcm1EYXRhT2Zmc2V0cygpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgUHJpbWl0aXZlLmdldFByaW1pdGl2ZUNvdW50SGFzTW9ycGgoKTsgaSsrKSB7XG4gICAgICBjb25zdCBwcmltaXRpdmUgPSBQcmltaXRpdmUuZ2V0UHJpbWl0aXZlSGFzTW9ycGgoaSk7XG4gICAgICBpZiAocHJpbWl0aXZlICE9IG51bGwpIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBwcmltaXRpdmUudGFyZ2V0cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGNvbnN0IHRhcmdldCA9IHByaW1pdGl2ZS50YXJnZXRzW2pdO1xuICAgICAgICAgIGNvbnN0IGFjY2Vzc29yID0gdGFyZ2V0LmdldChWZXJ0ZXhBdHRyaWJ1dGUuUG9zaXRpb24uWFlaKSBhcyBBY2Nlc3NvcjtcbiAgICAgICAgICBjb25zdCBieXRlT2Zmc2V0T2ZFeGlzdGluZ0J1ZmZlciA9IHRoaXMuX19lbmdpbmUubWVtb3J5TWFuYWdlci5nZXRCeXRlT2Zmc2V0T2ZFeGlzdGluZ0J1ZmZlcnMoXG4gICAgICAgICAgICBCdWZmZXJVc2UuR1BVVmVydGV4RGF0YSxcbiAgICAgICAgICAgIGFjY2Vzc29yLmJ1ZmZlclZpZXcuYnVmZmVyLmluZGV4T2ZUaGVCdWZmZXJVc2FnZVxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5fX3VuaWZvcm1Nb3JwaE9mZnNldHNUeXBlZEFycmF5IVttb3JwaFVuaWZvcm1EYXRhT2Zmc2V0c1tpXSArIGpdID1cbiAgICAgICAgICAgIChieXRlT2Zmc2V0T2ZFeGlzdGluZ0J1ZmZlciArIGFjY2Vzc29yLmJ5dGVPZmZzZXRJbkJ1ZmZlcikgLyA0IC8gNDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGVsZW1lbnROdW1Ub0NvcHkgPSBtb3JwaFVuaWZvcm1EYXRhT2Zmc2V0c1ttb3JwaFVuaWZvcm1EYXRhT2Zmc2V0cy5sZW5ndGggLSAxXTtcbiAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkudXBkYXRlVW5pZm9ybU1vcnBoT2Zmc2V0c0J1ZmZlcih0aGlzLl9fdW5pZm9ybU1vcnBoT2Zmc2V0c1R5cGVkQXJyYXkhLCBlbGVtZW50TnVtVG9Db3B5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHVuaWZvcm0gYnVmZmVycyBjb250YWluaW5nIG1vcnBoIHRhcmdldCB3ZWlnaHRzIGZvciBibGVuZCBzaGFwZSBhbmltYXRpb24uXG4gICAqIENvcGllcyB3ZWlnaHQgdmFsdWVzIGZyb20gYmxlbmQgc2hhcGUgY29tcG9uZW50cyB0byBHUFUtYWNjZXNzaWJsZSB1bmlmb3JtIGJ1ZmZlcnMuXG4gICAqL1xuICBwcml2YXRlIF9fdXBkYXRlTW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlcigpIHtcbiAgICBjb25zdCBtZW1vcnlNYW5hZ2VyID0gdGhpcy5fX2VuZ2luZS5tZW1vcnlNYW5hZ2VyO1xuICAgIGNvbnN0IGJsZW5kU2hhcGVEYXRhQnVmZmVyOiBCdWZmZXIgfCB1bmRlZmluZWQgPSBtZW1vcnlNYW5hZ2VyLmdldEJ1ZmZlcihCdWZmZXJVc2UuR1BVVmVydGV4RGF0YSk7XG4gICAgaWYgKGJsZW5kU2hhcGVEYXRhQnVmZmVyID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGJsZW5kU2hhcGVEYXRhQnVmZmVyLnRha2VuU2l6ZUluQnl0ZSA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGJsZW5kU2hhcGVVbmlmb3JtRGF0YU9mZnNldHMgPSBCbGVuZFNoYXBlQ29tcG9uZW50LmdldE9mZnNldHNJblVuaWZvcm0odGhpcy5fX2VuZ2luZSk7XG4gICAgY29uc3QgYmxlbmRTaGFwZUNvbXBvbmVudHMgPSB0aGlzLl9fZW5naW5lLmNvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50c1dpdGhUeXBlV2l0aG91dEZpbHRlcmluZyhcbiAgICAgIEJsZW5kU2hhcGVDb21wb25lbnRcbiAgICApIGFzIChCbGVuZFNoYXBlQ29tcG9uZW50IHwgdW5kZWZpbmVkKVtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmxlbmRTaGFwZUNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGJsZW5kU2hhcGVDb21wb25lbnQgPSBibGVuZFNoYXBlQ29tcG9uZW50c1tpXTtcbiAgICAgIGNvbnN0IHdlaWdodHMgPSBibGVuZFNoYXBlQ29tcG9uZW50ICE9IG51bGwgPyBibGVuZFNoYXBlQ29tcG9uZW50IS53ZWlnaHRzIDogW107XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHdlaWdodHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgdGhpcy5fX3VuaWZvcm1Nb3JwaFdlaWdodHNUeXBlZEFycmF5IVtibGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzW2ldICsgal0gPSB3ZWlnaHRzW2pdO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoYmxlbmRTaGFwZUNvbXBvbmVudHMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3Qgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy5fX2VuZ2luZS53ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgICBjb25zdCBlbGVtZW50TnVtVG9Db3B5ID0gYmxlbmRTaGFwZVVuaWZvcm1EYXRhT2Zmc2V0c1tibGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzLmxlbmd0aCAtIDFdO1xuICAgICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LnVwZGF0ZVVuaWZvcm1Nb3JwaFdlaWdodHNCdWZmZXIodGhpcy5fX3VuaWZvcm1Nb3JwaFdlaWdodHNUeXBlZEFycmF5ISwgZWxlbWVudE51bVRvQ29weSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgdGhlIGFwcHJvcHJpYXRlIGNhbWVyYSBjb21wb25lbnQgU0lEIGZvciB0aGUgY3VycmVudCByZW5kZXJpbmcgY29udGV4dC5cbiAgICogSGFuZGxlcyBib3RoIFZSIGFuZCBub24tVlIgcmVuZGVyaW5nIHNjZW5hcmlvcywgaW5jbHVkaW5nIG11bHRpLXZpZXcgc3RlcmVvIHJlbmRlcmluZy5cbiAgICpcbiAgICogQHBhcmFtIHJlbmRlclBhc3MgLSBUaGUgY3VycmVudCByZW5kZXIgcGFzc1xuICAgKiBAcGFyYW0gZGlzcGxheUlkeCAtIERpc3BsYXkgaW5kZXggZm9yIHN0ZXJlbyByZW5kZXJpbmcgKDAgZm9yIGxlZnQgZXllLCAxIGZvciByaWdodCBleWUpXG4gICAqIEBwYXJhbSBpc1ZSTWFpblBhc3MgLSBXaGV0aGVyIHRoaXMgaXMgYSBWUiBtYWluIHJlbmRlcmluZyBwYXNzXG4gICAqIEByZXR1cm5zIFRoZSBjb21wb25lbnQgU0lEIG9mIHRoZSBhcHByb3ByaWF0ZSBjYW1lcmEsIG9yIC0xIGlmIG5vIGNhbWVyYSBpcyBhdmFpbGFibGVcbiAgICovXG4gIHByaXZhdGUgX19nZXRBcHByb3ByaWF0ZUNhbWVyYUNvbXBvbmVudFNJRChyZW5kZXJQYXNzOiBSZW5kZXJQYXNzLCBkaXNwbGF5SWR4OiAwIHwgMSwgaXNWUk1haW5QYXNzOiBib29sZWFuKTogbnVtYmVyIHtcbiAgICBpZiAoaXNWUk1haW5QYXNzKSB7XG4gICAgICBjb25zdCB3ZWJ4clN5c3RlbSA9IHRoaXMuX19lbmdpbmUuX3dlYlhSU3lzdGVtSWZFbmFibGVkO1xuICAgICAgbGV0IGNhbWVyYUNvbXBvbmVudFNpZCA9IC0xO1xuICAgICAgaWYgKHdlYnhyU3lzdGVtPy5pc1dlYlhSTW9kZSkge1xuICAgICAgICBpZiAod2VieHJTeXN0ZW0uaXNNdWx0aVZpZXcoKSkge1xuICAgICAgICAgIGNhbWVyYUNvbXBvbmVudFNpZCA9IHdlYnhyU3lzdGVtLl9nZXRDYW1lcmFDb21wb25lbnRTSURBdCgwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYW1lcmFDb21wb25lbnRTaWQgPSB3ZWJ4clN5c3RlbS5fZ2V0Q2FtZXJhQ29tcG9uZW50U0lEQXQoZGlzcGxheUlkeCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBjYW1lcmFDb21wb25lbnRTaWQ7XG4gICAgfVxuICAgIC8vIE5vbi1WUiBSZW5kZXJpbmdcbiAgICBsZXQgY2FtZXJhQ29tcG9uZW50ID0gcmVuZGVyUGFzcy5jYW1lcmFDb21wb25lbnQ7XG4gICAgaWYgKGNhbWVyYUNvbXBvbmVudCA9PSBudWxsKSB7XG4gICAgICAvLyBpZiB0aGUgcmVuZGVyUGFzcyBoYXMgbm8gY2FtZXJhQ29tcG9uZW50LCB0cnkgdG8gZ2V0IHRoZSBjdXJyZW50IGNhbWVyYUNvbXBvbmVudFxuICAgICAgY2FtZXJhQ29tcG9uZW50ID0gdGhpcy5fX2VuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudChcbiAgICAgICAgQ2FtZXJhQ29tcG9uZW50LFxuICAgICAgICBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudCh0aGlzLl9fZW5naW5lKVxuICAgICAgKSBhcyBDYW1lcmFDb21wb25lbnQ7XG4gICAgfVxuICAgIGlmIChjYW1lcmFDb21wb25lbnQpIHtcbiAgICAgIHJldHVybiBjYW1lcmFDb21wb25lbnQuY29tcG9uZW50U0lEO1xuICAgIH1cbiAgICByZXR1cm4gLTE7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgYWxsIEdQVSByZXNvdXJjZXMgaGVsZCBieSB0aGlzIHN0cmF0ZWd5LlxuICAgKiBTaG91bGQgYmUgY2FsbGVkIHdoZW4gdGhlIGVuZ2luZSBpcyBiZWluZyBkZXN0cm95ZWQuXG4gICAqL1xuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIGNvbnN0IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIHRoaXMuX19saWdodENsdXN0ZXJCdWlsZGVyPy5kZXN0cm95KCk7XG4gICAgdGhpcy5fX2xpZ2h0Q2x1c3RlckJ1aWxkZXIgPSB1bmRlZmluZWQ7XG4gICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5Ll9kZXN0cm95R3B1Q3VsbGluZygpO1xuICAgIGlmICh0aGlzLl9fc3RvcmFnZUJ1ZmZlclVpZCAhPT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQpIHtcbiAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5kZXN0cm95U3RvcmFnZUJ1ZmZlcih0aGlzLl9fc3RvcmFnZUJ1ZmZlclVpZCk7XG4gICAgICB0aGlzLl9fc3RvcmFnZUJ1ZmZlclVpZCA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX3N0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyVWlkICE9PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmRlbGV0ZVN0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyKHRoaXMuX19zdG9yYWdlQmxlbmRTaGFwZUJ1ZmZlclVpZCk7XG4gICAgICB0aGlzLl9fc3RvcmFnZUJsZW5kU2hhcGVCdWZmZXJVaWQgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX19tb3JwaE9mZnNldHNVbmlmb3JtQnVmZmVyVWlkICE9PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmRlbGV0ZVVuaWZvcm1CdWZmZXIodGhpcy5fX21vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJVaWQpO1xuICAgICAgdGhpcy5fX21vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJVaWQgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX19tb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyVWlkICE9PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmRlbGV0ZVVuaWZvcm1CdWZmZXIodGhpcy5fX21vcnBoV2VpZ2h0c1VuaWZvcm1CdWZmZXJVaWQpO1xuICAgICAgdGhpcy5fX21vcnBoV2VpZ2h0c1VuaWZvcm1CdWZmZXJVaWQgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgICB9XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxTQUFTLDBCQUEwQjtBQUNuQyxTQUFTLDJCQUEyQjtBQUNwQyxTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHVDQUF1QztBQUNoRCxTQUFTLHNCQUFzQjtBQUMvQixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLDJCQUEyQjtBQUNwQyxTQUFTLDBCQUEwQjtBQUNuQyxTQUFTLGlCQUFrQztBQUMzQyxTQUFTLGlCQUFpQjtBQUMxQixTQUFTLGlCQUFpQjtBQUMxQixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHVCQUF1QjtBQU9oQyxTQUFTLGtCQUF1QztBQUNoRCxTQUFTLHVCQUF1QjtB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
