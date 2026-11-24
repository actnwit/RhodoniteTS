// src/foundation/materials/core/ShaderGraphResolver.ts
import { ComponentType } from "../../definitions/ComponentType.js";
import { CompositionType } from "../../definitions/CompositionType.js";
import { ProcessApproach } from "../../definitions/ProcessApproach.js";
import { ShaderType } from "../../definitions/ShaderType.js";
import { Scalar } from "../../math/Scalar.js";
import { Vector2 } from "../../math/Vector2.js";
import { Vector3 } from "../../math/Vector3.js";
import { Vector4 } from "../../math/Vector4.js";
import { Logger } from "../../misc/Logger.js";
import { AbsShaderNode } from "../nodes/AbsShaderNode.js";
import { AcosShaderNode } from "../nodes/AcosShaderNode.js";
import { AddShaderNode } from "../nodes/AddShaderNode.js";
import { AlphaTestShaderNode } from "../nodes/AlphaTestShaderNode.js";
import { AndShaderNode } from "../nodes/AndShaderNode.js";
import { Atan2ShaderNode } from "../nodes/Atan2ShaderNode.js";
import { AttributeColorShaderNode } from "../nodes/AttributeColorShaderNode.js";
import { AttributeInstanceIdsShaderNode } from "../nodes/AttributeInstanceIdsShaderNode.js";
import { AttributeJointShaderNode } from "../nodes/AttributeJointShaderNode.js";
import { AttributeNormalShaderNode } from "../nodes/AttributeNormalShaderNode.js";
import { AttributePositionShaderNode } from "../nodes/AttributePositionShaderNode.js";
import { AttributeTangentShaderNode } from "../nodes/AttributeTangentShaderNode.js";
import { AttributeTexcoordShaderNode } from "../nodes/AttributeTexcoordShaderNode.js";
import { AttributeWeightShaderNode } from "../nodes/AttributeWeightShaderNode.js";
import { BranchShaderNode } from "../nodes/BranchShaderNode.js";
import { CalcBitangentShaderNode } from "../nodes/CalcBitangentShaderNode.js";
import { CastToFloatShaderNode } from "../nodes/CastToFloatShaderNode.js";
import { ClampShaderNode } from "../nodes/ClampShaderNode.js";
import { ClassicShaderNode } from "../nodes/ClassicShaderNode.js";
import { ConstantScalarVariableShaderNode } from "../nodes/ConstantScalarVariableShaderNode.js";
import { ConstantVector2VariableShaderNode } from "../nodes/ConstantVector2VariableShaderNode.js";
import { ConstantVector3VariableShaderNode } from "../nodes/ConstantVector3VariableShaderNode.js";
import { ConstantVector4VariableShaderNode } from "../nodes/ConstantVector4VariableShaderNode.js";
import { CosShaderNode } from "../nodes/CosShaderNode.js";
import { DiscardShaderNode } from "../nodes/DiscardShaderNode.js";
import { DotProductShaderNode } from "../nodes/DotProductShaderNode.js";
import { EqualShaderNode } from "../nodes/EqualShaderNode.js";
import { FlatShaderNode } from "../nodes/FlatShaderNode.js";
import { GreaterOrEqualShaderNode } from "../nodes/GreaterOrEqualShaderNode.js";
import { GreaterShaderNode } from "../nodes/GreaterShaderNode.js";
import { GreaterThanShaderNode } from "../nodes/GreaterThanShaderNode.js";
import { LengthShaderNode } from "../nodes/LengthShaderNode.js";
import { LessOrEqualShaderNode } from "../nodes/LessOrEqualShaderNode.js";
import { LessThanShaderNode } from "../nodes/LessThanShaderNode.js";
import { MergeVectorShaderNode } from "../nodes/MergeVectorShaderNode.js";
import { MinShaderNode } from "../nodes/MinShaderNode.js";
import { MultiplyShaderNode } from "../nodes/MultiplyShaderNode.js";
import { NormalizeShaderNode } from "../nodes/NormalizeShaderNode.js";
import { NormalMatrixShaderNode } from "../nodes/NormalMatrixShaderNode.js";
import { NotEqualShaderNode } from "../nodes/NotEqualShaderNode.js";
import { OrShaderNode } from "../nodes/OrShaderNode.js";
import { OutColorShaderNode } from "../nodes/OutColorShaderNode.js";
import { OutPositionShaderNode } from "../nodes/OutPositionShaderNode.js";
import { PbrAnisotropyPropsShaderNode } from "../nodes/PbrAnisotropyPropsShaderNode.js";
import { PbrAnisotropyRotationShaderNode } from "../nodes/PbrAnisotropyRotationShaderNode.js";
import { PbrBaseColorPropsShaderNode } from "../nodes/PbrBaseColorPropsShaderNode.js";
import { PbrClearcoatPropsShaderNode } from "../nodes/PbrClearcoatPropsShaderNode.js";
import { PbrDiffuseTransmissionPropsShaderNode } from "../nodes/PbrDiffuseTransmissionPropsShaderNode.js";
import { PbrEmissivePropsShaderNode } from "../nodes/PbrEmissivePropsShaderNode.js";
import { PbrIridescencePropsShaderNode } from "../nodes/PbrIridescencePropsShaderNode.js";
import { PbrMetallicRoughnessPropsShaderNode } from "../nodes/PbrMetallicRoughnessPropsShaderNode.js";
import { PbrNormalPropsShaderNode } from "../nodes/PbrNormalPropsShaderNode.js";
import { PbrOcclusionPropsShaderNode } from "../nodes/PbrOcclusionPropsShaderNode.js";
import { PbrShaderShaderNode } from "../nodes/PbrShaderShaderNode.js";
import { PbrSheenPropsShaderNode } from "../nodes/PbrSheenPropsShaderNode.js";
import { PbrSpecularPropsShaderNode } from "../nodes/PbrSpecularPropsShaderNode.js";
import { PbrTransmissionPropsShaderNode } from "../nodes/PbrTransmissionPropsShaderNode.js";
import { PbrVolumePropsShaderNode } from "../nodes/PbrVolumePropsShaderNode.js";
import { PremultipliedAlphaShaderNode } from "../nodes/PremultipliedAlphaShaderNode.js";
import { ProcessGeometryShaderNode } from "../nodes/ProcessGeometryShaderNode.js";
import { ProjectionMatrixShaderNode } from "../nodes/ProjectionMatrixShaderNode.js";
import { Random_HashPRNGShaderNode } from "../nodes/Random_HashPRNGShaderNode.js";
import { Random_SinHashShaderNode } from "../nodes/Random_SinHashShaderNode.js";
import { RemapShaderNode } from "../nodes/RemapShaderNode.js";
import { BendXYShaderNode } from "../nodes/raymarching/BendXYShaderNode.js";
import { BendXZShaderNode } from "../nodes/raymarching/BendXZShaderNode.js";
import { BendYXShaderNode } from "../nodes/raymarching/BendYXShaderNode.js";
import { BendYZShaderNode } from "../nodes/raymarching/BendYZShaderNode.js";
import { BendZXShaderNode } from "../nodes/raymarching/BendZXShaderNode.js";
import { BendZYShaderNode } from "../nodes/raymarching/BendZYShaderNode.js";
import { InitialPositionShaderNode } from "../nodes/raymarching/InitialPositionShaderNode.js";
import { OpSmoothIntersectionShaderNode } from "../nodes/raymarching/OpSmoothIntersectionShaderNode.js";
import { OpSmoothSubtractionShaderNode } from "../nodes/raymarching/OpSmoothSubtractionShaderNode.js";
import { OpSmoothUnionShaderNode } from "../nodes/raymarching/OpSmoothUnionShaderNode.js";
import { OpSubtractionShaderNode } from "../nodes/raymarching/OpSubtractionShaderNode.js";
import { OpUnionShaderNode } from "../nodes/raymarching/OpUnionShaderNode.js";
import { OutDistanceShaderNode } from "../nodes/raymarching/OutDistanceShaderNode.js";
import { OutShadingColorShaderNode } from "../nodes/raymarching/OutShadingColorShaderNode.js";
import { OutUnionShaderNode } from "../nodes/raymarching/OutUnionShaderNode.js";
import { RaymarchCameraPositionShaderNode } from "../nodes/raymarching/RaymarchCameraPositionShaderNode.js";
import { RaymarchHitDistanceShaderNode } from "../nodes/raymarching/RaymarchHitDistanceShaderNode.js";
import { RaymarchHitNormalShaderNode } from "../nodes/raymarching/RaymarchHitNormalShaderNode.js";
import { RaymarchHitPositionShaderNode } from "../nodes/raymarching/RaymarchHitPositionShaderNode.js";
import { RaymarchObjectIdShaderNode } from "../nodes/raymarching/RaymarchObjectIdShaderNode.js";
import { RaymarchObjectIdUniformShaderNode } from "../nodes/raymarching/RaymarchObjectIdUniformShaderNode.js";
import { RaymarchRayDirectionShaderNode } from "../nodes/raymarching/RaymarchRayDirectionShaderNode.js";
import { RaymarchTBNShaderNode } from "../nodes/raymarching/RaymarchTBNShaderNode.js";
import { RaymarchViewDirectionShaderNode } from "../nodes/raymarching/RaymarchViewDirectionShaderNode.js";
import { SdApplyTransformShaderNode } from "../nodes/raymarching/SdApplyTransformShaderNode.js";
import { SdApplyWorldMatrixShaderNode } from "../nodes/raymarching/SdApplyWorldMatrixShaderNode.js";
import { SdBarXShaderNode } from "../nodes/raymarching/SdBarXShaderNode.js";
import { SdBarYShaderNode } from "../nodes/raymarching/SdBarYShaderNode.js";
import { SdBarZShaderNode } from "../nodes/raymarching/SdBarZShaderNode.js";
import { SdBoxShaderNode } from "../nodes/raymarching/SdBoxShaderNode.js";
import { SdCapsuleShaderNode } from "../nodes/raymarching/SdCapsuleShaderNode.js";
import { SdRepeatShaderNode } from "../nodes/raymarching/SdRepeatShaderNode.js";
import { SdRepeatXShaderNode } from "../nodes/raymarching/SdRepeatXShaderNode.js";
import { SdRepeatXYShaderNode } from "../nodes/raymarching/SdRepeatXYShaderNode.js";
import { SdRepeatYShaderNode } from "../nodes/raymarching/SdRepeatYShaderNode.js";
import { SdRepeatYZShaderNode } from "../nodes/raymarching/SdRepeatYZShaderNode.js";
import { SdRepeatZShaderNode } from "../nodes/raymarching/SdRepeatZShaderNode.js";
import { SdRepeatZXShaderNode } from "../nodes/raymarching/SdRepeatZXShaderNode.js";
import { SdRoundBoxShaderNode } from "../nodes/raymarching/SdRoundBoxShaderNode.js";
import { SdSphereShaderNode } from "../nodes/raymarching/SdSphereShaderNode.js";
import { SdTorusShaderNode } from "../nodes/raymarching/SdTorusShaderNode.js";
import { SdTubeXShaderNode } from "../nodes/raymarching/SdTubeXShaderNode.js";
import { SdTubeYShaderNode } from "../nodes/raymarching/SdTubeYShaderNode.js";
import { SdTubeZShaderNode } from "../nodes/raymarching/SdTubeZShaderNode.js";
import { TwistXShaderNode } from "../nodes/raymarching/TwistXShaderNode.js";
import { TwistYShaderNode } from "../nodes/raymarching/TwistYShaderNode.js";
import { TwistZShaderNode } from "../nodes/raymarching/TwistZShaderNode.js";
import { SinShaderNode } from "../nodes/SinShaderNode.js";
import { SmoothStepShaderNode } from "../nodes/SmoothStepShaderNode.js";
import { SplitVectorShaderNode } from "../nodes/SplitVectorShaderNode.js";
import { StepShaderNode } from "../nodes/StepShaderNode.js";
import { TanShaderNode } from "../nodes/TanShaderNode.js";
import { Texture2DShaderNode } from "../nodes/Texture2DShaderNode.js";
import { TimeShaderNode } from "../nodes/TimeShaderNode.js";
import { TransformShaderNode } from "../nodes/TransformShaderNode.js";
import { UniformDataShaderNode } from "../nodes/UniformDataShaderNode.js";
import { ViewMatrixShaderNode } from "../nodes/ViewMatrixShaderNode.js";
import { WorldMatrixShaderNode } from "../nodes/WorldMatrixShaderNode.js";
import { AbstractShaderNode } from "./AbstractShaderNode.js";
var ShaderGraphResolver = class _ShaderGraphResolver {
  /**
   * Creates a complete vertex shader code from the given vertex and varying nodes.
   * This method performs topological sorting of nodes, generates function definitions,
   * and constructs the main shader body with proper variable declarations and connections.
   *
   * @param engine - The engine instance
   * @param vertexNodes - Array of shader nodes that contribute to vertex processing
   * @param varyingNodes - Array of shader nodes that pass data from vertex to fragment stage
   * @param commonShaderPart - The CommonShaderPart instance for shader code generation
   * @param isFullVersion - Whether to generate a full version with all prerequisites and boilerplate
   * @returns Complete vertex shader code as a string, or undefined if generation fails
   */
  static createVertexShaderCode(engine, vertexNodes, varyingNodes, commonShaderPart) {
    const shaderNodes = vertexNodes.concat();
    const sortedShaderNodes = this.ws(shaderNodes);
    let vertexShaderPrerequisites = "";
    const nodes = sortedShaderNodes.concat(varyingNodes);
    vertexShaderPrerequisites += commonShaderPart.getVertexPrerequisites(engine, nodes);
    let shaderBody = "";
    shaderBody += _ShaderGraphResolver.xs(
      engine,
      // sortedShaderNodes,
      sortedShaderNodes.concat(varyingNodes.filter((node) => node.getShaderStage() !== "Fragment")),
      ShaderType.VertexShader
    );
    try {
      shaderBody += _ShaderGraphResolver.ys(engine, nodes, true, commonShaderPart);
    } catch (e) {
      Logger.default.error(e);
      return void 0;
    }
    const shader = vertexShaderPrerequisites + shaderBody;
    return shader;
  }
  /**
   * Creates a complete fragment/pixel shader code from the given pixel nodes.
   * This method performs topological sorting, generates function definitions,
   * and constructs the main shader body for fragment processing.
   *
   * @param engine - The engine instance
   * @param pixelNodes - Array of shader nodes that contribute to fragment processing
   * @param commonShaderPart - The CommonShaderPart instance for shader code generation
   * @param isFullVersion - Whether to generate a full version with all prerequisites and boilerplate
   * @returns Complete fragment shader code as a string, or undefined if generation fails
   */
  static createPixelShaderCode(engine, pixelNodes, commonShaderPart, shadingGroups) {
    const shaderNodes = pixelNodes.concat();
    const sortedShaderNodes = this.ws(shaderNodes);
    let pixelShaderPrerequisites = commonShaderPart.getPixelPrerequisites(engine, sortedShaderNodes);
    let shaderBody = "";
    shaderBody += _ShaderGraphResolver.xs(
      engine,
      sortedShaderNodes.filter((node) => node.getShaderStage() !== "Vertex"),
      ShaderType.PixelShader,
      new Set(commonShaderPart.getEmbeddedShaderFunctionNames())
    );
    let shadingSections;
    if (commonShaderPart.hasShadingSection && shadingGroups != null && shadingGroups.size > 0) {
      const functionPrefix = commonShaderPart.getShadingFunctionNamePrefix();
      shadingSections = [];
      const sortedObjectIds = Array.from(shadingGroups.keys()).sort((a, b) => a - b);
      for (const objectId of sortedObjectIds) {
        const shadingNodes = shadingGroups.get(objectId);
        const sortedShadingNodes = this.ws(shadingNodes);
        const { varInputNames, varOutputNames, collectedShaderBody } = this.zs(
          engine,
          sortedShadingNodes,
          false,
          commonShaderPart
        );
        const body = collectedShaderBody + this.As(engine, sortedShadingNodes, varInputNames, varOutputNames, false);
        shadingSections.push({ objectId, functionName: `${functionPrefix}_${objectId}`, body });
      }
    }
    try {
      shaderBody += _ShaderGraphResolver.ys(
        engine,
        sortedShaderNodes,
        false,
        commonShaderPart,
        shadingSections
      );
    } catch (e) {
      Logger.default.error(e);
      return void 0;
    }
    const shader = pixelShaderPrerequisites + shaderBody;
    return shader;
  }
  /**
   * Groups the nodes reachable to each outShadingColor terminal by the component
   * that authored it. Merged raymarching graphs prefix node ids with `comp<N>_`,
   * where N is the component SID and also the recorded object id.
   *
   * Graphs without that prefix (e.g. a single component built directly) are grouped
   * under object id 0.
   */
  static Bs(json, nodeInstances) {
    var _a, _b;
    const groups = /* @__PURE__ */ new Map();
    const incoming = /* @__PURE__ */ new Map();
    for (const connection of json.connections) {
      const list = incoming.get(connection.to.id);
      if (list == null) {
        incoming.set(connection.to.id, [connection.from.id]);
      } else {
        list.push(connection.from.id);
      }
    }
    for (const node of json.nodes) {
      if (node.name !== "OutShadingColor") {
        continue;
      }
      const prefixMatch = /^comp(\d+)_/.exec(node.id);
      const objectId = prefixMatch != null ? Number.parseInt(prefixMatch[1], 10) : 0;
      const group = (_a = groups.get(objectId)) != null ? _a : [];
      const groupUids = new Set(group.map((groupNode) => groupNode.shaderNodeUid));
      const visited = /* @__PURE__ */ new Set();
      const stack = [node.id];
      while (stack.length > 0) {
        const id = stack.pop();
        if (visited.has(id)) {
          continue;
        }
        visited.add(id);
        const instance = nodeInstances[id];
        if (instance != null && !groupUids.has(instance.shaderNodeUid)) {
          group.push(instance);
          groupUids.add(instance.shaderNodeUid);
        }
        for (const fromId of (_b = incoming.get(id)) != null ? _b : []) {
          stack.push(fromId);
        }
      }
      groups.set(objectId, group);
    }
    return groups;
  }
  /**
   * Validates that all shader nodes have their required input connections properly set.
   * This is a validation step to ensure the shader graph is complete before code generation.
   *
   * @param shaderNodes - Array of shader nodes to validate
   * @returns True if all nodes are valid, false if any node has missing required connections
   * @private
   */
  static Ls(shaderNodes) {
    const _shaderNodeUids = [];
    for (let i = 0; i < shaderNodes.length; i++) {
      const shaderNode = shaderNodes[i];
      for (let j = 0; j < shaderNode.inputConnections.length; j++) {
        const inputConnection = shaderNode.inputConnections[j];
        if (inputConnection == null) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Performs topological sorting on shader nodes to determine the correct execution order.
   * Uses Kahn's algorithm (BFS-based) to sort nodes based on their dependencies.
   * This ensures that nodes are processed in the correct order during shader execution.
   *
   * @param shaderNodes - Array of shader nodes to sort
   * @returns Array of shader nodes sorted in topological order
   * @throws Error if the graph contains cycles
   * @private
   */
  static ws(shaderNodes) {
    const sortedNodeArray = [];
    const inputNumArray = [];
    const queue = [];
    for (let i = 0; i < shaderNodes.length; i++) {
      const shaderNode = shaderNodes[i];
      let count = 0;
      for (const inputConnection of shaderNode.inputConnections) {
        if (inputConnection != null) {
          count++;
        }
      }
      inputNumArray[i] = count;
    }
    const outputNodes = [];
    for (let i = 0; i < shaderNodes.length; i++) {
      const shaderNode = shaderNodes[i];
      for (const inputConnection of shaderNode.inputConnections) {
        if (inputConnection == null) {
          continue;
        }
        const inputNode = AbstractShaderNode.getShaderNodeByUid(inputConnection.shaderNodeUid);
        const inputNodeIdx = shaderNodes.indexOf(inputNode);
        if (outputNodes[inputNodeIdx] == null) {
          outputNodes[inputNodeIdx] = [];
        }
        outputNodes[inputNodeIdx].push(shaderNode);
      }
    }
    for (let i = 0; i < shaderNodes.length; i++) {
      if (outputNodes[i] == null) {
        outputNodes[i] = [];
      }
    }
    for (let i = 0; i < shaderNodes.length; i++) {
      if (inputNumArray[i] === 0) {
        queue.push(shaderNodes[i]);
      }
    }
    while (queue.length > 0) {
      const now = queue.shift();
      sortedNodeArray.push(now);
      const nowIdx = shaderNodes.indexOf(now);
      for (const outputNode of outputNodes[nowIdx]) {
        inputNumArray[shaderNodes.indexOf(outputNode)]--;
        if (inputNumArray[shaderNodes.indexOf(outputNode)] === 0) {
          queue.push(outputNode);
        }
      }
    }
    if (sortedNodeArray.length !== shaderNodes.length) {
      Logger.default.error("graph is cyclic");
    }
    return sortedNodeArray;
  }
  /**
   * Generates function definitions for all unique shader nodes.
   * Collects shader function code from each node type and removes duplicates
   * to create the function definition section of the shader.
   *
   * @param engine - The engine instance
   * @param shaderNodes - Array of shader nodes to generate functions for
   * @param shaderType - Type of shader (vertex or fragment) being generated
   * @returns String containing all function definitions
   * @private
   */
  static xs(engine, shaderNodes, shaderType, embeddedShaderFunctionNames) {
    let shaderText = "";
    const existVertexFunctions = [];
    for (let i = 0; i < shaderNodes.length; i++) {
      const materialNode = shaderNodes[i];
      if (existVertexFunctions.indexOf(materialNode.shaderFunctionName) !== -1) {
        continue;
      }
      existVertexFunctions.push(materialNode.shaderFunctionName);
      if (embeddedShaderFunctionNames == null ? void 0 : embeddedShaderFunctionNames.has(materialNode.shaderFunctionName)) {
        continue;
      }
      shaderText += materialNode.getShaderCode(engine, shaderType);
    }
    return shaderText;
  }
  /**
   * Defines varying variables for vertex-to-fragment communication.
   * @private
   */
  static Cs(engine, shaderNodes, isVertexStage) {
    let shaderBody = "";
    const definedVaryings = /* @__PURE__ */ new Set();
    if (engine.engineState.currentProcessApproach !== ProcessApproach.WebGPU) {
      for (let i = 0; i < shaderNodes.length; i++) {
        const shaderNode = shaderNodes[i];
        for (let j = 0; j < shaderNode.inputConnections.length; j++) {
          const inputConnection = shaderNode.inputConnections[j];
          if (inputConnection == null) {
            continue;
          }
          const input = shaderNode.getInputs()[j];
          const inputNode = AbstractShaderNode.getShaderNodeByUid(inputConnection.shaderNodeUid);
          if (inputNode.getShaderStage() === "Vertex" && shaderNode.getShaderStage() === "Fragment") {
            const varyingName = `v_${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid}_${inputConnection.outputNameOfPrev}`;
            if (definedVaryings.has(varyingName)) {
              continue;
            }
            definedVaryings.add(varyingName);
            const type = input.compositionType.getGlslStr(input.componentType);
            const needsFlat = input.componentType.isInteger() || input.componentType.isUnsignedInteger() || input.componentType === ComponentType.Bool;
            const flatModifier = needsFlat ? "flat " : "";
            shaderBody += `${flatModifier}${isVertexStage ? "out" : "in"} ${type} ${varyingName};
`;
          }
        }
      }
    }
    return shaderBody;
  }
  /**
   * Collects input and output variable names for shader nodes.
   * @private
   */
  static zs(engine, shaderNodes, isVertexStage, commonShaderPart) {
    const varInputNames = [];
    const varOutputNames = [];
    let collectedShaderBody = "";
    const existingInputs = /* @__PURE__ */ new Set();
    const existingOutputs = /* @__PURE__ */ new Set();
    const existingOutputsVarName = /* @__PURE__ */ new Map();
    for (let i = 0; i < shaderNodes.length; i++) {
      varInputNames[i] = [];
      varOutputNames[i] = [];
    }
    for (let i = 0; i < shaderNodes.length; i++) {
      this.Ds(i, shaderNodes, varOutputNames, existingOutputs, existingOutputsVarName);
    }
    for (let i = 0; i < shaderNodes.length; i++) {
      collectedShaderBody += this.Es(
        engine,
        i,
        shaderNodes,
        varInputNames,
        varOutputNames,
        existingInputs,
        existingOutputsVarName,
        isVertexStage,
        commonShaderPart
      );
    }
    return { varInputNames, varOutputNames, collectedShaderBody };
  }
  /**
   * Collects input variables for a specific node.
   * @private
   */
  static Es(engine, nodeIndex, shaderNodes, varInputNames, varOutputNames, existingInputs, existingOutputsVarName, isVertexStage, commonShaderPart) {
    const shaderNode = shaderNodes[nodeIndex];
    if (varInputNames[nodeIndex] == null) {
      varInputNames[nodeIndex] = [];
    }
    if (nodeIndex - 1 >= 0 && varOutputNames[nodeIndex - 1] == null) {
      varOutputNames[nodeIndex - 1] = [];
    }
    const inputConnections = shaderNode.inputConnections;
    let shaderBody = "";
    for (let j = 0; j < shaderNode.getInputs().length; j++) {
      const inputConnection = inputConnections[j];
      if (inputConnection == null) {
        const defaultValue = this.Fs(engine, shaderNode, j);
        if (defaultValue) {
          varInputNames[nodeIndex].push(defaultValue);
        }
        continue;
      }
      const { varName, rowStr } = this.Gs(
        engine,
        inputConnection,
        shaderNode,
        isVertexStage,
        existingInputs,
        commonShaderPart
      );
      const outputKey = `${inputConnection.shaderNodeUid}_${inputConnection.outputNameOfPrev}`;
      const existVarName = existingOutputsVarName.get(outputKey);
      const inputNode = AbstractShaderNode._shaderNodes[inputConnection.shaderNodeUid];
      const isFragmentConsumingVertex = !isVertexStage && inputNode.getShaderStage() === "Vertex" && shaderNode.getShaderStage() === "Fragment";
      const usedVarName = isFragmentConsumingVertex ? varName : existVarName || varName;
      if (usedVarName === varName) {
        shaderBody += rowStr;
      }
      varInputNames[nodeIndex].push(usedVarName);
    }
    return shaderBody;
  }
  /**
   * Checks if the defaultValue is a struct type (Record<string, ValueTypes>) rather than a primitive ValueTypes.
   * @private
   */
  static Hs(defaultValue) {
    if (typeof defaultValue !== "object" || defaultValue === null) {
      return false;
    }
    if ("_v" in defaultValue && ArrayBuffer.isView(defaultValue._v)) {
      return false;
    }
    return true;
  }
  /**
   * Gets the struct name from the compositionType's glslStr property.
   * If the glslStr starts with 'struct ', extracts and returns the struct name.
   * @private
   */
  static Is(compositionType) {
    const glslStr = compositionType.getGlslStr(ComponentType.Unknown);
    if (glslStr.startsWith("struct ")) {
      return glslStr.replace("struct ", "");
    }
    return void 0;
  }
  /**
   * Generates a shader initialization string for a struct type default value.
   * @private
   */
  static Js(compositionType, defaultValue, isWebGPU) {
    var _a;
    const structName = (_a = this.Is(compositionType)) != null ? _a : "";
    const memberValues = [];
    for (const [_key, value] of Object.entries(defaultValue)) {
      if (isWebGPU) {
        memberValues.push(value.wgslStrAsFloat);
      } else {
        memberValues.push(value.glslStrAsFloat);
      }
    }
    return `${structName}(${memberValues.join(", ")})`;
  }
  /**
   * Gets default value for an input socket.
   * If the socket has a defaultValue defined, it will be used.
   * Otherwise, a zero value based on the socket's compositionType and componentType will be generated.
   * @private
   */
  static Fs(engine, shaderNode, inputIndex) {
    const inputSocket = shaderNode.getInputs()[inputIndex];
    const isWebGPU = engine.engineState.currentProcessApproach === ProcessApproach.WebGPU;
    const isBool = inputSocket.componentType === ComponentType.Bool;
    const isInt = inputSocket.componentType === ComponentType.Int || inputSocket.componentType === ComponentType.UnsignedInt;
    if (inputSocket.defaultValue != null) {
      if (this.Hs(inputSocket.defaultValue)) {
        return this.Js(inputSocket.compositionType, inputSocket.defaultValue, isWebGPU);
      }
      const primitiveValue = inputSocket.defaultValue;
      if (isBool) {
        return primitiveValue._v[0] > 0.5 ? "true" : "false";
      }
      if (inputSocket.componentType === ComponentType.UnsignedInt) {
        return isWebGPU ? primitiveValue.wgslStrAsUint : primitiveValue.glslStrAsUint;
      }
      if (isInt) {
        return isWebGPU ? primitiveValue.wgslStrAsInt : primitiveValue.glslStrAsInt;
      }
      return isWebGPU ? primitiveValue.wgslStrAsFloat : primitiveValue.glslStrAsFloat;
    }
    return isWebGPU ? inputSocket.compositionType.getWgslInitialValue(inputSocket.componentType) : inputSocket.compositionType.getGlslInitialValue(inputSocket.componentType);
  }
  /**
   * Processes an input connection and returns variable name and shader statement.
   * @private
   */
  static Gs(engine, inputConnection, shaderNode, isVertexStage, existingInputs, commonShaderPart) {
    const inputNode = AbstractShaderNode._shaderNodes[inputConnection.shaderNodeUid];
    const outputSocketOfPrev = inputNode.getOutput(inputConnection.outputNameOfPrev);
    const inputSocketOfThis = shaderNode.getInput(inputConnection.inputNameOfThis);
    const varName = `${outputSocketOfPrev.name}_${inputConnection.shaderNodeUid}_to_${shaderNode.shaderNodeUid}`;
    let rowStr = "";
    const isFragmentConsumingVertex = !isVertexStage && inputNode.getShaderStage() === "Vertex" && shaderNode.getShaderStage() === "Fragment";
    const baseInputKey = `${inputNode.shaderNodeUid}_${inputConnection.outputNameOfPrev}`;
    const inputKey = isFragmentConsumingVertex ? `${baseInputKey}_toFragment_${shaderNode.shaderNodeUid}` : baseInputKey;
    if (!existingInputs.has(inputKey)) {
      rowStr = commonShaderPart.getAssignmentStatement(engine, varName, inputSocketOfThis);
      if (isFragmentConsumingVertex) {
        rowStr = commonShaderPart.getAssignmentVaryingStatementInPixelShader(
          engine,
          varName,
          inputSocketOfThis,
          inputNode,
          inputConnection.outputNameOfPrev
        );
      }
      existingInputs.add(inputKey);
    }
    return { varName, rowStr };
  }
  /**
   * Collects output variables for a specific node.
   * @private
   */
  static Ds(nodeIndex, shaderNodes, varOutputNames, existingOutputs, existingOutputsVarName) {
    const prevShaderNode = shaderNodes[nodeIndex - 1];
    if (!prevShaderNode) return;
    for (let j = 0; j < shaderNodes.length; j++) {
      const targetShaderNode = shaderNodes[j];
      const targetNodeInputConnections = targetShaderNode.inputConnections;
      for (let k = 0; k < targetNodeInputConnections.length; k++) {
        const inputConnection = targetNodeInputConnections[k];
        if (inputConnection == null || prevShaderNode.shaderNodeUid !== inputConnection.shaderNodeUid) {
          continue;
        }
        const outputKey = `${inputConnection.shaderNodeUid}_${inputConnection.outputNameOfPrev}`;
        if (!existingOutputs.has(outputKey)) {
          const inputNode = AbstractShaderNode._shaderNodes[inputConnection.shaderNodeUid];
          const outputSocketOfPrev = inputNode.getOutput(inputConnection.outputNameOfPrev);
          const varName = `${outputSocketOfPrev.name}_${inputConnection.shaderNodeUid}_to_${targetShaderNode.shaderNodeUid}`;
          if (nodeIndex - 1 >= 0) {
            varOutputNames[nodeIndex - 1].push(varName);
          }
          existingOutputsVarName.set(outputKey, varName);
          existingOutputs.add(outputKey);
        }
      }
    }
  }
  /**
   * Generates shader code for the nodes.
   * @private
   */
  static As(engine, shaderNodes, varInputNames, varOutputNames, isVertexStage) {
    let shaderBody = "";
    let dummyVarCounter = 0;
    for (let i = 0; i < shaderNodes.length; i++) {
      const shaderNode = shaderNodes[i];
      if (isVertexStage && shaderNode.getShaderStage() === "Fragment" || !isVertexStage && shaderNode.getShaderStage() === "Vertex") {
        continue;
      }
      if (varInputNames[i] == null) {
        varInputNames[i] = [];
      }
      if (varOutputNames[i] == null) {
        varOutputNames[i] = [];
      }
      const outputs = shaderNode.getOutputs();
      if (outputs.length > 0) {
        const outputNameToVarName = /* @__PURE__ */ new Map();
        const nodeUidPattern = `_${shaderNode.shaderNodeUid}_to_`;
        for (const varName of varOutputNames[i]) {
          const splitIndex = varName.indexOf(nodeUidPattern);
          if (splitIndex !== -1) {
            const outputName = varName.substring(0, splitIndex);
            outputNameToVarName.set(outputName, varName);
          }
        }
        const orderedOutputVarNames = [];
        const isWebGPU = engine.engineState.currentProcessApproach === ProcessApproach.WebGPU;
        for (let j = 0; j < outputs.length; j++) {
          const output = outputs[j];
          const existingVarName = outputNameToVarName.get(output.name);
          if (existingVarName) {
            orderedOutputVarNames.push(existingVarName);
          } else {
            const type = isWebGPU ? output.compositionType.toWGSLType(output.componentType) : output.compositionType.getGlslStr(output.componentType);
            const dummyVarName = `dummy${type.replace(/[<>]/g, "")}_${dummyVarCounter++}`;
            if (isWebGPU) {
              shaderBody += `var ${dummyVarName}: ${type};
`;
            } else {
              shaderBody += `${type} ${dummyVarName};
`;
            }
            orderedOutputVarNames.push(dummyVarName);
          }
        }
        varOutputNames[i] = orderedOutputVarNames;
      }
      const functionName = shaderNode.getShaderFunctionNameDerivative(engine);
      shaderBody += shaderNode.makeCallStatement(engine, i, shaderNode, functionName, varInputNames, varOutputNames);
    }
    return shaderBody;
  }
  /**
   * Handles vertex-to-fragment data passing in vertex stage.
   * @private
   */
  static Ks(engine, shaderNodes, _varInputNames, varOutputNames) {
    let shaderBody = "";
    const assignedVaryings = /* @__PURE__ */ new Set();
    for (let i = 0; i < shaderNodes.length; i++) {
      const shaderNode = shaderNodes[i];
      for (let j = 0; j < shaderNode.inputConnections.length; j++) {
        const inputConnection = shaderNode.inputConnections[j];
        if (inputConnection == null) {
          continue;
        }
        const inputNode = AbstractShaderNode.getShaderNodeByUid(inputConnection.shaderNodeUid);
        if (inputNode.getShaderStage() === "Vertex" && shaderNode.getShaderStage() === "Fragment") {
          const varyingName = `v_${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid}_${inputConnection.outputNameOfPrev}`;
          if (assignedVaryings.has(varyingName)) {
            continue;
          }
          assignedVaryings.add(varyingName);
          const inputNodeIndex = shaderNodes.indexOf(inputNode);
          if (inputNodeIndex >= 0 && varOutputNames[inputNodeIndex]) {
            const outputNamePrefix = `${inputConnection.outputNameOfPrev}_${inputNode.shaderNodeUid}_to_`;
            let sourceVarName;
            for (const varName of varOutputNames[inputNodeIndex]) {
              if (varName.startsWith(outputNamePrefix)) {
                sourceVarName = varName;
                break;
              }
            }
            if (sourceVarName) {
              if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
                shaderBody += `output.${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid}_${inputConnection.outputNameOfPrev} = ${sourceVarName};
`;
              } else {
                shaderBody += `${varyingName} = ${sourceVarName};
`;
              }
            }
          }
        }
      }
    }
    return shaderBody;
  }
  /**
   * Constructs the main shader body with proper variable declarations, connections, and function calls.
   * This is the core method that generates the actual shader execution logic by:
   * - Declaring varying variables for vertex-to-fragment communication
   * - Collecting input/output variable names for each node
   * - Generating function call statements in topological order
   * - Handling vertex-to-fragment data passing
   *
   * @param engine - The engine instance
   * @param shaderNodes - Array of shader nodes sorted in topological order
   * @param isVertexStage - True for vertex shader generation, false for fragment
   * @param commonShaderPart - The CommonShaderPart instance for shader code generation
   * @param isFullVersion - Whether to include full shader boilerplate
   * @returns Complete shader main function body as a string
   * @throws Error if shader construction fails
   * @private
   */
  static ys(engine, shaderNodes, isVertexStage, commonShaderPart, shadingSections) {
    let shaderBody = "";
    shaderBody += this.Cs(engine, shaderNodes, isVertexStage);
    shaderBody += commonShaderPart.getMainBegin(engine, isVertexStage);
    const { varInputNames, varOutputNames, collectedShaderBody } = this.zs(
      engine,
      shaderNodes,
      isVertexStage,
      commonShaderPart
    );
    shaderBody += collectedShaderBody;
    shaderBody += this.As(engine, shaderNodes, varInputNames, varOutputNames, isVertexStage);
    if (isVertexStage) {
      shaderBody += this.Ks(engine, shaderNodes, varInputNames, varOutputNames);
    }
    shaderBody += commonShaderPart.getMainEnd(engine, isVertexStage, shadingSections);
    return shaderBody;
  }
  /**
   * Generates complete vertex and fragment shader code from a JSON shader node graph definition.
   * This is the main entry point for converting a serialized shader graph into executable shader code.
   * The method performs the full pipeline: node construction, dependency resolution, stage assignment,
   * and final code generation.
   *
   * @param engine - The engine instance
   * @param json - JSON representation of the shader node graph containing nodes and connections
   * @param commonShaderPart - StandardShaderPart instance to use for shader code generation
   * @returns Object containing both vertex and fragment shader code, texture names used, or undefined if generation fails
   * @example
   * ```typescript
   * const commonShaderPart = new StandardShaderPart();
   * const shaderCode = ShaderGraphResolver.generateShaderCodeFromJson(engine, graphJson, commonShaderPart);
   * if (shaderCode) {
   *   const { vertexShader, pixelShader, textureNames } = shaderCode;
   *   // Use the generated shaders...
   * }
   * ```
   */
  static generateShaderCodeFromJson(engine, json, commonShaderPart, pixelEndNodeNames = ["outColor", "conditionalDiscard", "outDistance", "outUnion", "outShadingColor"]) {
    const { nodeInstances, textureInfos } = constructNodes(json);
    const constructedNodes = Object.values(nodeInstances);
    const nodes = this.ws(constructedNodes);
    resolveShaderStage(nodes);
    const varyingNodes = filterNodesForVarying(nodes, "outColor");
    const varyingNodesForDiscard = filterNodesForVarying(nodes, "conditionalDiscard");
    const allVaryingNodes = [.../* @__PURE__ */ new Set([...varyingNodes, ...varyingNodesForDiscard])];
    const vertexNodes = filterNodes(nodes, ["outPosition"]);
    const pixelNodes = filterNodes(nodes, pixelEndNodeNames);
    const vertexRet = _ShaderGraphResolver.createVertexShaderCode(
      engine,
      vertexNodes,
      allVaryingNodes,
      commonShaderPart
    );
    const shadingGroups = this.Bs(json, nodeInstances);
    const pixelRet = _ShaderGraphResolver.createPixelShaderCode(engine, pixelNodes, commonShaderPart, shadingGroups);
    if (vertexRet == null || pixelRet == null) {
      return;
    }
    return { vertexShader: vertexRet, pixelShader: pixelRet, textureInfos };
  }
};
function filterNodesInner(nodes, endNodeName) {
  const endNodes = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.shaderFunctionName.toLowerCase().includes(endNodeName.toLowerCase())) {
      endNodes.push(node);
    }
  }
  if (endNodes.length === 0) {
    return [];
  }
  const filteredNodes = [...endNodes];
  const visitedNodeUids = new Set(endNodes.map((node) => node.shaderNodeUid));
  function traverseNodes(node) {
    for (let i = 0; i < node.inputConnections.length; i++) {
      const inputConnection = node.inputConnections[i];
      if (inputConnection != null) {
        const inputNode = AbstractShaderNode.getShaderNodeByUid(inputConnection.shaderNodeUid);
        if (inputNode != null && !visitedNodeUids.has(inputNode.shaderNodeUid)) {
          visitedNodeUids.add(inputNode.shaderNodeUid);
          filteredNodes.push(inputNode);
          traverseNodes(inputNode);
        }
      }
    }
  }
  for (const endNode of endNodes) {
    traverseNodes(endNode);
  }
  return filteredNodes;
}
function filterNodes(nodes, endNodesName) {
  let finalFilterNodes = [];
  for (let i = 0; i < endNodesName.length; i++) {
    const endNodeName = endNodesName[i];
    const filteredNodes = filterNodesInner(nodes, endNodeName);
    finalFilterNodes = finalFilterNodes.concat(filteredNodes);
  }
  finalFilterNodes = [...new Set(finalFilterNodes)];
  return finalFilterNodes;
}
function resolveShaderStage(shaderNodes) {
  for (let i = 0; i < shaderNodes.length; i++) {
    const shaderNode = shaderNodes[i];
    for (const inputConnection of shaderNode.inputConnections) {
      if (inputConnection == null) {
        continue;
      }
      const inputNode = AbstractShaderNode.getShaderNodeByUid(inputConnection.shaderNodeUid);
      if (inputNode.getShaderStage() === "Vertex" && shaderNode.getShaderStage() === "Neutral") {
        shaderNode.setShaderStage("Vertex");
      } else if (inputNode.getShaderStage() === "Fragment") {
        shaderNode.setShaderStage("Fragment");
      }
    }
  }
}
function filterNodesForVarying(nodes, endNodeName) {
  let endNode;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.shaderFunctionName.toLowerCase().includes(endNodeName.toLowerCase())) {
      endNode = node;
      break;
    }
  }
  if (endNode == null) {
    return [];
  }
  let varyingNodes = [];
  function traverseNodesAll(node) {
    for (let i = 0; i < node.inputConnections.length; i++) {
      const inputConnection = node.inputConnections[i];
      if (inputConnection == null) {
        continue;
      }
      const inputNode = AbstractShaderNode.getShaderNodeByUid(inputConnection.shaderNodeUid);
      varyingNodes.push(inputNode);
      traverseNodesAll(inputNode);
    }
  }
  function traverseNodes(node) {
    for (let i = 0; i < node.inputConnections.length; i++) {
      const inputConnection = node.inputConnections[i];
      if (inputConnection == null) {
        continue;
      }
      const inputNode = AbstractShaderNode.getShaderNodeByUid(inputConnection.shaderNodeUid);
      if (inputNode != null && inputNode.getShaderStage() === "Vertex" && node.getShaderStage() === "Fragment") {
        varyingNodes.push(inputNode);
        if (node.getShaderStage() === "Fragment") {
          varyingNodes.unshift(node);
        }
        traverseNodesAll(inputNode);
      } else {
        traverseNodes(inputNode);
      }
    }
  }
  traverseNodes(endNode);
  varyingNodes = [...new Set(varyingNodes)];
  return varyingNodes.reverse();
}
function applyDistanceCorrectionUniformNames(nodeInstance, node) {
  var _a, _b;
  const uniformNames = (_b = (_a = node.controls) == null ? void 0 : _a.distanceCorrectionMatrices) == null ? void 0 : _b.value;
  if (Array.isArray(uniformNames)) {
    const names = uniformNames.filter((name) => typeof name === "string" && name.length > 0);
    if (names.length > 0) {
      nodeInstance.setDistanceCorrectionUniformNames(names);
    }
  }
}
function constructNodes(json) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r;
  const nodeInstances = {};
  const nodes = {};
  const textureInfos = [];
  for (const node of json.nodes) {
    nodes[node.id] = node;
    switch (node.name) {
      case "ConstantScalarBool": {
        const nodeInstance = new ConstantScalarVariableShaderNode(ComponentType.Bool);
        nodeInstance.setDefaultInputValue(Scalar.fromCopyNumber(node.controls.in1.value ? 1 : 0));
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "ConstantScalarFloat": {
        const nodeInstance = new ConstantScalarVariableShaderNode(ComponentType.Float);
        nodeInstance.setDefaultInputValue(Scalar.fromCopyNumber(node.controls.in1.value));
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "ConstantScalarUint": {
        const nodeInstance = new ConstantScalarVariableShaderNode(ComponentType.UnsignedInt);
        nodeInstance.setDefaultInputValue(Scalar.fromCopyNumber(node.controls.in1.value));
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "ConstantVector2Float": {
        const nodeInstance = new ConstantVector2VariableShaderNode(ComponentType.Float);
        nodeInstance.setDefaultInputValue(Vector2.fromCopy2(node.controls.in1.value, node.controls.in2.value));
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "ConstantVector3Float": {
        const nodeInstance = new ConstantVector3VariableShaderNode(ComponentType.Float);
        nodeInstance.setDefaultInputValue(
          Vector3.fromCopy3(node.controls.in1.value, node.controls.in2.value, node.controls.in3.value)
        );
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "ConstantVector4Float": {
        const nodeInstance = new ConstantVector4VariableShaderNode(ComponentType.Float);
        nodeInstance.setDefaultInputValue(
          Vector4.fromCopy4(
            node.controls.in1.value,
            node.controls.in2.value,
            node.controls.in3.value,
            node.controls.in4.value
          )
        );
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "UniformScalarFloat": {
        const nodeInstance = new UniformDataShaderNode(CompositionType.Scalar, ComponentType.Float);
        nodeInstance.setDefaultInputValue("value", Scalar.fromCopyNumber(node.controls.initialValue.value));
        nodeInstance.setUniformDataName(node.controls.name.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "UniformVector2Float": {
        const nodeInstance = new UniformDataShaderNode(CompositionType.Vec2, ComponentType.Float);
        nodeInstance.setDefaultInputValue(
          "value",
          Vector2.fromCopy2(node.controls.initialX.value, node.controls.initialY.value)
        );
        nodeInstance.setUniformDataName(node.controls.name.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "UniformVector3Float": {
        const nodeInstance = new UniformDataShaderNode(CompositionType.Vec3, ComponentType.Float);
        nodeInstance.setDefaultInputValue(
          "value",
          Vector3.fromCopy3(node.controls.initialX.value, node.controls.initialY.value, node.controls.initialZ.value)
        );
        nodeInstance.setUniformDataName(node.controls.name.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "UniformVector4Float": {
        const nodeInstance = new UniformDataShaderNode(CompositionType.Vec4, ComponentType.Float);
        nodeInstance.setDefaultInputValue(
          "value",
          Vector4.fromCopyArray4([
            node.controls.initialX.value,
            node.controls.initialY.value,
            node.controls.initialZ.value,
            node.controls.initialW.value
          ])
        );
        nodeInstance.setUniformDataName(node.controls.name.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Texture2D": {
        const nodeInstance = new Texture2DShaderNode();
        const textureName = node.controls.name.value;
        const shaderStage = node.controls.shaderStage.value;
        const defaultTexture = (_b = (_a = node.controls.defaultTexture) == null ? void 0 : _a.value) != null ? _b : "dummyWhiteTexture";
        nodeInstance.setTextureName(textureName);
        nodeInstance.setShaderStage(shaderStage);
        nodeInstance.setSrgbFlag((_d = (_c = node.controls.sRGB) == null ? void 0 : _c.value) != null ? _d : true);
        textureInfos.push({ name: textureName, stage: shaderStage, defaultTexture });
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Time": {
        const nodeInstance = new TimeShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Add": {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance;
        if (socketName.startsWith("Scalar")) {
          nodeInstance = new AddShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName.startsWith("Vector2")) {
          nodeInstance = new AddShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith("Vector3")) {
          nodeInstance = new AddShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith("Vector4")) {
          nodeInstance = new AddShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Add node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Min": {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance;
        if (socketName.startsWith("Scalar")) {
          nodeInstance = new MinShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName.startsWith("Vector2")) {
          nodeInstance = new MinShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith("Vector3")) {
          nodeInstance = new MinShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith("Vector4")) {
          nodeInstance = new MinShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Min node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Abs": {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance;
        if (socketName.startsWith("Scalar")) {
          nodeInstance = new AbsShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName.startsWith("Vector2")) {
          nodeInstance = new AbsShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith("Vector3")) {
          nodeInstance = new AbsShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith("Vector4")) {
          nodeInstance = new AbsShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Abs node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Acos": {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance;
        if (socketName.startsWith("Scalar")) {
          nodeInstance = new AcosShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName.startsWith("Vector2")) {
          nodeInstance = new AcosShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith("Vector3")) {
          nodeInstance = new AcosShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith("Vector4")) {
          nodeInstance = new AcosShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Acos node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Atan2": {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance;
        if (socketName.startsWith("Scalar")) {
          nodeInstance = new Atan2ShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName.startsWith("Vector2")) {
          nodeInstance = new Atan2ShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith("Vector3")) {
          nodeInstance = new Atan2ShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith("Vector4")) {
          nodeInstance = new Atan2ShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Atan2 node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Sin": {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance;
        if (socketName.startsWith("Scalar")) {
          nodeInstance = new SinShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName.startsWith("Vector2")) {
          nodeInstance = new SinShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith("Vector3")) {
          nodeInstance = new SinShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith("Vector4")) {
          nodeInstance = new SinShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Sin node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Cos": {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance;
        if (socketName.startsWith("Scalar")) {
          nodeInstance = new CosShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName.startsWith("Vector2")) {
          nodeInstance = new CosShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith("Vector3")) {
          nodeInstance = new CosShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith("Vector4")) {
          nodeInstance = new CosShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Cos node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Tan": {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance;
        if (socketName.startsWith("Scalar")) {
          nodeInstance = new TanShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName.startsWith("Vector2")) {
          nodeInstance = new TanShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith("Vector3")) {
          nodeInstance = new TanShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith("Vector4")) {
          nodeInstance = new TanShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Tan node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Step": {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance;
        if (socketName.startsWith("Scalar")) {
          nodeInstance = new StepShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName.startsWith("Vector2")) {
          nodeInstance = new StepShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith("Vector3")) {
          nodeInstance = new StepShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith("Vector4")) {
          nodeInstance = new StepShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Add node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "SmoothStep": {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance;
        if (socketName.startsWith("Scalar")) {
          nodeInstance = new SmoothStepShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName.startsWith("Vector2")) {
          nodeInstance = new SmoothStepShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith("Vector3")) {
          nodeInstance = new SmoothStepShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith("Vector4")) {
          nodeInstance = new SmoothStepShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Add node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Clamp": {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance;
        if (socketName.startsWith("Scalar")) {
          nodeInstance = new ClampShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName.startsWith("Vector2")) {
          nodeInstance = new ClampShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith("Vector3")) {
          nodeInstance = new ClampShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith("Vector4")) {
          nodeInstance = new ClampShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Clamp node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Remap": {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance;
        if (socketName.startsWith("Scalar")) {
          nodeInstance = new RemapShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName.startsWith("Vector2")) {
          nodeInstance = new RemapShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith("Vector3")) {
          nodeInstance = new RemapShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith("Vector4")) {
          nodeInstance = new RemapShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Remap node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Normalize": {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance;
        if (socketName.startsWith("Vector2")) {
          nodeInstance = new NormalizeShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith("Vector3")) {
          nodeInstance = new NormalizeShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith("Vector4")) {
          nodeInstance = new NormalizeShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Normalize node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Dot": {
        const socketName = node.inputs.in1.socket.name;
        let nodeInstance;
        if (socketName.startsWith("Vector2")) {
          nodeInstance = new DotProductShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith("Vector3")) {
          nodeInstance = new DotProductShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith("Vector4")) {
          nodeInstance = new DotProductShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Dot node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Length": {
        const socketName = node.inputs.in1.socket.name;
        let componentType = ComponentType.Float;
        if (socketName.includes("<int>")) {
          componentType = ComponentType.Int;
        } else if (socketName.includes("<uint>")) {
          componentType = ComponentType.UnsignedInt;
        }
        let nodeInstance;
        if (socketName.startsWith("Vector2")) {
          nodeInstance = new LengthShaderNode(CompositionType.Vec2, componentType);
        } else if (socketName.startsWith("Vector3")) {
          nodeInstance = new LengthShaderNode(CompositionType.Vec3, componentType);
        } else if (socketName.startsWith("Vector4")) {
          nodeInstance = new LengthShaderNode(CompositionType.Vec4, componentType);
        } else {
          Logger.default.error(`Length node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Multiply": {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance;
        if (socketName.startsWith("Scalar")) {
          nodeInstance = new MultiplyShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName.startsWith("Vector2")) {
          nodeInstance = new MultiplyShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith("Vector3")) {
          nodeInstance = new MultiplyShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith("Vector4")) {
          nodeInstance = new MultiplyShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else if (socketName.startsWith("Matrix2")) {
          nodeInstance = new MultiplyShaderNode(CompositionType.Mat2, ComponentType.Float);
        } else if (socketName.startsWith("Matrix3")) {
          nodeInstance = new MultiplyShaderNode(CompositionType.Mat3, ComponentType.Float);
        } else if (socketName.startsWith("Matrix4")) {
          nodeInstance = new MultiplyShaderNode(CompositionType.Mat4, ComponentType.Float);
        } else {
          Logger.default.error(`Multiply node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Transform": {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance;
        if (socketName.startsWith("Vector2")) {
          nodeInstance = new TransformShaderNode(
            CompositionType.Mat2,
            ComponentType.Float,
            CompositionType.Vec2,
            ComponentType.Float
          );
        } else if (socketName.startsWith("Vector3")) {
          nodeInstance = new TransformShaderNode(
            CompositionType.Mat3,
            ComponentType.Float,
            CompositionType.Vec3,
            ComponentType.Float
          );
        } else if (socketName.startsWith("Vector4")) {
          nodeInstance = new TransformShaderNode(
            CompositionType.Mat4,
            ComponentType.Float,
            CompositionType.Vec4,
            ComponentType.Float
          );
        } else {
          Logger.default.error(`Transform node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "SplitVector": {
        let componentType = ComponentType.Float;
        const inputSocketName = ((_f = (_e = node.inputs.inXYZW) == null ? void 0 : _e.socket) == null ? void 0 : _f.name) || ((_h = (_g = node.inputs.inXYZ) == null ? void 0 : _g.socket) == null ? void 0 : _h.name) || ((_j = (_i = node.inputs.inXY) == null ? void 0 : _i.socket) == null ? void 0 : _j.name) || "";
        if (inputSocketName.includes("<int>")) {
          componentType = ComponentType.Int;
        } else if (inputSocketName.includes("<uint>")) {
          componentType = ComponentType.UnsignedInt;
        }
        const nodeInstance = new SplitVectorShaderNode(componentType);
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "MergeVector": {
        let componentType = ComponentType.Float;
        const outputSocketName = ((_l = (_k = node.outputs.outXYZW) == null ? void 0 : _k.socket) == null ? void 0 : _l.name) || "";
        if (outputSocketName.includes("<int>")) {
          componentType = ComponentType.Int;
        } else if (outputSocketName.includes("<uint>")) {
          componentType = ComponentType.UnsignedInt;
        }
        const nodeInstance = new MergeVectorShaderNode(componentType);
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "CastToFloat": {
        const inputSocketName = ((_n = (_m = node.inputs.in1) == null ? void 0 : _m.socket) == null ? void 0 : _n.name) || "";
        const outputSocketName = ((_p = (_o = node.outputs.out1) == null ? void 0 : _o.socket) == null ? void 0 : _p.name) || "";
        let inputComponentType = ComponentType.Int;
        if (inputSocketName.includes("<bool>")) {
          inputComponentType = ComponentType.Bool;
        } else if (inputSocketName.includes("<int>")) {
          inputComponentType = ComponentType.Int;
        } else if (inputSocketName.includes("<uint>")) {
          inputComponentType = ComponentType.UnsignedInt;
        }
        let nodeInstance;
        if (outputSocketName.includes("Vector4")) {
          nodeInstance = new CastToFloatShaderNode(CompositionType.Vec4, inputComponentType);
        } else if (outputSocketName.includes("Vector3")) {
          nodeInstance = new CastToFloatShaderNode(CompositionType.Vec3, inputComponentType);
        } else if (outputSocketName.includes("Vector2")) {
          nodeInstance = new CastToFloatShaderNode(CompositionType.Vec2, inputComponentType);
        } else {
          nodeInstance = new CastToFloatShaderNode(CompositionType.Scalar, inputComponentType);
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "ProcessGeometry": {
        const nodeInstance = new ProcessGeometryShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "AttributeColor": {
        const nodeInstance = new AttributeColorShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "AttributeNormal": {
        const nodeInstance = new AttributeNormalShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "AttributePosition": {
        const nodeInstance = new AttributePositionShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "AttributeTangent": {
        const nodeInstance = new AttributeTangentShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "AttributeTexcoord": {
        const nodeInstance = new AttributeTexcoordShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "AttributeJoint": {
        const nodeInstance = new AttributeJointShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "AttributeWeight": {
        const nodeInstance = new AttributeWeightShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "AttributeInstanceIds": {
        const nodeInstance = new AttributeInstanceIdsShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "WorldMatrix": {
        const nodeInstance = new WorldMatrixShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "ViewMatrix": {
        const nodeInstance = new ViewMatrixShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "ProjectionMatrix": {
        const nodeInstance = new ProjectionMatrixShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "NormalMatrix": {
        const nodeInstance = new NormalMatrixShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      // case 'If': {
      //   const nodeInstance = new IfStatementShaderNode();
      //   nodeInstances[node.id] = nodeInstance;
      //   break;
      // }
      // case 'BlockBegin': {
      //   const nodeInstance = new BlockBeginShaderNode();
      //   for (const outputName in node.outputs) {
      //     const compositionType = getCompositionType(outputName);
      //     nodeInstance.addInputAndOutput(compositionType, ComponentType.Float);
      //   }
      //   nodeInstances[node.id] = nodeInstance;
      //   break;
      // }
      // case 'BlockEnd': {
      //   const nodeInstance = new BlockEndShaderNode();
      //   for (const outputName in node.outputs) {
      //     const compositionType = getCompositionType(outputName);
      //     nodeInstance.addInputAndOutput(compositionType, ComponentType.Float);
      //   }
      //   nodeInstances[node.id] = nodeInstance;
      //   break;
      // }
      case "Greater": {
        const nodeInstance = new GreaterShaderNode(CompositionType.Scalar, ComponentType.Float);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "LessThan": {
        const socketName = node.inputs.in1.socket.name;
        let nodeInstance;
        if (socketName.includes("<float>")) {
          nodeInstance = new LessThanShaderNode(ComponentType.Float);
        } else if (socketName.includes("<int>")) {
          nodeInstance = new LessThanShaderNode(ComponentType.Int);
        } else if (socketName.includes("<uint>")) {
          nodeInstance = new LessThanShaderNode(ComponentType.UnsignedInt);
        } else {
          Logger.default.error(`LessThan node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "LessOrEqual": {
        const socketName = node.inputs.in1.socket.name;
        let nodeInstance;
        if (socketName.includes("<float>")) {
          nodeInstance = new LessOrEqualShaderNode(ComponentType.Float);
        } else if (socketName.includes("<int>")) {
          nodeInstance = new LessOrEqualShaderNode(ComponentType.Int);
        } else if (socketName.includes("<uint>")) {
          nodeInstance = new LessOrEqualShaderNode(ComponentType.UnsignedInt);
        } else {
          Logger.default.error(`LessOrEqual node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "GreaterThan": {
        const socketName = node.inputs.in1.socket.name;
        let nodeInstance;
        if (socketName.includes("<float>")) {
          nodeInstance = new GreaterThanShaderNode(ComponentType.Float);
        } else if (socketName.includes("<int>")) {
          nodeInstance = new GreaterThanShaderNode(ComponentType.Int);
        } else if (socketName.includes("<uint>")) {
          nodeInstance = new GreaterThanShaderNode(ComponentType.UnsignedInt);
        } else {
          Logger.default.error(`GreaterThan node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "GreaterOrEqual": {
        const socketName = node.inputs.in1.socket.name;
        let nodeInstance;
        if (socketName.includes("<float>")) {
          nodeInstance = new GreaterOrEqualShaderNode(ComponentType.Float);
        } else if (socketName.includes("<int>")) {
          nodeInstance = new GreaterOrEqualShaderNode(ComponentType.Int);
        } else if (socketName.includes("<uint>")) {
          nodeInstance = new GreaterOrEqualShaderNode(ComponentType.UnsignedInt);
        } else {
          Logger.default.error(`GreaterOrEqual node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Equal": {
        const socketName = node.inputs.in1.socket.name;
        let nodeInstance;
        if (socketName.includes("<float>")) {
          nodeInstance = new EqualShaderNode(ComponentType.Float);
        } else if (socketName.includes("<int>")) {
          nodeInstance = new EqualShaderNode(ComponentType.Int);
        } else if (socketName.includes("<uint>")) {
          nodeInstance = new EqualShaderNode(ComponentType.UnsignedInt);
        } else {
          Logger.default.error(`Equal node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "NotEqual": {
        const socketName = node.inputs.in1.socket.name;
        let nodeInstance;
        if (socketName.includes("<float>")) {
          nodeInstance = new NotEqualShaderNode(ComponentType.Float);
        } else if (socketName.includes("<int>")) {
          nodeInstance = new NotEqualShaderNode(ComponentType.Int);
        } else if (socketName.includes("<uint>")) {
          nodeInstance = new NotEqualShaderNode(ComponentType.UnsignedInt);
        } else {
          Logger.default.error(`NotEqual node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "And": {
        const nodeInstance = new AndShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Or": {
        const nodeInstance = new OrShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Branch": {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance;
        if (socketName.startsWith("Scalar")) {
          if (socketName.includes("<int>")) {
            nodeInstance = new BranchShaderNode(CompositionType.Scalar, ComponentType.Int);
          } else {
            nodeInstance = new BranchShaderNode(CompositionType.Scalar, ComponentType.Float);
          }
        } else if (socketName.startsWith("Vector2")) {
          nodeInstance = new BranchShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith("Vector3")) {
          nodeInstance = new BranchShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith("Vector4")) {
          nodeInstance = new BranchShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Branch node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "OutPosition": {
        const nodeInstance = new OutPositionShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "OutColor": {
        const nodeInstance = new OutColorShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Discard": {
        const nodeInstance = new DiscardShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "FlatShader": {
        const nodeInstance = new FlatShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "ClassicShader": {
        const nodeInstance = new ClassicShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        if (((_q = node.controls.shadingModel) == null ? void 0 : _q.value) != null) {
          const shadingModelMap = {
            Lambert: 1,
            "Blinn-Phong": 2,
            Phong: 3
          };
          const shadingModelValue = (_r = shadingModelMap[node.controls.shadingModel.value]) != null ? _r : 2;
          nodeInstance.setShadingModel(shadingModelValue);
        }
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "PbrShader": {
        const nodeInstance = new PbrShaderShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "PbrBaseColorProps": {
        const nodeInstance = new PbrBaseColorPropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "PbrNormalProps": {
        const nodeInstance = new PbrNormalPropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "PbrMetallicRoughnessProps": {
        const nodeInstance = new PbrMetallicRoughnessPropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "PbrOcclusionProps": {
        const nodeInstance = new PbrOcclusionPropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "PbrEmissiveProps": {
        const nodeInstance = new PbrEmissivePropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "PbrSpecularProps": {
        const nodeInstance = new PbrSpecularPropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "PbrClearcoatProps": {
        const nodeInstance = new PbrClearcoatPropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "PbrSheenProps": {
        const nodeInstance = new PbrSheenPropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "PbrAnisotropyProps": {
        const nodeInstance = new PbrAnisotropyPropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "PbrAnisotropyRotation": {
        const nodeInstance = new PbrAnisotropyRotationShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "PbrIridescenceProps": {
        const nodeInstance = new PbrIridescencePropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "PbrTransmissionProps": {
        const nodeInstance = new PbrTransmissionPropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "PbrDiffuseTransmissionProps": {
        const nodeInstance = new PbrDiffuseTransmissionPropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "PbrVolumeProps": {
        const nodeInstance = new PbrVolumePropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "PremultipliedAlpha": {
        const nodeInstance = new PremultipliedAlphaShaderNode(ComponentType.Float);
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "AlphaTest": {
        const nodeInstance = new AlphaTestShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "CalcBitangent": {
        const nodeInstance = new CalcBitangentShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Random_HashPRNG": {
        const nodeInstance = new Random_HashPRNGShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "Random_SinHash": {
        const nodeInstance = new Random_SinHashShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "OutDistance": {
        const nodeInstance = new OutDistanceShaderNode();
        applyDistanceCorrectionUniformNames(nodeInstance, node);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "OutUnion": {
        const nodeInstance = new OutUnionShaderNode();
        applyDistanceCorrectionUniformNames(nodeInstance, node);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "OutShadingColor": {
        const nodeInstance = new OutShadingColorShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "RaymarchHitPosition": {
        const nodeInstance = new RaymarchHitPositionShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "RaymarchHitNormal": {
        const nodeInstance = new RaymarchHitNormalShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "RaymarchObjectId": {
        const nodeInstance = new RaymarchObjectIdShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "RaymarchObjectIdUniform": {
        const nodeInstance = new RaymarchObjectIdUniformShaderNode();
        nodeInstance.setUniformDataName(node.controls.name.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "RaymarchViewDirection": {
        const nodeInstance = new RaymarchViewDirectionShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "RaymarchCameraPosition": {
        const nodeInstance = new RaymarchCameraPositionShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "RaymarchHitDistance": {
        const nodeInstance = new RaymarchHitDistanceShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "RaymarchRayDirection": {
        const nodeInstance = new RaymarchRayDirectionShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "RaymarchTBN": {
        const nodeInstance = new RaymarchTBNShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "SdSphere": {
        const nodeInstance = new SdSphereShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "SdBarX": {
        const nodeInstance = new SdBarXShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "SdBarY": {
        const nodeInstance = new SdBarYShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "SdBarZ": {
        const nodeInstance = new SdBarZShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "SdTubeX": {
        const nodeInstance = new SdTubeXShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "SdTubeY": {
        const nodeInstance = new SdTubeYShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "SdTubeZ": {
        const nodeInstance = new SdTubeZShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "SdBox": {
        const nodeInstance = new SdBoxShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "SdTorus": {
        const nodeInstance = new SdTorusShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "SdCapsule": {
        const nodeInstance = new SdCapsuleShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "SdRoundBox": {
        const nodeInstance = new SdRoundBoxShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "SdRepeat": {
        const nodeInstance = new SdRepeatShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "SdRepeatX": {
        const nodeInstance = new SdRepeatXShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "SdRepeatXY": {
        const nodeInstance = new SdRepeatXYShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "SdRepeatY": {
        const nodeInstance = new SdRepeatYShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "SdRepeatYZ": {
        const nodeInstance = new SdRepeatYZShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "SdRepeatZ": {
        const nodeInstance = new SdRepeatZShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "SdRepeatZX": {
        const nodeInstance = new SdRepeatZXShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "OpUnion": {
        const nodeInstance = new OpUnionShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "OpSubtraction": {
        const nodeInstance = new OpSubtractionShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "OpSmoothUnion": {
        const nodeInstance = new OpSmoothUnionShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "OpSmoothSubtraction": {
        const nodeInstance = new OpSmoothSubtractionShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "OpSmoothIntersection": {
        const nodeInstance = new OpSmoothIntersectionShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "TwistX": {
        const nodeInstance = new TwistXShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "TwistY": {
        const nodeInstance = new TwistYShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "TwistZ": {
        const nodeInstance = new TwistZShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "BendXY": {
        const nodeInstance = new BendXYShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "BendXZ": {
        const nodeInstance = new BendXZShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "BendYZ": {
        const nodeInstance = new BendYZShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "BendYX": {
        const nodeInstance = new BendYXShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "BendZX": {
        const nodeInstance = new BendZXShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "BendZY": {
        const nodeInstance = new BendZYShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "SdApplyTransform": {
        const nodeInstance = new SdApplyTransformShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "SdApplyWorldMatrix": {
        const nodeInstance = new SdApplyWorldMatrixShaderNode();
        nodeInstance.setUniformDataName(node.controls.name.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case "InitialPosition": {
        const nodeInstance = new InitialPositionShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
    }
  }
  for (let i = 0; i < json.connections.length; i++) {
    const connection = json.connections[i];
    const inputNodeInstance = nodeInstances[connection.from.id];
    const outputNodeInstance = nodeInstances[connection.to.id];
    if (inputNodeInstance == null || outputNodeInstance == null) {
      Logger.default.error("inputNodeInstance or outputNodeInstance is null");
      continue;
    }
    let outputOfInputNode = inputNodeInstance.getOutput(connection.from.portName);
    let inputOfOutputNode = outputNodeInstance.getInput(connection.to.portName);
    if (outputOfInputNode == null) {
      let idx2 = 0;
      for (const key in nodes[connection.from.id].outputs) {
        if (key === connection.from.portName) {
          break;
        }
        idx2++;
      }
      outputOfInputNode = inputNodeInstance.getOutputs()[idx2];
    }
    if (inputOfOutputNode == null) {
      let idx = 0;
      for (const key in nodes[connection.to.id].inputs) {
        if (key === connection.to.portName) {
          break;
        }
        idx++;
      }
      inputOfOutputNode = outputNodeInstance.getInputs()[idx];
    }
    outputNodeInstance.addInputConnection(inputNodeInstance, outputOfInputNode, inputOfOutputNode);
  }
  applyTransformDistanceScales(json, nodeInstances);
  return { nodeInstances, textureInfos };
}
var RAYMARCH_SPATIAL_INPUT_PORTS = /* @__PURE__ */ new Set(["position", "lhs", "rhs", "base", "subtractor", "value", "in1"]);
function applyTransformDistanceScales(json, nodeInstances) {
  const incoming = /* @__PURE__ */ new Map();
  for (const connection of json.connections) {
    let list = incoming.get(connection.to.id);
    if (list == null) {
      list = [];
      incoming.set(connection.to.id, list);
    }
    list.push({ fromId: connection.from.id, portName: connection.to.portName });
  }
  const pushSpatialInputs = (nodeId, stack) => {
    const connections = incoming.get(nodeId);
    if (connections == null) {
      return;
    }
    for (const connection of connections) {
      if (RAYMARCH_SPATIAL_INPUT_PORTS.has(connection.portName)) {
        stack.push(connection.fromId);
      }
    }
  };
  for (const node of json.nodes) {
    if (node.name !== "OutUnion" && node.name !== "OutDistance") {
      continue;
    }
    const terminal = nodeInstances[node.id];
    if ((terminal == null ? void 0 : terminal.setDistanceScaleGlobalNames) == null) {
      continue;
    }
    const globalNames = [];
    const visited = /* @__PURE__ */ new Set();
    const stack = [];
    pushSpatialInputs(node.id, stack);
    while (stack.length > 0) {
      const nodeId = stack.pop();
      if (visited.has(nodeId)) {
        continue;
      }
      visited.add(nodeId);
      const instance = nodeInstances[nodeId];
      if (instance instanceof SdApplyTransformShaderNode) {
        globalNames.push(instance.distanceScaleGlobalName);
      }
      pushSpatialInputs(nodeId, stack);
    }
    if (globalNames.length > 0) {
      terminal.setDistanceScaleGlobalNames(globalNames);
    }
  }
}
export {
  ShaderGraphResolver
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0ZXJpYWxzL2NvcmUvU2hhZGVyR3JhcGhSZXNvbHZlci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBJbmRleCB9IGZyb20gJy4uLy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB0eXBlIHsgU2hhZGVyTm9kZUpzb24gfSBmcm9tICcuLi8uLi8uLi90eXBlcy9TaGFkZXJOb2RlSnNvbic7XG5pbXBvcnQgdHlwZSB7IENvbW1vblNoYWRlclBhcnQsIFNoYWRpbmdTZWN0aW9uIH0gZnJvbSAnLi4vLi4vLi4vd2ViZ2wvc2hhZGVycy9Db21tb25TaGFkZXJQYXJ0JztcbmltcG9ydCB7IENvbXBvbmVudFR5cGUsIHR5cGUgQ29tcG9uZW50VHlwZUVudW0gfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Db21wb25lbnRUeXBlJztcbmltcG9ydCB7IENvbXBvc2l0aW9uVHlwZSwgdHlwZSBDb21wb3NpdGlvblR5cGVFbnVtIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvQ29tcG9zaXRpb25UeXBlJztcbmltcG9ydCB7IFByb2Nlc3NBcHByb2FjaCB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1Byb2Nlc3NBcHByb2FjaCc7XG5pbXBvcnQgeyBTaGFkZXJUeXBlLCB0eXBlIFNoYWRlclR5cGVFbnVtIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvU2hhZGVyVHlwZSc7XG5pbXBvcnQgeyBTY2FsYXIgfSBmcm9tICcuLi8uLi9tYXRoL1NjYWxhcic7XG5pbXBvcnQgeyBWZWN0b3IyIH0gZnJvbSAnLi4vLi4vbWF0aC9WZWN0b3IyJztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICcuLi8uLi9tYXRoL1ZlY3RvcjMnO1xuaW1wb3J0IHsgVmVjdG9yNCB9IGZyb20gJy4uLy4uL21hdGgvVmVjdG9yNCc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi8uLi9taXNjL0xvZ2dlcic7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uLy4uL3N5c3RlbS9FbmdpbmUnO1xuaW1wb3J0IHsgQWJzU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL0Fic1NoYWRlck5vZGUnO1xuaW1wb3J0IHsgQWNvc1NoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9BY29zU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBBZGRTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvQWRkU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBBbHBoYVRlc3RTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvQWxwaGFUZXN0U2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBBbmRTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvQW5kU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBBdGFuMlNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9BdGFuMlNoYWRlck5vZGUnO1xuaW1wb3J0IHsgQXR0cmlidXRlQ29sb3JTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvQXR0cmlidXRlQ29sb3JTaGFkZXJOb2RlJztcbmltcG9ydCB7IEF0dHJpYnV0ZUluc3RhbmNlSWRzU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL0F0dHJpYnV0ZUluc3RhbmNlSWRzU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBBdHRyaWJ1dGVKb2ludFNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9BdHRyaWJ1dGVKb2ludFNoYWRlck5vZGUnO1xuaW1wb3J0IHsgQXR0cmlidXRlTm9ybWFsU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL0F0dHJpYnV0ZU5vcm1hbFNoYWRlck5vZGUnO1xuaW1wb3J0IHsgQXR0cmlidXRlUG9zaXRpb25TaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvQXR0cmlidXRlUG9zaXRpb25TaGFkZXJOb2RlJztcbmltcG9ydCB7IEF0dHJpYnV0ZVRhbmdlbnRTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvQXR0cmlidXRlVGFuZ2VudFNoYWRlck5vZGUnO1xuaW1wb3J0IHsgQXR0cmlidXRlVGV4Y29vcmRTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvQXR0cmlidXRlVGV4Y29vcmRTaGFkZXJOb2RlJztcbmltcG9ydCB7IEF0dHJpYnV0ZVdlaWdodFNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9BdHRyaWJ1dGVXZWlnaHRTaGFkZXJOb2RlJztcbmltcG9ydCB7IEJyYW5jaFNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9CcmFuY2hTaGFkZXJOb2RlJztcbmltcG9ydCB7IENhbGNCaXRhbmdlbnRTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvQ2FsY0JpdGFuZ2VudFNoYWRlck5vZGUnO1xuaW1wb3J0IHsgQ2FzdFRvRmxvYXRTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvQ2FzdFRvRmxvYXRTaGFkZXJOb2RlJztcbmltcG9ydCB7IENsYW1wU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL0NsYW1wU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBDbGFzc2ljU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL0NsYXNzaWNTaGFkZXJOb2RlJztcbmltcG9ydCB7IENvbnN0YW50U2NhbGFyVmFyaWFibGVTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvQ29uc3RhbnRTY2FsYXJWYXJpYWJsZVNoYWRlck5vZGUnO1xuaW1wb3J0IHsgQ29uc3RhbnRWZWN0b3IyVmFyaWFibGVTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvQ29uc3RhbnRWZWN0b3IyVmFyaWFibGVTaGFkZXJOb2RlJztcbmltcG9ydCB7IENvbnN0YW50VmVjdG9yM1ZhcmlhYmxlU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL0NvbnN0YW50VmVjdG9yM1ZhcmlhYmxlU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBDb25zdGFudFZlY3RvcjRWYXJpYWJsZVNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9Db25zdGFudFZlY3RvcjRWYXJpYWJsZVNoYWRlck5vZGUnO1xuaW1wb3J0IHsgQ29zU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL0Nvc1NoYWRlck5vZGUnO1xuaW1wb3J0IHsgRGlzY2FyZFNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9EaXNjYXJkU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBEb3RQcm9kdWN0U2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL0RvdFByb2R1Y3RTaGFkZXJOb2RlJztcbmltcG9ydCB7IEVxdWFsU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL0VxdWFsU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBGbGF0U2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL0ZsYXRTaGFkZXJOb2RlJztcbmltcG9ydCB7IEdyZWF0ZXJPckVxdWFsU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL0dyZWF0ZXJPckVxdWFsU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBHcmVhdGVyU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL0dyZWF0ZXJTaGFkZXJOb2RlJztcbmltcG9ydCB7IEdyZWF0ZXJUaGFuU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL0dyZWF0ZXJUaGFuU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBMZW5ndGhTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvTGVuZ3RoU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBMZXNzT3JFcXVhbFNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9MZXNzT3JFcXVhbFNoYWRlck5vZGUnO1xuaW1wb3J0IHsgTGVzc1RoYW5TaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvTGVzc1RoYW5TaGFkZXJOb2RlJztcbmltcG9ydCB7IE1lcmdlVmVjdG9yU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL01lcmdlVmVjdG9yU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBNaW5TaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvTWluU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBNdWx0aXBseVNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9NdWx0aXBseVNoYWRlck5vZGUnO1xuaW1wb3J0IHsgTm9ybWFsaXplU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL05vcm1hbGl6ZVNoYWRlck5vZGUnO1xuaW1wb3J0IHsgTm9ybWFsTWF0cml4U2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL05vcm1hbE1hdHJpeFNoYWRlck5vZGUnO1xuaW1wb3J0IHsgTm90RXF1YWxTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvTm90RXF1YWxTaGFkZXJOb2RlJztcbmltcG9ydCB7IE9yU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL09yU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBPdXRDb2xvclNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9PdXRDb2xvclNoYWRlck5vZGUnO1xuaW1wb3J0IHsgT3V0UG9zaXRpb25TaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvT3V0UG9zaXRpb25TaGFkZXJOb2RlJztcbmltcG9ydCB7IFBickFuaXNvdHJvcHlQcm9wc1NoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9QYnJBbmlzb3Ryb3B5UHJvcHNTaGFkZXJOb2RlJztcbmltcG9ydCB7IFBickFuaXNvdHJvcHlSb3RhdGlvblNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9QYnJBbmlzb3Ryb3B5Um90YXRpb25TaGFkZXJOb2RlJztcbmltcG9ydCB7IFBickJhc2VDb2xvclByb3BzU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL1BickJhc2VDb2xvclByb3BzU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBQYnJDbGVhcmNvYXRQcm9wc1NoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9QYnJDbGVhcmNvYXRQcm9wc1NoYWRlck5vZGUnO1xuaW1wb3J0IHsgUGJyRGlmZnVzZVRyYW5zbWlzc2lvblByb3BzU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL1BickRpZmZ1c2VUcmFuc21pc3Npb25Qcm9wc1NoYWRlck5vZGUnO1xuaW1wb3J0IHsgUGJyRW1pc3NpdmVQcm9wc1NoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9QYnJFbWlzc2l2ZVByb3BzU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBQYnJJcmlkZXNjZW5jZVByb3BzU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL1BicklyaWRlc2NlbmNlUHJvcHNTaGFkZXJOb2RlJztcbmltcG9ydCB7IFBick1ldGFsbGljUm91Z2huZXNzUHJvcHNTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvUGJyTWV0YWxsaWNSb3VnaG5lc3NQcm9wc1NoYWRlck5vZGUnO1xuaW1wb3J0IHsgUGJyTm9ybWFsUHJvcHNTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvUGJyTm9ybWFsUHJvcHNTaGFkZXJOb2RlJztcbmltcG9ydCB7IFBick9jY2x1c2lvblByb3BzU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL1Bick9jY2x1c2lvblByb3BzU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBQYnJTaGFkZXJTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvUGJyU2hhZGVyU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBQYnJTaGVlblByb3BzU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL1BiclNoZWVuUHJvcHNTaGFkZXJOb2RlJztcbmltcG9ydCB7IFBiclNwZWN1bGFyUHJvcHNTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvUGJyU3BlY3VsYXJQcm9wc1NoYWRlck5vZGUnO1xuaW1wb3J0IHsgUGJyVHJhbnNtaXNzaW9uUHJvcHNTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvUGJyVHJhbnNtaXNzaW9uUHJvcHNTaGFkZXJOb2RlJztcbmltcG9ydCB7IFBiclZvbHVtZVByb3BzU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL1BiclZvbHVtZVByb3BzU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBQcmVtdWx0aXBsaWVkQWxwaGFTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvUHJlbXVsdGlwbGllZEFscGhhU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBQcm9jZXNzR2VvbWV0cnlTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvUHJvY2Vzc0dlb21ldHJ5U2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBQcm9qZWN0aW9uTWF0cml4U2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL1Byb2plY3Rpb25NYXRyaXhTaGFkZXJOb2RlJztcbmltcG9ydCB7IFJhbmRvbV9IYXNoUFJOR1NoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9SYW5kb21fSGFzaFBSTkdTaGFkZXJOb2RlJztcbmltcG9ydCB7IFJhbmRvbV9TaW5IYXNoU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL1JhbmRvbV9TaW5IYXNoU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBSZW1hcFNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9SZW1hcFNoYWRlck5vZGUnO1xuaW1wb3J0IHsgQmVuZFhZU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL3JheW1hcmNoaW5nL0JlbmRYWVNoYWRlck5vZGUnO1xuaW1wb3J0IHsgQmVuZFhaU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL3JheW1hcmNoaW5nL0JlbmRYWlNoYWRlck5vZGUnO1xuaW1wb3J0IHsgQmVuZFlYU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL3JheW1hcmNoaW5nL0JlbmRZWFNoYWRlck5vZGUnO1xuaW1wb3J0IHsgQmVuZFlaU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL3JheW1hcmNoaW5nL0JlbmRZWlNoYWRlck5vZGUnO1xuaW1wb3J0IHsgQmVuZFpYU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL3JheW1hcmNoaW5nL0JlbmRaWFNoYWRlck5vZGUnO1xuaW1wb3J0IHsgQmVuZFpZU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL3JheW1hcmNoaW5nL0JlbmRaWVNoYWRlck5vZGUnO1xuaW1wb3J0IHsgSW5pdGlhbFBvc2l0aW9uU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL3JheW1hcmNoaW5nL0luaXRpYWxQb3NpdGlvblNoYWRlck5vZGUnO1xuaW1wb3J0IHsgT3BTbW9vdGhJbnRlcnNlY3Rpb25TaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvcmF5bWFyY2hpbmcvT3BTbW9vdGhJbnRlcnNlY3Rpb25TaGFkZXJOb2RlJztcbmltcG9ydCB7IE9wU21vb3RoU3VidHJhY3Rpb25TaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvcmF5bWFyY2hpbmcvT3BTbW9vdGhTdWJ0cmFjdGlvblNoYWRlck5vZGUnO1xuaW1wb3J0IHsgT3BTbW9vdGhVbmlvblNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9yYXltYXJjaGluZy9PcFNtb290aFVuaW9uU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBPcFN1YnRyYWN0aW9uU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL3JheW1hcmNoaW5nL09wU3VidHJhY3Rpb25TaGFkZXJOb2RlJztcbmltcG9ydCB7IE9wVW5pb25TaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvcmF5bWFyY2hpbmcvT3BVbmlvblNoYWRlck5vZGUnO1xuaW1wb3J0IHsgT3V0RGlzdGFuY2VTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvcmF5bWFyY2hpbmcvT3V0RGlzdGFuY2VTaGFkZXJOb2RlJztcbmltcG9ydCB7IE91dFNoYWRpbmdDb2xvclNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9yYXltYXJjaGluZy9PdXRTaGFkaW5nQ29sb3JTaGFkZXJOb2RlJztcbmltcG9ydCB7IE91dFVuaW9uU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL3JheW1hcmNoaW5nL091dFVuaW9uU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBSYXltYXJjaENhbWVyYVBvc2l0aW9uU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL3JheW1hcmNoaW5nL1JheW1hcmNoQ2FtZXJhUG9zaXRpb25TaGFkZXJOb2RlJztcbmltcG9ydCB7IFJheW1hcmNoSGl0RGlzdGFuY2VTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvcmF5bWFyY2hpbmcvUmF5bWFyY2hIaXREaXN0YW5jZVNoYWRlck5vZGUnO1xuaW1wb3J0IHsgUmF5bWFyY2hIaXROb3JtYWxTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvcmF5bWFyY2hpbmcvUmF5bWFyY2hIaXROb3JtYWxTaGFkZXJOb2RlJztcbmltcG9ydCB7IFJheW1hcmNoSGl0UG9zaXRpb25TaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvcmF5bWFyY2hpbmcvUmF5bWFyY2hIaXRQb3NpdGlvblNoYWRlck5vZGUnO1xuaW1wb3J0IHsgUmF5bWFyY2hPYmplY3RJZFNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9yYXltYXJjaGluZy9SYXltYXJjaE9iamVjdElkU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBSYXltYXJjaE9iamVjdElkVW5pZm9ybVNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9yYXltYXJjaGluZy9SYXltYXJjaE9iamVjdElkVW5pZm9ybVNoYWRlck5vZGUnO1xuaW1wb3J0IHsgUmF5bWFyY2hSYXlEaXJlY3Rpb25TaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvcmF5bWFyY2hpbmcvUmF5bWFyY2hSYXlEaXJlY3Rpb25TaGFkZXJOb2RlJztcbmltcG9ydCB7IFJheW1hcmNoVEJOU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL3JheW1hcmNoaW5nL1JheW1hcmNoVEJOU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBSYXltYXJjaFZpZXdEaXJlY3Rpb25TaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvcmF5bWFyY2hpbmcvUmF5bWFyY2hWaWV3RGlyZWN0aW9uU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBTZEFwcGx5VHJhbnNmb3JtU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL3JheW1hcmNoaW5nL1NkQXBwbHlUcmFuc2Zvcm1TaGFkZXJOb2RlJztcbmltcG9ydCB7IFNkQXBwbHlXb3JsZE1hdHJpeFNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9yYXltYXJjaGluZy9TZEFwcGx5V29ybGRNYXRyaXhTaGFkZXJOb2RlJztcbmltcG9ydCB7IFNkQmFyWFNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9yYXltYXJjaGluZy9TZEJhclhTaGFkZXJOb2RlJztcbmltcG9ydCB7IFNkQmFyWVNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9yYXltYXJjaGluZy9TZEJhcllTaGFkZXJOb2RlJztcbmltcG9ydCB7IFNkQmFyWlNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9yYXltYXJjaGluZy9TZEJhclpTaGFkZXJOb2RlJztcbmltcG9ydCB7IFNkQm94U2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL3JheW1hcmNoaW5nL1NkQm94U2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBTZENhcHN1bGVTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvcmF5bWFyY2hpbmcvU2RDYXBzdWxlU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBTZFJlcGVhdFNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9yYXltYXJjaGluZy9TZFJlcGVhdFNoYWRlck5vZGUnO1xuaW1wb3J0IHsgU2RSZXBlYXRYU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL3JheW1hcmNoaW5nL1NkUmVwZWF0WFNoYWRlck5vZGUnO1xuaW1wb3J0IHsgU2RSZXBlYXRYWVNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9yYXltYXJjaGluZy9TZFJlcGVhdFhZU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBTZFJlcGVhdFlTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvcmF5bWFyY2hpbmcvU2RSZXBlYXRZU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBTZFJlcGVhdFlaU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL3JheW1hcmNoaW5nL1NkUmVwZWF0WVpTaGFkZXJOb2RlJztcbmltcG9ydCB7IFNkUmVwZWF0WlNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9yYXltYXJjaGluZy9TZFJlcGVhdFpTaGFkZXJOb2RlJztcbmltcG9ydCB7IFNkUmVwZWF0WlhTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvcmF5bWFyY2hpbmcvU2RSZXBlYXRaWFNoYWRlck5vZGUnO1xuaW1wb3J0IHsgU2RSb3VuZEJveFNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9yYXltYXJjaGluZy9TZFJvdW5kQm94U2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBTZFNwaGVyZVNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9yYXltYXJjaGluZy9TZFNwaGVyZVNoYWRlck5vZGUnO1xuaW1wb3J0IHsgU2RUb3J1c1NoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9yYXltYXJjaGluZy9TZFRvcnVzU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBTZFR1YmVYU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL3JheW1hcmNoaW5nL1NkVHViZVhTaGFkZXJOb2RlJztcbmltcG9ydCB7IFNkVHViZVlTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvcmF5bWFyY2hpbmcvU2RUdWJlWVNoYWRlck5vZGUnO1xuaW1wb3J0IHsgU2RUdWJlWlNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9yYXltYXJjaGluZy9TZFR1YmVaU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBUd2lzdFhTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvcmF5bWFyY2hpbmcvVHdpc3RYU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBUd2lzdFlTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvcmF5bWFyY2hpbmcvVHdpc3RZU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBUd2lzdFpTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvcmF5bWFyY2hpbmcvVHdpc3RaU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBTaW5TaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvU2luU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBTbW9vdGhTdGVwU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL1Ntb290aFN0ZXBTaGFkZXJOb2RlJztcbmltcG9ydCB7IFNwbGl0VmVjdG9yU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL1NwbGl0VmVjdG9yU2hhZGVyTm9kZSc7XG5pbXBvcnQgeyBTdGVwU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL1N0ZXBTaGFkZXJOb2RlJztcbmltcG9ydCB7IFRhblNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9UYW5TaGFkZXJOb2RlJztcbmltcG9ydCB7IFRleHR1cmUyRFNoYWRlck5vZGUgfSBmcm9tICcuLi9ub2Rlcy9UZXh0dXJlMkRTaGFkZXJOb2RlJztcbmltcG9ydCB7IFRpbWVTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvVGltZVNoYWRlck5vZGUnO1xuaW1wb3J0IHsgVHJhbnNmb3JtU2hhZGVyTm9kZSB9IGZyb20gJy4uL25vZGVzL1RyYW5zZm9ybVNoYWRlck5vZGUnO1xuaW1wb3J0IHsgVW5pZm9ybURhdGFTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvVW5pZm9ybURhdGFTaGFkZXJOb2RlJztcbmltcG9ydCB7IFZpZXdNYXRyaXhTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvVmlld01hdHJpeFNoYWRlck5vZGUnO1xuaW1wb3J0IHsgV29ybGRNYXRyaXhTaGFkZXJOb2RlIH0gZnJvbSAnLi4vbm9kZXMvV29ybGRNYXRyaXhTaGFkZXJOb2RlJztcbmltcG9ydCB7IEFic3RyYWN0U2hhZGVyTm9kZSwgdHlwZSBTaGFkZXJOb2RlVUlEIH0gZnJvbSAnLi9BYnN0cmFjdFNoYWRlck5vZGUnO1xuaW1wb3J0IHR5cGUgeyBTb2NrZXREZWZhdWx0VmFsdWUsIFZhbHVlVHlwZXMgfSBmcm9tICcuL1NvY2tldCc7XG5cbi8qKlxuICogU2hhZGVyR3JhcGhSZXNvbHZlciBpcyBhIGNsYXNzIHRoYXQgcmVzb2x2ZXMgdGhlIHNoYWRlciBub2RlIGdyYXBoIGFuZCBnZW5lcmF0ZXMgc2hhZGVyIGNvZGUuXG4gKiBJdCBwcm92aWRlcyBmdW5jdGlvbmFsaXR5IHRvIGNvbnZlcnQgYSBncmFwaCBvZiBzaGFkZXIgbm9kZXMgaW50byBjb21wbGV0ZSB2ZXJ0ZXggYW5kIGZyYWdtZW50IHNoYWRlcnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBTaGFkZXJHcmFwaFJlc29sdmVyIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBjb21wbGV0ZSB2ZXJ0ZXggc2hhZGVyIGNvZGUgZnJvbSB0aGUgZ2l2ZW4gdmVydGV4IGFuZCB2YXJ5aW5nIG5vZGVzLlxuICAgKiBUaGlzIG1ldGhvZCBwZXJmb3JtcyB0b3BvbG9naWNhbCBzb3J0aW5nIG9mIG5vZGVzLCBnZW5lcmF0ZXMgZnVuY3Rpb24gZGVmaW5pdGlvbnMsXG4gICAqIGFuZCBjb25zdHJ1Y3RzIHRoZSBtYWluIHNoYWRlciBib2R5IHdpdGggcHJvcGVyIHZhcmlhYmxlIGRlY2xhcmF0aW9ucyBhbmQgY29ubmVjdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSB2ZXJ0ZXhOb2RlcyAtIEFycmF5IG9mIHNoYWRlciBub2RlcyB0aGF0IGNvbnRyaWJ1dGUgdG8gdmVydGV4IHByb2Nlc3NpbmdcbiAgICogQHBhcmFtIHZhcnlpbmdOb2RlcyAtIEFycmF5IG9mIHNoYWRlciBub2RlcyB0aGF0IHBhc3MgZGF0YSBmcm9tIHZlcnRleCB0byBmcmFnbWVudCBzdGFnZVxuICAgKiBAcGFyYW0gY29tbW9uU2hhZGVyUGFydCAtIFRoZSBDb21tb25TaGFkZXJQYXJ0IGluc3RhbmNlIGZvciBzaGFkZXIgY29kZSBnZW5lcmF0aW9uXG4gICAqIEBwYXJhbSBpc0Z1bGxWZXJzaW9uIC0gV2hldGhlciB0byBnZW5lcmF0ZSBhIGZ1bGwgdmVyc2lvbiB3aXRoIGFsbCBwcmVyZXF1aXNpdGVzIGFuZCBib2lsZXJwbGF0ZVxuICAgKiBAcmV0dXJucyBDb21wbGV0ZSB2ZXJ0ZXggc2hhZGVyIGNvZGUgYXMgYSBzdHJpbmcsIG9yIHVuZGVmaW5lZCBpZiBnZW5lcmF0aW9uIGZhaWxzXG4gICAqL1xuICBzdGF0aWMgY3JlYXRlVmVydGV4U2hhZGVyQ29kZShcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICB2ZXJ0ZXhOb2RlczogQWJzdHJhY3RTaGFkZXJOb2RlW10sXG4gICAgdmFyeWluZ05vZGVzOiBBYnN0cmFjdFNoYWRlck5vZGVbXSxcbiAgICBjb21tb25TaGFkZXJQYXJ0OiBDb21tb25TaGFkZXJQYXJ0XG4gICkge1xuICAgIGNvbnN0IHNoYWRlck5vZGVzID0gdmVydGV4Tm9kZXMuY29uY2F0KCk7XG5cbiAgICAvLyBjb25zdCBpc1ZhbGlkID0gdGhpcy5fX3ZhbGlkYXRlU2hhZGVyTm9kZXMoc2hhZGVyTm9kZXMpO1xuICAgIC8vIGlmICghaXNWYWxpZCkge1xuICAgIC8vICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAvLyB9XG5cbiAgICAvLyBUb3BvbG9naWNhbCBTb3J0aW5nXG4gICAgY29uc3Qgc29ydGVkU2hhZGVyTm9kZXMgPSB0aGlzLl9fc29ydFRvcG9sb2dpY2FsbHkoc2hhZGVyTm9kZXMpO1xuICAgIC8vIGNvbnN0IHNvcnRlZFZhcnlpbmdOb2RlcyA9IHRoaXMuX19zb3J0VG9wb2xvZ2ljYWxseSh2YXJ5aW5nTm9kZXMpO1xuXG4gICAgLy8gQWRkIGFkZGl0aW9uYWwgZnVuY3Rpb25zIGJ5IHN5c3RlbVxuICAgIGxldCB2ZXJ0ZXhTaGFkZXJQcmVyZXF1aXNpdGVzID0gJyc7XG5cbiAgICBjb25zdCBub2RlcyA9IHNvcnRlZFNoYWRlck5vZGVzLmNvbmNhdCh2YXJ5aW5nTm9kZXMpO1xuXG4gICAgdmVydGV4U2hhZGVyUHJlcmVxdWlzaXRlcyArPSBjb21tb25TaGFkZXJQYXJ0LmdldFZlcnRleFByZXJlcXVpc2l0ZXMoZW5naW5lLCBub2Rlcyk7XG5cbiAgICBsZXQgc2hhZGVyQm9keSA9ICcnO1xuXG4gICAgLy8gZnVuY3Rpb24gZGVmaW5pdGlvbnNcbiAgICBzaGFkZXJCb2R5ICs9IFNoYWRlckdyYXBoUmVzb2x2ZXIuX19nZXRGdW5jdGlvbkRlZmluaXRpb24oXG4gICAgICBlbmdpbmUsXG4gICAgICAvLyBzb3J0ZWRTaGFkZXJOb2RlcyxcbiAgICAgIHNvcnRlZFNoYWRlck5vZGVzLmNvbmNhdCh2YXJ5aW5nTm9kZXMuZmlsdGVyKG5vZGUgPT4gbm9kZS5nZXRTaGFkZXJTdGFnZSgpICE9PSAnRnJhZ21lbnQnKSksXG4gICAgICBTaGFkZXJUeXBlLlZlcnRleFNoYWRlclxuICAgICk7XG5cbiAgICAvLyBtYWluIHByb2Nlc3NcbiAgICB0cnkge1xuICAgICAgc2hhZGVyQm9keSArPSBTaGFkZXJHcmFwaFJlc29sdmVyLl9fY29uc3RydWN0U2hhZGVyV2l0aE5vZGVzKGVuZ2luZSwgbm9kZXMsIHRydWUsIGNvbW1vblNoYWRlclBhcnQpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKGUgYXMgc3RyaW5nKTtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgY29uc3Qgc2hhZGVyID0gdmVydGV4U2hhZGVyUHJlcmVxdWlzaXRlcyArIHNoYWRlckJvZHk7XG5cbiAgICByZXR1cm4gc2hhZGVyO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBjb21wbGV0ZSBmcmFnbWVudC9waXhlbCBzaGFkZXIgY29kZSBmcm9tIHRoZSBnaXZlbiBwaXhlbCBub2Rlcy5cbiAgICogVGhpcyBtZXRob2QgcGVyZm9ybXMgdG9wb2xvZ2ljYWwgc29ydGluZywgZ2VuZXJhdGVzIGZ1bmN0aW9uIGRlZmluaXRpb25zLFxuICAgKiBhbmQgY29uc3RydWN0cyB0aGUgbWFpbiBzaGFkZXIgYm9keSBmb3IgZnJhZ21lbnQgcHJvY2Vzc2luZy5cbiAgICpcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIHBpeGVsTm9kZXMgLSBBcnJheSBvZiBzaGFkZXIgbm9kZXMgdGhhdCBjb250cmlidXRlIHRvIGZyYWdtZW50IHByb2Nlc3NpbmdcbiAgICogQHBhcmFtIGNvbW1vblNoYWRlclBhcnQgLSBUaGUgQ29tbW9uU2hhZGVyUGFydCBpbnN0YW5jZSBmb3Igc2hhZGVyIGNvZGUgZ2VuZXJhdGlvblxuICAgKiBAcGFyYW0gaXNGdWxsVmVyc2lvbiAtIFdoZXRoZXIgdG8gZ2VuZXJhdGUgYSBmdWxsIHZlcnNpb24gd2l0aCBhbGwgcHJlcmVxdWlzaXRlcyBhbmQgYm9pbGVycGxhdGVcbiAgICogQHJldHVybnMgQ29tcGxldGUgZnJhZ21lbnQgc2hhZGVyIGNvZGUgYXMgYSBzdHJpbmcsIG9yIHVuZGVmaW5lZCBpZiBnZW5lcmF0aW9uIGZhaWxzXG4gICAqL1xuICBzdGF0aWMgY3JlYXRlUGl4ZWxTaGFkZXJDb2RlKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHBpeGVsTm9kZXM6IEFic3RyYWN0U2hhZGVyTm9kZVtdLFxuICAgIGNvbW1vblNoYWRlclBhcnQ6IENvbW1vblNoYWRlclBhcnQsXG4gICAgc2hhZGluZ0dyb3Vwcz86IFJlYWRvbmx5TWFwPG51bWJlciwgQWJzdHJhY3RTaGFkZXJOb2RlW10+XG4gICkge1xuICAgIGNvbnN0IHNoYWRlck5vZGVzID0gcGl4ZWxOb2Rlcy5jb25jYXQoKTtcblxuICAgIC8vIGNvbnN0IGlzVmFsaWQgPSB0aGlzLl9fdmFsaWRhdGVTaGFkZXJOb2RlcyhzaGFkZXJOb2Rlcyk7XG4gICAgLy8gaWYgKCFpc1ZhbGlkKSB7XG4gICAgLy8gICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIC8vIH1cblxuICAgIC8vIFRvcG9sb2dpY2FsIFNvcnRpbmdcbiAgICBjb25zdCBzb3J0ZWRTaGFkZXJOb2RlcyA9IHRoaXMuX19zb3J0VG9wb2xvZ2ljYWxseShzaGFkZXJOb2Rlcyk7XG5cbiAgICAvLyBBZGQgYWRkaXRpb25hbCBmdW5jdGlvbnMgYnkgc3lzdGVtXG4gICAgbGV0IHBpeGVsU2hhZGVyUHJlcmVxdWlzaXRlcyA9IGNvbW1vblNoYWRlclBhcnQuZ2V0UGl4ZWxQcmVyZXF1aXNpdGVzKGVuZ2luZSwgc29ydGVkU2hhZGVyTm9kZXMpO1xuICAgIGxldCBzaGFkZXJCb2R5ID0gJyc7XG5cbiAgICAvLyBmdW5jdGlvbiBkZWZpbml0aW9uc1xuICAgIHNoYWRlckJvZHkgKz0gU2hhZGVyR3JhcGhSZXNvbHZlci5fX2dldEZ1bmN0aW9uRGVmaW5pdGlvbihcbiAgICAgIGVuZ2luZSxcbiAgICAgIHNvcnRlZFNoYWRlck5vZGVzLmZpbHRlcihub2RlID0+IG5vZGUuZ2V0U2hhZGVyU3RhZ2UoKSAhPT0gJ1ZlcnRleCcpLFxuICAgICAgU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICAgIG5ldyBTZXQoY29tbW9uU2hhZGVyUGFydC5nZXRFbWJlZGRlZFNoYWRlckZ1bmN0aW9uTmFtZXMoKSlcbiAgICApO1xuXG4gICAgLy8gUGVyLW9iamVjdCBzaGFkaW5nIHNlY3Rpb25zIChlLmcuIHRoZSByYXltYXJjaGluZyBzaGFkaW5nIGdyYXBocykuIEVhY2hcbiAgICAvLyBjb21wb25lbnQncyBvdXRTaGFkaW5nQ29sb3Igc3ViZ3JhcGggYmVjb21lcyBpdHMgb3duIGZ1bmN0aW9uLCBlbWl0dGVkXG4gICAgLy8gYmVmb3JlIHRoZSBmcmFnbWVudCBtYWluIGFuZCBzZWxlY3RlZCBieSB0aGUgcmVjb3JkZWQgb2JqZWN0IGlkLlxuICAgIGxldCBzaGFkaW5nU2VjdGlvbnM6IFNoYWRpbmdTZWN0aW9uW10gfCB1bmRlZmluZWQ7XG4gICAgaWYgKGNvbW1vblNoYWRlclBhcnQuaGFzU2hhZGluZ1NlY3Rpb24gJiYgc2hhZGluZ0dyb3VwcyAhPSBudWxsICYmIHNoYWRpbmdHcm91cHMuc2l6ZSA+IDApIHtcbiAgICAgIGNvbnN0IGZ1bmN0aW9uUHJlZml4ID0gY29tbW9uU2hhZGVyUGFydC5nZXRTaGFkaW5nRnVuY3Rpb25OYW1lUHJlZml4KCk7XG4gICAgICBzaGFkaW5nU2VjdGlvbnMgPSBbXTtcbiAgICAgIGNvbnN0IHNvcnRlZE9iamVjdElkcyA9IEFycmF5LmZyb20oc2hhZGluZ0dyb3Vwcy5rZXlzKCkpLnNvcnQoKGEsIGIpID0+IGEgLSBiKTtcbiAgICAgIGZvciAoY29uc3Qgb2JqZWN0SWQgb2Ygc29ydGVkT2JqZWN0SWRzKSB7XG4gICAgICAgIGNvbnN0IHNoYWRpbmdOb2RlcyA9IHNoYWRpbmdHcm91cHMuZ2V0KG9iamVjdElkKSE7XG4gICAgICAgIGNvbnN0IHNvcnRlZFNoYWRpbmdOb2RlcyA9IHRoaXMuX19zb3J0VG9wb2xvZ2ljYWxseShzaGFkaW5nTm9kZXMpO1xuICAgICAgICBjb25zdCB7IHZhcklucHV0TmFtZXMsIHZhck91dHB1dE5hbWVzLCBjb2xsZWN0ZWRTaGFkZXJCb2R5IH0gPSB0aGlzLl9fY29sbGVjdFZhcmlhYmxlTmFtZXMoXG4gICAgICAgICAgZW5naW5lLFxuICAgICAgICAgIHNvcnRlZFNoYWRpbmdOb2RlcyxcbiAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICBjb21tb25TaGFkZXJQYXJ0XG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IGJvZHkgPVxuICAgICAgICAgIGNvbGxlY3RlZFNoYWRlckJvZHkgK1xuICAgICAgICAgIHRoaXMuX19nZW5lcmF0ZVNoYWRlckNvZGUoZW5naW5lLCBzb3J0ZWRTaGFkaW5nTm9kZXMsIHZhcklucHV0TmFtZXMsIHZhck91dHB1dE5hbWVzLCBmYWxzZSk7XG4gICAgICAgIHNoYWRpbmdTZWN0aW9ucy5wdXNoKHsgb2JqZWN0SWQsIGZ1bmN0aW9uTmFtZTogYCR7ZnVuY3Rpb25QcmVmaXh9XyR7b2JqZWN0SWR9YCwgYm9keSB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBtYWluIHByb2Nlc3NcbiAgICB0cnkge1xuICAgICAgc2hhZGVyQm9keSArPSBTaGFkZXJHcmFwaFJlc29sdmVyLl9fY29uc3RydWN0U2hhZGVyV2l0aE5vZGVzKFxuICAgICAgICBlbmdpbmUsXG4gICAgICAgIHNvcnRlZFNoYWRlck5vZGVzLFxuICAgICAgICBmYWxzZSxcbiAgICAgICAgY29tbW9uU2hhZGVyUGFydCxcbiAgICAgICAgc2hhZGluZ1NlY3Rpb25zXG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKGUgYXMgc3RyaW5nKTtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgY29uc3Qgc2hhZGVyID0gcGl4ZWxTaGFkZXJQcmVyZXF1aXNpdGVzICsgc2hhZGVyQm9keTtcblxuICAgIHJldHVybiBzaGFkZXI7XG4gIH1cblxuICAvKipcbiAgICogR3JvdXBzIHRoZSBub2RlcyByZWFjaGFibGUgdG8gZWFjaCBvdXRTaGFkaW5nQ29sb3IgdGVybWluYWwgYnkgdGhlIGNvbXBvbmVudFxuICAgKiB0aGF0IGF1dGhvcmVkIGl0LiBNZXJnZWQgcmF5bWFyY2hpbmcgZ3JhcGhzIHByZWZpeCBub2RlIGlkcyB3aXRoIGBjb21wPE4+X2AsXG4gICAqIHdoZXJlIE4gaXMgdGhlIGNvbXBvbmVudCBTSUQgYW5kIGFsc28gdGhlIHJlY29yZGVkIG9iamVjdCBpZC5cbiAgICpcbiAgICogR3JhcGhzIHdpdGhvdXQgdGhhdCBwcmVmaXggKGUuZy4gYSBzaW5nbGUgY29tcG9uZW50IGJ1aWx0IGRpcmVjdGx5KSBhcmUgZ3JvdXBlZFxuICAgKiB1bmRlciBvYmplY3QgaWQgMC5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fY29sbGVjdFNoYWRpbmdHcm91cHMoXG4gICAganNvbjogU2hhZGVyTm9kZUpzb24sXG4gICAgbm9kZUluc3RhbmNlczogUmVjb3JkPHN0cmluZywgQWJzdHJhY3RTaGFkZXJOb2RlPlxuICApOiBNYXA8bnVtYmVyLCBBYnN0cmFjdFNoYWRlck5vZGVbXT4ge1xuICAgIGNvbnN0IGdyb3VwcyA9IG5ldyBNYXA8bnVtYmVyLCBBYnN0cmFjdFNoYWRlck5vZGVbXT4oKTtcbiAgICBjb25zdCBpbmNvbWluZyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmdbXT4oKTtcbiAgICBmb3IgKGNvbnN0IGNvbm5lY3Rpb24gb2YganNvbi5jb25uZWN0aW9ucykge1xuICAgICAgY29uc3QgbGlzdCA9IGluY29taW5nLmdldChjb25uZWN0aW9uLnRvLmlkKTtcbiAgICAgIGlmIChsaXN0ID09IG51bGwpIHtcbiAgICAgICAgaW5jb21pbmcuc2V0KGNvbm5lY3Rpb24udG8uaWQsIFtjb25uZWN0aW9uLmZyb20uaWRdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpc3QucHVzaChjb25uZWN0aW9uLmZyb20uaWQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3Qgbm9kZSBvZiBqc29uLm5vZGVzKSB7XG4gICAgICBpZiAobm9kZS5uYW1lICE9PSAnT3V0U2hhZGluZ0NvbG9yJykge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHByZWZpeE1hdGNoID0gL15jb21wKFxcZCspXy8uZXhlYyhub2RlLmlkKTtcbiAgICAgIGNvbnN0IG9iamVjdElkID0gcHJlZml4TWF0Y2ggIT0gbnVsbCA/IE51bWJlci5wYXJzZUludChwcmVmaXhNYXRjaFsxXSwgMTApIDogMDtcbiAgICAgIGNvbnN0IGdyb3VwID0gZ3JvdXBzLmdldChvYmplY3RJZCkgPz8gW107XG4gICAgICBjb25zdCBncm91cFVpZHMgPSBuZXcgU2V0PG51bWJlcj4oZ3JvdXAubWFwKGdyb3VwTm9kZSA9PiBncm91cE5vZGUuc2hhZGVyTm9kZVVpZCkpO1xuICAgICAgY29uc3QgdmlzaXRlZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgY29uc3Qgc3RhY2sgPSBbbm9kZS5pZF07XG4gICAgICB3aGlsZSAoc3RhY2subGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBpZCA9IHN0YWNrLnBvcCgpITtcbiAgICAgICAgaWYgKHZpc2l0ZWQuaGFzKGlkKSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHZpc2l0ZWQuYWRkKGlkKTtcbiAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBub2RlSW5zdGFuY2VzW2lkXTtcbiAgICAgICAgaWYgKGluc3RhbmNlICE9IG51bGwgJiYgIWdyb3VwVWlkcy5oYXMoaW5zdGFuY2Uuc2hhZGVyTm9kZVVpZCkpIHtcbiAgICAgICAgICBncm91cC5wdXNoKGluc3RhbmNlKTtcbiAgICAgICAgICBncm91cFVpZHMuYWRkKGluc3RhbmNlLnNoYWRlck5vZGVVaWQpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgZnJvbUlkIG9mIGluY29taW5nLmdldChpZCkgPz8gW10pIHtcbiAgICAgICAgICBzdGFjay5wdXNoKGZyb21JZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGdyb3Vwcy5zZXQob2JqZWN0SWQsIGdyb3VwKTtcbiAgICB9XG4gICAgcmV0dXJuIGdyb3VwcztcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZXMgdGhhdCBhbGwgc2hhZGVyIG5vZGVzIGhhdmUgdGhlaXIgcmVxdWlyZWQgaW5wdXQgY29ubmVjdGlvbnMgcHJvcGVybHkgc2V0LlxuICAgKiBUaGlzIGlzIGEgdmFsaWRhdGlvbiBzdGVwIHRvIGVuc3VyZSB0aGUgc2hhZGVyIGdyYXBoIGlzIGNvbXBsZXRlIGJlZm9yZSBjb2RlIGdlbmVyYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBzaGFkZXJOb2RlcyAtIEFycmF5IG9mIHNoYWRlciBub2RlcyB0byB2YWxpZGF0ZVxuICAgKiBAcmV0dXJucyBUcnVlIGlmIGFsbCBub2RlcyBhcmUgdmFsaWQsIGZhbHNlIGlmIGFueSBub2RlIGhhcyBtaXNzaW5nIHJlcXVpcmVkIGNvbm5lY3Rpb25zXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3ZhbGlkYXRlU2hhZGVyTm9kZXMoc2hhZGVyTm9kZXM6IEFic3RyYWN0U2hhZGVyTm9kZVtdKSB7XG4gICAgY29uc3QgX3NoYWRlck5vZGVVaWRzOiBTaGFkZXJOb2RlVUlEW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNoYWRlck5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBzaGFkZXJOb2RlID0gc2hhZGVyTm9kZXNbaV07XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHNoYWRlck5vZGUuaW5wdXRDb25uZWN0aW9ucy5sZW5ndGg7IGorKykge1xuICAgICAgICBjb25zdCBpbnB1dENvbm5lY3Rpb24gPSBzaGFkZXJOb2RlLmlucHV0Q29ubmVjdGlvbnNbal07XG4gICAgICAgIGlmIChpbnB1dENvbm5lY3Rpb24gPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtcyB0b3BvbG9naWNhbCBzb3J0aW5nIG9uIHNoYWRlciBub2RlcyB0byBkZXRlcm1pbmUgdGhlIGNvcnJlY3QgZXhlY3V0aW9uIG9yZGVyLlxuICAgKiBVc2VzIEthaG4ncyBhbGdvcml0aG0gKEJGUy1iYXNlZCkgdG8gc29ydCBub2RlcyBiYXNlZCBvbiB0aGVpciBkZXBlbmRlbmNpZXMuXG4gICAqIFRoaXMgZW5zdXJlcyB0aGF0IG5vZGVzIGFyZSBwcm9jZXNzZWQgaW4gdGhlIGNvcnJlY3Qgb3JkZXIgZHVyaW5nIHNoYWRlciBleGVjdXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBzaGFkZXJOb2RlcyAtIEFycmF5IG9mIHNoYWRlciBub2RlcyB0byBzb3J0XG4gICAqIEByZXR1cm5zIEFycmF5IG9mIHNoYWRlciBub2RlcyBzb3J0ZWQgaW4gdG9wb2xvZ2ljYWwgb3JkZXJcbiAgICogQHRocm93cyBFcnJvciBpZiB0aGUgZ3JhcGggY29udGFpbnMgY3ljbGVzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3NvcnRUb3BvbG9naWNhbGx5KHNoYWRlck5vZGVzOiBBYnN0cmFjdFNoYWRlck5vZGVbXSkge1xuICAgIGNvbnN0IHNvcnRlZE5vZGVBcnJheTogQWJzdHJhY3RTaGFkZXJOb2RlW10gPSBbXTtcbiAgICBjb25zdCBpbnB1dE51bUFycmF5OiBJbmRleFtdID0gW107XG5cbiAgICAvLyBjYWxjdWxhdGUgaW5wdXROdW1BcnJheVxuICAgIGNvbnN0IHF1ZXVlOiBBYnN0cmFjdFNoYWRlck5vZGVbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2hhZGVyTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHNoYWRlck5vZGUgPSBzaGFkZXJOb2Rlc1tpXTtcbiAgICAgIGxldCBjb3VudCA9IDA7XG4gICAgICBmb3IgKGNvbnN0IGlucHV0Q29ubmVjdGlvbiBvZiBzaGFkZXJOb2RlLmlucHV0Q29ubmVjdGlvbnMpIHtcbiAgICAgICAgaWYgKGlucHV0Q29ubmVjdGlvbiAhPSBudWxsKSB7XG4gICAgICAgICAgY291bnQrKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaW5wdXROdW1BcnJheVtpXSA9IGNvdW50O1xuICAgIH1cblxuICAgIC8vIGNvbGxlY3Qgb3V0cHV0IG5vZGVzXG4gICAgY29uc3Qgb3V0cHV0Tm9kZXM6IEFic3RyYWN0U2hhZGVyTm9kZVtdW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNoYWRlck5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBzaGFkZXJOb2RlID0gc2hhZGVyTm9kZXNbaV07XG4gICAgICBmb3IgKGNvbnN0IGlucHV0Q29ubmVjdGlvbiBvZiBzaGFkZXJOb2RlLmlucHV0Q29ubmVjdGlvbnMpIHtcbiAgICAgICAgaWYgKGlucHV0Q29ubmVjdGlvbiA9PSBudWxsKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaW5wdXROb2RlID0gQWJzdHJhY3RTaGFkZXJOb2RlLmdldFNoYWRlck5vZGVCeVVpZChpbnB1dENvbm5lY3Rpb24uc2hhZGVyTm9kZVVpZCk7XG4gICAgICAgIGNvbnN0IGlucHV0Tm9kZUlkeCA9IHNoYWRlck5vZGVzLmluZGV4T2YoaW5wdXROb2RlKTtcbiAgICAgICAgaWYgKG91dHB1dE5vZGVzW2lucHV0Tm9kZUlkeF0gPT0gbnVsbCkge1xuICAgICAgICAgIG91dHB1dE5vZGVzW2lucHV0Tm9kZUlkeF0gPSBbXTtcbiAgICAgICAgfVxuICAgICAgICBvdXRwdXROb2Rlc1tpbnB1dE5vZGVJZHhdLnB1c2goc2hhZGVyTm9kZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2hhZGVyTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChvdXRwdXROb2Rlc1tpXSA9PSBudWxsKSB7XG4gICAgICAgIG91dHB1dE5vZGVzW2ldID0gW107XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gY29sbGVjdCBub2RlcyB3aGljaCBoYXZlIG5vIGlucHV0XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaGFkZXJOb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGlucHV0TnVtQXJyYXlbaV0gPT09IDApIHtcbiAgICAgICAgcXVldWUucHVzaChzaGFkZXJOb2Rlc1tpXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gdG9wb2xvZ2ljYWwgc29ydCAoQkZTKVxuICAgIHdoaWxlIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBub3cgPSBxdWV1ZS5zaGlmdCgpITtcbiAgICAgIHNvcnRlZE5vZGVBcnJheS5wdXNoKG5vdyk7XG4gICAgICBjb25zdCBub3dJZHggPSBzaGFkZXJOb2Rlcy5pbmRleE9mKG5vdyk7XG4gICAgICBmb3IgKGNvbnN0IG91dHB1dE5vZGUgb2Ygb3V0cHV0Tm9kZXNbbm93SWR4XSkge1xuICAgICAgICBpbnB1dE51bUFycmF5W3NoYWRlck5vZGVzLmluZGV4T2Yob3V0cHV0Tm9kZSldLS07XG4gICAgICAgIGlmIChpbnB1dE51bUFycmF5W3NoYWRlck5vZGVzLmluZGV4T2Yob3V0cHV0Tm9kZSldID09PSAwKSB7XG4gICAgICAgICAgcXVldWUucHVzaChvdXRwdXROb2RlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzb3J0ZWROb2RlQXJyYXkubGVuZ3RoICE9PSBzaGFkZXJOb2Rlcy5sZW5ndGgpIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdncmFwaCBpcyBjeWNsaWMnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc29ydGVkTm9kZUFycmF5O1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBmdW5jdGlvbiBkZWZpbml0aW9ucyBmb3IgYWxsIHVuaXF1ZSBzaGFkZXIgbm9kZXMuXG4gICAqIENvbGxlY3RzIHNoYWRlciBmdW5jdGlvbiBjb2RlIGZyb20gZWFjaCBub2RlIHR5cGUgYW5kIHJlbW92ZXMgZHVwbGljYXRlc1xuICAgKiB0byBjcmVhdGUgdGhlIGZ1bmN0aW9uIGRlZmluaXRpb24gc2VjdGlvbiBvZiB0aGUgc2hhZGVyLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gc2hhZGVyTm9kZXMgLSBBcnJheSBvZiBzaGFkZXIgbm9kZXMgdG8gZ2VuZXJhdGUgZnVuY3Rpb25zIGZvclxuICAgKiBAcGFyYW0gc2hhZGVyVHlwZSAtIFR5cGUgb2Ygc2hhZGVyICh2ZXJ0ZXggb3IgZnJhZ21lbnQpIGJlaW5nIGdlbmVyYXRlZFxuICAgKiBAcmV0dXJucyBTdHJpbmcgY29udGFpbmluZyBhbGwgZnVuY3Rpb24gZGVmaW5pdGlvbnNcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0RnVuY3Rpb25EZWZpbml0aW9uKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHNoYWRlck5vZGVzOiBBYnN0cmFjdFNoYWRlck5vZGVbXSxcbiAgICBzaGFkZXJUeXBlOiBTaGFkZXJUeXBlRW51bSxcbiAgICBlbWJlZGRlZFNoYWRlckZ1bmN0aW9uTmFtZXM/OiBSZWFkb25seVNldDxzdHJpbmc+XG4gICkge1xuICAgIGxldCBzaGFkZXJUZXh0ID0gJyc7XG4gICAgY29uc3QgZXhpc3RWZXJ0ZXhGdW5jdGlvbnM6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaGFkZXJOb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbWF0ZXJpYWxOb2RlID0gc2hhZGVyTm9kZXNbaV07XG4gICAgICBpZiAoZXhpc3RWZXJ0ZXhGdW5jdGlvbnMuaW5kZXhPZihtYXRlcmlhbE5vZGUuc2hhZGVyRnVuY3Rpb25OYW1lKSAhPT0gLTEpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBleGlzdFZlcnRleEZ1bmN0aW9ucy5wdXNoKG1hdGVyaWFsTm9kZS5zaGFkZXJGdW5jdGlvbk5hbWUpO1xuICAgICAgLy8gRnVuY3Rpb25zIHRoZSBzaGFkZXIgcGFydCBhbHJlYWR5IGVtYmVkcyBpbiBpdHMgcHJlcmVxdWlzaXRlcyBtdXN0IG5vdCBiZVxuICAgICAgLy8gZGVmaW5lZCBhZ2FpbiBieSB0aGUgZ3JhcGggbm9kZXMgKGUuZy4gdGhlIHJheW1hcmNoaW5nIFBCUiBzaGFkZXIpLlxuICAgICAgaWYgKGVtYmVkZGVkU2hhZGVyRnVuY3Rpb25OYW1lcz8uaGFzKG1hdGVyaWFsTm9kZS5zaGFkZXJGdW5jdGlvbk5hbWUpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgc2hhZGVyVGV4dCArPSBtYXRlcmlhbE5vZGUuZ2V0U2hhZGVyQ29kZShlbmdpbmUsIHNoYWRlclR5cGUpO1xuICAgIH1cblxuICAgIHJldHVybiBzaGFkZXJUZXh0O1xuICB9XG5cbiAgLyoqXG4gICAqIERlZmluZXMgdmFyeWluZyB2YXJpYWJsZXMgZm9yIHZlcnRleC10by1mcmFnbWVudCBjb21tdW5pY2F0aW9uLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19kZWZpbmVWYXJ5aW5nVmFyaWFibGVzKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHNoYWRlck5vZGVzOiBBYnN0cmFjdFNoYWRlck5vZGVbXSxcbiAgICBpc1ZlcnRleFN0YWdlOiBib29sZWFuXG4gICk6IHN0cmluZyB7XG4gICAgbGV0IHNoYWRlckJvZHkgPSAnJztcbiAgICBjb25zdCBkZWZpbmVkVmFyeWluZ3M6IFNldDxzdHJpbmc+ID0gbmV3IFNldCgpO1xuXG4gICAgaWYgKGVuZ2luZS5lbmdpbmVTdGF0ZS5jdXJyZW50UHJvY2Vzc0FwcHJvYWNoICE9PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNoYWRlck5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHNoYWRlck5vZGUgPSBzaGFkZXJOb2Rlc1tpXTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBzaGFkZXJOb2RlLmlucHV0Q29ubmVjdGlvbnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBjb25zdCBpbnB1dENvbm5lY3Rpb24gPSBzaGFkZXJOb2RlLmlucHV0Q29ubmVjdGlvbnNbal07XG4gICAgICAgICAgaWYgKGlucHV0Q29ubmVjdGlvbiA9PSBudWxsKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgaW5wdXQgPSBzaGFkZXJOb2RlLmdldElucHV0cygpW2pdO1xuICAgICAgICAgIGNvbnN0IGlucHV0Tm9kZSA9IEFic3RyYWN0U2hhZGVyTm9kZS5nZXRTaGFkZXJOb2RlQnlVaWQoaW5wdXRDb25uZWN0aW9uLnNoYWRlck5vZGVVaWQpO1xuICAgICAgICAgIGlmIChpbnB1dE5vZGUuZ2V0U2hhZGVyU3RhZ2UoKSA9PT0gJ1ZlcnRleCcgJiYgc2hhZGVyTm9kZS5nZXRTaGFkZXJTdGFnZSgpID09PSAnRnJhZ21lbnQnKSB7XG4gICAgICAgICAgICBjb25zdCB2YXJ5aW5nTmFtZSA9IGB2XyR7aW5wdXROb2RlLnNoYWRlckZ1bmN0aW9uTmFtZX1fJHtpbnB1dE5vZGUuc2hhZGVyTm9kZVVpZH1fJHtpbnB1dENvbm5lY3Rpb24ub3V0cHV0TmFtZU9mUHJldn1gO1xuICAgICAgICAgICAgaWYgKGRlZmluZWRWYXJ5aW5ncy5oYXModmFyeWluZ05hbWUpKSB7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmaW5lZFZhcnlpbmdzLmFkZCh2YXJ5aW5nTmFtZSk7XG4gICAgICAgICAgICBjb25zdCB0eXBlID0gaW5wdXQuY29tcG9zaXRpb25UeXBlLmdldEdsc2xTdHIoaW5wdXQuY29tcG9uZW50VHlwZSk7XG4gICAgICAgICAgICAvLyBJbnRlZ2VyIGFuZCBib29sZWFuIHR5cGVzIHJlcXVpcmUgZmxhdCBpbnRlcnBvbGF0aW9uIGluIEdMU0wgRVMgMy4wXG4gICAgICAgICAgICBjb25zdCBuZWVkc0ZsYXQgPVxuICAgICAgICAgICAgICBpbnB1dC5jb21wb25lbnRUeXBlLmlzSW50ZWdlcigpIHx8XG4gICAgICAgICAgICAgIGlucHV0LmNvbXBvbmVudFR5cGUuaXNVbnNpZ25lZEludGVnZXIoKSB8fFxuICAgICAgICAgICAgICBpbnB1dC5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkJvb2w7XG4gICAgICAgICAgICBjb25zdCBmbGF0TW9kaWZpZXIgPSBuZWVkc0ZsYXQgPyAnZmxhdCAnIDogJyc7XG4gICAgICAgICAgICBzaGFkZXJCb2R5ICs9IGAke2ZsYXRNb2RpZmllcn0ke2lzVmVydGV4U3RhZ2UgPyAnb3V0JyA6ICdpbid9ICR7dHlwZX0gJHt2YXJ5aW5nTmFtZX07XFxuYDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2hhZGVyQm9keTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb2xsZWN0cyBpbnB1dCBhbmQgb3V0cHV0IHZhcmlhYmxlIG5hbWVzIGZvciBzaGFkZXIgbm9kZXMuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2NvbGxlY3RWYXJpYWJsZU5hbWVzKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHNoYWRlck5vZGVzOiBBYnN0cmFjdFNoYWRlck5vZGVbXSxcbiAgICBpc1ZlcnRleFN0YWdlOiBib29sZWFuLFxuICAgIGNvbW1vblNoYWRlclBhcnQ6IENvbW1vblNoYWRlclBhcnRcbiAgKToge1xuICAgIHZhcklucHV0TmFtZXM6IEFycmF5PEFycmF5PHN0cmluZz4+O1xuICAgIHZhck91dHB1dE5hbWVzOiBBcnJheTxBcnJheTxzdHJpbmc+PjtcbiAgICBjb2xsZWN0ZWRTaGFkZXJCb2R5OiBzdHJpbmc7XG4gIH0ge1xuICAgIGNvbnN0IHZhcklucHV0TmFtZXM6IEFycmF5PEFycmF5PHN0cmluZz4+ID0gW107XG4gICAgY29uc3QgdmFyT3V0cHV0TmFtZXM6IEFycmF5PEFycmF5PHN0cmluZz4+ID0gW107XG4gICAgbGV0IGNvbGxlY3RlZFNoYWRlckJvZHkgPSAnJztcblxuICAgIGNvbnN0IGV4aXN0aW5nSW5wdXRzOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQoKTtcbiAgICBjb25zdCBleGlzdGluZ091dHB1dHM6IFNldDxzdHJpbmc+ID0gbmV3IFNldCgpO1xuICAgIC8vIEtleSBmb3JtYXQ6IFwiJHtzaGFkZXJOb2RlVWlkfV8ke291dHB1dE5hbWV9XCIgdG8gdHJhY2sgZWFjaCBvdXRwdXQgc2VwYXJhdGVseVxuICAgIGNvbnN0IGV4aXN0aW5nT3V0cHV0c1Zhck5hbWU6IE1hcDxzdHJpbmcsIHN0cmluZz4gPSBuZXcgTWFwKCk7XG5cbiAgICAvLyBQcmUtaW5pdGlhbGl6ZSBhcnJheXMgZm9yIGFsbCBub2RlcyB0byBhdm9pZCB1bmRlZmluZWQgYWNjZXNzXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaGFkZXJOb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFySW5wdXROYW1lc1tpXSA9IFtdO1xuICAgICAgdmFyT3V0cHV0TmFtZXNbaV0gPSBbXTtcbiAgICB9XG5cbiAgICAvLyBGaXJzdCBwYXNzOiBjb2xsZWN0IGFsbCBvdXRwdXQgdmFyaWFibGUgbmFtZXNcbiAgICAvLyBUaGlzIGVuc3VyZXMgZXhpc3RpbmdPdXRwdXRzVmFyTmFtZSBpcyBmdWxseSBwb3B1bGF0ZWQgYmVmb3JlIGlucHV0IHByb2Nlc3NpbmdcbiAgICAvLyBGaXhlcyB0aW1pbmcgaXNzdWUgd2hlcmUgYSBjb25zdW1lciBub2RlIGlzIHByb2Nlc3NlZCBiZWZvcmUgaXRzIHByb2R1Y2VyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaGFkZXJOb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5fX2NvbGxlY3RPdXRwdXRzRm9yTm9kZShpLCBzaGFkZXJOb2RlcywgdmFyT3V0cHV0TmFtZXMsIGV4aXN0aW5nT3V0cHV0cywgZXhpc3RpbmdPdXRwdXRzVmFyTmFtZSk7XG4gICAgfVxuXG4gICAgLy8gU2Vjb25kIHBhc3M6IHByb2Nlc3MgYWxsIGlucHV0IGNvbm5lY3Rpb25zIHVzaW5nIHRoZSBjb2xsZWN0ZWQgb3V0cHV0IHZhcmlhYmxlIG5hbWVzXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaGFkZXJOb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29sbGVjdGVkU2hhZGVyQm9keSArPSB0aGlzLl9fY29sbGVjdElucHV0c0Zvck5vZGUoXG4gICAgICAgIGVuZ2luZSxcbiAgICAgICAgaSxcbiAgICAgICAgc2hhZGVyTm9kZXMsXG4gICAgICAgIHZhcklucHV0TmFtZXMsXG4gICAgICAgIHZhck91dHB1dE5hbWVzLFxuICAgICAgICBleGlzdGluZ0lucHV0cyxcbiAgICAgICAgZXhpc3RpbmdPdXRwdXRzVmFyTmFtZSxcbiAgICAgICAgaXNWZXJ0ZXhTdGFnZSxcbiAgICAgICAgY29tbW9uU2hhZGVyUGFydFxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4geyB2YXJJbnB1dE5hbWVzLCB2YXJPdXRwdXROYW1lcywgY29sbGVjdGVkU2hhZGVyQm9keSB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbGxlY3RzIGlucHV0IHZhcmlhYmxlcyBmb3IgYSBzcGVjaWZpYyBub2RlLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19jb2xsZWN0SW5wdXRzRm9yTm9kZShcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBub2RlSW5kZXg6IG51bWJlcixcbiAgICBzaGFkZXJOb2RlczogQWJzdHJhY3RTaGFkZXJOb2RlW10sXG4gICAgdmFySW5wdXROYW1lczogQXJyYXk8QXJyYXk8c3RyaW5nPj4sXG4gICAgdmFyT3V0cHV0TmFtZXM6IEFycmF5PEFycmF5PHN0cmluZz4+LFxuICAgIGV4aXN0aW5nSW5wdXRzOiBTZXQ8c3RyaW5nPixcbiAgICBleGlzdGluZ091dHB1dHNWYXJOYW1lOiBNYXA8c3RyaW5nLCBzdHJpbmc+LFxuICAgIGlzVmVydGV4U3RhZ2U6IGJvb2xlYW4sXG4gICAgY29tbW9uU2hhZGVyUGFydDogQ29tbW9uU2hhZGVyUGFydFxuICApOiBzdHJpbmcge1xuICAgIGNvbnN0IHNoYWRlck5vZGUgPSBzaGFkZXJOb2Rlc1tub2RlSW5kZXhdO1xuXG4gICAgaWYgKHZhcklucHV0TmFtZXNbbm9kZUluZGV4XSA9PSBudWxsKSB7XG4gICAgICB2YXJJbnB1dE5hbWVzW25vZGVJbmRleF0gPSBbXTtcbiAgICB9XG4gICAgaWYgKG5vZGVJbmRleCAtIDEgPj0gMCAmJiB2YXJPdXRwdXROYW1lc1tub2RlSW5kZXggLSAxXSA9PSBudWxsKSB7XG4gICAgICB2YXJPdXRwdXROYW1lc1tub2RlSW5kZXggLSAxXSA9IFtdO1xuICAgIH1cblxuICAgIGNvbnN0IGlucHV0Q29ubmVjdGlvbnMgPSBzaGFkZXJOb2RlLmlucHV0Q29ubmVjdGlvbnM7XG4gICAgbGV0IHNoYWRlckJvZHkgPSAnJztcblxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgc2hhZGVyTm9kZS5nZXRJbnB1dHMoKS5sZW5ndGg7IGorKykge1xuICAgICAgY29uc3QgaW5wdXRDb25uZWN0aW9uID0gaW5wdXRDb25uZWN0aW9uc1tqXTtcbiAgICAgIGlmIChpbnB1dENvbm5lY3Rpb24gPT0gbnVsbCkge1xuICAgICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSB0aGlzLl9fZ2V0RGVmYXVsdElucHV0VmFsdWUoZW5naW5lLCBzaGFkZXJOb2RlLCBqKTtcbiAgICAgICAgaWYgKGRlZmF1bHRWYWx1ZSkge1xuICAgICAgICAgIHZhcklucHV0TmFtZXNbbm9kZUluZGV4XS5wdXNoKGRlZmF1bHRWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHsgdmFyTmFtZSwgcm93U3RyIH0gPSB0aGlzLl9fcHJvY2Vzc0lucHV0Q29ubmVjdGlvbihcbiAgICAgICAgZW5naW5lLFxuICAgICAgICBpbnB1dENvbm5lY3Rpb24sXG4gICAgICAgIHNoYWRlck5vZGUsXG4gICAgICAgIGlzVmVydGV4U3RhZ2UsXG4gICAgICAgIGV4aXN0aW5nSW5wdXRzLFxuICAgICAgICBjb21tb25TaGFkZXJQYXJ0XG4gICAgICApO1xuXG4gICAgICAvLyBVc2Ugb3V0cHV0TmFtZU9mUHJldiB0byBnZXQgdGhlIGNvcnJlY3QgdmFyaWFibGUgbmFtZSBmb3IgdGhpcyBzcGVjaWZpYyBvdXRwdXRcbiAgICAgIGNvbnN0IG91dHB1dEtleSA9IGAke2lucHV0Q29ubmVjdGlvbi5zaGFkZXJOb2RlVWlkfV8ke2lucHV0Q29ubmVjdGlvbi5vdXRwdXROYW1lT2ZQcmV2fWA7XG4gICAgICBjb25zdCBleGlzdFZhck5hbWUgPSBleGlzdGluZ091dHB1dHNWYXJOYW1lLmdldChvdXRwdXRLZXkpO1xuXG4gICAgICAvLyBXaGVuIGEgRnJhZ21lbnQtc3RhZ2Ugbm9kZSBjb25zdW1lcyBmcm9tIGEgVmVydGV4LXN0YWdlIG5vZGUsIGFsd2F5cyB1c2UgdGhlXG4gICAgICAvLyBjdXJyZW50IHZhck5hbWUgKHdoaWNoIGhhcyB0aGUgdmFyeWluZyByZWFkKSBpbnN0ZWFkIG9mIHJldXNpbmcgZXhpc3RWYXJOYW1lXG4gICAgICAvLyAod2hpY2ggbWF5IGhhdmUgYmVlbiBzZXQgYnkgYSBWZXJ0ZXgtc3RhZ2UgY29uc3VtZXIgd2l0aG91dCB2YXJ5aW5nIHJlYWQpLlxuICAgICAgY29uc3QgaW5wdXROb2RlID0gQWJzdHJhY3RTaGFkZXJOb2RlLl9zaGFkZXJOb2Rlc1tpbnB1dENvbm5lY3Rpb24uc2hhZGVyTm9kZVVpZF07XG4gICAgICBjb25zdCBpc0ZyYWdtZW50Q29uc3VtaW5nVmVydGV4ID1cbiAgICAgICAgIWlzVmVydGV4U3RhZ2UgJiYgaW5wdXROb2RlLmdldFNoYWRlclN0YWdlKCkgPT09ICdWZXJ0ZXgnICYmIHNoYWRlck5vZGUuZ2V0U2hhZGVyU3RhZ2UoKSA9PT0gJ0ZyYWdtZW50JztcbiAgICAgIGNvbnN0IHVzZWRWYXJOYW1lID0gaXNGcmFnbWVudENvbnN1bWluZ1ZlcnRleCA/IHZhck5hbWUgOiBleGlzdFZhck5hbWUgfHwgdmFyTmFtZTtcblxuICAgICAgLy8gT25seSBhZGQgZGVjbGFyYXRpb24gdG8gc2hhZGVyQm9keSBpZiB3ZSdyZSB1c2luZyB2YXJOYW1lIChub3QgYW4gZXhpc3RpbmcgdmFyaWFibGUpXG4gICAgICAvLyBUaGlzIHByZXZlbnRzIGRlY2xhcmluZyB1bnVzZWQgdmFyaWFibGVzIHdoZW4gcmV1c2luZyBhbiBleGlzdGluZyB2YXJpYWJsZVxuICAgICAgaWYgKHVzZWRWYXJOYW1lID09PSB2YXJOYW1lKSB7XG4gICAgICAgIHNoYWRlckJvZHkgKz0gcm93U3RyO1xuICAgICAgfVxuICAgICAgdmFySW5wdXROYW1lc1tub2RlSW5kZXhdLnB1c2godXNlZFZhck5hbWUpO1xuICAgIH1cblxuICAgIHJldHVybiBzaGFkZXJCb2R5O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgZGVmYXVsdFZhbHVlIGlzIGEgc3RydWN0IHR5cGUgKFJlY29yZDxzdHJpbmcsIFZhbHVlVHlwZXM+KSByYXRoZXIgdGhhbiBhIHByaW1pdGl2ZSBWYWx1ZVR5cGVzLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19pc1N0cnVjdERlZmF1bHRWYWx1ZShkZWZhdWx0VmFsdWU6IFNvY2tldERlZmF1bHRWYWx1ZSk6IGRlZmF1bHRWYWx1ZSBpcyBSZWNvcmQ8c3RyaW5nLCBWYWx1ZVR5cGVzPiB7XG4gICAgLy8gVmFsdWVUeXBlcyAoVmVjdG9yLCBTY2FsYXIsIE1hdHJpeCkgaGF2ZSBhIF92IHByb3BlcnR5IHdoaWNoIGlzIGEgVHlwZWRBcnJheVxuICAgIC8vIFN0cnVjdCBkZWZhdWx0IHZhbHVlcyBhcmUgcGxhaW4gb2JqZWN0cyB3aXRoIHN0cmluZyBrZXlzIGFuZCBWYWx1ZVR5cGVzIHZhbHVlc1xuICAgIGlmICh0eXBlb2YgZGVmYXVsdFZhbHVlICE9PSAnb2JqZWN0JyB8fCBkZWZhdWx0VmFsdWUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgaWYgaXQncyBhIFZhbHVlVHlwZXMgYnkgbG9va2luZyBmb3IgdGhlIF92IHByb3BlcnR5IChUeXBlZEFycmF5KVxuICAgIGlmICgnX3YnIGluIGRlZmF1bHRWYWx1ZSAmJiBBcnJheUJ1ZmZlci5pc1ZpZXcoKGRlZmF1bHRWYWx1ZSBhcyBWYWx1ZVR5cGVzKS5fdikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc3RydWN0IG5hbWUgZnJvbSB0aGUgY29tcG9zaXRpb25UeXBlJ3MgZ2xzbFN0ciBwcm9wZXJ0eS5cbiAgICogSWYgdGhlIGdsc2xTdHIgc3RhcnRzIHdpdGggJ3N0cnVjdCAnLCBleHRyYWN0cyBhbmQgcmV0dXJucyB0aGUgc3RydWN0IG5hbWUuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldFN0cnVjdE5hbWUoY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGVFbnVtKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICAvLyBVc2UgQ29tcG9uZW50VHlwZS5GbG9hdCB0byBnZXQgdGhlIHJhdyBnbHNsU3RyIChDb21wb25lbnRUeXBlLlVua25vd24gcmV0dXJucyAndW5rbm93bicpXG4gICAgY29uc3QgZ2xzbFN0ciA9IGNvbXBvc2l0aW9uVHlwZS5nZXRHbHNsU3RyKENvbXBvbmVudFR5cGUuVW5rbm93bik7XG4gICAgaWYgKGdsc2xTdHIuc3RhcnRzV2l0aCgnc3RydWN0ICcpKSB7XG4gICAgICByZXR1cm4gZ2xzbFN0ci5yZXBsYWNlKCdzdHJ1Y3QgJywgJycpO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIHNoYWRlciBpbml0aWFsaXphdGlvbiBzdHJpbmcgZm9yIGEgc3RydWN0IHR5cGUgZGVmYXVsdCB2YWx1ZS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0U3RydWN0RGVmYXVsdFZhbHVlU3RyaW5nKFxuICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlRW51bSxcbiAgICBkZWZhdWx0VmFsdWU6IFJlY29yZDxzdHJpbmcsIFZhbHVlVHlwZXM+LFxuICAgIGlzV2ViR1BVOiBib29sZWFuXG4gICk6IHN0cmluZyB7XG4gICAgLy8gR2V0IHRoZSBzdHJ1Y3QgdHlwZSBuYW1lIGZyb20gdGhlIGNvbXBvc2l0aW9uVHlwZSdzIGdsc2xTdHJcbiAgICBjb25zdCBzdHJ1Y3ROYW1lID0gdGhpcy5fX2dldFN0cnVjdE5hbWUoY29tcG9zaXRpb25UeXBlKSA/PyAnJztcblxuICAgIC8vIEJ1aWxkIHRoZSBtZW1iZXIgaW5pdGlhbGl6YXRpb24gdmFsdWVzIGluIHRoZSBvcmRlciB0aGV5IGFwcGVhciBpbiB0aGUgZGVmYXVsdCB2YWx1ZSBvYmplY3RcbiAgICBjb25zdCBtZW1iZXJWYWx1ZXM6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChjb25zdCBbX2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKGRlZmF1bHRWYWx1ZSkpIHtcbiAgICAgIGlmIChpc1dlYkdQVSkge1xuICAgICAgICBtZW1iZXJWYWx1ZXMucHVzaCh2YWx1ZS53Z3NsU3RyQXNGbG9hdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZW1iZXJWYWx1ZXMucHVzaCh2YWx1ZS5nbHNsU3RyQXNGbG9hdCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gR2VuZXJhdGUgc3RydWN0IGluaXRpYWxpemF0aW9uOiBTdHJ1Y3ROYW1lKG1lbWJlcjEsIG1lbWJlcjIsIC4uLilcbiAgICByZXR1cm4gYCR7c3RydWN0TmFtZX0oJHttZW1iZXJWYWx1ZXMuam9pbignLCAnKX0pYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGRlZmF1bHQgdmFsdWUgZm9yIGFuIGlucHV0IHNvY2tldC5cbiAgICogSWYgdGhlIHNvY2tldCBoYXMgYSBkZWZhdWx0VmFsdWUgZGVmaW5lZCwgaXQgd2lsbCBiZSB1c2VkLlxuICAgKiBPdGhlcndpc2UsIGEgemVybyB2YWx1ZSBiYXNlZCBvbiB0aGUgc29ja2V0J3MgY29tcG9zaXRpb25UeXBlIGFuZCBjb21wb25lbnRUeXBlIHdpbGwgYmUgZ2VuZXJhdGVkLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXREZWZhdWx0SW5wdXRWYWx1ZShlbmdpbmU6IEVuZ2luZSwgc2hhZGVyTm9kZTogQWJzdHJhY3RTaGFkZXJOb2RlLCBpbnB1dEluZGV4OiBudW1iZXIpOiBzdHJpbmcge1xuICAgIGNvbnN0IGlucHV0U29ja2V0ID0gc2hhZGVyTm9kZS5nZXRJbnB1dHMoKVtpbnB1dEluZGV4XTtcbiAgICBjb25zdCBpc1dlYkdQVSA9IGVuZ2luZS5lbmdpbmVTdGF0ZS5jdXJyZW50UHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVO1xuICAgIGNvbnN0IGlzQm9vbCA9IGlucHV0U29ja2V0LmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuQm9vbDtcbiAgICBjb25zdCBpc0ludCA9XG4gICAgICBpbnB1dFNvY2tldC5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkludCB8fCBpbnB1dFNvY2tldC5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLlVuc2lnbmVkSW50O1xuXG4gICAgLy8gSWYgZGVmYXVsdFZhbHVlIGlzIHNldCwgdXNlIGl0XG4gICAgaWYgKGlucHV0U29ja2V0LmRlZmF1bHRWYWx1ZSAhPSBudWxsKSB7XG4gICAgICAvLyBDaGVjayBpZiBkZWZhdWx0VmFsdWUgaXMgYSBzdHJ1Y3QgdHlwZSAoUmVjb3JkPHN0cmluZywgVmFsdWVUeXBlcz4pXG4gICAgICBpZiAodGhpcy5fX2lzU3RydWN0RGVmYXVsdFZhbHVlKGlucHV0U29ja2V0LmRlZmF1bHRWYWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19nZXRTdHJ1Y3REZWZhdWx0VmFsdWVTdHJpbmcoaW5wdXRTb2NrZXQuY29tcG9zaXRpb25UeXBlLCBpbnB1dFNvY2tldC5kZWZhdWx0VmFsdWUsIGlzV2ViR1BVKTtcbiAgICAgIH1cblxuICAgICAgLy8gSGFuZGxlIHByaW1pdGl2ZSBWYWx1ZVR5cGVzXG4gICAgICBjb25zdCBwcmltaXRpdmVWYWx1ZSA9IGlucHV0U29ja2V0LmRlZmF1bHRWYWx1ZSBhcyBWYWx1ZVR5cGVzO1xuICAgICAgaWYgKGlzQm9vbCkge1xuICAgICAgICByZXR1cm4gcHJpbWl0aXZlVmFsdWUuX3ZbMF0gPiAwLjUgPyAndHJ1ZScgOiAnZmFsc2UnO1xuICAgICAgfVxuICAgICAgaWYgKGlucHV0U29ja2V0LmNvbXBvbmVudFR5cGUgPT09IENvbXBvbmVudFR5cGUuVW5zaWduZWRJbnQpIHtcbiAgICAgICAgcmV0dXJuIGlzV2ViR1BVID8gcHJpbWl0aXZlVmFsdWUud2dzbFN0ckFzVWludCA6IHByaW1pdGl2ZVZhbHVlLmdsc2xTdHJBc1VpbnQ7XG4gICAgICB9XG4gICAgICBpZiAoaXNJbnQpIHtcbiAgICAgICAgcmV0dXJuIGlzV2ViR1BVID8gcHJpbWl0aXZlVmFsdWUud2dzbFN0ckFzSW50IDogcHJpbWl0aXZlVmFsdWUuZ2xzbFN0ckFzSW50O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGlzV2ViR1BVID8gcHJpbWl0aXZlVmFsdWUud2dzbFN0ckFzRmxvYXQgOiBwcmltaXRpdmVWYWx1ZS5nbHNsU3RyQXNGbG9hdDtcbiAgICB9XG5cbiAgICAvLyBJZiBkZWZhdWx0VmFsdWUgaXMgbm90IHNldCwgZ2VuZXJhdGUgemVybyB2YWx1ZSBiYXNlZCBvbiBjb21wb3NpdGlvblR5cGUgYW5kIGNvbXBvbmVudFR5cGVcbiAgICByZXR1cm4gaXNXZWJHUFVcbiAgICAgID8gaW5wdXRTb2NrZXQuY29tcG9zaXRpb25UeXBlLmdldFdnc2xJbml0aWFsVmFsdWUoaW5wdXRTb2NrZXQuY29tcG9uZW50VHlwZSlcbiAgICAgIDogaW5wdXRTb2NrZXQuY29tcG9zaXRpb25UeXBlLmdldEdsc2xJbml0aWFsVmFsdWUoaW5wdXRTb2NrZXQuY29tcG9uZW50VHlwZSk7XG4gIH1cblxuICAvKipcbiAgICogUHJvY2Vzc2VzIGFuIGlucHV0IGNvbm5lY3Rpb24gYW5kIHJldHVybnMgdmFyaWFibGUgbmFtZSBhbmQgc2hhZGVyIHN0YXRlbWVudC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fcHJvY2Vzc0lucHV0Q29ubmVjdGlvbihcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBpbnB1dENvbm5lY3Rpb246IGFueSxcbiAgICBzaGFkZXJOb2RlOiBBYnN0cmFjdFNoYWRlck5vZGUsXG4gICAgaXNWZXJ0ZXhTdGFnZTogYm9vbGVhbixcbiAgICBleGlzdGluZ0lucHV0czogU2V0PHN0cmluZz4sXG4gICAgY29tbW9uU2hhZGVyUGFydDogQ29tbW9uU2hhZGVyUGFydFxuICApOiB7IHZhck5hbWU6IHN0cmluZzsgcm93U3RyOiBzdHJpbmcgfSB7XG4gICAgY29uc3QgaW5wdXROb2RlID0gQWJzdHJhY3RTaGFkZXJOb2RlLl9zaGFkZXJOb2Rlc1tpbnB1dENvbm5lY3Rpb24uc2hhZGVyTm9kZVVpZF07XG4gICAgY29uc3Qgb3V0cHV0U29ja2V0T2ZQcmV2ID0gaW5wdXROb2RlLmdldE91dHB1dChpbnB1dENvbm5lY3Rpb24ub3V0cHV0TmFtZU9mUHJldik7XG4gICAgY29uc3QgaW5wdXRTb2NrZXRPZlRoaXMgPSBzaGFkZXJOb2RlLmdldElucHV0KGlucHV0Q29ubmVjdGlvbi5pbnB1dE5hbWVPZlRoaXMpO1xuICAgIGNvbnN0IHZhck5hbWUgPSBgJHtvdXRwdXRTb2NrZXRPZlByZXYhLm5hbWV9XyR7aW5wdXRDb25uZWN0aW9uLnNoYWRlck5vZGVVaWR9X3RvXyR7c2hhZGVyTm9kZS5zaGFkZXJOb2RlVWlkfWA7XG5cbiAgICBsZXQgcm93U3RyID0gJyc7XG4gICAgLy8gV2hlbiBhIEZyYWdtZW50LXN0YWdlIG5vZGUgY29uc3VtZXMgZnJvbSBhIFZlcnRleC1zdGFnZSBub2RlLCB1c2UgYSB1bmlxdWUga2V5XG4gICAgLy8gdG8gYXZvaWQgY29uZmxpY3RzIHdpdGggVmVydGV4LXN0YWdlIG5vZGVzIHRoYXQgYWxzbyBjb25zdW1lIHRoZSBzYW1lIG91dHB1dC5cbiAgICAvLyBJbmNsdWRlIHRoZSBjb25zdW1lciBub2RlJ3MgVUlEIHRvIGVuc3VyZSBlYWNoIEZyYWdtZW50LXN0YWdlIGNvbnN1bWVyIGdldHMgaXRzIG93biB2YXJ5aW5nIHJlYWQuXG4gICAgY29uc3QgaXNGcmFnbWVudENvbnN1bWluZ1ZlcnRleCA9XG4gICAgICAhaXNWZXJ0ZXhTdGFnZSAmJiBpbnB1dE5vZGUuZ2V0U2hhZGVyU3RhZ2UoKSA9PT0gJ1ZlcnRleCcgJiYgc2hhZGVyTm9kZS5nZXRTaGFkZXJTdGFnZSgpID09PSAnRnJhZ21lbnQnO1xuICAgIGNvbnN0IGJhc2VJbnB1dEtleSA9IGAke2lucHV0Tm9kZS5zaGFkZXJOb2RlVWlkfV8ke2lucHV0Q29ubmVjdGlvbi5vdXRwdXROYW1lT2ZQcmV2fWA7XG4gICAgY29uc3QgaW5wdXRLZXkgPSBpc0ZyYWdtZW50Q29uc3VtaW5nVmVydGV4XG4gICAgICA/IGAke2Jhc2VJbnB1dEtleX1fdG9GcmFnbWVudF8ke3NoYWRlck5vZGUuc2hhZGVyTm9kZVVpZH1gXG4gICAgICA6IGJhc2VJbnB1dEtleTtcblxuICAgIGlmICghZXhpc3RpbmdJbnB1dHMuaGFzKGlucHV0S2V5KSkge1xuICAgICAgcm93U3RyID0gY29tbW9uU2hhZGVyUGFydC5nZXRBc3NpZ25tZW50U3RhdGVtZW50KGVuZ2luZSwgdmFyTmFtZSwgaW5wdXRTb2NrZXRPZlRoaXMhKTtcbiAgICAgIGlmIChpc0ZyYWdtZW50Q29uc3VtaW5nVmVydGV4KSB7XG4gICAgICAgIHJvd1N0ciA9IGNvbW1vblNoYWRlclBhcnQuZ2V0QXNzaWdubWVudFZhcnlpbmdTdGF0ZW1lbnRJblBpeGVsU2hhZGVyKFxuICAgICAgICAgIGVuZ2luZSxcbiAgICAgICAgICB2YXJOYW1lLFxuICAgICAgICAgIGlucHV0U29ja2V0T2ZUaGlzISxcbiAgICAgICAgICBpbnB1dE5vZGUsXG4gICAgICAgICAgaW5wdXRDb25uZWN0aW9uLm91dHB1dE5hbWVPZlByZXZcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGV4aXN0aW5nSW5wdXRzLmFkZChpbnB1dEtleSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgdmFyTmFtZSwgcm93U3RyIH07XG4gIH1cblxuICAvKipcbiAgICogQ29sbGVjdHMgb3V0cHV0IHZhcmlhYmxlcyBmb3IgYSBzcGVjaWZpYyBub2RlLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19jb2xsZWN0T3V0cHV0c0Zvck5vZGUoXG4gICAgbm9kZUluZGV4OiBudW1iZXIsXG4gICAgc2hhZGVyTm9kZXM6IEFic3RyYWN0U2hhZGVyTm9kZVtdLFxuICAgIHZhck91dHB1dE5hbWVzOiBBcnJheTxBcnJheTxzdHJpbmc+PixcbiAgICBleGlzdGluZ091dHB1dHM6IFNldDxzdHJpbmc+LFxuICAgIGV4aXN0aW5nT3V0cHV0c1Zhck5hbWU6IE1hcDxzdHJpbmcsIHN0cmluZz5cbiAgKTogdm9pZCB7XG4gICAgY29uc3QgcHJldlNoYWRlck5vZGUgPSBzaGFkZXJOb2Rlc1tub2RlSW5kZXggLSAxXTtcbiAgICBpZiAoIXByZXZTaGFkZXJOb2RlKSByZXR1cm47XG5cbiAgICAvLyBDaGVjayBBTEwgbm9kZXMgZm9yIGNvbm5lY3Rpb25zIGZyb20gcHJldlNoYWRlck5vZGUsIG5vdCBqdXN0IHRob3NlIGF0IG5vZGVJbmRleCBvciBsYXRlci5cbiAgICAvLyBUaGlzIGZpeGVzIHRoZSBpc3N1ZSB3aGVyZSBhIGNvbnN1bWVyIG5vZGUgY29tZXMgYmVmb3JlIHRoZSBwcm9kdWNlciBpbiB0b3BvbG9naWNhbCBzb3J0XG4gICAgLy8gKGUuZy4sIHdoZW4gYSBOZXV0cmFsLXN0YWdlIG5vZGUgcmVzb2x2ZWQgdG8gVmVydGV4IGNvbnN1bWVzIGZyb20gYSBWZXJ0ZXgtc3RhZ2Ugbm9kZSkuXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBzaGFkZXJOb2Rlcy5sZW5ndGg7IGorKykge1xuICAgICAgY29uc3QgdGFyZ2V0U2hhZGVyTm9kZSA9IHNoYWRlck5vZGVzW2pdO1xuICAgICAgY29uc3QgdGFyZ2V0Tm9kZUlucHV0Q29ubmVjdGlvbnMgPSB0YXJnZXRTaGFkZXJOb2RlLmlucHV0Q29ubmVjdGlvbnM7XG5cbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgdGFyZ2V0Tm9kZUlucHV0Q29ubmVjdGlvbnMubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgY29uc3QgaW5wdXRDb25uZWN0aW9uID0gdGFyZ2V0Tm9kZUlucHV0Q29ubmVjdGlvbnNba107XG4gICAgICAgIGlmIChpbnB1dENvbm5lY3Rpb24gPT0gbnVsbCB8fCBwcmV2U2hhZGVyTm9kZS5zaGFkZXJOb2RlVWlkICE9PSBpbnB1dENvbm5lY3Rpb24uc2hhZGVyTm9kZVVpZCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb3V0cHV0S2V5ID0gYCR7aW5wdXRDb25uZWN0aW9uLnNoYWRlck5vZGVVaWR9XyR7aW5wdXRDb25uZWN0aW9uLm91dHB1dE5hbWVPZlByZXZ9YDtcbiAgICAgICAgaWYgKCFleGlzdGluZ091dHB1dHMuaGFzKG91dHB1dEtleSkpIHtcbiAgICAgICAgICBjb25zdCBpbnB1dE5vZGUgPSBBYnN0cmFjdFNoYWRlck5vZGUuX3NoYWRlck5vZGVzW2lucHV0Q29ubmVjdGlvbi5zaGFkZXJOb2RlVWlkXTtcbiAgICAgICAgICBjb25zdCBvdXRwdXRTb2NrZXRPZlByZXYgPSBpbnB1dE5vZGUuZ2V0T3V0cHV0KGlucHV0Q29ubmVjdGlvbi5vdXRwdXROYW1lT2ZQcmV2KTtcbiAgICAgICAgICBjb25zdCB2YXJOYW1lID0gYCR7b3V0cHV0U29ja2V0T2ZQcmV2IS5uYW1lfV8ke2lucHV0Q29ubmVjdGlvbi5zaGFkZXJOb2RlVWlkfV90b18ke1xuICAgICAgICAgICAgdGFyZ2V0U2hhZGVyTm9kZS5zaGFkZXJOb2RlVWlkXG4gICAgICAgICAgfWA7XG5cbiAgICAgICAgICBpZiAobm9kZUluZGV4IC0gMSA+PSAwKSB7XG4gICAgICAgICAgICB2YXJPdXRwdXROYW1lc1tub2RlSW5kZXggLSAxXS5wdXNoKHZhck5hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBVc2Ugb3V0cHV0S2V5IHRvIHRyYWNrIGVhY2ggb3V0cHV0IHNlcGFyYXRlbHkgKGZpeGVzIG11bHRpcGxlIG91dHB1dHMgZnJvbSBzYW1lIG5vZGUpXG4gICAgICAgICAgZXhpc3RpbmdPdXRwdXRzVmFyTmFtZS5zZXQob3V0cHV0S2V5LCB2YXJOYW1lKTtcbiAgICAgICAgICBleGlzdGluZ091dHB1dHMuYWRkKG91dHB1dEtleSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIHNoYWRlciBjb2RlIGZvciB0aGUgbm9kZXMuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dlbmVyYXRlU2hhZGVyQ29kZShcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBzaGFkZXJOb2RlczogQWJzdHJhY3RTaGFkZXJOb2RlW10sXG4gICAgdmFySW5wdXROYW1lczogQXJyYXk8QXJyYXk8c3RyaW5nPj4sXG4gICAgdmFyT3V0cHV0TmFtZXM6IEFycmF5PEFycmF5PHN0cmluZz4+LFxuICAgIGlzVmVydGV4U3RhZ2U6IGJvb2xlYW5cbiAgKTogc3RyaW5nIHtcbiAgICBsZXQgc2hhZGVyQm9keSA9ICcnO1xuICAgIGxldCBkdW1teVZhckNvdW50ZXIgPSAwO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaGFkZXJOb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgc2hhZGVyTm9kZSA9IHNoYWRlck5vZGVzW2ldO1xuXG4gICAgICAvLyBTa2lwIG5vZGVzIG5vdCBpbiBjdXJyZW50IHN0YWdlXG4gICAgICBpZiAoXG4gICAgICAgIChpc1ZlcnRleFN0YWdlICYmIHNoYWRlck5vZGUuZ2V0U2hhZGVyU3RhZ2UoKSA9PT0gJ0ZyYWdtZW50JykgfHxcbiAgICAgICAgKCFpc1ZlcnRleFN0YWdlICYmIHNoYWRlck5vZGUuZ2V0U2hhZGVyU3RhZ2UoKSA9PT0gJ1ZlcnRleCcpXG4gICAgICApIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIEVuc3VyZSBhcnJheXMgYXJlIGluaXRpYWxpemVkXG4gICAgICBpZiAodmFySW5wdXROYW1lc1tpXSA9PSBudWxsKSB7XG4gICAgICAgIHZhcklucHV0TmFtZXNbaV0gPSBbXTtcbiAgICAgIH1cbiAgICAgIGlmICh2YXJPdXRwdXROYW1lc1tpXSA9PSBudWxsKSB7XG4gICAgICAgIHZhck91dHB1dE5hbWVzW2ldID0gW107XG4gICAgICB9XG5cbiAgICAgIC8vIFJlb3JkZXIgb3V0cHV0IHZhcmlhYmxlcyB0byBtYXRjaCB0aGUgb3V0cHV0IHNvY2tldCBvcmRlciBhbmQgZmlsbCBtaXNzaW5nIG9uZXMgd2l0aCBkdW1teSB2YXJpYWJsZXNcbiAgICAgIC8vIFRoaXMgZW5zdXJlcyBmdW5jdGlvbiBjYWxscyBhcmUgZ2VuZXJhdGVkIHdpdGggYXJndW1lbnRzIGluIHRoZSBjb3JyZWN0IG9yZGVyXG4gICAgICBjb25zdCBvdXRwdXRzID0gc2hhZGVyTm9kZS5nZXRPdXRwdXRzKCk7XG4gICAgICAvLyBBbHdheXMgcmVvcmRlciB3aGVuIHRoZXJlIGFyZSBvdXRwdXRzIHRvIGVuc3VyZSBjb3JyZWN0IGFyZ3VtZW50IG9yZGVyIGluIGZ1bmN0aW9uIGNhbGxzXG4gICAgICAvLyBQcmV2aW91c2x5IHRoaXMgb25seSB0cmlnZ2VyZWQgd2hlbiB2YXJPdXRwdXROYW1lcy5sZW5ndGggIT09IG91dHB1dHMubGVuZ3RoLCB3aGljaCBtaXNzZWRcbiAgICAgIC8vIGNhc2VzIHdoZXJlIGFsbCBvdXRwdXRzIHdlcmUgY29ubmVjdGVkIGJ1dCBpbiB3cm9uZyBvcmRlciBkdWUgdG8gY29ubmVjdGlvbiBwcm9jZXNzaW5nIG9yZGVyXG4gICAgICBpZiAob3V0cHV0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vIEJ1aWxkIGEgbWFwIGZyb20gb3V0cHV0IG5hbWUgdG8gdmFyaWFibGUgbmFtZVxuICAgICAgICBjb25zdCBvdXRwdXROYW1lVG9WYXJOYW1lOiBNYXA8c3RyaW5nLCBzdHJpbmc+ID0gbmV3IE1hcCgpO1xuICAgICAgICBjb25zdCBub2RlVWlkUGF0dGVybiA9IGBfJHtzaGFkZXJOb2RlLnNoYWRlck5vZGVVaWR9X3RvX2A7XG4gICAgICAgIGZvciAoY29uc3QgdmFyTmFtZSBvZiB2YXJPdXRwdXROYW1lc1tpXSkge1xuICAgICAgICAgIC8vIFZhcmlhYmxlIG5hbWUgZm9ybWF0OiAke291dHB1dE5hbWV9XyR7c2hhZGVyTm9kZVVpZH1fdG9fJHt0YXJnZXROb2RlVWlkfVxuICAgICAgICAgIGNvbnN0IHNwbGl0SW5kZXggPSB2YXJOYW1lLmluZGV4T2Yobm9kZVVpZFBhdHRlcm4pO1xuICAgICAgICAgIGlmIChzcGxpdEluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgY29uc3Qgb3V0cHV0TmFtZSA9IHZhck5hbWUuc3Vic3RyaW5nKDAsIHNwbGl0SW5kZXgpO1xuICAgICAgICAgICAgb3V0cHV0TmFtZVRvVmFyTmFtZS5zZXQob3V0cHV0TmFtZSwgdmFyTmFtZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ3JlYXRlIG9yZGVyZWQgb3V0cHV0IHZhcmlhYmxlIG5hbWVzIGFycmF5IG1hdGNoaW5nIG91dHB1dCBzb2NrZXQgb3JkZXJcbiAgICAgICAgY29uc3Qgb3JkZXJlZE91dHB1dFZhck5hbWVzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBjb25zdCBpc1dlYkdQVSA9IGVuZ2luZS5lbmdpbmVTdGF0ZS5jdXJyZW50UHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVO1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG91dHB1dHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBjb25zdCBvdXRwdXQgPSBvdXRwdXRzW2pdO1xuICAgICAgICAgIGNvbnN0IGV4aXN0aW5nVmFyTmFtZSA9IG91dHB1dE5hbWVUb1Zhck5hbWUuZ2V0KG91dHB1dC5uYW1lKTtcbiAgICAgICAgICBpZiAoZXhpc3RpbmdWYXJOYW1lKSB7XG4gICAgICAgICAgICBvcmRlcmVkT3V0cHV0VmFyTmFtZXMucHVzaChleGlzdGluZ1Zhck5hbWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBHZW5lcmF0ZSBkdW1teSB2YXJpYWJsZSBmb3IgdW5jb25uZWN0ZWQgb3V0cHV0XG4gICAgICAgICAgICBjb25zdCB0eXBlID0gaXNXZWJHUFVcbiAgICAgICAgICAgICAgPyBvdXRwdXQuY29tcG9zaXRpb25UeXBlLnRvV0dTTFR5cGUob3V0cHV0LmNvbXBvbmVudFR5cGUpXG4gICAgICAgICAgICAgIDogb3V0cHV0LmNvbXBvc2l0aW9uVHlwZS5nZXRHbHNsU3RyKG91dHB1dC5jb21wb25lbnRUeXBlKTtcbiAgICAgICAgICAgIGNvbnN0IGR1bW15VmFyTmFtZSA9IGBkdW1teSR7dHlwZS5yZXBsYWNlKC9bPD5dL2csICcnKX1fJHtkdW1teVZhckNvdW50ZXIrK31gO1xuXG4gICAgICAgICAgICAvLyBEZWNsYXJlIHRoZSBkdW1teSB2YXJpYWJsZVxuICAgICAgICAgICAgaWYgKGlzV2ViR1BVKSB7XG4gICAgICAgICAgICAgIHNoYWRlckJvZHkgKz0gYHZhciAke2R1bW15VmFyTmFtZX06ICR7dHlwZX07XFxuYDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNoYWRlckJvZHkgKz0gYCR7dHlwZX0gJHtkdW1teVZhck5hbWV9O1xcbmA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvcmRlcmVkT3V0cHV0VmFyTmFtZXMucHVzaChkdW1teVZhck5hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXJPdXRwdXROYW1lc1tpXSA9IG9yZGVyZWRPdXRwdXRWYXJOYW1lcztcbiAgICAgIH1cblxuICAgICAgY29uc3QgZnVuY3Rpb25OYW1lID0gc2hhZGVyTm9kZS5nZXRTaGFkZXJGdW5jdGlvbk5hbWVEZXJpdmF0aXZlKGVuZ2luZSk7XG4gICAgICBzaGFkZXJCb2R5ICs9IHNoYWRlck5vZGUubWFrZUNhbGxTdGF0ZW1lbnQoZW5naW5lLCBpLCBzaGFkZXJOb2RlLCBmdW5jdGlvbk5hbWUsIHZhcklucHV0TmFtZXMsIHZhck91dHB1dE5hbWVzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2hhZGVyQm9keTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIHZlcnRleC10by1mcmFnbWVudCBkYXRhIHBhc3NpbmcgaW4gdmVydGV4IHN0YWdlLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19oYW5kbGVWZXJ0ZXhUb0ZyYWdtZW50UGFzc2luZyhcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBzaGFkZXJOb2RlczogQWJzdHJhY3RTaGFkZXJOb2RlW10sXG4gICAgX3ZhcklucHV0TmFtZXM6IEFycmF5PEFycmF5PHN0cmluZz4+LFxuICAgIHZhck91dHB1dE5hbWVzOiBBcnJheTxBcnJheTxzdHJpbmc+PlxuICApOiBzdHJpbmcge1xuICAgIGxldCBzaGFkZXJCb2R5ID0gJyc7XG4gICAgY29uc3QgYXNzaWduZWRWYXJ5aW5nczogU2V0PHN0cmluZz4gPSBuZXcgU2V0KCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNoYWRlck5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBzaGFkZXJOb2RlID0gc2hhZGVyTm9kZXNbaV07XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgc2hhZGVyTm9kZS5pbnB1dENvbm5lY3Rpb25zLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGlucHV0Q29ubmVjdGlvbiA9IHNoYWRlck5vZGUuaW5wdXRDb25uZWN0aW9uc1tqXTtcbiAgICAgICAgaWYgKGlucHV0Q29ubmVjdGlvbiA9PSBudWxsKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpbnB1dE5vZGUgPSBBYnN0cmFjdFNoYWRlck5vZGUuZ2V0U2hhZGVyTm9kZUJ5VWlkKGlucHV0Q29ubmVjdGlvbi5zaGFkZXJOb2RlVWlkKTtcbiAgICAgICAgaWYgKGlucHV0Tm9kZS5nZXRTaGFkZXJTdGFnZSgpID09PSAnVmVydGV4JyAmJiBzaGFkZXJOb2RlLmdldFNoYWRlclN0YWdlKCkgPT09ICdGcmFnbWVudCcpIHtcbiAgICAgICAgICBjb25zdCB2YXJ5aW5nTmFtZSA9IGB2XyR7aW5wdXROb2RlLnNoYWRlckZ1bmN0aW9uTmFtZX1fJHtpbnB1dE5vZGUuc2hhZGVyTm9kZVVpZH1fJHtpbnB1dENvbm5lY3Rpb24ub3V0cHV0TmFtZU9mUHJldn1gO1xuICAgICAgICAgIGlmIChhc3NpZ25lZFZhcnlpbmdzLmhhcyh2YXJ5aW5nTmFtZSkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhc3NpZ25lZFZhcnlpbmdzLmFkZCh2YXJ5aW5nTmFtZSk7XG5cbiAgICAgICAgICAvLyBGaW5kIHRoZSBzb3VyY2UgdmFyaWFibGUgbmFtZSBmcm9tIHRoZSBpbnB1dCBub2RlJ3Mgb3V0cHV0c1xuICAgICAgICAgIGNvbnN0IGlucHV0Tm9kZUluZGV4ID0gc2hhZGVyTm9kZXMuaW5kZXhPZihpbnB1dE5vZGUpO1xuICAgICAgICAgIGlmIChpbnB1dE5vZGVJbmRleCA+PSAwICYmIHZhck91dHB1dE5hbWVzW2lucHV0Tm9kZUluZGV4XSkge1xuICAgICAgICAgICAgLy8gRmluZCB0aGUgb3V0cHV0IHZhcmlhYmxlIGJ5IHNlYXJjaGluZyBmb3IgdGhlIG1hdGNoaW5nIG91dHB1dCBuYW1lIGluIHZhck91dHB1dE5hbWVzXG4gICAgICAgICAgICAvLyB2YXJPdXRwdXROYW1lcyBjb250YWlucyBuYW1lcyBsaWtlIFwib3V0UG9zaXRpb25JbldvcmxkXzEyM190b180NTZcIlxuICAgICAgICAgICAgY29uc3Qgb3V0cHV0TmFtZVByZWZpeCA9IGAke2lucHV0Q29ubmVjdGlvbi5vdXRwdXROYW1lT2ZQcmV2fV8ke2lucHV0Tm9kZS5zaGFkZXJOb2RlVWlkfV90b19gO1xuICAgICAgICAgICAgbGV0IHNvdXJjZVZhck5hbWU6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGZvciAoY29uc3QgdmFyTmFtZSBvZiB2YXJPdXRwdXROYW1lc1tpbnB1dE5vZGVJbmRleF0pIHtcbiAgICAgICAgICAgICAgaWYgKHZhck5hbWUuc3RhcnRzV2l0aChvdXRwdXROYW1lUHJlZml4KSkge1xuICAgICAgICAgICAgICAgIHNvdXJjZVZhck5hbWUgPSB2YXJOYW1lO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc291cmNlVmFyTmFtZSkge1xuICAgICAgICAgICAgICBpZiAoZW5naW5lLmVuZ2luZVN0YXRlLmN1cnJlbnRQcm9jZXNzQXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpIHtcbiAgICAgICAgICAgICAgICBzaGFkZXJCb2R5ICs9IGBvdXRwdXQuJHtpbnB1dE5vZGUuc2hhZGVyRnVuY3Rpb25OYW1lfV8ke2lucHV0Tm9kZS5zaGFkZXJOb2RlVWlkfV8ke2lucHV0Q29ubmVjdGlvbi5vdXRwdXROYW1lT2ZQcmV2fSA9ICR7c291cmNlVmFyTmFtZX07XFxuYDtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzaGFkZXJCb2R5ICs9IGAke3ZhcnlpbmdOYW1lfSA9ICR7c291cmNlVmFyTmFtZX07XFxuYDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzaGFkZXJCb2R5O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdHMgdGhlIG1haW4gc2hhZGVyIGJvZHkgd2l0aCBwcm9wZXIgdmFyaWFibGUgZGVjbGFyYXRpb25zLCBjb25uZWN0aW9ucywgYW5kIGZ1bmN0aW9uIGNhbGxzLlxuICAgKiBUaGlzIGlzIHRoZSBjb3JlIG1ldGhvZCB0aGF0IGdlbmVyYXRlcyB0aGUgYWN0dWFsIHNoYWRlciBleGVjdXRpb24gbG9naWMgYnk6XG4gICAqIC0gRGVjbGFyaW5nIHZhcnlpbmcgdmFyaWFibGVzIGZvciB2ZXJ0ZXgtdG8tZnJhZ21lbnQgY29tbXVuaWNhdGlvblxuICAgKiAtIENvbGxlY3RpbmcgaW5wdXQvb3V0cHV0IHZhcmlhYmxlIG5hbWVzIGZvciBlYWNoIG5vZGVcbiAgICogLSBHZW5lcmF0aW5nIGZ1bmN0aW9uIGNhbGwgc3RhdGVtZW50cyBpbiB0b3BvbG9naWNhbCBvcmRlclxuICAgKiAtIEhhbmRsaW5nIHZlcnRleC10by1mcmFnbWVudCBkYXRhIHBhc3NpbmdcbiAgICpcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIHNoYWRlck5vZGVzIC0gQXJyYXkgb2Ygc2hhZGVyIG5vZGVzIHNvcnRlZCBpbiB0b3BvbG9naWNhbCBvcmRlclxuICAgKiBAcGFyYW0gaXNWZXJ0ZXhTdGFnZSAtIFRydWUgZm9yIHZlcnRleCBzaGFkZXIgZ2VuZXJhdGlvbiwgZmFsc2UgZm9yIGZyYWdtZW50XG4gICAqIEBwYXJhbSBjb21tb25TaGFkZXJQYXJ0IC0gVGhlIENvbW1vblNoYWRlclBhcnQgaW5zdGFuY2UgZm9yIHNoYWRlciBjb2RlIGdlbmVyYXRpb25cbiAgICogQHBhcmFtIGlzRnVsbFZlcnNpb24gLSBXaGV0aGVyIHRvIGluY2x1ZGUgZnVsbCBzaGFkZXIgYm9pbGVycGxhdGVcbiAgICogQHJldHVybnMgQ29tcGxldGUgc2hhZGVyIG1haW4gZnVuY3Rpb24gYm9keSBhcyBhIHN0cmluZ1xuICAgKiBAdGhyb3dzIEVycm9yIGlmIHNoYWRlciBjb25zdHJ1Y3Rpb24gZmFpbHNcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fY29uc3RydWN0U2hhZGVyV2l0aE5vZGVzKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHNoYWRlck5vZGVzOiBBYnN0cmFjdFNoYWRlck5vZGVbXSxcbiAgICBpc1ZlcnRleFN0YWdlOiBib29sZWFuLFxuICAgIGNvbW1vblNoYWRlclBhcnQ6IENvbW1vblNoYWRlclBhcnQsXG4gICAgc2hhZGluZ1NlY3Rpb25zPzogcmVhZG9ubHkgU2hhZGluZ1NlY3Rpb25bXVxuICApIHtcbiAgICBsZXQgc2hhZGVyQm9keSA9ICcnO1xuXG4gICAgLy8gRGVmaW5lIHZhcnlpbmcgdmFyaWFibGVzXG4gICAgc2hhZGVyQm9keSArPSB0aGlzLl9fZGVmaW5lVmFyeWluZ1ZhcmlhYmxlcyhlbmdpbmUsIHNoYWRlck5vZGVzLCBpc1ZlcnRleFN0YWdlKTtcblxuICAgIHNoYWRlckJvZHkgKz0gY29tbW9uU2hhZGVyUGFydC5nZXRNYWluQmVnaW4oZW5naW5lLCBpc1ZlcnRleFN0YWdlKTtcblxuICAgIC8vIENvbGxlY3QgaW5wdXQvb3V0cHV0IHZhcmlhYmxlIG5hbWVzXG4gICAgY29uc3QgeyB2YXJJbnB1dE5hbWVzLCB2YXJPdXRwdXROYW1lcywgY29sbGVjdGVkU2hhZGVyQm9keSB9ID0gdGhpcy5fX2NvbGxlY3RWYXJpYWJsZU5hbWVzKFxuICAgICAgZW5naW5lLFxuICAgICAgc2hhZGVyTm9kZXMsXG4gICAgICBpc1ZlcnRleFN0YWdlLFxuICAgICAgY29tbW9uU2hhZGVyUGFydFxuICAgICk7XG4gICAgc2hhZGVyQm9keSArPSBjb2xsZWN0ZWRTaGFkZXJCb2R5O1xuXG4gICAgLy8gR2VuZXJhdGUgc2hhZGVyIGNvZGVcbiAgICBzaGFkZXJCb2R5ICs9IHRoaXMuX19nZW5lcmF0ZVNoYWRlckNvZGUoZW5naW5lLCBzaGFkZXJOb2RlcywgdmFySW5wdXROYW1lcywgdmFyT3V0cHV0TmFtZXMsIGlzVmVydGV4U3RhZ2UpO1xuXG4gICAgLy8gSGFuZGxlIHZlcnRleC10by1mcmFnbWVudCBkYXRhIHBhc3NpbmdcbiAgICBpZiAoaXNWZXJ0ZXhTdGFnZSkge1xuICAgICAgc2hhZGVyQm9keSArPSB0aGlzLl9faGFuZGxlVmVydGV4VG9GcmFnbWVudFBhc3NpbmcoZW5naW5lLCBzaGFkZXJOb2RlcywgdmFySW5wdXROYW1lcywgdmFyT3V0cHV0TmFtZXMpO1xuICAgIH1cblxuICAgIHNoYWRlckJvZHkgKz0gY29tbW9uU2hhZGVyUGFydC5nZXRNYWluRW5kKGVuZ2luZSwgaXNWZXJ0ZXhTdGFnZSwgc2hhZGluZ1NlY3Rpb25zKTtcblxuICAgIHJldHVybiBzaGFkZXJCb2R5O1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBjb21wbGV0ZSB2ZXJ0ZXggYW5kIGZyYWdtZW50IHNoYWRlciBjb2RlIGZyb20gYSBKU09OIHNoYWRlciBub2RlIGdyYXBoIGRlZmluaXRpb24uXG4gICAqIFRoaXMgaXMgdGhlIG1haW4gZW50cnkgcG9pbnQgZm9yIGNvbnZlcnRpbmcgYSBzZXJpYWxpemVkIHNoYWRlciBncmFwaCBpbnRvIGV4ZWN1dGFibGUgc2hhZGVyIGNvZGUuXG4gICAqIFRoZSBtZXRob2QgcGVyZm9ybXMgdGhlIGZ1bGwgcGlwZWxpbmU6IG5vZGUgY29uc3RydWN0aW9uLCBkZXBlbmRlbmN5IHJlc29sdXRpb24sIHN0YWdlIGFzc2lnbm1lbnQsXG4gICAqIGFuZCBmaW5hbCBjb2RlIGdlbmVyYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBqc29uIC0gSlNPTiByZXByZXNlbnRhdGlvbiBvZiB0aGUgc2hhZGVyIG5vZGUgZ3JhcGggY29udGFpbmluZyBub2RlcyBhbmQgY29ubmVjdGlvbnNcbiAgICogQHBhcmFtIGNvbW1vblNoYWRlclBhcnQgLSBTdGFuZGFyZFNoYWRlclBhcnQgaW5zdGFuY2UgdG8gdXNlIGZvciBzaGFkZXIgY29kZSBnZW5lcmF0aW9uXG4gICAqIEByZXR1cm5zIE9iamVjdCBjb250YWluaW5nIGJvdGggdmVydGV4IGFuZCBmcmFnbWVudCBzaGFkZXIgY29kZSwgdGV4dHVyZSBuYW1lcyB1c2VkLCBvciB1bmRlZmluZWQgaWYgZ2VuZXJhdGlvbiBmYWlsc1xuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IGNvbW1vblNoYWRlclBhcnQgPSBuZXcgU3RhbmRhcmRTaGFkZXJQYXJ0KCk7XG4gICAqIGNvbnN0IHNoYWRlckNvZGUgPSBTaGFkZXJHcmFwaFJlc29sdmVyLmdlbmVyYXRlU2hhZGVyQ29kZUZyb21Kc29uKGVuZ2luZSwgZ3JhcGhKc29uLCBjb21tb25TaGFkZXJQYXJ0KTtcbiAgICogaWYgKHNoYWRlckNvZGUpIHtcbiAgICogICBjb25zdCB7IHZlcnRleFNoYWRlciwgcGl4ZWxTaGFkZXIsIHRleHR1cmVOYW1lcyB9ID0gc2hhZGVyQ29kZTtcbiAgICogICAvLyBVc2UgdGhlIGdlbmVyYXRlZCBzaGFkZXJzLi4uXG4gICAqIH1cbiAgICogYGBgXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGdlbmVyYXRlU2hhZGVyQ29kZUZyb21Kc29uKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIGpzb246IFNoYWRlck5vZGVKc29uLFxuICAgIGNvbW1vblNoYWRlclBhcnQ6IENvbW1vblNoYWRlclBhcnQsXG4gICAgcGl4ZWxFbmROb2RlTmFtZXM6IHN0cmluZ1tdID0gWydvdXRDb2xvcicsICdjb25kaXRpb25hbERpc2NhcmQnLCAnb3V0RGlzdGFuY2UnLCAnb3V0VW5pb24nLCAnb3V0U2hhZGluZ0NvbG9yJ11cbiAgKTpcbiAgICB8IHtcbiAgICAgICAgdmVydGV4U2hhZGVyOiBzdHJpbmc7XG4gICAgICAgIHBpeGVsU2hhZGVyOiBzdHJpbmc7XG4gICAgICAgIHRleHR1cmVJbmZvczogeyBuYW1lOiBzdHJpbmc7IHN0YWdlOiBzdHJpbmc7IGRlZmF1bHRUZXh0dXJlOiBzdHJpbmcgfVtdO1xuICAgICAgfVxuICAgIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCB7IG5vZGVJbnN0YW5jZXMsIHRleHR1cmVJbmZvcyB9ID0gY29uc3RydWN0Tm9kZXMoanNvbik7XG4gICAgY29uc3QgY29uc3RydWN0ZWROb2RlcyA9IE9iamVjdC52YWx1ZXMobm9kZUluc3RhbmNlcyk7XG4gICAgY29uc3Qgbm9kZXMgPSB0aGlzLl9fc29ydFRvcG9sb2dpY2FsbHkoY29uc3RydWN0ZWROb2Rlcyk7XG4gICAgcmVzb2x2ZVNoYWRlclN0YWdlKG5vZGVzKTtcbiAgICBjb25zdCB2YXJ5aW5nTm9kZXMgPSBmaWx0ZXJOb2Rlc0ZvclZhcnlpbmcobm9kZXMsICdvdXRDb2xvcicpO1xuICAgIGNvbnN0IHZhcnlpbmdOb2Rlc0ZvckRpc2NhcmQgPSBmaWx0ZXJOb2Rlc0ZvclZhcnlpbmcobm9kZXMsICdjb25kaXRpb25hbERpc2NhcmQnKTtcbiAgICBjb25zdCBhbGxWYXJ5aW5nTm9kZXMgPSBbLi4ubmV3IFNldChbLi4udmFyeWluZ05vZGVzLCAuLi52YXJ5aW5nTm9kZXNGb3JEaXNjYXJkXSldO1xuXG4gICAgY29uc3QgdmVydGV4Tm9kZXMgPSBmaWx0ZXJOb2Rlcyhub2RlcywgWydvdXRQb3NpdGlvbiddKTtcbiAgICAvLyBUaGUgZW5kcG9pbnRzIHNlbGVjdCB0aGUgcGl4ZWwgc3ViZ3JhcGguIFNoYWRvdyBjYXN0ZXIgbWF0ZXJpYWxzIHBhc3Mgb25seSB0aGVcbiAgICAvLyBkaXN0YW5jZSBlbmRwb2ludHMgc28gdGhlIFBCUiAvIHNoYWRpbmcgbm9kZXMgYXJlIG5vdCBlbWl0dGVkIGF0IGFsbC5cbiAgICBjb25zdCBwaXhlbE5vZGVzID0gZmlsdGVyTm9kZXMobm9kZXMsIHBpeGVsRW5kTm9kZU5hbWVzKTtcblxuICAgIC8vIGlmICh2ZXJ0ZXhOb2Rlcy5sZW5ndGggPT09IDAgfHwgcGl4ZWxOb2Rlcy5sZW5ndGggPT09IDApIHtcbiAgICAvLyAgIHJldHVybjtcbiAgICAvLyB9XG5cbiAgICBjb25zdCB2ZXJ0ZXhSZXQgPSBTaGFkZXJHcmFwaFJlc29sdmVyLmNyZWF0ZVZlcnRleFNoYWRlckNvZGUoXG4gICAgICBlbmdpbmUsXG4gICAgICB2ZXJ0ZXhOb2RlcyxcbiAgICAgIGFsbFZhcnlpbmdOb2RlcyxcbiAgICAgIGNvbW1vblNoYWRlclBhcnRcbiAgICApO1xuICAgIGNvbnN0IHNoYWRpbmdHcm91cHMgPSB0aGlzLl9fY29sbGVjdFNoYWRpbmdHcm91cHMoanNvbiwgbm9kZUluc3RhbmNlcyk7XG4gICAgY29uc3QgcGl4ZWxSZXQgPSBTaGFkZXJHcmFwaFJlc29sdmVyLmNyZWF0ZVBpeGVsU2hhZGVyQ29kZShlbmdpbmUsIHBpeGVsTm9kZXMsIGNvbW1vblNoYWRlclBhcnQsIHNoYWRpbmdHcm91cHMpO1xuICAgIGlmICh2ZXJ0ZXhSZXQgPT0gbnVsbCB8fCBwaXhlbFJldCA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgdmVydGV4U2hhZGVyOiB2ZXJ0ZXhSZXQsIHBpeGVsU2hhZGVyOiBwaXhlbFJldCwgdGV4dHVyZUluZm9zIH07XG4gIH1cbn1cblxuLyoqXG4gKiBSZWN1cnNpdmVseSBmaWx0ZXJzIHNoYWRlciBub2RlcyBzdGFydGluZyBmcm9tIHNwZWNpZmljIGVuZCBub2RlcyBieSB0cmF2ZXJzaW5nIGJhY2t3YXJkc1xuICogdGhyb3VnaCBpbnB1dCBjb25uZWN0aW9ucy4gVGhpcyBpcyBhIGhlbHBlciBmdW5jdGlvbiBmb3IgZGVwZW5kZW5jeSBhbmFseXNpcy5cbiAqIFN1cHBvcnRzIG11bHRpcGxlIGVuZCBub2RlcyB3aXRoIHRoZSBzYW1lIG5hbWUgKGUuZy4sIGZyb20gZGlmZmVyZW50IGNvbXBvbmVudHMpLlxuICpcbiAqIEBwYXJhbSBub2RlcyAtIEFycmF5IG9mIGFsbCBhdmFpbGFibGUgc2hhZGVyIG5vZGVzXG4gKiBAcGFyYW0gZW5kTm9kZU5hbWUgLSBOYW1lIG9mIHRoZSB0YXJnZXQgZW5kIG5vZGUgdG8gc3RhcnQgZmlsdGVyaW5nIGZyb21cbiAqIEByZXR1cm5zIEFycmF5IG9mIG5vZGVzIHRoYXQgY29udHJpYnV0ZSB0byBhbnkgbWF0Y2hpbmcgZW5kIG5vZGVzXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBmaWx0ZXJOb2Rlc0lubmVyKG5vZGVzOiBBYnN0cmFjdFNoYWRlck5vZGVbXSwgZW5kTm9kZU5hbWU6IHN0cmluZykge1xuICAvLyBGaW5kIGFsbCBtYXRjaGluZyBlbmQgbm9kZXMgKG5vdCBqdXN0IHRoZSBmaXJzdCBvbmUpXG4gIGNvbnN0IGVuZE5vZGVzOiBBYnN0cmFjdFNoYWRlck5vZGVbXSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgIGlmIChub2RlLnNoYWRlckZ1bmN0aW9uTmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGVuZE5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICBlbmROb2Rlcy5wdXNoKG5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChlbmROb2Rlcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBjb25zdCBmaWx0ZXJlZE5vZGVzOiBBYnN0cmFjdFNoYWRlck5vZGVbXSA9IFsuLi5lbmROb2Rlc107XG4gIGNvbnN0IHZpc2l0ZWROb2RlVWlkcyA9IG5ldyBTZXQ8bnVtYmVyPihlbmROb2Rlcy5tYXAobm9kZSA9PiBub2RlLnNoYWRlck5vZGVVaWQpKTtcblxuICBmdW5jdGlvbiB0cmF2ZXJzZU5vZGVzKG5vZGU6IEFic3RyYWN0U2hhZGVyTm9kZSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZS5pbnB1dENvbm5lY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBpbnB1dENvbm5lY3Rpb24gPSBub2RlLmlucHV0Q29ubmVjdGlvbnNbaV07XG4gICAgICBpZiAoaW5wdXRDb25uZWN0aW9uICE9IG51bGwpIHtcbiAgICAgICAgY29uc3QgaW5wdXROb2RlID0gQWJzdHJhY3RTaGFkZXJOb2RlLmdldFNoYWRlck5vZGVCeVVpZChpbnB1dENvbm5lY3Rpb24uc2hhZGVyTm9kZVVpZCk7XG4gICAgICAgIGlmIChpbnB1dE5vZGUgIT0gbnVsbCAmJiAhdmlzaXRlZE5vZGVVaWRzLmhhcyhpbnB1dE5vZGUuc2hhZGVyTm9kZVVpZCkpIHtcbiAgICAgICAgICB2aXNpdGVkTm9kZVVpZHMuYWRkKGlucHV0Tm9kZS5zaGFkZXJOb2RlVWlkKTtcbiAgICAgICAgICBmaWx0ZXJlZE5vZGVzLnB1c2goaW5wdXROb2RlKTtcbiAgICAgICAgICB0cmF2ZXJzZU5vZGVzKGlucHV0Tm9kZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBUcmF2ZXJzZSBmcm9tIGFsbCBtYXRjaGluZyBlbmQgbm9kZXNcbiAgZm9yIChjb25zdCBlbmROb2RlIG9mIGVuZE5vZGVzKSB7XG4gICAgdHJhdmVyc2VOb2RlcyhlbmROb2RlKTtcbiAgfVxuXG4gIHJldHVybiBmaWx0ZXJlZE5vZGVzO1xufVxuXG4vKipcbiAqIEZpbHRlcnMgc2hhZGVyIG5vZGVzIHRvIGluY2x1ZGUgb25seSB0aG9zZSB0aGF0IGNvbnRyaWJ1dGUgdG8gdGhlIHNwZWNpZmllZCBlbmQgbm9kZXMuXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgdG8gc2VwYXJhdGUgdmVydGV4IGFuZCBmcmFnbWVudCBwcm9jZXNzaW5nIHBpcGVsaW5lcyBieSBpZGVudGlmeWluZ1xuICogd2hpY2ggbm9kZXMgY29udHJpYnV0ZSB0byBzcGVjaWZpYyBvdXRwdXQgdGFyZ2V0cyAoZS5nLiwgcG9zaXRpb24sIGNvbG9yKS5cbiAqXG4gKiBAcGFyYW0gbm9kZXMgLSBBcnJheSBvZiBhbGwgc2hhZGVyIG5vZGVzIGluIHRoZSBncmFwaFxuICogQHBhcmFtIGVuZE5vZGVzTmFtZSAtIEFycmF5IG9mIGVuZCBub2RlIG5hbWVzIHRvIGZpbHRlciBmb3IgKGUuZy4sIFsnb3V0UG9zaXRpb24nLCAnb3V0Q29sb3InXSlcbiAqIEByZXR1cm5zIEFycmF5IG9mIHVuaXF1ZSBub2RlcyB0aGF0IGNvbnRyaWJ1dGUgdG8gYW55IG9mIHRoZSBzcGVjaWZpZWQgZW5kIG5vZGVzXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBmaWx0ZXJOb2Rlcyhub2RlczogQWJzdHJhY3RTaGFkZXJOb2RlW10sIGVuZE5vZGVzTmFtZTogc3RyaW5nW10pIHtcbiAgbGV0IGZpbmFsRmlsdGVyTm9kZXM6IEFic3RyYWN0U2hhZGVyTm9kZVtdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZW5kTm9kZXNOYW1lLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgZW5kTm9kZU5hbWUgPSBlbmROb2Rlc05hbWVbaV07XG4gICAgY29uc3QgZmlsdGVyZWROb2RlcyA9IGZpbHRlck5vZGVzSW5uZXIobm9kZXMsIGVuZE5vZGVOYW1lKTtcbiAgICBmaW5hbEZpbHRlck5vZGVzID0gZmluYWxGaWx0ZXJOb2Rlcy5jb25jYXQoZmlsdGVyZWROb2Rlcyk7XG4gIH1cblxuICAvLyBSZW1vdmUgZHVwbGljYXRlc1xuICBmaW5hbEZpbHRlck5vZGVzID0gWy4uLm5ldyBTZXQoZmluYWxGaWx0ZXJOb2RlcyldO1xuXG4gIHJldHVybiBmaW5hbEZpbHRlck5vZGVzO1xufVxuXG4vKipcbiAqIFJlc29sdmVzIGFuZCBhc3NpZ25zIGFwcHJvcHJpYXRlIHNoYWRlciBzdGFnZXMgKFZlcnRleC9GcmFnbWVudCkgdG8gbm9kZXMgYmFzZWQgb24gdGhlaXIgZGVwZW5kZW5jaWVzLlxuICogVGhpcyBmdW5jdGlvbiBwcm9wYWdhdGVzIHN0YWdlIGluZm9ybWF0aW9uIHRocm91Z2ggdGhlIG5vZGUgZ3JhcGgsIGVuc3VyaW5nIHRoYXQgbm9kZXNcbiAqIGFyZSBhc3NpZ25lZCB0byB0aGUgY29ycmVjdCBzaGFkZXIgc3RhZ2UgYmFzZWQgb24gdGhlaXIgY29ubmVjdGlvbnMgYW5kIHVzYWdlIHBhdHRlcm5zLlxuICpcbiAqIEBwYXJhbSBzaGFkZXJOb2RlcyAtIEFycmF5IG9mIHNoYWRlciBub2RlcyB0byByZXNvbHZlIHN0YWdlcyBmb3JcbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmVTaGFkZXJTdGFnZShzaGFkZXJOb2RlczogQWJzdHJhY3RTaGFkZXJOb2RlW10pIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaGFkZXJOb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHNoYWRlck5vZGUgPSBzaGFkZXJOb2Rlc1tpXTtcbiAgICBmb3IgKGNvbnN0IGlucHV0Q29ubmVjdGlvbiBvZiBzaGFkZXJOb2RlLmlucHV0Q29ubmVjdGlvbnMpIHtcbiAgICAgIGlmIChpbnB1dENvbm5lY3Rpb24gPT0gbnVsbCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGlucHV0Tm9kZSA9IEFic3RyYWN0U2hhZGVyTm9kZS5nZXRTaGFkZXJOb2RlQnlVaWQoaW5wdXRDb25uZWN0aW9uLnNoYWRlck5vZGVVaWQpO1xuICAgICAgaWYgKGlucHV0Tm9kZS5nZXRTaGFkZXJTdGFnZSgpID09PSAnVmVydGV4JyAmJiBzaGFkZXJOb2RlLmdldFNoYWRlclN0YWdlKCkgPT09ICdOZXV0cmFsJykge1xuICAgICAgICBzaGFkZXJOb2RlLnNldFNoYWRlclN0YWdlKCdWZXJ0ZXgnKTtcbiAgICAgIH0gZWxzZSBpZiAoaW5wdXROb2RlLmdldFNoYWRlclN0YWdlKCkgPT09ICdGcmFnbWVudCcpIHtcbiAgICAgICAgc2hhZGVyTm9kZS5zZXRTaGFkZXJTdGFnZSgnRnJhZ21lbnQnKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJZGVudGlmaWVzIHNoYWRlciBub2RlcyB0aGF0IG5lZWQgdG8gcGFzcyBkYXRhIGZyb20gdmVydGV4IHRvIGZyYWdtZW50IHN0YWdlICh2YXJ5aW5nIHZhcmlhYmxlcykuXG4gKiBUaGlzIGZ1bmN0aW9uIHRyYWNlcyB0aGUgZGVwZW5kZW5jeSBncmFwaCB0byBmaW5kIG5vZGVzIHRoYXQgYnJpZGdlIGJldHdlZW4gdmVydGV4IGFuZCBmcmFnbWVudFxuICogcHJvY2Vzc2luZywgd2hpY2ggcmVxdWlyZSBzcGVjaWFsIGhhbmRsaW5nIGZvciBpbnRlci1zdGFnZSBjb21tdW5pY2F0aW9uLlxuICpcbiAqIEBwYXJhbSBub2RlcyAtIEFycmF5IG9mIGFsbCBzaGFkZXIgbm9kZXMgaW4gdGhlIGdyYXBoXG4gKiBAcGFyYW0gZW5kTm9kZU5hbWUgLSBOYW1lIG9mIHRoZSBmaW5hbCBvdXRwdXQgbm9kZSAodHlwaWNhbGx5ICdvdXRDb2xvcicgZm9yIGZyYWdtZW50IG91dHB1dClcbiAqIEByZXR1cm5zIEFycmF5IG9mIG5vZGVzIHRoYXQgcmVxdWlyZSB2YXJ5aW5nIHZhcmlhYmxlIGRlY2xhcmF0aW9ucyBmb3IgdmVydGV4LXRvLWZyYWdtZW50IGRhdGEgcGFzc2luZ1xuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gZmlsdGVyTm9kZXNGb3JWYXJ5aW5nKG5vZGVzOiBBYnN0cmFjdFNoYWRlck5vZGVbXSwgZW5kTm9kZU5hbWU6IHN0cmluZykge1xuICAvLyBGaW5kIHRoZSBlbmQgbm9kZVxuICBsZXQgZW5kTm9kZTogQWJzdHJhY3RTaGFkZXJOb2RlIHwgdW5kZWZpbmVkO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgIGlmIChub2RlLnNoYWRlckZ1bmN0aW9uTmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGVuZE5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICBlbmROb2RlID0gbm9kZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICBpZiAoZW5kTm9kZSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgbGV0IHZhcnlpbmdOb2RlczogQWJzdHJhY3RTaGFkZXJOb2RlW10gPSBbXTtcbiAgZnVuY3Rpb24gdHJhdmVyc2VOb2Rlc0FsbChub2RlOiBBYnN0cmFjdFNoYWRlck5vZGUpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGUuaW5wdXRDb25uZWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgaW5wdXRDb25uZWN0aW9uID0gbm9kZS5pbnB1dENvbm5lY3Rpb25zW2ldO1xuICAgICAgaWYgKGlucHV0Q29ubmVjdGlvbiA9PSBudWxsKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgaW5wdXROb2RlID0gQWJzdHJhY3RTaGFkZXJOb2RlLmdldFNoYWRlck5vZGVCeVVpZChpbnB1dENvbm5lY3Rpb24uc2hhZGVyTm9kZVVpZCk7XG4gICAgICB2YXJ5aW5nTm9kZXMucHVzaChpbnB1dE5vZGUpO1xuICAgICAgdHJhdmVyc2VOb2Rlc0FsbChpbnB1dE5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRyYXZlcnNlTm9kZXMobm9kZTogQWJzdHJhY3RTaGFkZXJOb2RlKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2RlLmlucHV0Q29ubmVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGlucHV0Q29ubmVjdGlvbiA9IG5vZGUuaW5wdXRDb25uZWN0aW9uc1tpXTtcbiAgICAgIGlmIChpbnB1dENvbm5lY3Rpb24gPT0gbnVsbCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGlucHV0Tm9kZSA9IEFic3RyYWN0U2hhZGVyTm9kZS5nZXRTaGFkZXJOb2RlQnlVaWQoaW5wdXRDb25uZWN0aW9uLnNoYWRlck5vZGVVaWQpO1xuICAgICAgaWYgKGlucHV0Tm9kZSAhPSBudWxsICYmIGlucHV0Tm9kZS5nZXRTaGFkZXJTdGFnZSgpID09PSAnVmVydGV4JyAmJiBub2RlLmdldFNoYWRlclN0YWdlKCkgPT09ICdGcmFnbWVudCcpIHtcbiAgICAgICAgdmFyeWluZ05vZGVzLnB1c2goaW5wdXROb2RlKTtcbiAgICAgICAgaWYgKG5vZGUuZ2V0U2hhZGVyU3RhZ2UoKSA9PT0gJ0ZyYWdtZW50Jykge1xuICAgICAgICAgIHZhcnlpbmdOb2Rlcy51bnNoaWZ0KG5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIHRyYXZlcnNlTm9kZXNBbGwoaW5wdXROb2RlKTtcbiAgICAgICAgLy8gQ29udGludWUgY2hlY2tpbmcgb3RoZXIgaW5wdXQgY29ubmVjdGlvbnMgaW5zdGVhZCBvZiBicmVha2luZ1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJhdmVyc2VOb2RlcyhpbnB1dE5vZGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHRyYXZlcnNlTm9kZXMoZW5kTm9kZSk7XG5cbiAgLy8gUmVtb3ZlIGR1cGxpY2F0ZXNcbiAgdmFyeWluZ05vZGVzID0gWy4uLm5ldyBTZXQodmFyeWluZ05vZGVzKV07XG5cbiAgcmV0dXJuIHZhcnlpbmdOb2Rlcy5yZXZlcnNlKCk7XG59XG5cbi8qKlxuICogUGFzc2VzIHRoZSBwZXItY29tcG9uZW50IHdvcmxkIG1hdHJpeCB1bmlmb3JtIG5hbWVzIG9mIGEgcmF5bWFyY2hpbmcgdGVybWluYWwgbm9kZVxuICogdG8gdGhlIGdlbmVyYXRlZCBmdW5jdGlvbi5cbiAqXG4gKiBgTWF0ZXJpYWxIZWxwZXIuY29sbGVjdFJybkpzb25gIHN0YW1wcyB0aGVtIG9uIHRoZSB0ZXJtaW5hbCBub2RlcyBvZiBlYWNoIGNvbXBvbmVudFxuICogdGhhdCB1c2VzIGBTZEFwcGx5V29ybGRNYXRyaXhgLCBzbyB0aGUgdGVybWluYWwgZnVuY3Rpb24gY2FuIGNvbnZlcnQgdGhlIGNvbXBvbmVudCdzXG4gKiBsb2NhbC1zcGFjZSBkaXN0YW5jZSBpbnRvIGEgY29uc2VydmF0aXZlIHdvcmxkLXNwYWNlIGRpc3RhbmNlLlxuICpcbiAqIEBwYXJhbSBub2RlSW5zdGFuY2UgLSBUaGUgdGVybWluYWwgbm9kZSBpbnN0YW5jZSAoYE91dFVuaW9uYCBvciBgT3V0RGlzdGFuY2VgKVxuICogQHBhcmFtIG5vZGUgLSBUaGUgSlNPTiBub2RlIHRoZSBpbnN0YW5jZSB3YXMgY3JlYXRlZCBmcm9tXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBhcHBseURpc3RhbmNlQ29ycmVjdGlvblVuaWZvcm1OYW1lcyhcbiAgbm9kZUluc3RhbmNlOiB7XG4gICAgc2V0RGlzdGFuY2VDb3JyZWN0aW9uVW5pZm9ybU5hbWVzOiAodW5pZm9ybU5hbWVzOiByZWFkb25seSBzdHJpbmdbXSkgPT4gdm9pZDtcbiAgfSxcbiAgbm9kZTogeyBjb250cm9scz86IFJlY29yZDxzdHJpbmcsIHsgdmFsdWU/OiB1bmtub3duIH0+IH1cbikge1xuICBjb25zdCB1bmlmb3JtTmFtZXMgPSBub2RlLmNvbnRyb2xzPy5kaXN0YW5jZUNvcnJlY3Rpb25NYXRyaWNlcz8udmFsdWU7XG4gIGlmIChBcnJheS5pc0FycmF5KHVuaWZvcm1OYW1lcykpIHtcbiAgICBjb25zdCBuYW1lcyA9IHVuaWZvcm1OYW1lcy5maWx0ZXIoKG5hbWUpOiBuYW1lIGlzIHN0cmluZyA9PiB0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycgJiYgbmFtZS5sZW5ndGggPiAwKTtcbiAgICBpZiAobmFtZXMubGVuZ3RoID4gMCkge1xuICAgICAgbm9kZUluc3RhbmNlLnNldERpc3RhbmNlQ29ycmVjdGlvblVuaWZvcm1OYW1lcyhuYW1lcyk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBjb25jcmV0ZSBzaGFkZXIgbm9kZSBpbnN0YW5jZXMgZnJvbSBhIEpTT04gc2hhZGVyIGdyYXBoIGRlZmluaXRpb24uXG4gKiBUaGlzIGZ1bmN0aW9uIGRlc2VyaWFsaXplcyB0aGUgSlNPTiByZXByZXNlbnRhdGlvbiBpbnRvIGFjdHVhbCBzaGFkZXIgbm9kZSBvYmplY3RzLFxuICogc2V0dGluZyB1cCB0aGVpciBwcm9wZXJ0aWVzLCBjb25uZWN0aW9ucywgYW5kIGRlZmF1bHQgdmFsdWVzIGJhc2VkIG9uIHRoZSBKU09OIGRhdGEuXG4gKlxuICogQHBhcmFtIGpzb24gLSBKU09OIG9iamVjdCBjb250YWluaW5nIHRoZSBjb21wbGV0ZSBzaGFkZXIgZ3JhcGggZGVmaW5pdGlvbiB3aXRoIG5vZGVzIGFuZCBjb25uZWN0aW9uc1xuICogQHJldHVybnMgT2JqZWN0IGNvbnRhaW5pbmcgbm9kZSBpbnN0YW5jZXMgcmVjb3JkIGFuZCBhcnJheSBvZiB0ZXh0dXJlIG5hbWVzIHVzZWRcbiAqIEB0aHJvd3MgRXJyb3IgaWYgdW5rbm93biBub2RlIHR5cGVzIGFyZSBlbmNvdW50ZXJlZCBvciBpZiBjb25uZWN0aW9ucyBjYW5ub3QgYmUgZXN0YWJsaXNoZWRcbiAqIEBwcml2YXRlXG4gKi9cbi8vIGJpb21lLWlnbm9yZSBsaW50L2NvbXBsZXhpdHkvbm9FeGNlc3NpdmVDb2duaXRpdmVDb21wbGV4aXR5OiBUaGlzIGZ1bmN0aW9uIGhhbmRsZXMgbWFueSBzaGFkZXIgbm9kZSB0eXBlcyBhbmQgcmVxdWlyZXMgYSBsYXJnZSBzd2l0Y2ggc3RhdGVtZW50XG5mdW5jdGlvbiBjb25zdHJ1Y3ROb2Rlcyhqc29uOiBTaGFkZXJOb2RlSnNvbik6IHtcbiAgbm9kZUluc3RhbmNlczogUmVjb3JkPHN0cmluZywgQWJzdHJhY3RTaGFkZXJOb2RlPjtcbiAgdGV4dHVyZUluZm9zOiB7IG5hbWU6IHN0cmluZzsgc3RhZ2U6IHN0cmluZzsgZGVmYXVsdFRleHR1cmU6IHN0cmluZyB9W107XG59IHtcbiAgLy8gQ3JlYXRlIE5vZGUgSW5zdGFuY2VzXG4gIGNvbnN0IG5vZGVJbnN0YW5jZXM6IFJlY29yZDxzdHJpbmcsIEFic3RyYWN0U2hhZGVyTm9kZT4gPSB7fTtcbiAgY29uc3Qgbm9kZXM6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcbiAgY29uc3QgdGV4dHVyZUluZm9zOiB7IG5hbWU6IHN0cmluZzsgc3RhZ2U6IHN0cmluZzsgZGVmYXVsdFRleHR1cmU6IHN0cmluZyB9W10gPSBbXTtcbiAgZm9yIChjb25zdCBub2RlIG9mIGpzb24ubm9kZXMpIHtcbiAgICBub2Rlc1tub2RlLmlkXSA9IG5vZGU7XG4gICAgc3dpdGNoIChub2RlLm5hbWUpIHtcbiAgICAgIGNhc2UgJ0NvbnN0YW50U2NhbGFyQm9vbCc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IENvbnN0YW50U2NhbGFyVmFyaWFibGVTaGFkZXJOb2RlKENvbXBvbmVudFR5cGUuQm9vbCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZS5zZXREZWZhdWx0SW5wdXRWYWx1ZShTY2FsYXIuZnJvbUNvcHlOdW1iZXIobm9kZS5jb250cm9scy5pbjEudmFsdWUgPyAxIDogMCkpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ0NvbnN0YW50U2NhbGFyRmxvYXQnOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBDb25zdGFudFNjYWxhclZhcmlhYmxlU2hhZGVyTm9kZShDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgbm9kZUluc3RhbmNlLnNldERlZmF1bHRJbnB1dFZhbHVlKFNjYWxhci5mcm9tQ29weU51bWJlcihub2RlLmNvbnRyb2xzLmluMS52YWx1ZSkpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ0NvbnN0YW50U2NhbGFyVWludCc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IENvbnN0YW50U2NhbGFyVmFyaWFibGVTaGFkZXJOb2RlKENvbXBvbmVudFR5cGUuVW5zaWduZWRJbnQpO1xuICAgICAgICBub2RlSW5zdGFuY2Uuc2V0RGVmYXVsdElucHV0VmFsdWUoU2NhbGFyLmZyb21Db3B5TnVtYmVyKG5vZGUuY29udHJvbHMuaW4xLnZhbHVlKSk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnQ29uc3RhbnRWZWN0b3IyRmxvYXQnOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBDb25zdGFudFZlY3RvcjJWYXJpYWJsZVNoYWRlck5vZGUoQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZS5zZXREZWZhdWx0SW5wdXRWYWx1ZShWZWN0b3IyLmZyb21Db3B5Mihub2RlLmNvbnRyb2xzLmluMS52YWx1ZSwgbm9kZS5jb250cm9scy5pbjIudmFsdWUpKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdDb25zdGFudFZlY3RvcjNGbG9hdCc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IENvbnN0YW50VmVjdG9yM1ZhcmlhYmxlU2hhZGVyTm9kZShDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgbm9kZUluc3RhbmNlLnNldERlZmF1bHRJbnB1dFZhbHVlKFxuICAgICAgICAgIFZlY3RvcjMuZnJvbUNvcHkzKG5vZGUuY29udHJvbHMuaW4xLnZhbHVlLCBub2RlLmNvbnRyb2xzLmluMi52YWx1ZSwgbm9kZS5jb250cm9scy5pbjMudmFsdWUpXG4gICAgICAgICk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnQ29uc3RhbnRWZWN0b3I0RmxvYXQnOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBDb25zdGFudFZlY3RvcjRWYXJpYWJsZVNoYWRlck5vZGUoQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZS5zZXREZWZhdWx0SW5wdXRWYWx1ZShcbiAgICAgICAgICBWZWN0b3I0LmZyb21Db3B5NChcbiAgICAgICAgICAgIG5vZGUuY29udHJvbHMuaW4xLnZhbHVlLFxuICAgICAgICAgICAgbm9kZS5jb250cm9scy5pbjIudmFsdWUsXG4gICAgICAgICAgICBub2RlLmNvbnRyb2xzLmluMy52YWx1ZSxcbiAgICAgICAgICAgIG5vZGUuY29udHJvbHMuaW40LnZhbHVlXG4gICAgICAgICAgKVxuICAgICAgICApO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1VuaWZvcm1TY2FsYXJGbG9hdCc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IFVuaWZvcm1EYXRhU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuU2NhbGFyLCBDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgbm9kZUluc3RhbmNlLnNldERlZmF1bHRJbnB1dFZhbHVlKCd2YWx1ZScsIFNjYWxhci5mcm9tQ29weU51bWJlcihub2RlLmNvbnRyb2xzLmluaXRpYWxWYWx1ZS52YWx1ZSkpO1xuICAgICAgICBub2RlSW5zdGFuY2Uuc2V0VW5pZm9ybURhdGFOYW1lKG5vZGUuY29udHJvbHMubmFtZS52YWx1ZSk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnVW5pZm9ybVZlY3RvcjJGbG9hdCc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IFVuaWZvcm1EYXRhU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuVmVjMiwgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZS5zZXREZWZhdWx0SW5wdXRWYWx1ZShcbiAgICAgICAgICAndmFsdWUnLFxuICAgICAgICAgIFZlY3RvcjIuZnJvbUNvcHkyKG5vZGUuY29udHJvbHMuaW5pdGlhbFgudmFsdWUsIG5vZGUuY29udHJvbHMuaW5pdGlhbFkudmFsdWUpXG4gICAgICAgICk7XG4gICAgICAgIG5vZGVJbnN0YW5jZS5zZXRVbmlmb3JtRGF0YU5hbWUobm9kZS5jb250cm9scy5uYW1lLnZhbHVlKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdVbmlmb3JtVmVjdG9yM0Zsb2F0Jzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgVW5pZm9ybURhdGFTaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5WZWMzLCBDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgbm9kZUluc3RhbmNlLnNldERlZmF1bHRJbnB1dFZhbHVlKFxuICAgICAgICAgICd2YWx1ZScsXG4gICAgICAgICAgVmVjdG9yMy5mcm9tQ29weTMobm9kZS5jb250cm9scy5pbml0aWFsWC52YWx1ZSwgbm9kZS5jb250cm9scy5pbml0aWFsWS52YWx1ZSwgbm9kZS5jb250cm9scy5pbml0aWFsWi52YWx1ZSlcbiAgICAgICAgKTtcbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFVuaWZvcm1EYXRhTmFtZShub2RlLmNvbnRyb2xzLm5hbWUudmFsdWUpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1VuaWZvcm1WZWN0b3I0RmxvYXQnOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBVbmlmb3JtRGF0YVNoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlZlYzQsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICBub2RlSW5zdGFuY2Uuc2V0RGVmYXVsdElucHV0VmFsdWUoXG4gICAgICAgICAgJ3ZhbHVlJyxcbiAgICAgICAgICBWZWN0b3I0LmZyb21Db3B5QXJyYXk0KFtcbiAgICAgICAgICAgIG5vZGUuY29udHJvbHMuaW5pdGlhbFgudmFsdWUsXG4gICAgICAgICAgICBub2RlLmNvbnRyb2xzLmluaXRpYWxZLnZhbHVlLFxuICAgICAgICAgICAgbm9kZS5jb250cm9scy5pbml0aWFsWi52YWx1ZSxcbiAgICAgICAgICAgIG5vZGUuY29udHJvbHMuaW5pdGlhbFcudmFsdWUsXG4gICAgICAgICAgXSlcbiAgICAgICAgKTtcbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFVuaWZvcm1EYXRhTmFtZShub2RlLmNvbnRyb2xzLm5hbWUudmFsdWUpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1RleHR1cmUyRCc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IFRleHR1cmUyRFNoYWRlck5vZGUoKTtcbiAgICAgICAgY29uc3QgdGV4dHVyZU5hbWUgPSBub2RlLmNvbnRyb2xzLm5hbWUudmFsdWU7XG4gICAgICAgIGNvbnN0IHNoYWRlclN0YWdlID0gbm9kZS5jb250cm9scy5zaGFkZXJTdGFnZS52YWx1ZTtcbiAgICAgICAgLy8gR2V0IHRoZSBkZWZhdWx0IHRleHR1cmUgdHlwZSBmcm9tIHRoZSBub2RlIGNvbnRyb2wgKGRlZmF1bHRzIHRvIGR1bW15V2hpdGVUZXh0dXJlIGlmIG5vdCBzcGVjaWZpZWQpXG4gICAgICAgIGNvbnN0IGRlZmF1bHRUZXh0dXJlID0gbm9kZS5jb250cm9scy5kZWZhdWx0VGV4dHVyZT8udmFsdWUgPz8gJ2R1bW15V2hpdGVUZXh0dXJlJztcbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFRleHR1cmVOYW1lKHRleHR1cmVOYW1lKTtcbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFNoYWRlclN0YWdlKHNoYWRlclN0YWdlKTtcbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFNyZ2JGbGFnKG5vZGUuY29udHJvbHMuc1JHQj8udmFsdWUgPz8gdHJ1ZSk7XG4gICAgICAgIHRleHR1cmVJbmZvcy5wdXNoKHsgbmFtZTogdGV4dHVyZU5hbWUsIHN0YWdlOiBzaGFkZXJTdGFnZSwgZGVmYXVsdFRleHR1cmUgfSk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnVGltZSc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IFRpbWVTaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnQWRkJzoge1xuICAgICAgICBjb25zdCBzb2NrZXROYW1lID0gbm9kZS5vdXRwdXRzLm91dDEuc29ja2V0Lm5hbWU7XG4gICAgICAgIGxldCBub2RlSW5zdGFuY2U6IEFkZFNoYWRlck5vZGU7XG4gICAgICAgIGlmIChzb2NrZXROYW1lLnN0YXJ0c1dpdGgoJ1NjYWxhcicpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IEFkZFNoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlNjYWxhciwgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdWZWN0b3IyJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgQWRkU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuVmVjMiwgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdWZWN0b3IzJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgQWRkU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuVmVjMywgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdWZWN0b3I0JykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgQWRkU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuVmVjNCwgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoYEFkZCBub2RlOiBVbmtub3duIHNvY2tldCBuYW1lOiAke3NvY2tldE5hbWV9YCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFNoYWRlclN0YWdlKG5vZGUuY29udHJvbHMuc2hhZGVyU3RhZ2UudmFsdWUpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ01pbic6IHtcbiAgICAgICAgY29uc3Qgc29ja2V0TmFtZSA9IG5vZGUub3V0cHV0cy5vdXQxLnNvY2tldC5uYW1lO1xuICAgICAgICBsZXQgbm9kZUluc3RhbmNlOiBNaW5TaGFkZXJOb2RlO1xuICAgICAgICBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdTY2FsYXInKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBNaW5TaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5TY2FsYXIsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2UgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnVmVjdG9yMicpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IE1pblNoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlZlYzIsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2UgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnVmVjdG9yMycpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IE1pblNoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlZlYzMsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2UgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnVmVjdG9yNCcpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IE1pblNoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlZlYzQsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKGBNaW4gbm9kZTogVW5rbm93biBzb2NrZXQgbmFtZTogJHtzb2NrZXROYW1lfWApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG5vZGVJbnN0YW5jZS5zZXRTaGFkZXJTdGFnZShub2RlLmNvbnRyb2xzLnNoYWRlclN0YWdlLnZhbHVlKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdBYnMnOiB7XG4gICAgICAgIGNvbnN0IHNvY2tldE5hbWUgPSBub2RlLm91dHB1dHMub3V0MS5zb2NrZXQubmFtZTtcbiAgICAgICAgbGV0IG5vZGVJbnN0YW5jZTogQWJzU2hhZGVyTm9kZTtcbiAgICAgICAgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnU2NhbGFyJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgQWJzU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuU2NhbGFyLCBDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgfSBlbHNlIGlmIChzb2NrZXROYW1lLnN0YXJ0c1dpdGgoJ1ZlY3RvcjInKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBBYnNTaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5WZWMyLCBDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgfSBlbHNlIGlmIChzb2NrZXROYW1lLnN0YXJ0c1dpdGgoJ1ZlY3RvcjMnKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBBYnNTaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5WZWMzLCBDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgfSBlbHNlIGlmIChzb2NrZXROYW1lLnN0YXJ0c1dpdGgoJ1ZlY3RvcjQnKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBBYnNTaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5WZWM0LCBDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcihgQWJzIG5vZGU6IFVua25vd24gc29ja2V0IG5hbWU6ICR7c29ja2V0TmFtZX1gKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBub2RlSW5zdGFuY2Uuc2V0U2hhZGVyU3RhZ2Uobm9kZS5jb250cm9scy5zaGFkZXJTdGFnZS52YWx1ZSk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnQWNvcyc6IHtcbiAgICAgICAgY29uc3Qgc29ja2V0TmFtZSA9IG5vZGUub3V0cHV0cy5vdXQxLnNvY2tldC5uYW1lO1xuICAgICAgICBsZXQgbm9kZUluc3RhbmNlOiBBY29zU2hhZGVyTm9kZTtcbiAgICAgICAgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnU2NhbGFyJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgQWNvc1NoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlNjYWxhciwgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdWZWN0b3IyJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgQWNvc1NoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlZlYzIsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2UgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnVmVjdG9yMycpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IEFjb3NTaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5WZWMzLCBDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgfSBlbHNlIGlmIChzb2NrZXROYW1lLnN0YXJ0c1dpdGgoJ1ZlY3RvcjQnKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBBY29zU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuVmVjNCwgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoYEFjb3Mgbm9kZTogVW5rbm93biBzb2NrZXQgbmFtZTogJHtzb2NrZXROYW1lfWApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG5vZGVJbnN0YW5jZS5zZXRTaGFkZXJTdGFnZShub2RlLmNvbnRyb2xzLnNoYWRlclN0YWdlLnZhbHVlKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdBdGFuMic6IHtcbiAgICAgICAgY29uc3Qgc29ja2V0TmFtZSA9IG5vZGUub3V0cHV0cy5vdXQxLnNvY2tldC5uYW1lO1xuICAgICAgICBsZXQgbm9kZUluc3RhbmNlOiBBdGFuMlNoYWRlck5vZGU7XG4gICAgICAgIGlmIChzb2NrZXROYW1lLnN0YXJ0c1dpdGgoJ1NjYWxhcicpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IEF0YW4yU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuU2NhbGFyLCBDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgfSBlbHNlIGlmIChzb2NrZXROYW1lLnN0YXJ0c1dpdGgoJ1ZlY3RvcjInKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBBdGFuMlNoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlZlYzIsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2UgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnVmVjdG9yMycpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IEF0YW4yU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuVmVjMywgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdWZWN0b3I0JykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgQXRhbjJTaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5WZWM0LCBDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcihgQXRhbjIgbm9kZTogVW5rbm93biBzb2NrZXQgbmFtZTogJHtzb2NrZXROYW1lfWApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG5vZGVJbnN0YW5jZS5zZXRTaGFkZXJTdGFnZShub2RlLmNvbnRyb2xzLnNoYWRlclN0YWdlLnZhbHVlKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdTaW4nOiB7XG4gICAgICAgIGNvbnN0IHNvY2tldE5hbWUgPSBub2RlLm91dHB1dHMub3V0MS5zb2NrZXQubmFtZTtcbiAgICAgICAgbGV0IG5vZGVJbnN0YW5jZTogU2luU2hhZGVyTm9kZTtcbiAgICAgICAgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnU2NhbGFyJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgU2luU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuU2NhbGFyLCBDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgfSBlbHNlIGlmIChzb2NrZXROYW1lLnN0YXJ0c1dpdGgoJ1ZlY3RvcjInKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBTaW5TaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5WZWMyLCBDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgfSBlbHNlIGlmIChzb2NrZXROYW1lLnN0YXJ0c1dpdGgoJ1ZlY3RvcjMnKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBTaW5TaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5WZWMzLCBDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgfSBlbHNlIGlmIChzb2NrZXROYW1lLnN0YXJ0c1dpdGgoJ1ZlY3RvcjQnKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBTaW5TaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5WZWM0LCBDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcihgU2luIG5vZGU6IFVua25vd24gc29ja2V0IG5hbWU6ICR7c29ja2V0TmFtZX1gKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBub2RlSW5zdGFuY2Uuc2V0U2hhZGVyU3RhZ2Uobm9kZS5jb250cm9scy5zaGFkZXJTdGFnZS52YWx1ZSk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnQ29zJzoge1xuICAgICAgICBjb25zdCBzb2NrZXROYW1lID0gbm9kZS5vdXRwdXRzLm91dDEuc29ja2V0Lm5hbWU7XG4gICAgICAgIGxldCBub2RlSW5zdGFuY2U6IENvc1NoYWRlck5vZGU7XG4gICAgICAgIGlmIChzb2NrZXROYW1lLnN0YXJ0c1dpdGgoJ1NjYWxhcicpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IENvc1NoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlNjYWxhciwgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdWZWN0b3IyJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgQ29zU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuVmVjMiwgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdWZWN0b3IzJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgQ29zU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuVmVjMywgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdWZWN0b3I0JykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgQ29zU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuVmVjNCwgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoYENvcyBub2RlOiBVbmtub3duIHNvY2tldCBuYW1lOiAke3NvY2tldE5hbWV9YCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFNoYWRlclN0YWdlKG5vZGUuY29udHJvbHMuc2hhZGVyU3RhZ2UudmFsdWUpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1Rhbic6IHtcbiAgICAgICAgY29uc3Qgc29ja2V0TmFtZSA9IG5vZGUub3V0cHV0cy5vdXQxLnNvY2tldC5uYW1lO1xuICAgICAgICBsZXQgbm9kZUluc3RhbmNlOiBUYW5TaGFkZXJOb2RlO1xuICAgICAgICBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdTY2FsYXInKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBUYW5TaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5TY2FsYXIsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2UgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnVmVjdG9yMicpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IFRhblNoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlZlYzIsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2UgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnVmVjdG9yMycpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IFRhblNoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlZlYzMsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2UgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnVmVjdG9yNCcpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IFRhblNoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlZlYzQsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKGBUYW4gbm9kZTogVW5rbm93biBzb2NrZXQgbmFtZTogJHtzb2NrZXROYW1lfWApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG5vZGVJbnN0YW5jZS5zZXRTaGFkZXJTdGFnZShub2RlLmNvbnRyb2xzLnNoYWRlclN0YWdlLnZhbHVlKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdTdGVwJzoge1xuICAgICAgICBjb25zdCBzb2NrZXROYW1lID0gbm9kZS5vdXRwdXRzLm91dDEuc29ja2V0Lm5hbWU7XG4gICAgICAgIGxldCBub2RlSW5zdGFuY2U6IFN0ZXBTaGFkZXJOb2RlO1xuICAgICAgICBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdTY2FsYXInKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBTdGVwU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuU2NhbGFyLCBDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgfSBlbHNlIGlmIChzb2NrZXROYW1lLnN0YXJ0c1dpdGgoJ1ZlY3RvcjInKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBTdGVwU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuVmVjMiwgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdWZWN0b3IzJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgU3RlcFNoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlZlYzMsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2UgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnVmVjdG9yNCcpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IFN0ZXBTaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5WZWM0LCBDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcihgQWRkIG5vZGU6IFVua25vd24gc29ja2V0IG5hbWU6ICR7c29ja2V0TmFtZX1gKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBub2RlSW5zdGFuY2Uuc2V0U2hhZGVyU3RhZ2Uobm9kZS5jb250cm9scy5zaGFkZXJTdGFnZS52YWx1ZSk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnU21vb3RoU3RlcCc6IHtcbiAgICAgICAgY29uc3Qgc29ja2V0TmFtZSA9IG5vZGUub3V0cHV0cy5vdXQxLnNvY2tldC5uYW1lO1xuICAgICAgICBsZXQgbm9kZUluc3RhbmNlOiBTdGVwU2hhZGVyTm9kZTtcbiAgICAgICAgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnU2NhbGFyJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgU21vb3RoU3RlcFNoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlNjYWxhciwgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdWZWN0b3IyJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgU21vb3RoU3RlcFNoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlZlYzIsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2UgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnVmVjdG9yMycpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IFNtb290aFN0ZXBTaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5WZWMzLCBDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgfSBlbHNlIGlmIChzb2NrZXROYW1lLnN0YXJ0c1dpdGgoJ1ZlY3RvcjQnKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBTbW9vdGhTdGVwU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuVmVjNCwgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoYEFkZCBub2RlOiBVbmtub3duIHNvY2tldCBuYW1lOiAke3NvY2tldE5hbWV9YCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFNoYWRlclN0YWdlKG5vZGUuY29udHJvbHMuc2hhZGVyU3RhZ2UudmFsdWUpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ0NsYW1wJzoge1xuICAgICAgICBjb25zdCBzb2NrZXROYW1lID0gbm9kZS5vdXRwdXRzLm91dDEuc29ja2V0Lm5hbWU7XG4gICAgICAgIGxldCBub2RlSW5zdGFuY2U6IENsYW1wU2hhZGVyTm9kZTtcbiAgICAgICAgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnU2NhbGFyJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgQ2xhbXBTaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5TY2FsYXIsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2UgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnVmVjdG9yMicpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IENsYW1wU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuVmVjMiwgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdWZWN0b3IzJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgQ2xhbXBTaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5WZWMzLCBDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgfSBlbHNlIGlmIChzb2NrZXROYW1lLnN0YXJ0c1dpdGgoJ1ZlY3RvcjQnKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBDbGFtcFNoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlZlYzQsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKGBDbGFtcCBub2RlOiBVbmtub3duIHNvY2tldCBuYW1lOiAke3NvY2tldE5hbWV9YCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFNoYWRlclN0YWdlKG5vZGUuY29udHJvbHMuc2hhZGVyU3RhZ2UudmFsdWUpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1JlbWFwJzoge1xuICAgICAgICBjb25zdCBzb2NrZXROYW1lID0gbm9kZS5vdXRwdXRzLm91dDEuc29ja2V0Lm5hbWU7XG4gICAgICAgIGxldCBub2RlSW5zdGFuY2U6IFJlbWFwU2hhZGVyTm9kZTtcbiAgICAgICAgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnU2NhbGFyJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgUmVtYXBTaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5TY2FsYXIsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2UgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnVmVjdG9yMicpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IFJlbWFwU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuVmVjMiwgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdWZWN0b3IzJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgUmVtYXBTaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5WZWMzLCBDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgfSBlbHNlIGlmIChzb2NrZXROYW1lLnN0YXJ0c1dpdGgoJ1ZlY3RvcjQnKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBSZW1hcFNoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlZlYzQsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKGBSZW1hcCBub2RlOiBVbmtub3duIHNvY2tldCBuYW1lOiAke3NvY2tldE5hbWV9YCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFNoYWRlclN0YWdlKG5vZGUuY29udHJvbHMuc2hhZGVyU3RhZ2UudmFsdWUpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ05vcm1hbGl6ZSc6IHtcbiAgICAgICAgY29uc3Qgc29ja2V0TmFtZSA9IG5vZGUub3V0cHV0cy5vdXQxLnNvY2tldC5uYW1lO1xuICAgICAgICBsZXQgbm9kZUluc3RhbmNlOiBOb3JtYWxpemVTaGFkZXJOb2RlO1xuICAgICAgICBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdWZWN0b3IyJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgTm9ybWFsaXplU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuVmVjMiwgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdWZWN0b3IzJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgTm9ybWFsaXplU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuVmVjMywgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdWZWN0b3I0JykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgTm9ybWFsaXplU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuVmVjNCwgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoYE5vcm1hbGl6ZSBub2RlOiBVbmtub3duIHNvY2tldCBuYW1lOiAke3NvY2tldE5hbWV9YCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFNoYWRlclN0YWdlKG5vZGUuY29udHJvbHMuc2hhZGVyU3RhZ2UudmFsdWUpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ0RvdCc6IHtcbiAgICAgICAgY29uc3Qgc29ja2V0TmFtZSA9IG5vZGUuaW5wdXRzLmluMS5zb2NrZXQubmFtZTtcbiAgICAgICAgbGV0IG5vZGVJbnN0YW5jZTogRG90UHJvZHVjdFNoYWRlck5vZGU7XG4gICAgICAgIGlmIChzb2NrZXROYW1lLnN0YXJ0c1dpdGgoJ1ZlY3RvcjInKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBEb3RQcm9kdWN0U2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuVmVjMiwgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdWZWN0b3IzJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgRG90UHJvZHVjdFNoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlZlYzMsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2UgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnVmVjdG9yNCcpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IERvdFByb2R1Y3RTaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5WZWM0LCBDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcihgRG90IG5vZGU6IFVua25vd24gc29ja2V0IG5hbWU6ICR7c29ja2V0TmFtZX1gKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBub2RlSW5zdGFuY2Uuc2V0U2hhZGVyU3RhZ2Uobm9kZS5jb250cm9scy5zaGFkZXJTdGFnZS52YWx1ZSk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnTGVuZ3RoJzoge1xuICAgICAgICBjb25zdCBzb2NrZXROYW1lID0gbm9kZS5pbnB1dHMuaW4xLnNvY2tldC5uYW1lO1xuXG4gICAgICAgIC8vIERldGVybWluZSBjb21wb25lbnQgdHlwZSBmcm9tIHNvY2tldCBuYW1lXG4gICAgICAgIGxldCBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlRW51bSA9IENvbXBvbmVudFR5cGUuRmxvYXQ7XG4gICAgICAgIGlmIChzb2NrZXROYW1lLmluY2x1ZGVzKCc8aW50PicpKSB7XG4gICAgICAgICAgY29tcG9uZW50VHlwZSA9IENvbXBvbmVudFR5cGUuSW50O1xuICAgICAgICB9IGVsc2UgaWYgKHNvY2tldE5hbWUuaW5jbHVkZXMoJzx1aW50PicpKSB7XG4gICAgICAgICAgY29tcG9uZW50VHlwZSA9IENvbXBvbmVudFR5cGUuVW5zaWduZWRJbnQ7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbm9kZUluc3RhbmNlOiBMZW5ndGhTaGFkZXJOb2RlO1xuICAgICAgICBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdWZWN0b3IyJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgTGVuZ3RoU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuVmVjMiwgY29tcG9uZW50VHlwZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdWZWN0b3IzJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgTGVuZ3RoU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuVmVjMywgY29tcG9uZW50VHlwZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdWZWN0b3I0JykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgTGVuZ3RoU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuVmVjNCwgY29tcG9uZW50VHlwZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoYExlbmd0aCBub2RlOiBVbmtub3duIHNvY2tldCBuYW1lOiAke3NvY2tldE5hbWV9YCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFNoYWRlclN0YWdlKG5vZGUuY29udHJvbHMuc2hhZGVyU3RhZ2UudmFsdWUpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ011bHRpcGx5Jzoge1xuICAgICAgICBjb25zdCBzb2NrZXROYW1lID0gbm9kZS5vdXRwdXRzLm91dDEuc29ja2V0Lm5hbWU7XG4gICAgICAgIGxldCBub2RlSW5zdGFuY2U6IE11bHRpcGx5U2hhZGVyTm9kZTtcbiAgICAgICAgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnU2NhbGFyJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgTXVsdGlwbHlTaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5TY2FsYXIsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2UgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnVmVjdG9yMicpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IE11bHRpcGx5U2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuVmVjMiwgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdWZWN0b3IzJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgTXVsdGlwbHlTaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5WZWMzLCBDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgfSBlbHNlIGlmIChzb2NrZXROYW1lLnN0YXJ0c1dpdGgoJ1ZlY3RvcjQnKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBNdWx0aXBseVNoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlZlYzQsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2UgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnTWF0cml4MicpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IE11bHRpcGx5U2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuTWF0MiwgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdNYXRyaXgzJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgTXVsdGlwbHlTaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5NYXQzLCBDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgfSBlbHNlIGlmIChzb2NrZXROYW1lLnN0YXJ0c1dpdGgoJ01hdHJpeDQnKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBNdWx0aXBseVNoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLk1hdDQsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKGBNdWx0aXBseSBub2RlOiBVbmtub3duIHNvY2tldCBuYW1lOiAke3NvY2tldE5hbWV9YCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFNoYWRlclN0YWdlKG5vZGUuY29udHJvbHMuc2hhZGVyU3RhZ2UudmFsdWUpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1RyYW5zZm9ybSc6IHtcbiAgICAgICAgY29uc3Qgc29ja2V0TmFtZSA9IG5vZGUub3V0cHV0cy5vdXQxLnNvY2tldC5uYW1lO1xuICAgICAgICBsZXQgbm9kZUluc3RhbmNlOiBUcmFuc2Zvcm1TaGFkZXJOb2RlO1xuICAgICAgICBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdWZWN0b3IyJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgVHJhbnNmb3JtU2hhZGVyTm9kZShcbiAgICAgICAgICAgIENvbXBvc2l0aW9uVHlwZS5NYXQyLFxuICAgICAgICAgICAgQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgICAgICAgIENvbXBvc2l0aW9uVHlwZS5WZWMyLFxuICAgICAgICAgICAgQ29tcG9uZW50VHlwZS5GbG9hdFxuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdWZWN0b3IzJykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgVHJhbnNmb3JtU2hhZGVyTm9kZShcbiAgICAgICAgICAgIENvbXBvc2l0aW9uVHlwZS5NYXQzLFxuICAgICAgICAgICAgQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgICAgICAgIENvbXBvc2l0aW9uVHlwZS5WZWMzLFxuICAgICAgICAgICAgQ29tcG9uZW50VHlwZS5GbG9hdFxuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5zdGFydHNXaXRoKCdWZWN0b3I0JykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgVHJhbnNmb3JtU2hhZGVyTm9kZShcbiAgICAgICAgICAgIENvbXBvc2l0aW9uVHlwZS5NYXQ0LFxuICAgICAgICAgICAgQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgICAgICAgIENvbXBvc2l0aW9uVHlwZS5WZWM0LFxuICAgICAgICAgICAgQ29tcG9uZW50VHlwZS5GbG9hdFxuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoYFRyYW5zZm9ybSBub2RlOiBVbmtub3duIHNvY2tldCBuYW1lOiAke3NvY2tldE5hbWV9YCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFNoYWRlclN0YWdlKG5vZGUuY29udHJvbHMuc2hhZGVyU3RhZ2UudmFsdWUpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1NwbGl0VmVjdG9yJzoge1xuICAgICAgICAvLyBEZXRlcm1pbmUgY29tcG9uZW50IHR5cGUgZnJvbSBpbnB1dCBzb2NrZXQgbmFtZVxuICAgICAgICBsZXQgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZUVudW0gPSBDb21wb25lbnRUeXBlLkZsb2F0O1xuICAgICAgICBjb25zdCBpbnB1dFNvY2tldE5hbWUgPVxuICAgICAgICAgIG5vZGUuaW5wdXRzLmluWFlaVz8uc29ja2V0Py5uYW1lIHx8IG5vZGUuaW5wdXRzLmluWFlaPy5zb2NrZXQ/Lm5hbWUgfHwgbm9kZS5pbnB1dHMuaW5YWT8uc29ja2V0Py5uYW1lIHx8ICcnO1xuICAgICAgICBpZiAoaW5wdXRTb2NrZXROYW1lLmluY2x1ZGVzKCc8aW50PicpKSB7XG4gICAgICAgICAgY29tcG9uZW50VHlwZSA9IENvbXBvbmVudFR5cGUuSW50O1xuICAgICAgICB9IGVsc2UgaWYgKGlucHV0U29ja2V0TmFtZS5pbmNsdWRlcygnPHVpbnQ+JykpIHtcbiAgICAgICAgICBjb21wb25lbnRUeXBlID0gQ29tcG9uZW50VHlwZS5VbnNpZ25lZEludDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgU3BsaXRWZWN0b3JTaGFkZXJOb2RlKGNvbXBvbmVudFR5cGUpO1xuICAgICAgICBub2RlSW5zdGFuY2Uuc2V0U2hhZGVyU3RhZ2Uobm9kZS5jb250cm9scy5zaGFkZXJTdGFnZS52YWx1ZSk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnTWVyZ2VWZWN0b3InOiB7XG4gICAgICAgIC8vIERldGVybWluZSBjb21wb25lbnQgdHlwZSBmcm9tIG91dHB1dCBzb2NrZXQgbmFtZVxuICAgICAgICBsZXQgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZUVudW0gPSBDb21wb25lbnRUeXBlLkZsb2F0O1xuICAgICAgICBjb25zdCBvdXRwdXRTb2NrZXROYW1lID0gbm9kZS5vdXRwdXRzLm91dFhZWlc/LnNvY2tldD8ubmFtZSB8fCAnJztcbiAgICAgICAgaWYgKG91dHB1dFNvY2tldE5hbWUuaW5jbHVkZXMoJzxpbnQ+JykpIHtcbiAgICAgICAgICBjb21wb25lbnRUeXBlID0gQ29tcG9uZW50VHlwZS5JbnQ7XG4gICAgICAgIH0gZWxzZSBpZiAob3V0cHV0U29ja2V0TmFtZS5pbmNsdWRlcygnPHVpbnQ+JykpIHtcbiAgICAgICAgICBjb21wb25lbnRUeXBlID0gQ29tcG9uZW50VHlwZS5VbnNpZ25lZEludDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgTWVyZ2VWZWN0b3JTaGFkZXJOb2RlKGNvbXBvbmVudFR5cGUpO1xuICAgICAgICBub2RlSW5zdGFuY2Uuc2V0U2hhZGVyU3RhZ2Uobm9kZS5jb250cm9scy5zaGFkZXJTdGFnZS52YWx1ZSk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnQ2FzdFRvRmxvYXQnOiB7XG4gICAgICAgIC8vIERldGVybWluZSBjb21wb3NpdGlvbiB0eXBlIGFuZCBpbnB1dCBjb21wb25lbnQgdHlwZSBmcm9tIHNvY2tldCBuYW1lc1xuICAgICAgICBjb25zdCBpbnB1dFNvY2tldE5hbWUgPSBub2RlLmlucHV0cy5pbjE/LnNvY2tldD8ubmFtZSB8fCAnJztcbiAgICAgICAgY29uc3Qgb3V0cHV0U29ja2V0TmFtZSA9IG5vZGUub3V0cHV0cy5vdXQxPy5zb2NrZXQ/Lm5hbWUgfHwgJyc7XG5cbiAgICAgICAgLy8gRGV0ZXJtaW5lIGlucHV0IGNvbXBvbmVudCB0eXBlXG4gICAgICAgIGxldCBpbnB1dENvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGVFbnVtID0gQ29tcG9uZW50VHlwZS5JbnQ7XG4gICAgICAgIGlmIChpbnB1dFNvY2tldE5hbWUuaW5jbHVkZXMoJzxib29sPicpKSB7XG4gICAgICAgICAgaW5wdXRDb21wb25lbnRUeXBlID0gQ29tcG9uZW50VHlwZS5Cb29sO1xuICAgICAgICB9IGVsc2UgaWYgKGlucHV0U29ja2V0TmFtZS5pbmNsdWRlcygnPGludD4nKSkge1xuICAgICAgICAgIGlucHV0Q29tcG9uZW50VHlwZSA9IENvbXBvbmVudFR5cGUuSW50O1xuICAgICAgICB9IGVsc2UgaWYgKGlucHV0U29ja2V0TmFtZS5pbmNsdWRlcygnPHVpbnQ+JykpIHtcbiAgICAgICAgICBpbnB1dENvbXBvbmVudFR5cGUgPSBDb21wb25lbnRUeXBlLlVuc2lnbmVkSW50O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGV0ZXJtaW5lIGNvbXBvc2l0aW9uIHR5cGUgZnJvbSBvdXRwdXQgc29ja2V0IGFuZCBjcmVhdGUgbm9kZVxuICAgICAgICBsZXQgbm9kZUluc3RhbmNlOiBDYXN0VG9GbG9hdFNoYWRlck5vZGU7XG4gICAgICAgIGlmIChvdXRwdXRTb2NrZXROYW1lLmluY2x1ZGVzKCdWZWN0b3I0JykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgQ2FzdFRvRmxvYXRTaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5WZWM0LCBpbnB1dENvbXBvbmVudFR5cGUpO1xuICAgICAgICB9IGVsc2UgaWYgKG91dHB1dFNvY2tldE5hbWUuaW5jbHVkZXMoJ1ZlY3RvcjMnKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBDYXN0VG9GbG9hdFNoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlZlYzMsIGlucHV0Q29tcG9uZW50VHlwZSk7XG4gICAgICAgIH0gZWxzZSBpZiAob3V0cHV0U29ja2V0TmFtZS5pbmNsdWRlcygnVmVjdG9yMicpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IENhc3RUb0Zsb2F0U2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuVmVjMiwgaW5wdXRDb21wb25lbnRUeXBlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgQ2FzdFRvRmxvYXRTaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5TY2FsYXIsIGlucHV0Q29tcG9uZW50VHlwZSk7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFNoYWRlclN0YWdlKG5vZGUuY29udHJvbHMuc2hhZGVyU3RhZ2UudmFsdWUpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1Byb2Nlc3NHZW9tZXRyeSc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IFByb2Nlc3NHZW9tZXRyeVNoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdBdHRyaWJ1dGVDb2xvcic6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IEF0dHJpYnV0ZUNvbG9yU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ0F0dHJpYnV0ZU5vcm1hbCc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IEF0dHJpYnV0ZU5vcm1hbFNoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdBdHRyaWJ1dGVQb3NpdGlvbic6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IEF0dHJpYnV0ZVBvc2l0aW9uU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ0F0dHJpYnV0ZVRhbmdlbnQnOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBBdHRyaWJ1dGVUYW5nZW50U2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ0F0dHJpYnV0ZVRleGNvb3JkJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgQXR0cmlidXRlVGV4Y29vcmRTaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnQXR0cmlidXRlSm9pbnQnOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBBdHRyaWJ1dGVKb2ludFNoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdBdHRyaWJ1dGVXZWlnaHQnOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBBdHRyaWJ1dGVXZWlnaHRTaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnQXR0cmlidXRlSW5zdGFuY2VJZHMnOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBBdHRyaWJ1dGVJbnN0YW5jZUlkc1NoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdXb3JsZE1hdHJpeCc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IFdvcmxkTWF0cml4U2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1ZpZXdNYXRyaXgnOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBWaWV3TWF0cml4U2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1Byb2plY3Rpb25NYXRyaXgnOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBQcm9qZWN0aW9uTWF0cml4U2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ05vcm1hbE1hdHJpeCc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IE5vcm1hbE1hdHJpeFNoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICAvLyBjYXNlICdJZic6IHtcbiAgICAgIC8vICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IElmU3RhdGVtZW50U2hhZGVyTm9kZSgpO1xuICAgICAgLy8gICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgLy8gICBicmVhaztcbiAgICAgIC8vIH1cbiAgICAgIC8vIGNhc2UgJ0Jsb2NrQmVnaW4nOiB7XG4gICAgICAvLyAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBCbG9ja0JlZ2luU2hhZGVyTm9kZSgpO1xuICAgICAgLy8gICBmb3IgKGNvbnN0IG91dHB1dE5hbWUgaW4gbm9kZS5vdXRwdXRzKSB7XG4gICAgICAvLyAgICAgY29uc3QgY29tcG9zaXRpb25UeXBlID0gZ2V0Q29tcG9zaXRpb25UeXBlKG91dHB1dE5hbWUpO1xuICAgICAgLy8gICAgIG5vZGVJbnN0YW5jZS5hZGRJbnB1dEFuZE91dHB1dChjb21wb3NpdGlvblR5cGUsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgLy8gICB9XG4gICAgICAvLyAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAvLyAgIGJyZWFrO1xuICAgICAgLy8gfVxuICAgICAgLy8gY2FzZSAnQmxvY2tFbmQnOiB7XG4gICAgICAvLyAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBCbG9ja0VuZFNoYWRlck5vZGUoKTtcbiAgICAgIC8vICAgZm9yIChjb25zdCBvdXRwdXROYW1lIGluIG5vZGUub3V0cHV0cykge1xuICAgICAgLy8gICAgIGNvbnN0IGNvbXBvc2l0aW9uVHlwZSA9IGdldENvbXBvc2l0aW9uVHlwZShvdXRwdXROYW1lKTtcbiAgICAgIC8vICAgICBub2RlSW5zdGFuY2UuYWRkSW5wdXRBbmRPdXRwdXQoY29tcG9zaXRpb25UeXBlLCBDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgIC8vICAgfVxuICAgICAgLy8gICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgLy8gICBicmVhaztcbiAgICAgIC8vIH1cbiAgICAgIGNhc2UgJ0dyZWF0ZXInOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBHcmVhdGVyU2hhZGVyTm9kZShDb21wb3NpdGlvblR5cGUuU2NhbGFyLCBDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdMZXNzVGhhbic6IHtcbiAgICAgICAgY29uc3Qgc29ja2V0TmFtZSA9IG5vZGUuaW5wdXRzLmluMS5zb2NrZXQubmFtZTtcbiAgICAgICAgbGV0IG5vZGVJbnN0YW5jZTogTGVzc1RoYW5TaGFkZXJOb2RlO1xuICAgICAgICBpZiAoc29ja2V0TmFtZS5pbmNsdWRlcygnPGZsb2F0PicpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IExlc3NUaGFuU2hhZGVyTm9kZShDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgfSBlbHNlIGlmIChzb2NrZXROYW1lLmluY2x1ZGVzKCc8aW50PicpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IExlc3NUaGFuU2hhZGVyTm9kZShDb21wb25lbnRUeXBlLkludCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5pbmNsdWRlcygnPHVpbnQ+JykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgTGVzc1RoYW5TaGFkZXJOb2RlKENvbXBvbmVudFR5cGUuVW5zaWduZWRJbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKGBMZXNzVGhhbiBub2RlOiBVbmtub3duIHNvY2tldCBuYW1lOiAke3NvY2tldE5hbWV9YCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFNoYWRlclN0YWdlKG5vZGUuY29udHJvbHMuc2hhZGVyU3RhZ2UudmFsdWUpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ0xlc3NPckVxdWFsJzoge1xuICAgICAgICBjb25zdCBzb2NrZXROYW1lID0gbm9kZS5pbnB1dHMuaW4xLnNvY2tldC5uYW1lO1xuICAgICAgICBsZXQgbm9kZUluc3RhbmNlOiBMZXNzT3JFcXVhbFNoYWRlck5vZGU7XG4gICAgICAgIGlmIChzb2NrZXROYW1lLmluY2x1ZGVzKCc8ZmxvYXQ+JykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgTGVzc09yRXF1YWxTaGFkZXJOb2RlKENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2UgaWYgKHNvY2tldE5hbWUuaW5jbHVkZXMoJzxpbnQ+JykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgTGVzc09yRXF1YWxTaGFkZXJOb2RlKENvbXBvbmVudFR5cGUuSW50KTtcbiAgICAgICAgfSBlbHNlIGlmIChzb2NrZXROYW1lLmluY2x1ZGVzKCc8dWludD4nKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBMZXNzT3JFcXVhbFNoYWRlck5vZGUoQ29tcG9uZW50VHlwZS5VbnNpZ25lZEludCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoYExlc3NPckVxdWFsIG5vZGU6IFVua25vd24gc29ja2V0IG5hbWU6ICR7c29ja2V0TmFtZX1gKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBub2RlSW5zdGFuY2Uuc2V0U2hhZGVyU3RhZ2Uobm9kZS5jb250cm9scy5zaGFkZXJTdGFnZS52YWx1ZSk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnR3JlYXRlclRoYW4nOiB7XG4gICAgICAgIGNvbnN0IHNvY2tldE5hbWUgPSBub2RlLmlucHV0cy5pbjEuc29ja2V0Lm5hbWU7XG4gICAgICAgIGxldCBub2RlSW5zdGFuY2U6IEdyZWF0ZXJUaGFuU2hhZGVyTm9kZTtcbiAgICAgICAgaWYgKHNvY2tldE5hbWUuaW5jbHVkZXMoJzxmbG9hdD4nKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBHcmVhdGVyVGhhblNoYWRlck5vZGUoQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5pbmNsdWRlcygnPGludD4nKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBHcmVhdGVyVGhhblNoYWRlck5vZGUoQ29tcG9uZW50VHlwZS5JbnQpO1xuICAgICAgICB9IGVsc2UgaWYgKHNvY2tldE5hbWUuaW5jbHVkZXMoJzx1aW50PicpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IEdyZWF0ZXJUaGFuU2hhZGVyTm9kZShDb21wb25lbnRUeXBlLlVuc2lnbmVkSW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcihgR3JlYXRlclRoYW4gbm9kZTogVW5rbm93biBzb2NrZXQgbmFtZTogJHtzb2NrZXROYW1lfWApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG5vZGVJbnN0YW5jZS5zZXRTaGFkZXJTdGFnZShub2RlLmNvbnRyb2xzLnNoYWRlclN0YWdlLnZhbHVlKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdHcmVhdGVyT3JFcXVhbCc6IHtcbiAgICAgICAgY29uc3Qgc29ja2V0TmFtZSA9IG5vZGUuaW5wdXRzLmluMS5zb2NrZXQubmFtZTtcbiAgICAgICAgbGV0IG5vZGVJbnN0YW5jZTogR3JlYXRlck9yRXF1YWxTaGFkZXJOb2RlO1xuICAgICAgICBpZiAoc29ja2V0TmFtZS5pbmNsdWRlcygnPGZsb2F0PicpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IEdyZWF0ZXJPckVxdWFsU2hhZGVyTm9kZShDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgfSBlbHNlIGlmIChzb2NrZXROYW1lLmluY2x1ZGVzKCc8aW50PicpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IEdyZWF0ZXJPckVxdWFsU2hhZGVyTm9kZShDb21wb25lbnRUeXBlLkludCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5pbmNsdWRlcygnPHVpbnQ+JykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgR3JlYXRlck9yRXF1YWxTaGFkZXJOb2RlKENvbXBvbmVudFR5cGUuVW5zaWduZWRJbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKGBHcmVhdGVyT3JFcXVhbCBub2RlOiBVbmtub3duIHNvY2tldCBuYW1lOiAke3NvY2tldE5hbWV9YCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFNoYWRlclN0YWdlKG5vZGUuY29udHJvbHMuc2hhZGVyU3RhZ2UudmFsdWUpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ0VxdWFsJzoge1xuICAgICAgICBjb25zdCBzb2NrZXROYW1lID0gbm9kZS5pbnB1dHMuaW4xLnNvY2tldC5uYW1lO1xuICAgICAgICBsZXQgbm9kZUluc3RhbmNlOiBFcXVhbFNoYWRlck5vZGU7XG4gICAgICAgIGlmIChzb2NrZXROYW1lLmluY2x1ZGVzKCc8ZmxvYXQ+JykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgRXF1YWxTaGFkZXJOb2RlKENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2UgaWYgKHNvY2tldE5hbWUuaW5jbHVkZXMoJzxpbnQ+JykpIHtcbiAgICAgICAgICBub2RlSW5zdGFuY2UgPSBuZXcgRXF1YWxTaGFkZXJOb2RlKENvbXBvbmVudFR5cGUuSW50KTtcbiAgICAgICAgfSBlbHNlIGlmIChzb2NrZXROYW1lLmluY2x1ZGVzKCc8dWludD4nKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBFcXVhbFNoYWRlck5vZGUoQ29tcG9uZW50VHlwZS5VbnNpZ25lZEludCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoYEVxdWFsIG5vZGU6IFVua25vd24gc29ja2V0IG5hbWU6ICR7c29ja2V0TmFtZX1gKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBub2RlSW5zdGFuY2Uuc2V0U2hhZGVyU3RhZ2Uobm9kZS5jb250cm9scy5zaGFkZXJTdGFnZS52YWx1ZSk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnTm90RXF1YWwnOiB7XG4gICAgICAgIGNvbnN0IHNvY2tldE5hbWUgPSBub2RlLmlucHV0cy5pbjEuc29ja2V0Lm5hbWU7XG4gICAgICAgIGxldCBub2RlSW5zdGFuY2U6IE5vdEVxdWFsU2hhZGVyTm9kZTtcbiAgICAgICAgaWYgKHNvY2tldE5hbWUuaW5jbHVkZXMoJzxmbG9hdD4nKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBOb3RFcXVhbFNoYWRlck5vZGUoQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoc29ja2V0TmFtZS5pbmNsdWRlcygnPGludD4nKSkge1xuICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBOb3RFcXVhbFNoYWRlck5vZGUoQ29tcG9uZW50VHlwZS5JbnQpO1xuICAgICAgICB9IGVsc2UgaWYgKHNvY2tldE5hbWUuaW5jbHVkZXMoJzx1aW50PicpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IE5vdEVxdWFsU2hhZGVyTm9kZShDb21wb25lbnRUeXBlLlVuc2lnbmVkSW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcihgTm90RXF1YWwgbm9kZTogVW5rbm93biBzb2NrZXQgbmFtZTogJHtzb2NrZXROYW1lfWApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG5vZGVJbnN0YW5jZS5zZXRTaGFkZXJTdGFnZShub2RlLmNvbnRyb2xzLnNoYWRlclN0YWdlLnZhbHVlKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdBbmQnOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBBbmRTaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZS5zZXRTaGFkZXJTdGFnZShub2RlLmNvbnRyb2xzLnNoYWRlclN0YWdlLnZhbHVlKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdPcic6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IE9yU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2Uuc2V0U2hhZGVyU3RhZ2Uobm9kZS5jb250cm9scy5zaGFkZXJTdGFnZS52YWx1ZSk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnQnJhbmNoJzoge1xuICAgICAgICBjb25zdCBzb2NrZXROYW1lID0gbm9kZS5vdXRwdXRzLm91dDEuc29ja2V0Lm5hbWU7XG4gICAgICAgIGxldCBub2RlSW5zdGFuY2U6IEJyYW5jaFNoYWRlck5vZGU7XG4gICAgICAgIGlmIChzb2NrZXROYW1lLnN0YXJ0c1dpdGgoJ1NjYWxhcicpKSB7XG4gICAgICAgICAgaWYgKHNvY2tldE5hbWUuaW5jbHVkZXMoJzxpbnQ+JykpIHtcbiAgICAgICAgICAgIG5vZGVJbnN0YW5jZSA9IG5ldyBCcmFuY2hTaGFkZXJOb2RlKENvbXBvc2l0aW9uVHlwZS5TY2FsYXIsIENvbXBvbmVudFR5cGUuSW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IEJyYW5jaFNoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlNjYWxhciwgQ29tcG9uZW50VHlwZS5GbG9hdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnVmVjdG9yMicpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IEJyYW5jaFNoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlZlYzIsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2UgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnVmVjdG9yMycpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IEJyYW5jaFNoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlZlYzMsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2UgaWYgKHNvY2tldE5hbWUuc3RhcnRzV2l0aCgnVmVjdG9yNCcpKSB7XG4gICAgICAgICAgbm9kZUluc3RhbmNlID0gbmV3IEJyYW5jaFNoYWRlck5vZGUoQ29tcG9zaXRpb25UeXBlLlZlYzQsIENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKGBCcmFuY2ggbm9kZTogVW5rbm93biBzb2NrZXQgbmFtZTogJHtzb2NrZXROYW1lfWApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG5vZGVJbnN0YW5jZS5zZXRTaGFkZXJTdGFnZShub2RlLmNvbnRyb2xzLnNoYWRlclN0YWdlLnZhbHVlKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdPdXRQb3NpdGlvbic6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IE91dFBvc2l0aW9uU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ091dENvbG9yJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgT3V0Q29sb3JTaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnRGlzY2FyZCc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IERpc2NhcmRTaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnRmxhdFNoYWRlcic6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IEZsYXRTaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZS5zZXRTaGFkZXJTdGFnZShub2RlLmNvbnRyb2xzLnNoYWRlclN0YWdlLnZhbHVlKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdDbGFzc2ljU2hhZGVyJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgQ2xhc3NpY1NoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFNoYWRlclN0YWdlKG5vZGUuY29udHJvbHMuc2hhZGVyU3RhZ2UudmFsdWUpO1xuICAgICAgICAvLyBTZXQgc2hhZGluZyBtb2RlbCBmcm9tIGNvbnRyb2wgdmFsdWUgKExhbWJlcnQ6IDEsIEJsaW5uLVBob25nOiAyLCBQaG9uZzogMylcbiAgICAgICAgLy8gRGVmYXVsdCBpcyBCbGlubi1QaG9uZyAoMikgaWYgbm90IHNwZWNpZmllZFxuICAgICAgICBpZiAobm9kZS5jb250cm9scy5zaGFkaW5nTW9kZWw/LnZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICBjb25zdCBzaGFkaW5nTW9kZWxNYXA6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7XG4gICAgICAgICAgICBMYW1iZXJ0OiAxLFxuICAgICAgICAgICAgJ0JsaW5uLVBob25nJzogMixcbiAgICAgICAgICAgIFBob25nOiAzLFxuICAgICAgICAgIH07XG4gICAgICAgICAgY29uc3Qgc2hhZGluZ01vZGVsVmFsdWUgPSBzaGFkaW5nTW9kZWxNYXBbbm9kZS5jb250cm9scy5zaGFkaW5nTW9kZWwudmFsdWVdID8/IDI7XG4gICAgICAgICAgbm9kZUluc3RhbmNlLnNldFNoYWRpbmdNb2RlbChzaGFkaW5nTW9kZWxWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdQYnJTaGFkZXInOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBQYnJTaGFkZXJTaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZS5zZXRTaGFkZXJTdGFnZShub2RlLmNvbnRyb2xzLnNoYWRlclN0YWdlLnZhbHVlKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdQYnJCYXNlQ29sb3JQcm9wcyc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IFBickJhc2VDb2xvclByb3BzU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2Uuc2V0U2hhZGVyU3RhZ2Uobm9kZS5jb250cm9scy5zaGFkZXJTdGFnZS52YWx1ZSk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnUGJyTm9ybWFsUHJvcHMnOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBQYnJOb3JtYWxQcm9wc1NoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFNoYWRlclN0YWdlKG5vZGUuY29udHJvbHMuc2hhZGVyU3RhZ2UudmFsdWUpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1Bick1ldGFsbGljUm91Z2huZXNzUHJvcHMnOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBQYnJNZXRhbGxpY1JvdWdobmVzc1Byb3BzU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2Uuc2V0U2hhZGVyU3RhZ2Uobm9kZS5jb250cm9scy5zaGFkZXJTdGFnZS52YWx1ZSk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnUGJyT2NjbHVzaW9uUHJvcHMnOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBQYnJPY2NsdXNpb25Qcm9wc1NoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFNoYWRlclN0YWdlKG5vZGUuY29udHJvbHMuc2hhZGVyU3RhZ2UudmFsdWUpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1BickVtaXNzaXZlUHJvcHMnOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBQYnJFbWlzc2l2ZVByb3BzU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2Uuc2V0U2hhZGVyU3RhZ2Uobm9kZS5jb250cm9scy5zaGFkZXJTdGFnZS52YWx1ZSk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnUGJyU3BlY3VsYXJQcm9wcyc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IFBiclNwZWN1bGFyUHJvcHNTaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZS5zZXRTaGFkZXJTdGFnZShub2RlLmNvbnRyb2xzLnNoYWRlclN0YWdlLnZhbHVlKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdQYnJDbGVhcmNvYXRQcm9wcyc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IFBickNsZWFyY29hdFByb3BzU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2Uuc2V0U2hhZGVyU3RhZ2Uobm9kZS5jb250cm9scy5zaGFkZXJTdGFnZS52YWx1ZSk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnUGJyU2hlZW5Qcm9wcyc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IFBiclNoZWVuUHJvcHNTaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZS5zZXRTaGFkZXJTdGFnZShub2RlLmNvbnRyb2xzLnNoYWRlclN0YWdlLnZhbHVlKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdQYnJBbmlzb3Ryb3B5UHJvcHMnOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBQYnJBbmlzb3Ryb3B5UHJvcHNTaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZS5zZXRTaGFkZXJTdGFnZShub2RlLmNvbnRyb2xzLnNoYWRlclN0YWdlLnZhbHVlKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdQYnJBbmlzb3Ryb3B5Um90YXRpb24nOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBQYnJBbmlzb3Ryb3B5Um90YXRpb25TaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZS5zZXRTaGFkZXJTdGFnZShub2RlLmNvbnRyb2xzLnNoYWRlclN0YWdlLnZhbHVlKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdQYnJJcmlkZXNjZW5jZVByb3BzJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgUGJySXJpZGVzY2VuY2VQcm9wc1NoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFNoYWRlclN0YWdlKG5vZGUuY29udHJvbHMuc2hhZGVyU3RhZ2UudmFsdWUpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1BiclRyYW5zbWlzc2lvblByb3BzJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgUGJyVHJhbnNtaXNzaW9uUHJvcHNTaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZS5zZXRTaGFkZXJTdGFnZShub2RlLmNvbnRyb2xzLnNoYWRlclN0YWdlLnZhbHVlKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdQYnJEaWZmdXNlVHJhbnNtaXNzaW9uUHJvcHMnOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBQYnJEaWZmdXNlVHJhbnNtaXNzaW9uUHJvcHNTaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZS5zZXRTaGFkZXJTdGFnZShub2RlLmNvbnRyb2xzLnNoYWRlclN0YWdlLnZhbHVlKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdQYnJWb2x1bWVQcm9wcyc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IFBiclZvbHVtZVByb3BzU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2Uuc2V0U2hhZGVyU3RhZ2Uobm9kZS5jb250cm9scy5zaGFkZXJTdGFnZS52YWx1ZSk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnUHJlbXVsdGlwbGllZEFscGhhJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgUHJlbXVsdGlwbGllZEFscGhhU2hhZGVyTm9kZShDb21wb25lbnRUeXBlLkZsb2F0KTtcbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFNoYWRlclN0YWdlKG5vZGUuY29udHJvbHMuc2hhZGVyU3RhZ2UudmFsdWUpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ0FscGhhVGVzdCc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IEFscGhhVGVzdFNoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFNoYWRlclN0YWdlKG5vZGUuY29udHJvbHMuc2hhZGVyU3RhZ2UudmFsdWUpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ0NhbGNCaXRhbmdlbnQnOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBDYWxjQml0YW5nZW50U2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1JhbmRvbV9IYXNoUFJORyc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IFJhbmRvbV9IYXNoUFJOR1NoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFNoYWRlclN0YWdlKG5vZGUuY29udHJvbHMuc2hhZGVyU3RhZ2UudmFsdWUpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1JhbmRvbV9TaW5IYXNoJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgUmFuZG9tX1Npbkhhc2hTaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZS5zZXRTaGFkZXJTdGFnZShub2RlLmNvbnRyb2xzLnNoYWRlclN0YWdlLnZhbHVlKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdPdXREaXN0YW5jZSc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IE91dERpc3RhbmNlU2hhZGVyTm9kZSgpO1xuICAgICAgICBhcHBseURpc3RhbmNlQ29ycmVjdGlvblVuaWZvcm1OYW1lcyhub2RlSW5zdGFuY2UsIG5vZGUpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ091dFVuaW9uJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgT3V0VW5pb25TaGFkZXJOb2RlKCk7XG4gICAgICAgIGFwcGx5RGlzdGFuY2VDb3JyZWN0aW9uVW5pZm9ybU5hbWVzKG5vZGVJbnN0YW5jZSwgbm9kZSk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnT3V0U2hhZGluZ0NvbG9yJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgT3V0U2hhZGluZ0NvbG9yU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1JheW1hcmNoSGl0UG9zaXRpb24nOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBSYXltYXJjaEhpdFBvc2l0aW9uU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1JheW1hcmNoSGl0Tm9ybWFsJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgUmF5bWFyY2hIaXROb3JtYWxTaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnUmF5bWFyY2hPYmplY3RJZCc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IFJheW1hcmNoT2JqZWN0SWRTaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnUmF5bWFyY2hPYmplY3RJZFVuaWZvcm0nOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBSYXltYXJjaE9iamVjdElkVW5pZm9ybVNoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlLnNldFVuaWZvcm1EYXRhTmFtZShub2RlLmNvbnRyb2xzLm5hbWUudmFsdWUpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1JheW1hcmNoVmlld0RpcmVjdGlvbic6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IFJheW1hcmNoVmlld0RpcmVjdGlvblNoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdSYXltYXJjaENhbWVyYVBvc2l0aW9uJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgUmF5bWFyY2hDYW1lcmFQb3NpdGlvblNoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdSYXltYXJjaEhpdERpc3RhbmNlJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgUmF5bWFyY2hIaXREaXN0YW5jZVNoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdSYXltYXJjaFJheURpcmVjdGlvbic6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IFJheW1hcmNoUmF5RGlyZWN0aW9uU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1JheW1hcmNoVEJOJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgUmF5bWFyY2hUQk5TaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnU2RTcGhlcmUnOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBTZFNwaGVyZVNoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdTZEJhclgnOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBTZEJhclhTaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnU2RCYXJZJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgU2RCYXJZU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1NkQmFyWic6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IFNkQmFyWlNoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdTZFR1YmVYJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgU2RUdWJlWFNoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdTZFR1YmVZJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgU2RUdWJlWVNoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdTZFR1YmVaJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgU2RUdWJlWlNoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdTZEJveCc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IFNkQm94U2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1NkVG9ydXMnOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBTZFRvcnVzU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1NkQ2Fwc3VsZSc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IFNkQ2Fwc3VsZVNoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdTZFJvdW5kQm94Jzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgU2RSb3VuZEJveFNoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdTZFJlcGVhdCc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IFNkUmVwZWF0U2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1NkUmVwZWF0WCc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IFNkUmVwZWF0WFNoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdTZFJlcGVhdFhZJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgU2RSZXBlYXRYWVNoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdTZFJlcGVhdFknOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBTZFJlcGVhdFlTaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnU2RSZXBlYXRZWic6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IFNkUmVwZWF0WVpTaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnU2RSZXBlYXRaJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgU2RSZXBlYXRaU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1NkUmVwZWF0WlgnOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBTZFJlcGVhdFpYU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ09wVW5pb24nOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBPcFVuaW9uU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ09wU3VidHJhY3Rpb24nOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBPcFN1YnRyYWN0aW9uU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ09wU21vb3RoVW5pb24nOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBPcFNtb290aFVuaW9uU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ09wU21vb3RoU3VidHJhY3Rpb24nOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBPcFNtb290aFN1YnRyYWN0aW9uU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ09wU21vb3RoSW50ZXJzZWN0aW9uJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgT3BTbW9vdGhJbnRlcnNlY3Rpb25TaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnVHdpc3RYJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgVHdpc3RYU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ1R3aXN0WSc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IFR3aXN0WVNoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdUd2lzdFonOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBUd2lzdFpTaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnQmVuZFhZJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgQmVuZFhZU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ0JlbmRYWic6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IEJlbmRYWlNoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdCZW5kWVonOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBCZW5kWVpTaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnQmVuZFlYJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgQmVuZFlYU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ0JlbmRaWCc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IEJlbmRaWFNoYWRlck5vZGUoKTtcbiAgICAgICAgbm9kZUluc3RhbmNlc1tub2RlLmlkXSA9IG5vZGVJbnN0YW5jZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdCZW5kWlknOiB7XG4gICAgICAgIGNvbnN0IG5vZGVJbnN0YW5jZSA9IG5ldyBCZW5kWllTaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnU2RBcHBseVRyYW5zZm9ybSc6IHtcbiAgICAgICAgY29uc3Qgbm9kZUluc3RhbmNlID0gbmV3IFNkQXBwbHlUcmFuc2Zvcm1TaGFkZXJOb2RlKCk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnU2RBcHBseVdvcmxkTWF0cml4Jzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgU2RBcHBseVdvcmxkTWF0cml4U2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2Uuc2V0VW5pZm9ybURhdGFOYW1lKG5vZGUuY29udHJvbHMubmFtZS52YWx1ZSk7XG4gICAgICAgIG5vZGVJbnN0YW5jZXNbbm9kZS5pZF0gPSBub2RlSW5zdGFuY2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnSW5pdGlhbFBvc2l0aW9uJzoge1xuICAgICAgICBjb25zdCBub2RlSW5zdGFuY2UgPSBuZXcgSW5pdGlhbFBvc2l0aW9uU2hhZGVyTm9kZSgpO1xuICAgICAgICBub2RlSW5zdGFuY2VzW25vZGUuaWRdID0gbm9kZUluc3RhbmNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBmb3IgKGNvbnN0IGNvbm5lY3Rpb24gb2YganNvbi5jb25uZWN0aW9ucykge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGpzb24uY29ubmVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjb25uZWN0aW9uID0ganNvbi5jb25uZWN0aW9uc1tpXTtcbiAgICBjb25zdCBpbnB1dE5vZGVJbnN0YW5jZSA9IG5vZGVJbnN0YW5jZXNbY29ubmVjdGlvbi5mcm9tLmlkXSBhcyBBYnN0cmFjdFNoYWRlck5vZGUgfCB1bmRlZmluZWQ7XG4gICAgY29uc3Qgb3V0cHV0Tm9kZUluc3RhbmNlID0gbm9kZUluc3RhbmNlc1tjb25uZWN0aW9uLnRvLmlkXSBhcyBBYnN0cmFjdFNoYWRlck5vZGUgfCB1bmRlZmluZWQ7XG4gICAgaWYgKGlucHV0Tm9kZUluc3RhbmNlID09IG51bGwgfHwgb3V0cHV0Tm9kZUluc3RhbmNlID09IG51bGwpIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdpbnB1dE5vZGVJbnN0YW5jZSBvciBvdXRwdXROb2RlSW5zdGFuY2UgaXMgbnVsbCcpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gRmlyc3QsIHRyeSB0byBmaW5kIHNvY2tldHMgYnkgbmFtZSAoZm9yIG5vZGVzIHdpdGggbWF0Y2hpbmcgcG9ydCBuYW1lcylcbiAgICBsZXQgb3V0cHV0T2ZJbnB1dE5vZGUgPSBpbnB1dE5vZGVJbnN0YW5jZS5nZXRPdXRwdXQoY29ubmVjdGlvbi5mcm9tLnBvcnROYW1lKTtcbiAgICBsZXQgaW5wdXRPZk91dHB1dE5vZGUgPSBvdXRwdXROb2RlSW5zdGFuY2UuZ2V0SW5wdXQoY29ubmVjdGlvbi50by5wb3J0TmFtZSk7XG5cbiAgICAvLyBJZiBuYW1lLWJhc2VkIGxvb2t1cCBmYWlscyBmb3Igb3V0cHV0LCBmYWxsIGJhY2sgdG8gaW5kZXgtYmFzZWQgbG9va3VwIGZvciBvdXRwdXQgb25seVxuICAgIGlmIChvdXRwdXRPZklucHV0Tm9kZSA9PSBudWxsKSB7XG4gICAgICBsZXQgaWR4MiA9IDA7XG4gICAgICBmb3IgKGNvbnN0IGtleSBpbiBub2Rlc1tjb25uZWN0aW9uLmZyb20uaWRdLm91dHB1dHMpIHtcbiAgICAgICAgaWYgKGtleSA9PT0gY29ubmVjdGlvbi5mcm9tLnBvcnROYW1lKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWR4MisrO1xuICAgICAgfVxuICAgICAgb3V0cHV0T2ZJbnB1dE5vZGUgPSBpbnB1dE5vZGVJbnN0YW5jZS5nZXRPdXRwdXRzKClbaWR4Ml07XG4gICAgfVxuXG4gICAgLy8gSWYgbmFtZS1iYXNlZCBsb29rdXAgZmFpbHMgZm9yIGlucHV0LCBmYWxsIGJhY2sgdG8gaW5kZXgtYmFzZWQgbG9va3VwIGZvciBpbnB1dCBvbmx5XG4gICAgaWYgKGlucHV0T2ZPdXRwdXROb2RlID09IG51bGwpIHtcbiAgICAgIGxldCBpZHggPSAwO1xuICAgICAgZm9yIChjb25zdCBrZXkgaW4gbm9kZXNbY29ubmVjdGlvbi50by5pZF0uaW5wdXRzKSB7XG4gICAgICAgIGlmIChrZXkgPT09IGNvbm5lY3Rpb24udG8ucG9ydE5hbWUpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZHgrKztcbiAgICAgIH1cbiAgICAgIGlucHV0T2ZPdXRwdXROb2RlID0gb3V0cHV0Tm9kZUluc3RhbmNlLmdldElucHV0cygpW2lkeF07XG4gICAgfVxuXG4gICAgb3V0cHV0Tm9kZUluc3RhbmNlLmFkZElucHV0Q29ubmVjdGlvbihpbnB1dE5vZGVJbnN0YW5jZSwgb3V0cHV0T2ZJbnB1dE5vZGUsIGlucHV0T2ZPdXRwdXROb2RlKTtcbiAgfVxuXG4gIGFwcGx5VHJhbnNmb3JtRGlzdGFuY2VTY2FsZXMoanNvbiwgbm9kZUluc3RhbmNlcyk7XG5cbiAgcmV0dXJuIHsgbm9kZUluc3RhbmNlcywgdGV4dHVyZUluZm9zIH07XG59XG5cbi8qKlxuICogSW5wdXQgcG9ydHMgdGhhdCBjYXJyeSB0aGUgU0RGJ3Mgc3BhdGlhbCBkYXRhIChwb3NpdGlvbiBvciBkaXN0YW5jZSkuXG4gKiBFdmVyeXRoaW5nIGVsc2UgKHRyYW5zbGF0aW9uLCBzY2FsZSwgc21vb3RobmVzcywgb2JqZWN0IGlkLCAuLi4pIGNhbm5vdCBjb25uZWN0XG4gKiBhIHRyYW5zZm9ybSBub2RlIHRvIHRoZSB0ZXJtaW5hbCdzIGRpc3RhbmNlIHN1YnRyZWUsIHNvIGl0IGlzIG5vdCBmb2xsb3dlZC5cbiAqL1xuY29uc3QgUkFZTUFSQ0hfU1BBVElBTF9JTlBVVF9QT1JUUyA9IG5ldyBTZXQoWydwb3NpdGlvbicsICdsaHMnLCAncmhzJywgJ2Jhc2UnLCAnc3VidHJhY3RvcicsICd2YWx1ZScsICdpbjEnXSk7XG5cbi8qKlxuICogQ29ubmVjdHMgZWFjaCByYXltYXJjaGluZyB0ZXJtaW5hbCB0byB0aGUgYFNkQXBwbHlUcmFuc2Zvcm1gIHNjYWxlIGdsb2JhbHMgb2YgaXRzXG4gKiBkaXN0YW5jZSBzdWJ0cmVlLlxuICpcbiAqIEEgdHJhbnNmb3JtIG5vZGUgc2NhbGVkIGJlbG93IDEgbWFrZXMgdGhlIGxvY2FsLXNwYWNlIGRpc3RhbmNlcyBsYXJnZXIgdGhhbiB0aGVcbiAqIHdvcmxkLXNwYWNlIGRpc3RhbmNlcywgc28gdGhlIHRlcm1pbmFsIGhhcyB0byBtdWx0aXBseSB0aGVtIGJ5IHRoZSB0cmFuc2Zvcm0nc1xuICogc21hbGxlc3QgYXhpcyBzY2FsZSAoc2VlIHtAbGluayBTZEFwcGx5VHJhbnNmb3JtU2hhZGVyfSkuIFRoZSB0cmF2ZXJzYWwgb25seSBmb2xsb3dzXG4gKiBzcGF0aWFsIHBvcnRzLCB3aGljaCBndWFyYW50ZWVzIHRoYXQgZXZlcnkgY29sbGVjdGVkIHRyYW5zZm9ybSBpcyBhbiBhbmNlc3RvciBvZlxuICogdGhlIHRlcm1pbmFsIGluIHRoZSBTREYgZ3JhcGg6IGl0cyBnZW5lcmF0ZWQgZnVuY3Rpb24gY2FsbCBydW5zIGJlZm9yZSB0aGUgdGVybWluYWxcbiAqIHJlYWRzIHRoZSBnbG9iYWwgaW4gZXZlcnkgYG1hcCgpYCBldmFsdWF0aW9uLlxuICpcbiAqIEBwYXJhbSBqc29uIC0gSlNPTiBzaGFkZXIgZ3JhcGggdGhlIG5vZGUgaW5zdGFuY2VzIHdlcmUgY3JlYXRlZCBmcm9tXG4gKiBAcGFyYW0gbm9kZUluc3RhbmNlcyAtIE5vZGUgaW5zdGFuY2VzIG9mIHRoZSBncmFwaFxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gYXBwbHlUcmFuc2Zvcm1EaXN0YW5jZVNjYWxlcyhqc29uOiBTaGFkZXJOb2RlSnNvbiwgbm9kZUluc3RhbmNlczogUmVjb3JkPHN0cmluZywgQWJzdHJhY3RTaGFkZXJOb2RlPikge1xuICBjb25zdCBpbmNvbWluZyA9IG5ldyBNYXA8c3RyaW5nLCB7IGZyb21JZDogc3RyaW5nOyBwb3J0TmFtZTogc3RyaW5nIH1bXT4oKTtcbiAgZm9yIChjb25zdCBjb25uZWN0aW9uIG9mIGpzb24uY29ubmVjdGlvbnMpIHtcbiAgICBsZXQgbGlzdCA9IGluY29taW5nLmdldChjb25uZWN0aW9uLnRvLmlkKTtcbiAgICBpZiAobGlzdCA9PSBudWxsKSB7XG4gICAgICBsaXN0ID0gW107XG4gICAgICBpbmNvbWluZy5zZXQoY29ubmVjdGlvbi50by5pZCwgbGlzdCk7XG4gICAgfVxuICAgIGxpc3QucHVzaCh7IGZyb21JZDogY29ubmVjdGlvbi5mcm9tLmlkLCBwb3J0TmFtZTogY29ubmVjdGlvbi50by5wb3J0TmFtZSB9KTtcbiAgfVxuXG4gIGNvbnN0IHB1c2hTcGF0aWFsSW5wdXRzID0gKG5vZGVJZDogc3RyaW5nLCBzdGFjazogc3RyaW5nW10pID0+IHtcbiAgICBjb25zdCBjb25uZWN0aW9ucyA9IGluY29taW5nLmdldChub2RlSWQpO1xuICAgIGlmIChjb25uZWN0aW9ucyA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGZvciAoY29uc3QgY29ubmVjdGlvbiBvZiBjb25uZWN0aW9ucykge1xuICAgICAgaWYgKFJBWU1BUkNIX1NQQVRJQUxfSU5QVVRfUE9SVFMuaGFzKGNvbm5lY3Rpb24ucG9ydE5hbWUpKSB7XG4gICAgICAgIHN0YWNrLnB1c2goY29ubmVjdGlvbi5mcm9tSWQpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBmb3IgKGNvbnN0IG5vZGUgb2YganNvbi5ub2Rlcykge1xuICAgIGlmIChub2RlLm5hbWUgIT09ICdPdXRVbmlvbicgJiYgbm9kZS5uYW1lICE9PSAnT3V0RGlzdGFuY2UnKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgdGVybWluYWwgPSBub2RlSW5zdGFuY2VzW25vZGUuaWRdIGFzXG4gICAgICB8IHsgc2V0RGlzdGFuY2VTY2FsZUdsb2JhbE5hbWVzPzogKGdsb2JhbE5hbWVzOiByZWFkb25seSBzdHJpbmdbXSkgPT4gdm9pZCB9XG4gICAgICB8IHVuZGVmaW5lZDtcbiAgICBpZiAodGVybWluYWw/LnNldERpc3RhbmNlU2NhbGVHbG9iYWxOYW1lcyA9PSBudWxsKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBnbG9iYWxOYW1lczogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCB2aXNpdGVkID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgY29uc3Qgc3RhY2s6IHN0cmluZ1tdID0gW107XG4gICAgcHVzaFNwYXRpYWxJbnB1dHMobm9kZS5pZCwgc3RhY2spO1xuICAgIHdoaWxlIChzdGFjay5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBub2RlSWQgPSBzdGFjay5wb3AoKSE7XG4gICAgICBpZiAodmlzaXRlZC5oYXMobm9kZUlkKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHZpc2l0ZWQuYWRkKG5vZGVJZCk7XG4gICAgICBjb25zdCBpbnN0YW5jZSA9IG5vZGVJbnN0YW5jZXNbbm9kZUlkXTtcbiAgICAgIGlmIChpbnN0YW5jZSBpbnN0YW5jZW9mIFNkQXBwbHlUcmFuc2Zvcm1TaGFkZXJOb2RlKSB7XG4gICAgICAgIGdsb2JhbE5hbWVzLnB1c2goaW5zdGFuY2UuZGlzdGFuY2VTY2FsZUdsb2JhbE5hbWUpO1xuICAgICAgfVxuICAgICAgcHVzaFNwYXRpYWxJbnB1dHMobm9kZUlkLCBzdGFjayk7XG4gICAgfVxuXG4gICAgaWYgKGdsb2JhbE5hbWVzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRlcm1pbmFsLnNldERpc3RhbmNlU2NhbGVHbG9iYWxOYW1lcyhnbG9iYWxOYW1lcyk7XG4gICAgfVxuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBR0EsU0FBUyxxQkFBNkM7QUFDdEQsU0FBUyx1QkFBaUQ7QUFDMUQsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxrQkFBdUM7QUFDaEQsU0FBUyxjQUFjO0FBQ3ZCLFNBQVMsZUFBZTtBQUN4QixTQUFTLGVBQWU7QUFDeEIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsY0FBYztBQUV2QixTQUFTLHFCQUFx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SyxFQUFFLFFBQVEsV0FBVyxLQUFLLElBQUksVUFBVSxXQUFXLEdBQUcsU0FBUyxDQUFDO0FBQUEsRUFDNUU7QUFFQSxRQUFNLG9CQUFvQixDQUFDLFFBQWdCLFVBQW9CO0FBQzdELFVBQU0sY0FBYyxTQUFTLElBQUksTUFBTTtBQUN2QyxRQUFJLGVBQWUsTUFBTTtBQUN2QjtBQUFBLElBQ0Y7QUFDQSxlQUFXLGNBQWMsYUFBYTtBQUNwQyxVQUFJLDZCQUE2QixJQUFJLFdBQVcsUUFBUSxHQUFHO0FBQ3pELGNBQU0sS0FBSyxXQUFXLE1BQU07QUFBQSxNQUM5QjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBRUEsYUFBVyxRQUFRLEtBQUssT0FBTztBQUM3QixRQUFJLEtBQUssU0FBUyxjQUFjLEtBQUssU0FBUyxlQUFlO0FBQzNEO0FBQUEsSUFDRjtBQUNBLFVBQU0sV0FBVyxjQUFjLEtBQUssRUFBRTtBQUd0QyxTQUFJLHFDQUFVLGdDQUErQixNQUFNO0FBQ2pEO0FBQUEsSUFDRjtBQUVBLFVBQU0sY0FBd0IsQ0FBQztBQUMvQixVQUFNLFVBQVUsb0JBQUksSUFBWTtBQUNoQyxVQUFNLFFBQWtCLENBQUM7QUFDekIsc0JBQWtCLEtBQUssSUFBSSxLQUFLO0FBQ2hDLFdBQU8sTUFBTSxTQUFTLEdBQUc7QUFDdkIsWUFBTSxTQUFTLE1BQU0sSUFBSTtBQUN6QixVQUFJLFFBQVEsSUFBSSxNQUFNLEdBQUc7QUFDdkI7QUFBQSxNQUNGO0FBQ0EsY0FBUSxJQUFJLE1BQU07QUFDbEIsWUFBTSxXQUFXLGNBQWMsTUFBTTtBQUNyQyxVQUFJLG9CQUFvQiw0QkFBNEI7QUFDbEQsb0JBQVksS0FBSyxTQUFTLHVCQUF1QjtBQUFBLE1BQ25EO0FBQ0Esd0JBQWtCLFFBQVEsS0FBSztBQUFBLElBQ2pDO0FBRUEsUUFBSSxZQUFZLFNBQVMsR0FBRztBQUMxQixlQUFTLDRCQUE0QixXQUFXO0FBQUEsSUFDbEQ7QUFBQSxFQUNGO0FBQ0Y7IiwKICAibmFtZXMiOiBbIl9fc29ydFRvcG9sb2dpY2FsbHkiLCAiX19nZXRGdW5jdGlvbkRlZmluaXRpb24iLCAiX19jb25zdHJ1Y3RTaGFkZXJXaXRoTm9kZXMiLCAiX19jb2xsZWN0VmFyaWFibGVOYW1lcyIsICJfX2dlbmVyYXRlU2hhZGVyQ29kZSIsICJfX2NvbGxlY3RTaGFkaW5nR3JvdXBzIiwgIl9fdmFsaWRhdGVTaGFkZXJOb2RlcyIsICJfX2RlZmluZVZhcnlpbmdWYXJpYWJsZXMiLCAiX19jb2xsZWN0T3V0cHV0c0Zvck5vZGUiLCAiX19jb2xsZWN0SW5wdXRzRm9yTm9kZSIsICJfX2dldERlZmF1bHRJbnB1dFZhbHVlIiwgIl9fcHJvY2Vzc0lucHV0Q29ubmVjdGlvbiIsICJfX2lzU3RydWN0RGVmYXVsdFZhbHVlIiwgIl9fZ2V0U3RydWN0TmFtZSIsICJfX2dldFN0cnVjdERlZmF1bHRWYWx1ZVN0cmluZyIsICJfX2hhbmRsZVZlcnRleFRvRnJhZ21lbnRQYXNzaW5nIl0KfQo=
