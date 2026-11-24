var n=`fn raymarchHitPosition(outPosition: ptr<function, vec4f>) {
  *outPosition = vec4f(g_hitPosition, 1.0);
}
`,o="fragment",e=!0,r={code:n,shaderStage:o,isFragmentShader:e};export{n as code,r as default,e as isFragmentShader,o as shaderStage};
