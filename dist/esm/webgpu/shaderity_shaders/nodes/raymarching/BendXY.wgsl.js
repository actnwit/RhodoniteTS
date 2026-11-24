var o=`fn bendXY(position: vec3f, strength: f32, outPosition: ptr<function, vec3f>) {
  let angle = strength * position.x;
  let c = cos(angle);
  let s = sin(angle);
  *outPosition = vec3f(c * position.x - s * position.y, s * position.x + c * position.y, position.z);
}
`,i="fragment",e=!0,s={code:o,shaderStage:i,isFragmentShader:e};export{o as code,s as default,e as isFragmentShader,i as shaderStage};
