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
    this.aK = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.bK = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.BE = true;
    this.ME = -1;
    this.NE = -1;
    this.Mc = -1;
    this.OE = -1;
    this.dK = -1;
    this.Lc = -1;
    this.QE = -1;
    this.YA = -1;
    this.Nc = -1;
    this.KE = -1;
    this.LE = -1;
    this.RE = -1;
    this.CE = -1;
    this.SE = -1;
    this.iE = -1;
    this.jE = -1;
    this.eK = -1;
    this.TE = -1;
    this.c = engine;
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
  static kF(engine) {
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
    const previousMorphedPositionStr = engine._isPreviousMorphWeightsEnabled ? `
    fn get_previousMorphedPosition(vertexId: u32, basePosition: vec3<f32>, blendShapeComponentSID: u32) -> vec3<f32> {
      let currentPrimitiveIdx = uniformDrawParameters.currentPrimitiveIdx;
      let offsetInUniform = rnMorphUniformDataOffsets[currentPrimitiveIdx];
      let offsetInUniform2 = rnBlendShapeUniformDataOffsets[blendShapeComponentSID] + ${BlendShapeComponent._getPreviousMorphWeightsOffset(engine)}u;
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
        position += addPos * morphWeights[idx2 % 4u];
      }
      return position;
    }` : "";
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
    ${previousMorphedPositionStr}
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
  static lF(engine, info) {
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
  static mF(engine, materialTypeName, info) {
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
    this.nF();
  }
  nF() {
    const morphUniformDataOffsets = Primitive.getMorphUniformDataOffsets();
    const morphOffsetsUniformDataSize = Math.max(
      Math.ceil(morphUniformDataOffsets[morphUniformDataOffsets.length - 1] / 4) * 4 * 4,
      4
    );
    if (morphOffsetsUniformDataSize !== this.CE) {
      const webGpuResourceRepository = this.c.webGpuResourceRepository;
      if (this.iE !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        webGpuResourceRepository.flush();
        webGpuResourceRepository.clearCache();
        webGpuResourceRepository.deleteUniformBuffer(this.iE);
        this.iE = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      }
      this.CE = morphOffsetsUniformDataSize;
      if (this.iE === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        const inputArrayOffsets = new Uint32Array(morphOffsetsUniformDataSize);
        this.AE = inputArrayOffsets;
        this.iE = webGpuResourceRepository.createUniformMorphOffsetsBuffer(
          morphOffsetsUniformDataSize * 4
        );
        this.fK();
      }
      this.CE = morphOffsetsUniformDataSize;
    }
    const blendShapeWeightsUniformDataSize = BlendShapeComponent._getMorphWeightsUniformBufferFloatCount(this.c);
    if (blendShapeWeightsUniformDataSize !== this.SE) {
      const webGpuResourceRepository = this.c.webGpuResourceRepository;
      if (this.jE !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        webGpuResourceRepository.flush();
        webGpuResourceRepository.clearCache();
        webGpuResourceRepository.deleteUniformBuffer(this.jE);
        this.jE = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      }
      if (this.jE === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        const inputArrayWeights = new Float32Array(blendShapeWeightsUniformDataSize);
        this.nE = inputArrayWeights;
        this.jE = webGpuResourceRepository.createUniformMorphWeightsBuffer(
          blendShapeWeightsUniformDataSize * 4
        );
        this.WE(true);
      }
      this.SE = blendShapeWeightsUniformDataSize;
    }
  }
  /**
   * Sets up shader programs for all primitives in the given mesh component.
   * Iterates through all primitives and ensures their materials have proper shader programs.
   *
   * @param meshComponent - The mesh component containing primitives to setup
   */
  lK(meshComponent) {
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
        _WebGpuStrategyBasic.getVertexShaderMethodDefinitions_storageBuffer(this.c, ShaderType.VertexShader),
        _WebGpuStrategyBasic.getVertexShaderMethodDefinitions_storageBuffer(this.c, ShaderType.PixelShader),
        _WebGpuStrategyBasic.lF,
        _WebGpuStrategyBasic.mF,
        _WebGpuStrategyBasic.kF(this.c)
      );
      primitive._backupMaterial();
    } catch (e) {
      Logger.default.error(e);
      primitive._restoreMaterial();
      this.setupShaderForMaterial(
        primitive.material,
        primitive,
        _WebGpuStrategyBasic.getVertexShaderMethodDefinitions_storageBuffer(this.c, ShaderType.VertexShader),
        _WebGpuStrategyBasic.getVertexShaderMethodDefinitions_storageBuffer(this.c, ShaderType.PixelShader),
        _WebGpuStrategyBasic.lF,
        _WebGpuStrategyBasic.mF,
        _WebGpuStrategyBasic.kF(this.c)
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
      this.c,
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
    if (AnimationComponent.getIsAnimating(this.c) || TransformComponent.getUpdateCount(this.c) !== this.Lc || SceneGraphComponent.getUpdateCount(this.c) !== this.QE || CameraComponent.getCurrentCameraUpdateCount(this.c) !== this.YA || _getCameraControllerUpdateCount(this.c) !== this.Nc || this.c.materialRepository.stateVersion !== this.ME || this.c.lightClusterSystem.dataVersion !== this.NE || LightComponent.getUpdateCount(this.c) !== this.Mc || this.c._gpuInstanceDataVersion !== this.OE) {
      const isStorageBufferRecreated = this.hK();
      this.c.webGpuResourceRepository._markGpuCullingInputsDirty();
      const lightClusterDataVersion = this.c.lightClusterSystem.dataVersion;
      if (isStorageBufferRecreated || lightClusterDataVersion !== this.dK) {
        this.iK();
        this.dK = lightClusterDataVersion;
      }
      this.Lc = TransformComponent.getUpdateCount(this.c);
      this.QE = SceneGraphComponent.getUpdateCount(this.c);
      this.YA = CameraComponent.getCurrentCameraUpdateCount(this.c);
      this.Nc = _getCameraControllerUpdateCount(this.c);
      this.ME = this.c.materialRepository.stateVersion;
      this.NE = this.c.lightClusterSystem.dataVersion;
      this.Mc = LightComponent.getUpdateCount(this.c);
      this.OE = this.c._gpuInstanceDataVersion;
    }
    const morphMaxIndex = Primitive.getPrimitiveCountHasMorph();
    if (morphMaxIndex !== this.LE) {
      this.jK();
      this.LE = morphMaxIndex;
      this.c.webGpuResourceRepository._markGpuCullingInputsDirty();
    }
    if (BlendShapeComponent.updateCount !== this.KE || BlendShapeComponent.getCountOfBlendShapeComponents(this.c) !== this.TE) {
      this.WE();
      this.c.webGpuResourceRepository._markGpuCullingInputsDirty();
      this.KE = BlendShapeComponent.updateCount;
      this.TE = BlendShapeComponent.getCountOfBlendShapeComponents(this.c);
      this.c.materialRepository._makeShaderInvalidateToMorphMaterials();
    } else {
      this.sF();
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
      this.vF(renderPass);
      return true;
    }
    let renderedSomething = false;
    const isZWrite = renderPass.isDepthTest && renderPass.depthWriteMask;
    const useDepthPrepass = this.kK(renderPass);
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
  vF(renderPass) {
    const material = renderPass.material;
    const primitive = renderPass._dummyPrimitiveForBufferLessRendering;
    this._setupShaderProgram(material, primitive);
    const webGpuResourceRepository = this.c.webGpuResourceRepository;
    const cameraSID = this.gK(renderPass, 0, false);
    webGpuResourceRepository.setDrawParameters(material.materialSID, cameraSID, 0, 0);
    const isZWrite = renderPass.isDepthTest && renderPass.depthWriteMask;
    webGpuResourceRepository.draw(this.c, primitive, material, renderPass, cameraSID, isZWrite, 0);
  }
  /**
   * Whether the depth prepass can run for the render pass: it must be enabled, draw the scene itself (render passes
   * with a material override such as shadow maps and post effects are excluded), and write depth.
   */
  kK(renderPass) {
    const framebuffer = renderPass.getFramebuffer();
    return this.c.config.isDepthPrepassEnabled && renderPass.material == null && renderPass.isDepthTest && renderPass.depthWriteMask && (framebuffer == null || framebuffer.depthAttachment != null) && renderPass._toRenderOpaquePrimitives && renderPass._lastOpaqueIndex >= 0;
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
    const webGpuResourceRepository = this.c.webGpuResourceRepository;
    const webxrSystem = this.c._webXRSystemIfEnabled;
    const cameraSID = this.gK(
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
      this.c,
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
  hK() {
    const memoryManager = this.c.memoryManager;
    const gpuInstanceDataBuffers = memoryManager.getBuffers(BufferUse.GPUInstanceData);
    const gpuInstanceDataBufferCount = gpuInstanceDataBuffers.length;
    const webGpuResourceRepository = this.c.webGpuResourceRepository;
    if (gpuInstanceDataBufferCount !== this.RE) {
      this.RE = gpuInstanceDataBufferCount;
      webGpuResourceRepository.destroyStorageBuffer(this.aK);
      this.aK = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
    if (this.aK !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const lightClusterSystem = this.c.lightClusterSystem;
      webGpuResourceRepository.updateStorageBuffer(
        this.aK,
        gpuInstanceDataBuffers,
        lightClusterSystem._getExcludedByteRanges()
      );
      const dirtyRanges = lightClusterSystem._takeDirtyByteRanges();
      if (dirtyRanges.length > 0) {
        webGpuResourceRepository.updateStorageBufferRanges(
          this.aK,
          gpuInstanceDataBuffers,
          dirtyRanges
        );
      }
      return false;
    }
    this.aK = webGpuResourceRepository.createStorageBuffer(gpuInstanceDataBuffers);
    this.c.lightClusterSystem._takeDirtyByteRanges();
    return true;
  }
  /**
   * Builds the Clustered Forward light cluster tables with compute shaders when the LightClusterSystem
   * builds them on the GPU. It must run after every upload of the GPU instance data, which overwrites the tables.
   */
  iK() {
    var _a, _b;
    const params = this.c.lightClusterSystem._getGpuBuildParams();
    if (params == null) {
      return;
    }
    const webGpuResourceRepository = this.c.webGpuResourceRepository;
    const storageBuffer = webGpuResourceRepository._getStorageBuffer();
    if (storageBuffer == null) {
      return;
    }
    (_b = this[_a = "cK"]) != null ? _b : this[_a] = new WebGpuLightClusterBuilder(
      webGpuResourceRepository.getWebGpuDeviceWrapper().gpuDevice
    );
    const gpuTimer = this.c.gpuTimerEnabled ? webGpuResourceRepository._getGpuTimer() : void 0;
    this.cK.build(storageBuffer, params, gpuTimer);
  }
  /**
   * Creates or updates the storage buffer containing blend shape vertex data.
   * This buffer holds morph target positions and other vertex attributes needed for blend shape animation.
   */
  jK() {
    const memoryManager = this.c.memoryManager;
    const blendShapeDataBuffers = memoryManager.getBuffers(BufferUse.GPUVertexData);
    if (blendShapeDataBuffers.length === 0) {
      return;
    }
    const blendShapeDataBufferByteLength = blendShapeDataBuffers.reduce((acc, buffer) => acc + buffer.byteLength, 0);
    if (blendShapeDataBufferByteLength !== this.eK) {
      this.c.webGpuResourceRepository.deleteStorageBlendShapeBuffer(this.bK);
      this.bK = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      this.eK = blendShapeDataBufferByteLength;
    }
    const webGpuResourceRepository = this.c.webGpuResourceRepository;
    const float32Array = new Float32Array(blendShapeDataBufferByteLength / 4);
    let offset = 0;
    for (let i = 0; i < blendShapeDataBuffers.length; i++) {
      const buffer = blendShapeDataBuffers[i];
      float32Array.set(new Float32Array(buffer.getArrayBuffer()), offset);
      offset += buffer.byteLength / 4;
    }
    if (this.bK !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const componentSizeForDataTexture = blendShapeDataBufferByteLength / 4;
      webGpuResourceRepository.updateStorageBlendShapeBuffer(
        this.bK,
        float32Array,
        componentSizeForDataTexture
      );
    } else {
      this.bK = webGpuResourceRepository.createStorageBlendShapeBuffer(float32Array);
    }
    this.fK();
  }
  fK() {
    const webGpuResourceRepository = this.c.webGpuResourceRepository;
    const morphUniformDataOffsets = Primitive.getMorphUniformDataOffsets();
    for (let i = 0; i < Primitive.getPrimitiveCountHasMorph(); i++) {
      const primitive = Primitive.getPrimitiveHasMorph(i);
      if (primitive != null) {
        for (let j = 0; j < primitive.targets.length; j++) {
          const target = primitive.targets[j];
          const accessor = target.get(VertexAttribute.Position.XYZ);
          const byteOffsetOfExistingBuffer = this.c.memoryManager.getByteOffsetOfExistingBuffers(
            BufferUse.GPUVertexData,
            accessor.bufferView.buffer.indexOfTheBufferUsage
          );
          this.AE[morphUniformDataOffsets[i] + j] = (byteOffsetOfExistingBuffer + accessor.byteOffsetInBuffer) / 4 / 4;
        }
      } else {
        break;
      }
    }
    const elementNumToCopy = morphUniformDataOffsets[morphUniformDataOffsets.length - 1];
    webGpuResourceRepository.updateUniformMorphOffsetsBuffer(this.AE, elementNumToCopy);
  }
  /**
   * Updates uniform buffers containing morph target weights for blend shape animation.
   * Copies weight values from blend shape components to GPU-accessible uniform buffers.
   */
  WE(isNewBuffer = false) {
    const memoryManager = this.c.memoryManager;
    const blendShapeDataBuffer = memoryManager.getBuffer(BufferUse.GPUVertexData);
    if (blendShapeDataBuffer == null) {
      return;
    }
    if (blendShapeDataBuffer.takenSizeInByte === 0) {
      return;
    }
    const elementNumToCopy = BlendShapeComponent._writeMorphWeightsUniformArray(
      this.c,
      this.nE,
      isNewBuffer
    );
    this.BE = false;
    if (elementNumToCopy > 0) {
      this.YE(elementNumToCopy);
    }
  }
  YE(elementNumToCopy) {
    this.c.webGpuResourceRepository.updateUniformMorphWeightsBuffer(
      this.nE,
      elementNumToCopy
    );
  }
  /**
   * Makes the weights of the previous frame in the morph weights uniform buffer equal to the current weights once
   * the weights stopped changing (temporal anti-aliasing only).
   */
  sF() {
    if (this.BE || this.nE == null) {
      return;
    }
    this.BE = true;
    const elementNumToCopy = BlendShapeComponent._settlePreviousMorphWeights(
      this.c,
      this.nE
    );
    if (elementNumToCopy > 0) {
      this.YE(elementNumToCopy);
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
  gK(renderPass, displayIdx, isVRMainPass) {
    if (isVRMainPass) {
      const webxrSystem = this.c._webXRSystemIfEnabled;
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
      cameraComponent = this.c.componentRepository.getComponent(
        CameraComponent,
        CameraComponent.getCurrent(this.c)
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
    const webGpuResourceRepository = this.c.webGpuResourceRepository;
    (_a = this.cK) == null ? void 0 : _a.destroy();
    this.cK = void 0;
    webGpuResourceRepository._destroyGpuCulling();
    if (this.aK !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      webGpuResourceRepository.destroyStorageBuffer(this.aK);
      this.aK = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
    if (this.bK !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      webGpuResourceRepository.deleteStorageBlendShapeBuffer(this.bK);
      this.bK = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
    if (this.iE !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      webGpuResourceRepository.deleteUniformBuffer(this.iE);
      this.iE = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
    if (this.jE !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      webGpuResourceRepository.deleteUniformBuffer(this.jE);
      this.jE = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
  }
};
export {
  WebGpuStrategyBasic
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3JjL3dlYmdwdS9XZWJHcHVTdHJhdGVneUJhc2ljLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBBbmltYXRpb25Db21wb25lbnQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvbXBvbmVudHMvQW5pbWF0aW9uL0FuaW1hdGlvbkNvbXBvbmVudCc7XG5pbXBvcnQgeyBCbGVuZFNoYXBlQ29tcG9uZW50IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb21wb25lbnRzL0JsZW5kU2hhcGUvQmxlbmRTaGFwZUNvbXBvbmVudCc7XG5pbXBvcnQgeyBDYW1lcmFDb21wb25lbnQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvbXBvbmVudHMvQ2FtZXJhL0NhbWVyYUNvbXBvbmVudCc7XG5pbXBvcnQgeyBfZ2V0Q2FtZXJhQ29udHJvbGxlclVwZGF0ZUNvdW50IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb21wb25lbnRzL0NhbWVyYUNvbnRyb2xsZXIvQ2FtZXJhQ29udHJvbGxlclVwZGF0ZUNvdW50JztcbmltcG9ydCB7IExpZ2h0Q29tcG9uZW50IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb21wb25lbnRzL0xpZ2h0L0xpZ2h0Q29tcG9uZW50JztcbmltcG9ydCB7IE1lc2hDb21wb25lbnQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvbXBvbmVudHMvTWVzaC9NZXNoQ29tcG9uZW50JztcbmltcG9ydCB7IFNjZW5lR3JhcGhDb21wb25lbnQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvbXBvbmVudHMvU2NlbmVHcmFwaC9TY2VuZUdyYXBoQ29tcG9uZW50JztcbmltcG9ydCB7IFRyYW5zZm9ybUNvbXBvbmVudCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29tcG9uZW50cy9UcmFuc2Zvcm0vVHJhbnNmb3JtQ29tcG9uZW50JztcbmltcG9ydCB7IENvbXBvbmVudCwgdHlwZSBNZW1iZXJJbmZvIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb3JlL0NvbXBvbmVudCc7XG5pbXBvcnQgeyBBbHBoYU1vZGUgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL0FscGhhTW9kZSc7XG5pbXBvcnQgeyBCdWZmZXJVc2UgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL0J1ZmZlclVzZSc7XG5pbXBvcnQgeyBDb21wb25lbnRUeXBlIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9Db21wb25lbnRUeXBlJztcbmltcG9ydCB7IENvbXBvc2l0aW9uVHlwZSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvQ29tcG9zaXRpb25UeXBlJztcbmltcG9ydCB0eXBlIHtcbiAgZ2V0U2hhZGVyUHJvcGVydHlGdW5jT2ZHbG9iYWxEYXRhUmVwb3NpdG9yeSxcbiAgZ2V0U2hhZGVyUHJvcGVydHlGdW5jT2ZNYXRlcmlhbCxcbiAgU2hhZGVyU2VtYW50aWNzTmFtZSxcbn0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9TaGFkZXJTZW1hbnRpY3MnO1xuaW1wb3J0IHR5cGUgeyBTaGFkZXJTZW1hbnRpY3NJbmZvIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9TaGFkZXJTZW1hbnRpY3NJbmZvJztcbmltcG9ydCB7IFNoYWRlclR5cGUsIHR5cGUgU2hhZGVyVHlwZUVudW0gfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1NoYWRlclR5cGUnO1xuaW1wb3J0IHsgVmVydGV4QXR0cmlidXRlIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9WZXJ0ZXhBdHRyaWJ1dGUnO1xuaW1wb3J0IHsgUHJpbWl0aXZlIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9nZW9tZXRyeS9QcmltaXRpdmUnO1xuaW1wb3J0IHsgZ2V0VGV4dHVyZUFuZFNhbXBsZXJOYW1lcyB9IGZyb20gJy4uL2ZvdW5kYXRpb24vaGVscGVycy9TaGFkZXJIZWxwZXInO1xuaW1wb3J0IHR5cGUgeyBNYXRlcmlhbCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWF0ZXJpYWxzL2NvcmUvTWF0ZXJpYWwnO1xuaW1wb3J0IHR5cGUgeyBBY2Nlc3NvciB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWVtb3J5L0FjY2Vzc29yJztcbmltcG9ydCB0eXBlIHsgQnVmZmVyIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9tZW1vcnkvQnVmZmVyJztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHsgQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkgfSBmcm9tICcuLi9mb3VuZGF0aW9uL3JlbmRlcmVyL0NHQVBJUmVzb3VyY2VSZXBvc2l0b3J5JztcbmltcG9ydCB0eXBlIHsgQ0dBUElTdHJhdGVneSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vcmVuZGVyZXIvQ0dBUElTdHJhdGVneSc7XG5pbXBvcnQgeyBpc1NraXBEcmF3aW5nIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9yZW5kZXJlci9SZW5kZXJpbmdDb21tb25NZXRob2RzJztcbmltcG9ydCB0eXBlIHsgUmVuZGVyUGFzcyB9IGZyb20gJy4uL2ZvdW5kYXRpb24vcmVuZGVyZXIvUmVuZGVyUGFzcyc7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgdHlwZSB7XG4gIENHQVBJUmVzb3VyY2VIYW5kbGUsXG4gIENvdW50LFxuICBJbmRleCxcbiAgSW5kZXhPZjRCeXRlcyxcbiAgSW5kZXhPZjE2Qnl0ZXMsXG4gIFByaW1pdGl2ZVVJRCxcbn0gZnJvbSAnLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgV2ViR3B1TGlnaHRDbHVzdGVyQnVpbGRlciB9IGZyb20gJy4vV2ViR3B1TGlnaHRDbHVzdGVyQnVpbGRlcic7XG5cbi8qKlxuICogQmFzaWMgV2ViR1BVIHJlbmRlcmluZyBzdHJhdGVneSBpbXBsZW1lbnRhdGlvbiB0aGF0IGhhbmRsZXMgbWVzaCByZW5kZXJpbmcsXG4gKiBzdG9yYWdlIGJ1ZmZlciBtYW5hZ2VtZW50LCBhbmQgc2hhZGVyIHByb2dyYW0gc2V0dXAgZm9yIFdlYkdQVS1iYXNlZCByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKlxuICogVGhpcyBjbGFzcyBwcm92aWRlcyBhIGNvbXBsZXRlIHJlbmRlcmluZyBzb2x1dGlvbiB1c2luZyBXZWJHUFUgQVBJLCBpbmNsdWRpbmc6XG4gKiAtIFN0b3JhZ2UgYnVmZmVyIG1hbmFnZW1lbnQgZm9yIGVmZmljaWVudCBHUFUgZGF0YSB0cmFuc2ZlclxuICogLSBTaGFkZXIgcHJvZ3JhbSBjb21waWxhdGlvbiBhbmQgc2V0dXBcbiAqIC0gTW9ycGggdGFyZ2V0IGFuZCBibGVuZCBzaGFwZSBoYW5kbGluZ1xuICogLSBDYW1lcmEgYW5kIHRyYW5zZm9ybSBtYXRyaXggdXBkYXRlc1xuICogLSBSZW5kZXIgcGFzcyBleGVjdXRpb24gd2l0aCBwcm9wZXIgcHJpbWl0aXZlIHNvcnRpbmdcbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogY29uc3Qgc3RyYXRlZ3kgPSBXZWJHcHVTdHJhdGVneUJhc2ljLmdldEluc3RhbmNlKCk7XG4gKiBzdHJhdGVneS5wcmVyZW5kZXIoKTtcbiAqIHN0cmF0ZWd5LmNvbW1vbl8kcmVuZGVyKHByaW1pdGl2ZVVpZHMsIHJlbmRlclBhc3MsIHRpY2tDb3VudCk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIFdlYkdwdVN0cmF0ZWd5QmFzaWMgaW1wbGVtZW50cyBDR0FQSVN0cmF0ZWd5IHtcbiAgcHJpdmF0ZSBfX2VuZ2luZTogRW5naW5lO1xuICBwcml2YXRlIF9fc3RvcmFnZUJ1ZmZlclVpZDogQ0dBUElSZXNvdXJjZUhhbmRsZSA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICBwcml2YXRlIF9fc3RvcmFnZUJsZW5kU2hhcGVCdWZmZXJVaWQ6IENHQVBJUmVzb3VyY2VIYW5kbGUgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgcHJpdmF0ZSBfX3VuaWZvcm1Nb3JwaE9mZnNldHNUeXBlZEFycmF5PzogVWludDMyQXJyYXk7XG4gIHByaXZhdGUgX191bmlmb3JtTW9ycGhXZWlnaHRzVHlwZWRBcnJheT86IEZsb2F0MzJBcnJheTtcbiAgcHJpdmF0ZSBfX2lzUHJldmlvdXNNb3JwaFdlaWdodHNTZXR0bGVkID0gdHJ1ZTtcblxuICBwcml2YXRlIF9fbGFzdE1hdGVyaWFsc1VwZGF0ZUNvdW50ID0gLTE7XG4gIHByaXZhdGUgX19sYXN0TGlnaHRDbHVzdGVyRGF0YVZlcnNpb24gPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RMaWdodENvbXBvbmVudHNVcGRhdGVDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdEdwdUluc3RhbmNlRGF0YVZlcnNpb24gPSAtMTtcbiAgcHJpdmF0ZSBfX2xpZ2h0Q2x1c3RlckJ1aWxkZXI/OiBXZWJHcHVMaWdodENsdXN0ZXJCdWlsZGVyO1xuICBwcml2YXRlIF9fbGFzdExpZ2h0Q2x1c3RlckJ1aWxkRGF0YVZlcnNpb24gPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RTY2VuZUdyYXBoQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gLTE7XG4gIHByaXZhdGUgX19sYXN0Q2FtZXJhQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gLTE7XG4gIHByaXZhdGUgX19sYXN0Q2FtZXJhQ29udHJvbGxlckNvbXBvbmVudHNVcGRhdGVDb3VudCA9IC0xO1xuXG4gIHByaXZhdGUgX19sYXN0QmxlbmRTaGFwZUNvbXBvbmVudHNVcGRhdGVDb3VudEZvcldlaWdodHMgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RNb3JwaE1heEluZGV4ID0gLTE7XG4gIHByaXZhdGUgX19sYXN0R3B1SW5zdGFuY2VEYXRhQnVmZmVyQ291bnQgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RNb3JwaE9mZnNldHNVbmlmb3JtRGF0YVNpemUgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RNb3JwaFdlaWdodHNVbmlmb3JtRGF0YVNpemUgPSAtMTtcbiAgcHJpdmF0ZSBfX21vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJVaWQgPSAtMTtcbiAgcHJpdmF0ZSBfX21vcnBoV2VpZ2h0c1VuaWZvcm1CdWZmZXJVaWQgPSAtMTtcbiAgcHJpdmF0ZSBfX3N0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyQnl0ZUxlbmd0aCA9IC0xO1xuICBwcml2YXRlIF9fY291bnRPZkJsZW5kU2hhcGVDb21wb25lbnRzID0gLTE7XG5cbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihlbmdpbmU6IEVuZ2luZSkge1xuICAgIHRoaXMuX19lbmdpbmUgPSBlbmdpbmU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc2luZ2xldG9uIGluc3RhbmNlIG9mIFdlYkdwdVN0cmF0ZWd5QmFzaWMuXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2UgaWYgbm9uZSBleGlzdHMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBzaW5nbGV0b24gaW5zdGFuY2Ugb2YgV2ViR3B1U3RyYXRlZ3lCYXNpY1xuICAgKi9cbiAgc3RhdGljIGluaXQoZW5naW5lOiBFbmdpbmUpIHtcbiAgICByZXR1cm4gbmV3IFdlYkdwdVN0cmF0ZWd5QmFzaWMoZW5naW5lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgdmVydGV4IHNoYWRlciBtZXRob2QgZGVmaW5pdGlvbnMgZm9yIHN0b3JhZ2UgYnVmZmVyIGFjY2Vzcy5cbiAgICogVGhlc2UgbWV0aG9kcyBwcm92aWRlIHN0YW5kYXJkaXplZCBhY2Nlc3MgdG8gdHJhbnNmb3JtIG1hdHJpY2VzLCB2aXNpYmlsaXR5IGZsYWdzLFxuICAgKiBhbmQgbW9ycGhpbmcgZnVuY3Rpb25hbGl0eSBpbiB2ZXJ0ZXggc2hhZGVycy5cbiAgICpcbiAgICogQHJldHVybnMgV0dTTCBzaGFkZXIgY29kZSBjb250YWluaW5nIGhlbHBlciBmdW5jdGlvbnMgZm9yIHN0b3JhZ2UgYnVmZmVyIGFjY2Vzc1xuICAgKi9cbiAgc3RhdGljIGdldFZlcnRleFNoYWRlck1ldGhvZERlZmluaXRpb25zX3N0b3JhZ2VCdWZmZXIoZW5naW5lOiBFbmdpbmUsIHNoYWRlclR5cGU6IFNoYWRlclR5cGVFbnVtKSB7XG4gICAgbGV0IHN0ciA9ICcnO1xuICAgIGNvbnN0IG1lbWJlckluZm8gPSBDb21wb25lbnQuZ2V0TWVtYmVySW5mbyhlbmdpbmUpO1xuICAgIG1lbWJlckluZm8uZm9yRWFjaCgobWFwTWVtYmVyTmFtZU1lbWJlckluZm8sIGNvbXBvbmVudENsYXNzKSA9PiB7XG4gICAgICBtYXBNZW1iZXJOYW1lTWVtYmVySW5mby5mb3JFYWNoKChtZW1iZXJJbmZvLCBtZW1iZXJOYW1lKSA9PiB7XG4gICAgICAgIGlmIChtZW1iZXJJbmZvLnNoYWRlclR5cGUgIT09IHNoYWRlclR5cGUgJiYgbWVtYmVySW5mby5zaGFkZXJUeXBlICE9PSBTaGFkZXJUeXBlLlZlcnRleEFuZFBpeGVsU2hhZGVyKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldyA9IENvbXBvbmVudC5nZXRDb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcoZW5naW5lKS5nZXQoY29tcG9uZW50Q2xhc3MpID8/IDE7XG4gICAgICAgIGlmIChDb21wb3NpdGlvblR5cGUuaXNBcnJheShtZW1iZXJJbmZvLmNvbXBvc2l0aW9uVHlwZSkpIHtcbiAgICAgICAgICBwcm9jZXNzRm9yQXJyYXlUeXBlKG1lbWJlckluZm8sIGNvbXBvbmVudENsYXNzLCBtZW1iZXJOYW1lLCBjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHByb2Nlc3NGb3JOb25BcnJheVR5cGUobWVtYmVySW5mbywgY29tcG9uZW50Q2xhc3MsIG1lbWJlck5hbWUsIGNvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHN0cjtcblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NGb3JBcnJheVR5cGUoXG4gICAgICBtZW1iZXJJbmZvOiBNZW1iZXJJbmZvLFxuICAgICAgY29tcG9uZW50Q2xhc3M6IHR5cGVvZiBDb21wb25lbnQsXG4gICAgICBtZW1iZXJOYW1lOiBzdHJpbmcsXG4gICAgICBjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXc6IG51bWJlclxuICAgICkge1xuICAgICAgbGV0IHR5cGVTdHIgPSAnJztcbiAgICAgIGxldCBmZXRjaFR5cGVTdHIgPSAnJztcbiAgICAgIHN3aXRjaCAobWVtYmVySW5mby5jb21wb3NpdGlvblR5cGUpIHtcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjNEFycmF5OlxuICAgICAgICAgIHR5cGVTdHIgPSAndmVjNDxmMzI+JztcbiAgICAgICAgICBmZXRjaFR5cGVTdHIgPSAnZmV0Y2hWZWM0JztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0NEFycmF5OlxuICAgICAgICAgIHR5cGVTdHIgPSAnbWF0NHg0PGYzMj4nO1xuICAgICAgICAgIGZldGNoVHlwZVN0ciA9ICdmZXRjaE1hdDQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQ0eDNBcnJheTpcbiAgICAgICAgICB0eXBlU3RyID0gJ21hdDR4MzxmMzI+JztcbiAgICAgICAgICBmZXRjaFR5cGVTdHIgPSAnZmV0Y2hNYXQ0eDMnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgY29tcG9zaXRpb24gdHlwZTogJHttZW1iZXJJbmZvLmNvbXBvc2l0aW9uVHlwZS5zdHJ9YCk7XG4gICAgICB9XG4gICAgICBjb25zdCB2ZWM0U2l6ZU9mUHJvcGVydHk6IEluZGV4T2YxNkJ5dGVzID0gbWVtYmVySW5mby5jb21wb3NpdGlvblR5cGUuZ2V0VmVjNFNpemVPZlByb3BlcnR5KCk7XG5cbiAgICAgIGlmIChtZW1iZXJJbmZvLmlzVmFyaWFibGVMZW5ndGggPT09IHRydWUpIHtcbiAgICAgICAgLy8gRWFjaCBpbnN0YW5jZSBoYXMgaXRzIG93biBjaHVuay4gSXRzIGxvY2F0aW9uIGlzIHN0b3JlZCBpbiB0aGUgYCR7bWVtYmVyTmFtZX1Mb2NhdGlvbmAgbWVtYmVyLlxuICAgICAgICBjb25zdCByYWRpeCA9IENvbXBvbmVudC5fdmFyaWFibGVMZW5ndGhMb2NhdGlvblJhZGl4O1xuICAgICAgICBzdHIgKz0gYFxuICBmbiBnZXRfJHttZW1iZXJOYW1lfShpbnN0YW5jZUlkOiB1MzIsIGlkeE9mQXJyYXk6IHUzMikgLT4gJHt0eXBlU3RyfSB7XG4gICAgbGV0IGxvY2F0aW9uID0gZ2V0XyR7Q29tcG9uZW50Ll9nZXRWYXJpYWJsZUxlbmd0aExvY2F0aW9uTWVtYmVyTmFtZShtZW1iZXJOYW1lKX0oaW5zdGFuY2VJZCk7XG4gICAgbGV0IGluZGV4OiB1MzIgPSB1MzIobG9jYXRpb24ueCkgKiAke3JhZGl4fXUgKyB1MzIobG9jYXRpb24ueSkgKyAke3ZlYzRTaXplT2ZQcm9wZXJ0eX11ICogaWR4T2ZBcnJheTtcbiAgICBsZXQgdmFsdWUgPSAke2ZldGNoVHlwZVN0cn0oaW5kZXgpO1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICBgO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGxvY2F0aW9uT2Zmc2V0c192ZWM0X2lkeCA9IENvbXBvbmVudC5nZXRMb2NhdGlvbk9mZnNldE9mTWVtYmVyT2ZDb21wb25lbnQoXG4gICAgICAgIGVuZ2luZSxcbiAgICAgICAgY29tcG9uZW50Q2xhc3MsXG4gICAgICAgIG1lbWJlck5hbWVcbiAgICAgICk7XG4gICAgICBjb25zdCBhcnJheUxlbmd0aCA9IENvbXBvbmVudC5nZXRBcnJheUxlbmd0aE9mTWVtYmVyKGVuZ2luZSkuZ2V0KGNvbXBvbmVudENsYXNzKT8uZ2V0KG1lbWJlck5hbWUpID8/IDA7XG4gICAgICBjb25zdCBhcnJheUxlbmd0aFN0ciA9IGBsZXQgYXJyYXlMZW5ndGg6IHUzMiA9ICR7YXJyYXlMZW5ndGh9dTtgO1xuICAgICAgLy8gVGhlIG9mZnNldHMgb2YgdGhlIGJ1ZmZlciB2aWV3cyBhcmUgYSBjb21waWxlLXRpbWUgY29uc3RhbnQuIFRoZXkgbXVzdCBiZSBkZWNsYXJlZCBhdCBtb2R1bGUgc2NvcGU6IGFcbiAgICAgIC8vIHZhcjxmdW5jdGlvbj4gYXJyYXkgaXMgaW5pdGlhbGl6ZWQgb24gZXZlcnkgY2FsbCwgd2hpY2ggaXMgZXhwZW5zaXZlIHdoZW4gYSBzY2VuZSBoYXMgbWFueSBjb21wb25lbnRzIG9mXG4gICAgICAvLyB0aGUgY2xhc3MgKHRoZSB0YWJsZSBoYXMgb25lIGVudHJ5IHBlciBidWZmZXIgdmlldywgaS5lLiBwZXIgY2FtZXJhIGZvciBjYW1lcmFDb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcgMSkuXG4gICAgICBjb25zdCBpbmRpY2VzTmFtZSA9IGBybkluZGljZXNfJHttZW1iZXJOYW1lfWA7XG4gICAgICBjb25zdCBpbmRleFN0ciA9IGAke2luZGljZXNOYW1lfVtpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3c10gKyBpbnN0YW5jZUlkSW5CdWZmZXJWaWV3ICogJHt2ZWM0U2l6ZU9mUHJvcGVydHl9dSAqIGFycmF5TGVuZ3RoICsgJHt2ZWM0U2l6ZU9mUHJvcGVydHl9dSAqIGlkeE9mQXJyYXk7YDsgLy8gdmVjNF9pZHhcbiAgICAgIGxldCBjb252ZXJzaW9uU3RyID0gJyc7XG4gICAgICBpZiAobWVtYmVySW5mby5jb252ZXJ0VG9Cb29sKSB7XG4gICAgICAgIGNvbnZlcnNpb25TdHIgPSAnaWYgKHZhbHVlID4gMC41KSB7IHJldHVybiB0cnVlOyB9IGVsc2UgeyByZXR1cm4gZmFsc2U7IH0nO1xuICAgICAgfVxuICAgICAgc3RyICs9IGBcbiAgY29uc3QgJHtpbmRpY2VzTmFtZX06IGFycmF5PHUzMiwgJHtsb2NhdGlvbk9mZnNldHNfdmVjNF9pZHgubGVuZ3RofT4gPSBhcnJheTx1MzIsICR7bG9jYXRpb25PZmZzZXRzX3ZlYzRfaWR4Lmxlbmd0aH0+KCR7bG9jYXRpb25PZmZzZXRzX3ZlYzRfaWR4Lm1hcChvZmZzZXQgPT4gYCR7b2Zmc2V0fXVgKS5qb2luKCcsICcpfSk7XG4gIGZuIGdldF8ke21lbWJlck5hbWV9KGluc3RhbmNlSWQ6IHUzMiwgaWR4T2ZBcnJheTogdTMyKSAtPiAke21lbWJlckluZm8uY29udmVydFRvQm9vbCA/ICdib29sJyA6IHR5cGVTdHJ9IHtcbiAgICBsZXQgaW5zdGFuY2VJZE9mQnVmZmVyVmlld3MgPSBpbnN0YW5jZUlkIC8gJHtjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXd9O1xuICAgIGxldCBpbnN0YW5jZUlkSW5CdWZmZXJWaWV3ID0gaW5zdGFuY2VJZCAlICR7Y29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3fTtcbiAgICAke2FycmF5TGVuZ3RoU3RyfVxuICAgIGxldCBpbmRleDogdTMyID0gJHtpbmRleFN0cn07XG4gICAgbGV0IHZhbHVlID0gJHtmZXRjaFR5cGVTdHJ9KGluZGV4KTtcbiAgICAke21lbWJlckluZm8uY29udmVydFRvQm9vbCA/IGNvbnZlcnNpb25TdHIgOiAncmV0dXJuIHZhbHVlOyd9XG4gIH1cbiAgYDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzRm9yTm9uQXJyYXlUeXBlKFxuICAgICAgbWVtYmVySW5mbzogTWVtYmVySW5mbyxcbiAgICAgIGNvbXBvbmVudENsYXNzOiB0eXBlb2YgQ29tcG9uZW50LFxuICAgICAgbWVtYmVyTmFtZTogc3RyaW5nLFxuICAgICAgY29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3OiBudW1iZXJcbiAgICApIHtcbiAgICAgIGxldCB0eXBlU3RyID0gJyc7XG4gICAgICBsZXQgZmV0Y2hUeXBlU3RyID0gJyc7XG4gICAgICBzd2l0Y2ggKG1lbWJlckluZm8uY29tcG9zaXRpb25UeXBlKSB7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDQ6XG4gICAgICAgICAgdHlwZVN0ciA9ICdtYXQ0eDQ8ZjMyPic7XG4gICAgICAgICAgZmV0Y2hUeXBlU3RyID0gJ2ZldGNoTWF0NCc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDM6XG4gICAgICAgICAgdHlwZVN0ciA9ICdtYXQzeDM8ZjMyPic7XG4gICAgICAgICAgZmV0Y2hUeXBlU3RyID0gJ2ZldGNoTWF0M05vMTZCeXRlc0FsaWduZWQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWM0OlxuICAgICAgICAgIHR5cGVTdHIgPSAndmVjNDxmMzI+JztcbiAgICAgICAgICBmZXRjaFR5cGVTdHIgPSAnZmV0Y2hWZWM0JztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjMzpcbiAgICAgICAgICB0eXBlU3RyID0gJ3ZlYzM8ZjMyPic7XG4gICAgICAgICAgZmV0Y2hUeXBlU3RyID0gJ2ZldGNoVmVjM05vMTZCeXRlc0FsaWduZWQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5TY2FsYXI6XG4gICAgICAgICAgdHlwZVN0ciA9ICdmMzInO1xuICAgICAgICAgIGZldGNoVHlwZVN0ciA9ICdmZXRjaFNjYWxhck5vMTZCeXRlc0FsaWduZWQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgY29tcG9zaXRpb24gdHlwZTogJHttZW1iZXJJbmZvLmNvbXBvc2l0aW9uVHlwZS5zdHJ9YCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGxvY2F0aW9uT2Zmc2V0cyA9IENvbXBvbmVudC5nZXRMb2NhdGlvbk9mZnNldE9mTWVtYmVyT2ZDb21wb25lbnQoZW5naW5lLCBjb21wb25lbnRDbGFzcywgbWVtYmVyTmFtZSk7XG4gICAgICBjb25zdCBpbmRpY2VzTmFtZSA9IGBybkluZGljZXNfJHttZW1iZXJOYW1lfWA7XG4gICAgICBsZXQgaW5kZXhTdHIgPSAnJztcbiAgICAgIHN3aXRjaCAobWVtYmVySW5mby5jb21wb3NpdGlvblR5cGUpIHtcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0NDpcbiAgICAgICAgICBpbmRleFN0ciA9IGAke2luZGljZXNOYW1lfVtpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3c10gKyA0dSAqIGluc3RhbmNlSWRJbkJ1ZmZlclZpZXc7YDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0MzpcbiAgICAgICAgICBpbmRleFN0ciA9IGAke2luZGljZXNOYW1lfVtpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3c10gKiA0dSArIDl1ICogaW5zdGFuY2VJZEluQnVmZmVyVmlldztgO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWM0OlxuICAgICAgICAgIGluZGV4U3RyID0gYCR7aW5kaWNlc05hbWV9W2luc3RhbmNlSWRPZkJ1ZmZlclZpZXdzXSArIDF1ICogaW5zdGFuY2VJZEluQnVmZmVyVmlldztgO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWMzOlxuICAgICAgICAgIGluZGV4U3RyID0gYCR7aW5kaWNlc05hbWV9W2luc3RhbmNlSWRPZkJ1ZmZlclZpZXdzXSAqIDR1ICsgM3UgKiBpbnN0YW5jZUlkSW5CdWZmZXJWaWV3O2A7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlNjYWxhcjpcbiAgICAgICAgICBpbmRleFN0ciA9IGAke2luZGljZXNOYW1lfVtpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3c10gKiA0dSArIDF1ICogaW5zdGFuY2VJZEluQnVmZmVyVmlldztgO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgY29tcG9zaXRpb24gdHlwZTogJHttZW1iZXJJbmZvLmNvbXBvc2l0aW9uVHlwZS5zdHJ9YCk7XG4gICAgICB9XG4gICAgICBsZXQgY29udmVyc2lvblN0ciA9ICcnO1xuICAgICAgaWYgKG1lbWJlckluZm8uY29udmVydFRvQm9vbCkge1xuICAgICAgICBjb252ZXJzaW9uU3RyID0gJ2lmICh2YWx1ZSA+IDAuNSkgeyByZXR1cm4gdHJ1ZTsgfSBlbHNlIHsgcmV0dXJuIGZhbHNlOyB9JztcbiAgICAgIH1cbiAgICAgIC8vIE1vZHVsZS1zY29wZSBjb25zdCwgZm9yIHRoZSBzYW1lIHJlYXNvbiBhcyBpbiBwcm9jZXNzRm9yQXJyYXlUeXBlLlxuICAgICAgc3RyICs9IGBcbiAgY29uc3QgJHtpbmRpY2VzTmFtZX06IGFycmF5PHUzMiwgJHtsb2NhdGlvbk9mZnNldHMubGVuZ3RofT4gPSBhcnJheTx1MzIsICR7bG9jYXRpb25PZmZzZXRzLmxlbmd0aH0+KCR7bG9jYXRpb25PZmZzZXRzLm1hcChvZmZzZXQgPT4gYCR7b2Zmc2V0fXVgKS5qb2luKCcsICcpfSk7XG4gIGZuIGdldF8ke21lbWJlck5hbWV9KGluc3RhbmNlSWQ6IHUzMikgLT4gJHttZW1iZXJJbmZvLmNvbnZlcnRUb0Jvb2wgPyAnYm9vbCcgOiB0eXBlU3RyfSB7XG4gICAgbGV0IGluc3RhbmNlSWRPZkJ1ZmZlclZpZXdzID0gaW5zdGFuY2VJZCAvICR7Y29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3fTtcbiAgICBsZXQgaW5zdGFuY2VJZEluQnVmZmVyVmlldyA9IGluc3RhbmNlSWQgJSAke2NvbXBvbmVudENvdW50UGVyQnVmZmVyVmlld307XG4gICAgbGV0IGluZGV4OiB1MzIgPSAke2luZGV4U3RyfTtcbiAgICBsZXQgdmFsdWUgPSAke2ZldGNoVHlwZVN0cn0oaW5kZXgpO1xuICAgICR7bWVtYmVySW5mby5jb252ZXJ0VG9Cb29sID8gY29udmVyc2lvblN0ciA6ICdyZXR1cm4gdmFsdWU7J31cbiAgfVxuICBgO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0TW9ycGhlZFBvc2l0aW9uR2V0dGVyKGVuZ2luZTogRW5naW5lKTogc3RyaW5nIHtcbiAgICBjb25zdCBtb3JwaFVuaWZvcm1EYXRhVGFyZ2V0TnVtYmVycyA9IFByaW1pdGl2ZS5nZXRNb3JwaFVuaWZvcm1EYXRhVGFyZ2V0TnVtYmVycygpO1xuICAgIGNvbnN0IG1vcnBoVW5pZm9ybURhdGFUYXJnZXROdW1iZXJzU3RyID0gYFxuICAgIGNvbnN0IHJuTW9ycGhVbmlmb3JtRGF0YVRhcmdldE51bWJlcnM6IGFycmF5PHUzMiwgJHttb3JwaFVuaWZvcm1EYXRhVGFyZ2V0TnVtYmVycy5sZW5ndGh9PiA9IGFycmF5PHUzMiwgJHttb3JwaFVuaWZvcm1EYXRhVGFyZ2V0TnVtYmVycy5sZW5ndGh9Pigke21vcnBoVW5pZm9ybURhdGFUYXJnZXROdW1iZXJzLm1hcChudW0gPT4gYCR7bnVtfXVgKS5qb2luKCcsICcpfSk7XG4gICAgYDtcbiAgICBjb25zdCBtb3JwaFVuaWZvcm1EYXRhT2Zmc2V0cyA9IFByaW1pdGl2ZS5nZXRNb3JwaFVuaWZvcm1EYXRhT2Zmc2V0cygpO1xuICAgIGNvbnN0IG1vcnBoVW5pZm9ybURhdGFPZmZzZXRzU3RyID0gYFxuICAgIGNvbnN0IHJuTW9ycGhVbmlmb3JtRGF0YU9mZnNldHM6IGFycmF5PHUzMiwgJHttb3JwaFVuaWZvcm1EYXRhT2Zmc2V0cy5sZW5ndGh9PiA9IGFycmF5PHUzMiwgJHttb3JwaFVuaWZvcm1EYXRhT2Zmc2V0cy5sZW5ndGh9Pigke21vcnBoVW5pZm9ybURhdGFPZmZzZXRzLm1hcChvZmZzZXQgPT4gYCR7b2Zmc2V0fXVgKS5qb2luKCcsICcpfSk7XG4gICAgYDtcbiAgICBjb25zdCBibGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzID0gQmxlbmRTaGFwZUNvbXBvbmVudC5nZXRPZmZzZXRzSW5Vbmlmb3JtKGVuZ2luZSk7XG4gICAgY29uc3QgYmxlbmRTaGFwZVVuaWZvcm1EYXRhT2Zmc2V0c1N0ciA9IGBcbiAgICBjb25zdCBybkJsZW5kU2hhcGVVbmlmb3JtRGF0YU9mZnNldHM6IGFycmF5PHUzMiwgJHtibGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzLmxlbmd0aH0+ID0gYXJyYXk8dTMyLCAke2JsZW5kU2hhcGVVbmlmb3JtRGF0YU9mZnNldHMubGVuZ3RofT4oJHtibGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzLm1hcChvZmZzZXQgPT4gYCR7b2Zmc2V0fXVgKS5qb2luKCcsICcpfSk7XG4gICAgYDtcblxuICAgIC8vIFRoZSBtb3JwaGVkIHBvc2l0aW9uIHdpdGggdGhlIHdlaWdodHMgb2YgdGhlIHByZXZpb3VzIGZyYW1lIChtb3Rpb24gdmVjdG9ycyBvZiB0ZW1wb3JhbCBhbnRpLWFsaWFzaW5nKS5cbiAgICBjb25zdCBwcmV2aW91c01vcnBoZWRQb3NpdGlvblN0ciA9IGVuZ2luZS5faXNQcmV2aW91c01vcnBoV2VpZ2h0c0VuYWJsZWRcbiAgICAgID8gYFxuICAgIGZuIGdldF9wcmV2aW91c01vcnBoZWRQb3NpdGlvbih2ZXJ0ZXhJZDogdTMyLCBiYXNlUG9zaXRpb246IHZlYzM8ZjMyPiwgYmxlbmRTaGFwZUNvbXBvbmVudFNJRDogdTMyKSAtPiB2ZWMzPGYzMj4ge1xuICAgICAgbGV0IGN1cnJlbnRQcmltaXRpdmVJZHggPSB1bmlmb3JtRHJhd1BhcmFtZXRlcnMuY3VycmVudFByaW1pdGl2ZUlkeDtcbiAgICAgIGxldCBvZmZzZXRJblVuaWZvcm0gPSBybk1vcnBoVW5pZm9ybURhdGFPZmZzZXRzW2N1cnJlbnRQcmltaXRpdmVJZHhdO1xuICAgICAgbGV0IG9mZnNldEluVW5pZm9ybTIgPSBybkJsZW5kU2hhcGVVbmlmb3JtRGF0YU9mZnNldHNbYmxlbmRTaGFwZUNvbXBvbmVudFNJRF0gKyAke0JsZW5kU2hhcGVDb21wb25lbnQuX2dldFByZXZpb3VzTW9ycGhXZWlnaHRzT2Zmc2V0KGVuZ2luZSl9dTtcbiAgICAgIHZhciBwb3NpdGlvbiA9IGJhc2VQb3NpdGlvbjtcbiAgICAgIGxldCBzY2FsYXJfaWR4ID0gM3UgKiB2ZXJ0ZXhJZDtcbiAgICAgIGZvciAodmFyIGk9MHU7IGk8cm5Nb3JwaFVuaWZvcm1EYXRhVGFyZ2V0TnVtYmVyc1tjdXJyZW50UHJpbWl0aXZlSWR4XTsgaSsrKSB7XG4gICAgICAgIGxldCBpZHggPSBvZmZzZXRJblVuaWZvcm0gKyBpO1xuICAgICAgICBsZXQgb2Zmc2V0cyA9IHVuaWZvcm1Nb3JwaE9mZnNldHMuZGF0YVsgaWR4IC8gNHVdO1xuICAgICAgICBsZXQgb2Zmc2V0UG9zaXRpb24gPSBvZmZzZXRzW2lkeCAlIDR1XTtcbiAgICAgICAgbGV0IGJhc2VQb3NJbjRieXRlcyA9IG9mZnNldFBvc2l0aW9uICogNHUgKyBzY2FsYXJfaWR4O1xuICAgICAgICBsZXQgYWRkUG9zID0gZmV0Y2hWZWMzTm8xNkJ5dGVzQWxpZ25lZEZyb21CbGVuZFNoYXBlQnVmZmVyKGJhc2VQb3NJbjRieXRlcyk7XG4gICAgICAgIGxldCBpZHgyID0gb2Zmc2V0SW5Vbmlmb3JtMiArIGk7XG4gICAgICAgIGxldCBtb3JwaFdlaWdodHM6IHZlYzRmID0gdW5pZm9ybU1vcnBoV2VpZ2h0cy5kYXRhWyBpZHgyIC8gNHVdO1xuICAgICAgICBwb3NpdGlvbiArPSBhZGRQb3MgKiBtb3JwaFdlaWdodHNbaWR4MiAlIDR1XTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwb3NpdGlvbjtcbiAgICB9YFxuICAgICAgOiAnJztcbiAgICBjb25zdCBtb3JwaGluZ1N0ciA9IGBcblxuICAgICNpZmRlZiBSTl9JU19WRVJURVhfU0hBREVSXG4gICAgI2lmZGVmIFJOX0lTX01PUlBISU5HXG4gICAgJHttb3JwaFVuaWZvcm1EYXRhVGFyZ2V0TnVtYmVyc1N0cn1cbiAgICAke21vcnBoVW5pZm9ybURhdGFPZmZzZXRzU3RyfVxuICAgICR7YmxlbmRTaGFwZVVuaWZvcm1EYXRhT2Zmc2V0c1N0cn1cbiAgICBmbiBnZXRfcG9zaXRpb24odmVydGV4SWQ6IHUzMiwgYmFzZVBvc2l0aW9uOiB2ZWMzPGYzMj4sIGJsZW5kU2hhcGVDb21wb25lbnRTSUQ6IHUzMikgLT4gdmVjMzxmMzI+IHtcbiAgICAgIGxldCBjdXJyZW50UHJpbWl0aXZlSWR4ID0gdW5pZm9ybURyYXdQYXJhbWV0ZXJzLmN1cnJlbnRQcmltaXRpdmVJZHg7XG4gICAgICBsZXQgb2Zmc2V0SW5Vbmlmb3JtID0gcm5Nb3JwaFVuaWZvcm1EYXRhT2Zmc2V0c1tjdXJyZW50UHJpbWl0aXZlSWR4XTtcbiAgICAgIGxldCBvZmZzZXRJblVuaWZvcm0yID0gcm5CbGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzW2JsZW5kU2hhcGVDb21wb25lbnRTSURdO1xuICAgICAgdmFyIHBvc2l0aW9uID0gYmFzZVBvc2l0aW9uO1xuICAgICAgbGV0IHNjYWxhcl9pZHggPSAzdSAqIHZlcnRleElkO1xuICAgICAgZm9yICh2YXIgaT0wdTsgaTxybk1vcnBoVW5pZm9ybURhdGFUYXJnZXROdW1iZXJzW2N1cnJlbnRQcmltaXRpdmVJZHhdOyBpKyspIHtcbiAgICAgICAgbGV0IGlkeCA9IG9mZnNldEluVW5pZm9ybSArIGk7XG4gICAgICAgIGxldCBvZmZzZXRzID0gdW5pZm9ybU1vcnBoT2Zmc2V0cy5kYXRhWyBpZHggLyA0dV07XG4gICAgICAgIGxldCBvZmZzZXRQb3NpdGlvbiA9IG9mZnNldHNbaWR4ICUgNHVdO1xuXG4gICAgICAgIGxldCBiYXNlUG9zSW40Ynl0ZXMgPSBvZmZzZXRQb3NpdGlvbiAqIDR1ICsgc2NhbGFyX2lkeDtcbiAgICAgICAgbGV0IGFkZFBvcyA9IGZldGNoVmVjM05vMTZCeXRlc0FsaWduZWRGcm9tQmxlbmRTaGFwZUJ1ZmZlcihiYXNlUG9zSW40Ynl0ZXMpO1xuXG4gICAgICAgIGxldCBpZHgyID0gb2Zmc2V0SW5Vbmlmb3JtMiArIGk7XG4gICAgICAgIGxldCBtb3JwaFdlaWdodHM6IHZlYzRmID0gdW5pZm9ybU1vcnBoV2VpZ2h0cy5kYXRhWyBpZHgyIC8gNHVdO1xuICAgICAgICBsZXQgbW9ycGhXZWlnaHQ6IGYzMiA9IG1vcnBoV2VpZ2h0c1tpZHgyICUgNHVdO1xuXG4gICAgICAgIHBvc2l0aW9uICs9IGFkZFBvcyAqIG1vcnBoV2VpZ2h0O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcG9zaXRpb247XG4gICAgfVxuICAgICR7cHJldmlvdXNNb3JwaGVkUG9zaXRpb25TdHJ9XG4gICAgI2VuZGlmXG4gICNlbmRpZlxuICAgIGA7XG5cbiAgICByZXR1cm4gbW9ycGhpbmdTdHI7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIHNoYWRlciBwcm9wZXJ0eSBhY2Nlc3NvciBmdW5jdGlvbnMgZm9yIGdsb2JhbCBkYXRhLlxuICAgKiBDcmVhdGVzIFdHU0wgZnVuY3Rpb25zIHRoYXQgY2FuIGZldGNoIHByb3BlcnR5IHZhbHVlcyBmcm9tIHN0b3JhZ2UgYnVmZmVyc1xuICAgKiBiYXNlZCBvbiBzaGFkZXIgc2VtYW50aWNzIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gaW5mbyAtIFNoYWRlciBzZW1hbnRpY3MgaW5mb3JtYXRpb24gY29udGFpbmluZyB0eXBlIGFuZCBiaW5kaW5nIGRldGFpbHNcbiAgICogQHJldHVybnMgV0dTTCBzaGFkZXIgY29kZSBmb3IgdGhlIHByb3BlcnR5IGFjY2Vzc29yIGZ1bmN0aW9uXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldFNoYWRlclByb3BlcnR5T2ZHbG9iYWxEYXRhUmVwb3NpdG9yeShlbmdpbmU6IEVuZ2luZSwgaW5mbzogU2hhZGVyU2VtYW50aWNzSW5mbykge1xuICAgIGNvbnN0IHJldHVyblR5cGUgPSBpbmZvLmNvbXBvc2l0aW9uVHlwZS50b1dHU0xUeXBlKGluZm8uY29tcG9uZW50VHlwZSk7XG4gICAgY29uc3QgbWV0aG9kTmFtZSA9IGluZm8uc2VtYW50aWMucmVwbGFjZSgnLicsICdfJyk7XG4gICAgY29uc3QgaXNUZXh0dXJlID0gQ29tcG9zaXRpb25UeXBlLmlzVGV4dHVyZShpbmZvLmNvbXBvc2l0aW9uVHlwZSk7XG5cbiAgICBpZiAoaXNUZXh0dXJlKSB7XG4gICAgICBsZXQgdGV4dHVyZVR5cGUgPSAndGV4dHVyZV8yZDxmMzI+JztcbiAgICAgIGlmIChpbmZvLmNvbXBvc2l0aW9uVHlwZSA9PT0gQ29tcG9zaXRpb25UeXBlLlRleHR1cmVDdWJlKSB7XG4gICAgICAgIHRleHR1cmVUeXBlID0gJ3RleHR1cmVfY3ViZTxmMzI+JztcbiAgICAgIH0gZWxzZSBpZiAoaW5mby5jb21wb3NpdGlvblR5cGUgPT09IENvbXBvc2l0aW9uVHlwZS5UZXh0dXJlMkRBcnJheSkge1xuICAgICAgICB0ZXh0dXJlVHlwZSA9ICd0ZXh0dXJlXzJkX2FycmF5PGYzMj4nO1xuICAgICAgfVxuICAgICAgY29uc3QgeyB0ZXh0dXJlTmFtZSwgc2FtcGxlck5hbWUgfSA9IGdldFRleHR1cmVBbmRTYW1wbGVyTmFtZXMobWV0aG9kTmFtZSk7XG4gICAgICByZXR1cm4gYFxuQGdyb3VwKDEpIEBiaW5kaW5nKCR7aW5mby5pbml0aWFsVmFsdWVbMF19KSB2YXIgJHt0ZXh0dXJlTmFtZX06ICR7dGV4dHVyZVR5cGV9O1xuQGdyb3VwKDIpIEBiaW5kaW5nKCR7aW5mby5pbml0aWFsVmFsdWVbMF19KSB2YXIgJHtzYW1wbGVyTmFtZX06IHNhbXBsZXI7XG5gO1xuICAgIH1cblxuICAgIC8vIGlubmVyIGNvbnRlbnRzIG9mICdnZXRfJyBzaGFkZXIgZnVuY3Rpb25cbiAgICBjb25zdCB2ZWM0U2l6ZU9mUHJvcGVydHk6IEluZGV4T2YxNkJ5dGVzID0gaW5mby5jb21wb3NpdGlvblR5cGUuZ2V0VmVjNFNpemVPZlByb3BlcnR5KCk7XG4gICAgLy8gZm9yIG5vbi1gaW5kZXhgIHByb3BlcnR5ICh0aGlzIGlzIGdlbmVyYWwgY2FzZSlcbiAgICBjb25zdCBzY2FsYXJTaXplT2ZQcm9wZXJ0eTogSW5kZXhPZjRCeXRlcyA9IGluZm8uY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpO1xuICAgIGNvbnN0IG9mZnNldE9mUHJvcGVydHk6IEluZGV4T2YxNkJ5dGVzID0gV2ViR3B1U3RyYXRlZ3lCYXNpYy5nZXRPZmZzZXRPZlByb3BlcnR5T2ZHbG9iYWxEYXRhUmVwb3NpdG9yeShcbiAgICAgIGVuZ2luZSxcbiAgICAgIGluZm8uc2VtYW50aWNcbiAgICApO1xuXG4gICAgaWYgKG9mZnNldE9mUHJvcGVydHkgPT09IC0xKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignQ291bGQgbm90IGdldCB0aGUgbG9jYXRpb24gb2Zmc2V0IG9mIHRoZSBwcm9wZXJ0eS4nKTtcbiAgICB9XG5cbiAgICBsZXQgaW5kZXhTdHI6IHN0cmluZztcbiAgICBsZXQgaW5zdGFuY2VTaXplID0gdmVjNFNpemVPZlByb3BlcnR5O1xuICAgIGluZGV4U3RyID0gYCAgbGV0IHZlYzRfaWR4OiB1MzIgPSAke29mZnNldE9mUHJvcGVydHl9dSArICR7aW5zdGFuY2VTaXplfXUgKiBpbnN0YW5jZUlkO1xcbmA7XG4gICAgaWYgKENvbXBvc2l0aW9uVHlwZS5pc0FycmF5KGluZm8uY29tcG9zaXRpb25UeXBlKSkge1xuICAgICAgaW5zdGFuY2VTaXplID0gdmVjNFNpemVPZlByb3BlcnR5ICogKGluZm8uYXJyYXlMZW5ndGggPz8gMSk7XG4gICAgICBjb25zdCBwYWRkZWRBc1ZlYzQgPSBNYXRoLmNlaWwoc2NhbGFyU2l6ZU9mUHJvcGVydHkgLyA0KSAqIDQ7XG4gICAgICBjb25zdCBpbnN0YW5jZVNpemVJblNjYWxhciA9IHBhZGRlZEFzVmVjNCAqIChpbmZvLmFycmF5TGVuZ3RoID8/IDEpO1xuICAgICAgaW5kZXhTdHIgPSBgICBsZXQgdmVjNF9pZHg6IHUzMiA9ICR7b2Zmc2V0T2ZQcm9wZXJ0eX11ICsgJHtpbnN0YW5jZVNpemV9ICogaW5zdGFuY2VJZCArICR7dmVjNFNpemVPZlByb3BlcnR5fXUgKiBpZHhPZkFycmF5O1xcbmA7XG4gICAgICBpbmRleFN0ciArPSBgICBsZXQgc2NhbGFyX2lkeDogdTMyID0gJHtcbiAgICAgICAgLy8gSW5kZXhPZjRCeXRlc1xuICAgICAgICBvZmZzZXRPZlByb3BlcnR5ICogNCAvLyBJbmRleE9mMTZieXRlcyB0byBJbmRleE9mNEJ5dGVzXG4gICAgICB9ICsgJHtpbnN0YW5jZVNpemVJblNjYWxhcn0gKiBpbnN0YW5jZUlkICsgJHtzY2FsYXJTaXplT2ZQcm9wZXJ0eX11ICogaWR4T2ZBcnJheTtcXG5gO1xuICAgIH1cblxuICAgIGNvbnN0IGZpcnN0UGFydE9mSW5uZXJGdW5jID0gYFxuZm4gZ2V0XyR7bWV0aG9kTmFtZX0oaW5zdGFuY2VJZDogdTMyLCBpZHhPZkFycmF5OiB1MzIpIC0+ICR7cmV0dXJuVHlwZX0ge1xuJHtpbmRleFN0cn1cbmA7XG5cbiAgICBsZXQgc3RyID0gYCR7Zmlyc3RQYXJ0T2ZJbm5lckZ1bmN9YDtcblxuICAgIHN3aXRjaCAoaW5mby5jb21wb3NpdGlvblR5cGUpIHtcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzQ6XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWM0QXJyYXk6XG4gICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gZmV0Y2hFbGVtZW50KHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzM6XG4gICAgICAgIHN0ciArPSAnICBsZXQgY29sMCA9IGZldGNoRWxlbWVudCh2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgc3RyICs9IGAgIGxldCB2YWwgPSAke3JldHVyblR5cGV9KGNvbDAueHl6KTtgO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzNBcnJheTpcbiAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBmZXRjaFZlYzNObzE2Qnl0ZXNBbGlnbmVkKHNjYWxhcl9pZHgpO1xcbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjMjpcbiAgICAgICAgc3RyICs9ICcgIGxldCBjb2wwID0gZmV0Y2hFbGVtZW50KHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBzdHIgKz0gYCAgbGV0IHZhbCA9ICR7cmV0dXJuVHlwZX0oY29sMC54eSk7YDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWMyQXJyYXk6XG4gICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gZmV0Y2hWZWMyTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlNjYWxhcjpcbiAgICAgICAgc3RyICs9ICcgIGxldCBjb2wwID0gZmV0Y2hFbGVtZW50KHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkludCkge1xuICAgICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gaTMyKGNvbDAueCk7JztcbiAgICAgICAgfSBlbHNlIGlmIChpbmZvLmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuVW5zaWduZWRJbnQpIHtcbiAgICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IHUzMihjb2wwLngpOyc7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkJvb2wpIHtcbiAgICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGNvbDAueCA+PSAwLjU7JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGNvbDAueDsnO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuU2NhbGFyQXJyYXk6XG4gICAgICAgIHN0ciArPSAnICBsZXQgY29sMCA9IGZldGNoU2NhbGFyTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkludCkge1xuICAgICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gaTMyKGNvbDApOyc7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLlVuc2lnbmVkSW50KSB7XG4gICAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSB1MzIoY29sMCk7JztcbiAgICAgICAgfSBlbHNlIGlmIChpbmZvLmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuQm9vbCkge1xuICAgICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gY29sMCA+PSAwLjU7JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGNvbDA7JztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDQ6XG4gICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gZmV0Y2hNYXQ0KHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDRBcnJheTpcbiAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBmZXRjaE1hdDQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0MzpcbiAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBmZXRjaE1hdDModmVjNF9pZHgpO1xcbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0M0FycmF5OlxuICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGZldGNoTWF0M05vMTZCeXRlc0FsaWduZWQoc2NhbGFyX2lkeCk7XFxuJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQyOlxuICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGZldGNoTWF0Mih2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQyQXJyYXk6XG4gICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gZmV0Y2hNYXQyTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDR4M0FycmF5OlxuICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGZldGNoTWF0NHgzKHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIC8vIExvZ2dlci5kZWZhdWx0LmVycm9yKCd1bmtub3duIGNvbXBvc2l0aW9uIHR5cGUnLCBpbmZvLmNvbXBvc2l0aW9uVHlwZS5zdHIsIG1lbWJlck5hbWUpO1xuICAgICAgICBzdHIgKz0gJyc7XG4gICAgfVxuICAgIHN0ciArPSBgXG4gIHJldHVybiB2YWw7XG59XG5gO1xuICAgIHJldHVybiBzdHI7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIHNoYWRlciBwcm9wZXJ0eSBhY2Nlc3NvciBmdW5jdGlvbnMgZm9yIG1hdGVyaWFscy5cbiAgICogQ3JlYXRlcyBXR1NMIGZ1bmN0aW9ucyB0aGF0IGNhbiBmZXRjaCBwcm9wZXJ0eSB2YWx1ZXMgZnJvbSBzdG9yYWdlIGJ1ZmZlcnNcbiAgICogYmFzZWQgb24gc2hhZGVyIHNlbWFudGljcyBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIG1hdGVyaWFsVHlwZU5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgbWF0ZXJpYWwgdHlwZVxuICAgKiBAcGFyYW0gaW5mbyAtIFNoYWRlciBzZW1hbnRpY3MgaW5mb3JtYXRpb24gY29udGFpbmluZyB0eXBlIGFuZCBiaW5kaW5nIGRldGFpbHNcbiAgICogQHJldHVybnMgV0dTTCBzaGFkZXIgY29kZSBmb3IgdGhlIHByb3BlcnR5IGFjY2Vzc29yIGZ1bmN0aW9uXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldFNoYWRlclByb3BlcnR5T2ZNYXRlcmlhbChlbmdpbmU6IEVuZ2luZSwgbWF0ZXJpYWxUeXBlTmFtZTogc3RyaW5nLCBpbmZvOiBTaGFkZXJTZW1hbnRpY3NJbmZvKSB7XG4gICAgY29uc3QgcmV0dXJuVHlwZSA9IGluZm8uY29tcG9zaXRpb25UeXBlLnRvV0dTTFR5cGUoaW5mby5jb21wb25lbnRUeXBlKTtcbiAgICBjb25zdCBtZXRob2ROYW1lID0gaW5mby5zZW1hbnRpYy5yZXBsYWNlKCcuJywgJ18nKTtcbiAgICBjb25zdCBpc1RleHR1cmUgPSBDb21wb3NpdGlvblR5cGUuaXNUZXh0dXJlKGluZm8uY29tcG9zaXRpb25UeXBlKTtcblxuICAgIGlmIChpc1RleHR1cmUpIHtcbiAgICAgIGxldCB0ZXh0dXJlVHlwZSA9ICd0ZXh0dXJlXzJkPGYzMj4nO1xuICAgICAgaWYgKGluZm8uY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVGV4dHVyZUN1YmUpIHtcbiAgICAgICAgdGV4dHVyZVR5cGUgPSAndGV4dHVyZV9jdWJlPGYzMj4nO1xuICAgICAgfSBlbHNlIGlmIChpbmZvLmNvbXBvc2l0aW9uVHlwZSA9PT0gQ29tcG9zaXRpb25UeXBlLlRleHR1cmUyREFycmF5KSB7XG4gICAgICAgIHRleHR1cmVUeXBlID0gJ3RleHR1cmVfMmRfYXJyYXk8ZjMyPic7XG4gICAgICB9XG4gICAgICBjb25zdCB7IHRleHR1cmVOYW1lLCBzYW1wbGVyTmFtZSB9ID0gZ2V0VGV4dHVyZUFuZFNhbXBsZXJOYW1lcyhtZXRob2ROYW1lKTtcbiAgICAgIHJldHVybiBgXG5AZ3JvdXAoMSkgQGJpbmRpbmcoJHtpbmZvLmluaXRpYWxWYWx1ZVswXX0pIHZhciAke3RleHR1cmVOYW1lfTogJHt0ZXh0dXJlVHlwZX07XG5AZ3JvdXAoMikgQGJpbmRpbmcoJHtpbmZvLmluaXRpYWxWYWx1ZVswXX0pIHZhciAke3NhbXBsZXJOYW1lfTogc2FtcGxlcjtcbmA7XG4gICAgfVxuXG4gICAgLy8gaW5uZXIgY29udGVudHMgb2YgJ2dldF8nIHNoYWRlciBmdW5jdGlvblxuICAgIGNvbnN0IHZlYzRTaXplT2ZQcm9wZXJ0eTogSW5kZXhPZjE2Qnl0ZXMgPSBpbmZvLmNvbXBvc2l0aW9uVHlwZS5nZXRWZWM0U2l6ZU9mUHJvcGVydHkoKTtcbiAgICAvLyBmb3Igbm9uLWBpbmRleGAgcHJvcGVydHkgKHRoaXMgaXMgZ2VuZXJhbCBjYXNlKVxuICAgIGNvbnN0IHNjYWxhclNpemVPZlByb3BlcnR5OiBJbmRleE9mNEJ5dGVzID0gaW5mby5jb21wb3NpdGlvblR5cGUuZ2V0TnVtYmVyT2ZDb21wb25lbnRzKCk7XG4gICAgY29uc3Qgb2Zmc2V0T2ZQcm9wZXJ0eTogSW5kZXhPZjE2Qnl0ZXNbXSA9IFdlYkdwdVN0cmF0ZWd5QmFzaWMuZ2V0T2Zmc2V0T2ZQcm9wZXJ0eU9mTWF0ZXJpYWwoXG4gICAgICBlbmdpbmUsXG4gICAgICBpbmZvLnNlbWFudGljLFxuICAgICAgbWF0ZXJpYWxUeXBlTmFtZVxuICAgICk7XG4gICAgY29uc3QgbWF0ZXJpYWxDb3VudFBlckJ1ZmZlclZpZXcgPSBlbmdpbmUubWF0ZXJpYWxSZXBvc2l0b3J5Ll9nZXRNYXRlcmlhbENvdW50UGVyQnVmZmVyVmlldyhtYXRlcmlhbFR5cGVOYW1lKSE7XG5cbiAgICAvLyBNb2R1bGUtc2NvcGUgY29uc3Q6IGEgdmFyPGZ1bmN0aW9uPiBhcnJheSBpcyBpbml0aWFsaXplZCBvbiBldmVyeSBjYWxsLCB3aGljaCBpcyBleHBlbnNpdmUgd2hlbiB0aGUgbWF0ZXJpYWxcbiAgICAvLyB0eXBlIHNwYW5zIG1hbnkgYnVmZmVyIHZpZXdzLlxuICAgIGNvbnN0IG9mZnNldHNOYW1lID0gYHJuT2Zmc2V0c18ke21ldGhvZE5hbWV9YDtcbiAgICBjb25zdCBvZmZzZXRzU3RyID0gYGNvbnN0ICR7b2Zmc2V0c05hbWV9OiBhcnJheTx1MzIsICR7b2Zmc2V0T2ZQcm9wZXJ0eS5sZW5ndGh9PiA9IGFycmF5PHUzMiwgJHtvZmZzZXRPZlByb3BlcnR5Lmxlbmd0aH0+KCR7b2Zmc2V0T2ZQcm9wZXJ0eS5tYXAob2Zmc2V0ID0+IGAke29mZnNldH11YCkuam9pbignLCAnKX0pO2A7XG5cbiAgICBsZXQgaW5kZXhTdHI6IHN0cmluZztcbiAgICBsZXQgaW5zdGFuY2VTaXplID0gdmVjNFNpemVPZlByb3BlcnR5O1xuICAgIGluZGV4U3RyID0gYCAgbGV0IHZlYzRfaWR4OiB1MzIgPSAke29mZnNldHNOYW1lfVtpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3c10gKyAke2luc3RhbmNlU2l6ZX11ICogaW5zdGFuY2VJZEluQnVmZmVyVmlldztcXG5gO1xuICAgIGlmIChDb21wb3NpdGlvblR5cGUuaXNBcnJheShpbmZvLmNvbXBvc2l0aW9uVHlwZSkpIHtcbiAgICAgIGluc3RhbmNlU2l6ZSA9IHZlYzRTaXplT2ZQcm9wZXJ0eSAqIChpbmZvLmFycmF5TGVuZ3RoID8/IDEpO1xuICAgICAgY29uc3QgcGFkZGVkQXNWZWM0ID0gTWF0aC5jZWlsKHNjYWxhclNpemVPZlByb3BlcnR5IC8gNCkgKiA0O1xuICAgICAgY29uc3QgaW5zdGFuY2VTaXplSW5TY2FsYXIgPSBwYWRkZWRBc1ZlYzQgKiAoaW5mby5hcnJheUxlbmd0aCA/PyAxKTtcbiAgICAgIGluZGV4U3RyID0gYCAgbGV0IHZlYzRfaWR4OiB1MzIgPSAke29mZnNldHNOYW1lfVtpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3c10gKyAke2luc3RhbmNlU2l6ZX0gKiBpbnN0YW5jZUlkSW5CdWZmZXJWaWV3ICsgJHt2ZWM0U2l6ZU9mUHJvcGVydHl9dSAqIGlkeE9mQXJyYXk7XFxuYDtcbiAgICAgIGluZGV4U3RyICs9IGAgIGxldCBzY2FsYXJfaWR4OiB1MzIgPSAke29mZnNldHNOYW1lfVtpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3c10gKiA0ICsgJHtpbnN0YW5jZVNpemVJblNjYWxhcn0gKiBpbnN0YW5jZUlkSW5CdWZmZXJWaWV3ICsgJHtzY2FsYXJTaXplT2ZQcm9wZXJ0eX11ICogaWR4T2ZBcnJheTtcXG5gO1xuICAgIH1cblxuICAgIGNvbnN0IGZpcnN0UGFydE9mSW5uZXJGdW5jID0gYFxuJHtvZmZzZXRzU3RyfVxuZm4gZ2V0XyR7bWV0aG9kTmFtZX0oaW5zdGFuY2VJZDogdTMyLCBpZHhPZkFycmF5OiB1MzIpIC0+ICR7cmV0dXJuVHlwZX0ge1xuICBsZXQgaW5zdGFuY2VJZE9mQnVmZmVyVmlld3MgPSBpbnN0YW5jZUlkIC8gJHttYXRlcmlhbENvdW50UGVyQnVmZmVyVmlld307XG4gIGxldCBpbnN0YW5jZUlkSW5CdWZmZXJWaWV3ID0gaW5zdGFuY2VJZCAlICR7bWF0ZXJpYWxDb3VudFBlckJ1ZmZlclZpZXd9O1xuJHtpbmRleFN0cn1cbmA7XG5cbiAgICBsZXQgc3RyID0gYCR7Zmlyc3RQYXJ0T2ZJbm5lckZ1bmN9YDtcblxuICAgIHN3aXRjaCAoaW5mby5jb21wb3NpdGlvblR5cGUpIHtcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzQ6XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWM0QXJyYXk6XG4gICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gZmV0Y2hFbGVtZW50KHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzM6XG4gICAgICAgIHN0ciArPSAnICBsZXQgY29sMCA9IGZldGNoRWxlbWVudCh2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgc3RyICs9IGAgIGxldCB2YWwgPSAke3JldHVyblR5cGV9KGNvbDAueHl6KTtgO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzNBcnJheTpcbiAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBmZXRjaFZlYzNObzE2Qnl0ZXNBbGlnbmVkKHNjYWxhcl9pZHgpO1xcbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjMjpcbiAgICAgICAgc3RyICs9ICcgIGxldCBjb2wwID0gZmV0Y2hFbGVtZW50KHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBzdHIgKz0gYCAgbGV0IHZhbCA9ICR7cmV0dXJuVHlwZX0oY29sMC54eSk7YDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWMyQXJyYXk6XG4gICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gZmV0Y2hWZWMyTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlNjYWxhcjpcbiAgICAgICAgc3RyICs9ICcgIGxldCBjb2wwID0gZmV0Y2hFbGVtZW50KHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkludCkge1xuICAgICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gaTMyKGNvbDAueCk7JztcbiAgICAgICAgfSBlbHNlIGlmIChpbmZvLmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuVW5zaWduZWRJbnQpIHtcbiAgICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IHUzMihjb2wwLngpOyc7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkJvb2wpIHtcbiAgICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGNvbDAueCA+PSAwLjU7JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGNvbDAueDsnO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuU2NhbGFyQXJyYXk6XG4gICAgICAgIHN0ciArPSAnICBsZXQgY29sMCA9IGZldGNoU2NhbGFyTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkludCkge1xuICAgICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gaTMyKGNvbDApOyc7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLlVuc2lnbmVkSW50KSB7XG4gICAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSB1MzIoY29sMCk7JztcbiAgICAgICAgfSBlbHNlIGlmIChpbmZvLmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuQm9vbCkge1xuICAgICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gY29sMCA+PSAwLjU7JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGNvbDA7JztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDQ6XG4gICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gZmV0Y2hNYXQ0KHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDRBcnJheTpcbiAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBmZXRjaE1hdDQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0MzpcbiAgICAgICAgc3RyICs9ICcgIGxldCB2YWwgPSBmZXRjaE1hdDModmVjNF9pZHgpO1xcbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0M0FycmF5OlxuICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGZldGNoTWF0M05vMTZCeXRlc0FsaWduZWQoc2NhbGFyX2lkeCk7XFxuJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQyOlxuICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGZldGNoTWF0Mih2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQyQXJyYXk6XG4gICAgICAgIHN0ciArPSAnICBsZXQgdmFsID0gZmV0Y2hNYXQyTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDR4M0FycmF5OlxuICAgICAgICBzdHIgKz0gJyAgbGV0IHZhbCA9IGZldGNoTWF0NHgzKHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIC8vIExvZ2dlci5kZWZhdWx0LmVycm9yKCd1bmtub3duIGNvbXBvc2l0aW9uIHR5cGUnLCBpbmZvLmNvbXBvc2l0aW9uVHlwZS5zdHIsIG1lbWJlck5hbWUpO1xuICAgICAgICBzdHIgKz0gJyc7XG4gICAgfVxuICAgIHN0ciArPSBgXG4gIHJldHVybiB2YWw7XG59XG5gO1xuICAgIHJldHVybiBzdHI7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyB0aGUgbWVtb3J5IG9mZnNldCBvZiBhIHNoYWRlciBwcm9wZXJ0eSB3aXRoaW4gc3RvcmFnZSBidWZmZXJzLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gaXNHbG9iYWxEYXRhIC0gV2hldGhlciB0byBsb29rIGluIGdsb2JhbCBkYXRhIHJlcG9zaXRvcnkgb3IgbWF0ZXJpYWwgcmVwb3NpdG9yeVxuICAgKiBAcGFyYW0gcHJvcGVydHlOYW1lIC0gVGhlIHNlbWFudGljIG5hbWUgb2YgdGhlIHByb3BlcnR5XG4gICAqIEBwYXJhbSBtYXRlcmlhbFR5cGVOYW1lIC0gVGhlIG1hdGVyaWFsIHR5cGUgbmFtZSBmb3IgbWF0ZXJpYWwtc3BlY2lmaWMgcHJvcGVydGllc1xuICAgKiBAcmV0dXJucyBUaGUgYnl0ZSBvZmZzZXQgb2YgdGhlIHByb3BlcnR5IGluIHRoZSBzdG9yYWdlIGJ1ZmZlciwgb3IgLTEgaWYgbm90IGZvdW5kXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBnZXRPZmZzZXRPZlByb3BlcnR5T2ZNYXRlcmlhbChcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBwcm9wZXJ0eU5hbWU6IFNoYWRlclNlbWFudGljc05hbWUsXG4gICAgbWF0ZXJpYWxUeXBlTmFtZTogc3RyaW5nXG4gICkge1xuICAgIGNvbnN0IGRhdGFCZWdpblBvcyA9IGVuZ2luZS5tYXRlcmlhbFJlcG9zaXRvcnkuZ2V0TG9jYXRpb25PZmZzZXRPZk1lbWJlck9mTWF0ZXJpYWwoXG4gICAgICBlbmdpbmUsXG4gICAgICBtYXRlcmlhbFR5cGVOYW1lLFxuICAgICAgcHJvcGVydHlOYW1lXG4gICAgKTtcbiAgICByZXR1cm4gZGF0YUJlZ2luUG9zO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgZ2V0T2Zmc2V0T2ZQcm9wZXJ0eU9mR2xvYmFsRGF0YVJlcG9zaXRvcnkoZW5naW5lOiBFbmdpbmUsIHByb3BlcnR5TmFtZTogU2hhZGVyU2VtYW50aWNzTmFtZSkge1xuICAgIGNvbnN0IGdsb2JhbERhdGFSZXBvc2l0b3J5ID0gZW5naW5lLmdsb2JhbERhdGFSZXBvc2l0b3J5O1xuICAgIGNvbnN0IGRhdGFCZWdpblBvcyA9IGdsb2JhbERhdGFSZXBvc2l0b3J5LmdldExvY2F0aW9uT2Zmc2V0T2ZQcm9wZXJ0eShwcm9wZXJ0eU5hbWUpO1xuICAgIHJldHVybiBkYXRhQmVnaW5Qb3M7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYW5kIHByZXBhcmVzIGEgbWVzaCBjb21wb25lbnQgZm9yIHJlbmRlcmluZy5cbiAgICogU2V0cyB1cCB2ZXJ0ZXggYnVmZmVyIG9iamVjdHMgKFZCTykgYW5kIHZlcnRleCBhcnJheSBvYmplY3RzIChWQU8pIGlmIG5vdCBhbHJlYWR5IGRvbmUuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNoQ29tcG9uZW50IC0gVGhlIG1lc2ggY29tcG9uZW50IHRvIGxvYWRcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgbWVzaCB3YXMgc3VjY2Vzc2Z1bGx5IGxvYWRlZCwgZmFsc2UgaWYgdGhlIG1lc2ggaXMgbnVsbFxuICAgKi9cbiAgJGxvYWQobWVzaENvbXBvbmVudDogTWVzaENvbXBvbmVudCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IG1lc2ggPSBtZXNoQ29tcG9uZW50Lm1lc2g7XG4gICAgaWYgKG1lc2ggPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIHNldHVwIFZCTyBhbmQgVkFPXG4gICAgaWYgKCFtZXNoLmlzU2V0VXBEb25lKCkpIHtcbiAgICAgIG1lc2guX3VwZGF0ZVZCT0FuZFZBTygpO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIGNvbW1vbiBsb2FkaW5nIG9wZXJhdGlvbnMgcmVxdWlyZWQgZm9yIHRoZSBXZWJHUFUgc3RyYXRlZ3kuXG4gICAqIEluaXRpYWxpemVzIG1vcnBoIHRhcmdldCBhcnJheXMgYW5kIHVwZGF0ZXMgYmxlbmQgc2hhcGUgc3RvcmFnZSBidWZmZXJzIHdoZW4gbmVlZGVkLlxuICAgKi9cbiAgY29tbW9uXyRsb2FkKCk6IHZvaWQge1xuICAgIHRoaXMuX19pbml0TW9ycGhVbmlmb3JtQnVmZmVycygpO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2luaXRNb3JwaFVuaWZvcm1CdWZmZXJzKCkge1xuICAgIGNvbnN0IG1vcnBoVW5pZm9ybURhdGFPZmZzZXRzID0gUHJpbWl0aXZlLmdldE1vcnBoVW5pZm9ybURhdGFPZmZzZXRzKCk7XG4gICAgY29uc3QgbW9ycGhPZmZzZXRzVW5pZm9ybURhdGFTaXplID0gTWF0aC5tYXgoXG4gICAgICBNYXRoLmNlaWwobW9ycGhVbmlmb3JtRGF0YU9mZnNldHNbbW9ycGhVbmlmb3JtRGF0YU9mZnNldHMubGVuZ3RoIC0gMV0gLyA0KSAqIDQgKiA0LFxuICAgICAgNFxuICAgICk7XG5cbiAgICBpZiAobW9ycGhPZmZzZXRzVW5pZm9ybURhdGFTaXplICE9PSB0aGlzLl9fbGFzdE1vcnBoT2Zmc2V0c1VuaWZvcm1EYXRhU2l6ZSkge1xuICAgICAgY29uc3Qgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy5fX2VuZ2luZS53ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgICAvLyBkZWxldGUgdGhlIG9sZCBtb3JwaCBvZmZzZXRzIHVuaWZvcm0gYnVmZmVyXG4gICAgICBpZiAodGhpcy5fX21vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJVaWQgIT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkKSB7XG4gICAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5mbHVzaCgpO1xuICAgICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuY2xlYXJDYWNoZSgpO1xuICAgICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuZGVsZXRlVW5pZm9ybUJ1ZmZlcih0aGlzLl9fbW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlclVpZCk7XG4gICAgICAgIHRoaXMuX19tb3JwaE9mZnNldHNVbmlmb3JtQnVmZmVyVWlkID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gICAgICB9XG4gICAgICAvLyBjcmVhdGUgdGhlIG5ldyBtb3JwaCBvZmZzZXRzIHVuaWZvcm0gYnVmZmVyXG4gICAgICB0aGlzLl9fbGFzdE1vcnBoT2Zmc2V0c1VuaWZvcm1EYXRhU2l6ZSA9IG1vcnBoT2Zmc2V0c1VuaWZvcm1EYXRhU2l6ZTtcbiAgICAgIGlmICh0aGlzLl9fbW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlclVpZCA9PT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQpIHtcbiAgICAgICAgY29uc3QgaW5wdXRBcnJheU9mZnNldHMgPSBuZXcgVWludDMyQXJyYXkobW9ycGhPZmZzZXRzVW5pZm9ybURhdGFTaXplKTtcbiAgICAgICAgdGhpcy5fX3VuaWZvcm1Nb3JwaE9mZnNldHNUeXBlZEFycmF5ID0gaW5wdXRBcnJheU9mZnNldHM7XG4gICAgICAgIHRoaXMuX19tb3JwaE9mZnNldHNVbmlmb3JtQnVmZmVyVWlkID0gd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmNyZWF0ZVVuaWZvcm1Nb3JwaE9mZnNldHNCdWZmZXIoXG4gICAgICAgICAgbW9ycGhPZmZzZXRzVW5pZm9ybURhdGFTaXplICogNFxuICAgICAgICApO1xuICAgICAgICB0aGlzLl9fdXBkYXRlTW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlcigpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9fbGFzdE1vcnBoT2Zmc2V0c1VuaWZvcm1EYXRhU2l6ZSA9IG1vcnBoT2Zmc2V0c1VuaWZvcm1EYXRhU2l6ZTtcbiAgICB9XG5cbiAgICBjb25zdCBibGVuZFNoYXBlV2VpZ2h0c1VuaWZvcm1EYXRhU2l6ZSA9IEJsZW5kU2hhcGVDb21wb25lbnQuX2dldE1vcnBoV2VpZ2h0c1VuaWZvcm1CdWZmZXJGbG9hdENvdW50KHRoaXMuX19lbmdpbmUpO1xuXG4gICAgaWYgKGJsZW5kU2hhcGVXZWlnaHRzVW5pZm9ybURhdGFTaXplICE9PSB0aGlzLl9fbGFzdE1vcnBoV2VpZ2h0c1VuaWZvcm1EYXRhU2l6ZSkge1xuICAgICAgY29uc3Qgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy5fX2VuZ2luZS53ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgICAvLyBkZWxldGUgdGhlIG9sZCBtb3JwaCB3ZWlnaHRzIHVuaWZvcm0gYnVmZmVyXG4gICAgICBpZiAodGhpcy5fX21vcnBoV2VpZ2h0c1VuaWZvcm1CdWZmZXJVaWQgIT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkKSB7XG4gICAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5mbHVzaCgpO1xuICAgICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuY2xlYXJDYWNoZSgpO1xuICAgICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuZGVsZXRlVW5pZm9ybUJ1ZmZlcih0aGlzLl9fbW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlclVpZCk7XG4gICAgICAgIHRoaXMuX19tb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyVWlkID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gICAgICB9XG5cbiAgICAgIC8vIGNyZWF0ZSB0aGUgbmV3IG1vcnBoIHdlaWdodHMgdW5pZm9ybSBidWZmZXJcbiAgICAgIGlmICh0aGlzLl9fbW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlclVpZCA9PT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQpIHtcbiAgICAgICAgY29uc3QgaW5wdXRBcnJheVdlaWdodHMgPSBuZXcgRmxvYXQzMkFycmF5KGJsZW5kU2hhcGVXZWlnaHRzVW5pZm9ybURhdGFTaXplKTtcbiAgICAgICAgdGhpcy5fX3VuaWZvcm1Nb3JwaFdlaWdodHNUeXBlZEFycmF5ID0gaW5wdXRBcnJheVdlaWdodHM7XG4gICAgICAgIHRoaXMuX19tb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyVWlkID0gd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmNyZWF0ZVVuaWZvcm1Nb3JwaFdlaWdodHNCdWZmZXIoXG4gICAgICAgICAgYmxlbmRTaGFwZVdlaWdodHNVbmlmb3JtRGF0YVNpemUgKiA0XG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuX191cGRhdGVNb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyKHRydWUpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9fbGFzdE1vcnBoV2VpZ2h0c1VuaWZvcm1EYXRhU2l6ZSA9IGJsZW5kU2hhcGVXZWlnaHRzVW5pZm9ybURhdGFTaXplO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIHNoYWRlciBwcm9ncmFtcyBmb3IgYWxsIHByaW1pdGl2ZXMgaW4gdGhlIGdpdmVuIG1lc2ggY29tcG9uZW50LlxuICAgKiBJdGVyYXRlcyB0aHJvdWdoIGFsbCBwcmltaXRpdmVzIGFuZCBlbnN1cmVzIHRoZWlyIG1hdGVyaWFscyBoYXZlIHByb3BlciBzaGFkZXIgcHJvZ3JhbXMuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNoQ29tcG9uZW50IC0gVGhlIG1lc2ggY29tcG9uZW50IGNvbnRhaW5pbmcgcHJpbWl0aXZlcyB0byBzZXR1cFxuICAgKi9cbiAgcHJpdmF0ZSBfX3NldHVwU2hhZGVyUHJvZ3JhbUZvck1lc2hDb21wb25lbnQobWVzaENvbXBvbmVudDogTWVzaENvbXBvbmVudCkge1xuICAgIGlmIChtZXNoQ29tcG9uZW50Lm1lc2ggPT0gbnVsbCkge1xuICAgICAgTWVzaENvbXBvbmVudC5hbGVydE5vTWVzaFNldChtZXNoQ29tcG9uZW50KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwcmltaXRpdmVOdW0gPSBtZXNoQ29tcG9uZW50Lm1lc2guZ2V0UHJpbWl0aXZlTnVtYmVyKCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmltaXRpdmVOdW07IGkrKykge1xuICAgICAgY29uc3QgcHJpbWl0aXZlID0gbWVzaENvbXBvbmVudC5tZXNoLmdldFByaW1pdGl2ZUF0KGkpO1xuICAgICAgY29uc3QgbWF0ZXJpYWwgPSBwcmltaXRpdmUubWF0ZXJpYWw7XG4gICAgICB0aGlzLl9zZXR1cFNoYWRlclByb2dyYW0obWF0ZXJpYWwsIHByaW1pdGl2ZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgYSBzaGFkZXIgcHJvZ3JhbSBmb3IgYSBzcGVjaWZpYyBtYXRlcmlhbCBhbmQgcHJpbWl0aXZlIGNvbWJpbmF0aW9uLlxuICAgKiBIYW5kbGVzIHNoYWRlciBjb21waWxhdGlvbiBlcnJvcnMgYnkgZmFsbGluZyBiYWNrIHRvIGJhY2t1cCBtYXRlcmlhbHMgd2hlbiBuZWNlc3NhcnkuXG4gICAqXG4gICAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCB0byBzZXR1cCB0aGUgc2hhZGVyIGZvclxuICAgKiBAcGFyYW0gcHJpbWl0aXZlIC0gVGhlIHByaW1pdGl2ZSB0aGF0IHdpbGwgdXNlIHRoaXMgbWF0ZXJpYWxcbiAgICovXG4gIHByaXZhdGUgX3NldHVwU2hhZGVyUHJvZ3JhbShtYXRlcmlhbDogTWF0ZXJpYWwsIHByaW1pdGl2ZTogUHJpbWl0aXZlKSB7XG4gICAgaWYgKG1hdGVyaWFsID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAobWF0ZXJpYWwuaXNTaGFkZXJQcm9ncmFtUmVhZHkocHJpbWl0aXZlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICB0aGlzLnNldHVwU2hhZGVyRm9yTWF0ZXJpYWwoXG4gICAgICAgIG1hdGVyaWFsLFxuICAgICAgICBwcmltaXRpdmUsXG4gICAgICAgIFdlYkdwdVN0cmF0ZWd5QmFzaWMuZ2V0VmVydGV4U2hhZGVyTWV0aG9kRGVmaW5pdGlvbnNfc3RvcmFnZUJ1ZmZlcih0aGlzLl9fZW5naW5lLCBTaGFkZXJUeXBlLlZlcnRleFNoYWRlciksXG4gICAgICAgIFdlYkdwdVN0cmF0ZWd5QmFzaWMuZ2V0VmVydGV4U2hhZGVyTWV0aG9kRGVmaW5pdGlvbnNfc3RvcmFnZUJ1ZmZlcih0aGlzLl9fZW5naW5lLCBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyKSxcbiAgICAgICAgV2ViR3B1U3RyYXRlZ3lCYXNpYy5fX2dldFNoYWRlclByb3BlcnR5T2ZHbG9iYWxEYXRhUmVwb3NpdG9yeSxcbiAgICAgICAgV2ViR3B1U3RyYXRlZ3lCYXNpYy5fX2dldFNoYWRlclByb3BlcnR5T2ZNYXRlcmlhbCxcbiAgICAgICAgV2ViR3B1U3RyYXRlZ3lCYXNpYy5fX2dldE1vcnBoZWRQb3NpdGlvbkdldHRlcih0aGlzLl9fZW5naW5lKVxuICAgICAgKTtcbiAgICAgIHByaW1pdGl2ZS5fYmFja3VwTWF0ZXJpYWwoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcihlIGFzIHN0cmluZyk7XG4gICAgICBwcmltaXRpdmUuX3Jlc3RvcmVNYXRlcmlhbCgpO1xuICAgICAgdGhpcy5zZXR1cFNoYWRlckZvck1hdGVyaWFsKFxuICAgICAgICBwcmltaXRpdmUubWF0ZXJpYWwsXG4gICAgICAgIHByaW1pdGl2ZSxcbiAgICAgICAgV2ViR3B1U3RyYXRlZ3lCYXNpYy5nZXRWZXJ0ZXhTaGFkZXJNZXRob2REZWZpbml0aW9uc19zdG9yYWdlQnVmZmVyKHRoaXMuX19lbmdpbmUsIFNoYWRlclR5cGUuVmVydGV4U2hhZGVyKSxcbiAgICAgICAgV2ViR3B1U3RyYXRlZ3lCYXNpYy5nZXRWZXJ0ZXhTaGFkZXJNZXRob2REZWZpbml0aW9uc19zdG9yYWdlQnVmZmVyKHRoaXMuX19lbmdpbmUsIFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIpLFxuICAgICAgICBXZWJHcHVTdHJhdGVneUJhc2ljLl9fZ2V0U2hhZGVyUHJvcGVydHlPZkdsb2JhbERhdGFSZXBvc2l0b3J5LFxuICAgICAgICBXZWJHcHVTdHJhdGVneUJhc2ljLl9fZ2V0U2hhZGVyUHJvcGVydHlPZk1hdGVyaWFsLFxuICAgICAgICBXZWJHcHVTdHJhdGVneUJhc2ljLl9fZ2V0TW9ycGhlZFBvc2l0aW9uR2V0dGVyKHRoaXMuX19lbmdpbmUpXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIHNoYWRlciBwcm9ncmFtcyBmb3IgbWF0ZXJpYWxzIHVzaW5nIHRoZSBXZWJHUFUgcmVuZGVyaW5nIHN0cmF0ZWd5LlxuICAgKiBUaGlzIG1ldGhvZCBvcmNoZXN0cmF0ZXMgdGhlIHNoYWRlciBjb21waWxhdGlvbiBwcm9jZXNzIGJ5IHByb3ZpZGluZyB0aGUgbmVjZXNzYXJ5XG4gICAqIG1ldGhvZCBkZWZpbml0aW9ucyBhbmQgcHJvcGVydHkgc2V0dGVycy5cbiAgICpcbiAgICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIHRvIGNyZWF0ZSBzaGFkZXIgcHJvZ3JhbXMgZm9yXG4gICAqIEBwYXJhbSBwcmltaXRpdmUgLSBUaGUgcHJpbWl0aXZlIGdlb21ldHJ5IHRoYXQgd2lsbCB1c2UgdGhpcyBtYXRlcmlhbFxuICAgKiBAcGFyYW0gdmVydGV4U2hhZGVyTWV0aG9kRGVmaW5pdGlvbnNGb3JWZXJ0ZXhTaGFkZXIgLSBXR1NMIGNvZGUgY29udGFpbmluZyB2ZXJ0ZXggc2hhZGVyIGhlbHBlciBtZXRob2RzXG4gICAqIEBwYXJhbSB2ZXJ0ZXhTaGFkZXJNZXRob2REZWZpbml0aW9uc0ZvclBpeGVsU2hhZGVyIC0gV0dTTCBjb2RlIGNvbnRhaW5pbmcgcGl4ZWwgc2hhZGVyIGhlbHBlciBtZXRob2RzXG4gICAqIEBwYXJhbSBwcm9wZXJ0eVNldHRlciAtIEZ1bmN0aW9uIHRvIGdlbmVyYXRlIHByb3BlcnR5IGFjY2Vzc29yIG1ldGhvZHNcbiAgICovXG4gIHB1YmxpYyBzZXR1cFNoYWRlckZvck1hdGVyaWFsKFxuICAgIG1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgICBwcmltaXRpdmU6IFByaW1pdGl2ZSxcbiAgICB2ZXJ0ZXhTaGFkZXJNZXRob2REZWZpbml0aW9uc0ZvclZlcnRleFNoYWRlcjogc3RyaW5nLFxuICAgIHZlcnRleFNoYWRlck1ldGhvZERlZmluaXRpb25zRm9yUGl4ZWxTaGFkZXI6IHN0cmluZyxcbiAgICBwcm9wZXJ0eVNldHRlck9mR2xvYmFsRGF0YVJlcG9zaXRvcnk6IGdldFNoYWRlclByb3BlcnR5RnVuY09mR2xvYmFsRGF0YVJlcG9zaXRvcnksXG4gICAgcHJvcGVydHlTZXR0ZXJPZk1hdGVyaWFsOiBnZXRTaGFkZXJQcm9wZXJ0eUZ1bmNPZk1hdGVyaWFsLFxuICAgIG1vcnBoZWRQb3NpdGlvbkdldHRlcjogc3RyaW5nXG4gICk6IHZvaWQge1xuICAgIG1hdGVyaWFsLl9jcmVhdGVQcm9ncmFtV2ViR3B1KFxuICAgICAgdGhpcy5fX2VuZ2luZSxcbiAgICAgIHByaW1pdGl2ZSxcbiAgICAgIHZlcnRleFNoYWRlck1ldGhvZERlZmluaXRpb25zRm9yVmVydGV4U2hhZGVyLFxuICAgICAgdmVydGV4U2hhZGVyTWV0aG9kRGVmaW5pdGlvbnNGb3JQaXhlbFNoYWRlcixcbiAgICAgIHByb3BlcnR5U2V0dGVyT2ZHbG9iYWxEYXRhUmVwb3NpdG9yeSxcbiAgICAgIHByb3BlcnR5U2V0dGVyT2ZNYXRlcmlhbCxcbiAgICAgIG1vcnBoZWRQb3NpdGlvbkdldHRlclxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgcHJlLXJlbmRlcmluZyBvcGVyYXRpb25zIHJlcXVpcmVkIGJlZm9yZSBkcmF3aW5nLlxuICAgKiBVcGRhdGVzIHN0b3JhZ2UgYnVmZmVycyB3aGVuIGNvbXBvbmVudHMgaGF2ZSBiZWVuIG1vZGlmaWVkIGFuZCBoYW5kbGVzIG1vcnBoIHRhcmdldCB1cGRhdGVzLlxuICAgKiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgY2FsbGVkIG9uY2UgcGVyIGZyYW1lIGJlZm9yZSBhbnkgcmVuZGVyaW5nIG9wZXJhdGlvbnMuXG4gICAqL1xuICBwcmVyZW5kZXIoKTogdm9pZCB7XG4gICAgLy8gUmUtdXBsb2FkIHRoZSBHUFUgaW5zdGFuY2UgZGF0YSB3aGVuIGFueSBvZiBpdHMgc291cmNlcyBjaGFuZ2VkLiBUaGUgbGlnaHQgY2x1c3RlciBzeXN0ZW0gd3JpdGVzIHRoZVxuICAgIC8vIGFsbC1saWdodCBsaXN0IGFuZCB0aGUgY2x1c3RlciB0YWJsZXMgaW50byB0aGUgc2FtZSBzdG9yYWdlIGJ1ZmZlciwgc28gaXRzIGBkYXRhVmVyc2lvbmAgaXMgY29tcGFyZWQgaGVyZVxuICAgIC8vIGxpa2UgdGhlIGNvbXBvbmVudCB1cGRhdGUgY291bnRzLlxuICAgIGlmIChcbiAgICAgIEFuaW1hdGlvbkNvbXBvbmVudC5nZXRJc0FuaW1hdGluZyh0aGlzLl9fZW5naW5lKSB8fFxuICAgICAgVHJhbnNmb3JtQ29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpICE9PSB0aGlzLl9fbGFzdFRyYW5zZm9ybUNvbXBvbmVudHNVcGRhdGVDb3VudCB8fFxuICAgICAgU2NlbmVHcmFwaENvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKSAhPT0gdGhpcy5fX2xhc3RTY2VuZUdyYXBoQ29tcG9uZW50c1VwZGF0ZUNvdW50IHx8XG4gICAgICBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudENhbWVyYVVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpICE9PSB0aGlzLl9fbGFzdENhbWVyYUNvbXBvbmVudHNVcGRhdGVDb3VudCB8fFxuICAgICAgX2dldENhbWVyYUNvbnRyb2xsZXJVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKSAhPT0gdGhpcy5fX2xhc3RDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50c1VwZGF0ZUNvdW50IHx8XG4gICAgICB0aGlzLl9fZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5zdGF0ZVZlcnNpb24gIT09IHRoaXMuX19sYXN0TWF0ZXJpYWxzVXBkYXRlQ291bnQgfHxcbiAgICAgIHRoaXMuX19lbmdpbmUubGlnaHRDbHVzdGVyU3lzdGVtLmRhdGFWZXJzaW9uICE9PSB0aGlzLl9fbGFzdExpZ2h0Q2x1c3RlckRhdGFWZXJzaW9uIHx8XG4gICAgICBMaWdodENvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKSAhPT0gdGhpcy5fX2xhc3RMaWdodENvbXBvbmVudHNVcGRhdGVDb3VudCB8fFxuICAgICAgdGhpcy5fX2VuZ2luZS5fZ3B1SW5zdGFuY2VEYXRhVmVyc2lvbiAhPT0gdGhpcy5fX2xhc3RHcHVJbnN0YW5jZURhdGFWZXJzaW9uXG4gICAgKSB7XG4gICAgICBjb25zdCBpc1N0b3JhZ2VCdWZmZXJSZWNyZWF0ZWQgPSB0aGlzLl9fY3JlYXRlQW5kVXBkYXRlU3RvcmFnZUJ1ZmZlcigpO1xuICAgICAgLy8gVGhlIEdQVSBjdWxsaW5nIHJlYWRzIHRoZSB0cmFuc2Zvcm1zIGFuZCB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgaW5zdGFuY2VzIGZyb20gdGhlIEdQVSBpbnN0YW5jZSBkYXRhLlxuICAgICAgdGhpcy5fX2VuZ2luZS53ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuX21hcmtHcHVDdWxsaW5nSW5wdXRzRGlydHkoKTtcbiAgICAgIC8vIFRoZSBjb21wdXRlIHNoYWRlcnMgcmVidWlsZCB0aGUgbGlnaHQgY2x1c3RlcnMgd2hlbiB0aGVpciBpbnB1dHMgY2hhbmdlZCwgYW5kIGFmdGVyIGEgbmV3IHN0b3JhZ2UgYnVmZmVyIHdhc1xuICAgICAgLy8gY3JlYXRlZCBmcm9tIHRoZSBDUFUgZGF0YSAod2hpY2ggZG9lcyBub3QgY29udGFpbiB0aGUgY2x1c3RlcnMgYnVpbHQgb24gdGhlIEdQVSkuXG4gICAgICAvLyBUaGUgb3JkZXIgbWF0dGVyczogdGhlIGJ1aWxkIGRpc3BhdGNoZXMgbXVzdCBiZSByZWNvcmRlZCBhZnRlciB0aGUgdXBsb2Fkcywgc28gdGhhdCB0aGV5IG92ZXJ3cml0ZSB0aGVcbiAgICAgIC8vIChzdGFsZSBvciB6ZXJvZWQpIGNsdXN0ZXIgcmVnaW9ucyBvZiB0aGUgQ1BVIGRhdGEuXG4gICAgICBjb25zdCBsaWdodENsdXN0ZXJEYXRhVmVyc2lvbiA9IHRoaXMuX19lbmdpbmUubGlnaHRDbHVzdGVyU3lzdGVtLmRhdGFWZXJzaW9uO1xuICAgICAgaWYgKGlzU3RvcmFnZUJ1ZmZlclJlY3JlYXRlZCB8fCBsaWdodENsdXN0ZXJEYXRhVmVyc2lvbiAhPT0gdGhpcy5fX2xhc3RMaWdodENsdXN0ZXJCdWlsZERhdGFWZXJzaW9uKSB7XG4gICAgICAgIHRoaXMuX19idWlsZExpZ2h0Q2x1c3RlcnNPbkdwdSgpO1xuICAgICAgICB0aGlzLl9fbGFzdExpZ2h0Q2x1c3RlckJ1aWxkRGF0YVZlcnNpb24gPSBsaWdodENsdXN0ZXJEYXRhVmVyc2lvbjtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19sYXN0VHJhbnNmb3JtQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gVHJhbnNmb3JtQ29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICAgICAgdGhpcy5fX2xhc3RTY2VuZUdyYXBoQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gU2NlbmVHcmFwaENvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKTtcbiAgICAgIHRoaXMuX19sYXN0Q2FtZXJhQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gQ2FtZXJhQ29tcG9uZW50LmdldEN1cnJlbnRDYW1lcmFVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKTtcbiAgICAgIHRoaXMuX19sYXN0Q2FtZXJhQ29udHJvbGxlckNvbXBvbmVudHNVcGRhdGVDb3VudCA9IF9nZXRDYW1lcmFDb250cm9sbGVyVXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSk7XG4gICAgICB0aGlzLl9fbGFzdE1hdGVyaWFsc1VwZGF0ZUNvdW50ID0gdGhpcy5fX2VuZ2luZS5tYXRlcmlhbFJlcG9zaXRvcnkuc3RhdGVWZXJzaW9uO1xuICAgICAgdGhpcy5fX2xhc3RMaWdodENsdXN0ZXJEYXRhVmVyc2lvbiA9IHRoaXMuX19lbmdpbmUubGlnaHRDbHVzdGVyU3lzdGVtLmRhdGFWZXJzaW9uO1xuICAgICAgdGhpcy5fX2xhc3RMaWdodENvbXBvbmVudHNVcGRhdGVDb3VudCA9IExpZ2h0Q29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICAgICAgdGhpcy5fX2xhc3RHcHVJbnN0YW5jZURhdGFWZXJzaW9uID0gdGhpcy5fX2VuZ2luZS5fZ3B1SW5zdGFuY2VEYXRhVmVyc2lvbjtcbiAgICB9XG5cbiAgICBjb25zdCBtb3JwaE1heEluZGV4ID0gUHJpbWl0aXZlLmdldFByaW1pdGl2ZUNvdW50SGFzTW9ycGgoKTtcbiAgICBpZiAobW9ycGhNYXhJbmRleCAhPT0gdGhpcy5fX2xhc3RNb3JwaE1heEluZGV4KSB7XG4gICAgICB0aGlzLl9fY3JlYXRlT3JVcGRhdGVTdG9yYWdlQmxlbmRTaGFwZUJ1ZmZlcigpO1xuICAgICAgdGhpcy5fX2xhc3RNb3JwaE1heEluZGV4ID0gbW9ycGhNYXhJbmRleDtcbiAgICAgIC8vIFRoZSB2ZXJ0ZXggZGVmb3JtYXRpb24gb2YgdGhlIEdQVSBjdWxsaW5nIHJlYWRzIHRoZSBtb3JwaCB0YXJnZXRzLlxuICAgICAgdGhpcy5fX2VuZ2luZS53ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuX21hcmtHcHVDdWxsaW5nSW5wdXRzRGlydHkoKTtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICBCbGVuZFNoYXBlQ29tcG9uZW50LnVwZGF0ZUNvdW50ICE9PSB0aGlzLl9fbGFzdEJsZW5kU2hhcGVDb21wb25lbnRzVXBkYXRlQ291bnRGb3JXZWlnaHRzIHx8XG4gICAgICBCbGVuZFNoYXBlQ29tcG9uZW50LmdldENvdW50T2ZCbGVuZFNoYXBlQ29tcG9uZW50cyh0aGlzLl9fZW5naW5lKSAhPT0gdGhpcy5fX2NvdW50T2ZCbGVuZFNoYXBlQ29tcG9uZW50c1xuICAgICkge1xuICAgICAgdGhpcy5fX3VwZGF0ZU1vcnBoV2VpZ2h0c1VuaWZvcm1CdWZmZXIoKTtcbiAgICAgIC8vIFRoZSB2ZXJ0ZXggZGVmb3JtYXRpb24gb2YgdGhlIEdQVSBjdWxsaW5nIHJlYWRzIHRoZSBibGVuZCBzaGFwZSB3ZWlnaHRzLlxuICAgICAgdGhpcy5fX2VuZ2luZS53ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuX21hcmtHcHVDdWxsaW5nSW5wdXRzRGlydHkoKTtcbiAgICAgIHRoaXMuX19sYXN0QmxlbmRTaGFwZUNvbXBvbmVudHNVcGRhdGVDb3VudEZvcldlaWdodHMgPSBCbGVuZFNoYXBlQ29tcG9uZW50LnVwZGF0ZUNvdW50O1xuICAgICAgdGhpcy5fX2NvdW50T2ZCbGVuZFNoYXBlQ29tcG9uZW50cyA9IEJsZW5kU2hhcGVDb21wb25lbnQuZ2V0Q291bnRPZkJsZW5kU2hhcGVDb21wb25lbnRzKHRoaXMuX19lbmdpbmUpO1xuICAgICAgdGhpcy5fX2VuZ2luZS5tYXRlcmlhbFJlcG9zaXRvcnkuX21ha2VTaGFkZXJJbnZhbGlkYXRlVG9Nb3JwaE1hdGVyaWFscygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fc2V0dGxlUHJldmlvdXNNb3JwaFdlaWdodHMoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTWFpbiByZW5kZXJpbmcgbWV0aG9kIHRoYXQgZHJhd3MgYWxsIHByaW1pdGl2ZXMgaW4gdGhlIHNwZWNpZmllZCByZW5kZXIgcGFzcy5cbiAgICogSGFuZGxlcyBkaWZmZXJlbnQgcHJpbWl0aXZlIHR5cGVzIChvcGFxdWUsIHRyYW5zbHVjZW50LCBibGVuZCkgd2l0aCBhcHByb3ByaWF0ZSBkZXB0aCB3cml0aW5nIHNldHRpbmdzLlxuICAgKlxuICAgKiBAcGFyYW0gcHJpbWl0aXZlVWlkcyAtIEFycmF5IG9mIHByaW1pdGl2ZSBVSURzIHRvIHJlbmRlciwgc29ydGVkIGJ5IHJlbmRlcmluZyBvcmRlclxuICAgKiBAcGFyYW0gcmVuZGVyUGFzcyAtIFRoZSByZW5kZXIgcGFzcyBjb25maWd1cmF0aW9uIGNvbnRhaW5pbmcgcmVuZGVyaW5nIHNldHRpbmdzXG4gICAqIEBwYXJhbSByZW5kZXJQYXNzVGlja0NvdW50IC0gQ3VycmVudCB0aWNrIGNvdW50IGZvciBhbmltYXRpb24gYW5kIHRpbWluZyBwdXJwb3Nlc1xuICAgKiBAcGFyYW0gZGlzcGxheUlkeCAtIFRoZSBpbmRleCBvZiB0aGUgZGlzcGxheSB0byByZW5kZXIgdG9cbiAgICogQHJldHVybnMgVHJ1ZSBpZiBhbnkgcHJpbWl0aXZlcyB3ZXJlIHN1Y2Nlc3NmdWxseSByZW5kZXJlZFxuICAgKi9cbiAgY29tbW9uXyRyZW5kZXIoXG4gICAgcHJpbWl0aXZlVWlkczogUHJpbWl0aXZlVUlEW10sXG4gICAgcmVuZGVyUGFzczogUmVuZGVyUGFzcyxcbiAgICBfcmVuZGVyUGFzc1RpY2tDb3VudDogQ291bnQsXG4gICAgZGlzcGxheUlkeDogSW5kZXhcbiAgKTogYm9vbGVhbiB7XG4gICAgaWYgKHJlbmRlclBhc3MuaXNCdWZmZXJMZXNzUmVuZGVyaW5nTW9kZSgpKSB7XG4gICAgICB0aGlzLl9fcmVuZGVyV2l0aG91dEJ1ZmZlcnMocmVuZGVyUGFzcyk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBsZXQgcmVuZGVyZWRTb21ldGhpbmcgPSBmYWxzZTtcbiAgICBjb25zdCBpc1pXcml0ZSA9IHJlbmRlclBhc3MuaXNEZXB0aFRlc3QgJiYgcmVuZGVyUGFzcy5kZXB0aFdyaXRlTWFzaztcbiAgICBjb25zdCB1c2VEZXB0aFByZXBhc3MgPSB0aGlzLl9faXNEZXB0aFByZXBhc3NBdmFpbGFibGUocmVuZGVyUGFzcyk7XG4gICAgLy8gRHJhdyB0aGUgb3BhcXVlIHByaW1pdGl2ZXMgZGVwdGgtb25seSBmaXJzdCwgc28gdGhlIGNvbG9yIHBhc3MgY2FuIHJlamVjdCBoaWRkZW4gZnJhZ21lbnRzIGJlZm9yZSBzaGFkaW5nLlxuICAgIGlmICh1c2VEZXB0aFByZXBhc3MpIHtcbiAgICAgIGZvciAobGV0IGkgPSByZW5kZXJQYXNzLl9sYXN0T3BhcXVlSW5kZXg7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIHRoaXMucmVuZGVySW5uZXIocHJpbWl0aXZlVWlkc1tpXSwgcmVuZGVyUGFzcywgdHJ1ZSwgZGlzcGxheUlkeCwgeyBkZXB0aE9ubHk6IHRydWUgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIEZvciBvcGFxdWUgcHJpbWl0aXZlc1xuICAgIGlmIChyZW5kZXJQYXNzLl90b1JlbmRlck9wYXF1ZVByaW1pdGl2ZXMpIHtcbiAgICAgIGZvciAobGV0IGkgPSByZW5kZXJQYXNzLl9sYXN0T3BhcXVlSW5kZXg7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIC8vIERyYXdpbmcgZnJvbSB0aGUgbmVhcmVzdCBvYmplY3RcbiAgICAgICAgY29uc3QgcHJpbWl0aXZlVWlkID0gcHJpbWl0aXZlVWlkc1tpXTtcbiAgICAgICAgY29uc3QgcmVuZGVyZWQgPSB0aGlzLnJlbmRlcklubmVyKHByaW1pdGl2ZVVpZCwgcmVuZGVyUGFzcywgaXNaV3JpdGUsIGRpc3BsYXlJZHgsIHtcbiAgICAgICAgICBhbGxvd0VxdWFsRGVwdGg6IHVzZURlcHRoUHJlcGFzcyxcbiAgICAgICAgfSk7XG4gICAgICAgIHJlbmRlcmVkU29tZXRoaW5nIHx8PSByZW5kZXJlZDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBGb3IgdHJhbnNsdWNlbnQgcHJpbWl0aXZlc1xuICAgIGlmIChyZW5kZXJQYXNzLl90b1JlbmRlclRyYW5zbHVjZW50UHJpbWl0aXZlcykge1xuICAgICAgLy8gRHJhdyBUcmFuc2x1Y2VudCBwcmltaXRpdmVzXG4gICAgICBmb3IgKGxldCBpID0gcmVuZGVyUGFzcy5fbGFzdE9wYXF1ZUluZGV4ICsgMTsgaSA8PSByZW5kZXJQYXNzLl9sYXN0VHJhbnNsdWNlbnRJbmRleDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHByaW1pdGl2ZVVpZCA9IHByaW1pdGl2ZVVpZHNbaV07XG4gICAgICAgIGNvbnN0IHJlbmRlcmVkID0gdGhpcy5yZW5kZXJJbm5lcihwcmltaXRpdmVVaWQsIHJlbmRlclBhc3MsIGlzWldyaXRlLCBkaXNwbGF5SWR4KTtcbiAgICAgICAgcmVuZGVyZWRTb21ldGhpbmcgfHw9IHJlbmRlcmVkO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChyZW5kZXJQYXNzLl90b1JlbmRlckJsZW5kV2l0aFpXcml0ZVByaW1pdGl2ZXMpIHtcbiAgICAgIC8vIERyYXcgQmxlbmQgcHJpbWl0aXZlcyB3aXRoIFpXcml0ZVxuICAgICAgZm9yIChsZXQgaSA9IHJlbmRlclBhc3MuX2xhc3RUcmFuc2x1Y2VudEluZGV4ICsgMTsgaSA8PSByZW5kZXJQYXNzLl9sYXN0QmxlbmRXaXRoWldyaXRlSW5kZXg7IGkrKykge1xuICAgICAgICBjb25zdCBwcmltaXRpdmVVaWQgPSBwcmltaXRpdmVVaWRzW2ldO1xuICAgICAgICBjb25zdCByZW5kZXJlZCA9IHRoaXMucmVuZGVySW5uZXIocHJpbWl0aXZlVWlkLCByZW5kZXJQYXNzLCBpc1pXcml0ZSwgZGlzcGxheUlkeCk7XG4gICAgICAgIHJlbmRlcmVkU29tZXRoaW5nIHx8PSByZW5kZXJlZDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocmVuZGVyUGFzcy5fdG9SZW5kZXJCbGVuZFdpdGhvdXRaV3JpdGVQcmltaXRpdmVzKSB7XG4gICAgICAvLyBEcmF3IEJsZW5kIHByaW1pdGl2ZXMgd2l0aG91dCBaV3JpdGVcbiAgICAgIGZvciAobGV0IGkgPSByZW5kZXJQYXNzLl9sYXN0QmxlbmRXaXRoWldyaXRlSW5kZXggKyAxOyBpIDw9IHJlbmRlclBhc3MuX2xhc3RCbGVuZFdpdGhvdXRaV3JpdGVJbmRleDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHByaW1pdGl2ZVVpZCA9IHByaW1pdGl2ZVVpZHNbaV07XG4gICAgICAgIGNvbnN0IHJlbmRlcmVkID0gdGhpcy5yZW5kZXJJbm5lcihwcmltaXRpdmVVaWQsIHJlbmRlclBhc3MsIGZhbHNlLCBkaXNwbGF5SWR4KTtcbiAgICAgICAgcmVuZGVyZWRTb21ldGhpbmcgfHw9IHJlbmRlcmVkO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZW5kZXJlZFNvbWV0aGluZztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5kZXJzIHByaW1pdGl2ZXMgd2l0aG91dCB1c2luZyB2ZXJ0ZXgvaW5kZXggYnVmZmVycy5cbiAgICogVGhpcyBpcyB1c2VkIGZvciBzcGVjaWFsIHJlbmRlcmluZyBtb2RlcyBsaWtlIGZ1bGwtc2NyZWVuIGVmZmVjdHMgb3IgcHJvY2VkdXJhbCBnZW9tZXRyeS5cbiAgICpcbiAgICogQHBhcmFtIHJlbmRlclBhc3MgLSBUaGUgcmVuZGVyIHBhc3MgY29udGFpbmluZyB0aGUgbWF0ZXJpYWwgYW5kIHJlbmRlcmluZyBjb25maWd1cmF0aW9uXG4gICAqL1xuICBwcml2YXRlIF9fcmVuZGVyV2l0aG91dEJ1ZmZlcnMocmVuZGVyUGFzczogUmVuZGVyUGFzcykge1xuICAgIGNvbnN0IG1hdGVyaWFsID0gcmVuZGVyUGFzcy5tYXRlcmlhbCE7XG4gICAgY29uc3QgcHJpbWl0aXZlID0gcmVuZGVyUGFzcy5fZHVtbXlQcmltaXRpdmVGb3JCdWZmZXJMZXNzUmVuZGVyaW5nO1xuICAgIHRoaXMuX3NldHVwU2hhZGVyUHJvZ3JhbShtYXRlcmlhbCwgcHJpbWl0aXZlKTtcblxuICAgIGNvbnN0IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGNvbnN0IGNhbWVyYVNJRCA9IHRoaXMuX19nZXRBcHByb3ByaWF0ZUNhbWVyYUNvbXBvbmVudFNJRChyZW5kZXJQYXNzLCAwLCBmYWxzZSk7XG4gICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LnNldERyYXdQYXJhbWV0ZXJzKG1hdGVyaWFsLm1hdGVyaWFsU0lELCBjYW1lcmFTSUQsIDAsIDApO1xuICAgIGNvbnN0IGlzWldyaXRlID0gcmVuZGVyUGFzcy5pc0RlcHRoVGVzdCAmJiByZW5kZXJQYXNzLmRlcHRoV3JpdGVNYXNrO1xuICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5kcmF3KHRoaXMuX19lbmdpbmUsIHByaW1pdGl2ZSwgbWF0ZXJpYWwsIHJlbmRlclBhc3MsIGNhbWVyYVNJRCwgaXNaV3JpdGUsIDApO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGRlcHRoIHByZXBhc3MgY2FuIHJ1biBmb3IgdGhlIHJlbmRlciBwYXNzOiBpdCBtdXN0IGJlIGVuYWJsZWQsIGRyYXcgdGhlIHNjZW5lIGl0c2VsZiAocmVuZGVyIHBhc3Nlc1xuICAgKiB3aXRoIGEgbWF0ZXJpYWwgb3ZlcnJpZGUgc3VjaCBhcyBzaGFkb3cgbWFwcyBhbmQgcG9zdCBlZmZlY3RzIGFyZSBleGNsdWRlZCksIGFuZCB3cml0ZSBkZXB0aC5cbiAgICovXG4gIHByaXZhdGUgX19pc0RlcHRoUHJlcGFzc0F2YWlsYWJsZShyZW5kZXJQYXNzOiBSZW5kZXJQYXNzKSB7XG4gICAgY29uc3QgZnJhbWVidWZmZXIgPSByZW5kZXJQYXNzLmdldEZyYW1lYnVmZmVyKCk7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuX19lbmdpbmUuY29uZmlnLmlzRGVwdGhQcmVwYXNzRW5hYmxlZCAmJlxuICAgICAgcmVuZGVyUGFzcy5tYXRlcmlhbCA9PSBudWxsICYmXG4gICAgICByZW5kZXJQYXNzLmlzRGVwdGhUZXN0ICYmXG4gICAgICByZW5kZXJQYXNzLmRlcHRoV3JpdGVNYXNrICYmXG4gICAgICAoZnJhbWVidWZmZXIgPT0gbnVsbCB8fCBmcmFtZWJ1ZmZlci5kZXB0aEF0dGFjaG1lbnQgIT0gbnVsbCkgJiZcbiAgICAgIHJlbmRlclBhc3MuX3RvUmVuZGVyT3BhcXVlUHJpbWl0aXZlcyAmJlxuICAgICAgcmVuZGVyUGFzcy5fbGFzdE9wYXF1ZUluZGV4ID49IDBcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbmRlcnMgYSBzaW5nbGUgcHJpbWl0aXZlIHdpdGggdGhlIHNwZWNpZmllZCBtYXRlcmlhbCBhbmQgcmVuZGVyIHNldHRpbmdzLlxuICAgKiBIYW5kbGVzIHNoYWRlciBzZXR1cCwgdW5pZm9ybSBidWZmZXIgdXBkYXRlcywgYW5kIHRoZSBhY3R1YWwgZHJhdyBjYWxsLlxuICAgKlxuICAgKiBAcGFyYW0gcHJpbWl0aXZlVWlkIC0gVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIHByaW1pdGl2ZSB0byByZW5kZXJcbiAgICogQHBhcmFtIHJlbmRlclBhc3MgLSBSZW5kZXIgcGFzcyBjb250YWluaW5nIHJlbmRlcmluZyBjb25maWd1cmF0aW9uXG4gICAqIEBwYXJhbSB6V3JpdGUgLSBXaGV0aGVyIHRvIGVuYWJsZSBkZXB0aCBidWZmZXIgd3JpdGluZ1xuICAgKiBAcGFyYW0gZGlzcGxheUlkeCAtIFRoZSBpbmRleCBvZiB0aGUgZGlzcGxheSB0byByZW5kZXIgdG9cbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgcHJpbWl0aXZlIHdhcyBzdWNjZXNzZnVsbHkgcmVuZGVyZWRcbiAgICovXG4gIHJlbmRlcklubmVyKFxuICAgIHByaW1pdGl2ZVVpZDogUHJpbWl0aXZlVUlELFxuICAgIHJlbmRlclBhc3M6IFJlbmRlclBhc3MsXG4gICAgeldyaXRlOiBib29sZWFuLFxuICAgIGRpc3BsYXlJZHg6IEluZGV4LFxuICAgIG9wdGlvbnM6IHsgZGVwdGhPbmx5PzogYm9vbGVhbjsgYWxsb3dFcXVhbERlcHRoPzogYm9vbGVhbiB9ID0ge31cbiAgKSB7XG4gICAgaWYgKHByaW1pdGl2ZVVpZCA9PT0gLTEpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgcHJpbWl0aXZlID0gUHJpbWl0aXZlLmdldFByaW1pdGl2ZShwcmltaXRpdmVVaWQpO1xuICAgIGlmIChwcmltaXRpdmUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBtYXRlcmlhbDogTWF0ZXJpYWwgPSByZW5kZXJQYXNzLmdldEFwcHJvcHJpYXRlTWF0ZXJpYWwocHJpbWl0aXZlKTtcbiAgICB0aGlzLl9zZXR1cFNoYWRlclByb2dyYW0obWF0ZXJpYWwsIHByaW1pdGl2ZSk7XG4gICAgaWYgKGlzU2tpcERyYXdpbmcobWF0ZXJpYWwsIHByaW1pdGl2ZSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgb3B0aW9ucy5kZXB0aE9ubHkgJiZcbiAgICAgIChtYXRlcmlhbC5hbHBoYU1vZGUgPT09IEFscGhhTW9kZS5NYXNrIHx8IG1hdGVyaWFsLmFscGhhVG9Db3ZlcmFnZSB8fCBtYXRlcmlhbC5pc1NoYWRlckRlZmluZSgnUk5fVVNFX1dJUkVGUkFNRScpKVxuICAgICkge1xuICAgICAgLy8gVGhlIHByZXBhc3MgY2Fubm90IGRpc2NhcmQgKG9yIGFwcGx5IGEgcGVyLXNhbXBsZSBjb3ZlcmFnZSksIHNvIHRob3NlIHByaW1pdGl2ZXMga2VlcCB0aGVpciBub3JtYWwgZHJhd1xuICAgICAgLy8gYW5kIGRlcHRoIHdyaXRlLiBJbmNsdWRpbmcgdGhlbSB3b3VsZCBvY2NsdWRlIHRoZSBzdXJmYWNlcyBiZWhpbmQgdGhlIGRpc2NhcmRlZCBmcmFnbWVudHMuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3Qgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy5fX2VuZ2luZS53ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgY29uc3Qgd2VieHJTeXN0ZW0gPSB0aGlzLl9fZW5naW5lLl93ZWJYUlN5c3RlbUlmRW5hYmxlZDtcbiAgICBjb25zdCBjYW1lcmFTSUQgPSB0aGlzLl9fZ2V0QXBwcm9wcmlhdGVDYW1lcmFDb21wb25lbnRTSUQoXG4gICAgICByZW5kZXJQYXNzLFxuICAgICAgZGlzcGxheUlkeCBhcyAwIHwgMSxcbiAgICAgICh3ZWJ4clN5c3RlbT8uaXNXZWJYUk1vZGUgPz8gZmFsc2UpICYmIHJlbmRlclBhc3MuaXNWclJlbmRlcmluZ1xuICAgICk7XG5cbiAgICBjb25zdCBwcmltaXRpdmVJZHhIYXNNb3JwaCA9IFByaW1pdGl2ZS5nZXRQcmltaXRpdmVJZHhIYXNNb3JwaChwcmltaXRpdmUucHJpbWl0aXZlVWlkKSA/PyAwO1xuICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5zZXREcmF3UGFyYW1ldGVycyhcbiAgICAgIG1hdGVyaWFsLm1hdGVyaWFsU0lELFxuICAgICAgY2FtZXJhU0lELFxuICAgICAgcHJpbWl0aXZlSWR4SGFzTW9ycGgsXG4gICAgICBwcmltaXRpdmUudGFyZ2V0cy5sZW5ndGhcbiAgICApO1xuICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5kcmF3KFxuICAgICAgdGhpcy5fX2VuZ2luZSxcbiAgICAgIHByaW1pdGl2ZSxcbiAgICAgIG1hdGVyaWFsLFxuICAgICAgcmVuZGVyUGFzcyxcbiAgICAgIGNhbWVyYVNJRCxcbiAgICAgIHpXcml0ZSxcbiAgICAgIGRpc3BsYXlJZHgsXG4gICAgICBvcHRpb25zXG4gICAgKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIG9yIHVwZGF0ZXMgdGhlIG1haW4gc3RvcmFnZSBidWZmZXIgY29udGFpbmluZyBhbGwgR1BVIGluc3RhbmNlIGRhdGEuXG4gICAqIFRoaXMgYnVmZmVyIGhvbGRzIHRyYW5zZm9ybSBtYXRyaWNlcywgbWF0ZXJpYWwgcHJvcGVydGllcywgYW5kIG90aGVyIHBlci1pbnN0YW5jZSBkYXRhXG4gICAqIHJlcXVpcmVkIGZvciByZW5kZXJpbmcgYWxsIG9iamVjdHMgaW4gdGhlIHNjZW5lLlxuICAgKi9cbiAgcHJpdmF0ZSBfX2NyZWF0ZUFuZFVwZGF0ZVN0b3JhZ2VCdWZmZXIoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbWVtb3J5TWFuYWdlciA9IHRoaXMuX19lbmdpbmUubWVtb3J5TWFuYWdlcjtcblxuICAgIC8vIHRoZSBHUFUgZ2xvYmFsIFN0b3JhZ2VcbiAgICBjb25zdCBncHVJbnN0YW5jZURhdGFCdWZmZXJzID0gbWVtb3J5TWFuYWdlci5nZXRCdWZmZXJzKEJ1ZmZlclVzZS5HUFVJbnN0YW5jZURhdGEpO1xuICAgIGNvbnN0IGdwdUluc3RhbmNlRGF0YUJ1ZmZlckNvdW50ID0gZ3B1SW5zdGFuY2VEYXRhQnVmZmVycy5sZW5ndGg7XG4gICAgY29uc3Qgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy5fX2VuZ2luZS53ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgaWYgKGdwdUluc3RhbmNlRGF0YUJ1ZmZlckNvdW50ICE9PSB0aGlzLl9fbGFzdEdwdUluc3RhbmNlRGF0YUJ1ZmZlckNvdW50KSB7XG4gICAgICB0aGlzLl9fbGFzdEdwdUluc3RhbmNlRGF0YUJ1ZmZlckNvdW50ID0gZ3B1SW5zdGFuY2VEYXRhQnVmZmVyQ291bnQ7XG4gICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuZGVzdHJveVN0b3JhZ2VCdWZmZXIodGhpcy5fX3N0b3JhZ2VCdWZmZXJVaWQpO1xuICAgICAgdGhpcy5fX3N0b3JhZ2VCdWZmZXJVaWQgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgICB9XG5cbiAgICAvLyBjb25zdCBkYXRhVGV4dHVyZUJ5dGVTaXplID1cbiAgICAvLyAgIE1lbW9yeU1hbmFnZXIuYnVmZmVyV2lkdGhMZW5ndGggKiBNZW1vcnlNYW5hZ2VyLmJ1ZmZlckhlaWdodExlbmd0aCAqIDQgKiA0O1xuICAgIGlmICh0aGlzLl9fc3RvcmFnZUJ1ZmZlclVpZCAhPT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQpIHtcbiAgICAgIC8vIFVwZGF0ZS4gVGhlIGxpZ2h0IGNsdXN0ZXIgbGlzdHMgYXJlIGxhcmdlIGFuZCB3cml0dGVuIGJ5IHRoZSBjb21wdXRlIHNoYWRlcnMgb3IgdXBsb2FkZWQgYXMgZGlydHkgcmFuZ2VzLFxuICAgICAgLy8gc28gdGhlIGdlbmVyaWMgdXBsb2FkIHNraXBzIHRoZW0uXG4gICAgICBjb25zdCBsaWdodENsdXN0ZXJTeXN0ZW0gPSB0aGlzLl9fZW5naW5lLmxpZ2h0Q2x1c3RlclN5c3RlbTtcbiAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS51cGRhdGVTdG9yYWdlQnVmZmVyKFxuICAgICAgICB0aGlzLl9fc3RvcmFnZUJ1ZmZlclVpZCxcbiAgICAgICAgZ3B1SW5zdGFuY2VEYXRhQnVmZmVycyxcbiAgICAgICAgbGlnaHRDbHVzdGVyU3lzdGVtLl9nZXRFeGNsdWRlZEJ5dGVSYW5nZXMoKVxuICAgICAgKTtcbiAgICAgIGNvbnN0IGRpcnR5UmFuZ2VzID0gbGlnaHRDbHVzdGVyU3lzdGVtLl90YWtlRGlydHlCeXRlUmFuZ2VzKCk7XG4gICAgICBpZiAoZGlydHlSYW5nZXMubGVuZ3RoID4gMCkge1xuICAgICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkudXBkYXRlU3RvcmFnZUJ1ZmZlclJhbmdlcyhcbiAgICAgICAgICB0aGlzLl9fc3RvcmFnZUJ1ZmZlclVpZCxcbiAgICAgICAgICBncHVJbnN0YW5jZURhdGFCdWZmZXJzLFxuICAgICAgICAgIGRpcnR5UmFuZ2VzXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIENyZWF0ZSAodXBsb2FkcyBldmVyeXRoaW5nLCBpbmNsdWRpbmcgdGhlIGxpZ2h0IGNsdXN0ZXJzIGJ1aWx0IG9uIHRoZSBDUFUpXG4gICAgdGhpcy5fX3N0b3JhZ2VCdWZmZXJVaWQgPSB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuY3JlYXRlU3RvcmFnZUJ1ZmZlcihncHVJbnN0YW5jZURhdGFCdWZmZXJzKTtcbiAgICB0aGlzLl9fZW5naW5lLmxpZ2h0Q2x1c3RlclN5c3RlbS5fdGFrZURpcnR5Qnl0ZVJhbmdlcygpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkcyB0aGUgQ2x1c3RlcmVkIEZvcndhcmQgbGlnaHQgY2x1c3RlciB0YWJsZXMgd2l0aCBjb21wdXRlIHNoYWRlcnMgd2hlbiB0aGUgTGlnaHRDbHVzdGVyU3lzdGVtXG4gICAqIGJ1aWxkcyB0aGVtIG9uIHRoZSBHUFUuIEl0IG11c3QgcnVuIGFmdGVyIGV2ZXJ5IHVwbG9hZCBvZiB0aGUgR1BVIGluc3RhbmNlIGRhdGEsIHdoaWNoIG92ZXJ3cml0ZXMgdGhlIHRhYmxlcy5cbiAgICovXG4gIHByaXZhdGUgX19idWlsZExpZ2h0Q2x1c3RlcnNPbkdwdSgpIHtcbiAgICBjb25zdCBwYXJhbXMgPSB0aGlzLl9fZW5naW5lLmxpZ2h0Q2x1c3RlclN5c3RlbS5fZ2V0R3B1QnVpbGRQYXJhbXMoKTtcbiAgICBpZiAocGFyYW1zID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy5fX2VuZ2luZS53ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgY29uc3Qgc3RvcmFnZUJ1ZmZlciA9IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5fZ2V0U3RvcmFnZUJ1ZmZlcigpO1xuICAgIGlmIChzdG9yYWdlQnVmZmVyID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fX2xpZ2h0Q2x1c3RlckJ1aWxkZXIgPz89IG5ldyBXZWJHcHVMaWdodENsdXN0ZXJCdWlsZGVyKFxuICAgICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmdldFdlYkdwdURldmljZVdyYXBwZXIoKS5ncHVEZXZpY2VcbiAgICApO1xuICAgIGNvbnN0IGdwdVRpbWVyID0gdGhpcy5fX2VuZ2luZS5ncHVUaW1lckVuYWJsZWQgPyB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuX2dldEdwdVRpbWVyKCkgOiB1bmRlZmluZWQ7XG4gICAgdGhpcy5fX2xpZ2h0Q2x1c3RlckJ1aWxkZXIuYnVpbGQoc3RvcmFnZUJ1ZmZlciwgcGFyYW1zLCBncHVUaW1lcik7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBvciB1cGRhdGVzIHRoZSBzdG9yYWdlIGJ1ZmZlciBjb250YWluaW5nIGJsZW5kIHNoYXBlIHZlcnRleCBkYXRhLlxuICAgKiBUaGlzIGJ1ZmZlciBob2xkcyBtb3JwaCB0YXJnZXQgcG9zaXRpb25zIGFuZCBvdGhlciB2ZXJ0ZXggYXR0cmlidXRlcyBuZWVkZWQgZm9yIGJsZW5kIHNoYXBlIGFuaW1hdGlvbi5cbiAgICovXG4gIHByaXZhdGUgX19jcmVhdGVPclVwZGF0ZVN0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyKCkge1xuICAgIGNvbnN0IG1lbW9yeU1hbmFnZXIgPSB0aGlzLl9fZW5naW5lLm1lbW9yeU1hbmFnZXI7XG5cbiAgICAvLyB0aGUgR1BVIGdsb2JhbCBTdG9yYWdlXG4gICAgY29uc3QgYmxlbmRTaGFwZURhdGFCdWZmZXJzOiBCdWZmZXJbXSA9IG1lbW9yeU1hbmFnZXIuZ2V0QnVmZmVycyhCdWZmZXJVc2UuR1BVVmVydGV4RGF0YSk7XG5cbiAgICBpZiAoYmxlbmRTaGFwZURhdGFCdWZmZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGJsZW5kU2hhcGVEYXRhQnVmZmVyQnl0ZUxlbmd0aCA9IGJsZW5kU2hhcGVEYXRhQnVmZmVycy5yZWR1Y2UoKGFjYywgYnVmZmVyKSA9PiBhY2MgKyBidWZmZXIuYnl0ZUxlbmd0aCwgMCk7XG5cbiAgICBpZiAoYmxlbmRTaGFwZURhdGFCdWZmZXJCeXRlTGVuZ3RoICE9PSB0aGlzLl9fc3RvcmFnZUJsZW5kU2hhcGVCdWZmZXJCeXRlTGVuZ3RoKSB7XG4gICAgICB0aGlzLl9fZW5naW5lLndlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5kZWxldGVTdG9yYWdlQmxlbmRTaGFwZUJ1ZmZlcih0aGlzLl9fc3RvcmFnZUJsZW5kU2hhcGVCdWZmZXJVaWQpO1xuICAgICAgdGhpcy5fX3N0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyVWlkID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gICAgICB0aGlzLl9fc3RvcmFnZUJsZW5kU2hhcGVCdWZmZXJCeXRlTGVuZ3RoID0gYmxlbmRTaGFwZURhdGFCdWZmZXJCeXRlTGVuZ3RoO1xuICAgIH1cblxuICAgIGNvbnN0IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGNvbnN0IGZsb2F0MzJBcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoYmxlbmRTaGFwZURhdGFCdWZmZXJCeXRlTGVuZ3RoIC8gNCk7XG4gICAgLy8gY29weSB0aGUgZGF0YSBmcm9tIHRoZSBibGVuZFNoYXBlRGF0YUJ1ZmZlcnMgdG8gdGhlIGZsb2F0MzJBcnJheVxuICAgIGxldCBvZmZzZXQgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmxlbmRTaGFwZURhdGFCdWZmZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBidWZmZXIgPSBibGVuZFNoYXBlRGF0YUJ1ZmZlcnNbaV07XG4gICAgICBmbG9hdDMyQXJyYXkuc2V0KG5ldyBGbG9hdDMyQXJyYXkoYnVmZmVyLmdldEFycmF5QnVmZmVyKCkpLCBvZmZzZXQpO1xuICAgICAgb2Zmc2V0ICs9IGJ1ZmZlci5ieXRlTGVuZ3RoIC8gNDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fX3N0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyVWlkICE9PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgLy8gVXBkYXRlXG4gICAgICBjb25zdCBjb21wb25lbnRTaXplRm9yRGF0YVRleHR1cmUgPSBibGVuZFNoYXBlRGF0YUJ1ZmZlckJ5dGVMZW5ndGggLyA0O1xuICAgICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LnVwZGF0ZVN0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyKFxuICAgICAgICB0aGlzLl9fc3RvcmFnZUJsZW5kU2hhcGVCdWZmZXJVaWQsXG4gICAgICAgIGZsb2F0MzJBcnJheSxcbiAgICAgICAgY29tcG9uZW50U2l6ZUZvckRhdGFUZXh0dXJlXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBDcmVhdGVcbiAgICAgIHRoaXMuX19zdG9yYWdlQmxlbmRTaGFwZUJ1ZmZlclVpZCA9IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5jcmVhdGVTdG9yYWdlQmxlbmRTaGFwZUJ1ZmZlcihmbG9hdDMyQXJyYXkpO1xuICAgIH1cblxuICAgIHRoaXMuX191cGRhdGVNb3JwaE9mZnNldHNVbmlmb3JtQnVmZmVyKCk7XG4gIH1cblxuICBwcml2YXRlIF9fdXBkYXRlTW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlcigpIHtcbiAgICBjb25zdCB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYkdwdVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBjb25zdCBtb3JwaFVuaWZvcm1EYXRhT2Zmc2V0cyA9IFByaW1pdGl2ZS5nZXRNb3JwaFVuaWZvcm1EYXRhT2Zmc2V0cygpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgUHJpbWl0aXZlLmdldFByaW1pdGl2ZUNvdW50SGFzTW9ycGgoKTsgaSsrKSB7XG4gICAgICBjb25zdCBwcmltaXRpdmUgPSBQcmltaXRpdmUuZ2V0UHJpbWl0aXZlSGFzTW9ycGgoaSk7XG4gICAgICBpZiAocHJpbWl0aXZlICE9IG51bGwpIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBwcmltaXRpdmUudGFyZ2V0cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGNvbnN0IHRhcmdldCA9IHByaW1pdGl2ZS50YXJnZXRzW2pdO1xuICAgICAgICAgIGNvbnN0IGFjY2Vzc29yID0gdGFyZ2V0LmdldChWZXJ0ZXhBdHRyaWJ1dGUuUG9zaXRpb24uWFlaKSBhcyBBY2Nlc3NvcjtcbiAgICAgICAgICBjb25zdCBieXRlT2Zmc2V0T2ZFeGlzdGluZ0J1ZmZlciA9IHRoaXMuX19lbmdpbmUubWVtb3J5TWFuYWdlci5nZXRCeXRlT2Zmc2V0T2ZFeGlzdGluZ0J1ZmZlcnMoXG4gICAgICAgICAgICBCdWZmZXJVc2UuR1BVVmVydGV4RGF0YSxcbiAgICAgICAgICAgIGFjY2Vzc29yLmJ1ZmZlclZpZXcuYnVmZmVyLmluZGV4T2ZUaGVCdWZmZXJVc2FnZVxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5fX3VuaWZvcm1Nb3JwaE9mZnNldHNUeXBlZEFycmF5IVttb3JwaFVuaWZvcm1EYXRhT2Zmc2V0c1tpXSArIGpdID1cbiAgICAgICAgICAgIChieXRlT2Zmc2V0T2ZFeGlzdGluZ0J1ZmZlciArIGFjY2Vzc29yLmJ5dGVPZmZzZXRJbkJ1ZmZlcikgLyA0IC8gNDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGVsZW1lbnROdW1Ub0NvcHkgPSBtb3JwaFVuaWZvcm1EYXRhT2Zmc2V0c1ttb3JwaFVuaWZvcm1EYXRhT2Zmc2V0cy5sZW5ndGggLSAxXTtcbiAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkudXBkYXRlVW5pZm9ybU1vcnBoT2Zmc2V0c0J1ZmZlcih0aGlzLl9fdW5pZm9ybU1vcnBoT2Zmc2V0c1R5cGVkQXJyYXkhLCBlbGVtZW50TnVtVG9Db3B5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHVuaWZvcm0gYnVmZmVycyBjb250YWluaW5nIG1vcnBoIHRhcmdldCB3ZWlnaHRzIGZvciBibGVuZCBzaGFwZSBhbmltYXRpb24uXG4gICAqIENvcGllcyB3ZWlnaHQgdmFsdWVzIGZyb20gYmxlbmQgc2hhcGUgY29tcG9uZW50cyB0byBHUFUtYWNjZXNzaWJsZSB1bmlmb3JtIGJ1ZmZlcnMuXG4gICAqL1xuICBwcml2YXRlIF9fdXBkYXRlTW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlcihpc05ld0J1ZmZlciA9IGZhbHNlKSB7XG4gICAgY29uc3QgbWVtb3J5TWFuYWdlciA9IHRoaXMuX19lbmdpbmUubWVtb3J5TWFuYWdlcjtcbiAgICBjb25zdCBibGVuZFNoYXBlRGF0YUJ1ZmZlcjogQnVmZmVyIHwgdW5kZWZpbmVkID0gbWVtb3J5TWFuYWdlci5nZXRCdWZmZXIoQnVmZmVyVXNlLkdQVVZlcnRleERhdGEpO1xuICAgIGlmIChibGVuZFNoYXBlRGF0YUJ1ZmZlciA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChibGVuZFNoYXBlRGF0YUJ1ZmZlci50YWtlblNpemVJbkJ5dGUgPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBlbGVtZW50TnVtVG9Db3B5ID0gQmxlbmRTaGFwZUNvbXBvbmVudC5fd3JpdGVNb3JwaFdlaWdodHNVbmlmb3JtQXJyYXkoXG4gICAgICB0aGlzLl9fZW5naW5lLFxuICAgICAgdGhpcy5fX3VuaWZvcm1Nb3JwaFdlaWdodHNUeXBlZEFycmF5ISxcbiAgICAgIGlzTmV3QnVmZmVyXG4gICAgKTtcbiAgICB0aGlzLl9faXNQcmV2aW91c01vcnBoV2VpZ2h0c1NldHRsZWQgPSBmYWxzZTtcbiAgICBpZiAoZWxlbWVudE51bVRvQ29weSA+IDApIHtcbiAgICAgIHRoaXMuX191cGxvYWRNb3JwaFdlaWdodHMoZWxlbWVudE51bVRvQ29weSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX3VwbG9hZE1vcnBoV2VpZ2h0cyhlbGVtZW50TnVtVG9Db3B5OiBudW1iZXIpIHtcbiAgICB0aGlzLl9fZW5naW5lLndlYkdwdVJlc291cmNlUmVwb3NpdG9yeS51cGRhdGVVbmlmb3JtTW9ycGhXZWlnaHRzQnVmZmVyKFxuICAgICAgdGhpcy5fX3VuaWZvcm1Nb3JwaFdlaWdodHNUeXBlZEFycmF5ISxcbiAgICAgIGVsZW1lbnROdW1Ub0NvcHlcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIE1ha2VzIHRoZSB3ZWlnaHRzIG9mIHRoZSBwcmV2aW91cyBmcmFtZSBpbiB0aGUgbW9ycGggd2VpZ2h0cyB1bmlmb3JtIGJ1ZmZlciBlcXVhbCB0byB0aGUgY3VycmVudCB3ZWlnaHRzIG9uY2VcbiAgICogdGhlIHdlaWdodHMgc3RvcHBlZCBjaGFuZ2luZyAodGVtcG9yYWwgYW50aS1hbGlhc2luZyBvbmx5KS5cbiAgICovXG4gIHByaXZhdGUgX19zZXR0bGVQcmV2aW91c01vcnBoV2VpZ2h0cygpIHtcbiAgICBpZiAodGhpcy5fX2lzUHJldmlvdXNNb3JwaFdlaWdodHNTZXR0bGVkIHx8IHRoaXMuX191bmlmb3JtTW9ycGhXZWlnaHRzVHlwZWRBcnJheSA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX19pc1ByZXZpb3VzTW9ycGhXZWlnaHRzU2V0dGxlZCA9IHRydWU7XG4gICAgY29uc3QgZWxlbWVudE51bVRvQ29weSA9IEJsZW5kU2hhcGVDb21wb25lbnQuX3NldHRsZVByZXZpb3VzTW9ycGhXZWlnaHRzKFxuICAgICAgdGhpcy5fX2VuZ2luZSxcbiAgICAgIHRoaXMuX191bmlmb3JtTW9ycGhXZWlnaHRzVHlwZWRBcnJheVxuICAgICk7XG4gICAgaWYgKGVsZW1lbnROdW1Ub0NvcHkgPiAwKSB7XG4gICAgICB0aGlzLl9fdXBsb2FkTW9ycGhXZWlnaHRzKGVsZW1lbnROdW1Ub0NvcHkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIHRoZSBhcHByb3ByaWF0ZSBjYW1lcmEgY29tcG9uZW50IFNJRCBmb3IgdGhlIGN1cnJlbnQgcmVuZGVyaW5nIGNvbnRleHQuXG4gICAqIEhhbmRsZXMgYm90aCBWUiBhbmQgbm9uLVZSIHJlbmRlcmluZyBzY2VuYXJpb3MsIGluY2x1ZGluZyBtdWx0aS12aWV3IHN0ZXJlbyByZW5kZXJpbmcuXG4gICAqXG4gICAqIEBwYXJhbSByZW5kZXJQYXNzIC0gVGhlIGN1cnJlbnQgcmVuZGVyIHBhc3NcbiAgICogQHBhcmFtIGRpc3BsYXlJZHggLSBEaXNwbGF5IGluZGV4IGZvciBzdGVyZW8gcmVuZGVyaW5nICgwIGZvciBsZWZ0IGV5ZSwgMSBmb3IgcmlnaHQgZXllKVxuICAgKiBAcGFyYW0gaXNWUk1haW5QYXNzIC0gV2hldGhlciB0aGlzIGlzIGEgVlIgbWFpbiByZW5kZXJpbmcgcGFzc1xuICAgKiBAcmV0dXJucyBUaGUgY29tcG9uZW50IFNJRCBvZiB0aGUgYXBwcm9wcmlhdGUgY2FtZXJhLCBvciAtMSBpZiBubyBjYW1lcmEgaXMgYXZhaWxhYmxlXG4gICAqL1xuICBwcml2YXRlIF9fZ2V0QXBwcm9wcmlhdGVDYW1lcmFDb21wb25lbnRTSUQocmVuZGVyUGFzczogUmVuZGVyUGFzcywgZGlzcGxheUlkeDogMCB8IDEsIGlzVlJNYWluUGFzczogYm9vbGVhbik6IG51bWJlciB7XG4gICAgaWYgKGlzVlJNYWluUGFzcykge1xuICAgICAgY29uc3Qgd2VieHJTeXN0ZW0gPSB0aGlzLl9fZW5naW5lLl93ZWJYUlN5c3RlbUlmRW5hYmxlZDtcbiAgICAgIGxldCBjYW1lcmFDb21wb25lbnRTaWQgPSAtMTtcbiAgICAgIGlmICh3ZWJ4clN5c3RlbT8uaXNXZWJYUk1vZGUpIHtcbiAgICAgICAgaWYgKHdlYnhyU3lzdGVtLmlzTXVsdGlWaWV3KCkpIHtcbiAgICAgICAgICBjYW1lcmFDb21wb25lbnRTaWQgPSB3ZWJ4clN5c3RlbS5fZ2V0Q2FtZXJhQ29tcG9uZW50U0lEQXQoMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2FtZXJhQ29tcG9uZW50U2lkID0gd2VieHJTeXN0ZW0uX2dldENhbWVyYUNvbXBvbmVudFNJREF0KGRpc3BsYXlJZHgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gY2FtZXJhQ29tcG9uZW50U2lkO1xuICAgIH1cbiAgICAvLyBOb24tVlIgUmVuZGVyaW5nXG4gICAgbGV0IGNhbWVyYUNvbXBvbmVudCA9IHJlbmRlclBhc3MuY2FtZXJhQ29tcG9uZW50O1xuICAgIGlmIChjYW1lcmFDb21wb25lbnQgPT0gbnVsbCkge1xuICAgICAgLy8gaWYgdGhlIHJlbmRlclBhc3MgaGFzIG5vIGNhbWVyYUNvbXBvbmVudCwgdHJ5IHRvIGdldCB0aGUgY3VycmVudCBjYW1lcmFDb21wb25lbnRcbiAgICAgIGNhbWVyYUNvbXBvbmVudCA9IHRoaXMuX19lbmdpbmUuY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnQoXG4gICAgICAgIENhbWVyYUNvbXBvbmVudCxcbiAgICAgICAgQ2FtZXJhQ29tcG9uZW50LmdldEN1cnJlbnQodGhpcy5fX2VuZ2luZSlcbiAgICAgICkgYXMgQ2FtZXJhQ29tcG9uZW50O1xuICAgIH1cbiAgICBpZiAoY2FtZXJhQ29tcG9uZW50KSB7XG4gICAgICByZXR1cm4gY2FtZXJhQ29tcG9uZW50LmNvbXBvbmVudFNJRDtcbiAgICB9XG4gICAgcmV0dXJuIC0xO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFsbCBHUFUgcmVzb3VyY2VzIGhlbGQgYnkgdGhpcyBzdHJhdGVneS5cbiAgICogU2hvdWxkIGJlIGNhbGxlZCB3aGVuIHRoZSBlbmdpbmUgaXMgYmVpbmcgZGVzdHJveWVkLlxuICAgKi9cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBjb25zdCB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYkdwdVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICB0aGlzLl9fbGlnaHRDbHVzdGVyQnVpbGRlcj8uZGVzdHJveSgpO1xuICAgIHRoaXMuX19saWdodENsdXN0ZXJCdWlsZGVyID0gdW5kZWZpbmVkO1xuICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5fZGVzdHJveUdwdUN1bGxpbmcoKTtcbiAgICBpZiAodGhpcy5fX3N0b3JhZ2VCdWZmZXJVaWQgIT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkKSB7XG4gICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuZGVzdHJveVN0b3JhZ2VCdWZmZXIodGhpcy5fX3N0b3JhZ2VCdWZmZXJVaWQpO1xuICAgICAgdGhpcy5fX3N0b3JhZ2VCdWZmZXJVaWQgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX19zdG9yYWdlQmxlbmRTaGFwZUJ1ZmZlclVpZCAhPT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQpIHtcbiAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5kZWxldGVTdG9yYWdlQmxlbmRTaGFwZUJ1ZmZlcih0aGlzLl9fc3RvcmFnZUJsZW5kU2hhcGVCdWZmZXJVaWQpO1xuICAgICAgdGhpcy5fX3N0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyVWlkID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gICAgfVxuICAgIGlmICh0aGlzLl9fbW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlclVpZCAhPT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQpIHtcbiAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5kZWxldGVVbmlmb3JtQnVmZmVyKHRoaXMuX19tb3JwaE9mZnNldHNVbmlmb3JtQnVmZmVyVWlkKTtcbiAgICAgIHRoaXMuX19tb3JwaE9mZnNldHNVbmlmb3JtQnVmZmVyVWlkID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gICAgfVxuICAgIGlmICh0aGlzLl9fbW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlclVpZCAhPT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQpIHtcbiAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5kZWxldGVVbmlmb3JtQnVmZmVyKHRoaXMuX19tb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyVWlkKTtcbiAgICAgIHRoaXMuX19tb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyVWlkID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gICAgfVxuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQUEsU0FBUywwQkFBMEI7QUFDbkMsU0FBUywyQkFBMkI7QUFDcEMsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyx1Q0FBdUM7QUFDaEQsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUywyQkFBMkI7QUFDcEMsU0FBUywwQkFBMEI7QUFDbkMsU0FBUyxpQkFBa0M7QUFDM0MsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyx1QkFBdUI7QUFPaEMsU0FBUyxrQkFBdUM7QUFDaEQsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyxpQ0FBaUM7QUFJMUMsU0FBUyxjQUFjO0FBQ3ZCLFNBQVMsK0JB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QkFBb0IsS0FBS0EsRUFBOEI7QUFDaEYsV0FBS0EsS0FBaUMsd0JBQXdCO0FBQUEsSUFDaEU7QUFBQSxFQUNGO0FBQ0Y7IiwKICAibmFtZXMiOiBbIl9fc3RvcmFnZUJ1ZmZlclVpZCIsICJfX3N0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyVWlkIiwgIl9faXNQcmV2aW91c01vcnBoV2VpZ2h0c1NldHRsZWQiLCAiX19sYXN0TWF0ZXJpYWxzVXBkYXRlQ291bnQiLCAiX19sYXN0TGlnaHRDbHVzdGVyRGF0YVZlcnNpb24iLCAiX19sYXN0TGlnaHRDb21wb25lbnRzVXBkYXRlQ291bnQiLCAiX19sYXN0R3B1SW5zdGFuY2VEYXRhVmVyc2lvbiIsICJfX2xhc3RMaWdodENsdXN0ZXJCdWlsZERhdGFWZXJzaW9uIiwgIl9fbGFzdFRyYW5zZm9ybUNvbXBvbmVudHNVcGRhdGVDb3VudCIsICJfX2xhc3RTY2VuZUdyYXBoQ29tcG9uZW50c1VwZGF0ZUNvdW50IiwgIl9fbGFzdENhbWVyYUNvbXBvbmVudHNVcGRhdGVDb3VudCIsICJfX2xhc3RDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50c1VwZGF0ZUNvdW50IiwgIl9fbGFzdEJsZW5kU2hhcGVDb21wb25lbnRzVXBkYXRlQ291bnRGb3JXZWlnaHRzIiwgIl9fbGFzdE1vcnBoTWF4SW5kZXgiLCAiX19sYXN0R3B1SW5zdGFuY2VEYXRhQnVmZmVyQ291bnQiLCAiX19sYXN0TW9ycGhPZmZzZXRzVW5pZm9ybURhdGFTaXplIiwgIl9fbGFzdE1vcnBoV2VpZ2h0c1VuaWZvcm1EYXRhU2l6ZSIsICJfX21vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJVaWQiLCAiX19tb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyVWlkIiwgIl9fc3RvcmFnZUJsZW5kU2hhcGVCdWZmZXJCeXRlTGVuZ3RoIiwgIl9fY291bnRPZkJsZW5kU2hhcGVDb21wb25lbnRzIiwgIl9fZW5naW5lIiwgIm1lbWJlckluZm8iLCAiX19nZXRNb3JwaGVkUG9zaXRpb25HZXR0ZXIiLCAiX19nZXRTaGFkZXJQcm9wZXJ0eU9mR2xvYmFsRGF0YVJlcG9zaXRvcnkiLCAiX19nZXRTaGFkZXJQcm9wZXJ0eU9mTWF0ZXJpYWwiLCAiX19pbml0TW9ycGhVbmlmb3JtQnVmZmVycyIsICJfX3VuaWZvcm1Nb3JwaE9mZnNldHNUeXBlZEFycmF5IiwgIl9fdXBkYXRlTW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlciIsICJfX3VuaWZvcm1Nb3JwaFdlaWdodHNUeXBlZEFycmF5IiwgIl9fdXBkYXRlTW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlciIsICJfX3NldHVwU2hhZGVyUHJvZ3JhbUZvck1lc2hDb21wb25lbnQiLCAiX19jcmVhdGVBbmRVcGRhdGVTdG9yYWdlQnVmZmVyIiwgIl9fYnVpbGRMaWdodENsdXN0ZXJzT25HcHUiLCAiX19jcmVhdGVPclVwZGF0ZVN0b3JhZ2VCbGVuZFNoYXBlQnVmZmVyIiwgIl9fc2V0dGxlUHJldmlvdXNNb3JwaFdlaWdodHMiLCAiX19yZW5kZXJXaXRob3V0QnVmZmVycyIsICJfX2lzRGVwdGhQcmVwYXNzQXZhaWxhYmxlIiwgIl9fZ2V0QXBwcm9wcmlhdGVDYW1lcmFDb21wb25lbnRTSUQiLCAiX19saWdodENsdXN0ZXJCdWlsZGVyIiwgIl9fdXBsb2FkTW9ycGhXZWlnaHRzIl0KfQo=
