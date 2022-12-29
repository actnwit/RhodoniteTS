// This is from https://developer.oculus.com/documentation/web/web-multiview/

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

export class WebGLStereoUtil {
  private __gl: WebGL2RenderingContext;
  private __vao: WebGLVertexArrayObject;
  private __vertexShader?: WebGLShader;
  private __fragmentShader?: WebGLShader;
  private __program?: WebGLProgram;
  private __attrib?: Record<string, number>;
  private __uniform?: Record<string, WebGLUniformLocation>;

  constructor(gl: WebGL2RenderingContext) {
    this.__gl = gl;
    this.__vao = gl.createVertexArray()!;
    this.__program = gl.createProgram()!;
    this.__attachShaderSource(VSMultiview, gl.VERTEX_SHADER);
    this.__attachShaderSource(FSMultiview, gl.FRAGMENT_SHADER);
    this.__bindAttribLocation({
      v_texcoord: 0,
    });
    this.__getUniformLocations();
    this.__gl.linkProgram(this.__program);
  }

  private __attachShaderSource(source: string, type: number) {
    const gl = this.__gl;
    let shader;

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
        console.error('Invalid Shader Type:', type);
        return;
    }

    gl.attachShader(this.__program!, shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
  }

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

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, source_texture);

    gl.useProgram(program);

    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.colorMask(true, true, true, true);
    gl.depthMask(false);

    gl.viewport(0, 0, dest_surface_width, dest_surface_height);

    gl.uniform2f(this.__uniform!['u_scale'], source_rect_uv_width, source_rect_uv_height);
    gl.uniform2f(this.__uniform!['u_offset'], source_rect_uv_x, source_rect_uv_y);
    gl.uniform1i(this.__uniform!['u_source_texture'], 0);

    gl.bindVertexArray(this.__vao);
    gl.drawArrays(gl.TRIANGLES, 0, 12);

    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
  }
}
