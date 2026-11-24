var t=`fn sdRoundBox(position: vec3f, size: vec3f, radius: f32, outDistance: ptr<function, f32>) {
  let q = abs(position) - size;
  *outDistance = length(max(q, vec3f(0.0))) - radius;
}
`,i="fragment",s=!0,a={code:t,shaderStage:i,isFragmentShader:s};export{t as code,a as default,s as isFragmentShader,i as shaderStage};
