import type { CommonShaderPart } from '../../../webgl/shaders/CommonShaderPart';
import type { StandardShaderPart } from '../../../webgl/shaders/StandardShaderPart';
import { RnObject } from '../../core/RnObject';
import { ProcessApproach } from '../../definitions';
import type { ComponentTypeEnum } from '../../definitions/ComponentType';
import type { CompositionTypeEnum } from '../../definitions/CompositionType';
import type { ShaderSemanticsEnum } from '../../definitions/ShaderSemantics';
import { ShaderType, type ShaderTypeEnum } from '../../definitions/ShaderType';
import type { VertexAttributeEnum } from '../../definitions/VertexAttribute';
import type { Engine } from '../../system/Engine';
import type { Socket, SocketDefaultValue } from './Socket';

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
 * AbstractShaderNode is an abstract class that represents a shader node in a node-based shader system.
 * It provides the foundation for creating custom shader nodes with inputs, outputs, and connections.
 */
export abstract class AbstractShaderNode extends RnObject {
  static _shaderNodes: AbstractShaderNode[] = [];
  protected __shaderFunctionName: string;
  protected __inputs: Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>[] = [];
  protected __outputs: Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>[] = [];
  protected __inputConnections: ShaderNodeInputConnectionType[] = [];
  private static __invalidShaderNodeCount = -1;
  protected __shaderNodeUid: ShaderNodeUID;
  private __codeGLSL?: string;
  private __codeWGSL?: string;
  protected __commonPart?: CommonShaderPart;
  private _shaderStage: ShaderStage = 'Neutral';

  /**
   * Creates a new AbstractShaderNode instance.
   * @param shaderNodeName - The name identifier for this shader node
   * @param shader - The shader configuration object containing GLSL/WGSL code or common shader parts
   * @param shader.codeGLSL - Optional GLSL shader code for this node
   * @param shader.codeWGSL - Optional WGSL shader code for this node
   * @param shader.commonPart - Optional common shader part containing reusable shader definitions
   */
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

  /**
   * Sets the shader stage for this node (Neutral, Vertex, or Fragment).
   * @param stage - The shader stage to assign to this node
   */
  setShaderStage(stage: ShaderStage) {
    this._shaderStage = stage;
  }

  /**
   * Gets the current shader stage of this node.
   * @returns The current shader stage
   */
  getShaderStage(): ShaderStage {
    return this._shaderStage;
  }

  /**
   * Retrieves a shader node by its unique identifier.
   * @param uid - The unique identifier of the shader node
   * @returns The shader node with the specified UID
   */
  static getShaderNodeByUid(uid: ShaderNodeUID): AbstractShaderNode {
    return AbstractShaderNode._shaderNodes[uid];
  }

  /**
   * Adds an input connection to this node from another shader node.
   * This establishes a data flow connection between the output of one node and the input of this node.
   * @param inputShaderNode - The source shader node to connect from
   * @param outputSocketOfInput - The output socket of the source node
   * @param inputSocketOfThis - The input socket of this node to connect to
   * @template N - The composition type enum
   * @template T - The component type enum
   */
  addInputConnection<N extends CompositionTypeEnum, T extends ComponentTypeEnum>(
    inputShaderNode: AbstractShaderNode,
    outputSocketOfInput: Socket<string, N, T, SocketDefaultValue>,
    inputSocketOfThis: Socket<string, N, T, SocketDefaultValue>
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

  /**
   * Gets the shader function name for this node.
   * @returns The function name used in shader code
   */
  get shaderFunctionName(): string {
    return this.__shaderFunctionName;
  }

  /**
   * Gets the derivative shader function name for this node.
   * By default, returns the same as the regular function name.
   * @returns The derivative function name used in shader code
   */
  getShaderFunctionNameDerivative(_engine: Engine): string {
    return this.__shaderFunctionName;
  }

  /**
   * Retrieves the shader code for the specified shader stage.
   * Returns appropriate code based on the current rendering approach (WebGL/WebGPU).
   * @param engine - The engine instance
   * @param shaderStage - The shader stage (vertex or fragment) to get code for
   * @returns The shader code string for the specified stage
   */
  getShaderCode(engine: Engine, shaderStage: ShaderTypeEnum): string {
    if (this.__commonPart != null) {
      if (shaderStage === ShaderType.VertexShader) {
        return this.__commonPart.getVertexShaderDefinitions(engine);
      }
      return this.__commonPart.getPixelShaderDefinitions(engine);
    }
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      return this.__codeWGSL!;
    }
    return this.__codeGLSL!;
  }

  /**
   * Gets the unique identifier for this shader node.
   * @returns The unique node identifier
   */
  get shaderNodeUid(): ShaderNodeUID {
    return this.__shaderNodeUid;
  }

  /**
   * Finds and returns an input socket by name.
   * @param name - The name of the input socket to find
   * @returns The input socket if found, undefined otherwise
   */
  getInput(name: string): Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue> | undefined {
    for (const input of this.__inputs) {
      if (input.name === name) {
        return input;
      }
    }
    return void 0;
  }

  /**
   * Gets all input sockets for this node.
   * @returns An array of all input sockets
   */
  getInputs(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>[] {
    return this.__inputs;
  }

  /**
   * Finds and returns an output socket by name.
   * @param name - The name of the output socket to find
   * @returns The output socket if found, undefined otherwise
   */
  getOutput(name: string): Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue> | undefined {
    for (const output of this.__outputs) {
      if (output.name === name) {
        return output;
      }
    }
    return void 0;
  }

  /**
   * Gets all output sockets for this node.
   * @returns An array of all output sockets
   */
  getOutputs(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>[] {
    return this.__outputs;
  }

  /**
   * Gets all input connections for this node.
   * @returns An array of input connection configurations
   */
  get inputConnections(): ShaderNodeInputConnectionType[] {
    return this.__inputConnections;
  }

  /**
   * Generates a function call statement for this shader node in the final shader code.
   * This method constructs the appropriate function call syntax with proper parameter passing
   * for both WebGL and WebGPU rendering approaches.
   * @param engine - The engine instance
   * @param i - The index of this node in the execution order
   * @param shaderNode - The shader node to generate the call for
   * @param functionName - The name of the function to call
   * @param varInputNames - Array of input variable names for each node
   * @param varOutputNames - Array of output variable names for each node
   * @returns The generated function call statement string
   */
  makeCallStatement(
    engine: Engine,
    i: number,
    shaderNode: AbstractShaderNode,
    functionName: string,
    varInputNames: string[][],
    varOutputNames: string[][]
  ): string {
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
          if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU && k >= varInputNames[i].length) {
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
