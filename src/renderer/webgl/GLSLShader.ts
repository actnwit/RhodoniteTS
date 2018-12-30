import { VertexAttributeEnum, VertexAttribute } from "../../definitions/VertexAttribute";
import MemoryManager from "../../core/MemoryManager";
import WebGLResourceRepository from "./WebGLResourceRepository";

export type AttributeNames = Array<string>;

export default class GLSLShader {
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


  static get fragmentShader() {
    return GLSLShader.fragmentShaderSimple;
  }

  static attributeNanes: AttributeNames = ['a_position', 'a_color', 'a_instanceID'];
  static attributeSemantics: Array<VertexAttributeEnum> = [VertexAttribute.Position, VertexAttribute.Color0, VertexAttribute.Instance];
}
