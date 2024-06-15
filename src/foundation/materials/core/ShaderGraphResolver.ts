import { ShaderNodeUID, AbstractShaderNode, ShaderSocket } from './AbstractShaderNode';
import { Index } from '../../../types/CommonTypes';
import { CGAPIResourceRepository } from '../../renderer/CGAPIResourceRepository';
import { VertexAttribute } from '../../definitions/VertexAttribute';
import { ShaderType, ShaderTypeEnum } from '../../definitions/ShaderType';
import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import { GLSLShader } from '../../../webgl/shaders/GLSLShader';
import mainPrerequisitesShaderityObject from '../../../webgl/shaderity_shaders/common/mainPrerequisites.glsl';
import prerequisitesShaderityObject from '../../../webgl/shaderity_shaders/common/prerequisites.glsl';
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
import { ScalarToVector4ShaderNode } from '../nodes/ScalarToVector4ShaderNode';
import { Vector3AndScalarToVector4ShaderNode } from '../nodes/Vector3AndScalarToVector4ShaderNode';
import { Vector2AndScalarToVector4ShaderNode } from '../nodes/Vector2AndScalarToVector4ShaderNode';
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

export class ShaderGraphResolver {
  static createVertexShaderCode(
    vertexNodes: AbstractShaderNode[],
    varyingNodes: AbstractShaderNode[],
    isFullVersion: boolean = true
  ) {
    const shaderNodes = vertexNodes.concat();

    const isValid = this.__validateShaderNodes(shaderNodes);
    if (!isValid) {
      return undefined;
    }

    // Topological Sorting
    const sortedShaderNodes = this.__sortTopologically(shaderNodes);
    // const sortedVaryingNodes = this.__sortTopologically(varyingNodes);

    // Add additional functions by system
    let vertexShaderPrerequisites = '';

    if (isFullVersion) {
      const in_ = 'in';
      vertexShaderPrerequisites += `
#version 300 es
precision highp float;
precision highp int;
${prerequisitesShaderityObject.code}

${in_} vec4 a_instanceInfo;\n`;
      vertexShaderPrerequisites += `
uniform bool u_vertexAttributesExistenceArray[${VertexAttribute.AttributeTypeNumber}];
`;
      vertexShaderPrerequisites += '/* shaderity: @{matricesGetters} */';
      vertexShaderPrerequisites += '/* shaderity: @{getters} */';
    }

    let shaderBody = '';

    // function definitions
    shaderBody += ShaderGraphResolver.getFunctionDefinition(
      // sortedShaderNodes,
      sortedShaderNodes.concat(varyingNodes.filter((node) => node.getShaderStage() !== 'Fragment')),
      ShaderType.VertexShader
    );

    // main process
    shaderBody += ShaderGraphResolver.__constructShaderWithNodes(
      // sortedShaderNodes,
      sortedShaderNodes.concat(varyingNodes),
      true,
      isFullVersion
    );

    const shader = vertexShaderPrerequisites + shaderBody;

    return shader;
  }

  static createPixelShaderCode(pixelNodes: AbstractShaderNode[], isFullVersion: boolean = true) {
    const shaderNodes = pixelNodes.concat();

    const isValid = this.__validateShaderNodes(shaderNodes);
    if (!isValid) {
      return undefined;
    }

    // Topological Sorting
    const sortedShaderNodes = this.__sortTopologically(shaderNodes);

    // Add additional functions by system
    let pixelShaderPrerequisites = '';
    if (isFullVersion) {
      pixelShaderPrerequisites += `
#version 300 es
precision highp float;
precision highp int;
${prerequisitesShaderityObject.code}
`;
      pixelShaderPrerequisites += '/* shaderity: @{getters} */';
      pixelShaderPrerequisites += 'layout(location = 0) out vec4 rt0;';
    }
    let shaderBody = '';

    // function definitions
    shaderBody += ShaderGraphResolver.getFunctionDefinition(
      sortedShaderNodes.filter((node) => node.getShaderStage() !== 'Vertex'),
      ShaderType.PixelShader
    );

    // main process
    shaderBody += ShaderGraphResolver.__constructShaderWithNodes(
      sortedShaderNodes,
      false,
      isFullVersion
    );

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

  private static __sortTopologically(shaderNodes: AbstractShaderNode[]) {
    const sortedNodeArray: AbstractShaderNode[] = [];
    const inputNumArray: Index[] = [];

    // calculate inputNumArray
    const queue: AbstractShaderNode[] = [];
    for (let i = 0; i < shaderNodes.length; i++) {
      const shaderNode = shaderNodes[i];
      inputNumArray[i] = shaderNode.inputConnections.length;
    }

    // collect output nodes
    const outputNodes: AbstractShaderNode[][] = [];
    for (let i = 0; i < shaderNodes.length; i++) {
      const shaderNode = shaderNodes[i];
      for (const inputConnection of shaderNode.inputConnections) {
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

  static getFunctionDefinition(shaderNodes: AbstractShaderNode[], shaderType: ShaderTypeEnum) {
    let shaderText = '';
    const existVertexFunctions: string[] = [];
    for (let i = 0; i < shaderNodes.length; i++) {
      const materialNode = shaderNodes[i];
      if (existVertexFunctions.indexOf(materialNode.shaderFunctionName) !== -1) {
        continue;
      }
      if (materialNode.shaderCode) {
        shaderText += materialNode.shaderCode;
      } else {
        if (shaderType === ShaderType.VertexShader) {
          shaderText += (materialNode.shader as any).vertexShaderDefinitions;
        } else {
          shaderText += (materialNode.shader as any).pixelShaderDefinitions;
        }
      }
      existVertexFunctions.push(materialNode.shaderFunctionName);
    }

    return shaderText;
  }

  private static __constructShaderWithNodes(
    shaderNodes: AbstractShaderNode[],
    isVertexStage: boolean,
    isFullVersion: boolean
  ) {
    let shaderBody = '';
    const isAnyTypeInput = function (input: ShaderSocket) {
      return (
        input.compositionType === CompositionType.Unknown ||
        input.componentType === ComponentType.Unknown
      );
    };

    // Define out variables
    for (let i = 0; i < shaderNodes.length; i++) {
      const shaderNode = shaderNodes[i];
      for (let j = 0; j < shaderNode.inputConnections.length; j++) {
        const inputConnection = shaderNode.inputConnections[j];
        const input = shaderNode.getInputs()[j];
        const inputNode = AbstractShaderNode.getShaderNodeByUid(inputConnection.shaderNodeUid);
        if (inputNode.getShaderStage() === 'Vertex' && shaderNode.getShaderStage() === 'Fragment') {
          const type = input.compositionType.getGlslStr(input.componentType);
          shaderBody += `${isVertexStage ? 'out' : 'in'} ${type} v_${
            inputNode.shaderFunctionName
          }_${inputNode.shaderNodeUid};\n`;
        }
      }
    }

    shaderBody += GLSLShader.glslMainBegin;

    if (isFullVersion) {
      shaderBody += mainPrerequisitesShaderityObject.code;
    }

    // Collects varInputNames and varOutputNames
    const varInputNames: Array<Array<string>> = []; // input names of topological sorted Nodes
    const varOutputNames: Array<Array<string>> = []; // output names of topological sorted Nodes
    {
      const existingInputs: ShaderNodeUID[] = [];
      const existingOutputs: ShaderNodeUID[] = [];
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
          const inputNode = AbstractShaderNode._shaderNodes[inputConnection.shaderNodeUid];
          if (isAnyTypeInput(shaderNode.getInputs()[j])) {
            continue;
          }

          const outputSocketOfPrev = inputNode.getOutput(inputConnection.outputNameOfPrev);
          const inputSocketOfThis = shaderNode.getInput(inputConnection.inputNameOfThis);
          const varName = `${outputSocketOfPrev!.name}_${inputConnection.shaderNodeUid}_to_${
            shaderNode.shaderNodeUid
          }`;

          //
          if (existingInputs.indexOf(inputNode.shaderNodeUid) === -1) {
            const glslTypeStr = inputSocketOfThis!.compositionType.getGlslStr(
              inputSocketOfThis!.componentType
            );
            const glslInitialValue = inputSocketOfThis!.compositionType.getGlslInitialValue(
              inputSocketOfThis!.componentType
            );
            let rowStr = `${glslTypeStr} ${varName} = ${glslInitialValue};\n`;
            if (!isVertexStage) {
              if (
                inputNode.getShaderStage() === 'Vertex' &&
                shaderNode.getShaderStage() === 'Fragment'
              ) {
                rowStr = `${glslTypeStr} ${varName} = v_${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid};\n`;
              }
            }
            shaderBody += rowStr;
          }
          const existVarName = existingOutputsVarName.get(inputNode.shaderNodeUid);
          varInputNames[i].push(existVarName ? existVarName : varName);
          existingInputs.push(inputConnection.shaderNodeUid);
        }

        // Collects ExistingOutputs
        for (let j = i; j < shaderNodes.length; j++) {
          const targetMaterialNode = shaderNodes[j];
          const prevMaterialNodeInner = shaderNodes[i - 1];
          const targetNodeInputConnections = targetMaterialNode.inputConnections;
          for (let k = 0; k < targetNodeInputConnections.length; k++) {
            const inputConnection = targetNodeInputConnections[k];
            if (prevMaterialNodeInner?.shaderNodeUid !== inputConnection.shaderNodeUid) {
              continue;
            }
            const inputNode = AbstractShaderNode._shaderNodes[inputConnection.shaderNodeUid];
            if (!isAnyTypeInput(targetMaterialNode.getInputs()[k])) {
              if (existingOutputs.indexOf(inputNode.shaderNodeUid) === -1) {
                const outputSocketOfPrev = inputNode.getOutput(inputConnection.outputNameOfPrev);
                const varName = `${outputSocketOfPrev!.name}_${inputConnection.shaderNodeUid}_to_${
                  targetMaterialNode.shaderNodeUid
                }`;

                if (i - 1 >= 0) {
                  varOutputNames[i - 1].push(varName);
                }
                existingOutputsVarName.set(inputConnection.shaderNodeUid, varName);
              }
              existingOutputs.push(inputConnection.shaderNodeUid);
            }
          }
        }
      }
    }

    // generate shader code by topological sorted nodes, varInputNames and varOutputNames
    for (let i = 0; i < shaderNodes.length; i++) {
      const shaderNode = shaderNodes[i];
      const functionName = shaderNode.shaderFunctionName;
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

      let rowStr = '';
      const varNames = varInputNames[i].concat(varOutputNames[i]);
      if (
        shaderNode.getInputs().length === varInputNames[i].length &&
        shaderNode.getOutputs().length === varOutputNames[i].length
      ) {
        if (varNames.length > 0) {
          // Call node functions
          rowStr += `${functionName}(`;
          for (let k = 0; k < varNames.length; k++) {
            const varName = varNames[k];
            if (varName == null) {
              continue;
            }
            if (k !== 0) {
              rowStr += ', ';
            }
            rowStr += varNames[k];
          }
          rowStr += ');\n';
        }

        shaderBody += rowStr;
      }
    }

    if (isVertexStage) {
      for (let i = 0; i < shaderNodes.length; i++) {
        const shaderNode = shaderNodes[i];
        const varNames = varInputNames[i].concat(varOutputNames[i]);
        for (let j = 0; j < shaderNode.inputConnections.length; j++) {
          const inputConnection = shaderNode.inputConnections[j];
          const inputNode = AbstractShaderNode.getShaderNodeByUid(inputConnection.shaderNodeUid);
          if (
            inputNode.getShaderStage() === 'Vertex' &&
            shaderNode.getShaderStage() === 'Fragment'
          ) {
            shaderBody += `v_${inputNode.shaderFunctionName}_${inputNode.shaderNodeUid} = ${varNames[j]};\n`;
          }
        }
      }
    }

    shaderBody += GLSLShader.glslMainEnd;

    return shaderBody;
  }

  public static generateShaderCodeFromJson(
    json: any
  ): { vertexShader: string; pixelShader: string } | undefined {
    const nodes = Object.values(constructNodes(json));
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
      const inputNode = AbstractShaderNode.getShaderNodeByUid(inputConnection.shaderNodeUid);
      if (inputNode != null) {
        filteredNodes.push(inputNode);
        traverseNodes(inputNode);
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
      const inputNode = AbstractShaderNode.getShaderNodeByUid(inputConnection.shaderNodeUid);
      if (inputNode.getShaderStage() === 'Vertex' && shaderNode.getShaderStage() === 'Neutral') {
        shaderNode.setShaderStage('Vertex');
        break;
      }
      if (inputNode.getShaderStage() === 'Fragment') {
        shaderNode.setShaderStage('Fragment');
        break;
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
      const inputNode = AbstractShaderNode.getShaderNodeByUid(inputConnection.shaderNodeUid);
      varyingNodes.push(inputNode);
      traverseNodesAll(inputNode);
    }
  }

  function traverseNodes(node: AbstractShaderNode) {
    for (let i = 0; i < node.inputConnections.length; i++) {
      const inputConnection = node.inputConnections[i];
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

export default function constructNodes(json: any) {
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
      case 'AddScalar': {
        const nodeInstance = new AddShaderNode(CompositionType.Scalar, ComponentType.Float);
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'AddVector4': {
        const nodeInstance = new AddShaderNode(CompositionType.Vec4, ComponentType.Float);
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'NormalizeVector3': {
        const nodeInstance = new NormalizeShaderNode(CompositionType.Vec3, ComponentType.Float);
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'DotProductVector3': {
        const nodeInstance = new DotProductShaderNode(CompositionType.Vec3, ComponentType.Float);
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'MultiplyMatrix3xVector3': {
        const nodeInstance = new MultiplyShaderNode(
          CompositionType.Mat3,
          ComponentType.Float,
          CompositionType.Vec3,
          ComponentType.Float
        );
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'MultiplyMatrix4xVector4': {
        const nodeInstance = new MultiplyShaderNode(
          CompositionType.Mat4,
          ComponentType.Float,
          CompositionType.Vec4,
          ComponentType.Float
        );
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'MultiplyMatrix4xMatrix4': {
        const nodeInstance = new MultiplyShaderNode(
          CompositionType.Mat4,
          ComponentType.Float,
          CompositionType.Mat4,
          ComponentType.Float
        );
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'ScalarToVector4': {
        const nodeInstance = new ScalarToVector4ShaderNode();
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Vector3AndScalarToVector4': {
        const nodeInstance = new Vector3AndScalarToVector4ShaderNode();
        nodeInstance.setShaderStage(node.controls['shaderStage'].value);
        nodeInstances[node.id] = nodeInstance;
        break;
      }
      case 'Vector2AndScalarToVector4': {
        const nodeInstance = new Vector2AndScalarToVector4ShaderNode();
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
      case 'If': {
        const nodeInstance = new IfStatementShaderNode();
        nodeInstances[node.id] = nodeInstance;
        break;
      }
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
    const inputNodeInstance = nodeInstances[connection.from.id] as AbstractShaderNode;
    const outputNodeInstance = nodeInstances[connection.to.id] as AbstractShaderNode;
    let idx = 0;
    for (const key in nodes[connection.to.id].inputs) {
      if (key === connection.to.portName) {
        break;
      }
      idx++;
    }
    const outputOfInputNode = inputNodeInstance.getOutputs()[0];
    const inputOfOutputNode = outputNodeInstance.getInputs()[idx];
    outputNodeInstance.addInputConnection(inputNodeInstance, outputOfInputNode, inputOfOutputNode);
  }
  return nodeInstances;
}
