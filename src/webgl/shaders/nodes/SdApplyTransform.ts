import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import { ProcessApproach } from '../../../foundation/definitions/ProcessApproach';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { Engine } from '../../../foundation/system/Engine';
import type { AttributeNames } from '../../types/CommonTypes';
import { RaymarchingShaderPart } from '../RaymarchingShaderPart';

/**
 * SdApplyTransformShader generates the position transform function of one
 * `SdApplyTransform` node and records the node's local-to-parent scale.
 *
 * The transform is `T * R * S`, so its smallest singular value is exactly the
 * smallest axis scale. The value is stored in a per-node global instead of being
 * returned, because the node only has a position output socket. A raymarching
 * terminal node (`OutUnion` / `OutDistance`) multiplies the distances that flow
 * through this transform by that global (see {@link OutUnionShader}), so a shape
 * scaled below 1 inside the graph stays a valid world-space ray marching step.
 *
 * The global is initialized to 1 and written on every `map()` evaluation before the
 * terminal that reads it (transform nodes are ancestors of the terminals in the SDF
 * graph, so the generated calls are topologically ordered).
 */
export class SdApplyTransformShader extends RaymarchingShaderPart {
  private __shaderFunctionName: string;
  private __scaleGlobalName: string;

  /**
   * @param shaderFunctionName - Unique function name of the transform node
   * @param scaleGlobalName - Unique global that receives the node's smallest axis scale
   */
  constructor(shaderFunctionName: string, scaleGlobalName: string) {
    super();
    this.__shaderFunctionName = shaderFunctionName;
    this.__scaleGlobalName = scaleGlobalName;
  }

  /** Name of the global that holds this node's smallest axis scale. */
  get scaleGlobalName() {
    return this.__scaleGlobalName;
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
var<private> ${this.__scaleGlobalName}: f32 = 1.0;
fn ${this.__shaderFunctionName}(position: vec3f, translation: vec3f, xyzEulerAngles: vec3f, scale: vec3f, outTransformedPosition: ptr<function, vec3f>) {
  ${this.__scaleGlobalName} = clamp(min(abs(scale.x), min(abs(scale.y), abs(scale.z))), 0.0001, 1.0);
  let transform = createTransformMatrix(translation, xyzEulerAngles, scale);
  let inv = inverseTransform(transform);
  *outTransformedPosition = (inv * vec4f(position, 1.0)).xyz;
}
`;
    }
    return `
float ${this.__scaleGlobalName} = 1.0;
void ${this.__shaderFunctionName}(in vec3 position, in vec3 translation, in vec3 xyzEulerAngles, in vec3 scale, out vec3 outTransformedPosition) {
  ${this.__scaleGlobalName} = clamp(min(abs(scale.x), min(abs(scale.y), abs(scale.z))), 0.0001, 1.0);
  mat4 transform = createTransformMatrix(translation, xyzEulerAngles, scale);
  mat4 inv = inverseTransform(transform);
  outTransformedPosition = (inv * vec4(position, 1.0)).xyz;
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
