import type { Index } from '../../../types/CommonTypes';
import type { ShaderNodeJson } from '../../../types/ShaderNodeJson';
import type { CommonShaderPart } from '../../../webgl/shaders/CommonShaderPart';
import { StandardShaderPart } from '../../../webgl/shaders/StandardShaderPart';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { ShaderType, type ShaderTypeEnum } from '../../definitions/ShaderType';
import { Scalar } from '../../math/Scalar';
import { Vector2 } from '../../math/Vector2';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import { Logger } from '../../misc/Logger';
import type { Engine } from '../../system/Engine';
import { EngineState } from '../../system/EngineState';
import { AddShaderNode } from '../nodes/AddShaderNode';
import { AlphaTestShaderNode } from '../nodes/AlphaTestShaderNode';
import { AndShaderNode } from '../nodes/AndShaderNode';
import { AttributeColorShaderNode } from '../nodes/AttributeColorShaderNode';
import { AttributeInstanceIdsShaderNode } from '../nodes/AttributeInstanceIdsShaderNode';
import { AttributeJointShaderNode } from '../nodes/AttributeJointShaderNode';
import { AttributeNormalShaderNode } from '../nodes/AttributeNormalShaderNode';
import { AttributePositionShaderNode } from '../nodes/AttributePositionShaderNode';
import { AttributeTangentShaderNode } from '../nodes/AttributeTangentShaderNode';
import { AttributeTexcoordShaderNode } from '../nodes/AttributeTexcoordShaderNode';
import { AttributeWeightShaderNode } from '../nodes/AttributeWeightShaderNode';
import { BranchShaderNode } from '../nodes/BranchShaderNode';
import { CalcBitangentShaderNode } from '../nodes/CalcBitangentShaderNode';
import { CastToFloatShaderNode } from '../nodes/CastToFloatShaderNode';
import { ClampShaderNode } from '../nodes/ClampShaderNode';
import { ClassicShaderNode } from '../nodes/ClassicShaderNode';
import { ConstantScalarVariableShaderNode } from '../nodes/ConstantScalarVariableShaderNode';
import { ConstantVector2VariableShaderNode } from '../nodes/ConstantVector2VariableShaderNode';
import { ConstantVector3VariableShaderNode } from '../nodes/ConstantVector3VariableShaderNode';
import { ConstantVector4VariableShaderNode } from '../nodes/ConstantVector4VariableShaderNode';
import { CosShaderNode } from '../nodes/CosShaderNode';
import { DiscardShaderNode } from '../nodes/DiscardShaderNode';
import { DotProductShaderNode } from '../nodes/DotProductShaderNode';
import { EqualShaderNode } from '../nodes/EqualShaderNode';
import { FlatShaderNode } from '../nodes/FlatShaderNode';
import { GreaterOrEqualShaderNode } from '../nodes/GreaterOrEqualShaderNode';
import { GreaterShaderNode } from '../nodes/GreaterShaderNode';
import { GreaterThanShaderNode } from '../nodes/GreaterThanShaderNode';
import { LengthShaderNode } from '../nodes/LengthShaderNode';
import { LessOrEqualShaderNode } from '../nodes/LessOrEqualShaderNode';
import { LessThanShaderNode } from '../nodes/LessThanShaderNode';
import { MergeVectorShaderNode } from '../nodes/MergeVectorShaderNode';
import { MultiplyShaderNode } from '../nodes/MultiplyShaderNode';
import { NormalMatrixShaderNode } from '../nodes/NormalMatrixShaderNode';
import { NormalizeShaderNode } from '../nodes/NormalizeShaderNode';
import { NotEqualShaderNode } from '../nodes/NotEqualShaderNode';
import { OrShaderNode } from '../nodes/OrShaderNode';
import { OutColorShaderNode } from '../nodes/OutColorShaderNode';
import { OutPositionShaderNode } from '../nodes/OutPositionShaderNode';
import { PbrAnisotropyPropsShaderNode } from '../nodes/PbrAnisotropyPropsShaderNode';
import { PbrAnisotropyRotationShaderNode } from '../nodes/PbrAnisotropyRotationShaderNode';
import { PbrBaseColorPropsShaderNode } from '../nodes/PbrBaseColorPropsShaderNode';
import { PbrClearcoatPropsShaderNode } from '../nodes/PbrClearcoatPropsShaderNode';
import { PbrDiffuseTransmissionPropsShaderNode } from '../nodes/PbrDiffuseTransmissionPropsShaderNode';
import { PbrEmissivePropsShaderNode } from '../nodes/PbrEmissivePropsShaderNode';
import { PbrIridescencePropsShaderNode } from '../nodes/PbrIridescencePropsShaderNode';
import { PbrMetallicRoughnessPropsShaderNode } from '../nodes/PbrMetallicRoughnessPropsShaderNode';
import { PbrNormalPropsShaderNode } from '../nodes/PbrNormalPropsShaderNode';
import { PbrOcclusionPropsShaderNode } from '../nodes/PbrOcclusionPropsShaderNode';
import { PbrShaderShaderNode } from '../nodes/PbrShaderShaderNode';
import { PbrSheenPropsShaderNode } from '../nodes/PbrSheenPropsShaderNode';
import { PbrSpecularPropsShaderNode } from '../nodes/PbrSpecularPropsShaderNode';
import { PbrTransmissionPropsShaderNode } from '../nodes/PbrTransmissionPropsShaderNode';
import { PbrVolumePropsShaderNode } from '../nodes/PbrVolumePropsShaderNode';
import { PremultipliedAlphaShaderNode } from '../nodes/PremultipliedAlphaShaderNode';
import { ProcessGeometryShaderNode } from '../nodes/ProcessGeometryShaderNode';
import { ProjectionMatrixShaderNode } from '../nodes/ProjectionMatrixShaderNode';
import { Random_HashPRNGShaderNode } from '../nodes/Random_HashPRNGShaderNode';
import { Random_SinHashShaderNode } from '../nodes/Random_SinHashShaderNode';
import { RemapShaderNode } from '../nodes/RemapShaderNode';
import { SinShaderNode } from '../nodes/SinShaderNode';
import { SmoothStepShaderNode } from '../nodes/SmoothStepShaderNode';
import { SplitVectorShaderNode } from '../nodes/SplitVectorShaderNode';
import { StepShaderNode } from '../nodes/StepShaderNode';
import { TanShaderNode } from '../nodes/TanShaderNode';
import { Texture2DShaderNode } from '../nodes/Texture2DShaderNode';
import { TimeShaderNode } from '../nodes/TimeShaderNode';
import { TransformShaderNode } from '../nodes/TransformShaderNode';
import { UniformDataShaderNode } from '../nodes/UniformDataShaderNode';
import { ViewMatrixShaderNode } from '../nodes/ViewMatrixShaderNode';
import { WorldMatrixShaderNode } from '../nodes/WorldMatrixShaderNode';
import { AbstractShaderNode, type ShaderNodeUID } from './AbstractShaderNode';
import type { SocketDefaultValue, ValueTypes } from './Socket';

/**
 * ShaderGraphResolver is a class that resolves the shader node graph and generates shader code.
 * It provides functionality to convert a graph of shader nodes into complete vertex and fragment shaders.
 */
export class ShaderGraphResolver {
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
  static createVertexShaderCode(
    engine: Engine,
    vertexNodes: AbstractShaderNode[],
    varyingNodes: AbstractShaderNode[],
    commonShaderPart: CommonShaderPart,
    isFullVersion = true
  ) {
    const shaderNodes = vertexNodes.concat();

    // const isValid = this.__validateShaderNodes(shaderNodes);
    // if (!isValid) {
    //   return undefined;
    // }

    // Topological Sorting
    const sortedShaderNodes = this.__sortTopologically(shaderNodes);
    // const sortedVaryingNodes = this.__sortTopologically(varyingNodes);

    // Add additional functions by system
    let vertexShaderPrerequisites = '';

    const nodes = sortedShaderNodes.concat(varyingNodes);

    if (isFullVersion) {
      vertexShaderPrerequisites += commonShaderPart.getVertexPrerequisites(engine, nodes);
    }

    let shaderBody = '';

    // function definitions
    shaderBody += ShaderGraphResolver.__getFunctionDefinition(
      engine,
      // sortedShaderNodes,
      sortedShaderNodes.concat(varyingNodes.filter(node => node.getShaderStage() !== 'Fragment')),
      ShaderType.VertexShader
    );

    // main process
    try {
      shaderBody += ShaderGraphResolver.__constructShaderWithNodes(
        engine,
        nodes,
        true,
        commonShaderPart,
        isFullVersion
      );
    } catch (e) {
      Logger.default.error(e as string);
      return undefined;
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
  static createPixelShaderCode(
    engine: Engine,
    pixelNodes: AbstractShaderNode[],
    commonShaderPart: CommonShaderPart,
    isFullVersion = true
  ) {
    const shaderNodes = pixelNodes.concat();

    // const isValid = this.__validateShaderNodes(shaderNodes);
    // if (!isValid) {
    //   return undefined;
    // }

    // Topological Sorting
    const sortedShaderNodes = this.__sortTopologically(shaderNodes);

    // Add additional functions by system
    let pixelShaderPrerequisites = '';
    if (isFullVersion) {
      pixelShaderPrerequisites += commonShaderPart.getPixelPrerequisites(engine, sortedShaderNodes);
    }
    let shaderBody = '';

    // function definitions
    shaderBody += ShaderGraphResolver.__getFunctionDefinition(
      engine,
      sortedShaderNodes.filter(node => node.getShaderStage() !== 'Vertex'),
      ShaderType.PixelShader
    );

    // main process
    try {
      shaderBody += ShaderGraphResolver.__constructShaderWithNodes(
        engine,
        sortedShaderNodes,
        false,
        commonShaderPart,
        isFullVersion
      );
    } catch (e) {
      Logger.default.error(e as string);
      return undefined;
    }

    const shader = pixelShaderPrerequisites + shaderBody;

    return shader;
  }

  /**
   * Validates that all shader nodes have their required input connections properly set.
   * This is a validation step to ensure the shader graph is complete before code generation.
   *
   * @param shaderNodes - Array of shader nodes to validate
   * @returns True if all nodes are valid, false if any node has missing required connections
   * @private
   */
  private static __validateShaderNodes(shaderNodes: AbstractShaderNode[]) {
    const _shaderNodeUids: ShaderNodeUID[] = [];
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
  private static __sortTopologically(shaderNodes: AbstractShaderNode[]) {
    const sortedNodeArray: AbstractShaderNode[] = [];
    const inputNumArray: Index[] = [];

    // calculate inputNumArray
    const queue: AbstractShaderNode[] = [];
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

    // collect output nodes
    const outputNodes: AbstractShaderNode[][] = [];
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

    // collect nodes which have no input
    for (let i = 0; i < shaderNodes.length; i++) {
      if (inputNumArray[i] === 0) {
        queue.push(shaderNodes[i]);
      }
    }

    // topological sort (BFS)
    while (queue.length > 0) {
      const now = queue.shift()!;
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
      Logger.default.error('graph is cyclic');
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
  private static __getFunctionDefinition(
    engine: Engine,
    shaderNodes: AbstractShaderNode[],
    shaderType: ShaderTypeEnum
  ) {
    let shaderText = '';
    const existVertexFunctions: string[] = [];
    for (let i = 0; i < shaderNodes.length; i++) {
      const materialNode = shaderNodes[i];
      if (existVertexFunctions.indexOf(materialNode.shaderFunctionName) !== -1) {
        continue;
      }
      shaderText += materialNode.getShaderCode(engine, shaderType);
      existVertexFunctions.push(materialNode.shaderFunctionName);
    }

    return shaderText;
  }

  /**
   * Defines varying variables for vertex-to-fragment communication.
   * @private
   */
  private static __defineVaryingVariables(
    engine: Engine,
    shaderNodes: AbstractShaderNode[],
    isVertexStage: boolean
  ): string {
    let shaderBody = '';
    const definedVaryings: Set<string> = new Set();

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
          if (inputNode.getShaderStage() === 'Vertex' && shaderNode.getShaderStage() === 'Fragment') {
            const varyingName = `v_${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid}_${inputConnection.outputNameOfPrev}`;
            if (definedVaryings.has(varyingName)) {
              continue;
            }
            definedVaryings.add(varyingName);
            const type = input.compositionType.getGlslStr(input.componentType);
            // Integer and boolean types require flat interpolation in GLSL ES 3.0
            const needsFlat =
              input.componentType.isInteger() ||
              input.componentType.isUnsignedInteger() ||
              input.componentType === ComponentType.Bool;
            const flatModifier = needsFlat ? 'flat ' : '';
            shaderBody += `${flatModifier}${isVertexStage ? 'out' : 'in'} ${type} ${varyingName};\n`;
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
  private static __collectVariableNames(
    engine: Engine,
    shaderNodes: AbstractShaderNode[],
    isVertexStage: boolean,
    commonShaderPart: CommonShaderPart
  ): {
    varInputNames: Array<Array<string>>;
    varOutputNames: Array<Array<string>>;
    collectedShaderBody: string;
  } {
    const varInputNames: Array<Array<string>> = [];
    const varOutputNames: Array<Array<string>> = [];
    let collectedShaderBody = '';

    const existingInputs: Set<string> = new Set();
    const existingOutputs: Set<string> = new Set();
    // Key format: "${shaderNodeUid}_${outputName}" to track each output separately
    const existingOutputsVarName: Map<string, string> = new Map();

    // Pre-initialize arrays for all nodes to avoid undefined access
    for (let i = 0; i < shaderNodes.length; i++) {
      varInputNames[i] = [];
      varOutputNames[i] = [];
    }

    // First pass: collect all output variable names
    // This ensures existingOutputsVarName is fully populated before input processing
    // Fixes timing issue where a consumer node is processed before its producer
    for (let i = 0; i < shaderNodes.length; i++) {
      this.__collectOutputsForNode(i, shaderNodes, varOutputNames, existingOutputs, existingOutputsVarName);
    }

    // Second pass: process all input connections using the collected output variable names
    for (let i = 0; i < shaderNodes.length; i++) {
      collectedShaderBody += this.__collectInputsForNode(
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
  private static __collectInputsForNode(
    engine: Engine,
    nodeIndex: number,
    shaderNodes: AbstractShaderNode[],
    varInputNames: Array<Array<string>>,
    varOutputNames: Array<Array<string>>,
    existingInputs: Set<string>,
    existingOutputsVarName: Map<string, string>,
    isVertexStage: boolean,
    commonShaderPart: CommonShaderPart
  ): string {
    const shaderNode = shaderNodes[nodeIndex];

    if (varInputNames[nodeIndex] == null) {
      varInputNames[nodeIndex] = [];
    }
    if (nodeIndex - 1 >= 0 && varOutputNames[nodeIndex - 1] == null) {
      varOutputNames[nodeIndex - 1] = [];
    }

    const inputConnections = shaderNode.inputConnections;
    let shaderBody = '';

    for (let j = 0; j < shaderNode.getInputs().length; j++) {
      const inputConnection = inputConnections[j];
      if (inputConnection == null) {
        const defaultValue = this.__getDefaultInputValue(engine, shaderNode, j);
        if (defaultValue) {
          varInputNames[nodeIndex].push(defaultValue);
        }
        continue;
      }

      const { varName, rowStr } = this.__processInputConnection(
        engine,
        inputConnection,
        shaderNode,
        isVertexStage,
        existingInputs,
        commonShaderPart
      );

      // Use outputNameOfPrev to get the correct variable name for this specific output
      const outputKey = `${inputConnection.shaderNodeUid}_${inputConnection.outputNameOfPrev}`;
      const existVarName = existingOutputsVarName.get(outputKey);

      // When a Fragment-stage node consumes from a Vertex-stage node, always use the
      // current varName (which has the varying read) instead of reusing existVarName
      // (which may have been set by a Vertex-stage consumer without varying read).
      const inputNode = AbstractShaderNode._shaderNodes[inputConnection.shaderNodeUid];
      const isFragmentConsumingVertex =
        !isVertexStage && inputNode.getShaderStage() === 'Vertex' && shaderNode.getShaderStage() === 'Fragment';
      const usedVarName = isFragmentConsumingVertex ? varName : existVarName || varName;

      // Only add declaration to shaderBody if we're using varName (not an existing variable)
      // This prevents declaring unused variables when reusing an existing variable
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
  private static __isStructDefaultValue(defaultValue: SocketDefaultValue): defaultValue is Record<string, ValueTypes> {
    // ValueTypes (Vector, Scalar, Matrix) have a _v property which is a TypedArray
    // Struct default values are plain objects with string keys and ValueTypes values
    if (typeof defaultValue !== 'object' || defaultValue === null) {
      return false;
    }
    // Check if it's a ValueTypes by looking for the _v property (TypedArray)
    if ('_v' in defaultValue && ArrayBuffer.isView((defaultValue as ValueTypes)._v)) {
      return false;
    }
    return true;
  }

  /**
   * Gets the struct name from the compositionType's glslStr property.
   * If the glslStr starts with 'struct ', extracts and returns the struct name.
   * @private
   */
  private static __getStructName(compositionType: CompositionTypeEnum): string | undefined {
    // Use ComponentType.Float to get the raw glslStr (ComponentType.Unknown returns 'unknown')
    const glslStr = compositionType.getGlslStr(ComponentType.Unknown);
    if (glslStr.startsWith('struct ')) {
      return glslStr.replace('struct ', '');
    }
    return undefined;
  }

  /**
   * Generates a shader initialization string for a struct type default value.
   * @private
   */
  private static __getStructDefaultValueString(
    compositionType: CompositionTypeEnum,
    defaultValue: Record<string, ValueTypes>,
    isWebGPU: boolean
  ): string {
    // Get the struct type name from the compositionType's glslStr
    const structName = this.__getStructName(compositionType) ?? '';

    // Build the member initialization values in the order they appear in the default value object
    const memberValues: string[] = [];
    for (const [_key, value] of Object.entries(defaultValue)) {
      if (isWebGPU) {
        memberValues.push(value.wgslStrAsFloat);
      } else {
        memberValues.push(value.glslStrAsFloat);
      }
    }

    // Generate struct initialization: StructName(member1, member2, ...)
    return `${structName}(${memberValues.join(', ')})`;
  }

  /**
   * Gets default value for an input socket.
   * If the socket has a defaultValue defined, it will be used.
   * Otherwise, a zero value based on the socket's compositionType and componentType will be generated.
   * @private
   */
  private static __getDefaultInputValue(engine: Engine, shaderNode: AbstractShaderNode, inputIndex: number): string {
    const inputSocket = shaderNode.getInputs()[inputIndex];
    const isWebGPU = engine.engineState.currentProcessApproach === ProcessApproach.WebGPU;
    const isBool = inputSocket.componentType === ComponentType.Bool;
    const isInt =
      inputSocket.componentType === ComponentType.Int || inputSocket.componentType === ComponentType.UnsignedInt;

    // If defaultValue is set, use it
    if (inputSocket.defaultValue != null) {
      // Check if defaultValue is a struct type (Record<string, ValueTypes>)
      if (this.__isStructDefaultValue(inputSocket.defaultValue)) {
        return this.__getStructDefaultValueString(inputSocket.compositionType, inputSocket.defaultValue, isWebGPU);
      }

      // Handle primitive ValueTypes
      const primitiveValue = inputSocket.defaultValue as ValueTypes;
      if (isBool) {
        return primitiveValue._v[0] > 0.5 ? 'true' : 'false';
      }
      if (inputSocket.componentType === ComponentType.UnsignedInt) {
        return isWebGPU ? primitiveValue.wgslStrAsUint : primitiveValue.glslStrAsUint;
      }
      if (isInt) {
        return isWebGPU ? primitiveValue.wgslStrAsInt : primitiveValue.glslStrAsInt;
      }
      return isWebGPU ? primitiveValue.wgslStrAsFloat : primitiveValue.glslStrAsFloat;
    }

    // If defaultValue is not set, generate zero value based on compositionType and componentType
    return isWebGPU
      ? inputSocket.compositionType.getWgslInitialValue(inputSocket.componentType)
      : inputSocket.compositionType.getGlslInitialValue(inputSocket.componentType);
  }

  /**
   * Processes an input connection and returns variable name and shader statement.
   * @private
   */
  private static __processInputConnection(
    engine: Engine,
    inputConnection: any,
    shaderNode: AbstractShaderNode,
    isVertexStage: boolean,
    existingInputs: Set<string>,
    commonShaderPart: CommonShaderPart
  ): { varName: string; rowStr: string } {
    const inputNode = AbstractShaderNode._shaderNodes[inputConnection.shaderNodeUid];
    const outputSocketOfPrev = inputNode.getOutput(inputConnection.outputNameOfPrev);
    const inputSocketOfThis = shaderNode.getInput(inputConnection.inputNameOfThis);
    const varName = `${outputSocketOfPrev!.name}_${inputConnection.shaderNodeUid}_to_${shaderNode.shaderNodeUid}`;

    let rowStr = '';
    // When a Fragment-stage node consumes from a Vertex-stage node, use a unique key
    // to avoid conflicts with Vertex-stage nodes that also consume the same output.
    // Include the consumer node's UID to ensure each Fragment-stage consumer gets its own varying read.
    const isFragmentConsumingVertex =
      !isVertexStage && inputNode.getShaderStage() === 'Vertex' && shaderNode.getShaderStage() === 'Fragment';
    const baseInputKey = `${inputNode.shaderNodeUid}_${inputConnection.outputNameOfPrev}`;
    const inputKey = isFragmentConsumingVertex
      ? `${baseInputKey}_toFragment_${shaderNode.shaderNodeUid}`
      : baseInputKey;

    if (!existingInputs.has(inputKey)) {
      rowStr = commonShaderPart.getAssignmentStatement(engine, varName, inputSocketOfThis!);
      if (isFragmentConsumingVertex) {
        rowStr = commonShaderPart.getAssignmentVaryingStatementInPixelShader(
          engine,
          varName,
          inputSocketOfThis!,
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
  private static __collectOutputsForNode(
    nodeIndex: number,
    shaderNodes: AbstractShaderNode[],
    varOutputNames: Array<Array<string>>,
    existingOutputs: Set<string>,
    existingOutputsVarName: Map<string, string>
  ): void {
    const prevShaderNode = shaderNodes[nodeIndex - 1];
    if (!prevShaderNode) return;

    // Check ALL nodes for connections from prevShaderNode, not just those at nodeIndex or later.
    // This fixes the issue where a consumer node comes before the producer in topological sort
    // (e.g., when a Neutral-stage node resolved to Vertex consumes from a Vertex-stage node).
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
          const varName = `${outputSocketOfPrev!.name}_${inputConnection.shaderNodeUid}_to_${
            targetShaderNode.shaderNodeUid
          }`;

          if (nodeIndex - 1 >= 0) {
            varOutputNames[nodeIndex - 1].push(varName);
          }
          // Use outputKey to track each output separately (fixes multiple outputs from same node)
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
  private static __generateShaderCode(
    engine: Engine,
    shaderNodes: AbstractShaderNode[],
    varInputNames: Array<Array<string>>,
    varOutputNames: Array<Array<string>>,
    isVertexStage: boolean
  ): string {
    let shaderBody = '';
    let dummyVarCounter = 0;

    for (let i = 0; i < shaderNodes.length; i++) {
      const shaderNode = shaderNodes[i];

      // Skip nodes not in current stage
      if (
        (isVertexStage && shaderNode.getShaderStage() === 'Fragment') ||
        (!isVertexStage && shaderNode.getShaderStage() === 'Vertex')
      ) {
        continue;
      }

      // Ensure arrays are initialized
      if (varInputNames[i] == null) {
        varInputNames[i] = [];
      }
      if (varOutputNames[i] == null) {
        varOutputNames[i] = [];
      }

      // Reorder output variables to match the output socket order and fill missing ones with dummy variables
      // This ensures function calls are generated with arguments in the correct order
      const outputs = shaderNode.getOutputs();
      // Always reorder when there are outputs to ensure correct argument order in function calls
      // Previously this only triggered when varOutputNames.length !== outputs.length, which missed
      // cases where all outputs were connected but in wrong order due to connection processing order
      if (outputs.length > 0) {
        // Build a map from output name to variable name
        const outputNameToVarName: Map<string, string> = new Map();
        const nodeUidPattern = `_${shaderNode.shaderNodeUid}_to_`;
        for (const varName of varOutputNames[i]) {
          // Variable name format: ${outputName}_${shaderNodeUid}_to_${targetNodeUid}
          const splitIndex = varName.indexOf(nodeUidPattern);
          if (splitIndex !== -1) {
            const outputName = varName.substring(0, splitIndex);
            outputNameToVarName.set(outputName, varName);
          }
        }

        // Create ordered output variable names array matching output socket order
        const orderedOutputVarNames: string[] = [];
        const isWebGPU = engine.engineState.currentProcessApproach === ProcessApproach.WebGPU;
        for (let j = 0; j < outputs.length; j++) {
          const output = outputs[j];
          const existingVarName = outputNameToVarName.get(output.name);
          if (existingVarName) {
            orderedOutputVarNames.push(existingVarName);
          } else {
            // Generate dummy variable for unconnected output
            const type = isWebGPU
              ? output.compositionType.toWGSLType(output.componentType)
              : output.compositionType.getGlslStr(output.componentType);
            const dummyVarName = `dummy${type.replace(/[<>]/g, '')}_${dummyVarCounter++}`;

            // Declare the dummy variable
            if (isWebGPU) {
              shaderBody += `var ${dummyVarName}: ${type};\n`;
            } else {
              shaderBody += `${type} ${dummyVarName};\n`;
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
  private static __handleVertexToFragmentPassing(
    engine: Engine,
    shaderNodes: AbstractShaderNode[],
    _varInputNames: Array<Array<string>>,
    varOutputNames: Array<Array<string>>
  ): string {
    let shaderBody = '';
    const assignedVaryings: Set<string> = new Set();

    for (let i = 0; i < shaderNodes.length; i++) {
      const shaderNode = shaderNodes[i];

      for (let j = 0; j < shaderNode.inputConnections.length; j++) {
        const inputConnection = shaderNode.inputConnections[j];
        if (inputConnection == null) {
          continue;
        }

        const inputNode = AbstractShaderNode.getShaderNodeByUid(inputConnection.shaderNodeUid);
        if (inputNode.getShaderStage() === 'Vertex' && shaderNode.getShaderStage() === 'Fragment') {
          const varyingName = `v_${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid}_${inputConnection.outputNameOfPrev}`;
          if (assignedVaryings.has(varyingName)) {
            continue;
          }
          assignedVaryings.add(varyingName);

          // Find the source variable name from the input node's outputs
          const inputNodeIndex = shaderNodes.indexOf(inputNode);
          if (inputNodeIndex >= 0 && varOutputNames[inputNodeIndex]) {
            // Find the output variable by searching for the matching output name in varOutputNames
            // varOutputNames contains names like "outPositionInWorld_123_to_456"
            const outputNamePrefix = `${inputConnection.outputNameOfPrev}_${inputNode.shaderNodeUid}_to_`;
            let sourceVarName: string | undefined;
            for (const varName of varOutputNames[inputNodeIndex]) {
              if (varName.startsWith(outputNamePrefix)) {
                sourceVarName = varName;
                break;
              }
            }
            if (sourceVarName) {
              if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
                shaderBody += `output.${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid}_${inputConnection.outputNameOfPrev} = ${sourceVarName};\n`;
              } else {
                shaderBody += `${varyingName} = ${sourceVarName};\n`;
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
  private static __constructShaderWithNodes(
    engine: Engine,
    shaderNodes: AbstractShaderNode[],
    isVertexStage: boolean,
    commonShaderPart: CommonShaderPart,
    isFullVersion: boolean
  ) {
    let shaderBody = '';

    // Define varying variables
    shaderBody += this.__defineVaryingVariables(engine, shaderNodes, isVertexStage);

    shaderBody += commonShaderPart.getMainBegin(engine, isVertexStage);

    if (isFullVersion) {
      shaderBody += commonShaderPart.getMainPrerequisites();
    }

    // Collect input/output variable names
    const { varInputNames, varOutputNames, collectedShaderBody } = this.__collectVariableNames(
      engine,
      shaderNodes,
      isVertexStage,
      commonShaderPart
    );
    shaderBody += collectedShaderBody;

    // Generate shader code
    shaderBody += this.__generateShaderCode(engine, shaderNodes, varInputNames, varOutputNames, isVertexStage);

    // Handle vertex-to-fragment data passing
    if (isVertexStage) {
      shaderBody += this.__handleVertexToFragmentPassing(engine, shaderNodes, varInputNames, varOutputNames);
    }

    shaderBody += commonShaderPart.getMainEnd(engine, isVertexStage);

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
   * @returns Object containing both vertex and fragment shader code, texture names used, or undefined if generation fails
   * @example
   * ```typescript
   * const shaderCode = ShaderGraphResolver.generateShaderCodeFromJson(engine, graphJson);
   * if (shaderCode) {
   *   const { vertexShader, pixelShader, textureNames } = shaderCode;
   *   // Use the generated shaders...
   * }
   * ```
   */
  public static generateShaderCodeFromJson(
    engine: Engine,
    json: ShaderNodeJson
  ):
    | {
        vertexShader: string;
        pixelShader: string;
        textureInfos: { name: string; stage: string; defaultTexture: string }[];
      }
    | undefined {
    const { nodeInstances, textureInfos } = constructNodes(json);
    const constructedNodes = Object.values(nodeInstances);
    const nodes = this.__sortTopologically(constructedNodes);
    resolveShaderStage(nodes);
    const varyingNodes = filterNodesForVarying(nodes, 'outColor');
    const varyingNodesForDiscard = filterNodesForVarying(nodes, 'conditionalDiscard');
    const allVaryingNodes = [...new Set([...varyingNodes, ...varyingNodesForDiscard])];

    const vertexNodes = filterNodes(nodes, ['outPosition']);
    const pixelNodes = filterNodes(nodes, ['outColor', 'conditionalDiscard']);

    if (vertexNodes.length === 0 || pixelNodes.length === 0) {
      return;
    }

    const commonShaderPart = new StandardShaderPart();
    const vertexRet = ShaderGraphResolver.createVertexShaderCode(
      engine,
      vertexNodes,
      allVaryingNodes,
      commonShaderPart
    );
    const pixelRet = ShaderGraphResolver.createPixelShaderCode(engine, pixelNodes, commonShaderPart);
    if (vertexRet == null || pixelRet == null) {
      return;
    }

    return { vertexShader: vertexRet, pixelShader: pixelRet, textureInfos };
  }
}

/**
 * Recursively filters shader nodes starting from a specific end node by traversing backwards
 * through input connections. This is a helper function for dependency analysis.
 *
 * @param nodes - Array of all available shader nodes
 * @param endNodeName - Name of the target end node to start filtering from
 * @returns Array of nodes that contribute to the specified end node
 * @private
 */
function filterNodesInner(nodes: AbstractShaderNode[], endNodeName: string) {
  let endNode: AbstractShaderNode | undefined;
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

  const filteredNodes: AbstractShaderNode[] = [endNode];

  function traverseNodes(node: AbstractShaderNode) {
    for (let i = 0; i < node.inputConnections.length; i++) {
      const inputConnection = node.inputConnections[i];
      if (inputConnection != null) {
        const inputNode = AbstractShaderNode.getShaderNodeByUid(inputConnection.shaderNodeUid);
        if (inputNode != null) {
          filteredNodes.push(inputNode);
          traverseNodes(inputNode);
        }
      }
    }
  }

  traverseNodes(endNode);

  return filteredNodes;
}

/**
 * Filters shader nodes to include only those that contribute to the specified end nodes.
 * This function is used to separate vertex and fragment processing pipelines by identifying
 * which nodes contribute to specific output targets (e.g., position, color).
 *
 * @param nodes - Array of all shader nodes in the graph
 * @param endNodesName - Array of end node names to filter for (e.g., ['outPosition', 'outColor'])
 * @returns Array of unique nodes that contribute to any of the specified end nodes
 * @private
 */
function filterNodes(nodes: AbstractShaderNode[], endNodesName: string[]) {
  let finalFilterNodes: AbstractShaderNode[] = [];
  for (let i = 0; i < endNodesName.length; i++) {
    const endNodeName = endNodesName[i];
    const filteredNodes = filterNodesInner(nodes, endNodeName);
    finalFilterNodes = finalFilterNodes.concat(filteredNodes);
  }

  // Remove duplicates
  finalFilterNodes = [...new Set(finalFilterNodes)];

  return finalFilterNodes;
}

/**
 * Resolves and assigns appropriate shader stages (Vertex/Fragment) to nodes based on their dependencies.
 * This function propagates stage information through the node graph, ensuring that nodes
 * are assigned to the correct shader stage based on their connections and usage patterns.
 *
 * @param shaderNodes - Array of shader nodes to resolve stages for
 * @private
 */
function resolveShaderStage(shaderNodes: AbstractShaderNode[]) {
  for (let i = 0; i < shaderNodes.length; i++) {
    const shaderNode = shaderNodes[i];
    for (const inputConnection of shaderNode.inputConnections) {
      if (inputConnection == null) {
        continue;
      }
      const inputNode = AbstractShaderNode.getShaderNodeByUid(inputConnection.shaderNodeUid);
      if (inputNode.getShaderStage() === 'Vertex' && shaderNode.getShaderStage() === 'Neutral') {
        shaderNode.setShaderStage('Vertex');
      } else if (inputNode.getShaderStage() === 'Fragment') {
        shaderNode.setShaderStage('Fragment');
      }
    }
  }
}

/**
 * Identifies shader nodes that need to pass data from vertex to fragment stage (varying variables).
 * This function traces the dependency graph to find nodes that bridge between vertex and fragment
 * processing, which require special handling for inter-stage communication.
 *
 * @param nodes - Array of all shader nodes in the graph
 * @param endNodeName - Name of the final output node (typically 'outColor' for fragment output)
 * @returns Array of nodes that require varying variable declarations for vertex-to-fragment data passing
 * @private
 */
function filterNodesForVarying(nodes: AbstractShaderNode[], endNodeName: string) {
  // Find the end node
  let endNode: AbstractShaderNode | undefined;
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

  let varyingNodes: AbstractShaderNode[] = [];
  function traverseNodesAll(node: AbstractShaderNode) {
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

  function traverseNodes(node: AbstractShaderNode) {
    for (let i = 0; i < node.inputConnections.length; i++) {
      const inputConnection = node.inputConnections[i];
      if (inputConnection == null) {
        continue;
      }
      const inputNode = AbstractShaderNode.getShaderNodeByUid(inputConnection.shaderNodeUid);
      if (inputNode != null && inputNode.getShaderStage() === 'Vertex' && node.getShaderStage() === 'Fragment') {
        varyingNodes.push(inputNode);
        if (node.getShaderStage() === 'Fragment') {
          varyingNodes.unshift(node);
        }
        traverseNodesAll(inputNode);
        // Continue checking other input connections instead of breaking
      } else {
        traverseNodes(inputNode);
      }
    }
  }

  traverseNodes(endNode);

  // Remove duplicates
  varyingNodes = [...new Set(varyingNodes)];

  return varyingNodes.reverse();
}

/**
 * Constructs concrete shader node instances from a JSON shader graph definition.
 * This function deserializes the JSON representation into actual shader node objects,
 * setting up their properties, connections, and default values based on the JSON data.
 *
 * @param json - JSON object containing the complete shader graph definition with nodes and connections
 * @returns Object containing node instances record and array of texture names used
 * @throws Error if unknown node types are encountered or if connections cannot be established
 * @private
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This function handles many shader node types and requires a large switch statement
function constructNodes(json: ShaderNodeJson): {
  nodeInstances: Record<string, AbstractShaderNode>;
  textureInfos: { name: string; stage: string; defaultTexture: string }[];
} {
  // Create Node Instances
  const nodeInstances: Record<string, AbstractShaderNode> = {};
  const nodes: Record<string, any> = {};
  const textureInfos: { name: string; stage: string; defaultTexture: string }[] = [];
  for (const node of json.nodes) {
    nodes[node.id] = node;
    switch (node.name) {
      case 'ConstantScalarBool': {
        const nodeInstance = new ConstantScalarVariableShaderNode(ComponentType.Bool);
        nodeInstance.setDefaultInputValue(Scalar.fromCopyNumber(node.controls.in1.value ? 1 : 0));
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'ConstantScalarFloat': {
        const nodeInstance = new ConstantScalarVariableShaderNode(ComponentType.Float);
        nodeInstance.setDefaultInputValue(Scalar.fromCopyNumber(node.controls.in1.value));
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'ConstantScalarUint': {
        const nodeInstance = new ConstantScalarVariableShaderNode(ComponentType.UnsignedInt);
        nodeInstance.setDefaultInputValue(Scalar.fromCopyNumber(node.controls.in1.value));
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'ConstantVector2Float': {
        const nodeInstance = new ConstantVector2VariableShaderNode(ComponentType.Float);
        nodeInstance.setDefaultInputValue(Vector2.fromCopy2(node.controls.in1.value, node.controls.in2.value));
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'ConstantVector3Float': {
        const nodeInstance = new ConstantVector3VariableShaderNode(ComponentType.Float);
        nodeInstance.setDefaultInputValue(
          Vector3.fromCopy3(node.controls.in1.value, node.controls.in2.value, node.controls.in3.value)
        );
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'ConstantVector4Float': {
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
      case 'UniformScalarFloat': {
        const nodeInstance = new UniformDataShaderNode(CompositionType.Scalar, ComponentType.Float);
        nodeInstance.setDefaultInputValue('value', Scalar.fromCopyNumber(node.controls.initialValue.value));
        nodeInstance.setUniformDataName(node.controls.name.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'UniformVector2Float': {
        const nodeInstance = new UniformDataShaderNode(CompositionType.Vec2, ComponentType.Float);
        nodeInstance.setDefaultInputValue(
          'value',
          Vector2.fromCopy2(node.controls.initialX.value, node.controls.initialY.value)
        );
        nodeInstance.setUniformDataName(node.controls.name.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'UniformVector3Float': {
        const nodeInstance = new UniformDataShaderNode(CompositionType.Vec3, ComponentType.Float);
        nodeInstance.setDefaultInputValue(
          'value',
          Vector3.fromCopy3(node.controls.initialX.value, node.controls.initialY.value, node.controls.initialZ.value)
        );
        nodeInstance.setUniformDataName(node.controls.name.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'UniformVector4Float': {
        const nodeInstance = new UniformDataShaderNode(CompositionType.Vec4, ComponentType.Float);
        nodeInstance.setDefaultInputValue(
          'value',
          Vector4.fromCopyArray4([
            node.controls.initialX.value,
            node.controls.initialY.value,
            node.controls.initialZ.value,
            node.controls.initialW.value,
          ])
        );
        nodeInstance.setUniformDataName(node.controls.name.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Texture2D': {
        const nodeInstance = new Texture2DShaderNode();
        const textureName = node.controls.name.value;
        const shaderStage = node.controls.shaderStage.value;
        // Get the default texture type from the node control (defaults to dummyWhiteTexture if not specified)
        const defaultTexture = node.controls.defaultTexture?.value ?? 'dummyWhiteTexture';
        nodeInstance.setTextureName(textureName);
        nodeInstance.setShaderStage(shaderStage);
        nodeInstance.setSrgbFlag(node.controls.sRGB?.value ?? true);
        textureInfos.push({ name: textureName, stage: shaderStage, defaultTexture });
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Time': {
        const nodeInstance = new TimeShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Add': {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance: AddShaderNode;
        if (socketName.startsWith('Scalar')) {
          nodeInstance = new AddShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName.startsWith('Vector2')) {
          nodeInstance = new AddShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith('Vector3')) {
          nodeInstance = new AddShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith('Vector4')) {
          nodeInstance = new AddShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Add node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Sin': {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance: SinShaderNode;
        if (socketName.startsWith('Scalar')) {
          nodeInstance = new SinShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName.startsWith('Vector2')) {
          nodeInstance = new SinShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith('Vector3')) {
          nodeInstance = new SinShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith('Vector4')) {
          nodeInstance = new SinShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Sin node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Cos': {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance: CosShaderNode;
        if (socketName.startsWith('Scalar')) {
          nodeInstance = new CosShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName.startsWith('Vector2')) {
          nodeInstance = new CosShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith('Vector3')) {
          nodeInstance = new CosShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith('Vector4')) {
          nodeInstance = new CosShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Cos node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Tan': {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance: TanShaderNode;
        if (socketName.startsWith('Scalar')) {
          nodeInstance = new TanShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName.startsWith('Vector2')) {
          nodeInstance = new TanShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith('Vector3')) {
          nodeInstance = new TanShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith('Vector4')) {
          nodeInstance = new TanShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Tan node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Step': {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance: StepShaderNode;
        if (socketName.startsWith('Scalar')) {
          nodeInstance = new StepShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName.startsWith('Vector2')) {
          nodeInstance = new StepShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith('Vector3')) {
          nodeInstance = new StepShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith('Vector4')) {
          nodeInstance = new StepShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Add node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'SmoothStep': {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance: StepShaderNode;
        if (socketName.startsWith('Scalar')) {
          nodeInstance = new SmoothStepShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName.startsWith('Vector2')) {
          nodeInstance = new SmoothStepShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith('Vector3')) {
          nodeInstance = new SmoothStepShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith('Vector4')) {
          nodeInstance = new SmoothStepShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Add node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Clamp': {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance: ClampShaderNode;
        if (socketName.startsWith('Scalar')) {
          nodeInstance = new ClampShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName.startsWith('Vector2')) {
          nodeInstance = new ClampShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith('Vector3')) {
          nodeInstance = new ClampShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith('Vector4')) {
          nodeInstance = new ClampShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Clamp node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Remap': {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance: RemapShaderNode;
        if (socketName.startsWith('Scalar')) {
          nodeInstance = new RemapShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName.startsWith('Vector2')) {
          nodeInstance = new RemapShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith('Vector3')) {
          nodeInstance = new RemapShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith('Vector4')) {
          nodeInstance = new RemapShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Remap node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Normalize': {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance: NormalizeShaderNode;
        if (socketName.startsWith('Vector2')) {
          nodeInstance = new NormalizeShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith('Vector3')) {
          nodeInstance = new NormalizeShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith('Vector4')) {
          nodeInstance = new NormalizeShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Normalize node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Dot': {
        const socketName = node.inputs.in1.socket.name;
        let nodeInstance: DotProductShaderNode;
        if (socketName.startsWith('Vector2')) {
          nodeInstance = new DotProductShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith('Vector3')) {
          nodeInstance = new DotProductShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith('Vector4')) {
          nodeInstance = new DotProductShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Dot node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Length': {
        const socketName = node.inputs.in1.socket.name;

        // Determine component type from socket name
        let componentType: ComponentTypeEnum = ComponentType.Float;
        if (socketName.includes('<int>')) {
          componentType = ComponentType.Int;
        } else if (socketName.includes('<uint>')) {
          componentType = ComponentType.UnsignedInt;
        }

        let nodeInstance: LengthShaderNode;
        if (socketName.startsWith('Vector2')) {
          nodeInstance = new LengthShaderNode(CompositionType.Vec2, componentType);
        } else if (socketName.startsWith('Vector3')) {
          nodeInstance = new LengthShaderNode(CompositionType.Vec3, componentType);
        } else if (socketName.startsWith('Vector4')) {
          nodeInstance = new LengthShaderNode(CompositionType.Vec4, componentType);
        } else {
          Logger.default.error(`Length node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Multiply': {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance: MultiplyShaderNode;
        if (socketName.startsWith('Scalar')) {
          nodeInstance = new MultiplyShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName.startsWith('Vector2')) {
          nodeInstance = new MultiplyShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith('Vector3')) {
          nodeInstance = new MultiplyShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith('Vector4')) {
          nodeInstance = new MultiplyShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else if (socketName.startsWith('Matrix2')) {
          nodeInstance = new MultiplyShaderNode(CompositionType.Mat2, ComponentType.Float);
        } else if (socketName.startsWith('Matrix3')) {
          nodeInstance = new MultiplyShaderNode(CompositionType.Mat3, ComponentType.Float);
        } else if (socketName.startsWith('Matrix4')) {
          nodeInstance = new MultiplyShaderNode(CompositionType.Mat4, ComponentType.Float);
        } else {
          Logger.default.error(`Multiply node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Transform': {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance: TransformShaderNode;
        if (socketName.startsWith('Vector2')) {
          nodeInstance = new TransformShaderNode(
            CompositionType.Mat2,
            ComponentType.Float,
            CompositionType.Vec2,
            ComponentType.Float
          );
        } else if (socketName.startsWith('Vector3')) {
          nodeInstance = new TransformShaderNode(
            CompositionType.Mat3,
            ComponentType.Float,
            CompositionType.Vec3,
            ComponentType.Float
          );
        } else if (socketName.startsWith('Vector4')) {
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
      case 'SplitVector': {
        // Determine component type from input socket name
        let componentType: ComponentTypeEnum = ComponentType.Float;
        const inputSocketName =
          node.inputs.inXYZW?.socket?.name || node.inputs.inXYZ?.socket?.name || node.inputs.inXY?.socket?.name || '';
        if (inputSocketName.includes('<int>')) {
          componentType = ComponentType.Int;
        } else if (inputSocketName.includes('<uint>')) {
          componentType = ComponentType.UnsignedInt;
        }
        const nodeInstance = new SplitVectorShaderNode(componentType);
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'MergeVector': {
        // Determine component type from output socket name
        let componentType: ComponentTypeEnum = ComponentType.Float;
        const outputSocketName = node.outputs.outXYZW?.socket?.name || '';
        if (outputSocketName.includes('<int>')) {
          componentType = ComponentType.Int;
        } else if (outputSocketName.includes('<uint>')) {
          componentType = ComponentType.UnsignedInt;
        }
        const nodeInstance = new MergeVectorShaderNode(componentType);
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'CastToFloat': {
        // Determine composition type and input component type from socket names
        const inputSocketName = node.inputs.in1?.socket?.name || '';
        const outputSocketName = node.outputs.out1?.socket?.name || '';

        // Determine input component type
        let inputComponentType: ComponentTypeEnum = ComponentType.Int;
        if (inputSocketName.includes('<bool>')) {
          inputComponentType = ComponentType.Bool;
        } else if (inputSocketName.includes('<int>')) {
          inputComponentType = ComponentType.Int;
        } else if (inputSocketName.includes('<uint>')) {
          inputComponentType = ComponentType.UnsignedInt;
        }

        // Determine composition type from output socket and create node
        let nodeInstance: CastToFloatShaderNode;
        if (outputSocketName.includes('Vector4')) {
          nodeInstance = new CastToFloatShaderNode(CompositionType.Vec4, inputComponentType);
        } else if (outputSocketName.includes('Vector3')) {
          nodeInstance = new CastToFloatShaderNode(CompositionType.Vec3, inputComponentType);
        } else if (outputSocketName.includes('Vector2')) {
          nodeInstance = new CastToFloatShaderNode(CompositionType.Vec2, inputComponentType);
        } else {
          nodeInstance = new CastToFloatShaderNode(CompositionType.Scalar, inputComponentType);
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'ProcessGeometry': {
        const nodeInstance = new ProcessGeometryShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'AttributeColor': {
        const nodeInstance = new AttributeColorShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'AttributeNormal': {
        const nodeInstance = new AttributeNormalShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'AttributePosition': {
        const nodeInstance = new AttributePositionShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'AttributeTangent': {
        const nodeInstance = new AttributeTangentShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'AttributeTexcoord': {
        const nodeInstance = new AttributeTexcoordShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'AttributeJoint': {
        const nodeInstance = new AttributeJointShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'AttributeWeight': {
        const nodeInstance = new AttributeWeightShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'AttributeInstanceIds': {
        const nodeInstance = new AttributeInstanceIdsShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'WorldMatrix': {
        const nodeInstance = new WorldMatrixShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'ViewMatrix': {
        const nodeInstance = new ViewMatrixShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'ProjectionMatrix': {
        const nodeInstance = new ProjectionMatrixShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'NormalMatrix': {
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
      case 'Greater': {
        const nodeInstance = new GreaterShaderNode(CompositionType.Scalar, ComponentType.Float);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'LessThan': {
        const socketName = node.inputs.in1.socket.name;
        let nodeInstance: LessThanShaderNode;
        if (socketName.includes('<float>')) {
          nodeInstance = new LessThanShaderNode(ComponentType.Float);
        } else if (socketName.includes('<int>')) {
          nodeInstance = new LessThanShaderNode(ComponentType.Int);
        } else if (socketName.includes('<uint>')) {
          nodeInstance = new LessThanShaderNode(ComponentType.UnsignedInt);
        } else {
          Logger.default.error(`LessThan node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'LessOrEqual': {
        const socketName = node.inputs.in1.socket.name;
        let nodeInstance: LessOrEqualShaderNode;
        if (socketName.includes('<float>')) {
          nodeInstance = new LessOrEqualShaderNode(ComponentType.Float);
        } else if (socketName.includes('<int>')) {
          nodeInstance = new LessOrEqualShaderNode(ComponentType.Int);
        } else if (socketName.includes('<uint>')) {
          nodeInstance = new LessOrEqualShaderNode(ComponentType.UnsignedInt);
        } else {
          Logger.default.error(`LessOrEqual node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'GreaterThan': {
        const socketName = node.inputs.in1.socket.name;
        let nodeInstance: GreaterThanShaderNode;
        if (socketName.includes('<float>')) {
          nodeInstance = new GreaterThanShaderNode(ComponentType.Float);
        } else if (socketName.includes('<int>')) {
          nodeInstance = new GreaterThanShaderNode(ComponentType.Int);
        } else if (socketName.includes('<uint>')) {
          nodeInstance = new GreaterThanShaderNode(ComponentType.UnsignedInt);
        } else {
          Logger.default.error(`GreaterThan node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'GreaterOrEqual': {
        const socketName = node.inputs.in1.socket.name;
        let nodeInstance: GreaterOrEqualShaderNode;
        if (socketName.includes('<float>')) {
          nodeInstance = new GreaterOrEqualShaderNode(ComponentType.Float);
        } else if (socketName.includes('<int>')) {
          nodeInstance = new GreaterOrEqualShaderNode(ComponentType.Int);
        } else if (socketName.includes('<uint>')) {
          nodeInstance = new GreaterOrEqualShaderNode(ComponentType.UnsignedInt);
        } else {
          Logger.default.error(`GreaterOrEqual node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Equal': {
        const socketName = node.inputs.in1.socket.name;
        let nodeInstance: EqualShaderNode;
        if (socketName.includes('<float>')) {
          nodeInstance = new EqualShaderNode(ComponentType.Float);
        } else if (socketName.includes('<int>')) {
          nodeInstance = new EqualShaderNode(ComponentType.Int);
        } else if (socketName.includes('<uint>')) {
          nodeInstance = new EqualShaderNode(ComponentType.UnsignedInt);
        } else {
          Logger.default.error(`Equal node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'NotEqual': {
        const socketName = node.inputs.in1.socket.name;
        let nodeInstance: NotEqualShaderNode;
        if (socketName.includes('<float>')) {
          nodeInstance = new NotEqualShaderNode(ComponentType.Float);
        } else if (socketName.includes('<int>')) {
          nodeInstance = new NotEqualShaderNode(ComponentType.Int);
        } else if (socketName.includes('<uint>')) {
          nodeInstance = new NotEqualShaderNode(ComponentType.UnsignedInt);
        } else {
          Logger.default.error(`NotEqual node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'And': {
        const nodeInstance = new AndShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Or': {
        const nodeInstance = new OrShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Branch': {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance: BranchShaderNode;
        if (socketName.startsWith('Scalar')) {
          if (socketName.includes('<int>')) {
            nodeInstance = new BranchShaderNode(CompositionType.Scalar, ComponentType.Int);
          } else {
            nodeInstance = new BranchShaderNode(CompositionType.Scalar, ComponentType.Float);
          }
        } else if (socketName.startsWith('Vector2')) {
          nodeInstance = new BranchShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName.startsWith('Vector3')) {
          nodeInstance = new BranchShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName.startsWith('Vector4')) {
          nodeInstance = new BranchShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          Logger.default.error(`Branch node: Unknown socket name: ${socketName}`);
          break;
        }
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'OutPosition': {
        const nodeInstance = new OutPositionShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'OutColor': {
        const nodeInstance = new OutColorShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Discard': {
        const nodeInstance = new DiscardShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'FlatShader': {
        const nodeInstance = new FlatShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'ClassicShader': {
        const nodeInstance = new ClassicShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        // Set shading model from control value (Lambert: 1, Blinn-Phong: 2, Phong: 3)
        // Default is Blinn-Phong (2) if not specified
        if (node.controls.shadingModel?.value != null) {
          const shadingModelMap: Record<string, number> = {
            Lambert: 1,
            'Blinn-Phong': 2,
            Phong: 3,
          };
          const shadingModelValue = shadingModelMap[node.controls.shadingModel.value] ?? 2;
          nodeInstance.setShadingModel(shadingModelValue);
        }
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'PbrShader': {
        const nodeInstance = new PbrShaderShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'PbrBaseColorProps': {
        const nodeInstance = new PbrBaseColorPropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'PbrNormalProps': {
        const nodeInstance = new PbrNormalPropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'PbrMetallicRoughnessProps': {
        const nodeInstance = new PbrMetallicRoughnessPropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'PbrOcclusionProps': {
        const nodeInstance = new PbrOcclusionPropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'PbrEmissiveProps': {
        const nodeInstance = new PbrEmissivePropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'PbrSpecularProps': {
        const nodeInstance = new PbrSpecularPropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'PbrClearcoatProps': {
        const nodeInstance = new PbrClearcoatPropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'PbrSheenProps': {
        const nodeInstance = new PbrSheenPropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'PbrAnisotropyProps': {
        const nodeInstance = new PbrAnisotropyPropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'PbrAnisotropyRotation': {
        const nodeInstance = new PbrAnisotropyRotationShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'PbrIridescenceProps': {
        const nodeInstance = new PbrIridescencePropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'PbrTransmissionProps': {
        const nodeInstance = new PbrTransmissionPropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'PbrDiffuseTransmissionProps': {
        const nodeInstance = new PbrDiffuseTransmissionPropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'PbrVolumeProps': {
        const nodeInstance = new PbrVolumePropsShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'PremultipliedAlpha': {
        const nodeInstance = new PremultipliedAlphaShaderNode(ComponentType.Float);
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'AlphaTest': {
        const nodeInstance = new AlphaTestShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'CalcBitangent': {
        const nodeInstance = new CalcBitangentShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Random_HashPRNG': {
        const nodeInstance = new Random_HashPRNGShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Random_SinHash': {
        const nodeInstance = new Random_SinHashShaderNode();
        nodeInstance.setShaderStage(node.controls.shaderStage.value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
    }
  }

  // for (const connection of json.connections) {
  for (let i = 0; i < json.connections.length; i++) {
    const connection = json.connections[i];
    const inputNodeInstance = nodeInstances[connection.from.id] as AbstractShaderNode | undefined;
    const outputNodeInstance = nodeInstances[connection.to.id] as AbstractShaderNode | undefined;
    if (inputNodeInstance == null || outputNodeInstance == null) {
      Logger.default.error('inputNodeInstance or outputNodeInstance is null');
      continue;
    }

    // First, try to find sockets by name (for nodes with matching port names)
    let outputOfInputNode = inputNodeInstance.getOutput(connection.from.portName);
    let inputOfOutputNode = outputNodeInstance.getInput(connection.to.portName);

    // If name-based lookup fails for output, fall back to index-based lookup for output only
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

    // If name-based lookup fails for input, fall back to index-based lookup for input only
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
  return { nodeInstances, textureInfos };
}
