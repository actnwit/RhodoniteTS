var i=`fn pbrEmissiveProps(emissiveFactor: vec3<f32>, emissiveTexture: vec4<f32>, emissiveStrength: f32, outEmissiveProps: ptr<function, EmissiveProps>) {
  (*outEmissiveProps).emissive = emissiveFactor * emissiveTexture.rgb;
  (*outEmissiveProps).emissiveStrength = emissiveStrength;
}
`,r="fragment",t=!0,m={code:i,shaderStage:r,isFragmentShader:t};export{i as code,m as default,t as isFragmentShader,r as shaderStage};
