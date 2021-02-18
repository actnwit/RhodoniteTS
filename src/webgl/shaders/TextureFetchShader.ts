import { VertexAttributeEnum, VertexAttribute } from '../../foundation/definitions/VertexAttribute';
import GLSLShader from './GLSLShader';
import Config from '../../foundation/core/Config';
import { ShaderNode } from '../../foundation/definitions/ShaderNode';
import { CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import { MaterialNodeUID } from '../../commontypes/CommonTypes';

export type AttributeNames = Array<string>;

export default class TextureFetchShader extends GLSLShader {
  static __instance: TextureFetchShader;
  private __materialNodeUid: MaterialNodeUID = 0;
  constructor() {
    super();
  }

  set materialNodeUid(materialNodeUid: MaterialNodeUID) {
    this.__materialNodeUid = materialNodeUid;
  }

  get vertexShaderDefinitions() {

    return `

`;

  };


  get pixelShaderDefinitions() {
    return '';
  }

  vertexShaderBody:string = `


  `;

  get pixelShaderBody() {
    const _version = this.glsl_versionText;
    const _in = this.glsl_vertex_in;
    const _out = this.glsl_vertex_out;
    const _texture = this.glsl_texture;
    return `
uniform sampler2D u_generalTexture_${this.__materialNodeUid};
uniform bool u_isGeneralTextureExist_${this.__materialNodeUid};

bool textureFetch(
  in vec2 texcoord,
  out vec4 outColor
  )
{
  outColor = vec4(0.0, 0.0, 0.0, 1.0);
  // diffuseColorTexture
  if (u_isGeneralTextureExist_${this.__materialNodeUid}) {
    vec4 textureColor = ${_texture}(u_generalTexture_${this.__materialNodeUid}, texcoord);
    outColor = textureColor;
  }
}
    `;
  }

  get attributeNames(): AttributeNames {
    return [];
  }
  get attributeSemantics(): Array<VertexAttributeEnum> {
    return [];
  }

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [];
  }
}
