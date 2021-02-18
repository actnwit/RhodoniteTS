import RnObject from '../../core/RnObject';
import { ShaderNode } from '../../definitions/ShaderNode';
import { ShaderSocket } from './AbstractMaterialNode';
import GLSLShader from '../../../webgl/shaders/GLSLShader';

export type ShaderNodeUID = number;
type ShaderNodeInputConnectionType = { shaderNodeUid: number, outputNameOfPrev: string, inputNameOfThis: string };

export default abstract class AbstractShaderNode extends RnObject {
  static shaderNodes: AbstractShaderNode[] = [];
  protected __shaderFunctionName: string;
  private __shaderCode?: string;
  protected __inputs: ShaderSocket[] = [];
  protected __outputs: ShaderSocket[] = [];
  protected __inputConnections: ShaderNodeInputConnectionType[] = [];
  private static readonly __invalidShaderNodeUid = -1;
  private static __invalidShaderNodeCount = -1;
  protected __shaderNodeUid: ShaderNodeUID;
  protected __shader?: GLSLShader;

  constructor(shaderNodeName: string, shaderCode?: string, shader?: GLSLShader) {
    super();
    this.__shaderFunctionName = shaderNodeName;
    this.__shaderCode = shaderCode
    this.__shaderNodeUid = ++AbstractShaderNode.__invalidShaderNodeCount;
    AbstractShaderNode.shaderNodes[AbstractShaderNode.__invalidShaderNodeCount] = this;
    this.__shader = shader
  }

  get shaderFunctionName() {
    return this.__shaderFunctionName;
  }

  get shaderCode() {
    return this.__shaderCode;
  }

  get shaderNodeUid() {
    return this.__shaderNodeUid;
  }

  getInput(name: string): ShaderSocket | undefined {
    for (let input of this.__inputs) {
      if (input.name === name) {
        return input;
      }
    }
    return void 0;
  }

  getInputs() {
    return this.__inputs;
  }

  getOutput(name: string): ShaderSocket | undefined {
    for (let output of this.__outputs) {
      if (output.name === name) {
        return output;
      }
    }
    return void 0;
  }

  getOutputs() {
    return this.__outputs;
  }

  addInputConnection(inputShaderNode: AbstractShaderNode, outputNameOfPrev: string, inputNameOfThis: string) {
    this.__inputConnections.push({ shaderNodeUid: inputShaderNode.shaderNodeUid, outputNameOfPrev: outputNameOfPrev, inputNameOfThis: inputNameOfThis });
  }

  get inputConnections(): ShaderNodeInputConnectionType[] {
    return this.__inputConnections;
  }

  get shader() {
    return this.__shader;
  }
}
