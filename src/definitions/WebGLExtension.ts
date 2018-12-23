import { EnumClass, EnumIO, _from } from "../misc/EnumIO";

export interface WebGLExtensionEnum extends EnumIO {
}

class WebGLExtensionClass extends EnumClass implements WebGLExtensionEnum {
  constructor({index, str} : {index: number, str: string}) {
    super({index, str});
  }
}

const VertexArrayObject: WebGLExtensionEnum = new WebGLExtensionClass({index:0, str:'OES_vertex_array_object'});

const typeList = [VertexArrayObject];

function from({ index }: { index: number }): WebGLExtensionEnum {
  return _from({typeList, index}) as WebGLExtensionEnum;
}

export const WebGLExtension = Object.freeze({ VertexArrayObject });
