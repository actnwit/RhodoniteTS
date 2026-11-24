var t=`void outUnion(in float value, in float objectId) {
  if (value < g_distance) {
    g_distance = value;
    g_hitObjectId = objectId;
  }
}
`,a="fragment",d=!0,i={code:t,shaderStage:a,isFragmentShader:d};export{t as code,i as default,d as isFragmentShader,a as shaderStage};
