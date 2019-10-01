import { VertexAttributeEnum, VertexAttribute } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import Config from "../../foundation/core/Config";
import { ShaderNode } from "../../foundation/definitions/ShaderNode";
import { CompositionTypeEnum } from "../../foundation/main";
import { CompositionType } from "../../foundation/definitions/CompositionType";
import ISingleShader from "./ISingleShader";
import { WellKnownComponentTIDs } from "../../foundation/components/WellKnownComponentTIDs";

export type AttributeNames = Array<string>;

export default class ClassicShader extends GLSLShader implements ISingleShader {
  static __instance: ClassicShader;
  public static readonly materialElement = ShaderNode.ClassicShading;

  private constructor() {
    super();
  }

  static getInstance(): ClassicShader {
    if (!this.__instance) {
      this.__instance = new ClassicShader();
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
${_in} vec3 a_color;
${_in} vec3 a_normal;
${_in} float a_instanceID;
${_in} vec2 a_texcoord;
${_in} vec4 a_joint;
${_in} vec4 a_weight;
${_in} vec4 a_baryCentricCoord;
${_out} vec3 v_color;
${_out} vec3 v_normal_inWorld;
${_out} vec4 v_position_inWorld;
${_out} vec2 v_texcoord;
${_out} vec3 v_baryCentricCoord;

${this.prerequisites}

${(typeof args.matricesGetters !== 'undefined') ? args.matricesGetters : ''}

${(typeof args.getters !== 'undefined') ? args.getters : ''}

${this.toNormalMatrix}

${this.getSkinMatrix}

${this.processGeometryWithSkinningOptionally}

void main()
{

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


  v_color = a_color;
  v_normal_inWorld = normalMatrix * a_normal;
  v_texcoord = a_texcoord;
  v_baryCentricCoord = a_baryCentricCoord.xyz;

  ${this.pointSprite}

//  v_color = vec3(u_boneMatrices[int(a_joint.x)][1].xyz);

}
    `;
  }

  getPixelShaderBody(args: any) {
    const _version = this.glsl_versionText;
    const _in = this.glsl_fragment_in;
    const _def_rt0 = this.glsl_rt0;
    const _def_fragColor = this.glsl_fragColor;
    const _texture = this.glsl_texture;

    return `${_version}
${this.glslPrecision}

${(typeof args.definitions !== 'undefined') ? args.definitions : ''}

${this.prerequisites}

${_in} vec3 v_color;
${_in} vec3 v_normal_inWorld;
${_in} vec4 v_position_inWorld;
${_in} vec2 v_texcoord;
${_in} vec3 v_baryCentricCoord;
${_def_rt0}

${(typeof args.getters !== 'undefined') ? args.getters : ''}

void main ()
{
  ${this.mainPrerequisites}

  // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);

  vec4 diffuseColorFactor = get_diffuseColorFactor(materialSID, 0);


  // diffuseColor
  vec3 diffuseColor = vec3(0.0, 0.0, 0.0);
  float alpha = 1.0;
  if (v_color != diffuseColor && diffuseColorFactor.rgb != diffuseColor) {
    diffuseColor = v_color * diffuseColorFactor.rgb;
    alpha = diffuseColorFactor.a;
  } else if (v_color == diffuseColor) {
    diffuseColor = diffuseColorFactor.rgb;
    alpha = diffuseColorFactor.a;
  } else if (diffuseColorFactor.rgb == diffuseColor) {
    diffuseColor = v_color;
  } else {
    diffuseColor = vec3(1.0, 1.0, 1.0);
  }

  // diffuseColorTexture
  vec4 textureColor = ${_texture}(u_diffuseColorTexture, v_texcoord);
  if (textureColor.r > 0.05) {
    diffuseColor *= textureColor.rgb;
  }

  // Lighting
  vec3 shadingColor = vec3(0.0, 0.0, 0.0);
#ifdef RN_IS_LIGHTING
  int shadingModel = get_shadingModel(materialSID, 0);
  if (shadingModel > 0) {

    vec3 diffuse = vec3(0.0, 0.0, 0.0);
    vec3 specular = vec3(0.0, 0.0, 0.0);
    for (int i = 0; i < ${Config.maxLightNumberInShader}; i++) {
      if (i >= lightNumber) {
        break;
      }

      vec4 gotLightDirection = get_lightDirection(0.0, i);
      vec4 gotLightPosition = get_lightPosition(0.0, i);
      vec4 gotLightIntensity = get_lightIntensity(0.0, i);
      vec3 lightDirection = gotLightDirection.xyz;
      vec3 lightIntensity = gotLightIntensity.xyz;
      vec3 lightPosition = gotLightPosition.xyz;
      float lightType = gotLightPosition.w;
      float spotCosCutoff = gotLightDirection.w;
      float spotExponent = gotLightIntensity.w;

      if (0.75 < lightType) { // is pointlight or spotlight
        lightDirection = normalize(lightPosition - v_position_inWorld.xyz);
      }
      float spotEffect = 1.0;
      if (lightType > 1.75) { // is spotlight
        spotEffect = dot(gotLightDirection.xyz, lightDirection);
        if (spotEffect > spotCosCutoff) {
          spotEffect = pow(spotEffect, spotExponent);
        } else {
          spotEffect = 0.0;
        }
      }

      vec3 incidentLight = spotEffect * lightIntensity;



      diffuse += diffuseColor * max(0.0, dot(normal_inWorld, lightDirection)) * incidentLight;

      float shininess = get_shininess(materialSID, 0);
      int shadingModel = get_shadingModel(materialSID, 0);

      float cameraSID = u_currentComponentSIDs[${WellKnownComponentTIDs.CameraComponentTID}];
      vec3 viewPosition = get_viewPosition(cameraSID, 0);

      if (shadingModel == 2) {// BLINN
        // ViewDirection
        vec3 viewDirection = normalize(viewPosition - v_position_inWorld.xyz);
        vec3 halfVector = normalize(lightDirection + viewDirection);
        specular += pow(max(0.0, dot(halfVector, normal_inWorld)), shininess);
      } else if (shadingModel == 3) { // PHONG
        vec3 viewDirection = normalize(viewPosition - v_position_inWorld.xyz);
        vec3 R = reflect(lightDirection, normal_inWorld);
        specular += pow(max(0.0, dot(R, viewDirection)), shininess);
      }

    }

    shadingColor = diffuse + specular;
  } else {
    shadingColor = diffuseColor;
  }
#else
  shadingColor = diffuseColor;
#endif

  rt0 = vec4(shadingColor * alpha, alpha);
  // rt0 = vec4(u_lightNumber, 0.0, 0.0, 1.0);
  // rt0 = vec4(1.0, 0.0, 0.0, 1.0);
  // rt0 = vec4(normal_inWorld*0.5+0.5, 1.0);


  ${_def_fragColor}
}
`;
  }

  attributeNames: AttributeNames = [
    'a_position', 'a_color', 'a_normal',
    'a_texcoord',
    'a_joint', 'a_weight', 'a_baryCentricCoord',
    'a_instanceID'
  ];
  attributeSemantics: Array<VertexAttributeEnum> = [
    VertexAttribute.Position, VertexAttribute.Color0, VertexAttribute.Normal,
    VertexAttribute.Texcoord0,
    VertexAttribute.Joints0, VertexAttribute.Weights0, VertexAttribute.BaryCentricCoord,
    VertexAttribute.Instance
  ];
  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [
      CompositionType.Vec3, CompositionType.Vec3, CompositionType.Vec3,
      CompositionType.Vec2,
      CompositionType.Vec4, CompositionType.Vec4, CompositionType.Vec4,
      CompositionType.Scalar
    ];
  }
}
