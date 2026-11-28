// src/webgl/WebGLStrategyWebGL2.ts
import { AnimationComponent } from "../foundation/components/Animation/AnimationComponent.js";
import { BlendShapeComponent } from "../foundation/components/BlendShape/BlendShapeComponent.js";
import { CameraComponent } from "../foundation/components/Camera/CameraComponent.js";
import { _getCameraControllerUpdateCount } from "../foundation/components/CameraController/CameraControllerUpdateCount.js";
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
    this.lE = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.iE = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.jE = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.oE = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    this.GE = -1;
    this.iF = -1;
    /**
     * 1 when every mesh drawn in the current pass shows all of its instances, which lets the
     * vertex shader skip the remap texture fetch and read the SID texel directly.
     */
    this.mE = 1;
    /** Reused numeric run plan of the current bucket (no per-frame allocation). */
    this.jF = {
      starts: new Int32Array(0),
      counts: new Int32Array(0),
      keys: new Int32Array(0),
      count: 0
    };
    /** Layout of the instance SID / remap regions inside the data texture. */
    this.pE = 0;
    this.wE = 0;
    this.xE = 0;
    this.qE = 0;
    this.rE = 0;
    this.yE = 0;
    this._totalSizeOfGPUShaderDataStorageExceptMorphData = 0;
    this.BE = true;
    this.KE = -1;
    this.LE = -1;
    this.ME = -1;
    this.NE = -1;
    this.Mc = -1;
    this.OE = -1;
    this.PE = -1;
    this.Lc = -1;
    this.QE = -1;
    this.YA = -1;
    this.Nc = -1;
    this.RE = -1;
    this.CE = -1;
    this.SE = -1;
    this.TE = -1;
    this.c = engine;
    this.kE = this.c.globalDataRepository.getValue("currentComponentSIDs", 0);
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
    this.zE = false;
  }
  /**
   * method definitions for component data access for data texture-based rendering.
   * Provides GLSL functions for accessing component data through data textures.
   * @param shaderType - The shader type (VertexShader or PixelShader)
   * @returns GLSL shader code string for the component data access method definitions
   */
  static UE(engine, shaderType) {
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
  static kF(engine) {
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
    const previousMorphedPositionStr = engine._isPreviousMorphWeightsEnabled ? `
      vec3 get_previousMorphedPosition(uint vertexId, vec3 basePosition, uint blendShapeComponentSID) {
        int currentPrimitiveIdx = u_currentPrimitiveIdx;
        int offsetInUniform = rnMorphUniformDataOffsets[currentPrimitiveIdx];
        int offsetInUniform2 = rnBlendShapeUniformDataOffsets[blendShapeComponentSID] + ${BlendShapeComponent._getPreviousMorphWeightsOffset(engine)};
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
          position += addPos * morphWeights[idx2 % 4];
        }
        return position;
      }` : "";
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
      ${previousMorphedPositionStr}
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
    const webglResourceRepository = this.c.webglResourceRepository;
    const _glw = webglResourceRepository.currentWebGLContextWrapper;
    const [programUid, newOne] = material._createProgramWebGL(
      this.c,
      _WebGLStrategyWebGL2.UE(this.c, ShaderType.VertexShader),
      _WebGLStrategyWebGL2.UE(this.c, ShaderType.PixelShader),
      _WebGLStrategyWebGL2.lF,
      _WebGLStrategyWebGL2.mF,
      _WebGLStrategyWebGL2.kF(this.c),
      primitive
    );
    if (newOne) {
      material._setupBasicUniformsLocations(primitive);
      material._setUniformLocationsOfMaterialNodes(primitive);
      material._setupAdditionalUniformLocations(
        WebGLStrategyCommonMethod.getPointSpriteShaderSemanticsInfoArray(),
        primitive
      );
      this.c.globalDataRepository._setUniformLocationsForWebGL2ModeOnly(material.getShaderProgramUid(primitive));
      webglResourceRepository.setUniformBlockBindingForMorphOffsetsAndWeights(
        programUid,
        this.iE,
        this.jE
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
    this.c.globalDataRepository._setUniformLocationsForWebGL2ModeOnly(material.getShaderProgramUid(primitive));
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
  static lF(engine, info) {
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
  static mF(engine, materialTypeName, info) {
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
    this.kE = this.c.globalDataRepository.getValue("currentComponentSIDs", 0);
    if (!mesh.isSetUpDone()) {
      this.deleteDataTexture();
      mesh._updateVBOAndVAO();
    }
    return true;
  }
  VE() {
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
          this.AE[morphUniformDataOffsets[i] + j] = (this.c.engineState.totalSizeOfGPUShaderDataStorageExceptMorphData + byteOffsetOfExistingBuffer + accessor.byteOffsetInBuffer) / 4 / 4;
        }
      } else {
        break;
      }
    }
    const elementNumToCopy = morphUniformDataOffsets[morphUniformDataOffsets.length - 1];
    this.c.webglResourceRepository.updateUniformBuffer(
      this.iE,
      this.AE,
      0,
      elementNumToCopy
    );
  }
  common_$load() {
    this.nF();
  }
  nF() {
    let needsRebindMorphUniformBuffers = false;
    const morphUniformDataOffsets = Primitive.getMorphUniformDataOffsets();
    const morphOffsetsUniformDataSize = Math.max(
      Math.ceil(morphUniformDataOffsets[morphUniformDataOffsets.length - 1] / 4) * 4 * 4,
      4
    );
    if (morphOffsetsUniformDataSize !== this.CE) {
      if (this.iE !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        this.c.webglResourceRepository.deleteUniformBuffer(this.iE);
        this.iE = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      }
      this.CE = morphOffsetsUniformDataSize;
      if (this.iE === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        const inputArrayOffsets = new Uint32Array(morphOffsetsUniformDataSize);
        this.AE = inputArrayOffsets;
        this.iE = this.c.webglResourceRepository.createUniformBufferWithBufferView(inputArrayOffsets);
        this.VE();
      }
      this.CE = morphOffsetsUniformDataSize;
      needsRebindMorphUniformBuffers = true;
    }
    const blendShapeWeightsUniformDataSize = BlendShapeComponent._getMorphWeightsUniformBufferFloatCount(this.c);
    if (blendShapeWeightsUniformDataSize !== this.SE) {
      if (this.jE !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        this.c.webglResourceRepository.deleteUniformBuffer(this.jE);
        this.jE = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      }
      if (this.jE === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        const inputArrayWeights = new Float32Array(blendShapeWeightsUniformDataSize);
        this.nE = inputArrayWeights;
        this.jE = this.c.webglResourceRepository.createUniformBufferWithBufferView(inputArrayWeights);
        this.WE(true);
      }
      this.SE = blendShapeWeightsUniformDataSize;
      needsRebindMorphUniformBuffers = true;
    }
    if (needsRebindMorphUniformBuffers) {
      this.oF();
    }
  }
  oF() {
    if (this.iE !== CGAPIResourceRepository.InvalidCGAPIResourceUid && this.jE !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      this.c.webglResourceRepository.setUniformBlockBindingForMorphOffsetsAndWeightsWithoutShaderProgram(
        this.iE,
        this.jE
      );
    }
  }
  pF() {
    const morphMaxIndex = Primitive.getPrimitiveCountHasMorph();
    if (morphMaxIndex !== this.LE || this.c.engineState.totalSizeOfGPUShaderDataStorageExceptMorphData !== this.PE) {
      this.VE();
      this.PE = this.c.engineState.totalSizeOfGPUShaderDataStorageExceptMorphData;
      this.LE = morphMaxIndex;
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
  qF() {
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
    const memoryManager = this.c.memoryManager;
    const sizesOfTheBuffers = memoryManager.getSizesOfTheBuffers(BufferUse.GPUInstanceData);
    const totalSizeOfTheBuffers = sizesOfTheBuffers.reduce((acc, size) => acc + size, 0);
    const gpuInstanceDataBuffers = memoryManager.getBuffers(BufferUse.GPUInstanceData);
    const gpuInstanceDataBufferCount = gpuInstanceDataBuffers.length;
    if (gpuInstanceDataBufferCount !== this.RE) {
      this.RE = gpuInstanceDataBufferCount;
      this.deleteDataTexture();
    }
    const glw = this.c.webglResourceRepository.currentWebGLContextWrapper;
    if (glw == null) {
      return;
    }
    const dataTextureWidth = glw.getMaxTextureSize();
    if (this.__dataTextureUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const totalSizeOfTheBuffersInTexel = totalSizeOfTheBuffers / 4 / 4;
      const dataTextureHeight = Math.ceil(totalSizeOfTheBuffersInTexel / dataTextureWidth);
      const dataTextureByteSize = dataTextureWidth * dataTextureHeight * 4 * 4;
      const lightClusterSystem = this.c.lightClusterSystem;
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
          this.XE(layerArray, layerByteOffset, start, end, dataTextureWidth);
        }
        if (!_WebGLStrategyWebGL2.zE) {
          MiscUtil.downloadTypedArray("Rhodonite_dataTextureBuffer.bin", layerArray);
          _WebGLStrategyWebGL2.zE = true;
        }
        layerByteOffset += gpuInstanceDataBuffer.byteLength;
      }
      for (const [start, end] of lightClusterSystem._takeDirtyByteRanges()) {
        let layerStart = 0;
        for (const buffer of gpuInstanceDataBuffers) {
          const layerEnd = layerStart + buffer.byteLength;
          if (start >= layerStart && end <= layerEnd) {
            const layerArray = new Float32Array(buffer.getArrayBuffer());
            this.XE(layerArray, layerStart, start, end, dataTextureWidth);
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
      const isInstanceSidEnabled = this.c.config.isMultiDrawEnabled && this.c.webglResourceRepository.isInstanceSidTextureCapable;
      const sidTable = this.c.webglResourceRepository.instanceSidTable;
      const sidSlotCapacity = isInstanceSidEnabled ? Math.max(sidTable.usedEnd, 1) : 0;
      const sidRows = isInstanceSidEnabled ? Math.max(Math.ceil(sidSlotCapacity / dataTextureWidth), 1) : 0;
      const remapRows = isInstanceSidEnabled ? Math.max(Math.ceil(Math.ceil(sidSlotCapacity / 4) / dataTextureWidth), 1) : 0;
      const dataTextureHeight = dataRows + sidRows + remapRows;
      this.pE = dataTextureWidth;
      this.wE = dataRows;
      this.xE = dataRows + sidRows;
      this.qE = this.wE * dataTextureWidth;
      this.rE = this.xE * dataTextureWidth;
      this.yE = sidSlotCapacity;
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
      this.c.engineState.totalSizeOfGPUShaderDataStorageExceptMorphData = instanceDataRegionTotalSize;
      this.__dataTextureUid = this.c.webglResourceRepository.createTextureFromTypedArray(
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
      this.c.lightClusterSystem._takeDirtyByteRanges();
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
  XE(layerArray, layerByteOffset, start, end, width) {
    const repository = this.c.webglResourceRepository;
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
      this.c.webglResourceRepository.deleteTexture(this.__dataTextureUid);
      this.__dataTextureUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
    this.yE = 0;
    this.pE = 0;
    this.oE = CGAPIResourceRepository.InvalidCGAPIResourceUid;
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
    const instanceSidEnabled = this.c.config.isMultiDrawEnabled && this.c.webglResourceRepository.isInstanceSidTextureCapable;
    if (instanceSidEnabled) {
      const sidTable = this.c.webglResourceRepository.instanceSidTable;
      if (this.__dataTextureUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid && sidTable.usedEnd > this.yE) {
        this.deleteDataTexture();
      }
    }
    if (AnimationComponent.getIsAnimating(this.c) || TransformComponent.getUpdateCount(this.c) !== this.Lc || SceneGraphComponent.getUpdateCount(this.c) !== this.QE || CameraComponent.getCurrentCameraUpdateCount(this.c) !== this.YA || _getCameraControllerUpdateCount(this.c) !== this.Nc || this.c.materialRepository.stateVersion !== this.ME || this.c.lightClusterSystem.dataVersion !== this.NE || LightComponent.getUpdateCount(this.c) !== this.Mc || this.c._gpuInstanceDataVersion !== this.OE || this.__dataTextureUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      this.qF();
      this.rF();
      this.Lc = TransformComponent.getUpdateCount(this.c);
      this.QE = SceneGraphComponent.getUpdateCount(this.c);
      this.YA = CameraComponent.getCurrentCameraUpdateCount(this.c);
      this.Nc = _getCameraControllerUpdateCount(this.c);
      this.ME = this.c.materialRepository.stateVersion;
      this.NE = this.c.lightClusterSystem.dataVersion;
      this.Mc = LightComponent.getUpdateCount(this.c);
      this.OE = this.c._gpuInstanceDataVersion;
    }
    if (BlendShapeComponent.updateCount !== this.KE || BlendShapeComponent.getCountOfBlendShapeComponents(this.c) !== this.TE) {
      this.WE();
      this.KE = BlendShapeComponent.updateCount;
      this.TE = BlendShapeComponent.getCountOfBlendShapeComponents(this.c);
      this.c.materialRepository._makeShaderInvalidateToMorphMaterials();
    } else {
      this.sF();
    }
    this.pF();
    this.HE = this.c.componentRepository.getComponentsWithType(LightComponent);
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
    this.c.webglResourceRepository.updateUniformBuffer(
      this.jE,
      this.nE,
      0,
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
   * Determines whether Uniform Buffer Objects (UBO) should be used for data storage.
   * UBOs are only used when both WebGL 2.0 is available and UBO usage is enabled in configuration.
   *
   * @returns true if UBOs should be used, false otherwise
   *
   * @remarks
   * UBOs provide more efficient uniform data transfer for WebGL 2.0 contexts
   * and can store larger amounts of uniform data compared to individual uniforms.
   */
  tF() {
    return this.c.webglResourceRepository.currentWebGLContextWrapper.isWebGL2 && this.c.config.isUboEnabled;
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
  rF() {
    if (this.tF()) {
      const glw = this.c.webglResourceRepository.currentWebGLContextWrapper;
      const alignedMaxUniformBlockSize = glw.getAlignedMaxUniformBlockSize();
      const maxConventionBlocks = glw.getMaxConventionUniformBlocks();
      const memoryManager = this.c.memoryManager;
      const buffer = memoryManager.getBuffer(BufferUse.GPUInstanceData);
      if (this.lE === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        this.lE = this.c.webglResourceRepository.setupUniformBufferDataArea(
          new Float32Array(buffer.getArrayBuffer())
        );
      } else {
        const array = new Float32Array(buffer.getArrayBuffer());
        this.c.webglResourceRepository.updateUniformBuffer(
          this.lE,
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
    const vao = this.c.webglResourceRepository.getWebGLResource(
      mesh.getVaoUids(primitiveIndex)
    );
    if (vao != null) {
      glw.bindVertexArray(vao);
    } else {
      glw.bindVertexArray(null);
      const vertexHandles = primitive.vertexHandles;
      this.c.webglResourceRepository.setVertexDataToPipeline(vertexHandles, primitive, mesh._variationVBOUid);
      const ibo = this.c.webglResourceRepository.getWebGLResource(vertexHandles.iboHandle);
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
  ZE(renderPass, displayIdx, isVRMainPass) {
    if (isVRMainPass) {
      let cameraComponentSid = -1;
      const webxrSystem = this.c._webXRSystemIfEnabled;
      if (webxrSystem == null ? void 0 : webxrSystem.isWebXRMode) {
        if (webxrSystem.isMultiView()) {
          cameraComponentSid = webxrSystem._getCameraComponentSIDAt(0);
        } else {
          cameraComponentSid = webxrSystem._getCameraComponentSIDAt(displayIdx);
        }
      }
      this.kE._v[WellKnownComponentTIDs.CameraComponentTID] = cameraComponentSid;
    } else {
      let cameraComponent = renderPass.cameraComponent;
      if (cameraComponent == null) {
        cameraComponent = this.c.componentRepository.getComponent(
          CameraComponent,
          CameraComponent.getCurrent(this.c)
        );
      }
      if (cameraComponent) {
        this.kE._v[WellKnownComponentTIDs.CameraComponentTID] = cameraComponent.componentSID;
      } else {
        this.kE._v[WellKnownComponentTIDs.CameraComponentTID] = -1;
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
  _E(_gl, material, _shaderProgram) {
    if (this.kE == null) {
      this.kE = this.c.globalDataRepository.getValue("currentComponentSIDs", 0);
    }
    this.kE._v[0] = material.materialSID;
  }
  /**
   * Packs the visible instances of every mesh drawn in this pass into the engine-wide
   * remap table and uploads the instance SID / remap textures once before drawing.
   * This must happen before any draw so that a multi-draw batch spanning several meshes
   * sees the remap entries of all its meshes.
   */
  uF(primitiveUids, renderPass, primitives) {
    if (!this.c.config.isMultiDrawEnabled) {
      return;
    }
    const webglResourceRepository = this.c.webglResourceRepository;
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
    this.mE = anyCulled ? 0 : 1;
    if (!anyCulled) {
      this.$E(table);
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
    this.$E(table);
  }
  /**
   * Uploads the dirty instance SID / remap rows into the engine data texture.
   * The two tables are stored in reserved rows after the component data, so the
   * shader can read them from texture unit 0 and no extra texture unit is consumed.
   */
  $E(table) {
    if (this.__dataTextureUid === CGAPIResourceRepository.InvalidCGAPIResourceUid || this.pE <= 0) {
      return;
    }
    const usedEnd = table.usedEnd;
    if (usedEnd <= 0) {
      table.clearSidDirty();
      table.clearRemapDirty();
      return;
    }
    if (table.sidDirty) {
      this.aF(
        this.wE,
        usedEnd,
        (dst, texelOffset, count) => table.writeSidTexels(dst, texelOffset, count)
      );
      table.clearSidDirty();
    }
    if (table.remapDirty && this.mE === 0) {
      this.aF(
        this.xE,
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
  aF(baseRow, texelCount, fill) {
    const width = this.pE;
    let remaining = texelCount;
    let texelOffset = 0;
    let row = baseRow;
    while (remaining > 0) {
      const count = Math.min(remaining, width);
      const data = new Float32Array(count * 4);
      fill(data, texelOffset, count);
      this.c.webglResourceRepository.updateTexture(this.__dataTextureUid, data, {
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
    const glw = this.c.webglResourceRepository.currentWebGLContextWrapper;
    const gl = glw.getRawContextAsWebGL2();
    const isVRMainPass = WebGLStrategyCommonMethod.isVrMainPass(this.c, renderPass);
    const displayCount = WebGLStrategyCommonMethod.getDisplayCount(isVRMainPass, this.c._webXRSystemIfEnabled);
    const primitives = renderPass._lastPrimitiveUids === primitiveUids ? renderPass._lastPrimitives : null;
    if (renderPass.isBufferLessRenderingMode()) {
      this.vF(gl, renderPass, isVRMainPass);
      gl.depthMask(true);
      return true;
    }
    this.uF(primitiveUids, renderPass, primitives);
    let renderedSomething = false;
    if (renderPass._toRenderOpaquePrimitives) {
      if (!renderPass.depthWriteMask) {
        gl.depthMask(false);
      }
      renderedSomething = this.sE(
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
      renderedSomething = this.sE(
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
      renderedSomething = this.sE(
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
      renderedSomething = this.sE(
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
    this.iF = renderPassTickCount;
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
  vF(gl, renderPass, isVRMainPass) {
    const material = renderPass.material;
    const primitive = renderPass._dummyPrimitiveForBufferLessRendering;
    setupShaderProgram(material, primitive, this);
    const shaderProgramUid = material.getShaderProgramUid(primitive);
    const shaderProgram = this.c.webglResourceRepository.getWebGLResource(shaderProgramUid);
    gl.useProgram(shaderProgram);
    this.oE = shaderProgramUid;
    this.bindDataTexture(gl, shaderProgram);
    this._E(gl, material, shaderProgram);
    this.ZE(renderPass, 0, isVRMainPass);
    this.bF(gl, shaderProgram);
    this.cF(gl, shaderProgram);
    if (shaderProgram.vrState != null && isVRMainPass) {
      const vrState = this.c.globalDataRepository.getValue("vrState", 0);
      vrState._v[0] = isVRMainPass ? 1 : 0;
      vrState._v[1] = 0;
      shaderProgram._gl.uniform2iv(shaderProgram.vrState, vrState._v);
    }
    WebGLStrategyCommonMethod.setWebGLParameters(this.c, material, gl);
    material._setParametersToGpuWebGLWithOutInternalSetting({
      shaderProgram,
      firstTime: true
    });
    if (renderPass.depthWriteMask) {
      gl.depthMask(true);
    } else {
      gl.depthMask(false);
    }
    this.c.webglResourceRepository.setViewport(this.c, renderPass.getViewport());
    const glw = this.c.webglResourceRepository.currentWebGLContextWrapper;
    if (glw != null && this.DE(glw)) {
      gl.bindVertexArray(null);
      gl.vertexAttribI4ui(VertexAttribute.MaterialSid.getAttributeSlot(), material.materialSID, 0, 0, 0);
      gl.vertexAttribI4ui(VertexAttribute.Instance.getAttributeSlot(), 0, 0, 0, 0);
      this.dF(gl, shaderProgram);
      this.eF(gl, shaderProgram);
    }
    gl.drawArrays(
      renderPass._primitiveModeForBufferLessRendering.index,
      0,
      renderPass._drawVertexNumberForBufferLessRendering
    );
  }
  /** Whether the per-vertex materialSID / instanceBase attribute path is active. */
  DE(glw) {
    return this.c.config.isMultiDrawEnabled && glw.webgl2ExtMD != null && this.c.webglResourceRepository.instanceSidTable.isSupported;
  }
  /**
   * Binds the VAO variant matching the effective material and sets the generic
   * materialSID when the per-vertex materialSID buffer must not be used
   * (non-grouped primitives and render-pass material overrides).
   */
  wF(primitive, material, glw) {
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
      const vao = this.c.webglResourceRepository.getWebGLResource(vaoHandle);
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
  sE(primitiveUids, primitives, start, end, step, glw, renderPass, isVRMainPass, displayCount) {
    const useMultiDraw = !isVRMainPass && displayCount === 1 && this.c.config.isMultiDrawEnabled && glw.webgl2ExtMD != null && this.c.webglResourceRepository.isInstanceSidTextureCapable;
    let renderedSomething = false;
    if (!useMultiDraw) {
      for (let i = start; step > 0 ? i <= end : i >= end; i += step) {
        renderedSomething = this.tE(
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
    const plan = planMultiDrawRunsInto(start, end, step, getRunKey, this.jF);
    for (let r = 0; r < plan.count; r++) {
      const runStart = plan.starts[r];
      const runCount = plan.counts[r];
      if (plan.keys[r] === -1 || runCount < 2) {
        for (let k = 0; k < runCount; k++) {
          const index = runStart + k * step;
          renderedSomething = this.tE(
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
        renderedSomething = this.xF(
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
  xF(primitiveUids, primitives, firstIndex, runCount, step, glw, renderPass, displayCount) {
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
    const renderedFirst = this.tE(
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
        rendered = this.tE(
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
  tE(primitiveUid, glw, renderPass, isVRMainPass, displayCount, deferredDraw, primitiveArg) {
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
    if (this.DE(glw)) {
      this.wF(primitive, material, glw);
    }
    let firstTimeForShaderProgram = false;
    let firstTimeForMaterial = false;
    const shaderProgramUid = material.getShaderProgramUid(primitive);
    if (shaderProgramUid !== this.oE || gl._D) {
      if (isSkipDrawing(material, primitive)) {
        this.dettachVertexData(glw);
        return false;
      }
      const shaderProgram = this.c.webglResourceRepository.getWebGLResource(shaderProgramUid);
      gl.useProgram(shaderProgram);
      gl._D = false;
      this.bindDataTexture(gl, shaderProgram);
      this.hE = shaderProgram;
      firstTimeForShaderProgram = true;
      firstTimeForMaterial = true;
    }
    if (((_b = this.FE) == null ? void 0 : _b.deref()) !== material) {
      firstTimeForMaterial = true;
      this.FE = new WeakRef(material);
    }
    if (this.GE !== material.stateVersion) {
      firstTimeForMaterial = true;
      this.GE = material.stateVersion;
    }
    if (this.DE(glw) && this.hE != null) {
      this.dF(gl, this.hE);
      this.eF(gl, this.hE);
    }
    const renderingArg = {
      glw,
      entity,
      worldMatrix: entity.getSceneGraph().matrixInner,
      normalMatrix: entity.getSceneGraph().normalMatrixInner,
      isBillboard: entity.getSceneGraph().isBillboard,
      isVisible: entity.getSceneGraph().isVisible,
      lightComponents: this.HE,
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
        engine: this.c,
        material,
        shaderProgram: this.hE,
        firstTime: firstTimeForShaderProgram,
        args: renderingArg
      });
    }
    if (firstTimeForMaterial) {
      this._E(gl, material, this.hE);
      WebGLStrategyCommonMethod.setWebGLParameters(this.c, material, gl);
      material._setParametersToGpuWebGL({
        engine: this.c,
        material,
        shaderProgram: this.hE,
        firstTime: firstTimeForMaterial,
        args: renderingArg
      });
    }
    material._setParametersToGpuWebGLPerPrimitive({
      material,
      shaderProgram: this.hE,
      firstTime: firstTimeForMaterial,
      args: renderingArg
    });
    for (let displayIdx = 0; displayIdx < displayCount; displayIdx++) {
      if (isVRMainPass) {
        WebGLStrategyCommonMethod.setVRViewport(this.c, renderPass, displayIdx);
      }
      this.ZE(renderPass, displayIdx, isVRMainPass);
      this.bF(gl, this.hE);
      this.cF(gl, this.hE);
      if (this.hE.vrState != null && isVRMainPass && displayCount > 1) {
        const vrState = this.c.globalDataRepository.getValue("vrState", 0);
        vrState._v[0] = isVRMainPass ? 1 : 0;
        vrState._v[1] = displayIdx;
        this.hE._gl.uniform2iv(this.hE.vrState, vrState._v);
      }
      const useInstanceSidTexture = this.c.config.isMultiDrawEnabled && glw.webgl2ExtMD != null && this.c.webglResourceRepository.instanceSidTable.isSupported;
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
    this.oE = shaderProgramUid;
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
  cF(gl, shaderProgram) {
    const program = shaderProgram;
    const location = program.lightClusterView;
    if (location == null) {
      return;
    }
    const cameraSid = this.kE._v[WellKnownComponentTIDs.CameraComponentTID];
    const lightClusterSystem = this.c.lightClusterSystem;
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
  bF(gl, shaderProgram) {
    const values = this.kE._v;
    let lastValues = this.JE;
    if (this.IE === shaderProgram && lastValues != null && lastValues.length === values.length) {
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
      this.JE = lastValues;
    }
    lastValues.set(values);
    this.IE = shaderProgram;
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
    this.c.webglResourceRepository.bindTexture2D(0, this.__dataTextureUid);
    const samplerUid = this.c.webglResourceRepository.createOrGetTextureSamplerRepeatNearest();
    this.c.webglResourceRepository.bindTextureSampler(0, samplerUid);
    this.bindInstanceSidTextures(gl, shaderProgram);
  }
  /**
   * Binds the engine-wide instance SID / remap textures used by multi-draw rendering.
   * The textures are declared in the common vertex shader include and are only used
   * when RN_USE_INSTANCE_SID_TEXTURE is defined.
   */
  bindInstanceSidTextures(gl, shaderProgram) {
    const webglResourceRepository = this.c.webglResourceRepository;
    const glw = webglResourceRepository.currentWebGLContextWrapper;
    if (glw == null || glw.webgl2ExtMD == null || !this.c.config.isMultiDrawEnabled) {
      return;
    }
    const table = webglResourceRepository.instanceSidTable;
    if (!table.isSupported) {
      return;
    }
    const program = shaderProgram;
    if (program.yF === void 0) {
      program.uE = gl.getUniformLocation(
        shaderProgram,
        "u_instanceSidDataTextureIndex"
      );
      program.EE = gl.getUniformLocation(
        shaderProgram,
        "u_instanceRemapDataTextureIndex"
      );
      program.vE = gl.getUniformLocation(shaderProgram, "u_instanceRemapIdentity");
      program.yF = null;
    }
    if (program.uE != null) {
      gl.uniform1i(program.uE, this.qE);
      program.fF = this.qE;
    }
    if (program.EE != null) {
      gl.uniform1i(program.EE, this.rE);
      program.gF = this.rE;
    }
    if (program.vE != null) {
      gl.uniform1i(program.vE, this.mE);
      program.hF = this.mE;
    }
  }
  /**
   * Keeps the data-texture base indices of the instance tables in sync with the
   * current texture layout. The indices change when the data texture is recreated
   * (e.g. the instance slot capacity grew) while the same program stays bound.
   */
  eF(gl, shaderProgram) {
    const program = shaderProgram;
    if (program.uE == null) {
      return;
    }
    const sidBase = this.qE;
    if (program.fF !== sidBase) {
      gl.uniform1i(program.uE, sidBase);
      program.fF = sidBase;
    }
    const remapBase = this.rE;
    if (program.gF !== remapBase) {
      gl.uniform1i(program.EE, remapBase);
      program.gF = remapBase;
    }
  }
  /**
   * Keeps the remap-identity uniform in sync with the current render pass. The culling
   * state can change between passes while the same shader program stays bound, so this
   * is checked before every draw (a cheap property comparison when unchanged).
   */
  dF(gl, shaderProgram) {
    const program = shaderProgram;
    if (program.vE == null) {
      return;
    }
    const identity = this.mE;
    if (program.hF === identity) {
      return;
    }
    gl.uniform1i(program.vE, identity);
    program.hF = identity;
  }
  /**
   * Destroys all GPU resources held by this strategy.
   * Should be called when the engine is being destroyed.
   */
  destroy() {
    const webglResourceRepository = this.c.webglResourceRepository;
    if (this.__dataTextureUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      webglResourceRepository.deleteTexture(this.__dataTextureUid);
      this.__dataTextureUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
    if (this.lE !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      webglResourceRepository.deleteUniformBuffer(this.lE);
      this.lE = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
    if (this.iE !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      webglResourceRepository.deleteUniformBuffer(this.iE);
      this.iE = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
    if (this.jE !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      webglResourceRepository.deleteUniformBuffer(this.jE);
      this.jE = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
  }
  // $render(): void {}
};
_WebGLStrategyWebGL2.zE = true;
var WebGLStrategyWebGL2 = _WebGLStrategyWebGL2;
export {
  WebGLStrategyWebGL2
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3JjL3dlYmdsL1dlYkdMU3RyYXRlZ3lXZWJHTDIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IEFuaW1hdGlvbkNvbXBvbmVudCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29tcG9uZW50cy9BbmltYXRpb24vQW5pbWF0aW9uQ29tcG9uZW50JztcbmltcG9ydCB7IEJsZW5kU2hhcGVDb21wb25lbnQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvbXBvbmVudHMvQmxlbmRTaGFwZS9CbGVuZFNoYXBlQ29tcG9uZW50JztcbmltcG9ydCB7IENhbWVyYUNvbXBvbmVudCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29tcG9uZW50cy9DYW1lcmEvQ2FtZXJhQ29tcG9uZW50JztcbmltcG9ydCB7IF9nZXRDYW1lcmFDb250cm9sbGVyVXBkYXRlQ291bnQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvbXBvbmVudHMvQ2FtZXJhQ29udHJvbGxlci9DYW1lcmFDb250cm9sbGVyVXBkYXRlQ291bnQnO1xuaW1wb3J0IHsgTGlnaHRDb21wb25lbnQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvbXBvbmVudHMvTGlnaHQvTGlnaHRDb21wb25lbnQnO1xuaW1wb3J0IHsgTWVzaENvbXBvbmVudCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29tcG9uZW50cy9NZXNoL01lc2hDb21wb25lbnQnO1xuaW1wb3J0IHsgTWVzaFJlbmRlcmVyQ29tcG9uZW50IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb21wb25lbnRzL01lc2hSZW5kZXJlci9NZXNoUmVuZGVyZXJDb21wb25lbnQnO1xuaW1wb3J0IHsgU2NlbmVHcmFwaENvbXBvbmVudCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29tcG9uZW50cy9TY2VuZUdyYXBoL1NjZW5lR3JhcGhDb21wb25lbnQnO1xuaW1wb3J0IHsgVHJhbnNmb3JtQ29tcG9uZW50IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb21wb25lbnRzL1RyYW5zZm9ybS9UcmFuc2Zvcm1Db21wb25lbnQnO1xuaW1wb3J0IHsgV2VsbEtub3duQ29tcG9uZW50VElEcyB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29tcG9uZW50cy9XZWxsS25vd25Db21wb25lbnRUSURzJztcbmltcG9ydCB7IENvbXBvbmVudCwgdHlwZSBNZW1iZXJJbmZvIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb3JlL0NvbXBvbmVudCc7XG5pbXBvcnQgeyBCdWZmZXJVc2UgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL0J1ZmZlclVzZSc7XG5pbXBvcnQgeyBDb21wb25lbnRUeXBlIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9Db21wb25lbnRUeXBlJztcbmltcG9ydCB7IENvbXBvc2l0aW9uVHlwZSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvQ29tcG9zaXRpb25UeXBlJztcbmltcG9ydCB7IFBpeGVsRm9ybWF0IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9QaXhlbEZvcm1hdCc7XG5pbXBvcnQgdHlwZSB7IFNoYWRlclNlbWFudGljc05hbWUgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1NoYWRlclNlbWFudGljcyc7XG5pbXBvcnQgdHlwZSB7IFNoYWRlclNlbWFudGljc0luZm8gfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1NoYWRlclNlbWFudGljc0luZm8nO1xuaW1wb3J0IHsgU2hhZGVyVHlwZSwgdHlwZSBTaGFkZXJUeXBlRW51bSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvU2hhZGVyVHlwZSc7XG5pbXBvcnQgeyBUZXh0dXJlRm9ybWF0IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9UZXh0dXJlRm9ybWF0JztcbmltcG9ydCB7IFZlcnRleEF0dHJpYnV0ZSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvVmVydGV4QXR0cmlidXRlJztcbmltcG9ydCB0eXBlIHsgTWVzaCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vZ2VvbWV0cnkvTWVzaCc7XG5pbXBvcnQgeyBQcmltaXRpdmUgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2dlb21ldHJ5L1ByaW1pdGl2ZSc7XG5pbXBvcnQgdHlwZSB7IE1hdGVyaWFsIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9tYXRlcmlhbHMvY29yZS9NYXRlcmlhbCc7XG5pbXBvcnQgdHlwZSB7IFZlY3RvcjIgfSBmcm9tICcuLi9mb3VuZGF0aW9uL21hdGgvVmVjdG9yMic7XG5pbXBvcnQgdHlwZSB7IFZlY3Rvck4gfSBmcm9tICcuLi9mb3VuZGF0aW9uL21hdGgvVmVjdG9yTic7XG5pbXBvcnQgdHlwZSB7IEFjY2Vzc29yIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9tZW1vcnkvQWNjZXNzb3InO1xuaW1wb3J0IHR5cGUgeyBCdWZmZXIgfSBmcm9tICcuLi9mb3VuZGF0aW9uL21lbW9yeS9CdWZmZXInO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9taXNjL0xvZ2dlcic7XG5pbXBvcnQgeyBNaXNjVXRpbCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWlzYy9NaXNjVXRpbCc7XG5pbXBvcnQgeyBDR0FQSVJlc291cmNlUmVwb3NpdG9yeSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vcmVuZGVyZXIvQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnknO1xuaW1wb3J0IHR5cGUgeyBDR0FQSVN0cmF0ZWd5IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9yZW5kZXJlci9DR0FQSVN0cmF0ZWd5JztcbmltcG9ydCB7IHN1YnRyYWN0Qnl0ZVJhbmdlcyB9IGZyb20gJy4uL2ZvdW5kYXRpb24vcmVuZGVyZXIvbGlnaHRDbHVzdGVyL0xpZ2h0Q2x1c3RlckxheW91dCc7XG5pbXBvcnQgeyBpc1NraXBEcmF3aW5nIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9yZW5kZXJlci9SZW5kZXJpbmdDb21tb25NZXRob2RzJztcbmltcG9ydCB0eXBlIHsgUmVuZGVyUGFzcyB9IGZyb20gJy4uL2ZvdW5kYXRpb24vcmVuZGVyZXIvUmVuZGVyUGFzcyc7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgdHlwZSB7XG4gIEJ5dGUsXG4gIENHQVBJUmVzb3VyY2VIYW5kbGUsXG4gIENvdW50LFxuICBJbmRleCxcbiAgSW5kZXhPZjRCeXRlcyxcbiAgSW5kZXhPZjE2Qnl0ZXMsXG4gIFByaW1pdGl2ZVVJRCxcbiAgV2ViR0xSZXNvdXJjZUhhbmRsZSxcbn0gZnJvbSAnLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBJbnN0YW5jZVNpZFRhYmxlIH0gZnJvbSAnLi9JbnN0YW5jZVNpZFRhYmxlJztcbmltcG9ydCB7XG4gIHR5cGUgRGVmZXJyZWRNdWx0aURyYXcsXG4gIGdldE11bHRpRHJhd1N0YXRlS2V5SWQsXG4gIGdldFByaW1pdGl2ZU1lc2hSZW5kZXJlckZpbmdlclByaW50SWQsXG4gIHR5cGUgTXVsdGlEcmF3UnVuUGxhbixcbiAgcGxhbk11bHRpRHJhd1J1bnNJbnRvLFxufSBmcm9tICcuL011bHRpRHJhdyc7XG5pbXBvcnQgdHlwZSB7IFJlbmRlcmluZ0FyZ1dlYkdMIH0gZnJvbSAnLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgdHlwZSB7IFdlYkdMQ29udGV4dFdyYXBwZXIgfSBmcm9tICcuL1dlYkdMQ29udGV4dFdyYXBwZXInO1xuaW1wb3J0IHR5cGUgeyBTaGFkZXJTb3VyY2VzLCBXZWJHTFN0cmF0ZWd5IH0gZnJvbSAnLi9XZWJHTFN0cmF0ZWd5JztcbmltcG9ydCBXZWJHTFN0cmF0ZWd5Q29tbW9uTWV0aG9kLCB7IHNldHVwU2hhZGVyUHJvZ3JhbSB9IGZyb20gJy4vV2ViR0xTdHJhdGVneUNvbW1vbk1ldGhvZCc7XG5cbmRlY2xhcmUgY29uc3Qgc3BlY3RvcjogYW55O1xuXG4vKipcbiAqIFdlYkdMIHJlbmRlcmluZyBzdHJhdGVneSBpbXBsZW1lbnRhdGlvbiB0aGF0IHVzZXMgZGF0YSB0ZXh0dXJlcyBmb3Igc3RvcmluZyBzaGFkZXIgZGF0YS5cbiAqIFRoaXMgc3RyYXRlZ3kgc3RvcmVzIHVuaWZvcm0gZGF0YSBpbiB0ZXh0dXJlcyByYXRoZXIgdGhhbiB0cmFkaXRpb25hbCB1bmlmb3JtIHZhcmlhYmxlcyxcbiAqIGVuYWJsaW5nIHN1cHBvcnQgZm9yIGxhcmdlciBhbW91bnRzIG9mIGluc3RhbmNlIGRhdGEgYW5kIG1vcmUgZWZmaWNpZW50IGJhdGNoIHJlbmRlcmluZy5cbiAqXG4gKiBAcmVtYXJrc1xuICogVGhpcyBjbGFzcyBpbXBsZW1lbnRzIGJvdGggQ0dBUElTdHJhdGVneSBhbmQgV2ViR0xTdHJhdGVneSBpbnRlcmZhY2VzLCBwcm92aWRpbmdcbiAqIGEgY29tcGxldGUgcmVuZGVyaW5nIHBpcGVsaW5lIGZvciBXZWJHTCB3aXRoIGRhdGEgdGV4dHVyZSBvcHRpbWl6YXRpb24uXG4gKiBUaGUgc3RyYXRlZ3kgaXMgcGFydGljdWxhcmx5IHVzZWZ1bCBmb3IgcmVuZGVyaW5nIG1hbnkgaW5zdGFuY2VzIHdpdGggdW5pcXVlIHByb3BlcnRpZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBXZWJHTFN0cmF0ZWd5V2ViR0wyIGltcGxlbWVudHMgQ0dBUElTdHJhdGVneSwgV2ViR0xTdHJhdGVneSB7XG4gIHByaXZhdGUgX19lbmdpbmU6IEVuZ2luZTtcbiAgcHJpdmF0ZSBfX2RhdGFUZXh0dXJlVWlkOiBDR0FQSVJlc291cmNlSGFuZGxlID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gIHByaXZhdGUgX19kYXRhVUJPVWlkOiBDR0FQSVJlc291cmNlSGFuZGxlID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gIHByaXZhdGUgX19tb3JwaE9mZnNldHNVbmlmb3JtQnVmZmVyVWlkOiBDR0FQSVJlc291cmNlSGFuZGxlID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gIHByaXZhdGUgX19tb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyVWlkOiBDR0FQSVJlc291cmNlSGFuZGxlID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gIHByaXZhdGUgX19sYXN0U2hhZGVyOiBDR0FQSVJlc291cmNlSGFuZGxlID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gIHByaXZhdGUgX19sYXN0TWF0ZXJpYWw/OiBXZWFrUmVmPE1hdGVyaWFsPjtcbiAgcHJpdmF0ZSBfX2xhc3RNYXRlcmlhbFN0YXRlVmVyc2lvbiA9IC0xO1xuICBwcml2YXRlIF9fc2hhZGVyUHJvZ3JhbT86IFdlYkdMUHJvZ3JhbTtcbiAgcHJpdmF0ZSBfX2xhc3RSZW5kZXJQYXNzVGlja0NvdW50ID0gLTE7XG4gIC8qKlxuICAgKiAxIHdoZW4gZXZlcnkgbWVzaCBkcmF3biBpbiB0aGUgY3VycmVudCBwYXNzIHNob3dzIGFsbCBvZiBpdHMgaW5zdGFuY2VzLCB3aGljaCBsZXRzIHRoZVxuICAgKiB2ZXJ0ZXggc2hhZGVyIHNraXAgdGhlIHJlbWFwIHRleHR1cmUgZmV0Y2ggYW5kIHJlYWQgdGhlIFNJRCB0ZXhlbCBkaXJlY3RseS5cbiAgICovXG4gIHByaXZhdGUgX19pbnN0YW5jZVJlbWFwSWRlbnRpdHkgPSAxO1xuICAvKiogUmV1c2VkIG51bWVyaWMgcnVuIHBsYW4gb2YgdGhlIGN1cnJlbnQgYnVja2V0IChubyBwZXItZnJhbWUgYWxsb2NhdGlvbikuICovXG4gIHByaXZhdGUgX19ydW5QbGFuOiBNdWx0aURyYXdSdW5QbGFuID0ge1xuICAgIHN0YXJ0czogbmV3IEludDMyQXJyYXkoMCksXG4gICAgY291bnRzOiBuZXcgSW50MzJBcnJheSgwKSxcbiAgICBrZXlzOiBuZXcgSW50MzJBcnJheSgwKSxcbiAgICBjb3VudDogMCxcbiAgfTtcbiAgLyoqIExheW91dCBvZiB0aGUgaW5zdGFuY2UgU0lEIC8gcmVtYXAgcmVnaW9ucyBpbnNpZGUgdGhlIGRhdGEgdGV4dHVyZS4gKi9cbiAgcHJpdmF0ZSBfX2RhdGFUZXh0dXJlV2lkdGggPSAwO1xuICBwcml2YXRlIF9faW5zdGFuY2VTaWRCYXNlUm93ID0gMDtcbiAgcHJpdmF0ZSBfX2luc3RhbmNlUmVtYXBCYXNlUm93ID0gMDtcbiAgcHJpdmF0ZSBfX2luc3RhbmNlU2lkQmFzZVZlYzQgPSAwO1xuICBwcml2YXRlIF9faW5zdGFuY2VSZW1hcEJhc2VWZWM0ID0gMDtcbiAgcHJpdmF0ZSBfX2luc3RhbmNlU2lkQ2FwYWNpdHkgPSAwO1xuICBwcml2YXRlIF9fbGlnaHRDb21wb25lbnRzPzogTGlnaHRDb21wb25lbnRbXTtcbiAgcHJpdmF0ZSBfX2N1cnJlbnRDb21wb25lbnRTSURzPzogVmVjdG9yTjtcbiAgLyoqIFByb2dyYW0gYW5kIHZhbHVlcyBvZiB0aGUgbGFzdCBjdXJyZW50Q29tcG9uZW50U0lEcyB1cGxvYWQsIHVzZWQgdG8gc2tpcCByZWR1bmRhbnQgdXBsb2Fkcy4gKi9cbiAgcHJpdmF0ZSBfX2xhc3RDb21wb25lbnRTSURzUHJvZ3JhbT86IFdlYkdMUHJvZ3JhbTtcbiAgcHJpdmF0ZSBfX2xhc3RVcGxvYWRlZENvbXBvbmVudFNJRHM/OiBGbG9hdDMyQXJyYXk7XG4gIHB1YmxpYyBfdG90YWxTaXplT2ZHUFVTaGFkZXJEYXRhU3RvcmFnZUV4Y2VwdE1vcnBoRGF0YSA9IDA7XG4gIHByaXZhdGUgc3RhdGljIF9faXNEZWJ1Z09wZXJhdGlvblRvRGF0YVRleHR1cmVCdWZmZXJEb25lID0gdHJ1ZTtcblxuICBwcml2YXRlIF9fdW5pZm9ybU1vcnBoT2Zmc2V0c1R5cGVkQXJyYXk/OiBVaW50MzJBcnJheTtcbiAgcHJpdmF0ZSBfX3VuaWZvcm1Nb3JwaFdlaWdodHNUeXBlZEFycmF5PzogRmxvYXQzMkFycmF5O1xuICBwcml2YXRlIF9faXNQcmV2aW91c01vcnBoV2VpZ2h0c1NldHRsZWQgPSB0cnVlO1xuICBwcml2YXRlIF9fbGFzdEJsZW5kU2hhcGVDb21wb25lbnRzVXBkYXRlQ291bnRGb3JXZWlnaHRzID0gLTE7XG4gIHByaXZhdGUgX19sYXN0TW9ycGhNYXhJbmRleCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdE1hdGVyaWFsc1VwZGF0ZUNvdW50ID0gLTE7XG4gIHByaXZhdGUgX19sYXN0TGlnaHRDbHVzdGVyRGF0YVZlcnNpb24gPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RMaWdodENvbXBvbmVudHNVcGRhdGVDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdEdwdUluc3RhbmNlRGF0YVZlcnNpb24gPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RUb3RhbFNpemVPZkdQVVNoYWRlckRhdGFTdG9yYWdlRXhjZXB0TW9ycGhEYXRhID0gLTE7XG4gIHByaXZhdGUgX19sYXN0VHJhbnNmb3JtQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gLTE7XG4gIHByaXZhdGUgX19sYXN0U2NlbmVHcmFwaENvbXBvbmVudHNVcGRhdGVDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdENhbWVyYUNvbXBvbmVudHNVcGRhdGVDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdENhbWVyYUNvbnRyb2xsZXJDb21wb25lbnRzVXBkYXRlQ291bnQgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RHcHVJbnN0YW5jZURhdGFCdWZmZXJDb3VudCA9IC0xO1xuXG4gIHByaXZhdGUgX19sYXN0TW9ycGhPZmZzZXRzVW5pZm9ybURhdGFTaXplID0gLTE7XG4gIHByaXZhdGUgX19sYXN0TW9ycGhXZWlnaHRzVW5pZm9ybURhdGFTaXplID0gLTE7XG4gIHByaXZhdGUgX19jb3VudE9mQmxlbmRTaGFwZUNvbXBvbmVudHMgPSAtMTtcblxuICAvKipcbiAgICogUHJpdmF0ZSBjb25zdHJ1Y3RvciB0byBlbmZvcmNlIHNpbmdsZXRvbiBwYXR0ZXJuLlxuICAgKiBJbW1lZGlhdGVseSBpbml0aWFsaXplcyBfX2N1cnJlbnRDb21wb25lbnRTSURzIGZyb20gdGhlIGVuZ2luZSdzIEdsb2JhbERhdGFSZXBvc2l0b3J5XG4gICAqIHRvIGF2b2lkIG51bGwgcmVmZXJlbmNlIGVycm9ycyBkdXJpbmcgcmVuZGVyaW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihlbmdpbmU6IEVuZ2luZSkge1xuICAgIHRoaXMuX19lbmdpbmUgPSBlbmdpbmU7XG4gICAgLy8gSW5pdGlhbGl6ZSBfX2N1cnJlbnRDb21wb25lbnRTSURzIGltbWVkaWF0ZWx5IHRvIHByZXZlbnQgbnVsbCByZWZlcmVuY2UgZXJyb3JzXG4gICAgLy8gVGhpcyBtdXN0IGJlIGRvbmUgYWZ0ZXIgR2xvYmFsRGF0YVJlcG9zaXRvcnkuaW5pdGlhbGl6ZSgpIGhhcyBiZWVuIGNhbGxlZCBpbiBFbmdpbmUuaW5pdCgpXG4gICAgdGhpcy5fX2N1cnJlbnRDb21wb25lbnRTSURzID0gdGhpcy5fX2VuZ2luZS5nbG9iYWxEYXRhUmVwb3NpdG9yeS5nZXRWYWx1ZSgnY3VycmVudENvbXBvbmVudFNJRHMnLCAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZXMgdGhlIGR1bXBpbmcgb2YgdGhlIGRhdGEgdGV4dHVyZSBidWZmZXIgZm9yIGRlYnVnZ2luZyBwdXJwb3Nlcy5cbiAgICogVGhpcyBtZXRob2QgZmxhZ3MgdGhlIHN5c3RlbSB0byBleHBvcnQgdGhlIGRhdGEgdGV4dHVyZSBidWZmZXIgY29udGVudHNcbiAgICogb24gdGhlIG5leHQgcmVuZGVyaW5nIGN5Y2xlLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGUgZHVtcGVkIGJ1ZmZlciB3aWxsIGJlIGRvd25sb2FkZWQgYXMgYSBiaW5hcnkgZmlsZSBuYW1lZCAnUmhvZG9uaXRlX2RhdGFUZXh0dXJlQnVmZmVyLmJpbicuXG4gICAqIFRoaXMgaXMgdXNlZnVsIGZvciBkZWJ1Z2dpbmcgc2hhZGVyIGRhdGEgbGF5b3V0IGFuZCBjb250ZW50IGlzc3Vlcy5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgZHVtcERhdGFUZXh0dXJlQnVmZmVyKCkge1xuICAgIHRoaXMuX19pc0RlYnVnT3BlcmF0aW9uVG9EYXRhVGV4dHVyZUJ1ZmZlckRvbmUgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBtZXRob2QgZGVmaW5pdGlvbnMgZm9yIGNvbXBvbmVudCBkYXRhIGFjY2VzcyBmb3IgZGF0YSB0ZXh0dXJlLWJhc2VkIHJlbmRlcmluZy5cbiAgICogUHJvdmlkZXMgR0xTTCBmdW5jdGlvbnMgZm9yIGFjY2Vzc2luZyBjb21wb25lbnQgZGF0YSB0aHJvdWdoIGRhdGEgdGV4dHVyZXMuXG4gICAqIEBwYXJhbSBzaGFkZXJUeXBlIC0gVGhlIHNoYWRlciB0eXBlIChWZXJ0ZXhTaGFkZXIgb3IgUGl4ZWxTaGFkZXIpXG4gICAqIEByZXR1cm5zIEdMU0wgc2hhZGVyIGNvZGUgc3RyaW5nIGZvciB0aGUgY29tcG9uZW50IGRhdGEgYWNjZXNzIG1ldGhvZCBkZWZpbml0aW9uc1xuICAgKi9cbiAgc3RhdGljIF9fZ2V0Q29tcG9uZW50RGF0YUFjY2Vzc01ldGhvZERlZmluaXRpb25zX2RhdGFUZXh0dXJlKGVuZ2luZTogRW5naW5lLCBzaGFkZXJUeXBlOiBTaGFkZXJUeXBlRW51bSkge1xuICAgIGxldCBzdHIgPSAnJztcbiAgICBjb25zdCBtZW1iZXJJbmZvID0gQ29tcG9uZW50LmdldE1lbWJlckluZm8oZW5naW5lKTtcbiAgICBtZW1iZXJJbmZvLmZvckVhY2goKG1hcE1lbWJlck5hbWVNZW1iZXJJbmZvLCBjb21wb25lbnRDbGFzcykgPT4ge1xuICAgICAgbWFwTWVtYmVyTmFtZU1lbWJlckluZm8uZm9yRWFjaCgobWVtYmVySW5mbywgbWVtYmVyTmFtZSkgPT4ge1xuICAgICAgICBpZiAobWVtYmVySW5mby5zaGFkZXJUeXBlICE9PSBzaGFkZXJUeXBlICYmIG1lbWJlckluZm8uc2hhZGVyVHlwZSAhPT0gU2hhZGVyVHlwZS5WZXJ0ZXhBbmRQaXhlbFNoYWRlcikge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcgPSBDb21wb25lbnQuZ2V0Q29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3KGVuZ2luZSkuZ2V0KGNvbXBvbmVudENsYXNzKSA/PyAxO1xuICAgICAgICBpZiAoQ29tcG9zaXRpb25UeXBlLmlzQXJyYXkobWVtYmVySW5mby5jb21wb3NpdGlvblR5cGUpKSB7XG4gICAgICAgICAgcHJvY2Vzc0ZvckFycmF5VHlwZShtZW1iZXJJbmZvLCBjb21wb25lbnRDbGFzcywgbWVtYmVyTmFtZSwgY29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwcm9jZXNzRm9yTm9uQXJyYXlUeXBlKG1lbWJlckluZm8sIGNvbXBvbmVudENsYXNzLCBtZW1iZXJOYW1lLCBjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBzdHI7XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzRm9yQXJyYXlUeXBlKFxuICAgICAgbWVtYmVySW5mbzogTWVtYmVySW5mbyxcbiAgICAgIGNvbXBvbmVudENsYXNzOiB0eXBlb2YgQ29tcG9uZW50LFxuICAgICAgbWVtYmVyTmFtZTogc3RyaW5nLFxuICAgICAgY29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3OiBudW1iZXJcbiAgICApIHtcbiAgICAgIGxldCB0eXBlU3RyID0gJyc7XG4gICAgICBsZXQgZmV0Y2hUeXBlU3RyID0gJyc7XG4gICAgICBzd2l0Y2ggKG1lbWJlckluZm8uY29tcG9zaXRpb25UeXBlKSB7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzRBcnJheTpcbiAgICAgICAgICB0eXBlU3RyID0gJ3ZlYzQnO1xuICAgICAgICAgIGZldGNoVHlwZVN0ciA9ICdmZXRjaFZlYzQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQ0QXJyYXk6XG4gICAgICAgICAgdHlwZVN0ciA9ICdtYXQ0JztcbiAgICAgICAgICBmZXRjaFR5cGVTdHIgPSAnZmV0Y2hNYXQ0JztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0NHgzQXJyYXk6XG4gICAgICAgICAgdHlwZVN0ciA9ICdtYXQ0eDMnO1xuICAgICAgICAgIGZldGNoVHlwZVN0ciA9ICdmZXRjaE1hdDR4Myc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBjb21wb3NpdGlvbiB0eXBlOiAke21lbWJlckluZm8uY29tcG9zaXRpb25UeXBlLnN0cn1gKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdmVjNFNpemVPZlByb3BlcnR5OiBJbmRleE9mMTZCeXRlcyA9IG1lbWJlckluZm8uY29tcG9zaXRpb25UeXBlLmdldFZlYzRTaXplT2ZQcm9wZXJ0eSgpO1xuXG4gICAgICBpZiAobWVtYmVySW5mby5pc1ZhcmlhYmxlTGVuZ3RoID09PSB0cnVlKSB7XG4gICAgICAgIC8vIEVhY2ggaW5zdGFuY2UgaGFzIGl0cyBvd24gY2h1bmsuIEl0cyBsb2NhdGlvbiBpcyBzdG9yZWQgaW4gdGhlIGAke21lbWJlck5hbWV9TG9jYXRpb25gIG1lbWJlcixcbiAgICAgICAgLy8gd2hvc2UgZ2V0dGVyIGlzIGdlbmVyYXRlZCBiZWZvcmUgdGhpcyBvbmUgKGl0IGlzIHJlZ2lzdGVyZWQgYmVmb3JlIHRoZSB2YXJpYWJsZS1sZW5ndGggbWVtYmVyKS5cbiAgICAgICAgY29uc3QgcmFkaXggPSBDb21wb25lbnQuX3ZhcmlhYmxlTGVuZ3RoTG9jYXRpb25SYWRpeDtcbiAgICAgICAgc3RyICs9IGBcbiAgJHt0eXBlU3RyfSBnZXRfJHttZW1iZXJOYW1lfSh1aW50IGluc3RhbmNlSWQsIHVpbnQgaWR4T2ZBcnJheSkge1xuICAgIHZlYzQgbG9jYXRpb24gPSBnZXRfJHtDb21wb25lbnQuX2dldFZhcmlhYmxlTGVuZ3RoTG9jYXRpb25NZW1iZXJOYW1lKG1lbWJlck5hbWUpfShpbnN0YW5jZUlkKTtcbiAgICBpbnQgaW5kZXggPSBpbnQobG9jYXRpb24ueCkgKiAke3JhZGl4fSArIGludChsb2NhdGlvbi55KSArICR7dmVjNFNpemVPZlByb3BlcnR5fSAqIGludChpZHhPZkFycmF5KTtcbiAgICAke3R5cGVTdHJ9IHZhbHVlID0gJHtmZXRjaFR5cGVTdHJ9KGluZGV4KTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbmA7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbG9jYXRpb25PZmZzZXRzX3ZlYzRfaWR4ID0gQ29tcG9uZW50LmdldExvY2F0aW9uT2Zmc2V0T2ZNZW1iZXJPZkNvbXBvbmVudChcbiAgICAgICAgZW5naW5lLFxuICAgICAgICBjb21wb25lbnRDbGFzcyxcbiAgICAgICAgbWVtYmVyTmFtZVxuICAgICAgKTtcbiAgICAgIGNvbnN0IGFycmF5TGVuZ3RoTWFwID0gQ29tcG9uZW50LmdldEFycmF5TGVuZ3RoT2ZNZW1iZXIoZW5naW5lKS5nZXQoY29tcG9uZW50Q2xhc3MpID8/IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG4gICAgICBjb25zdCBhcnJheUxlbmd0aCA9IGFycmF5TGVuZ3RoTWFwLmdldChtZW1iZXJOYW1lKSA/PyAwO1xuICAgICAgY29uc3QgYXJyYXlMZW5ndGhTdHIgPSBgaW50IGFycmF5TGVuZ3RoID0gJHthcnJheUxlbmd0aH07YDtcbiAgICAgIC8vIFRoZSBvZmZzZXRzIG9mIHRoZSBidWZmZXIgdmlld3MgYXJlIGEgY29tcGlsZS10aW1lIGNvbnN0YW50LiBUaGV5IG11c3QgYmUgZGVjbGFyZWQgYXQgZ2xvYmFsIHNjb3BlOiBhIGxvY2FsXG4gICAgICAvLyBhcnJheSBpbml0aWFsaXplciBydW5zIG9uIGV2ZXJ5IGNhbGwsIHdoaWNoIGlzIGV4cGVuc2l2ZSB3aGVuIGEgc2NlbmUgaGFzIG1hbnkgY29tcG9uZW50cyBvZiB0aGUgY2xhc3NcbiAgICAgIC8vICh0aGUgdGFibGUgaGFzIG9uZSBlbnRyeSBwZXIgYnVmZmVyIHZpZXcsIGkuZS4gcGVyIGNhbWVyYSBmb3IgY2FtZXJhQ29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3IDEpLlxuICAgICAgY29uc3QgaW5kaWNlc05hbWUgPSBgcm5JbmRpY2VzXyR7bWVtYmVyTmFtZX1gO1xuICAgICAgY29uc3QgaW5kZXhTdHIgPSBgaW50IGluZGV4ID0gJHtpbmRpY2VzTmFtZX1baW5zdGFuY2VJZE9mQnVmZmVyVmlld3NdICsgaW50KGluc3RhbmNlSWRJbkJ1ZmZlclZpZXcpICogJHt2ZWM0U2l6ZU9mUHJvcGVydHl9ICogYXJyYXlMZW5ndGggKyAke3ZlYzRTaXplT2ZQcm9wZXJ0eX0gKiBpbnQoaWR4T2ZBcnJheSk7YDsgLy8gdmVjNF9pZHhcbiAgICAgIGxldCBjb252ZXJzaW9uU3RyID0gJyc7XG4gICAgICBpZiAobWVtYmVySW5mby5jb252ZXJ0VG9Cb29sKSB7XG4gICAgICAgIGNvbnZlcnNpb25TdHIgPSAncmV0dXJuICh2YWx1ZSA+IDAuNSkgPyB0cnVlIDogZmFsc2U7JztcbiAgICAgIH1cbiAgICAgIHN0ciArPSBgXG4gIGNvbnN0IGludCAke2luZGljZXNOYW1lfVske2xvY2F0aW9uT2Zmc2V0c192ZWM0X2lkeC5sZW5ndGh9XSA9IGludFske2xvY2F0aW9uT2Zmc2V0c192ZWM0X2lkeC5sZW5ndGh9XSgke2xvY2F0aW9uT2Zmc2V0c192ZWM0X2lkeC5qb2luKCcsICcpfSk7XG4gICR7bWVtYmVySW5mby5jb252ZXJ0VG9Cb29sID8gJ2Jvb2wnIDogdHlwZVN0cn0gZ2V0XyR7bWVtYmVyTmFtZX0odWludCBpbnN0YW5jZUlkLCB1aW50IGlkeE9mQXJyYXkpIHtcbiAgICB1aW50IGluc3RhbmNlSWRPZkJ1ZmZlclZpZXdzID0gaW5zdGFuY2VJZCAvICR7Y29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3fXU7XG4gICAgdWludCBpbnN0YW5jZUlkSW5CdWZmZXJWaWV3ID0gaW5zdGFuY2VJZCAlICR7Y29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3fXU7XG4gICAgJHthcnJheUxlbmd0aFN0cn1cbiAgICAke2luZGV4U3RyfVxuICAgICR7dHlwZVN0cn0gdmFsdWUgPSAke2ZldGNoVHlwZVN0cn0oaW5kZXgpO1xuICAgICR7bWVtYmVySW5mby5jb252ZXJ0VG9Cb29sID8gY29udmVyc2lvblN0ciA6ICdyZXR1cm4gdmFsdWU7J31cbiAgfVxuYDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcHJvY2Vzc0Zvck5vbkFycmF5VHlwZShcbiAgICAgIG1lbWJlckluZm86IE1lbWJlckluZm8sXG4gICAgICBjb21wb25lbnRDbGFzczogdHlwZW9mIENvbXBvbmVudCxcbiAgICAgIG1lbWJlck5hbWU6IHN0cmluZyxcbiAgICAgIGNvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldzogbnVtYmVyXG4gICAgKSB7XG4gICAgICBsZXQgdHlwZVN0ciA9ICcnO1xuICAgICAgbGV0IGZldGNoVHlwZVN0ciA9ICcnO1xuICAgICAgc3dpdGNoIChtZW1iZXJJbmZvLmNvbXBvc2l0aW9uVHlwZSkge1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQ0OlxuICAgICAgICAgIHR5cGVTdHIgPSAnbWF0NCc7XG4gICAgICAgICAgZmV0Y2hUeXBlU3RyID0gJ2ZldGNoTWF0NCc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDM6XG4gICAgICAgICAgdHlwZVN0ciA9ICdtYXQzJztcbiAgICAgICAgICBmZXRjaFR5cGVTdHIgPSAnZmV0Y2hNYXQzTm8xNkJ5dGVzQWxpZ25lZCc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzQ6XG4gICAgICAgICAgdHlwZVN0ciA9ICd2ZWM0JztcbiAgICAgICAgICBmZXRjaFR5cGVTdHIgPSAnZmV0Y2hWZWM0JztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjMzpcbiAgICAgICAgICB0eXBlU3RyID0gJ3ZlYzMnO1xuICAgICAgICAgIGZldGNoVHlwZVN0ciA9ICdmZXRjaFZlYzNObzE2Qnl0ZXNBbGlnbmVkJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuU2NhbGFyOlxuICAgICAgICAgIHR5cGVTdHIgPSAnZmxvYXQnO1xuICAgICAgICAgIGZldGNoVHlwZVN0ciA9ICdmZXRjaFNjYWxhck5vMTZCeXRlc0FsaWduZWQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgY29tcG9zaXRpb24gdHlwZTogJHttZW1iZXJJbmZvLmNvbXBvc2l0aW9uVHlwZS5zdHJ9YCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGxvY2F0aW9uT2Zmc2V0c192ZWM0X2lkeCA9IENvbXBvbmVudC5nZXRMb2NhdGlvbk9mZnNldE9mTWVtYmVyT2ZDb21wb25lbnQoXG4gICAgICAgIGVuZ2luZSxcbiAgICAgICAgY29tcG9uZW50Q2xhc3MsXG4gICAgICAgIG1lbWJlck5hbWVcbiAgICAgICk7XG4gICAgICBjb25zdCBpbmRpY2VzTmFtZSA9IGBybkluZGljZXNfJHttZW1iZXJOYW1lfWA7XG4gICAgICBsZXQgaW5kZXhTdHIgPSAnJztcbiAgICAgIHN3aXRjaCAobWVtYmVySW5mby5jb21wb3NpdGlvblR5cGUpIHtcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0NDpcbiAgICAgICAgICBpbmRleFN0ciA9IGBpbnQgaW5kZXggPSAke2luZGljZXNOYW1lfVtpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3c10gKyA0ICogaW50KGluc3RhbmNlSWRJbkJ1ZmZlclZpZXcpO2A7IC8vIHZlYzRfaWR4XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDM6XG4gICAgICAgICAgaW5kZXhTdHIgPSBgaW50IGluZGV4ID0gJHtpbmRpY2VzTmFtZX1baW5zdGFuY2VJZE9mQnVmZmVyVmlld3NdICogNCArIDkgKiBpbnQoaW5zdGFuY2VJZEluQnVmZmVyVmlldyk7YDsgLy8gc2NhbGFyX2lkeFxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWM0OlxuICAgICAgICAgIGluZGV4U3RyID0gYGludCBpbmRleCA9ICR7aW5kaWNlc05hbWV9W2luc3RhbmNlSWRPZkJ1ZmZlclZpZXdzXSArIDEgKiBpbnQoaW5zdGFuY2VJZEluQnVmZmVyVmlldyk7YDsgLy8gdmVjNF9pZHhcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjMzpcbiAgICAgICAgICBpbmRleFN0ciA9IGBpbnQgaW5kZXggPSAke2luZGljZXNOYW1lfVtpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3c10gKiA0ICsgMyAqIGludChpbnN0YW5jZUlkSW5CdWZmZXJWaWV3KTtgOyAvLyBzY2FsYXJfaWR4XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlNjYWxhcjpcbiAgICAgICAgICBpbmRleFN0ciA9IGBpbnQgaW5kZXggPSAke2luZGljZXNOYW1lfVtpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3c10gKiA0ICsgMSAqIGludChpbnN0YW5jZUlkSW5CdWZmZXJWaWV3KTtgOyAvLyBzY2FsYXJfaWR4XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBjb21wb3NpdGlvbiB0eXBlOiAke21lbWJlckluZm8uY29tcG9zaXRpb25UeXBlLnN0cn1gKTtcbiAgICAgIH1cbiAgICAgIGxldCBjb252ZXJzaW9uU3RyID0gJyc7XG4gICAgICBpZiAobWVtYmVySW5mby5jb252ZXJ0VG9Cb29sKSB7XG4gICAgICAgIGNvbnZlcnNpb25TdHIgPSAncmV0dXJuICh2YWx1ZSA+IDAuNSkgPyB0cnVlIDogZmFsc2U7JztcbiAgICAgIH1cbiAgICAgIC8vIEdsb2JhbCBjb25zdCwgZm9yIHRoZSBzYW1lIHJlYXNvbiBhcyBpbiBwcm9jZXNzRm9yQXJyYXlUeXBlLlxuICAgICAgc3RyICs9IGBcbiAgY29uc3QgaW50ICR7aW5kaWNlc05hbWV9WyR7bG9jYXRpb25PZmZzZXRzX3ZlYzRfaWR4Lmxlbmd0aH1dID0gaW50WyR7bG9jYXRpb25PZmZzZXRzX3ZlYzRfaWR4Lmxlbmd0aH1dKCR7bG9jYXRpb25PZmZzZXRzX3ZlYzRfaWR4LmpvaW4oJywgJyl9KTtcbiAgJHttZW1iZXJJbmZvLmNvbnZlcnRUb0Jvb2wgPyAnYm9vbCcgOiB0eXBlU3RyfSBnZXRfJHttZW1iZXJOYW1lfSh1aW50IGluc3RhbmNlSWQpIHtcbiAgICB1aW50IGluc3RhbmNlSWRPZkJ1ZmZlclZpZXdzID0gaW5zdGFuY2VJZCAvICR7Y29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3fXU7XG4gICAgdWludCBpbnN0YW5jZUlkSW5CdWZmZXJWaWV3ID0gaW5zdGFuY2VJZCAlICR7Y29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3fXU7XG4gICAgJHtpbmRleFN0cn1cbiAgICAke3R5cGVTdHJ9IHZhbHVlID0gJHtmZXRjaFR5cGVTdHJ9KGluZGV4KTtcbiAgICAke21lbWJlckluZm8uY29udmVydFRvQm9vbCA/IGNvbnZlcnNpb25TdHIgOiAncmV0dXJuIHZhbHVlOyd9XG4gIH1cbmA7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRNb3JwaGVkUG9zaXRpb25HZXR0ZXIoZW5naW5lOiBFbmdpbmUpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1vcnBoVW5pZm9ybURhdGFUYXJnZXROdW1iZXJzID0gUHJpbWl0aXZlLmdldE1vcnBoVW5pZm9ybURhdGFUYXJnZXROdW1iZXJzKCk7XG4gICAgY29uc3QgbW9ycGhVbmlmb3JtRGF0YVRhcmdldE51bWJlcnNTdHIgPSBgXG4gICAgY29uc3QgaW50IHJuTW9ycGhVbmlmb3JtRGF0YVRhcmdldE51bWJlcnNbJHttb3JwaFVuaWZvcm1EYXRhVGFyZ2V0TnVtYmVycy5sZW5ndGh9XSA9IGludFske21vcnBoVW5pZm9ybURhdGFUYXJnZXROdW1iZXJzLmxlbmd0aH1dKCR7bW9ycGhVbmlmb3JtRGF0YVRhcmdldE51bWJlcnMuam9pbignLCAnKX0pO1xuICAgIGA7XG4gICAgY29uc3QgbW9ycGhVbmlmb3JtRGF0YU9mZnNldHMgPSBQcmltaXRpdmUuZ2V0TW9ycGhVbmlmb3JtRGF0YU9mZnNldHMoKTtcbiAgICBjb25zdCBtb3JwaFVuaWZvcm1EYXRhT2Zmc2V0c1N0ciA9IGBcbiAgICBjb25zdCBpbnQgcm5Nb3JwaFVuaWZvcm1EYXRhT2Zmc2V0c1ske21vcnBoVW5pZm9ybURhdGFPZmZzZXRzLmxlbmd0aH1dID0gaW50WyR7bW9ycGhVbmlmb3JtRGF0YU9mZnNldHMubGVuZ3RofV0oJHttb3JwaFVuaWZvcm1EYXRhT2Zmc2V0cy5qb2luKCcsICcpfSk7XG4gICAgYDtcbiAgICBjb25zdCBibGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzID0gQmxlbmRTaGFwZUNvbXBvbmVudC5nZXRPZmZzZXRzSW5Vbmlmb3JtKGVuZ2luZSk7XG4gICAgY29uc3QgYmxlbmRTaGFwZVVuaWZvcm1EYXRhT2Zmc2V0c1N0ciA9IGBcbiAgICBjb25zdCBpbnQgcm5CbGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzWyR7YmxlbmRTaGFwZVVuaWZvcm1EYXRhT2Zmc2V0cy5sZW5ndGh9XSA9IGludFske2JsZW5kU2hhcGVVbmlmb3JtRGF0YU9mZnNldHMubGVuZ3RofV0oJHtibGVuZFNoYXBlVW5pZm9ybURhdGFPZmZzZXRzLmpvaW4oJywgJyl9KTtcbiAgICBgO1xuXG4gICAgLy8gVGhlIG1vcnBoZWQgcG9zaXRpb24gd2l0aCB0aGUgd2VpZ2h0cyBvZiB0aGUgcHJldmlvdXMgZnJhbWUgKG1vdGlvbiB2ZWN0b3JzIG9mIHRlbXBvcmFsIGFudGktYWxpYXNpbmcpLlxuICAgIGNvbnN0IHByZXZpb3VzTW9ycGhlZFBvc2l0aW9uU3RyID0gZW5naW5lLl9pc1ByZXZpb3VzTW9ycGhXZWlnaHRzRW5hYmxlZFxuICAgICAgPyBgXG4gICAgICB2ZWMzIGdldF9wcmV2aW91c01vcnBoZWRQb3NpdGlvbih1aW50IHZlcnRleElkLCB2ZWMzIGJhc2VQb3NpdGlvbiwgdWludCBibGVuZFNoYXBlQ29tcG9uZW50U0lEKSB7XG4gICAgICAgIGludCBjdXJyZW50UHJpbWl0aXZlSWR4ID0gdV9jdXJyZW50UHJpbWl0aXZlSWR4O1xuICAgICAgICBpbnQgb2Zmc2V0SW5Vbmlmb3JtID0gcm5Nb3JwaFVuaWZvcm1EYXRhT2Zmc2V0c1tjdXJyZW50UHJpbWl0aXZlSWR4XTtcbiAgICAgICAgaW50IG9mZnNldEluVW5pZm9ybTIgPSBybkJsZW5kU2hhcGVVbmlmb3JtRGF0YU9mZnNldHNbYmxlbmRTaGFwZUNvbXBvbmVudFNJRF0gKyAke0JsZW5kU2hhcGVDb21wb25lbnQuX2dldFByZXZpb3VzTW9ycGhXZWlnaHRzT2Zmc2V0KGVuZ2luZSl9O1xuICAgICAgICB2ZWMzIHBvc2l0aW9uID0gYmFzZVBvc2l0aW9uO1xuICAgICAgICBpbnQgc2NhbGFyX2lkeCA9IDMgKiBpbnQodmVydGV4SWQpO1xuICAgICAgICBmb3IgKGludCBpPTA7IGk8cm5Nb3JwaFVuaWZvcm1EYXRhVGFyZ2V0TnVtYmVyc1tjdXJyZW50UHJpbWl0aXZlSWR4XTsgaSsrKSB7XG4gICAgICAgICAgaW50IGlkeCA9IG9mZnNldEluVW5pZm9ybSArIGk7XG4gICAgICAgICAgaXZlYzQgb2Zmc2V0cyA9IHVuaWZvcm1Nb3JwaE9mZnNldHMuZGF0YVsgaWR4IC8gNF07XG4gICAgICAgICAgaW50IG9mZnNldFBvc2l0aW9uID0gb2Zmc2V0c1tpZHggJSA0XTtcbiAgICAgICAgICBpbnQgYmFzZVBvc0luNGJ5dGVzID0gb2Zmc2V0UG9zaXRpb24gKiA0ICsgc2NhbGFyX2lkeDtcbiAgICAgICAgICB2ZWMzIGFkZFBvcyA9IGZldGNoVmVjM05vMTZCeXRlc0FsaWduZWQoYmFzZVBvc0luNGJ5dGVzKTtcbiAgICAgICAgICBpbnQgaWR4MiA9IG9mZnNldEluVW5pZm9ybTIgKyBpO1xuICAgICAgICAgIHZlYzQgbW9ycGhXZWlnaHRzID0gdW5pZm9ybU1vcnBoV2VpZ2h0cy5kYXRhWyBpZHgyIC8gNF07XG4gICAgICAgICAgcG9zaXRpb24gKz0gYWRkUG9zICogbW9ycGhXZWlnaHRzW2lkeDIgJSA0XTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcG9zaXRpb247XG4gICAgICB9YFxuICAgICAgOiAnJztcbiAgICBjb25zdCBtb3JwaGluZ1N0ciA9IGBcbiAgICAjaWZkZWYgUk5fSVNfVkVSVEVYX1NIQURFUlxuICAgICAgI2lmZGVmIFJOX0lTX01PUlBISU5HXG4gICAgICAke21vcnBoVW5pZm9ybURhdGFUYXJnZXROdW1iZXJzU3RyfVxuICAgICAgJHttb3JwaFVuaWZvcm1EYXRhT2Zmc2V0c1N0cn1cbiAgICAgICR7YmxlbmRTaGFwZVVuaWZvcm1EYXRhT2Zmc2V0c1N0cn1cbiAgICAgIHZlYzMgZ2V0X3Bvc2l0aW9uKHVpbnQgdmVydGV4SWQsIHZlYzMgYmFzZVBvc2l0aW9uLCB1aW50IGJsZW5kU2hhcGVDb21wb25lbnRTSUQpIHtcbiAgICAgICAgaW50IGN1cnJlbnRQcmltaXRpdmVJZHggPSB1X2N1cnJlbnRQcmltaXRpdmVJZHg7XG4gICAgICAgIGludCBvZmZzZXRJblVuaWZvcm0gPSBybk1vcnBoVW5pZm9ybURhdGFPZmZzZXRzW2N1cnJlbnRQcmltaXRpdmVJZHhdO1xuICAgICAgICBpbnQgb2Zmc2V0SW5Vbmlmb3JtMiA9IHJuQmxlbmRTaGFwZVVuaWZvcm1EYXRhT2Zmc2V0c1tibGVuZFNoYXBlQ29tcG9uZW50U0lEXTtcbiAgICAgICAgdmVjMyBwb3NpdGlvbiA9IGJhc2VQb3NpdGlvbjtcbiAgICAgICAgaW50IHNjYWxhcl9pZHggPSAzICogaW50KHZlcnRleElkKTtcbiAgICAgICAgZm9yIChpbnQgaT0wOyBpPHJuTW9ycGhVbmlmb3JtRGF0YVRhcmdldE51bWJlcnNbY3VycmVudFByaW1pdGl2ZUlkeF07IGkrKykge1xuICAgICAgICAgIGludCBpZHggPSBvZmZzZXRJblVuaWZvcm0gKyBpO1xuICAgICAgICAgIGl2ZWM0IG9mZnNldHMgPSB1bmlmb3JtTW9ycGhPZmZzZXRzLmRhdGFbIGlkeCAvIDRdO1xuICAgICAgICAgIGludCBvZmZzZXRQb3NpdGlvbiA9IG9mZnNldHNbaWR4ICUgNF07XG5cbiAgICAgICAgICBpbnQgYmFzZVBvc0luNGJ5dGVzID0gb2Zmc2V0UG9zaXRpb24gKiA0ICsgc2NhbGFyX2lkeDtcbiAgICAgICAgICB2ZWMzIGFkZFBvcyA9IGZldGNoVmVjM05vMTZCeXRlc0FsaWduZWQoYmFzZVBvc0luNGJ5dGVzKTtcblxuICAgICAgICAgIGludCBpZHgyID0gb2Zmc2V0SW5Vbmlmb3JtMiArIGk7XG4gICAgICAgICAgdmVjNCBtb3JwaFdlaWdodHMgPSB1bmlmb3JtTW9ycGhXZWlnaHRzLmRhdGFbIGlkeDIgLyA0XTtcbiAgICAgICAgICBmbG9hdCBtb3JwaFdlaWdodCA9IG1vcnBoV2VpZ2h0c1tpZHgyICUgNF07XG5cbiAgICAgICAgICBwb3NpdGlvbiArPSBhZGRQb3MgKiBtb3JwaFdlaWdodDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwb3NpdGlvbjtcbiAgICAgIH1cbiAgICAgICR7cHJldmlvdXNNb3JwaGVkUG9zaXRpb25TdHJ9XG4gICAgICAjZW5kaWZcbiAgICAjZW5kaWZcbiAgICBgO1xuXG4gICAgcmV0dXJuIG1vcnBoaW5nU3RyO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgYSBzaGFkZXIgcHJvZ3JhbSBmb3IgdGhlIHNwZWNpZmllZCBtYXRlcmlhbCBhbmQgcHJpbWl0aXZlLlxuICAgKiBUaGlzIG1ldGhvZCBjcmVhdGVzIGFuZCBjb25maWd1cmVzIHRoZSBjb21wbGV0ZSBzaGFkZXIgcHJvZ3JhbSBpbmNsdWRpbmdcbiAgICogdW5pZm9ybSBsb2NhdGlvbnMgYW5kIGRhdGEgdGV4dHVyZS1zcGVjaWZpYyBzaGFkZXIgZGVmaW5pdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCB0aGF0IHJlcXVpcmVzIHNoYWRlciBzZXR1cFxuICAgKiBAcGFyYW0gcHJpbWl0aXZlIC0gVGhlIHByaW1pdGl2ZSBnZW9tZXRyeSB0aGF0IHdpbGwgdXNlIHRoaXMgc2hhZGVyXG4gICAqIEByZXR1cm5zIFRoZSByZXNvdXJjZSBoYW5kbGUgb2YgdGhlIGNyZWF0ZWQgb3IgcmV0cmlldmVkIHNoYWRlciBwcm9ncmFtXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGhhbmRsZXM6XG4gICAqIC0gQ3JlYXRpbmcgdGhlIFdlYkdMIHNoYWRlciBwcm9ncmFtIHdpdGggZGF0YSB0ZXh0dXJlIG1ldGhvZCBkZWZpbml0aW9uc1xuICAgKiAtIFNldHRpbmcgdXAgYmFzaWMgdW5pZm9ybSBsb2NhdGlvbnMgZm9yIHRoZSBtYXRlcmlhbFxuICAgKiAtIENvbmZpZ3VyaW5nIG1hdGVyaWFsIG5vZGUgdW5pZm9ybSBsb2NhdGlvbnNcbiAgICogLSBTZXR0aW5nIHVwIGFkZGl0aW9uYWwgdW5pZm9ybSBsb2NhdGlvbnMgZm9yIHBvaW50IHNwcml0ZXNcbiAgICogLSBDb25maWd1cmluZyBkYXRhIHRleHR1cmUtc3BlY2lmaWMgdW5pZm9ybSBsb2NhdGlvbnNcbiAgICovXG4gIHB1YmxpYyBzZXR1cFNoYWRlckZvck1hdGVyaWFsKG1hdGVyaWFsOiBNYXRlcmlhbCwgcHJpbWl0aXZlOiBQcmltaXRpdmUpOiBDR0FQSVJlc291cmNlSGFuZGxlIHtcbiAgICBjb25zdCB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgY29uc3QgX2dsdyA9IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmN1cnJlbnRXZWJHTENvbnRleHRXcmFwcGVyITtcblxuICAgIGNvbnN0IFtwcm9ncmFtVWlkLCBuZXdPbmVdID0gbWF0ZXJpYWwuX2NyZWF0ZVByb2dyYW1XZWJHTChcbiAgICAgIHRoaXMuX19lbmdpbmUsXG4gICAgICBXZWJHTFN0cmF0ZWd5V2ViR0wyLl9fZ2V0Q29tcG9uZW50RGF0YUFjY2Vzc01ldGhvZERlZmluaXRpb25zX2RhdGFUZXh0dXJlKHRoaXMuX19lbmdpbmUsIFNoYWRlclR5cGUuVmVydGV4U2hhZGVyKSxcbiAgICAgIFdlYkdMU3RyYXRlZ3lXZWJHTDIuX19nZXRDb21wb25lbnREYXRhQWNjZXNzTWV0aG9kRGVmaW5pdGlvbnNfZGF0YVRleHR1cmUodGhpcy5fX2VuZ2luZSwgU2hhZGVyVHlwZS5QaXhlbFNoYWRlciksXG4gICAgICBXZWJHTFN0cmF0ZWd5V2ViR0wyLl9fZ2V0U2hhZGVyUHJvcGVydHlPZkdsb2JhbERhdGFSZXBvc2l0b3J5LFxuICAgICAgV2ViR0xTdHJhdGVneVdlYkdMMi5fX2dldFNoYWRlclByb3BlcnR5T2ZNYXRlcmlhbCxcbiAgICAgIFdlYkdMU3RyYXRlZ3lXZWJHTDIuX19nZXRNb3JwaGVkUG9zaXRpb25HZXR0ZXIodGhpcy5fX2VuZ2luZSksXG4gICAgICBwcmltaXRpdmVcbiAgICApO1xuXG4gICAgaWYgKG5ld09uZSkge1xuICAgICAgbWF0ZXJpYWwuX3NldHVwQmFzaWNVbmlmb3Jtc0xvY2F0aW9ucyhwcmltaXRpdmUpO1xuXG4gICAgICBtYXRlcmlhbC5fc2V0VW5pZm9ybUxvY2F0aW9uc09mTWF0ZXJpYWxOb2RlcyhwcmltaXRpdmUpO1xuXG4gICAgICBtYXRlcmlhbC5fc2V0dXBBZGRpdGlvbmFsVW5pZm9ybUxvY2F0aW9ucyhcbiAgICAgICAgV2ViR0xTdHJhdGVneUNvbW1vbk1ldGhvZC5nZXRQb2ludFNwcml0ZVNoYWRlclNlbWFudGljc0luZm9BcnJheSgpLFxuICAgICAgICBwcmltaXRpdmVcbiAgICAgICk7XG5cbiAgICAgIHRoaXMuX19lbmdpbmUuZ2xvYmFsRGF0YVJlcG9zaXRvcnkuX3NldFVuaWZvcm1Mb2NhdGlvbnNGb3JXZWJHTDJNb2RlT25seShtYXRlcmlhbC5nZXRTaGFkZXJQcm9ncmFtVWlkKHByaW1pdGl2ZSkpO1xuXG4gICAgICB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5zZXRVbmlmb3JtQmxvY2tCaW5kaW5nRm9yTW9ycGhPZmZzZXRzQW5kV2VpZ2h0cyhcbiAgICAgICAgcHJvZ3JhbVVpZCxcbiAgICAgICAgdGhpcy5fX21vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJVaWQsXG4gICAgICAgIHRoaXMuX19tb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyVWlkXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBwcm9ncmFtVWlkO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlLWVzdGFibGlzaGVzIGEgc2hhZGVyIHByb2dyYW0gZm9yIGEgbWF0ZXJpYWwgdXNpbmcgdXBkYXRlZCBzaGFkZXIgc291cmNlcy5cbiAgICogVGhpcyBtZXRob2QgaXMgdHlwaWNhbGx5IGNhbGxlZCBieSBkZWJ1Z2dpbmcgdG9vbHMgbGlrZSBTcGVjdG9yLmpzIHdoZW5cbiAgICogc2hhZGVyIHNvdXJjZXMgYXJlIG1vZGlmaWVkIGF0IHJ1bnRpbWUgZm9yIGluc3BlY3Rpb24gb3IgZGVidWdnaW5nLlxuICAgKlxuICAgKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgd2hvc2Ugc2hhZGVyIG5lZWRzIHRvIGJlIHJlLXNldHVwXG4gICAqIEBwYXJhbSBwcmltaXRpdmUgLSBUaGUgcHJpbWl0aXZlIGdlb21ldHJ5IGFzc29jaWF0ZWQgd2l0aCB0aGUgc2hhZGVyXG4gICAqIEBwYXJhbSB1cGRhdGVkU2hhZGVyU291cmNlcyAtIFRoZSBtb2RpZmllZCBzaGFkZXIgc291cmNlIGNvZGVcbiAgICogQHBhcmFtIG9uRXJyb3IgLSBDYWxsYmFjayBmdW5jdGlvbiB0byBoYW5kbGUgY29tcGlsYXRpb24gb3IgbGlua2luZyBlcnJvcnNcbiAgICogQHJldHVybnMgVGhlIHJlc291cmNlIGhhbmRsZSBvZiB0aGUgdXBkYXRlZCBzaGFkZXIgcHJvZ3JhbSwgb3IgSW52YWxpZENHQVBJUmVzb3VyY2VVaWQgb24gZmFpbHVyZVxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCBwZXJmb3JtcyB0aGUgc2FtZSBzZXR1cCBhcyBzZXR1cFNoYWRlckZvck1hdGVyaWFsIGJ1dCB1c2VzXG4gICAqIGV4dGVybmFsbHkgcHJvdmlkZWQgc2hhZGVyIHNvdXJjZXMgaW5zdGVhZCBvZiBnZW5lcmF0aW5nIHRoZW0uIEl0J3MgcHJpbWFyaWx5XG4gICAqIHVzZWQgZm9yIGRlYnVnZ2luZyB3b3JrZmxvd3Mgd2hlcmUgc2hhZGVycyBhcmUgbW9kaWZpZWQgYXQgcnVudGltZS5cbiAgICovXG4gIHB1YmxpYyBfcmVTZXR1cFNoYWRlckZvck1hdGVyaWFsQnlTcGVjdG9yKFxuICAgIG1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgICBwcmltaXRpdmU6IFByaW1pdGl2ZSxcbiAgICB1cGRhdGVkU2hhZGVyU291cmNlczogU2hhZGVyU291cmNlcyxcbiAgICBvbkVycm9yOiAobWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkXG4gICk6IENHQVBJUmVzb3VyY2VIYW5kbGUge1xuICAgIGNvbnN0IFtwcm9ncmFtVWlkLCBuZXdPbmVdID0gbWF0ZXJpYWwuX2NyZWF0ZVByb2dyYW1CeVVwZGF0ZWRTb3VyY2VzKHVwZGF0ZWRTaGFkZXJTb3VyY2VzLCBwcmltaXRpdmUsIG9uRXJyb3IpO1xuICAgIGlmIChwcm9ncmFtVWlkID09PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgcmV0dXJuIHByb2dyYW1VaWQ7XG4gICAgfVxuXG4gICAgaWYgKG5ld09uZSkge1xuICAgICAgbWF0ZXJpYWwuX3NldHVwQmFzaWNVbmlmb3Jtc0xvY2F0aW9ucyhwcmltaXRpdmUpO1xuXG4gICAgICBtYXRlcmlhbC5fc2V0VW5pZm9ybUxvY2F0aW9uc09mTWF0ZXJpYWxOb2RlcyhwcmltaXRpdmUpO1xuXG4gICAgICBtYXRlcmlhbC5fc2V0dXBBZGRpdGlvbmFsVW5pZm9ybUxvY2F0aW9ucyhcbiAgICAgICAgV2ViR0xTdHJhdGVneUNvbW1vbk1ldGhvZC5nZXRQb2ludFNwcml0ZVNoYWRlclNlbWFudGljc0luZm9BcnJheSgpLFxuICAgICAgICBwcmltaXRpdmVcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdGhpcy5fX2VuZ2luZS5nbG9iYWxEYXRhUmVwb3NpdG9yeS5fc2V0VW5pZm9ybUxvY2F0aW9uc0ZvcldlYkdMMk1vZGVPbmx5KG1hdGVyaWFsLmdldFNoYWRlclByb2dyYW1VaWQocHJpbWl0aXZlKSk7XG5cbiAgICByZXR1cm4gcHJvZ3JhbVVpZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgR0xTTCBzaGFkZXIgY29kZSBmb3IgYWNjZXNzaW5nIGdsb2JhbCBwcm9wZXJ0aWVzLlxuICAgKiBUaGlzIG1ldGhvZCBjcmVhdGVzIHNoYWRlciBmdW5jdGlvbnMgdGhhdCBjYW4gZmV0Y2ggZGF0YSBmcm9tIGVpdGhlciBkYXRhIHRleHR1cmVzXG4gICAqIG9yIHVuaWZvcm0gdmFyaWFibGVzLCBkZXBlbmRpbmcgb24gdGhlIHByb3BlcnR5IHR5cGUgYW5kIHJlbmRlcmluZyBjb25maWd1cmF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gaW5mbyAtIERldGFpbGVkIGluZm9ybWF0aW9uIGFib3V0IHRoZSBzaGFkZXIgc2VtYW50aWMgcHJvcGVydHlcbiAgICogQHJldHVybnMgR0xTTCBzaGFkZXIgY29kZSBzdHJpbmcgZm9yIHRoZSBwcm9wZXJ0eSBhY2Nlc3NvciBmdW5jdGlvblxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCBoYW5kbGVzIGRpZmZlcmVudCBkYXRhIHR5cGVzIGluY2x1ZGluZzpcbiAgICogLSBTY2FsYXJzLCB2ZWN0b3JzLCBhbmQgbWF0cmljZXMgb2YgdmFyaW91cyBzaXplc1xuICAgKiAtIEFycmF5IHR5cGVzIHdpdGggcHJvcGVyIGluZGV4aW5nXG4gICAqIC0gVGV4dHVyZSBzYW1wbGVyc1xuICAgKiAtIFByb3BlcnRpZXMgdGhhdCByZXF1aXJlIGV4cGxpY2l0IHVuaWZvcm0gdmFyaWFibGVzXG4gICAqIFRoZSBnZW5lcmF0ZWQgY29kZSBvcHRpbWl6ZXMgZGF0YSBhY2Nlc3MgYmFzZWQgb24gdGhlIHByb3BlcnR5IGxheW91dCBpbiBkYXRhIHRleHR1cmVzLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRTaGFkZXJQcm9wZXJ0eU9mR2xvYmFsRGF0YVJlcG9zaXRvcnkoZW5naW5lOiBFbmdpbmUsIGluZm86IFNoYWRlclNlbWFudGljc0luZm8pIHtcbiAgICBjb25zdCByZXR1cm5UeXBlID0gaW5mby5jb21wb3NpdGlvblR5cGUuZ2V0R2xzbFN0cihpbmZvLmNvbXBvbmVudFR5cGUpO1xuXG4gICAgbGV0IGluZGV4U3RyOiBzdHJpbmc7XG5cbiAgICBjb25zdCBpc1RleHR1cmUgPSBDb21wb3NpdGlvblR5cGUuaXNUZXh0dXJlKGluZm8uY29tcG9zaXRpb25UeXBlKTtcblxuICAgIGNvbnN0IG1ldGhvZE5hbWUgPSBpbmZvLnNlbWFudGljLnJlcGxhY2UoJy4nLCAnXycpO1xuXG4gICAgLy8gZGVmaW5pdGlvbiBvZiB1bmlmb3JtIHZhcmlhYmxlIGZvciB0ZXh0dXJlIHNhbXBsZXIgb3Igd2hhdCBtdXN0IGJlIGV4cGxpY2l0bHkgdW5pZm9ybSB2YXJpYWJsKVxuICAgIGxldCB2YXJEZWYgPSAnJztcbiAgICBjb25zdCB2YXJUeXBlID0gaW5mby5jb21wb3NpdGlvblR5cGUuZ2V0R2xzbFN0cihpbmZvLmNvbXBvbmVudFR5cGUpO1xuICAgIGxldCB2YXJJbmRleFN0ciA9ICcnO1xuICAgIGlmIChpbmZvLmFycmF5TGVuZ3RoKSB7XG4gICAgICB2YXJJbmRleFN0ciA9IGBbJHtpbmZvLmFycmF5TGVuZ3RofV1gO1xuICAgIH1cbiAgICBpZiAoaW5mby5uZWVkVW5pZm9ybUluRGF0YVRleHR1cmVNb2RlIHx8IGlzVGV4dHVyZSkge1xuICAgICAgdmFyRGVmID0gYCAgdW5pZm9ybSAke3ZhclR5cGV9IHVfJHttZXRob2ROYW1lfSR7dmFySW5kZXhTdHJ9O1xcbmA7XG4gICAgfVxuXG4gICAgLy8gaW5uZXIgY29udGVudHMgb2YgJ2dldF8nIHNoYWRlciBmdW5jdGlvblxuICAgIGNvbnN0IHZlYzRTaXplT2ZQcm9wZXJ0eTogSW5kZXhPZjE2Qnl0ZXMgPSBpbmZvLmNvbXBvc2l0aW9uVHlwZS5nZXRWZWM0U2l6ZU9mUHJvcGVydHkoKTtcbiAgICAvLyBmb3Igbm9uLWBpbmRleGAgcHJvcGVydHkgKHRoaXMgaXMgZ2VuZXJhbCBjYXNlKVxuICAgIGNvbnN0IHNjYWxhclNpemVPZlByb3BlcnR5OiBJbmRleE9mNEJ5dGVzID0gaW5mby5jb21wb3NpdGlvblR5cGUuZ2V0TnVtYmVyT2ZDb21wb25lbnRzKCk7XG4gICAgY29uc3Qgb2Zmc2V0T2ZQcm9wZXJ0eTogSW5kZXhPZjE2Qnl0ZXMgPSBXZWJHTFN0cmF0ZWd5V2ViR0wyLmdldE9mZnNldE9mUHJvcGVydHlPZkdsb2JhbERhdGFSZXBvc2l0b3J5KFxuICAgICAgZW5naW5lLFxuICAgICAgaW5mby5zZW1hbnRpY1xuICAgICk7XG5cbiAgICBpZiAob2Zmc2V0T2ZQcm9wZXJ0eSA9PT0gLTEpIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdDb3VsZCBub3QgZ2V0IHRoZSBsb2NhdGlvbiBvZmZzZXQgb2YgdGhlIHByb3BlcnR5LicpO1xuICAgIH1cblxuICAgIGxldCBpbnN0YW5jZVNpemUgPSB2ZWM0U2l6ZU9mUHJvcGVydHk7XG4gICAgaW5kZXhTdHIgPSBgaW50IHZlYzRfaWR4ID0gJHtvZmZzZXRPZlByb3BlcnR5fSArICR7aW5zdGFuY2VTaXplfSAqIGluc3RhbmNlSWQ7XFxuYDtcbiAgICBpZiAoQ29tcG9zaXRpb25UeXBlLmlzQXJyYXkoaW5mby5jb21wb3NpdGlvblR5cGUpKSB7XG4gICAgICBpbnN0YW5jZVNpemUgPSB2ZWM0U2l6ZU9mUHJvcGVydHkgKiAoaW5mby5hcnJheUxlbmd0aCA/PyAxKTtcbiAgICAgIGNvbnN0IHBhZGRlZEFzVmVjNCA9IE1hdGguY2VpbChzY2FsYXJTaXplT2ZQcm9wZXJ0eSAvIDQpICogNDtcbiAgICAgIGNvbnN0IGluc3RhbmNlU2l6ZUluU2NhbGFyID0gcGFkZGVkQXNWZWM0ICogKGluZm8uYXJyYXlMZW5ndGggPz8gMSk7XG4gICAgICBpbmRleFN0ciA9IGBpbnQgdmVjNF9pZHggPSAke29mZnNldE9mUHJvcGVydHl9ICsgJHtpbnN0YW5jZVNpemV9ICogaW5zdGFuY2VJZCArICR7dmVjNFNpemVPZlByb3BlcnR5fSAqIGludChpZHhPZkFycmF5KTtcXG5gO1xuICAgICAgaW5kZXhTdHIgKz0gYGludCBzY2FsYXJfaWR4ID0gJHtcbiAgICAgICAgLy8gSW5kZXhPZjRCeXRlc1xuICAgICAgICBvZmZzZXRPZlByb3BlcnR5ICogNCAvLyBJbmRleE9mMTZieXRlcyB0byBJbmRleE9mNEJ5dGVzXG4gICAgICB9ICsgJHtpbnN0YW5jZVNpemVJblNjYWxhcn0gKiBpbnN0YW5jZUlkICsgJHtzY2FsYXJTaXplT2ZQcm9wZXJ0eX0gKiBpbnQoaWR4T2ZBcnJheSk7XFxuYDtcbiAgICB9XG5cbiAgICBsZXQgaW50U3RyID0gJyc7XG4gICAgaWYgKGluZm8uY29tcG9uZW50VHlwZSA9PT0gQ29tcG9uZW50VHlwZS5JbnQgJiYgaW5mby5jb21wb3NpdGlvblR5cGUgIT09IENvbXBvc2l0aW9uVHlwZS5TY2FsYXIpIHtcbiAgICAgIGludFN0ciA9ICdpJztcbiAgICB9XG5cbiAgICBsZXQgZmlyc3RQYXJ0T2ZJbm5lckZ1bmMgPSAnJztcbiAgICBpZiAoIWlzVGV4dHVyZSAmJiAhaW5mby5uZWVkVW5pZm9ybUluRGF0YVRleHR1cmVNb2RlKSB7XG4gICAgICBmaXJzdFBhcnRPZklubmVyRnVuYyArPSBgXG4ke3JldHVyblR5cGV9IGdldF8ke21ldGhvZE5hbWV9KGhpZ2hwIHVpbnQgX2luc3RhbmNlSWQsIGNvbnN0IHVpbnQgaWR4T2ZBcnJheSkge1xuICBpbnQgaW5zdGFuY2VJZCA9IGludChfaW5zdGFuY2VJZCk7XG4gICR7aW5kZXhTdHJ9XG4gIGA7XG5cbiAgICAgIGxldCBzdHIgPSBgJHt2YXJEZWZ9XFxuJHtmaXJzdFBhcnRPZklubmVyRnVuY31gO1xuXG4gICAgICBzd2l0Y2ggKGluZm8uY29tcG9zaXRpb25UeXBlKSB7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzQ6XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzRBcnJheTpcbiAgICAgICAgICBzdHIgKz0gJyAgICAgICAgaGlnaHAgdmVjNCB2YWwgPSBmZXRjaEVsZW1lbnQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlZlYzM6XG4gICAgICAgICAgc3RyICs9ICcgICAgICAgIHZlYzQgY29sMCA9IGZldGNoRWxlbWVudCh2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgICBzdHIgKz0gYCAgICAgICAgaGlnaHAgJHtpbnRTdHJ9dmVjMyB2YWwgPSAke2ludFN0cn12ZWMzKGNvbDAueHl6KTtgO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWMzQXJyYXk6XG4gICAgICAgICAgc3RyICs9ICcgICAgICAgIHZlYzMgdmFsID0gZmV0Y2hWZWMzTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWMyOlxuICAgICAgICAgIHN0ciArPSAnICAgICAgICBoaWdocCB2ZWM0IGNvbDAgPSBmZXRjaEVsZW1lbnQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgICAgc3RyICs9IGAgICAgICAgIGhpZ2hwICR7aW50U3RyfXZlYzIgdmFsID0gJHtpbnRTdHJ9dmVjMihjb2wwLnh5KTtgO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWMyQXJyYXk6XG4gICAgICAgICAgc3RyICs9ICcgICAgICAgIGhpZ2hwIHZlYzIgdmFsID0gZmV0Y2hWZWMyTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5TY2FsYXI6XG4gICAgICAgICAgc3RyICs9ICcgICAgICAgIHZlYzQgY29sMCA9IGZldGNoRWxlbWVudCh2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgICBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkludCkge1xuICAgICAgICAgICAgc3RyICs9ICcgICAgICAgIGludCB2YWwgPSBpbnQoY29sMC54KTsnO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkJvb2wpIHtcbiAgICAgICAgICAgIHN0ciArPSAnICAgICAgICBib29sIHZhbCA9IGJvb2woY29sMC54KTsnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHIgKz0gJyAgICAgICBmbG9hdCB2YWwgPSBjb2wwLng7JztcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLlNjYWxhckFycmF5OlxuICAgICAgICAgIHN0ciArPSAnICAgICAgICBmbG9hdCBjb2wwID0gZmV0Y2hTY2FsYXJObzE2Qnl0ZXNBbGlnbmVkKHNjYWxhcl9pZHgpO1xcbic7XG4gICAgICAgICAgaWYgKGluZm8uY29tcG9uZW50VHlwZSA9PT0gQ29tcG9uZW50VHlwZS5JbnQpIHtcbiAgICAgICAgICAgIHN0ciArPSAnICAgICAgICBpbnQgdmFsID0gaW50KGNvbDApOyc7XG4gICAgICAgICAgfSBlbHNlIGlmIChpbmZvLmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuQm9vbCkge1xuICAgICAgICAgICAgc3RyICs9ICcgICAgICAgIGJvb2wgdmFsID0gYm9vbChjb2wwKTsnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHIgKz0gJyAgICAgICBmbG9hdCB2YWwgPSBjb2wwOyc7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQ0OlxuICAgICAgICAgIHN0ciArPSAnICAgICAgICBtYXQ0IHZhbCA9IGZldGNoTWF0NCh2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0NEFycmF5OlxuICAgICAgICAgIHN0ciArPSAnICAgICAgICBtYXQ0IHZhbCA9IGZldGNoTWF0NCh2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0MzpcbiAgICAgICAgICBzdHIgKz0gJyAgICAgICAgbWF0MyB2YWwgPSBmZXRjaE1hdDModmVjNF9pZHgpO1xcbic7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDNBcnJheTpcbiAgICAgICAgICBzdHIgKz0gJyAgICAgICAgbWF0MyB2YWwgPSBmZXRjaE1hdDNObzE2Qnl0ZXNBbGlnbmVkKHNjYWxhcl9pZHgpO1xcbic7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDI6XG4gICAgICAgICAgc3RyICs9ICcgICAgICAgIG1hdDIgdmFsID0gZmV0Y2hNYXQyKHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQyQXJyYXk6XG4gICAgICAgICAgc3RyICs9ICcgICAgICAgIG1hdDIgdmFsID0gZmV0Y2hNYXQyTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQ0eDNBcnJheTpcbiAgICAgICAgICBzdHIgKz0gJyAgICAgICAgbWF0NHgzIHZhbCA9IGZldGNoTWF0NHgzKHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIC8vIExvZ2dlci5kZWZhdWx0LmVycm9yKCd1bmtub3duIGNvbXBvc2l0aW9uIHR5cGUnLCBpbmZvLmNvbXBvc2l0aW9uVHlwZS5zdHIsIG1lbWJlck5hbWUpO1xuICAgICAgICAgIHN0ciArPSAnJztcbiAgICAgIH1cbiAgICAgIHN0ciArPSBgXG4gIHJldHVybiB2YWw7XG59XG5gO1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgaWYgKCFpc1RleHR1cmUgJiYgaW5mby5uZWVkVW5pZm9ybUluRGF0YVRleHR1cmVNb2RlKSB7XG4gICAgICBsZXQgdmFySW5kZXhTdHIgPSAnJztcbiAgICAgIGlmIChpbmZvLmFycmF5TGVuZ3RoKSB7XG4gICAgICAgIHZhckluZGV4U3RyID0gJ1tpZHhPZkFycmF5XSc7XG4gICAgICB9XG4gICAgICBjb25zdCBzdHIgPSBgJHt2YXJEZWZ9XG4ke3JldHVyblR5cGV9IGdldF8ke21ldGhvZE5hbWV9KGhpZ2hwIHVpbnQgX2luc3RhbmNlSWQsIGNvbnN0IHVpbnQgaWR4T2ZBcnJheSkge1xuICByZXR1cm4gdV8ke21ldGhvZE5hbWV9JHt2YXJJbmRleFN0cn07XG59XG5gO1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgcmV0dXJuIHZhckRlZjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgR0xTTCBzaGFkZXIgY29kZSBmb3IgYWNjZXNzaW5nIG1hdGVyaWFsIHByb3BlcnRpZXMuXG4gICAqIFRoaXMgbWV0aG9kIGNyZWF0ZXMgc2hhZGVyIGZ1bmN0aW9ucyB0aGF0IGNhbiBmZXRjaCBkYXRhIGZyb20gZWl0aGVyIGRhdGEgdGV4dHVyZXNcbiAgICogb3IgdW5pZm9ybSB2YXJpYWJsZXMsIGRlcGVuZGluZyBvbiB0aGUgcHJvcGVydHkgdHlwZSBhbmQgcmVuZGVyaW5nIGNvbmZpZ3VyYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBpbmZvIC0gRGV0YWlsZWQgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHNoYWRlciBzZW1hbnRpYyBwcm9wZXJ0eVxuICAgKiBAcmV0dXJucyBHTFNMIHNoYWRlciBjb2RlIHN0cmluZyBmb3IgdGhlIHByb3BlcnR5IGFjY2Vzc29yIGZ1bmN0aW9uXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGhhbmRsZXMgZGlmZmVyZW50IGRhdGEgdHlwZXMgaW5jbHVkaW5nOlxuICAgKiAtIFNjYWxhcnMsIHZlY3RvcnMsIGFuZCBtYXRyaWNlcyBvZiB2YXJpb3VzIHNpemVzXG4gICAqIC0gQXJyYXkgdHlwZXMgd2l0aCBwcm9wZXIgaW5kZXhpbmdcbiAgICogLSBUZXh0dXJlIHNhbXBsZXJzXG4gICAqIC0gUHJvcGVydGllcyB0aGF0IHJlcXVpcmUgZXhwbGljaXQgdW5pZm9ybSB2YXJpYWJsZXNcbiAgICogVGhlIGdlbmVyYXRlZCBjb2RlIG9wdGltaXplcyBkYXRhIGFjY2VzcyBiYXNlZCBvbiB0aGUgcHJvcGVydHkgbGF5b3V0IGluIGRhdGEgdGV4dHVyZXMuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldFNoYWRlclByb3BlcnR5T2ZNYXRlcmlhbChlbmdpbmU6IEVuZ2luZSwgbWF0ZXJpYWxUeXBlTmFtZTogc3RyaW5nLCBpbmZvOiBTaGFkZXJTZW1hbnRpY3NJbmZvKSB7XG4gICAgY29uc3QgcmV0dXJuVHlwZSA9IGluZm8uY29tcG9zaXRpb25UeXBlLmdldEdsc2xTdHIoaW5mby5jb21wb25lbnRUeXBlKTtcblxuICAgIGxldCBpbmRleFN0cjogc3RyaW5nO1xuXG4gICAgY29uc3QgaXNUZXh0dXJlID0gQ29tcG9zaXRpb25UeXBlLmlzVGV4dHVyZShpbmZvLmNvbXBvc2l0aW9uVHlwZSk7XG5cbiAgICBjb25zdCBtZXRob2ROYW1lID0gaW5mby5zZW1hbnRpYy5yZXBsYWNlKCcuJywgJ18nKTtcblxuICAgIC8vIGRlZmluaXRpb24gb2YgdW5pZm9ybSB2YXJpYWJsZSBmb3IgdGV4dHVyZSBzYW1wbGVyIG9yIHdoYXQgbXVzdCBiZSBleHBsaWNpdGx5IHVuaWZvcm0gdmFyaWFibClcbiAgICBsZXQgdmFyRGVmID0gJyc7XG4gICAgY29uc3QgdmFyVHlwZSA9IGluZm8uY29tcG9zaXRpb25UeXBlLmdldEdsc2xTdHIoaW5mby5jb21wb25lbnRUeXBlKTtcbiAgICBsZXQgdmFySW5kZXhTdHIgPSAnJztcbiAgICBpZiAoaW5mby5hcnJheUxlbmd0aCkge1xuICAgICAgdmFySW5kZXhTdHIgPSBgWyR7aW5mby5hcnJheUxlbmd0aH1dYDtcbiAgICB9XG4gICAgaWYgKGluZm8ubmVlZFVuaWZvcm1JbkRhdGFUZXh0dXJlTW9kZSB8fCBpc1RleHR1cmUpIHtcbiAgICAgIHZhckRlZiA9IGAgIHVuaWZvcm0gJHt2YXJUeXBlfSB1XyR7bWV0aG9kTmFtZX0ke3ZhckluZGV4U3RyfTtcXG5gO1xuICAgIH1cblxuICAgIC8vIGlubmVyIGNvbnRlbnRzIG9mICdnZXRfJyBzaGFkZXIgZnVuY3Rpb25cbiAgICBjb25zdCB2ZWM0U2l6ZU9mUHJvcGVydHk6IEluZGV4T2YxNkJ5dGVzID0gaW5mby5jb21wb3NpdGlvblR5cGUuZ2V0VmVjNFNpemVPZlByb3BlcnR5KCk7XG4gICAgLy8gZm9yIG5vbi1gaW5kZXhgIHByb3BlcnR5ICh0aGlzIGlzIGdlbmVyYWwgY2FzZSlcbiAgICBjb25zdCBzY2FsYXJTaXplT2ZQcm9wZXJ0eTogSW5kZXhPZjRCeXRlcyA9IGluZm8uY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpO1xuICAgIGNvbnN0IG9mZnNldE9mUHJvcGVydHk6IEluZGV4T2YxNkJ5dGVzW10gPSBXZWJHTFN0cmF0ZWd5V2ViR0wyLmdldE9mZnNldE9mUHJvcGVydHlPZk1hdGVyaWFsKFxuICAgICAgZW5naW5lLFxuICAgICAgaW5mby5zZW1hbnRpYyxcbiAgICAgIG1hdGVyaWFsVHlwZU5hbWVcbiAgICApO1xuICAgIGNvbnN0IG1hdGVyaWFsQ291bnRQZXJCdWZmZXJWaWV3ID0gZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5fZ2V0TWF0ZXJpYWxDb3VudFBlckJ1ZmZlclZpZXcobWF0ZXJpYWxUeXBlTmFtZSkhO1xuXG4gICAgLy8gR2xvYmFsIGNvbnN0OiBhIGxvY2FsIGFycmF5IGluaXRpYWxpemVyIHJ1bnMgb24gZXZlcnkgY2FsbCwgd2hpY2ggaXMgZXhwZW5zaXZlIHdoZW4gdGhlIG1hdGVyaWFsIHR5cGUgc3BhbnNcbiAgICAvLyBtYW55IGJ1ZmZlciB2aWV3cy5cbiAgICBjb25zdCBvZmZzZXRzTmFtZSA9IGBybk9mZnNldHNfJHttZXRob2ROYW1lfWA7XG4gICAgY29uc3Qgb2Zmc2V0U3RyID0gYGNvbnN0IGludCAke29mZnNldHNOYW1lfVske29mZnNldE9mUHJvcGVydHkubGVuZ3RofV0gPSBpbnRbJHtvZmZzZXRPZlByb3BlcnR5Lmxlbmd0aH1dKCR7b2Zmc2V0T2ZQcm9wZXJ0eS5qb2luKCcsICcpfSk7YDtcblxuICAgIGxldCBpbnN0YW5jZVNpemUgPSB2ZWM0U2l6ZU9mUHJvcGVydHk7XG4gICAgaW5kZXhTdHIgPSBgaW50IHZlYzRfaWR4ID0gJHtvZmZzZXRzTmFtZX1baW5zdGFuY2VJZE9mQnVmZmVyVmlld3NdICsgJHtpbnN0YW5jZVNpemV9ICogaW50KGluc3RhbmNlSWRJbkJ1ZmZlclZpZXcpO1xcbmA7XG4gICAgaWYgKENvbXBvc2l0aW9uVHlwZS5pc0FycmF5KGluZm8uY29tcG9zaXRpb25UeXBlKSkge1xuICAgICAgaW5zdGFuY2VTaXplID0gdmVjNFNpemVPZlByb3BlcnR5ICogKGluZm8uYXJyYXlMZW5ndGggPz8gMSk7XG4gICAgICBjb25zdCBwYWRkZWRBc1ZlYzQgPSBNYXRoLmNlaWwoc2NhbGFyU2l6ZU9mUHJvcGVydHkgLyA0KSAqIDQ7XG4gICAgICBjb25zdCBpbnN0YW5jZVNpemVJblNjYWxhciA9IHBhZGRlZEFzVmVjNCAqIChpbmZvLmFycmF5TGVuZ3RoID8/IDEpO1xuICAgICAgaW5kZXhTdHIgPSBgaW50IHZlYzRfaWR4ID0gJHtvZmZzZXRzTmFtZX1baW5zdGFuY2VJZE9mQnVmZmVyVmlld3NdICsgJHtpbnN0YW5jZVNpemV9ICogaW50KGluc3RhbmNlSWRJbkJ1ZmZlclZpZXcpICsgJHt2ZWM0U2l6ZU9mUHJvcGVydHl9ICogaW50KGlkeE9mQXJyYXkpO1xcbmA7XG4gICAgICBpbmRleFN0ciArPSBgaW50IHNjYWxhcl9pZHggPSAke29mZnNldHNOYW1lfVtpbnN0YW5jZUlkT2ZCdWZmZXJWaWV3c10gKiA0ICsgJHtpbnN0YW5jZVNpemVJblNjYWxhcn0gKiBpbnQoaW5zdGFuY2VJZEluQnVmZmVyVmlldykgKyAke3NjYWxhclNpemVPZlByb3BlcnR5fSAqIGludChpZHhPZkFycmF5KTtcXG5gO1xuICAgIH1cblxuICAgIGxldCBpbnRTdHIgPSAnJztcbiAgICBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkludCAmJiBpbmZvLmNvbXBvc2l0aW9uVHlwZSAhPT0gQ29tcG9zaXRpb25UeXBlLlNjYWxhcikge1xuICAgICAgaW50U3RyID0gJ2knO1xuICAgIH1cblxuICAgIGxldCBmaXJzdFBhcnRPZklubmVyRnVuYyA9ICcnO1xuICAgIGlmICghaXNUZXh0dXJlICYmICFpbmZvLm5lZWRVbmlmb3JtSW5EYXRhVGV4dHVyZU1vZGUpIHtcbiAgICAgIGZpcnN0UGFydE9mSW5uZXJGdW5jICs9IGBcbiR7b2Zmc2V0U3RyfVxuJHtyZXR1cm5UeXBlfSBnZXRfJHttZXRob2ROYW1lfShoaWdocCB1aW50IF9pbnN0YW5jZUlkLCBjb25zdCB1aW50IGlkeE9mQXJyYXkpIHtcbiAgdWludCBpbnN0YW5jZUlkID0gX2luc3RhbmNlSWQ7XG4gIHVpbnQgaW5zdGFuY2VJZE9mQnVmZmVyVmlld3MgPSBpbnN0YW5jZUlkIC8gJHttYXRlcmlhbENvdW50UGVyQnVmZmVyVmlld311O1xuICB1aW50IGluc3RhbmNlSWRJbkJ1ZmZlclZpZXcgPSBpbnN0YW5jZUlkICUgJHttYXRlcmlhbENvdW50UGVyQnVmZmVyVmlld311O1xuICAke2luZGV4U3RyfVxuICBgO1xuXG4gICAgICBsZXQgc3RyID0gYCR7dmFyRGVmfVxcbiR7Zmlyc3RQYXJ0T2ZJbm5lckZ1bmN9YDtcblxuICAgICAgc3dpdGNoIChpbmZvLmNvbXBvc2l0aW9uVHlwZSkge1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWM0OlxuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWM0QXJyYXk6XG4gICAgICAgICAgc3RyICs9ICcgICAgICAgIGhpZ2hwIHZlYzQgdmFsID0gZmV0Y2hFbGVtZW50KHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5WZWMzOlxuICAgICAgICAgIHN0ciArPSAnICAgICAgICB2ZWM0IGNvbDAgPSBmZXRjaEVsZW1lbnQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgICAgc3RyICs9IGAgICAgICAgIGhpZ2hwICR7aW50U3RyfXZlYzMgdmFsID0gJHtpbnRTdHJ9dmVjMyhjb2wwLnh5eik7YDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjM0FycmF5OlxuICAgICAgICAgIHN0ciArPSAnICAgICAgICB2ZWMzIHZhbCA9IGZldGNoVmVjM05vMTZCeXRlc0FsaWduZWQoc2NhbGFyX2lkeCk7XFxuJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjMjpcbiAgICAgICAgICBzdHIgKz0gJyAgICAgICAgaGlnaHAgdmVjNCBjb2wwID0gZmV0Y2hFbGVtZW50KHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICAgIHN0ciArPSBgICAgICAgICBoaWdocCAke2ludFN0cn12ZWMyIHZhbCA9ICR7aW50U3RyfXZlYzIoY29sMC54eSk7YDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuVmVjMkFycmF5OlxuICAgICAgICAgIHN0ciArPSAnICAgICAgICBoaWdocCB2ZWMyIHZhbCA9IGZldGNoVmVjMk5vMTZCeXRlc0FsaWduZWQoc2NhbGFyX2lkeCk7XFxuJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuU2NhbGFyOlxuICAgICAgICAgIHN0ciArPSAnICAgICAgICB2ZWM0IGNvbDAgPSBmZXRjaEVsZW1lbnQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgICAgaWYgKGluZm8uY29tcG9uZW50VHlwZSA9PT0gQ29tcG9uZW50VHlwZS5JbnQpIHtcbiAgICAgICAgICAgIHN0ciArPSAnICAgICAgICBpbnQgdmFsID0gaW50KGNvbDAueCk7JztcbiAgICAgICAgICB9IGVsc2UgaWYgKGluZm8uY29tcG9uZW50VHlwZSA9PT0gQ29tcG9uZW50VHlwZS5Cb29sKSB7XG4gICAgICAgICAgICBzdHIgKz0gJyAgICAgICAgYm9vbCB2YWwgPSBib29sKGNvbDAueCk7JztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RyICs9ICcgICAgICAgZmxvYXQgdmFsID0gY29sMC54Oyc7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5TY2FsYXJBcnJheTpcbiAgICAgICAgICBzdHIgKz0gJyAgICAgICAgZmxvYXQgY29sMCA9IGZldGNoU2NhbGFyTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICAgIGlmIChpbmZvLmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuSW50KSB7XG4gICAgICAgICAgICBzdHIgKz0gJyAgICAgICAgaW50IHZhbCA9IGludChjb2wwKTsnO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaW5mby5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkJvb2wpIHtcbiAgICAgICAgICAgIHN0ciArPSAnICAgICAgICBib29sIHZhbCA9IGJvb2woY29sMCk7JztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RyICs9ICcgICAgICAgZmxvYXQgdmFsID0gY29sMDsnO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0NDpcbiAgICAgICAgICBzdHIgKz0gJyAgICAgICAgbWF0NCB2YWwgPSBmZXRjaE1hdDQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDRBcnJheTpcbiAgICAgICAgICBzdHIgKz0gJyAgICAgICAgbWF0NCB2YWwgPSBmZXRjaE1hdDQodmVjNF9pZHgpO1xcbic7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tcG9zaXRpb25UeXBlLk1hdDM6XG4gICAgICAgICAgc3RyICs9ICcgICAgICAgIG1hdDMgdmFsID0gZmV0Y2hNYXQzKHZlYzRfaWR4KTtcXG4nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQzQXJyYXk6XG4gICAgICAgICAgc3RyICs9ICcgICAgICAgIG1hdDMgdmFsID0gZmV0Y2hNYXQzTm8xNkJ5dGVzQWxpZ25lZChzY2FsYXJfaWR4KTtcXG4nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbXBvc2l0aW9uVHlwZS5NYXQyOlxuICAgICAgICAgIHN0ciArPSAnICAgICAgICBtYXQyIHZhbCA9IGZldGNoTWF0Mih2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0MkFycmF5OlxuICAgICAgICAgIHN0ciArPSAnICAgICAgICBtYXQyIHZhbCA9IGZldGNoTWF0Mk5vMTZCeXRlc0FsaWduZWQoc2NhbGFyX2lkeCk7XFxuJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21wb3NpdGlvblR5cGUuTWF0NHgzQXJyYXk6XG4gICAgICAgICAgc3RyICs9ICcgICAgICAgIG1hdDR4MyB2YWwgPSBmZXRjaE1hdDR4Myh2ZWM0X2lkeCk7XFxuJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAvLyBMb2dnZXIuZGVmYXVsdC5lcnJvcigndW5rbm93biBjb21wb3NpdGlvbiB0eXBlJywgaW5mby5jb21wb3NpdGlvblR5cGUuc3RyLCBtZW1iZXJOYW1lKTtcbiAgICAgICAgICBzdHIgKz0gJyc7XG4gICAgICB9XG4gICAgICBzdHIgKz0gYFxuICByZXR1cm4gdmFsO1xufVxuYDtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIGlmICghaXNUZXh0dXJlICYmIGluZm8ubmVlZFVuaWZvcm1JbkRhdGFUZXh0dXJlTW9kZSkge1xuICAgICAgbGV0IHZhckluZGV4U3RyID0gJyc7XG4gICAgICBpZiAoaW5mby5hcnJheUxlbmd0aCkge1xuICAgICAgICB2YXJJbmRleFN0ciA9ICdbaWR4T2ZBcnJheV0nO1xuICAgICAgfVxuICAgICAgY29uc3Qgc3RyID0gYCR7dmFyRGVmfVxuJHtyZXR1cm5UeXBlfSBnZXRfJHttZXRob2ROYW1lfShoaWdocCB1aW50IF9pbnN0YW5jZUlkLCBjb25zdCB1aW50IGlkeE9mQXJyYXkpIHtcbiAgcmV0dXJuIHVfJHttZXRob2ROYW1lfSR7dmFySW5kZXhTdHJ9O1xufVxuYDtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIHJldHVybiB2YXJEZWY7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIHRoZSBvZmZzZXQgcG9zaXRpb24gb2YgYSBwcm9wZXJ0eSB3aXRoaW4gdGhlIHNoYWRlciBkYXRhIGxheW91dC5cbiAgICogVGhpcyBtZXRob2QgY2FsY3VsYXRlcyB3aGVyZSBhIHNwZWNpZmljIHByb3BlcnR5IGlzIGxvY2F0ZWQgaW4gZWl0aGVyIHRoZVxuICAgKiBnbG9iYWwgZGF0YSByZXBvc2l0b3J5IG9yIG1hdGVyaWFsLXNwZWNpZmljIGRhdGEgc3RvcmFnZS5cbiAgICpcbiAgICogQHBhcmFtIGlzR2xvYmFsRGF0YSAtIFdoZXRoZXIgdG8gbG9vayBpbiBnbG9iYWwgZGF0YSBvciBtYXRlcmlhbC1zcGVjaWZpYyBkYXRhXG4gICAqIEBwYXJhbSBwcm9wZXJ0eU5hbWUgLSBUaGUgc2VtYW50aWMgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gbG9jYXRlXG4gICAqIEBwYXJhbSBtYXRlcmlhbFR5cGVOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIG1hdGVyaWFsIHR5cGUgKHVzZWQgZm9yIG1hdGVyaWFsLXNwZWNpZmljIHByb3BlcnRpZXMpXG4gICAqIEByZXR1cm5zIFRoZSBvZmZzZXQgcG9zaXRpb24gb2YgdGhlIHByb3BlcnR5IGluIHRoZSBkYXRhIGxheW91dCwgb3IgLTEgaWYgbm90IGZvdW5kXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGlzIGVzc2VudGlhbCBmb3IgZ2VuZXJhdGluZyBjb3JyZWN0IHNoYWRlciBjb2RlIHRoYXQgY2FuIGFjY2Vzc1xuICAgKiBwcm9wZXJ0aWVzIGZyb20gdGhlIGRhdGEgdGV4dHVyZSBhdCB0aGUgcmlnaHQgbWVtb3J5IGxvY2F0aW9ucy5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIGdldE9mZnNldE9mUHJvcGVydHlPZk1hdGVyaWFsKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHByb3BlcnR5TmFtZTogU2hhZGVyU2VtYW50aWNzTmFtZSxcbiAgICBtYXRlcmlhbFR5cGVOYW1lOiBzdHJpbmdcbiAgKSB7XG4gICAgY29uc3QgZGF0YUJlZ2luUG9zID0gZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5nZXRMb2NhdGlvbk9mZnNldE9mTWVtYmVyT2ZNYXRlcmlhbChcbiAgICAgIGVuZ2luZSxcbiAgICAgIG1hdGVyaWFsVHlwZU5hbWUsXG4gICAgICBwcm9wZXJ0eU5hbWVcbiAgICApO1xuICAgIHJldHVybiBkYXRhQmVnaW5Qb3M7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIHRoZSBvZmZzZXQgcG9zaXRpb24gb2YgYSBwcm9wZXJ0eSB3aXRoaW4gdGhlIGdsb2JhbCBkYXRhIHJlcG9zaXRvcnkuXG4gICAqIFRoaXMgbWV0aG9kIGNhbGN1bGF0ZXMgd2hlcmUgYSBzcGVjaWZpYyBwcm9wZXJ0eSBpcyBsb2NhdGVkIGluIHRoZSBnbG9iYWwgZGF0YSByZXBvc2l0b3J5LlxuICAgKlxuICAgKiBAcGFyYW0gcHJvcGVydHlOYW1lIC0gVGhlIHNlbWFudGljIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIGxvY2F0ZVxuICAgKiBAcmV0dXJucyBUaGUgb2Zmc2V0IHBvc2l0aW9uIG9mIHRoZSBwcm9wZXJ0eSBpbiB0aGUgZ2xvYmFsIGRhdGEgcmVwb3NpdG9yeSwgb3IgLTEgaWYgbm90IGZvdW5kXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGlzIGVzc2VudGlhbCBmb3IgZ2VuZXJhdGluZyBjb3JyZWN0IHNoYWRlciBjb2RlIHRoYXQgY2FuIGFjY2Vzc1xuICAgKiBwcm9wZXJ0aWVzIGZyb20gdGhlIGRhdGEgdGV4dHVyZSBhdCB0aGUgcmlnaHQgbWVtb3J5IGxvY2F0aW9ucy5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIGdldE9mZnNldE9mUHJvcGVydHlPZkdsb2JhbERhdGFSZXBvc2l0b3J5KGVuZ2luZTogRW5naW5lLCBwcm9wZXJ0eU5hbWU6IFNoYWRlclNlbWFudGljc05hbWUpIHtcbiAgICBjb25zdCBnbG9iYWxEYXRhUmVwb3NpdG9yeSA9IGVuZ2luZS5nbG9iYWxEYXRhUmVwb3NpdG9yeTtcbiAgICBjb25zdCBkYXRhQmVnaW5Qb3MgPSBnbG9iYWxEYXRhUmVwb3NpdG9yeS5nZXRMb2NhdGlvbk9mZnNldE9mUHJvcGVydHkocHJvcGVydHlOYW1lKTtcbiAgICByZXR1cm4gZGF0YUJlZ2luUG9zO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIGFuZCBwcmVwYXJlcyBhIG1lc2ggY29tcG9uZW50IGZvciByZW5kZXJpbmcgd2l0aCB0aGUgZGF0YSB0ZXh0dXJlIHN0cmF0ZWd5LlxuICAgKiBUaGlzIG1ldGhvZCB2YWxpZGF0ZXMgdGhlIG1lc2gsIHVwZGF0ZXMgY3VycmVudCBjb21wb25lbnQgU0lEcywgYW5kIGVuc3VyZXNcbiAgICogdGhlIG1lc2gncyBWQk8gYW5kIFZBTyBhcmUgcHJvcGVybHkgc2V0IHVwLlxuICAgKlxuICAgKiBAcGFyYW0gbWVzaENvbXBvbmVudCAtIFRoZSBtZXNoIGNvbXBvbmVudCB0byBsb2FkIGFuZCBwcmVwYXJlIGZvciByZW5kZXJpbmdcbiAgICogQHJldHVybnMgdHJ1ZSBpZiB0aGUgbWVzaCB3YXMgc3VjY2Vzc2Z1bGx5IGxvYWRlZCwgZmFsc2UgaWYgdGhlcmUgd2FzIGFuIGVycm9yXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIHBlcmZvcm1zIHNldmVyYWwgaW1wb3J0YW50IHRhc2tzOlxuICAgKiAtIFZhbGlkYXRlcyB0aGF0IHRoZSBtZXNoIGNvbXBvbmVudCBoYXMgYSB2YWxpZCBtZXNoXG4gICAqIC0gVXBkYXRlcyB0aGUgY3VycmVudCBjb21wb25lbnQgU0lEcyBmb3IgZGF0YSB0ZXh0dXJlIGFjY2Vzc1xuICAgKiAtIFRyaWdnZXJzIFZCTy9WQU8gc2V0dXAgaWYgdGhlIG1lc2ggaGFzbid0IGJlZW4gc2V0IHVwIHlldFxuICAgKiAtIERlbGV0ZXMgYW5kIHJlY3JlYXRlcyB0aGUgZGF0YSB0ZXh0dXJlIGlmIG5lZWRlZCBmb3IgbWVzaCB1cGRhdGVzXG4gICAqL1xuICAkbG9hZChtZXNoQ29tcG9uZW50OiBNZXNoQ29tcG9uZW50KSB7XG4gICAgY29uc3QgbWVzaCA9IG1lc2hDb21wb25lbnQubWVzaCBhcyBNZXNoO1xuICAgIGlmIChtZXNoID09IG51bGwpIHtcbiAgICAgIE1lc2hDb21wb25lbnQuYWxlcnROb01lc2hTZXQobWVzaENvbXBvbmVudCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhpcy5fX2N1cnJlbnRDb21wb25lbnRTSURzID0gdGhpcy5fX2VuZ2luZS5nbG9iYWxEYXRhUmVwb3NpdG9yeS5nZXRWYWx1ZSgnY3VycmVudENvbXBvbmVudFNJRHMnLCAwKTtcblxuICAgIC8vIHVwZGF0ZSBWQk8gYW5kIFZBT1xuICAgIGlmICghbWVzaC5pc1NldFVwRG9uZSgpKSB7XG4gICAgICB0aGlzLmRlbGV0ZURhdGFUZXh0dXJlKCk7IC8vIGRlbGV0ZSBkYXRhIHRleHR1cmUgdG8gcmVjcmVhdGUgb25lIG9uIG5leHRcbiAgICAgIG1lc2guX3VwZGF0ZVZCT0FuZFZBTygpO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBfX3VwZGF0ZU1vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJzSW5uZXIoKSB7XG4gICAgY29uc3QgbW9ycGhVbmlmb3JtRGF0YU9mZnNldHMgPSBQcmltaXRpdmUuZ2V0TW9ycGhVbmlmb3JtRGF0YU9mZnNldHMoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IFByaW1pdGl2ZS5nZXRQcmltaXRpdmVDb3VudEhhc01vcnBoKCk7IGkrKykge1xuICAgICAgY29uc3QgcHJpbWl0aXZlID0gUHJpbWl0aXZlLmdldFByaW1pdGl2ZUhhc01vcnBoKGkpO1xuICAgICAgaWYgKHByaW1pdGl2ZSAhPSBudWxsKSB7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcHJpbWl0aXZlLnRhcmdldHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBjb25zdCB0YXJnZXQgPSBwcmltaXRpdmUudGFyZ2V0c1tqXTtcbiAgICAgICAgICBjb25zdCBhY2Nlc3NvciA9IHRhcmdldC5nZXQoVmVydGV4QXR0cmlidXRlLlBvc2l0aW9uLlhZWikgYXMgQWNjZXNzb3I7XG4gICAgICAgICAgY29uc3QgYnl0ZU9mZnNldE9mRXhpc3RpbmdCdWZmZXIgPSB0aGlzLl9fZW5naW5lLm1lbW9yeU1hbmFnZXIuZ2V0Qnl0ZU9mZnNldE9mRXhpc3RpbmdCdWZmZXJzKFxuICAgICAgICAgICAgQnVmZmVyVXNlLkdQVVZlcnRleERhdGEsXG4gICAgICAgICAgICBhY2Nlc3Nvci5idWZmZXJWaWV3LmJ1ZmZlci5pbmRleE9mVGhlQnVmZmVyVXNhZ2VcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMuX191bmlmb3JtTW9ycGhPZmZzZXRzVHlwZWRBcnJheSFbbW9ycGhVbmlmb3JtRGF0YU9mZnNldHNbaV0gKyBqXSA9XG4gICAgICAgICAgICAodGhpcy5fX2VuZ2luZS5lbmdpbmVTdGF0ZS50b3RhbFNpemVPZkdQVVNoYWRlckRhdGFTdG9yYWdlRXhjZXB0TW9ycGhEYXRhICtcbiAgICAgICAgICAgICAgYnl0ZU9mZnNldE9mRXhpc3RpbmdCdWZmZXIgK1xuICAgICAgICAgICAgICBhY2Nlc3Nvci5ieXRlT2Zmc2V0SW5CdWZmZXIpIC9cbiAgICAgICAgICAgIDQgL1xuICAgICAgICAgICAgNDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGVsZW1lbnROdW1Ub0NvcHkgPSBtb3JwaFVuaWZvcm1EYXRhT2Zmc2V0c1ttb3JwaFVuaWZvcm1EYXRhT2Zmc2V0cy5sZW5ndGggLSAxXTtcbiAgICB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LnVwZGF0ZVVuaWZvcm1CdWZmZXIoXG4gICAgICB0aGlzLl9fbW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlclVpZCxcbiAgICAgIHRoaXMuX191bmlmb3JtTW9ycGhPZmZzZXRzVHlwZWRBcnJheSEsXG4gICAgICAwLFxuICAgICAgZWxlbWVudE51bVRvQ29weVxuICAgICk7XG4gIH1cblxuICBjb21tb25fJGxvYWQoKTogdm9pZCB7XG4gICAgdGhpcy5fX2luaXRNb3JwaFVuaWZvcm1CdWZmZXJzKCk7XG4gIH1cblxuICBwcml2YXRlIF9faW5pdE1vcnBoVW5pZm9ybUJ1ZmZlcnMoKSB7XG4gICAgbGV0IG5lZWRzUmViaW5kTW9ycGhVbmlmb3JtQnVmZmVycyA9IGZhbHNlO1xuICAgIGNvbnN0IG1vcnBoVW5pZm9ybURhdGFPZmZzZXRzID0gUHJpbWl0aXZlLmdldE1vcnBoVW5pZm9ybURhdGFPZmZzZXRzKCk7XG4gICAgY29uc3QgbW9ycGhPZmZzZXRzVW5pZm9ybURhdGFTaXplID0gTWF0aC5tYXgoXG4gICAgICBNYXRoLmNlaWwobW9ycGhVbmlmb3JtRGF0YU9mZnNldHNbbW9ycGhVbmlmb3JtRGF0YU9mZnNldHMubGVuZ3RoIC0gMV0gLyA0KSAqIDQgKiA0LFxuICAgICAgNFxuICAgICk7XG5cbiAgICBpZiAobW9ycGhPZmZzZXRzVW5pZm9ybURhdGFTaXplICE9PSB0aGlzLl9fbGFzdE1vcnBoT2Zmc2V0c1VuaWZvcm1EYXRhU2l6ZSkge1xuICAgICAgLy8gZGVsZXRlIHRoZSBvbGQgbW9ycGggb2Zmc2V0cyB1bmlmb3JtIGJ1ZmZlclxuICAgICAgaWYgKHRoaXMuX19tb3JwaE9mZnNldHNVbmlmb3JtQnVmZmVyVWlkICE9PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgICB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmRlbGV0ZVVuaWZvcm1CdWZmZXIodGhpcy5fX21vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJVaWQpO1xuICAgICAgICB0aGlzLl9fbW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlclVpZCA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICAgICAgfVxuICAgICAgLy8gY3JlYXRlIHRoZSBuZXcgbW9ycGggb2Zmc2V0cyB1bmlmb3JtIGJ1ZmZlclxuICAgICAgdGhpcy5fX2xhc3RNb3JwaE9mZnNldHNVbmlmb3JtRGF0YVNpemUgPSBtb3JwaE9mZnNldHNVbmlmb3JtRGF0YVNpemU7XG4gICAgICBpZiAodGhpcy5fX21vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJVaWQgPT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkKSB7XG4gICAgICAgIGNvbnN0IGlucHV0QXJyYXlPZmZzZXRzID0gbmV3IFVpbnQzMkFycmF5KG1vcnBoT2Zmc2V0c1VuaWZvcm1EYXRhU2l6ZSk7XG4gICAgICAgIHRoaXMuX191bmlmb3JtTW9ycGhPZmZzZXRzVHlwZWRBcnJheSA9IGlucHV0QXJyYXlPZmZzZXRzO1xuICAgICAgICB0aGlzLl9fbW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlclVpZCA9XG4gICAgICAgICAgdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5jcmVhdGVVbmlmb3JtQnVmZmVyV2l0aEJ1ZmZlclZpZXcoaW5wdXRBcnJheU9mZnNldHMpO1xuICAgICAgICB0aGlzLl9fdXBkYXRlTW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlcnNJbm5lcigpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9fbGFzdE1vcnBoT2Zmc2V0c1VuaWZvcm1EYXRhU2l6ZSA9IG1vcnBoT2Zmc2V0c1VuaWZvcm1EYXRhU2l6ZTtcblxuICAgICAgbmVlZHNSZWJpbmRNb3JwaFVuaWZvcm1CdWZmZXJzID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBibGVuZFNoYXBlV2VpZ2h0c1VuaWZvcm1EYXRhU2l6ZSA9IEJsZW5kU2hhcGVDb21wb25lbnQuX2dldE1vcnBoV2VpZ2h0c1VuaWZvcm1CdWZmZXJGbG9hdENvdW50KHRoaXMuX19lbmdpbmUpO1xuXG4gICAgaWYgKGJsZW5kU2hhcGVXZWlnaHRzVW5pZm9ybURhdGFTaXplICE9PSB0aGlzLl9fbGFzdE1vcnBoV2VpZ2h0c1VuaWZvcm1EYXRhU2l6ZSkge1xuICAgICAgLy8gZGVsZXRlIHRoZSBvbGQgbW9ycGggd2VpZ2h0cyB1bmlmb3JtIGJ1ZmZlclxuICAgICAgaWYgKHRoaXMuX19tb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyVWlkICE9PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgICB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmRlbGV0ZVVuaWZvcm1CdWZmZXIodGhpcy5fX21vcnBoV2VpZ2h0c1VuaWZvcm1CdWZmZXJVaWQpO1xuICAgICAgICB0aGlzLl9fbW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlclVpZCA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICAgICAgfVxuXG4gICAgICAvLyBjcmVhdGUgdGhlIG5ldyBtb3JwaCB3ZWlnaHRzIHVuaWZvcm0gYnVmZmVyXG4gICAgICBpZiAodGhpcy5fX21vcnBoV2VpZ2h0c1VuaWZvcm1CdWZmZXJVaWQgPT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkKSB7XG4gICAgICAgIGNvbnN0IGlucHV0QXJyYXlXZWlnaHRzID0gbmV3IEZsb2F0MzJBcnJheShibGVuZFNoYXBlV2VpZ2h0c1VuaWZvcm1EYXRhU2l6ZSk7XG4gICAgICAgIHRoaXMuX191bmlmb3JtTW9ycGhXZWlnaHRzVHlwZWRBcnJheSA9IGlucHV0QXJyYXlXZWlnaHRzO1xuICAgICAgICB0aGlzLl9fbW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlclVpZCA9XG4gICAgICAgICAgdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5jcmVhdGVVbmlmb3JtQnVmZmVyV2l0aEJ1ZmZlclZpZXcoaW5wdXRBcnJheVdlaWdodHMpO1xuICAgICAgICB0aGlzLl9fdXBkYXRlTW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlcih0cnVlKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fX2xhc3RNb3JwaFdlaWdodHNVbmlmb3JtRGF0YVNpemUgPSBibGVuZFNoYXBlV2VpZ2h0c1VuaWZvcm1EYXRhU2l6ZTtcblxuICAgICAgbmVlZHNSZWJpbmRNb3JwaFVuaWZvcm1CdWZmZXJzID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAobmVlZHNSZWJpbmRNb3JwaFVuaWZvcm1CdWZmZXJzKSB7XG4gICAgICB0aGlzLl9fYmluZE1vcnBoVW5pZm9ybUJ1ZmZlcnMoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9fYmluZE1vcnBoVW5pZm9ybUJ1ZmZlcnMoKSB7XG4gICAgaWYgKFxuICAgICAgdGhpcy5fX21vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJVaWQgIT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkICYmXG4gICAgICB0aGlzLl9fbW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlclVpZCAhPT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWRcbiAgICApIHtcbiAgICAgIHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuc2V0VW5pZm9ybUJsb2NrQmluZGluZ0Zvck1vcnBoT2Zmc2V0c0FuZFdlaWdodHNXaXRob3V0U2hhZGVyUHJvZ3JhbShcbiAgICAgICAgdGhpcy5fX21vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJVaWQsXG4gICAgICAgIHRoaXMuX19tb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyVWlkXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX191cGRhdGVNb3JwaE9mZnNldHNVbmlmb3JtQnVmZmVycygpIHtcbiAgICBjb25zdCBtb3JwaE1heEluZGV4ID0gUHJpbWl0aXZlLmdldFByaW1pdGl2ZUNvdW50SGFzTW9ycGgoKTtcbiAgICBpZiAoXG4gICAgICBtb3JwaE1heEluZGV4ICE9PSB0aGlzLl9fbGFzdE1vcnBoTWF4SW5kZXggfHxcbiAgICAgIHRoaXMuX19lbmdpbmUuZW5naW5lU3RhdGUudG90YWxTaXplT2ZHUFVTaGFkZXJEYXRhU3RvcmFnZUV4Y2VwdE1vcnBoRGF0YSAhPT1cbiAgICAgICAgdGhpcy5fX2xhc3RUb3RhbFNpemVPZkdQVVNoYWRlckRhdGFTdG9yYWdlRXhjZXB0TW9ycGhEYXRhXG4gICAgKSB7XG4gICAgICB0aGlzLl9fdXBkYXRlTW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlcnNJbm5lcigpO1xuICAgICAgdGhpcy5fX2xhc3RUb3RhbFNpemVPZkdQVVNoYWRlckRhdGFTdG9yYWdlRXhjZXB0TW9ycGhEYXRhID1cbiAgICAgICAgdGhpcy5fX2VuZ2luZS5lbmdpbmVTdGF0ZS50b3RhbFNpemVPZkdQVVNoYWRlckRhdGFTdG9yYWdlRXhjZXB0TW9ycGhEYXRhO1xuICAgICAgdGhpcy5fX2xhc3RNb3JwaE1heEluZGV4ID0gbW9ycGhNYXhJbmRleDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbmQgdXBkYXRlcyB0aGUgZGF0YSB0ZXh0dXJlIHdpdGggY3VycmVudCBzaGFkZXIgZGF0YS5cbiAgICogVGhpcyBpcyB0aGUgbWFpbiBlbnRyeSBwb2ludCBmb3IgZGF0YSB0ZXh0dXJlIG1hbmFnZW1lbnQgdGhhdCBoYW5kbGVzXG4gICAqIHRoZSBjb21wbGV0ZSB1cGRhdGUgcHJvY2Vzcy5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBtZXRob2QgZGVsZWdhdGVzIHRvIF9fY3JlYXRlQW5kVXBkYXRlRGF0YVRleHR1cmVJbm5lciB3aXRoIG5vIHNpemUgbGltaXQsXG4gICAqIGVuc3VyaW5nIHRoZSBlbnRpcmUgR1BVIGluc3RhbmNlIGRhdGEgYnVmZmVyIGlzIGNvcGllZCB0byB0aGUgZGF0YSB0ZXh0dXJlLlxuICAgKi9cbiAgcHJpdmF0ZSBfX2NyZWF0ZUFuZFVwZGF0ZURhdGFUZXh0dXJlKCkge1xuICAgIHRoaXMuX19jcmVhdGVBbmRVcGRhdGVEYXRhVGV4dHVyZUlubmVyKCk7XG4gIH1cblxuICAvKipcbiAgICogSW50ZXJuYWwgaW1wbGVtZW50YXRpb24gZm9yIGNyZWF0aW5nIGFuZCB1cGRhdGluZyB0aGUgZGF0YSB0ZXh0dXJlLlxuICAgKiBUaGlzIG1ldGhvZCBoYW5kbGVzIHRoZSBhY3R1YWwgdGV4dHVyZSBjcmVhdGlvbiwgZGF0YSBjb3B5aW5nLCBhbmQgR1BVIHVwbG9hZC5cbiAgICpcbiAgICogQHBhcmFtIF9jb3B5U2l6ZUluQnl0ZSAtIE9wdGlvbmFsIGxpbWl0IG9uIGhvdyBtYW55IGJ5dGVzIHRvIGNvcHkgZnJvbSB0aGUgR1BVIGluc3RhbmNlIGRhdGEgYnVmZmVyXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIHBlcmZvcm1zIHNldmVyYWwgY3JpdGljYWwgb3BlcmF0aW9uczpcbiAgICogLSBSZXRyaWV2ZXMgdGhlIEdQVSBpbnN0YW5jZSBkYXRhIGJ1ZmZlciBmcm9tIG1lbW9yeSBtYW5hZ2VyXG4gICAqIC0gQ2FsY3VsYXRlcyBhcHByb3ByaWF0ZSB0ZXh0dXJlIHNpemUgYmFzZWQgb24gYXZhaWxhYmxlIGRhdGFcbiAgICogLSBIYW5kbGVzIGJvdGggdGV4dHVyZSBjcmVhdGlvbiAoZmlyc3QgdGltZSkgYW5kIHRleHR1cmUgdXBkYXRlcyAoc3Vic2VxdWVudCBjYWxscylcbiAgICogLSBDb21iaW5lcyBHUFUgaW5zdGFuY2UgZGF0YSB3aXRoIG1vcnBoIHRhcmdldCBkYXRhIGZvciBjb21wbGV0ZSB0ZXh0dXJlXG4gICAqIC0gUHJvdmlkZXMgZGVidWcgZnVuY3Rpb25hbGl0eSB0byBkdW1wIHRleHR1cmUgY29udGVudHNcbiAgICogLSBNYW5hZ2VzIHRleHR1cmUgYWxpZ25tZW50IGFuZCBwYWRkaW5nIHJlcXVpcmVtZW50c1xuICAgKi9cbiAgcHJpdmF0ZSBfX2NyZWF0ZUFuZFVwZGF0ZURhdGFUZXh0dXJlSW5uZXIoKSB7XG4gICAgY29uc3QgbWVtb3J5TWFuYWdlciA9IHRoaXMuX19lbmdpbmUubWVtb3J5TWFuYWdlcjtcblxuICAgIC8vIHRoZSBHUFUgZ2xvYmFsIFN0b3JhZ2VcbiAgICBjb25zdCBzaXplc09mVGhlQnVmZmVycyA9IG1lbW9yeU1hbmFnZXIuZ2V0U2l6ZXNPZlRoZUJ1ZmZlcnMoQnVmZmVyVXNlLkdQVUluc3RhbmNlRGF0YSk7XG4gICAgY29uc3QgdG90YWxTaXplT2ZUaGVCdWZmZXJzID0gc2l6ZXNPZlRoZUJ1ZmZlcnMucmVkdWNlKChhY2MsIHNpemUpID0+IGFjYyArIHNpemUsIDApO1xuICAgIGNvbnN0IGdwdUluc3RhbmNlRGF0YUJ1ZmZlcnMgPSBtZW1vcnlNYW5hZ2VyLmdldEJ1ZmZlcnMoQnVmZmVyVXNlLkdQVUluc3RhbmNlRGF0YSk7XG4gICAgY29uc3QgZ3B1SW5zdGFuY2VEYXRhQnVmZmVyQ291bnQgPSBncHVJbnN0YW5jZURhdGFCdWZmZXJzLmxlbmd0aDtcbiAgICBpZiAoZ3B1SW5zdGFuY2VEYXRhQnVmZmVyQ291bnQgIT09IHRoaXMuX19sYXN0R3B1SW5zdGFuY2VEYXRhQnVmZmVyQ291bnQpIHtcbiAgICAgIHRoaXMuX19sYXN0R3B1SW5zdGFuY2VEYXRhQnVmZmVyQ291bnQgPSBncHVJbnN0YW5jZURhdGFCdWZmZXJDb3VudDtcbiAgICAgIHRoaXMuZGVsZXRlRGF0YVRleHR1cmUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBnbHcgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmN1cnJlbnRXZWJHTENvbnRleHRXcmFwcGVyO1xuICAgIGlmIChnbHcgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBkYXRhVGV4dHVyZVdpZHRoID0gZ2x3LmdldE1heFRleHR1cmVTaXplKCk7XG4gICAgaWYgKHRoaXMuX19kYXRhVGV4dHVyZVVpZCAhPT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQpIHtcbiAgICAgIGNvbnN0IHRvdGFsU2l6ZU9mVGhlQnVmZmVyc0luVGV4ZWwgPSB0b3RhbFNpemVPZlRoZUJ1ZmZlcnMgLyA0IC8gNDtcbiAgICAgIGNvbnN0IGRhdGFUZXh0dXJlSGVpZ2h0ID0gTWF0aC5jZWlsKHRvdGFsU2l6ZU9mVGhlQnVmZmVyc0luVGV4ZWwgLyBkYXRhVGV4dHVyZVdpZHRoKTtcbiAgICAgIGNvbnN0IGRhdGFUZXh0dXJlQnl0ZVNpemUgPSBkYXRhVGV4dHVyZVdpZHRoICogZGF0YVRleHR1cmVIZWlnaHQgKiA0ICogNDtcbiAgICAgIC8vIFRoZSBsaWdodCBjbHVzdGVyIGxpc3RzIGFyZSBsYXJnZSBhbmQgdXBsb2FkZWQgYXMgZGlydHkgcmFuZ2VzLCBzbyB0aGUgZ2VuZXJpYyB1cGxvYWQgc2tpcHMgdGhlbS5cbiAgICAgIGNvbnN0IGxpZ2h0Q2x1c3RlclN5c3RlbSA9IHRoaXMuX19lbmdpbmUubGlnaHRDbHVzdGVyU3lzdGVtO1xuICAgICAgY29uc3QgZXhjbHVkZWRCeXRlUmFuZ2VzID0gbGlnaHRDbHVzdGVyU3lzdGVtLl9nZXRFeGNsdWRlZEJ5dGVSYW5nZXMoKTtcbiAgICAgIGxldCBsYXllckJ5dGVPZmZzZXQgPSAwO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBncHVJbnN0YW5jZURhdGFCdWZmZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGdwdUluc3RhbmNlRGF0YUJ1ZmZlciA9IGdwdUluc3RhbmNlRGF0YUJ1ZmZlcnNbaV07XG4gICAgICAgIGNvbnN0IGJ1ZmZlclNpemVGb3JEYXRhVGV4dHVyZUluQnl0ZSA9XG4gICAgICAgICAgaSA9PT0gZ3B1SW5zdGFuY2VEYXRhQnVmZmVycy5sZW5ndGggLSAxXG4gICAgICAgICAgICA/IGdwdUluc3RhbmNlRGF0YUJ1ZmZlci50YWtlblNpemVJbkJ5dGVcbiAgICAgICAgICAgIDogZ3B1SW5zdGFuY2VEYXRhQnVmZmVyLmJ5dGVMZW5ndGg7XG4gICAgICAgIGlmIChidWZmZXJTaXplRm9yRGF0YVRleHR1cmVJbkJ5dGUgPiBkYXRhVGV4dHVyZUJ5dGVTaXplKSB7XG4gICAgICAgICAgTG9nZ2VyLmRlZmF1bHQud2FybignVGhlIGJ1ZmZlciBzaXplIGV4Y2VlZHMgdGhlIHNpemUgb2YgdGhlIGRhdGEgdGV4dHVyZS4nKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsYXllckFycmF5ID0gbmV3IEZsb2F0MzJBcnJheShncHVJbnN0YW5jZURhdGFCdWZmZXIuZ2V0QXJyYXlCdWZmZXIoKSk7XG4gICAgICAgIGZvciAoY29uc3QgW3N0YXJ0LCBlbmRdIG9mIHN1YnRyYWN0Qnl0ZVJhbmdlcyhcbiAgICAgICAgICBsYXllckJ5dGVPZmZzZXQsXG4gICAgICAgICAgbGF5ZXJCeXRlT2Zmc2V0ICsgTWF0aC5taW4oYnVmZmVyU2l6ZUZvckRhdGFUZXh0dXJlSW5CeXRlLCBkYXRhVGV4dHVyZUJ5dGVTaXplKSxcbiAgICAgICAgICBleGNsdWRlZEJ5dGVSYW5nZXNcbiAgICAgICAgKSkge1xuICAgICAgICAgIHRoaXMuX191cGxvYWREYXRhVGV4dHVyZVRleGVscyhsYXllckFycmF5LCBsYXllckJ5dGVPZmZzZXQsIHN0YXJ0LCBlbmQsIGRhdGFUZXh0dXJlV2lkdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZGVidWdcbiAgICAgICAgaWYgKCFXZWJHTFN0cmF0ZWd5V2ViR0wyLl9faXNEZWJ1Z09wZXJhdGlvblRvRGF0YVRleHR1cmVCdWZmZXJEb25lKSB7XG4gICAgICAgICAgTWlzY1V0aWwuZG93bmxvYWRUeXBlZEFycmF5KCdSaG9kb25pdGVfZGF0YVRleHR1cmVCdWZmZXIuYmluJywgbGF5ZXJBcnJheSk7XG4gICAgICAgICAgV2ViR0xTdHJhdGVneVdlYkdMMi5fX2lzRGVidWdPcGVyYXRpb25Ub0RhdGFUZXh0dXJlQnVmZmVyRG9uZSA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBsYXllckJ5dGVPZmZzZXQgKz0gZ3B1SW5zdGFuY2VEYXRhQnVmZmVyLmJ5dGVMZW5ndGg7XG4gICAgICB9XG4gICAgICAvLyBVcGxvYWQgdGhlIGJ5dGUgcmFuZ2VzIHRoZSBsaWdodCBjbHVzdGVyIHN5c3RlbSByZWJ1aWx0IG9uIHRoZSBDUFUgc2luY2UgdGhlIGxhc3QgZnJhbWUuIFRoZXkgd2VyZSBza2lwcGVkXG4gICAgICAvLyBieSB0aGUgZ2VuZXJpYyB1cGxvYWQgYWJvdmU7IHRoZSByYW5nZXMgb2YgYSB2aWV3IG5ldmVyIGNyb3NzIGEgYnVmZmVyIGJvdW5kYXJ5IChhIHZpZXcgcmVnaW9uIGlzIGFsbG9jYXRlZFxuICAgICAgLy8gaW4gb25lIGJ1ZmZlciksIHNvIHRoZSBsYXllciBjYW4gYmUgZm91bmQgd2l0aCBhIHNpbXBsZSBjb250YWlubWVudCB0ZXN0LlxuICAgICAgZm9yIChjb25zdCBbc3RhcnQsIGVuZF0gb2YgbGlnaHRDbHVzdGVyU3lzdGVtLl90YWtlRGlydHlCeXRlUmFuZ2VzKCkpIHtcbiAgICAgICAgbGV0IGxheWVyU3RhcnQgPSAwO1xuICAgICAgICBmb3IgKGNvbnN0IGJ1ZmZlciBvZiBncHVJbnN0YW5jZURhdGFCdWZmZXJzKSB7XG4gICAgICAgICAgY29uc3QgbGF5ZXJFbmQgPSBsYXllclN0YXJ0ICsgYnVmZmVyLmJ5dGVMZW5ndGg7XG4gICAgICAgICAgaWYgKHN0YXJ0ID49IGxheWVyU3RhcnQgJiYgZW5kIDw9IGxheWVyRW5kKSB7XG4gICAgICAgICAgICBjb25zdCBsYXllckFycmF5ID0gbmV3IEZsb2F0MzJBcnJheShidWZmZXIuZ2V0QXJyYXlCdWZmZXIoKSk7XG4gICAgICAgICAgICB0aGlzLl9fdXBsb2FkRGF0YVRleHR1cmVUZXhlbHMobGF5ZXJBcnJheSwgbGF5ZXJTdGFydCwgc3RhcnQsIGVuZCwgZGF0YVRleHR1cmVXaWR0aCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgbGF5ZXJTdGFydCA9IGxheWVyRW5kO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG1vcnBoQnVmZmVycyA9IG1lbW9yeU1hbmFnZXIuZ2V0QnVmZmVycyhCdWZmZXJVc2UuR1BVVmVydGV4RGF0YSk7XG4gICAgICBjb25zdCBtb3JwaEJ1ZmZlckFycmF5QnVmZmVycyA9IG1vcnBoQnVmZmVycy5tYXAoYnVmZmVyID0+IGJ1ZmZlci5nZXRBcnJheUJ1ZmZlcigpKTtcblxuICAgICAgLy8gUmVzZXJ2ZSB0aGUgd2hvbGUgY2FwYWNpdHkgb2YgZWFjaCBHUFUgaW5zdGFuY2UgZGF0YSBidWZmZXIgKGFsaWduZWQgdG8gdGhlIHJvd3Mgb2YgdGhlIHRleHR1cmUpLFxuICAgICAgLy8gYW5kIHBsYWNlIHRoZSBtb3JwaCBkYXRhIGFmdGVyIHRoZW0uIFRoaXMgbGF5b3V0IG1hdGNoZXMgdGhlIHVwZGF0ZSBwYXRoIGFib3ZlIGFuZCB0aGUgbG9jYXRpb25zXG4gICAgICAvLyB1c2VkIGJ5IHNoYWRlcnMgKHNlZSBNZW1vcnlNYW5hZ2VyLmdldEJ5dGVPZmZzZXRPZkV4aXN0aW5nQnVmZmVycyksIGFuZCBhbGxvY2F0aW9ucyBhZnRlciB0aGUgY3JlYXRpb25cbiAgICAgIC8vIG9mIHRoZSB0ZXh0dXJlIChlLmcuIGJvbmUgZGF0YSBvZiBhIFNrZWxldGFsQ29tcG9uZW50KSBuZXZlciBvdmVyd3JpdGUgdGhlIG1vcnBoIGRhdGEuXG4gICAgICBjb25zdCBkYXRhVGV4dHVyZVdpZHRoSW5CeXRlID0gZGF0YVRleHR1cmVXaWR0aCAqIDQgKiA0O1xuICAgICAgY29uc3QgaW5zdGFuY2VEYXRhUmVnaW9uU2l6ZXM6IEJ5dGVbXSA9IGdwdUluc3RhbmNlRGF0YUJ1ZmZlcnMubWFwKFxuICAgICAgICBidWZmZXIgPT4gTWF0aC5jZWlsKGJ1ZmZlci5ieXRlTGVuZ3RoIC8gZGF0YVRleHR1cmVXaWR0aEluQnl0ZSkgKiBkYXRhVGV4dHVyZVdpZHRoSW5CeXRlXG4gICAgICApO1xuICAgICAgY29uc3QgaW5zdGFuY2VEYXRhUmVnaW9uVG90YWxTaXplID0gaW5zdGFuY2VEYXRhUmVnaW9uU2l6ZXMucmVkdWNlKChhY2MsIHNpemUpID0+IGFjYyArIHNpemUsIDApO1xuICAgICAgY29uc3QgbW9ycGhCdWZmZXJCeXRlTGVuZ3RoID0gbW9ycGhCdWZmZXJzLnJlZHVjZSgoYWNjLCBidWZmZXIpID0+IGFjYyArIGJ1ZmZlci5ieXRlTGVuZ3RoLCAwKTtcbiAgICAgIGNvbnN0IGRhdGFSb3dzID0gTWF0aC5tYXgoXG4gICAgICAgIE1hdGguY2VpbCgoaW5zdGFuY2VEYXRhUmVnaW9uVG90YWxTaXplICsgbW9ycGhCdWZmZXJCeXRlTGVuZ3RoKSAvIGRhdGFUZXh0dXJlV2lkdGhJbkJ5dGUpLFxuICAgICAgICAxXG4gICAgICApO1xuXG4gICAgICAvLyBBcHBlbmQgdGhlIGluc3RhbmNlIFNJRCAvIHJlbWFwIHRhYmxlcyB0byB0aGUgZGF0YSB0ZXh0dXJlIHNvIHRoYXQgbXVsdGktZHJhd1xuICAgICAgLy8gcmVuZGVyaW5nIGRvZXMgbm90IGNvbnN1bWUgZXh0cmEgdGV4dHVyZSB1bml0cyAobW9iaWxlIHRleHR1cmUgdW5pdCBsaW1pdHMpLlxuICAgICAgLy8gVGhlIHJvd3MgYXJlIG9ubHkgcmVzZXJ2ZWQgd2hpbGUgdGhlIGZlYXR1cmUgaXMgdXNhYmxlLlxuICAgICAgY29uc3QgaXNJbnN0YW5jZVNpZEVuYWJsZWQgPVxuICAgICAgICB0aGlzLl9fZW5naW5lLmNvbmZpZy5pc011bHRpRHJhd0VuYWJsZWQgJiYgdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5pc0luc3RhbmNlU2lkVGV4dHVyZUNhcGFibGU7XG4gICAgICBjb25zdCBzaWRUYWJsZSA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuaW5zdGFuY2VTaWRUYWJsZTtcbiAgICAgIGNvbnN0IHNpZFNsb3RDYXBhY2l0eSA9IGlzSW5zdGFuY2VTaWRFbmFibGVkID8gTWF0aC5tYXgoc2lkVGFibGUudXNlZEVuZCwgMSkgOiAwO1xuICAgICAgY29uc3Qgc2lkUm93cyA9IGlzSW5zdGFuY2VTaWRFbmFibGVkID8gTWF0aC5tYXgoTWF0aC5jZWlsKHNpZFNsb3RDYXBhY2l0eSAvIGRhdGFUZXh0dXJlV2lkdGgpLCAxKSA6IDA7XG4gICAgICBjb25zdCByZW1hcFJvd3MgPSBpc0luc3RhbmNlU2lkRW5hYmxlZFxuICAgICAgICA/IE1hdGgubWF4KE1hdGguY2VpbChNYXRoLmNlaWwoc2lkU2xvdENhcGFjaXR5IC8gNCkgLyBkYXRhVGV4dHVyZVdpZHRoKSwgMSlcbiAgICAgICAgOiAwO1xuICAgICAgY29uc3QgZGF0YVRleHR1cmVIZWlnaHQgPSBkYXRhUm93cyArIHNpZFJvd3MgKyByZW1hcFJvd3M7XG4gICAgICB0aGlzLl9fZGF0YVRleHR1cmVXaWR0aCA9IGRhdGFUZXh0dXJlV2lkdGg7XG4gICAgICB0aGlzLl9faW5zdGFuY2VTaWRCYXNlUm93ID0gZGF0YVJvd3M7XG4gICAgICB0aGlzLl9faW5zdGFuY2VSZW1hcEJhc2VSb3cgPSBkYXRhUm93cyArIHNpZFJvd3M7XG4gICAgICB0aGlzLl9faW5zdGFuY2VTaWRCYXNlVmVjNCA9IHRoaXMuX19pbnN0YW5jZVNpZEJhc2VSb3cgKiBkYXRhVGV4dHVyZVdpZHRoO1xuICAgICAgdGhpcy5fX2luc3RhbmNlUmVtYXBCYXNlVmVjNCA9IHRoaXMuX19pbnN0YW5jZVJlbWFwQmFzZVJvdyAqIGRhdGFUZXh0dXJlV2lkdGg7XG4gICAgICB0aGlzLl9faW5zdGFuY2VTaWRDYXBhY2l0eSA9IHNpZFNsb3RDYXBhY2l0eTtcbiAgICAgIGlmIChpc0luc3RhbmNlU2lkRW5hYmxlZCkge1xuICAgICAgICAvLyBUaGUgbmV3IHRleHR1cmUgc3RhcnRzIHplcm9lZCwgc28gYm90aCByZWdpb25zIG11c3QgYmUgdXBsb2FkZWQgYWdhaW4uXG4gICAgICAgIHNpZFRhYmxlLm1hcmtBbGxEaXJ0eSgpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkYXRhVGV4dHVyZUJ5dGVTaXplID0gZGF0YVRleHR1cmVXaWR0aEluQnl0ZSAqIGRhdGFUZXh0dXJlSGVpZ2h0O1xuICAgICAgY29uc3QgZmluYWxVaW50OEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoZGF0YVRleHR1cmVCeXRlU2l6ZSk7XG4gICAgICBsZXQgZHN0Qnl0ZU9mZnNldCA9IDA7XG4gICAgICBncHVJbnN0YW5jZURhdGFCdWZmZXJzLmZvckVhY2goKGJ1ZmZlciwgaSkgPT4ge1xuICAgICAgICAvLyBUaGUgcmVzdCBvZiB0aGUgcmVnaW9uIGlzIG5vdCB0YWtlbiB5ZXQsIHNvIGl0IHN0YXlzIHplcm8uXG4gICAgICAgIGZpbmFsVWludDhBcnJheS5zZXQobmV3IFVpbnQ4QXJyYXkoYnVmZmVyLmdldEFycmF5QnVmZmVyKCksIDAsIGJ1ZmZlci50YWtlblNpemVJbkJ5dGUpLCBkc3RCeXRlT2Zmc2V0KTtcbiAgICAgICAgZHN0Qnl0ZU9mZnNldCArPSBpbnN0YW5jZURhdGFSZWdpb25TaXplc1tpXTtcbiAgICAgIH0pO1xuICAgICAgbW9ycGhCdWZmZXJzLmZvckVhY2goKGJ1ZmZlciwgaSkgPT4ge1xuICAgICAgICBmaW5hbFVpbnQ4QXJyYXkuc2V0KG5ldyBVaW50OEFycmF5KG1vcnBoQnVmZmVyQXJyYXlCdWZmZXJzW2ldLCAwLCBidWZmZXIuYnl0ZUxlbmd0aCksIGRzdEJ5dGVPZmZzZXQpO1xuICAgICAgICBkc3RCeXRlT2Zmc2V0ICs9IGJ1ZmZlci5ieXRlTGVuZ3RoO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGZsb2F0RGF0YVRleHR1cmVCdWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KGZpbmFsVWludDhBcnJheS5idWZmZXIpO1xuICAgICAgdGhpcy5fX2VuZ2luZS5lbmdpbmVTdGF0ZS50b3RhbFNpemVPZkdQVVNoYWRlckRhdGFTdG9yYWdlRXhjZXB0TW9ycGhEYXRhID0gaW5zdGFuY2VEYXRhUmVnaW9uVG90YWxTaXplO1xuXG4gICAgICAvLyB3cml0ZSBkYXRhXG4gICAgICB0aGlzLl9fZGF0YVRleHR1cmVVaWQgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmNyZWF0ZVRleHR1cmVGcm9tVHlwZWRBcnJheShcbiAgICAgICAgZmxvYXREYXRhVGV4dHVyZUJ1ZmZlciEsXG4gICAgICAgIHtcbiAgICAgICAgICBpbnRlcm5hbEZvcm1hdDogVGV4dHVyZUZvcm1hdC5SR0JBMzJGLFxuICAgICAgICAgIHdpZHRoOiBkYXRhVGV4dHVyZVdpZHRoLFxuICAgICAgICAgIGhlaWdodDogZGF0YVRleHR1cmVIZWlnaHQsXG4gICAgICAgICAgZm9ybWF0OiBQaXhlbEZvcm1hdC5SR0JBLFxuICAgICAgICAgIHR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICAgICAgZ2VuZXJhdGVNaXBtYXA6IGZhbHNlLFxuICAgICAgICB9XG4gICAgICApO1xuICAgICAgLy8gVGhlIG5ldyB0ZXh0dXJlIGNvbnRhaW5zIGV2ZXJ5dGhpbmcsIGluY2x1ZGluZyB0aGUgbGlnaHQgY2x1c3RlcnMgYnVpbHQgb24gdGhlIENQVS5cbiAgICAgIHRoaXMuX19lbmdpbmUubGlnaHRDbHVzdGVyU3lzdGVtLl90YWtlRGlydHlCeXRlUmFuZ2VzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVwbG9hZHMgdGhlIGJ5dGVzIGBbc3RhcnQsIGVuZClgIG9mIHRoZSBHUFUgaW5zdGFuY2UgZGF0YSAoMTYtYnl0ZSBhbGlnbmVkLCBpbiB0aGUgY29uY2F0ZW5hdGVkIGxheWVycykgdG8gdGhlXG4gICAqIGRhdGEgdGV4dHVyZSwgd2hlcmUgdGV4ZWwgYG5gIGhvbGRzIGJ5dGVzIGAxNm5gIHRvIGAxNm4gKyAxNWAuIFRoZSByYW5nZSBpcyBzcGxpdCBpbnRvIGEgcGFydGlhbCBmaXJzdCByb3csIGZ1bGxcbiAgICogcm93cyBhbmQgYSBwYXJ0aWFsIGxhc3Qgcm93LlxuICAgKlxuICAgKiBAcGFyYW0gbGF5ZXJBcnJheSAtIFRoZSB3aG9sZSBtZW1vcnkgb2YgdGhlIGxheWVyIHRoYXQgY29udGFpbnMgdGhlIHJhbmdlXG4gICAqIEBwYXJhbSBsYXllckJ5dGVPZmZzZXQgLSBUaGUgYnl0ZSBvZmZzZXQgb2YgdGhlIGxheWVyIGluIHRoZSBjb25jYXRlbmF0ZWQgbGF5ZXJzXG4gICAqL1xuICBwcml2YXRlIF9fdXBsb2FkRGF0YVRleHR1cmVUZXhlbHMoXG4gICAgbGF5ZXJBcnJheTogRmxvYXQzMkFycmF5LFxuICAgIGxheWVyQnl0ZU9mZnNldDogbnVtYmVyLFxuICAgIHN0YXJ0OiBudW1iZXIsXG4gICAgZW5kOiBudW1iZXIsXG4gICAgd2lkdGg6IG51bWJlclxuICApIHtcbiAgICBjb25zdCByZXBvc2l0b3J5ID0gdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBsZXQgdGV4ZWwgPSBNYXRoLmZsb29yKHN0YXJ0IC8gMTYpO1xuICAgIGNvbnN0IGVuZFRleGVsID0gTWF0aC5jZWlsKGVuZCAvIDE2KTtcbiAgICBjb25zdCBsYXllclRleGVsID0gbGF5ZXJCeXRlT2Zmc2V0IC8gMTY7XG4gICAgY29uc3QgdXBsb2FkID0gKHg6IG51bWJlciwgeTogbnVtYmVyLCB3OiBudW1iZXIsIGg6IG51bWJlciwgZmlyc3RUZXhlbDogbnVtYmVyKSA9PiB7XG4gICAgICBjb25zdCBmcm9tID0gKGZpcnN0VGV4ZWwgLSBsYXllclRleGVsKSAqIDQ7XG4gICAgICByZXBvc2l0b3J5LnVwZGF0ZVRleHR1cmUodGhpcy5fX2RhdGFUZXh0dXJlVWlkLCBsYXllckFycmF5LnN1YmFycmF5KGZyb20sIGZyb20gKyB3ICogaCAqIDQpLCB7XG4gICAgICAgIGxldmVsOiAwLFxuICAgICAgICBvZmZzZXRYOiB4LFxuICAgICAgICBvZmZzZXRZOiB5LFxuICAgICAgICB3aWR0aDogdyxcbiAgICAgICAgaGVpZ2h0OiBoLFxuICAgICAgICBmb3JtYXQ6IFBpeGVsRm9ybWF0LlJHQkEsXG4gICAgICAgIHR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHdoaWxlICh0ZXhlbCA8IGVuZFRleGVsKSB7XG4gICAgICBjb25zdCB4ID0gdGV4ZWwgJSB3aWR0aDtcbiAgICAgIGNvbnN0IHkgPSBNYXRoLmZsb29yKHRleGVsIC8gd2lkdGgpO1xuICAgICAgaWYgKHggIT09IDAgfHwgZW5kVGV4ZWwgLSB0ZXhlbCA8IHdpZHRoKSB7XG4gICAgICAgIC8vIGEgcGFydGlhbCByb3dcbiAgICAgICAgY29uc3QgY291bnQgPSBNYXRoLm1pbih3aWR0aCAtIHgsIGVuZFRleGVsIC0gdGV4ZWwpO1xuICAgICAgICB1cGxvYWQoeCwgeSwgY291bnQsIDEsIHRleGVsKTtcbiAgICAgICAgdGV4ZWwgKz0gY291bnQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBmdWxsIHJvd3NcbiAgICAgICAgY29uc3Qgcm93cyA9IE1hdGguZmxvb3IoKGVuZFRleGVsIC0gdGV4ZWwpIC8gd2lkdGgpO1xuICAgICAgICB1cGxvYWQoMCwgeSwgd2lkdGgsIHJvd3MsIHRleGVsKTtcbiAgICAgICAgdGV4ZWwgKz0gcm93cyAqIHdpZHRoO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGVzIHRoZSBjdXJyZW50IGRhdGEgdGV4dHVyZSBhbmQgZnJlZXMgYXNzb2NpYXRlZCBHUFUgcmVzb3VyY2VzLlxuICAgKiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgY2FsbGVkIHdoZW4gdGhlIGRhdGEgdGV4dHVyZSBuZWVkcyB0byBiZSByZWNyZWF0ZWRcbiAgICogb3Igd2hlbiBjbGVhbmluZyB1cCByZXNvdXJjZXMuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIEFmdGVyIGNhbGxpbmcgdGhpcyBtZXRob2QsIHRoZSBkYXRhIHRleHR1cmUgVUlEIGlzIHJlc2V0IHRvIGFuIGludmFsaWQgc3RhdGUsXG4gICAqIGFuZCBhIG5ldyBkYXRhIHRleHR1cmUgd2lsbCBiZSBjcmVhdGVkIG9uIHRoZSBuZXh0IHJlbmRlcmluZyBjeWNsZS5cbiAgICovXG4gIGRlbGV0ZURhdGFUZXh0dXJlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9fZGF0YVRleHR1cmVVaWQgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5kZWxldGVUZXh0dXJlKHRoaXMuX19kYXRhVGV4dHVyZVVpZCk7XG4gICAgICB0aGlzLl9fZGF0YVRleHR1cmVVaWQgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgICB9XG4gICAgdGhpcy5fX2luc3RhbmNlU2lkQ2FwYWNpdHkgPSAwO1xuICAgIHRoaXMuX19kYXRhVGV4dHVyZVdpZHRoID0gMDtcbiAgICAvLyBUaGUgb2xkIHRleHR1cmUgb2JqZWN0IGlzIGdvbmUsIHNvIHRoZSBuZXh0IGRyYXcgbXVzdCBiaW5kIHRoZSBwcm9ncmFtIGFuZCB0aGVcbiAgICAvLyBkYXRhIHRleHR1cmUgYWdhaW4gZXZlbiBpZiB0aGUgc2FtZSBzaGFkZXIgcHJvZ3JhbSBpcyBzdGlsbCBjdXJyZW50LlxuICAgIHRoaXMuX19sYXN0U2hhZGVyID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gIH1cblxuICAvKipcbiAgICogUHJlcGFyZXMgdGhlIHJlbmRlcmluZyBwaXBlbGluZSBiZWZvcmUgYWN0dWFsIHJlbmRlcmluZyBiZWdpbnMuXG4gICAqIFRoaXMgbWV0aG9kIHVwZGF0ZXMgR1BVIHN0b3JhZ2UgKGRhdGEgdGV4dHVyZSBhbmQgVUJPKSBiYXNlZCBvbiBjb21wb25lbnRcbiAgICogdXBkYXRlIHN0YXRlcyBhbmQgbWFuYWdlcyBsaWdodCBjb21wb25lbnRzIGZvciB0aGUgY3VycmVudCBmcmFtZS5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBtZXRob2QgcGVyZm9ybXMgY29uZGl0aW9uYWwgdXBkYXRlcyBiYXNlZCBvbiB3aGF0IGhhcyBjaGFuZ2VkOlxuICAgKiAtIEZ1bGwgdXBkYXRlOiBXaGVuIGFuaW1hdGlvbiwgdHJhbnNmb3Jtcywgc2NlbmUgZ3JhcGgsIG9yIG1hdGVyaWFscyBjaGFuZ2VcbiAgICogLSBDYW1lcmEtb25seSB1cGRhdGU6IFdoZW4gb25seSBjYW1lcmEgb3IgY2FtZXJhIGNvbnRyb2xsZXIgZGF0YSBjaGFuZ2VzXG4gICAqIC0gQWxzbyByZXRyaWV2ZXMgY3VycmVudCBsaWdodCBjb21wb25lbnRzIGZvciB0aGUgcmVuZGVyaW5nIHBhc3NcbiAgICpcbiAgICogVGhlIG1ldGhvZCB0cmFja3MgdXBkYXRlIGNvdW50cyB0byBhdm9pZCB1bm5lY2Vzc2FyeSBHUFUgdXBsb2FkcyBhbmRcbiAgICogcHJvdmlkZXMgb3B0aW1hbCBwZXJmb3JtYW5jZSBieSB1cGRhdGluZyBvbmx5IHdoYXQgaGFzIGNoYW5nZWQuXG4gICAqL1xuICBwcmVyZW5kZXIoKTogdm9pZCB7XG4gICAgLy8gVGhlIGluc3RhbmNlIFNJRCAvIHJlbWFwIHJlZ2lvbnMgYXJlIGFwcGVuZGVkIHRvIHRoZSBkYXRhIHRleHR1cmUuIFJlY3JlYXRlIGl0XG4gICAgLy8gd2hlbiB0aGUgbnVtYmVyIG9mIHN0YWJsZSBpbnN0YW5jZSBzbG90cyBvdXRncm93cyB0aGUgY3VycmVudGx5IHJlc2VydmVkIHJvd3MuXG4gICAgY29uc3QgaW5zdGFuY2VTaWRFbmFibGVkID1cbiAgICAgIHRoaXMuX19lbmdpbmUuY29uZmlnLmlzTXVsdGlEcmF3RW5hYmxlZCAmJiB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmlzSW5zdGFuY2VTaWRUZXh0dXJlQ2FwYWJsZTtcbiAgICBpZiAoaW5zdGFuY2VTaWRFbmFibGVkKSB7XG4gICAgICBjb25zdCBzaWRUYWJsZSA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuaW5zdGFuY2VTaWRUYWJsZTtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5fX2RhdGFUZXh0dXJlVWlkICE9PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCAmJlxuICAgICAgICBzaWRUYWJsZS51c2VkRW5kID4gdGhpcy5fX2luc3RhbmNlU2lkQ2FwYWNpdHlcbiAgICAgICkge1xuICAgICAgICB0aGlzLmRlbGV0ZURhdGFUZXh0dXJlKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmUtdXBsb2FkIHRoZSBHUFUgaW5zdGFuY2UgZGF0YSB3aGVuIGFueSBvZiBpdHMgc291cmNlcyBjaGFuZ2VkLiBUaGUgbGlnaHQgY2x1c3RlciBzeXN0ZW0gaXMgb25lIG9mIHRoZW06XG4gICAgLy8gaXQgd3JpdGVzIHRoZSBhbGwtbGlnaHQgbGlzdCBhbmQgdGhlIGNsdXN0ZXIgdGFibGVzIGludG8gdGhlIHNhbWUgZGF0YSwgc28gaXRzIGBkYXRhVmVyc2lvbmAgaGFzIHRvIGJlXG4gICAgLy8gY29tcGFyZWQgbGlrZSB0aGUgY29tcG9uZW50IHVwZGF0ZSBjb3VudHMuIChUaGUgY2x1c3RlciB0YWJsZXMgdGhlbXNlbHZlcyBhcmUgdXBsb2FkZWQgYXMgZGlydHkgcmFuZ2VzIGJ5XG4gICAgLy8gX19jcmVhdGVBbmRVcGRhdGVEYXRhVGV4dHVyZUlubmVyLilcbiAgICBpZiAoXG4gICAgICBBbmltYXRpb25Db21wb25lbnQuZ2V0SXNBbmltYXRpbmcodGhpcy5fX2VuZ2luZSkgfHxcbiAgICAgIFRyYW5zZm9ybUNvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKSAhPT0gdGhpcy5fX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQgfHxcbiAgICAgIFNjZW5lR3JhcGhDb21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSkgIT09IHRoaXMuX19sYXN0U2NlbmVHcmFwaENvbXBvbmVudHNVcGRhdGVDb3VudCB8fFxuICAgICAgQ2FtZXJhQ29tcG9uZW50LmdldEN1cnJlbnRDYW1lcmFVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKSAhPT0gdGhpcy5fX2xhc3RDYW1lcmFDb21wb25lbnRzVXBkYXRlQ291bnQgfHxcbiAgICAgIF9nZXRDYW1lcmFDb250cm9sbGVyVXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSkgIT09IHRoaXMuX19sYXN0Q2FtZXJhQ29udHJvbGxlckNvbXBvbmVudHNVcGRhdGVDb3VudCB8fFxuICAgICAgdGhpcy5fX2VuZ2luZS5tYXRlcmlhbFJlcG9zaXRvcnkuc3RhdGVWZXJzaW9uICE9PSB0aGlzLl9fbGFzdE1hdGVyaWFsc1VwZGF0ZUNvdW50IHx8XG4gICAgICB0aGlzLl9fZW5naW5lLmxpZ2h0Q2x1c3RlclN5c3RlbS5kYXRhVmVyc2lvbiAhPT0gdGhpcy5fX2xhc3RMaWdodENsdXN0ZXJEYXRhVmVyc2lvbiB8fFxuICAgICAgTGlnaHRDb21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSkgIT09IHRoaXMuX19sYXN0TGlnaHRDb21wb25lbnRzVXBkYXRlQ291bnQgfHxcbiAgICAgIHRoaXMuX19lbmdpbmUuX2dwdUluc3RhbmNlRGF0YVZlcnNpb24gIT09IHRoaXMuX19sYXN0R3B1SW5zdGFuY2VEYXRhVmVyc2lvbiB8fFxuICAgICAgdGhpcy5fX2RhdGFUZXh0dXJlVWlkID09PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZFxuICAgICkge1xuICAgICAgLy8gU2V0dXAgR1BVIFN0b3JhZ2UgKERhdGEgVGV4dHVyZSAmIFVCTylcbiAgICAgIHRoaXMuX19jcmVhdGVBbmRVcGRhdGVEYXRhVGV4dHVyZSgpO1xuICAgICAgdGhpcy5fX2NyZWF0ZUFuZFVwZGF0ZVVCTygpO1xuICAgICAgdGhpcy5fX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQgPSBUcmFuc2Zvcm1Db21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSk7XG4gICAgICB0aGlzLl9fbGFzdFNjZW5lR3JhcGhDb21wb25lbnRzVXBkYXRlQ291bnQgPSBTY2VuZUdyYXBoQ29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICAgICAgdGhpcy5fX2xhc3RDYW1lcmFDb21wb25lbnRzVXBkYXRlQ291bnQgPSBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudENhbWVyYVVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICAgICAgdGhpcy5fX2xhc3RDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gX2dldENhbWVyYUNvbnRyb2xsZXJVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKTtcbiAgICAgIHRoaXMuX19sYXN0TWF0ZXJpYWxzVXBkYXRlQ291bnQgPSB0aGlzLl9fZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5zdGF0ZVZlcnNpb247XG4gICAgICB0aGlzLl9fbGFzdExpZ2h0Q2x1c3RlckRhdGFWZXJzaW9uID0gdGhpcy5fX2VuZ2luZS5saWdodENsdXN0ZXJTeXN0ZW0uZGF0YVZlcnNpb247XG4gICAgICB0aGlzLl9fbGFzdExpZ2h0Q29tcG9uZW50c1VwZGF0ZUNvdW50ID0gTGlnaHRDb21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSk7XG4gICAgICB0aGlzLl9fbGFzdEdwdUluc3RhbmNlRGF0YVZlcnNpb24gPSB0aGlzLl9fZW5naW5lLl9ncHVJbnN0YW5jZURhdGFWZXJzaW9uO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIEJsZW5kU2hhcGVDb21wb25lbnQudXBkYXRlQ291bnQgIT09IHRoaXMuX19sYXN0QmxlbmRTaGFwZUNvbXBvbmVudHNVcGRhdGVDb3VudEZvcldlaWdodHMgfHxcbiAgICAgIEJsZW5kU2hhcGVDb21wb25lbnQuZ2V0Q291bnRPZkJsZW5kU2hhcGVDb21wb25lbnRzKHRoaXMuX19lbmdpbmUpICE9PSB0aGlzLl9fY291bnRPZkJsZW5kU2hhcGVDb21wb25lbnRzXG4gICAgKSB7XG4gICAgICB0aGlzLl9fdXBkYXRlTW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlcigpO1xuICAgICAgdGhpcy5fX2xhc3RCbGVuZFNoYXBlQ29tcG9uZW50c1VwZGF0ZUNvdW50Rm9yV2VpZ2h0cyA9IEJsZW5kU2hhcGVDb21wb25lbnQudXBkYXRlQ291bnQ7XG4gICAgICB0aGlzLl9fY291bnRPZkJsZW5kU2hhcGVDb21wb25lbnRzID0gQmxlbmRTaGFwZUNvbXBvbmVudC5nZXRDb3VudE9mQmxlbmRTaGFwZUNvbXBvbmVudHModGhpcy5fX2VuZ2luZSk7XG4gICAgICB0aGlzLl9fZW5naW5lLm1hdGVyaWFsUmVwb3NpdG9yeS5fbWFrZVNoYWRlckludmFsaWRhdGVUb01vcnBoTWF0ZXJpYWxzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX19zZXR0bGVQcmV2aW91c01vcnBoV2VpZ2h0cygpO1xuICAgIH1cblxuICAgIHRoaXMuX191cGRhdGVNb3JwaE9mZnNldHNVbmlmb3JtQnVmZmVycygpO1xuXG4gICAgdGhpcy5fX2xpZ2h0Q29tcG9uZW50cyA9IHRoaXMuX19lbmdpbmUuY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnRzV2l0aFR5cGUoTGlnaHRDb21wb25lbnQpIGFzXG4gICAgICB8IExpZ2h0Q29tcG9uZW50W11cbiAgICAgIHwgdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdW5pZm9ybSBidWZmZXJzIGNvbnRhaW5pbmcgbW9ycGggdGFyZ2V0IHdlaWdodHMgZm9yIGJsZW5kIHNoYXBlIGFuaW1hdGlvbi5cbiAgICogQ29waWVzIHdlaWdodCB2YWx1ZXMgZnJvbSBibGVuZCBzaGFwZSBjb21wb25lbnRzIHRvIEdQVS1hY2Nlc3NpYmxlIHVuaWZvcm0gYnVmZmVycy5cbiAgICovXG4gIHByaXZhdGUgX191cGRhdGVNb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyKGlzTmV3QnVmZmVyID0gZmFsc2UpIHtcbiAgICBjb25zdCBtZW1vcnlNYW5hZ2VyID0gdGhpcy5fX2VuZ2luZS5tZW1vcnlNYW5hZ2VyO1xuICAgIGNvbnN0IGJsZW5kU2hhcGVEYXRhQnVmZmVyOiBCdWZmZXIgfCB1bmRlZmluZWQgPSBtZW1vcnlNYW5hZ2VyLmdldEJ1ZmZlcihCdWZmZXJVc2UuR1BVVmVydGV4RGF0YSk7XG4gICAgaWYgKGJsZW5kU2hhcGVEYXRhQnVmZmVyID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGJsZW5kU2hhcGVEYXRhQnVmZmVyLnRha2VuU2l6ZUluQnl0ZSA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGVsZW1lbnROdW1Ub0NvcHkgPSBCbGVuZFNoYXBlQ29tcG9uZW50Ll93cml0ZU1vcnBoV2VpZ2h0c1VuaWZvcm1BcnJheShcbiAgICAgIHRoaXMuX19lbmdpbmUsXG4gICAgICB0aGlzLl9fdW5pZm9ybU1vcnBoV2VpZ2h0c1R5cGVkQXJyYXkhLFxuICAgICAgaXNOZXdCdWZmZXJcbiAgICApO1xuICAgIHRoaXMuX19pc1ByZXZpb3VzTW9ycGhXZWlnaHRzU2V0dGxlZCA9IGZhbHNlO1xuICAgIGlmIChlbGVtZW50TnVtVG9Db3B5ID4gMCkge1xuICAgICAgdGhpcy5fX3VwbG9hZE1vcnBoV2VpZ2h0cyhlbGVtZW50TnVtVG9Db3B5KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9fdXBsb2FkTW9ycGhXZWlnaHRzKGVsZW1lbnROdW1Ub0NvcHk6IG51bWJlcikge1xuICAgIHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkudXBkYXRlVW5pZm9ybUJ1ZmZlcihcbiAgICAgIHRoaXMuX19tb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyVWlkLFxuICAgICAgdGhpcy5fX3VuaWZvcm1Nb3JwaFdlaWdodHNUeXBlZEFycmF5ISxcbiAgICAgIDAsXG4gICAgICBlbGVtZW50TnVtVG9Db3B5XG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYWtlcyB0aGUgd2VpZ2h0cyBvZiB0aGUgcHJldmlvdXMgZnJhbWUgaW4gdGhlIG1vcnBoIHdlaWdodHMgdW5pZm9ybSBidWZmZXIgZXF1YWwgdG8gdGhlIGN1cnJlbnQgd2VpZ2h0cyBvbmNlXG4gICAqIHRoZSB3ZWlnaHRzIHN0b3BwZWQgY2hhbmdpbmcgKHRlbXBvcmFsIGFudGktYWxpYXNpbmcgb25seSkuXG4gICAqL1xuICBwcml2YXRlIF9fc2V0dGxlUHJldmlvdXNNb3JwaFdlaWdodHMoKSB7XG4gICAgaWYgKHRoaXMuX19pc1ByZXZpb3VzTW9ycGhXZWlnaHRzU2V0dGxlZCB8fCB0aGlzLl9fdW5pZm9ybU1vcnBoV2VpZ2h0c1R5cGVkQXJyYXkgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9faXNQcmV2aW91c01vcnBoV2VpZ2h0c1NldHRsZWQgPSB0cnVlO1xuICAgIGNvbnN0IGVsZW1lbnROdW1Ub0NvcHkgPSBCbGVuZFNoYXBlQ29tcG9uZW50Ll9zZXR0bGVQcmV2aW91c01vcnBoV2VpZ2h0cyhcbiAgICAgIHRoaXMuX19lbmdpbmUsXG4gICAgICB0aGlzLl9fdW5pZm9ybU1vcnBoV2VpZ2h0c1R5cGVkQXJyYXlcbiAgICApO1xuICAgIGlmIChlbGVtZW50TnVtVG9Db3B5ID4gMCkge1xuICAgICAgdGhpcy5fX3VwbG9hZE1vcnBoV2VpZ2h0cyhlbGVtZW50TnVtVG9Db3B5KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIFVuaWZvcm0gQnVmZmVyIE9iamVjdHMgKFVCTykgc2hvdWxkIGJlIHVzZWQgZm9yIGRhdGEgc3RvcmFnZS5cbiAgICogVUJPcyBhcmUgb25seSB1c2VkIHdoZW4gYm90aCBXZWJHTCAyLjAgaXMgYXZhaWxhYmxlIGFuZCBVQk8gdXNhZ2UgaXMgZW5hYmxlZCBpbiBjb25maWd1cmF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyB0cnVlIGlmIFVCT3Mgc2hvdWxkIGJlIHVzZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBVQk9zIHByb3ZpZGUgbW9yZSBlZmZpY2llbnQgdW5pZm9ybSBkYXRhIHRyYW5zZmVyIGZvciBXZWJHTCAyLjAgY29udGV4dHNcbiAgICogYW5kIGNhbiBzdG9yZSBsYXJnZXIgYW1vdW50cyBvZiB1bmlmb3JtIGRhdGEgY29tcGFyZWQgdG8gaW5kaXZpZHVhbCB1bmlmb3Jtcy5cbiAgICovXG4gIHByaXZhdGUgX19pc1Vib1VzZSgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5jdXJyZW50V2ViR0xDb250ZXh0V3JhcHBlciEuaXNXZWJHTDIgJiYgdGhpcy5fX2VuZ2luZS5jb25maWcuaXNVYm9FbmFibGVkXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuZCB1cGRhdGVzIHRoZSBVbmlmb3JtIEJ1ZmZlciBPYmplY3QgKFVCTykgd2l0aCBjdXJyZW50IHNoYWRlciBkYXRhLlxuICAgKiBUaGlzIG1ldGhvZCBpcyBvbmx5IGFjdGl2ZSB3aGVuIFVCTyB1c2FnZSBpcyBlbmFibGVkIGFuZCBXZWJHTCAyLjAgaXMgYXZhaWxhYmxlLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGUgVUJPIHN0b3JlcyB0aGUgc2FtZSBkYXRhIGFzIHRoZSBkYXRhIHRleHR1cmUgYnV0IGluIGEgZGlmZmVyZW50IGZvcm1hdFxuICAgKiBvcHRpbWl6ZWQgZm9yIHVuaWZvcm0gYnVmZmVyIGFjY2Vzcy4gVGhpcyBtZXRob2QgaGFuZGxlczpcbiAgICogLSBJbml0aWFsIFVCTyBjcmVhdGlvbiB3aXRoIHByb3BlciBzaXplIGFsbG9jYXRpb25cbiAgICogLSBVcGRhdGluZyBleGlzdGluZyBVQk8gd2l0aCBuZXcgZGF0YSBmcm9tIEdQVSBpbnN0YW5jZSBidWZmZXJcbiAgICogLSBSZXNwZWN0aW5nIGFsaWdubWVudCByZXF1aXJlbWVudHMgZm9yIHVuaWZvcm0gYnVmZmVyIGxheW91dHNcbiAgICovXG4gIHByaXZhdGUgX19jcmVhdGVBbmRVcGRhdGVVQk8oKSB7XG4gICAgaWYgKHRoaXMuX19pc1Vib1VzZSgpKSB7XG4gICAgICBjb25zdCBnbHcgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmN1cnJlbnRXZWJHTENvbnRleHRXcmFwcGVyO1xuICAgICAgY29uc3QgYWxpZ25lZE1heFVuaWZvcm1CbG9ja1NpemUgPSBnbHchLmdldEFsaWduZWRNYXhVbmlmb3JtQmxvY2tTaXplKCk7XG4gICAgICBjb25zdCBtYXhDb252ZW50aW9uQmxvY2tzID0gZ2x3IS5nZXRNYXhDb252ZW50aW9uVW5pZm9ybUJsb2NrcygpO1xuICAgICAgY29uc3QgbWVtb3J5TWFuYWdlciA9IHRoaXMuX19lbmdpbmUubWVtb3J5TWFuYWdlcjtcbiAgICAgIGNvbnN0IGJ1ZmZlcjogQnVmZmVyIHwgdW5kZWZpbmVkID0gbWVtb3J5TWFuYWdlci5nZXRCdWZmZXIoQnVmZmVyVXNlLkdQVUluc3RhbmNlRGF0YSk7XG4gICAgICBpZiAodGhpcy5fX2RhdGFVQk9VaWQgPT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkKSB7XG4gICAgICAgIHRoaXMuX19kYXRhVUJPVWlkID0gdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5zZXR1cFVuaWZvcm1CdWZmZXJEYXRhQXJlYShcbiAgICAgICAgICBuZXcgRmxvYXQzMkFycmF5KGJ1ZmZlciEuZ2V0QXJyYXlCdWZmZXIoKSlcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGFycmF5ID0gbmV3IEZsb2F0MzJBcnJheShidWZmZXIhLmdldEFycmF5QnVmZmVyKCkpO1xuICAgICAgICB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LnVwZGF0ZVVuaWZvcm1CdWZmZXIoXG4gICAgICAgICAgdGhpcy5fX2RhdGFVQk9VaWQsXG4gICAgICAgICAgYXJyYXksXG4gICAgICAgICAgMCxcbiAgICAgICAgICAoYWxpZ25lZE1heFVuaWZvcm1CbG9ja1NpemUgKiBtYXhDb252ZW50aW9uQmxvY2tzKSAvIDQgLy8gKDQgYnl0ZXMgdW5pdClcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXR0YWNoZXMgR1BVIGRhdGEgZm9yIGEgcHJpbWl0aXZlIChwbGFjZWhvbGRlciBpbXBsZW1lbnRhdGlvbikuXG4gICAqIFRoaXMgbWV0aG9kIGlzIHBhcnQgb2YgdGhlIENHQVBJU3RyYXRlZ3kgaW50ZXJmYWNlIGJ1dCBpcyBub3QgdXNlZFxuICAgKiBpbiB0aGUgZGF0YSB0ZXh0dXJlIHN0cmF0ZWd5IHNpbmNlIGRhdGEgaXMgaGFuZGxlZCB0aHJvdWdoIHRleHR1cmVzLlxuICAgKlxuICAgKiBAcGFyYW0gcHJpbWl0aXZlIC0gVGhlIHByaW1pdGl2ZSB0byBhdHRhY2ggR1BVIGRhdGEgZm9yXG4gICAqL1xuICBhdHRhY2hHUFVEYXRhKF9wcmltaXRpdmU6IFByaW1pdGl2ZSk6IHZvaWQge31cblxuICAvKipcbiAgICogSW50ZXJuYWwgR1BVIGRhdGEgYXR0YWNobWVudCAocGxhY2Vob2xkZXIgaW1wbGVtZW50YXRpb24pLlxuICAgKiBUaGlzIG1ldGhvZCBpcyBwYXJ0IG9mIHRoZSBpbnRlcmZhY2UgYnV0IG5vdCBhY3RpdmVseSB1c2VkIGluIGRhdGEgdGV4dHVyZSBzdHJhdGVneS5cbiAgICpcbiAgICogQHBhcmFtIGdsIC0gVGhlIFdlYkdMIHJlbmRlcmluZyBjb250ZXh0XG4gICAqIEBwYXJhbSBzaGFkZXJQcm9ncmFtIC0gVGhlIHNoYWRlciBwcm9ncmFtIHRvIGF0dGFjaCBkYXRhIHRvXG4gICAqL1xuICBhdHRhY2hHUFVEYXRhSW5uZXIoX2dsOiBXZWJHTFJlbmRlcmluZ0NvbnRleHQsIF9zaGFkZXJQcm9ncmFtOiBXZWJHTFByb2dyYW0pIHt9XG5cbiAgLyoqXG4gICAqIEF0dGFjaGVzIHZlcnRleCBkYXRhIGZvciBhIHByaW1pdGl2ZSAocGxhY2Vob2xkZXIgaW1wbGVtZW50YXRpb24pLlxuICAgKiBUaGlzIG1ldGhvZCBpcyBwYXJ0IG9mIHRoZSBpbnRlcmZhY2UgYnV0IGRlbGVnYXRlcyB0byBhdHRhY2hWZXJ0ZXhEYXRhSW5uZXIuXG4gICAqXG4gICAqIEBwYXJhbSBpIC0gSW5kZXggcGFyYW1ldGVyICh1bnVzZWQgaW4gdGhpcyBpbXBsZW1lbnRhdGlvbilcbiAgICogQHBhcmFtIHByaW1pdGl2ZSAtIFRoZSBwcmltaXRpdmUgdG8gYXR0YWNoIHZlcnRleCBkYXRhIGZvclxuICAgKiBAcGFyYW0gZ2x3IC0gVGhlIFdlYkdMIGNvbnRleHQgd3JhcHBlclxuICAgKiBAcGFyYW0gaW5zdGFuY2VJREJ1ZmZlclVpZCAtIFRoZSBpbnN0YW5jZSBJRCBidWZmZXIgcmVzb3VyY2UgaGFuZGxlXG4gICAqL1xuICBhdHRhY2hWZXJ0ZXhEYXRhKFxuICAgIF9pOiBudW1iZXIsXG4gICAgX3ByaW1pdGl2ZTogUHJpbWl0aXZlLFxuICAgIF9nbHc6IFdlYkdMQ29udGV4dFdyYXBwZXIsXG4gICAgX2luc3RhbmNlSURCdWZmZXJVaWQ6IFdlYkdMUmVzb3VyY2VIYW5kbGVcbiAgKTogdm9pZCB7fVxuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBpbXBsZW1lbnRhdGlvbiBmb3IgYXR0YWNoaW5nIHZlcnRleCBkYXRhIHRvIHRoZSByZW5kZXJpbmcgcGlwZWxpbmUuXG4gICAqIFRoaXMgbWV0aG9kIGJpbmRzIHRoZSBhcHByb3ByaWF0ZSBWZXJ0ZXggQXJyYXkgT2JqZWN0IChWQU8pIG9yIHNldHMgdXBcbiAgICogdmVydGV4IGF0dHJpYnV0ZSBwb2ludGVycyBhbmQgZWxlbWVudCBidWZmZXIgYmluZGluZ3MuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNoIC0gVGhlIG1lc2ggY29udGFpbmluZyB0aGUgdmVydGV4IGRhdGFcbiAgICogQHBhcmFtIHByaW1pdGl2ZSAtIFRoZSBzcGVjaWZpYyBwcmltaXRpdmUgd2l0aGluIHRoZSBtZXNoXG4gICAqIEBwYXJhbSBwcmltaXRpdmVJbmRleCAtIEluZGV4IG9mIHRoZSBwcmltaXRpdmUgd2l0aGluIHRoZSBtZXNoXG4gICAqIEBwYXJhbSBnbHcgLSBUaGUgV2ViR0wgY29udGV4dCB3cmFwcGVyIGZvciBXZWJHTCBvcGVyYXRpb25zXG4gICAqIEBwYXJhbSBpbnN0YW5jZUlEQnVmZmVyVWlkIC0gUmVzb3VyY2UgaGFuZGxlIGZvciBpbnN0YW5jZSBJRCBidWZmZXJcbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBtZXRob2QgaGFuZGxlcyB0d28gc2NlbmFyaW9zOlxuICAgKiAtIElmIGEgVkFPIGV4aXN0cywgaXQgc2ltcGx5IGJpbmRzIHRoZSBWQU8gKG1vc3QgZWZmaWNpZW50KVxuICAgKiAtIElmIG5vIFZBTyBleGlzdHMsIGl0IG1hbnVhbGx5IHNldHMgdXAgdmVydGV4IGF0dHJpYnV0ZXMgYW5kIGluZGV4IGJ1ZmZlclxuICAgKi9cbiAgYXR0YWNoVmVydGV4RGF0YUlubmVyKFxuICAgIG1lc2g6IE1lc2gsXG4gICAgcHJpbWl0aXZlOiBQcmltaXRpdmUsXG4gICAgcHJpbWl0aXZlSW5kZXg6IEluZGV4LFxuICAgIGdsdzogV2ViR0xDb250ZXh0V3JhcHBlcixcbiAgICBfaW5zdGFuY2VJREJ1ZmZlclVpZDogV2ViR0xSZXNvdXJjZUhhbmRsZVxuICApOiB2b2lkIHtcbiAgICAvLyBiaW5kXG4gICAgY29uc3QgdmFvID0gdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5nZXRXZWJHTFJlc291cmNlKFxuICAgICAgbWVzaC5nZXRWYW9VaWRzKHByaW1pdGl2ZUluZGV4KVxuICAgICkgYXMgV2ViR0xWZXJ0ZXhBcnJheU9iamVjdE9FUztcbiAgICBpZiAodmFvICE9IG51bGwpIHtcbiAgICAgIGdsdy5iaW5kVmVydGV4QXJyYXkodmFvKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVGhlIHByZXZpb3VzIGRyYXcgbWF5IGhhdmUgbGVmdCBpdHMgVkFPIGJvdW5kLiBVbmJpbmQgaXQgc28gdGhhdCB0aGUgYXR0cmlidXRlIHNldHVwIGJlbG93XG4gICAgICAvLyBnb2VzIHRvIHRoZSBkZWZhdWx0IHZlcnRleCBhcnJheSBpbnN0ZWFkIG9mIG92ZXJ3cml0aW5nIHRoYXQgVkFPLlxuICAgICAgZ2x3LmJpbmRWZXJ0ZXhBcnJheShudWxsKTtcbiAgICAgIGNvbnN0IHZlcnRleEhhbmRsZXMgPSBwcmltaXRpdmUudmVydGV4SGFuZGxlcyE7XG4gICAgICB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LnNldFZlcnRleERhdGFUb1BpcGVsaW5lKHZlcnRleEhhbmRsZXMsIHByaW1pdGl2ZSwgbWVzaC5fdmFyaWF0aW9uVkJPVWlkKTtcbiAgICAgIGNvbnN0IGlibyA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuZ2V0V2ViR0xSZXNvdXJjZSh2ZXJ0ZXhIYW5kbGVzLmlib0hhbmRsZSEpIGFzIFdlYkdMQnVmZmVyO1xuICAgICAgY29uc3QgZ2wgPSBnbHcuZ2V0UmF3Q29udGV4dCgpO1xuICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgaWJvKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGV0YWNoZXMgdmVydGV4IGRhdGEgYWZ0ZXIgcmVuZGVyaW5nIHRvIGtlZXAgVkFPIHN0YXRlIGlzb2xhdGVkIGZyb20gZXh0ZXJuYWwgcmVuZGVyZXJzLlxuICAgKlxuICAgKiBAcGFyYW0gZ2x3IC0gVGhlIFdlYkdMIGNvbnRleHQgd3JhcHBlciBmb3IgV2ViR0wgb3BlcmF0aW9uc1xuICAgKi9cbiAgZGV0dGFjaFZlcnRleERhdGEoZ2x3OiBXZWJHTENvbnRleHRXcmFwcGVyKTogdm9pZCB7XG4gICAgY29uc3QgZ2wgPSBnbHcuZ2V0UmF3Q29udGV4dCgpO1xuICAgIGdsdy5iaW5kVmVydGV4QXJyYXkobnVsbCk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbnVsbCk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIG51bGwpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiBXZWJHTFN0cmF0ZWd5V2ViR0wyLlxuICAgKiBDcmVhdGVzIHRoZSBpbnN0YW5jZSBpZiBpdCBkb2Vzbid0IGV4aXN0IGFuZCBpbml0aWFsaXplcyB0aGUgV2ViWFIgc3lzdGVtIHJlZmVyZW5jZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiBXZWJHTFN0cmF0ZWd5V2ViR0wyXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGVuc3VyZXMgb25seSBvbmUgaW5zdGFuY2Ugb2YgdGhlIHN0cmF0ZWd5IGV4aXN0cyB0aHJvdWdob3V0IHRoZSBhcHBsaWNhdGlvblxuICAgKiBhbmQgcHJvcGVybHkgaW5pdGlhbGl6ZXMgdGhlIFdlYlhSIHN5c3RlbSBmb3IgVlIvQVIgcmVuZGVyaW5nIGNhcGFiaWxpdGllcy5cbiAgICovXG4gIHN0YXRpYyBpbml0KGVuZ2luZTogRW5naW5lKSB7XG4gICAgcmV0dXJuIG5ldyBXZWJHTFN0cmF0ZWd5V2ViR0wyKGVuZ2luZSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY3VycmVudCBjb21wb25lbnQgU0lEcyBmb3IgZWFjaCBkaXNwbGF5IGluZGV4IGluIFZSL25vbi1WUiByZW5kZXJpbmcuXG4gICAqIFRoaXMgbWV0aG9kIGNvbmZpZ3VyZXMgY2FtZXJhIGNvbXBvbmVudCBTSURzIGJhc2VkIG9uIHRoZSByZW5kZXJpbmcgbW9kZVxuICAgKiBhbmQgZGlzcGxheSBjb25maWd1cmF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gcmVuZGVyUGFzcyAtIFRoZSBjdXJyZW50IHJlbmRlciBwYXNzIGJlaW5nIHByb2Nlc3NlZFxuICAgKiBAcGFyYW0gZGlzcGxheUlkeCAtIFRoZSBkaXNwbGF5IGluZGV4ICgwIG9yIDEgZm9yIHN0ZXJlbyByZW5kZXJpbmcpXG4gICAqIEBwYXJhbSBpc1ZSTWFpblBhc3MgLSBXaGV0aGVyIHRoaXMgaXMgYSBWUiBtYWluIHJlbmRlcmluZyBwYXNzXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIEZvciBWUiByZW5kZXJpbmc6XG4gICAqIC0gVXNlcyBXZWJYUiBzeXN0ZW0gdG8gZ2V0IGFwcHJvcHJpYXRlIGNhbWVyYSBjb21wb25lbnQgU0lEXG4gICAqIC0gSGFuZGxlcyBib3RoIG11bHRpdmlldyBhbmQgc2VwYXJhdGUgZXllIHJlbmRlcmluZ1xuICAgKiBGb3Igbm9uLVZSIHJlbmRlcmluZzpcbiAgICogLSBVc2VzIHRoZSByZW5kZXIgcGFzcyBjYW1lcmEgb3IgZmFsbHMgYmFjayB0byBjdXJyZW50IGNhbWVyYVxuICAgKiAtIFNldHMgY2FtZXJhIGNvbXBvbmVudCBTSUQgdG8gLTEgaWYgbm8gY2FtZXJhIGlzIGF2YWlsYWJsZVxuICAgKi9cbiAgcHJpdmF0ZSBfX3NldEN1cnJlbnRDb21wb25lbnRTSURzRm9yRWFjaERpc3BsYXlJZHgocmVuZGVyUGFzczogUmVuZGVyUGFzcywgZGlzcGxheUlkeDogMCB8IDEsIGlzVlJNYWluUGFzczogYm9vbGVhbikge1xuICAgIGlmIChpc1ZSTWFpblBhc3MpIHtcbiAgICAgIGxldCBjYW1lcmFDb21wb25lbnRTaWQgPSAtMTtcbiAgICAgIGNvbnN0IHdlYnhyU3lzdGVtID0gdGhpcy5fX2VuZ2luZS5fd2ViWFJTeXN0ZW1JZkVuYWJsZWQ7XG4gICAgICBpZiAod2VieHJTeXN0ZW0/LmlzV2ViWFJNb2RlKSB7XG4gICAgICAgIGlmICh3ZWJ4clN5c3RlbS5pc011bHRpVmlldygpKSB7XG4gICAgICAgICAgY2FtZXJhQ29tcG9uZW50U2lkID0gd2VieHJTeXN0ZW0uX2dldENhbWVyYUNvbXBvbmVudFNJREF0KDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNhbWVyYUNvbXBvbmVudFNpZCA9IHdlYnhyU3lzdGVtLl9nZXRDYW1lcmFDb21wb25lbnRTSURBdChkaXNwbGF5SWR4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5fX2N1cnJlbnRDb21wb25lbnRTSURzIS5fdltXZWxsS25vd25Db21wb25lbnRUSURzLkNhbWVyYUNvbXBvbmVudFRJRF0gPSBjYW1lcmFDb21wb25lbnRTaWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE5vbi1WUiBSZW5kZXJpbmdcbiAgICAgIGxldCBjYW1lcmFDb21wb25lbnQgPSByZW5kZXJQYXNzLmNhbWVyYUNvbXBvbmVudDtcbiAgICAgIGlmIChjYW1lcmFDb21wb25lbnQgPT0gbnVsbCkge1xuICAgICAgICAvLyBpZiB0aGUgcmVuZGVyUGFzcyBoYXMgbm8gY2FtZXJhQ29tcG9uZW50LCB0cnkgdG8gZ2V0IHRoZSBjdXJyZW50IGNhbWVyYUNvbXBvbmVudFxuICAgICAgICBjYW1lcmFDb21wb25lbnQgPSB0aGlzLl9fZW5naW5lLmNvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50KFxuICAgICAgICAgIENhbWVyYUNvbXBvbmVudCxcbiAgICAgICAgICBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudCh0aGlzLl9fZW5naW5lKVxuICAgICAgICApIGFzIENhbWVyYUNvbXBvbmVudDtcbiAgICAgIH1cbiAgICAgIGlmIChjYW1lcmFDb21wb25lbnQpIHtcbiAgICAgICAgdGhpcy5fX2N1cnJlbnRDb21wb25lbnRTSURzIS5fdltXZWxsS25vd25Db21wb25lbnRUSURzLkNhbWVyYUNvbXBvbmVudFRJRF0gPSBjYW1lcmFDb21wb25lbnQuY29tcG9uZW50U0lEO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fX2N1cnJlbnRDb21wb25lbnRTSURzIS5fdltXZWxsS25vd25Db21wb25lbnRUSURzLkNhbWVyYUNvbXBvbmVudFRJRF0gPSAtMTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY3VycmVudCBjb21wb25lbnQgU0lEcyBmb3IgZWFjaCBwcmltaXRpdmUgYmVpbmcgcmVuZGVyZWQuXG4gICAqIFRoaXMgbWV0aG9kIHVwZGF0ZXMgdGhlIGdsb2JhbCBjb21wb25lbnQgU0lEIGFycmF5IHdpdGggbWF0ZXJpYWwtc3BlY2lmaWMgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBnbCAtIFRoZSBXZWJHTCByZW5kZXJpbmcgY29udGV4dFxuICAgKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgYmVpbmcgdXNlZCBmb3IgcmVuZGVyaW5nXG4gICAqIEBwYXJhbSBzaGFkZXJQcm9ncmFtIC0gVGhlIGFjdGl2ZSBzaGFkZXIgcHJvZ3JhbVxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCBlbnN1cmVzIHRoZSBzaGFkZXIgaGFzIGFjY2VzcyB0byB0aGUgY29ycmVjdCBtYXRlcmlhbCBTSURcbiAgICogYW5kIGluaXRpYWxpemVzIHRoZSBjb21wb25lbnQgU0lEIGFycmF5IGlmIGl0IGhhc24ndCBiZWVuIHNldCB1cCB5ZXQuXG4gICAqIFRoZSBtYXRlcmlhbCBTSUQgaXMgc3RvcmVkIGF0IGluZGV4IDAgb2YgdGhlIGNvbXBvbmVudCBTSUQgYXJyYXkuXG4gICAqL1xuICBwcml2YXRlIF9fc2V0Q3VycmVudENvbXBvbmVudFNJRHNGb3JFYWNoUHJpbWl0aXZlKFxuICAgIF9nbDogV2ViR0xSZW5kZXJpbmdDb250ZXh0LFxuICAgIG1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgICBfc2hhZGVyUHJvZ3JhbTogV2ViR0xQcm9ncmFtXG4gICkge1xuICAgIGlmICh0aGlzLl9fY3VycmVudENvbXBvbmVudFNJRHMgPT0gbnVsbCkge1xuICAgICAgdGhpcy5fX2N1cnJlbnRDb21wb25lbnRTSURzID0gdGhpcy5fX2VuZ2luZS5nbG9iYWxEYXRhUmVwb3NpdG9yeS5nZXRWYWx1ZSgnY3VycmVudENvbXBvbmVudFNJRHMnLCAwKTtcbiAgICB9XG5cbiAgICB0aGlzLl9fY3VycmVudENvbXBvbmVudFNJRHMhLl92WzBdID0gbWF0ZXJpYWwubWF0ZXJpYWxTSUQ7XG4gIH1cblxuICAvKipcbiAgICogUGFja3MgdGhlIHZpc2libGUgaW5zdGFuY2VzIG9mIGV2ZXJ5IG1lc2ggZHJhd24gaW4gdGhpcyBwYXNzIGludG8gdGhlIGVuZ2luZS13aWRlXG4gICAqIHJlbWFwIHRhYmxlIGFuZCB1cGxvYWRzIHRoZSBpbnN0YW5jZSBTSUQgLyByZW1hcCB0ZXh0dXJlcyBvbmNlIGJlZm9yZSBkcmF3aW5nLlxuICAgKiBUaGlzIG11c3QgaGFwcGVuIGJlZm9yZSBhbnkgZHJhdyBzbyB0aGF0IGEgbXVsdGktZHJhdyBiYXRjaCBzcGFubmluZyBzZXZlcmFsIG1lc2hlc1xuICAgKiBzZWVzIHRoZSByZW1hcCBlbnRyaWVzIG9mIGFsbCBpdHMgbWVzaGVzLlxuICAgKi9cbiAgcHJpdmF0ZSBfX3VwbG9hZEluc3RhbmNlVGFibGVzKFxuICAgIHByaW1pdGl2ZVVpZHM6IFByaW1pdGl2ZVVJRFtdLFxuICAgIHJlbmRlclBhc3M6IFJlbmRlclBhc3MsXG4gICAgcHJpbWl0aXZlczogUHJpbWl0aXZlW10gfCBudWxsXG4gICk6IHZvaWQge1xuICAgIGlmICghdGhpcy5fX2VuZ2luZS5jb25maWcuaXNNdWx0aURyYXdFbmFibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBjb25zdCBnbHcgPSB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5jdXJyZW50V2ViR0xDb250ZXh0V3JhcHBlcjtcbiAgICBpZiAoZ2x3ID09IG51bGwgfHwgZ2x3LndlYmdsMkV4dE1EID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdGFibGUgPSB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5pbnN0YW5jZVNpZFRhYmxlO1xuICAgIGlmICghdGFibGUuaXNTdXBwb3J0ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjdWxsaW5nU3RhdGUgPSBNZXNoUmVuZGVyZXJDb21wb25lbnQuX2dldEluc3RhbmNlQ3VsbGluZ1N0YXRlKHJlbmRlclBhc3MpO1xuICAgIGNvbnN0IGFueUN1bGxlZCA9IGN1bGxpbmdTdGF0ZSAhPSBudWxsICYmIGN1bGxpbmdTdGF0ZS5jdWxsZWRFbnRpdHlDb3VudCA+IDA7XG4gICAgLy8gRXZlcnkgbWVzaCBzaG93cyBhbGwgb2YgaXRzIGluc3RhbmNlczogdGhlIHJlbWFwIHRhYmxlIGlzIHRoZSBpZGVudGl0eSwgc28gdGhlXG4gICAgLy8gdmVydGV4IHNoYWRlciBjYW4gaW5kZXggdGhlIFNJRCB0ZXhlbCBkaXJlY3RseSBhbmQgc2tpcCBhIGRlcGVuZGVudCBmZXRjaC5cbiAgICB0aGlzLl9faW5zdGFuY2VSZW1hcElkZW50aXR5ID0gYW55Q3VsbGVkID8gMCA6IDE7XG4gICAgaWYgKCFhbnlDdWxsZWQpIHtcbiAgICAgIC8vIFJlbWFwIGVudHJpZXMgYXJlIHVudXNlZCBhbmQgZXZlcnkgZHJhd24gbWVzaCdzIFNJRCByZWNvcmRzIGFyZSBhbHJlYWR5IHdyaXR0ZW4sXG4gICAgICAvLyBzbyBub3RoaW5nIGhhcyB0byBiZSBwYWNrZWQgZm9yIHRoaXMgcGFzcy5cbiAgICAgIHRoaXMuX191cGxvYWRJbnN0YW5jZVNpZERhdGFUZXh0dXJlKHRhYmxlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjdWxsZWRFbnRpdHlTdGFtcCA9IGN1bGxpbmdTdGF0ZSEuY3VsbGVkRW50aXR5U3RhbXA7XG4gICAgY29uc3QgY3VsbFRpY2sgPSBjdWxsaW5nU3RhdGUhLmN1bGxUaWNrO1xuICAgIGNvbnN0IGN1bGxpbmdJZCA9IGN1bGxpbmdTdGF0ZSEuY3VsbGluZ0lkO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJpbWl0aXZlVWlkcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJpbWl0aXZlVWlkID0gcHJpbWl0aXZlVWlkc1tpXTtcbiAgICAgIGlmIChwcmltaXRpdmVVaWQgPT09IC0xKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgcHJpbWl0aXZlID0gcHJpbWl0aXZlcyAhPSBudWxsID8gcHJpbWl0aXZlc1tpXSA6IFByaW1pdGl2ZS5nZXRQcmltaXRpdmUocHJpbWl0aXZlVWlkKTtcbiAgICAgIGlmIChwcmltaXRpdmUgPT0gbnVsbCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG1lc2ggPSBwcmltaXRpdmUubWVzaCBhcyBNZXNoO1xuICAgICAgaWYgKG1lc2ggPT0gbnVsbCB8fCBtZXNoLl9yZW1hcFByZXBhc3NJZCA9PT0gY3VsbGluZ0lkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgbWVzaC5fcmVtYXBQcmVwYXNzSWQgPSBjdWxsaW5nSWQ7XG4gICAgICBtZXNoLl9wYWNrVmlzaWJsZUluc3RhbmNlc1RvVmFyaWF0aW9uVkJPKGN1bGxlZEVudGl0eVN0YW1wLCBjdWxsVGljayk7XG4gICAgfVxuICAgIHRoaXMuX191cGxvYWRJbnN0YW5jZVNpZERhdGFUZXh0dXJlKHRhYmxlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGxvYWRzIHRoZSBkaXJ0eSBpbnN0YW5jZSBTSUQgLyByZW1hcCByb3dzIGludG8gdGhlIGVuZ2luZSBkYXRhIHRleHR1cmUuXG4gICAqIFRoZSB0d28gdGFibGVzIGFyZSBzdG9yZWQgaW4gcmVzZXJ2ZWQgcm93cyBhZnRlciB0aGUgY29tcG9uZW50IGRhdGEsIHNvIHRoZVxuICAgKiBzaGFkZXIgY2FuIHJlYWQgdGhlbSBmcm9tIHRleHR1cmUgdW5pdCAwIGFuZCBubyBleHRyYSB0ZXh0dXJlIHVuaXQgaXMgY29uc3VtZWQuXG4gICAqL1xuICBwcml2YXRlIF9fdXBsb2FkSW5zdGFuY2VTaWREYXRhVGV4dHVyZSh0YWJsZTogSW5zdGFuY2VTaWRUYWJsZSk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9fZGF0YVRleHR1cmVVaWQgPT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkIHx8IHRoaXMuX19kYXRhVGV4dHVyZVdpZHRoIDw9IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdXNlZEVuZCA9IHRhYmxlLnVzZWRFbmQ7XG4gICAgaWYgKHVzZWRFbmQgPD0gMCkge1xuICAgICAgdGFibGUuY2xlYXJTaWREaXJ0eSgpO1xuICAgICAgdGFibGUuY2xlYXJSZW1hcERpcnR5KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRhYmxlLnNpZERpcnR5KSB7XG4gICAgICB0aGlzLl9fdXBsb2FkSW5zdGFuY2VSZWdpb24odGhpcy5fX2luc3RhbmNlU2lkQmFzZVJvdywgdXNlZEVuZCwgKGRzdCwgdGV4ZWxPZmZzZXQsIGNvdW50KSA9PlxuICAgICAgICB0YWJsZS53cml0ZVNpZFRleGVscyhkc3QsIHRleGVsT2Zmc2V0LCBjb3VudClcbiAgICAgICk7XG4gICAgICB0YWJsZS5jbGVhclNpZERpcnR5KCk7XG4gICAgfVxuICAgIC8vIFdoZW4gbm8gaW5zdGFuY2UgaXMgY3VsbGVkIHRoZSBzaGFkZXIgc2tpcHMgdGhlIHJlbWFwIGxvb2t1cCwgc28gYSBzdGFsZSByZW1hcFxuICAgIC8vIHJlZ2lvbiBpcyBoYXJtbGVzcyBhbmQgdGhlIHVwbG9hZCBjYW4gYmUgZGVmZXJyZWQgdW50aWwgYSBjdWxsZWQgcGFzcyBuZWVkcyBpdC5cbiAgICBpZiAodGFibGUucmVtYXBEaXJ0eSAmJiB0aGlzLl9faW5zdGFuY2VSZW1hcElkZW50aXR5ID09PSAwKSB7XG4gICAgICB0aGlzLl9fdXBsb2FkSW5zdGFuY2VSZWdpb24odGhpcy5fX2luc3RhbmNlUmVtYXBCYXNlUm93LCBNYXRoLmNlaWwodXNlZEVuZCAvIDQpLCAoZHN0LCB0ZXhlbE9mZnNldCwgY291bnQpID0+XG4gICAgICAgIHRhYmxlLndyaXRlUmVtYXBUZXhlbHMoZHN0LCB0ZXhlbE9mZnNldCwgY291bnQpXG4gICAgICApO1xuICAgICAgdGFibGUuY2xlYXJSZW1hcERpcnR5KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVwbG9hZHMgYHRleGVsQ291bnRgIHRleGVscyBzdGFydGluZyBhdCBgYmFzZVJvd2AgdG8gdGhlIGRhdGEgdGV4dHVyZS4gUm93cyBhcmVcbiAgICogYHRoaXMuX19kYXRhVGV4dHVyZVdpZHRoYCB0ZXhlbHMgd2lkZSwgc28gdGhlIGxhc3Qgcm93IGlzIHVwbG9hZGVkIHBhcnRpYWxseS5cbiAgICovXG4gIHByaXZhdGUgX191cGxvYWRJbnN0YW5jZVJlZ2lvbihcbiAgICBiYXNlUm93OiBudW1iZXIsXG4gICAgdGV4ZWxDb3VudDogbnVtYmVyLFxuICAgIGZpbGw6IChkc3Q6IEZsb2F0MzJBcnJheSwgdGV4ZWxPZmZzZXQ6IG51bWJlciwgY291bnQ6IG51bWJlcikgPT4gdm9pZFxuICApOiB2b2lkIHtcbiAgICBjb25zdCB3aWR0aCA9IHRoaXMuX19kYXRhVGV4dHVyZVdpZHRoO1xuICAgIGxldCByZW1haW5pbmcgPSB0ZXhlbENvdW50O1xuICAgIGxldCB0ZXhlbE9mZnNldCA9IDA7XG4gICAgbGV0IHJvdyA9IGJhc2VSb3c7XG4gICAgd2hpbGUgKHJlbWFpbmluZyA+IDApIHtcbiAgICAgIGNvbnN0IGNvdW50ID0gTWF0aC5taW4ocmVtYWluaW5nLCB3aWR0aCk7XG4gICAgICBjb25zdCBkYXRhID0gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIDQpO1xuICAgICAgZmlsbChkYXRhLCB0ZXhlbE9mZnNldCwgY291bnQpO1xuICAgICAgdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS51cGRhdGVUZXh0dXJlKHRoaXMuX19kYXRhVGV4dHVyZVVpZCwgZGF0YSwge1xuICAgICAgICBsZXZlbDogMCxcbiAgICAgICAgb2Zmc2V0WDogMCxcbiAgICAgICAgb2Zmc2V0WTogcm93LFxuICAgICAgICB3aWR0aDogY291bnQsXG4gICAgICAgIGhlaWdodDogMSxcbiAgICAgICAgZm9ybWF0OiBQaXhlbEZvcm1hdC5SR0JBLFxuICAgICAgICB0eXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgICAgfSk7XG4gICAgICByZW1haW5pbmcgLT0gY291bnQ7XG4gICAgICB0ZXhlbE9mZnNldCArPSBjb3VudDtcbiAgICAgIHJvdysrO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBNYWluIHJlbmRlcmluZyBtZXRob2QgdGhhdCBwcm9jZXNzZXMgYWxsIHByaW1pdGl2ZXMgaW4gYSByZW5kZXIgcGFzcy5cbiAgICogVGhpcyBtZXRob2QgaGFuZGxlcyBkaWZmZXJlbnQgcHJpbWl0aXZlIHR5cGVzIChvcGFxdWUsIHRyYW5zbHVjZW50LCBibGVuZClcbiAgICogYW5kIG1hbmFnZXMgVlIvbm9uLVZSIHJlbmRlcmluZyBtb2Rlcy5cbiAgICpcbiAgICogQHBhcmFtIHByaW1pdGl2ZVVpZHMgLSBBcnJheSBvZiBwcmltaXRpdmUgVUlEcyB0byByZW5kZXJcbiAgICogQHBhcmFtIHJlbmRlclBhc3MgLSBUaGUgcmVuZGVyIHBhc3MgY29uZmlndXJhdGlvblxuICAgKiBAcGFyYW0gcmVuZGVyUGFzc1RpY2tDb3VudCAtIEN1cnJlbnQgdGljayBjb3VudCBmb3IgdGhlIHJlbmRlciBwYXNzXG4gICAqIEBwYXJhbSBkaXNwbGF5SWR4IC0gVGhlIGluZGV4IG9mIHRoZSBkaXNwbGF5IHRvIHJlbmRlciB0b1xuICAgKiBAcmV0dXJucyB0cnVlIGlmIGFueSBwcmltaXRpdmVzIHdlcmUgc3VjY2Vzc2Z1bGx5IHJlbmRlcmVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBtZXRob2QgcHJvY2Vzc2VzIHByaW1pdGl2ZXMgaW4gdGhlIGZvbGxvd2luZyBvcmRlcjpcbiAgICogMS4gT3BhcXVlIHByaW1pdGl2ZXMgKGJhY2stdG8tZnJvbnQgZm9yIGRlcHRoIG9wdGltaXphdGlvbilcbiAgICogMi4gVHJhbnNsdWNlbnQgcHJpbWl0aXZlcyAoZnJvbnQtdG8tYmFjayBmb3IgcHJvcGVyIGJsZW5kaW5nKVxuICAgKiAzLiBCbGVuZCBwcmltaXRpdmVzIHdpdGggWi13cml0ZSBlbmFibGVkXG4gICAqIDQuIEJsZW5kIHByaW1pdGl2ZXMgd2l0aG91dCBaLXdyaXRlXG4gICAqXG4gICAqIFRoZSBtZXRob2QgYWxzbyBoYW5kbGVzIGJ1ZmZlci1sZXNzIHJlbmRlcmluZyBtb2RlIGZvciBzcGVjaWFsIGNhc2VzXG4gICAqIGFuZCBtYW5hZ2VzIGRlcHRoIG1hc2sgc2V0dGluZ3MgZm9yIGRpZmZlcmVudCBwcmltaXRpdmUgdHlwZXMuXG4gICAqL1xuICBjb21tb25fJHJlbmRlcihcbiAgICBwcmltaXRpdmVVaWRzOiBQcmltaXRpdmVVSURbXSxcbiAgICByZW5kZXJQYXNzOiBSZW5kZXJQYXNzLFxuICAgIHJlbmRlclBhc3NUaWNrQ291bnQ6IENvdW50LFxuICAgIF9kaXNwbGF5SWR4OiBJbmRleFxuICApIHtcbiAgICBpZiAodHlwZW9mIHNwZWN0b3IgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBzcGVjdG9yLnNldE1hcmtlcignfCAgfCAgV2ViR0wyOmNvbW1vbl8kcmVuZGVyIycpO1xuICAgIH1cbiAgICBjb25zdCBnbHcgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmN1cnJlbnRXZWJHTENvbnRleHRXcmFwcGVyITtcbiAgICBjb25zdCBnbCA9IGdsdy5nZXRSYXdDb250ZXh0QXNXZWJHTDIoKTtcblxuICAgIGNvbnN0IGlzVlJNYWluUGFzcyA9IFdlYkdMU3RyYXRlZ3lDb21tb25NZXRob2QuaXNWck1haW5QYXNzKHRoaXMuX19lbmdpbmUsIHJlbmRlclBhc3MpO1xuICAgIGNvbnN0IGRpc3BsYXlDb3VudCA9IFdlYkdMU3RyYXRlZ3lDb21tb25NZXRob2QuZ2V0RGlzcGxheUNvdW50KGlzVlJNYWluUGFzcywgdGhpcy5fX2VuZ2luZS5fd2ViWFJTeXN0ZW1JZkVuYWJsZWQpO1xuICAgIC8vIFRoZSBzb3J0IHB1Ymxpc2hlcyB0aGUgcHJpbWl0aXZlcyBpbiB0aGUgc2FtZSBvcmRlciBhcyB0aGVpciB1aWRzLCBzbyB0aGUgaG90IGxvb3BzIGNhblxuICAgIC8vIHNraXAgYSByZXBvc2l0b3J5IGxvb2t1cCBwZXIgcHJpbWl0aXZlLiBUaGUgY2hlY2sga2VlcHMgdGhpcyB2YWxpZCBmb3IgY2FsbGVycyB0aGF0IHBhc3NcbiAgICAvLyBhbm90aGVyIGFycmF5IChlLmcuIGEgY2xvbmVkIHJlbmRlciBwYXNzKS5cbiAgICBjb25zdCBwcmltaXRpdmVzID0gcmVuZGVyUGFzcy5fbGFzdFByaW1pdGl2ZVVpZHMgPT09IHByaW1pdGl2ZVVpZHMgPyByZW5kZXJQYXNzLl9sYXN0UHJpbWl0aXZlcyA6IG51bGw7XG5cbiAgICBpZiAocmVuZGVyUGFzcy5pc0J1ZmZlckxlc3NSZW5kZXJpbmdNb2RlKCkpIHtcbiAgICAgIHRoaXMuX19yZW5kZXJXaXRob3V0QnVmZmVycyhnbCwgcmVuZGVyUGFzcywgaXNWUk1haW5QYXNzKTtcbiAgICAgIGdsLmRlcHRoTWFzayh0cnVlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHRoaXMuX191cGxvYWRJbnN0YW5jZVRhYmxlcyhwcmltaXRpdmVVaWRzLCByZW5kZXJQYXNzLCBwcmltaXRpdmVzKTtcblxuICAgIGxldCByZW5kZXJlZFNvbWV0aGluZyA9IGZhbHNlO1xuXG4gICAgLy8gRm9yIG9wYXF1ZSBwcmltaXRpdmVzXG4gICAgaWYgKHJlbmRlclBhc3MuX3RvUmVuZGVyT3BhcXVlUHJpbWl0aXZlcykge1xuICAgICAgaWYgKCFyZW5kZXJQYXNzLmRlcHRoV3JpdGVNYXNrKSB7XG4gICAgICAgIGdsLmRlcHRoTWFzayhmYWxzZSk7XG4gICAgICB9XG4gICAgICAvLyBEcmF3aW5nIGZyb20gdGhlIG5lYXJlc3Qgb2JqZWN0XG4gICAgICByZW5kZXJlZFNvbWV0aGluZyA9XG4gICAgICAgIHRoaXMuX19yZW5kZXJCdWNrZXQoXG4gICAgICAgICAgcHJpbWl0aXZlVWlkcyxcbiAgICAgICAgICBwcmltaXRpdmVzLFxuICAgICAgICAgIHJlbmRlclBhc3MuX2xhc3RPcGFxdWVJbmRleCxcbiAgICAgICAgICAwLFxuICAgICAgICAgIC0xLFxuICAgICAgICAgIGdsdyxcbiAgICAgICAgICByZW5kZXJQYXNzLFxuICAgICAgICAgIGlzVlJNYWluUGFzcyxcbiAgICAgICAgICBkaXNwbGF5Q291bnRcbiAgICAgICAgKSB8fCByZW5kZXJlZFNvbWV0aGluZztcbiAgICB9XG5cbiAgICBpZiAocmVuZGVyUGFzcy5fdG9SZW5kZXJUcmFuc2x1Y2VudFByaW1pdGl2ZXMpIHtcbiAgICAgIC8vIERyYXcgVHJhbnNsdWNlbnQgcHJpbWl0aXZlc1xuICAgICAgcmVuZGVyZWRTb21ldGhpbmcgPVxuICAgICAgICB0aGlzLl9fcmVuZGVyQnVja2V0KFxuICAgICAgICAgIHByaW1pdGl2ZVVpZHMsXG4gICAgICAgICAgcHJpbWl0aXZlcyxcbiAgICAgICAgICByZW5kZXJQYXNzLl9sYXN0T3BhcXVlSW5kZXggKyAxLFxuICAgICAgICAgIHJlbmRlclBhc3MuX2xhc3RUcmFuc2x1Y2VudEluZGV4LFxuICAgICAgICAgIDEsXG4gICAgICAgICAgZ2x3LFxuICAgICAgICAgIHJlbmRlclBhc3MsXG4gICAgICAgICAgaXNWUk1haW5QYXNzLFxuICAgICAgICAgIGRpc3BsYXlDb3VudFxuICAgICAgICApIHx8IHJlbmRlcmVkU29tZXRoaW5nO1xuICAgIH1cblxuICAgIGlmIChyZW5kZXJQYXNzLl90b1JlbmRlckJsZW5kV2l0aFpXcml0ZVByaW1pdGl2ZXMpIHtcbiAgICAgIC8vIERyYXcgQmxlbmQgcHJpbWl0aXZlcyB3aXRoIFpXcml0ZVxuICAgICAgcmVuZGVyZWRTb21ldGhpbmcgPVxuICAgICAgICB0aGlzLl9fcmVuZGVyQnVja2V0KFxuICAgICAgICAgIHByaW1pdGl2ZVVpZHMsXG4gICAgICAgICAgcHJpbWl0aXZlcyxcbiAgICAgICAgICByZW5kZXJQYXNzLl9sYXN0VHJhbnNsdWNlbnRJbmRleCArIDEsXG4gICAgICAgICAgcmVuZGVyUGFzcy5fbGFzdEJsZW5kV2l0aFpXcml0ZUluZGV4LFxuICAgICAgICAgIDEsXG4gICAgICAgICAgZ2x3LFxuICAgICAgICAgIHJlbmRlclBhc3MsXG4gICAgICAgICAgaXNWUk1haW5QYXNzLFxuICAgICAgICAgIGRpc3BsYXlDb3VudFxuICAgICAgICApIHx8IHJlbmRlcmVkU29tZXRoaW5nO1xuICAgIH1cblxuICAgIGlmIChyZW5kZXJQYXNzLl90b1JlbmRlckJsZW5kV2l0aG91dFpXcml0ZVByaW1pdGl2ZXMpIHtcbiAgICAgIC8vIGRpc2FibGUgZGVwdGggd3JpdGUgZm9yIGJsZW5kIHByaW1pdGl2ZXNcbiAgICAgIGdsLmRlcHRoTWFzayhmYWxzZSk7XG5cbiAgICAgIC8vIERyYXcgQmxlbmQgcHJpbWl0aXZlcyB3aXRob3V0IFpXcml0ZVxuICAgICAgcmVuZGVyZWRTb21ldGhpbmcgPVxuICAgICAgICB0aGlzLl9fcmVuZGVyQnVja2V0KFxuICAgICAgICAgIHByaW1pdGl2ZVVpZHMsXG4gICAgICAgICAgcHJpbWl0aXZlcyxcbiAgICAgICAgICByZW5kZXJQYXNzLl9sYXN0QmxlbmRXaXRoWldyaXRlSW5kZXggKyAxLFxuICAgICAgICAgIHJlbmRlclBhc3MuX2xhc3RCbGVuZFdpdGhvdXRaV3JpdGVJbmRleCxcbiAgICAgICAgICAxLFxuICAgICAgICAgIGdsdyxcbiAgICAgICAgICByZW5kZXJQYXNzLFxuICAgICAgICAgIGlzVlJNYWluUGFzcyxcbiAgICAgICAgICBkaXNwbGF5Q291bnRcbiAgICAgICAgKSB8fCByZW5kZXJlZFNvbWV0aGluZztcbiAgICB9XG5cbiAgICBnbC5kZXB0aE1hc2sodHJ1ZSk7XG5cbiAgICAvLyBEcmF3cyBsZWF2ZSB0aGVpciBWQU8gYm91bmQgKHNlZSBfX3JlbmRlcklubmVyKSwgc28gZGV0YWNoIG9uY2UgcGVyIHBhc3MgdG8ga2VlcCB0aGUgVkFPIHN0YXRlXG4gICAgLy8gaXNvbGF0ZWQgZnJvbSBleHRlcm5hbCByZW5kZXJlcnMgKGUuZy4gRWZmZWtzZWVyKSBhbmQgZnJvbSBvdGhlciBwYXNzZXMuXG4gICAgdGhpcy5kZXR0YWNoVmVydGV4RGF0YShnbHcpO1xuXG4gICAgdGhpcy5fX2xhc3RSZW5kZXJQYXNzVGlja0NvdW50ID0gcmVuZGVyUGFzc1RpY2tDb3VudDtcblxuICAgIC8vIHRoaXMuX193ZWJnbFJlc291cmNlUmVwb3NpdG9yeS51bmJpbmRUZXh0dXJlU2FtcGxlcnMoKTtcblxuICAgIHJldHVybiByZW5kZXJlZFNvbWV0aGluZztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5kZXJzIHByaW1pdGl2ZXMgd2l0aG91dCB1c2luZyB2ZXJ0ZXgvaW5kZXggYnVmZmVycy5cbiAgICogVGhpcyBzcGVjaWFsaXplZCByZW5kZXJpbmcgbW9kZSBpcyB1c2VkIGZvciBjZXJ0YWluIHR5cGVzIG9mIHByb2NlZHVyYWxcbiAgICogb3Igc2hhZGVyLWdlbmVyYXRlZCBnZW9tZXRyeS5cbiAgICpcbiAgICogQHBhcmFtIGdsIC0gVGhlIFdlYkdMIDIuMCByZW5kZXJpbmcgY29udGV4dFxuICAgKiBAcGFyYW0gcmVuZGVyUGFzcyAtIFRoZSByZW5kZXIgcGFzcyBjb25maWd1cmF0aW9uXG4gICAqIEBwYXJhbSBpc1ZSTWFpblBhc3MgLSBXaGV0aGVyIHRoaXMgaXMgYSBWUiBtYWluIHJlbmRlcmluZyBwYXNzXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGhhbmRsZXMgYnVmZmVyLWxlc3MgcmVuZGVyaW5nIGJ5OlxuICAgKiAtIFNldHRpbmcgdXAgdGhlIHNoYWRlciBwcm9ncmFtIGFuZCBkYXRhIHRleHR1cmUgYmluZGluZ1xuICAgKiAtIENvbmZpZ3VyaW5nIGNvbXBvbmVudCBTSURzIGFuZCBWUiBzdGF0ZVxuICAgKiAtIFNldHRpbmcgbWF0ZXJpYWwgcGFyYW1ldGVycyBkaXJlY3RseVxuICAgKiAtIFVzaW5nIGRyYXdBcnJheXMgd2l0aCB0aGUgc3BlY2lmaWVkIHByaW1pdGl2ZSBtb2RlIGFuZCB2ZXJ0ZXggY291bnRcbiAgICovXG4gIHByaXZhdGUgX19yZW5kZXJXaXRob3V0QnVmZmVycyhnbDogV2ViR0wyUmVuZGVyaW5nQ29udGV4dCwgcmVuZGVyUGFzczogUmVuZGVyUGFzcywgaXNWUk1haW5QYXNzOiBib29sZWFuKSB7XG4gICAgLy8gc2V0dXAgc2hhZGVyIHByb2dyYW1cbiAgICBjb25zdCBtYXRlcmlhbDogTWF0ZXJpYWwgPSByZW5kZXJQYXNzLm1hdGVyaWFsITtcbiAgICBjb25zdCBwcmltaXRpdmU6IFByaW1pdGl2ZSA9IHJlbmRlclBhc3MuX2R1bW15UHJpbWl0aXZlRm9yQnVmZmVyTGVzc1JlbmRlcmluZztcbiAgICBzZXR1cFNoYWRlclByb2dyYW0obWF0ZXJpYWwsIHByaW1pdGl2ZSwgdGhpcyk7XG5cbiAgICBjb25zdCBzaGFkZXJQcm9ncmFtVWlkID0gbWF0ZXJpYWwuZ2V0U2hhZGVyUHJvZ3JhbVVpZChwcmltaXRpdmUpO1xuICAgIGNvbnN0IHNoYWRlclByb2dyYW0gPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmdldFdlYkdMUmVzb3VyY2Uoc2hhZGVyUHJvZ3JhbVVpZCkhIGFzIFdlYkdMUHJvZ3JhbTtcbiAgICBnbC51c2VQcm9ncmFtKHNoYWRlclByb2dyYW0pO1xuICAgIHRoaXMuX19sYXN0U2hhZGVyID0gc2hhZGVyUHJvZ3JhbVVpZDtcblxuICAgIC8vIEJpbmQgRGF0YVRleHR1cmVcbiAgICB0aGlzLmJpbmREYXRhVGV4dHVyZShnbCwgc2hhZGVyUHJvZ3JhbSk7XG5cbiAgICB0aGlzLl9fc2V0Q3VycmVudENvbXBvbmVudFNJRHNGb3JFYWNoUHJpbWl0aXZlKGdsLCBtYXRlcmlhbCwgc2hhZGVyUHJvZ3JhbSk7XG4gICAgdGhpcy5fX3NldEN1cnJlbnRDb21wb25lbnRTSURzRm9yRWFjaERpc3BsYXlJZHgocmVuZGVyUGFzcywgMCwgaXNWUk1haW5QYXNzKTtcblxuICAgIHRoaXMuX191cGxvYWRDdXJyZW50Q29tcG9uZW50U0lEcyhnbCwgc2hhZGVyUHJvZ3JhbSk7XG4gICAgdGhpcy5fX3VwbG9hZExpZ2h0Q2x1c3RlclZpZXcoZ2wsIHNoYWRlclByb2dyYW0pO1xuXG4gICAgaWYgKChzaGFkZXJQcm9ncmFtIGFzIGFueSkudnJTdGF0ZSAhPSBudWxsICYmIGlzVlJNYWluUGFzcykge1xuICAgICAgY29uc3QgdnJTdGF0ZSA9IHRoaXMuX19lbmdpbmUuZ2xvYmFsRGF0YVJlcG9zaXRvcnkuZ2V0VmFsdWUoJ3ZyU3RhdGUnLCAwKSBhcyBWZWN0b3IyO1xuICAgICAgdnJTdGF0ZS5fdlswXSA9IGlzVlJNYWluUGFzcyA/IDEgOiAwO1xuICAgICAgdnJTdGF0ZS5fdlsxXSA9IDA7XG4gICAgICAoc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLl9nbC51bmlmb3JtMml2KChzaGFkZXJQcm9ncmFtIGFzIGFueSkudnJTdGF0ZSwgdnJTdGF0ZS5fdik7XG4gICAgfVxuXG4gICAgV2ViR0xTdHJhdGVneUNvbW1vbk1ldGhvZC5zZXRXZWJHTFBhcmFtZXRlcnModGhpcy5fX2VuZ2luZSwgbWF0ZXJpYWwsIGdsKTtcblxuICAgIG1hdGVyaWFsLl9zZXRQYXJhbWV0ZXJzVG9HcHVXZWJHTFdpdGhPdXRJbnRlcm5hbFNldHRpbmcoe1xuICAgICAgc2hhZGVyUHJvZ3JhbSxcbiAgICAgIGZpcnN0VGltZTogdHJ1ZSxcbiAgICB9KTtcblxuICAgIGlmIChyZW5kZXJQYXNzLmRlcHRoV3JpdGVNYXNrKSB7XG4gICAgICBnbC5kZXB0aE1hc2sodHJ1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdsLmRlcHRoTWFzayhmYWxzZSk7XG4gICAgfVxuXG4gICAgdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5zZXRWaWV3cG9ydCh0aGlzLl9fZW5naW5lLCByZW5kZXJQYXNzLmdldFZpZXdwb3J0KCkpO1xuXG4gICAgLy8gQSBidWZmZXItbGVzcyBkcmF3IGJpbmRzIG5vIHZlcnRleCBidWZmZXIsIHNvIHRoZSBzaGFkZXIgcmVhZHMgdGhlIGdlbmVyaWMgdmFsdWUgb2YgdGhlXG4gICAgLy8gbWF0ZXJpYWxTSUQgYXR0cmlidXRlLiBGdWxsLXNjcmVlbiBzaGFkZXJzIChibHVyLCBsdW1pbmFuY2UgZGV0ZWN0aW9uLCB0b25lIG1hcHBpbmcsIC4uLilcbiAgICAvLyBsb29rIHVwIHRoZWlyIHBhcmFtZXRlcnMgaW4gdGhlIGRhdGEgdGV4dHVyZSBieSBtYXRlcmlhbFNJRCwgc28gaXQgbXVzdCBiZSBzZXQgZm9yIHRoaXNcbiAgICAvLyBkcmF3OyBvdGhlcndpc2UgdGhleSByZWFkIGFub3RoZXIgbWF0ZXJpYWwncyByb3cgKG9yIGFuIHVuZGVmaW5lZCB2YWx1ZSkuIFRoZSBpbnN0YW5jZSBTSURcbiAgICAvLyBsb29rdXAgaXMgdW51c2VkIGJ5IHRoZXNlIHNoYWRlcnMsIGJ1dCBwcmVyZXF1aXNpdGVzIHN0aWxsIGRlY2xhcmVzIGl0cyB1bmlmb3Jtcywgc28ga2VlcFxuICAgIC8vIHRoZW0gZGVmaW5lZCBhcyB3ZWxsLlxuICAgIGNvbnN0IGdsdyA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuY3VycmVudFdlYkdMQ29udGV4dFdyYXBwZXI7XG4gICAgaWYgKGdsdyAhPSBudWxsICYmIHRoaXMuX191c2VNYXRlcmlhbFNpZEF0dHJpYnV0ZShnbHcpKSB7XG4gICAgICAvLyBUaGUgZGVmYXVsdCBWQU8gaGFzIG5vIGVuYWJsZWQgYXR0cmlidXRlIGFycmF5cywgc28gdGhlIGdlbmVyaWMgdmFsdWVzIGFyZSB1c2VkLlxuICAgICAgZ2wuYmluZFZlcnRleEFycmF5KG51bGwpO1xuICAgICAgZ2wudmVydGV4QXR0cmliSTR1aShWZXJ0ZXhBdHRyaWJ1dGUuTWF0ZXJpYWxTaWQuZ2V0QXR0cmlidXRlU2xvdCgpLCBtYXRlcmlhbC5tYXRlcmlhbFNJRCwgMCwgMCwgMCk7XG4gICAgICBnbC52ZXJ0ZXhBdHRyaWJJNHVpKFZlcnRleEF0dHJpYnV0ZS5JbnN0YW5jZS5nZXRBdHRyaWJ1dGVTbG90KCksIDAsIDAsIDAsIDApO1xuICAgICAgdGhpcy5fX3NldEluc3RhbmNlUmVtYXBJZGVudGl0eShnbCwgc2hhZGVyUHJvZ3JhbSk7XG4gICAgICB0aGlzLl9fc2V0SW5zdGFuY2VTaWREYXRhVGV4dHVyZUluZGljZXMoZ2wsIHNoYWRlclByb2dyYW0pO1xuICAgIH1cblxuICAgIGdsLmRyYXdBcnJheXMoXG4gICAgICByZW5kZXJQYXNzLl9wcmltaXRpdmVNb2RlRm9yQnVmZmVyTGVzc1JlbmRlcmluZy5pbmRleCxcbiAgICAgIDAsXG4gICAgICByZW5kZXJQYXNzLl9kcmF3VmVydGV4TnVtYmVyRm9yQnVmZmVyTGVzc1JlbmRlcmluZ1xuICAgICk7XG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgcGVyLXZlcnRleCBtYXRlcmlhbFNJRCAvIGluc3RhbmNlQmFzZSBhdHRyaWJ1dGUgcGF0aCBpcyBhY3RpdmUuICovXG4gIHByaXZhdGUgX191c2VNYXRlcmlhbFNpZEF0dHJpYnV0ZShnbHc6IFdlYkdMQ29udGV4dFdyYXBwZXIpOiBib29sZWFuIHtcbiAgICByZXR1cm4gKFxuICAgICAgdGhpcy5fX2VuZ2luZS5jb25maWcuaXNNdWx0aURyYXdFbmFibGVkICYmXG4gICAgICBnbHcud2ViZ2wyRXh0TUQgIT0gbnVsbCAmJlxuICAgICAgdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5pbnN0YW5jZVNpZFRhYmxlLmlzU3VwcG9ydGVkXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCaW5kcyB0aGUgVkFPIHZhcmlhbnQgbWF0Y2hpbmcgdGhlIGVmZmVjdGl2ZSBtYXRlcmlhbCBhbmQgc2V0cyB0aGUgZ2VuZXJpY1xuICAgKiBtYXRlcmlhbFNJRCB3aGVuIHRoZSBwZXItdmVydGV4IG1hdGVyaWFsU0lEIGJ1ZmZlciBtdXN0IG5vdCBiZSB1c2VkXG4gICAqIChub24tZ3JvdXBlZCBwcmltaXRpdmVzIGFuZCByZW5kZXItcGFzcyBtYXRlcmlhbCBvdmVycmlkZXMpLlxuICAgKi9cbiAgcHJpdmF0ZSBfX2JpbmRNdWx0aURyYXdWZXJ0ZXhEYXRhRm9yTWF0ZXJpYWwoXG4gICAgcHJpbWl0aXZlOiBQcmltaXRpdmUsXG4gICAgbWF0ZXJpYWw6IE1hdGVyaWFsLFxuICAgIGdsdzogV2ViR0xDb250ZXh0V3JhcHBlclxuICApOiB2b2lkIHtcbiAgICBjb25zdCBzbG90ID0gVmVydGV4QXR0cmlidXRlLk1hdGVyaWFsU2lkLmdldEF0dHJpYnV0ZVNsb3QoKTtcbiAgICBjb25zdCBncm91cCA9IHByaW1pdGl2ZS5fbXVsdGlEcmF3R3JvdXA7XG4gICAgY29uc3QgZ2wgPSBnbHcuZ2V0UmF3Q29udGV4dEFzV2ViR0wyKCk7XG4gICAgaWYgKGdyb3VwID09IG51bGwgfHwgZ3JvdXAudmVydGV4SGFuZGxlcyA9PSBudWxsKSB7XG4gICAgICAvLyBMZWdhY3kgVkFPOiB0aGUgYXR0cmlidXRlIGlzIGRpc2FibGVkIGFuZCByZWFkcyB0aGUgZ2VuZXJpYyB2YWx1ZS5cbiAgICAgIGdsLnZlcnRleEF0dHJpYkk0dWkoc2xvdCwgbWF0ZXJpYWwubWF0ZXJpYWxTSUQsIDAsIDAsIDApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBpc1BlclZlcnRleE1hdGVyaWFsID0gbWF0ZXJpYWwgPT09IHByaW1pdGl2ZS5tYXRlcmlhbDtcbiAgICBjb25zdCB2YW9IYW5kbGUgPSBpc1BlclZlcnRleE1hdGVyaWFsID8gZ3JvdXAudmVydGV4SGFuZGxlcy52YW9IYW5kbGUgOiBncm91cC5nZW5lcmljTWF0ZXJpYWxTaWRWYW9IYW5kbGU7XG4gICAgaWYgKHZhb0hhbmRsZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCB2YW8gPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmdldFdlYkdMUmVzb3VyY2UodmFvSGFuZGxlKSBhcyBXZWJHTFZlcnRleEFycmF5T2JqZWN0T0VTO1xuICAgICAgaWYgKHZhbyAhPSBudWxsKSB7XG4gICAgICAgIGdsdy5iaW5kVmVydGV4QXJyYXkodmFvKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFpc1BlclZlcnRleE1hdGVyaWFsKSB7XG4gICAgICBnbC52ZXJ0ZXhBdHRyaWJJNHVpKHNsb3QsIG1hdGVyaWFsLm1hdGVyaWFsU0lELCAwLCAwLCAwKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVuZGVycyBhIGJ1Y2tldCByYW5nZSwgYmF0Y2hpbmcgY29uc2VjdXRpdmUgcHJpbWl0aXZlcyB0aGF0IHNoYXJlIGEgbXVsdGktZHJhd1xuICAgKiBncm91cCwgbWF0ZXJpYWwgYW5kIHNoYWRlciBwcm9ncmFtIGludG8gb25lIFdFQkdMX211bHRpX2RyYXcgY2FsbC5cbiAgICovXG4gIHByaXZhdGUgX19yZW5kZXJCdWNrZXQoXG4gICAgcHJpbWl0aXZlVWlkczogUHJpbWl0aXZlVUlEW10sXG4gICAgcHJpbWl0aXZlczogUHJpbWl0aXZlW10gfCBudWxsLFxuICAgIHN0YXJ0OiBudW1iZXIsXG4gICAgZW5kOiBudW1iZXIsXG4gICAgc3RlcDogMSB8IC0xLFxuICAgIGdsdzogV2ViR0xDb250ZXh0V3JhcHBlcixcbiAgICByZW5kZXJQYXNzOiBSZW5kZXJQYXNzLFxuICAgIGlzVlJNYWluUGFzczogYm9vbGVhbixcbiAgICBkaXNwbGF5Q291bnQ6IG51bWJlclxuICApOiBib29sZWFuIHtcbiAgICBjb25zdCB1c2VNdWx0aURyYXcgPVxuICAgICAgIWlzVlJNYWluUGFzcyAmJlxuICAgICAgZGlzcGxheUNvdW50ID09PSAxICYmXG4gICAgICB0aGlzLl9fZW5naW5lLmNvbmZpZy5pc011bHRpRHJhd0VuYWJsZWQgJiZcbiAgICAgIGdsdy53ZWJnbDJFeHRNRCAhPSBudWxsICYmXG4gICAgICB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmlzSW5zdGFuY2VTaWRUZXh0dXJlQ2FwYWJsZTtcblxuICAgIGxldCByZW5kZXJlZFNvbWV0aGluZyA9IGZhbHNlO1xuICAgIGlmICghdXNlTXVsdGlEcmF3KSB7XG4gICAgICBmb3IgKGxldCBpID0gc3RhcnQ7IHN0ZXAgPiAwID8gaSA8PSBlbmQgOiBpID49IGVuZDsgaSArPSBzdGVwKSB7XG4gICAgICAgIHJlbmRlcmVkU29tZXRoaW5nID1cbiAgICAgICAgICB0aGlzLl9fcmVuZGVySW5uZXIoXG4gICAgICAgICAgICBwcmltaXRpdmVVaWRzW2ldLFxuICAgICAgICAgICAgZ2x3LFxuICAgICAgICAgICAgcmVuZGVyUGFzcyxcbiAgICAgICAgICAgIGlzVlJNYWluUGFzcyxcbiAgICAgICAgICAgIGRpc3BsYXlDb3VudCxcbiAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHByaW1pdGl2ZXM/LltpXVxuICAgICAgICAgICkgfHwgcmVuZGVyZWRTb21ldGhpbmc7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVuZGVyZWRTb21ldGhpbmc7XG4gICAgfVxuXG4gICAgY29uc3QgZ2V0UnVuS2V5ID0gKGluZGV4OiBudW1iZXIpOiBudW1iZXIgfCBudWxsID0+IHtcbiAgICAgIGNvbnN0IHByaW1pdGl2ZVVpZCA9IHByaW1pdGl2ZVVpZHNbaW5kZXhdO1xuICAgICAgaWYgKHByaW1pdGl2ZVVpZCA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBjb25zdCBwcmltaXRpdmUgPSBwcmltaXRpdmVzICE9IG51bGwgPyBwcmltaXRpdmVzW2luZGV4XSA6IFByaW1pdGl2ZS5nZXRQcmltaXRpdmUocHJpbWl0aXZlVWlkKTtcbiAgICAgIGlmIChwcmltaXRpdmUgPT0gbnVsbCB8fCBwcmltaXRpdmUuX211bHRpRHJhd0dyb3VwID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBjb25zdCBtYXRlcmlhbCA9IHJlbmRlclBhc3MuZ2V0QXBwcm9wcmlhdGVNYXRlcmlhbChwcmltaXRpdmUpO1xuICAgICAgaWYgKCFtYXRlcmlhbC5fbWF0ZXJpYWxDb250ZW50LmlzTXVsdGlEcmF3Q29tcGF0aWJsZSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBnZXRNdWx0aURyYXdTdGF0ZUtleUlkKHByaW1pdGl2ZSwgbWF0ZXJpYWwsIGdldFByaW1pdGl2ZU1lc2hSZW5kZXJlckZpbmdlclByaW50SWQocHJpbWl0aXZlKSk7XG4gICAgfTtcblxuICAgIGNvbnN0IHBsYW4gPSBwbGFuTXVsdGlEcmF3UnVuc0ludG8oc3RhcnQsIGVuZCwgc3RlcCwgZ2V0UnVuS2V5LCB0aGlzLl9fcnVuUGxhbik7XG4gICAgZm9yIChsZXQgciA9IDA7IHIgPCBwbGFuLmNvdW50OyByKyspIHtcbiAgICAgIGNvbnN0IHJ1blN0YXJ0ID0gcGxhbi5zdGFydHNbcl07XG4gICAgICBjb25zdCBydW5Db3VudCA9IHBsYW4uY291bnRzW3JdO1xuICAgICAgaWYgKHBsYW4ua2V5c1tyXSA9PT0gLTEgfHwgcnVuQ291bnQgPCAyKSB7XG4gICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgcnVuQ291bnQ7IGsrKykge1xuICAgICAgICAgIGNvbnN0IGluZGV4ID0gcnVuU3RhcnQgKyBrICogc3RlcDtcbiAgICAgICAgICByZW5kZXJlZFNvbWV0aGluZyA9XG4gICAgICAgICAgICB0aGlzLl9fcmVuZGVySW5uZXIoXG4gICAgICAgICAgICAgIHByaW1pdGl2ZVVpZHNbaW5kZXhdLFxuICAgICAgICAgICAgICBnbHcsXG4gICAgICAgICAgICAgIHJlbmRlclBhc3MsXG4gICAgICAgICAgICAgIGlzVlJNYWluUGFzcyxcbiAgICAgICAgICAgICAgZGlzcGxheUNvdW50LFxuICAgICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICAgIHByaW1pdGl2ZXM/LltpbmRleF1cbiAgICAgICAgICAgICkgfHwgcmVuZGVyZWRTb21ldGhpbmc7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlbmRlcmVkU29tZXRoaW5nID1cbiAgICAgICAgICB0aGlzLl9fcmVuZGVyTXVsdGlEcmF3QmF0Y2goXG4gICAgICAgICAgICBwcmltaXRpdmVVaWRzLFxuICAgICAgICAgICAgcHJpbWl0aXZlcyxcbiAgICAgICAgICAgIHJ1blN0YXJ0LFxuICAgICAgICAgICAgcnVuQ291bnQsXG4gICAgICAgICAgICBzdGVwLFxuICAgICAgICAgICAgZ2x3LFxuICAgICAgICAgICAgcmVuZGVyUGFzcyxcbiAgICAgICAgICAgIGRpc3BsYXlDb3VudFxuICAgICAgICAgICkgfHwgcmVuZGVyZWRTb21ldGhpbmc7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZW5kZXJlZFNvbWV0aGluZztcbiAgfVxuXG4gIC8qKlxuICAgKiBEcmF3cyBhIHJ1biBvZiBncm91cGVkIHByaW1pdGl2ZXMgd2l0aCBvbmUgbXVsdGktZHJhdyBjYWxsLiBUaGUgcmVuZGVyIHN0YXRlXG4gICAqIChzaGFkZXIgcHJvZ3JhbSwgbWF0ZXJpYWwsIFZBTywgdGV4dHVyZXMpIGlzIHByZXBhcmVkIGJ5IHJlbmRlcmluZyB0aGUgZmlyc3RcbiAgICogcHJpbWl0aXZlIHdpdGggYSBkZWZlcnJlZCBkcmF3LlxuICAgKi9cbiAgcHJpdmF0ZSBfX3JlbmRlck11bHRpRHJhd0JhdGNoKFxuICAgIHByaW1pdGl2ZVVpZHM6IFByaW1pdGl2ZVVJRFtdLFxuICAgIHByaW1pdGl2ZXM6IFByaW1pdGl2ZVtdIHwgbnVsbCxcbiAgICBmaXJzdEluZGV4OiBudW1iZXIsXG4gICAgcnVuQ291bnQ6IG51bWJlcixcbiAgICBzdGVwOiAxIHwgLTEsXG4gICAgZ2x3OiBXZWJHTENvbnRleHRXcmFwcGVyLFxuICAgIHJlbmRlclBhc3M6IFJlbmRlclBhc3MsXG4gICAgZGlzcGxheUNvdW50OiBudW1iZXJcbiAgKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZmlyc3RQcmltaXRpdmUgPVxuICAgICAgcHJpbWl0aXZlcyAhPSBudWxsID8gcHJpbWl0aXZlc1tmaXJzdEluZGV4XSA6IFByaW1pdGl2ZS5nZXRQcmltaXRpdmUocHJpbWl0aXZlVWlkc1tmaXJzdEluZGV4XSk7XG4gICAgaWYgKGZpcnN0UHJpbWl0aXZlID09IG51bGwgfHwgZmlyc3RQcmltaXRpdmUuX211bHRpRHJhd0dyb3VwID09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgZmlyc3RNZXNoID0gZmlyc3RQcmltaXRpdmUubWVzaCBhcyBNZXNoO1xuXG4gICAgY29uc3QgZGVmZXJyZWQ6IERlZmVycmVkTXVsdGlEcmF3ID0ge1xuICAgICAgcHJpbWl0aXZlOiBmaXJzdFByaW1pdGl2ZSxcbiAgICAgIG1lc2g6IGZpcnN0TWVzaCxcbiAgICAgIGluZGV4ZWQ6IGZpcnN0UHJpbWl0aXZlLmhhc0luZGljZXMoKSxcbiAgICAgIG1vZGU6IGZpcnN0UHJpbWl0aXZlLnByaW1pdGl2ZU1vZGUuaW5kZXgsXG4gICAgICBpbmRleEJpdFNpemU6IGZpcnN0UHJpbWl0aXZlLmdldFJlbmRlckluZGV4Qml0U2l6ZSgpLFxuICAgICAgY291bnQ6IDAsXG4gICAgICBvZmZzZXQ6IDAsXG4gICAgICBpbnN0YW5jZUNvdW50OiAwLFxuICAgIH07XG5cbiAgICBjb25zdCByZW5kZXJlZEZpcnN0ID0gdGhpcy5fX3JlbmRlcklubmVyKFxuICAgICAgcHJpbWl0aXZlVWlkc1tmaXJzdEluZGV4XSxcbiAgICAgIGdsdyxcbiAgICAgIHJlbmRlclBhc3MsXG4gICAgICBmYWxzZSxcbiAgICAgIGRpc3BsYXlDb3VudCxcbiAgICAgIGRlZmVycmVkLFxuICAgICAgZmlyc3RQcmltaXRpdmVcbiAgICApO1xuICAgIGlmICghcmVuZGVyZWRGaXJzdCkge1xuICAgICAgLy8gVGhlIGZpcnN0IHByaW1pdGl2ZSB3YXMgc2tpcHBlZCAoaGlkZGVuIG9yIG5vIHZpc2libGUgaW5zdGFuY2UpLiBEcmF3IHRoZSByZXN0IGluZGl2aWR1YWxseS5cbiAgICAgIGxldCByZW5kZXJlZCA9IGZhbHNlO1xuICAgICAgZm9yIChsZXQgayA9IDE7IGsgPCBydW5Db3VudDsgaysrKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gZmlyc3RJbmRleCArIGsgKiBzdGVwO1xuICAgICAgICByZW5kZXJlZCA9XG4gICAgICAgICAgdGhpcy5fX3JlbmRlcklubmVyKFxuICAgICAgICAgICAgcHJpbWl0aXZlVWlkc1tpbmRleF0sXG4gICAgICAgICAgICBnbHcsXG4gICAgICAgICAgICByZW5kZXJQYXNzLFxuICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICBkaXNwbGF5Q291bnQsXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICBwcmltaXRpdmVzPy5baW5kZXhdXG4gICAgICAgICAgKSB8fCByZW5kZXJlZDtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZW5kZXJlZDtcbiAgICB9XG5cbiAgICBjb25zdCBncm91cCA9IGZpcnN0UHJpbWl0aXZlLl9tdWx0aURyYXdHcm91cDtcbiAgICBjb25zdCBjb3VudHMgPSBncm91cC5jb3VudHMhO1xuICAgIGNvbnN0IG9mZnNldHMgPSBncm91cC5vZmZzZXRzITtcbiAgICBjb25zdCBpbnN0YW5jZUNvdW50cyA9IGdyb3VwLmluc3RhbmNlQ291bnRzITtcbiAgICBjb25zdCBmaXJzdHMgPSBncm91cC5maXJzdHMhO1xuICAgIGNvbnN0IHZlcnRleENvdW50cyA9IGdyb3VwLnZlcnRleENvdW50cyE7XG4gICAgY29uc3QgaW5kZXhlZCA9IGRlZmVycmVkLmluZGV4ZWQ7XG4gICAgY29uc3QgZ2wgPSBnbHcuZ2V0UmF3Q29udGV4dEFzV2ViR0wyKCk7XG5cbiAgICBsZXQgZHJhd0NvdW50ID0gMDtcbiAgICBjb3VudHNbZHJhd0NvdW50XSA9IGRlZmVycmVkLmNvdW50O1xuICAgIG9mZnNldHNbZHJhd0NvdW50XSA9IGRlZmVycmVkLm9mZnNldDtcbiAgICBmaXJzdHNbZHJhd0NvdW50XSA9IGRlZmVycmVkLm9mZnNldDtcbiAgICB2ZXJ0ZXhDb3VudHNbZHJhd0NvdW50XSA9IGRlZmVycmVkLmNvdW50O1xuICAgIGluc3RhbmNlQ291bnRzW2RyYXdDb3VudF0gPSBkZWZlcnJlZC5pbnN0YW5jZUNvdW50O1xuICAgIGRyYXdDb3VudCsrO1xuXG4gICAgY29uc3QgY3VsbGluZ1N0YXRlID0gTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9nZXRJbnN0YW5jZUN1bGxpbmdTdGF0ZShyZW5kZXJQYXNzKTtcbiAgICBjb25zdCBjdWxsZWRFbnRpdHlTdGFtcCA9IGN1bGxpbmdTdGF0ZT8uY3VsbGVkRW50aXR5U3RhbXA7XG4gICAgY29uc3QgY3VsbFRpY2sgPSBjdWxsaW5nU3RhdGU/LmN1bGxUaWNrID8/IDA7XG5cbiAgICBmb3IgKGxldCBrID0gMTsgayA8IHJ1bkNvdW50OyBrKyspIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gZmlyc3RJbmRleCArIGsgKiBzdGVwO1xuICAgICAgY29uc3QgcHJpbWl0aXZlID0gcHJpbWl0aXZlcyAhPSBudWxsID8gcHJpbWl0aXZlc1tpbmRleF0gOiBQcmltaXRpdmUuZ2V0UHJpbWl0aXZlKHByaW1pdGl2ZVVpZHNbaW5kZXhdKTtcbiAgICAgIGlmIChwcmltaXRpdmUgPT0gbnVsbCB8fCBwcmltaXRpdmUuX211bHRpRHJhd0dyb3VwICE9PSBncm91cCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG1hdGVyaWFsID0gcmVuZGVyUGFzcy5nZXRBcHByb3ByaWF0ZU1hdGVyaWFsKHByaW1pdGl2ZSk7XG4gICAgICAvLyBBIGNyb3NzLW1hdGVyaWFsIGJhdGNoIGNvbnRhaW5zIG1hdGVyaWFscyB3aG9zZSBzaGFkZXIgcHJvZ3JhbSBoYXMgbm90IGJlZW5cbiAgICAgIC8vIHJlZ2lzdGVyZWQgeWV0ICh0aGUgZmlyc3QgcHJpbWl0aXZlJ3MgX19yZW5kZXJJbm5lciBvbmx5IHJlZ2lzdGVycyBpdHMgb3duXG4gICAgICAvLyBtYXRlcmlhbCkuIFJlZ2lzdGVyIHRoZSBzaGFyZWQgcHJvZ3JhbSBiZWZvcmUgdGhlIGRyYXc7IG90aGVyd2lzZVxuICAgICAgLy8gaXNTa2lwRHJhd2luZygpIHdvdWxkIHNraXAgZXZlcnkgb3RoZXIgbWF0ZXJpYWwuXG4gICAgICBpZiAobWF0ZXJpYWwuZ2V0U2hhZGVyUHJvZ3JhbVVpZChwcmltaXRpdmUpID09PSAtMSkge1xuICAgICAgICBzZXR1cFNoYWRlclByb2dyYW0obWF0ZXJpYWwsIHByaW1pdGl2ZSwgdGhpcyk7XG4gICAgICB9XG4gICAgICBpZiAoaXNTa2lwRHJhd2luZyhtYXRlcmlhbCwgcHJpbWl0aXZlKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG1lc2ggPSBwcmltaXRpdmUubWVzaCBhcyBNZXNoO1xuICAgICAgY29uc3QgaW5zdGFuY2VDb3VudCA9IG1lc2guX3BhY2tWaXNpYmxlSW5zdGFuY2VzVG9WYXJpYXRpb25WQk8oY3VsbGVkRW50aXR5U3RhbXAsIGN1bGxUaWNrKTtcbiAgICAgIGlmIChpbnN0YW5jZUNvdW50ID09PSAwKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgZW50cnkgPSBwcmltaXRpdmUuX211bHRpRHJhd0VudHJ5O1xuICAgICAgaWYgKGVudHJ5ID09IG51bGwpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb3VudHNbZHJhd0NvdW50XSA9IGVudHJ5LmluZGV4Q291bnQ7XG4gICAgICBvZmZzZXRzW2RyYXdDb3VudF0gPSBlbnRyeS5pbmRleEJ5dGVPZmZzZXQ7XG4gICAgICBmaXJzdHNbZHJhd0NvdW50XSA9IGVudHJ5LnZlcnRleE9mZnNldDtcbiAgICAgIHZlcnRleENvdW50c1tkcmF3Q291bnRdID0gZW50cnkudmVydGV4Q291bnQ7XG4gICAgICBpbnN0YW5jZUNvdW50c1tkcmF3Q291bnRdID0gaW5zdGFuY2VDb3VudDtcbiAgICAgIGRyYXdDb3VudCsrO1xuICAgIH1cblxuICAgIGlmIChkcmF3Q291bnQgPj0gMikge1xuICAgICAgaWYgKGluZGV4ZWQpIHtcbiAgICAgICAgZ2x3Lm11bHRpRHJhd0VsZW1lbnRzSW5zdGFuY2VkKFxuICAgICAgICAgIGRlZmVycmVkLm1vZGUsXG4gICAgICAgICAgY291bnRzLFxuICAgICAgICAgIDAsXG4gICAgICAgICAgZ2wuVU5TSUdORURfSU5ULFxuICAgICAgICAgIG9mZnNldHMsXG4gICAgICAgICAgMCxcbiAgICAgICAgICBpbnN0YW5jZUNvdW50cyxcbiAgICAgICAgICAwLFxuICAgICAgICAgIGRyYXdDb3VudFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZ2x3Lm11bHRpRHJhd0FycmF5c0luc3RhbmNlZChkZWZlcnJlZC5tb2RlLCBmaXJzdHMsIDAsIHZlcnRleENvdW50cywgMCwgaW5zdGFuY2VDb3VudHMsIDAsIGRyYXdDb3VudCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChkcmF3Q291bnQgPT09IDEpIHtcbiAgICAgIGlmIChpbmRleGVkKSB7XG4gICAgICAgIGdsLmRyYXdFbGVtZW50c0luc3RhbmNlZChkZWZlcnJlZC5tb2RlLCBjb3VudHNbMF0sIGdsLlVOU0lHTkVEX0lOVCwgb2Zmc2V0c1swXSwgaW5zdGFuY2VDb3VudHNbMF0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZ2wuZHJhd0FycmF5c0luc3RhbmNlZChkZWZlcnJlZC5tb2RlLCBmaXJzdHNbMF0sIHZlcnRleENvdW50c1swXSwgaW5zdGFuY2VDb3VudHNbMF0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEludGVybmFsIHJlbmRlcmluZyBpbXBsZW1lbnRhdGlvbiBmb3IgaW5kaXZpZHVhbCBwcmltaXRpdmVzLlxuICAgKiBUaGlzIG1ldGhvZCBoYW5kbGVzIHRoZSBjb21wbGV0ZSByZW5kZXJpbmcgcGlwZWxpbmUgZm9yIGEgc2luZ2xlIHByaW1pdGl2ZSxcbiAgICogaW5jbHVkaW5nIHNoYWRlciBzZXR1cCwgbWF0ZXJpYWwgY29uZmlndXJhdGlvbiwgYW5kIGRyYXcgY2FsbHMuXG4gICAqXG4gICAqIEBwYXJhbSBwcmltaXRpdmVVaWQgLSBVbmlxdWUgaWRlbnRpZmllciBvZiB0aGUgcHJpbWl0aXZlIHRvIHJlbmRlclxuICAgKiBAcGFyYW0gZ2x3IC0gVGhlIFdlYkdMIGNvbnRleHQgd3JhcHBlclxuICAgKiBAcGFyYW0gcmVuZGVyUGFzcyAtIFRoZSBjdXJyZW50IHJlbmRlciBwYXNzIGNvbmZpZ3VyYXRpb25cbiAgICogQHBhcmFtIGlzVlJNYWluUGFzcyAtIFdoZXRoZXIgdGhpcyBpcyBhIFZSIG1haW4gcmVuZGVyaW5nIHBhc3NcbiAgICogQHBhcmFtIGRpc3BsYXlDb3VudCAtIE51bWJlciBvZiBkaXNwbGF5cyB0byByZW5kZXIgdG8gKDEgZm9yIG5vcm1hbCwgMiBmb3Igc3RlcmVvIFZSKVxuICAgKiBAcmV0dXJucyB0cnVlIGlmIHRoZSBwcmltaXRpdmUgd2FzIHN1Y2Nlc3NmdWxseSByZW5kZXJlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIHBlcmZvcm1zIHRoZSBmb2xsb3dpbmcgb3BlcmF0aW9uczpcbiAgICogLSBWYWxpZGF0ZXMgdGhlIHByaW1pdGl2ZSBhbmQgcmV0cmlldmVzIGFzc29jaWF0ZWQgbWVzaCBhbmQgbWF0ZXJpYWxcbiAgICogLSBTZXRzIHVwIHNoYWRlciBwcm9ncmFtIGlmIG5lZWRlZCAod2l0aCBjYWNoaW5nIGZvciBwZXJmb3JtYW5jZSlcbiAgICogLSBDb25maWd1cmVzIHZlcnRleCBkYXRhIGFuZCBWQU8vVkJPIGJpbmRpbmdzXG4gICAqIC0gU2V0cyBtYXRlcmlhbCBwYXJhbWV0ZXJzIGFuZCB1bmlmb3Jtc1xuICAgKiAtIEhhbmRsZXMgcGVyLWRpc3BsYXkgcmVuZGVyaW5nIGZvciBWUiBzdGVyZW9cbiAgICogLSBFeGVjdXRlcyBkcmF3IGNhbGxzIChpbnN0YW5jZWQgcmVuZGVyaW5nIGZvciBtdWx0aXBsZSBtZXNoIGVudGl0aWVzKVxuICAgKlxuICAgKiBUaGUgbWV0aG9kIG9wdGltaXplcyBwZXJmb3JtYW5jZSBieSBjYWNoaW5nIHNoYWRlciBwcm9ncmFtcyBhbmQgbWF0ZXJpYWxzXG4gICAqIGJldHdlZW4gZHJhdyBjYWxscyBhbmQgb25seSB1cGRhdGluZyBHUFUgc3RhdGUgd2hlbiBuZWNlc3NhcnkuXG4gICAqL1xuICBwcml2YXRlIF9fcmVuZGVySW5uZXIoXG4gICAgcHJpbWl0aXZlVWlkOiBQcmltaXRpdmVVSUQsXG4gICAgZ2x3OiBXZWJHTENvbnRleHRXcmFwcGVyLFxuICAgIHJlbmRlclBhc3M6IFJlbmRlclBhc3MsXG4gICAgaXNWUk1haW5QYXNzOiBib29sZWFuLFxuICAgIGRpc3BsYXlDb3VudDogbnVtYmVyLFxuICAgIGRlZmVycmVkRHJhdz86IERlZmVycmVkTXVsdGlEcmF3LFxuICAgIHByaW1pdGl2ZUFyZz86IFByaW1pdGl2ZVxuICApIHtcbiAgICBjb25zdCBnbCA9IGdsdy5nZXRSYXdDb250ZXh0QXNXZWJHTDIoKTtcbiAgICBjb25zdCBwcmltaXRpdmUgPSBwcmltaXRpdmVBcmcgPz8gUHJpbWl0aXZlLmdldFByaW1pdGl2ZShwcmltaXRpdmVVaWQpO1xuICAgIGlmIChwcmltaXRpdmUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBtZXNoID0gcHJpbWl0aXZlLm1lc2ggYXMgTWVzaDtcbiAgICBjb25zdCBlbnRpdHkgPSBtZXNoLm1lc2hFbnRpdGllc0lubmVyWzBdOyAvLyBnZXQgYmFzZSBtZXNoIGZvciBpbnN0YW5jaW5nIGRyYXdcbiAgICAvLyBzZXR1cCBzaGFkZXIgcHJvZ3JhbVxuICAgIGNvbnN0IG1hdGVyaWFsOiBNYXRlcmlhbCA9IHJlbmRlclBhc3MuZ2V0QXBwcm9wcmlhdGVNYXRlcmlhbChwcmltaXRpdmUpO1xuICAgIHNldHVwU2hhZGVyUHJvZ3JhbShtYXRlcmlhbCwgcHJpbWl0aXZlLCB0aGlzKTtcblxuICAgIGNvbnN0IG1lc2hSZW5kZXJlckNvbXBvbmVudCA9IGVudGl0eS5nZXRNZXNoUmVuZGVyZXIoKSE7XG5cbiAgICAvLyBQZXItaW5zdGFuY2UgY3VsbGluZzogZHJhdyBvbmx5IHRoZSBpbnN0YW5jZXMgdGhhdCB3ZXJlIG5vdCBjdWxsZWQgaW4gdGhpcyByZW5kZXIgcGFzcy5cbiAgICAvLyBXaXRob3V0IHRoaXMsIGV2ZXJ5IGluc3RhbmNlIHNoYXJpbmcgdGhlIG1lc2ggaXMgc2tpbm5lZCBhbmQgcmFzdGVyaXplZCBldmVuIHdoZW4gaXQgaXNcbiAgICAvLyBvdXRzaWRlIHRoZSB2aWV3IGZydXN0dW0sIHdoaWNoIGRvbWluYXRlcyB0aGUgR1BVIHRpbWUgb2YgY3Jvd2Qgc2NlbmVzLlxuICAgIGNvbnN0IGluc3RhbmNlQ3VsbGluZ1N0YXRlID0gTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9nZXRJbnN0YW5jZUN1bGxpbmdTdGF0ZShyZW5kZXJQYXNzKTtcbiAgICBjb25zdCBpbnN0YW5jZUNvdW50ID0gbWVzaC5fcGFja1Zpc2libGVJbnN0YW5jZXNUb1ZhcmlhdGlvblZCTyhcbiAgICAgIGluc3RhbmNlQ3VsbGluZ1N0YXRlPy5jdWxsZWRFbnRpdHlTdGFtcCxcbiAgICAgIGluc3RhbmNlQ3VsbGluZ1N0YXRlPy5jdWxsVGljayA/PyAwXG4gICAgKTtcbiAgICBpZiAoaW5zdGFuY2VDb3VudCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHByaW1pdGl2ZUluZGV4ID0gbWVzaC5nZXRQcmltaXRpdmVJbmRleEluTWVzaChwcmltaXRpdmUpO1xuICAgIHRoaXMuYXR0YWNoVmVydGV4RGF0YUlubmVyKG1lc2gsIHByaW1pdGl2ZSwgcHJpbWl0aXZlSW5kZXgsIGdsdywgbWVzaC5fdmFyaWF0aW9uVkJPVWlkKTtcbiAgICBpZiAodGhpcy5fX3VzZU1hdGVyaWFsU2lkQXR0cmlidXRlKGdsdykpIHtcbiAgICAgIHRoaXMuX19iaW5kTXVsdGlEcmF3VmVydGV4RGF0YUZvck1hdGVyaWFsKHByaW1pdGl2ZSwgbWF0ZXJpYWwsIGdsdyk7XG4gICAgfVxuXG4gICAgbGV0IGZpcnN0VGltZUZvclNoYWRlclByb2dyYW0gPSBmYWxzZTtcbiAgICBsZXQgZmlyc3RUaW1lRm9yTWF0ZXJpYWwgPSBmYWxzZTtcbiAgICBjb25zdCBzaGFkZXJQcm9ncmFtVWlkID0gbWF0ZXJpYWwuZ2V0U2hhZGVyUHJvZ3JhbVVpZChwcmltaXRpdmUpO1xuICAgIGlmIChzaGFkZXJQcm9ncmFtVWlkICE9PSB0aGlzLl9fbGFzdFNoYWRlciB8fCAoZ2wgYXMgYW55KS5fX2NoYW5nZWRQcm9ncmFtKSB7XG4gICAgICBpZiAoaXNTa2lwRHJhd2luZyhtYXRlcmlhbCwgcHJpbWl0aXZlKSkge1xuICAgICAgICB0aGlzLmRldHRhY2hWZXJ0ZXhEYXRhKGdsdyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc2hhZGVyUHJvZ3JhbSA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuZ2V0V2ViR0xSZXNvdXJjZShzaGFkZXJQcm9ncmFtVWlkKSEgYXMgV2ViR0xQcm9ncmFtO1xuICAgICAgZ2wudXNlUHJvZ3JhbShzaGFkZXJQcm9ncmFtKTtcbiAgICAgIChnbCBhcyBhbnkpLl9fY2hhbmdlZFByb2dyYW0gPSBmYWxzZTtcbiAgICAgIC8vIEJpbmQgRGF0YVRleHR1cmVcbiAgICAgIHRoaXMuYmluZERhdGFUZXh0dXJlKGdsLCBzaGFkZXJQcm9ncmFtKTtcblxuICAgICAgLy8gZ2wudW5pZm9ybTFpKChzaGFkZXJQcm9ncmFtIGFzIGFueSkuaXNNYWluVnIsIGlzVlJNYWluUGFzcyA/IDEgOiAwKTsgLy8gVlIgTXVsdGlWaWV3IGlzIG5vdCBzdXBwb3J0ZWQgeWV0XG5cbiAgICAgIHRoaXMuX19zaGFkZXJQcm9ncmFtID0gc2hhZGVyUHJvZ3JhbTtcbiAgICAgIGZpcnN0VGltZUZvclNoYWRlclByb2dyYW0gPSB0cnVlO1xuICAgICAgZmlyc3RUaW1lRm9yTWF0ZXJpYWwgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX2xhc3RNYXRlcmlhbD8uZGVyZWYoKSAhPT0gbWF0ZXJpYWwpIHtcbiAgICAgIGZpcnN0VGltZUZvck1hdGVyaWFsID0gdHJ1ZTtcbiAgICAgIHRoaXMuX19sYXN0TWF0ZXJpYWwgPSBuZXcgV2Vha1JlZihtYXRlcmlhbCk7XG4gICAgfVxuICAgIGlmICh0aGlzLl9fbGFzdE1hdGVyaWFsU3RhdGVWZXJzaW9uICE9PSBtYXRlcmlhbC5zdGF0ZVZlcnNpb24pIHtcbiAgICAgIGZpcnN0VGltZUZvck1hdGVyaWFsID0gdHJ1ZTtcbiAgICAgIHRoaXMuX19sYXN0TWF0ZXJpYWxTdGF0ZVZlcnNpb24gPSBtYXRlcmlhbC5zdGF0ZVZlcnNpb247XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX191c2VNYXRlcmlhbFNpZEF0dHJpYnV0ZShnbHcpICYmIHRoaXMuX19zaGFkZXJQcm9ncmFtICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX19zZXRJbnN0YW5jZVJlbWFwSWRlbnRpdHkoZ2wsIHRoaXMuX19zaGFkZXJQcm9ncmFtKTtcbiAgICAgIHRoaXMuX19zZXRJbnN0YW5jZVNpZERhdGFUZXh0dXJlSW5kaWNlcyhnbCwgdGhpcy5fX3NoYWRlclByb2dyYW0pO1xuICAgIH1cblxuICAgIGNvbnN0IHJlbmRlcmluZ0FyZzogUmVuZGVyaW5nQXJnV2ViR0wgPSB7XG4gICAgICBnbHc6IGdsdyxcbiAgICAgIGVudGl0eTogZW50aXR5LFxuICAgICAgd29ybGRNYXRyaXg6IGVudGl0eS5nZXRTY2VuZUdyYXBoKCkhLm1hdHJpeElubmVyLFxuICAgICAgbm9ybWFsTWF0cml4OiBlbnRpdHkuZ2V0U2NlbmVHcmFwaCgpIS5ub3JtYWxNYXRyaXhJbm5lcixcbiAgICAgIGlzQmlsbGJvYXJkOiBlbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLmlzQmlsbGJvYXJkLFxuICAgICAgaXNWaXNpYmxlOiBlbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLmlzVmlzaWJsZSxcbiAgICAgIGxpZ2h0Q29tcG9uZW50czogdGhpcy5fX2xpZ2h0Q29tcG9uZW50cyEsXG4gICAgICByZW5kZXJQYXNzOiByZW5kZXJQYXNzLFxuICAgICAgcHJpbWl0aXZlOiBwcmltaXRpdmUsXG4gICAgICBkaWZmdXNlQ3ViZTogbWVzaFJlbmRlcmVyQ29tcG9uZW50LmRpZmZ1c2VDdWJlTWFwLFxuICAgICAgc3BlY3VsYXJDdWJlOiBtZXNoUmVuZGVyZXJDb21wb25lbnQuc3BlY3VsYXJDdWJlTWFwISxcbiAgICAgIHNoZWVuQ3ViZTogbWVzaFJlbmRlcmVyQ29tcG9uZW50LnNoZWVuQ3ViZU1hcCxcbiAgICAgIGlzVnI6IGlzVlJNYWluUGFzcyxcbiAgICAgIGRpc3BsYXlJZHg6IC0xLFxuICAgIH07XG5cbiAgICBpZiAoZmlyc3RUaW1lRm9yU2hhZGVyUHJvZ3JhbSkge1xuICAgICAgbWF0ZXJpYWwuX3NldFBhcmFtZXRlcnNUb0dwdVdlYkdMUGVyU2hhZGVyUHJvZ3JhbSh7XG4gICAgICAgIGVuZ2luZTogdGhpcy5fX2VuZ2luZSxcbiAgICAgICAgbWF0ZXJpYWwsXG4gICAgICAgIHNoYWRlclByb2dyYW06IHRoaXMuX19zaGFkZXJQcm9ncmFtISxcbiAgICAgICAgZmlyc3RUaW1lOiBmaXJzdFRpbWVGb3JTaGFkZXJQcm9ncmFtLFxuICAgICAgICBhcmdzOiByZW5kZXJpbmdBcmcsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoZmlyc3RUaW1lRm9yTWF0ZXJpYWwpIHtcbiAgICAgIHRoaXMuX19zZXRDdXJyZW50Q29tcG9uZW50U0lEc0ZvckVhY2hQcmltaXRpdmUoZ2wsIG1hdGVyaWFsLCB0aGlzLl9fc2hhZGVyUHJvZ3JhbSEpO1xuXG4gICAgICBXZWJHTFN0cmF0ZWd5Q29tbW9uTWV0aG9kLnNldFdlYkdMUGFyYW1ldGVycyh0aGlzLl9fZW5naW5lLCBtYXRlcmlhbCwgZ2wpO1xuXG4gICAgICBtYXRlcmlhbC5fc2V0UGFyYW1ldGVyc1RvR3B1V2ViR0woe1xuICAgICAgICBlbmdpbmU6IHRoaXMuX19lbmdpbmUsXG4gICAgICAgIG1hdGVyaWFsOiBtYXRlcmlhbCxcbiAgICAgICAgc2hhZGVyUHJvZ3JhbTogdGhpcy5fX3NoYWRlclByb2dyYW0hLFxuICAgICAgICBmaXJzdFRpbWU6IGZpcnN0VGltZUZvck1hdGVyaWFsLFxuICAgICAgICBhcmdzOiByZW5kZXJpbmdBcmcsXG4gICAgICB9KTtcbiAgICB9XG4gICAgbWF0ZXJpYWwuX3NldFBhcmFtZXRlcnNUb0dwdVdlYkdMUGVyUHJpbWl0aXZlKHtcbiAgICAgIG1hdGVyaWFsOiBtYXRlcmlhbCxcbiAgICAgIHNoYWRlclByb2dyYW06IHRoaXMuX19zaGFkZXJQcm9ncmFtISxcbiAgICAgIGZpcnN0VGltZTogZmlyc3RUaW1lRm9yTWF0ZXJpYWwsXG4gICAgICBhcmdzOiByZW5kZXJpbmdBcmcsXG4gICAgfSk7XG5cbiAgICBmb3IgKGxldCBkaXNwbGF5SWR4ID0gMDsgZGlzcGxheUlkeCA8IGRpc3BsYXlDb3VudDsgZGlzcGxheUlkeCsrKSB7XG4gICAgICBpZiAoaXNWUk1haW5QYXNzKSB7XG4gICAgICAgIFdlYkdMU3RyYXRlZ3lDb21tb25NZXRob2Quc2V0VlJWaWV3cG9ydCh0aGlzLl9fZW5naW5lLCByZW5kZXJQYXNzLCBkaXNwbGF5SWR4KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19zZXRDdXJyZW50Q29tcG9uZW50U0lEc0ZvckVhY2hEaXNwbGF5SWR4KHJlbmRlclBhc3MsIGRpc3BsYXlJZHggYXMgMCB8IDEsIGlzVlJNYWluUGFzcyk7XG5cbiAgICAgIHRoaXMuX191cGxvYWRDdXJyZW50Q29tcG9uZW50U0lEcyhnbCwgdGhpcy5fX3NoYWRlclByb2dyYW0hKTtcbiAgICAgIHRoaXMuX191cGxvYWRMaWdodENsdXN0ZXJWaWV3KGdsLCB0aGlzLl9fc2hhZGVyUHJvZ3JhbSEpO1xuXG4gICAgICBpZiAoKHRoaXMuX19zaGFkZXJQcm9ncmFtIGFzIGFueSkudnJTdGF0ZSAhPSBudWxsICYmIGlzVlJNYWluUGFzcyAmJiBkaXNwbGF5Q291bnQgPiAxKSB7XG4gICAgICAgIGNvbnN0IHZyU3RhdGUgPSB0aGlzLl9fZW5naW5lLmdsb2JhbERhdGFSZXBvc2l0b3J5LmdldFZhbHVlKCd2clN0YXRlJywgMCkgYXMgVmVjdG9yMjtcbiAgICAgICAgdnJTdGF0ZS5fdlswXSA9IGlzVlJNYWluUGFzcyA/IDEgOiAwO1xuICAgICAgICB2clN0YXRlLl92WzFdID0gZGlzcGxheUlkeDtcbiAgICAgICAgKHRoaXMuX19zaGFkZXJQcm9ncmFtIGFzIGFueSkuX2dsLnVuaWZvcm0yaXYoKHRoaXMuX19zaGFkZXJQcm9ncmFtIGFzIGFueSkudnJTdGF0ZSwgdnJTdGF0ZS5fdik7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHVzZUluc3RhbmNlU2lkVGV4dHVyZSA9XG4gICAgICAgIHRoaXMuX19lbmdpbmUuY29uZmlnLmlzTXVsdGlEcmF3RW5hYmxlZCAmJlxuICAgICAgICBnbHcud2ViZ2wyRXh0TUQgIT0gbnVsbCAmJlxuICAgICAgICB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5Lmluc3RhbmNlU2lkVGFibGUuaXNTdXBwb3J0ZWQ7XG4gICAgICBpZiAodXNlSW5zdGFuY2VTaWRUZXh0dXJlICYmIHByaW1pdGl2ZS5fbXVsdGlEcmF3R3JvdXAgPT0gbnVsbCkge1xuICAgICAgICAvLyBBIGdyb3VwZWQgcHJpbWl0aXZlIGRyYXdzIHdpdGggdGhlIG11bHRpLWRyYXcgZ3JvdXAgVkFPLCB3aGljaCBlbmFibGVzIHRoZVxuICAgICAgICAvLyBwZXItdmVydGV4IGluc3RhbmNlQmFzZSBhdHRyaWJ1dGUsIHNvIHRoZSBnZW5lcmljIHZhbHVlIHdvdWxkIGJlIGlnbm9yZWQuXG4gICAgICAgIC8vIE9ubHkgdGhlIGxlZ2FjeSBWQU8gbmVlZHMgaXQgKGl0cyBpbnN0YW5jZSBhdHRyaWJ1dGUgaXMgZGlzYWJsZWQpLlxuICAgICAgICAvLyBUaGUgc2hhZGVyIGFkZHMgZ2xfSW5zdGFuY2VJRCBhbmQgcmVzb2x2ZXMgdGhlIHZpc2libGUgaW5zdGFuY2UgdGhyb3VnaCB0aGUgcmVtYXAgdGFibGUuXG4gICAgICAgIGdsLnZlcnRleEF0dHJpYkk0dWkoVmVydGV4QXR0cmlidXRlLkluc3RhbmNlLmdldEF0dHJpYnV0ZVNsb3QoKSwgTWF0aC5tYXgoMCwgbWVzaC5faW5zdGFuY2VTaWRCYXNlKSwgMCwgMCwgMCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGluZGljZXNBY2Nlc3NvciA9IHByaW1pdGl2ZS5pbmRpY2VzQWNjZXNzb3I7XG4gICAgICBjb25zdCBpbmRleGVkID0gaW5kaWNlc0FjY2Vzc29yICE9IG51bGw7XG4gICAgICBjb25zdCBpbmRleEJpdFNpemUgPSBwcmltaXRpdmUuZ2V0UmVuZGVySW5kZXhCaXRTaXplKCk7XG4gICAgICBjb25zdCBpbmRleFR5cGUgPSBpbmRleEJpdFNpemUgPT09ICd1aW50MzInID8gZ2wuVU5TSUdORURfSU5UIDogZ2wuVU5TSUdORURfU0hPUlQ7XG4gICAgICBjb25zdCBtdWx0aURyYXdFbnRyeSA9IHByaW1pdGl2ZS5fbXVsdGlEcmF3RW50cnk7XG4gICAgICBjb25zdCBpbmRleEJ5dGVPZmZzZXQgPSBtdWx0aURyYXdFbnRyeT8uaW5kZXhCeXRlT2Zmc2V0ID8/IDA7XG4gICAgICBjb25zdCBmaXJzdFZlcnRleCA9IG11bHRpRHJhd0VudHJ5Py52ZXJ0ZXhPZmZzZXQgPz8gMDtcblxuICAgICAgaWYgKGRlZmVycmVkRHJhdyAhPSBudWxsKSB7XG4gICAgICAgIGRlZmVycmVkRHJhdy5wcmltaXRpdmUgPSBwcmltaXRpdmU7XG4gICAgICAgIGRlZmVycmVkRHJhdy5tZXNoID0gbWVzaDtcbiAgICAgICAgZGVmZXJyZWREcmF3LmluZGV4ZWQgPSBpbmRleGVkO1xuICAgICAgICBkZWZlcnJlZERyYXcubW9kZSA9IHByaW1pdGl2ZS5wcmltaXRpdmVNb2RlLmluZGV4O1xuICAgICAgICBkZWZlcnJlZERyYXcuaW5kZXhCaXRTaXplID0gaW5kZXhCaXRTaXplO1xuICAgICAgICBkZWZlcnJlZERyYXcuY291bnQgPSBpbmRleGVkID8gaW5kaWNlc0FjY2Vzc29yIS5lbGVtZW50Q291bnQgOiBwcmltaXRpdmUuZ2V0VmVydGV4Q291bnRBc1ZlcnRpY2VzQmFzZWQoKTtcbiAgICAgICAgZGVmZXJyZWREcmF3Lm9mZnNldCA9IGluZGV4ZWQgPyBpbmRleEJ5dGVPZmZzZXQgOiBmaXJzdFZlcnRleDtcbiAgICAgICAgZGVmZXJyZWREcmF3Lmluc3RhbmNlQ291bnQgPSBpbnN0YW5jZUNvdW50O1xuICAgICAgfSBlbHNlIGlmIChpbmRleGVkKSB7XG4gICAgICAgIGdsLmRyYXdFbGVtZW50c0luc3RhbmNlZChcbiAgICAgICAgICBwcmltaXRpdmUucHJpbWl0aXZlTW9kZS5pbmRleCxcbiAgICAgICAgICBpbmRpY2VzQWNjZXNzb3IhLmVsZW1lbnRDb3VudCxcbiAgICAgICAgICBpbmRleFR5cGUsXG4gICAgICAgICAgaW5kZXhCeXRlT2Zmc2V0LFxuICAgICAgICAgIGluc3RhbmNlQ291bnRcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGdsLmRyYXdBcnJheXNJbnN0YW5jZWQoXG4gICAgICAgICAgcHJpbWl0aXZlLnByaW1pdGl2ZU1vZGUuaW5kZXgsXG4gICAgICAgICAgZmlyc3RWZXJ0ZXgsXG4gICAgICAgICAgcHJpbWl0aXZlLmdldFZlcnRleENvdW50QXNWZXJ0aWNlc0Jhc2VkKCksXG4gICAgICAgICAgaW5zdGFuY2VDb3VudFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX19sYXN0U2hhZGVyID0gc2hhZGVyUHJvZ3JhbVVpZDtcbiAgICAvLyBUaGUgVkFPIGlzIGxlZnQgYm91bmQgb24gcHVycG9zZTogdW5iaW5kaW5nIGl0IGFmdGVyIGV2ZXJ5IGRyYXcgaXNzdWVkIHRocmVlIGV4dHJhIEdMIGNhbGxzXG4gICAgLy8gcGVyIGRyYXcuIFRoZSBuZXh0IGRyYXcgYmluZHMgaXRzIG93biBWQU8sIGFuZCBjb21tb25fJHJlbmRlcigpIGRldGFjaGVzIG9uY2UgYXQgdGhlIGVuZC5cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwbG9hZHMgdGhlIGxpZ2h0IGNsdXN0ZXIgdmlldyBvZiB0aGUgY2FtZXJhIG9mIHRoZSBkcmF3IChgdV9saWdodENsdXN0ZXJWaWV3YCkgd2hlbiB0aGUgcHJvZ3JhbSB1c2VzIGl0IGFuZFxuICAgKiB0aGUgY2FtZXJhIG9yIHRoZSBsaWdodCBjbHVzdGVyIGRhdGEgY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCB1cGxvYWQgdG8gdGhlIHByb2dyYW0uXG4gICAqXG4gICAqIFRoZSA3IHZlYzQgYXJlIFtoZWFkZXIgKDYgdmVjNCldWyh2aWV3IHZlYzQgaW5kZXgsIDAsIDAsIDApXSwgb3IgYSB2aWV3IGluZGV4IG9mIC0xIHdoZW4gdGhlIGNhbWVyYSBoYXMgbm9cbiAgICogY2x1c3RlcnMuIFVuaWZvcm0gdmFsdWVzIHBlcnNpc3QgaW4gdGhlIHByb2dyYW0gb2JqZWN0LCBzbyBjb25zZWN1dGl2ZSBkcmF3cyBvZiB0aGUgc2FtZSBjYW1lcmEgc2tpcCB0aGVcbiAgICogdXBsb2FkOyB0aGUgY2hlY2sga2VlcHMgdGhlIHBlci1kcmF3IGNvc3QgdG8gYSBjb21wYXJpc29uIGluIHRoZSBjb21tb24gY2FzZS5cbiAgICovXG4gIHByaXZhdGUgX191cGxvYWRMaWdodENsdXN0ZXJWaWV3KGdsOiBXZWJHTFJlbmRlcmluZ0NvbnRleHQgfCBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LCBzaGFkZXJQcm9ncmFtOiBXZWJHTFByb2dyYW0pIHtcbiAgICBjb25zdCBwcm9ncmFtID0gc2hhZGVyUHJvZ3JhbSBhcyBhbnk7XG4gICAgY29uc3QgbG9jYXRpb24gPSBwcm9ncmFtLmxpZ2h0Q2x1c3RlclZpZXcgYXMgV2ViR0xVbmlmb3JtTG9jYXRpb24gfCBudWxsIHwgdW5kZWZpbmVkO1xuICAgIGlmIChsb2NhdGlvbiA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGNhbWVyYVNpZCA9IHRoaXMuX19jdXJyZW50Q29tcG9uZW50U0lEcyEuX3ZbV2VsbEtub3duQ29tcG9uZW50VElEcy5DYW1lcmFDb21wb25lbnRUSURdO1xuICAgIGNvbnN0IGxpZ2h0Q2x1c3RlclN5c3RlbSA9IHRoaXMuX19lbmdpbmUubGlnaHRDbHVzdGVyU3lzdGVtO1xuICAgIGNvbnN0IHZlcnNpb24gPSBsaWdodENsdXN0ZXJTeXN0ZW0uZGF0YVZlcnNpb247XG4gICAgaWYgKHByb2dyYW0uX2xpZ2h0Q2x1c3RlclZpZXdDYW1lcmFTaWQgPT09IGNhbWVyYVNpZCAmJiBwcm9ncmFtLl9saWdodENsdXN0ZXJWaWV3VmVyc2lvbiA9PT0gdmVyc2lvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBnbC51bmlmb3JtNGZ2KGxvY2F0aW9uLCBsaWdodENsdXN0ZXJTeXN0ZW0uX2dldFZpZXdVbmlmb3JtRGF0YShjYW1lcmFTaWQpKTtcbiAgICBwcm9ncmFtLl9saWdodENsdXN0ZXJWaWV3Q2FtZXJhU2lkID0gY2FtZXJhU2lkO1xuICAgIHByb2dyYW0uX2xpZ2h0Q2x1c3RlclZpZXdWZXJzaW9uID0gdmVyc2lvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGxvYWRzIHRoZSBjdXJyZW50Q29tcG9uZW50U0lEcyB1bmlmb3JtIHVubGVzcyB0aGUgc2FtZSB2YWx1ZXMgd2VyZSBhbHJlYWR5IHVwbG9hZGVkIHRvIHRoZVxuICAgKiBzYW1lIHByb2dyYW0gYnkgdGhlIHByZXZpb3VzIHVwbG9hZC4gVW5pZm9ybSB2YWx1ZXMgcGVyc2lzdCBpbiB0aGUgcHJvZ3JhbSBvYmplY3QsIHNvXG4gICAqIGNvbnNlY3V0aXZlIGRyYXdzIG9mIHRoZSBzYW1lIG1hdGVyaWFsIChlLmcuIGEgc2hhZG93IHBhc3MpIGRvIG5vdCBuZWVkIHRvIHVwbG9hZCBhZ2Fpbi5cbiAgICovXG4gIHByaXZhdGUgX191cGxvYWRDdXJyZW50Q29tcG9uZW50U0lEcyhcbiAgICBnbDogV2ViR0xSZW5kZXJpbmdDb250ZXh0IHwgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCxcbiAgICBzaGFkZXJQcm9ncmFtOiBXZWJHTFByb2dyYW1cbiAgKSB7XG4gICAgY29uc3QgdmFsdWVzID0gdGhpcy5fX2N1cnJlbnRDb21wb25lbnRTSURzIS5fdiBhcyBGbG9hdDMyQXJyYXk7XG4gICAgbGV0IGxhc3RWYWx1ZXMgPSB0aGlzLl9fbGFzdFVwbG9hZGVkQ29tcG9uZW50U0lEcztcbiAgICBpZiAoXG4gICAgICB0aGlzLl9fbGFzdENvbXBvbmVudFNJRHNQcm9ncmFtID09PSBzaGFkZXJQcm9ncmFtICYmXG4gICAgICBsYXN0VmFsdWVzICE9IG51bGwgJiZcbiAgICAgIGxhc3RWYWx1ZXMubGVuZ3RoID09PSB2YWx1ZXMubGVuZ3RoXG4gICAgKSB7XG4gICAgICBsZXQgaXNTYW1lID0gdHJ1ZTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChsYXN0VmFsdWVzW2ldICE9PSB2YWx1ZXNbaV0pIHtcbiAgICAgICAgICBpc1NhbWUgPSBmYWxzZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGlzU2FtZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIGdsLnVuaWZvcm0xZnYoKHNoYWRlclByb2dyYW0gYXMgYW55KS5jdXJyZW50Q29tcG9uZW50U0lEcywgdmFsdWVzKTtcbiAgICBpZiAobGFzdFZhbHVlcyA9PSBudWxsIHx8IGxhc3RWYWx1ZXMubGVuZ3RoICE9PSB2YWx1ZXMubGVuZ3RoKSB7XG4gICAgICBsYXN0VmFsdWVzID0gbmV3IEZsb2F0MzJBcnJheSh2YWx1ZXMubGVuZ3RoKTtcbiAgICAgIHRoaXMuX19sYXN0VXBsb2FkZWRDb21wb25lbnRTSURzID0gbGFzdFZhbHVlcztcbiAgICB9XG4gICAgbGFzdFZhbHVlcy5zZXQodmFsdWVzKTtcbiAgICB0aGlzLl9fbGFzdENvbXBvbmVudFNJRHNQcm9ncmFtID0gc2hhZGVyUHJvZ3JhbTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCaW5kcyB0aGUgZGF0YSB0ZXh0dXJlIHRvIHRoZSBXZWJHTCBjb250ZXh0IGZvciBzaGFkZXIgYWNjZXNzLlxuICAgKiBUaGlzIG1ldGhvZCBzZXRzIHVwIHRoZSB0ZXh0dXJlIGJpbmRpbmcgYW5kIHNhbXBsZXIgY29uZmlndXJhdGlvblxuICAgKiB0aGF0IGFsbG93cyBzaGFkZXJzIHRvIGFjY2VzcyB0aGUgZGF0YSB0ZXh0dXJlLlxuICAgKlxuICAgKiBAcGFyYW0gZ2wgLSBUaGUgV2ViR0wgcmVuZGVyaW5nIGNvbnRleHRcbiAgICogQHBhcmFtIHNoYWRlclByb2dyYW0gLSBUaGUgc2hhZGVyIHByb2dyYW0gdGhhdCB3aWxsIGFjY2VzcyB0aGUgZGF0YSB0ZXh0dXJlXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIHBlcmZvcm1zIHRoZSBmb2xsb3dpbmcgb3BlcmF0aW9uczpcbiAgICogLSBTZXRzIHRoZSBkYXRhIHRleHR1cmUgdW5pZm9ybSB0byB0ZXh0dXJlIHVuaXQgMFxuICAgKiAtIEJpbmRzIHRoZSBkYXRhIHRleHR1cmUgdG8gdGV4dHVyZSB1bml0IDBcbiAgICogLSBDcmVhdGVzIGFuZCBiaW5kcyBhIHJlcGVhdC9uZWFyZXN0IHNhbXBsZXIgZm9yIG9wdGltYWwgZGF0YSB0ZXh0dXJlIGFjY2Vzc1xuICAgKlxuICAgKiBUZXh0dXJlIHVuaXQgMCBpcyB1c2VkIGFzIGEgZGVkaWNhdGVkIHNsb3QgZm9yIGRhdGEgdGV4dHVyZSBhY2Nlc3MuXG4gICAqIE90aGVyIG1hdGVyaWFsIHRleHR1cmVzIHNob3VsZCBzdGFydCBmcm9tIHRleHR1cmUgdW5pdCAxLlxuICAgKi9cbiAgcHJpdmF0ZSBiaW5kRGF0YVRleHR1cmUoZ2w6IFdlYkdMUmVuZGVyaW5nQ29udGV4dCB8IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQsIHNoYWRlclByb2dyYW06IFdlYkdMUHJvZ3JhbSkge1xuICAgIGdsLnVuaWZvcm0xaSgoc2hhZGVyUHJvZ3JhbSBhcyBhbnkpLmRhdGFUZXh0dXJlLCAwKTtcbiAgICB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmJpbmRUZXh0dXJlMkQoMCwgdGhpcy5fX2RhdGFUZXh0dXJlVWlkKTtcbiAgICBjb25zdCBzYW1wbGVyVWlkID0gdGhpcy5fX2VuZ2luZS53ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5jcmVhdGVPckdldFRleHR1cmVTYW1wbGVyUmVwZWF0TmVhcmVzdCgpO1xuICAgIHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuYmluZFRleHR1cmVTYW1wbGVyKDAsIHNhbXBsZXJVaWQpO1xuICAgIHRoaXMuYmluZEluc3RhbmNlU2lkVGV4dHVyZXMoZ2wsIHNoYWRlclByb2dyYW0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEJpbmRzIHRoZSBlbmdpbmUtd2lkZSBpbnN0YW5jZSBTSUQgLyByZW1hcCB0ZXh0dXJlcyB1c2VkIGJ5IG11bHRpLWRyYXcgcmVuZGVyaW5nLlxuICAgKiBUaGUgdGV4dHVyZXMgYXJlIGRlY2xhcmVkIGluIHRoZSBjb21tb24gdmVydGV4IHNoYWRlciBpbmNsdWRlIGFuZCBhcmUgb25seSB1c2VkXG4gICAqIHdoZW4gUk5fVVNFX0lOU1RBTkNFX1NJRF9URVhUVVJFIGlzIGRlZmluZWQuXG4gICAqL1xuICBwcml2YXRlIGJpbmRJbnN0YW5jZVNpZFRleHR1cmVzKFxuICAgIGdsOiBXZWJHTFJlbmRlcmluZ0NvbnRleHQgfCBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LFxuICAgIHNoYWRlclByb2dyYW06IFdlYkdMUHJvZ3JhbVxuICApOiB2b2lkIHtcbiAgICBjb25zdCB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgY29uc3QgZ2x3ID0gd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuY3VycmVudFdlYkdMQ29udGV4dFdyYXBwZXI7XG4gICAgaWYgKGdsdyA9PSBudWxsIHx8IGdsdy53ZWJnbDJFeHRNRCA9PSBudWxsIHx8ICF0aGlzLl9fZW5naW5lLmNvbmZpZy5pc011bHRpRHJhd0VuYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdGFibGUgPSB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5pbnN0YW5jZVNpZFRhYmxlO1xuICAgIGlmICghdGFibGUuaXNTdXBwb3J0ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9ncmFtID0gc2hhZGVyUHJvZ3JhbSBhcyBhbnk7XG4gICAgaWYgKHByb2dyYW0uX19pbnN0YW5jZVNpZFRleHR1cmVMb2NhdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBwcm9ncmFtLl9faW5zdGFuY2VTaWREYXRhVGV4dHVyZUluZGV4TG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oXG4gICAgICAgIHNoYWRlclByb2dyYW0sXG4gICAgICAgICd1X2luc3RhbmNlU2lkRGF0YVRleHR1cmVJbmRleCdcbiAgICAgICk7XG4gICAgICBwcm9ncmFtLl9faW5zdGFuY2VSZW1hcERhdGFUZXh0dXJlSW5kZXhMb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihcbiAgICAgICAgc2hhZGVyUHJvZ3JhbSxcbiAgICAgICAgJ3VfaW5zdGFuY2VSZW1hcERhdGFUZXh0dXJlSW5kZXgnXG4gICAgICApO1xuICAgICAgcHJvZ3JhbS5fX2luc3RhbmNlUmVtYXBJZGVudGl0eUxvY2F0aW9uID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sICd1X2luc3RhbmNlUmVtYXBJZGVudGl0eScpO1xuICAgICAgLy8gS2VlcCB0aGUgb2xkIHByb3BlcnR5IG5hbWUgZGVmaW5lZCBzbyB0aGUgb25lLXRpbWUgbG9jYXRpb24gbG9va3VwIGlzIG5vdCByZXBlYXRlZC5cbiAgICAgIHByb2dyYW0uX19pbnN0YW5jZVNpZFRleHR1cmVMb2NhdGlvbiA9IG51bGw7XG4gICAgfVxuICAgIGlmIChwcm9ncmFtLl9faW5zdGFuY2VTaWREYXRhVGV4dHVyZUluZGV4TG9jYXRpb24gIT0gbnVsbCkge1xuICAgICAgZ2wudW5pZm9ybTFpKHByb2dyYW0uX19pbnN0YW5jZVNpZERhdGFUZXh0dXJlSW5kZXhMb2NhdGlvbiwgdGhpcy5fX2luc3RhbmNlU2lkQmFzZVZlYzQpO1xuICAgICAgcHJvZ3JhbS5fX2luc3RhbmNlU2lkRGF0YVRleHR1cmVJbmRleFZhbHVlID0gdGhpcy5fX2luc3RhbmNlU2lkQmFzZVZlYzQ7XG4gICAgfVxuICAgIGlmIChwcm9ncmFtLl9faW5zdGFuY2VSZW1hcERhdGFUZXh0dXJlSW5kZXhMb2NhdGlvbiAhPSBudWxsKSB7XG4gICAgICBnbC51bmlmb3JtMWkocHJvZ3JhbS5fX2luc3RhbmNlUmVtYXBEYXRhVGV4dHVyZUluZGV4TG9jYXRpb24sIHRoaXMuX19pbnN0YW5jZVJlbWFwQmFzZVZlYzQpO1xuICAgICAgcHJvZ3JhbS5fX2luc3RhbmNlUmVtYXBEYXRhVGV4dHVyZUluZGV4VmFsdWUgPSB0aGlzLl9faW5zdGFuY2VSZW1hcEJhc2VWZWM0O1xuICAgIH1cbiAgICBpZiAocHJvZ3JhbS5fX2luc3RhbmNlUmVtYXBJZGVudGl0eUxvY2F0aW9uICE9IG51bGwpIHtcbiAgICAgIGdsLnVuaWZvcm0xaShwcm9ncmFtLl9faW5zdGFuY2VSZW1hcElkZW50aXR5TG9jYXRpb24sIHRoaXMuX19pbnN0YW5jZVJlbWFwSWRlbnRpdHkpO1xuICAgICAgcHJvZ3JhbS5fX2luc3RhbmNlUmVtYXBJZGVudGl0eVZhbHVlID0gdGhpcy5fX2luc3RhbmNlUmVtYXBJZGVudGl0eTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogS2VlcHMgdGhlIGRhdGEtdGV4dHVyZSBiYXNlIGluZGljZXMgb2YgdGhlIGluc3RhbmNlIHRhYmxlcyBpbiBzeW5jIHdpdGggdGhlXG4gICAqIGN1cnJlbnQgdGV4dHVyZSBsYXlvdXQuIFRoZSBpbmRpY2VzIGNoYW5nZSB3aGVuIHRoZSBkYXRhIHRleHR1cmUgaXMgcmVjcmVhdGVkXG4gICAqIChlLmcuIHRoZSBpbnN0YW5jZSBzbG90IGNhcGFjaXR5IGdyZXcpIHdoaWxlIHRoZSBzYW1lIHByb2dyYW0gc3RheXMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF9fc2V0SW5zdGFuY2VTaWREYXRhVGV4dHVyZUluZGljZXMoZ2w6IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQsIHNoYWRlclByb2dyYW06IFdlYkdMUHJvZ3JhbSk6IHZvaWQge1xuICAgIGNvbnN0IHByb2dyYW0gPSBzaGFkZXJQcm9ncmFtIGFzIGFueTtcbiAgICBpZiAocHJvZ3JhbS5fX2luc3RhbmNlU2lkRGF0YVRleHR1cmVJbmRleExvY2F0aW9uID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc2lkQmFzZSA9IHRoaXMuX19pbnN0YW5jZVNpZEJhc2VWZWM0O1xuICAgIGlmIChwcm9ncmFtLl9faW5zdGFuY2VTaWREYXRhVGV4dHVyZUluZGV4VmFsdWUgIT09IHNpZEJhc2UpIHtcbiAgICAgIGdsLnVuaWZvcm0xaShwcm9ncmFtLl9faW5zdGFuY2VTaWREYXRhVGV4dHVyZUluZGV4TG9jYXRpb24sIHNpZEJhc2UpO1xuICAgICAgcHJvZ3JhbS5fX2luc3RhbmNlU2lkRGF0YVRleHR1cmVJbmRleFZhbHVlID0gc2lkQmFzZTtcbiAgICB9XG4gICAgY29uc3QgcmVtYXBCYXNlID0gdGhpcy5fX2luc3RhbmNlUmVtYXBCYXNlVmVjNDtcbiAgICBpZiAocHJvZ3JhbS5fX2luc3RhbmNlUmVtYXBEYXRhVGV4dHVyZUluZGV4VmFsdWUgIT09IHJlbWFwQmFzZSkge1xuICAgICAgZ2wudW5pZm9ybTFpKHByb2dyYW0uX19pbnN0YW5jZVJlbWFwRGF0YVRleHR1cmVJbmRleExvY2F0aW9uLCByZW1hcEJhc2UpO1xuICAgICAgcHJvZ3JhbS5fX2luc3RhbmNlUmVtYXBEYXRhVGV4dHVyZUluZGV4VmFsdWUgPSByZW1hcEJhc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEtlZXBzIHRoZSByZW1hcC1pZGVudGl0eSB1bmlmb3JtIGluIHN5bmMgd2l0aCB0aGUgY3VycmVudCByZW5kZXIgcGFzcy4gVGhlIGN1bGxpbmdcbiAgICogc3RhdGUgY2FuIGNoYW5nZSBiZXR3ZWVuIHBhc3NlcyB3aGlsZSB0aGUgc2FtZSBzaGFkZXIgcHJvZ3JhbSBzdGF5cyBib3VuZCwgc28gdGhpc1xuICAgKiBpcyBjaGVja2VkIGJlZm9yZSBldmVyeSBkcmF3IChhIGNoZWFwIHByb3BlcnR5IGNvbXBhcmlzb24gd2hlbiB1bmNoYW5nZWQpLlxuICAgKi9cbiAgcHJpdmF0ZSBfX3NldEluc3RhbmNlUmVtYXBJZGVudGl0eShnbDogV2ViR0wyUmVuZGVyaW5nQ29udGV4dCwgc2hhZGVyUHJvZ3JhbTogV2ViR0xQcm9ncmFtKTogdm9pZCB7XG4gICAgY29uc3QgcHJvZ3JhbSA9IHNoYWRlclByb2dyYW0gYXMgYW55O1xuICAgIGlmIChwcm9ncmFtLl9faW5zdGFuY2VSZW1hcElkZW50aXR5TG9jYXRpb24gPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBpZGVudGl0eSA9IHRoaXMuX19pbnN0YW5jZVJlbWFwSWRlbnRpdHk7XG4gICAgaWYgKHByb2dyYW0uX19pbnN0YW5jZVJlbWFwSWRlbnRpdHlWYWx1ZSA9PT0gaWRlbnRpdHkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZ2wudW5pZm9ybTFpKHByb2dyYW0uX19pbnN0YW5jZVJlbWFwSWRlbnRpdHlMb2NhdGlvbiwgaWRlbnRpdHkpO1xuICAgIHByb2dyYW0uX19pbnN0YW5jZVJlbWFwSWRlbnRpdHlWYWx1ZSA9IGlkZW50aXR5O1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFsbCBHUFUgcmVzb3VyY2VzIGhlbGQgYnkgdGhpcyBzdHJhdGVneS5cbiAgICogU2hvdWxkIGJlIGNhbGxlZCB3aGVuIHRoZSBlbmdpbmUgaXMgYmVpbmcgZGVzdHJveWVkLlxuICAgKi9cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBjb25zdCB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgaWYgKHRoaXMuX19kYXRhVGV4dHVyZVVpZCAhPT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQpIHtcbiAgICAgIHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmRlbGV0ZVRleHR1cmUodGhpcy5fX2RhdGFUZXh0dXJlVWlkKTtcbiAgICAgIHRoaXMuX19kYXRhVGV4dHVyZVVpZCA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX2RhdGFVQk9VaWQgIT09IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkKSB7XG4gICAgICB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5kZWxldGVVbmlmb3JtQnVmZmVyKHRoaXMuX19kYXRhVUJPVWlkKTtcbiAgICAgIHRoaXMuX19kYXRhVUJPVWlkID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQ7XG4gICAgfVxuICAgIGlmICh0aGlzLl9fbW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlclVpZCAhPT0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuSW52YWxpZENHQVBJUmVzb3VyY2VVaWQpIHtcbiAgICAgIHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmRlbGV0ZVVuaWZvcm1CdWZmZXIodGhpcy5fX21vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJVaWQpO1xuICAgICAgdGhpcy5fX21vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJVaWQgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX19tb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyVWlkICE9PSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5JbnZhbGlkQ0dBUElSZXNvdXJjZVVpZCkge1xuICAgICAgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuZGVsZXRlVW5pZm9ybUJ1ZmZlcih0aGlzLl9fbW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlclVpZCk7XG4gICAgICB0aGlzLl9fbW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlclVpZCA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LkludmFsaWRDR0FQSVJlc291cmNlVWlkO1xuICAgIH1cbiAgfVxuXG4gIC8vICRyZW5kZXIoKTogdm9pZCB7fVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFBLFNBQVMsMEJBQTBCO0FBQ25DLFNBQVMsMkJBQTJCO0FBQ3BDLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsdUNBQXVDO0FBQ2hELFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsNkJBQTZCO0FBQ3RDLFNBQVMsMkJBQTJCO0FBQ3BDLFNBQVMsMEJBQTBCO0FBQ25DLFNBQVMsOEJBQThCO0FBQ3ZDLFNBQVMsaUJBQWtDO0FBQzNDLFNBQVMsaUJBQWlCO0FBQzFCLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsbUJBQW1CO0FBRzVCLFNBQVMsa0JBQXVDO0FBQ2hELFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsdUJBQXVCO0FBRWhDLFNBQVMsaUJBQWlCO0FBTTFCLFNBQVMsY0FBYztBQUN2QixTQUFTLGdCQUFnQjtBQUN6QixTQUFTLCtCQUErQjtBQUV4QyxTQUFTLDBCQUEwQjtBQUNuQyxTQUFTLHFCQUFxQjtBQWM5QjtBQUFBLEVBRUU7QUFBQSxFQUNBO0FBQUEsRUFFQTtBQUFBLE9BQ0s7QUFJUCxPQUFPLDZCQUE2QiwwQkFBMEI7QUFjdkQsSUFBTSx1QkFBTixNQUFNLHFCQUE0RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQStEL0QsWUFBWSxRQUFnQjtBQTdEcEMsU0FBUSxtQkFBd0Msd0JBQXdCO0FBQ3hFLFNBQVFBLEtBQW9DLHdCQUF3QjtBQUNwRSxTQUFRQyxLQUFzRCx3QkFBd0I7QUFDdEYsU0FBUUMsS0FBc0Qsd0JBQXdCO0FBQ3RGLFNBQVFDLEtBQW9DLHdCQUF3QjtBQUVwRSxTQUFRQyxLQUE2QjtBQUVyQyxTQUFRQyxLQUE0QjtBQUtwQztBQUFBO0FBQUE7QUFBQTtBQUFBLFNBQVFDLEtBQTBCO0FBRWxDO0FBQUEsU0FBUUMsS0FBOEI7QUFBQSxNQUNwQyxR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QkFBd0Isb0JBQW9CLEtBQUtBLEVBQThCO0FBQy9FLFdBQUtBLEtBQWlDLHdCQUF3QjtBQUFBLElBQ2hFO0FBQ0EsUUFBSSxLQUFLQyxPQUFtQyx3QkFBd0IseUJBQXlCO0FBQzNGLDhCQUF3QixvQkFBb0IsS0FBS0EsRUFBOEI7QUFDL0UsV0FBS0EsS0FBaUMsd0JBQXdCO0FBQUEsSUFDaEU7QUFBQSxFQUNGO0FBQUE7QUFHRjtBQW5nRmEscUJBb0NJOEIsS0FBNEM7QUFwQ3RELElBQU0sc0JBQU47IiwKICAibmFtZXMiOiBbIl9fZGF0YVVCT1VpZCIsICJfX21vcnBoT2Zmc2V0c1VuaWZvcm1CdWZmZXJVaWQiLCAiX19tb3JwaFdlaWdodHNVbmlmb3JtQnVmZmVyVWlkIiwgIl9fbGFzdFNoYWRlciIsICJfX2xhc3RNYXRlcmlhbFN0YXRlVmVyc2lvbiIsICJfX2xhc3RSZW5kZXJQYXNzVGlja0NvdW50IiwgIl9faW5zdGFuY2VSZW1hcElkZW50aXR5IiwgIl9fcnVuUGxhbiIsICJfX2RhdGFUZXh0dXJlV2lkdGgiLCAiX19pbnN0YW5jZVNpZEJhc2VSb3ciLCAiX19pbnN0YW5jZVJlbWFwQmFzZVJvdyIsICJfX2luc3RhbmNlU2lkQmFzZVZlYzQiLCAiX19pbnN0YW5jZVJlbWFwQmFzZVZlYzQiLCAiX19pbnN0YW5jZVNpZENhcGFjaXR5IiwgIl9faXNQcmV2aW91c01vcnBoV2VpZ2h0c1NldHRsZWQiLCAiX19sYXN0QmxlbmRTaGFwZUNvbXBvbmVudHNVcGRhdGVDb3VudEZvcldlaWdodHMiLCAiX19sYXN0TW9ycGhNYXhJbmRleCIsICJfX2xhc3RNYXRlcmlhbHNVcGRhdGVDb3VudCIsICJfX2xhc3RMaWdodENsdXN0ZXJEYXRhVmVyc2lvbiIsICJfX2xhc3RMaWdodENvbXBvbmVudHNVcGRhdGVDb3VudCIsICJfX2xhc3RHcHVJbnN0YW5jZURhdGFWZXJzaW9uIiwgIl9fbGFzdFRvdGFsU2l6ZU9mR1BVU2hhZGVyRGF0YVN0b3JhZ2VFeGNlcHRNb3JwaERhdGEiLCAiX19sYXN0VHJhbnNmb3JtQ29tcG9uZW50c1VwZGF0ZUNvdW50IiwgIl9fbGFzdFNjZW5lR3JhcGhDb21wb25lbnRzVXBkYXRlQ291bnQiLCAiX19sYXN0Q2FtZXJhQ29tcG9uZW50c1VwZGF0ZUNvdW50IiwgIl9fbGFzdENhbWVyYUNvbnRyb2xsZXJDb21wb25lbnRzVXBkYXRlQ291bnQiLCAiX19sYXN0R3B1SW5zdGFuY2VEYXRhQnVmZmVyQ291bnQiLCAiX19sYXN0TW9ycGhPZmZzZXRzVW5pZm9ybURhdGFTaXplIiwgIl9fbGFzdE1vcnBoV2VpZ2h0c1VuaWZvcm1EYXRhU2l6ZSIsICJfX2NvdW50T2ZCbGVuZFNoYXBlQ29tcG9uZW50cyIsICJfX2VuZ2luZSIsICJfX2N1cnJlbnRDb21wb25lbnRTSURzIiwgIl9faXNEZWJ1Z09wZXJhdGlvblRvRGF0YVRleHR1cmVCdWZmZXJEb25lIiwgIl9fZ2V0Q29tcG9uZW50RGF0YUFjY2Vzc01ldGhvZERlZmluaXRpb25zX2RhdGFUZXh0dXJlIiwgIm1lbWJlckluZm8iLCAiX19nZXRNb3JwaGVkUG9zaXRpb25HZXR0ZXIiLCAiX19nZXRTaGFkZXJQcm9wZXJ0eU9mR2xvYmFsRGF0YVJlcG9zaXRvcnkiLCAiX19nZXRTaGFkZXJQcm9wZXJ0eU9mTWF0ZXJpYWwiLCAidmFySW5kZXhTdHIiLCAiX191cGRhdGVNb3JwaE9mZnNldHNVbmlmb3JtQnVmZmVyc0lubmVyIiwgIl9fdW5pZm9ybU1vcnBoT2Zmc2V0c1R5cGVkQXJyYXkiLCAiX19pbml0TW9ycGhVbmlmb3JtQnVmZmVycyIsICJfX3VuaWZvcm1Nb3JwaFdlaWdodHNUeXBlZEFycmF5IiwgIl9fdXBkYXRlTW9ycGhXZWlnaHRzVW5pZm9ybUJ1ZmZlciIsICJfX2JpbmRNb3JwaFVuaWZvcm1CdWZmZXJzIiwgIl9fdXBkYXRlTW9ycGhPZmZzZXRzVW5pZm9ybUJ1ZmZlcnMiLCAiX19jcmVhdGVBbmRVcGRhdGVEYXRhVGV4dHVyZSIsICJfX3VwbG9hZERhdGFUZXh0dXJlVGV4ZWxzIiwgIl9fY3JlYXRlQW5kVXBkYXRlVUJPIiwgIl9fc2V0dGxlUHJldmlvdXNNb3JwaFdlaWdodHMiLCAiX19saWdodENvbXBvbmVudHMiLCAiX191cGxvYWRNb3JwaFdlaWdodHMiLCAiX19pc1Vib1VzZSIsICJfX3NldEN1cnJlbnRDb21wb25lbnRTSURzRm9yRWFjaERpc3BsYXlJZHgiLCAiX19zZXRDdXJyZW50Q29tcG9uZW50U0lEc0ZvckVhY2hQcmltaXRpdmUiLCAiX191cGxvYWRJbnN0YW5jZVRhYmxlcyIsICJfX3VwbG9hZEluc3RhbmNlU2lkRGF0YVRleHR1cmUiLCAiX191cGxvYWRJbnN0YW5jZVJlZ2lvbiIsICJfX3JlbmRlcldpdGhvdXRCdWZmZXJzIiwgIl9fcmVuZGVyQnVja2V0IiwgIl9fdXBsb2FkQ3VycmVudENvbXBvbmVudFNJRHMiLCAiX191cGxvYWRMaWdodENsdXN0ZXJWaWV3IiwgIl9fdXNlTWF0ZXJpYWxTaWRBdHRyaWJ1dGUiLCAiX19zZXRJbnN0YW5jZVJlbWFwSWRlbnRpdHkiLCAiX19zZXRJbnN0YW5jZVNpZERhdGFUZXh0dXJlSW5kaWNlcyIsICJfX2JpbmRNdWx0aURyYXdWZXJ0ZXhEYXRhRm9yTWF0ZXJpYWwiLCAiX19yZW5kZXJJbm5lciIsICJfX3JlbmRlck11bHRpRHJhd0JhdGNoIiwgIl9fY2hhbmdlZFByb2dyYW0iLCAiX19zaGFkZXJQcm9ncmFtIiwgIl9fbGFzdE1hdGVyaWFsIiwgIl9fbGFzdFVwbG9hZGVkQ29tcG9uZW50U0lEcyIsICJfX2xhc3RDb21wb25lbnRTSURzUHJvZ3JhbSIsICJfX2luc3RhbmNlU2lkVGV4dHVyZUxvY2F0aW9uIiwgIl9faW5zdGFuY2VTaWREYXRhVGV4dHVyZUluZGV4TG9jYXRpb24iLCAiX19pbnN0YW5jZVJlbWFwRGF0YVRleHR1cmVJbmRleExvY2F0aW9uIiwgIl9faW5zdGFuY2VSZW1hcElkZW50aXR5TG9jYXRpb24iLCAiX19pbnN0YW5jZVNpZERhdGFUZXh0dXJlSW5kZXhWYWx1ZSIsICJfX2luc3RhbmNlUmVtYXBEYXRhVGV4dHVyZUluZGV4VmFsdWUiLCAiX19pbnN0YW5jZVJlbWFwSWRlbnRpdHlWYWx1ZSJdCn0K
