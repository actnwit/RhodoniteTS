var n=`fn sdRepeat(position: vec3f, interval: f32, outPosition: ptr<function, vec3f>) {
  *outPosition = (fract(position / interval) - vec3<f32>(0.5)) * interval;
}
`,i="fragment",o=!0,a={code:n,shaderStage:i,isFragmentShader:o};export{n as code,a as default,o as isFragmentShader,i as shaderStage};
