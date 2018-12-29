import { VertexAttributeEnum, VertexAttribute } from "../../definitions/VertexAttribute";
import MemoryManager from "../../core/MemoryManager";
import WebGLResourceRepository from "./WebGLResourceRepository";

export type AttributeNames = Array<string>;

export default class GLSLShader {
  static get glsl_vertex_in() {
    if (WebGLResourceRepository.getInstance().currentWebGLContextWrapper!.isWebGL2) {
      return 'in';
    } else {
      return 'attribute';
    }
  }

  static get glsl_fragment_in() {
    if (WebGLResourceRepository.getInstance().currentWebGLContextWrapper!.isWebGL2) {
      return 'in';
    } else {
      return 'varying';
    }
  }

  static get glsl_vertex_out() {
    if (WebGLResourceRepository.getInstance().currentWebGLContextWrapper!.isWebGL2) {
      return 'out';
    } else {
      return 'varying';
    }
  }

  static get glsl_texture() {
    if (WebGLResourceRepository.getInstance().currentWebGLContextWrapper!.isWebGL2) {
      return 'texture';
    } else {
      return 'texture2D';
    }
  }

  static get glsl_versionText() {
    if (WebGLResourceRepository.getInstance().currentWebGLContextWrapper!.isWebGL2) {
      return '#version 300 es\n'
    } else {
      return '';
    }
   }

  static get vertexShaderVariableDefinitions() {
    const _version = this.glsl_versionText;
    const _in = this.glsl_vertex_in;
    const _out = this.glsl_vertex_out;

    return `${_version}
precision highp float;
${_in} vec3 a_position;
${_in} vec3 a_color;
${_in} float a_instanceID;
${_out} vec3 v_color;`;

  };

static get vertexShaderMethodDefinitions_dataTexture() {
  const _texture = this.glsl_texture;

  return `
uniform sampler2D u_dataTexture;
/*
 * This idea from https://qiita.com/YVT/items/c695ab4b3cf7faa93885
 * arg = vec2(1. / size.x, 1. / size.x / size.y);
 */
// vec4 fetchElement(sampler2D tex, float index, vec2 arg)
// {
//   return ${_texture}( tex, arg * (index + 0.5) );
// }

vec4 fetchElement(sampler2D tex, float index, vec2 invSize)
{
  float t = (index + 0.5) * invSize.x;
  float x = fract(t);
  float y = (floor(t) + 0.5) * invSize.y;
  return ${_texture}( tex, vec2(x, y) );
}

mat4 getMatrix(float instanceId)
{
  float index = instanceId - 1.0;
  float powVal = ${MemoryManager.bufferLengthOfOneSide}.0;
  vec2 arg = vec2(1.0/powVal, 1.0/powVal);
//  vec2 arg = vec2(1.0/powVal, 1.0/powVal/powVal);

  vec4 col0 = fetchElement(u_dataTexture, index * 4.0 + 0.0, arg);
 vec4 col1 = fetchElement(u_dataTexture, index * 4.0 + 1.0, arg);
 vec4 col2 = fetchElement(u_dataTexture, index * 4.0 + 2.0, arg);

  mat4 matrix = mat4(
    col0.x, col1.x, col2.x, 0.0,
    col0.y, col1.y, col2.y, 0.0,
    col0.z, col1.z, col2.z, 0.0,
    col0.w, col1.w, col2.w, 1.0
    );

  return matrix;
}
`;
  }

  static vertexShaderMethodDefinitions_UBO:string =
`layout (std140) uniform matrix {
  mat4 world[1024];
} u_matrix;

mat4 getMatrix(float instanceId) {
  float index = instanceId - 1.0;
  return transpose(u_matrix.world[int(index)]);
}
  `
  static vertexShaderBody:string = `


void main ()
{
  mat4 matrix = getMatrix(a_instanceID);
  //mat4 matrix = getMatrix(gl_InstanceID);

  gl_Position = matrix * vec4(a_position, 1.0);
  // gl_Position = vec4(a_position, 1.0);
  // gl_Position.xyz /= 10.0;
  // gl_Position.x += a_instanceID / 20.0;
//  gl_Position.x += col0.x / 5.0;

  v_color = a_color;
}
  `;

  static get glsl_rt0() {
    if (WebGLResourceRepository.getInstance().currentWebGLContextWrapper!.isWebGL2) {
      return 'layout(location = 0) out vec4 rt0;\n';
    } else {
      return 'vec4 rt0;\n';
    }
  }

  static get glsl_fragColor() {
    if (WebGLResourceRepository.getInstance().currentWebGLContextWrapper!.isWebGL2) {
      return '';
    } else {
      return 'gl_FragColor = rt0;\n';
    }
  }

  static get fragmentShaderSimple() {
    const _version = this.glsl_versionText;
    const _in = this.glsl_fragment_in;
    const _def_rt0 = this.glsl_rt0;
    const _def_fragColor = this.glsl_fragColor;

    return `${_version}
precision highp float;
${_in} vec3 v_color;
${_def_rt0}
void main ()
{
  rt0 = vec4(v_color, 1.0);
  ${_def_fragColor}
}
`;
  }

  static get vertexShaderDataTexture() {
    return GLSLShader.vertexShaderVariableDefinitions + GLSLShader.vertexShaderMethodDefinitions_dataTexture + GLSLShader.vertexShaderBody;
  }

  static get vertexShaderUBO() {
    return GLSLShader.vertexShaderVariableDefinitions + GLSLShader.vertexShaderMethodDefinitions_UBO + GLSLShader.vertexShaderBody;
  }

  static get fragmentShader() {
    return GLSLShader.fragmentShaderSimple;
  }

  static attributeNanes: AttributeNames = ['a_position', 'a_color', 'a_instanceID'];
  static attributeSemantics: Array<VertexAttributeEnum> = [VertexAttribute.Position, VertexAttribute.Color0, VertexAttribute.Instance];
}
