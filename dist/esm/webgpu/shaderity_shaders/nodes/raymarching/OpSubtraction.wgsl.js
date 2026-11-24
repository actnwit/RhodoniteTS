var e=`fn opSubtraction(base: f32, subtractor: f32, outValue: ptr<function, f32>) {
  *outValue = max(base, -subtractor);
}
`,r="fragment",n=!0,u={code:e,shaderStage:r,isFragmentShader:n};export{e as code,u as default,n as isFragmentShader,r as shaderStage};
