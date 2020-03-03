#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

#pragma shaderity: require(../common/prerequisites.glsl)

in vec3 v_color;
in vec3 v_normal_inWorld;
in vec3 v_faceNormal_inWorld;
in vec3 v_tangent_inWorld;
in vec3 v_binormal_inWorld;
in vec4 v_position_inWorld;
in vec2 v_texcoord;
in vec3 v_baryCentricCoord;

#pragma shaderity: require(../common/rt0.glsl)

#pragma shaderity: require(./pbrDefinition.glsl)

/* shaderity: @{getters} */

vec3 IBLContribution(float materialSID, vec3 n, float NV, vec3 reflection, vec3 albedo, vec3 F0, float userRoughness, vec3 F)
{
  vec4 iblParameter = get_iblParameter(materialSID, 0);
  float mipCount = iblParameter.x;
  float lod = (userRoughness * mipCount);

  vec4 diffuseTexel = textureCube(u_diffuseEnvTexture, vec3(-n.x, n.y, n.z));
  vec3 diffuseLight;
  diffuseLight = srgbToLinear(diffuseTexel.rgb);

#pragma shaderity: require(./fetchCubeTexture.glsl)

  vec3 specularLight;
  specularLight = srgbToLinear(specularTexel.rgb);

  vec3 kS = fresnelSchlickRoughness(F0, NV, userRoughness);
  vec3 kD = 1.0 - kS;
  vec3 diffuse = diffuseLight * albedo * kD;
  // vec3 brdf = texture2D(u_brdfLutTexture, vec2(1.0 - NV, 1.0 - userRoughness)).rgb;
  // vec3 specular = specularLight * (F0 * brdf.x + brdf.y);
  vec3 specular = specularLight * envBRDFApprox(F0, userRoughness, NV);

  float IBLDiffuseContribution = iblParameter.y;
  float IBLSpecularContribution = iblParameter.z;
  diffuse *= IBLDiffuseContribution;
  specular *= IBLSpecularContribution;
  return diffuse + specular;
}

float edge_ratio(vec3 bary3, float wireframeWidthInner, float wireframeWidthRelativeScale) {
  vec3 d = fwidth(bary3);
  vec3 x = bary3+vec3(1.0 - wireframeWidthInner)*d;
  vec3 a3 = smoothstep(vec3(0.0), d, x);
  float factor = min(min(a3.x, a3.y), a3.z);

  return clamp((1.0 - factor), 0.0, 1.0);
}






void main ()
{

#pragma shaderity: require(../common/mainPrerequisites.glsl)

  // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);
  vec4 iblParameter = get_iblParameter(materialSID, 0);
  float rot = iblParameter.w + 3.1415;
  mat3 rotEnvMatrix = mat3(cos(rot), 0.0, -sin(rot), 0.0, 1.0, 0.0, sin(rot), 0.0, cos(rot));
  vec3 normal_forEnv = rotEnvMatrix * normal_inWorld;

  if (abs(length(v_tangent_inWorld)) > 0.01) {
    vec4 normalTextureTransform = get_normalTextureTransform(materialSID, 0);
    float normalTextureRotation = get_normalTextureRotation(materialSID, 0);
    vec2 normalTexUv = uvTransform(normalTextureTransform.xy, normalTextureTransform.zw, normalTextureRotation, v_texcoord);
    vec3 normal = texture2D(u_normalTexture, normalTexUv).xyz*2.0 - 1.0;
    vec3 tangent_inWorld = normalize(v_tangent_inWorld);
    vec3 binormal_inWorld = normalize(v_binormal_inWorld);
    normal_inWorld = normalize(normal_inWorld);

    mat3 tbnMat_tangent_to_world = mat3(
      tangent_inWorld.x, tangent_inWorld.y, tangent_inWorld.z,
      binormal_inWorld.x, binormal_inWorld.y, binormal_inWorld.z,
      normal_inWorld.x, normal_inWorld.y, normal_inWorld.z
    );

    normal = normalize(tbnMat_tangent_to_world * normal);
    normal_inWorld = normal;
  }



  // BaseColorFactor
  vec3 baseColor = vec3(0.0, 0.0, 0.0);
  float alpha = 1.0;
  vec4 baseColorFactor = get_baseColorFactor(materialSID, 0);
  if (v_color != baseColor && baseColorFactor.rgb != baseColor) {
    baseColor = v_color * baseColorFactor.rgb;
    alpha = baseColorFactor.a;
  } else if (v_color == baseColor) {
    baseColor = baseColorFactor.rgb;
    alpha = baseColorFactor.a;
  } else if (baseColorFactor.rgb == baseColor) {
    baseColor = v_color;
  } else {
    baseColor = vec3(1.0, 1.0, 1.0);
  }


  // BaseColor (take account for BaseColorTexture)
  vec4 baseColorTextureTransform = get_baseColorTextureTransform(materialSID, 0);
  float baseColorTextureRotation = get_baseColorTextureRotation(materialSID, 0);
  vec2 baseColorTexUv = uvTransform(baseColorTextureTransform.xy, baseColorTextureTransform.zw, baseColorTextureRotation, v_texcoord);
vec4 textureColor = texture2D(u_baseColorTexture, baseColorTexUv);
  baseColor *= srgbToLinear(textureColor.rgb);
  alpha *= textureColor.a;

  if (alpha < 0.01) {
    discard;
  }

#ifdef RN_IS_LIGHTING

  // Metallic & Roughness
  vec2 metallicRoughnessFactor = get_metallicRoughnessFactor(materialSID, 0);
  float userRoughness = metallicRoughnessFactor.y;
  float metallic = metallicRoughnessFactor.x;

  vec4 metallicRoughnessTextureTransform = get_metallicRoughnessTextureTransform(materialSID, 0);
  float metallicRoughnessTextureRotation = get_metallicRoughnessTextureRotation(materialSID, 0);
  vec2 metallicRoughnessTexUv = uvTransform(metallicRoughnessTextureTransform.xy, metallicRoughnessTextureTransform.zw, metallicRoughnessTextureRotation, v_texcoord);
  vec4 ormTexel = texture2D(u_metallicRoughnessTexture, metallicRoughnessTexUv);
  userRoughness = ormTexel.g * userRoughness;
  metallic = ormTexel.b * metallic;

  userRoughness = clamp(userRoughness, c_MinRoughness, 1.0);
  metallic = clamp(metallic, 0.0, 1.0);
  float alphaRoughness = userRoughness * userRoughness;

  // F0
  vec3 diffuseMatAverageF0 = vec3(0.04);
  vec3 F0 = mix(diffuseMatAverageF0, baseColor.rgb, metallic);

  // Albedo
  vec3 albedo = baseColor.rgb * (vec3(1.0) - diffuseMatAverageF0);
  albedo.rgb *= (1.0 - metallic);

  // ViewDirection
  float cameraSID = u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */];
  vec3 viewPosition = get_viewPosition(cameraSID, 0);
  vec3 viewDirection = normalize(viewPosition - v_position_inWorld.xyz);

  // NV
  float NV = clamp(abs(dot(normal_inWorld, viewDirection)), 0.0, 1.0);

  rt0 = vec4(0.0, 0.0, 0.0, alpha);

  // Lighting
  vec3 diffuse = vec3(0.0, 0.0, 0.0);
  for (int i = 0; i < /* shaderity: @{Config.maxLightNumberInShader} */; i++) {
    if (i >= lightNumber) {
      break;
    }

    // Light
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
      lightDirection = normalize(lightPosition.xyz - v_position_inWorld.xyz);
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
    //diffuse += 1.0 * max(0.0, dot(normal_inWorld, lightDirection)) * spotEffect * lightIntensity.xyz;

    // IncidentLight
    vec3 incidentLight = spotEffect * lightIntensity.xyz;
    incidentLight *= M_PI;

    // Fresnel
    vec3 halfVector = normalize(lightDirection + viewDirection);
    float VH = clamp(dot(viewDirection, halfVector), 0.0, 1.0);
    vec3 F = fresnel(F0, VH);

    // Diffuse
    vec3 diffuseContrib = (vec3(1.0) - F) * diffuse_brdf(albedo);

    // Specular
    float NL = clamp(dot(normal_inWorld, lightDirection), 0.0, 1.0);
    float NH = clamp(dot(normal_inWorld, halfVector), 0.0, 1.0);
    vec3 specularContrib = cook_torrance_specular_brdf(NH, NL, NV, F, alphaRoughness);
    vec3 diffuseAndSpecular = (diffuseContrib + specularContrib) * vec3(NL) * incidentLight.rgb;

    rt0.xyz += diffuseAndSpecular;
//      rt0.xyz += specularContrib * vec3(NL) * incidentLight.rgb;
//    rt0.xyz += diffuseContrib * vec3(NL) * incidentLight.rgb;
//    rt0.xyz += (vec3(1.0) - F) * diffuse_brdf(albedo);//diffuseContrib;//vec3(NL) * incidentLight.rgb;
  }

  vec3 reflection = rotEnvMatrix * reflect(-viewDirection, normal_inWorld);

  vec3 F = fresnel(F0, NV);
  vec3 ibl = IBLContribution(materialSID, normal_forEnv, NV, reflection, albedo, F0, userRoughness, F);
  float occlusion = texture2D(u_occlusionTexture, v_texcoord).r;

  // Occlution to Indirect Lights
  rt0.xyz += ibl * occlusion;
#else
  rt0 = vec4(baseColor, alpha);
#endif

  // Emissive
  vec3 emissive = srgbToLinear(texture2D(u_emissiveTexture, v_texcoord).xyz);

  rt0.xyz += emissive;


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

#pragma shaderity: require(../common/glFragColor.glsl)
}
