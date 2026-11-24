var i=`void pbrEmissiveProps(in vec3 emissiveFactor, in vec4 emissiveTexture, in float emissiveStrength, out EmissiveProps emissiveProps) {
  emissiveProps.emissive = emissiveFactor * emissiveTexture.rgb;
  emissiveProps.emissiveStrength = emissiveStrength;
}
`,r="fragment",t=!0,v={code:i,shaderStage:r,isFragmentShader:t};export{i as code,v as default,t as isFragmentShader,r as shaderStage};
