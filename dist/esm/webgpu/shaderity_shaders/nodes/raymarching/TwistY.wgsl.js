var o=`fn twistY(position: vec3f, strength: f32, outPosition: ptr<function, vec3f>) {
  let angle = strength * position.y;
  let c = cos(angle);
  let s = sin(angle);
  *outPosition = vec3f(c * position.x - s * position.z, position.y, s * position.x + c * position.z);
}
`,i="fragment",s=!0,e={code:o,shaderStage:i,isFragmentShader:s};export{o as code,e as default,s as isFragmentShader,i as shaderStage};
