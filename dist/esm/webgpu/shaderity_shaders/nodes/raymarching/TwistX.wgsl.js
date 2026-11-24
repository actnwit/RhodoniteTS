var o=`fn twistX(position: vec3f, strength: f32, outPosition: ptr<function, vec3f>) {
  let angle = strength * position.x;
  let c = cos(angle);
  let s = sin(angle);
  *outPosition = vec3f(position.x, c * position.y - s * position.z, s * position.y + c * position.z);
}
`,i="fragment",s=!0,e={code:o,shaderStage:i,isFragmentShader:s};export{o as code,e as default,s as isFragmentShader,i as shaderStage};
