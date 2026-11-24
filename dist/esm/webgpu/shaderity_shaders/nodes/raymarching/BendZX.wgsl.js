var o=`fn bendZX(position: vec3f, strength: f32, outPosition: ptr<function, vec3f>) {
  let angle = strength * position.z;
  let c = cos(angle);
  let s = sin(angle);
  *outPosition = vec3f(s * position.z + c * position.x, position.y, c * position.z - s * position.x);
}
`,i="fragment",e=!0,s={code:o,shaderStage:i,isFragmentShader:e};export{o as code,s as default,e as isFragmentShader,i as shaderStage};
