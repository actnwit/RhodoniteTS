import type { Config } from '../foundation/core/Config';
import type { RenderBufferTargetEnum } from '../foundation/definitions/RenderBufferTarget';
import { Vector4 } from '../foundation/math/Vector4';
import { Logger } from '../foundation/misc/Logger';
import type { Index, Size } from '../types/CommonTypes';
import { WebGLExtension, type WebGLExtensionEnum } from './WebGLExtension';

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

/**
 * A wrapper class for WebGL context that provides enhanced functionality and state management.
 * This class handles WebGL state optimization, extension management, and provides convenience methods
 * for common WebGL operations while maintaining compatibility with both WebGL1 and WebGL2.
 */
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
  private __alignedMaxUniformBlockSize = INVALID_SIZE;
  private __maxVertexUniformBlocks = INVALID_SIZE;
  private __maxFragmentUniformBlocks = INVALID_SIZE;
  private __maxConventionUniformBlocks = INVALID_SIZE;
  private __uniformBufferOffsetAlignment = INVALID_SIZE;
  private __maxUniformBlockSize = INVALID_SIZE;
  private __maxVertexUniformVectors = INVALID_SIZE;
  private __maxFragmentUniformVectors = INVALID_SIZE;
  private __maxTextureSize: Size = INVALID_SIZE;
  private readonly __is_multiview: boolean;
  _isWebXRMode = false;

  __extensions: Map<WebGLExtensionEnum, WebGLObject> = new Map();

  /**
   * Creates a new WebGLContextWrapper instance.
   * @param config - The configuration for the WebGL context
   * @param gl - The WebGL2 rendering context to wrap
   * @param canvas - The HTML canvas element associated with the context
   */
  constructor(config: Config, gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) {
    this.__gl = gl;
    this.width = canvas.width;
    this.height = canvas.height;
    this.canvas = canvas;
    this.__viewport_width = this.__default_viewport_width = this.width;
    this.__viewport_height = this.__default_viewport_height = this.height;

    this.__is_multiview = true;

    if (this.__gl.constructor.name === 'WebGL2RenderingContext') {
      this.__webglVersion = 2;
      this.webgl2ExtTFL = this.__getExtension(config, WebGLExtension.TextureFloatLinear);
      this.webgl2ExtTHFL = this.__getExtension(config, WebGLExtension.TextureHalfFloatLinear);
      this.webgl2ExtTFA = this.__getExtension(config, WebGLExtension.TextureFilterAnisotropic);
      this.webgl2ExtCBF = this.__getExtension(config, WebGLExtension.ColorBufferFloatWebGL2);
      this.webgl2ExtCBHF = this.__getExtension(config, WebGLExtension.ColorBufferHalfFloatWebGL2);
      this.webgl2ExtCTAstc = this.__getCompressedTextureExtension(config, WebGLExtension.CompressedTextureAstc);
      this.webgl2ExtCTS3tc = this.__getCompressedTextureExtension(config, WebGLExtension.CompressedTextureS3tc);
      this.webgl2ExtCTPvrtc = this.__getCompressedTextureExtension(config, WebGLExtension.CompressedTexturePvrtc);
      this.webgl2ExtCTAtc = this.__getCompressedTextureExtension(config, WebGLExtension.CompressedTextureAtc);
      this.webgl2ExtCTEtc = this.__getCompressedTextureExtension(config, WebGLExtension.CompressedTextureEtc);
      this.webgl2ExtCTEtc1 = this.__getCompressedTextureExtension(config, WebGLExtension.CompressedTextureEtc1);
      this.webgl2ExtCTBptc = this.__getCompressedTextureExtension(config, WebGLExtension.CompressedTextureBptc);
      this.webgl2ExtMLTVIEW = this.__getExtension(config, WebGLExtension.OculusMultiview);
      if (this.webgl2ExtMLTVIEW) {
        this.webgl2ExtMLTVIEW.is_multisample = true;
      } else {
        this.webgl2ExtMLTVIEW = this.__getExtension(config, WebGLExtension.OvrMultiview2);
        if (this.webgl2ExtMLTVIEW) {
          this.webgl2ExtMLTVIEW.is_multisample = false;
        } else {
          if (config.cgApiDebugConsoleOutput) {
            Logger.default.info('OCULUS_multiview and OVR_multiview2 extensions are not supported');
          }
          this.__is_multiview = false;
        }
      }
      this.webgl2ExtClipCtrl = this.__getExtension(config, WebGLExtension.ClipControl);
      if (config.cgApiDebugConsoleOutput) {
        this.webgl2ExtGmanWM = this.__getExtension(config, WebGLExtension.GMAN_WEBGL_MEMORY);
      }
    }
    this.__getUniformBufferInfo();
    this.__getMaxUniformVectors();
    this.__getMaxTextureSize();
  }

  /**
   * Gets the raw WebGL rendering context.
   * @returns The underlying WebGL context (WebGL1 or WebGL2)
   */
  getRawContext(): WebGLRenderingContext | WebGL2RenderingContext {
    return this.__gl;
  }

  /**
   * Gets the raw WebGL context cast as WebGL1.
   * @returns The underlying WebGL context as WebGL1 type
   */
  getRawContextAsWebGL1(): WebGLRenderingContext {
    return this.__gl as WebGLRenderingContext;
  }

  /**
   * Gets the raw WebGL context cast as WebGL2.
   * @returns The underlying WebGL context as WebGL2 type
   */
  getRawContextAsWebGL2(): WebGL2RenderingContext {
    return this.__gl as WebGL2RenderingContext;
  }

  /**
   * Gets the current viewport settings.
   * @returns A Vector4 containing viewport left, top, width, and height
   */
  get viewport() {
    return Vector4.fromCopyArray([
      this.__viewport_left,
      this.__viewport_top,
      this.__viewport_width,
      this.__viewport_height,
    ]);
  }

  /**
   * Gets the default viewport settings.
   * @returns A Vector4 containing default viewport left, top, width, and height
   */
  get defaultViewport() {
    return Vector4.fromCopyArray([
      this.__default_viewport_left,
      this.__default_viewport_top,
      this.__default_viewport_width,
      this.__default_viewport_height,
    ]);
  }

  /**
   * Checks if a WebGL1 extension is supported.
   * @param webGLExtension - The WebGL extension to check
   * @returns True if the extension is supported, false otherwise
   */
  isSupportWebGL1Extension(config: Config, webGLExtension: WebGLExtensionEnum) {
    if (this.__getExtension(config, webGLExtension)) {
      return true;
    }
    return false;
  }

  /**
   * Checks if a WebGL1 extension is not supported.
   * @param webGLExtension - The WebGL extension to check
   * @returns True if the extension is not supported, false otherwise
   */
  isNotSupportWebGL1Extension(config: Config, webGLExtension: WebGLExtensionEnum) {
    return !this.isSupportWebGL1Extension(config, webGLExtension);
  }

  /**
   * Type guard to check if the context is WebGL2.
   * @param gl - The WebGL context to check
   * @returns True if the context is WebGL2, false otherwise
   */
  getIsWebGL2(gl: WebGLRenderingContext | WebGL2RenderingContext): gl is WebGL2RenderingContext {
    return this.isWebGL2;
  }

  /**
   * Checks if the current context is WebGL2.
   * @returns True if WebGL2, false if WebGL1
   */
  get isWebGL2() {
    if (this.__webglVersion === 2) {
      return true;
    }
    return false;
  }

  /**
   * Creates a new vertex array object.
   * @returns A new WebGL vertex array object
   */
  createVertexArray() {
    return this.__gl.createVertexArray();
  }

  /**
   * Deletes a vertex array object.
   * @param vertexArray - The vertex array object to delete
   */
  deleteVertexArray(vertexArray: WebGLVertexArrayObject | WebGLVertexArrayObjectOES) {
    this.__gl.deleteVertexArray(vertexArray);
  }

  /**
   * Binds a vertex array object.
   * @param vao - The vertex array object to bind, or null to unbind
   */
  bindVertexArray(vao: WebGLVertexArrayObjectOES | null) {
    this.__gl.bindVertexArray(vao);
  }

  /**
   * Sets the divisor for instanced rendering for a vertex attribute.
   * @param index - The index of the vertex attribute
   * @param divisor - The divisor value (0 for per-vertex, 1+ for per-instance)
   */
  vertexAttribDivisor(index: number, divisor: number) {
    this.__gl.vertexAttribDivisor(index, divisor);
  }

  /**
   * Draws elements with instancing support.
   * @param primitiveMode - The primitive mode (GL_TRIANGLES, etc.)
   * @param indexCount - The number of indices to draw
   * @param type - The type of the index values
   * @param offset - The offset in the index buffer
   * @param instanceCount - The number of instances to draw
   */
  drawElementsInstanced(
    primitiveMode: number,
    indexCount: number,
    type: number,
    offset: number,
    instanceCount: number
  ) {
    this.__gl.drawElementsInstanced(primitiveMode, indexCount, type, offset, instanceCount);
  }

  /**
   * Draws arrays with instancing support.
   * @param primitiveMode - The primitive mode (GL_TRIANGLES, etc.)
   * @param first - The starting index in the enabled arrays
   * @param count - The number of vertices to draw
   * @param instanceCount - The number of instances to draw
   */
  drawArraysInstanced(primitiveMode: number, first: number, count: number, instanceCount: number) {
    this.__gl.drawArraysInstanced(primitiveMode, first, count, instanceCount);
  }

  /**
   * Gets the color attachment constant for a given index.
   * @param index - The attachment index
   * @returns The WebGL color attachment constant
   */
  colorAttachment(index: Index) {
    return 0x8ce0 + index; // GL_COLOR_ATTACHMENT0 = 0x8ce0
  }

  /**
   * Sets the draw buffers for multiple render targets.
   * @param buffers - Array of render buffer targets to draw to
   */
  drawBuffers(buffers: RenderBufferTargetEnum[]) {
    const gl = this.__gl as WebGL2RenderingContext;
    if (buffers.length === 0) {
      gl.drawBuffers([gl.NONE]);
      return;
    }
    const buffer = buffers[0].webGLConstantValue();
    gl.drawBuffers(
      buffers.map(buf => {
        return buf.webGLConstantValue();
      })
    );

    if (buffer === gl.NONE || buffers.length === 0) {
      gl.colorMask(false, false, false, false);
    } else {
      gl.colorMask(true, true, true, true);
    }
  }

  /**
   * Activates a texture unit for subsequent texture operations.
   * Optimized to avoid redundant state changes.
   * @param activeTextureIndex - The texture unit index to activate
   */
  private __activeTexture(activeTextureIndex: number) {
    if (this.__activeTextureBackup === activeTextureIndex) {
      return;
    }
    this.__gl.activeTexture(this.__gl.TEXTURE0 + activeTextureIndex);
    this.__activeTextureBackup = activeTextureIndex;
  }

  /**
   * Binds a 2D texture to a specific texture unit.
   * Optimized to avoid redundant state changes.
   * @param activeTextureIndex - The texture unit index
   * @param texture - The 2D texture to bind
   */
  bindTexture2D(activeTextureIndex: Index, texture: WebGLTexture) {
    const tex = this.__boundTextures.get(activeTextureIndex);
    if (tex !== texture) {
      this.__activeTexture(activeTextureIndex);
      this.__gl.bindTexture(this.__gl.TEXTURE_2D, texture);
      this.__boundTextures.set(activeTextureIndex, texture);
    }

    this.__activeTextures2D[activeTextureIndex] = texture;
  }

  /**
   * Binds a 2D array texture to a specific texture unit.
   * Optimized to avoid redundant state changes.
   * @param activeTextureIndex - The texture unit index
   * @param texture - The 2D array texture to bind
   */
  bindTexture2DArray(activeTextureIndex: Index, texture: WebGLTexture) {
    const tex = this.__boundTextures.get(activeTextureIndex);
    if (tex !== texture) {
      this.__activeTexture(activeTextureIndex);
      this.__gl.bindTexture(this.__gl.TEXTURE_2D_ARRAY, texture);
      this.__boundTextures.set(activeTextureIndex, texture);
    }

    this.__activeTextures2DArray[activeTextureIndex] = texture;
  }

  /**
   * Binds a sampler object to a specific texture unit.
   * Optimized to avoid redundant state changes.
   * @param activeTextureIndex - The texture unit index
   * @param sampler - The sampler object to bind
   */
  bindTextureSampler(activeTextureIndex: Index, sampler: WebGLSampler) {
    const samp = this.__boundSamplers.get(activeTextureIndex);
    if (samp !== sampler) {
      this.__gl.bindSampler(activeTextureIndex, sampler);
      this.__boundSamplers.set(activeTextureIndex, sampler);
    }
  }

  /**
   * Binds a cube map texture to a specific texture unit.
   * Optimized to avoid redundant state changes.
   * @param activeTextureIndex - The texture unit index
   * @param texture - The cube map texture to bind
   */
  bindTextureCube(activeTextureIndex: Index, texture: WebGLTexture) {
    const tex = this.__boundTextures.get(activeTextureIndex);
    if (tex !== texture) {
      this.__activeTexture(activeTextureIndex);
      this.__gl.bindTexture(this.__gl.TEXTURE_CUBE_MAP, texture);
      this.__boundTextures.set(activeTextureIndex, texture);
    }

    this.__activeTexturesCube[activeTextureIndex] = texture;
  }

  /**
   * Unbinds a 2D texture from a specific texture unit.
   * @param activeTextureIndex - The texture unit index
   */
  unbindTexture2D(activeTextureIndex: Index) {
    this.__activeTexture(activeTextureIndex);
    this.__gl.bindTexture(this.__gl.TEXTURE_2D, null);
    this.__boundTextures.delete(activeTextureIndex);
    delete this.__activeTextures2D[activeTextureIndex];
  }

  /**
   * Unbinds a 2D array texture from a specific texture unit.
   * @param activeTextureIndex - The texture unit index
   */
  unbindTexture2DArray(activeTextureIndex: Index) {
    this.__activeTexture(activeTextureIndex);
    this.__gl.bindTexture(this.__gl.TEXTURE_2D_ARRAY, null);
    this.__boundTextures.delete(activeTextureIndex);
    delete this.__activeTextures2DArray[activeTextureIndex];
  }

  /**
   * Unbinds a cube map texture from a specific texture unit.
   * @param activeTextureIndex - The texture unit index
   */
  unbindTextureCube(activeTextureIndex: Index) {
    this.__activeTexture(activeTextureIndex);
    this.__gl.bindTexture(this.__gl.TEXTURE_CUBE_MAP, null);
    this.__boundTextures.delete(activeTextureIndex);
    delete this.__activeTexturesCube[activeTextureIndex];
  }

  /**
   * Unbinds all currently bound textures from all texture units.
   * This is useful for cleanup operations.
   */
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

  /**
   * Gets a WebGL extension and caches it for future use.
   * @param config - The configuration for the WebGL context
   * @param extension - The extension to retrieve
   * @returns The extension object or null if not available
   */
  private __getExtension(config: Config, extension: WebGLExtensionEnum) {
    const gl: any = this.__gl;

    if (!this.__extensions.has(extension)) {
      const extObj = gl.getExtension(extension.toString());
      if (extObj == null && config.cgApiDebugConsoleOutput) {
        const text = `${extension.toString()} Not Available in this environment`;
        Logger.default.info(text);
      }
      this.__extensions.set(extension, extObj);
      return extObj;
    }
    return this.__extensions.get(extension);
  }

  /**
   * Gets a compressed texture extension with vendor prefix support.
   * @param extension - The compressed texture extension to retrieve
   * @returns The extension object or null if not available
   */
  private __getCompressedTextureExtension(config: Config, extension: WebGLExtensionEnum) {
    const gl = this.__gl as WebGLRenderingContext | WebGL2RenderingContext;

    if (!this.__extensions.has(extension)) {
      const extensionName = extension.toString();
      const extObj =
        gl.getExtension(extensionName) ??
        gl.getExtension(`MOZ_${extensionName}`) ??
        gl.getExtension(`WEBKIT_${extensionName}`);

      if (extObj == null && config.cgApiDebugConsoleOutput) {
        const text = `${extension.toString()} Not Available in this environment`;
        Logger.default.info(text);
      } else {
        this.__extensions.set(extension, extObj);
      }
      return extObj;
    }
    return this.__extensions.get(extension);
  }

  /**
   * Sets the viewport with optimization to avoid redundant state changes.
   * @param left - Left coordinate of the viewport
   * @param top - Top coordinate of the viewport
   * @param width - Width of the viewport
   * @param height - Height of the viewport
   */
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

  /**
   * Sets the viewport using a Vector4 with optimization to avoid redundant state changes.
   * @param viewport - Vector4 containing left, top, width, and height
   */
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

  /**
   * Retrieves and caches uniform buffer information for WebGL2.
   * This includes alignment requirements and size limits.
   */
  private __getUniformBufferInfo() {
    if (!this.isWebGL2) {
      return;
    }

    const gl: any = this.__gl;
    const offsetAlignment = gl.getParameter(gl.UNIFORM_BUFFER_OFFSET_ALIGNMENT) as number;
    const maxBlockSize = gl.getParameter(gl.MAX_UNIFORM_BLOCK_SIZE) as number;
    this.__maxVertexUniformBlocks = gl.getParameter(gl.MAX_VERTEX_UNIFORM_BLOCKS) as number;
    this.__maxFragmentUniformBlocks = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_BLOCKS) as number;
    this.__maxConventionUniformBlocks = Math.min(this.__maxVertexUniformBlocks, this.__maxFragmentUniformBlocks);
    this.__alignedMaxUniformBlockSize = maxBlockSize - (maxBlockSize % offsetAlignment);
    this.__uniformBufferOffsetAlignment = offsetAlignment;
    this.__maxUniformBlockSize = maxBlockSize;
  }

  /**
   * Retrieves and caches the maximum number of uniform vectors for vertex and fragment shaders.
   */
  private __getMaxUniformVectors() {
    const gl = this.getRawContext();
    this.__maxVertexUniformVectors = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) as number;
    this.__maxVertexUniformVectors = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) as number;
  }

  /**
   * Retrieves and caches the maximum texture size.
   */
  private __getMaxTextureSize() {
    const gl = this.getRawContext();
    this.__maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  }

  /**
   * Gets the maximum texture size.
   * @returns The maximum texture size
   */
  getMaxTextureSize() {
    return this.__maxTextureSize;
  }

  /**
   * Gets the maximum number of uniform blocks that can be used in both vertex and fragment shaders.
   * @returns The minimum of vertex and fragment shader uniform block limits
   */
  getMaxConventionUniformBlocks() {
    return this.__maxConventionUniformBlocks;
  }

  /**
   * Gets the maximum uniform block size aligned to the required offset alignment.
   * @returns The aligned maximum uniform block size in bytes
   */
  getAlignedMaxUniformBlockSize() {
    return this.__alignedMaxUniformBlockSize;
  }

  /**
   * Gets the maximum number of uniform vectors available in vertex shaders.
   * @returns The maximum vertex uniform vectors
   */
  getMaxVertexUniformVectors() {
    return this.__maxVertexUniformVectors;
  }

  /**
   * Gets the maximum number of uniform vectors available in fragment shaders.
   * @returns The maximum fragment uniform vectors
   */
  getMaxFragmentUniformVectors() {
    return this.__maxFragmentUniformVectors;
  }

  /**
   * Gets WebGL memory usage information if the GMAN_WEBGL_MEMORY extension is available.
   * @returns Memory information object or undefined if extension is not available
   */
  getWebGLMemoryInfo() {
    if (this.webgl2ExtGmanWM) {
      const result = this.webgl2ExtGmanWM.getMemoryInfo();
      return result;
    }

    return undefined;
  }

  /**
   * Checks if multiview rendering is supported and enabled.
   * @returns True if multiview is available and enabled for WebVR
   */
  isMultiview(config: Config) {
    return this.__is_multiview && config.multiViewForWebVR;
  }
}
