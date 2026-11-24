var o=`void pbrSheenProps(
  in vec3 sheenColorFactor,
  in vec4 sheenColorTexture,
  in float sheenRoughnessFactor,
  in vec4 sheenRoughnessTexture,
  out SheenProps outSheenProps) {
#ifdef RN_USE_SHEEN
  outSheenProps.sheenColor = sheenColorFactor * sheenColorTexture.rgb;
  outSheenProps.sheenRoughness = clamp(sheenRoughnessFactor * sheenRoughnessTexture.a, 0.000001, 1.0);
#else
  outSheenProps.sheenColor = vec3(0.0);
  outSheenProps.sheenRoughness = 0.000001;
#endif // RN_USE_SHEEN
}
`,s="fragment",r=!0,h={code:o,shaderStage:s,isFragmentShader:r};export{o as code,h as default,r as isFragmentShader,s as shaderStage};
