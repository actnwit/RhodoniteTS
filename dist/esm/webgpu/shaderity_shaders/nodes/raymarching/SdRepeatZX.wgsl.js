var n=`fn sdRepeatZX(position: vec3f, interval: f32, outPosition: ptr<function, vec3f>) {
  *outPosition = vec3f((fract(position.x / interval) - 0.5) * interval, position.y, (fract(position.z / interval) - 0.5) * interval);
}
`,e="fragment",o=!0,a={code:n,shaderStage:e,isFragmentShader:o};export{n as code,a as default,o as isFragmentShader,e as shaderStage};
