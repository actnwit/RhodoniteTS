import { RnObject } from '../../core/RnObject';
import { CommonShaderPart } from '../../../webgl/shaders/CommonShaderPart';
import { VertexAttributeEnum } from '../../definitions/VertexAttribute';
import { ShaderSemanticsEnum } from '../../definitions/ShaderSemantics';
import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { Socket } from './Socket';
import { ShaderType, ShaderTypeEnum } from '../../definitions/ShaderType';
import { SystemState } from '../../system';
import { ProcessApproach } from '../../definitions';

export type ShaderAttributeOrSemanticsOrString = string | VertexAttributeEnum | ShaderSemanticsEnum;

export type ShaderSocket = {
  compositionType: CompositionTypeEnum;
  componentType: ComponentTypeEnum;
  name: ShaderAttributeOrSemanticsOrString;
  isClosed?: boolean;
};

export type ShaderNodeUID = number;
type ShaderNodeInputConnectionType = {
  shaderNodeUid: number;
  outputNameOfPrev: string;
  inputNameOfThis: string;
};

type ShaderStage = 'Neutral' | 'Vertex' | 'Fragment';

/**
 * AbstractShaderNode is a abstract class that represents a shader node.
 */
export abstract class AbstractShaderNode extends RnObject {
  static _shaderNodes: AbstractShaderNode[] = [];
  protected __shaderFunctionName: string;
  protected __inputs: Socket<string, CompositionTypeEnum, ComponentTypeEnum>[] = [];
  protected __outputs: Socket<string, CompositionTypeEnum, ComponentTypeEnum>[] = [];
  protected __inputConnections: ShaderNodeInputConnectionType[] = [];
  private static __invalidShaderNodeCount = -1;
  protected __shaderNodeUid: ShaderNodeUID;
  private __codeGLSL?: string;
  private __codeWGSL?: string;
  protected __commonPart?: CommonShaderPart;
  private _shaderStage: ShaderStage = 'Neutral';

  constructor(
    shaderNodeName: string,
    shader: {
      codeGLSL?: string;
      codeWGSL?: string;
      commonPart?: CommonShaderPart;
    }
  ) {
    super();
    this.__shaderFunctionName = shaderNodeName;
    this.__codeGLSL = shader.codeGLSL;
    this.__codeWGSL = shader.codeWGSL;
    this.__shaderNodeUid = ++AbstractShaderNode.__invalidShaderNodeCount;
    AbstractShaderNode._shaderNodes[AbstractShaderNode.__invalidShaderNodeCount] = this;
    this.__commonPart = shader.commonPart;
  }

  setShaderStage(stage: ShaderStage) {
    this._shaderStage = stage;
  }

  getShaderStage(): ShaderStage {
    return this._shaderStage;
  }

  static getShaderNodeByUid(uid: ShaderNodeUID): AbstractShaderNode {
    return AbstractShaderNode._shaderNodes[uid];
  }

  /**
   * Add a node connection to this node as an input.
   * @param inputShaderNode - a shader node to connect to this node.
   * @param outputSocketOfInput- the output socket of the inputShaderNode.
   * @param inputSocketOfThis - the input socket of this node.
   */
  addInputConnection<N extends CompositionTypeEnum, T extends ComponentTypeEnum>(
    inputShaderNode: AbstractShaderNode,
    outputSocketOfInput: Socket<string, N, T>,
    inputSocketOfThis: Socket<string, N, T>
  ): void {
    let idx = -1;
    for (let i = 0; i < this.__inputs.length; i++) {
      if (this.__inputs[i].name === inputSocketOfThis.name) {
        idx = i;
        break;
      }
    }

    this.__inputConnections[idx] = {
      shaderNodeUid: inputShaderNode.shaderNodeUid,
      outputNameOfPrev: outputSocketOfInput.name,
      inputNameOfThis: inputSocketOfThis.name,
    };
  }

  get shaderFunctionName(): string {
    return this.__shaderFunctionName;
  }

  getShaderFunctionNameDerivative(): string {
    return this.__shaderFunctionName;
  }

  getShaderCode(shaderStage: ShaderTypeEnum): string {
    if (this.__commonPart != null) {
      if (shaderStage === ShaderType.VertexShader) {
        return this.__commonPart.vertexShaderDefinitions;
      } else {
        return this.__commonPart.pixelShaderDefinitions;
      }
    } else {
      if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
        return this.__codeWGSL!;
      } else {
        return this.__codeGLSL!;
      }
    }
  }

  get shaderNodeUid(): ShaderNodeUID {
    return this.__shaderNodeUid;
  }

  getInput(name: string): Socket<string, CompositionTypeEnum, ComponentTypeEnum> | undefined {
    for (const input of this.__inputs) {
      if (input.name === name) {
        return input;
      }
    }
    return void 0;
  }

  getInputs(): Socket<string, CompositionTypeEnum, ComponentTypeEnum>[] {
    return this.__inputs;
  }

  getOutput(name: string): Socket<string, CompositionTypeEnum, ComponentTypeEnum> | undefined {
    for (const output of this.__outputs) {
      if (output.name === name) {
        return output;
      }
    }
    return void 0;
  }

  getOutputs(): Socket<string, CompositionTypeEnum, ComponentTypeEnum>[] {
    return this.__outputs;
  }

  get inputConnections(): ShaderNodeInputConnectionType[] {
    return this.__inputConnections;
  }

  makeCallStatement(i: number, shaderNode: AbstractShaderNode,
    functionName: string, varInputNames: string[][], varOutputNames: string[][]): string {
    let str = '';
    const varNames = varInputNames[i].concat(varOutputNames[i]);
    if (
      shaderNode.getInputs().length === varInputNames[i].length &&
      shaderNode.getOutputs().length === varOutputNames[i].length
    ) {
      let rowStr = '';
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
          if (
            SystemState.currentProcessApproach === ProcessApproach.WebGPU &&
            k >= varInputNames[i].length
          ) {
            rowStr += '&';
          }
          rowStr += varNames[k];
        }
        rowStr += ');\n';
      }

      str += rowStr;
    }

    return str;
  }
}
