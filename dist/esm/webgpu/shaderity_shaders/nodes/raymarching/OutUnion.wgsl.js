var t=`fn outUnion(value: f32, objectId: f32) {
  if (value < g_distance) {
    g_distance = value;
    g_hitObjectId = objectId;
  }
}
`,a="fragment",d=!0,c={code:t,shaderStage:a,isFragmentShader:d};export{t as code,c as default,d as isFragmentShader,a as shaderStage};
