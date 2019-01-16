import { VertexAttributeEnum, VertexAttribute } from "../foundation/definitions/VertexAttribute";
import WebGLResourceRepository from "./WebGLResourceRepository";
import System from "../foundation/system/System";
import ModuleManager from "../foundation/system/ModuleManager";
import getThisModule from "./getThisModule";

export type AttributeNames = Array<string>;

export default class GLSLShader {
  private static __instance: GLSLShader;
  private __webglResourceRepository?: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private constructor() {}

  static getInstance(): GLSLShader {
    if (!this.__instance) {
      this.__instance = new GLSLShader();
    }
    return this.__instance;
  }

  get glsl_rt0() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.isWebGL2) {
      return 'layout(location = 0) out vec4 rt0;\n';
    } else {
      return 'vec4 rt0;\n';
    }
  }

  get glsl_fragColor() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.isWebGL2) {
      return '';
    } else {
      return 'gl_FragColor = rt0;\n';
    }
  }

  get glsl_vertex_in() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.isWebGL2) {
      return 'in';
    } else {
      return 'attribute';
    }
  }

  get glsl_fragment_in() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.isWebGL2) {
      return 'in';
    } else {
      return 'varying';
    }
  }

  get glsl_vertex_out() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.isWebGL2) {
      return 'out';
    } else {
      return 'varying';
    }
  }

  get glsl_texture() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.isWebGL2) {
      return 'texture';
    } else {
      return 'texture2D';
    }
  }

  get glsl_versionText() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.isWebGL2) {
      return '#version 300 es\n'
    } else {
      return '';
    }
   }

  get vertexShaderVariableDefinitions() {
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

  vertexShaderBody:string = `

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

  get fragmentShaderSimple() {
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


  get fragmentShader() {
    return this.fragmentShaderSimple;
  }

  static attributeNames: AttributeNames = ['a_position', 'a_color', 'a_instanceID'];
  static attributeSemantics: Array<VertexAttributeEnum> = [VertexAttribute.Position, VertexAttribute.Color0, VertexAttribute.Instance];
}
