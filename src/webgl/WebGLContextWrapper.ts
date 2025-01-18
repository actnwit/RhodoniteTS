import { WebGLExtensionEnum, WebGLExtension } from './WebGLExtension';
import { RenderBufferTargetEnum } from '../foundation/definitions/RenderBufferTarget';
import { Index, Size } from '../types/CommonTypes';
import { Vector4 } from '../foundation/math/Vector4';
import { Config } from '../foundation/core/Config';
import { Logger } from '../foundation/misc/Logger';

const INVALID_SIZE = -1;

interface WEBGL_compressed_texture_etc {
  readonly COMPRESSED_RGBA8_ETC2_EAC: number;
}
interface WEBGL_compressed_texture_bptc {
  readonly COMPRESSED_RGBA_BPTC_UNORM_EXT: number;
}

interface WEBGL_multiview {
  framebufferTextureMultiviewOVR(
    target: number,
    attachment: number,
    texture: WebGLTexture,
    level: number,
    baseViewIndex: number,
    numViews: number
  ): void;
  framebufferTextureMultisampleMultiviewOVR(
    target: number,
    attachment: number,
    texture: WebGLTexture,
    level: number,
    samples: number,
    baseViewIndex: number,
    numViews: number
  ): void;
  is_multisample: boolean;
}

export class WebGLContextWrapper {
  __gl: WebGL2RenderingContext;
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
  public readonly webgl2ExtTHFL?: OES_texture_half_float_linear;
  public readonly webgl2ExtTFA?: EXT_texture_filter_anisotropic;
  public readonly webgl2ExtCBF?: EXT_color_buffer_float;
  public readonly webgl2ExtCBHF?: EXT_color_buffer_half_float;
  public readonly webgl2ExtCTAstc?: WEBGL_compressed_texture_astc;
  public readonly webgl2ExtCTS3tc?: WEBGL_compressed_texture_s3tc;
  public readonly webgl2ExtCTPvrtc?: WEBKIT_WEBGL_compressed_texture_pvrtc;
  public readonly webgl2ExtCTAtc?: WEBGL_compressed_texture_atc;
  public readonly webgl2ExtCTEtc?: WEBGL_compressed_texture_etc;
  public readonly webgl2ExtCTEtc1?: WEBGL_compressed_texture_etc1;
  public readonly webgl2ExtCTBptc?: WEBGL_compressed_texture_bptc;
  public readonly webgl2ExtMLTVIEW?: WEBGL_multiview;
  public readonly webgl2ExtClipCtrl?: any;
  public readonly webgl2ExtGmanWM?: any;

  private __activeTextureBackup: Index = -1;
  private __activeTextures2D: WebGLTexture[] = [];
  private __activeTextures2DArray: WebGLTexture[] = [];
  private __activeTexturesCube: WebGLTexture[] = [];
  private __boundTextures: Map<Index, WebGLTexture> = new Map();
  private __boundSamplers: Map<Index, WebGLSampler> = new Map();
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
  private readonly __is_multiview: boolean;
  _isWebXRMode = false;

  __extensions: Map<WebGLExtensionEnum, WebGLObject> = new Map();

  constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) {
    this.__gl = gl;
    this.width = canvas.width;
    this.height = canvas.height;
    this.canvas = canvas;
    this.__viewport_width = this.__default_viewport_width = this.width;
    this.__viewport_height = this.__default_viewport_height = this.height;

    this.__is_multiview = true;

    if (this.__gl.constructor.name === 'WebGL2RenderingContext') {
      this.__webglVersion = 2;
      this.webgl2ExtTFL = this.__getExtension(WebGLExtension.TextureFloatLinear);
      this.webgl2ExtTHFL = this.__getExtension(WebGLExtension.TextureHalfFloatLinear);
      this.webgl2ExtTFA = this.__getExtension(WebGLExtension.TextureFilterAnisotropic);
      this.webgl2ExtCBF = this.__getExtension(WebGLExtension.ColorBufferFloatWebGL2);
      this.webgl2ExtCBHF = this.__getExtension(WebGLExtension.ColorBufferHalfFloatWebGL2);
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
      this.webgl2ExtMLTVIEW = this.__getExtension(WebGLExtension.OculusMultiview);
      if (this.webgl2ExtMLTVIEW) {
        this.webgl2ExtMLTVIEW.is_multisample = true;
      } else {
        this.webgl2ExtMLTVIEW = this.__getExtension(WebGLExtension.OvrMultiview2);
        if (this.webgl2ExtMLTVIEW) {
          this.webgl2ExtMLTVIEW.is_multisample = false;
        } else {
          if (Config.cgApiDebugConsoleOutput) {
            Logger.info('OCULUS_multiview and OVR_multiview2 extensions are not supported');
          }
          this.__is_multiview = false;
        }
      }
      this.webgl2ExtClipCtrl = this.__getExtension(WebGLExtension.ClipControl);
      this.webgl2ExtGmanWM = this.__getExtension(WebGLExtension.GMAN_WEBGL_MEMORY);
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
      this.__viewport_height,
    ]);
  }

  get defaultViewport() {
    return Vector4.fromCopyArray([
      this.__default_viewport_left,
      this.__default_viewport_top,
      this.__default_viewport_width,
      this.__default_viewport_height,
    ]);
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

  getIsWebGL2(gl: WebGLRenderingContext | WebGL2RenderingContext): gl is WebGL2RenderingContext {
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

  deleteVertexArray(vertexArray: WebGLVertexArrayObject | WebGLVertexArrayObjectOES) {
    if (this.getIsWebGL2(this.__gl)) {
      this.__gl.deleteVertexArray(vertexArray);
    } else {
      if (this.webgl1ExtVAO != null) {
        this.webgl1ExtVAO.deleteVertexArrayOES(vertexArray as WebGLVertexArrayObjectOES);
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
    this.__gl.drawElementsInstanced(primitiveMode, indexCount, type, offset, instanceCount);
  }

  drawArraysInstanced(primitiveMode: number, first: number, count: number, instanceCount: number) {
    this.__gl.drawArraysInstanced(primitiveMode, first, count, instanceCount);
  }

  colorAttachment(index: Index) {
    return 0x8ce0 + index; // GL_COLOR_ATTACHMENT0 = 0x8ce0
  }

  drawBuffers(buffers: RenderBufferTargetEnum[]) {
    const gl = this.__gl as WebGL2RenderingContext;
    if (buffers.length === 0) {
      gl.drawBuffers([gl.NONE]);
      return;
    }
    const buffer = buffers[0].webGLConstantValue();
    gl.drawBuffers(
      buffers.map((buf) => {
        return buf.webGLConstantValue();
      })
    );

    if (buffer === gl.NONE || buffers.length === 0) {
      gl.colorMask(false, false, false, false);
    } else {
      gl.colorMask(true, true, true, true);
    }
  }

  private __activeTexture(activeTextureIndex: number) {
    if (this.__activeTextureBackup === activeTextureIndex) {
      return;
    }
    this.__gl.activeTexture(this.__gl.TEXTURE0 + activeTextureIndex);
    this.__activeTextureBackup = activeTextureIndex;
  }

  bindTexture2D(activeTextureIndex: Index, texture: WebGLTexture) {
    const tex = this.__boundTextures.get(activeTextureIndex);
    if (tex !== texture) {
      this.__activeTexture(activeTextureIndex);
      this.__gl.bindTexture(this.__gl.TEXTURE_2D, texture);
      this.__boundTextures.set(activeTextureIndex, texture);
    }

    this.__activeTextures2D[activeTextureIndex] = texture;
  }

  bindTexture2DArray(activeTextureIndex: Index, texture: WebGLTexture) {
    const tex = this.__boundTextures.get(activeTextureIndex);
    if (tex !== texture) {
      this.__activeTexture(activeTextureIndex);
      this.__gl.bindTexture(this.__gl.TEXTURE_2D_ARRAY, texture);
      this.__boundTextures.set(activeTextureIndex, texture);
    }

    this.__activeTextures2DArray[activeTextureIndex] = texture;
  }

  bindTextureSampler(activeTextureIndex: Index, sampler: WebGLSampler) {
    // const samp = this.__boundSamplers.get(activeTextureIndex);
    // if (samp !== sampler) {
    this.__gl.bindSampler(activeTextureIndex, sampler);
    this.__boundSamplers.set(activeTextureIndex, sampler);
    // }
  }

  bindTextureCube(activeTextureIndex: Index, texture: WebGLTexture) {
    const tex = this.__boundTextures.get(activeTextureIndex);
    if (tex !== texture) {
      this.__activeTexture(activeTextureIndex);
      this.__gl.bindTexture(this.__gl.TEXTURE_CUBE_MAP, texture);
      this.__boundTextures.set(activeTextureIndex, texture);
    }

    this.__activeTexturesCube[activeTextureIndex] = texture;
  }

  unbindTexture2D(activeTextureIndex: Index) {
    this.__activeTexture(activeTextureIndex);
    this.__gl.bindTexture(this.__gl.TEXTURE_2D, null);
    this.__boundTextures.delete(activeTextureIndex);
    delete this.__activeTextures2D[activeTextureIndex];
  }

  unbindTexture2DArray(activeTextureIndex: Index) {
    this.__activeTexture(activeTextureIndex);
    this.__gl.bindTexture(this.__gl.TEXTURE_2D_ARRAY, null);
    this.__boundTextures.delete(activeTextureIndex);
    delete this.__activeTextures2DArray[activeTextureIndex];
  }

  unbindTextureCube(activeTextureIndex: Index) {
    this.__activeTexture(activeTextureIndex);
    this.__gl.bindTexture(this.__gl.TEXTURE_CUBE_MAP, null);
    this.__boundTextures.delete(activeTextureIndex);
    delete this.__activeTexturesCube[activeTextureIndex];
  }

  unbindTextures() {
    for (let i = 0; i < this.__activeTextures2D.length; i++) {
      if (this.__activeTextures2D[i] == null) {
        continue;
      }
      this.__activeTexture(15);
      this.__gl.bindTexture(this.__gl.TEXTURE_2D, null);
      delete this.__activeTextures2D[i];
    }

    for (let i = 0; i < this.__activeTextures2DArray.length; i++) {
      if (this.__activeTextures2DArray[i] == null) {
        continue;
      }
      this.__activeTexture(15);
      this.__gl.bindTexture(this.__gl.TEXTURE_2D_ARRAY, null);
      delete this.__activeTextures2DArray[i];
    }

    for (let i = 0; i < this.__activeTexturesCube.length; i++) {
      if (this.__activeTexturesCube[i] == null) {
        continue;
      }
      this.__activeTexture(15);
      this.__gl.bindTexture(this.__gl.TEXTURE_CUBE_MAP, null);
      delete this.__activeTexturesCube[i];
    }
  }

  private __getExtension(extension: WebGLExtensionEnum) {
    const gl: any = this.__gl;

    if (!this.__extensions.has(extension)) {
      const extObj = gl.getExtension(extension.toString());
      if (extObj == null && Config.cgApiDebugConsoleOutput) {
        const text = `${extension.toString()} Not Available in this environment`;
        Logger.info(text);
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

      if (extObj == null && Config.cgApiDebugConsoleOutput) {
        const text = `${extension.toString()} Not Available in this environment`;
        Logger.info(text);
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
    const offsetAlignment = gl.getParameter(gl.UNIFORM_BUFFER_OFFSET_ALIGNMENT) as number;
    const maxBlockSize = gl.getParameter(gl.MAX_UNIFORM_BLOCK_SIZE) as number;
    this.#maxVertexUniformBlocks = gl.getParameter(gl.MAX_VERTEX_UNIFORM_BLOCKS) as number;
    this.#maxFragmentUniformBlocks = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_BLOCKS) as number;
    this.#maxConventionUniformBlocks = Math.min(
      this.#maxVertexUniformBlocks,
      this.#maxFragmentUniformBlocks
    );
    this.#alignedMaxUniformBlockSize = maxBlockSize - (maxBlockSize % offsetAlignment);
    this.#uniformBufferOffsetAlignment = offsetAlignment;
    this.#maxUniformBlockSize = maxBlockSize;
  }

  private __getMaxUniformVectors() {
    const gl = this.getRawContext();
    this.__maxVertexUniformVectors = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) as number;
    this.__maxVertexUniformVectors = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) as number;
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

  getWebGLMemoryInfo() {
    if (this.webgl2ExtGmanWM) {
      const result = this.webgl2ExtGmanWM.getMemoryInfo();
      return result;
    }

    return undefined;
  }

  isMultiview() {
    return this.__is_multiview && Config.multiViewForWebVR;
  }
}
