#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: ${definitions} */

#pragma shaderity: require(../common/prerequisites.glsl)

in vec3 v_color;
in vec3 v_normal_inWorld;
in vec4 v_position_inWorld;
in vec2 v_texcoord;
in vec3 v_baryCentricCoord;

// uniform int u_shadingModel; // initialValue=0
// uniform float u_shininess; // initialValue=5
// uniform vec4 u_diffuseColorFactor; // initialValue=(1,1,1,1)
// uniform sampler2D u_diffuseColorTexture; // initialValue=(0,white)
// uniform sampler2D u_normalTexture; // initialValue=(1,blue)

#pragma shaderity: require(../common/rt0.glsl)

/* shaderity: ${getters} */

void main ()
{

#pragma shaderity: require(../common/mainPrerequisites.glsl)

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
  vec4 textureColor = texture2D(u_diffuseColorTexture, v_texcoord);
  diffuseColor *= textureColor.rgb;
  alpha *= textureColor.a;

  // Lighting
  vec3 shadingColor = vec3(0.0, 0.0, 0.0);
#ifdef RN_IS_LIGHTING
  int shadingModel = get_shadingModel(materialSID, 0);
  if (shadingModel > 0) {

    vec3 diffuse = vec3(0.0, 0.0, 0.0);
    vec3 specular = vec3(0.0, 0.0, 0.0);
    for (int i = 0; i < /* shaderity: ${Config.maxLightNumberInShader} */ ; i++) {
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

      float cameraSID = u_currentComponentSIDs[/* shaderity: ${WellKnownComponentTIDs.CameraComponentTID} */];
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

#pragma shaderity: require(../common/glFragColor.glsl)

}
