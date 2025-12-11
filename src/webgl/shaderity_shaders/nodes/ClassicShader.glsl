void classicShader(in vec4 vertexColor, in vec4 diffuseColorFactor, in vec4 diffuseTextureColor, uint shadingModel, float shininess, vec4 positionInWorld, vec3 normalInWorld, out vec4 outColor) {
  vec4 diffuseColor = vertexColor * diffuseColorFactor * diffuseTextureColor;
  vec4 shadingColor = diffuseColor;
  if (shadingModel > 0u) {
    vec3 diffuse = vec3(0.0, 0.0, 0.0);
    vec3 specular = vec3(0.0, 0.0, 0.0);
    int lightNumber = 0;
    #ifdef RN_IS_LIGHTING
      lightNumber = get_lightNumber(0u, 0u);
    #endif
    for (int i = 0; i < lightNumber ; i++) {
      // Get Light
      Light light = getLight(i, positionInWorld.xyz);

      // Diffuse
      diffuse += diffuseColor.rgb * max(0.0, dot(normalInWorld, light.direction)) * light.attenuatedIntensity;

      vec3 viewPosition = get_viewPosition(cameraSID);

      // Specular
      if (shadingModel == 2u) {// BLINN
        // ViewDirection
        vec3 viewDirection = normalize(viewPosition - positionInWorld.xyz);
        vec3 halfVector = normalize(light.direction + viewDirection);
        specular += pow(max(0.0, dot(halfVector, normalInWorld)), shininess);
      } else if (shadingModel == 3) { // PHONG
        vec3 viewDirection = normalize(viewPosition - positionInWorld.xyz);
        vec3 R = reflect(light.direction, normalInWorld);
        specular += pow(max(0.0, dot(R, viewDirection)), shininess);
      }

    }

    shadingColor.rgb = diffuse + specular;
  }

  outColor = shadingColor;
}
