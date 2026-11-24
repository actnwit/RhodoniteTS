var r=`fn pbrBaseColorProps(vertexColor: vec4<f32>, baseColorFactor: vec4<f32>, baseColorTexture: vec4<f32>, outColor: ptr<function, vec4<f32>>) {
  *outColor = vertexColor * baseColorFactor * baseColorTexture;
}
`,t="fragment",a=!0,l={code:r,shaderStage:t,isFragmentShader:a};export{r as code,l as default,a as isFragmentShader,t as shaderStage};
