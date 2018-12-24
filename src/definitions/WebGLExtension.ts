import { EnumClass, EnumIO, _from } from "../misc/EnumIO";

export interface WebGLExtensionEnum extends EnumIO {
}

class WebGLExtensionClass extends EnumClass implements WebGLExtensionEnum {
  constructor({index, str} : {index: number, str: string}) {
    super({index, str});
  }
}

const VertexArrayObject: WebGLExtensionEnum = new WebGLExtensionClass({index:1, str:'OES_vertex_array_object'});
const TextureFloat: WebGLExtensionEnum = new WebGLExtensionClass({index:2, str:'OES_texture_float'});
const TextureHalfFloat: WebGLExtensionEnum = new WebGLExtensionClass({index:3, str:'OES_texture_half_float'});
const TextureFloatLinear: WebGLExtensionEnum = new WebGLExtensionClass({index:4, str:'OES_texture_float_linear'});
const TextureHalfFloatLinear: WebGLExtensionEnum = new WebGLExtensionClass({index:5, str:'OES_texture_half_float_linear'});


const typeList = [ VertexArrayObject, TextureFloat, TextureHalfFloat, TextureFloatLinear, TextureHalfFloatLinear ];

function from({ index }: { index: number }): WebGLExtensionEnum {
  return _from({typeList, index}) as WebGLExtensionEnum;
}

export const WebGLExtension = Object.freeze({ VertexArrayObject, TextureFloat, TextureHalfFloat, TextureFloatLinear, TextureHalfFloatLinear });
