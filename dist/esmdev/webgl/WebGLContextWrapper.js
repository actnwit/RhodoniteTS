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
    this.BC = 1;
    this.width = 0;
    this.height = 0;
    this.CC = -1;
    this.uC = [];
    this.vC = [];
    this.wC = [];
    this.oC = /* @__PURE__ */ new Map();
    this.DC = /* @__PURE__ */ new Map();
    this.xC = 0;
    this.yC = 0;
    this.rC = 0;
    this.sC = 0;
    this.LC = 0;
    this.MC = 0;
    this.EC = 0;
    this.FC = 0;
    this.GC = INVALID_SIZE;
    this.HC = INVALID_SIZE;
    this.IC = INVALID_SIZE;
    this.JC = INVALID_SIZE;
    this.NC = INVALID_SIZE;
    this.OC = INVALID_SIZE;
    this.zC = INVALID_SIZE;
    this.PC = INVALID_SIZE;
    this.KC = INVALID_SIZE;
    this._isWebXRMode = false;
    /**
     * Cached results of getExtension / vendor-prefixed getExtension.
     * Values are WebGL extension API objects (distinct from WebGLResource: buffers, textures, programs, etc.).
     */
    this.tC = /* @__PURE__ */ new Map();
    this.mC = gl;
    this.width = canvas.width;
    this.height = canvas.height;
    this.canvas = canvas;
    this.rC = this.EC = this.width;
    this.sC = this.FC = this.height;
    this.AC = true;
    if (this.mC.constructor.name === "WebGL2RenderingContext") {
      this.BC = 2;
      this.webgl2ExtTFL = this.nC(config, WebGLExtension.TextureFloatLinear);
      this.webgl2ExtTHFL = this.nC(config, WebGLExtension.TextureHalfFloatLinear);
      this.webgl2ExtTFA = this.nC(config, WebGLExtension.TextureFilterAnisotropic);
      this.webgl2ExtCBF = this.nC(config, WebGLExtension.ColorBufferFloatWebGL2);
      this.webgl2ExtCBHF = this.nC(config, WebGLExtension.ColorBufferHalfFloatWebGL2);
      this.webgl2ExtCTAstc = this.qC(config, WebGLExtension.CompressedTextureAstc);
      this.webgl2ExtCTS3tc = this.qC(config, WebGLExtension.CompressedTextureS3tc);
      this.webgl2ExtCTPvrtc = this.qC(config, WebGLExtension.CompressedTexturePvrtc);
      this.webgl2ExtCTAtc = this.qC(config, WebGLExtension.CompressedTextureAtc);
      this.webgl2ExtCTEtc = this.qC(config, WebGLExtension.CompressedTextureEtc);
      this.webgl2ExtCTEtc1 = this.qC(config, WebGLExtension.CompressedTextureEtc1);
      this.webgl2ExtCTBptc = this.qC(config, WebGLExtension.CompressedTextureBptc);
      this.webgl2ExtMLTVIEW = this.nC(config, WebGLExtension.OculusMultiview);
      if (this.webgl2ExtMLTVIEW) {
        this.webgl2ExtMLTVIEW.is_multisample = true;
      } else {
        this.webgl2ExtMLTVIEW = this.nC(config, WebGLExtension.OvrMultiview2);
        if (this.webgl2ExtMLTVIEW) {
          this.webgl2ExtMLTVIEW.is_multisample = false;
        } else {
          if (config.cgApiDebugConsoleOutput) {
            Logger.default.info("OCULUS_multiview and OVR_multiview2 extensions are not supported");
          }
          this.AC = false;
        }
      }
      this.webgl2ExtClipCtrl = this.nC(config, WebGLExtension.ClipControl);
      this.webgl2ExtMD = this.nC(config, WebGLExtension.MultiDraw);
      if (config.cgApiDebugConsoleOutput) {
        this.webgl2ExtGmanWM = this.nC(config, WebGLExtension.GMAN_WEBGL_MEMORY);
      }
    }
    this.QC();
    this.RC();
    this.SC();
  }
  /**
   * Gets the raw WebGL rendering context.
   * @returns The underlying WebGL context (WebGL1 or WebGL2)
   */
  getRawContext() {
    return this.mC;
  }
  /**
   * Gets the raw WebGL context cast as WebGL1.
   * @returns The underlying WebGL context as WebGL1 type
   */
  getRawContextAsWebGL1() {
    return this.mC;
  }
  /**
   * Gets the raw WebGL context cast as WebGL2.
   * @returns The underlying WebGL context as WebGL2 type
   */
  getRawContextAsWebGL2() {
    return this.mC;
  }
  /**
   * Gets the current viewport settings.
   * @returns A Vector4 containing viewport left, top, width, and height
   */
  get viewport() {
    return Vector4.fromCopyArray([
      this.xC,
      this.yC,
      this.rC,
      this.sC
    ]);
  }
  /**
   * Gets the default viewport settings.
   * @returns A Vector4 containing default viewport left, top, width, and height
   */
  get defaultViewport() {
    return Vector4.fromCopyArray([
      this.LC,
      this.MC,
      this.EC,
      this.FC
    ]);
  }
  /**
   * Checks if a WebGL1 extension is supported.
   * @param webGLExtension - The WebGL extension to check
   * @returns True if the extension is supported, false otherwise
   */
  isSupportWebGL1Extension(config, webGLExtension) {
    if (this.nC(config, webGLExtension)) {
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
    if (this.BC === 2) {
      return true;
    }
    return false;
  }
  /**
   * Creates a new vertex array object.
   * @returns A new WebGL vertex array object
   */
  createVertexArray() {
    return this.mC.createVertexArray();
  }
  /**
   * Deletes a vertex array object.
   * @param vertexArray - The vertex array object to delete
   */
  deleteVertexArray(vertexArray) {
    this.mC.deleteVertexArray(vertexArray);
  }
  /**
   * Binds a vertex array object.
   * @param vao - The vertex array object to bind, or null to unbind
   */
  bindVertexArray(vao) {
    this.mC.bindVertexArray(vao);
  }
  /**
   * Sets the divisor for instanced rendering for a vertex attribute.
   * @param index - The index of the vertex attribute
   * @param divisor - The divisor value (0 for per-vertex, 1+ for per-instance)
   */
  vertexAttribDivisor(index, divisor) {
    this.mC.vertexAttribDivisor(index, divisor);
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
    this.mC.drawElementsInstanced(primitiveMode, indexCount, type, offset, instanceCount);
  }
  /**
   * Draws arrays with instancing support.
   * @param primitiveMode - The primitive mode (GL_TRIANGLES, etc.)
   * @param first - The starting index in the enabled arrays
   * @param count - The number of vertices to draw
   * @param instanceCount - The number of instances to draw
   */
  drawArraysInstanced(primitiveMode, first, count, instanceCount) {
    this.mC.drawArraysInstanced(primitiveMode, first, count, instanceCount);
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
      this.mC.drawElementsInstanced(
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
      this.mC.drawArraysInstanced(
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
    const gl = this.mC;
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
  pC(activeTextureIndex) {
    if (this.CC === activeTextureIndex) {
      return;
    }
    this.mC.activeTexture(this.mC.TEXTURE0 + activeTextureIndex);
    this.CC = activeTextureIndex;
  }
  /**
   * Binds a 2D texture to a specific texture unit.
   * Optimized to avoid redundant state changes.
   * @param activeTextureIndex - The texture unit index
   * @param texture - The 2D texture to bind
   */
  bindTexture2D(activeTextureIndex, texture) {
    const tex = this.oC.get(activeTextureIndex);
    if (tex !== texture) {
      this.pC(activeTextureIndex);
      this.mC.bindTexture(this.mC.TEXTURE_2D, texture);
      this.oC.set(activeTextureIndex, texture);
    }
    this.uC[activeTextureIndex] = texture;
  }
  /**
   * Binds a 2D array texture to a specific texture unit.
   * Optimized to avoid redundant state changes.
   * @param activeTextureIndex - The texture unit index
   * @param texture - The 2D array texture to bind
   */
  bindTexture2DArray(activeTextureIndex, texture) {
    const tex = this.oC.get(activeTextureIndex);
    if (tex !== texture) {
      this.pC(activeTextureIndex);
      this.mC.bindTexture(this.mC.TEXTURE_2D_ARRAY, texture);
      this.oC.set(activeTextureIndex, texture);
    }
    this.vC[activeTextureIndex] = texture;
  }
  /**
   * Binds a sampler object to a specific texture unit.
   * Optimized to avoid redundant state changes.
   * @param activeTextureIndex - The texture unit index
   * @param sampler - The sampler object to bind
   */
  bindTextureSampler(activeTextureIndex, sampler) {
    const samp = this.DC.get(activeTextureIndex);
    if (samp !== sampler) {
      this.mC.bindSampler(activeTextureIndex, sampler);
      this.DC.set(activeTextureIndex, sampler);
    }
  }
  /**
   * Binds a cube map texture to a specific texture unit.
   * Optimized to avoid redundant state changes.
   * @param activeTextureIndex - The texture unit index
   * @param texture - The cube map texture to bind
   */
  bindTextureCube(activeTextureIndex, texture) {
    const tex = this.oC.get(activeTextureIndex);
    if (tex !== texture) {
      this.pC(activeTextureIndex);
      this.mC.bindTexture(this.mC.TEXTURE_CUBE_MAP, texture);
      this.oC.set(activeTextureIndex, texture);
    }
    this.wC[activeTextureIndex] = texture;
  }
  /**
   * Unbinds a 2D texture from a specific texture unit.
   * @param activeTextureIndex - The texture unit index
   */
  unbindTexture2D(activeTextureIndex) {
    this.pC(activeTextureIndex);
    this.mC.bindTexture(this.mC.TEXTURE_2D, null);
    this.oC.delete(activeTextureIndex);
    delete this.uC[activeTextureIndex];
  }
  /**
   * Unbinds a 2D array texture from a specific texture unit.
   * @param activeTextureIndex - The texture unit index
   */
  unbindTexture2DArray(activeTextureIndex) {
    this.pC(activeTextureIndex);
    this.mC.bindTexture(this.mC.TEXTURE_2D_ARRAY, null);
    this.oC.delete(activeTextureIndex);
    delete this.vC[activeTextureIndex];
  }
  /**
   * Unbinds a cube map texture from a specific texture unit.
   * @param activeTextureIndex - The texture unit index
   */
  unbindTextureCube(activeTextureIndex) {
    this.pC(activeTextureIndex);
    this.mC.bindTexture(this.mC.TEXTURE_CUBE_MAP, null);
    this.oC.delete(activeTextureIndex);
    delete this.wC[activeTextureIndex];
  }
  /**
   * Unbinds all currently bound textures from all texture units.
   * This is useful for cleanup operations.
   */
  unbindTextures() {
    for (let i = 0; i < this.uC.length; i++) {
      if (this.uC[i] == null) {
        continue;
      }
      this.pC(15);
      this.mC.bindTexture(this.mC.TEXTURE_2D, null);
      delete this.uC[i];
    }
    for (let i = 0; i < this.vC.length; i++) {
      if (this.vC[i] == null) {
        continue;
      }
      this.pC(15);
      this.mC.bindTexture(this.mC.TEXTURE_2D_ARRAY, null);
      delete this.vC[i];
    }
    for (let i = 0; i < this.wC.length; i++) {
      if (this.wC[i] == null) {
        continue;
      }
      this.pC(15);
      this.mC.bindTexture(this.mC.TEXTURE_CUBE_MAP, null);
      delete this.wC[i];
    }
  }
  /**
   * Gets a WebGL extension and caches it for future use.
   * @param config - The configuration for the WebGL context
   * @param extension - The extension to retrieve
   * @returns The extension object or null if not available
   */
  nC(config, extension) {
    const gl = this.mC;
    if (!this.tC.has(extension)) {
      const extObj = gl.getExtension(extension.toString());
      if (extObj == null && config.cgApiDebugConsoleOutput) {
        const text = `${extension.toString()} Not Available in this environment`;
        Logger.default.info(text);
      }
      this.tC.set(extension, extObj);
      return extObj;
    }
    return this.tC.get(extension);
  }
  /**
   * Gets a compressed texture extension with vendor prefix support.
   * @param extension - The compressed texture extension to retrieve
   * @returns The extension object or null if not available
   */
  qC(config, extension) {
    var _a, _b;
    const gl = this.mC;
    if (!this.tC.has(extension)) {
      const extensionName = extension.toString();
      const extObj = (_b = (_a = gl.getExtension(extensionName)) != null ? _a : gl.getExtension(`MOZ_${extensionName}`)) != null ? _b : gl.getExtension(`WEBKIT_${extensionName}`);
      if (extObj == null && config.cgApiDebugConsoleOutput) {
        const text = `${extension.toString()} Not Available in this environment`;
        Logger.default.info(text);
      } else {
        this.tC.set(extension, extObj);
      }
      return extObj;
    }
    return this.tC.get(extension);
  }
  /**
   * Sets the viewport with optimization to avoid redundant state changes.
   * @param left - Left coordinate of the viewport
   * @param top - Top coordinate of the viewport
   * @param width - Width of the viewport
   * @param height - Height of the viewport
   */
  setViewport(left, top, width, height) {
    const gl = this.mC;
    if (this.rC !== width || this.sC !== height || this.xC !== left || this.yC !== top) {
      gl.viewport(left, top, width, height);
      this.xC = left;
      this.yC = top;
      this.rC = width;
      this.sC = height;
    }
  }
  /**
   * Sets the viewport using a Vector4 with optimization to avoid redundant state changes.
   * @param viewport - Vector4 containing left, top, width, and height
   */
  setViewportAsVector4(viewport) {
    const gl = this.mC;
    if (this.rC !== viewport.z || this.sC !== viewport.w || this.xC !== viewport.x || this.yC !== viewport.y) {
      gl.viewport(viewport.x, viewport.y, viewport.z, viewport.w);
      this.xC = viewport.x;
      this.yC = viewport.y;
      this.rC = viewport.z;
      this.sC = viewport.w;
    }
  }
  /**
   * Retrieves and caches uniform buffer information for WebGL2.
   * This includes alignment requirements and size limits.
   */
  QC() {
    if (!this.isWebGL2) {
      return;
    }
    const gl = this.mC;
    const offsetAlignment = gl.getParameter(gl.UNIFORM_BUFFER_OFFSET_ALIGNMENT);
    const maxBlockSize = gl.getParameter(gl.MAX_UNIFORM_BLOCK_SIZE);
    this.HC = gl.getParameter(gl.MAX_VERTEX_UNIFORM_BLOCKS);
    this.IC = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_BLOCKS);
    this.JC = Math.min(this.HC, this.IC);
    this.GC = maxBlockSize - maxBlockSize % offsetAlignment;
    this.NC = offsetAlignment;
    this.OC = maxBlockSize;
  }
  /**
   * Retrieves and caches the maximum number of uniform vectors for vertex and fragment shaders.
   */
  RC() {
    const gl = this.getRawContext();
    this.zC = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
    this.zC = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
  }
  /**
   * Retrieves and caches the maximum texture size.
   */
  SC() {
    const gl = this.getRawContext();
    this.KC = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  }
  /**
   * Gets the maximum texture size.
   * @returns The maximum texture size
   */
  getMaxTextureSize() {
    return this.KC;
  }
  /**
   * Gets the maximum number of uniform blocks that can be used in both vertex and fragment shaders.
   * @returns The minimum of vertex and fragment shader uniform block limits
   */
  getMaxConventionUniformBlocks() {
    return this.JC;
  }
  /**
   * Gets the maximum uniform block size aligned to the required offset alignment.
   * @returns The aligned maximum uniform block size in bytes
   */
  getAlignedMaxUniformBlockSize() {
    return this.GC;
  }
  /**
   * Gets the maximum number of uniform vectors available in vertex shaders.
   * @returns The maximum vertex uniform vectors
   */
  getMaxVertexUniformVectors() {
    return this.zC;
  }
  /**
   * Gets the maximum number of uniform vectors available in fragment shaders.
   * @returns The maximum fragment uniform vectors
   */
  getMaxFragmentUniformVectors() {
    return this.PC;
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
    return this.AC && config.multiViewForWebVR;
  }
};
export {
  WebGLContextWrapper
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3JjL3dlYmdsL1dlYkdMQ29udGV4dFdyYXBwZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgQ29uZmlnIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb3JlL0NvbmZpZyc7XG5pbXBvcnQgdHlwZSB7IFJlbmRlckJ1ZmZlclRhcmdldEVudW0gfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1JlbmRlckJ1ZmZlclRhcmdldCc7XG5pbXBvcnQgeyBWZWN0b3I0IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9tYXRoL1ZlY3RvcjQnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9taXNjL0xvZ2dlcic7XG5pbXBvcnQgdHlwZSB7IEluZGV4LCBTaXplIH0gZnJvbSAnLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgV2ViR0xFeHRlbnNpb24sIHR5cGUgV2ViR0xFeHRlbnNpb25FbnVtIH0gZnJvbSAnLi9XZWJHTEV4dGVuc2lvbic7XG5cbmNvbnN0IElOVkFMSURfU0laRSA9IC0xO1xuXG5pbnRlcmZhY2UgV0VCR0xfY29tcHJlc3NlZF90ZXh0dXJlX2V0YyB7XG4gIHJlYWRvbmx5IENPTVBSRVNTRURfUkdCQThfRVRDMl9FQUM6IG51bWJlcjtcbn1cbmludGVyZmFjZSBXRUJHTF9jb21wcmVzc2VkX3RleHR1cmVfYnB0YyB7XG4gIHJlYWRvbmx5IENPTVBSRVNTRURfUkdCQV9CUFRDX1VOT1JNX0VYVDogbnVtYmVyO1xufVxuXG4vKiogUFZSVEMgKG9mdGVuIGV4cG9zZWQgdmlhIFdFQktJVF8gcHJlZml4KTsgbm90IGFsd2F5cyBwcmVzZW50IGluIFRTIERPTSBsaWJzICovXG5pbnRlcmZhY2UgV0VCS0lUX1dFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9wdnJ0YyB7XG4gIHJlYWRvbmx5IENPTVBSRVNTRURfUkdCX1BWUlRDXzRCUFBWMV9JTUc6IG51bWJlcjtcbiAgcmVhZG9ubHkgQ09NUFJFU1NFRF9SR0JfUFZSVENfMkJQUFYxX0lNRzogbnVtYmVyO1xuICByZWFkb25seSBDT01QUkVTU0VEX1JHQkFfUFZSVENfNEJQUFYxX0lNRzogbnVtYmVyO1xuICByZWFkb25seSBDT01QUkVTU0VEX1JHQkFfUFZSVENfMkJQUFYxX0lNRzogbnVtYmVyO1xufVxuXG4vKiogQVRDIGNvbXByZXNzaW9uIChtb2JpbGUpOyBub3QgYWx3YXlzIHByZXNlbnQgaW4gVFMgRE9NIGxpYnMgKi9cbmludGVyZmFjZSBXRUJHTF9jb21wcmVzc2VkX3RleHR1cmVfYXRjIHtcbiAgcmVhZG9ubHkgQ09NUFJFU1NFRF9SR0JfQVRDX1dFQkdMOiBudW1iZXI7XG4gIHJlYWRvbmx5IENPTVBSRVNTRURfUkdCQV9BVENfRVhQTElDSVRfQUxQSEFfV0VCR0w6IG51bWJlcjtcbiAgcmVhZG9ubHkgQ09NUFJFU1NFRF9SR0JBX0FUQ19JTlRFUlBPTEFURURfQUxQSEFfV0VCR0w6IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIFdFQkdMX211bHRpdmlldyB7XG4gIGZyYW1lYnVmZmVyVGV4dHVyZU11bHRpdmlld09WUihcbiAgICB0YXJnZXQ6IG51bWJlcixcbiAgICBhdHRhY2htZW50OiBudW1iZXIsXG4gICAgdGV4dHVyZTogV2ViR0xUZXh0dXJlLFxuICAgIGxldmVsOiBudW1iZXIsXG4gICAgYmFzZVZpZXdJbmRleDogbnVtYmVyLFxuICAgIG51bVZpZXdzOiBudW1iZXJcbiAgKTogdm9pZDtcbiAgZnJhbWVidWZmZXJUZXh0dXJlTXVsdGlzYW1wbGVNdWx0aXZpZXdPVlIoXG4gICAgdGFyZ2V0OiBudW1iZXIsXG4gICAgYXR0YWNobWVudDogbnVtYmVyLFxuICAgIHRleHR1cmU6IFdlYkdMVGV4dHVyZSxcbiAgICBsZXZlbDogbnVtYmVyLFxuICAgIHNhbXBsZXM6IG51bWJlcixcbiAgICBiYXNlVmlld0luZGV4OiBudW1iZXIsXG4gICAgbnVtVmlld3M6IG51bWJlclxuICApOiB2b2lkO1xuICBpc19tdWx0aXNhbXBsZTogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBBIHdyYXBwZXIgY2xhc3MgZm9yIFdlYkdMIGNvbnRleHQgdGhhdCBwcm92aWRlcyBlbmhhbmNlZCBmdW5jdGlvbmFsaXR5IGFuZCBzdGF0ZSBtYW5hZ2VtZW50LlxuICogVGhpcyBjbGFzcyBoYW5kbGVzIFdlYkdMIHN0YXRlIG9wdGltaXphdGlvbiwgZXh0ZW5zaW9uIG1hbmFnZW1lbnQsIGFuZCBwcm92aWRlcyBjb252ZW5pZW5jZSBtZXRob2RzXG4gKiBmb3IgY29tbW9uIFdlYkdMIG9wZXJhdGlvbnMgd2hpbGUgbWFpbnRhaW5pbmcgY29tcGF0aWJpbGl0eSB3aXRoIGJvdGggV2ViR0wxIGFuZCBXZWJHTDIuXG4gKi9cbmV4cG9ydCBjbGFzcyBXZWJHTENvbnRleHRXcmFwcGVyIHtcbiAgX19nbDogV2ViR0wyUmVuZGVyaW5nQ29udGV4dDtcbiAgX193ZWJnbFZlcnNpb24gPSAxO1xuICBwdWJsaWMgd2lkdGg6IFNpemUgPSAwO1xuICBwdWJsaWMgaGVpZ2h0OiBTaXplID0gMDtcbiAgcHVibGljIHJlYWRvbmx5IGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDFFeHRWQU8/OiBPRVNfdmVydGV4X2FycmF5X29iamVjdDtcbiAgcHVibGljIHJlYWRvbmx5IHdlYmdsMUV4dElBPzogQU5HTEVfaW5zdGFuY2VkX2FycmF5cztcbiAgcHVibGljIHJlYWRvbmx5IHdlYmdsMUV4dFRGPzogT0VTX3RleHR1cmVfZmxvYXQ7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDFFeHRUSEY/OiBPRVNfdGV4dHVyZV9oYWxmX2Zsb2F0O1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViZ2wxRXh0VEZMPzogT0VTX3RleHR1cmVfZmxvYXRfbGluZWFyO1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViZ2wxRXh0VEhGTD86IE9FU190ZXh0dXJlX2hhbGZfZmxvYXRfbGluZWFyO1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViZ2wxRXh0VEZBPzogRVhUX3RleHR1cmVfZmlsdGVyX2FuaXNvdHJvcGljO1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViZ2wxRXh0RUlVST86IE9FU19lbGVtZW50X2luZGV4X3VpbnQ7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDFFeHRTVEw/OiBFWFRfc2hhZGVyX3RleHR1cmVfbG9kO1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViZ2wxRXh0RFJWPzogT0VTX3N0YW5kYXJkX2Rlcml2YXRpdmVzO1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViZ2wxRXh0REI/OiBXRUJHTF9kcmF3X2J1ZmZlcnM7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDFFeHRCTT86IEVYVF9ibGVuZF9taW5tYXg7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDFFeHRDQkY/OiBXRUJHTF9jb2xvcl9idWZmZXJfZmxvYXQ7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDFFeHRDVEFzdGM/OiBXRUJHTF9jb21wcmVzc2VkX3RleHR1cmVfYXN0YztcbiAgcHVibGljIHJlYWRvbmx5IHdlYmdsMUV4dENUUzN0Yz86IFdFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9zM3RjO1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViZ2wxRXh0Q1RQdnJ0Yz86IFdFQktJVF9XRUJHTF9jb21wcmVzc2VkX3RleHR1cmVfcHZydGM7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDFFeHRDVEF0Yz86IFdFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9hdGM7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDFFeHRDVEV0Yz86IFdFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9ldGM7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDFFeHRDVEV0YzE/OiBXRUJHTF9jb21wcmVzc2VkX3RleHR1cmVfZXRjMTtcbiAgcHVibGljIHJlYWRvbmx5IHdlYmdsMUV4dENUQnB0Yz86IFdFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9icHRjO1xuXG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDJFeHRURkw/OiBPRVNfdGV4dHVyZV9mbG9hdF9saW5lYXI7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDJFeHRUSEZMPzogT0VTX3RleHR1cmVfaGFsZl9mbG9hdF9saW5lYXI7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDJFeHRURkE/OiBFWFRfdGV4dHVyZV9maWx0ZXJfYW5pc290cm9waWM7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDJFeHRDQkY/OiBFWFRfY29sb3JfYnVmZmVyX2Zsb2F0O1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViZ2wyRXh0Q0JIRj86IEVYVF9jb2xvcl9idWZmZXJfaGFsZl9mbG9hdDtcbiAgcHVibGljIHJlYWRvbmx5IHdlYmdsMkV4dENUQXN0Yz86IFdFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9hc3RjO1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViZ2wyRXh0Q1RTM3RjPzogV0VCR0xfY29tcHJlc3NlZF90ZXh0dXJlX3MzdGM7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDJFeHRDVFB2cnRjPzogV0VCS0lUX1dFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9wdnJ0YztcbiAgcHVibGljIHJlYWRvbmx5IHdlYmdsMkV4dENUQXRjPzogV0VCR0xfY29tcHJlc3NlZF90ZXh0dXJlX2F0YztcbiAgcHVibGljIHJlYWRvbmx5IHdlYmdsMkV4dENURXRjPzogV0VCR0xfY29tcHJlc3NlZF90ZXh0dXJlX2V0YztcbiAgcHVibGljIHJlYWRvbmx5IHdlYmdsMkV4dENURXRjMT86IFdFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9ldGMxO1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViZ2wyRXh0Q1RCcHRjPzogV0VCR0xfY29tcHJlc3NlZF90ZXh0dXJlX2JwdGM7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDJFeHRNTFRWSUVXPzogV0VCR0xfbXVsdGl2aWV3O1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViZ2wyRXh0Q2xpcEN0cmw/OiBhbnk7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDJFeHRHbWFuV00/OiBhbnk7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJnbDJFeHRNRD86IFdFQkdMX211bHRpX2RyYXcgfCBudWxsO1xuXG4gIHByaXZhdGUgX19hY3RpdmVUZXh0dXJlQmFja3VwOiBJbmRleCA9IC0xO1xuICBwcml2YXRlIF9fYWN0aXZlVGV4dHVyZXMyRDogV2ViR0xUZXh0dXJlW10gPSBbXTtcbiAgcHJpdmF0ZSBfX2FjdGl2ZVRleHR1cmVzMkRBcnJheTogV2ViR0xUZXh0dXJlW10gPSBbXTtcbiAgcHJpdmF0ZSBfX2FjdGl2ZVRleHR1cmVzQ3ViZTogV2ViR0xUZXh0dXJlW10gPSBbXTtcbiAgcHJpdmF0ZSBfX2JvdW5kVGV4dHVyZXM6IE1hcDxJbmRleCwgV2ViR0xUZXh0dXJlPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfX2JvdW5kU2FtcGxlcnM6IE1hcDxJbmRleCwgV2ViR0xTYW1wbGVyPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfX3ZpZXdwb3J0X2xlZnQgPSAwO1xuICBwcml2YXRlIF9fdmlld3BvcnRfdG9wID0gMDtcbiAgcHJpdmF0ZSBfX3ZpZXdwb3J0X3dpZHRoID0gMDtcbiAgcHJpdmF0ZSBfX3ZpZXdwb3J0X2hlaWdodCA9IDA7XG4gIHByaXZhdGUgX19kZWZhdWx0X3ZpZXdwb3J0X2xlZnQgPSAwO1xuICBwcml2YXRlIF9fZGVmYXVsdF92aWV3cG9ydF90b3AgPSAwO1xuICBwcml2YXRlIF9fZGVmYXVsdF92aWV3cG9ydF93aWR0aCA9IDA7XG4gIHByaXZhdGUgX19kZWZhdWx0X3ZpZXdwb3J0X2hlaWdodCA9IDA7XG4gIHByaXZhdGUgX19hbGlnbmVkTWF4VW5pZm9ybUJsb2NrU2l6ZSA9IElOVkFMSURfU0laRTtcbiAgcHJpdmF0ZSBfX21heFZlcnRleFVuaWZvcm1CbG9ja3MgPSBJTlZBTElEX1NJWkU7XG4gIHByaXZhdGUgX19tYXhGcmFnbWVudFVuaWZvcm1CbG9ja3MgPSBJTlZBTElEX1NJWkU7XG4gIHByaXZhdGUgX19tYXhDb252ZW50aW9uVW5pZm9ybUJsb2NrcyA9IElOVkFMSURfU0laRTtcbiAgcHJpdmF0ZSBfX3VuaWZvcm1CdWZmZXJPZmZzZXRBbGlnbm1lbnQgPSBJTlZBTElEX1NJWkU7XG4gIHByaXZhdGUgX19tYXhVbmlmb3JtQmxvY2tTaXplID0gSU5WQUxJRF9TSVpFO1xuICBwcml2YXRlIF9fbWF4VmVydGV4VW5pZm9ybVZlY3RvcnMgPSBJTlZBTElEX1NJWkU7XG4gIHByaXZhdGUgX19tYXhGcmFnbWVudFVuaWZvcm1WZWN0b3JzID0gSU5WQUxJRF9TSVpFO1xuICBwcml2YXRlIF9fbWF4VGV4dHVyZVNpemU6IFNpemUgPSBJTlZBTElEX1NJWkU7XG4gIHByaXZhdGUgcmVhZG9ubHkgX19pc19tdWx0aXZpZXc6IGJvb2xlYW47XG4gIF9pc1dlYlhSTW9kZSA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBDYWNoZWQgcmVzdWx0cyBvZiBnZXRFeHRlbnNpb24gLyB2ZW5kb3ItcHJlZml4ZWQgZ2V0RXh0ZW5zaW9uLlxuICAgKiBWYWx1ZXMgYXJlIFdlYkdMIGV4dGVuc2lvbiBBUEkgb2JqZWN0cyAoZGlzdGluY3QgZnJvbSBXZWJHTFJlc291cmNlOiBidWZmZXJzLCB0ZXh0dXJlcywgcHJvZ3JhbXMsIGV0Yy4pLlxuICAgKi9cbiAgX19leHRlbnNpb25zOiBNYXA8V2ViR0xFeHRlbnNpb25FbnVtLCBvYmplY3QgfCBudWxsPiA9IG5ldyBNYXAoKTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBXZWJHTENvbnRleHRXcmFwcGVyIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gY29uZmlnIC0gVGhlIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBXZWJHTCBjb250ZXh0XG4gICAqIEBwYXJhbSBnbCAtIFRoZSBXZWJHTDIgcmVuZGVyaW5nIGNvbnRleHQgdG8gd3JhcFxuICAgKiBAcGFyYW0gY2FudmFzIC0gVGhlIEhUTUwgY2FudmFzIGVsZW1lbnQgYXNzb2NpYXRlZCB3aXRoIHRoZSBjb250ZXh0XG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjb25maWc6IENvbmZpZywgZ2w6IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQsIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpIHtcbiAgICB0aGlzLl9fZ2wgPSBnbDtcbiAgICB0aGlzLndpZHRoID0gY2FudmFzLndpZHRoO1xuICAgIHRoaXMuaGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcbiAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcbiAgICB0aGlzLl9fdmlld3BvcnRfd2lkdGggPSB0aGlzLl9fZGVmYXVsdF92aWV3cG9ydF93aWR0aCA9IHRoaXMud2lkdGg7XG4gICAgdGhpcy5fX3ZpZXdwb3J0X2hlaWdodCA9IHRoaXMuX19kZWZhdWx0X3ZpZXdwb3J0X2hlaWdodCA9IHRoaXMuaGVpZ2h0O1xuXG4gICAgdGhpcy5fX2lzX211bHRpdmlldyA9IHRydWU7XG5cbiAgICBpZiAodGhpcy5fX2dsLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdXZWJHTDJSZW5kZXJpbmdDb250ZXh0Jykge1xuICAgICAgdGhpcy5fX3dlYmdsVmVyc2lvbiA9IDI7XG4gICAgICB0aGlzLndlYmdsMkV4dFRGTCA9IHRoaXMuX19nZXRFeHRlbnNpb24oY29uZmlnLCBXZWJHTEV4dGVuc2lvbi5UZXh0dXJlRmxvYXRMaW5lYXIpO1xuICAgICAgdGhpcy53ZWJnbDJFeHRUSEZMID0gdGhpcy5fX2dldEV4dGVuc2lvbihjb25maWcsIFdlYkdMRXh0ZW5zaW9uLlRleHR1cmVIYWxmRmxvYXRMaW5lYXIpO1xuICAgICAgdGhpcy53ZWJnbDJFeHRURkEgPSB0aGlzLl9fZ2V0RXh0ZW5zaW9uKGNvbmZpZywgV2ViR0xFeHRlbnNpb24uVGV4dHVyZUZpbHRlckFuaXNvdHJvcGljKTtcbiAgICAgIHRoaXMud2ViZ2wyRXh0Q0JGID0gdGhpcy5fX2dldEV4dGVuc2lvbihjb25maWcsIFdlYkdMRXh0ZW5zaW9uLkNvbG9yQnVmZmVyRmxvYXRXZWJHTDIpO1xuICAgICAgdGhpcy53ZWJnbDJFeHRDQkhGID0gdGhpcy5fX2dldEV4dGVuc2lvbihjb25maWcsIFdlYkdMRXh0ZW5zaW9uLkNvbG9yQnVmZmVySGFsZkZsb2F0V2ViR0wyKTtcbiAgICAgIHRoaXMud2ViZ2wyRXh0Q1RBc3RjID0gdGhpcy5fX2dldENvbXByZXNzZWRUZXh0dXJlRXh0ZW5zaW9uKGNvbmZpZywgV2ViR0xFeHRlbnNpb24uQ29tcHJlc3NlZFRleHR1cmVBc3RjKTtcbiAgICAgIHRoaXMud2ViZ2wyRXh0Q1RTM3RjID0gdGhpcy5fX2dldENvbXByZXNzZWRUZXh0dXJlRXh0ZW5zaW9uKGNvbmZpZywgV2ViR0xFeHRlbnNpb24uQ29tcHJlc3NlZFRleHR1cmVTM3RjKTtcbiAgICAgIHRoaXMud2ViZ2wyRXh0Q1RQdnJ0YyA9IHRoaXMuX19nZXRDb21wcmVzc2VkVGV4dHVyZUV4dGVuc2lvbihjb25maWcsIFdlYkdMRXh0ZW5zaW9uLkNvbXByZXNzZWRUZXh0dXJlUHZydGMpO1xuICAgICAgdGhpcy53ZWJnbDJFeHRDVEF0YyA9IHRoaXMuX19nZXRDb21wcmVzc2VkVGV4dHVyZUV4dGVuc2lvbihjb25maWcsIFdlYkdMRXh0ZW5zaW9uLkNvbXByZXNzZWRUZXh0dXJlQXRjKTtcbiAgICAgIHRoaXMud2ViZ2wyRXh0Q1RFdGMgPSB0aGlzLl9fZ2V0Q29tcHJlc3NlZFRleHR1cmVFeHRlbnNpb24oY29uZmlnLCBXZWJHTEV4dGVuc2lvbi5Db21wcmVzc2VkVGV4dHVyZUV0Yyk7XG4gICAgICB0aGlzLndlYmdsMkV4dENURXRjMSA9IHRoaXMuX19nZXRDb21wcmVzc2VkVGV4dHVyZUV4dGVuc2lvbihjb25maWcsIFdlYkdMRXh0ZW5zaW9uLkNvbXByZXNzZWRUZXh0dXJlRXRjMSk7XG4gICAgICB0aGlzLndlYmdsMkV4dENUQnB0YyA9IHRoaXMuX19nZXRDb21wcmVzc2VkVGV4dHVyZUV4dGVuc2lvbihjb25maWcsIFdlYkdMRXh0ZW5zaW9uLkNvbXByZXNzZWRUZXh0dXJlQnB0Yyk7XG4gICAgICB0aGlzLndlYmdsMkV4dE1MVFZJRVcgPSB0aGlzLl9fZ2V0RXh0ZW5zaW9uKGNvbmZpZywgV2ViR0xFeHRlbnNpb24uT2N1bHVzTXVsdGl2aWV3KTtcbiAgICAgIGlmICh0aGlzLndlYmdsMkV4dE1MVFZJRVcpIHtcbiAgICAgICAgdGhpcy53ZWJnbDJFeHRNTFRWSUVXLmlzX211bHRpc2FtcGxlID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMud2ViZ2wyRXh0TUxUVklFVyA9IHRoaXMuX19nZXRFeHRlbnNpb24oY29uZmlnLCBXZWJHTEV4dGVuc2lvbi5PdnJNdWx0aXZpZXcyKTtcbiAgICAgICAgaWYgKHRoaXMud2ViZ2wyRXh0TUxUVklFVykge1xuICAgICAgICAgIHRoaXMud2ViZ2wyRXh0TUxUVklFVy5pc19tdWx0aXNhbXBsZSA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChjb25maWcuY2dBcGlEZWJ1Z0NvbnNvbGVPdXRwdXQpIHtcbiAgICAgICAgICAgIExvZ2dlci5kZWZhdWx0LmluZm8oJ09DVUxVU19tdWx0aXZpZXcgYW5kIE9WUl9tdWx0aXZpZXcyIGV4dGVuc2lvbnMgYXJlIG5vdCBzdXBwb3J0ZWQnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5fX2lzX211bHRpdmlldyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLndlYmdsMkV4dENsaXBDdHJsID0gdGhpcy5fX2dldEV4dGVuc2lvbihjb25maWcsIFdlYkdMRXh0ZW5zaW9uLkNsaXBDb250cm9sKTtcbiAgICAgIHRoaXMud2ViZ2wyRXh0TUQgPSB0aGlzLl9fZ2V0RXh0ZW5zaW9uKGNvbmZpZywgV2ViR0xFeHRlbnNpb24uTXVsdGlEcmF3KSBhcyBXRUJHTF9tdWx0aV9kcmF3IHwgbnVsbDtcbiAgICAgIGlmIChjb25maWcuY2dBcGlEZWJ1Z0NvbnNvbGVPdXRwdXQpIHtcbiAgICAgICAgdGhpcy53ZWJnbDJFeHRHbWFuV00gPSB0aGlzLl9fZ2V0RXh0ZW5zaW9uKGNvbmZpZywgV2ViR0xFeHRlbnNpb24uR01BTl9XRUJHTF9NRU1PUlkpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9fZ2V0VW5pZm9ybUJ1ZmZlckluZm8oKTtcbiAgICB0aGlzLl9fZ2V0TWF4VW5pZm9ybVZlY3RvcnMoKTtcbiAgICB0aGlzLl9fZ2V0TWF4VGV4dHVyZVNpemUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSByYXcgV2ViR0wgcmVuZGVyaW5nIGNvbnRleHQuXG4gICAqIEByZXR1cm5zIFRoZSB1bmRlcmx5aW5nIFdlYkdMIGNvbnRleHQgKFdlYkdMMSBvciBXZWJHTDIpXG4gICAqL1xuICBnZXRSYXdDb250ZXh0KCk6IFdlYkdMUmVuZGVyaW5nQ29udGV4dCB8IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQge1xuICAgIHJldHVybiB0aGlzLl9fZ2w7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcmF3IFdlYkdMIGNvbnRleHQgY2FzdCBhcyBXZWJHTDEuXG4gICAqIEByZXR1cm5zIFRoZSB1bmRlcmx5aW5nIFdlYkdMIGNvbnRleHQgYXMgV2ViR0wxIHR5cGVcbiAgICovXG4gIGdldFJhd0NvbnRleHRBc1dlYkdMMSgpOiBXZWJHTFJlbmRlcmluZ0NvbnRleHQge1xuICAgIHJldHVybiB0aGlzLl9fZ2wgYXMgV2ViR0xSZW5kZXJpbmdDb250ZXh0O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHJhdyBXZWJHTCBjb250ZXh0IGNhc3QgYXMgV2ViR0wyLlxuICAgKiBAcmV0dXJucyBUaGUgdW5kZXJseWluZyBXZWJHTCBjb250ZXh0IGFzIFdlYkdMMiB0eXBlXG4gICAqL1xuICBnZXRSYXdDb250ZXh0QXNXZWJHTDIoKTogV2ViR0wyUmVuZGVyaW5nQ29udGV4dCB7XG4gICAgcmV0dXJuIHRoaXMuX19nbCBhcyBXZWJHTDJSZW5kZXJpbmdDb250ZXh0O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgdmlld3BvcnQgc2V0dGluZ3MuXG4gICAqIEByZXR1cm5zIEEgVmVjdG9yNCBjb250YWluaW5nIHZpZXdwb3J0IGxlZnQsIHRvcCwgd2lkdGgsIGFuZCBoZWlnaHRcbiAgICovXG4gIGdldCB2aWV3cG9ydCgpIHtcbiAgICByZXR1cm4gVmVjdG9yNC5mcm9tQ29weUFycmF5KFtcbiAgICAgIHRoaXMuX192aWV3cG9ydF9sZWZ0LFxuICAgICAgdGhpcy5fX3ZpZXdwb3J0X3RvcCxcbiAgICAgIHRoaXMuX192aWV3cG9ydF93aWR0aCxcbiAgICAgIHRoaXMuX192aWV3cG9ydF9oZWlnaHQsXG4gICAgXSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZGVmYXVsdCB2aWV3cG9ydCBzZXR0aW5ncy5cbiAgICogQHJldHVybnMgQSBWZWN0b3I0IGNvbnRhaW5pbmcgZGVmYXVsdCB2aWV3cG9ydCBsZWZ0LCB0b3AsIHdpZHRoLCBhbmQgaGVpZ2h0XG4gICAqL1xuICBnZXQgZGVmYXVsdFZpZXdwb3J0KCkge1xuICAgIHJldHVybiBWZWN0b3I0LmZyb21Db3B5QXJyYXkoW1xuICAgICAgdGhpcy5fX2RlZmF1bHRfdmlld3BvcnRfbGVmdCxcbiAgICAgIHRoaXMuX19kZWZhdWx0X3ZpZXdwb3J0X3RvcCxcbiAgICAgIHRoaXMuX19kZWZhdWx0X3ZpZXdwb3J0X3dpZHRoLFxuICAgICAgdGhpcy5fX2RlZmF1bHRfdmlld3BvcnRfaGVpZ2h0LFxuICAgIF0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIFdlYkdMMSBleHRlbnNpb24gaXMgc3VwcG9ydGVkLlxuICAgKiBAcGFyYW0gd2ViR0xFeHRlbnNpb24gLSBUaGUgV2ViR0wgZXh0ZW5zaW9uIHRvIGNoZWNrXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGV4dGVuc2lvbiBpcyBzdXBwb3J0ZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgaXNTdXBwb3J0V2ViR0wxRXh0ZW5zaW9uKGNvbmZpZzogQ29uZmlnLCB3ZWJHTEV4dGVuc2lvbjogV2ViR0xFeHRlbnNpb25FbnVtKSB7XG4gICAgaWYgKHRoaXMuX19nZXRFeHRlbnNpb24oY29uZmlnLCB3ZWJHTEV4dGVuc2lvbikpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGEgV2ViR0wxIGV4dGVuc2lvbiBpcyBub3Qgc3VwcG9ydGVkLlxuICAgKiBAcGFyYW0gd2ViR0xFeHRlbnNpb24gLSBUaGUgV2ViR0wgZXh0ZW5zaW9uIHRvIGNoZWNrXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGV4dGVuc2lvbiBpcyBub3Qgc3VwcG9ydGVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGlzTm90U3VwcG9ydFdlYkdMMUV4dGVuc2lvbihjb25maWc6IENvbmZpZywgd2ViR0xFeHRlbnNpb246IFdlYkdMRXh0ZW5zaW9uRW51bSkge1xuICAgIHJldHVybiAhdGhpcy5pc1N1cHBvcnRXZWJHTDFFeHRlbnNpb24oY29uZmlnLCB3ZWJHTEV4dGVuc2lvbik7XG4gIH1cblxuICAvKipcbiAgICogVHlwZSBndWFyZCB0byBjaGVjayBpZiB0aGUgY29udGV4dCBpcyBXZWJHTDIuXG4gICAqIEBwYXJhbSBnbCAtIFRoZSBXZWJHTCBjb250ZXh0IHRvIGNoZWNrXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGNvbnRleHQgaXMgV2ViR0wyLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGdldElzV2ViR0wyKGdsOiBXZWJHTFJlbmRlcmluZ0NvbnRleHQgfCBXZWJHTDJSZW5kZXJpbmdDb250ZXh0KTogZ2wgaXMgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCB7XG4gICAgcmV0dXJuIHRoaXMuaXNXZWJHTDI7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSBjdXJyZW50IGNvbnRleHQgaXMgV2ViR0wyLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIFdlYkdMMiwgZmFsc2UgaWYgV2ViR0wxXG4gICAqL1xuICBnZXQgaXNXZWJHTDIoKSB7XG4gICAgaWYgKHRoaXMuX193ZWJnbFZlcnNpb24gPT09IDIpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB2ZXJ0ZXggYXJyYXkgb2JqZWN0LlxuICAgKiBAcmV0dXJucyBBIG5ldyBXZWJHTCB2ZXJ0ZXggYXJyYXkgb2JqZWN0XG4gICAqL1xuICBjcmVhdGVWZXJ0ZXhBcnJheSgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2dsLmNyZWF0ZVZlcnRleEFycmF5KCk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlcyBhIHZlcnRleCBhcnJheSBvYmplY3QuXG4gICAqIEBwYXJhbSB2ZXJ0ZXhBcnJheSAtIFRoZSB2ZXJ0ZXggYXJyYXkgb2JqZWN0IHRvIGRlbGV0ZVxuICAgKi9cbiAgZGVsZXRlVmVydGV4QXJyYXkodmVydGV4QXJyYXk6IFdlYkdMVmVydGV4QXJyYXlPYmplY3QgfCBXZWJHTFZlcnRleEFycmF5T2JqZWN0T0VTKSB7XG4gICAgdGhpcy5fX2dsLmRlbGV0ZVZlcnRleEFycmF5KHZlcnRleEFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCaW5kcyBhIHZlcnRleCBhcnJheSBvYmplY3QuXG4gICAqIEBwYXJhbSB2YW8gLSBUaGUgdmVydGV4IGFycmF5IG9iamVjdCB0byBiaW5kLCBvciBudWxsIHRvIHVuYmluZFxuICAgKi9cbiAgYmluZFZlcnRleEFycmF5KHZhbzogV2ViR0xWZXJ0ZXhBcnJheU9iamVjdE9FUyB8IG51bGwpIHtcbiAgICB0aGlzLl9fZ2wuYmluZFZlcnRleEFycmF5KHZhbyk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZGl2aXNvciBmb3IgaW5zdGFuY2VkIHJlbmRlcmluZyBmb3IgYSB2ZXJ0ZXggYXR0cmlidXRlLlxuICAgKiBAcGFyYW0gaW5kZXggLSBUaGUgaW5kZXggb2YgdGhlIHZlcnRleCBhdHRyaWJ1dGVcbiAgICogQHBhcmFtIGRpdmlzb3IgLSBUaGUgZGl2aXNvciB2YWx1ZSAoMCBmb3IgcGVyLXZlcnRleCwgMSsgZm9yIHBlci1pbnN0YW5jZSlcbiAgICovXG4gIHZlcnRleEF0dHJpYkRpdmlzb3IoaW5kZXg6IG51bWJlciwgZGl2aXNvcjogbnVtYmVyKSB7XG4gICAgdGhpcy5fX2dsLnZlcnRleEF0dHJpYkRpdmlzb3IoaW5kZXgsIGRpdmlzb3IpO1xuICB9XG5cbiAgLyoqXG4gICAqIERyYXdzIGVsZW1lbnRzIHdpdGggaW5zdGFuY2luZyBzdXBwb3J0LlxuICAgKiBAcGFyYW0gcHJpbWl0aXZlTW9kZSAtIFRoZSBwcmltaXRpdmUgbW9kZSAoR0xfVFJJQU5HTEVTLCBldGMuKVxuICAgKiBAcGFyYW0gaW5kZXhDb3VudCAtIFRoZSBudW1iZXIgb2YgaW5kaWNlcyB0byBkcmF3XG4gICAqIEBwYXJhbSB0eXBlIC0gVGhlIHR5cGUgb2YgdGhlIGluZGV4IHZhbHVlc1xuICAgKiBAcGFyYW0gb2Zmc2V0IC0gVGhlIG9mZnNldCBpbiB0aGUgaW5kZXggYnVmZmVyXG4gICAqIEBwYXJhbSBpbnN0YW5jZUNvdW50IC0gVGhlIG51bWJlciBvZiBpbnN0YW5jZXMgdG8gZHJhd1xuICAgKi9cbiAgZHJhd0VsZW1lbnRzSW5zdGFuY2VkKFxuICAgIHByaW1pdGl2ZU1vZGU6IG51bWJlcixcbiAgICBpbmRleENvdW50OiBudW1iZXIsXG4gICAgdHlwZTogbnVtYmVyLFxuICAgIG9mZnNldDogbnVtYmVyLFxuICAgIGluc3RhbmNlQ291bnQ6IG51bWJlclxuICApIHtcbiAgICB0aGlzLl9fZ2wuZHJhd0VsZW1lbnRzSW5zdGFuY2VkKHByaW1pdGl2ZU1vZGUsIGluZGV4Q291bnQsIHR5cGUsIG9mZnNldCwgaW5zdGFuY2VDb3VudCk7XG4gIH1cblxuICAvKipcbiAgICogRHJhd3MgYXJyYXlzIHdpdGggaW5zdGFuY2luZyBzdXBwb3J0LlxuICAgKiBAcGFyYW0gcHJpbWl0aXZlTW9kZSAtIFRoZSBwcmltaXRpdmUgbW9kZSAoR0xfVFJJQU5HTEVTLCBldGMuKVxuICAgKiBAcGFyYW0gZmlyc3QgLSBUaGUgc3RhcnRpbmcgaW5kZXggaW4gdGhlIGVuYWJsZWQgYXJyYXlzXG4gICAqIEBwYXJhbSBjb3VudCAtIFRoZSBudW1iZXIgb2YgdmVydGljZXMgdG8gZHJhd1xuICAgKiBAcGFyYW0gaW5zdGFuY2VDb3VudCAtIFRoZSBudW1iZXIgb2YgaW5zdGFuY2VzIHRvIGRyYXdcbiAgICovXG4gIGRyYXdBcnJheXNJbnN0YW5jZWQocHJpbWl0aXZlTW9kZTogbnVtYmVyLCBmaXJzdDogbnVtYmVyLCBjb3VudDogbnVtYmVyLCBpbnN0YW5jZUNvdW50OiBudW1iZXIpIHtcbiAgICB0aGlzLl9fZ2wuZHJhd0FycmF5c0luc3RhbmNlZChwcmltaXRpdmVNb2RlLCBmaXJzdCwgY291bnQsIGluc3RhbmNlQ291bnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIElzc3VlcyBtdWx0aXBsZSBpbnN0YW5jZWQgaW5kZXhlZCBkcmF3cyB3aXRoIG9uZSBjYWxsIHdoZW4gV0VCR0xfbXVsdGlfZHJhdyBpcyBhdmFpbGFibGUuXG4gICAqIEZhbGxzIGJhY2sgdG8gaW5kaXZpZHVhbCBkcmF3RWxlbWVudHNJbnN0YW5jZWQgY2FsbHMgb3RoZXJ3aXNlLlxuICAgKiBUaGUgb2Zmc2V0cyBhcmUgYnl0ZSBvZmZzZXRzIGludG8gdGhlIGN1cnJlbnRseSBib3VuZCBlbGVtZW50IGFycmF5IGJ1ZmZlci5cbiAgICovXG4gIG11bHRpRHJhd0VsZW1lbnRzSW5zdGFuY2VkKFxuICAgIHByaW1pdGl2ZU1vZGU6IG51bWJlcixcbiAgICBjb3VudHM6IEludDMyQXJyYXksXG4gICAgY291bnRzT2Zmc2V0OiBudW1iZXIsXG4gICAgdHlwZTogbnVtYmVyLFxuICAgIG9mZnNldHM6IEludDMyQXJyYXksXG4gICAgb2Zmc2V0c09mZnNldDogbnVtYmVyLFxuICAgIGluc3RhbmNlQ291bnRzOiBJbnQzMkFycmF5LFxuICAgIGluc3RhbmNlQ291bnRzT2Zmc2V0OiBudW1iZXIsXG4gICAgZHJhd2NvdW50OiBudW1iZXJcbiAgKSB7XG4gICAgY29uc3QgZXh0ID0gdGhpcy53ZWJnbDJFeHRNRDtcbiAgICBpZiAoZXh0ICE9IG51bGwpIHtcbiAgICAgIGV4dC5tdWx0aURyYXdFbGVtZW50c0luc3RhbmNlZFdFQkdMKFxuICAgICAgICBwcmltaXRpdmVNb2RlLFxuICAgICAgICBjb3VudHMsXG4gICAgICAgIGNvdW50c09mZnNldCxcbiAgICAgICAgdHlwZSxcbiAgICAgICAgb2Zmc2V0cyxcbiAgICAgICAgb2Zmc2V0c09mZnNldCxcbiAgICAgICAgaW5zdGFuY2VDb3VudHMsXG4gICAgICAgIGluc3RhbmNlQ291bnRzT2Zmc2V0LFxuICAgICAgICBkcmF3Y291bnRcbiAgICAgICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZHJhd2NvdW50OyBpKyspIHtcbiAgICAgIHRoaXMuX19nbC5kcmF3RWxlbWVudHNJbnN0YW5jZWQoXG4gICAgICAgIHByaW1pdGl2ZU1vZGUsXG4gICAgICAgIGNvdW50c1tjb3VudHNPZmZzZXQgKyBpXSxcbiAgICAgICAgdHlwZSxcbiAgICAgICAgb2Zmc2V0c1tvZmZzZXRzT2Zmc2V0ICsgaV0sXG4gICAgICAgIGluc3RhbmNlQ291bnRzW2luc3RhbmNlQ291bnRzT2Zmc2V0ICsgaV1cbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIElzc3VlcyBtdWx0aXBsZSBpbnN0YW5jZWQgbm9uLWluZGV4ZWQgZHJhd3Mgd2l0aCBvbmUgY2FsbCB3aGVuIFdFQkdMX211bHRpX2RyYXcgaXMgYXZhaWxhYmxlLlxuICAgKiBGYWxscyBiYWNrIHRvIGluZGl2aWR1YWwgZHJhd0FycmF5c0luc3RhbmNlZCBjYWxscyBvdGhlcndpc2UuXG4gICAqL1xuICBtdWx0aURyYXdBcnJheXNJbnN0YW5jZWQoXG4gICAgcHJpbWl0aXZlTW9kZTogbnVtYmVyLFxuICAgIGZpcnN0czogSW50MzJBcnJheSxcbiAgICBmaXJzdHNPZmZzZXQ6IG51bWJlcixcbiAgICBjb3VudHM6IEludDMyQXJyYXksXG4gICAgY291bnRzT2Zmc2V0OiBudW1iZXIsXG4gICAgaW5zdGFuY2VDb3VudHM6IEludDMyQXJyYXksXG4gICAgaW5zdGFuY2VDb3VudHNPZmZzZXQ6IG51bWJlcixcbiAgICBkcmF3Y291bnQ6IG51bWJlclxuICApIHtcbiAgICBjb25zdCBleHQgPSB0aGlzLndlYmdsMkV4dE1EO1xuICAgIGlmIChleHQgIT0gbnVsbCkge1xuICAgICAgZXh0Lm11bHRpRHJhd0FycmF5c0luc3RhbmNlZFdFQkdMKFxuICAgICAgICBwcmltaXRpdmVNb2RlLFxuICAgICAgICBmaXJzdHMsXG4gICAgICAgIGZpcnN0c09mZnNldCxcbiAgICAgICAgY291bnRzLFxuICAgICAgICBjb3VudHNPZmZzZXQsXG4gICAgICAgIGluc3RhbmNlQ291bnRzLFxuICAgICAgICBpbnN0YW5jZUNvdW50c09mZnNldCxcbiAgICAgICAgZHJhd2NvdW50XG4gICAgICApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRyYXdjb3VudDsgaSsrKSB7XG4gICAgICB0aGlzLl9fZ2wuZHJhd0FycmF5c0luc3RhbmNlZChcbiAgICAgICAgcHJpbWl0aXZlTW9kZSxcbiAgICAgICAgZmlyc3RzW2ZpcnN0c09mZnNldCArIGldLFxuICAgICAgICBjb3VudHNbY291bnRzT2Zmc2V0ICsgaV0sXG4gICAgICAgIGluc3RhbmNlQ291bnRzW2luc3RhbmNlQ291bnRzT2Zmc2V0ICsgaV1cbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNvbG9yIGF0dGFjaG1lbnQgY29uc3RhbnQgZm9yIGEgZ2l2ZW4gaW5kZXguXG4gICAqIEBwYXJhbSBpbmRleCAtIFRoZSBhdHRhY2htZW50IGluZGV4XG4gICAqIEByZXR1cm5zIFRoZSBXZWJHTCBjb2xvciBhdHRhY2htZW50IGNvbnN0YW50XG4gICAqL1xuICBjb2xvckF0dGFjaG1lbnQoaW5kZXg6IEluZGV4KSB7XG4gICAgcmV0dXJuIDB4OGNlMCArIGluZGV4OyAvLyBHTF9DT0xPUl9BVFRBQ0hNRU5UMCA9IDB4OGNlMFxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGRyYXcgYnVmZmVycyBmb3IgbXVsdGlwbGUgcmVuZGVyIHRhcmdldHMuXG4gICAqIEBwYXJhbSBidWZmZXJzIC0gQXJyYXkgb2YgcmVuZGVyIGJ1ZmZlciB0YXJnZXRzIHRvIGRyYXcgdG9cbiAgICovXG4gIGRyYXdCdWZmZXJzKGJ1ZmZlcnM6IFJlbmRlckJ1ZmZlclRhcmdldEVudW1bXSkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5fX2dsIGFzIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQ7XG4gICAgaWYgKGJ1ZmZlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICBnbC5kcmF3QnVmZmVycyhbZ2wuTk9ORV0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBidWZmZXIgPSBidWZmZXJzWzBdLndlYkdMQ29uc3RhbnRWYWx1ZSgpO1xuICAgIGdsLmRyYXdCdWZmZXJzKFxuICAgICAgYnVmZmVycy5tYXAoYnVmID0+IHtcbiAgICAgICAgcmV0dXJuIGJ1Zi53ZWJHTENvbnN0YW50VmFsdWUoKTtcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIGlmIChidWZmZXIgPT09IGdsLk5PTkUgfHwgYnVmZmVycy5sZW5ndGggPT09IDApIHtcbiAgICAgIGdsLmNvbG9yTWFzayhmYWxzZSwgZmFsc2UsIGZhbHNlLCBmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdsLmNvbG9yTWFzayh0cnVlLCB0cnVlLCB0cnVlLCB0cnVlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWN0aXZhdGVzIGEgdGV4dHVyZSB1bml0IGZvciBzdWJzZXF1ZW50IHRleHR1cmUgb3BlcmF0aW9ucy5cbiAgICogT3B0aW1pemVkIHRvIGF2b2lkIHJlZHVuZGFudCBzdGF0ZSBjaGFuZ2VzLlxuICAgKiBAcGFyYW0gYWN0aXZlVGV4dHVyZUluZGV4IC0gVGhlIHRleHR1cmUgdW5pdCBpbmRleCB0byBhY3RpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2FjdGl2ZVRleHR1cmUoYWN0aXZlVGV4dHVyZUluZGV4OiBudW1iZXIpIHtcbiAgICBpZiAodGhpcy5fX2FjdGl2ZVRleHR1cmVCYWNrdXAgPT09IGFjdGl2ZVRleHR1cmVJbmRleCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9fZ2wuYWN0aXZlVGV4dHVyZSh0aGlzLl9fZ2wuVEVYVFVSRTAgKyBhY3RpdmVUZXh0dXJlSW5kZXgpO1xuICAgIHRoaXMuX19hY3RpdmVUZXh0dXJlQmFja3VwID0gYWN0aXZlVGV4dHVyZUluZGV4O1xuICB9XG5cbiAgLyoqXG4gICAqIEJpbmRzIGEgMkQgdGV4dHVyZSB0byBhIHNwZWNpZmljIHRleHR1cmUgdW5pdC5cbiAgICogT3B0aW1pemVkIHRvIGF2b2lkIHJlZHVuZGFudCBzdGF0ZSBjaGFuZ2VzLlxuICAgKiBAcGFyYW0gYWN0aXZlVGV4dHVyZUluZGV4IC0gVGhlIHRleHR1cmUgdW5pdCBpbmRleFxuICAgKiBAcGFyYW0gdGV4dHVyZSAtIFRoZSAyRCB0ZXh0dXJlIHRvIGJpbmRcbiAgICovXG4gIGJpbmRUZXh0dXJlMkQoYWN0aXZlVGV4dHVyZUluZGV4OiBJbmRleCwgdGV4dHVyZTogV2ViR0xUZXh0dXJlKSB7XG4gICAgY29uc3QgdGV4ID0gdGhpcy5fX2JvdW5kVGV4dHVyZXMuZ2V0KGFjdGl2ZVRleHR1cmVJbmRleCk7XG4gICAgaWYgKHRleCAhPT0gdGV4dHVyZSkge1xuICAgICAgdGhpcy5fX2FjdGl2ZVRleHR1cmUoYWN0aXZlVGV4dHVyZUluZGV4KTtcbiAgICAgIHRoaXMuX19nbC5iaW5kVGV4dHVyZSh0aGlzLl9fZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSk7XG4gICAgICB0aGlzLl9fYm91bmRUZXh0dXJlcy5zZXQoYWN0aXZlVGV4dHVyZUluZGV4LCB0ZXh0dXJlKTtcbiAgICB9XG5cbiAgICB0aGlzLl9fYWN0aXZlVGV4dHVyZXMyRFthY3RpdmVUZXh0dXJlSW5kZXhdID0gdGV4dHVyZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCaW5kcyBhIDJEIGFycmF5IHRleHR1cmUgdG8gYSBzcGVjaWZpYyB0ZXh0dXJlIHVuaXQuXG4gICAqIE9wdGltaXplZCB0byBhdm9pZCByZWR1bmRhbnQgc3RhdGUgY2hhbmdlcy5cbiAgICogQHBhcmFtIGFjdGl2ZVRleHR1cmVJbmRleCAtIFRoZSB0ZXh0dXJlIHVuaXQgaW5kZXhcbiAgICogQHBhcmFtIHRleHR1cmUgLSBUaGUgMkQgYXJyYXkgdGV4dHVyZSB0byBiaW5kXG4gICAqL1xuICBiaW5kVGV4dHVyZTJEQXJyYXkoYWN0aXZlVGV4dHVyZUluZGV4OiBJbmRleCwgdGV4dHVyZTogV2ViR0xUZXh0dXJlKSB7XG4gICAgY29uc3QgdGV4ID0gdGhpcy5fX2JvdW5kVGV4dHVyZXMuZ2V0KGFjdGl2ZVRleHR1cmVJbmRleCk7XG4gICAgaWYgKHRleCAhPT0gdGV4dHVyZSkge1xuICAgICAgdGhpcy5fX2FjdGl2ZVRleHR1cmUoYWN0aXZlVGV4dHVyZUluZGV4KTtcbiAgICAgIHRoaXMuX19nbC5iaW5kVGV4dHVyZSh0aGlzLl9fZ2wuVEVYVFVSRV8yRF9BUlJBWSwgdGV4dHVyZSk7XG4gICAgICB0aGlzLl9fYm91bmRUZXh0dXJlcy5zZXQoYWN0aXZlVGV4dHVyZUluZGV4LCB0ZXh0dXJlKTtcbiAgICB9XG5cbiAgICB0aGlzLl9fYWN0aXZlVGV4dHVyZXMyREFycmF5W2FjdGl2ZVRleHR1cmVJbmRleF0gPSB0ZXh0dXJlO1xuICB9XG5cbiAgLyoqXG4gICAqIEJpbmRzIGEgc2FtcGxlciBvYmplY3QgdG8gYSBzcGVjaWZpYyB0ZXh0dXJlIHVuaXQuXG4gICAqIE9wdGltaXplZCB0byBhdm9pZCByZWR1bmRhbnQgc3RhdGUgY2hhbmdlcy5cbiAgICogQHBhcmFtIGFjdGl2ZVRleHR1cmVJbmRleCAtIFRoZSB0ZXh0dXJlIHVuaXQgaW5kZXhcbiAgICogQHBhcmFtIHNhbXBsZXIgLSBUaGUgc2FtcGxlciBvYmplY3QgdG8gYmluZFxuICAgKi9cbiAgYmluZFRleHR1cmVTYW1wbGVyKGFjdGl2ZVRleHR1cmVJbmRleDogSW5kZXgsIHNhbXBsZXI6IFdlYkdMU2FtcGxlcikge1xuICAgIGNvbnN0IHNhbXAgPSB0aGlzLl9fYm91bmRTYW1wbGVycy5nZXQoYWN0aXZlVGV4dHVyZUluZGV4KTtcbiAgICBpZiAoc2FtcCAhPT0gc2FtcGxlcikge1xuICAgICAgdGhpcy5fX2dsLmJpbmRTYW1wbGVyKGFjdGl2ZVRleHR1cmVJbmRleCwgc2FtcGxlcik7XG4gICAgICB0aGlzLl9fYm91bmRTYW1wbGVycy5zZXQoYWN0aXZlVGV4dHVyZUluZGV4LCBzYW1wbGVyKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQmluZHMgYSBjdWJlIG1hcCB0ZXh0dXJlIHRvIGEgc3BlY2lmaWMgdGV4dHVyZSB1bml0LlxuICAgKiBPcHRpbWl6ZWQgdG8gYXZvaWQgcmVkdW5kYW50IHN0YXRlIGNoYW5nZXMuXG4gICAqIEBwYXJhbSBhY3RpdmVUZXh0dXJlSW5kZXggLSBUaGUgdGV4dHVyZSB1bml0IGluZGV4XG4gICAqIEBwYXJhbSB0ZXh0dXJlIC0gVGhlIGN1YmUgbWFwIHRleHR1cmUgdG8gYmluZFxuICAgKi9cbiAgYmluZFRleHR1cmVDdWJlKGFjdGl2ZVRleHR1cmVJbmRleDogSW5kZXgsIHRleHR1cmU6IFdlYkdMVGV4dHVyZSkge1xuICAgIGNvbnN0IHRleCA9IHRoaXMuX19ib3VuZFRleHR1cmVzLmdldChhY3RpdmVUZXh0dXJlSW5kZXgpO1xuICAgIGlmICh0ZXggIT09IHRleHR1cmUpIHtcbiAgICAgIHRoaXMuX19hY3RpdmVUZXh0dXJlKGFjdGl2ZVRleHR1cmVJbmRleCk7XG4gICAgICB0aGlzLl9fZ2wuYmluZFRleHR1cmUodGhpcy5fX2dsLlRFWFRVUkVfQ1VCRV9NQVAsIHRleHR1cmUpO1xuICAgICAgdGhpcy5fX2JvdW5kVGV4dHVyZXMuc2V0KGFjdGl2ZVRleHR1cmVJbmRleCwgdGV4dHVyZSk7XG4gICAgfVxuXG4gICAgdGhpcy5fX2FjdGl2ZVRleHR1cmVzQ3ViZVthY3RpdmVUZXh0dXJlSW5kZXhdID0gdGV4dHVyZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbmJpbmRzIGEgMkQgdGV4dHVyZSBmcm9tIGEgc3BlY2lmaWMgdGV4dHVyZSB1bml0LlxuICAgKiBAcGFyYW0gYWN0aXZlVGV4dHVyZUluZGV4IC0gVGhlIHRleHR1cmUgdW5pdCBpbmRleFxuICAgKi9cbiAgdW5iaW5kVGV4dHVyZTJEKGFjdGl2ZVRleHR1cmVJbmRleDogSW5kZXgpIHtcbiAgICB0aGlzLl9fYWN0aXZlVGV4dHVyZShhY3RpdmVUZXh0dXJlSW5kZXgpO1xuICAgIHRoaXMuX19nbC5iaW5kVGV4dHVyZSh0aGlzLl9fZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XG4gICAgdGhpcy5fX2JvdW5kVGV4dHVyZXMuZGVsZXRlKGFjdGl2ZVRleHR1cmVJbmRleCk7XG4gICAgZGVsZXRlIHRoaXMuX19hY3RpdmVUZXh0dXJlczJEW2FjdGl2ZVRleHR1cmVJbmRleF07XG4gIH1cblxuICAvKipcbiAgICogVW5iaW5kcyBhIDJEIGFycmF5IHRleHR1cmUgZnJvbSBhIHNwZWNpZmljIHRleHR1cmUgdW5pdC5cbiAgICogQHBhcmFtIGFjdGl2ZVRleHR1cmVJbmRleCAtIFRoZSB0ZXh0dXJlIHVuaXQgaW5kZXhcbiAgICovXG4gIHVuYmluZFRleHR1cmUyREFycmF5KGFjdGl2ZVRleHR1cmVJbmRleDogSW5kZXgpIHtcbiAgICB0aGlzLl9fYWN0aXZlVGV4dHVyZShhY3RpdmVUZXh0dXJlSW5kZXgpO1xuICAgIHRoaXMuX19nbC5iaW5kVGV4dHVyZSh0aGlzLl9fZ2wuVEVYVFVSRV8yRF9BUlJBWSwgbnVsbCk7XG4gICAgdGhpcy5fX2JvdW5kVGV4dHVyZXMuZGVsZXRlKGFjdGl2ZVRleHR1cmVJbmRleCk7XG4gICAgZGVsZXRlIHRoaXMuX19hY3RpdmVUZXh0dXJlczJEQXJyYXlbYWN0aXZlVGV4dHVyZUluZGV4XTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbmJpbmRzIGEgY3ViZSBtYXAgdGV4dHVyZSBmcm9tIGEgc3BlY2lmaWMgdGV4dHVyZSB1bml0LlxuICAgKiBAcGFyYW0gYWN0aXZlVGV4dHVyZUluZGV4IC0gVGhlIHRleHR1cmUgdW5pdCBpbmRleFxuICAgKi9cbiAgdW5iaW5kVGV4dHVyZUN1YmUoYWN0aXZlVGV4dHVyZUluZGV4OiBJbmRleCkge1xuICAgIHRoaXMuX19hY3RpdmVUZXh0dXJlKGFjdGl2ZVRleHR1cmVJbmRleCk7XG4gICAgdGhpcy5fX2dsLmJpbmRUZXh0dXJlKHRoaXMuX19nbC5URVhUVVJFX0NVQkVfTUFQLCBudWxsKTtcbiAgICB0aGlzLl9fYm91bmRUZXh0dXJlcy5kZWxldGUoYWN0aXZlVGV4dHVyZUluZGV4KTtcbiAgICBkZWxldGUgdGhpcy5fX2FjdGl2ZVRleHR1cmVzQ3ViZVthY3RpdmVUZXh0dXJlSW5kZXhdO1xuICB9XG5cbiAgLyoqXG4gICAqIFVuYmluZHMgYWxsIGN1cnJlbnRseSBib3VuZCB0ZXh0dXJlcyBmcm9tIGFsbCB0ZXh0dXJlIHVuaXRzLlxuICAgKiBUaGlzIGlzIHVzZWZ1bCBmb3IgY2xlYW51cCBvcGVyYXRpb25zLlxuICAgKi9cbiAgdW5iaW5kVGV4dHVyZXMoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9fYWN0aXZlVGV4dHVyZXMyRC5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMuX19hY3RpdmVUZXh0dXJlczJEW2ldID09IG51bGwpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB0aGlzLl9fYWN0aXZlVGV4dHVyZSgxNSk7XG4gICAgICB0aGlzLl9fZ2wuYmluZFRleHR1cmUodGhpcy5fX2dsLlRFWFRVUkVfMkQsIG51bGwpO1xuICAgICAgZGVsZXRlIHRoaXMuX19hY3RpdmVUZXh0dXJlczJEW2ldO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fX2FjdGl2ZVRleHR1cmVzMkRBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMuX19hY3RpdmVUZXh0dXJlczJEQXJyYXlbaV0gPT0gbnVsbCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19hY3RpdmVUZXh0dXJlKDE1KTtcbiAgICAgIHRoaXMuX19nbC5iaW5kVGV4dHVyZSh0aGlzLl9fZ2wuVEVYVFVSRV8yRF9BUlJBWSwgbnVsbCk7XG4gICAgICBkZWxldGUgdGhpcy5fX2FjdGl2ZVRleHR1cmVzMkRBcnJheVtpXTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX19hY3RpdmVUZXh0dXJlc0N1YmUubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLl9fYWN0aXZlVGV4dHVyZXNDdWJlW2ldID09IG51bGwpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB0aGlzLl9fYWN0aXZlVGV4dHVyZSgxNSk7XG4gICAgICB0aGlzLl9fZ2wuYmluZFRleHR1cmUodGhpcy5fX2dsLlRFWFRVUkVfQ1VCRV9NQVAsIG51bGwpO1xuICAgICAgZGVsZXRlIHRoaXMuX19hY3RpdmVUZXh0dXJlc0N1YmVbaV07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSBXZWJHTCBleHRlbnNpb24gYW5kIGNhY2hlcyBpdCBmb3IgZnV0dXJlIHVzZS5cbiAgICogQHBhcmFtIGNvbmZpZyAtIFRoZSBjb25maWd1cmF0aW9uIGZvciB0aGUgV2ViR0wgY29udGV4dFxuICAgKiBAcGFyYW0gZXh0ZW5zaW9uIC0gVGhlIGV4dGVuc2lvbiB0byByZXRyaWV2ZVxuICAgKiBAcmV0dXJucyBUaGUgZXh0ZW5zaW9uIG9iamVjdCBvciBudWxsIGlmIG5vdCBhdmFpbGFibGVcbiAgICovXG4gIHByaXZhdGUgX19nZXRFeHRlbnNpb24oY29uZmlnOiBDb25maWcsIGV4dGVuc2lvbjogV2ViR0xFeHRlbnNpb25FbnVtKSB7XG4gICAgY29uc3QgZ2w6IGFueSA9IHRoaXMuX19nbDtcblxuICAgIGlmICghdGhpcy5fX2V4dGVuc2lvbnMuaGFzKGV4dGVuc2lvbikpIHtcbiAgICAgIGNvbnN0IGV4dE9iaiA9IGdsLmdldEV4dGVuc2lvbihleHRlbnNpb24udG9TdHJpbmcoKSk7XG4gICAgICBpZiAoZXh0T2JqID09IG51bGwgJiYgY29uZmlnLmNnQXBpRGVidWdDb25zb2xlT3V0cHV0KSB7XG4gICAgICAgIGNvbnN0IHRleHQgPSBgJHtleHRlbnNpb24udG9TdHJpbmcoKX0gTm90IEF2YWlsYWJsZSBpbiB0aGlzIGVudmlyb25tZW50YDtcbiAgICAgICAgTG9nZ2VyLmRlZmF1bHQuaW5mbyh0ZXh0KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19leHRlbnNpb25zLnNldChleHRlbnNpb24sIGV4dE9iaik7XG4gICAgICByZXR1cm4gZXh0T2JqO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX2V4dGVuc2lvbnMuZ2V0KGV4dGVuc2lvbik7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIGNvbXByZXNzZWQgdGV4dHVyZSBleHRlbnNpb24gd2l0aCB2ZW5kb3IgcHJlZml4IHN1cHBvcnQuXG4gICAqIEBwYXJhbSBleHRlbnNpb24gLSBUaGUgY29tcHJlc3NlZCB0ZXh0dXJlIGV4dGVuc2lvbiB0byByZXRyaWV2ZVxuICAgKiBAcmV0dXJucyBUaGUgZXh0ZW5zaW9uIG9iamVjdCBvciBudWxsIGlmIG5vdCBhdmFpbGFibGVcbiAgICovXG4gIHByaXZhdGUgX19nZXRDb21wcmVzc2VkVGV4dHVyZUV4dGVuc2lvbihjb25maWc6IENvbmZpZywgZXh0ZW5zaW9uOiBXZWJHTEV4dGVuc2lvbkVudW0pIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuX19nbCBhcyBXZWJHTFJlbmRlcmluZ0NvbnRleHQgfCBXZWJHTDJSZW5kZXJpbmdDb250ZXh0O1xuXG4gICAgaWYgKCF0aGlzLl9fZXh0ZW5zaW9ucy5oYXMoZXh0ZW5zaW9uKSkge1xuICAgICAgY29uc3QgZXh0ZW5zaW9uTmFtZSA9IGV4dGVuc2lvbi50b1N0cmluZygpO1xuICAgICAgY29uc3QgZXh0T2JqID1cbiAgICAgICAgZ2wuZ2V0RXh0ZW5zaW9uKGV4dGVuc2lvbk5hbWUpID8/XG4gICAgICAgIGdsLmdldEV4dGVuc2lvbihgTU9aXyR7ZXh0ZW5zaW9uTmFtZX1gKSA/P1xuICAgICAgICBnbC5nZXRFeHRlbnNpb24oYFdFQktJVF8ke2V4dGVuc2lvbk5hbWV9YCk7XG5cbiAgICAgIGlmIChleHRPYmogPT0gbnVsbCAmJiBjb25maWcuY2dBcGlEZWJ1Z0NvbnNvbGVPdXRwdXQpIHtcbiAgICAgICAgY29uc3QgdGV4dCA9IGAke2V4dGVuc2lvbi50b1N0cmluZygpfSBOb3QgQXZhaWxhYmxlIGluIHRoaXMgZW52aXJvbm1lbnRgO1xuICAgICAgICBMb2dnZXIuZGVmYXVsdC5pbmZvKHRleHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fX2V4dGVuc2lvbnMuc2V0KGV4dGVuc2lvbiwgZXh0T2JqKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBleHRPYmo7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fZXh0ZW5zaW9ucy5nZXQoZXh0ZW5zaW9uKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2aWV3cG9ydCB3aXRoIG9wdGltaXphdGlvbiB0byBhdm9pZCByZWR1bmRhbnQgc3RhdGUgY2hhbmdlcy5cbiAgICogQHBhcmFtIGxlZnQgLSBMZWZ0IGNvb3JkaW5hdGUgb2YgdGhlIHZpZXdwb3J0XG4gICAqIEBwYXJhbSB0b3AgLSBUb3AgY29vcmRpbmF0ZSBvZiB0aGUgdmlld3BvcnRcbiAgICogQHBhcmFtIHdpZHRoIC0gV2lkdGggb2YgdGhlIHZpZXdwb3J0XG4gICAqIEBwYXJhbSBoZWlnaHQgLSBIZWlnaHQgb2YgdGhlIHZpZXdwb3J0XG4gICAqL1xuICBzZXRWaWV3cG9ydChsZWZ0OiBudW1iZXIsIHRvcDogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IGdsOiBhbnkgPSB0aGlzLl9fZ2w7XG4gICAgaWYgKFxuICAgICAgdGhpcy5fX3ZpZXdwb3J0X3dpZHRoICE9PSB3aWR0aCB8fFxuICAgICAgdGhpcy5fX3ZpZXdwb3J0X2hlaWdodCAhPT0gaGVpZ2h0IHx8XG4gICAgICB0aGlzLl9fdmlld3BvcnRfbGVmdCAhPT0gbGVmdCB8fFxuICAgICAgdGhpcy5fX3ZpZXdwb3J0X3RvcCAhPT0gdG9wXG4gICAgKSB7XG4gICAgICBnbC52aWV3cG9ydChsZWZ0LCB0b3AsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgdGhpcy5fX3ZpZXdwb3J0X2xlZnQgPSBsZWZ0O1xuICAgICAgdGhpcy5fX3ZpZXdwb3J0X3RvcCA9IHRvcDtcbiAgICAgIHRoaXMuX192aWV3cG9ydF93aWR0aCA9IHdpZHRoO1xuICAgICAgdGhpcy5fX3ZpZXdwb3J0X2hlaWdodCA9IGhlaWdodDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmlld3BvcnQgdXNpbmcgYSBWZWN0b3I0IHdpdGggb3B0aW1pemF0aW9uIHRvIGF2b2lkIHJlZHVuZGFudCBzdGF0ZSBjaGFuZ2VzLlxuICAgKiBAcGFyYW0gdmlld3BvcnQgLSBWZWN0b3I0IGNvbnRhaW5pbmcgbGVmdCwgdG9wLCB3aWR0aCwgYW5kIGhlaWdodFxuICAgKi9cbiAgc2V0Vmlld3BvcnRBc1ZlY3RvcjQodmlld3BvcnQ6IFZlY3RvcjQpOiB2b2lkIHtcbiAgICBjb25zdCBnbDogYW55ID0gdGhpcy5fX2dsO1xuICAgIGlmIChcbiAgICAgIHRoaXMuX192aWV3cG9ydF93aWR0aCAhPT0gdmlld3BvcnQueiB8fFxuICAgICAgdGhpcy5fX3ZpZXdwb3J0X2hlaWdodCAhPT0gdmlld3BvcnQudyB8fFxuICAgICAgdGhpcy5fX3ZpZXdwb3J0X2xlZnQgIT09IHZpZXdwb3J0LnggfHxcbiAgICAgIHRoaXMuX192aWV3cG9ydF90b3AgIT09IHZpZXdwb3J0LnlcbiAgICApIHtcbiAgICAgIGdsLnZpZXdwb3J0KHZpZXdwb3J0LngsIHZpZXdwb3J0LnksIHZpZXdwb3J0LnosIHZpZXdwb3J0LncpO1xuICAgICAgdGhpcy5fX3ZpZXdwb3J0X2xlZnQgPSB2aWV3cG9ydC54O1xuICAgICAgdGhpcy5fX3ZpZXdwb3J0X3RvcCA9IHZpZXdwb3J0Lnk7XG4gICAgICB0aGlzLl9fdmlld3BvcnRfd2lkdGggPSB2aWV3cG9ydC56O1xuICAgICAgdGhpcy5fX3ZpZXdwb3J0X2hlaWdodCA9IHZpZXdwb3J0Lnc7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhbmQgY2FjaGVzIHVuaWZvcm0gYnVmZmVyIGluZm9ybWF0aW9uIGZvciBXZWJHTDIuXG4gICAqIFRoaXMgaW5jbHVkZXMgYWxpZ25tZW50IHJlcXVpcmVtZW50cyBhbmQgc2l6ZSBsaW1pdHMuXG4gICAqL1xuICBwcml2YXRlIF9fZ2V0VW5pZm9ybUJ1ZmZlckluZm8oKSB7XG4gICAgaWYgKCF0aGlzLmlzV2ViR0wyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZ2w6IGFueSA9IHRoaXMuX19nbDtcbiAgICBjb25zdCBvZmZzZXRBbGlnbm1lbnQgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuVU5JRk9STV9CVUZGRVJfT0ZGU0VUX0FMSUdOTUVOVCkgYXMgbnVtYmVyO1xuICAgIGNvbnN0IG1heEJsb2NrU2l6ZSA9IGdsLmdldFBhcmFtZXRlcihnbC5NQVhfVU5JRk9STV9CTE9DS19TSVpFKSBhcyBudW1iZXI7XG4gICAgdGhpcy5fX21heFZlcnRleFVuaWZvcm1CbG9ja3MgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuTUFYX1ZFUlRFWF9VTklGT1JNX0JMT0NLUykgYXMgbnVtYmVyO1xuICAgIHRoaXMuX19tYXhGcmFnbWVudFVuaWZvcm1CbG9ja3MgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuTUFYX0ZSQUdNRU5UX1VOSUZPUk1fQkxPQ0tTKSBhcyBudW1iZXI7XG4gICAgdGhpcy5fX21heENvbnZlbnRpb25Vbmlmb3JtQmxvY2tzID0gTWF0aC5taW4odGhpcy5fX21heFZlcnRleFVuaWZvcm1CbG9ja3MsIHRoaXMuX19tYXhGcmFnbWVudFVuaWZvcm1CbG9ja3MpO1xuICAgIHRoaXMuX19hbGlnbmVkTWF4VW5pZm9ybUJsb2NrU2l6ZSA9IG1heEJsb2NrU2l6ZSAtIChtYXhCbG9ja1NpemUgJSBvZmZzZXRBbGlnbm1lbnQpO1xuICAgIHRoaXMuX191bmlmb3JtQnVmZmVyT2Zmc2V0QWxpZ25tZW50ID0gb2Zmc2V0QWxpZ25tZW50O1xuICAgIHRoaXMuX19tYXhVbmlmb3JtQmxvY2tTaXplID0gbWF4QmxvY2tTaXplO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhbmQgY2FjaGVzIHRoZSBtYXhpbXVtIG51bWJlciBvZiB1bmlmb3JtIHZlY3RvcnMgZm9yIHZlcnRleCBhbmQgZnJhZ21lbnQgc2hhZGVycy5cbiAgICovXG4gIHByaXZhdGUgX19nZXRNYXhVbmlmb3JtVmVjdG9ycygpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2V0UmF3Q29udGV4dCgpO1xuICAgIHRoaXMuX19tYXhWZXJ0ZXhVbmlmb3JtVmVjdG9ycyA9IGdsLmdldFBhcmFtZXRlcihnbC5NQVhfVkVSVEVYX1VOSUZPUk1fVkVDVE9SUykgYXMgbnVtYmVyO1xuICAgIHRoaXMuX19tYXhWZXJ0ZXhVbmlmb3JtVmVjdG9ycyA9IGdsLmdldFBhcmFtZXRlcihnbC5NQVhfVkVSVEVYX1VOSUZPUk1fVkVDVE9SUykgYXMgbnVtYmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhbmQgY2FjaGVzIHRoZSBtYXhpbXVtIHRleHR1cmUgc2l6ZS5cbiAgICovXG4gIHByaXZhdGUgX19nZXRNYXhUZXh0dXJlU2l6ZSgpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2V0UmF3Q29udGV4dCgpO1xuICAgIHRoaXMuX19tYXhUZXh0dXJlU2l6ZSA9IGdsLmdldFBhcmFtZXRlcihnbC5NQVhfVEVYVFVSRV9TSVpFKSBhcyBudW1iZXI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWF4aW11bSB0ZXh0dXJlIHNpemUuXG4gICAqIEByZXR1cm5zIFRoZSBtYXhpbXVtIHRleHR1cmUgc2l6ZVxuICAgKi9cbiAgZ2V0TWF4VGV4dHVyZVNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19tYXhUZXh0dXJlU2l6ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXhpbXVtIG51bWJlciBvZiB1bmlmb3JtIGJsb2NrcyB0aGF0IGNhbiBiZSB1c2VkIGluIGJvdGggdmVydGV4IGFuZCBmcmFnbWVudCBzaGFkZXJzLlxuICAgKiBAcmV0dXJucyBUaGUgbWluaW11bSBvZiB2ZXJ0ZXggYW5kIGZyYWdtZW50IHNoYWRlciB1bmlmb3JtIGJsb2NrIGxpbWl0c1xuICAgKi9cbiAgZ2V0TWF4Q29udmVudGlvblVuaWZvcm1CbG9ja3MoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19tYXhDb252ZW50aW9uVW5pZm9ybUJsb2NrcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXhpbXVtIHVuaWZvcm0gYmxvY2sgc2l6ZSBhbGlnbmVkIHRvIHRoZSByZXF1aXJlZCBvZmZzZXQgYWxpZ25tZW50LlxuICAgKiBAcmV0dXJucyBUaGUgYWxpZ25lZCBtYXhpbXVtIHVuaWZvcm0gYmxvY2sgc2l6ZSBpbiBieXRlc1xuICAgKi9cbiAgZ2V0QWxpZ25lZE1heFVuaWZvcm1CbG9ja1NpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19hbGlnbmVkTWF4VW5pZm9ybUJsb2NrU2l6ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXhpbXVtIG51bWJlciBvZiB1bmlmb3JtIHZlY3RvcnMgYXZhaWxhYmxlIGluIHZlcnRleCBzaGFkZXJzLlxuICAgKiBAcmV0dXJucyBUaGUgbWF4aW11bSB2ZXJ0ZXggdW5pZm9ybSB2ZWN0b3JzXG4gICAqL1xuICBnZXRNYXhWZXJ0ZXhVbmlmb3JtVmVjdG9ycygpIHtcbiAgICByZXR1cm4gdGhpcy5fX21heFZlcnRleFVuaWZvcm1WZWN0b3JzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1heGltdW0gbnVtYmVyIG9mIHVuaWZvcm0gdmVjdG9ycyBhdmFpbGFibGUgaW4gZnJhZ21lbnQgc2hhZGVycy5cbiAgICogQHJldHVybnMgVGhlIG1heGltdW0gZnJhZ21lbnQgdW5pZm9ybSB2ZWN0b3JzXG4gICAqL1xuICBnZXRNYXhGcmFnbWVudFVuaWZvcm1WZWN0b3JzKCkge1xuICAgIHJldHVybiB0aGlzLl9fbWF4RnJhZ21lbnRVbmlmb3JtVmVjdG9ycztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIFdlYkdMIG1lbW9yeSB1c2FnZSBpbmZvcm1hdGlvbiBpZiB0aGUgR01BTl9XRUJHTF9NRU1PUlkgZXh0ZW5zaW9uIGlzIGF2YWlsYWJsZS5cbiAgICogQHJldHVybnMgTWVtb3J5IGluZm9ybWF0aW9uIG9iamVjdCBvciB1bmRlZmluZWQgaWYgZXh0ZW5zaW9uIGlzIG5vdCBhdmFpbGFibGVcbiAgICovXG4gIGdldFdlYkdMTWVtb3J5SW5mbygpIHtcbiAgICBpZiAodGhpcy53ZWJnbDJFeHRHbWFuV00pIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMud2ViZ2wyRXh0R21hbldNLmdldE1lbW9yeUluZm8oKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgbXVsdGl2aWV3IHJlbmRlcmluZyBpcyBzdXBwb3J0ZWQgYW5kIGVuYWJsZWQuXG4gICAqIEByZXR1cm5zIFRydWUgaWYgbXVsdGl2aWV3IGlzIGF2YWlsYWJsZSBhbmQgZW5hYmxlZCBmb3IgV2ViVlJcbiAgICovXG4gIGlzTXVsdGl2aWV3KGNvbmZpZzogQ29uZmlnKSB7XG4gICAgcmV0dXJuIHRoaXMuX19pc19tdWx0aXZpZXcgJiYgY29uZmlnLm11bHRpVmlld0ZvcldlYlZSO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBRUEsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsY0FBYztBQUV2QixTQUFTLHNCQUErQztBQUV4RCxJQUFNLGVBQWU7QUFrRGQsSUFBTSxzQkFBTixNQUEwQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBa0YvQixZQUFZLFFBQWdCLElBQTRCLFFBQTJCO0FBaEZuRixTQUFBQSxLQUFpQjtBQUNqQixTQUFPLFFBQWM7QUFDckIsU0FBTyxTQUFlO0FBd0N0QixTQUFRQyxLQUErQjtBQUN2QyxTQUFRQyxLQUFxQyxDQUFDO0FBQzlDLFNBQVFDLEtBQTBDLENBQUM7QUFDbkQsU0FBUUMsS0FBdUMsQ0FBQztBQUNoRCxTQUFRQyxLQUE0QyxvQkFBSSxJQUFJO0FBQzVELFNBQVFDLEtBQTRDLG9CQUFJLElBQUk7QUFDNUQsU0FBUUMsS0FBa0I7QUFDMUIsU0FBUUMsS0FBaUI7QUFDekIsU0FBUUMsS0FBbUI7QUFDM0IsU0FBUUMsS0FBb0I7QUFDNUIsU0FBUUMsS0FBMEI7QUFDbEMsU0FBUUMsS0FBeUI7QUFDakMsU0FBUUMsS0FBMkI7QUFDbkMsU0FBUUMsS0FBNEI7QUFDcEMsU0FBUUMsS0FBK0I7QUFDdkMsU0FBUUMsS0FBMkI7QUFDbkMsU0FBUUMsS0FBNkI7QUFDckMsU0FBUUMsS0FBK0I7QUFDdkMsU0FBUUMsS0FBaUM7QUFDekMsU0FBUUMsS0FBd0I7QUFDaEMsU0FBUUMsS0FBNEI7QUFDcEMsU0FBUUMsS0FBOEI7QUFDdEMsU0FBUUMsS0FBeUI7QUFFakMsd0JBQWU7QUFNZjtBQUFBO0FBQUE7QUFBQTtBQUFBLFNBQUFDLEtBQXVELG9CQUFJLElBQUk7QUFTN0QsU0FBS0MsS0FBTztBQUNaLFNBQUssUUFBUSxPQUFPO0FBQ3BCLFNBQUssU0FBUyxPQUFPO0FBQ3JCLFNBQUssU0FBUztBQUNkLFNBQUtoQixLQUFtQixLQUFLSSxLQUEyQixLQUFLO0FBQzdELFNBQUtILEtBQW9CLEtBQUtJLEtBQTRCLEtBQUs7QUFFL0QsU0FBS1ksS0FBaUI7QUFFdEIsUUFBSSxLQUFLRCxHQUFLLFlBQVksU0FBUywwQkFBMEI7QUFDM0QsV0FBS3pCLEtBQWlCO0FBQ3RCLFdBQUssZUFBZSxLQUFLMkIsR0FBZSxRQUFRLGVBQWUsa0JBQWtCO0FBQ2pGLFdBQUssZ0JBQWdCLEtBQUtBLEdBQWUsUUFBUSxlQUFlLHNCQUFzQjtBQUN0RixXQUFLLGVBQWUsS0FBS0EsR0FBZSxRQUFRLGVBQWUsd0JBQXdCO0FBQ3ZGLFdBQUssZUFBZSxLQUFLQSxHQUFlLFFBQVEsZUFBZSxzQkFBc0I7QUFDckYsV0FBSyxnQkFBZ0IsS0FBS0EsR0FBZSxRQUFRLGVBQWUsMEJBQTBCO0FBQzFGLFdBQUssa0JBQWtCLEtBQUtDLEdBQWdDLFFBQVEsZUFBZSxxQkFBcUI7QUFDeEcsV0FBSyxrQkFBa0IsS0FBS0EsR0FBZ0MsUUFBUSxlQUFlLHFCQUFxQjtBQUN4RyxXQUFLLG1CQUFtQixLQUFLQSxHQUFnQyxRQUFRLGVBQWUsc0JBQXNCO0FBQzFHLFdBQUssaUJBQWlCLEtBQUtBLEdBQWdDLFFBQVEsZUFBZSxvQkFBb0I7QUFDdEcsV0FBSyxpQkFBaUIsS0FBS0EsR0FBZ0MsUUFBUSxlQUFlLG9CQUFvQjtBQUN0RyxXQUFLLGtCQUFrQixLQUFLQSxHQUFnQyxRQUFRLGVBQWUscUJBQXFCO0FBQ3hHLFdBQUssa0JBQWtCLEtBQUtBLEdBQWdDLFFBQVEsZUFBZSxxQkFBcUI7QUFDeEcsV0FBSyxtQkFBbUIsS0FBS0QsR0FBZSxRQUFRLGVBQWUsZUFBZTtBQUNsRixVQUFJLEtBQUssa0JBQWtCO0FBQ3pCLGFBQUssaUJBQWlCLGlCQUFpQjtBQUFBLE1BQ3pDLE9BQU87QUFDTCxhQUFLLG1CQUFtQixLQUFLQSxHQUFlLFFBQVEsZUFBZSxhQUFhO0FBQ2hGLFlBQUksS0FBSyxrQkFBa0I7QUFDekIsZUFBSyxpQkFBaUIsaUJBQWlCO0FBQUEsUUFDekMsT0FBTztBQUNMLGNBQUksT0FBTyx5QkFBeUI7QUFDbEMsbUJBQU8sUUFBUSxLQUFLLGtFQUFrRTtBQUFBLFVBQ3hGO0FBQ0EsZUFBS0QsS0FBaUI7QUFBQSxRQUN4QjtBQUFBLE1BQ0Y7QUFDQSxXQUFLLG9CQUFvQixLQUFLQyxHQUFlLFFBQVEsZUFBZSxXQUFXO0FBQy9FLFdBQUssY0FBYyxLQUFLQSxHQUFlLFFBQVEsZUFBZSxTQUFTO0FBQ3ZFLFVBQUksT0FBTyx5QkFBeUI7QUFDbEMsYUFBSyxrQkFBa0IsS0FBS0EsR0FBZSxRQUFRLGVBQWUsaUJBQWlCO0FBQUEsTUFDckY7QUFBQSxJQUNGO0FBQ0EsU0FBS0UsR0FBdUI7QUFDNUIsU0FBS0MsR0FBdUI7QUFDNUIsU0FBS0MsR0FBb0I7QUFBQSxFQUMzQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxnQkFBZ0U7QUFDOUQsV0FBTyxLQUFLTjtBQUFBLEVBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsd0JBQStDO0FBQzdDLFdBQU8sS0FBS0E7QUFBQSxFQUNkO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLHdCQUFnRDtBQUM5QyxXQUFPLEtBQUtBO0FBQUEsRUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLFdBQVc7QUFDYixXQUFPLFFBQVEsY0FBYztBQUFBLE1BQzNCLEtBQUtsQjtBQUFBLE1BQ0wsS0FBS0M7QUFBQSxNQUNMLEtBQUtDO0FBQUEsTUFDTCxLQUFLQztBQUFBLElBQ1AsQ0FBQztBQUFBLEVBQ0g7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxrQkFBa0I7QUFDcEIsV0FBTyxRQUFRLGNBQWM7QUFBQSxNQUMzQixLQUFLQztBQUFBLE1BQ0wsS0FBS0M7QUFBQSxNQUNMLEtBQUtDO0FBQUEsTUFDTCxLQUFLQztBQUFBLElBQ1AsQ0FBQztBQUFBLEVBQ0g7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSx5QkFBeUIsUUFBZ0IsZ0JBQW9DO0FBQzNFLFFBQUksS0FBS2EsR0FBZSxRQUFRLGNBQWMsR0FBRztBQUMvQyxhQUFPO0FBQUEsSUFDVDtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsNEJBQTRCLFFBQWdCLGdCQUFvQztBQUM5RSxXQUFPLENBQUMsS0FBSyx5QkFBeUIsUUFBUSxjQUFjO0FBQUEsRUFDOUQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxZQUFZLElBQWtGO0FBQzVGLFdBQU8sS0FBSztBQUFBLEVBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxXQUFXO0FBQ2IsUUFBSSxLQUFLM0IsT0FBbUIsR0FBRztBQUM3QixhQUFPO0FBQUEsSUFDVDtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLG9CQUFvQjtBQUNsQixXQUFPLEtBQUt5QixHQUFLLGtCQUFrQjtBQUFBLEVBQ3JDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLGtCQUFrQixhQUFpRTtBQUNqRixTQUFLQSxHQUFLLGtCQUFrQixXQUFXO0FBQUEsRUFDekM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsZ0JBQWdCLEtBQXVDO0FBQ3JELFNBQUtBLEdBQUssZ0JBQWdCLEdBQUc7QUFBQSxFQUMvQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLG9CQUFvQixPQUFlLFNBQWlCO0FBQ2xELFNBQUtBLEdBQUssb0JBQW9CLE9BQU8sT0FBTztBQUFBLEVBQzlDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsc0JBQ0UsZUFDQSxZQUNBLE1BQ0EsUUFDQSxlQUNBO0FBQ0EsU0FBS0EsR0FBSyxzQkFBc0IsZUFBZSxZQUFZLE1BQU0sUUFBUSxhQUFhO0FBQUEsRUFDeEY7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0Esb0JBQW9CLGVBQXVCLE9BQWUsT0FBZSxlQUF1QjtBQUM5RixTQUFLQSxHQUFLLG9CQUFvQixlQUFlLE9BQU8sT0FBTyxhQUFhO0FBQUEsRUFDMUU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSwyQkFDRSxlQUNBLFFBQ0EsY0FDQSxNQUNBLFNBQ0EsZUFDQSxnQkFDQSxzQkFDQSxXQUNBO0FBQ0EsVUFBTSxNQUFNLEtBQUs7QUFDakIsUUFBSSxPQUFPLE1BQU07QUFDZixVQUFJO0FBQUEsUUFDRjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUNBO0FBQUEsSUFDRjtBQUNBLGFBQVMsSUFBSSxHQUFHLElBQUksV0FBVyxLQUFLO0FBQ2xDLFdBQUtBLEdBQUs7QUFBQSxRQUNSO0FBQUEsUUFDQSxPQUFPLGVBQWUsQ0FBQztBQUFBLFFBQ3ZCO0FBQUEsUUFDQSxRQUFRLGdCQUFnQixDQUFDO0FBQUEsUUFDekIsZUFBZSx1QkFBdUIsQ0FBQztBQUFBLE1BQ3pDO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEseUJBQ0UsZUFDQSxRQUNBLGNBQ0EsUUFDQSxjQUNBLGdCQUNBLHNCQUNBLFdBQ0E7QUFDQSxVQUFNLE1BQU0sS0FBSztBQUNqQixRQUFJLE9BQU8sTUFBTTtBQUNmLFVBQUk7QUFBQSxRQUNGO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFDQTtBQUFBLElBQ0Y7QUFDQSxhQUFTLElBQUksR0FBRyxJQUFJLFdBQVcsS0FBSztBQUNsQyxXQUFLQSxHQUFLO0FBQUEsUUFDUjtBQUFBLFFBQ0EsT0FBTyxlQUFlLENBQUM7QUFBQSxRQUN2QixPQUFPLGVBQWUsQ0FBQztBQUFBLFFBQ3ZCLGVBQWUsdUJBQXVCLENBQUM7QUFBQSxNQUN6QztBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsZ0JBQWdCLE9BQWM7QUFDNUIsV0FBTyxRQUFTO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsWUFBWSxTQUFtQztBQUM3QyxVQUFNLEtBQUssS0FBS0E7QUFDaEIsUUFBSSxRQUFRLFdBQVcsR0FBRztBQUN4QixTQUFHLFlBQVksQ0FBQyxHQUFHLElBQUksQ0FBQztBQUN4QjtBQUFBLElBQ0Y7QUFDQSxVQUFNLFNBQVMsUUFBUSxDQUFDLEVBQUUsbUJBQW1CO0FBQzdDLE9BQUc7QUFBQSxNQUNELFFBQVEsSUFBSSxTQUFPO0FBQ2pCLGVBQU8sSUFBSSxtQkFBbUI7QUFBQSxNQUNoQyxDQUFDO0FBQUEsSUFDSDtBQUVBLFFBQUksV0FBVyxHQUFHLFFBQVEsUUFBUSxXQUFXLEdBQUc7QUFDOUMsU0FBRyxVQUFVLE9BQU8sT0FBTyxPQUFPLEtBQUs7QUFBQSxJQUN6QyxPQUFPO0FBQ0wsU0FBRyxVQUFVLE1BQU0sTUFBTSxNQUFNLElBQUk7QUFBQSxJQUNyQztBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPUU8sR0FBZ0Isb0JBQTRCO0FBQ2xELFFBQUksS0FBSy9CLE9BQTBCLG9CQUFvQjtBQUNyRDtBQUFBLElBQ0Y7QUFDQSxTQUFLd0IsR0FBSyxjQUFjLEtBQUtBLEdBQUssV0FBVyxrQkFBa0I7QUFDL0QsU0FBS3hCLEtBQXdCO0FBQUEsRUFDL0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLGNBQWMsb0JBQTJCLFNBQXVCO0FBQzlELFVBQU0sTUFBTSxLQUFLSSxHQUFnQixJQUFJLGtCQUFrQjtBQUN2RCxRQUFJLFFBQVEsU0FBUztBQUNuQixXQUFLMkIsR0FBZ0Isa0JBQWtCO0FBQ3ZDLFdBQUtQLEdBQUssWUFBWSxLQUFLQSxHQUFLLFlBQVksT0FBTztBQUNuRCxXQUFLcEIsR0FBZ0IsSUFBSSxvQkFBb0IsT0FBTztBQUFBLElBQ3REO0FBRUEsU0FBS0gsR0FBbUIsa0JBQWtCLElBQUk7QUFBQSxFQUNoRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsbUJBQW1CLG9CQUEyQixTQUF1QjtBQUNuRSxVQUFNLE1BQU0sS0FBS0csR0FBZ0IsSUFBSSxrQkFBa0I7QUFDdkQsUUFBSSxRQUFRLFNBQVM7QUFDbkIsV0FBSzJCLEdBQWdCLGtCQUFrQjtBQUN2QyxXQUFLUCxHQUFLLFlBQVksS0FBS0EsR0FBSyxrQkFBa0IsT0FBTztBQUN6RCxXQUFLcEIsR0FBZ0IsSUFBSSxvQkFBb0IsT0FBTztBQUFBLElBQ3REO0FBRUEsU0FBS0YsR0FBd0Isa0JBQWtCLElBQUk7QUFBQSxFQUNyRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsbUJBQW1CLG9CQUEyQixTQUF1QjtBQUNuRSxVQUFNLE9BQU8sS0FBS0csR0FBZ0IsSUFBSSxrQkFBa0I7QUFDeEQsUUFBSSxTQUFTLFNBQVM7QUFDcEIsV0FBS21CLEdBQUssWUFBWSxvQkFBb0IsT0FBTztBQUNqRCxXQUFLbkIsR0FBZ0IsSUFBSSxvQkFBb0IsT0FBTztBQUFBLElBQ3REO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsZ0JBQWdCLG9CQUEyQixTQUF1QjtBQUNoRSxVQUFNLE1BQU0sS0FBS0QsR0FBZ0IsSUFBSSxrQkFBa0I7QUFDdkQsUUFBSSxRQUFRLFNBQVM7QUFDbkIsV0FBSzJCLEdBQWdCLGtCQUFrQjtBQUN2QyxXQUFLUCxHQUFLLFlBQVksS0FBS0EsR0FBSyxrQkFBa0IsT0FBTztBQUN6RCxXQUFLcEIsR0FBZ0IsSUFBSSxvQkFBb0IsT0FBTztBQUFBLElBQ3REO0FBRUEsU0FBS0QsR0FBcUIsa0JBQWtCLElBQUk7QUFBQSxFQUNsRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxnQkFBZ0Isb0JBQTJCO0FBQ3pDLFNBQUs0QixHQUFnQixrQkFBa0I7QUFDdkMsU0FBS1AsR0FBSyxZQUFZLEtBQUtBLEdBQUssWUFBWSxJQUFJO0FBQ2hELFNBQUtwQixHQUFnQixPQUFPLGtCQUFrQjtBQUM5QyxXQUFPLEtBQUtILEdBQW1CLGtCQUFrQjtBQUFBLEVBQ25EO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLHFCQUFxQixvQkFBMkI7QUFDOUMsU0FBSzhCLEdBQWdCLGtCQUFrQjtBQUN2QyxTQUFLUCxHQUFLLFlBQVksS0FBS0EsR0FBSyxrQkFBa0IsSUFBSTtBQUN0RCxTQUFLcEIsR0FBZ0IsT0FBTyxrQkFBa0I7QUFDOUMsV0FBTyxLQUFLRixHQUF3QixrQkFBa0I7QUFBQSxFQUN4RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxrQkFBa0Isb0JBQTJCO0FBQzNDLFNBQUs2QixHQUFnQixrQkFBa0I7QUFDdkMsU0FBS1AsR0FBSyxZQUFZLEtBQUtBLEdBQUssa0JBQWtCLElBQUk7QUFDdEQsU0FBS3BCLEdBQWdCLE9BQU8sa0JBQWtCO0FBQzlDLFdBQU8sS0FBS0QsR0FBcUIsa0JBQWtCO0FBQUEsRUFDckQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsaUJBQWlCO0FBQ2YsYUFBUyxJQUFJLEdBQUcsSUFBSSxLQUFLRixHQUFtQixRQUFRLEtBQUs7QUFDdkQsVUFBSSxLQUFLQSxHQUFtQixDQUFDLEtBQUssTUFBTTtBQUN0QztBQUFBLE1BQ0Y7QUFDQSxXQUFLOEIsR0FBZ0IsRUFBRTtBQUN2QixXQUFLUCxHQUFLLFlBQVksS0FBS0EsR0FBSyxZQUFZLElBQUk7QUFDaEQsYUFBTyxLQUFLdkIsR0FBbUIsQ0FBQztBQUFBLElBQ2xDO0FBRUEsYUFBUyxJQUFJLEdBQUcsSUFBSSxLQUFLQyxHQUF3QixRQUFRLEtBQUs7QUFDNUQsVUFBSSxLQUFLQSxHQUF3QixDQUFDLEtBQUssTUFBTTtBQUMzQztBQUFBLE1BQ0Y7QUFDQSxXQUFLNkIsR0FBZ0IsRUFBRTtBQUN2QixXQUFLUCxHQUFLLFlBQVksS0FBS0EsR0FBSyxrQkFBa0IsSUFBSTtBQUN0RCxhQUFPLEtBQUt0QixHQUF3QixDQUFDO0FBQUEsSUFDdkM7QUFFQSxhQUFTLElBQUksR0FBRyxJQUFJLEtBQUtDLEdBQXFCLFFBQVEsS0FBSztBQUN6RCxVQUFJLEtBQUtBLEdBQXFCLENBQUMsS0FBSyxNQUFNO0FBQ3hDO0FBQUEsTUFDRjtBQUNBLFdBQUs0QixHQUFnQixFQUFFO0FBQ3ZCLFdBQUtQLEdBQUssWUFBWSxLQUFLQSxHQUFLLGtCQUFrQixJQUFJO0FBQ3RELGFBQU8sS0FBS3JCLEdBQXFCLENBQUM7QUFBQSxJQUNwQztBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFRdUIsR0FBZSxRQUFnQixXQUErQjtBQUNwRSxVQUFNLEtBQVUsS0FBS0Y7QUFFckIsUUFBSSxDQUFDLEtBQUtELEdBQWEsSUFBSSxTQUFTLEdBQUc7QUFDckMsWUFBTSxTQUFTLEdBQUcsYUFBYSxVQUFVLFNBQVMsQ0FBQztBQUNuRCxVQUFJLFVBQVUsUUFBUSxPQUFPLHlCQUF5QjtBQUNwRCxjQUFNLE9BQU8sR0FBRyxVQUFVLFNBQVMsQ0FBQztBQUNwQyxlQUFPLFFBQVEsS0FBSyxJQUFJO0FBQUEsTUFDMUI7QUFDQSxXQUFLQSxHQUFhLElBQUksV0FBVyxNQUFNO0FBQ3ZDLGFBQU87QUFBQSxJQUNUO0FBQ0EsV0FBTyxLQUFLQSxHQUFhLElBQUksU0FBUztBQUFBLEVBQ3hDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT1FJLEdBQWdDLFFBQWdCLFdBQStCO0FBaG5CekY7QUFpbkJJLFVBQU0sS0FBSyxLQUFLSDtBQUVoQixRQUFJLENBQUMsS0FBS0QsR0FBYSxJQUFJLFNBQVMsR0FBRztBQUNyQyxZQUFNLGdCQUFnQixVQUFVLFNBQVM7QUFDekMsWUFBTSxVQUNKLGNBQUcsYUFBYSxhQUFhLE1BQTdCLFlBQ0EsR0FBRyxhQUFhLE9BQU8sYUFBYSxFQUFFLE1BRHRDLFlBRUEsR0FBRyxhQUFhLFVBQVUsYUFBYSxFQUFFO0FBRTNDLFVBQUksVUFBVSxRQUFRLE9BQU8seUJBQXlCO0FBQ3BELGNBQU0sT0FBTyxHQUFHLFVBQVUsU0FBUyxDQUFDO0FBQ3BDLGVBQU8sUUFBUSxLQUFLLElBQUk7QUFBQSxNQUMxQixPQUFPO0FBQ0wsYUFBS0EsR0FBYSxJQUFJLFdBQVcsTUFBTTtBQUFBLE1BQ3pDO0FBQ0EsYUFBTztBQUFBLElBQ1Q7QUFDQSxXQUFPLEtBQUtBLEdBQWEsSUFBSSxTQUFTO0FBQUEsRUFDeEM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0EsWUFBWSxNQUFjLEtBQWEsT0FBZSxRQUFzQjtBQUMxRSxVQUFNLEtBQVUsS0FBS0M7QUFDckIsUUFDRSxLQUFLaEIsT0FBcUIsU0FDMUIsS0FBS0MsT0FBc0IsVUFDM0IsS0FBS0gsT0FBb0IsUUFDekIsS0FBS0MsT0FBbUIsS0FDeEI7QUFDQSxTQUFHLFNBQVMsTUFBTSxLQUFLLE9BQU8sTUFBTTtBQUNwQyxXQUFLRCxLQUFrQjtBQUN2QixXQUFLQyxLQUFpQjtBQUN0QixXQUFLQyxLQUFtQjtBQUN4QixXQUFLQyxLQUFvQjtBQUFBLElBQzNCO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxxQkFBcUIsVUFBeUI7QUFDNUMsVUFBTSxLQUFVLEtBQUtlO0FBQ3JCLFFBQ0UsS0FBS2hCLE9BQXFCLFNBQVMsS0FDbkMsS0FBS0MsT0FBc0IsU0FBUyxLQUNwQyxLQUFLSCxPQUFvQixTQUFTLEtBQ2xDLEtBQUtDLE9BQW1CLFNBQVMsR0FDakM7QUFDQSxTQUFHLFNBQVMsU0FBUyxHQUFHLFNBQVMsR0FBRyxTQUFTLEdBQUcsU0FBUyxDQUFDO0FBQzFELFdBQUtELEtBQWtCLFNBQVM7QUFDaEMsV0FBS0MsS0FBaUIsU0FBUztBQUMvQixXQUFLQyxLQUFtQixTQUFTO0FBQ2pDLFdBQUtDLEtBQW9CLFNBQVM7QUFBQSxJQUNwQztBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTVFtQixLQUF5QjtBQUMvQixRQUFJLENBQUMsS0FBSyxVQUFVO0FBQ2xCO0FBQUEsSUFDRjtBQUVBLFVBQU0sS0FBVSxLQUFLSjtBQUNyQixVQUFNLGtCQUFrQixHQUFHLGFBQWEsR0FBRywrQkFBK0I7QUFDMUUsVUFBTSxlQUFlLEdBQUcsYUFBYSxHQUFHLHNCQUFzQjtBQUM5RCxTQUFLVCxLQUEyQixHQUFHLGFBQWEsR0FBRyx5QkFBeUI7QUFDNUUsU0FBS0MsS0FBNkIsR0FBRyxhQUFhLEdBQUcsMkJBQTJCO0FBQ2hGLFNBQUtDLEtBQStCLEtBQUssSUFBSSxLQUFLRixJQUEwQixLQUFLQyxFQUEwQjtBQUMzRyxTQUFLRixLQUErQixlQUFnQixlQUFlO0FBQ25FLFNBQUtJLEtBQWlDO0FBQ3RDLFNBQUtDLEtBQXdCO0FBQUEsRUFDL0I7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtRVSxLQUF5QjtBQUMvQixVQUFNLEtBQUssS0FBSyxjQUFjO0FBQzlCLFNBQUtULEtBQTRCLEdBQUcsYUFBYSxHQUFHLDBCQUEwQjtBQUM5RSxTQUFLQSxLQUE0QixHQUFHLGFBQWEsR0FBRywwQkFBMEI7QUFBQSxFQUNoRjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS1FVLEtBQXNCO0FBQzVCLFVBQU0sS0FBSyxLQUFLLGNBQWM7QUFDOUIsU0FBS1IsS0FBbUIsR0FBRyxhQUFhLEdBQUcsZ0JBQWdCO0FBQUEsRUFDN0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsb0JBQW9CO0FBQ2xCLFdBQU8sS0FBS0E7QUFBQSxFQUNkO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLGdDQUFnQztBQUM5QixXQUFPLEtBQUtMO0FBQUEsRUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxnQ0FBZ0M7QUFDOUIsV0FBTyxLQUFLSDtBQUFBLEVBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsNkJBQTZCO0FBQzNCLFdBQU8sS0FBS007QUFBQSxFQUNkO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLCtCQUErQjtBQUM3QixXQUFPLEtBQUtDO0FBQUEsRUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxxQkFBcUI7QUFDbkIsUUFBSSxLQUFLLGlCQUFpQjtBQUN4QixZQUFNLFNBQVMsS0FBSyxnQkFBZ0IsY0FBYztBQUNsRCxhQUFPO0FBQUEsSUFDVDtBQUVBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLFlBQVksUUFBZ0I7QUFDMUIsV0FBTyxLQUFLSSxNQUFrQixPQUFPO0FBQUEsRUFDdkM7QUFDRjsiLAogICJuYW1lcyI6IFsiX193ZWJnbFZlcnNpb24iLCAiX19hY3RpdmVUZXh0dXJlQmFja3VwIiwgIl9fYWN0aXZlVGV4dHVyZXMyRCIsICJfX2FjdGl2ZVRleHR1cmVzMkRBcnJheSIsICJfX2FjdGl2ZVRleHR1cmVzQ3ViZSIsICJfX2JvdW5kVGV4dHVyZXMiLCAiX19ib3VuZFNhbXBsZXJzIiwgIl9fdmlld3BvcnRfbGVmdCIsICJfX3ZpZXdwb3J0X3RvcCIsICJfX3ZpZXdwb3J0X3dpZHRoIiwgIl9fdmlld3BvcnRfaGVpZ2h0IiwgIl9fZGVmYXVsdF92aWV3cG9ydF9sZWZ0IiwgIl9fZGVmYXVsdF92aWV3cG9ydF90b3AiLCAiX19kZWZhdWx0X3ZpZXdwb3J0X3dpZHRoIiwgIl9fZGVmYXVsdF92aWV3cG9ydF9oZWlnaHQiLCAiX19hbGlnbmVkTWF4VW5pZm9ybUJsb2NrU2l6ZSIsICJfX21heFZlcnRleFVuaWZvcm1CbG9ja3MiLCAiX19tYXhGcmFnbWVudFVuaWZvcm1CbG9ja3MiLCAiX19tYXhDb252ZW50aW9uVW5pZm9ybUJsb2NrcyIsICJfX3VuaWZvcm1CdWZmZXJPZmZzZXRBbGlnbm1lbnQiLCAiX19tYXhVbmlmb3JtQmxvY2tTaXplIiwgIl9fbWF4VmVydGV4VW5pZm9ybVZlY3RvcnMiLCAiX19tYXhGcmFnbWVudFVuaWZvcm1WZWN0b3JzIiwgIl9fbWF4VGV4dHVyZVNpemUiLCAiX19leHRlbnNpb25zIiwgIl9fZ2wiLCAiX19pc19tdWx0aXZpZXciLCAiX19nZXRFeHRlbnNpb24iLCAiX19nZXRDb21wcmVzc2VkVGV4dHVyZUV4dGVuc2lvbiIsICJfX2dldFVuaWZvcm1CdWZmZXJJbmZvIiwgIl9fZ2V0TWF4VW5pZm9ybVZlY3RvcnMiLCAiX19nZXRNYXhUZXh0dXJlU2l6ZSIsICJfX2FjdGl2ZVRleHR1cmUiXQp9Cg==
