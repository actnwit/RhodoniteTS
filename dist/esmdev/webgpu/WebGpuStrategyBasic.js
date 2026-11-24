// src/webgpu/WebGpuStrategyBasic.ts
import { AnimationComponent } from "../foundation/components/Animation/AnimationComponent.js";
import { BlendShapeComponent } from "../foundation/components/BlendShape/BlendShapeComponent.js";
import { CameraComponent } from "../foundation/components/Camera/CameraComponent.js";
import { CameraControllerComponent } from "../foundation/components/CameraController/CameraControllerComponent.js";
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
    if (AnimationComponent.getIsAnimating(this.__engine) || TransformComponent.getUpdateCount(this.__engine) !== this.__lastTransformComponentsUpdateCount || SceneGraphComponent.getUpdateCount(this.__engine) !== this.__lastSceneGraphComponentsUpdateCount || CameraComponent.getCurrentCameraUpdateCount(this.__engine) !== this.__lastCameraComponentsUpdateCount || CameraControllerComponent.getUpdateCount(this.__engine) !== this.__lastCameraControllerComponentsUpdateCount || this.__engine.materialRepository.stateVersion !== this.__lastMaterialsUpdateCount || this.__engine.lightClusterSystem.dataVersion !== this.__lastLightClusterDataVersion || LightComponent.getUpdateCount(this.__engine) !== this.__lastLightComponentsUpdateCount) {
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
      this.__lastCameraControllerComponentsUpdateCount = CameraControllerComponent.getUpdateCount(this.__engine);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3JjL3dlYmdwdS9XZWJHcHVTdHJhdGVneUJhc2ljLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBBbmltYXRpb25Db21wb25lbnQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvbXBvbmVudHMvQW5pbWF0aW9uL0FuaW1hdGlvbkNvbXBvbmVudCc7XG5pbXBvcnQgeyBCbGVuZFNoYXBlQ29tcG9uZW50IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb21wb25lbnRzL0JsZW5kU2hhcGUvQmxlbmRTaGFwZUNvbXBvbmVudCc7XG5pbXBvcnQgeyBDYW1lcmFDb21wb25lbnQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvbXBvbmVudHMvQ2FtZXJhL0NhbWVyYUNvbXBvbmVudCc7XG5pbXBvcnQgeyBDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb21wb25lbnRzL0NhbWVyYUNvbnRyb2xsZXIvQ2FtZXJhQ29udHJvbGxlckNvbXBvbmVudCc7XG5pbXBvcnQgeyBMaWdodENvbXBvbmVudCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29tcG9uZW50cy9MaWdodC9MaWdodENvbXBvbmVudCc7XG5pbXBvcnQgeyBNZXNoQ29tcG9uZW50IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb21wb25lbnRzL01lc2gvTWVzaENvbXBvbmVudCc7XG5pbXBvcnQgeyBTY2VuZUdyYXBoQ29tcG9uZW50IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb21wb25lbnRzL1NjZW5lR3JhcGgvU2NlbmVHcmFwaENvbXBvbmVudCc7XG5pbXBvcnQgeyBUcmFuc2Zvcm1Db21wb25lbnQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvbXBvbmVudHMvVHJhbnNmb3JtL1RyYW5zZm9ybUNvbXBvbmVudCc7XG5pbXBvcnQgeyBDb21wb25lbnQsIHR5cGUgTWVtYmVySW5mbyB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29yZS9Db21wb25lbnQnO1xuaW1wb3J0IHsgQWxwaGFNb2RlIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9BbHBoYU1vZGUnO1xuaW1wb3J0IHsgQnVmZmVyVXNlIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9CdWZmZXJVc2UnO1xuaW1wb3J0IHsgQ29tcG9uZW50VHlwZSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvQ29tcG9uZW50VHlwZSc7XG5pbXBvcnQgeyBDb21wb3NpdGlvblR5cGUgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL0NvbXBvc2l0aW9uVHlwZSc7XG5pbXBvcnQgdHlwZSB7XG4gIGdldFNoYWRlclByb3BlcnR5RnVuY09mR2xvYmFsRGF0YVJlcG9zaXRvcnksXG4gIGdldFNoYWRlclByb3BlcnR5RnVuY09mTWF0ZXJpYWwsXG4gIFNoYWRlclNlbWFudGljc05hbWUsXG59IGZyb20gJy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvU2hhZGVyU2VtYW50aWNzJztcbmltcG9ydCB0eXBlIHsgU2hhZGVyU2VtYW50aWNzSW5mbyB9IGZyb20gJy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvU2hhZGVyU2VtYW50aWNzSW5mbyc7XG5pbXBvcnQgeyBTaGFkZXJUeXBlLCB0eXBlIFNoYWRlclR5cGVFbnVtIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9TaGFkZXJUeXBlJztcbmltcG9ydCB7IFZlcnRleEF0dHJpYnV0ZSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvVmVydGV4QXR0cmlidXRlJztcbmltcG9ydCB7IFByaW1pdGl2ZSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vZ2VvbWV0cnkvUHJpbWl0aXZlJztcbmltcG9ydCB7IGdldFRleHR1cmVBbmRTYW1wbGVyTmFtZXMgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2hlbHBlcnMvU2hhZGVySGVscGVyJztcbmltcG9ydCB0eXBlIHsgTWF0ZXJpYWwgfSBmcm9tICcuLi9mb3VuZGF0aW9uL21hdGVyaWFscy9jb3JlL01hdGVyaWFsJztcbmltcG9ydCB0eXBlIHsgQWNjZXNzb3IgfSBmcm9tICcuLi9mb3VuZGF0aW9uL21lbW9yeS9BY2Nlc3Nvcic7XG5pbXBvcnQgdHlwZSB7IEJ1ZmZlciB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWVtb3J5L0J1ZmZlcic7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi9mb3VuZGF0aW9uL21pc2MvTG9nZ2VyJztcbmltcG9ydCB7IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9yZW5kZXJlci9DR0FQSVJlc291cmNlUmVwb3NpdG9yeSc7XG5pbXBvcnQgdHlwZSB7IENHQVBJU3RyYXRlZ3kgfSBmcm9tICcuLi9mb3VuZGF0aW9uL3JlbmRlcmVyL0NHQVBJU3RyYXRlZ3knO1xuaW1wb3J0IHsgaXNTa2lwRHJhd2luZyB9IGZyb20gJy4uL2ZvdW5kYXRpb24vcmVuZGVyZXIvUmVuZGVyaW5nQ29tbW9uTWV0aG9kcyc7XG5pbXBvcnQgdHlwZSB7IFJlbmRlclBhc3MgfSBmcm9tICcuLi9mb3VuZGF0aW9uL3JlbmRlcmVyL1JlbmRlclBhc3MnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi9mb3VuZGF0aW9uL3N5c3RlbS9FbmdpbmUnO1xuaW1wb3J0IHR5cGUge1xuICBDR0FQSVJlc291cmNlSGFuZGxlLFxuICBDb3VudCxcbiAgSW5kZXgsXG4gIEluZGV4T2Y0Qnl0ZXMsXG4gIEluZGV4T2YxNkJ5dGVzLFxuICBQcmltaXRpdmVVSUQsXG59IGZyb20gJy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB7IFdlYkdwdUxpZ2h0Q2x1c3RlckJ1aWxkZXIgfSBmcm9tICcuL1dlYkdwdUxpZ2h0Q2x1c3RlckJ1aWxkZXInO1xuXG4vKipcbiAqIEJhc2ljIFdlYkdQVSByZW5kZXJpbmcgc3RyYXRlZ3kgaW1wbGVtZW50YXRpb24gdGhhdCBoYW5kbGVzIG1lc2ggcmVuZGVyaW5nLFxuICogc3RvcmFnZSBidWZmZXIgbWFuYWdlbWVudCwgYW5kIHNoYWRlciBwcm9ncmFtIHNldHVwIGZvciBXZWJHUFUtYmFzZWQgcmVuZGVyaW5nIHBpcGVsaW5lLlxuICpcbiAqIFRoaXMgY2xhc3MgcHJvdmlkZXMgYSBjb21wbGV0ZSByZW5kZXJpbmcgc29sdXRpb24gdXNpbmcgV2ViR1BVIEFQSSwgaW5jbHVkaW5nOlxuICogLSBTdG9yYWdlIGJ1ZmZlciBtYW5hZ2VtZW50IGZvciBlZmZpY2llbnQgR1BVIGRhdGEgdHJhbnNmZXJcbiAqIC0gU2hhZGVyIHByb2dyYW0gY29tcGlsYXRpb24gYW5kIHNldHVwXG4gKiAtIE1vcnBoIHRhcmdldCBhbmQgYmxlbmQgc2hhcGUgaGFuZGxpbmdcbiAqIC0gQ2FtZXJhIGFuZCB0cmFuc2Zvcm0gbWF0cml4IHVwZGF0ZXNcbiAqIC0gUmVuZGVyIHBhc3MgZXhlY3V0aW9uIHdpdGggcHJvcGVyIHByaW1pdGl2ZSBzb3J0aW5nXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IHN0cmF0ZWd5ID0gV2ViR3B1U3RyYXRlZ3lCYXNpYy5nZXRJbnN0YW5jZSgpO1xuICogc3RyYXRlZ3kucHJlcmVuZGVyKCk7XG4gKiBzdHJhdGVneS5jb21tb25fJHJlbmRlcihwcmltaXRpdmVVaWRzLCByZW5kZXJQYXNzLCB0aWNrQ291bnQpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBXZWJHcHVTdHJhdGVneUJhc2ljIGltcGxlbWVudHMgQ0dBUElTdHJhdGVneSB7XG4gIHByaXZhdGUgX19lbmdpbmU6IEVuZ2luZTtcbiAgcHJpdmF0ZSBfX3N0b3JhZ2VCdWZmZXJVaWQ6IENHQVBJUmVzb3VyY2VIYW5kbGUgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgcHJpdmF0ZSBfX3N0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyVWlkOiBDR0FQSVJlc291cmNlSGFuZGxlID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gIHByaXZhdGUgX191bmlmb3JtTW9ycGhPZmZzZXRzVHlwZWRBcnJheT86IFVpbnQzMkFycmF5O1xuICBwcml2YXRlIF9fdW5pZm9ybU1vcnBoV2VpZ2h0c1R5cGVkQXJyYXk/OiBGbG9hdDMyQXJyYXk7XG5cbiAgcHJpdmF0ZSBfX2xhc3RNYXRlcmlhbHNVcGRhdGVDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdExpZ2h0Q2x1c3RlckRhdGFWZXJzaW9uID0gLTE7XG4gIHByaXZhdGUgX19sYXN0TGlnaHRDb21wb25lbnRzVXBkYXRlQ291bnQgPSAtMTtcbiAgcHJpdmF0ZSBfX2xpZ2h0Q2x1c3RlckJ1aWxkZXI/OiBXZWJHcHVMaWdodENsdXN0ZXJCdWlsZGVyO1xuICBwcml2YXRlIF9fbGFzdExpZ2h0Q2x1c3RlckJ1aWxkRGF0YVZlcnNpb24gPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RTY2VuZUdyYXBoQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gLTE7XG4gIHByaXZhdGUgX19sYXN0Q2FtZXJhQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gLTE7XG4gIHByaXZhdGUgX19sYXN0Q2FtZXJhQ29udHJvbGxlckNvbXBvbmVudHNVcGRhdGVDb3VudCA9IC0xO1xuXG4gIHByaXZhdGUgX19sYXN0QmxlbmRTaGFwZUNvbXBvbmVudHNVcGRhdGVDb3VudEZvcldlaWdodHMgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RNb3JwaE1heEluZGV4ID0gLTE7XG4gIHByaXZhdGUgX19sYXN0R3B1SW5zdGFuY2VEYXRhQnVmZmVyQ291bnQgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RNb3JwaE9mZnNldHNVbmlmb3JtRGF0YVNpemUgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RNb3JwaFdlaWdodHNVbmlmb3JtRGF0YVNpemUgPSAtMTtcbiAgcHJpdmF0ZSBfX21vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJVaWQgPSAtMTtcbiAgcHJpdmF0ZSBfX21vcnBoV2VpZ2h0c1VuaWZvcm1CdWZmZXJVaWQgPSAtMTtcbiAgcHJpdmF0ZSBfX3N0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyQnl0ZUxlbmd0aCA9IC0xO1xuICBwcml2YXRlIF9fY291bnRPZkJsZW5kU2hhcGVDb21wb25lbnRzID0gLTE7XG5cbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihlbmdpbmU6IEVuZ2luZSkge1xuICAgIHRoaXMuX19lbmdpbmUgPSBlbmdpbmU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc2luZ2xldG9uIGluc3RhbmNlIG9mIFdlYkdwdVN0cmF0ZWd5QmFzaWMuXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2UgaWYgbm9uZSBleGlzdHMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBzaW5nbGV0b24gaW5zdGFuY2Ugb2YgV2ViR3B1U3RyYXRlZ3lCYXNpY1xuICAgKi9cbiAgc3RhdGljIGluaXQoZW5naW5lOiBFbmdpbmUpIHtcbiAgICByZXR1cm4gbmV3IFdlYkdwdVN0cmF0ZWd5QmFzaWMoZW5naW5lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgdmVydGV4IHNoYWRlciBtZXRob2QgZGVmaW5pdGlvbnMgZm9yIHN0b3JhZ2UgYnVmZmVyIGFjY2Vzcy5cbiAgICogVGhlc2UgbWV0aG9kcyBwcm92aWRlIHN0YW5kYXJkaXplZCBhY2Nlc3MgdG8gdHJhbnNmb3JtIG1hdHJpY2VzLCB2aXNpYmlsaXR5IGZsYWdzLFxuICAgKiBhbmQgbW9ycGhpbmcgZnVuY3Rpb25hbGl0eSBpbiB2ZXJ0ZXggc2hhZGVycy5cbiAgICpcbiAgICogQHJldHVybnMgV0dTTCBzaGFkZXIgY29kZSBjb250YWluaW5nIGhlbHBlciBmdW5jdGlvbnMgZm9yIHN0b3JhZ2UgYnVmZmVyIGFjY2Vzc1xuICAgKi9cbiAgc3RhdGljIGdldFZlcnRleFNoYWRlck1ldGhvZERlZmluaXRpb25zX3N0b3JhZ2VCdWZmZXIoZW5naW5lOiBFbmdpbmUsIHNoYWRlclR5cGU6IFNoYWRlclR5cGVFbnVtKSB7XG4gICAgbGV0IHN0ciA9ICcnO1xuICAgIGNvbnN0IG1lbWJlckluZm8gPSBDb21wb25lbnQuZ2V0TWVtYmVySW5mbyhlbmdpbmUpO1xuICAgIG1lbWJlckluZm8uZm9yRWFjaCgobWFwTWVtYmVyTmFtZU1lbWJlckluZm8sIGNvbXBvbmVudENsYXNzKSA9PiB7XG4gICAgICBtYXBNZW1iZXJOYW1lTWVtYmVySW5mby5mb3JFYWNoKChtZW1iZXJJbmZvLCBtZW1iZXJOYW1lKSA9PiB7XG4gICAgICAgIGlmIChtZW1iZXJJbmZvLnNoYWRlclR5cGUgIT09IHNoYWRlclR5cGUgJiYgbWVtYmVySW5mby5zaGFkZXJUeXBlICE9PSBTaGFkZXJUeXBlLlZlcnRleEFuZFBpeGVsU2hhZGVyKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldyA9IENvbXBvbmVudC5nZXRDb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcoZW5naW5lKS5nZXQoY29tcG9uZW50Q2xhc3MpID8/IDE7XG4gICAgICAgIGlmIChDb21wb3NpdGlvblR5cGUuaXNBcnJheShtZW1iZXJJbmZvLmNvbXBvc2l0aW9uVHlwZSkpIHtcbiAgICAgICAgICBwcm9jZXNzRm9yQXJyYXlUeXBlKG1lbWJlckluZm8sIGNvbXBvbmVudENsYXNzLCBtZW1iZXJOYW1lLCBjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHByb2Nlc3NGb3JOb25BcnJheVR5cGUobWVtYmVySW5mbywgY29tcG9uZW50Q2xhc3MsIG1lbWJlck5hbWUsIGNvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHN0cjtcblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NGb3JBcnJheVR5cGUoXG4gICAgICBtZW1iZXJJbmZvOiBNZW1iZXJJbmZvLFxuICAgICAgY29tcG9uZW50Q2xhc3M6IHR5cGVvZiBDb21wb25lbnQsXG4gICAgICBtZW1iZXJOYW1lOiBzdHJpbmcsXG4gICAgICBjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXc6IG51bWJlclxuICAgICkge1xuICAgICAgbGV0IHR5cGVTdHIgPSAnJztcbiAgICAgIGxldCBmZXRjaFR5cGVTdHIgPSAnJztcbiAgICAgIHN3aXRjaCAobWVtYmVySW5mby5jb21wb3NpdGlvblR5cGUpIHtcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjNEFycmF5OlxuICAgICAgICAgIHR5cGVTdHIgPSAndmVjNDxmMzI+JztcbiAgICAgICAgICBmZXRjaFR5cGVTdHIgPSAnZmV0Y2hWZWM0JztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0NEFycmF5OlxuICAgICAgICAgIHR5cGVTdHIgPSAnbWF0NHg0PGYzMj4nO1xuICAgICAgICAgIGZldGNoVHlwZVN0ciA9ICdmZXRjaE1hdDQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQ0eDNBcnJheTpcbiAgICAgICAgICB0eXBlU3RyID0gJ21hdDR4MzxmMzI+JztcbiAgICAgICAgICBmZXRjaFR5cGVTdHIgPSAnZmV0Y2hNYXQ0eDMnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgY29tcG9zaXRpb24gdHlwZTogJHttZW1iZXJJbmZvLmNvbXBvc2l0aW9uVHlwZS5zdHJ9YCk7XG4gICAgICB9XG4gICAgICBjb25zdCB2ZWM0U2l6ZU9mUHJvcGVydHk6IEluZGV4T2YxNkJ5dGVzID0gbWVtYmVySW5mby5jb21wb3NpdGlvblR5cGUuZ2V0VmVjNFNpemVPZlByb3BlcnR5KCk7XG5cbiAgICAgIGlmIChtZW1iZXJJbmZvLmlzVmFyaWFibGVMZW5ndGggPT09IHRydWUpIHtcbiAgICAgICAgLy8gRWFjaCBpbnN0YW5jZSBoYXMgaXRzIG93biBjaHVuay4gSXRzIGxvY2F0aW9uIGlzIHN0b3JlZCBpbiB0aGUgYCR7bWVtYmVyTmFtZX1Mb2NhdGlvbmAgbWVtYmVyLlxuICAgICAgICBjb25zdCByYWRpeCA9IENvbXBvbmVudC5fdmFyaWFibGVMZW5ndGhMb2NhdGlvblJhZGl4O1xuICAgICAgICBzdHIgKz0gYFxuICBmbiBnZXRfJHttZW1iZXJOYW1lfShpbnN0YW5jZUlkOiB1MzIsIGlkeE9mQXJyYXk6IHUzMikgLT4gJHt0eXBlU3RyfSB7XG4gICAgbGV0IGxvY2F0aW9uID0gZ2V0XyR7Q29tcG9uZW50Ll9nZXRWYXJpYWJsZUxlbmd0aExvY2F0aW9uTWVtYmVyTmFtZShtZW1iZXJOYW1lKX0oaW5zdGFuY2VJZCk7XG4gICAgbGV0IGluZGV4OiB1MzIgPSB1MzIobG9jYXRpb24ueCkgKiAke3JhZGl4fXUgKyB1MzIobG9jYXRpb24ueSkgKyAke3ZlYzRTaXplT2ZQcm9wZXJ0eX11ICogaWR4T2ZBcnJheTtcbiAgICBsZXQgdmFsdWUgPSAke2ZldGNoVHlwZVN0cn0oaW5kZXgpO1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICBgO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGxvY2F0aW9uT2Zmc2V0c192ZWM0X2lkeCA9IENvbXBvbmVudC5nZXRMb2NhdGlvbk9mZnNldE9mTWVtYmVyT2ZDb21wb25lbnQoXG4gICAgICAgIGVuZ2luZSxcbiAgICAgICAgY29tcG9uZW50Q2xhc3MsXG4gICAgICAgIG1lbWJlck5hbWVcbiAgICAgICk7XG4gICAgICBjb25zdCBhcnJheUxlbmd0aCA9IENvbXBvbmVudC5nZXRBcnJheUxlbmd0aE9mTWVtYmVyKGVuZ2luZSkuZ2V0KGNvbXBvbmVudENsYXNzKT8uZ2V0KG1lbWJlck5hbWUpID8/IDA7XG4gICAgICBjb25zdCBhcnJheUxlbmd0aFN0ciA9IGBsZXQgYXJyYXlMZW5ndGg6IHUzMiA9ICR7YXJyYXlMZW5ndGh9dTtgO1xuICAgICAgLy8gVGhlIG9mZnNldHMgb2YgdGhlIGJ1ZmZlciB2aWV3cyBhcmUgYSBjb21waWxlLXRpbWUgY29uc3RhbnQuIFRoZXkgbXVzdCBiZSBkZWNsYXJlZCBhdCBtb2R1bGUgc2NvcGU6IGFcbiAgICAgIC8vIHZhcjxmdW5jdGlvbj4gYXJyYXkgaXMgaW5pdGlhbGl6ZWQgb24gZXZlcnkgY2FsbCwgd2hpY2ggaXMgZXhwZW5zaXZlIHdoZW4gYSBzY2VuZSBoYXMgbWFueSBjb21wb25lbnRzIG9mXG4gICAgICAvLyB0aGUgY2xhc3MgKHRoZSB0YWJsZSBoYXMgb25lIGVudHJ5IHBlciBidWZmZXIgdmlldywgaS5lLiBwZXIgY2FtZXJhIGZvciBjYW1lcmFDb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcgMSkuXG4gICAgICBjb25zdCBpbmRpY2VzTmFtZSA9IGBybkluZGljZXNfJHttZW1iZXJOYW1lfWA7XG4gICAgICBjb25zdCBpbmRleFN0ciA9IGAke2luZGljZXNOYW1lfVtpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3c10gKyBpbnN0YW5jZUlkSW5CdWZmZXJWaWV3ICogJHt2ZWM0U2l6ZU9mUHJvcGVydHl9dSAqIGFycmF5TGVuZ3RoICsgJHt2ZWM0U2l6ZU9mUHJvcGVydHl9dSAqIGlkeE9mQXJyYXk7YDsgLy8gdmVjNF9pZHhcbiAgICAgIGxldCBjb252ZXJzaW9uU3RyID0gJyc7XG4gICAgICBpZiAobWVtYmVySW5mby5jb252ZXJ0VG9Cb29sKSB7XG4gICAgICAgIGNvbnZlcnNpb25TdHIgPSAnaWYgKHZhbHVlID4gMC41KSB7IHJldHVybiB0cnVlOyB9IGVsc2UgeyByZXR1cm4gZmFsc2U7IH0nO1xuICAgICAgfVxuICAgICAgc3RyICs9IGBcbiAgY29uc3QgJHtpbmRpY2VzTmFtZX06IGFycmF5PHUzMiwgJHtsb2NhdGlvbk9mZnNldHNfdmVjNF9pZHgubGVuZ3RofT4gPSBhcnJheTx1MzIsICR7bG9jYXRpb25PZmZzZXRzX3ZlYzRfaWR4Lmxlbmd0aH0+KCR7bG9jYXRpb25PZmZzZXRzX3ZlYzRfaWR4Lm1hcChvZmZzZXQgPT4gYCR7b2Zmc2V0fXVgKS5qb2luKCcsICcpfSk7XG4gIGZuIGdldF8ke21lbWJlck5hbWV9KGluc3RhbmNlSWQ6IHUzMiwgaWR4T2ZBcnJheTogdTMyKSAtPiAke21lbWJlckluZm8uY29udmVydFRvQm9vbCA/ICdib29sJyA6IHR5cGVTdHJ9IHtcbiAgICBsZXQgaW5zdGFuY2VJZE9mQnVmZmVyVmlld3MgPSBpbnN0YW5jZUlkIC8gJHtjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXd9O1xuICAgIGxldCBpbnN0YW5jZUlkSW5CdWZmZXJWaWV3ID0gaW5zdGFuY2VJZCAlICR7Y29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3fTtcbiAgICAke2FycmF5TGVuZ3RoU3RyfVxuICAgIGxldCBpbmRleDogdTMyID0gJHtpbmRleFN0cn07XG4gICAgbGV0IHZhbHVlID0gJHtmZXRjaFR5cGVTdHJ9KGluZGV4KTtcbiAgICAke21lbWJlckluZm8uY29udmVydFRvQm9vbCA/IGNvbnZlcnNpb25TdHIgOiAncmV0dXJuIHZhbHVlOyd9XG4gIH1cbiAgYDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzRm9yTm9uQXJyYXlUeXBlKFxuICAgICAgbWVtYmVySW5mbzogTWVtYmVySW5mbyxcbiAgICAgIGNvbXBvbmVudENsYXNzOiB0eXBlb2YgQ29tcG9uZW50LFxuICAgICAgbWVtYmVyTmFtZTogc3RyaW5nLFxuICAgICAgY29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3OiBudW1iZXJcbiAgICApIHtcbiAgICAgIGxldCB0eXBlU3RyID0gJyc7XG4gICAgICBsZXQgZmV0Y2hUeXBlU3RyID0gJyc7XG4gICAgICBzd2l0Y2ggKG1lbWJlckluZm8uY29tcG9zaXRpb25UeXBlKSB7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDQ6XG4gICAgICAgICAgdHlwZVN0ciA9ICdtYXQ0eDQ8ZjMyPic7XG4gICAgICAgICAgZmV0Y2hUeXBlU3RyID0gJ2ZldGNoTWF0NCc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDM6XG4gICAgICAgICAgdHlwZVN0ciA9ICdtYXQzeDM8ZjMyPic7XG4gICAgICAgICAgZmV0Y2hUeXBlU3RyID0gJ2ZldGNoTWF0M05vMTZCeXRlc0FsaWduZWQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWM0OlxuICAgICAgICAgIHR5cGVTdHIgPSAndmVjNDxmMzI+JztcbiAgICAgICAgICBmZXRjaFR5cGVTdHIgPSAnZmV0Y2hWZWM0JztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjMzpcbiAgICAgICAgICB0eXBlU3RyID0gJ3ZlYzM8ZjMyPic7XG4gICAgICAgICAgZmV0Y2hUeXBlU3RyID0gJ2ZldGNoVmVjM05vMTZCeXRlc0FsaWduZWQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5TY2FsYXI6XG4gICAgICAgICAgdHlwZVN0ciA9ICdmMzInO1xuICAgICAgICAgIGZldGNoVHlwZVN0ciA9ICdmZXRjaFNjYWxhck5vMTZCeXRlc0FsaWduZWQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgY29tcG9zaXRpb24gdHlwZTogJHttZW1iZXJJbmZvLmNvbXBvc2l0aW9uVHlwZS5zdHJ9YCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGxvY2F0aW9uT2Zmc2V0cyA9IENvbXBvbmVudC5nZXRMb2NhdGlvbk9mZnNldE9mTWVtYmVyT2ZDb21wb25lbnQoZW5naW5lLCBjb21wb25lbnRDbGFzcywgbWVtYmVyTmFtZSk7XG4gICAgICBjb25zdCBpbmRpY2VzTmFtZSA9IGBybkluZGljZXNfJHttZW1iZXJOYW1lfWA7XG4gICAgICBsZXQgaW5kZXhTdHIgPSAnJztcbiAgICAgIHN3aXRjaCAobWVtYmVySW5mby5jb21wb3NpdGlvblR5cGUpIHtcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0NDpcbiAgICAgICAgICBpbmRleFN0ciA9IGAke2luZGljZXNOYW1lfVtpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3c10gKyA0dSAqIGluc3RhbmNlSWRJbkJ1ZmZlclZpZXc7YDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0MzpcbiAgICAgICAgICBpbmRleFN0ciA9IGAke2luZGljZXNOYW1lfVtpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3c10gKiA0dSArIDl1ICogaW5zdGFuY2VJZEluQnVmZmVyVmlldztgO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWM0OlxuICAgICAgICAgIGluZGV4U3RyID0gYCR7aW5kaWNlc05hbWV9W2luc3RhbmNlSWRPZkJ1ZmZlclZpZXdzXSArIDF1ICogaW5zdGFuY2VJZEluQnVmZmVyVmlldztgO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWMzOlxuICAgICAgICAgIGluZGV4U3RyID0gYCR7aW5kaWNlc05hbWV9W2luc3RhbmNlSWRPZkJ1ZmZlclZpZXdzXSAqIDR1ICsgM3UgKiBpbnN0YW5jZUlkSW5CdWZmZXJWaWV3O2A7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlNjYWxhcjpcbiAgICAgICAgICBpbmRleFN0ciA9IGAke2luZGljZXNOYW1lfVtpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3c10gKiA0dSArIDF1ICogaW5zdGFuY2VJZEluQnVmZmVyVmlldztgO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgY29tcG9zaXRpb24gdHlwZTogJHttZW1iZXJJbmZvLmNvbXBvc2l0aW9uVHlwZS5zdHJ9YCk7XG4gICAgICB9XG4gICAgICBsZXQgY29udmVyc2lvblN0ciA9ICcnO1xuICAgICAgaWYgKG1lbWJlckluZm8uY29udmVydFRvQm9vbCkge1xuICAgICAgICBjb252ZXJzaW9uU3RyID0gJ2lmICh2YWx1ZSA+IDAuNSkgeyByZXR1cm4gdHJ1ZTsgfSBlbHNlIHsgcmV0dXJuIGZhbHNlOyB9JztcbiAgICAgIH1cbiAgICAgIC8vIE1vZHVsZS1zY29wZSBjb25zdCwgZm9yIHRoZSBzYW1lIHJlYXNvbiBhcyBpbiBwcm9jZXNzRm9yQXJyYXlUeXBlLlxuICAgICAgc3RyICs9IGBcbiAgY29uc3QgJHtpbmRpY2VzTmFtZX06IGFycmF5PHUzMiwgJHtsb2NhdGlvbk9mZnNldHMubGVuZ3RofT4gPSBhcnJheTx1MzIsICR7bG9jYXRpb25PZmZzZXRzLmxlbmd0aH0+KCR7bG9jYXRpb25PZmZzZXRzLm1hcChvZmZzZXQgPT4gYCR7b2Zmc2V0fXVgKS5qb2luKCcsICcpfSk7XG4gIGZuIGdldF8ke21lbWJlck5hbWV9KGluc3RhbmNlSWQ6IHUzMikgLT4gJHttZW1iZXJJbmZvLmNvbnZlcnRUb0Jvb2wgPyAnYm9vbCcgOiB0eXBlU3RyfSB7XG4gICAgbGV0IGluc3RhbmNlSWRPZkJ1ZmZlclZpZXdzID0gaW5zdGFuY2VJZCAvICR7Y29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3fTtcbiAgICBsZXQgaW5zdGFuY2VJZEluQnVmZmVyVmlldyA9IGluc3RhbmNlSWQgJSAke2NvbXBvbmVudENvdW50UGVyQnVmZmVyVmlld307XG4gICAgbGV0IGluZGV4OiB1MzIgPSAke2luZGV4U3RyfTtcbiAgICBsZXQgdmFsdWUgPSAke2ZldGNoVHlwZVN0cn0oaW5kZXgpO1xuICAgICR7bWVtYmVySW5mby5jb252ZXJ0VG9Cb29sID8gY29udmVyc2lvblN0ciA6ICdyZXR1cm4gdmFsdWU7J31cbiAgfVxuICBgO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0TW9ycGhlZFBvc2l0aW9uR2V0dGVyKGVuZ2luZTogRW5naW5lKTogc3RyaW5nIHtcbiAgICBjb25zdCBtb3JwaFVuaWZvcm1EYXRhVGFyZ2V0TnVtYmVycyA9IFByaW1pdGl2ZS5nZXRNb3JwaFVuaWZvcm1EYXRhVGFyZ2V0TnVtYmVycygpO1xuICAgIGNvbnN0IG1vcnBoVW5pZm9ybURhdGFUYXJnZXROdW1iZXJzU3RyID0gYFxuICAgIGNvbnN0IHJuTW9ycGhVbmlmb3JtRGF0YVRhcmdldE51bWJlcnM6IGFycmF5PHUzMiwgJHttb3JwaFVuaWZvcm1EYXRhVGFyZ2V0TnVtYmVycy5sZW5ndGh9PiA9IGFycmF5PHUzMiwgJHttb3JwaFVuaWZvcm1EYXRhVGFyZ2V0TnVtYmVycy5sZW5ndGh9Pigke21vcnBoVW5pZm9ybURhdGFUYXJnZXROdW1iZXJzLm1hcChudW0gPT4gYCR7bnVtfXVgKS5qb2luKCcsICcpfSk7XG4gICAgYDtcbiAgICBjb25zdCBtb3JwaFVuaWZvcm1EYXRhT2Zmc2V0cyA9IFByaW1pdGl2ZS5nZXRNb3JwaFVuaWZvcm1EYXRhT2Zmc2V0cygpO1xuICAgIGNvbnN0IG1vcnBoVW5pZm9ybURhdGFPZmZzZXRzU3RyID0gYFxuICAgIGNvbnN0IHJuTW9ycGhVbmlmb3JtRGF0YU9mZnNldHM6IGFycmF5PHUzMiwgJHttb3JwaFVuaWZvcm1EYXRhT2Zmc2V0cy5sZW5ndGh9PiA9IGFycmF5PHUzMiwgJHttb3JwaFVuaWZvcm1EYXRhT2Zmc2V0cy5sZW5ndGh9Pigke21vcnBoVW5pZm9ybURhdGFPZmZzZXRzLm1hcChvZmZzZXQgPT4gYCR7b2Zmc2V0fXVgKS5qb2luKCcsICcpfSk7XG4gICAgYDtcbiAgICBjb25zdCBibGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzID0gQmxlbmRTaGFwZUNvbXBvbmVudC5nZXRPZmZzZXRzSW5Vbmlmb3JtKGVuZ2luZSk7XG4gICAgY29uc3QgYmxlbmRTaGFwZVVuaWZvcm1EYXRhT2Zmc2V0c1N0ciA9IGBcbiAgICBjb25zdCBybkJsZW5kU2hhcGVVbmlmb3JtRGF0YU9mZnNldHM6IGFycmF5PHUzMiwgJHtibGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzLmxlbmd0aH0+ID0gYXJyYXk8dTMyLCAke2JsZW5kU2hhcGVVbmlmb3JtRGF0YU9mZnNldHMubGVuZ3RofT4oJHtibGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzLm1hcChvZmZzZXQgPT4gYCR7b2Zmc2V0fXVgKS5qb2luKCcsICcpfSk7XG4gICAgYDtcblxuICAgIGNvbnN0IG1vcnBoaW5nU3RyID0gYFxuXG4gICAgI2lmZGVmIFJOX0lTX1ZFUlRFWF9TSEFERVJcbiAgICAjaWZkZWYgUk5fSVNfTU9SUEhJTkdcbiAgICAke21vcnBoVW5pZm9ybURhdGFUYXJnZXROdW1iZXJzU3RyfVxuICAgICR7bW9ycGhVbmlmb3JtRGF0YU9mZnNldHNTdHJ9XG4gICAgJHtibGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzU3RyfVxuICAgIGZuIGdldF9wb3NpdGlvbih2ZXJ0ZXhJZDogdTMyLCBiYXNlUG9zaXRpb246IHZlYzM8ZjMyPiwgYmxlbmRTaGFwZUNvbXBvbmVudFNJRDogdTMyKSAtPiB2ZWMzPGYzMj4ge1xuICAgICAgbGV0IGN1cnJlbnRQcmltaXRpdmVJZHggPSB1bmlmb3JtRHJhd1BhcmFtZXRlcnMuY3VycmVudFByaW1pdGl2ZUlkeDtcbiAgICAgIGxldCBvZmZzZXRJblVuaWZvcm0gPSBybk1vcnBoVW5pZm9ybURhdGFPZmZzZXRzW2N1cnJlbnRQcmltaXRpdmVJZHhdO1xuICAgICAgbGV0IG9mZnNldEluVW5pZm9ybTIgPSBybkJsZW5kU2hhcGVVbmlmb3JtRGF0YU9mZnNldHNbYmxlbmRTaGFwZUNvbXBvbmVudFNJRF07XG4gICAgICB2YXIgcG9zaXRpb24gPSBiYXNlUG9zaXRpb247XG4gICAgICBsZXQgc2NhbGFyX2lkeCA9IDN1ICogdmVydGV4SWQ7XG4gICAgICBmb3IgKHZhciBpPTB1OyBpPHJuTW9ycGhVbmlmb3JtRGF0YVRhcmdldE51bWJlcnNbY3VycmVudFByaW1pdGl2ZUlkeF07IGkrKykge1xuICAgICAgICBsZXQgaWR4ID0gb2Zmc2V0SW5Vbmlmb3JtICsgaTtcbiAgICAgICAgbGV0IG9mZnNldHMgPSB1bmlmb3JtTW9ycGhPZmZzZXRzLmRhdGFbIGlkeCAvIDR1XTtcbiAgICAgICAgbGV0IG9mZnNldFBvc2l0aW9uID0gb2Zmc2V0c1tpZHggJSA0dV07XG5cbiAgICAgICAgbGV0IGJhc2VQb3NJbjRieXRlcyA9IG9mZnNldFBvc2l0aW9uICogNHUgKyBzY2FsYXJfaWR4O1xuICAgICAgICBsZXQgYWRkUG9zID0gZmV0Y2hWZWMzTm8xNkJ5dGVzQWxpZ25lZEZyb21CbGVuZFNoYXBlQnVmZmVyKGJhc2VQb3NJbjRieXRlcyk7XG5cbiAgICAgICAgbGV0IGlkeDIgPSBvZmZzZXRJblVuaWZvcm0yICsgaTtcbiAgICAgICAgbGV0IG1vcnBoV2VpZ2h0czogdmVjNGYgPSB1bmlmb3JtTW9ycGhXZWlnaHRzLmRhdGFbIGlkeDIgLyA0dV07XG4gICAgICAgIGxldCBtb3JwaFdlaWdodDogZjMyID0gbW9ycGhXZWlnaHRzW2lkeDIgJSA0dV07XG5cbiAgICAgICAgcG9zaXRpb24gKz0gYWRkUG9zICogbW9ycGhXZWlnaHQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwb3NpdGlvbjtcbiAgICB9XG4gICAgI2VuZGlmXG4gICNlbmRpZlxuICAgIGA7XG5cbiAgICByZXR1cm4gbW9ycGhpbmdTdHI7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIHNoYWRlciBwcm9wZXJ0eSBhY2Nlc3NvciBmdW5jdGlvbnMgZm9yIGdsb2JhbCBkYXRhLlxuICAgKiBDcmVhdGVzIFdHU0wgZnVuY3Rpb25zIHRoYXQgY2FuIGZldGNoIHByb3BlcnR5IHZhbHVlcyBmcm9tIHN0b3JhZ2UgYnVmZmVyc1xuICAgKiBiYXNlZCBvbiBzaGFkZXIgc2VtYW50aWNzIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gaW5mbyAtIFNoYWRlciBzZW1hbnRpY3MgaW5mb3JtYXRpb24gY29udGFpbmluZyB0eXBlIGFuZCBiaW5kaW5nIGRldGFpbHNcbiAgICogQHJldHVybnMgV0dTTCBzaGFkZXIgY29kZSBmb3IgdGhlIHByb3BlcnR5IGFjY2Vzc29yIGZ1bmN0aW9uXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldFNoYWRlclByb3BlcnR5T2ZHbG9iYWxEYXRhUmVwb3NpdG9yeShlbmdpbmU6IEVuZ2luZSwgaW5mbzogU2hhZGVyU2VtYW50aWNzSW5mbykge1xuICAgIGNvbnN0IHJldHVyblR5cGUgPSBpbmZvLmNvbXBvc2l0aW9uVHlwZS50b1dHU0xUeXBlKGluZm8uY29tcG9uZW50VHlwZSk7XG4gICAgY29uc3QgbWV0aG9kTmFtZSA9IGluZm8uc2VtYW50aWMucmVwbGFjZSgnLicsICdfJyk7XG4gICAgY29uc3QgaXNUZXh0dXJlID0gQ29tcG9zaXRpb25UeXBlLmlzVGV4dHVyZShpbmZvLmNvbXBvc2l0aW9uVHlwZSk7XG5cbiAgICBpZiAoaXNUZXh0dXJlKSB7XG4gICAgICBsZXQgdGV4dHVyZVR5cGUgPSAndGV4dHVyZV8yZDxmMzI+JztcbiAgICAgIGlmIChpbmZvLmNvbXBvc2l0aW9uVHlwZSA9PT0gQ29tcG9zaXRpb25UeXBlLlRleHR1cmVDdWJlKSB7XG4gICAgICAgIHRleHR1cmVUeXBlID0gJ3RleHR1cmVfY3ViZTxmMzI+JztcbiAgICAgIH0gZWxzZSBpZiAoaW5mby5jb21wb3NpdGlvblR5cGUgPT09IENvbXBvc2l0aW9uVHlwZS5UZXh0dXJlMkRBcnJheSkge1xuICAgICAgICB0ZXh0dXJlVHlwZSA9ICd0ZXh0dXJlXzJkX2FycmF5PGYzMj4nO1xuICAgICAgfVxuICAgICAgY29uc3QgeyB0ZXh0dXJlTmFtZSwgc2FtcGxlck5hbWUgfSA9IGdldFRleHR1cmVBbmRTYW1wbGVyTmFtZXMobWV0aG9kTmFtZSk7XG4gICAgICByZXR1cm4gYFxuQGdyb3VwKDEpIEBiaW5kaW5nKCR7aW5mby5pbml0aWFsVmFsdWVbMF19KSB2YXIgJHt0ZXh0dXJlTmFtZX06ICR7dGV4dHVyZVR5cGV9O1xuQGdyb3VwKDIpIEBiaW5kaW5nKCR7aW5mby5pbml0aWFsVmFsdWVbMF19KSB2YXIgJHtzYW1wbGVyTmFtZX06IHNhbXBsZXI7XG5gO1xuICAgIH1cblxuICAgIC8vIGlubmVyIGNvbnRlbnRzIG9mICdnZXRfJyBzaGFkZXIgZnVuY3Rpb25cbiAgICBjb25zdCB2ZWM0U2l6ZU9mUHJvcGVydHk6IEluZGV4T2YxNkJ5dGVzID0gaW5mby5jb21wb3NpdGlvblR5cGUuZ2V0VmVjNFNpemVPZlByb3BlcnR5KCk7XG4gICAgLy8gZm9yIG5vbi1gaW5kZXhgIHByb3BlcnR5ICh0aGlzIGlzIGdlbmVyYWwgY2FzZSlcbiAgICBjb25zdCBzY2FsYXJTaXplT2ZQcm9wZXJ0eTogSW5kZXhPZjRCeXRlcyA9IGluZm8uY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpO1xuICAgIGNvbnN0IG9mZnNldE9mUHJvcGVydHk6IEluZGV4T2YxNkJ5dGVzID0gV2ViR3B1U3RyYXRlZ3lCYXNpYy5nZXRPZmZzZXRPZlByb3BlcnR5T2ZHbG9iYWxEYXRhUmVwb3NpdG9yeShcbiAgICAgIGVuZ2luZSxcbiAgICAgIGluZm8uc2VtYW50aWNcbiAgICApO1xuXG4gICAgaWYgKG9mZnNldE9mUHJvcGVydHkgPT09IC0xKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignQ291bGQgbm90IGdldCB0aGUgbG9jYXRpb24gb2Zmc2V0IG9mIHRoZSBwcm9wZXJ0eS4nKTtcbiAgICB9XG5cbiAgICBsZXQgaW5kZXhTdHI6IHN0cmluZztcbiAgICBsZXQgaW5zdGFuY2VTaXplID0gdmVjNFNpemVPZlByb3BlcnR5O1xuICAgIGluZGV4U3RyID0gYCAgbGV0IHZlYzRfaWR4OiB1MzIgPSAke29mZnNldE9mUHJvcGVydHl9dSArICR7aW5zdGFuY2VTaXplfXUgKiBpbnN0YW5jZUlkO1xcbmA7XG4gICAgaWYgKENvbXBvc2l0aW9uVHlwZS5pc0FycmF5KGluZm8uY29tcG9zaXRpb25UeXBlKSkge1xuICAgICAgaW5zdGFuY2VTaXplID0gdmVjNFNpemVPZlByb3BlcnR5ICogKGluZm8uYXJyYXlMZW5ndGggPz8gMSk7XG4gICAgICBjb25zdCBwYWRkZWRBc1ZlYzQgPSBNYXRoLmNlaWwoc2NhbGFyU2l6ZU9mUHJvcGVydHkgLyA0KSAqIDQ7XG4gICAgICBjb25zdCBpbnN0YW5jZVNpemVJblNjYWxhciA9IHBhZGRlZEFzVmVjNCAqIChpbmZvLmFycmF5TGVuZ3RoID8/IDEpO1xuICAgICAgaW5kZXhTdHIgPSBgICBsZXQgdmVjNF9pZHg6IHUzMiA9ICR7b2Zmc2V0T2ZQcm9wZXJ0eX11ICsgJHtpbnN0YW5jZVNpemV9ICogaW5zdGFuY2VJZCArICR7dmVjNFNpemVPZlByb3BlcnR5fXUgKiBpZHhPZkFycmF5O1xcbmA7XG4gICAgICBpbmRleFN0ciArPSBgICBsZXQgc2NhbGFyX2lkeDogdTMyID0gJHtcbiAgICAgICAgLy8gSW5kZXhPZjRCeXRlc1xuICAgICAgICBvZmZzZXRPZlByb3BlcnR5ICogNCAvLyBJbmRleE9mMTZieXRlcyB0byBJbmRleE9mNEJ5dGVzXG4gICAgICB9ICsgJHtpbnN0YW5jZVNpemVJblNjYWxhcn0gKiBpbnN0YW5jZUlkICsgJHtzY2FsYXJTaXplT2ZQcm9wZXJ0eX11ICogaWR4T2ZBcnJheTtcXG5gO1xuICAgIH1cblxuICAgIGNvbnN0IGZpcnN0UGFydE9mSW5uZXJGdW5jID0gYFxuZm4gZ2V0XyR7bWV0aG9kTmFtZX0oaW5zdGFuY2VJZDogdTMyLCBpZHhPZkFycmF5OiB1MzIpIC0+ICR7cmV0dXJuVHlwZX0ge1xuJHtpbmRleFN0cn1cbmA7XG5cbiAgICBsZXQgc3RyID0gYCR7Zmlyc3RQYXJ0T2ZJbm5lckZ1bmN9YDtcblxuICAgIHN3aXRjaCAoaW5mby5jb21wb3NpdGlvblR5cGUpIHtcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzQ6XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWM0QXJyYXk6XG4gICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gZmV0Y2hFbGVtZW50KHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzM6XG4gICAgICAgIHN0ciArPSAnICBsZXQgY29sMCA9IGZldGNoRWxlbWVudCh2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgc3RyICs9IGAgIGxldCB2YWwgPSAke3JldHVyblR5cGV9KGNvbDAueHl6KTtgO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzNBcnJheTpcbiAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBmZXRjaFZlYzNObzE2Qnl0ZXNBbGlnbmVkKHNjYWxhcl9pZHgpO1xcbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjMjpcbiAgICAgICAgc3RyICs9ICcgIGxldCBjb2wwID0gZmV0Y2hFbGVtZW50KHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBzdHIgKz0gYCAgbGV0IHZhbCA9ICR7cmV0dXJuVHlwZX0oY29sMC54eSk7YDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWMyQXJyYXk6XG4gICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gZmV0Y2hWZWMyTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlNjYWxhcjpcbiAgICAgICAgc3RyICs9ICcgIGxldCBjb2wwID0gZmV0Y2hFbGVtZW50KHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkludCkge1xuICAgICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gaTMyKGNvbDAueCk7JztcbiAgICAgICAgfSBlbHNlIGlmIChpbmZvLmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuVW5zaWduZWRJbnQpIHtcbiAgICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IHUzMihjb2wwLngpOyc7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkJvb2wpIHtcbiAgICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGNvbDAueCA+PSAwLjU7JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGNvbDAueDsnO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuU2NhbGFyQXJyYXk6XG4gICAgICAgIHN0ciArPSAnICBsZXQgY29sMCA9IGZldGNoU2NhbGFyTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkludCkge1xuICAgICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gaTMyKGNvbDApOyc7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLlVuc2lnbmVkSW50KSB7XG4gICAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSB1MzIoY29sMCk7JztcbiAgICAgICAgfSBlbHNlIGlmIChpbmZvLmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuQm9vbCkge1xuICAgICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gY29sMCA+PSAwLjU7JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGNvbDA7JztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDQ6XG4gICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gZmV0Y2hNYXQ0KHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDRBcnJheTpcbiAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBmZXRjaE1hdDQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0MzpcbiAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBmZXRjaE1hdDModmVjNF9pZHgpO1xcbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0M0FycmF5OlxuICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGZldGNoTWF0M05vMTZCeXRlc0FsaWduZWQoc2NhbGFyX2lkeCk7XFxuJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQyOlxuICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGZldGNoTWF0Mih2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQyQXJyYXk6XG4gICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gZmV0Y2hNYXQyTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDR4M0FycmF5OlxuICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGZldGNoTWF0NHgzKHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIC8vIExvZ2dlci5kZWZhdWx0LmVycm9yKCd1bmtub3duIGNvbXBvc2l0aW9uIHR5cGUnLCBpbmZvLmNvbXBvc2l0aW9uVHlwZS5zdHIsIG1lbWJlck5hbWUpO1xuICAgICAgICBzdHIgKz0gJyc7XG4gICAgfVxuICAgIHN0ciArPSBgXG4gIHJldHVybiB2YWw7XG59XG5gO1xuICAgIHJldHVybiBzdHI7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIHNoYWRlciBwcm9wZXJ0eSBhY2Nlc3NvciBmdW5jdGlvbnMgZm9yIG1hdGVyaWFscy5cbiAgICogQ3JlYXRlcyBXR1NMIGZ1bmN0aW9ucyB0aGF0IGNhbiBmZXRjaCBwcm9wZXJ0eSB2YWx1ZXMgZnJvbSBzdG9yYWdlIGJ1ZmZlcnNcbiAgICogYmFzZWQgb24gc2hhZGVyIHNlbWFudGljcyBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIG1hdGVyaWFsVHlwZU5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgbWF0ZXJpYWwgdHlwZVxuICAgKiBAcGFyYW0gaW5mbyAtIFNoYWRlciBzZW1hbnRpY3MgaW5mb3JtYXRpb24gY29udGFpbmluZyB0eXBlIGFuZCBiaW5kaW5nIGRldGFpbHNcbiAgICogQHJldHVybnMgV0dTTCBzaGFkZXIgY29kZSBmb3IgdGhlIHByb3BlcnR5IGFjY2Vzc29yIGZ1bmN0aW9uXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldFNoYWRlclByb3BlcnR5T2ZNYXRlcmlhbChlbmdpbmU6IEVuZ2luZSwgbWF0ZXJpYWxUeXBlTmFtZTogc3RyaW5nLCBpbmZvOiBTaGFkZXJTZW1hbnRpY3NJbmZvKSB7XG4gICAgY29uc3QgcmV0dXJuVHlwZSA9IGluZm8uY29tcG9zaXRpb25UeXBlLnRvV0dTTFR5cGUoaW5mby5jb21wb25lbnRUeXBlKTtcbiAgICBjb25zdCBtZXRob2ROYW1lID0gaW5mby5zZW1hbnRpYy5yZXBsYWNlKCcuJywgJ18nKTtcbiAgICBjb25zdCBpc1RleHR1cmUgPSBDb21wb3NpdGlvblR5cGUuaXNUZXh0dXJlKGluZm8uY29tcG9zaXRpb25UeXBlKTtcblxuICAgIGlmIChpc1RleHR1cmUpIHtcbiAgICAgIGxldCB0ZXh0dXJlVHlwZSA9ICd0ZXh0dXJlXzJkPGYzMj4nO1xuICAgICAgaWYgKGluZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVGV4dHVyZUN1YmUpIHtcbiAgICAgICAgdGV4dHVyZVR5cGUgPSAndGV4dHVyZV9jdWJlPGYzMj4nO1xuICAgICAgfSBlbHNlIGlmIChpbmZvLmNvbXBvc2l0aW9uVHlwZSA9PT0gQ29tcG9zaXRpb25UeXBlLlRleHR1cmUyREFycmF5KSB7XG4gICAgICAgIHRleHR1cmVUeXBlID0gJ3RleHR1cmVfMmRfYXJyYXk8ZjMyPic7XG4gICAgICB9XG4gICAgICBjb25zdCB7IHRleHR1cmVOYW1lLCBzYW1wbGVyTmFtZSB9ID0gZ2V0VGV4dHVyZUFuZFNhbXBsZXJOYW1lcyhtZXRob2ROYW1lKTtcbiAgICAgIHJldHVybiBgXG5AZ3JvdXAoMSkgQGJpbmRpbmcoJHtpbmZvLmluaXRpYWxWYWx1ZVswXX0pIHZhciAke3RleHR1cmVOYW1lfTogJHt0ZXh0dXJlVHlwZX07XG5AZ3JvdXAoMikgQGJpbmRpbmcoJHtpbmZvLmluaXRpYWxWYWx1ZVswXX0pIHZhciAke3NhbXBsZXJOYW1lfTogc2FtcGxlcjtcbmA7XG4gICAgfVxuXG4gICAgLy8gaW5uZXIgY29udGVudHMgb2YgJ2dldF8nIHNoYWRlciBmdW5jdGlvblxuICAgIGNvbnN0IHZlYzRTaXplT2ZQcm9wZXJ0eTogSW5kZXhPZjE2Qnl0ZXMgPSBpbmZvLmNvbXBvc2l0aW9uVHlwZS5nZXRWZWM0U2l6ZU9mUHJvcGVydHkoKTtcbiAgICAvLyBmb3Igbm9uLWBpbmRleGAgcHJvcGVydHkgKHRoaXMgaXMgZ2VuZXJhbCBjYXNlKVxuICAgIGNvbnN0IHNjYWxhclNpemVPZlByb3BlcnR5OiBJbmRleE9mNEJ5dGVzID0gaW5mby5jb21wb3NpdGlvblR5cGUuZ2V0TnVtYmVyT2ZDb21wb25lbnRzKCk7XG4gICAgY29uc3Qgb2Zmc2V0T2ZQcm9wZXJ0eTogSW5kZXhPZjE2Qnl0ZXNbXSA9IFdlYkdwdVN0cmF0ZWd5QmFzaWMuZ2V0T2Zmc2V0T2ZQcm9wZXJ0eU9mTWF0ZXJpYWwoXG4gICAgICBlbmdpbmUsXG4gICAgICBpbmZvLnNlbWFudGljLFxuICAgICAgbWF0ZXJpYWxUeXBlTmFtZVxuICAgICk7XG4gICAgY29uc3QgbWF0ZXJpYWxDb3VudFBlckJ1ZmZlclZpZXcgPSBlbmdpbmUubWF0ZXJpYWxSZXBvc2l0b3J5Ll9nZXRNYXRlcmlhbENvdW50UGVyQnVmZmVyVmlldyhtYXRlcmlhbFR5cGVOYW1lKSE7XG5cbiAgICAvLyBNb2R1bGUtc2NvcGUgY29uc3Q6IGEgdmFyPGZ1bmN0aW9uPiBhcnJheSBpcyBpbml0aWFsaXplZCBvbiBldmVyeSBjYWxsLCB3aGljaCBpcyBleHBlbnNpdmUgd2hlbiB0aGUgbWF0ZXJpYWxcbiAgICAvLyB0eXBlIHNwYW5zIG1hbnkgYnVmZmVyIHZpZXdzLlxuICAgIGNvbnN0IG9mZnNldHNOYW1lID0gYHJuT2Zmc2V0c18ke21ldGhvZE5hbWV9YDtcbiAgICBjb25zdCBvZmZzZXRzU3RyID0gYGNvbnN0ICR7b2Zmc2V0c05hbWV9OiBhcnJheTx1MzIsICR7b2Zmc2V0T2ZQcm9wZXJ0eS5sZW5ndGh9PiA9IGFycmF5PHUzMiwgJHtvZmZzZXRPZlByb3BlcnR5Lmxlbmd0aH0+KCR7b2Zmc2V0T2ZQcm9wZXJ0eS5tYXAob2Zmc2V0ID0+IGAke29mZnNldH11YCkuam9pbignLCAnKX0pO2A7XG5cbiAgICBsZXQgaW5kZXhTdHI6IHN0cmluZztcbiAgICBsZXQgaW5zdGFuY2VTaXplID0gdmVjNFNpemVPZlByb3BlcnR5O1xuICAgIGluZGV4U3RyID0gYCAgbGV0IHZlYzRfaWR4OiB1MzIgPSAke29mZnNldHNOYW1lfVtpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3c10gKyAke2luc3RhbmNlU2l6ZX11ICogaW5zdGFuY2VJZEluQnVmZmVyVmlldztcXG5gO1xuICAgIGlmIChDb21wb3NpdGlvblR5cGUuaXNBcnJheShpbmZvLmNvbXBvc2l0aW9uVHlwZSkpIHtcbiAgICAgIGluc3RhbmNlU2l6ZSA9IHZlYzRTaXplT2ZQcm9wZXJ0eSAqIChpbmZvLmFycmF5TGVuZ3RoID8/IDEpO1xuICAgICAgY29uc3QgcGFkZGVkQXNWZWM0ID0gTWF0aC5jZWlsKHNjYWxhclNpemVPZlByb3BlcnR5IC8gNCkgKiA0O1xuICAgICAgY29uc3QgaW5zdGFuY2VTaXplSW5TY2FsYXIgPSBwYWRkZWRBc1ZlYzQgKiAoaW5mby5hcnJheUxlbmd0aCA/PyAxKTtcbiAgICAgIGluZGV4U3RyID0gYCAgbGV0IHZlYzRfaWR4OiB1MzIgPSAke29mZnNldHNOYW1lfVtpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3c10gKyAke2luc3RhbmNlU2l6ZX0gKiBpbnN0YW5jZUlkSW5CdWZmZXJWaWV3ICsgJHt2ZWM0U2l6ZU9mUHJvcGVydHl9dSAqIGlkeE9mQXJyYXk7XFxuYDtcbiAgICAgIGluZGV4U3RyICs9IGAgIGxldCBzY2FsYXJfaWR4OiB1MzIgPSAke29mZnNldHNOYW1lfVtpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3c10gKiA0ICsgJHtpbnN0YW5jZVNpemVJblNjYWxhcn0gKiBpbnN0YW5jZUlkSW5CdWZmZXJWaWV3ICsgJHtzY2FsYXJTaXplT2ZQcm9wZXJ0eX11ICogaWR4T2ZBcnJheTtcXG5gO1xuICAgIH1cblxuICAgIGNvbnN0IGZpcnN0UGFydE9mSW5uZXJGdW5jID0gYFxuJHtvZmZzZXRzU3RyfVxuZm4gZ2V0XyR7bWV0aG9kTmFtZX0oaW5zdGFuY2VJZDogdTMyLCBpZHhPZkFycmF5OiB1MzIpIC0+ICR7cmV0dXJuVHlwZX0ge1xuICBsZXQgaW5zdGFuY2VJZE9mQnVmZmVyVmlld3MgPSBpbnN0YW5jZUlkIC8gJHttYXRlcmlhbENvdW50UGVyQnVmZmVyVmlld307XG4gIGxldCBpbnN0YW5jZUlkSW5CdWZmZXJWaWV3ID0gaW5zdGFuY2VJZCAlICR7bWF0ZXJpYWxDb3VudFBlckJ1ZmZlclZpZXd9O1xuJHtpbmRleFN0cn1cbmA7XG5cbiAgICBsZXQgc3RyID0gYCR7Zmlyc3RQYXJ0T2ZJbm5lckZ1bmN9YDtcblxuICAgIHN3aXRjaCAoaW5mby5jb21wb3NpdGlvblR5cGUpIHtcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzQ6XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWM0QXJyYXk6XG4gICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gZmV0Y2hFbGVtZW50KHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzM6XG4gICAgICAgIHN0ciArPSAnICBsZXQgY29sMCA9IGZldGNoRWxlbWVudCh2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgc3RyICs9IGAgIGxldCB2YWwgPSAke3JldHVyblR5cGV9KGNvbDAueHl6KTtgO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzNBcnJheTpcbiAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBmZXRjaFZlYzNObzE2Qnl0ZXNBbGlnbmVkKHNjYWxhcl9pZHgpO1xcbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjMjpcbiAgICAgICAgc3RyICs9ICcgIGxldCBjb2wwID0gZmV0Y2hFbGVtZW50KHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBzdHIgKz0gYCAgbGV0IHZhbCA9ICR7cmV0dXJuVHlwZX0oY29sMC54eSk7YDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWMyQXJyYXk6XG4gICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gZmV0Y2hWZWMyTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlNjYWxhcjpcbiAgICAgICAgc3RyICs9ICcgIGxldCBjb2wwID0gZmV0Y2hFbGVtZW50KHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkludCkge1xuICAgICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gaTMyKGNvbDAueCk7JztcbiAgICAgICAgfSBlbHNlIGlmIChpbmZvLmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuVW5zaWduZWRJbnQpIHtcbiAgICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IHUzMihjb2wwLngpOyc7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkJvb2wpIHtcbiAgICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGNvbDAueCA+PSAwLjU7JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGNvbDAueDsnO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuU2NhbGFyQXJyYXk6XG4gICAgICAgIHN0ciArPSAnICBsZXQgY29sMCA9IGZldGNoU2NhbGFyTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkludCkge1xuICAgICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gaTMyKGNvbDApOyc7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLlVuc2lnbmVkSW50KSB7XG4gICAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSB1MzIoY29sMCk7JztcbiAgICAgICAgfSBlbHNlIGlmIChpbmZvLmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuQm9vbCkge1xuICAgICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gY29sMCA+PSAwLjU7JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGNvbDA7JztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDQ6XG4gICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gZmV0Y2hNYXQ0KHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDRBcnJheTpcbiAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBmZXRjaE1hdDQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0MzpcbiAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBmZXRjaE1hdDModmVjNF9pZHgpO1xcbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0M0FycmF5OlxuICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGZldGNoTWF0M05vMTZCeXRlc0FsaWduZWQoc2NhbGFyX2lkeCk7XFxuJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQyOlxuICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGZldGNoTWF0Mih2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQyQXJyYXk6XG4gICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gZmV0Y2hNYXQyTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDR4M0FycmF5OlxuICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGZldGNoTWF0NHgzKHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIC8vIExvZ2dlci5kZWZhdWx0LmVycm9yKCd1bmtub3duIGNvbXBvc2l0aW9uIHR5cGUnLCBpbmZvLmNvbXBvc2l0aW9uVHlwZS5zdHIsIG1lbWJlck5hbWUpO1xuICAgICAgICBzdHIgKz0gJyc7XG4gICAgfVxuICAgIHN0ciArPSBgXG4gIHJldHVybiB2YWw7XG59XG5gO1xuICAgIHJldHVybiBzdHI7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyB0aGUgbWVtb3J5IG9mZnNldCBvZiBhIHNoYWRlciBwcm9wZXJ0eSB3aXRoaW4gc3RvcmFnZSBidWZmZXJzLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gaXNHbG9iYWxEYXRhIC0gV2hldGhlciB0byBsb29rIGluIGdsb2JhbCBkYXRhIHJlcG9zaXRvcnkgb3IgbWF0ZXJpYWwgcmVwb3NpdG9yeVxuICAgKiBAcGFyYW0gcHJvcGVydHlOYW1lIC0gVGhlIHNlbWFudGljIG5hbWUgb2YgdGhlIHByb3BlcnR5XG4gICAqIEBwYXJhbSBtYXRlcmlhbFR5cGVOYW1lIC0gVGhlIG1hdGVyaWFsIHR5cGUgbmFtZSBmb3IgbWF0ZXJpYWwtc3BlY2lmaWMgcHJvcGVydGllc1xuICAgKiBAcmV0dXJucyBUaGUgYnl0ZSBvZmZzZXQgb2YgdGhlIHByb3BlcnR5IGluIHRoZSBzdG9yYWdlIGJ1ZmZlciwgb3IgLTEgaWYgbm90IGZvdW5kXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBnZXRPZmZzZXRPZlByb3BlcnR5T2ZNYXRlcmlhbChcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBwcm9wZXJ0eU5hbWU6IFNoYWRlclNlbWFudGljc05hbWUsXG4gICAgbWF0ZXJpYWxUeXBlTmFtZTogc3RyaW5nXG4gICkge1xuICAgIGNvbnN0IGRhdGFCZWdpblBvcyA9IGVuZ2luZS5tYXRlcmlhbFJlcG9zaXRvcnkuZ2V0TG9jYXRpb25PZmZzZXRPZk1lbWJlck9mTWF0ZXJpYWwoXG4gICAgICBlbmdpbmUsXG4gICAgICBtYXRlcmlhbFR5cGVOYW1lLFxuICAgICAgcHJvcGVydHlOYW1lXG4gICAgKTtcbiAgICByZXR1cm4gZGF0YUJlZ2luUG9zO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgZ2V0T2Zmc2V0T2ZQcm9wZXJ0eU9mR2xvYmFsRGF0YVJlcG9zaXRvcnkoZW5naW5lOiBFbmdpbmUsIHByb3BlcnR5TmFtZTogU2hhZGVyU2VtYW50aWNzTmFtZSkge1xuICAgIGNvbnN0IGdsb2JhbERhdGFSZXBvc2l0b3J5ID0gZW5naW5lLmdsb2JhbERhdGFSZXBvc2l0b3J5O1xuICAgIGNvbnN0IGRhdGFCZWdpblBvcyA9IGdsb2JhbERhdGFSZXBvc2l0b3J5LmdldExvY2F0aW9uT2Zmc2V0T2ZQcm9wZXJ0eShwcm9wZXJ0eU5hbWUpO1xuICAgIHJldHVybiBkYXRhQmVnaW5Qb3M7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYW5kIHByZXBhcmVzIGEgbWVzaCBjb21wb25lbnQgZm9yIHJlbmRlcmluZy5cbiAgICogU2V0cyB1cCB2ZXJ0ZXggYnVmZmVyIG9iamVjdHMgKFZCTykgYW5kIHZlcnRleCBhcnJheSBvYmplY3RzIChWQU8pIGlmIG5vdCBhbHJlYWR5IGRvbmUuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNoQ29tcG9uZW50IC0gVGhlIG1lc2ggY29tcG9uZW50IHRvIGxvYWRcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgbWVzaCB3YXMgc3VjY2Vzc2Z1bGx5IGxvYWRlZCwgZmFsc2UgaWYgdGhlIG1lc2ggaXMgbnVsbFxuICAgKi9cbiAgJGxvYWQobWVzaENvbXBvbmVudDogTWVzaENvbXBvbmVudCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IG1lc2ggPSBtZXNoQ29tcG9uZW50Lm1lc2g7XG4gICAgaWYgKG1lc2ggPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIHNldHVwIFZCTyBhbmQgVkFPXG4gICAgaWYgKCFtZXNoLmlzU2V0VXBEb25lKCkpIHtcbiAgICAgIG1lc2guX3VwZGF0ZVZCT0FuZFZBTygpO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIGNvbW1vbiBsb2FkaW5nIG9wZXJhdGlvbnMgcmVxdWlyZWQgZm9yIHRoZSBXZWJHUFUgc3RyYXRlZ3kuXG4gICAqIEluaXRpYWxpemVzIG1vcnBoIHRhcmdldCBhcnJheXMgYW5kIHVwZGF0ZXMgYmxlbmQgc2hhcGUgc3RvcmFnZSBidWZmZXJzIHdoZW4gbmVlZGVkLlxuICAgKi9cbiAgY29tbW9uXyRsb2FkKCk6IHZvaWQge1xuICAgIHRoaXMuX19pbml0TW9ycGhVbmlmb3JtQnVmZmVycygpO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2luaXRNb3JwaFVuaWZvcm1CdWZmZXJzKCkge1xuICAgIGNvbnN0IG1vcnBoVW5pZm9ybURhdGFPZmZzZXRzID0gUHJpbWl0aXZlLmdldE1vcnBoVW5pZm9ybURhdGFPZmZzZXRzKCk7XG4gICAgY29uc3QgbW9ycGhPZmZzZXRzVW5pZm9ybURhdGFTaXplID0gTWF0aC5tYXgoXG4gICAgICBNYXRoLmNlaWwobW9ycGhVbmlmb3JtRGF0YU9mZnNldHNbbW9ycGhVbmlmb3JtRGF0YU9mZnNldHMubGVuZ3RoIC0gMV0gLyA0KSAqIDQgKiA0LFxuICAgICAgNFxuICAgICk7XG5cbiAgICBpZiAobW9ycGhPZmZzZXRzVW5pZm9ybURhdGFTaXplICE9PSB0aGlzLl9fbGFzdE1vcnBoT2Zmc2V0c1VuaWZvcm1EYXRhU2l6ZSkge1xuICAgICAgY29uc3Qgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy5fX2VuZ2luZS53ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgICAvLyBkZWxldGUgdGhlIG9sZCBtb3JwaCBvZmZzZXRzIHVuaWZvcm0gYnVmZmVyXG4gICAgICBpZiAodGhpcy5fX21vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJVaWQgIT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkKSB7XG4gICAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5mbHVzaCgpO1xuICAgICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuY2xlYXJDYWNoZSgpO1xuICAgICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuZGVsZXRlVW5pZm9ybUJ1ZmZlcih0aGlzLl9fbW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlclVpZCk7XG4gICAgICAgIHRoaXMuX19tb3JwaE9mZnNldHNVbmlmb3JtQnVmZmVyVWlkID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gICAgICB9XG4gICAgICAvLyBjcmVhdGUgdGhlIG5ldyBtb3JwaCBvZmZzZXRzIHVuaWZvcm0gYnVmZmVyXG4gICAgICB0aGlzLl9fbGFzdE1vcnBoT2Zmc2V0c1VuaWZvcm1EYXRhU2l6ZSA9IG1vcnBoT2Zmc2V0c1VuaWZvcm1EYXRhU2l6ZTtcbiAgICAgIGlmICh0aGlzLl9fbW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlclVpZCA9PT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQpIHtcbiAgICAgICAgY29uc3QgaW5wdXRBcnJheU9mZnNldHMgPSBuZXcgVWludDMyQXJyYXkobW9ycGhPZmZzZXRzVW5pZm9ybURhdGFTaXplKTtcbiAgICAgICAgdGhpcy5fX3VuaWZvcm1Nb3JwaE9mZnNldHNUeXBlZEFycmF5ID0gaW5wdXRBcnJheU9mZnNldHM7XG4gICAgICAgIHRoaXMuX19tb3JwaE9mZnNldHNVbmlmb3JtQnVmZmVyVWlkID0gd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmNyZWF0ZVVuaWZvcm1Nb3JwaE9mZnNldHNCdWZmZXIoXG4gICAgICAgICAgbW9ycGhPZmZzZXRzVW5pZm9ybURhdGFTaXplICogNFxuICAgICAgICApO1xuICAgICAgICB0aGlzLl9fdXBkYXRlTW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlcigpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9fbGFzdE1vcnBoT2Zmc2V0c1VuaWZvcm1EYXRhU2l6ZSA9IG1vcnBoT2Zmc2V0c1VuaWZvcm1EYXRhU2l6ZTtcbiAgICB9XG5cbiAgICBjb25zdCBibGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzID0gQmxlbmRTaGFwZUNvbXBvbmVudC5nZXRPZmZzZXRzSW5Vbmlmb3JtKHRoaXMuX19lbmdpbmUpO1xuICAgIGNvbnN0IGJsZW5kU2hhcGVXZWlnaHRzVW5pZm9ybURhdGFTaXplID0gTWF0aC5tYXgoXG4gICAgICBNYXRoLmNlaWwoYmxlbmRTaGFwZVVuaWZvcm1EYXRhT2Zmc2V0c1tibGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzLmxlbmd0aCAtIDFdIC8gNCkgKiA0ICogNCxcbiAgICAgIDRcbiAgICApO1xuXG4gICAgaWYgKGJsZW5kU2hhcGVXZWlnaHRzVW5pZm9ybURhdGFTaXplICE9PSB0aGlzLl9fbGFzdE1vcnBoV2VpZ2h0c1VuaWZvcm1EYXRhU2l6ZSkge1xuICAgICAgY29uc3Qgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy5fX2VuZ2luZS53ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgICAvLyBkZWxldGUgdGhlIG9sZCBtb3JwaCB3ZWlnaHRzIHVuaWZvcm0gYnVmZmVyXG4gICAgICBpZiAodGhpcy5fX21vcnBoV2VpZ2h0c1VuaWZvcm1CdWZmZXJVaWQgIT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkKSB7XG4gICAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5mbHVzaCgpO1xuICAgICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuY2xlYXJDYWNoZSgpO1xuICAgICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuZGVsZXRlVW5pZm9ybUJ1ZmZlcih0aGlzLl9fbW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlclVpZCk7XG4gICAgICAgIHRoaXMuX19tb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyVWlkID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gICAgICB9XG5cbiAgICAgIC8vIGNyZWF0ZSB0aGUgbmV3IG1vcnBoIHdlaWdodHMgdW5pZm9ybSBidWZmZXJcbiAgICAgIGlmICh0aGlzLl9fbW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlclVpZCA9PT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQpIHtcbiAgICAgICAgY29uc3QgaW5wdXRBcnJheVdlaWdodHMgPSBuZXcgRmxvYXQzMkFycmF5KGJsZW5kU2hhcGVXZWlnaHRzVW5pZm9ybURhdGFTaXplKTtcbiAgICAgICAgdGhpcy5fX3VuaWZvcm1Nb3JwaFdlaWdodHNUeXBlZEFycmF5ID0gaW5wdXRBcnJheVdlaWdodHM7XG4gICAgICAgIHRoaXMuX19tb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyVWlkID0gd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmNyZWF0ZVVuaWZvcm1Nb3JwaFdlaWdodHNCdWZmZXIoXG4gICAgICAgICAgYmxlbmRTaGFwZVdlaWdodHNVbmlmb3JtRGF0YVNpemUgKiA0XG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuX191cGRhdGVNb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyKCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX19sYXN0TW9ycGhXZWlnaHRzVW5pZm9ybURhdGFTaXplID0gYmxlbmRTaGFwZVdlaWdodHNVbmlmb3JtRGF0YVNpemU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgc2hhZGVyIHByb2dyYW1zIGZvciBhbGwgcHJpbWl0aXZlcyBpbiB0aGUgZ2l2ZW4gbWVzaCBjb21wb25lbnQuXG4gICAqIEl0ZXJhdGVzIHRocm91Z2ggYWxsIHByaW1pdGl2ZXMgYW5kIGVuc3VyZXMgdGhlaXIgbWF0ZXJpYWxzIGhhdmUgcHJvcGVyIHNoYWRlciBwcm9ncmFtcy5cbiAgICpcbiAgICogQHBhcmFtIG1lc2hDb21wb25lbnQgLSBUaGUgbWVzaCBjb21wb25lbnQgY29udGFpbmluZyBwcmltaXRpdmVzIHRvIHNldHVwXG4gICAqL1xuICBwcml2YXRlIF9fc2V0dXBTaGFkZXJQcm9ncmFtRm9yTWVzaENvbXBvbmVudChtZXNoQ29tcG9uZW50OiBNZXNoQ29tcG9uZW50KSB7XG4gICAgaWYgKG1lc2hDb21wb25lbnQubWVzaCA9PSBudWxsKSB7XG4gICAgICBNZXNoQ29tcG9uZW50LmFsZXJ0Tm9NZXNoU2V0KG1lc2hDb21wb25lbnQpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHByaW1pdGl2ZU51bSA9IG1lc2hDb21wb25lbnQubWVzaC5nZXRQcmltaXRpdmVOdW1iZXIoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByaW1pdGl2ZU51bTsgaSsrKSB7XG4gICAgICBjb25zdCBwcmltaXRpdmUgPSBtZXNoQ29tcG9uZW50Lm1lc2guZ2V0UHJpbWl0aXZlQXQoaSk7XG4gICAgICBjb25zdCBtYXRlcmlhbCA9IHByaW1pdGl2ZS5tYXRlcmlhbDtcbiAgICAgIHRoaXMuX3NldHVwU2hhZGVyUHJvZ3JhbShtYXRlcmlhbCwgcHJpbWl0aXZlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCBhIHNoYWRlciBwcm9ncmFtIGZvciBhIHNwZWNpZmljIG1hdGVyaWFsIGFuZCBwcmltaXRpdmUgY29tYmluYXRpb24uXG4gICAqIEhhbmRsZXMgc2hhZGVyIGNvbXBpbGF0aW9uIGVycm9ycyBieSBmYWxsaW5nIGJhY2sgdG8gYmFja3VwIG1hdGVyaWFscyB3aGVuIG5lY2Vzc2FyeS5cbiAgICpcbiAgICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIHRvIHNldHVwIHRoZSBzaGFkZXIgZm9yXG4gICAqIEBwYXJhbSBwcmltaXRpdmUgLSBUaGUgcHJpbWl0aXZlIHRoYXQgd2lsbCB1c2UgdGhpcyBtYXRlcmlhbFxuICAgKi9cbiAgcHJpdmF0ZSBfc2V0dXBTaGFkZXJQcm9ncmFtKG1hdGVyaWFsOiBNYXRlcmlhbCwgcHJpbWl0aXZlOiBQcmltaXRpdmUpIHtcbiAgICBpZiAobWF0ZXJpYWwgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChtYXRlcmlhbC5pc1NoYWRlclByb2dyYW1SZWFkeShwcmltaXRpdmUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuc2V0dXBTaGFkZXJGb3JNYXRlcmlhbChcbiAgICAgICAgbWF0ZXJpYWwsXG4gICAgICAgIHByaW1pdGl2ZSxcbiAgICAgICAgV2ViR3B1U3RyYXRlZ3lCYXNpYy5nZXRWZXJ0ZXhTaGFkZXJNZXRob2REZWZpbml0aW9uc19zdG9yYWdlQnVmZmVyKHRoaXMuX19lbmdpbmUsIFNoYWRlclR5cGUuVmVydGV4U2hhZGVyKSxcbiAgICAgICAgV2ViR3B1U3RyYXRlZ3lCYXNpYy5nZXRWZXJ0ZXhTaGFkZXJNZXRob2REZWZpbml0aW9uc19zdG9yYWdlQnVmZmVyKHRoaXMuX19lbmdpbmUsIFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIpLFxuICAgICAgICBXZWJHcHVTdHJhdGVneUJhc2ljLl9fZ2V0U2hhZGVyUHJvcGVydHlPZkdsb2JhbERhdGFSZXBvc2l0b3J5LFxuICAgICAgICBXZWJHcHVTdHJhdGVneUJhc2ljLl9fZ2V0U2hhZGVyUHJvcGVydHlPZk1hdGVyaWFsLFxuICAgICAgICBXZWJHcHVTdHJhdGVneUJhc2ljLl9fZ2V0TW9ycGhlZFBvc2l0aW9uR2V0dGVyKHRoaXMuX19lbmdpbmUpXG4gICAgICApO1xuICAgICAgcHJpbWl0aXZlLl9iYWNrdXBNYXRlcmlhbCgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKGUgYXMgc3RyaW5nKTtcbiAgICAgIHByaW1pdGl2ZS5fcmVzdG9yZU1hdGVyaWFsKCk7XG4gICAgICB0aGlzLnNldHVwU2hhZGVyRm9yTWF0ZXJpYWwoXG4gICAgICAgIHByaW1pdGl2ZS5tYXRlcmlhbCxcbiAgICAgICAgcHJpbWl0aXZlLFxuICAgICAgICBXZWJHcHVTdHJhdGVneUJhc2ljLmdldFZlcnRleFNoYWRlck1ldGhvZERlZmluaXRpb25zX3N0b3JhZ2VCdWZmZXIodGhpcy5fX2VuZ2luZSwgU2hhZGVyVHlwZS5WZXJ0ZXhTaGFkZXIpLFxuICAgICAgICBXZWJHcHVTdHJhdGVneUJhc2ljLmdldFZlcnRleFNoYWRlck1ldGhvZERlZmluaXRpb25zX3N0b3JhZ2VCdWZmZXIodGhpcy5fX2VuZ2luZSwgU2hhZGVyVHlwZS5QaXhlbFNoYWRlciksXG4gICAgICAgIFdlYkdwdVN0cmF0ZWd5QmFzaWMuX19nZXRTaGFkZXJQcm9wZXJ0eU9mR2xvYmFsRGF0YVJlcG9zaXRvcnksXG4gICAgICAgIFdlYkdwdVN0cmF0ZWd5QmFzaWMuX19nZXRTaGFkZXJQcm9wZXJ0eU9mTWF0ZXJpYWwsXG4gICAgICAgIFdlYkdwdVN0cmF0ZWd5QmFzaWMuX19nZXRNb3JwaGVkUG9zaXRpb25HZXR0ZXIodGhpcy5fX2VuZ2luZSlcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgc2hhZGVyIHByb2dyYW1zIGZvciBtYXRlcmlhbHMgdXNpbmcgdGhlIFdlYkdQVSByZW5kZXJpbmcgc3RyYXRlZ3kuXG4gICAqIFRoaXMgbWV0aG9kIG9yY2hlc3RyYXRlcyB0aGUgc2hhZGVyIGNvbXBpbGF0aW9uIHByb2Nlc3MgYnkgcHJvdmlkaW5nIHRoZSBuZWNlc3NhcnlcbiAgICogbWV0aG9kIGRlZmluaXRpb25zIGFuZCBwcm9wZXJ0eSBzZXR0ZXJzLlxuICAgKlxuICAgKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgdG8gY3JlYXRlIHNoYWRlciBwcm9ncmFtcyBmb3JcbiAgICogQHBhcmFtIHByaW1pdGl2ZSAtIFRoZSBwcmltaXRpdmUgZ2VvbWV0cnkgdGhhdCB3aWxsIHVzZSB0aGlzIG1hdGVyaWFsXG4gICAqIEBwYXJhbSB2ZXJ0ZXhTaGFkZXJNZXRob2REZWZpbml0aW9uc0ZvclZlcnRleFNoYWRlciAtIFdHU0wgY29kZSBjb250YWluaW5nIHZlcnRleCBzaGFkZXIgaGVscGVyIG1ldGhvZHNcbiAgICogQHBhcmFtIHZlcnRleFNoYWRlck1ldGhvZERlZmluaXRpb25zRm9yUGl4ZWxTaGFkZXIgLSBXR1NMIGNvZGUgY29udGFpbmluZyBwaXhlbCBzaGFkZXIgaGVscGVyIG1ldGhvZHNcbiAgICogQHBhcmFtIHByb3BlcnR5U2V0dGVyIC0gRnVuY3Rpb24gdG8gZ2VuZXJhdGUgcHJvcGVydHkgYWNjZXNzb3IgbWV0aG9kc1xuICAgKi9cbiAgcHVibGljIHNldHVwU2hhZGVyRm9yTWF0ZXJpYWwoXG4gICAgbWF0ZXJpYWw6IE1hdGVyaWFsLFxuICAgIHByaW1pdGl2ZTogUHJpbWl0aXZlLFxuICAgIHZlcnRleFNoYWRlck1ldGhvZERlZmluaXRpb25zRm9yVmVydGV4U2hhZGVyOiBzdHJpbmcsXG4gICAgdmVydGV4U2hhZGVyTWV0aG9kRGVmaW5pdGlvbnNGb3JQaXhlbFNoYWRlcjogc3RyaW5nLFxuICAgIHByb3BlcnR5U2V0dGVyT2ZHbG9iYWxEYXRhUmVwb3NpdG9yeTogZ2V0U2hhZGVyUHJvcGVydHlGdW5jT2ZHbG9iYWxEYXRhUmVwb3NpdG9yeSxcbiAgICBwcm9wZXJ0eVNldHRlck9mTWF0ZXJpYWw6IGdldFNoYWRlclByb3BlcnR5RnVuY09mTWF0ZXJpYWwsXG4gICAgbW9ycGhlZFBvc2l0aW9uR2V0dGVyOiBzdHJpbmdcbiAgKTogdm9pZCB7XG4gICAgbWF0ZXJpYWwuX2NyZWF0ZVByb2dyYW1XZWJHcHUoXG4gICAgICB0aGlzLl9fZW5naW5lLFxuICAgICAgcHJpbWl0aXZlLFxuICAgICAgdmVydGV4U2hhZGVyTWV0aG9kRGVmaW5pdGlvbnNGb3JWZXJ0ZXhTaGFkZXIsXG4gICAgICB2ZXJ0ZXhTaGFkZXJNZXRob2REZWZpbml0aW9uc0ZvclBpeGVsU2hhZGVyLFxuICAgICAgcHJvcGVydHlTZXR0ZXJPZkdsb2JhbERhdGFSZXBvc2l0b3J5LFxuICAgICAgcHJvcGVydHlTZXR0ZXJPZk1hdGVyaWFsLFxuICAgICAgbW9ycGhlZFBvc2l0aW9uR2V0dGVyXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtcyBwcmUtcmVuZGVyaW5nIG9wZXJhdGlvbnMgcmVxdWlyZWQgYmVmb3JlIGRyYXdpbmcuXG4gICAqIFVwZGF0ZXMgc3RvcmFnZSBidWZmZXJzIHdoZW4gY29tcG9uZW50cyBoYXZlIGJlZW4gbW9kaWZpZWQgYW5kIGhhbmRsZXMgbW9ycGggdGFyZ2V0IHVwZGF0ZXMuXG4gICAqIFRoaXMgbWV0aG9kIHNob3VsZCBiZSBjYWxsZWQgb25jZSBwZXIgZnJhbWUgYmVmb3JlIGFueSByZW5kZXJpbmcgb3BlcmF0aW9ucy5cbiAgICovXG4gIHByZXJlbmRlcigpOiB2b2lkIHtcbiAgICAvLyBSZS11cGxvYWQgdGhlIEdQVSBpbnN0YW5jZSBkYXRhIHdoZW4gYW55IG9mIGl0cyBzb3VyY2VzIGNoYW5nZWQuIFRoZSBsaWdodCBjbHVzdGVyIHN5c3RlbSB3cml0ZXMgdGhlXG4gICAgLy8gYWxsLWxpZ2h0IGxpc3QgYW5kIHRoZSBjbHVzdGVyIHRhYmxlcyBpbnRvIHRoZSBzYW1lIHN0b3JhZ2UgYnVmZmVyLCBzbyBpdHMgYGRhdGFWZXJzaW9uYCBpcyBjb21wYXJlZCBoZXJlXG4gICAgLy8gbGlrZSB0aGUgY29tcG9uZW50IHVwZGF0ZSBjb3VudHMuXG4gICAgaWYgKFxuICAgICAgQW5pbWF0aW9uQ29tcG9uZW50LmdldElzQW5pbWF0aW5nKHRoaXMuX19lbmdpbmUpIHx8XG4gICAgICBUcmFuc2Zvcm1Db21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSkgIT09IHRoaXMuX19sYXN0VHJhbnNmb3JtQ29tcG9uZW50c1VwZGF0ZUNvdW50IHx8XG4gICAgICBTY2VuZUdyYXBoQ29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpICE9PSB0aGlzLl9fbGFzdFNjZW5lR3JhcGhDb21wb25lbnRzVXBkYXRlQ291bnQgfHxcbiAgICAgIENhbWVyYUNvbXBvbmVudC5nZXRDdXJyZW50Q2FtZXJhVXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSkgIT09IHRoaXMuX19sYXN0Q2FtZXJhQ29tcG9uZW50c1VwZGF0ZUNvdW50IHx8XG4gICAgICBDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpICE9PSB0aGlzLl9fbGFzdENhbWVyYUNvbnRyb2xsZXJDb21wb25lbnRzVXBkYXRlQ291bnQgfHxcbiAgICAgIHRoaXMuX19lbmdpbmUubWF0ZXJpYWxSZXBvc2l0b3J5LnN0YXRlVmVyc2lvbiAhPT0gdGhpcy5fX2xhc3RNYXRlcmlhbHNVcGRhdGVDb3VudCB8fFxuICAgICAgdGhpcy5fX2VuZ2luZS5saWdodENsdXN0ZXJTeXN0ZW0uZGF0YVZlcnNpb24gIT09IHRoaXMuX19sYXN0TGlnaHRDbHVzdGVyRGF0YVZlcnNpb24gfHxcbiAgICAgIExpZ2h0Q29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpICE9PSB0aGlzLl9fbGFzdExpZ2h0Q29tcG9uZW50c1VwZGF0ZUNvdW50XG4gICAgKSB7XG4gICAgICBjb25zdCBpc1N0b3JhZ2VCdWZmZXJSZWNyZWF0ZWQgPSB0aGlzLl9fY3JlYXRlQW5kVXBkYXRlU3RvcmFnZUJ1ZmZlcigpO1xuICAgICAgLy8gVGhlIEdQVSBjdWxsaW5nIHJlYWRzIHRoZSB0cmFuc2Zvcm1zIGFuZCB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgaW5zdGFuY2VzIGZyb20gdGhlIEdQVSBpbnN0YW5jZSBkYXRhLlxuICAgICAgdGhpcy5fX2VuZ2luZS53ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuX21hcmtHcHVDdWxsaW5nSW5wdXRzRGlydHkoKTtcbiAgICAgIC8vIFRoZSBjb21wdXRlIHNoYWRlcnMgcmVidWlsZCB0aGUgbGlnaHQgY2x1c3RlcnMgd2hlbiB0aGVpciBpbnB1dHMgY2hhbmdlZCwgYW5kIGFmdGVyIGEgbmV3IHN0b3JhZ2UgYnVmZmVyIHdhc1xuICAgICAgLy8gY3JlYXRlZCBmcm9tIHRoZSBDUFUgZGF0YSAod2hpY2ggZG9lcyBub3QgY29udGFpbiB0aGUgY2x1c3RlcnMgYnVpbHQgb24gdGhlIEdQVSkuXG4gICAgICAvLyBUaGUgb3JkZXIgbWF0dGVyczogdGhlIGJ1aWxkIGRpc3BhdGNoZXMgbXVzdCBiZSByZWNvcmRlZCBhZnRlciB0aGUgdXBsb2Fkcywgc28gdGhhdCB0aGV5IG92ZXJ3cml0ZSB0aGVcbiAgICAgIC8vIChzdGFsZSBvciB6ZXJvZWQpIGNsdXN0ZXIgcmVnaW9ucyBvZiB0aGUgQ1BVIGRhdGEuXG4gICAgICBjb25zdCBsaWdodENsdXN0ZXJEYXRhVmVyc2lvbiA9IHRoaXMuX19lbmdpbmUubGlnaHRDbHVzdGVyU3lzdGVtLmRhdGFWZXJzaW9uO1xuICAgICAgaWYgKGlzU3RvcmFnZUJ1ZmZlclJlY3JlYXRlZCB8fCBsaWdodENsdXN0ZXJEYXRhVmVyc2lvbiAhPT0gdGhpcy5fX2xhc3RMaWdodENsdXN0ZXJCdWlsZERhdGFWZXJzaW9uKSB7XG4gICAgICAgIHRoaXMuX19idWlsZExpZ2h0Q2x1c3RlcnNPbkdwdSgpO1xuICAgICAgICB0aGlzLl9fbGFzdExpZ2h0Q2x1c3RlckJ1aWxkRGF0YVZlcnNpb24gPSBsaWdodENsdXN0ZXJEYXRhVmVyc2lvbjtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19sYXN0VHJhbnNmb3JtQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gVHJhbnNmb3JtQ29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICAgICAgdGhpcy5fX2xhc3RTY2VuZUdyYXBoQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gU2NlbmVHcmFwaENvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKTtcbiAgICAgIHRoaXMuX19sYXN0Q2FtZXJhQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gQ2FtZXJhQ29tcG9uZW50LmdldEN1cnJlbnRDYW1lcmFVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKTtcbiAgICAgIHRoaXMuX19sYXN0Q2FtZXJhQ29udHJvbGxlckNvbXBvbmVudHNVcGRhdGVDb3VudCA9IENhbWVyYUNvbnRyb2xsZXJDb21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSk7XG4gICAgICB0aGlzLl9fbGFzdE1hdGVyaWFsc1VwZGF0ZUNvdW50ID0gdGhpcy5fX2VuZ2luZS5tYXRlcmlhbFJlcG9zaXRvcnkuc3RhdGVWZXJzaW9uO1xuICAgICAgdGhpcy5fX2xhc3RMaWdodENsdXN0ZXJEYXRhVmVyc2lvbiA9IHRoaXMuX19lbmdpbmUubGlnaHRDbHVzdGVyU3lzdGVtLmRhdGFWZXJzaW9uO1xuICAgICAgdGhpcy5fX2xhc3RMaWdodENvbXBvbmVudHNVcGRhdGVDb3VudCA9IExpZ2h0Q29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICAgIH1cblxuICAgIGNvbnN0IG1vcnBoTWF4SW5kZXggPSBQcmltaXRpdmUuZ2V0UHJpbWl0aXZlQ291bnRIYXNNb3JwaCgpO1xuICAgIGlmIChtb3JwaE1heEluZGV4ICE9PSB0aGlzLl9fbGFzdE1vcnBoTWF4SW5kZXgpIHtcbiAgICAgIHRoaXMuX19jcmVhdGVPclVwZGF0ZVN0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyKCk7XG4gICAgICB0aGlzLl9fbGFzdE1vcnBoTWF4SW5kZXggPSBtb3JwaE1heEluZGV4O1xuICAgICAgLy8gVGhlIHZlcnRleCBkZWZvcm1hdGlvbiBvZiB0aGUgR1BVIGN1bGxpbmcgcmVhZHMgdGhlIG1vcnBoIHRhcmdldHMuXG4gICAgICB0aGlzLl9fZW5naW5lLndlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5fbWFya0dwdUN1bGxpbmdJbnB1dHNEaXJ0eSgpO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIEJsZW5kU2hhcGVDb21wb25lbnQudXBkYXRlQ291bnQgIT09IHRoaXMuX19sYXN0QmxlbmRTaGFwZUNvbXBvbmVudHNVcGRhdGVDb3VudEZvcldlaWdodHMgfHxcbiAgICAgIEJsZW5kU2hhcGVDb21wb25lbnQuZ2V0Q291bnRPZkJsZW5kU2hhcGVDb21wb25lbnRzKHRoaXMuX19lbmdpbmUpICE9PSB0aGlzLl9fY291bnRPZkJsZW5kU2hhcGVDb21wb25lbnRzXG4gICAgKSB7XG4gICAgICB0aGlzLl9fdXBkYXRlTW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlcigpO1xuICAgICAgLy8gVGhlIHZlcnRleCBkZWZvcm1hdGlvbiBvZiB0aGUgR1BVIGN1bGxpbmcgcmVhZHMgdGhlIGJsZW5kIHNoYXBlIHdlaWdodHMuXG4gICAgICB0aGlzLl9fZW5naW5lLndlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5fbWFya0dwdUN1bGxpbmdJbnB1dHNEaXJ0eSgpO1xuICAgICAgdGhpcy5fX2xhc3RCbGVuZFNoYXBlQ29tcG9uZW50c1VwZGF0ZUNvdW50Rm9yV2VpZ2h0cyA9IEJsZW5kU2hhcGVDb21wb25lbnQudXBkYXRlQ291bnQ7XG4gICAgICB0aGlzLl9fY291bnRPZkJsZW5kU2hhcGVDb21wb25lbnRzID0gQmxlbmRTaGFwZUNvbXBvbmVudC5nZXRDb3VudE9mQmxlbmRTaGFwZUNvbXBvbmVudHModGhpcy5fX2VuZ2luZSk7XG4gICAgICB0aGlzLl9fZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5fbWFrZVNoYWRlckludmFsaWRhdGVUb01vcnBoTWF0ZXJpYWxzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1haW4gcmVuZGVyaW5nIG1ldGhvZCB0aGF0IGRyYXdzIGFsbCBwcmltaXRpdmVzIGluIHRoZSBzcGVjaWZpZWQgcmVuZGVyIHBhc3MuXG4gICAqIEhhbmRsZXMgZGlmZmVyZW50IHByaW1pdGl2ZSB0eXBlcyAob3BhcXVlLCB0cmFuc2x1Y2VudCwgYmxlbmQpIHdpdGggYXBwcm9wcmlhdGUgZGVwdGggd3JpdGluZyBzZXR0aW5ncy5cbiAgICpcbiAgICogQHBhcmFtIHByaW1pdGl2ZVVpZHMgLSBBcnJheSBvZiBwcmltaXRpdmUgVUlEcyB0byByZW5kZXIsIHNvcnRlZCBieSByZW5kZXJpbmcgb3JkZXJcbiAgICogQHBhcmFtIHJlbmRlclBhc3MgLSBUaGUgcmVuZGVyIHBhc3MgY29uZmlndXJhdGlvbiBjb250YWluaW5nIHJlbmRlcmluZyBzZXR0aW5nc1xuICAgKiBAcGFyYW0gcmVuZGVyUGFzc1RpY2tDb3VudCAtIEN1cnJlbnQgdGljayBjb3VudCBmb3IgYW5pbWF0aW9uIGFuZCB0aW1pbmcgcHVycG9zZXNcbiAgICogQHBhcmFtIGRpc3BsYXlJZHggLSBUaGUgaW5kZXggb2YgdGhlIGRpc3BsYXkgdG8gcmVuZGVyIHRvXG4gICAqIEByZXR1cm5zIFRydWUgaWYgYW55IHByaW1pdGl2ZXMgd2VyZSBzdWNjZXNzZnVsbHkgcmVuZGVyZWRcbiAgICovXG4gIGNvbW1vbl8kcmVuZGVyKFxuICAgIHByaW1pdGl2ZVVpZHM6IFByaW1pdGl2ZVVJRFtdLFxuICAgIHJlbmRlclBhc3M6IFJlbmRlclBhc3MsXG4gICAgX3JlbmRlclBhc3NUaWNrQ291bnQ6IENvdW50LFxuICAgIGRpc3BsYXlJZHg6IEluZGV4XG4gICk6IGJvb2xlYW4ge1xuICAgIGlmIChyZW5kZXJQYXNzLmlzQnVmZmVyTGVzc1JlbmRlcmluZ01vZGUoKSkge1xuICAgICAgdGhpcy5fX3JlbmRlcldpdGhvdXRCdWZmZXJzKHJlbmRlclBhc3MpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgbGV0IHJlbmRlcmVkU29tZXRoaW5nID0gZmFsc2U7XG4gICAgY29uc3QgaXNaV3JpdGUgPSByZW5kZXJQYXNzLmlzRGVwdGhUZXN0ICYmIHJlbmRlclBhc3MuZGVwdGhXcml0ZU1hc2s7XG4gICAgY29uc3QgdXNlRGVwdGhQcmVwYXNzID0gdGhpcy5fX2lzRGVwdGhQcmVwYXNzQXZhaWxhYmxlKHJlbmRlclBhc3MpO1xuICAgIC8vIERyYXcgdGhlIG9wYXF1ZSBwcmltaXRpdmVzIGRlcHRoLW9ubHkgZmlyc3QsIHNvIHRoZSBjb2xvciBwYXNzIGNhbiByZWplY3QgaGlkZGVuIGZyYWdtZW50cyBiZWZvcmUgc2hhZGluZy5cbiAgICBpZiAodXNlRGVwdGhQcmVwYXNzKSB7XG4gICAgICBmb3IgKGxldCBpID0gcmVuZGVyUGFzcy5fbGFzdE9wYXF1ZUluZGV4OyBpID49IDA7IGktLSkge1xuICAgICAgICB0aGlzLnJlbmRlcklubmVyKHByaW1pdGl2ZVVpZHNbaV0sIHJlbmRlclBhc3MsIHRydWUsIGRpc3BsYXlJZHgsIHsgZGVwdGhPbmx5OiB0cnVlIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBGb3Igb3BhcXVlIHByaW1pdGl2ZXNcbiAgICBpZiAocmVuZGVyUGFzcy5fdG9SZW5kZXJPcGFxdWVQcmltaXRpdmVzKSB7XG4gICAgICBmb3IgKGxldCBpID0gcmVuZGVyUGFzcy5fbGFzdE9wYXF1ZUluZGV4OyBpID49IDA7IGktLSkge1xuICAgICAgICAvLyBEcmF3aW5nIGZyb20gdGhlIG5lYXJlc3Qgb2JqZWN0XG4gICAgICAgIGNvbnN0IHByaW1pdGl2ZVVpZCA9IHByaW1pdGl2ZVVpZHNbaV07XG4gICAgICAgIGNvbnN0IHJlbmRlcmVkID0gdGhpcy5yZW5kZXJJbm5lcihwcmltaXRpdmVVaWQsIHJlbmRlclBhc3MsIGlzWldyaXRlLCBkaXNwbGF5SWR4LCB7XG4gICAgICAgICAgYWxsb3dFcXVhbERlcHRoOiB1c2VEZXB0aFByZXBhc3MsXG4gICAgICAgIH0pO1xuICAgICAgICByZW5kZXJlZFNvbWV0aGluZyB8fD0gcmVuZGVyZWQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRm9yIHRyYW5zbHVjZW50IHByaW1pdGl2ZXNcbiAgICBpZiAocmVuZGVyUGFzcy5fdG9SZW5kZXJUcmFuc2x1Y2VudFByaW1pdGl2ZXMpIHtcbiAgICAgIC8vIERyYXcgVHJhbnNsdWNlbnQgcHJpbWl0aXZlc1xuICAgICAgZm9yIChsZXQgaSA9IHJlbmRlclBhc3MuX2xhc3RPcGFxdWVJbmRleCArIDE7IGkgPD0gcmVuZGVyUGFzcy5fbGFzdFRyYW5zbHVjZW50SW5kZXg7IGkrKykge1xuICAgICAgICBjb25zdCBwcmltaXRpdmVVaWQgPSBwcmltaXRpdmVVaWRzW2ldO1xuICAgICAgICBjb25zdCByZW5kZXJlZCA9IHRoaXMucmVuZGVySW5uZXIocHJpbWl0aXZlVWlkLCByZW5kZXJQYXNzLCBpc1pXcml0ZSwgZGlzcGxheUlkeCk7XG4gICAgICAgIHJlbmRlcmVkU29tZXRoaW5nIHx8PSByZW5kZXJlZDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocmVuZGVyUGFzcy5fdG9SZW5kZXJCbGVuZFdpdGhaV3JpdGVQcmltaXRpdmVzKSB7XG4gICAgICAvLyBEcmF3IEJsZW5kIHByaW1pdGl2ZXMgd2l0aCBaV3JpdGVcbiAgICAgIGZvciAobGV0IGkgPSByZW5kZXJQYXNzLl9sYXN0VHJhbnNsdWNlbnRJbmRleCArIDE7IGkgPD0gcmVuZGVyUGFzcy5fbGFzdEJsZW5kV2l0aFpXcml0ZUluZGV4OyBpKyspIHtcbiAgICAgICAgY29uc3QgcHJpbWl0aXZlVWlkID0gcHJpbWl0aXZlVWlkc1tpXTtcbiAgICAgICAgY29uc3QgcmVuZGVyZWQgPSB0aGlzLnJlbmRlcklubmVyKHByaW1pdGl2ZVVpZCwgcmVuZGVyUGFzcywgaXNaV3JpdGUsIGRpc3BsYXlJZHgpO1xuICAgICAgICByZW5kZXJlZFNvbWV0aGluZyB8fD0gcmVuZGVyZWQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHJlbmRlclBhc3MuX3RvUmVuZGVyQmxlbmRXaXRob3V0WldyaXRlUHJpbWl0aXZlcykge1xuICAgICAgLy8gRHJhdyBCbGVuZCBwcmltaXRpdmVzIHdpdGhvdXQgWldyaXRlXG4gICAgICBmb3IgKGxldCBpID0gcmVuZGVyUGFzcy5fbGFzdEJsZW5kV2l0aFpXcml0ZUluZGV4ICsgMTsgaSA8PSByZW5kZXJQYXNzLl9sYXN0QmxlbmRXaXRob3V0WldyaXRlSW5kZXg7IGkrKykge1xuICAgICAgICBjb25zdCBwcmltaXRpdmVVaWQgPSBwcmltaXRpdmVVaWRzW2ldO1xuICAgICAgICBjb25zdCByZW5kZXJlZCA9IHRoaXMucmVuZGVySW5uZXIocHJpbWl0aXZlVWlkLCByZW5kZXJQYXNzLCBmYWxzZSwgZGlzcGxheUlkeCk7XG4gICAgICAgIHJlbmRlcmVkU29tZXRoaW5nIHx8PSByZW5kZXJlZDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVuZGVyZWRTb21ldGhpbmc7XG4gIH1cblxuICAvKipcbiAgICogUmVuZGVycyBwcmltaXRpdmVzIHdpdGhvdXQgdXNpbmcgdmVydGV4L2luZGV4IGJ1ZmZlcnMuXG4gICAqIFRoaXMgaXMgdXNlZCBmb3Igc3BlY2lhbCByZW5kZXJpbmcgbW9kZXMgbGlrZSBmdWxsLXNjcmVlbiBlZmZlY3RzIG9yIHByb2NlZHVyYWwgZ2VvbWV0cnkuXG4gICAqXG4gICAqIEBwYXJhbSByZW5kZXJQYXNzIC0gVGhlIHJlbmRlciBwYXNzIGNvbnRhaW5pbmcgdGhlIG1hdGVyaWFsIGFuZCByZW5kZXJpbmcgY29uZmlndXJhdGlvblxuICAgKi9cbiAgcHJpdmF0ZSBfX3JlbmRlcldpdGhvdXRCdWZmZXJzKHJlbmRlclBhc3M6IFJlbmRlclBhc3MpIHtcbiAgICBjb25zdCBtYXRlcmlhbCA9IHJlbmRlclBhc3MubWF0ZXJpYWwhO1xuICAgIGNvbnN0IHByaW1pdGl2ZSA9IHJlbmRlclBhc3MuX2R1bW15UHJpbWl0aXZlRm9yQnVmZmVyTGVzc1JlbmRlcmluZztcbiAgICB0aGlzLl9zZXR1cFNoYWRlclByb2dyYW0obWF0ZXJpYWwsIHByaW1pdGl2ZSk7XG5cbiAgICBjb25zdCB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYkdwdVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBjb25zdCBjYW1lcmFTSUQgPSB0aGlzLl9fZ2V0QXBwcm9wcmlhdGVDYW1lcmFDb21wb25lbnRTSUQocmVuZGVyUGFzcywgMCwgZmFsc2UpO1xuICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5zZXREcmF3UGFyYW1ldGVycyhtYXRlcmlhbC5tYXRlcmlhbFNJRCwgY2FtZXJhU0lELCAwLCAwKTtcbiAgICBjb25zdCBpc1pXcml0ZSA9IHJlbmRlclBhc3MuaXNEZXB0aFRlc3QgJiYgcmVuZGVyUGFzcy5kZXB0aFdyaXRlTWFzaztcbiAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuZHJhdyh0aGlzLl9fZW5naW5lLCBwcmltaXRpdmUsIG1hdGVyaWFsLCByZW5kZXJQYXNzLCBjYW1lcmFTSUQsIGlzWldyaXRlLCAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBkZXB0aCBwcmVwYXNzIGNhbiBydW4gZm9yIHRoZSByZW5kZXIgcGFzczogaXQgbXVzdCBiZSBlbmFibGVkLCBkcmF3IHRoZSBzY2VuZSBpdHNlbGYgKHJlbmRlciBwYXNzZXNcbiAgICogd2l0aCBhIG1hdGVyaWFsIG92ZXJyaWRlIHN1Y2ggYXMgc2hhZG93IG1hcHMgYW5kIHBvc3QgZWZmZWN0cyBhcmUgZXhjbHVkZWQpLCBhbmQgd3JpdGUgZGVwdGguXG4gICAqL1xuICBwcml2YXRlIF9faXNEZXB0aFByZXBhc3NBdmFpbGFibGUocmVuZGVyUGFzczogUmVuZGVyUGFzcykge1xuICAgIGNvbnN0IGZyYW1lYnVmZmVyID0gcmVuZGVyUGFzcy5nZXRGcmFtZWJ1ZmZlcigpO1xuICAgIHJldHVybiAoXG4gICAgICB0aGlzLl9fZW5naW5lLmNvbmZpZy5pc0RlcHRoUHJlcGFzc0VuYWJsZWQgJiZcbiAgICAgIHJlbmRlclBhc3MubWF0ZXJpYWwgPT0gbnVsbCAmJlxuICAgICAgcmVuZGVyUGFzcy5pc0RlcHRoVGVzdCAmJlxuICAgICAgcmVuZGVyUGFzcy5kZXB0aFdyaXRlTWFzayAmJlxuICAgICAgKGZyYW1lYnVmZmVyID09IG51bGwgfHwgZnJhbWVidWZmZXIuZGVwdGhBdHRhY2htZW50ICE9IG51bGwpICYmXG4gICAgICByZW5kZXJQYXNzLl90b1JlbmRlck9wYXF1ZVByaW1pdGl2ZXMgJiZcbiAgICAgIHJlbmRlclBhc3MuX2xhc3RPcGFxdWVJbmRleCA+PSAwXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5kZXJzIGEgc2luZ2xlIHByaW1pdGl2ZSB3aXRoIHRoZSBzcGVjaWZpZWQgbWF0ZXJpYWwgYW5kIHJlbmRlciBzZXR0aW5ncy5cbiAgICogSGFuZGxlcyBzaGFkZXIgc2V0dXAsIHVuaWZvcm0gYnVmZmVyIHVwZGF0ZXMsIGFuZCB0aGUgYWN0dWFsIGRyYXcgY2FsbC5cbiAgICpcbiAgICogQHBhcmFtIHByaW1pdGl2ZVVpZCAtIFVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSBwcmltaXRpdmUgdG8gcmVuZGVyXG4gICAqIEBwYXJhbSByZW5kZXJQYXNzIC0gUmVuZGVyIHBhc3MgY29udGFpbmluZyByZW5kZXJpbmcgY29uZmlndXJhdGlvblxuICAgKiBAcGFyYW0geldyaXRlIC0gV2hldGhlciB0byBlbmFibGUgZGVwdGggYnVmZmVyIHdyaXRpbmdcbiAgICogQHBhcmFtIGRpc3BsYXlJZHggLSBUaGUgaW5kZXggb2YgdGhlIGRpc3BsYXkgdG8gcmVuZGVyIHRvXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIHByaW1pdGl2ZSB3YXMgc3VjY2Vzc2Z1bGx5IHJlbmRlcmVkXG4gICAqL1xuICByZW5kZXJJbm5lcihcbiAgICBwcmltaXRpdmVVaWQ6IFByaW1pdGl2ZVVJRCxcbiAgICByZW5kZXJQYXNzOiBSZW5kZXJQYXNzLFxuICAgIHpXcml0ZTogYm9vbGVhbixcbiAgICBkaXNwbGF5SWR4OiBJbmRleCxcbiAgICBvcHRpb25zOiB7IGRlcHRoT25seT86IGJvb2xlYW47IGFsbG93RXF1YWxEZXB0aD86IGJvb2xlYW4gfSA9IHt9XG4gICkge1xuICAgIGlmIChwcmltaXRpdmVVaWQgPT09IC0xKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IHByaW1pdGl2ZSA9IFByaW1pdGl2ZS5nZXRQcmltaXRpdmUocHJpbWl0aXZlVWlkKTtcbiAgICBpZiAocHJpbWl0aXZlID09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgbWF0ZXJpYWw6IE1hdGVyaWFsID0gcmVuZGVyUGFzcy5nZXRBcHByb3ByaWF0ZU1hdGVyaWFsKHByaW1pdGl2ZSk7XG4gICAgdGhpcy5fc2V0dXBTaGFkZXJQcm9ncmFtKG1hdGVyaWFsLCBwcmltaXRpdmUpO1xuICAgIGlmIChpc1NraXBEcmF3aW5nKG1hdGVyaWFsLCBwcmltaXRpdmUpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChcbiAgICAgIG9wdGlvbnMuZGVwdGhPbmx5ICYmXG4gICAgICAobWF0ZXJpYWwuYWxwaGFNb2RlID09PSBBbHBoYU1vZGUuTWFzayB8fCBtYXRlcmlhbC5hbHBoYVRvQ292ZXJhZ2UgfHwgbWF0ZXJpYWwuaXNTaGFkZXJEZWZpbmUoJ1JOX1VTRV9XSVJFRlJBTUUnKSlcbiAgICApIHtcbiAgICAgIC8vIFRoZSBwcmVwYXNzIGNhbm5vdCBkaXNjYXJkIChvciBhcHBseSBhIHBlci1zYW1wbGUgY292ZXJhZ2UpLCBzbyB0aG9zZSBwcmltaXRpdmVzIGtlZXAgdGhlaXIgbm9ybWFsIGRyYXdcbiAgICAgIC8vIGFuZCBkZXB0aCB3cml0ZS4gSW5jbHVkaW5nIHRoZW0gd291bGQgb2NjbHVkZSB0aGUgc3VyZmFjZXMgYmVoaW5kIHRoZSBkaXNjYXJkZWQgZnJhZ21lbnRzLlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGNvbnN0IHdlYnhyU3lzdGVtID0gdGhpcy5fX2VuZ2luZS5fd2ViWFJTeXN0ZW1JZkVuYWJsZWQ7XG4gICAgY29uc3QgY2FtZXJhU0lEID0gdGhpcy5fX2dldEFwcHJvcHJpYXRlQ2FtZXJhQ29tcG9uZW50U0lEKFxuICAgICAgcmVuZGVyUGFzcyxcbiAgICAgIGRpc3BsYXlJZHggYXMgMCB8IDEsXG4gICAgICAod2VieHJTeXN0ZW0/LmlzV2ViWFJNb2RlID8/IGZhbHNlKSAmJiByZW5kZXJQYXNzLmlzVnJSZW5kZXJpbmdcbiAgICApO1xuXG4gICAgY29uc3QgcHJpbWl0aXZlSWR4SGFzTW9ycGggPSBQcmltaXRpdmUuZ2V0UHJpbWl0aXZlSWR4SGFzTW9ycGgocHJpbWl0aXZlLnByaW1pdGl2ZVVpZCkgPz8gMDtcbiAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuc2V0RHJhd1BhcmFtZXRlcnMoXG4gICAgICBtYXRlcmlhbC5tYXRlcmlhbFNJRCxcbiAgICAgIGNhbWVyYVNJRCxcbiAgICAgIHByaW1pdGl2ZUlkeEhhc01vcnBoLFxuICAgICAgcHJpbWl0aXZlLnRhcmdldHMubGVuZ3RoXG4gICAgKTtcbiAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuZHJhdyhcbiAgICAgIHRoaXMuX19lbmdpbmUsXG4gICAgICBwcmltaXRpdmUsXG4gICAgICBtYXRlcmlhbCxcbiAgICAgIHJlbmRlclBhc3MsXG4gICAgICBjYW1lcmFTSUQsXG4gICAgICB6V3JpdGUsXG4gICAgICBkaXNwbGF5SWR4LFxuICAgICAgb3B0aW9uc1xuICAgICk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBvciB1cGRhdGVzIHRoZSBtYWluIHN0b3JhZ2UgYnVmZmVyIGNvbnRhaW5pbmcgYWxsIEdQVSBpbnN0YW5jZSBkYXRhLlxuICAgKiBUaGlzIGJ1ZmZlciBob2xkcyB0cmFuc2Zvcm0gbWF0cmljZXMsIG1hdGVyaWFsIHByb3BlcnRpZXMsIGFuZCBvdGhlciBwZXItaW5zdGFuY2UgZGF0YVxuICAgKiByZXF1aXJlZCBmb3IgcmVuZGVyaW5nIGFsbCBvYmplY3RzIGluIHRoZSBzY2VuZS5cbiAgICovXG4gIHByaXZhdGUgX19jcmVhdGVBbmRVcGRhdGVTdG9yYWdlQnVmZmVyKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IG1lbW9yeU1hbmFnZXIgPSB0aGlzLl9fZW5naW5lLm1lbW9yeU1hbmFnZXI7XG5cbiAgICAvLyB0aGUgR1BVIGdsb2JhbCBTdG9yYWdlXG4gICAgY29uc3QgZ3B1SW5zdGFuY2VEYXRhQnVmZmVycyA9IG1lbW9yeU1hbmFnZXIuZ2V0QnVmZmVycyhCdWZmZXJVc2UuR1BVSW5zdGFuY2VEYXRhKTtcbiAgICBjb25zdCBncHVJbnN0YW5jZURhdGFCdWZmZXJDb3VudCA9IGdwdUluc3RhbmNlRGF0YUJ1ZmZlcnMubGVuZ3RoO1xuICAgIGNvbnN0IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGlmIChncHVJbnN0YW5jZURhdGFCdWZmZXJDb3VudCAhPT0gdGhpcy5fX2xhc3RHcHVJbnN0YW5jZURhdGFCdWZmZXJDb3VudCkge1xuICAgICAgdGhpcy5fX2xhc3RHcHVJbnN0YW5jZURhdGFCdWZmZXJDb3VudCA9IGdwdUluc3RhbmNlRGF0YUJ1ZmZlckNvdW50O1xuICAgICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmRlc3Ryb3lTdG9yYWdlQnVmZmVyKHRoaXMuX19zdG9yYWdlQnVmZmVyVWlkKTtcbiAgICAgIHRoaXMuX19zdG9yYWdlQnVmZmVyVWlkID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gICAgfVxuXG4gICAgLy8gY29uc3QgZGF0YVRleHR1cmVCeXRlU2l6ZSA9XG4gICAgLy8gICBNZW1vcnlNYW5hZ2VyLmJ1ZmZlcldpZHRoTGVuZ3RoICogTWVtb3J5TWFuYWdlci5idWZmZXJIZWlnaHRMZW5ndGggKiA0ICogNDtcbiAgICBpZiAodGhpcy5fX3N0b3JhZ2VCdWZmZXJVaWQgIT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkKSB7XG4gICAgICAvLyBVcGRhdGUuIFRoZSBsaWdodCBjbHVzdGVyIGxpc3RzIGFyZSBsYXJnZSBhbmQgd3JpdHRlbiBieSB0aGUgY29tcHV0ZSBzaGFkZXJzIG9yIHVwbG9hZGVkIGFzIGRpcnR5IHJhbmdlcyxcbiAgICAgIC8vIHNvIHRoZSBnZW5lcmljIHVwbG9hZCBza2lwcyB0aGVtLlxuICAgICAgY29uc3QgbGlnaHRDbHVzdGVyU3lzdGVtID0gdGhpcy5fX2VuZ2luZS5saWdodENsdXN0ZXJTeXN0ZW07XG4gICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkudXBkYXRlU3RvcmFnZUJ1ZmZlcihcbiAgICAgICAgdGhpcy5fX3N0b3JhZ2VCdWZmZXJVaWQsXG4gICAgICAgIGdwdUluc3RhbmNlRGF0YUJ1ZmZlcnMsXG4gICAgICAgIGxpZ2h0Q2x1c3RlclN5c3RlbS5fZ2V0RXhjbHVkZWRCeXRlUmFuZ2VzKClcbiAgICAgICk7XG4gICAgICBjb25zdCBkaXJ0eVJhbmdlcyA9IGxpZ2h0Q2x1c3RlclN5c3RlbS5fdGFrZURpcnR5Qnl0ZVJhbmdlcygpO1xuICAgICAgaWYgKGRpcnR5UmFuZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LnVwZGF0ZVN0b3JhZ2VCdWZmZXJSYW5nZXMoXG4gICAgICAgICAgdGhpcy5fX3N0b3JhZ2VCdWZmZXJVaWQsXG4gICAgICAgICAgZ3B1SW5zdGFuY2VEYXRhQnVmZmVycyxcbiAgICAgICAgICBkaXJ0eVJhbmdlc1xuICAgICAgICApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBDcmVhdGUgKHVwbG9hZHMgZXZlcnl0aGluZywgaW5jbHVkaW5nIHRoZSBsaWdodCBjbHVzdGVycyBidWlsdCBvbiB0aGUgQ1BVKVxuICAgIHRoaXMuX19zdG9yYWdlQnVmZmVyVWlkID0gd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmNyZWF0ZVN0b3JhZ2VCdWZmZXIoZ3B1SW5zdGFuY2VEYXRhQnVmZmVycyk7XG4gICAgdGhpcy5fX2VuZ2luZS5saWdodENsdXN0ZXJTeXN0ZW0uX3Rha2VEaXJ0eUJ5dGVSYW5nZXMoKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZHMgdGhlIENsdXN0ZXJlZCBGb3J3YXJkIGxpZ2h0IGNsdXN0ZXIgdGFibGVzIHdpdGggY29tcHV0ZSBzaGFkZXJzIHdoZW4gdGhlIExpZ2h0Q2x1c3RlclN5c3RlbVxuICAgKiBidWlsZHMgdGhlbSBvbiB0aGUgR1BVLiBJdCBtdXN0IHJ1biBhZnRlciBldmVyeSB1cGxvYWQgb2YgdGhlIEdQVSBpbnN0YW5jZSBkYXRhLCB3aGljaCBvdmVyd3JpdGVzIHRoZSB0YWJsZXMuXG4gICAqL1xuICBwcml2YXRlIF9fYnVpbGRMaWdodENsdXN0ZXJzT25HcHUoKSB7XG4gICAgY29uc3QgcGFyYW1zID0gdGhpcy5fX2VuZ2luZS5saWdodENsdXN0ZXJTeXN0ZW0uX2dldEdwdUJ1aWxkUGFyYW1zKCk7XG4gICAgaWYgKHBhcmFtcyA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGNvbnN0IHN0b3JhZ2VCdWZmZXIgPSB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuX2dldFN0b3JhZ2VCdWZmZXIoKTtcbiAgICBpZiAoc3RvcmFnZUJ1ZmZlciA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX19saWdodENsdXN0ZXJCdWlsZGVyID8/PSBuZXcgV2ViR3B1TGlnaHRDbHVzdGVyQnVpbGRlcihcbiAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5nZXRXZWJHcHVEZXZpY2VXcmFwcGVyKCkuZ3B1RGV2aWNlXG4gICAgKTtcbiAgICBjb25zdCBncHVUaW1lciA9IHRoaXMuX19lbmdpbmUuZ3B1VGltZXJFbmFibGVkID8gd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5Ll9nZXRHcHVUaW1lcigpIDogdW5kZWZpbmVkO1xuICAgIHRoaXMuX19saWdodENsdXN0ZXJCdWlsZGVyLmJ1aWxkKHN0b3JhZ2VCdWZmZXIsIHBhcmFtcywgZ3B1VGltZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgb3IgdXBkYXRlcyB0aGUgc3RvcmFnZSBidWZmZXIgY29udGFpbmluZyBibGVuZCBzaGFwZSB2ZXJ0ZXggZGF0YS5cbiAgICogVGhpcyBidWZmZXIgaG9sZHMgbW9ycGggdGFyZ2V0IHBvc2l0aW9ucyBhbmQgb3RoZXIgdmVydGV4IGF0dHJpYnV0ZXMgbmVlZGVkIGZvciBibGVuZCBzaGFwZSBhbmltYXRpb24uXG4gICAqL1xuICBwcml2YXRlIF9fY3JlYXRlT3JVcGRhdGVTdG9yYWdlQmxlbmRTaGFwZUJ1ZmZlcigpIHtcbiAgICBjb25zdCBtZW1vcnlNYW5hZ2VyID0gdGhpcy5fX2VuZ2luZS5tZW1vcnlNYW5hZ2VyO1xuXG4gICAgLy8gdGhlIEdQVSBnbG9iYWwgU3RvcmFnZVxuICAgIGNvbnN0IGJsZW5kU2hhcGVEYXRhQnVmZmVyczogQnVmZmVyW10gPSBtZW1vcnlNYW5hZ2VyLmdldEJ1ZmZlcnMoQnVmZmVyVXNlLkdQVVZlcnRleERhdGEpO1xuXG4gICAgaWYgKGJsZW5kU2hhcGVEYXRhQnVmZmVycy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBibGVuZFNoYXBlRGF0YUJ1ZmZlckJ5dGVMZW5ndGggPSBibGVuZFNoYXBlRGF0YUJ1ZmZlcnMucmVkdWNlKChhY2MsIGJ1ZmZlcikgPT4gYWNjICsgYnVmZmVyLmJ5dGVMZW5ndGgsIDApO1xuXG4gICAgaWYgKGJsZW5kU2hhcGVEYXRhQnVmZmVyQnl0ZUxlbmd0aCAhPT0gdGhpcy5fX3N0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyQnl0ZUxlbmd0aCkge1xuICAgICAgdGhpcy5fX2VuZ2luZS53ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuZGVsZXRlU3RvcmFnZUJsZW5kU2hhcGVCdWZmZXIodGhpcy5fX3N0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyVWlkKTtcbiAgICAgIHRoaXMuX19zdG9yYWdlQmxlbmRTaGFwZUJ1ZmZlclVpZCA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICAgICAgdGhpcy5fX3N0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyQnl0ZUxlbmd0aCA9IGJsZW5kU2hhcGVEYXRhQnVmZmVyQnl0ZUxlbmd0aDtcbiAgICB9XG5cbiAgICBjb25zdCB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYkdwdVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBjb25zdCBmbG9hdDMyQXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KGJsZW5kU2hhcGVEYXRhQnVmZmVyQnl0ZUxlbmd0aCAvIDQpO1xuICAgIC8vIGNvcHkgdGhlIGRhdGEgZnJvbSB0aGUgYmxlbmRTaGFwZURhdGFCdWZmZXJzIHRvIHRoZSBmbG9hdDMyQXJyYXlcbiAgICBsZXQgb2Zmc2V0ID0gMDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJsZW5kU2hhcGVEYXRhQnVmZmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgYnVmZmVyID0gYmxlbmRTaGFwZURhdGFCdWZmZXJzW2ldO1xuICAgICAgZmxvYXQzMkFycmF5LnNldChuZXcgRmxvYXQzMkFycmF5KGJ1ZmZlci5nZXRBcnJheUJ1ZmZlcigpKSwgb2Zmc2V0KTtcbiAgICAgIG9mZnNldCArPSBidWZmZXIuYnl0ZUxlbmd0aCAvIDQ7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX19zdG9yYWdlQmxlbmRTaGFwZUJ1ZmZlclVpZCAhPT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQpIHtcbiAgICAgIC8vIFVwZGF0ZVxuICAgICAgY29uc3QgY29tcG9uZW50U2l6ZUZvckRhdGFUZXh0dXJlID0gYmxlbmRTaGFwZURhdGFCdWZmZXJCeXRlTGVuZ3RoIC8gNDtcbiAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS51cGRhdGVTdG9yYWdlQmxlbmRTaGFwZUJ1ZmZlcihcbiAgICAgICAgdGhpcy5fX3N0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyVWlkLFxuICAgICAgICBmbG9hdDMyQXJyYXksXG4gICAgICAgIGNvbXBvbmVudFNpemVGb3JEYXRhVGV4dHVyZVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQ3JlYXRlXG4gICAgICB0aGlzLl9fc3RvcmFnZUJsZW5kU2hhcGVCdWZmZXJVaWQgPSB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuY3JlYXRlU3RvcmFnZUJsZW5kU2hhcGVCdWZmZXIoZmxvYXQzMkFycmF5KTtcbiAgICB9XG5cbiAgICB0aGlzLl9fdXBkYXRlTW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBfX3VwZGF0ZU1vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXIoKSB7XG4gICAgY29uc3Qgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy5fX2VuZ2luZS53ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgY29uc3QgbW9ycGhVbmlmb3JtRGF0YU9mZnNldHMgPSBQcmltaXRpdmUuZ2V0TW9ycGhVbmlmb3JtRGF0YU9mZnNldHMoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IFByaW1pdGl2ZS5nZXRQcmltaXRpdmVDb3VudEhhc01vcnBoKCk7IGkrKykge1xuICAgICAgY29uc3QgcHJpbWl0aXZlID0gUHJpbWl0aXZlLmdldFByaW1pdGl2ZUhhc01vcnBoKGkpO1xuICAgICAgaWYgKHByaW1pdGl2ZSAhPSBudWxsKSB7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcHJpbWl0aXZlLnRhcmdldHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBjb25zdCB0YXJnZXQgPSBwcmltaXRpdmUudGFyZ2V0c1tqXTtcbiAgICAgICAgICBjb25zdCBhY2Nlc3NvciA9IHRhcmdldC5nZXQoVmVydGV4QXR0cmlidXRlLlBvc2l0aW9uLlhZWikgYXMgQWNjZXNzb3I7XG4gICAgICAgICAgY29uc3QgYnl0ZU9mZnNldE9mRXhpc3RpbmdCdWZmZXIgPSB0aGlzLl9fZW5naW5lLm1lbW9yeU1hbmFnZXIuZ2V0Qnl0ZU9mZnNldE9mRXhpc3RpbmdCdWZmZXJzKFxuICAgICAgICAgICAgQnVmZmVyVXNlLkdQVVZlcnRleERhdGEsXG4gICAgICAgICAgICBhY2Nlc3Nvci5idWZmZXJWaWV3LmJ1ZmZlci5pbmRleE9mVGhlQnVmZmVyVXNhZ2VcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMuX191bmlmb3JtTW9ycGhPZmZzZXRzVHlwZWRBcnJheSFbbW9ycGhVbmlmb3JtRGF0YU9mZnNldHNbaV0gKyBqXSA9XG4gICAgICAgICAgICAoYnl0ZU9mZnNldE9mRXhpc3RpbmdCdWZmZXIgKyBhY2Nlc3Nvci5ieXRlT2Zmc2V0SW5CdWZmZXIpIC8gNCAvIDQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBlbGVtZW50TnVtVG9Db3B5ID0gbW9ycGhVbmlmb3JtRGF0YU9mZnNldHNbbW9ycGhVbmlmb3JtRGF0YU9mZnNldHMubGVuZ3RoIC0gMV07XG4gICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LnVwZGF0ZVVuaWZvcm1Nb3JwaE9mZnNldHNCdWZmZXIodGhpcy5fX3VuaWZvcm1Nb3JwaE9mZnNldHNUeXBlZEFycmF5ISwgZWxlbWVudE51bVRvQ29weSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB1bmlmb3JtIGJ1ZmZlcnMgY29udGFpbmluZyBtb3JwaCB0YXJnZXQgd2VpZ2h0cyBmb3IgYmxlbmQgc2hhcGUgYW5pbWF0aW9uLlxuICAgKiBDb3BpZXMgd2VpZ2h0IHZhbHVlcyBmcm9tIGJsZW5kIHNoYXBlIGNvbXBvbmVudHMgdG8gR1BVLWFjY2Vzc2libGUgdW5pZm9ybSBidWZmZXJzLlxuICAgKi9cbiAgcHJpdmF0ZSBfX3VwZGF0ZU1vcnBoV2VpZ2h0c1VuaWZvcm1CdWZmZXIoKSB7XG4gICAgY29uc3QgbWVtb3J5TWFuYWdlciA9IHRoaXMuX19lbmdpbmUubWVtb3J5TWFuYWdlcjtcbiAgICBjb25zdCBibGVuZFNoYXBlRGF0YUJ1ZmZlcjogQnVmZmVyIHwgdW5kZWZpbmVkID0gbWVtb3J5TWFuYWdlci5nZXRCdWZmZXIoQnVmZmVyVXNlLkdQVVZlcnRleERhdGEpO1xuICAgIGlmIChibGVuZFNoYXBlRGF0YUJ1ZmZlciA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChibGVuZFNoYXBlRGF0YUJ1ZmZlci50YWtlblNpemVJbkJ5dGUgPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBibGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzID0gQmxlbmRTaGFwZUNvbXBvbmVudC5nZXRPZmZzZXRzSW5Vbmlmb3JtKHRoaXMuX19lbmdpbmUpO1xuICAgIGNvbnN0IGJsZW5kU2hhcGVDb21wb25lbnRzID0gdGhpcy5fX2VuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudHNXaXRoVHlwZVdpdGhvdXRGaWx0ZXJpbmcoXG4gICAgICBCbGVuZFNoYXBlQ29tcG9uZW50XG4gICAgKSBhcyAoQmxlbmRTaGFwZUNvbXBvbmVudCB8IHVuZGVmaW5lZClbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJsZW5kU2hhcGVDb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBibGVuZFNoYXBlQ29tcG9uZW50ID0gYmxlbmRTaGFwZUNvbXBvbmVudHNbaV07XG4gICAgICBjb25zdCB3ZWlnaHRzID0gYmxlbmRTaGFwZUNvbXBvbmVudCAhPSBudWxsID8gYmxlbmRTaGFwZUNvbXBvbmVudCEud2VpZ2h0cyA6IFtdO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB3ZWlnaHRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIHRoaXMuX191bmlmb3JtTW9ycGhXZWlnaHRzVHlwZWRBcnJheSFbYmxlbmRTaGFwZVVuaWZvcm1EYXRhT2Zmc2V0c1tpXSArIGpdID0gd2VpZ2h0c1tqXTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGJsZW5kU2hhcGVDb21wb25lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgICAgY29uc3QgZWxlbWVudE51bVRvQ29weSA9IGJsZW5kU2hhcGVVbmlmb3JtRGF0YU9mZnNldHNbYmxlbmRTaGFwZVVuaWZvcm1EYXRhT2Zmc2V0cy5sZW5ndGggLSAxXTtcbiAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS51cGRhdGVVbmlmb3JtTW9ycGhXZWlnaHRzQnVmZmVyKHRoaXMuX191bmlmb3JtTW9ycGhXZWlnaHRzVHlwZWRBcnJheSEsIGVsZW1lbnROdW1Ub0NvcHkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIHRoZSBhcHByb3ByaWF0ZSBjYW1lcmEgY29tcG9uZW50IFNJRCBmb3IgdGhlIGN1cnJlbnQgcmVuZGVyaW5nIGNvbnRleHQuXG4gICAqIEhhbmRsZXMgYm90aCBWUiBhbmQgbm9uLVZSIHJlbmRlcmluZyBzY2VuYXJpb3MsIGluY2x1ZGluZyBtdWx0aS12aWV3IHN0ZXJlbyByZW5kZXJpbmcuXG4gICAqXG4gICAqIEBwYXJhbSByZW5kZXJQYXNzIC0gVGhlIGN1cnJlbnQgcmVuZGVyIHBhc3NcbiAgICogQHBhcmFtIGRpc3BsYXlJZHggLSBEaXNwbGF5IGluZGV4IGZvciBzdGVyZW8gcmVuZGVyaW5nICgwIGZvciBsZWZ0IGV5ZSwgMSBmb3IgcmlnaHQgZXllKVxuICAgKiBAcGFyYW0gaXNWUk1haW5QYXNzIC0gV2hldGhlciB0aGlzIGlzIGEgVlIgbWFpbiByZW5kZXJpbmcgcGFzc1xuICAgKiBAcmV0dXJucyBUaGUgY29tcG9uZW50IFNJRCBvZiB0aGUgYXBwcm9wcmlhdGUgY2FtZXJhLCBvciAtMSBpZiBubyBjYW1lcmEgaXMgYXZhaWxhYmxlXG4gICAqL1xuICBwcml2YXRlIF9fZ2V0QXBwcm9wcmlhdGVDYW1lcmFDb21wb25lbnRTSUQocmVuZGVyUGFzczogUmVuZGVyUGFzcywgZGlzcGxheUlkeDogMCB8IDEsIGlzVlJNYWluUGFzczogYm9vbGVhbik6IG51bWJlciB7XG4gICAgaWYgKGlzVlJNYWluUGFzcykge1xuICAgICAgY29uc3Qgd2VieHJTeXN0ZW0gPSB0aGlzLl9fZW5naW5lLl93ZWJYUlN5c3RlbUlmRW5hYmxlZDtcbiAgICAgIGxldCBjYW1lcmFDb21wb25lbnRTaWQgPSAtMTtcbiAgICAgIGlmICh3ZWJ4clN5c3RlbT8uaXNXZWJYUk1vZGUpIHtcbiAgICAgICAgaWYgKHdlYnhyU3lzdGVtLmlzTXVsdGlWaWV3KCkpIHtcbiAgICAgICAgICBjYW1lcmFDb21wb25lbnRTaWQgPSB3ZWJ4clN5c3RlbS5fZ2V0Q2FtZXJhQ29tcG9uZW50U0lEQXQoMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2FtZXJhQ29tcG9uZW50U2lkID0gd2VieHJTeXN0ZW0uX2dldENhbWVyYUNvbXBvbmVudFNJREF0KGRpc3BsYXlJZHgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gY2FtZXJhQ29tcG9uZW50U2lkO1xuICAgIH1cbiAgICAvLyBOb24tVlIgUmVuZGVyaW5nXG4gICAgbGV0IGNhbWVyYUNvbXBvbmVudCA9IHJlbmRlclBhc3MuY2FtZXJhQ29tcG9uZW50O1xuICAgIGlmIChjYW1lcmFDb21wb25lbnQgPT0gbnVsbCkge1xuICAgICAgLy8gaWYgdGhlIHJlbmRlclBhc3MgaGFzIG5vIGNhbWVyYUNvbXBvbmVudCwgdHJ5IHRvIGdldCB0aGUgY3VycmVudCBjYW1lcmFDb21wb25lbnRcbiAgICAgIGNhbWVyYUNvbXBvbmVudCA9IHRoaXMuX19lbmdpbmUuY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnQoXG4gICAgICAgIENhbWVyYUNvbXBvbmVudCxcbiAgICAgICAgQ2FtZXJhQ29tcG9uZW50LmdldEN1cnJlbnQodGhpcy5fX2VuZ2luZSlcbiAgICAgICkgYXMgQ2FtZXJhQ29tcG9uZW50O1xuICAgIH1cbiAgICBpZiAoY2FtZXJhQ29tcG9uZW50KSB7XG4gICAgICByZXR1cm4gY2FtZXJhQ29tcG9uZW50LmNvbXBvbmVudFNJRDtcbiAgICB9XG4gICAgcmV0dXJuIC0xO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFsbCBHUFUgcmVzb3VyY2VzIGhlbGQgYnkgdGhpcyBzdHJhdGVneS5cbiAgICogU2hvdWxkIGJlIGNhbGxlZCB3aGVuIHRoZSBlbmdpbmUgaXMgYmVpbmcgZGVzdHJveWVkLlxuICAgKi9cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBjb25zdCB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYkdwdVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICB0aGlzLl9fbGlnaHRDbHVzdGVyQnVpbGRlcj8uZGVzdHJveSgpO1xuICAgIHRoaXMuX19saWdodENsdXN0ZXJCdWlsZGVyID0gdW5kZWZpbmVkO1xuICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5fZGVzdHJveUdwdUN1bGxpbmcoKTtcbiAgICBpZiAodGhpcy5fX3N0b3JhZ2VCdWZmZXJVaWQgIT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkKSB7XG4gICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuZGVzdHJveVN0b3JhZ2VCdWZmZXIodGhpcy5fX3N0b3JhZ2VCdWZmZXJVaWQpO1xuICAgICAgdGhpcy5fX3N0b3JhZ2VCdWZmZXJVaWQgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX19zdG9yYWdlQmxlbmRTaGFwZUJ1ZmZlclVpZCAhPT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQpIHtcbiAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5kZWxldGVTdG9yYWdlQmxlbmRTaGFwZUJ1ZmZlcih0aGlzLl9fc3RvcmFnZUJsZW5kU2hhcGVCdWZmZXJVaWQpO1xuICAgICAgdGhpcy5fX3N0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyVWlkID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gICAgfVxuICAgIGlmICh0aGlzLl9fbW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlclVpZCAhPT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQpIHtcbiAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5kZWxldGVVbmlmb3JtQnVmZmVyKHRoaXMuX19tb3JwaE9mZnNldHNVbmlmb3JtQnVmZmVyVWlkKTtcbiAgICAgIHRoaXMuX19tb3JwaE9mZnNldHNVbmlmb3JtQnVmZmVyVWlkID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gICAgfVxuICAgIGlmICh0aGlzLl9fbW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlclVpZCAhPT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQpIHtcbiAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5kZWxldGVVbmlmb3JtQnVmZmVyKHRoaXMuX19tb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyVWlkKTtcbiAgICAgIHRoaXMuX19tb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyVWlkID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gICAgfVxuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQUEsU0FBUywwQkFBMEI7QUFDbkMsU0FBUywyQkFBMkI7QUFDcEMsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxpQ0FBaUM7QUFDMUMsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUywyQkFBMkI7QUFDcEMsU0FBUywwQkFBMEI7QUFDbkMsU0FBUyxpQkFBa0M7QUFDM0MsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyx1QkFBdUI7QUFPaEMsU0FBUyxrQkFBdUM7QUFDaEQsU0FB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
