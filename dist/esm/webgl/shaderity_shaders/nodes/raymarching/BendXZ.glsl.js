var t=`void bendXZ(in vec3 position, in float strength, out vec3 outPosition) {
  float angle = strength * position.x;
  float c = cos(angle);
  float s = sin(angle);
  outPosition = vec3(c * position.x - s * position.z, position.y, s * position.x + c * position.z);
}
`,i="fragment",s=!0,e={code:t,shaderStage:i,isFragmentShader:s};export{t as code,e as default,s as isFragmentShader,i as shaderStage};
