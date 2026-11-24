// src/webgl/WebGLContextWrapper.ts
import { Vector4 } from "../foundation/math/Vector4.js";
import { Logger } from "../foundation/misc/Logger.js";
import { WebGLExtension } from "./WebGLExtension.js";
var INVALID_SIZE = -1;
var WebGLContextWrapper = class {
  /**
   * Creates a new WebGLContextWrapper instance.
   * @param config - The configuration for the WebGL context
   * @param gl - The WebGL2 rendering context to wrap
   * @param canvas - The HTML canvas element associated with the context
   */
  constructor(config, gl, canvas) {
    this.__webglVersion = 1;
    this.width = 0;
    this.height = 0;
    this.__activeTextureBackup = -1;
    this.__activeTextures2D = [];
    this.__activeTextures2DArray = [];
    this.__activeTexturesCube = [];
    this.__boundTextures = /* @__PURE__ */ new Map();
    this.__boundSamplers = /* @__PURE__ */ new Map();
    this.__viewport_left = 0;
    this.__viewport_top = 0;
    this.__viewport_width = 0;
    this.__viewport_height = 0;
    this.__default_viewport_left = 0;
    this.__default_viewport_top = 0;
    this.__default_viewport_width = 0;
    this.__default_viewport_height = 0;
    this.__alignedMaxUniformBlockSize = INVALID_SIZE;
    this.__maxVertexUniformBlocks = INVALID_SIZE;
    this.__maxFragmentUniformBlocks = INVALID_SIZE;
    this.__maxConventionUniformBlocks = INVALID_SIZE;
    this.__uniformBufferOffsetAlignment = INVALID_SIZE;
    this.__maxUniformBlockSize = INVALID_SIZE;
    this.__maxVertexUniformVectors = INVALID_SIZE;
    this.__maxFragmentUniformVectors = INVALID_SIZE;
    this.__maxTextureSize = INVALID_SIZE;
    this._isWebXRMode = false;
    /**
     * Cached results of getExtension / vendor-prefixed getExtension.
     * Values are WebGL extension API objects (distinct from WebGLResource: buffers, textures, programs, etc.).
     */
    this.__extensions = /* @__PURE__ */ new Map();
    this.__gl = gl;
    this.width = canvas.width;
    this.height = canvas.height;
    this.canvas = canvas;
    this.__viewport_width = this.__default_viewport_width = this.width;
    this.__viewport_height = this.__default_viewport_height = this.height;
    this.__is_multiview = true;
    if (this.__gl.constructor.name === "WebGL2RenderingContext") {
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
            Logger.default.info("OCULUS_multiview and OVR_multiview2 extensions are not supported");
          }
          this.__is_multiview = false;
        }
      }
      this.webgl2ExtClipCtrl = this.__getExtension(config, WebGLExtension.ClipControl);
      this.webgl2ExtMD = this.__getExtension(config, WebGLExtension.MultiDraw);
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
  getRawContext() {
    return this.__gl;
  }
  /**
   * Gets the raw WebGL context cast as WebGL1.
   * @returns The underlying WebGL context as WebGL1 type
   */
  getRawContextAsWebGL1() {
    return this.__gl;
  }
  /**
   * Gets the raw WebGL context cast as WebGL2.
   * @returns The underlying WebGL context as WebGL2 type
   */
  getRawContextAsWebGL2() {
    return this.__gl;
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
      this.__viewport_height
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
      this.__default_viewport_height
    ]);
  }
  /**
   * Checks if a WebGL1 extension is supported.
   * @param webGLExtension - The WebGL extension to check
   * @returns True if the extension is supported, false otherwise
   */
  isSupportWebGL1Extension(config, webGLExtension) {
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
  isNotSupportWebGL1Extension(config, webGLExtension) {
    return !this.isSupportWebGL1Extension(config, webGLExtension);
  }
  /**
   * Type guard to check if the context is WebGL2.
   * @param gl - The WebGL context to check
   * @returns True if the context is WebGL2, false otherwise
   */
  getIsWebGL2(gl) {
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
  deleteVertexArray(vertexArray) {
    this.__gl.deleteVertexArray(vertexArray);
  }
  /**
   * Binds a vertex array object.
   * @param vao - The vertex array object to bind, or null to unbind
   */
  bindVertexArray(vao) {
    this.__gl.bindVertexArray(vao);
  }
  /**
   * Sets the divisor for instanced rendering for a vertex attribute.
   * @param index - The index of the vertex attribute
   * @param divisor - The divisor value (0 for per-vertex, 1+ for per-instance)
   */
  vertexAttribDivisor(index, divisor) {
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
  drawElementsInstanced(primitiveMode, indexCount, type, offset, instanceCount) {
    this.__gl.drawElementsInstanced(primitiveMode, indexCount, type, offset, instanceCount);
  }
  /**
   * Draws arrays with instancing support.
   * @param primitiveMode - The primitive mode (GL_TRIANGLES, etc.)
   * @param first - The starting index in the enabled arrays
   * @param count - The number of vertices to draw
   * @param instanceCount - The number of instances to draw
   */
  drawArraysInstanced(primitiveMode, first, count, instanceCount) {
    this.__gl.drawArraysInstanced(primitiveMode, first, count, instanceCount);
  }
  /**
   * Issues multiple instanced indexed draws with one call when WEBGL_multi_draw is available.
   * Falls back to individual drawElementsInstanced calls otherwise.
   * The offsets are byte offsets into the currently bound element array buffer.
   */
  multiDrawElementsInstanced(primitiveMode, counts, countsOffset, type, offsets, offsetsOffset, instanceCounts, instanceCountsOffset, drawcount) {
    const ext = this.webgl2ExtMD;
    if (ext != null) {
      ext.multiDrawElementsInstancedWEBGL(
        primitiveMode,
        counts,
        countsOffset,
        type,
        offsets,
        offsetsOffset,
        instanceCounts,
        instanceCountsOffset,
        drawcount
      );
      return;
    }
    for (let i = 0; i < drawcount; i++) {
      this.__gl.drawElementsInstanced(
        primitiveMode,
        counts[countsOffset + i],
        type,
        offsets[offsetsOffset + i],
        instanceCounts[instanceCountsOffset + i]
      );
    }
  }
  /**
   * Issues multiple instanced non-indexed draws with one call when WEBGL_multi_draw is available.
   * Falls back to individual drawArraysInstanced calls otherwise.
   */
  multiDrawArraysInstanced(primitiveMode, firsts, firstsOffset, counts, countsOffset, instanceCounts, instanceCountsOffset, drawcount) {
    const ext = this.webgl2ExtMD;
    if (ext != null) {
      ext.multiDrawArraysInstancedWEBGL(
        primitiveMode,
        firsts,
        firstsOffset,
        counts,
        countsOffset,
        instanceCounts,
        instanceCountsOffset,
        drawcount
      );
      return;
    }
    for (let i = 0; i < drawcount; i++) {
      this.__gl.drawArraysInstanced(
        primitiveMode,
        firsts[firstsOffset + i],
        counts[countsOffset + i],
        instanceCounts[instanceCountsOffset + i]
      );
    }
  }
  /**
   * Gets the color attachment constant for a given index.
   * @param index - The attachment index
   * @returns The WebGL color attachment constant
   */
  colorAttachment(index) {
    return 36064 + index;
  }
  /**
   * Sets the draw buffers for multiple render targets.
   * @param buffers - Array of render buffer targets to draw to
   */
  drawBuffers(buffers) {
    const gl = this.__gl;
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
  /**
   * Activates a texture unit for subsequent texture operations.
   * Optimized to avoid redundant state changes.
   * @param activeTextureIndex - The texture unit index to activate
   */
  __activeTexture(activeTextureIndex) {
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
  bindTexture2D(activeTextureIndex, texture) {
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
  bindTexture2DArray(activeTextureIndex, texture) {
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
  bindTextureSampler(activeTextureIndex, sampler) {
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
  bindTextureCube(activeTextureIndex, texture) {
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
  unbindTexture2D(activeTextureIndex) {
    this.__activeTexture(activeTextureIndex);
    this.__gl.bindTexture(this.__gl.TEXTURE_2D, null);
    this.__boundTextures.delete(activeTextureIndex);
    delete this.__activeTextures2D[activeTextureIndex];
  }
  /**
   * Unbinds a 2D array texture from a specific texture unit.
   * @param activeTextureIndex - The texture unit index
   */
  unbindTexture2DArray(activeTextureIndex) {
    this.__activeTexture(activeTextureIndex);
    this.__gl.bindTexture(this.__gl.TEXTURE_2D_ARRAY, null);
    this.__boundTextures.delete(activeTextureIndex);
    delete this.__activeTextures2DArray[activeTextureIndex];
  }
  /**
   * Unbinds a cube map texture from a specific texture unit.
   * @param activeTextureIndex - The texture unit index
   */
  unbindTextureCube(activeTextureIndex) {
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
  __getExtension(config, extension) {
    const gl = this.__gl;
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
  __getCompressedTextureExtension(config, extension) {
    var _a, _b;
    const gl = this.__gl;
    if (!this.__extensions.has(extension)) {
      const extensionName = extension.toString();
      const extObj = (_b = (_a = gl.getExtension(extensionName)) != null ? _a : gl.getExtension(`MOZ_${extensionName}`)) != null ? _b : gl.getExtension(`WEBKIT_${extensionName}`);
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
  setViewport(left, top, width, height) {
    const gl = this.__gl;
    if (this.__viewport_width !== width || this.__viewport_height !== height || this.__viewport_left !== left || this.__viewport_top !== top) {
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
  setViewportAsVector4(viewport) {
    const gl = this.__gl;
    if (this.__viewport_width !== viewport.z || this.__viewport_height !== viewport.w || this.__viewport_left !== viewport.x || this.__viewport_top !== viewport.y) {
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
  __getUniformBufferInfo() {
    if (!this.isWebGL2) {
      return;
    }
    const gl = this.__gl;
    const offsetAlignment = gl.getParameter(gl.UNIFORM_BUFFER_OFFSET_ALIGNMENT);
    const maxBlockSize = gl.getParameter(gl.MAX_UNIFORM_BLOCK_SIZE);
    this.__maxVertexUniformBlocks = gl.getParameter(gl.MAX_VERTEX_UNIFORM_BLOCKS);
    this.__maxFragmentUniformBlocks = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_BLOCKS);
    this.__maxConventionUniformBlocks = Math.min(this.__maxVertexUniformBlocks, this.__maxFragmentUniformBlocks);
    this.__alignedMaxUniformBlockSize = maxBlockSize - maxBlockSize % offsetAlignment;
    this.__uniformBufferOffsetAlignment = offsetAlignment;
    this.__maxUniformBlockSize = maxBlockSize;
  }
  /**
   * Retrieves and caches the maximum number of uniform vectors for vertex and fragment shaders.
   */
  __getMaxUniformVectors() {
    const gl = this.getRawContext();
    this.__maxVertexUniformVectors = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
    this.__maxVertexUniformVectors = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
  }
  /**
   * Retrieves and caches the maximum texture size.
   */
  __getMaxTextureSize() {
    const gl = this.getRawContext();
    this.__maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
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
    return void 0;
  }
  /**
   * Checks if multiview rendering is supported and enabled.
   * @returns True if multiview is available and enabled for WebVR
   */
  isMultiview(config) {
    return this.__is_multiview && config.multiViewForWebVR;
  }
};
export {
  WebGLContextWrapper
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3JjL3dlYmdsL1dlYkdMQ29udGV4dFdyYXBwZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgQ29uZmlnIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb3JlL0NvbmZpZyc7XG5pbXBvcnQgdHlwZSB7IFJlbmRlckJ1ZmZlclRhcmdldEVudW0gfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1JlbmRlckJ1ZmZlclRhcmdldCc7XG5pbXBvcnQgeyBWZWN0b3I0IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9tYXRoL1ZlY3RvcjQnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9taXNjL0xvZ2dlcic7XG5pbXBvcnQgdHlwZSB7IEluZGV4LCBTaXplIH0gZnJvbSAnLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgV2ViR0xFeHRlbnNpb24sIHR5cGUgV2ViR0xFeHRlbnNpb25FbnVtIH0gZnJvbSAnLi9XZWJHTEV4dGVuc2lvbic7XG5cbmNvbnN0IElOVkFMSURfU0laRSA9IC0xO1xuXG5pbnRlcmZhY2UgV0VCR0xfY29tcHJlc3NlZF90ZXh0dXJlX2V0YyB7XG4gIHJlYWRvbmx5IENPTVBSRVNTRURfUkdCQThfRVRDMl9FQUM6IG51bWJlcjtcbn1cbmludGVyZmFjZSBXRUJHTF9jb21wcmVzc2VkX3RleHR1cmVfYnB0YyB7XG4gIHJlYWRvbmx5IENPTVBSRVNTRURfUkdCQV9CUFRDX1VOT1JNX0VYVDogbnVtYmVyO1xufVxuXG4vKiogUFZSVEMgKG9mdGVuIGV4cG9zZWQgdmlhIFdFQktJVF8gcHJlZml4KTsgbm90IGFsd2F5cyBwcmVzZW50IGluIFRTIERPTSBsaWJzICovXG5pbnRlcmZhY2UgV0VCS0lUX1dFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9wdnJ0YyB7XG4gIHJlYWRvbmx5IENPTVBSRVNTRURfUkdCX1BWUlRDXzRCUFBWMV9JTUc6IG51bWJlcjtcbiAgcmVhZG9ubHkgQ09NUFJFU1NFRF9SR0JfUFZSVENfMkJQUFYxX0lNRzogbnVtYmVyO1xuICByZWFkb25seSBDT01QUkVTU0VEX1JHQkFfUFZSVENfNEJQUFYxX0lNRzogbnVtYmVyO1xuICByZWFkb25seSBDT01QUkVTU0VEX1JHQkFfUFZSVENfMkJQUFYxX0lNRzogbnVtYmVyO1xufVxuXG4vKiogQVRDIGNvbXByZXNzaW9uIChtb2JpbGUpOyBub3QgYWx3YXlzIHByZXNlbnQgaW4gVFMgRE9NIGxpYnMgKi9cbmludGVyZmFjZSBXRUJHTF9jb21wcmVzc2VkX3RleHR1cmVfYXRjIHtcbiAgcmVhZG9ubHkgQ09NUFJFU1NFRF9SR0JfQVRDX1dFQkdMOiBudW1iZXI7XG4gIHJlYWRvbmx5IENPTVBSRVNTRURfUkdCQV9BVENfRVhQTElDSVRfQUxQSEFfV0VCR0w6IG51bWJlcjtcbiAgcmVhZG9ubHkgQ09NUFJFU1NFRF9SR0JBX0FUQ19JTlRFUlBPTEFURURfQUxQSEFfV0VCR0w6IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIFdFQkdMX211bHRpdmlldyB7XG4gIGZyYW1lYnVmZmVyVGV4dHVyZU11bHRpdmlld09WUihcbiAgICB0YXJnZXQ6IG51bWJlcixcbiAgICBhdHRhY2htZW50OiBudW1iZXIsXG4gICAgdGV4dHVyZTogV2ViR0xUZXh0dXJlLFxuICAgIGxldmVsOiBudW1iZXIsXG4gICAgYmFzZVZpZXdJbmRleDogbnVtYmVyLFxuICAgIG51bVZpZXdzOiBudW1iZXJcbiAgKTogdm9pZDtcbiAgZnJhbWVidWZmZXJUZXh0dXJlTXVsdGlzYW1wbGVNdWx0aXZpZXdPVlIoXG4gICAgdGFyZ2V0OiBudW1iZXIsXG4gICAgYXR0YWNobWVudDogbnVtYmVyLFxuICAgIHRleHR1cmU6IFdlYkdMVGV4dHVyZSxcbiAgICBsZXZlbDogbnVtYmVyLFxuICAgIHNhbXBsZXM6IG51bWJlcixcbiAgICBiYXNlVmlld0luZGV4OiBudW1iZXIsXG4gICAgbnVtVmlld3M6IG51bWJlclxuICApOiB2b2lkO1xuICBpc19tdWx0aXNhbXBsZTogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBBIHdyYXBwZXIgY2xhc3MgZm9yIFdlYkdMIGNvbnRleHQgdGhhdCBwcm92aWRlcyBlbmhhbmNlZCBmdW5jdGlvbmFsaXR5IGFuZCBzdGF0ZSBtYW5hZ2VtZW50LlxuICogVGhpcyBjbGFzcyBoYW5kbGVzIFdlYkdMIHN0YXRlIG9wdGltaXphdGlvbiwgZXh0ZW5zaW9uIG1hbmFnZW1lbnQsIGFuZCBwcm92aWRlcyBjb252ZW5pZW5jZSBtZXRob2RzXG4gKiBmb3IgY29tbW9uIFdlYkdMIG9wZXJhdGlvbnMgd2hpbGUgbWFpbnRhaW5pbmcgY29tcGF0aWJpbGl0eSB3aXRoIGJvdGggV2ViR0wxIGFuZCBXZWJHTDIuXG4gKi9cbmV4cG9ydCBjbGFzcyBXZWJHTENvbnRleHRXcmFwcGVyIHtcbiAgX19nbDogV2ViR0wyUmVuZGVyaW5nQ29udGV4dDtcbiAgX193ZWJnbFZlcnNpb24gPSAxO1xuICBwdWJsaWMgd2lkdGg6IFNpemUgPSAwO1xuICBwdWJsaWMgaGVpZ2h0OiBTaXplID0gMDtcbiAgcHVibGljIHJlYWRvbmx5IGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDFFeHRWQU8/OiBPRVNfdmVydGV4X2FycmF5X29iamVjdDtcbiAgcHVibGljIHJlYWRvbmx5IHdlYmdsMUV4dElBPzogQU5HTEVfaW5zdGFuY2VkX2FycmF5cztcbiAgcHVibGljIHJlYWRvbmx5IHdlYmdsMUV4dFRGPzogT0VTX3RleHR1cmVfZmxvYXQ7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDFFeHRUSEY/OiBPRVNfdGV4dHVyZV9oYWxmX2Zsb2F0O1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViZ2wxRXh0VEZMPzogT0VTX3RleHR1cmVfZmxvYXRfbGluZWFyO1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViZ2wxRXh0VEhGTD86IE9FU190ZXh0dXJlX2hhbGZfZmxvYXRfbGluZWFyO1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViZ2wxRXh0VEZBPzogRVhUX3RleHR1cmVfZmlsdGVyX2FuaXNvdHJvcGljO1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViZ2wxRXh0RUlVST86IE9FU19lbGVtZW50X2luZGV4X3VpbnQ7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDFFeHRTVEw/OiBFWFRfc2hhZGVyX3RleHR1cmVfbG9kO1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViZ2wxRXh0RFJWPzogT0VTX3N0YW5kYXJkX2Rlcml2YXRpdmVzO1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViZ2wxRXh0REI/OiBXRUJHTF9kcmF3X2J1ZmZlcnM7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDFFeHRCTT86IEVYVF9ibGVuZF9taW5tYXg7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDFFeHRDQkY/OiBXRUJHTF9jb2xvcl9idWZmZXJfZmxvYXQ7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDFFeHRDVEFzdGM/OiBXRUJHTF9jb21wcmVzc2VkX3RleHR1cmVfYXN0YztcbiAgcHVibGljIHJlYWRvbmx5IHdlYmdsMUV4dENUUzN0Yz86IFdFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9zM3RjO1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViZ2wxRXh0Q1RQdnJ0Yz86IFdFQktJVF9XRUJHTF9jb21wcmVzc2VkX3RleHR1cmVfcHZydGM7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDFFeHRDVEF0Yz86IFdFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9hdGM7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDFFeHRDVEV0Yz86IFdFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9ldGM7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDFFeHRDVEV0YzE/OiBXRUJHTF9jb21wcmVzc2VkX3RleHR1cmVfZXRjMTtcbiAgcHVibGljIHJlYWRvbmx5IHdlYmdsMUV4dENUQnB0Yz86IFdFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9icHRjO1xuXG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDJFeHRURkw/OiBPRVNfdGV4dHVyZV9mbG9hdF9saW5lYXI7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDJFeHRUSEZMPzogT0VTX3RleHR1cmVfaGFsZl9mbG9hdF9saW5lYXI7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDJFeHRURkE/OiBFWFRfdGV4dHVyZV9maWx0ZXJfYW5pc290cm9waWM7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDJFeHRDQkY/OiBFWFRfY29sb3JfYnVmZmVyX2Zsb2F0O1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViZ2wyRXh0Q0JIRj86IEVYVF9jb2xvcl9idWZmZXJfaGFsZl9mbG9hdDtcbiAgcHVibGljIHJlYWRvbmx5IHdlYmdsMkV4dENUQXN0Yz86IFdFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9hc3RjO1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViZ2wyRXh0Q1RTM3RjPzogV0VCR0xfY29tcHJlc3NlZF90ZXh0dXJlX3MzdGM7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDJFeHRDVFB2cnRjPzogV0VCS0lUX1dFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9wdnJ0YztcbiAgcHVibGljIHJlYWRvbmx5IHdlYmdsMkV4dENUQXRjPzogV0VCR0xfY29tcHJlc3NlZF90ZXh0dXJlX2F0YztcbiAgcHVibGljIHJlYWRvbmx5IHdlYmdsMkV4dENURXRjPzogV0VCR0xfY29tcHJlc3NlZF90ZXh0dXJlX2V0YztcbiAgcHVibGljIHJlYWRvbmx5IHdlYmdsMkV4dENURXRjMT86IFdFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9ldGMxO1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViZ2wyRXh0Q1RCcHRjPzogV0VCR0xfY29tcHJlc3NlZF90ZXh0dXJlX2JwdGM7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDJFeHRNTFRWSUVXPzogV0VCR0xfbXVsdGl2aWV3O1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViZ2wyRXh0Q2xpcEN0cmw/OiBhbnk7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDJFeHRHbWFuV00/OiBhbnk7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDJFeHRNRD86IFdFQkdMX211bHRpX2RyYXcgfCBudWxsO1xuXG4gIHByaXZhdGUgX19hY3RpdmVUZXh0dXJlQmFja3VwOiBJbmRleCA9IC0xO1xuICBwcml2YXRlIF9fYWN0aXZlVGV4dHVyZXMyRDogV2ViR0xUZXh0dXJlW10gPSBbXTtcbiAgcHJpdmF0ZSBfX2FjdGl2ZVRleHR1cmVzMkRBcnJheTogV2ViR0xUZXh0dXJlW10gPSBbXTtcbiAgcHJpdmF0ZSBfX2FjdGl2ZVRleHR1cmVzQ3ViZTogV2ViR0xUZXh0dXJlW10gPSBbXTtcbiAgcHJpdmF0ZSBfX2JvdW5kVGV4dHVyZXM6IE1hcDxJbmRleCwgV2ViR0xUZXh0dXJlPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfX2JvdW5kU2FtcGxlcnM6IE1hcDxJbmRleCwgV2ViR0xTYW1wbGVyPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfX3ZpZXdwb3J0X2xlZnQgPSAwO1xuICBwcml2YXRlIF9fdmlld3BvcnRfdG9wID0gMDtcbiAgcHJpdmF0ZSBfX3ZpZXdwb3J0X3dpZHRoID0gMDtcbiAgcHJpdmF0ZSBfX3ZpZXdwb3J0X2hlaWdodCA9IDA7XG4gIHByaXZhdGUgX19kZWZhdWx0X3ZpZXdwb3J0X2xlZnQgPSAwO1xuICBwcml2YXRlIF9fZGVmYXVsdF92aWV3cG9ydF90b3AgPSAwO1xuICBwcml2YXRlIF9fZGVmYXVsdF92aWV3cG9ydF93aWR0aCA9IDA7XG4gIHByaXZhdGUgX19kZWZhdWx0X3ZpZXdwb3J0X2hlaWdodCA9IDA7XG4gIHByaXZhdGUgX19hbGlnbmVkTWF4VW5pZm9ybUJsb2NrU2l6ZSA9IElOVkFMSURfU0laRTtcbiAgcHJpdmF0ZSBfX21heFZlcnRleFVuaWZvcm1CbG9ja3MgPSBJTlZBTElEX1NJWkU7XG4gIHByaXZhdGUgX19tYXhGcmFnbWVudFVuaWZvcm1CbG9ja3MgPSBJTlZBTElEX1NJWkU7XG4gIHByaXZhdGUgX19tYXhDb252ZW50aW9uVW5pZm9ybUJsb2NrcyA9IElOVkFMSURfU0laRTtcbiAgcHJpdmF0ZSBfX3VuaWZvcm1CdWZmZXJPZmZzZXRBbGlnbm1lbnQgPSBJTlZBTElEX1NJWkU7XG4gIHByaXZhdGUgX19tYXhVbmlmb3JtQmxvY2tTaXplID0gSU5WQUxJRF9TSVpFO1xuICBwcml2YXRlIF9fbWF4VmVydGV4VW5pZm9ybVZlY3RvcnMgPSBJTlZBTElEX1NJWkU7XG4gIHByaXZhdGUgX19tYXhGcmFnbWVudFVuaWZvcm1WZWN0b3JzID0gSU5WQUxJRF9TSVpFO1xuICBwcml2YXRlIF9fbWF4VGV4dHVyZVNpemU6IFNpemUgPSBJTlZBTElEX1NJWkU7XG4gIHByaXZhdGUgcmVhZG9ubHkgX19pc19tdWx0aXZpZXc6IGJvb2xlYW47XG4gIF9pc1dlYlhSTW9kZSA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBDYWNoZWQgcmVzdWx0cyBvZiBnZXRFeHRlbnNpb24gLyB2ZW5kb3ItcHJlZml4ZWQgZ2V0RXh0ZW5zaW9uLlxuICAgKiBWYWx1ZXMgYXJlIFdlYkdMIGV4dGVuc2lvbiBBUEkgb2JqZWN0cyAoZGlzdGluY3QgZnJvbSBXZWJHTFJlc291cmNlOiBidWZmZXJzLCB0ZXh0dXJlcywgcHJvZ3JhbXMsIGV0Yy4pLlxuICAgKi9cbiAgX19leHRlbnNpb25zOiBNYXA8V2ViR0xFeHRlbnNpb25FbnVtLCBvYmplY3QgfCBudWxsPiA9IG5ldyBNYXAoKTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBXZWJHTENvbnRleHRXcmFwcGVyIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gY29uZmlnIC0gVGhlIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBXZWJHTCBjb250ZXh0XG4gICAqIEBwYXJhbSBnbCAtIFRoZSBXZWJHTDIgcmVuZGVyaW5nIGNvbnRleHQgdG8gd3JhcFxuICAgKiBAcGFyYW0gY2FudmFzIC0gVGhlIEhUTUwgY2FudmFzIGVsZW1lbnQgYXNzb2NpYXRlZCB3aXRoIHRoZSBjb250ZXh0XG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjb25maWc6IENvbmZpZywgZ2w6IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQsIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpIHtcbiAgICB0aGlzLl9fZ2wgPSBnbDtcbiAgICB0aGlzLndpZHRoID0gY2FudmFzLndpZHRoO1xuICAgIHRoaXMuaGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcbiAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcbiAgICB0aGlzLl9fdmlld3BvcnRfd2lkdGggPSB0aGlzLl9fZGVmYXVsdF92aWV3cG9ydF93aWR0aCA9IHRoaXMud2lkdGg7XG4gICAgdGhpcy5fX3ZpZXdwb3J0X2hlaWdodCA9IHRoaXMuX19kZWZhdWx0X3ZpZXdwb3J0X2hlaWdodCA9IHRoaXMuaGVpZ2h0O1xuXG4gICAgdGhpcy5fX2lzX211bHRpdmlldyA9IHRydWU7XG5cbiAgICBpZiAodGhpcy5fX2dsLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdXZWJHTDJSZW5kZXJpbmdDb250ZXh0Jykge1xuICAgICAgdGhpcy5fX3dlYmdsVmVyc2lvbiA9IDI7XG4gICAgICB0aGlzLndlYmdsMkV4dFRGTCA9IHRoaXMuX19nZXRFeHRlbnNpb24oY29uZmlnLCBXZWJHTEV4dGVuc2lvbi5UZXh0dXJlRmxvYXRMaW5lYXIpO1xuICAgICAgdGhpcy53ZWJnbDJFeHRUSEZMID0gdGhpcy5fX2dldEV4dGVuc2lvbihjb25maWcsIFdlYkdMRXh0ZW5zaW9uLlRleHR1cmVIYWxmRmxvYXRMaW5lYXIpO1xuICAgICAgdGhpcy53ZWJnbDJFeHRURkEgPSB0aGlzLl9fZ2V0RXh0ZW5zaW9uKGNvbmZpZywgV2ViR0xFeHRlbnNpb24uVGV4dHVyZUZpbHRlckFuaXNvdHJvcGljKTtcbiAgICAgIHRoaXMud2ViZ2wyRXh0Q0JGID0gdGhpcy5fX2dldEV4dGVuc2lvbihjb25maWcsIFdlYkdMRXh0ZW5zaW9uLkNvbG9yQnVmZmVyRmxvYXRXZWJHTDIpO1xuICAgICAgdGhpcy53ZWJnbDJFeHRDQkhGID0gdGhpcy5fX2dldEV4dGVuc2lvbihjb25maWcsIFdlYkdMRXh0ZW5zaW9uLkNvbG9yQnVmZmVySGFsZkZsb2F0V2ViR0wyKTtcbiAgICAgIHRoaXMud2ViZ2wyRXh0Q1RBc3RjID0gdGhpcy5fX2dldENvbXByZXNzZWRUZXh0dXJlRXh0ZW5zaW9uKGNvbmZpZywgV2ViR0xFeHRlbnNpb24uQ29tcHJlc3NlZFRleHR1cmVBc3RjKTtcbiAgICAgIHRoaXMud2ViZ2wyRXh0Q1RTM3RjID0gdGhpcy5fX2dldENvbXByZXNzZWRUZXh0dXJlRXh0ZW5zaW9uKGNvbmZpZywgV2ViR0xFeHRlbnNpb24uQ29tcHJlc3NlZFRleHR1cmVTM3RjKTtcbiAgICAgIHRoaXMud2ViZ2wyRXh0Q1RQdnJ0YyA9IHRoaXMuX19nZXRDb21wcmVzc2VkVGV4dHVyZUV4dGVuc2lvbihjb25maWcsIFdlYkdMRXh0ZW5zaW9uLkNvbXByZXNzZWRUZXh0dXJlUHZydGMpO1xuICAgICAgdGhpcy53ZWJnbDJFeHRDVEF0YyA9IHRoaXMuX19nZXRDb21wcmVzc2VkVGV4dHVyZUV4dGVuc2lvbihjb25maWcsIFdlYkdMRXh0ZW5zaW9uLkNvbXByZXNzZWRUZXh0dXJlQXRjKTtcbiAgICAgIHRoaXMud2ViZ2wyRXh0Q1RFdGMgPSB0aGlzLl9fZ2V0Q29tcHJlc3NlZFRleHR1cmVFeHRlbnNpb24oY29uZmlnLCBXZWJHTEV4dGVuc2lvbi5Db21wcmVzc2VkVGV4dHVyZUV0Yyk7XG4gICAgICB0aGlzLndlYmdsMkV4dENURXRjMSA9IHRoaXMuX19nZXRDb21wcmVzc2VkVGV4dHVyZUV4dGVuc2lvbihjb25maWcsIFdlYkdMRXh0ZW5zaW9uLkNvbXByZXNzZWRUZXh0dXJlRXRjMSk7XG4gICAgICB0aGlzLndlYmdsMkV4dENUQnB0YyA9IHRoaXMuX19nZXRDb21wcmVzc2VkVGV4dHVyZUV4dGVuc2lvbihjb25maWcsIFdlYkdMRXh0ZW5zaW9uLkNvbXByZXNzZWRUZXh0dXJlQnB0Yyk7XG4gICAgICB0aGlzLndlYmdsMkV4dE1MVFZJRVcgPSB0aGlzLl9fZ2V0RXh0ZW5zaW9uKGNvbmZpZywgV2ViR0xFeHRlbnNpb24uT2N1bHVzTXVsdGl2aWV3KTtcbiAgICAgIGlmICh0aGlzLndlYmdsMkV4dE1MVFZJRVcpIHtcbiAgICAgICAgdGhpcy53ZWJnbDJFeHRNTFRWSUVXLmlzX211bHRpc2FtcGxlID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMud2ViZ2wyRXh0TUxUVklFVyA9IHRoaXMuX19nZXRFeHRlbnNpb24oY29uZmlnLCBXZWJHTEV4dGVuc2lvbi5PdnJNdWx0aXZpZXcyKTtcbiAgICAgICAgaWYgKHRoaXMud2ViZ2wyRXh0TUxUVklFVykge1xuICAgICAgICAgIHRoaXMud2ViZ2wyRXh0TUxUVklFVy5pc19tdWx0aXNhbXBsZSA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChjb25maWcuY2dBcGlEZWJ1Z0NvbnNvbGVPdXRwdXQpIHtcbiAgICAgICAgICAgIExvZ2dlci5kZWZhdWx0LmluZm8oJ09DVUxVU19tdWx0aXZpZXcgYW5kIE9WUl9tdWx0aXZpZXcyIGV4dGVuc2lvbnMgYXJlIG5vdCBzdXBwb3J0ZWQnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5fX2lzX211bHRpdmlldyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLndlYmdsMkV4dENsaXBDdHJsID0gdGhpcy5fX2dldEV4dGVuc2lvbihjb25maWcsIFdlYkdMRXh0ZW5zaW9uLkNsaXBDb250cm9sKTtcbiAgICAgIHRoaXMud2ViZ2wyRXh0TUQgPSB0aGlzLl9fZ2V0RXh0ZW5zaW9uKGNvbmZpZywgV2ViR0xFeHRlbnNpb24uTXVsdGlEcmF3KSBhcyBXRUJHTF9tdWx0aV9kcmF3IHwgbnVsbDtcbiAgICAgIGlmIChjb25maWcuY2dBcGlEZWJ1Z0NvbnNvbGVPdXRwdXQpIHtcbiAgICAgICAgdGhpcy53ZWJnbDJFeHRHbWFuV00gPSB0aGlzLl9fZ2V0RXh0ZW5zaW9uKGNvbmZpZywgV2ViR0xFeHRlbnNpb24uR01BTl9XRUJHTF9NRU1PUlkpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9fZ2V0VW5pZm9ybUJ1ZmZlckluZm8oKTtcbiAgICB0aGlzLl9fZ2V0TWF4VW5pZm9ybVZlY3RvcnMoKTtcbiAgICB0aGlzLl9fZ2V0TWF4VGV4dHVyZVNpemUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSByYXcgV2ViR0wgcmVuZGVyaW5nIGNvbnRleHQuXG4gICAqIEByZXR1cm5zIFRoZSB1bmRlcmx5aW5nIFdlYkdMIGNvbnRleHQgKFdlYkdMMSBvciBXZWJHTDIpXG4gICAqL1xuICBnZXRSYXdDb250ZXh0KCk6IFdlYkdMUmVuZGVyaW5nQ29udGV4dCB8IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQge1xuICAgIHJldHVybiB0aGlzLl9fZ2w7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcmF3IFdlYkdMIGNvbnRleHQgY2FzdCBhcyBXZWJHTDEuXG4gICAqIEByZXR1cm5zIFRoZSB1bmRlcmx5aW5nIFdlYkdMIGNvbnRleHQgYXMgV2ViR0wxIHR5cGVcbiAgICovXG4gIGdldFJhd0NvbnRleHRBc1dlYkdMMSgpOiBXZWJHTFJlbmRlcmluZ0NvbnRleHQge1xuICAgIHJldHVybiB0aGlzLl9fZ2wgYXMgV2ViR0xSZW5kZXJpbmdDb250ZXh0O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHJhdyBXZWJHTCBjb250ZXh0IGNhc3QgYXMgV2ViR0wyLlxuICAgKiBAcmV0dXJucyBUaGUgdW5kZXJseWluZyBXZWJHTCBjb250ZXh0IGFzIFdlYkdMMiB0eXBlXG4gICAqL1xuICBnZXRSYXdDb250ZXh0QXNXZWJHTDIoKTogV2ViR0wyUmVuZGVyaW5nQ29udGV4dCB7XG4gICAgcmV0dXJuIHRoaXMuX19nbCBhcyBXZWJHTDJSZW5kZXJpbmdDb250ZXh0O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgdmlld3BvcnQgc2V0dGluZ3MuXG4gICAqIEByZXR1cm5zIEEgVmVjdG9yNCBjb250YWluaW5nIHZpZXdwb3J0IGxlZnQsIHRvcCwgd2lkdGgsIGFuZCBoZWlnaHRcbiAgICovXG4gIGdldCB2aWV3cG9ydCgpIHtcbiAgICByZXR1cm4gVmVjdG9yNC5mcm9tQ29weUFycmF5KFtcbiAgICAgIHRoaXMuX192aWV3cG9ydF9sZWZ0LFxuICAgICAgdGhpcy5fX3ZpZXdwb3J0X3RvcCxcbiAgICAgIHRoaXMuX192aWV3cG9ydF93aWR0aCxcbiAgICAgIHRoaXMuX192aWV3cG9ydF9oZWlnaHQsXG4gICAgXSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZGVmYXVsdCB2aWV3cG9ydCBzZXR0aW5ncy5cbiAgICogQHJldHVybnMgQSBWZWN0b3I0IGNvbnRhaW5pbmcgZGVmYXVsdCB2aWV3cG9ydCBsZWZ0LCB0b3AsIHdpZHRoLCBhbmQgaGVpZ2h0XG4gICAqL1xuICBnZXQgZGVmYXVsdFZpZXdwb3J0KCkge1xuICAgIHJldHVybiBWZWN0b3I0LmZyb21Db3B5QXJyYXkoW1xuICAgICAgdGhpcy5fX2RlZmF1bHRfdmlld3BvcnRfbGVmdCxcbiAgICAgIHRoaXMuX19kZWZhdWx0X3ZpZXdwb3J0X3RvcCxcbiAgICAgIHRoaXMuX19kZWZhdWx0X3ZpZXdwb3J0X3dpZHRoLFxuICAgICAgdGhpcy5fX2RlZmF1bHRfdmlld3BvcnRfaGVpZ2h0LFxuICAgIF0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIFdlYkdMMSBleHRlbnNpb24gaXMgc3VwcG9ydGVkLlxuICAgKiBAcGFyYW0gd2ViR0xFeHRlbnNpb24gLSBUaGUgV2ViR0wgZXh0ZW5zaW9uIHRvIGNoZWNrXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGV4dGVuc2lvbiBpcyBzdXBwb3J0ZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgaXNTdXBwb3J0V2ViR0wxRXh0ZW5zaW9uKGNvbmZpZzogQ29uZmlnLCB3ZWJHTEV4dGVuc2lvbjogV2ViR0xFeHRlbnNpb25FbnVtKSB7XG4gICAgaWYgKHRoaXMuX19nZXRFeHRlbnNpb24oY29uZmlnLCB3ZWJHTEV4dGVuc2lvbikpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGEgV2ViR0wxIGV4dGVuc2lvbiBpcyBub3Qgc3VwcG9ydGVkLlxuICAgKiBAcGFyYW0gd2ViR0xFeHRlbnNpb24gLSBUaGUgV2ViR0wgZXh0ZW5zaW9uIHRvIGNoZWNrXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGV4dGVuc2lvbiBpcyBub3Qgc3VwcG9ydGVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGlzTm90U3VwcG9ydFdlYkdMMUV4dGVuc2lvbihjb25maWc6IENvbmZpZywgd2ViR0xFeHRlbnNpb246IFdlYkdMRXh0ZW5zaW9uRW51bSkge1xuICAgIHJldHVybiAhdGhpcy5pc1N1cHBvcnRXZWJHTDFFeHRlbnNpb24oY29uZmlnLCB3ZWJHTEV4dGVuc2lvbik7XG4gIH1cblxuICAvKipcbiAgICogVHlwZSBndWFyZCB0byBjaGVjayBpZiB0aGUgY29udGV4dCBpcyBXZWJHTDIuXG4gICAqIEBwYXJhbSBnbCAtIFRoZSBXZWJHTCBjb250ZXh0IHRvIGNoZWNrXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGNvbnRleHQgaXMgV2ViR0wyLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGdldElzV2ViR0wyKGdsOiBXZWJHTFJlbmRlcmluZ0NvbnRleHQgfCBXZWJHTDJSZW5kZXJpbmdDb250ZXh0KTogZ2wgaXMgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCB7XG4gICAgcmV0dXJuIHRoaXMuaXNXZWJHTDI7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSBjdXJyZW50IGNvbnRleHQgaXMgV2ViR0wyLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIFdlYkdMMiwgZmFsc2UgaWYgV2ViR0wxXG4gICAqL1xuICBnZXQgaXNXZWJHTDIoKSB7XG4gICAgaWYgKHRoaXMuX193ZWJnbFZlcnNpb24gPT09IDIpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB2ZXJ0ZXggYXJyYXkgb2JqZWN0LlxuICAgKiBAcmV0dXJucyBBIG5ldyBXZWJHTCB2ZXJ0ZXggYXJyYXkgb2JqZWN0XG4gICAqL1xuICBjcmVhdGVWZXJ0ZXhBcnJheSgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2dsLmNyZWF0ZVZlcnRleEFycmF5KCk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlcyBhIHZlcnRleCBhcnJheSBvYmplY3QuXG4gICAqIEBwYXJhbSB2ZXJ0ZXhBcnJheSAtIFRoZSB2ZXJ0ZXggYXJyYXkgb2JqZWN0IHRvIGRlbGV0ZVxuICAgKi9cbiAgZGVsZXRlVmVydGV4QXJyYXkodmVydGV4QXJyYXk6IFdlYkdMVmVydGV4QXJyYXlPYmplY3QgfCBXZWJHTFZlcnRleEFycmF5T2JqZWN0T0VTKSB7XG4gICAgdGhpcy5fX2dsLmRlbGV0ZVZlcnRleEFycmF5KHZlcnRleEFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCaW5kcyBhIHZlcnRleCBhcnJheSBvYmplY3QuXG4gICAqIEBwYXJhbSB2YW8gLSBUaGUgdmVydGV4IGFycmF5IG9iamVjdCB0byBiaW5kLCBvciBudWxsIHRvIHVuYmluZFxuICAgKi9cbiAgYmluZFZlcnRleEFycmF5KHZhbzogV2ViR0xWZXJ0ZXhBcnJheU9iamVjdE9FUyB8IG51bGwpIHtcbiAgICB0aGlzLl9fZ2wuYmluZFZlcnRleEFycmF5KHZhbyk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZGl2aXNvciBmb3IgaW5zdGFuY2VkIHJlbmRlcmluZyBmb3IgYSB2ZXJ0ZXggYXR0cmlidXRlLlxuICAgKiBAcGFyYW0gaW5kZXggLSBUaGUgaW5kZXggb2YgdGhlIHZlcnRleCBhdHRyaWJ1dGVcbiAgICogQHBhcmFtIGRpdmlzb3IgLSBUaGUgZGl2aXNvciB2YWx1ZSAoMCBmb3IgcGVyLXZlcnRleCwgMSsgZm9yIHBlci1pbnN0YW5jZSlcbiAgICovXG4gIHZlcnRleEF0dHJpYkRpdmlzb3IoaW5kZXg6IG51bWJlciwgZGl2aXNvcjogbnVtYmVyKSB7XG4gICAgdGhpcy5fX2dsLnZlcnRleEF0dHJpYkRpdmlzb3IoaW5kZXgsIGRpdmlzb3IpO1xuICB9XG5cbiAgLyoqXG4gICAqIERyYXdzIGVsZW1lbnRzIHdpdGggaW5zdGFuY2luZyBzdXBwb3J0LlxuICAgKiBAcGFyYW0gcHJpbWl0aXZlTW9kZSAtIFRoZSBwcmltaXRpdmUgbW9kZSAoR0xfVFJJQU5HTEVTLCBldGMuKVxuICAgKiBAcGFyYW0gaW5kZXhDb3VudCAtIFRoZSBudW1iZXIgb2YgaW5kaWNlcyB0byBkcmF3XG4gICAqIEBwYXJhbSB0eXBlIC0gVGhlIHR5cGUgb2YgdGhlIGluZGV4IHZhbHVlc1xuICAgKiBAcGFyYW0gb2Zmc2V0IC0gVGhlIG9mZnNldCBpbiB0aGUgaW5kZXggYnVmZmVyXG4gICAqIEBwYXJhbSBpbnN0YW5jZUNvdW50IC0gVGhlIG51bWJlciBvZiBpbnN0YW5jZXMgdG8gZHJhd1xuICAgKi9cbiAgZHJhd0VsZW1lbnRzSW5zdGFuY2VkKFxuICAgIHByaW1pdGl2ZU1vZGU6IG51bWJlcixcbiAgICBpbmRleENvdW50OiBudW1iZXIsXG4gICAgdHlwZTogbnVtYmVyLFxuICAgIG9mZnNldDogbnVtYmVyLFxuICAgIGluc3RhbmNlQ291bnQ6IG51bWJlclxuICApIHtcbiAgICB0aGlzLl9fZ2wuZHJhd0VsZW1lbnRzSW5zdGFuY2VkKHByaW1pdGl2ZU1vZGUsIGluZGV4Q291bnQsIHR5cGUsIG9mZnNldCwgaW5zdGFuY2VDb3VudCk7XG4gIH1cblxuICAvKipcbiAgICogRHJhd3MgYXJyYXlzIHdpdGggaW5zdGFuY2luZyBzdXBwb3J0LlxuICAgKiBAcGFyYW0gcHJpbWl0aXZlTW9kZSAtIFRoZSBwcmltaXRpdmUgbW9kZSAoR0xfVFJJQU5HTEVTLCBldGMuKVxuICAgKiBAcGFyYW0gZmlyc3QgLSBUaGUgc3RhcnRpbmcgaW5kZXggaW4gdGhlIGVuYWJsZWQgYXJyYXlzXG4gICAqIEBwYXJhbSBjb3VudCAtIFRoZSBudW1iZXIgb2YgdmVydGljZXMgdG8gZHJhd1xuICAgKiBAcGFyYW0gaW5zdGFuY2VDb3VudCAtIFRoZSBudW1iZXIgb2YgaW5zdGFuY2VzIHRvIGRyYXdcbiAgICovXG4gIGRyYXdBcnJheXNJbnN0YW5jZWQocHJpbWl0aXZlTW9kZTogbnVtYmVyLCBmaXJzdDogbnVtYmVyLCBjb3VudDogbnVtYmVyLCBpbnN0YW5jZUNvdW50OiBudW1iZXIpIHtcbiAgICB0aGlzLl9fZ2wuZHJhd0FycmF5c0luc3RhbmNlZChwcmltaXRpdmVNb2RlLCBmaXJzdCwgY291bnQsIGluc3RhbmNlQ291bnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIElzc3VlcyBtdWx0aXBsZSBpbnN0YW5jZWQgaW5kZXhlZCBkcmF3cyB3aXRoIG9uZSBjYWxsIHdoZW4gV0VCR0xfbXVsdGlfZHJhdyBpcyBhdmFpbGFibGUuXG4gICAqIEZhbGxzIGJhY2sgdG8gaW5kaXZpZHVhbCBkcmF3RWxlbWVudHNJbnN0YW5jZWQgY2FsbHMgb3RoZXJ3aXNlLlxuICAgKiBUaGUgb2Zmc2V0cyBhcmUgYnl0ZSBvZmZzZXRzIGludG8gdGhlIGN1cnJlbnRseSBib3VuZCBlbGVtZW50IGFycmF5IGJ1ZmZlci5cbiAgICovXG4gIG11bHRpRHJhd0VsZW1lbnRzSW5zdGFuY2VkKFxuICAgIHByaW1pdGl2ZU1vZGU6IG51bWJlcixcbiAgICBjb3VudHM6IEludDMyQXJyYXksXG4gICAgY291bnRzT2Zmc2V0OiBudW1iZXIsXG4gICAgdHlwZTogbnVtYmVyLFxuICAgIG9mZnNldHM6IEludDMyQXJyYXksXG4gICAgb2Zmc2V0c09mZnNldDogbnVtYmVyLFxuICAgIGluc3RhbmNlQ291bnRzOiBJbnQzMkFycmF5LFxuICAgIGluc3RhbmNlQ291bnRzT2Zmc2V0OiBudW1iZXIsXG4gICAgZHJhd2NvdW50OiBudW1iZXJcbiAgKSB7XG4gICAgY29uc3QgZXh0ID0gdGhpcy53ZWJnbDJFeHRNRDtcbiAgICBpZiAoZXh0ICE9IG51bGwpIHtcbiAgICAgIGV4dC5tdWx0aURyYXdFbGVtZW50c0luc3RhbmNlZFdFQkdMKFxuICAgICAgICBwcmltaXRpdmVNb2RlLFxuICAgICAgICBjb3VudHMsXG4gICAgICAgIGNvdW50c09mZnNldCxcbiAgICAgICAgdHlwZSxcbiAgICAgICAgb2Zmc2V0cyxcbiAgICAgICAgb2Zmc2V0c09mZnNldCxcbiAgICAgICAgaW5zdGFuY2VDb3VudHMsXG4gICAgICAgIGluc3RhbmNlQ291bnRzT2Zmc2V0LFxuICAgICAgICBkcmF3Y291bnRcbiAgICAgICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZHJhd2NvdW50OyBpKyspIHtcbiAgICAgIHRoaXMuX19nbC5kcmF3RWxlbWVudHNJbnN0YW5jZWQoXG4gICAgICAgIHByaW1pdGl2ZU1vZGUsXG4gICAgICAgIGNvdW50c1tjb3VudHNPZmZzZXQgKyBpXSxcbiAgICAgICAgdHlwZSxcbiAgICAgICAgb2Zmc2V0c1tvZmZzZXRzT2Zmc2V0ICsgaV0sXG4gICAgICAgIGluc3RhbmNlQ291bnRzW2luc3RhbmNlQ291bnRzT2Zmc2V0ICsgaV1cbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIElzc3VlcyBtdWx0aXBsZSBpbnN0YW5jZWQgbm9uLWluZGV4ZWQgZHJhd3Mgd2l0aCBvbmUgY2FsbCB3aGVuIFdFQkdMX211bHRpX2RyYXcgaXMgYXZhaWxhYmxlLlxuICAgKiBGYWxscyBiYWNrIHRvIGluZGl2aWR1YWwgZHJhd0FycmF5c0luc3RhbmNlZCBjYWxscyBvdGhlcndpc2UuXG4gICAqL1xuICBtdWx0aURyYXdBcnJheXNJbnN0YW5jZWQoXG4gICAgcHJpbWl0aXZlTW9kZTogbnVtYmVyLFxuICAgIGZpcnN0czogSW50MzJBcnJheSxcbiAgICBmaXJzdHNPZmZzZXQ6IG51bWJlcixcbiAgICBjb3VudHM6IEludDMyQXJyYXksXG4gICAgY291bnRzT2Zmc2V0OiBudW1iZXIsXG4gICAgaW5zdGFuY2VDb3VudHM6IEludDMyQXJyYXksXG4gICAgaW5zdGFuY2VDb3VudHNPZmZzZXQ6IG51bWJlcixcbiAgICBkcmF3Y291bnQ6IG51bWJlclxuICApIHtcbiAgICBjb25zdCBleHQgPSB0aGlzLndlYmdsMkV4dE1EO1xuICAgIGlmIChleHQgIT0gbnVsbCkge1xuICAgICAgZXh0Lm11bHRpRHJhd0FycmF5c0luc3RhbmNlZFdFQkdMKFxuICAgICAgICBwcmltaXRpdmVNb2RlLFxuICAgICAgICBmaXJzdHMsXG4gICAgICAgIGZpcnN0c09mZnNldCxcbiAgICAgICAgY291bnRzLFxuICAgICAgICBjb3VudHNPZmZzZXQsXG4gICAgICAgIGluc3RhbmNlQ291bnRzLFxuICAgICAgICBpbnN0YW5jZUNvdW50c09mZnNldCxcbiAgICAgICAgZHJhd2NvdW50XG4gICAgICApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRyYXdjb3VudDsgaSsrKSB7XG4gICAgICB0aGlzLl9fZ2wuZHJhd0FycmF5c0luc3RhbmNlZChcbiAgICAgICAgcHJpbWl0aXZlTW9kZSxcbiAgICAgICAgZmlyc3RzW2ZpcnN0c09mZnNldCArIGldLFxuICAgICAgICBjb3VudHNbY291bnRzT2Zmc2V0ICsgaV0sXG4gICAgICAgIGluc3RhbmNlQ291bnRzW2luc3RhbmNlQ291bnRzT2Zmc2V0ICsgaV1cbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNvbG9yIGF0dGFjaG1lbnQgY29uc3RhbnQgZm9yIGEgZ2l2ZW4gaW5kZXguXG4gICAqIEBwYXJhbSBpbmRleCAtIFRoZSBhdHRhY2htZW50IGluZGV4XG4gICAqIEByZXR1cm5zIFRoZSBXZWJHTCBjb2xvciBhdHRhY2htZW50IGNvbnN0YW50XG4gICAqL1xuICBjb2xvckF0dGFjaG1lbnQoaW5kZXg6IEluZGV4KSB7XG4gICAgcmV0dXJuIDB4OGNlMCArIGluZGV4OyAvLyBHTF9DT0xPUl9BVFRBQ0hNRU5UMCA9IDB4OGNlMFxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGRyYXcgYnVmZmVycyBmb3IgbXVsdGlwbGUgcmVuZGVyIHRhcmdldHMuXG4gICAqIEBwYXJhbSBidWZmZXJzIC0gQXJyYXkgb2YgcmVuZGVyIGJ1ZmZlciB0YXJnZXRzIHRvIGRyYXcgdG9cbiAgICovXG4gIGRyYXdCdWZmZXJzKGJ1ZmZlcnM6IFJlbmRlckJ1ZmZlclRhcmdldEVudW1bXSkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsIGFzIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQ7XG4gICAgaWYgKGJ1ZmZlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICBnbC5kcmF3QnVmZmVycyhbZ2wuTk9ORV0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBidWZmZXIgPSBidWZmZXJzWzBdLndlYkdMQ29uc3RhbnRWYWx1ZSgpO1xuICAgIGdsLmRyYXdCdWZmZXJzKFxuICAgICAgYnVmZmVycy5tYXAoYnVmID0+IHtcbiAgICAgICAgcmV0dXJuIGJ1Zi53ZWJHTENvbnN0YW50VmFsdWUoKTtcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIGlmIChidWZmZXIgPT09IGdsLk5PTkUgfHwgYnVmZmVycy5sZW5ndGggPT09IDApIHtcbiAgICAgIGdsLmNvbG9yTWFzayhmYWxzZSwgZmFsc2UsIGZhbHNlLCBmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdsLmNvbG9yTWFzayh0cnVlLCB0cnVlLCB0cnVlLCB0cnVlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWN0aXZhdGVzIGEgdGV4dHVyZSB1bml0IGZvciBzdWJzZXF1ZW50IHRleHR1cmUgb3BlcmF0aW9ucy5cbiAgICogT3B0aW1pemVkIHRvIGF2b2lkIHJlZHVuZGFudCBzdGF0ZSBjaGFuZ2VzLlxuICAgKiBAcGFyYW0gYWN0aXZlVGV4dHVyZUluZGV4IC0gVGhlIHRleHR1cmUgdW5pdCBpbmRleCB0byBhY3RpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2FjdGl2ZVRleHR1cmUoYWN0aXZlVGV4dHVyZUluZGV4OiBudW1iZXIpIHtcbiAgICBpZiAodGhpcy5fX2FjdGl2ZVRleHR1cmVCYWNrdXAgPT09IGFjdGl2ZVRleHR1cmVJbmRleCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9fZ2wuYWN0aXZlVGV4dHVyZSh0aGlzLl9fZ2wuVEVYVFVSRTAgKyBhY3RpdmVUZXh0dXJlSW5kZXgpO1xuICAgIHRoaXMuX19hY3RpdmVUZXh0dXJlQmFja3VwID0gYWN0aXZlVGV4dHVyZUluZGV4O1xuICB9XG5cbiAgLyoqXG4gICAqIEJpbmRzIGEgMkQgdGV4dHVyZSB0byBhIHNwZWNpZmljIHRleHR1cmUgdW5pdC5cbiAgICogT3B0aW1pemVkIHRvIGF2b2lkIHJlZHVuZGFudCBzdGF0ZSBjaGFuZ2VzLlxuICAgKiBAcGFyYW0gYWN0aXZlVGV4dHVyZUluZGV4IC0gVGhlIHRleHR1cmUgdW5pdCBpbmRleFxuICAgKiBAcGFyYW0gdGV4dHVyZSAtIFRoZSAyRCB0ZXh0dXJlIHRvIGJpbmRcbiAgICovXG4gIGJpbmRUZXh0dXJlMkQoYWN0aXZlVGV4dHVyZUluZGV4OiBJbmRleCwgdGV4dHVyZTogV2ViR0xUZXh0dXJlKSB7XG4gICAgY29uc3QgdGV4ID0gdGhpcy5fX2JvdW5kVGV4dHVyZXMuZ2V0KGFjdGl2ZVRleHR1cmVJbmRleCk7XG4gICAgaWYgKHRleCAhPT0gdGV4dHVyZSkge1xuICAgICAgdGhpcy5fX2FjdGl2ZVRleHR1cmUoYWN0aXZlVGV4dHVyZUluZGV4KTtcbiAgICAgIHRoaXMuX19nbC5iaW5kVGV4dHVyZSh0aGlzLl9fZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSk7XG4gICAgICB0aGlzLl9fYm91bmRUZXh0dXJlcy5zZXQoYWN0aXZlVGV4dHVyZUluZGV4LCB0ZXh0dXJlKTtcbiAgICB9XG5cbiAgICB0aGlzLl9fYWN0aXZlVGV4dHVyZXMyRFthY3RpdmVUZXh0dXJlSW5kZXhdID0gdGV4dHVyZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCaW5kcyBhIDJEIGFycmF5IHRleHR1cmUgdG8gYSBzcGVjaWZpYyB0ZXh0dXJlIHVuaXQuXG4gICAqIE9wdGltaXplZCB0byBhdm9pZCByZWR1bmRhbnQgc3RhdGUgY2hhbmdlcy5cbiAgICogQHBhcmFtIGFjdGl2ZVRleHR1cmVJbmRleCAtIFRoZSB0ZXh0dXJlIHVuaXQgaW5kZXhcbiAgICogQHBhcmFtIHRleHR1cmUgLSBUaGUgMkQgYXJyYXkgdGV4dHVyZSB0byBiaW5kXG4gICAqL1xuICBiaW5kVGV4dHVyZTJEQXJyYXkoYWN0aXZlVGV4dHVyZUluZGV4OiBJbmRleCwgdGV4dHVyZTogV2ViR0xUZXh0dXJlKSB7XG4gICAgY29uc3QgdGV4ID0gdGhpcy5fX2JvdW5kVGV4dHVyZXMuZ2V0KGFjdGl2ZVRleHR1cmVJbmRleCk7XG4gICAgaWYgKHRleCAhPT0gdGV4dHVyZSkge1xuICAgICAgdGhpcy5fX2FjdGl2ZVRleHR1cmUoYWN0aXZlVGV4dHVyZUluZGV4KTtcbiAgICAgIHRoaXMuX19nbC5iaW5kVGV4dHVyZSh0aGlzLl9fZ2wuVEVYVFVSRV8yRF9BUlJBWSwgdGV4dHVyZSk7XG4gICAgICB0aGlzLl9fYm91bmRUZXh0dXJlcy5zZXQoYWN0aXZlVGV4dHVyZUluZGV4LCB0ZXh0dXJlKTtcbiAgICB9XG5cbiAgICB0aGlzLl9fYWN0aXZlVGV4dHVyZXMyREFycmF5W2FjdGl2ZVRleHR1cmVJbmRleF0gPSB0ZXh0dXJlO1xuICB9XG5cbiAgLyoqXG4gICAqIEJpbmRzIGEgc2FtcGxlciBvYmplY3QgdG8gYSBzcGVjaWZpYyB0ZXh0dXJlIHVuaXQuXG4gICAqIE9wdGltaXplZCB0byBhdm9pZCByZWR1bmRhbnQgc3RhdGUgY2hhbmdlcy5cbiAgICogQHBhcmFtIGFjdGl2ZVRleHR1cmVJbmRleCAtIFRoZSB0ZXh0dXJlIHVuaXQgaW5kZXhcbiAgICogQHBhcmFtIHNhbXBsZXIgLSBUaGUgc2FtcGxlciBvYmplY3QgdG8gYmluZFxuICAgKi9cbiAgYmluZFRleHR1cmVTYW1wbGVyKGFjdGl2ZVRleHR1cmVJbmRleDogSW5kZXgsIHNhbXBsZXI6IFdlYkdMU2FtcGxlcikge1xuICAgIGNvbnN0IHNhbXAgPSB0aGlzLl9fYm91bmRTYW1wbGVycy5nZXQoYWN0aXZlVGV4dHVyZUluZGV4KTtcbiAgICBpZiAoc2FtcCAhPT0gc2FtcGxlcikge1xuICAgICAgdGhpcy5fX2dsLmJpbmRTYW1wbGVyKGFjdGl2ZVRleHR1cmVJbmRleCwgc2FtcGxlcik7XG4gICAgICB0aGlzLl9fYm91bmRTYW1wbGVycy5zZXQoYWN0aXZlVGV4dHVyZUluZGV4LCBzYW1wbGVyKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQmluZHMgYSBjdWJlIG1hcCB0ZXh0dXJlIHRvIGEgc3BlY2lmaWMgdGV4dHVyZSB1bml0LlxuICAgKiBPcHRpbWl6ZWQgdG8gYXZvaWQgcmVkdW5kYW50IHN0YXRlIGNoYW5nZXMuXG4gICAqIEBwYXJhbSBhY3RpdmVUZXh0dXJlSW5kZXggLSBUaGUgdGV4dHVyZSB1bml0IGluZGV4XG4gICAqIEBwYXJhbSB0ZXh0dXJlIC0gVGhlIGN1YmUgbWFwIHRleHR1cmUgdG8gYmluZFxuICAgKi9cbiAgYmluZFRleHR1cmVDdWJlKGFjdGl2ZVRleHR1cmVJbmRleDogSW5kZXgsIHRleHR1cmU6IFdlYkdMVGV4dHVyZSkge1xuICAgIGNvbnN0IHRleCA9IHRoaXMuX19ib3VuZFRleHR1cmVzLmdldChhY3RpdmVUZXh0dXJlSW5kZXgpO1xuICAgIGlmICh0ZXggIT09IHRleHR1cmUpIHtcbiAgICAgIHRoaXMuX19hY3RpdmVUZXh0dXJlKGFjdGl2ZVRleHR1cmVJbmRleCk7XG4gICAgICB0aGlzLl9fZ2wuYmluZFRleHR1cmUodGhpcy5fX2dsLlRFWFRVUkVfQ1VCRV9NQVAsIHRleHR1cmUpO1xuICAgICAgdGhpcy5fX2JvdW5kVGV4dHVyZXMuc2V0KGFjdGl2ZVRleHR1cmVJbmRleCwgdGV4dHVyZSk7XG4gICAgfVxuXG4gICAgdGhpcy5fX2FjdGl2ZVRleHR1cmVzQ3ViZVthY3RpdmVUZXh0dXJlSW5kZXhdID0gdGV4dHVyZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbmJpbmRzIGEgMkQgdGV4dHVyZSBmcm9tIGEgc3BlY2lmaWMgdGV4dHVyZSB1bml0LlxuICAgKiBAcGFyYW0gYWN0aXZlVGV4dHVyZUluZGV4IC0gVGhlIHRleHR1cmUgdW5pdCBpbmRleFxuICAgKi9cbiAgdW5iaW5kVGV4dHVyZTJEKGFjdGl2ZVRleHR1cmVJbmRleDogSW5kZXgpIHtcbiAgICB0aGlzLl9fYWN0aXZlVGV4dHVyZShhY3RpdmVUZXh0dXJlSW5kZXgpO1xuICAgIHRoaXMuX19nbC5iaW5kVGV4dHVyZSh0aGlzLl9fZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XG4gICAgdGhpcy5fX2JvdW5kVGV4dHVyZXMuZGVsZXRlKGFjdGl2ZVRleHR1cmVJbmRleCk7XG4gICAgZGVsZXRlIHRoaXMuX19hY3RpdmVUZXh0dXJlczJEW2FjdGl2ZVRleHR1cmVJbmRleF07XG4gIH1cblxuICAvKipcbiAgICogVW5iaW5kcyBhIDJEIGFycmF5IHRleHR1cmUgZnJvbSBhIHNwZWNpZmljIHRleHR1cmUgdW5pdC5cbiAgICogQHBhcmFtIGFjdGl2ZVRleHR1cmVJbmRleCAtIFRoZSB0ZXh0dXJlIHVuaXQgaW5kZXhcbiAgICovXG4gIHVuYmluZFRleHR1cmUyREFycmF5KGFjdGl2ZVRleHR1cmVJbmRleDogSW5kZXgpIHtcbiAgICB0aGlzLl9fYWN0aXZlVGV4dHVyZShhY3RpdmVUZXh0dXJlSW5kZXgpO1xuICAgIHRoaXMuX19nbC5iaW5kVGV4dHVyZSh0aGlzLl9fZ2wuVEVYVFVSRV8yRF9BUlJBWSwgbnVsbCk7XG4gICAgdGhpcy5fX2JvdW5kVGV4dHVyZXMuZGVsZXRlKGFjdGl2ZVRleHR1cmVJbmRleCk7XG4gICAgZGVsZXRlIHRoaXMuX19hY3RpdmVUZXh0dXJlczJEQXJyYXlbYWN0aXZlVGV4dHVyZUluZGV4XTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbmJpbmRzIGEgY3ViZSBtYXAgdGV4dHVyZSBmcm9tIGEgc3BlY2lmaWMgdGV4dHVyZSB1bml0LlxuICAgKiBAcGFyYW0gYWN0aXZlVGV4dHVyZUluZGV4IC0gVGhlIHRleHR1cmUgdW5pdCBpbmRleFxuICAgKi9cbiAgdW5iaW5kVGV4dHVyZUN1YmUoYWN0aXZlVGV4dHVyZUluZGV4OiBJbmRleCkge1xuICAgIHRoaXMuX19hY3RpdmVUZXh0dXJlKGFjdGl2ZVRleHR1cmVJbmRleCk7XG4gICAgdGhpcy5fX2dsLmJpbmRUZXh0dXJlKHRoaXMuX19nbC5URVhUVVJFX0NVQkVfTUFQLCBudWxsKTtcbiAgICB0aGlzLl9fYm91bmRUZXh0dXJlcy5kZWxldGUoYWN0aXZlVGV4dHVyZUluZGV4KTtcbiAgICBkZWxldGUgdGhpcy5fX2FjdGl2ZVRleHR1cmVzQ3ViZVthY3RpdmVUZXh0dXJlSW5kZXhdO1xuICB9XG5cbiAgLyoqXG4gICAqIFVuYmluZHMgYWxsIGN1cnJlbnRseSBib3VuZCB0ZXh0dXJlcyBmcm9tIGFsbCB0ZXh0dXJlIHVuaXRzLlxuICAgKiBUaGlzIGlzIHVzZWZ1bCBmb3IgY2xlYW51cCBvcGVyYXRpb25zLlxuICAgKi9cbiAgdW5iaW5kVGV4dHVyZXMoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9fYWN0aXZlVGV4dHVyZXMyRC5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMuX19hY3RpdmVUZXh0dXJlczJEW2ldID09IG51bGwpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB0aGlzLl9fYWN0aXZlVGV4dHVyZSgxNSk7XG4gICAgICB0aGlzLl9fZ2wuYmluZFRleHR1cmUodGhpcy5fX2dsLlRFWFRVUkVfMkQsIG51bGwpO1xuICAgICAgZGVsZXRlIHRoaXMuX19hY3RpdmVUZXh0dXJlczJEW2ldO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fX2FjdGl2ZVRleHR1cmVzMkRBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMuX19hY3RpdmVUZXh0dXJlczJEQXJyYXlbaV0gPT0gbnVsbCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19hY3RpdmVUZXh0dXJlKDE1KTtcbiAgICAgIHRoaXMuX19nbC5iaW5kVGV4dHVyZSh0aGlzLl9fZ2wuVEVYVFVSRV8yRF9BUlJBWSwgbnVsbCk7XG4gICAgICBkZWxldGUgdGhpcy5fX2FjdGl2ZVRleHR1cmVzMkRBcnJheVtpXTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX19hY3RpdmVUZXh0dXJlc0N1YmUubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLl9fYWN0aXZlVGV4dHVyZXNDdWJlW2ldID09IG51bGwpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB0aGlzLl9fYWN0aXZlVGV4dHVyZSgxNSk7XG4gICAgICB0aGlzLl9fZ2wuYmluZFRleHR1cmUodGhpcy5fX2dsLlRFWFRVUkVfQ1VCRV9NQVAsIG51bGwpO1xuICAgICAgZGVsZXRlIHRoaXMuX19hY3RpdmVUZXh0dXJlc0N1YmVbaV07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSBXZWJHTCBleHRlbnNpb24gYW5kIGNhY2hlcyBpdCBmb3IgZnV0dXJlIHVzZS5cbiAgICogQHBhcmFtIGNvbmZpZyAtIFRoZSBjb25maWd1cmF0aW9uIGZvciB0aGUgV2ViR0wgY29udGV4dFxuICAgKiBAcGFyYW0gZXh0ZW5zaW9uIC0gVGhlIGV4dGVuc2lvbiB0byByZXRyaWV2ZVxuICAgKiBAcmV0dXJucyBUaGUgZXh0ZW5zaW9uIG9iamVjdCBvciBudWxsIGlmIG5vdCBhdmFpbGFibGVcbiAgICovXG4gIHByaXZhdGUgX19nZXRFeHRlbnNpb24oY29uZmlnOiBDb25maWcsIGV4dGVuc2lvbjogV2ViR0xFeHRlbnNpb25FbnVtKSB7XG4gICAgY29uc3QgZ2w6IGFueSA9IHRoaXMuX19nbDtcblxuICAgIGlmICghdGhpcy5fX2V4dGVuc2lvbnMuaGFzKGV4dGVuc2lvbikpIHtcbiAgICAgIGNvbnN0IGV4dE9iaiA9IGdsLmdldEV4dGVuc2lvbihleHRlbnNpb24udG9TdHJpbmcoKSk7XG4gICAgICBpZiAoZXh0T2JqID09IG51bGwgJiYgY29uZmlnLmNnQXBpRGVidWdDb25zb2xlT3V0cHV0KSB7XG4gICAgICAgIGNvbnN0IHRleHQgPSBgJHtleHRlbnNpb24udG9TdHJpbmcoKX0gTm90IEF2YWlsYWJsZSBpbiB0aGlzIGVudmlyb25tZW50YDtcbiAgICAgICAgTG9nZ2VyLmRlZmF1bHQuaW5mbyh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19leHRlbnNpb25zLnNldChleHRlbnNpb24sIGV4dE9iaik7XG4gICAgICByZXR1cm4gZXh0T2JqO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX2V4dGVuc2lvbnMuZ2V0KGV4dGVuc2lvbik7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIGNvbXByZXNzZWQgdGV4dHVyZSBleHRlbnNpb24gd2l0aCB2ZW5kb3IgcHJlZml4IHN1cHBvcnQuXG4gICAqIEBwYXJhbSBleHRlbnNpb24gLSBUaGUgY29tcHJlc3NlZCB0ZXh0dXJlIGV4dGVuc2lvbiB0byByZXRyaWV2ZVxuICAgKiBAcmV0dXJucyBUaGUgZXh0ZW5zaW9uIG9iamVjdCBvciBudWxsIGlmIG5vdCBhdmFpbGFibGVcbiAgICovXG4gIHByaXZhdGUgX19nZXRDb21wcmVzc2VkVGV4dHVyZUV4dGVuc2lvbihjb25maWc6IENvbmZpZywgZXh0ZW5zaW9uOiBXZWJHTEV4dGVuc2lvbkVudW0pIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbCBhcyBXZWJHTFJlbmRlcmluZ0NvbnRleHQgfCBXZWJHTDJSZW5kZXJpbmdDb250ZXh0O1xuXG4gICAgaWYgKCF0aGlzLl9fZXh0ZW5zaW9ucy5oYXMoZXh0ZW5zaW9uKSkge1xuICAgICAgY29uc3QgZXh0ZW5zaW9uTmFtZSA9IGV4dGVuc2lvbi50b1N0cmluZygpO1xuICAgICAgY29uc3QgZXh0T2JqID1cbiAgICAgICAgZ2wuZ2V0RXh0ZW5zaW9uKGV4dGVuc2lvbk5hbWUpID8/XG4gICAgICAgIGdsLmdldEV4dGVuc2lvbihgTU9aXyR7ZXh0ZW5zaW9uTmFtZX1gKSA/P1xuICAgICAgICBnbC5nZXRFeHRlbnNpb24oYFdFQktJVF8ke2V4dGVuc2lvbk5hbWV9YCk7XG5cbiAgICAgIGlmIChleHRPYmogPT0gbnVsbCAmJiBjb25maWcuY2dBcGlEZWJ1Z0NvbnNvbGVPdXRwdXQpIHtcbiAgICAgICAgY29uc3QgdGV4dCA9IGAke2V4dGVuc2lvbi50b1N0cmluZygpfSBOb3QgQXZhaWxhYmxlIGluIHRoaXMgZW52aXJvbm1lbnRgO1xuICAgICAgICBMb2dnZXIuZGVmYXVsdC5pbmZvKHRleHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fX2V4dGVuc2lvbnMuc2V0KGV4dGVuc2lvbiwgZXh0T2JqKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBleHRPYmo7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fZXh0ZW5zaW9ucy5nZXQoZXh0ZW5zaW9uKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2aWV3cG9ydCB3aXRoIG9wdGltaXphdGlvbiB0byBhdm9pZCByZWR1bmRhbnQgc3RhdGUgY2hhbmdlcy5cbiAgICogQHBhcmFtIGxlZnQgLSBMZWZ0IGNvb3JkaW5hdGUgb2YgdGhlIHZpZXdwb3J0XG4gICAqIEBwYXJhbSB0b3AgLSBUb3AgY29vcmRpbmF0ZSBvZiB0aGUgdmlld3BvcnRcbiAgICogQHBhcmFtIHdpZHRoIC0gV2lkdGggb2YgdGhlIHZpZXdwb3J0XG4gICAqIEBwYXJhbSBoZWlnaHQgLSBIZWlnaHQgb2YgdGhlIHZpZXdwb3J0XG4gICAqL1xuICBzZXRWaWV3cG9ydChsZWZ0OiBudW1iZXIsIHRvcDogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IGdsOiBhbnkgPSB0aGlzLl9fZ2w7XG4gICAgaWYgKFxuICAgICAgdGhpcy5fX3ZpZXdwb3J0X3dpZHRoICE9PSB3aWR0aCB8fFxuICAgICAgdGhpcy5fX3ZpZXdwb3J0X2hlaWdodCAhPT0gaGVpZ2h0IHx8XG4gICAgICB0aGlzLl9fdmlld3BvcnRfbGVmdCAhPT0gbGVmdCB8fFxuICAgICAgdGhpcy5fX3ZpZXdwb3J0X3RvcCAhPT0gdG9wXG4gICAgKSB7XG4gICAgICBnbC52aWV3cG9ydChsZWZ0LCB0b3AsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgdGhpcy5fX3ZpZXdwb3J0X2xlZnQgPSBsZWZ0O1xuICAgICAgdGhpcy5fX3ZpZXdwb3J0X3RvcCA9IHRvcDtcbiAgICAgIHRoaXMuX192aWV3cG9ydF93aWR0aCA9IHdpZHRoO1xuICAgICAgdGhpcy5fX3ZpZXdwb3J0X2hlaWdodCA9IGhlaWdodDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmlld3BvcnQgdXNpbmcgYSBWZWN0b3I0IHdpdGggb3B0aW1pemF0aW9uIHRvIGF2b2lkIHJlZHVuZGFudCBzdGF0ZSBjaGFuZ2VzLlxuICAgKiBAcGFyYW0gdmlld3BvcnQgLSBWZWN0b3I0IGNvbnRhaW5pbmcgbGVmdCwgdG9wLCB3aWR0aCwgYW5kIGhlaWdodFxuICAgKi9cbiAgc2V0Vmlld3BvcnRBc1ZlY3RvcjQodmlld3BvcnQ6IFZlY3RvcjQpOiB2b2lkIHtcbiAgICBjb25zdCBnbDogYW55ID0gdGhpcy5fX2dsO1xuICAgIGlmIChcbiAgICAgIHRoaXMuX192aWV3cG9ydF93aWR0aCAhPT0gdmlld3BvcnQueiB8fFxuICAgICAgdGhpcy5fX3ZpZXdwb3J0X2hlaWdodCAhPT0gdmlld3BvcnQudyB8fFxuICAgICAgdGhpcy5fX3ZpZXdwb3J0X2xlZnQgIT09IHZpZXdwb3J0LnggfHxcbiAgICAgIHRoaXMuX192aWV3cG9ydF90b3AgIT09IHZpZXdwb3J0LnlcbiAgICApIHtcbiAgICAgIGdsLnZpZXdwb3J0KHZpZXdwb3J0LngsIHZpZXdwb3J0LnksIHZpZXdwb3J0LnosIHZpZXdwb3J0LncpO1xuICAgICAgdGhpcy5fX3ZpZXdwb3J0X2xlZnQgPSB2aWV3cG9ydC54O1xuICAgICAgdGhpcy5fX3ZpZXdwb3J0X3RvcCA9IHZpZXdwb3J0Lnk7XG4gICAgICB0aGlzLl9fdmlld3BvcnRfd2lkdGggPSB2aWV3cG9ydC56O1xuICAgICAgdGhpcy5fX3ZpZXdwb3J0X2hlaWdodCA9IHZpZXdwb3J0Lnc7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhbmQgY2FjaGVzIHVuaWZvcm0gYnVmZmVyIGluZm9ybWF0aW9uIGZvciBXZWJHTDIuXG4gICAqIFRoaXMgaW5jbHVkZXMgYWxpZ25tZW50IHJlcXVpcmVtZW50cyBhbmQgc2l6ZSBsaW1pdHMuXG4gICAqL1xuICBwcml2YXRlIF9fZ2V0VW5pZm9ybUJ1ZmZlckluZm8oKSB7XG4gICAgaWYgKCF0aGlzLmlzV2ViR0wyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZ2w6IGFueSA9IHRoaXMuX19nbDtcbiAgICBjb25zdCBvZmZzZXRBbGlnbm1lbnQgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuVU5JRk9STV9CVUZGRVJfT0ZGU0VUX0FMSUdOTUVOVCkgYXMgbnVtYmVyO1xuICAgIGNvbnN0IG1heEJsb2NrU2l6ZSA9IGdsLmdldFBhcmFtZXRlcihnbC5NQVhfVU5JRk9STV9CTE9DS19TSVpFKSBhcyBudW1iZXI7XG4gICAgdGhpcy5fX21heFZlcnRleFVuaWZvcm1CbG9ja3MgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuTUFYX1ZFUlRFWF9VTklGT1JNX0JMT0NLUykgYXMgbnVtYmVyO1xuICAgIHRoaXMuX19tYXhGcmFnbWVudFVuaWZvcm1CbG9ja3MgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuTUFYX0ZSQUdNRU5UX1VOSUZPUk1fQkxPQ0tTKSBhcyBudW1iZXI7XG4gICAgdGhpcy5fX21heENvbnZlbnRpb25Vbmlmb3JtQmxvY2tzID0gTWF0aC5taW4odGhpcy5fX21heFZlcnRleFVuaWZvcm1CbG9ja3MsIHRoaXMuX19tYXhGcmFnbWVudFVuaWZvcm1CbG9ja3MpO1xuICAgIHRoaXMuX19hbGlnbmVkTWF4VW5pZm9ybUJsb2NrU2l6ZSA9IG1heEJsb2NrU2l6ZSAtIChtYXhCbG9ja1NpemUgJSBvZmZzZXRBbGlnbm1lbnQpO1xuICAgIHRoaXMuX191bmlmb3JtQnVmZmVyT2Zmc2V0QWxpZ25tZW50ID0gb2Zmc2V0QWxpZ25tZW50O1xuICAgIHRoaXMuX19tYXhVbmlmb3JtQmxvY2tTaXplID0gbWF4QmxvY2tTaXplO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhbmQgY2FjaGVzIHRoZSBtYXhpbXVtIG51bWJlciBvZiB1bmlmb3JtIHZlY3RvcnMgZm9yIHZlcnRleCBhbmQgZnJhZ21lbnQgc2hhZGVycy5cbiAgICovXG4gIHByaXZhdGUgX19nZXRNYXhVbmlmb3JtVmVjdG9ycygpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2V0UmF3Q29udGV4dCgpO1xuICAgIHRoaXMuX19tYXhWZXJ0ZXhVbmlmb3JtVmVjdG9ycyA9IGdsLmdldFBhcmFtZXRlcihnbC5NQVhfVkVSVEVYX1VOSUZPUk1fVkVDVE9SUykgYXMgbnVtYmVyO1xuICAgIHRoaXMuX19tYXhWZXJ0ZXhVbmlmb3JtVmVjdG9ycyA9IGdsLmdldFBhcmFtZXRlcihnbC5NQVhfVkVSVEVYX1VOSUZPUk1fVkVDVE9SUykgYXMgbnVtYmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhbmQgY2FjaGVzIHRoZSBtYXhpbXVtIHRleHR1cmUgc2l6ZS5cbiAgICovXG4gIHByaXZhdGUgX19nZXRNYXhUZXh0dXJlU2l6ZSgpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2V0UmF3Q29udGV4dCgpO1xuICAgIHRoaXMuX19tYXhUZXh0dXJlU2l6ZSA9IGdsLmdldFBhcmFtZXRlcihnbC5NQVhfVEVYVFVSRV9TSVpFKSBhcyBudW1iZXI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF4aW11bSB0ZXh0dXJlIHNpemUuXG4gICAqIEByZXR1cm5zIFRoZSBtYXhpbXVtIHRleHR1cmUgc2l6ZVxuICAgKi9cbiAgZ2V0TWF4VGV4dHVyZVNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19tYXhUZXh0dXJlU2l6ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXhpbXVtIG51bWJlciBvZiB1bmlmb3JtIGJsb2NrcyB0aGF0IGNhbiBiZSB1c2VkIGluIGJvdGggdmVydGV4IGFuZCBmcmFnbWVudCBzaGFkZXJzLlxuICAgKiBAcmV0dXJucyBUaGUgbWluaW11bSBvZiB2ZXJ0ZXggYW5kIGZyYWdtZW50IHNoYWRlciB1bmlmb3JtIGJsb2NrIGxpbWl0c1xuICAgKi9cbiAgZ2V0TWF4Q29udmVudGlvblVuaWZvcm1CbG9ja3MoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19tYXhDb252ZW50aW9uVW5pZm9ybUJsb2NrcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXhpbXVtIHVuaWZvcm0gYmxvY2sgc2l6ZSBhbGlnbmVkIHRvIHRoZSByZXF1aXJlZCBvZmZzZXQgYWxpZ25tZW50LlxuICAgKiBAcmV0dXJucyBUaGUgYWxpZ25lZCBtYXhpbXVtIHVuaWZvcm0gYmxvY2sgc2l6ZSBpbiBieXRlc1xuICAgKi9cbiAgZ2V0QWxpZ25lZE1heFVuaWZvcm1CbG9ja1NpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19hbGlnbmVkTWF4VW5pZm9ybUJsb2NrU2l6ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXhpbXVtIG51bWJlciBvZiB1bmlmb3JtIHZlY3RvcnMgYXZhaWxhYmxlIGluIHZlcnRleCBzaGFkZXJzLlxuICAgKiBAcmV0dXJucyBUaGUgbWF4aW11bSB2ZXJ0ZXggdW5pZm9ybSB2ZWN0b3JzXG4gICAqL1xuICBnZXRNYXhWZXJ0ZXhVbmlmb3JtVmVjdG9ycygpIHtcbiAgICByZXR1cm4gdGhpcy5fX21heFZlcnRleFVuaWZvcm1WZWN0b3JzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1heGltdW0gbnVtYmVyIG9mIHVuaWZvcm0gdmVjdG9ycyBhdmFpbGFibGUgaW4gZnJhZ21lbnQgc2hhZGVycy5cbiAgICogQHJldHVybnMgVGhlIG1heGltdW0gZnJhZ21lbnQgdW5pZm9ybSB2ZWN0b3JzXG4gICAqL1xuICBnZXRNYXhGcmFnbWVudFVuaWZvcm1WZWN0b3JzKCkge1xuICAgIHJldHVybiB0aGlzLl9fbWF4RnJhZ21lbnRVbmlmb3JtVmVjdG9ycztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIFdlYkdMIG1lbW9yeSB1c2FnZSBpbmZvcm1hdGlvbiBpZiB0aGUgR01BTl9XRUJHTF9NRU1PUlkgZXh0ZW5zaW9uIGlzIGF2YWlsYWJsZS5cbiAgICogQHJldHVybnMgTWVtb3J5IGluZm9ybWF0aW9uIG9iamVjdCBvciB1bmRlZmluZWQgaWYgZXh0ZW5zaW9uIGlzIG5vdCBhdmFpbGFibGVcbiAgICovXG4gIGdldFdlYkdMTWVtb3J5SW5mbygpIHtcbiAgICBpZiAodGhpcy53ZWJnbDJFeHRHbWFuV00pIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMud2ViZ2wyRXh0R21hbldNLmdldE1lbW9yeUluZm8oKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgbXVsdGl2aWV3IHJlbmRlcmluZyBpcyBzdXBwb3J0ZWQgYW5kIGVuYWJsZWQuXG4gICAqIEByZXR1cm5zIFRydWUgaWYgbXVsdGl2aWV3IGlzIGF2YWlsYWJsZSBhbmQgZW5hYmxlZCBmb3IgV2ViVlJcbiAgICovXG4gIGlzTXVsdGl2aWV3KGNvbmZpZzogQ29uZmlnKSB7XG4gICAgcmV0dXJuIHRoaXMuX19pc19tdWx0aXZpZXcgJiYgY29uZmlnLm11bHRpVmlld0ZvcldlYlZSO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBRUEsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsY0FBYztBQUV2QixTQUFTLHNC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
