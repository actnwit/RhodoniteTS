import { VertexAttributeEnum, VertexAttribute } from "../../definitions/VertexAttribute";

export type AttributeNames = Array<string>;

export default class GLSLShader {
  static vertexShader:string = `
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
// vec4 fetchElement(sampler2D tex, float index, vec2 arg)
// {
//   return texture2D( tex, arg * (index + 0.5) );
// }

vec4 fetchElement(sampler2D tex, float index, vec2 invSize)
{
  float t = (index + 0.5) * invSize.x;
  float x = fract(t);
  float y = (floor(t) + 0.5) * invSize.y;
  return texture2D( tex, vec2(x, y) );
}

void main ()
{
  float index = a_instanceID - 1.0;
  float powVal = pow(2.0, 10.0);
  vec2 arg = vec2(1.0/powVal, 1.0/powVal);

  vec4 col0 = fetchElement(u_dataTexture, index * 4.0 + 0.0, arg);
  vec4 col1 = fetchElement(u_dataTexture, index * 4.0 + 1.0, arg);
  vec4 col2 = fetchElement(u_dataTexture, index * 4.0 + 2.0, arg);
  vec4 col3 = fetchElement(u_dataTexture, index * 4.0 + 3.0, arg);

  mat4 matrix = mat4(
    col0.x, col1.x, col2.x, 0.0,
    col0.y, col1.y, col2.y, 0.0,
    col0.z, col1.z, col2.z, 0.0,
    col0.w, col1.w, col2.w, 1.0
    );

  // mat4 matrix = mat4(
  //   col0.x, col0.y, col0.z, 0.0,
  //   col1.x, col1.y, col1.z, 0.0,
  //   col2.x, col2.y, col2.z, 0.0,
  //   col3.x, col3.y, col3.z, 1.0
  //   );

    // mat4 matrix = mat4(
  //   col0.x, col1.x, col2.x, col3.x,
  //   col0.y, col1.y, col2.y, col3.y,
  //   col0.z, col1.z, col2.z, col3.z,
  //   col0.w, col1.w, col2.w, col3.w
  //   );


  gl_Position = matrix * vec4(a_position, 1.0);
//  gl_Position = vec4(a_position, 1.0);
//  gl_Position.x += a_instanceID / 5.0;
//  gl_Position.x += col0.x / 5.0;

  v_color = a_color;
}
  `;

  static fragmentShader:string = `
  precision highp float;
  varying vec3 v_color;
  void main ()
  {
    gl_FragColor = vec4(v_color, 1.0);
  }
`;

  static attributeNanes: AttributeNames = ['a_position', 'a_color', 'a_instanceID'];
  static attributeSemantics: Array<VertexAttributeEnum> = [VertexAttribute.Position, VertexAttribute.Color0, VertexAttribute.Instance];
}
