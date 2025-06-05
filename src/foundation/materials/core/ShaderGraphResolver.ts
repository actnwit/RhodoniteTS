import { ShaderNodeUID, AbstractShaderNode } from './AbstractShaderNode';
import { Index } from '../../../types/CommonTypes';
import { ShaderType, ShaderTypeEnum } from '../../definitions/ShaderType';
import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import { CommonShaderPart } from '../../../webgl/shaders/CommonShaderPart';
import { ConstantScalarVariableShaderNode } from '../nodes/ConstantScalarVariableShaderNode';
import { Scalar } from '../../math/Scalar';
import { ConstantVector2VariableShaderNode } from '../nodes/ConstantVector2VariableShaderNode';
import { Vector2 } from '../../math/Vector2';
import { ConstantVector3VariableShaderNode } from '../nodes/ConstantVector3VariableShaderNode';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import { ConstantVector4VariableShaderNode } from '../nodes/ConstantVector4VariableShaderNode';
import { UniformDataShaderNode } from '../nodes/UniformDataShaderNode';
import { AddShaderNode } from '../nodes/AddShaderNode';
import { NormalizeShaderNode } from '../nodes/NormalizeShaderNode';
import { DotProductShaderNode } from '../nodes/DotProductShaderNode';
import { MultiplyShaderNode } from '../nodes/MultiplyShaderNode';
import { AttributeColorShaderNode } from '../nodes/AttributeColorShaderNode';
import { AttributeNormalShaderNode } from '../nodes/AttributeNormalShaderNode';
import { AttributePositionShaderNode } from '../nodes/AttributePositionShaderNode';
import { AttributeTexcoordShaderNode } from '../nodes/AttributeTexcoordShaderNode';
import { WorldMatrixShaderNode } from '../nodes/WorldMatrixShaderNode';
import { ViewMatrixShaderNode } from '../nodes/ViewMatrixShaderNode';
import { ProjectionMatrixShaderNode } from '../nodes/ProjectionMatrixShaderNode';
import { NormalMatrixShaderNode } from '../nodes/NormalMatrixShaderNode';
import { GreaterShaderNode } from '../nodes/GreaterShaderNode';
import { OutPositionShaderNode } from '../nodes/OutPositionShaderNode';
import { OutColorShaderNode } from '../nodes/OutColorShaderNode';
import { SystemState } from '../../system/SystemState';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { TransformShaderNode } from '../nodes/TransformShaderNode';
import { SinShaderNode } from '../nodes/SinShaderNode';
import { StepShaderNode } from '../nodes/StepShaderNode';
import { TimeShaderNode } from '../nodes/TimeShaderNode';
import { SmoothStepShaderNode } from '../nodes/SmoothStepShaderNode';
import { ShaderNodeJson } from '../../../types/ShaderNodeJson';
import { Logger } from '../../misc/Logger';
import { ProcessGeometryShaderNode } from '../nodes/ProcessGeometryShaderNode';
import { AttributeJointShaderNode } from '../nodes/AttributeJointShaderNode';
import { AttributeWeightShaderNode } from '../nodes/AttributeWeightShaderNode';
import { SplitVectorShaderNode } from '../nodes/SplitVectorShaderNode';
import { MergeVectorShaderNode } from '../nodes/MergeVectorShaderNode';

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
    vertexNodes: AbstractShaderNode[],
    varyingNodes: AbstractShaderNode[],
    isFullVersion: boolean = true
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
      vertexShaderPrerequisites += CommonShaderPart.getVertexPrerequisites(nodes);
    }

    let shaderBody = '';

    // function definitions
    shaderBody += ShaderGraphResolver.__getFunctionDefinition(
      // sortedShaderNodes,
      sortedShaderNodes.concat(varyingNodes.filter((node) => node.getShaderStage() !== 'Fragment')),
      ShaderType.VertexShader
    );

    // main process
    try {
      shaderBody += ShaderGraphResolver.__constructShaderWithNodes(nodes, true, isFullVersion);
    } catch (e) {
      Logger.error(e as string);
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
  static createPixelShaderCode(pixelNodes: AbstractShaderNode[], isFullVersion: boolean = true) {
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
      pixelShaderPrerequisites += CommonShaderPart.getPixelPrerequisites(sortedShaderNodes);
    }
    let shaderBody = '';

    // function definitions
    shaderBody += ShaderGraphResolver.__getFunctionDefinition(
      sortedShaderNodes.filter((node) => node.getShaderStage() !== 'Vertex'),
      ShaderType.PixelShader
    );

    // main process
    try {
      shaderBody += ShaderGraphResolver.__constructShaderWithNodes(
        sortedShaderNodes,
        false,
        isFullVersion
      );
    } catch (e) {
      Logger.error(e as string);
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
    const shaderNodeUids: ShaderNodeUID[] = [];
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

    if (sortedNodeArray.length != shaderNodes.length) {
      Logger.error('graph is cyclic');
    }

    return sortedNodeArray;
  }

  /**
   * Generates function definitions for all unique shader nodes.
   * Collects shader function code from each node type and removes duplicates
   * to create the function definition section of the shader.
   *
   * @param shaderNodes - Array of shader nodes to generate functions for
   * @param shaderType - Type of shader (vertex or fragment) being generated
   * @returns String containing all function definitions
   * @private
   */
  private static __getFunctionDefinition(
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
      shaderText += materialNode.getShaderCode(shaderType);
      existVertexFunctions.push(materialNode.shaderFunctionName);
    }

    return shaderText;
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
    shaderNodes: AbstractShaderNode[],
    isVertexStage: boolean,
    isFullVersion: boolean
  ) {
    let shaderBody = '';

    // Define varying(out) variables
    if (SystemState.currentProcessApproach !== ProcessApproach.WebGPU) {
      for (let i = 0; i < shaderNodes.length; i++) {
        const shaderNode = shaderNodes[i];
        for (let j = 0; j < shaderNode.inputConnections.length; j++) {
          const inputConnection = shaderNode.inputConnections[j];
          if (inputConnection == null) {
            continue;
          }
          const input = shaderNode.getInputs()[j];
          const inputNode = AbstractShaderNode.getShaderNodeByUid(inputConnection.shaderNodeUid);
          if (
            inputNode.getShaderStage() === 'Vertex' &&
            shaderNode.getShaderStage() === 'Fragment'
          ) {
            const type = input.compositionType.getGlslStr(input.componentType);
            shaderBody += `${isVertexStage ? 'out' : 'in'} ${type} v_${
              inputNode.shaderFunctionName
            }_${inputNode.shaderNodeUid};\n`;
          }
        }
      }
    }

    shaderBody += CommonShaderPart.getMainBegin(isVertexStage);

    if (isFullVersion) {
      shaderBody += CommonShaderPart.getMainPrerequisites();
    }

    // Collects varInputNames and varOutputNames
    const varInputNames: Array<Array<string>> = []; // input names of topological sorted Nodes
    const varOutputNames: Array<Array<string>> = []; // output names of topological sorted Nodes
    {
      const existingInputs: Set<string> = new Set();
      const existingOutputs: Set<string> = new Set();
      const existingOutputsVarName: Map<ShaderNodeUID, string> = new Map();
      for (let i = 1; i < shaderNodes.length; i++) {
        const shaderNode = shaderNodes[i];
        if (varInputNames[i] == null) {
          varInputNames[i] = [];
        }
        if (i - 1 >= 0) {
          if (varOutputNames[i - 1] == null) {
            varOutputNames[i - 1] = [];
          }
        }

        const inputConnections = shaderNode.inputConnections;

        // Collects ExistingInputs
        for (let j = 0; j < shaderNode.getInputs().length; j++) {
          const inputConnection = inputConnections[j];
          if (inputConnection == null) {
            const inputSocket = shaderNode.getInputs()[j];
            if (inputSocket.defaultValue != null) {
              if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
                if (inputSocket.componentType === ComponentType.Bool) {
                  varInputNames[i].push(inputSocket.defaultValue._v[0] > 0.5 ? 'true' : 'false');
                } else {
                  varInputNames[i].push(inputSocket.defaultValue.wgslStrAsFloat);
                }
              } else {
                if (inputSocket.componentType === ComponentType.Bool) {
                  varInputNames[i].push(inputSocket.defaultValue._v[0] > 0.5 ? 'true' : 'false');
                } else {
                  varInputNames[i].push(inputSocket.defaultValue.glslStrAsFloat);
                }
              }
              continue;
            } else {
              continue;
            }
          }
          const inputNode = AbstractShaderNode._shaderNodes[inputConnection.shaderNodeUid];

          const outputSocketOfPrev = inputNode.getOutput(inputConnection.outputNameOfPrev);
          const inputSocketOfThis = shaderNode.getInput(inputConnection.inputNameOfThis);
          const varName = `${outputSocketOfPrev!.name}_${inputConnection.shaderNodeUid}_to_${
            shaderNode.shaderNodeUid
          }`;

          //
          if (
            !existingInputs.has(`${inputNode.shaderNodeUid}_${inputConnection.outputNameOfPrev}`)
          ) {
            let rowStr = CommonShaderPart.getAssignmentStatement(varName, inputSocketOfThis!);
            if (!isVertexStage) {
              if (
                inputNode.getShaderStage() === 'Vertex' &&
                shaderNode.getShaderStage() === 'Fragment'
              ) {
                rowStr = CommonShaderPart.getAssignmentVaryingStatementInPixelShader(
                  varName,
                  inputSocketOfThis!,
                  inputNode
                );
              }
            }
            shaderBody += rowStr;
          }
          const existVarName = existingOutputsVarName.get(inputNode.shaderNodeUid);
          varInputNames[i].push(existVarName ? existVarName : varName);
          existingInputs.add(
            `${inputConnection.shaderNodeUid}_${inputConnection.outputNameOfPrev}`
          );
        }

        // Collects ExistingOutputs
        for (let j = i; j < shaderNodes.length; j++) {
          const targetShaderNode = shaderNodes[j];
          const prevShaderNodeInner = shaderNodes[i - 1];
          const targetNodeInputConnections = targetShaderNode.inputConnections;
          for (let k = 0; k < targetNodeInputConnections.length; k++) {
            const inputConnection = targetNodeInputConnections[k];
            if (inputConnection == null) {
              continue;
            }
            if (prevShaderNodeInner?.shaderNodeUid !== inputConnection.shaderNodeUid) {
              continue;
            }
            const inputNode = AbstractShaderNode._shaderNodes[inputConnection.shaderNodeUid];
            if (
              !existingOutputs.has(`${inputNode.shaderNodeUid}_${inputConnection.outputNameOfPrev}`)
            ) {
              const outputSocketOfPrev = inputNode.getOutput(inputConnection.outputNameOfPrev);

              const varName = `${outputSocketOfPrev!.name}_${inputConnection.shaderNodeUid}_to_${
                targetShaderNode.shaderNodeUid
              }`;

              if (i - 1 >= 0) {
                varOutputNames[i - 1].push(varName);
              }
              existingOutputsVarName.set(inputConnection.shaderNodeUid, varName);
            }
            existingOutputs.add(
              `${inputConnection.shaderNodeUid}_${inputConnection.outputNameOfPrev}`
            );
          }
        }
      }
    }

    // generate shader code by topological sorted nodes, varInputNames and varOutputNames
    for (let i = 0; i < shaderNodes.length; i++) {
      const shaderNode = shaderNodes[i];
      const functionName = shaderNode.getShaderFunctionNameDerivative();
      if (varInputNames[i] == null) {
        varInputNames[i] = [];
      }
      if (varOutputNames[i] == null) {
        varOutputNames[i] = [];
      }

      if (isVertexStage && shaderNode.getShaderStage() === 'Fragment') {
        continue;
      } else if (!isVertexStage && shaderNode.getShaderStage() === 'Vertex') {
        continue;
      }

      shaderBody += shaderNode.makeCallStatement(
        i,
        shaderNode,
        functionName,
        varInputNames,
        varOutputNames
      );
    }

    if (isVertexStage) {
      for (let i = 0; i < shaderNodes.length; i++) {
        const shaderNode = shaderNodes[i];
        const varNames = varInputNames[i].concat(varOutputNames[i]);
        for (let j = 0; j < shaderNode.inputConnections.length; j++) {
          const inputConnection = shaderNode.inputConnections[j];
          if (inputConnection == null) {
            continue;
          }
          const inputNode = AbstractShaderNode.getShaderNodeByUid(inputConnection.shaderNodeUid);
          if (
            inputNode.getShaderStage() === 'Vertex' &&
            shaderNode.getShaderStage() === 'Fragment'
          ) {
            shaderBody += CommonShaderPart.getAssignmentVaryingStatementInVertexShader(
              inputNode,
              varNames,
              j
            );
          }
        }
      }
    }

    shaderBody += CommonShaderPart.getMainEnd(isVertexStage);

    return shaderBody;
  }

  /**
   * Generates complete vertex and fragment shader code from a JSON shader node graph definition.
   * This is the main entry point for converting a serialized shader graph into executable shader code.
   * The method performs the full pipeline: node construction, dependency resolution, stage assignment,
   * and final code generation.
   *
   * @param json - JSON representation of the shader node graph containing nodes and connections
   * @returns Object containing both vertex and fragment shader code, or undefined if generation fails
   * @example
   * ```typescript
   * const shaderCode = ShaderGraphResolver.generateShaderCodeFromJson(graphJson);
   * if (shaderCode) {
   *   const { vertexShader, pixelShader } = shaderCode;
   *   // Use the generated shaders...
   * }
   * ```
   */
  public static generateShaderCodeFromJson(
    json: ShaderNodeJson
  ): { vertexShader: string; pixelShader: string } | undefined {
    const constructedNodes = Object.values(constructNodes(json));
    const nodes = this.__sortTopologically(constructedNodes);
    resolveShaderStage(nodes);
    const varyingNodes = filterNodesForVarying(nodes, 'outColor');

    const vertexNodes = filterNodes(nodes, ['outPosition']);
    const pixelNodes = filterNodes(nodes, ['outColor']);

    if (vertexNodes.length === 0 || pixelNodes.length === 0) {
      return;
    }

    const vertexRet = ShaderGraphResolver.createVertexShaderCode(vertexNodes, varyingNodes);
    const pixelRet = ShaderGraphResolver.createPixelShaderCode(pixelNodes);
    if (vertexRet == null || pixelRet == null) {
      return;
    }

    return { vertexShader: vertexRet, pixelShader: pixelRet };
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
      if (
        inputNode != null &&
        inputNode.getShaderStage() === 'Vertex' &&
        node.getShaderStage() === 'Fragment'
      ) {
        varyingNodes.push(inputNode);
        if (node.getShaderStage() === 'Fragment') {
          varyingNodes.unshift(node);
        }
        traverseNodesAll(inputNode);
        break;
      }
      traverseNodes(inputNode);
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
 * @returns Record mapping node IDs to their corresponding shader node instances
 * @throws Error if unknown node types are encountered or if connections cannot be established
 * @private
 */
function constructNodes(json: ShaderNodeJson) {
  // Create Node Instances
  const nodeInstances: Record<string, AbstractShaderNode> = {};
  const nodes: Record<string, any> = {};
  for (const node of json.nodes) {
    nodes[node.id] = node;
    switch (node.name) {
      // case 'ConstantBool': {
      //   const nodeInstance = new ConstantScalarVariableShaderNode(ComponentType.Bool);
      //   nodeInstance.setDefaultInputValue(Scalar.fromCopyNumber(node.data.bool ? 1 : 0));
      //   nodeInstances[node.id] = nodeInstance;
      //   break;
      // }
      case 'ConstantScalar': {
        const nodeInstance = new ConstantScalarVariableShaderNode(ComponentType.Float);
        nodeInstance.setDefaultInputValue(Scalar.fromCopyNumber(node.controls['in1'].value));
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'ConstantVector2': {
        const nodeInstance = new ConstantVector2VariableShaderNode(ComponentType.Float);
        nodeInstance.setDefaultInputValue(
          Vector2.fromCopy2(node.controls['in1'].value, node.controls['in2'].value)
        );
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'ConstantVector3': {
        const nodeInstance = new ConstantVector3VariableShaderNode(ComponentType.Float);
        nodeInstance.setDefaultInputValue(
          Vector3.fromCopy3(
            node.controls['in1'].value,
            node.controls['in2'].value,
            node.controls['in3'].value
          )
        );
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'ConstantVector4': {
        const nodeInstance = new ConstantVector4VariableShaderNode(ComponentType.Float);
        nodeInstance.setDefaultInputValue(
          Vector4.fromCopy4(
            node.controls['in1'].value,
            node.controls['in2'].value,
            node.controls['in3'].value,
            node.controls['in4'].value
          )
        );
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'UniformVector4': {
        const nodeInstance = new UniformDataShaderNode(CompositionType.Vec4, ComponentType.Float);
        nodeInstance.setDefaultInputValue(
          'value',
          Vector4.fromCopyArray4([
            node.controls['initialX'].value,
            node.controls['initialY'].value,
            node.controls['initialZ'].value,
            node.controls['initialW'].value,
          ])
        );
        nodeInstance.setUniformDataName(node.controls['name'].value);
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
          Logger.error('Add node: Unknown socket name: ' + socketName);
          break;
        }
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
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
          Logger.error('Sin node: Unknown socket name: ' + socketName);
          break;
        }
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
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
          Logger.error('Add node: Unknown socket name: ' + socketName);
          break;
        }
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
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
          Logger.error('Add node: Unknown socket name: ' + socketName);
          break;
        }
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
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
          Logger.error('Normalize node: Unknown socket name: ' + socketName);
          break;
        }
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
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
          Logger.error('Dot node: Unknown socket name: ' + socketName);
          break;
        }
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
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
          Logger.error('Multiply node: Unknown socket name: ' + socketName);
          break;
        }
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
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
          Logger.error('Transform node: Unknown socket name: ' + socketName);
          break;
        }
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'SplitVector': {
        const nodeInstance = new SplitVectorShaderNode();
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'MergeVector': {
        const nodeInstance = new MergeVectorShaderNode();
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
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
    }
  }

  // for (const connection of json.connections) {
  for (let i = 0; i < json.connections.length; i++) {
    const connection = json.connections[i];
    const inputNodeInstance = nodeInstances[connection.from.id] as AbstractShaderNode | undefined;
    const outputNodeInstance = nodeInstances[connection.to.id] as AbstractShaderNode | undefined;
    if (inputNodeInstance == null || outputNodeInstance == null) {
      Logger.error('inputNodeInstance or outputNodeInstance is null');
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
  return nodeInstances;
}
