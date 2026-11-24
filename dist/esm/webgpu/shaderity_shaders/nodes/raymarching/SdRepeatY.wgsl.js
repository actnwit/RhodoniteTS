var n=`fn sdRepeatY(position: vec3f, interval: f32, outPosition: ptr<function, vec3f>) {
  *outPosition = vec3f(position.x, (fract(position.y / interval) - 0.5) * interval, position.z);
}
`,o="fragment",e=!0,a={code:n,shaderStage:o,isFragmentShader:e};export{n as code,a as default,e as isFragmentShader,o as shaderStage};
