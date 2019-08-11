import { VertexAttributeEnum, VertexAttribute } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import Config from "../../foundation/core/Config";
import { ShaderNode } from "../../foundation/definitions/ShaderNode";
import { CompositionTypeEnum } from "../../foundation/main";
import { CompositionType } from "../../foundation/definitions/CompositionType";
import ISingleShader from "./ISingleShader";

export type AttributeNames = Array<string>;

export default class GammaCorrectionShader extends GLSLShader implements ISingleShader {
  static __instance: GammaCorrectionShader;
  public static readonly materialElement = ShaderNode.ClassicShading;

  private constructor() {
    super();
  }

  static getInstance(): GammaCorrectionShader {
    if (!this.__instance) {
      this.__instance = new GammaCorrectionShader();
    }
    return this.__instance;
  }


  get vertexShaderDefinitions() {
    return ``;
  };

  vertexShaderBody: string = ``;

  getVertexShaderBody(args: any) {
    const _version = this.glsl_versionText;
    const _in = this.glsl_vertex_in;
    const _out = this.glsl_vertex_out;

    return `${_version}
precision highp float;

${_in} vec3 a_position;
${_in} float a_instanceID;
${_in} vec2 a_texcoord;
${_out} vec2 v_texcoord;
uniform sampler2D u_dataTexture;

${(typeof args.matricesGetters !== 'undefined') ? args.matricesGetters : ''}

void main(){
  v_texcoord = a_texcoord;
  ${this.simpleMVPPosition}
}
`;
  }

  getFragmentShader(args: any) {
    const _version = this.glsl_versionText;
    const _in = this.glsl_fragment_in;
    const _def_rt0 = this.glsl_rt0;
    const _def_fragColor = this.glsl_fragColor;
    const _texture = this.glsl_texture;

    return `${_version}
precision highp float;

uniform sampler2D u_baseColorTexture;

${(typeof args.getters !== 'undefined') ? args.getters : ''}

vec3 linearToSrgb(vec3 linearColor) {
  return pow(linearColor, vec3(1.0/2.2));
}

vec3 srgbToLinear(vec3 srgbColor) {
  return pow(srgbColor, vec3(2.2));
}

${_in} vec2 v_texcoord;
${_def_rt0}
void main ()
{

  vec4 baseColor = ${_texture}(u_baseColorTexture, v_texcoord);

  baseColor.rgb = linearToSrgb(baseColor.rgb);

  rt0 = vec4(baseColor.rgb, 1.0);

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

  attributeNames: AttributeNames = ['a_position', 'a_texcoord', 'a_instanceID'];
  attributeSemantics: Array<VertexAttributeEnum> = [VertexAttribute.Position, VertexAttribute.Texcoord0, VertexAttribute.Instance];

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [CompositionType.Vec3, CompositionType.Vec2, CompositionType.Scalar];
  }
}
