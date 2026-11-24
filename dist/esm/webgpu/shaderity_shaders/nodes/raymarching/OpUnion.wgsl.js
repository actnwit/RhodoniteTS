var r=`fn opUnion(lhs: f32, rhs: f32, outValue: ptr<function, f32>) {
  *outValue = min(lhs, rhs);
}
`,t="fragment",a=!0,f={code:r,shaderStage:t,isFragmentShader:a};export{r as code,f as default,a as isFragmentShader,t as shaderStage};
