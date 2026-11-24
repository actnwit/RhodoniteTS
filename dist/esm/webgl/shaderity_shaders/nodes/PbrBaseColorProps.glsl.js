var r=`void pbrBaseColorProps(in vec4 vertexColor, in vec4 baseColorFactor, in vec4 baseColorTexture, out vec4 outColor) {
  outColor = vertexColor * baseColorFactor * baseColorTexture;
}
`,t="fragment",a=!0,l={code:r,shaderStage:t,isFragmentShader:a};export{r as code,l as default,a as isFragmentShader,t as shaderStage};
