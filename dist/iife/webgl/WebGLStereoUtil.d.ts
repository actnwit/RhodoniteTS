/**
 * A utility class for handling WebGL stereo rendering operations.
 * This class provides functionality for blitting texture arrays to create stereo images
 * for VR applications, particularly those targeting Oculus/Meta platforms.
 *
 * The class implements multiview rendering techniques to efficiently render
 * stereo content by using texture arrays where each layer represents a different eye view.
 */
export declare class WebGLStereoUtil {
    private static __instance;
    private __gl;
    private __vertexShader?;
    private __fragmentShader?;
    private __program?;
    private __attrib?;
    private __uniform?;
    /**
     * Creates a new WebGLStereoUtil instance.
     * Initializes the WebGL program with multiview vertex and fragment shaders,
     * sets up attribute locations, and retrieves uniform locations.
     *
     * @param gl - The WebGL2 rendering context to use for operations
     */
    constructor(gl: WebGL2RenderingContext);
    /**
     * Gets the singleton instance of WebGLStereoUtil.
     * Creates a new instance if one doesn't exist.
     *
     * @param gl - The WebGL2 rendering context to use for the instance
     * @returns The singleton WebGLStereoUtil instance
     */
    static getInstance(gl: WebGL2RenderingContext): WebGLStereoUtil;
    /**
     * Attaches and compiles a shader source to the WebGL program.
     *
     * @param source - The shader source code as a string
     * @param type - The shader type (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER)
     * @private
     */
    private __attachShaderSource;
    /**
     * Binds attribute locations for the shader program.
     *
     * @param attribLocationMap - A map of attribute names to their location indices
     * @private
     */
    private __bindAttribLocation;
    /**
     * Retrieves and caches uniform locations from the compiled shader program.
     * This method iterates through all active uniforms in the program and stores
     * their locations for efficient access during rendering.
     *
     * @private
     */
    private __getUniformLocations;
    /**
     * Blits a texture array to create a stereo image by rendering both eye views.
     * This method sets up the rendering state, binds the source texture array,
     * and renders 12 vertices (2 triangulated quads) to display both eye views side by side.
     *
     * @param source_texture - The source texture array containing stereo image data
     * @param source_rect_uv_x - The U coordinate offset in normalized texture space (0-1)
     * @param source_rect_uv_y - The V coordinate offset in normalized texture space (0-1)
     * @param source_rect_uv_width - The width of the source rectangle in normalized texture space
     * @param source_rect_uv_height - The height of the source rectangle in normalized texture space
     * @param dest_surface_width - The width of the destination surface in pixels
     * @param dest_surface_height - The height of the destination surface in pixels
     */
    blit(source_texture: WebGLTexture, source_rect_uv_x: number, source_rect_uv_y: number, source_rect_uv_width: number, source_rect_uv_height: number, dest_surface_width: number, dest_surface_height: number): void;
    /**
     * A simplified version of the blit method for testing purposes.
     * This method performs the same texture array blitting operation but without
     * modifying various WebGL state settings like depth testing, stencil testing, etc.
     * This can be useful for debugging or when the calling code manages state externally.
     *
     * @param source_texture - The source texture array containing stereo image data
     * @param source_rect_uv_x - The U coordinate offset in normalized texture space (0-1)
     * @param source_rect_uv_y - The V coordinate offset in normalized texture space (0-1)
     * @param source_rect_uv_width - The width of the source rectangle in normalized texture space
     * @param source_rect_uv_height - The height of the source rectangle in normalized texture space
     * @param dest_surface_width - The width of the destination surface in pixels
     * @param dest_surface_height - The height of the destination surface in pixels
     */
    blitFake(source_texture: WebGLTexture, source_rect_uv_x: number, source_rect_uv_y: number, source_rect_uv_width: number, source_rect_uv_height: number, dest_surface_width: number, dest_surface_height: number): void;
    /**
     * Blits a texture array to a 2D texture by copying each layer side by side.
     * This method creates framebuffers to copy individual layers from the source
     * texture array to different horizontal positions in the destination 2D texture.
     * The left eye (layer 0) is copied to the left half, and the right eye (layer 1)
     * is copied to the right half of the destination texture.
     *
     * @param srcTexture - The source texture array containing stereo layers
     * @param dstTexture - The destination 2D texture to receive the blitted content
     * @param width - The width of each eye view in pixels
     * @param height - The height of each eye view in pixels
     */
    blit2(srcTexture: WebGLTexture, dstTexture: WebGLTexture, width: number, height: number): void;
}
