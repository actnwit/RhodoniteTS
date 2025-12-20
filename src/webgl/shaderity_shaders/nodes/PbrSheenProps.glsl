void pbrSheenProps(
  in vec3 sheenColorFactor,
  in vec4 sheenColorTexture,
  in float sheenRoughnessFactor,
  in vec4 sheenRoughnessTexture,
  out SheenProps outSheenProps) {

  outSheenProps.sheenColor = sheenColorFactor * sheenColorTexture.rgb;
  outSheenProps.sheenRoughness = clamp(sheenRoughnessFactor * sheenRoughnessTexture.a, 0.000001, 1.0);
}
