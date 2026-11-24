var n=`fn sdTorus(position: vec3f, radius: f32, tubeRadius: f32, outDistance: ptr<function, f32>) {
  let q = vec2f(length(position.xz) - radius, position.y);
  *outDistance = length(q) - tubeRadius;
}
`,i="fragment",s=!0,a={code:n,shaderStage:i,isFragmentShader:s};export{n as code,a as default,s as isFragmentShader,i as shaderStage};
