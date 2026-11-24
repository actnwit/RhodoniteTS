var t=`fn sdSphere(position: vec3f, radius: f32, outDistance: ptr<function, f32>) {
  *outDistance = length(position) - radius;
}
`,i="fragment",a=!0,r={code:t,shaderStage:i,isFragmentShader:a};export{t as code,r as default,a as isFragmentShader,i as shaderStage};
