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


  get vertexShaderDefinitions() {
    const _version = this.glsl_versionText;
    const _in = this.glsl_vertex_in;
    const _out = this.glsl_vertex_out;

    return ``;

  };

  vertexShaderBody: string = `
  `;

  getVertexShaderBody(args: any) {
    const _version = this.glsl_versionText;
    const _in = this.glsl_fragment_in;
    const _out = this.glsl_vertex_out;
    const _def_rt0 = this.glsl_rt0;
    const _def_fragColor = this.glsl_fragColor;
    const _texture = this.glsl_texture;
    const _textureCube = this.glsl_textureCube;

return `${_version}
precision highp float;

${(typeof args.definitions !== 'undefined') ? args.definitions : '' }

uniform float u_materialSID;
${_in} vec3 a_position;
${_in} float a_instanceID;
${_in} vec4 a_joint;
${_in} vec4 a_weight;
${_in} vec3 a_normal;
// ${_out} vec4 v_position_inWorld;
// ${_out} vec3 v_normal_inWorld;
//uniform mat4 u_boneMatrices[100];
uniform highp vec4 u_boneCompressedChank[90];
uniform highp vec4 u_boneCompressedInfo;
uniform int u_skinningMode;

${(typeof args.matricesGetters !== 'undefined') ? args.matricesGetters : '' }

${(typeof args.getters !== 'undefined') ? args.getters : '' }

${this.toNormalMatrix}


void main()
{
  mat4 worldMatrix = get_worldMatrix(a_instanceID);
  mat4 viewMatrix = get_viewMatrix(a_instanceID);
  mat4 projectionMatrix = get_projectionMatrix(a_instanceID);
  mat3 normalMatrix = get_normalMatrix(a_instanceID);

  gl_Position = projectionMatrix * viewMatrix * worldMatrix * vec4(a_position, 1.0);

  // bool isSkinning;
  // skinning(isSkinning, normalMatrix, normalMatrix);
}

`;
  }


  getFragmentShader(args: any) {
    const _version = this.glsl_versionText;
    const _in = this.glsl_fragment_in;
    const _def_rt0 = this.glsl_rt0;
    const _def_fragColor = this.glsl_fragColor;
    const _texture = this.glsl_texture;
    const _textureCube = this.glsl_textureCube;

    return `${_version}
precision highp float;

${(typeof args.definitions !== 'undefined') ? args.definitions : '' }

uniform highp sampler2D u_dataTexture;

${this.fetchElement}


uniform float u_entityUID;
// ${_in} vec4 v_position_inWorld;
// ${_in} vec3 v_normal_inWorld;

${(typeof args.getters !== 'undefined') ? args.getters : '' }

${_def_rt0}
void main ()
{

  // rt0 = vec4(u_entityUID/255.0, 0.0, 0.0, 1.0);
  rt0 = vec4(1.0, 0.0, 0.0, 1.0);

  ${_def_fragColor}
}
`;
  }


  get pixelShaderDefinitions() {
    return '';
  }

  getPixelShaderBody(args: any) {
    return this.getFragmentShader(args);
  }

  attributeNames: AttributeNames = ['a_position', 'a_normal', 'a_instanceID', 'a_joint', 'a_weight'];
  attributeSemantics: Array<VertexAttributeEnum> = [VertexAttribute.Position, VertexAttribute.Normal, VertexAttribute.Instance, VertexAttribute.Joints0, VertexAttribute.Weights0];

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [CompositionType.Vec3, CompositionType.Vec3, CompositionType.Scalar, CompositionType.Vec4, CompositionType.Vec4];
  }
}
