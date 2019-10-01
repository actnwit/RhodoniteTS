import { CompositionTypeEnum } from "../../foundation/main";
import GLSLShader from "./GLSLShader";
import { ShaderNode } from "../../foundation/definitions/ShaderNode";
import { VertexAttributeEnum, VertexAttribute } from "../../foundation/definitions/VertexAttribute";
import { WellKnownComponentTIDs } from "../../foundation/components/WellKnownComponentTIDs";

export type AttributeNames = Array<string>;

export default class SkeletalShader extends GLSLShader {
  static __instance: SkeletalShader;
  public static readonly materialElement = ShaderNode.PBRShading;
  private constructor() {
    super();
  }

  static getInstance(): SkeletalShader {
    if (!this.__instance) {
      this.__instance = new SkeletalShader();
    }
    return this.__instance;
  }

  get vertexShaderDefinitions() {
    const _version = this.glsl_versionText;
    const _in = this.glsl_vertex_in;
    const _out = this.glsl_vertex_out;

    return `
uniform mat4 u_boneMatrices[100];
uniform int u_skinningMode;

mat4 getSkinMatrix() {
  mat4 skinMat = a_weight.x * u_boneMatrices[int(a_joint.x)];
  skinMat += a_weight.y * u_boneMatrices[int(a_joint.y)];
  skinMat += a_weight.z * u_boneMatrices[int(a_joint.z)];
  skinMat += a_weight.w * u_boneMatrices[int(a_joint.w)];

  return skinMat;
}

  bool skinning(
    out bool isSkinning,
    in mat3 inNormalMatrx,
    out mat3 outNormalMatrix
    )
  {
    float cameraSID = u_currentComponentSIDs[${WellKnownComponentTIDs.CameraComponentTID}];
    mat4 worldMatrix = get_worldMatrix(a_instanceID);
    mat4 viewMatrix = get_viewMatrix(cameraSID);
    mat4 projectionMatrix = get_projectionMatrix(cameraSID);

    // Skeletal
    isSkinning = false;
    if (u_skinningMode == 1) {
      mat4 skinMat = getSkinMatrix();
      v_position_inWorld = skinMat * vec4(a_position, 1.0);
      outNormalMatrix = toNormalMatrix(skinMat);
      v_normal_inWorld = normalize(normalMatrix * a_normal);
      gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;
      isSkinning = true;
    } else {
      v_position_inWorld = worldMatrix * vec4(a_position, 1.0);
      gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;
      outNormalMatrix = inNormalMatrix;
      v_normal_inWorld = normalize(inNormalMatrix * a_normal);
    }

    return isSkinning;
  }
}

`;

  };


  get pixelShaderDefinitions() {
    return '';
  }

  vertexShaderBody: string = `


  `;

  get pixelShaderBody() {
    return '';
  }

  get attributeNames(): AttributeNames {
    return ['a_position', 'a_normal', 'a_joint', 'a_weight', 'a_instanceID'];
  }
  get attributeSemantics(): Array<VertexAttributeEnum> {
    return [VertexAttribute.Position,
    VertexAttribute.Normal, VertexAttribute.Joints0, VertexAttribute.Weights0, VertexAttribute.Instance];
  }

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [];
  }
}
