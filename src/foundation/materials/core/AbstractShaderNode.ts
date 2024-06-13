import { RnObject } from '../../core/RnObject';
import { GLSLShader } from '../../../webgl/shaders/GLSLShader';
import { VertexAttributeEnum } from '../../definitions/VertexAttribute';
import { ShaderSemanticsEnum } from '../../definitions/ShaderSemantics';
import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { Socket } from './Socket';

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

/**
 * AbstractShaderNode is a abstract class that represents a shader node.
 */
export abstract class AbstractShaderNode extends RnObject {
  static _shaderNodes: AbstractShaderNode[] = [];
  protected __shaderFunctionName: string;
  private __shaderCode?: string;
  protected __inputs: Socket<string, CompositionTypeEnum, ComponentTypeEnum>[] = [];
  protected __outputs: Socket<string, CompositionTypeEnum, ComponentTypeEnum>[] = [];
  protected __inputConnections: ShaderNodeInputConnectionType[] = [];
  private static __invalidShaderNodeCount = -1;
  protected __shaderNodeUid: ShaderNodeUID;
  protected __shader?: GLSLShader;

  constructor(shaderNodeName: string, shaderCode?: string, shader?: GLSLShader) {
    super();
    this.__shaderFunctionName = shaderNodeName;
    this.__shaderCode = shaderCode;
    this.__shaderNodeUid = ++AbstractShaderNode.__invalidShaderNodeCount;
    AbstractShaderNode._shaderNodes[AbstractShaderNode.__invalidShaderNodeCount] = this;
    this.__shader = shader;
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

  get shaderCode(): string | undefined {
    return this.__shaderCode;
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

  get shader(): GLSLShader | undefined {
    return this.__shader;
  }
}
