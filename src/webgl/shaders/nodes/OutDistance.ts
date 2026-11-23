import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import { ProcessApproach } from '../../../foundation/definitions/ProcessApproach';
import { ShaderNode } from '../../../foundation/definitions/ShaderNode';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { Engine } from '../../../foundation/system/Engine';
import type { AttributeNames } from '../../types/CommonTypes';
import { RaymarchingShaderPart } from '../RaymarchingShaderPart';

/**
 * OutDistanceShader generates the terminal function of a raymarching component that
 * records the component's distance (and object id) as the final output.
 *
 * Like {@link OutUnionShader}, the distance is multiplied by
 * `rnRaymarchDistanceScale(worldMatrix)`, a conservative local-to-world scale of the
 * component's world matrix, so that a local-space distance becomes a valid world-space
 * ray marching step. Without it, scaling an entity below 1 makes sphere tracing
 * overshoot the surface. `SdApplyTransform` nodes inside the graph contribute their
 * per-node scale globals as well.
 */
export class OutDistanceShader extends RaymarchingShaderPart {
  public static readonly materialElement = ShaderNode.PBRShading;
  private static __defaultInstance: OutDistanceShader;

  private __shaderFunctionName: string;
  private __distanceCorrectionUniformNames: string[];
  private __distanceScaleGlobalNames: string[];

  /**
   * Gets a shared instance with the default function name (`outDistance`) and no
   * distance correction. Kept for API compatibility; shader nodes create their own
   * instance so each terminal can carry its component's correction.
   */
  static getInstance(): OutDistanceShader {
    if (!this.__defaultInstance) {
      this.__defaultInstance = new OutDistanceShader();
    }
    return this.__defaultInstance;
  }

  /**
   * @param shaderFunctionName - Unique function name of the terminal node
   * (defaults to `outDistance` for compatibility)
   * @param distanceCorrectionUniformNames - Per-component world matrix uniforms
   * used to convert the local-space distance to a conservative world-space distance
   * @param distanceScaleGlobalNames - Per-`SdApplyTransform` globals that hold the
   * smallest axis scale of the transform node in the terminal's subtree
   */
  constructor(
    shaderFunctionName = 'outDistance',
    distanceCorrectionUniformNames: readonly string[] = [],
    distanceScaleGlobalNames: readonly string[] = []
  ) {
    super();
    this.__shaderFunctionName = shaderFunctionName;
    this.__distanceCorrectionUniformNames = [...distanceCorrectionUniformNames];
    this.__distanceScaleGlobalNames = [...distanceScaleGlobalNames];
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
fn ${this.__shaderFunctionName}(value: f32, objectId: f32) {
  var distanceScale = 1.0;
${this.__distanceCorrectionUniformNames
  .map(
    name =>
      `  distanceScale = min(distanceScale, rnRaymarchDistanceScale(get_${name}(uniformDrawParameters.materialSid, 0u)));
`
  )
  .join('')}${this.__distanceScaleGlobalNames
  .map(
    name => `  distanceScale = min(distanceScale, ${name});
`
  )
  .join('')}  distanceScale = clamp(distanceScale, 0.0001, 1.0);
  let scaledValue = value * distanceScale;
  if (scaledValue < g_distance) {
    g_distance = scaledValue;
    g_hitObjectId = objectId;
  }
}
`;
    }
    return `
void ${this.__shaderFunctionName}(in float value, in float objectId) {
  ${this.getMaterialSIDForWebGL()}
  float distanceScale = 1.0;
${this.__distanceCorrectionUniformNames
  .map(
    name => `  distanceScale = min(distanceScale, rnRaymarchDistanceScale(get_${name}(materialSID, 0u)));
`
  )
  .join('')}${this.__distanceScaleGlobalNames
  .map(
    name => `  distanceScale = min(distanceScale, ${name});
`
  )
  .join('')}  distanceScale = clamp(distanceScale, 0.0001, 1.0);
  float scaledValue = value * distanceScale;
  if (scaledValue < g_distance) {
    g_distance = scaledValue;
    g_hitObjectId = objectId;
  }
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
