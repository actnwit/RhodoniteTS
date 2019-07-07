import { VertexAttributeEnum, VertexAttribute } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import Config from "../../foundation/core/Config";
import { ShaderNode } from "../../foundation/definitions/ShaderNode";
import { CompositionTypeEnum } from "../../foundation/main";
import { CompositionType } from "../../foundation/definitions/CompositionType";
import ComponentRepository from '../../foundation/core/ComponentRepository';
import CameraComponent from '../../foundation/components/CameraComponent';
import ISingleShader from "./ISingleShader";

export type AttributeNames = Array<string>;

export default class DepthEncodingShader extends GLSLShader implements ISingleShader {
  static __instance: DepthEncodingShader;
  public static readonly materialElement = ShaderNode.ClassicShading;

  private constructor() {
    super();
  }

  static getInstance(): DepthEncodingShader {
    if (!this.__instance) {
      this.__instance = new DepthEncodingShader();
    }
    return this.__instance;
  }


  get vertexShaderDefinitions() {
    const _in = this.glsl_vertex_in;
    const _out = this.glsl_vertex_out;

    return `
${_in} vec3 a_position;
${_out} vec4 v_position_inLocal;

uniform vec3 u_pointDistanceAttenuation;
uniform vec3 u_viewPosition;
uniform float u_pointSize;
`;
  };

  vertexShaderBody: string = `
  // point sprite
  vec4 position_inWorld = u_worldMatrix * vec4(a_position, 1.0);
  float distanceFromCamera = length(position_inWorld.xyz - u_viewPosition);
  vec3 pointDistanceAttenuation = u_pointDistanceAttenuation;
  float distanceAttenuationFactor = sqrt(1.0/(pointDistanceAttenuation.x + pointDistanceAttenuation.y * distanceFromCamera + pointDistanceAttenuation.z * distanceFromCamera * distanceFromCamera));
  float maxPointSize = u_pointSize;
  gl_PointSize = clamp(distanceAttenuationFactor * maxPointSize, 0.0, maxPointSize);

  v_position_inLocal = u_projectionMatrix * u_viewMatrix * position_inWorld;
  gl_Position = v_position_inLocal;
  `;

  getFragmentShader() {
    const _in = this.glsl_fragment_in;

    const mainCameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;

    let zNear: number | string = mainCameraComponent.zNearInner;
    let zFar: number | string = mainCameraComponent.zFarInner;
    let ZNearToFar: number | string = zFar - zNear;

    if (Number.isInteger(ZNearToFar)) {
      ZNearToFar = ZNearToFar + '.0';
    }

    return `
precision highp float;
${_in} vec4 v_position_inLocal;

vec4 encodeDepthToRGBA(float depth){
  float r = depth;
  float g = fract(r * 255.0);
  float b = fract(g * 255.0);
  float a = fract(b * 255.0);
  float coef = 1.0 / 255.0;
  r -= g * coef;
  g -= b * coef;
  b -= a * coef;
  return vec4(r, g, b, a);
}

void main ()
{
  float normalizationCoefficient = 1.0 / ${ZNearToFar};
  float linerDepth = normalizationCoefficient * length(v_position_inLocal);
  vec4 encodedLinearDepth = encodeDepthToRGBA(linerDepth);

  gl_FragColor = encodedLinearDepth;
}
`;
  }

  get pixelShaderDefinitions() {
    return '';
  }

  getPixelShaderBody() {
    return this.getFragmentShader();
  }

  attributeNames: AttributeNames = ['a_position'];
  attributeSemantics: Array<VertexAttributeEnum> = [VertexAttribute.Position];

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [CompositionType.Vec3];
  }
}
