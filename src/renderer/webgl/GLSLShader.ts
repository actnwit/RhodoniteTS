import { VertexAttributeEnum, VertexAttribute } from "../../definitions/VertexAttribute";

export type AttributeNames = Array<string>;

export default class GLSLShader {
  static vertexShader:string = `
attribute vec3 in_position;
attribute vec3 in_color;

varying vec3 v_color;
void main ()
{
  gl_Position = vec4(in_position, 1.0);
  v_color = in_color;
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

  static attributeNanes: AttributeNames = ['in_position', 'in_color'];
  static attributeSemantics: Array<VertexAttributeEnum> = [VertexAttribute.Position, VertexAttribute.Color0];
}
