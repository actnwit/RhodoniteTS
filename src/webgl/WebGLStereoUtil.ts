// This is from https://developer.oculus.com/documentation/web/web-multiview/

import { Logger } from '../foundation/misc/Logger';

const VSMultiview = [
  '#version 300 es',
  'uniform vec2 u_offset;',
  'uniform vec2 u_scale;',
  'out mediump vec3 v_texcoord;',

  'void main() {',
  // offset of eye quad in -1..1 space
  '    const float eye_offset_x[12] = float[12] (',
  '        0.0, 0.0, 0.0, 0.0, 0.0, 0.0,',
  '        1.0, 1.0, 1.0, 1.0, 1.0, 1.0',
  '    );',
  //  xy - coords of the quad, normalized to 0..1
  //  xy  - UV of the source texture coordinate.
  //  z   - texture layer (eye) index - 0 or 1.
  '    const vec3 quad_positions[12] = vec3[12]',
  '    (',
  '        vec3(0.0, 0.0, 0.0),',
  '        vec3(1.0, 0.0, 0.0),',
  '        vec3(0.0, 1.0, 0.0),',

  '        vec3(0.0, 1.0, 0.0),',
  '        vec3(1.0, 0.0, 0.0),',
  '        vec3(1.0, 1.0, 0.0),',

  '        vec3(0.0, 0.0, 1.0),',
  '        vec3(1.0, 0.0, 1.0),',
  '        vec3(0.0, 1.0, 1.0),',

  '        vec3(0.0, 1.0, 1.0),',
  '        vec3(1.0, 0.0, 1.0),',
  '        vec3(1.0, 1.0, 1.0)',
  '    );',

  '    const vec2 pos_scale = vec2(0.5, 1.0);',
  '    vec2 eye_offset = vec2(eye_offset_x[gl_VertexID], 0.0);',
  '    gl_Position = vec4(((quad_positions[gl_VertexID].xy * u_scale + u_offset) * pos_scale * 2.0) - 1.0 + eye_offset, 0.0, 1.0);',
  '    v_texcoord = vec3(quad_positions[gl_VertexID].xy * u_scale + u_offset, quad_positions[gl_VertexID].z);',
  '}',
].join('\n');

const FSMultiview = [
  '#version 300 es',
  'uniform mediump sampler2DArray u_source_texture;',
  'in mediump vec3 v_texcoord;',
  'out mediump vec4 output_color;',

  'void main()',
  '{',
  '    output_color = texture(u_source_texture, v_texcoord);',
  '}',
].join('\n');

/**
 * A utility class for handling WebGL stereo rendering operations.
 * This class provides functionality for blitting texture arrays to create stereo images
 * for VR applications, particularly those targeting Oculus/Meta platforms.
 *
 * The class implements multiview rendering techniques to efficiently render
 * stereo content by using texture arrays where each layer represents a different eye view.
 */
export class WebGLStereoUtil {
  private static __instance: WebGLStereoUtil;
  private __gl: WebGL2RenderingContext;
  // private __vao: WebGLVertexArrayObject;
  private __vertexShader?: WebGLShader;
  private __fragmentShader?: WebGLShader;
  private __program?: WebGLProgram;
  private __attrib?: Record<string, number>;
  private __uniform?: Record<string, WebGLUniformLocation>;

  /**
   * Creates a new WebGLStereoUtil instance.
   * Initializes the WebGL program with multiview vertex and fragment shaders,
   * sets up attribute locations, and retrieves uniform locations.
   *
   * @param gl - The WebGL2 rendering context to use for operations
   */
  constructor(gl: WebGL2RenderingContext) {
    this.__gl = gl;
    // this.__vao = gl.createVertexArray()!;
    this.__program = gl.createProgram()!;
    this.__attachShaderSource(VSMultiview, gl.VERTEX_SHADER);
    this.__attachShaderSource(FSMultiview, gl.FRAGMENT_SHADER);
    this.__gl.linkProgram(this.__program);
    this.__bindAttribLocation({
      v_texcoord: 0,
    });
    this.__getUniformLocations();
  }

  /**
   * Gets the singleton instance of WebGLStereoUtil.
   * Creates a new instance if one doesn't exist.
   *
   * @param gl - The WebGL2 rendering context to use for the instance
   * @returns The singleton WebGLStereoUtil instance
   */
  static getInstance(gl: WebGL2RenderingContext) {
    if (!this.__instance) {
      this.__instance = new WebGLStereoUtil(gl);
    }

    return this.__instance;
  }

  /**
   * Attaches and compiles a shader source to the WebGL program.
   *
   * @param source - The shader source code as a string
   * @param type - The shader type (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER)
   * @private
   */
  private __attachShaderSource(source: string, type: number) {
    const gl = this.__gl;
    let shader: WebGLShader;

    switch (type) {
      case gl.VERTEX_SHADER:
        this.__vertexShader = gl.createShader(type)!;
        shader = this.__vertexShader;
        break;
      case gl.FRAGMENT_SHADER:
        this.__fragmentShader = gl.createShader(type)!;
        shader = this.__fragmentShader;
        break;
      default:
        Logger.error(`Invalid Shader Type: ${type}`);
        return;
    }

    gl.attachShader(this.__program!, shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
  }

  /**
   * Binds attribute locations for the shader program.
   *
   * @param attribLocationMap - A map of attribute names to their location indices
   * @private
   */
  private __bindAttribLocation(attribLocationMap: Record<string, number>) {
    const gl = this.__gl;

    if (attribLocationMap) {
      this.__attrib = {};
      for (const attribName in attribLocationMap) {
        gl.bindAttribLocation(this.__program!, attribLocationMap[attribName], attribName);
        this.__attrib[attribName] = attribLocationMap[attribName];
      }
    }
  }

  /**
   * Retrieves and caches uniform locations from the compiled shader program.
   * This method iterates through all active uniforms in the program and stores
   * their locations for efficient access during rendering.
   *
   * @private
   */
  private __getUniformLocations() {
    const gl = this.__gl;
    if (this.__uniform == null) {
      this.__uniform = {};
      const uniformCount = gl.getProgramParameter(this.__program!, gl.ACTIVE_UNIFORMS);
      let uniformName = '';
      for (let i = 0; i < uniformCount; i++) {
        const uniformInfo = gl.getActiveUniform(this.__program!, i)!;
        uniformName = uniformInfo.name.replace('[0]', '');
        this.__uniform![uniformName] = gl.getUniformLocation(this.__program!, uniformName)!;
      }
    }
  }

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
  public blit(
    source_texture: WebGLTexture,
    source_rect_uv_x: number,
    source_rect_uv_y: number,
    source_rect_uv_width: number,
    source_rect_uv_height: number,
    dest_surface_width: number,
    dest_surface_height: number
  ) {
    const gl = this.__gl;
    const program = this.__program!;

    gl.activeTexture(gl.TEXTURE15);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, source_texture);

    gl.useProgram(program);

    const depthTestEnabled = gl.getParameter(gl.DEPTH_TEST);
    const depthMask = gl.getParameter(gl.DEPTH_WRITEMASK);

    gl.disable(gl.SCISSOR_TEST);
    if (depthTestEnabled) {
      gl.disable(gl.DEPTH_TEST);
    }
    gl.disable(gl.STENCIL_TEST);
    gl.colorMask(true, true, true, true);
    if (depthMask) {
      gl.depthMask(false);
    }
    const viewport = gl.getParameter(gl.VIEWPORT);
    gl.viewport(0, 0, dest_surface_width, dest_surface_height);

    gl.uniform2f(this.__uniform!.u_scale, source_rect_uv_width, source_rect_uv_height);
    gl.uniform2f(this.__uniform!.u_offset, source_rect_uv_x, source_rect_uv_y);
    gl.uniform1i(this.__uniform!.u_source_texture, 15);

    // gl.bindVertexArray(this.__vao);
    gl.drawArrays(gl.TRIANGLES, 0, 12);

    // gl.useProgram((gl as any).__lastUseProgram);
    (gl as any).__changedProgram = true;

    gl.viewport(viewport[0], viewport[1], viewport[2], viewport[3]);

    if (depthTestEnabled) {
      gl.enable(gl.DEPTH_TEST);
    }
    gl.depthMask(depthMask);

    gl.flush();
  }

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
  public blitFake(
    source_texture: WebGLTexture,
    source_rect_uv_x: number,
    source_rect_uv_y: number,
    source_rect_uv_width: number,
    source_rect_uv_height: number,
    dest_surface_width: number,
    dest_surface_height: number
  ) {
    const gl = this.__gl;
    const program = this.__program!;

    gl.activeTexture(gl.TEXTURE15);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, source_texture);

    gl.useProgram(program);

    // const depthTestEnabled = gl.getParameter(gl.DEPTH_TEST);
    // const depthMask = gl.getParameter(gl.DEPTH_WRITEMASK);

    // gl.disable(gl.SCISSOR_TEST);
    // if (depthTestEnabled) {
    //   gl.disable(gl.DEPTH_TEST);
    // }
    // gl.disable(gl.STENCIL_TEST);
    // gl.colorMask(true, true, true, true);
    // if (depthMask) {
    //   gl.depthMask(false);
    // }
    const viewport = gl.getParameter(gl.VIEWPORT);
    gl.viewport(0, 0, dest_surface_width, dest_surface_height);

    gl.uniform2f(this.__uniform!.u_scale, source_rect_uv_width, source_rect_uv_height);
    gl.uniform2f(this.__uniform!.u_offset, source_rect_uv_x, source_rect_uv_y);
    gl.uniform1i(this.__uniform!.u_source_texture, 15);
    gl.drawArrays(gl.TRIANGLES, 0, 12);

    // gl.useProgram((gl as any).__lastUseProgram);
    (gl as any).__changedProgram = true;

    gl.viewport(viewport[0], viewport[1], viewport[2], viewport[3]);

    // if (depthTestEnabled) {
    //   gl.enable(gl.DEPTH_TEST);
    // }
    // gl.depthMask(depthMask);
  }

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
  blit2(srcTexture: WebGLTexture, dstTexture: WebGLTexture, width: number, height: number) {
    const gl = this.__gl;

    const readFramebuffer = gl.createFramebuffer();
    const drawFramebuffer = gl.createFramebuffer();
    // ブリットの関数
    function blitTextureArrayLayer(layer: number, xOffset: number) {
      // gl.bindFramebuffer(gl.FRAMEBUFFER, readFramebuffer);
      // gl.framebufferTextureLayer(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, srcTexture, 0, layer);

      // gl.bindFramebuffer(gl.FRAMEBUFFER, drawFramebuffer);
      // gl.framebufferTexture2D(
      //   gl.DRAW_FRAMEBUFFER,
      //   gl.COLOR_ATTACHMENT0,
      //   gl.TEXTURE_2D,
      //   dstTexture,
      //   0
      // );
      // // ブリット
      // gl.blitFramebuffer(
      //   0,
      //   0,
      //   width,
      //   height, // ソースの範囲
      //   xOffset,
      //   0,
      //   xOffset + width,
      //   height, // コピー先の範囲
      //   gl.COLOR_BUFFER_BIT,
      //   gl.NEAREST
      // );

      // レイヤーごとに個別のテクスチャを作成
      const tempTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tempTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, readFramebuffer);
      gl.framebufferTextureLayer(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, srcTexture, 0, layer);

      // 一時的なテクスチャにレイヤーをコピー
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, drawFramebuffer);
      gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tempTexture, 0);
      gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);

      // 一時的なテクスチャから最終テクスチャにコピー
      gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tempTexture, 0);
      gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, dstTexture, 0);
      gl.blitFramebuffer(0, 0, width, height, xOffset, 0, xOffset + width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    }

    // 0番目のレイヤーを左側にコピー
    blitTextureArrayLayer(0, 0);
    // 1番目のレイヤーを右側にコピー
    blitTextureArrayLayer(1, width);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
}
