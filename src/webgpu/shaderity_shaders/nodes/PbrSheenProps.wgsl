fn pbrSheenProps(
  sheenColorFactor: vec3<f32>,
  sheenColorTexture: vec4<f32>,
  sheenRoughnessFactor: f32,
  sheenRoughnessTexture: vec4<f32>,
  outSheenProps: ptr<function, SheenProps>) {

#ifdef RN_USE_SHEEN
  (*outSheenProps).sheenColor = sheenColorFactor * sheenColorTexture.rgb;
  (*outSheenProps).sheenRoughness = clamp(sheenRoughnessFactor * sheenRoughnessTexture.a, 0.000001, 1.0);
#else
  (*outSheenProps).sheenColor = vec3<f32>(0.0);
  (*outSheenProps).sheenRoughness = 0.000001;
#endif // RN_USE_SHEEN
}
