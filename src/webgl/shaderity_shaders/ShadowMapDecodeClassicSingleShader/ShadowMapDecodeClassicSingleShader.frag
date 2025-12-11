

/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{prerequisites} */

/* shaderity: @{vertexIn} */
in vec4 v_texcoord_light;
in vec4 v_projPosition_from_light;

/* shaderity: @{renderTargetBegin} */

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

/* shaderity: @{opticalDefinition} */

float decodeRGBAToDepth(vec4 RGBA){
  const float rMask = 1.0;
  const float gMask = 1.0 / 255.0;
  const float bMask = 1.0 / (255.0 * 255.0);
  const float aMask = 1.0 / (255.0 * 255.0 * 255.0);
  float depth = dot(RGBA, vec4(rMask, gMask, bMask, aMask));
  return depth;
}

void main (){
  /* shaderity: @{mainPrerequisites} */

  // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);

  // diffuseColor
  vec4 diffuseColor = vec4(1.0, 1.0, 1.0, 1.0);

  vec4 diffuseColorFactor = get_diffuseColorFactor(materialSID, 0u);
  if (v_color != diffuseColor && diffuseColorFactor != diffuseColor) {
    diffuseColor = v_color * diffuseColorFactor;
  } else if (v_color == diffuseColor) {
    diffuseColor = diffuseColorFactor;
  } else if (diffuseColorFactor == diffuseColor) {
    diffuseColor = v_color;
  } else {
    diffuseColor = vec4(1.0, 1.0, 1.0, 1.0);
  }

  // diffuseColorTexture
  vec4 textureColor = texture(u_diffuseColorTexture, v_texcoord_0);
  if (textureColor.r > 0.05) {
    diffuseColor.rgb *= textureColor.rgb;
    diffuseColor.a *= textureColor.a;
  }

  // shadow mapping
  if(v_projPosition_from_light.w > 0.0){
    float zNear = get_zNearInner(materialSID, 0u);
    float zFar = get_zFarInner(materialSID, 0u);
    float normalizationCoefficient = 1.0 / (zFar - zNear);

    vec2 shadowMapUV = v_texcoord_light.xy / v_texcoord_light.w;

    #ifdef RN_IS_DEBUGGING
      bool inShadowMap = (shadowMapUV.x >= 0.0 && shadowMapUV.x <= 1.0) && (shadowMapUV.y >= 0.0 && shadowMapUV.y <= 1.0);
      if(inShadowMap == false){
        rt0 = get_debugColorFactor(materialSID, 0u);

        return;
      }
    #endif

    float measureDepth = normalizationCoefficient * length(v_projPosition_from_light);
    float textureDepth = decodeRGBAToDepth(texture(u_depthTexture, shadowMapUV));
    float allowableDepthError = get_allowableDepthError(materialSID, 0u);

    if(measureDepth > textureDepth + allowableDepthError){
      // case of shadow
      vec4 shadowColorFactor = get_shadowColorFactor(materialSID, 0u);
      diffuseColor = shadowColorFactor;
      diffuseColor.a = shadowColorFactor.a;
    }
  }

  // Lighting
  vec3 shadingColor = vec3(0.0, 0.0, 0.0);
  int shadingModel = get_shadingModel(materialSID, 0u);
  if (shadingModel > 0) {

    vec3 diffuse = vec3(0.0, 0.0, 0.0);
    vec3 specular = vec3(0.0, 0.0, 0.0);
    int lightNumber = get_lightNumber(materialSID, 0u);
    for (int i = 0; i < /* shaderity: @{Config.maxLightNumber} */; i++) {
      if (i >= lightNumber) {
        break;
      }

      // Light
      Light light = getLight(i, v_position_inWorld.xyz);

      diffuse += diffuseColor.rgb * max(0.0, dot(normal_inWorld, light.direction)) * light.attenuatedIntensity;

      vec3 viewPosition = get_viewPosition(cameraSID);
      float shininess = get_shininess(materialSID, 0u);
      if (shadingModel == 2) {// BLINN
        // ViewDirection
        vec3 viewDirection = normalize(viewPosition - v_position_inWorld.xyz);
        vec3 halfVector = normalize(light.direction + viewDirection);
        specular += pow(max(0.0, dot(halfVector, normal_inWorld)), shininess);
      } else if (shadingModel == 3) { // PHONG
        vec3 viewDirection = normalize(viewPosition - v_position_inWorld.xyz);
        vec3 R = reflect(light.direction, normal_inWorld);
        specular += pow(max(0.0, dot(R, viewDirection)), shininess);
      }

    }

    shadingColor = diffuse + specular;
  } else {
    shadingColor = diffuseColor.rgb;
  }

  rt0 = vec4(shadingColor, diffuseColor.a);
  //rt0 = vec4(u_lightNumber, 0.0, 0.0, 1.0);


}
