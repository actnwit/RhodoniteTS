import { RnObject } from '../../core/RnObject';
import { ShaderSocket } from './AbstractMaterialContent';
import { GLSLShader } from '../../../webgl/shaders/GLSLShader';

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
  protected __inputs: ShaderSocket[] = [];
  protected __outputs: ShaderSocket[] = [];
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
   * @param outputNameOfPrev - the name of the output socket of the inputShaderNode.
   * @param inputNameOfThis - the name of the input socket of this node.
   */
  addInputConnection(
    inputShaderNode: AbstractShaderNode,
    outputNameOfPrev: string,
    inputNameOfThis: string
  ): void {
    this.__inputConnections.push({
      shaderNodeUid: inputShaderNode.shaderNodeUid,
      outputNameOfPrev: outputNameOfPrev,
      inputNameOfThis: inputNameOfThis,
    });
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

  getInput(name: string): ShaderSocket | undefined {
    for (const input of this.__inputs) {
      if (input.name === name) {
        return input;
      }
    }
    return void 0;
  }

  getInputs(): ShaderSocket[] {
    return this.__inputs;
  }

  getOutput(name: string): ShaderSocket | undefined {
    for (const output of this.__outputs) {
      if (output.name === name) {
        return output;
      }
    }
    return void 0;
  }

  getOutputs(): ShaderSocket[] {
    return this.__outputs;
  }

  get inputConnections(): ShaderNodeInputConnectionType[] {
    return this.__inputConnections;
  }

  get shader(): GLSLShader | undefined {
    return this.__shader;
  }
}
