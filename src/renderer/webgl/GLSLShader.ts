import { VertexAttributeEnum, VertexAttribute } from "../../definitions/VertexAttribute";
import MemoryManager from "../../core/MemoryManager";

export type AttributeNames = Array<string>;

export default class GLSLShader {
  static vertexShaderDefinitions_webgl1:string = `
precision highp float;
attribute vec3 a_position;
attribute vec3 a_color;
attribute float a_instanceID;

varying vec3 v_color;
uniform sampler2D u_dataTexture;


/*
 * This idea from https://qiita.com/YVT/items/c695ab4b3cf7faa93885
 * arg = vec2(1. / size.x, 1. / size.x / size.y);
 */
vec4 fetchElement(sampler2D tex, float index, vec2 invSize)
{
  float t = (index + 0.5) * invSize.x;
  float x = fract(t);
  float y = (floor(t) + 0.5) * invSize.y;
  return texture2D( tex, vec2(x, y) );
}

mat4 getMatrix(float instanceId)
{
  float index = instanceId - 1.0;
  float powVal = ${MemoryManager.bufferLengthOfOneSide}.0;
  vec2 arg = vec2(1.0/powVal, 1.0/powVal);

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

    `
  static vertexShaderDefinitions_webgl2:string =
`#version 300 es
precision highp float;
in vec3 a_position;
in vec3 a_color;
in float a_instanceID;

out vec3 v_color;
layout (std140) uniform matrix {
  mat4 world[1024];
} u_matrix;

mat4 getMatrix(float instanceId) {
  float index = instanceId - 1.0;
  return u_matrix.world[int(index)];
}
  `
  static vertexShaderBody:string = `


void main ()
{
  mat4 matrix = getMatrix(a_instanceID);

  gl_Position = matrix * vec4(a_position, 1.0);
//  gl_Position = vec4(a_position, 1.0);
//  gl_Position.x += a_instanceID / 5.0;
//  gl_Position.x += col0.x / 5.0;

  v_color = a_color;
}
  `;

  static fragmentShader_webgl1:string =
`
precision highp float;
varying vec3 v_color;
void main ()
{
  gl_FragColor = vec4(v_color, 1.0);
}
`;
  static fragmentShader_webgl2:string =
`#version 300 es
precision highp float;
in vec3 v_color;
layout(location = 0) out vec4 rt0;
void main ()
{
  rt0 = vec4(v_color, 1.0);
}
`;

  static get vertexShaderWebGL1() {
    return GLSLShader.vertexShaderDefinitions_webgl1 + GLSLShader.vertexShaderBody;
  }

  static get vertexShaderWebGL2() {
    return GLSLShader.vertexShaderDefinitions_webgl2 + GLSLShader.vertexShaderBody;
  }

  static get fragmentShaderWebGL1() {
    return GLSLShader.fragmentShader_webgl1;
  }

  static get fragmentShaderWebGL2() {
    return GLSLShader.fragmentShader_webgl2;
  }

  static attributeNanes: AttributeNames = ['a_position', 'a_color', 'a_instanceID'];
  static attributeSemantics: Array<VertexAttributeEnum> = [VertexAttribute.Position, VertexAttribute.Color0, VertexAttribute.Instance];
}
