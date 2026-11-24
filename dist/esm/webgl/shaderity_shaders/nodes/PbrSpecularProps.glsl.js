var o=`void pbrSpecularProps(
  in float specularFactor,
  in vec4 specularTexture,
  in vec3 specularColorFactor,
  in vec4 specularColorTexture,
  out SpecularProps outSpecularProps) {
#ifdef RN_USE_SPECULAR
  outSpecularProps.specularWeight = specularFactor * specularTexture.a;
  outSpecularProps.specularColor = specularColorFactor * specularColorTexture.rgb;
#else
  outSpecularProps.specularWeight = 1.0;
  outSpecularProps.specularColor = vec3(1.0, 1.0, 1.0);
#endif // RN_USE_SPECULAR
}
`,a="fragment",u=!0,c={code:o,shaderStage:a,isFragmentShader:u};export{o as code,c as default,u as isFragmentShader,a as shaderStage};
