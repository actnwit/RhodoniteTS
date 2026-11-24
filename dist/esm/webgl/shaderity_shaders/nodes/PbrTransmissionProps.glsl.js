var r=`void pbrTransmissionProps(
  in float transmissionFactor,
  in vec4 transmissionTexture,
  out float outTransmission) {
  outTransmission = transmissionFactor * transmissionTexture.r;
}
`,i="fragment",o=!0,t={code:r,shaderStage:i,isFragmentShader:o};export{r as code,t as default,o as isFragmentShader,i as shaderStage};
