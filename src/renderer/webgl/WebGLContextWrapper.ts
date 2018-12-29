import { WebGLExtensionEnum, WebGLExtension } from "../../definitions/WebGLExtension";

export default class WebGLContextWrapper {
  __gl: WebGLRenderingContext|any;
  __webglVersion: number = 1;
  __webgl1ExtVAO?: WebGLObject|any;
  __webgl1ExtIA?: WebGLObject|any;
  __webgl1ExtTF?: WebGLObject|any;
  __webgl1ExtTHF?: WebGLObject|any;
  __webgl1ExtTFL?: WebGLObject|any;
  __webgl1ExtTHFL?: WebGLObject|any;
  __extensions: Map<WebGLExtensionEnum, WebGLObject> = new Map();

  constructor(gl: WebGLRenderingContext) {
    this.__gl = gl;

    if (this.__gl.constructor.name === 'WebGL2RenderingContext') {
      this.__webglVersion = 2;
    } else {
      this.__webgl1ExtVAO = this.__getExtension(WebGLExtension.VertexArrayObject);
      this.__webgl1ExtIA = this.__getExtension(WebGLExtension.InstancedArrays);
      this.__webgl1ExtTF = this.__getExtension(WebGLExtension.TextureFloat);
      this.__webgl1ExtTHF = this.__getExtension(WebGLExtension.TextureHalfFloat);
      this.__webgl1ExtTFL = this.__getExtension(WebGLExtension.TextureFloatLinear);
      this.__webgl1ExtTHFL = this.__getExtension(WebGLExtension.TextureHalfFloatLinear)
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
      if (this.__webgl1ExtVAO != null) {
        return this.__webgl1ExtVAO.createVertexArrayOES();
      }
    }
  }

  bindVertexArray(vao: WebGLObject|null) {
    if (this.isWebGL2) {
      this.__gl.bindVertexArray(vao);
    } else {
      if (this.__webgl1ExtVAO != null) {
        this.__webgl1ExtVAO.bindVertexArrayOES(vao);
      }
    }
  }

  vertexAttribDivisor(index: number, divisor: number) {
    if (this.isWebGL2) {
      this.__gl.vertexAttribDivisor(index, divisor);
    } else {
      this.__webgl1ExtIA!.vertexAttribDivisorANGLE(index, divisor);
    }
  }

  drawElementsInstanced(primitiveMode: number, indexCount: number, type: number, offset: number, instanceCount: number) {
    if (this.isWebGL2) {
      this.__gl.drawElementsInstanced(primitiveMode, indexCount, type, offset, instanceCount);
    } else {
      this.__webgl1ExtIA!.drawElementsInstancedANGLE(primitiveMode, indexCount, type, offset, instanceCount);
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
