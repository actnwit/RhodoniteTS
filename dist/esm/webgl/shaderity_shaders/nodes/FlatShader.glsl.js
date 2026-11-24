var r=`void flatShader(in vec4 vertexColor, in vec4 diffuseColorFactor, in vec4 diffuseTextureColor, out vec4 outColor) {
  outColor = vertexColor * diffuseColorFactor * diffuseTextureColor;
}
`,t="fragment",f=!0,u={code:r,shaderStage:t,isFragmentShader:f};export{r as code,u as default,f as isFragmentShader,t as shaderStage};
