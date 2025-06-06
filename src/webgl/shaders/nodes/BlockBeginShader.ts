import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { ShaderSocket } from '../../../foundation/materials/core/AbstractShaderNode';
import type { AttributeNames } from '../../types/CommonTypes';
import { CommonShaderPart } from '../CommonShaderPart';

/**
 * A shader part that generates the beginning block of a shader function.
 * This class creates GLSL function definitions with input and output parameters
 * based on the provided shader sockets.
 */
export class BlockBeginShader extends CommonShaderPart {
  /**
   * Creates a new BlockBeginShader instance.
   *
   * @param __functionName - The name of the GLSL function to generate
   * @param __valueInputs - Array of input shader sockets that define function parameters
   * @param __valueOutputs - Array of output shader sockets that define function output parameters
   */
  constructor(
    private __functionName: string,
    private __valueInputs: ShaderSocket[],
    private __valueOutputs: ShaderSocket[]
  ) {
    super();
  }

  /**
   * Generates the vertex shader function definition.
   * Creates a GLSL function with the specified name, input parameters, and output parameters.
   * The function body assigns input values to corresponding output values.
   *
   * @returns The GLSL function definition string for vertex shader
   */
  get vertexShaderDefinitions() {
    let funcStr = `void ${this.__functionName}(
in bool context,
      `;

    for (let i = 0; i < this.__valueInputs.length; i++) {
      const input = this.__valueInputs[i];
      const type = input.compositionType.getGlslStr(input.componentType);
      funcStr += `
        in ${type} value${i},`;
    }

    for (let i = 0; i < this.__valueOutputs.length; i++) {
      const output = this.__valueOutputs[i];
      const type = output.compositionType.getGlslStr(output.componentType);
      funcStr += `
        out ${type} outValue${i}${i === this.__valueOutputs.length - 1 ? '' : ','}`;
    }

    funcStr += ') {\n';
    for (let i = 0; i < this.__valueOutputs.length; i++) {
      funcStr += `
      outValue${i} = value${i};\n`;
    }
    funcStr += '}';

    return funcStr;
  }

  /**
   * Generates the pixel shader function definition.
   * Returns the same definition as vertex shader since the function structure is identical.
   *
   * @returns The GLSL function definition string for pixel shader
   */
  get pixelShaderDefinitions() {
    return this.vertexShaderDefinitions;
  }

  /**
   * Gets the attribute names required by this shader part.
   * This shader part doesn't require any specific vertex attributes.
   *
   * @returns An empty array as no attributes are needed
   */
  get attributeNames(): AttributeNames {
    return [];
  }

  /**
   * Gets the vertex attribute semantics required by this shader part.
   * This shader part doesn't require any specific vertex attribute semantics.
   *
   * @returns An empty array as no attribute semantics are needed
   */
  get attributeSemantics(): Array<VertexAttributeEnum> {
    return [];
  }

  /**
   * Gets the composition types for vertex attributes required by this shader part.
   * This shader part doesn't require any specific attribute compositions.
   *
   * @returns An empty array as no attribute compositions are needed
   */
  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [];
  }
}
