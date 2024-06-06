export declare class WebGLStereoUtil {
    private static __instance;
    private __gl;
    private __vertexShader?;
    private __fragmentShader?;
    private __program?;
    private __attrib?;
    private __uniform?;
    constructor(gl: WebGL2RenderingContext);
    static getInstance(gl: WebGL2RenderingContext): WebGLStereoUtil;
    private __attachShaderSource;
    private __bindAttribLocation;
    private __getUniformLocations;
    blit(source_texture: WebGLTexture, source_rect_uv_x: number, source_rect_uv_y: number, source_rect_uv_width: number, source_rect_uv_height: number, dest_surface_width: number, dest_surface_height: number): void;
    blitFake(source_texture: WebGLTexture, source_rect_uv_x: number, source_rect_uv_y: number, source_rect_uv_width: number, source_rect_uv_height: number, dest_surface_width: number, dest_surface_height: number): void;
    blit2(srcTexture: WebGLTexture, dstTexture: WebGLTexture, width: number, height: number): void;
}
