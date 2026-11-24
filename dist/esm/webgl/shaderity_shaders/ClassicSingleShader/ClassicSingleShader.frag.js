var e=`

/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{vertexIn} */

/* shaderity: @{prerequisites} */

uniform int u_shadingModel; // initialValue=0
uniform float u_alphaCutoff; // initialValue=0.01
uniform float u_shininess; // initialValue=5
uniform vec4 u_diffuseColorFactor; // initialValue=(1,1,1,1)
uniform sampler2D u_diffuseColorTexture; // initialValue=(1,white)
uniform sampler2D u_normalTexture; // initialValue=(2,blue)
uniform vec4 u_diffuseColorTextureTransform; // initialValue=(1,1,0,0)
uniform float u_diffuseColorTextureRotation; // initialValue=0

/* shaderity: @{renderTargetBegin} */
// #pragma shaderity: require(../common/deliot2019SeamlessTexture.glsl)
// uniform sampler2D u_tInvTexture; // initialValue=(1,white)
// uniform vec3 u_colorSpaceOrigin;
// uniform vec3 u_colorSpaceVector1;
// uniform vec3 u_colorSpaceVector2;
// uniform vec3 u_colorSpaceVector3;
// uniform vec4 u_scaleTranslate;

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

/* shaderity: @{opticalDefinition} */

/* shaderity: @{shadowDefinition} */

void classicShader(in vec4 vertexColor, in vec4 diffuseColorFactor, in vec4 diffuseTextureColor, in uint shadingModel, in float shininess, in vec4 positionInWorld, in vec3 normalInWorld, out vec4 outColor) {
  vec4 diffuseColor = vertexColor * diffuseColorFactor * diffuseTextureColor;
  vec4 shadingColor = vec4(0.0, 0.0, 0.0, diffuseColor.a);
  if (shadingModel >= 1u && shadingModel <= 3u) {
    uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */]);
    #if defined(WEBGL2_MULTI_VIEW) && defined(RN_IS_VERTEX_SHADER)
      cameraSID += uint(gl_ViewID_OVR);
    #endif

    uint materialSID = uint(u_currentComponentSIDs[0]); // index 0 data is the materialSID

    LightList lightList;
    lightList.count = 0;
    #ifdef RN_IS_LIGHTING
      lightList = getLightList(positionInWorld.xyz, cameraSID);
    #endif

    for (int n = 0; n < lightList.count; n++) {
      ivec2 lightRef = getLightRef(lightList, n);
      int i = lightRef.x; // light component SID
      vec3 specular = vec3(0.0, 0.0, 0.0);
      // Get Light
      Light light = getLight(i, positionInWorld.xyz);
      // A light at the border of the cluster can be outside its range. Its contribution is exactly
      // zero, so skip the shading and the shadow lookup without changing the result.
      if (all(equal(light.attenuatedIntensity, vec3(0.0)))) {
        continue;
      }

      // Diffuse
      vec3 albedo = diffuseColor.rgb / 2.0;
      vec3 specColor = diffuseColor.rgb / 2.0;
      vec3 diffuse = albedo * RECIPROCAL_PI * max(0.0, dot(normalInWorld, light.direction)) * light.attenuatedIntensity;

      vec3 viewPosition = get_viewPosition(cameraSID);

      // Specular
      if (shadingModel == 2u) {// BLINN
        // ViewDirection
        vec3 viewDirection = normalize(viewPosition - positionInWorld.xyz);
        vec3 halfVector = normalize(light.direction + viewDirection);
        float normalizationFactor = (shininess + 2.0) / (2.0 * M_PI);
        specular += specColor * normalizationFactor * pow(max(0.0, dot(halfVector, normalInWorld)), shininess) * light.attenuatedIntensity;
      } else if (shadingModel == 3u) { // PHONG
        vec3 viewDirection = normalize(viewPosition - positionInWorld.xyz);
        vec3 R = reflect(-light.direction, normalInWorld);
        float normalizationFactor = (shininess + 2.0) / (2.0 * M_PI);
        specular += specColor * normalizationFactor * pow(max(0.0, dot(R, viewDirection)), shininess) * light.attenuatedIntensity;
      } else {
        diffuse *= 2.0; // for energy conservation
      }

      #ifdef RN_USE_SHADOW_MAPPING
      int shadowSlot = lightRef.y;
      int depthTextureIndex = shadowSlot >= 0 ? get_depthTextureIndexList(materialSID, uint(shadowSlot)) : -1;
      if (light.type == 1 && depthTextureIndex >= 0) { // Point Light
        float pointLightFarPlane = get_pointLightFarPlane(materialSID, uint(shadowSlot));
        float pointLightShadowMapUvScale = get_pointLightShadowMapUvScale(materialSID, 0u);
        float shadowContribution = varianceShadowContributionParaboloid(positionInWorld.xyz, light.position, pointLightFarPlane, pointLightShadowMapUvScale, depthTextureIndex);
        diffuse *= shadowContribution;
        specular *= shadowContribution;
      } else if ((light.type == 0 || light.type == 2) && depthTextureIndex >= 0) { // Spot Light
        vec4 shadowCoordVec4 = get_depthBiasPV(materialSID, uint(shadowSlot)) * positionInWorld;
        vec2 shadowCoord = shadowCoordVec4.xy / shadowCoordVec4.w;
        float normalizedDepth = shadowCoordVec4.z / shadowCoordVec4.w;

        // Slope-scaled bias in normalized depth space to reduce shadow acne
        float NdotL = max(dot(normalInWorld, light.direction), 0.0);
        float baseBias = 0.001;
        float slopeBias = 0.005 * sqrt(1.0 - NdotL * NdotL) / max(NdotL, 0.05);
        float bias = min(baseBias + slopeBias, 0.05);  // Clamp to prevent excessive bias

        vec3 lightDirection = normalize(get_lightDirection(uint(i)));
        vec3 lightPosToWorldPos = normalize(positionInWorld.xyz - light.position);
        float dotProduct = dot(lightPosToWorldPos, lightDirection);
        float shadowContribution = 1.0;
        if (dotProduct > 0.0 && shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0) {
          shadowContribution = varianceShadowContribution(shadowCoord, normalizedDepth - bias, depthTextureIndex);
        }
        diffuse *= shadowContribution;
        specular *= shadowContribution;
      }
      #endif

      shadingColor.rgb += diffuse + specular;
    }
  } else {
    shadingColor.rgb = diffuseColor.rgb;
  }

  outColor = shadingColor;
}


void main ()
{

/* shaderity: @{mainPrerequisites} */

  // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);

  vec4 diffuseColorFactor = get_diffuseColorFactor(materialSID, 0u);

  // diffuseColorTexture (Considered to be premultiplied alpha)
  vec4 diffuseColorTextureTransform = get_diffuseColorTextureTransform(materialSID, 0u);
  float diffuseColorTextureRotation = get_diffuseColorTextureRotation(materialSID, 0u);
  vec2 diffuseColorTexUv = uvTransform(diffuseColorTextureTransform.xy, diffuseColorTextureTransform.zw, diffuseColorTextureRotation, v_texcoord_0);
  vec4 textureColor = texture(u_diffuseColorTexture, diffuseColorTexUv);

  uint shadingModel = uint(get_shadingModel(materialSID, 0u));
  float shininess = get_shininess(materialSID, 0u);
  vec4 shadingColor = vec4(0.0, 0.0, 0.0, 1.0);
  classicShader(v_color, diffuseColorFactor, textureColor, shadingModel, shininess, v_position_inWorld, normal_inWorld, shadingColor);

  // Alpha Test
  float alpha = shadingColor.a;
  /* shaderity: @{alphaProcess} */
  shadingColor.a = alpha;

  // Pre-multiplied alpha
  rt0 = vec4(shadingColor.rgb * shadingColor.a, shadingColor.a);
}
`,i="fragment",t=!0,r={code:e,shaderStage:i,isFragmentShader:t};export{e as code,r as default,t as isFragmentShader,i as shaderStage};
