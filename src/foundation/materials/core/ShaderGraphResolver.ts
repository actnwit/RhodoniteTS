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

    return { shader, shaderBody };
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

    return { shader, shaderBody };
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
    materialNodes: AbstractShaderNode[],
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
    for (let i = 0; i < materialNodes.length; i++) {
      const materialNode = materialNodes[i];
      for (let j = 0; j < materialNode.inputConnections.length; j++) {
        const inputConnection = materialNode.inputConnections[j];
        const input = materialNode.getInputs()[j];
        const inputNode = AbstractShaderNode.getShaderNodeByUid(inputConnection.shaderNodeUid);
        if (
          inputNode.getShaderStage() === 'Vertex' &&
          materialNode.getShaderStage() === 'Fragment'
        ) {
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
      for (let i = 1; i < materialNodes.length; i++) {
        const materialNode = materialNodes[i];
        if (varInputNames[i] == null) {
          varInputNames[i] = [];
        }
        if (i - 1 >= 0) {
          if (varOutputNames[i - 1] == null) {
            varOutputNames[i - 1] = [];
          }
        }

        const inputConnections = materialNode.inputConnections;

        // Collects ExistingInputs
        for (let j = 0; j < inputConnections.length; j++) {
          const inputConnection = inputConnections[j];
          const inputNode = AbstractShaderNode._shaderNodes[inputConnection.shaderNodeUid];
          if (isAnyTypeInput(materialNode.getInputs()[j])) {
            continue;
          }

          const outputSocketOfPrev = inputNode.getOutput(inputConnection.outputNameOfPrev);
          const inputSocketOfThis = materialNode.getInput(inputConnection.inputNameOfThis);
          const varName = `${outputSocketOfPrev!.name}_${inputConnection.shaderNodeUid}_to_${
            materialNode.shaderNodeUid
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
                materialNode.getShaderStage() === 'Fragment'
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
        for (let j = i; j < materialNodes.length; j++) {
          const targetMaterialNode = materialNodes[j];
          const prevMaterialNodeInner = materialNodes[i - 1];
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
    for (let i = 0; i < materialNodes.length; i++) {
      const materialNode = materialNodes[i];
      const functionName = materialNode.shaderFunctionName;
      if (varInputNames[i] == null) {
        varInputNames[i] = [];
      }
      if (varOutputNames[i] == null) {
        varOutputNames[i] = [];
      }

      if (isVertexStage && materialNode.getShaderStage() === 'Fragment') {
        continue;
      } else if (!isVertexStage && materialNode.getShaderStage() === 'Vertex') {
        continue;
      }

      let rowStr = '';
      const varNames = varInputNames[i].concat(varOutputNames[i]);
      if (
        materialNode.getInputs().length === varInputNames[i].length &&
        materialNode.getOutputs().length === varOutputNames[i].length
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

    for (let i = 0; i < materialNodes.length; i++) {
      if (isVertexStage) {
        const materialNode = materialNodes[i];
        const varNames = varInputNames[i].concat(varOutputNames[i]);
        for (let j = 0; j < materialNode.inputConnections.length; j++) {
          const inputConnection = materialNode.inputConnections[j];
          const inputNode = AbstractShaderNode.getShaderNodeByUid(inputConnection.shaderNodeUid);
          if (
            inputNode.getShaderStage() === 'Vertex' &&
            materialNode.getShaderStage() === 'Fragment'
          ) {
            shaderBody += `v_${inputNode.shaderFunctionName}_${
              inputNode.shaderNodeUid
            } = ${varNames.at(-1)};\n`;
          }
        }
      }
    }

    shaderBody += GLSLShader.glslMainEnd;

    return shaderBody;
  }
}
