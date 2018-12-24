import { VertexAttributeEnum, VertexAttribute } from "../../definitions/VertexAttribute";

export type AttributeNames = Array<string>;

export default class GLSLShader {
  static vertexShader:string = `
attribute vec3 a_position;
attribute vec3 a_color;
attribute float a_instanceID;

varying vec3 v_color;
void main ()
{
  gl_Position = vec4(a_position, 1.0);
  gl_Position.x += a_instanceID / 5.0;
  v_color = a_color;
}
  `;

  static fragmentShader:string = `
  precision mediump float;
  varying vec3 v_color;
  void main ()
  {
    gl_FragColor = vec4(v_color, 1.0);
  }
`;

  static attributeNanes: AttributeNames = ['a_position', 'a_color', 'a_instanceID'];
  static attributeSemantics: Array<VertexAttributeEnum> = [VertexAttribute.Position, VertexAttribute.Color0, VertexAttribute.Instance];
}
