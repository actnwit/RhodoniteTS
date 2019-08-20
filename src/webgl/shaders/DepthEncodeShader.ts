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

export default class DepthEncodeShader extends GLSLShader implements ISingleShader {
  static __instance: DepthEncodeShader;
  public static readonly materialElement = ShaderNode.ClassicShading;

  private constructor() {
    super();
  }

  static getInstance(): DepthEncodeShader {
    if (!this.__instance) {
      this.__instance = new DepthEncodeShader();
    }
    return this.__instance;
  }


  get vertexShaderDefinitions() {
    return ``;
  };


  getVertexShaderBody(args: any) {
    const _in = this.glsl_vertex_in;
    const _out = this.glsl_vertex_out;

    return `${this.glsl_versionText}
precision highp float;
${_in} vec3 a_position;
${_in} vec3 a_normal;
${_in} float a_instanceID;
${_in} vec4 a_joint;
${_in} vec4 a_weight;
${_out} vec3 v_normal_inWorld;
${_out} vec4 v_position_inLocal;
${_out} vec4 v_position_inWorld;

uniform float materialSID;
uniform vec3 u_viewPosition;

uniform float u_pointSize;
uniform vec3 u_pointDistanceAttenuation;

uniform int u_skinningMode;
uniform highp vec4 u_boneCompressedChank[90];
uniform highp vec4 u_boneCompressedInfo;

${(typeof args.matricesGetters !== 'undefined') ? args.matricesGetters : ''}

${(typeof args.definitions !== 'undefined') ? args.definitions : ''}

${(typeof args.getters !== 'undefined') ? args.getters : ''}

${this.toNormalMatrix}

${this.getSkinMatrix}

${this.processGeometryWithSkinningOptionally}

  void main(){
    mat4 worldMatrix = get_worldMatrix(a_instanceID);
    mat4 viewMatrix = get_viewMatrix(a_instanceID);
    mat4 projectionMatrix = get_projectionMatrix(a_instanceID);
    mat3 normalMatrix = get_normalMatrix(a_instanceID);

    // Skeletal
    bool isSkinning;
    skinning(isSkinning, normalMatrix, normalMatrix);

    ${this.pointSprite}

    v_position_inLocal = gl_Position;
  }
    `;

  }


  vertexShaderBody: string = ``;

  getFragmentShader() {
    const _in = this.glsl_fragment_in;

    const mainCameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;

    const zNear: number | string = mainCameraComponent.zNearInner;
    const zFar: number | string = mainCameraComponent.zFarInner;
    let ZNearToFar: number | string = zFar - zNear;

    if (Number.isInteger(ZNearToFar)) {
      ZNearToFar = ZNearToFar + '.0';
    }

    return `${this.glsl_versionText}
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

${this.glsl_rt0}
void main ()
{
  float normalizationCoefficient = 1.0 / ${ZNearToFar};
  float linerDepth = normalizationCoefficient * length(v_position_inLocal);
  vec4 encodedLinearDepth = encodeDepthToRGBA(linerDepth);

  rt0 = encodedLinearDepth;

  ${this.glsl_fragColor}
}
`;
  }

  get pixelShaderDefinitions() {
    return '';
  }

  getPixelShaderBody() {
    return this.getFragmentShader();
  }

  attributeNames: AttributeNames = ['a_position', 'a_normal', 'a_joint', 'a_weight', 'a_instanceID'];
  attributeSemantics: Array<VertexAttributeEnum> = [VertexAttribute.Position, VertexAttribute.Normal, VertexAttribute.Joints0, VertexAttribute.Weights0, VertexAttribute.Instance];

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [CompositionType.Vec3, CompositionType.Vec3, CompositionType.Vec4, CompositionType.Vec4, CompositionType.Scalar];
  }
}
