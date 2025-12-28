import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { ShaderSocket } from '../../../foundation/materials/core/AbstractShaderNode';
import type { Engine } from '../../../foundation/system/Engine';
import type { AttributeNames } from '../../types/CommonTypes';
import { StandardShaderPart } from '../StandardShaderPart';

/**
 * A shader component that generates the ending block of a shader function.
 * This class creates GLSL function definitions that pass input values directly to output values,
 * effectively acting as a pass-through block in shader node graphs.
 */
export class BlockEndShader extends StandardShaderPart {
  /**
   * Creates a new BlockEndShader instance.
   *
   * @param __functionName - The name of the GLSL function to generate
   * @param __valueInputs - Array of input shader sockets that define the function parameters
   * @param __valueOutputs - Array of output shader sockets that define the function return values
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
   * Creates a GLSL function that takes input parameters and assigns them directly to output parameters.
   *
   * @returns The GLSL function definition string for vertex shaders
   */
  getVertexShaderDefinitions(_engine: Engine) {
    let funcStr = `void ${this.__functionName}(`;

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
   * Returns the same definition as the vertex shader since the logic is identical.
   *
   * @returns The GLSL function definition string for pixel shaders
   */
  getPixelShaderDefinitions(engine: Engine) {
    return this.getVertexShaderDefinitions(engine);
  }

  /**
   * Gets the attribute names required by this shader component.
   * This block end shader doesn't require any specific vertex attributes.
   *
   * @returns An empty array as no attributes are needed
   */
  get attributeNames(): AttributeNames {
    return [];
  }

  /**
   * Gets the vertex attribute semantics required by this shader component.
   * This block end shader doesn't require any specific vertex attribute semantics.
   *
   * @returns An empty array as no attribute semantics are needed
   */
  get attributeSemantics(): Array<VertexAttributeEnum> {
    return [];
  }

  /**
   * Gets the composition types for vertex attributes required by this shader component.
   * This block end shader doesn't require any specific attribute compositions.
   *
   * @returns An empty array as no attribute compositions are needed
   */
  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [];
  }
}
