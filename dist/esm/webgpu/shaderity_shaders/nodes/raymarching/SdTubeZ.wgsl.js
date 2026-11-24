var e=`fn sdTubeZ(position: vec3f, width: f32, outDistance: ptr<function, f32>) {
  *outDistance = length(position.xy) - width;
}
`,i="fragment",o=!0,a={code:e,shaderStage:i,isFragmentShader:o};export{e as code,a as default,o as isFragmentShader,i as shaderStage};
