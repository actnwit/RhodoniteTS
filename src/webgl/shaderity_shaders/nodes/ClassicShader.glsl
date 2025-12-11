void classicShader(in vec4 vertexColor, in vec4 diffuseColorFactor, in vec4 diffuseTextureColor, uint shadingModel, float shininess, out vec4 outColor) {
  vec4 diffuseColor = vertexColor * diffuseColorFactor * diffuseTextureColor;
  vec4 shadingColor = diffuseColor;
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
      diffuse += diffuseColor.rgb * max(0.0, dot(normal_inWorld, light.direction)) * light.attenuatedIntensity;

      vec3 viewPosition = get_viewPosition(cameraSID);

      // Specular
      if (shadingModel == 2u) {// BLINN
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

    shadingColor.rgb = diffuse + specular;
  }

  outColor = shadingColor;
}
