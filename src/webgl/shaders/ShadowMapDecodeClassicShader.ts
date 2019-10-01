import { VertexAttributeEnum, VertexAttribute } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import Config from "../../foundation/core/Config";
import { ShaderNode } from "../../foundation/definitions/ShaderNode";
import { CompositionTypeEnum } from "../../foundation/main";
import { CompositionType } from "../../foundation/definitions/CompositionType";
import ComponentRepository from '../../foundation/core/ComponentRepository';
import CameraComponent from '../../foundation/components/CameraComponent';
import ISingleShader from "./ISingleShader";
import { WellKnownComponentTIDs } from "../../foundation/components/WellKnownComponentTIDs";

export type AttributeNames = Array<string>;

export default class ShadowMapDecodeClassicShader extends GLSLShader implements ISingleShader {
  static __instance: ShadowMapDecodeClassicShader;
  public static readonly materialElement = ShaderNode.ClassicShading;

  private constructor() {
    super();
  }

  static getInstance(): ShadowMapDecodeClassicShader {
    if (!this.__instance) {
      this.__instance = new ShadowMapDecodeClassicShader();
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
${_in} vec2 a_texcoord_0;
${_in} vec2 a_texcoord_1;
${_in} vec4 a_joint;
${_in} vec4 a_weight;
${_out} vec3 v_color;
${_out} vec3 v_normal_inWorld;
${_out} vec4 v_position_inWorld;
${_out} vec2 v_texcoord_0;
${_out} vec4 v_texcoord_1;
${_out} vec4 v_projPosition_from_light;

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

  ${this.pointSprite}

  // Shadow mapping
  mat4 lightViewProjectionMatrix = get_lightViewProjectionMatrix(materialSID, 0);
  v_projPosition_from_light = lightViewProjectionMatrix * v_position_inWorld;

  // Following tMatrix is based on https://wgld.org/d/webgl/w051.html
  mat4 tMatrix = mat4(
    0.5, 0.0, 0.0, 0.0,
    0.0, 0.5, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.5, 0.5, 0.0, 1.0
  );
  v_texcoord_1 = tMatrix * v_projPosition_from_light;

  v_color = a_color;
  v_normal_inWorld = normalMatrix * a_normal;
  v_texcoord_0 = a_texcoord_0;

}
`
  }


  getFragmentShader(args: any) {
    const _version = this.glsl_versionText;
    const _in = this.glsl_fragment_in;
    const _def_rt0 = this.glsl_rt0;
    const _def_fragColor = this.glsl_fragColor;
    const _texture = this.glsl_texture;
    const _textureProj = this.glsl_textureProj;

    const mainCameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;

    let zNear: number | string = mainCameraComponent.zNearInner;
    let zFar: number | string = mainCameraComponent.zFarInner;
    let ZNearToFar: number | string = zFar - zNear;

    if (Number.isInteger(ZNearToFar)) {
      ZNearToFar = ZNearToFar + '.0';
    }
    return `${_version}
${this.glslPrecision}

${(typeof args.definitions !== 'undefined') ? args.definitions : ''}

${this.prerequisites}

${_in} vec3 v_color;
${_in} vec3 v_normal_inWorld;
${_in} vec4 v_position_inWorld;
${_in} vec2 v_texcoord_0;
${_in} vec4 v_texcoord_1;
${_in} vec4 v_projPosition_from_light;
${_def_rt0}

${(typeof args.getters !== 'undefined') ? args.getters : ''}

float decodeRGBAToDepth(vec4 RGBA){
  const float rMask = 1.0;
  const float gMask = 1.0 / 255.0;
  const float bMask = 1.0 / (255.0 * 255.0);
  const float aMask = 1.0 / (255.0 * 255.0 * 255.0);
  float depth = dot(RGBA, vec4(rMask, gMask, bMask, aMask));
  return depth;
}

void main (){
  ${this.mainPrerequisites}

  // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);

  // diffuseColor
  vec3 diffuseColor = vec3(0.0, 0.0, 0.0);
  float alpha = 1.0;

  vec4 diffuseColorFactor = get_diffuseColorFactor(materialSID, 0);
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
  vec4 textureColor = ${_texture}(u_diffuseColorTexture, v_texcoord_0);
  if (textureColor.r > 0.05) {
    diffuseColor *= textureColor.rgb;
    alpha *= textureColor.a;
  }

  // shadow mapping
  float nonShadowAlpha = get_nonShadowAlpha(materialSID, 0);
  if(v_projPosition_from_light.w > 0.0){
    float normalizationCoefficient = 1.0 / ${ZNearToFar};
    float measureDepth = normalizationCoefficient * length(v_projPosition_from_light);
    float textureDepth = decodeRGBAToDepth(${_textureProj}(u_depthTexture, v_texcoord_1));
    float allowableDepthError = get_allowableDepthError(materialSID, 0);
    if(measureDepth > textureDepth + allowableDepthError){
      vec3 shadowColor = get_shadowColor(materialSID, 0);
      diffuseColor *= shadowColor;

      float shadowAlpha = get_shadowAlpha(materialSID, 0);
      alpha *= shadowAlpha;
    }else{
      alpha *= nonShadowAlpha;
    }
  }else{
    alpha *= nonShadowAlpha;
  }

  // Lighting
  vec3 shadingColor = vec3(0.0, 0.0, 0.0);
  int shadingModel = get_shadingModel(materialSID, 0);
  if (shadingModel > 0) {

    vec3 diffuse = vec3(0.0, 0.0, 0.0);
    vec3 specular = vec3(0.0, 0.0, 0.0);
    int lightNumber = get_lightNumber(materialSID, 0);
    for (int i = 0; i < ${Config.maxLightNumberInShader}; i++) {
      if (i >= lightNumber) {
        break;
      }

      vec4 gotLightDirection = get_lightDirection(0.0, i);
      vec4 gotLightIntensity = get_lightIntensity(0.0, i);
      vec4 gotLightPosition = get_lightPosition(0.0, i);

      vec3 lightDirection = gotLightDirection.xyz;
      vec3 lightIntensity = gotLightIntensity.xyz;
      vec3 lightPosition = gotLightPosition.xyz;
      float spotCosCutoff = gotLightDirection.w;
      float spotExponent = gotLightIntensity.w;
      float lightType = gotLightPosition.w;

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

      vec3 incidentLight = spotEffect * lightIntensity.xyz;
//      incidentLight *= M_PI;

      diffuse += diffuseColor * max(0.0, dot(normal_inWorld, lightDirection)) * incidentLight;

      float cameraSID = u_currentComponentSIDs[${WellKnownComponentTIDs.CameraComponentTID}];
      vec3 viewPosition = get_viewPosition(cameraSID, 0);
      float shininess = get_shininess(materialSID, 0);
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

  rt0 = vec4(shadingColor, alpha);
  //rt0 = vec4(u_lightNumber, 0.0, 0.0, 1.0);


  ${_def_fragColor}
}
`;
  }

  getPixelShaderBody(args: Object) {
    return this.getFragmentShader(args);
  }

  attributeNames: AttributeNames = [
    'a_instanceID',
    'a_texcoord_0', 'a_texcoord_1',
    'a_position', 'a_color', 'a_normal',
    'a_joint', 'a_weight',

  ];
  attributeSemantics: Array<VertexAttributeEnum> = [
    VertexAttribute.Instance,
    VertexAttribute.Texcoord0, VertexAttribute.Texcoord1,
    VertexAttribute.Position, VertexAttribute.Color0, VertexAttribute.Normal,
    VertexAttribute.Joints0, VertexAttribute.Weights0,
  ];

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [
      CompositionType.Scalar,
      CompositionType.Vec2, CompositionType.Vec2,
      CompositionType.Vec3, CompositionType.Vec3, CompositionType.Vec3,
      CompositionType.Vec4, CompositionType.Vec4,
    ];
  }
}
