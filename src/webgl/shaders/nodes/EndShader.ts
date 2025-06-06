import { CommonShaderPart } from '../CommonShaderPart';
import { ShaderNode } from '../../../foundation/definitions/ShaderNode';
import { ProcessApproach } from '../../../foundation/definitions/ProcessApproach';
import { SystemState } from '../../../foundation/system/SystemState';
import type { AttributeNames } from '../../types/CommonTypes';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';

/**
 * EndShader class provides the final output functions for both vertex and fragment shaders.
 * This class handles the final position output in vertex shaders and color output in fragment shaders,
 * supporting both WebGL and WebGPU rendering approaches.
 *
 * @extends CommonShaderPart
 */
export class EndShader extends CommonShaderPart {
  static __instance: EndShader;
  public static readonly materialElement = ShaderNode.PBRShading;

  /**
   * Private constructor to enforce singleton pattern.
   */
  private constructor() {
    super();
  }

  /**
   * Gets the singleton instance of EndShader.
   * Creates a new instance if one doesn't exist.
   *
   * @returns The singleton EndShader instance
   */
  static getInstance(): EndShader {
    if (!this.__instance) {
      this.__instance = new EndShader();
    }
    return this.__instance;
  }

  /**
   * Gets the vertex shader function definitions for position output.
   * Returns appropriate function definition based on the current process approach (WebGL/WebGPU).
   *
   * @returns Shader code string containing the outPosition function definition
   */
  get vertexShaderDefinitions() {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      return `
      fn outPosition(inPosition: vec4<f32>) {
        output.position = inPosition;
      }
      `;
    } else {
      return `
      void outPosition(in vec4 inPosition) {
        gl_Position = inPosition;
      }
      `;
    }
  }

  /**
   * Gets the vertex shader body code.
   * Currently returns empty string as no additional vertex processing is needed.
   *
   * @returns Empty shader body string
   */
  get vertexShaderBody() {
    return `

    `;
  }

  /**
   * Gets the pixel/fragment shader function definitions for color output.
   * Returns appropriate function definition based on the current process approach (WebGL/WebGPU).
   *
   * @returns Shader code string containing the outColor function definition
   */
  get pixelShaderDefinitions() {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      return `
      fn outColor(inColor: vec4<f32>) {
        rt0 = inColor;
      }
      `;
    } else {
      return `
      void outColor(in vec4 inColor) {
        rt0 = inColor;
      }
      `;
    }
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
   * EndShader doesn't require any specific vertex attributes.
   *
   * @returns Empty array of attribute names
   */
  get attributeNames(): AttributeNames {
    return [];
  }

  /**
   * Gets the vertex attribute semantics required by this shader part.
   * EndShader doesn't require any specific vertex attribute semantics.
   *
   * @returns Empty array of vertex attribute enums
   */
  get attributeSemantics(): Array<VertexAttributeEnum> {
    return [];
  }

  /**
   * Gets the attribute compositions required by this shader part.
   * EndShader doesn't require any specific attribute compositions.
   *
   * @returns Empty array of composition type enums
   */
  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [];
  }
}
