fn pbrSheenProps(
  sheenColorFactor: vec3<f32>,
  sheenColorTexture: vec4<f32>,
  sheenRoughnessFactor: f32,
  sheenRoughnessTexture: vec4<f32>,
  positionInWorld: vec4<f32>,
  normalInWorld: vec3<f32>,
  outSheenProps: ptr<function, SheenProps>) {


  let cameraSID = uniformDrawParameters.cameraSID;
  let viewPosition = get_viewPosition(cameraSID);
  let viewDirection = normalize(viewPosition - positionInWorld.xyz);

  (*outSheenProps).sheenColor = sheenColorFactor * sheenColorTexture.rgb;
  (*outSheenProps).sheenRoughness = sheenRoughnessFactor * sheenRoughnessTexture.a;
  (*outSheenProps).albedoSheenScalingNdotV = 1.0 - max3((*outSheenProps).sheenColor) * textureSample(sheenLutTexture, sheenLutSampler, vec2(NdotV, (*outSheenProps).sheenRoughness)).r;
}
