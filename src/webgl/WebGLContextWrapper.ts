import {WebGLExtensionEnum, WebGLExtension} from './WebGLExtension';
import {RenderBufferTargetEnum} from '../foundation/definitions/RenderBufferTarget';
import {Index, Size} from '../types/CommonTypes';
import Vector4 from '../foundation/math/Vector4';
import Config from '../foundation/core/Config';

const INVALID_SIZE = -1;

interface WEBGL_compressed_texture_etc {
  readonly COMPRESSED_RGBA8_ETC2_EAC: number;
}
interface WEBGL_compressed_texture_bptc {
  readonly COMPRESSED_RGBA_BPTC_UNORM_EXT: number;
}

export default class WebGLContextWrapper {
  __gl: WebGLRenderingContext | WebGL2RenderingContext;
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
  public readonly webgl1ExtCTAstc?: WEBGL_compressed_texture_astc;
  public readonly webgl1ExtCTS3tc?: WEBGL_compressed_texture_s3tc;
  public readonly webgl1ExtCTPvrtc?: WEBKIT_WEBGL_compressed_texture_pvrtc;
  public readonly webgl1ExtCTAtc?: WEBGL_compressed_texture_atc;
  public readonly webgl1ExtCTEtc?: WEBGL_compressed_texture_etc;
  public readonly webgl1ExtCTEtc1?: WEBGL_compressed_texture_etc1;
  public readonly webgl1ExtCTBptc?: WEBGL_compressed_texture_bptc;

  public readonly webgl2ExtTFL?: OES_texture_float_linear;
  public readonly webgl2ExtTFA?: EXT_texture_filter_anisotropic;
  public readonly webgl2ExtCTAstc?: WEBGL_compressed_texture_astc;
  public readonly webgl2ExtCTS3tc?: WEBGL_compressed_texture_s3tc;
  public readonly webgl2ExtCTPvrtc?: WEBKIT_WEBGL_compressed_texture_pvrtc;
  public readonly webgl2ExtCTAtc?: WEBGL_compressed_texture_atc;
  public readonly webgl2ExtCTEtc?: WEBGL_compressed_texture_etc;
  public readonly webgl2ExtCTEtc1?: WEBGL_compressed_texture_etc1;
  public readonly webgl2ExtCTBptc?: WEBGL_compressed_texture_bptc;

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
    gl: WebGLRenderingContext | WebGL2RenderingContext,
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
      this.webgl2ExtCTAstc = this.__getCompressedTextureExtension(
        WebGLExtension.CompressedTextureAstc
      );
      this.webgl2ExtCTS3tc = this.__getCompressedTextureExtension(
        WebGLExtension.CompressedTextureS3tc
      );
      this.webgl2ExtCTPvrtc = this.__getCompressedTextureExtension(
        WebGLExtension.CompressedTexturePvrtc
      );
      this.webgl2ExtCTAtc = this.__getCompressedTextureExtension(
        WebGLExtension.CompressedTextureAtc
      );
      this.webgl2ExtCTEtc = this.__getCompressedTextureExtension(
        WebGLExtension.CompressedTextureEtc
      );
      this.webgl2ExtCTEtc1 = this.__getCompressedTextureExtension(
        WebGLExtension.CompressedTextureEtc1
      );
      this.webgl2ExtCTBptc = this.__getCompressedTextureExtension(
        WebGLExtension.CompressedTextureBptc
      );
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
      this.webgl1ExtCTAstc = this.__getCompressedTextureExtension(
        WebGLExtension.CompressedTextureAstc
      );
      this.webgl1ExtCTS3tc = this.__getCompressedTextureExtension(
        WebGLExtension.CompressedTextureS3tc
      );
      this.webgl1ExtCTPvrtc = this.__getCompressedTextureExtension(
        WebGLExtension.CompressedTexturePvrtc
      );
      this.webgl1ExtCTAtc = this.__getCompressedTextureExtension(
        WebGLExtension.CompressedTextureAtc
      );
      this.webgl1ExtCTEtc = this.__getCompressedTextureExtension(
        WebGLExtension.CompressedTextureEtc
      );
      this.webgl1ExtCTEtc1 = this.__getCompressedTextureExtension(
        WebGLExtension.CompressedTextureEtc1
      );
      this.webgl1ExtCTBptc = this.__getCompressedTextureExtension(
        WebGLExtension.CompressedTextureBptc
      );
    }
    this.__getUniformBufferInfo();
    this.__getMaxUniformVectors();
  }

  getRawContext(): WebGLRenderingContext | WebGL2RenderingContext {
    return this.__gl;
  }

  getRawContextAsWebGL1(): WebGLRenderingContext {
    return this.__gl as WebGLRenderingContext;
  }

  getRawContextAsWebGL2(): WebGL2RenderingContext {
    return this.__gl as WebGL2RenderingContext;
  }

  get viewport() {
    return Vector4.fromCopyArray([
      this.__viewport_left,
      this.__viewport_top,
      this.__viewport_width,
      this.__viewport_height]
    );
  }

  get defaultViewport() {
    return Vector4.fromCopyArray([
      this.__default_viewport_left,
      this.__default_viewport_top,
      this.__default_viewport_width,
      this.__default_viewport_height]
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

  getIsWebGL2(
    gl: WebGLRenderingContext | WebGL2RenderingContext
  ): gl is WebGL2RenderingContext {
    return this.isWebGL2;
  }

  get isWebGL2() {
    if (this.__webglVersion === 2) {
      return true;
    } else {
      return false;
    }
  }

  createVertexArray() {
    if (this.getIsWebGL2(this.__gl)) {
      return this.__gl.createVertexArray();
    } else {
      if (this.webgl1ExtVAO != null) {
        return this.webgl1ExtVAO.createVertexArrayOES();
      } else {
        return undefined;
      }
    }
  }

  deleteVertexArray(
    vertexArray: WebGLVertexArrayObject | WebGLVertexArrayObjectOES
  ) {
    if (this.getIsWebGL2(this.__gl)) {
      this.__gl.deleteVertexArray(vertexArray);
    } else {
      if (this.webgl1ExtVAO != null) {
        this.webgl1ExtVAO.deleteVertexArrayOES(
          vertexArray as WebGLVertexArrayObjectOES
        );
      }
    }
  }

  bindVertexArray(vao: WebGLVertexArrayObjectOES | null) {
    if (this.getIsWebGL2(this.__gl)) {
      this.__gl.bindVertexArray(vao);
    } else {
      if (this.webgl1ExtVAO != null) {
        this.webgl1ExtVAO.bindVertexArrayOES(vao);
      }
    }
  }

  vertexAttribDivisor(index: number, divisor: number) {
    if (this.getIsWebGL2(this.__gl)) {
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
    if (this.getIsWebGL2(this.__gl)) {
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
    if (this.getIsWebGL2(this.__gl)) {
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
    return 0x8ce0 + index; // GL_COLOR_ATTACHMENT0 = 0x8ce0
  }

  drawBuffers(buffers: RenderBufferTargetEnum[]) {
    const gl = this.__gl;
    if (buffers.length === 0) {
      return;
    }
    const buffer = buffers[0].webGLConstantValue();
    if (this.getIsWebGL2(gl)) {
      gl.drawBuffers(
        buffers.map(buf => {
          return buf.webGLConstantValue();
        })
      );
    } else if (this.webgl1ExtDB) {
      this.webgl1ExtDB.drawBuffersWEBGL(
        buffers.map(buf => {
          return buf.webGLConstantValue();
        })
      );
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
        console.warn(text);
      }
      this.__extensions.set(extension, extObj);
      return extObj;
    }
    return this.__extensions.get(extension);
  }

  private __getCompressedTextureExtension(extension: WebGLExtensionEnum) {
    const gl = this.__gl as WebGLRenderingContext | WebGL2RenderingContext;

    if (!this.__extensions.has(extension)) {
      const extensionName = extension.toString();
      const extObj =
        gl.getExtension(extensionName) ??
        gl.getExtension('MOZ_' + extensionName) ??
        gl.getExtension('WEBKIT_' + extensionName);

      if (extObj == null) {
        const text = `This environment does not support the ${extension.toString()}`;
        console.warn(text);
      } else {
        this.__extensions.set(extension, extObj);
      }
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

  private __getUniformBufferInfo() {
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

  private __getMaxUniformVectors() {
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
