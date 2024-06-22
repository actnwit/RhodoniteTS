import { ShaderNodeUID, AbstractShaderNode, ShaderSocket } from './AbstractShaderNode';
import { Index } from '../../../types/CommonTypes';
import { CGAPIResourceRepository } from '../../renderer/CGAPIResourceRepository';
import { VertexAttribute } from '../../definitions/VertexAttribute';
import { ShaderType, ShaderTypeEnum } from '../../definitions/ShaderType';
import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import { CommonShaderPart } from '../../../webgl/shaders/CommonShaderPart';
import mainPrerequisitesShaderityObject from '../../../webgl/shaderity_shaders/common/mainPrerequisites.glsl';
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
import { IfStatementShaderNode } from '../nodes/IfStatementShaderNode';
import { BlockBeginShaderNode } from '../nodes/BlockBeginShaderNode';
import { GreaterShaderNode } from '../nodes/GreaterShaderNode';
import { OutPositionShaderNode } from '../nodes/OutPositionShaderNode';
import { OutColorShaderNode } from '../nodes/OutColorShaderNode';
import { System, SystemState } from '../../system';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { TransformShaderNode } from '../nodes/TransformShaderNode';
import { MergeVectorShaderNode, SplitVectorShaderNode } from '../nodes';
import { SinShaderNode } from '../nodes/SinShaderNode';
import { StepShaderNode } from '../nodes/StepShaderNode';
import { TimeShaderNode } from '../nodes/TimeShaderNode';

/**
 * ShaderGraphResolver is a class that resolves the shader node graph and generates shader code.
 */
export class ShaderGraphResolver {
  /**
   * Create a vertex shader code from the given vertex nodes.
   * @param vertexNodes - Vertex nodes
   * @param varyingNodes - Varying nodes
   * @param isFullVersion - Whether to generate a full version of the shader code
   * @returns Vertex shader code
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
      console.error(e);
      return undefined;
    }

    const shader = vertexShaderPrerequisites + shaderBody;

    return shader;
  }

  /**
   * Create a pixel shader code from the given pixel nodes.
   *
   * @param pixelNodes - Pixel nodes
   * @param isFullVersion - Whether to generate a full version of the shader code
   * @returns Pixel shader code
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
      console.error(e);
      return undefined;
    }

    const shader = pixelShaderPrerequisites + shaderBody;

    return shader;
  }

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
   * Sort shader nodes topologically.
   *
   * @param shaderNodes - Shader nodes to sort
   * @returns Sorted shader nodes
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
      console.error('graph is cyclic');
    }

    return sortedNodeArray;
  }

  /**
   * Get function definition from shader nodes.
   *
   * @param shaderNodes - Shader nodes
   * @param shaderType - Shader type
   * @returns Function definition as a string
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
   * Construct shader code with shader nodes.
   *
   * @param shaderNodes - Shader nodes
   * @param isVertexStage - Whether the shader is a vertex shader
   * @param isFullVersion - Whether to generate a full version of the shader code
   * @returns Shader code
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
        for (let j = 0; j < inputConnections.length; j++) {
          const inputConnection = inputConnections[j];
          if (inputConnection == null) {
            continue;
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
   * Generate shader code from JSON.
   *
   * @param json - JSON data of a shader node graph
   * @returns Shader code
   */
  public static generateShaderCodeFromJson(
    json: any
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
 * Construct shader nodes from JSON.
 *
 * @param json - JSON data of a shader node graph
 * @returns Constructed shader nodes
 */
function constructNodes(json: any) {
  // Create Node Instances
  const nodeInstances: Record<number, AbstractShaderNode> = {};
  const nodes: Record<string, any> = {};
  for (const node of json.nodes) {
    nodes[node.id] = node;
    switch (node.name) {
      case 'ConstantBool': {
        const nodeInstance = new ConstantScalarVariableShaderNode(ComponentType.Bool);
        nodeInstance.setDefaultInputValue(Scalar.fromCopyNumber(node.data.bool ? 1 : 0));
        nodeInstances[node.id] = nodeInstance;
        break;
      }
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
        if (socketName === 'Scalar') {
          nodeInstance = new AddShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName === 'Vector2') {
          nodeInstance = new AddShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName === 'Vector3') {
          nodeInstance = new AddShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName === 'Vector4') {
          nodeInstance = new AddShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          console.log('Add node: Unknown socket name: ' + socketName);
          break;
        }
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Sin': {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance: SinShaderNode;
        if (socketName === 'Scalar') {
          nodeInstance = new SinShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName === 'Vector2') {
          nodeInstance = new SinShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName === 'Vector3') {
          nodeInstance = new SinShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName === 'Vector4') {
          nodeInstance = new SinShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          console.log('Sin node: Unknown socket name: ' + socketName);
          break;
        }
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Step': {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance: StepShaderNode;
        if (socketName === 'Scalar') {
          nodeInstance = new StepShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName === 'Vector2') {
          nodeInstance = new StepShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName === 'Vector3') {
          nodeInstance = new StepShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName === 'Vector4') {
          nodeInstance = new StepShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          console.log('Add node: Unknown socket name: ' + socketName);
          break;
        }
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Normalize': {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance: NormalizeShaderNode;
        if (socketName === 'Vector2') {
          nodeInstance = new NormalizeShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName === 'Vector3') {
          nodeInstance = new NormalizeShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName === 'Vector4') {
          nodeInstance = new NormalizeShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          console.log('Normalize node: Unknown socket name: ' + socketName);
          break;
        }
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Dot': {
        const socketName = node.inputs.in1.socket.name;
        let nodeInstance: DotProductShaderNode;
        if (socketName === 'Vector2') {
          nodeInstance = new DotProductShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName === 'Vector3') {
          nodeInstance = new DotProductShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName === 'Vector4') {
          nodeInstance = new DotProductShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else {
          console.log('Dot node: Unknown socket name: ' + socketName);
          break;
        }
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Multiply': {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance: MultiplyShaderNode;
        if (socketName === 'Scalar') {
          nodeInstance = new MultiplyShaderNode(CompositionType.Scalar, ComponentType.Float);
        } else if (socketName === 'Vector2') {
          nodeInstance = new MultiplyShaderNode(CompositionType.Vec2, ComponentType.Float);
        } else if (socketName === 'Vector3') {
          nodeInstance = new MultiplyShaderNode(CompositionType.Vec3, ComponentType.Float);
        } else if (socketName === 'Vector4') {
          nodeInstance = new MultiplyShaderNode(CompositionType.Vec4, ComponentType.Float);
        } else if (socketName === 'Matrix2') {
          nodeInstance = new MultiplyShaderNode(CompositionType.Mat2, ComponentType.Float);
        } else if (socketName === 'Matrix3') {
          nodeInstance = new MultiplyShaderNode(CompositionType.Mat3, ComponentType.Float);
        } else if (socketName === 'Matrix4') {
          nodeInstance = new MultiplyShaderNode(CompositionType.Mat4, ComponentType.Float);
        } else {
          console.log('Multiply node: Unknown socket name: ' + socketName);
          break;
        }
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Transform': {
        const socketName = node.outputs.out1.socket.name;
        let nodeInstance: TransformShaderNode;
        if (socketName === 'Vector2') {
          nodeInstance = new TransformShaderNode(
            CompositionType.Mat2,
            ComponentType.Float,
            CompositionType.Vec2,
            ComponentType.Float
          );
        } else if (socketName === 'Vector3') {
          nodeInstance = new TransformShaderNode(
            CompositionType.Mat3,
            ComponentType.Float,
            CompositionType.Vec3,
            ComponentType.Float
          );
        } else if (socketName === 'Vector4') {
          nodeInstance = new TransformShaderNode(
            CompositionType.Mat4,
            ComponentType.Float,
            CompositionType.Vec4,
            ComponentType.Float
          );
        } else {
          console.log('Transform node: Unknown socket name: ' + socketName);
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
      console.error('inputNodeInstance or outputNodeInstance is null');
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
