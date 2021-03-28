import {WebGLExtensionEnum, WebGLExtension} from './WebGLExtension';
import {RenderBufferTargetEnum} from '../foundation/definitions/RenderBufferTarget';
import {Index, Size} from '../types/CommonTypes';
import Vector4 from '../foundation/math/Vector4';
import Config from '../foundation/core/Config';

const INVALID_SIZE = -1;

export default class WebGLContextWrapper {
  __gl: WebGLRenderingContext | any;
  __webglVersion = 1;
  public width: Size = 0;
  public height: Size = 0;
  public readonly canvas: HTMLCanvasElement;
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
  public readonly webgl1ExtDB?: WEBGL_draw_buffers;
  public readonly webgl1ExtBM?: EXT_blend_minmax;
  public readonly webgl1ExtCBF?: WEBGL_color_buffer_float;
  public readonly webgl1ExtCTASTC?: WEBGL_compressed_texture_astc;
  public readonly webgl1ExtCTS3TC?: WEBGL_compressed_texture_s3tc;
  public readonly webgl2ExtTFL?: OES_texture_float_linear;
  public readonly webgl2ExtTFA?: EXT_texture_filter_anisotropic;
  public readonly webgl2ExtCTAS?: WEBGL_compressed_texture_astc;
  public readonly webgl2ExtCTS3TC?: WEBGL_compressed_texture_s3tc;

  private __activeTextureBackup: Index = -1;
  private __activeTextures2D: WebGLTexture[] = [];
  private __activeTexturesCube: WebGLTexture[] = [];
  private __isDebugMode = false;
  private __viewport_left = 0;
  private __viewport_top = 0;
  private __viewport_width = 0;
  private __viewport_height = 0;
  private __default_viewport_left = 0;
  private __default_viewport_top = 0;
  private __default_viewport_width = 0;
  private __default_viewport_height = 0;
  #alignedMaxUniformBlockSize = INVALID_SIZE;
  #maxUniformBlockSize = INVALID_SIZE;
  #uniformBufferOffsetAlignment = INVALID_SIZE;
  #maxVertexUniformBlocks = INVALID_SIZE;
  #maxFragmentUniformBlocks = INVALID_SIZE;
  #maxConventionUniformBlocks = INVALID_SIZE;
  private __maxVertexUniformVectors = INVALID_SIZE;
  private __maxFragmentUniformVectors = INVALID_SIZE;

  __extensions: Map<WebGLExtensionEnum, WebGLObject> = new Map();

  constructor(
    gl: WebGLRenderingContext,
    canvas: HTMLCanvasElement,
    isDebug: boolean
  ) {
    this.__gl = gl;
    this.width = canvas.width;
    this.height = canvas.height;
    this.canvas = canvas;
    this.__viewport_width = this.__default_viewport_width = this.width;
    this.__viewport_height = this.__default_viewport_height = this.height;

    this.__isDebugMode = isDebug;

    if (this.__gl.constructor.name === 'WebGL2RenderingContext') {
      this.__webglVersion = 2;
      this.webgl2ExtTFL = this.__getExtension(
        WebGLExtension.TextureFloatLinear
      );
      this.webgl2ExtTFA = this.__getExtension(
        WebGLExtension.TextureFilterAnisotropic
      );
      this.webgl2ExtCTAS = this.__getExtension(
        WebGLExtension.CompressedTextureAstc
      );
      this.webgl2ExtCTS3TC =
        this.__getExtension(WebGLExtension.CompressedTextureS3tc) ||
        this.__getExtension(WebGLExtension.CompressedTextureS3tcMOZ) ||
        this.__getExtension(WebGLExtension.CompressedTextureS3tcWK);
    } else {
      this.webgl1ExtVAO = this.__getExtension(WebGLExtension.VertexArrayObject);
      this.webgl1ExtIA = this.__getExtension(WebGLExtension.InstancedArrays);
      this.webgl1ExtTF = this.__getExtension(WebGLExtension.TextureFloat);
      this.webgl1ExtTHF = this.__getExtension(WebGLExtension.TextureHalfFloat);
      this.webgl1ExtTFL = this.__getExtension(
        WebGLExtension.TextureFloatLinear
      );
      this.webgl1ExtTHFL = this.__getExtension(
        WebGLExtension.TextureHalfFloatLinear
      );
      this.webgl1ExtTFA = this.__getExtension(
        WebGLExtension.TextureFilterAnisotropic
      );
      this.webgl1ExtEIUI = this.__getExtension(WebGLExtension.ElementIndexUint);
      this.webgl1ExtSTL = this.__getExtension(WebGLExtension.ShaderTextureLod);
      this.webgl1ExtDRV = this.__getExtension(WebGLExtension.ShaderDerivatives);
      this.webgl1ExtDB = this.__getExtension(WebGLExtension.DrawBuffers);
      this.webgl1ExtBM = this.__getExtension(WebGLExtension.BlendMinmax);
      this.webgl1ExtCBF = this.__getExtension(WebGLExtension.ColorBufferFloat);
      this.webgl1ExtCTASTC = this.__getExtension(
        WebGLExtension.CompressedTextureAstc
      );
      this.webgl1ExtCTS3TC =
        this.__getExtension(WebGLExtension.CompressedTextureS3tc) ||
        this.__getExtension(WebGLExtension.CompressedTextureS3tcMOZ) ||
        this.__getExtension(WebGLExtension.CompressedTextureS3tcWK);
    }
    this.getUniformBufferInfo();
    this.getMaxUniformVectors();
  }

  getRawContext(): WebGLRenderingContext | WebGL2RenderingContext {
    return this.__gl;
  }

  getRawContextAsWebGL1(): WebGLRenderingContext {
    return this.__gl;
  }

  getRawContextAsWebGL2(): WebGL2RenderingContext {
    return this.__gl;
  }

  get viewport() {
    return new Vector4(
      this.__viewport_left,
      this.__viewport_top,
      this.__viewport_width,
      this.__viewport_height
    );
  }

  get defaultViewport() {
    return new Vector4(
      this.__default_viewport_left,
      this.__default_viewport_top,
      this.__default_viewport_width,
      this.__default_viewport_height
    );
  }

  isSupportWebGL1Extension(webGLExtension: WebGLExtensionEnum) {
    if (this.__getExtension(webGLExtension)) {
      return true;
    } else {
      return false;
    }
  }

  isNotSupportWebGL1Extension(webGLExtension: WebGLExtensionEnum) {
    return !this.isSupportWebGL1Extension(webGLExtension);
  }

  get isDebugMode() {
    return this.__isDebugMode;
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

  deleteVertexArray(
    vertexArray: WebGLVertexArrayObject | WebGLVertexArrayObjectOES
  ) {
    if (this.isWebGL2) {
      this.__gl.createVertexArray(vertexArray);
    } else {
      if (this.webgl1ExtVAO != null) {
        this.webgl1ExtVAO.deleteVertexArrayOES(
          vertexArray as WebGLVertexArrayObjectOES
        );
      }
    }
  }

  bindVertexArray(vao: WebGLVertexArrayObjectOES | null) {
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

  drawElementsInstanced(
    primitiveMode: number,
    indexCount: number,
    type: number,
    offset: number,
    instanceCount: number
  ) {
    if (this.isWebGL2) {
      this.__gl.drawElementsInstanced(
        primitiveMode,
        indexCount,
        type,
        offset,
        instanceCount
      );
    } else {
      this.webgl1ExtIA!.drawElementsInstancedANGLE(
        primitiveMode,
        indexCount,
        type,
        offset,
        instanceCount
      );
    }
  }

  drawArraysInstanced(
    primitiveMode: number,
    first: number,
    count: number,
    instanceCount: number
  ) {
    if (this.isWebGL2) {
      this.__gl.drawArraysInstanced(primitiveMode, first, count, instanceCount);
    } else {
      this.webgl1ExtIA!.drawArraysInstancedANGLE(
        primitiveMode,
        first,
        count,
        instanceCount
      );
    }
  }

  colorAttachment(index: Index) {
    return this.webgl1ExtDB
      ? (this.webgl1ExtDB as any)[`COLOR_ATTACHMENT${index}_WEBGL`]
      : (this.__gl as any)[`COLOR_ATTACHMENT${index}`];
  }

  drawBuffers(buffers: RenderBufferTargetEnum[]) {
    const gl: any = this.__gl;
    if (buffers.length === 0) {
      return;
    }
    let buffer = buffers;
    if (this.isWebGL2) {
      gl.drawBuffers(
        buffers.map(buf => {
          return gl[buf.str];
        })
      );
      buffer = gl[buffer[0].str];
    } else if (this.webgl1ExtDB) {
      this.webgl1ExtDB.drawBuffersWEBGL(
        buffers.map(buf => {
          return gl[buf.str];
        })
      );
      buffer = gl[buffer[0].str];
    }

    if (buffer === gl.NONE) {
      gl.colorMask(false, false, false, false);
    } else {
      gl.colorMask(true, true, true, true);
    }
  }

  private __activeTexture(activeTextureIndex: number) {
    if (this.__activeTextureBackup === activeTextureIndex) {
      return;
    }
    switch (activeTextureIndex) {
      case 0:
        this.__gl.activeTexture(this.__gl.TEXTURE0);
        break;
      case 1:
        this.__gl.activeTexture(this.__gl.TEXTURE1);
        break;
      case 2:
        this.__gl.activeTexture(this.__gl.TEXTURE2);
        break;
      case 3:
        this.__gl.activeTexture(this.__gl.TEXTURE3);
        break;
      case 4:
        this.__gl.activeTexture(this.__gl.TEXTURE4);
        break;
      case 5:
        this.__gl.activeTexture(this.__gl.TEXTURE5);
        break;
      case 6:
        this.__gl.activeTexture(this.__gl.TEXTURE6);
        break;
      case 7:
        this.__gl.activeTexture(this.__gl.TEXTURE7);
        break;
      case 8:
        this.__gl.activeTexture(this.__gl.TEXTURE8);
        break;
      case 9:
        this.__gl.activeTexture(this.__gl.TEXTURE9);
        break;
      case 10:
        this.__gl.activeTexture(this.__gl.TEXTURE10);
        break;
      case 11:
        this.__gl.activeTexture(this.__gl.TEXTURE11);
        break;
      case 12:
        this.__gl.activeTexture(this.__gl.TEXTURE12);
        break;
      case 13:
        this.__gl.activeTexture(this.__gl.TEXTURE13);
        break;
      case 14:
        this.__gl.activeTexture(this.__gl.TEXTURE14);
        break;
      case 15:
        this.__gl.activeTexture(this.__gl.TEXTURE15);
        break;
    }
    this.__activeTextureBackup = activeTextureIndex;
  }

  bindTexture2D(activeTextureIndex: Index, texture: WebGLTexture) {
    if (this.__isDebugMode) {
      if (texture) {
        if ((texture as any)._bound_as === 'CUBE_MAP') {
          debugger;
        }
        (texture as any)._bound_as = '2D';
      }
    }

    if (
      !Config.noWebGLTex2DStateCache &&
      this.__activeTextures2D[activeTextureIndex] === texture
    ) {
      return;
    }

    this.__activeTexture(activeTextureIndex);
    this.__gl.bindTexture(this.__gl.TEXTURE_2D, texture);

    this.__activeTextures2D[activeTextureIndex] = texture;
  }

  bindTextureCube(activeTextureIndex: Index, texture: WebGLTexture) {
    if (this.__isDebugMode) {
      if (texture) {
        if ((texture as any)._bound_as === '2D') {
          debugger;
        }
        (texture as any)._bound_as = 'CUBE_MAP';
      }
    }

    if (this.__activeTexturesCube[activeTextureIndex] === texture) {
      return;
    }

    this.__activeTexture(activeTextureIndex);
    this.__gl.bindTexture(this.__gl.TEXTURE_CUBE_MAP, texture);

    this.__activeTexturesCube[activeTextureIndex] = texture;
  }

  unbindTexture2D(activeTextureIndex: Index) {
    this.__activeTexture(activeTextureIndex);
    this.__gl.bindTexture(this.__gl.TEXTURE_2D, null);
    delete this.__activeTextures2D[activeTextureIndex];
  }

  unbindTextureCube(activeTextureIndex: Index) {
    this.__activeTexture(activeTextureIndex);
    this.__gl.bindTexture(this.__gl.TEXTURE_CUBE_MAP, null);
    delete this.__activeTexturesCube[activeTextureIndex];
  }

  unbindTextures() {
    for (let i = 0; i < this.__activeTextures2D.length; i++) {
      if (this.__activeTextures2D[i] == null) {
        continue;
      }
      this.__activeTexture(i);
      this.__gl.bindTexture(this.__gl.TEXTURE_2D, null);
      delete this.__activeTextures2D[i];
    }

    for (let i = 0; i < this.__activeTexturesCube.length; i++) {
      if (this.__activeTexturesCube[i] == null) {
        continue;
      }
      this.__activeTexture(i);
      this.__gl.bindTexture(this.__gl.TEXTURE_CUBE_MAP, null);
      delete this.__activeTexturesCube[i];
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

  setViewport(left: number, top: number, width: number, height: number): void {
    const gl: any = this.__gl;
    if (
      this.__viewport_width !== width ||
      this.__viewport_height !== height ||
      this.__viewport_left !== left ||
      this.__viewport_top !== top
    ) {
      gl.viewport(left, top, width, height);
      this.__viewport_left = left;
      this.__viewport_top = top;
      this.__viewport_width = width;
      this.__viewport_height = height;
    }
  }

  setViewportAsVector4(viewport: Vector4): void {
    const gl: any = this.__gl;
    if (
      this.__viewport_width !== viewport.z ||
      this.__viewport_height !== viewport.w ||
      this.__viewport_left !== viewport.x ||
      this.__viewport_top !== viewport.y
    ) {
      gl.viewport(viewport.x, viewport.y, viewport.z, viewport.w);
      this.__viewport_left = viewport.x;
      this.__viewport_top = viewport.y;
      this.__viewport_width = viewport.z;
      this.__viewport_height = viewport.w;
    }
  }

  private getUniformBufferInfo() {
    if (!this.isWebGL2) {
      return;
    }

    const gl: any = this.__gl;
    const offsetAlignment = gl.getParameter(
      gl.UNIFORM_BUFFER_OFFSET_ALIGNMENT
    ) as number;
    const maxBlockSize = gl.getParameter(gl.MAX_UNIFORM_BLOCK_SIZE) as number;
    this.#maxVertexUniformBlocks = gl.getParameter(
      gl.MAX_VERTEX_UNIFORM_BLOCKS
    ) as number;
    this.#maxFragmentUniformBlocks = gl.getParameter(
      gl.MAX_FRAGMENT_UNIFORM_BLOCKS
    ) as number;
    this.#maxConventionUniformBlocks = Math.min(
      this.#maxVertexUniformBlocks,
      this.#maxFragmentUniformBlocks
    );
    this.#alignedMaxUniformBlockSize =
      maxBlockSize - (maxBlockSize % offsetAlignment);
    this.#uniformBufferOffsetAlignment = offsetAlignment;
    this.#maxUniformBlockSize = maxBlockSize;
  }

  private getMaxUniformVectors() {
    const gl = this.getRawContext();
    this.__maxVertexUniformVectors = gl.getParameter(
      gl.MAX_VERTEX_UNIFORM_VECTORS
    ) as number;
    this.__maxVertexUniformVectors = gl.getParameter(
      gl.MAX_VERTEX_UNIFORM_VECTORS
    ) as number;
  }

  getMaxConventionUniformBlocks() {
    return this.#maxConventionUniformBlocks;
  }

  getAlignedMaxUniformBlockSize() {
    return this.#alignedMaxUniformBlockSize;
  }

  getMaxVertexUniformVectors() {
    return this.__maxVertexUniformVectors;
  }

  getMaxFragmentUniformVectors() {
    return this.__maxFragmentUniformVectors;
  }
}
