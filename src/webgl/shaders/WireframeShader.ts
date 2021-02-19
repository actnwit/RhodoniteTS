import {
  VertexAttributeEnum,
  VertexAttribute,
} from '../../foundation/definitions/VertexAttribute';
import GLSLShader from './GLSLShader';
import {ShaderNode} from '../../foundation/definitions/ShaderNode';
import {CompositionTypeEnum} from '../../foundation/definitions/CompositionType';

export type AttributeNames = Array<string>;

export default class WireframeShader extends GLSLShader {
  static __instance: WireframeShader;
  public static readonly materialElement = ShaderNode.PBRShading;
  private constructor() {
    super();
  }

  static getInstance(): WireframeShader {
    if (!this.__instance) {
      this.__instance = new WireframeShader();
    }
    return this.__instance;
  }

  get vertexShaderDefinitions() {
    return `

`;
  }

  get pixelShaderDefinitions() {
    return '';
  }

  vertexShaderBody = `


  `;

  get pixelShaderBody() {
    const _version = this.glsl_versionText;
    const _in = this.glsl_vertex_in;
    const _out = this.glsl_vertex_out;

    return `
uniform vec3 u_wireframe;

bool wireframe(
  in vec4 existingFragColor,
  in vec4 wireframeColor,
  out vec4 outColor
  )
{

  // Wireframe
  float threshold = 0.001;
  float wireframeWidthInner = u_wireframe.z;
  float wireframeWidthRelativeScale = 1.0;
  if (u_wireframe.x > 0.5 && u_wireframe.y < 0.5) {
    outColor.a = 0.0;
  }
  vec4 wireframeResult = existingFragColor;
  float edgeRatio = edge_ratio(v_baryCentricCoord, wireframeWidthInner, wireframeWidthRelativeScale);
  float edgeRatioModified = mix(step(threshold, edgeRatio), clamp(edgeRatio*4.0, 0.0, 1.0), wireframeWidthInner / wireframeWidthRelativeScale/4.0);
  // if r0.a is 0.0, it is wireframe not on shaded
  wireframeResult.rgb = wireframeColor.rgb * edgeRatioModified + existingFragColor.rgb * (1.0 - edgeRatioModified);
  wireframeResult.a = max(existingFragColor.a, wireframeColor.a * mix(edgeRatioModified, pow(edgeRatioModified, 100.0), wireframeWidthInner / wireframeWidthRelativeScale/1.0));

  if (u_wireframe.x > 0.5) {
    outColor = wireframeResult;
    if (u_wireframe.y < 0.5 && existingFragColor.a == 0.0) {
      discard;
    }
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
