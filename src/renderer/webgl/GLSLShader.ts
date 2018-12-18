import { VertexAttributeEnum, VertexAttribute } from "../../definitions/VertexAttribute";

export type AttributeNames = Array<string>;

export default class GLSLShader {
  static vertexShader:string = `
attribute vec3 i_position;
void main ()
{
	gl_Position = vec4(i_position, 1.0);
}
  `;

  static fragmentShader:string = `
  precision mediump float;
  void main ()
  {
    gl_FragColor = vec4(1.0);
  }
`;

  static attributeNanes: AttributeNames = ['i_position'];
  static attributeSemantics: Array<VertexAttributeEnum> = [VertexAttribute.Position];
}
