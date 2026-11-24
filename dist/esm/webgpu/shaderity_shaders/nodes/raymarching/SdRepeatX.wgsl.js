var n=`fn sdRepeatX(position: vec3f, interval: f32, outPosition: ptr<function, vec3f>) {
  *outPosition = vec3f((fract(position.x / interval) - 0.5) * interval, position.y, position.z);
}
`,o="fragment",e=!0,a={code:n,shaderStage:o,isFragmentShader:e};export{n as code,a as default,e as isFragmentShader,o as shaderStage};
