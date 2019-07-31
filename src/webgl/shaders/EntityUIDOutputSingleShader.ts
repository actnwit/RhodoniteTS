import { VertexAttributeEnum, VertexAttribute } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import Config from "../../foundation/core/Config";
import { ShaderNode } from "../../foundation/definitions/ShaderNode";
import { CompositionTypeEnum } from "../../foundation/main";
import { CompositionType } from "../../foundation/definitions/CompositionType";
import ISingleShader from "./ISingleShader";

export type AttributeNames = Array<string>;

export default class EntityUIDOutputShader extends GLSLShader implements ISingleShader {
  static __instance: EntityUIDOutputShader;
  public static readonly materialElement = ShaderNode.ClassicShading;

  private constructor() {
    super();
  }

  static getInstance(): EntityUIDOutputShader {
    if (!this.__instance) {
      this.__instance = new EntityUIDOutputShader();
    }
    return this.__instance;
  }

  getVertexShaderBody(args: any) {
    const _version = this.glsl_versionText;
    const _in = this.glsl_vertex_in;
    const _out = this.glsl_vertex_out;


    return `${_version}
precision highp float;

${(typeof args.definitions !== 'undefined') ? args.definitions : '' }

${_in} vec3 a_position;
${_in} vec3 a_color;
${_in} vec3 a_normal;
${_in} float a_instanceID;
${_in} vec2 a_texcoord;
${_in} vec4 a_joint;
${_in} vec4 a_weight;
${_out} vec3 v_color;
${_out} vec3 v_normal_inWorld;
${_out} vec4 v_position_inWorld;
${_out} vec2 v_texcoord;

uniform float u_materialSID;
uniform vec3 u_viewPosition;
//uniform mat4 u_boneMatrices[100];
uniform highp vec4 u_boneCompressedChank[90];
uniform highp vec4 u_boneCompressedInfo;
uniform int u_skinningMode;


${(typeof args.matricesGetters !== 'undefined') ? args.matricesGetters : '' }

${(typeof args.getters !== 'undefined') ? args.getters : '' }

${this.toNormalMatrix}

${this.getSkinMatrix}

${this.processGeometryWithSkinningOptionally}

${this.pointSize}

${this.pointDistanceAttenuation}

void main()
{
  mat4 worldMatrix = get_worldMatrix(a_instanceID);
  mat4 viewMatrix = get_viewMatrix(a_instanceID);
  mat4 projectionMatrix = get_projectionMatrix(a_instanceID);
  mat3 normalMatrix = get_normalMatrix(a_instanceID);

  // Skeletal
  bool isSkinning;
  skinning(isSkinning, normalMatrix, normalMatrix);
}
    `;
  }

  get vertexShaderDefinitions() {

    return `
`;

  };

  vertexShaderBody: string = `
  `;

  getFragmentShader(args: any) {
    const _version = this.glsl_versionText;
    const _in = this.glsl_fragment_in;
    const _def_rt0 = this.glsl_rt0;
    const _def_fragColor = this.glsl_fragColor;
    const _texture = this.glsl_texture;

    return `${_version}
precision highp float;

${(typeof args.definitions !== 'undefined') ? args.definitions : '' }

uniform highp sampler2D u_dataTexture;

${this.fetchElement}

uniform float u_entityUID;

${_in} vec3 v_normal_inWorld;
${_in} vec4 v_position_inWorld;
${_def_rt0}

${(typeof args.getters !== 'undefined') ? args.getters : '' }

${this.packing}

void main ()
{
  rt0 = encodeFloatRGBA(u_entityUID);

  ${_def_fragColor}
}
`;
  }

  get pixelShaderDefinitions() {
    return '';
  }

  getPixelShaderBody(args: Object) {
    return this.getFragmentShader(args);
  }

  attributeNames: AttributeNames = ['a_position', 'a_color', 'a_normal', 'a_texcoord', 'a_joint', 'a_weight', 'a_instanceID'];
  attributeSemantics: Array<VertexAttributeEnum> = [VertexAttribute.Position, VertexAttribute.Color0,
  VertexAttribute.Normal, VertexAttribute.Texcoord0, VertexAttribute.Joints0, VertexAttribute.Weights0, VertexAttribute.Instance];

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [CompositionType.Vec3, CompositionType.Vec3, CompositionType.Vec3, CompositionType.Vec2, CompositionType.Vec4, CompositionType.Vec4, CompositionType.Scalar];
  }
}
