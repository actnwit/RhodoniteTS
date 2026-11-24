var o=`fn pbrSpecularProps(
  specularFactor: f32,
  specularTexture: vec4<f32>,
  specularColorFactor: vec3<f32>,
  specularColorTexture: vec4<f32>,
  outSpecularProps: ptr<function, SpecularProps>) {
#ifdef RN_USE_SPECULAR
  (*outSpecularProps).specularWeight = specularFactor * specularTexture.a;
  (*outSpecularProps).specularColor = specularColorFactor * specularColorTexture.rgb;
#else
  (*outSpecularProps).specularWeight = 1.0;
  (*outSpecularProps).specularColor = vec3f(1.0, 1.0, 1.0);
#endif // RN_USE_SPECULAR
}
`,u="fragment",a=!0,c={code:o,shaderStage:u,isFragmentShader:a};export{o as code,c as default,a as isFragmentShader,u as shaderStage};
