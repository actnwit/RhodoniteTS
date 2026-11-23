import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import { ProcessApproach } from '../../../foundation/definitions/ProcessApproach';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { Engine } from '../../../foundation/system/Engine';
import type { AttributeNames } from '../../types/CommonTypes';
import { RaymarchingShaderPart } from '../RaymarchingShaderPart';

/**
 * OutUnionShader generates the terminal function of a raymarching component that
 * records the component's distance (and object id) when it wins the union.
 *
 * The distance in the graph is computed in the space produced by the SDF position
 * chain, which for `SdApplyWorldMatrix` is the component's local space. Scaling an
 * entity below 1 makes a local-space distance larger than the matching world-space
 * distance, so marching by it overshoots the surface (the shape loses parts). The
 * function therefore multiplies the distance by `rnRaymarchDistanceScale(worldMatrix)`,
 * a conservative local-to-world scale of the component's world matrix, so the value
 * becomes a valid world-space ray marching step. The matrix is an existing
 * per-component material uniform, so no extra parameters are needed.
 *
 * `SdApplyTransform` nodes inside the graph are handled by their per-node scale
 * globals, which are multiplied in as well (see {@link SdApplyTransformShader}).
 */
export class OutUnionShader extends RaymarchingShaderPart {
  private __shaderFunctionName: string;
  private __distanceCorrectionUniformNames: string[];
  private __distanceScaleGlobalNames: string[];

  /**
   * @param shaderFunctionName - Unique function name of the terminal node
   * @param distanceCorrectionUniformNames - Per-component world matrix uniforms
   * used to convert the local-space distance to a conservative world-space distance
   * @param distanceScaleGlobalNames - Per-`SdApplyTransform` globals that hold the
   * smallest axis scale of the transform node in the terminal's subtree
   */
  constructor(
    shaderFunctionName: string,
    distanceCorrectionUniformNames: readonly string[] = [],
    distanceScaleGlobalNames: readonly string[] = []
  ) {
    super();
    this.__shaderFunctionName = shaderFunctionName;
    this.__distanceCorrectionUniformNames = [...distanceCorrectionUniformNames];
    this.__distanceScaleGlobalNames = [...distanceScaleGlobalNames];
  }

  getVertexShaderDefinitions(_engine: Engine) {
    return '';
  }

  get vertexShaderBody() {
    return '';
  }

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

  getPixelShaderBody() {
    return '';
  }

  get attributeNames(): AttributeNames {
    return [];
  }

  get attributeSemantics(): Array<VertexAttributeEnum> {
    return [];
  }

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [];
  }
}
