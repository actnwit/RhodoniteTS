import { CompositionType } from "../../foundation/definitions/CompositionType";
import { CompositionTypeEnum } from "../../foundation/main";
import GLSLShader from "./GLSLShader";
import ISingleShader from "./ISingleShader";
import { ShaderNode } from "../../foundation/definitions/ShaderNode";
import { VertexAttributeEnum, VertexAttribute } from "../../foundation/definitions/VertexAttribute";

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

  getVertexShaderBody(args: any) {
    const _version = this.glsl_versionText;
    const _in = this.glsl_vertex_in;
    const _out = this.glsl_vertex_out;

    return `${_version}
${this.glslPrecision}

${_in} float a_instanceID;
${_in} vec2 a_texcoord;
${_in} vec3 a_position;

${_out} vec2 v_texcoord;

${this.prerequisites}

${(typeof args.getters !== 'undefined') ? args.getters : ''}

${(typeof args.matricesGetters !== 'undefined') ? args.matricesGetters : ''}

void main(){
${this.mainPrerequisites}

${this.simpleMVPPosition}

  v_texcoord = a_texcoord;
}`;
  }

  getPixelShaderBody(args: any) {
    const _version = this.glsl_versionText;
    const _in = this.glsl_fragment_in;
    const _def_rt0 = this.glsl_rt0;
    const _def_fragColor = this.glsl_fragColor;
    const _texture = this.glsl_texture;

    return `${_version}
${this.glslPrecision}

${_in} vec2 v_texcoord;

${_def_rt0}

${this.prerequisites}

${(typeof args.getters !== 'undefined') ? args.getters : ''}

vec3 linearToSrgb(vec3 linearColor) {
  return pow(linearColor, vec3(1.0/2.2));
}

vec3 srgbToLinear(vec3 srgbColor) {
  return pow(srgbColor, vec3(2.2));
}

void main(){
${this.mainPrerequisites}

  vec4 baseColor = ${_texture}(u_baseColorTexture, v_texcoord);
  baseColor.rgb = linearToSrgb(baseColor.rgb);

  rt0 = vec4(baseColor.rgb, 1.0);

  ${_def_fragColor}
}`;
  }

  attributeNames: AttributeNames = ['a_position', 'a_texcoord', 'a_instanceID'];
  attributeSemantics: Array<VertexAttributeEnum> = [VertexAttribute.Position, VertexAttribute.Texcoord0, VertexAttribute.Instance];

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [
      CompositionType.Vec3,
      CompositionType.Vec2,
      CompositionType.Scalar,
    ];
  }
}
