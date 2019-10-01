import { VertexAttributeEnum, VertexAttribute } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import Config from "../../foundation/core/Config";
import { ShaderNode } from "../../foundation/definitions/ShaderNode";
import { CompositionTypeEnum } from "../../foundation/main";
import { CompositionType } from "../../foundation/definitions/CompositionType";
import ISingleShader from "./ISingleShader";
import { WellKnownComponentTIDs } from "../../foundation/components/WellKnownComponentTIDs";

export type AttributeNames = Array<string>;

export default class MToonShader extends GLSLShader implements ISingleShader {
  static __instance: MToonShader;
  public static readonly materialElement = ShaderNode.PBRShading;
  private constructor() {
    super();
  }

  static getInstance(): MToonShader {
    if (!this.__instance) {
      this.__instance = new MToonShader();
    }
    return this.__instance;
  }

  getVertexShaderBody(args: any) {
    const _version = this.glsl_versionText;
    const _texture = this.glsl_texture;
    const _in = this.glsl_vertex_in;
    const _out = this.glsl_vertex_out;

    return `${_version}
${this.glslPrecision}

// This shader is based on https://github.com/Santarh/MToon

${(typeof args.definitions !== 'undefined') ? args.definitions : ''}

${_in} float a_instanceID;
${_in} vec2 a_texcoord;
${_in} vec3 a_position;
${_in} vec3 a_normal;
${_in} vec3 a_faceNormal;
${_in} vec3 a_tangent;
${_in} vec4 a_baryCentricCoord;
${_in} vec4 a_joint;
${_in} vec4 a_weight;

${_out} vec2 v_texcoord;
${_out} vec3 v_baryCentricCoord;
${_out} vec3 v_binormal_inWorld; // bitangent_inWorld
${_out} vec3 v_faceNormal_inWorld;
${_out} vec3 v_normal_inView;
${_out} vec3 v_normal_inWorld;
${_out} vec3 v_tangent_inWorld;
${_out} vec4 v_position_inWorld;

${this.prerequisites}

${(typeof args.getters !== 'undefined') ? args.getters : ''}

${(typeof args.matricesGetters !== 'undefined') ? args.matricesGetters : ''}

${this.toNormalMatrix}

${this.getSkinMatrix}

${this.processGeometryWithSkinningOptionally}

void main(){
  #ifdef RN_MTOON_IS_OUTLINE
    #ifdef RN_MTOON_OUTLINE_NONE
      return;
    #endif
  #endif
  ${this.mainPrerequisites}

  mat4 worldMatrix = get_worldMatrix(a_instanceID);
  mat3 normalMatrix = get_normalMatrix(a_instanceID);
  bool isSkinning = false;
  isSkinning = processGeometryWithMorphingAndSkinning(
    skeletalComponentSID,
    worldMatrix,
    normalMatrix,
    normalMatrix,
    a_position,
    v_position_inWorld,
    a_normal,
    v_normal_inWorld
  );

  float cameraSID = u_currentComponentSIDs[${WellKnownComponentTIDs.CameraComponentTID}];
  mat4 viewMatrix = get_viewMatrix(cameraSID, 0);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID, 0);

  v_normal_inView = vec3(viewMatrix * vec4(v_normal_inWorld, 0.0));

  #ifndef RN_MTOON_IS_OUTLINE //ndef
    gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;
  #else
    float outlineTex = ${_texture}(u_outlineWidthTexture, a_texcoord).r;
    #if defined(RN_MTOON_OUTLINE_WIDTH_WORLD)
      float outlineWidth = get_outlineWidth(materialSID, 0);
      vec3 outlineOffset = 0.01 * outlineWidth * outlineTex * a_normal;
      vec4 worldOutlineOffset = worldMatrix * vec4(outlineOffset, 0.0);
      gl_Position = projectionMatrix * viewMatrix * (v_position_inWorld + worldOutlineOffset);

    #elif defined(RN_MTOON_OUTLINE_WIDTH_SCREEN)
      vec4 vertex = projectionMatrix * viewMatrix * v_position_inWorld;

      vec3 clipNormal = (projectionMatrix * vec4(v_normal_inView, 1.0)).xyz;
      vec2 projectedNormal = normalize(clipNormal.xy);
      float outlineScaledMaxDistance = get_outlineScaledMaxDistance(materialSID, 0);
      projectedNormal *= min(vertex.w, outlineScaledMaxDistance);
      float aspect = abs(get_aspect(0.0, 0)); //solo datum
      projectedNormal.x *= aspect;

      float outlineWidth = get_outlineWidth(materialSID, 0);
      vertex.xy += 0.01 * outlineWidth * outlineTex * projectedNormal * clamp(1.0 - abs(v_normal_inView.z), 0.0, 1.0); // ignore offset when normal toward camera

      gl_Position = vertex;
    #else
      gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;
    #endif
  #endif

  if (abs(length(a_normal)) > 0.01) {
    // if normal exist
    vec3 tangent_inWorld;
    if (!isSkinning) {
      tangent_inWorld = normalMatrix * a_tangent;
      v_position_inWorld = worldMatrix * vec4(a_position, 1.0);
    }

    v_binormal_inWorld = cross(v_normal_inWorld, tangent_inWorld);
    v_tangent_inWorld = cross(v_binormal_inWorld, v_normal_inWorld);
  }

  v_texcoord = a_texcoord;

  v_baryCentricCoord = a_baryCentricCoord.xyz;
  v_faceNormal_inWorld = normalMatrix * a_faceNormal;
}`
  }

  getFragmentShader(args: any) {
    const _version = this.glsl_versionText;
    const _in = this.glsl_fragment_in;
    const _def_rt0 = this.glsl_rt0;
    const _def_fragColor = this.glsl_fragColor;
    const _texture = this.glsl_texture;
    const _textureCube = this.glsl_textureCube;

    let accessSpecularIBLTexture: string;
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.webgl1ExtSTL) {
      accessSpecularIBLTexture = `vec4 specularTexel = ${_textureCube}LodEXT(u_specularEnvTexture, vec3(-reflection.x, reflection.y, reflection.z), lod);`;
    } else {
      accessSpecularIBLTexture = `vec4 specularTexel = ${_textureCube}(u_specularEnvTexture, vec3(-reflection.x, reflection.y, reflection.z));`;
    }

    return `${_version}
${this.glsl1ShaderTextureLodExt}
${this.glsl1ShaderDerivativeExt}
${this.glslPrecision}


${(typeof args.definitions !== 'undefined') ? args.definitions : ''}

${this.prerequisites}

const float EPS_COL = 0.00001;

${_in} vec2 v_texcoord;
${_in} vec3 v_baryCentricCoord;
${_in} vec3 v_binormal_inWorld; // bitangent_inWorld
${_in} vec3 v_faceNormal_inWorld;
${_in} vec3 v_normal_inView;
${_in} vec3 v_normal_inWorld;
${_in} vec3 v_tangent_inWorld;
${_in} vec4 v_position_inWorld;
${_def_rt0}

${(typeof args.getters !== 'undefined') ? args.getters : ''}

float edge_ratio(vec3 bary3, float wireframeWidthInner, float wireframeWidthRelativeScale) {
  vec3 d = fwidth(bary3);
  vec3 x = bary3+vec3(1.0 - wireframeWidthInner)*d;
  vec3 a3 = smoothstep(vec3(0.0), d, x);
  float factor = min(min(a3.x, a3.y), a3.z);

  return clamp((1.0 - factor), 0.0, 1.0);
}

vec3 srgbToLinear(vec3 srgbColor) {
  return pow(srgbColor, vec3(2.2));
}

void main (){
  #ifdef RN_MTOON_IS_OUTLINE
    #ifdef RN_MTOON_OUTLINE_NONE
      discard;
    #endif
  #endif
  ${this.mainPrerequisites}


  // TODO
  // uv transform

  // TODO
  // uv animation

  // main color
  vec4 litTextureColor = ${_texture}(u_litColorTexture, v_texcoord);
  vec4 litColorFactor = get_litColor(materialSID, 0);

  // alpha
  float alpha = 1.0;

  #ifdef RN_ALPHATEST_ON
    alpha = litTextureColor.a * litColorFactor.a;
    float cutoff = get_cutoff(materialSID, 0);
    if(alpha < cutoff) discard;
  #elif defined(RN_ALPHABLEND_ON)
    alpha = litTextureColor.a * litColorFactor.a;
  #endif

  if (alpha < 0.01) {
    discard;
  }else{
    rt0.w = alpha;
  }


  #ifdef RN_MTOON_IS_OUTLINE
    #ifdef RN_MTOON_OUTLINE_COLOR_FIXED
      vec3 outlineColor = get_outlineColor(materialSID, 0);
      rt0.xyz = outlineColor;

      rt0.xyz = srgbToLinear(rt0.xyz);
      ${_def_fragColor}
      return;
    #endif
  #endif


  // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);

  #ifdef RN_MTOON_HAS_NORMALMAP
    if (abs(length(v_tangent_inWorld)) > 0.01) {
      vec3 tangent_inWorld = normalize(v_tangent_inWorld);
      vec3 binormal_inWorld = normalize(v_binormal_inWorld);

      mat3 tbnMat_tangent_to_world = mat3(
        tangent_inWorld.x, tangent_inWorld.y, tangent_inWorld.z,
        binormal_inWorld.x, binormal_inWorld.y, binormal_inWorld.z,
        normal_inWorld.x, normal_inWorld.y, normal_inWorld.z
      );

      vec3 normal = ${_texture}(u_normalTexture, v_texcoord).xyz * 2.0 - 1.0;
      float normalScale = get_normalScale(materialSID, 0);
      normal.xy *= normalScale;
      normal_inWorld = normalize(tbnMat_tangent_to_world * normal);
    }
  #endif

  #ifdef RN_MTOON_IS_OUTLINE
    normal_inWorld *= -1.0;
  #endif


  // Lighting, Direct Light

  float shadowAttenuation = 1.0;
  // TODO: shadowmap computation

  float receiveShadowRate = get_receiveShadowRate(materialSID, 0);
  float lightAttenuation = shadowAttenuation * mix(1.0, shadowAttenuation, receiveShadowRate * ${_texture}(u_receiveShadowTexture, v_texcoord).r);

  float shadingGradeRate = get_shadingGradeRate(materialSID, 0);
  float shadingGrade = 1.0 - shadingGradeRate * (1.0 - ${_texture}(u_shadingGradeTexture, v_texcoord).r);
  float lightColorAttenuation = get_lightColorAttenuation(materialSID, 0);

  vec3 shadeColorFactor = get_shadeColor(materialSID, 0);
  vec3 shadeColor = shadeColorFactor * ${_texture}(u_shadeColorTexture, v_texcoord).xyz;
  shadeColor.xyz = srgbToLinear(shadeColor.xyz);

  vec3 litColor = litColorFactor.xyz * litTextureColor.xyz;
  litColor.xyz = srgbToLinear(litColor.xyz);


  float shadeShift = get_shadeShift(materialSID, 0);
  float shadeToony = get_shadeToony(materialSID, 0);

  vec3 lightings[${Config.maxLightNumberInShader}];
  #ifdef RN_MTOON_DEBUG_LITSHADERATE
    float lightIntensities[${Config.maxLightNumberInShader}];
  #endif
  for (int i = 0; i < ${Config.maxLightNumberInShader}; i++) {
    if (i >= lightNumber) {
      break;
    }

    // Rn_Light
    vec4 gotLightDirection = get_lightDirection(0.0, i);
    vec4 gotLightIntensity = get_lightIntensity(0.0, i); //light color
    vec4 gotLightPosition = get_lightPosition(0.0, i);
    vec3 lightDirection = gotLightDirection.xyz;
    vec3 lightColor = gotLightIntensity.xyz;
    vec3 lightPosition = gotLightPosition.xyz;
    float lightType = gotLightPosition.w;
    float spotCosCutoff = gotLightDirection.w;
    float spotExponent = gotLightIntensity.w;

    float distanceAttenuation = 1.0;
    if (lightType > 0.75) { // is pointlight or spotlight
      lightDirection = normalize(lightPosition.xyz - v_position_inWorld.xyz);

      float distance = dot(lightPosition - v_position_inWorld.xyz, lightPosition - v_position_inWorld.xyz);
      distanceAttenuation = 1.0 / pow(distance, 2.0);
    }

    float spotEffect = 1.0;
    if (lightType > 1.75) { // is spotlight
      spotEffect *= dot(gotLightDirection.xyz, lightDirection);
      if (spotEffect > spotCosCutoff) {
        spotEffect *= pow(clamp(spotEffect, 0.0, 1.0), spotExponent);
      } else {
        spotEffect = 0.0;
      }
    }

    // lightAttenuation *= distanceAttenuation * spotEffect;
    float dotNL = dot(lightDirection, normal_inWorld);
    float lightIntensity = dotNL * 0.5 + 0.5; // from [-1, +1] to [0, 1]
    lightIntensity = lightIntensity * lightAttenuation; // TODO: receive shadow
    lightIntensity = lightIntensity * shadingGrade; // darker
    lightIntensity = lightIntensity * 2.0 - 1.0; // from [0, 1] to [-1, +1]

    // tooned. mapping from [minIntensityThreshold, maxIntensityThreshold] to [0, 1]
    float maxIntensityThreshold = mix(1.0, shadeShift, shadeToony);
    float minIntensityThreshold = shadeShift;
    lightIntensity = clamp((lightIntensity - minIntensityThreshold) / max(EPS_COL, (maxIntensityThreshold - minIntensityThreshold)), 0.0, 1.0);
    #ifdef RN_MTOON_DEBUG_LITSHADERATE
      lightIntensities[i] = lightIntensity;
    #endif

    // Albedo color
    vec3 col = mix(shadeColor, litColor, lightIntensity);

    // Direct Light
    vec3 lighting = lightColor;
    lighting = mix(lighting, vec3(max(EPS_COL, max(lighting.x, max(lighting.y, lighting.z)))), lightColorAttenuation); // color atten


    if(i > 0){
      lighting *= 0.5; // darken if additional light.
      lighting *= min(0.0, dotNL) + 1.0; // darken dotNL < 0 area by using half lambert
      // lighting *= shadowAttenuation; // darken if receiving shadow
      #ifdef _ALPHABLEND_ON
        lighting *= step(0, dotNL); // darken if transparent. Because Unity's transparent material can't receive shadowAttenuation.
      #endif
    }

    col *= lighting;
    lightings[i] = lighting;

    rt0.xyz += col;

    lightAttenuation = 1.0;
  }


  // Indirect Light
  vec3 indirectLighting = get_ambientColor(materialSID, 0);
  indirectLighting = srgbToLinear(indirectLighting);
  indirectLighting = mix(indirectLighting, vec3(max(EPS_COL, max(indirectLighting.x, max(indirectLighting.y, indirectLighting.z)))), lightColorAttenuation); // color atten
  // TODO: use ShadeIrad in www.ppsloan.org/publications/StupidSH36.pdf

  rt0.xyz += indirectLighting * litColor;
  rt0.xyz = min(rt0.xyz, litColor); // comment out if you want to PBR absolutely.


  #ifdef RN_MTOON_IS_OUTLINE
    #ifdef RN_MTOON_OUTLINE_COLOR_MIXED
      vec3 outlineColor = get_outlineColor(materialSID, 0);
      outlineColor = srgbToLinear(outlineColor);
      float outlineLightingMix = get_outlineLightingMix(materialSID, 0);
      rt0.xyz = outlineColor * mix(vec3(1.0), rt0.xyz, outlineLightingMix);
    #endif
  #else
    float cameraSID = u_currentComponentSIDs[${WellKnownComponentTIDs.CameraComponentTID}];
    vec3 viewPosition = get_viewPosition(cameraSID, 0);
    vec3 viewDirection = normalize(viewPosition - v_position_inWorld.xyz);

    float rimFresnelPower = get_rimFresnelPower(materialSID, 0);
    float rimLift = get_rimLift(materialSID, 0);
    vec3 rimColorFactor = get_rimColor(materialSID, 0);
    vec3 rimTextureColor = ${_texture}(u_rimTexture, v_texcoord).xyz;
    vec3 rimColor = srgbToLinear(rimColorFactor * rimTextureColor);
    vec3 rim = pow(clamp(1.0 - dot(normal_inWorld, viewDirection) + rimLift, 0.0, 1.0), rimFresnelPower) * rimColor;

    float staticRimLighting = 1.0;
    float rimLightingMix = get_rimLightingMix(materialSID, 0);
    for (int i = 0; i < ${Config.maxLightNumberInShader}; i++) {
      if (i >= lightNumber) break;

      if(i > 0) staticRimLighting = 0.0;

      vec3 rimLighting = mix(vec3(staticRimLighting), lightings[i], vec3(rimLightingMix));
      rt0.xyz += rim * rimLighting;
    }

    // additive matcap
    vec3 cameraUp = get_cameraUp(0.0, 0); //solo datum
    vec3 worldViewUp = normalize(cameraUp - viewDirection * dot(viewDirection, cameraUp));
    vec3 worldViewRight = normalize(cross(viewDirection, worldViewUp));
    vec2 matcapUv = vec2(dot(worldViewRight, normal_inWorld), dot(worldViewUp, normal_inWorld)) * 0.5 + 0.5;
    vec3 matCapColor = srgbToLinear(${_texture}(u_matCapTexture, matcapUv).xyz);
    rt0.xyz += matCapColor;


    // Emission
    vec3 emissionColor = get_emissionColor(materialSID, 0);
    vec3 emission = srgbToLinear(${_texture}(u_emissionTexture, v_texcoord).xyz) * emissionColor;
    rt0.xyz += emission;
  #endif


  // debug
  #ifdef RN_MTOON_DEBUG_NORMAL
    rt0 = vec4(normal_inWorld * 0.5 + 0.5, alpha);

    rt0.xyz = srgbToLinear(rt0.xyz);
    ${_def_fragColor}
    return;
  #elif defined(RN_MTOON_DEBUG_LITSHADERATE)
    rt0 = vec4(0.0);
    for (int i = 0; i < ${Config.maxLightNumberInShader}; i++) {
      if (i >= lightNumber) break;
      rt0 += vec4(lightIntensities[i] * lightings[i], alpha);
    }

    rt0.xyz = srgbToLinear(rt0.xyz);
    ${_def_fragColor}
    return;
  #endif


  // Wireframe
  float threshold = 0.001;
  vec3 wireframe = get_wireframe(materialSID, 0);
  float wireframeWidthInner = wireframe.z;
  float wireframeWidthRelativeScale = 1.0;
  if (wireframe.x > 0.5 && wireframe.y < 0.5) {
    rt0.a = 0.0;
  }
  vec4 wireframeResult = rt0;
  vec4 wireframeColor = vec4(0.2, 0.75, 0.0, 1.0);
  float edgeRatio = edge_ratio(v_baryCentricCoord, wireframeWidthInner, wireframeWidthRelativeScale);
  float edgeRatioModified = mix(step(threshold, edgeRatio), clamp(edgeRatio*4.0, 0.0, 1.0), wireframeWidthInner / wireframeWidthRelativeScale/4.0);
  // if r0.a is 0.0, it is wireframe not on shaded
  wireframeResult.rgb = wireframeColor.rgb * edgeRatioModified + rt0.rgb * (1.0 - edgeRatioModified);
  wireframeResult.a = max(rt0.a, wireframeColor.a * mix(edgeRatioModified, pow(edgeRatioModified, 100.0), wireframeWidthInner / wireframeWidthRelativeScale/1.0));

  if (wireframe.x > 0.5) {
    rt0 = wireframeResult;
    if (wireframe.y < 0.5 && rt0.a == 0.0) {
      discard;
    }
  }

  ${_def_fragColor}
}
`;
  }

  get pixelShaderDefinitions() {
    return '';
  }

  getPixelShaderBody(args: Object) {
    return this.getFragmentShader(args);
  }

  attributeNames: AttributeNames = [
    'a_instanceID',
    'a_texcoord',
    'a_position', 'a_normal', 'a_faceNormal', 'a_tangent',
    'a_baryCentricCoord', 'a_joint', 'a_weight',
  ];
  attributeSemantics: Array<VertexAttributeEnum> = [
    VertexAttribute.Instance,
    VertexAttribute.Texcoord0,
    VertexAttribute.Position, VertexAttribute.Normal, VertexAttribute.FaceNormal, VertexAttribute.Tangent,
    VertexAttribute.BaryCentricCoord, VertexAttribute.Joints0, VertexAttribute.Weights0,
  ];

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [
      CompositionType.Scalar,
      CompositionType.Vec2,
      CompositionType.Vec3, CompositionType.Vec3, CompositionType.Vec3, CompositionType.Vec3,
      CompositionType.Vec4, CompositionType.Vec4, CompositionType.Vec4,
    ];
  }
}

