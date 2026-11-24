var n=`fn sdRepeatXY(position: vec3f, interval: f32, outPosition: ptr<function, vec3f>) {
  *outPosition = vec3f((fract(position.xy / interval) - vec2<f32>(0.5)) * interval, position.z);
}
`,i="fragment",o=!0,a={code:n,shaderStage:i,isFragmentShader:o};export{n as code,a as default,o as isFragmentShader,i as shaderStage};
