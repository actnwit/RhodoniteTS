var e=`fn sdBarX(position: vec3f, width: f32, outDistance: ptr<function, f32>) {
  *outDistance = length(max(abs(position.yz)-width, vec2f(0.0)));
}
`,a="fragment",i=!0,o={code:e,shaderStage:a,isFragmentShader:i};export{e as code,o as default,i as isFragmentShader,a as shaderStage};
