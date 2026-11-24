var r=`fn flatShader(vertexColor: vec4<f32>, diffuseColorFactor: vec4<f32>, diffuseTextureColor: vec4<f32>, outColor: ptr<function, vec4<f32>>) {
  *outColor = vertexColor * diffuseColorFactor * diffuseTextureColor;
}
`,f="fragment",t=!0,u={code:r,shaderStage:f,isFragmentShader:t};export{r as code,u as default,t as isFragmentShader,f as shaderStage};
