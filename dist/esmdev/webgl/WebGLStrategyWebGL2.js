// src/webgl/WebGLStrategyWebGL2.ts
import { AnimationComponent } from "../foundation/components/Animation/AnimationComponent.js";
import { BlendShapeComponent } from "../foundation/components/BlendShape/BlendShapeComponent.js";
import { CameraComponent } from "../foundation/components/Camera/CameraComponent.js";
import { CameraControllerComponent } from "../foundation/components/CameraController/CameraControllerComponent.js";
import { LightComponent } from "../foundation/components/Light/LightComponent.js";
import { MeshComponent } from "../foundation/components/Mesh/MeshComponent.js";
import { MeshRendererComponent } from "../foundation/components/MeshRenderer/MeshRendererComponent.js";
import { SceneGraphComponent } from "../foundation/components/SceneGraph/SceneGraphComponent.js";
import { TransformComponent } from "../foundation/components/Transform/TransformComponent.js";
import { WellKnownComponentTIDs } from "../foundation/components/WellKnownComponentTIDs.js";
import { Component } from "../foundation/core/Component.js";
import { BufferUse } from "../foundation/definitions/BufferUse.js";
import { ComponentType } from "../foundation/definitions/ComponentType.js";
import { CompositionType } from "../foundation/definitions/CompositionType.js";
import { PixelFormat } from "../foundation/definitions/PixelFormat.js";
import { ShaderType } from "../foundation/definitions/ShaderType.js";
import { TextureFormat } from "../foundation/definitions/TextureFormat.js";
import { VertexAttribute } from "../foundation/definitions/VertexAttribute.js";
import { Primitive } from "../foundation/geometry/Primitive.js";
import { Logger } from "../foundation/misc/Logger.js";
import { MiscUtil } from "../foundation/misc/MiscUtil.js";
import { CGAPIResourceRepository } from "../foundation/renderer/CGAPIResourceRepository.js";
import { subtractByteRanges } from "../foundation/renderer/lightCluster/LightClusterLayout.js";
import { isSkipDrawing } from "../foundation/renderer/RenderingCommonMethods.js";
import {
  getMultiDrawStateKeyId,
  getPrimitiveMeshRendererFingerPrintId,
  planMultiDrawRunsInto
} from "./MultiDraw.js";
import WebGLStrategyCommonMethod, { setupShaderProgram } from "./WebGLStrategyCommonMethod.js";
var _WebGLStrategyWebGL2 = class _WebGLStrategyWebGL2 {
  /**
   * Private constructor to enforce singleton pattern.
   * Immediately initializes __currentComponentSIDs from the engine's GlobalDataRepository
   * to avoid null reference errors during rendering.
   */
  constructor(engine) {
    this.__dataTextureUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.__dataUBOUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.__morphOffsetsUniformBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.__morphWeightsUniformBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.__lastShader = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.__lastMaterialStateVersion = -1;
    this.__lastRenderPassTickCount = -1;
    /**
     * 1 when every mesh drawn in the current pass shows all of its instances, which lets the
     * vertex shader skip the remap texture fetch and read the SID texel directly.
     */
    this.__instanceRemapIdentity = 1;
    /** Reused numeric run plan of the current bucket (no per-frame allocation). */
    this.__runPlan = {
      starts: new Int32Array(0),
      counts: new Int32Array(0),
      keys: new Int32Array(0),
      count: 0
    };
    /** Layout of the instance SID / remap regions inside the data texture. */
    this.__dataTextureWidth = 0;
    this.__instanceSidBaseRow = 0;
    this.__instanceRemapBaseRow = 0;
    this.__instanceSidBaseVec4 = 0;
    this.__instanceRemapBaseVec4 = 0;
    this.__instanceSidCapacity = 0;
    this._totalSizeOfGPUShaderDataStorageExceptMorphData = 0;
    this.__lastBlendShapeComponentsUpdateCountForWeights = -1;
    this.__lastMorphMaxIndex = -1;
    this.__lastMaterialsUpdateCount = -1;
    this.__lastLightClusterDataVersion = -1;
    this.__lastLightComponentsUpdateCount = -1;
    this.__lastTotalSizeOfGPUShaderDataStorageExceptMorphData = -1;
    this.__lastTransformComponentsUpdateCount = -1;
    this.__lastSceneGraphComponentsUpdateCount = -1;
    this.__lastCameraComponentsUpdateCount = -1;
    this.__lastCameraControllerComponentsUpdateCount = -1;
    this.__lastGpuInstanceDataBufferCount = -1;
    this.__lastMorphOffsetsUniformDataSize = -1;
    this.__lastMorphWeightsUniformDataSize = -1;
    this.__countOfBlendShapeComponents = -1;
    this.__engine = engine;
    this.__currentComponentSIDs = this.__engine.globalDataRepository.getValue("currentComponentSIDs", 0);
  }
  /**
   * Initiates the dumping of the data texture buffer for debugging purposes.
   * This method flags the system to export the data texture buffer contents
   * on the next rendering cycle.
   *
   * @remarks
   * The dumped buffer will be downloaded as a binary file named 'Rhodonite_dataTextureBuffer.bin'.
   * This is useful for debugging shader data layout and content issues.
   */
  static dumpDataTextureBuffer() {
    this.__isDebugOperationToDataTextureBufferDone = false;
  }
  /**
   * method definitions for component data access for data texture-based rendering.
   * Provides GLSL functions for accessing component data through data textures.
   * @param shaderType - The shader type (VertexShader or PixelShader)
   * @returns GLSL shader code string for the component data access method definitions
   */
  static __getComponentDataAccessMethodDefinitions_dataTexture(engine, shaderType) {
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
          typeStr = "vec4";
          fetchTypeStr = "fetchVec4";
          break;
        case CompositionType.Mat4Array:
          typeStr = "mat4";
          fetchTypeStr = "fetchMat4";
          break;
        case CompositionType.Mat4x3Array:
          typeStr = "mat4x3";
          fetchTypeStr = "fetchMat4x3";
          break;
        default:
          throw new Error(`Unsupported composition type: ${memberInfo2.compositionType.str}`);
      }
      const vec4SizeOfProperty = memberInfo2.compositionType.getVec4SizeOfProperty();
      if (memberInfo2.isVariableLength === true) {
        const radix = Component._variableLengthLocationRadix;
        str += `
  ${typeStr} get_${memberName}(uint instanceId, uint idxOfArray) {
    vec4 location = get_${Component._getVariableLengthLocationMemberName(memberName)}(instanceId);
    int index = int(location.x) * ${radix} + int(location.y) + ${vec4SizeOfProperty} * int(idxOfArray);
    ${typeStr} value = ${fetchTypeStr}(index);
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
      const arrayLengthMap = (_a = Component.getArrayLengthOfMember(engine).get(componentClass)) != null ? _a : /* @__PURE__ */ new Map();
      const arrayLength = (_b = arrayLengthMap.get(memberName)) != null ? _b : 0;
      const arrayLengthStr = `int arrayLength = ${arrayLength};`;
      const indicesName = `rnIndices_${memberName}`;
      const indexStr = `int index = ${indicesName}[instanceIdOfBufferViews] + int(instanceIdInBufferView) * ${vec4SizeOfProperty} * arrayLength + ${vec4SizeOfProperty} * int(idxOfArray);`;
      let conversionStr = "";
      if (memberInfo2.convertToBool) {
        conversionStr = "return (value > 0.5) ? true : false;";
      }
      str += `
  const int ${indicesName}[${locationOffsets_vec4_idx.length}] = int[${locationOffsets_vec4_idx.length}](${locationOffsets_vec4_idx.join(", ")});
  ${memberInfo2.convertToBool ? "bool" : typeStr} get_${memberName}(uint instanceId, uint idxOfArray) {
    uint instanceIdOfBufferViews = instanceId / ${componentCountPerBufferView}u;
    uint instanceIdInBufferView = instanceId % ${componentCountPerBufferView}u;
    ${arrayLengthStr}
    ${indexStr}
    ${typeStr} value = ${fetchTypeStr}(index);
    ${memberInfo2.convertToBool ? conversionStr : "return value;"}
  }
`;
    }
    function processForNonArrayType(memberInfo2, componentClass, memberName, componentCountPerBufferView) {
      let typeStr = "";
      let fetchTypeStr = "";
      switch (memberInfo2.compositionType) {
        case CompositionType.Mat4:
          typeStr = "mat4";
          fetchTypeStr = "fetchMat4";
          break;
        case CompositionType.Mat3:
          typeStr = "mat3";
          fetchTypeStr = "fetchMat3No16BytesAligned";
          break;
        case CompositionType.Vec4:
          typeStr = "vec4";
          fetchTypeStr = "fetchVec4";
          break;
        case CompositionType.Vec3:
          typeStr = "vec3";
          fetchTypeStr = "fetchVec3No16BytesAligned";
          break;
        case CompositionType.Scalar:
          typeStr = "float";
          fetchTypeStr = "fetchScalarNo16BytesAligned";
          break;
        default:
          throw new Error(`Unsupported composition type: ${memberInfo2.compositionType.str}`);
      }
      const locationOffsets_vec4_idx = Component.getLocationOffsetOfMemberOfComponent(
        engine,
        componentClass,
        memberName
      );
      const indicesName = `rnIndices_${memberName}`;
      let indexStr = "";
      switch (memberInfo2.compositionType) {
        case CompositionType.Mat4:
          indexStr = `int index = ${indicesName}[instanceIdOfBufferViews] + 4 * int(instanceIdInBufferView);`;
          break;
        case CompositionType.Mat3:
          indexStr = `int index = ${indicesName}[instanceIdOfBufferViews] * 4 + 9 * int(instanceIdInBufferView);`;
          break;
        case CompositionType.Vec4:
          indexStr = `int index = ${indicesName}[instanceIdOfBufferViews] + 1 * int(instanceIdInBufferView);`;
          break;
        case CompositionType.Vec3:
          indexStr = `int index = ${indicesName}[instanceIdOfBufferViews] * 4 + 3 * int(instanceIdInBufferView);`;
          break;
        case CompositionType.Scalar:
          indexStr = `int index = ${indicesName}[instanceIdOfBufferViews] * 4 + 1 * int(instanceIdInBufferView);`;
          break;
        default:
          throw new Error(`Unsupported composition type: ${memberInfo2.compositionType.str}`);
      }
      let conversionStr = "";
      if (memberInfo2.convertToBool) {
        conversionStr = "return (value > 0.5) ? true : false;";
      }
      str += `
  const int ${indicesName}[${locationOffsets_vec4_idx.length}] = int[${locationOffsets_vec4_idx.length}](${locationOffsets_vec4_idx.join(", ")});
  ${memberInfo2.convertToBool ? "bool" : typeStr} get_${memberName}(uint instanceId) {
    uint instanceIdOfBufferViews = instanceId / ${componentCountPerBufferView}u;
    uint instanceIdInBufferView = instanceId % ${componentCountPerBufferView}u;
    ${indexStr}
    ${typeStr} value = ${fetchTypeStr}(index);
    ${memberInfo2.convertToBool ? conversionStr : "return value;"}
  }
`;
    }
  }
  static __getMorphedPositionGetter(engine) {
    const morphUniformDataTargetNumbers = Primitive.getMorphUniformDataTargetNumbers();
    const morphUniformDataTargetNumbersStr = `
    const int rnMorphUniformDataTargetNumbers[${morphUniformDataTargetNumbers.length}] = int[${morphUniformDataTargetNumbers.length}](${morphUniformDataTargetNumbers.join(", ")});
    `;
    const morphUniformDataOffsets = Primitive.getMorphUniformDataOffsets();
    const morphUniformDataOffsetsStr = `
    const int rnMorphUniformDataOffsets[${morphUniformDataOffsets.length}] = int[${morphUniformDataOffsets.length}](${morphUniformDataOffsets.join(", ")});
    `;
    const blendShapeUniformDataOffsets = BlendShapeComponent.getOffsetsInUniform(engine);
    const blendShapeUniformDataOffsetsStr = `
    const int rnBlendShapeUniformDataOffsets[${blendShapeUniformDataOffsets.length}] = int[${blendShapeUniformDataOffsets.length}](${blendShapeUniformDataOffsets.join(", ")});
    `;
    const morphingStr = `
    #ifdef RN_IS_VERTEX_SHADER
      #ifdef RN_IS_MORPHING
      ${morphUniformDataTargetNumbersStr}
      ${morphUniformDataOffsetsStr}
      ${blendShapeUniformDataOffsetsStr}
      vec3 get_position(uint vertexId, vec3 basePosition, uint blendShapeComponentSID) {
        int currentPrimitiveIdx = u_currentPrimitiveIdx;
        int offsetInUniform = rnMorphUniformDataOffsets[currentPrimitiveIdx];
        int offsetInUniform2 = rnBlendShapeUniformDataOffsets[blendShapeComponentSID];
        vec3 position = basePosition;
        int scalar_idx = 3 * int(vertexId);
        for (int i=0; i<rnMorphUniformDataTargetNumbers[currentPrimitiveIdx]; i++) {
          int idx = offsetInUniform + i;
          ivec4 offsets = uniformMorphOffsets.data[ idx / 4];
          int offsetPosition = offsets[idx % 4];

          int basePosIn4bytes = offsetPosition * 4 + scalar_idx;
          vec3 addPos = fetchVec3No16BytesAligned(basePosIn4bytes);

          int idx2 = offsetInUniform2 + i;
          vec4 morphWeights = uniformMorphWeights.data[ idx2 / 4];
          float morphWeight = morphWeights[idx2 % 4];

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
  setupShaderForMaterial(material, primitive) {
    const webglResourceRepository = this.__engine.webglResourceRepository;
    const _glw = webglResourceRepository.currentWebGLContextWrapper;
    const [programUid, newOne] = material._createProgramWebGL(
      this.__engine,
      _WebGLStrategyWebGL2.__getComponentDataAccessMethodDefinitions_dataTexture(this.__engine, ShaderType.VertexShader),
      _WebGLStrategyWebGL2.__getComponentDataAccessMethodDefinitions_dataTexture(this.__engine, ShaderType.PixelShader),
      _WebGLStrategyWebGL2.__getShaderPropertyOfGlobalDataRepository,
      _WebGLStrategyWebGL2.__getShaderPropertyOfMaterial,
      _WebGLStrategyWebGL2.__getMorphedPositionGetter(this.__engine),
      primitive
    );
    if (newOne) {
      material._setupBasicUniformsLocations(primitive);
      material._setUniformLocationsOfMaterialNodes(primitive);
      material._setupAdditionalUniformLocations(
        WebGLStrategyCommonMethod.getPointSpriteShaderSemanticsInfoArray(),
        primitive
      );
      this.__engine.globalDataRepository._setUniformLocationsForWebGL2ModeOnly(material.getShaderProgramUid(primitive));
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
  _reSetupShaderForMaterialBySpector(material, primitive, updatedShaderSources, onError) {
    const [programUid, newOne] = material._createProgramByUpdatedSources(updatedShaderSources, primitive, onError);
    if (programUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      return programUid;
    }
    if (newOne) {
      material._setupBasicUniformsLocations(primitive);
      material._setUniformLocationsOfMaterialNodes(primitive);
      material._setupAdditionalUniformLocations(
        WebGLStrategyCommonMethod.getPointSpriteShaderSemanticsInfoArray(),
        primitive
      );
    }
    this.__engine.globalDataRepository._setUniformLocationsForWebGL2ModeOnly(material.getShaderProgramUid(primitive));
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
  static __getShaderPropertyOfGlobalDataRepository(engine, info) {
    var _a, _b;
    const returnType = info.compositionType.getGlslStr(info.componentType);
    let indexStr;
    const isTexture = CompositionType.isTexture(info.compositionType);
    const methodName = info.semantic.replace(".", "_");
    let varDef = "";
    const varType = info.compositionType.getGlslStr(info.componentType);
    let varIndexStr = "";
    if (info.arrayLength) {
      varIndexStr = `[${info.arrayLength}]`;
    }
    if (info.needUniformInDataTextureMode || isTexture) {
      varDef = `  uniform ${varType} u_${methodName}${varIndexStr};
`;
    }
    const vec4SizeOfProperty = info.compositionType.getVec4SizeOfProperty();
    const scalarSizeOfProperty = info.compositionType.getNumberOfComponents();
    const offsetOfProperty = _WebGLStrategyWebGL2.getOffsetOfPropertyOfGlobalDataRepository(
      engine,
      info.semantic
    );
    if (offsetOfProperty === -1) {
      Logger.default.error("Could not get the location offset of the property.");
    }
    let instanceSize = vec4SizeOfProperty;
    indexStr = `int vec4_idx = ${offsetOfProperty} + ${instanceSize} * instanceId;
`;
    if (CompositionType.isArray(info.compositionType)) {
      instanceSize = vec4SizeOfProperty * ((_a = info.arrayLength) != null ? _a : 1);
      const paddedAsVec4 = Math.ceil(scalarSizeOfProperty / 4) * 4;
      const instanceSizeInScalar = paddedAsVec4 * ((_b = info.arrayLength) != null ? _b : 1);
      indexStr = `int vec4_idx = ${offsetOfProperty} + ${instanceSize} * instanceId + ${vec4SizeOfProperty} * int(idxOfArray);
`;
      indexStr += `int scalar_idx = ${// IndexOf4Bytes
      offsetOfProperty * 4} + ${instanceSizeInScalar} * instanceId + ${scalarSizeOfProperty} * int(idxOfArray);
`;
    }
    let intStr = "";
    if (info.componentType === ComponentType.Int && info.compositionType !== CompositionType.Scalar) {
      intStr = "i";
    }
    let firstPartOfInnerFunc = "";
    if (!isTexture && !info.needUniformInDataTextureMode) {
      firstPartOfInnerFunc += `
${returnType} get_${methodName}(highp uint _instanceId, const uint idxOfArray) {
  int instanceId = int(_instanceId);
  ${indexStr}
  `;
      let str = `${varDef}
${firstPartOfInnerFunc}`;
      switch (info.compositionType) {
        case CompositionType.Vec4:
        case CompositionType.Vec4Array:
          str += "        highp vec4 val = fetchElement(vec4_idx);\n";
          break;
        case CompositionType.Vec3:
          str += "        vec4 col0 = fetchElement(vec4_idx);\n";
          str += `        highp ${intStr}vec3 val = ${intStr}vec3(col0.xyz);`;
          break;
        case CompositionType.Vec3Array:
          str += "        vec3 val = fetchVec3No16BytesAligned(scalar_idx);\n";
          break;
        case CompositionType.Vec2:
          str += "        highp vec4 col0 = fetchElement(vec4_idx);\n";
          str += `        highp ${intStr}vec2 val = ${intStr}vec2(col0.xy);`;
          break;
        case CompositionType.Vec2Array:
          str += "        highp vec2 val = fetchVec2No16BytesAligned(scalar_idx);\n";
          break;
        case CompositionType.Scalar:
          str += "        vec4 col0 = fetchElement(vec4_idx);\n";
          if (info.componentType === ComponentType.Int) {
            str += "        int val = int(col0.x);";
          } else if (info.componentType === ComponentType.Bool) {
            str += "        bool val = bool(col0.x);";
          } else {
            str += "       float val = col0.x;";
          }
          break;
        case CompositionType.ScalarArray:
          str += "        float col0 = fetchScalarNo16BytesAligned(scalar_idx);\n";
          if (info.componentType === ComponentType.Int) {
            str += "        int val = int(col0);";
          } else if (info.componentType === ComponentType.Bool) {
            str += "        bool val = bool(col0);";
          } else {
            str += "       float val = col0;";
          }
          break;
        case CompositionType.Mat4:
          str += "        mat4 val = fetchMat4(vec4_idx);\n";
          break;
        case CompositionType.Mat4Array:
          str += "        mat4 val = fetchMat4(vec4_idx);\n";
          break;
        case CompositionType.Mat3:
          str += "        mat3 val = fetchMat3(vec4_idx);\n";
          break;
        case CompositionType.Mat3Array:
          str += "        mat3 val = fetchMat3No16BytesAligned(scalar_idx);\n";
          break;
        case CompositionType.Mat2:
          str += "        mat2 val = fetchMat2(vec4_idx);\n";
          break;
        case CompositionType.Mat2Array:
          str += "        mat2 val = fetchMat2No16BytesAligned(scalar_idx);\n";
          break;
        case CompositionType.Mat4x3Array:
          str += "        mat4x3 val = fetchMat4x3(vec4_idx);\n";
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
    if (!isTexture && info.needUniformInDataTextureMode) {
      let varIndexStr2 = "";
      if (info.arrayLength) {
        varIndexStr2 = "[idxOfArray]";
      }
      const str = `${varDef}
${returnType} get_${methodName}(highp uint _instanceId, const uint idxOfArray) {
  return u_${methodName}${varIndexStr2};
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
  static __getShaderPropertyOfMaterial(engine, materialTypeName, info) {
    var _a, _b;
    const returnType = info.compositionType.getGlslStr(info.componentType);
    let indexStr;
    const isTexture = CompositionType.isTexture(info.compositionType);
    const methodName = info.semantic.replace(".", "_");
    let varDef = "";
    const varType = info.compositionType.getGlslStr(info.componentType);
    let varIndexStr = "";
    if (info.arrayLength) {
      varIndexStr = `[${info.arrayLength}]`;
    }
    if (info.needUniformInDataTextureMode || isTexture) {
      varDef = `  uniform ${varType} u_${methodName}${varIndexStr};
`;
    }
    const vec4SizeOfProperty = info.compositionType.getVec4SizeOfProperty();
    const scalarSizeOfProperty = info.compositionType.getNumberOfComponents();
    const offsetOfProperty = _WebGLStrategyWebGL2.getOffsetOfPropertyOfMaterial(
      engine,
      info.semantic,
      materialTypeName
    );
    const materialCountPerBufferView = engine.materialRepository._getMaterialCountPerBufferView(materialTypeName);
    const offsetsName = `rnOffsets_${methodName}`;
    const offsetStr = `const int ${offsetsName}[${offsetOfProperty.length}] = int[${offsetOfProperty.length}](${offsetOfProperty.join(", ")});`;
    let instanceSize = vec4SizeOfProperty;
    indexStr = `int vec4_idx = ${offsetsName}[instanceIdOfBufferViews] + ${instanceSize} * int(instanceIdInBufferView);
`;
    if (CompositionType.isArray(info.compositionType)) {
      instanceSize = vec4SizeOfProperty * ((_a = info.arrayLength) != null ? _a : 1);
      const paddedAsVec4 = Math.ceil(scalarSizeOfProperty / 4) * 4;
      const instanceSizeInScalar = paddedAsVec4 * ((_b = info.arrayLength) != null ? _b : 1);
      indexStr = `int vec4_idx = ${offsetsName}[instanceIdOfBufferViews] + ${instanceSize} * int(instanceIdInBufferView) + ${vec4SizeOfProperty} * int(idxOfArray);
`;
      indexStr += `int scalar_idx = ${offsetsName}[instanceIdOfBufferViews] * 4 + ${instanceSizeInScalar} * int(instanceIdInBufferView) + ${scalarSizeOfProperty} * int(idxOfArray);
`;
    }
    let intStr = "";
    if (info.componentType === ComponentType.Int && info.compositionType !== CompositionType.Scalar) {
      intStr = "i";
    }
    let firstPartOfInnerFunc = "";
    if (!isTexture && !info.needUniformInDataTextureMode) {
      firstPartOfInnerFunc += `
${offsetStr}
${returnType} get_${methodName}(highp uint _instanceId, const uint idxOfArray) {
  uint instanceId = _instanceId;
  uint instanceIdOfBufferViews = instanceId / ${materialCountPerBufferView}u;
  uint instanceIdInBufferView = instanceId % ${materialCountPerBufferView}u;
  ${indexStr}
  `;
      let str = `${varDef}
${firstPartOfInnerFunc}`;
      switch (info.compositionType) {
        case CompositionType.Vec4:
        case CompositionType.Vec4Array:
          str += "        highp vec4 val = fetchElement(vec4_idx);\n";
          break;
        case CompositionType.Vec3:
          str += "        vec4 col0 = fetchElement(vec4_idx);\n";
          str += `        highp ${intStr}vec3 val = ${intStr}vec3(col0.xyz);`;
          break;
        case CompositionType.Vec3Array:
          str += "        vec3 val = fetchVec3No16BytesAligned(scalar_idx);\n";
          break;
        case CompositionType.Vec2:
          str += "        highp vec4 col0 = fetchElement(vec4_idx);\n";
          str += `        highp ${intStr}vec2 val = ${intStr}vec2(col0.xy);`;
          break;
        case CompositionType.Vec2Array:
          str += "        highp vec2 val = fetchVec2No16BytesAligned(scalar_idx);\n";
          break;
        case CompositionType.Scalar:
          str += "        vec4 col0 = fetchElement(vec4_idx);\n";
          if (info.componentType === ComponentType.Int) {
            str += "        int val = int(col0.x);";
          } else if (info.componentType === ComponentType.Bool) {
            str += "        bool val = bool(col0.x);";
          } else {
            str += "       float val = col0.x;";
          }
          break;
        case CompositionType.ScalarArray:
          str += "        float col0 = fetchScalarNo16BytesAligned(scalar_idx);\n";
          if (info.componentType === ComponentType.Int) {
            str += "        int val = int(col0);";
          } else if (info.componentType === ComponentType.Bool) {
            str += "        bool val = bool(col0);";
          } else {
            str += "       float val = col0;";
          }
          break;
        case CompositionType.Mat4:
          str += "        mat4 val = fetchMat4(vec4_idx);\n";
          break;
        case CompositionType.Mat4Array:
          str += "        mat4 val = fetchMat4(vec4_idx);\n";
          break;
        case CompositionType.Mat3:
          str += "        mat3 val = fetchMat3(vec4_idx);\n";
          break;
        case CompositionType.Mat3Array:
          str += "        mat3 val = fetchMat3No16BytesAligned(scalar_idx);\n";
          break;
        case CompositionType.Mat2:
          str += "        mat2 val = fetchMat2(vec4_idx);\n";
          break;
        case CompositionType.Mat2Array:
          str += "        mat2 val = fetchMat2No16BytesAligned(scalar_idx);\n";
          break;
        case CompositionType.Mat4x3Array:
          str += "        mat4x3 val = fetchMat4x3(vec4_idx);\n";
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
    if (!isTexture && info.needUniformInDataTextureMode) {
      let varIndexStr2 = "";
      if (info.arrayLength) {
        varIndexStr2 = "[idxOfArray]";
      }
      const str = `${varDef}
${returnType} get_${methodName}(highp uint _instanceId, const uint idxOfArray) {
  return u_${methodName}${varIndexStr2};
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
  static getOffsetOfPropertyOfMaterial(engine, propertyName, materialTypeName) {
    const dataBeginPos = engine.materialRepository.getLocationOffsetOfMemberOfMaterial(
      engine,
      materialTypeName,
      propertyName
    );
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
  static getOffsetOfPropertyOfGlobalDataRepository(engine, propertyName) {
    const globalDataRepository = engine.globalDataRepository;
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
  $load(meshComponent) {
    const mesh = meshComponent.mesh;
    if (mesh == null) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return false;
    }
    this.__currentComponentSIDs = this.__engine.globalDataRepository.getValue("currentComponentSIDs", 0);
    if (!mesh.isSetUpDone()) {
      this.deleteDataTexture();
      mesh._updateVBOAndVAO();
    }
    return true;
  }
  __updateMorphOffsetsUniformBuffersInner() {
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
          this.__uniformMorphOffsetsTypedArray[morphUniformDataOffsets[i] + j] = (this.__engine.engineState.totalSizeOfGPUShaderDataStorageExceptMorphData + byteOffsetOfExistingBuffer + accessor.byteOffsetInBuffer) / 4 / 4;
        }
      } else {
        break;
      }
    }
    const elementNumToCopy = morphUniformDataOffsets[morphUniformDataOffsets.length - 1];
    this.__engine.webglResourceRepository.updateUniformBuffer(
      this.__morphOffsetsUniformBufferUid,
      this.__uniformMorphOffsetsTypedArray,
      0,
      elementNumToCopy
    );
  }
  common_$load() {
    this.__initMorphUniformBuffers();
  }
  __initMorphUniformBuffers() {
    let needsRebindMorphUniformBuffers = false;
    const morphUniformDataOffsets = Primitive.getMorphUniformDataOffsets();
    const morphOffsetsUniformDataSize = Math.max(
      Math.ceil(morphUniformDataOffsets[morphUniformDataOffsets.length - 1] / 4) * 4 * 4,
      4
    );
    if (morphOffsetsUniformDataSize !== this.__lastMorphOffsetsUniformDataSize) {
      if (this.__morphOffsetsUniformBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        this.__engine.webglResourceRepository.deleteUniformBuffer(this.__morphOffsetsUniformBufferUid);
        this.__morphOffsetsUniformBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      }
      this.__lastMorphOffsetsUniformDataSize = morphOffsetsUniformDataSize;
      if (this.__morphOffsetsUniformBufferUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        const inputArrayOffsets = new Uint32Array(morphOffsetsUniformDataSize);
        this.__uniformMorphOffsetsTypedArray = inputArrayOffsets;
        this.__morphOffsetsUniformBufferUid = this.__engine.webglResourceRepository.createUniformBufferWithBufferView(inputArrayOffsets);
        this.__updateMorphOffsetsUniformBuffersInner();
      }
      this.__lastMorphOffsetsUniformDataSize = morphOffsetsUniformDataSize;
      needsRebindMorphUniformBuffers = true;
    }
    const blendShapeUniformDataOffsets = BlendShapeComponent.getOffsetsInUniform(this.__engine);
    const blendShapeWeightsUniformDataSize = Math.max(
      Math.ceil(blendShapeUniformDataOffsets[blendShapeUniformDataOffsets.length - 1] / 4) * 4 * 4,
      4
    );
    if (blendShapeWeightsUniformDataSize !== this.__lastMorphWeightsUniformDataSize) {
      if (this.__morphWeightsUniformBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        this.__engine.webglResourceRepository.deleteUniformBuffer(this.__morphWeightsUniformBufferUid);
        this.__morphWeightsUniformBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      }
      if (this.__morphWeightsUniformBufferUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        const inputArrayWeights = new Float32Array(blendShapeWeightsUniformDataSize);
        this.__uniformMorphWeightsTypedArray = inputArrayWeights;
        this.__morphWeightsUniformBufferUid = this.__engine.webglResourceRepository.createUniformBufferWithBufferView(inputArrayWeights);
        this.__updateMorphWeightsUniformBuffer();
      }
      this.__lastMorphWeightsUniformDataSize = blendShapeWeightsUniformDataSize;
      needsRebindMorphUniformBuffers = true;
    }
    if (needsRebindMorphUniformBuffers) {
      this.__bindMorphUniformBuffers();
    }
  }
  __bindMorphUniformBuffers() {
    if (this.__morphOffsetsUniformBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid && this.__morphWeightsUniformBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      this.__engine.webglResourceRepository.setUniformBlockBindingForMorphOffsetsAndWeightsWithoutShaderProgram(
        this.__morphOffsetsUniformBufferUid,
        this.__morphWeightsUniformBufferUid
      );
    }
  }
  __updateMorphOffsetsUniformBuffers() {
    const morphMaxIndex = Primitive.getPrimitiveCountHasMorph();
    if (morphMaxIndex !== this.__lastMorphMaxIndex || this.__engine.engineState.totalSizeOfGPUShaderDataStorageExceptMorphData !== this.__lastTotalSizeOfGPUShaderDataStorageExceptMorphData) {
      this.__updateMorphOffsetsUniformBuffersInner();
      this.__lastTotalSizeOfGPUShaderDataStorageExceptMorphData = this.__engine.engineState.totalSizeOfGPUShaderDataStorageExceptMorphData;
      this.__lastMorphMaxIndex = morphMaxIndex;
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
  __createAndUpdateDataTexture() {
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
  __createAndUpdateDataTextureInner() {
    const memoryManager = this.__engine.memoryManager;
    const sizesOfTheBuffers = memoryManager.getSizesOfTheBuffers(BufferUse.GPUInstanceData);
    const totalSizeOfTheBuffers = sizesOfTheBuffers.reduce((acc, size) => acc + size, 0);
    const gpuInstanceDataBuffers = memoryManager.getBuffers(BufferUse.GPUInstanceData);
    const gpuInstanceDataBufferCount = gpuInstanceDataBuffers.length;
    if (gpuInstanceDataBufferCount !== this.__lastGpuInstanceDataBufferCount) {
      this.__lastGpuInstanceDataBufferCount = gpuInstanceDataBufferCount;
      this.deleteDataTexture();
    }
    const glw = this.__engine.webglResourceRepository.currentWebGLContextWrapper;
    if (glw == null) {
      return;
    }
    const dataTextureWidth = glw.getMaxTextureSize();
    if (this.__dataTextureUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const totalSizeOfTheBuffersInTexel = totalSizeOfTheBuffers / 4 / 4;
      const dataTextureHeight = Math.ceil(totalSizeOfTheBuffersInTexel / dataTextureWidth);
      const dataTextureByteSize = dataTextureWidth * dataTextureHeight * 4 * 4;
      const lightClusterSystem = this.__engine.lightClusterSystem;
      const excludedByteRanges = lightClusterSystem._getExcludedByteRanges();
      let layerByteOffset = 0;
      for (let i = 0; i < gpuInstanceDataBuffers.length; i++) {
        const gpuInstanceDataBuffer = gpuInstanceDataBuffers[i];
        const bufferSizeForDataTextureInByte = i === gpuInstanceDataBuffers.length - 1 ? gpuInstanceDataBuffer.takenSizeInByte : gpuInstanceDataBuffer.byteLength;
        if (bufferSizeForDataTextureInByte > dataTextureByteSize) {
          Logger.default.warn("The buffer size exceeds the size of the data texture.");
        }
        const layerArray = new Float32Array(gpuInstanceDataBuffer.getArrayBuffer());
        for (const [start, end] of subtractByteRanges(
          layerByteOffset,
          layerByteOffset + Math.min(bufferSizeForDataTextureInByte, dataTextureByteSize),
          excludedByteRanges
        )) {
          this.__uploadDataTextureTexels(layerArray, layerByteOffset, start, end, dataTextureWidth);
        }
        if (!_WebGLStrategyWebGL2.__isDebugOperationToDataTextureBufferDone) {
          MiscUtil.downloadTypedArray("Rhodonite_dataTextureBuffer.bin", layerArray);
          _WebGLStrategyWebGL2.__isDebugOperationToDataTextureBufferDone = true;
        }
        layerByteOffset += gpuInstanceDataBuffer.byteLength;
      }
      for (const [start, end] of lightClusterSystem._takeDirtyByteRanges()) {
        let layerStart = 0;
        for (const buffer of gpuInstanceDataBuffers) {
          const layerEnd = layerStart + buffer.byteLength;
          if (start >= layerStart && end <= layerEnd) {
            const layerArray = new Float32Array(buffer.getArrayBuffer());
            this.__uploadDataTextureTexels(layerArray, layerStart, start, end, dataTextureWidth);
            break;
          }
          layerStart = layerEnd;
        }
      }
    } else {
      const morphBuffers = memoryManager.getBuffers(BufferUse.GPUVertexData);
      const morphBufferArrayBuffers = morphBuffers.map((buffer) => buffer.getArrayBuffer());
      const dataTextureWidthInByte = dataTextureWidth * 4 * 4;
      const instanceDataRegionSizes = gpuInstanceDataBuffers.map(
        (buffer) => Math.ceil(buffer.byteLength / dataTextureWidthInByte) * dataTextureWidthInByte
      );
      const instanceDataRegionTotalSize = instanceDataRegionSizes.reduce((acc, size) => acc + size, 0);
      const morphBufferByteLength = morphBuffers.reduce((acc, buffer) => acc + buffer.byteLength, 0);
      const dataRows = Math.max(
        Math.ceil((instanceDataRegionTotalSize + morphBufferByteLength) / dataTextureWidthInByte),
        1
      );
      const isInstanceSidEnabled = this.__engine.config.isMultiDrawEnabled && this.__engine.webglResourceRepository.isInstanceSidTextureCapable;
      const sidTable = this.__engine.webglResourceRepository.instanceSidTable;
      const sidSlotCapacity = isInstanceSidEnabled ? Math.max(sidTable.usedEnd, 1) : 0;
      const sidRows = isInstanceSidEnabled ? Math.max(Math.ceil(sidSlotCapacity / dataTextureWidth), 1) : 0;
      const remapRows = isInstanceSidEnabled ? Math.max(Math.ceil(Math.ceil(sidSlotCapacity / 4) / dataTextureWidth), 1) : 0;
      const dataTextureHeight = dataRows + sidRows + remapRows;
      this.__dataTextureWidth = dataTextureWidth;
      this.__instanceSidBaseRow = dataRows;
      this.__instanceRemapBaseRow = dataRows + sidRows;
      this.__instanceSidBaseVec4 = this.__instanceSidBaseRow * dataTextureWidth;
      this.__instanceRemapBaseVec4 = this.__instanceRemapBaseRow * dataTextureWidth;
      this.__instanceSidCapacity = sidSlotCapacity;
      if (isInstanceSidEnabled) {
        sidTable.markAllDirty();
      }
      const dataTextureByteSize = dataTextureWidthInByte * dataTextureHeight;
      const finalUint8Array = new Uint8Array(dataTextureByteSize);
      let dstByteOffset = 0;
      gpuInstanceDataBuffers.forEach((buffer, i) => {
        finalUint8Array.set(new Uint8Array(buffer.getArrayBuffer(), 0, buffer.takenSizeInByte), dstByteOffset);
        dstByteOffset += instanceDataRegionSizes[i];
      });
      morphBuffers.forEach((buffer, i) => {
        finalUint8Array.set(new Uint8Array(morphBufferArrayBuffers[i], 0, buffer.byteLength), dstByteOffset);
        dstByteOffset += buffer.byteLength;
      });
      const floatDataTextureBuffer = new Float32Array(finalUint8Array.buffer);
      this.__engine.engineState.totalSizeOfGPUShaderDataStorageExceptMorphData = instanceDataRegionTotalSize;
      this.__dataTextureUid = this.__engine.webglResourceRepository.createTextureFromTypedArray(
        floatDataTextureBuffer,
        {
          internalFormat: TextureFormat.RGBA32F,
          width: dataTextureWidth,
          height: dataTextureHeight,
          format: PixelFormat.RGBA,
          type: ComponentType.Float,
          generateMipmap: false
        }
      );
      this.__engine.lightClusterSystem._takeDirtyByteRanges();
    }
  }
  /**
   * Uploads the bytes `[start, end)` of the GPU instance data (16-byte aligned, in the concatenated layers) to the
   * data texture, where texel `n` holds bytes `16n` to `16n + 15`. The range is split into a partial first row, full
   * rows and a partial last row.
   *
   * @param layerArray - The whole memory of the layer that contains the range
   * @param layerByteOffset - The byte offset of the layer in the concatenated layers
   */
  __uploadDataTextureTexels(layerArray, layerByteOffset, start, end, width) {
    const repository = this.__engine.webglResourceRepository;
    let texel = Math.floor(start / 16);
    const endTexel = Math.ceil(end / 16);
    const layerTexel = layerByteOffset / 16;
    const upload = (x, y, w, h, firstTexel) => {
      const from = (firstTexel - layerTexel) * 4;
      repository.updateTexture(this.__dataTextureUid, layerArray.subarray(from, from + w * h * 4), {
        level: 0,
        offsetX: x,
        offsetY: y,
        width: w,
        height: h,
        format: PixelFormat.RGBA,
        type: ComponentType.Float
      });
    };
    while (texel < endTexel) {
      const x = texel % width;
      const y = Math.floor(texel / width);
      if (x !== 0 || endTexel - texel < width) {
        const count = Math.min(width - x, endTexel - texel);
        upload(x, y, count, 1, texel);
        texel += count;
      } else {
        const rows = Math.floor((endTexel - texel) / width);
        upload(0, y, width, rows, texel);
        texel += rows * width;
      }
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
  deleteDataTexture() {
    if (this.__dataTextureUid != null) {
      this.__engine.webglResourceRepository.deleteTexture(this.__dataTextureUid);
      this.__dataTextureUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
    this.__instanceSidCapacity = 0;
    this.__dataTextureWidth = 0;
    this.__lastShader = CGAPIResourceRepository.InvalidCGAPIResourceUid;
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
  prerender() {
    const instanceSidEnabled = this.__engine.config.isMultiDrawEnabled && this.__engine.webglResourceRepository.isInstanceSidTextureCapable;
    if (instanceSidEnabled) {
      const sidTable = this.__engine.webglResourceRepository.instanceSidTable;
      if (this.__dataTextureUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid && sidTable.usedEnd > this.__instanceSidCapacity) {
        this.deleteDataTexture();
      }
    }
    if (AnimationComponent.getIsAnimating(this.__engine) || TransformComponent.getUpdateCount(this.__engine) !== this.__lastTransformComponentsUpdateCount || SceneGraphComponent.getUpdateCount(this.__engine) !== this.__lastSceneGraphComponentsUpdateCount || CameraComponent.getCurrentCameraUpdateCount(this.__engine) !== this.__lastCameraComponentsUpdateCount || CameraControllerComponent.getUpdateCount(this.__engine) !== this.__lastCameraControllerComponentsUpdateCount || this.__engine.materialRepository.stateVersion !== this.__lastMaterialsUpdateCount || this.__engine.lightClusterSystem.dataVersion !== this.__lastLightClusterDataVersion || LightComponent.getUpdateCount(this.__engine) !== this.__lastLightComponentsUpdateCount || this.__dataTextureUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      this.__createAndUpdateDataTexture();
      this.__createAndUpdateUBO();
      this.__lastTransformComponentsUpdateCount = TransformComponent.getUpdateCount(this.__engine);
      this.__lastSceneGraphComponentsUpdateCount = SceneGraphComponent.getUpdateCount(this.__engine);
      this.__lastCameraComponentsUpdateCount = CameraComponent.getCurrentCameraUpdateCount(this.__engine);
      this.__lastCameraControllerComponentsUpdateCount = CameraControllerComponent.getUpdateCount(this.__engine);
      this.__lastMaterialsUpdateCount = this.__engine.materialRepository.stateVersion;
      this.__lastLightClusterDataVersion = this.__engine.lightClusterSystem.dataVersion;
      this.__lastLightComponentsUpdateCount = LightComponent.getUpdateCount(this.__engine);
    }
    if (BlendShapeComponent.updateCount !== this.__lastBlendShapeComponentsUpdateCountForWeights || BlendShapeComponent.getCountOfBlendShapeComponents(this.__engine) !== this.__countOfBlendShapeComponents) {
      this.__updateMorphWeightsUniformBuffer();
      this.__lastBlendShapeComponentsUpdateCountForWeights = BlendShapeComponent.updateCount;
      this.__countOfBlendShapeComponents = BlendShapeComponent.getCountOfBlendShapeComponents(this.__engine);
      this.__engine.materialRepository._makeShaderInvalidateToMorphMaterials();
    }
    this.__updateMorphOffsetsUniformBuffers();
    this.__lightComponents = this.__engine.componentRepository.getComponentsWithType(LightComponent);
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
      const elementNumToCopy = blendShapeUniformDataOffsets[blendShapeUniformDataOffsets.length - 1];
      this.__engine.webglResourceRepository.updateUniformBuffer(
        this.__morphWeightsUniformBufferUid,
        this.__uniformMorphWeightsTypedArray,
        0,
        elementNumToCopy
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
  __isUboUse() {
    return this.__engine.webglResourceRepository.currentWebGLContextWrapper.isWebGL2 && this.__engine.config.isUboEnabled;
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
  __createAndUpdateUBO() {
    if (this.__isUboUse()) {
      const glw = this.__engine.webglResourceRepository.currentWebGLContextWrapper;
      const alignedMaxUniformBlockSize = glw.getAlignedMaxUniformBlockSize();
      const maxConventionBlocks = glw.getMaxConventionUniformBlocks();
      const memoryManager = this.__engine.memoryManager;
      const buffer = memoryManager.getBuffer(BufferUse.GPUInstanceData);
      if (this.__dataUBOUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        this.__dataUBOUid = this.__engine.webglResourceRepository.setupUniformBufferDataArea(
          new Float32Array(buffer.getArrayBuffer())
        );
      } else {
        const array = new Float32Array(buffer.getArrayBuffer());
        this.__engine.webglResourceRepository.updateUniformBuffer(
          this.__dataUBOUid,
          array,
          0,
          alignedMaxUniformBlockSize * maxConventionBlocks / 4
          // (4 bytes unit)
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
  attachGPUData(_primitive) {
  }
  /**
   * Internal GPU data attachment (placeholder implementation).
   * This method is part of the interface but not actively used in data texture strategy.
   *
   * @param gl - The WebGL rendering context
   * @param shaderProgram - The shader program to attach data to
   */
  attachGPUDataInner(_gl, _shaderProgram) {
  }
  /**
   * Attaches vertex data for a primitive (placeholder implementation).
   * This method is part of the interface but delegates to attachVertexDataInner.
   *
   * @param i - Index parameter (unused in this implementation)
   * @param primitive - The primitive to attach vertex data for
   * @param glw - The WebGL context wrapper
   * @param instanceIDBufferUid - The instance ID buffer resource handle
   */
  attachVertexData(_i, _primitive, _glw, _instanceIDBufferUid) {
  }
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
  attachVertexDataInner(mesh, primitive, primitiveIndex, glw, _instanceIDBufferUid) {
    const vao = this.__engine.webglResourceRepository.getWebGLResource(
      mesh.getVaoUids(primitiveIndex)
    );
    if (vao != null) {
      glw.bindVertexArray(vao);
    } else {
      glw.bindVertexArray(null);
      const vertexHandles = primitive.vertexHandles;
      this.__engine.webglResourceRepository.setVertexDataToPipeline(vertexHandles, primitive, mesh._variationVBOUid);
      const ibo = this.__engine.webglResourceRepository.getWebGLResource(vertexHandles.iboHandle);
      const gl = glw.getRawContext();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    }
  }
  /**
   * Detaches vertex data after rendering to keep VAO state isolated from external renderers.
   *
   * @param glw - The WebGL context wrapper for WebGL operations
   */
  dettachVertexData(glw) {
    const gl = glw.getRawContext();
    glw.bindVertexArray(null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
  /**
   * Gets the singleton instance of WebGLStrategyWebGL2.
   * Creates the instance if it doesn't exist and initializes the WebXR system reference.
   *
   * @returns The singleton instance of WebGLStrategyWebGL2
   *
   * @remarks
   * This method ensures only one instance of the strategy exists throughout the application
   * and properly initializes the WebXR system for VR/AR rendering capabilities.
   */
  static init(engine) {
    return new _WebGLStrategyWebGL2(engine);
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
  __setCurrentComponentSIDsForEachDisplayIdx(renderPass, displayIdx, isVRMainPass) {
    if (isVRMainPass) {
      let cameraComponentSid = -1;
      const webxrSystem = this.__engine._webXRSystemIfEnabled;
      if (webxrSystem == null ? void 0 : webxrSystem.isWebXRMode) {
        if (webxrSystem.isMultiView()) {
          cameraComponentSid = webxrSystem._getCameraComponentSIDAt(0);
        } else {
          cameraComponentSid = webxrSystem._getCameraComponentSIDAt(displayIdx);
        }
      }
      this.__currentComponentSIDs._v[WellKnownComponentTIDs.CameraComponentTID] = cameraComponentSid;
    } else {
      let cameraComponent = renderPass.cameraComponent;
      if (cameraComponent == null) {
        cameraComponent = this.__engine.componentRepository.getComponent(
          CameraComponent,
          CameraComponent.getCurrent(this.__engine)
        );
      }
      if (cameraComponent) {
        this.__currentComponentSIDs._v[WellKnownComponentTIDs.CameraComponentTID] = cameraComponent.componentSID;
      } else {
        this.__currentComponentSIDs._v[WellKnownComponentTIDs.CameraComponentTID] = -1;
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
  __setCurrentComponentSIDsForEachPrimitive(_gl, material, _shaderProgram) {
    if (this.__currentComponentSIDs == null) {
      this.__currentComponentSIDs = this.__engine.globalDataRepository.getValue("currentComponentSIDs", 0);
    }
    this.__currentComponentSIDs._v[0] = material.materialSID;
  }
  /**
   * Packs the visible instances of every mesh drawn in this pass into the engine-wide
   * remap table and uploads the instance SID / remap textures once before drawing.
   * This must happen before any draw so that a multi-draw batch spanning several meshes
   * sees the remap entries of all its meshes.
   */
  __uploadInstanceTables(primitiveUids, renderPass, primitives) {
    if (!this.__engine.config.isMultiDrawEnabled) {
      return;
    }
    const webglResourceRepository = this.__engine.webglResourceRepository;
    const glw = webglResourceRepository.currentWebGLContextWrapper;
    if (glw == null || glw.webgl2ExtMD == null) {
      return;
    }
    const table = webglResourceRepository.instanceSidTable;
    if (!table.isSupported) {
      return;
    }
    const cullingState = MeshRendererComponent._getInstanceCullingState(renderPass);
    const anyCulled = cullingState != null && cullingState.culledEntityCount > 0;
    this.__instanceRemapIdentity = anyCulled ? 0 : 1;
    if (!anyCulled) {
      this.__uploadInstanceSidDataTexture(table);
      return;
    }
    const culledEntityStamp = cullingState.culledEntityStamp;
    const cullTick = cullingState.cullTick;
    const cullingId = cullingState.cullingId;
    for (let i = 0; i < primitiveUids.length; i++) {
      const primitiveUid = primitiveUids[i];
      if (primitiveUid === -1) {
        continue;
      }
      const primitive = primitives != null ? primitives[i] : Primitive.getPrimitive(primitiveUid);
      if (primitive == null) {
        continue;
      }
      const mesh = primitive.mesh;
      if (mesh == null || mesh._remapPrepassId === cullingId) {
        continue;
      }
      mesh._remapPrepassId = cullingId;
      mesh._packVisibleInstancesToVariationVBO(culledEntityStamp, cullTick);
    }
    this.__uploadInstanceSidDataTexture(table);
  }
  /**
   * Uploads the dirty instance SID / remap rows into the engine data texture.
   * The two tables are stored in reserved rows after the component data, so the
   * shader can read them from texture unit 0 and no extra texture unit is consumed.
   */
  __uploadInstanceSidDataTexture(table) {
    if (this.__dataTextureUid === CGAPIResourceRepository.InvalidCGAPIResourceUid || this.__dataTextureWidth <= 0) {
      return;
    }
    const usedEnd = table.usedEnd;
    if (usedEnd <= 0) {
      table.clearSidDirty();
      table.clearRemapDirty();
      return;
    }
    if (table.sidDirty) {
      this.__uploadInstanceRegion(
        this.__instanceSidBaseRow,
        usedEnd,
        (dst, texelOffset, count) => table.writeSidTexels(dst, texelOffset, count)
      );
      table.clearSidDirty();
    }
    if (table.remapDirty && this.__instanceRemapIdentity === 0) {
      this.__uploadInstanceRegion(
        this.__instanceRemapBaseRow,
        Math.ceil(usedEnd / 4),
        (dst, texelOffset, count) => table.writeRemapTexels(dst, texelOffset, count)
      );
      table.clearRemapDirty();
    }
  }
  /**
   * Uploads `texelCount` texels starting at `baseRow` to the data texture. Rows are
   * `this.__dataTextureWidth` texels wide, so the last row is uploaded partially.
   */
  __uploadInstanceRegion(baseRow, texelCount, fill) {
    const width = this.__dataTextureWidth;
    let remaining = texelCount;
    let texelOffset = 0;
    let row = baseRow;
    while (remaining > 0) {
      const count = Math.min(remaining, width);
      const data = new Float32Array(count * 4);
      fill(data, texelOffset, count);
      this.__engine.webglResourceRepository.updateTexture(this.__dataTextureUid, data, {
        level: 0,
        offsetX: 0,
        offsetY: row,
        width: count,
        height: 1,
        format: PixelFormat.RGBA,
        type: ComponentType.Float
      });
      remaining -= count;
      texelOffset += count;
      row++;
    }
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
  common_$render(primitiveUids, renderPass, renderPassTickCount, _displayIdx) {
    if (typeof spector !== "undefined") {
      spector.setMarker("|  |  WebGL2:common_$render#");
    }
    const glw = this.__engine.webglResourceRepository.currentWebGLContextWrapper;
    const gl = glw.getRawContextAsWebGL2();
    const isVRMainPass = WebGLStrategyCommonMethod.isVrMainPass(this.__engine, renderPass);
    const displayCount = WebGLStrategyCommonMethod.getDisplayCount(isVRMainPass, this.__engine._webXRSystemIfEnabled);
    const primitives = renderPass._lastPrimitiveUids === primitiveUids ? renderPass._lastPrimitives : null;
    if (renderPass.isBufferLessRenderingMode()) {
      this.__renderWithoutBuffers(gl, renderPass, isVRMainPass);
      gl.depthMask(true);
      return true;
    }
    this.__uploadInstanceTables(primitiveUids, renderPass, primitives);
    let renderedSomething = false;
    if (renderPass._toRenderOpaquePrimitives) {
      if (!renderPass.depthWriteMask) {
        gl.depthMask(false);
      }
      renderedSomething = this.__renderBucket(
        primitiveUids,
        primitives,
        renderPass._lastOpaqueIndex,
        0,
        -1,
        glw,
        renderPass,
        isVRMainPass,
        displayCount
      ) || renderedSomething;
    }
    if (renderPass._toRenderTranslucentPrimitives) {
      renderedSomething = this.__renderBucket(
        primitiveUids,
        primitives,
        renderPass._lastOpaqueIndex + 1,
        renderPass._lastTranslucentIndex,
        1,
        glw,
        renderPass,
        isVRMainPass,
        displayCount
      ) || renderedSomething;
    }
    if (renderPass._toRenderBlendWithZWritePrimitives) {
      renderedSomething = this.__renderBucket(
        primitiveUids,
        primitives,
        renderPass._lastTranslucentIndex + 1,
        renderPass._lastBlendWithZWriteIndex,
        1,
        glw,
        renderPass,
        isVRMainPass,
        displayCount
      ) || renderedSomething;
    }
    if (renderPass._toRenderBlendWithoutZWritePrimitives) {
      gl.depthMask(false);
      renderedSomething = this.__renderBucket(
        primitiveUids,
        primitives,
        renderPass._lastBlendWithZWriteIndex + 1,
        renderPass._lastBlendWithoutZWriteIndex,
        1,
        glw,
        renderPass,
        isVRMainPass,
        displayCount
      ) || renderedSomething;
    }
    gl.depthMask(true);
    this.dettachVertexData(glw);
    this.__lastRenderPassTickCount = renderPassTickCount;
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
  __renderWithoutBuffers(gl, renderPass, isVRMainPass) {
    const material = renderPass.material;
    const primitive = renderPass._dummyPrimitiveForBufferLessRendering;
    setupShaderProgram(material, primitive, this);
    const shaderProgramUid = material.getShaderProgramUid(primitive);
    const shaderProgram = this.__engine.webglResourceRepository.getWebGLResource(shaderProgramUid);
    gl.useProgram(shaderProgram);
    this.__lastShader = shaderProgramUid;
    this.bindDataTexture(gl, shaderProgram);
    this.__setCurrentComponentSIDsForEachPrimitive(gl, material, shaderProgram);
    this.__setCurrentComponentSIDsForEachDisplayIdx(renderPass, 0, isVRMainPass);
    this.__uploadCurrentComponentSIDs(gl, shaderProgram);
    this.__uploadLightClusterView(gl, shaderProgram);
    if (shaderProgram.vrState != null && isVRMainPass) {
      const vrState = this.__engine.globalDataRepository.getValue("vrState", 0);
      vrState._v[0] = isVRMainPass ? 1 : 0;
      vrState._v[1] = 0;
      shaderProgram._gl.uniform2iv(shaderProgram.vrState, vrState._v);
    }
    WebGLStrategyCommonMethod.setWebGLParameters(this.__engine, material, gl);
    material._setParametersToGpuWebGLWithOutInternalSetting({
      shaderProgram,
      firstTime: true
    });
    if (renderPass.depthWriteMask) {
      gl.depthMask(true);
    } else {
      gl.depthMask(false);
    }
    this.__engine.webglResourceRepository.setViewport(this.__engine, renderPass.getViewport());
    const glw = this.__engine.webglResourceRepository.currentWebGLContextWrapper;
    if (glw != null && this.__useMaterialSidAttribute(glw)) {
      gl.bindVertexArray(null);
      gl.vertexAttribI4ui(VertexAttribute.MaterialSid.getAttributeSlot(), material.materialSID, 0, 0, 0);
      gl.vertexAttribI4ui(VertexAttribute.Instance.getAttributeSlot(), 0, 0, 0, 0);
      this.__setInstanceRemapIdentity(gl, shaderProgram);
      this.__setInstanceSidDataTextureIndices(gl, shaderProgram);
    }
    gl.drawArrays(
      renderPass._primitiveModeForBufferLessRendering.index,
      0,
      renderPass._drawVertexNumberForBufferLessRendering
    );
  }
  /** Whether the per-vertex materialSID / instanceBase attribute path is active. */
  __useMaterialSidAttribute(glw) {
    return this.__engine.config.isMultiDrawEnabled && glw.webgl2ExtMD != null && this.__engine.webglResourceRepository.instanceSidTable.isSupported;
  }
  /**
   * Binds the VAO variant matching the effective material and sets the generic
   * materialSID when the per-vertex materialSID buffer must not be used
   * (non-grouped primitives and render-pass material overrides).
   */
  __bindMultiDrawVertexDataForMaterial(primitive, material, glw) {
    const slot = VertexAttribute.MaterialSid.getAttributeSlot();
    const group = primitive._multiDrawGroup;
    const gl = glw.getRawContextAsWebGL2();
    if (group == null || group.vertexHandles == null) {
      gl.vertexAttribI4ui(slot, material.materialSID, 0, 0, 0);
      return;
    }
    const isPerVertexMaterial = material === primitive.material;
    const vaoHandle = isPerVertexMaterial ? group.vertexHandles.vaoHandle : group.genericMaterialSidVaoHandle;
    if (vaoHandle != null) {
      const vao = this.__engine.webglResourceRepository.getWebGLResource(vaoHandle);
      if (vao != null) {
        glw.bindVertexArray(vao);
      }
    }
    if (!isPerVertexMaterial) {
      gl.vertexAttribI4ui(slot, material.materialSID, 0, 0, 0);
    }
  }
  /**
   * Renders a bucket range, batching consecutive primitives that share a multi-draw
   * group, material and shader program into one WEBGL_multi_draw call.
   */
  __renderBucket(primitiveUids, primitives, start, end, step, glw, renderPass, isVRMainPass, displayCount) {
    const useMultiDraw = !isVRMainPass && displayCount === 1 && this.__engine.config.isMultiDrawEnabled && glw.webgl2ExtMD != null && this.__engine.webglResourceRepository.isInstanceSidTextureCapable;
    let renderedSomething = false;
    if (!useMultiDraw) {
      for (let i = start; step > 0 ? i <= end : i >= end; i += step) {
        renderedSomething = this.__renderInner(
          primitiveUids[i],
          glw,
          renderPass,
          isVRMainPass,
          displayCount,
          void 0,
          primitives == null ? void 0 : primitives[i]
        ) || renderedSomething;
      }
      return renderedSomething;
    }
    const getRunKey = (index) => {
      const primitiveUid = primitiveUids[index];
      if (primitiveUid === -1) {
        return null;
      }
      const primitive = primitives != null ? primitives[index] : Primitive.getPrimitive(primitiveUid);
      if (primitive == null || primitive._multiDrawGroup == null) {
        return null;
      }
      const material = renderPass.getAppropriateMaterial(primitive);
      if (!material._materialContent.isMultiDrawCompatible) {
        return null;
      }
      return getMultiDrawStateKeyId(primitive, material, getPrimitiveMeshRendererFingerPrintId(primitive));
    };
    const plan = planMultiDrawRunsInto(start, end, step, getRunKey, this.__runPlan);
    for (let r = 0; r < plan.count; r++) {
      const runStart = plan.starts[r];
      const runCount = plan.counts[r];
      if (plan.keys[r] === -1 || runCount < 2) {
        for (let k = 0; k < runCount; k++) {
          const index = runStart + k * step;
          renderedSomething = this.__renderInner(
            primitiveUids[index],
            glw,
            renderPass,
            isVRMainPass,
            displayCount,
            void 0,
            primitives == null ? void 0 : primitives[index]
          ) || renderedSomething;
        }
      } else {
        renderedSomething = this.__renderMultiDrawBatch(
          primitiveUids,
          primitives,
          runStart,
          runCount,
          step,
          glw,
          renderPass,
          displayCount
        ) || renderedSomething;
      }
    }
    return renderedSomething;
  }
  /**
   * Draws a run of grouped primitives with one multi-draw call. The render state
   * (shader program, material, VAO, textures) is prepared by rendering the first
   * primitive with a deferred draw.
   */
  __renderMultiDrawBatch(primitiveUids, primitives, firstIndex, runCount, step, glw, renderPass, displayCount) {
    var _a;
    const firstPrimitive = primitives != null ? primitives[firstIndex] : Primitive.getPrimitive(primitiveUids[firstIndex]);
    if (firstPrimitive == null || firstPrimitive._multiDrawGroup == null) {
      return false;
    }
    const firstMesh = firstPrimitive.mesh;
    const deferred = {
      primitive: firstPrimitive,
      mesh: firstMesh,
      indexed: firstPrimitive.hasIndices(),
      mode: firstPrimitive.primitiveMode.index,
      indexBitSize: firstPrimitive.getRenderIndexBitSize(),
      count: 0,
      offset: 0,
      instanceCount: 0
    };
    const renderedFirst = this.__renderInner(
      primitiveUids[firstIndex],
      glw,
      renderPass,
      false,
      displayCount,
      deferred,
      firstPrimitive
    );
    if (!renderedFirst) {
      let rendered = false;
      for (let k = 1; k < runCount; k++) {
        const index = firstIndex + k * step;
        rendered = this.__renderInner(
          primitiveUids[index],
          glw,
          renderPass,
          false,
          displayCount,
          void 0,
          primitives == null ? void 0 : primitives[index]
        ) || rendered;
      }
      return rendered;
    }
    const group = firstPrimitive._multiDrawGroup;
    const counts = group.counts;
    const offsets = group.offsets;
    const instanceCounts = group.instanceCounts;
    const firsts = group.firsts;
    const vertexCounts = group.vertexCounts;
    const indexed = deferred.indexed;
    const gl = glw.getRawContextAsWebGL2();
    let drawCount = 0;
    counts[drawCount] = deferred.count;
    offsets[drawCount] = deferred.offset;
    firsts[drawCount] = deferred.offset;
    vertexCounts[drawCount] = deferred.count;
    instanceCounts[drawCount] = deferred.instanceCount;
    drawCount++;
    const cullingState = MeshRendererComponent._getInstanceCullingState(renderPass);
    const culledEntityStamp = cullingState == null ? void 0 : cullingState.culledEntityStamp;
    const cullTick = (_a = cullingState == null ? void 0 : cullingState.cullTick) != null ? _a : 0;
    for (let k = 1; k < runCount; k++) {
      const index = firstIndex + k * step;
      const primitive = primitives != null ? primitives[index] : Primitive.getPrimitive(primitiveUids[index]);
      if (primitive == null || primitive._multiDrawGroup !== group) {
        continue;
      }
      const material = renderPass.getAppropriateMaterial(primitive);
      if (material.getShaderProgramUid(primitive) === -1) {
        setupShaderProgram(material, primitive, this);
      }
      if (isSkipDrawing(material, primitive)) {
        continue;
      }
      const mesh = primitive.mesh;
      const instanceCount = mesh._packVisibleInstancesToVariationVBO(culledEntityStamp, cullTick);
      if (instanceCount === 0) {
        continue;
      }
      const entry = primitive._multiDrawEntry;
      if (entry == null) {
        continue;
      }
      counts[drawCount] = entry.indexCount;
      offsets[drawCount] = entry.indexByteOffset;
      firsts[drawCount] = entry.vertexOffset;
      vertexCounts[drawCount] = entry.vertexCount;
      instanceCounts[drawCount] = instanceCount;
      drawCount++;
    }
    if (drawCount >= 2) {
      if (indexed) {
        glw.multiDrawElementsInstanced(
          deferred.mode,
          counts,
          0,
          gl.UNSIGNED_INT,
          offsets,
          0,
          instanceCounts,
          0,
          drawCount
        );
      } else {
        glw.multiDrawArraysInstanced(deferred.mode, firsts, 0, vertexCounts, 0, instanceCounts, 0, drawCount);
      }
    } else if (drawCount === 1) {
      if (indexed) {
        gl.drawElementsInstanced(deferred.mode, counts[0], gl.UNSIGNED_INT, offsets[0], instanceCounts[0]);
      } else {
        gl.drawArraysInstanced(deferred.mode, firsts[0], vertexCounts[0], instanceCounts[0]);
      }
    }
    return true;
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
  __renderInner(primitiveUid, glw, renderPass, isVRMainPass, displayCount, deferredDraw, primitiveArg) {
    var _a, _b, _c, _d;
    const gl = glw.getRawContextAsWebGL2();
    const primitive = primitiveArg != null ? primitiveArg : Primitive.getPrimitive(primitiveUid);
    if (primitive == null) {
      return false;
    }
    const mesh = primitive.mesh;
    const entity = mesh.meshEntitiesInner[0];
    const material = renderPass.getAppropriateMaterial(primitive);
    setupShaderProgram(material, primitive, this);
    const meshRendererComponent = entity.getMeshRenderer();
    const instanceCullingState = MeshRendererComponent._getInstanceCullingState(renderPass);
    const instanceCount = mesh._packVisibleInstancesToVariationVBO(
      instanceCullingState == null ? void 0 : instanceCullingState.culledEntityStamp,
      (_a = instanceCullingState == null ? void 0 : instanceCullingState.cullTick) != null ? _a : 0
    );
    if (instanceCount === 0) {
      return false;
    }
    const primitiveIndex = mesh.getPrimitiveIndexInMesh(primitive);
    this.attachVertexDataInner(mesh, primitive, primitiveIndex, glw, mesh._variationVBOUid);
    if (this.__useMaterialSidAttribute(glw)) {
      this.__bindMultiDrawVertexDataForMaterial(primitive, material, glw);
    }
    let firstTimeForShaderProgram = false;
    let firstTimeForMaterial = false;
    const shaderProgramUid = material.getShaderProgramUid(primitive);
    if (shaderProgramUid !== this.__lastShader || gl.__changedProgram) {
      if (isSkipDrawing(material, primitive)) {
        this.dettachVertexData(glw);
        return false;
      }
      const shaderProgram = this.__engine.webglResourceRepository.getWebGLResource(shaderProgramUid);
      gl.useProgram(shaderProgram);
      gl.__changedProgram = false;
      this.bindDataTexture(gl, shaderProgram);
      this.__shaderProgram = shaderProgram;
      firstTimeForShaderProgram = true;
      firstTimeForMaterial = true;
    }
    if (((_b = this.__lastMaterial) == null ? void 0 : _b.deref()) !== material) {
      firstTimeForMaterial = true;
      this.__lastMaterial = new WeakRef(material);
    }
    if (this.__lastMaterialStateVersion !== material.stateVersion) {
      firstTimeForMaterial = true;
      this.__lastMaterialStateVersion = material.stateVersion;
    }
    if (this.__useMaterialSidAttribute(glw) && this.__shaderProgram != null) {
      this.__setInstanceRemapIdentity(gl, this.__shaderProgram);
      this.__setInstanceSidDataTextureIndices(gl, this.__shaderProgram);
    }
    const renderingArg = {
      glw,
      entity,
      worldMatrix: entity.getSceneGraph().matrixInner,
      normalMatrix: entity.getSceneGraph().normalMatrixInner,
      isBillboard: entity.getSceneGraph().isBillboard,
      isVisible: entity.getSceneGraph().isVisible,
      lightComponents: this.__lightComponents,
      renderPass,
      primitive,
      diffuseCube: meshRendererComponent.diffuseCubeMap,
      specularCube: meshRendererComponent.specularCubeMap,
      sheenCube: meshRendererComponent.sheenCubeMap,
      isVr: isVRMainPass,
      displayIdx: -1
    };
    if (firstTimeForShaderProgram) {
      material._setParametersToGpuWebGLPerShaderProgram({
        engine: this.__engine,
        material,
        shaderProgram: this.__shaderProgram,
        firstTime: firstTimeForShaderProgram,
        args: renderingArg
      });
    }
    if (firstTimeForMaterial) {
      this.__setCurrentComponentSIDsForEachPrimitive(gl, material, this.__shaderProgram);
      WebGLStrategyCommonMethod.setWebGLParameters(this.__engine, material, gl);
      material._setParametersToGpuWebGL({
        engine: this.__engine,
        material,
        shaderProgram: this.__shaderProgram,
        firstTime: firstTimeForMaterial,
        args: renderingArg
      });
    }
    material._setParametersToGpuWebGLPerPrimitive({
      material,
      shaderProgram: this.__shaderProgram,
      firstTime: firstTimeForMaterial,
      args: renderingArg
    });
    for (let displayIdx = 0; displayIdx < displayCount; displayIdx++) {
      if (isVRMainPass) {
        WebGLStrategyCommonMethod.setVRViewport(this.__engine, renderPass, displayIdx);
      }
      this.__setCurrentComponentSIDsForEachDisplayIdx(renderPass, displayIdx, isVRMainPass);
      this.__uploadCurrentComponentSIDs(gl, this.__shaderProgram);
      this.__uploadLightClusterView(gl, this.__shaderProgram);
      if (this.__shaderProgram.vrState != null && isVRMainPass && displayCount > 1) {
        const vrState = this.__engine.globalDataRepository.getValue("vrState", 0);
        vrState._v[0] = isVRMainPass ? 1 : 0;
        vrState._v[1] = displayIdx;
        this.__shaderProgram._gl.uniform2iv(this.__shaderProgram.vrState, vrState._v);
      }
      const useInstanceSidTexture = this.__engine.config.isMultiDrawEnabled && glw.webgl2ExtMD != null && this.__engine.webglResourceRepository.instanceSidTable.isSupported;
      if (useInstanceSidTexture && primitive._multiDrawGroup == null) {
        gl.vertexAttribI4ui(VertexAttribute.Instance.getAttributeSlot(), Math.max(0, mesh._instanceSidBase), 0, 0, 0);
      }
      const indicesAccessor = primitive.indicesAccessor;
      const indexed = indicesAccessor != null;
      const indexBitSize = primitive.getRenderIndexBitSize();
      const indexType = indexBitSize === "uint32" ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
      const multiDrawEntry = primitive._multiDrawEntry;
      const indexByteOffset = (_c = multiDrawEntry == null ? void 0 : multiDrawEntry.indexByteOffset) != null ? _c : 0;
      const firstVertex = (_d = multiDrawEntry == null ? void 0 : multiDrawEntry.vertexOffset) != null ? _d : 0;
      if (deferredDraw != null) {
        deferredDraw.primitive = primitive;
        deferredDraw.mesh = mesh;
        deferredDraw.indexed = indexed;
        deferredDraw.mode = primitive.primitiveMode.index;
        deferredDraw.indexBitSize = indexBitSize;
        deferredDraw.count = indexed ? indicesAccessor.elementCount : primitive.getVertexCountAsVerticesBased();
        deferredDraw.offset = indexed ? indexByteOffset : firstVertex;
        deferredDraw.instanceCount = instanceCount;
      } else if (indexed) {
        gl.drawElementsInstanced(
          primitive.primitiveMode.index,
          indicesAccessor.elementCount,
          indexType,
          indexByteOffset,
          instanceCount
        );
      } else {
        gl.drawArraysInstanced(
          primitive.primitiveMode.index,
          firstVertex,
          primitive.getVertexCountAsVerticesBased(),
          instanceCount
        );
      }
    }
    this.__lastShader = shaderProgramUid;
    return true;
  }
  /**
   * Uploads the light cluster view of the camera of the draw (`u_lightClusterView`) when the program uses it and
   * the camera or the light cluster data changed since the last upload to the program.
   *
   * The 7 vec4 are [header (6 vec4)][(view vec4 index, 0, 0, 0)], or a view index of -1 when the camera has no
   * clusters. Uniform values persist in the program object, so consecutive draws of the same camera skip the
   * upload; the check keeps the per-draw cost to a comparison in the common case.
   */
  __uploadLightClusterView(gl, shaderProgram) {
    const program = shaderProgram;
    const location = program.lightClusterView;
    if (location == null) {
      return;
    }
    const cameraSid = this.__currentComponentSIDs._v[WellKnownComponentTIDs.CameraComponentTID];
    const lightClusterSystem = this.__engine.lightClusterSystem;
    const version = lightClusterSystem.dataVersion;
    if (program._lightClusterViewCameraSid === cameraSid && program._lightClusterViewVersion === version) {
      return;
    }
    gl.uniform4fv(location, lightClusterSystem._getViewUniformData(cameraSid));
    program._lightClusterViewCameraSid = cameraSid;
    program._lightClusterViewVersion = version;
  }
  /**
   * Uploads the currentComponentSIDs uniform unless the same values were already uploaded to the
   * same program by the previous upload. Uniform values persist in the program object, so
   * consecutive draws of the same material (e.g. a shadow pass) do not need to upload again.
   */
  __uploadCurrentComponentSIDs(gl, shaderProgram) {
    const values = this.__currentComponentSIDs._v;
    let lastValues = this.__lastUploadedComponentSIDs;
    if (this.__lastComponentSIDsProgram === shaderProgram && lastValues != null && lastValues.length === values.length) {
      let isSame = true;
      for (let i = 0; i < values.length; i++) {
        if (lastValues[i] !== values[i]) {
          isSame = false;
          break;
        }
      }
      if (isSame) {
        return;
      }
    }
    gl.uniform1fv(shaderProgram.currentComponentSIDs, values);
    if (lastValues == null || lastValues.length !== values.length) {
      lastValues = new Float32Array(values.length);
      this.__lastUploadedComponentSIDs = lastValues;
    }
    lastValues.set(values);
    this.__lastComponentSIDsProgram = shaderProgram;
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
   * - Sets the data texture uniform to texture unit 0
   * - Binds the data texture to texture unit 0
   * - Creates and binds a repeat/nearest sampler for optimal data texture access
   *
   * Texture unit 0 is used as a dedicated slot for data texture access.
   * Other material textures should start from texture unit 1.
   */
  bindDataTexture(gl, shaderProgram) {
    gl.uniform1i(shaderProgram.dataTexture, 0);
    this.__engine.webglResourceRepository.bindTexture2D(0, this.__dataTextureUid);
    const samplerUid = this.__engine.webglResourceRepository.createOrGetTextureSamplerRepeatNearest();
    this.__engine.webglResourceRepository.bindTextureSampler(0, samplerUid);
    this.bindInstanceSidTextures(gl, shaderProgram);
  }
  /**
   * Binds the engine-wide instance SID / remap textures used by multi-draw rendering.
   * The textures are declared in the common vertex shader include and are only used
   * when RN_USE_INSTANCE_SID_TEXTURE is defined.
   */
  bindInstanceSidTextures(gl, shaderProgram) {
    const webglResourceRepository = this.__engine.webglResourceRepository;
    const glw = webglResourceRepository.currentWebGLContextWrapper;
    if (glw == null || glw.webgl2ExtMD == null || !this.__engine.config.isMultiDrawEnabled) {
      return;
    }
    const table = webglResourceRepository.instanceSidTable;
    if (!table.isSupported) {
      return;
    }
    const program = shaderProgram;
    if (program.__instanceSidTextureLocation === void 0) {
      program.__instanceSidDataTextureIndexLocation = gl.getUniformLocation(
        shaderProgram,
        "u_instanceSidDataTextureIndex"
      );
      program.__instanceRemapDataTextureIndexLocation = gl.getUniformLocation(
        shaderProgram,
        "u_instanceRemapDataTextureIndex"
      );
      program.__instanceRemapIdentityLocation = gl.getUniformLocation(shaderProgram, "u_instanceRemapIdentity");
      program.__instanceSidTextureLocation = null;
    }
    if (program.__instanceSidDataTextureIndexLocation != null) {
      gl.uniform1i(program.__instanceSidDataTextureIndexLocation, this.__instanceSidBaseVec4);
      program.__instanceSidDataTextureIndexValue = this.__instanceSidBaseVec4;
    }
    if (program.__instanceRemapDataTextureIndexLocation != null) {
      gl.uniform1i(program.__instanceRemapDataTextureIndexLocation, this.__instanceRemapBaseVec4);
      program.__instanceRemapDataTextureIndexValue = this.__instanceRemapBaseVec4;
    }
    if (program.__instanceRemapIdentityLocation != null) {
      gl.uniform1i(program.__instanceRemapIdentityLocation, this.__instanceRemapIdentity);
      program.__instanceRemapIdentityValue = this.__instanceRemapIdentity;
    }
  }
  /**
   * Keeps the data-texture base indices of the instance tables in sync with the
   * current texture layout. The indices change when the data texture is recreated
   * (e.g. the instance slot capacity grew) while the same program stays bound.
   */
  __setInstanceSidDataTextureIndices(gl, shaderProgram) {
    const program = shaderProgram;
    if (program.__instanceSidDataTextureIndexLocation == null) {
      return;
    }
    const sidBase = this.__instanceSidBaseVec4;
    if (program.__instanceSidDataTextureIndexValue !== sidBase) {
      gl.uniform1i(program.__instanceSidDataTextureIndexLocation, sidBase);
      program.__instanceSidDataTextureIndexValue = sidBase;
    }
    const remapBase = this.__instanceRemapBaseVec4;
    if (program.__instanceRemapDataTextureIndexValue !== remapBase) {
      gl.uniform1i(program.__instanceRemapDataTextureIndexLocation, remapBase);
      program.__instanceRemapDataTextureIndexValue = remapBase;
    }
  }
  /**
   * Keeps the remap-identity uniform in sync with the current render pass. The culling
   * state can change between passes while the same shader program stays bound, so this
   * is checked before every draw (a cheap property comparison when unchanged).
   */
  __setInstanceRemapIdentity(gl, shaderProgram) {
    const program = shaderProgram;
    if (program.__instanceRemapIdentityLocation == null) {
      return;
    }
    const identity = this.__instanceRemapIdentity;
    if (program.__instanceRemapIdentityValue === identity) {
      return;
    }
    gl.uniform1i(program.__instanceRemapIdentityLocation, identity);
    program.__instanceRemapIdentityValue = identity;
  }
  /**
   * Destroys all GPU resources held by this strategy.
   * Should be called when the engine is being destroyed.
   */
  destroy() {
    const webglResourceRepository = this.__engine.webglResourceRepository;
    if (this.__dataTextureUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      webglResourceRepository.deleteTexture(this.__dataTextureUid);
      this.__dataTextureUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
    if (this.__dataUBOUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      webglResourceRepository.deleteUniformBuffer(this.__dataUBOUid);
      this.__dataUBOUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
    if (this.__morphOffsetsUniformBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      webglResourceRepository.deleteUniformBuffer(this.__morphOffsetsUniformBufferUid);
      this.__morphOffsetsUniformBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
    if (this.__morphWeightsUniformBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      webglResourceRepository.deleteUniformBuffer(this.__morphWeightsUniformBufferUid);
      this.__morphWeightsUniformBufferUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
  }
  // $render(): void {}
};
_WebGLStrategyWebGL2.__isDebugOperationToDataTextureBufferDone = true;
var WebGLStrategyWebGL2 = _WebGLStrategyWebGL2;
export {
  WebGLStrategyWebGL2
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3JjL3dlYmdsL1dlYkdMU3RyYXRlZ3lXZWJHTDIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IEFuaW1hdGlvbkNvbXBvbmVudCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29tcG9uZW50cy9BbmltYXRpb24vQW5pbWF0aW9uQ29tcG9uZW50JztcbmltcG9ydCB7IEJsZW5kU2hhcGVDb21wb25lbnQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvbXBvbmVudHMvQmxlbmRTaGFwZS9CbGVuZFNoYXBlQ29tcG9uZW50JztcbmltcG9ydCB7IENhbWVyYUNvbXBvbmVudCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29tcG9uZW50cy9DYW1lcmEvQ2FtZXJhQ29tcG9uZW50JztcbmltcG9ydCB7IENhbWVyYUNvbnRyb2xsZXJDb21wb25lbnQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvbXBvbmVudHMvQ2FtZXJhQ29udHJvbGxlci9DYW1lcmFDb250cm9sbGVyQ29tcG9uZW50JztcbmltcG9ydCB7IExpZ2h0Q29tcG9uZW50IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb21wb25lbnRzL0xpZ2h0L0xpZ2h0Q29tcG9uZW50JztcbmltcG9ydCB7IE1lc2hDb21wb25lbnQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvbXBvbmVudHMvTWVzaC9NZXNoQ29tcG9uZW50JztcbmltcG9ydCB7IE1lc2hSZW5kZXJlckNvbXBvbmVudCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29tcG9uZW50cy9NZXNoUmVuZGVyZXIvTWVzaFJlbmRlcmVyQ29tcG9uZW50JztcbmltcG9ydCB7IFNjZW5lR3JhcGhDb21wb25lbnQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvbXBvbmVudHMvU2NlbmVHcmFwaC9TY2VuZUdyYXBoQ29tcG9uZW50JztcbmltcG9ydCB7IFRyYW5zZm9ybUNvbXBvbmVudCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29tcG9uZW50cy9UcmFuc2Zvcm0vVHJhbnNmb3JtQ29tcG9uZW50JztcbmltcG9ydCB7IFdlbGxLbm93bkNvbXBvbmVudFRJRHMgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvbXBvbmVudHMvV2VsbEtub3duQ29tcG9uZW50VElEcyc7XG5pbXBvcnQgeyBDb21wb25lbnQsIHR5cGUgTWVtYmVySW5mbyB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29yZS9Db21wb25lbnQnO1xuaW1wb3J0IHsgQnVmZmVyVXNlIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9CdWZmZXJVc2UnO1xuaW1wb3J0IHsgQ29tcG9uZW50VHlwZSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvQ29tcG9uZW50VHlwZSc7XG5pbXBvcnQgeyBDb21wb3NpdGlvblR5cGUgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL0NvbXBvc2l0aW9uVHlwZSc7XG5pbXBvcnQgeyBQaXhlbEZvcm1hdCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvUGl4ZWxGb3JtYXQnO1xuaW1wb3J0IHR5cGUgeyBTaGFkZXJTZW1hbnRpY3NOYW1lIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9TaGFkZXJTZW1hbnRpY3MnO1xuaW1wb3J0IHR5cGUgeyBTaGFkZXJTZW1hbnRpY3NJbmZvIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9TaGFkZXJTZW1hbnRpY3NJbmZvJztcbmltcG9ydCB7IFNoYWRlclR5cGUsIHR5cGUgU2hhZGVyVHlwZUVudW0gfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1NoYWRlclR5cGUnO1xuaW1wb3J0IHsgVGV4dHVyZUZvcm1hdCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvVGV4dHVyZUZvcm1hdCc7XG5pbXBvcnQgeyBWZXJ0ZXhBdHRyaWJ1dGUgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1ZlcnRleEF0dHJpYnV0ZSc7XG5pbXBvcnQgdHlwZSB7IE1lc2ggfSBmcm9tICcuLi9mb3VuZGF0aW9uL2dlb21ldHJ5L01lc2gnO1xuaW1wb3J0IHsgUHJpbWl0aXZlIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9nZW9tZXRyeS9QcmltaXRpdmUnO1xuaW1wb3J0IHR5cGUgeyBNYXRlcmlhbCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWF0ZXJpYWxzL2NvcmUvTWF0ZXJpYWwnO1xuaW1wb3J0IHR5cGUgeyBWZWN0b3IyIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9tYXRoL1ZlY3RvcjInO1xuaW1wb3J0IHR5cGUgeyBWZWN0b3JOIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9tYXRoL1ZlY3Rvck4nO1xuaW1wb3J0IHR5cGUgeyBBY2Nlc3NvciB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWVtb3J5L0FjY2Vzc29yJztcbmltcG9ydCB0eXBlIHsgQnVmZmVyIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9tZW1vcnkvQnVmZmVyJztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHsgTWlzY1V0aWwgfSBmcm9tICcuLi9mb3VuZGF0aW9uL21pc2MvTWlzY1V0aWwnO1xuaW1wb3J0IHsgQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkgfSBmcm9tICcuLi9mb3VuZGF0aW9uL3JlbmRlcmVyL0NHQVBJUmVzb3VyY2VSZXBvc2l0b3J5JztcbmltcG9ydCB0eXBlIHsgQ0dBUElTdHJhdGVneSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vcmVuZGVyZXIvQ0dBUElTdHJhdGVneSc7XG5pbXBvcnQgeyBzdWJ0cmFjdEJ5dGVSYW5nZXMgfSBmcm9tICcuLi9mb3VuZGF0aW9uL3JlbmRlcmVyL2xpZ2h0Q2x1c3Rlci9MaWdodENsdXN0ZXJMYXlvdXQnO1xuaW1wb3J0IHsgaXNTa2lwRHJhd2luZyB9IGZyb20gJy4uL2ZvdW5kYXRpb24vcmVuZGVyZXIvUmVuZGVyaW5nQ29tbW9uTWV0aG9kcyc7XG5pbXBvcnQgdHlwZSB7IFJlbmRlclBhc3MgfSBmcm9tICcuLi9mb3VuZGF0aW9uL3JlbmRlcmVyL1JlbmRlclBhc3MnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi9mb3VuZGF0aW9uL3N5c3RlbS9FbmdpbmUnO1xuaW1wb3J0IHR5cGUge1xuICBCeXRlLFxuICBDR0FQSVJlc291cmNlSGFuZGxlLFxuICBDb3VudCxcbiAgSW5kZXgsXG4gIEluZGV4T2Y0Qnl0ZXMsXG4gIEluZGV4T2YxNkJ5dGVzLFxuICBQcmltaXRpdmVVSUQsXG4gIFdlYkdMUmVzb3VyY2VIYW5kbGUsXG59IGZyb20gJy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB0eXBlIHsgSW5zdGFuY2VTaWRUYWJsZSB9IGZyb20gJy4vSW5zdGFuY2VTaWRUYWJsZSc7XG5pbXBvcnQge1xuICB0eXBlIERlZmVycmVkTXVsdGlEcmF3LFxuICBnZXRNdWx0aURyYXdTdGF0ZUtleUlkLFxuICBnZXRQcmltaXRpdmVNZXNoUmVuZGVyZXJGaW5nZXJQcmludElkLFxuICB0eXBlIE11bHRpRHJhd1J1blBsYW4sXG4gIHBsYW5NdWx0aURyYXdSdW5zSW50byxcbn0gZnJvbSAnLi9NdWx0aURyYXcnO1xuaW1wb3J0IHR5cGUgeyBSZW5kZXJpbmdBcmdXZWJHTCB9IGZyb20gJy4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBXZWJHTENvbnRleHRXcmFwcGVyIH0gZnJvbSAnLi9XZWJHTENvbnRleHRXcmFwcGVyJztcbmltcG9ydCB0eXBlIHsgU2hhZGVyU291cmNlcywgV2ViR0xTdHJhdGVneSB9IGZyb20gJy4vV2ViR0xTdHJhdGVneSc7XG5pbXBvcnQgV2ViR0xTdHJhdGVneUNvbW1vbk1ldGhvZCwgeyBzZXR1cFNoYWRlclByb2dyYW0gfSBmcm9tICcuL1dlYkdMU3RyYXRlZ3lDb21tb25NZXRob2QnO1xuXG5kZWNsYXJlIGNvbnN0IHNwZWN0b3I6IGFueTtcblxuLyoqXG4gKiBXZWJHTCByZW5kZXJpbmcgc3RyYXRlZ3kgaW1wbGVtZW50YXRpb24gdGhhdCB1c2VzIGRhdGEgdGV4dHVyZXMgZm9yIHN0b3Jpbmcgc2hhZGVyIGRhdGEuXG4gKiBUaGlzIHN0cmF0ZWd5IHN0b3JlcyB1bmlmb3JtIGRhdGEgaW4gdGV4dHVyZXMgcmF0aGVyIHRoYW4gdHJhZGl0aW9uYWwgdW5pZm9ybSB2YXJpYWJsZXMsXG4gKiBlbmFibGluZyBzdXBwb3J0IGZvciBsYXJnZXIgYW1vdW50cyBvZiBpbnN0YW5jZSBkYXRhIGFuZCBtb3JlIGVmZmljaWVudCBiYXRjaCByZW5kZXJpbmcuXG4gKlxuICogQHJlbWFya3NcbiAqIFRoaXMgY2xhc3MgaW1wbGVtZW50cyBib3RoIENHQVBJU3RyYXRlZ3kgYW5kIFdlYkdMU3RyYXRlZ3kgaW50ZXJmYWNlcywgcHJvdmlkaW5nXG4gKiBhIGNvbXBsZXRlIHJlbmRlcmluZyBwaXBlbGluZSBmb3IgV2ViR0wgd2l0aCBkYXRhIHRleHR1cmUgb3B0aW1pemF0aW9uLlxuICogVGhlIHN0cmF0ZWd5IGlzIHBhcnRpY3VsYXJseSB1c2VmdWwgZm9yIHJlbmRlcmluZyBtYW55IGluc3RhbmNlcyB3aXRoIHVuaXF1ZSBwcm9wZXJ0aWVzLlxuICovXG5leHBvcnQgY2xhc3MgV2ViR0xTdHJhdGVneVdlYkdMMiBpbXBsZW1lbnRzIENHQVBJU3RyYXRlZ3ksIFdlYkdMU3RyYXRlZ3kge1xuICBwcml2YXRlIF9fZW5naW5lOiBFbmdpbmU7XG4gIHByaXZhdGUgX19kYXRhVGV4dHVyZVVpZDogQ0dBUElSZXNvdXJjZUhhbmRsZSA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICBwcml2YXRlIF9fZGF0YVVCT1VpZDogQ0dBUElSZXNvdXJjZUhhbmRsZSA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICBwcml2YXRlIF9fbW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlclVpZDogQ0dBUElSZXNvdXJjZUhhbmRsZSA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICBwcml2YXRlIF9fbW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlclVpZDogQ0dBUElSZXNvdXJjZUhhbmRsZSA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICBwcml2YXRlIF9fbGFzdFNoYWRlcjogQ0dBUElSZXNvdXJjZUhhbmRsZSA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICBwcml2YXRlIF9fbGFzdE1hdGVyaWFsPzogV2Vha1JlZjxNYXRlcmlhbD47XG4gIHByaXZhdGUgX19sYXN0TWF0ZXJpYWxTdGF0ZVZlcnNpb24gPSAtMTtcbiAgcHJpdmF0ZSBfX3NoYWRlclByb2dyYW0/OiBXZWJHTFByb2dyYW07XG4gIHByaXZhdGUgX19sYXN0UmVuZGVyUGFzc1RpY2tDb3VudCA9IC0xO1xuICAvKipcbiAgICogMSB3aGVuIGV2ZXJ5IG1lc2ggZHJhd24gaW4gdGhlIGN1cnJlbnQgcGFzcyBzaG93cyBhbGwgb2YgaXRzIGluc3RhbmNlcywgd2hpY2ggbGV0cyB0aGVcbiAgICogdmVydGV4IHNoYWRlciBza2lwIHRoZSByZW1hcCB0ZXh0dXJlIGZldGNoIGFuZCByZWFkIHRoZSBTSUQgdGV4ZWwgZGlyZWN0bHkuXG4gICAqL1xuICBwcml2YXRlIF9faW5zdGFuY2VSZW1hcElkZW50aXR5ID0gMTtcbiAgLyoqIFJldXNlZCBudW1lcmljIHJ1biBwbGFuIG9mIHRoZSBjdXJyZW50IGJ1Y2tldCAobm8gcGVyLWZyYW1lIGFsbG9jYXRpb24pLiAqL1xuICBwcml2YXRlIF9fcnVuUGxhbjogTXVsdGlEcmF3UnVuUGxhbiA9IHtcbiAgICBzdGFydHM6IG5ldyBJbnQzMkFycmF5KDApLFxuICAgIGNvdW50czogbmV3IEludDMyQXJyYXkoMCksXG4gICAga2V5czogbmV3IEludDMyQXJyYXkoMCksXG4gICAgY291bnQ6IDAsXG4gIH07XG4gIC8qKiBMYXlvdXQgb2YgdGhlIGluc3RhbmNlIFNJRCAvIHJlbWFwIHJlZ2lvbnMgaW5zaWRlIHRoZSBkYXRhIHRleHR1cmUuICovXG4gIHByaXZhdGUgX19kYXRhVGV4dHVyZVdpZHRoID0gMDtcbiAgcHJpdmF0ZSBfX2luc3RhbmNlU2lkQmFzZVJvdyA9IDA7XG4gIHByaXZhdGUgX19pbnN0YW5jZVJlbWFwQmFzZVJvdyA9IDA7XG4gIHByaXZhdGUgX19pbnN0YW5jZVNpZEJhc2VWZWM0ID0gMDtcbiAgcHJpdmF0ZSBfX2luc3RhbmNlUmVtYXBCYXNlVmVjNCA9IDA7XG4gIHByaXZhdGUgX19pbnN0YW5jZVNpZENhcGFjaXR5ID0gMDtcbiAgcHJpdmF0ZSBfX2xpZ2h0Q29tcG9uZW50cz86IExpZ2h0Q29tcG9uZW50W107XG4gIHByaXZhdGUgX19jdXJyZW50Q29tcG9uZW50U0lEcz86IFZlY3Rvck47XG4gIC8qKiBQcm9ncmFtIGFuZCB2YWx1ZXMgb2YgdGhlIGxhc3QgY3VycmVudENvbXBvbmVudFNJRHMgdXBsb2FkLCB1c2VkIHRvIHNraXAgcmVkdW5kYW50IHVwbG9hZHMuICovXG4gIHByaXZhdGUgX19sYXN0Q29tcG9uZW50U0lEc1Byb2dyYW0/OiBXZWJHTFByb2dyYW07XG4gIHByaXZhdGUgX19sYXN0VXBsb2FkZWRDb21wb25lbnRTSURzPzogRmxvYXQzMkFycmF5O1xuICBwdWJsaWMgX3RvdGFsU2l6ZU9mR1BVU2hhZGVyRGF0YVN0b3JhZ2VFeGNlcHRNb3JwaERhdGEgPSAwO1xuICBwcml2YXRlIHN0YXRpYyBfX2lzRGVidWdPcGVyYXRpb25Ub0RhdGFUZXh0dXJlQnVmZmVyRG9uZSA9IHRydWU7XG5cbiAgcHJpdmF0ZSBfX3VuaWZvcm1Nb3JwaE9mZnNldHNUeXBlZEFycmF5PzogVWludDMyQXJyYXk7XG4gIHByaXZhdGUgX191bmlmb3JtTW9ycGhXZWlnaHRzVHlwZWRBcnJheT86IEZsb2F0MzJBcnJheTtcbiAgcHJpdmF0ZSBfX2xhc3RCbGVuZFNoYXBlQ29tcG9uZW50c1VwZGF0ZUNvdW50Rm9yV2VpZ2h0cyA9IC0xO1xuICBwcml2YXRlIF9fbGFzdE1vcnBoTWF4SW5kZXggPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RNYXRlcmlhbHNVcGRhdGVDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdExpZ2h0Q2x1c3RlckRhdGFWZXJzaW9uID0gLTE7XG4gIHByaXZhdGUgX19sYXN0TGlnaHRDb21wb25lbnRzVXBkYXRlQ291bnQgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RUb3RhbFNpemVPZkdQVVNoYWRlckRhdGFTdG9yYWdlRXhjZXB0TW9ycGhEYXRhID0gLTE7XG4gIHByaXZhdGUgX19sYXN0VHJhbnNmb3JtQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gLTE7XG4gIHByaXZhdGUgX19sYXN0U2NlbmVHcmFwaENvbXBvbmVudHNVcGRhdGVDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdENhbWVyYUNvbXBvbmVudHNVcGRhdGVDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdENhbWVyYUNvbnRyb2xsZXJDb21wb25lbnRzVXBkYXRlQ291bnQgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RHcHVJbnN0YW5jZURhdGFCdWZmZXJDb3VudCA9IC0xO1xuXG4gIHByaXZhdGUgX19sYXN0TW9ycGhPZmZzZXRzVW5pZm9ybURhdGFTaXplID0gLTE7XG4gIHByaXZhdGUgX19sYXN0TW9ycGhXZWlnaHRzVW5pZm9ybURhdGFTaXplID0gLTE7XG4gIHByaXZhdGUgX19jb3VudE9mQmxlbmRTaGFwZUNvbXBvbmVudHMgPSAtMTtcblxuICAvKipcbiAgICogUHJpdmF0ZSBjb25zdHJ1Y3RvciB0byBlbmZvcmNlIHNpbmdsZXRvbiBwYXR0ZXJuLlxuICAgKiBJbW1lZGlhdGVseSBpbml0aWFsaXplcyBfX2N1cnJlbnRDb21wb25lbnRTSURzIGZyb20gdGhlIGVuZ2luZSdzIEdsb2JhbERhdGFSZXBvc2l0b3J5XG4gICAqIHRvIGF2b2lkIG51bGwgcmVmZXJlbmNlIGVycm9ycyBkdXJpbmcgcmVuZGVyaW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihlbmdpbmU6IEVuZ2luZSkge1xuICAgIHRoaXMuX19lbmdpbmUgPSBlbmdpbmU7XG4gICAgLy8gSW5pdGlhbGl6ZSBfX2N1cnJlbnRDb21wb25lbnRTSURzIGltbWVkaWF0ZWx5IHRvIHByZXZlbnQgbnVsbCByZWZlcmVuY2UgZXJyb3JzXG4gICAgLy8gVGhpcyBtdXN0IGJlIGRvbmUgYWZ0ZXIgR2xvYmFsRGF0YVJlcG9zaXRvcnkuaW5pdGlhbGl6ZSgpIGhhcyBiZWVuIGNhbGxlZCBpbiBFbmdpbmUuaW5pdCgpXG4gICAgdGhpcy5fX2N1cnJlbnRDb21wb25lbnRTSURzID0gdGhpcy5fX2VuZ2luZS5nbG9iYWxEYXRhUmVwb3NpdG9yeS5nZXRWYWx1ZSgnY3VycmVudENvbXBvbmVudFNJRHMnLCAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZXMgdGhlIGR1bXBpbmcgb2YgdGhlIGRhdGEgdGV4dHVyZSBidWZmZXIgZm9yIGRlYnVnZ2luZyBwdXJwb3Nlcy5cbiAgICogVGhpcyBtZXRob2QgZmxhZ3MgdGhlIHN5c3RlbSB0byBleHBvcnQgdGhlIGRhdGEgdGV4dHVyZSBidWZmZXIgY29udGVudHNcbiAgICogb24gdGhlIG5leHQgcmVuZGVyaW5nIGN5Y2xlLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGUgZHVtcGVkIGJ1ZmZlciB3aWxsIGJlIGRvd25sb2FkZWQgYXMgYSBiaW5hcnkgZmlsZSBuYW1lZCAnUmhvZG9uaXRlX2RhdGFUZXh0dXJlQnVmZmVyLmJpbicuXG4gICAqIFRoaXMgaXMgdXNlZnVsIGZvciBkZWJ1Z2dpbmcgc2hhZGVyIGRhdGEgbGF5b3V0IGFuZCBjb250ZW50IGlzc3Vlcy5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgZHVtcERhdGFUZXh0dXJlQnVmZmVyKCkge1xuICAgIHRoaXMuX19pc0RlYnVnT3BlcmF0aW9uVG9EYXRhVGV4dHVyZUJ1ZmZlckRvbmUgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBtZXRob2QgZGVmaW5pdGlvbnMgZm9yIGNvbXBvbmVudCBkYXRhIGFjY2VzcyBmb3IgZGF0YSB0ZXh0dXJlLWJhc2VkIHJlbmRlcmluZy5cbiAgICogUHJvdmlkZXMgR0xTTCBmdW5jdGlvbnMgZm9yIGFjY2Vzc2luZyBjb21wb25lbnQgZGF0YSB0aHJvdWdoIGRhdGEgdGV4dHVyZXMuXG4gICAqIEBwYXJhbSBzaGFkZXJUeXBlIC0gVGhlIHNoYWRlciB0eXBlIChWZXJ0ZXhTaGFkZXIgb3IgUGl4ZWxTaGFkZXIpXG4gICAqIEByZXR1cm5zIEdMU0wgc2hhZGVyIGNvZGUgc3RyaW5nIGZvciB0aGUgY29tcG9uZW50IGRhdGEgYWNjZXNzIG1ldGhvZCBkZWZpbml0aW9uc1xuICAgKi9cbiAgc3RhdGljIF9fZ2V0Q29tcG9uZW50RGF0YUFjY2Vzc01ldGhvZERlZmluaXRpb25zX2RhdGFUZXh0dXJlKGVuZ2luZTogRW5naW5lLCBzaGFkZXJUeXBlOiBTaGFkZXJUeXBlRW51bSkge1xuICAgIGxldCBzdHIgPSAnJztcbiAgICBjb25zdCBtZW1iZXJJbmZvID0gQ29tcG9uZW50LmdldE1lbWJlckluZm8oZW5naW5lKTtcbiAgICBtZW1iZXJJbmZvLmZvckVhY2goKG1hcE1lbWJlck5hbWVNZW1iZXJJbmZvLCBjb21wb25lbnRDbGFzcykgPT4ge1xuICAgICAgbWFwTWVtYmVyTmFtZU1lbWJlckluZm8uZm9yRWFjaCgobWVtYmVySW5mbywgbWVtYmVyTmFtZSkgPT4ge1xuICAgICAgICBpZiAobWVtYmVySW5mby5zaGFkZXJUeXBlICE9PSBzaGFkZXJUeXBlICYmIG1lbWJlckluZm8uc2hhZGVyVHlwZSAhPT0gU2hhZGVyVHlwZS5WZXJ0ZXhBbmRQaXhlbFNoYWRlcikge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcgPSBDb21wb25lbnQuZ2V0Q29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3KGVuZ2luZSkuZ2V0KGNvbXBvbmVudENsYXNzKSA/PyAxO1xuICAgICAgICBpZiAoQ29tcG9zaXRpb25UeXBlLmlzQXJyYXkobWVtYmVySW5mby5jb21wb3NpdGlvblR5cGUpKSB7XG4gICAgICAgICAgcHJvY2Vzc0ZvckFycmF5VHlwZShtZW1iZXJJbmZvLCBjb21wb25lbnRDbGFzcywgbWVtYmVyTmFtZSwgY29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwcm9jZXNzRm9yTm9uQXJyYXlUeXBlKG1lbWJlckluZm8sIGNvbXBvbmVudENsYXNzLCBtZW1iZXJOYW1lLCBjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBzdHI7XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzRm9yQXJyYXlUeXBlKFxuICAgICAgbWVtYmVySW5mbzogTWVtYmVySW5mbyxcbiAgICAgIGNvbXBvbmVudENsYXNzOiB0eXBlb2YgQ29tcG9uZW50LFxuICAgICAgbWVtYmVyTmFtZTogc3RyaW5nLFxuICAgICAgY29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3OiBudW1iZXJcbiAgICApIHtcbiAgICAgIGxldCB0eXBlU3RyID0gJyc7XG4gICAgICBsZXQgZmV0Y2hUeXBlU3RyID0gJyc7XG4gICAgICBzd2l0Y2ggKG1lbWJlckluZm8uY29tcG9zaXRpb25UeXBlKSB7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzRBcnJheTpcbiAgICAgICAgICB0eXBlU3RyID0gJ3ZlYzQnO1xuICAgICAgICAgIGZldGNoVHlwZVN0ciA9ICdmZXRjaFZlYzQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQ0QXJyYXk6XG4gICAgICAgICAgdHlwZVN0ciA9ICdtYXQ0JztcbiAgICAgICAgICBmZXRjaFR5cGVTdHIgPSAnZmV0Y2hNYXQ0JztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0NHgzQXJyYXk6XG4gICAgICAgICAgdHlwZVN0ciA9ICdtYXQ0eDMnO1xuICAgICAgICAgIGZldGNoVHlwZVN0ciA9ICdmZXRjaE1hdDR4Myc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBjb21wb3NpdGlvbiB0eXBlOiAke21lbWJlckluZm8uY29tcG9zaXRpb25UeXBlLnN0cn1gKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdmVjNFNpemVPZlByb3BlcnR5OiBJbmRleE9mMTZCeXRlcyA9IG1lbWJlckluZm8uY29tcG9zaXRpb25UeXBlLmdldFZlYzRTaXplT2ZQcm9wZXJ0eSgpO1xuXG4gICAgICBpZiAobWVtYmVySW5mby5pc1ZhcmlhYmxlTGVuZ3RoID09PSB0cnVlKSB7XG4gICAgICAgIC8vIEVhY2ggaW5zdGFuY2UgaGFzIGl0cyBvd24gY2h1bmsuIEl0cyBsb2NhdGlvbiBpcyBzdG9yZWQgaW4gdGhlIGAke21lbWJlck5hbWV9TG9jYXRpb25gIG1lbWJlcixcbiAgICAgICAgLy8gd2hvc2UgZ2V0dGVyIGlzIGdlbmVyYXRlZCBiZWZvcmUgdGhpcyBvbmUgKGl0IGlzIHJlZ2lzdGVyZWQgYmVmb3JlIHRoZSB2YXJpYWJsZS1sZW5ndGggbWVtYmVyKS5cbiAgICAgICAgY29uc3QgcmFkaXggPSBDb21wb25lbnQuX3ZhcmlhYmxlTGVuZ3RoTG9jYXRpb25SYWRpeDtcbiAgICAgICAgc3RyICs9IGBcbiAgJHt0eXBlU3RyfSBnZXRfJHttZW1iZXJOYW1lfSh1aW50IGluc3RhbmNlSWQsIHVpbnQgaWR4T2ZBcnJheSkge1xuICAgIHZlYzQgbG9jYXRpb24gPSBnZXRfJHtDb21wb25lbnQuX2dldFZhcmlhYmxlTGVuZ3RoTG9jYXRpb25NZW1iZXJOYW1lKG1lbWJlck5hbWUpfShpbnN0YW5jZUlkKTtcbiAgICBpbnQgaW5kZXggPSBpbnQobG9jYXRpb24ueCkgKiAke3JhZGl4fSArIGludChsb2NhdGlvbi55KSArICR7dmVjNFNpemVPZlByb3BlcnR5fSAqIGludChpZHhPZkFycmF5KTtcbiAgICAke3R5cGVTdHJ9IHZhbHVlID0gJHtmZXRjaFR5cGVTdHJ9KGluZGV4KTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbmA7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbG9jYXRpb25PZmZzZXRzX3ZlYzRfaWR4ID0gQ29tcG9uZW50LmdldExvY2F0aW9uT2Zmc2V0T2ZNZW1iZXJPZkNvbXBvbmVudChcbiAgICAgICAgZW5naW5lLFxuICAgICAgICBjb21wb25lbnRDbGFzcyxcbiAgICAgICAgbWVtYmVyTmFtZVxuICAgICAgKTtcbiAgICAgIGNvbnN0IGFycmF5TGVuZ3RoTWFwID0gQ29tcG9uZW50LmdldEFycmF5TGVuZ3RoT2ZNZW1iZXIoZW5naW5lKS5nZXQoY29tcG9uZW50Q2xhc3MpID8/IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG4gICAgICBjb25zdCBhcnJheUxlbmd0aCA9IGFycmF5TGVuZ3RoTWFwLmdldChtZW1iZXJOYW1lKSA/PyAwO1xuICAgICAgY29uc3QgYXJyYXlMZW5ndGhTdHIgPSBgaW50IGFycmF5TGVuZ3RoID0gJHthcnJheUxlbmd0aH07YDtcbiAgICAgIC8vIFRoZSBvZmZzZXRzIG9mIHRoZSBidWZmZXIgdmlld3MgYXJlIGEgY29tcGlsZS10aW1lIGNvbnN0YW50LiBUaGV5IG11c3QgYmUgZGVjbGFyZWQgYXQgZ2xvYmFsIHNjb3BlOiBhIGxvY2FsXG4gICAgICAvLyBhcnJheSBpbml0aWFsaXplciBydW5zIG9uIGV2ZXJ5IGNhbGwsIHdoaWNoIGlzIGV4cGVuc2l2ZSB3aGVuIGEgc2NlbmUgaGFzIG1hbnkgY29tcG9uZW50cyBvZiB0aGUgY2xhc3NcbiAgICAgIC8vICh0aGUgdGFibGUgaGFzIG9uZSBlbnRyeSBwZXIgYnVmZmVyIHZpZXcsIGkuZS4gcGVyIGNhbWVyYSBmb3IgY2FtZXJhQ29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3IDEpLlxuICAgICAgY29uc3QgaW5kaWNlc05hbWUgPSBgcm5JbmRpY2VzXyR7bWVtYmVyTmFtZX1gO1xuICAgICAgY29uc3QgaW5kZXhTdHIgPSBgaW50IGluZGV4ID0gJHtpbmRpY2VzTmFtZX1baW5zdGFuY2VJZE9mQnVmZmVyVmlld3NdICsgaW50KGluc3RhbmNlSWRJbkJ1ZmZlclZpZXcpICogJHt2ZWM0U2l6ZU9mUHJvcGVydHl9ICogYXJyYXlMZW5ndGggKyAke3ZlYzRTaXplT2ZQcm9wZXJ0eX0gKiBpbnQoaWR4T2ZBcnJheSk7YDsgLy8gdmVjNF9pZHhcbiAgICAgIGxldCBjb252ZXJzaW9uU3RyID0gJyc7XG4gICAgICBpZiAobWVtYmVySW5mby5jb252ZXJ0VG9Cb29sKSB7XG4gICAgICAgIGNvbnZlcnNpb25TdHIgPSAncmV0dXJuICh2YWx1ZSA+IDAuNSkgPyB0cnVlIDogZmFsc2U7JztcbiAgICAgIH1cbiAgICAgIHN0ciArPSBgXG4gIGNvbnN0IGludCAke2luZGljZXNOYW1lfVske2xvY2F0aW9uT2Zmc2V0c192ZWM0X2lkeC5sZW5ndGh9XSA9IGludFske2xvY2F0aW9uT2Zmc2V0c192ZWM0X2lkeC5sZW5ndGh9XSgke2xvY2F0aW9uT2Zmc2V0c192ZWM0X2lkeC5qb2luKCcsICcpfSk7XG4gICR7bWVtYmVySW5mby5jb252ZXJ0VG9Cb29sID8gJ2Jvb2wnIDogdHlwZVN0cn0gZ2V0XyR7bWVtYmVyTmFtZX0odWludCBpbnN0YW5jZUlkLCB1aW50IGlkeE9mQXJyYXkpIHtcbiAgICB1aW50IGluc3RhbmNlSWRPZkJ1ZmZlclZpZXdzID0gaW5zdGFuY2VJZCAvICR7Y29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3fXU7XG4gICAgdWludCBpbnN0YW5jZUlkSW5CdWZmZXJWaWV3ID0gaW5zdGFuY2VJZCAlICR7Y29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3fXU7XG4gICAgJHthcnJheUxlbmd0aFN0cn1cbiAgICAke2luZGV4U3RyfVxuICAgICR7dHlwZVN0cn0gdmFsdWUgPSAke2ZldGNoVHlwZVN0cn0oaW5kZXgpO1xuICAgICR7bWVtYmVySW5mby5jb252ZXJ0VG9Cb29sID8gY29udmVyc2lvblN0ciA6ICdyZXR1cm4gdmFsdWU7J31cbiAgfVxuYDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcHJvY2Vzc0Zvck5vbkFycmF5VHlwZShcbiAgICAgIG1lbWJlckluZm86IE1lbWJlckluZm8sXG4gICAgICBjb21wb25lbnRDbGFzczogdHlwZW9mIENvbXBvbmVudCxcbiAgICAgIG1lbWJlck5hbWU6IHN0cmluZyxcbiAgICAgIGNvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldzogbnVtYmVyXG4gICAgKSB7XG4gICAgICBsZXQgdHlwZVN0ciA9ICcnO1xuICAgICAgbGV0IGZldGNoVHlwZVN0ciA9ICcnO1xuICAgICAgc3dpdGNoIChtZW1iZXJJbmZvLmNvbXBvc2l0aW9uVHlwZSkge1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQ0OlxuICAgICAgICAgIHR5cGVTdHIgPSAnbWF0NCc7XG4gICAgICAgICAgZmV0Y2hUeXBlU3RyID0gJ2ZldGNoTWF0NCc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDM6XG4gICAgICAgICAgdHlwZVN0ciA9ICdtYXQzJztcbiAgICAgICAgICBmZXRjaFR5cGVTdHIgPSAnZmV0Y2hNYXQzTm8xNkJ5dGVzQWxpZ25lZCc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzQ6XG4gICAgICAgICAgdHlwZVN0ciA9ICd2ZWM0JztcbiAgICAgICAgICBmZXRjaFR5cGVTdHIgPSAnZmV0Y2hWZWM0JztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjMzpcbiAgICAgICAgICB0eXBlU3RyID0gJ3ZlYzMnO1xuICAgICAgICAgIGZldGNoVHlwZVN0ciA9ICdmZXRjaFZlYzNObzE2Qnl0ZXNBbGlnbmVkJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuU2NhbGFyOlxuICAgICAgICAgIHR5cGVTdHIgPSAnZmxvYXQnO1xuICAgICAgICAgIGZldGNoVHlwZVN0ciA9ICdmZXRjaFNjYWxhck5vMTZCeXRlc0FsaWduZWQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgY29tcG9zaXRpb24gdHlwZTogJHttZW1iZXJJbmZvLmNvbXBvc2l0aW9uVHlwZS5zdHJ9YCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGxvY2F0aW9uT2Zmc2V0c192ZWM0X2lkeCA9IENvbXBvbmVudC5nZXRMb2NhdGlvbk9mZnNldE9mTWVtYmVyT2ZDb21wb25lbnQoXG4gICAgICAgIGVuZ2luZSxcbiAgICAgICAgY29tcG9uZW50Q2xhc3MsXG4gICAgICAgIG1lbWJlck5hbWVcbiAgICAgICk7XG4gICAgICBjb25zdCBpbmRpY2VzTmFtZSA9IGBybkluZGljZXNfJHttZW1iZXJOYW1lfWA7XG4gICAgICBsZXQgaW5kZXhTdHIgPSAnJztcbiAgICAgIHN3aXRjaCAobWVtYmVySW5mby5jb21wb3NpdGlvblR5cGUpIHtcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0NDpcbiAgICAgICAgICBpbmRleFN0ciA9IGBpbnQgaW5kZXggPSAke2luZGljZXNOYW1lfVtpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3c10gKyA0ICogaW50KGluc3RhbmNlSWRJbkJ1ZmZlclZpZXcpO2A7IC8vIHZlYzRfaWR4XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDM6XG4gICAgICAgICAgaW5kZXhTdHIgPSBgaW50IGluZGV4ID0gJHtpbmRpY2VzTmFtZX1baW5zdGFuY2VJZE9mQnVmZmVyVmlld3NdICogNCArIDkgKiBpbnQoaW5zdGFuY2VJZEluQnVmZmVyVmlldyk7YDsgLy8gc2NhbGFyX2lkeFxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWM0OlxuICAgICAgICAgIGluZGV4U3RyID0gYGludCBpbmRleCA9ICR7aW5kaWNlc05hbWV9W2luc3RhbmNlSWRPZkJ1ZmZlclZpZXdzXSArIDEgKiBpbnQoaW5zdGFuY2VJZEluQnVmZmVyVmlldyk7YDsgLy8gdmVjNF9pZHhcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjMzpcbiAgICAgICAgICBpbmRleFN0ciA9IGBpbnQgaW5kZXggPSAke2luZGljZXNOYW1lfVtpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3c10gKiA0ICsgMyAqIGludChpbnN0YW5jZUlkSW5CdWZmZXJWaWV3KTtgOyAvLyBzY2FsYXJfaWR4XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlNjYWxhcjpcbiAgICAgICAgICBpbmRleFN0ciA9IGBpbnQgaW5kZXggPSAke2luZGljZXNOYW1lfVtpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3c10gKiA0ICsgMSAqIGludChpbnN0YW5jZUlkSW5CdWZmZXJWaWV3KTtgOyAvLyBzY2FsYXJfaWR4XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBjb21wb3NpdGlvbiB0eXBlOiAke21lbWJlckluZm8uY29tcG9zaXRpb25UeXBlLnN0cn1gKTtcbiAgICAgIH1cbiAgICAgIGxldCBjb252ZXJzaW9uU3RyID0gJyc7XG4gICAgICBpZiAobWVtYmVySW5mby5jb252ZXJ0VG9Cb29sKSB7XG4gICAgICAgIGNvbnZlcnNpb25TdHIgPSAncmV0dXJuICh2YWx1ZSA+IDAuNSkgPyB0cnVlIDogZmFsc2U7JztcbiAgICAgIH1cbiAgICAgIC8vIEdsb2JhbCBjb25zdCwgZm9yIHRoZSBzYW1lIHJlYXNvbiBhcyBpbiBwcm9jZXNzRm9yQXJyYXlUeXBlLlxuICAgICAgc3RyICs9IGBcbiAgY29uc3QgaW50ICR7aW5kaWNlc05hbWV9WyR7bG9jYXRpb25PZmZzZXRzX3ZlYzRfaWR4Lmxlbmd0aH1dID0gaW50WyR7bG9jYXRpb25PZmZzZXRzX3ZlYzRfaWR4Lmxlbmd0aH1dKCR7bG9jYXRpb25PZmZzZXRzX3ZlYzRfaWR4LmpvaW4oJywgJyl9KTtcbiAgJHttZW1iZXJJbmZvLmNvbnZlcnRUb0Jvb2wgPyAnYm9vbCcgOiB0eXBlU3RyfSBnZXRfJHttZW1iZXJOYW1lfSh1aW50IGluc3RhbmNlSWQpIHtcbiAgICB1aW50IGluc3RhbmNlSWRPZkJ1ZmZlclZpZXdzID0gaW5zdGFuY2VJZCAvICR7Y29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3fXU7XG4gICAgdWludCBpbnN0YW5jZUlkSW5CdWZmZXJWaWV3ID0gaW5zdGFuY2VJZCAlICR7Y29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3fXU7XG4gICAgJHtpbmRleFN0cn1cbiAgICAke3R5cGVTdHJ9IHZhbHVlID0gJHtmZXRjaFR5cGVTdHJ9KGluZGV4KTtcbiAgICAke21lbWJlckluZm8uY29udmVydFRvQm9vbCA/IGNvbnZlcnNpb25TdHIgOiAncmV0dXJuIHZhbHVlOyd9XG4gIH1cbmA7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRNb3JwaGVkUG9zaXRpb25HZXR0ZXIoZW5naW5lOiBFbmdpbmUpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1vcnBoVW5pZm9ybURhdGFUYXJnZXROdW1iZXJzID0gUHJpbWl0aXZlLmdldE1vcnBoVW5pZm9ybURhdGFUYXJnZXROdW1iZXJzKCk7XG4gICAgY29uc3QgbW9ycGhVbmlmb3JtRGF0YVRhcmdldE51bWJlcnNTdHIgPSBgXG4gICAgY29uc3QgaW50IHJuTW9ycGhVbmlmb3JtRGF0YVRhcmdldE51bWJlcnNbJHttb3JwaFVuaWZvcm1EYXRhVGFyZ2V0TnVtYmVycy5sZW5ndGh9XSA9IGludFske21vcnBoVW5pZm9ybURhdGFUYXJnZXROdW1iZXJzLmxlbmd0aH1dKCR7bW9ycGhVbmlmb3JtRGF0YVRhcmdldE51bWJlcnMuam9pbignLCAnKX0pO1xuICAgIGA7XG4gICAgY29uc3QgbW9ycGhVbmlmb3JtRGF0YU9mZnNldHMgPSBQcmltaXRpdmUuZ2V0TW9ycGhVbmlmb3JtRGF0YU9mZnNldHMoKTtcbiAgICBjb25zdCBtb3JwaFVuaWZvcm1EYXRhT2Zmc2V0c1N0ciA9IGBcbiAgICBjb25zdCBpbnQgcm5Nb3JwaFVuaWZvcm1EYXRhT2Zmc2V0c1ske21vcnBoVW5pZm9ybURhdGFPZmZzZXRzLmxlbmd0aH1dID0gaW50WyR7bW9ycGhVbmlmb3JtRGF0YU9mZnNldHMubGVuZ3RofV0oJHttb3JwaFVuaWZvcm1EYXRhT2Zmc2V0cy5qb2luKCcsICcpfSk7XG4gICAgYDtcbiAgICBjb25zdCBibGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzID0gQmxlbmRTaGFwZUNvbXBvbmVudC5nZXRPZmZzZXRzSW5Vbmlmb3JtKGVuZ2luZSk7XG4gICAgY29uc3QgYmxlbmRTaGFwZVVuaWZvcm1EYXRhT2Zmc2V0c1N0ciA9IGBcbiAgICBjb25zdCBpbnQgcm5CbGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzWyR7YmxlbmRTaGFwZVVuaWZvcm1EYXRhT2Zmc2V0cy5sZW5ndGh9XSA9IGludFske2JsZW5kU2hhcGVVbmlmb3JtRGF0YU9mZnNldHMubGVuZ3RofV0oJHtibGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzLmpvaW4oJywgJyl9KTtcbiAgICBgO1xuXG4gICAgY29uc3QgbW9ycGhpbmdTdHIgPSBgXG4gICAgI2lmZGVmIFJOX0lTX1ZFUlRFWF9TSEFERVJcbiAgICAgICNpZmRlZiBSTl9JU19NT1JQSElOR1xuICAgICAgJHttb3JwaFVuaWZvcm1EYXRhVGFyZ2V0TnVtYmVyc1N0cn1cbiAgICAgICR7bW9ycGhVbmlmb3JtRGF0YU9mZnNldHNTdHJ9XG4gICAgICAke2JsZW5kU2hhcGVVbmlmb3JtRGF0YU9mZnNldHNTdHJ9XG4gICAgICB2ZWMzIGdldF9wb3NpdGlvbih1aW50IHZlcnRleElkLCB2ZWMzIGJhc2VQb3NpdGlvbiwgdWludCBibGVuZFNoYXBlQ29tcG9uZW50U0lEKSB7XG4gICAgICAgIGludCBjdXJyZW50UHJpbWl0aXZlSWR4ID0gdV9jdXJyZW50UHJpbWl0aXZlSWR4O1xuICAgICAgICBpbnQgb2Zmc2V0SW5Vbmlmb3JtID0gcm5Nb3JwaFVuaWZvcm1EYXRhT2Zmc2V0c1tjdXJyZW50UHJpbWl0aXZlSWR4XTtcbiAgICAgICAgaW50IG9mZnNldEluVW5pZm9ybTIgPSBybkJsZW5kU2hhcGVVbmlmb3JtRGF0YU9mZnNldHNbYmxlbmRTaGFwZUNvbXBvbmVudFNJRF07XG4gICAgICAgIHZlYzMgcG9zaXRpb24gPSBiYXNlUG9zaXRpb247XG4gICAgICAgIGludCBzY2FsYXJfaWR4ID0gMyAqIGludCh2ZXJ0ZXhJZCk7XG4gICAgICAgIGZvciAoaW50IGk9MDsgaTxybk1vcnBoVW5pZm9ybURhdGFUYXJnZXROdW1iZXJzW2N1cnJlbnRQcmltaXRpdmVJZHhdOyBpKyspIHtcbiAgICAgICAgICBpbnQgaWR4ID0gb2Zmc2V0SW5Vbmlmb3JtICsgaTtcbiAgICAgICAgICBpdmVjNCBvZmZzZXRzID0gdW5pZm9ybU1vcnBoT2Zmc2V0cy5kYXRhWyBpZHggLyA0XTtcbiAgICAgICAgICBpbnQgb2Zmc2V0UG9zaXRpb24gPSBvZmZzZXRzW2lkeCAlIDRdO1xuXG4gICAgICAgICAgaW50IGJhc2VQb3NJbjRieXRlcyA9IG9mZnNldFBvc2l0aW9uICogNCArIHNjYWxhcl9pZHg7XG4gICAgICAgICAgdmVjMyBhZGRQb3MgPSBmZXRjaFZlYzNObzE2Qnl0ZXNBbGlnbmVkKGJhc2VQb3NJbjRieXRlcyk7XG5cbiAgICAgICAgICBpbnQgaWR4MiA9IG9mZnNldEluVW5pZm9ybTIgKyBpO1xuICAgICAgICAgIHZlYzQgbW9ycGhXZWlnaHRzID0gdW5pZm9ybU1vcnBoV2VpZ2h0cy5kYXRhWyBpZHgyIC8gNF07XG4gICAgICAgICAgZmxvYXQgbW9ycGhXZWlnaHQgPSBtb3JwaFdlaWdodHNbaWR4MiAlIDRdO1xuXG4gICAgICAgICAgcG9zaXRpb24gKz0gYWRkUG9zICogbW9ycGhXZWlnaHQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcG9zaXRpb247XG4gICAgICB9XG4gICAgICAjZW5kaWZcbiAgICAjZW5kaWZcbiAgICBgO1xuXG4gICAgcmV0dXJuIG1vcnBoaW5nU3RyO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgYSBzaGFkZXIgcHJvZ3JhbSBmb3IgdGhlIHNwZWNpZmllZCBtYXRlcmlhbCBhbmQgcHJpbWl0aXZlLlxuICAgKiBUaGlzIG1ldGhvZCBjcmVhdGVzIGFuZCBjb25maWd1cmVzIHRoZSBjb21wbGV0ZSBzaGFkZXIgcHJvZ3JhbSBpbmNsdWRpbmdcbiAgICogdW5pZm9ybSBsb2NhdGlvbnMgYW5kIGRhdGEgdGV4dHVyZS1zcGVjaWZpYyBzaGFkZXIgZGVmaW5pdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCB0aGF0IHJlcXVpcmVzIHNoYWRlciBzZXR1cFxuICAgKiBAcGFyYW0gcHJpbWl0aXZlIC0gVGhlIHByaW1pdGl2ZSBnZW9tZXRyeSB0aGF0IHdpbGwgdXNlIHRoaXMgc2hhZGVyXG4gICAqIEByZXR1cm5zIFRoZSByZXNvdXJjZSBoYW5kbGUgb2YgdGhlIGNyZWF0ZWQgb3IgcmV0cmlldmVkIHNoYWRlciBwcm9ncmFtXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGhhbmRsZXM6XG4gICAqIC0gQ3JlYXRpbmcgdGhlIFdlYkdMIHNoYWRlciBwcm9ncmFtIHdpdGggZGF0YSB0ZXh0dXJlIG1ldGhvZCBkZWZpbml0aW9uc1xuICAgKiAtIFNldHRpbmcgdXAgYmFzaWMgdW5pZm9ybSBsb2NhdGlvbnMgZm9yIHRoZSBtYXRlcmlhbFxuICAgKiAtIENvbmZpZ3VyaW5nIG1hdGVyaWFsIG5vZGUgdW5pZm9ybSBsb2NhdGlvbnNcbiAgICogLSBTZXR0aW5nIHVwIGFkZGl0aW9uYWwgdW5pZm9ybSBsb2NhdGlvbnMgZm9yIHBvaW50IHNwcml0ZXNcbiAgICogLSBDb25maWd1cmluZyBkYXRhIHRleHR1cmUtc3BlY2lmaWMgdW5pZm9ybSBsb2NhdGlvbnNcbiAgICovXG4gIHB1YmxpYyBzZXR1cFNoYWRlckZvck1hdGVyaWFsKG1hdGVyaWFsOiBNYXRlcmlhbCwgcHJpbWl0aXZlOiBQcmltaXRpdmUpOiBDR0FQSVJlc291cmNlSGFuZGxlIHtcbiAgICBjb25zdCB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgY29uc3QgX2dsdyA9IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmN1cnJlbnRXZWJHTENvbnRleHRXcmFwcGVyITtcblxuICAgIGNvbnN0IFtwcm9ncmFtVWlkLCBuZXdPbmVdID0gbWF0ZXJpYWwuX2NyZWF0ZVByb2dyYW1XZWJHTChcbiAgICAgIHRoaXMuX19lbmdpbmUsXG4gICAgICBXZWJHTFN0cmF0ZWd5V2ViR0wyLl9fZ2V0Q29tcG9uZW50RGF0YUFjY2Vzc01ldGhvZERlZmluaXRpb25zX2RhdGFUZXh0dXJlKHRoaXMuX19lbmdpbmUsIFNoYWRlclR5cGUuVmVydGV4U2hhZGVyKSxcbiAgICAgIFdlYkdMU3RyYXRlZ3lXZWJHTDIuX19nZXRDb21wb25lbnREYXRhQWNjZXNzTWV0aG9kRGVmaW5pdGlvbnNfZGF0YVRleHR1cmUodGhpcy5fX2VuZ2luZSwgU2hhZGVyVHlwZS5QaXhlbFNoYWRlciksXG4gICAgICBXZWJHTFN0cmF0ZWd5V2ViR0wyLl9fZ2V0U2hhZGVyUHJvcGVydHlPZkdsb2JhbERhdGFSZXBvc2l0b3J5LFxuICAgICAgV2ViR0xTdHJhdGVneVdlYkdMMi5fX2dldFNoYWRlclByb3BlcnR5T2ZNYXRlcmlhbCxcbiAgICAgIFdlYkdMU3RyYXRlZ3lXZWJHTDIuX19nZXRNb3JwaGVkUG9zaXRpb25HZXR0ZXIodGhpcy5fX2VuZ2luZSksXG4gICAgICBwcmltaXRpdmVcbiAgICApO1xuXG4gICAgaWYgKG5ld09uZSkge1xuICAgICAgbWF0ZXJpYWwuX3NldHVwQmFzaWNVbmlmb3Jtc0xvY2F0aW9ucyhwcmltaXRpdmUpO1xuXG4gICAgICBtYXRlcmlhbC5fc2V0VW5pZm9ybUxvY2F0aW9uc09mTWF0ZXJpYWxOb2RlcyhwcmltaXRpdmUpO1xuXG4gICAgICBtYXRlcmlhbC5fc2V0dXBBZGRpdGlvbmFsVW5pZm9ybUxvY2F0aW9ucyhcbiAgICAgICAgV2ViR0xTdHJhdGVneUNvbW1vbk1ldGhvZC5nZXRQb2ludFNwcml0ZVNoYWRlclNlbWFudGljc0luZm9BcnJheSgpLFxuICAgICAgICBwcmltaXRpdmVcbiAgICAgICk7XG5cbiAgICAgIHRoaXMuX19lbmdpbmUuZ2xvYmFsRGF0YVJlcG9zaXRvcnkuX3NldFVuaWZvcm1Mb2NhdGlvbnNGb3JXZWJHTDJNb2RlT25seShtYXRlcmlhbC5nZXRTaGFkZXJQcm9ncmFtVWlkKHByaW1pdGl2ZSkpO1xuXG4gICAgICB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5zZXRVbmlmb3JtQmxvY2tCaW5kaW5nRm9yTW9ycGhPZmZzZXRzQW5kV2VpZ2h0cyhcbiAgICAgICAgcHJvZ3JhbVVpZCxcbiAgICAgICAgdGhpcy5fX21vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJVaWQsXG4gICAgICAgIHRoaXMuX19tb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyVWlkXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBwcm9ncmFtVWlkO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlLWVzdGFibGlzaGVzIGEgc2hhZGVyIHByb2dyYW0gZm9yIGEgbWF0ZXJpYWwgdXNpbmcgdXBkYXRlZCBzaGFkZXIgc291cmNlcy5cbiAgICogVGhpcyBtZXRob2QgaXMgdHlwaWNhbGx5IGNhbGxlZCBieSBkZWJ1Z2dpbmcgdG9vbHMgbGlrZSBTcGVjdG9yLmpzIHdoZW5cbiAgICogc2hhZGVyIHNvdXJjZXMgYXJlIG1vZGlmaWVkIGF0IHJ1bnRpbWUgZm9yIGluc3BlY3Rpb24gb3IgZGVidWdnaW5nLlxuICAgKlxuICAgKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgd2hvc2Ugc2hhZGVyIG5lZWRzIHRvIGJlIHJlLXNldHVwXG4gICAqIEBwYXJhbSBwcmltaXRpdmUgLSBUaGUgcHJpbWl0aXZlIGdlb21ldHJ5IGFzc29jaWF0ZWQgd2l0aCB0aGUgc2hhZGVyXG4gICAqIEBwYXJhbSB1cGRhdGVkU2hhZGVyU291cmNlcyAtIFRoZSBtb2RpZmllZCBzaGFkZXIgc291cmNlIGNvZGVcbiAgICogQHBhcmFtIG9uRXJyb3IgLSBDYWxsYmFjayBmdW5jdGlvbiB0byBoYW5kbGUgY29tcGlsYXRpb24gb3IgbGlua2luZyBlcnJvcnNcbiAgICogQHJldHVybnMgVGhlIHJlc291cmNlIGhhbmRsZSBvZiB0aGUgdXBkYXRlZCBzaGFkZXIgcHJvZ3JhbSwgb3IgSW52YWxpZENHQVBJUmVzb3VyY2VVaWQgb24gZmFpbHVyZVxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCBwZXJmb3JtcyB0aGUgc2FtZSBzZXR1cCBhcyBzZXR1cFNoYWRlckZvck1hdGVyaWFsIGJ1dCB1c2VzXG4gICAqIGV4dGVybmFsbHkgcHJvdmlkZWQgc2hhZGVyIHNvdXJjZXMgaW5zdGVhZCBvZiBnZW5lcmF0aW5nIHRoZW0uIEl0J3MgcHJpbWFyaWx5XG4gICAqIHVzZWQgZm9yIGRlYnVnZ2luZyB3b3JrZmxvd3Mgd2hlcmUgc2hhZGVycyBhcmUgbW9kaWZpZWQgYXQgcnVudGltZS5cbiAgICovXG4gIHB1YmxpYyBfcmVTZXR1cFNoYWRlckZvck1hdGVyaWFsQnlTcGVjdG9yKFxuICAgIG1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgICBwcmltaXRpdmU6IFByaW1pdGl2ZSxcbiAgICB1cGRhdGVkU2hhZGVyU291cmNlczogU2hhZGVyU291cmNlcyxcbiAgICBvbkVycm9yOiAobWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkXG4gICk6IENHQVBJUmVzb3VyY2VIYW5kbGUge1xuICAgIGNvbnN0IFtwcm9ncmFtVWlkLCBuZXdPbmVdID0gbWF0ZXJpYWwuX2NyZWF0ZVByb2dyYW1CeVVwZGF0ZWRTb3VyY2VzKHVwZGF0ZWRTaGFkZXJTb3VyY2VzLCBwcmltaXRpdmUsIG9uRXJyb3IpO1xuICAgIGlmIChwcm9ncmFtVWlkID09PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgcmV0dXJuIHByb2dyYW1VaWQ7XG4gICAgfVxuXG4gICAgaWYgKG5ld09uZSkge1xuICAgICAgbWF0ZXJpYWwuX3NldHVwQmFzaWNVbmlmb3Jtc0xvY2F0aW9ucyhwcmltaXRpdmUpO1xuXG4gICAgICBtYXRlcmlhbC5fc2V0VW5pZm9ybUxvY2F0aW9uc09mTWF0ZXJpYWxOb2RlcyhwcmltaXRpdmUpO1xuXG4gICAgICBtYXRlcmlhbC5fc2V0dXBBZGRpdGlvbmFsVW5pZm9ybUxvY2F0aW9ucyhcbiAgICAgICAgV2ViR0xTdHJhdGVneUNvbW1vbk1ldGhvZC5nZXRQb2ludFNwcml0ZVNoYWRlclNlbWFudGljc0luZm9BcnJheSgpLFxuICAgICAgICBwcmltaXRpdmVcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdGhpcy5fX2VuZ2luZS5nbG9iYWxEYXRhUmVwb3NpdG9yeS5fc2V0VW5pZm9ybUxvY2F0aW9uc0ZvcldlYkdMMk1vZGVPbmx5KG1hdGVyaWFsLmdldFNoYWRlclByb2dyYW1VaWQocHJpbWl0aXZlKSk7XG5cbiAgICByZXR1cm4gcHJvZ3JhbVVpZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgR0xTTCBzaGFkZXIgY29kZSBmb3IgYWNjZXNzaW5nIGdsb2JhbCBwcm9wZXJ0aWVzLlxuICAgKiBUaGlzIG1ldGhvZCBjcmVhdGVzIHNoYWRlciBmdW5jdGlvbnMgdGhhdCBjYW4gZmV0Y2ggZGF0YSBmcm9tIGVpdGhlciBkYXRhIHRleHR1cmVzXG4gICAqIG9yIHVuaWZvcm0gdmFyaWFibGVzLCBkZXBlbmRpbmcgb24gdGhlIHByb3BlcnR5IHR5cGUgYW5kIHJlbmRlcmluZyBjb25maWd1cmF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gaW5mbyAtIERldGFpbGVkIGluZm9ybWF0aW9uIGFib3V0IHRoZSBzaGFkZXIgc2VtYW50aWMgcHJvcGVydHlcbiAgICogQHJldHVybnMgR0xTTCBzaGFkZXIgY29kZSBzdHJpbmcgZm9yIHRoZSBwcm9wZXJ0eSBhY2Nlc3NvciBmdW5jdGlvblxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCBoYW5kbGVzIGRpZmZlcmVudCBkYXRhIHR5cGVzIGluY2x1ZGluZzpcbiAgICogLSBTY2FsYXJzLCB2ZWN0b3JzLCBhbmQgbWF0cmljZXMgb2YgdmFyaW91cyBzaXplc1xuICAgKiAtIEFycmF5IHR5cGVzIHdpdGggcHJvcGVyIGluZGV4aW5nXG4gICAqIC0gVGV4dHVyZSBzYW1wbGVyc1xuICAgKiAtIFByb3BlcnRpZXMgdGhhdCByZXF1aXJlIGV4cGxpY2l0IHVuaWZvcm0gdmFyaWFibGVzXG4gICAqIFRoZSBnZW5lcmF0ZWQgY29kZSBvcHRpbWl6ZXMgZGF0YSBhY2Nlc3MgYmFzZWQgb24gdGhlIHByb3BlcnR5IGxheW91dCBpbiBkYXRhIHRleHR1cmVzLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRTaGFkZXJQcm9wZXJ0eU9mR2xvYmFsRGF0YVJlcG9zaXRvcnkoZW5naW5lOiBFbmdpbmUsIGluZm86IFNoYWRlclNlbWFudGljc0luZm8pIHtcbiAgICBjb25zdCByZXR1cm5UeXBlID0gaW5mby5jb21wb3NpdGlvblR5cGUuZ2V0R2xzbFN0cihpbmZvLmNvbXBvbmVudFR5cGUpO1xuXG4gICAgbGV0IGluZGV4U3RyOiBzdHJpbmc7XG5cbiAgICBjb25zdCBpc1RleHR1cmUgPSBDb21wb3NpdGlvblR5cGUuaXNUZXh0dXJlKGluZm8uY29tcG9zaXRpb25UeXBlKTtcblxuICAgIGNvbnN0IG1ldGhvZE5hbWUgPSBpbmZvLnNlbWFudGljLnJlcGxhY2UoJy4nLCAnXycpO1xuXG4gICAgLy8gZGVmaW5pdGlvbiBvZiB1bmlmb3JtIHZhcmlhYmxlIGZvciB0ZXh0dXJlIHNhbXBsZXIgb3Igd2hhdCBtdXN0IGJlIGV4cGxpY2l0bHkgdW5pZm9ybSB2YXJpYWJsKVxuICAgIGxldCB2YXJEZWYgPSAnJztcbiAgICBjb25zdCB2YXJUeXBlID0gaW5mby5jb21wb3NpdGlvblR5cGUuZ2V0R2xzbFN0cihpbmZvLmNvbXBvbmVudFR5cGUpO1xuICAgIGxldCB2YXJJbmRleFN0ciA9ICcnO1xuICAgIGlmIChpbmZvLmFycmF5TGVuZ3RoKSB7XG4gICAgICB2YXJJbmRleFN0ciA9IGBbJHtpbmZvLmFycmF5TGVuZ3RofV1gO1xuICAgIH1cbiAgICBpZiAoaW5mby5uZWVkVW5pZm9ybUluRGF0YVRleHR1cmVNb2RlIHx8IGlzVGV4dHVyZSkge1xuICAgICAgdmFyRGVmID0gYCAgdW5pZm9ybSAke3ZhclR5cGV9IHVfJHttZXRob2ROYW1lfSR7dmFySW5kZXhTdHJ9O1xcbmA7XG4gICAgfVxuXG4gICAgLy8gaW5uZXIgY29udGVudHMgb2YgJ2dldF8nIHNoYWRlciBmdW5jdGlvblxuICAgIGNvbnN0IHZlYzRTaXplT2ZQcm9wZXJ0eTogSW5kZXhPZjE2Qnl0ZXMgPSBpbmZvLmNvbXBvc2l0aW9uVHlwZS5nZXRWZWM0U2l6ZU9mUHJvcGVydHkoKTtcbiAgICAvLyBmb3Igbm9uLWBpbmRleGAgcHJvcGVydHkgKHRoaXMgaXMgZ2VuZXJhbCBjYXNlKVxuICAgIGNvbnN0IHNjYWxhclNpemVPZlByb3BlcnR5OiBJbmRleE9mNEJ5dGVzID0gaW5mby5jb21wb3NpdGlvblR5cGUuZ2V0TnVtYmVyT2ZDb21wb25lbnRzKCk7XG4gICAgY29uc3Qgb2Zmc2V0T2ZQcm9wZXJ0eTogSW5kZXhPZjE2Qnl0ZXMgPSBXZWJHTFN0cmF0ZWd5V2ViR0wyLmdldE9mZnNldE9mUHJvcGVydHlPZkdsb2JhbERhdGFSZXBvc2l0b3J5KFxuICAgICAgZW5naW5lLFxuICAgICAgaW5mby5zZW1hbnRpY1xuICAgICk7XG5cbiAgICBpZiAob2Zmc2V0T2ZQcm9wZXJ0eSA9PT0gLTEpIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdDb3VsZCBub3QgZ2V0IHRoZSBsb2NhdGlvbiBvZmZzZXQgb2YgdGhlIHByb3BlcnR5LicpO1xuICAgIH1cblxuICAgIGxldCBpbnN0YW5jZVNpemUgPSB2ZWM0U2l6ZU9mUHJvcGVydHk7XG4gICAgaW5kZXhTdHIgPSBgaW50IHZlYzRfaWR4ID0gJHtvZmZzZXRPZlByb3BlcnR5fSArICR7aW5zdGFuY2VTaXplfSAqIGluc3RhbmNlSWQ7XFxuYDtcbiAgICBpZiAoQ29tcG9zaXRpb25UeXBlLmlzQXJyYXkoaW5mby5jb21wb3NpdGlvblR5cGUpKSB7XG4gICAgICBpbnN0YW5jZVNpemUgPSB2ZWM0U2l6ZU9mUHJvcGVydHkgKiAoaW5mby5hcnJheUxlbmd0aCA/PyAxKTtcbiAgICAgIGNvbnN0IHBhZGRlZEFzVmVjNCA9IE1hdGguY2VpbChzY2FsYXJTaXplT2ZQcm9wZXJ0eSAvIDQpICogNDtcbiAgICAgIGNvbnN0IGluc3RhbmNlU2l6ZUluU2NhbGFyID0gcGFkZGVkQXNWZWM0ICogKGluZm8uYXJyYXlMZW5ndGggPz8gMSk7XG4gICAgICBpbmRleFN0ciA9IGBpbnQgdmVjNF9pZHggPSAke29mZnNldE9mUHJvcGVydHl9ICsgJHtpbnN0YW5jZVNpemV9ICogaW5zdGFuY2VJZCArICR7dmVjNFNpemVPZlByb3BlcnR5fSAqIGludChpZHhPZkFycmF5KTtcXG5gO1xuICAgICAgaW5kZXhTdHIgKz0gYGludCBzY2FsYXJfaWR4ID0gJHtcbiAgICAgICAgLy8gSW5kZXhPZjRCeXRlc1xuICAgICAgICBvZmZzZXRPZlByb3BlcnR5ICogNCAvLyBJbmRleE9mMTZieXRlcyB0byBJbmRleE9mNEJ5dGVzXG4gICAgICB9ICsgJHtpbnN0YW5jZVNpemVJblNjYWxhcn0gKiBpbnN0YW5jZUlkICsgJHtzY2FsYXJTaXplT2ZQcm9wZXJ0eX0gKiBpbnQoaWR4T2ZBcnJheSk7XFxuYDtcbiAgICB9XG5cbiAgICBsZXQgaW50U3RyID0gJyc7XG4gICAgaWYgKGluZm8uY29tcG9uZW50VHlwZSA9PT0gQ29tcG9uZW50VHlwZS5JbnQgJiYgaW5mby5jb21wb3NpdGlvblR5cGUgIT09IENvbXBvc2l0aW9uVHlwZS5TY2FsYXIpIHtcbiAgICAgIGludFN0ciA9ICdpJztcbiAgICB9XG5cbiAgICBsZXQgZmlyc3RQYXJ0T2ZJbm5lckZ1bmMgPSAnJztcbiAgICBpZiAoIWlzVGV4dHVyZSAmJiAhaW5mby5uZWVkVW5pZm9ybUluRGF0YVRleHR1cmVNb2RlKSB7XG4gICAgICBmaXJzdFBhcnRPZklubmVyRnVuYyArPSBgXG4ke3JldHVyblR5cGV9IGdldF8ke21ldGhvZE5hbWV9KGhpZ2hwIHVpbnQgX2luc3RhbmNlSWQsIGNvbnN0IHVpbnQgaWR4T2ZBcnJheSkge1xuICBpbnQgaW5zdGFuY2VJZCA9IGludChfaW5zdGFuY2VJZCk7XG4gICR7aW5kZXhTdHJ9XG4gIGA7XG5cbiAgICAgIGxldCBzdHIgPSBgJHt2YXJEZWZ9XFxuJHtmaXJzdFBhcnRPZklubmVyRnVuY31gO1xuXG4gICAgICBzd2l0Y2ggKGluZm8uY29tcG9zaXRpb25UeXBlKSB7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzQ6XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzRBcnJheTpcbiAgICAgICAgICBzdHIgKz0gJyAgICAgICAgaGlnaHAgdmVjNCB2YWwgPSBmZXRjaEVsZW1lbnQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzM6XG4gICAgICAgICAgc3RyICs9ICcgICAgICAgIHZlYzQgY29sMCA9IGZldGNoRWxlbWVudCh2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgICBzdHIgKz0gYCAgICAgICAgaGlnaHAgJHtpbnRTdHJ9dmVjMyB2YWwgPSAke2ludFN0cn12ZWMzKGNvbDAueHl6KTtgO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWMzQXJyYXk6XG4gICAgICAgICAgc3RyICs9ICcgICAgICAgIHZlYzMgdmFsID0gZmV0Y2hWZWMzTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWMyOlxuICAgICAgICAgIHN0ciArPSAnICAgICAgICBoaWdocCB2ZWM0IGNvbDAgPSBmZXRjaEVsZW1lbnQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgICAgc3RyICs9IGAgICAgICAgIGhpZ2hwICR7aW50U3RyfXZlYzIgdmFsID0gJHtpbnRTdHJ9dmVjMihjb2wwLnh5KTtgO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWMyQXJyYXk6XG4gICAgICAgICAgc3RyICs9ICcgICAgICAgIGhpZ2hwIHZlYzIgdmFsID0gZmV0Y2hWZWMyTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5TY2FsYXI6XG4gICAgICAgICAgc3RyICs9ICcgICAgICAgIHZlYzQgY29sMCA9IGZldGNoRWxlbWVudCh2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgICBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkludCkge1xuICAgICAgICAgICAgc3RyICs9ICcgICAgICAgIGludCB2YWwgPSBpbnQoY29sMC54KTsnO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkJvb2wpIHtcbiAgICAgICAgICAgIHN0ciArPSAnICAgICAgICBib29sIHZhbCA9IGJvb2woY29sMC54KTsnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHIgKz0gJyAgICAgICBmbG9hdCB2YWwgPSBjb2wwLng7JztcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlNjYWxhckFycmF5OlxuICAgICAgICAgIHN0ciArPSAnICAgICAgICBmbG9hdCBjb2wwID0gZmV0Y2hTY2FsYXJObzE2Qnl0ZXNBbGlnbmVkKHNjYWxhcl9pZHgpO1xcbic7XG4gICAgICAgICAgaWYgKGluZm8uY29tcG9uZW50VHlwZSA9PT0gQ29tcG9uZW50VHlwZS5JbnQpIHtcbiAgICAgICAgICAgIHN0ciArPSAnICAgICAgICBpbnQgdmFsID0gaW50KGNvbDApOyc7XG4gICAgICAgICAgfSBlbHNlIGlmIChpbmZvLmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuQm9vbCkge1xuICAgICAgICAgICAgc3RyICs9ICcgICAgICAgIGJvb2wgdmFsID0gYm9vbChjb2wwKTsnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHIgKz0gJyAgICAgICBmbG9hdCB2YWwgPSBjb2wwOyc7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQ0OlxuICAgICAgICAgIHN0ciArPSAnICAgICAgICBtYXQ0IHZhbCA9IGZldGNoTWF0NCh2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0NEFycmF5OlxuICAgICAgICAgIHN0ciArPSAnICAgICAgICBtYXQ0IHZhbCA9IGZldGNoTWF0NCh2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0MzpcbiAgICAgICAgICBzdHIgKz0gJyAgICAgICAgbWF0MyB2YWwgPSBmZXRjaE1hdDModmVjNF9pZHgpO1xcbic7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDNBcnJheTpcbiAgICAgICAgICBzdHIgKz0gJyAgICAgICAgbWF0MyB2YWwgPSBmZXRjaE1hdDNObzE2Qnl0ZXNBbGlnbmVkKHNjYWxhcl9pZHgpO1xcbic7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDI6XG4gICAgICAgICAgc3RyICs9ICcgICAgICAgIG1hdDIgdmFsID0gZmV0Y2hNYXQyKHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQyQXJyYXk6XG4gICAgICAgICAgc3RyICs9ICcgICAgICAgIG1hdDIgdmFsID0gZmV0Y2hNYXQyTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQ0eDNBcnJheTpcbiAgICAgICAgICBzdHIgKz0gJyAgICAgICAgbWF0NHgzIHZhbCA9IGZldGNoTWF0NHgzKHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIC8vIExvZ2dlci5kZWZhdWx0LmVycm9yKCd1bmtub3duIGNvbXBvc2l0aW9uIHR5cGUnLCBpbmZvLmNvbXBvc2l0aW9uVHlwZS5zdHIsIG1lbWJlck5hbWUpO1xuICAgICAgICAgIHN0ciArPSAnJztcbiAgICAgIH1cbiAgICAgIHN0ciArPSBgXG4gIHJldHVybiB2YWw7XG59XG5gO1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgaWYgKCFpc1RleHR1cmUgJiYgaW5mby5uZWVkVW5pZm9ybUluRGF0YVRleHR1cmVNb2RlKSB7XG4gICAgICBsZXQgdmFySW5kZXhTdHIgPSAnJztcbiAgICAgIGlmIChpbmZvLmFycmF5TGVuZ3RoKSB7XG4gICAgICAgIHZhckluZGV4U3RyID0gJ1tpZHhPZkFycmF5XSc7XG4gICAgICB9XG4gICAgICBjb25zdCBzdHIgPSBgJHt2YXJEZWZ9XG4ke3JldHVyblR5cGV9IGdldF8ke21ldGhvZE5hbWV9KGhpZ2hwIHVpbnQgX2luc3RhbmNlSWQsIGNvbnN0IHVpbnQgaWR4T2ZBcnJheSkge1xuICByZXR1cm4gdV8ke21ldGhvZE5hbWV9JHt2YXJJbmRleFN0cn07XG59XG5gO1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgcmV0dXJuIHZhckRlZjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgR0xTTCBzaGFkZXIgY29kZSBmb3IgYWNjZXNzaW5nIG1hdGVyaWFsIHByb3BlcnRpZXMuXG4gICAqIFRoaXMgbWV0aG9kIGNyZWF0ZXMgc2hhZGVyIGZ1bmN0aW9ucyB0aGF0IGNhbiBmZXRjaCBkYXRhIGZyb20gZWl0aGVyIGRhdGEgdGV4dHVyZXNcbiAgICogb3IgdW5pZm9ybSB2YXJpYWJsZXMsIGRlcGVuZGluZyBvbiB0aGUgcHJvcGVydHkgdHlwZSBhbmQgcmVuZGVyaW5nIGNvbmZpZ3VyYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBpbmZvIC0gRGV0YWlsZWQgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHNoYWRlciBzZW1hbnRpYyBwcm9wZXJ0eVxuICAgKiBAcmV0dXJucyBHTFNMIHNoYWRlciBjb2RlIHN0cmluZyBmb3IgdGhlIHByb3BlcnR5IGFjY2Vzc29yIGZ1bmN0aW9uXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGhhbmRsZXMgZGlmZmVyZW50IGRhdGEgdHlwZXMgaW5jbHVkaW5nOlxuICAgKiAtIFNjYWxhcnMsIHZlY3RvcnMsIGFuZCBtYXRyaWNlcyBvZiB2YXJpb3VzIHNpemVzXG4gICAqIC0gQXJyYXkgdHlwZXMgd2l0aCBwcm9wZXIgaW5kZXhpbmdcbiAgICogLSBUZXh0dXJlIHNhbXBsZXJzXG4gICAqIC0gUHJvcGVydGllcyB0aGF0IHJlcXVpcmUgZXhwbGljaXQgdW5pZm9ybSB2YXJpYWJsZXNcbiAgICogVGhlIGdlbmVyYXRlZCBjb2RlIG9wdGltaXplcyBkYXRhIGFjY2VzcyBiYXNlZCBvbiB0aGUgcHJvcGVydHkgbGF5b3V0IGluIGRhdGEgdGV4dHVyZXMuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldFNoYWRlclByb3BlcnR5T2ZNYXRlcmlhbChlbmdpbmU6IEVuZ2luZSwgbWF0ZXJpYWxUeXBlTmFtZTogc3RyaW5nLCBpbmZvOiBTaGFkZXJTZW1hbnRpY3NJbmZvKSB7XG4gICAgY29uc3QgcmV0dXJuVHlwZSA9IGluZm8uY29tcG9zaXRpb25UeXBlLmdldEdsc2xTdHIoaW5mby5jb21wb25lbnRUeXBlKTtcblxuICAgIGxldCBpbmRleFN0cjogc3RyaW5nO1xuXG4gICAgY29uc3QgaXNUZXh0dXJlID0gQ29tcG9zaXRpb25UeXBlLmlzVGV4dHVyZShpbmZvLmNvbXBvc2l0aW9uVHlwZSk7XG5cbiAgICBjb25zdCBtZXRob2ROYW1lID0gaW5mby5zZW1hbnRpYy5yZXBsYWNlKCcuJywgJ18nKTtcblxuICAgIC8vIGRlZmluaXRpb24gb2YgdW5pZm9ybSB2YXJpYWJsZSBmb3IgdGV4dHVyZSBzYW1wbGVyIG9yIHdoYXQgbXVzdCBiZSBleHBsaWNpdGx5IHVuaWZvcm0gdmFyaWFibClcbiAgICBsZXQgdmFyRGVmID0gJyc7XG4gICAgY29uc3QgdmFyVHlwZSA9IGluZm8uY29tcG9zaXRpb25UeXBlLmdldEdsc2xTdHIoaW5mby5jb21wb25lbnRUeXBlKTtcbiAgICBsZXQgdmFySW5kZXhTdHIgPSAnJztcbiAgICBpZiAoaW5mby5hcnJheUxlbmd0aCkge1xuICAgICAgdmFySW5kZXhTdHIgPSBgWyR7aW5mby5hcnJheUxlbmd0aH1dYDtcbiAgICB9XG4gICAgaWYgKGluZm8ubmVlZFVuaWZvcm1JbkRhdGFUZXh0dXJlTW9kZSB8fCBpc1RleHR1cmUpIHtcbiAgICAgIHZhckRlZiA9IGAgIHVuaWZvcm0gJHt2YXJUeXBlfSB1XyR7bWV0aG9kTmFtZX0ke3ZhckluZGV4U3RyfTtcXG5gO1xuICAgIH1cblxuICAgIC8vIGlubmVyIGNvbnRlbnRzIG9mICdnZXRfJyBzaGFkZXIgZnVuY3Rpb25cbiAgICBjb25zdCB2ZWM0U2l6ZU9mUHJvcGVydHk6IEluZGV4T2YxNkJ5dGVzID0gaW5mby5jb21wb3NpdGlvblR5cGUuZ2V0VmVjNFNpemVPZlByb3BlcnR5KCk7XG4gICAgLy8gZm9yIG5vbi1gaW5kZXhgIHByb3BlcnR5ICh0aGlzIGlzIGdlbmVyYWwgY2FzZSlcbiAgICBjb25zdCBzY2FsYXJTaXplT2ZQcm9wZXJ0eTogSW5kZXhPZjRCeXRlcyA9IGluZm8uY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpO1xuICAgIGNvbnN0IG9mZnNldE9mUHJvcGVydHk6IEluZGV4T2YxNkJ5dGVzW10gPSBXZWJHTFN0cmF0ZWd5V2ViR0wyLmdldE9mZnNldE9mUHJvcGVydHlPZk1hdGVyaWFsKFxuICAgICAgZW5naW5lLFxuICAgICAgaW5mby5zZW1hbnRpYyxcbiAgICAgIG1hdGVyaWFsVHlwZU5hbWVcbiAgICApO1xuICAgIGNvbnN0IG1hdGVyaWFsQ291bnRQZXJCdWZmZXJWaWV3ID0gZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5fZ2V0TWF0ZXJpYWxDb3VudFBlckJ1ZmZlclZpZXcobWF0ZXJpYWxUeXBlTmFtZSkhO1xuXG4gICAgLy8gR2xvYmFsIGNvbnN0OiBhIGxvY2FsIGFycmF5IGluaXRpYWxpemVyIHJ1bnMgb24gZXZlcnkgY2FsbCwgd2hpY2ggaXMgZXhwZW5zaXZlIHdoZW4gdGhlIG1hdGVyaWFsIHR5cGUgc3BhbnNcbiAgICAvLyBtYW55IGJ1ZmZlciB2aWV3cy5cbiAgICBjb25zdCBvZmZzZXRzTmFtZSA9IGBybk9mZnNldHNfJHttZXRob2ROYW1lfWA7XG4gICAgY29uc3Qgb2Zmc2V0U3RyID0gYGNvbnN0IGludCAke29mZnNldHNOYW1lfVske29mZnNldE9mUHJvcGVydHkubGVuZ3RofV0gPSBpbnRbJHtvZmZzZXRPZlByb3BlcnR5Lmxlbmd0aH1dKCR7b2Zmc2V0T2ZQcm9wZXJ0eS5qb2luKCcsICcpfSk7YDtcblxuICAgIGxldCBpbnN0YW5jZVNpemUgPSB2ZWM0U2l6ZU9mUHJvcGVydHk7XG4gICAgaW5kZXhTdHIgPSBgaW50IHZlYzRfaWR4ID0gJHtvZmZzZXRzTmFtZX1baW5zdGFuY2VJZE9mQnVmZmVyVmlld3NdICsgJHtpbnN0YW5jZVNpemV9ICogaW50KGluc3RhbmNlSWRJbkJ1ZmZlclZpZXcpO1xcbmA7XG4gICAgaWYgKENvbXBvc2l0aW9uVHlwZS5pc0FycmF5KGluZm8uY29tcG9zaXRpb25UeXBlKSkge1xuICAgICAgaW5zdGFuY2VTaXplID0gdmVjNFNpemVPZlByb3BlcnR5ICogKGluZm8uYXJyYXlMZW5ndGggPz8gMSk7XG4gICAgICBjb25zdCBwYWRkZWRBc1ZlYzQgPSBNYXRoLmNlaWwoc2NhbGFyU2l6ZU9mUHJvcGVydHkgLyA0KSAqIDQ7XG4gICAgICBjb25zdCBpbnN0YW5jZVNpemVJblNjYWxhciA9IHBhZGRlZEFzVmVjNCAqIChpbmZvLmFycmF5TGVuZ3RoID8/IDEpO1xuICAgICAgaW5kZXhTdHIgPSBgaW50IHZlYzRfaWR4ID0gJHtvZmZzZXRzTmFtZX1baW5zdGFuY2VJZE9mQnVmZmVyVmlld3NdICsgJHtpbnN0YW5jZVNpemV9ICogaW50KGluc3RhbmNlSWRJbkJ1ZmZlclZpZXcpICsgJHt2ZWM0U2l6ZU9mUHJvcGVydHl9ICogaW50KGlkeE9mQXJyYXkpO1xcbmA7XG4gICAgICBpbmRleFN0ciArPSBgaW50IHNjYWxhcl9pZHggPSAke29mZnNldHNOYW1lfVtpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3c10gKiA0ICsgJHtpbnN0YW5jZVNpemVJblNjYWxhcn0gKiBpbnQoaW5zdGFuY2VJZEluQnVmZmVyVmlldykgKyAke3NjYWxhclNpemVPZlByb3BlcnR5fSAqIGludChpZHhPZkFycmF5KTtcXG5gO1xuICAgIH1cblxuICAgIGxldCBpbnRTdHIgPSAnJztcbiAgICBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkludCAmJiBpbmZvLmNvbXBvc2l0aW9uVHlwZSAhPT0gQ29tcG9zaXRpb25UeXBlLlNjYWxhcikge1xuICAgICAgaW50U3RyID0gJ2knO1xuICAgIH1cblxuICAgIGxldCBmaXJzdFBhcnRPZklubmVyRnVuYyA9ICcnO1xuICAgIGlmICghaXNUZXh0dXJlICYmICFpbmZvLm5lZWRVbmlmb3JtSW5EYXRhVGV4dHVyZU1vZGUpIHtcbiAgICAgIGZpcnN0UGFydE9mSW5uZXJGdW5jICs9IGBcbiR7b2Zmc2V0U3RyfVxuJHtyZXR1cm5UeXBlfSBnZXRfJHttZXRob2ROYW1lfShoaWdocCB1aW50IF9pbnN0YW5jZUlkLCBjb25zdCB1aW50IGlkeE9mQXJyYXkpIHtcbiAgdWludCBpbnN0YW5jZUlkID0gX2luc3RhbmNlSWQ7XG4gIHVpbnQgaW5zdGFuY2VJZE9mQnVmZmVyVmlld3MgPSBpbnN0YW5jZUlkIC8gJHttYXRlcmlhbENvdW50UGVyQnVmZmVyVmlld311O1xuICB1aW50IGluc3RhbmNlSWRJbkJ1ZmZlclZpZXcgPSBpbnN0YW5jZUlkICUgJHttYXRlcmlhbENvdW50UGVyQnVmZmVyVmlld311O1xuICAke2luZGV4U3RyfVxuICBgO1xuXG4gICAgICBsZXQgc3RyID0gYCR7dmFyRGVmfVxcbiR7Zmlyc3RQYXJ0T2ZJbm5lckZ1bmN9YDtcblxuICAgICAgc3dpdGNoIChpbmZvLmNvbXBvc2l0aW9uVHlwZSkge1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWM0OlxuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWM0QXJyYXk6XG4gICAgICAgICAgc3RyICs9ICcgICAgICAgIGhpZ2hwIHZlYzQgdmFsID0gZmV0Y2hFbGVtZW50KHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWMzOlxuICAgICAgICAgIHN0ciArPSAnICAgICAgICB2ZWM0IGNvbDAgPSBmZXRjaEVsZW1lbnQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgICAgc3RyICs9IGAgICAgICAgIGhpZ2hwICR7aW50U3RyfXZlYzMgdmFsID0gJHtpbnRTdHJ9dmVjMyhjb2wwLnh5eik7YDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjM0FycmF5OlxuICAgICAgICAgIHN0ciArPSAnICAgICAgICB2ZWMzIHZhbCA9IGZldGNoVmVjM05vMTZCeXRlc0FsaWduZWQoc2NhbGFyX2lkeCk7XFxuJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjMjpcbiAgICAgICAgICBzdHIgKz0gJyAgICAgICAgaGlnaHAgdmVjNCBjb2wwID0gZmV0Y2hFbGVtZW50KHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICAgIHN0ciArPSBgICAgICAgICBoaWdocCAke2ludFN0cn12ZWMyIHZhbCA9ICR7aW50U3RyfXZlYzIoY29sMC54eSk7YDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjMkFycmF5OlxuICAgICAgICAgIHN0ciArPSAnICAgICAgICBoaWdocCB2ZWMyIHZhbCA9IGZldGNoVmVjMk5vMTZCeXRlc0FsaWduZWQoc2NhbGFyX2lkeCk7XFxuJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuU2NhbGFyOlxuICAgICAgICAgIHN0ciArPSAnICAgICAgICB2ZWM0IGNvbDAgPSBmZXRjaEVsZW1lbnQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgICAgaWYgKGluZm8uY29tcG9uZW50VHlwZSA9PT0gQ29tcG9uZW50VHlwZS5JbnQpIHtcbiAgICAgICAgICAgIHN0ciArPSAnICAgICAgICBpbnQgdmFsID0gaW50KGNvbDAueCk7JztcbiAgICAgICAgICB9IGVsc2UgaWYgKGluZm8uY29tcG9uZW50VHlwZSA9PT0gQ29tcG9uZW50VHlwZS5Cb29sKSB7XG4gICAgICAgICAgICBzdHIgKz0gJyAgICAgICAgYm9vbCB2YWwgPSBib29sKGNvbDAueCk7JztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RyICs9ICcgICAgICAgZmxvYXQgdmFsID0gY29sMC54Oyc7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5TY2FsYXJBcnJheTpcbiAgICAgICAgICBzdHIgKz0gJyAgICAgICAgZmxvYXQgY29sMCA9IGZldGNoU2NhbGFyTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICAgIGlmIChpbmZvLmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuSW50KSB7XG4gICAgICAgICAgICBzdHIgKz0gJyAgICAgICAgaW50IHZhbCA9IGludChjb2wwKTsnO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkJvb2wpIHtcbiAgICAgICAgICAgIHN0ciArPSAnICAgICAgICBib29sIHZhbCA9IGJvb2woY29sMCk7JztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RyICs9ICcgICAgICAgZmxvYXQgdmFsID0gY29sMDsnO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0NDpcbiAgICAgICAgICBzdHIgKz0gJyAgICAgICAgbWF0NCB2YWwgPSBmZXRjaE1hdDQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDRBcnJheTpcbiAgICAgICAgICBzdHIgKz0gJyAgICAgICAgbWF0NCB2YWwgPSBmZXRjaE1hdDQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDM6XG4gICAgICAgICAgc3RyICs9ICcgICAgICAgIG1hdDMgdmFsID0gZmV0Y2hNYXQzKHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQzQXJyYXk6XG4gICAgICAgICAgc3RyICs9ICcgICAgICAgIG1hdDMgdmFsID0gZmV0Y2hNYXQzTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQyOlxuICAgICAgICAgIHN0ciArPSAnICAgICAgICBtYXQyIHZhbCA9IGZldGNoTWF0Mih2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0MkFycmF5OlxuICAgICAgICAgIHN0ciArPSAnICAgICAgICBtYXQyIHZhbCA9IGZldGNoTWF0Mk5vMTZCeXRlc0FsaWduZWQoc2NhbGFyX2lkeCk7XFxuJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0NHgzQXJyYXk6XG4gICAgICAgICAgc3RyICs9ICcgICAgICAgIG1hdDR4MyB2YWwgPSBmZXRjaE1hdDR4Myh2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAvLyBMb2dnZXIuZGVmYXVsdC5lcnJvcigndW5rbm93biBjb21wb3NpdGlvbiB0eXBlJywgaW5mby5jb21wb3NpdGlvblR5cGUuc3RyLCBtZW1iZXJOYW1lKTtcbiAgICAgICAgICBzdHIgKz0gJyc7XG4gICAgICB9XG4gICAgICBzdHIgKz0gYFxuICByZXR1cm4gdmFsO1xufVxuYDtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIGlmICghaXNUZXh0dXJlICYmIGluZm8ubmVlZFVuaWZvcm1JbkRhdGFUZXh0dXJlTW9kZSkge1xuICAgICAgbGV0IHZhckluZGV4U3RyID0gJyc7XG4gICAgICBpZiAoaW5mby5hcnJheUxlbmd0aCkge1xuICAgICAgICB2YXJJbmRleFN0ciA9ICdbaWR4T2ZBcnJheV0nO1xuICAgICAgfVxuICAgICAgY29uc3Qgc3RyID0gYCR7dmFyRGVmfVxuJHtyZXR1cm5UeXBlfSBnZXRfJHttZXRob2ROYW1lfShoaWdocCB1aW50IF9pbnN0YW5jZUlkLCBjb25zdCB1aW50IGlkeE9mQXJyYXkpIHtcbiAgcmV0dXJuIHVfJHttZXRob2ROYW1lfSR7dmFySW5kZXhTdHJ9O1xufVxuYDtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIHJldHVybiB2YXJEZWY7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIHRoZSBvZmZzZXQgcG9zaXRpb24gb2YgYSBwcm9wZXJ0eSB3aXRoaW4gdGhlIHNoYWRlciBkYXRhIGxheW91dC5cbiAgICogVGhpcyBtZXRob2QgY2FsY3VsYXRlcyB3aGVyZSBhIHNwZWNpZmljIHByb3BlcnR5IGlzIGxvY2F0ZWQgaW4gZWl0aGVyIHRoZVxuICAgKiBnbG9iYWwgZGF0YSByZXBvc2l0b3J5IG9yIG1hdGVyaWFsLXNwZWNpZmljIGRhdGEgc3RvcmFnZS5cbiAgICpcbiAgICogQHBhcmFtIGlzR2xvYmFsRGF0YSAtIFdoZXRoZXIgdG8gbG9vayBpbiBnbG9iYWwgZGF0YSBvciBtYXRlcmlhbC1zcGVjaWZpYyBkYXRhXG4gICAqIEBwYXJhbSBwcm9wZXJ0eU5hbWUgLSBUaGUgc2VtYW50aWMgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gbG9jYXRlXG4gICAqIEBwYXJhbSBtYXRlcmlhbFR5cGVOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIG1hdGVyaWFsIHR5cGUgKHVzZWQgZm9yIG1hdGVyaWFsLXNwZWNpZmljIHByb3BlcnRpZXMpXG4gICAqIEByZXR1cm5zIFRoZSBvZmZzZXQgcG9zaXRpb24gb2YgdGhlIHByb3BlcnR5IGluIHRoZSBkYXRhIGxheW91dCwgb3IgLTEgaWYgbm90IGZvdW5kXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGlzIGVzc2VudGlhbCBmb3IgZ2VuZXJhdGluZyBjb3JyZWN0IHNoYWRlciBjb2RlIHRoYXQgY2FuIGFjY2Vzc1xuICAgKiBwcm9wZXJ0aWVzIGZyb20gdGhlIGRhdGEgdGV4dHVyZSBhdCB0aGUgcmlnaHQgbWVtb3J5IGxvY2F0aW9ucy5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIGdldE9mZnNldE9mUHJvcGVydHlPZk1hdGVyaWFsKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHByb3BlcnR5TmFtZTogU2hhZGVyU2VtYW50aWNzTmFtZSxcbiAgICBtYXRlcmlhbFR5cGVOYW1lOiBzdHJpbmdcbiAgKSB7XG4gICAgY29uc3QgZGF0YUJlZ2luUG9zID0gZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5nZXRMb2NhdGlvbk9mZnNldE9mTWVtYmVyT2ZNYXRlcmlhbChcbiAgICAgIGVuZ2luZSxcbiAgICAgIG1hdGVyaWFsVHlwZU5hbWUsXG4gICAgICBwcm9wZXJ0eU5hbWVcbiAgICApO1xuICAgIHJldHVybiBkYXRhQmVnaW5Qb3M7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIHRoZSBvZmZzZXQgcG9zaXRpb24gb2YgYSBwcm9wZXJ0eSB3aXRoaW4gdGhlIGdsb2JhbCBkYXRhIHJlcG9zaXRvcnkuXG4gICAqIFRoaXMgbWV0aG9kIGNhbGN1bGF0ZXMgd2hlcmUgYSBzcGVjaWZpYyBwcm9wZXJ0eSBpcyBsb2NhdGVkIGluIHRoZSBnbG9iYWwgZGF0YSByZXBvc2l0b3J5LlxuICAgKlxuICAgKiBAcGFyYW0gcHJvcGVydHlOYW1lIC0gVGhlIHNlbWFudGljIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIGxvY2F0ZVxuICAgKiBAcmV0dXJucyBUaGUgb2Zmc2V0IHBvc2l0aW9uIG9mIHRoZSBwcm9wZXJ0eSBpbiB0aGUgZ2xvYmFsIGRhdGEgcmVwb3NpdG9yeSwgb3IgLTEgaWYgbm90IGZvdW5kXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGlzIGVzc2VudGlhbCBmb3IgZ2VuZXJhdGluZyBjb3JyZWN0IHNoYWRlciBjb2RlIHRoYXQgY2FuIGFjY2Vzc1xuICAgKiBwcm9wZXJ0aWVzIGZyb20gdGhlIGRhdGEgdGV4dHVyZSBhdCB0aGUgcmlnaHQgbWVtb3J5IGxvY2F0aW9ucy5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIGdldE9mZnNldE9mUHJvcGVydHlPZkdsb2JhbERhdGFSZXBvc2l0b3J5KGVuZ2luZTogRW5naW5lLCBwcm9wZXJ0eU5hbWU6IFNoYWRlclNlbWFudGljc05hbWUpIHtcbiAgICBjb25zdCBnbG9iYWxEYXRhUmVwb3NpdG9yeSA9IGVuZ2luZS5nbG9iYWxEYXRhUmVwb3NpdG9yeTtcbiAgICBjb25zdCBkYXRhQmVnaW5Qb3MgPSBnbG9iYWxEYXRhUmVwb3NpdG9yeS5nZXRMb2NhdGlvbk9mZnNldE9mUHJvcGVydHkocHJvcGVydHlOYW1lKTtcbiAgICByZXR1cm4gZGF0YUJlZ2luUG9zO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIGFuZCBwcmVwYXJlcyBhIG1lc2ggY29tcG9uZW50IGZvciByZW5kZXJpbmcgd2l0aCB0aGUgZGF0YSB0ZXh0dXJlIHN0cmF0ZWd5LlxuICAgKiBUaGlzIG1ldGhvZCB2YWxpZGF0ZXMgdGhlIG1lc2gsIHVwZGF0ZXMgY3VycmVudCBjb21wb25lbnQgU0lEcywgYW5kIGVuc3VyZXNcbiAgICogdGhlIG1lc2gncyBWQk8gYW5kIFZBTyBhcmUgcHJvcGVybHkgc2V0IHVwLlxuICAgKlxuICAgKiBAcGFyYW0gbWVzaENvbXBvbmVudCAtIFRoZSBtZXNoIGNvbXBvbmVudCB0byBsb2FkIGFuZCBwcmVwYXJlIGZvciByZW5kZXJpbmdcbiAgICogQHJldHVybnMgdHJ1ZSBpZiB0aGUgbWVzaCB3YXMgc3VjY2Vzc2Z1bGx5IGxvYWRlZCwgZmFsc2UgaWYgdGhlcmUgd2FzIGFuIGVycm9yXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIHBlcmZvcm1zIHNldmVyYWwgaW1wb3J0YW50IHRhc2tzOlxuICAgKiAtIFZhbGlkYXRlcyB0aGF0IHRoZSBtZXNoIGNvbXBvbmVudCBoYXMgYSB2YWxpZCBtZXNoXG4gICAqIC0gVXBkYXRlcyB0aGUgY3VycmVudCBjb21wb25lbnQgU0lEcyBmb3IgZGF0YSB0ZXh0dXJlIGFjY2Vzc1xuICAgKiAtIFRyaWdnZXJzIFZCTy9WQU8gc2V0dXAgaWYgdGhlIG1lc2ggaGFzbid0IGJlZW4gc2V0IHVwIHlldFxuICAgKiAtIERlbGV0ZXMgYW5kIHJlY3JlYXRlcyB0aGUgZGF0YSB0ZXh0dXJlIGlmIG5lZWRlZCBmb3IgbWVzaCB1cGRhdGVzXG4gICAqL1xuICAkbG9hZChtZXNoQ29tcG9uZW50OiBNZXNoQ29tcG9uZW50KSB7XG4gICAgY29uc3QgbWVzaCA9IG1lc2hDb21wb25lbnQubWVzaCBhcyBNZXNoO1xuICAgIGlmIChtZXNoID09IG51bGwpIHtcbiAgICAgIE1lc2hDb21wb25lbnQuYWxlcnROb01lc2hTZXQobWVzaENvbXBvbmVudCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhpcy5fX2N1cnJlbnRDb21wb25lbnRTSURzID0gdGhpcy5fX2VuZ2luZS5nbG9iYWxEYXRhUmVwb3NpdG9yeS5nZXRWYWx1ZSgnY3VycmVudENvbXBvbmVudFNJRHMnLCAwKTtcblxuICAgIC8vIHVwZGF0ZSBWQk8gYW5kIFZBT1xuICAgIGlmICghbWVzaC5pc1NldFVwRG9uZSgpKSB7XG4gICAgICB0aGlzLmRlbGV0ZURhdGFUZXh0dXJlKCk7IC8vIGRlbGV0ZSBkYXRhIHRleHR1cmUgdG8gcmVjcmVhdGUgb25lIG9uIG5leHRcbiAgICAgIG1lc2guX3VwZGF0ZVZCT0FuZFZBTygpO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBfX3VwZGF0ZU1vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJzSW5uZXIoKSB7XG4gICAgY29uc3QgbW9ycGhVbmlmb3JtRGF0YU9mZnNldHMgPSBQcmltaXRpdmUuZ2V0TW9ycGhVbmlmb3JtRGF0YU9mZnNldHMoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IFByaW1pdGl2ZS5nZXRQcmltaXRpdmVDb3VudEhhc01vcnBoKCk7IGkrKykge1xuICAgICAgY29uc3QgcHJpbWl0aXZlID0gUHJpbWl0aXZlLmdldFByaW1pdGl2ZUhhc01vcnBoKGkpO1xuICAgICAgaWYgKHByaW1pdGl2ZSAhPSBudWxsKSB7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcHJpbWl0aXZlLnRhcmdldHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBjb25zdCB0YXJnZXQgPSBwcmltaXRpdmUudGFyZ2V0c1tqXTtcbiAgICAgICAgICBjb25zdCBhY2Nlc3NvciA9IHRhcmdldC5nZXQoVmVydGV4QXR0cmlidXRlLlBvc2l0aW9uLlhZWikgYXMgQWNjZXNzb3I7XG4gICAgICAgICAgY29uc3QgYnl0ZU9mZnNldE9mRXhpc3RpbmdCdWZmZXIgPSB0aGlzLl9fZW5naW5lLm1lbW9yeU1hbmFnZXIuZ2V0Qnl0ZU9mZnNldE9mRXhpc3RpbmdCdWZmZXJzKFxuICAgICAgICAgICAgQnVmZmVyVXNlLkdQVVZlcnRleERhdGEsXG4gICAgICAgICAgICBhY2Nlc3Nvci5idWZmZXJWaWV3LmJ1ZmZlci5pbmRleE9mVGhlQnVmZmVyVXNhZ2VcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMuX191bmlmb3JtTW9ycGhPZmZzZXRzVHlwZWRBcnJheSFbbW9ycGhVbmlmb3JtRGF0YU9mZnNldHNbaV0gKyBqXSA9XG4gICAgICAgICAgICAodGhpcy5fX2VuZ2luZS5lbmdpbmVTdGF0ZS50b3RhbFNpemVPZkdQVVNoYWRlckRhdGFTdG9yYWdlRXhjZXB0TW9ycGhEYXRhICtcbiAgICAgICAgICAgICAgYnl0ZU9mZnNldE9mRXhpc3RpbmdCdWZmZXIgK1xuICAgICAgICAgICAgICBhY2Nlc3Nvci5ieXRlT2Zmc2V0SW5CdWZmZXIpIC9cbiAgICAgICAgICAgIDQgL1xuICAgICAgICAgICAgNDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGVsZW1lbnROdW1Ub0NvcHkgPSBtb3JwaFVuaWZvcm1EYXRhT2Zmc2V0c1ttb3JwaFVuaWZvcm1EYXRhT2Zmc2V0cy5sZW5ndGggLSAxXTtcbiAgICB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LnVwZGF0ZVVuaWZvcm1CdWZmZXIoXG4gICAgICB0aGlzLl9fbW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlclVpZCxcbiAgICAgIHRoaXMuX191bmlmb3JtTW9ycGhPZmZzZXRzVHlwZWRBcnJheSEsXG4gICAgICAwLFxuICAgICAgZWxlbWVudE51bVRvQ29weVxuICAgICk7XG4gIH1cblxuICBjb21tb25fJGxvYWQoKTogdm9pZCB7XG4gICAgdGhpcy5fX2luaXRNb3JwaFVuaWZvcm1CdWZmZXJzKCk7XG4gIH1cblxuICBwcml2YXRlIF9faW5pdE1vcnBoVW5pZm9ybUJ1ZmZlcnMoKSB7XG4gICAgbGV0IG5lZWRzUmViaW5kTW9ycGhVbmlmb3JtQnVmZmVycyA9IGZhbHNlO1xuICAgIGNvbnN0IG1vcnBoVW5pZm9ybURhdGFPZmZzZXRzID0gUHJpbWl0aXZlLmdldE1vcnBoVW5pZm9ybURhdGFPZmZzZXRzKCk7XG4gICAgY29uc3QgbW9ycGhPZmZzZXRzVW5pZm9ybURhdGFTaXplID0gTWF0aC5tYXgoXG4gICAgICBNYXRoLmNlaWwobW9ycGhVbmlmb3JtRGF0YU9mZnNldHNbbW9ycGhVbmlmb3JtRGF0YU9mZnNldHMubGVuZ3RoIC0gMV0gLyA0KSAqIDQgKiA0LFxuICAgICAgNFxuICAgICk7XG5cbiAgICBpZiAobW9ycGhPZmZzZXRzVW5pZm9ybURhdGFTaXplICE9PSB0aGlzLl9fbGFzdE1vcnBoT2Zmc2V0c1VuaWZvcm1EYXRhU2l6ZSkge1xuICAgICAgLy8gZGVsZXRlIHRoZSBvbGQgbW9ycGggb2Zmc2V0cyB1bmlmb3JtIGJ1ZmZlclxuICAgICAgaWYgKHRoaXMuX19tb3JwaE9mZnNldHNVbmlmb3JtQnVmZmVyVWlkICE9PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgICB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmRlbGV0ZVVuaWZvcm1CdWZmZXIodGhpcy5fX21vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJVaWQpO1xuICAgICAgICB0aGlzLl9fbW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlclVpZCA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICAgICAgfVxuICAgICAgLy8gY3JlYXRlIHRoZSBuZXcgbW9ycGggb2Zmc2V0cyB1bmlmb3JtIGJ1ZmZlclxuICAgICAgdGhpcy5fX2xhc3RNb3JwaE9mZnNldHNVbmlmb3JtRGF0YVNpemUgPSBtb3JwaE9mZnNldHNVbmlmb3JtRGF0YVNpemU7XG4gICAgICBpZiAodGhpcy5fX21vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJVaWQgPT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkKSB7XG4gICAgICAgIGNvbnN0IGlucHV0QXJyYXlPZmZzZXRzID0gbmV3IFVpbnQzMkFycmF5KG1vcnBoT2Zmc2V0c1VuaWZvcm1EYXRhU2l6ZSk7XG4gICAgICAgIHRoaXMuX191bmlmb3JtTW9ycGhPZmZzZXRzVHlwZWRBcnJheSA9IGlucHV0QXJyYXlPZmZzZXRzO1xuICAgICAgICB0aGlzLl9fbW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlclVpZCA9XG4gICAgICAgICAgdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5jcmVhdGVVbmlmb3JtQnVmZmVyV2l0aEJ1ZmZlclZpZXcoaW5wdXRBcnJheU9mZnNldHMpO1xuICAgICAgICB0aGlzLl9fdXBkYXRlTW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlcnNJbm5lcigpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9fbGFzdE1vcnBoT2Zmc2V0c1VuaWZvcm1EYXRhU2l6ZSA9IG1vcnBoT2Zmc2V0c1VuaWZvcm1EYXRhU2l6ZTtcblxuICAgICAgbmVlZHNSZWJpbmRNb3JwaFVuaWZvcm1CdWZmZXJzID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBibGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzID0gQmxlbmRTaGFwZUNvbXBvbmVudC5nZXRPZmZzZXRzSW5Vbmlmb3JtKHRoaXMuX19lbmdpbmUpO1xuICAgIGNvbnN0IGJsZW5kU2hhcGVXZWlnaHRzVW5pZm9ybURhdGFTaXplID0gTWF0aC5tYXgoXG4gICAgICBNYXRoLmNlaWwoYmxlbmRTaGFwZVVuaWZvcm1EYXRhT2Zmc2V0c1tibGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzLmxlbmd0aCAtIDFdIC8gNCkgKiA0ICogNCxcbiAgICAgIDRcbiAgICApO1xuXG4gICAgaWYgKGJsZW5kU2hhcGVXZWlnaHRzVW5pZm9ybURhdGFTaXplICE9PSB0aGlzLl9fbGFzdE1vcnBoV2VpZ2h0c1VuaWZvcm1EYXRhU2l6ZSkge1xuICAgICAgLy8gZGVsZXRlIHRoZSBvbGQgbW9ycGggd2VpZ2h0cyB1bmlmb3JtIGJ1ZmZlclxuICAgICAgaWYgKHRoaXMuX19tb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyVWlkICE9PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgICB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmRlbGV0ZVVuaWZvcm1CdWZmZXIodGhpcy5fX21vcnBoV2VpZ2h0c1VuaWZvcm1CdWZmZXJVaWQpO1xuICAgICAgICB0aGlzLl9fbW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlclVpZCA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICAgICAgfVxuXG4gICAgICAvLyBjcmVhdGUgdGhlIG5ldyBtb3JwaCB3ZWlnaHRzIHVuaWZvcm0gYnVmZmVyXG4gICAgICBpZiAodGhpcy5fX21vcnBoV2VpZ2h0c1VuaWZvcm1CdWZmZXJVaWQgPT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkKSB7XG4gICAgICAgIGNvbnN0IGlucHV0QXJyYXlXZWlnaHRzID0gbmV3IEZsb2F0MzJBcnJheShibGVuZFNoYXBlV2VpZ2h0c1VuaWZvcm1EYXRhU2l6ZSk7XG4gICAgICAgIHRoaXMuX191bmlmb3JtTW9ycGhXZWlnaHRzVHlwZWRBcnJheSA9IGlucHV0QXJyYXlXZWlnaHRzO1xuICAgICAgICB0aGlzLl9fbW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlclVpZCA9XG4gICAgICAgICAgdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5jcmVhdGVVbmlmb3JtQnVmZmVyV2l0aEJ1ZmZlclZpZXcoaW5wdXRBcnJheVdlaWdodHMpO1xuICAgICAgICB0aGlzLl9fdXBkYXRlTW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlcigpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9fbGFzdE1vcnBoV2VpZ2h0c1VuaWZvcm1EYXRhU2l6ZSA9IGJsZW5kU2hhcGVXZWlnaHRzVW5pZm9ybURhdGFTaXplO1xuXG4gICAgICBuZWVkc1JlYmluZE1vcnBoVW5pZm9ybUJ1ZmZlcnMgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChuZWVkc1JlYmluZE1vcnBoVW5pZm9ybUJ1ZmZlcnMpIHtcbiAgICAgIHRoaXMuX19iaW5kTW9ycGhVbmlmb3JtQnVmZmVycygpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19iaW5kTW9ycGhVbmlmb3JtQnVmZmVycygpIHtcbiAgICBpZiAoXG4gICAgICB0aGlzLl9fbW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlclVpZCAhPT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQgJiZcbiAgICAgIHRoaXMuX19tb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyVWlkICE9PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZFxuICAgICkge1xuICAgICAgdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5zZXRVbmlmb3JtQmxvY2tCaW5kaW5nRm9yTW9ycGhPZmZzZXRzQW5kV2VpZ2h0c1dpdGhvdXRTaGFkZXJQcm9ncmFtKFxuICAgICAgICB0aGlzLl9fbW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlclVpZCxcbiAgICAgICAgdGhpcy5fX21vcnBoV2VpZ2h0c1VuaWZvcm1CdWZmZXJVaWRcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX3VwZGF0ZU1vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJzKCkge1xuICAgIGNvbnN0IG1vcnBoTWF4SW5kZXggPSBQcmltaXRpdmUuZ2V0UHJpbWl0aXZlQ291bnRIYXNNb3JwaCgpO1xuICAgIGlmIChcbiAgICAgIG1vcnBoTWF4SW5kZXggIT09IHRoaXMuX19sYXN0TW9ycGhNYXhJbmRleCB8fFxuICAgICAgdGhpcy5fX2VuZ2luZS5lbmdpbmVTdGF0ZS50b3RhbFNpemVPZkdQVVNoYWRlckRhdGFTdG9yYWdlRXhjZXB0TW9ycGhEYXRhICE9PVxuICAgICAgICB0aGlzLl9fbGFzdFRvdGFsU2l6ZU9mR1BVU2hhZGVyRGF0YVN0b3JhZ2VFeGNlcHRNb3JwaERhdGFcbiAgICApIHtcbiAgICAgIHRoaXMuX191cGRhdGVNb3JwaE9mZnNldHNVbmlmb3JtQnVmZmVyc0lubmVyKCk7XG4gICAgICB0aGlzLl9fbGFzdFRvdGFsU2l6ZU9mR1BVU2hhZGVyRGF0YVN0b3JhZ2VFeGNlcHRNb3JwaERhdGEgPVxuICAgICAgICB0aGlzLl9fZW5naW5lLmVuZ2luZVN0YXRlLnRvdGFsU2l6ZU9mR1BVU2hhZGVyRGF0YVN0b3JhZ2VFeGNlcHRNb3JwaERhdGE7XG4gICAgICB0aGlzLl9fbGFzdE1vcnBoTWF4SW5kZXggPSBtb3JwaE1heEluZGV4O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuZCB1cGRhdGVzIHRoZSBkYXRhIHRleHR1cmUgd2l0aCBjdXJyZW50IHNoYWRlciBkYXRhLlxuICAgKiBUaGlzIGlzIHRoZSBtYWluIGVudHJ5IHBvaW50IGZvciBkYXRhIHRleHR1cmUgbWFuYWdlbWVudCB0aGF0IGhhbmRsZXNcbiAgICogdGhlIGNvbXBsZXRlIHVwZGF0ZSBwcm9jZXNzLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCBkZWxlZ2F0ZXMgdG8gX19jcmVhdGVBbmRVcGRhdGVEYXRhVGV4dHVyZUlubmVyIHdpdGggbm8gc2l6ZSBsaW1pdCxcbiAgICogZW5zdXJpbmcgdGhlIGVudGlyZSBHUFUgaW5zdGFuY2UgZGF0YSBidWZmZXIgaXMgY29waWVkIHRvIHRoZSBkYXRhIHRleHR1cmUuXG4gICAqL1xuICBwcml2YXRlIF9fY3JlYXRlQW5kVXBkYXRlRGF0YVRleHR1cmUoKSB7XG4gICAgdGhpcy5fX2NyZWF0ZUFuZFVwZGF0ZURhdGFUZXh0dXJlSW5uZXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBpbXBsZW1lbnRhdGlvbiBmb3IgY3JlYXRpbmcgYW5kIHVwZGF0aW5nIHRoZSBkYXRhIHRleHR1cmUuXG4gICAqIFRoaXMgbWV0aG9kIGhhbmRsZXMgdGhlIGFjdHVhbCB0ZXh0dXJlIGNyZWF0aW9uLCBkYXRhIGNvcHlpbmcsIGFuZCBHUFUgdXBsb2FkLlxuICAgKlxuICAgKiBAcGFyYW0gX2NvcHlTaXplSW5CeXRlIC0gT3B0aW9uYWwgbGltaXQgb24gaG93IG1hbnkgYnl0ZXMgdG8gY29weSBmcm9tIHRoZSBHUFUgaW5zdGFuY2UgZGF0YSBidWZmZXJcbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBtZXRob2QgcGVyZm9ybXMgc2V2ZXJhbCBjcml0aWNhbCBvcGVyYXRpb25zOlxuICAgKiAtIFJldHJpZXZlcyB0aGUgR1BVIGluc3RhbmNlIGRhdGEgYnVmZmVyIGZyb20gbWVtb3J5IG1hbmFnZXJcbiAgICogLSBDYWxjdWxhdGVzIGFwcHJvcHJpYXRlIHRleHR1cmUgc2l6ZSBiYXNlZCBvbiBhdmFpbGFibGUgZGF0YVxuICAgKiAtIEhhbmRsZXMgYm90aCB0ZXh0dXJlIGNyZWF0aW9uIChmaXJzdCB0aW1lKSBhbmQgdGV4dHVyZSB1cGRhdGVzIChzdWJzZXF1ZW50IGNhbGxzKVxuICAgKiAtIENvbWJpbmVzIEdQVSBpbnN0YW5jZSBkYXRhIHdpdGggbW9ycGggdGFyZ2V0IGRhdGEgZm9yIGNvbXBsZXRlIHRleHR1cmVcbiAgICogLSBQcm92aWRlcyBkZWJ1ZyBmdW5jdGlvbmFsaXR5IHRvIGR1bXAgdGV4dHVyZSBjb250ZW50c1xuICAgKiAtIE1hbmFnZXMgdGV4dHVyZSBhbGlnbm1lbnQgYW5kIHBhZGRpbmcgcmVxdWlyZW1lbnRzXG4gICAqL1xuICBwcml2YXRlIF9fY3JlYXRlQW5kVXBkYXRlRGF0YVRleHR1cmVJbm5lcigpIHtcbiAgICBjb25zdCBtZW1vcnlNYW5hZ2VyID0gdGhpcy5fX2VuZ2luZS5tZW1vcnlNYW5hZ2VyO1xuXG4gICAgLy8gdGhlIEdQVSBnbG9iYWwgU3RvcmFnZVxuICAgIGNvbnN0IHNpemVzT2ZUaGVCdWZmZXJzID0gbWVtb3J5TWFuYWdlci5nZXRTaXplc09mVGhlQnVmZmVycyhCdWZmZXJVc2UuR1BVSW5zdGFuY2VEYXRhKTtcbiAgICBjb25zdCB0b3RhbFNpemVPZlRoZUJ1ZmZlcnMgPSBzaXplc09mVGhlQnVmZmVycy5yZWR1Y2UoKGFjYywgc2l6ZSkgPT4gYWNjICsgc2l6ZSwgMCk7XG4gICAgY29uc3QgZ3B1SW5zdGFuY2VEYXRhQnVmZmVycyA9IG1lbW9yeU1hbmFnZXIuZ2V0QnVmZmVycyhCdWZmZXJVc2UuR1BVSW5zdGFuY2VEYXRhKTtcbiAgICBjb25zdCBncHVJbnN0YW5jZURhdGFCdWZmZXJDb3VudCA9IGdwdUluc3RhbmNlRGF0YUJ1ZmZlcnMubGVuZ3RoO1xuICAgIGlmIChncHVJbnN0YW5jZURhdGFCdWZmZXJDb3VudCAhPT0gdGhpcy5fX2xhc3RHcHVJbnN0YW5jZURhdGFCdWZmZXJDb3VudCkge1xuICAgICAgdGhpcy5fX2xhc3RHcHVJbnN0YW5jZURhdGFCdWZmZXJDb3VudCA9IGdwdUluc3RhbmNlRGF0YUJ1ZmZlckNvdW50O1xuICAgICAgdGhpcy5kZWxldGVEYXRhVGV4dHVyZSgpO1xuICAgIH1cblxuICAgIGNvbnN0IGdsdyA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuY3VycmVudFdlYkdMQ29udGV4dFdyYXBwZXI7XG4gICAgaWYgKGdsdyA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGRhdGFUZXh0dXJlV2lkdGggPSBnbHcuZ2V0TWF4VGV4dHVyZVNpemUoKTtcbiAgICBpZiAodGhpcy5fX2RhdGFUZXh0dXJlVWlkICE9PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgY29uc3QgdG90YWxTaXplT2ZUaGVCdWZmZXJzSW5UZXhlbCA9IHRvdGFsU2l6ZU9mVGhlQnVmZmVycyAvIDQgLyA0O1xuICAgICAgY29uc3QgZGF0YVRleHR1cmVIZWlnaHQgPSBNYXRoLmNlaWwodG90YWxTaXplT2ZUaGVCdWZmZXJzSW5UZXhlbCAvIGRhdGFUZXh0dXJlV2lkdGgpO1xuICAgICAgY29uc3QgZGF0YVRleHR1cmVCeXRlU2l6ZSA9IGRhdGFUZXh0dXJlV2lkdGggKiBkYXRhVGV4dHVyZUhlaWdodCAqIDQgKiA0O1xuICAgICAgLy8gVGhlIGxpZ2h0IGNsdXN0ZXIgbGlzdHMgYXJlIGxhcmdlIGFuZCB1cGxvYWRlZCBhcyBkaXJ0eSByYW5nZXMsIHNvIHRoZSBnZW5lcmljIHVwbG9hZCBza2lwcyB0aGVtLlxuICAgICAgY29uc3QgbGlnaHRDbHVzdGVyU3lzdGVtID0gdGhpcy5fX2VuZ2luZS5saWdodENsdXN0ZXJTeXN0ZW07XG4gICAgICBjb25zdCBleGNsdWRlZEJ5dGVSYW5nZXMgPSBsaWdodENsdXN0ZXJTeXN0ZW0uX2dldEV4Y2x1ZGVkQnl0ZVJhbmdlcygpO1xuICAgICAgbGV0IGxheWVyQnl0ZU9mZnNldCA9IDA7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdwdUluc3RhbmNlRGF0YUJ1ZmZlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZ3B1SW5zdGFuY2VEYXRhQnVmZmVyID0gZ3B1SW5zdGFuY2VEYXRhQnVmZmVyc1tpXTtcbiAgICAgICAgY29uc3QgYnVmZmVyU2l6ZUZvckRhdGFUZXh0dXJlSW5CeXRlID1cbiAgICAgICAgICBpID09PSBncHVJbnN0YW5jZURhdGFCdWZmZXJzLmxlbmd0aCAtIDFcbiAgICAgICAgICAgID8gZ3B1SW5zdGFuY2VEYXRhQnVmZmVyLnRha2VuU2l6ZUluQnl0ZVxuICAgICAgICAgICAgOiBncHVJbnN0YW5jZURhdGFCdWZmZXIuYnl0ZUxlbmd0aDtcbiAgICAgICAgaWYgKGJ1ZmZlclNpemVGb3JEYXRhVGV4dHVyZUluQnl0ZSA+IGRhdGFUZXh0dXJlQnl0ZVNpemUpIHtcbiAgICAgICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKCdUaGUgYnVmZmVyIHNpemUgZXhjZWVkcyB0aGUgc2l6ZSBvZiB0aGUgZGF0YSB0ZXh0dXJlLicpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxheWVyQXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KGdwdUluc3RhbmNlRGF0YUJ1ZmZlci5nZXRBcnJheUJ1ZmZlcigpKTtcbiAgICAgICAgZm9yIChjb25zdCBbc3RhcnQsIGVuZF0gb2Ygc3VidHJhY3RCeXRlUmFuZ2VzKFxuICAgICAgICAgIGxheWVyQnl0ZU9mZnNldCxcbiAgICAgICAgICBsYXllckJ5dGVPZmZzZXQgKyBNYXRoLm1pbihidWZmZXJTaXplRm9yRGF0YVRleHR1cmVJbkJ5dGUsIGRhdGFUZXh0dXJlQnl0ZVNpemUpLFxuICAgICAgICAgIGV4Y2x1ZGVkQnl0ZVJhbmdlc1xuICAgICAgICApKSB7XG4gICAgICAgICAgdGhpcy5fX3VwbG9hZERhdGFUZXh0dXJlVGV4ZWxzKGxheWVyQXJyYXksIGxheWVyQnl0ZU9mZnNldCwgc3RhcnQsIGVuZCwgZGF0YVRleHR1cmVXaWR0aCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBkZWJ1Z1xuICAgICAgICBpZiAoIVdlYkdMU3RyYXRlZ3lXZWJHTDIuX19pc0RlYnVnT3BlcmF0aW9uVG9EYXRhVGV4dHVyZUJ1ZmZlckRvbmUpIHtcbiAgICAgICAgICBNaXNjVXRpbC5kb3dubG9hZFR5cGVkQXJyYXkoJ1Job2Rvbml0ZV9kYXRhVGV4dHVyZUJ1ZmZlci5iaW4nLCBsYXllckFycmF5KTtcbiAgICAgICAgICBXZWJHTFN0cmF0ZWd5V2ViR0wyLl9faXNEZWJ1Z09wZXJhdGlvblRvRGF0YVRleHR1cmVCdWZmZXJEb25lID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxheWVyQnl0ZU9mZnNldCArPSBncHVJbnN0YW5jZURhdGFCdWZmZXIuYnl0ZUxlbmd0aDtcbiAgICAgIH1cbiAgICAgIC8vIFVwbG9hZCB0aGUgYnl0ZSByYW5nZXMgdGhlIGxpZ2h0IGNsdXN0ZXIgc3lzdGVtIHJlYnVpbHQgb24gdGhlIENQVSBzaW5jZSB0aGUgbGFzdCBmcmFtZS4gVGhleSB3ZXJlIHNraXBwZWRcbiAgICAgIC8vIGJ5IHRoZSBnZW5lcmljIHVwbG9hZCBhYm92ZTsgdGhlIHJhbmdlcyBvZiBhIHZpZXcgbmV2ZXIgY3Jvc3MgYSBidWZmZXIgYm91bmRhcnkgKGEgdmlldyByZWdpb24gaXMgYWxsb2NhdGVkXG4gICAgICAvLyBpbiBvbmUgYnVmZmVyKSwgc28gdGhlIGxheWVyIGNhbiBiZSBmb3VuZCB3aXRoIGEgc2ltcGxlIGNvbnRhaW5tZW50IHRlc3QuXG4gICAgICBmb3IgKGNvbnN0IFtzdGFydCwgZW5kXSBvZiBsaWdodENsdXN0ZXJTeXN0ZW0uX3Rha2VEaXJ0eUJ5dGVSYW5nZXMoKSkge1xuICAgICAgICBsZXQgbGF5ZXJTdGFydCA9IDA7XG4gICAgICAgIGZvciAoY29uc3QgYnVmZmVyIG9mIGdwdUluc3RhbmNlRGF0YUJ1ZmZlcnMpIHtcbiAgICAgICAgICBjb25zdCBsYXllckVuZCA9IGxheWVyU3RhcnQgKyBidWZmZXIuYnl0ZUxlbmd0aDtcbiAgICAgICAgICBpZiAoc3RhcnQgPj0gbGF5ZXJTdGFydCAmJiBlbmQgPD0gbGF5ZXJFbmQpIHtcbiAgICAgICAgICAgIGNvbnN0IGxheWVyQXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KGJ1ZmZlci5nZXRBcnJheUJ1ZmZlcigpKTtcbiAgICAgICAgICAgIHRoaXMuX191cGxvYWREYXRhVGV4dHVyZVRleGVscyhsYXllckFycmF5LCBsYXllclN0YXJ0LCBzdGFydCwgZW5kLCBkYXRhVGV4dHVyZVdpZHRoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsYXllclN0YXJ0ID0gbGF5ZXJFbmQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgbW9ycGhCdWZmZXJzID0gbWVtb3J5TWFuYWdlci5nZXRCdWZmZXJzKEJ1ZmZlclVzZS5HUFVWZXJ0ZXhEYXRhKTtcbiAgICAgIGNvbnN0IG1vcnBoQnVmZmVyQXJyYXlCdWZmZXJzID0gbW9ycGhCdWZmZXJzLm1hcChidWZmZXIgPT4gYnVmZmVyLmdldEFycmF5QnVmZmVyKCkpO1xuXG4gICAgICAvLyBSZXNlcnZlIHRoZSB3aG9sZSBjYXBhY2l0eSBvZiBlYWNoIEdQVSBpbnN0YW5jZSBkYXRhIGJ1ZmZlciAoYWxpZ25lZCB0byB0aGUgcm93cyBvZiB0aGUgdGV4dHVyZSksXG4gICAgICAvLyBhbmQgcGxhY2UgdGhlIG1vcnBoIGRhdGEgYWZ0ZXIgdGhlbS4gVGhpcyBsYXlvdXQgbWF0Y2hlcyB0aGUgdXBkYXRlIHBhdGggYWJvdmUgYW5kIHRoZSBsb2NhdGlvbnNcbiAgICAgIC8vIHVzZWQgYnkgc2hhZGVycyAoc2VlIE1lbW9yeU1hbmFnZXIuZ2V0Qnl0ZU9mZnNldE9mRXhpc3RpbmdCdWZmZXJzKSwgYW5kIGFsbG9jYXRpb25zIGFmdGVyIHRoZSBjcmVhdGlvblxuICAgICAgLy8gb2YgdGhlIHRleHR1cmUgKGUuZy4gYm9uZSBkYXRhIG9mIGEgU2tlbGV0YWxDb21wb25lbnQpIG5ldmVyIG92ZXJ3cml0ZSB0aGUgbW9ycGggZGF0YS5cbiAgICAgIGNvbnN0IGRhdGFUZXh0dXJlV2lkdGhJbkJ5dGUgPSBkYXRhVGV4dHVyZVdpZHRoICogNCAqIDQ7XG4gICAgICBjb25zdCBpbnN0YW5jZURhdGFSZWdpb25TaXplczogQnl0ZVtdID0gZ3B1SW5zdGFuY2VEYXRhQnVmZmVycy5tYXAoXG4gICAgICAgIGJ1ZmZlciA9PiBNYXRoLmNlaWwoYnVmZmVyLmJ5dGVMZW5ndGggLyBkYXRhVGV4dHVyZVdpZHRoSW5CeXRlKSAqIGRhdGFUZXh0dXJlV2lkdGhJbkJ5dGVcbiAgICAgICk7XG4gICAgICBjb25zdCBpbnN0YW5jZURhdGFSZWdpb25Ub3RhbFNpemUgPSBpbnN0YW5jZURhdGFSZWdpb25TaXplcy5yZWR1Y2UoKGFjYywgc2l6ZSkgPT4gYWNjICsgc2l6ZSwgMCk7XG4gICAgICBjb25zdCBtb3JwaEJ1ZmZlckJ5dGVMZW5ndGggPSBtb3JwaEJ1ZmZlcnMucmVkdWNlKChhY2MsIGJ1ZmZlcikgPT4gYWNjICsgYnVmZmVyLmJ5dGVMZW5ndGgsIDApO1xuICAgICAgY29uc3QgZGF0YVJvd3MgPSBNYXRoLm1heChcbiAgICAgICAgTWF0aC5jZWlsKChpbnN0YW5jZURhdGFSZWdpb25Ub3RhbFNpemUgKyBtb3JwaEJ1ZmZlckJ5dGVMZW5ndGgpIC8gZGF0YVRleHR1cmVXaWR0aEluQnl0ZSksXG4gICAgICAgIDFcbiAgICAgICk7XG5cbiAgICAgIC8vIEFwcGVuZCB0aGUgaW5zdGFuY2UgU0lEIC8gcmVtYXAgdGFibGVzIHRvIHRoZSBkYXRhIHRleHR1cmUgc28gdGhhdCBtdWx0aS1kcmF3XG4gICAgICAvLyByZW5kZXJpbmcgZG9lcyBub3QgY29uc3VtZSBleHRyYSB0ZXh0dXJlIHVuaXRzIChtb2JpbGUgdGV4dHVyZSB1bml0IGxpbWl0cykuXG4gICAgICAvLyBUaGUgcm93cyBhcmUgb25seSByZXNlcnZlZCB3aGlsZSB0aGUgZmVhdHVyZSBpcyB1c2FibGUuXG4gICAgICBjb25zdCBpc0luc3RhbmNlU2lkRW5hYmxlZCA9XG4gICAgICAgIHRoaXMuX19lbmdpbmUuY29uZmlnLmlzTXVsdGlEcmF3RW5hYmxlZCAmJiB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmlzSW5zdGFuY2VTaWRUZXh0dXJlQ2FwYWJsZTtcbiAgICAgIGNvbnN0IHNpZFRhYmxlID0gdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5pbnN0YW5jZVNpZFRhYmxlO1xuICAgICAgY29uc3Qgc2lkU2xvdENhcGFjaXR5ID0gaXNJbnN0YW5jZVNpZEVuYWJsZWQgPyBNYXRoLm1heChzaWRUYWJsZS51c2VkRW5kLCAxKSA6IDA7XG4gICAgICBjb25zdCBzaWRSb3dzID0gaXNJbnN0YW5jZVNpZEVuYWJsZWQgPyBNYXRoLm1heChNYXRoLmNlaWwoc2lkU2xvdENhcGFjaXR5IC8gZGF0YVRleHR1cmVXaWR0aCksIDEpIDogMDtcbiAgICAgIGNvbnN0IHJlbWFwUm93cyA9IGlzSW5zdGFuY2VTaWRFbmFibGVkXG4gICAgICAgID8gTWF0aC5tYXgoTWF0aC5jZWlsKE1hdGguY2VpbChzaWRTbG90Q2FwYWNpdHkgLyA0KSAvIGRhdGFUZXh0dXJlV2lkdGgpLCAxKVxuICAgICAgICA6IDA7XG4gICAgICBjb25zdCBkYXRhVGV4dHVyZUhlaWdodCA9IGRhdGFSb3dzICsgc2lkUm93cyArIHJlbWFwUm93cztcbiAgICAgIHRoaXMuX19kYXRhVGV4dHVyZVdpZHRoID0gZGF0YVRleHR1cmVXaWR0aDtcbiAgICAgIHRoaXMuX19pbnN0YW5jZVNpZEJhc2VSb3cgPSBkYXRhUm93cztcbiAgICAgIHRoaXMuX19pbnN0YW5jZVJlbWFwQmFzZVJvdyA9IGRhdGFSb3dzICsgc2lkUm93cztcbiAgICAgIHRoaXMuX19pbnN0YW5jZVNpZEJhc2VWZWM0ID0gdGhpcy5fX2luc3RhbmNlU2lkQmFzZVJvdyAqIGRhdGFUZXh0dXJlV2lkdGg7XG4gICAgICB0aGlzLl9faW5zdGFuY2VSZW1hcEJhc2VWZWM0ID0gdGhpcy5fX2luc3RhbmNlUmVtYXBCYXNlUm93ICogZGF0YVRleHR1cmVXaWR0aDtcbiAgICAgIHRoaXMuX19pbnN0YW5jZVNpZENhcGFjaXR5ID0gc2lkU2xvdENhcGFjaXR5O1xuICAgICAgaWYgKGlzSW5zdGFuY2VTaWRFbmFibGVkKSB7XG4gICAgICAgIC8vIFRoZSBuZXcgdGV4dHVyZSBzdGFydHMgemVyb2VkLCBzbyBib3RoIHJlZ2lvbnMgbXVzdCBiZSB1cGxvYWRlZCBhZ2Fpbi5cbiAgICAgICAgc2lkVGFibGUubWFya0FsbERpcnR5KCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRhdGFUZXh0dXJlQnl0ZVNpemUgPSBkYXRhVGV4dHVyZVdpZHRoSW5CeXRlICogZGF0YVRleHR1cmVIZWlnaHQ7XG4gICAgICBjb25zdCBmaW5hbFVpbnQ4QXJyYXkgPSBuZXcgVWludDhBcnJheShkYXRhVGV4dHVyZUJ5dGVTaXplKTtcbiAgICAgIGxldCBkc3RCeXRlT2Zmc2V0ID0gMDtcbiAgICAgIGdwdUluc3RhbmNlRGF0YUJ1ZmZlcnMuZm9yRWFjaCgoYnVmZmVyLCBpKSA9PiB7XG4gICAgICAgIC8vIFRoZSByZXN0IG9mIHRoZSByZWdpb24gaXMgbm90IHRha2VuIHlldCwgc28gaXQgc3RheXMgemVyby5cbiAgICAgICAgZmluYWxVaW50OEFycmF5LnNldChuZXcgVWludDhBcnJheShidWZmZXIuZ2V0QXJyYXlCdWZmZXIoKSwgMCwgYnVmZmVyLnRha2VuU2l6ZUluQnl0ZSksIGRzdEJ5dGVPZmZzZXQpO1xuICAgICAgICBkc3RCeXRlT2Zmc2V0ICs9IGluc3RhbmNlRGF0YVJlZ2lvblNpemVzW2ldO1xuICAgICAgfSk7XG4gICAgICBtb3JwaEJ1ZmZlcnMuZm9yRWFjaCgoYnVmZmVyLCBpKSA9PiB7XG4gICAgICAgIGZpbmFsVWludDhBcnJheS5zZXQobmV3IFVpbnQ4QXJyYXkobW9ycGhCdWZmZXJBcnJheUJ1ZmZlcnNbaV0sIDAsIGJ1ZmZlci5ieXRlTGVuZ3RoKSwgZHN0Qnl0ZU9mZnNldCk7XG4gICAgICAgIGRzdEJ5dGVPZmZzZXQgKz0gYnVmZmVyLmJ5dGVMZW5ndGg7XG4gICAgICB9KTtcblxuICAgICAgY29uc3QgZmxvYXREYXRhVGV4dHVyZUJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkoZmluYWxVaW50OEFycmF5LmJ1ZmZlcik7XG4gICAgICB0aGlzLl9fZW5naW5lLmVuZ2luZVN0YXRlLnRvdGFsU2l6ZU9mR1BVU2hhZGVyRGF0YVN0b3JhZ2VFeGNlcHRNb3JwaERhdGEgPSBpbnN0YW5jZURhdGFSZWdpb25Ub3RhbFNpemU7XG5cbiAgICAgIC8vIHdyaXRlIGRhdGFcbiAgICAgIHRoaXMuX19kYXRhVGV4dHVyZVVpZCA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuY3JlYXRlVGV4dHVyZUZyb21UeXBlZEFycmF5KFxuICAgICAgICBmbG9hdERhdGFUZXh0dXJlQnVmZmVyISxcbiAgICAgICAge1xuICAgICAgICAgIGludGVybmFsRm9ybWF0OiBUZXh0dXJlRm9ybWF0LlJHQkEzMkYsXG4gICAgICAgICAgd2lkdGg6IGRhdGFUZXh0dXJlV2lkdGgsXG4gICAgICAgICAgaGVpZ2h0OiBkYXRhVGV4dHVyZUhlaWdodCxcbiAgICAgICAgICBmb3JtYXQ6IFBpeGVsRm9ybWF0LlJHQkEsXG4gICAgICAgICAgdHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgICAgICBnZW5lcmF0ZU1pcG1hcDogZmFsc2UsXG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICAvLyBUaGUgbmV3IHRleHR1cmUgY29udGFpbnMgZXZlcnl0aGluZywgaW5jbHVkaW5nIHRoZSBsaWdodCBjbHVzdGVycyBidWlsdCBvbiB0aGUgQ1BVLlxuICAgICAgdGhpcy5fX2VuZ2luZS5saWdodENsdXN0ZXJTeXN0ZW0uX3Rha2VEaXJ0eUJ5dGVSYW5nZXMoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVXBsb2FkcyB0aGUgYnl0ZXMgYFtzdGFydCwgZW5kKWAgb2YgdGhlIEdQVSBpbnN0YW5jZSBkYXRhICgxNi1ieXRlIGFsaWduZWQsIGluIHRoZSBjb25jYXRlbmF0ZWQgbGF5ZXJzKSB0byB0aGVcbiAgICogZGF0YSB0ZXh0dXJlLCB3aGVyZSB0ZXhlbCBgbmAgaG9sZHMgYnl0ZXMgYDE2bmAgdG8gYDE2biArIDE1YC4gVGhlIHJhbmdlIGlzIHNwbGl0IGludG8gYSBwYXJ0aWFsIGZpcnN0IHJvdywgZnVsbFxuICAgKiByb3dzIGFuZCBhIHBhcnRpYWwgbGFzdCByb3cuXG4gICAqXG4gICAqIEBwYXJhbSBsYXllckFycmF5IC0gVGhlIHdob2xlIG1lbW9yeSBvZiB0aGUgbGF5ZXIgdGhhdCBjb250YWlucyB0aGUgcmFuZ2VcbiAgICogQHBhcmFtIGxheWVyQnl0ZU9mZnNldCAtIFRoZSBieXRlIG9mZnNldCBvZiB0aGUgbGF5ZXIgaW4gdGhlIGNvbmNhdGVuYXRlZCBsYXllcnNcbiAgICovXG4gIHByaXZhdGUgX191cGxvYWREYXRhVGV4dHVyZVRleGVscyhcbiAgICBsYXllckFycmF5OiBGbG9hdDMyQXJyYXksXG4gICAgbGF5ZXJCeXRlT2Zmc2V0OiBudW1iZXIsXG4gICAgc3RhcnQ6IG51bWJlcixcbiAgICBlbmQ6IG51bWJlcixcbiAgICB3aWR0aDogbnVtYmVyXG4gICkge1xuICAgIGNvbnN0IHJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGxldCB0ZXhlbCA9IE1hdGguZmxvb3Ioc3RhcnQgLyAxNik7XG4gICAgY29uc3QgZW5kVGV4ZWwgPSBNYXRoLmNlaWwoZW5kIC8gMTYpO1xuICAgIGNvbnN0IGxheWVyVGV4ZWwgPSBsYXllckJ5dGVPZmZzZXQgLyAxNjtcbiAgICBjb25zdCB1cGxvYWQgPSAoeDogbnVtYmVyLCB5OiBudW1iZXIsIHc6IG51bWJlciwgaDogbnVtYmVyLCBmaXJzdFRleGVsOiBudW1iZXIpID0+IHtcbiAgICAgIGNvbnN0IGZyb20gPSAoZmlyc3RUZXhlbCAtIGxheWVyVGV4ZWwpICogNDtcbiAgICAgIHJlcG9zaXRvcnkudXBkYXRlVGV4dHVyZSh0aGlzLl9fZGF0YVRleHR1cmVVaWQsIGxheWVyQXJyYXkuc3ViYXJyYXkoZnJvbSwgZnJvbSArIHcgKiBoICogNCksIHtcbiAgICAgICAgbGV2ZWw6IDAsXG4gICAgICAgIG9mZnNldFg6IHgsXG4gICAgICAgIG9mZnNldFk6IHksXG4gICAgICAgIHdpZHRoOiB3LFxuICAgICAgICBoZWlnaHQ6IGgsXG4gICAgICAgIGZvcm1hdDogUGl4ZWxGb3JtYXQuUkdCQSxcbiAgICAgICAgdHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgd2hpbGUgKHRleGVsIDwgZW5kVGV4ZWwpIHtcbiAgICAgIGNvbnN0IHggPSB0ZXhlbCAlIHdpZHRoO1xuICAgICAgY29uc3QgeSA9IE1hdGguZmxvb3IodGV4ZWwgLyB3aWR0aCk7XG4gICAgICBpZiAoeCAhPT0gMCB8fCBlbmRUZXhlbCAtIHRleGVsIDwgd2lkdGgpIHtcbiAgICAgICAgLy8gYSBwYXJ0aWFsIHJvd1xuICAgICAgICBjb25zdCBjb3VudCA9IE1hdGgubWluKHdpZHRoIC0geCwgZW5kVGV4ZWwgLSB0ZXhlbCk7XG4gICAgICAgIHVwbG9hZCh4LCB5LCBjb3VudCwgMSwgdGV4ZWwpO1xuICAgICAgICB0ZXhlbCArPSBjb3VudDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGZ1bGwgcm93c1xuICAgICAgICBjb25zdCByb3dzID0gTWF0aC5mbG9vcigoZW5kVGV4ZWwgLSB0ZXhlbCkgLyB3aWR0aCk7XG4gICAgICAgIHVwbG9hZCgwLCB5LCB3aWR0aCwgcm93cywgdGV4ZWwpO1xuICAgICAgICB0ZXhlbCArPSByb3dzICogd2lkdGg7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZXMgdGhlIGN1cnJlbnQgZGF0YSB0ZXh0dXJlIGFuZCBmcmVlcyBhc3NvY2lhdGVkIEdQVSByZXNvdXJjZXMuXG4gICAqIFRoaXMgbWV0aG9kIHNob3VsZCBiZSBjYWxsZWQgd2hlbiB0aGUgZGF0YSB0ZXh0dXJlIG5lZWRzIHRvIGJlIHJlY3JlYXRlZFxuICAgKiBvciB3aGVuIGNsZWFuaW5nIHVwIHJlc291cmNlcy5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogQWZ0ZXIgY2FsbGluZyB0aGlzIG1ldGhvZCwgdGhlIGRhdGEgdGV4dHVyZSBVSUQgaXMgcmVzZXQgdG8gYW4gaW52YWxpZCBzdGF0ZSxcbiAgICogYW5kIGEgbmV3IGRhdGEgdGV4dHVyZSB3aWxsIGJlIGNyZWF0ZWQgb24gdGhlIG5leHQgcmVuZGVyaW5nIGN5Y2xlLlxuICAgKi9cbiAgZGVsZXRlRGF0YVRleHR1cmUoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX19kYXRhVGV4dHVyZVVpZCAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmRlbGV0ZVRleHR1cmUodGhpcy5fX2RhdGFUZXh0dXJlVWlkKTtcbiAgICAgIHRoaXMuX19kYXRhVGV4dHVyZVVpZCA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICAgIH1cbiAgICB0aGlzLl9faW5zdGFuY2VTaWRDYXBhY2l0eSA9IDA7XG4gICAgdGhpcy5fX2RhdGFUZXh0dXJlV2lkdGggPSAwO1xuICAgIC8vIFRoZSBvbGQgdGV4dHVyZSBvYmplY3QgaXMgZ29uZSwgc28gdGhlIG5leHQgZHJhdyBtdXN0IGJpbmQgdGhlIHByb2dyYW0gYW5kIHRoZVxuICAgIC8vIGRhdGEgdGV4dHVyZSBhZ2FpbiBldmVuIGlmIHRoZSBzYW1lIHNoYWRlciBwcm9ncmFtIGlzIHN0aWxsIGN1cnJlbnQuXG4gICAgdGhpcy5fX2xhc3RTaGFkZXIgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVwYXJlcyB0aGUgcmVuZGVyaW5nIHBpcGVsaW5lIGJlZm9yZSBhY3R1YWwgcmVuZGVyaW5nIGJlZ2lucy5cbiAgICogVGhpcyBtZXRob2QgdXBkYXRlcyBHUFUgc3RvcmFnZSAoZGF0YSB0ZXh0dXJlIGFuZCBVQk8pIGJhc2VkIG9uIGNvbXBvbmVudFxuICAgKiB1cGRhdGUgc3RhdGVzIGFuZCBtYW5hZ2VzIGxpZ2h0IGNvbXBvbmVudHMgZm9yIHRoZSBjdXJyZW50IGZyYW1lLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCBwZXJmb3JtcyBjb25kaXRpb25hbCB1cGRhdGVzIGJhc2VkIG9uIHdoYXQgaGFzIGNoYW5nZWQ6XG4gICAqIC0gRnVsbCB1cGRhdGU6IFdoZW4gYW5pbWF0aW9uLCB0cmFuc2Zvcm1zLCBzY2VuZSBncmFwaCwgb3IgbWF0ZXJpYWxzIGNoYW5nZVxuICAgKiAtIENhbWVyYS1vbmx5IHVwZGF0ZTogV2hlbiBvbmx5IGNhbWVyYSBvciBjYW1lcmEgY29udHJvbGxlciBkYXRhIGNoYW5nZXNcbiAgICogLSBBbHNvIHJldHJpZXZlcyBjdXJyZW50IGxpZ2h0IGNvbXBvbmVudHMgZm9yIHRoZSByZW5kZXJpbmcgcGFzc1xuICAgKlxuICAgKiBUaGUgbWV0aG9kIHRyYWNrcyB1cGRhdGUgY291bnRzIHRvIGF2b2lkIHVubmVjZXNzYXJ5IEdQVSB1cGxvYWRzIGFuZFxuICAgKiBwcm92aWRlcyBvcHRpbWFsIHBlcmZvcm1hbmNlIGJ5IHVwZGF0aW5nIG9ubHkgd2hhdCBoYXMgY2hhbmdlZC5cbiAgICovXG4gIHByZXJlbmRlcigpOiB2b2lkIHtcbiAgICAvLyBUaGUgaW5zdGFuY2UgU0lEIC8gcmVtYXAgcmVnaW9ucyBhcmUgYXBwZW5kZWQgdG8gdGhlIGRhdGEgdGV4dHVyZS4gUmVjcmVhdGUgaXRcbiAgICAvLyB3aGVuIHRoZSBudW1iZXIgb2Ygc3RhYmxlIGluc3RhbmNlIHNsb3RzIG91dGdyb3dzIHRoZSBjdXJyZW50bHkgcmVzZXJ2ZWQgcm93cy5cbiAgICBjb25zdCBpbnN0YW5jZVNpZEVuYWJsZWQgPVxuICAgICAgdGhpcy5fX2VuZ2luZS5jb25maWcuaXNNdWx0aURyYXdFbmFibGVkICYmIHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuaXNJbnN0YW5jZVNpZFRleHR1cmVDYXBhYmxlO1xuICAgIGlmIChpbnN0YW5jZVNpZEVuYWJsZWQpIHtcbiAgICAgIGNvbnN0IHNpZFRhYmxlID0gdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5pbnN0YW5jZVNpZFRhYmxlO1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLl9fZGF0YVRleHR1cmVVaWQgIT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkICYmXG4gICAgICAgIHNpZFRhYmxlLnVzZWRFbmQgPiB0aGlzLl9faW5zdGFuY2VTaWRDYXBhY2l0eVxuICAgICAgKSB7XG4gICAgICAgIHRoaXMuZGVsZXRlRGF0YVRleHR1cmUoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZS11cGxvYWQgdGhlIEdQVSBpbnN0YW5jZSBkYXRhIHdoZW4gYW55IG9mIGl0cyBzb3VyY2VzIGNoYW5nZWQuIFRoZSBsaWdodCBjbHVzdGVyIHN5c3RlbSBpcyBvbmUgb2YgdGhlbTpcbiAgICAvLyBpdCB3cml0ZXMgdGhlIGFsbC1saWdodCBsaXN0IGFuZCB0aGUgY2x1c3RlciB0YWJsZXMgaW50byB0aGUgc2FtZSBkYXRhLCBzbyBpdHMgYGRhdGFWZXJzaW9uYCBoYXMgdG8gYmVcbiAgICAvLyBjb21wYXJlZCBsaWtlIHRoZSBjb21wb25lbnQgdXBkYXRlIGNvdW50cy4gKFRoZSBjbHVzdGVyIHRhYmxlcyB0aGVtc2VsdmVzIGFyZSB1cGxvYWRlZCBhcyBkaXJ0eSByYW5nZXMgYnlcbiAgICAvLyBfX2NyZWF0ZUFuZFVwZGF0ZURhdGFUZXh0dXJlSW5uZXIuKVxuICAgIGlmIChcbiAgICAgIEFuaW1hdGlvbkNvbXBvbmVudC5nZXRJc0FuaW1hdGluZyh0aGlzLl9fZW5naW5lKSB8fFxuICAgICAgVHJhbnNmb3JtQ29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpICE9PSB0aGlzLl9fbGFzdFRyYW5zZm9ybUNvbXBvbmVudHNVcGRhdGVDb3VudCB8fFxuICAgICAgU2NlbmVHcmFwaENvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKSAhPT0gdGhpcy5fX2xhc3RTY2VuZUdyYXBoQ29tcG9uZW50c1VwZGF0ZUNvdW50IHx8XG4gICAgICBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudENhbWVyYVVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpICE9PSB0aGlzLl9fbGFzdENhbWVyYUNvbXBvbmVudHNVcGRhdGVDb3VudCB8fFxuICAgICAgQ2FtZXJhQ29udHJvbGxlckNvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKSAhPT0gdGhpcy5fX2xhc3RDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50c1VwZGF0ZUNvdW50IHx8XG4gICAgICB0aGlzLl9fZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5zdGF0ZVZlcnNpb24gIT09IHRoaXMuX19sYXN0TWF0ZXJpYWxzVXBkYXRlQ291bnQgfHxcbiAgICAgIHRoaXMuX19lbmdpbmUubGlnaHRDbHVzdGVyU3lzdGVtLmRhdGFWZXJzaW9uICE9PSB0aGlzLl9fbGFzdExpZ2h0Q2x1c3RlckRhdGFWZXJzaW9uIHx8XG4gICAgICBMaWdodENvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKSAhPT0gdGhpcy5fX2xhc3RMaWdodENvbXBvbmVudHNVcGRhdGVDb3VudCB8fFxuICAgICAgdGhpcy5fX2RhdGFUZXh0dXJlVWlkID09PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZFxuICAgICkge1xuICAgICAgLy8gU2V0dXAgR1BVIFN0b3JhZ2UgKERhdGEgVGV4dHVyZSAmIFVCTylcbiAgICAgIHRoaXMuX19jcmVhdGVBbmRVcGRhdGVEYXRhVGV4dHVyZSgpO1xuICAgICAgdGhpcy5fX2NyZWF0ZUFuZFVwZGF0ZVVCTygpO1xuICAgICAgdGhpcy5fX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQgPSBUcmFuc2Zvcm1Db21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSk7XG4gICAgICB0aGlzLl9fbGFzdFNjZW5lR3JhcGhDb21wb25lbnRzVXBkYXRlQ291bnQgPSBTY2VuZUdyYXBoQ29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICAgICAgdGhpcy5fX2xhc3RDYW1lcmFDb21wb25lbnRzVXBkYXRlQ291bnQgPSBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudENhbWVyYVVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICAgICAgdGhpcy5fX2xhc3RDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gQ2FtZXJhQ29udHJvbGxlckNvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKTtcbiAgICAgIHRoaXMuX19sYXN0TWF0ZXJpYWxzVXBkYXRlQ291bnQgPSB0aGlzLl9fZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5zdGF0ZVZlcnNpb247XG4gICAgICB0aGlzLl9fbGFzdExpZ2h0Q2x1c3RlckRhdGFWZXJzaW9uID0gdGhpcy5fX2VuZ2luZS5saWdodENsdXN0ZXJTeXN0ZW0uZGF0YVZlcnNpb247XG4gICAgICB0aGlzLl9fbGFzdExpZ2h0Q29tcG9uZW50c1VwZGF0ZUNvdW50ID0gTGlnaHRDb21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSk7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgQmxlbmRTaGFwZUNvbXBvbmVudC51cGRhdGVDb3VudCAhPT0gdGhpcy5fX2xhc3RCbGVuZFNoYXBlQ29tcG9uZW50c1VwZGF0ZUNvdW50Rm9yV2VpZ2h0cyB8fFxuICAgICAgQmxlbmRTaGFwZUNvbXBvbmVudC5nZXRDb3VudE9mQmxlbmRTaGFwZUNvbXBvbmVudHModGhpcy5fX2VuZ2luZSkgIT09IHRoaXMuX19jb3VudE9mQmxlbmRTaGFwZUNvbXBvbmVudHNcbiAgICApIHtcbiAgICAgIHRoaXMuX191cGRhdGVNb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyKCk7XG4gICAgICB0aGlzLl9fbGFzdEJsZW5kU2hhcGVDb21wb25lbnRzVXBkYXRlQ291bnRGb3JXZWlnaHRzID0gQmxlbmRTaGFwZUNvbXBvbmVudC51cGRhdGVDb3VudDtcbiAgICAgIHRoaXMuX19jb3VudE9mQmxlbmRTaGFwZUNvbXBvbmVudHMgPSBCbGVuZFNoYXBlQ29tcG9uZW50LmdldENvdW50T2ZCbGVuZFNoYXBlQ29tcG9uZW50cyh0aGlzLl9fZW5naW5lKTtcbiAgICAgIHRoaXMuX19lbmdpbmUubWF0ZXJpYWxSZXBvc2l0b3J5Ll9tYWtlU2hhZGVySW52YWxpZGF0ZVRvTW9ycGhNYXRlcmlhbHMoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9fdXBkYXRlTW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlcnMoKTtcblxuICAgIHRoaXMuX19saWdodENvbXBvbmVudHMgPSB0aGlzLl9fZW5naW5lLmNvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50c1dpdGhUeXBlKExpZ2h0Q29tcG9uZW50KSBhc1xuICAgICAgfCBMaWdodENvbXBvbmVudFtdXG4gICAgICB8IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHVuaWZvcm0gYnVmZmVycyBjb250YWluaW5nIG1vcnBoIHRhcmdldCB3ZWlnaHRzIGZvciBibGVuZCBzaGFwZSBhbmltYXRpb24uXG4gICAqIENvcGllcyB3ZWlnaHQgdmFsdWVzIGZyb20gYmxlbmQgc2hhcGUgY29tcG9uZW50cyB0byBHUFUtYWNjZXNzaWJsZSB1bmlmb3JtIGJ1ZmZlcnMuXG4gICAqL1xuICBwcml2YXRlIF9fdXBkYXRlTW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlcigpIHtcbiAgICBjb25zdCBtZW1vcnlNYW5hZ2VyID0gdGhpcy5fX2VuZ2luZS5tZW1vcnlNYW5hZ2VyO1xuICAgIGNvbnN0IGJsZW5kU2hhcGVEYXRhQnVmZmVyOiBCdWZmZXIgfCB1bmRlZmluZWQgPSBtZW1vcnlNYW5hZ2VyLmdldEJ1ZmZlcihCdWZmZXJVc2UuR1BVVmVydGV4RGF0YSk7XG4gICAgaWYgKGJsZW5kU2hhcGVEYXRhQnVmZmVyID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGJsZW5kU2hhcGVEYXRhQnVmZmVyLnRha2VuU2l6ZUluQnl0ZSA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGJsZW5kU2hhcGVVbmlmb3JtRGF0YU9mZnNldHMgPSBCbGVuZFNoYXBlQ29tcG9uZW50LmdldE9mZnNldHNJblVuaWZvcm0odGhpcy5fX2VuZ2luZSk7XG4gICAgY29uc3QgYmxlbmRTaGFwZUNvbXBvbmVudHMgPSB0aGlzLl9fZW5naW5lLmNvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50c1dpdGhUeXBlV2l0aG91dEZpbHRlcmluZyhcbiAgICAgIEJsZW5kU2hhcGVDb21wb25lbnRcbiAgICApIGFzIChCbGVuZFNoYXBlQ29tcG9uZW50IHwgdW5kZWZpbmVkKVtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmxlbmRTaGFwZUNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGJsZW5kU2hhcGVDb21wb25lbnQgPSBibGVuZFNoYXBlQ29tcG9uZW50c1tpXTtcbiAgICAgIGNvbnN0IHdlaWdodHMgPSBibGVuZFNoYXBlQ29tcG9uZW50ICE9IG51bGwgPyBibGVuZFNoYXBlQ29tcG9uZW50IS53ZWlnaHRzIDogW107XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHdlaWdodHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgdGhpcy5fX3VuaWZvcm1Nb3JwaFdlaWdodHNUeXBlZEFycmF5IVtibGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzW2ldICsgal0gPSB3ZWlnaHRzW2pdO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoYmxlbmRTaGFwZUNvbXBvbmVudHMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgZWxlbWVudE51bVRvQ29weSA9IGJsZW5kU2hhcGVVbmlmb3JtRGF0YU9mZnNldHNbYmxlbmRTaGFwZVVuaWZvcm1EYXRhT2Zmc2V0cy5sZW5ndGggLSAxXTtcbiAgICAgIHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkudXBkYXRlVW5pZm9ybUJ1ZmZlcihcbiAgICAgICAgdGhpcy5fX21vcnBoV2VpZ2h0c1VuaWZvcm1CdWZmZXJVaWQsXG4gICAgICAgIHRoaXMuX191bmlmb3JtTW9ycGhXZWlnaHRzVHlwZWRBcnJheSEsXG4gICAgICAgIDAsXG4gICAgICAgIGVsZW1lbnROdW1Ub0NvcHlcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgd2hldGhlciBVbmlmb3JtIEJ1ZmZlciBPYmplY3RzIChVQk8pIHNob3VsZCBiZSB1c2VkIGZvciBkYXRhIHN0b3JhZ2UuXG4gICAqIFVCT3MgYXJlIG9ubHkgdXNlZCB3aGVuIGJvdGggV2ViR0wgMi4wIGlzIGF2YWlsYWJsZSBhbmQgVUJPIHVzYWdlIGlzIGVuYWJsZWQgaW4gY29uZmlndXJhdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgdHJ1ZSBpZiBVQk9zIHNob3VsZCBiZSB1c2VkLCBmYWxzZSBvdGhlcndpc2VcbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVUJPcyBwcm92aWRlIG1vcmUgZWZmaWNpZW50IHVuaWZvcm0gZGF0YSB0cmFuc2ZlciBmb3IgV2ViR0wgMi4wIGNvbnRleHRzXG4gICAqIGFuZCBjYW4gc3RvcmUgbGFyZ2VyIGFtb3VudHMgb2YgdW5pZm9ybSBkYXRhIGNvbXBhcmVkIHRvIGluZGl2aWR1YWwgdW5pZm9ybXMuXG4gICAqL1xuICBwcml2YXRlIF9faXNVYm9Vc2UoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuY3VycmVudFdlYkdMQ29udGV4dFdyYXBwZXIhLmlzV2ViR0wyICYmIHRoaXMuX19lbmdpbmUuY29uZmlnLmlzVWJvRW5hYmxlZFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbmQgdXBkYXRlcyB0aGUgVW5pZm9ybSBCdWZmZXIgT2JqZWN0IChVQk8pIHdpdGggY3VycmVudCBzaGFkZXIgZGF0YS5cbiAgICogVGhpcyBtZXRob2QgaXMgb25seSBhY3RpdmUgd2hlbiBVQk8gdXNhZ2UgaXMgZW5hYmxlZCBhbmQgV2ViR0wgMi4wIGlzIGF2YWlsYWJsZS5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhlIFVCTyBzdG9yZXMgdGhlIHNhbWUgZGF0YSBhcyB0aGUgZGF0YSB0ZXh0dXJlIGJ1dCBpbiBhIGRpZmZlcmVudCBmb3JtYXRcbiAgICogb3B0aW1pemVkIGZvciB1bmlmb3JtIGJ1ZmZlciBhY2Nlc3MuIFRoaXMgbWV0aG9kIGhhbmRsZXM6XG4gICAqIC0gSW5pdGlhbCBVQk8gY3JlYXRpb24gd2l0aCBwcm9wZXIgc2l6ZSBhbGxvY2F0aW9uXG4gICAqIC0gVXBkYXRpbmcgZXhpc3RpbmcgVUJPIHdpdGggbmV3IGRhdGEgZnJvbSBHUFUgaW5zdGFuY2UgYnVmZmVyXG4gICAqIC0gUmVzcGVjdGluZyBhbGlnbm1lbnQgcmVxdWlyZW1lbnRzIGZvciB1bmlmb3JtIGJ1ZmZlciBsYXlvdXRzXG4gICAqL1xuICBwcml2YXRlIF9fY3JlYXRlQW5kVXBkYXRlVUJPKCkge1xuICAgIGlmICh0aGlzLl9faXNVYm9Vc2UoKSkge1xuICAgICAgY29uc3QgZ2x3ID0gdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5jdXJyZW50V2ViR0xDb250ZXh0V3JhcHBlcjtcbiAgICAgIGNvbnN0IGFsaWduZWRNYXhVbmlmb3JtQmxvY2tTaXplID0gZ2x3IS5nZXRBbGlnbmVkTWF4VW5pZm9ybUJsb2NrU2l6ZSgpO1xuICAgICAgY29uc3QgbWF4Q29udmVudGlvbkJsb2NrcyA9IGdsdyEuZ2V0TWF4Q29udmVudGlvblVuaWZvcm1CbG9ja3MoKTtcbiAgICAgIGNvbnN0IG1lbW9yeU1hbmFnZXIgPSB0aGlzLl9fZW5naW5lLm1lbW9yeU1hbmFnZXI7XG4gICAgICBjb25zdCBidWZmZXI6IEJ1ZmZlciB8IHVuZGVmaW5lZCA9IG1lbW9yeU1hbmFnZXIuZ2V0QnVmZmVyKEJ1ZmZlclVzZS5HUFVJbnN0YW5jZURhdGEpO1xuICAgICAgaWYgKHRoaXMuX19kYXRhVUJPVWlkID09PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgICB0aGlzLl9fZGF0YVVCT1VpZCA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuc2V0dXBVbmlmb3JtQnVmZmVyRGF0YUFyZWEoXG4gICAgICAgICAgbmV3IEZsb2F0MzJBcnJheShidWZmZXIhLmdldEFycmF5QnVmZmVyKCkpXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBhcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoYnVmZmVyIS5nZXRBcnJheUJ1ZmZlcigpKTtcbiAgICAgICAgdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS51cGRhdGVVbmlmb3JtQnVmZmVyKFxuICAgICAgICAgIHRoaXMuX19kYXRhVUJPVWlkLFxuICAgICAgICAgIGFycmF5LFxuICAgICAgICAgIDAsXG4gICAgICAgICAgKGFsaWduZWRNYXhVbmlmb3JtQmxvY2tTaXplICogbWF4Q29udmVudGlvbkJsb2NrcykgLyA0IC8vICg0IGJ5dGVzIHVuaXQpXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEF0dGFjaGVzIEdQVSBkYXRhIGZvciBhIHByaW1pdGl2ZSAocGxhY2Vob2xkZXIgaW1wbGVtZW50YXRpb24pLlxuICAgKiBUaGlzIG1ldGhvZCBpcyBwYXJ0IG9mIHRoZSBDR0FQSVN0cmF0ZWd5IGludGVyZmFjZSBidXQgaXMgbm90IHVzZWRcbiAgICogaW4gdGhlIGRhdGEgdGV4dHVyZSBzdHJhdGVneSBzaW5jZSBkYXRhIGlzIGhhbmRsZWQgdGhyb3VnaCB0ZXh0dXJlcy5cbiAgICpcbiAgICogQHBhcmFtIHByaW1pdGl2ZSAtIFRoZSBwcmltaXRpdmUgdG8gYXR0YWNoIEdQVSBkYXRhIGZvclxuICAgKi9cbiAgYXR0YWNoR1BVRGF0YShfcHJpbWl0aXZlOiBQcmltaXRpdmUpOiB2b2lkIHt9XG5cbiAgLyoqXG4gICAqIEludGVybmFsIEdQVSBkYXRhIGF0dGFjaG1lbnQgKHBsYWNlaG9sZGVyIGltcGxlbWVudGF0aW9uKS5cbiAgICogVGhpcyBtZXRob2QgaXMgcGFydCBvZiB0aGUgaW50ZXJmYWNlIGJ1dCBub3QgYWN0aXZlbHkgdXNlZCBpbiBkYXRhIHRleHR1cmUgc3RyYXRlZ3kuXG4gICAqXG4gICAqIEBwYXJhbSBnbCAtIFRoZSBXZWJHTCByZW5kZXJpbmcgY29udGV4dFxuICAgKiBAcGFyYW0gc2hhZGVyUHJvZ3JhbSAtIFRoZSBzaGFkZXIgcHJvZ3JhbSB0byBhdHRhY2ggZGF0YSB0b1xuICAgKi9cbiAgYXR0YWNoR1BVRGF0YUlubmVyKF9nbDogV2ViR0xSZW5kZXJpbmdDb250ZXh0LCBfc2hhZGVyUHJvZ3JhbTogV2ViR0xQcm9ncmFtKSB7fVxuXG4gIC8qKlxuICAgKiBBdHRhY2hlcyB2ZXJ0ZXggZGF0YSBmb3IgYSBwcmltaXRpdmUgKHBsYWNlaG9sZGVyIGltcGxlbWVudGF0aW9uKS5cbiAgICogVGhpcyBtZXRob2QgaXMgcGFydCBvZiB0aGUgaW50ZXJmYWNlIGJ1dCBkZWxlZ2F0ZXMgdG8gYXR0YWNoVmVydGV4RGF0YUlubmVyLlxuICAgKlxuICAgKiBAcGFyYW0gaSAtIEluZGV4IHBhcmFtZXRlciAodW51c2VkIGluIHRoaXMgaW1wbGVtZW50YXRpb24pXG4gICAqIEBwYXJhbSBwcmltaXRpdmUgLSBUaGUgcHJpbWl0aXZlIHRvIGF0dGFjaCB2ZXJ0ZXggZGF0YSBmb3JcbiAgICogQHBhcmFtIGdsdyAtIFRoZSBXZWJHTCBjb250ZXh0IHdyYXBwZXJcbiAgICogQHBhcmFtIGluc3RhbmNlSURCdWZmZXJVaWQgLSBUaGUgaW5zdGFuY2UgSUQgYnVmZmVyIHJlc291cmNlIGhhbmRsZVxuICAgKi9cbiAgYXR0YWNoVmVydGV4RGF0YShcbiAgICBfaTogbnVtYmVyLFxuICAgIF9wcmltaXRpdmU6IFByaW1pdGl2ZSxcbiAgICBfZ2x3OiBXZWJHTENvbnRleHRXcmFwcGVyLFxuICAgIF9pbnN0YW5jZUlEQnVmZmVyVWlkOiBXZWJHTFJlc291cmNlSGFuZGxlXG4gICk6IHZvaWQge31cblxuICAvKipcbiAgICogSW50ZXJuYWwgaW1wbGVtZW50YXRpb24gZm9yIGF0dGFjaGluZyB2ZXJ0ZXggZGF0YSB0byB0aGUgcmVuZGVyaW5nIHBpcGVsaW5lLlxuICAgKiBUaGlzIG1ldGhvZCBiaW5kcyB0aGUgYXBwcm9wcmlhdGUgVmVydGV4IEFycmF5IE9iamVjdCAoVkFPKSBvciBzZXRzIHVwXG4gICAqIHZlcnRleCBhdHRyaWJ1dGUgcG9pbnRlcnMgYW5kIGVsZW1lbnQgYnVmZmVyIGJpbmRpbmdzLlxuICAgKlxuICAgKiBAcGFyYW0gbWVzaCAtIFRoZSBtZXNoIGNvbnRhaW5pbmcgdGhlIHZlcnRleCBkYXRhXG4gICAqIEBwYXJhbSBwcmltaXRpdmUgLSBUaGUgc3BlY2lmaWMgcHJpbWl0aXZlIHdpdGhpbiB0aGUgbWVzaFxuICAgKiBAcGFyYW0gcHJpbWl0aXZlSW5kZXggLSBJbmRleCBvZiB0aGUgcHJpbWl0aXZlIHdpdGhpbiB0aGUgbWVzaFxuICAgKiBAcGFyYW0gZ2x3IC0gVGhlIFdlYkdMIGNvbnRleHQgd3JhcHBlciBmb3IgV2ViR0wgb3BlcmF0aW9uc1xuICAgKiBAcGFyYW0gaW5zdGFuY2VJREJ1ZmZlclVpZCAtIFJlc291cmNlIGhhbmRsZSBmb3IgaW5zdGFuY2UgSUQgYnVmZmVyXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGhhbmRsZXMgdHdvIHNjZW5hcmlvczpcbiAgICogLSBJZiBhIFZBTyBleGlzdHMsIGl0IHNpbXBseSBiaW5kcyB0aGUgVkFPIChtb3N0IGVmZmljaWVudClcbiAgICogLSBJZiBubyBWQU8gZXhpc3RzLCBpdCBtYW51YWxseSBzZXRzIHVwIHZlcnRleCBhdHRyaWJ1dGVzIGFuZCBpbmRleCBidWZmZXJcbiAgICovXG4gIGF0dGFjaFZlcnRleERhdGFJbm5lcihcbiAgICBtZXNoOiBNZXNoLFxuICAgIHByaW1pdGl2ZTogUHJpbWl0aXZlLFxuICAgIHByaW1pdGl2ZUluZGV4OiBJbmRleCxcbiAgICBnbHc6IFdlYkdMQ29udGV4dFdyYXBwZXIsXG4gICAgX2luc3RhbmNlSURCdWZmZXJVaWQ6IFdlYkdMUmVzb3VyY2VIYW5kbGVcbiAgKTogdm9pZCB7XG4gICAgLy8gYmluZFxuICAgIGNvbnN0IHZhbyA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuZ2V0V2ViR0xSZXNvdXJjZShcbiAgICAgIG1lc2guZ2V0VmFvVWlkcyhwcmltaXRpdmVJbmRleClcbiAgICApIGFzIFdlYkdMVmVydGV4QXJyYXlPYmplY3RPRVM7XG4gICAgaWYgKHZhbyAhPSBudWxsKSB7XG4gICAgICBnbHcuYmluZFZlcnRleEFycmF5KHZhbyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRoZSBwcmV2aW91cyBkcmF3IG1heSBoYXZlIGxlZnQgaXRzIFZBTyBib3VuZC4gVW5iaW5kIGl0IHNvIHRoYXQgdGhlIGF0dHJpYnV0ZSBzZXR1cCBiZWxvd1xuICAgICAgLy8gZ29lcyB0byB0aGUgZGVmYXVsdCB2ZXJ0ZXggYXJyYXkgaW5zdGVhZCBvZiBvdmVyd3JpdGluZyB0aGF0IFZBTy5cbiAgICAgIGdsdy5iaW5kVmVydGV4QXJyYXkobnVsbCk7XG4gICAgICBjb25zdCB2ZXJ0ZXhIYW5kbGVzID0gcHJpbWl0aXZlLnZlcnRleEhhbmRsZXMhO1xuICAgICAgdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5zZXRWZXJ0ZXhEYXRhVG9QaXBlbGluZSh2ZXJ0ZXhIYW5kbGVzLCBwcmltaXRpdmUsIG1lc2guX3ZhcmlhdGlvblZCT1VpZCk7XG4gICAgICBjb25zdCBpYm8gPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmdldFdlYkdMUmVzb3VyY2UodmVydGV4SGFuZGxlcy5pYm9IYW5kbGUhKSBhcyBXZWJHTEJ1ZmZlcjtcbiAgICAgIGNvbnN0IGdsID0gZ2x3LmdldFJhd0NvbnRleHQoKTtcbiAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGlibyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERldGFjaGVzIHZlcnRleCBkYXRhIGFmdGVyIHJlbmRlcmluZyB0byBrZWVwIFZBTyBzdGF0ZSBpc29sYXRlZCBmcm9tIGV4dGVybmFsIHJlbmRlcmVycy5cbiAgICpcbiAgICogQHBhcmFtIGdsdyAtIFRoZSBXZWJHTCBjb250ZXh0IHdyYXBwZXIgZm9yIFdlYkdMIG9wZXJhdGlvbnNcbiAgICovXG4gIGRldHRhY2hWZXJ0ZXhEYXRhKGdsdzogV2ViR0xDb250ZXh0V3JhcHBlcik6IHZvaWQge1xuICAgIGNvbnN0IGdsID0gZ2x3LmdldFJhd0NvbnRleHQoKTtcbiAgICBnbHcuYmluZFZlcnRleEFycmF5KG51bGwpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG51bGwpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBudWxsKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzaW5nbGV0b24gaW5zdGFuY2Ugb2YgV2ViR0xTdHJhdGVneVdlYkdMMi5cbiAgICogQ3JlYXRlcyB0aGUgaW5zdGFuY2UgaWYgaXQgZG9lc24ndCBleGlzdCBhbmQgaW5pdGlhbGl6ZXMgdGhlIFdlYlhSIHN5c3RlbSByZWZlcmVuY2UuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBzaW5nbGV0b24gaW5zdGFuY2Ugb2YgV2ViR0xTdHJhdGVneVdlYkdMMlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCBlbnN1cmVzIG9ubHkgb25lIGluc3RhbmNlIG9mIHRoZSBzdHJhdGVneSBleGlzdHMgdGhyb3VnaG91dCB0aGUgYXBwbGljYXRpb25cbiAgICogYW5kIHByb3Blcmx5IGluaXRpYWxpemVzIHRoZSBXZWJYUiBzeXN0ZW0gZm9yIFZSL0FSIHJlbmRlcmluZyBjYXBhYmlsaXRpZXMuXG4gICAqL1xuICBzdGF0aWMgaW5pdChlbmdpbmU6IEVuZ2luZSkge1xuICAgIHJldHVybiBuZXcgV2ViR0xTdHJhdGVneVdlYkdMMihlbmdpbmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGN1cnJlbnQgY29tcG9uZW50IFNJRHMgZm9yIGVhY2ggZGlzcGxheSBpbmRleCBpbiBWUi9ub24tVlIgcmVuZGVyaW5nLlxuICAgKiBUaGlzIG1ldGhvZCBjb25maWd1cmVzIGNhbWVyYSBjb21wb25lbnQgU0lEcyBiYXNlZCBvbiB0aGUgcmVuZGVyaW5nIG1vZGVcbiAgICogYW5kIGRpc3BsYXkgY29uZmlndXJhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHJlbmRlclBhc3MgLSBUaGUgY3VycmVudCByZW5kZXIgcGFzcyBiZWluZyBwcm9jZXNzZWRcbiAgICogQHBhcmFtIGRpc3BsYXlJZHggLSBUaGUgZGlzcGxheSBpbmRleCAoMCBvciAxIGZvciBzdGVyZW8gcmVuZGVyaW5nKVxuICAgKiBAcGFyYW0gaXNWUk1haW5QYXNzIC0gV2hldGhlciB0aGlzIGlzIGEgVlIgbWFpbiByZW5kZXJpbmcgcGFzc1xuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBGb3IgVlIgcmVuZGVyaW5nOlxuICAgKiAtIFVzZXMgV2ViWFIgc3lzdGVtIHRvIGdldCBhcHByb3ByaWF0ZSBjYW1lcmEgY29tcG9uZW50IFNJRFxuICAgKiAtIEhhbmRsZXMgYm90aCBtdWx0aXZpZXcgYW5kIHNlcGFyYXRlIGV5ZSByZW5kZXJpbmdcbiAgICogRm9yIG5vbi1WUiByZW5kZXJpbmc6XG4gICAqIC0gVXNlcyB0aGUgcmVuZGVyIHBhc3MgY2FtZXJhIG9yIGZhbGxzIGJhY2sgdG8gY3VycmVudCBjYW1lcmFcbiAgICogLSBTZXRzIGNhbWVyYSBjb21wb25lbnQgU0lEIHRvIC0xIGlmIG5vIGNhbWVyYSBpcyBhdmFpbGFibGVcbiAgICovXG4gIHByaXZhdGUgX19zZXRDdXJyZW50Q29tcG9uZW50U0lEc0ZvckVhY2hEaXNwbGF5SWR4KHJlbmRlclBhc3M6IFJlbmRlclBhc3MsIGRpc3BsYXlJZHg6IDAgfCAxLCBpc1ZSTWFpblBhc3M6IGJvb2xlYW4pIHtcbiAgICBpZiAoaXNWUk1haW5QYXNzKSB7XG4gICAgICBsZXQgY2FtZXJhQ29tcG9uZW50U2lkID0gLTE7XG4gICAgICBjb25zdCB3ZWJ4clN5c3RlbSA9IHRoaXMuX19lbmdpbmUuX3dlYlhSU3lzdGVtSWZFbmFibGVkO1xuICAgICAgaWYgKHdlYnhyU3lzdGVtPy5pc1dlYlhSTW9kZSkge1xuICAgICAgICBpZiAod2VieHJTeXN0ZW0uaXNNdWx0aVZpZXcoKSkge1xuICAgICAgICAgIGNhbWVyYUNvbXBvbmVudFNpZCA9IHdlYnhyU3lzdGVtLl9nZXRDYW1lcmFDb21wb25lbnRTSURBdCgwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYW1lcmFDb21wb25lbnRTaWQgPSB3ZWJ4clN5c3RlbS5fZ2V0Q2FtZXJhQ29tcG9uZW50U0lEQXQoZGlzcGxheUlkeCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuX19jdXJyZW50Q29tcG9uZW50U0lEcyEuX3ZbV2VsbEtub3duQ29tcG9uZW50VElEcy5DYW1lcmFDb21wb25lbnRUSURdID0gY2FtZXJhQ29tcG9uZW50U2lkO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBOb24tVlIgUmVuZGVyaW5nXG4gICAgICBsZXQgY2FtZXJhQ29tcG9uZW50ID0gcmVuZGVyUGFzcy5jYW1lcmFDb21wb25lbnQ7XG4gICAgICBpZiAoY2FtZXJhQ29tcG9uZW50ID09IG51bGwpIHtcbiAgICAgICAgLy8gaWYgdGhlIHJlbmRlclBhc3MgaGFzIG5vIGNhbWVyYUNvbXBvbmVudCwgdHJ5IHRvIGdldCB0aGUgY3VycmVudCBjYW1lcmFDb21wb25lbnRcbiAgICAgICAgY2FtZXJhQ29tcG9uZW50ID0gdGhpcy5fX2VuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudChcbiAgICAgICAgICBDYW1lcmFDb21wb25lbnQsXG4gICAgICAgICAgQ2FtZXJhQ29tcG9uZW50LmdldEN1cnJlbnQodGhpcy5fX2VuZ2luZSlcbiAgICAgICAgKSBhcyBDYW1lcmFDb21wb25lbnQ7XG4gICAgICB9XG4gICAgICBpZiAoY2FtZXJhQ29tcG9uZW50KSB7XG4gICAgICAgIHRoaXMuX19jdXJyZW50Q29tcG9uZW50U0lEcyEuX3ZbV2VsbEtub3duQ29tcG9uZW50VElEcy5DYW1lcmFDb21wb25lbnRUSURdID0gY2FtZXJhQ29tcG9uZW50LmNvbXBvbmVudFNJRDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX19jdXJyZW50Q29tcG9uZW50U0lEcyEuX3ZbV2VsbEtub3duQ29tcG9uZW50VElEcy5DYW1lcmFDb21wb25lbnRUSURdID0gLTE7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGN1cnJlbnQgY29tcG9uZW50IFNJRHMgZm9yIGVhY2ggcHJpbWl0aXZlIGJlaW5nIHJlbmRlcmVkLlxuICAgKiBUaGlzIG1ldGhvZCB1cGRhdGVzIHRoZSBnbG9iYWwgY29tcG9uZW50IFNJRCBhcnJheSB3aXRoIG1hdGVyaWFsLXNwZWNpZmljIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gZ2wgLSBUaGUgV2ViR0wgcmVuZGVyaW5nIGNvbnRleHRcbiAgICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIGJlaW5nIHVzZWQgZm9yIHJlbmRlcmluZ1xuICAgKiBAcGFyYW0gc2hhZGVyUHJvZ3JhbSAtIFRoZSBhY3RpdmUgc2hhZGVyIHByb2dyYW1cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBtZXRob2QgZW5zdXJlcyB0aGUgc2hhZGVyIGhhcyBhY2Nlc3MgdG8gdGhlIGNvcnJlY3QgbWF0ZXJpYWwgU0lEXG4gICAqIGFuZCBpbml0aWFsaXplcyB0aGUgY29tcG9uZW50IFNJRCBhcnJheSBpZiBpdCBoYXNuJ3QgYmVlbiBzZXQgdXAgeWV0LlxuICAgKiBUaGUgbWF0ZXJpYWwgU0lEIGlzIHN0b3JlZCBhdCBpbmRleCAwIG9mIHRoZSBjb21wb25lbnQgU0lEIGFycmF5LlxuICAgKi9cbiAgcHJpdmF0ZSBfX3NldEN1cnJlbnRDb21wb25lbnRTSURzRm9yRWFjaFByaW1pdGl2ZShcbiAgICBfZ2w6IFdlYkdMUmVuZGVyaW5nQ29udGV4dCxcbiAgICBtYXRlcmlhbDogTWF0ZXJpYWwsXG4gICAgX3NoYWRlclByb2dyYW06IFdlYkdMUHJvZ3JhbVxuICApIHtcbiAgICBpZiAodGhpcy5fX2N1cnJlbnRDb21wb25lbnRTSURzID09IG51bGwpIHtcbiAgICAgIHRoaXMuX19jdXJyZW50Q29tcG9uZW50U0lEcyA9IHRoaXMuX19lbmdpbmUuZ2xvYmFsRGF0YVJlcG9zaXRvcnkuZ2V0VmFsdWUoJ2N1cnJlbnRDb21wb25lbnRTSURzJywgMCk7XG4gICAgfVxuXG4gICAgdGhpcy5fX2N1cnJlbnRDb21wb25lbnRTSURzIS5fdlswXSA9IG1hdGVyaWFsLm1hdGVyaWFsU0lEO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhY2tzIHRoZSB2aXNpYmxlIGluc3RhbmNlcyBvZiBldmVyeSBtZXNoIGRyYXduIGluIHRoaXMgcGFzcyBpbnRvIHRoZSBlbmdpbmUtd2lkZVxuICAgKiByZW1hcCB0YWJsZSBhbmQgdXBsb2FkcyB0aGUgaW5zdGFuY2UgU0lEIC8gcmVtYXAgdGV4dHVyZXMgb25jZSBiZWZvcmUgZHJhd2luZy5cbiAgICogVGhpcyBtdXN0IGhhcHBlbiBiZWZvcmUgYW55IGRyYXcgc28gdGhhdCBhIG11bHRpLWRyYXcgYmF0Y2ggc3Bhbm5pbmcgc2V2ZXJhbCBtZXNoZXNcbiAgICogc2VlcyB0aGUgcmVtYXAgZW50cmllcyBvZiBhbGwgaXRzIG1lc2hlcy5cbiAgICovXG4gIHByaXZhdGUgX191cGxvYWRJbnN0YW5jZVRhYmxlcyhcbiAgICBwcmltaXRpdmVVaWRzOiBQcmltaXRpdmVVSURbXSxcbiAgICByZW5kZXJQYXNzOiBSZW5kZXJQYXNzLFxuICAgIHByaW1pdGl2ZXM6IFByaW1pdGl2ZVtdIHwgbnVsbFxuICApOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX19lbmdpbmUuY29uZmlnLmlzTXVsdGlEcmF3RW5hYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgY29uc3QgZ2x3ID0gd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuY3VycmVudFdlYkdMQ29udGV4dFdyYXBwZXI7XG4gICAgaWYgKGdsdyA9PSBudWxsIHx8IGdsdy53ZWJnbDJFeHRNRCA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHRhYmxlID0gd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuaW5zdGFuY2VTaWRUYWJsZTtcbiAgICBpZiAoIXRhYmxlLmlzU3VwcG9ydGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY3VsbGluZ1N0YXRlID0gTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9nZXRJbnN0YW5jZUN1bGxpbmdTdGF0ZShyZW5kZXJQYXNzKTtcbiAgICBjb25zdCBhbnlDdWxsZWQgPSBjdWxsaW5nU3RhdGUgIT0gbnVsbCAmJiBjdWxsaW5nU3RhdGUuY3VsbGVkRW50aXR5Q291bnQgPiAwO1xuICAgIC8vIEV2ZXJ5IG1lc2ggc2hvd3MgYWxsIG9mIGl0cyBpbnN0YW5jZXM6IHRoZSByZW1hcCB0YWJsZSBpcyB0aGUgaWRlbnRpdHksIHNvIHRoZVxuICAgIC8vIHZlcnRleCBzaGFkZXIgY2FuIGluZGV4IHRoZSBTSUQgdGV4ZWwgZGlyZWN0bHkgYW5kIHNraXAgYSBkZXBlbmRlbnQgZmV0Y2guXG4gICAgdGhpcy5fX2luc3RhbmNlUmVtYXBJZGVudGl0eSA9IGFueUN1bGxlZCA/IDAgOiAxO1xuICAgIGlmICghYW55Q3VsbGVkKSB7XG4gICAgICAvLyBSZW1hcCBlbnRyaWVzIGFyZSB1bnVzZWQgYW5kIGV2ZXJ5IGRyYXduIG1lc2gncyBTSUQgcmVjb3JkcyBhcmUgYWxyZWFkeSB3cml0dGVuLFxuICAgICAgLy8gc28gbm90aGluZyBoYXMgdG8gYmUgcGFja2VkIGZvciB0aGlzIHBhc3MuXG4gICAgICB0aGlzLl9fdXBsb2FkSW5zdGFuY2VTaWREYXRhVGV4dHVyZSh0YWJsZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY3VsbGVkRW50aXR5U3RhbXAgPSBjdWxsaW5nU3RhdGUhLmN1bGxlZEVudGl0eVN0YW1wO1xuICAgIGNvbnN0IGN1bGxUaWNrID0gY3VsbGluZ1N0YXRlIS5jdWxsVGljaztcbiAgICBjb25zdCBjdWxsaW5nSWQgPSBjdWxsaW5nU3RhdGUhLmN1bGxpbmdJZDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByaW1pdGl2ZVVpZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHByaW1pdGl2ZVVpZCA9IHByaW1pdGl2ZVVpZHNbaV07XG4gICAgICBpZiAocHJpbWl0aXZlVWlkID09PSAtMSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHByaW1pdGl2ZSA9IHByaW1pdGl2ZXMgIT0gbnVsbCA/IHByaW1pdGl2ZXNbaV0gOiBQcmltaXRpdmUuZ2V0UHJpbWl0aXZlKHByaW1pdGl2ZVVpZCk7XG4gICAgICBpZiAocHJpbWl0aXZlID09IG51bGwpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBtZXNoID0gcHJpbWl0aXZlLm1lc2ggYXMgTWVzaDtcbiAgICAgIGlmIChtZXNoID09IG51bGwgfHwgbWVzaC5fcmVtYXBQcmVwYXNzSWQgPT09IGN1bGxpbmdJZCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIG1lc2guX3JlbWFwUHJlcGFzc0lkID0gY3VsbGluZ0lkO1xuICAgICAgbWVzaC5fcGFja1Zpc2libGVJbnN0YW5jZXNUb1ZhcmlhdGlvblZCTyhjdWxsZWRFbnRpdHlTdGFtcCwgY3VsbFRpY2spO1xuICAgIH1cbiAgICB0aGlzLl9fdXBsb2FkSW5zdGFuY2VTaWREYXRhVGV4dHVyZSh0YWJsZSk7XG4gIH1cblxuICAvKipcbiAgICogVXBsb2FkcyB0aGUgZGlydHkgaW5zdGFuY2UgU0lEIC8gcmVtYXAgcm93cyBpbnRvIHRoZSBlbmdpbmUgZGF0YSB0ZXh0dXJlLlxuICAgKiBUaGUgdHdvIHRhYmxlcyBhcmUgc3RvcmVkIGluIHJlc2VydmVkIHJvd3MgYWZ0ZXIgdGhlIGNvbXBvbmVudCBkYXRhLCBzbyB0aGVcbiAgICogc2hhZGVyIGNhbiByZWFkIHRoZW0gZnJvbSB0ZXh0dXJlIHVuaXQgMCBhbmQgbm8gZXh0cmEgdGV4dHVyZSB1bml0IGlzIGNvbnN1bWVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfX3VwbG9hZEluc3RhbmNlU2lkRGF0YVRleHR1cmUodGFibGU6IEluc3RhbmNlU2lkVGFibGUpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fX2RhdGFUZXh0dXJlVWlkID09PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCB8fCB0aGlzLl9fZGF0YVRleHR1cmVXaWR0aCA8PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHVzZWRFbmQgPSB0YWJsZS51c2VkRW5kO1xuICAgIGlmICh1c2VkRW5kIDw9IDApIHtcbiAgICAgIHRhYmxlLmNsZWFyU2lkRGlydHkoKTtcbiAgICAgIHRhYmxlLmNsZWFyUmVtYXBEaXJ0eSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0YWJsZS5zaWREaXJ0eSkge1xuICAgICAgdGhpcy5fX3VwbG9hZEluc3RhbmNlUmVnaW9uKHRoaXMuX19pbnN0YW5jZVNpZEJhc2VSb3csIHVzZWRFbmQsIChkc3QsIHRleGVsT2Zmc2V0LCBjb3VudCkgPT5cbiAgICAgICAgdGFibGUud3JpdGVTaWRUZXhlbHMoZHN0LCB0ZXhlbE9mZnNldCwgY291bnQpXG4gICAgICApO1xuICAgICAgdGFibGUuY2xlYXJTaWREaXJ0eSgpO1xuICAgIH1cbiAgICAvLyBXaGVuIG5vIGluc3RhbmNlIGlzIGN1bGxlZCB0aGUgc2hhZGVyIHNraXBzIHRoZSByZW1hcCBsb29rdXAsIHNvIGEgc3RhbGUgcmVtYXBcbiAgICAvLyByZWdpb24gaXMgaGFybWxlc3MgYW5kIHRoZSB1cGxvYWQgY2FuIGJlIGRlZmVycmVkIHVudGlsIGEgY3VsbGVkIHBhc3MgbmVlZHMgaXQuXG4gICAgaWYgKHRhYmxlLnJlbWFwRGlydHkgJiYgdGhpcy5fX2luc3RhbmNlUmVtYXBJZGVudGl0eSA9PT0gMCkge1xuICAgICAgdGhpcy5fX3VwbG9hZEluc3RhbmNlUmVnaW9uKHRoaXMuX19pbnN0YW5jZVJlbWFwQmFzZVJvdywgTWF0aC5jZWlsKHVzZWRFbmQgLyA0KSwgKGRzdCwgdGV4ZWxPZmZzZXQsIGNvdW50KSA9PlxuICAgICAgICB0YWJsZS53cml0ZVJlbWFwVGV4ZWxzKGRzdCwgdGV4ZWxPZmZzZXQsIGNvdW50KVxuICAgICAgKTtcbiAgICAgIHRhYmxlLmNsZWFyUmVtYXBEaXJ0eSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBVcGxvYWRzIGB0ZXhlbENvdW50YCB0ZXhlbHMgc3RhcnRpbmcgYXQgYGJhc2VSb3dgIHRvIHRoZSBkYXRhIHRleHR1cmUuIFJvd3MgYXJlXG4gICAqIGB0aGlzLl9fZGF0YVRleHR1cmVXaWR0aGAgdGV4ZWxzIHdpZGUsIHNvIHRoZSBsYXN0IHJvdyBpcyB1cGxvYWRlZCBwYXJ0aWFsbHkuXG4gICAqL1xuICBwcml2YXRlIF9fdXBsb2FkSW5zdGFuY2VSZWdpb24oXG4gICAgYmFzZVJvdzogbnVtYmVyLFxuICAgIHRleGVsQ291bnQ6IG51bWJlcixcbiAgICBmaWxsOiAoZHN0OiBGbG9hdDMyQXJyYXksIHRleGVsT2Zmc2V0OiBudW1iZXIsIGNvdW50OiBudW1iZXIpID0+IHZvaWRcbiAgKTogdm9pZCB7XG4gICAgY29uc3Qgd2lkdGggPSB0aGlzLl9fZGF0YVRleHR1cmVXaWR0aDtcbiAgICBsZXQgcmVtYWluaW5nID0gdGV4ZWxDb3VudDtcbiAgICBsZXQgdGV4ZWxPZmZzZXQgPSAwO1xuICAgIGxldCByb3cgPSBiYXNlUm93O1xuICAgIHdoaWxlIChyZW1haW5pbmcgPiAwKSB7XG4gICAgICBjb25zdCBjb3VudCA9IE1hdGgubWluKHJlbWFpbmluZywgd2lkdGgpO1xuICAgICAgY29uc3QgZGF0YSA9IG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiA0KTtcbiAgICAgIGZpbGwoZGF0YSwgdGV4ZWxPZmZzZXQsIGNvdW50KTtcbiAgICAgIHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkudXBkYXRlVGV4dHVyZSh0aGlzLl9fZGF0YVRleHR1cmVVaWQsIGRhdGEsIHtcbiAgICAgICAgbGV2ZWw6IDAsXG4gICAgICAgIG9mZnNldFg6IDAsXG4gICAgICAgIG9mZnNldFk6IHJvdyxcbiAgICAgICAgd2lkdGg6IGNvdW50LFxuICAgICAgICBoZWlnaHQ6IDEsXG4gICAgICAgIGZvcm1hdDogUGl4ZWxGb3JtYXQuUkdCQSxcbiAgICAgICAgdHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgIH0pO1xuICAgICAgcmVtYWluaW5nIC09IGNvdW50O1xuICAgICAgdGV4ZWxPZmZzZXQgKz0gY291bnQ7XG4gICAgICByb3crKztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTWFpbiByZW5kZXJpbmcgbWV0aG9kIHRoYXQgcHJvY2Vzc2VzIGFsbCBwcmltaXRpdmVzIGluIGEgcmVuZGVyIHBhc3MuXG4gICAqIFRoaXMgbWV0aG9kIGhhbmRsZXMgZGlmZmVyZW50IHByaW1pdGl2ZSB0eXBlcyAob3BhcXVlLCB0cmFuc2x1Y2VudCwgYmxlbmQpXG4gICAqIGFuZCBtYW5hZ2VzIFZSL25vbi1WUiByZW5kZXJpbmcgbW9kZXMuXG4gICAqXG4gICAqIEBwYXJhbSBwcmltaXRpdmVVaWRzIC0gQXJyYXkgb2YgcHJpbWl0aXZlIFVJRHMgdG8gcmVuZGVyXG4gICAqIEBwYXJhbSByZW5kZXJQYXNzIC0gVGhlIHJlbmRlciBwYXNzIGNvbmZpZ3VyYXRpb25cbiAgICogQHBhcmFtIHJlbmRlclBhc3NUaWNrQ291bnQgLSBDdXJyZW50IHRpY2sgY291bnQgZm9yIHRoZSByZW5kZXIgcGFzc1xuICAgKiBAcGFyYW0gZGlzcGxheUlkeCAtIFRoZSBpbmRleCBvZiB0aGUgZGlzcGxheSB0byByZW5kZXIgdG9cbiAgICogQHJldHVybnMgdHJ1ZSBpZiBhbnkgcHJpbWl0aXZlcyB3ZXJlIHN1Y2Nlc3NmdWxseSByZW5kZXJlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIHByb2Nlc3NlcyBwcmltaXRpdmVzIGluIHRoZSBmb2xsb3dpbmcgb3JkZXI6XG4gICAqIDEuIE9wYXF1ZSBwcmltaXRpdmVzIChiYWNrLXRvLWZyb250IGZvciBkZXB0aCBvcHRpbWl6YXRpb24pXG4gICAqIDIuIFRyYW5zbHVjZW50IHByaW1pdGl2ZXMgKGZyb250LXRvLWJhY2sgZm9yIHByb3BlciBibGVuZGluZylcbiAgICogMy4gQmxlbmQgcHJpbWl0aXZlcyB3aXRoIFotd3JpdGUgZW5hYmxlZFxuICAgKiA0LiBCbGVuZCBwcmltaXRpdmVzIHdpdGhvdXQgWi13cml0ZVxuICAgKlxuICAgKiBUaGUgbWV0aG9kIGFsc28gaGFuZGxlcyBidWZmZXItbGVzcyByZW5kZXJpbmcgbW9kZSBmb3Igc3BlY2lhbCBjYXNlc1xuICAgKiBhbmQgbWFuYWdlcyBkZXB0aCBtYXNrIHNldHRpbmdzIGZvciBkaWZmZXJlbnQgcHJpbWl0aXZlIHR5cGVzLlxuICAgKi9cbiAgY29tbW9uXyRyZW5kZXIoXG4gICAgcHJpbWl0aXZlVWlkczogUHJpbWl0aXZlVUlEW10sXG4gICAgcmVuZGVyUGFzczogUmVuZGVyUGFzcyxcbiAgICByZW5kZXJQYXNzVGlja0NvdW50OiBDb3VudCxcbiAgICBfZGlzcGxheUlkeDogSW5kZXhcbiAgKSB7XG4gICAgaWYgKHR5cGVvZiBzcGVjdG9yICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgc3BlY3Rvci5zZXRNYXJrZXIoJ3wgIHwgIFdlYkdMMjpjb21tb25fJHJlbmRlciMnKTtcbiAgICB9XG4gICAgY29uc3QgZ2x3ID0gdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5jdXJyZW50V2ViR0xDb250ZXh0V3JhcHBlciE7XG4gICAgY29uc3QgZ2wgPSBnbHcuZ2V0UmF3Q29udGV4dEFzV2ViR0wyKCk7XG5cbiAgICBjb25zdCBpc1ZSTWFpblBhc3MgPSBXZWJHTFN0cmF0ZWd5Q29tbW9uTWV0aG9kLmlzVnJNYWluUGFzcyh0aGlzLl9fZW5naW5lLCByZW5kZXJQYXNzKTtcbiAgICBjb25zdCBkaXNwbGF5Q291bnQgPSBXZWJHTFN0cmF0ZWd5Q29tbW9uTWV0aG9kLmdldERpc3BsYXlDb3VudChpc1ZSTWFpblBhc3MsIHRoaXMuX19lbmdpbmUuX3dlYlhSU3lzdGVtSWZFbmFibGVkKTtcbiAgICAvLyBUaGUgc29ydCBwdWJsaXNoZXMgdGhlIHByaW1pdGl2ZXMgaW4gdGhlIHNhbWUgb3JkZXIgYXMgdGhlaXIgdWlkcywgc28gdGhlIGhvdCBsb29wcyBjYW5cbiAgICAvLyBza2lwIGEgcmVwb3NpdG9yeSBsb29rdXAgcGVyIHByaW1pdGl2ZS4gVGhlIGNoZWNrIGtlZXBzIHRoaXMgdmFsaWQgZm9yIGNhbGxlcnMgdGhhdCBwYXNzXG4gICAgLy8gYW5vdGhlciBhcnJheSAoZS5nLiBhIGNsb25lZCByZW5kZXIgcGFzcykuXG4gICAgY29uc3QgcHJpbWl0aXZlcyA9IHJlbmRlclBhc3MuX2xhc3RQcmltaXRpdmVVaWRzID09PSBwcmltaXRpdmVVaWRzID8gcmVuZGVyUGFzcy5fbGFzdFByaW1pdGl2ZXMgOiBudWxsO1xuXG4gICAgaWYgKHJlbmRlclBhc3MuaXNCdWZmZXJMZXNzUmVuZGVyaW5nTW9kZSgpKSB7XG4gICAgICB0aGlzLl9fcmVuZGVyV2l0aG91dEJ1ZmZlcnMoZ2wsIHJlbmRlclBhc3MsIGlzVlJNYWluUGFzcyk7XG4gICAgICBnbC5kZXB0aE1hc2sodHJ1ZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICB0aGlzLl9fdXBsb2FkSW5zdGFuY2VUYWJsZXMocHJpbWl0aXZlVWlkcywgcmVuZGVyUGFzcywgcHJpbWl0aXZlcyk7XG5cbiAgICBsZXQgcmVuZGVyZWRTb21ldGhpbmcgPSBmYWxzZTtcblxuICAgIC8vIEZvciBvcGFxdWUgcHJpbWl0aXZlc1xuICAgIGlmIChyZW5kZXJQYXNzLl90b1JlbmRlck9wYXF1ZVByaW1pdGl2ZXMpIHtcbiAgICAgIGlmICghcmVuZGVyUGFzcy5kZXB0aFdyaXRlTWFzaykge1xuICAgICAgICBnbC5kZXB0aE1hc2soZmFsc2UpO1xuICAgICAgfVxuICAgICAgLy8gRHJhd2luZyBmcm9tIHRoZSBuZWFyZXN0IG9iamVjdFxuICAgICAgcmVuZGVyZWRTb21ldGhpbmcgPVxuICAgICAgICB0aGlzLl9fcmVuZGVyQnVja2V0KFxuICAgICAgICAgIHByaW1pdGl2ZVVpZHMsXG4gICAgICAgICAgcHJpbWl0aXZlcyxcbiAgICAgICAgICByZW5kZXJQYXNzLl9sYXN0T3BhcXVlSW5kZXgsXG4gICAgICAgICAgMCxcbiAgICAgICAgICAtMSxcbiAgICAgICAgICBnbHcsXG4gICAgICAgICAgcmVuZGVyUGFzcyxcbiAgICAgICAgICBpc1ZSTWFpblBhc3MsXG4gICAgICAgICAgZGlzcGxheUNvdW50XG4gICAgICAgICkgfHwgcmVuZGVyZWRTb21ldGhpbmc7XG4gICAgfVxuXG4gICAgaWYgKHJlbmRlclBhc3MuX3RvUmVuZGVyVHJhbnNsdWNlbnRQcmltaXRpdmVzKSB7XG4gICAgICAvLyBEcmF3IFRyYW5zbHVjZW50IHByaW1pdGl2ZXNcbiAgICAgIHJlbmRlcmVkU29tZXRoaW5nID1cbiAgICAgICAgdGhpcy5fX3JlbmRlckJ1Y2tldChcbiAgICAgICAgICBwcmltaXRpdmVVaWRzLFxuICAgICAgICAgIHByaW1pdGl2ZXMsXG4gICAgICAgICAgcmVuZGVyUGFzcy5fbGFzdE9wYXF1ZUluZGV4ICsgMSxcbiAgICAgICAgICByZW5kZXJQYXNzLl9sYXN0VHJhbnNsdWNlbnRJbmRleCxcbiAgICAgICAgICAxLFxuICAgICAgICAgIGdsdyxcbiAgICAgICAgICByZW5kZXJQYXNzLFxuICAgICAgICAgIGlzVlJNYWluUGFzcyxcbiAgICAgICAgICBkaXNwbGF5Q291bnRcbiAgICAgICAgKSB8fCByZW5kZXJlZFNvbWV0aGluZztcbiAgICB9XG5cbiAgICBpZiAocmVuZGVyUGFzcy5fdG9SZW5kZXJCbGVuZFdpdGhaV3JpdGVQcmltaXRpdmVzKSB7XG4gICAgICAvLyBEcmF3IEJsZW5kIHByaW1pdGl2ZXMgd2l0aCBaV3JpdGVcbiAgICAgIHJlbmRlcmVkU29tZXRoaW5nID1cbiAgICAgICAgdGhpcy5fX3JlbmRlckJ1Y2tldChcbiAgICAgICAgICBwcmltaXRpdmVVaWRzLFxuICAgICAgICAgIHByaW1pdGl2ZXMsXG4gICAgICAgICAgcmVuZGVyUGFzcy5fbGFzdFRyYW5zbHVjZW50SW5kZXggKyAxLFxuICAgICAgICAgIHJlbmRlclBhc3MuX2xhc3RCbGVuZFdpdGhaV3JpdGVJbmRleCxcbiAgICAgICAgICAxLFxuICAgICAgICAgIGdsdyxcbiAgICAgICAgICByZW5kZXJQYXNzLFxuICAgICAgICAgIGlzVlJNYWluUGFzcyxcbiAgICAgICAgICBkaXNwbGF5Q291bnRcbiAgICAgICAgKSB8fCByZW5kZXJlZFNvbWV0aGluZztcbiAgICB9XG5cbiAgICBpZiAocmVuZGVyUGFzcy5fdG9SZW5kZXJCbGVuZFdpdGhvdXRaV3JpdGVQcmltaXRpdmVzKSB7XG4gICAgICAvLyBkaXNhYmxlIGRlcHRoIHdyaXRlIGZvciBibGVuZCBwcmltaXRpdmVzXG4gICAgICBnbC5kZXB0aE1hc2soZmFsc2UpO1xuXG4gICAgICAvLyBEcmF3IEJsZW5kIHByaW1pdGl2ZXMgd2l0aG91dCBaV3JpdGVcbiAgICAgIHJlbmRlcmVkU29tZXRoaW5nID1cbiAgICAgICAgdGhpcy5fX3JlbmRlckJ1Y2tldChcbiAgICAgICAgICBwcmltaXRpdmVVaWRzLFxuICAgICAgICAgIHByaW1pdGl2ZXMsXG4gICAgICAgICAgcmVuZGVyUGFzcy5fbGFzdEJsZW5kV2l0aFpXcml0ZUluZGV4ICsgMSxcbiAgICAgICAgICByZW5kZXJQYXNzLl9sYXN0QmxlbmRXaXRob3V0WldyaXRlSW5kZXgsXG4gICAgICAgICAgMSxcbiAgICAgICAgICBnbHcsXG4gICAgICAgICAgcmVuZGVyUGFzcyxcbiAgICAgICAgICBpc1ZSTWFpblBhc3MsXG4gICAgICAgICAgZGlzcGxheUNvdW50XG4gICAgICAgICkgfHwgcmVuZGVyZWRTb21ldGhpbmc7XG4gICAgfVxuXG4gICAgZ2wuZGVwdGhNYXNrKHRydWUpO1xuXG4gICAgLy8gRHJhd3MgbGVhdmUgdGhlaXIgVkFPIGJvdW5kIChzZWUgX19yZW5kZXJJbm5lciksIHNvIGRldGFjaCBvbmNlIHBlciBwYXNzIHRvIGtlZXAgdGhlIFZBTyBzdGF0ZVxuICAgIC8vIGlzb2xhdGVkIGZyb20gZXh0ZXJuYWwgcmVuZGVyZXJzIChlLmcuIEVmZmVrc2VlcikgYW5kIGZyb20gb3RoZXIgcGFzc2VzLlxuICAgIHRoaXMuZGV0dGFjaFZlcnRleERhdGEoZ2x3KTtcblxuICAgIHRoaXMuX19sYXN0UmVuZGVyUGFzc1RpY2tDb3VudCA9IHJlbmRlclBhc3NUaWNrQ291bnQ7XG5cbiAgICAvLyB0aGlzLl9fd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkudW5iaW5kVGV4dHVyZVNhbXBsZXJzKCk7XG5cbiAgICByZXR1cm4gcmVuZGVyZWRTb21ldGhpbmc7XG4gIH1cblxuICAvKipcbiAgICogUmVuZGVycyBwcmltaXRpdmVzIHdpdGhvdXQgdXNpbmcgdmVydGV4L2luZGV4IGJ1ZmZlcnMuXG4gICAqIFRoaXMgc3BlY2lhbGl6ZWQgcmVuZGVyaW5nIG1vZGUgaXMgdXNlZCBmb3IgY2VydGFpbiB0eXBlcyBvZiBwcm9jZWR1cmFsXG4gICAqIG9yIHNoYWRlci1nZW5lcmF0ZWQgZ2VvbWV0cnkuXG4gICAqXG4gICAqIEBwYXJhbSBnbCAtIFRoZSBXZWJHTCAyLjAgcmVuZGVyaW5nIGNvbnRleHRcbiAgICogQHBhcmFtIHJlbmRlclBhc3MgLSBUaGUgcmVuZGVyIHBhc3MgY29uZmlndXJhdGlvblxuICAgKiBAcGFyYW0gaXNWUk1haW5QYXNzIC0gV2hldGhlciB0aGlzIGlzIGEgVlIgbWFpbiByZW5kZXJpbmcgcGFzc1xuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCBoYW5kbGVzIGJ1ZmZlci1sZXNzIHJlbmRlcmluZyBieTpcbiAgICogLSBTZXR0aW5nIHVwIHRoZSBzaGFkZXIgcHJvZ3JhbSBhbmQgZGF0YSB0ZXh0dXJlIGJpbmRpbmdcbiAgICogLSBDb25maWd1cmluZyBjb21wb25lbnQgU0lEcyBhbmQgVlIgc3RhdGVcbiAgICogLSBTZXR0aW5nIG1hdGVyaWFsIHBhcmFtZXRlcnMgZGlyZWN0bHlcbiAgICogLSBVc2luZyBkcmF3QXJyYXlzIHdpdGggdGhlIHNwZWNpZmllZCBwcmltaXRpdmUgbW9kZSBhbmQgdmVydGV4IGNvdW50XG4gICAqL1xuICBwcml2YXRlIF9fcmVuZGVyV2l0aG91dEJ1ZmZlcnMoZ2w6IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQsIHJlbmRlclBhc3M6IFJlbmRlclBhc3MsIGlzVlJNYWluUGFzczogYm9vbGVhbikge1xuICAgIC8vIHNldHVwIHNoYWRlciBwcm9ncmFtXG4gICAgY29uc3QgbWF0ZXJpYWw6IE1hdGVyaWFsID0gcmVuZGVyUGFzcy5tYXRlcmlhbCE7XG4gICAgY29uc3QgcHJpbWl0aXZlOiBQcmltaXRpdmUgPSByZW5kZXJQYXNzLl9kdW1teVByaW1pdGl2ZUZvckJ1ZmZlckxlc3NSZW5kZXJpbmc7XG4gICAgc2V0dXBTaGFkZXJQcm9ncmFtKG1hdGVyaWFsLCBwcmltaXRpdmUsIHRoaXMpO1xuXG4gICAgY29uc3Qgc2hhZGVyUHJvZ3JhbVVpZCA9IG1hdGVyaWFsLmdldFNoYWRlclByb2dyYW1VaWQocHJpbWl0aXZlKTtcbiAgICBjb25zdCBzaGFkZXJQcm9ncmFtID0gdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5nZXRXZWJHTFJlc291cmNlKHNoYWRlclByb2dyYW1VaWQpISBhcyBXZWJHTFByb2dyYW07XG4gICAgZ2wudXNlUHJvZ3JhbShzaGFkZXJQcm9ncmFtKTtcbiAgICB0aGlzLl9fbGFzdFNoYWRlciA9IHNoYWRlclByb2dyYW1VaWQ7XG5cbiAgICAvLyBCaW5kIERhdGFUZXh0dXJlXG4gICAgdGhpcy5iaW5kRGF0YVRleHR1cmUoZ2wsIHNoYWRlclByb2dyYW0pO1xuXG4gICAgdGhpcy5fX3NldEN1cnJlbnRDb21wb25lbnRTSURzRm9yRWFjaFByaW1pdGl2ZShnbCwgbWF0ZXJpYWwsIHNoYWRlclByb2dyYW0pO1xuICAgIHRoaXMuX19zZXRDdXJyZW50Q29tcG9uZW50U0lEc0ZvckVhY2hEaXNwbGF5SWR4KHJlbmRlclBhc3MsIDAsIGlzVlJNYWluUGFzcyk7XG5cbiAgICB0aGlzLl9fdXBsb2FkQ3VycmVudENvbXBvbmVudFNJRHMoZ2wsIHNoYWRlclByb2dyYW0pO1xuICAgIHRoaXMuX191cGxvYWRMaWdodENsdXN0ZXJWaWV3KGdsLCBzaGFkZXJQcm9ncmFtKTtcblxuICAgIGlmICgoc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLnZyU3RhdGUgIT0gbnVsbCAmJiBpc1ZSTWFpblBhc3MpIHtcbiAgICAgIGNvbnN0IHZyU3RhdGUgPSB0aGlzLl9fZW5naW5lLmdsb2JhbERhdGFSZXBvc2l0b3J5LmdldFZhbHVlKCd2clN0YXRlJywgMCkgYXMgVmVjdG9yMjtcbiAgICAgIHZyU3RhdGUuX3ZbMF0gPSBpc1ZSTWFpblBhc3MgPyAxIDogMDtcbiAgICAgIHZyU3RhdGUuX3ZbMV0gPSAwO1xuICAgICAgKHNoYWRlclByb2dyYW0gYXMgYW55KS5fZ2wudW5pZm9ybTJpdigoc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLnZyU3RhdGUsIHZyU3RhdGUuX3YpO1xuICAgIH1cblxuICAgIFdlYkdMU3RyYXRlZ3lDb21tb25NZXRob2Quc2V0V2ViR0xQYXJhbWV0ZXJzKHRoaXMuX19lbmdpbmUsIG1hdGVyaWFsLCBnbCk7XG5cbiAgICBtYXRlcmlhbC5fc2V0UGFyYW1ldGVyc1RvR3B1V2ViR0xXaXRoT3V0SW50ZXJuYWxTZXR0aW5nKHtcbiAgICAgIHNoYWRlclByb2dyYW0sXG4gICAgICBmaXJzdFRpbWU6IHRydWUsXG4gICAgfSk7XG5cbiAgICBpZiAocmVuZGVyUGFzcy5kZXB0aFdyaXRlTWFzaykge1xuICAgICAgZ2wuZGVwdGhNYXNrKHRydWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBnbC5kZXB0aE1hc2soZmFsc2UpO1xuICAgIH1cblxuICAgIHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuc2V0Vmlld3BvcnQodGhpcy5fX2VuZ2luZSwgcmVuZGVyUGFzcy5nZXRWaWV3cG9ydCgpKTtcblxuICAgIC8vIEEgYnVmZmVyLWxlc3MgZHJhdyBiaW5kcyBubyB2ZXJ0ZXggYnVmZmVyLCBzbyB0aGUgc2hhZGVyIHJlYWRzIHRoZSBnZW5lcmljIHZhbHVlIG9mIHRoZVxuICAgIC8vIG1hdGVyaWFsU0lEIGF0dHJpYnV0ZS4gRnVsbC1zY3JlZW4gc2hhZGVycyAoYmx1ciwgbHVtaW5hbmNlIGRldGVjdGlvbiwgdG9uZSBtYXBwaW5nLCAuLi4pXG4gICAgLy8gbG9vayB1cCB0aGVpciBwYXJhbWV0ZXJzIGluIHRoZSBkYXRhIHRleHR1cmUgYnkgbWF0ZXJpYWxTSUQsIHNvIGl0IG11c3QgYmUgc2V0IGZvciB0aGlzXG4gICAgLy8gZHJhdzsgb3RoZXJ3aXNlIHRoZXkgcmVhZCBhbm90aGVyIG1hdGVyaWFsJ3Mgcm93IChvciBhbiB1bmRlZmluZWQgdmFsdWUpLiBUaGUgaW5zdGFuY2UgU0lEXG4gICAgLy8gbG9va3VwIGlzIHVudXNlZCBieSB0aGVzZSBzaGFkZXJzLCBidXQgcHJlcmVxdWlzaXRlcyBzdGlsbCBkZWNsYXJlcyBpdHMgdW5pZm9ybXMsIHNvIGtlZXBcbiAgICAvLyB0aGVtIGRlZmluZWQgYXMgd2VsbC5cbiAgICBjb25zdCBnbHcgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmN1cnJlbnRXZWJHTENvbnRleHRXcmFwcGVyO1xuICAgIGlmIChnbHcgIT0gbnVsbCAmJiB0aGlzLl9fdXNlTWF0ZXJpYWxTaWRBdHRyaWJ1dGUoZ2x3KSkge1xuICAgICAgLy8gVGhlIGRlZmF1bHQgVkFPIGhhcyBubyBlbmFibGVkIGF0dHJpYnV0ZSBhcnJheXMsIHNvIHRoZSBnZW5lcmljIHZhbHVlcyBhcmUgdXNlZC5cbiAgICAgIGdsLmJpbmRWZXJ0ZXhBcnJheShudWxsKTtcbiAgICAgIGdsLnZlcnRleEF0dHJpYkk0dWkoVmVydGV4QXR0cmlidXRlLk1hdGVyaWFsU2lkLmdldEF0dHJpYnV0ZVNsb3QoKSwgbWF0ZXJpYWwubWF0ZXJpYWxTSUQsIDAsIDAsIDApO1xuICAgICAgZ2wudmVydGV4QXR0cmliSTR1aShWZXJ0ZXhBdHRyaWJ1dGUuSW5zdGFuY2UuZ2V0QXR0cmlidXRlU2xvdCgpLCAwLCAwLCAwLCAwKTtcbiAgICAgIHRoaXMuX19zZXRJbnN0YW5jZVJlbWFwSWRlbnRpdHkoZ2wsIHNoYWRlclByb2dyYW0pO1xuICAgICAgdGhpcy5fX3NldEluc3RhbmNlU2lkRGF0YVRleHR1cmVJbmRpY2VzKGdsLCBzaGFkZXJQcm9ncmFtKTtcbiAgICB9XG5cbiAgICBnbC5kcmF3QXJyYXlzKFxuICAgICAgcmVuZGVyUGFzcy5fcHJpbWl0aXZlTW9kZUZvckJ1ZmZlckxlc3NSZW5kZXJpbmcuaW5kZXgsXG4gICAgICAwLFxuICAgICAgcmVuZGVyUGFzcy5fZHJhd1ZlcnRleE51bWJlckZvckJ1ZmZlckxlc3NSZW5kZXJpbmdcbiAgICApO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHBlci12ZXJ0ZXggbWF0ZXJpYWxTSUQgLyBpbnN0YW5jZUJhc2UgYXR0cmlidXRlIHBhdGggaXMgYWN0aXZlLiAqL1xuICBwcml2YXRlIF9fdXNlTWF0ZXJpYWxTaWRBdHRyaWJ1dGUoZ2x3OiBXZWJHTENvbnRleHRXcmFwcGVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuX19lbmdpbmUuY29uZmlnLmlzTXVsdGlEcmF3RW5hYmxlZCAmJlxuICAgICAgZ2x3LndlYmdsMkV4dE1EICE9IG51bGwgJiZcbiAgICAgIHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuaW5zdGFuY2VTaWRUYWJsZS5pc1N1cHBvcnRlZFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQmluZHMgdGhlIFZBTyB2YXJpYW50IG1hdGNoaW5nIHRoZSBlZmZlY3RpdmUgbWF0ZXJpYWwgYW5kIHNldHMgdGhlIGdlbmVyaWNcbiAgICogbWF0ZXJpYWxTSUQgd2hlbiB0aGUgcGVyLXZlcnRleCBtYXRlcmlhbFNJRCBidWZmZXIgbXVzdCBub3QgYmUgdXNlZFxuICAgKiAobm9uLWdyb3VwZWQgcHJpbWl0aXZlcyBhbmQgcmVuZGVyLXBhc3MgbWF0ZXJpYWwgb3ZlcnJpZGVzKS5cbiAgICovXG4gIHByaXZhdGUgX19iaW5kTXVsdGlEcmF3VmVydGV4RGF0YUZvck1hdGVyaWFsKFxuICAgIHByaW1pdGl2ZTogUHJpbWl0aXZlLFxuICAgIG1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgICBnbHc6IFdlYkdMQ29udGV4dFdyYXBwZXJcbiAgKTogdm9pZCB7XG4gICAgY29uc3Qgc2xvdCA9IFZlcnRleEF0dHJpYnV0ZS5NYXRlcmlhbFNpZC5nZXRBdHRyaWJ1dGVTbG90KCk7XG4gICAgY29uc3QgZ3JvdXAgPSBwcmltaXRpdmUuX211bHRpRHJhd0dyb3VwO1xuICAgIGNvbnN0IGdsID0gZ2x3LmdldFJhd0NvbnRleHRBc1dlYkdMMigpO1xuICAgIGlmIChncm91cCA9PSBudWxsIHx8IGdyb3VwLnZlcnRleEhhbmRsZXMgPT0gbnVsbCkge1xuICAgICAgLy8gTGVnYWN5IFZBTzogdGhlIGF0dHJpYnV0ZSBpcyBkaXNhYmxlZCBhbmQgcmVhZHMgdGhlIGdlbmVyaWMgdmFsdWUuXG4gICAgICBnbC52ZXJ0ZXhBdHRyaWJJNHVpKHNsb3QsIG1hdGVyaWFsLm1hdGVyaWFsU0lELCAwLCAwLCAwKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgaXNQZXJWZXJ0ZXhNYXRlcmlhbCA9IG1hdGVyaWFsID09PSBwcmltaXRpdmUubWF0ZXJpYWw7XG4gICAgY29uc3QgdmFvSGFuZGxlID0gaXNQZXJWZXJ0ZXhNYXRlcmlhbCA/IGdyb3VwLnZlcnRleEhhbmRsZXMudmFvSGFuZGxlIDogZ3JvdXAuZ2VuZXJpY01hdGVyaWFsU2lkVmFvSGFuZGxlO1xuICAgIGlmICh2YW9IYW5kbGUgIT0gbnVsbCkge1xuICAgICAgY29uc3QgdmFvID0gdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5nZXRXZWJHTFJlc291cmNlKHZhb0hhbmRsZSkgYXMgV2ViR0xWZXJ0ZXhBcnJheU9iamVjdE9FUztcbiAgICAgIGlmICh2YW8gIT0gbnVsbCkge1xuICAgICAgICBnbHcuYmluZFZlcnRleEFycmF5KHZhbyk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghaXNQZXJWZXJ0ZXhNYXRlcmlhbCkge1xuICAgICAgZ2wudmVydGV4QXR0cmliSTR1aShzbG90LCBtYXRlcmlhbC5tYXRlcmlhbFNJRCwgMCwgMCwgMCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbmRlcnMgYSBidWNrZXQgcmFuZ2UsIGJhdGNoaW5nIGNvbnNlY3V0aXZlIHByaW1pdGl2ZXMgdGhhdCBzaGFyZSBhIG11bHRpLWRyYXdcbiAgICogZ3JvdXAsIG1hdGVyaWFsIGFuZCBzaGFkZXIgcHJvZ3JhbSBpbnRvIG9uZSBXRUJHTF9tdWx0aV9kcmF3IGNhbGwuXG4gICAqL1xuICBwcml2YXRlIF9fcmVuZGVyQnVja2V0KFxuICAgIHByaW1pdGl2ZVVpZHM6IFByaW1pdGl2ZVVJRFtdLFxuICAgIHByaW1pdGl2ZXM6IFByaW1pdGl2ZVtdIHwgbnVsbCxcbiAgICBzdGFydDogbnVtYmVyLFxuICAgIGVuZDogbnVtYmVyLFxuICAgIHN0ZXA6IDEgfCAtMSxcbiAgICBnbHc6IFdlYkdMQ29udGV4dFdyYXBwZXIsXG4gICAgcmVuZGVyUGFzczogUmVuZGVyUGFzcyxcbiAgICBpc1ZSTWFpblBhc3M6IGJvb2xlYW4sXG4gICAgZGlzcGxheUNvdW50OiBudW1iZXJcbiAgKTogYm9vbGVhbiB7XG4gICAgY29uc3QgdXNlTXVsdGlEcmF3ID1cbiAgICAgICFpc1ZSTWFpblBhc3MgJiZcbiAgICAgIGRpc3BsYXlDb3VudCA9PT0gMSAmJlxuICAgICAgdGhpcy5fX2VuZ2luZS5jb25maWcuaXNNdWx0aURyYXdFbmFibGVkICYmXG4gICAgICBnbHcud2ViZ2wyRXh0TUQgIT0gbnVsbCAmJlxuICAgICAgdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5pc0luc3RhbmNlU2lkVGV4dHVyZUNhcGFibGU7XG5cbiAgICBsZXQgcmVuZGVyZWRTb21ldGhpbmcgPSBmYWxzZTtcbiAgICBpZiAoIXVzZU11bHRpRHJhdykge1xuICAgICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBzdGVwID4gMCA/IGkgPD0gZW5kIDogaSA+PSBlbmQ7IGkgKz0gc3RlcCkge1xuICAgICAgICByZW5kZXJlZFNvbWV0aGluZyA9XG4gICAgICAgICAgdGhpcy5fX3JlbmRlcklubmVyKFxuICAgICAgICAgICAgcHJpbWl0aXZlVWlkc1tpXSxcbiAgICAgICAgICAgIGdsdyxcbiAgICAgICAgICAgIHJlbmRlclBhc3MsXG4gICAgICAgICAgICBpc1ZSTWFpblBhc3MsXG4gICAgICAgICAgICBkaXNwbGF5Q291bnQsXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICBwcmltaXRpdmVzPy5baV1cbiAgICAgICAgICApIHx8IHJlbmRlcmVkU29tZXRoaW5nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlbmRlcmVkU29tZXRoaW5nO1xuICAgIH1cblxuICAgIGNvbnN0IGdldFJ1bktleSA9IChpbmRleDogbnVtYmVyKTogbnVtYmVyIHwgbnVsbCA9PiB7XG4gICAgICBjb25zdCBwcmltaXRpdmVVaWQgPSBwcmltaXRpdmVVaWRzW2luZGV4XTtcbiAgICAgIGlmIChwcmltaXRpdmVVaWQgPT09IC0xKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgY29uc3QgcHJpbWl0aXZlID0gcHJpbWl0aXZlcyAhPSBudWxsID8gcHJpbWl0aXZlc1tpbmRleF0gOiBQcmltaXRpdmUuZ2V0UHJpbWl0aXZlKHByaW1pdGl2ZVVpZCk7XG4gICAgICBpZiAocHJpbWl0aXZlID09IG51bGwgfHwgcHJpbWl0aXZlLl9tdWx0aURyYXdHcm91cCA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgY29uc3QgbWF0ZXJpYWwgPSByZW5kZXJQYXNzLmdldEFwcHJvcHJpYXRlTWF0ZXJpYWwocHJpbWl0aXZlKTtcbiAgICAgIGlmICghbWF0ZXJpYWwuX21hdGVyaWFsQ29udGVudC5pc011bHRpRHJhd0NvbXBhdGlibGUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICByZXR1cm4gZ2V0TXVsdGlEcmF3U3RhdGVLZXlJZChwcmltaXRpdmUsIG1hdGVyaWFsLCBnZXRQcmltaXRpdmVNZXNoUmVuZGVyZXJGaW5nZXJQcmludElkKHByaW1pdGl2ZSkpO1xuICAgIH07XG5cbiAgICBjb25zdCBwbGFuID0gcGxhbk11bHRpRHJhd1J1bnNJbnRvKHN0YXJ0LCBlbmQsIHN0ZXAsIGdldFJ1bktleSwgdGhpcy5fX3J1blBsYW4pO1xuICAgIGZvciAobGV0IHIgPSAwOyByIDwgcGxhbi5jb3VudDsgcisrKSB7XG4gICAgICBjb25zdCBydW5TdGFydCA9IHBsYW4uc3RhcnRzW3JdO1xuICAgICAgY29uc3QgcnVuQ291bnQgPSBwbGFuLmNvdW50c1tyXTtcbiAgICAgIGlmIChwbGFuLmtleXNbcl0gPT09IC0xIHx8IHJ1bkNvdW50IDwgMikge1xuICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IHJ1bkNvdW50OyBrKyspIHtcbiAgICAgICAgICBjb25zdCBpbmRleCA9IHJ1blN0YXJ0ICsgayAqIHN0ZXA7XG4gICAgICAgICAgcmVuZGVyZWRTb21ldGhpbmcgPVxuICAgICAgICAgICAgdGhpcy5fX3JlbmRlcklubmVyKFxuICAgICAgICAgICAgICBwcmltaXRpdmVVaWRzW2luZGV4XSxcbiAgICAgICAgICAgICAgZ2x3LFxuICAgICAgICAgICAgICByZW5kZXJQYXNzLFxuICAgICAgICAgICAgICBpc1ZSTWFpblBhc3MsXG4gICAgICAgICAgICAgIGRpc3BsYXlDb3VudCxcbiAgICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgICBwcmltaXRpdmVzPy5baW5kZXhdXG4gICAgICAgICAgICApIHx8IHJlbmRlcmVkU29tZXRoaW5nO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZW5kZXJlZFNvbWV0aGluZyA9XG4gICAgICAgICAgdGhpcy5fX3JlbmRlck11bHRpRHJhd0JhdGNoKFxuICAgICAgICAgICAgcHJpbWl0aXZlVWlkcyxcbiAgICAgICAgICAgIHByaW1pdGl2ZXMsXG4gICAgICAgICAgICBydW5TdGFydCxcbiAgICAgICAgICAgIHJ1bkNvdW50LFxuICAgICAgICAgICAgc3RlcCxcbiAgICAgICAgICAgIGdsdyxcbiAgICAgICAgICAgIHJlbmRlclBhc3MsXG4gICAgICAgICAgICBkaXNwbGF5Q291bnRcbiAgICAgICAgICApIHx8IHJlbmRlcmVkU29tZXRoaW5nO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVuZGVyZWRTb21ldGhpbmc7XG4gIH1cblxuICAvKipcbiAgICogRHJhd3MgYSBydW4gb2YgZ3JvdXBlZCBwcmltaXRpdmVzIHdpdGggb25lIG11bHRpLWRyYXcgY2FsbC4gVGhlIHJlbmRlciBzdGF0ZVxuICAgKiAoc2hhZGVyIHByb2dyYW0sIG1hdGVyaWFsLCBWQU8sIHRleHR1cmVzKSBpcyBwcmVwYXJlZCBieSByZW5kZXJpbmcgdGhlIGZpcnN0XG4gICAqIHByaW1pdGl2ZSB3aXRoIGEgZGVmZXJyZWQgZHJhdy5cbiAgICovXG4gIHByaXZhdGUgX19yZW5kZXJNdWx0aURyYXdCYXRjaChcbiAgICBwcmltaXRpdmVVaWRzOiBQcmltaXRpdmVVSURbXSxcbiAgICBwcmltaXRpdmVzOiBQcmltaXRpdmVbXSB8IG51bGwsXG4gICAgZmlyc3RJbmRleDogbnVtYmVyLFxuICAgIHJ1bkNvdW50OiBudW1iZXIsXG4gICAgc3RlcDogMSB8IC0xLFxuICAgIGdsdzogV2ViR0xDb250ZXh0V3JhcHBlcixcbiAgICByZW5kZXJQYXNzOiBSZW5kZXJQYXNzLFxuICAgIGRpc3BsYXlDb3VudDogbnVtYmVyXG4gICk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGZpcnN0UHJpbWl0aXZlID1cbiAgICAgIHByaW1pdGl2ZXMgIT0gbnVsbCA/IHByaW1pdGl2ZXNbZmlyc3RJbmRleF0gOiBQcmltaXRpdmUuZ2V0UHJpbWl0aXZlKHByaW1pdGl2ZVVpZHNbZmlyc3RJbmRleF0pO1xuICAgIGlmIChmaXJzdFByaW1pdGl2ZSA9PSBudWxsIHx8IGZpcnN0UHJpbWl0aXZlLl9tdWx0aURyYXdHcm91cCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IGZpcnN0TWVzaCA9IGZpcnN0UHJpbWl0aXZlLm1lc2ggYXMgTWVzaDtcblxuICAgIGNvbnN0IGRlZmVycmVkOiBEZWZlcnJlZE11bHRpRHJhdyA9IHtcbiAgICAgIHByaW1pdGl2ZTogZmlyc3RQcmltaXRpdmUsXG4gICAgICBtZXNoOiBmaXJzdE1lc2gsXG4gICAgICBpbmRleGVkOiBmaXJzdFByaW1pdGl2ZS5oYXNJbmRpY2VzKCksXG4gICAgICBtb2RlOiBmaXJzdFByaW1pdGl2ZS5wcmltaXRpdmVNb2RlLmluZGV4LFxuICAgICAgaW5kZXhCaXRTaXplOiBmaXJzdFByaW1pdGl2ZS5nZXRSZW5kZXJJbmRleEJpdFNpemUoKSxcbiAgICAgIGNvdW50OiAwLFxuICAgICAgb2Zmc2V0OiAwLFxuICAgICAgaW5zdGFuY2VDb3VudDogMCxcbiAgICB9O1xuXG4gICAgY29uc3QgcmVuZGVyZWRGaXJzdCA9IHRoaXMuX19yZW5kZXJJbm5lcihcbiAgICAgIHByaW1pdGl2ZVVpZHNbZmlyc3RJbmRleF0sXG4gICAgICBnbHcsXG4gICAgICByZW5kZXJQYXNzLFxuICAgICAgZmFsc2UsXG4gICAgICBkaXNwbGF5Q291bnQsXG4gICAgICBkZWZlcnJlZCxcbiAgICAgIGZpcnN0UHJpbWl0aXZlXG4gICAgKTtcbiAgICBpZiAoIXJlbmRlcmVkRmlyc3QpIHtcbiAgICAgIC8vIFRoZSBmaXJzdCBwcmltaXRpdmUgd2FzIHNraXBwZWQgKGhpZGRlbiBvciBubyB2aXNpYmxlIGluc3RhbmNlKS4gRHJhdyB0aGUgcmVzdCBpbmRpdmlkdWFsbHkuXG4gICAgICBsZXQgcmVuZGVyZWQgPSBmYWxzZTtcbiAgICAgIGZvciAobGV0IGsgPSAxOyBrIDwgcnVuQ291bnQ7IGsrKykge1xuICAgICAgICBjb25zdCBpbmRleCA9IGZpcnN0SW5kZXggKyBrICogc3RlcDtcbiAgICAgICAgcmVuZGVyZWQgPVxuICAgICAgICAgIHRoaXMuX19yZW5kZXJJbm5lcihcbiAgICAgICAgICAgIHByaW1pdGl2ZVVpZHNbaW5kZXhdLFxuICAgICAgICAgICAgZ2x3LFxuICAgICAgICAgICAgcmVuZGVyUGFzcyxcbiAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgZGlzcGxheUNvdW50LFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgcHJpbWl0aXZlcz8uW2luZGV4XVxuICAgICAgICAgICkgfHwgcmVuZGVyZWQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVuZGVyZWQ7XG4gICAgfVxuXG4gICAgY29uc3QgZ3JvdXAgPSBmaXJzdFByaW1pdGl2ZS5fbXVsdGlEcmF3R3JvdXA7XG4gICAgY29uc3QgY291bnRzID0gZ3JvdXAuY291bnRzITtcbiAgICBjb25zdCBvZmZzZXRzID0gZ3JvdXAub2Zmc2V0cyE7XG4gICAgY29uc3QgaW5zdGFuY2VDb3VudHMgPSBncm91cC5pbnN0YW5jZUNvdW50cyE7XG4gICAgY29uc3QgZmlyc3RzID0gZ3JvdXAuZmlyc3RzITtcbiAgICBjb25zdCB2ZXJ0ZXhDb3VudHMgPSBncm91cC52ZXJ0ZXhDb3VudHMhO1xuICAgIGNvbnN0IGluZGV4ZWQgPSBkZWZlcnJlZC5pbmRleGVkO1xuICAgIGNvbnN0IGdsID0gZ2x3LmdldFJhd0NvbnRleHRBc1dlYkdMMigpO1xuXG4gICAgbGV0IGRyYXdDb3VudCA9IDA7XG4gICAgY291bnRzW2RyYXdDb3VudF0gPSBkZWZlcnJlZC5jb3VudDtcbiAgICBvZmZzZXRzW2RyYXdDb3VudF0gPSBkZWZlcnJlZC5vZmZzZXQ7XG4gICAgZmlyc3RzW2RyYXdDb3VudF0gPSBkZWZlcnJlZC5vZmZzZXQ7XG4gICAgdmVydGV4Q291bnRzW2RyYXdDb3VudF0gPSBkZWZlcnJlZC5jb3VudDtcbiAgICBpbnN0YW5jZUNvdW50c1tkcmF3Q291bnRdID0gZGVmZXJyZWQuaW5zdGFuY2VDb3VudDtcbiAgICBkcmF3Q291bnQrKztcblxuICAgIGNvbnN0IGN1bGxpbmdTdGF0ZSA9IE1lc2hSZW5kZXJlckNvbXBvbmVudC5fZ2V0SW5zdGFuY2VDdWxsaW5nU3RhdGUocmVuZGVyUGFzcyk7XG4gICAgY29uc3QgY3VsbGVkRW50aXR5U3RhbXAgPSBjdWxsaW5nU3RhdGU/LmN1bGxlZEVudGl0eVN0YW1wO1xuICAgIGNvbnN0IGN1bGxUaWNrID0gY3VsbGluZ1N0YXRlPy5jdWxsVGljayA/PyAwO1xuXG4gICAgZm9yIChsZXQgayA9IDE7IGsgPCBydW5Db3VudDsgaysrKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGZpcnN0SW5kZXggKyBrICogc3RlcDtcbiAgICAgIGNvbnN0IHByaW1pdGl2ZSA9IHByaW1pdGl2ZXMgIT0gbnVsbCA/IHByaW1pdGl2ZXNbaW5kZXhdIDogUHJpbWl0aXZlLmdldFByaW1pdGl2ZShwcmltaXRpdmVVaWRzW2luZGV4XSk7XG4gICAgICBpZiAocHJpbWl0aXZlID09IG51bGwgfHwgcHJpbWl0aXZlLl9tdWx0aURyYXdHcm91cCAhPT0gZ3JvdXApIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBtYXRlcmlhbCA9IHJlbmRlclBhc3MuZ2V0QXBwcm9wcmlhdGVNYXRlcmlhbChwcmltaXRpdmUpO1xuICAgICAgLy8gQSBjcm9zcy1tYXRlcmlhbCBiYXRjaCBjb250YWlucyBtYXRlcmlhbHMgd2hvc2Ugc2hhZGVyIHByb2dyYW0gaGFzIG5vdCBiZWVuXG4gICAgICAvLyByZWdpc3RlcmVkIHlldCAodGhlIGZpcnN0IHByaW1pdGl2ZSdzIF9fcmVuZGVySW5uZXIgb25seSByZWdpc3RlcnMgaXRzIG93blxuICAgICAgLy8gbWF0ZXJpYWwpLiBSZWdpc3RlciB0aGUgc2hhcmVkIHByb2dyYW0gYmVmb3JlIHRoZSBkcmF3OyBvdGhlcndpc2VcbiAgICAgIC8vIGlzU2tpcERyYXdpbmcoKSB3b3VsZCBza2lwIGV2ZXJ5IG90aGVyIG1hdGVyaWFsLlxuICAgICAgaWYgKG1hdGVyaWFsLmdldFNoYWRlclByb2dyYW1VaWQocHJpbWl0aXZlKSA9PT0gLTEpIHtcbiAgICAgICAgc2V0dXBTaGFkZXJQcm9ncmFtKG1hdGVyaWFsLCBwcmltaXRpdmUsIHRoaXMpO1xuICAgICAgfVxuICAgICAgaWYgKGlzU2tpcERyYXdpbmcobWF0ZXJpYWwsIHByaW1pdGl2ZSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBtZXNoID0gcHJpbWl0aXZlLm1lc2ggYXMgTWVzaDtcbiAgICAgIGNvbnN0IGluc3RhbmNlQ291bnQgPSBtZXNoLl9wYWNrVmlzaWJsZUluc3RhbmNlc1RvVmFyaWF0aW9uVkJPKGN1bGxlZEVudGl0eVN0YW1wLCBjdWxsVGljayk7XG4gICAgICBpZiAoaW5zdGFuY2VDb3VudCA9PT0gMCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGVudHJ5ID0gcHJpbWl0aXZlLl9tdWx0aURyYXdFbnRyeTtcbiAgICAgIGlmIChlbnRyeSA9PSBudWxsKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY291bnRzW2RyYXdDb3VudF0gPSBlbnRyeS5pbmRleENvdW50O1xuICAgICAgb2Zmc2V0c1tkcmF3Q291bnRdID0gZW50cnkuaW5kZXhCeXRlT2Zmc2V0O1xuICAgICAgZmlyc3RzW2RyYXdDb3VudF0gPSBlbnRyeS52ZXJ0ZXhPZmZzZXQ7XG4gICAgICB2ZXJ0ZXhDb3VudHNbZHJhd0NvdW50XSA9IGVudHJ5LnZlcnRleENvdW50O1xuICAgICAgaW5zdGFuY2VDb3VudHNbZHJhd0NvdW50XSA9IGluc3RhbmNlQ291bnQ7XG4gICAgICBkcmF3Q291bnQrKztcbiAgICB9XG5cbiAgICBpZiAoZHJhd0NvdW50ID49IDIpIHtcbiAgICAgIGlmIChpbmRleGVkKSB7XG4gICAgICAgIGdsdy5tdWx0aURyYXdFbGVtZW50c0luc3RhbmNlZChcbiAgICAgICAgICBkZWZlcnJlZC5tb2RlLFxuICAgICAgICAgIGNvdW50cyxcbiAgICAgICAgICAwLFxuICAgICAgICAgIGdsLlVOU0lHTkVEX0lOVCxcbiAgICAgICAgICBvZmZzZXRzLFxuICAgICAgICAgIDAsXG4gICAgICAgICAgaW5zdGFuY2VDb3VudHMsXG4gICAgICAgICAgMCxcbiAgICAgICAgICBkcmF3Q291bnRcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGdsdy5tdWx0aURyYXdBcnJheXNJbnN0YW5jZWQoZGVmZXJyZWQubW9kZSwgZmlyc3RzLCAwLCB2ZXJ0ZXhDb3VudHMsIDAsIGluc3RhbmNlQ291bnRzLCAwLCBkcmF3Q291bnQpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZHJhd0NvdW50ID09PSAxKSB7XG4gICAgICBpZiAoaW5kZXhlZCkge1xuICAgICAgICBnbC5kcmF3RWxlbWVudHNJbnN0YW5jZWQoZGVmZXJyZWQubW9kZSwgY291bnRzWzBdLCBnbC5VTlNJR05FRF9JTlQsIG9mZnNldHNbMF0sIGluc3RhbmNlQ291bnRzWzBdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGdsLmRyYXdBcnJheXNJbnN0YW5jZWQoZGVmZXJyZWQubW9kZSwgZmlyc3RzWzBdLCB2ZXJ0ZXhDb3VudHNbMF0sIGluc3RhbmNlQ291bnRzWzBdKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCByZW5kZXJpbmcgaW1wbGVtZW50YXRpb24gZm9yIGluZGl2aWR1YWwgcHJpbWl0aXZlcy5cbiAgICogVGhpcyBtZXRob2QgaGFuZGxlcyB0aGUgY29tcGxldGUgcmVuZGVyaW5nIHBpcGVsaW5lIGZvciBhIHNpbmdsZSBwcmltaXRpdmUsXG4gICAqIGluY2x1ZGluZyBzaGFkZXIgc2V0dXAsIG1hdGVyaWFsIGNvbmZpZ3VyYXRpb24sIGFuZCBkcmF3IGNhbGxzLlxuICAgKlxuICAgKiBAcGFyYW0gcHJpbWl0aXZlVWlkIC0gVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIHByaW1pdGl2ZSB0byByZW5kZXJcbiAgICogQHBhcmFtIGdsdyAtIFRoZSBXZWJHTCBjb250ZXh0IHdyYXBwZXJcbiAgICogQHBhcmFtIHJlbmRlclBhc3MgLSBUaGUgY3VycmVudCByZW5kZXIgcGFzcyBjb25maWd1cmF0aW9uXG4gICAqIEBwYXJhbSBpc1ZSTWFpblBhc3MgLSBXaGV0aGVyIHRoaXMgaXMgYSBWUiBtYWluIHJlbmRlcmluZyBwYXNzXG4gICAqIEBwYXJhbSBkaXNwbGF5Q291bnQgLSBOdW1iZXIgb2YgZGlzcGxheXMgdG8gcmVuZGVyIHRvICgxIGZvciBub3JtYWwsIDIgZm9yIHN0ZXJlbyBWUilcbiAgICogQHJldHVybnMgdHJ1ZSBpZiB0aGUgcHJpbWl0aXZlIHdhcyBzdWNjZXNzZnVsbHkgcmVuZGVyZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCBwZXJmb3JtcyB0aGUgZm9sbG93aW5nIG9wZXJhdGlvbnM6XG4gICAqIC0gVmFsaWRhdGVzIHRoZSBwcmltaXRpdmUgYW5kIHJldHJpZXZlcyBhc3NvY2lhdGVkIG1lc2ggYW5kIG1hdGVyaWFsXG4gICAqIC0gU2V0cyB1cCBzaGFkZXIgcHJvZ3JhbSBpZiBuZWVkZWQgKHdpdGggY2FjaGluZyBmb3IgcGVyZm9ybWFuY2UpXG4gICAqIC0gQ29uZmlndXJlcyB2ZXJ0ZXggZGF0YSBhbmQgVkFPL1ZCTyBiaW5kaW5nc1xuICAgKiAtIFNldHMgbWF0ZXJpYWwgcGFyYW1ldGVycyBhbmQgdW5pZm9ybXNcbiAgICogLSBIYW5kbGVzIHBlci1kaXNwbGF5IHJlbmRlcmluZyBmb3IgVlIgc3RlcmVvXG4gICAqIC0gRXhlY3V0ZXMgZHJhdyBjYWxscyAoaW5zdGFuY2VkIHJlbmRlcmluZyBmb3IgbXVsdGlwbGUgbWVzaCBlbnRpdGllcylcbiAgICpcbiAgICogVGhlIG1ldGhvZCBvcHRpbWl6ZXMgcGVyZm9ybWFuY2UgYnkgY2FjaGluZyBzaGFkZXIgcHJvZ3JhbXMgYW5kIG1hdGVyaWFsc1xuICAgKiBiZXR3ZWVuIGRyYXcgY2FsbHMgYW5kIG9ubHkgdXBkYXRpbmcgR1BVIHN0YXRlIHdoZW4gbmVjZXNzYXJ5LlxuICAgKi9cbiAgcHJpdmF0ZSBfX3JlbmRlcklubmVyKFxuICAgIHByaW1pdGl2ZVVpZDogUHJpbWl0aXZlVUlELFxuICAgIGdsdzogV2ViR0xDb250ZXh0V3JhcHBlcixcbiAgICByZW5kZXJQYXNzOiBSZW5kZXJQYXNzLFxuICAgIGlzVlJNYWluUGFzczogYm9vbGVhbixcbiAgICBkaXNwbGF5Q291bnQ6IG51bWJlcixcbiAgICBkZWZlcnJlZERyYXc/OiBEZWZlcnJlZE11bHRpRHJhdyxcbiAgICBwcmltaXRpdmVBcmc/OiBQcmltaXRpdmVcbiAgKSB7XG4gICAgY29uc3QgZ2wgPSBnbHcuZ2V0UmF3Q29udGV4dEFzV2ViR0wyKCk7XG4gICAgY29uc3QgcHJpbWl0aXZlID0gcHJpbWl0aXZlQXJnID8/IFByaW1pdGl2ZS5nZXRQcmltaXRpdmUocHJpbWl0aXZlVWlkKTtcbiAgICBpZiAocHJpbWl0aXZlID09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgbWVzaCA9IHByaW1pdGl2ZS5tZXNoIGFzIE1lc2g7XG4gICAgY29uc3QgZW50aXR5ID0gbWVzaC5tZXNoRW50aXRpZXNJbm5lclswXTsgLy8gZ2V0IGJhc2UgbWVzaCBmb3IgaW5zdGFuY2luZyBkcmF3XG4gICAgLy8gc2V0dXAgc2hhZGVyIHByb2dyYW1cbiAgICBjb25zdCBtYXRlcmlhbDogTWF0ZXJpYWwgPSByZW5kZXJQYXNzLmdldEFwcHJvcHJpYXRlTWF0ZXJpYWwocHJpbWl0aXZlKTtcbiAgICBzZXR1cFNoYWRlclByb2dyYW0obWF0ZXJpYWwsIHByaW1pdGl2ZSwgdGhpcyk7XG5cbiAgICBjb25zdCBtZXNoUmVuZGVyZXJDb21wb25lbnQgPSBlbnRpdHkuZ2V0TWVzaFJlbmRlcmVyKCkhO1xuXG4gICAgLy8gUGVyLWluc3RhbmNlIGN1bGxpbmc6IGRyYXcgb25seSB0aGUgaW5zdGFuY2VzIHRoYXQgd2VyZSBub3QgY3VsbGVkIGluIHRoaXMgcmVuZGVyIHBhc3MuXG4gICAgLy8gV2l0aG91dCB0aGlzLCBldmVyeSBpbnN0YW5jZSBzaGFyaW5nIHRoZSBtZXNoIGlzIHNraW5uZWQgYW5kIHJhc3Rlcml6ZWQgZXZlbiB3aGVuIGl0IGlzXG4gICAgLy8gb3V0c2lkZSB0aGUgdmlldyBmcnVzdHVtLCB3aGljaCBkb21pbmF0ZXMgdGhlIEdQVSB0aW1lIG9mIGNyb3dkIHNjZW5lcy5cbiAgICBjb25zdCBpbnN0YW5jZUN1bGxpbmdTdGF0ZSA9IE1lc2hSZW5kZXJlckNvbXBvbmVudC5fZ2V0SW5zdGFuY2VDdWxsaW5nU3RhdGUocmVuZGVyUGFzcyk7XG4gICAgY29uc3QgaW5zdGFuY2VDb3VudCA9IG1lc2guX3BhY2tWaXNpYmxlSW5zdGFuY2VzVG9WYXJpYXRpb25WQk8oXG4gICAgICBpbnN0YW5jZUN1bGxpbmdTdGF0ZT8uY3VsbGVkRW50aXR5U3RhbXAsXG4gICAgICBpbnN0YW5jZUN1bGxpbmdTdGF0ZT8uY3VsbFRpY2sgPz8gMFxuICAgICk7XG4gICAgaWYgKGluc3RhbmNlQ291bnQgPT09IDApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBwcmltaXRpdmVJbmRleCA9IG1lc2guZ2V0UHJpbWl0aXZlSW5kZXhJbk1lc2gocHJpbWl0aXZlKTtcbiAgICB0aGlzLmF0dGFjaFZlcnRleERhdGFJbm5lcihtZXNoLCBwcmltaXRpdmUsIHByaW1pdGl2ZUluZGV4LCBnbHcsIG1lc2guX3ZhcmlhdGlvblZCT1VpZCk7XG4gICAgaWYgKHRoaXMuX191c2VNYXRlcmlhbFNpZEF0dHJpYnV0ZShnbHcpKSB7XG4gICAgICB0aGlzLl9fYmluZE11bHRpRHJhd1ZlcnRleERhdGFGb3JNYXRlcmlhbChwcmltaXRpdmUsIG1hdGVyaWFsLCBnbHcpO1xuICAgIH1cblxuICAgIGxldCBmaXJzdFRpbWVGb3JTaGFkZXJQcm9ncmFtID0gZmFsc2U7XG4gICAgbGV0IGZpcnN0VGltZUZvck1hdGVyaWFsID0gZmFsc2U7XG4gICAgY29uc3Qgc2hhZGVyUHJvZ3JhbVVpZCA9IG1hdGVyaWFsLmdldFNoYWRlclByb2dyYW1VaWQocHJpbWl0aXZlKTtcbiAgICBpZiAoc2hhZGVyUHJvZ3JhbVVpZCAhPT0gdGhpcy5fX2xhc3RTaGFkZXIgfHwgKGdsIGFzIGFueSkuX19jaGFuZ2VkUHJvZ3JhbSkge1xuICAgICAgaWYgKGlzU2tpcERyYXdpbmcobWF0ZXJpYWwsIHByaW1pdGl2ZSkpIHtcbiAgICAgICAgdGhpcy5kZXR0YWNoVmVydGV4RGF0YShnbHcpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNoYWRlclByb2dyYW0gPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmdldFdlYkdMUmVzb3VyY2Uoc2hhZGVyUHJvZ3JhbVVpZCkhIGFzIFdlYkdMUHJvZ3JhbTtcbiAgICAgIGdsLnVzZVByb2dyYW0oc2hhZGVyUHJvZ3JhbSk7XG4gICAgICAoZ2wgYXMgYW55KS5fX2NoYW5nZWRQcm9ncmFtID0gZmFsc2U7XG4gICAgICAvLyBCaW5kIERhdGFUZXh0dXJlXG4gICAgICB0aGlzLmJpbmREYXRhVGV4dHVyZShnbCwgc2hhZGVyUHJvZ3JhbSk7XG5cbiAgICAgIC8vIGdsLnVuaWZvcm0xaSgoc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLmlzTWFpblZyLCBpc1ZSTWFpblBhc3MgPyAxIDogMCk7IC8vIFZSIE11bHRpVmlldyBpcyBub3Qgc3VwcG9ydGVkIHlldFxuXG4gICAgICB0aGlzLl9fc2hhZGVyUHJvZ3JhbSA9IHNoYWRlclByb2dyYW07XG4gICAgICBmaXJzdFRpbWVGb3JTaGFkZXJQcm9ncmFtID0gdHJ1ZTtcbiAgICAgIGZpcnN0VGltZUZvck1hdGVyaWFsID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX19sYXN0TWF0ZXJpYWw/LmRlcmVmKCkgIT09IG1hdGVyaWFsKSB7XG4gICAgICBmaXJzdFRpbWVGb3JNYXRlcmlhbCA9IHRydWU7XG4gICAgICB0aGlzLl9fbGFzdE1hdGVyaWFsID0gbmV3IFdlYWtSZWYobWF0ZXJpYWwpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX2xhc3RNYXRlcmlhbFN0YXRlVmVyc2lvbiAhPT0gbWF0ZXJpYWwuc3RhdGVWZXJzaW9uKSB7XG4gICAgICBmaXJzdFRpbWVGb3JNYXRlcmlhbCA9IHRydWU7XG4gICAgICB0aGlzLl9fbGFzdE1hdGVyaWFsU3RhdGVWZXJzaW9uID0gbWF0ZXJpYWwuc3RhdGVWZXJzaW9uO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9fdXNlTWF0ZXJpYWxTaWRBdHRyaWJ1dGUoZ2x3KSAmJiB0aGlzLl9fc2hhZGVyUHJvZ3JhbSAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9fc2V0SW5zdGFuY2VSZW1hcElkZW50aXR5KGdsLCB0aGlzLl9fc2hhZGVyUHJvZ3JhbSk7XG4gICAgICB0aGlzLl9fc2V0SW5zdGFuY2VTaWREYXRhVGV4dHVyZUluZGljZXMoZ2wsIHRoaXMuX19zaGFkZXJQcm9ncmFtKTtcbiAgICB9XG5cbiAgICBjb25zdCByZW5kZXJpbmdBcmc6IFJlbmRlcmluZ0FyZ1dlYkdMID0ge1xuICAgICAgZ2x3OiBnbHcsXG4gICAgICBlbnRpdHk6IGVudGl0eSxcbiAgICAgIHdvcmxkTWF0cml4OiBlbnRpdHkuZ2V0U2NlbmVHcmFwaCgpIS5tYXRyaXhJbm5lcixcbiAgICAgIG5vcm1hbE1hdHJpeDogZW50aXR5LmdldFNjZW5lR3JhcGgoKSEubm9ybWFsTWF0cml4SW5uZXIsXG4gICAgICBpc0JpbGxib2FyZDogZW50aXR5LmdldFNjZW5lR3JhcGgoKS5pc0JpbGxib2FyZCxcbiAgICAgIGlzVmlzaWJsZTogZW50aXR5LmdldFNjZW5lR3JhcGgoKS5pc1Zpc2libGUsXG4gICAgICBsaWdodENvbXBvbmVudHM6IHRoaXMuX19saWdodENvbXBvbmVudHMhLFxuICAgICAgcmVuZGVyUGFzczogcmVuZGVyUGFzcyxcbiAgICAgIHByaW1pdGl2ZTogcHJpbWl0aXZlLFxuICAgICAgZGlmZnVzZUN1YmU6IG1lc2hSZW5kZXJlckNvbXBvbmVudC5kaWZmdXNlQ3ViZU1hcCxcbiAgICAgIHNwZWN1bGFyQ3ViZTogbWVzaFJlbmRlcmVyQ29tcG9uZW50LnNwZWN1bGFyQ3ViZU1hcCEsXG4gICAgICBzaGVlbkN1YmU6IG1lc2hSZW5kZXJlckNvbXBvbmVudC5zaGVlbkN1YmVNYXAsXG4gICAgICBpc1ZyOiBpc1ZSTWFpblBhc3MsXG4gICAgICBkaXNwbGF5SWR4OiAtMSxcbiAgICB9O1xuXG4gICAgaWYgKGZpcnN0VGltZUZvclNoYWRlclByb2dyYW0pIHtcbiAgICAgIG1hdGVyaWFsLl9zZXRQYXJhbWV0ZXJzVG9HcHVXZWJHTFBlclNoYWRlclByb2dyYW0oe1xuICAgICAgICBlbmdpbmU6IHRoaXMuX19lbmdpbmUsXG4gICAgICAgIG1hdGVyaWFsLFxuICAgICAgICBzaGFkZXJQcm9ncmFtOiB0aGlzLl9fc2hhZGVyUHJvZ3JhbSEsXG4gICAgICAgIGZpcnN0VGltZTogZmlyc3RUaW1lRm9yU2hhZGVyUHJvZ3JhbSxcbiAgICAgICAgYXJnczogcmVuZGVyaW5nQXJnLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGZpcnN0VGltZUZvck1hdGVyaWFsKSB7XG4gICAgICB0aGlzLl9fc2V0Q3VycmVudENvbXBvbmVudFNJRHNGb3JFYWNoUHJpbWl0aXZlKGdsLCBtYXRlcmlhbCwgdGhpcy5fX3NoYWRlclByb2dyYW0hKTtcblxuICAgICAgV2ViR0xTdHJhdGVneUNvbW1vbk1ldGhvZC5zZXRXZWJHTFBhcmFtZXRlcnModGhpcy5fX2VuZ2luZSwgbWF0ZXJpYWwsIGdsKTtcblxuICAgICAgbWF0ZXJpYWwuX3NldFBhcmFtZXRlcnNUb0dwdVdlYkdMKHtcbiAgICAgICAgZW5naW5lOiB0aGlzLl9fZW5naW5lLFxuICAgICAgICBtYXRlcmlhbDogbWF0ZXJpYWwsXG4gICAgICAgIHNoYWRlclByb2dyYW06IHRoaXMuX19zaGFkZXJQcm9ncmFtISxcbiAgICAgICAgZmlyc3RUaW1lOiBmaXJzdFRpbWVGb3JNYXRlcmlhbCxcbiAgICAgICAgYXJnczogcmVuZGVyaW5nQXJnLFxuICAgICAgfSk7XG4gICAgfVxuICAgIG1hdGVyaWFsLl9zZXRQYXJhbWV0ZXJzVG9HcHVXZWJHTFBlclByaW1pdGl2ZSh7XG4gICAgICBtYXRlcmlhbDogbWF0ZXJpYWwsXG4gICAgICBzaGFkZXJQcm9ncmFtOiB0aGlzLl9fc2hhZGVyUHJvZ3JhbSEsXG4gICAgICBmaXJzdFRpbWU6IGZpcnN0VGltZUZvck1hdGVyaWFsLFxuICAgICAgYXJnczogcmVuZGVyaW5nQXJnLFxuICAgIH0pO1xuXG4gICAgZm9yIChsZXQgZGlzcGxheUlkeCA9IDA7IGRpc3BsYXlJZHggPCBkaXNwbGF5Q291bnQ7IGRpc3BsYXlJZHgrKykge1xuICAgICAgaWYgKGlzVlJNYWluUGFzcykge1xuICAgICAgICBXZWJHTFN0cmF0ZWd5Q29tbW9uTWV0aG9kLnNldFZSVmlld3BvcnQodGhpcy5fX2VuZ2luZSwgcmVuZGVyUGFzcywgZGlzcGxheUlkeCk7XG4gICAgICB9XG4gICAgICB0aGlzLl9fc2V0Q3VycmVudENvbXBvbmVudFNJRHNGb3JFYWNoRGlzcGxheUlkeChyZW5kZXJQYXNzLCBkaXNwbGF5SWR4IGFzIDAgfCAxLCBpc1ZSTWFpblBhc3MpO1xuXG4gICAgICB0aGlzLl9fdXBsb2FkQ3VycmVudENvbXBvbmVudFNJRHMoZ2wsIHRoaXMuX19zaGFkZXJQcm9ncmFtISk7XG4gICAgICB0aGlzLl9fdXBsb2FkTGlnaHRDbHVzdGVyVmlldyhnbCwgdGhpcy5fX3NoYWRlclByb2dyYW0hKTtcblxuICAgICAgaWYgKCh0aGlzLl9fc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLnZyU3RhdGUgIT0gbnVsbCAmJiBpc1ZSTWFpblBhc3MgJiYgZGlzcGxheUNvdW50ID4gMSkge1xuICAgICAgICBjb25zdCB2clN0YXRlID0gdGhpcy5fX2VuZ2luZS5nbG9iYWxEYXRhUmVwb3NpdG9yeS5nZXRWYWx1ZSgndnJTdGF0ZScsIDApIGFzIFZlY3RvcjI7XG4gICAgICAgIHZyU3RhdGUuX3ZbMF0gPSBpc1ZSTWFpblBhc3MgPyAxIDogMDtcbiAgICAgICAgdnJTdGF0ZS5fdlsxXSA9IGRpc3BsYXlJZHg7XG4gICAgICAgICh0aGlzLl9fc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLl9nbC51bmlmb3JtMml2KCh0aGlzLl9fc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLnZyU3RhdGUsIHZyU3RhdGUuX3YpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB1c2VJbnN0YW5jZVNpZFRleHR1cmUgPVxuICAgICAgICB0aGlzLl9fZW5naW5lLmNvbmZpZy5pc011bHRpRHJhd0VuYWJsZWQgJiZcbiAgICAgICAgZ2x3LndlYmdsMkV4dE1EICE9IG51bGwgJiZcbiAgICAgICAgdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5pbnN0YW5jZVNpZFRhYmxlLmlzU3VwcG9ydGVkO1xuICAgICAgaWYgKHVzZUluc3RhbmNlU2lkVGV4dHVyZSAmJiBwcmltaXRpdmUuX211bHRpRHJhd0dyb3VwID09IG51bGwpIHtcbiAgICAgICAgLy8gQSBncm91cGVkIHByaW1pdGl2ZSBkcmF3cyB3aXRoIHRoZSBtdWx0aS1kcmF3IGdyb3VwIFZBTywgd2hpY2ggZW5hYmxlcyB0aGVcbiAgICAgICAgLy8gcGVyLXZlcnRleCBpbnN0YW5jZUJhc2UgYXR0cmlidXRlLCBzbyB0aGUgZ2VuZXJpYyB2YWx1ZSB3b3VsZCBiZSBpZ25vcmVkLlxuICAgICAgICAvLyBPbmx5IHRoZSBsZWdhY3kgVkFPIG5lZWRzIGl0IChpdHMgaW5zdGFuY2UgYXR0cmlidXRlIGlzIGRpc2FibGVkKS5cbiAgICAgICAgLy8gVGhlIHNoYWRlciBhZGRzIGdsX0luc3RhbmNlSUQgYW5kIHJlc29sdmVzIHRoZSB2aXNpYmxlIGluc3RhbmNlIHRocm91Z2ggdGhlIHJlbWFwIHRhYmxlLlxuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJJNHVpKFZlcnRleEF0dHJpYnV0ZS5JbnN0YW5jZS5nZXRBdHRyaWJ1dGVTbG90KCksIE1hdGgubWF4KDAsIG1lc2guX2luc3RhbmNlU2lkQmFzZSksIDAsIDAsIDApO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpbmRpY2VzQWNjZXNzb3IgPSBwcmltaXRpdmUuaW5kaWNlc0FjY2Vzc29yO1xuICAgICAgY29uc3QgaW5kZXhlZCA9IGluZGljZXNBY2Nlc3NvciAhPSBudWxsO1xuICAgICAgY29uc3QgaW5kZXhCaXRTaXplID0gcHJpbWl0aXZlLmdldFJlbmRlckluZGV4Qml0U2l6ZSgpO1xuICAgICAgY29uc3QgaW5kZXhUeXBlID0gaW5kZXhCaXRTaXplID09PSAndWludDMyJyA/IGdsLlVOU0lHTkVEX0lOVCA6IGdsLlVOU0lHTkVEX1NIT1JUO1xuICAgICAgY29uc3QgbXVsdGlEcmF3RW50cnkgPSBwcmltaXRpdmUuX211bHRpRHJhd0VudHJ5O1xuICAgICAgY29uc3QgaW5kZXhCeXRlT2Zmc2V0ID0gbXVsdGlEcmF3RW50cnk/LmluZGV4Qnl0ZU9mZnNldCA/PyAwO1xuICAgICAgY29uc3QgZmlyc3RWZXJ0ZXggPSBtdWx0aURyYXdFbnRyeT8udmVydGV4T2Zmc2V0ID8/IDA7XG5cbiAgICAgIGlmIChkZWZlcnJlZERyYXcgIT0gbnVsbCkge1xuICAgICAgICBkZWZlcnJlZERyYXcucHJpbWl0aXZlID0gcHJpbWl0aXZlO1xuICAgICAgICBkZWZlcnJlZERyYXcubWVzaCA9IG1lc2g7XG4gICAgICAgIGRlZmVycmVkRHJhdy5pbmRleGVkID0gaW5kZXhlZDtcbiAgICAgICAgZGVmZXJyZWREcmF3Lm1vZGUgPSBwcmltaXRpdmUucHJpbWl0aXZlTW9kZS5pbmRleDtcbiAgICAgICAgZGVmZXJyZWREcmF3LmluZGV4Qml0U2l6ZSA9IGluZGV4Qml0U2l6ZTtcbiAgICAgICAgZGVmZXJyZWREcmF3LmNvdW50ID0gaW5kZXhlZCA/IGluZGljZXNBY2Nlc3NvciEuZWxlbWVudENvdW50IDogcHJpbWl0aXZlLmdldFZlcnRleENvdW50QXNWZXJ0aWNlc0Jhc2VkKCk7XG4gICAgICAgIGRlZmVycmVkRHJhdy5vZmZzZXQgPSBpbmRleGVkID8gaW5kZXhCeXRlT2Zmc2V0IDogZmlyc3RWZXJ0ZXg7XG4gICAgICAgIGRlZmVycmVkRHJhdy5pbnN0YW5jZUNvdW50ID0gaW5zdGFuY2VDb3VudDtcbiAgICAgIH0gZWxzZSBpZiAoaW5kZXhlZCkge1xuICAgICAgICBnbC5kcmF3RWxlbWVudHNJbnN0YW5jZWQoXG4gICAgICAgICAgcHJpbWl0aXZlLnByaW1pdGl2ZU1vZGUuaW5kZXgsXG4gICAgICAgICAgaW5kaWNlc0FjY2Vzc29yIS5lbGVtZW50Q291bnQsXG4gICAgICAgICAgaW5kZXhUeXBlLFxuICAgICAgICAgIGluZGV4Qnl0ZU9mZnNldCxcbiAgICAgICAgICBpbnN0YW5jZUNvdW50XG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBnbC5kcmF3QXJyYXlzSW5zdGFuY2VkKFxuICAgICAgICAgIHByaW1pdGl2ZS5wcmltaXRpdmVNb2RlLmluZGV4LFxuICAgICAgICAgIGZpcnN0VmVydGV4LFxuICAgICAgICAgIHByaW1pdGl2ZS5nZXRWZXJ0ZXhDb3VudEFzVmVydGljZXNCYXNlZCgpLFxuICAgICAgICAgIGluc3RhbmNlQ291bnRcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9fbGFzdFNoYWRlciA9IHNoYWRlclByb2dyYW1VaWQ7XG4gICAgLy8gVGhlIFZBTyBpcyBsZWZ0IGJvdW5kIG9uIHB1cnBvc2U6IHVuYmluZGluZyBpdCBhZnRlciBldmVyeSBkcmF3IGlzc3VlZCB0aHJlZSBleHRyYSBHTCBjYWxsc1xuICAgIC8vIHBlciBkcmF3LiBUaGUgbmV4dCBkcmF3IGJpbmRzIGl0cyBvd24gVkFPLCBhbmQgY29tbW9uXyRyZW5kZXIoKSBkZXRhY2hlcyBvbmNlIGF0IHRoZSBlbmQuXG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGxvYWRzIHRoZSBsaWdodCBjbHVzdGVyIHZpZXcgb2YgdGhlIGNhbWVyYSBvZiB0aGUgZHJhdyAoYHVfbGlnaHRDbHVzdGVyVmlld2ApIHdoZW4gdGhlIHByb2dyYW0gdXNlcyBpdCBhbmRcbiAgICogdGhlIGNhbWVyYSBvciB0aGUgbGlnaHQgY2x1c3RlciBkYXRhIGNoYW5nZWQgc2luY2UgdGhlIGxhc3QgdXBsb2FkIHRvIHRoZSBwcm9ncmFtLlxuICAgKlxuICAgKiBUaGUgNyB2ZWM0IGFyZSBbaGVhZGVyICg2IHZlYzQpXVsodmlldyB2ZWM0IGluZGV4LCAwLCAwLCAwKV0sIG9yIGEgdmlldyBpbmRleCBvZiAtMSB3aGVuIHRoZSBjYW1lcmEgaGFzIG5vXG4gICAqIGNsdXN0ZXJzLiBVbmlmb3JtIHZhbHVlcyBwZXJzaXN0IGluIHRoZSBwcm9ncmFtIG9iamVjdCwgc28gY29uc2VjdXRpdmUgZHJhd3Mgb2YgdGhlIHNhbWUgY2FtZXJhIHNraXAgdGhlXG4gICAqIHVwbG9hZDsgdGhlIGNoZWNrIGtlZXBzIHRoZSBwZXItZHJhdyBjb3N0IHRvIGEgY29tcGFyaXNvbiBpbiB0aGUgY29tbW9uIGNhc2UuXG4gICAqL1xuICBwcml2YXRlIF9fdXBsb2FkTGlnaHRDbHVzdGVyVmlldyhnbDogV2ViR0xSZW5kZXJpbmdDb250ZXh0IHwgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCwgc2hhZGVyUHJvZ3JhbTogV2ViR0xQcm9ncmFtKSB7XG4gICAgY29uc3QgcHJvZ3JhbSA9IHNoYWRlclByb2dyYW0gYXMgYW55O1xuICAgIGNvbnN0IGxvY2F0aW9uID0gcHJvZ3JhbS5saWdodENsdXN0ZXJWaWV3IGFzIFdlYkdMVW5pZm9ybUxvY2F0aW9uIHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgICBpZiAobG9jYXRpb24gPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBjYW1lcmFTaWQgPSB0aGlzLl9fY3VycmVudENvbXBvbmVudFNJRHMhLl92W1dlbGxLbm93bkNvbXBvbmVudFRJRHMuQ2FtZXJhQ29tcG9uZW50VElEXTtcbiAgICBjb25zdCBsaWdodENsdXN0ZXJTeXN0ZW0gPSB0aGlzLl9fZW5naW5lLmxpZ2h0Q2x1c3RlclN5c3RlbTtcbiAgICBjb25zdCB2ZXJzaW9uID0gbGlnaHRDbHVzdGVyU3lzdGVtLmRhdGFWZXJzaW9uO1xuICAgIGlmIChwcm9ncmFtLl9saWdodENsdXN0ZXJWaWV3Q2FtZXJhU2lkID09PSBjYW1lcmFTaWQgJiYgcHJvZ3JhbS5fbGlnaHRDbHVzdGVyVmlld1ZlcnNpb24gPT09IHZlcnNpb24pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZ2wudW5pZm9ybTRmdihsb2NhdGlvbiwgbGlnaHRDbHVzdGVyU3lzdGVtLl9nZXRWaWV3VW5pZm9ybURhdGEoY2FtZXJhU2lkKSk7XG4gICAgcHJvZ3JhbS5fbGlnaHRDbHVzdGVyVmlld0NhbWVyYVNpZCA9IGNhbWVyYVNpZDtcbiAgICBwcm9ncmFtLl9saWdodENsdXN0ZXJWaWV3VmVyc2lvbiA9IHZlcnNpb247XG4gIH1cblxuICAvKipcbiAgICogVXBsb2FkcyB0aGUgY3VycmVudENvbXBvbmVudFNJRHMgdW5pZm9ybSB1bmxlc3MgdGhlIHNhbWUgdmFsdWVzIHdlcmUgYWxyZWFkeSB1cGxvYWRlZCB0byB0aGVcbiAgICogc2FtZSBwcm9ncmFtIGJ5IHRoZSBwcmV2aW91cyB1cGxvYWQuIFVuaWZvcm0gdmFsdWVzIHBlcnNpc3QgaW4gdGhlIHByb2dyYW0gb2JqZWN0LCBzb1xuICAgKiBjb25zZWN1dGl2ZSBkcmF3cyBvZiB0aGUgc2FtZSBtYXRlcmlhbCAoZS5nLiBhIHNoYWRvdyBwYXNzKSBkbyBub3QgbmVlZCB0byB1cGxvYWQgYWdhaW4uXG4gICAqL1xuICBwcml2YXRlIF9fdXBsb2FkQ3VycmVudENvbXBvbmVudFNJRHMoXG4gICAgZ2w6IFdlYkdMUmVuZGVyaW5nQ29udGV4dCB8IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQsXG4gICAgc2hhZGVyUHJvZ3JhbTogV2ViR0xQcm9ncmFtXG4gICkge1xuICAgIGNvbnN0IHZhbHVlcyA9IHRoaXMuX19jdXJyZW50Q29tcG9uZW50U0lEcyEuX3YgYXMgRmxvYXQzMkFycmF5O1xuICAgIGxldCBsYXN0VmFsdWVzID0gdGhpcy5fX2xhc3RVcGxvYWRlZENvbXBvbmVudFNJRHM7XG4gICAgaWYgKFxuICAgICAgdGhpcy5fX2xhc3RDb21wb25lbnRTSURzUHJvZ3JhbSA9PT0gc2hhZGVyUHJvZ3JhbSAmJlxuICAgICAgbGFzdFZhbHVlcyAhPSBudWxsICYmXG4gICAgICBsYXN0VmFsdWVzLmxlbmd0aCA9PT0gdmFsdWVzLmxlbmd0aFxuICAgICkge1xuICAgICAgbGV0IGlzU2FtZSA9IHRydWU7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAobGFzdFZhbHVlc1tpXSAhPT0gdmFsdWVzW2ldKSB7XG4gICAgICAgICAgaXNTYW1lID0gZmFsc2U7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChpc1NhbWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICBnbC51bmlmb3JtMWZ2KChzaGFkZXJQcm9ncmFtIGFzIGFueSkuY3VycmVudENvbXBvbmVudFNJRHMsIHZhbHVlcyk7XG4gICAgaWYgKGxhc3RWYWx1ZXMgPT0gbnVsbCB8fCBsYXN0VmFsdWVzLmxlbmd0aCAhPT0gdmFsdWVzLmxlbmd0aCkge1xuICAgICAgbGFzdFZhbHVlcyA9IG5ldyBGbG9hdDMyQXJyYXkodmFsdWVzLmxlbmd0aCk7XG4gICAgICB0aGlzLl9fbGFzdFVwbG9hZGVkQ29tcG9uZW50U0lEcyA9IGxhc3RWYWx1ZXM7XG4gICAgfVxuICAgIGxhc3RWYWx1ZXMuc2V0KHZhbHVlcyk7XG4gICAgdGhpcy5fX2xhc3RDb21wb25lbnRTSURzUHJvZ3JhbSA9IHNoYWRlclByb2dyYW07XG4gIH1cblxuICAvKipcbiAgICogQmluZHMgdGhlIGRhdGEgdGV4dHVyZSB0byB0aGUgV2ViR0wgY29udGV4dCBmb3Igc2hhZGVyIGFjY2Vzcy5cbiAgICogVGhpcyBtZXRob2Qgc2V0cyB1cCB0aGUgdGV4dHVyZSBiaW5kaW5nIGFuZCBzYW1wbGVyIGNvbmZpZ3VyYXRpb25cbiAgICogdGhhdCBhbGxvd3Mgc2hhZGVycyB0byBhY2Nlc3MgdGhlIGRhdGEgdGV4dHVyZS5cbiAgICpcbiAgICogQHBhcmFtIGdsIC0gVGhlIFdlYkdMIHJlbmRlcmluZyBjb250ZXh0XG4gICAqIEBwYXJhbSBzaGFkZXJQcm9ncmFtIC0gVGhlIHNoYWRlciBwcm9ncmFtIHRoYXQgd2lsbCBhY2Nlc3MgdGhlIGRhdGEgdGV4dHVyZVxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCBwZXJmb3JtcyB0aGUgZm9sbG93aW5nIG9wZXJhdGlvbnM6XG4gICAqIC0gU2V0cyB0aGUgZGF0YSB0ZXh0dXJlIHVuaWZvcm0gdG8gdGV4dHVyZSB1bml0IDBcbiAgICogLSBCaW5kcyB0aGUgZGF0YSB0ZXh0dXJlIHRvIHRleHR1cmUgdW5pdCAwXG4gICAqIC0gQ3JlYXRlcyBhbmQgYmluZHMgYSByZXBlYXQvbmVhcmVzdCBzYW1wbGVyIGZvciBvcHRpbWFsIGRhdGEgdGV4dHVyZSBhY2Nlc3NcbiAgICpcbiAgICogVGV4dHVyZSB1bml0IDAgaXMgdXNlZCBhcyBhIGRlZGljYXRlZCBzbG90IGZvciBkYXRhIHRleHR1cmUgYWNjZXNzLlxuICAgKiBPdGhlciBtYXRlcmlhbCB0ZXh0dXJlcyBzaG91bGQgc3RhcnQgZnJvbSB0ZXh0dXJlIHVuaXQgMS5cbiAgICovXG4gIHByaXZhdGUgYmluZERhdGFUZXh0dXJlKGdsOiBXZWJHTFJlbmRlcmluZ0NvbnRleHQgfCBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LCBzaGFkZXJQcm9ncmFtOiBXZWJHTFByb2dyYW0pIHtcbiAgICBnbC51bmlmb3JtMWkoKHNoYWRlclByb2dyYW0gYXMgYW55KS5kYXRhVGV4dHVyZSwgMCk7XG4gICAgdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5iaW5kVGV4dHVyZTJEKDAsIHRoaXMuX19kYXRhVGV4dHVyZVVpZCk7XG4gICAgY29uc3Qgc2FtcGxlclVpZCA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuY3JlYXRlT3JHZXRUZXh0dXJlU2FtcGxlclJlcGVhdE5lYXJlc3QoKTtcbiAgICB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmJpbmRUZXh0dXJlU2FtcGxlcigwLCBzYW1wbGVyVWlkKTtcbiAgICB0aGlzLmJpbmRJbnN0YW5jZVNpZFRleHR1cmVzKGdsLCBzaGFkZXJQcm9ncmFtKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCaW5kcyB0aGUgZW5naW5lLXdpZGUgaW5zdGFuY2UgU0lEIC8gcmVtYXAgdGV4dHVyZXMgdXNlZCBieSBtdWx0aS1kcmF3IHJlbmRlcmluZy5cbiAgICogVGhlIHRleHR1cmVzIGFyZSBkZWNsYXJlZCBpbiB0aGUgY29tbW9uIHZlcnRleCBzaGFkZXIgaW5jbHVkZSBhbmQgYXJlIG9ubHkgdXNlZFxuICAgKiB3aGVuIFJOX1VTRV9JTlNUQU5DRV9TSURfVEVYVFVSRSBpcyBkZWZpbmVkLlxuICAgKi9cbiAgcHJpdmF0ZSBiaW5kSW5zdGFuY2VTaWRUZXh0dXJlcyhcbiAgICBnbDogV2ViR0xSZW5kZXJpbmdDb250ZXh0IHwgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCxcbiAgICBzaGFkZXJQcm9ncmFtOiBXZWJHTFByb2dyYW1cbiAgKTogdm9pZCB7XG4gICAgY29uc3Qgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGNvbnN0IGdsdyA9IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmN1cnJlbnRXZWJHTENvbnRleHRXcmFwcGVyO1xuICAgIGlmIChnbHcgPT0gbnVsbCB8fCBnbHcud2ViZ2wyRXh0TUQgPT0gbnVsbCB8fCAhdGhpcy5fX2VuZ2luZS5jb25maWcuaXNNdWx0aURyYXdFbmFibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHRhYmxlID0gd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuaW5zdGFuY2VTaWRUYWJsZTtcbiAgICBpZiAoIXRhYmxlLmlzU3VwcG9ydGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcHJvZ3JhbSA9IHNoYWRlclByb2dyYW0gYXMgYW55O1xuICAgIGlmIChwcm9ncmFtLl9faW5zdGFuY2VTaWRUZXh0dXJlTG9jYXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcHJvZ3JhbS5fX2luc3RhbmNlU2lkRGF0YVRleHR1cmVJbmRleExvY2F0aW9uID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKFxuICAgICAgICBzaGFkZXJQcm9ncmFtLFxuICAgICAgICAndV9pbnN0YW5jZVNpZERhdGFUZXh0dXJlSW5kZXgnXG4gICAgICApO1xuICAgICAgcHJvZ3JhbS5fX2luc3RhbmNlUmVtYXBEYXRhVGV4dHVyZUluZGV4TG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oXG4gICAgICAgIHNoYWRlclByb2dyYW0sXG4gICAgICAgICd1X2luc3RhbmNlUmVtYXBEYXRhVGV4dHVyZUluZGV4J1xuICAgICAgKTtcbiAgICAgIHByb2dyYW0uX19pbnN0YW5jZVJlbWFwSWRlbnRpdHlMb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCAndV9pbnN0YW5jZVJlbWFwSWRlbnRpdHknKTtcbiAgICAgIC8vIEtlZXAgdGhlIG9sZCBwcm9wZXJ0eSBuYW1lIGRlZmluZWQgc28gdGhlIG9uZS10aW1lIGxvY2F0aW9uIGxvb2t1cCBpcyBub3QgcmVwZWF0ZWQuXG4gICAgICBwcm9ncmFtLl9faW5zdGFuY2VTaWRUZXh0dXJlTG9jYXRpb24gPSBudWxsO1xuICAgIH1cbiAgICBpZiAocHJvZ3JhbS5fX2luc3RhbmNlU2lkRGF0YVRleHR1cmVJbmRleExvY2F0aW9uICE9IG51bGwpIHtcbiAgICAgIGdsLnVuaWZvcm0xaShwcm9ncmFtLl9faW5zdGFuY2VTaWREYXRhVGV4dHVyZUluZGV4TG9jYXRpb24sIHRoaXMuX19pbnN0YW5jZVNpZEJhc2VWZWM0KTtcbiAgICAgIHByb2dyYW0uX19pbnN0YW5jZVNpZERhdGFUZXh0dXJlSW5kZXhWYWx1ZSA9IHRoaXMuX19pbnN0YW5jZVNpZEJhc2VWZWM0O1xuICAgIH1cbiAgICBpZiAocHJvZ3JhbS5fX2luc3RhbmNlUmVtYXBEYXRhVGV4dHVyZUluZGV4TG9jYXRpb24gIT0gbnVsbCkge1xuICAgICAgZ2wudW5pZm9ybTFpKHByb2dyYW0uX19pbnN0YW5jZVJlbWFwRGF0YVRleHR1cmVJbmRleExvY2F0aW9uLCB0aGlzLl9faW5zdGFuY2VSZW1hcEJhc2VWZWM0KTtcbiAgICAgIHByb2dyYW0uX19pbnN0YW5jZVJlbWFwRGF0YVRleHR1cmVJbmRleFZhbHVlID0gdGhpcy5fX2luc3RhbmNlUmVtYXBCYXNlVmVjNDtcbiAgICB9XG4gICAgaWYgKHByb2dyYW0uX19pbnN0YW5jZVJlbWFwSWRlbnRpdHlMb2NhdGlvbiAhPSBudWxsKSB7XG4gICAgICBnbC51bmlmb3JtMWkocHJvZ3JhbS5fX2luc3RhbmNlUmVtYXBJZGVudGl0eUxvY2F0aW9uLCB0aGlzLl9faW5zdGFuY2VSZW1hcElkZW50aXR5KTtcbiAgICAgIHByb2dyYW0uX19pbnN0YW5jZVJlbWFwSWRlbnRpdHlWYWx1ZSA9IHRoaXMuX19pbnN0YW5jZVJlbWFwSWRlbnRpdHk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEtlZXBzIHRoZSBkYXRhLXRleHR1cmUgYmFzZSBpbmRpY2VzIG9mIHRoZSBpbnN0YW5jZSB0YWJsZXMgaW4gc3luYyB3aXRoIHRoZVxuICAgKiBjdXJyZW50IHRleHR1cmUgbGF5b3V0LiBUaGUgaW5kaWNlcyBjaGFuZ2Ugd2hlbiB0aGUgZGF0YSB0ZXh0dXJlIGlzIHJlY3JlYXRlZFxuICAgKiAoZS5nLiB0aGUgaW5zdGFuY2Ugc2xvdCBjYXBhY2l0eSBncmV3KSB3aGlsZSB0aGUgc2FtZSBwcm9ncmFtIHN0YXlzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfX3NldEluc3RhbmNlU2lkRGF0YVRleHR1cmVJbmRpY2VzKGdsOiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LCBzaGFkZXJQcm9ncmFtOiBXZWJHTFByb2dyYW0pOiB2b2lkIHtcbiAgICBjb25zdCBwcm9ncmFtID0gc2hhZGVyUHJvZ3JhbSBhcyBhbnk7XG4gICAgaWYgKHByb2dyYW0uX19pbnN0YW5jZVNpZERhdGFUZXh0dXJlSW5kZXhMb2NhdGlvbiA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHNpZEJhc2UgPSB0aGlzLl9faW5zdGFuY2VTaWRCYXNlVmVjNDtcbiAgICBpZiAocHJvZ3JhbS5fX2luc3RhbmNlU2lkRGF0YVRleHR1cmVJbmRleFZhbHVlICE9PSBzaWRCYXNlKSB7XG4gICAgICBnbC51bmlmb3JtMWkocHJvZ3JhbS5fX2luc3RhbmNlU2lkRGF0YVRleHR1cmVJbmRleExvY2F0aW9uLCBzaWRCYXNlKTtcbiAgICAgIHByb2dyYW0uX19pbnN0YW5jZVNpZERhdGFUZXh0dXJlSW5kZXhWYWx1ZSA9IHNpZEJhc2U7XG4gICAgfVxuICAgIGNvbnN0IHJlbWFwQmFzZSA9IHRoaXMuX19pbnN0YW5jZVJlbWFwQmFzZVZlYzQ7XG4gICAgaWYgKHByb2dyYW0uX19pbnN0YW5jZVJlbWFwRGF0YVRleHR1cmVJbmRleFZhbHVlICE9PSByZW1hcEJhc2UpIHtcbiAgICAgIGdsLnVuaWZvcm0xaShwcm9ncmFtLl9faW5zdGFuY2VSZW1hcERhdGFUZXh0dXJlSW5kZXhMb2NhdGlvbiwgcmVtYXBCYXNlKTtcbiAgICAgIHByb2dyYW0uX19pbnN0YW5jZVJlbWFwRGF0YVRleHR1cmVJbmRleFZhbHVlID0gcmVtYXBCYXNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBLZWVwcyB0aGUgcmVtYXAtaWRlbnRpdHkgdW5pZm9ybSBpbiBzeW5jIHdpdGggdGhlIGN1cnJlbnQgcmVuZGVyIHBhc3MuIFRoZSBjdWxsaW5nXG4gICAqIHN0YXRlIGNhbiBjaGFuZ2UgYmV0d2VlbiBwYXNzZXMgd2hpbGUgdGhlIHNhbWUgc2hhZGVyIHByb2dyYW0gc3RheXMgYm91bmQsIHNvIHRoaXNcbiAgICogaXMgY2hlY2tlZCBiZWZvcmUgZXZlcnkgZHJhdyAoYSBjaGVhcCBwcm9wZXJ0eSBjb21wYXJpc29uIHdoZW4gdW5jaGFuZ2VkKS5cbiAgICovXG4gIHByaXZhdGUgX19zZXRJbnN0YW5jZVJlbWFwSWRlbnRpdHkoZ2w6IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQsIHNoYWRlclByb2dyYW06IFdlYkdMUHJvZ3JhbSk6IHZvaWQge1xuICAgIGNvbnN0IHByb2dyYW0gPSBzaGFkZXJQcm9ncmFtIGFzIGFueTtcbiAgICBpZiAocHJvZ3JhbS5fX2luc3RhbmNlUmVtYXBJZGVudGl0eUxvY2F0aW9uID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgaWRlbnRpdHkgPSB0aGlzLl9faW5zdGFuY2VSZW1hcElkZW50aXR5O1xuICAgIGlmIChwcm9ncmFtLl9faW5zdGFuY2VSZW1hcElkZW50aXR5VmFsdWUgPT09IGlkZW50aXR5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGdsLnVuaWZvcm0xaShwcm9ncmFtLl9faW5zdGFuY2VSZW1hcElkZW50aXR5TG9jYXRpb24sIGlkZW50aXR5KTtcbiAgICBwcm9ncmFtLl9faW5zdGFuY2VSZW1hcElkZW50aXR5VmFsdWUgPSBpZGVudGl0eTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyBhbGwgR1BVIHJlc291cmNlcyBoZWxkIGJ5IHRoaXMgc3RyYXRlZ3kuXG4gICAqIFNob3VsZCBiZSBjYWxsZWQgd2hlbiB0aGUgZW5naW5lIGlzIGJlaW5nIGRlc3Ryb3llZC5cbiAgICovXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgY29uc3Qgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGlmICh0aGlzLl9fZGF0YVRleHR1cmVVaWQgIT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkKSB7XG4gICAgICB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5kZWxldGVUZXh0dXJlKHRoaXMuX19kYXRhVGV4dHVyZVVpZCk7XG4gICAgICB0aGlzLl9fZGF0YVRleHR1cmVVaWQgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX19kYXRhVUJPVWlkICE9PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuZGVsZXRlVW5pZm9ybUJ1ZmZlcih0aGlzLl9fZGF0YVVCT1VpZCk7XG4gICAgICB0aGlzLl9fZGF0YVVCT1VpZCA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX21vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJVaWQgIT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkKSB7XG4gICAgICB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5kZWxldGVVbmlmb3JtQnVmZmVyKHRoaXMuX19tb3JwaE9mZnNldHNVbmlmb3JtQnVmZmVyVWlkKTtcbiAgICAgIHRoaXMuX19tb3JwaE9mZnNldHNVbmlmb3JtQnVmZmVyVWlkID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gICAgfVxuICAgIGlmICh0aGlzLl9fbW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlclVpZCAhPT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQpIHtcbiAgICAgIHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmRlbGV0ZVVuaWZvcm1CdWZmZXIodGhpcy5fX21vcnBoV2VpZ2h0c1VuaWZvcm1CdWZmZXJVaWQpO1xuICAgICAgdGhpcy5fX21vcnBoV2VpZ2h0c1VuaWZvcm1CdWZmZXJVaWQgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgICB9XG4gIH1cblxuICAvLyAkcmVuZGVyKCk6IHZvaWQge31cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxTQUFTLDBCQUEwQjtBQUNuQyxTQUFTLDJCQUEyQjtBQUNwQyxTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLGlDQUFpQztBQUMxQyxTQUFTLHNCQUFzQjtBQUMvQixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLDZCQUE2QjtBQUN0QyxTQUFTLDJCQUEyQjtBQUNwQyxTQUFTLDBCQUEwQjtBQUNuQyxTQUFTLDhCQUE4QjtBQUN2QyxTQUFTLGlCQUFrQztBQUMzQyxTQUFTLGlCQUFpQjtBQUMxQixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLG1CQUFtQjtBQUc1QixTQUFTLGtCQUF1QztBQUNoRCxTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHVCQUF1QjtBQUVoQyxTQUFTLGlCQUFpQjtBQU0xQixTQUFTLGNBQWM7QUFDdkIsU0FBUyxnQkFBZ0I7QUFDekIsU0FBUywrQkFBK0I7QUFFeEMsU0FBUywwQkFBMEI7QUFDbkMsU0FBUyxxQkFBcUI7QUFjOUI7QUFBQSxFQUVFO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxPQUNLO0FBSVAsT0FBTyw2QkFBNkIsMEJBQTBCO0FBY3ZELElBQU0sdUJBQU4sTUFBTSxxQkFBNEQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUE2RC9ELFlBQVksUUFBZ0I7QUEzRHBDLFNBQVEsbUJBQXdDLHdCQUF3QjtBQUN4RSxTQUFRLGVBQW9DLHdCQUF3QjtBQUNwRSxTQUFRLGlDQUFzRCx3QkFBd0I7QUFDdEYsU0FBUSxpQ0FBc0Qsd0JBQXdCO0FBQ3RGLFNBQVEsZUFBb0Msd0JBQXdCO0FBRXBFLFNBQVEsNkJBQTZCO0FBRXJDLFNBQVEsNEJBQTRCO0FBS3BDO0FBQUE7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
