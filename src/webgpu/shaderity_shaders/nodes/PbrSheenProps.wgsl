fn pbrSheenProps(
  sheenColorFactor: vec3<f32>,
  sheenColorTexture: vec4<f32>,
  sheenRoughnessFactor: f32,
  sheenRoughnessTexture: vec4<f32>,
  outSheenProps: ptr<function, SheenProps>) {

  (*outSheenProps).sheenColor = sheenColorFactor * sheenColorTexture.rgb;
  (*outSheenProps).sheenRoughness = sheenRoughnessFactor * sheenRoughnessTexture.a;
}
