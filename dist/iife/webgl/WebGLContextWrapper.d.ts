import type { Config } from '../foundation/core/Config';
import type { RenderBufferTargetEnum } from '../foundation/definitions/RenderBufferTarget';
import { Vector4 } from '../foundation/math/Vector4';
import type { Index, Size } from '../types/CommonTypes';
import { type WebGLExtensionEnum } from './WebGLExtension';
interface WEBGL_compressed_texture_etc {
    readonly COMPRESSED_RGBA8_ETC2_EAC: number;
}
interface WEBGL_compressed_texture_bptc {
    readonly COMPRESSED_RGBA_BPTC_UNORM_EXT: number;
}
/** PVRTC (often exposed via WEBKIT_ prefix); not always present in TS DOM libs */
interface WEBKIT_WEBGL_compressed_texture_pvrtc {
    readonly COMPRESSED_RGB_PVRTC_4BPPV1_IMG: number;
    readonly COMPRESSED_RGB_PVRTC_2BPPV1_IMG: number;
    readonly COMPRESSED_RGBA_PVRTC_4BPPV1_IMG: number;
    readonly COMPRESSED_RGBA_PVRTC_2BPPV1_IMG: number;
}
/** ATC compression (mobile); not always present in TS DOM libs */
interface WEBGL_compressed_texture_atc {
    readonly COMPRESSED_RGB_ATC_WEBGL: number;
    readonly COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL: number;
    readonly COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL: number;
}
interface WEBGL_multiview {
    framebufferTextureMultiviewOVR(target: number, attachment: number, texture: WebGLTexture, level: number, baseViewIndex: number, numViews: number): void;
    framebufferTextureMultisampleMultiviewOVR(target: number, attachment: number, texture: WebGLTexture, level: number, samples: number, baseViewIndex: number, numViews: number): void;
    is_multisample: boolean;
}
/**
 * A wrapper class for WebGL context that provides enhanced functionality and state management.
 * This class handles WebGL state optimization, extension management, and provides convenience methods
 * for common WebGL operations while maintaining compatibility with both WebGL1 and WebGL2.
 */
export declare class WebGLContextWrapper {
    __gl: WebGL2RenderingContext;
    __webglVersion: number;
    width: Size;
    height: Size;
    readonly canvas: HTMLCanvasElement;
    readonly webgl1ExtVAO?: OES_vertex_array_object;
    readonly webgl1ExtIA?: ANGLE_instanced_arrays;
    readonly webgl1ExtTF?: OES_texture_float;
    readonly webgl1ExtTHF?: OES_texture_half_float;
    readonly webgl1ExtTFL?: OES_texture_float_linear;
    readonly webgl1ExtTHFL?: OES_texture_half_float_linear;
    readonly webgl1ExtTFA?: EXT_texture_filter_anisotropic;
    readonly webgl1ExtEIUI?: OES_element_index_uint;
    readonly webgl1ExtSTL?: EXT_shader_texture_lod;
    readonly webgl1ExtDRV?: OES_standard_derivatives;
    readonly webgl1ExtDB?: WEBGL_draw_buffers;
    readonly webgl1ExtBM?: EXT_blend_minmax;
    readonly webgl1ExtCBF?: WEBGL_color_buffer_float;
    readonly webgl1ExtCTAstc?: WEBGL_compressed_texture_astc;
    readonly webgl1ExtCTS3tc?: WEBGL_compressed_texture_s3tc;
    readonly webgl1ExtCTPvrtc?: WEBKIT_WEBGL_compressed_texture_pvrtc;
    readonly webgl1ExtCTAtc?: WEBGL_compressed_texture_atc;
    readonly webgl1ExtCTEtc?: WEBGL_compressed_texture_etc;
    readonly webgl1ExtCTEtc1?: WEBGL_compressed_texture_etc1;
    readonly webgl1ExtCTBptc?: WEBGL_compressed_texture_bptc;
    readonly webgl2ExtTFL?: OES_texture_float_linear;
    readonly webgl2ExtTHFL?: OES_texture_half_float_linear;
    readonly webgl2ExtTFA?: EXT_texture_filter_anisotropic;
    readonly webgl2ExtCBF?: EXT_color_buffer_float;
    readonly webgl2ExtCBHF?: EXT_color_buffer_half_float;
    readonly webgl2ExtCTAstc?: WEBGL_compressed_texture_astc;
    readonly webgl2ExtCTS3tc?: WEBGL_compressed_texture_s3tc;
    readonly webgl2ExtCTPvrtc?: WEBKIT_WEBGL_compressed_texture_pvrtc;
    readonly webgl2ExtCTAtc?: WEBGL_compressed_texture_atc;
    readonly webgl2ExtCTEtc?: WEBGL_compressed_texture_etc;
    readonly webgl2ExtCTEtc1?: WEBGL_compressed_texture_etc1;
    readonly webgl2ExtCTBptc?: WEBGL_compressed_texture_bptc;
    readonly webgl2ExtMLTVIEW?: WEBGL_multiview;
    readonly webgl2ExtClipCtrl?: any;
    readonly webgl2ExtGmanWM?: any;
    private __activeTextureBackup;
    private __activeTextures2D;
    private __activeTextures2DArray;
    private __activeTexturesCube;
    private __boundTextures;
    private __boundSamplers;
    private __viewport_left;
    private __viewport_top;
    private __viewport_width;
    private __viewport_height;
    private __default_viewport_left;
    private __default_viewport_top;
    private __default_viewport_width;
    private __default_viewport_height;
    private __alignedMaxUniformBlockSize;
    private __maxVertexUniformBlocks;
    private __maxFragmentUniformBlocks;
    private __maxConventionUniformBlocks;
    private __uniformBufferOffsetAlignment;
    private __maxUniformBlockSize;
    private __maxVertexUniformVectors;
    private __maxFragmentUniformVectors;
    private __maxTextureSize;
    private readonly __is_multiview;
    _isWebXRMode: boolean;
    /**
     * Cached results of getExtension / vendor-prefixed getExtension.
     * Values are WebGL extension API objects (distinct from WebGLResource: buffers, textures, programs, etc.).
     */
    __extensions: Map<WebGLExtensionEnum, object | null>;
    /**
     * Creates a new WebGLContextWrapper instance.
     * @param config - The configuration for the WebGL context
     * @param gl - The WebGL2 rendering context to wrap
     * @param canvas - The HTML canvas element associated with the context
     */
    constructor(config: Config, gl: WebGL2RenderingContext, canvas: HTMLCanvasElement);
    /**
     * Gets the raw WebGL rendering context.
     * @returns The underlying WebGL context (WebGL1 or WebGL2)
     */
    getRawContext(): WebGLRenderingContext | WebGL2RenderingContext;
    /**
     * Gets the raw WebGL context cast as WebGL1.
     * @returns The underlying WebGL context as WebGL1 type
     */
    getRawContextAsWebGL1(): WebGLRenderingContext;
    /**
     * Gets the raw WebGL context cast as WebGL2.
     * @returns The underlying WebGL context as WebGL2 type
     */
    getRawContextAsWebGL2(): WebGL2RenderingContext;
    /**
     * Gets the current viewport settings.
     * @returns A Vector4 containing viewport left, top, width, and height
     */
    get viewport(): Vector4;
    /**
     * Gets the default viewport settings.
     * @returns A Vector4 containing default viewport left, top, width, and height
     */
    get defaultViewport(): Vector4;
    /**
     * Checks if a WebGL1 extension is supported.
     * @param webGLExtension - The WebGL extension to check
     * @returns True if the extension is supported, false otherwise
     */
    isSupportWebGL1Extension(config: Config, webGLExtension: WebGLExtensionEnum): boolean;
    /**
     * Checks if a WebGL1 extension is not supported.
     * @param webGLExtension - The WebGL extension to check
     * @returns True if the extension is not supported, false otherwise
     */
    isNotSupportWebGL1Extension(config: Config, webGLExtension: WebGLExtensionEnum): boolean;
    /**
     * Type guard to check if the context is WebGL2.
     * @param gl - The WebGL context to check
     * @returns True if the context is WebGL2, false otherwise
     */
    getIsWebGL2(gl: WebGLRenderingContext | WebGL2RenderingContext): gl is WebGL2RenderingContext;
    /**
     * Checks if the current context is WebGL2.
     * @returns True if WebGL2, false if WebGL1
     */
    get isWebGL2(): boolean;
    /**
     * Creates a new vertex array object.
     * @returns A new WebGL vertex array object
     */
    createVertexArray(): WebGLVertexArrayObject;
    /**
     * Deletes a vertex array object.
     * @param vertexArray - The vertex array object to delete
     */
    deleteVertexArray(vertexArray: WebGLVertexArrayObject | WebGLVertexArrayObjectOES): void;
    /**
     * Binds a vertex array object.
     * @param vao - The vertex array object to bind, or null to unbind
     */
    bindVertexArray(vao: WebGLVertexArrayObjectOES | null): void;
    /**
     * Sets the divisor for instanced rendering for a vertex attribute.
     * @param index - The index of the vertex attribute
     * @param divisor - The divisor value (0 for per-vertex, 1+ for per-instance)
     */
    vertexAttribDivisor(index: number, divisor: number): void;
    /**
     * Draws elements with instancing support.
     * @param primitiveMode - The primitive mode (GL_TRIANGLES, etc.)
     * @param indexCount - The number of indices to draw
     * @param type - The type of the index values
     * @param offset - The offset in the index buffer
     * @param instanceCount - The number of instances to draw
     */
    drawElementsInstanced(primitiveMode: number, indexCount: number, type: number, offset: number, instanceCount: number): void;
    /**
     * Draws arrays with instancing support.
     * @param primitiveMode - The primitive mode (GL_TRIANGLES, etc.)
     * @param first - The starting index in the enabled arrays
     * @param count - The number of vertices to draw
     * @param instanceCount - The number of instances to draw
     */
    drawArraysInstanced(primitiveMode: number, first: number, count: number, instanceCount: number): void;
    /**
     * Gets the color attachment constant for a given index.
     * @param index - The attachment index
     * @returns The WebGL color attachment constant
     */
    colorAttachment(index: Index): number;
    /**
     * Sets the draw buffers for multiple render targets.
     * @param buffers - Array of render buffer targets to draw to
     */
    drawBuffers(buffers: RenderBufferTargetEnum[]): void;
    /**
     * Activates a texture unit for subsequent texture operations.
     * Optimized to avoid redundant state changes.
     * @param activeTextureIndex - The texture unit index to activate
     */
    private __activeTexture;
    /**
     * Binds a 2D texture to a specific texture unit.
     * Optimized to avoid redundant state changes.
     * @param activeTextureIndex - The texture unit index
     * @param texture - The 2D texture to bind
     */
    bindTexture2D(activeTextureIndex: Index, texture: WebGLTexture): void;
    /**
     * Binds a 2D array texture to a specific texture unit.
     * Optimized to avoid redundant state changes.
     * @param activeTextureIndex - The texture unit index
     * @param texture - The 2D array texture to bind
     */
    bindTexture2DArray(activeTextureIndex: Index, texture: WebGLTexture): void;
    /**
     * Binds a sampler object to a specific texture unit.
     * Optimized to avoid redundant state changes.
     * @param activeTextureIndex - The texture unit index
     * @param sampler - The sampler object to bind
     */
    bindTextureSampler(activeTextureIndex: Index, sampler: WebGLSampler): void;
    /**
     * Binds a cube map texture to a specific texture unit.
     * Optimized to avoid redundant state changes.
     * @param activeTextureIndex - The texture unit index
     * @param texture - The cube map texture to bind
     */
    bindTextureCube(activeTextureIndex: Index, texture: WebGLTexture): void;
    /**
     * Unbinds a 2D texture from a specific texture unit.
     * @param activeTextureIndex - The texture unit index
     */
    unbindTexture2D(activeTextureIndex: Index): void;
    /**
     * Unbinds a 2D array texture from a specific texture unit.
     * @param activeTextureIndex - The texture unit index
     */
    unbindTexture2DArray(activeTextureIndex: Index): void;
    /**
     * Unbinds a cube map texture from a specific texture unit.
     * @param activeTextureIndex - The texture unit index
     */
    unbindTextureCube(activeTextureIndex: Index): void;
    /**
     * Unbinds all currently bound textures from all texture units.
     * This is useful for cleanup operations.
     */
    unbindTextures(): void;
    /**
     * Gets a WebGL extension and caches it for future use.
     * @param config - The configuration for the WebGL context
     * @param extension - The extension to retrieve
     * @returns The extension object or null if not available
     */
    private __getExtension;
    /**
     * Gets a compressed texture extension with vendor prefix support.
     * @param extension - The compressed texture extension to retrieve
     * @returns The extension object or null if not available
     */
    private __getCompressedTextureExtension;
    /**
     * Sets the viewport with optimization to avoid redundant state changes.
     * @param left - Left coordinate of the viewport
     * @param top - Top coordinate of the viewport
     * @param width - Width of the viewport
     * @param height - Height of the viewport
     */
    setViewport(left: number, top: number, width: number, height: number): void;
    /**
     * Sets the viewport using a Vector4 with optimization to avoid redundant state changes.
     * @param viewport - Vector4 containing left, top, width, and height
     */
    setViewportAsVector4(viewport: Vector4): void;
    /**
     * Retrieves and caches uniform buffer information for WebGL2.
     * This includes alignment requirements and size limits.
     */
    private __getUniformBufferInfo;
    /**
     * Retrieves and caches the maximum number of uniform vectors for vertex and fragment shaders.
     */
    private __getMaxUniformVectors;
    /**
     * Retrieves and caches the maximum texture size.
     */
    private __getMaxTextureSize;
    /**
     * Gets the maximum texture size.
     * @returns The maximum texture size
     */
    getMaxTextureSize(): number;
    /**
     * Gets the maximum number of uniform blocks that can be used in both vertex and fragment shaders.
     * @returns The minimum of vertex and fragment shader uniform block limits
     */
    getMaxConventionUniformBlocks(): number;
    /**
     * Gets the maximum uniform block size aligned to the required offset alignment.
     * @returns The aligned maximum uniform block size in bytes
     */
    getAlignedMaxUniformBlockSize(): number;
    /**
     * Gets the maximum number of uniform vectors available in vertex shaders.
     * @returns The maximum vertex uniform vectors
     */
    getMaxVertexUniformVectors(): number;
    /**
     * Gets the maximum number of uniform vectors available in fragment shaders.
     * @returns The maximum fragment uniform vectors
     */
    getMaxFragmentUniformVectors(): number;
    /**
     * Gets WebGL memory usage information if the GMAN_WEBGL_MEMORY extension is available.
     * @returns Memory information object or undefined if extension is not available
     */
    getWebGLMemoryInfo(): any;
    /**
     * Checks if multiview rendering is supported and enabled.
     * @returns True if multiview is available and enabled for WebVR
     */
    isMultiview(config: Config): boolean;
}
export {};
