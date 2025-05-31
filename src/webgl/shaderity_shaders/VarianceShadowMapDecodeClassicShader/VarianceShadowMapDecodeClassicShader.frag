

/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{prerequisites} */

/* shaderity: @{vertexIn} */
in vec4 v_texcoord_light;
in vec4 v_projPosition_from_light;

/* shaderity: @{renderTargetBegin} */

/* shaderity: @{getters} */

/* shaderity: @{opticalDefinition} */

float decodeRGBAToDepth(vec4 RGBA){
  const float rMask = 1.0;
  const float gMask = 1.0 / 255.0;
  const float bMask = 1.0 / (255.0 * 255.0);
  const float aMask = 1.0 / (255.0 * 255.0 * 255.0);
  float depth = dot(RGBA, vec4(rMask, gMask, bMask, aMask));
  return depth;
}

float linstep(float min,float max,float v){
  return clamp((v-min)/(max-min),0.0,1.0);
}

float reduceLightBleeding(float p_max, float parameter){
  return linstep(parameter,1.0,p_max);
}

float chebyshevUpperBound(float materialSID){
  float textureDepth = decodeRGBAToDepth(textureProj(u_depthTexture, v_texcoord_light));
  float textureSquareDepth = decodeRGBAToDepth(textureProj(u_squareDepthTexture, v_texcoord_light));
  if(textureDepth == 1.0 || textureSquareDepth == 1.0){
    return 1.0;
  }

  float nonShadowProb = 1.0;

  if(v_projPosition_from_light.w > 0.0){
    float measureDepth;
    bool isPointLight = get_isPointLight(materialSID, 0);
    if(isPointLight){
      float zNear = get_zNearInner(materialSID, 0);
      float zFar = get_zFarInner(materialSID, 0);
      float normalizationCoefficient = 1.0 / (zFar - zNear);
      measureDepth = normalizationCoefficient * length(v_projPosition_from_light);
    }else{
      measureDepth = (v_projPosition_from_light / v_projPosition_from_light.w).z;
    }

    float depthAdjustment = get_depthAdjustment(materialSID, 0);
    measureDepth += depthAdjustment;

    float textureDepthAdjustment = get_textureDepthAdjustment(materialSID, 0);
    textureDepth += textureDepthAdjustment;

    float d = measureDepth - textureDepth;
    if(d < 0.0) return 1.0;

    float variance = textureSquareDepth - textureDepth * textureDepth;
    float minimumVariance = get_minimumVariance(materialSID, 0);
    variance = max(variance, minimumVariance);

    nonShadowProb = variance / (variance + d * d);


    float lightBleedingParameter = get_lightBleedingParameter(materialSID, 0);
    nonShadowProb = reduceLightBleeding(nonShadowProb, lightBleedingParameter);
  }
  return nonShadowProb;
}

void main ()
{
/* shaderity: @{mainPrerequisites} */

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
  vec4 shadowColor = get_shadowColor(materialSID, 0);

  float nonShadowProb = chebyshevUpperBound(materialSID);
  diffuseColor = nonShadowProb * diffuseColor + (1.0 - nonShadowProb) * shadowColor.rgb;
  alpha = nonShadowProb * alpha + (1.0 - nonShadowProb) * shadowColor.a;

  // Lighting
  vec3 shadingColor = vec3(0.0, 0.0, 0.0);

  int shadingModel = get_shadingModel(materialSID, 0);
  if (shadingModel > 0) {
    vec3 diffuse = vec3(0.0, 0.0, 0.0);
    vec3 specular = vec3(0.0, 0.0, 0.0);
    int lightNumber = get_lightNumber(materialSID, 0);
    for (int i = 0; i < /* shaderity: @{Config.maxLightNumber} */ ; i++) {
      if (i >= lightNumber) {
        break;
      }

      // Light
      Light light = getLight(i, v_position_inWorld.xyz);

      diffuse += diffuseColor * max(0.0, dot(normal_inWorld, light.direction)) * light.attenuatedIntensity;

      vec3 viewPosition = get_viewPosition(materialSID, 0);
      float shininess = get_shininess(materialSID, 0);
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
    shadingColor = diffuseColor;
  }

  rt0 = vec4(shadingColor, alpha);

}
