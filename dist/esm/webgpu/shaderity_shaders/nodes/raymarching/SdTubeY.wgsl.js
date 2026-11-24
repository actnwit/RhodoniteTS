var e=`fn sdTubeY(position: vec3f, width: f32, outDistance: ptr<function, f32>) {
  *outDistance = length(position.xz) - width;
}
`,i="fragment",o=!0,a={code:e,shaderStage:i,isFragmentShader:o};export{e as code,a as default,o as isFragmentShader,i as shaderStage};
