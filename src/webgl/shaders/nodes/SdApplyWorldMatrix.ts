import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import { ProcessApproach } from '../../../foundation/definitions/ProcessApproach';
import { ShaderNode } from '../../../foundation/definitions/ShaderNode';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { Engine } from '../../../foundation/system/Engine';
import type { AttributeNames } from '../../types/CommonTypes';
import { RaymarchingShaderPart } from '../RaymarchingShaderPart';
import { StandardShaderPart } from '../StandardShaderPart';

/**
 * SdApplyWorldMatrixShader class provides the apply world matrix function for fragment shaders.
 * This class handles applying the world matrix to the position,
 * supporting both WebGL and WebGPU rendering approaches.
 *
 * @extends RaymarchingShaderPart
 */
export class SdApplyWorldMatrixShader extends RaymarchingShaderPart {
  private __variableName = '';
  private __shaderFunctionName = '';
  /**
   * Private constructor to enforce singleton pattern.
   */
  constructor(shaderFunctionName: string) {
    super();
    this.__shaderFunctionName = shaderFunctionName;
  }

  setVariableName(name: any) {
    this.__variableName = name;
  }

  /**
   * Gets the vertex shader function definitions.
   * Returns a no-op function since discard is not available in vertex shaders.
   *
   * @returns Shader code string containing a no-op conditionalDiscard function
   */
  getVertexShaderDefinitions(engine: Engine) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      return '';
    }
    return '';
  }

  /**
   * Gets the vertex shader body code.
   * Currently returns empty string as no additional vertex processing is needed.
   *
   * @returns Empty shader body string
   */
  get vertexShaderBody() {
    return '';
  }

  /**
   * Gets the pixel/fragment shader function definitions for conditional discard.
   * Returns appropriate function definition based on the current process approach (WebGL/WebGPU).
   *
   * @returns Shader code string containing the conditionalDiscard function definition
   */
  getPixelShaderDefinitions(engine: Engine) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      return `
fn ${this.__shaderFunctionName}(position: vec3f, outTransformedPosition: ptr<function, vec3f>) {
  let transform = get_${this.__variableName}(uniformDrawParameters.materialSid, 0u);
  let inv=inverseTransform(transform);
  let tp=(inv*vec4f(position, 1.0)).xyz;
  *outTransformedPosition = tp;
}
      `;
    }
    return `
void ${this.__shaderFunctionName}(in vec3 position, out vec3 outTransformedPosition) {
  ${this.getMaterialSIDForWebGL()}
  mat4 transform = get_${this.__variableName}(materialSID, 0u);
  mat4 inv=inverseTransform(transform);
  vec3 tp=(inv*vec4(position,1.)).xyz;
  outTransformedPosition = tp;
}
      `;
  }

  /**
   * Gets the pixel/fragment shader body code.
   * Currently returns empty string as no additional fragment processing is needed.
   *
   * @returns Empty shader body string
   */
  getPixelShaderBody() {
    return '';
  }

  /**
   * Gets the attribute names required by this shader part.
   * DiscardShader doesn't require any specific vertex attributes.
   *
   * @returns Empty array of attribute names
   */
  get attributeNames(): AttributeNames {
    return [];
  }

  /**
   * Gets the vertex attribute semantics required by this shader part.
   * DiscardShader doesn't require any specific vertex attribute semantics.
   *
   * @returns Empty array of vertex attribute enums
   */
  get attributeSemantics(): Array<VertexAttributeEnum> {
    return [];
  }

  /**
   * Gets the attribute compositions required by this shader part.
   * DiscardShader doesn't require any specific attribute compositions.
   *
   * @returns Empty array of composition type enums
   */
  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [];
  }
}
