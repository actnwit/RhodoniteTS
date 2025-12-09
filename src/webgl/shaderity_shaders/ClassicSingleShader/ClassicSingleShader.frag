

/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{vertexIn} */
in vec4 v_shadowCoord;

/* shaderity: @{prerequisites} */

uniform int u_shadingModel; // initialValue=0
uniform float u_alphaCutoff; // initialValue=0.01
uniform float u_shininess; // initialValue=5
uniform vec4 u_diffuseColorFactor; // initialValue=(1,1,1,1)
uniform sampler2D u_diffuseColorTexture; // initialValue=(0,white)
uniform sampler2D u_normalTexture; // initialValue=(1,blue)
uniform vec4 u_diffuseColorTextureTransform; // initialValue=(1,1,0,0)
uniform float u_diffuseColorTextureRotation; // initialValue=0
uniform sampler2DShadow u_depthTexture; // initialValue=(2,white)

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

void main ()
{

/* shaderity: @{mainPrerequisites} */

  // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);

  vec4 diffuseColorFactor = get_diffuseColorFactor(materialSID, 0u);


  // diffuseColor (Considered to be premultiplied alpha)
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

  // diffuseColorTexture (Considered to be premultiplied alpha)
  vec4 diffuseColorTextureTransform = get_diffuseColorTextureTransform(materialSID, 0u);
  float diffuseColorTextureRotation = get_diffuseColorTextureRotation(materialSID, 0u);
  vec2 diffuseColorTexUv = uvTransform(diffuseColorTextureTransform.xy, diffuseColorTextureTransform.zw, diffuseColorTextureRotation, v_texcoord_0);
  vec4 textureColor = texture(u_diffuseColorTexture, diffuseColorTexUv);
  diffuseColor *= textureColor.rgb;
  alpha *= textureColor.a;

/* shaderity: @{alphaProcess} */

  // Lighting
  vec3 shadingColor = vec3(0.0, 0.0, 0.0);
#ifdef RN_IS_LIGHTING
  int shadingModel = get_shadingModel(materialSID, 0u);
  if (shadingModel > 0) {

    vec3 diffuse = vec3(0.0, 0.0, 0.0);
    vec3 specular = vec3(0.0, 0.0, 0.0);
    for (int i = 0; i < /* shaderity: @{Config.maxLightNumber} */ ; i++) {
      if (i >= lightNumber) {
        break;
      }

      // Light
      Light light = getLight(i, v_position_inWorld.xyz);

      // Diffuse
      diffuse += diffuseColor * max(0.0, dot(normal_inWorld, light.direction)) * light.attenuatedIntensity;

      float shininess = get_shininess(materialSID, 0u);
      int shadingModel = get_shadingModel(materialSID, 0u);

      vec3 viewPosition = get_viewPosition(cameraSID);

      // Specular
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
#else
  shadingColor = diffuseColor;
#endif

  // Shadow
#ifdef RN_USE_SHADOW_MAPPING
  float visibility = 1.0;
  float bias = 0.001;

  // Non PCF
  // if ( textureProj( u_depthTexture, v_shadowCoord ).r  < (v_shadowCoord.z - bias) / v_shadowCoord.w ) {
  //   visibility = 0.5;
  // }
  // shadingColor *= visibility;

  // Hardware PCF
  vec4 shadowCoord = v_shadowCoord;
  shadowCoord.z -= bias;
  shadingColor *= textureProj( u_depthTexture, shadowCoord ) * 0.5 + 0.5;

  // shadingColor.rgb = texture( u_depthTexture, v_shadowCoord.xy ).rrr;
  // shadingColor.rgb = vec3(v_shadowCoord.xy, 0.0);
  // shadingColor.rgb = vec3(diffuseColorTexUv, 0.0);
  // shadingColor.rgb = vec3(texture( u_depthTexture, diffuseColorTexUv).rrr);
  // shadingColor.rgb = texture( u_depthTexture, diffuseColorTexUv).rgb;
  // shadingColor.rgb = vec3(textureProj( u_depthTexture, v_shadowCoord ).z, 0.0, 0.0);
  alpha = 1.0;
#endif

  rt0 = vec4(shadingColor * alpha, alpha);
  // rt0 = vec4(u_lightNumber, 0.0, 0.0, 1.0);
  // rt0 = vec4(1.0, 0.0, 0.0, 1.0);
  // rt0 = vec4(normal_inWorld*0.5+0.5, 1.0);



}
