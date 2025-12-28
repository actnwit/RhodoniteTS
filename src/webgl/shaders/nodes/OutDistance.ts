import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import { ProcessApproach } from '../../../foundation/definitions/ProcessApproach';
import { ShaderNode } from '../../../foundation/definitions/ShaderNode';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { Engine } from '../../../foundation/system/Engine';
import type { AttributeNames } from '../../types/CommonTypes';
import { StandardShaderPart } from '../StandardShaderPart';

/**
 * OutDistanceShader class provides the out distance function for fragment shaders.
 * This class handles outputting the distance to the surface,
 * supporting both WebGL and WebGPU rendering approaches.
 *
 * @extends StandardShaderPart
 */
export class OutDistanceShader extends StandardShaderPart {
  static __instance: OutDistanceShader;
  public static readonly materialElement = ShaderNode.PBRShading;

  /**
   * Private constructor to enforce singleton pattern.
   */
  private constructor() {
    super();
  }

  /**
   * Gets the singleton instance of DiscardShader.
   * Creates a new instance if one doesn't exist.
   *
   * @returns The singleton DiscardShader instance
   */
  static getInstance(): OutDistanceShader {
    if (!this.__instance) {
      this.__instance = new OutDistanceShader();
    }
    return this.__instance;
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
      fn outDistance(value: f32) {
        g_distance = value;
      }
      `;
    }
    return `
      void outDistance(in float value) {
        g_distance = value;
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
