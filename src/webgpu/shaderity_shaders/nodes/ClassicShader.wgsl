fn classicShader(vertexColor: vec4<f32>, diffuseColorFactor: vec4<f32>, diffuseTextureColor: vec4<f32>, shadingModel: u32, shininess: f32, outColor: ptr<function, vec4<f32>>) {
  var diffuseColor = vertexColor * diffuseColorFactor * diffuseTextureColor;
  var shadingColor = diffuseColor;
  if (shadingModel > 0) {
    var diffuse = vec3<f32>(0.0, 0.0, 0.0);
    var specular = vec3<f32>(0.0, 0.0, 0.0);
    let lightNumber = u32(get_lightNumber(0u, 0u));
    for (var i = 0u; i < lightNumber ; i++) {
      let light: Light = getLight(i, input.position_inWorld.xyz);

      // Diffuse
      diffuse += diffuseColor * max(0.0, dot(normal_inWorld, light.direction)) * light.attenuatedIntensity;

      let viewPosition = get_viewPosition(cameraSID);

      // Specular
      if (shadingModel == 2) {// BLINN
        // ViewDirection
        let viewDirection = normalize(viewPosition - input.position_inWorld.xyz);
        let halfVector = normalize(light.direction + viewDirection);
        specular += pow(max(0.0, dot(halfVector, normal_inWorld)), shininess);
      } else if (shadingModel == 3) { // PHONG
        let viewDirection = normalize(viewPosition - input.position_inWorld.xyz);
        let R = reflect(light.direction, normal_inWorld);
        specular += pow(max(0.0, dot(R, viewDirection)), shininess);
      }

    }

    shadingColor.rgb = diffuse + specular;
  }

  *outColor = shadingColor;
}
