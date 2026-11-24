var r=`fn pbrTransmissionProps(
  transmissionFactor: f32,
  transmissionTexture: vec4<f32>,
  outTransmission: ptr<function, f32>) {
  (*outTransmission) = transmissionFactor * transmissionTexture.r;
}
`,i="fragment",t=!0,a={code:r,shaderStage:i,isFragmentShader:t};export{r as code,a as default,t as isFragmentShader,i as shaderStage};
