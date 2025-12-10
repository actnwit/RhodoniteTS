import type { Index } from '../../../types/CommonTypes';
import type { ShaderNodeJson } from '../../../types/ShaderNodeJson';
import { CommonShaderPart } from '../../../webgl/shaders/CommonShaderPart';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
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
import { AndShaderNode } from '../nodes/AndShaderNode';
import { AttributeColorShaderNode } from '../nodes/AttributeColorShaderNode';
import { AttributeJointShaderNode } from '../nodes/AttributeJointShaderNode';
import { AttributeNormalShaderNode } from '../nodes/AttributeNormalShaderNode';
import { AttributePositionShaderNode } from '../nodes/AttributePositionShaderNode';
import { AttributeTexcoordShaderNode } from '../nodes/AttributeTexcoordShaderNode';
import { AttributeWeightShaderNode } from '../nodes/AttributeWeightShaderNode';
import { BranchShaderNode } from '../nodes/BranchShaderNode';
import { CastToFloatShaderNode } from '../nodes/CastToFloatShaderNode';
import { ClampShaderNode } from '../nodes/ClampShaderNode';
import { ConstantScalarVariableShaderNode } from '../nodes/ConstantScalarVariableShaderNode';
import { ConstantVector2VariableShaderNode } from '../nodes/ConstantVector2VariableShaderNode';
import { ConstantVector3VariableShaderNode } from '../nodes/ConstantVector3VariableShaderNode';
import { ConstantVector4VariableShaderNode } from '../nodes/ConstantVector4VariableShaderNode';
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
import { ProcessGeometryShaderNode } from '../nodes/ProcessGeometryShaderNode';
import { ProjectionMatrixShaderNode } from '../nodes/ProjectionMatrixShaderNode';
import { RemapShaderNode } from '../nodes/RemapShaderNode';
import { SinShaderNode } from '../nodes/SinShaderNode';
import { SmoothStepShaderNode } from '../nodes/SmoothStepShaderNode';
import { SplitVectorShaderNode } from '../nodes/SplitVectorShaderNode';
import { StepShaderNode } from '../nodes/StepShaderNode';
import { TextureShaderNode } from '../nodes/TextureShaderNode';
import { TimeShaderNode } from '../nodes/TimeShaderNode';
import { TransformShaderNode } from '../nodes/TransformShaderNode';
import { UniformDataShaderNode } from '../nodes/UniformDataShaderNode';
import { ViewMatrixShaderNode } from '../nodes/ViewMatrixShaderNode';
import { WorldMatrixShaderNode } from '../nodes/WorldMatrixShaderNode';
import { AbstractShaderNode, type ShaderNodeUID } from './AbstractShaderNode';

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
   * @param vertexNodes - Array of shader nodes that contribute to vertex processing
   * @param varyingNodes - Array of shader nodes that pass data from vertex to fragment stage
   * @param isFullVersion - Whether to generate a full version with all prerequisites and boilerplate
   * @returns Complete vertex shader code as a string, or undefined if generation fails
   */
  static createVertexShaderCode(
    engine: Engine,
    vertexNodes: AbstractShaderNode[],
    varyingNodes: AbstractShaderNode[],
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
      vertexShaderPrerequisites += CommonShaderPart.getVertexPrerequisites(engine, nodes);
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
      shaderBody += ShaderGraphResolver.__constructShaderWithNodes(engine, nodes, true, isFullVersion);
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
   * @param pixelNodes - Array of shader nodes that contribute to fragment processing
   * @param isFullVersion - Whether to generate a full version with all prerequisites and boilerplate
   * @returns Complete fragment shader code as a string, or undefined if generation fails
   */
  static createPixelShaderCode(engine: Engine, pixelNodes: AbstractShaderNode[], isFullVersion = true) {
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
      pixelShaderPrerequisites += CommonShaderPart.getPixelPrerequisites(engine, sortedShaderNodes);
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
      shaderBody += ShaderGraphResolver.__constructShaderWithNodes(engine, sortedShaderNodes, false, isFullVersion);
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
            shaderBody += `${isVertexStage ? 'out' : 'in'} ${type} ${varyingName};\n`;
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
    isVertexStage: boolean
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

    // Start from index 0 to process all nodes, including those without input connections
    for (let i = 0; i < shaderNodes.length; i++) {
      collectedShaderBody += this.__collectInputsForNode(
        engine,
        i,
        shaderNodes,
        varInputNames,
        varOutputNames,
        existingInputs,
        existingOutputsVarName,
        isVertexStage
      );

      this.__collectOutputsForNode(i, shaderNodes, varOutputNames, existingOutputs, existingOutputsVarName);
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
    isVertexStage: boolean
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
        existingInputs
      );

      shaderBody += rowStr;
      // Use outputNameOfPrev to get the correct variable name for this specific output
      const outputKey = `${inputConnection.shaderNodeUid}_${inputConnection.outputNameOfPrev}`;
      const existVarName = existingOutputsVarName.get(outputKey);
      varInputNames[nodeIndex].push(existVarName || varName);
    }

    return shaderBody;
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
      if (isBool) {
        return inputSocket.defaultValue._v[0] > 0.5 ? 'true' : 'false';
      }
      if (isInt) {
        return isWebGPU ? inputSocket.defaultValue.wgslStrAsInt : inputSocket.defaultValue.glslStrAsInt;
      }
      return isWebGPU ? inputSocket.defaultValue.wgslStrAsFloat : inputSocket.defaultValue.glslStrAsFloat;
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
    existingInputs: Set<string>
  ): { varName: string; rowStr: string } {
    const inputNode = AbstractShaderNode._shaderNodes[inputConnection.shaderNodeUid];
    const outputSocketOfPrev = inputNode.getOutput(inputConnection.outputNameOfPrev);
    const inputSocketOfThis = shaderNode.getInput(inputConnection.inputNameOfThis);
    const varName = `${outputSocketOfPrev!.name}_${inputConnection.shaderNodeUid}_to_${shaderNode.shaderNodeUid}`;

    let rowStr = '';
    const inputKey = `${inputNode.shaderNodeUid}_${inputConnection.outputNameOfPrev}`;

    if (!existingInputs.has(inputKey)) {
      rowStr = CommonShaderPart.getAssignmentStatement(engine, varName, inputSocketOfThis!);
      if (!isVertexStage && inputNode.getShaderStage() === 'Vertex' && shaderNode.getShaderStage() === 'Fragment') {
        rowStr = CommonShaderPart.getAssignmentVaryingStatementInPixelShader(
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

    for (let j = nodeIndex; j < shaderNodes.length; j++) {
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
            // Find the output index matching outputNameOfPrev
            const outputs = inputNode.getOutputs();
            let outputIdx = 0;
            for (let k = 0; k < outputs.length; k++) {
              if (outputs[k].name === inputConnection.outputNameOfPrev) {
                outputIdx = k;
                break;
              }
            }
            const sourceVarName = varOutputNames[inputNodeIndex][outputIdx];
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
   * @param shaderNodes - Array of shader nodes sorted in topological order
   * @param isVertexStage - True for vertex shader generation, false for fragment
   * @param isFullVersion - Whether to include full shader boilerplate
   * @returns Complete shader main function body as a string
   * @throws Error if shader construction fails
   * @private
   */
  private static __constructShaderWithNodes(
    engine: Engine,
    shaderNodes: AbstractShaderNode[],
    isVertexStage: boolean,
    isFullVersion: boolean
  ) {
    let shaderBody = '';

    // Define varying variables
    shaderBody += this.__defineVaryingVariables(engine, shaderNodes, isVertexStage);

    shaderBody += CommonShaderPart.getMainBegin(engine, isVertexStage);

    if (isFullVersion) {
      shaderBody += CommonShaderPart.getMainPrerequisites();
    }

    // Collect input/output variable names
    const { varInputNames, varOutputNames, collectedShaderBody } = this.__collectVariableNames(
      engine,
      shaderNodes,
      isVertexStage
    );
    shaderBody += collectedShaderBody;

    // Generate shader code
    shaderBody += this.__generateShaderCode(engine, shaderNodes, varInputNames, varOutputNames, isVertexStage);

    // Handle vertex-to-fragment data passing
    if (isVertexStage) {
      shaderBody += this.__handleVertexToFragmentPassing(engine, shaderNodes, varInputNames, varOutputNames);
    }

    shaderBody += CommonShaderPart.getMainEnd(engine, isVertexStage);

    return shaderBody;
  }

  /**
   * Generates complete vertex and fragment shader code from a JSON shader node graph definition.
   * This is the main entry point for converting a serialized shader graph into executable shader code.
   * The method performs the full pipeline: node construction, dependency resolution, stage assignment,
   * and final code generation.
   *
   * @param json - JSON representation of the shader node graph containing nodes and connections
   * @returns Object containing both vertex and fragment shader code, texture names used, or undefined if generation fails
   * @example
   * ```typescript
   * const shaderCode = ShaderGraphResolver.generateShaderCodeFromJson(graphJson);
   * if (shaderCode) {
   *   const { vertexShader, pixelShader, textureNames } = shaderCode;
   *   // Use the generated shaders...
   * }
   * ```
   */
  public static generateShaderCodeFromJson(
    engine: Engine,
    json: ShaderNodeJson
  ): { vertexShader: string; pixelShader: string; textureInfos: { name: string; stage: string }[] } | undefined {
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

    const vertexRet = ShaderGraphResolver.createVertexShaderCode(engine, vertexNodes, allVaryingNodes);
    const pixelRet = ShaderGraphResolver.createPixelShaderCode(engine, pixelNodes);
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
  textureInfos: { name: string; stage: string }[];
} {
  // Create Node Instances
  const nodeInstances: Record<string, AbstractShaderNode> = {};
  const nodes: Record<string, any> = {};
  const textureInfos: { name: string; stage: string }[] = [];
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
        const nodeInstance = new TextureShaderNode(CompositionType.Texture2D);
        const textureName = node.controls.name.value;
        const shaderStage = node.controls.shaderStage.value;
        nodeInstance.setTextureName(textureName);
        nodeInstance.setShaderStage(shaderStage);
        textureInfos.push({ name: textureName, stage: shaderStage });
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
    let idx = 0;
    for (const key in nodes[connection.to.id].inputs) {
      if (key === connection.to.portName) {
        break;
      }
      idx++;
    }
    let idx2 = 0;
    for (const key in nodes[connection.from.id].outputs) {
      if (key === connection.from.portName) {
        break;
      }
      idx2++;
    }
    const outputOfInputNode = inputNodeInstance.getOutputs()[idx2];
    const inputOfOutputNode = outputNodeInstance.getInputs()[idx];
    outputNodeInstance.addInputConnection(inputNodeInstance, outputOfInputNode, inputOfOutputNode);
  }
  return { nodeInstances, textureInfos };
}
