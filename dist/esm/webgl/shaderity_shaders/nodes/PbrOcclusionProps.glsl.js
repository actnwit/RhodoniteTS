var n=`void pbrOcclusionProps(in vec4 occlusionTexture, in float occlusionStrength, out OcclusionProps outOcclusionProps) {
  outOcclusionProps.occlusionTexture = occlusionTexture;
  outOcclusionProps.occlusionStrength = occlusionStrength;
}
`,u="fragment",s=!0,t={code:n,shaderStage:u,isFragmentShader:s};export{n as code,t as default,s as isFragmentShader,u as shaderStage};
