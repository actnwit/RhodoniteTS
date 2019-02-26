import { WebGLExtensionEnum, WebGLExtension } from "./WebGLExtension";
import { K } from "handlebars";

export default class WebGLContextWrapper {
  __gl: WebGLRenderingContext|any;
  __webglVersion: number = 1;
  public width: Size = 0;
  public height: Size = 0;
  public readonly webgl1ExtVAO?: OES_vertex_array_object;
  public readonly webgl1ExtIA?: ANGLE_instanced_arrays;
  public readonly webgl1ExtTF?: OES_texture_float;
  public readonly webgl1ExtTHF?: OES_texture_half_float;
  public readonly webgl1ExtTFL?: OES_texture_float_linear;
  public readonly webgl1ExtTHFL?: OES_texture_half_float_linear;
  public readonly webgl1ExtTFA?: EXT_texture_filter_anisotropic;
  public readonly webgl1ExtEIUI?: OES_element_index_uint;
  public readonly webgl1ExtSTL?: EXT_shader_texture_lod;
  public readonly webgl1ExtDRV?: OES_standard_derivatives;

  __extensions: Map<WebGLExtensionEnum, WebGLObject> = new Map();

  constructor(gl: WebGLRenderingContext, width: Size, height: Size) {
    this.__gl = gl;
    this.width = width;
    this.height = height;

    if (this.__gl.constructor.name === 'WebGL2RenderingContext') {
      this.__webglVersion = 2;
    } else {
      this.webgl1ExtVAO = this.__getExtension(WebGLExtension.VertexArrayObject);
      this.webgl1ExtIA = this.__getExtension(WebGLExtension.InstancedArrays);
      this.webgl1ExtTF = this.__getExtension(WebGLExtension.TextureFloat);
      this.webgl1ExtTHF = this.__getExtension(WebGLExtension.TextureHalfFloat);
      this.webgl1ExtTFL = this.__getExtension(WebGLExtension.TextureFloatLinear);
      this.webgl1ExtTHFL = this.__getExtension(WebGLExtension.TextureHalfFloatLinear);
      this.webgl1ExtTFA = this.__getExtension(WebGLExtension.TextureFilterAnisotropic);
      this.webgl1ExtEIUI = this.__getExtension(WebGLExtension.ElementIndexUint);
      this.webgl1ExtSTL = this.__getExtension(WebGLExtension.ShaderTextureLod);
      this.webgl1ExtDRV = this.__getExtension(WebGLExtension.ShaderDerivatives);
    }
  }

  getRawContext(): WebGLRenderingContext|any {
    return this.__gl;
  }

  isSupportWebGL1Extension(webGLExtension: WebGLExtensionEnum) {
    if (this.__getExtension(webGLExtension)) {
      return true;
    } else {
      return false;
    }
  }

  get isWebGL2() {
    if (this.__webglVersion === 2) {
      return true;
    } else {
      return false;
    }
  }

  createVertexArray() {
    if (this.isWebGL2) {
      return this.__gl.createVertexArray();
    } else {
      if (this.webgl1ExtVAO != null) {
        return this.webgl1ExtVAO.createVertexArrayOES();
      }
    }
  }

  bindVertexArray(vao: WebGLVertexArrayObjectOES|null) {
    if (this.isWebGL2) {
      this.__gl.bindVertexArray(vao);
    } else {
      if (this.webgl1ExtVAO != null) {
        this.webgl1ExtVAO.bindVertexArrayOES(vao);
      }
    }
  }

  vertexAttribDivisor(index: number, divisor: number) {
    if (this.isWebGL2) {
      this.__gl.vertexAttribDivisor(index, divisor);
    } else {
      this.webgl1ExtIA!.vertexAttribDivisorANGLE(index, divisor);
    }
  }

  drawElementsInstanced(primitiveMode: number, indexCount: number, type: number, offset: number, instanceCount: number) {
    if (this.isWebGL2) {
      this.__gl.drawElementsInstanced(primitiveMode, indexCount, type, offset, instanceCount);
    } else {
      this.webgl1ExtIA!.drawElementsInstancedANGLE(primitiveMode, indexCount, type, offset, instanceCount);
    }
  }

  private __getExtension(extension: WebGLExtensionEnum) {
    const gl: any = this.__gl;

    if (!this.__extensions.has(extension)) {
      const extObj = gl.getExtension(extension.toString());
      if (extObj == null) {
        const text = `The library does not support this environment because the ${extension.toString()} is not available`;
        if (console.error != null) {
          console.error(text);
        } else {
          console.log(text);
        }
      }
      this.__extensions.set(extension, extObj);
      return extObj;
    }
    return this.__extensions.get(extension);
  }
}
