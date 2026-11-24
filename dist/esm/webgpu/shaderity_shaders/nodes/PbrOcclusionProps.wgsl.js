var n=`fn pbrOcclusionProps(occlusionTexture: vec4<f32>, occlusionStrength: f32, outOcclusionProps: ptr<function, OcclusionProps>) {
  (*outOcclusionProps).occlusionTexture = occlusionTexture;
  (*outOcclusionProps).occlusionStrength = occlusionStrength;
}
`,u="fragment",r=!0,s={code:n,shaderStage:u,isFragmentShader:r};export{n as code,s as default,r as isFragmentShader,u as shaderStage};
