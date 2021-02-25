#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

#pragma shaderity: require(../common/prerequisites.glsl)

in vec3 v_color;
in vec3 v_normal_inWorld;
in vec4 v_position_inWorld;
in vec2 v_texcoord_0;
in vec4 v_texcoord_1;
in vec4 v_projPosition_from_light;

#pragma shaderity: require(../common/rt0.glsl)

/* shaderity: @{getters} */

float decodeRGBAToDepth(vec4 RGBA){
  const float rMask = 1.0;
  const float gMask = 1.0 / 255.0;
  const float bMask = 1.0 / (255.0 * 255.0);
  const float aMask = 1.0 / (255.0 * 255.0 * 255.0);
  float depth = dot(RGBA, vec4(rMask, gMask, bMask, aMask));
  return depth;
}

void main (){
  #pragma shaderity: require(../common/mainPrerequisites.glsl)

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
  vec4 textureColor = texture(u_diffuseColorTexture, v_texcoord_0);
  if (textureColor.r > 0.05) {
    diffuseColor *= textureColor.rgb;
    alpha *= textureColor.a;
  }

  // shadow mapping
  if(v_projPosition_from_light.w > 0.0){
    float zNear = get_zNearInner(materialSID, 0);
    float zFar = get_zFarInner(materialSID, 0);
    float normalizationCoefficient = 1.0 / (zFar - zNear);

    vec2 shadowMapUV = v_texcoord_1.xy / v_texcoord_1.w;

    #ifdef RN_IS_DEBUGGING
      bool inShadowMap = (shadowMapUV.x >= 0.0 && shadowMapUV.x <= 1.0) && (shadowMapUV.y >= 0.0 && shadowMapUV.y <= 1.0);
      if(inShadowMap == false){
        rt0 = get_debugColorFactor(materialSID, 0);
        #pragma shaderity: require(../common/glFragColor.glsl)
        return;
      }
    #endif

    float measureDepth = normalizationCoefficient * length(v_projPosition_from_light);
    float textureDepth = decodeRGBAToDepth(texture(u_depthTexture, shadowMapUV));
    float allowableDepthError = get_allowableDepthError(materialSID, 0);

    if(measureDepth > textureDepth + allowableDepthError){
      // case of shadow
      vec4 shadowColorCoefficient = get_shadowColorCoefficient(materialSID, 0);
      diffuseColor *= shadowColorCoefficient.rgb;
      alpha *= shadowColorCoefficient.a;
    }
  }

  // Lighting
  vec3 shadingColor = vec3(0.0, 0.0, 0.0);
  int shadingModel = get_shadingModel(materialSID, 0);
  if (shadingModel > 0) {

    vec3 diffuse = vec3(0.0, 0.0, 0.0);
    vec3 specular = vec3(0.0, 0.0, 0.0);
    int lightNumber = get_lightNumber(materialSID, 0);
    for (int i = 0; i < /* shaderity: @{Config.maxLightNumberInShader} */; i++) {
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

      float cameraSID = u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */];
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

  #pragma shaderity: require(../common/glFragColor.glsl)
}
