import { VertexAttributeEnum, VertexAttribute } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import Config from "../../foundation/core/Config";
import { ShaderNode } from "../../foundation/definitions/ShaderNode";
import { CompositionTypeEnum } from "../../foundation/main";
import { CompositionType } from "../../foundation/definitions/CompositionType";
import ComponentRepository from '../../foundation/core/ComponentRepository';
import CameraComponent from '../../foundation/components/CameraComponent';

export type AttributeNames = Array<string>;

export default class DepthEncodingShader extends GLSLShader {
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
`;
  };

  vertexShaderBody: string = `
  v_position_inLocal = u_projectionMatrix * u_viewMatrix * u_worldMatrix * vec4(a_position, 1.0);
  gl_Position = v_position_inLocal;
  `;

  get fragmentShaderSimple() {
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

  get pixelShaderBody() {
    return this.fragmentShaderSimple;
  }

  attributeNames: AttributeNames = ['a_position'];
  attributeSemantics: Array<VertexAttributeEnum> = [VertexAttribute.Position];

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [CompositionType.Vec3];
  }
}
