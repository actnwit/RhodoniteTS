import { EnumClass, EnumIO, _from } from '../foundation/misc/EnumIO';

export type WebGLExtensionEnum = EnumIO;

class WebGLExtensionClass extends EnumClass implements WebGLExtensionEnum {
  constructor({ index, str }: { index: number; str: string }) {
    super({ index, str });
  }
}

const VertexArrayObject: WebGLExtensionEnum = new WebGLExtensionClass({
  index: 1,
  str: 'OES_vertex_array_object',
});
const TextureFloat: WebGLExtensionEnum = new WebGLExtensionClass({
  index: 2,
  str: 'OES_texture_float',
});
const TextureHalfFloat: WebGLExtensionEnum = new WebGLExtensionClass({
  index: 3,
  str: 'OES_texture_half_float',
});
const TextureFloatLinear: WebGLExtensionEnum = new WebGLExtensionClass({
  index: 4,
  str: 'OES_texture_float_linear',
});
const TextureHalfFloatLinear: WebGLExtensionEnum = new WebGLExtensionClass({
  index: 5,
  str: 'OES_texture_half_float_linear',
});
const InstancedArrays: WebGLExtensionEnum = new WebGLExtensionClass({
  index: 6,
  str: 'ANGLE_instanced_arrays',
});
const TextureFilterAnisotropic: WebGLExtensionEnum = new WebGLExtensionClass({
  index: 7,
  str: 'EXT_texture_filter_anisotropic',
});
const ElementIndexUint: WebGLExtensionEnum = new WebGLExtensionClass({
  index: 8,
  str: 'OES_element_index_uint',
});
const ShaderTextureLod: WebGLExtensionEnum = new WebGLExtensionClass({
  index: 9,
  str: 'EXT_shader_texture_lod',
});
const ShaderDerivatives: WebGLExtensionEnum = new WebGLExtensionClass({
  index: 10,
  str: 'OES_standard_derivatives',
});
const DrawBuffers: WebGLExtensionEnum = new WebGLExtensionClass({
  index: 11,
  str: 'WEBGL_draw_buffers',
});
const BlendMinmax: WebGLExtensionEnum = new WebGLExtensionClass({
  index: 12,
  str: 'EXT_blend_minmax',
});
const ColorBufferFloatWebGL1: WebGLExtensionEnum = new WebGLExtensionClass({
  index: 13,
  str: 'WEBGL_color_buffer_float',
});
const CompressedTextureAstc: WebGLExtensionEnum = new WebGLExtensionClass({
  index: 14,
  str: 'WEBGL_compressed_texture_astc',
});
const CompressedTextureS3tc: WebGLExtensionEnum = new WebGLExtensionClass({
  index: 15,
  str: 'WEBGL_compressed_texture_s3tc',
});
const CompressedTexturePvrtc: WebGLExtensionEnum = new WebGLExtensionClass({
  index: 16,
  str: 'WEBGL_compressed_texture_pvrtc',
});
const CompressedTextureAtc: WebGLExtensionEnum = new WebGLExtensionClass({
  index: 17,
  str: 'WEBGL_compressed_texture_atc',
});
const CompressedTextureEtc: WebGLExtensionEnum = new WebGLExtensionClass({
  index: 18,
  str: 'WEBGL_compressed_texture_etc',
});
const CompressedTextureEtc1: WebGLExtensionEnum = new WebGLExtensionClass({
  index: 19,
  str: 'WEBGL_compressed_texture_etc1',
});
const CompressedTextureBptc: WebGLExtensionEnum = new WebGLExtensionClass({
  index: 20,
  str: 'EXT_texture_compression_bptc',
});
const GMAN_WEBGL_MEMORY: WebGLExtensionEnum = new WebGLExtensionClass({
  index: 21,
  str: 'GMAN_webgl_memory',
});
const ColorBufferFloatWebGL2: WebGLExtensionEnum = new WebGLExtensionClass({
  index: 22,
  str: 'EXT_color_buffer_float',
});
const ColorBufferHalfFloatWebGL2: WebGLExtensionEnum = new WebGLExtensionClass({
  index: 23,
  str: 'EXT_color_buffer_half_float',
});

const typeList = [
  VertexArrayObject,
  TextureFloat,
  TextureHalfFloat,
  TextureFloatLinear,
  TextureHalfFloatLinear,
  InstancedArrays,
  TextureFilterAnisotropic,
  ElementIndexUint,
  ShaderTextureLod,
  ShaderDerivatives,
  DrawBuffers,
  BlendMinmax,
  ColorBufferFloatWebGL1,
  CompressedTextureAstc,
  CompressedTextureS3tc,
  CompressedTexturePvrtc,
  CompressedTextureAtc,
  CompressedTextureEtc,
  CompressedTextureEtc1,
  CompressedTextureBptc,
  ColorBufferFloatWebGL2,
  ColorBufferHalfFloatWebGL2,
];

function from({ index }: { index: number }): WebGLExtensionEnum {
  return _from({ typeList, index }) as WebGLExtensionEnum;
}

export const WebGLExtension = Object.freeze({
  VertexArrayObject,
  TextureFloat,
  TextureHalfFloat,
  TextureFloatLinear,
  TextureHalfFloatLinear,
  InstancedArrays,
  TextureFilterAnisotropic,
  ElementIndexUint,
  ShaderTextureLod,
  ShaderDerivatives,
  DrawBuffers,
  BlendMinmax,
  ColorBufferFloatWebGL1,
  CompressedTextureAstc,
  CompressedTextureS3tc,
  CompressedTexturePvrtc,
  CompressedTextureAtc,
  CompressedTextureEtc,
  CompressedTextureEtc1,
  CompressedTextureBptc,
  ColorBufferFloatWebGL2,
  ColorBufferHalfFloatWebGL2,
  GMAN_WEBGL_MEMORY,
});
