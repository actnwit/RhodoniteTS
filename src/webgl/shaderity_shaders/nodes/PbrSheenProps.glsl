void pbrSheenProps(
  in vec3 sheenColorFactor,
  in vec4 sheenColorTexture,
  in float sheenRoughnessFactor,
  in vec4 sheenRoughnessTexture,
  out SheenProps outSheenProps) {

  outSheenProps.sheenColor = sheenColorFactor * sheenColorTexture.rgb;
  outSheenProps.sheenRoughness = sheenRoughnessFactor * sheenRoughnessTexture.a;
}
