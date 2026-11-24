var l=`fn pbrMetallicRoughnessProps(metallicFactor: f32, roughnessFactor: f32, metallicRoughnessTexture: vec4<f32>, outMetallic: ptr<function, f32>, outRoughness: ptr<function, f32>) {
  var perceptualRoughness = metallicRoughnessTexture.g * roughnessFactor;
  var metallic = metallicRoughnessTexture.b * metallicFactor;
  metallic = clamp(metallic, 0.0, 1.0);
  perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);

  *outMetallic = metallic;
  *outRoughness = perceptualRoughness;
}
`,n="fragment",a=!0,s={code:l,shaderStage:n,isFragmentShader:a};export{l as code,s as default,a as isFragmentShader,n as shaderStage};
