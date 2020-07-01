import { VertexAttributeEnum, VertexAttribute } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import { ShaderNode } from "../../foundation/definitions/ShaderNode";
import { CompositionTypeEnum, CompositionType } from "../../foundation/definitions/CompositionType";
import ISingleShader from "./ISingleShader";
import { WellKnownComponentTIDs } from "../../foundation/components/WellKnownComponentTIDs";

export type AttributeNames = Array<string>;

export default class DepthEncodeShader extends GLSLShader implements ISingleShader {
  static __instance: DepthEncodeShader;
  public static readonly materialElement = ShaderNode.ClassicShading;

  private constructor() {
    super();
  }

  static getInstance(): DepthEncodeShader {
    if (!this.__instance) {
      this.__instance = new DepthEncodeShader();
    }
    return this.__instance;
  }

  getVertexShaderBody(args: any) {
    const _version = this.glsl_versionText;
    const _in = this.glsl_vertex_in;
    const _out = this.glsl_vertex_out;

    return `${_version}
${this.glslPrecision}

${(typeof args.definitions !== 'undefined') ? args.definitions : ''}

${_in} vec3 a_position;
${_in} vec3 a_normal;
${_in} float a_instanceID;
${_in} vec4 a_joint;
${_in} vec4 a_weight;

${_out} vec3 v_normal_inWorld;
${_out} vec4 v_position_inLocal;
${_out} vec4 v_position_inWorld;

${this.prerequisites}

${(typeof args.matricesGetters !== 'undefined') ? args.matricesGetters : ''}

${(typeof args.getters !== 'undefined') ? args.getters : ''}

${this.toNormalMatrix}

${this.getSkinMatrix}

${this.processGeometryWithSkinningOptionally}

  void main(){

    ${this.mainPrerequisites}
    float cameraSID = u_currentComponentSIDs[${WellKnownComponentTIDs.CameraComponentTID}];
    mat4 worldMatrix = get_worldMatrix(a_instanceID);
    mat4 viewMatrix = get_viewMatrix(cameraSID, 0);
    mat4 projectionMatrix = get_projectionMatrix(cameraSID, 0);
    mat3 normalMatrix = get_normalMatrix(a_instanceID);

    // Skeletal
    processGeometryWithMorphingAndSkinning(
      skeletalComponentSID,
      worldMatrix,
      normalMatrix,
      normalMatrix,
      a_position,
      v_position_inWorld,
      a_normal,
      v_normal_inWorld
    );

    gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;

    v_position_inLocal = gl_Position;

    ${this.pointSprite}

  }
    `;

  }


  getPixelShaderBody(args: any) {
    const _version = this.glsl_versionText;
    const _in = this.glsl_fragment_in;
    const _def_rt0 = this.glsl_rt0;
    const _def_fragColor = this.glsl_fragColor;

    return `${_version}
${this.glslPrecision}

${(typeof args.definitions !== 'undefined') ? args.definitions : ''}

${this.prerequisites}

${_in} vec4 v_position_inLocal;
${_def_rt0}

${(typeof args.getters !== 'undefined') ? args.getters : ''}

vec4 encodeDepthToRGBA(float depth){
  float r = depth;
  float g = fract(r * 255.0);
  float b = fract(g * 255.0);
  float a = fract(b * 255.0);
  float coef = 1.0 / 255.0;
  r -= g * coef;
  g -= b * coef;
  b -= a * coef;
  return vec4(r, g, b, a);
}

void main (){
  ${this.mainPrerequisites}

  float zNear = get_zNearInner(materialSID, 0);
  float zFar = get_zFarInner(materialSID, 0);
  float normalizationCoefficient = 1.0 / (zFar - zNear);
  float linerDepth = normalizationCoefficient * length(v_position_inLocal);
  vec4 encodedLinearDepth = encodeDepthToRGBA(linerDepth);

  rt0 = encodedLinearDepth;

  ${_def_fragColor}
}
`;
  }

  attributeNames: AttributeNames = [
    'a_instanceID',
    'a_position', 'a_normal',
    'a_joint', 'a_weight',
  ];
  attributeSemantics: Array<VertexAttributeEnum> = [
    VertexAttribute.Instance,
    VertexAttribute.Position, VertexAttribute.Normal,
    VertexAttribute.Joints0, VertexAttribute.Weights0,
  ];

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [
      CompositionType.Scalar,
      CompositionType.Vec3, CompositionType.Vec3,
      CompositionType.Vec4, CompositionType.Vec4,
    ];
  }
}
